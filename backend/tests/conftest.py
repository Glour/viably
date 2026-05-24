"""Pytest fixtures for backend tests."""

import uuid
from datetime import datetime, timedelta, timezone
from typing import AsyncGenerator
from unittest.mock import patch, MagicMock, AsyncMock

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from api.src.auth.service import create_access_token
from core.utils import generate_referral_code
from api.src.main import app
from infrastructure.database.setup import Base, get_db
from infrastructure.database.models.auth import User
from infrastructure.database.models.credits import CreditTransaction, DailyBonus
from infrastructure.database.models.deploy import Deployment, DeploymentPlatform, DeploymentStatus
from infrastructure.database.models.projects import Project, ProjectStatus
from infrastructure.database.models.templates import Template
from settings.security import hash_password

# Test database URL (in-memory SQLite for testing)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(autouse=True)
def mock_redis_and_rate_limiter():
    """Mock Redis and rate limiter for all tests."""
    # Create a mock identifier function
    async def mock_identifier(request):
        return "test-key"

    # Create a mock callback function
    async def mock_callback(request, response, pexpire):
        return

    # Create async mock for Redis
    mock_redis_client = MagicMock()
    mock_redis_client.evalsha = AsyncMock(return_value=0)  # 0 means not rate limited
    mock_redis_client.ping = AsyncMock(return_value=True)
    mock_redis_client.exists = AsyncMock(return_value=False)  # Token not blacklisted
    mock_redis_client.setex = AsyncMock(return_value=True)  # Set token blacklist
    mock_redis_client.get = AsyncMock(return_value=None)  # No failed login attempts
    mock_redis_client.incr = AsyncMock(return_value=1)  # Increment failed attempts
    mock_redis_client.expire = AsyncMock(return_value=True)  # Set expiration
    mock_redis_client.delete = AsyncMock(return_value=True)  # Delete key

    # Mock the FastAPILimiter class and get_redis function
    with patch("redis.asyncio.from_url") as mock_redis, \
         patch("fastapi_limiter.FastAPILimiter.init"), \
         patch("fastapi_limiter.FastAPILimiter.close"), \
         patch("fastapi_limiter.FastAPILimiter.redis", new=mock_redis_client), \
         patch("fastapi_limiter.FastAPILimiter.identifier", new=mock_identifier), \
         patch("fastapi_limiter.FastAPILimiter.http_callback", new=mock_callback), \
         patch("fastapi_limiter.FastAPILimiter.lua_sha", new="mock-sha"), \
         patch("core.redis.get_redis", new=AsyncMock(return_value=mock_redis_client)):
        mock_redis.return_value = mock_redis_client
        yield


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
    """Create test HTTP client with mocked dependencies."""
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    # Patch rate limiter at import time
    with patch("fastapi_limiter.depends.RateLimiter", return_value=lambda: None):
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
        password_hash=hash_password("Test1234!"),  # Added special character
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
        password_hash=hash_password("Test1234!"),  # Added special character
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


# Project fixtures


@pytest_asyncio.fixture
async def test_project(
    db_session: AsyncSession, test_user: User, test_template: Template
) -> Project:
    """Create a single test project."""
    project = Project(
        id=uuid.uuid4(),
        user_id=test_user.id,
        name="Test Project",
        description="A test project for unit tests",
        template_id=test_template.id,
        config={"bot_name": "TestBot"},
        status=ProjectStatus.DRAFT.value,
        is_public=False,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(project)
    await db_session.commit()
    await db_session.refresh(project)
    return project


@pytest_asyncio.fixture
async def multiple_projects(
    db_session: AsyncSession, test_user: User, test_template: Template
) -> list[Project]:
    """Create multiple test projects for list/pagination tests."""
    now = datetime.now(timezone.utc)
    projects = [
        Project(
            id=uuid.uuid4(),
            user_id=test_user.id,
            name=f"Project {i}",
            description=f"Test project {i}",
            template_id=test_template.id,
            config={"bot_name": f"Bot{i}"},
            status=ProjectStatus.DRAFT.value if i % 2 == 0 else ProjectStatus.READY.value,
            is_public=False,
            created_at=now - timedelta(hours=i),
            updated_at=now - timedelta(hours=i),
        )
        for i in range(25)
    ]
    for project in projects:
        db_session.add(project)
    await db_session.commit()
    for project in projects:
        await db_session.refresh(project)
    return projects


@pytest_asyncio.fixture
async def other_user(db_session: AsyncSession) -> User:
    """Create another test user for access control tests."""
    user = User(
        id=uuid.uuid4(),
        email="other@example.com",
        password_hash=hash_password("Test1234!"),
        full_name="Other User",
        plan="free",
        credits=10,
        referral_code=generate_referral_code(),
        is_active=True,
        is_verified=True,
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
def other_user_token(other_user: User) -> str:
    """Create access token for other user."""
    return create_access_token(other_user.id)


@pytest_asyncio.fixture
async def admin_user(db_session: AsyncSession) -> User:
    """Create an admin test user."""
    user = User(
        id=uuid.uuid4(),
        email="admin@example.com",
        password_hash=hash_password("Admin1234!"),
        full_name="Admin User",
        plan="pro",
        credits=1000,
        referral_code=generate_referral_code(),
        is_active=True,
        is_verified=True,
        is_admin=True,
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
def admin_token(admin_user: User) -> str:
    """Create access token for admin user."""
    return create_access_token(admin_user.id)


@pytest_asyncio.fixture
async def public_project(
    db_session: AsyncSession, test_user: User, test_template: Template
) -> Project:
    """Create a public project for access control tests."""
    project = Project(
        id=uuid.uuid4(),
        user_id=test_user.id,
        name="Public Project",
        description="A public project",
        template_id=test_template.id,
        config={"bot_name": "PublicBot"},
        status=ProjectStatus.READY.value,
        is_public=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(project)
    await db_session.commit()
    await db_session.refresh(project)
    return project


# Deploy module fixtures


@pytest_asyncio.fixture
async def ready_project(
    db_session: AsyncSession, test_user: User, test_template: Template
) -> Project:
    """Create a project in 'ready' status with generated code."""
    project = Project(
        id=uuid.uuid4(),
        user_id=test_user.id,
        name="Ready Project",
        description="A project ready for deployment",
        template_id=test_template.id,
        config={"bot_name": "ReadyBot"},
        status=ProjectStatus.READY.value,
        generated_code={
            "files": {
                "main.py": "print('Hello Bot')",
                "requirements.txt": "python-telegram-bot>=20.0",
            },
            "entry_point": "main.py",
            "runtime": "python3.12",
        },
        is_public=False,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        generated_at=datetime.now(timezone.utc),
    )
    db_session.add(project)
    await db_session.commit()
    await db_session.refresh(project)
    return project


@pytest_asyncio.fixture
async def draft_project(
    db_session: AsyncSession, test_user: User, test_template: Template
) -> Project:
    """Create a project in 'draft' status (not ready for deployment)."""
    project = Project(
        id=uuid.uuid4(),
        user_id=test_user.id,
        name="Draft Project",
        description="A draft project",
        template_id=test_template.id,
        config={"bot_name": "DraftBot"},
        status=ProjectStatus.DRAFT.value,
        is_public=False,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(project)
    await db_session.commit()
    await db_session.refresh(project)
    return project


@pytest_asyncio.fixture
async def deployment(
    db_session: AsyncSession, ready_project: Project
) -> Deployment:
    """Create a basic deployment for testing."""
    deployment = Deployment(
        id=uuid.uuid4(),
        project_id=ready_project.id,
        platform=DeploymentPlatform.DOCKER.value,
        status=DeploymentStatus.PENDING.value,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(deployment)
    await db_session.commit()
    await db_session.refresh(deployment)
    return deployment


@pytest_asyncio.fixture
async def active_deployment(
    db_session: AsyncSession, ready_project: Project
) -> Deployment:
    """Create an active deployment with URL for testing."""
    deployment = Deployment(
        id=uuid.uuid4(),
        project_id=ready_project.id,
        platform=DeploymentPlatform.DOCKER.value,
        external_id="rd-123456",
        status=DeploymentStatus.ACTIVE.value,
        url="http://localhost:8000",
        platform_data={
        },
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        deployed_at=datetime.now(timezone.utc),
    )
    db_session.add(deployment)
    await db_session.commit()
    await db_session.refresh(deployment)
    return deployment


# =============================================================================
# Conversation fixtures
# =============================================================================


@pytest_asyncio.fixture
async def test_conversation(
    db_session: AsyncSession, test_project: Project, test_user: User
) -> "Conversation":
    """Create a test conversation."""
    from infrastructure.database.models.conversations import Conversation

    conversation = Conversation(
        id=uuid.uuid4(),
        project_id=test_project.id,
        user_id=test_user.id,
        title="Test Conversation",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(conversation)
    await db_session.commit()
    await db_session.refresh(conversation)
    return conversation


# =============================================================================
# Mock External Service Clients
# =============================================================================

@pytest.fixture
def mock_anthropic_client():
    """Mock Anthropic client for testing."""
    from tests.mocks import get_mock_anthropic_client
    return get_mock_anthropic_client()




@pytest.fixture
def mock_resend_client():
    """Mock Resend client for testing."""
    from tests.mocks import get_mock_resend_client
    return get_mock_resend_client()
