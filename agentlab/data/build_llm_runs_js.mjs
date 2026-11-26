// 실험실 0410·0411 의 LLM 답 기록(llm_runs_0410.json · llm_runs_0411.json)을 file:// 에서도 script 로 읽히게 감싼 .js 로 만듭니다.
//   node agentlab/data/build_llm_runs_js.mjs
// JSON 원본은 건드리지 않습니다. 두 파일의 내용이 같은지는 verify.py 가 확인합니다.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const dir = path.dirname(fileURLToPath(import.meta.url));
for (const n of ['0410', '0411']) {
  const raw = fs.readFileSync(path.join(dir, 'llm_runs_' + n + '.json'), 'utf8');
  const obj = JSON.parse(raw);
  const js = '/* llm_runs_' + n + '.json 을 script 로 읽히게 감싼 파일(내용은 같음). 만드는 법: node agentlab/data/build_llm_runs_js.mjs */\n' +
    '(function (root) {\n  var D = ' + JSON.stringify(obj) + ';\n' +
    "  if (typeof module === 'object' && module.exports) module.exports = D; else root.LLM_RUNS_" + n + ' = D;\n' +
    "})(typeof globalThis !== 'undefined' ? globalThis : this);\n";
  fs.writeFileSync(path.join(dir, 'llm_runs_' + n + '.js'), js);
  console.log('llm_runs_' + n + '.js', (js.length / 1024).toFixed(1) + ' KB');
}
