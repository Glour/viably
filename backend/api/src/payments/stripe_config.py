"""Stripe pricing configuration for Viably."""

from typing import Dict, List
from pydantic import BaseModel


class StripePriceConfig(BaseModel):
    """Configuration for a single Stripe price."""
    
    plan_id: str
    currency: str
    amount: int  # in cents (USD)
    stripe_price_id: str
    interval: str = "month"  # "month" | "year"
    early_bird: bool = False


# Stripe price matrix (all prices in USD cents)
STRIPE_PRICES: Dict[str, List[StripePriceConfig]] = {
    # Starter tier
    "starter": [
        # Early Bird
        StripePriceConfig(
            plan_id="starter",
            currency="usd",
            amount=1200,  # $12.00/month
            stripe_price_id="price_1T7WJlJu7HyIEuVbYD7sqkA3",
            interval="month",
            early_bird=True,
        ),
        StripePriceConfig(
            plan_id="starter",
            currency="usd",
            amount=14400,  # $144.00/year
            stripe_price_id="price_1T7WJmJu7HyIEuVbbdN6lFy9",
            interval="year",
            early_bird=True,
        ),
        # Standard
        StripePriceConfig(
            plan_id="starter",
            currency="usd",
            amount=1500,  # $15.00/month
            stripe_price_id="price_1T7WJmJu7HyIEuVbiEqTgZWN",
            interval="month",
            early_bird=False,
        ),
        StripePriceConfig(
            plan_id="starter",
            currency="usd",
            amount=14400,  # $144.00/year
            stripe_price_id="price_1T7WJmJu7HyIEuVbS0Rwxn8p",
            interval="year",
            early_bird=False,
        ),
    ],
    
    # Pro tier
    "pro": [
        # Early Bird
        StripePriceConfig(
            plan_id="pro",
            currency="usd",
            amount=2900,  # $29.00/month
            stripe_price_id="price_1T7WJnJu7HyIEuVbTKHddwwu",
            interval="month",
            early_bird=True,
        ),
        StripePriceConfig(
            plan_id="pro",
            currency="usd",
            amount=34800,  # $348.00/year
            stripe_price_id="price_1T7WJnJu7HyIEuVbnM7OrxZY",
            interval="year",
            early_bird=True,
        ),
        # Standard
        StripePriceConfig(
            plan_id="pro",
            currency="usd",
            amount=3900,  # $39.00/month
            stripe_price_id="price_1T7WJnJu7HyIEuVbHh12NgnG",
            interval="month",
            early_bird=False,
        ),
        StripePriceConfig(
            plan_id="pro",
            currency="usd",
            amount=39600,  # $396.00/year
            stripe_price_id="price_1T7WJoJu7HyIEuVbWFQlXJin",
            interval="year",
            early_bird=False,
        ),
    ],
    
    # Business tier
    "business": [
        # Early Bird
        StripePriceConfig(
            plan_id="business",
            currency="usd",
            amount=9900,   # $99.00/month
            stripe_price_id="price_1T7WJoJu7HyIEuVblePqS4j3",
            interval="month",
            early_bird=True,
        ),
        StripePriceConfig(
            plan_id="business",
            currency="usd",
            amount=118800,  # $1,188.00/year
            stripe_price_id="price_1T7WJpJu7HyIEuVb9FiDJ03l",
            interval="year",
            early_bird=True,
        ),
        # Standard
        StripePriceConfig(
            plan_id="business",
            currency="usd",
            amount=14900,   # $149.00/month
            stripe_price_id="price_1T7WJpJu7HyIEuVbHinyAkvQ",
            interval="month",
            early_bird=False,
        ),
        StripePriceConfig(
            plan_id="business",
            currency="usd",
            amount=144000,  # $1,440.00/year
            stripe_price_id="price_1T7WJpJu7HyIEuVbXjaDF2Y2",
            interval="year",
            early_bird=False,
        ),
    ],
}


def get_stripe_price_config(
    plan_id: str,
    currency: str = "usd",
    interval: str = "month",
    early_bird: bool = False,
) -> StripePriceConfig | None:
    """Get Stripe price configuration for a given plan, currency, and interval."""
    plan_prices = STRIPE_PRICES.get(plan_id)
    if not plan_prices:
        return None
    
    for price_config in plan_prices:
        if (
            price_config.currency == currency.lower()
            and price_config.interval == interval
            and price_config.early_bird == early_bird
        ):
            return price_config
    
    return None


def get_price_id(plan_id: str, interval: str = "month", early_bird: bool = False) -> str | None:
    """Get Stripe Price ID for a plan."""
    config = get_stripe_price_config(plan_id, "usd", interval, early_bird)
    return config.stripe_price_id if config else None


# Supported currencies (currently USD only, can expand later)
SUPPORTED_CURRENCIES = ["usd"]

# Plan tiers
PLAN_TIERS = ["free", "starter", "pro", "business", "enterprise"]

# Credits per month for each tier
TIER_CREDITS = {
    "free": 5,
    "starter": 100,
    "pro": 300,
    "business": 1000,
    "enterprise": None,  # unlimited
}

# Free tier limits
FREE_TIER_LIMITS = {
    "projects": None,  # unlimited projects for all plans
    "credits_on_signup": 5,
    "credits_per_month": 5,
}

# Early bird limits (first 100 users per tier)
EARLY_BIRD_LIMIT = 100

