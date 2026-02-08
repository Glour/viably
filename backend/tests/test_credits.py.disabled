"""Tests for credits module."""

import uuid
from datetime import date, datetime, timedelta, timezone

import pytest
import pytest_asyncio
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.auth.service import hash_password
from app.core.utils import generate_referral_code
from app.credits.models import CreditTransaction, DailyBonus
from app.credits.service import (
    DAILY_BONUSES,
    REFERRAL_BONUS,
    ROLLOVER_LIMITS,
    add_credits,
    award_referral_bonus,
    claim_daily_bonus,
    deduct_credits,
    get_daily_bonus_amount,
    get_daily_bonus_info,
    get_rollover_limit,
    process_monthly_rollover,
)

# =============================================================================
# Phase 3: User Story 1 - Deduct/Add Credits Tests
# =============================================================================


class TestDeductCredits:
    """Tests for deduct_credits function."""

    @pytest.mark.asyncio
    async def test_deduct_credits_success(
        self, db_session: AsyncSession, test_user: User
    ):
        """Test successful credit deduction."""
        initial_credits = test_user.credits
        amount = 5

        result = await deduct_credits(
            user_id=test_user.id,
            amount=amount,
            transaction_type="generation",
            db=db_session,
            description="Test deduction",
        )

        assert result["success"] is True
        assert result["balance_after"] == initial_credits - amount
        assert result["transaction_id"] is not None

        # Verify user balance updated
        await db_session.refresh(test_user)
        assert test_user.credits == initial_credits - amount

        # Verify transaction recorded
        stmt = select(CreditTransaction).where(
            CreditTransaction.id == result["transaction_id"]
        )
        tx_result = await db_session.execute(stmt)
        transaction = tx_result.scalar_one()

        assert transaction.amount == -amount
        assert transaction.balance_after == initial_credits - amount
        assert transaction.transaction_type == "generation"
        assert transaction.description == "Test deduction"

    @pytest.mark.asyncio
    async def test_deduct_credits_insufficient_balance(
        self, db_session: AsyncSession, test_user: User
    ):
        """Test deduction with insufficient credits returns 422."""
        # Try to deduct more than available
        with pytest.raises(HTTPException) as exc_info:
            await deduct_credits(
                user_id=test_user.id,
                amount=test_user.credits + 100,
                transaction_type="generation",
                db=db_session,
            )

        assert exc_info.value.status_code == 422
        assert "Insufficient credits" in exc_info.value.detail

        # Verify balance unchanged
        await db_session.refresh(test_user)
        assert test_user.credits == 100  # Original value from fixture

    @pytest.mark.asyncio
    async def test_deduct_credits_exact_balance(
        self, db_session: AsyncSession, test_user: User
    ):
        """Test deduction of exact balance succeeds."""
        initial_credits = test_user.credits

        result = await deduct_credits(
            user_id=test_user.id,
            amount=initial_credits,
            transaction_type="generation",
            db=db_session,
        )

        assert result["success"] is True
        assert result["balance_after"] == 0

        await db_session.refresh(test_user)
        assert test_user.credits == 0

    @pytest.mark.asyncio
    async def test_deduct_credits_with_project_id(
        self, db_session: AsyncSession, test_user: User
    ):
        """Test deduction with project reference."""
        project_id = uuid.uuid4()

        result = await deduct_credits(
            user_id=test_user.id,
            amount=5,
            transaction_type="generation",
            db=db_session,
            project_id=project_id,
        )

        # Verify project_id stored
        stmt = select(CreditTransaction).where(
            CreditTransaction.id == result["transaction_id"]
        )
        tx_result = await db_session.execute(stmt)
        transaction = tx_result.scalar_one()

        assert transaction.project_id == project_id

    @pytest.mark.asyncio
    async def test_deduct_credits_user_not_found(self, db_session: AsyncSession):
        """Test deduction for non-existent user returns 404."""
        fake_user_id = uuid.uuid4()

        with pytest.raises(HTTPException) as exc_info:
            await deduct_credits(
                user_id=fake_user_id,
                amount=5,
                transaction_type="generation",
                db=db_session,
            )

        assert exc_info.value.status_code == 404
        assert "User not found" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_deduct_credits_invalid_amount(
        self, db_session: AsyncSession, test_user: User
    ):
        """Test deduction with zero or negative amount fails."""
        with pytest.raises(HTTPException) as exc_info:
            await deduct_credits(
                user_id=test_user.id,
                amount=0,
                transaction_type="generation",
                db=db_session,
            )

        assert exc_info.value.status_code == 422


class TestAddCredits:
    """Tests for add_credits function."""

    @pytest.mark.asyncio
    async def test_add_credits_success(
        self, db_session: AsyncSession, test_user: User
    ):
        """Test successful credit addition."""
        initial_credits = test_user.credits
        amount = 50

        result = await add_credits(
            user_id=test_user.id,
            amount=amount,
            transaction_type="purchase",
            db=db_session,
            description="Test purchase",
        )

        assert result["success"] is True
        assert result["balance_after"] == initial_credits + amount

        # Verify user balance updated
        await db_session.refresh(test_user)
        assert test_user.credits == initial_credits + amount

        # Verify transaction recorded
        stmt = select(CreditTransaction).where(
            CreditTransaction.id == result["transaction_id"]
        )
        tx_result = await db_session.execute(stmt)
        transaction = tx_result.scalar_one()

        assert transaction.amount == amount
        assert transaction.transaction_type == "purchase"

    @pytest.mark.asyncio
    async def test_add_credits_with_related_user(
        self, db_session: AsyncSession, test_user: User
    ):
        """Test addition with related user (for referrals)."""
        related_user_id = uuid.uuid4()

        result = await add_credits(
            user_id=test_user.id,
            amount=5,
            transaction_type="referral_bonus",
            db=db_session,
            related_user_id=related_user_id,
        )

        # Verify related_user_id stored
        stmt = select(CreditTransaction).where(
            CreditTransaction.id == result["transaction_id"]
        )
        tx_result = await db_session.execute(stmt)
        transaction = tx_result.scalar_one()

        assert transaction.related_user_id == related_user_id


# =============================================================================
# Phase 4: User Story 2 - Daily Bonus Tests
# =============================================================================


class TestDailyBonus:
    """Tests for daily bonus functionality."""

    @pytest.mark.asyncio
    async def test_claim_daily_bonus_success(
        self, db_session: AsyncSession, test_user: User
    ):
        """Test successful daily bonus claim."""
        # test_user has plan="starter" which gets 3 credits
        initial_credits = test_user.credits
        expected_bonus = DAILY_BONUSES["starter"]

        result = await claim_daily_bonus(user_id=test_user.id, db=db_session)

        assert result.claimed is True
        assert result.amount == expected_bonus
        assert result.new_balance == initial_credits + expected_bonus

        # Verify DailyBonus record created
        stmt = select(DailyBonus).where(
            DailyBonus.user_id == test_user.id,
            DailyBonus.bonus_date == date.today(),
        )
        db_result = await db_session.execute(stmt)
        bonus_record = db_result.scalar_one()

        assert bonus_record.credits_awarded == expected_bonus

    @pytest.mark.asyncio
    async def test_claim_daily_bonus_already_claimed(
        self, db_session: AsyncSession, user_with_today_bonus: User
    ):
        """Test claiming bonus twice returns 409."""
        with pytest.raises(HTTPException) as exc_info:
            await claim_daily_bonus(user_id=user_with_today_bonus.id, db=db_session)

        assert exc_info.value.status_code == 409
        assert "already claimed" in exc_info.value.detail.lower()

    @pytest.mark.asyncio
    async def test_claim_daily_bonus_free_plan(
        self, db_session: AsyncSession, inactive_user: User
    ):
        """Test free plan users cannot claim daily bonus."""
        # inactive_user has plan="free"
        with pytest.raises(HTTPException) as exc_info:
            await claim_daily_bonus(user_id=inactive_user.id, db=db_session)

        assert exc_info.value.status_code == 400
        assert "does not include daily bonuses" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_get_daily_bonus_info_not_claimed(
        self, db_session: AsyncSession, test_user: User
    ):
        """Test bonus info when not claimed today."""
        info = await get_daily_bonus_info(user_id=test_user.id, db=db_session)

        assert info.amount == DAILY_BONUSES["starter"]
        assert info.claimed_today is False
        assert info.next_available_at is None  # Available now

    @pytest.mark.asyncio
    async def test_get_daily_bonus_info_already_claimed(
        self, db_session: AsyncSession, user_with_today_bonus: User
    ):
        """Test bonus info when already claimed today."""
        info = await get_daily_bonus_info(user_id=user_with_today_bonus.id, db=db_session)

        assert info.claimed_today is True
        assert info.next_available_at is not None

        # Next available should be tomorrow
        tomorrow = date.today() + timedelta(days=1)
        assert info.next_available_at.date() == tomorrow

    @pytest.mark.asyncio
    async def test_get_daily_bonus_info_free_plan(
        self, db_session: AsyncSession, inactive_user: User
    ):
        """Test bonus info for free plan shows 0 amount."""
        info = await get_daily_bonus_info(user_id=inactive_user.id, db=db_session)

        assert info.amount == 0
        assert info.claimed_today is True  # Effectively not available


# =============================================================================
# Phase 5: User Story 3 - Referral Bonus Tests
# =============================================================================


class TestReferralBonus:
    """Tests for referral bonus functionality."""

    @pytest.mark.asyncio
    async def test_award_referral_bonus_success(
        self, db_session: AsyncSession, test_user: User
    ):
        """Test successful referral bonus award."""
        referee_id = uuid.uuid4()
        initial_credits = test_user.credits

        result = await award_referral_bonus(
            referrer_id=test_user.id,
            referee_id=referee_id,
            db=db_session,
        )

        assert result["amount"] == REFERRAL_BONUS
        assert result["balance_after"] == initial_credits + REFERRAL_BONUS

        # Verify user balance updated
        await db_session.refresh(test_user)
        assert test_user.credits == initial_credits + REFERRAL_BONUS

    @pytest.mark.asyncio
    async def test_referral_transaction_has_related_user(
        self, db_session: AsyncSession, test_user: User
    ):
        """Test referral transaction includes related_user_id."""
        referee_id = uuid.uuid4()

        result = await award_referral_bonus(
            referrer_id=test_user.id,
            referee_id=referee_id,
            db=db_session,
        )

        # Verify related_user_id in transaction
        stmt = select(CreditTransaction).where(
            CreditTransaction.id == result["transaction_id"]
        )
        tx_result = await db_session.execute(stmt)
        transaction = tx_result.scalar_one()

        assert transaction.related_user_id == referee_id
        assert transaction.transaction_type == "referral_bonus"


# =============================================================================
# Phase 6: User Story 4 - Monthly Rollover Tests
# =============================================================================


class TestMonthlyRollover:
    """Tests for monthly rollover functionality."""

    @pytest_asyncio.fixture
    async def user_over_limit(self, db_session: AsyncSession) -> User:
        """Create user with credits over rollover limit."""
        user = User(
            id=uuid.uuid4(),
            email="overlimit@example.com",
            password_hash=hash_password("Test1234"),
            full_name="Over Limit User",
            plan="starter",  # Limit is 200
            credits=250,  # 50 over limit
            referral_code=generate_referral_code(),
            is_active=True,
            is_verified=True,
            created_at=datetime.now(timezone.utc),
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        return user

    @pytest_asyncio.fixture
    async def user_under_limit(self, db_session: AsyncSession) -> User:
        """Create user with credits under rollover limit."""
        user = User(
            id=uuid.uuid4(),
            email="underlimit@example.com",
            password_hash=hash_password("Test1234"),
            full_name="Under Limit User",
            plan="pro",  # Limit is 600
            credits=500,  # Under limit
            referral_code=generate_referral_code(),
            is_active=True,
            is_verified=True,
            created_at=datetime.now(timezone.utc),
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        return user

    @pytest_asyncio.fixture
    async def free_user_with_credits(self, db_session: AsyncSession) -> User:
        """Create free plan user with credits."""
        user = User(
            id=uuid.uuid4(),
            email="freeuser@example.com",
            password_hash=hash_password("Test1234"),
            full_name="Free User",
            plan="free",  # Limit is 0
            credits=10,  # All should be removed
            referral_code=generate_referral_code(),
            is_active=True,
            is_verified=True,
            created_at=datetime.now(timezone.utc),
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        return user

    @pytest.mark.asyncio
    async def test_rollover_excess_credits(
        self, db_session: AsyncSession, user_over_limit: User
    ):
        """Test rollover removes excess credits."""
        limit = ROLLOVER_LIMITS["starter"]
        initial_credits = user_over_limit.credits

        result = await process_monthly_rollover(db=db_session)

        assert result["processed"] >= 1

        # Verify user credits capped at limit
        await db_session.refresh(user_over_limit)
        assert user_over_limit.credits == limit

        # Verify rollover transaction created
        stmt = select(CreditTransaction).where(
            CreditTransaction.user_id == user_over_limit.id,
            CreditTransaction.transaction_type == "rollover",
        )
        tx_result = await db_session.execute(stmt)
        transaction = tx_result.scalar_one()

        assert transaction.amount == -(initial_credits - limit)

    @pytest.mark.asyncio
    async def test_rollover_under_limit(
        self, db_session: AsyncSession, user_under_limit: User
    ):
        """Test rollover doesn't affect users under limit."""
        initial_credits = user_under_limit.credits

        await process_monthly_rollover(db=db_session)

        # Verify credits unchanged
        await db_session.refresh(user_under_limit)
        assert user_under_limit.credits == initial_credits

    @pytest.mark.asyncio
    async def test_rollover_free_plan(
        self, db_session: AsyncSession, free_user_with_credits: User
    ):
        """Test rollover removes all credits for free plan (limit 0)."""
        await process_monthly_rollover(db=db_session)

        # Verify all credits removed
        await db_session.refresh(free_user_with_credits)
        assert free_user_with_credits.credits == 0


# =============================================================================
# Helper Function Tests
# =============================================================================


class TestHelperFunctions:
    """Tests for helper functions."""

    def test_get_daily_bonus_amount(self):
        """Test daily bonus amounts by plan."""
        assert get_daily_bonus_amount("free") == 0
        assert get_daily_bonus_amount("starter") == 3
        assert get_daily_bonus_amount("pro") == 10
        assert get_daily_bonus_amount("business") == 20
        assert get_daily_bonus_amount("unknown") == 0

    def test_get_rollover_limit(self):
        """Test rollover limits by plan."""
        assert get_rollover_limit("free") == 0
        assert get_rollover_limit("starter") == 200
        assert get_rollover_limit("pro") == 600
        assert get_rollover_limit("business") == 2000
        assert get_rollover_limit("unknown") == 0


# =============================================================================
# Phase 8: API Endpoint Tests
# =============================================================================


class TestCreditsAPI:
    """Tests for credits API endpoints."""

    @pytest.mark.asyncio
    async def test_get_balance(self, client, test_user: User, auth_token: str):
        """Test GET /api/credits/balance endpoint."""
        response = await client.get(
            "/api/credits/balance",
            headers={"Authorization": f"Bearer {auth_token}"},
        )

        assert response.status_code == 200
        data = response.json()["data"]
        assert data["credits"] == test_user.credits
        assert data["plan"] == test_user.plan

    @pytest.mark.asyncio
    async def test_get_balance_unauthorized(self, client):
        """Test GET /api/credits/balance without auth."""
        response = await client.get("/api/credits/balance")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_transactions(
        self, client, user_with_transactions: User, auth_token: str
    ):
        """Test GET /api/credits/transactions endpoint."""
        response = await client.get(
            "/api/credits/transactions",
            headers={"Authorization": f"Bearer {auth_token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "meta" in data
        assert len(data["data"]) > 0
        assert "total" in data["meta"]
        assert "limit" in data["meta"]
        assert "offset" in data["meta"]

    @pytest.mark.asyncio
    async def test_get_transactions_pagination(
        self, client, user_with_transactions: User, auth_token: str
    ):
        """Test GET /api/credits/transactions with pagination."""
        response = await client.get(
            "/api/credits/transactions?limit=1&offset=0",
            headers={"Authorization": f"Bearer {auth_token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) == 1
        assert data["meta"]["limit"] == 1
        assert data["meta"]["offset"] == 0

    @pytest.mark.asyncio
    async def test_get_transactions_filter_by_type(
        self, client, user_with_transactions: User, auth_token: str
    ):
        """Test GET /api/credits/transactions with type filter."""
        response = await client.get(
            "/api/credits/transactions?type=daily_bonus",
            headers={"Authorization": f"Bearer {auth_token}"},
        )

        assert response.status_code == 200
        data = response.json()
        # All returned transactions should be of type daily_bonus
        for tx in data["data"]:
            assert tx["transaction_type"] == "daily_bonus"

    @pytest.mark.asyncio
    async def test_claim_daily_bonus_endpoint(
        self, client, test_user: User, auth_token: str
    ):
        """Test POST /api/credits/daily-bonus endpoint."""
        initial_credits = test_user.credits  # Save before request
        response = await client.post(
            "/api/credits/daily-bonus",
            headers={"Authorization": f"Bearer {auth_token}"},
        )

        assert response.status_code == 200
        data = response.json()["data"]
        assert data["claimed"] is True
        assert data["amount"] == DAILY_BONUSES["starter"]
        assert data["new_balance"] == initial_credits + DAILY_BONUSES["starter"]

    @pytest.mark.asyncio
    async def test_claim_daily_bonus_twice(
        self, client, user_with_today_bonus: User, auth_token: str
    ):
        """Test claiming daily bonus twice returns 409."""
        # First claim is already done by fixture
        response = await client.post(
            "/api/credits/daily-bonus",
            headers={"Authorization": f"Bearer {auth_token}"},
        )

        assert response.status_code == 409

    @pytest.mark.asyncio
    async def test_get_daily_bonus_info_endpoint(
        self, client, test_user: User, auth_token: str
    ):
        """Test GET /api/credits/daily-bonus endpoint."""
        response = await client.get(
            "/api/credits/daily-bonus",
            headers={"Authorization": f"Bearer {auth_token}"},
        )

        assert response.status_code == 200
        data = response.json()["data"]
        assert "amount" in data
        assert "claimed_today" in data
        assert data["amount"] == DAILY_BONUSES["starter"]
