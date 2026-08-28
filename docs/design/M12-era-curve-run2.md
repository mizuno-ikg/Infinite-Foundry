# M12 Era curve / shorter runs — run 2

Date: 2026-08-29
Branch: `develop`

## Goal

M12 run 1で実装した短いEra durationを維持したまま、Era 4〜6が平坦でEra 7へだけ負荷が集中していた第一段curveを修正する。

基準は1秒optimal botではなく、7〜12 game-sec attentive / 12〜20 game-sec relaxedのhuman-like route。難易度を待ち時間へ戻さず、Foundry Memory / Breakthroughによるretained strengthが後半ほど必要になる形へ寄せる。

## Fixed durations

```text
E1 150s
E2 165s
E3 180s
E4 195s
E5 210s
E6 225s
E7 240s
```

このrunではdurationを再延長しない。

## Target refit

run 1候補:

```text
E1 [2.5, 5, 7, 9]
E2 [7, 14, 21, 27]
E3 [29, 58, 86, 115]
E4 [80, 160, 240, 320]
E5 [250, 500, 750, 1000]
E6 [750, 1500, 2250, 3000]
E7 [2250, 4500, 6750, 9000]
```

run 2実装値:

```text
E1 [2.5, 5, 7, 9]
E2 [7, 14, 21, 27]
E3 [27, 54, 81, 108]
E4 [97.5, 195, 292.5, 390]
E5 [362.5, 725, 1087.5, 1450]
E6 [1050, 2100, 3150, 4200]
E7 [2950, 5900, 8850, 11800]
```

意図:

- E1/E2はfresh first-attempt clearable帯を維持する。
- E3は115→108へわずかに緩和し、fresh attentiveでは境界、relaxedでは失敗が自然に出る帯へ戻す。
- E4は320→390へ引き上げ、M11の30 Memory Automation付近を使う中盤壁にする。
- E5は1000→1450、E6は3000→4200、E7は9000→11800へ段階的に引き上げる。
- native `eraScale = 2.45^(era-1)` で割ったfinal targetも E4→E5→E6→E7 で上昇し、後半ほどretained strengthを必要とするcontractを追加した。

## Human-route surrogate fit

この実行環境では通常の `git clone https://github.com/...` が引き続き `Could not resolve host: github.com` で失敗するため、GitHub Actionsは使用せず、connectorで確認した現行engine / Prestige / human proxy仕様を同じ式で再現したローカルsurrogateで32 seedsを比較した。

surrogateはtarget候補の相対比較用であり、正式なNode human proxy exact結果ではない。RNGのModule抽選列まで完全同一ではないため、release gateの証拠としては扱わない。

採用候補の概況:

```text
attentive median attempts
E1 1 / E2 1 / E3 1 / E4 2 / E5 2 / E6 8.5 / E7 12
route median cycles ≈ 29
final Memory median ≈ 155

relaxed median attempts
E1 2 / E2 1 / E3 4 / E4 2 / E5 7 / E6 12 / E7 14
route median cycles ≈ 44.5
final Memory median ≈ 218
```

Memory帯のsurrogate中央値:

```text
attentive entry → first clear Memory
E3 15 → 25
E4 25 → 40
E5 40 → 53
E6 53 → 92.5
E7 92.5 → 155

relaxed entry → first clear Memory
E3 20 → 38
E4 38 → 50
E5 50 → 80.5
E6 80.5 → 144
E7 144 → 218
```

解釈:

- 30 Memory AutomationはE3/E4付近で効き始める。
- 60 Memory Module BayはattentiveではE6攻略中、relaxedではE5攻略中に入る。
- 110 Memory Efficiency II / 130 Memory Recursive Capitalは主にE6〜E7のcatch-upになる。
- Breakthroughがあるためattempt数は完全な単調増加にはならない。これは「小進捗→閾値で大進捗」のM11設計上、意図したノコギリ状の救済である。
- ただしE5〜E7全体で見れば必要Memoryと周回数は明確に後半へ寄る。

## Cadence telemetry

`tools/balance/human-proxy.js` に以下を追加した。

- cycleごとの `moduleRecoveries`
- cycleごとの `automationUpgrades`
- Era別配列 `moduleRecoveries[]` / `automationUpgrades[]`
- summaryの `moduleRecoveriesP50` / `automationUpgradesP50`

M12 run 1でModule recovery / Automation cadence自体はduration比へ変更済み。今回のtelemetry追加により、M12 exact再実行時とM14 ×8監査で「短縮した結果、イベントが消えた／高速時だけ操作密度が跳ねた」を同じoracleで検出できる。

## Contract updates

`tests/human-balance-contract.test.js` に以下を固定した。

- duration = `150/165/180/195/210/225/240`
- final target = `9/27/108/390/1450/4200/11800`
- native era scaling後もE5→E6→E7のrequired retained strengthが上昇すること
- human proxyがModule / Automation cadence telemetryを公開すること
- 短縮runでもModuleが少なくとも回収されること

default `npm test` は既にこのcontractを含む。

## Verification status

- `engine.js`更新commitのGitHub diffを確認し、変更はEra 3〜7 targetsのみ。
- `main` / Pagesは変更していない。
- Actionsは使用していない。
- clone / Node exact testはcontainer DNS制約で未実行。
- exact human proxy / default testは実行経路が戻った時点でM12 final gateとして再実行する。

## M12 status

M12の設計・実装は第二段まで到達。後半curveと計測器は揃ったが、正式Node proxy exact値をまだ取れていないためM12完了扱いにはしない。

次回はconnector経由でexact実行可能な別経路がないか再確認し、無ければsource-level contractを追加監査する。Node経路が戻り次第、attentive / relaxed 12〜24 seedsで次を確定する。

1. E1/E2 first-attempt clear率
2. E3 boundary
3. E4〜E7 attempt p50/p90
4. Memory 30/60/110/130到達時のEra
5. Module recovery p50
6. Automation upgrade p50
7. Focus off / losingで後半curveが崩れないこと

exact結果がsurrogateから大きく外れる場合だけtargetを再fitする。
