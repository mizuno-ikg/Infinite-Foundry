# M9 — UX polish / Version 1.1 release candidate

## User feedback addressed

Post-release play identified a common visibility problem: the simulation worked, but the game did not always explain **what is happening, what the player gained, or what can be chosen** strongly enough.

This RC therefore focuses on onboarding, result clarity and visible retained power rather than changing the established economy.

## Changes

- New games open in a stopped `PRODUCTION DIRECTIVE` onboarding state. The first deadline clock does not start until `BEGIN PRODUCTION`.
- Added in-game `? HELP` Q&A.
- Added explicit `PAUSE / RESUME`; production and Directive time both stop, with no resume catch-up.
- Moved cycle result / retry UI above the factory. Failure now names the final bottleneck and the remaining Throughput gap.
- Result UI shows current Blueprint / Patent wallet and a plain retained-strength summary before rebuilding.
- Added `STATUS / LOADOUT` with current Module Bays, recovered Module inventory and permanent Blueprint / Patent effects.
- Module recovery remains non-modal and does not pause production, but now produces a visible notification.
- Recovered Modules persist for the current cycle as inventory and can be assigned to a chosen Bay. They still burn on rebuild.
- Save schema moved to v5. Existing v4 saves gain Module inventory identifiers and infer whether onboarding has already been seen.
- README now points to the public build and documents the new controls.

## Economy / progression regression

The Module loadout change does not alter automatic baseline behavior: recovered Modules still auto-equip into an empty Bay or replace the weakest equipped multiplier when the new drop is stronger. Manual reassignment adds player agency but is not required for progression.

Local `npm test` after the UX implementation:

- engine / migration: pass
- foundation UI contract: pass
- seven-Era progression: pass
- visual contract: pass
- Domain Protocol mechanics: pass
- full progression, 24 seeded campaigns: **100% ending reach**
- campaign cycles p50 / p90 / max: **15 / 18 / 20**
- median Era attempts: **1 / 2 / 2 / 2 / 2 / 2 / 3**

These match the previously accepted M8 progression envelope, so the UX work did not silently disturb the calibrated campaign.

## Browser QA note

A browser interaction harness was updated to cover onboarding clock freeze, begin, manual pause, Help, Status, Module reassignment, failure result placement, retained-strength updates, v5 persistence, corrupt-save recovery and representative desktop/mobile Era rendering.

The current ChatGPT execution container's Chromium is administratively blocked from navigating to both localhost and file URLs, so the **exact reconstructed RC could not be re-rendered in that container**. Prior UX prototype renders for the same interaction design were visually inspected, but they are not treated as identity-equivalent evidence for this RC.

Therefore the remaining release gate is intentionally the deployment step itself: after merging this RC to `main`, run the single manual Pages deployment and perform desktop/mobile smoke on the exact deployed artifact before calling the release complete.

## Actions quota policy

Both CI and Pages workflows are changed to `workflow_dispatch` only. Normal development on `develop`, PR creation and merge no longer intentionally trigger Actions. Local tests are the default iteration loop; Actions are reserved for an explicit release check / deployment.
