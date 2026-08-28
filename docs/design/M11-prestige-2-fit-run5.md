# M11 — Prestige 2.0 numerical fit / gate close

## 目的

M11で実装したFoundry Memory / Breakthrough / Research Focusをhuman-like proxyで数値fitし、Research Focusが「常時ONが正解」ではなく、負けそうなrunを将来progressへ変換する低頻度の選択として機能することを確認する。同時に、Breakthroughが実プレイ中に意味のある時点で到達するようthresholdを調整し、M11 gateを閉じる。

## 実行経路

通常の`git clone`は今回もChat execution containerから`github.com`をDNS解決できず失敗した。一方、GitHub connectorから`develop`のblobを取得できたため、`engine.js` / `prestige-m11.js` / `tools/balance/human-proxy.js`と、proxyが利用するEra mechanicsをlocal Node実行環境へ復元してsource-level simulationを実施した。

Actionsは使用していない。`main` / Pagesも変更していない。

## 調整前の問題

production-scaled化とmicro-salvage floor後のResearch Focusを複数seedで測ると、Focus `losing` が強すぎた。

概況:

- attentive / Focus OFF: finish 100%、cycles p50 約16、final Memory p50 約123
- attentive / Focus losing: finish 100%、cycles p50 約24、final Memory p50 約275
- relaxed / Focus OFF: finish 100%、cycles p50 約22、final Memory p50 約147
- relaxed / Focus losing: cycles p50 約27、final Memory p50 約309

現runを多少遅らせる代わりにMemoryが2倍前後まで膨らみ、Research Focusを使わないことが長期的な損に見える。これは「負けrunの回収策」という設計意図より強い。

## 調整

### 1. Research Data正規化を15秒 → 30秒へ

Research Focusは引き続き実際のproduction valueの18%をdivertするが、1 Research Dataに必要な生産量を増やした。

```text
diverted = produced × 0.18
1 Research Data = final target × 30 game-sec × 0.18
researchData += diverted / unit
```

つまり時計だけでは増えず、final target相当の生産を30 game-sec維持して初めてResearch Data 1相当になる。

### 2. Research由来Memoryを半減 + cap

旧:

```text
research bonus = min(8, floor(researchData))
```

新:

```text
research bonus = min(4, floor(researchData / 2))
```

Research 2単位ごとに+1 Memory、1 run最大+4 Memoryとした。通常progress、checkpoint、Era係数、勝利bonusはそのまま残る。

### 3. proxyの「losing判断」を35% → 60%へ

human proxyでは、final target paceが55%未満でもEra序盤35%時点から研究へ寄せるのは早すぎた。`losing` policyはEra時間60%経過後かつpace <55%でFocusをONに変更した。

これはゲーム本体の強制挙動ではなく、balance oracle上の人間的な利用モデルである。

## 調整後のhuman-like measurement

6 seedsのsource-level local simulation。sampleは小さいためrelease exact値ではなくM11 fit判断用。

### 180 thresholdのまま

- attentive OFF: cycles p50 約17 / Memory p50 約120
- attentive losing: cycles p50 約21 / Memory p50 約149
- relaxed OFF: cycles p50 約23 / Memory p50 約153
- relaxed losing: cycles p50 約26 / Memory p50 約168

FocusのMemory優位は残るが、旧版の2倍超から約10〜25%程度へ縮小した。通常runのMemory/cycle中央値もFocus有無で概ね6〜7に収束し、Focusが恒久進行の主エンジンにはならない。

## Breakthrough reach fit

旧thresholdは12 / 30 / 60 / 110 / 180だった。

Focus OFFの通常routeでおおむね:

- attentive: 12 ≈ cycle 2、30 ≈ 6、60 ≈ 10、110 ≈ 15、180は多くのseedでending前に未到達
- relaxed: 12 ≈ 3、30 ≈ 8、60 ≈ 14、110 ≈ 19、180はending前に未到達

180 Memoryの`RECURSIVE CAPITAL`は「存在するが通常playでは使う場面がない」状態だったため、late-game catch-upとして到達しうる位置へ移す必要があった。

候補の到達性を8 samplesで比較すると、Focus OFFでも130 Memoryはattentiveで6/8、relaxedで8/8がending前に到達した一方、140〜150では急に未到達が増えた。そのため最終thresholdを **180 → 130** とした。

新Breakthrough列:

```text
12  CAPITAL RECALL I
30  AUTOMATION SCHEMATICS
60  EXPANDED MODULE BAY
110 DEEP PROCESS MEMORY
130 RECURSIVE CAPITAL
```

130到達時はCapital LV3 floorが有効になり、周回が増えたプレイヤーほど終盤でcatch-upを受けやすい。

### 130 threshold後

6 seedsの概況:

- attentive OFF: finish 100%、cycles p50 約18、Memory p50 約136
- attentive losing: finish 100%、cycles p50 約20、Memory p50 約152
- relaxed OFF: cycles p50 約23、Memory p50 約160
- relaxed losing: cycles p50 約23、Memory p50 約165

Research Focusは「使えば必ず長期的に圧勝」ではなく、負けそうなrunで少し将来progressを増やす選択へ収束した。relaxed sampleではclearまでのcycle数をほぼ増やさず、Memory差も小さい。

## 最初のmeaningful failureの見え方

proxyでは最初のmeaningful failureから概ね2〜3 Memoryを得るseedが多かった。

continuous Starting Credits bonusは:

- Memory 2: +約3.27 credits
- Memory 3: +約4.12 credits

fresh Era 1のbase 20 creditsに対して約+16〜21%。したがって最初の失敗直後から「次runの開始値が明確に増えた」と読める。

## Legacy migration sanity

migration式は維持した。

```text
Memory = round(
  (unused BP + purchased-upgrade invested BP) × 1.5
  + completed eras × 8
  + successful cycles × 3
)
```

例:

- 10 unused BP + Efficiency LV1へ8 BP投資済み → invested 18 → 27 Memory。序盤資産を失わずCapital Iへ到達するがAutomation 30直前に留まる。
- first-level upgrade一式へ38 BP投資 + 8 unused BP + completed Era 3 + successful cycles 5 → 69 + 24 + 15 = 108 Memory。中盤まで遊んだ旧saveはModule Bayまで保持し、Deep Process 110の直前から再開する。

既存資産を消さず、旧saveだけが全Breakthroughを即取得するほど過大にもしていない。

## Contracts / validation

`tests/prestige-m11-contract.test.js`へ以下を固定した。

- 30 final-target-equivalent game-sec = Research Data 1
- Research由来Memoryは1 run最大+4
- immediate abort = 0 Memory
- micro Focus tickはResearchが正でもmeaningful floor未満なら0 Memory
- meaningful partial runは最低1 Memory
- awardはrun内idempotent
- 60 MemoryでAutomation / Module Bay floor
- 130 MemoryでRECURSIVE CAPITAL / Capital LV3 floor
- legacy saveはMemoryへ非ゼロmigration

復元したlocal Node sourceでprestige contractとsyntax checkはPASS。full browser exact integrationはM15へ残す。

## M11 gate判定

M11は完了扱いとする。

- meaningfulな各runでcontinuous Memoryが増える: PASS
- 最初のfailureから次runのStarting Credits差が見える: PASS
- threshold Breakthroughが周回中の意味あるタイミングで発生: PASS
- Research Focusがproduction依存で、待機farm / micro-salvage farmを防止: PASS
- Focusが通常progressを支配せず、losing-runの回収策として成立: PASS
- early salvageでMemoryをbank: 実装済みcontract維持
- legacy migration: 実装済み、sanity確認
- retained progress before→after UI: 実装済み

次はM12でEra duration / target / checkpoint / protocol compensationを一括refitする。M11の数値を理由に現行の長いEra durationを温存せず、attentive / relaxed proxyを主oracleとしてEra 1〜2 fresh first-attempt clearと、Era 5〜7の凸状retained-strength依存を作る。
