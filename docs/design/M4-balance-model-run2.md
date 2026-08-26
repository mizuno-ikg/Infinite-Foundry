# Infinite Foundry — M4 Balance Model, Run 2

Status: M4 baseline frozen for prototype; final tuning remains M8 work  
Date: 2026-08-27 JST

このrunでは、M4 run 1のdeterministic greedy baselineを監査し、POWER、ランダムModule、投資ミス、Overclock、prestige選択を含むMonte Carloへ拡張した。結果としてrun 1のgreedy方策に「現在Throughputへ寄与しないupgradeまで買う」という欠陥が見つかったため、初回最終targetを35/sから**52/s sustained**へ再校正した。

## 1. Workshop first-cycle contract

Workshopの初回最終期限は引き続き **300 game-seconds**。

- ×1: 5分
- ×2: 2分30秒
- ×4: 1分15秒

ただし勝敗判定はdeadline瞬間の一発値ではなく、最後の**30 game-secondsの平均Effective Throughput**を使う。これにより、deadline直前だけOverclockを合わせるcheeseを避けつつ、能動操作の寄与は残せる。

Directive baseline:

| game-time | sustained / effective target | purpose |
|---:|---:|---|
| 75s | 4/s | 最初の律速工程を理解する |
| 150s | 14/s | POWERを含む全体balanceへ気づく |
| 225s | 30/s | Moduleと再投資でbuild差が出る |
| 300s | **52/s sustained** | first final Directive |

中間未達は即敗北にしない。周回は常に300 game-secondsまで続く。

## 2. Production model v2

Workshopは5つのcapacityを持つ。

`SOURCE -> PROCESS -> TRANSFER -> ASSEMBLY`

これらを **POWER** がsupportする。

`Effective Throughput = min(SOURCE, PROCESS, TRANSFER, ASSEMBLY, POWER)`

stage economyはrun 1を継承:

- base capacities: SOURCE 1.20 / PROCESS 1.00 / TRANSFER 0.90 / ASSEMBLY 0.80
- base upgrade costs: 8 / 9 / 10 / 11 credits
- stage cost growth: 1.18
- stage capacity growth: 1.11
- starting credits: 20

POWER baseline:

- base capacity: 6
- base upgrade cost: 10
- cost growth: 1.20
- capacity growth: 1.18

POWERは序盤から常時主役にせず、中盤以降に時々律速へ入り、単純な4工程の横並びupgradeから判断を一段深くするsupport constraintとして扱う。

## 3. Run-1 model flaw and correction

run 1のgreedy modelは「affordableなupgradeがあれば必ず何か買う」ため、現在bottleneckを改善しないupgradeも購入していた。これは合理的プレイヤーを過度に弱く評価する。

run 2では基本方策を変更した。

1. 現在capacityが最小の工程/POWERを特定する。
2. それが買えるなら購入する。
3. 買えないなら、別のzero-immediate-value upgradeへ散財せず貯める。
4. novice modelのみ一定確率でaffordableな別upgradeを買う。

この修正後、旧35/s targetは合理的初回プレイに対して低すぎたため52/sへ再校正した。

## 4. Monte Carlo model

`tools/balance/workshop_model.py` をseeded Monte Carloへ拡張した。各runは300 game-seconds、終盤30秒のsustained Throughputで評価する。

Random Module:

- mean interval: 42 game-seconds
- hard pity: 80 game-seconds
- Common 70%: +4〜8%
- Refined 24%: +8〜15%
- Prototype 6%: +18〜30%
- stage targetはSOURCE/PROCESS/TRANSFER/ASSEMBLYからrandom
- active slots: 2
- modelでは最も大きい2件を自動装備する

Module取得/装備でsimulationは停止しない。実ゲームではplayer loadoutを追加してよいが、未選択でもauto-equipで進むことをbaselineにする。

Overclock:

- cooldown 12 game-sec
- duration 4 game-sec
- current bottleneck +30%
- stackなし
- game-time eventとして処理

500 seedsのprototype Monte Carloで得た代表分布:

| scenario | clear rate @52/s | p05 | median | p95 |
|---|---:|---:|---:|---:|
| ordinary first run: mistake 30%, Overclock use 15%, Moduleあり | **34.4%** | 43.0 | 50.3 | 57.0 |
| skilled first run: mistake 3%, Overclock use 85%, **Moduleなし** | **45.6%** | 49.9 | 52.0 | 52.7 |
| ordinary after permanent +8% | **95.8%** | 52.5 | 61.0 | 67.1 |
| ordinary with +10 starting credits | **68.4%** | 47.6 | 53.8 | 60.5 |

これはskill modelの厳密なプレイヤー予測ではなく、設計条件のstress testである。それでも狙いは成立している。

- 普通の初見では失敗が多数派だが、medianはtarget直下で惜敗しやすい。
- skilled + no Moduleでも初回突破可能で、random dropを勝利必須にはしていない。
- 最初の有用prestige後は普通の方策でもほぼ突破帯へ入る。
- starting credits型のprestigeも意味を持ち、global multiplierだけが唯一の価値ではない。

## 5. Blueprint economy v2

Salvage Blueprint報酬は次をbaselineとする。

`BP = 2 + 2 * clearedIntermediates + floor(3 * sqrt(min(finalRatio, 1)))`

finalRatio = sustained final Throughput / target。

初回惜敗で3中間を突破していれば概ね10 BPを得る。

Workshop初期Blueprint候補:

### Calibration
- cost 5 BP
- Workshopの全基礎capacity +4%
- 2段階まで

### Seed Capital
- cost 5 BP
- 周回開始credits +10
- 2段階まで

### Line Memory
- cost 6 BP
- 既知の最安upgradeを自動購入候補として強調し、誤操作を減らすQoL/automation unlock
- raw multiplierは与えない

### Module Rack
- cost 8 BP
- active Module slot +1
- Workshop clear後、次Eraへ進んでから購入候補に出す

### Persistent Diagnostics
- cost 4 BP
- bottleneck history / forecast UIを恒久解禁
- raw multiplierなし

初回約10 BPでは、たとえばCalibration×2で+8%、Calibration+Seed Capital、Seed Capital×2など複数の明確な前進を選べる。Monte Carloでは+8%がclear rate約96%、+10 start credits単独でも約68%まで上がるため、「必ず同じ二つを取らないと進まない」状態を避けられる余地がある。

M8では各upgradeの実プレイ価値を再測定し、dominant choiceがあれば価格/効果を調整する。

## 6. Anti-prestige-farm safeguards

失敗を繰り返すだけの最適化を避ける。

1. finalRatioは1.0でcapし、同一Directiveで過剰生産してもfailure rewardが無限増加しない。
2. Intermediate報酬は各checkpoint初回達成分のみ。
3. Era final Directiveを成功した周回では、failure salvageではなくclear reward / Patent progressionへ移行する。
4. 同一Eraをclear後に周回する場合、Blueprint gainへsoft diminishing returnを入れる候補をM7/M8で検証する。
5. 最適戦略を「わざと負ける」にしない。次Era進行・Patent・新機能の価値をBlueprint farmより高くする。

## 7. Patent and Era progression

BlueprintはEra内/近傍の恒久改善、Patentは大きな文明進行とする。

- Era final Directive初回clearでPatentを獲得。
- Patentは次Era、automation、visual layer、story progressionを解禁する。
- Patentをrandom dropにはしない。
- 既知Eraの基本automation/QoLは保持し、「再び手で同じ学習をする」負担を減らす。

V1 pacing envelope:

| Era | first final deadline | expected learning cycles before first clear | visual scale |
|---|---:|---:|---|
| I Workshop | 300s | 1〜2 | single workshop |
| II Automated Factory | 360s | 1〜3 | factory floor |
| III Industrial City | 420s | 1〜3 | district/city |
| IV Planetary Foundry | 480s | 2〜3 | planet |
| V Stellar Forge | 540s | 2〜4 | star system |
| VI Law Foundry | 600s | 2〜4 | spacetime / laws |
| VII Universe Foundry | 720s | 2〜5 | universe fabrication |

これは内容量とUI prototype前の**pacing envelope**であり、絶対Throughput targetは各Eraの固有mechanicが決まってからM7/M8で最終化する。重要なのは、deadlineを単純に何時間へも伸ばして待たせないこと。後半の長さは新しい判断・自動化・visual transformationで作る。

上記中央値で、本編はx1換算game-timeでは概ね90〜150分程度のactive simulationを持ち、実際の人間プレイはupgrade/inspection/build選択/演出でそれ以上になる。×2/×4を使う熟練者は再周回を大幅に圧縮できる。

## 8. Runtime time model for M6

速度とオフライン抜け道を壊さないため、実装時は次を守る。

### Canonical time

- 経済・Directive・cooldown・random hazardの唯一の時間は `gameTime`。
- `speedMultiplier` は 1 / 2 / 4。
- render animation timeとeconomic timeを分ける。

### Fixed simulation

候補:

- fixed game step: 50ms程度
- `accumulator += clampedVisibleRealDelta * speedMultiplier`
- accumulatorからfixed stepを消費してsimulationを進める
- renderは別frameで補間してよい

### Hidden / closed behavior

- `document.visibilityState === 'hidden'` へ入った時点でsimulation advanceを停止する。
- visible復帰時はhidden中のwall-clock deltaを**捨てる**。
- local saveにはlast wall-clock timestampを保存しても、offline earnings計算には使わない。
- reload/再訪問時も閉じていた時間をcatch-upしない。

これにより「負けそうなら閉じると生産だけ進む」「background tab throttlingで締切だけ進む」といった抜け道を防ぐ。

### Deterministic random events

- render frameごとのrandom rollは禁止。
- seeded PRNG + next event game-timeを使う。
- Module pity、Overclock cooldown、Directive deadlineはすべてgame-time timestampで管理する。

## 9. M4 exit decision

M4で必要だった主要な成立性は確認できた。

- 初回5分のfailure-majority + near miss
- skilled first-clear path
- Random Module非必須
- prestige後の明確な前進
- POWER support bottleneck
- Blueprint複線化
- prestige farm抑制方針
- ×1/×2/×4の経済中立ルール
- no-offline-progress runtime rule
- 7 Eraのdeadline / cycle envelope

したがってM1〜M4最低5run条件も満たし、**次runからM5 Visual / UX prototypeへ進める**。

数値は最終値ではない。M5/M6では画面と実操作に落とし、M8で実プレイを根拠に再調整する。M4の目的は「数学を永久固定すること」ではなく、「面白さの仮説が数理的に同時成立し、実装へ進んでも致命的な構造破綻がないこと」を確認することである。
