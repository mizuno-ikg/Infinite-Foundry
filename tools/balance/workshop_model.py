"""Infinite Foundry M4 balance sandbox.

This is not game runtime code. It is a deterministic design model used to test
Workshop-era timing, prestige uplift, and speed invariance before M5/M6.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Iterable

STAGES = ("source", "process", "transfer", "assembly")
BASE_CAPACITY = {
    "source": 1.20,
    "process": 1.00,
    "transfer": 0.90,
    "assembly": 0.80,
}
BASE_COST = {
    "source": 8.0,
    "process": 9.0,
    "transfer": 10.0,
    "assembly": 11.0,
}
COST_GROWTH = 1.18
CAPACITY_GROWTH = 1.11
STARTING_CREDITS = 20.0
FINAL_TARGET = 35.0
CHECKPOINTS = (75.0, 150.0, 225.0, 300.0)


@dataclass
class RunResult:
    checkpoint_throughput: Dict[float, float]
    final_throughput: float
    levels: Dict[str, int]
    credits: float


def upgrade_cost(stage: str, level: int) -> float:
    return BASE_COST[stage] * (COST_GROWTH ** level)


def stage_capacity(stage: str, level: int, permanent_multiplier: float = 1.0) -> float:
    growth_sum = sum(CAPACITY_GROWTH ** i for i in range(level))
    return BASE_CAPACITY[stage] * (1.0 + growth_sum) * permanent_multiplier


def effective_throughput(levels: Dict[str, int], permanent_multiplier: float = 1.0) -> float:
    return min(stage_capacity(stage, levels[stage], permanent_multiplier) for stage in STAGES)


def marginal_value(stage: str, levels: Dict[str, int], permanent_multiplier: float) -> float:
    before = effective_throughput(levels, permanent_multiplier)
    after_levels = dict(levels)
    after_levels[stage] += 1
    after = effective_throughput(after_levels, permanent_multiplier)
    return (after - before) / upgrade_cost(stage, levels[stage])


def simulate(
    *,
    real_seconds: float = 300.0,
    speed: float = 1.0,
    permanent_multiplier: float = 1.0,
    active_income_multiplier: float = 1.0,
    real_dt: float = 0.05,
) -> RunResult:
    """Run a greedy bottleneck-aware player model.

    `speed` changes game-seconds per real-second. To compare x1/x2/x4 fairly,
    call with real_seconds scaled so total game-time remains 300 seconds.
    Random module effects are intentionally excluded from this baseline: a bad
    roll must never be required for solvability.
    """

    levels = {stage: 0 for stage in STAGES}
    credits = STARTING_CREDITS
    game_time = 0.0
    checkpoints: Dict[float, float] = {}
    pending = list(CHECKPOINTS)

    while game_time < 300.0 - 1e-9:
        game_dt = min(real_dt * speed, 300.0 - game_time)
        throughput = effective_throughput(levels, permanent_multiplier)
        credits += throughput * active_income_multiplier * game_dt
        game_time += game_dt

        affordable = [stage for stage in STAGES if upgrade_cost(stage, levels[stage]) <= credits]
        if affordable:
            chosen = max(
                affordable,
                key=lambda stage: (
                    marginal_value(stage, levels, permanent_multiplier),
                    -upgrade_cost(stage, levels[stage]),
                ),
            )
            credits -= upgrade_cost(chosen, levels[chosen])
            levels[chosen] += 1

        while pending and game_time + 1e-9 >= pending[0]:
            point = pending.pop(0)
            checkpoints[point] = effective_throughput(levels, permanent_multiplier)

    return RunResult(
        checkpoint_throughput=checkpoints,
        final_throughput=effective_throughput(levels, permanent_multiplier),
        levels=levels,
        credits=credits,
    )


def print_reference_cases() -> None:
    cases: Iterable[tuple[str, float, float]] = (
        ("baseline passive", 1.00, 1.00),
        ("active ~8% avg", 1.00, 1.08),
        ("active ~12% avg", 1.00, 1.12),
        ("post-prestige +5%", 1.05, 1.00),
        ("post-prestige +8%", 1.08, 1.00),
    )
    for label, permanent, active in cases:
        result = simulate(permanent_multiplier=permanent, active_income_multiplier=active)
        print(label, result.checkpoint_throughput, result.final_throughput)

    print("speed invariance")
    for speed in (1.0, 2.0, 4.0):
        result = simulate(real_seconds=300.0 / speed, speed=speed)
        print(speed, result.final_throughput, result.levels)


if __name__ == "__main__":
    print_reference_cases()
