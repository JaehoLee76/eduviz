// 0201 실험실용 궤적 CSV 내보내기:  node agentlab/data/build_trace_csv.mjs
// 긴 형식(long format): wafer,t,pressure  — 유리 10장 × 60초. 페이지(0201)의 JS 와 같은 매개변수를 쓴다.
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url);
const M = require('./mfgsim.js');
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'csv');
fs.mkdirSync(dir, { recursive: true });

function waferOpts(i) {                       // i = 1..10
  const o = { seed: 100 + i, zeta: 0.6, wn: 0.9 * (1 + 0.03 * Math.sin(i * 2.1)), target: M.CFG.P_TARGET * (1 + 0.003 * Math.cos(i * 1.7)) };
  if (i === 8) { o.seed = 408; o.wn = 0.35; o.target = M.CFG.P_TARGET; }               // 정착 지연
  if (i === 9) { o.seed = 209; o.spike = { t0: 38, len: 3, amp: 12 }; }                // 순간 튐
  if (i === 10) { o.seed = 110; o.target = M.CFG.P_TARGET * 1.015; }                   // 수준 이동
  return o;
}
const rows = ['wafer,t,pressure'];
for (let i = 1; i <= 10; i++) {
  const tr = M.stepTrace(waferOpts(i));
  const id = 'W' + String(i).padStart(2, '0');
  tr.t.forEach((t, k) => rows.push(id + ',' + t + ',' + tr.y[k]));
}
fs.writeFileSync(path.join(dir, 'trace_w01_w10.csv'), rows.join('\n') + '\n');
console.log('trace_w01_w10.csv', rows.length - 1, 'rows');
