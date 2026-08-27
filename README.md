# Infinite Foundry

**Infinite Foundry** is a finite factory incremental game for desktop and mobile browsers. You are an industrial management intelligence growing a small workshop into a universe-scale foundry while meeting escalating production Directives.

## Play

**Published build:** https://mizuno-ikg.github.io/Infinite-Foundry/

The repository is intentionally a static web app so GitHub Pages can serve the game without a backend.

## Core loop

1. Production and Credits accumulate automatically while the game is visible and running.
2. The slowest of **SOURCE / PROCESS / TRANSFER / ASSEMBLY / POWER** is the live bottleneck and limits total Throughput.
3. Invest Credits into machinery, use the cooldown-bound Overclock Pulse when useful, and recover random Modules during the cycle.
4. Meet the Final Directive's sustained Throughput target before the deadline.
5. On failure, the factory is dismantled but Blueprint / Patent knowledge survives. Rebuild stronger and try again.
6. Progress through seven Eras: Workshop → Automated Factory → Industrial City → Planetary Foundry → Stellar Forge → Law Foundry → Universe Foundry.
7. Complete Universe Foundry to reach the explicit ending.

## Controls and player-facing help

The game now starts from a stopped **Production Directive** screen instead of immediately consuming deadline time. Press **BEGIN PRODUCTION** when ready.

- **PAUSE / RESUME** — stops both production and the Directive clock.
- **×1 / ×2 / ×4** — simulation speed. Economy remains deterministic for equal game-time.
- **? HELP** — opens the in-game Q&A explaining bottlenecks, Overclock, Modules, Prestige, saves and offline rules.
- **STATUS** — shows current Module loadout plus all permanent Blueprint / Patent effects.
- **UPGRADE STAGE** — invests in the currently selected machine.
- **OVERCLOCK PULSE** — temporarily boosts the live bottleneck by 30%.
- **MODULE BAYS** — recovered Modules auto-equip when useful, but recovered parts stay in the cycle inventory and can be reassigned to any Bay from STATUS.
- **SAVE / RESET** — manual save or full progress reset.

Cycle results are shown above the factory with the final sustained Throughput, shortfall or success, final bottleneck, earned resources, retained strength and the rebuild / ascend actions.

## Important rules

- **No offline progress.** Hiding or closing the game does not produce resources and does not advance the deadline.
- A manual Pause is also a full simulation pause; there is no hidden catch-up when resuming.
- Random Modules may create strong runs, but progression is not supposed to depend on a specific drop.
- Current-run machinery and Modules burn on rebuild. Blueprint / Patent upgrades and Era unlock knowledge persist.
- Existing version 4 saves migrate to the version 5 save schema; malformed saves fall back safely to a fresh game.

## Development and QA

```bash
npm test
npm run stress:progression
npm run qa:browser
```

`npm test` covers deterministic simulation, save migration, seven-Era progression, Domain Protocol mechanics, UI contracts and seeded full-campaign progression balance.

`npm run qa:browser` is the browser interaction/render harness. It checks onboarding, pause, Help, Status, selectable Module loadout, result/retry UX, corrupt-save recovery, representative Era renders and desktop/mobile overflow. The browser harness may require a Chromium environment that permits local test-page navigation.

Design and QA records live under `docs/design/`.

## GitHub Actions policy

Actions are intentionally **manual-only**. Development happens on `develop` with local Node/browser QA. CI and Pages deployment run only through `workflow_dispatch`, so normal commits, pull requests and merges do not consume runner executions automatically.

Release flow:

1. Develop and test on `develop`.
2. Merge a verified release candidate to `main`.
3. Optionally run the manual CI workflow.
4. Run the manual Pages deployment workflow once.
5. Smoke-test the deployed URL on desktop/mobile.

## Save compatibility

The save wrapper is versioned. Version 5 adds onboarding state and a per-cycle recovered Module inventory / selectable loadout while migrating version 4 saves forward. Future versions should continue to migrate known older schemas and reject unsupported future schemas.
