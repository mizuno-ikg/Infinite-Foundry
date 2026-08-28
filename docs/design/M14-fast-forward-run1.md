# M14 — ×8 fast-forward / determinism run 1

## Scope

M13のsource-level narrow-width監査を閉じ、M14の第一段として×8 fast-forwardをbrowser層へ追加した。

## M13 closeout

`styles.css` の mobile contract を再監査した。620px以下では `.inventory-row` が1列化され、`.inventory-actions` は左寄せwrap、M13追加styleで各Module action buttonは `width:100% / min-height:44px / min-width:0` になる。390×844 / 360×800でwhole-line previewを追加しても横幅を固定的に要求する構造はない。正式render目視はM15の3 viewport QAへ残す。

## ×8 implementation

- `m14-fast-forward.js` を追加し、speed barへ `×8` を追加。
- app本体の `setSpeed()` と既存fixed-step engineをそのまま利用するため、×8専用の粗いsimulation pathは作らない。
- engineは `STEP=0.05` のまま。real-time deltaへspeedを掛けた後、`advance()` が0.05 game-sec stepへ分解する。
- 既存engineのsave migrationは `[1,2,4]` 以外を×1へ正規化するため、M14 browser layerでdeserialize前のrequested speedを読み、1/2/4/8ならrestore後に戻す。restartは従来どおりcreateStateで×1になるため、M10の「rebuild後×1」contractは維持。
- HELPを×8対応へ更新し、×8はfast-forwardであり、重要操作区間では低速へ戻してよいことを明示。

## Determinism contract

`tests/m14-fast-forward-contract.test.js` をdefault `npm test` chainへ追加。

同じ120 game-secを以下で進めたsnapshotが一致することを固定した。

- 0.05 sec × 2400
- 1 sec × 120
- 8 sec × 15

比較対象はtime / credits / output / levels / checkpoint results / modules / inventory / RNG / result / event sequence。加えて64 game-sec地点でserialize→deserializeし、残り56 game-secを進めた結果が非reload routeと一致するcontractを追加した。

## Current limitation

この実行環境では `github.com` のDNS解決が失敗し、GitHub connectorでwriteしたdevelopをcontainerへcloneできない。このため新contractのNode exact実行は未実施。Actionsは反復開発用途には使っていない。

また、人間操作密度についてはまだM14未完。×8そのものは数理determinismを崩さないが、manual investmentを行うプレイヤーがreal-timeあたり8倍忙しくならないことは別問題である。次runではhuman proxyへspeed-aware real-time operation densityを追加し、×8を待ち時間短縮として使うrouteを測る。必要ならauto-throttle / decision-point assist等を検討する。

## Gate status

- M13 source-level UX: complete（formal renderはM15）
- M14 ×8 UI foundation: implemented
- M14 game-time determinism contract: implemented, exact execution pending
- M14 save/reload speed preservation: implemented in browser layer
- M14 event skip contract: implemented, exact execution pending
- M14 human operation density: pending
- main / Pages: untouched
