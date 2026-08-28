# M10 — Human balance baseline / correctness run 1

## 目的

公開版の人間プレイフィードバックを、1秒ごとの最適Botではなく人間に近い反応間隔で測り直し、数値変更前のbaselineを作る。同時に、balance reworkと独立して明確に修正できるcorrectness / usability項目を先に直す。

## 今回の実装

### Human-like balance proxy

`tools/balance/human-proxy.js` を追加した。

- `optimal`: 1 game-secごとに判断。従来相当の上限性能確認用。
- `attentive`: 7〜12 game-secのjitterでまとめて投資。Overclock利用率82%。今後の主balance oracle候補。
- `relaxed`: 12〜20 game-secのjitter、Overclock利用率52%。低注意プレイの余裕度確認用。

判断対象は基本的に現在のbottleneckでよいという今回の製品方針に合わせ、意図的な誤投資を大量には入れていない。人間差は主に「最速で押せない」「まとめて操作する」「Overclockを毎回拾わない」で表現する。

proxyはengine RNGと別のdeterministic RNGを使い、同seed / modeなら同じ結果を返す。`tests/human-balance-contract.test.js` で再現性を固定した。

## 現行balance baseline

8 seeds / max 40 cyclesの暫定測定。全modeで最終到達自体は100%だったが、必要cycle数と初回突破率に大きな差が出た。

### Optimal proxy

- finish rate: 100%
- cycles p50 / p90: 14 / 15
- first-attempt clear: Era 1 100%, Era 2 25%, Era 3 12.5%, Era 4 37.5%, Era 5 37.5%, Era 6 37.5%, Era 7 12.5%

### Attentive proxy

- finish rate: 100%
- cycles p50 / p90: 22 / 26
- first-attempt clear: Era 1 37.5%, Era 2 0%, Era 3 12.5%, Era 4 50%, Era 5 87.5%, Era 6 0%, Era 7 25%
- attempt p50: 2 / 6 / 5 / 1 / 1 / 3 / 4

### Relaxed proxy

- finish rate: 100%
- cycles p50 / p90: 36 / 37
- first-attempt clear: Era 1 0%, Era 2 0%, Era 3 0%, Era 4 75%, Era 5 37.5%, Era 6 12.5%, Era 7 37.5%
- attempt p50: 3 / 8 / 11 / 1 / 2 / 4 / 4

## 解釈

ユーザーフィードバックを強く支持するbaselineになった。

1. 1秒Botだけを見るとEra 1は十分易しいが、7〜12秒判断では初回clear 37.5%、12〜20秒では0%。現行の「序盤から反応速度を要求する」状態は狙いと合わない。
2. Era 2はattentiveでも初回clear 0%、p50 6 attemptsで、序盤のサクサク進行という新要件から大きく外れる。
3. Era 4〜5がEra 2〜3より容易になるseedが多く、難易度が後半へ向けて単調・凸状に上がっていない。
4. relaxed proxyはp50 36 cyclesを要する。現行run durationの長さと合わせると、人間には反復時間が重い。

したがって次の数理調整では、optimal proxyのclearabilityを基準にtargetを下げるのではなく、attentive / relaxedの序盤clear率と、Eraごとのretained-strength requirementを主指標にする。

## Correctness / usability fixes

### STATUS / LOADOUT clock halt

`balance-m10.js` を追加し、STATUSをrunning中に開いた場合は即時pause、閉じた場合はそのSTATUSが作ったpauseだけを解除する。すでにmanual PAUSEだった場合は閉じてもpausedを維持する。旧STATUS内の「Production continues...」説明もclock halt仕様へ差し替える。

### Restart speed UI synchronization

engine側の新cycleは従来どおりspeed=1で開始する。その上でrestart / advance後にspeed buttonのactive表示をcanonical `state.cycle.speed`へ再同期し、「表示×4 / 実体×1」を禁止する。

### Early salvage / rebuild foundation

`SALVAGE RUN / REBUILD EARLY` を追加した。現在runを途中終了し、その時点までにearnedなprogressに応じたBlueprintだけを回収してprestige画面へ移れる。

開始直後のrestart連打でBlueprintを無限farmできないよう、partial salvageは現在のfull salvageへ `max(elapsed ratio, progress ratio × 0.8)` を掛けたfloor値とする。fresh run直後は0 BP、meaningfulな途中runでは正のsalvageを得ることをunit contractで確認した。

M11 Prestige 2.0ではこの出口をFoundry Memoryへ接続し、「今のrunは無理」と判断した時に、そこまでのMemory / Research progressを失わず次runへ移れる完成形へ発展させる。

## Tests

公開済みrelease source artifactをローカルへ復元した。今回変更前の`develop`はmainとの差分がdesign docだけだったため、artifact sourceが実装baselineと一致していることをcompareで確認してから変更を重ねた。

実施済み:

- `node --check balance-m10-logic.js`: PASS
- `node --check balance-m10.js`: PASS
- `node --check tools/balance/human-proxy.js`: PASS
- `tests/human-balance-contract.test.js`: PASS
- `tests/balance-m10-contract.test.js`: PASS
- exact release source + 今回変更を重ねたlocal treeで `npm test`: PASS
- legacy progression 24 seeds: finish 100%, p50/p90/max 15/18/20を維持

`npm run qa:release` もlocal Chromiumで試行したが、このChat execution environmentのChrome policyにより `http://127.0.0.1:4173` navigationが `net::ERR_BLOCKED_BY_ADMINISTRATOR` で拒否された。HTTP server自体は200を返しChrome CDPも起動しているため、今回のproduct failureとは分離する。browser exact gateはM15までにGitHub-hosted release QA等の許可済み経路で実施する。

## 次

M11へ進み、Foundry Memory / Breakthrough / Research-Salvage Focusを数式化する。まず現行Blueprint購入を即削除せず、existing save資産を公平にmigrationできる形でMemory bonus curveとthresholdをfitし、attentive human proxyのEra 1〜2 first-attempt clearを壊さないように設計する。
