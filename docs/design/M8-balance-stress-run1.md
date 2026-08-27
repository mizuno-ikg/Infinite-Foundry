# M8 Playtest / Rebalance — multi-Era stress run 1

## 目的

M7完了時に残った既知課題「後半Eraが易しすぎる」を、感覚ではなく実装と同じ経済モデルで定量化する。

`tools/balance/era_stress.js` を追加し、7 Era × seeded Module RNG × Domain Protocol × 代表的meta profileを同じactive policyで反復できるようにした。policyは1秒ごとに現在bottleneckへ投資し、Overclockを利用する。Domain Protocolのrebate / Thermal Bank / Genesis Resonanceも適用する。

このstress policyは人間の最適プレイそのものではない。目的は、同じ合理的な操作をEra間で固定し、難易度曲線の相対差とrandom spreadを測ることである。

## 初回計測で見つかった問題

旧Final Directive:

| Era | 旧target | standard policy中央値（概算） | target比 |
|---|---:|---:|---:|
| I | 52 | 82 | 1.6x |
| II | 118 | 318 | 2.7x |
| III | 270 | 907 | 3.4x |
| IV | 650 | 3,276 | 5.0x |
| V | 1,580 | 14,073 | 8.9x |
| VI | 3,900 | 30,069 | 7.7x |
| VII | 10,800 | 108,000前後 | 約10x |

後半ほどdurationが伸び、再投資時間が増える一方、Directive targetの伸びが複利生産へ追いついていなかった。したがって「後半が少し易しい」のではなく、M4のWorkshop曲線をEra scaleへ拡張した時点で難易度が大きく崩れていた。

## 再校正

Workshopは既存のM4校正を保持し、Era II〜VIIのみtargetを更新した。

| Era | 新 checkpoint targets |
|---|---|
| I | 4 / 14 / 30 / 52 |
| II | 20 / 72 / 165 / 310 |
| III | 59 / 214 / 481 / 900 |
| IV | 205 / 756 / 1,670 / 3,200 |
| V | 850 / 3,210 / 7,055 / 14,000 |
| VI | 1,940 / 7,220 / 16,020 / 30,000 |
| VII | 6,400 / 24,900 / 55,100 / 106,000 |

checkpointはstandard profileの同時点throughput中央値を基準に、途中経過でも「だいたい足りている / 遅れている」が読める水準へ引き上げた。Finalはstandard profileで約半数前後が突破する水準を基本にし、最終Eraだけはmax meta時にrandom下振れで長く足止めされないよう約90% clearを狙った。

## 30-seed再計測

同じactive policyでの代表値:

| Era | fresh clear | standard clear | max clear | standard median / target |
|---|---:|---:|---:|---:|
| I | 100%* | 100%* | 100%* | 81.7 / 52 |
| II | 0% | 60% | 100% | 317.7 / 310 |
| III | 0% | 57% | 100% | 907.2 / 900 |
| IV | 0% | 63% | 100% | 3,275.7 / 3,200 |
| V | 0% | 57% | 100% | 14,071 / 14,000 |
| VI | 0% | 53% | 100% | 30,069 / 30,000 |
| VII | 0% | 90% | 90% | 113,306 / 106,000 |

`*` stress policyはほぼ毎秒bottleneckへ再投資しOverclockも使うため、Workshopの「普通の初見」モデルではない。Workshop難易度の正本はM4のordinary Monte Carlo（初回clear約29%）を維持する。

### 解釈

- **fresh metaで上位Eraを直接突破できない**: 上位Eraへ進んだ後もBlueprint / Patentの恒久成長に意味がある。
- **standard metaではII〜VIが約半数〜6割**: 一度の失敗や追加投資が自然に発生し得る。
- **max metaではII〜VIが安定clear**: 転生を重ねても永遠にrandom壁へ閉じ込められない。
- **Era VIIはmaxとstandardがほぼ同一profileになるため約90% clear**: ending直前をRNGだけで長期足止めしない。
- seed spreadはあるが、今回観測した範囲ではstandard中央値を大きく破壊するほどではない。

## 実装変更

- `engine.js`: Era II〜VIIのDirective target再校正。
- `tools/balance/era_stress.js`: 7 Era / fresh-standard-max profile / seeded stress harness。
- `package.json`: `npm run stress:balance` を追加。
- `tests/era-progression.test.js`: Era II target contractを新値へ同期。

## 次にM8で確認すること

1. stress simulatorは合理的なactive policyであり、人間の「放置主体」プレイを代替しない。実ブラウザで×1 / ×4を使った周回を行い、投資頻度が高すぎないか確認する。
2. 上位Eraへ初昇格した直後のmeta実態を、実際の通し進行に近いpolicyで測る。今回のstandard profileが強すぎる / 弱すぎる場合は調整する。
3. fail→salvage→meta purchase→retryを含むprogression simulatorを作り、各Eraの必要prestige回数と全編総時間を確認する。
4. save migration、hidden pause、mobile操作、×4 deterministic behaviorを実Chromeで再監査する。

## 判断

今回の再バランスで、M7時点の「後半に行くほどノルマが事実上消える」状態は解消した。ただしM8完了ではない。次runでは**単発Era clear率ではなく、失敗と恒久投資を含む全7 Era progression**を測り、ゲーム全編の周回回数と所要感を検証する。
