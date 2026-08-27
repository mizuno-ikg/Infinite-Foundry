# M9 — Playfeel Round 6 / Mobile factory density

## 問題

Round 1〜5の統合再監査で、phone幅の4列factoryに構造的な衝突リスクを確認した。

既存mobile layoutでは1設備あたりの横幅が概ね狭い一方、同じカード上端へ次が集中していた。

- 44px高の直接UPGRADE control
- 最低58px幅のUPGRADE cost
- 30px角のmachine icon
- 左上の3本growth pips
- bottleneck ribbon

これはdesktopでは成立しても、375〜390px級phoneでは「操作を設備へ近づける」Round 1の改善が、machine identityを覆う副作用へ転じ得る。renderがまだ取得できない環境でも、CSS geometryだけで高リスクと判断できるため、release前に構造を分離する。

## 設計

phoneではmachine cardを縦方向に3領域へ分ける。

```text
[ UPGRADE / COST — full top strip ]
[ icon / machine identity / throughput ]
[ growth pips                level ]
```

### Direct control

- UPGRADEは左右4px insetのtop stripとして専用領域を持つ。
- touch targetは最低44px高を維持する。
- `UPGRADE` labelは既存Round 1/4どおりphoneで省略し、costを主表示にする。

### Machine identity

- card本文へ上paddingを与え、UPGRADE stripの下から始める。
- icon / name / throughputがbuttonに覆われないことを優先する。
- 390px未満では文字を一段だけ縮めるが、主要数値は残す。

### Growth cue

- growth pipsは左上から左下へ移動する。
- LV表示は右下のままとし、左右で意味を分ける。
- visual growth自体はcard tier / glowでも伝わるため、pipsを上段の主要操作より優先しない。

### Power machine

通常4工程だけ別ルールにすると再び視覚文法が割れるため、POWERも同じtop-strip / padded-content構造へ寄せる。

## 非目標

- 数理バランス変更なし
- UPGRADEのhold timing変更なし
- 4列factoryを縦1列へ変えない
- さらに新しいanimationを追加しない

今回の目的は情報量を増やすことではなく、Round 1〜5で増えた意味のある情報をphone上で衝突させないこと。

## QA

`tests/playfeel-round6-contract.test.js` で以下を監視する。

- Round 5 → Round 6 stylesheet chain
- phone breakpointの存在
- 44px touch target維持
- UPGRADE top strip化
- machine contentの下方分離
- growth pipsのbottom移動
- POWERへの同一文法適用
- narrow-phone fallback

exact desktop/mobile renderは引き続きrelease gate。現在のChatGPT execution containerはGitHub hostnameのDNS解決ができず、git clone / raw downloadからのexact reconstructionが失敗する。GitHub connectorから現在実体は検証できるため、source geometry監査とcontractを先行し、render経路が得られた時点で必ずvisual QAする。

## provenance

- 内部情報源: Infinite Foundry develop Round 1〜5 CSS/JS、2026-08-28時点の統合監査。
- 関連knowledge: Agent-Continuum `knowledge/interactive-ux-feedback-and-automation.md` の対象近接操作、視線移動、touch/input負荷の考え方。
- 適用範囲: Infinite Foundry v1.2 develop phone layout。
- 時間依存性: CSS/layout変更時は再監査が必要。
