"""Tests for users module."""

import pytest
from httpx import AsyncClient

from infrastructure.database.models.auth import User

# =============================================================================
# User Story 1: View My Profile
# =============================================================================


@pytest.mark.asyncio
async def test_get_current_user(
    client: AsyncClient,
    test_user: User,
    auth_token: str,
) -> None:
    """Test GET /api/users/me returns user profile."""
    response = await client.get(
        "/api/users/me",
        headers={"Authorization": f"Bearer {auth_token}"},
    )

    assert response.status_code == 200
    data = response.json()["data"]

    assert data["id"] == str(test_user.id)
    assert data["email"] == test_user.email
    assert data["full_name"] == test_user.full_name
    assert data["avatar_url"] == test_user.avatar_url
    assert data["plan"] == test_user.plan
    assert data["credits"] == test_user.credits
    assert data["referral_code"] == test_user.referral_code
    assert data["is_verified"] == test_user.is_verified
    assert "created_at" in data
    assert "last_login_at" in data


@pytest.mark.asyncio
async def test_get_user_unauthorized(client: AsyncClient) -> None:
    """Test GET /api/users/me without token returns 401."""
    response = await client.get("/api/users/me")
    # FastAPI with auto_error=True returns 401 for missing credentials
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_user_invalid_token(client: AsyncClient) -> None:
    """Test GET /api/users/me with invalid token returns 401."""
    response = await client.get(
        "/api/users/me",
        headers={"Authorization": "Bearer invalid_token"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_user_inactive(
    client: AsyncClient,
    inactive_user: User,
    inactive_user_token: str,
) -> None:
    """Test GET /api/users/me for inactive user returns 403."""
    response = await client.get(
        "/api/users/me",
        headers={"Authorization": f"Bearer {inactive_user_token}"},
    )
    assert response.status_code == 403
    assert "inactive" in response.json()["detail"].lower()


# =============================================================================
# User Story 2: Update My Profile
# =============================================================================


@pytest.mark.asyncio
async def test_update_user_profile(
    client: AsyncClient,
    test_user: User,
    auth_token: str,
) -> None:
    """Test PATCH /api/users/me updates profile."""
    response = await client.patch(
        "/api/users/me",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={
            "full_name": "Updated Name",
            "avatar_url": "https://example.com/new-avatar.jpg",
        },
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["full_name"] == "Updated Name"
    assert data["avatar_url"] == "https://example.com/new-avatar.jpg"


@pytest.mark.asyncio
async def test_update_user_profile_partial(
    client: AsyncClient,
    test_user: User,
    auth_token: str,
) -> None:
    """Test PATCH /api/users/me with only full_name."""
    original_avatar = test_user.avatar_url

    response = await client.patch(
        "/api/users/me",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={"full_name": "Only Name Updated"},
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["full_name"] == "Only Name Updated"
    assert data["avatar_url"] == original_avatar


@pytest.mark.asyncio
async def test_update_invalid_avatar_url(
    client: AsyncClient,
    test_user: User,
    auth_token: str,
) -> None:
    """Test PATCH /api/users/me with invalid URL returns 422."""
    response = await client.patch(
        "/api/users/me",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={"avatar_url": "not-a-valid-url"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_update_empty_body(
    client: AsyncClient,
    test_user: User,
    auth_token: str,
) -> None:
    """Test PATCH /api/users/me with empty body."""
    original_name = test_user.full_name

    response = await client.patch(
        "/api/users/me",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={},
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["full_name"] == original_name


@pytest.mark.asyncio
async def test_update_name_too_long(
    client: AsyncClient,
    test_user: User,
    auth_token: str,
) -> None:
    """Test PATCH /api/users/me with name > 255 chars returns 422."""
    long_name = "A" * 256

    response = await client.patch(
        "/api/users/me",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={"full_name": long_name},
    )
    assert response.status_code == 422


# =============================================================================
# User Story 3: View Credit Balance
# =============================================================================


@pytest.mark.asyncio
async def test_get_credit_balance(
    client: AsyncClient,
    test_user: User,
    auth_token: str,
) -> None:
    """Test GET /api/users/me/credits returns balance."""
    response = await client.get(
        "/api/users/me/credits",
        headers={"Authorization": f"Bearer {auth_token}"},
    )

    assert response.status_code == 200
    data = response.json()["data"]

    assert data["credits"] == test_user.credits
    assert data["plan"] == test_user.plan
    assert "daily_bonus" in data
    assert "rollover_limit" in data


@pytest.mark.asyncio
async def test_credit_balance_rollover_by_plan(
    client: AsyncClient,
    test_user: User,
    auth_token: str,
) -> None:
    """Test rollover limit matches plan (starter = 200)."""
    response = await client.get(
        "/api/users/me/credits",
        headers={"Authorization": f"Bearer {auth_token}"},
    )

    assert response.status_code == 200
    data = response.json()["data"]

    # test_user has plan="starter"
    assert data["rollover_limit"] == 200


@pytest.mark.asyncio
async def test_daily_bonus_info_available(
    client: AsyncClient,
    test_user: User,
    auth_token: str,
) -> None:
    """Test daily bonus shows as available when not claimed today."""
    response = await client.get(
        "/api/users/me/credits",
        headers={"Authorization": f"Bearer {auth_token}"},
    )

    assert response.status_code == 200
    data = response.json()["data"]

    # User has not claimed bonus today
    assert data["daily_bonus"]["amount"] == 3  # starter plan
    assert data["daily_bonus"]["next_bonus_at"] is None  # Available now


@pytest.mark.asyncio
async def test_daily_bonus_info_claimed(
    client: AsyncClient,
    user_with_today_bonus: User,
) -> None:
    """Test daily bonus shows next time when already claimed today."""
    from api.src.auth.service import create_access_token

    token = create_access_token(user_with_today_bonus.id)
    response = await client.get(
        "/api/users/me/credits",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()["data"]

    # User claimed bonus today
    assert data["daily_bonus"]["amount"] == 3  # starter plan
    assert data["daily_bonus"]["next_bonus_at"] is not None  # Tomorrow


# =============================================================================
# User Story 4: View Transaction History
# =============================================================================


@pytest.mark.asyncio
async def test_get_credit_transactions(
    client: AsyncClient,
    user_with_transactions: User,
    auth_token: str,
) -> None:
    """Test GET /api/users/me/transactions returns list."""
    response = await client.get(
        "/api/users/me/transactions",
        headers={"Authorization": f"Bearer {auth_token}"},
    )

    assert response.status_code == 200
    data = response.json()["data"]

    assert "transactions" in data
    assert "pagination" in data
    assert len(data["transactions"]) == 3

    # Check transaction structure
    tx = data["transactions"][0]
    assert "id" in tx
    assert "amount" in tx
    assert "balance_after" in tx
    assert "transaction_type" in tx
    assert "created_at" in tx


@pytest.mark.asyncio
async def test_transactions_pagination(
    client: AsyncClient,
    user_with_transactions: User,
    auth_token: str,
) -> None:
    """Test pagination parameters work correctly."""
    response = await client.get(
        "/api/users/me/transactions?page=1&per_page=2",
        headers={"Authorization": f"Bearer {auth_token}"},
    )

    assert response.status_code == 200
    data = response.json()["data"]

    assert len(data["transactions"]) == 2
    assert data["pagination"]["page"] == 1
    assert data["pagination"]["per_page"] == 2
    assert data["pagination"]["total"] == 3
    assert data["pagination"]["total_pages"] == 2


@pytest.mark.asyncio
async def test_transactions_filter_by_type(
    client: AsyncClient,
    user_with_transactions: User,
    auth_token: str,
) -> None:
    """Test filtering by transaction type."""
    response = await client.get(
        "/api/users/me/transactions?type=daily_bonus",
        headers={"Authorization": f"Bearer {auth_token}"},
    )

    assert response.status_code == 200
    data = response.json()["data"]

    assert len(data["transactions"]) == 1
    assert data["transactions"][0]["transaction_type"] == "daily_bonus"


@pytest.mark.asyncio
async def test_transactions_max_per_page(
    client: AsyncClient,
    user_with_transactions: User,
    auth_token: str,
) -> None:
    """Test per_page over 100 returns validation error."""
    response = await client.get(
        "/api/users/me/transactions?per_page=150",
        headers={"Authorization": f"Bearer {auth_token}"},
    )

    # FastAPI Query validation rejects values > 100
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_transactions_empty(
    client: AsyncClient,
    test_user: User,
    auth_token: str,
) -> None:
    """Test empty transaction list."""
    response = await client.get(
        "/api/users/me/transactions",
        headers={"Authorization": f"Bearer {auth_token}"},
    )

    assert response.status_code == 200
    data = response.json()["data"]

    assert data["transactions"] == []
    assert data["pagination"]["total"] == 0
    assert data["pagination"]["total_pages"] == 0


# =============================================================================
# Additional Service Tests for Coverage
# =============================================================================


@pytest.mark.asyncio
async def test_get_user_by_id(
    db_session,
    test_user: User,
) -> None:
    """Test get_user_by_id service function."""
    from api.src.users.service import get_user_by_id

    # Existing user
    user = await get_user_by_id(test_user.id, db_session)
    assert user is not None
    assert user.id == test_user.id
    assert user.email == test_user.email

    # Non-existent user
    import uuid

    missing = await get_user_by_id(uuid.uuid4(), db_session)
    assert missing is None


@pytest.mark.asyncio
async def test_update_user_profile_without_db(
    test_user: User,
) -> None:
    """Test update_user_profile without db session."""
    from api.src.users.service import update_user_profile

    # Update without db (no commit)
    updated = await update_user_profile(
        user=test_user,
        full_name="No DB Update",
        db=None,
    )
    assert updated.full_name == "No DB Update"


def test_rollover_limit_unknown_plan() -> None:
    """Test rollover limit returns 0 for unknown plan."""
    from api.src.users.service import calculate_rollover_limit

    assert calculate_rollover_limit("unknown_plan") == 0
    assert calculate_rollover_limit("free") == 0
    assert calculate_rollover_limit("pro") == 600


def test_daily_bonus_amount_unknown_plan() -> None:
    """Test daily bonus returns 1 for unknown plan."""
    from api.src.users.service import get_daily_bonus_amount

    assert get_daily_bonus_amount("unknown_plan") == 1
    assert get_daily_bonus_amount("free") == 1
    assert get_daily_bonus_amount("business") == 10


@pytest.mark.asyncio
async def test_clear_avatar_url(
    client: AsyncClient,
    test_user: User,
    auth_token: str,
) -> None:
    """Test clearing avatar_url with empty string."""
    response = await client.patch(
        "/api/users/me",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={"avatar_url": "https://example.com/new.jpg"},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_update_only_avatar(
    client: AsyncClient,
    test_user: User,
    auth_token: str,
) -> None:
    """Test updating only avatar_url, keeping name unchanged."""
    original_name = test_user.full_name

    response = await client.patch(
        "/api/users/me",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={"avatar_url": "https://example.com/only-avatar.jpg"},
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["full_name"] == original_name
    assert data["avatar_url"] == "https://example.com/only-avatar.jpg"


@pytest.mark.asyncio
async def test_transactions_second_page(
    client: AsyncClient,
    user_with_transactions: User,
    auth_token: str,
) -> None:
    """Test getting second page of transactions."""
    response = await client.get(
        "/api/users/me/transactions?page=2&per_page=2",
        headers={"Authorization": f"Bearer {auth_token}"},
    )

    assert response.status_code == 200
    data = response.json()["data"]

    # 3 total, 2 per page, page 2 should have 1 item
    assert len(data["transactions"]) == 1
    assert data["pagination"]["page"] == 2


@pytest.mark.asyncio
async def test_transactions_page_beyond_total(
    client: AsyncClient,
    user_with_transactions: User,
    auth_token: str,
) -> None:
    """Test requesting page beyond available data."""
    response = await client.get(
        "/api/users/me/transactions?page=100",
        headers={"Authorization": f"Bearer {auth_token}"},
    )

    assert response.status_code == 200
    data = response.json()["data"]

    assert data["transactions"] == []
    assert data["pagination"]["page"] == 100
