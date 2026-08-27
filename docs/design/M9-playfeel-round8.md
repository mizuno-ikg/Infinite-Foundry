# M9 — Playfeel Round 8: interaction confidence / integrated input hardening

## Why this round

Rounds 1–7 substantially changed the control surface: upgrades moved onto machinery, hold-to-upgrade reduced repeated clicks, Help can auto-pause, STATUS remains live, Era transitions gained a blocking briefing, and phone machinery moved to a 2×2 layout.

At this point adding more visual effects has lower value than checking whether those interaction layers remain trustworthy when focus, visibility and pointer state change.

Two concrete risks were selected for this round:

1. A hold-to-upgrade repeat loop should never keep spending Credits after the page loses visibility/focus, even if a browser/device fails to deliver the expected pointer cancellation in time.
2. Modal overlays should not strand keyboard focus or always return it to a generic toolbar button when the player opened STATUS from a Module or result action.

The goal is **input confidence**: one physical action should have bounded consequences, and keyboard users should always know where control moved.

## Changes

### Hold-to-upgrade lifecycle guard

`playfeel-round4.js` now tracks every armed/active hold cancellation function and cancels all holds on:

- `document.visibilitychange` when hidden
- `window.blur`
- `window.pagehide`

The repeat purchase function also refuses to execute while `document.hidden` is true.

Pointer `up`, `cancel` and `lostpointercapture` remain the normal path; the lifecycle guard is a second safety boundary, not a replacement.

### Dialog focus containment

`playfeel-round8.js` adds a small integration layer for Help, STATUS and Era briefing:

- Tab / Shift+Tab remain inside the currently open modal.
- Help and STATUS remember the actual launcher used by the player.
- Closing STATUS opened from `RECOVERED MODULE` or the result screen therefore returns focus to that launcher instead of always jumping to the top-bar STATUS button.
- Era briefing is a mandatory transition; after `BEGIN ERA`, focus moves to a currently actionable factory control rather than back to the now-obsolete ascend action.
- Dynamic automation/status summaries use polite live-region semantics.

### Focus visibility

`playfeel-round8.css` gives the dynamic factory controls an explicit `:focus-visible` treatment. Immediate-impact upgrades retain the stronger amber semantic even when keyboard-focused.

## Validation

A dedicated `tests/playfeel-round8-contract.test.js` is part of the default `npm test` chain. It guards:

- hold cancellation lifecycle hooks
- hidden-document spending guard
- Round 8 loader chain
- focus containment and launcher restoration contracts
- factory-focus handoff after Era briefing
- live-region semantics
- explicit focus-visible styling

The previous Round 7 contract was updated only to reflect that Round 8 CSS now follows the Round 6/7 mobile styles.

## Environment limitation

The execution container was retried during this round, but `github.com` DNS resolution is still unavailable. Therefore the exact develop checkout could not be cloned and the full repository `npm test` / Chromium render could not be executed from the container.

This remains a release gate. The static contracts are intentionally strengthened, but they are not represented as equivalent to exact-artifact browser QA.

## Release posture

Do not release from this round alone. Continue converging rather than adding feature surface. The next useful work is either:

1. obtain exact develop browser QA and fix concrete desktop/mobile findings, or
2. if rendering remains unavailable, perform one more integrated state/loader audit and reduce accidental complexity before release.
