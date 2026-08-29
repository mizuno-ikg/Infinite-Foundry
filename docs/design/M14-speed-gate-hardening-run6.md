# M14 Speed Gate Hardening — Run 6

## 目的

M14 の ×8 採否を formal multi-seed 実測へ進める前に、判定ロジック自体が late-Era failure と実使用率の低さを見逃さないよう厳格化する。

## 発見した判定穴

### 1. late-Era reach drop を中央値で評価していた

旧実装は Era 5 / 6 / 7 の reach-rate drop 3値の中央値だけを `maxLateReachDrop` と比較していた。

このため、例えば Era 5 / 6 がほぼ無傷でも Era 7 だけ大きく到達率を落とす ×8 route が gate を通る可能性があった。終盤ほど retained strength 依存を増やす本作では、最終Eraだけの破綻も見逃してはいけない。

### 2. ×8 がごく少数routeでしか使われなくても pass し得た

旧 `x8ActuallyUsed` は `x8UseRate > 0` だけを要求していた。12 seed中1 routeだけAutomationへ到達して×8を1 cycle使った場合でも「×8を実際に比較できた」と判定し得る。

Automation成熟後の高速周回として採否を決めるには、少なくとも代表routeの過半で×8が実際に使われている必要がある。

## 変更

`tools/balance/m14-speed-gate.js`

- `minX8UseRate = 0.5` を追加。
- `x8ActuallyUsed` は `x8UseRate >= 0.5` かつ `x8CyclesP50 > 0` を要求。
- Era 5 / 6 / 7 の reach drop は中央値ではなく **最大悪化値** を gate 判定へ使用。
- 個別drop配列 `lateReachDrops` もmetricsへ残す。

`tests/m14-speed-gate-contract.test.js`

- Era 7だけ大きくreachが落ちるケースをrejectする回帰を追加。
- ×8利用routeが少数だけのケースをrejectする回帰を追加。

## 検証

通常 `git clone` は今回も `Could not resolve host: github.com` で失敗した。

ただし更新対象2ファイルはlocalへ同内容を復元して `node --check` PASS。さらに `human-proxy.js` を最小stub化した isolated pure-contract 実行で、`m14-speed-gate-contract` の判定ロジックがPASSすることを確認した。

formal multi-seed simulationは engine / prestige / era-mechanics を含む実Work Plane実行経路が必要なため未実行。Actionsは使用していない。

## 判定

M14は継続。次の正式実測ではこの厳格化済みgateを使用する。

×8は「一部の強いseedだけで使える」状態を成功とせず、Automation成熟後の通常human routeで広く実用になる場合だけ維持する。late Eraのどれか1つでも到達率を大きく壊す場合は、過剰assistを足すより×8撤回を優先する。
