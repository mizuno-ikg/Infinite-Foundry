# M9 Playfeel Round 14 — Pause provenance / reload QA hardening

## Goal

Release候補の機能追加を止め、時間制御とsave/reloadの信頼性を実ブラウザQAで検証できる状態へ収束させる。

Round 5ではlive runからHELPを開いた場合だけauto-pauseし、元から手動PAUSEだった場合はHELP close後もpauseを維持する設計にした。Round 10ではEra昇格briefingをsave stateへpendingとして残し、reload後も時計停止状態で復元する設計にした。ただし、これらはsource/contract中心で、release browser gateが状態の由来とreload復元を十分に検査していなかった。

## Audit result

### Manual PAUSE + HELP

`playfeel-round5.js` の `armHelpPause()` は `paused` の場合に `helpAutoPaused` を立てない。したがって、既存のmanual pauseをHELP由来のpauseとして誤認せず、HELP close時に勝手にresumeしない構造になっている。

release QAではこの挙動を明示的に固定する必要がある。

### Era briefing + reload

`playfeel-round10.js` は `cycle.playfeel.eraBriefPending` を保存し、reload時にpendingならbriefingを再構成して `paused=true` に戻す。`BEGIN ERA` はpendingをfalseにして保存する。

serialize contractだけでは、実DOM復元・時計停止・BEGIN後の時計再開まで保証できないためbrowser interaction gateへ昇格する。

## Changes

- `tools/qa/browser-ux.html`
  - manual PAUSE → HELP → closeで `RESUME` 状態と時計停止が維持されることを検査。
  - running → HELP → closeでは従来どおり自動resumeすることを引き続き検査。
  - Era 2 briefing表示後、pending markerが保存済みであることを確認してiframeをreload。
  - reload後もEra 2 briefingが復元され、時計が停止していることを検査。
  - `BEGIN ERA` 後にpending markerがdurably falseになり、時計が再開することを検査。
  - `qaPauseProvenance` / `qaEraBriefReload` gateを追加。
- `tools/qa/browser-smoke.js`
  - desktop 1440×1000 / mobile 390×844 / narrow 360×800のすべてで上記2 gateを必須化。
  - 追加interaction分を考慮してUX wait budgetを少し拡張。
- `tests/playfeel-round5-contract.test.js`
  - pause provenance browser gateが削除されないことを通常`npm test`から監視。
- `tests/playfeel-round10-contract.test.js`
  - Era briefing reload browser gateとpending clear検査が削除されないことを通常`npm test`から監視。

## Release interpretation

これは新しいゲーム機能ではなく、既存の時間制御設計をrelease候補として信頼できる形にするQA hardeningである。

現在の実行containerは `github.com` のDNS解決ができずexact develop working treeをcloneできないため、full `npm test` / Chromium render自体はまだ未実行。GitHub connector経由のsource実体確認とdevelop更新は正常。

main / Pagesへはまだreleaseしない。
