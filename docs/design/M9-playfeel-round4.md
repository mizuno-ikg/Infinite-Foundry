# M9 — Playfeel Round 4: direct-control repetition without automation

## Goal

Round 1 made upgrade actions local to each machine, but a player who correctly diagnoses a machine can still need many identical taps before the constraint moves elsewhere. Round 3 reduced Overclock reaction pressure; Round 4 targets the remaining **physical repetition cost** without removing the player's decision about where Credits are invested.

The desired interaction is:

```text
choose the machine
→ tap once for one deliberate upgrade
or
→ hold the same UPGRADE control to continue investing there
→ release immediately when you want to reconsider
```

This is intentionally different from `BALANCE LINE`, `BUY MAX`, or forced automation. Those commands can collapse the core bottleneck decision into a dominant macro. Hold-to-upgrade reduces motor repetition while preserving target selection and the visible relationship between a machine and its growth.

## Research / implementation basis

### Pointer Events

MDN documents Pointer Events as a unified input model for mouse, touch and pen, including `pointerdown`, `pointerup`, `pointercancel`, and pointer capture. This fits a hold interaction better than maintaining separate mouse/touch paths.

- https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events
- checked 2026-08-28

Round 4 therefore uses Pointer Events, cancels safely on `pointercancel`, and suppresses the normal release-click after hold-repeat has started so the user does not receive an accidental extra purchase.

### Touch target size

Apple's current accessibility guidance lists 44×44 pt as the default iOS/iPadOS control size and emphasizes spacing/sufficiently sized controls for mobility. The web UI is not an iOS-native app and CSS px are not identical to pt, but the 44-unit recommendation is a useful conservative target for a frequently repeated mobile action.

- https://developer.apple.com/design/human-interface-guidelines/accessibility
- checked 2026-08-28

The mobile machine UPGRADE control therefore uses a 44px minimum height rather than the previous tiny cost chip.

## Interaction specification

- Single tap/click remains exactly one upgrade.
- Holding for 360ms arms repeat mode.
- Once armed, one purchase occurs immediately and repeat purchases occur every 120ms while the pointer remains held.
- Repeat stops when:
  - pointer is released,
  - pointer is cancelled,
  - purchase becomes unavailable / button becomes disabled.
- Release after a hold does **not** add a final browser-generated click.
- A short fill animation communicates the arming threshold.
- During active repeat, the button receives a persistent hold state.
- `touch-action: manipulation` and text selection suppression reduce accidental gesture/selection friction on the control.
- Long-hold context menu is prevented only while repeat mode is active.

The timing constants live in `playfeel-logic.js` as `HOLD_TO_UPGRADE` so contract tests can detect accidental tuning drift.

## Why not a global Balance / Buy Max button yet

A global optimal-invest command would certainly lower click count, but it also risks reducing the early game to repeatedly asking the system to solve the same bottleneck problem for the player. The current progression already has Automation Memory as an explicit delegation layer.

Round 4 therefore keeps three distinct levels of agency:

1. **tap** — exact one-step manual investment,
2. **hold** — manual target, reduced physical repetition,
3. **Automation Memory** — explicit player-enabled delegation after progression unlocks it.

If later playtesting still shows excessive cognitive repetition rather than only motor repetition, a higher-level balance command can be reconsidered with evidence.

## Mobile / readability adjustment

The machine UPGRADE target is increased to a 44px minimum height under the mobile breakpoint. The label remains compact (`▲ cost`) so the target gets easier to hit without adding another large text block over the machine art.

A short `DIRECT CONTROL` hint is added to Bottleneck Analysis so the hold gesture is discoverable without a modal tutorial.

## QA added

`tests/playfeel-round4-contract.test.js` verifies:

- hold delay / repeat timing constants,
- Pointer Events path,
- pointer cancellation handling,
- release-click suppression,
- 44px mobile minimum target height,
- touch-action declaration,
- Round 4 JS/CSS loader wiring.

The normal `npm test` chain now includes this contract.

## Release status

This remains a `develop`-only iteration. It does not change `main` or GitHub Pages. Exact desktop/mobile rendered-artifact verification is still required before a release decision.

## Next review target

After Round 4, evaluate the complete Round 1–4 interaction as one system:

- Does hold-to-upgrade materially reduce physical click fatigue?
- Does it accidentally encourage mindless holding, or does bottleneck switching naturally restore decisions?
- Are 44px mobile controls comfortable without obscuring machine identity / growth pips?
- Is Automation Memory now clearly optional rather than a required solution to repetitive input?
- Does the game still need a higher-level bulk/balance command, or has motor repetition been sufficiently separated from strategic delegation?
