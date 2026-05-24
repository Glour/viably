# AI Code Validation Checklist (Pre-Deploy)

**MANDATORY:** Run this checklist BEFORE generating final code for user.

## 1. Database Schema Consistency

- [ ] All SQLAlchemy models have matching table columns
- [ ] Foreign keys are defined correctly (user_id, etc.)
- [ ] No missing required fields in models
- [ ] Relationships (back_populates) are bidirectional

**Check:** Verify all mapped columns exist, ForeignKey targets exist, Relationships have matching back_populates

## 2. Handler Registration

- [ ] All routers are imported in main.py
- [ ] Router names match file names
- [ ] Router order is correct (start -> features -> errors)
- [ ] All handlers have proper filters (F.text, CommandStart, etc.)

**Check:** In apps/bot/main.py, verify register_routers imports and includes all routers

## 3. Button → Handler Mapping

For EVERY button in keyboards:

- [ ] **ReplyKeyboard** buttons have matching `@router.message(F.text == "...")` handlers
- [ ] **InlineKeyboard** buttons have matching `@router.callback_query(F.data == "...")` handlers
- [ ] Callback data format is consistent (e.g., `action:subaction:id`)

**Critical:** Button text MUST match handler filter EXACTLY

## 4. Service Dependencies

- [ ] All services injected via Dishka (`FromDishka[ServiceType]`)
- [ ] Services are registered in `di_container.py`
- [ ] No circular imports between services
- [ ] Database session management is correct (UoW pattern)

## 5. Environment Variables

- [ ] All required env vars are documented
- [ ] Default values are safe (no hardcoded secrets)
- [ ] Database URL format is validated
- [ ] Bot token validation exists

## 6. Error Handling

- [ ] All database operations have try/except
- [ ] User-friendly error messages (no stack traces to users)
- [ ] Error router catches unhandled exceptions
- [ ] Logging is present for debugging

## 7. State Management (if using FSM)

- [ ] States are defined in `states/` module
- [ ] State transitions are logical
- [ ] State cleanup on cancellation
- [ ] No orphaned states

## 8. Inline Keyboard Navigation

- [ ] All "⬅️ Back" buttons work
- [ ] Navigation paths are consistent
- [ ] No dead-end menus
- [ ] Callback queries are answered (`await callback.answer()`)

## 9. Database Migrations

- [ ] Tables are created via `Base.metadata.create_all()` OR Alembic
- [ ] Schema validator is enabled
- [ ] No manual SQL table creation

## 10. Testing Checklist

Before final code generation:

1. **Simulate user flow:**
   - /start → Main menu appears?
   - Each button → Handler exists?
   - Each inline button → Callback handler exists?

2. **Check imports:**
   - No `ImportError` possible?
   - All models imported in `models/__init__.py`?

3. **Check database:**
   - All tables have `user_id` foreign key (if user-scoped)?
   - No missing columns vs. model definition?

---

## Final Validation Command

Run schema validator before deploying:
`python infrastructure/services/schema_validator.py`

Check router registration and imports work correctly

---

## If ANY checkbox is unchecked → FIX before generating code!
