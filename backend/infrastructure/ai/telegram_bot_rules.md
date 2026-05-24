# Telegram Bot Code Generation Rules

**MANDATORY:** Follow these rules when generating Telegram bot code.

## 1. Keyboard Types - CRITICAL RULE

### Main Menu (Primary Navigation)
- **MUST use ReplyKeyboardMarkup** (buttons at the bottom of the screen)
- **NEVER use InlineKeyboardMarkup for main menu**
- Users expect persistent buttons at the bottom, not inline buttons inside messages

Example CORRECT main menu:
```python
from aiogram.types import ReplyKeyboardMarkup
from aiogram.utils.keyboard import ReplyKeyboardBuilder

def get_main_menu_keyboard() -> ReplyKeyboardMarkup:
    builder = ReplyKeyboardBuilder()
    builder.button(text="📅 Book Training")
    builder.button(text="📋 My Trainings")
    builder.adjust(2)
    return builder.as_markup(resize_keyboard=True)
```

### Sub-Menus and Actions
- Use InlineKeyboardMarkup for sub-menus, date pickers, action confirmations

## 2. Button → Handler Mapping

Every ReplyKeyboard button MUST have a handler with EXACT text match:
- Keyboard: `builder.button(text="📅 Book Training")`
- Handler: `@router.message(F.text == "📅 Book Training")`

Every InlineKeyboard button MUST have a callback handler:
- Button: `builder.button(text="Cancel", callback_data="cancel_booking")`
- Handler: `@router.callback_query(F.data == "cancel_booking")`

## 3. Router Registration

All routers MUST be registered in main.py in correct order:
1. start.router - first
2. Menu handlers - second
3. Feature routers - middle
4. errors.router - last (catch-all)

## 4. Model Design

All user-related models MUST have user_id foreign key

Exceptions (no user_id needed):
- User model itself
- Global settings (Schedule, Config)
- Reference data

## 5. Model Import Registration

All models MUST be imported in models/__init__.py for Base.metadata.create_all() to work

## 6. Error Handling

All database operations MUST have try/except with user-friendly messages

## 7. Callback Query Answers

ALWAYS call await callback.answer() to prevent loading spinner

## 8. Database URL Format

For pgBouncer/Supabase pooler compatibility, set statement_cache_size=0

## Summary Checklist

Before generating final code, verify:

- [ ] Main menu uses ReplyKeyboardMarkup (NOT InlineKeyboardMarkup)
- [ ] All ReplyKeyboard buttons have matching handlers
- [ ] All InlineKeyboard buttons have callback handlers
- [ ] All routers registered in main.py
- [ ] All user-scoped models have user_id
- [ ] All models imported in models/__init__.py
- [ ] All services registered in di_container.py
- [ ] Database errors caught and handled
- [ ] Callback queries answered
- [ ] Schema validator enabled

**If any checkbox is unchecked → CODE IS INVALID. FIX before deployment!**
