# M10–M15 — Post-release balance / progression rework

## Core diagnosis

公開版の人間プレイで、現行balanceは「1秒ごとに最適投資するbotには成立するが、人間に気持ちよいprogressionとは限らない」ことが明確になった。

本作で必要なのは反射神経や精密な最適化ではなく、**多少操作が遅れても数字が育ち、失敗しても次回は確実に強くなり、そのうち壁を越えられそうだと感じる進捗**である。

### Confirmed implementation issues

- `restart()` は `E.restart()` で新cycleを作るため内部speedは1へ戻るが、速度buttonのactive classを同期しない。よって「表示×4 / 実体×1」が起こる。再建時は×1固定のまま、UIも必ず×1へ同期する。
- STATUSは現在overlayを開くだけでtick停止条件に入らない。STATUS / LOADOUTはHELP同様にclock-halted planning spaceへ変更し、manual pause provenanceを保持する。
- Era first-clearでは現行1 Patentを一回だけ付与するが、成功画面にADVANCEとREBUILD CURRENT ERAが同居する。通常進行はCLEAR後one-way ADVANCEへ整理する。

## Product stance

### 1. Low decision density is acceptable

設備ごとに「ここをUPGRADEすればよい」が比較的明白でも問題としない。判断を増やすためだけに複雑なbuild puzzleを足さない。

ゲームの快感は、

`credits accumulate → upgrades become affordable → line throughput rises → retained strength accumulates → eventually the wall breaks`

という蓄積に置く。

### 2. Reaction speed is not difficulty

1 game-secごとにcurrent bottleneckへ即投資するbotは上限性能・破綻検出用に限定する。主balance oracleは、数秒〜十数秒単位で画面を見る人間を模したproxyにする。

Human proxyは、

- 7〜12 game-sec程度のjitter付き判断間隔
- その時点で貯まったCreditsをまとめて投資
- bottleneckは概ね追うが常時最速ではない
- Overclockはchargeを毎回最速消費しない
- Module手動最適化を序盤必須にしない

を基準候補とする。

さらに12〜20 game-sec程度のlow-attention proxyを置き、初心者余裕度を見る。

### 3. Short stages, convex retained-strength requirement

後半を難しくするためにdeadlineを長くしない。durationは現行300〜720 game-secから圧縮し、概ね数分の範囲へ収める。

Era difficultyは必要なretained strengthを凸状にする。

- Era 1: fresh state + ordinary attentive playでほぼ突破
- Era 2: Era 1 first-clear routeからそのまま突破可能
- Era 3: freshでは境界。初めて転生価値を感じる
- Era 4〜5: 数回のrebuild / retained progressを明確に要求
- Era 6〜7: 十分な長期progressを前提にする最終壁

## Prestige 2.0 proposal

現行Blueprintは「貯める → cost 6/8等の閾値に届く → 初めて強くなる」というchunky構造で、閾値未満の失敗runが前回とほぼ同じになりやすい。

これを二層に作り直す。

### Layer A — cumulative Foundry Memory / Knowledge

仮称。**非消費の累積値**で、meaningfulな各cycleから必ず増える。

- final targetへのprogress
- cleared checkpoints
- run中に蓄積したArchive / Research
- Era係数

から獲得量を決める。

Memory自体が小さなretained bonusへ連続的に効く。候補はall-capacity、starting credits等。式はsimulationでfitし、線形暴走を避ける。

重要なのは、meaningful failure後の次runで必ずbefore→after差が出ること。

### Layer B — Breakthrough thresholds

Memoryが一定値へ達すると大きな進歩を獲得する。

候補:

- Blueprint unlock / Blueprint Point
- Automation tier
- Module Bay
- larger starting-capital step
- new retained passive

これにより「毎runの小進捗」と「数runに一度の大進捗」を同時に作る。

PatentはEra first-clearの一回限りmilestone rewardとして別系統で残す方向を第一候補とする。

### Save migration

現行saveのunspent Blueprint、購入済みEfficiency / Capital / Automation / Module Bayを失わせない。

新schema導入時は、

- 所持BP
- 過去に購入へ使ったBP相当
- Patent / Patent upgrade
- completed Era

から新Memory / Breakthrough進捗へ公平に換算するmigration testを持つ。

## In-run action for future progression

低頻度の `RESEARCH / SALVAGE FOCUS` を第一候補とする。

目的は「このrunは厳しそう」と感じた時にも、現在runを将来progressへ変換できること。

初期案:

- OFF / FOCUSの単純toggle、または少数段階
- ON中はgenerated Creditsの一部をArchive Dataへdivertする
- current clearは少し難しくなる
- cycle終了時のMemory獲得が増える
- 画面上で `NEXT REBUILD +X MEMORY` のforecastを常時見せる

頻繁な切替やクリック連打を最適解にしない。割合・変換式はM11 simulationで決める。

## Status / Loadout behavior

STATUS / LOADOUTは安全なplanning spaceにする。

- running中に開いた場合だけauto-pause
- close時はSTATUSがpauseした場合だけresume
- manual pause中に開いて閉じてもmanual pause維持
- cycle ended時はresumeしない
- overlayに `CLOCK HALTED` を明示

Module UI:

- `STATUS` → `STATUS / LOADOUT`
- `BAY 1` → `EQUIP → BAY 1`
- occupied bayへは `SWAP → BAY N`
- current itemは `EQUIPPED · BAY N`
- previewは `LINE 42.1 → 45.7 /s (+8.6%)`
- negative manual swapは許可してもよいが警告表示
- auto-equipはwhole-line throughput悪化swapを引き続き拒否
- mobile/keyboardでbutton方式を主操作にし、drag & dropを必須にしない

## Era clear flow

CLEAR後に同じEraを再選択することを通常導線から外す。

- Failure: `REBUILD ERA N`
- Success Era 1〜6: `ADVANCE TO ERA N+1`
- first-clear rewardは `FIRST CLEAR // +1 PATENT` 等と明示
- 過去EraはEra rail / archiveで `CLEARED / ARCHIVED` と見える
- hidden replay routeは作らない

過去Era farmを前提にしないため、late difficultyはcurrent Eraでのrebuildとretained progressionだけで突破できるようfitする。

## Speed

再建は内部・UIとも必ず×1へ戻す。

×8はbalance救済ではなくfast-forward option。

公開gate:

- ×1/×2/×4/×8で同game-time outcomeが一致
- checkpoint evaluation skipなし
- Module spawn/pity skipなし
- Automation cadence skipなし
- Overclock recharge/duration破綻なし
- save/reloadでspeed state矛盾なし
- browser frame stall / input破綻なし

balanceは×8で最速操作できることを前提にしない。

## Milestones

### M10 — Human balance contract / correctness baseline

1. optimal 1s botをupper-bound扱いに変更
2. attentive human proxy（jitter 7〜12s）追加
3. low-attention proxy（12〜20s）追加
4. Era別first-attempt clear率、failure ratio、cycle数、操作回数をbaseline化
5. restart speed UI bug修正
6. STATUS pause provenanceをcontract化

### M11 — Prestige 2.0

1. Memory + Breakthrough二層progressionを数理設計
2. meaningful failure後に必ず小さなretained gain
3. 数runに一度のBreakthrough
4. Research / Salvage Focus実装
5. old save migration
6. result / rebuild before→after表示更新

### M12 — Era duration / convex difficulty

1. duration短縮
2. checkpoint / Module / Automation / Overclock timing一括再fit
3. Era 1〜2 first-attempt clearable
4. Era 3〜7 retained-strength requirementを凸化
5. RNG下振れstress
6. repeated rebuildで全seedが収束することを確認

### M13 — Loadout / Status / Era flow UX

1. STATUS auto-pause
2. Module EQUIP/SWAP discoverability
3. whole-line preview
4. one-way Era ADVANCE
5. first-clear reward説明
6. mobile / keyboard QA

### M14 — ×8 fast-forward

1. engine acceptance
2. save schema acceptance
3. interaction density確認
4. ×1/2/4/8 determinism stress

### M15 — Integrated playtest / release

1. simulationだけでなくbrowser相当の序盤・中盤rebuildを実操作
2. 「負けても次は強い」「数字が伸びてそのうち越せそう」を目視・操作で監査
3. exact full tests
4. 1440×1000 / 390×844 / 360×800 browser QA
5. screenshots / save migration / pause / speed regression監査
6. all PASS後のみmain / Pages release

## Acceptance direction

M10のbaseline後に閾値はfitするが、方向として以下を要求する。

- Era 1はattentive human proxyでseed依存の理不尽なfailureをほぼ排除
- Era 2もfailure prestigeを前提条件にしない
- Module最適swap、Overclock最速押下、秒単位のUPGRADE反応をEra 1〜2の必須条件にしない
- meaningful failure 1回ごとに次runの基礎strengthが必ず変わる
- midgameで同じ見た目のrunを何度も繰り返させず、小進捗forecastとBreakthrough残量を見せる
- late Eraはfresh-metaでは明確に壁、normal progressionでは複数rebuildで必ず近づく
- difficulty増加をrun時間増加で代替しない

## Release policy

通常開発は`develop`。数理testだけで公開判定しない。human-like simulation + browser interaction + exact render QAを通し、全gate PASS後のみ`main`へreleaseする。
