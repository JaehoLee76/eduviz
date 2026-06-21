# EduViz 작업 핸드오프 (eduviz.md)

> **새 세션 이어가기 트리거**: 사령관이 "eduviz.md 읽고 작업준비 해"라고 하면 →
> ① 이 파일로 현재 상황 파악 → ② `CLAUDE.md` 읽기(규칙·아키텍처·함정) → ③ **`/eduviz-anim` skill 호출** → ④ 남은 정적 분기를 웨이브로 변환·splice·검증·배포, 0이 될 때까지 반복.
> 작업 폴더는 항상 **/Users/quantcommander/EduViz** (셸이 다른 곳에서 시작되더라도 cd 먼저).
> 마지막 갱신: 2026-06-20.

## 지금 무엇을 하고 있나
🔄 **진행 중: 알고리즘 심화(분기) 재구조화** (2026-06-21~). 콘텐츠 검토에서 '심화 268분기가 소수 허브에 주제 불일치로 적재돼(예: RSA·정수론→해시, 기하→스택, 문자열→선형탐색, 플로우/매칭→다익스트라) 순서대로 보면 스토리가 끊김'을 발견. 핵심 뼈대 42장 스토리·시각화는 이미 최상급(유지).

### 재구조화 패턴 (검증·배포 완료 — 본보기: 문자열 섹션)
**애니메이션 JS(content_algo_br.js 1.5MB)는 건드리지 않는다.** 다음만으로 한 군집을 재구성:
1. **섹션 노드 신설**: `content_algoN.js`에 `{id:'algoN_0X', concept:true, draw: 학습지도}` 추가 + `content/algoN.json`에 텍스트(군집 인트로·큰그림). 본보기 `algo4_05`(문자열).
2. **재배치·순서·연결어는 `content/algo_br.json`만 수정**: 각 분기에 `branchOf:'<새 섹션 id>'`(JSON 머지가 JS의 branchOf를 오버라이드 — buildHierarchy 이전 실행), `ord:1..N`(서사 순서), `sec` 정리, **`more`(핵심요약) 앞에 한 문장 연결어**(viz 분기는 narr이 아니라 `more`가 화면에 보임 — 말풍선 opacity:0).
3. **엔진 1회 변경 완료**: `buildHierarchy`가 분기를 `ord` 오름차순(기본 9999) 정렬 후 `_num` 부여. 블록 이동 불필요.
4. 검증: `preview_start` → 섹션 노드 심화학습(N)·ord 순서·crumb·페이지(N/N)·렌더 스캔 에러0.

### 군집 목표 택소노미 (8챕터 유지, 각 챕터에 심화 섹션 append)
- ✅ **문자열 알고리즘**(ch4, algo4_05): 15개 완료(해싱→KMP→Z→아호코라식→접미사배열/구축/SA-IS/Kasai→우코넨/SAM→eertree→Lyndon). 선형탐색엔 비문자열 4개 잔류.
- ☐ **정수론·수론**(해시 algo2_05에서 분리): RSA·확장유클리드·CRT·뫼비우스·오일러φ·폴라드로·토넬리·르장드르·선형체·모듈러역원·몽고메리·이진GCD·이산로그·밀러라빈 등.
- ☐ **계산기하**(스택 algo2_03 + 배열 kd/quad + 분할정복 geometry에서 분리): 볼록껍질·선분교차·캘리퍼스·신발끈·점다각형·가장가까운점쌍·최소외접원·반평면·들로네·민코프스키·3D볼록·분리축·k-d트리·사분트리.
- ☐ **고급 자료구조**(배열 algo2_01 + 힙): 세그트리·펜윅·lazy·세그빔즈·2D·영속·웨이블릿·비트셋·희소테이블·좌표압축·동적테이블·비트트릭·스킵리스트·vEB.
- ☐ **네트워크 플로우·매칭**(다익스트라 algo6_05 + 그래프 algo6_01에서 분리): 최대플로우·디닉·에드몬즈카프·MCMF·하한유량·최소비용순환·최대폐포·이분매칭·호프크로프트·헝가리안·블로섬·쾨니그·Hall·안정결혼·슈토어바그너·카거·Gomory-Hu·최소평균사이클.
- ☐ **고급 그래프**(DFS algo6_04): SCC·2SAT·단절점·BCC·오일러·Hierholzer·DAG최장·도미네이터·추이폐쇄·함수그래프·평면·중국인우편·간선분류·딜워스·그래프채색·간선채색.
- ☐ **최단경로 심화**(다익스트라 잔류): 벨만·플로이드·DAG최단·0-1BFS·A*·k번째·존슨·양방향.
- ☐ **고급 DP / 조합·수열**(격자DP algo7_05): CHT·리차오·DC최적화·크누스·SMAWK·Aliens·슬로프트릭·비트마스크·자릿수·SOS·윤곽선·기댓값·다중배낭·회문분할 / 카탈란·스털링·뤼카·정수분할·최장교대·행렬거듭제곱·키타마사·벨캄프.
- ☐ **분할정복·수학 심화**(ch8 algo8_03): 스트라센·FFT·카라츠바·NTT·CDQ + 번사이드·포함배제·키르히호프·라그랑주·다항식·심슨 + 님그런디·DLX·브론커보시·IDDFS + 마스터정리 증명류.
- 주의: 재배치 시 변명성 연결어("최단 경로 자리에서 다루는" 등) 제거. 8정거장 intro(algo0_02)와 모순 안 되게 새 섹션은 챕터 내 하위 섹션으로(새 챕터 만들지 말 것).

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
