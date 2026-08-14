/* EduViz — 화면 겹침·잘림 자동 검사 (PC·모바일 진짜 폭으로)
 *
 * 왜 이 파일인가: 헤드리스 크롬은 --window-size 로 500px 미만을 만들지 못한다.
 *   그래서 "모바일 검사"가 실제로는 500px에서 돌아 잘림을 놓친다.
 *   여기서는 크롬을 디버깅 포트로 띄우고 기기 화면 크기를 직접 지정(에뮬레이션)해 정확히 잰다.
 *
 * 쓰는 법:  node tools/ui_check.mjs                     (기본: adp 전 페이지)
 *          node tools/ui_check.mjs adp/index.html       (특정 페이지만)
 * 결과:     겹침·가로넘침·11px 미만 글자·화면밖 요소가 있으면 종료코드 1.
 *          스크린샷은 /tmp/uicheck/ 에 저장(눈으로도 확인 가능).
 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url).pathname;
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 8099, DBG = 9333, OUT = '/tmp/uicheck';
const SIZES = [
  { name: 'PC',     width: 1440, height: 900, dpr: 2, mobile: false },
  { name: '모바일', width: 390,  height: 844, dpr: 3, mobile: true  },
];
const PAGES = process.argv.slice(2).length ? process.argv.slice(2) : [
  'adp/index.html',
  'adp/labs/0001-fuel-economy-workflow.html',
  'adp/labs/0002-anova-lab.html',
  'adp/labs/0003-real-regression-problem.html',
];

const sleep = ms => new Promise(r => setTimeout(r, ms));
mkdirSync(OUT, { recursive: true });

const server = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${DBG}`, '--disable-gpu', '--no-first-run',
  '--no-default-browser-check', '--user-data-dir=/tmp/uicheck-profile', 'about:blank',
], { stdio: 'ignore' });
const bye = () => { try{ server.kill(); }catch{} try{ chrome.kill(); }catch{} };
process.on('exit', bye); process.on('SIGINT', () => { bye(); process.exit(130); });

async function ready(){
  for(let i = 0; i < 60; i++){
    try{ const r = await fetch(`http://localhost:${DBG}/json/version`); if(r.ok) return; }catch{}
    await sleep(250);
  }
  throw new Error('크롬 디버깅 포트가 열리지 않았습니다.');
}

class Tab {
  constructor(ws){ this.ws = ws; this.id = 0; this.waits = new Map(); this.events = [];
    ws.addEventListener('message', e => {
      const m = JSON.parse(e.data);
      if(m.id && this.waits.has(m.id)){ this.waits.get(m.id)(m.result); this.waits.delete(m.id); }
      else if(m.method) this.events.push(m.method);
    });
  }
  send(method, params = {}){
    const id = ++this.id;
    return new Promise(res => { this.waits.set(id, res); this.ws.send(JSON.stringify({ id, method, params })); });
  }
  static async open(url){
    const r = await fetch(`http://localhost:${DBG}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
    const t = await r.json();
    const ws = new WebSocket(t.webSocketDebuggerUrl);
    await new Promise(res => ws.addEventListener('open', res, { once: true }));
    return { tab: new Tab(ws), target: t };
  }
}

let failed = 0;
await ready();

for(const page of PAGES){
  for(const s of SIZES){
    const url = `http://localhost:${PORT}/${page}?uicheck=1`;
    const { tab, target } = await Tab.open('about:blank');
    await tab.send('Page.enable');
    await tab.send('Emulation.setDeviceMetricsOverride', {
      width: s.width, height: s.height, deviceScaleFactor: s.dpr, mobile: s.mobile,
    });
    await tab.send('Page.navigate', { url });
    await sleep(3200);                                   // 위젯 붙고 글꼴 적용될 때까지
    const { result } = await tab.send('Runtime.evaluate', {
      expression: `(document.getElementById('uicheck-report')||{}).textContent || 'NO-REPORT'`,
      returnByValue: true,
    });
    const tag = `${page.replace(/[/.]/g, '_')}_${s.name}`;
    const shot = await tab.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    if(shot?.data) writeFileSync(`${OUT}/${tag}.png`, Buffer.from(shot.data, 'base64'));

    const text = result.value || 'NO-REPORT';
    if(text.startsWith('UICHECK OK')){
      console.log(`✅ ${s.name}  ${page}`);
    } else if(text.startsWith('UICHECK FAIL')){
      console.log(`❌ ${s.name}  ${page}`);
      const r = JSON.parse(text.slice(text.indexOf('\n') + 1));
      for(const o of r.overlaps.slice(0, 12)) console.log(`   겹침 ${o.area}px²: ${o.a}  ↔  ${o.b}`);
      if(r.overflowX) console.log(`   가로 넘침: 내용 ${r.overflowX.scrollWidth}px > 화면 ${r.overflowX.viewport}px`);
      for(const t of r.tinyFont.slice(0, 8)) console.log(`   작은 글자 ${t.px}px: ${t.el}`);
      for(const o of r.offscreen.slice(0, 8)) console.log(`   화면 밖: ${o.el} (left ${o.left}, right ${o.right})`);
      failed = 1;
    } else {
      console.log(`⚠️  ${s.name}  ${page} — 검사기가 실행되지 않았습니다(uicheck.js 연결 확인)`);
      failed = 1;
    }
    await fetch(`http://localhost:${DBG}/json/close/${target.id}`);
  }
}

console.log(`스크린샷: ${OUT}`);
bye();
process.exit(failed);
