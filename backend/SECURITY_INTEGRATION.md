# Security Layer Integration for Viably

This document describes the security infrastructure ported from VibeGent and how to integrate it with Viably's AI generation flow.

## Components

### 1. Security Middleware (`api/src/proxy/security.py`)

Features:
- Model whitelist (Claude models only)
- max_tokens cap per plan tier
- Request size limit (500KB)
- Prompt injection detection
- Rate limiting (RPM/RPD/concurrent) via Redis
- Cost guard (estimate + check balance)
- Abuse detection (error tracking, cost drain)

### 2. OAuth Account Pool (`api/src/proxy/oauth_pool.py`)

Features:
- Pool of Claude subscription accounts (Bearer tokens)
- Smart round-robin selection with health tracking
- Retry on failure with next account
- Redis cache for rate limit tracking
- Fallback to API key if pool empty

### 3. Audit Logging (`api/src/proxy/audit.py`)

Features:
- Log every AI request to Redis
- User-specific logs (last 1000)
- Global audit log (last 10000)
- Statistics and analytics

### 4. Admin API (`api/src/admin/routes.py`)

Endpoints:
- `POST /api/admin/oauth-accounts` — add OAuth account
- `GET /api/admin/oauth-accounts` — list accounts
- `PATCH /api/admin/oauth-accounts/{id}` — update account
- `DELETE /api/admin/oauth-accounts/{id}` — delete account
- `GET /api/admin/oauth-status` — pool health dashboard
- `GET /api/admin/audit-log` — query audit logs
- `GET /api/admin/audit-stats` — usage statistics
- `GET /api/admin/rate-limits` — rate limit monitoring

All admin endpoints require `is_admin=True` on User model.

## Integration with AI Service

### Option 1: Full Integration (Recommended for Production)

Wrap AI calls in `secure_ai_request()` and `log_ai_request()`:

```python
from api.src.proxy.secured_ai import secure_ai_request, log_ai_request
from core.redis import get_redis

async def send_message_streaming(...):
    redis = await get_redis()
    start_time = time.time()
    
    # Security checks
    body, concurrent_key = await secure_ai_request(
        user=user,
        conversation_id=conversation_id,
        model=model,
        messages=messages,
        max_tokens=max_tokens,
        redis=redis,
        db=db,
    )
    
    try:
        # Make AI request with secured body
        response = await anthropic_client.messages.create(...)
        
        # Track usage
        duration_ms = int((time.time() - start_time) * 1000)
        await log_ai_request(
            user_id=user.id,
            conversation_id=conversation_id,
            model=model,
            tokens_input=usage.input_tokens,
            tokens_output=usage.output_tokens,
            cost=cost,
            duration_ms=duration_ms,
            redis=redis,
        )
        
    finally:
        # Cleanup concurrent counter
        from api.src.proxy.security import cleanup_concurrent
        await cleanup_concurrent(redis, concurrent_key)
```

### Option 2: OAuth Pool Only

To use OAuth pool without full security layer:

```python
from api.src.proxy.oauth_pool import OAuthPoolService
from core.redis import get_redis

async def send_message_streaming(...):
    redis = await get_redis()
    pool_service = OAuthPoolService(db, redis)
    
    # Try to get OAuth account
    account = await pool_service.select_account(model)
    
    if account:
        # Use OAuth Bearer token
        headers = {"Authorization": f"Bearer {account.access_token}"}
        # Make request...
        # Update rate limits from response
        await pool_service.update_rate_limits(account.id, response.headers)
    else:
        # Fallback to API key
        # Make request with API key...
```

### Option 3: Security Checks Only

For gradual rollout, add only security checks:

```python
from api.src.proxy.security import (
    check_model_whitelist,
    check_rate_limits,
    check_cost_guard,
    cleanup_concurrent,
)
from core.redis import get_redis

async def send_message_streaming(...):
    redis = await get_redis()
    
    # Basic security
    await check_model_whitelist(model)
    concurrent_key = await check_rate_limits(redis, user.id, user.plan)
    await check_cost_guard(redis, user.id, user.credits, messages, max_tokens)
    
    try:
        # Make AI request...
    finally:
        await cleanup_concurrent(redis, concurrent_key)
```

## Rate Limits by Plan

```python
RATE_LIMITS = {
    "free":     {"rpm": 5,  "rpd": 50,   "concurrent": 1},
    "starter":  {"rpm": 20, "rpd": 500,  "concurrent": 3},
    "pro":      {"rpm": 40, "rpd": 2000, "concurrent": 5},
    "business": {"rpm": 80, "rpd": 5000, "concurrent": 10},
}
```

## Redis Keys

All Redis keys use `viably:` prefix:

- `viably:rate:{user_id}:rpm` — requests per minute counter
- `viably:rate:{user_id}:rpd` — requests per day counter
- `viably:rate:{user_id}:concurrent` — concurrent requests counter
- `viably:abuse:{user_id}:blocked` — temporary block flag
- `viably:abuse:{user_id}:errors_1h` — error count (last hour)
- `viably:abuse:{user_id}:cost_1h` — cost tracking (last hour)
- `viably:audit:{user_id}` — user-specific audit log
- `viably:audit:global` — global audit log
- `viably:oauth:account:{id}:*` — OAuth account cache

## Testing

1. **Test OAuth Pool**:
   ```bash
   # Add test account
   curl -X POST http://localhost:8000/api/admin/oauth-accounts \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "test-account",
       "access_token": "sk-ant-...",
       "refresh_token": "refresh_token_here",
       "priority": 0
     }'
   
   # Check pool status
   curl http://localhost:8000/api/admin/oauth-status \
     -H "Authorization: Bearer $ADMIN_TOKEN"
   ```

2. **Test Rate Limits**:
   ```bash
   # Make multiple requests quickly
   for i in {1..10}; do
     curl -X POST http://localhost:8000/api/conversations \
       -H "Authorization: Bearer $USER_TOKEN" \
       -d '{"message": "test"}'
   done
   
   # Check rate limit status
   curl "http://localhost:8000/api/admin/rate-limits?user_id=$USER_ID" \
     -H "Authorization: Bearer $ADMIN_TOKEN"
   ```

3. **Test Audit Logs**:
   ```bash
   # Query audit logs
   curl "http://localhost:8000/api/admin/audit-log?limit=50" \
     -H "Authorization: Bearer $ADMIN_TOKEN"
   
   # Get stats
   curl http://localhost:8000/api/admin/audit-stats \
     -H "Authorization: Bearer $ADMIN_TOKEN"
   ```

## Migration Checklist

- [x] Create proxy module structure
- [x] Port security.py (rate limits, cost guard, abuse detection)
- [x] Port oauth_pool.py (OAuth account pool with Redis cache)
- [x] Port audit.py (audit logging service)
- [x] Create OAuthAccount model + migration
- [x] Create admin routes (CRUD + monitoring)
- [x] Add admin router to main.py
- [ ] Integrate security checks into ai_service.py
- [ ] Test rate limiting
- [ ] Test OAuth pool
- [ ] Test audit logging
- [ ] Deploy to dev
- [ ] Monitor for issues

## Environment Variables

No new environment variables required. Uses existing:
- `ANTHROPIC_API_KEY` — fallback when OAuth pool empty
- `CELERY_BROKER_URL` — Redis connection (reused)

## Deployment

```bash
# Rebuild backend
cd /home/viably
docker compose build backend-dev
docker compose up -d backend-dev

# Check logs
docker logs viably-backend-dev --tail 50

# Verify health
curl http://localhost:8000/health
```

## Monitoring

Check Redis for security metrics:
```bash
redis-cli --scan --pattern "viably:*"
```

Monitor audit logs:
```bash
curl http://localhost:8000/api/admin/audit-stats \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Next Steps

1. Add security wrapper to ai_service.py (gradual rollout)
2. Add OAuth accounts to pool
3. Monitor rate limits and adjust if needed
4. Set up alerts for abuse detection
5. Consider moving to separate token proxy service (future)
