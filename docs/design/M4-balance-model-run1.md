# Infinite Foundry — M4 Balance Model, Run 1

Status: first numerical baseline, not final tuning  
Date: 2026-08-27 JST

M3で固定した「約5分で初回の失敗を経験しやすい」「上手ければ初回突破も可能」「失敗後は明確に強くなる」「ランダム下振れだけでは詰まない」「×1/×2/×4はQoL」を、Workshop Eraの最小モデルへ落とした。

## 1. First-cycle target

初回Workshopは **300 game-seconds** を1周の最終期限とする。×1では5分、×2では2分30秒、×4では1分15秒。速度を変えても消費するgame-timeは同じ300秒であり、simulationの期待値を変えない。

中間Directive候補:

| game-time | Effective Throughput target | 意図 |
|---:|---:|---|
| 75s | 2.3/s | 最初のbottleneck解消を理解させる |
| 150s | 7.0/s | 全工程へ再投資させる |
| 225s | 16.0/s | cost growthとbalanceを体験させる |
| 300s | **35.0/s** | 初回最終Directive |

中間未達は即敗北にしない。最終300秒でのみ周回勝敗を確定する。

## 2. Workshop production model

最初のモデルでは SOURCE / PROCESS / TRANSFER / ASSEMBLY の4工程を使い、POWERは次のM4 runでsupport constraintとして追加する。これは最初から複雑化せず、まずbottleneck economy自体の成立を確認するため。

初期capacity:

- SOURCE: 1.20/s
- PROCESS: 1.00/s
- TRANSFER: 0.90/s
- ASSEMBLY: 0.80/s

`Effective Throughput = min(stage capacities)`

設備upgrade cost:

`cost(stage, level) = baseCost(stage) × 1.18^level`

baseCost:

- SOURCE 8
- PROCESS 9
- TRANSFER 10
- ASSEMBLY 11

upgrade後capacityは、各stageの基礎capacityへ `1.11^level` 系列の増分を積み上げる。現時点では最終ゲーム用の式ではなく、5分帯のcurve shapeを作るためのbaselineである。

開始資金は20 credits。Throughputと同率でcreditsが生成され、それを設備へ再投資する。

## 3. Deterministic reference simulation

`tools/balance/workshop_model.py` に、現在bottleneckを優先して設備を買うgreedy player modelを置いた。Random Moduleを完全に除外しているのが重要で、**基礎設備だけで勝ち筋が成立しなければならない**。

代表結果（300 game-seconds）:

### Passive / no permanent bonus

- 75s: 約2.49/s
- 150s: 約7.13/s
- 225s: 約16.45/s
- 300s: **約32.15/s**

最終35/sに対して約92%。合理的に投資するだけではわずかに届かない。このため初見では「惜しく失敗」が起きやすい。

### Active leverage

Overclock等の能動入力が周回全体で平均+8%前後の価値を生む場合、最終は約36.4/sまで上がる帯が得られた。+12%相当なら約41.1/s。

したがって初回はscripted failureにせず、**bottleneck判断とOverclockを上手く使ったプレイヤーは突破可能**、通常の受動寄りプレイは惜敗しやすい、というM3方針を実現できる余地がある。

## 4. Overclock Pulse baseline

連打支配を避けるため、クリック/tapの価値は以下を第一候補とする。

- cooldown: **12 game-seconds**
- duration: **4 game-seconds**
- 現在bottleneck工程capacity: **+30%**
- 連打によるstackなし
- cooldown中に押しても追加効果なし

単純な理論上限でも `4 / 12 × 30% = 10%` 程度の平均寄与であり、M3の「active advantageは概ね10〜20%以内」に収まる。さらに実ゲームでは次点bottleneckにぶつかるため、実効寄与は通常これより低い。

Overclockは資源を直接生成するボタンではなく、**いま何が詰まっているかを見て押すボタン**にする。

## 5. First prestige / Blueprint baseline

初回失敗で「5分失った」だけにしない。Salvage Blueprintは、最終到達率と中間Directive達成数を両方評価する。

第一候補:

`Blueprint = 2 + 2 × clearedIntermediates + floor(3 × sqrt(finalThroughput / finalTarget))`

finalThroughputはtarget比で1.0にcapしてよい。

現在のpassive referenceでは3中間を達成し、32.15/35 ≈ 0.92なので **約10 Blueprint** を得る。

Workshopの最初の恒久upgrade候補:

- Legacy Calibration I: 5 BP → 全Workshop基礎capacity +4%
- Legacy Calibration II: 5 BP → さらに +4%

合計+8%相当の恒久性能を与えたreferenceでは、passiveでも300秒時点で約39.3/sへ到達した。つまり**初回惜敗→設計データ回収→2周目は明確に突破しやすい**という導線が成立する。

これは最終値ではない。M4 run 2でBlueprintの選択肢を複数化し、「単純にglobal multiplierを買うだけ」が最適解にならないよう検証する。

## 6. Random Module fairness envelope

Moduleは勝利の必須条件にしない。Workshop第一候補:

- base drop interval: 平均42 game-seconds程度
- pity: 80 game-seconds連続でdropしなければ保証
- rarity: Common 70% / Refined 24% / Prototype 6%
- initial active slots: 2
- 未装備Moduleがあっても工場は停止しない

効果量の暫定帯:

- Common: 特定工程 +4〜8%
- Refined: 特定工程 +8〜15% または小さなsynergy
- Prototype: +18〜30%級の強い局所効果 + 小trade-off

ただしModuleなしbaselineでも、Overclockまたはprestige後の基礎性能で突破できる設計を維持する。

## 7. Speed invariance rule

実装時のsimulationはreal-timeではなく **game-time delta** を唯一の経済時間として使う。

`gameDelta = clampedRealDelta × speedMultiplier`

同じ300 game-secondsに対して、×1/×2/×4で設備cost、income、drop hazard、cooldown、Directive deadlineは同じ結果へ収束しなければならない。

Random dropはrender frameごとの抽選を禁止する。game-time基準hazardまたは「次drop game-time」をseeded PRNGで決める。これにより高fps・低fps・倍速で抽選回数が変化する事故を避ける。

## 8. Current conclusions

M3の中核条件は、少なくともWorkshopのfirst-pass modelでは同時成立可能と判断する。

1. 初回は5分で約92%まで届くため、理不尽な大敗ではなく「次なら行ける」惜敗を作れる。
2. Active Inputの価値を約10%以内へ抑えても上手い初回突破の余地がある。
3. 1回のprestigeでpassive突破帯へ入れるため、最初の損失体験を長く引きずらない。
4. Random Moduleをbaseline solvabilityから除外できる。
5. 速度はgame-timeベースで経済的に中立化できる。

## 9. Risks / M4 run 2

次runでは以下を必須検証する。

- Monte CarloでModule運・投資ミスを混ぜ、bad rollだけで詰まないことを確認。
- POWERをsupport constraintとして追加し、単純な「最小stageを買うだけ」から判断を一段深くする。
- Blueprintをglobal multiplier一択にせず、start capital / stage efficiency / automation / module slot等の選択肢へ分散。
- Blueprint報酬のsnowballと過剰farmを監査。
- Overclockを実際のbottleneck boostとしてmodel化し、平均寄与を測る。
- Workshop clear後からEra II以降へ要求曲線をつなぎ、各Eraの想定周回数と総プレイ時間を設計する。
- fixed timestep / accumulated delta / background tab挙動を含むruntime time modelをM6向けに明文化する。

M1〜M4で最低5 scheduled runを使うMission要件上も、**次runまではM4を継続し、本格実装へ進まない**。
