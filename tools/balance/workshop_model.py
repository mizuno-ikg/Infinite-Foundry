"""Infinite Foundry M4 Workshop balance sandbox.

Design-only model, not runtime game code.

Goals:
- first Directive cycle is 300 game-seconds;
- ordinary first-run play usually fails narrowly;
- skilled first-run play can clear without relying on random modules;
- a useful first prestige makes the second attempt very likely to clear;
- random module variance changes the story of a run, not long-term solvability;
- all economics are expressed in game-time so x1/x2/x4 remain equivalent.

Run with Python 3.11+; no third-party packages are required.
"""

from __future__ import annotations

from dataclasses import dataclass
from itertools import count
from math import exp
from random import Random
from statistics import mean, median
from typing import Dict, Iterable, List, Tuple

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

# POWER is a support constraint. It should become visible and occasionally bind,
# but not dominate Workshop learning.
POWER_BASE_CAPACITY = 6.0
POWER_BASE_COST = 10.0
POWER_COST_GROWTH = 1.20
POWER_CAPACITY_GROWTH = 1.18

STARTING_CREDITS = 20.0
FINAL_TARGET = 52.0
FINAL_GAME_TIME = 300.0
EVALUATION_WINDOW = 30.0
CHECKPOINTS = (75.0, 150.0, 225.0, 300.0)
CHECKPOINT_TARGETS = (4.0, 14.0, 30.0, 52.0)

OVERCLOCK_COOLDOWN = 12.0
OVERCLOCK_DURATION = 4.0
OVERCLOCK_BOOST = 0.30

MODULE_MEAN_INTERVAL = 42.0
MODULE_PITY = 80.0
MODULE_SLOTS = 2


@dataclass
class RunResult:
    sustained_throughput: float
    final_instant_throughput: float
    levels: Dict[str, int]
    power_level: int
    credits: float
    module_count: int
    elapsed_game_time: float


def geometric_sum(growth: float, levels: int) -> float:
    if levels <= 0:
        return 0.0
    return (growth**levels - 1.0) / (growth - 1.0)


def upgrade_cost(stage: str, level: int) -> float:
    return BASE_COST[stage] * COST_GROWTH**level


def power_upgrade_cost(level: int) -> float:
    return POWER_BASE_COST * POWER_COST_GROWTH**level


def stage_capacity(
    stage: str,
    level: int,
    permanent_multiplier: float = 1.0,
    module_multiplier: float = 1.0,
) -> float:
    return (
        BASE_CAPACITY[stage]
        * (1.0 + geometric_sum(CAPACITY_GROWTH, level))
        * permanent_multiplier
        * module_multiplier
    )


def power_capacity(level: int, permanent_multiplier: float = 1.0) -> float:
    return (
        POWER_BASE_CAPACITY
        * (1.0 + geometric_sum(POWER_CAPACITY_GROWTH, level))
        * permanent_multiplier
    )


def auto_equip_modules(modules: List[Tuple[str, float]]) -> Dict[str, float]:
    """Equip the two largest raw boosts automatically.

    Runtime UI may later offer a smarter player-controlled loadout, but the
    balance floor must not require stopping the factory to make a choice.
    """

    equipped = sorted(modules, key=lambda item: item[1], reverse=True)[:MODULE_SLOTS]
    multipliers = {stage: 1.0 for stage in STAGES}
    for stage, boost in equipped:
        multipliers[stage] *= 1.0 + boost
    return multipliers


def capacities(
    levels: Dict[str, int],
    power_level: int,
    permanent_multiplier: float,
    module_multipliers: Dict[str, float],
    overclock_stage: str | None = None,
) -> Dict[str, float]:
    values = {
        stage: stage_capacity(
            stage,
            levels[stage],
            permanent_multiplier,
            module_multipliers[stage],
        )
        for stage in STAGES
    }
    values["power"] = power_capacity(power_level, permanent_multiplier)
    if overclock_stage in values:
        values[overclock_stage] *= 1.0 + OVERCLOCK_BOOST
    return values


def next_module_drop(rng: Random, now: float) -> float:
    # Exponential game-time hazard with hard pity. Never use render-frame rolls.
    interval = min(rng.expovariate(1.0 / MODULE_MEAN_INTERVAL), MODULE_PITY)
    return now + interval


def roll_module(rng: Random) -> Tuple[str, float]:
    rarity = rng.random()
    if rarity < 0.70:
        boost = rng.uniform(0.04, 0.08)
    elif rarity < 0.94:
        boost = rng.uniform(0.08, 0.15)
    else:
        boost = rng.uniform(0.18, 0.30)
    return rng.choice(STAGES), boost


def simulate(
    seed: int,
    *,
    permanent_multiplier: float = 1.0,
    starting_credits: float = STARTING_CREDITS,
    decision_interval: float = 3.0,
    mistake_probability: float = 0.30,
    overclock_use_probability: float = 0.15,
    modules_enabled: bool = True,
    dt: float = 0.20,
) -> RunResult:
    """Simulate one Workshop cycle.

    `mistake_probability` is intentionally not an AI-skill model. It represents
    a first-time human sometimes buying an affordable non-bottleneck upgrade.
    Otherwise the model saves for the currently weakest stage/support capacity.

    Overclock checks occur on game-time cooldown boundaries. It boosts only the
    current bottleneck, and its value can be clipped by the next bottleneck.
    """

    rng = Random(seed)
    levels = {stage: 0 for stage in STAGES}
    power_level = 0
    credits = starting_credits
    game_time = 0.0

    modules: List[Tuple[str, float]] = []
    module_multipliers = {stage: 1.0 for stage in STAGES}
    next_drop = next_module_drop(rng, 0.0) if modules_enabled else float("inf")

    next_decision = 0.0
    next_overclock = 0.0
    overclock_end = -1.0
    overclock_stage: str | None = None
    evaluation_samples: List[float] = []

    while game_time < FINAL_GAME_TIME - 1e-9:
        if game_time + 1e-9 >= next_drop:
            modules.append(roll_module(rng))
            module_multipliers = auto_equip_modules(modules)
            next_drop = next_module_drop(rng, game_time)

        if game_time + 1e-9 >= next_overclock:
            if rng.random() < overclock_use_probability:
                base_caps = capacities(
                    levels,
                    power_level,
                    permanent_multiplier,
                    module_multipliers,
                )
                overclock_stage = min(base_caps, key=base_caps.get)
                overclock_end = game_time + OVERCLOCK_DURATION
            next_overclock += OVERCLOCK_COOLDOWN

        if game_time >= overclock_end:
            overclock_stage = None

        current_caps = capacities(
            levels,
            power_level,
            permanent_multiplier,
            module_multipliers,
            overclock_stage,
        )
        throughput = min(current_caps.values())
        game_dt = min(dt, FINAL_GAME_TIME - game_time)
        credits += throughput * game_dt
        game_time += game_dt

        if game_time > FINAL_GAME_TIME - EVALUATION_WINDOW:
            evaluation_samples.append(throughput)

        if game_time + 1e-9 >= next_decision:
            next_decision += decision_interval
            base_caps = capacities(
                levels,
                power_level,
                permanent_multiplier,
                module_multipliers,
            )
            desired = min(base_caps, key=base_caps.get)
            actions = list(STAGES) + ["power"]
            affordable = [
                action
                for action in actions
                if (
                    power_upgrade_cost(power_level)
                    if action == "power"
                    else upgrade_cost(action, levels[action])
                )
                <= credits
            ]

            chosen: str | None = None
            if affordable:
                if rng.random() < mistake_probability:
                    chosen = rng.choice(affordable)
                elif desired in affordable:
                    chosen = desired
                # If the bottleneck is not affordable, save instead of buying a
                # zero-immediate-value upgrade. This fixes the run-1 greedy flaw.

            if chosen is not None:
                price = (
                    power_upgrade_cost(power_level)
                    if chosen == "power"
                    else upgrade_cost(chosen, levels[chosen])
                )
                credits -= price
                if chosen == "power":
                    power_level += 1
                else:
                    levels[chosen] += 1

    final_caps = capacities(
        levels,
        power_level,
        permanent_multiplier,
        module_multipliers,
    )
    return RunResult(
        sustained_throughput=mean(evaluation_samples),
        final_instant_throughput=min(final_caps.values()),
        levels=levels,
        power_level=power_level,
        credits=credits,
        module_count=len(modules),
        elapsed_game_time=game_time,
    )


def percentile(sorted_values: List[float], fraction: float) -> float:
    index = round((len(sorted_values) - 1) * fraction)
    return sorted_values[index]


def summarize(label: str, *, runs: int = 500, **kwargs: float | bool) -> None:
    values = sorted(simulate(seed, **kwargs).sustained_throughput for seed in range(runs))
    clears = sum(value >= FINAL_TARGET for value in values)
    print(
        f"{label:30} clear={clears / runs:6.1%} "
        f"p05={percentile(values, .05):6.2f} "
        f"p50={median(values):6.2f} "
        f"p95={percentile(values, .95):6.2f}"
    )


def print_reference_cases() -> None:
    print(f"Workshop final target: {FINAL_TARGET:.1f}/s sustained over {EVALUATION_WINDOW:.0f}s")
    summarize(
        "ordinary first run",
        mistake_probability=0.30,
        overclock_use_probability=0.15,
        modules_enabled=True,
    )
    summarize(
        "skilled / no modules",
        mistake_probability=0.03,
        overclock_use_probability=0.85,
        modules_enabled=False,
    )
    summarize(
        "ordinary after +8%",
        permanent_multiplier=1.08,
        mistake_probability=0.30,
        overclock_use_probability=0.15,
        modules_enabled=True,
    )
    summarize(
        "ordinary +10 start credits",
        starting_credits=30.0,
        mistake_probability=0.30,
        overclock_use_probability=0.15,
        modules_enabled=True,
    )

    # Speed invariance is a runtime requirement rather than a separate economy:
    # 300 game-seconds must be identical regardless of wall-clock multiplier.
    print("real-time duration: x1=300s, x2=150s, x4=75s; simulation horizon always 300 game-seconds")


if __name__ == "__main__":
    print_reference_cases()
