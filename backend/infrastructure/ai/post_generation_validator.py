"""Post-generation code validator.

DEPRECATED: This standalone CLI validator has been integrated into
OutputValidator (api.src.ai.core.validators). Use OutputValidator.validate()
and OutputValidator.validate_and_fix() instead.

Runs after AI generates code but BEFORE deployment to catch common mistakes.
"""
import ast
import os
import re
from pathlib import Path
from typing import Any


class CodeValidationError(Exception):
    """Code validation failed."""
    pass


def validate_telegram_bot_code(project_dir: Path) -> dict[str, Any]:
    """Validate generated Telegram bot code.
    
    Returns:
        dict with status, errors, warnings
    """
    errors = []
    warnings = []
    
    # 1. Check main menu uses ReplyKeyboard (not InlineKeyboard)
    keyboards_dir = project_dir / "apps" / "bot" / "keyboards"
    if keyboards_dir.exists():
        for kb_file in keyboards_dir.glob("*.py"):
            content = kb_file.read_text()
            
            # Check main_menu/common keyboard
            if "main_menu" in kb_file.name or "common" in kb_file.name:
                if "InlineKeyboardMarkup" in content and "get_main_menu" in content:
                    # Main menu should use ReplyKeyboard
                    if "ReplyKeyboardMarkup" not in content:
                        errors.append(
                            f"{kb_file.name}: Main menu MUST use ReplyKeyboardMarkup, not InlineKeyboardMarkup. "
                            "Users expect buttons at the bottom of the screen."
                        )
    
    # 2. Check all ReplyKeyboard buttons have handlers
    button_texts = set()
    handler_patterns = set()
    
    # Find all button texts
    if keyboards_dir.exists():
        for kb_file in keyboards_dir.glob("*.py"):
            content = kb_file.read_text()
            # Match: builder.button(text="Some Text")
            matches = re.findall(r'builder\.button\(text=["\']([^"\'\n]+)["\']\)', content)
            button_texts.update(matches)
    
    # Find all message handlers
    handlers_dir = project_dir / "apps" / "bot" / "handlers"
    if handlers_dir.exists():
        for handler_file in handlers_dir.rglob("*.py"):
            content = handler_file.read_text()
            # Match: @router.message(F.text == "Some Text")
            matches = re.findall(r'F\.text\s*==\s*["\']([^"\'\n]+)["\']', content)
            handler_patterns.update(matches)
    
    # Check missing handlers
    missing_handlers = button_texts - handler_patterns
    if missing_handlers:
        errors.append(
            f"Missing handlers for buttons: {missing_handlers}. "
            "Every ReplyKeyboard button MUST have a matching @router.message(F.text == ...) handler."
        )
    
    # 3. Check all routers are registered
    main_py = project_dir / "apps" / "bot" / "main.py"
    if main_py.exists():
        main_content = main_py.read_text()
        
        # Find all router files
        if handlers_dir.exists():
            for handler_file in handlers_dir.rglob("*.py"):
                if handler_file.name.startswith("_") or handler_file.name == "__init__.py":
                    continue
                
                router_name = handler_file.stem
                
                # Check if router is imported and registered
                if f"from apps.bot.handlers" not in main_content:
                    continue
                    
                if router_name not in main_content or f"{router_name}.router" not in main_content:
                    warnings.append(
                        f"Router '{router_name}' may not be registered in main.py. "
                        "Check register_routers() function."
                    )
    
    # 4. Check models have user_id for user-scoped tables
    models_dir = project_dir / "infrastructure" / "database" / "models"
    if models_dir.exists():
        for model_file in models_dir.glob("*.py"):
            if model_file.name in ["__init__.py", "base.py"]:
                continue
                
            content = model_file.read_text()
            
            # Find class definitions
            classes = re.findall(r'class (\w+)\(Base', content)
            
            for class_name in classes:
                # Skip User model and non-user-scoped models
                if class_name.lower() in ["user", "schedule", "setting"]:
                    continue
                
                # Check if has user_id
                if "user_id" not in content.lower():
                    warnings.append(
                        f"Model {class_name} might be missing user_id foreign key. "
                        "Most user-scoped data should have user_id."
                    )
    
    # 5. Check SQLAlchemy model imports in __init__.py
    models_init = models_dir / "__init__.py" if models_dir.exists() else None
    if models_init and models_init.exists():
        init_content = models_init.read_text()
        
        for model_file in models_dir.glob("*.py"):
            if model_file.name in ["__init__.py", "base.py"]:
                continue
            
            model_name = model_file.stem
            if model_name not in init_content:
                errors.append(
                    f"Model file {model_file.name} is not imported in models/__init__.py. "
                    "All models MUST be imported for Base.metadata.create_all() to work."
                )
    
    # Determine overall status
    if errors:
        status = "failed"
    elif warnings:
        status = "warning"
    else:
        status = "success"
    
    return {
        "status": status,
        "errors": errors,
        "warnings": warnings,
    }


def main():
    """CLI entry point."""
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python post_generation_validator.py <project_dir>")
        sys.exit(1)
    
    project_dir = Path(sys.argv[1])
    
    if not project_dir.exists():
        print(f"❌ Project directory not found: {project_dir}")
        sys.exit(1)
    
    print("🔍 Validating generated code...")
    result = validate_telegram_bot_code(project_dir)
    
    if result["errors"]:
        print(f"\n❌ {len(result['errors'])} ERRORS found:")
        for err in result["errors"]:
            print(f"  - {err}")
    
    if result["warnings"]:
        print(f"\n⚠️  {len(result['warnings'])} warnings:")
        for warn in result["warnings"]:
            print(f"  - {warn}")
    
    if result["status"] == "success":
        print("\n✅ Validation passed!")
        sys.exit(0)
    elif result["status"] == "warning":
        print("\n⚠️  Validation passed with warnings")
        sys.exit(0)
    else:
        print("\n❌ Validation FAILED - fix errors before deployment!")
        sys.exit(1)


if __name__ == "__main__":
    main()
