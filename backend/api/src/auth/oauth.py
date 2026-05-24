"""OAuth authentication routes for Google and GitHub."""

import logging
import secrets
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from api.src.auth.service import create_access_token, create_refresh_token
from infrastructure.database.models.auth import User
from infrastructure.database.repositories.user_repository import UserRepository
from infrastructure.database.setup import get_db
from settings.config import settings
from core.utils import generate_unique_referral_code

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/oauth", tags=["oauth"])

# ---------------------------------------------------------------------------
# Google OAuth
# ---------------------------------------------------------------------------

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


@router.get("/google")
async def google_login():
    """Redirect user to Google OAuth consent screen."""
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": f"{settings.OAUTH_REDIRECT_BASE}/api/auth/oauth/google/callback",
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "state": secrets.token_urlsafe(32),
    }
    return RedirectResponse(f"{GOOGLE_AUTH_URL}?{urlencode(params)}")


@router.get("/google/callback")
async def google_callback(code: str, db: AsyncSession = Depends(get_db)):
    """Handle Google OAuth callback."""
    # Exchange code for tokens
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": f"{settings.OAUTH_REDIRECT_BASE}/api/auth/oauth/google/callback",
                "grant_type": "authorization_code",
            },
        )
        if token_resp.status_code != 200:
            logger.error("Google token exchange failed: %s", token_resp.text)
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OAuth token exchange failed")

        tokens = token_resp.json()

        # Get user info
        userinfo_resp = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
        )
        if userinfo_resp.status_code != 200:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to get user info")

        userinfo = userinfo_resp.json()

    email = userinfo.get("email")
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email not provided by Google")

    full_name = userinfo.get("name")
    avatar_url = userinfo.get("picture")
    
    user = await _get_or_create_oauth_user(
        email=email, 
        full_name=full_name, 
        avatar_url=avatar_url,
        oauth_provider="google",
        db=db
    )
    return await _build_auth_redirect(user)


# ---------------------------------------------------------------------------
# GitHub OAuth
# ---------------------------------------------------------------------------

GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"
GITHUB_EMAILS_URL = "https://api.github.com/user/emails"


@router.get("/github")
async def github_login():
    """Redirect user to GitHub OAuth consent screen with extended scopes."""
    # Extended scopes for full GitHub integration:
    # - user:email: Access user's email addresses
    # - repo: Full control of repositories (create, push, etc.)
    # - workflow: Update GitHub Actions workflows
    params = {
        "client_id": settings.GITHUB_CLIENT_ID,
        "redirect_uri": f"{settings.OAUTH_REDIRECT_BASE}/api/auth/oauth/github/callback",
        "scope": "user:email repo workflow",
        "state": secrets.token_urlsafe(32),
    }
    return RedirectResponse(f"{GITHUB_AUTH_URL}?{urlencode(params)}")


@router.get("/github/callback")
async def github_callback(code: str, db: AsyncSession = Depends(get_db)):
    """Handle GitHub OAuth callback and save access token."""
    async with httpx.AsyncClient() as client:
        # Exchange code for token
        token_resp = await client.post(
            GITHUB_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "redirect_uri": f"{settings.OAUTH_REDIRECT_BASE}/api/auth/oauth/github/callback",
            },
            headers={"Accept": "application/json"},
        )
        if token_resp.status_code != 200:
            logger.error("GitHub token exchange failed: %s", token_resp.text)
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OAuth token exchange failed")

        tokens = token_resp.json()
        access_token = tokens.get("access_token")
        if not access_token:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No access token from GitHub")

        headers = {"Authorization": f"Bearer {access_token}", "Accept": "application/json"}

        # Get user profile
        user_resp = await client.get(GITHUB_USER_URL, headers=headers)
        user_data = user_resp.json()

        # Get primary email (may be private)
        email = user_data.get("email")
        if not email:
            emails_resp = await client.get(GITHUB_EMAILS_URL, headers=headers)
            if emails_resp.status_code == 200:
                for e in emails_resp.json():
                    if e.get("primary") and e.get("verified"):
                        email = e["email"]
                        break

        if not email:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email not provided by GitHub")

    full_name = user_data.get("name")
    avatar_url = user_data.get("avatar_url")
    github_username = user_data.get("login")
    
    user = await _get_or_create_oauth_user(
        email=email,
        full_name=full_name,
        avatar_url=avatar_url,
        oauth_provider="github",
        github_access_token=access_token,
        github_username=github_username,
        db=db
    )
    return await _build_auth_redirect(user)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _get_or_create_oauth_user(
    email: str,
    full_name: str | None,
    oauth_provider: str,
    db: AsyncSession,
    avatar_url: str | None = None,
    github_access_token: str | None = None,
    github_username: str | None = None,
) -> User:
    """Find existing user by email or create a new one.
    
    If user exists and logs in via OAuth, update their OAuth fields.
    This allows linking OAuth accounts to existing email/password accounts.
    """
    repo = UserRepository(db)
    user = await repo.get_by_email(email.lower())

    if user:
        # Update OAuth fields for existing user (account linking)
        user.oauth_provider = oauth_provider
        if avatar_url and not user.avatar_url:
            user.avatar_url = avatar_url
        if oauth_provider == "github":
            user.github_access_token = github_access_token
            user.github_username = github_username
        
        await db.commit()
        await db.refresh(user)
        logger.info("OAuth login for existing user %s (provider: %s)", user.id, oauth_provider)
        return user

    # Create new user (no password — OAuth only)
    unique_code = await generate_unique_referral_code(db)
    user = User(
        email=email.lower(),
        password_hash="",  # No password for OAuth users
        full_name=full_name,
        avatar_url=avatar_url,
        oauth_provider=oauth_provider,
        github_access_token=github_access_token if oauth_provider == "github" else None,
        github_username=github_username if oauth_provider == "github" else None,
        referral_code=unique_code,
        credits=5,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    logger.info("New OAuth user created: %s (id=%s, provider=%s)", email, user.id, oauth_provider)
    return user


async def _build_auth_redirect(user: User) -> RedirectResponse:
    """Build redirect to frontend with JWT token."""
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    redirect_url = (
        f"{settings.OAUTH_REDIRECT_BASE}/auth/callback"
        f"?token={access_token}&refresh_token={refresh_token}"
    )
    return RedirectResponse(url=redirect_url)
