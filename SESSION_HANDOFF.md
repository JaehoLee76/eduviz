# SESSION_HANDOFF — 지금 손이 어디에 있는가

> "대화 이어서 하자" 를 들으면 **이 파일부터** 읽고 곧바로 재개합니다(되묻지 않음).
> 한 장짜리 현재 상태입니다. 누적하지 말고 덮어씁니다.

## 언제
2026-11-23

## 무엇을 하던 중
**콘텐츠 제작 — Manufacturing Agent Lab(제조 AI 트랙) 재개 준비.** 직전까지 EduViz 사이트 작업(미적분 실험실·의견 기능·엔진 클릭 막힘·algo 모바일 슬라이더)을 끝내고 배포함. 사이트 쪽 남은 일은 `eduviz.md` 맨 위 「EduViz 사이트 남은 일」에 기록.

## 정확한 위치
- 작업 리스트 `_content/FDC/_teach/WORKLIST.md` — 다음 ⬜ 첫 줄 = **#2 0203 「3σ의 숨은 가정 셋」**(정규성: 분위수 한계·Box-Cox / 독립성: 잔차 관리도 / 깨끗한 기준 데이터: 중앙값·MAD 로버스트).
- 설계서 `_content/FDC/_teach/p2_spec.md` — §1(0202)만 있음. **§2(0203) 설계가 첫 걸음.**
- 본보기 `agentlab/labs/0202-false-alarm-multiplicity.html`, 데이터 `agentlab/data/mfgsim.js`(시나리오 S1~S6, 0203 은 S7 신설 예정) · `verify.py`.

## 다음 한 걸음
1. Opus가 `p2_spec.md` §2(0203) 설계 — 한 문장·아는 것·새 용어 개수·S7 데이터(비정규·자기상관·오염 기준 세 갈래)·흐름·성과 환산·Python·검증 기준.
2. Sonnet 1기 제작(WORKLIST 공통 브리프) → Opus 검증(ui_check·voice_check·Python 대조) → 허브 등록 → 커밋·배포 → WORKLIST ✅.

## 열린 질문
- 마스터플랜 기둥 1: 현행 "3시그마 비교법"의 정확한 정의(이전 데이터 평균±3σ 안에 이후 데이터가 드는지) — 사령관 확인 필요 표시가 남아 있음.
- WORKLIST 「사령관 확인 대기」 4건(마스크 세트=4장, FFM 품질, 조기 잡 체인지, LB-LINE 비중).
