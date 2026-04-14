from __future__ import annotations

import json

from app.db.session import get_connection
from app.schemas.customer import CustomerCreate
from app.services.customer_repository import create_customer
from app.settings import settings

'''
This module contains functions for admin tasks, such as resetting the demo data. The reset_demo_data function clears the jobs and estimates tables, and then seeds the customers table with data from a JSON file if it exists. It returns a summary of the actions taken, including how many customers were seeded and how many jobs and estimates were cleared.
'''

def reset_demo_data() -> dict[str, int]:
    conn = get_connection()
    try:
        estimates_deleted = conn.execute("DELETE FROM estimates").rowcount
        jobs_deleted = conn.execute("DELETE FROM jobs").rowcount
        conn.execute("DELETE FROM customers")
        conn.commit()
    finally:
        conn.close()

    seeded_customers = 0

    customers_path = settings.data_dir / "customers.json"
    if customers_path.exists():
        with customers_path.open("r", encoding="utf-8") as file:
            payload = json.load(file)

        if isinstance(payload, list):
            for item in payload:
                customer = CustomerCreate.model_validate(item)
                create_customer(customer)
                seeded_customers += 1

    return {
        "customersSeeded": seeded_customers,
        "jobsCleared": jobs_deleted,
        "estimatesCleared": estimates_deleted,
    }
