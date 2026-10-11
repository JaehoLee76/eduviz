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
['S1', 'S2', 'S3', 'S4', 'S5'].forEach(k => { S[k] = M.scenario(k); });
csv('s1_pm_shift.csv', S.S1.rows);
csv('s2_stick_replace.csv', S.S2.rows);
csv('s3_repair_pair.csv', S.S3.rows, ['px', 'py', 'x_mm', 'y_mm', 'defect_before', 'repair_err_before', 'repair_err_after']);
csv('s3_clean_pair.csv', S.S3.rows, ['px', 'py', 'x_mm', 'y_mm', 'clean_err_before', 'clean_err_after']);
csv('s4_thermal_confound.csv', S.S4.rows);
csv('s5_autocorr.csv', S.S5.rows);

// 손실 시뮬레이션 → 유리 이력 → FDC·PPA 표
const sim = M.simulateLoss();
csv('loss_events.csv', sim.events, ['event_id', 'start_ts', 'end_ts', 'block', 'chamber', 'reason', 'root_cause', 'caused_by_block', 'run_mode', 'mask_set', 'turn', 'loss_chamber_min', 'loss_glass']);
csv('loss_hourly.csv', sim.hourly);
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

// 정답(숨은 진실): 실험실이 대조용으로 쓴다. 학습자에게 보이기 전에는 열지 않는다.
const truth = {};
Object.keys(S).forEach(k => { truth[k] = { name: S[k].name, params: S[k].params, truth: S[k].truth, check: S[k].check }; });
fs.writeFileSync(path.join(dir, 'truth.json'), JSON.stringify(truth, null, 1));
console.log('truth.json written');
