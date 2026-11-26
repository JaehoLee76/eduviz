# 가상 제조 데이터 (MfgSim)

이 폴더의 데이터는 전부 **가상**입니다. 실제 공정값·회사 데이터가 아니며, 같은 코드를 돌리면 항상 같은 결과가 나옵니다(고정 시드, `Math.random`·`Date.now` 미사용). 명세는 `_content/FDC/_teach/DATA_SPEC.md` 입니다.

## 파일

| 파일 | 설명 |
|---|---|
| `mfgsim.js` | 시뮬레이터 본체. 브라우저에서는 `<script src="mfgsim.js">` 로 `window.MfgSim`, node 에서는 `require('./mfgsim.js')` |
| `build_csv.mjs` | `node agentlab/data/build_csv.mjs` 로 `csv/` 를 다시 만듭니다 |
| `verify.py` | scipy·pandas 로 시나리오의 숨은 성질과 ESTC 층, PPA 벡터장(S10)을 검사합니다(`python3 verify.py`, 153항목. ESTC 검사는 CSV 를 파이썬으로 독립 재생, S10 은 성분 몫·열 단면·튀는 점·짝/문항 규칙과 0302 의 최소제곱·단순 평균법·점 누락 프리셋·식별(rank), S11 은 유리 1728장의 계수·join·다중 회귀·온도 보정·리페어 경보를 파이썬(numpy)으로 다시 구현해 시드 1~200 을 JS 와 대조, S12 는 유리 192장의 계수·보정 후 지표·3단 판정·튄 점·반복 위치·우연 반복 확률(scipy.stats.binom)·리페어 전후 대응 비교와 Welch 를 다시 구현해 시드 1~200 을 JS 와 대조) |
| `llm_runs_0410.json` | 실험실 0410 의 실제 LLM 답 기록(모델 `claude-haiku-5-5`, 2026-11-26, 과제 6 × 독립된 대화 3 = 답 18개, 프롬프트 전문 포함). **고치지 않는 원본 기록**(verify.py 가 sha256 으로 확인) |
| `llm_runs_0410.js` · `build_llm_runs_js.mjs` | 위 기록을 `file://` 에서도 `<script>` 로 읽히게 감싼 파일과 만드는 법(`node agentlab/data/build_llm_runs_js.mjs`). 내용은 JSON 과 같고 verify.py 가 대조 |
| `llmcheck.js` | 0410 의 계산 모듈(`window.LlmCheck`): 정답본에서 표 1·2·3 과 원자료를 다시 만들고, 답 18개의 숫자 대조·계산 과제 채점·문장 판정 근거 숫자·겹침 집계 |
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
- `ppa_s12.csv` — S12(실험실 0304) 대표 시드의 유리 192장(마스크 24장 × 같은 턴 안 8장, 턴 안 순번 15·30·…·120) × 77점 = 14,784행. `glass_id, mask_id, turn, glass_in_turn, px, py, x_mm, y_mm, dx_um, dy_um, fdc_temp`(측정 격자와 그 유리의 FDC 온도, 소수 5자리). 정답 성분·튄 점 정답은 담지 않음.
- `vm_s13.csv` — S13(실험실 0305) 대표 시드(20)의 유리 1,728장(마스크 12장 × 24턴 × 턴 안 순번 5·20·40·60·90·120). `glass_id, mask_id, turn, glass_in_turn, fdc_temp, dep_rate, pressure, Mx_hat, cal_ver`. `fdc_temp` 는 기록된 표시값(턴 20부터 +0.3 K), `cal_ver` 는 센서 교정 판(0/1). 정답 성분은 넣지 않습니다.
- `life_s14.csv` — S14(실험실 0306) 대표 시드(181)의 마스크 24장 × 최근 8턴 = 192행(보정 후 턴 평균 표). `mask_id, turn, age_known, Mx_comp, baseline`. `turn` 8 이 지금, `age_known` = 마지막 리페어 뒤 몇 턴째(기록 있는 마스크만), `Mx_comp` = 보정 후 배율의 턴 평균(ppm), `baseline` = 리페어 직후 첫 턴의 보정 후 배율(기록 있는 마스크만, 없으면 빈칸). 정답은 넣지 않습니다.
- `s15_fdc_glass.csv` · `s15_ppa_coef.csv` · `s15_events.csv` · `s15_mask_hist.csv` — S15(실험실 0400) 대표 시드(115)의 가상 사내 DB 표 넷, **적재본**(날마다 0~2개의 고장이 들어간, DB 가 실제로 받은 모습). `fdc_glass` 7,374줄(유리 표본: 턴 안 순번 5·15·…·115 · `chamber_temp`·`ch_temp`(열 이름이 바뀐 날만 이쪽에 값) · `p_steady_mean`·`rate`), `ppa_coef` 3,721줄(턴마다 6장: 5·25·45·65·85·105번 · `Tx·Ty·theta·Mx·My·K` · `model_ver` · `ppa_metric` = dx·dy 지표 중 큰 쪽), `events` 67줄(PM·세정·센서 교정·인터락 구간), `mask_hist` 10줄(챔버별 마스크 끼움 구간). 시각은 `YYYY-MM-DD HH:MM` 문자열(사전순 = 시간순), 첫 시각 2026-03-02 06:00.
- `s15_clean_fdc_glass.csv` · `s15_clean_ppa_coef.csv` — **정답본**(같은 시뮬레이션에서 고장을 넣기 전의 표, 결과 대조용). 규칙: `s15_` 로 시작하는 표 넷 = 적재본, `s15_clean_` = 정답본(`events`·`mask_hist` 는 고장이 없어 하나뿐), `s15_faults.csv`(`day, kind, detail`) = 날짜별 주입 목록(정답). 학습자에게 답을 보이기 전에는 정답본·주입 목록을 열지 않습니다.
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

## 보정할까 리페어할까 (S12, 실험실 0304)

`MfgSim.scenario('S12', {seed})` — 마스크 24장(B02~B07 × 세트 A × 챔버 1~4)마다 같은 턴(3~20 사이, 시드 줄기로 뽑음) 안에서 유리 8장(턴 안 15·30·…·120번째)을 잰 192장. 마스크 집단은 `makeMask(id, null, 'S12-'+seed)`, 새 난수는 전부 `hashSeed('S12', …)` 줄기라 기존 출력(CSV·`truth.json`·S1~S11·`simulateLoss`·전이 기록)은 바이트 단위로 그대로입니다. 온도는 `chamberTemp`(참, PPA 용)와 FDC 측정 온도(참 + N(0, 0.04²), 회귀·보정용). 유리 기인 결함은 유리마다 확률 0.3 으로 무작위 한 점에 N(0, 2.5²) µm (dx, dy)를 `ppa()` 결과 격자에 덧붙이고, 마스크 기인 결함은 `makeMask` 가 가진 `defects`(약 20% 마스크, 모든 유리 같은 위치)입니다.

보정 가능 몫 = 유리마다 전부 항 적합(`s11fit`)의 Tx·Ty·θ + 열변형 몫(Mx 에 b̂T·(T_FDC − 80), My 에 그 0.5 배). b̂T·My/Mx 비는 `scenario('S11')` 기본 시드의 다중 회귀 값을 받아 씁니다(`s12tools.bT()`, 숫자를 박지 않음). 마스크 판정 지표는 8장 평균 장(점별 평균)의 dx 지표(|평균|+3σ, 0301 과 같은 정의)이고, spec 은 불량 스틱이 없는 마스크 지표의 95 백분위 하나를 측정 지표·보정 후 지표가 함께 씁니다. 3단 판정: 지표 ≤ spec → none, 지표 > spec 이고 보정 후 ≤ spec → correct, 보정 후 > spec → repair. 튄 점 = 전부 항 적합 잔차에 `pointOutliers`(z ≥ 4), 위치별 장 수 ≥ k 면 반복 위치, 기본 k = 우연 반복 확률(한 장당 튄 점 비율은 마스크별 평균의 중앙값 ÷ 77, 이항분포, 77 위치 중 어디든)이 1% 아래로 내려가는 가장 작은 k. 조치 대상 = 3단 판정이 리페어이거나 반복 위치가 잡힌 마스크 → `repairMask(mask, turn+1, 0.6)` 뒤 같은 레시피로 8장 다시 측정, 점별 |d| 8장 평균 77쌍의 대응 비교(`pairedT`)와 유리별 지표 8 대 8 `welch`. 도구 `s12tools`: `bT`·`decide`·`remain`·`chance`·`minK`·`counts`·`repeat`·`repairEffect`·`metrics`·`post`·`measure`. 기본 시드는 153(시드 1~200 의 여섯 지표(판정 일치율·쓸데없는 리페어 수·마스크 기인 결함 중 반복 위치로 잡힌 비율·반복 위치가 잘못 잡힌 마스크 수·유리 한 장 판정 정답률·조치 마스크 전후 점별 대응 비교 p 중앙값) 백분위에서 Σ|백분위−50| 이 가장 작은 시드).

설계 예상과 다른 결과: 이 가상 공정에서는 보정 후 지표가 spec(보정 안 한 지표의 95 백분위)을 넘어 3단 판정이 리페어를 내리는 시드가 200개 가운데 1개뿐입니다. 보정 가능 몫이 지표를 크게 키우고 남는 몫은 훨씬 작기 때문이며, 그래서 조치 대상을 반복 위치가 잡힌 마스크까지 넓혀 전후를 비교합니다(대표 시드 기준 시드 분포 중앙값 5.5장, 10~90% 3~8장). 시드 1~200: 판정 일치율 1(0.96~1), 쓸데없는 리페어 수 2(1~3), 반복 위치로 잡힌 마스크 기인 결함 비율 0.85(0.5~1), 반복 위치가 잘못 잡힌 마스크 1(0~3)장, 유리 한 장 판정 정답률 0.71(0.58~0.80)이고 반복 위치 판정은 0.92(0.83~1)로 199/200 시드에서 더 높습니다. 기본 k 는 모든 시드에서 3(8장 중 3장), 우연 반복 확률 0.0008. 점별 대응 비교 p 가 유리별 Welch p 보다 작은 조치 마스크가 약 69%입니다.

## 가상 계측 (S13, 실험실 0305)

`MfgSim.scenario('S13', {seed, cal_turn, cal_delta})` — S11 과 같은 구조(마스크 12장 × 24턴 × 6장 = 1728장, 계절 가정, 0302 모델 판의 계수 추정)를 `makeMask(id, null, 'S13-'+seed)` 와 `hashSeed('S13', …)` 줄기로 다시 만듭니다. 기존 출력(CSV·`truth.json`·S1~S12·`simulateLoss`·전이 기록)은 바이트 단위로 그대로입니다. 유리마다 `fdc_temp`(참 온도 + N(0, 0.04²)), `dep_rate`(N(1, 0.03²), Mx 와 무관), `pressure`(참 온도와 상관 0.5, Mx 와 무관), `Mx_hat`. 센서 교정 변화: 턴 20부터 표시값 +0.3 K(참 온도·Mx 는 그대로). 분할: 학습 턴 1~12·검증 13~16·시험 17~24, 섞어 나누기 = 행 번호 % 10 < 7 이 학습.

도구 `s13tools`: `view`(교정 변화 전 판 또는 기록된 표시값)·`lin`(마스크별 절편 직선)·`cart`(회귀 트리, sklearn `DecisionTreeRegressor(random_state=0, min_samples_leaf=5)` 규칙 + 특징 훑는 순서·float32 모방, 깊이마다 따로 키움)·`priority`·`drift`(예측 오차 EWMA, λ 0.2 · L 은 0204 와 같은 ARL0 370)·`metrics`. 기본 시드 20(시드 1~200 의 여섯 지표 — 직선 시험 RMSE · 트리−직선 · 섞어 나누기÷시간순 · 무관 특징 변화 · 포착률−무작위 · 드리프트 첫 알람 지연 — 백분위 Σ|백분위−50| 최소, 모두 25~75% 안).

시드 1~200 분포(verify.py): 직선 시험 RMSE 0.145 ppm(10~90% 0.127~0.204), 트리가 직선보다 나쁨 200/200(차 +0.27), 섞어 나누기÷시간순 직선 0.99(0.93~1.06)·트리 0.56(0.46~0.67), 무관 특징(증착률·압력) 시험 RMSE 변화 ≈ 0, 우선순위 포착률−무작위(상위 20%, 한계 1.5 ppm) 0.49, 교정 변화 0.3 K 뒤 EWMA 알람 지연 2장(1~3), 변화 전 헛알람 2건(0~6). **설계 예상과 다른 점**: 직선은 섞어 나누기에서 낙관 편향이 없고(60% 시드에서 섞어 나눈 쪽이 작을 뿐 비 ≈ 1), 낙관 편향은 트리에서만 뚜렷합니다. 트리는 검증 RMSE 가 깊이 상한(8)에서 가장 낮습니다. **JS 트리와 sklearn**: 대표 시드는 깊이 1~8 예측이 모두 같고, 시드 1~40·200 은 구조가 어긋난 곳 0, 같은 표본을 똑같이 가르는 두 특징이 동점일 때(sklearn 무작위 순서·합의 끝자리) 고른 특징만 달라 시험 RMSE 가 최대 0.018 차이 나는 시드가 약 20%입니다.

## 마스크 수명 예측 (S14, 실험실 0306)

`MfgSim.scenario('S14', {seed, season_K})` — 마스크 24장(B02~B07 × 세트 A × 챔버 1~4)마다 마지막 리페어 뒤 지금까지 쓴 턴 수 `a0` 를 8~20 균등(hash)으로 두고(`mask.age_base = 24 − a0`, `turn − age_base = age`), 최근 8턴(달력 턴 17~24, 턴마다 유리 6장, 0303 레시피의 계절 가정·FDC 측정 온도 잡음)을 관측합니다. 유리마다 `ppa()` 77점 → 전부 항 최소제곱으로 `Mx_hat` → 0303 열 기울기(`scenario('S11')` 기본 시드 다중 회귀, 0304 의 `s12bT` 와 같은 방식)로 온도 보정 → 턴 평균. 마스크의 약 2/3 만 리페어 직후 첫 턴(age 1) 유리 6장의 보정 후 평균(기준)이 기록돼 있고 나머지는 기록 없음(수명은 '판단 불가'). 마스크 집단은 `makeMask(id, null, 'S14-'+seed)`, 새 난수는 전부 `hashSeed('S14', …)`. 기존 출력(CSV·`truth.json`·S1~S13·`simulateLoss`)은 바이트 단위로 그대로입니다(verify.py 가 sha256 으로 확인). `scenario()` 의 키 판정에 S14 특례를 하나 더했습니다.

정답: 참 `Mx_age(age) = −0.02 × age − 0.05`, 한계 L(기본 0.5 ppm, 가정)에 닿는 나이 = 1 + L/0.02 = 26. 모든 마스크가 같은 속도로 닳도록 정해 두었으므로 참 수명이 모두 같습니다.

도구 `s14tools`: `fit`(마스크별 직선 + 공통 기울기·마스크별 절편 + 기울기 이질성 F·p)·`tinv`(t 양측 임계값, 기존 `tp2` 의 이분법 역함수, scipy 와 1e-9)·`remaining`(잔여 수명 점 추정, 미래 한 값의 예측 구간·평균 신뢰구간이 한계선과 만나는 이른·늦은 끝)·`estimates`·`sim`(앞으로 30턴 모의: 규칙 A 고정 주기 = 정답 수명보다 작은 정수 주기, B 사후 대응 = 보정 후 배율을 기준과 견줘 한계를 넘은 것을 본 뒤, C 예측 = 예측 구간의 이른 끝 마감 순서로 능력 한도 안에서 미리; 마스크는 한 번만 리페어, 기준 기록 없는 마스크는 A·C 가 가장 이른 빈 자리에서 먼저 리페어)·`metrics`. 기본 시드 181(시드 1~200 의 여섯 지표 백분위에서 Σ|백분위 − 50| 최소).

시드 1~200 분포(verify.py): 마스크별 기울기 표준오차 중앙값 ÷ 공통 표준오차 4.1(3.2~4.7, 이상적인 √24 ≈ 4.9 보다 작음), 이질성 검정은 5% 수준에서 200개 중 23개(11.5%)에서 기각(이상적 5% 보다 높음: 불량 스틱 마스크의 잡음이 커서 잔차 분산이 같지 않음), 기록 있는 마스크의 잔여 수명 예측 오차 중앙값 2.3턴(1.5~3.2), 예측 구간이 참 수명을 담은 비율 평균 0.954(마스크별 0.955, 구간 폭 중앙값 공통 14.0턴 대 마스크별 28.0턴), 규칙 C − B 한계 초과 유리 중앙값 −6,720장(−11,520~−1,908, 200개 중 191개에서 −, 8개에서 +, 1개는 0), 규칙 C − A 버린 수명 중앙값 +1.5턴(−6~+11, 능력 한도가 걸려 둘이 비슷함).

## 사내 데이터 파이프라인 (S15, 실험실 0400)

`MfgSim.scenario('S15', {seed})` — 가상 공장 14일: 블록 B02·B03 × 챔버 1~4 = 8 챔버. 시간은 분(정수), 0 = 2026-03-02 06:00, 실행 k 일째의 시간 창 = `[(k−1)·1440, k·1440)`(다음 날 06:00 실행). 표 넷: `fdc_glass`(유리 간격 `CFG.CT` 분, 턴 120장, 턴 안 순번을 10 으로 나눈 나머지가 5 인 유리만 적재, 온도 = `chamberTemp` + 계절 + FDC 잡음, 약 0.5% 빈칸), `ppa_coef`(그 가운데 턴마다 6장, `ppa()` → `s11fit` 전부 항 최소제곱, `measured_ts` = 증착 + 45분 + 지수 지연(평균 45분)), `events`(챔버마다 날마다 종류별 확률로 한 번, 같은 챔버 안에서 겹치면 버림), `mask_hist`(챔버의 약 절반은 턴 10~55 사이에 세트 B 마스크로 교체, 이전 마스크는 WASH). 새 난수는 전부 `hashSeed('S15', …)` 줄기이고 `makeMask(id, null, 'S15-'+seed)`, 기존 출력(S1~S14·CSV·truth)은 바이트 단위로 그대로입니다.

- **고장 주입**(`hashSeed('S15', seed, 'fault', day)`): 날마다 0개 30%·1개 40%·2개 30%, 종류는 `late`(그날 PPA 줄의 15~50% 가 창 끝 + 24시간 + 지수(36시간) 뒤에 도착) · `dup`(6~12시간 구간의 FDC·PPA 줄이 두 번 적재) · `gap`(한 챔버의 FDC 가 4~10시간 없음) · `rename`(`chamber_temp` → `ch_temp`, 하루) · `shift`(FDC 의 `ts` 가 540분 밀림) · `model`(PPA 줄의 30~60% 가 `model_ver` = m2, 열 보정이 이미 들어간 Mx). 정답 = `S.faults`(날짜별 종류와 세부).
- **분석**(`MfgSim.s15tools`): 챔버별 하루 `Mx − 기울기 × (FDC 온도 − 80)` 평균(기울기는 `scenario('S11')` 기본 시드 다중 회귀, 0303)과 `ppa_metric` > spec(정답본 지표의 90 백분위) 건수, 이벤트에 붙은 유리 수(구간 이음). `extract`·`join`·`attach`·`analyze`·`checks`(일곱 점검 + 늦은 도착 알림)·`runAll`·`late4`·`metrics`·`fp`(FNV-1a 32비트).
- **지표 다섯**(시드 1~200 분포, 기본 시드 = Σ|백분위−50| 최소): 점검 없이 정답과 다른 날 수 · 점검이 잡은 고장 비율 · 헛잡은 날 수(고장 없는 날의 실패) · 되돌아보기 창이 바로잡은 늦은 자료 비율 · 놓친 날 수(통과했는데 정답과 다름). 정답과 다름의 기준은 챔버 평균 차 0.1 ppm, 초과 건수 차 max(4, 정답의 20%), 이벤트 붙은 유리 수 차 4. 기본 문턱: 행 수 0.8배·빈칸 2%·이음 98%, 되돌아보기 3일.

## LLM 답 기록 (실험실 0410)

`llm_runs_0410.json` 은 가상 공장(S15 정답본, 대표 시드 115)의 표를 LLM 에게 그대로 주고 받은 답의 원문 기록입니다. 모델 `claude-haiku-5-5`, 2026-11-26, 과제 여섯(T1 요약 · T2 작은 표 계산 · T3 원인(근거 자료 없음) · T4 원인(마스크 이력 함께) · T5 56칸 표준편차·중앙값 · T6 원자료 29줄 평균·초과 수·최댓값) × 서로 독립된 대화 세 번 = 답 18개이고, 프롬프트 전문이 들어 있습니다. 모델은 도구(계산기·코드 실행·파일 읽기)를 쓰지 않았습니다. 사람이 읽고 붙인 문장 판정은 `llmcheck.js` 의 `VERD` 에 있고, 판정의 근거 숫자는 표에서 계산합니다.

표 1·2 와 T6 원자료는 `scenario('S15')` 정답본(`csv/s15_clean_*.csv`)에서 규칙(1~7일, 06:00 창, `Mx_comp = Mx − thermal × (chamber_temp − T_ref)`, 초과 = `ppa_metric` > spec)으로 다시 만들어 프롬프트 속 표와 글자 단위로 같음을 확인합니다(표 3 은 `s15_mask_hist.csv`). 숫자 대조 `checkNumbers` 의 규칙은 숫자를 뽑되 날짜·시각·이름·번호를 먼저 지우고, 쓴 자릿수의 반 칸을 허용 오차로 표 칸(표에 있음)·정해 둔 계산 목록(계산됨)·그 밖(근거 없음)으로 나눕니다. 허용 오차 끝에서 맞은 것은 '거친 일치'로 따로 셉니다. 이 기록의 18개 답에서는 기준값(반 칸)에서 근거 없음이 0개였고, 소수 한 자리로 쓴 숫자는 우연히 맞는 비율이 80%(두 자리 51%, 세 자리 12%)입니다. `mfgsim.js`·CSV·`truth.json` 은 0410 에서 한 글자도 바꾸지 않았습니다. `verify.py` 는 0410 열다섯 검사를 더해 211항목입니다(표 재생성 = 프롬프트, 계산 과제 정답, 숫자 대조 18답 JS = 파이썬, 판정 근거 숫자, 겹침, 페이지 Python 출력).
