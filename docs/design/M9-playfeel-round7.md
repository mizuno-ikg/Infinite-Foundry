# M9 — Playfeel Round 7: mobile factory geometry

## Problem

Round 6 separated the direct UPGRADE control from machine identity vertically, but the phone layout still inherited the desktop idea of four production stages separated by three full belt columns in one horizontal row.

At roughly 360–390 CSS px, preserving three 52px belt columns leaves too little horizontal room for four machine cards. A 44px-high button can still be a poor touch target if the whole machine card becomes extremely narrow. The result also weakens the intended visual identity of each factory stage.

## Decision

On phone widths only, preserve the production sequence while changing its spatial representation:

- SOURCE / PROCESS / TRANSFER / ASSEMBLY become a 2 × 2 machine grid.
- Full-width belt columns are hidden on phone widths.
- Compact directional connectors (`→`, `↓`, `→`) retain the production-path reading order without consuming card width.
- The direct UPGRADE strip keeps both a minimum 44px height (Round 6) and now a minimum 44px width.
- Machine names and throughput regain readable width; the narrow-phone typography fallback remains but no longer has to compensate for four crushed columns.
- POWER stays in the upper-right independent support position.
- The bottleneck/factory label reserves explicit horizontal space for POWER.

Desktop layout is unchanged.

## Why not horizontal scrolling

A horizontally scrollable production line would preserve the literal belt, but it would make the current bottleneck and multiple upgrade choices leave the viewport. For a deadline/bottleneck game, seeing the major production stages together is more important than preserving a literal single-row conveyor on a phone.

## Browser geometry gate

The browser smoke harness now checks mobile geometry on Era 1 / 4 / 7 and adds a 360 × 800 narrow-phone viewport. It asserts:

- exactly four production-stage cards and four direct upgrade controls;
- production cards are at least 120px wide and 130px high;
- direct upgrade targets are at least 44 × 44 CSS px;
- production cards do not overlap each other;
- POWER does not overlap production stages;
- the bottleneck label does not materially overlap POWER;
- the factory scene has no horizontal overflow;
- production cards remain inside factory-scene bounds.

This is not a substitute for visual inspection, but it converts the highest-risk mobile geometry failures into an executable release gate once the exact develop artifact can be run in Chromium.

## Validation status

Source/contract validation is wired into the default `npm test` chain through `tests/playfeel-round7-contract.test.js`. The exact develop artifact still cannot be reconstructed in the current execution container because outbound GitHub DNS resolution is unavailable, so Chromium screenshot inspection remains an explicit release gate rather than a claimed result.

## Scope

This round intentionally does not alter economy, progression, automation policy, Module math, or desktop factory layout. It is a playfeel/readability correction for phone interaction density.
