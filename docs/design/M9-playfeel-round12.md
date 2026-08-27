# M9 — Playfeel Round 12 / Important-input durability

## Problem found in release-state audit

Round 11 made Automation Memory cadence durable across reloads, but the same audit exposed an asymmetry in another high-value interaction: Overclock Capacitor consumption.

The base UI renders immediately after a successful Overclock, while the normal autosave cadence is periodic. A successful capacitor spend therefore had a short window in which a reload/crash could restore the previous charge and remove the just-triggered burst. This is not primarily a balance exploit—the active burst rolls back too—but it makes a scarce, deliberate input less trustworthy than upgrades, loadout changes, speed changes, or automation-mode changes that already save immediately.

For a charge-banked interaction, the user should be able to trust that pressing the button committed the decision.

## Change

`playfeel-round12.js` observes the Overclock button around the existing gameplay handler.

- capture phase records cycle id, capacitor charges and `overclockUntil` before the action;
- normal base / Round 3 handlers perform the actual gameplay action;
- the later listener compares post-action state;
- if a charge was consumed or the active Overclock deadline advanced, `save()` runs immediately;
- rejected/no-op clicks do not add extra saves.

The save indicator briefly reports `SAVED · OVERCLOCK`, making the durability boundary visible without adding another toast.

This preserves the existing capacitor design (3-charge bank, 40 game-sec recharge, 8 game-sec burst) and does not alter economy or timing.

## QA contract

`tests/playfeel-round12-contract.test.js` verifies:

- Round 12 is reachable from the active playfeel loader chain;
- successful Overclock state changes are the condition for the immediate durability save;
- a spent capacitor charge survives engine serialize/deserialize;
- active `overclockUntil` survives the same round trip.

The test is part of the default `npm test` chain.

The browser UX fixture also spends the initial capacitor charge and immediately inspects localStorage, requiring both the depleted charge and active burst deadline to already be durable. `browser-smoke.js` now treats that `qaOverclock` result as a release interaction gate across desktop, 390px mobile, and 360px narrow-mobile runs.

## Release implication

This removes one more save/reload inconsistency before release. Remaining release gates are still exact develop full tests and desktop/mobile browser rendering/interaction checks; no main/Pages release is justified solely by this change.

## Provenance

- Internal source: Infinite Foundry develop release-state audit after Playfeel Round 11.
- Confirmed: 2026-08-28 JST.
- Scope: Infinite Foundry v1.2 playfeel branch; principle generalizes to scarce/committed UI actions.
- Time dependence: low; reassess if save architecture or Overclock interaction changes.
