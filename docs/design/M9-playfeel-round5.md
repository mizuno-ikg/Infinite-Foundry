# M9 — Playfeel Round 5: visual hierarchy / time-state cohesion

## Goal

Round 1〜4で直接UPGRADE、opt-in Automation、恒久成長差分、Era briefing、Module preview、蓄積型Overclock、工場成長演出、hold-to-upgradeまで追加した。

Round 5では新機能を増やすより、これらを一体として再監査し、**何を見るべきか / 何が止まっているか / 何が今有効な投資か**を一目で理解できる状態へ寄せる。

## Audit findings

### 1. FINAL DIRECTIVE と checkpoint の役割分離は進んだが、主画面の見出しはまだ FINAL GOAL を十分に宣言していない

右側CHECKPOINTSの説明だけに依存すると、初見では途中目標群と最終勝敗条件を再び同列に読める余地がある。

**Decision:** main directiveへ `FINAL GOAL // FINAL DIRECTIVE DECIDES SUCCESS` を明示し、勝利条件の視覚階層を最上位にする。

### 2. direct upgrade化後も旧selected outlineが残る

設備選択→中央ボタンという旧操作モデルではselected表示に意味があったが、現在の主要操作は設備上のUPGRADEで完結する。selectedのcyan outlineはbottleneckのorange emphasisと競合し、プレイヤーへ「選択してから何かする必要がある」と誤読させる。

**Decision:** selected outlineを視覚上無効化する。内部selected stateは既存Domain Protocol連携等の互換性のため残す。

### 3. 「購入可能」と「今ラインが伸びる」が近い強さで見える

Round 1ではimpactとaffordableを分けたが、cyan affordableも十分強く、全設備が購入可能な局面では視線が散る。

**Decision:** immediate line gain / current bottleneckをamber-hotのprimary action、単に購入可能な設備をneutral secondary actionへ落とす。disabledはさらに弱くする。

### 4. PAUSEしても工場のbelt / smoke等が動き続ける

simulationは停止しているのに視覚世界が稼働し続けると、Pauseの意味が弱くなる。Helpを読む間も通常runでは時間が進んでいた。

**Decision:**

- live runからHelpを開いた場合は自動Pauseし、閉じたら元がrunningだった場合だけresumeする。
- manual pause / intro / Era briefing / hidden tabではfactory内部animationをpauseする。
- ×2 / ×4は待ち時間短縮の状態としてbelt/smokeを**穏やかに**速めるが、4倍のanimation密度にはしない。

### 5. Round 3 ambient growthは追加情報としては有効だが、明るさを主情報より強くしない

**Decision:** factory-driveの最大opacityを少し下げ、設備・bottleneck・directiveを読みやすさの主役として残す。

### 6. AutomationはOFFが安全だが、ON/OFFの視覚差をさらに明確にする

**Decision:** locked / offは静か、delegated modeがactiveな時だけpanel左端と背景をcyanでわずかに強調する。常時派手にしない。

## Research basis

2026-08-28にW3C WAIを再確認した。

- WCAG Technique C39: interaction由来の不要なmotionは `prefers-reduced-motion` で抑制可能にする。
- Understanding 2.3.3: 不要なmotionは注意散漫や身体的不快につながり得るため、ユーザーのmotion preferenceを尊重する。
- Understanding 2.2.2: 並行して動く / 更新される情報はユーザーが制御できることが重要。

Round 5では「演出を増やす」より、time stateとvisual stateの一致、重要情報のhierarchy、motion budgetを優先する。

## Implementation

- `playfeel-round5.js`
  - FINAL GOAL kicker
  - live Help auto-pause / close restore
  - `visual-halt` synchronization
  - restrained speed visual hook
  - Automation panel state classes
- `playfeel-round5.css`
  - directive hierarchy
  - primary / secondary / disabled upgrade hierarchy
  - obsolete selected outline suppression
  - simulation halt時のfactory animation pause
  - moderate ×2 / ×4 motion cue
  - ambient factory glow reduction
  - Automation ON/OFF visual distinction
- Round 4 loaderからRound 5をchain load
- `tests/playfeel-round5-contract.test.js` をlocal test chainへ追加

## QA status

- `playfeel-round5.js`: local `node --check` pass.
- static contractはloader / goal clarity / Help pause / visual halt / upgrade hierarchy / reduced-motion hookを監視する。
- GitHub Actionsは使用しない。
- exact develop artifactのdesktop/mobile browser renderは、この実行環境でrepository一式を取得できる経路を引き続き確保できていないため未確認。release gateとして残す。

## Next audit

Round 1〜5を一体として、次を優先する。

1. mobile 4-column factoryで44px direct buttonとmachine identityが干渉しないか。
2. Help auto-pauseが「読むことによるdeadline penalty」を消し、manual pause stateを壊さないか。
3. ×4 visual cueが速さを伝えつつbusyにならないか。
4. Automation panelがOFF時には安心して無視でき、ON時だけ状態が伝わるか。
5. exact rendered artifact verification経路を確保し、目視でhierarchy / spacing / motionをbug huntする。
