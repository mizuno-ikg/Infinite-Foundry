# M9 — Playfeel Round 10: transition-state persistence

## Scope

Round 10 is a release-integration pass, not a new feature round. The focus is whether the polished interaction states introduced in prior rounds remain trustworthy across save / reload boundaries.

## Finding

Era advancement deliberately halts the production clock and presents a `BEGIN ERA` briefing containing the new Directive, Domain Protocol and retained knowledge. However, the underlying base `restart(true)` saves the new Era state before the briefing overlay opens. The overlay/pause state itself lived only in browser memory.

That created a discontinuity:

1. Clear an Era and advance.
2. New Era state is saved at time 0.
3. Briefing opens and pauses production.
4. Reload while reading the briefing.
5. Saved game restores the new Era, but no persisted marker says the briefing is still pending; production can start immediately.

This is undesirable because reading a transition explanation should not be bypassable or become a hidden time penalty through reload behavior.

## Change

`playfeel-round10.js` adds an explicit cycle-scoped state marker:

- `cycle.playfeel.eraBriefPending = true` after a successful Era transition opens its briefing.
- The state is saved immediately after the marker is set.
- `BEGIN ERA` clears the marker and saves again.
- On reload, if the marker is still true, the current Era briefing is reconstructed, `paused` is restored, and focus returns to `BEGIN ERA`.

The marker is cycle-scoped rather than global/meta state because it describes the current foundry's unacknowledged transition, not permanent progression.

## Persistence audit

Round 10 also adds a contract test confirming that existing serialization already preserves the other new playfeel state without schema surgery:

- `meta.automationMode`
- `cycle.playfeel.overclockCapacitor.charges`
- `cycle.playfeel.overclockCapacitor.progress`
- `cycle.playfeel.eraBriefPending`

The existing engine serializer stores the state object structurally, and deserialization normalizes required legacy fields without deleting these additive fields.

## Design principle

Transient UI state should not automatically be persisted. Persist it only when it represents a gameplay contract whose loss would change player agency, timing or interpretation.

Examples worth persisting:

- an unacknowledged mandatory/important phase briefing that intentionally halts a deadline,
- explicit automation policy chosen by the player,
- banked gameplay charges/progress.

Examples that should remain transient:

- hover/focus styling,
- short feedback animations,
- toast visibility,
- ordinary modal scroll position.

## Verification

Added `tests/playfeel-round10-contract.test.js` and connected it to the default `npm test` chain. The test guards both the Round 9 → Round 10 loader chain and serialization of Automation / Overclock / Era briefing state.

Exact full-repository browser rendering remains a separate release gate; this round does not claim visual verification of the reconstructed develop artifact.
