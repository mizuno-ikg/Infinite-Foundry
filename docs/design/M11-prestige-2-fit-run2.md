# M11 — Prestige 2.0 fit / run 2

## Scope

M11 foundationをhuman-like balance oracleへ接続し、Prestige 2.0の数理fitを実行できる計測面と、プレイヤーが転生直後の強化差を読めるresult UIを追加した。

M12のEra target / duration変更はまだ混ぜていない。

## Prestige-aware human proxy

`tools/balance/human-proxy.js` は起動時に `prestige-m11.js` をinstallし、通常routeがFoundry Memory / Breakthrough / Research Focus込みで進むように変更した。

各cycleで次を記録する。

- Memory before / earned / after
- cycle開始時Credits
- Research Data
- win / failure
- newly unlocked Breakthrough

`simulatePrestigeLoop()` を追加し、指定Eraを同じbuild条件で複数cycle繰り返して「meaningful failureを重ねたとき何runでstrengthが変わるか」を直接測れるようにした。

### Focus policy

低頻度操作の比較用に次を持つ。

- `off`: Focusを使わない
- `always`: run全体でFocus ON
- `late`: 55%経過後にON
- `losing`: 35%経過後かつfinal pace比55%未満ならON

通常CLIでは `off,losing` を標準比較にし、optimal / attentive / relaxedの3proxyを同じseed群で出力できる。

`losing` は「このrunは厳しそう」と判断した時だけ将来progressへ寄せるhuman-likeな低頻度方針の第一候補であり、最適botの高速ON/OFF探索を主oracleにしない。

## Contract extension

`tests/human-balance-contract.test.js` に以下を追加した。

- 同seed / 同modeのdeterminismをPrestige込みで維持
- cycleごとのMemory履歴を必ず出す
- Foundry Memoryは減少しない
- full human-proxy cycleはmeaningful runとしてMemory >= 1
- Focus OFFではResearch Data 0、Focus ONでは正に増える
- meaningful run 1回後の次cycle Starting Creditsが増える

## Rebuild result delta UI

`balance-m10.js` のresult補助UIへ `RETAINED PROGRESS` boxを追加した。

cycle終了時に表示するもの:

- `FOUNDRY MEMORY before → after`
- `BASE STARTING CREDITS before → after`
- `NEW BREAKTHROUGH` または `NEXT BREAKTHROUGH // N MEMORY TO ...`

Base Starting Credits比較ではMemory before / afterのそれぞれにBreakthrough floorを再適用してから比較するため、閾値を跨いだrunではcontinuous bonusだけでなくCapital floor等の大進歩も差分へ反映される。

これは「恒久強化は所持値だけでなく状態遷移直後にbefore→afterで見せる」というMission knowledgeの方針に沿う。

## Verification status

GitHub上のdevelop実体を再取得し、今回変更後の `human-proxy.js` / `balance-m10.js` / contractをsource-levelで再確認した。developはmainより15 commits ahead / 0 behind、main / Pagesは変更していない。

Chat execution containerでは引き続き `github.com` / `raw.githubusercontent.com` のDNS解決が失敗し、repository sourceをNode実行環境へclone/downloadできない。Actionsを反復開発環境として使わない方針も維持したため、このrunでは新しいhuman-proxy数値そのもののexact実行は行っていない。

したがってM11の残作業は **数値fit**。計測器と表示面は整ったので、sourceを実行可能な経路が戻り次第、attentive / relaxedを主oracleとして以下を計測する。

1. first meaningful failure後のStarting Credits増分
2. 12 / 30 / 60 / 110 / 180 Memory到達までのrun数分布
3. Focus `off` vs `losing` のclear率 / attempt数 / Memory獲得速度
4. legacy migration直後のstarting strengthがfresh progressionを過剰skipしないか

M11 curveを確定するまではthreshold / continuous bonus / 18% divertを暫定値として扱う。
