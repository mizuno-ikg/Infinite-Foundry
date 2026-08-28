# M10 — Post-release balance rework plan

## Why this iteration exists

2026-08-28の公開版実プレイで、次の問題が確認された。

1. ゲームオーバー時、とくに序盤の恒久進行が小さく、失敗後の「次は明確に強くなった」という感覚が弱い。
2. Era 1〜2まで初回から厳しすぎる。序盤は正しくボトルネック投資をしていれば、失敗周回を必須にせずテンポ良く進めたい。
3. 難易度は平坦ではなく後半ほど急になるべき。後半はそれまでに蓄積したBlueprint / Patent / Automation / Module Bay等を前提にし、複数回の転生を経て突破する設計を狙う。
4. 1ステージ5分は長く感じる。待ち時間を難易度にせず、必要なら×8までfast-forward可能にしたい。
5. Moduleの手動付け替え機能自体は存在するが、STATUS内の「BAY 1 / BAY 2」ボタンでは装備操作だと発見しづらい。

## Current-state diagnosis

### 1. Duration is fighting the desired difficulty curve

現行Era durationは300 / 360 / 420 / 480 / 540 / 600 / 720 game-sec。後半ほどTargetが高い一方で、攻略時間も5分→12分へ増えている。

本作の原則は「待つことを難易度にしない」なので、後半の難しさは長い待ち時間ではなく、必要な恒久強化・投資判断・buildへ寄せる。

### 2. Target curve is not sufficiently convex after normalization

engineのeraScaleは `2.45^(era-1)`。final targetをこのscaleで割ると概ね次になる。

- Era 1: 52.0
- Era 2: 126.5
- Era 3: 149.9
- Era 4: 217.6
- Era 5: 319.2
- Era 6: 322.9
- Era 7: 434.7

Era 5→6はほぼ横ばいで、さらにEra durationが540→600秒へ伸びるため、「後半ほど急になる」体験と一致しにくい。

### 3. Early salvage is below the first meaningful purchase

現行salvageは概ね `2 + 2*cleared checkpoints + progress term + era bonus`。序盤でcheckpointを取れず低〜中progressの失敗では2〜4 BP程度になり得る一方、最安の恒久強化はSTARTING CAPITAL 6 BP、CORE EFFICIENCYは8 BP。

よって最初の失敗が「何も買えず、ほぼ同じrunをもう一度」になりやすい。

### 4. Existing progression bot is too perfect as the primary balance oracle

現行 `progression-balance.test.js` は1 game-secごとに判断し、常にcurrent bottleneckへ投資し、Overclockも利用する。これは上限性能の検証には良いが、普通の人間が数秒おきに画面を見て判断するプレイ感を十分表さない。

### 5. Module equip exists but affordance is weak

engineには `equipModule(state, uid, bayIndex)` があり、装備中Moduleとのswapも可能。STATUS / LOADOUTには在庫ごとのBAYボタンがあるが、「BAY 1」というラベルだけでは「ここへ装備 / 交換する」という動詞が不足している。

## Revised balance goals

### A. Early game: first-attempt clearable

「初期状態で必ず勝つ」ではなく、**失敗周回を前提条件にしない**ことを狙う。

- Era 1: ちゃんとボトルネックへ投資するattentive-human proxyなら、恒久強化ゼロで原則first-attempt clear可能。
- Era 2: Era 1をfirst-attempt clearした通常ルートでもfirst-attempt clear可能。Blueprintを使えばさらに余裕が出るが、失敗転生を必須にしない。
- ランダムModuleの下振れだけでEra 1〜2を落とさない。

### B. Mid/late game: retained progress becomes increasingly necessary

- Era 3: fresh-metaでも上手いplayなら境界。初めて転生の価値を強く感じ始める。
- Era 4: いくつかの恒久強化を持つことを想定。
- Era 5: Blueprint build + Patent + Module運用を明確に要求。
- Era 6: normal routeで蓄積した恒久強化なしではかなり厳しい。
- Era 7: それまでの複数回の転生・強化を前提とする最終壁。ランダム神引きだけで恒久進行を飛ばせない。

難易度は「時間が長い」ではなく、required retained strengthがEraごとに凸状に増えることで作る。

### C. Failure must buy visible forward progress

序盤failure rewardの目標band:

- ほぼ何もしないrun: 2〜4 BP程度
- final target 25〜40%まで進めたmeaningful failure: 6〜8 BP
- 50〜75%: 8〜12 BP
- near miss: 12〜16 BP

少なくとも「ある程度ちゃんと遊んだ最初の失敗」では、STARTING CAPITAL等の最初の恒久強化を1つ買える可能性を高くする。

成功時の報酬も過剰にならないよう、failureだけでなく全体のBlueprint economyとして再simulationする。

### D. Shorter stages; difficulty must not come from waiting

初期案としてEra durationを次の範囲へ圧縮してsimulationする。

`180 / 200 / 220 / 240 / 260 / 280 / 300 game-sec`

つまり×1でも約3〜5分、後半まで極端に長くしない。最終値はbalance simulationで決める。

Module spawn / pity、Automation cadence、checkpoint timings、Overclock recharge等は絶対秒だけを個別に短縮せず、新durationでも意図したイベント密度になるよう一緒に再調整する。

### E. ×8 is a fast-forward feature, not a difficulty modifier

×8は次のgateをすべて満たした場合に追加する。

- ×1 / ×2 / ×4 / ×8で同じgame-timeに対するsimulation outcomeが一致する。
- checkpoint evaluation、Module draw/pity、Automation、Overclock recharge/durationにevent skipがない。
- save/reload境界でspeedによる差が出ない。
- browserでframe stallや入力破綻が発生しない。
- ×8時に人間へ8倍のクリックを強制しない。Pause、banked Overclock、Automation等でfast-forwardとして成立する。

問題が出る場合は×8を無理に公開せず、engine advance側を先に直す。

## Human-like balance agents

次回のsimulationでは現在の1秒decision botだけでなく、少なくとも3種類を持つ。

1. **Optimal proxy** — 1 game-secごとに投資判断。上限性能・破綻検出用。
2. **Attentive human proxy** — 3 game-sec程度ごとに判断。bottleneckは追うが完全最適ではない。主balance oracle。
3. **Relaxed human proxy** — 5〜6 game-sec程度ごとに判断し、Overclock timingや投資を少し逃す。初心者余裕度を見る。

必要ならModule manual optimizationの有無も分ける。

検証したい性質:

- Attentive proxyはEra 1〜2を失敗前提にしない。
- Relaxed proxyでもEra 1が理不尽な即壁にならない。
- fresh-metaを直接Era 5〜7へ置いた場合は、上手いproxyでも突破困難になる。
- normal routeでは転生と恒久強化を重ねることで全seedが最終クリアへ収束する。
- RNG下振れだけで長期間停滞しない。

現行のending到達p50約15 cyclesより多少多くなってよい。runが短くなるため、目安としてp50 18〜26 cycles程度を探索し、実時間総量・反復操作量と合わせて判断する。これは固定acceptanceではなく初期探索band。

## Module loadout UX rework

Drag & Dropはmobile/accessibility上の主操作にしない。既存のexplicit button方式を分かる形へする。

### Main screen

- `MODULE RECOVERED` cardを明確に `MANAGE LOADOUT` 導線として扱う。
- 必要なら上部 `STATUS` を `STATUS / LOADOUT` へ変更する。

### STATUS / LOADOUT

- 各Bay: `BAY 1 // EQUIPPED`、Module名、効果、`REPLACE` のように状態と動詞を表示。
- Inventory: `STORED` / `EQUIPPED · BAY N` を明示。
- Action labelを単なる `BAY 1` から `EQUIP → BAY 1` / `SWAP → BAY 2` へ変更。
- 装備前previewを `LINE 42.1 → 45.7 /s (+8.6%)` のように読むだけで意味が分かる形へする。
- whole-line throughputが下がる手動swapは許可してよいが、negative previewを明示する。安全なauto-equipは引き続き悪化swapを拒否する。
- Helpへ「Moduleの付け替え方」を追加。

## Implementation order

### Phase 1 — Balance instrumentation

- human-like proxy追加
- Era別first-attempt / repeated-attempt / fresh-meta / normal-route metricsを出す
- speed ×8 determinism stress fixtureを準備

数値を触る前に、何を良いbalanceと判定するかをtestへ落とす。

### Phase 2 — Early momentum + duration curve

- salvage reward再設計
- Era duration短縮
- checkpoint / Module / Automation / Overclock timing再調整
- Era 1〜2 targetをhuman proxy基準で再fit

### Phase 3 — Convex late difficulty

- Era 3〜7 target curveを再fit
- fresh-meta vs accumulated-metaのgapを検証
- Blueprint / Patent購入順によるdead buildや詰みを監査
- RNG stressを増やす

### Phase 4 — Module loadout discoverability

- main導線
- explicit EQUIP / SWAP verbs
- line throughput preview
- mobile / keyboard QA

### Phase 5 — ×8 + release QA

- ×8 determinism / event density / save persistence
- browser interaction at ×1/×4/×8
- exact full npm test
- desktop 1440x1000 / mobile 390x844 / narrow 360x800 render QA
- screenshotsと実操作でbalance-related UIを目視

## Release policy

通常開発は`develop`。balance調整中は`main` / Pagesを変更しない。

数理testがPASSしただけではreleaseしない。simulationは人間プレイのproxyに過ぎないため、最終的には少なくとも序盤数周を実browser相当で操作し、

- failure後に「もう一周やれば進める」と感じられるか
- Era 1〜2がサクサク進むか
- Era 4以降で恒久成長が必要になる感覚があるか
- Module付け替えを説明なしで発見できるか
- ×8が単なる忙しさ増幅になっていないか

を確認してからmainへreleaseする。
