"""Pydantic schemas for conversations module."""

from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field


# ============================================================================
# Conversation Schemas
# ============================================================================

class ConversationCreate(BaseModel):
    """Schema for creating a new conversation."""

    project_id: UUID
    title: str | None = Field(None, max_length=255)


class ConversationUpdate(BaseModel):
    """Schema for updating a conversation."""

    title: str | None = Field(None, max_length=255)
    metadata: dict[str, Any] | None = None


class ConversationResponse(BaseModel):
    """Basic conversation response."""

    id: UUID
    project_id: UUID
    user_id: UUID
    title: str | None
    metadata: dict[str, Any] = Field(alias="metadata_")
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True, "populate_by_name": True}


# ============================================================================
# Message Schemas
# ============================================================================

MessageRole = Literal["user", "assistant", "system"]


class MessageCreate(BaseModel):
    """Schema for creating a new message."""

    content: str = Field(..., min_length=1, max_length=10000)


class MessageResponse(BaseModel):
    """Basic message response."""

    id: UUID
    conversation_id: UUID
    role: MessageRole
    content: str
    tokens_used: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ============================================================================
# Artifact Schemas
# ============================================================================

ArtifactType = Literal[
    "html",
    "react",
    "vue",
    "svelte",
    "python",
    "javascript",
    "typescript",
    "css",
    "json",
    "yaml",
    "toml",
    "ini",
    "markdown",
    "text",
]


class ArtifactResponse(BaseModel):
    """Basic artifact response."""

    id: UUID
    conversation_id: UUID
    message_id: UUID
    type: ArtifactType
    title: str | None
    content: str
    language: str
    version: int
    parent_artifact_id: UUID | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ArtifactUpdate(BaseModel):
    """Schema for updating an artifact (creates new version)."""

    content: str = Field(..., min_length=1)
    title: str | None = Field(None, max_length=255)


class ArtifactVersionResponse(BaseModel):
    """Minimal artifact version info for history."""

    id: UUID
    version: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ============================================================================
# Composite Schemas
# ============================================================================

class MessageWithArtifactsResponse(MessageResponse):
    """Message with embedded artifacts."""

    artifacts: list[ArtifactResponse] = []


class ConversationDetailResponse(ConversationResponse):
    """Conversation with full message history."""

    messages: list[MessageWithArtifactsResponse] = []


# ============================================================================
# List Responses
# ============================================================================

class ConversationListResponse(BaseModel):
    """Paginated list of conversations."""

    items: list[ConversationResponse]
    total: int
    limit: int
    offset: int


class MessageListResponse(BaseModel):
    """Paginated list of messages."""

    items: list[MessageWithArtifactsResponse]
    total: int
    limit: int
    offset: int


class ArtifactListResponse(BaseModel):
    """List of artifacts in a conversation."""

    items: list[ArtifactResponse]
    total: int


# ============================================================================
# WebSocket Event Schemas
# ============================================================================

class WSTokenEvent(BaseModel):
    """WebSocket token streaming event."""

    type: Literal["token"] = "token"
    content: str


class WSArtifactStartEvent(BaseModel):
    """WebSocket artifact start detection event."""

    type: Literal["artifact_start"] = "artifact_start"
    artifact_type: ArtifactType
    title: str | None = None


class WSArtifactContentEvent(BaseModel):
    """WebSocket artifact content streaming event."""

    type: Literal["artifact_content"] = "artifact_content"
    artifact_id: UUID
    content: str
    complete: bool = False


class WSArtifactCompleteEvent(BaseModel):
    """WebSocket artifact complete event."""

    type: Literal["artifact_complete"] = "artifact_complete"
    artifact_id: UUID
    artifact: ArtifactResponse


class WSMessageCompleteEvent(BaseModel):
    """WebSocket message complete event."""

    type: Literal["message_complete"] = "message_complete"
    message_id: UUID
    tokens_used: int


class WSErrorEvent(BaseModel):
    """WebSocket error event."""

    type: Literal["error"] = "error"
    error: str
    code: str | None = None
    details: dict[str, Any] | None = None


# Union type for all WebSocket events
WSEvent = (
    WSTokenEvent
    | WSArtifactStartEvent
    | WSArtifactContentEvent
    | WSArtifactCompleteEvent
    | WSMessageCompleteEvent
    | WSErrorEvent
)
