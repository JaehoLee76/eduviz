---
name: eduviz-anim
description: EduViz 알고리즘 분기를 코드동기 단계 애니메이션으로 대량 전환하는 파이프라인. 정적 concept:true 분기를 code+build+draw로 바꿔 좌측 코드 줄커서 + 우측 캔버스 단계애니로 만든다. "남은 분기 애니메이션화", "이어서 진행", "정적 분기 변환", EduViz 알고리즘 애니메이션 작업 시 호출.
---

# EduViz 알고리즘 애니메이션 전환 파이프라인

작업 디렉터리: **/Users/quantcommander/EduViz**. 먼저 `CLAUDE.md`를 읽어 아키텍처·골드패턴·함정을 숙지한다. 진행 상황은 `eduviz.md`.

목표: `js/content_algo_br.js`의 정적 `concept:true` 분기를 `code+build+draw`(왼쪽 코드 줄커서 `f.line` + 오른쪽 캔버스 단계 애니메이션)로 전환. **JS만 수정**(concept:true 제거, code/build/draw 추가). 텍스트·impl은 `content/algo_br.json`이 보유하여 자동 머지됨.

## 루프 (남은 정적 분기가 0이 될 때까지 반복)

### 1단계 — 인벤토리 (무엇이 남았나)
```bash
cd /Users/quantcommander/EduViz && python3 - <<'PY'
import re
js=open('js/content_algo_br.js',encoding='utf-8').read()
blocks={}
for m in re.finditer(r"\{ id:'(algo_br_[a-z0-9_]+)'", js):
    sid=m.group(1); end=js.find('\n  },',m.start()); blocks[sid]=js[m.start():end]
def bo(b):
    mm=re.search(r"branchOf:'([a-z0-9_]+)'",b); return mm.group(1) if mm else None
from collections import defaultdict
static=defaultdict(list)
for sid,b in blocks.items():
    if 'build:' in b: continue
    if 'exSet(' in b or sid.endswith('_proof') or 'proofScene' in b: continue
    if sid in ('algo_br_hanoi','algo_br_quicksort_recursion','algo_br_mergesort_recursion','algo_br_tree_recursion'): continue
    if 'concept:' in b: static[(bo(b) or '?').split('_')[0]].append(sid)
tot=0
for ch in sorted(static):
    print(ch, len(static[ch]), ' '.join(s.replace('algo_br_','') for s in static[ch])); tot+=len(static[ch])
print('REMAINING', tot)
PY
```
우선순위: 한 장(algo2/4/5/6/7)을 골라 그 장의 분기들을 처리. 분기 끝나면 커밋.

### 2단계 — 병렬 에이전트 디스패치 (한 웨이브 = 4 에이전트 × 5~6 분기 ≈ 20~24)
각 에이전트 프롬프트는 **짧게**: `이 skill 폴더의 agent-spec.md(/Users/quantcommander/EduViz/.claude/skills/eduviz-anim/agent-spec.md)를 읽고 그대로 따라 다음 분기들을 변환해 /tmp/scene_<id>.txt 에 써라` + 담당 id 목록 + 토픽 힌트 한 줄씩. 에이전트는 JSON에서 정확한 알고리즘 내용을 직접 읽는다(토픽 힌트는 방향만).
- 에이전트는 `/tmp/scene_<id>.txt`만 출력(단일 파일 동시편집 회피). `js/content_algo_br.js`는 절대 건드리지 않음.
- 한 에이전트당 5~6개. 관련 토픽끼리 묶기(예: 그래프 매칭류, 트리 DS류, 문자열 자동자류).

### 3단계 — 검증 + splice (메인이 수행)
```bash
cd /Users/quantcommander/EduViz
# (a) 각 파일 구문검증 — id 리스트 인라인(zsh 워드분할 주의)
for sid in <id1> <id2> ...; do f=/tmp/scene_algo_br_$sid.txt; [ -f "$f" ] || { echo "$sid MISSING"; continue; }; printf 'var AV={node:function(){},arrow:function(){}};var drawTreeB=function(){},gedge=function(){},uedge=function(){};var _=[' > /tmp/chk_$sid.js; cat "$f" >> /tmp/chk_$sid.js; printf '\n];\n' >> /tmp/chk_$sid.js; node --check /tmp/chk_$sid.js && echo "$sid OK" || echo "$sid FAIL"; done
# (b) splice (중복 id occurrence별 branchOf 보존 + normalize 포함) — 공백구분 id 인자
python3 .claude/skills/eduviz-anim/splice.py <id1> <id2> ...
```
`splice.py`가 백업→normalize→모든 occurrence 치환(각자 branchOf 보존)→`node --check`→실패 시 자동 복원.

### 4단계 — 렌더 스캔 (에러 0 필수)
`preview_start name=eduviz` → `algo.html` 로드 후 아래를 preview_eval로 실행, 폴링하여 `done:true, errs:[]` 확인.
```js
(function(){ window.__errs=[]; window.__scan={done:false,log:[],i:0};
  window.onerror=function(m){ window.__errs.push(String(m)); return false; };
  if(!window.Engine) return 'NO ENGINE @'+location.pathname;
  var N=330; function visit(i){ if(i>=N){window.__scan.done=true;return;}
    try{Engine.goTo(i);}catch(e){window.__scan.log.push(i+':'+e.message);}
    setTimeout(function(){ var st=document.body.classList.contains('stepped'); var hd=(document.getElementById('codeHead')||{textContent:''}).textContent||''; var b=window.__errs.length;
      if(st)for(var k=0;k<45;k++)document.dispatchEvent(new KeyboardEvent('keydown',{key:'d',code:'KeyD',bubbles:true}));
      setTimeout(function(){ var ne=window.__errs.slice(b); if(ne.length)window.__scan.log.push('#'+i+' ['+hd.slice(0,28)+']: '+ne[0]); window.__scan.i=i; visit(i+1); },18);
    },18); } visit(0); return 'scan started'; })()
```
폴링: `JSON.stringify({i:window.__scan.i,done:window.__scan.done,errs:window.__scan.log})`. 에러가 있으면 해당 id 장면 수정 후 재-splice.

### 5단계 — 커밋·배포 (한 장 또는 웨이브 단위)
```bash
cd /Users/quantcommander/EduViz && git add js/content_algo_br.js
git commit -F /tmp/msg.txt          # 한글 메시지는 파일로(따옴표 깨짐 방지)
printf '{"v":"%s"}\n' "$(date +%s)" > version.json && git add version.json && git commit -m "chore: bump"
git push origin main && gh api -X POST repos/JaehoLee76/eduviz/pages/builds
```
커밋 후 `eduviz.md`의 진행상황 섹션을 갱신(끝난 장/남은 수).

## 핵심 함정 (CLAUDE.md §6 재확인)
- 패치 끝 반드시 `  },`. 중복 id는 splice.py가 occurrence별 처리. zsh는 id 리스트 인라인. 난수 금지(고정배열). 골든룰: 모든 표시값 실제 계산.
