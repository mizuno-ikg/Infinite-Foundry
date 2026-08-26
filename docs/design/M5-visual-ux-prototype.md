# M5 — Workshop Visual / UX Prototype

## Status
M5 visual prototype baseline. This document records the UI/visual decisions that should survive into M6; the root `index.html`, `styles.css`, and `app.js` are the interactive prototype.

## Core visual promise
The player must be able to infer progress from the factory itself before reading the numbers.

Workshop therefore presents the production chain as a single physical line:

`SOURCE → PROCESS → TRANSFER → ASSEMBLY`, with `POWER` as a visible support plant.

The current bottleneck receives a strong hot-orange outline and a `BOTTLENECK` tag. The same stage is named in the factory overlay and becomes the natural upgrade target in the control panel. This keeps the mathematical throughput model and the scene language aligned.

## Information hierarchy
### Always visible
- Current Effective Throughput
- Credits
- Remaining game time
- ×1 / ×2 / ×4 simulation speed
- Final Directive target and progress meter
- Physical production line
- Current bottleneck

### Secondary but one action away
- Stage capacity / level / next cost
- Four Directive checkpoints
- Overclock cooldown
- Latest auto-recovered Module
- Short system log

The first Workshop view intentionally has no large inventory of locked tabs. Modules, Blueprint/prestige and higher-Era interfaces should appear only when their systems become relevant.

## Interaction model
- Clicking a machine **selects** it; it does not manually produce resources.
- `UPGRADE STAGE` is the core investment action.
- `OVERCLOCK PULSE` has a cooldown and boosts the current bottleneck; it is leverage, not a clicker loop.
- Modules are automatically recovered/equipped in the prototype and never pause production.
- Speed changes simulation time, not UI legibility.
- Hidden tabs receive no catch-up; simulation is intended to pause when not visible.

## Visual language
- Dark steel / near-black industrial field.
- Amber = productive heat / actionable progression.
- Hot orange = bottleneck / pressure.
- Cyan = power / system selection.
- Green = healthy/online state.
- Pipes, chimneys, smoke haze and moving conveyor payloads provide ambient motion without requiring image assets.

The prototype is deliberately built with CSS geometry and text/icon glyphs so the visual system can be iterated before committing to authored art assets.

## Responsive behavior
### Desktop
- Factory scene dominates the left side.
- Directive, upgrade controls and system log form a persistent right-side control stack.
- Production line reads horizontally.

### Mobile
- Factory remains the first major content block rather than being replaced by a spreadsheet-like list.
- Top stats wrap beneath the title and speed control.
- Production stages remain horizontally arranged inside the scene at compact scale so the line relationship survives.
- Directive / upgrade / log panels stack below the factory.
- No horizontal page overflow at 390px viewport in prototype QA.

## Prototype QA (2026-08-27)
The prototype was rendered from the same HTML/CSS/JS source at:
- 1440×1000 desktop viewport
- 390×844 mobile viewport

Checks performed:
- No JavaScript console errors during initial render.
- Desktop document width equals viewport width.
- Mobile document width equals 390px; no horizontal scrolling.
- Speed selection changes active state.
- Stage upgrade changes level and consumes Credits.
- Overclock enters cooldown after activation.
- Factory view, Directive meter, side controls and mobile stacked layout remain readable.
- A mobile footer crowding issue found during render QA was fixed by making footer spans block-level at ≤620px.

## M6 carry-forward requirements
M6 should not throw this prototype away and rebuild as a numeric dashboard. It should turn the prototype into a durable game architecture while preserving:
1. factory-first layout,
2. visible physical bottleneck,
3. non-modal Module feed,
4. cooldown active input,
5. fixed game-time semantics across speed modes,
6. responsive factory scene.

M6 must add robust state/simulation boundaries, deterministic/semi-deterministic random timing, save versioning, actual Directive window logic, prestige/Blueprint flow, and test coverage. Visual equipment growth should become more than level text: machine silhouette/detail, lighting, attached components, background activity, or scene density must visibly evolve as levels and Eras advance.
