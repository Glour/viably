"""
Viably Proxy — Anthropic API proxy для Viably.

Один product key, OAT пул, ротация, usage в response headers.
Никакой кредитной системы — Viably сам считает usage.
"""

import json
import logging
import os
import time
from typing import AsyncGenerator

import httpx
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import Response, StreamingResponse
from redis.asyncio import Redis

from app.config import settings
from app.pool import TokenPool, NoTokensError, AllTokensExhaustedError

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("viably-proxy")

ANTHROPIC_API_BASE = settings.ANTHROPIC_API_BASE.rstrip("/")
MAX_RETRIES = 3

CLAUDE_CODE_SYSTEM = "You are Claude Code, Anthropic's official CLI for Claude."


# ── Lifespan ──────────────────────────────────────────────────────────────────

async def lifespan(app: FastAPI):
    redis = Redis.from_url(settings.REDIS_URL, decode_responses=True)
    pool = TokenPool(redis)
    seeded = 0
    for i in range(1, 30):
        token = os.environ.get(f"OAT_TOKEN_{i}", "")
        if token and token.startswith("sk-ant-"):
            if await pool.add_token(token):
                seeded += 1
    stats = await pool.stats()
    logger.info(f"Пул готов: {stats['pool_size']} токенов, {stats['available']} доступно (добавлено {seeded})")
    await redis.aclose()
    yield


app = FastAPI(title="Viably Proxy", version="1.0.0", lifespan=lifespan)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _verify_key(request: Request) -> None:
    key = request.headers.get("x-api-key", "")
    if not settings.PRODUCT_KEY or key != settings.PRODUCT_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")


def _oat_headers(token: str, anthropic_version: str) -> dict:
    return {
        "Authorization": f"Bearer {token}",
        "anthropic-version": anthropic_version,
        "anthropic-beta": "claude-code-20250219,oauth-2025-04-20,fine-grained-tool-streaming-2025-05-14",
        "user-agent": "claude-cli/2.1.75",
        "x-app": "cli",
        "anthropic-dangerous-direct-browser-access": "true",
        "content-type": "application/json",
    }


def _inject_system(body: dict) -> dict:
    system = body.get("system")
    cc = {"type": "text", "text": CLAUDE_CODE_SYSTEM}
    if system is None:
        body["system"] = [cc]
    elif isinstance(system, list):
        if not any("Claude Code" in (b.get("text", "") or "") for b in system):
            body["system"] = [cc] + system
    elif isinstance(system, str):
        if "Claude Code" not in system:
            body["system"] = [cc, {"type": "text", "text": system}]
    return body


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "service": "viably-proxy", "version": "1.0.0"}


# ── Admin ─────────────────────────────────────────────────────────────────────

@app.get("/admin/pool")
async def admin_pool(request: Request):
    key = request.headers.get("x-admin-key", "")
    if not settings.ADMIN_KEY or key != settings.ADMIN_KEY:
        raise HTTPException(status_code=403)
    redis = Redis.from_url(settings.REDIS_URL, decode_responses=True)
    try:
        return await TokenPool(redis).stats()
    finally:
        await redis.aclose()


@app.post("/admin/pool/add")
async def admin_pool_add(request: Request):
    key = request.headers.get("x-admin-key", "")
    if not settings.ADMIN_KEY or key != settings.ADMIN_KEY:
        raise HTTPException(status_code=403)
    body = await request.json()
    token = body.get("token", "")
    if not token.startswith("sk-ant-"):
        raise HTTPException(status_code=400, detail="Invalid token")
    redis = Redis.from_url(settings.REDIS_URL, decode_responses=True)
    try:
        added = await TokenPool(redis).add_token(token)
        return {"added": added, "suffix": f"...{token[-8:]}"}
    finally:
        await redis.aclose()


# ── Proxy ─────────────────────────────────────────────────────────────────────

@app.post("/v1/messages")
async def proxy_messages(request: Request):
    start = time.monotonic()
    _verify_key(request)

    body = await request.json()
    body = _inject_system(body)
    is_stream = body.get("stream", False)
    anthropic_version = request.headers.get("anthropic-version", "2023-06-01")

    redis = Redis.from_url(settings.REDIS_URL, decode_responses=True)
    try:
        pool = TokenPool(redis)

        if is_stream:
            return await _handle_streaming(body, pool, anthropic_version)
        else:
            return await _handle_sync(body, pool, anthropic_version, start)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка прокси: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal proxy error")
    finally:
        await redis.aclose()


async def _handle_sync(body: dict, pool: TokenPool, av: str, start: float):
    last_error = None

    for attempt in range(MAX_RETRIES):
        try:
            token = await pool.get_token()
        except (NoTokensError, AllTokensExhaustedError) as e:
            raise HTTPException(status_code=503, detail=str(e))

        headers = _oat_headers(token, av)

        try:
            async with httpx.AsyncClient(timeout=180.0) as client:
                resp = await client.post(
                    f"{ANTHROPIC_API_BASE}/v1/messages",
                    content=json.dumps(body),
                    headers=headers,
                )

            if resp.status_code == 429:
                await pool.report_429(token, int(resp.headers.get("retry-after", "60")))
                last_error = "429"
                continue
            if resp.status_code == 402:
                await pool.report_402(token)
                last_error = "402"
                continue
            if resp.status_code == 529:
                await pool.report_429(token, 30)
                last_error = "529"
                continue
            if resp.status_code >= 500:
                last_error = str(resp.status_code)
                continue

            latency = int((time.monotonic() - start) * 1000)
            usage = resp.json().get("usage", {}) if resp.status_code == 200 else {}
            logger.info(
                f"OK {usage.get('input_tokens',0)}in/{usage.get('output_tokens',0)}out {latency}ms"
            )
            return Response(
                content=resp.content,
                status_code=resp.status_code,
                media_type="application/json",
                headers={
                    "X-Tokens-Input": str(usage.get("input_tokens", 0)),
                    "X-Tokens-Output": str(usage.get("output_tokens", 0)),
                    "X-Latency-Ms": str(latency),
                },
            )

        except httpx.TimeoutException:
            last_error = "timeout"
            continue

    raise HTTPException(status_code=502, detail=f"All retries failed ({last_error})")


async def _handle_streaming(body: dict, pool: TokenPool, av: str):
    try:
        token = await pool.get_token()
    except (NoTokensError, AllTokensExhaustedError) as e:
        raise HTTPException(status_code=503, detail=str(e))

    headers = _oat_headers(token, av)

    async def gen() -> AsyncGenerator[bytes, None]:
        _token = token
        _headers = headers

        for try_num in range(MAX_RETRIES):
            if try_num > 0:
                try:
                    _token = await pool.get_token()
                    _headers = _oat_headers(_token, av)
                except (NoTokensError, AllTokensExhaustedError) as e:
                    yield f"data: {json.dumps({'type':'error','error':{'type':'proxy_error','message':str(e)}})}\n\n".encode()
                    return

            try:
                async with httpx.AsyncClient(timeout=180.0) as client:
                    async with client.stream(
                        "POST", f"{ANTHROPIC_API_BASE}/v1/messages",
                        content=json.dumps(body), headers=_headers,
                    ) as resp:
                        if resp.status_code == 429:
                            await pool.report_429(_token, int(resp.headers.get("retry-after", "60")))
                            continue
                        if resp.status_code == 402:
                            await pool.report_402(_token)
                            continue
                        if resp.status_code == 529:
                            await pool.report_429(_token, 30)
                            continue
                        if resp.status_code >= 400:
                            err = await resp.aread()
                            yield err
                            return

                        async for chunk in resp.aiter_bytes():
                            yield chunk
                        return

            except Exception as e:
                logger.error(f"Stream attempt {try_num+1}: {e}")
                if try_num == MAX_RETRIES - 1:
                    yield f"data: {json.dumps({'type':'error','error':{'type':'proxy_error','message':str(e)}})}\n\n".encode()

    return StreamingResponse(
        gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
