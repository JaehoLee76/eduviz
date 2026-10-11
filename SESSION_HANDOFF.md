# SESSION_HANDOFF — 지금 손이 어디에 있는가

> "대화 이어서 하자" 를 들으면 **이 파일부터** 읽고 곧바로 재개합니다(되묻지 않음).
> 한 장짜리 현재 상태입니다. 누적하지 말고 덮어씁니다.

## 언제
2026-10-11

## 무엇을 하던 중
**Manufacturing Agent Lab 단계 1(기초) 제작 완료·배포.** 사령관 지시 "1단계만 실행" → 가상 데이터 시뮬레이터(11블록 라인·PPA·FDC·Loss) + 실험실 5편(0201 궤적→특징, 0101~0104 변경점 판정) 배포 후 **사령관 검토 대기**.

## 정확한 위치
- 시뮬레이터 `agentlab/data/mfgsim.js` (+ build_csv.mjs, build_trace_csv.mjs, verify.py 17/17, csv/)
- 실험실 `agentlab/labs/0201·0101·0102·0103·0104` , 허브 `agentlab/index.html#labs`
- 명세 `_content/FDC/_teach/DATA_SPEC.md`(11블록 반영) · `p1_spec.md` · `ch01_spec.md`

## 다음 한 걸음
1. 사령관 검토 피드백 반영.
2. 이후 작업은 `_content/FDC/_teach/WORKLIST.md` 의 ⬜ 첫 줄부터 한 줄씩("다음 할 일은 뭐냐?" 트리거). 현재 첫 줄 = 0202 헛알람은 왜 쌓이나.

## 열린 질문
- 마스크 세트 = 챔버 4개분 4장 해석 · 'FFM 품질' = 프레임 품질 해석 · 조기 잡 체인지 해석 (DATA_SPEC §6).
- Loss 시뮬에서 라인 밸런스(LB-LINE) 손실이 전체의 대부분 — 기둥 5 들어갈 때 비중 조정 검토.
