"""Tests for dynamic credit pricing formula."""

import pytest

from api.src.credits.service import calculate_dynamic_cost


class TestCalculateDynamicCost:
    """Tests for calculate_dynamic_cost() function."""

    def test_simple_question(self) -> None:
        """Simple question: 15K input + 500 output = 2 credits."""
        cost = calculate_dynamic_cost(input_tokens=15_000, output_tokens=500)
        # (15000 + 500*3) / 10000 = 16500/10000 = ceil(1.65) = 2
        assert cost == 2

    def test_medium_generation(self) -> None:
        """Medium generation: 35K input + 8K output = 6 credits."""
        cost = calculate_dynamic_cost(input_tokens=35_000, output_tokens=8_000)
        # (35000 + 8000*3) / 10000 = 59000/10000 = ceil(5.9) = 6
        assert cost == 6

    def test_heavy_agent_cycle(self) -> None:
        """Agent cycle: 200K input + 80K output = 44 credits."""
        cost = calculate_dynamic_cost(input_tokens=200_000, output_tokens=80_000)
        # (200000 + 80000*3) / 10000 = 440000/10000 = ceil(44.0) = 44
        assert cost == 44

    def test_minimum_cost(self) -> None:
        """Very small usage should still cost MIN_CREDIT_COST (1)."""
        cost = calculate_dynamic_cost(input_tokens=100, output_tokens=50)
        # (100 + 50*3) / 10000 = 250/10000 = ceil(0.025) = 1, max(1, 1) = 1
        assert cost == 1

    def test_zero_tokens(self) -> None:
        """Zero tokens → minimum cost."""
        cost = calculate_dynamic_cost(input_tokens=0, output_tokens=0)
        assert cost == 1

    def test_maximum_cap(self) -> None:
        """Extremely large usage should be capped at MAX_CREDIT_COST (100)."""
        cost = calculate_dynamic_cost(input_tokens=1_000_000, output_tokens=500_000)
        # (1000000 + 500000*3) / 10000 = 2500000/10000 = 250 → capped at 100
        assert cost == 100

    def test_output_weighted_more(self) -> None:
        """Output tokens should be weighted 3x more than input."""
        cost_input_heavy = calculate_dynamic_cost(input_tokens=30_000, output_tokens=0)
        cost_output_heavy = calculate_dynamic_cost(input_tokens=0, output_tokens=10_000)
        # Input: 30000/10000 = 3
        # Output: 30000/10000 = 3
        assert cost_input_heavy == cost_output_heavy

    def test_haiku_small_response(self) -> None:
        """Haiku small response: 5K input + 200 output = 1 credit."""
        cost = calculate_dynamic_cost(input_tokens=5_000, output_tokens=200)
        # (5000 + 200*3) / 10000 = 5600/10000 = ceil(0.56) = 1
        assert cost == 1

    def test_exact_boundary(self) -> None:
        """Exact 10K weighted total → 1 credit."""
        cost = calculate_dynamic_cost(input_tokens=10_000, output_tokens=0)
        # 10000 / 10000 = ceil(1.0) = 1
        assert cost == 1

    def test_just_over_boundary(self) -> None:
        """10001 weighted total → 2 credits."""
        cost = calculate_dynamic_cost(input_tokens=10_001, output_tokens=0)
        # 10001 / 10000 = ceil(1.0001) = 2
        assert cost == 2
