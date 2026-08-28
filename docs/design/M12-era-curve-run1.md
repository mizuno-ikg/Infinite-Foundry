# M12 — Era curve / shorter runs, run 1

## 目的

post-release方針に合わせ、長い待ち時間を難易度として使わず、Era durationを大幅に短縮する。同時にcheckpoint targetとModule / Automation cadenceを短いrunへ合わせ、Era 1〜2をfresh normal playでfirst-attempt clear可能、Era 3を境界にする第一段fitを行う。

## 実装

`engine.js` のEra durationを以下へ変更した。

```text
Era 1: 300 → 150 game-sec
Era 2: 360 → 165
Era 3: 420 → 180
Era 4: 480 → 195
Era 5: 540 → 210
Era 6: 600 → 225
Era 7: 720 → 240
```

最長runは12 game-minから4 game-minへ、Era 1は5 game-minから2.5 game-minへ短縮した。

final target / checkpointも短い経済時間へ合わせて第一段refitした。

```text
E1  [2.5, 5, 7, 9]
E2  [7, 14, 21, 27]
E3  [29, 58, 86, 115]
E4  [80, 160, 240, 320]
E5  [250, 500, 750, 1000]
E6  [750, 1500, 2250, 3000]
E7  [2250, 4500, 6750, 9000]
```

## cadence compensation

旧Module回収は初回24〜約60秒、pity 75秒以上、Automation初回は最低75秒だった。runだけ短くするとmechanic自体が発火しにくくなるため、以下をduration比率へ変更した。

- first Module: Era durationの約10〜18%
- first Module pity: 34%
- subsequent Module: 現在時刻 + durationの約12〜22%
- subsequent pity: 現在時刻 + 36%
- Automation first check: `max(30 sec, duration × 18%)`
- Automation subsequent check: `max(8 sec, duration × 5%)`

Overclockの4秒duration / 12秒cooldownは今回は維持した。M14の×8検証前に操作密度を増やしすぎないため、M12ではfast-forward仕様を混ぜない。

## source-level fit

Chat execution containerは今回も`github.com`をDNS解決できずclone不可だったため、GitHub connectorから`engine.js`をline-rangeで復元し、Node上でhuman-like decision loopを再構成して候補を比較した。Actionsは使用していない。

短縮後に旧targetを近い比率で残す案では、attentiveでもEra 1 final ratio p50が約0.38、Era 2が約0.24まで崩れた。duration短縮は単純な時間比target縮小では足りず、短いrun中に購入できるupgrade回数に合わせて序盤targetをさらに下げる必要があった。

現候補のfresh absolute throughput 24 seeds概況:

```text
attentive p10 / p50
E1 10.2 / 10.7
E2 32.1 / 34.0
E3 71.8 / 74.0

relaxed p10 / p50
E1 8.3 / 9.0
E2 26.8 / 28.3
E3 61.8 / 63.7
```

このためE1 final 9、E2 final 27とし、E3 finalは115へ上げてfresh境界へ寄せた。

簡易Prestige route近似4 seedsでは、attentiveはE1/E2 first clear 4/4、E3 2/4、relaxedはE1 2/4、E2 4/4、E3 0/4となった。狙いの「Era 1〜2は通常clear可能、Era 3からretained progress価値が現れる」方向には入った。

一方で簡易routeではEra 4〜6がまだ一発で抜けやすく、Era 7に負荷が集中した。M12はまだ完了ではない。次runでは正式な`prestige-m11.js` + `human-proxy.js`を復元して複数seed routeを実測し、Era 4〜7のrequired retained strengthを凸状へ再fitする。特にEra 5〜7へMemory 60/110/130 Breakthroughの到達時期を対応させる。

## validation

- 復元した変更後`engine.js`で `node --check`: PASS
- fresh human-like absolute throughput比較: 実施
- simplified retained-progress route: 実施
- exact `npm test`: clone/DNS制約により今回は未実行
- browser QA: M15 gateへ保留

`main` / Pagesは変更していない。
