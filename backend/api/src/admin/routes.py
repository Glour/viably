"""Admin routes for Viably - OAuth pool management and audit logs."""

import structlog
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from api.src.auth.deps import get_current_admin_user
from infrastructure.database.models.auth import User
from infrastructure.database.models.oauth_account import OAuthAccount
from infrastructure.database.setup import get_db
from api.src.proxy.audit import AuditLogService
from api.src.proxy.oauth_pool import OAuthPoolService
from core.redis import get_redis

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ======================== SCHEMAS ========================


class OAuthAccountCreate(BaseModel):
    """Schema for creating OAuth account."""

    name: str
    access_token: str
    refresh_token: str
    token_expires_at: Optional[datetime] = None
    priority: int = 0


class OAuthAccountUpdate(BaseModel):
    """Schema for updating OAuth account."""

    name: Optional[str] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    token_expires_at: Optional[datetime] = None
    is_active: Optional[bool] = None
    priority: Optional[int] = None


class OAuthAccountResponse(BaseModel):
    """Schema for OAuth account response."""

    id: UUID
    name: str
    is_active: bool
    priority: int
    rate_limit_requests: Optional[int]
    rate_limit_remaining: Optional[int]
    rate_limit_reset: Optional[datetime]
    rate_limit_tokens: Optional[int]
    rate_limit_remaining_tokens: Optional[int]
    requests_today: int
    requests_total: int
    last_used_at: Optional[datetime]
    last_error: Optional[str]
    last_error_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# ======================== OAUTH ACCOUNT CRUD ========================


@router.post("/oauth-accounts", response_model=OAuthAccountResponse)
async def create_oauth_account(
    account: OAuthAccountCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    """Create new OAuth account (admin only)."""
    new_account = OAuthAccount(
        name=account.name,
        access_token=account.access_token,
        refresh_token=account.refresh_token,
        token_expires_at=account.token_expires_at,
        priority=account.priority,
    )

    db.add(new_account)
    await db.commit()
    await db.refresh(new_account)

    logger.info("OAuth account created", name=account.name, admin_id=str(admin.id))

    return new_account


@router.get("/oauth-accounts", response_model=List[OAuthAccountResponse])
async def list_oauth_accounts(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    """List all OAuth accounts (admin only)."""
    result = await db.execute(select(OAuthAccount))
    accounts = result.scalars().all()

    return accounts


@router.get("/oauth-accounts/{account_id}", response_model=OAuthAccountResponse)
async def get_oauth_account(
    account_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    """Get OAuth account by ID (admin only)."""
    account = await db.get(OAuthAccount, account_id)

    if not account:
        raise HTTPException(status_code=404, detail="OAuth account not found")

    return account


@router.patch("/oauth-accounts/{account_id}", response_model=OAuthAccountResponse)
async def update_oauth_account(
    account_id: UUID,
    updates: OAuthAccountUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    """Update OAuth account (admin only)."""
    account = await db.get(OAuthAccount, account_id)

    if not account:
        raise HTTPException(status_code=404, detail="OAuth account not found")

    # Apply updates
    for field, value in updates.dict(exclude_unset=True).items():
        setattr(account, field, value)

    await db.commit()
    await db.refresh(account)

    logger.info(
        "OAuth account updated",
        account_id=str(account_id),
        admin_id=str(admin.id),
    )

    return account


@router.delete("/oauth-accounts/{account_id}")
async def delete_oauth_account(
    account_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    """Delete OAuth account (admin only)."""
    result = await db.execute(
        delete(OAuthAccount).where(OAuthAccount.id == account_id)
    )

    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="OAuth account not found")

    await db.commit()

    logger.info(
        "OAuth account deleted",
        account_id=str(account_id),
        admin_id=str(admin.id),
    )

    return {"status": "deleted", "id": str(account_id)}


@router.get("/oauth-status")
async def get_oauth_status(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    """Get OAuth pool status (admin only)."""
    redis = await get_redis()
    pool_service = OAuthPoolService(db, redis)

    status = await pool_service.get_pool_status()

    return status


@router.get("/key-pool-status")
async def get_key_pool_status(
    admin: User = Depends(get_current_admin_user),
):
    """Get API key pool rotation status (admin only)."""
    from api.src.proxy.key_pool import ApiKeyPool
    from settings.config import settings

    redis = await get_redis()
    pool = ApiKeyPool(redis)
    keys = settings.ANTHROPIC_API_KEY_POOL
    if not keys and settings.ANTHROPIC_API_KEY:
        keys = [settings.ANTHROPIC_API_KEY]

    status = await pool.get_pool_status(keys)
    return status


# ======================== AUDIT LOG ENDPOINTS ========================


@router.get("/audit-log")
async def get_audit_log(
    user_id: Optional[UUID] = Query(None, description="Filter by user ID"),
    limit: int = Query(100, ge=1, le=1000, description="Number of entries"),
    admin: User = Depends(get_current_admin_user),
):
    """Get audit logs (admin only)."""
    redis = await get_redis()
    audit_service = AuditLogService(redis)

    if user_id:
        logs = await audit_service.get_user_logs(user_id, limit=limit)
    else:
        logs = await audit_service.get_global_logs(limit=limit)

    return {"logs": logs, "count": len(logs)}


@router.get("/audit-stats")
async def get_audit_stats(
    user_id: Optional[UUID] = Query(None, description="Filter by user ID"),
    admin: User = Depends(get_current_admin_user),
):
    """Get audit statistics (admin only)."""
    redis = await get_redis()
    audit_service = AuditLogService(redis)

    stats = await audit_service.get_stats(user_id=user_id)

    return stats


# ======================== RATE LIMIT MONITORING ========================


@router.get("/rate-limits")
async def get_rate_limits(
    user_id: Optional[UUID] = Query(None, description="Filter by user ID"),
    admin: User = Depends(get_current_admin_user),
):
    """View current rate limit status per user (admin only)."""
    redis = await get_redis()

    if user_id:
        str_user_id = str(user_id)
        rpm_key = f"viably:rate:{str_user_id}:rpm"
        rpd_key = f"viably:rate:{str_user_id}:rpd"
        concurrent_key = f"viably:rate:{str_user_id}:concurrent"

        rpm_count = await redis.get(rpm_key) or 0
        rpd_count = await redis.get(rpd_key) or 0
        concurrent_count = await redis.get(concurrent_key) or 0
        rpm_ttl = await redis.ttl(rpm_key) or 0
        rpd_ttl = await redis.ttl(rpd_key) or 0

        return {
            "user_id": str_user_id,
            "requests_per_minute": int(rpm_count),
            "requests_per_day": int(rpd_count),
            "concurrent_requests": int(concurrent_count),
            "rpm_reset_in_seconds": max(0, rpm_ttl),
            "rpd_reset_in_seconds": max(0, rpd_ttl),
        }
    else:
        # Get all users with rate limits (scan Redis keys)
        pattern = "viably:rate:*:rpm"
        user_limits = {}

        async for key in redis.scan_iter(match=pattern):
            # Extract user_id from key
            parts = key.split(":")
            if len(parts) >= 3:
                uid = parts[2]
                if uid not in user_limits:
                    rpm_count = await redis.get(f"viably:rate:{uid}:rpm") or 0
                    rpd_count = await redis.get(f"viably:rate:{uid}:rpd") or 0
                    concurrent = await redis.get(f"viably:rate:{uid}:concurrent") or 0

                    user_limits[uid] = {
                        "user_id": uid,
                        "requests_per_minute": int(rpm_count),
                        "requests_per_day": int(rpd_count),
                        "concurrent_requests": int(concurrent),
                    }

        return {"users": list(user_limits.values()), "count": len(user_limits)}
