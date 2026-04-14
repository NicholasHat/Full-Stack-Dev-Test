from __future__ import annotations

from uuid import uuid4

from app.db.session import get_connection
from app.schemas.customer import CustomerCreate, CustomerRead, CustomerUpdate

'''
This module contains functions for interacting with the customers table in the database.
'''

def _row_to_customer(row) -> CustomerRead:
    return CustomerRead.model_validate(
        {
            "id": row["id"],
            "name": row["name"],
            "address": row["address"],
            "phone": row["phone"],
            "propertyType": row["property_type"],
            "squareFootage": row["square_footage"],
            "systemType": row["system_type"],
            "systemAge": row["system_age"],
            "lastServiceDate": row["last_service_date"],
        }
    )


def create_customer(payload: CustomerCreate) -> CustomerRead:
    customer_id = payload.id or f"CUST-{uuid4().hex[:8].upper()}"

    conn = get_connection()
    try:
        conn.execute(
            """
            INSERT INTO customers (
                id, name, address, phone, property_type,
                square_footage, system_type, system_age, last_service_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                customer_id,
                payload.name,
                payload.address,
                payload.phone,
                payload.propertyType,
                payload.squareFootage,
                payload.systemType,
                payload.systemAge,
                payload.lastServiceDate.isoformat() if payload.lastServiceDate else None,
            ),
        )
        conn.commit()
    finally:
        conn.close()

    created = get_customer(customer_id)
    assert created is not None
    return created


def get_customer(customer_id: str) -> CustomerRead | None:
    conn = get_connection()
    try:
        row = conn.execute("SELECT * FROM customers WHERE id = ?", (customer_id,)).fetchone()
    finally:
        conn.close()

    if row is None:
        return None
    return _row_to_customer(row)


def list_customers(query: str | None = None) -> list[CustomerRead]:
    conn = get_connection()
    try:
        if query:
            like = f"%{query}%"
            rows = conn.execute(
                """
                SELECT * FROM customers
                WHERE name LIKE ? OR address LIKE ? OR phone LIKE ?
                ORDER BY name ASC
                """,
                (like, like, like),
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM customers ORDER BY name ASC").fetchall()
    finally:
        conn.close()

    return [_row_to_customer(row) for row in rows]


def update_customer(customer_id: str, patch: CustomerUpdate) -> CustomerRead | None:
    current = get_customer(customer_id)
    if current is None:
        return None

    merged = current.model_dump(mode="json")
    merged.update(patch.model_dump(exclude_unset=True, mode="json"))

    conn = get_connection()
    try:
        conn.execute(
            """
            UPDATE customers
            SET name = ?,
                address = ?,
                phone = ?,
                property_type = ?,
                square_footage = ?,
                system_type = ?,
                system_age = ?,
                last_service_date = ?
            WHERE id = ?
            """,
            (
                merged.get("name"),
                merged.get("address"),
                merged.get("phone"),
                merged.get("propertyType"),
                merged.get("squareFootage"),
                merged.get("systemType"),
                merged.get("systemAge"),
                merged.get("lastServiceDate"),
                customer_id,
            ),
        )
        conn.commit()
    finally:
        conn.close()

    return get_customer(customer_id)
