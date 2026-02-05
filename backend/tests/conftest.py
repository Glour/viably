"""Pytest fixtures for backend tests."""

import uuid
from datetime import datetime, timedelta, timezone
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.auth.models import User
from app.auth.service import create_access_token, generate_referral_code, hash_password
from app.core.database import Base, get_db
from app.main import app
from app.templates.models import Template
from app.credits.models import CreditTransaction, DailyBonus

# Test database URL (in-memory SQLite for testing)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture
async def db_engine():
    """Create test database engine."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(db_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create test database session."""
    async_session = sessionmaker(
        db_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    async with async_session() as session:
        yield session


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create test HTTP client."""

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        yield client

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create a test user."""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        password_hash=hash_password("Test1234"),
        full_name="Test User",
        avatar_url="https://example.com/avatar.jpg",
        plan="starter",
        credits=100,
        referral_code=generate_referral_code(),
        is_active=True,
        is_verified=True,
        created_at=datetime.now(timezone.utc),
        last_login_at=datetime.now(timezone.utc),
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def inactive_user(db_session: AsyncSession) -> User:
    """Create an inactive test user."""
    user = User(
        id=uuid.uuid4(),
        email="inactive@example.com",
        password_hash=hash_password("Test1234"),
        full_name="Inactive User",
        plan="free",
        credits=5,
        referral_code=generate_referral_code(),
        is_active=False,
        is_verified=True,
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
def auth_token(test_user: User) -> str:
    """Create access token for test user."""
    return create_access_token(test_user.id)


@pytest.fixture
def inactive_user_token(inactive_user: User) -> str:
    """Create access token for inactive user."""
    return create_access_token(inactive_user.id)


@pytest_asyncio.fixture
async def user_with_transactions(db_session: AsyncSession, test_user: User) -> User:
    """Create test user with transaction history."""
    # Add some transactions
    now = datetime.now(timezone.utc)
    transactions = [
        CreditTransaction(
            id=uuid.uuid4(),
            user_id=test_user.id,
            amount=3,
            balance_after=103,
            transaction_type="daily_bonus",
            description="Daily bonus",
            created_at=now - timedelta(hours=1),
        ),
        CreditTransaction(
            id=uuid.uuid4(),
            user_id=test_user.id,
            amount=-5,
            balance_after=98,
            transaction_type="generation",
            description="Generated project",
            project_id=uuid.uuid4(),
            created_at=now - timedelta(hours=2),
        ),
        CreditTransaction(
            id=uuid.uuid4(),
            user_id=test_user.id,
            amount=50,
            balance_after=103,
            transaction_type="purchase",
            description="Credit purchase",
            created_at=now - timedelta(days=1),
        ),
    ]
    for tx in transactions:
        db_session.add(tx)
    await db_session.commit()
    return test_user


@pytest_asyncio.fixture
async def user_with_today_bonus(db_session: AsyncSession, test_user: User) -> User:
    """Create test user who already claimed daily bonus today."""
    now = datetime.now(timezone.utc)
    today = now.date()

    # Create DailyBonus record
    bonus_record = DailyBonus(
        id=uuid.uuid4(),
        user_id=test_user.id,
        credits_awarded=3,
        bonus_date=today,
        created_at=now,
    )
    db_session.add(bonus_record)

    # Create corresponding transaction
    bonus_tx = CreditTransaction(
        id=uuid.uuid4(),
        user_id=test_user.id,
        amount=3,
        balance_after=103,
        transaction_type="daily_bonus",
        description="Daily bonus",
        created_at=now,
    )
    db_session.add(bonus_tx)
    await db_session.commit()
    return test_user


# Template fixtures


@pytest_asyncio.fixture
async def test_template(db_session: AsyncSession) -> Template:
    """Create a single test template."""
    template = Template(
        id=uuid.uuid4(),
        name="Test Template",
        slug="test-template",
        description="A test template for unit tests",
        category="telegram_bot",
        credit_cost=5,
        config_schema={
            "type": "object",
            "properties": {
                "bot_name": {"type": "string", "title": "Bot Name"},
            },
            "required": ["bot_name"],
        },
        prompt_template="Create a bot named {{bot_name}}",
        features=["Feature 1", "Feature 2"],
        tags=["test", "telegram"],
        usage_count=10,
        is_active=True,
        sort_order=1,
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(template)
    await db_session.commit()
    await db_session.refresh(template)
    return template


@pytest_asyncio.fixture
async def inactive_template(db_session: AsyncSession) -> Template:
    """Create an inactive test template."""
    template = Template(
        id=uuid.uuid4(),
        name="Inactive Template",
        slug="inactive-template",
        description="An inactive template",
        category="telegram_bot",
        credit_cost=3,
        config_schema={"type": "object", "properties": {}},
        prompt_template="Inactive prompt",
        features=[],
        tags=["inactive"],
        usage_count=0,
        is_active=False,
        sort_order=99,
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(template)
    await db_session.commit()
    await db_session.refresh(template)
    return template


@pytest_asyncio.fixture
async def multiple_templates(db_session: AsyncSession) -> list[Template]:
    """Create multiple test templates for list/filter tests."""
    templates = [
        Template(
            id=uuid.uuid4(),
            name="FAQ Bot",
            slug="faq-bot",
            description="Simple Q&A bot",
            category="telegram_bot",
            credit_cost=3,
            config_schema={"type": "object", "properties": {}},
            prompt_template="FAQ prompt",
            features=["Inline keyboard"],
            tags=["telegram", "faq"],
            usage_count=100,
            is_active=True,
            sort_order=1,
            created_at=datetime.now(timezone.utc),
        ),
        Template(
            id=uuid.uuid4(),
            name="Shop Bot",
            slug="shop-bot",
            description="E-commerce bot with catalog",
            category="telegram_bot",
            credit_cost=5,
            config_schema={"type": "object", "properties": {}},
            prompt_template="Shop prompt",
            features=["Product catalog", "Cart"],
            tags=["telegram", "ecommerce"],
            usage_count=50,
            is_active=True,
            sort_order=2,
            created_at=datetime.now(timezone.utc),
        ),
        Template(
            id=uuid.uuid4(),
            name="API Service",
            slug="api-service",
            description="REST API service template",
            category="api_service",
            credit_cost=10,
            config_schema={"type": "object", "properties": {}},
            prompt_template="API prompt",
            features=["REST endpoints"],
            tags=["api", "backend"],
            usage_count=25,
            is_active=True,
            sort_order=3,
            created_at=datetime.now(timezone.utc),
        ),
    ]
    for template in templates:
        db_session.add(template)
    await db_session.commit()
    for template in templates:
        await db_session.refresh(template)
    return templates
