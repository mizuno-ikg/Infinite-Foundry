# M9 Playfeel Round 16 — Render-cost hardening

## 目的
Round 15でpreview用stateのdeep clone範囲を縮小した後も、状態由来UIがanimation frameごとに再計算・DOM更新されていた。特にスマートフォンでは、見た目のanimation自体ではなく、60Hzで繰り返すhypothetical throughput計算と文字列/属性更新がGC・main-thread負荷になり、入力の手触りを悪化させる可能性がある。

今回の目的は、ゲーム経済・入力応答・CSS animationを変えず、**状態が100ms単位で見えれば十分なUIをframe-rate loopから分離する**こと。

## 監査で確認した負荷

- `era-visuals.js`
  - Domain Protocolのname/copy/statusを毎frame再代入
  - sustained throughput / level sumからEra成長bandを毎frame再計算
- `playfeel-round3.js`
  - Overclock readout、factory drive、machine maturity、checkpoint監視を毎frame実行
- `playfeel-v1.2.js`
  - 5設備の`upgradeOutcome`を毎frame呼び、資金不足でもhypothetical preview stateを作成
  - Automation / checkpoint / status / Module preview等も同じframe loopに載る

## 実装

### 1. Derived visual stateを100ms周期へ
`era-visuals.js` と `playfeel-round3.js` の状態由来refreshを `UI_STATE_REFRESH_MS = 100` のtimerへ変更した。

CSS animation、upgrade reaction、checkpoint one-shot animationなど視覚animation自体は変更していない。100msは状態表示の更新粒度であり、animation frame rateではない。

### 2. 不変DOMを書き直さない
- Domain Protocolの3テキストは現在値と異なる場合のみ`textContent`更新
- factory growth band / driveは前回値と異なる場合のみ更新
- machine maturity tierが同一ならpip再処理を省略
- Overclockの主要テキストも同値なら再代入しない

### 3. Unaffordable upgrade previewを短絡
`playfeel-round16.js` を追加。live stateで`canUpgrade=false`の場合、`playfeel-logic`のhypothetical preview state生成を呼ばず、既存`upgradeOutcome`と同じ unavailable resultを返す。

購入可能な場合だけcanonical `upgradeOutcome`へ委譲するため、投資効果・Automation判断・経済結果は変更しない。

## 回帰防止

- `tests/visual-contract.test.js`
  - visual state loopが100ms throttleを維持すること
  - protocol loopがframe-rate pollingへ戻らないこと
- `tests/playfeel-round3-contract.test.js`
  - Round 3 state refreshが100ms throttleを維持すること
- `tests/playfeel-round16-contract.test.js`
  - Round 12→16 loader chain
  - unaffordable preview short-circuit
  - affordable時canonical calculationへ委譲
- Round 16単体はreconstructed local fixtureで`node --check`とbehavior smokeを通過。

## 期待するプレイフィール効果
ゲーム内の数値やanimation速度は変えず、状態計算・DOM mutation回数だけを大幅に減らす。特に低〜中性能スマートフォンで、長押しUPGRADEやscroll、modal操作と同時に不要なmain-thread処理が競合するリスクを下げる。

## 未完了gate
containerからGitHub hostnameのDNS解決ができないため、exact develop全体の`npm test`とChromium 1440×1000 / 390×844 / 360×800 render QAは未実施。release前の必須gateとして継続する。
