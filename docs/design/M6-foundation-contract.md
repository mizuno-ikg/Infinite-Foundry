# Infinite Foundry — M6 Runtime Foundation Contract

Status: M6 foundation active  
Date: 2026-08-27 JST

## 1. Runtime invariants

Workshop runtime must preserve the M4 balance model rather than merely resemble it visually.

- canonical game step: 0.05 game-seconds
- cycle horizon: 300 game-seconds
- speed controls: ×1 / ×2 / ×4 change wall-clock duration only
- hidden/closed time: no simulation and no catch-up
- Effective Throughput: minimum of SOURCE / PROCESS / TRANSFER / ASSEMBLY / POWER after active Module effects
- final evaluation: last 30 game-seconds sustained average
- random Module scheduling: seeded game-time events, never render-frame rolls

## 2. M4-to-runtime alignment correction

A vertical-flow test exposed a major mismatch in the first M6 runtime implementation. The UI engine had used:

- stage base capacity `1.0` for almost every stage instead of the M4 asymmetric baseline;
- simple `base * growth^level` capacity growth instead of the M4 geometric-series capacity accumulation;
- only `0.55 * throughput` credits per game-second instead of `1.0 * throughput`.

That implementation could only reach about 1.75/s under a reasonable smart policy and therefore could not meaningfully target the frozen 52/s Workshop Directive.

The runtime is now aligned to the M4 baseline:

- SOURCE 1.20 / PROCESS 1.00 / TRANSFER 0.90 / ASSEMBLY 0.80
- stage costs 8 / 9 / 10 / 11
- POWER 6.0, cost 10
- stage growth 1.11, POWER growth 1.18 using the same geometric-series interpretation as the balance sandbox
- income = current Effective Throughput credits per game-second

A 500-seed runtime-equivalent policy stress test after correction produced approximately:

- ordinary first run: clear 29.2%, median 49.9/s
- ordinary after +8% permanent capacity: clear 95.6%, median 60.6/s
- ordinary after one current Starting Capital level (+8 credits): clear 54.8%, median 52.5/s
- skilled policy with active Module recovery: near-certain first-clear capability
- skilled policy with Modules disabled: clear about 72%, median 52.5/s

These are not final M8 balance numbers. They are a foundation check that the browser runtime again inhabits the same difficulty region as M4: failure-majority ordinary first play, near-miss median, skilled first-clear path, and strong post-prestige progress.

## 3. Module contract

Recovered Modules are now stage-targeted instead of global multipliers.

- Common: +4–8% to one production stage
- Refined: +8–15%
- Prototype: +18–30%
- targets: SOURCE / PROCESS / TRANSFER / ASSEMBLY
- active slots auto-equip without pausing production
- when full, a stronger recovered Module replaces the weakest slot; otherwise it is catalogued
- Module effects participate in bottleneck selection, so the highlighted bottleneck remains the real effective constraint

Module recovery emits a domain event consumed by the browser adapter, making recovery visible in the system log without coupling simulation code to the DOM.

## 4. Automation Memory

Automation Memory now has a concrete Workshop role rather than being a future-only placeholder.

After 75 game-seconds it checks every 10 game-seconds and may auto-buy the current bottleneck only while preserving a reserve:

- level 1: requires 1.8× upgrade cost on hand
- level 2: requires 1.5×
- level 3: requires 1.3×

The intent is `Unlock → Learn → Automate → Move Up`: the player still learns the Workshop manually, while later cycles gradually remove already-understood repetitive intervention. Automation emits domain events so the player can see what the retained knowledge did.

## 5. Save/version contract

Engine save schema is now version 2.

- v1 payloads migrate in place by adding the event buffer and automation schedule.
- current-cycle fractional accumulator is discarded on load; no offline/catch-up time is granted.
- unknown future versions are rejected safely rather than partially interpreted.
- the browser keeps the existing localStorage key so existing prototype saves can be migrated instead of silently orphaned.

Future save changes should extend `deserialize` with explicit normalization/migration steps rather than invalidating all previous saves by exact-version equality.

## 6. Domain event boundary

Simulation emits bounded domain events for:

- Module recovery
- Directive evaluation
- cycle end
- Overclock activation
- permanent upgrade purchase
- Automation Memory purchases
- rebuild/start

The browser adapter consumes these for system-log feedback. This prevents UI feedback from depending on polling diffs between rendered states and gives later Era-specific visuals a stable event source.

## 7. Foundation QA

Dependency-free Node tests now cover:

- speed/chunk invariance
- deterministic Module sequence/events
- save roundtrip
- v1 migration / future-version rejection
- deadline resolution and Blueprint salvage
- Burn / Retain / Invest restart behavior
- Automation Memory behavior
- a complete Workshop vertical flow: cycle resolve → permanent purchase → rebuild → mid-cycle save/reload
- static UI contract: DOM IDs referenced by `app.js` must exist in `index.html`, and `engine.js` must load before `app.js`

`npm test` runs the foundation suite without third-party packages.

## 8. Remaining M6 exit risk

The engine/domain foundation is now materially stronger, but M6 should not be declared complete solely from Node tests. Before moving fully into M7, re-run browser-level interaction/render QA against the current sources, especially:

- cycle-end prestige panel
- permanent purchase feedback
- restart into Cycle 2
- Module event log
- Automation Memory event log
- save/reload behavior
- desktop/mobile layout after the prestige panel expands

The key lesson from this run is that **a visually functioning prototype can still be economically non-functional if runtime formulas drift from the validated balance model**. Runtime-to-design parity is therefore an explicit M6/M8 quality gate.
