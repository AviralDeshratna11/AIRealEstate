from __future__ import annotations

from fastapi.testclient import TestClient

from app.db import session
from app.config import get_settings
from app.main import app


def client_with_mock_auth() -> TestClient:
    settings = get_settings()
    settings.auth_mock_mode = True
    settings.supabase_jwt_secret = None
    settings.database_url = None
    session._pool = None
    return TestClient(app)


def test_missing_token_returns_401():
    client = client_with_mock_auth()
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_mock_auth_me_returns_profile():
    client = client_with_mock_auth()
    response = client.get("/api/auth/me", headers={"Authorization": "Bearer mock:buyer:buyer@astra.local"})
    assert response.status_code == 200
    body = response.json()
    assert body["email"] == "buyer@astra.local"
    assert body["role"] == "buyer"
    assert body["onboarding_completed"] is True


def test_buyer_cannot_access_manager_api():
    client = client_with_mock_auth()
    response = client.get("/api/manager/dashboard", headers={"Authorization": "Bearer mock:buyer:buyer@astra.local"})
    assert response.status_code == 403


def test_manager_can_access_manager_api():
    client = client_with_mock_auth()
    response = client.get("/api/manager/dashboard", headers={"Authorization": "Bearer mock:manager:manager@astra.local"})
    assert response.status_code == 200


def test_role_selection_cannot_create_admin():
    client = client_with_mock_auth()
    response = client.post(
        "/api/auth/select-role",
        headers={"Authorization": "Bearer mock:buyer:buyer@astra.local"},
        json={"role": "admin"},
    )
    assert response.status_code == 403


def test_admin_can_access_crm_api():
    client = client_with_mock_auth()
    response = client.get("/api/crm/dashboard", headers={"Authorization": "Bearer mock:admin:admin@astra.local"})
    assert response.status_code == 200
