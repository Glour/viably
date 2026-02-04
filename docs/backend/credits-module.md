# Backend Module: Credits

**Module:** `app/credits`  
**Status:** Not Started  
**Priority:** P0 (Must have for MVP)  
**Estimated Time:** 4 days  
**Dependencies:** Users Module

---

## 📋 Overview

The Credits module manages the entire credit economy: transactions, daily bonuses, referral rewards, rollover logic, and deduction/addition functions.

**Responsibilities:**
- Credit transactions (add/deduct)
- Daily bonus system
- Referral rewards
- Rollover limits by plan
- Transaction history
- Atomic credit operations

---

## 🔧 Dependencies

```python
# requirements.txt additions
sqlalchemy>=2.0
pydantic>=2.5.0
apscheduler>=3.10.0  # For daily bonus cron
```

---

## 🗄️ Database Models

### CreditTransaction Model

File: `app/credits/models.py`

```python
from sqlalchemy import Column, String, Integer, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from app.core.database import Base

class CreditTransaction(Base):
    __tablename__ = "credit_transactions"
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Transaction details
    amount = Column(Integer, nullable=False)  # Positive = credit, negative = debit
    balance_after = Column(Integer, nullable=False)
    
    # Type
    transaction_type = Column(String(50), nullable=False, index=True)
    # Types: signup, daily_bonus, referral_bonus, purchase, refund, generation, rollover, admin_adjustment
    
    # References
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    related_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)  # For referrals
    
    # Metadata
    metadata = Column(JSONB, default={})
    description = Column(Text, nullable=True)
    
    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], backref="transactions")
    project = relationship("Project", backref="credit_transactions")
    related_user = relationship("User", foreign_keys=[related_user_id])


class DailyBonus(Base):
    __tablename__ = "daily_bonuses"
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Bonus details
    credits_awarded = Column(Integer, nullable=False)
    bonus_date = Column(Date, nullable=False, index=True)
    
    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Unique: one bonus per user per day
    __table_args__ = (
        UniqueConstraint('user_id', 'bonus_date', name='unique_daily_bonus'),
    )
    
    # Relationships
    user = relationship("User", backref="daily_bonuses")
```

---

## 📝 Pydantic Schemas

File: `app/credits/schemas.py`

```python
from pydantic import BaseModel, Field
from datetime import datetime, date
from uuid import UUID

class CreditDeduct(BaseModel):
    """Request to deduct credits"""
    amount: int = Field(..., gt=0, description="Credits to deduct")
    transaction_type: str = Field(..., pattern="^(generation|admin_adjustment)$")
    project_id: UUID | None = None
    description: str | None = None

class CreditAdd(BaseModel):
    """Request to add credits"""
    amount: int = Field(..., gt=0, description="Credits to add")
    transaction_type: str = Field(
        ...,
        pattern="^(signup|daily_bonus|referral_bonus|purchase|refund|rollover|admin_adjustment)$"
    )
    related_user_id: UUID | None = None  # For referrals
    description: str | None = None

class TransactionResponse(BaseModel):
    """Single transaction response"""
    id: UUID
    amount: int
    balance_after: int
    transaction_type: str
    description: str | None
    project: dict | None  # {"id": "...", "name": "..."}
    related_user: dict | None  # For referrals
    metadata: dict
    created_at: datetime
    
    class Config:
        from_attributes = True

class DailyBonusInfo(BaseModel):
    """Daily bonus availability info"""
    amount: int  # Credits user will get
    claimed_today: bool
    next_available_at: datetime | None  # None if available now
    streak_days: int = 0  # Future feature
```

---

## 💼 Business Logic

File: `app/credits/service.py`

### Core Functions:

```python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from uuid import UUID
from datetime import datetime, date, timedelta
from fastapi import HTTPException, status

async def deduct_credits(
    user_id: UUID,
    amount: int,
    transaction_type: str,
    project_id: UUID | None = None,
    description: str | None = None,
    db: AsyncSession = None
) -> dict:
    """
    Deduct credits from user atomically.
    
    Uses database-level locking (SELECT FOR UPDATE) to prevent race conditions.
    
    Args:
        user_id: User UUID
        amount: Credits to deduct (positive number)
        transaction_type: "generation" or "admin_adjustment"
        project_id: Optional project reference
        description: Optional description
    
    Returns:
        {
            "transaction_id": UUID,
            "balance_after": int,
            "success": True
        }
    
    Raises:
        HTTPException 422: Insufficient credits
    
    Example:
        result = await deduct_credits(
            user_id=user.id,
            amount=5,
            transaction_type="generation",
            project_id=project.id,
            description="Generated Shop Bot"
        )
    """
    async with db.begin():
        # Lock user row
        stmt = select(User).where(User.id == user_id).with_for_update()
        result = await db.execute(stmt)
        user = result.scalar_one()
        
        # Check balance
        if user.credits < amount:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Insufficient credits. Required: {amount}, Available: {user.credits}"
            )
        
        # Calculate new balance
        new_balance = user.credits - amount
        
        # Update user credits
        user.credits = new_balance
        
        # Create transaction record
        transaction = CreditTransaction(
            user_id=user_id,
            amount=-amount,  # Negative for deduction
            balance_after=new_balance,
            transaction_type=transaction_type,
            project_id=project_id,
            description=description
        )
        db.add(transaction)
        
        await db.commit()
        
        return {
            "transaction_id": transaction.id,
            "balance_after": new_balance,
            "success": True
        }


async def add_credits(
    user_id: UUID,
    amount: int,
    transaction_type: str,
    related_user_id: UUID | None = None,
    description: str | None = None,
    metadata: dict = {},
    db: AsyncSession = None
) -> dict:
    """
    Add credits to user atomically.
    
    Args:
        user_id: User UUID
        amount: Credits to add (positive number)
        transaction_type: Type of credit addition
        related_user_id: For referrals (who referred)
        description: Optional description
        metadata: Additional data
    
    Returns:
        {
            "transaction_id": UUID,
            "balance_after": int,
            "success": True
        }
    
    Example:
        result = await add_credits(
            user_id=new_user.id,
            amount=5,
            transaction_type="signup",
            description="Signup bonus"
        )
    """
    async with db.begin():
        # Lock user row
        stmt = select(User).where(User.id == user_id).with_for_update()
        result = await db.execute(stmt)
        user = result.scalar_one()
        
        # Calculate new balance
        new_balance = user.credits + amount
        
        # Update user credits
        user.credits = new_balance
        
        # Create transaction record
        transaction = CreditTransaction(
            user_id=user_id,
            amount=amount,  # Positive for addition
            balance_after=new_balance,
            transaction_type=transaction_type,
            related_user_id=related_user_id,
            description=description,
            metadata=metadata
        )
        db.add(transaction)
        
        await db.commit()
        
        return {
            "transaction_id": transaction.id,
            "balance_after": new_balance,
            "success": True
        }


async def claim_daily_bonus(
    user_id: UUID,
    db: AsyncSession
) -> dict:
    """
    Claim daily bonus if available.
    
    Logic:
    1. Check if already claimed today
    2. Get bonus amount based on plan
    3. Add credits
    4. Record in daily_bonuses table
    
    Returns:
        {
            "claimed": True,
            "amount": 3,
            "new_balance": 153,
            "next_available_at": "2026-02-05T00:00:00Z"
        }
    
    Raises:
        HTTPException 409: Already claimed today
    
    Example:
        result = await claim_daily_bonus(user.id, db)
    """
    today = date.today()
    
    # Check if already claimed
    stmt = select(DailyBonus).where(
        DailyBonus.user_id == user_id,
        DailyBonus.bonus_date == today
    )
    existing = await db.execute(stmt)
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Daily bonus already claimed today"
        )
    
    # Get user plan
    user = await db.get(User, user_id)
    
    # Calculate bonus amount
    bonus_amount = get_daily_bonus_amount(user.plan)
    
    if bonus_amount == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your plan does not include daily bonuses"
        )
    
    # Add credits
    result = await add_credits(
        user_id=user_id,
        amount=bonus_amount,
        transaction_type="daily_bonus",
        description=f"Daily bonus for {today}",
        db=db
    )
    
    # Record daily bonus
    bonus = DailyBonus(
        user_id=user_id,
        credits_awarded=bonus_amount,
        bonus_date=today
    )
    db.add(bonus)
    await db.commit()
    
    # Calculate next available time (tomorrow 00:00 UTC)
    tomorrow = today + timedelta(days=1)
    next_available = datetime.combine(tomorrow, datetime.min.time())
    
    return {
        "claimed": True,
        "amount": bonus_amount,
        "new_balance": result["balance_after"],
        "next_available_at": next_available
    }


async def get_daily_bonus_info(
    user_id: UUID,
    db: AsyncSession
) -> DailyBonusInfo:
    """
    Get daily bonus availability info.
    
    Returns:
        DailyBonusInfo with availability status
    """
    user = await db.get(User, user_id)
    bonus_amount = get_daily_bonus_amount(user.plan)
    
    if bonus_amount == 0:
        return DailyBonusInfo(
            amount=0,
            claimed_today=True,  # Effectively not available
            next_available_at=None
        )
    
    today = date.today()
    
    # Check if claimed today
    stmt = select(DailyBonus).where(
        DailyBonus.user_id == user_id,
        DailyBonus.bonus_date == today
    )
    result = await db.execute(stmt)
    claimed_today = result.scalar_one_or_none() is not None
    
    if claimed_today:
        # Next available tomorrow
        tomorrow = today + timedelta(days=1)
        next_available = datetime.combine(tomorrow, datetime.min.time())
    else:
        next_available = None  # Available now
    
    return DailyBonusInfo(
        amount=bonus_amount,
        claimed_today=claimed_today,
        next_available_at=next_available
    )


def get_daily_bonus_amount(plan: str) -> int:
    """
    Get daily bonus amount based on plan.
    
    Returns:
        0 (free), 3 (starter), 10 (pro), 20 (business)
    """
    DAILY_BONUSES = {
        "free": 0,
        "starter": 3,
        "pro": 10,
        "business": 20
    }
    return DAILY_BONUSES.get(plan, 0)


def get_rollover_limit(plan: str) -> int:
    """
    Get rollover limit based on plan.
    
    Returns:
        0 (free), 200 (starter), 600 (pro), 2000 (business)
    """
    ROLLOVER_LIMITS = {
        "free": 0,
        "starter": 200,
        "pro": 600,
        "business": 2000
    }
    return ROLLOVER_LIMITS.get(plan, 0)


async def process_monthly_rollover(db: AsyncSession):
    """
    Monthly cron job: Apply rollover limits.
    
    Run on 1st of each month at 00:00 UTC.
    
    Logic:
    1. For each user with credits > rollover_limit
    2. Deduct excess credits
    3. Record rollover transaction
    
    Example:
        User has 250 credits, limit is 200
        → Deduct 50 credits
        → Record: "Monthly rollover: -50 credits"
    """
    # Get all users with credits above their limit
    stmt = select(User).where(User.credits > 0)
    result = await db.execute(stmt)
    users = result.scalars().all()
    
    for user in users:
        limit = get_rollover_limit(user.plan)
        
        if user.credits > limit:
            excess = user.credits - limit
            
            # Deduct excess
            await deduct_credits(
                user_id=user.id,
                amount=excess,
                transaction_type="rollover",
                description=f"Monthly rollover: excess credits removed (limit: {limit})",
                db=db
            )


async def award_referral_bonus(
    referrer_id: UUID,
    referee_id: UUID,
    db: AsyncSession
) -> dict:
    """
    Award referral bonus to referrer.
    
    Called when new user (referee) registers with referral code.
    
    Args:
        referrer_id: User who referred
        referee_id: New user who signed up
    
    Returns:
        {
            "transaction_id": UUID,
            "amount": 5,
            "balance_after": int
        }
    
    Example:
        result = await award_referral_bonus(
            referrer_id=existing_user.id,
            referee_id=new_user.id,
            db=db
        )
    """
    REFERRAL_BONUS = 5
    
    result = await add_credits(
        user_id=referrer_id,
        amount=REFERRAL_BONUS,
        transaction_type="referral_bonus",
        related_user_id=referee_id,
        description=f"Referral bonus for inviting new user",
        db=db
    )
    
    return result
```

---

## 🛣️ API Endpoints

File: `app/credits/routes.py`

### POST /api/credits/claim-daily-bonus

Claim daily bonus (auto-called by frontend on login).

**Headers:** `Authorization: Bearer {access_token}`

**Response:** 200 OK
```json
{
  "data": {
    "claimed": true,
    "amount": 3,
    "new_balance": 153,
    "next_available_at": "2026-02-05T00:00:00Z"
  }
}
```

**Errors:**
- 409: Already claimed today
- 400: Plan doesn't include daily bonuses

---

## 📁 File Structure

```
app/credits/
├── __init__.py          # Module exports
├── models.py            # CreditTransaction, DailyBonus models
├── schemas.py           # Pydantic schemas
├── routes.py            # FastAPI routes (daily bonus endpoint)
├── service.py           # Business logic
└── cron.py              # Cron jobs (monthly rollover)
```

---

## ⏰ Cron Jobs

File: `app/credits/cron.py`

```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.credits.service import process_monthly_rollover
from app.core.database import get_db

scheduler = AsyncIOScheduler()

@scheduler.scheduled_job('cron', day=1, hour=0, minute=0)  # 1st of month, 00:00 UTC
async def monthly_rollover_job():
    """Run monthly rollover"""
    async with get_db() as db:
        await process_monthly_rollover(db)

def start_scheduler():
    """Start APScheduler"""
    scheduler.start()
```

In `main.py`:
```python
from app.credits.cron import start_scheduler

@app.on_event("startup")
async def startup():
    start_scheduler()
```

---

## ✅ Tests

File: `tests/test_credits.py`

### Required Tests:

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_deduct_credits_success(db_session, test_user):
    """Test successful credit deduction"""
    from app.credits.service import deduct_credits
    
    # User starts with 5 credits
    result = await deduct_credits(
        user_id=test_user.id,
        amount=3,
        transaction_type="generation",
        description="Test deduction",
        db=db_session
    )
    
    assert result["success"] is True
    assert result["balance_after"] == 2

@pytest.mark.asyncio
async def test_deduct_insufficient_credits(db_session, test_user):
    """Test deduction with insufficient credits"""
    from app.credits.service import deduct_credits
    
    with pytest.raises(HTTPException) as exc:
        await deduct_credits(
            user_id=test_user.id,
            amount=10,  # User only has 5
            transaction_type="generation",
            db=db_session
        )
    
    assert exc.value.status_code == 422

@pytest.mark.asyncio
async def test_add_credits(db_session, test_user):
    """Test adding credits"""
    from app.credits.service import add_credits
    
    result = await add_credits(
        user_id=test_user.id,
        amount=10,
        transaction_type="purchase",
        description="Test purchase",
        db=db_session
    )
    
    assert result["success"] is True
    assert result["balance_after"] == 15  # 5 + 10

@pytest.mark.asyncio
async def test_claim_daily_bonus_success(client: AsyncClient, auth_token: str):
    """Test claiming daily bonus"""
    response = await client.post(
        "/api/credits/claim-daily-bonus",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["claimed"] is True
    assert data["amount"] > 0

@pytest.mark.asyncio
async def test_claim_daily_bonus_twice(client: AsyncClient, auth_token: str):
    """Test claiming daily bonus twice fails"""
    # First claim
    await client.post(
        "/api/credits/claim-daily-bonus",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    # Second claim (should fail)
    response = await client.post(
        "/api/credits/claim-daily-bonus",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    assert response.status_code == 409

@pytest.mark.asyncio
async def test_referral_bonus(db_session):
    """Test referral bonus award"""
    from app.credits.service import award_referral_bonus
    
    # Create referrer and referee users
    referrer = User(email="referrer@test.com", credits=10)
    referee = User(email="referee@test.com", credits=5)
    db_session.add_all([referrer, referee])
    await db_session.commit()
    
    # Award bonus
    result = await award_referral_bonus(
        referrer_id=referrer.id,
        referee_id=referee.id,
        db=db_session
    )
    
    assert result["amount"] == 5
    
    # Verify referrer credits increased
    await db_session.refresh(referrer)
    assert referrer.credits == 15  # 10 + 5

@pytest.mark.asyncio
async def test_rollover_limits(db_session):
    """Test monthly rollover logic"""
    from app.credits.service import process_monthly_rollover, get_rollover_limit
    
    # Create user with excess credits
    user = User(email="test@test.com", plan="starter", credits=250)
    db_session.add(user)
    await db_session.commit()
    
    # Run rollover
    await process_monthly_rollover(db_session)
    
    # Verify credits capped at limit
    await db_session.refresh(user)
    limit = get_rollover_limit("starter")
    assert user.credits == limit  # Should be 200

@pytest.mark.asyncio
async def test_atomic_deduction_race_condition(db_session, test_user):
    """Test that concurrent deductions don't cause negative balance"""
    from app.credits.service import deduct_credits
    import asyncio
    
    # User has 5 credits
    # Try to deduct 5 credits twice simultaneously
    
    async def deduct():
        try:
            await deduct_credits(
                user_id=test_user.id,
                amount=5,
                transaction_type="generation",
                db=db_session
            )
            return True
        except HTTPException:
            return False
    
    # Run concurrently
    results = await asyncio.gather(deduct(), deduct())
    
    # Only one should succeed
    assert sum(results) == 1
```

---

## 📊 Success Criteria

- [ ] Can deduct credits atomically
- [ ] Can add credits atomically
- [ ] Insufficient credits returns 422
- [ ] Daily bonus claimed successfully
- [ ] Can't claim daily bonus twice
- [ ] Referral bonus awarded correctly
- [ ] Monthly rollover works
- [ ] Rollover limits enforced per plan
- [ ] Transaction history recorded
- [ ] Race conditions prevented (SELECT FOR UPDATE)
- [ ] All tests pass with >90% coverage

---

## 🚀 Implementation Order

1. **Models** (2 hours)
   - CreditTransaction model
   - DailyBonus model

2. **Service - Core** (4 hours)
   - deduct_credits()
   - add_credits()
   - Helper functions

3. **Service - Daily Bonus** (3 hours)
   - claim_daily_bonus()
   - get_daily_bonus_info()
   - get_daily_bonus_amount()

4. **Service - Rollover** (2 hours)
   - get_rollover_limit()
   - process_monthly_rollover()

5. **Service - Referrals** (1 hour)
   - award_referral_bonus()

6. **Routes** (2 hours)
   - POST /claim-daily-bonus

7. **Cron Jobs** (2 hours)
   - Setup APScheduler
   - Monthly rollover job

8. **Tests** (6 hours)
   - All test cases
   - Race condition tests
   - >90% coverage

9. **Integration** (2 hours)
   - Add to main.py
   - Start scheduler

**Total:** ~24 hours (3-4 days)

---

**Module Status:** Ready for implementation  
**Last Updated:** February 4, 2026
