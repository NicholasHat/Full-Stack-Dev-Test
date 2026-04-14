from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

from app.db.session import get_connection
from app.schemas.job import JobCreate, JobRead, JobUpdate

'''
This module contains functions for interacting with the jobs table in the database.
'''

def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


def _row_to_job(row) -> JobRead:
    return JobRead.model_validate(
        {
            "id": row["id"],
            "customerId": row["customer_id"],
            "address": row["address"],
            "scheduledDate": row["scheduled_date"],
            "status": row["status"],
            "specialNotes": row["special_notes"],
            "createdAt": row["created_at"],
            "updatedAt": row["updated_at"],
        }
    )


def create_job(payload: JobCreate) -> JobRead:
    job_id = f"JOB-{uuid4().hex[:10].upper()}"
    now = _now_iso()

    conn = get_connection()
    try:
        conn.execute(
            """
            INSERT INTO jobs (
                id, customer_id, address, scheduled_date,
                status, special_notes, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                job_id,
                payload.customerId,
                payload.address,
                payload.scheduledDate.isoformat() if payload.scheduledDate else None,
                payload.status or "draft",
                payload.specialNotes,
                now,
                now,
            ),
        )
        conn.commit()
    finally:
        conn.close()

    created = get_job(job_id)
    assert created is not None
    return created


def get_job(job_id: str) -> JobRead | None:
    conn = get_connection()
    try:
        row = conn.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
    finally:
        conn.close()

    if row is None:
        return None
    return _row_to_job(row)


def list_jobs(customer_id: str | None = None) -> list[JobRead]:
    conn = get_connection()
    try:
        if customer_id:
            rows = conn.execute(
                "SELECT * FROM jobs WHERE customer_id = ? ORDER BY updated_at DESC",
                (customer_id,),
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM jobs ORDER BY updated_at DESC").fetchall()
    finally:
        conn.close()

    return [_row_to_job(row) for row in rows]


def update_job(job_id: str, patch: JobUpdate) -> JobRead | None:
    current = get_job(job_id)
    if current is None:
        return None

    merged = current.model_dump(mode="json")
    merged.update(patch.model_dump(exclude_unset=True, mode="json"))
    merged["updatedAt"] = _now_iso()

    conn = get_connection()
    try:
        conn.execute(
            """
            UPDATE jobs
            SET customer_id = ?,
                address = ?,
                scheduled_date = ?,
                status = ?,
                special_notes = ?,
                updated_at = ?
            WHERE id = ?
            """,
            (
                merged.get("customerId"),
                merged.get("address"),
                merged.get("scheduledDate"),
                merged.get("status") or "draft",
                merged.get("specialNotes"),
                merged.get("updatedAt"),
                job_id,
            ),
        )
        conn.commit()
    finally:
        conn.close()

    return get_job(job_id)
