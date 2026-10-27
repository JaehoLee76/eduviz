# 가상 제조 데이터 (MfgSim)

이 폴더의 데이터는 전부 **가상**입니다. 실제 공정값·회사 데이터가 아니며, 같은 코드를 돌리면 항상 같은 결과가 나옵니다(고정 시드, `Math.random`·`Date.now` 미사용). 명세는 `_content/FDC/_teach/DATA_SPEC.md` 입니다.

## 파일

| 파일 | 설명 |
|---|---|
| `mfgsim.js` | 시뮬레이터 본체. 브라우저에서는 `<script src="mfgsim.js">` 로 `window.MfgSim`, node 에서는 `require('./mfgsim.js')` |
| `build_csv.mjs` | `node agentlab/data/build_csv.mjs` 로 `csv/` 를 다시 만듭니다 |
| `verify.py` | scipy 로 시나리오의 숨은 성질을 검사합니다(`python3 verify.py`, 22항목) |
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
- `fdc_features.csv` — B03 의 5개 턴 유리별 특징. `p_steady_mean, p_steady_std, p_max_dev, p_settle_s, p_overshoot_pct, rate_ang_s, pm_flag(PM 이후=1), true_anomaly, anomaly_type, interlock, interlock_true`(가성 인터락 = interlock 1 이고 interlock_true 0).
- `loss_events.csv` — 60일 Loss 사건. `event_id, start_ts, end_ts, block, chamber(CH1~4 또는 ALL), reason(직접 사유), root_cause(1차 원인), caused_by_block, run_mode(quad/triple/degraded), mask_set, turn, loss_chamber_min, loss_glass`. 사유는 명세의 11개 코드와 `LB-LINE`(라인 밸런스: 앞뒤 블록 때문에 굶거나 막힌 손실, 90 챔버·분 미만은 생략)입니다. `reason` 과 `root_cause` 가 다른 행이 연쇄의 흔적입니다.
- `loss_hourly.csv` — 1시간 단위 상태. `ts, stocker_fill, cleaner_queue, cleaner_busy, cassette_free, transport_requests, blocks_triple, blocks_idle, line_wip, line_out`.
- `truth.json` — 시나리오 숨은 정답과 JS 자체 점검값. 학습자에게 답을 보이기 전에는 열지 않습니다.
