# EduViz — 프로젝트 지침 (CLAUDE.md, 세션 시작 시 자동 로드)

> 이 파일은 EduViz 작업에 필요한 **모든 핵심 규칙·아키텍처·작업법**을 담는다.
> 새 세션은 이 파일만 읽으면 바로 이어서 작업할 수 있어야 한다.
> 현재 진행 상황(무엇이 끝났고 무엇이 남았는지)은 같은 폴더의 **`eduviz.md`** 참조.
> 대량 변환 작업은 **`/eduviz-anim` skill** 호출(`.claude/skills/eduviz-anim/`).

## 0. 정체성 / 비전
EduViz = 순수 정적 HTML/CSS/바닐라JS 교육 사이트. 빌드 불필요, 브라우저로 바로 열림.
- 위치: `/Users/quantcommander/EduViz/` (이 폴더가 git 저장소 루트, GitHub Pages 배포).
- 두 트랙: **수학 26장(238장면=뼈대143+분기95)** · **알고리즘 8장(+시작) 뼈대 42 + 심화분기 268**.
- 상태(2026-06-21): 알고리즘 애니메이션 전환 **100%(161/161)** · 심화 **14섹션 재구조화 완료**(§3.5) · 수학 트랙 **전수 감사·보강 완료**(§3.6, 빈draw·정적장식·골든룰위반·stale참조·죽은코드 전부 0). 다음은 사령관 지시 대기(품질 고도화·신규 토픽 확장 등).
- 비전(사령관): "우리 콘텐츠만 학습하면 그 어떤 자료보다 더 빠르고 확실하게 개념·응용을 뇌리에 각인." 세계 최고 품질.
- 홈 `home.html` → `math.html`(수학) / `algo.html`(알고리즘). morph 단일화면 엔진(`js/engine.js` 공유).
- 라이브: https://jaeholee76.github.io/eduviz/ (사령관 계정 JaehoLee76/eduviz).

## 1. 절대 규칙
1. **언어: 항상 존댓말(-습니다/-세요).** 반말 절대 금지(짧은 확인·상태보고도). 사령관 전역 지침.
2. **골든룰(절대): 가짜 금지.** 화면에 표시되는 모든 수·위치·거리·DP값·넓이·확률은 `build()`/`draw()`에서 **실제로 계산한 값**이어야 한다(알고리즘·수학 공통). 손대충/하드코딩한 그럴듯한 가짜 수치 금지(예: 적분값·교차참조번호·삼각형 각을 박아넣지 말 것 — 리만합·실측으로). 도형이 표시 수치와 분리된 '장식'도 위반.
3. **알고리즘 시각화 = 코드+애니메이션 쌍.** 모든 알고리즘 분기는 왼쪽 코드에 **실행 줄 커서**가 단계마다 이동하고(`f.line`), 오른쪽 캔버스에서 알고리즘이 **실제 한 단계씩** 동작해야 한다. 정적 그래픽만 두지 않는다.
4. **한·영 병기·스토리 연결·학습패널**: 기존 콘텐츠 철학 유지(텍스트는 JSON이 보유, 변환 시 보존됨).
5. **리포트/문서 커밋 규칙**: EduViz는 의도된 웹사이트 프로젝트이므로 코드·콘텐츠(html/js/json) 커밋 정상. (트레이딩 프로젝트의 "리포트 커밋 금지"는 별개 트랙 규범, 여기 적용 안 됨.) 단 `_content/`(대용량 원본)는 .gitignore.

## 2. 아키텍처 (핵심)
- `algo.html` / `math.html` — 2단 레이아웃. 좌측 `#codeBody`(코드+줄커서)·`#stepCap`(STEP 캡션)·`#conceptExtra`(핵심요약/구현코드/연습문제), 하단 `#stepbar`(◂이전 D/다음·자동재생 S/초기화 X), 우측 `#stage` 캔버스.
- `js/engine.js` — 공유 코어. **SceneManager(뼈대 spine + 분기 branch, branchOf로 계층)**, viz-mode, 단계기계 `_steps`/`paintStep`/`stepNext`. 매 프레임 `sc.draw(E, _steps[_stepI])` 호출.
- **콘텐츠↔동작 분리**: 동작(code/build/draw/enter)은 `js/content_*.js`, 텍스트(title/narr/more/problem/impl)는 `content/*.json`. 엔진이 시작 시 JSON을 **id로 머지**(`for k in c: sc[k]=c[k]`). → 텍스트 수정=JSON만, 동작 수정=JS만.
- 알고리즘 분기 동작 = **단일 파일 `js/content_algo_br.js`**(IIFE, 끝에 `Engine.addScenes(scenes)`). 텍스트 = `content/algo_br.json`(id 키).
- **viz 판정**: `setVizMode`에서 `hasCode = sc.code && sc.build` 이면 viz모드(코드+줄커서+캔버스+하단 impl=구현코드). `concept:true`(+build 없음)면 개념모드(좌측 narr/요약, 스텝바 숨김). `concept:true`라도 `build` 있으면 캔버스 단계애니(코드커서는 없음).
- **JSON 머지는 모든 키를 오버라이드**(buildHierarchy 이전 실행). 즉 `content/algo_br.json`에 `branchOf`/`ord`/`sec`를 넣으면 JS 블록 값을 덮어씀 → **분기 재배치·재정렬은 JSON만으로**(1.5MB JS 무수정). 단 `more`/`narr` 등 텍스트도 JSON이 최종.
- **분기 순서 = `ord` 오름차순(기본 9999)**: `buildHierarchy`가 부모별 `_branches`를 ord로 정렬 후 `_num` 부여. 같은 부모에 **중복 id는 1개만**(교차배치 함정 자동 제거).
- **viz 분기에서 화면에 보이는 설명 = `stepCap`(스텝 캡션) + `more`(핵심요약, conceptExtra)**. `narr`은 `#bubble`로 가는데 viz 모드는 opacity:0이라 **안 보임**. → 분기 연결어·설명은 `more`에 넣어야 학습자가 본다.
- **공용 헬퍼**: `window.AlgoMap(E,{title,sub,stages:[{c,t,items}],foot})` = 심화 섹션 '학습 지도' 렌더러(content_algo0.js). 섹션 노드 draw를 데이터만으로.
- **수학 tap 장면 키**: D=한 설명단위 진행, S=자동(연속 morph는 `{tgt,auto}` boundary 모델, `s.t<tgt`까지만 진행). 풀이 토글 = R키(`toggleSolution`). algo viz는 D=stepNext.

## 3. 알고리즘 분기 애니메이션 (✅ 100% 완료 — 본보기/참고용)
정적 `concept:true` 분기를 **`code+build+draw`** 로 전환하는 작업은 **161/161 완료**. 아래 골드 패턴은 새 분기 추가·수정 시 본보기.

**골드 패턴(검증·배포 완료, 본보기로 읽을 것):** `js/content_algo_br.js`의 `algo_br_huffman`(트리병합+우선순위큐칩), `algo_br_nqueens`(백트래킹 보드), `algo_br_gauss`(행렬 실연산), `algo_br_bellman`/`algo_br_mst`(가중그래프, gedge 헬퍼).

```
  { id:'<id>', branchOf:'<부모뼈대 id>',
    code:[ '<의사코드 줄0>', '<줄1>', ... ],   // 줄커서 대상
    build:function(V){ var st=[];
      function snap(line,cap,extra){ var f={line:line,cap:cap}; if(extra)for(var k in extra)f[k]=extra[k]; st.push(f); }
      /* 알고리즘을 실제로 돌리며 단계마다 snap */ return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H; /* f의 상태 렌더 */ } },
```

**규칙**: ①장면 텍스트는 두 칸 들여쓰기 `  { id:` 로 시작, **반드시 `  },`(쉼표) 로 끝남**. ②`line`은 code 배열 인덱스(정수/정수배열), 범위 밖 금지. ③프레임이 draw에 필요한 모든 상태를 담음, draw는 `f`에서만 읽음. ④draw는 `if(!f)return;` 시작. ⑤10~24 단계, 캡션 존댓말. ⑥`concept:true`/title/narr/more/impl/problem 재정의 금지(JSON 머지). ⑦색상 `#ffb27a`활성 `#8fe3b5`완료 `#7ab8ff`중립 `#f4a0c0`특수 `#dfeefb`텍스트 `#9b99a3`흐림. ⑧헬퍼 `gedge/uedge`(그래프)·`drawTreeB`(트리)·`AV.node/AV.arrow` 사용가능(같은 파일 스코프). ⑨작은 고정 예제(n≈4~8), **`Math.random()`/`Date.now()` 금지**(난수는 고정배열로 사전계산).

**대량 변환은 `/eduviz-anim` skill 사용**(병렬 에이전트 → /tmp/scene_<id>.txt → id-블록 splice → 검증). 자세한 절차는 skill 파일에.

## 3.5 심화(분기) 재구조화 (✅ 14섹션 완료 2026-06-21 — 패턴 재사용)
**문제**(콘텐츠 검토 발견): 심화 분기가 소수 허브에 주제 불일치로 적재(RSA→해시, 기하→스택, 문자열→선형탐색, 플로우/매칭→다익스트라). 순서대로 보면 스토리가 끊김. → **14개 주제 섹션으로 재편 완료**(문자열·정수론·계산기하·고급자료구조·가중그래프·플로우·매칭·고급그래프·고급DP·DP최적화·분할정복·조합게임·균형트리·고급트리). 핵심 뼈대 42장은 유지. 아래 패턴은 향후 섹션 추가/조정 시 재사용.

**해결 패턴(검증·배포 완료, 본보기 군집: 문자열·정수론·계산기하). 애니메이션 JS는 무수정:**
1. **섹션 노드 신설**: `content_algoN.js`에 `{ id:'algoN_0X', concept:true, enter:function(E){this.s={};E.setOn([]);}, draw:function(E){ window.AlgoMap(E,{title,sub,stages,foot}); } }` 추가. 8챕터 유지(새 챕터 만들지 말 것) — 관련 챕터 파일 끝에 append. ch 라벨은 thematic 가능(예 '알고리즘 · 수론·정수론'). 본보기 `algo2_06`(정수론)·`algo2_07`(계산기하)·`algo4_05`(문자열).
2. **섹션 텍스트**: `content/algoN.json`에 `{ch,sec,title,narr,hint,more,more_en}`.
3. **재배치는 `content/algo_br.json`만 수정**(파이썬 스크립트 권장): 각 분기에 `branchOf:'<섹션id>'`, `ord:1..N`(서사 순서), `sec`, 그리고 **`more` 앞에 한 문장 연결어**(앞 주제와 잇기 — viz는 more가 보임). 변명성 연결어("최단 경로 자리에서 다루는" 등) 제거.
4. **검증**: `preview_start` → 섹션 노드 심화학습(N) 버튼·ord 순서·crumb·렌더 스캔 에러0.

**완료된 14섹션**: 문자열(algo4_05)·정수론(algo2_06)·계산기하(algo2_07)·고급자료구조(algo2_08)·가중그래프(algo6_06)·네트워크플로우(algo6_07)·매칭(algo6_08)·고급그래프DFS(algo6_09)·고급DP(algo7_06)·DP최적화(algo7_07)·분할정복다항식(algo8_06)·조합게임(algo8_07)·균형트리(algo5_06)·고급트리(algo5_07). 원허브엔 본연토픽·증명·5제퀴즈만 잔류.

## 3.6 수학 트랙 (장면 패턴 · 전수 감사 완료)
수학은 알고리즘과 달리 코드+줄커서가 아니라 **개념을 조작(인터랙티브)으로 각인**시킨다. 동작=`js/content_chN.js`(ch1~26), 텍스트=`content/chN.json`. 마스코트 '도형이' 안내. 전 26장 감사·보강 완료(빈 draw 0·정적장식 0·골든룰위반 0·죽은코드 0).

**장면 4유형(전부 표시값 실계산=골든룰)**:
1. **슬라이더형**: `enter`에서 `E.controls('<div class="ctrl"><label>…<input type=range id=xx …><output id=xxo>…</output></div>')` + `E.bind('#xx','input',fn)`. draw가 슬라이더값으로 그래프·수치 실시간 갱신. 본보기 ch5(함수), ch14_03(0/0 거리d), ch8_05(사인법칙 a/sinA=2R 실측).
2. **tap-step형**: `tap:function(E){ this.s.step=(step+1)%N; }` + draw가 step별 렌더. 연속 morph는 `{tgt,auto}` boundary 모델(D=다음 설명단위, S=자동, draw에서 `s.t<tgt`까지만 진행). 본보기 ch3_01/ch3_02(저울 drawBalance), ch3_03(완전제곱 정사각형).
3. **드래그형**: `down/move/up`으로 점 끌기(ch1_03 정수 마커).
4. **개념형**: `concept:true`(좌측 narr/요약 패널, 캔버스 보조). `problem`(JSON)은 학습패널(W)에 연습문제로 표시, 풀이 토글 R키.
**공용 헬퍼**(파일 스코프): `drawBalance(E,L,R)`(저울, ch3), `box(ctx,x,y,w,h,col,label,fs)`(대수타일, ch2·3), `E.Plot`(`.range/.axes/.curve/.dot/.X/.Y`), `E.NL`(수직선), `E.blink()`(깜빡임), `E.tapHint(x,y,text,pulse)`, `E.big(title,sub)`, `E.quiz()`. ※`E.quiz`는 controls 영역을 덮어쓰므로 슬라이더와 공존 불가(둘 중 하나).
**키**: D=한 설명단위 진행/탭, S=자동, R=풀이 보기/숨기기(toggleSolution), W=학습패널, Q/Z·E/C=스크롤. (math.html, §2 참조)
**나선형 교차참조**: narr/more에 `#장면번호`(예 "14장 0/0 극한(#84)") 118건. 장면 추가/삭제 시 번호가 어긋나니 보강 후 **번호↔실제 장면 주제 자동 대조**로 stale 검증(이번 감사에서 8건 교정). 검증=preview math 238장면 렌더 스캔(슬라이더·탭 구동) 에러0.

## 4. 검증 워크플로우 (변경 후 필수)
1. `node --check js/content_algo_br.js` (구문).
2. 미리보기: `preview_start name=eduviz` → `algo.html` 로드 → **렌더 스캔**(0..N goTo, N은 뼈대+분기 총수 ≈ 350+, 섹션 노드 추가로 증가 중 + 각 장면 D키 다회 + `window.onerror` 캡처). **에러 0 필수.** JSON만 바꿔도 캐시(`?v=Date.now()`) 때문에 **리로드 후** 스캔.
3. 핵심 장면 스크린샷으로 품질 확인(코드커서 동기·실제 연산값).
- **수학 변경 시**: `math.html` 로드 → 0..238 goTo + 슬라이더(`#controls input[type=range]` max/min 토글)·D키 다회 구동 + onerror 캡처. 에러0.
- 미리보기 서버 설정: `.claude/launch.json`(eduviz = python http.server 8077). 끊기면 `preview_start name=eduviz` 다시.

## 5. 배포
코드만 커밋 → `version.json` epoch 범프(클라이언트 자동 갱신) → push → Pages 빌드 트리거.
```
git add js/content_algo_br.js && git commit -F /tmp/msg.txt   # 한글 메시지는 heredoc/파일로(따옴표 깨짐 방지)
printf '{"v":"%s"}\n' "$(date +%s)" > version.json && git add version.json && git commit -m "chore: bump"
git push origin main && gh api -X POST repos/JaehoLee76/eduviz/pages/builds
```

## 6. 함정 (반복 확인됨)
- **trailing comma**: 패치 파일이 `  },` 로 안 끝나면 다음 `{` 토큰 에러 → 사이트 전체 깨짐.
- **중복 id 블록**: `content_algo_br.js`에 같은 id가 2번 나오는 분기 있음(extgcd/segtree/trie/sieve/fenwick/lca — 두 장에 교차배치). splice(애니 수정) 시 splice.py가 모든 occurrence 처리. **재배치(JSON) 시**엔 JSON `branchOf`가 같은 id의 두 블록을 모두 한 부모로 보내므로 중복 — 이미 `buildHierarchy`가 부모별 id 중복을 제거하므로 화면엔 1개만 나옴(심화학습 카운트로 확인).
- **JSON 변경은 캐시 리로드 필요**: 재배치 검증 전 반드시 `location.reload()`.
- **zsh 워드분할**: 따옴표 없는 `$VAR`는 zsh에서 분할 안 됨 → for 루프는 id 리스트 인라인.
- **에이전트 출력 들여쓰기**: 첫 줄 두 칸 들여쓰기 누락 빈번 → splice 전 normalize.
- **세션한도/중단**: 에이전트가 중간에 끊겨도 `/tmp/scene_*.txt`는 이미 써둠 → 존재 확인 후 splice 가능.

## 7. 이어가기 (새 세션)
사령관이 "**eduviz.md 읽고 작업준비 해**" 라고 하면:
1. 같은 폴더 **`eduviz.md`** 읽기(현재 진행상황·우선순위).
2. 알고리즘 애니메이션·심화 재구조화·수학 감사는 모두 **완료** 상태(§0). 새 지시는 보통 품질 고도화·신규 토픽 확장. 작업 종류별 패턴:
   - 알고리즘 분기 애니메이션 신규/수정 → §3 골드패턴 (대량은 `/eduviz-anim` skill).
   - 알고리즘 심화 섹션 추가/재배치 → §3.5 (AlgoMap + JSON branchOf/ord/sec).
   - 수학 장면 신규/보강 → §3.6 4유형 패턴 (슬라이더·tap-step·드래그·개념, 표시값 실계산).
3. 검증=preview 렌더 스캔 에러0(§4) → 커밋·version 범프·push·Pages.
