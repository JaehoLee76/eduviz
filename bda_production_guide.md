# 빅데이터 분석(BDA) 트랙 제작 지침 — 워커 필독

> **이 파일은 프로젝트 루트에 있습니다.** 세션 스크래치패드가 아니므로 어느 세션에서든 항상 읽을 수 있습니다.
> 경로: `/Users/quantcommander/EduViz/bda_production_guide.md`

작업 루트: `/Users/quantcommander/EduViz`

## 0. 먼저 읽을 것
1. `/Users/quantcommander/EduViz/CLAUDE.md` — 프로젝트 절대 규칙(골든룰·존댓말·§5.5 시각화 규칙). **반드시 준수.**
2. **본보기 코드**: `js/content_bda25.js` + `content/bda25.json` (또는 최근 완성된 아무 장). codePanel 패턴·헬퍼·JSON 키를 그대로 따르세요.

## 1. 산출물 (한 장 = 2개 파일)
- `js/content_bdaN.js` — 동작(장면 배열). IIFE로 감싸고 **끝에 `if(window.Engine) window.Engine.addScenes(scenes);`**
- `content/bdaN.json` — 텍스트. 장면 id를 키로 `{ch, sec, title, narr, more, more_en}` (+선택 `problem`)

장면 id: `bdaN_01` ~ `bdaN_05` (한 장에 **5장면**)

## 2. 장면 패턴 (이 트랙 표준)
**좌측 = 진짜 실행 가능한 Python 코드 패널(줄커서) + 우측 = 골든룰 실계산 시각화**
- 본보기 파일 상단의 `codePanel(E,x,y,w,lines,title,actLine)` 헬퍼를 **복사해 파일 내부에 정의**. 반환값 `codeBot`(패널 하단 y)을 받아 그 아래 요소를 배치(고정 H분율 금지).
- 장면 유형:
  - **tap-step형**: `enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); }` + `tap:function(E){ this.s.step=(this.s.step+1)%N; }`. 코드 줄커서는 `actLine`을 step에 연동.
  - **슬라이더형**: `E.controls('<div class="ctrl"><label>…</label><input type="range" id="xx" min max step value><output id="xxo"></output></div>')` + `E.bind('#xx','input',fn)`.
- 그래프: `E.Plot.range(...).lab('x','y')` → `P.axes()`, `P.curve()`, `P.dot()`, `P.X()/P.Y()`.
- 큰 결과 수치는 `E.big('제목','부제')`. 탭 힌트는 `E.tapHint(E.W/2, E.H*0.93, '화면 탭 = …', true)`.

## 3. 절대 규칙
1. **골든룰**: 화면에 표시되는 모든 수(평균·상관·RMSE·정확도·행 개수·모듈성·중심성 등)는 draw/build에서 **실제로 계산**해야 합니다. 하드코딩 금지. `Math.random()`·`Date.now()` 금지 — 예제 데이터는 **고정 배열**(또는 고정 시드 LCG)로 파일 상단에 선언.
   - **★계산 결과가 예상과 다르면 서술을 결과에 맞춰 고치세요.** 서술에 맞춰 수치를 조작하면 골든룰 위반입니다(실제로 44장에서 모듈성이 예상과 반대로 나와 서술을 정정한 사례가 있습니다).
2. **R 노출 절대 금지**: 원본 자료가 R이어도 콘텐츠는 **100% Python**(pandas·NumPy·scikit-learn·statsmodels·networkx 등). R 함수명·패키지명을 비교 목적으로도 쓰지 마세요.
   - 예외: 앞으로 만들 **ADP 시험 대비 파트(46~48장)**의 'R 코드 독해' 섹션만 사령관 승인 시 예외.
3. **출처 표기 금지**: 특정 교재를 참고했다는 사실을 드러내지 마세요. 독자 제작 콘텐츠로 서술합니다.
4. **존댓말**(-습니다/-세요). 캔버스 폰트 **11px 이상**(§7 참조).
5. **검증**: `node --check js/content_bdaN.js` 와 `python3 -c "import json;json.load(open('content/bdaN.json'))"` 통과 필수.

## 4. 텍스트(JSON) 작성법
- `ch`: 예 `"빅데이터 분석 제40장 · 군집 분석"` / `sec`: 예 `"40.2 K-means"`
- `title`: 장면 제목(한 줄, 핵심을 찌르는 표현)
- `narr`: 기본 설명(하단 띠). **앞 장면에서 이어지는 스토리로 연결** — 자연스러운 연결어로 시작해 흐름이 끊기지 않게. 이게 이 사이트의 핵심 경쟁력입니다.
- `more`: 더 알아보기(학습 패널). 실무 팁·흔한 실수·성능 노트.
- `more_en`: more의 영문 요약(한두 문단).

## 5. 원본 자료 읽는 법
```
pdftotext -f <시작> -l <끝> "/Users/quantcommander/EduViz/_content/BDA/<파일명>" /tmp/out.txt
```
파일명에 공백·괄호가 있으니 **반드시 따옴표**로 감싸세요. 필요한 페이지 범위만 읽어 토큰을 아끼세요.

## 6. 금지 사항
- **커밋 금지**: 파일만 만들고 `git add/commit/push` 하지 마세요. Advisor가 검증 후 일괄 배포합니다.
- **하위 에이전트 생성 금지**(Agent/Task 도구 금지). 직접 작업하세요.
- **`xref` 키 생성 금지**: Advisor가 대상 장면 id 실존 확인 후 일괄 추가합니다.
- **`bda.html` 수정 금지**: 배선은 Advisor가 합니다.

---

## 7. ★레이아웃 규칙 — 매 라운드 반복 적발되는 것들

### 7.1 HUD가 꺼져 있습니다 (이 트랙 전용)
빅데이터 트랙은 `Engine.start({hud:false})`입니다. 즉 **긴 설명 문장도 캔버스에 그대로 그려집니다.** "HUD가 알아서 빼주겠지" 하고 아무 데나 두면 겹칩니다. **모든 텍스트 좌표를 직접 책임지세요.**
- 코드 패널 아래 요소는 `var codeBot = codePanel(...)` 반환값 기준(`codeBot + 여백`)으로 배치. 고정 `H*0.8` 금지.
- 우측 설명 라벨은 서로 세로 간격 ≥ 폰트+6px 확보.

### 7.2 캔버스 폭 900 · 높이 380에서도 안 잘려야 합니다
슬라이더가 있으면 엔진이 캔버스를 짧게 잡습니다(`fitStage`). **폭 900 · 높이 380 기준**으로 설계하세요.
- 요소 시작은 `H*0.14` 아래(상단 큰 제목과 겹치지 않게).
- 코드 패널은 **5~8줄**로 제한. 표는 행 높이 12~16px, 행 수 6~8행 이내.
- 우측 요소의 x·폭은 **W 비례**(`W*0.72` 등). 고정 픽셀 폭 금지.

### 7.3 ★막대그래프 최댓값 라벨이 제목과 겹칩니다 (반복 발생 패턴)
막대 높이를 `(v/max)*bh`로 잡고 값 라벨을 막대 위(`y-6`)에 그리면, **최댓값 막대의 라벨이 그래프 제목과 정확히 겹칩니다.** 제목을 충분히 위로 올리거나(`by0-24`), 막대 최대 높이에 **18px 이상 여유**를 두세요. 40·44·45장에서 각각 발생했습니다.

### 7.4 ★회전 라벨(`ctx.rotate`)
세로축 라벨을 `translate`+`rotate`로 그릴 때 **translate 지점이 텍스트의 중심**이 되게 하세요. 행 하단이나 경계에 두면 아래 요소와 겹칩니다(22장 혼동행렬에서 실제 발생). 
참고: 자동 겹침 하니스는 회전 변환을 추적하지 못해 **회전 라벨을 거짓 양성으로 잡습니다** — 코드로 좌표를 확인해 실제 문제인지 판단하세요.

### 7.5 코드 패널 안 한글 주석은 짧게
코드 줄의 인라인 주석(`# …`)은 **8자 이내**로(패널 폭 초과 방지).

### 7.6 ★통합 검증 하니스 (넘침 + 겹침 + 폰트를 한 번에)
프리뷰에서 `bda.html`을 열고 콘솔에서 실행하세요. **세 가지를 동시에 잡습니다.**
```js
var ctx=document.getElementById('stage').getContext('2d'); window.__W=900; window.__H=380;
if(!ctx.__k){ctx.__k=1;var of=ctx.fillText.bind(ctx);
ctx.fillText=function(t,x,y){ if(window.__C){var s=String(t);if(s.trim()){
 var m=ctx.font.match(/([\d.]+)px/),fs=m?parseFloat(m[1]):12,w=ctx.measureText(s).width,ta=ctx.textAlign,ax=x;
 if(ta==='center')ax=x-w/2; else if(ta==='right'||ta==='end')ax=x-w;
 var bl=ctx.textBaseline,y0,y1;
 if(bl==='middle'){y0=y-fs*0.5;y1=y+fs*0.5;} else if(bl==='top'||bl==='hanging'){y0=y;y1=y+fs;} else {y0=y-fs*0.78;y1=y+fs*0.22;}
 // 회전 라벨(translate 후 0,0)은 좌표 추적 불가 → 제외
 if(!(Math.abs(x)<1&&Math.abs(y)<1)){ window.__C.push({t:s,x0:ax,y0:y0,x1:ax+w,y1:y1});
   if(ax+w>window.__W+2||y1>window.__H-2) window.__OVF.push(s.slice(0,16)); }
 if(fs<11) window.__SM.push(s.slice(0,12));
}} return of(t,x,y); };}
function P(){ Engine._forceSize(window.__W,window.__H); Engine._paint(false); }
function hits(){var a=window.__C||[],r=[];
 for(var i=0;i<a.length;i++)for(var j=i+1;j<a.length;j++){var A=a[i],B=a[j];if(A.t===B.t)continue;
  var ox=Math.min(A.x1,B.x1)-Math.max(A.x0,B.x0), oy=Math.min(A.y1,B.y1)-Math.max(A.y0,B.y0);
  if(ox>4&&oy>4){var mw=Math.min(A.x1-A.x0,B.x1-B.x0),mh=Math.min(A.y1-A.y0,B.y1-B.y0);
   if(ox>mw*0.35&&oy>mh*0.5)r.push(A.t.slice(0,16)+' ✖ '+B.t.slice(0,16));}}
 return r;}
// 사용: Engine.goTo(Engine.indexOfId('bda40_01')); P(); window.__C=[];window.__OVF=[];window.__SM=[]; P();
//       console.log('넘침',window.__OVF,'11px미만',window.__SM,'겹침',hits());
```
**각 장면 × 슬라이더 min/중간/max × 탭 전 상태**를 순회해 **셋 다 0**이어야 합니다.
제출 전 셸에서도 확인: `grep -nE "'[^']*\b10(\.5)?px" js/content_bdaN.js` → **0줄**.

### 7.7 폰트 11px 미만 금지 — 다섯 라운드 연속 적발되었습니다
캔버스 `ctx.font`에 **10px·10.5px를 절대 쓰지 마세요.** 작은 표·격자·축 눈금·범례도 11px 이상입니다. 공간이 부족하면 폰트를 줄이지 말고 **칸을 키우거나·자릿수를 줄이거나·항목을 덜 표시**하세요.

### 7.8 스크린샷 확인
자동 하니스는 **선·막대가 라벨을 가리는 것**을 못 잡습니다. 대표 장면은 눈으로 확인하세요. 겹치면 그리는 순서를 바꾸거나 라벨에 어두운 배경을 깔면 됩니다.
검증 함정: 프리뷰가 백그라운드면 `#stage` rect가 붕괴해 런타임 좌표를 신뢰할 수 없습니다 — `Engine._forceSize(900,380)`로 강제한 수치 하니스를 주 수단으로 삼으세요.

---

## 8. 현재 트랙 구조 (2026-07-28)
- **인트로 + 1~31장 (156장면)** — 완성·배포됨
  - PART A 초급 1~4 · PART B 중급 5~7 · PART C 실전입문 8~11 · PART D 고급 12~31(예측 모델링 20장 + 사례연구 10건)
- **32~39장 (PART E, 40장면)** — 완성·배포됨. ADP 필기 이론 4개 과목.
  - 32 데이터와 데이터베이스 · 33 빅데이터의 가치와 데이터 사이언스 (과목 I)
  - 34 데이터가 흘러 모이는 길 · 35 나누어 저장하고 나누어 계산한다 (과목 II)
  - 36 무엇을 분석할지 정하는 법 · 37 분석 마스터 플랜과 거버넌스 (과목 III)
  - 38 시각화로 인사이트를 얻는 과정 · 39 무엇을 어떻게 그릴 것인가 (과목 V)
  - ★이론 과목이라 실제 수치가 없습니다. 가짜 통계를 지어내지 말고 **동작하는 모형**(맵리듀스를 실제로 단어 세기, 연결선 수 n(n−1)/2 실제 작도, 진단 점수 실제 판정)으로 푸세요. 가정값을 쓸 땐 "이 모형이 정한 가정"임을 화면에 밝힙니다.
- **40~45장 (PART F)** — 완성·배포됨. 분석 기법 보강: 군집·연관·시계열·텍스트마이닝·사회연결망·다변량 심화
- **46~48장** — 예정. ADP 시험 대비(서술형 답안법·실기 240분 시나리오)
  - ★ADP 실기는 **R과 Python 중 택일**이며 파이썬 응시가 정식으로 가능합니다(구름 IDE, 패키지 목록 사전 공고). 따라서 R 노출 금지 원칙은 그대로 유지합니다.
- **원본 자료 추출본**: `_content/BDA/_extract/` 에 과목별 텍스트가 있습니다(gitignore 대상). 과목 경계는 머리글의 과목 **번호가 원본부터 잘못 찍혀 있으므로**(제2과목에 "과목 I") 반드시 과목 **이름**으로 잡으세요.

## 9. 배포 후 잊지 말 것 (Advisor 담당)
콘텐츠(title/sec/narr)를 추가·변경하면 **홈 검색 인덱스를 재생성**해야 합니다:
`content/search_index.json` — `content/*.json`을 훑어 `{t,tn,p,s,ti,se,ch,nr}` 배열로 저장(CLAUDE.md §2 참조).
