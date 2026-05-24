"""Template-specific prompt for Telegram shop bot generation (v2-light architecture)."""

SHOP_BOT_PROMPT = """\
## Shop Bot — Template-Specific Instructions

Generate a full e-commerce Telegram bot following v2-light architecture.

### Required Models

**Product** (`infrastructure/database/models/products.py`):
- id: int_pk
- name: Mapped[str] = mapped_column(String(255))
- description: Mapped[str | None] = mapped_column(Text)
- price: Mapped[float] = mapped_column(Numeric(10, 2))
- category: Mapped[str] = mapped_column(String(100))
- is_active: Mapped[bool] = mapped_column(server_default="true")
- Mixins: TableNameMixin, TimestampMixin

**Order** (`infrastructure/database/models/orders.py`):
- id: int_pk
- user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
- status: Mapped[str] = mapped_column(String(20), default="pending")
- total_amount: Mapped[float] = mapped_column(Numeric(10, 2))
- delivery_address: Mapped[str | None] = mapped_column(Text)
- Mixins: TableNameMixin, TimestampMixin

**OrderItem** (`infrastructure/database/models/order_items.py`):
- id: int_pk
- order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"))
- product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
- quantity: Mapped[int]
- price: Mapped[float] = mapped_column(Numeric(10, 2))

### Required Repositories
- ProductRepository — get_active_products(), get_by_category(category)
- OrderRepository — get_by_user(user_id), get_pending()
- OrderItemRepository — get_by_order(order_id)

Register ALL in uow.py with lazy properties before `# === REGISTER NEW REPOSITORIES ABOVE ===`.

### Required Services
- **ProductService** — get_catalog(), get_categories(), get_products_by_category(), get_product()
- **CartService** — in-memory cart via dict[int, list] (no DB), add_item(), remove_item(), get_cart(), clear_cart(), get_total()
- **OrderService** — create_order(user_id, cart_items, address), get_user_orders(), update_status()

Register ALL in di_container.py ServiceProvider before `# === REGISTER NEW SERVICES ABOVE ===`.

### Required Handlers
- `handlers/user/start.py` — /start with main menu keyboard
- `handlers/user/catalog.py` — /catalog, category selection, product cards with "Add to cart" button
- `handlers/user/cart.py` — /cart, view cart, remove items, clear, proceed to checkout
- `handlers/user/order.py` — checkout FSM (delivery address → confirmation → order created)
- `handlers/admin/orders.py` — /orders (admin), pending orders list, confirm/reject order

Register ALL in main.py register_routers() before `# === REGISTER NEW ROUTERS ABOVE ===`.

### Required Keyboards
- `keyboards/catalog.py` — categories_keyboard(), products_keyboard(category), product_card_keyboard(product_id)
- `keyboards/cart.py` — cart_keyboard(), checkout_keyboard()
- `keyboards/admin.py` — admin_menu_keyboard(), order_actions_keyboard(order_id)

### FSM States
- `states/order.py` — OrderForm: waiting_for_address, confirmation

### Bot Commands
- /start — welcome message with main menu
- /catalog — show product categories
- /cart — view current cart
- /orders — user's order history
- /help — command list

### Seed Data Implementation  
Generate file `infrastructure/services/_seed_impl.py` with function:
```python
async def run_seed(session):
    "Seed initial categories and products for shop bot."
    from infrastructure.database.models.categories import Category
    from infrastructure.database.models.products import Product
    from sqlalchemy import select
    
    # Idempotent check
    existing = await session.execute(select(Category).limit(1))
    if existing.scalar_one_or_none():
        return
    
    # Insert categories
    pizza_cat = Category(name="Pizza", description="Вкусная пицца", is_active=True)
    drinks_cat = Category(name="Напитки", description="Прохладительные напитки", is_active=True)
    session.add_all([pizza_cat, drinks_cat])
    await session.flush()
    
    # Insert products
    from decimal import Decimal
    products = [
        Product(name="Маргарита", description="Классическая пицца с моцареллой и томатами", price=Decimal("590.00"), category_id=pizza_cat.id, is_active=True, stock=100),
        Product(name="Пепперони", description="Острая пицца с колбасой пепперони", price=Decimal("690.00"), category_id=pizza_cat.id, is_active=True, stock=100),
        Product(name="Четыре сыра", description="Пицца с 4 видами сыра", price=Decimal("790.00"), category_id=pizza_cat.id, is_active=True, stock=100),
        Product(name="Кола", description="Coca-Cola 0.5л", price=Decimal("150.00"), category_id=drinks_cat.id, is_active=True, stock=50),
        Product(name="Сок", description="Апельсиновый сок 0.3л", price=Decimal("180.00"), category_id=drinks_cat.id, is_active=True, stock=50),
        Product(name="Вода", description="Минеральная вода 0.5л", price=Decimal("90.00"), category_id=drinks_cat.id, is_active=True, stock=100),
    ]
    session.add_all(products)
```


### Admin Features
Admin filter using BOT__ADMIN_IDS from settings. Admin can:
- View pending orders with details
- Confirm or reject orders (notify user about status change)

### UX
- All text in Russian
- Inline keyboards throughout
- "Back" button on every screen
- Cart summary with item count and total
- Order confirmation with full summary before placing
"""
