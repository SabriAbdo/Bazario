"""Schemathesis contract tests for the Bazario API.

Fetches the live OpenAPI schema exposed by springdoc (/v3/api-docs) and
property-tests every documented endpoint: request/response schema
conformance, status codes declared in the spec, and absence of 5xx errors.

Requires the Spring Boot backend to be running (e.g. `mvn spring-boot:run`).
Run against a dev/test database only — the fuzzer performs real writes
(create/update/delete) through the authenticated endpoints.

Usage:
    pip install -r requirements.txt
    pytest test_api_schema.py -v

Environment variables (all optional, defaults target local dev):
    BAZARIO_API_BASE_URL   e.g. http://localhost:8081
    BAZARIO_ADMIN_USERNAME e.g. admin
    BAZARIO_ADMIN_PASSWORD e.g. Admin@123
"""
import os

import pytest
import requests
import schemathesis

BASE_URL = os.environ.get("BAZARIO_API_BASE_URL", "http://localhost:8081")
ADMIN_USERNAME = os.environ.get("BAZARIO_ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("BAZARIO_ADMIN_PASSWORD", "Admin@123")

schema = schemathesis.from_uri(f"{BASE_URL}/v3/api-docs", base_url=BASE_URL)
# Fuzzing these would ban/delete/demote the very admin account used to authenticate,
# locking the whole test session out. Exercise them separately with a disposable user.
schema = schema.exclude(path_regex=r"^/api/v1/admin/users/\{id\}")


@pytest.fixture(scope="session")
def auth_headers() -> dict:
    # ADMIN has access to (almost) every endpoint, so a single token covers the full schema
    resp = requests.post(
        f"{BASE_URL}/api/v1/auth/login",
        json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
        timeout=10,
    )
    resp.raise_for_status()
    token = resp.json()["accessToken"]
    return {"Authorization": f"Bearer {token}"}


@schema.parametrize()
def test_api_contract(case, auth_headers):
    case.call_and_validate(headers=auth_headers)
