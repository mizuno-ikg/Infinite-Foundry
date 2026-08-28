# M14 — ×8 human operation density / run 2

## Goal

×8 fast-forwardの数理determinismだけでなく、**人間の実時間あたり操作要求が8倍近くへ膨らまないか**をhuman proxyで測れるようにする。

M10以降のbalance oracleはattentive 7〜12 game-sec / relaxed 12〜20 game-sec間隔だったが、そのままspeedを掛けると×8で実時間あたり判断回数が約8倍になる。これは「fast-forwardは待ち時間を短縮し、忙しさを比例増加させない」というMission方針に反する。

## Change

`tools/balance/human-proxy.js`へspeed-aware modeを追加した。

- supported speed: `1 / 2 / 4 / 8`
- humanのattention intervalは**real-time基準**で固定する
- そのため次判断までのgame-time gapは `base human delay × speed`
- ×8でもattentiveは実時間7〜12秒程度、relaxedは12〜20秒程度でしか手動判断しない
- cycle/route telemetryへ `realSeconds`, `decisionsPerRealMinute`, `buysPerRealMinute` を追加
- CLIは `IF_HUMAN_SPEEDS=1,4,8` で同一oracleの速度比較を出せる

これは「×8でも1秒optimal相当で操作する」モデルではない。高速時に人間が見落とす・まとめて処理する現実をbalance oracleへ入れるための変更である。

## Contract

`tests/m14-operation-density-contract.test.js` を追加しdefault `npm test`へ接続した。

固定する内容:

1. ×8では同一乱数列のdecision delayがgame-timeで正確に8倍になる。
2. fresh Era 1で×8 proxyのcycle内decision総数は×1より少なくなる。
3. 一方で実分あたりdecision densityは同じorderに留まり、「×8だから8倍クリックする」proxyにならない。

## Current finding

source model上、従来proxyをspeed非依存で使うと操作密度が速度倍率に比例することは構造的に確定した。今回の変更で、その誤ったoracleを排除した。

ただし、**低い実時間attentionのまま×8で進めたときclear率・Memory進行がどこまで落ちるか**はformal Node multi-seed実行が必要である。ここで大きく悪化するなら、実ゲーム側へauto-throttle / decision assist等を追加する。悪化が小さい、またはAutomation/retained progressで吸収されるなら追加補助は入れない。

## Limitation

この起動でもcontainerから `github.com` のDNS解決が失敗し、通常cloneとNode exact実行は不可だった。GitHub Actionsは反復開発環境として使用していない。

## Next gate

実行経路が得られ次第、attentive / relaxed × speed 1/4/8を同一seed群で比較する。

見る値:

- decisions / real minute
- buys / real minute
- first-attempt clear rate (Era 1〜3)
- attempts p50/p90
- finish rate / cycles p50
- Foundry Memory progression

×8だけclear/進行が大きく崩れる場合は、speed自体ではなく**decision windowsの見落とし**を補う最小UXを入れる。
