# M6 Game Foundation — run 1

## 目的
M5のfactory-first visualを維持したまま、Workshopを「見た目だけのprototype」から、失敗・salvage・恒久成長・次周開始まで完結するゲーム基盤へ移行する。

## 実装した基盤
- `engine.js` を新設し、simulation/domain stateをDOMから分離。
- 0.05 game-second fixed stepでsimulationを進め、UI frame rateや×1/×2/×4のreal-time chunk差が経済結果へ影響しにくい構造にした。
- cycle seed由来のxorshift32 PRNGを導入し、Random Moduleの抽選系列を再現可能にした。
- Random Moduleはgame-timeで次回時刻を予約し、80 game-sec pityを保持。初期2 slotへ自動装備し、生産を止めない。
- Directiveは75/150/225/300 game-secで評価。Final Directiveは最後30 game-secのsustained averageを使う。
- deadline到達時にcycle resultを確定し、success/failureどちらでもBlueprint salvageを付与。
- Blueprint恒久投資の最初の4系統を実装: Core Efficiency / Starting Capital / Automation Memory / Module Bay。
- `Burn / Retain / Invest` のうち、周回設備・credits・modulesはrestartでBurnし、Blueprint・恒久upgrade・発見済module等のmeta stateはRetain/Investされる。
- localStorage save schema `infinite-foundry-save-v1` / data version 1を実装。5秒auto-save、manual save、beforeunload保存、明示resetを追加。
- `visibilitychange` ではhidden直前に保存し、復帰時はreal-time差分をsimulationへ加算しない。つまりoffline catch-upなし。

## UI統合
- Cycle / Blueprint表示をheaderへ追加。
- Module Baysをside panelへ追加し、現在装備を可視化。
- cycle終了後にSalvage / Retain / Rebuild panelを表示。Blueprint投資後に次cycleを開始できる。
- failure時も「終了」ではなく、工場解体→設計知識保持→次工場という本作の中核ループへ接続。

## 自動検証
`tests/engine.test.js` を追加し、Node上で以下を検証した。

1. 300×1秒advanceと75×4秒advanceでgame time / credits / seeded module sequenceが一致する。
2. save serialize/deserializeでstage levelが保持される。
3. 300 game-sec到達でcycleが必ずresolveし、failureでもBlueprintを得る。
4. restartでcycle内stateはresetされるがBlueprintは保持される。
5. Blueprintを使った恒久upgradeがmeta stateへ残る。

ローカル作成した同一`engine.js` / test内容について `node tests/engine.test.js` は `engine tests: ok` を確認した。

## 未完 / 次のM6課題
- Browser上の実操作でcycle終了→Blueprint購入→restart→save reloadを通すrender/integration QA。
- Module dropをUI logへイベントとして出す仕組み（現状state表示は更新されるが、新規drop通知イベントをdomainから明示発火していない）。
- Automation Memoryは恒久stateとして存在するがWorkshopでの具体的自動購入挙動は未実装。M6後半またはM7のEra progressionで役割を確定する。
- save migrationはversion 1の拒否/受理までで、将来version用migratorはまだない。
- initial few cyclesについて、実際のplayer interactionを含めたclear率・Blueprint投資後の体感を再検証する必要がある。

## M6 exit判断
まだM6 exitではない。domain foundationとprestige vertical sliceは成立したが、browser integration QAと数周の実プレイ相当検証を通すまでM6を継続する。
