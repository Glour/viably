"""Category-specific prompt modules."""

from api.src.ai.prompts.categories.web import WEB_CATEGORY_PROMPT
from api.src.ai.prompts.categories.telegram import TELEGRAM_CATEGORY_PROMPT
from api.src.ai.prompts.categories.api import API_CATEGORY_PROMPT
from api.src.ai.prompts.categories.webapp import WEBAPP_CATEGORY_PROMPT

CATEGORY_PROMPTS: dict[str, str] = {
    "website": WEB_CATEGORY_PROMPT,
    "telegram_bot": TELEGRAM_CATEGORY_PROMPT,
    "api_service": API_CATEGORY_PROMPT,
    "webapp": WEBAPP_CATEGORY_PROMPT,
}
