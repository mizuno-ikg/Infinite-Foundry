# M9 Playfeel Round 17 — structural preview caching

## 目的
Round 16までのperformance監査後も `playfeel-v1.2.js` のframe-rate derived UI loopから、直接UPGRADEの仮想Throughput計算とSTATUS Module配置previewが高頻度で呼ばれていた。低〜中性能mobileでのmain-thread / GC負荷をさらに下げつつ、入力直後の購入可否・Automation・Module判断の正しさを変えないことを目的とする。

## 観察
- `upgradeOutcome()` は購入可能な設備について仮想stateを作り、upgrade後のwhole-line Throughputを計算する。
- `modulePlacementPreview()` も候補配置ごとに仮想stateを作る。
- Creditsは自動生産で毎frame変化するが、**購入可能になった後の仮想Throughput結果そのものはCredits残高では変化しない**。
- preview結果を変える主要構造状態は Era、恒久capacity / POWER補正、設備level、Module loadout、cycle終了状態、Overclock active / inactive境界である。

## 設計
`playfeel-round17.js` を追加し、Round 16でラップ済みのcanonical preview関数をさらにmemoizeする。

### Direct upgrade
1. `canUpgrade()` は毎回確認し、Credits不足時はRound 16のcheap unavailable pathをそのまま使う。
2. 購入可能時だけ structural signature を作る。
3. 同じ構造なら過去の `upgradeOutcome` を再利用する。
4. Creditsそのものはsignatureに含めない。

これにより「Creditsが閾値を超えた瞬間」は毎frameの `canUpgrade()` で即時検出しつつ、その後は設備構成が変わるまで仮想state生成を繰り返さない。

### Module placement
`uid + bay + structural signature` をkeyにし、同一loadoutで同じ候補を毎framedeep-previewしない。Module装備変更はsignatureへ含まれるため即失効する。

### Invalidation
signatureには少なくとも以下を含む。
- Era
- Core Efficiency / Module Bay / Power Routing
- cycle ended
- Overclock active boolean
- 全設備level
- equipped Module uid / target / multiplier

Overclockは残秒そのものではなくactive / inactiveでThroughputへの影響が切り替わるため、境界だけをkeyにする。

cacheは小さな上限を持ち、構造変化が長く続いて古いkeyが増えた場合はclearする。

## 非目標
- ゲーム経済・価格・Automation方針の変更
- UI refresh周期そのものの変更
- CSS animationの削減
- exact browser QAの代替

## 検証
`tests/playfeel-round17-contract.test.js` を追加。
- Credits-only changeではupgrade preview call countが増えない
- 設備level変更で失効
- Overclock inactive→activeで失効
- Credits-only changeではModule previewを再利用
- Module loadout変更で失効
- Round 16 → Round 17 loader chainを監視

GitHub上のRound 17 sourceを再構成したlocal fixtureで `node --check playfeel-round17.js` とcontract testをPASS。

## Release gate
Round 17はsource-level performance改善であり、最終release条件は変えない。exact developでfull `npm test`、1440×1000 / 390×844 / 360×800 Chromium render / interaction QAを通してからmainへ進める。
