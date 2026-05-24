"""Tests for deploy limits by plan."""

import pytest

from settings.constants import DEPLOY_LIMITS, get_deploy_limit


class TestDeployLimits:
    """Tests for deploy limits configuration and helper."""

    def test_free_plan_zero_deploys(self) -> None:
        assert get_deploy_limit("free") == 0

    def test_starter_plan_two_deploys(self) -> None:
        assert get_deploy_limit("starter") == 2

    def test_pro_plan_five_deploys(self) -> None:
        assert get_deploy_limit("pro") == 5

    def test_business_plan_fifteen_deploys(self) -> None:
        assert get_deploy_limit("business") == 15

    def test_enterprise_plan_unlimited(self) -> None:
        assert get_deploy_limit("enterprise") is None

    def test_unknown_plan_returns_zero(self) -> None:
        assert get_deploy_limit("unknown_plan") == 0

    def test_all_plans_present(self) -> None:
        """All expected plans should be in DEPLOY_LIMITS."""
        expected_plans = {"free", "starter", "pro", "business", "enterprise"}
        assert set(DEPLOY_LIMITS.keys()) == expected_plans

    def test_limits_are_ordered(self) -> None:
        """Higher tier plans should have higher or equal limits."""
        tiers = ["free", "starter", "pro", "business"]
        limits = [DEPLOY_LIMITS[t] for t in tiers]
        for i in range(len(limits) - 1):
            assert limits[i] is not None
            assert limits[i + 1] is not None
            assert limits[i] <= limits[i + 1]  # type: ignore[operator]
