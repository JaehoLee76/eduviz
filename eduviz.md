# EduViz 작업 핸드오프 (eduviz.md)

> **새 세션 이어가기 트리거**: 사령관이 "eduviz.md 읽고 작업준비 해"라고 하면 →
> ① 이 파일로 현재 상황 파악 → ② `CLAUDE.md` 읽기(규칙·아키텍처·함정) → ③ **`/eduviz-anim` skill 호출** → ④ 남은 정적 분기를 웨이브로 변환·splice·검증·배포, 0이 될 때까지 반복.
> 작업 폴더는 항상 **/Users/quantcommander/EduViz** (셸이 다른 곳에서 시작되더라도 cd 먼저).
> 마지막 갱신: 2026-06-20.

## 지금 무엇을 하고 있나
✅ **완료**: 알고리즘 트랙의 정적 `concept:true` 분기 161개를 전부 `code+build+draw` 코드동기 단계 애니메이션으로 전환 완료(2026-06-21). 모든 시각화=코드+애니메이션 쌍, 코드 줄커서 포커스, 골든룰(표시값 실계산) 준수, 렌더 스캔 330장면 에러0.
다음 후보(사령관 지시 대기): 품질 고도화(장면별 캡션/색/단계 보강), 수학 트랙 추가 개선, 신규 챕터/토픽 확장 등.

## 진행 상황
- **수학 트랙**: 26장 143뼈대 + 95분기 = **완성**(전 장면 에러0). 추가 작업 불필요.
- **알고리즘 트랙 — 애니메이션 전환**:
  - ✅ 9장(패러다임, algo8): 50/50 분기 전부 완료(허프만·N퀸·가우스·FFT·3SAT환원 등).
  - ✅ 1장(복잡도, algo1): 3/3(마스터정리·점근표기·분할상환).
  - ✅ 3장(정렬, algo3): 10/10(기수·퀵·역위·Mo·평방분할·순열사이클·중앙값의중앙값·포드존슨 등).
  - ✅ 2장(자료구조, algo2): **33/33 완료**(수론12·기하6·해시비트6·구간압축5·웨이블릿4 등 추가 전환). 2장 정적 분기 0.
  - ✅ 4장(탐색·문자열, algo4): **24/24 완료**(KMP·Z·마나허·접미사배열/구축·SA-IS·Kasai·우코넨·eertree·아호코라식·SAM·삼분탐색·뉴턴 등). 정적 분기 0.
  - ✅ 5장(트리·고급DS, algo5): **29/29 완료**(RB·AVL·splay·treap·LCA·이진점프·HLD·센트로이드·트리DP·DSU온트리·세그비츠·lazy·2D펜윅·영속·롤백DSU·B트리 등). 정적 분기 0.
  - ✅ 6장(그래프, algo6): **48/48 완료**(최단경로·최대유량·매칭·연결성·오일러·컷·MST·힙 8그룹). 정적 분기 0. (stoerwagner lastTwo 버그 수정 포함.)
  - ✅ 7장(DP, algo7): **27/27 완료**(막대자르기·행렬연쇄·CHT·LiChao·DC최적화·Knuth·SMAWK·슬로프트릭·비트마스크TSP·자리DP·SOS·기댓값·스타이너·행렬거듭제곱·키타마사·벌리캠프·에일리언·뤼카·카탈란·스털링 등). 정적 분기 0.
  - 골드 패턴 본보기: `algo_br_huffman / nqueens / gauss / bellman / mst`(content_algo_br.js).

## 🎉 남은 정적 분기 0개 — 알고리즘 트랙 애니메이션 전환 100% 완료 (2026-06-21)
- **algo2: ✅ 0 (33/33 완료)**
- **algo4: ✅ 0 (24/24 완료)**
- **algo5: ✅ 0 (29/29 완료)**
- **algo6: ✅ 0 (48/48 완료)**
- **algo7: ✅ 0 (27/27 완료)**
- 총 161개 정적 concept:true 분기를 전부 code+build+draw 코드동기 단계 애니메이션으로 전환. 렌더 스캔 330장면 에러0.
- 수학 트랙: 학습패널 '풀이 보기/숨기기'에 단축키 R 배정(engine.js, 전 장면 공통).
- **algo7 (27)**: rod matchain cht dcopt bitmaskdp digitdp sosdp matexp lucas catalan lichao berlekamp knuthopt aliens smawk partition steiner brokenprofile expdp boundedknapsack slopetrick palindromepart stirling fastfib kitamasa altsubseq dp_principles

## 권장 순서
algo2 마무리 → algo4(문자열) → algo5(트리/DS) → algo7(DP) → algo6(그래프, 최다). 한 장씩 또는 웨이브 단위로 커밋·배포. 그래프(algo6)는 `gedge/uedge`, 트리(algo5)는 `drawTreeB` 헬퍼가 잘 맞는다.

## 작업 절차 (요약 — 자세히는 /eduviz-anim skill)
1. 인벤토리 스크립트로 남은 분기 확인.
2. 4 에이전트 × 5~6분기 웨이브 디스패치(각 에이전트: skill의 agent-spec.md 읽고 /tmp/scene_<id>.txt 출력).
3. `python3 .claude/skills/eduviz-anim/splice.py <id들>`로 끼워넣기(중복 id·branchOf·normalize 자동 처리, 실패 시 복원).
4. preview 렌더 스캔(330장면, 에러0 확인) + 핵심 스크린샷.
5. 커밋(코드만) + version.json 범프 + push + Pages 빌드. 이 파일 진행상황 갱신.

## 최근 커밋 (참고)
- ch9 50분기 완료(2건), 1·3장+2장일부 20분기(`feat(algo): 1·3장+2장일부…`), version bump 다수.
- 라이브: https://jaeholee76.github.io/eduviz/algo.html

## 막혔을 때
- preview 끊김 → `preview_start name=eduviz`(`.claude/launch.json` = python http.server 8077).
- splice 후 사이트 깨짐 → 패치 끝 `  },` 확인, splice.py가 자동 복원하므로 node --check 메시지 확인.
- 중복 id(extgcd/segtree/trie/sieve/fenwick/lca) → splice.py가 occurrence별 branchOf 보존하며 모두 변환.
