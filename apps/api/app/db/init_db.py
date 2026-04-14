from __future__ import annotations

from app.db.session import get_connection


def init_db() -> None:
    conn = get_connection()
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS customers (
                id TEXT PRIMARY KEY,
                name TEXT,
                address TEXT,
                phone TEXT,
                property_type TEXT,
                square_footage INTEGER,
                system_type TEXT,
                system_age INTEGER,
                last_service_date TEXT
            )
            """
        )

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS jobs (
                id TEXT PRIMARY KEY,
                customer_id TEXT NOT NULL,
                address TEXT,
                scheduled_date TEXT,
                status TEXT NOT NULL,
                special_notes TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY(customer_id) REFERENCES customers(id)
            )
            """
        )

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

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_jobs_customer_id ON jobs(customer_id)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_estimates_job_id ON estimates(job_id)"
        )
        conn.commit()
    finally:
        conn.close()
