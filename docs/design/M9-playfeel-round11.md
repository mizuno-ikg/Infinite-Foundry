# M9 — Playfeel Round 11 / Automation cadence persistence

## Problem found during release-state audit

Automation Memory is deliberately opt-in, but its decision cadence still lived in a JavaScript-local `nextAutomationAt` variable. That meant reload did not preserve the next delegated decision time.

After the first automation window had opened, a player could repeatedly reload at the same game time and cause Automation to become immediately eligible again. Even without an explicit exploit attempt, reload changed the timing semantics of delegated control.

This conflicts with two established playfeel principles:

- automation should behave predictably as delegated authority;
- reload / tab lifecycle should not create a hidden advantage or penalty when offline progress is disabled.

## Change

`cycle.playfeel.automationNextAt` is now the canonical next-decision timestamp.

- Legacy saves initialize it to the later of the normal first automation window or the current game time.
- The initialized value is immediately saved so repeated reload cannot repeatedly recreate an already-due in-memory timer.
- Every automation decision window advances the persisted timestamp by the normal cadence (10 game-sec, or 7 game-sec at level 3).
- A decision window that finds no valid purchase still advances and saves the timestamp. Reload therefore cannot be used to retry an otherwise throttled decision without game time passing.
- Rebuild naturally receives a fresh `cycle.playfeel` object and therefore a fresh first-window schedule.
- Automation mode remains player-controlled in `meta.automationMode`; this change only makes its timing deterministic across save/reload.

## Verification contract

`tests/playfeel-round11-contract.test.js` verifies that:

- no local `let nextAutomationAt` timer remains;
- the runtime uses `automationNextAt` under `cycle.playfeel`;
- both successful and no-purchase decision windows advance/persist cadence;
- engine serialize/deserialize preserves `automationNextAt` alongside Automation mode.

The contract is included in the default `npm test` chain.

## Release status

This closes a real save/reload consistency issue but does **not** by itself clear the release gate. Exact develop full-test and desktop/mobile Chromium render remain required before main release / Pages deployment.

## Provenance

- Internal source: Infinite Foundry playfeel release-state audit, 2026-08-28 JST.
- Applies to: save/reload behavior of player-enabled Automation Memory in the current v1.2 develop line.
- Time dependency: tied to the current playfeel implementation; re-audit if automation scheduling is moved into the engine or redesigned.
