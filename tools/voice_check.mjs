#!/usr/bin/env node
/* 학습자료 화법 검사 — 화면에 나가는 글에 '제작 흔적'이 남아 있는지 훑는다.
   규칙: AGENTS.md §1 (학습자만이 독자). 사용: node tools/voice_check.mjs
   코드 주석 줄은 화면에 안 나오므로 건너뛴다. */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const ROOT = new URL('..', import.meta.url).pathname;
const TARGET_DIRS = ['adp', 'content', 'js'];
const SKIP = /node_modules|\.git|_content|tools/;

const PATTERNS = [
  [1, '구현·제작 자랑', /하드코딩|공식을 베|베낀 게 아니|미리 적어 둔|라이브러리 없이|실시간으로 계산한 값|코드로 검증|시뮬레이션에서 측정|엔진이 매 프레임|그 자리에서 실제로 계산한 값/],
  [2, '수정 이력·자기 교정', /바로잡았습니다|앞서 잘못|이전 버전에서는|보완했습니다|다시 썼습니다|수정했습니다/],
  [3, '대화 흔적', /말씀하신|지적하신|요청하신|질문 주신|사령관/],
  [4, '집필 계획 노출', /아직 만들지 않|아직 준비 중|다음 버전에서|TODO|나중에 채우/],
];

function walk(d, out = []) {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (SKIP.test(p)) continue;
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (['.html', '.js', '.json'].includes(extname(p))) out.push(p);
  }
  return out;
}

let hits = 0;
for (const dir of TARGET_DIRS) {
  let files = [];
  try { files = walk(join(ROOT, dir)); } catch { continue; }
  for (const f of files) {
    const lines = readFileSync(f, 'utf8').split('\n');
    let inBlock = false;
    lines.forEach((ln, i) => {
      const code = ln.trim();
      const wasBlock = inBlock;
      if (inBlock) { if (ln.includes('*/')) inBlock = false; }
      else if (/\/\*/.test(ln) && !/\*\//.test(ln)) inBlock = true;
      if (wasBlock) return;                                   // 블록 주석 안
      if (code.startsWith('//') || code.startsWith('/*') || code.startsWith('*')) return; // 코드 주석
      for (const [type, name, re] of PATTERNS) {
        if (re.test(ln)) {
          hits++;
          console.log(`${f.replace(ROOT, '')}:${i + 1}  [${type} ${name}]  ${code.slice(0, 120)}`);
          break;
        }
      }
    });
  }
}
console.log(hits === 0 ? '\n✅ 제작 흔적 없음' : `\n⚠️  ${hits}건 — 학습 문장이면 고치고, 화면에 안 나오는 문자열이면 무시하세요.`);
process.exit(0);
