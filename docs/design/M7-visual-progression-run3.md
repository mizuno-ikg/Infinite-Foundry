# M7 visual progression — run 3

## Goal

M7の最大弱点だった「7 Eraがゲーム進行として存在しても、画面では同じ工場の色違いに見える」を解消する。Infinite Foundryの最重要価値である、**数字ではなく画面そのものが成長する感覚**を、外部画像に依存しないCSS/DOMレイヤーとして実装した。

## Visual progression

- **Era I / Workshop** — 低い工房、煙突、配管、近距離の熱。背景構造を抑え、まだ小さい場所から始まる。
- **Era II / Automated Factory** — ガントリー、信号格子、高い自動化塔。機械名も FEED ARRAY / ROBOT CELLS / SMART BELTS / AUTO ASSEMBLY へ変化する。
- **Era III / Industrial City** — 工場の背後に工業都市スカイラインが形成され、個別工場ではなく都市全体が機械に見える。
- **Era IV / Planetary Foundry** — 惑星の曲率を見せ、軌道エレベーターが地表から上空へ走る。物流設備も ORBITAL LIFT / ORBITAL YARD へ変化する。
- **Era V / Stellar Forge** — 捕獲された恒星とcollector orbitを工場上空へ表示。FUSION FORGE / DYSON RELAY / STAR FOUNDRYとして星そのものを設備化する。
- **Era VI / Law Foundry** — 通常の建築物より幾何学・回転する法則格子を前面にし、FIELD SOURCE / CONSTANT PRESS / CAUSAL LINK / LAW ENGINEへ抽象化する。
- **Era VII / Universe Foundry** — 原始宇宙の球体を形成し、PRIME MATTER / COSMIC FURNACE / SPACETIME WEAVE / GENESIS ARRAYへ到達する。

## Intra-era growth

Era変更だけでなく、同一周回内でも `sustained throughput / final target` と設備level総量から `data-growth=0..3` を計算する。成長段階に応じてガントリー・塔・大型構造を順次可視化するため、設備購入による進歩が背景にも現れる。

このvisual growthはsimulationへ影響せず、経済ロジックと演出を分離している。×1/×2/×4の結果不変性も壊さない。

## Machine identity

同じ5 bottleneck stageを維持しながら、各Eraで機械の名称・アイコン・副題を差し替える。ゲームルールを再学習させず、世界規模だけが拡大したことを理解できるようにする。

## Accessibility / delivery

- 追加visual layerは `aria-hidden=true` で装飾扱い。
- `prefers-reduced-motion: reduce` では追加animation/transitionを停止する。
- 外部画像・フォント・CDNを使わず、GitHub Pagesで静的配信できる。
- `tests/visual-contract.test.js` で7 Era identity、主要visual node、growth tier、reduced-motion fallback、HTMLからの読み込みを回帰検査する。

## Files

- `era-visuals.css` — Era固有背景・巨大構造・animation・mobile縮尺。
- `era-visuals.js` — decorative DOM生成、Era別machine identity、同一Era内growth tier。
- `index.html` — 上記2ファイルを読み込む。
- `tests/visual-contract.test.js` — visual contract static regression。

## Remaining M7 work

視覚のスケール差は成立したが、M7全編完了にはまだ次が残る。

1. 各Eraでのstory beat / directive narrativeを画面上の進行とより密に接続する。
2. 後半Eraのゲームプレイが単なる数値倍率にならないよう、既存stage bias・Patent・Moduleの違いをプレイヤーが感じられる形へ強める。
3. 実ブラウザrenderで7 Era代表画面を確認し、mobileで巨大visualが前景UIを阻害しないかbug huntする。
4. M7を通した後、M8で後半Eraの容易すぎるbalanceを再調整する。
