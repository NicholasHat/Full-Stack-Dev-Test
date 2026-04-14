from __future__ import annotations

import json
from datetime import UTC, datetime
from uuid import uuid4

from app.db.session import get_connection
from app.schemas.estimate import EstimateCreate, EstimateRead, EstimateUpdate

'''
This module contains functions for interacting with the estimates table in the database.
'''

def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


def _serialize(value: object | None) -> str | None:
    if value is None:
        return None
    return json.dumps(value)


def _parse(value: str | None, default: object) -> object:
    if value is None:
        return default
    return json.loads(value)


def _row_to_estimate(row) -> EstimateRead:
    return EstimateRead.model_validate(
        {
            "id": row["id"],
            "jobId": row["job_id"],
            "customerId": row["customer_id"],
            "status": row["status"],
            "version": row["version"],
            "labor": _parse(row["labor_json"], None),
            "equipmentLines": _parse(row["equipment_lines_json"], []),
            "adjustments": _parse(row["adjustments_json"], []),
            "specialNotes": row["special_notes"],
            "totals": _parse(row["totals_json"], None),
            "createdAt": row["created_at"],
            "updatedAt": row["updated_at"],
        }
    )


def create_estimate(payload: EstimateCreate) -> EstimateRead:
    estimate_id = f"EST-{uuid4().hex[:10].upper()}"
    now = _now_iso()
    conn = get_connection()
    try:
        conn.execute(
            """
            INSERT INTO estimates (
                id, job_id, customer_id, status, version,
                labor_json, equipment_lines_json, adjustments_json,
                special_notes, totals_json, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                estimate_id,
                payload.jobId,
                payload.customerId,
                payload.status,
                payload.version,
                _serialize(payload.labor.model_dump(mode="json") if payload.labor else None),
                _serialize([line.model_dump(mode="json") for line in payload.equipmentLines]) or "[]",
                _serialize([adj.model_dump(mode="json") for adj in payload.adjustments]) or "[]",
                payload.specialNotes,
                _serialize(payload.totals.model_dump(mode="json") if payload.totals else None),
                now,
                now,
            ),
        )
        conn.commit()
    finally:
        conn.close()

    created = get_estimate(estimate_id)
    assert created is not None
    return created


def get_estimate(estimate_id: str) -> EstimateRead | None:
    conn = get_connection()
    try:
        row = conn.execute("SELECT * FROM estimates WHERE id = ?", (estimate_id,)).fetchone()
    finally:
        conn.close()

    if row is None:
        return None
    return _row_to_estimate(row)


def list_estimates(job_id: str | None = None) -> list[EstimateRead]:
    conn = get_connection()
    try:
        if job_id:
            rows = conn.execute(
                "SELECT * FROM estimates WHERE job_id = ? ORDER BY updated_at DESC", (job_id,)
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM estimates ORDER BY updated_at DESC").fetchall()
    finally:
        conn.close()

    return [_row_to_estimate(row) for row in rows]


def update_estimate(estimate_id: str, patch: EstimateUpdate) -> EstimateRead | None:
    current = get_estimate(estimate_id)
    if current is None:
        return None

    merged = current.model_dump(mode="json")
    patch_data = patch.model_dump(exclude_unset=True, mode="json")
    merged.update(patch_data)
    merged["updatedAt"] = _now_iso()

    conn = get_connection()
    try:
        conn.execute(
            """
            UPDATE estimates
            SET status = ?,
                version = ?,
                labor_json = ?,
                equipment_lines_json = ?,
                adjustments_json = ?,
                special_notes = ?,
                totals_json = ?,
                updated_at = ?
            WHERE id = ?
            """,
            (
                merged["status"],
                merged["version"],
                _serialize(merged.get("labor")),
                _serialize(merged.get("equipmentLines", [])) or "[]",
                _serialize(merged.get("adjustments", [])) or "[]",
                merged.get("specialNotes"),
                _serialize(merged.get("totals")),
                merged["updatedAt"],
                estimate_id,
            ),
        )
        conn.commit()
    finally:
        conn.close()

    return get_estimate(estimate_id)
