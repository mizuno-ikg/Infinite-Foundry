# M14 paired speed acceptance — run 5

## Context

M14 already has ×8 fast-forward, fixed-step determinism contracts, speed-aware human decision cadence, and an Automation Lv1 unlock gate. The remaining product question is not whether ×8 can technically run, but whether it remains a useful QoL reward once a human-like player is modeled at a fixed real-time attention budget.

User direction is explicit: ×8 should not be preserved at the cost of a noticeably worse play experience. If Automation-era ×8 still makes the player materially busier or degrades progression, removing ×8 is preferred over adding heavy assist.

## This run

A paired, same-seed reporting layer was added at `tools/balance/m14-speed-report.js` and exposed as:

```bash
npm run balance:m14
```

It compares attentive and relaxed routes at requested ×1 / ×4 / ×8. Requested ×8 continues to obey the game/proxy Automation gate, so pre-unlock cycles are effectively ×4 and only post-unlock cycles can use ×8.

The report includes:

- finish rate
- cycle p50 / p90
- decisions and buys per real minute
- final Foundry Memory p50
- per-Era reach rate
- per-Era attempt p50 / p90 among routes that actually reached that Era
- paired same-seed ×4→×8 deltas

A conservative report-level ×8 acceptance check uses ×4 as the practical baseline. It rejects ×8 when any of the following is materially worse:

- decision density > 1.35×
- finish-rate drop > 10 percentage points
- Memory progress < 85% of ×4
- early first-attempt clear drop > 20 percentage points
- late-Era reach drop > 15 percentage points
- late-Era median attempt penalty > +2

These are acceptance heuristics, not balance targets. Failure means `REVIEW / REMOVE x8`, not “add enough automation to force a pass.”

## Important audit fix

An existing `tools/balance/m14-speed-gate.js` had a subtle survivorship/inversion bug: `simulateRoute()` stores `attempts=0` for Eras a route never reaches, and the gate included those zeroes in late-Era medians. A route that failed before Era 7 could therefore make Era 7 look easier.

The gate now:

- calculates late-Era attempt medians only from routes with `attempts > 0` for that Era,
- separately records late-Era reach rate,
- rejects an ×8 comparison that loses more than 15 percentage points of late-Era reach,
- rejects a late-Era fit where an Era has zero reach instead of treating zero attempts as good performance.

`tests/m14-speed-gate-contract.test.js` now covers the unreached-Era case and is wired into default `npm test`. `npm run balance:m14:gate` exposes the machine-oriented KEEP_X8 / REMOVE_X8 gate.

## Execution constraint

The normal local clone path was retried in this run and still fails with:

```text
Could not resolve host: github.com
```

Therefore the formal Node multi-seed output is still not available in this execution environment. GitHub connector reads/writes are healthy. Actions remain intentionally unused because the Mission reserves them for release-grade exact QA rather than iterative balance work.

## Next

When an exact/local execution path is available, run the paired report and speed gate with the same seed set. If attentive or relaxed ×8 fails the gate after Automation is active, prefer removing ×8. If both remain within the gate, close M14 and proceed to M15 integrated exact + 1440×1000 / 390×844 / 360×800 browser/render QA.
