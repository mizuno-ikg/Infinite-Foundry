# M15 release candidate gate — run 1

Date: 2026-08-29
Branch: `develop`
Release boundary: `main` / Pages remain unchanged until explicit user approval.

## Scope

M15 integrated release-candidate audit after M10–M14 post-release balance rework.

Validated:

- meaningful failure / early salvage retained progression
- immediate-abort anti-farm
- Foundry Memory persistence and next-run starting strength
- Research Focus bounded contribution
- save/reload and corrupt/future save handling
- shipping speed normalization and rebuild speed x1
- shortened Era progression contracts
- human-balance contract
- Module / STATUS / Era-flow UX contracts
- 3 viewport browser/render QA

## Release-grade exact QA path

The normal container continued to fail DNS resolution for `github.com`, so release-grade exact QA used a deliberately one-shot GitHub Actions workflow rather than Actions as an iterative development environment. The workflow is path-filtered so later ordinary `develop` commits do not spend Actions minutes unless the gate file is intentionally touched.

The first exact runs exposed stale pre-M12 fixtures and one real regression:

1. `engine.test.js` advanced a module fixture 240 seconds even though Era 1 now lasts 150 seconds, so the run had already ended before a manual equip assertion.
2. `era-progression.test.js` still expected the old 300-second Era 1 checkpoint times and old Era 2 targets.
3. browser UX module fixture advanced 230 seconds and therefore tested an ended run.
4. **Real bug:** Prestige `meaningful()` treated fresh baseline throughput above 5% of final target as meaningful even at time=0, allowing immediate SALVAGE to award 1 Memory.
5. Legacy 1-second optimal-bot progression test still imposed product-balance attempt limits even though the current product contract explicitly demotes the perfect bot to an upper-bound sanity oracle.

## Fixes

- Module fixtures now derive their sample time from current Era duration and assert the run remains active.
- Era progression contract uses the shortened curve.
- Browser Module fixture uses `0.92 × current Era duration`.
- Prestige meaningful-throughput path now requires at least 2% of Era duration plus actual produced output. Immediate abort remains 0 Memory; normal meaningful partial progress still earns retained progress.
- Optimal-bot progression test remains a finish/progression sanity oracle; attentive/relaxed human contracts own product balance.
- Added `tests/m15-integration-contract.test.js` to default `npm test`.

## Final exact gate

GitHub Actions run `33234630723` at head `c3620af21f11adba6b6cf20ed93974850c12aa57` completed successfully.

All `tests/*.test.js` passed, including:

- `human-balance-contract`
- `prestige-m11-contract`
- `m13-ux-contract`
- M14 fast-forward / operation-density / speed-gate contracts
- new `m15-integration-contract`
- optimal-bot progression sanity: 24 seeds, 100% finish, cycles p50/p90/max `15/16/18`, attempt medians `1/1/1/1/1/3/6`

`npm run qa:release` also passed for:

- desktop `1440×1000`
- mobile `390×844`
- narrow mobile `360×800`

For Era 1 / 4 / 7 on both mobile widths:

- 4 production stages present
- 4 direct upgrade controls present
- touch targets ≥44 px high
- no stage overlap
- no POWER/stage overlap
- no label/POWER overlap
- no horizontal scene overflow
- all production stages remain inside scene bounds

Corrupt-save QA passed on all three viewports. Browser UX QA passed intro, pause provenance, help, STATUS, Module equip/preview, result/retained progress, Era briefing + reload, direct upgrades, and Overclock persistence.

Render artifact: `m15-browser-render-evidence`, artifact id `9709537627`, digest `sha256:e95aadfcc313d0910257a831ed3a4052c478d32b818eea4adfcef0b1cac0e67b`.

## Render review

The 15 screenshots (Era 1/4/7 + intro + UX across all 3 viewports) were visually reviewed after the exact run.

Observed:

- Desktop keeps the intended dense industrial dashboard hierarchy without clipping or obvious overlap.
- 390px and 360px layouts preserve top controls, Research/SALVAGE actions, Era rail, final goal, bottleneck panel and factory scene without horizontal breakage.
- Intro remains legible at both narrow widths.
- Era 1 / 4 / 7 retain visually distinct factory/world progression at mobile widths.
- No render defect was found that warrants another implementation pass before user play review.

## Balance state carried into RC

Shipping speed remains `×1 / ×2 / ×4`; experimental ×8 was rejected in M14 because it degraded human progression despite acceptable real-time operation density.

Late final targets remain:

- Era 5: `1400`
- Era 6: `3600`
- Era 7: `9700`

The preceding 12-seed Focus-OFF human fit completed 100% for attentive and relaxed routes, with late attempt p50:

- attentive E5/E6/E7: `2 / 5 / 3`
- relaxed E5/E6/E7: `3 / 5 / 5`

Research Focus remains optional salvage conversion rather than a required normal-route strategy.

## Release decision

M10–M15 automated release-candidate gates are satisfied. The branch is now ready for the user's final hands-on confirmation.

Do **not** merge `develop` to `main` and do **not** change GitHub Pages until the user explicitly approves release.
