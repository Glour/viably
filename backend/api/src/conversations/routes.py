"""FastAPI routes for conversations module."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from fastapi_limiter.depends import RateLimiter
from sqlalchemy.ext.asyncio import AsyncSession

from api.src.auth.deps import get_current_user
from infrastructure.database.models.auth import User
from api.src.conversations.schemas import (
    ArtifactListResponse,
    ArtifactResponse,
    ArtifactUpdate,
    ArtifactVersionResponse,
    ConversationCreate,
    ConversationDetailResponse,
    ConversationResponse,
    ConversationUpdate,
    MessageCreate,
    MessageListResponse,
    MessageWithArtifactsResponse,
)
from api.src.conversations.service import (
    create_conversation,
    delete_conversation,
    get_artifact_by_id,
    get_artifact_versions,
    get_artifacts,
    get_conversation_with_messages,
    get_messages,
    update_artifact,
    update_conversation,
)
from infrastructure.database.setup import get_db

router = APIRouter(prefix="", tags=["conversations"])


@router.post(
    "",
    response_model=ConversationResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(RateLimiter(times=20, minutes=1))],
)
async def create_conversation_endpoint(
    data: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ConversationResponse:
    """Create a new conversation.

    Args:
        data: Conversation creation data (project_id, title).
        current_user: Authenticated user.
        db: Database session.

    Returns:
        Created conversation.

    Raises:
        400: Invalid project_id.
        401: Unauthorized.
        403: User doesn't own the project.
        404: Project not found.
    """
    conversation = await create_conversation(current_user.id, data, db)
    return ConversationResponse.model_validate(conversation)


@router.get(
    "/{conversation_id}",
    response_model=ConversationDetailResponse,
    dependencies=[Depends(RateLimiter(times=60, minutes=1))],
)
async def get_conversation_endpoint(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ConversationDetailResponse:
    """Get conversation with full message history.

    Args:
        conversation_id: Conversation UUID.
        current_user: Authenticated user.
        db: Database session.

    Returns:
        Conversation with messages and artifacts.

    Raises:
        401: Unauthorized.
        403: User doesn't own the conversation.
        404: Conversation not found.
    """
    conversation = await get_conversation_with_messages(
        conversation_id, current_user.id, db
    )
    return ConversationDetailResponse.model_validate(conversation)


@router.patch(
    "/{conversation_id}",
    response_model=ConversationResponse,
    dependencies=[Depends(RateLimiter(times=20, minutes=1))],
)
async def update_conversation_endpoint(
    conversation_id: UUID,
    data: ConversationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ConversationResponse:
    """Update conversation fields.

    Args:
        conversation_id: Conversation UUID.
        data: Fields to update (title, metadata).
        current_user: Authenticated user.
        db: Database session.

    Returns:
        Updated conversation.

    Raises:
        401: Unauthorized.
        403: User doesn't own the conversation.
        404: Conversation not found.
    """
    conversation = await update_conversation(conversation_id, current_user.id, data, db)
    return ConversationResponse.model_validate(conversation)


@router.delete(
    "/{conversation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(RateLimiter(times=10, minutes=1))],
)
async def delete_conversation_endpoint(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a conversation.

    Args:
        conversation_id: Conversation UUID.
        current_user: Authenticated user.
        db: Database session.

    Raises:
        401: Unauthorized.
        403: User doesn't own the conversation.
        404: Conversation not found.
    """
    await delete_conversation(conversation_id, current_user.id, db)


# ============================================================================
# Message Endpoints
# ============================================================================


@router.post(
    "/{conversation_id}/messages",
    status_code=status.HTTP_202_ACCEPTED,
    dependencies=[Depends(RateLimiter(times=5, minutes=1))],
)
async def send_message_endpoint(
    conversation_id: UUID,
    data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Send a message to a conversation (triggers WebSocket streaming).

    This endpoint accepts the message and returns immediately.
    The actual AI response will be streamed via WebSocket connection.

    Args:
        conversation_id: Conversation UUID.
        data: Message content.
        current_user: Authenticated user.
        db: Database session.

    Returns:
        Acceptance confirmation with WebSocket connection info.

    Raises:
        401: Unauthorized.
        403: User doesn't own the conversation or insufficient credits.
        404: Conversation not found.
        429: Rate limit exceeded (50 messages per hour).
    """
    from api.src.conversations.service import get_conversation_by_id

    # Verify conversation exists and user owns it
    await get_conversation_by_id(conversation_id, current_user.id, db)

    # TODO: Trigger WebSocket streaming via task queue (Celery)
    # For now, return acceptance response
    return {
        "status": "accepted",
        "message": "Message accepted. Connect to WebSocket for streaming response.",
        "websocket_url": f"/ws/{conversation_id}",
    }


@router.get(
    "/{conversation_id}/messages",
    response_model=MessageListResponse,
    dependencies=[Depends(RateLimiter(times=60, minutes=1))],
)
async def get_messages_endpoint(
    conversation_id: UUID,
    limit: int = Query(50, ge=1, le=100, description="Maximum items to return"),
    offset: int = Query(0, ge=0, description="Number of items to skip"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageListResponse:
    """Get paginated messages for a conversation.

    Args:
        conversation_id: Conversation UUID.
        limit: Maximum items to return (default 50, max 100).
        offset: Number of items to skip (default 0).
        current_user: Authenticated user.
        db: Database session.

    Returns:
        Paginated list of messages with artifacts.

    Raises:
        401: Unauthorized.
        403: User doesn't own the conversation.
        404: Conversation not found.
    """
    messages, total = await get_messages(
        conversation_id, current_user.id, db, limit, offset
    )

    return MessageListResponse(
        items=[MessageWithArtifactsResponse.model_validate(m) for m in messages],
        total=total,
        limit=limit,
        offset=offset,
    )


# ============================================================================
# Artifact Endpoints
# ============================================================================


@router.get(
    "/{conversation_id}/artifacts",
    response_model=ArtifactListResponse,
    dependencies=[Depends(RateLimiter(times=60, minutes=1))],
)
async def get_artifacts_endpoint(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ArtifactListResponse:
    """Get all artifacts for a conversation.

    Args:
        conversation_id: Conversation UUID.
        current_user: Authenticated user.
        db: Database session.

    Returns:
        List of all artifacts in the conversation.

    Raises:
        401: Unauthorized.
        403: User doesn't own the conversation.
        404: Conversation not found.
    """
    artifacts = await get_artifacts(conversation_id, current_user.id, db)

    return ArtifactListResponse(
        items=[ArtifactResponse.model_validate(a) for a in artifacts],
        total=len(artifacts),
    )


@router.patch(
    "/artifacts/{artifact_id}",
    response_model=ArtifactResponse,
    dependencies=[Depends(RateLimiter(times=30, minutes=1))],
)
async def update_artifact_endpoint(
    artifact_id: UUID,
    data: ArtifactUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ArtifactResponse:
    """Update artifact by creating a new version.

    Args:
        artifact_id: Artifact UUID.
        data: Update data (content, title).
        current_user: Authenticated user.
        db: Database session.

    Returns:
        New artifact version.

    Raises:
        401: Unauthorized.
        403: User doesn't own the artifact.
        404: Artifact not found.
    """
    new_artifact = await update_artifact(artifact_id, current_user.id, data, db)
    return ArtifactResponse.model_validate(new_artifact)


@router.get(
    "/artifacts/{artifact_id}/versions",
    response_model=list[ArtifactVersionResponse],
    dependencies=[Depends(RateLimiter(times=30, minutes=1))],
)
async def get_artifact_versions_endpoint(
    artifact_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ArtifactVersionResponse]:
    """Get version history for an artifact.

    Args:
        artifact_id: Artifact UUID.
        current_user: Authenticated user.
        db: Database session.

    Returns:
        List of artifact versions (newest first).

    Raises:
        401: Unauthorized.
        403: User doesn't own the artifact.
        404: Artifact not found.
    """
    versions = await get_artifact_versions(artifact_id, current_user.id, db)
    return [ArtifactVersionResponse.model_validate(v) for v in versions]


# ============================================================================
# REST Generate Endpoint (replaces WebSocket streaming)
# ============================================================================

from pydantic import BaseModel as PydanticModel

class GenerateRequest(PydanticModel):
    content: str

@router.post(
    "/{conversation_id}/generate",
    dependencies=[Depends(RateLimiter(times=10, minutes=1))],
)
async def generate_endpoint(
    conversation_id: UUID,
    data: GenerateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Send message and wait for full AI response (no streaming).

    Returns complete response with artifacts when generation is done.
    """
    from api.src.conversations.ai_service import ConversationAIService

    ai_service = ConversationAIService(db)

    tokens: list[str] = []
    artifacts: list[dict] = []
    message_id: str | None = None
    usage: dict | None = None
    error: str | None = None

    async for event in ai_service.send_message_streaming(
        conversation_id, data.content, current_user.id
    ):
        if event["type"] == "token":
            tokens.append(event.get("content", ""))
        elif event["type"] == "artifact":
            artifacts.append(event.get("artifact", {}))
        elif event["type"] == "done":
            message_id = event.get("message_id")
            usage = event.get("usage")
        elif event["type"] == "error":
            error = event.get("error")
            break

    if error:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=error)

    return {
        "text": "".join(tokens),
        "artifacts": artifacts,
        "message_id": message_id,
        "usage": usage,
    }
