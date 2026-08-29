# M14 — ×8 rejection / M15 entry

## 結論

×8 fast-forwardは製品機能として見送る。固定step simulation自体は8 game-sec単位の大きなadvanceでもdeterministicだが、human-like routeではAutomation解放後も判断間隔がgame-time上で広がり、投資機会の取りこぼしによって進行が明確に悪化した。

ユーザー方針どおり、×8を成立させるための追加assistは入れず、shipping speedは×1 / ×2 / ×4へ戻す。実験期間中に作られた×8 saveだけはload時に×4へ安全に縮退させる。

## 実測方法

通常の `git clone` は実行containerの `github.com` DNS解決失敗が継続したため、GitHub connectorからdevelopのtree/blobを取得し、`engine.js` / `prestige-m11.js` / `era-mechanics.js` / `tools/balance/human-proxy.js` / M14 gateを同一内容でローカルへ復元してNode実行した。Actionsは使用していない。

同一seed 6本、human-like proxy、Focus `losing`、requested speed ×4 / ×8を比較。×8はAutomation Lv1までは×4へclampされ、解放後だけ実効×8になる現行gateを再現した。

### 20-cycle attentive

- ×4: final Memory p50 73、Era 5 reach 33%、Era 6/7 reach 0%
- ×8: final Memory p50 63、Era 5/6/7 reach 0%
- decision density x8/x4 ≈ 1.09、buy density ≈ 1.24

操作密度自体は同じorderに保てているが、結果が悪化した。

### 40-cycle attentive

- ×4: final Memory p50 161、Era 5 reach 100%、Era 6 reach 100%、Era 7 reach 0%
- ×8: final Memory p50 131、Era 5/6/7 reach 0%
- ×8は全routeで実使用され、x8 cycle中央値35
- decision density x8/x4 ≈ 1.12、buy density ≈ 1.29

この差は「×8を使えていない」ためではなく、十分使った結果として発生している。

relaxed routeでは×4/×8ともlate Era未到達になるseed帯もあり、旧gateが相対差だけを見てKEEPを返し得る穴も発見した。`recommendation` は相対x8 gateだけでなくlate-era viabilityもPASSした場合だけKEEPとするよう修正した。

## Shipping変更

- `m14-fast-forward.js` は×8ボタン生成を削除。
- shipping `ALLOWED_SPEEDS` は `[1,2,4]`。
- experimental ×8 saveはload時に×4へfallback。
- stale/cachedな `data-speed="8"` ボタンがあれば防御的に除去。
- 8 game-sec advance chunkのdeterminism testは製品速度とは独立したstress testとして維持。

## M14判定

M14は完了。×8は「実装して残す」ことではなく、安全性とhuman playfeelを検証して採否を決めるmilestoneだった。検証結果はREMOVE_X8であり、製品速度は×4までとする。

## M15入口 — late Era再fit

現行×1の6-seed監査では、旧final target 1450 / 4200 / 11800でattentiveのattempt p50がEra 5/6/7 = 2 / 9 / 12、relaxed = 5 / 9 / 10となり、ユーザー目安（losses E5 1–3、E6 2–5、E7 3–7）よりE6/E7が重すぎた。

複数候補を同じ復元engineで比較し、final targetを **1400 / 3600 / 9700** にrefitした。8-seed別群のFocus OFFでは概ね:

- attentive attempts p50: E5 2 / E6 3 / E7 4
- relaxed attempts p50: E5 1 / E6 5 / E7 4
- finish rateはいずれも100%
- E1/E2のfresh first-attempt性は維持

seed差はあるため固定回数保証ではなくM15 browser実プレイまで継続監査するが、通常routeの中心は意図したloss bandへ大きく改善した。native era scalingを除いたrequired retained strengthもE5→E6→E7で引き続き増加する。

Research Focus `losing` はrelaxed routeで一部Eraのattemptを増やすため、M15では「常時推奨戦略」ではなく、負けrunを将来progressへ変換する任意のsalvage手段として扱い、通常balance oracleはFocus OFFを主とする。
