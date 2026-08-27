# M9 — Playfeel Round 9 / delegated-control trust hardening

## Goal

Round 1〜8で操作量、視覚階層、Automation Memory、Module guard、Overclock、mobile geometry、modal/focusを改善した。Round 9では新しい機能を増やさず、**自動化をONにした後もプレイヤーがUIを自分で操作している感覚を失わないこと**をrelease候補の信頼性条件として監査した。

## Integration finding

`playfeel-v1.2.js` のAutomation Memoryは、投資判断後に既存のcentral UPGRADE pathを再利用するため `select(decision.id)` を呼んでいた。

このため自動投資が発生するたび、処理自体は合理的でも、プレイヤーの「現在選択している設備」がAutomation側の設備へ移動する。直接UPGRADE化後はselection自体の重要度は下がっているが、設備のselected stateや操作文脈をバックグラウンド機能が奪うのは、opt-in delegationの思想と相性が悪い。

またSYSTEM LOGは `AUTOMATION // ... delegated upgrade · reserve XX%` までしか示さず、**実際に何Credits使い、何Levelになったか**が分からない。自動消費への不信感を避けるには、ON/OFFだけでなく結果も追跡可能である方がよい。

## Design decision

Automation Memoryは「プレイヤーの代理人」であり「UIを操縦する別プレイヤー」にはしない。

- playerが明示的に選んだ設備を別途trackingする
- direct machine UPGRADE / machine click / keyboard selectionはplayer intentとして記録する
- Automationが既存central UPGRADE pathをprogrammaticに使った場合、購入完了後にplayer selectionを同一taskのmicrotaskで復元する
- 復元はbrowser paint前に行い、自動投資ごとのselection flickerを避ける
- 既存のAutomation log entryへ `-XX CR · LV N` を追記し、resource spendingを監査可能にする
- direct UPGRADE、hold-to-upgrade、legacy trusted central clickはAutomationと誤認しない

この方法では、既存のDomain Protocol rebate、engine upgrade、save、event log経路を壊さず、AutomationのUI副作用だけを分離できる。

## Implementation

- `playfeel-round9.js`
  - explicit player selection tracker
  - direct intent depth guard
  - trusted / direct upgrade exclusion
  - delegated upgrade後のselection restoration
  - automation logへexact cost / resulting level追記
- `playfeel-round8.js`
  - Round 9 loaderをchainへ追加
- `tests/playfeel-round9-contract.test.js`
  - loader、player-intent tracking、automation/direct識別、selection restore、resource log契約を固定
- `package.json`
  - Round 9 contractをdefault `npm test` chainへ追加
- `tools/qa/browser-ux.html`
  - live run中HELPが時計をauto-pauseし、HELP close後にresumeすることをbrowser QAへ追加

## Validation

- `playfeel-round9.js` はローカル一時ファイルで `node --check` pass。
- GitHub develop branchでRound 9 loader / source / default test chainを確認する。
- exact develop cloneは実行環境のDNS制約 (`Could not resolve host: github.com`) により今回も取得不能。
- したがってfull `npm test`、desktop/mobile Chromium render、browser UX harness実行は未検証でありrelease gateとして残す。

## Release posture

`main` / GitHub Pagesへはまだreleaseしない。

次回はRound 1〜9をrelease candidateとして監査し、特に次を優先する。

1. Automation OFF / ASSIST / SMARTとmanual direct/hold操作の競合
2. save/reload/rebuild後のAutomation modeとOverclock capacitor state
3. HELP auto-pause / manual PAUSE / Era briefing / hidden-tabのtime-state整合
4. exact browser renderが可能になった場合の1440 / 390 / 360px geometry・motion・focus確認
5. 追加機能より、既存patch chainの複雑性削減とrelease収束
