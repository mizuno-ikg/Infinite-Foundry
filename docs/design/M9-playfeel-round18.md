# M9 Playfeel Round 18 — release-render convergence

## Why this round exists

Release-grade browser QA became available through a deliberately limited GitHub-hosted run after the local execution container continued failing DNS resolution for GitHub. The goal was not to add features, but to render the exact `develop` artifact, inspect it, and fix issues that source-level review could not expose.

## Exact test evidence

Multiple GitHub-hosted runs checked out the exact `develop` SHA and executed the full `npm test` chain. The corrected Round 18 tree passes engine, foundation flow, Era progression, visual contract, Era mechanics, playfeel contracts through Round 18, and progression balance (24 seeds, 100% finish).

## Visual finding: toast collision

The first usable desktop screenshots for Era 1 / 4 / 7 exposed a real visual issue: the fixed top-right `MODULE RECOVERED` toast covered TIME / HELP / STATUS / PAUSE controls. Static and geometry tests did not catch it.

### Fix

`playfeel-round18.js` moves the toast stack below the critical top controls, with larger safe offsets at tablet and phone breakpoints. Round 18 is chained from Round 17 and guarded by `tests/playfeel-round18-contract.test.js`.

A subsequent exact desktop screenshot confirmed the critical controls are no longer obscured.

## QA harness findings

The legacy browser smoke path had two reliability problems that produced false negatives:

1. navigation was assumed after fixed sleeps rather than checked;
2. fixture states written to `localStorage` could be overwritten by the outgoing game's legitimate `beforeunload` save.

`tools/qa/browser-release.js` was added as a release-grade CDP harness. It verifies server readiness, target/navigation readiness, exact URL/DOM state, screenshots, mobile geometry, intro, interaction fixture, and corrupt-save recovery.

The fresh-start fixture now resets the game state through the game engine before navigation so `beforeunload` persists a true fresh state. `tools/qa/browser-ux.html` now blanks the iframe before seeding Module/result/Era fixtures, ensuring the outgoing page finishes its save before the fixture is written.

## Remaining blocker

The final run after those fixture corrections did not reach interaction validation because GitHub-hosted Chrome itself failed to expose the DevTools endpoint within the 15-second startup budget. The immediately preceding runs did expose DevTools with the same launch mode, so this is classified as runner/Chrome startup flakiness rather than a demonstrated game regression.

The local container still cannot clone GitHub because its DNS path cannot resolve GitHub hosts, so it cannot substitute as the exact working-tree renderer.

## Next release action

Do not add new gameplay features and do not release `main` yet. Harden the release harness with a longer Chrome startup budget and a bounded one-time launch retry, then run one batched release-grade Action. Require:

- full `npm test` PASS;
- desktop 1440x1000, mobile 390x844, narrow 360x800 Era 1/4/7 geometry/render PASS;
- intro / pause / help / status / Module / result / retained-advantage / Era briefing reload / Overclock / corrupt-save interaction PASS;
- screenshot artifacts downloaded and visually inspected.

Keep CI manual-only outside this deliberate release gate.
