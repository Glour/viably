"""Business logic for conversations module."""

import logging
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from infrastructure.database.models.conversations import Artifact, Conversation, Message
from infrastructure.database.models.templates import Template
from infrastructure.database.models.projects import Project
from api.src.conversations.schemas import (
    ArtifactUpdate,
    ConversationCreate,
    ConversationUpdate,
)
from api.src.projects.service import get_project_by_id

logger = logging.getLogger(__name__)


async def create_conversation(
    user_id: UUID,
    data: ConversationCreate,
    db: AsyncSession,
) -> Conversation:
    """Create a new conversation.

    Args:
        user_id: Owner's user ID.
        data: Conversation creation data.
        db: Database session.

    Returns:
        Created conversation.

    Raises:
        HTTPException 404: If project not found.
        HTTPException 403: If user doesn't own the project.
    """
    # Verify project exists and user owns it
    await get_project_by_id(data.project_id, user_id, db)

    # Create conversation
    conversation = Conversation(
        project_id=data.project_id,
        user_id=user_id,
        title=data.title,
        metadata={},
    )
    db.add(conversation)
    await db.flush()

    # Add onboarding message from template if available
    try:
        proj_result = await db.execute(
            select(Project).where(Project.id == data.project_id)
        )
        project = proj_result.scalar_one_or_none()
        if project and project.template_id:
            tmpl_result = await db.execute(
                select(Template).where(Template.id == project.template_id)
            )
            template = tmpl_result.scalar_one_or_none()
            if template:
                onboarding = (
                    template.onboarding_prompt
                    or "Проект создан! Расскажите, что хотите изменить — я обновлю код."
                )
                welcome_msg = Message(
                    conversation_id=conversation.id,
                    role="assistant",
                    content=onboarding,
                    tokens_used=0,
                )
                db.add(welcome_msg)
                logger.info(
                    "Added onboarding message to conversation",
                    extra={"conversation_id": str(conversation.id)},
                )
    except Exception as e:
        logger.warning("Failed to add onboarding message: %s", e)

    await db.commit()
    await db.refresh(conversation)

    return conversation


async def get_conversation_by_id(
    conversation_id: UUID,
    user_id: UUID,
    db: AsyncSession,
) -> Conversation:
    """Get conversation by ID (owner only).

    Args:
        conversation_id: Conversation UUID.
        user_id: Owner's user ID.
        db: Database session.

    Returns:
        Conversation object.

    Raises:
        HTTPException 404: If conversation not found.
        HTTPException 403: If user doesn't own the conversation.
    """
    query = select(Conversation).where(
        Conversation.id == conversation_id,
        Conversation.user_id == user_id,
    )
    result = await db.execute(query)
    conversation = result.scalar_one_or_none()

    if conversation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )

    return conversation


async def get_conversation_with_messages(
    conversation_id: UUID,
    user_id: UUID,
    db: AsyncSession,
) -> Conversation:
    """Get conversation with full message history and artifacts.

    Args:
        conversation_id: Conversation UUID.
        user_id: Owner's user ID.
        db: Database session.

    Returns:
        Conversation object with messages and artifacts loaded.

    Raises:
        HTTPException 404: If conversation not found.
        HTTPException 403: If user doesn't own the conversation.
    """
    query = (
        select(Conversation)
        .options(
            selectinload(Conversation.messages).selectinload(Message.artifacts)
        )
        .where(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id,
        )
    )
    result = await db.execute(query)
    conversation = result.scalar_one_or_none()

    if conversation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )

    return conversation


async def update_conversation(
    conversation_id: UUID,
    user_id: UUID,
    data: ConversationUpdate,
    db: AsyncSession,
) -> Conversation:
    """Update conversation fields.

    Args:
        conversation_id: Conversation UUID.
        user_id: Owner's user ID.
        data: Fields to update.
        db: Database session.

    Returns:
        Updated conversation.

    Raises:
        HTTPException 404: If conversation not found.
        HTTPException 403: If user doesn't own the conversation.
    """
    conversation = await get_conversation_by_id(conversation_id, user_id, db)

    # Update fields if provided
    if data.title is not None:
        conversation.title = data.title
    if data.metadata is not None:
        conversation.metadata_ = data.metadata

    await db.commit()
    await db.refresh(conversation)

    return conversation


async def delete_conversation(
    conversation_id: UUID,
    user_id: UUID,
    db: AsyncSession,
) -> None:
    """Delete a conversation.

    Args:
        conversation_id: Conversation UUID.
        user_id: Owner's user ID.
        db: Database session.

    Raises:
        HTTPException 404: If conversation not found.
        HTTPException 403: If user doesn't own the conversation.
    """
    conversation = await get_conversation_by_id(conversation_id, user_id, db)
    await db.delete(conversation)
    await db.commit()


async def list_project_conversations(
    project_id: UUID,
    user_id: UUID,
    db: AsyncSession,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[Conversation], int]:
    """List all conversations for a project.

    Args:
        project_id: Project UUID.
        user_id: Owner's user ID.
        db: Database session.
        limit: Maximum number of conversations to return.
        offset: Number of conversations to skip.

    Returns:
        Tuple of (conversations list, total count).

    Raises:
        HTTPException 404: If project not found.
        HTTPException 403: If user doesn't own the project.
    """
    # Verify project exists and user owns it
    await get_project_by_id(project_id, user_id, db)

    # Get total count
    count_query = select(func.count()).select_from(Conversation).where(
        Conversation.project_id == project_id,
        Conversation.user_id == user_id,
    )
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # Get conversations
    query = (
        select(Conversation)
        .where(
            Conversation.project_id == project_id,
            Conversation.user_id == user_id,
        )
        .order_by(Conversation.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    result = await db.execute(query)
    conversations = list(result.scalars().all())

    return conversations, total


async def get_messages(
    conversation_id: UUID,
    user_id: UUID,
    db: AsyncSession,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[Message], int]:
    """Get paginated messages for a conversation.

    Args:
        conversation_id: Conversation UUID.
        user_id: Owner's user ID.
        db: Database session.
        limit: Maximum number of messages to return.
        offset: Number of messages to skip.

    Returns:
        Tuple of (messages list, total count).

    Raises:
        HTTPException 404: If conversation not found.
        HTTPException 403: If user doesn't own the conversation.
    """
    # Verify conversation exists and user owns it
    await get_conversation_by_id(conversation_id, user_id, db)

    # Get total count
    count_query = select(func.count()).select_from(Message).where(
        Message.conversation_id == conversation_id,
    )
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # Get messages with artifacts
    query = (
        select(Message)
        .options(selectinload(Message.artifacts))
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .limit(limit)
        .offset(offset)
    )
    result = await db.execute(query)
    messages = list(result.scalars().all())

    return messages, total


async def get_artifacts(
    conversation_id: UUID,
    user_id: UUID,
    db: AsyncSession,
) -> list[Artifact]:
    """Get all artifacts for a conversation.

    Args:
        conversation_id: Conversation UUID.
        user_id: Owner's user ID.
        db: Database session.

    Returns:
        List of artifacts.

    Raises:
        HTTPException 404: If conversation not found.
        HTTPException 403: If user doesn't own the conversation.
    """
    # Verify conversation exists and user owns it
    await get_conversation_by_id(conversation_id, user_id, db)

    # Get all artifacts
    query = (
        select(Artifact)
        .where(Artifact.conversation_id == conversation_id)
        .order_by(Artifact.created_at.desc())
    )
    result = await db.execute(query)
    artifacts = list(result.scalars().all())

    return artifacts


async def get_artifact_by_id(
    artifact_id: UUID,
    user_id: UUID,
    db: AsyncSession,
) -> Artifact:
    """Get artifact by ID (owner only).

    Args:
        artifact_id: Artifact UUID.
        user_id: Owner's user ID.
        db: Database session.

    Returns:
        Artifact object.

    Raises:
        HTTPException 404: If artifact not found.
        HTTPException 403: If user doesn't own the artifact.
    """
    query = (
        select(Artifact)
        .join(Conversation)
        .where(
            Artifact.id == artifact_id,
            Conversation.user_id == user_id,
        )
    )
    result = await db.execute(query)
    artifact = result.scalar_one_or_none()

    if artifact is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artifact not found",
        )

    return artifact


async def update_artifact(
    artifact_id: UUID,
    user_id: UUID,
    data: ArtifactUpdate,
    db: AsyncSession,
) -> Artifact:
    """Update artifact by creating a new version.

    Args:
        artifact_id: Artifact UUID to update.
        user_id: Owner's user ID.
        data: Update data (content, title).
        db: Database session.

    Returns:
        New artifact version.

    Raises:
        HTTPException 404: If artifact not found.
        HTTPException 403: If user doesn't own the artifact.
    """
    # Get existing artifact
    old_artifact = await get_artifact_by_id(artifact_id, user_id, db)

    # Create new version
    new_artifact = Artifact(
        conversation_id=old_artifact.conversation_id,
        message_id=old_artifact.message_id,
        type=old_artifact.type,
        title=data.title if data.title is not None else old_artifact.title,
        content=data.content,
        language=old_artifact.language,
        version=old_artifact.version + 1,
        parent_artifact_id=artifact_id,
    )
    db.add(new_artifact)
    await db.commit()
    await db.refresh(new_artifact)

    return new_artifact


async def get_artifact_versions(
    artifact_id: UUID,
    user_id: UUID,
    db: AsyncSession,
) -> list[Artifact]:
    """Get version history for an artifact.

    Args:
        artifact_id: Artifact UUID.
        user_id: Owner's user ID.
        db: Database session.

    Returns:
        List of artifact versions (newest first).

    Raises:
        HTTPException 404: If artifact not found.
        HTTPException 403: If user doesn't own the artifact.
    """
    # Verify artifact exists and user owns it
    artifact = await get_artifact_by_id(artifact_id, user_id, db)

    # Find root artifact (version 1)
    root_artifact_id = artifact_id
    current = artifact
    while current.parent_artifact_id is not None:
        query = select(Artifact).where(Artifact.id == current.parent_artifact_id)
        result = await db.execute(query)
        current = result.scalar_one()
        root_artifact_id = current.id

    # Get all versions starting from root
    query = (
        select(Artifact)
        .where(
            (Artifact.id == root_artifact_id)
            | (Artifact.parent_artifact_id == root_artifact_id)
        )
        .order_by(Artifact.version.desc())
    )
    result = await db.execute(query)
    versions = list(result.scalars().all())

    return versions
