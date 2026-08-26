# M1 広域調査 — Incremental / Idle / Factory / Loop Design

確認日: 2026-08-27 (JST)

## 目的

Infinite Foundry の本格設計・実装前に、インクリメンタル/Idleの学術研究、高評価作品、期限・転生・工場自動化・視覚成長に近い作品を横断し、表面的な模倣ではなく「採用したい設計原則」「避けたい失敗」「M2で深掘りすべき対象」へ圧縮する。

この文書は M1 の広域調査メモであり、Version 1.0 の確定仕様ではない。ユーザーと既に合意済みの要件（自動生産主体、初回ノルマ約5分、×1/×2/×4、オフライン進捗なし、停止しないランダム要素、期限失敗→転生、視覚的成長、PC/スマホ、エンディングあり）を変更しない。

---

## 1. 研究から得たジャンルの骨格

### Playing to Wait: A Taxonomy of Idle Games (CHI 2018)

Alharthi et al. は66本のidle gameと10本のnon-idle gameを分析し、プレイ、報酬、インタラクティビティ、進行速度、UI等を分類した。特に重要なのは、idle gameがプレイヤーの重心を **playing から planning へ移す** と整理している点である。Incremental gameについては、資源を生み、蓄積を待ち、その資源で生成プロセスの一部または全部を自動化する内部経済を持ち、報酬曲線・ボトルネック・plateau・経済モデルが深さを作ると論じている。

Infinite Foundryへの示唆:
- クリック精度や連打ではなく、設備投資・構成・ボトルネック解消・期限への配分判断を主役にする。
- 自動化は単なるQoLではなく「プレイヤーの役割が作業員→工場設計者へ昇格する」進行そのものとして扱う。
- plateauは待ち時間として置かず、「新設備、新資源、新ルール、新しい工場スケール」を要求する変曲点として使う。

Source: https://research.monash.edu/en/publications/playing-to-wait-a-taxonomy-of-idle-games/
DOI: 10.1145/3173574.3174195

### Busy doing nothing? What do players do in idle games? (IJHCS 2019)

Cutting et al. は Neko Atsume のプレイヤー1972人を調べ、idle gameのengagementは1回の長い没入だけでは捉えにくく、短い確認行動や習慣として成立し得ると報告している。また idle を「progress while on」と「progress while gone」に分けて論じる。

Infinite Foundryへの示唆:
- オフライン進捗を採用しなくても、**progress while on** 型として短時間に確認・判断できる設計は成立する。
- 「閉じている方が得」という攻略は採らず、開いている間は自動で進み、プレイヤーは必要な時だけ介入できる形を狙う。
- 短いセッションで意味ある判断を完結させる。初回ノルマ約5分と×4速度はこの方向と整合する。

Source: https://eprints.whiterose.ac.uk/id/eprint/135461/
DOI: 10.1016/j.ijhcs.2018.09.006

---

## 2. 作品横断サーベイ

### A Dark Room — 「UI自体が世界として成長する」

公式press kitは、最初の単一ボタンから世界が展開し、新しい情報とinteractivityが徐々に明かされ、プレイヤーに戦略と視点の変更を要求する作品として説明している。

採用候補:
- 最初から大量のlocked tabを見せない。
- 工房→工場→都市→惑星…の到達に合わせ、UI領域・設備パネル・背景・操作そのものを追加する。
- 新機能解禁を「メニューが増えた」だけではなく世界の拡大として演出する。

避けたいこと:
- Infinite Foundryは視覚成長を最重要価値にしているため、A Dark Roomの極端なtext minimalismそのものは模倣しない。

Source: https://press.doublespeakgames.com/adr/index.html

### Universal Paperclips — 「同じ目的が、段階ごとに別ゲームへ変形する」

Frank Lantz自身のインタビューでは、クリックによる手作業から自動生産へ移り、指数的に力を得ていくclicker/incrementalとして説明されている。作品は市場・計算・惑星/宇宙規模へスケールし、最終的に明確な終点を持つことで知られる。

採用候補:
- 「生産力を上げる」という同じ目的を保持しつつ、スケールが変わるたびに主要判断を変える。
- 工房の炉効率を考えていたプレイヤーが、終盤では恒星資源・物理定数・宇宙生成を扱うようにする。
- mechanics と物語を別々に置かず、ノルマを追う行為そのものが産業AIの物語になるようにする。

避けたいこと:
- 数字とテキストだけでスケール変化を伝えない。Infinite Foundryでは視覚変化も必須。

Sources:
- https://www.ycombinator.com/blog/frank-lantz-director-of-nyus-game-center-and-creator-of-universal-paperclips/
- https://www.decisionproblem.com/paperclips/

### Antimatter Dimensions — 「多層prestige + 大量automation + unfolding」

Steam公式説明では、複数層のunlock、prestige、achievement、challengeを持つ "highly unfolding" なIdle Incrementalであり、Infinityの先にさらに多くの発見があり、極めて多くのautomationを解禁していくことを売りにしている。

採用候補:
- 1回の転生だけでなく、世界スケールが上がる節目で「転生の意味自体が変わる」多層構造。
- 一度理解した低層操作はautomation/永続解禁へ移し、プレイヤーの注意を新しい層へ送り続ける。
- challengeは単なる数値増加ではなくルール変化として使う。

避けたいこと:
- 複雑さの総量を目標にしない。Version 1.0は明確なエンディングへ収束させる。
- 数十〜数百時間前提のfeature bloatをそのまま持ち込まない。

Source: https://store.steampowered.com/app/1399720/Antimatter_Dimensions/

### NGU IDLE — 「長期継続をunfolding featureで支える」

Steam公式説明は、数百のupgrade/boss/lootに加えて、進行に応じてfeatureが展開し、IdleとActive playの混合を特徴として挙げる。

採用候補:
- 一つの大きなupgrade treeを最初から見せるのではなく、一定の節目で新しい遊びを増やす。
- active操作は必須連打ではなく、短期的な最適化・判断・回収などの追加便益に限定する。

避けたいこと:
- 「コンテンツ量=面白さ」と考えてupgradeを無制限に増殖させない。
- 数か月〜年単位の完走時間はInfinite Foundryの初回公開目標に合わない。

Source: https://store.steampowered.com/app/1147690/NGU_IDLE/

### Factory Town Idle — 「ボトルネックを読ませるIdle工場」

Steam公式説明では、序盤はクリック採取・建築から始まり、成長すると自動管理ツールを獲得する。詳細なproduction statsでbottleneckを特定し、production limit/priorityで資源配分を調整する仕組みを持つ。

採用候補:
- 生産系を単純な `設備数 × 倍率` だけにせず、採掘→精錬→搬送→組立→電力のうち最も弱い箇所が実効生産を制限する。
- bottleneckを表だけでなく工場の色・発光・滞留・速度差などで見せる。
- 自動管理解禁を「プレイヤーの役割が上位へ移る」証として扱う。

不採用:
- 同作の away-time / Time Token型fast-forwardは、Infinite Foundryでは明示的に採らない。ゲームを閉じることを最適戦略にしないため。

Source: https://store.steampowered.com/app/2207490/Factory_Town_Idle/

### Increlution — 「期限/死/転生/自動実行」の最重要近縁例

Steam公式説明では、時間圧が増え続け、最終的な死が不可避である一方、前世で得たInstinctが永続的改善として残る。step-by-step queueにより行動を計画し、ゲームが自動実行するため、micro-managementやclickingではなくplanning/strategyが主題とされる。ストーリー進行と明確な完走構造も持つ。

Infinite Foundryへの適合度が非常に高い。

採用候補:
- **失敗/死を例外イベントではなく基本ループの必須教材にする。** 最初の約5分で一度失わせ、次周で明確に改善させる。
- 周回内成長（Generation相当）と永続成長（Instinct相当）を明確に分離する。
- 期限があるからこそ、クリック速度ではなく「どの設備をいつ増やすか」を問う。
- 既に自動化した工程は次世代で繰り返し手動操作させすぎない。
- 最終的にストーリー上の終点を持たせる。

差別化:
- Increlutionは時間管理/queue中心。Infinite Foundryは **工場の視覚成長 + 生産ボトルネック + ランダムモジュール + 産業スケール変化** を主役にする。
- Infinite Foundryは「ゲームを閉じた時間」をbank/fast-forwardする仕組みも採用しない。

Source: https://store.steampowered.com/app/1593350/Increlution/

### (the) Gnorp Apologue — 「numbersに対応したvisual + build synergy」

公式サイトは "visuals to match the numbers" を明示し、生成と回収の両方を担う多数のgnorp/structure、upgrade、Talent Stone、status effect等を組み合わせる戦略型incrementalとしている。生成だけでなく、生成したshardを回収しなければ使えないため、自然なbottleneckが存在する。

採用候補:
- **数字の増加を画面内の主体・設備・物流量の増加として見せる。**
- 単一の最適upgrade順ではなく、設備・module・statusのsynergyで「今回の工場ビルド」を作る。
- 生成力と搬送/回収力を分離し、見た目で詰まりを認識させる。
- prestige報酬を単なる経過時間ではなく「前周より高い実効生産/処理記録」に結びつける案を検討する。

Source: https://gnorp.dev/

### Orb of Creation — 「選択とsynergyをincrementalの主役にする」

2026年6月正式リリース。Steam公式説明はnon-idle incremental-puzzleとして、spell setup、artifact、alchemy等の大量の組合せとsynergyを重視し、新しいlayerが既存layerと絡み続ける構造を特徴としている。

採用候補:
- upgradeを単純な `+10%` だけにせず、既存設備の関係を変えるものを一定割合入れる。
- 新layerが旧layerを捨てるのではなく、旧設備の意味を再解釈する設計。

注意:
- active puzzleに寄せすぎると今回の自動生産主体と衝突する。選択は意味を持たせるが、選択待ちで生産を止めない。

Source: https://store.steampowered.com/app/1910680/Orb_of_Creation/

---

## 3. M1時点の採用原則（暫定）

### P1 — Player Attention is a Resource

プレイヤーの注意を常時要求しない。工場は自動で進む。注意を使う価値がある瞬間は、投資、bottleneck解消、module/build変更、期限予測、節目のunlockへ集中させる。

### P2 — First Failure is Tutorial, Not Punishment

初回ノルマ失敗は「想定外の罰」ではなく、転生の意味を教える第1章とする。約5分で到達し、2周目が体感で明確に速く/賢くなる必要がある。

### P3 — Reset Assets, Preserve Mastery

資源、設備レベル、一時moduleなどは失う。一方、発見、automation、設計図、特許、UI便利機能等は適切に残す。転生後に同じ既知作業を長く繰り返させない。

### P4 — No Offline Advantage

ページを閉じたらsimulation clockもproductionも止まる。復帰報酬、away currency、banked fast-forwardも原則なし。×1/×2/×4をゲーム内の正式な速度制御として用意する。

### P5 — Bottlenecks Must Be Visible

数値表を読む前に、工場画面から「どこが詰まっているか」がある程度分かる。設備の稼働率、滞留、発光、animation speed、警告等をゲーム状態と同期させる。

### P6 — Unfold Mechanics, Not Just Numbers

進行の節目では倍率だけでなく新しい判断軸を増やす。工房→工場→都市→惑星→恒星→物理→宇宙の各段階で、画面・資源・設備・意思決定の少なくとも一部を変える。

### P7 — Randomness Creates Runs, Never Dead Ends

ランダムmoduleはbuild差・神周回・発見を作る。一方、最低限のprogressionは確定手段だけでも進められる。ランダム選択を放置しても工場を止めない。

### P8 — Active Input Gives Leverage, Not Chores

クリックは数%〜短時間の便益、タイミング操作、手動overclock等に使い得るが、連打量が勝敗を支配しない。最適プレイが「ひたすらクリック」になる設計は禁止。

### P9 — Every Major Scale Change Needs a Visual Payoff

新設備・新層・新世界は、実効生産だけでなく画面構成を変える。特に背景、機械数、物流、光量、都市/軌道/天体の出現を使い、成長を一瞥で理解できるようにする。

### P10 — Finite Arc Before Endless Mode

Version 1.0は明確なendingへ収束させる。無限modeは完走後のoptional layerとし、終点のないcontent量を完成条件にしない。

---

## 4. 重要な設計リスク

1. **期限制がidle感を殺すリスク**
   - 対策候補: 工場は自動で回り、速度変更可能。期限は反射神経ではなく投資判断の圧力として使う。

2. **初回失敗が scripted / 茶番に見えるリスク**
   - 対策候補: 初回は「かなり高確率で失敗するが、優れた判断や幸運なら一部中間ノルマを多く取れる」程度にし、失敗までの結果が次周報酬に反映される。

3. **転生が単なる `+X%` 作業になるリスク**
   - 対策候補: automation、新設備branch、module slot、visual tier等、遊び方が変わる恒久unlockを混ぜる。

4. **ランダムmoduleがノルマを運ゲー化するリスク**
   - 対策候補: guaranteed baseline + pity / deterministic craft / recycle等をM3/M4で検討する。

5. **工場の視覚表現と実効生産が乖離するリスク**
   - 対策候補: visual stateをsimulation stateから直接派生させ、飾りだけの設備を増やしすぎない。

6. **多層unfoldingがスマホUIを圧迫するリスク**
   - 対策候補: progressive disclosure、contextual panels、bottom sheet / tabs等をM5で検証する。

7. **×4で意思決定猶予が消えるリスク**
   - 対策候補: 重要unlock/ノルマ接近の通知はUI animation速度とsimulation速度を分離し、必要なら自動的なnotification graceを設計する。ただし選択待ちでsimulationを止めない。

---

## 5. M2へ昇格する重点対象

優先度A:
1. **Increlution** — 期限/死/永続成長/自動実行が構造的に最も近い。
2. **(the) Gnorp Apologue** — visuals-to-numbers、生成/回収bottleneck、build synergyが視覚方針に近い。
3. **A Dark Room** — progressive disclosureと「UIが世界として展開する」設計。
4. **Universal Paperclips** — 目的を保ったままゲーム構造を段階変形し、有限のendingへ到達する設計。
5. **Antimatter Dimensions** — prestige多層化、automation、challenge、unfoldingの長所と複雑化リスク。

優先度B:
- Factory Town Idle — production chain / bottleneck / automation UX。
- NGU IDLE — feature revealとactive/idle混合。ただし規模過大化の反面教師も見る。
- Orb of Creation — synergy/choice設計。active puzzle化しすぎない範囲で参考。
- Cookie Clicker — active bonusイベント、building upgrade、ascensionの基本形を次runで再確認する。

---

## 6. M1の結論

Infinite Foundryは「一般的なoffline idle game」よりも、**期限付き生産runを自動進行させるincremental × 軽いroguelite/meta progression × visual factory management** として設計した方が独自性と既存知見を両立できる。

現時点で最も重要な仮説は次の一文に圧縮できる。

> プレイヤーは工場を手で動かすのではなく、工場が自分で動けるように設計し、その工場が期限に追われながら巨大化していく姿を眺め、必要な瞬間だけ介入する。

次のM2では、特に Increlution / Gnorp / A Dark Room / Universal Paperclips / Antimatter Dimensions を「初回数分」「最初のreset」「unlock cadence」「反復軽減」「visual feedback」「ending」単位で深掘りし、M3の仕様決定に必要な比較表へ落とす。
