from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from app.schemas.catalog import Bundle, Equipment, LaborRate
from app.settings import settings

'''
This module contains functions to load and cache the labor rates and equipment data from JSON files.
'''


def _load_json_array(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8") as file:
        payload = json.load(file)
    if not isinstance(payload, list):
        raise ValueError(f"Expected JSON array in {path}")
    return payload


@lru_cache
def load_labor_rates() -> list[LaborRate]:
    raw = _load_json_array(settings.data_dir / "labor_rates.json")
    return [LaborRate.model_validate(item) for item in raw]


@lru_cache
def load_equipment() -> list[Equipment]:
    raw = _load_json_array(settings.data_dir / "equipment.json")

    normalized: list[dict] = []
    for item in raw:
        if "baseCost" not in item and "base_cost" in item:
            item = {**item, "baseCost": item["base_cost"]}
        normalized.append(item)

    return [Equipment.model_validate(item) for item in normalized]


@lru_cache
def load_bundles() -> list[Bundle]:
    bundles_path = settings.data_dir / "bundles.json"
    if not bundles_path.exists():
        return []

    raw = _load_json_array(bundles_path)
    return [Bundle.model_validate(item) for item in raw]
