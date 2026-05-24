"""Template-specific prompt for Telegram booking/appointment bot generation (v2-light architecture)."""

BOOKING_BOT_PROMPT = """\
## Booking Bot — Template-Specific Instructions

Generate a booking / appointment scheduling Telegram bot following v2-light architecture.

### Required Models

**Service** (`infrastructure/database/models/services.py`):
- id: int_pk
- name: Mapped[str] = mapped_column(String(255))
- description: Mapped[str | None] = mapped_column(String(500))
- duration_minutes: Mapped[int] = mapped_column(default=60)
- price: Mapped[float] = mapped_column(Numeric(10, 2))
- is_active: Mapped[bool] = mapped_column(server_default="true")
- Mixins: TableNameMixin, TimestampMixin

**Booking** (`infrastructure/database/models/bookings.py`):
- id: int_pk
- user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
- service_id: Mapped[int] = mapped_column(ForeignKey("services.id"))
- booking_date: Mapped[date] = mapped_column(Date)
- booking_time: Mapped[time] = mapped_column(Time)
- status: Mapped[str] = mapped_column(String(20), default="confirmed")
- Mixins: TableNameMixin, TimestampMixin

### Required Repositories
- ServiceRepository — get_active_services()
- BookingRepository — get_by_user(user_id), get_by_date(date), get_upcoming(user_id), cancel(booking_id)

Register ALL in uow.py with lazy properties before `# === REGISTER NEW REPOSITORIES ABOVE ===`.

### Required Services
- **ServiceService** — get_services(), get_service(id)
- **BookingService** — get_available_dates(), get_available_slots(date, service_id), create_booking(), cancel_booking(), get_user_bookings()

Register ALL in di_container.py ServiceProvider before `# === REGISTER NEW SERVICES ABOVE ===`.

### Required Handlers
- `handlers/user/start.py` — /start with main menu
- `handlers/user/book.py` — /book, FSM flow: service → date → time → confirmation
- `handlers/user/mybookings.py` — /mybookings, list upcoming, cancel option
- `handlers/admin/bookings.py` — /admin, view all bookings, manage schedule

Register ALL in main.py register_routers() before `# === REGISTER NEW ROUTERS ABOVE ===`.

### Required Keyboards
- `keyboards/booking.py` — services_keyboard(), dates_keyboard(), time_slots_keyboard(date, service_id), confirm_keyboard()
- `keyboards/mybookings.py` — bookings_list_keyboard(bookings), cancel_confirm_keyboard(booking_id)

### FSM States
- `states/booking.py` — BookingForm: selecting_service, selecting_date, selecting_time, confirmation

### Bot Commands
- /start — welcome message with main menu
- /book — start booking flow
- /mybookings — view upcoming bookings
- /cancel — cancel a booking
- /help — command list

### Booking Flow (step-by-step inline keyboards)
1. User clicks "Book" → inline keyboard with active services (name + price)
2. Selects service → inline keyboard with next 7 days (Пн 24 фев, Вт 25 фев...)
3. Selects date → inline keyboard with available 30-min time slots (9:00, 9:30, 10:00...)
4. Selects time → summary card: service name, date, time, price, duration
5. Confirms → booking saved, admin notified, user gets confirmation

### Available Slots Logic
```python
async def get_available_slots(self, date: date, service_id: int) -> list[time]:
    service = await self.uow.services.get(service_id)
    existing = await self.uow.bookings.get_by_date(date)
    booked_times = {b.booking_time for b in existing if b.status != "cancelled"}

    slots = []
    current = time(9, 0)
    end = time(20, 0)
    while current < end:
        if current not in booked_times:
            slots.append(current)
        minutes = current.hour * 60 + current.minute + 30
        current = time(minutes // 60, minutes % 60)
    return slots
```

### Date Keyboard
```python
from datetime import date, timedelta

def dates_keyboard() -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    today = date.today()
    weekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
    months = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"]

    for i in range(1, 8):
        d = today + timedelta(days=i)
        wd = weekdays[d.weekday()]
        mon = months[d.month - 1]
        builder.button(
            text=f"{wd} {d.day} {mon}",
            callback_data=f"date_{d.isoformat()}"
        )
    builder.adjust(2)
    return builder.as_markup()
```

### Seed Data Implementation  
Generate file `infrastructure/services/_seed_impl.py` with function:
```python
async def run_seed(session):
    "Seed initial services for booking bot."
    from infrastructure.database.models.services import Service
    from sqlalchemy import select
    
    # Idempotent check
    existing = await session.execute(select(Service).limit(1))
    if existing.scalar_one_or_none():
        return
    
    # Insert services
    from decimal import Decimal
    services = [
        Service(name="Стрижка мужская", description="Классическая мужская стрижка", duration_minutes=60, price=Decimal("1500.00"), is_active=True),
        Service(name="Стрижка женская", description="Женская стрижка любой сложности", duration_minutes=90, price=Decimal("2500.00"), is_active=True),
        Service(name="Маникюр", description="Классический маникюр с покрытием", duration_minutes=60, price=Decimal("2000.00"), is_active=True),
        Service(name="Массаж классический", description="Расслабляющий массаж всего тела", duration_minutes=60, price=Decimal("3000.00"), is_active=True),
        Service(name="Окрашивание", description="Профессиональное окрашивание волос", duration_minutes=120, price=Decimal("5000.00"), is_active=True),
    ]
    session.add_all(services)
```


### Admin Features
Admin can:
- View all bookings for today/tomorrow
- See booking details (user, service, time)
- Receive notifications about new bookings and cancellations

### UX
- All text in Russian
- Step-by-step inline keyboard flow (no text input for booking)
- "Back" button at each step to return to previous selection
- Booking summary before confirmation
- Date display in Russian format
- Unavailable slots hidden (not shown as disabled)
- Confirmation and cancellation messages to both user and admin
"""
