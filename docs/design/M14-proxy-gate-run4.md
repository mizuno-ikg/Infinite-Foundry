# M14 — ×8 human proxy gate alignment (run 4)

## 目的

×8 fast-forwardをAutomation成熟後の高速周回報酬として評価するため、human-like balance oracleもゲーム本体と同じ解放条件で速度を扱う。

## 発見

前runでゲーム本体の×8はAutomation Lv1までlockedになったが、`tools/balance/human-proxy.js` は `speed: 8` を指定するとfresh stateでも最初から×8として計測していた。

この状態では、次に予定している attentive / relaxed × speed 1/4/8 比較が実プレイ条件と一致しない。特にfresh routeのreal-time所要時間、decision density、Memory進行を過度に×8有利へ見積もる可能性がある。

## 修正

- `isEightUnlockedMeta(meta)` をhuman proxyへ追加し、ゲーム本体と同じ `meta.upgrades.automation >= 1` を×8解放条件にした。
- `effectiveSpeedForState(state, requestedSpeed)` を追加。
  - ×1 / ×2 / ×4はそのまま。
  - ×8要求時、Automation未解放なら実効速度を×4へclamp。
  - Automation Lv1以降のみ実効×8。
- `playCycle()` は `requestedSpeed` と実際に使った `speed` を別々にtelemetryへ残す。
- `simulateRoute()` はcycleごとの `speedByCycle` を残し、周回途中でAutomationを取得した後だけ×8へ移る経路を表現できるようにした。
- `simulatePrestigeLoop()` も同じgateを通す。
- M14 operation-density contractへfresh ×8→×4、Automation Lv1 ×8→×8の契約を追加。operation-density比較そのものはAutomation有効stateで行うよう修正した。

## 検証

通常のGit clone / npm testは実行containerの `github.com` DNS解決失敗により今回も利用できなかった。Actionsは反復開発には使用していない。

更新したproxy断片はlocal `node --check` でsyntax PASS。GitHub connectorで更新対象の現行blobとwrite結果を確認した。

## 判断

M14の次の比較は、単純な「最初から×8」ではなく、**×8を要求していてもAutomation取得までは×4、その後だけ×8**という実際のprogression条件で行う。

これにより、×8を残すか撤回するかの判断を、実装と一致したhuman-like oracleから行える。

## 次

attentive / relaxed、focus off / losing、requested speed 1 / 4 / 8を同一seed群で比較し、以下を見る。

- Automation解放前後の実効speed
- decisions / buys per real minute
- Era別 first-attempt clear
- attempt p50 / p90
- finish rate
- Foundry Memory進行
- Module / Automation event cadence

Automation解放後の×8だけoutcomeが大きく崩れる場合、過剰なassist追加ではなく×8撤回を第一候補とする。
