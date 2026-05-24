"""GitHub integration API endpoints."""

import base64
import logging
from typing import Annotated

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from api.src.auth.deps import get_current_user
from infrastructure.database.models.auth import User
from infrastructure.database.setup import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/github", tags=["github"])

GITHUB_API_BASE = "https://api.github.com"


# ---------------------------------------------------------------------------
# Request/Response Schemas
# ---------------------------------------------------------------------------

class CreateRepoRequest(BaseModel):
    """Request schema for creating a GitHub repository."""
    project_id: str
    repo_name: str
    description: str | None = None
    private: bool = False


class CreateRepoResponse(BaseModel):
    """Response schema for repository creation."""
    success: bool
    repo_url: str
    repo_full_name: str


class PushCodeRequest(BaseModel):
    """Request schema for pushing code to GitHub."""
    repo_full_name: str  # Format: "username/repo-name"
    files: dict[str, str]  # {"path/to/file.js": "file content"}
    commit_message: str = "Initial commit from Viably"
    branch: str = "main"


class PushCodeResponse(BaseModel):
    """Response schema for code push."""
    success: bool
    commit_sha: str
    commit_url: str


class SetupActionsRequest(BaseModel):
    """Request schema for setting up GitHub Actions."""
    repo_full_name: str
    workflow_name: str = "deploy.yml"
    deploy_command: str = "npm run build"  # Command to run on deploy


class SetupActionsResponse(BaseModel):
    """Response schema for GitHub Actions setup."""
    success: bool
    workflow_url: str


# ---------------------------------------------------------------------------
# Helper Functions
# ---------------------------------------------------------------------------

def _get_github_headers(access_token: str) -> dict:
    """Build headers for GitHub API requests."""
    return {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


async def _ensure_github_token(user: User) -> str:
    """Ensure user has a GitHub access token."""
    if not user.github_access_token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Пожалуйста, подключите ваш GitHub аккаунт через настройки профиля",
        )
    return user.github_access_token


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/create-repo", response_model=CreateRepoResponse)
async def create_repo(
    request: CreateRepoRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    """Create a new GitHub repository for a project.
    
    Requires user to have connected their GitHub account via OAuth.
    Creates a new public or private repository under the user's GitHub account.
    """
    token = await _ensure_github_token(current_user)
    headers = _get_github_headers(token)

    # Create repository via GitHub API
    repo_data = {
        "name": request.repo_name,
        "description": request.description or f"Project created with Viably (ID: {request.project_id})",
        "private": request.private,
        "auto_init": True,  # Initialize with README
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{GITHUB_API_BASE}/user/repos",
            json=repo_data,
            headers=headers,
        )

        if response.status_code == 201:
            repo = response.json()
            logger.info(
                "Repository created",
                extra={
                    "user_id": str(current_user.id),
                    "repo_full_name": repo["full_name"],
                },
            )
            return CreateRepoResponse(
                success=True,
                repo_url=repo["html_url"],
                repo_full_name=repo["full_name"],
            )
        elif response.status_code == 422:
            # Repository already exists
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Репозиторий '{request.repo_name}' уже существует",
            )
        else:
            logger.error("GitHub repo creation failed: %s", response.text)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Не удалось создать репозиторий на GitHub",
            )


@router.post("/push-code", response_model=PushCodeResponse)
async def push_code(
    request: PushCodeRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    """Push code files to a GitHub repository.
    
    Uses GitHub's Git Data API to create a commit with multiple files.
    This is a direct commit approach (no local git operations needed).
    """
    token = await _ensure_github_token(current_user)
    headers = _get_github_headers(token)

    async with httpx.AsyncClient() as client:
        # 1. Get the current commit SHA of the branch
        ref_url = f"{GITHUB_API_BASE}/repos/{request.repo_full_name}/git/ref/heads/{request.branch}"
        ref_resp = await client.get(ref_url, headers=headers)
        
        if ref_resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Ветка '{request.branch}' не найдена",
            )
        
        current_commit_sha = ref_resp.json()["object"]["sha"]

        # 2. Get the tree SHA from the current commit
        commit_url = f"{GITHUB_API_BASE}/repos/{request.repo_full_name}/git/commits/{current_commit_sha}"
        commit_resp = await client.get(commit_url, headers=headers)
        base_tree_sha = commit_resp.json()["tree"]["sha"]

        # 3. Create blobs for each file
        tree_items = []
        for file_path, content in request.files.items():
            blob_resp = await client.post(
                f"{GITHUB_API_BASE}/repos/{request.repo_full_name}/git/blobs",
                json={
                    "content": content,
                    "encoding": "utf-8",
                },
                headers=headers,
            )
            blob_sha = blob_resp.json()["sha"]
            tree_items.append({
                "path": file_path,
                "mode": "100644",
                "type": "blob",
                "sha": blob_sha,
            })

        # 4. Create a new tree
        tree_resp = await client.post(
            f"{GITHUB_API_BASE}/repos/{request.repo_full_name}/git/trees",
            json={
                "base_tree": base_tree_sha,
                "tree": tree_items,
            },
            headers=headers,
        )
        new_tree_sha = tree_resp.json()["sha"]

        # 5. Create a new commit
        new_commit_resp = await client.post(
            f"{GITHUB_API_BASE}/repos/{request.repo_full_name}/git/commits",
            json={
                "message": request.commit_message,
                "tree": new_tree_sha,
                "parents": [current_commit_sha],
            },
            headers=headers,
        )
        new_commit_sha = new_commit_resp.json()["sha"]

        # 6. Update the reference to point to the new commit
        await client.patch(
            ref_url,
            json={"sha": new_commit_sha},
            headers=headers,
        )

        logger.info(
            "Code pushed to GitHub",
            extra={
                "user_id": str(current_user.id),
                "repo": request.repo_full_name,
                "commit_sha": new_commit_sha,
            },
        )

        return PushCodeResponse(
            success=True,
            commit_sha=new_commit_sha,
            commit_url=f"https://github.com/{request.repo_full_name}/commit/{new_commit_sha}",
        )


@router.post("/setup-actions", response_model=SetupActionsResponse)
async def setup_actions(
    request: SetupActionsRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    """Set up GitHub Actions workflow for automatic deployment.
    
    Creates a .github/workflows/deploy.yml file in the repository
    with a basic CI/CD workflow that runs on push to main.
    """
    token = await _ensure_github_token(current_user)
    headers = _get_github_headers(token)

    # Create a basic GitHub Actions workflow
    workflow_content = f"""name: Deploy

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: {request.deploy_command}
      
      - name: Deploy
        run: echo "Deployment step - configure with your hosting provider"
"""

    # Push the workflow file to the repository
    push_request = PushCodeRequest(
        repo_full_name=request.repo_full_name,
        files={
            f".github/workflows/{request.workflow_name}": workflow_content,
        },
        commit_message="Add GitHub Actions deployment workflow",
        branch="main",
    )

    await push_code(push_request, current_user, db)

    workflow_url = f"https://github.com/{request.repo_full_name}/actions"
    
    logger.info(
        "GitHub Actions configured",
        extra={
            "user_id": str(current_user.id),
            "repo": request.repo_full_name,
        },
    )

    return SetupActionsResponse(
        success=True,
        workflow_url=workflow_url,
    )


@router.get("/status")
async def github_status(
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Check if user has connected their GitHub account."""
    return {
        "connected": bool(current_user.github_access_token),
        "username": current_user.github_username,
    }
