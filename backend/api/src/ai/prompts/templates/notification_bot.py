"""Template-specific prompt for Telegram notification/broadcast bot generation (v2-light architecture)."""

NOTIFICATION_BOT_PROMPT = """\
## Notification Bot — Template-Specific Instructions

Generate a subscriber notification / broadcast Telegram bot following v2-light architecture.

### Required Models

**Subscriber** (`infrastructure/database/models/subscribers.py`):
- id: int_pk
- telegram_id: Mapped[int] = mapped_column(BIGINT, unique=True, index=True)
- username: Mapped[str | None] = mapped_column(String(255))
- first_name: Mapped[str | None] = mapped_column(String(255))
- is_active: Mapped[bool] = mapped_column(server_default="true")
- subscribed_at: Mapped[datetime] (use TimestampMixin created_at)
- Mixins: TableNameMixin, TimestampMixin

**Broadcast** (`infrastructure/database/models/broadcasts.py`):
- id: int_pk
- text: Mapped[str] = mapped_column(Text)
- sent_count: Mapped[int] = mapped_column(default=0)
- failed_count: Mapped[int] = mapped_column(default=0)
- status: Mapped[str] = mapped_column(String(20), default="pending")
- created_by: Mapped[int] = mapped_column(BIGINT)
- Mixins: TableNameMixin, TimestampMixin

### Required Repositories
- SubscriberRepository — get_active_subscribers(), get_by_telegram_id(tg_id), get_stats()
- BroadcastRepository — get_recent(limit), get_by_id(id)

Register ALL in uow.py with lazy properties before `# === REGISTER NEW REPOSITORIES ABOVE ===`.

### Required Services
- **SubscriberService** — subscribe(user), unsubscribe(telegram_id), is_subscribed(telegram_id), get_stats()
- **BroadcastService** — create_broadcast(text, admin_id), send_broadcast(broadcast_id, bot), get_history()

Register ALL in di_container.py ServiceProvider before `# === REGISTER NEW SERVICES ABOVE ===`.

### Required Handlers
- `handlers/user/start.py` — /start subscribes user, welcome message; /stop unsubscribes
- `handlers/user/status.py` — /status shows subscription info
- `handlers/admin/broadcast.py` — /broadcast, FSM for composing and sending broadcast
- `handlers/admin/stats.py` — /stats shows subscriber statistics

Register ALL in main.py register_routers() before `# === REGISTER NEW ROUTERS ABOVE ===`.

### Required Keyboards
- `keyboards/common.py` — main_menu_keyboard(), subscribe_keyboard()
- `keyboards/admin.py` — admin_menu_keyboard(), broadcast_confirm_keyboard(), broadcast_preview_keyboard()

### FSM States
- `states/broadcast.py` — BroadcastForm: waiting_for_text, confirmation

### Bot Commands
- /start — subscribe + welcome message with bot description
- /stop — unsubscribe from notifications
- /status — show subscription status
- /help — command list
- /broadcast — start broadcast (admin only)
- /stats — subscriber statistics (admin only)

### Broadcast Flow
1. Admin sends /broadcast → bot asks for message text
2. Admin sends text → bot shows preview + "Send to all" / "Cancel" buttons
3. Confirm → bot iterates over active subscribers with progress counter
4. Complete → admin gets report (sent: N, failed: N, total: N)

### Broadcast Implementation
```python
async def send_broadcast(self, broadcast_id: int, bot: Bot) -> dict:
    broadcast = await self.uow.broadcasts.get(broadcast_id)
    subscribers = await self.uow.subscribers.get_active_subscribers()
    sent, failed = 0, 0

    for sub in subscribers:
        try:
            await bot.send_message(sub.telegram_id, broadcast.text)
            sent += 1
        except Exception:
            failed += 1

        if (sent + failed) % 20 == 0:
            await asyncio.sleep(1)  # Telegram rate limit

    broadcast.sent_count = sent
    broadcast.failed_count = failed
    broadcast.status = "completed"
    await self.uow.session.flush()
    return {"sent": sent, "failed": failed, "total": len(subscribers)}
```

### Admin Filter
Use admin filter checking BOT__ADMIN_IDS from settings:
```python
# apps/bot/filters/admin.py
from aiogram.filters import BaseFilter
from aiogram.types import Message
from config.settings.base import get_settings

class IsAdmin(BaseFilter):
    async def __call__(self, message: Message) -> bool:
        settings = get_settings()
        return message.from_user.id in settings.bot.admin_ids
```

### UX
- All text in Russian
- Welcome message explains what notifications the bot sends
- Farewell message on unsubscribe with "resubscribe" button
- Broadcast progress indicator for admin (e.g., "Sent 45/120...")
- Error handling for blocked users during broadcast (mark as inactive)

### Seed Data Implementation
No seed data needed for notification bot.
Subscribers are added automatically when users interact with the bot.
Generate an empty `infrastructure/services/_seed_impl.py`:
async def run_seed(session):
    pass  # No seed data needed
"""
