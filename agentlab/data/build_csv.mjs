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

// 정답(숨은 진실): 실험실이 대조용으로 쓴다. 학습자에게 보이기 전에는 열지 않는다.
const truth = {};
Object.keys(S).forEach(k => { truth[k] = { name: S[k].name, params: S[k].params, truth: S[k].truth, check: S[k].check }; });
fs.writeFileSync(path.join(dir, 'truth.json'), JSON.stringify(truth, null, 1));
console.log('truth.json written');
