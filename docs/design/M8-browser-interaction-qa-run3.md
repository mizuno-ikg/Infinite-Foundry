# M8 Browser Interaction QA — run 3

## 目的

M8の最終関門として、静的DOM契約やスクリーンショットだけでなく、実Chrome上でプレイヤー操作に近い縦切りをdesktop / mobileの双方で検証する。

## 追加したQA harness

`tools/qa/browser-flow.html` を追加し、localhost上だけで使うQA fixtureとして以下を実行する。

1. Engine APIでWorkshop clear済みの有効なsaveを生成する。
2. 実際の `index.html` をiframeで読み込み、Prestige panelが表示されることを確認する。
3. Patent upgradeをクリックし、Patentが1減ることを確認する。
4. 購入可能なBlueprint upgradeをクリックし、Blueprintが減ることを確認する。
5. `ASCEND TO NEXT ERA` をクリックし、Era IIへ進むことを確認する。
6. `×4` をクリックしactive stateへ切り替わることを確認する。
7. 実DOM上のbottleneck machineをクリックして選択し、`UPGRADE STAGE` をクリックしてlevelが1増えることを確認する。
8. `SAVE` をクリックし、localStorageへEra II / cycle / game timeが保存されることを確認する。
9. 同一ページをreloadし、Era II・cycle・speedが復元され、wall-clock由来の大きなcatch-upが入らないことを確認する。
10. 最終DOMにhorizontal overflowがないことを確認する。

`tools/qa/browser-smoke.js` からこのflowをdesktop 1440×1000とmobile 390×844で実Chrome `--dump-dom` / screenshotを使って実行する。従来のEra I / IV / VII render smokeも維持する。

## 結果

CI run `33043884846`（commit `1440615419146ec6f451a27e3b1d9f56663703f9`）で以下がsuccess。

- Node test suite
- desktop Era I / IV / VII render smoke
- mobile Era I / IV / VII render smoke
- desktop interaction flow
- mobile interaction flow
- render evidence artifact upload

操作導線について、Prestige / Patent / Blueprint / Era ascend / speed ×4 / machine select / stage upgrade / save / reloadを実Chromeで通過した。mobile viewportでも同じinteraction contractが成立した。

## Hidden / offline progressについて

ブラウザのPage Visibility状態をChrome CLIだけで任意に切り替えることは今回のharnessでは行っていない。一方、production runtimeは `tick()` 内で `!document.hidden` の場合だけ `Engine.advance()` を呼び、`visibilitychange` 時にreal-time基準 `last` を現在時刻へリセットしている。Engine stateはwall-clock差から進捗を算出せず、serialize/reload後にも保存されたgame timeからのみ再開する。今回のsave/reload実Chrome flowでも大きなcatch-upがないことを確認した。

## M8 exit判定

M8で要求した主要riskは以下の形で検証済み。

- 7 Era全編progression: multi-seed regressionでending到達100%
- prestige wall: Era V〜VIIを再調整し、attempt tailを平滑化
- random下振れ: deterministic seed stress + long-run progressionで監査
- ×1 / ×2 / ×4: fixed-step engine contractと実Chrome ×4操作を確認
- save / reload / migration: Node migration tests + 実Chrome reloadを確認
- mobile: representative render + interaction flowを390px viewportで確認
- visual growth: Era I / IV / VII actual Chrome screenshotsで確認

以上からM8をexitし、M9 公開・最終監査へ進める。
