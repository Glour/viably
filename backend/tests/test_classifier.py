"""Tests for request complexity classifier."""

import pytest

from api.src.ai.classifier import RequestComplexity, classify_request


class TestClassifyRequest:
    """Tests for classify_request() function."""

    # === SIMPLE cases ===

    def test_short_question_russian(self) -> None:
        result = classify_request("Что такое Python?")
        assert result == RequestComplexity.SIMPLE

    def test_short_question_english(self) -> None:
        result = classify_request("What is FastAPI?")
        assert result == RequestComplexity.SIMPLE

    def test_question_mark_at_end(self) -> None:
        result = classify_request("Можно ли использовать Redis?")
        assert result == RequestComplexity.SIMPLE

    def test_explain_command(self) -> None:
        result = classify_request("Объясни как работает этот код")
        assert result == RequestComplexity.SIMPLE

    def test_very_short_message(self) -> None:
        result = classify_request("да")
        assert result == RequestComplexity.SIMPLE

    def test_how_question(self) -> None:
        result = classify_request("Как работает websocket?")
        assert result == RequestComplexity.SIMPLE

    def test_why_question(self) -> None:
        result = classify_request("Почему используется async?")
        assert result == RequestComplexity.SIMPLE

    # === FULL cases ===

    def test_create_command_russian(self) -> None:
        result = classify_request("Создай бота для заказов")
        assert result == RequestComplexity.FULL

    def test_add_command_russian(self) -> None:
        result = classify_request("Добавь кнопку оплаты")
        assert result == RequestComplexity.FULL

    def test_change_command_russian(self) -> None:
        result = classify_request("Измени дизайн главной страницы")
        assert result == RequestComplexity.FULL

    def test_generate_command_russian(self) -> None:
        result = classify_request("Сгенерируй форму регистрации")
        assert result == RequestComplexity.FULL

    def test_fix_command_russian(self) -> None:
        result = classify_request("Исправь ошибку в обработчике")
        assert result == RequestComplexity.FULL

    def test_create_command_english(self) -> None:
        result = classify_request("Create a payment bot")
        assert result == RequestComplexity.FULL

    def test_implement_command_english(self) -> None:
        result = classify_request("Implement user authentication")
        assert result == RequestComplexity.FULL

    def test_long_message_with_artifacts(self) -> None:
        """Long message + existing artifacts → FULL."""
        long_msg = "Нужно полностью переработать структуру проекта " * 15
        result = classify_request(long_msg, has_artifacts=True)
        assert result == RequestComplexity.FULL

    # === STANDARD cases ===

    def test_medium_request_no_triggers(self) -> None:
        """Message without clear triggers → STANDARD."""
        result = classify_request(
            "Мне нужно что-то похожее на дашборд с графиками и таблицами"
        )
        assert result == RequestComplexity.STANDARD

    def test_long_question_with_artifacts(self) -> None:
        """Long question with artifacts but < 200 chars → SIMPLE."""
        result = classify_request(
            "Что делает эта функция и как она работает?",
            has_artifacts=True,
        )
        assert result == RequestComplexity.SIMPLE

    # === Edge cases ===

    def test_empty_message(self) -> None:
        result = classify_request("")
        assert result == RequestComplexity.SIMPLE

    def test_whitespace_only(self) -> None:
        result = classify_request("   ")
        assert result == RequestComplexity.SIMPLE

    def test_question_with_code_trigger_prioritizes_full(self) -> None:
        """Code triggers override question patterns."""
        result = classify_request("Можешь создать бота для магазина?")
        assert result == RequestComplexity.FULL

    def test_rewrite_command(self) -> None:
        result = classify_request("Перепиши этот компонент на TypeScript")
        assert result == RequestComplexity.FULL

    def test_connect_command(self) -> None:
        result = classify_request("Подключи базу данных PostgreSQL")
        assert result == RequestComplexity.FULL
