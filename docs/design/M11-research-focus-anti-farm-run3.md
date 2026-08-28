# M11 — Research Focus anti-farm correction / run 3

## Scope

M11数値fitの前に、Research FocusがMissionの「待ち時間を進捗にしない」「early salvageは実進捗に応じる」という要件を満たすかsource-level監査した。

## Found issue

旧実装はFocus ON中に `researchData += elapsed / 45` としていた。

この式では生産量が極端に低いrunでも、FocusをONにして時計を進めるだけで45 game-secごとに1 Research Dataへ近づく。`meaningful()` もResearch Data > 0をmeaningful条件の一つに含むため、弱いrunでほぼ何も改善せず待つ行為そのものがMemory獲得経路になりうる。

これは次の製品方針と衝突する。

- 長い待ち時間を難易度・進捗にしない。
- Research Focusは「現在runの一部効率を、次runのための成果へ変換する」操作である。
- early salvageは開始直後farmを禁止し、そのrunで実際に得た進捗を回収する。

## Correction

Research Dataを経過時間ではなく、実際にdivertしたproduction valueから生成するよう変更した。

```text
diverted = produced × 0.18
research unit = final target × 15 sec × 0.18
researchData += diverted / research unit
```

18%のcurrent Credits tradeoffは維持する。

この定義では1 Research Dataは「そのEraのfinal target相当の生産を15 game-sec続けた量の18%を研究へ回した価値」に相当する。したがって同じ時間FocusをONにしても、生産が弱いrunでは研究が遅く、育ったrunでは速い。

### Fresh Era 1 sanity check

fresh Era 1の初期bottleneck throughputは約0.8/s、final targetは52/s。

45 game-secを操作せずFocus ONにしても概算Research Dataは

```text
0.8 × 45 / (52 × 15) ≈ 0.046
```

で、45秒待っただけでは1 Research単位へ届かない。

一方、全stage level 12相当では同じ式のResearch Dataがfresh初期状態より20倍以上大きくなるため、Researchはelapsed clockではなくproduction progressへ結びつく。

## Contract update

`tests/prestige-m11-contract.test.js` を更新した。

- Focusはcurrent Creditsを減らす。
- Focusは実生産があればResearch Dataを正に増やす。
- fresh状態で45秒待つだけではResearch Data < 0.2。
- 同じ15秒でも高生産stateは低生産stateの5倍超のResearch Dataを得る。
- immediate abort Memory=0、meaningful partial run Memory>=1等の既存contractは維持。

## Verification status

GitHub上のdevelop sourceを読み直して式とcontractの整合を確認した。

Chat execution containerは今回も `github.com` のDNS解決に失敗し、repository cloneによるNode exact実行はできなかった。Actionsは反復開発用途に使わない方針を維持しているため、exact testはM15 release-grade QAまたはsource実行可能経路が戻った時点まで保留する。

この修正はthreshold / continuous Memory bonus / Era targetを変更していないため、M12 difficulty curveには踏み込んでいない。
