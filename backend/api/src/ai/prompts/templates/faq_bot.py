"""Template-specific prompt for Telegram FAQ bot generation (v2-light architecture)."""

FAQ_BOT_PROMPT = """\
## FAQ Bot — Template-Specific Instructions

Generate a knowledge base / FAQ Telegram bot following v2-light architecture.

### Required Models

**FaqCategory** (`infrastructure/database/models/faq_categories.py`):
- id: int_pk
- name: Mapped[str] = mapped_column(String(255))
- description: Mapped[str | None] = mapped_column(String(500))
- sort_order: Mapped[int] = mapped_column(default=0)
- is_active: Mapped[bool] = mapped_column(server_default="true")
- Mixins: TableNameMixin, TimestampMixin

**FaqItem** (`infrastructure/database/models/faq_items.py`):
- id: int_pk
- category_id: Mapped[int] = mapped_column(ForeignKey("faq_categories.id"))
- question: Mapped[str] = mapped_column(String(500))
- answer: Mapped[str] = mapped_column(Text)
- sort_order: Mapped[int] = mapped_column(default=0)
- is_active: Mapped[bool] = mapped_column(server_default="true")
- Mixins: TableNameMixin, TimestampMixin

**SupportRequest** (`infrastructure/database/models/support_requests.py`):
- id: int_pk
- user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
- question_text: Mapped[str] = mapped_column(Text)
- status: Mapped[str] = mapped_column(String(20), default="pending")
- Mixins: TableNameMixin, TimestampMixin

### Required Repositories
- FaqCategoryRepository — get_active_categories()
- FaqItemRepository — get_by_category(category_id), search(query)
- SupportRequestRepository — get_pending()

Register ALL in uow.py with lazy properties before `# === REGISTER NEW REPOSITORIES ABOVE ===`.

### Required Services
- **FaqService** — get_categories(), get_items_by_category(), get_item(), search(query)
- **SupportService** — create_request(user_id, text), get_pending(), close_request()

Register ALL in di_container.py ServiceProvider before `# === REGISTER NEW SERVICES ABOVE ===`.

### Required Handlers
- `handlers/user/start.py` — /start with welcome and popular questions
- `handlers/user/faq.py` — /categories, category selection, question list, answer display
- `handlers/user/search.py` — /search <query>, inline search results
- `handlers/user/support.py` — /operator, FSM for submitting question to support
- `handlers/admin/support.py` — view pending requests, reply to user

Register ALL in main.py register_routers() before `# === REGISTER NEW ROUTERS ABOVE ===`.

### Required Keyboards
- `keyboards/faq.py` — categories_keyboard(), questions_keyboard(category_id), answer_keyboard(item_id)
- `keyboards/support.py` — support_menu_keyboard(), request_actions_keyboard(request_id)

### FSM States
- `states/support.py` — SupportForm: waiting_for_question

### Bot Commands
- /start — welcome with popular questions as buttons
- /categories — show all FAQ categories
- /search <query> — search knowledge base
- /operator — request human support
- /help — how to use the bot

### Seed Data Implementation  
Generate file `infrastructure/services/_seed_impl.py` with function:
```python
async def run_seed(session):
    "Seed initial FAQ categories and items."
    from infrastructure.database.models.faq_categories import FaqCategory
    from infrastructure.database.models.faq_items import FaqItem
    from sqlalchemy import select
    
    # Idempotent check
    existing = await session.execute(select(FaqCategory).limit(1))
    if existing.scalar_one_or_none():
        return
    
    # Insert categories
    delivery_cat = FaqCategory(name="Доставка", description="Вопросы о доставке", is_active=True, sort_order=1)
    payment_cat = FaqCategory(name="Оплата", description="Способы оплаты и возврат", is_active=True, sort_order=2)
    returns_cat = FaqCategory(name="Возврат", description="Возврат и обмен товара", is_active=True, sort_order=3)
    session.add_all([delivery_cat, payment_cat, returns_cat])
    await session.flush()
    
    # Insert FAQ items
    faq_items = [
        # Delivery
        FaqItem(category_id=delivery_cat.id, question="Сколько времени занимает доставка?", answer="<b>Доставка занимает 1-3 рабочих дня</b> по Москве и области. В другие регионы — 3-7 дней.", is_active=True, views=0),
        FaqItem(category_id=delivery_cat.id, question="Бесплатная ли доставка?", answer="Да! <b>Доставка бесплатная</b> при заказе от 2000 рублей. При меньшей сумме — 300 рублей.", is_active=True, views=0),
        FaqItem(category_id=delivery_cat.id, question="Можно ли отследить заказ?", answer="Конечно! После отправки вы получите <i>трек-номер</i> для отслеживания на сайте курьерской службы.", is_active=True, views=0),
        # Payment
        FaqItem(category_id=payment_cat.id, question="Какие способы оплаты доступны?", answer="Принимаем <b>карты, СБП, наличные курьеру</b>. Онлайн-оплата полностью безопасна.", is_active=True, views=0),
        FaqItem(category_id=payment_cat.id, question="Можно ли вернуть деньги?", answer="Да, возврат средств возможен в течение <b>14 дней</b> после получения заказа. Деньги вернутся тем же способом.", is_active=True, views=0),
        FaqItem(category_id=payment_cat.id, question="Есть ли рассрочка?", answer="Да! Доступна <b>рассрочка на 4 месяца</b> без переплат через наших партнеров.", is_active=True, views=0),
        # Returns
        FaqItem(category_id=returns_cat.id, question="Какой срок возврата товара?", answer="<b>14 дней</b> с момента получения. Товар должен быть в оригинальной упаковке и не использован.", is_active=True, views=0),
        FaqItem(category_id=returns_cat.id, question="Как оформить возврат?", answer="Напишите в поддержку или позвоните по номеру на сайте. Мы вышлем курьера за товаром <i>бесплатно</i>.", is_active=True, views=0),
        FaqItem(category_id=returns_cat.id, question="Можно ли обменять товар?", answer="Да! Обмен возможен в течение <b>14 дней</b>. Курьер заберет старый товар и привезет новый.", is_active=True, views=0),
    ]
    session.add_all(faq_items)
```


### Search Implementation
Search in FaqItemRepository using ILIKE on both question and answer fields:
```python
async def search(self, query: str) -> list[FaqItem]:
    stmt = select(FaqItem).where(
        or_(
            FaqItem.question.ilike(f"%{query}%"),
            FaqItem.answer.ilike(f"%{query}%"),
        )
    ).limit(10)
    result = await self.session.execute(stmt)
    return list(result.scalars().all())
```

### Escalation Flow
1. User searches → no satisfactory answer → "Didn't find answer?" button
2. User clicks → enters question text (FSM)
3. Bot creates SupportRequest, notifies admin
4. Admin sees pending requests, can reply (bot forwards reply to user)

### UX
- All text in Russian
- Inline keyboards for category/question navigation
- "Back" button on every screen
- "Was this helpful?" feedback after answer
- Search results with relevance indication
"""
