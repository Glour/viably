"""Request complexity classifier for smart routing and prompt tiering."""

import re
from enum import Enum


class RequestComplexity(str, Enum):
    """Complexity level determines prompt tier and model routing."""

    SIMPLE = "simple"      # Questions, explanations → Haiku + BASE_PROMPT only
    STANDARD = "standard"  # Moderate requests → Sonnet + BASE_PROMPT + category
    FULL = "full"          # Code generation → Sonnet + full prompt stack


# Patterns that indicate code generation (FULL complexity)
_CODE_TRIGGERS_RU = re.compile(
    r"(созда[йть]|сгенерируй|сделай|добав[ьи]|измени|удали|передела[йть]|перепиши|"
    r"реализуй|напиши код|напиши бот|напиши функци|обнови|исправ[ьи]|"
    r"подключи|настрой|интегрируй|разработай|построй|сверстай|"
    r"добав\w* функци|добав\w* кнопк|добав\w* страниц|добав\w* компонент|"
    r"замени|поменяй|внедри|допиши|доработай|переверстай|сделать|"
    r"добав\w* обработ|добав\w* валидац|добав\w* авториз|"
    r"написать|изменить|удалить|обновить|исправить|подключить|настроить|"
    r"интегрировать|реализовать|сгенерировать|переписать|заменить|"
    r"генерируй|разверни|разверн)",
    re.IGNORECASE,
)

_CODE_TRIGGERS_EN = re.compile(
    r"(create|generate|build|add|modify|change|remove|delete|update|"
    r"implement|write code|write a bot|fix|connect|integrate|deploy|"
    r"refactor|rewrite|replace|set up|configure)",
    re.IGNORECASE,
)

# Patterns that indicate a simple question (SIMPLE complexity)
_QUESTION_STARTERS_RU = re.compile(
    r"^(что |как |почему |зачем |когда |где |кто |какой |какая |какие |"
    r"объясни|расскажи|покажи|опиши|в чём разница|чем отличается|"
    r"можно ли|можешь ли|подскажи)",
    re.IGNORECASE,
)

_QUESTION_STARTERS_EN = re.compile(
    r"^(what |how |why |when |where |who |which |explain|describe|"
    r"tell me|show me|can you|is it|does it|will it)",
    re.IGNORECASE,
)


def classify_request(
    user_message: str,
    has_artifacts: bool = False,
    conversation_length: int = 0,
) -> RequestComplexity:
    """Classify request complexity using keyword heuristics.

    Args:
        user_message: The user's message text.
        has_artifacts: Whether conversation already has code artifacts.
        conversation_length: Number of messages in conversation so far.

    Returns:
        RequestComplexity enum value.
    """
    msg = user_message.strip()
    msg_len = len(msg)

    # Empty or very short messages
    if msg_len < 5:
        return RequestComplexity.SIMPLE

    # Check for explicit code generation triggers → FULL
    if _CODE_TRIGGERS_RU.search(msg) or _CODE_TRIGGERS_EN.search(msg):
        return RequestComplexity.FULL

    # If conversation has artifacts and message is long, likely a modification request
    if has_artifacts and msg_len > 200:
        return RequestComplexity.FULL

    # Short questions without code triggers → SIMPLE
    is_question = (
        _QUESTION_STARTERS_RU.search(msg)
        or _QUESTION_STARTERS_EN.search(msg)
        or msg.rstrip().endswith("?")
    )

    if is_question and msg_len < 300 and not has_artifacts:
        return RequestComplexity.SIMPLE

    # Short messages that are questions even with artifacts → SIMPLE
    if is_question and msg_len < 150:
        return RequestComplexity.SIMPLE

    # Default: STANDARD for everything else
    return RequestComplexity.STANDARD
