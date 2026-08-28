# M14 — ×8 Automation gate / run 3

## Context

Human-operation-density instrumentation showed that a fast-forward mode can be simulation-correct while still multiplying real-time human decision pressure. The user clarified the product preference on 2026-08-29: ×8 does not need to exist from the start; it should become available only after automation/assist has reduced routine manual work, and it may be removed entirely if the resulting play balance is still poor.

## Decision

- ×1 / ×2 / ×4 remain available as normal speed controls.
- ×8 is treated as a progression reward for automated/high-speed repeat play, not as a baseline control.
- The first unlock gate is `meta.upgrades.automation >= 1`.
  - Prestige 2.0 guarantees Automation Lv1 at Foundry Memory 30 through `AUTOMATION SCHEMATICS`.
  - Legacy/manual upgrade routes that already own Automation also satisfy the gate.
- Before the gate, the ×8 control stays visible but disabled and explains `Acquire AUTOMATION to unlock ×8 fast-forward`.
- A save requesting ×8 without the Automation gate is restored at ×4 rather than bypassing the lock.
- Acquiring Automation during play re-syncs the speed bar so ×8 becomes available without requiring a reload.

This gate is intentionally minimal. It does not add auto-buy, auto-throttle, or hidden decision assistance merely to justify ×8.

## Validation contract

`tests/m14-fast-forward-contract.test.js` now fixes the following source-level requirements in addition to the existing deterministic simulation checks:

- ×8 is present in the allowed speed set.
- the browser layer has an explicit Automation unlock predicate;
- the ×8 button is disabled while locked;
- the lock condition is explained in the UI;
- deserialize cannot restore a locked state directly into ×8.

The fixed-step engine path remains unchanged, so the existing deterministic `0.05 × 2400`, `1 × 120`, and `8 × 15` game-second equivalence contract still represents simulation correctness.

## Product acceptance direction

M14 is not complete merely because the gate exists. The remaining acceptance question is whether ×8 is actually pleasant **after** Automation is available.

Compare attentive / relaxed human-like routes at ×1 / ×4 / ×8 on the same seed groups, focusing on:

- decisions and buys per real minute;
- Era 1–3 first-attempt clear behavior where applicable;
- attempt p50/p90;
- finish rate and Foundry Memory progression;
- event/Module/Overclock losses caused by reduced human attention.

If ×8 remains materially worse or unpleasant after Automation, prefer removing ×8 over adding intrusive automation solely to preserve the feature.

## Related user-fixed balance direction

Late-Era repeated-failure targets are now treated as a preference band rather than an exact formula:

- Era 5: roughly 1–3 failed attempts;
- Era 6: roughly 2–5;
- Era 7: roughly 3–7.

Avoid a design where the same Era commonly requires 10–20 repetitions. Memory/Breakthrough progression should make repeated failures visibly converge toward success.

Release remains user-gated: after M15 passes on `develop`, do **not** merge to `main` or update Pages until the user has reviewed the release candidate and explicitly approves publication.
