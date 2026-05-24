"""User service with business logic."""
from aiogram.types import User as TelegramUser

from infrastructure.database.models.users import User
from infrastructure.database.uow import UnitOfWork
from shared.dto.user import UserCreateDTO
from shared.enums import Language
from shared.exceptions.base import NotFoundError


class UserService:
    """Service for user-related business logic.

    IMPORTANT for AI generation:
    - Handlers call get_or_create(telegram_user) to resolve telegram user → internal user
    - Other services receive user.id (int) from handlers, NEVER telegram_id
    - Only UserService should work with telegram_id directly
    """

    def __init__(self, uow: UnitOfWork):
        self.uow = uow

    async def get_or_create(self, telegram_user: TelegramUser) -> User:
        """Get existing user or create new one from Telegram user object.

        This is the PRIMARY method handlers should call to resolve a Telegram user.
        Returns internal User with user.id that can be passed to other services.

        Args:
            telegram_user: aiogram TelegramUser (message.from_user / callback.from_user)

        Returns:
            User: Internal user object with .id for FK references
        """
        dto = UserCreateDTO(
            telegram_id=telegram_user.id,
            username=telegram_user.username,
            first_name=telegram_user.first_name,
            last_name=telegram_user.last_name,
            language=Language(telegram_user.language_code or "ru"),
        )

        user, created = await self.uow.users.get_or_create(dto)
        return user

    # Alias for backward compatibility
    register_or_update = get_or_create

    async def get_user(self, user_id: int) -> User:
        """Get user by internal ID."""
        user = await self.uow.users.get(user_id)
        if not user:
            raise NotFoundError(f"User with id={user_id} not found")
        return user

    async def get_user_by_telegram_id(self, telegram_id: int) -> User | None:
        """Get user by Telegram ID."""
        return await self.uow.users.get_by_telegram_id(telegram_id)

    async def get_total_users(self) -> int:
        """Get total number of users."""
        return await self.uow.users.count()
