# 가상 제조 데이터 (MfgSim)

이 폴더의 데이터는 전부 **가상**입니다. 실제 공정값·회사 데이터가 아니며, 같은 코드를 돌리면 항상 같은 결과가 나옵니다(고정 시드, `Math.random`·`Date.now` 미사용). 명세는 `_content/FDC/_teach/DATA_SPEC.md` 입니다.

## 파일

| 파일 | 설명 |
|---|---|
| `mfgsim.js` | 시뮬레이터 본체. 브라우저에서는 `<script src="mfgsim.js">` 로 `window.MfgSim`, node 에서는 `require('./mfgsim.js')` |
| `build_csv.mjs` | `node agentlab/data/build_csv.mjs` 로 `csv/` 를 다시 만듭니다 |
| `verify.py` | scipy·pandas 로 시나리오의 숨은 성질과 ESTC 층, PPA 벡터장(S10)을 검사합니다(`python3 verify.py`, 120항목. ESTC 검사는 CSV 를 파이썬으로 독립 재생, S10 은 성분 몫·열 단면·튀는 점·짝/문항 규칙과 0302 의 최소제곱·단순 평균법·점 누락 프리셋·식별(rank), S11 은 유리 1728장의 계수·join·다중 회귀·온도 보정·리페어 경보를 파이썬(numpy)으로 다시 구현해 시드 1~200 을 JS 와 대조) |
| `csv/` | 실험실의 Python 코드가 읽는 파일 |

## 공정 구조와 연결 키

라인은 **증착 블록 11개**(B01~B11)가 차례로 이어진 것입니다. 블록 하나는 챔버 4개(CH1~CH4)이고, 블록마다 마스크 세트 3개(A·B·C) × 마스크 4장이 턴(turn)을 돌며 순환합니다. 유리 한 장은 블록을 순서대로 지나갑니다.

- 픽셀을 만드는 FMM 블록은 B02~B07 입니다. **PPA 는 이 여섯 블록에만** 있습니다(B01·B08~B11 은 공통층·오픈 마스크라 PPA 없음).
- `mask_id` 는 `B03-A2` 꼴입니다(블록-세트+챔버번호, A2 는 CH2 전용).
- 유리 ID `G0000143` 은 블록 안 처리 순번입니다. 앞 블록을 먼저 지나므로 같은 번호가 같은 유리입니다.
- 공통 키: `glass_id, ts, block, chamber, mask_id, mask_set, turn, glass_in_turn, chamber_temp`. FDC 와 PPA 는 `glass_id` 로, Loss 는 `ts·block·chamber·mask_set` 으로 붙습니다. 챔버 온도 `chamber_temp` 는 FDC 와 PPA 가 같은 값을 씁니다.

## csv 파일별 열

- `s1_pm_shift.csv` — B03 CH2, PM 전·후 30장씩. `glass_id, block, chamber, phase(before/after), idx, steady_pressure_mean`(mTorr).
- `s2_stick_replace.csv` — 마스크 B05-B3, 불량 스틱 교체 전·후 20장씩. `phase, turn, glass_in_turn, chamber_temp, dx_mean_um, dx_sd_um, dx_metric_um`(= |평균|+3σ), `dy_metric_um`.
- `s3_repair_pair.csv` — 마스크 B03-A2 리페어 전·후, 같은 77점. `px,py,x_mm,y_mm, defect_before, repair_err_before, repair_err_after`(µm, √(dx²+dy²)).
- `s3_clean_pair.csv` — 같은 77점의 세정 전·후(참 변화가 아주 작음). `clean_err_before, clean_err_after`.
- `s4_thermal_confound.csv` — B07 처리 챔버(CH1)와 대조 챔버(CH2), 세정 방법 변경 전·후 40장씩. 같은 시기 챔버 온도가 올랐습니다. `group(treated/control), phase, glass_in_turn, chamber_temp, mx_ppm`(77점 회귀로 얻은 장변 배율).
- `s5_autocorr.csv` — AR(1) 센서. `idx, phase, vac_level`.
- `s6_false_alarm.csv` — 특징 590개(센서 118개 × 특징 5개, 열 `s001_steady_mean` …). `group` 이 `ref`(기준 300장)·`normal`(정상 500장)·`anomaly`(특징 하나가 5σ 이동한 이상 10장)입니다. 같은 센서의 다섯 특징은 상관 0.6.
- `ppa_sample.csv` — B03 CH2 유리 3장의 77점. `…, px, py, x_mm, y_mm, dx_um, dy_um, defect`(1 이면 국소 결함 정답).
- `ppa_s10.csv` — S10(실험실 0301) 대표 시드의 마스크 72장 × 77점. `glass_id, block, chamber, mask_id, mask_set, turn, glass_in_turn, chamber_temp, px, py, x_mm, y_mm, dx_um, dy_um, defect, bad_stick`(`defect` 1 = 국소 결함 정답 점, `bad_stick` = 마스크의 불량 스틱 열 번호 정답, 없으면 -1). 유리 가운데가 원점이고 +dx 는 오른쪽(장변), +dy 는 위쪽(단변), 행 0 이 맨 아래 줄입니다.
- `ppa_coef_s11.csv` — S11(실험실 0303) 대표 시드의 유리 1728장(마스크 12장 × 24턴 × 턴 안 순번 5·20·40·60·90·120)마다 0302 의 전부 항 최소제곱으로 구한 계수 한 줄. `glass_id, block, chamber, mask_id, turn, glass_in_turn, Tx_hat, Ty_hat, theta_hat, Mx_hat, My_hat, K_hat, Cx_hat, Cy_hat, se_Mx, se_My, sigma, model`(`model` = `full5`, 단위는 0302 와 같음). 정답 성분은 담지 않음.
- `fdc_temp_s11.csv` — 같은 유리의 FDC 챔버 온도 `glass_id, fdc_temp`(참 온도 + N(0, 0.04²) 측정 잡음). 유리의 약 1%는 FDC 기록이 빠져 있어 행 수가 계수 표보다 적음(대표 시드 1715행).
- `fdc_features.csv` — B03 의 5개 턴 유리별 특징. `p_steady_mean, p_steady_std, p_max_dev, p_settle_s, p_overshoot_pct, rate_ang_s, pm_flag(PM 이후=1), true_anomaly, anomaly_type, interlock, interlock_true`(가성 인터락 = interlock 1 이고 interlock_true 0).
- `loss_events.csv` — 60일 Loss 사건. `event_id, start_ts, end_ts, block, chamber(CH1~4 또는 ALL), reason(직접 사유), root_cause(1차 원인), caused_by_block, run_mode(quad/triple/degraded), mask_set, turn, loss_chamber_min, loss_glass`. 사유는 명세의 11개 코드와 `LB-LINE`(라인 밸런스: 앞뒤 블록 때문에 굶거나 막힌 손실, 90 챔버·분 미만은 생략)입니다. `reason` 과 `root_cause` 가 다른 행이 연쇄의 흔적입니다.
- `loss_hourly.csv` — 1시간 단위 상태. `ts, stocker_fill, cleaner_queue, cleaner_busy, cassette_free, transport_requests, blocks_triple, blocks_idle, line_wip, line_out`.
- `mask_transitions.csv` — ESTC 전이 기록(기본 시드 60일, `simulateLoss({trace:true})`). `t`(시작부터 분), `entity`(mask·set·chamber·block), `id`(마스크 `B03-A2`·세트 `B03-A`·챔버 `B03-CH2`·블록 `B03`), `from, to`(처음은 `init`), `trigger`(원인), `cause`(마스크 장착 때 `age=N`, 정지·막힘 때 사유 코드). 10만 줄이 넘고, 마스크·세트·챔버·블록 네 종류가 한 파일에 `entity` 열로 구분되어 있습니다. 허용 전이 표·제약은 `MfgSim.ESTC` 가 같은 내용을 갖고 있습니다.
- `truth.json` — 시나리오 숨은 정답과 JS 자체 점검값. 학습자에게 답을 보이기 전에는 열지 않습니다.

## ESTC 층 (공정 상태 모델, 실험실 0206)

`simulateLoss({trace:true})` 일 때만 기존 상태 변경 지점에서 전이를 기록합니다. 기록 훅은 난수를 부르지 않고 읽기만 하므로 켜도 `events·hourly·turns` 가 켜지 않았을 때와 같고(검사됨), 켜지 않은 반환값에는 키가 늘지 않습니다. 켠 반환값은 `transitions, resources(1시간 단위 세정 중·대기열·stocker·카세트), end` 가 더 붙습니다.

| 함수·값 | 설명 |
|---|---|
| `MfgSim.ESTC` | 개체 8종·상태·허용 전이 표(`entity, from, to, trigger, guard, guard_id, reversible, needs_human`)·제약 C1~C6. 순수 데이터라 화면·파이썬이 같은 표를 씁니다 |
| `estcCheck(transitions, {end})` | 표에 없는 전이(T0)·시각 거꾸로(T1)·이음새(C3)·세정 동시 수(C1)·블록당 증착 세트(C2)·챔버 체류 합(C4). `{ok, violations, counts}` |
| `dwell(transitions, id, end)` · `trajectory(transitions, id, t0, t1)` · `stateAt(transitions, t)` | 체류 분·궤적·시각 t 의 상태표 |
| `requestTransition(snap, entity, id, to)` | 표에 있는가 → 사람 승인이 필요한가 → 가드 통과 순서의 판정 |
| `CASE_SCHEMA` · `validateCase(rec)` · `caseRecords(sim)` · `featuredCase(cases)` | 사례 기록 양식과 검사, 시뮬레이션에서 뽑는 가상 사례(마스크 불량 → 리페어, 잡 체인지 대기 20분 이상) |
| `estcMetrics(sim, cases)` | 핵심 지표 네 개(마스크 한 바퀴 중 짝 대기·세정 대기 비율, 잡 체인지 대기 건수, 마스크 불량 사례 중 다시 불량 비율). verify 가 시드 1~200 분포를 계산 |

## PPA 벡터장 (S10, 실험실 0301)

`MfgSim.scenario('S10', {seed})` — 마스크 72장(B02~B07 × 세트 A·B·C × 챔버 1~4)마다 측정 유리 한 장(턴 1~20·턴 안 순번은 `hashSeed('S10', …)` 줄기). 마스크 집단은 `makeMask(id, null, tag)` 의 `tag`(= 시드)로 다시 뽑고, 같은 시드는 늘 같은 결과입니다. 기본 시드는 시드 1~200 분포에서 일곱 지표 백분위의 Σ|백분위−50| 이 가장 작은 128 입니다. 기존 출력(CSV 14개·S1~S9·`simulateLoss`·전이 기록)은 바이트 단위로 그대로입니다(`makeMask` 의 `tag`·`ppa()` 의 식 분리는 기본값에서 같은 값을 냅니다).

| 함수·값 | 설명 |
|---|---|
| `MfgSim.ppaField(comp)` | 잡음 없는 순수 성분 장 77점 `[{px,py,x_mm,y_mm,dx,dy}]`. `comp` 에 없는 성분은 0(슬라이더 화면용). `ppa()` 와 같은 식(`fieldAt`)을 씀 |
| `s10tools.parts(c)` · `shares(c)` | 성분 일곱 묶음(평행이동·회전·배율·직교도·고차·스틱·국소 결함)의 77점 기여와 제곱합·몫(몫의 합 1, 교차항은 세지 않음)·주된 성분 |
| `columnProfile(grid, z)` | 열 단면: 열마다 dx 평균을 이웃 열로 예측한 잔차(안쪽 √1.5·바깥 √6 으로 눈금 맞춤)의 로버스트 z, 기본 기준 3.5 |
| `pointOutliers(grid, z)` | 튀는 점: 이웃 8점 중앙값과의 차의 dx·dy 로버스트 z 중 큰 쪽이 기준(기본 4) 이상 |
| `pickPair` · `pickQuiz` | 짝 규칙(spec 판정이 같고 주된 성분이 다른 짝 중 dx 지표 차 최소)·문항 규칙(성분마다 몫이 가장 큰 유리, 짝 제외) |
| 반환 | `items`(유리별 격자·정답 성분·몫·열 단면·튀는 점), `spec`(불량 스틱 없는 마스크 dx 지표의 95 백분위), `bad`·`miss_metric`·`caught_col`·`false_col`, `pair`, `quiz`, `csvRows()` |

### 성분 분해 — 최소제곱 (실험실 0302, S10 데이터 그대로)

새 난수도 새 CSV 도 없습니다(`csv/ppa_s10.csv` 재사용). 기존 `ppaFit`·`makeMask`·`ppa()` 는 건드리지 않았고 아래 함수는 `s10tools` 에 더해졌습니다. dx·dy 를 한 설계 행렬(남은 점 n 개면 2n 행, 앞 절반 dx 줄·뒤 절반 dy 줄)로 함께 풉니다. 점 번호 = `py*11 + px`.

| 함수·값 | 설명 |
|---|---|
| `fit(grid, {terms, exclude})` | `terms` ⊆ `['T','rot','mag','ortho','high']`(기본 전부), `exclude` = 뺄 점 번호. 반환 `coef`·`se`(σ̂=√(RSS/(n−p)) 기반)·`se_known`(`CFG.NOISE` 기반)·`fitted`·`resid`(77점 격자꼴, `dx_um`/`dy_um` 키라 `ppaMetric`·`columnProfile`·`pointOutliers` 에 바로 들어감)·`rss`·`n`(행 수)·`p`·`sigma`. 전부 항이면 기존 `ppaFit` 과 같음(K = K_minus_theta + theta). 풀 수 없으면 `{error:'rank'}` |
| `naive(grid, exclude)` | 단순 평균법(평균·x·dx/Σx²·…, 좌표를 가운데로 맞추지 않음). 온전한 격자에서는 `terms=['T','rot','mag','ortho']` 최소제곱과 같고, 비대칭으로 점이 빠지면 달라짐(대칭으로 빠지면 같음) |
| `stickFit(grid, conv, exclude)` | 열마다 상수(스틱 오프셋) 11개를 더한 모델의 식별 점검. `conv` = `'none'`(약속 없음: rank 15/17) · `'sum0'`(오프셋 합 0·가로 기울기 0) · `'ends'`(양 끝 열 0). 약속은 KKT 연립방정식으로 정확히 걸고 `rank`·`deficiency`·`rank_with_constraints`·`coef`·`offsets` 를 반환 |
| `fitSummary(S)` | 72장마다 추정−정답 `err`·`ratio`(|err|/se_known)·보정 효과(`metric_meas`·`metric_align`·`metric_all`)·잔차 열 단면 표시·점 누락 프리셋(`PRESETS`: `right_col`·`corners`·`top_right`)에서 최소제곱과 단순 평균법의 위치 오차(`err_lsq`·`err_naive`, 추정 계수 여섯이 그리는 장과 정답 계수의 장의 RMS, µm) |
| `design` · `rank` · `errField` · `subtract` · `coefs` | 설계 행렬 `{X,y,names,kept}` · 행렬의 rank · 위 위치 오차 · 계수가 그리는 장을 측정에서 뺀 격자 · 항 → 계수 이름 목록 |

시드 1~200 분포(verify.py 12개 검사): 오차÷`se_known` 중앙값은 Tx 3.1·Mx 3.1·My 1.9(불량 스틱 마스크만 2.8), 나머지 다섯 계수는 0.7 안팎(잡음만의 표준오차와 맞음). 오른쪽 끝 열이 빠지면 최소제곱의 위치 오차가 더 작은 유리가 중앙값 81%(10~90% 75~88%), 오른쪽 위 세 점 78%, 네 모서리(대칭)는 두 방법이 같습니다. 대표 시드 128 은 0302 지표 열세 개 가운데 열 개가 분포 25~75% 밖이어서 0302 본문은 분포(중앙값·10~90%)를 함께 보입니다.

## 열변형과 턴 누적 (S11, 실험실 0303)

`MfgSim.scenario('S11', {seed, season_K, p_gap})` — 마스크 12장(B02~B04 × 세트 A × 챔버 1~4)을 연속 24턴 쓰고, 턴마다 유리 6장(턴 안 5·20·40·60·90·120번째, 표본 측정 레시피)을 잰 1728장. 마스크 집단은 `makeMask(id, null, 'S11-'+seed)` 로 다시 뽑고 새 난수는 전부 `hashSeed('S11', …)` 줄기라 기존 출력(CSV·S1~S10·`simulateLoss`·전이 기록)은 바이트 단위로 그대로입니다. 계절 `season = season_K × (turn−1)/23`(기본 0.3 K, 24턴 동안 냉각수 온도가 서서히 오르는 가정). PPA 는 참 온도로 만들고(`ppa()` 의 `chamber_temp`), 학습자에게는 FDC 측정 온도(참 + N(0, 0.04²))만 줍니다. 유리마다 `ppa()` 77점 → 전부 항 최소제곱(`s11fit`, `s10tools.fit` 과 같은 값, 설계 행렬의 역을 한 번만 만들어 빠름)으로 계수를 추정합니다. FDC 기록은 `p_gap`(기본 1%) 확률로 빠집니다. 기본 시드는 67(시드 1~200 의 여섯 지표(다중 회귀 열변형 기울기·턴 기울기·턴만 넣은 턴 기울기·My/Mx 열변형 비·보정 전 경보 마스크 수·보정 후 경보 마스크 수) 백분위에서 Σ|백분위−50| 이 가장 작은 시드).

| 함수·값 | 설명 |
|---|---|
| 반환 `coefRows` · `fdcRows` · `truth` · `masks` | 유리별 계수 한 줄 · FDC 온도 표(빠진 유리는 없음) · glass_id 키의 정답(`T_true`·`Mx_true`·`Mx_th`·`Mx_age`·`Mx_mask`·`My_true`·`My_th`) · 마스크 목록(불량 스틱 번호 포함). `csvRows()` · `fdcCsvRows()` 는 CSV 꼴 |
| `s11tools.join(coefRows, fdcRows)` | glass_id 로 잇기. `rows`(못 이은 행은 `fdc_temp = null`)·`joined`·`missed`·`fdc_unmatched`(FDC 표에서 주인 없는 행) |
| `s11tools.regress(rows, y, xNames, {perMask})` | 절편 + xNames 다중 회귀(하우스홀더 QR). `perMask` 면 마스크마다 절편(`icpt:마스크번호`). `coef`·`se`(σ̂ 기반)·`rss`·`n`·`p`·`sigma`·`resid`. 값이 null 인 행은 뺌 |
| `s11tools.compensate(rows, slope, Tref)` | `Mx_hat − slope·(fdc_temp − Tref)` 를 `Mx_comp` 로 |
| `s11tools.alarms(rows, {field, limit, upTo, baseTurns})` · `turnMeans` · `alarmsFromMeans` · `confusion` | 마스크별 기준선(첫 턴 평균) 대비 턴 평균이 `limit`(기본 0.3 ppm) 넘게 내려간 첫 턴(`upTo` = 12턴까지만). 맞은 경보·헛경보·놓침·맞은 무경보 혼동표 |
| `s11tools.metrics(S)` · `pickMask(rows)` · `withTruth` · `fit` · `corr` | 시드 하나의 여섯 지표와 부수 값 · 턴만 넣은 회귀의 턴 기울기가 정답 −0.02 에서 가장 먼 마스크 · truth 를 행에 붙이기 · 빠른 77점 최소제곱 · 상관계수 |

시드 1~200 분포(verify.py 18개 검사): 다중 회귀 열변형 기울기 −1.975(10~90% −1.987~−1.963) ppm/K(정답 −2.0 보다 조금 작은 것은 FDC 온도의 측정 잡음 때문, 참 온도로 회귀하면 −2.001), 턴 기울기 −0.0204(정답 −0.02), 턴만 넣은 턴 기울기 −0.0462(모든 시드에서 둘 다 넣은 값보다 더 음수 — 계절 교란, 차 −0.0257 ≈ −2·0.3/23), My/Mx 열변형 비 0.500, My 의 턴 기울기는 0 근처(표준오차의 0.8배, 중앙값). 마스크별 절편은 스틱 누설 같은 마스크 일정 치우침을 흡수합니다(추정 오차 sd 의 마스크 안/전체 0.34). 12턴 판정·한계 0.3 ppm 에서 정답 경보는 0장, 보정 전 헛경보 12장(197/200 시드), 보정 후 3장(2~5), 보정 후 놓침 0. 대표 시드 67 은 여섯 지표 중 턴만 넣은 기울기가 분포 85% 자리이나 분포 폭이 0.001 이내라 본문은 값 그대로 말합니다. `ppa_coef_s11.csv`·`fdc_temp_s11.csv` 는 `build_csv.mjs` 가 만듭니다(기존 CSV 와 `truth.json` 은 바이트 단위로 불변).
