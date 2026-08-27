# M7 — Era progression vertical slice (run 2)

Date: 2026-08-27 JST

## What changed

M7 foundationの7 Era metadataを、実際に遊べる進行契約へ拡張した。

- save schema v4。
- 各Eraに固有のduration / Directive targets / stage bias / production focusを持たせた。
- Workshop初クリア時にEra completionを記録し、Patentを1つ獲得する。
- clear後に current Era rebuild と next Era ascent を分離した。失敗時は同Eraで転生し、成功時だけ任意に次Eraへ進める。
- Patent恒久技術として Power Routing と Salvage Theory を追加。Blueprintとは別の上位meta progressionとした。
- Era II Automated FactoryではPOWERとTRANSFERが相対的に弱くなり、Workshopと異なる投資優先度を要求する。
- 同じdata-driven patternをEra III〜VIIへ展開し、物流、惑星供給、恒星energy、物理法則、最終統合へ主bottleneckが変化する。
- Era VII初クリアで `endingUnlocked` を立て、明確なUniverse ignition endingを表示できるcontractを追加。
- 旧v1〜v3 saveはPatent upgrade ledger / ending flagを補完して移行する。

## Visual / UX contract

UI側ではEra rail、Patent残高、Patent upgrades、Era固有Directive名・site・focus、next Era ascent button、Universe ending panelを表示する。body `data-era` によりEraごとのscene tintも変え、metadataだけの進行にしない。

## Verification

Nodeで以下を検証した。

- Workshop deadline / deterministic chunk invarianceを維持。
- forced Workshop first-clear → +1 Patent → Era II ascent。
- Era II duration 360s / targets 8, 26, 64, 118。
- Patent purchaseがPOWER capacityへ反映。
- v3 save migration。
- Era VII first-clearでending unlock。
- representative retained-meta smart runsでEra I〜VIIすべて到達可能。

後半Eraは現時点で到達可能性を優先した初期値であり、M8で退屈区間・過剰容易化・ランダム下振れを改めて再調整する。

## Next

M7継続。index/UI正本へEra rail・Patent・ascent・endingを接続し、browser render/interactionでWorkshop→Automated Factoryの視覚的変化まで確認する。その後、各Eraの見た目を単なる色調差以上へ強化し、Era固有の設備/背景レイヤーとstory beatsを追加する。
