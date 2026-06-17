# EduViz — 시각 교육 사이트 (이해의 세계)

수학과 알고리즘을 **하나의 화면이 모양을 바꿔가며(morph)** 직관적으로 익히는 인터랙티브 정적 사이트입니다. 빌드 없이 브라우저로 바로 열립니다.

- **홈:** `home.html` → `수학` / `알고리즘`
- **수학:** `math.html` — 6권 26장 (수의 개념 → 무한·해석학), 143 뼈대 장면 + 심화 분기
- **알고리즘:** `algo.html` — 8장 (복잡도 → DP·NP), 39 뼈대 장면 + 한국어판 표준 교재 반영 분기

## 특징
- 단일 morph 엔진(`js/engine.js`) 공유, 한·영 병기 학습패널, 화면번호
- **계층형 뼈대-분기 구조:** 기본 진행축(뼈대)에서 세부 주제로 분기해 들어갔다(🔍/↓) 나오기(↩/↑). breadcrumb로 현재 위치 표시
- 스토리 5원칙(예고↔회수): 수학과 알고리즘이 서로를 회수(가우스합→O(1), 파스칼→격자DP 등)

## 로컬 실행
정적 파일이지만 `fetch`로 콘텐츠 JSON을 읽으므로 **로컬 서버**가 필요합니다(file:// 불가):
```bash
python3 -m http.server 8077 --directory .
# 브라우저: http://localhost:8077/home.html
```

## 배포 (GitHub Pages)
1. GitHub에 저장소 생성 후 이 폴더를 push (`_content/`는 .gitignore로 제외됨 — 원본 PDF/docx는 용량·저작권상 비포함)
2. 저장소 Settings → Pages → Source를 main 브랜치로 지정
3. 발급된 URL의 `…/home.html` 로 접속

경로가 모두 상대경로라 하위 경로(`/repo/`)에서도 그대로 동작합니다. `.nojekyll`이 포함되어 GitHub Pages가 모든 파일을 그대로 서빙합니다.

## 그 외 배포
- **Netlify Drop:** netlify.com/drop 에 이 폴더를 드래그&드롭 → 즉시 URL 발급(설정 불필요)
- **정적 호스팅 일반:** 폴더 통째 업로드면 끝(빌드 단계 없음)

## 구조
```
home.html / math.html / algo.html   진입 페이지
js/engine.js                        공용 morph 엔진
js/content_chN.js                   수학 장(behavior)        content/chN.json (text 한·영)
js/content_math_br.js               수학 분기               content/math_br.json
js/algo_helpers.js                  알고리즘 시각화 헬퍼
js/content_algoN.js                 알고리즘 장             content/algoN.json
js/content_algo_br.js               알고리즘 분기          content/algo_br.json
CURRICULUM.md / CURRICULUM_ALGO.md  진행축 SSOT
```
