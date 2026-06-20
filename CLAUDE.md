# EduViz — 프로젝트 지침 (CLAUDE.md, 세션 시작 시 자동 로드)

> 이 파일은 EduViz 작업에 필요한 **모든 핵심 규칙·아키텍처·작업법**을 담는다.
> 새 세션은 이 파일만 읽으면 바로 이어서 작업할 수 있어야 한다.
> 현재 진행 상황(무엇이 끝났고 무엇이 남았는지)은 같은 폴더의 **`eduviz.md`** 참조.
> 대량 변환 작업은 **`/eduviz-anim` skill** 호출(`.claude/skills/eduviz-anim/`).

## 0. 정체성 / 비전
EduViz = 순수 정적 HTML/CSS/바닐라JS 교육 사이트. 빌드 불필요, 브라우저로 바로 열림.
- 위치: `/Users/quantcommander/EduViz/` (이 폴더가 git 저장소 루트, GitHub Pages 배포).
- 두 트랙: **수학 26장(143뼈대+95분기)** · **알고리즘 9장(39뼈대+분기 다수)**.
- 비전(사령관): "우리 콘텐츠만 학습하면 그 어떤 자료보다 더 빠르고 확실하게 개념·응용을 뇌리에 각인." 세계 최고 품질.
- 홈 `home.html` → `math.html`(수학) / `algo.html`(알고리즘). morph 단일화면 엔진(`js/engine.js` 공유).
- 라이브: https://jaeholee76.github.io/eduviz/ (사령관 계정 JaehoLee76/eduviz).

## 1. 절대 규칙
1. **언어: 항상 존댓말(-습니다/-세요).** 반말 절대 금지(짧은 확인·상태보고도). 사령관 전역 지침.
2. **골든룰(절대): 가짜 금지.** 애니메이션에 표시되는 모든 수·위치·거리·DP값은 `build()`에서 실제로 계산한 값이어야 한다. 손대충/하드코딩한 그럴듯한 가짜 수치 금지.
3. **알고리즘 시각화 = 코드+애니메이션 쌍.** 모든 알고리즘 분기는 왼쪽 코드에 **실행 줄 커서**가 단계마다 이동하고(`f.line`), 오른쪽 캔버스에서 알고리즘이 **실제 한 단계씩** 동작해야 한다. 정적 그래픽만 두지 않는다.
4. **한·영 병기·스토리 연결·학습패널**: 기존 콘텐츠 철학 유지(텍스트는 JSON이 보유, 변환 시 보존됨).
5. **리포트/문서 커밋 규칙**: EduViz는 의도된 웹사이트 프로젝트이므로 코드·콘텐츠(html/js/json) 커밋 정상. (트레이딩 프로젝트의 "리포트 커밋 금지"는 별개 트랙 규범, 여기 적용 안 됨.) 단 `_content/`(대용량 원본)는 .gitignore.

## 2. 아키텍처 (핵심)
- `algo.html` / `math.html` — 2단 레이아웃. 좌측 `#codeBody`(코드+줄커서)·`#stepCap`(STEP 캡션)·`#conceptExtra`(핵심요약/구현코드/연습문제), 하단 `#stepbar`(◂이전 D/다음·자동재생 S/초기화 X), 우측 `#stage` 캔버스.
- `js/engine.js` — 공유 코어. **SceneManager(뼈대 spine + 분기 branch, branchOf로 계층)**, viz-mode, 단계기계 `_steps`/`paintStep`/`stepNext`. 매 프레임 `sc.draw(E, _steps[_stepI])` 호출.
- **콘텐츠↔동작 분리**: 동작(code/build/draw/enter)은 `js/content_*.js`, 텍스트(title/narr/more/problem/impl)는 `content/*.json`. 엔진이 시작 시 JSON을 **id로 머지**(`for k in c: sc[k]=c[k]`). → 텍스트 수정=JSON만, 동작 수정=JS만.
- 알고리즘 분기 동작 = **단일 파일 `js/content_algo_br.js`**(IIFE, 끝에 `Engine.addScenes(scenes)`). 텍스트 = `content/algo_br.json`(id 키).
- **viz 판정**: `setVizMode`에서 `hasCode = sc.code && sc.build` 이면 viz모드(코드+줄커서+캔버스+하단 impl=구현코드). `concept:true`(+build 없음)면 개념모드(좌측 narr/요약, 스텝바 숨김). `concept:true`라도 `build` 있으면 캔버스 단계애니(코드커서는 없음).

## 3. 알고리즘 분기 애니메이션 = 현재 핵심 작업
정적 `concept:true` 분기를 **`code+build+draw`** 로 전환한다. **JS만 수정**(concept:true 제거, code/build/draw 추가). 텍스트·impl은 JSON에서 자동 표시(머지).

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

## 4. 검증 워크플로우 (변경 후 필수)
1. `node --check js/content_algo_br.js` (구문).
2. 미리보기: `preview_start name=eduviz` → `algo.html` 로드 → **렌더 스캔**(0..329 goTo + 각 장면 D키 다회 + `window.onerror` 캡처). **에러 0 필수.**
3. 핵심 장면 스크린샷으로 품질 확인(코드커서 동기·실제 연산값).
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
- **중복 id 블록**: `content_algo_br.js`에 같은 id가 2번 나오는 분기 있음(extgcd/segtree/trie/sieve/fenwick/lca — 두 장에 교차배치). splice 시 **모든 occurrence를 변환하되 각자의 branchOf 보존**(splice.py가 처리).
- **zsh 워드분할**: 따옴표 없는 `$VAR`는 zsh에서 분할 안 됨 → for 루프는 id 리스트 인라인.
- **에이전트 출력 들여쓰기**: 첫 줄 두 칸 들여쓰기 누락 빈번 → splice 전 normalize.
- **세션한도/중단**: 에이전트가 중간에 끊겨도 `/tmp/scene_*.txt`는 이미 써둠 → 존재 확인 후 splice 가능.

## 7. 이어가기 (새 세션)
사령관이 "**eduviz.md 읽고 작업준비 해**" 라고 하면:
1. 같은 폴더 **`eduviz.md`** 읽기(현재 진행상황·남은 분기 목록·우선순위).
2. **`/eduviz-anim`** skill 호출 → 인벤토리→웨이브 변환→splice→검증→배포 루프 실행.
3. 남은 정적 분기가 0이 될 때까지 반복.
