# M7 — Domain Protocols / representative render QA

## 目的
M7後半の最大リスクだった「Eraが進んでも倍率と色が変わるだけ」を解消し、同じ5-stage production grammarを維持したまま、Eraごとに投資判断の癖・物語・見た目を変える。

## Domain Protocols
プレイヤーをmodal choiceで止めず、通常の設備投資とOverclockへ重ねる。

| Era | Protocol | ゲーム上の差 |
|---|---|---|
| I Workshop | Manual Discipline | 基準。live bottleneckを学ぶ |
| II Automated Factory | Autonomous Reclaim | bottleneckだったstageへの手動投資で8% cost回収 |
| III Industrial City | Logistics Dividend | TRANSFER投資で18% cost回収 |
| IV Planetary Foundry | Orbital Coupling | SOURCE / TRANSFERをlevel差1以内で伸ばすと12% cost回収 |
| V Stellar Forge | Thermal Bank | PROCESS / POWER投資でthermal charge。次Overclockを+2s（最大3 charge保持） |
| VI Law Foundry | Law Symmetry | 5 stage level spreadが2以内になる投資で15% cost回収 |
| VII Universe Foundry | Genesis Resonance | 5 stageすべてのminimum levelが上がるたびfinal targetの12%相当credit grant |

Protocolはランダム下振れを必須条件にせず、選択待ちで工場を止めない。Automation Memory内部の自動購入にはProtocol rebateを適用せず、プレイヤーが画面を見て正しく投資することへ小さな優位を残す。

## Story beats
各Eraの4 Directive評価へ短いarchive narrativeを接続した。単独のストーリー画面は開かずSYSTEM LOGへ流れるため、生産は継続する。Workshopの「lineがmachineになる」から、Industrial Cityの「city is the factory」、Planetary/Stellar/Lawを経てUniverse ignitionへスケールする。

## Browser QA
GitHub Actionsにdependency-free Node testsと、実Google Chromeを使うrender smokeを追加。

代表Eraは I / IV / VII、viewportは desktop 1440×1000 / mobile 390×844。合計6 renderについて以下を機械確認する。

- `data-era` が対象Eraへ更新される
- horizontal overflow = 0
- `.era-world` が存在
- Domain Protocol UIが存在
- Era固有machine identityが反映（SOURCE / CRUST MINES / PRIME MATTER）
- screenshotが正常生成され、10KB超の実体を持つ

QA専用の `?qaEra=N` は localhost / 127.0.0.1 でのみ有効。公開GitHub Pagesでは進行を書き換えない。

CI run `33035092693` はNode test・Browser render smoke・artifact uploadすべてsuccess。artifact `browser-render-evidence` に6 PNGと `report.json` を7日保持する。

## Visual bug hunt
6画面を目視確認。

- desktop: Workshop / Planetary / Universeで背景・machine identity・スケール差を明瞭に確認。Universeではproto-universeが主役として視認できる。
- mobile: 390px幅で横overflowなし。viewport内でfactory main sceneが優先され、設備カードは縦スクロールの流れに収まる。
- Domain Protocolはdesktop side panelで可視。mobileでは下方へ続く情報としてDOM上に存在し、factory viewを潰さない。
- 重大なclip / overlap / broken visualは代表6画面で見つからなかった。

## M7 exit判断
Era progression、first-clear→Patent→next Era、7 Era ending、visual identity、同一Era内growth tier、Domain Protocol、story beat、desktop/mobile representative renderが揃ったためM7をexitする。

次はM8。主課題は後半Eraのclear余裕が大きすぎる既知問題、Protocol導入後の経済インパクト、死に設備、転生反復、×4操作性、random seed下振れ、save migrationを実プレイ/大量seedで再バランスすること。
