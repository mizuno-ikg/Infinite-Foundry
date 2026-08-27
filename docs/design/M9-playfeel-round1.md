# M9 Playfeel Iteration — Round 1

## 目的

Version 1.1 公開後の実プレイで見えた「操作量が多い」「自動化が勝手に資源を使う」「Module自動交換が全体最適になっていない」「中間目標の意味が分かりにくい」を、見た目とプレイフィールの改善ループ第1段として扱う。

今回の焦点は、経済曲線を大きく変えずに **操作摩擦・ユーザー制御・情報理解を改善すること**。Overclockの根本再設計、Era開始ブリーフィング、世界演出の大幅強化は次ラウンドへ回す。

## 参考にした知見

- Ivar Kerajärvi, *Utilizing automation to reduce repetition in incremental games* (Aalto University, 2023): 反復が増えた古いmechanicをautomationへ移し、プレイヤーの注意を新しい判断へ移す「scrolling window」的な考え方と、player-initiated automationを参考にした。
  - https://aaltodoc.aalto.fi/items/46e3235f-05a1-43a1-8d97-0aedf81a4d4d
- Nielsen Norman Group, usability heuristics: system statusの可視化とuser control / freedomを、Automation・Pause・Checkpoint表示の基準にした。
  - https://media.nngroup.com/media/articles/attachments/Heuristic_Summary1-compressed.pdf
- Game Developer, *Designing Game Controls*: affordanceとaction-feedback correction cycleを、設備そのものに操作を寄せる設計の参考にした。
  - https://www.gamedeveloper.com/design/designing-game-controls

## Round 1 設計

### 1. 設備を直接Upgradeする

各設備の右上に専用 `UPGRADE` を付ける。既存の「設備を選択 → 右パネルのUPGRADE」は内部互換のため残すが、通常プレイでは隠す。

ボタン状態:

- 強調: 現在のBOTTLENECK、または購入で今のThroughputが上がる
- 通常有効: 購入可能だが今すぐ全体Throughputは上がらない
- disabled: Credits不足、Pause、Intro、Cycle終了

右パネルは `BOTTLENECK ANALYSIS` として、現在制約と次の制約を見る用途へ寄せる。

### 2. Automation Memoryをopt-in化する

既存engineにはAutomation Memory取得後に自動購入する処理があるため、UI層でengine advance時の旧自動購入を抑止し、プレイヤー制御のdelegationへ置き換える。

- 初期状態: `OFF`
- Lv1: `ASSIST` 解禁。現在BOTTLENECKだけを対象にし、Creditsを約50%残す
- Lv2: `SMART` 解禁。購入後の即時Throughput改善を比較し、約30%残す
- Lv3: 同じモードをより積極的にし、reserveを緩める

Automationは有効化した時だけCreditsを消費し、実行はSYSTEM LOGへ残す。

### 3. Module自動交換を目的関数で守る

既存の「倍率が低いModuleを、新しい高倍率Moduleで置換」は、対象stageの違いを無視してThroughputを下げることがある。

新Moduleのauto-swap後に、交換前Moduleへ戻した仮想状態を比較し、**交換で現在Throughputが下がるなら自動交換を拒否してSTORAGEへ送る**。手動LOADOUTは引き続き自由。

### 4. Pauseを時間制御として強調する

Help / Statusと同列の小ボタンではなく、速度操作と同程度の視覚重量へ上げる。Pause中は既存仕様どおり生産とDirective時計を停止する。

### 5. DIRECTIVE TRACKをCheckpointとして説明する

表示名を `DIRECTIVE CHECKPOINTS` にし、

- CLEARはSalvageへ寄与
- MISSしてもrun継続
- 最終勝敗はFINAL DIRECTIVE

を画面上に直接説明する。

### 6. STATUSにライブ状態を追加する

STATUSを開いたまま時間が進むため、TIME / THROUGHPUT対GOAL / BOTTLENECK / AUTOMATION modeを表示する。

## 実装方針

- `playfeel-logic.js`: 自動化判断・Upgrade効果試算・Module auto-swap guardを純粋ロジックとして分離
- `playfeel-v1.2.js`: 既存UIを非破壊的に拡張し、engine旧automationを抑止してopt-in制御へ接続
- `playfeel-v1.2.css`: direct controls / Pause / automation / live statusの見た目
- `tests/playfeel-logic.test.js`: automation reserveとModule throughput guardの回帰

既存`engine.js`の数理バランス自体は変更しない。Round 1の操作感を確認した後、クリック密度やOverclockの再設計を次の調査・設計へ回す。

## 今回のローカル確認

- `playfeel-logic.js`: `node --check` pass
- `playfeel-v1.2.js`: `node --check` pass
- pure logic fixture: ASSIST/SMART reserve、Throughputを悪化させるModule swapのrevertを確認

現在の実行環境からGitHub上のdevelop実体をブラウザ描画する経路はないため、exact develop artifactのdesktop/mobile renderは次のQA対象。Actionsは反復開発には使用せず、release候補までbatchする。
