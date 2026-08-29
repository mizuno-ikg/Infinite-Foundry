# M15 Publication Acceptance Audit

Date: 2026-08-29
Branch audited: `develop`
Final audited head: `8374b6403690ba3889c7c3227bac37481d639c11`
Public branch during audit: `main` unchanged

## Verdict

**PASS — release candidate is technically acceptable for publication, subject to the user's explicit final approval.**

This audit was deliberately adversarial rather than a repetition of the implementation report. It re-read the current Work Plane, compared `main...develop`, inspected the actual source paths around Prestige / Research / speed / save / browser startup, re-ran release-grade exact QA, and re-inspected fresh render evidence.

`develop` is fast-forward compatible with `main`: **95 commits ahead / 0 behind** at the end of the audit. No `main` or Pages mutation was performed.

## Independent findings and repairs

### 1. Research Focus could let Automation spend resources before the 18% research diversion

The previous wrapper advanced the base engine first and subtracted the whole Research Focus diversion afterward. Because Automation runs inside each fixed engine step, it could observe and spend credits that were conceptually already committed to research. A sufficiently large `advance()` call could therefore differ from many small calls and, in edge cases, produce Research while failing to pay the full intended current-run opportunity cost.

Repair:

- Added `RESEARCH_DIVERSION_RATE = 0.18` as the single Prestige contract.
- While Focus is active, advance in fixed `STEP` increments.
- Reserve the exact 18% production share **before** each step's Automation decision.
- Accumulate Research from the actual output produced by that same step.
- Added a regression proving Focus + Automation is invariant between one 60 game-sec advance and 1200 × 0.05-sec advances for levels, credits, Research Data, and RNG.

The first exact acceptance run correctly caught a regression introduced while replacing the wrapper: natural cycle-end Memory awarding had accidentally been omitted. That automatic `awardMemory()` transition was restored for both Focus and non-Focus routes. The next exact gate passed the human retained-progress contract.

### 2. Removed ×8 had two different saved-speed normalization stories

The shipping product no longer exposes ×8, but the late browser compatibility layer still claimed an experimental ×8 save would become ×4. Initial app save loading happens before that layer is installed, while `engine.deserialize()` already normalizes unsupported speeds to ×1. The code comment/test therefore promised behavior that the real startup path did not provide.

Repair:

- Keep one owner for invalid-speed normalization: `engine.deserialize()`.
- Unsupported / experimental saved speeds normalize to the safe ×1 baseline.
- Browser M14 layer now only removes stale cached ×8 controls and synchronizes the ×1/×2/×4 UI.
- Contract explicitly rejects a second browser-only ×8 migration rule.

This does not remove any previously published user feature: ×8 existed only during `develop` experimentation and was rejected before release.

### 3. Shortened Era 1 showed a rounded, incorrect intro deadline

Era 1 is now 150 game-sec, but the intro used `Math.round(duration / 60) + ':00'`, displaying `3:00` while the actual clock was `2:30`.

Repair:

- Shipping layer formats the actual duration as `m:ss`.
- Fresh browser evidence now displays `DEADLINE 2:30 AT ×1`.
- Source contract fixes shortened Era deadline precision.

## Final exact acceptance gate

GitHub Actions release-only gate:

- Run: `33236020212`
- Head: `8374b6403690ba3889c7c3227bac37481d639c11`
- Job: `release-candidate`
- Result: **SUCCESS**
- Node: `22.23.2`

All `tests/*.test.js` passed, including:

- base engine and Era progression
- M10 balance / early salvage
- human-like balance contract
- M13 UX contract
- M14 fixed-step determinism / operation density / speed gate
- M15 integrated retained-progress / save / corrupt-save contract
- Prestige 2.0 and the new Research Focus + Automation chunk-invariance regression
- progression upper-bound sanity
- visual contracts

Upper-bound progression sanity remained stable: 24 seeds, 100% finish, cycle p50/p90/max = `15 / 16 / 18`, attempt medians = `1/1/1/1/1/3/6`. Product balance remains governed by the attentive / relaxed human-like contracts rather than this perfect-invest route.

## Browser / render acceptance

`npm run qa:release` passed on the final audited head for:

- desktop `1440×1000`
- mobile `390×844`
- narrow mobile `360×800`

Coverage includes Era 1 / 4 / 7, intro, interaction UX, and corrupt save recovery.

Mobile geometry for all sampled Eras:

- stage overlap: `0`
- POWER/stage overlap: `0`
- label/POWER overlap: `0`
- scene horizontal overflow: `0`
- direct upgrade touch target: `44px`
- scene remains inside its container

Fresh render artifact:

- name: `m15-browser-render-evidence`
- artifact id: `9709950477`
- zip sha256: `6037d0a759a4bb56276b6af1cd0708af9df47541398e3d38dddaa4bdd10719a1`
- 15 screenshots + report

The fresh screenshots were visually re-inspected after all audit fixes. No release-blocking clipping, overlap, horizontal layout breakage, unreadable primary hierarchy, or Era visual regression was found. The corrected Era 1 intro visibly reads `DEADLINE 2:30 AT ×1` on mobile as well.

## Save / migration / progression acceptance

The final candidate preserves these contracts:

- existing Blueprint / purchased-upgrade saves migrate into Foundry Memory without deleting legacy assets
- meaningful full runs automatically award non-decreasing Memory
- meaningful partial SALVAGE can bank current earned progress
- immediate abort / micro-focus restart cannot farm minimum Memory
- Memory improves next-run Starting Credits continuously
- Breakthrough floors occur at 12 / 30 / 60 / 110 / 130 Memory
- Research Focus costs 18% of produced value before Automation can spend that share
- Research-derived Memory is capped so Focus is optional salvage strategy, not mandatory progression engine
- corrupt / future-version save fails closed
- rebuild returns simulation speed and UI to ×1
- shipping speed controls are ×1 / ×2 / ×4 only
- hidden-tab time does not create offline progress

## Publication-path audit

Repository workflows at final audit:

- general `ci.yml`: manual `workflow_dispatch` only
- release-candidate QA: one-shot path-triggered M15 gate
- `pages.yml`: triggers on push to `main` and deploys the static site

Therefore a final approved `develop → main` fast-forward will trigger one GitHub Pages deployment workflow. This is release-time Actions usage, not iterative CI usage.

## Residual non-blocking notes

- The Help modal is not an exhaustive manual for every M11 mechanic; Foundry Memory, Research Focus, and SALVAGE are primarily explained through live controls, STATUS/result before→after displays, confirmation text, and system log. This is a documentation-polish opportunity, not a correctness or release blocker.
- Actions currently emits a platform warning that older action releases target Node 20 and are being forced onto Node 24 by the runner. The workflow itself explicitly tests the game on Node 22 and succeeds. This is tooling maintenance, not a game runtime blocker.
- The container's direct `github.com` DNS route remains unreliable; the final release-grade evidence comes from the GitHub-hosted exact gate and browser artifact instead.

## Release boundary

No automatic publication is authorized by this PASS.

Per the user's fixed release policy:

1. keep `main` / Pages unchanged now;
2. report the acceptance result to the user;
3. only after explicit user approval, fast-forward `main` to the audited `develop` head (or a later re-audited head);
4. confirm the resulting Pages deployment and live URL after publication.

Any code change after this audited head invalidates the exact-artifact identity and requires an appropriate re-check before release.
