"""
Support API Router
Обрабатывает запросы поддержки от веб-формы
"""
import os
import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr, Field
import httpx

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/support", tags=["support"])

# Конфигурация Telegram
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_ADMIN_ID = os.getenv("TELEGRAM_ADMIN_ID", "")
TELEGRAM_API_URL = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"


class SupportMessage(BaseModel):
    """Модель сообщения в поддержку"""
    name: str = Field(..., min_length=1, max_length=100, description="Имя отправителя")
    email: EmailStr = Field(..., description="Email отправителя")
    message: str = Field(..., min_length=10, max_length=1000, description="Текст сообщения")
    subject: Optional[str] = Field(None, max_length=200, description="Тема обращения")
    user_id: Optional[int] = Field(None, description="ID пользователя (если авторизован)")


class SupportResponse(BaseModel):
    """Ответ на запрос поддержки"""
    success: bool
    message: str
    ticket_id: Optional[str] = None


async def send_telegram_message(message_text: str) -> bool:
    """
    Отправка сообщения в Telegram администратору
    
    Args:
        message_text: Текст сообщения для отправки
        
    Returns:
        bool: True если сообщение отправлено успешно
    """
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_ADMIN_ID:
        logger.warning("Telegram support notifications are not configured")
        return False

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                TELEGRAM_API_URL,
                json={
                    "chat_id": TELEGRAM_ADMIN_ID,
                    "text": message_text,
                    "parse_mode": "Markdown"
                },
                timeout=10.0
            )
            response.raise_for_status()
            return True
    except Exception as e:
        logger.error(f"Failed to send Telegram message: {e}")
        return False


@router.post("/send", response_model=SupportResponse, status_code=status.HTTP_200_OK)
async def send_support_message(support_msg: SupportMessage):
    """
    Отправить сообщение в службу поддержки
    
    Принимает сообщение от пользователя через веб-форму и пересылает его
    администратору в Telegram.
    
    - **name**: Имя отправителя (обязательно)
    - **email**: Email для обратной связи (обязательно)
    - **message**: Текст обращения (обязательно, минимум 10 символов)
    - **subject**: Тема обращения (опционально)
    - **user_id**: ID пользователя если авторизован (опционально)
    """
    logger.info(f"New support message from {support_msg.email}")
    
    # Формируем сообщение для Telegram
    telegram_message = (
        "🆘 *НОВОЕ ОБРАЩЕНИЕ В ПОДДЕРЖКУ*\n\n"
        f"👤 *Имя:* {support_msg.name}\n"
        f"📧 *Email:* {support_msg.email}\n"
    )
    
    if support_msg.user_id:
        telegram_message += f"🆔 *User ID:* `{support_msg.user_id}`\n"
    
    if support_msg.subject:
        telegram_message += f"📋 *Тема:* {support_msg.subject}\n"
    
    telegram_message += (
        f"\n💬 *Сообщение:*\n{support_msg.message}\n\n"
        f"🕐 *Время:* {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    )
    
    # Отправляем в Telegram
    success = await send_telegram_message(telegram_message)
    
    if not success:
        logger.error("Failed to send message to Telegram")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Не удалось отправить сообщение. Попробуйте позже или напишите на support@viably.tech"
        )
    
    # Генерируем ID тикета
    ticket_id = f"VIABLY-{datetime.now().strftime('%Y%m%d')}-{hash(support_msg.email) % 10000:04d}"
    
    return SupportResponse(
        success=True,
        message="Ваше сообщение отправлено! Мы свяжемся с вами в ближайшее время.",
        ticket_id=ticket_id
    )


@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    """
    Проверка работоспособности модуля поддержки
    """
    return {
        "status": "healthy",
        "telegram_configured": bool(TELEGRAM_BOT_TOKEN),
        "admin_configured": bool(TELEGRAM_ADMIN_ID)
    }
