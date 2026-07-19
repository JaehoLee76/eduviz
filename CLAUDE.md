# EduViz — 프로젝트 지침 (CLAUDE.md, 세션 시작 시 자동 로드)

> 이 파일은 EduViz 작업에 필요한 **모든 핵심 규칙·아키텍처·작업법**을 담는다.
> 새 세션은 이 파일만 읽으면 바로 이어서 작업할 수 있어야 한다.
> 현재 진행 상황(무엇이 끝났고 무엇이 남았는지)은 같은 폴더의 **`eduviz.md`** 참조.
> 대량 변환 작업은 **`/eduviz-anim` skill** 호출(`.claude/skills/eduviz-anim/`).
> **콘텐츠 일관성 감사(애니↔설명 불일치)** 요청 시 반드시 **`eduviz_audit.md` 먼저 읽기** — 전 콘텐츠 재독(토큰 폭증) 금지, 무료 렌더 스캔→증분(git diff 기준선) 순서로(§4 끝 참조).

## 0. 정체성 / 비전
EduViz = 순수 정적 HTML/CSS/바닐라JS 교육 사이트. 빌드 불필요, 브라우저로 바로 열림.
- 위치: `/Users/quantcommander/EduViz/` (이 폴더가 git 저장소 루트, GitHub Pages 배포).
- 아홉 트랙: **수학 26장(238장면)** · **알고리즘 8장(뼈대 42+심화 268)** · **물리학 14장(70장면, PhysLab 엔진 기반)** · **미적분학(Stewart 16장)** · **인공지능(16장 83장면, 힌턴)** · **파이썬 for AI(16장 83장면, 귀도 · 코드패널+줄커서)** · **C++(17장, 스트롭스트룹 · 1~16장 기초~STL~모던 + 16장=주요 알고리즘 구현 + 17장=재귀 특별장[본문5+심화5]. ★콘텐츠는 출처 표기 없이 독자 제작 — 특정 교재 참고 사실 노출 금지)**. **산업위생관리기술사(앰버 ⛑)** · **빅데이터분석(로즈 마젠타 📊 — 초급~중급=데이터 처리·분석 실무, 고급=예측 모델링 20장+사례연구 10건. ★원본 자료는 R이지만 콘텐츠는 100% Python(pandas·NumPy·scikit-learn·statsmodels)으로 전환 — R 함수·패키지명 노출 절대 금지. 출처 표기 없이 독자 제작)**. 홈 `home.html` → math/algo/physics/calculus/ai/python/cpp/hygiene/**bda**.html. 신규 코드계열 트랙(파이썬·C++·AI일부)=codePanel 패턴(좌측 진짜 코드+D키 줄커서 `actLine`, 우측 골든룰 실계산 시각화). C++=블루 테마(`#5ab4e8`).
- 상태(2026-06-23): 알고리즘 애니메이션 **100%(161/161)** + 심화 **14섹션 재구조화 완료**(§3.5) · 수학 **전수 감사·보강 완료**(§3.6) · 물리학 **14장 70장면 전체 완료**(§3.7) · 미적분학 **전 15장 78장면 + 심화 31분기 완성(본문78+심화31=109장면)**(§3.8).
- 비전(사령관): "우리 콘텐츠만 학습하면 그 어떤 자료보다 더 빠르고 확실하게 개념·응용을 뇌리에 각인." 세계 최고 품질.
- 홈 `home.html` → `math.html`(수학) / `algo.html`(알고리즘). morph 단일화면 엔진(`js/engine.js` 공유).
- 라이브: https://jaeholee76.github.io/eduviz/ (사령관 계정 JaehoLee76/eduviz).

## 1. 절대 규칙
1. **언어: 항상 존댓말(-습니다/-세요).** 반말 절대 금지(짧은 확인·상태보고도). 사령관 전역 지침.
2. **골든룰(절대): 가짜 금지.** 화면에 표시되는 모든 수·위치·거리·DP값·넓이·확률은 `build()`/`draw()`에서 **실제로 계산한 값**이어야 한다(알고리즘·수학 공통). 손대충/하드코딩한 그럴듯한 가짜 수치 금지(예: 적분값·교차참조번호·삼각형 각을 박아넣지 말 것 — 리만합·실측으로). 도형이 표시 수치와 분리된 '장식'도 위반.
3. **알고리즘 시각화 = 코드+애니메이션 쌍.** 모든 알고리즘 분기는 왼쪽 코드에 **실행 줄 커서**가 단계마다 이동하고(`f.line`), 오른쪽 캔버스에서 알고리즘이 **실제 한 단계씩** 동작해야 한다. 정적 그래픽만 두지 않는다.
4. **한·영 병기·스토리 연결·학습패널**: 기존 콘텐츠 철학 유지(텍스트는 JSON이 보유, 변환 시 보존됨).
5. **리포트/문서 커밋 규칙**: EduViz는 의도된 웹사이트 프로젝트이므로 코드·콘텐츠(html/js/json) 커밋 정상. (트레이딩 프로젝트의 "리포트 커밋 금지"는 별개 트랙 규범, 여기 적용 안 됨.) 단 `_content/`(대용량 원본)는 .gitignore.
6. **물리 동역학 = 엔진 시뮬레이션(사령관 지향점).** "이론을 코드(실시간 수치 적분)로 표현 = 자체 물리 엔진 개발이 곧 콘텐츠 제작." 물리 동역학 장면은 닫힌 공식(예: x=½at²)을 베껴 그리지 말고, **`js/physlab.js`(PhysLab) 엔진으로 F=ma를 매 프레임 적분**해 움직임을 '생성'하고 학습자가 슬라이더·드래그로 조작하게 한다. (단 운동학 1장처럼 본래 닫힌 공식이 본질인 곳은 예외.) §3.7 참조.
7. **물리 설명 = 파인만 스타일(절대·학습자 관점).** 모든 물리 학습 텍스트(narr/more/big 부제/tapHint)는 **세계 최고의 교사 리처드 파인만이 학생에게 설명하듯** 쓴다 — ①일상의 생생한 현상·이미지에서 출발(공식이 아니라), ②비유와 그림 같은 언어로 직관을 먼저 세우고 식은 그 요약으로, ③"왜? 진짜 무슨 뜻이지?"라고 질문을 던져 호기심 유발, ④아는 것·모르는 것에 정직, ⑤경이와 즐거움을 전한다. **구현·개발 이야기 절대 금지**: "엔진이 매 프레임 적분", "공식 베끼기 아님", "닫힌 공식을 그린 게 아니다", "시뮬레이션에서 측정", "결정적 해시", "FD/ODE/uniformE/lorentzB로 구현" 같은 내부 메커니즘 언급은 학생에게 무의미하니 콘텐츠에서 전부 제거(코드 주석에만 둔다). 학생은 '어떻게 그렸나'가 아니라 '자연이 어떻게 작동하나'만 듣는다. 참고: **파인만 물리학 강의 무료 공개판** [feynmanlectures.caltech.edu](https://www.feynmanlectures.caltech.edu/)(Caltech), 빌 게이츠가 판권을 사 공개한 메신저 강의 "물리 법칙의 특성"([Project Tuva](https://en.wikipedia.org/wiki/Project_Tuva)).

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
- **수학 tap 장면 키**: D=한 설명단위 진행, S=자동(연속 morph는 `{tgt,auto}` boundary 모델, `s.t<tgt`까지만 진행), **X=처음으로(재진입 리셋)**. 풀이 토글 = R키(`toggleSolution`). algo viz는 D=stepNext.
- **tapHint = 컨트롤 박스 안 '정적 행'(2026-06-30, 옛 펄스 알약 폐기).** `E.tapHint(x,y,text,pulse)`는 캔버스에 안 그리고 **DOM `#tapHintRow`**(테두리 투명·은은한 배경, 펄스 없음)에 text+칩을 넣는다. x/y/pulse 무시(API 호환만). 위치: **슬라이더 장면=슬라이더 밑 줄**, **없는 장면=박스 단독**. 컨트롤(#controls/#keyhint)은 `body:not(.viz)`에서 **bottom 206px**(기본설명창 바로 위). **엔진이 문구를 자동 정리**(작성자 텍스트는 그대로 둬도 됨): `화면 탭 =`·`▶`/`↻` 화살표·중복 `다음`을 떼고, 상호작용은 칩으로 일원화 — **캔버스 탭 장면(텍스트에 '화면 탭')=`[탭]` 칩**, **키보드 단계 장면(tap+슬라이더無+`auto` OR `▶`/`↻`)=`[D 다음][X 처음]` 칩**(`S 자동`·옛 `(D)` 표기 자동 제거). 일반어 단독(단계·보기·처음)은 비우고 뜻 있는 말(자리·칸·반복…)은 남김. **시각화 가림 방지**: `fitStage`가 컨트롤 박스·설명창 띠의 실제 상단을 매 진입 측정해 캔버스 하단을 그 위까지 동적 예약(`bot=max(baseBot, controlsTop+14, leftStackTop+14)`) → 슬라이더·논슬라이더 자동 대응. 기본설명창(.bubble 띠) max-height=108px. → **새 단계 장면은 enter에서 `this.s`에 `auto:false`**(또는 힌트 텍스트를 `▶`로 시작).

- **인트로 엔드카드(4트랙 공통)**: 각 트랙 첫 장면은 `cinematic:true, introCard:true` 시네마틱 — 애니메이션 1회 재생(클릭=건너뛰기) 후 멈추고 **엔드카드**(초상화 중앙 `<img>` + 캡션 좌우 균형 + 이름/생몰 + **▶학습시작**(→next 첫 본문)·**↻다시보기** 버튼) 표시. 애니 중 초상화 밝기 ~0.40(은은하되 또렷). 엔진 `E.introEnd(story)` 호출, `story={portrait,name,sub,caps:[[줄..],..]}`. `introCard`는 _num 미부여(#✦)라 기존 장면번호·#교차참조 보존. 인물: 미적분=뉴턴·물리=아인슈타인·수학=가우스·알고리즘=에이다 러브레이스(assets/*.jpg, 퍼블릭도메인). 테마색은 --accent-light 자동.

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

## 3.7 물리학 트랙 (신규 · PhysLab 엔진)
3번째 트랙. `physics.html`(math.html 복제·초록테마 `#5fd6a8`, 엔진 공유), `home.html`에 ⚛카드. 동작=`js/content_physN.js`(phys0 인트로·phys1 운동학·phys2 뉴턴…), 텍스트=`content/physN.json`. 원서=`_content/물리학/`(Serway 대학물리 10판). **원서 읽기**: poppler 설치됨 → Bash `pdftotext -f a -l b`(텍스트)·`pdftoppm -png -f n -l n`(그림→Read PNG). Read 도구 직접 PDF는 100MB 상한+PATH로 불가.

**PhysLab 엔진(js/physlab.js) — 모든 동역학의 단일 코어.** physics.html 로드 순서: engine.js → **physlab.js** → content_phys*.js.
- `var w = PhysLab.world({g, floor, ceil, bounds:[xL,xR], rest, linDrag})` — 실제 단위(m), y는 위쪽 +.
- `w.add({x,y,vx,vy,m,r,color,q,fixed})` → body. `w.force(fn)` 사용자 힘. `w.step(dt,sub)` 적분(반암시적 오일러). `w.collide()` 원-원 탄성충돌. `w.reset()`.
- 힘 생성기 `PhysLab.F`: `constant(b,fx,fy)`·`spring(b,ax,ay,k,rest)`(후크)·`drag(b,c)`·`friction(b,mu)`·`pointGravity(att,GM)`(1/r²)·`uniformE(Ex,Ey)`(qE)·`lorentzB(Bz)`(qv×B).
- `var v = PhysLab.view(ox,oy,scale)` → `v.X(x)/v.Y(y)`(월드→화면), `v.wx(px)/v.wy(py)`(화면→월드, 드래그용).

**장면 패턴(엔진 위)**: `enter`에서 world 생성+body/force 추가+슬라이더(E.controls/E.bind)+`this.s={w,view,...}`. `draw`에서 `w.step(1/60,6)` 후 body 렌더(v.X/v.Y). 조작=슬라이더(상수 g·F·k…) + 드래그(`down/move/up`로 body 잡기: v.wx/wy로 좌표변환, held=true 중 위치 갱신·속도 추정, up에서 해제). 골든룰=표시값은 시뮬 상태/실식에서 계산(닫힌 공식 베끼기·`Math.random`/`Date.now` 표시값 금지; 결정적 해시로 대체).
**상호작용 규칙(중요·검증됨)**: 슬라이더가 있는 장면은 엔진이 첫 슬라이더에 A/D, 둘째 J/L·셋째 B/N·넷째 T/Y 키를 자동 배정(`SLIDER_KEYS` — F/G는 H[홈]와 붙어 오타 이탈 문제로 폐기, H는 confirm 확인창 후 이동) → **D키는 슬라이더 증가에 쓰이므로 tap 동작은 캔버스 클릭(pointerdown→s.tap)으로 통일**. tapHint는 "화면 탭"으로 표기. **드래그 장면은 `down`+`tap`을 동시 정의하면 클릭 시 둘 다 발화** → 드래그 장면은 `tap` 빼고 reset/spawn을 `down`의 빈곳-클릭 분기로 통합(phys2_02·phys3_03 본보기).
**14장 전체 완료(핵심 70장면 + 심화 분기 29 = 99장면)**: 1운동학·2뉴턴법칙(F=ma)·3에너지(일-에너지정리)·4운동량(collide 보존)·5회전(회전적분+구심력 스프링)·6중력(pointGravity 궤도·케플러·탈출)·7진동(spring SHM·진자ODE·공명)·8파동(FD 파동방정식 정상파·도플러)·9유체(부력 힘 아르키메데스·베르누이)·10열역학(기체분자 시뮬·엔트로피 자유팽창)·11전기장(uniformE 포물선·축전기)·12회로(RC ODE)·13자기(lorentzB 사이클로트론·발전기)·14빛·현대물리(이중슬릿·광전효과·시간팽창). 각 장 5장면 = content_physN.js + content/physN.json, physics.html에 N=0~14 배선.
**심화 분기(branch) — 알고리즘·수학과 동일 메커니즘이 물리에서도 작동**: spine 장면에 `{ id:'physN_0X_xxx', branchOf:'physN_0X', ord:N, enter, draw }` 추가 + content/physN.json에 텍스트(ch/sec/title/narr/more/more_en/problem). 엔진 `buildHierarchy`가 자동으로 "📚 심화학습(N)" 버튼·crumb·번호(_num=#69.1) 부여. 분기도 엔진 시뮬/실식 인터랙티브(골든룰). 현재 29분기: 상대속도·종단속도(1)·경사면·도르래(2)·용수철발사·롤러코스터(3)·2D충돌·로켓(4)·굴림운동·토크평형정역학(5)·케플러3(6)·감쇠진동·대진폭진자(7)·dB·맥놀이(8)·유압·모세관(9)·열전달·카르노(10)·가우스·쌍극자(11)·키르히호프·LC진동(12)·솔레노이드·변압기(13)·렌즈결상·회절·보어·핵붕괴(14). 누락 단원(정역학·기하광학·핵물리 등)을 분기로 보강. 신규 분기 추가 시 위 패턴 재사용.
**검증 함정(중요)**: 프리뷰 RAF가 백그라운드에서 일시정지하면 캔버스가 빈 화면(인트로 포함 전부)으로 나옴 — draw 버그 아님. `preview_resize` 후 reload하면 RAF 재가동. 의심되면 draw 로직을 #stage ctx에 독립 실행(eval)해 throw 여부를 결정적으로 확인. (캐시: physics.html 자체 수정 검증 시 `?cb=`로 강제 새로고침.)
**재생 제어(물리 전용, 엔진 내장)**: 물리 장면은 draw 안에서 매 프레임 시뮬을 한 스텝 적분 → 엔진이 draw 호출을 제어해 **재생/일시정지·한 칸 앞으로·한 뒤로**를 제공(`Engine.start({playback:true})`로 opt-in, physics.html만 켬). 키: **Space=재생/정지 · `,`=한 뒤로 · `.`=한 칸 앞으로 · `0`=처음으로(재진입)**, 하단 재생바(↺0·◂,·⏯Space·▸. — 4버튼 각각 키 칩 표시, 동적 생성). 탭 힌트 알약에도 `0 처음` 칩 자동 표시. ★`drawOneFrame`은 `if(advance) frameN++`(일시정지면 frameN 동결) → PhysLab/E.frozen뿐 아니라 `E.frame` 기반 애니까지 완전 정지(이 가드 없으면 E.frame 장면은 일시정지 안 먹음). 한 뒤로=enter 재진입 후 목표 프레임까지 **결정적 리플레이**(난수 금지=골든룰 덕에 정확 재현, 슬라이더 값 보존). **일시정지=적분만 동결, 렌더는 매 프레임 계속 → 정지 중에도 슬라이더·드래그 즉시 반영.** 동결 메커니즘: 엔진이 `PhysLab.frozen`(=일시정지)을 매 프레임 set → `World.step`이 early-return(PhysLab 장면 자동). **비-PhysLab 수동적분 장면(phys4·5·7·8·9·10·12·13·14의 `s.t+=`·`s.ph+=`·FD/RC/ODE 루프)은 `E.frozen` 게터로 가드**(`if(!E.frozen) <적분>`) — 신규 물리 장면에서 draw 안 수동적분은 반드시 `E.frozen` 가드할 것. 한 칸 앞으로=`drawOneFrame(true)`로 정확히 한 스텝 적분. 슬라이더 위주 트랙(수학·미적분·algo)은 playback 미적용.

## 3.8 미적분학 트랙 (신규 · Stewart 16장, 진행 중)
4번째 트랙. **James Stewart 미분적분학(Calculus: Early Transcendentals 9판)** 기반(`_content/미적분학/미적분학0[1-5].pdf`, poppler로 읽기). `calculus.html`(physics.html 복제·**보라 테마 `#b99cff`**, 엔진 공유, **physlab 불필요** — 미적분은 직접 수치계산), `home.html`에 **∂ 카드**(보라). 동작=`js/content_calcN.js`, 텍스트=`content/calcN.json`. physlab 안 씀(로드: engine.js → content_calc*.js → chat). 마스코트 도형이 보라.
- **장면 패턴 = 수학 트랙(§3.6)과 동일**: 대부분 슬라이더형(`E.controls`+`E.bind`+`E.Plot.range/axes/curve/dot/X/Y`+`E.big`). 코드+줄커서 없음(미적분은 개념 조작). **골든룰 = 기울기·넓이 전부 실계산**: 수치미분 `ndf(f,x)=(f(x+1e-4)−f(x−1e-4))/2e-4`, 리만합(중점합), 뉴턴 점화식, 오일러법 등으로 매 프레임 계산(닫힌 공식 베껴 그리기 금지). 공식 vs 실측 검산을 화면에 노출.
- **인트로 `calc0_00` = cinematic** (물리 §3.7 패턴): 접선이 미끄러지며 순간기울기(수치미분), 리만 직사각형이 잘게 쪼개지며 넓이(중점합), 기본정리 — 슬롯별 대화체 문구 페이드+seam 페이드. `cinematic:true`(좌측패널·bignum 숨김, E.big 호출 금지).
- **색 팔레트**(캔버스): 원함수 `#b99cff`(보라)·도함수/접선 `#ffd27a`(금)·결과/점 `#7ee0b0`(초록)·비교 `#7ab8ff`(파랑)·경고 `#f0888a`. E.big 큰수는 calculus.html에서 보라(`#b99cff`).
- **챕터 구성(15장 = Stewart 16장 적응)**: 1함수와모델·2극한과연속·3도함수·4미분법·5미분의응용 ✅(28장면 완료) / 6적분·7적분의응용·8적분기법·9미분방정식·10매개변수극좌표·11수열과급수·12공간벡터·13다변수미분·14다중적분·15벡터미적분. 각 장 5장면 = content_calcN.js + content/calcN.json, **calculus.html의 두 배열(script src + Engine.start content)에 N 추가 배선**.

## 4. 검증 워크플로우 (변경 후 필수)
1. `node --check js/content_algo_br.js` (구문).
2. 미리보기: `preview_start name=eduviz` → `algo.html` 로드 → **렌더 스캔**(0..N goTo, N은 뼈대+분기 총수 ≈ 350+, 섹션 노드 추가로 증가 중 + 각 장면 D키 다회 + `window.onerror` 캡처). **에러 0 필수.** JSON만 바꿔도 캐시(`?v=Date.now()`) 때문에 **리로드 후** 스캔.
3. 핵심 장면 스크린샷으로 품질 확인(코드커서 동기·실제 연산값).
- **수학 변경 시**: `math.html` 로드 → 0..238 goTo + 슬라이더(`#controls input[type=range]` max/min 토글)·D키 다회 구동 + onerror 캡처. 에러0.
- 미리보기 서버 설정: `.claude/launch.json`(eduviz = python http.server 8077). 끊기면 `preview_start name=eduviz` 다시.

**4.1 콘텐츠 일관성 감사(애니↔설명 불일치) = `eduviz_audit.md` (재사용·토큰 절약).** 전수 감사는 2026-06-26 커밋 `24ab10b`까지 완료(16건 수정). **재요청 시 전 콘텐츠를 12에이전트로 재독 금지**(algo_br.js 1.5MB → 토큰 폭증). 3단 사다리: ①무료 런타임 렌더 스캔(LLM 0토큰, 크래시·throw 선별 — phys14 NRED 크래시를 이걸로 발견) ②`git diff --name-only 24ab10b..HEAD -- 'js/content_*.js' 'content/*.json'`로 **변경 장면만** 에이전트 1~2기 의미 검토 ③불일치 5유형·수정 원장·검증 스니펫은 전부 `eduviz_audit.md`. 검증 함정(키는 `code:'KeyD'`·일부 `KeyE`, 색상상수 파일별 IIFE 스코프, RAF 일시정지)도 거기.

## 5. 배포
코드만 커밋 → `version.json` epoch 범프(클라이언트 자동 갱신) → push → Pages 빌드 트리거.
```
git add js/content_algo_br.js && git commit -F /tmp/msg.txt   # 한글 메시지는 heredoc/파일로(따옴표 깨짐 방지)
printf '{"v":"%s"}\n' "$(date +%s)" > version.json && git add version.json && git commit -m "chore: bump"
git push origin main && gh api -X POST repos/JaehoLee76/eduviz/pages/builds
```

## 5.5 시각화 공통 규칙 (전 트랙 필수 — 콘텐츠 추가·시각화 수정 시 항상 준수, 2026-07-13 사령관 지시)
캔버스 시각화가 "미완성"으로 보이는 원인은 대부분 **겹침**과 **너무 작은 글씨**다. 신규 장면·수정 시 아래를 기본 준수한다.
1. **고정 y 오프셋 금지 → 실제 밑단 기준 배치.** 코드패널·표·상자 아래에 다른 요소를 놓을 때 `H*0.80` 같은 고정 y로 그리지 말고, `codePanel()`이 반환하는 `codeBot`(또는 계산한 요소 하단) **+여백**을 기준으로 배치한다. `var codeBot=codePanel(...); var ty=codeBot+28;` 식. `Math.min(H*..., codeBot+..)` 같은 클램프는 긴 패널에서 요소를 패널 위로 끌어올려 오히려 겹치니 주의.
2. **시각화 내부 최소 글자 크기 = 11px 이상**(2026-07-13 사령관 지시로 최소 9~11 → +2 상향). 캔버스 `ctx.font`·`FS(H,frac,mn,mx)`의 mn을 11px 미만으로 두지 말 것. 표·게이지 라벨도 마찬가지.
3. **글자 자동 맞춤.** 상자 안 텍스트는 상자 폭·높이를 넘으면 폰트를 줄여 상자 밖으로 안 나가게(hygiene `HygDoc`·algo `AlgoDoc`의 fitFont 패턴 재사용). 낮은 상자(h작음)는 폰트·행간을 비례 축소.
4. **콘솔/출력 박스**는 코드패널 밑단에 맞춰 채워 정렬하고, 터미널 점(●●●) 등으로 "출력 영역"임을 인지시킨다. 붕 뜬 채 아래 공간을 비우지 말 것.
5. **우측 패널 요소는 공통 좌측 마진에 정렬**(라벨·표·상자 시작 x를 들쭉날쭉 두지 말 것). `[상자] << [상자]`처럼 연산자를 상자 사이에 둘 땐 중앙 간격(gap/2)에 배치해 겹침 방지.
6. **폰트를 키우면 겹침이 생길 수 있으니** 수정 후 반드시 렌더 확인(대표 장면 스크린샷 또는 DOM/좌표 측정). 전 트랙 공통 요소(슬라이더 CSS·bigN·AlgoDoc/HygDoc 렌더러)는 **단일 스크립트로 일괄 치환**하고 `count` 검증(파일 개별 로드 없이) — 토큰 최소화.
7. **Plot 축 눈금 라벨은 적응형 간격**(엔진 `Plot.axes` 내장, 2026-07-17). ymin~ymax 모든 정수에 라벨을 찍으면 큰 범위(예 y=0~28)에서 라벨이 겹쳐 판독 불가 → `niceStep`으로 5·10 단위로 성기게(최소 1 클램프라 작은 범위는 정수 그대로). **큰 범위 그래프를 새로 만들 때 축 라벨 겹침 걱정 불필요**(엔진이 자동 처리). 커스텀 축을 직접 그릴 땐 이 원리(라벨 간격 ≥ ~20px)를 지킬 것.
8. **이동하는 점/마커의 라벨은 정적 라벨과 충돌 주의.** 슬라이더로 움직이는 dot 라벨(`P.dot(x,y,col,'f=..')`)이 고정 라벨(예 '구멍', 축 이름)과 같은 높이로 겹칠 수 있다 → 정적 라벨을 이동점이 지나지 않는 영역(홀 위-왼쪽 등)에 두고, 그래프 노드가 상단 제목 라벨과 세로로 겹치면 노드군 전체를 아래로 내린다(ai autograd `cy` 하향 사례). **검증 함정: 프리뷰가 백그라운드면 `#stage` rect가 붕괴(298·120px)해 런타임 H·좌표 신뢰 불가** → 스크린샷(포그라운드 강제) 또는 `resize`+reload 후 확인.
9. **★설명 문장은 캔버스에 그리지 않는다 — 엔진 HUD가 자동 분리(문장 겹침의 근본 해결, 2026-07-17 사령관 지시).** draw에서 `ctx.fillText`로 그리는 텍스트 중 **긴 설명 문장·수식 readout**(한글 8자+ 또는 긴 수식)은 엔진이 자동으로 가로채 캔버스 위 DOM 오버레이 `#stageHud`의 코너(좌상/우상/좌하/우하, 텍스트의 x·y로 코너 판정)에 세로 스택으로 렌더한다 → 문장끼리·축과 **구조적으로 겹칠 수 없다.** 판정=`isHudSentence`(engine.js): `한글&&압축길이≥8&&좌표라벨아님(괄호+숫자 제외)` 또는 `길이≥16&&수식(=/≈+연산자)`. **작성자는 readout 문장을 화면 어디에 두든 겹침 걱정 불필요**(엔진이 코너로 보냄). 단 ①**점 좌표 라벨**(`(x,y)` 꼴)·짧은 요소 라벨은 HUD 제외라 점 근처 캔버스에 남으니, 점에서 축이 지나지 않는 방향으로 오프셋할 것(규칙 8). ②**타임라인·로드맵·순열처럼 라벨 위치 자체가 시각화**인 장면은 장면 객체에 `hudOff:true`를 주어 HUD를 끄고, 라벨을 지그재그(홀/짝 y오프셋)로 직접 분리한다(phys29_05·py16_05 본보기). viz(algo)·시네마틱·책페이지는 자동 제외. **★트랙별 on/off**: 코드패널 중심 트랙(python·cpp·ai·bda)은 '요소 옆 주석'이 구조의 핵심이라 `Engine.start({..., hud:false})`로 HUD를 끈다(기본 on). 그래프 중심 트랙(math·calculus·physics·hygiene)만 켠다. 또 **모노스페이스 폰트 텍스트는 HUD 제외**(코드 패널 안 한글 주석이 밖으로 끌려나가던 회귀 수정). **전수 겹침 계측**: `ctx.fillText`를 래핑해 bbox를 재고 슬라이더를 여러 값으로 돌려 겹침 쌍을 자동 탐지(엔진 `_forceSize(1280,560)`+`_paint`로 백그라운드 캔버스 붕괴 무시, LLM 0토큰). 이 하니스로 전 장면 전수 검사 가능.

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

## 8. AI 튜터·계정·메모 백엔드 (요약 — 상세 매뉴얼은 `MANUAL.md`)
정적 프론트(GitHub Pages) + **Cloudflare Worker** 백엔드(`worker/eduviz-chat.js`, URL `https://still-thunder-3989.iamleejaeho.workers.dev` → `js/chat-config.js`의 `EDUVIZ_CHAT_ENDPOINT`). AI=Cloudflare **Workers AI**(`@cf/meta/llama-3.3-70b-instruct-fp8-fast`, 바인딩 `AI`; 외부 egress 없어 지역차단 불가 — Gemini·Groq는 한국 엣지 차단으로 폐기). 데이터=**KV**(`EDUVIZ_KV`: `rpd:*`/`rpm:*`=질문예산, `user:<sub>`=학습위치·메모·대화요약). 로그인=Google OAuth(GIS, 시크릿 없음; Client ID 발급 대기 → 발급 시 사용자별 클라우드 동기화 활성). **요금: 전부 무료 — Cloudflare에 결제수단(카드) 미등록 시 한도 초과해도 요청 실패만 하고 절대 자동 과금 안 됨(유료 전환 명시해야만 과금).** 플랫폼 연동·데이터 흐름·요금표·AI 방식/한계/품질·사용법 전체는 **`MANUAL.md`** 참조.
