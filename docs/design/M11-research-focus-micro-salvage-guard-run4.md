# M11 — Research Focus micro-salvage guard (run 4)

## Context

Run 41 changed Research Focus from elapsed-clock accumulation to production-scaled accumulation. A follow-up source audit found a second exploit path in the interaction between Research Focus and early salvage.

Before this correction, `meaningful(state)` treated any `researchData > 0` as sufficient for a meaningful run. Because Research Focus generates a positive (though tiny) amount of Research Data as soon as any production occurs, a player could theoretically repeat:

1. start a fresh run,
2. enable Research Focus,
3. advance only a tiny amount of game time,
4. SALVAGE / REBUILD EARLY,
5. receive the minimum 1 Foundry Memory award.

This bypassed the intended anti-farm rule even though the Research Data itself was production-scaled.

## Correction

`prestige-m11.js` now defines:

```text
RESEARCH_MEANINGFUL_THRESHOLD = 0.25 Research Data
```

Research alone counts as a meaningful-run signal only after reaching that floor. The other meaningful signals remain unchanged:

- elapsed time >= 8% of Era duration,
- sustained final-target ratio >= 5%,
- at least one cleared checkpoint.

This keeps early salvage useful for runs with real progress while preventing a Focus-toggle + micro-tick loop from manufacturing the base Memory award.

The threshold is deliberately lower than one whole Research unit. Strong runs that truly divert meaningful production can still qualify through research before the normal elapsed-time gate, while weak fresh runs cannot qualify from a token amount of production.

## Contract added

`tests/prestige-m11-contract.test.js` now fixes the exploit directly:

- enable Research Focus on a fresh run,
- advance 0.05 game-sec,
- verify Research Data is positive,
- verify it remains below the meaningful research floor,
- verify early `awardMemory(..., {aborted:true})` returns 0.

Existing contracts remain: immediate abort = 0, a 30-second meaningful partial run earns at least 1 Memory, Memory award is idempotent, production-scaled research beats elapsed-clock farming, Breakthrough floors work, and legacy assets migrate into non-zero Memory.

## Verification status

The Work Plane source and contract were updated on `develop`. The Chat execution container still cannot resolve `github.com`, so local Node execution remains unavailable in this run. GitHub Actions were not used as an iterative test runner per Mission policy. Source-level inspection confirms the exploit condition and that the new predicate closes it without changing the other meaningful-run branches.

M11 remains open because the human-proxy numerical fit is still pending. No Era target/duration rework was mixed into this change; that remains M12 scope.
