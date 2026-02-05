# Backend Module: Projects

**Module:** `app/projects`
**Status:** Not Started
**Priority:** P0 (Must have for MVP)
**Estimated Time:** 3-4 days
**Dependencies:** Credits, Templates

---

## 📋 Overview

The Projects module manages user projects (bots/APIs), CRUD operations, generation workflow, and status tracking.

**Responsibilities:**
- Create and manage user projects
- Link projects to templates
- Store user configuration
- Track generation status
- Store generated code
- Manage deployment info

---

## 🔧 Dependencies

```python
# requirements.txt additions
sqlalchemy>=2.0
pydantic>=2.5.0
```

---

## 🗄️ Database Models

### Project Model

File: `app/projects/models.py`

```python
from sqlalchemy import Column, String, Boolean, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.core.database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Info
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    template_id = Column(UUID(as_uuid=True), ForeignKey("templates.id"), nullable=False)

    # Configuration
    config = Column(JSONB, nullable=True)  # User inputs
    generated_code = Column(JSONB, nullable=True)  # {files: {path: content}}

    # Generation
    generation_logs = Column(Text, nullable=True)
    ai_model_used = Column(String(50), nullable=True)  # claude-sonnet-4

    # Status
    status = Column(String(20), default="draft")  # draft, generating, ready, deploying, deployed, error
    error_message = Column(Text, nullable=True)

    # Deployment
    deployed_url = Column(Text, nullable=True)
    deploy_platform = Column(String(50), nullable=True)

    # Visibility
    is_public = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    generated_at = Column(DateTime(timezone=True), nullable=True)
    deployed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="projects")
    template = relationship("Template")
```

---

## 📝 Pydantic Schemas

File: `app/projects/schemas.py`

```python
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from enum import Enum


class ProjectStatus(str, Enum):
    DRAFT = "draft"
    GENERATING = "generating"
    READY = "ready"
    DEPLOYING = "deploying"
    DEPLOYED = "deployed"
    ERROR = "error"


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    template_id: UUID
    config: Optional[Dict[str, Any]] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    is_public: Optional[bool] = None


class ProjectResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    description: Optional[str]
    template_id: UUID
    config: Optional[Dict[str, Any]]
    status: ProjectStatus
    is_public: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProjectDetailResponse(ProjectResponse):
    generated_code: Optional[Dict[str, Any]]
    generation_logs: Optional[str]
    ai_model_used: Optional[str]
    error_message: Optional[str]
    deployed_url: Optional[str]
    deploy_platform: Optional[str]
    generated_at: Optional[datetime]
    deployed_at: Optional[datetime]


class ProjectListResponse(BaseModel):
    items: list[ProjectResponse]
    total: int
    page: int
    per_page: int
    pages: int
```

---

## 🔄 Business Logic

File: `app/projects/service.py`

```python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from uuid import UUID
from typing import Optional

from app.projects.models import Project
from app.projects.schemas import ProjectCreate, ProjectUpdate, ProjectStatus


class ProjectService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_project(
        self,
        user_id: UUID,
        data: ProjectCreate
    ) -> Project:
        """Create a new project."""
        project = Project(
            user_id=user_id,
            name=data.name,
            description=data.description,
            template_id=data.template_id,
            config=data.config,
            status=ProjectStatus.DRAFT
        )
        self.db.add(project)
        await self.db.commit()
        await self.db.refresh(project)
        return project

    async def get_project_by_id(
        self,
        project_id: UUID,
        user_id: UUID
    ) -> Optional[Project]:
        """Get project by ID (only owner can access)."""
        result = await self.db.execute(
            select(Project).where(
                Project.id == project_id,
                Project.user_id == user_id
            )
        )
        return result.scalar_one_or_none()

    async def update_project(
        self,
        project_id: UUID,
        user_id: UUID,
        data: ProjectUpdate
    ) -> Optional[Project]:
        """Update project fields."""
        project = await self.get_project_by_id(project_id, user_id)
        if not project:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(project, field, value)

        await self.db.commit()
        await self.db.refresh(project)
        return project

    async def delete_project(
        self,
        project_id: UUID,
        user_id: UUID
    ) -> bool:
        """Delete project."""
        project = await self.get_project_by_id(project_id, user_id)
        if not project:
            return False

        await self.db.delete(project)
        await self.db.commit()
        return True

    async def list_user_projects(
        self,
        user_id: UUID,
        page: int = 1,
        per_page: int = 20,
        status: Optional[ProjectStatus] = None
    ) -> tuple[list[Project], int]:
        """List user projects with pagination."""
        query = select(Project).where(Project.user_id == user_id)

        if status:
            query = query.where(Project.status == status)

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total = await self.db.scalar(count_query)

        # Paginate
        query = query.order_by(Project.created_at.desc())
        query = query.offset((page - 1) * per_page).limit(per_page)

        result = await self.db.execute(query)
        projects = result.scalars().all()

        return list(projects), total

    async def trigger_generation(
        self,
        project_id: UUID,
        user_id: UUID
    ) -> Optional[Project]:
        """Trigger AI code generation (delegates to AI module)."""
        project = await self.get_project_by_id(project_id, user_id)
        if not project or project.status != ProjectStatus.DRAFT:
            return None

        # Update status to generating
        project.status = ProjectStatus.GENERATING
        await self.db.commit()

        # Trigger async task (implemented in AI module)
        # await celery_app.send_task("ai.generate", args=[project_id])

        await self.db.refresh(project)
        return project

    async def save_generated_code(
        self,
        project_id: UUID,
        code_files: dict,
        ai_model: str
    ) -> None:
        """Save generated code to project."""
        result = await self.db.execute(
            select(Project).where(Project.id == project_id)
        )
        project = result.scalar_one_or_none()
        if project:
            project.generated_code = code_files
            project.ai_model_used = ai_model
            project.status = ProjectStatus.READY
            project.generated_at = func.now()
            await self.db.commit()
```

---

## 🌐 API Endpoints

File: `app/projects/routes.py`

```python
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import Optional

from app.core.database import get_db
from app.auth.dependencies import get_current_user
from app.projects.service import ProjectService
from app.projects.schemas import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectDetailResponse,
    ProjectListResponse,
    ProjectStatus
)

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("", response_model=ProjectDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    data: ProjectCreate,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new project."""
    service = ProjectService(db)
    project = await service.create_project(current_user.id, data)
    return project


@router.get("", response_model=ProjectListResponse)
async def list_projects(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[ProjectStatus] = None,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List user's projects with pagination."""
    service = ProjectService(db)
    projects, total = await service.list_user_projects(
        current_user.id, page, per_page, status
    )

    pages = (total + per_page - 1) // per_page

    return ProjectListResponse(
        items=projects,
        total=total,
        page=page,
        per_page=per_page,
        pages=pages
    )


@router.get("/{project_id}", response_model=ProjectDetailResponse)
async def get_project(
    project_id: UUID,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get project details including generated code."""
    service = ProjectService(db)
    project = await service.get_project_by_id(project_id, current_user.id)

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    return project


@router.patch("/{project_id}", response_model=ProjectDetailResponse)
async def update_project(
    project_id: UUID,
    data: ProjectUpdate,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update project name, description, or visibility."""
    service = ProjectService(db)
    project = await service.update_project(project_id, current_user.id, data)

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: UUID,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a project."""
    service = ProjectService(db)
    deleted = await service.delete_project(project_id, current_user.id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )


@router.post("/{project_id}/generate", response_model=ProjectDetailResponse)
async def trigger_generation(
    project_id: UUID,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Trigger AI code generation for a project."""
    service = ProjectService(db)
    project = await service.trigger_generation(project_id, current_user.id)

    if not project:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project not found or not in draft status"
        )

    return project
```

---

## 🧪 Tests

File: `tests/test_projects.py`

```python
import pytest
from httpx import AsyncClient
from uuid import uuid4


@pytest.mark.asyncio
async def test_create_project(client: AsyncClient, auth_headers, template):
    """Test creating a new project."""
    response = await client.post(
        "/api/projects",
        json={
            "name": "My Bot",
            "description": "Test bot",
            "template_id": str(template.id),
            "config": {"shop_name": "Test Shop"}
        },
        headers=auth_headers
    )

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "My Bot"
    assert data["status"] == "draft"


@pytest.mark.asyncio
async def test_list_projects_pagination(client: AsyncClient, auth_headers):
    """Test listing projects with pagination."""
    response = await client.get(
        "/api/projects?page=1&per_page=10",
        headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "pages" in data


@pytest.mark.asyncio
async def test_get_project_only_owner(client: AsyncClient, auth_headers, other_user_headers, project):
    """Test that only owner can access project."""
    # Owner can access
    response = await client.get(
        f"/api/projects/{project.id}",
        headers=auth_headers
    )
    assert response.status_code == 200

    # Other user cannot access
    response = await client.get(
        f"/api/projects/{project.id}",
        headers=other_user_headers
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_project(client: AsyncClient, auth_headers, project):
    """Test updating project."""
    response = await client.patch(
        f"/api/projects/{project.id}",
        json={"name": "Updated Name", "is_public": True},
        headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"
    assert data["is_public"] is True


@pytest.mark.asyncio
async def test_delete_project(client: AsyncClient, auth_headers, project):
    """Test deleting project."""
    response = await client.delete(
        f"/api/projects/{project.id}",
        headers=auth_headers
    )

    assert response.status_code == 204

    # Verify deleted
    response = await client.get(
        f"/api/projects/{project.id}",
        headers=auth_headers
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_trigger_generation_draft_only(client: AsyncClient, auth_headers, project):
    """Test that generation can only be triggered for draft projects."""
    response = await client.post(
        f"/api/projects/{project.id}/generate",
        headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "generating"


@pytest.mark.asyncio
async def test_status_transitions(client: AsyncClient, auth_headers, project):
    """Test project status transitions."""
    # Start generation
    response = await client.post(
        f"/api/projects/{project.id}/generate",
        headers=auth_headers
    )
    assert response.json()["status"] == "generating"

    # Cannot trigger again while generating
    response = await client.post(
        f"/api/projects/{project.id}/generate",
        headers=auth_headers
    )
    assert response.status_code == 400
```

---

## 📊 Success Criteria

- [ ] CRUD operations work correctly
- [ ] Pagination works for project listing
- [ ] Only owner can access their projects
- [ ] Status transitions work correctly (draft → generating → ready)
- [ ] Generation trigger works
- [ ] Template relationship works
- [ ] Config validation against template schema

---

## 💡 Implementation Tips

- Use pagination for list (default 20/page)
- Filter by status (draft, ready, deployed)
- Consider soft delete (set deleted_at instead of DELETE)
- Include template info in GET response
- Validate config against template.config_schema

---

**Last Updated:** February 5, 2026
