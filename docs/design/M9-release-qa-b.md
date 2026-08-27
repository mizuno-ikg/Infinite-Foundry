# M9 — Release QA B: game quality / release polish

## Scope

Release QA B was intentionally different from the prior robustness audit. The target was not merely whether the code executes, but whether Infinite Foundry is credible as a public Version 1.0: understandable in the first minutes, visually rewarding, meaningfully different across the seven Eras, not dominated by clicking, and polished on mobile as well as desktop.

## Evidence reviewed

- Current game implementation and UI (`index.html`, `app.js`, `engine.js`, `era-mechanics.js`, `era-visuals.js`, `styles.css`).
- Full-progression balance evidence from M8: 24 seeded complete runs reached the ending, with median 15 cycles and ×4-equivalent median play time about 31.5 minutes; median attempts by Era were 1 / 2 / 2 / 2 / 2 / 2 / 3.
- Actual Chrome screenshots from Release QA A for Era I / IV / VII on desktop and 390px mobile, plus the interaction flow.
- Fresh Chrome screenshots produced after this QA's fixes.
- Current README / LICENSE / `.nojekyll` / Pages workflow.

## What held up well

### First-loop clarity and tension

The first screen makes the main problem legible without a modal tutorial: final Directive target, remaining time, current Throughput, live Bottleneck highlight, selected-stage capacity and cost, and a single `UPGRADE STAGE` action all appear in the core view. The system is therefore learn-by-doing rather than instruction-heavy. The Workshop remains calibrated around an approximately five-minute final Directive at ×1.

### Clicking is supplementary

Production and Credits accrue automatically. The only repeated active tool, Overclock Pulse, is cooldown-bound and temporarily boosts the current bottleneck; it does not replace the economic loop with click spam.

### Failure feeds visible progress

Failure leads to the salvage / retain / rebuild panel rather than a dead end. Blueprint and Patent choices are explicit, the factory assets are reset, and permanent knowledge remains. This keeps the intended "assets burn, knowledge remains" identity visible in the UI.

### Seven Eras are more than palette swaps

The later domains change foreground machine identities, large-scale backgrounds and the Domain Protocol rule:

- automated bottleneck reclaim,
- city logistics dividends,
- source/orbit coupling,
- thermal-bank Overclock extension,
- law-symmetry balancing,
- genesis resonance.

The representative Chrome renders also show clear scale changes from Workshop machinery to planetary curvature and finally a proto-universe / Genesis Array scene.

### Endgame has a real finish

Universe Foundry has a distinct final Directive and an explicit `UNIVERSE IGNITION COMPLETE` ending state. The player may continue rebuilding afterward, but the mandate is unambiguously fulfilled.

## Defects found in Release QA B

### 1. Late-Era progression disappeared on mobile

**Finding:** the mobile inline CSS used `.era-node:nth-child(n+5){display:none}`, so the Era rail only showed Eras I–IV. In Era V–VII, the player therefore lost the strongest global indicator of how far the foundry had evolved. This directly conflicted with the product requirement that growth be visually obvious.

**Fix:** `era-visuals.css` now overrides the mobile rule and keeps nodes V–VII visible, forming a second row at 390px instead of hiding them.

**Verification:** the post-fix Chrome Era VII mobile screenshot visibly shows all seven Eras, with Universe Foundry highlighted and no horizontal overflow. CI run `33053930648` for commit `9196fc327bbe07bb697ea014185f8b5557ef0c7c` completed successfully, including Node regression and browser-render smoke.

### 2. Keyboard focus relied on browser defaults

**Finding:** the industrial visual styling had strong hover / selected states but no explicit release-quality focus indicator. Keyboard operation worked because controls are native buttons, but focus visibility was inconsistent across browsers/themes.

**Fix:** added a high-contrast cyan `:focus-visible` ring for buttons / machines while retaining the existing selected-state styling.

**Regression guard:** `tests/visual-contract.test.js` now requires both the mobile late-Era visibility override and a focus-visible rule.

## Visual review after fixes

The fresh Era VII mobile render was re-inspected rather than assuming the CSS change worked. It now shows:

- all seven Era nodes without horizontal overflow,
- Universe Foundry highlighted,
- final Directive and countdown readable above the scene,
- proto-universe visual centered behind the machinery,
- distinct PRIME MATTER / COSMIC FURNACE / SPACETIME WEAVE / GENESIS ARRAY identities,
- bottleneck emphasis remaining obvious.

The UI is dense, intentionally so, but the hierarchy remains workable on a phone: global status → Era progress → Directive → factory. Lower control panels are reached by normal vertical scrolling rather than squeezed beside the scene.

## Release judgement

**Game / UX judgement: release-worthy for Version 1.0.**

There are future enhancements one could make (audio, a richer optional onboarding layer, more bespoke animation, additional Endless content), but none is required to make the current work coherent or presentable. The game already has a complete loop, calibrated failure/rebuild progression, distinct Era mechanics, a visually escalating factory, responsive layouts, save/version handling, deterministic speed controls and a clear ending.

No known game-quality defect remains that should block public release after this QA.

## Remaining blocker

GitHub repository metadata still reports `has_pages: false`. The deployment workflow therefore fails at Pages configuration before it can publish; this is not a game-code or QA failure.

The remaining release sequence is only:

1. Enable GitHub Pages for the repository with **Source = GitHub Actions**.
2. Let / rerun the existing Pages deployment workflow.
3. Open the actual published URL and perform final desktop + mobile smoke against the deployed artifact.
4. Replace the README's provisional Play text with the verified public URL and close the Mission after the final release check.
