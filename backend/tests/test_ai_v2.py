"""Tests for Generation System v2."""

import pytest
from pydantic import ValidationError as PydanticValidationError


class TestPromptModels:
    """Test Pydantic models creation and defaults."""

    def test_prompt_layer_creation(self):
        """Create PromptLayer with all fields, verify type Literal validation."""
        from api.src.ai.models.prompt import PromptLayer

        for layer_type in ("base", "category", "template"):
            layer = PromptLayer(
                type=layer_type,
                name=f"test-{layer_type}",
                content="Some content",
                priority=5,
            )
            assert layer.type == layer_type
            assert layer.name == f"test-{layer_type}"
            assert layer.content == "Some content"
            assert layer.priority == 5

    def test_prompt_layer_invalid_type(self):
        """Invalid type should raise ValidationError."""
        from api.src.ai.models.prompt import PromptLayer

        with pytest.raises(PydanticValidationError):
            PromptLayer(
                type="invalid",
                name="bad-layer",
                content="content",
                priority=0,
            )

    def test_prompt_context_defaults(self):
        """Default values: user_config={}, everything else None."""
        from api.src.ai.models.prompt import PromptContext

        ctx = PromptContext()
        assert ctx.template_slug is None
        assert ctx.category is None
        assert ctx.user_config == {}
        assert ctx.user_prompt is None
        assert ctx.template_prompt is None

    def test_composed_prompt_metadata(self):
        """layers_used defaults to [], metadata to {}."""
        from api.src.ai.models.prompt import ComposedPrompt

        cp = ComposedPrompt(system_prompt="sys", user_prompt="usr")
        assert cp.layers_used == []
        assert cp.metadata == {}
        assert cp.system_prompt == "sys"
        assert cp.user_prompt == "usr"

    def test_generation_result_defaults(self):
        """files={}, validation_passed=True, etc."""
        from api.src.ai.models.generation import GenerationResult

        result = GenerationResult(success=True)
        assert result.success is True
        assert result.files == {}
        assert result.files_count == 0
        assert result.validation_passed is True
        assert result.validation_errors == []

    def test_validation_error_fields(self):
        """All fields including auto_fixable=False default."""
        from api.src.ai.models.validation import ValidationError

        err = ValidationError(
            file_path="index.html",
            severity="error",
            code="TEST_ERROR",
            message="Something failed",
        )
        assert err.file_path == "index.html"
        assert err.severity == "error"
        assert err.code == "TEST_ERROR"
        assert err.message == "Something failed"
        assert err.line is None
        assert err.auto_fixable is False

    def test_validation_result_defaults(self):
        """errors=[], warnings=[], auto_fixed_count=0."""
        from api.src.ai.models.validation import ValidationResult

        vr = ValidationResult(passed=True)
        assert vr.passed is True
        assert vr.errors == []
        assert vr.warnings == []
        assert vr.auto_fixed_count == 0


class TestPromptRegistry:
    """Test prompt layer resolution."""

    def test_base_always_included(self):
        """get_prompt_layers(None, None) returns at least base."""
        from api.src.ai.prompts.registry import get_prompt_layers

        layers = get_prompt_layers(None, None)
        assert len(layers) >= 1
        assert layers[0].type == "base"
        assert layers[0].name == "base"

    def test_category_resolved(self):
        """get_prompt_layers("website", None) returns base + category."""
        from api.src.ai.prompts.registry import get_prompt_layers

        layers = get_prompt_layers("website", None)
        assert len(layers) == 2
        assert layers[0].type == "base"
        assert layers[1].type == "category"
        assert layers[1].name == "category:website"

    def test_template_resolved(self):
        """get_prompt_layers("website", "landing-page") returns 3 layers."""
        # Ensure template prompts are registered
        import api.src.ai.prompts.templates  # noqa: F401
        from api.src.ai.prompts.registry import get_prompt_layers

        layers = get_prompt_layers("website", "landing-page")
        assert len(layers) == 3
        types = [l.type for l in layers]
        assert types == ["base", "category", "template"]
        assert layers[2].name == "template:landing-page"

    def test_unknown_category_skipped(self):
        """get_prompt_layers("unknown", None) returns only base."""
        from api.src.ai.prompts.registry import get_prompt_layers

        layers = get_prompt_layers("unknown", None)
        assert len(layers) == 1
        assert layers[0].type == "base"

    def test_unknown_slug_skipped(self):
        """get_prompt_layers("website", "unknown") returns base + category."""
        from api.src.ai.prompts.registry import get_prompt_layers

        layers = get_prompt_layers("website", "unknown")
        assert len(layers) == 2
        assert layers[0].type == "base"
        assert layers[1].type == "category"

    def test_layer_priority_order(self):
        """Layers sorted: base(0) < category(10) < template(20)."""
        import api.src.ai.prompts.templates  # noqa: F401
        from api.src.ai.prompts.registry import get_prompt_layers

        layers = get_prompt_layers("website", "landing-page")
        priorities = [l.priority for l in layers]
        assert priorities == sorted(priorities)
        assert priorities == [0, 10, 20]

    def test_register_custom_template(self):
        """register_template_prompt("custom", "content") then get_prompt_layers resolves it."""
        from api.src.ai.prompts.registry import (
            get_prompt_layers,
            register_template_prompt,
            _template_prompts,
        )

        register_template_prompt("custom-test", "Custom template content")
        try:
            layers = get_prompt_layers("website", "custom-test")
            assert len(layers) == 3
            assert layers[2].type == "template"
            assert layers[2].name == "template:custom-test"
            assert layers[2].content == "Custom template content"
        finally:
            # Cleanup to avoid polluting other tests
            _template_prompts.pop("custom-test", None)


class TestPromptBuilder:
    """Test prompt composition."""

    def test_build_with_template(self):
        """Build with category + slug + template_prompt with variables."""
        import api.src.ai.prompts.templates  # noqa: F401
        from api.src.ai.core.prompt_builder import PromptBuilder
        from api.src.ai.models.prompt import PromptContext

        builder = PromptBuilder()
        context = PromptContext(
            template_slug="landing-page",
            category="website",
            user_config={"topic": "fitness"},
            template_prompt="Create {{topic}} landing page",
        )
        composed = builder.build(context)

        assert composed.system_prompt
        assert composed.user_prompt
        assert "fitness" in composed.user_prompt
        assert len(composed.layers_used) == 3

    def test_build_without_template(self):
        """Build with category only, no template_prompt."""
        from api.src.ai.core.prompt_builder import PromptBuilder
        from api.src.ai.models.prompt import PromptContext

        builder = PromptBuilder()
        context = PromptContext(
            category="website",
            user_prompt="Build a portfolio site",
        )
        composed = builder.build(context)

        assert composed.system_prompt
        assert "Build a portfolio site" in composed.user_prompt
        assert len(composed.layers_used) == 2  # base + category

    def test_build_with_user_prompt(self):
        """user_prompt appended to composed user prompt."""
        from api.src.ai.core.prompt_builder import PromptBuilder
        from api.src.ai.models.prompt import PromptContext

        builder = PromptBuilder()
        context = PromptContext(
            category="website",
            user_config={"topic": "coffee"},
            user_prompt="Make it dark theme",
            template_prompt="Create {{topic}} site",
        )
        composed = builder.build(context)

        assert "coffee" in composed.user_prompt
        assert "Make it dark theme" in composed.user_prompt

    def test_variable_substitution(self):
        """{{topic}} in template_prompt replaced with user_config value."""
        from api.src.ai.core.prompt_builder import PromptBuilder
        from api.src.ai.models.prompt import PromptContext

        builder = PromptBuilder()
        context = PromptContext(
            category="website",
            user_config={"topic": "restaurant", "city": "Moscow"},
            template_prompt="Create {{topic}} landing page for {{city}}",
        )
        composed = builder.build(context)

        assert "restaurant" in composed.user_prompt
        assert "Moscow" in composed.user_prompt
        assert "{{topic}}" not in composed.user_prompt
        assert "{{city}}" not in composed.user_prompt

    def test_system_prompt_contains_layers(self):
        """System prompt contains base + category content."""
        from api.src.ai.core.prompt_builder import PromptBuilder
        from api.src.ai.models.prompt import PromptContext
        from api.src.ai.prompts.base import BASE_PROMPT
        from api.src.ai.prompts.categories import CATEGORY_PROMPTS

        builder = PromptBuilder()
        context = PromptContext(category="website")
        composed = builder.build(context)

        assert BASE_PROMPT in composed.system_prompt
        assert CATEGORY_PROMPTS["website"] in composed.system_prompt

    def test_metadata_populated(self):
        """metadata has system_prompt_chars, user_prompt_chars, layers_count."""
        from api.src.ai.core.prompt_builder import PromptBuilder
        from api.src.ai.models.prompt import PromptContext

        builder = PromptBuilder()
        context = PromptContext(
            category="website",
            user_prompt="Test prompt",
        )
        composed = builder.build(context)

        assert "system_prompt_chars" in composed.metadata
        assert "user_prompt_chars" in composed.metadata
        assert "layers_count" in composed.metadata
        assert composed.metadata["system_prompt_chars"] == len(composed.system_prompt)
        assert composed.metadata["user_prompt_chars"] == len(composed.user_prompt)
        assert composed.metadata["layers_count"] == 2


class TestOutputValidator:
    """Test generated code validation."""

    def test_valid_html_passes(self):
        """Complete HTML with DOCTYPE and viewport passes."""
        from api.src.ai.core.validators import OutputValidator

        validator = OutputValidator()
        files = {
            "index.html": (
                '<!DOCTYPE html>\n<html lang="ru">\n<head>\n'
                '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n'
                "<title>Test</title>\n</head>\n<body><p>Hello</p></body>\n</html>"
            )
        }
        result = validator.validate(files)
        assert result.passed is True
        assert len(result.errors) == 0

    def test_missing_doctype_warning(self):
        """HTML without DOCTYPE generates warning."""
        from api.src.ai.core.validators import OutputValidator

        validator = OutputValidator()
        files = {
            "index.html": (
                '<html lang="ru">\n<head>\n'
                '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n'
                "</head>\n<body>Hello</body>\n</html>"
            )
        }
        result = validator.validate(files)
        assert result.passed is True  # warnings don't fail validation
        codes = [w.code for w in result.warnings]
        assert "MISSING_DOCTYPE" in codes

    def test_missing_viewport_warning(self):
        """HTML without viewport generates warning."""
        from api.src.ai.core.validators import OutputValidator

        validator = OutputValidator()
        files = {
            "index.html": (
                "<!DOCTYPE html>\n<html>\n<head><title>Test</title></head>\n"
                "<body>Hello</body>\n</html>"
            )
        }
        result = validator.validate(files)
        assert result.passed is True
        codes = [w.code for w in result.warnings]
        assert "MISSING_VIEWPORT" in codes

    def test_placeholder_detection(self):
        """{{title}}, [Your Company], example.com, Lorem ipsum detected."""
        from api.src.ai.core.validators import OutputValidator

        validator = OutputValidator()
        files = {
            "index.html": (
                '<!DOCTYPE html>\n<html>\n<head>\n'
                '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n'
                "</head>\n<body>\n"
                "<h1>{{title}}</h1>\n"
                "<p>[Your Company]</p>\n"
                "<a href='http://example.com'>Link</a>\n"
                "<p>Lorem ipsum dolor sit amet</p>\n"
                "</body>\n</html>"
            )
        }
        result = validator.validate(files)
        codes = [w.code for w in result.warnings]
        assert "PLACEHOLDER_TEMPLATE" in codes
        assert "PLACEHOLDER_YOUR" in codes
        assert "PLACEHOLDER_DOMAIN" in codes
        assert "PLACEHOLDER_LOREM" in codes

    def test_python_syntax_error(self):
        """Invalid Python syntax generates error."""
        from api.src.ai.core.validators import OutputValidator

        validator = OutputValidator()
        files = {
            "main.py": "def broken(\n    pass"
        }
        result = validator.validate(files)
        assert result.passed is False
        assert len(result.errors) == 1
        assert result.errors[0].code == "PYTHON_SYNTAX_ERROR"
        assert result.errors[0].file_path == "main.py"

    def test_valid_python_passes(self):
        """Valid Python code passes."""
        from api.src.ai.core.validators import OutputValidator

        validator = OutputValidator()
        files = {
            "main.py": (
                "import os\n\n"
                "def main():\n"
                "    print('Hello, world!')\n\n"
                "if __name__ == '__main__':\n"
                "    main()\n"
            )
        }
        result = validator.validate(files)
        assert result.passed is True
        assert len(result.errors) == 0

    def test_empty_file_error(self):
        """Empty content generates error."""
        from api.src.ai.core.validators import OutputValidator

        validator = OutputValidator()
        files = {"empty.html": "   \n  "}
        result = validator.validate(files)
        assert result.passed is False
        assert len(result.errors) == 1
        assert result.errors[0].code == "EMPTY_FILE"

    def test_external_css_warning(self):
        """<link rel="stylesheet" href="styles.css"> generates warning."""
        from api.src.ai.core.validators import OutputValidator

        validator = OutputValidator()
        files = {
            "index.html": (
                '<!DOCTYPE html>\n<html>\n<head>\n'
                '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n'
                '<link rel="stylesheet" href="styles.css">\n'
                "</head>\n<body>Hello</body>\n</html>"
            )
        }
        result = validator.validate(files)
        codes = [w.code for w in result.warnings]
        assert "EXTERNAL_CSS" in codes

    def test_google_fonts_allowed(self):
        """<link href="https://fonts.googleapis.com/..."> NOT flagged."""
        from api.src.ai.core.validators import OutputValidator

        validator = OutputValidator()
        files = {
            "index.html": (
                '<!DOCTYPE html>\n<html>\n<head>\n'
                '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n'
                '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter">\n'
                "</head>\n<body>Hello</body>\n</html>"
            )
        }
        result = validator.validate(files)
        codes = [w.code for w in result.warnings]
        assert "EXTERNAL_CSS" not in codes

    def test_auto_fix_doctype(self):
        """validate_and_fix adds DOCTYPE."""
        from api.src.ai.core.validators import OutputValidator

        validator = OutputValidator()
        files = {
            "index.html": (
                '<html lang="ru">\n<head>\n'
                '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n'
                "</head>\n<body>Hello</body>\n</html>"
            )
        }
        fixed_files, result = validator.validate_and_fix(files)
        assert "<!DOCTYPE html>" in fixed_files["index.html"]

    def test_auto_fix_viewport(self):
        """validate_and_fix adds viewport meta."""
        from api.src.ai.core.validators import OutputValidator

        validator = OutputValidator()
        files = {
            "index.html": (
                "<!DOCTYPE html>\n<html>\n<head>\n"
                "<title>Test</title>\n</head>\n<body>Hello</body>\n</html>"
            )
        }
        fixed_files, result = validator.validate_and_fix(files)
        assert '<meta name="viewport"' in fixed_files["index.html"]

    def test_auto_fix_count(self):
        """auto_fixed_count reflects number of fixes applied."""
        from api.src.ai.core.validators import OutputValidator

        validator = OutputValidator()
        files = {
            "index.html": (
                "<html>\n<head>\n"
                "<title>Test</title>\n</head>\n<body>Hello</body>\n</html>"
            )
        }
        _, result = validator.validate_and_fix(files)
        # Both DOCTYPE and viewport should be fixed
        assert result.auto_fixed_count == 2


class TestTemplateEngine:
    """Test the v2 orchestrator."""

    def test_build_prompts_basic(self):
        """build_prompts returns (system_prompt, user_prompt) tuple."""
        from api.src.ai.core.template_engine import TemplateEngine

        class FakeTemplate:
            slug = "landing-page"
            category = "website"
            prompt_template = "Create a landing page"

        engine = TemplateEngine()
        system_prompt, user_prompt = engine.build_prompts(FakeTemplate(), config={})
        assert isinstance(system_prompt, str)
        assert isinstance(user_prompt, str)
        assert len(system_prompt) > 0

    def test_build_prompts_with_user_prompt(self):
        """user_prompt included in result."""
        from api.src.ai.core.template_engine import TemplateEngine

        class FakeTemplate:
            slug = "landing-page"
            category = "website"
            prompt_template = "Create {{topic}} landing page"

        engine = TemplateEngine()
        system_prompt, user_prompt = engine.build_prompts(
            FakeTemplate(),
            config={"topic": "fitness"},
            user_prompt="Use dark colors",
        )
        assert "fitness" in user_prompt
        assert "Use dark colors" in user_prompt

    def test_process_output_success(self):
        """Valid code blocks produce successful GenerationResult."""
        from api.src.ai.core.template_engine import TemplateEngine

        engine = TemplateEngine()
        raw_response = (
            "Here is the code:\n\n"
            "```html\n"
            "# filename: index.html\n"
            '<!DOCTYPE html>\n<html lang="ru">\n<head>\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n'
            "<title>Test</title>\n</head>\n<body><p>Hello</p></body>\n</html>\n"
            "```\n"
        )
        result = engine.process_output(raw_response)
        assert result.success is True
        assert result.files_count == 1
        assert "index.html" in result.files

    def test_process_output_no_files(self):
        """No code blocks produce failed GenerationResult."""
        from api.src.ai.core.template_engine import TemplateEngine

        engine = TemplateEngine()
        raw_response = "I could not generate the code. Please try again."
        result = engine.process_output(raw_response)
        assert result.success is False
        assert result.files_count == 0
        assert result.validation_passed is False
        assert len(result.validation_errors) > 0

    def test_process_output_with_validation(self):
        """Files are validated and auto-fixed."""
        from api.src.ai.core.template_engine import TemplateEngine

        engine = TemplateEngine()
        # HTML missing DOCTYPE and viewport — should be auto-fixed
        raw_response = (
            "```html\n"
            "# filename: index.html\n"
            "<html>\n<head>\n<title>Test</title>\n</head>\n"
            "<body><p>Hello</p></body>\n</html>\n"
            "```\n"
        )
        result = engine.process_output(raw_response)
        assert result.success is True
        # The auto-fix should have added DOCTYPE and viewport
        assert "<!DOCTYPE html>" in result.files["index.html"]
        assert '<meta name="viewport"' in result.files["index.html"]


class TestComponentRegistry:
    """Test HTML component loading."""

    def test_list_components(self):
        """Returns 4 components."""
        from api.src.ai.components.registry import list_components

        components = list_components()
        assert len(components) == 4

    def test_load_existing_component(self):
        """get_component returns HTML content."""
        from api.src.ai.components.registry import get_component

        content = get_component("web", "hero", "hero_gradient")
        assert content is not None
        assert isinstance(content, str)
        assert len(content) > 0

    def test_load_missing_component(self):
        """get_component returns None for nonexistent."""
        from api.src.ai.components.registry import get_component

        content = get_component("web", "hero", "nonexistent_component")
        assert content is None

    def test_component_content(self):
        """Loaded component contains expected HTML."""
        from api.src.ai.components.registry import get_component

        content = get_component("web", "hero", "hero_gradient")
        assert content is not None
        assert "<section" in content
        assert "hero" in content


class TestBackwardCompatibility:
    """Test v1 backward compatibility."""

    def test_system_prompt_available(self):
        """SYSTEM_PROMPT importable from api.src.ai.prompts."""
        from api.src.ai.prompts import SYSTEM_PROMPT

        assert isinstance(SYSTEM_PROMPT, str)
        assert len(SYSTEM_PROMPT) > 0
        assert "Viably" in SYSTEM_PROMPT

    def test_build_generation_prompt_available(self):
        """build_generation_prompt works as before."""
        from api.src.ai.prompts import build_generation_prompt

        result = build_generation_prompt(
            "Create bot for {{topic}}",
            {"topic": "weather"},
        )
        assert result == "Create bot for weather"

    def test_extract_code_files_available(self):
        """extract_code_files works as before."""
        from api.src.ai.prompts import extract_code_files

        response = (
            "```python\n"
            "# filename: main.py\n"
            "print('hello')\n"
            "```"
        )
        files = extract_code_files(response)
        assert "main.py" in files
        assert files["main.py"] == "print('hello')"

    def test_feature_flag_default_off(self):
        """The flag exists and defaults to False."""
        import importlib.util
        import sys

        # Load settings.config module directly from file path to avoid
        # settings/__init__.py which pulls in structlog and other heavy deps.
        spec = importlib.util.spec_from_file_location(
            "settings.config",
            "/home/alex/PycharmProjects/viably/backend/settings/config.py",
            submodule_search_locations=[],
        )
        # Temporarily register a stub 'settings' package so the submodule loads
        stub_registered = False
        if "settings" not in sys.modules:
            import types

            sys.modules["settings"] = types.ModuleType("settings")
            stub_registered = True

        try:
            config_module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(config_module)
            Settings = config_module.Settings
            assert Settings.model_fields["USE_GENERATION_V2"].default is True
        finally:
            if stub_registered:
                del sys.modules["settings"]
