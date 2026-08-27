# Infinite Foundry

**小さな工房から、宇宙そのものを鋳造するまで。**

Infinite Foundry は、期限付きの生産Directiveを突破しながら工場を何度も再構築していく、工場系インクリメンタルゲームです。数字だけではなく、設備・背景・生産領域そのものが Workshop → Automated Factory → Industrial City → Planetary Foundry → Stellar Forge → Law Foundry → Universe Foundry と巨大化していきます。

## Play

GitHub Pages公開後、このREADMEに公開URLを追記します。

ゲームはPC / スマートフォンのブラウザに対応しています。サーバーやアカウントは不要で、進捗はブラウザの `localStorage` に保存されます。

## Core loop

1. 工場は自動で生産します。
2. 5つの工程（SOURCE / PROCESS / TRANSFER / ASSEMBLY / POWER）のうち、最も遅い工程が全体のThroughputを制限します。
3. 稼いだCreditsをボトルネックへ再投資し、期限までにDirectiveの要求Throughputを目指します。
4. Random Moduleは生産を止めず自動回収・自動装備されます。
5. `OVERCLOCK PULSE` は現在のボトルネックを短時間だけ強化します。クリック連打ではなく、使いどころを選ぶ補助操作です。
6. 最終Directiveを満たせなくてもBlueprintを回収して再建できます。設備や周回資源は失いますが、設計知識・恒久強化は残ります。
7. Eraを突破するとPatentを得て、より巨大な生産領域へ進みます。

## Important rules

- **Game speed:** ×1 / ×2 / ×4
- **Offline progress:** なし
- タブを閉じる、または非表示にすると生産も期限時計も停止します。
- Random Moduleや選択UIのために生産が停止することはありません。
- 初回Workshopは約5分（×1）で最終Directiveへ到達します。
- 明確な最終目標としてUniverse Foundryの完了があります。

## Controls

- 工程設備を選択 → `UPGRADE STAGE` で強化
- `OVERCLOCK PULSE` → 現在のボトルネックを一時強化
- `×1 / ×2 / ×4` → simulation speed変更
- Cycle終了後 → Blueprint / Patent upgradeを購入し、再建または次Eraへ昇格
- `SAVE` → 手動保存（通常は自動保存）
- `RESET` → 全進捗を削除

## Development

静的HTML / CSS / JavaScriptだけで動作し、GitHub Pagesでそのまま配信できる構成です。ゲームsimulationは `engine.js` に分離され、seeded RNG・fixed-step simulation・versioned saveを使用しています。

```bash
npm test
npm run stress:balance
npm run stress:progression
```

CIではNode回帰テストに加えて、実Chromeで代表Eraのdesktop/mobile renderと、Prestige → permanent upgrades → Era ascend → ×4 → machine upgrade → save/reloadのinteraction flowを検証します。

設計・調査・バランス検証の記録は [`docs/`](./docs/) にあります。

## Design notes

設計上の主要原則は次の通りです。

- 待つこと自体を難易度にしない。
- 工場は選択待ちで止まらない。
- 閉じることを攻略法にしない。
- 資産は燃えるが、知識は残る。
- ランダム性は周回の個性を作るが、下振れだけで詰ませない。
- 数字の成長を、工場の見た目の成長としても見せる。

## License

Copyright © 2026 mizuno-ikg. All rights reserved. See [`LICENSE`](./LICENSE).
