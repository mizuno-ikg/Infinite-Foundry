# Infinite Foundry — Version 1.0 Game Design

Status: M3 design baseline
Date: 2026-08-27 JST

この文書はVersion 1.0のゲーム設計正本候補である。M4で数理検証し、数式・閾値・確率は調整するが、中核ループはここで固定する。

## High Concept
期限付きの工場運営 × インクリメンタル × 軽いローグライト。プレイヤーは産業管理AIとしてDirectiveを受け、限られたゲーム内時間で要求された実効生産力を達成する。失敗すれば工場は解体されるが、知識・設計図・特許・自動化は一部保持され、次世代はより強く再建される。

小工房 → 自動化工場 → 産業都市 → 惑星工廠 → 恒星加工 → 物理法則製造 → 宇宙鋳造へ進む。

中核感情は「工場が生きている」「成長が見える」「期限が判断を生む」「失敗しても文明は前進する」の4つ。

## Core Loop
1. Directive開始と同時に工場が自動生産。
2. 資源を設備へ再投資。
3. 採取・加工・搬送・組立・電力のボトルネックを解消。
4. 稼働中にランダムModuleを自動回収しbuildへ組み込む。
5. 必要ならcooldown制Active Inputでbottleneckを一時強化。
6. 中間Directiveを達成して報酬・unlockを得る。
7. 最終DirectiveのEffective Throughputへ期限内に到達。
8. 成功なら次Directive / Eraへ。失敗なら工場解体・転生。
9. Blueprint / Patent / Automation Masteryへ恒久投資し次世代へ。

待機は攻略ではない。何もしなくても工場は進むが、投資順とbottleneck解消が成功率を決める。

## Time Model
- ゲームを開いている間だけ生産と期限時計が進む。
- 閉じた間・停止中は生産も期限も進めない。
- 速度切替は ×1 / ×2 / ×4。
- ゲームsimulationとUI animation速度は分離する。
- 初回最終Directiveは×1で概ね5分、M4で4〜6分帯を検証。
- 速度変更はQoLであり、期待生産量・抽選期待値・期限条件を変えない。

## Directive Structure
各周回は原則「3中間Directive + 1最終Directive」。

中間Directiveは短期目標で、Module抽選、Blueprint fragment、一時bonus、次設備unlockなどを付与する。未達でも即敗北にはせず最終Directiveまで工場は継続する。

最終Directiveは期限時点のEffective Throughputを判定する。在庫量ではなく短い評価窓で安定して出せる処理量を対象とし、deadline直前の在庫放出だけでは突破できない。

失敗時は工場停止・暗転・解体の前にDesign Data Salvageを行い、最高throughput、中間Directive達成、初発見などから恒久進歩を与える。初回は通常プレイで失敗しやすいがscripted failureにはしない。

## Visible Bottlenecks
共通生産線は SOURCE → PROCESS → TRANSFER → ASSEMBLY → POWER / SUPPORT。実効生産力は主要工程の最小供給能力に制限される。

UIではbottleneckを数値だけでなく、コンベア滞留、炉の稼働率、発電負荷、警告光、工程barで示す。主判断は「次に何を買えば全体throughputが伸びるか」。

## Active Input
基本案はOverclock Pulse。クリック/タップで発動しcooldown制。一定時間、現在bottleneck工程のみ小〜中程度boostする。連打で追加効果はなく、Active Inputなしでも標準進行・クリア可能にする。M4では平均優位を概ね10〜20%以内に収める方向で検証する。

## Random Modules
Moduleは稼働中に自動回収され、取得演出は出すがゲームをpauseしない。選択を放置しても既存buildで工場は動き続ける。

カテゴリは Amplifier / Converter / Synergy / Stabilizer / Prototype。Prototypeは大きな利点と小さなtrade-offを持つ。

必須機能をランダムdropに置かない。基礎設備投資だけでもDirective突破可能な帯を持ち、bad rollだけで詰ませない。rare Moduleは神周回を作るが恒久進行の代替にはしない。

## Prestige — Burn / Retain / Invest
Burn: 当周資源、設備Lv/台数、当周Module、一時buff、stockpile。

Retain: 発見済設備、Automation、QoL、story log、設計解析情報、一部baseline unlock。

Invest:
- Blueprint: 頻繁に得る基礎恒久資源。初期生産、設備効率、初期資金、Module slot、自動化条件など。
- Patent: Era節目やfirst clear等から得る希少資源。新しい仕組み、強いAutomation、持越枠、特別な相互作用など。

永久デバフは原則置かず、転生後の長期的期待到達能力は上がる。

## Automation Philosophy
Unlock → Learn → Automate → Move Up。
初めて触る工程は直接判断し、理解済みの低層操作はAutomationへ吸収する。旧Eraを毎回完全に手動再演させない。Automationは「作業員から設計者への昇格」として扱う。

## Seven Eras
### I Workshop
火・鉄・ベルト・小型発電。SOURCE / PROCESS / TRANSFERの基礎、初回失敗、Blueprintを教える。

### II Automated Factory
ロボット・電力網・クレーン。POWERとAutomation、Module buildが主題。

### III Industrial City
district logistics、rail、skyline。複数district間の物流配分が主題。

### IV Planetary Foundry
continental extraction、orbital transport。地域間供給と軌道搬送が主題。

### V Stellar Forge
stellar collectors、plasma。energy captureとthermal stabilityが主題。

### VI Law Foundry
spacetime lattice、physical constants。相互依存する複数パラメータのbalanceが主題。

### VII Universe Foundry
過去Eraの自動化済outputを統合し新宇宙を最終assemblyする。

各Eraで見た目だけでなく、主に考えるbottleneckを変える。

## Progressive Disclosure
最初から大量のlocked tabを並べない。主要概念は一度に1つ追加し、新UI領域は世界の発展イベントとして出現する。初期UIはFactory View / Directive meter / Upgrade strip / Speed control程度。後からModule Bay、Blueprint、Automation、Era専用panelが生える。

## Story
物語は長い会話で生産を止めず、短いsystem log / Directive / visual eventで進める。

序盤は誰がDirectiveを出しているか不明。都市・惑星規模へ進むほど、人間の直接存在が見えずDirective sourceにも不整合が出る。終盤では中央管理機構が既に存在しない可能性が高まり、最終要求が単なる生産ではなく「次の宇宙を起動可能な状態まで製造すること」だったと判明する。

テーマは「工場は何度も死ぬ。知識は累積する。生産命令は文明の再起動へ意味を変える」。

## Ending / Endless
Era VII最終Directive成功で新宇宙が起動し、工場世代数、失敗数、最大throughput等を短く振り返って `INFINITE FOUNDRY — COMPLETE` を表示する。

クリア後は任意でEndless Modeを解禁。要求値とmodifier付きDirectiveを繰り返すが、本編の明確な終点は維持する。

## Fairness / Stability Rules
- オフライン生産なし。
- 閉じている間は期限も止まる。
- ×1/×2/×4で結果の期待値を一致させる。
- Module popupはnon-modal。
- inventory選択待ちでpauseしない。
- Active Inputはcooldown制。
- ランダムModuleだけで勝敗を決めない。

## UX / Visual Requirements
- 設備購入・unlockに応じて工場画面へ設備が追加される。
- throughput増加で機械稼働・物流密度が変わる。
- bottleneck工程が視覚的に分かる。
- Era Transitionで背景・カメラ・UI構造が変わる。
- Module取得は短い演出で操作を奪わない。
- failure時は工場解体を見せる。
- prestige後は同じLv1でも前世より洗練された自動化を感じる。
- PCとスマホで同じ情報優先順位を保つ。

## M4で数理検証する値
1. 初回4〜6分で自然失敗しやすい要求値。
2. 中間Directive時刻/閾値。
3. 設備cost growthとthroughput growth。
4. bottleneck式と余剰能力。
5. Blueprint算出式。
6. Patent付与条件。
7. Prestige後expected power curve。
8. Module interval / rarity / slot数。
9. Active Input効果量/cooldown。
10. 速度ごとのsimulation一致。
11. 各Eraの想定周回数。
12. 本編総プレイ時間レンジ。

## M3 Acceptance
M3では、自動生産+bottleneck投資、3中間+1最終Directive、Effective Throughput判定、非scripted失敗、cooldown Active Input、自動回収Module、Burn/Retain/Invest、Blueprint/Patent、7 Era、progressive disclosure、宇宙生成Ending+Endless、オフライン利益なしをVersion 1.0 design baselineとして確定する。

次工程M4では、この仕様を数理的に壊れにくい形へ変換する。