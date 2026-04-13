from __future__ import annotations

from app.db.session import get_connection


def init_db() -> None:
    conn = get_connection()
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS estimates (
                id TEXT PRIMARY KEY,
                job_id TEXT NOT NULL,
                customer_id TEXT NOT NULL,
                status TEXT NOT NULL,
                version INTEGER NOT NULL,
                labor_json TEXT,
                equipment_lines_json TEXT NOT NULL,
                adjustments_json TEXT NOT NULL,
                special_notes TEXT,
                totals_json TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        conn.commit()
    finally:
        conn.close()
