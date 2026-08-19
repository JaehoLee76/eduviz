/* ADP Master — 실험실 목록(공유)
 * 허브의 학습 지도·검색과, 각 실험실 아래의 이전·홈·다음 이동줄이 모두 이 목록 하나를 봅니다.
 * 새 실험실은 여기 한 줄만 추가하면 양쪽에 자동으로 반영됩니다(순서 = 이 배열 순서).
 */
window.ADP_LABS = [
  { no:'0001', href:'labs/0001-fuel-economy-workflow.html', part:'가이드', type:'실기 전체 지도', order:'먼저',
    title:'ADP 실기, 4시간 안에 무엇을 하는가', sub:'연비 사례로 관통',
    desc:'합격에 필요한 다섯 가지 힘, 시험 형식, 4시간 배분, 통계 유형 지도, 머신러닝 6단계와 파이썬 틀.',
    done:true },
  { no:'0002', href:'labs/0002-anova-lab.html', part:'통계', type:'분산분석', order:'기초',
    title:'일원배치 분산분석 + 사후검정', sub:'29회 문7 유형',
    desc:'차종별 범퍼 손상지수를 F검정으로 비교하고, 유의하면 본페로니 사후검정으로 어느 쌍이 다른지까지 찾는다.',
    done:true },
  { no:'0003', href:'labs/0003-real-regression-problem.html', part:'통계', type:'회귀·모형 선택',
    title:'회귀모형 선택', sub:'단순 vs 다항',
    desc:'직선이 못 잡는 곡선성을 잔차도로 확인하고, 2차·3차를 수정 R²로 비교해 과적합을 피해 고른다.',
    done:true },
  { no:'0004', href:'labs/0004-binomial-lab.html', part:'통계', type:'이항분포',
    title:'이항분포 확률과 정규근사', sub:'29회 문5 · 30회 문7',
    desc:'불량 개수·자녀 성별 같은 셈 문제의 확률을 직접 계산하고, 정규근사를 써도 되는지 np로 판정한다.',
    done:true },
  { no:'0005', href:'labs/0005-chisq-lab.html', part:'통계', type:'카이제곱 독립성',
    title:'카이제곱 독립성 검정', sub:'23회 문3 유형',
    desc:'학과와 성적이 서로 관련 있는지 기대도수와 칸별 기여도로 밝히고, 어느 칸이 결론을 만들었는지까지 찾는다.',
    done:true },
  { no:'0006', href:'labs/0006-proportion-lab.html', part:'통계', type:'두 모집단 비율',
    title:'모비율 검정 — 두 집단과 세 집단', sub:'29회 문6 · 26회 문5',
    desc:'두 회사 양품률은 z검정으로, 세 선거구 지지율은 카이제곱으로. 신뢰구간이 겹쳐도 유의할 수 있음을 본다.',
    done:true },
  { no:'0007', href:'labs/0007-ttest-lab.html', part:'통계', type:'t검정(대응·독립)',
    title:'대응표본 · 독립표본 t검정', sub:'26~28회 반복 출제',
    desc:'짝지은 자료와 두 집단 자료를 각각 검정하고, 대응 자료를 독립으로 잘못 처리하면 무엇을 잃는지 확인한다.',
    done:true }
];
