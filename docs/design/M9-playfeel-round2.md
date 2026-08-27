# M9 — Playfeel improvement Round 2

## Goal

Round 1 reduced interaction friction. Round 2 makes progression **felt**, not merely stored in state: rebuilding should visibly demonstrate retained power, entering a new Era should feel like entering a new production domain, Module choices should preview their line-level effect, and an Upgrade should produce a readable reaction in the factory itself.

The numeric campaign balance is intentionally unchanged in this round. The focus is presentation, comprehension and perceived agency.

## Research signals

This round used targeted references rather than reopening the broad M1 survey.

- Game Developer's interaction/game-feel discussions emphasize immediate, readable feedback and the anticipation → action → reaction pattern: a player action should visibly cause something in the world, not only change a number.
- Recent DICE/Battlefield 6 game-feel discussion similarly stresses function-first visual language and readable feedback.
- Existing Agent-Continuum knowledge `interactive-ux-feedback-and-automation.md` recommends before → after progression feedback, re-briefing at major phase transitions, objective-level previews for automated/equipment choices, and explicit time control.

These support four concrete changes below.

## Implemented design

### 1. Retained knowledge is shown as an advantage, not an inventory

The result panel now gains a `NEXT FOUNDRY // RETAINED ADVANTAGE` block showing base → retained effects for:

- starting Credits,
- all-stage capacity,
- Module Bays,
- Automation delegation.

This complements the compact retained summary with an explicit before → after explanation.

After a same-Era rebuild, a short non-modal `REBUILD COMPLETE` banner confirms that retained knowledge is online without forcing the player through a repeated modal every cycle.

### 2. Era transitions become chapter transitions

`ASCEND TO NEXT ERA` now leads into a dedicated Era briefing before production resumes. The production clock is halted while the briefing is open.

The briefing presents:

- new Era / production domain,
- focus,
- final Directive and deadline,
- new Domain Protocol,
- retained knowledge carried into the Era.

The player explicitly presses `BEGIN ERA`. This is deliberately limited to major Era transitions, not ordinary rebuilds.

### 3. Module assignment previews line impact

In STATUS / LOADOUT, available Bay actions are decorated with their projected whole-line Throughput change. This uses a cloned game state and the actual equipment / Throughput logic rather than a local rarity or multiplier heuristic.

Examples:

- `BAY 1 · +1.2/s`
- `BAY 2 · line same`
- a negative placement is visually marked as such.

This extends Round 1's automatic-loadout guard to manual decision support.

### 4. Upgrade action gets a factory reaction

Direct machine Upgrade already removed the select → remote-button interaction. Round 2 adds a short reaction:

- upgraded machine flashes / lifts,
- the production line brightens briefly,
- the top Throughput status reacts when the purchase actually increases whole-line output.

The effect is short, state-linked, and disabled under `prefers-reduced-motion` where appropriate. It is not intended as decorative noise on every frame.

## QA / regression additions

Pure playfeel logic tests now cover:

- Module placement preview using the actual Throughput objective,
- retained-knowledge summary values,
- existing opt-in Automation policy,
- existing auto Module swap guard.

Browser QA contract is extended to cover the Round 2 UI in the next verification pass: retained advantage rendering, Module preview labels, Era briefing clock halt / begin flow, and the existing direct-upgrade / pause / status flows.

## Known verification limit

The current ChatGPT execution environment cannot directly navigate a locally reconstructed build in Chromium and outbound git clone is blocked. Therefore this run treats source review + pure logic coverage as evidence, not as an exact-render pass. The existing browser harness remains the intended exact-artifact verification path when a usable browser execution route is available.

## Next observation targets

After Round 2 is verified visually, the next playtest should concentrate on:

1. whether the direct Upgrade reaction feels informative or noisy,
2. whether rebuild progression is now obvious without being repetitive,
3. whether Era briefing creates a satisfying chapter transition,
4. whether Module preview changes player decisions,
5. remaining real-time click / decision density at ×4,
6. whether Overclock still behaves like a cooldown chore rather than a meaningful timed decision,
7. whether factory growth within an Era visually keeps pace with numerical growth.
