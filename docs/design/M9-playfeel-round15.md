# M9 Playfeel Round 15 — pre-frame pause integrity / lightweight previews

## 目的

Round 14までで追加したEra briefing reload gateとplayfeel補助UIを、release候補としてさらに監査する。

今回の重点は以下の2点。

1. reload直後の短時間も含め、Era briefing確認前にproduction clockを一切進めない。
2. 見た目・操作補助のためのhypothetical計算がmobile frame pacingを損なわない。

## 発見1 — pending briefing復元前のhidden game-time

`app.js` は通常stateを復元すると即座に `requestAnimationFrame(tick)` を予約する。一方、`eraBriefPending` を見てbriefing UIを復元する処理は、`era-visuals.js -> playfeel-logic.js -> playfeel-v1.2.js -> Round 3 -> 4 -> 5 -> 8 -> 9 -> 10` の動的loader chain後段に存在していた。

そのためreload後、Round 10が `paused=true` にするまでの数frameだけproduction clockが進む可能性があった。表示時計は秒単位なので従来QAでは検出しにくい。

### 修正

parser-blockingで `app.js` の直後に実行される `era-visuals.js` 冒頭で、

```js
if(state?.cycle?.playfeel?.eraBriefPending){
  paused=true;
  last=performance.now();
}
```

を同期実行する。

これにより最初のrAF tickより先にclock haltを確定し、Round 10は後からUIを復元するだけになる。

### QA強化

browser UXでbriefing pending状態を保存してreloadし、復元後に即manual saveして `cycle.time` を比較する。reload前後差は50ms未満を要求し、秒表示が変わらないだけではPASSにしない。

## 発見2 — live previewの過剰deep clone

`renderDirectUpgrades()` は各設備について `upgradeOutcome()` を呼び、従来はそのたびにsave state全体を `JSON.parse(JSON.stringify(state))` していた。

この処理はplayfeel refreshから高頻度に呼ばれ、周回後半ではevents / throughputSamples / moduleInventory等、hypothetical capacity計算に不要な履歴まで複製する。Module placement previewにも同系統のcostがあった。

見た目の補助機能がmobile GC / frame pacingを悪化させるのは目的に反する。

### 修正

`playfeel-logic.js` にminimal `previewState()` を導入し、throughput試算に必要なものだけを複製する。

- meta
- cycle.time
- cycle.credits
- cycle.ended
- cycle.levels
- equipped modules
- overclockUntil

Module placement previewはlive inventoryから対象moduleだけを参照し、仮loadoutをminimal previewへ構成する。Auto module swap guardもwhole state cloneをやめる。

経済結果・Automation policy・Module preview表示は変更しない。

## 回帰防止

- Round 10 contractでpre-frame pending haltの存在を監視。
- browser UXでreload前後 `cycle.time` を直接比較。
- playfeel logic testで `previewState` 使用とwhole-state `clone(state)` の不使用を監視。
- Module previewがlive loadoutを変更しないことを明示検査。

## Release status

このRoundはrelease収束の一部であり、`main` / Pagesへはまだ反映しない。

残る主要gateはexact develop working tree上でのfull `npm test`と、desktop 1440×1000 / mobile 390×844 / narrow 360×800のChromium render/interactions確認。