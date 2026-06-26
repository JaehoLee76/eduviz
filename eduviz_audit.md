# EduViz 콘텐츠 일관성 감사 — 기록·재사용 가이드

> 목적: **애니메이션(draw/build이 그리는 것) ↔ 설명(JSON·E.big·캡션이 말하는 것)** 불일치 감사를
> 다시 할 때 **토큰이 폭증하지 않게** 한다. (CLAUDE.md §4 검증과 짝.)
> 마지막 전수 감사: **2026-06-26 · 기준선 커밋 `24ab10b`** (이 시점 전 장면은 16건 수정 후 전부 clean).

---

## 0. 왜 처음 감사가 비쌌나 (반복 금지)
- 12개 서브에이전트가 각자 **전 콘텐츠 파일을 처음부터 재독**(특히 `js/content_algo_br.js` 1.5MB)하고
  장면마다 교차검증 → 비용의 대부분이 **이미 옳은 장면을 다시 읽는 데** 소모.
- 또 각 에이전트가 검증 방법(키 바인딩·스텝·스크린샷 함정)을 **매번 재발견**.
→ 해결: 아래 **3단 사다리**(싼 것부터)와 **증분 범위**, **기록된 해니스**.

## 1. 3단 사다리 (싼 것 → 비싼 것)
1. **무료: 런타임 렌더 스캔**(§2). LLM 토큰 0. **런타임 크래시·throw를 잡는다**(이번에 phys14 `NRED` 미정의 크래시를 이걸로 발견). 항상 **맨 먼저** 돌린다.
2. **저비용: 증분 LLM 감사**(§4). 기준선 커밋 이후 **변경된 장면만** 에이전트로 의미 검토. 안 바뀐 장면은 이미 clean이므로 **건너뛴다**.
3. **고비용: 전수 LLM 감사**. 새 트랙 추가 등 정말 필요할 때만. §5 원장으로 "이미 본 곳"을 빼고 시작.

## 2. 무료 런타임 렌더 스캔 해니스 (LLM 토큰 0)
`preview_start name=eduviz` → 트랙 html 로드(`?cb=`로 캐시버스트) → 아래 eval. **에러 0이어야 한다.**
스텝 애니(algo)는 `code:'KeyD'`로 전 프레임을 그려야 step-draw 버그까지 잡힌다.

```js
window.__e=[]; window.onerror=function(m,s,l,c,e){__e.push(((e&&e.message)||m)+'@L'+l);return true;};
new Promise(function(res){ var i=0;
  function step(){ if(i>=N){ res(JSON.stringify({scanned:i, errCount:__e.length, errs:__e.slice(0,10)})); return; }
    try{ Engine.goTo(i); for(var d=0;d<20;d++) document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyD',bubbles:true})); }
    catch(x){ __e.push('g'+i+':'+x.message); }
    i++; setTimeout(step, 8);
  } step();
});
```
N: algo≈400 · math≈240 · phys≈140 · calc≈160 (뼈대+분기 평면 인덱스 상한, 넉넉히).

### 함정 (반드시 기억 — 재발견 비용)
- **키는 `e.code`로 판정**(IME 무관). 디스패치는 `key:'d'`가 아니라 **`code:'KeyD'`**. `key:'d'`면 무시돼 스텝이 안 넘어감(헛스캔).
- **algo7_02(피보나치 메모)는 `KeyE`로 호출 펼치기**(D 아님). 일부 장면은 전용 키.
- **색상/상수는 파일별 IIFE 스코프**. `content_phys14.js`가 `NRED`를 쓰는데 정의는 `content_phys13.js`에만 있으면 **런타임 ReferenceError**(node --check는 못 잡음, 렌더 스캔만 잡음).
- **RAF 백그라운드 일시정지** 시 캔버스가 빈 화면(드로 버그 아님). `preview_resize`+reload로 재가동.
- **물리 수동적분 장면**은 `if(!E.frozen)` 가드 필수(playback 일시정지 호환).

## 3. 불일치 5유형 (분류 — 에이전트 프롬프트에 그대로 사용)
1. **개수/범위**: 텍스트 N개(1..N)인데 애니 M개 (예: 수학 인트로 1~100 vs 1~10).
2. **수치/라벨**: 캡션·narr 값 ≠ 캔버스에 그려진 숫자/라벨.
3. **개념/도형**: 설명한 과정·모양 ≠ 실제(예: "S자"인데 직선, "들로네 완성"인데 점 누락).
4. **조작 안내**: "슬라이더/드래그/탭하면 ~된다"는데 그 컨트롤·변화 없음.
5. **단위/축/방향/부호**.
> 골든룰(가짜 하드코딩 수치)도 그것이 텍스트와 어긋나면 보고. 오타·미관은 제외.

## 4. 증분 재감사 절차 (기본값 — 이걸로 충분)
```bash
BASE=24ab10b   # 마지막 전수 감사 기준선(이 표를 갱신할 것)
git diff --name-only $BASE..HEAD -- 'js/content_*.js' 'content/*.json'
```
- 나온 **변경 파일의 장면만** §3 기준으로 LLM 검토(에이전트 1~2기면 충분, 12기 불필요).
- §2 무료 스캔을 항상 먼저(전 트랙) → 크래시 0 확인.
- 끝나면 **이 문서의 BASE를 새 커밋으로 갱신**(다음 증분이 또 작아짐).

## 5. 감사 원장 — 2026-06-26 (커밋 `24ab10b`까지 전수 clean)
**점검: 수학 238 · 알고리즘(뼈대+심화 ~270) · 물리 99 · 미적분 109.** 표시값 실계산(골든룰)은 대부분 준수.

### 수정 완료 16건 (재발 시 이 패턴 참조)
| 심각도 | 장면 | 내용 |
|---|---|---|
| 높 | algo_br_segtree | 풀이 5+14=19 → 실제 9+9=18 (JSON) |
| 높 | algo_br_topo | DFS 설명 → 실제 Kahn(진입차수+큐)로 텍스트 교정 (JSON) |
| 높 | algo_br_delaunay | 입력점 누락+삼각형 중복 → 변(1,3)을 (0,4)로 올바른 flip, 5점 부채꼴 |
| 높 | algo_br_lowerboundflow | snap() 4번째 인자 드롭 → `(line,cap,_unused,extra)`로 결론·강조 복구 |
| 중 | ch6_06 | 엄격부등호 경계 실선 → `setLineDash` 점선 |
| 중 | calc14_01_jacobian | 슬라이더가 넓이보존 전단 → 가로배율 a로 교체(|J|=ad 변함) |
| 중 | phys5_03_rolling | 세 물체 겹침 → 평행 레인 수직분리 + `E.frozen` 가드 |
| 중 | algo7_02 | "7개"↔"5번" 모순 → 캐시적중 제외 집계(노출제어 count와 분리) |
| 중 | algo_br_lb | 잎 4개 → 실제 3원소 정렬 결정트리 6잎(abc·acb·cab·bca·cba·bac) |
| 중 | algo_br_trie | 풀이 3단어/6노드 → 애니(4단어 cat·car·cup·cap)에 맞춰 7노드 |
| 중 | algo_br_amort3 | 풀이 동적배열 → 애니(이진 카운터)로 |
| 저 | ch14_02 | aₙ=n/3 표기 vs 점 n*0.35 → n/3 |
| 저 | ch4_05 | 원을 정사각형이라 지칭 → "정사각형의 모임(집합)" |
| 저 | calc8_04 | 절단적분 근사 어긋남(p≈1) → "1~2000 누적→극한 수렴" 정직 표기 |
| 저 | algo8_03 | 범례 밖 주황행 → 파랑 통일 |
| 저 | algo_br_mitm | "17−17" 오표기 → 실제 sB 표시 |
| 부수 | phys14 보어모형 | `NRED` 미정의 런타임 크래시 → 팔레트에 추가 |

### clean 판정(재검토 불필요, 변경 없으면 건너뜀)
- 수학 ch1~ch26 + math0 + math_br: 위 ch4_05·ch6_06·ch14_02 외 전부 일치.
- 알고리즘 algo0~8 + algo_br ~267분기: 위 표 외 전부 일치(build가 실알고리즘을 snap → 캡션-그림 본질적 일관).
- 물리 phys0~14: 위 phys5_03_rolling·phys14(NRED) 외 일치.
- 미적분 calc0~15 + br/br2: 위 calc8_04·calc14_jacobian 외 일치.

### 잔여 보강(불일치 아님 — "주장은 옳으나 조작 시연 부재", 지시 시 착수)
- phys14_04 광전효과: "밝기 무관" 주장하나 밝기 슬라이더 없음.
- phys12_03 병렬회로: "전류 분배" 설명하나 분배 시각화 없음.
- phys5_01: "멀수록 빠르다" 다중 반경 비교 없음. phys6_03_kepler3: 탭 리셋 없음.
- phys10_01/02/03: 2D 시뮬 vs 3D 공식 표기(정성 지표라 정량오차 아님).
- 교차참조 #N 일관성: ch21_05(#28/#29 혼용), ch15_05(#29/#33) — 의미 불일치 아님.

## 6. 장면 찾기·검증 스니펫 (재사용)
```js
// 평면 인덱스로 크럼브 훑어 특정 장면 찾기
var hits=[]; for(var i=0;i<400;i++){ Engine.goTo(i); var cr=(document.getElementById('crumb')||{}).innerText||'';
  if(/키워드1|키워드2/.test(cr)) hits.push(i+':'+cr.replace(/\n/g,' ')); } JSON.stringify(hits);
// 코드패널로 찾기(viz 분기): (document.getElementById('codeBody')||{}).innerText
// 스텝 진행: for(d=0;d<12;d++) document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyD',bubbles:true}));
// 슬라이더 구동: var sl=document.getElementById('ID'); sl.value=V; sl.dispatchEvent(new Event('input',{bubbles:true}));
// 캡션 읽기: (document.getElementById('stepCap')||{}).innerText
```
검증은 **에러 0 스캔 + 수정 장면만 스크린샷**으로 끝낸다(전 장면 스크린샷 불필요).
