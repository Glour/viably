"""Base repository with generic CRUD operations for SQLAlchemy models."""

from typing import Any, Generic, Optional, Sequence, Type, TypeVar
from uuid import UUID

from sqlalchemy import Select, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.database.models import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """Base repository providing common database operations.

    Features:
    - Generic CRUD operations (create, read, update, delete)
    - Row-level locking for atomic operations
    - Filtering, sorting, pagination
    - Count queries
    - Type-safe with Generic[ModelType]

    Example:
        class UserRepository(BaseRepository[User]):
            pass

        repo = UserRepository(db, User)
        user = await repo.get_by_id(user_id)
        users = await repo.list(limit=10, offset=0)
    """

    def __init__(self, db: AsyncSession, model: Type[ModelType]):
        """Initialize repository.

        Args:
            db: Async database session
            model: SQLAlchemy model class
        """
        self.db = db
        self.model = model

    async def get_by_id(self, id: UUID) -> Optional[ModelType]:
        """Get entity by ID.

        Args:
            id: Entity UUID

        Returns:
            Entity or None if not found
        """
        stmt = select(self.model).where(self.model.id == id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_id_with_lock(self, id: UUID) -> Optional[ModelType]:
        """Get entity by ID with row-level lock for atomic operations.

        Uses SELECT FOR UPDATE to lock the row until transaction completes.

        Args:
            id: Entity UUID

        Returns:
            Entity or None if not found

        Example:
            user = await repo.get_by_id_with_lock(user_id)
            user.credits -= 10  # Safe atomic operation
            await db.commit()
        """
        stmt = select(self.model).where(self.model.id == id).with_for_update()
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list(
        self,
        filters: Optional[list] = None,
        order_by: Optional[Any] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
    ) -> Sequence[ModelType]:
        """List entities with optional filtering, sorting, and pagination.

        Args:
            filters: List of SQLAlchemy filter expressions
            order_by: SQLAlchemy order_by expression (default: created_at desc)
            limit: Maximum number of results
            offset: Number of results to skip

        Returns:
            List of entities

        Example:
            users = await repo.list(
                filters=[User.email.like('%@example.com')],
                order_by=User.created_at.desc(),
                limit=10,
                offset=0
            )
        """
        stmt = select(self.model)

        if filters:
            for filter_expr in filters:
                stmt = stmt.where(filter_expr)

        # Default order by created_at desc if available
        if order_by is not None:
            stmt = stmt.order_by(order_by)
        elif hasattr(self.model, 'created_at'):
            stmt = stmt.order_by(desc(self.model.created_at))

        if offset is not None:
            stmt = stmt.offset(offset)

        if limit is not None:
            stmt = stmt.limit(limit)

        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def count(self, filters: Optional[list] = None) -> int:
        """Count entities matching filters.

        Args:
            filters: List of SQLAlchemy filter expressions

        Returns:
            Count of matching entities
        """
        stmt = select(func.count()).select_from(self.model)

        if filters:
            for filter_expr in filters:
                stmt = stmt.where(filter_expr)

        result = await self.db.execute(stmt)
        return result.scalar_one()

    async def create(self, **kwargs) -> ModelType:
        """Create new entity.

        Args:
            **kwargs: Entity attributes

        Returns:
            Created entity

        Example:
            user = await repo.create(
                email="test@example.com",
                full_name="Test User"
            )
        """
        entity = self.model(**kwargs)
        self.db.add(entity)
        await self.db.flush()
        await self.db.refresh(entity)
        return entity

    async def update(self, id: UUID, **kwargs) -> Optional[ModelType]:
        """Update entity by ID.

        Args:
            id: Entity UUID
            **kwargs: Attributes to update

        Returns:
            Updated entity or None if not found

        Example:
            user = await repo.update(
                user_id,
                full_name="New Name"
            )
        """
        entity = await self.get_by_id(id)
        if not entity:
            return None

        for key, value in kwargs.items():
            if hasattr(entity, key):
                setattr(entity, key, value)

        await self.db.flush()
        await self.db.refresh(entity)
        return entity

    async def delete(self, id: UUID) -> bool:
        """Delete entity by ID.

        Args:
            id: Entity UUID

        Returns:
            True if deleted, False if not found
        """
        entity = await self.get_by_id(id)
        if not entity:
            return False

        await self.db.delete(entity)
        await self.db.flush()
        return True

    def _build_query(self) -> Select:
        """Build base query for the model.

        Subclasses can override this to add joins, eager loading, etc.

        Returns:
            SQLAlchemy Select statement
        """
        return select(self.model)
