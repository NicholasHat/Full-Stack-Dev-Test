from __future__ import annotations

from app.schemas.estimate import (
    EstimateAdjustment,
    EstimateEquipmentLine,
    EstimateLabor,
    EstimateRead,
    EstimateRepriceResponse,
    EstimateTotals,
)
from app.services.catalog_loader import load_equipment, load_labor_rates
from app.settings import settings

'''
This module contains the pricing logic for estimating HVAC jobs using the provided JSON data.
'''

ADJUSTMENT_AMOUNTS: dict[str, float] = {
    "after_hours": 125.0,
    "emergency_dispatch": 175.0,
    "permit_fee": 95.0,
    "loyalty_discount": -50.0,
}


def _round_to_quarter(value: float) -> float:
    return round(value * 4) / 4


def _round_money(value: float) -> float:
    return round(value, 2)


def _find_rate(job_type: str | None, level: str | None):
    if not job_type or not level:
        return None
    for rate in load_labor_rates():
        if rate.jobType == job_type and rate.level == level:
            return rate
    return None


def _pricing_labor(labor: EstimateLabor | None) -> EstimateLabor | None:
    if labor is None:
        return None

    selected_rate = _find_rate(labor.jobType, labor.level)

    hours_chosen = labor.hoursChosen
    if hours_chosen is None and selected_rate is not None:
        midpoint = (selected_rate.estimatedHours.min + selected_rate.estimatedHours.max) / 2
        hours_chosen = _round_to_quarter(midpoint)

    hourly_rate = labor.hourlyRate
    if hourly_rate is None and selected_rate is not None:
        hourly_rate = selected_rate.hourlyRate

    labor_total = None
    if hourly_rate is not None and hours_chosen is not None:
        labor_total = _round_money(hourly_rate * hours_chosen)

    return EstimateLabor(
        jobType=labor.jobType,
        level=labor.level,
        hoursChosen=hours_chosen,
        hourlyRate=hourly_rate,
        laborTotal=labor_total,
    )


def _equipment_lookup() -> dict[str, float]:
    return {item.id: item.baseCost for item in load_equipment()}


def _pricing_equipment(lines: list[EstimateEquipmentLine]) -> list[EstimateEquipmentLine]:
    lookup = _equipment_lookup()
    repriced: list[EstimateEquipmentLine] = []

    for line in lines:
        unit_price = line.unitPrice

        if line.equipmentId and line.equipmentId in lookup:
            unit_price = _round_money(lookup[line.equipmentId] * settings.markup_multiplier)
        elif unit_price is None:
            unit_price = 0.0

        line_total = _round_money(unit_price * line.qty)

        repriced.append(
            EstimateEquipmentLine(
                equipmentId=line.equipmentId,
                freeText=line.freeText,
                qty=line.qty,
                unitPrice=unit_price,
                lineTotal=line_total,
            )
        )

    return repriced


def _pricing_adjustments(adjustments: list[EstimateAdjustment]) -> list[EstimateAdjustment]:
    repriced: list[EstimateAdjustment] = []
    for adjustment in adjustments:
        amount = adjustment.amount
        if amount is None:
            amount = ADJUSTMENT_AMOUNTS.get(adjustment.code, 0.0)
        repriced.append(
            EstimateAdjustment(code=adjustment.code, amount=_round_money(amount), note=adjustment.note)
        )
    return repriced


def reprice_estimate(estimate: EstimateRead) -> EstimateRepriceResponse:
    labor = _pricing_labor(estimate.labor)
    equipment_lines = _pricing_equipment(estimate.equipmentLines)
    adjustments = _pricing_adjustments(estimate.adjustments)

    labor_total = labor.laborTotal if labor and labor.laborTotal is not None else 0.0
    equipment_total = _round_money(sum(line.lineTotal or 0.0 for line in equipment_lines))
    adjustments_total = _round_money(sum(adj.amount or 0.0 for adj in adjustments))
    grand_total = _round_money(labor_total + equipment_total + adjustments_total)

    totals = EstimateTotals(
        laborTotal=_round_money(labor_total),
        equipmentTotal=equipment_total,
        adjustmentsTotal=adjustments_total,
        grandTotal=grand_total,
    )

    return EstimateRepriceResponse(
        id=estimate.id,
        labor=labor,
        equipmentLines=equipment_lines,
        adjustments=adjustments,
        totals=totals,
    )
