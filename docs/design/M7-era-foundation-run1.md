# Infinite Foundry — M6 Exit QA / M7 Era Foundation

Status: M6 exit accepted; M7 active  
Date: 2026-08-27 JST

## M6 browser-level exit QA

M6のNode/数理テストだけではなく、現行sourceをChromium rendererへ投入し、実DOM操作・renderを使った縦切りQAを行った。

検証した流れ:

1. Workshop Cycle 1をdeadline直前状態から実simulationで完了させる。
2. Prestige panelの表示とDirective failure / salvage表示を確認する。
3. BlueprintでStarting Capitalを購入する。
4. `DISMANTLE & BEGIN NEXT CYCLE` を実クリックしCycle 2へ再建する。
5. 実engineのserialize / deserializeを通してCycle 2を復元する。
6. Module recoveryとAutomation Memoryが同一稼働中に発生する状態を作り、non-modal event logへ両方が出ることを確認する。
7. desktop / mobile viewportでhorizontal overflowとprestige layoutを確認する。

結果:

- prestige panel: 正常表示
- Blueprint購入: 正常
- Cycle 2 restart: 正常
- save / deserialize restore: 正常
- Module event: 正常
- Automation Memory event: 正常
- Chromium runtime exception: 0
- desktop horizontal overflow: 0
- mobile 390px horizontal overflow: 0
- mobile prestige grid: 1 columnへcollapse

実行環境の組織ポリシーが localhost / file URL navigationを遮断したため、QAではGitHub上の現行HTML/CSS/JSと同一sourceをabout:blank rendererへ直接注入した。production sourceへQA専用hookは保存していない。したがってこれはGitHub Pages配信そのものの検証ではないが、M6が要求したbrowser adapter / DOM / layout / interactionのexit QAとして扱う。公開実体の最終検証はM9で改めて行う。

## M6 Exit Decision

M6の主要基盤契約を満たしたため、M7へ移行する。

- fixed-step simulation
- ×1 / ×2 / ×4のsimulation安定性
- no-offline / hidden pause
- M4 Workshop economyへのruntime整合
- non-modal seeded Module
- Overclock
- Directive / sustained evaluation
- failure salvage / Blueprint / rebuild
- Automation Memory
- versioned save migration
- desktop/mobile responsive interaction

## M7 Era Foundation

Version 1.0全編を一つの巨大な条件分岐へせず、engineに7 Eraの正規metadataを追加した。

| Era | Name | Site | Planned game-time horizon | Primary focus |
| --- | --- | --- | ---: | --- |
| I | Workshop | Ember Bay | 300s | Foundational bottlenecks |
| II | Automated Factory | Servo District | 360s | Power, automation, module builds |
| III | Industrial City | Iron Meridian | 420s | District logistics |
| IV | Planetary Foundry | Atlas Crustworks | 480s | Continental supply and orbit |
| V | Stellar Forge | Helios Crown | 540s | Energy capture and thermal stability |
| VI | Law Foundry | Causality Lattice | 600s | Interdependent physical constants |
| VII | Universe Foundry | Genesis Frame | 720s | Final integration and universe ignition |

これは現時点では**全Eraの経済実装完了を意味しない**。M7のprogression/contentを安全に載せるためのdata contractである。

### Save schema v3

Metaへ以下を追加した。

- `era`
- `highestEra`
- `patents`
- `completedEras`

旧v1/v2 saveはWorkshop / Patent 0 / completionなしへnormalizeされ、既存progressを捨てない。unknown future version rejectは維持する。

### UI contract

現在Era metadataからheaderとFoundry site名をrenderするようにした。

- `WORKSHOP // DIRECTIVE 001`
- `Foundry-01 / Ember Bay`

今後Era transitionを実装したとき、同じUI contractからServo District / Iron Meridian等へ変化させられる。

## Next M7 Slice

次の最大仕事はmetadataだけでなく、**実際のEra progression**を作ること。

優先順:

1. Workshop first-clear / Era completion条件とPatent付与。
2. Era transitionをprestige/rebuildと矛盾しない形で実装。
3. Era II Automated Factoryの独自Directive/economy/visual stateを実装。
4. WorkshopのM4 balanceを壊さず、旧Eraの既知操作をAutomationへ吸収する。
5. そのdata-driven patternをIII〜VIIへ展開する。

M7では単に要求数値だけを変えるのではなく、各Eraで主に考えるbottleneckと画面上の成長が変わることを受け入れ条件とする。
