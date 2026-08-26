# M2 重点作品深掘り — 期限・転生・視覚成長・Unfolding

確認日: 2026-08-27 (JST)

## 目的
M1で抽出した候補から、Infinite Foundryの中核課題に直接効く作品を重点分析する。

重点課題は次の6つ。

1. 初回約5分で「失敗→転生」を納得させられるか。
2. 自動生産主体でも、プレイヤーの判断が意味を持つか。
3. 転生後に既知の面倒を再演させず、それでも喪失感を残せるか。
4. 数字の増加を工場の見た目・物流・設備で理解できるか。
5. 新しい層の解禁を、単なる倍率追加ではなく「ゲームが変わった」と感じさせられるか。
6. ランダム性や能動操作が、放置主体の設計を壊さないか。

この文書はM3の仕様確定前の分析であり、ユーザー固定要件を変更しない。

---

# 1. Increlution — 「失敗が基本ループで、前世が次世代を短縮する」

Steam公式説明では、時間圧が上がり続け、最終的な死は不可避。一方、前世で得たInstinctが恒久改善として残り、各Generationではより長く生きられる。行動はstep-by-step queueで計画し、自動実行される。ゲーム自身が「micro-managementやclickingではなくplanning/strategizing」を主題として明記している。

また、周回内で速く上がり大きな効果を持つGeneration levelと、遅いが死後も残るInstinct levelを分けている。これにより、現在周回の勢いと長期メタ進行が同時に成立している。

### Infinite Foundryへ採用するもの
- **First Failure is Tutorial**: 初回ノルマ失敗を例外ではなく、転生システムを教える必須の第1章として扱う。
- **二層成長**: 周回内のFactory Efficiencyと、永続するBlueprint/Patent/Automation Masteryを明確に分ける。
- **失敗は無意味にしない**: ノルマ未達でも到達した最大生産力、解消したボトルネック、発見した設備などから恒久進歩を得る。
- **プレイヤーの役割はplanning**: クリック速度で期限を突破させず、投資順・設備比率・ボトルネック解消で勝たせる。

### 採用しないもの
- queueが空になると自動pauseする設計。Infinite Foundryの「工場は止まらない」と衝突する。
- 何百時間級の有限ストーリー。Version 1.0は短いセッションでも明確な節目を感じ、完走可能な密度を優先する。

### M3への具体案
初回周回は「成功前提」にしない。ユーザーが普通に遊ぶと概ね4〜6分で第1Directiveに未達となり、工場解体演出へ入る。その際、単なるGAME OVERではなく「生産ログ解析→設計情報退避→次世代工場へ」という流れで、失敗がメタ進行の入口だと即座に理解させる。

Source: https://store.steampowered.com/app/1593350/Increlution/

---

# 2. (the) Gnorp Apologue — 「数字を画面上の物流として見せる」

公式サイト/press kitは `visuals to match the numbers`、`visuals that accurately portray the nature of the incremental genre` を明示する。shard生成だけでなく、生成物を回収しなければ資源として使えず、gnorp/structureが生成・回収の双方を担う。Talent Stone、status effect、Zybellium等によるsynergyも中心で、「どう数字を増やすか」をbuildとして考えさせる。

### Infinite Foundryへ採用するもの
- **Visual Throughput**: 生産量を単なる数字ではなく、コンベア上の量、炉の稼働率、搬送の滞留、発電設備の負荷、背景の設備密度として見せる。
- **生成力と搬送力を分離**: 採掘/精錬/搬送/組立/電力の最小能力が実効生産を制限する。
- **Build Synergy**: moduleは単純な+%だけでなく「炉の余剰熱で発電」「搬送速度が一定以上なら組立倍率」等、設備間の関係を変えるものを含める。
- **視覚的な到達報酬**: 大きな生産桁の到達時には、画面側でも新設備・新区画・新背景が必ず増える。

### 採用しないもの
- 画面上の混沌そのものを目的にしない。スマホでもボトルネックが理解できる可読性を優先する。
- build運だけで勝敗を決めない。ランダムmoduleは上振れを作るが、基礎設備の正しい投資だけでも最低限前進できる。

### M3への具体案
工場ビューには常に `INPUT → PROCESS → TRANSFER → ASSEMBLY → POWER` の状態を視覚反映し、最も詰まっている工程だけを強調する。プレイヤーは統計表を開かなくても「ここが詰まっている」が分かる。

Sources:
- https://gnorp.dev/
- https://gnorp.dev/presskit/

---

# 3. A Dark Room — 「UIの段階的開示が、そのまま世界の拡大になる」

公式press kitは、single buttonから始まり、世界が徐々に展開し、新しいinformation/interactivityがrevealedされる作品と説明する。

### Infinite Foundryへ採用するもの
- 最初から大量のlock付きmenu/tabを見せない。
- 工房では「炉」「搬送」「Directive」程度だけを見せる。
- 自動化、研究、Module、都市物流、軌道、恒星、物理法則は世界の発展に合わせてUIとして生えてくる。
- 新しい層の登場をチュートリアルmodalではなく、画面構造そのものの変化で理解させる。

### 採用しないもの
- text-only/minimalist presentation。Infinite Foundryでは視覚成長が主要商品価値。
- 隠しすぎて次の目的が不明になること。Directiveと次のunlock previewは常に短く見えるようにする。

### M3への具体案
各Eraで操作領域を増やすが、一度に新しい主要概念は原則1つだけ追加する。古い概念はautomationへ吸収して「画面が増えるだけ」のfeature creepを避ける。

Source: https://press.doublespeakgames.com/adr/index.html

---

# 4. Universal Paperclips — 「同じ目的を保ったまま、スケールが変わるとゲームも変わる」

作者Frank Lantzは、最初はbuttonでpaperclipを作り、やがて自動生産を獲得し、指数的に強くなり、AIが人間の管理を離れてさらにスケールする構造を説明している。またstandalone experienceとして終点を持つゲーム設計について語っている。

### Infinite Foundryへ採用するもの
- **目的の不変性**: 最後まで「要求された生産力を達成する」。ただし何を生産し、何がbottleneckかはEraごとに変える。
- **mechanic escalation**: 工房→工場では設備購入、都市では物流ネットワーク、惑星では地域間電力、恒星ではエネルギー捕獲、物理法則では相互依存する定数、宇宙では最終Assemblyというように判断の種類を変える。
- **物語と数式を一致**: なぜ要求値が指数的に上がるのか、なぜ人間が消えるのかを、mechanicの解禁そのものとして語る。
- **有限arc**: 明確なエンディングまで設計し、その後にEndlessを任意解禁する。

### 採用しないもの
- 主要なスケール変化をテキストと数字だけで伝えること。
- 次のphaseへ行くと旧mechanicが完全に無意味になる構造。Infinite Foundryでは旧設備が自動化・下層インフラとして残り、世界の巨大化を見せる。

Source: https://www.ycombinator.com/blog/frank-lantz-director-of-nyus-game-center-and-creator-of-universal-paperclips/

---

# 5. Antimatter Dimensions — 「新しいものを解禁し、古いものを自動化する」

Steam公式説明は `highly unfolding`、multiple layers of unlocks/prestige、challenge、`obscene amount of automation` を中核としている。Infinityは終点ではなく次層への入口。

### Infinite Foundryへ採用するもの
- **Unlock → Master → Automate → Move Up** を各Eraの基本リズムにする。
- 一度理解した低層操作は次のEraで自動化し、プレイヤーのattentionを新しいbottleneckへ移す。
- Challenge/Directive変種は「敵HP+50%」のような単純数字ではなく、特定工程の制約やルール変化にする。
- prestigeを一層だけに固定せず、大きなEra遷移では転生資源/意味を変える余地を持つ。

### 採用しないもの
- feature数そのものを価値にすること。
- 複雑なautomation scripting。GitHub Pages/スマホで短いセッションを重視する本作には過剰。

### M3への具体案
工房Eraでプレイヤーが手で買っていた「採掘機補充」などは、自動化工場Eraでは恒久Logicとして処理する。再び同じ購入順を何十回も踏ませない。

Source: https://store.steampowered.com/app/1399720/Antimatter_Dimensions/

---

# 6. Cookie Clicker — 「能動ボーナスは強力だが、今回は上限を置く」

Cookie Clicker Wikiの現行ascension guideでは、active playstyleではGolden Cookie effectsが主要なcookie獲得手段になることを前提にしている。一方、Golden SwitchはGolden Cookieを無効化する代わりにpassive CpSを上げるなど、idle側の選択肢も持つ。Ascensionはprogressをresetして次runを大幅に速め、Permanent Upgrade Slotは通常upgradeを次ascensionの開始時から利用可能にする。

### Infinite Foundryへ採用するもの
- 能動操作は「やると嬉しい」補助として存在させる。
- Permanent Upgrade Slotの思想を、特許/設計図の「次周開始から利用できる既知設備」に応用する。
- 転生時に何を持ち越すかをプレイヤーのbuild選択にできる余地を残す。

### 採用しないもの
- active event comboが通常生産を桁違いに上回る状態。
- ランダムspawnを見逃すとノルマ達成率が大きく落ちる設計。
- prestigeタイミングを長時間の待ち最適化にすること。

### M3への具体案
クリック/タップの便益は、例えば「Overclock Pulse: 10秒間、現在bottleneck工程だけ+15%」程度に制限し、常時連打ではなくcooldown制にする。これなら触る意味はあるが、連打し続けるゲームにならない。

Sources:
- https://cookieclicker.wiki.gg/wiki/Ascension
- https://cookieclicker.wiki.gg/wiki/Ascension_guide
- https://cookieclicker.wiki.gg/wiki/Permanent_upgrade_slots_guide

---

# 7. 横断比較

| 作品 | 期限/失敗 | 永続前進 | 自動化 | UI/視覚成長 | build差 | 有限arc | Infinite Foundryでの担当 |
|---|---|---|---|---|---|---|---|
| Increlution | 非常に強い | Instinct | queue | 弱め | 中 | あり | 期限→敗北→再挑戦の骨格 |
| Gnorp | 弱い | progression/talent | 中 | 非常に強い | 強い | base gameあり | visual throughput / bottleneck / synergy |
| A Dark Room | narrative pressure | progression | 中 | UI unfolding | 中 | あり | progressive disclosure |
| Universal Paperclips | phase goal | progression | 強い | 数字中心 | 中 | 強い | scale change / mechanic escalation / story |
| Antimatter Dimensions | challenge中心 | prestige多層 | 非常に強い | UI unfolding | 強い | 終盤あり | unlock→automate→next layer |
| Cookie Clicker | 弱い | ascension | 強い | 中 | active/idle差 | 実質長期 | active bonusと持越し設計の反面教師/参考 |

---

# 8. M2で確定度を上げた設計判断

## A. 初回失敗はscriptedではなく「高確率の自然失敗」
絶対に負けるscripted tutorialだと投資判断が茶番になる。一方、初見で容易に勝てると転生を学べない。

M3では、標準的な初見プレイなら5分前後で未達になりやすいが、非常に良い投資やrandom上振れなら突破可能、という帯を狙う。失敗してもBlueprintを得るため、どちらでも前進する。

## B. 勝敗指標は「資源残高」より「実効生産力」
資源を貯め込むだけの最適戦略を避けるため、Directiveは主に `effective throughput / sec` を評価する。これなら設備改善・bottleneck解消が目的になる。

## C. ランダムmoduleは自動回収、選択は非停止
module dropは工場稼働中に発生し、自動でinventoryへ入る。装備選択を放置しても工場は既存buildで動く。新moduleは原則上振れ/横方向のbuild差であり、必須keyではない。

## D. Active inputはcooldown制のLeverage
連打をなくすため、click/tapはcooldown付きの短いOverclock、inspection、manual reroute等にする。期待値としてpassiveとの差は小〜中程度に抑える。

## E. 「資産は燃える、知識は燃えない」を三層化
- **Burn**: 資源、設備level、当周module、一時buff。
- **Retain**: 発見済設備、automation、図鑑、操作QoL、story discovery。
- **Invest**: Blueprint/Patent pointsで次周の開始条件・設備特性・持越slotを選ぶ。

これにより「全部失ってダルい」と「何も失わず転生感がない」の中間を作る。

## F. Era changeは数字だけでなく、主ボトルネックを変える
- Workshop: 採掘と炉
- Factory: 搬送と電力
- Industrial City: network/物流
- Planetary Foundry: 地域間エネルギー・熱
- Stellar: 恒星エネルギー捕獲・変換
- Physics: 物理定数同士の依存
- Universe Forge: 全層を統合した最終生産

旧Eraは消さず、自動化された背景インフラとして視覚的に残す。

---

# 9. M3へ渡す未解決点

1. 1周に何本のDirectiveを置き、どこで転生判定するか。
2. 初回5分を×1基準にするか、速度変更を初回から解禁するか。
3. Blueprint/Patentの取得式と、失敗到達率に応じた最低保証。
4. moduleのslot数、rarity、負のtrade-offをどこまで許すか。
5. 7 EraをVersion 1.0の1ゲーム内でどういう時間密度にするか。
6. 人間/中央管理機構/AIの物語をどこまで明示し、どこまでmechanicから推測させるか。
7. Endless Modeで期限構造を維持するか、score attackへ変えるか。

M3ではこれらをVersion 1.0の具体仕様へ落とし、M4で数理検証する。

---

# 10. 結論

Infinite Foundryは、単なるIdle Factoryではなく **deadline-driven incremental roguelite factory** として設計すると特徴が立つ。

- Increlutionから「失敗が前進になる時間圧ループ」
- Gnorpから「数字を物理的な動きとして見せる」
- A Dark Roomから「UI自体が世界と一緒に増える」
- Universal Paperclipsから「スケール変化でゲームそのものを変える」
- Antimatter Dimensionsから「理解済み操作を自動化して次の層へ送る」
- Cookie Clickerから「active操作は魅力的だが強くしすぎるとpassive主体を壊す」

を組み合わせる。

M2時点の最重要設計命題は、**プレイヤーの注意を要求し続けないのに、見て判断した瞬間には生産結果が明確に変わるゲームにすること**である。
