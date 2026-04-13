from __future__ import annotations

import sqlite3
from pathlib import Path

DB_FILE = Path(__file__).resolve().parents[2] / "demo.db"


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn
