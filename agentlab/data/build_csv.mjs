// 가상 제조 데이터 CSV 내보내기:  node agentlab/data/build_csv.mjs
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url);
const M = require('./mfgsim.js');
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'csv');
fs.mkdirSync(dir, { recursive: true });

function csv(name, rows, cols) {
  cols = cols || Object.keys(rows[0]);
  const esc = v => (v == null ? '' : String(v).includes(',') ? '"' + String(v).replace(/"/g, '""') + '"' : String(v));
  const txt = [cols.join(',')].concat(rows.map(r => cols.map(c => esc(r[c])).join(','))).join('\n') + '\n';
  fs.writeFileSync(path.join(dir, name), txt);
  console.log(name.padEnd(26), String(rows.length).padStart(6), 'rows', (txt.length / 1024).toFixed(0).padStart(5), 'KB');
}

const S = {};
['S1', 'S2', 'S3', 'S4', 'S5', 'S6'].forEach(k => { S[k] = M.scenario(k); });
csv('s1_pm_shift.csv', S.S1.rows);
csv('s2_stick_replace.csv', S.S2.rows);
csv('s3_repair_pair.csv', S.S3.rows, ['px', 'py', 'x_mm', 'y_mm', 'defect_before', 'repair_err_before', 'repair_err_after']);
csv('s3_clean_pair.csv', S.S3.rows, ['px', 'py', 'x_mm', 'y_mm', 'clean_err_before', 'clean_err_after']);
csv('s4_thermal_confound.csv', S.S4.rows);
csv('s5_autocorr.csv', S.S5.rows);
csv('s6_false_alarm.csv', S.S6.csvRows());

// 손실 시뮬레이션 → 유리 이력 → FDC·PPA 표
const sim = M.simulateLoss();
csv('loss_events.csv', sim.events, ['event_id', 'start_ts', 'end_ts', 'block', 'chamber', 'reason', 'root_cause', 'caused_by_block', 'run_mode', 'mask_set', 'turn', 'loss_chamber_min', 'loss_glass']);
csv('loss_hourly.csv', sim.hourly);
// ESTC 전이 기록(같은 공장·같은 시드, 기록 훅만 켠 실행): 마스크·세트·챔버·블록의 상태 전이를 한 줄씩. t = 시작부터 분
const simT = M.simulateLoss({ trace: true });
csv('mask_transitions.csv', simT.transitions, ['t', 'entity', 'id', 'from', 'to', 'trigger', 'cause']);
const gl = M.glassHistory(sim, { block: 'B03', turnFrom: 0, turnTo: 5 });
csv('fdc_features.csv', M.fdcTable(gl, sim));

// PPA 표본: B03 CH2 의 몇 장(턴 안 초·중·말 유리), 긴 형식
const ppaRows = [];
const pick = gl.filter(g => g.chamber === 'CH2').filter((g, i, a) => [0, 40, 100].includes(g.glass_in_turn - 1)).slice(0, 3);
pick.forEach(g => {
  const mask = M.makeMask(g.mask_id);
  const res = M.ppa(g, mask);
  res.grid.forEach(q => ppaRows.push({ glass_id: g.glass_id, block: g.block, chamber: g.chamber, mask_id: g.mask_id, turn: g.turn, glass_in_turn: g.glass_in_turn,
    chamber_temp: g.chamber_temp, px: q.px, py: q.py, x_mm: +q.x_mm.toFixed(1), y_mm: +q.y_mm.toFixed(1), dx_um: +q.dx_um.toFixed(4), dy_um: +q.dy_um.toFixed(4), defect: q.defect }));
});
csv('ppa_sample.csv', ppaRows);

// S10: 마스크 72장 × 77점(대표 시드). 실험실 0301 의 Python 코드가 읽는다. bad_stick = 마스크 정답(불량 스틱 열 번호, 없으면 -1)
csv('ppa_s10.csv', M.scenario('S10').csvRows());

// S11: 마스크 12장 × 24턴 × 6장 = 1728장. 실험실 0303 의 Python 코드가 읽는다. 유리마다 계수 한 줄(ppa_coef_s11) + 그 유리의 FDC 챔버 온도(fdc_temp_s11, 일부 유리는 FDC 기록이 빠져 있음)
const S11 = M.scenario('S11');
csv('ppa_coef_s11.csv', S11.csvRows());
csv('fdc_temp_s11.csv', S11.fdcCsvRows());

// S12: 마스크 24장 × 유리 8장 × 77점 = 14784행. 실험실 0304 의 Python 코드가 읽는다(정답 성분·튄 점 정답은 넣지 않음)
csv('ppa_s12.csv', M.scenario('S12').csvRows());

// S13: 마스크 12장 × 24턴 × 6장 = 1728장. 실험실 0305 의 Python 코드가 읽는다(FDC 특징 + 측정 Mx̂ + 센서 교정 판 cal_ver). 정답 성분은 넣지 않음
csv('vm_s13.csv', M.scenario('S13').csvRows());

// S14: 마스크 24장 × 최근 8턴 = 192행. 실험실 0306 의 Python 코드가 읽는다(턴 평균 표: mask_id·turn·age_known·Mx_comp·baseline). 정답은 넣지 않음
csv('life_s14.csv', M.scenario('S14').csvRows());

// S15: 가상 공장 14일 × 8 챔버. 실험실 0400 의 Python 코드가 읽는다. s15_ 표 넷 = 적재본(날마다 0~2개 고장이 들어간, 사내 DB 가 실제로 받은 모습),
// s15_clean_ 둘 = 정답본(고장 없이 들어왔다면의 표 · 결과 대조용), s15_faults = 날짜별 주입 목록(정답). 시각은 'YYYY-MM-DD HH:MM' 문자열(사전순 = 시간순)
const S15 = M.scenario('S15');
['fdc_glass', 'ppa_coef', 'events', 'mask_hist'].forEach(n => csv('s15_' + n + '.csv', S15.csvRows(n), S15.cols[n]));
csv('s15_clean_fdc_glass.csv', S15.csvRows('clean_fdc_glass'), S15.cols.fdc);
csv('s15_clean_ppa_coef.csv', S15.csvRows('clean_ppa_coef'), S15.cols.ppa);
csv('s15_faults.csv', S15.csvRows('faults'), ['day', 'kind', 'detail']);

// 실험실 0402: 대표 시드 115 에서 0401 에이전트가 한 행동(정책 셋: 엄격·2개 허용·점검 끔)과 사람 결론(가상 공장에서는 정답: 고장이 든 날·마스크 교체와 그 크기).
// s15_agent_log_115 = 에이전트 행동 기록(날마다 분석 여부 + 새 변경점 + 요청), s15_human_labels_115 = 사람 결론. 에이전트가 만든 자료를 사람 결론으로 쓰지 않도록 두 파일을 따로 둔다.
const E402 = require('./eval0402.js');
const raw402 = E402.seedRaw(E402.REP);
csv('s15_agent_log_115.csv', E402.logRows(raw402), ['policy', 'day', 'event', 'chamber', 'detail']);
csv('s15_human_labels_115.csv', E402.labelRows(raw402), ['kind', 'day', 'chamber', 'value']);

// 실험실 0501: 시드 1~40 의 60일 Loss 를 코드별 합으로 줄인 요약(시드·종류(direct 직접 사유 / root 근본 원인)·코드·사건 수·잃은 유리 장수·챔버 분) + 기본 시드(20261011) 한 묶음.
// 페이지가 브라우저에서 같은 시드를 다시 돌려 순위 분포를 만들고, 이 CSV 는 회사 PC 의 Python 이 읽는다.
const L05 = require('./loss05.js');
const l05 = [L05.DEFAULT_SEED].concat(Array.from({ length: L05.SEEDS }, (_, i) => i + 1)).map(sd => L05.seedRun(sd));
const r4 = v => Math.round(v * 1e4) / 1e4;
csv('loss_seed_summary.csv', L05.seedRows(l05).map(r => ({ seed: r.seed, kind: r.kind, code: r.code, n: r.n, glass: r4(r.glass), min: r4(r.min) })), ['seed', 'kind', 'code', 'n', 'glass', 'min']);

// 실험실 0502: 새 시나리오 S16 '공통 추세'(가상 램프업 라인 90일) 시드 1~200 에서 고른 대표 시드의 날별 표. glass_in = 그날 투입 유리 수(노출량), vx_jam·vy_src·vz_retry = 날별 건수.
// 정답(X·Y 는 원인 관계 없음, X → 다음 날 Z 연쇄 있음)은 넣지 않는다. 기존 CSV 는 바이트 불변이고 이 파일 하나만 더한다.
const s16runs = L05.s16Run(Array.from({ length: L05.S16.SEEDS }, (_, i) => i + 1));
const s16rep = L05.s16Rep(s16runs);
csv('s16_common_trend.csv', L05.s16Rows(s16runs[s16rep.seed - 1].g), ['day', 'glass_in', 'vx_jam', 'vy_src', 'vz_retry']);
console.log('S16 representative seed', s16rep.seed, JSON.stringify(s16rep.pcs));

// 실험실 0503: 기본 시드의 마스크 사용 이력(simT 의 전이 기록에서 사용 한 번 = 한 줄: 마스크·시작 분·나이(리페어 뒤 세정 횟수)·블록·FMM 여부·세트 평균 나이·결함 여부)과,
// 시드(기본 + 1~40)마다 한 줄로 줄인 예측 요약(기본 지평 24시간·분할 40일·트리 깊이 3·점검 10%). 페이지가 브라우저에서 같은 시드를 다시 돌리고, 이 CSV 는 회사 PC 의 Python 이 읽는다.
csv('mask_uses.csv', L05.maskRows(L05.maskUses(simT.transitions)), ['mask_id', 't', 'age', 'block', 'fmm', 'set_age', 'defect']);
const f5 = L05.F5;
const l503 = [L05.DEFAULT_SEED].concat(Array.from({ length: f5.SEEDS }, (_, i) => i + 1)).map(sd => L05.seed503(sd, f5.H, f5.SPLIT, f5.DEPTH, f5.K));
csv('loss_forecast_seeds.csv', L05.seed503Rows(l503), Object.keys(l503[0]));

// 실험실 0601: 닫힌 고리. '실제 공장'은 simulateLoss 에 숨은 파라미터를 넣은 것이라 숨은 값은 어떤 파일에도 넣지 않는다(loop06.js 안에만 있고 정답 열기·verify 가 읽는다).
// s17_real_events/hourly = 실제 공장 로그(대표 로그 시드·60일·운전 대수 27) · s17_real_log_summary = 로그 시드 20개 × 기간 4개의 지표 · s17_twin_grid = 트윈의 세정 시간 격자 × 트윈 시드의 지표
// s17_policy_table = 결정 값(세정기 운전 대수)별 60일 Loss(트윈 격자 쪽과 결정 뒤 실제 결과 쪽) · s17_seed_summary = 로그 시드 × 기간별 보정 최소점·gap 전후·권고·결정 손해(기본 비용 가정)
const L06 = require('./loop06.js');
const T06 = L06.buildTables();
const rs06 = L06.repSeed(T06, L06.DEFAULT_COST);
const sim06 = L06.realSim(rs06.seed, L06.CAP0);
csv('s17_real_events.csv', sim06.events, ['event_id', 'start_ts', 'end_ts', 'start_min', 'block', 'chamber', 'reason', 'root_cause', 'caused_by_block', 'run_mode', 'mask_set', 'turn', 'loss_chamber_min', 'loss_glass']);
csv('s17_real_hourly.csv', sim06.hourly);
const k06 = ['days', 'q', 'busy', 'L'].concat(L06.CODES);
csv('s17_real_log_summary.csv', T06.reallog, ['seed'].concat(k06));
csv('s17_twin_grid.csv', T06.grid, ['clean', 'seed'].concat(k06));
csv('s17_policy_table.csv', T06.pol, ['side', 'clean', 'seed', 'cap', 'loss']);
csv('s17_seed_summary.csv', L06.seedSummary(T06, L06.DEFAULT_COST), ['seed', 'days', 'chat', 'gap_before', 'gap_after', 'cap_v0', 'cap_cal', 'cap_best', 'regret_v0', 'regret_cal']);
fs.writeFileSync(path.join(dir, '..', 'loop06_tables.js'), '/* 0601 이 읽는 미리 계산한 표(build_csv.mjs 가 만듭니다). 같은 내용이 csv/s17_*.csv 에 있습니다. 숨은 값은 들어 있지 않습니다. */\nwindow.LOOP06_TABLES=' + JSON.stringify({ grid: T06.grid, pol: T06.pol, reallog: T06.reallog }) + ';\n');
console.log('S17 representative real-log seed', rs06.seed, 'score', rs06.score.toFixed(1));

// 실험실 0602: 시뮬레이터를 실제에 맞추기. 숨은 값(세정 시간·한 턴 길이·S18 의 세정 시간 식)은 어떤 파일에도 넣지 않는다(calib06.js·loop06.js 안에만 있고 정답 열기·verify 가 읽는다).
// s17_fine_grid = 촘촘한 세정 시간 격자(2분 간격 41칸) × 트윈 시드 8개 × 로그 기간 4개의 지표(에뮬레이터의 재료) · s17_fine_policy = 결정 값별 60일 Loss(세정 시간 격자 4분 간격 11칸 × 트윈 시드 8개)
// s17_calib_logs = 로그 시드(0601 의 20개 + 포함률을 재는 100개) × 기간 4개의 지표(세정 대기열·세정 중·Loss·시간당 완성 유리·시간당 반송 요청) · s17_ridge_grid = 세정 시간 × 한 턴 길이 격자의 60일 지표
// s18_chunk_grid = S18 의 하루 관측(3일을 돌려 앞 하루를 버림)을 뒤집는 에뮬레이터 재료 · s18_daily = S18 계열(Q 를 고르는 10개 + 평가 20개) 날마다의 관측 · s18_events = 세정액을 교체한 날(공장 변경 사건 기록)
const C06 = require('./calib06.js');
const T02 = C06.buildTables();
csv('s17_fine_grid.csv', T02.fine, ['clean', 'seed', 'days', 'q', 'busy', 'L']);
csv('s17_fine_policy.csv', T02.pol, ['clean', 'seed', 'cap', 'loss']);
csv('s17_calib_logs.csv', T02.logs, ['seed', 'days', 'q', 'busy', 'L', 'out', 'tr']);
csv('s17_ridge_grid.csv', T02.ridge, ['clean', 'tt', 'seed', 'q', 'L', 'out', 'tr']);
csv('s18_chunk_grid.csv', T02.chunk, ['clean', 'seed', 'q', 'L']);
csv('s18_daily.csv', T02.s18, ['series', 'day', 'q', 'L']);
csv('s18_events.csv', C06.S18.REPLACE.map(d => ({ day: d + 1, event: 'liquid_replaced' })), ['day', 'event']);
const pack06 = (rows, cols) => ({ c: cols, r: rows.map(r => cols.map(k => r[k])) });
fs.writeFileSync(path.join(dir, '..', 'calib06_tables.js'), '/* 0602 가 읽는 미리 계산한 표(build_csv.mjs 가 만듭니다). 같은 내용이 csv/s17_fine_*.csv·s17_calib_logs.csv·s17_ridge_grid.csv·s18_*.csv 에 있습니다. 숨은 값은 들어 있지 않습니다. */\n(function(){var D=' + JSON.stringify({ fine: pack06(T02.fine, ['clean', 'seed', 'days', 'q', 'busy', 'L']), pol: pack06(T02.pol, ['clean', 'seed', 'cap', 'loss']), logs: pack06(T02.logs, ['seed', 'days', 'q', 'busy', 'L', 'out', 'tr']), ridge: pack06(T02.ridge, ['clean', 'tt', 'seed', 'q', 'L', 'out', 'tr']), chunk: pack06(T02.chunk, ['clean', 'seed', 'q', 'L']), s18: pack06(T02.s18, ['series', 'day', 'q', 'L']) }) + ';var T={};Object.keys(D).forEach(function(k){T[k]=D[k].r.map(function(r){var o={};D[k].c.forEach(function(c,i){o[c]=r[i];});return o;});});if(typeof module==="object"&&module.exports)module.exports=T;else window.CALIB06_TABLES=T;})();\n');
console.log('0602 tables ready');

// 실험실 0603: 런투런 제어. 숨은 값(실제 공정 이득)은 어떤 파일에도 넣지 않는다(r2r06.js 안에만 있고 정답 열기·verify 가 읽는다).
// s19_r2r = 대표 시드에서 사람 방식(잰 값이 문턱을 넘으면 그만큼 보정)으로 운영한 기록(턴마다 잰 배율 오차·그 턴에 넣은 보정값·마스크 교체 표시)
// s19_seed_summary = 시드 200개의 세 방식 지표·최적 λ·로그에서 읽은 공정 이득 추정 · s19_lambda_sweep = 표류 배수·측정 잡음 크기에 따른 λ 별 RMS(시드 200개 분포)
const R06 = require('./r2r06.js');
const T03 = R06.buildTables();
csv('s19_r2r.csv', T03.log.map(r => ({ turn: r.turn, y_ppm: r.y, u_ppm: r.u, mask_replaced: r.replaced })), ['turn', 'y_ppm', 'u_ppm', 'mask_replaced']);
csv('s19_seed_summary.csv', T03.seeds, ['seed', 'rep_turn', 'rms_none', 'rms_human', 'rms_ewma', 'rms_ewma_nr', 'oos_none', 'oos_human', 'oos_ewma', 'oos_ewma_nr', 'rms_slow', 'rms_slow_nr', 'oos_slow', 'oos_slow_nr', 'best_lam', 'wig_ewma', 'gain_hat']);
csv('s19_lambda_sweep.csv', T03.sweep, ['axis', 'value', 'lam', 'rms_p10', 'rms_p50', 'rms_p90', 'oos_p50']);
fs.writeFileSync(path.join(dir, '..', 'r2r06_tables.js'), '/* 0603 이 읽는 미리 계산한 표(build_csv.mjs 가 만듭니다). 같은 내용이 csv/s19_*.csv 에 있습니다. 숨은 값은 들어 있지 않습니다. */\n(function(){var T=' + JSON.stringify({ noise_turn: T03.noise_turn, lam: T03.lam, rep: T03.rep, log: T03.log, seeds: T03.seeds, sweep: T03.sweep }) + ';if(typeof module==="object"&&module.exports)module.exports=T;else window.R2R06_TABLES=T;})();\n');
console.log('S19 representative seed', T03.rep, 'score', T03.score.toFixed(1), 'default lambda', T03.lam);

// 실험실 0604: 과거 로그로 새 규칙 평가하기. 결과(Loss)는 학습용 생성 모형이라 숨은 값(상황·행동별 기대 Loss·잡음 크기)은 어떤 파일에도 넣지 않는다(ope06.js 안에만 있고 정답 열기·verify 가 읽는다).
// 상황 분포(대기 수·카세트 여유·남은 시간)는 위에서 만든 s17_real_hourly.csv 의 분위 값으로 정한다. s20_logged = 대표 시드의 기록(결정마다 상황·고른 행동·고른 확률·결과 — 숨은 값 열 없음)
// s20_seed_summary = 시드 200개 × (ε 여섯 × 로그 길이 넷 [급한 세트 먼저] + ε 여섯 [남은 시간 3시간 이하일 때만]) 의 추정기별 값·유효 표본 수·일치한 줄 수. 소수 넷째 자리 반올림, 지원이 없어 추정할 수 없으면 빈칸.
const O06 = require('./ope06.js');
const hr06 = fs.readFileSync(path.join(dir, 's17_real_hourly.csv'), 'utf8').trim().split('\n');
const hk06 = hr06[0].split(',');
const hrows06 = hr06.slice(1).map(l => { const v = l.split(','); const o = {}; hk06.forEach((k, i) => { o[k] = v[i]; }); return o; });
const ctx06 = O06.ctxFromHourly(hrows06);
O06.setCtx(ctx06);
const sum06 = O06.summaryRows();
csv('s20_seed_summary.csv', sum06, ['target', 'n', 'eps', 'seed'].concat(O06.COLS));
const rep06 = O06.pickRep(sum06.filter(r => r.target === 'urgent' && r.n === O06.DEF_N && r.eps === O06.DEF_EPS));
csv('s20_logged.csv', O06.logRows(O06.scenario(rep06.seed, { eps: O06.DEF_EPS, n: O06.DEF_N })), ['decision', 'queue', 'cassette_free', 'slack_h', 'action', 'propensity', 'loss_glass']);
const pk06 = ['target', 'n', 'eps', 'seed'].concat(O06.COLS);
fs.writeFileSync(path.join(dir, '..', 'ope06_tables.js'), '/* 0604 가 읽는 미리 계산한 표(build_csv.mjs 가 만듭니다). 같은 내용이 csv/s20_seed_summary.csv 에 있습니다. 숨은 값은 들어 있지 않습니다. */\n(function(){var D=' + JSON.stringify({ ctx: ctx06, rep: rep06.seed, score: rep06.score, c: pk06, r: sum06.map(r => pk06.map(k => (r[k] === '' ? null : r[k]))) }) + ';var T={ctx:D.ctx,rep:D.rep,score:D.score,seeds:D.r.map(function(r){var o={};D.c.forEach(function(c,i){o[c]=r[i]===null?NaN:r[i];});return o;})};if(typeof module==="object"&&module.exports)module.exports=T;else window.OPE06_TABLES=T;})();\n');
console.log('S20 representative seed', rep06.seed, 'score', rep06.score.toFixed(1));


// 실험실 0605: 트윈 안에서 정책 학습(작은 강화학습·도메인 무작위화). 환경(S21: 세트 교체 시점 결정)은 simulateLoss 가 이 결정을 바깥에서 바꿀 수 없어 학습용 작은 모형이고, 세정 시간이 다음 세트의 도착 시각을 정하는 길만
// 시뮬레이터 기록(세정 대기열·세정 중 평균, 리틀의 법칙)에서 가져온다. 숨은 값(실제 세정 시간)은 어떤 파일에도 넣지 않는다(loop06.js 안에만 있고 정답 열기·verify 가 읽는다).
// s21_wait_table = 세정 시간별 세정 전 줄 서서 기다리는 평균 시간(분) · s21_posterior = 0602 의 사후분포(대표 로그의 로그 기간 4개)와 사전만(로그 없음) · s21_twins = 학습에 쓰는 트윈의 세정 시간(판 0·0601 격자 보정·사후 평균)
// s21_real_episodes = 실제 라인에서 쌓인 판 4,000개(그때 남은 유리·다음 세트 도착 간격 수 — 숨은 값 열 없음) · s21_seed_summary = 학습 시드 200 × 방식 넷(기본 설정)의 실제·트윈 안 Loss
const RL06 = require('./rl06.js');
function build0605(L06, C06, T06, T02, RL, MS, events, writeTables) {
  const r4 = v => Math.round(v * 1e4) / 1e4, r8 = v => Math.round(v * 1e8) / 1e8;
  const FINE = C06.FINE, WIN = C06.WINDOWS, PSD = 30, DEFC = L06.DEFAULT_COST;
  // 0602 의 대표 로그(사후 평균·구간 폭·결정 손해의 백분위가 50 에서 가장 가까운 로그 — 0602 페이지와 같은 계산)
  const EMU = {}, FM = {}; WIN.forEach(d => { EMU[d] = C06.emuFine(T02, d); FM[d] = C06.fineMeans(T02, d); });
  const TB = C06.polTable(T02.pol), CACHE = {};
  const P1 = (s, d) => { const k = s + '|' + d; return CACHE[k] || (CACHE[k] = C06.post1(T02, EMU, s, d, PSD)); };
  const INFO = L06.REAL_LOG_SEEDS.map(s => ({ seed: s, p60: P1(s, 60), p7: P1(s, 7), dec: C06.decide(T06, T02, EMU, TB, s, 60, DEFC, PSD, FM[60]) }));
  const rep02 = C06.pickRep(INFO, [i => i.p60.mean, i => i.p60.width, i => i.p7.width, i => i.dec.regPost, i => i.dec.regGrid]).item.seed;
  // 리틀의 법칙으로 세정 시간별 세정 전 줄 서서 기다리는 평균 시간(분): q·세정 시간 ÷ busy (60일, 트윈 시드 8개 평균)
  const f60 = T02.fine.filter(r => r.days === 60), mean = a => a.reduce((x, y) => x + y, 0) / a.length;
  const wt = FINE.map(c => { const rr = f60.filter(r => r.clean === c), q = mean(rr.map(r => r.q)), b = mean(rr.map(r => r.busy)); return { clean: c, q: r4(q), busy: r4(b), wait_min: r4(q * c / b) }; });
  const wq = { c: wt.map(r => r.clean), w: wt.map(r => r.wait_min) };
  // 사후분포(사전 180±30, 0602 기본)와 사전만(로그 없음)
  const post = { c: FINE.slice() }, pm = {}, grid = {};
  WIN.forEach(d => { const p = P1(rep02, d); post['w' + d] = p.post.map(r8); pm['w' + d] = r4(p.mean); grid['w' + d] = L06.loopFor(T06, rep02, d, DEFC).chat; });
  const pri = FINE.map(c => Math.exp(-0.5 * Math.pow((c - L06.V0_CLEAN) / PSD, 2))), ps = pri.reduce((a, b) => a + b, 0);
  post.prior = pri.map(v => r8(v / ps));
  const cal = { rep: rep02, v0: L06.V0_CLEAN, grid: grid.w60, gridw: grid, pm, psd: PSD };
  // 시뮬레이터 기록과의 연결(대표 로그 60일): 세정기 capa 부족(블록이 다음 세트를 기다려 선 사건)·조기 잡 체인지
  const ev = c => events.filter(e => e.reason === c), sim = { days: 60 };
  [['clCapa', 'CL-CAPA'], ['jcEarly', 'JC-EARLY']].forEach(([k, c]) => { const x = ev(c); sim[k + 'N'] = x.length; sim[k + 'Mean'] = r4(mean(x.map(e => e.loss_glass))); });
  sim.clCapaPerMonth = sim.clCapaN * 30 / sim.days;
  const real = RL.buildReal(L06.HIDDEN.CLEAN, 4000, wq);
  const tabs = { wq, post, cal, real, sim, rep: null };
  // 학습 결과 요약(시드 200 × 방식 넷, 기본 설정): 표 파일이 있어야 RL 이 돈다 → 임시로 쓴다
  writeTables(tabs);
  const rows = [], METH = ['v0', 'cal', 'pm', 'dr'], SEEDS = 200;
  METH.forEach(m => {
    for (let s = 1; s <= SEEDS; s++) { const r = RL.runMethod(m, { seed: s }); rows.push({ seed: s, method: m, real_loss: r4(r.real.mean), twin_loss: r4(r.twin.mean), spare_rate: r4(r.real.spare), early_rate: r4(r.real.early) }); }
  });
  // 대표 학습 시드: 실제 Loss(넷)·트윈 Loss(무작위화)의 백분위가 50 에서 가장 가까운 시드(Σ|백분위−50| 최소, 같으면 작은 시드)
  const col = (m, k) => rows.filter(r => r.method === m).map(r => r[k]);
  const metrics = [col('v0', 'real_loss'), col('cal', 'real_loss'), col('pm', 'real_loss'), col('dr', 'real_loss'), col('dr', 'twin_loss')];
  let best = null;
  for (let s = 1; s <= SEEDS; s++) { let sc = 0; metrics.forEach(v => { sc += Math.abs(L06.pct(v, v[s - 1]) - 50); }); if (best == null || sc < best.score - 1e-9) best = { seed: s, score: sc }; }
  tabs.rep = best;
  writeTables(tabs);
  const csvPost = FINE.map((c, i) => ({ clean: c, p_log7: post.w7[i], p_log14: post.w14[i], p_log30: post.w30[i], p_log60: post.w60[i], p_prior: post.prior[i] }));
  const tw = [{ twin: 'v0', clean: cal.v0 }];
  WIN.forEach(d => tw.push({ twin: 'grid_log' + d, clean: grid['w' + d] }));
  WIN.forEach(d => tw.push({ twin: 'postmean_log' + d, clean: pm['w' + d] }));
  tw.push({ twin: 'prior_mean', clean: cal.v0 });
  return { tabs, csvWait: wt, csvPost, csvTwins: tw, csvReal: real.r0.map((v, i) => ({ episode: i + 1, remaining_glass: v, arrive_epoch: real.D[i] })), csvSeeds: rows };
}

const pack21 = t => '/* 0605 가 읽는 미리 계산한 표(build_csv.mjs 가 만듭니다). 같은 내용이 csv/s21_*.csv 에 있습니다. 숨은 값은 들어 있지 않습니다. */\n(function(){var T=' + JSON.stringify(t) + ';if(typeof module==="object"&&module.exports)module.exports=T;else window.RL06_TABLES=T;})();\n';
const O21 = build0605(L06, C06, T06, T02, RL06, M, sim06.events, t => fs.writeFileSync(path.join(dir, '..', 'rl06_tables.js'), pack21(t)));
csv('s21_wait_table.csv', O21.csvWait, ['clean', 'q', 'busy', 'wait_min']);
csv('s21_posterior.csv', O21.csvPost, ['clean', 'p_log7', 'p_log14', 'p_log30', 'p_log60', 'p_prior']);
csv('s21_twins.csv', O21.csvTwins, ['twin', 'clean']);
csv('s21_real_episodes.csv', O21.csvReal, ['episode', 'remaining_glass', 'arrive_epoch']);
csv('s21_seed_summary.csv', O21.csvSeeds, ['seed', 'method', 'real_loss', 'twin_loss', 'spare_rate', 'early_rate']);
console.log('S21 representative training seed', O21.tabs.rep.seed, 'score', O21.tabs.rep.score.toFixed(1), 'posterior rep log', O21.tabs.cal.rep);

// 실험실 0606: 지금 닿을 수 있는 한계선(오프라인 강화학습과 LLM 에이전트). 0605 의 환경(S21)에서 지금 규칙 + 작은 탐색 ε 로 쌓인 로그를 만들고(off06.js), 로그만으로 배운 정책을 실제 판 기록(s21_real_episodes)에서 잰다.
// off06_tables.js = 도착 시각 문턱표(숨은 값 비노출) + 시드 1~200 × ε × 로그 크기 요약 + 대표 시드 + 트랙 총괄(각 실험실 페이지에서 읽은 '앞으로 기록해 둘 데이터' 항목과 도구 함수 이름).
// s21_offline_log = 대표 시드·기본 설정의 로그 줄 · s21_offline_seed_summary = 같은 요약표.
const OFF06 = require('./off06.js');
function build0606(OFF, RL, L06, wq, MS) {
  const r4 = v => Math.round(v * 1e4) / 1e4;
  const thr = OFF.buildThr(L06.HIDDEN.CLEAN, wq);
  const rows = [];
  for (let ei = 0; ei < OFF.EPS_GRID.length; ei++) for (let ni = 0; ni < OFF.N_GRID.length; ni++) for (let s = 1; s <= OFF.SEEDS; s++) {
    const r = OFF.runSeed(s, { eps: OFF.EPS_GRID[ei], n: OFF.N_GRID[ni], thr });
    rows.push({ seed: s, eps: OFF.EPS_GRID[ei], n: OFF.N_GRID[ni], bc: r4(r.bc), naive: r4(r.naive), cons: r4(r.cons), naive_ood: r4(r.naive_ood), cons_ood: r4(r.cons_ood) });
  }
  const def = rows.filter(r => r.eps === OFF.EPS_DEF && r.n === OFF.N_DEF);
  const rep = OFF.pickRep(def);
  const log = OFF.makeLog(rep.seed, { eps: OFF.EPS_DEF, n: OFF.N_DEF, thr });
  // 트랙 총괄: 각 실험실 페이지(0101~0605)에서 '앞으로 기록해 둘 데이터' 항목과 도구 상자 함수 이름을 읽는다(손으로 옮겨 적지 않음)
  const labsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'labs');
  const strip = h => h.replace(/<[^>]+>/g, '').replace(/&ldquo;|&rdquo;/g, '"').replace(/&lsquo;|&rsquo;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&mdash;/g, '—').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  const track = [];
  fs.readdirSync(labsDir).filter(f => /^0[1-6]\d\d-.*\.html$/.test(f) && !f.startsWith('0606')).sort().forEach(f => {
    const h = fs.readFileSync(path.join(labsDir, f), 'utf8'), id = f.slice(0, 4);
    const t = (h.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
    const mi = h.search(/<h[23][^>]*>(?:<span[^>]*>[^<]*<\/span>)?\s*앞으로 기록해 둘 데이터/);
    let heads = [];
    if (mi >= 0) {
      const rest = h.slice(mi), me = rest.search(/에이전트 도구 상자/), seg = me > 0 ? rest.slice(0, me) : rest.slice(0, 4000);
      const items = [...seg.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map(m => strip(m[1]));
      heads = items.map(tx => {
        let cut = tx, i = -1, re = /: |— /g, m;
        while ((m = re.exec(tx))) { if (!/\(예$/.test(tx.slice(0, m.index))) { i = m.index; break; } }
        if (i >= 4 && i <= 80) cut = tx.slice(0, i);
        cut = cut.replace(/[.。]\s*$/, '');
        const sp = cut.indexOf('. '); if (sp > 10) cut = cut.slice(0, sp);
        return cut;
      });
    }
    // 도구 상자: 이 페이지의 Python 이 정의한 함수(def) 가운데, 도구 상자 구역(제목 뒤 3,500자)이나 도구 표(tbl('tab…Tool…') 앞뒤)의 <code> 안이나 표 첫 칸에 이름이 나오는 것
    const defs = new Set([...h.matchAll(/^def ([A-Za-z_][A-Za-z0-9_]*)\(/gm)].map(m => m[1]));
    const ti = h.indexOf('에이전트 도구 상자');
    let zone = ti >= 0 ? h.slice(ti, ti + 3500) : '';
    for (const m of h.matchAll(/tbl\('tab\w*Tool\w*'/g)) zone += h.slice(Math.max(0, m.index - 1500), m.index + 900);
    const mentioned = new Set();
    for (const m of zone.matchAll(/<code>([^<]*)<\/code>/g)) for (const w of m[1].matchAll(/[A-Za-z_][A-Za-z0-9_]{2,}/g)) mentioned.add(w[0]);
    for (const m of zone.matchAll(/\[\s*'([A-Za-z_][A-Za-z0-9_]*)'\s*,/g)) mentioned.add(m[1]);
    const tools = [...defs].filter(n => mentioned.has(n) && !n.startsWith('_'));
    track.push({ id, file: f, title: strip(t), records: heads, tools });
  });
  return { thr, rows, rep, log, track };
}
const Q06 = build0606(OFF06, RL06, L06, O21.tabs.wq, M);
const pack06o = t => '/* 0606 이 읽는 미리 계산한 표(build_csv.mjs 가 만듭니다). 같은 내용이 csv/s21_offline_seed_summary.csv 에 있습니다. 숨은 값은 들어 있지 않습니다. */\n(function(){var D=' + JSON.stringify(t) + ';var T={thr:D.thr,rep:D.rep,eps:D.eps,n:D.n,c:D.c,seeds:D.r.map(function(r){var o={};D.c.forEach(function(c,i){o[c]=r[i];});return o;}),track:D.track};if(typeof module==="object"&&module.exports)module.exports=T;else window.OFF06_TABLES=T;})();\n';
const COLQ06 = ['seed', 'eps', 'n', 'bc', 'naive', 'cons', 'naive_ood', 'cons_ood'];
fs.writeFileSync(path.join(dir, '..', 'off06_tables.js'), pack06o({ thr: Q06.thr, rep: Q06.rep, eps: OFF06.EPS_GRID, n: OFF06.N_GRID, c: COLQ06, r: Q06.rows.map(r => COLQ06.map(k => r[k])), track: Q06.track }));
csv('s21_offline_log.csv', OFF06.logCsv(Q06.log), ['episode', 'step', 'remaining_glass', 'arrived', 'elapsed_or_wait', 'action', 'propensity', 'reward', 'done']);
csv('s21_offline_seed_summary.csv', Q06.rows, COLQ06);
console.log('S21 offline representative seed', Q06.rep.seed, 'score', Q06.rep.score.toFixed(1));

// 정답(숨은 진실): 실험실이 대조용으로 쓴다. 학습자에게 보이기 전에는 열지 않는다.
const truth = {};
Object.keys(S).forEach(k => { truth[k] = { name: S[k].name, params: S[k].params, truth: S[k].truth, check: S[k].check }; });
fs.writeFileSync(path.join(dir, 'truth.json'), JSON.stringify(truth, null, 1));
console.log('truth.json written');
