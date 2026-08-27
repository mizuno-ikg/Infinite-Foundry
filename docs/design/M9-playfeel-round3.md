# M9 — Playfeel improvement Round 3

## Goal

Round 1 reduced interaction friction and made Automation opt-in. Round 2 made retained power, Era transitions and Module decisions easier to read. Round 3 targets the two remaining high-value playfeel problems identified by playtest:

1. fast-forward should shorten waiting without multiplying compulsory human input,
2. within an Era, the factory should look increasingly energized as its numerical output grows.

The round deliberately avoids a broad economy rewrite.

## Research signals

Targeted review reinforced three principles:

- incremental games commonly transition repeated early actions into automation so attention can move to higher-level decisions;
- responsive feedback should confirm important actions, but strong feedback on constantly repeated events becomes noise;
- game feel improves when an action has an immediate, readable world reaction rather than only a number change.

Relevant current references reviewed for this round included Revolution Idle's automation/progression framing and GameJuice material on responsive UI feedback / game juice. Existing Agent-Continuum knowledge `interactive-ux-feedback-and-automation.md` remains the reusable design baseline.

## Implemented design

### 1. Overclock becomes a banked capacitor

The former Overclock behavior encouraged a cooldown chore: its 12 game-second cooldown meant that at ×4 the button could optimally demand attention roughly every three real seconds.

Round 3 changes the browser playfeel layer to a banked resource:

- maximum charges: **3**,
- initial charges: **1**,
- recharge: **1 charge / 40 game-seconds**,
- burst duration: **8 game-seconds**,
- effect remains the established **+30% current bottleneck** boost,
- a burst cannot be stacked while already active.

Because charges bank, the player does not lose the ability merely by failing to press the button immediately. At ×4, a new charge takes about ten real seconds, and up to three can be accumulated for a deliberate deadline push or investment gap.

The charge state is stored inside the cycle save state, so it survives an ordinary browser save/load but naturally resets on a new foundry cycle.

This is a playfeel wrapper around the existing pulse mechanic, preserving the core engine contract and Era 5 Thermal Bank extension.

### 2. Overclock communicates state instead of cooldown pressure

The control now shows:

- `0/3 ... 3/3 CHARGED`,
- three visible capacitor pips,
- time to the next charge,
- active burst time,
- stronger but short feedback while active.

HELP text explicitly says that charges can be banked and that the player is not expected to press on every recharge.

### 3. Within-Era output gains an ambient visual ramp

The factory scene now exposes a continuous output drive based on sustained Throughput versus the Final Directive. As the line approaches the target:

- background / grid energy becomes more visible,
- conveyor presentation brightens,
- the scene gains a restrained production glow.

This supplements the existing Era-specific large structures rather than replacing them.

### 4. Individual machines visibly mature

Each machine gains a small three-step physical-readiness indicator tied to its level band:

- tier 1: LV 3+
- tier 2: LV 7+
- tier 3: LV 12+

Higher tiers gain modestly stronger housing / icon treatment. This is intentionally subordinate to the actual bottleneck and Upgrade controls; it should read as factory maturity, not another currency.

### 5. Checkpoint CLEAR gets a one-shot factory confirmation

Successful checkpoints are important progress events, so CLEAR now produces a brief `CHECKPOINT SECURED` confirmation on the factory scene. MISS does not receive an equally celebratory treatment. The effect is one-shot and honors reduced-motion settings.

## Why this is preferable to simply lengthening the cooldown

A longer cooldown alone still creates a `press whenever READY` optimization pattern. Banking changes the decision structure: delaying input no longer immediately forfeits value, and several charges can be reserved for a moment the player considers important.

This directly addresses the measured interaction-density issue without turning Overclock into passive automation.

## QA additions

- pure playfeel logic test covers capacitor initialization, consumption, recharge and max-bank behavior;
- Round 3 contract test verifies loader wiring and required visual / capacitor hooks;
- existing progression tests remain in the suite because the core engine economy has not been rewritten.

Exact desktop/mobile rendered interaction verification is still required before release. Current development policy keeps Actions and Pages deployment out of the ordinary iteration loop.

## Next observation targets

1. Does banked Overclock feel like a tactical reserve rather than another resource to babysit?
2. Is 40 game-seconds / 3-charge bank generous enough at ×4 without becoming irrelevant?
3. Do machine maturity and output-drive effects read clearly without obscuring bottleneck information?
4. Is checkpoint confirmation satisfying but infrequent enough to avoid visual noise?
5. After Round 1–3 together, what remains of repetitive manual upgrade pressure before Automation unlocks?
6. Does mobile still have sufficient room around direct Upgrade controls, growth indicators and the Overclock pips?
