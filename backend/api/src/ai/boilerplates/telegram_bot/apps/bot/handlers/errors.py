"""Global error handler."""
from aiogram import Router
from aiogram.exceptions import TelegramBadRequest
from aiogram.types import ErrorEvent

from infrastructure.monitoring.logging import get_logger

logger = get_logger(__name__)
router = Router(name="errors")


@router.error()
async def error_handler(event: ErrorEvent) -> None:
    """Handle unhandled errors in bot handlers."""
    exc = event.exception

    # Telegram returns this error when edit_text is called with identical content.
    # This is harmless — the message is already showing the correct state.
    if isinstance(exc, TelegramBadRequest) and "message is not modified" in str(exc):
        return

    logger.error("Unhandled error: %s", exc, exc_info=exc)
    if event.update.message:
        await event.update.message.answer("Произошла ошибка. Попробуйте позже.")
