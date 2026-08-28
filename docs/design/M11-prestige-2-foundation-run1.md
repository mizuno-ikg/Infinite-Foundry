# M11 — Prestige 2.0 foundation / run 1

## Scope

M10で確認した「1秒optimal botは序盤を過大評価する」「attentive human proxyではEra 1 first-attempt 37.5%、Era 2 0%」を受け、まずbalance値そのものを触る前に、失敗runが次runへ必ず少し残るretained progression層を実装した。

このrunではM12のEra target/duration再fitは行わない。M11の目的は、連続恒久進行、Breakthrough、Research Focus、early salvage、旧save migrationの契約を先に安定させること。

## Foundry Memory

`prestige-m11.js` をengine compatibility layerとして追加した。既存engine/saveを直接破壊的変更せず、公開APIをwrapしてM11 stateを加える。

- `meta.foundryMemory`: 非消費の累積恒久値
- `memorySchemaVersion`: M11 migration marker
- `cycle.researchFocus`: run中の低頻度future-progress toggle
- `cycle.researchData`: Focus中のrun内研究蓄積
- `cycle.memoryAwarded`: 同一runの二重回収防止

### Continuous bonus

Memory所持量だけで次runのStarting Creditsが連続的に増える。

`bonus = min(90, 2 * sqrt(memory) + 0.22 * memory)`

Era scale前のstarting capitalへ加算するため、Memory 1でも次runに差が見え、値が大きくなるほど線形暴走しにくい初期curveとした。M12でhuman proxyと合わせて再fitする。

## Breakthrough thresholds

Memoryは消費せず、閾値到達で既存恒久能力のminimum floorを開放する。

| Memory | Breakthrough | Effect |
|---:|---|---|
| 12 | CAPITAL RECALL I | Starting Capital LV1 floor |
| 30 | AUTOMATION SCHEMATICS | Automation LV1 floor |
| 60 | EXPANDED MODULE BAY | Module Bay LV1 floor |
| 110 | DEEP PROCESS MEMORY | Core Efficiency LV2 floor |
| 180 | RECURSIVE CAPITAL | Starting Capital LV3 floor |

既に購入済みのupgrade levelは下げず、`max(existing, breakthrough floor)`のみ適用する。

## Memory reward contract

即restart/abort farmを防ぐため、以下をすべて満たさないrunは0 Memoryのままになり得る。

meaningful判定は次のいずれか。

- Era durationの8%以上を進行
- final target比5%以上へ到達
- checkpointを1つ以上clear
- Research Dataを正に蓄積

meaningful runでは最低1 Memory。さらにfinal target progress、checkpoint clear数、Era、Research Data、winを加点する。

`awardMemory()` は `cycle.memoryAwarded` によりidempotentで、同runを繰り返し回収できない。

## Research Focus

`RESEARCH FOCUS // OFF / ON` をM10 control rowへ追加。

ON中は各advanceで生成production valueの18%をcurrent Creditsからdivertし、45 game-secごとに約1 Research Dataを蓄積する。Research Dataはcycle終了/early salvage時のMemory報酬へ加算される。

目的はクリック連打ではなく、run中に一度か数回「今runの突破より次runを優先する」と判断できる低頻度操作にすること。ON/OFFを高速に切り替えても研究効率は増えない。

## Early salvage integration

M10 `SALVAGE RUN / REBUILD EARLY` をMemoryへ接続した。

- confirmationで現時点のBlueprint + Foundry Memory forecastを表示
- abort結果へ `memoryEarned / memoryBefore / memoryAfter / newBreakthroughs` を記録
- immediate abortはMemory 0
- meaningful partial runは最低1 Memory
- early salvage後はMemoryをbank済みとして次cycleへ進める

## Legacy save migration

M11以前のsaveで`foundryMemory`が存在しない場合、既存資産を失わせないよう次から初期Memoryへ換算する。

- unspent Blueprint
- purchased meta upgradeへ投入済みのBlueprint cost
- completed Era数
- successful cycle数

初期式は `round(total legacy Blueprint value * 1.5 + completed eras * 8 + successful cycles * 3)`。

これは旧資産を削除・減額せず追加のMemoryへ写像するため、migrationでプレイヤーが弱くならないことを優先した暫定式。M12のbalance fitで強すぎる場合も、既存購入levelそのものは維持する。

## Browser wiring correction

M10で追加されていた`balance-m10-logic.js` / `balance-m10.js`がdevelopの`index.html` script chainへ未接続だったため、M11実装と同時にbrowser wiringを修正した。

script order:

1. `engine.js`
2. `prestige-m11.js`
3. `app.js`
4. `balance-m10-logic.js`
5. `balance-m10.js`
6. `era-visuals.js`

Prestige wrapperはappがstateを生成/deserializeする前にengineへinstallし、M10 UI patchはappのglobal state初期化後に実行する。

## Tests

`tests/prestige-m11-contract.test.js` をdefault `npm test`へ追加。

contract:

- fresh Memory 0はstarting Credits 20を維持
- Memory 4で次run starting Creditsが増える
- Research Focusはcurrent Creditsを減らしResearch Dataを増やす
- immediate abortはMemory 0
- 30 game-secのmeaningful partial runはMemory >= 1
- 同一runのMemory二重award禁止
- Memory 60でAutomation / Module Bay breakthroughが有効
- legacy Blueprint assetsからnon-zero Memoryへmigration

このChat実行環境ではGitHub sourceをlocal filesystemへ直接cloneできず、DNSが遮断されているため、今回の新規testはsource-level contractとして追加し、Actionsは反復開発用途に使わない方針を維持した。M15のrelease-grade exact QAまでworkflow_dispatchは行わない。

## Current assessment / next fit

M11 foundationは実装したが、Memory curveの数値fitとresult画面のbefore→after表現はまだM11内の次工程。

次はhuman proxyへMemory/rebuild progressionを組み込み、attentive / relaxedで次を測る。

- failure 1回後のstarting strength差
- Breakthrough到達までのrun数
- Research Focusを使う/使わない場合のclear遅延とMemory短縮
- Era 1〜2 first-attempt要件をM12で調整する前提で、Memoryが序盤を過剰にskipしないこと
- Era 3以降で複数rebuildが「同じrunの繰り返し」ではなく明確な前進として読めること
