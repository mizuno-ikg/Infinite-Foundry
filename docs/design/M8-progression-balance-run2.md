# M8 — Full Progression Balance / Run 2

## 目的

run 13 の `era_stress.js` は、各 Era を fresh / standard / max の代表的な恒久強化状態から単独で開始し、Directive 難易度を比較するには有効だった。一方で、実際のプレイヤーは Workshop から開始し、失敗 → Blueprint 回収 → 恒久投資 → 再挑戦 → Patent 獲得 → 次 Era へ昇格、という履歴を連続して持つ。

そのため run 14 では、**organic な全編進行そのもの**を seeded RNG で繰り返す regression test を追加し、「単発 Era の clear rate は妥当でも、全編では同じ壁を何度も殴らされる」問題がないかを検査した。

## 追加した検証

`tests/progression-balance.test.js` を追加し、fresh meta から Universe Foundry の ending までを一続きで simulation する。

代表プレイ方針は、最適解探索ではなく、ゲーム画面を見て合理的に動くプレイヤーの透明な proxy とした。

- Overclock は cooldown ごとに使用する。
- 現在の bottleneck を優先して設備投資する。
- Domain Protocol の手動投資 bonus を適用する。
- Blueprint は `efficiency → capital → moduleBay → automation` の優先順で、購入可能なものを買う。
- Patent はまず `Power Routing`、その後 `Salvage Theory` へ投資する。
- Module は engine の seeded RNG をそのまま使い、幸運な seed を選別しない。

テストは以下を品質条件にした。

1. sampled seed がすべて ending へ収束する。
2. 全編が極端な prestige grind にならない。
3. Era II〜VII の中央値は 3 attempts 以下。
4. Era II〜VII の p90 は 5 attempts 以下。
5. Blueprint / Patent の恒久成長が実際に購入される。

`package.json` の通常 `npm test` にこの full progression regression を組み込み、さらに多 seed 用 `npm run stress:progression` を追加した。

## 最初に見つかった問題

run 13 の単発 Era stress では許容範囲に見えたが、全編を fresh から通した最初の 24-seed 実行では以下になった。

- ending 到達: 100%
- cycle count p50 / p90 / max: **23 / 25 / 26**
- ×1 game-time p50 / p90: **208 / 231 min**
- ×4換算 p50 / p90: **52.0 / 57.8 min**
- Era ごとの attempts p50: **1 / 2 / 2 / 2 / 7 / 1 / 5**
- Era ごとの attempts p90: **1 / 2 / 4 / 3 / 9 / 3 / 9**

特に Stellar Forge (Era V) は final target に対する中央値が、attempt 1〜7 で概ね `0.79 → 0.78 → 0.82 → 0.81 → 0.84 → 0.90 → 0.96` と推移しており、**失敗が次の成功へ十分速く接続されず、同じ壁を何度も反復する prestige wall** になっていた。

Universe Foundry (Era VII) も複数 attempt にわたり 0.9 前後へ停滞し、単発 `standard` profile では見えなかった organic meta 分布の不足が現れた。

## 再バランス

Workshop の M4 calibration は変更していない。初回約5分・ordinary Monte Carlo の初回 clear 約29%という既存の設計根拠を維持する。

全編 progression の壁だけを狙って次を調整した。

### Era V — Stellar Forge

旧:

`850 / 3210 / 7055 / 14000`

新:

`700 / 2640 / 5800 / 11500`

### Era VII — Universe Foundry

旧:

`6400 / 24900 / 55100 / 106000`

新:

`5700 / 22100 / 48900 / 94000`

この修正後、全編中央値は 23 cycles → 15 cycles へ改善した。ただし Law Foundry (Era VI) だけ p90 attempts が 6 に残ったため、tail を約5%だけ平滑化した。

### Era VI — Law Foundry

旧:

`1940 / 7220 / 16020 / 30000`

新:

`1840 / 6860 / 15200 / 28500`

## 最終結果

24 seeded full runs の最終 regression:

- ending 到達: **100%**
- cycle count p50 / p90 / max: **15 / 18 / 20**
- ×1 game-time p50 / p90: **126.0 / 163.0 min**
- ×4換算 p50 / p90: **31.5 / 40.8 min**
- attempts p50 by Era I〜VII: **1 / 2 / 2 / 2 / 2 / 2 / 3**
- attempts p90 by Era I〜VII: **1 / 2 / 4 / 3 / 3 / 4 / 5**
- failures p50 by Era I〜VII: **0 / 1 / 1 / 1 / 1 / 1 / 2**

つまり、代表 active policy では通常「新 Era に到達 → 一度程度失敗 → 恒久成長を得て突破」というリズムになり、最終 Universe Foundry だけ少し厚めの最終壁を残す。

最終 CI (`bba6ed6fe10359fcd34c22aea3f5276e61f0ec37`) は以下をすべて通過した。

- engine / foundation / era progression / visual contract / era mechanics tests
- full progression balance regression
- 実 Google Chrome render smoke
- Era I / IV / VII × desktop / mobile の horizontal overflow = 0
- Domain Protocol / Era固有 machine identity の存在確認
- browser screenshot evidence artifact生成

## 解釈上の注意

この simulation は**人間の実プレイ時間の保証ではない**。毎秒の合理的 bottleneck 投資と cooldown ごとの Overclock を行う active proxy なので、人間の判断速度・迷い・画面理解を含まない。

また Workshop がこの active proxy では初回突破しやすいことを理由に、初回体験の target 52/s を再校正しない。初回難易度の正本は M4 の ordinary Monte Carlo と、今後の実ブラウザ human-like playtest とする。

今回の価値は、**prestige が理論上収束するだけでなく、organic な全編進行において同じ Era を過度に反復する壁がないことを regression として固定した**点にある。

## M8 の残課題

数理・seeded progression の大きな壁は解消した。次は実ブラウザ操作で以下を bug hunt する。

1. ×1 / ×2 / ×4 の実操作と経済結果の整合。
2. save / reload と旧 schema migration。
3. `document.hidden` 中の完全停止と復帰時 no catch-up。
4. mobile viewport での主要操作、tap target、prestige / Patent / Era ascend の実フロー。
5. Automation / Module / Domain Protocol が UI 上で理解可能で、死に機能になっていないか。

これらを通した後に M8 exit を判断し、M9 公開・最終監査へ進む。
