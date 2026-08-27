# M9 Release QA A — 機能・堅牢性監査

実施日: 2026-08-27

## 目的

公開前Release Candidateを「既存テストが通る」前提で信用せず、セーブ異常、実ブラウザ操作、速度・進行、レスポンシブ、静的配信条件などの壊れ方を探す。

## 発見と修正

### 1. セーブ内容の構造破損で起動後に落ち得る

`engine.deserialize()` は壊れたJSONや未来versionを拒否するが、wrapperとして読める一方で内部stateの必須配列・levels等が欠けた保存データは、後段renderまで到達して例外になり得た。

修正:
- `app.js` に保存stateの利用可能性検査を追加。
- 必須meta/cycle、非負finite数値、5 stage level、主要配列を検査。
- 不正stateは新規ゲームへ安全にfallback。
- speedが1/2/4以外なら1へ復旧。

### 2. localStorage例外でゲーム自体が停止し得る

ブラウザ設定・quota等で`localStorage.getItem/setItem/removeItem`が例外を投げる場合の防御がなかった。

修正:
- load/save/resetを例外安全化。
- persistent saveが使えない場合もゲームはsession内で継続。
- UIに `SAVE UNAVAILABLE` を表示。

### 3. 保存不能時のautosave再試行が毎frame化する副作用

上記修正を監査したところ、失敗したsaveで`lastSaveReal`を更新しないと、5秒経過後は毎animation frameでsaveを再試行することを発見。

修正:
- 保存失敗時も試行時刻を更新し、再試行頻度を通常の約5秒間隔に維持。

## 新規回帰QA

`tools/qa/browser-corrupt-save.html` を追加し、実Chromeで以下をdesktop/mobile双方から検証するようCIへ統合した。

- 壊れたJSON save → fresh Era Iへ復旧して描画可能。
- JSONとしては正しいが内部state構造が壊れたsave → fresh Era Iへ復旧。
- 復旧後に有効なsaveが再生成される。

既存Browser QAも引き続き、Era I/IV/VIIのdesktop/mobile render、横overflow、Domain Protocol、Prestige→Patent/Blueprint→Era II→×4→machine upgrade→save/reloadを実Chromeで通す。

## 検証結果

最新commit `4e74d6cc75e7f5ae9e7e430f499dc6605fea08e0` のGitHub Actions CI run `33049715741`:

- Node regression: success
- Browser render smoke: success
- desktop/mobile interaction flow: success
- desktop/mobile corrupt-save recovery: success
- render evidence upload: success

静的配信用asset参照は相対pathで、GitHub Pagesのrepository subpath配信に適合する構成を維持している。

## 判定

機能・堅牢性の観点では、公開を止める既知のゲーム本体blockerは見つからない。今回新たに見つかった保存系2問題と修正副作用1件は修正・実Chrome再検証済み。

ただしRelease QA Bで、面白さ、初回導線、7 Eraの差別化、終盤満足感、モバイル情報密度、説明・公開品質を別観点から再監査する。GitHub Pages site自体の未有効化は引き続き公開実体確認の外部blocker。
