from __future__ import annotations

import html

from app.schemas.estimate import EstimateRead

try:
    from weasyprint import HTML
except Exception:  # pragma: no cover
    HTML = None

'''
This module contains the logic for rendering an EstimateRead as a PDF using WeasyPrint.
'''

def _money(value: float | None) -> str:
    if value is None:
        return "$0.00"
    return f"${value:,.2f}"


def _estimate_to_html(estimate: EstimateRead) -> str:
    labor_row = ""
    if estimate.labor:
        labor_row = (
            f"<tr><td>Labor</td><td>{html.escape(estimate.labor.jobType or '')}"
            f" / {html.escape(estimate.labor.level or '')}</td>"
            f"<td>{estimate.labor.hoursChosen or 0}</td>"
            f"<td>{_money(estimate.labor.hourlyRate)}</td>"
            f"<td>{_money(estimate.labor.laborTotal)}</td></tr>"
        )

    equipment_rows = "".join(
        (
            f"<tr><td>Equipment</td><td>{html.escape(line.equipmentId or line.freeText or '')}</td>"
            f"<td>{line.qty}</td><td>{_money(line.unitPrice)}</td><td>{_money(line.lineTotal)}</td></tr>"
        )
        for line in estimate.equipmentLines
    )

    adjustment_rows = "".join(
        (
            f"<tr><td>Adjustment</td><td>{html.escape(adj.code)}</td><td>1</td>"
            f"<td>-</td><td>{_money(adj.amount)}</td></tr>"
        )
        for adj in estimate.adjustments
    )

    totals = estimate.totals
    labor_total = totals.laborTotal if totals else 0.0
    equipment_total = totals.equipmentTotal if totals else 0.0
    adjustments_total = totals.adjustmentsTotal if totals else 0.0
    grand_total = totals.grandTotal if totals else 0.0

    notes = html.escape(estimate.specialNotes or "")

    return f"""
<!doctype html>
<html>
  <head>
    <meta charset=\"utf-8\" />
    <style>
      body {{ font-family: Arial, sans-serif; padding: 24px; color: #1f2937; }}
      h1 {{ margin-bottom: 8px; }}
      .meta {{ margin-bottom: 18px; color: #4b5563; font-size: 14px; }}
      table {{ width: 100%; border-collapse: collapse; margin-top: 12px; }}
      th, td {{ border: 1px solid #d1d5db; padding: 8px; font-size: 13px; }}
      th {{ background: #f3f4f6; text-align: left; }}
      .totals {{ margin-top: 16px; width: 320px; margin-left: auto; }}
      .totals div {{ display: flex; justify-content: space-between; margin: 4px 0; }}
      .grand {{ font-weight: 700; border-top: 1px solid #9ca3af; padding-top: 6px; }}
      .notes {{ margin-top: 20px; white-space: pre-wrap; }}
    </style>
  </head>
  <body>
    <h1>HVAC Estimate</h1>
    <div class=\"meta\">Estimate ID: {html.escape(estimate.id)}<br/>Status: {html.escape(estimate.status)}</div>

    <table>
      <thead>
        <tr><th>Type</th><th>Description</th><th>Qty/Hrs</th><th>Unit</th><th>Total</th></tr>
      </thead>
      <tbody>
        {labor_row}
        {equipment_rows}
        {adjustment_rows}
      </tbody>
    </table>

    <div class=\"totals\">
      <div><span>Labor</span><span>{_money(labor_total)}</span></div>
      <div><span>Equipment</span><span>{_money(equipment_total)}</span></div>
      <div><span>Adjustments</span><span>{_money(adjustments_total)}</span></div>
      <div class=\"grand\"><span>Grand Total</span><span>{_money(grand_total)}</span></div>
    </div>

    <div class=\"notes\"><strong>Special Notes:</strong><br/>{notes}</div>
  </body>
</html>
"""


def render_estimate_pdf(estimate: EstimateRead) -> bytes:
    if HTML is None:
        raise RuntimeError("WeasyPrint is not installed")

    html_content = _estimate_to_html(estimate)
    return HTML(string=html_content).write_pdf()
