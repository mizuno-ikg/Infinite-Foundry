# M13 Loadout / Era-flow UX — run 1

Date: 2026-08-29 JST
Branch: `develop`

## Decision

M12 is treated as balance-fit complete for milestone purposes. The short Era durations, second-pass targets, retained-strength curve, human-like surrogate, human proxy telemetry contract, and source-level checks now agree on the intended direction. The container still cannot resolve `github.com`, so the formal multi-seed Node human-proxy run remains unavailable in this execution environment; that exact confirmation is retained as an M15 integrated gate rather than blocking all UX work.

No `main` / Pages changes are made.

## M13 goals in this pass

1. Make Module reassignment understandable without separate instructions.
2. Show the actual whole-line consequence before committing a Module move.
3. Make a successful Era flow one-way by default.
4. Remove the implication that old Eras need replay for first-clear rewards.
5. Preserve STATUS / LOADOUT as a clock-halted planning space and the M11 retained-progress before→after result.

## Implementation

### Loadout verbs

Inventory action buttons are rewritten according to the actual target state:

- empty target bay: `EQUIP → BAY N`
- occupied target bay, module already equipped elsewhere: `SWAP → BAY N`
- occupied target bay, module currently stored: `REPLACE → BAY N`
- current bay: `EQUIPPED · BAY N`

This matches `engine.js` semantics: moving an equipped module onto an occupied bay swaps the displaced module back into the source bay; moving a stored module onto an occupied bay replaces that bay.

### Whole-line throughput preview

For each actionable Module placement, the UI deep-clones the current state, applies `E.equipModule()` to the clone, and compares `E.throughput()` before and after. The action therefore shows:

`LINE 42.1 → 45.7 /s`

The preview evaluates the real bottleneck objective rather than the Module's isolated percentage. A placement that looks large locally but does not improve the line can therefore show a flat result.

### Era clear flow

When `E.canAdvanceEra(state)` is true after a win:

- primary button text becomes `ADVANCE TO ERA N`
- same-Era rebuild button is hidden
- result copy states that the cleared Era is archived
- past Era rail nodes display `ARCHIVED`

The final Era and failed-run rebuild paths remain available where forward advance does not exist.

### First-clear reward

If the result actually grants Patent(s), the result area adds:

`FIRST CLEAR REWARD // +N PATENT · ONE-TIME`

This is based on `r.patentsEarned`, so repeat clears cannot falsely claim the first-clear reward.

## Contract

Added `tests/m13-ux-contract.test.js` and included it in default `npm test`. The contract locks:

- explicit EQUIP / SWAP / REPLACE / EQUIPPED verbs
- whole-line before→after preview
- one-way ADVANCE when available
- hidden same-Era rebuild on successful forward flow
- one-time first-clear wording
- ARCHIVED past Era wording
- STATUS / LOADOUT clock-halt copy

## Verification limits

The GitHub connector commit diff was reviewed after write and shows only the intended M13 UX additions in `balance-m10.js`. The environment's direct DNS path to GitHub remains unavailable, so `npm test` cannot be executed from the container in this run. GitHub Actions were intentionally not used for iterative development. Exact full-suite and browser/render confirmation remain M15 gates.

## Next

Continue M13 with a browser-oriented layout/interaction audit when an executable browser path is available, especially 390px/360px widths for the expanded Module action buttons. If source inspection shows no further structural gap, proceed to M14 ×8 determinism and operation-density work without changing `main`.
