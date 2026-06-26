/* 수학 — 분기(세부) 장면. 뼈대에서 branchOf로 갈라짐. 수학독본 수준의 심화/증명 반영.
   동작(behavior)만. 텍스트는 content/math_br.json. engine.js 공유(E.Plot 등). */
(function(){
  var TAU=Math.PI*2, D2R=Math.PI/180;
  // 단계 텍스트 박스(증명용)
  function steps(E, lines, opts){ opts=opts||{}; var ctx=E.ctx, cx=E.W/2, y0=opts.y0||E.H*0.30, lh=opts.lh||E.H*0.075;
    lines.forEach(function(ln,i){ var y=y0+i*lh; ctx.fillStyle=ln.c||'#cfcdc6'; ctx.font=(ln.b?'600 ':'')+(ln.fs||18)+'px sans-serif'; ctx.textAlign='center'; ctx.fillText(ln.t, cx, y); }); }

  function rrect(ctx,x,y,w,h,r){ if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,w,h,r);} else {ctx.beginPath();ctx.rect(x,y,w,h);} }
  // 연습문제 세트(수학, 풀스크린 카드형): N/B로 문항 이동, 풀이는 '자세히 보기'(W) 패널
  function exSet(id, parent, head, items){
    return { id:id, branchOf:parent,
      keys:[{code:'KeyN',key:'N',label:'다음 문항',act:function(E){ E._exi=((E._exi||0)+1)%items.length; }},
            {code:'KeyB',key:'B',label:'이전 문항',act:function(E){ E._exi=((E._exi||0)+items.length-1)%items.length; }}],
      tap:function(E){ E._exi=((E._exi||0)+1)%items.length; },
      enter:function(E){ E._exi=0; E.setOn([]); },
      draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, sel=E._exi||0;
        ctx.textAlign='center'; ctx.fillStyle='#ece9e0'; ctx.font='600 22px sans-serif';
        ctx.fillText(head+'  ('+items.length+'문항)', W/2, H*0.13);
        ctx.font='13px sans-serif'; ctx.fillStyle='#8a8893';
        ctx.fillText('N 다음 · B 이전 문항 · 풀이는 왼쪽 "자세히 보기"(W)', W/2, H*0.175);
        ctx.fillStyle='#6f6e7a'; ctx.font='12px sans-serif';
        ctx.fillText('난이도  ☆ 입문 · ★ 표준 · ★★ 심화', W/2, H*0.21);
        ctx.textAlign='left';
        var n=items.length, cw=Math.min(W*0.7, 760), x0=(W-cw)/2, y0=H*0.26, rowH=Math.min(64,(H*0.52)/n);
        for(var i=0;i<n;i++){ var y=y0+i*rowH, on=(i===sel);
          ctx.fillStyle=on?'rgba(216,129,74,0.16)':'rgba(255,255,255,0.04)';
          ctx.strokeStyle=on?'#d8814a':'rgba(255,255,255,0.10)'; ctx.lineWidth=on?2:1;
          rrect(ctx,x0,y,cw,rowH-12,9); ctx.fill(); ctx.stroke();
          ctx.fillStyle=items[i][0].indexOf('★★')>=0?'#f4a0c0':(items[i][0].indexOf('★')>=0?'#ffb27a':'#8fe3b5');
          ctx.font='15px sans-serif'; ctx.fillText(items[i][0], x0+18, y+rowH*0.42);
          ctx.fillStyle=on?'#f6efe6':'#c3ccda'; ctx.font=(on?'600 ':'')+'15px sans-serif';
          var q=items[i][1], maxc=Math.floor((cw-110)/8.4); if(q.length>maxc)q=q.slice(0,maxc-1)+'…';
          ctx.fillText((i+1)+'. '+q, x0+74, y+rowH*0.42); } }
    };
  }

  // 증명/유도 분기 헬퍼: 캔버스에 단계 그리고, 제목·설명은 JSON(this)에서
  function pf(id, parent, lines, opts){ opts=opts||{};
    return { id:id, branchOf:parent, enter:function(E){ E.setOn([]); },
      draw:function(E){ steps(E, lines, {y0:E.H*0.36, lh:E.H*(lines.length>5?0.072:0.082)});
        E.big(this.title||'', this.sub||this.narr||''); } };   // 소제목=짧은 sub(있으면), 긴 narr은 말풍선 전용
  }
  var O='#ffb27a', B='#7ab8ff', G='#8fe3b5', P='#f4a0c0', N='#cfcdc6';

  var scenes=[
  exSet('math_br_ex_algebra','ch3_11','연습문제 — 수·식·방정식',[
    ['☆','3x − 7 = 11 을 풀어라'],
    ['☆','x² − 5x + 6 = 0 을 인수분해로 풀어라'],
    ['★','이차방정식 x² + bx + 3 = 0 이 중근을 가질 b는?'],
    ['★','(x+2)(x−3) 를 전개하고 다시 인수분해하라'],
    ['★★','근과 계수: x² − 7x + 12 = 0 두 근의 합과 곱은?']]),
  exSet('math_br_ex_function','ch5_06','연습문제 — 함수와 그래프',[
    ['☆','일차함수 y = 2x + 1 의 기울기와 y절편은?'],
    ['★','y = x² − 4x + 3 의 꼭짓점 좌표를 구하라'],
    ['★','y = (x−2)² + 1 의 대칭축과 최솟값은?'],
    ['★','y = 2ˣ 와 y = log₂x 의 관계를 설명하라'],
    ['★★','y = x³ − 3x 의 극대·극소를 그래프로 설명하라']]),
  exSet('math_br_ex_explog','ch7_05','연습문제 — 지수·로그·삼각',[
    ['☆','2³ × 2⁴ 와 2⁵ ÷ 2² 를 계산하라'],
    ['★','log₂8 + log₂4 의 값은?'],
    ['★','log₂x = 5 일 때 x 와, 밑변환 log₄16 의 값'],
    ['★','sin30° · cos60° + cos30° · sin60° 의 값은?'],
    ['★★','sin(α+β) 공식을 이용해 sin75° 를 구하라']]),
  exSet('math_br_ex_seqlim','ch14_05','연습문제 — 수열·극한',[
    ['☆','등차수열 2, 5, 8, … 의 제10항은?'],
    ['★','등비수열 1 + 1/2 + 1/4 + … 의 무한합은?'],
    ['★','1 + 2 + … + 100 을 가우스 공식으로 구하라'],
    ['★','lim(x→2) (x²−4)/(x−2) 의 값은?'],
    ['★★','lim(n→∞) (1 + 1/n)ⁿ 이 무엇으로 수렴하나?']]),
  exSet('math_br_ex_prob','ch16_05','연습문제 — 순열·조합·확률',[
    ['☆','서로 다른 5권을 일렬로 꽂는 경우의 수는?'],
    ['★','10명 중 3명 대표를 뽑는 경우의 수 ₁₀C₃ 는?'],
    ['★','주사위 두 개 합이 7일 확률은?'],
    ['★','동전 3개를 던져 앞면이 2개 나올 확률은?'],
    ['★★','조건부확률: P(A)=0.5, P(A∩B)=0.2 일 때 P(B|A)는?']]),
  exSet('math_br_ex_diff','ch17_06','연습문제 — 미분',[
    ['☆','f(x) = x³ 의 도함수 f′(x) 는?'],
    ['★','f(x) = x² + 3x 의 x=1 에서 접선의 기울기는?'],
    ['★','곱의 미분: (x²·sin x)′ 를 구하라'],
    ['★','f(x) = x³ − 3x 의 극값을 주는 x를 찾아라'],
    ['★★','연쇄법칙으로 (sin(x²))′ 를 구하라']]),
  exSet('math_br_ex_integ','ch19_05','연습문제 — 적분',[
    ['☆','∫ 2x dx 를 구하라 (+C)'],
    ['★','∫₀¹ x² dx 의 값은?'],
    ['★','넓이: y = x 와 x축, x=0~2 사이 넓이는?'],
    ['★','미적분 기본정리로 ∫₁³ 2x dx 를 계산하라'],
    ['★★','치환적분으로 ∫ 2x·(x²+1)³ dx 를 구하라']]),

  // ═══════ 수학 심화 증명·유도 배치 (수학독본 보완) ═══════
  pf('math_br_primeinf','ch1_08',[
    {t:'주장: 소수는 무한히 많다 (유클리드)', c:O, b:true},
    {t:'가정: 소수가 유한개 p₁, p₂, …, pₙ 뿐이라 하자', c:N},
    {t:'N = p₁·p₂·…·pₙ + 1 을 생각한다', c:B},
    {t:'N을 어떤 pᵢ로 나눠도 나머지가 1 → 안 나눠짐', c:B},
    {t:'그런데 N도 소인수를 가져야 함 → 목록 밖의 새 소수!', c:P, b:true},
    {t:'모순. ∴ 소수는 무한히 많다  ∎', c:G, b:true, fs:20}], {y0:0.26}),
  pf('math_br_repeatdec','ch1_03',[
    {t:'순환소수는 항상 분수로 쓸 수 있다', c:O, b:true},
    {t:'x = 0.4444…  라 하면', c:N},
    {t:'10x = 4.444…   (한 자리 밀기)', c:B},
    {t:'10x − x = 4   →   9x = 4', c:B},
    {t:'x = 4/9  (분수!)', c:G, b:true, fs:20},
    {t:'순환마디 길이만큼 10ⁿ 곱해 빼면 항상 분수', c:P}], {y0:0.27}),
  pf('math_br_arithsum','ch13_03',[
    {t:'등차수열의 합 공식 유도 (가우스)', c:O, b:true},
    {t:'S = a + (a+d) + … + L      (정방향)', c:N},
    {t:'S = L + (L−d) + … + a      (역방향)', c:N},
    {t:'2S = (a+L) + (a+L) + … = n(a+L)', c:B},
    {t:'S = n(a+L)/2   = n·(첫항+끝항)/2', c:G, b:true, fs:20},
    {t:'1+2+…+100 = 100·101/2 = 5050', c:P}], {y0:0.27}),
  pf('math_br_binomial','ch15_05',[
    {t:'이항정리: (a+b)ⁿ 의 전개', c:O, b:true},
    {t:'(a+b)ⁿ = 괄호 n개에서 a나 b를 골라 곱한 합', c:N},
    {t:'b를 k개 고르는 방법 = ₙCₖ 가지', c:B},
    {t:'(a+b)ⁿ = Σ ₙCₖ · aⁿ⁻ᵏ · bᵏ   (k=0..n)', c:G, b:true, fs:19},
    {t:'계수 ₙCₖ = 파스칼 삼각형의 n번째 줄', c:P}], {y0:0.28}),
  pf('math_br_sinelaw','ch8_03',[
    {t:'사인법칙: a/sinA = 2R 증명', c:O, b:true},
    {t:'외접원에서 현 a에 대한 원주각 = A', c:N},
    {t:'지름 BD를 그으면 ∠BCD = 90°(반원의 원주각)', c:B},
    {t:'∠BDC = A (같은 호) → sinA = a/(2R)', c:B},
    {t:'∴ a/sinA = b/sinB = c/sinC = 2R  ∎', c:G, b:true, fs:19}], {y0:0.27}),
  pf('math_br_heron','ch8_03',[
    {t:'헤론 공식: 세 변으로 넓이', c:O, b:true},
    {t:'s = (a+b+c)/2  (반둘레)', c:N},
    {t:'넓이 = ½·ab·sinC, 코사인법칙으로 cosC 소거', c:B},
    {t:'Area = √( s(s−a)(s−b)(s−c) )', c:G, b:true, fs:20},
    {t:'각 없이 변 길이만으로 넓이 계산', c:P}], {y0:0.28}),
  pf('math_br_cauchyschwarz','ch9_04',[
    {t:'코시-슈바르츠 부등식', c:O, b:true},
    {t:'|a·b| ≤ |a||b|   (내적 ≤ 크기 곱)', c:B},
    {t:'a·b = |a||b|cosθ 이고 |cosθ| ≤ 1 이므로', c:N},
    {t:'(Σaᵢbᵢ)² ≤ (Σaᵢ²)(Σbᵢ²)', c:G, b:true, fs:19},
    {t:'등호: 두 벡터가 평행할 때(θ=0)', c:P}], {y0:0.28}),
  pf('math_br_ivt','ch14_03',[
    {t:'중간값 정리 (IVT)', c:O, b:true},
    {t:'f가 [a,b]에서 연속이고 f(a)<k<f(b)이면', c:N},
    {t:'f(c)=k 인 c가 (a,b)에 적어도 하나 존재', c:B},
    {t:'직관: 연속한 곡선은 중간값을 건너뛸 수 없다', c:P},
    {t:'응용: f(a)<0<f(b)면 근 존재(이분법의 근거)', c:G, b:true, fs:18}], {y0:0.28}),
  pf('math_br_mvt','ch18_01',[
    {t:'평균값 정리 (MVT)', c:O, b:true},
    {t:'f가 [a,b] 연속·(a,b) 미분가능이면', c:N},
    {t:'f′(c) = (f(b)−f(a))/(b−a) 인 c 존재', c:B},
    {t:'= 평균 변화율(할선)과 같은 접선이 어딘가 있다', c:P},
    {t:'롤의 정리(f(a)=f(b))의 일반화', c:G, b:true, fs:18}], {y0:0.28}),
  pf('math_br_lhopital','ch18_03',[
    {t:'로피탈 정리: 0/0, ∞/∞ 꼴 극한', c:O, b:true},
    {t:'lim f/g 가 0/0 꼴이고 미분가능이면', c:N},
    {t:'lim f(x)/g(x) = lim f′(x)/g′(x)', c:G, b:true, fs:20},
    {t:'예: lim(x→0) sinx/x = cosx/1 → 1', c:B},
    {t:'주의: 0/0·∞/∞ 꼴일 때만 적용', c:P}], {y0:0.28}),
  pf('math_br_elimit','ch14_05',[
    {t:'자연상수 e 의 정의', c:O, b:true},
    {t:'e = lim(n→∞) (1 + 1/n)ⁿ', c:G, b:true, fs:20},
    {t:'이항정리로 펼치면 1 + 1 + 1/2! + 1/3! + …', c:B},
    {t:'= Σ 1/k!  ≈ 2.71828…', c:B},
    {t:'복리·연속성장의 극한. (eˣ)′ = eˣ 의 뿌리', c:P}], {y0:0.28}),
  pf('math_br_logdiff','ch17_05',[
    {t:'로그미분법: 곱·거듭제곱을 쉽게', c:O, b:true},
    {t:'y = xˣ 처럼 밑·지수 모두 변수일 때', c:N},
    {t:'양변 ln: ln y = x·ln x', c:B},
    {t:'미분: y′/y = ln x + 1', c:B},
    {t:'y′ = xˣ(ln x + 1)', c:G, b:true, fs:20}], {y0:0.28}),
  pf('math_br_implicit','ch17_05',[
    {t:'음함수 미분: x²+y²=1 같은 식', c:O, b:true},
    {t:'y를 x의 함수로 보고 양변 x로 미분', c:N},
    {t:'2x + 2y·y′ = 0   (연쇄법칙)', c:B},
    {t:'y′ = −x/y', c:G, b:true, fs:20},
    {t:'y를 명시적으로 풀지 않고 기울기 계산', c:P}], {y0:0.28}),
  pf('math_br_arclen','ch20_03',[
    {t:'곡선의 길이 유도', c:O, b:true},
    {t:'작은 조각 ds = √(dx² + dy²)  (피타고라스)', c:B},
    {t:'= √(1 + (dy/dx)²) dx', c:B},
    {t:'L = ∫ₐᵇ √(1 + (f′(x))²) dx', c:G, b:true, fs:19},
    {t:'직선 근사 조각들을 적분으로 합침', c:P}], {y0:0.28}),
  pf('math_br_solidvol','ch20_02',[
    {t:'회전체 부피 — 원판법', c:O, b:true},
    {t:'y=f(x)를 x축 둘레로 회전', c:N},
    {t:'얇은 원판 부피 = π·반지름²·두께 = π f(x)² dx', c:B},
    {t:'V = π ∫ₐᵇ f(x)² dx', c:G, b:true, fs:20},
    {t:'예: 반원 회전 → 구의 부피 (4/3)πr³', c:P}], {y0:0.28}),
  pf('math_br_cramer','ch21_05',[
    {t:'크라메르 공식: 연립방정식 해', c:O, b:true},
    {t:'Ax = b 에서 D = det(A) ≠ 0 이면', c:N},
    {t:'xᵢ = det(Aᵢ) / det(A)', c:G, b:true, fs:20},
    {t:'Aᵢ = A의 i열을 b로 바꾼 행렬', c:B},
    {t:'2×2: x = (b₁d−b₂c)/(ad−bc)', c:P}], {y0:0.28}),
  pf('math_br_totalprob','ch16_04',[
    {t:'전확률 정리 & 베이즈의 토대', c:O, b:true},
    {t:'표본공간을 배반사건 B₁,…,Bₙ로 분할', c:N},
    {t:'P(A) = Σ P(A|Bᵢ)·P(Bᵢ)', c:G, b:true, fs:19},
    {t:'각 경우로 나눠 더하기(나무그림)', c:B},
    {t:'베이즈: P(Bⱼ|A) = P(A|Bⱼ)P(Bⱼ)/P(A)', c:P}], {y0:0.28}),
  pf('math_br_variance','ch16_05',[
    {t:'분산 공식 V(X) = E(X²) − E(X)²', c:O, b:true},
    {t:'V(X) = E[(X − μ)²]   (정의)', c:N},
    {t:'= E[X² − 2μX + μ²]', c:B},
    {t:'= E(X²) − 2μ·E(X) + μ²  (E(X)=μ)', c:B},
    {t:'= E(X²) − μ²  = E(X²) − E(X)²', c:G, b:true, fs:19}], {y0:0.28}),
  pf('math_br_demorgan','ch4_03',[
    {t:'드모르간 법칙', c:O, b:true},
    {t:'(A ∪ B)ᶜ = Aᶜ ∩ Bᶜ', c:G, b:true, fs:20},
    {t:'(A ∩ B)ᶜ = Aᶜ ∪ Bᶜ', c:G, b:true, fs:20},
    {t:'"둘 중 하나"의 부정 = "둘 다 아님"', c:P},
    {t:'논리(¬(p∨q)=¬p∧¬q)·집합·회로 공통', c:B}], {y0:0.29}),
  pf('math_br_conjroot','ch10_01',[
    {t:'켤레근 정리', c:O, b:true},
    {t:'실수 계수 다항식이 복소근 a+bi 를 가지면', c:N},
    {t:'그 켤레 a−bi 도 반드시 근이다', c:G, b:true, fs:19},
    {t:'근거: 켤레는 +,×를 보존(conj 준동형)', c:B},
    {t:'∴ 복소근은 항상 짝으로 나타난다', c:P}], {y0:0.28}),
  pf('math_br_monoconv','ch25_03',[
    {t:'단조수렴정리', c:O, b:true},
    {t:'위로 유계인 증가수열은 항상 수렴한다', c:G, b:true, fs:19},
    {t:'상한(sup)의 존재 = 실수의 완비성', c:B},
    {t:'극한 = 그 상한값', c:N},
    {t:'코시수열·완비성과 동치 (실수의 구멍 없음)', c:P}], {y0:0.28}),

  // ═══════ 수학 심화 배치 2 — 고급 정리·유도 ═══════
  pf('math_br_taylor','ch18_05',[
    {t:'테일러 정리 — 함수를 다항식으로', c:O, b:true},
    {t:'f(x) = f(a) + f′(a)(x−a) + f″(a)/2!·(x−a)² + …', c:B, fs:17},
    {t:'각 항이 a에서 도함수를 맞춰감 (접촉 차수 ↑)', c:N},
    {t:'잔차 Rₙ = f⁽ⁿ⁺¹⁾(c)/(n+1)!·(x−a)ⁿ⁺¹ (라그랑주)', c:P, fs:17},
    {t:'eˣ, sinx, cosx 를 무한급수로 펼치는 토대', c:G, b:true, fs:18}]),
  pf('math_br_clt','ch16_05',[
    {t:'중심극한정리 (CLT)', c:O, b:true},
    {t:'독립 동일분포 표본의 합(평균)은', c:N},
    {t:'표본 수 n이 커지면 정규분포에 가까워진다', c:G, b:true, fs:19},
    {t:'원래 분포가 무엇이든(평균 μ, 분산 σ²)', c:B},
    {t:'표본평균 ~ N(μ, σ²/n). 통계 추정의 심장', c:P}]),
  pf('math_br_chebyshev','ch16_02',[
    {t:'체비셰프 부등식 → 큰수의 법칙', c:O, b:true},
    {t:'P(|X−μ| ≥ kσ) ≤ 1/k²  (분산으로 꼬리 제한)', c:B, fs:18},
    {t:'표본평균의 분산 = σ²/n → 0 (n↑)', c:N},
    {t:'∴ 표본평균이 μ에서 벗어날 확률 → 0', c:P},
    {t:'= 큰수의 약법칙 (시행 많을수록 평균 수렴)', c:G, b:true, fs:18}]),
  pf('math_br_gramschmidt','ch21_03',[
    {t:'그람-슈미트 직교화', c:O, b:true},
    {t:'벡터 v₁,v₂,… 에서 직교기저 만들기', c:N},
    {t:'u₁ = v₁', c:B},
    {t:'u₂ = v₂ − (v₂·u₁/u₁·u₁)·u₁  (정사영 빼기)', c:B, fs:18},
    {t:'각 단계 이전 방향 성분을 제거 → 서로 수직', c:G, b:true, fs:18}]),
  pf('math_br_trigsub','ch20_03',[
    {t:'삼각치환 적분', c:O, b:true},
    {t:'√(a²−x²) → x = a·sinθ (피타고라스 활용)', c:B},
    {t:'√(a²+x²) → x = a·tanθ', c:N},
    {t:'√(x²−a²) → x = a·secθ', c:N},
    {t:'근호가 사라져 삼각함수 적분으로 바뀜', c:G, b:true, fs:18}]),
  pf('math_br_partfrac','ch2_06',[
    {t:'부분분수 분해', c:O, b:true},
    {t:'1/((x−1)(x−2)) = A/(x−1) + B/(x−2)', c:B, fs:18},
    {t:'통분해 계수 비교: A=−1, B=1', c:N},
    {t:'= −1/(x−1) + 1/(x−2)', c:G, b:true, fs:18},
    {t:'복잡한 유리식 적분·역라플라스의 필수 도구', c:P}]),
  pf('math_br_gaussint','ch19_05',[
    {t:'가우스 적분 ∫e^(−x²)dx = √π', c:O, b:true},
    {t:'I² = ∫∫ e^(−x²−y²) dx dy  (제곱해 2중적분)', c:B, fs:18},
    {t:'극좌표 변환: x²+y² = r², dxdy = r dr dθ', c:N},
    {t:'= ∫₀²π∫₀^∞ e^(−r²) r dr dθ = π', c:B, fs:18},
    {t:'∴ I = √π. 정규분포 정규화의 핵심', c:G, b:true, fs:18}]),
  pf('math_br_eulerident','ch10_03',[
    {t:'오일러 항등식 e^(iπ) + 1 = 0', c:O, b:true},
    {t:'오일러 공식 e^(iθ) = cosθ + i·sinθ 에서', c:B},
    {t:'θ = π 대입: e^(iπ) = cosπ + i·sinπ', c:N},
    {t:'= −1 + 0 = −1', c:B},
    {t:'e, i, π, 1, 0 다섯 상수를 한 식에  ∎', c:G, b:true, fs:19}]),
  pf('math_br_nthroot','ch10_04',[
    {t:'복소수의 n제곱근 (드무아브르)', c:O, b:true},
    {t:'z = r(cosθ + i·sinθ) 의 n제곱근은', c:N},
    {t:'ⁿ√r · (cos((θ+2πk)/n) + i·sin(…)), k=0..n−1', c:B, fs:17},
    {t:'복소평면에서 정n각형 꼭짓점에 배치', c:G, b:true, fs:18},
    {t:'1의 n제곱근 = 단위원 위 균등 분포 점들', c:P}]),
  pf('math_br_lagrangemult','ch18_04',[
    {t:'라그랑주 승수법 — 제약하 최적화', c:O, b:true},
    {t:'제약 g(x,y)=0 위에서 f(x,y) 극값 찾기', c:N},
    {t:'극값에서 ∇f = λ·∇g  (기울기 평행)', c:G, b:true, fs:19},
    {t:'등위선과 제약곡선이 접하는 지점', c:B},
    {t:'∇f, ∇g, g=0 연립으로 후보점 찾음', c:P}]),
  pf('math_br_ratiotest','ch13_04',[
    {t:'비 판정법 — 급수 수렴 판정', c:O, b:true},
    {t:'L = lim |aₙ₊₁/aₙ| 을 본다', c:B},
    {t:'L < 1 → 절대수렴', c:G, fs:18},
    {t:'L > 1 → 발산', c:P, fs:18},
    {t:'L = 1 → 판정 불가(다른 판정 필요)', c:N, fs:18}]),
  pf('math_br_radiusconv','ch14_04',[
    {t:'멱급수의 수렴반경', c:O, b:true},
    {t:'Σ aₙxⁿ 이 수렴하는 |x| < R 범위', c:N},
    {t:'1/R = lim |aₙ₊₁/aₙ|  (비 판정)', c:B, fs:18},
    {t:'|x| < R 절대수렴, |x| > R 발산', c:G, b:true, fs:18},
    {t:'경계 |x|=R 는 따로 조사', c:P}]),
  pf('math_br_stronginduction','ch13_05',[
    {t:'강한 수학적 귀납법', c:O, b:true},
    {t:'P(1) … P(k) 모두 참 ⇒ P(k+1) 참', c:B, fs:18},
    {t:'(보통 귀납은 P(k) 하나만 가정)', c:N},
    {t:'모든 이전 경우를 써야 할 때 사용', c:P},
    {t:'예: 모든 n≥2 는 소수들의 곱(소인수분해)', c:G, b:true, fs:18}]),
  pf('math_br_cantorbern','ch24_03',[
    {t:'칸토어-베른슈타인 정리', c:O, b:true},
    {t:'A→B 단사 있고 B→A 단사 있으면', c:N},
    {t:'A와 B 사이 일대일대응 존재 (|A|=|B|)', c:G, b:true, fs:18},
    {t:'양방향 "≤"가 "="를 준다 (집합 크기의 반대칭)', c:B},
    {t:'예: [0,1] 과 (0,1) 은 같은 크기', c:P}]),
  pf('math_br_diagonalize','ch22_05',[
    {t:'행렬의 대각화', c:O, b:true},
    {t:'고유벡터들을 모은 P로 A = P·D·P⁻¹', c:B, fs:18},
    {t:'D = 고유값들의 대각행렬', c:N},
    {t:'Aⁿ = P·Dⁿ·P⁻¹ (거듭제곱이 쉬워짐!)', c:G, b:true, fs:18},
    {t:'점화식·미분방정식·동역학 해석에 활용', c:P}]),
  pf('math_br_cayley','ch21_05',[
    {t:'케일리-해밀턴 정리', c:O, b:true},
    {t:'행렬 A는 자기 특성방정식을 만족한다', c:G, b:true, fs:19},
    {t:'특성다항식 p(λ)=det(A−λI) 라면 p(A)=O', c:B, fs:17},
    {t:'2×2: A² − (trA)A + (detA)I = O', c:N},
    {t:'A⁻¹·고차 거듭제곱을 낮은 차수로 환원', c:P}]),
  pf('math_br_sepvar','ch20_04',[
    {t:'변수분리형 미분방정식', c:O, b:true},
    {t:'dy/dx = g(x)·h(y) 꼴이면', c:N},
    {t:'dy/h(y) = g(x)dx  (변수 분리)', c:B},
    {t:'양변 적분 → 해', c:B},
    {t:'예: dy/dx=ky → y=Ce^(kx) (지수성장)', c:G, b:true, fs:18}]),
  pf('math_br_linode','ch20_04',[
    {t:'1계 선형 미분방정식 — 적분인자', c:O, b:true},
    {t:'y′ + P(x)y = Q(x)', c:N},
    {t:'적분인자 μ = e^(∫P dx) 를 곱하면', c:B},
    {t:'(μy)′ = μQ  (좌변이 곱미분 형태로)', c:B, fs:18},
    {t:'y = (1/μ)∫μQ dx. RC회로·인구모형', c:G, b:true, fs:18}]),
  pf('math_br_genfunc','ch13_05',[
    {t:'생성함수 — 수열을 다항식으로', c:O, b:true},
    {t:'수열 aₙ ↔ G(x) = Σ aₙxⁿ', c:B, fs:18},
    {t:'점화식 → G(x)의 방정식 → 닫힌형', c:N},
    {t:'피보나치: G(x)=x/(1−x−x²)', c:P, fs:18},
    {t:'조합·확률·점화식의 만능 도구', c:G, b:true, fs:18}]),
  pf('math_br_quadrecip','ch23_04',[
    {t:'이차 상호법칙 (가우스의 보석)', c:O, b:true},
    {t:'홀수 소수 p, q 에 대해', c:N},
    {t:'(p/q)(q/p) = (−1)^((p−1)/2·(q−1)/2)', c:B, fs:17},
    {t:'p가 q의 이차잉여인지 ↔ 그 역을 연결', c:P},
    {t:'정수론의 깊은 대칭. 가우스가 8가지로 증명', c:G, b:true, fs:17}]),

  // ═══════ 수학 심화 배치 3 — 인류 문화유산급 랜드마크 ═══════
  pf('math_br_basel','ch14_04',[
    {t:'바젤 문제 — 오일러의 승리', c:O, b:true},
    {t:'1 + 1/4 + 1/9 + 1/16 + … = ?', c:N},
    {t:'sinx/x 의 무한곱·근으로 계수를 비교하면', c:B},
    {t:'Σ 1/n² = π² / 6  ≈ 1.6449', c:G, b:true, fs:21},
    {t:'정수의 제곱 합에 π가 나타나는 경이', c:P}]),
  pf('math_br_harmonic','ch13_04',[
    {t:'조화급수는 발산한다', c:O, b:true},
    {t:'1 + 1/2 + 1/3 + 1/4 + … = ∞', c:G, b:true, fs:20},
    {t:'묶기: 1/3+1/4 > 1/2, 1/5+…+1/8 > 1/2, …', c:B, fs:17},
    {t:'1/2 짜리 덩어리가 무한히 → 합 무한대', c:P},
    {t:'항은 0으로 가도 합은 발산(느리게 ~ ln n)', c:N}]),
  pf('math_br_altseries','ch13_04',[
    {t:'교대급수 판정 (라이프니츠)', c:O, b:true},
    {t:'aₙ 이 0으로 단조감소하면', c:N},
    {t:'Σ (−1)ⁿ aₙ 은 수렴한다', c:G, b:true, fs:19},
    {t:'예: 1 − 1/2 + 1/3 − 1/4 + … = ln 2', c:B},
    {t:'부분합이 답을 사이에 두고 좁혀짐', c:P}]),
  pf('math_br_stirling','ch15_05',[
    {t:'스털링 근사 — n! 의 크기', c:O, b:true},
    {t:'n! ≈ √(2πn) · (n/e)ⁿ', c:G, b:true, fs:20},
    {t:'ln(n!) = Σ ln k ≈ ∫ ln x dx = n ln n − n', c:B, fs:17},
    {t:'거대한 팩토리얼을 다루는 표준 도구', c:P},
    {t:'확률·통계역학·정보이론에 필수', c:N}]),
  pf('math_br_gamma','ch19_05',[
    {t:'감마 함수 — 팩토리얼의 연속 확장', c:O, b:true},
    {t:'Γ(n) = ∫₀^∞ x^(n−1) e^(−x) dx', c:B, fs:18},
    {t:'Γ(n) = (n−1)!  (자연수에서)', c:G, b:true, fs:19},
    {t:'Γ(1/2) = √π  (가우스 적분과 연결)', c:P},
    {t:'정수가 아닌 차수의 팩토리얼을 정의', c:N}]),
  pf('math_br_weierstrass','ch25_02',[
    {t:'연속이지만 어디서도 미분 불가', c:O, b:true},
    {t:'바이어슈트라스 함수 Σ aⁿcos(bⁿπx)', c:B, fs:18},
    {t:'온통 연속(끊김 없음)이지만', c:N},
    {t:'모든 점에서 뾰족 — 접선이 없다!', c:P},
    {t:'"연속 ⇒ 미분가능"이 거짓임을 보인 충격', c:G, b:true, fs:18}]),
  pf('math_br_greendiv','ch11_05',[
    {t:'발산정리·그린/스토크스 정리', c:O, b:true},
    {t:'영역 안의 누적 = 경계에서의 흐름', c:G, b:true, fs:19},
    {t:'∮ F·dr = ∬ (∂Q/∂x − ∂P/∂y) dA  (그린)', c:B, fs:16},
    {t:'∯ F·dS = ∭ div F dV  (발산정리)', c:B, fs:16},
    {t:'미적분 기본정리의 다차원 일반화', c:P}]),
  pf('math_br_jacobian','ch20_05',[
    {t:'야코비안 — 다중적분 변수변환', c:O, b:true},
    {t:'좌표를 바꾸면 넓이/부피 배율이 생긴다', c:N},
    {t:'∬f dx dy = ∬f |∂(x,y)/∂(u,v)| du dv', c:B, fs:17},
    {t:'극좌표: dx dy = r dr dθ  (야코비안 = r)', c:G, b:true, fs:18},
    {t:'가우스 적분·확률밀도 변환의 핵심', c:P}]),
  pf('math_br_fourier','ch8_05',[
    {t:'푸리에 급수 — 파동의 분해', c:O, b:true},
    {t:'주기함수 = 사인·코사인들의 합', c:G, b:true, fs:19},
    {t:'f(x) = a₀ + Σ(aₙcos nx + bₙsin nx)', c:B, fs:17},
    {t:'계수 = 직교성으로 추출(내적 적분)', c:N},
    {t:'음향·신호·열전도·양자역학의 언어', c:P}]),
  pf('math_br_laplace','ch20_04',[
    {t:'라플라스 변환 — 미분을 곱셈으로', c:O, b:true},
    {t:'L{f}(s) = ∫₀^∞ f(t) e^(−st) dt', c:B, fs:18},
    {t:'미분 → s 곱하기로 바뀜: L{f′}=sF−f(0)', c:G, b:true, fs:17},
    {t:'미분방정식을 대수방정식으로 변환', c:N},
    {t:'제어·회로·신호처리의 표준 도구', c:P}]),
  pf('math_br_triplescalar','ch11_03',[
    {t:'스칼라 삼중곱 = 평행육면체 부피', c:O, b:true},
    {t:'a·(b×c) = det[a b c]', c:G, b:true, fs:20},
    {t:'외적 b×c = 밑면 넓이(법선), a·(…) = 높이×넓이', c:B, fs:16},
    {t:'= 0 이면 세 벡터가 한 평면 위(공면)', c:P},
    {t:'부호는 오른손/왼손 방향(배향)', c:N}]),
  pf('math_br_powerset','ch24_02',[
    {t:'멱집합은 항상 더 크다 — 칸토어', c:O, b:true},
    {t:'|P(S)| = 2^|S|  (부분집합의 수)', c:B, fs:19},
    {t:'어떤 집합도 자기 멱집합과 일대일대응 불가', c:G, b:true, fs:18},
    {t:'대각선 논법: "자기를 안 가진 원소들"의 집합', c:P},
    {t:'∴ 무한에도 끝없는 위계 (ℵ₀=자연수의 무한 < ℵ₁ < …)', c:N}]),
  pf('math_br_russell','ch24_04',[
    {t:'러셀의 역설 — 소박한 집합론의 붕괴', c:O, b:true},
    {t:'R = {자기 자신을 원소로 안 갖는 집합}', c:B},
    {t:'R ∈ R 인가? — 맞다면 정의상 아니어야 하고', c:P},
    {t:'아니라면 정의상 R ∈ R 이어야 한다 → 모순', c:P},
    {t:'공리적 집합론(ZFC)이 탄생한 계기', c:G, b:true, fs:18}]),
  pf('math_br_godel','ch26_04',[
    {t:'괴델 불완전성 정리', c:O, b:true},
    {t:'충분히 강한 무모순 공리계에는', c:N},
    {t:'참이지만 증명할 수 없는 명제가 존재한다', c:G, b:true, fs:18},
    {t:'"이 명제는 증명 불가능하다"의 자기지시', c:P},
    {t:'수학의 완전한 기계화가 불가능함을 증명', c:B}]),
  pf('math_br_fermatlast','ch23_04',[
    {t:'페르마의 마지막 정리', c:O, b:true},
    {t:'n ≥ 3 이면 xⁿ + yⁿ = zⁿ 의 정수해 없음', c:G, b:true, fs:18},
    {t:'"여백이 좁아 증명을 안 적는다" (1637)', c:P},
    {t:'358년 미해결 → 와일즈가 1994년 증명', c:B},
    {t:'타원곡선·모듈러형식을 잇는 깊은 다리', c:N}]),
  pf('math_br_riemann','ch26_04',[
    {t:'리만 가설 — 100만 달러 난제', c:O, b:true},
    {t:'제타함수 ζ(s)=Σ1/nˢ 의 비자명 영점은', c:N},
    {t:'모두 실수부 = 1/2 직선 위에 있다(추측)', c:G, b:true, fs:18},
    {t:'소수의 분포를 지배하는 깊은 비밀', c:P},
    {t:'160년째 미해결. 밀레니엄 문제', c:B}]),
  pf('math_br_goldbach','ch23_01',[
    {t:'골드바흐 추측', c:O, b:true},
    {t:'2보다 큰 모든 짝수는', c:N},
    {t:'두 소수의 합으로 쓸 수 있다 (추측)', c:G, b:true, fs:19},
    {t:'4=2+2, 6=3+3, 8=3+5, 10=3+7=5+5, …', c:B},
    {t:'1742년 제기, 컴퓨터로 4×10¹⁸까지 확인', c:P}]),
  pf('math_br_planeeq','ch11_05',[
    {t:'평면의 방정식 — 법선벡터', c:O, b:true},
    {t:'법선 n=(a,b,c), 점 P₀ 지나는 평면', c:N},
    {t:'n · (P − P₀) = 0', c:B},
    {t:'ax + by + cz = d  (d = n·P₀)', c:G, b:true, fs:19},
    {t:'점-평면 거리 = |n·P − d| / |n|', c:P}]),



  // ══════ 무리수 √2(ch1_05) ▸ √2가 무리수임의 증명 ══════
  { id:'math_br_sqrt2', branchOf:'ch1_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ steps(E, [
      {t:'가정: √2 = p/q (더 약분 안 되는 기약분수)', c:'#ffb27a', b:true},
      {t:'양변 제곱 →  2 = p²/q²  →  p² = 2q²', c:'#cfcdc6'},
      {t:'p²이 짝수 → p도 짝수 → p = 2k', c:'#7ab8ff'},
      {t:'2q² = (2k)² = 4k²  →  q² = 2k²  →  q도 짝수', c:'#7ab8ff'},
      {t:'p, q 둘 다 짝수 = 약분 가능 → 기약분수 가정에 모순!', c:'#f4a0c0', b:true},
      {t:'∴ √2는 분수로 쓸 수 없다 = 무리수  ∎', c:'#8fe3b5', b:true, fs:20}
    ], {y0:E.H*0.26, lh:E.H*0.085});
      E.big('√2 는 무리수 — 귀류법 증명', '"분수로 쓸 수 있다"고 가정하면 모순이 나옵니다. 피타고라스 학파를 충격에 빠뜨린 증명 — 수직선에 분수로 못 채우는 구멍이 있다!'); }
  },

  // ══════ 완전제곱식(ch3_03) ▸ 근의 공식 유도 ══════
  { id:'math_br_quadformula', branchOf:'ch3_03',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ steps(E, [
      {t:'ax² + bx + c = 0', c:'#ffb27a', b:true, fs:20},
      {t:'양변 ÷ a →  x² + (b/a)x + c/a = 0', c:'#cfcdc6'},
      {t:'완전제곱식(#21):  (x + b/2a)² = b²/4a² − c/a', c:'#7ab8ff'},
      {t:'우변 통분 →  (x + b/2a)² = (b² − 4ac) / 4a²', c:'#7ab8ff'},
      {t:'양변 √ →  x + b/2a = ±√(b²−4ac) / 2a', c:'#cfcdc6'},
      {t:'x = ( −b ± √(b²−4ac) ) / 2a', c:'#8fe3b5', b:true, fs:22}
    ], {y0:E.H*0.26, lh:E.H*0.085});
      E.big('근의 공식 유도 — 완전제곱식으로', '외우는 공식이 어디서 왔을까? 완전제곱식(#21)으로 x를 \"가둬\" 풀면 근의 공식이 나옵니다. √ 안의 b²−4ac가 바로 판별식(#22)!'); }
  },

  // ══════ 판별식(ch3_05) ▸ 근과 계수의 관계 (비에트) ══════
  { id:'math_br_vieta', branchOf:'ch3_05',
    enter:function(E){ this.s={b:-1,c:-6}; E.Plot.range(-5,5,-8,6);
      E.controls('<div class="ctrl"><label>b</label><input type="range" id="vb" min="-4" max="4" step="1" value="-1"><output id="vbo">-1</output><label style="margin-left:14px">c</label><input type="range" id="vc" min="-6" max="2" step="1" value="-6"><output id="vco">-6</output></div>');
      var self=this; E.bind('#vb','input',function(e){ self.s.b=+e.target.value; document.getElementById('vbo').textContent=e.target.value; E.blip(440,0.1); });
      E.bind('#vc','input',function(e){ self.s.c=+e.target.value; document.getElementById('vco').textContent=e.target.value; E.blip(420,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, b=this.s.b, c=this.s.c, ctx=E.ctx, D=b*b-4*c; P.axes();
      P.curve(function(x){return x*x+b*x+c;}, '#7ab8ff');
      if(D>=0){ var r1=(-b-Math.sqrt(D))/2, r2=(-b+Math.sqrt(D))/2; P.dot(r1,0,'#ffb27a'); P.dot(r2,0,'#ffb27a');
        ctx.fillStyle='#8fe3b5'; ctx.font='14px sans-serif'; ctx.textAlign='center';
        ctx.fillText('두 근 합 = '+(r1+r2).toFixed(1)+' = −b('+(-b)+')  ·  곱 = '+(r1*r2).toFixed(1)+' = c('+c+')', E.W/2, E.H*0.80); }
      else { ctx.fillStyle='#f4a0c0'; ctx.font='14px sans-serif'; ctx.textAlign='center'; ctx.fillText('D<0 (실근 없음) — 그래도 두 복소근의 합=−b, 곱=c', E.W/2, E.H*0.80); }
      // 계수 b·c 표기: 0→항 생략, ±1→x/−x, 그 외 부호 정리(+ −n → − n)
      var bt=(b===0?'':b===1?' + x':b===-1?' − x':b>0?' + '+b+'x':' − '+(-b)+'x');
      var ct=(c===0?'':c>0?' + '+c:' − '+(-c));
      E.big('x²'+bt+ct+'  →  합=−b, 곱=c', '근과 계수의 관계(비에트) — 근을 직접 안 구해도 두 근의 합(−b/a)·곱(c/a)을 계수로 즉시! 인수분해·방정식 세우기의 핵심'); }
  },

  // ══════ 덧셈정리(ch8_04) ▸ 2배각 공식 ══════
  { id:'math_br_double', branchOf:'ch8_04',
    enter:function(E){ this.s={deg:30}; E.setOn([]);
      E.controls('<div class="ctrl"><label>각 θ</label><input type="range" id="dd" min="10" max="80" step="5" value="30"><output id="ddo">30°</output></div>');
      var self=this; E.bind('#dd','input',function(e){ self.s.deg=+e.target.value; document.getElementById('ddo').textContent=e.target.value+'°'; E.blip(440,0.1); }); },
    draw:function(E){ var ctx=E.ctx, t=this.s.deg*D2R, cx=E.W/2, cy=E.H*0.46, R=Math.min(E.H*0.24,E.W*0.18);
      ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(cx-R*1.3,cy); ctx.lineTo(cx+R*1.3,cy); ctx.moveTo(cx,cy-R*1.3); ctx.lineTo(cx,cy+R*1.3); ctx.stroke();
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(cx,cy,R,0,TAU); ctx.stroke();
      function ray(ang,col){ var px=cx+R*Math.cos(ang),py=cy-R*Math.sin(ang); ctx.strokeStyle=col; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(px,py); ctx.stroke(); ctx.fillStyle=col; ctx.beginPath(); ctx.arc(px,py,5,0,TAU); ctx.fill(); }
      ray(t,'#7ab8ff'); ray(2*t,'#ffb27a');
      var s2=Math.sin(2*t), chk=2*Math.sin(t)*Math.cos(t);
      ctx.fillStyle=E.COL.txt; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('파랑 θ, 주황 2θ', cx, cy+R*1.4);
      E.big('sin 2θ = 2 sin θ cos θ   ('+s2.toFixed(3)+' = '+chk.toFixed(3)+')', '2배각 공식 — 덧셈정리(#55)에서 α=β=θ로! sin(θ+θ)=sinθcosθ+cosθsinθ=2sinθcosθ. cos2θ=cos²θ−sin²θ도 마찬가지. 적분·물리에 필수'); }
  },

  // ══════ 멱법칙(ch17_04) ▸ 미분의 여러 법칙 ══════
  { id:'math_br_difrules', branchOf:'ch17_04',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ steps(E, [
      {t:'상수배:  (c·f)′ = c·f′', c:'#7ab8ff'},
      {t:'합·차:  (f ± g)′ = f′ ± g′', c:'#7ab8ff'},
      {t:'곱:  (f·g)′ = f′g + f g′', c:'#ffb27a', b:true},
      {t:'몫:  (f/g)′ = (f′g − f g′) / g²', c:'#ffb27a'},
      {t:'연쇄법칙:  ( f(g(x)) )′ = f′(g(x)) · g′(x)', c:'#8fe3b5', b:true, fs:20},
      {t:'예) (sin(x²))′ = cos(x²) · 2x', c:'#cfcdc6'}
    ], {y0:E.H*0.26, lh:E.H*0.085});
      E.big('미분의 법칙 — 복잡한 함수도 조립', '멱법칙(#100)만으론 부족합니다. 곱·몫·연쇄법칙으로 어떤 함수든 분해해 미분! 특히 연쇄법칙은 "겹친 함수"의 핵심 — 신경망 역전파의 토대'); }
  },

  // ══════ 사인법칙(ch8_05) ▸ 코사인법칙 ══════
  { id:'math_br_coslaw', branchOf:'ch8_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, cx=E.W/2, cy=E.H*0.55, A=[cx-150,cy+60], B=[cx+150,cy+60], C=[cx-30,cy-130];
      ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(A[0],A[1]); ctx.lineTo(B[0],B[1]); ctx.lineTo(C[0],C[1]); ctx.closePath(); ctx.stroke();
      ctx.fillStyle='#ffd9bd'; ctx.font='600 15px sans-serif'; ctx.textAlign='center';
      ctx.fillText('A',A[0]-14,A[1]+6); ctx.fillText('B',B[0]+14,B[1]+6); ctx.fillText('C',C[0]-2,C[1]-12);
      ctx.fillStyle='#8fe3b5'; ctx.font='14px sans-serif';
      ctx.fillText('c',(A[0]+B[0])/2,(A[1]+B[1])/2+20); ctx.fillText('b',(A[0]+C[0])/2-16,(A[1]+C[1])/2); ctx.fillText('a',(B[0]+C[0])/2+16,(B[1]+C[1])/2);
      ctx.fillStyle='#ffb27a'; ctx.font='600 18px sans-serif'; ctx.fillText('c² = a² + b² − 2ab·cos C', cx, E.H*0.80);
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.fillText('C = 90°이면 cos C = 0 → c² = a² + b² (피타고라스!)', cx, E.H*0.85);
      E.big('코사인법칙 — 피타고라스의 일반화', '직각이 아닌 삼각형에도! c²=a²+b²−2ab cosC. 각 C가 직각이면 보정항(−2ab cosC)이 사라져 1장 피타고라스가 됨. 두 변과 낀 각으로 나머지 변을 구합니다'); }
  },

  // ══════ 복소수 곱셈(ch10_04) ▸ 드무아브르 정리 ══════
  { id:'math_br_demoivre', branchOf:'ch10_04',
    enter:function(E){ this.s={n:2}; E.Plot.range(-6,6,-4,4);
      E.controls('<div class="ctrl"><label>거듭제곱 n</label><input type="range" id="dn" min="1" max="4" step="1" value="2"><output id="dno">2</output></div>');
      var self=this; E.bind('#dn','input',function(e){ self.s.n=+e.target.value; document.getElementById('dno').textContent=e.target.value; E.blip(440,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, n=this.s.n, ctx=E.ctx, r=1.25, t=35*Math.PI/180; P.axes();
      function ph(rr,ang,col,lab){ var x=rr*Math.cos(ang),y=rr*Math.sin(ang); ctx.strokeStyle=col; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(P.X(0),P.Y(0)); ctx.lineTo(P.X(x),P.Y(y)); ctx.stroke(); ctx.fillStyle=col; ctx.beginPath(); ctx.arc(P.X(x),P.Y(y),5,0,7); ctx.fill(); if(lab){ctx.font='600 13px sans-serif';ctx.textAlign='left';ctx.fillText(lab,P.X(x)+6,P.Y(y));} }
      ph(r,t,'rgba(122,184,255,0.5)','z');
      ph(Math.pow(r,n),n*t,'#ffb27a','zⁿ');
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('크기 r → rⁿ, 각 θ → nθ', E.W/2, E.H*0.80);
      E.big('zⁿ = rⁿ(cos nθ + i sin nθ)  (n='+n+')', '드무아브르 정리 — 복소수 거듭제곱 = 크기는 n제곱, 각은 n배! 곱셈=각의 합(#65)을 반복한 결과. 단위근(1의 n제곱근)·FFT의 토대'); }
  },

  // ══════ 등비수열(ch13_02) ▸ 합 공식 유도 ══════
  { id:'math_br_geomsum', branchOf:'ch13_02',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ steps(E, [
      {t:'S = a + ar + ar² + … + arⁿ⁻¹', c:'#ffb27a', b:true, fs:19},
      {t:'양변 × r →  rS = ar + ar² + … + arⁿ', c:'#cfcdc6'},
      {t:'두 식 빼기 (S − rS):  거의 다 상쇄!', c:'#7ab8ff'},
      {t:'S(1 − r) = a − arⁿ = a(1 − rⁿ)', c:'#7ab8ff'},
      {t:'S = a(1 − rⁿ) / (1 − r)   (r ≠ 1)', c:'#8fe3b5', b:true, fs:21},
      {t:'|r|<1 이고 n→∞ 면 rⁿ→0 →  S = a/(1−r)  (#80 무한급수!)', c:'#f4a0c0'}
    ], {y0:E.H*0.26, lh:E.H*0.085});
      E.big('등비수열의 합 — 밀어서 빼기', 'S와 rS를 빼면 가운데가 다 상쇄돼 깔끔한 공식이! S=a(1−rⁿ)/(1−r). |r|<1로 무한히 가면 #80 무한등비급수 a/(1−r)가 바로 나옵니다'); }
  },

  // ══════ 로그(ch7_03) ▸ 밑변환과 자연로그 ══════
  { id:'math_br_logbase', branchOf:'ch7_03',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ steps(E, [
      {t:'밑변환 공식:  logₐ x = (log_b x) / (log_b a)', c:'#ffb27a', b:true, fs:19},
      {t:'→ 어떤 밑이든 계산기의 한 밑(보통 e나 10)으로 변환', c:'#cfcdc6'},
      {t:'자연로그 ln = 밑이 e (≈2.718) 인 로그', c:'#7ab8ff'},
      {t:'(ln x)′ = 1/x,  (eˣ)′ = eˣ  — 미적분에서 가장 깔끔!', c:'#8fe3b5', b:true},
      {t:'그래서 미적분·과학·통계의 기본 밑은 e (#86 자연상수)', c:'#9b99a3', fs:15}
    ], {y0:E.H*0.30, lh:E.H*0.09});
      E.big('로그의 밑변환 & 자연로그 ln', '어떤 밑의 로그도 log_b x / log_b a 로 바꿉니다. 미적분에선 밑 e가 특별 — ln의 미분이 1/x로 가장 단순! 14장 e(#86)가 왜 중요한지의 답'); }
  },

  // ══════ 공간벡터(ch11_02) ▸ 벡터의 외적 ══════
  { id:'math_br_cross', branchOf:'ch11_02',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, O=[E.W*0.4,E.H*0.62], a=[E.W*0.66,E.H*0.52], b=[E.W*0.5,E.H*0.32];
      // 평행사변형
      var d=[a[0]+b[0]-O[0], a[1]+b[1]-O[1]];
      ctx.fillStyle='rgba(143,227,181,0.14)'; ctx.beginPath(); ctx.moveTo(O[0],O[1]); ctx.lineTo(a[0],a[1]); ctx.lineTo(d[0],d[1]); ctx.lineTo(b[0],b[1]); ctx.closePath(); ctx.fill();
      function vec(p,col,lab){ ctx.strokeStyle=col; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(O[0],O[1]); ctx.lineTo(p[0],p[1]); ctx.stroke(); var ang=Math.atan2(p[1]-O[1],p[0]-O[0]); ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(p[0],p[1]); ctx.lineTo(p[0]-12*Math.cos(ang-0.4),p[1]-12*Math.sin(ang-0.4)); ctx.lineTo(p[0]-12*Math.cos(ang+0.4),p[1]-12*Math.sin(ang+0.4)); ctx.fill(); ctx.font='600 15px sans-serif'; ctx.fillText(lab,p[0]+8,p[1]); }
      vec(a,'#7ab8ff','a'); vec(b,'#8fe3b5','b');
      // 수직 결과(위로)
      var nx=O[0], ny=O[1]-90; ctx.strokeStyle='#ffb27a'; ctx.lineWidth=3; ctx.setLineDash([5,3]); ctx.beginPath(); ctx.moveTo(O[0],O[1]); ctx.lineTo(nx,ny); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='#ffb27a'; ctx.font='600 14px sans-serif'; ctx.fillText('a×b (평면에 수직)',nx+8,ny+4);
      ctx.fillStyle='#8fe3b5'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('|a×b| = |a||b|sinθ = 평행사변형 넓이', E.W/2, E.H*0.80);
      E.big('벡터의 외적 a×b — 평면 밖으로', '내적(#60)이 "수(스칼라)"였다면, 외적은 두 벡터에 수직인 "벡터"! 크기=평행사변형 넓이=|a||b|sinθ. 법선·회전력(토크)·3D 그래픽의 핵심(3차원 전용)'); }
  },

  // ══════ 부정적분(ch19_02) ▸ 치환·부분적분 ══════
  { id:'math_br_inttech', branchOf:'ch19_02',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ steps(E, [
      {t:'치환적분 (연쇄법칙의 역):', c:'#ffb27a', b:true},
      {t:'∫ f(g(x))·g′(x) dx = ∫ f(u) du   (u = g(x))', c:'#7ab8ff'},
      {t:'예) ∫ 2x·cos(x²) dx = sin(x²) + C', c:'#9b99a3', fs:15},
      {t:'부분적분 (곱 미분의 역):', c:'#ffb27a', b:true},
      {t:'∫ u dv = uv − ∫ v du', c:'#8fe3b5', b:true, fs:20},
      {t:'예) ∫ x·eˣ dx = x·eˣ − ∫ eˣ dx = (x−1)eˣ + C', c:'#9b99a3', fs:15}
    ], {y0:E.H*0.24, lh:E.H*0.082});
      E.big('적분의 기술 — 치환 & 부분적분', '미분은 규칙대로지만 적분은 "기술"이 필요합니다. 치환적분=연쇄법칙(#100.1) 거꾸로, 부분적분=곱 미분 거꾸로. 미분 법칙을 뒤집으면 적분 도구가 됩니다!'); }
  },

  // ══════ 인수분해(ch2_03) ▸ 인수정리·조립제법 ══════
  { id:'math_br_factortheorem', branchOf:'ch2_03',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, cx=E.W/2;
      steps(E, [
        {t:'인수정리:  P(a) = 0  ⟺  (x − a)는 P(x)의 인수', c:'#ffb27a', b:true, fs:18},
        {t:'예) P(x) = x³ − 2x² − 5x + 6,  P(1)=0 → (x−1) 인수', c:'#cfcdc6', fs:16}
      ], {y0:E.H*0.22, lh:E.H*0.07});
      // 조립제법 표
      var x0=cx-180, y=E.H*0.42, cw=70;
      ctx.fillStyle='#7ab8ff'; ctx.font='600 16px sans-serif'; ctx.textAlign='center';
      var row1=['1','−2','−5','6'], row2=['','1','−1','−6'], row3=['1','−1','−6','0'];
      ctx.fillStyle='#ffb27a'; ctx.fillText('1', x0-30, y+10);
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.moveTo(x0-10,y-16); ctx.lineTo(x0-10,y+70); ctx.stroke();
      for(var i=0;i<4;i++){ ctx.fillStyle='#cfcdc6'; ctx.fillText(row1[i], x0+i*cw, y); ctx.fillStyle='#8fe3b5'; ctx.fillText(row2[i], x0+i*cw, y+30); }
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.moveTo(x0-20,y+44); ctx.lineTo(x0+3.3*cw,y+44); ctx.stroke();
      for(var i=0;i<4;i++){ ctx.fillStyle=i===3?'#ffb27a':'#dfeefb'; ctx.font='600 17px sans-serif'; ctx.fillText(row3[i], x0+i*cw, y+66); }
      ctx.fillStyle='#9b99a3'; ctx.font='14px sans-serif'; ctx.fillText('몫 = x²−x−6 = (x−3)(x+2),  나머지 0 → P=(x−1)(x−3)(x+2)', cx, E.H*0.72);
      E.big('인수정리 & 조립제법', '고차식 인수분해의 열쇠! P(a)=0인 a를 찾으면 (x−a)가 인수. 조립제법으로 빠르게 나눠 몫을 구합니다 — 3차·4차방정식 풀이의 출발점'); }
  },

  // ══════ 이차부등식(ch4_03) ▸ 산술-기하 평균 부등식 ══════
  { id:'math_br_amgm', branchOf:'ch4_03',
    enter:function(E){ this.s={a:1}; E.setOn([]);
      E.controls('<div class="ctrl"><label>a (b=4 고정)</label><input type="range" id="aa" min="0.5" max="8" step="0.5" value="1"><output id="aao">1</output></div>');
      var self=this; E.bind('#aa','input',function(e){ self.s.a=+e.target.value; document.getElementById('aao').textContent=(+e.target.value); E.blip(440,0.1); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, a=this.s.a, b=4, am=(a+b)/2, gm=Math.sqrt(a*b), cx=E.W/2, base=E.H*0.7, unit=22;
      function bar(x,h,col,lab,val){ ctx.fillStyle=col.replace? 'rgba(122,184,255,0.3)':col; ctx.fillStyle=col+'44'; ctx.strokeStyle=col; ctx.lineWidth=2; ctx.fillRect(x-40,base-h*unit,80,h*unit); ctx.strokeRect(x-40,base-h*unit,80,h*unit); ctx.fillStyle=col; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.fillText(lab,x,base+20); ctx.fillText(val.toFixed(2),x,base-h*unit-8); }
      bar(cx-120,am,'#ffb27a','산술평균 (a+b)/2',am);
      bar(cx+120,gm,'#8fe3b5','기하평균 √(ab)',gm);
      ctx.fillStyle=Math.abs(a-b)<0.01?'#8fe3b5':'#cfcdc6'; ctx.font='600 16px sans-serif'; ctx.textAlign='center';
      ctx.fillText(Math.abs(a-b)<0.01?'a=b → 등호 성립!':'(a+b)/2 ≥ √(ab)  항상 산술 ≥ 기하', cx, E.H*0.80);
      E.big('산술평균 ≥ 기하평균 (AM-GM)', '두 양수의 (a+b)/2 ≥ √(ab), 등호는 a=b일 때만! 최솟값 찾기의 강력 도구(예 x+1/x≥2). 반원의 지름·수선으로 기하 증명, 최적화·부등식 증명의 핵심'); }
  },

  // ══════ 내적(ch9_04) ▸ 벡터의 정사영 ══════
  { id:'math_br_proj', branchOf:'ch9_04',
    enter:function(E){ this.s={deg:55}; E.Plot.range(-1,7,-1,5);
      E.controls('<div class="ctrl"><label>a의 방향</label><input type="range" id="pd" min="10" max="80" step="5" value="55"><output id="pdo">55°</output></div>');
      var self=this; E.bind('#pd','input',function(e){ self.s.deg=+e.target.value; document.getElementById('pdo').textContent=e.target.value+'°'; E.blip(440,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, ctx=E.ctx, t=this.s.deg*Math.PI/180, ra=4, ax=ra*Math.cos(t), ay=ra*Math.sin(t), bx=6, by=0; P.axes();
      // b는 x축 방향, a의 b 위로의 정사영 = (a·b/|b|²)b
      var k=(ax*bx+ay*by)/(bx*bx+by*by), px=k*bx, py=k*by;
      function vec(x,y,col,lab){ ctx.strokeStyle=col; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(P.X(0),P.Y(0)); ctx.lineTo(P.X(x),P.Y(y)); ctx.stroke(); ctx.fillStyle=col; ctx.font='600 14px sans-serif'; ctx.fillText(lab,P.X(x)+6,P.Y(y)-4); }
      vec(bx,by,'#8fe3b5','b'); vec(ax,ay,'#7ab8ff','a');
      // 수선
      ctx.strokeStyle='rgba(244,160,192,0.6)'; ctx.lineWidth=1.5; ctx.setLineDash([4,3]); ctx.beginPath(); ctx.moveTo(P.X(ax),P.Y(ay)); ctx.lineTo(P.X(px),P.Y(py)); ctx.stroke(); ctx.setLineDash([]);
      // 정사영
      ctx.strokeStyle='#ffb27a'; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(P.X(0),P.Y(0)); ctx.lineTo(P.X(px),P.Y(py)); ctx.stroke();
      ctx.fillStyle='#ffb27a'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('정사영 길이 = |a|cosθ = '+(ra*Math.cos(t)).toFixed(2), E.W/2, E.H*0.80);
      E.big('정사영 — a를 b 위에 비추기', 'a의 b방향 그림자 = (a·b/|b|²)b, 길이 |a|cosθ. 내적(#60)의 기하 의미! 물리의 일(힘의 성분), 최소제곱법, 그램-슈미트 직교화의 토대'); }
  },

  // ══════ 함수의 극한(ch14_03) ▸ 샌드위치 정리 ══════
  { id:'math_br_squeeze', branchOf:'ch14_03',
    enter:function(E){ E.setOn([]); E.Plot.range(-2,2,-0.1,1.4); },
    draw:function(E){ var P=E.Plot, ctx=E.ctx; P.axes();
      P.curve(function(x){return 1;}, 'rgba(244,160,192,0.7)');                 // 위 h=1
      P.curve(function(x){return Math.cos(x);}, 'rgba(143,227,181,0.7)');       // 아래 g=cosx
      P.curve(function(x){ return Math.abs(x)<0.001?1:Math.sin(x)/x; }, '#ffb27a', 3); // f=sinx/x
      P.dot(0,1,'#ffb27a','(0, 1)');
      ctx.fillStyle='#f4a0c0'; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('h=1', P.X(1.5), P.Y(1.05));
      ctx.fillStyle='#8fe3b5'; ctx.fillText('g=cos x', P.X(1.2), P.Y(Math.cos(1.2))-6);
      ctx.fillStyle='#ffb27a'; ctx.fillText('f = sin x / x', P.X(-1.9), P.Y(0.5));
      E.big('샌드위치 정리:  cos x ≤ sin x/x ≤ 1  →  극한 1', '두 함수 사이에 낀 함수는 양쪽이 같은 값으로 가면 똑같이 그리로! 0/0이던 lim(sinx/x)=1을 이렇게 증명 — 삼각함수 미분((sinx)′=cosx)의 출발점'); }
  },

  // ══════ 조건부확률(ch16_04) ▸ 베이즈 정리 ══════
  { id:'math_br_bayes', branchOf:'ch16_04',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, cx=E.W/2;
      steps(E, [
        {t:'베이즈 정리:  P(A|B) = P(B|A)·P(A) / P(B)', c:'#ffb27a', b:true, fs:20},
        {t:'증거 B로 믿음을 갱신: 사전확률 P(A) → 사후확률 P(A|B)', c:'#7ab8ff', fs:16}
      ], {y0:E.H*0.24, lh:E.H*0.08});
      ctx.fillStyle='#cfcdc6'; ctx.font='15px sans-serif'; ctx.textAlign='center';
      ctx.fillText('예) 유병률 1% 병, 검사 정확도 99%. 양성이면 진짜 병일 확률은?', cx, E.H*0.50);
      ctx.fillStyle='#f4a0c0'; ctx.font='600 18px sans-serif'; ctx.fillText('겨우 ≈ 50%! (직관: 90%+ 라고 착각)', cx, E.H*0.58);
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif';
      ctx.fillText('병 0.99% 양성 + 건강인데 양성(거짓양성) 0.99% → 절반은 거짓양성', cx, E.H*0.66);
      E.big('베이즈 정리 — 증거로 믿음을 갱신', '조건부확률(#95)을 뒤집어 "결과로 원인의 확률"을 구합니다. 드문 병은 양성이어도 실제 확률이 낮은 직관 반전! 의료진단·스팸필터·AI 추론의 심장'); }
  },

  // ══════ 행렬식(ch21_04) ▸ 고유값·고유벡터 (계산) ══════
  { id:'math_br_eigen', branchOf:'ch21_04',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, cx=E.W/2;
      steps(E, [
        {t:'고유값: A v = λ v 를 만족 (변환해도 방향 유지, 22장 #127)', c:'#cfcdc6', fs:16},
        {t:'(A − λI) v = 0,  v≠0 이려면  det(A − λI) = 0', c:'#7ab8ff', b:true},
        {t:'예) A = [[2,1],[1,2]] → (2−λ)² − 1 = 0', c:'#cfcdc6'},
        {t:'→ λ = 3  또는  λ = 1  (특성방정식의 해)', c:'#ffb27a', b:true, fs:19},
        {t:'고유벡터: λ=3 → (1,1) 방향,  λ=1 → (1,−1) 방향', c:'#8fe3b5', b:true}
      ], {y0:E.H*0.26, lh:E.H*0.085});
      E.big('고유값·고유벡터 구하기', 'det(A−λI)=0 (특성방정식)으로 고유값 λ를, 각 λ로 고유벡터를 구합니다. 행렬식(#121)이 "변하지 않는 축(22장)"을 찾는 열쇠! PCA·구글 페이지랭크·양자역학·진동 해석'); }
  },

  // ══════ 극형식(ch10_03) ▸ 오일러 공식 ══════
  { id:'math_br_euler', branchOf:'ch10_03',
    enter:function(E){ this.s={deg:60}; E.Plot.range(-2.2,2.2,-1.5,1.5);
      E.controls('<div class="ctrl"><label>θ</label><input type="range" id="eu" min="0" max="180" step="15" value="60"><output id="euo">60°</output></div>');
      var self=this; E.bind('#eu','input',function(e){ self.s.deg=+e.target.value; document.getElementById('euo').textContent=e.target.value+'°'; E.blip(440,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, ctx=E.ctx, t=this.s.deg*Math.PI/180; P.axes();
      var g=P.geom(), sx=g.w/(P.xmax-P.xmin), sy=g.h/(P.ymax-P.ymin);
      ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.ellipse(P.X(0),P.Y(0),sx,sy,0,0,Math.PI*2); ctx.stroke();
      var x=Math.cos(t),y=Math.sin(t);
      ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(P.X(0),P.Y(0)); ctx.lineTo(P.X(x),P.Y(y)); ctx.stroke();
      P.dot(x,y,'#ffb27a','e^(iθ)');
      ctx.fillStyle='#8fe3b5'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('= (cos'+this.s.deg+'°, sin'+this.s.deg+'°)', E.W/2, E.H*0.16);
      if(this.s.deg===180){ ctx.fillStyle='#f4a0c0'; ctx.font='600 16px sans-serif'; ctx.fillText('θ=π → e^(iπ) = −1 → e^(iπ) + 1 = 0  ★', E.W/2, E.H*0.82); }
      E.big('오일러 공식:  e^(iθ) = cos θ + i sin θ', '지수·삼각·복소수를 하나로 묶는 마법! 복소수 극형식(#64)의 정수. θ=π면 e^(iπ)+1=0 — 수학에서 가장 아름다운 등식(5대 상수 e·i·π·1·0). 드무아브르·FFT가 여기서'); }
  },

  // ══════ 함수란(ch5_01) ▸ 합성함수와 역함수 ══════
  { id:'math_br_compinv', branchOf:'ch5_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, cy=E.H*0.36;
      function box(cx,t,sub,col){ var w=E.W*0.13,h=58; ctx.fillStyle='rgba(122,184,255,0.08)'; ctx.strokeStyle=col; ctx.lineWidth=2; if(ctx.roundRect){ctx.beginPath();ctx.roundRect(cx-w/2,cy-h/2,w,h,12);ctx.fill();ctx.stroke();}else ctx.strokeRect(cx-w/2,cy-h/2,w,h); ctx.fillStyle=col; ctx.font='600 16px sans-serif'; ctx.textAlign='center'; ctx.fillText(t,cx,cy-2); ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif'; ctx.fillText(sub,cx,cy+18); }
      ctx.fillStyle='#ffb27a'; ctx.font='600 16px sans-serif'; ctx.textAlign='center'; ctx.fillText('합성함수 f∘g : g를 먼저, f를 나중에', E.W/2, E.H*0.20);
      box(E.W*0.2,'x','입력','#cfcdc6'); box(E.W*0.42,'g','×2','#8fe3b5'); box(E.W*0.64,'f','+1','#7ab8ff'); box(E.W*0.84,'f(g(x))','=2x+1','#ffb27a');
      AV_arrow(ctx,E.W*0.27,cy,E.W*0.355,cy); AV_arrow(ctx,E.W*0.49,cy,E.W*0.575,cy); AV_arrow(ctx,E.W*0.71,cy,E.W*0.775,cy);
      ctx.fillStyle='#8fe3b5'; ctx.font='14px sans-serif'; ctx.textAlign='center';
      ctx.fillText('역함수 f⁻¹ : f가 한 일을 거꾸로 되돌림 (y=x에 대칭, 7장 로그-지수!)', E.W/2, E.H*0.62);
      E.big('합성함수 f∘g & 역함수 f⁻¹', '함수를 이어 붙이면 합성(g→f), 거꾸로 되돌리면 역함수! 역함수 그래프는 y=x 대칭(7장 로그=지수 역함수). 연쇄법칙(#100.1)·암복호화가 이 구조입니다'); }
  },

  // ══════ 평행과 수직(ch6_04) ▸ 점과 직선 사이의 거리 ══════
  { id:'math_br_ptline', branchOf:'ch6_04',
    enter:function(E){ this.s={px:1,py:3}; E.Plot.range(-3,5,-2,5);
      E.controls('<div class="ctrl"><label>점 x</label><input type="range" id="qx" min="-2" max="4" step="1" value="1"><output id="qxo">1</output><label style="margin-left:14px">점 y</label><input type="range" id="qy" min="-1" max="4" step="1" value="3"><output id="qyo">3</output></div>');
      var self=this; E.bind('#qx','input',function(e){ self.s.px=+e.target.value; document.getElementById('qxo').textContent=e.target.value; E.blip(440,0.1); });
      E.bind('#qy','input',function(e){ self.s.py=+e.target.value; document.getElementById('qyo').textContent=e.target.value; E.blip(420,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, ctx=E.ctx, px=this.s.px, py=this.s.py; P.axes();
      // 직선 x - y + 1 = 0  (y = x+1), a=1,b=-1,c=1
      P.curve(function(x){return x+1;}, '#7ab8ff');
      // 수선의 발
      var a=1,b=-1,c=1, t=(a*px+b*py+c)/(a*a+b*b), fx=px-a*t, fy=py-b*t, d=Math.abs(a*px+b*py+c)/Math.sqrt(a*a+b*b);
      ctx.strokeStyle='rgba(244,160,192,0.7)'; ctx.lineWidth=2; ctx.setLineDash([4,3]); ctx.beginPath(); ctx.moveTo(P.X(px),P.Y(py)); ctx.lineTo(P.X(fx),P.Y(fy)); ctx.stroke(); ctx.setLineDash([]);
      P.dot(px,py,'#ffb27a','P('+px+','+py+')');
      ctx.fillStyle='#8fe3b5'; ctx.font='14px sans-serif'; ctx.textAlign='center'; ctx.fillText('거리 = |1·'+px+' −1·'+py+' +1| / √2 = '+d.toFixed(2), E.W/2, E.H*0.80);
      E.big('점과 직선 사이 거리 = |ax₀+by₀+c|/√(a²+b²)', '점에서 직선까지 가장 짧은(수직) 거리 공식. 직선 ax+by+c=0과 점 (x₀,y₀). 정사영(#60.1)·법선벡터로 유도. 충돌·최적화·회귀의 기본'); }
  },

  // ══════ 포물선(ch12_01) ▸ 반사 성질 ══════
  { id:'math_br_parabref', branchOf:'ch12_01',
    enter:function(E){ E.setOn([]); E.Plot.range(-4,4,-0.5,6); },
    draw:function(E){ var P=E.Plot, ctx=E.ctx; P.axes();
      P.curve(function(x){return x*x/4;}, '#7ab8ff'); // 초점 (0,1)
      P.dot(0,1,'#ffb27a','초점 F');
      // 평행 광선(아래로) → 포물선 → 초점
      [-3,-2,-1,1,2,3].forEach(function(x0){ var y0=x0*x0/4;
        ctx.strokeStyle='rgba(143,227,181,0.6)'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.moveTo(P.X(x0),P.Y(6)); ctx.lineTo(P.X(x0),P.Y(y0)); ctx.stroke(); // 수직 입사
        ctx.strokeStyle='rgba(255,178,122,0.7)'; ctx.beginPath(); ctx.moveTo(P.X(x0),P.Y(y0)); ctx.lineTo(P.X(0),P.Y(1)); ctx.stroke(); }); // 초점으로 반사
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('축에 평행한 빛(초록) → 포물면 반사 → 모두 초점 F로(주황)', E.W/2, E.H*0.82);
      E.big('포물선의 반사 성질 — 빛을 한 점에', '축에 평행하게 들어온 모든 빛·전파가 반사되면 정확히 초점에 모입니다! 위성 안테나·반사망원경·자동차 헤드라이트(거꾸로: 초점 광원→평행빔)의 원리. 포물선 정의(초점·준선, #72)의 선물'); }
  },

  // ══════ 순열(ch15_02) ▸ 비둘기집 원리 ══════
  { id:'math_br_pigeon', branchOf:'ch15_02',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, holes=4, hw=90, gap=24, total=holes*hw+(holes-1)*gap, x0=E.W/2-total/2, y=E.H*0.5;
      for(var i=0;i<holes;i++){ var x=x0+i*(hw+gap);
        ctx.fillStyle='rgba(122,184,255,0.08)'; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2; ctx.fillRect(x,y,hw,70); ctx.strokeRect(x,y,hw,70);
        ctx.fillStyle='#6f6e7a'; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('상자 '+(i+1),x+hw/2,y+88); }
      // 비둘기 5마리: 상자1에 2마리
      var pigeons=[[0,0.3],[0,0.7],[1,0.5],[2,0.5],[3,0.5]];
      pigeons.forEach(function(p){ var x=x0+p[0]*(hw+gap)+hw*p[1], on=(p[0]===0); ctx.font='26px sans-serif'; ctx.textAlign='center'; ctx.fillText('🐦',x,y+44); });
      ctx.fillStyle='#ffb27a'; ctx.font='600 15px sans-serif'; ctx.textAlign='center'; ctx.fillText('비둘기 5 > 상자 4 → 적어도 한 상자엔 2마리 이상!', E.W/2, E.H*0.30);
      E.big('비둘기집 원리 — 너무 당연해서 강력한', 'n+1마리를 n개 상자에 넣으면 반드시 한 상자엔 2마리 이상. 너무 뻔하지만 강력한 증명 도구! 예) 서울에 머리카락 수 같은 두 사람 존재, 생일 같은 사람(15장 확률의 생일문제). 존재성 증명의 마법'); }
  },

  // ══════ 평균값정리(ch18_01) ▸ 뉴턴법 ══════
  { id:'math_br_newton', branchOf:'ch18_01',
    enter:function(E){ this.s={step:1}; E.Plot.range(-0.5,3,-3,7);
      E.controls('<div class="ctrl"><label>반복 횟수</label><input type="range" id="nt" min="1" max="5" step="1" value="1"><output id="nto">1</output></div>');
      var self=this; E.bind('#nt','input',function(e){ self.s.step=+e.target.value; document.getElementById('nto').textContent=e.target.value; E.blip(440,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, ctx=E.ctx, k=this.s.step; P.axes();
      function f(x){return x*x-2;} function df(x){return 2*x;}
      P.curve(f, '#7ab8ff');
      P.dot(Math.sqrt(2),0,'rgba(143,227,181,0.5)','√2');
      var x=2; // x0
      for(var i=0;i<k;i++){ var fx=f(x), slope=df(x), xn=x-fx/slope;
        // 접선
        ctx.strokeStyle='rgba(255,178,122,0.6)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(P.X(x),P.Y(fx)); ctx.lineTo(P.X(xn),P.Y(0)); ctx.stroke();
        ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(P.X(x),P.Y(fx)); ctx.lineTo(P.X(x),P.Y(0)); ctx.stroke(); ctx.setLineDash([]);
        P.dot(x,fx,'#ffb27a'); x=xn; }
      P.dot(x,0,'#ffb27a','x'+k+'≈'+x.toFixed(3));
      E.big('뉴턴법:  xₙ₊₁ = xₙ − f(xₙ)/f′(xₙ)  →  '+x.toFixed(4), '방정식 f(x)=0의 근을 접선(#102)으로 빠르게! 접선이 x축과 만나는 점을 새 추정값으로 반복. √2를 몇 번 만에 정밀하게 — 컴퓨터의 √·나눗셈 계산법'); }
  },

  // ══════ 두 곡선 사이 넓이(ch20_01) ▸ 적분의 평균값 정리 ══════
  { id:'math_br_intmean', branchOf:'ch20_01',
    enter:function(E){ E.setOn([]); E.Plot.range(-0.5,3.5,-0.5,5); },
    draw:function(E){ var P=E.Plot, ctx=E.ctx, a=0,b=3; P.axes();
      function f(x){return 0.4*x*x+0.5;}
      var y0=P.Y(0);
      // 곡선 아래 넓이
      ctx.fillStyle='rgba(122,184,255,0.18)'; ctx.beginPath(); ctx.moveTo(P.X(a),y0); for(var i=0;i<=60;i++){var t=a+(b-a)*i/60;ctx.lineTo(P.X(t),P.Y(f(t)));} ctx.lineTo(P.X(b),y0); ctx.closePath(); ctx.fill();
      // 평균 높이 직사각형
      var avg=0,N=200; for(var j=0;j<N;j++){avg+=f(a+(b-a)*(j+0.5)/N);} avg/=N;
      ctx.strokeStyle='#ffb27a'; ctx.lineWidth=2; ctx.setLineDash([5,3]); ctx.strokeRect(P.X(a),P.Y(avg),P.X(b)-P.X(a),y0-P.Y(avg)); ctx.setLineDash([]);
      P.curve(f, '#7ab8ff');
      ctx.fillStyle='#ffb27a'; ctx.font='14px sans-serif'; ctx.textAlign='center'; ctx.fillText('평균 높이 f(c) = '+avg.toFixed(2)+' (직사각형 넓이 = 곡선 아래 넓이)', E.W/2, E.H*0.82);
      E.big('적분의 평균값 정리', '곡선 아래 넓이를 같은 밑변의 직사각형으로 바꾸면 그 높이가 함수의 "평균값" f(c)=(1/(b−a))∫f. 그 평균과 같아지는 점 c가 반드시 존재(연속이면). 평균속도·평균기온의 적분판'); }
  },

  // ══════ 거듭제곱 주기(ch23_04) ▸ 페르마 소정리 ══════
  { id:'math_br_fermat', branchOf:'ch23_04',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, cx=E.W/2;
      steps(E, [
        {t:'페르마 소정리:  p가 소수이고 a가 p의 배수가 아니면', c:'#cfcdc6', fs:16},
        {t:'a^(p−1) ≡ 1  (mod p)', c:'#ffb27a', b:true, fs:24},
        {t:'예) p=7, a=2:  2⁶ = 64 = 7×9 + 1  →  64 ≡ 1 (mod 7) ✓', c:'#7ab8ff'},
        {t:'활용: 거대한 거듭제곱의 나머지를 한순간에', c:'#8fe3b5'},
        {t:'→ RSA 복호화(#10.2)·소수 판정의 핵심 정리', c:'#9b99a3', fs:15}
      ], {y0:E.H*0.28, lh:E.H*0.09});
      E.big('페르마 소정리 — 합동의 황금률', '소수 p에 대해 a^(p−1)≡1 (mod p)! #84 거듭제곱 주기의 이유를 설명하는 정리. RSA가 cᵈ≡m으로 복원되는 근거이자, 빠른 소수 판정(밀러-라빈)의 토대 — 현대 암호의 수학적 심장'); }
  },

  // ══════ 회전변환(ch22_01) ▸ 회전행렬의 합성 ══════
  { id:'math_br_rotcompose', branchOf:'ch22_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ steps(E, [
      {t:'R(α)·R(β) = R(α+β)  — 두 회전을 이으면 각이 더해진다', c:'#ffb27a', b:true, fs:19},
      {t:'행렬 곱 [[cosα,−sinα],[sinα,cosα]] · [[cosβ,−sinβ],[sinβ,cosβ]]', c:'#cfcdc6', fs:15},
      {t:'(1,1) 성분: cosα cosβ − sinα sinβ = cos(α+β)', c:'#7ab8ff'},
      {t:'(2,1) 성분: sinα cosβ + cosα sinβ = sin(α+β)', c:'#7ab8ff'},
      {t:'= [[cos(α+β),−sin(α+β)],[…]]  =  R(α+β)', c:'#8fe3b5', b:true, fs:18},
      {t:'★행렬 곱셈을 전개하면 8장 덧셈정리(#55)가 튀어나온다!', c:'#f4a0c0', fs:15}
    ], {y0:E.H*0.26, lh:E.H*0.085});
      E.big('회전의 합성 = 각의 덧셈', '두 회전행렬을 곱하면 회전각이 더해진 회전행렬! 그 곱을 전개하면 삼각함수 덧셈정리(#55)가 그대로 나옵니다. 기하(회전)·대수(행렬)·삼각(덧셈정리)·복소수(#65)가 한 사실의 네 얼굴'); }
  },

  // ══════ 실수 비가산(ch24_04) ▸ 칸토어의 정리(무한의 위계) ══════
  { id:'math_br_cantor', branchOf:'ch24_04',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, cx=E.W/2;
      steps(E, [
        {t:'칸토어의 정리:  |P(A)| > |A|  (멱집합은 항상 더 크다)', c:'#ffb27a', b:true, fs:19},
        {t:'어떤 집합이든 그 부분집합 전체의 모임이 더 크다 (대각선 논법)', c:'#cfcdc6', fs:15}
      ], {y0:E.H*0.24, lh:E.H*0.07});
      // 무한의 위계
      ctx.font='600 17px sans-serif'; ctx.textAlign='center';
      ctx.fillStyle='#7ab8ff'; ctx.fillText('ℵ₀  <  𝔠 = 2^ℵ₀  <  2^𝔠  <  …', cx, E.H*0.50);
      ctx.fillStyle='#9b99a3'; ctx.font='14px sans-serif';
      ctx.fillText('자연수 < 실수 < 실수의 부분집합들 < … 끝없이 큰 무한들', cx, E.H*0.58);
      ctx.fillStyle='#f4a0c0'; ctx.font='13px sans-serif';
      ctx.fillText('연속체 가설: ℵ₀와 𝔠 사이에 다른 무한이 있는가? → "증명도 반증도 불가"(괴델·코언)', cx, E.H*0.68);
      E.big('칸토어의 정리 — 무한에도 끝없는 위계', '멱집합 P(A)는 늘 A보다 크다(|P(A)|=2^|A|>|A|). 그래서 무한은 하나가 아니라 ℵ₀<𝔠<2^𝔠<… 끝없이 큰 무한의 사다리! 실수 비가산(#135)의 일반화 — 수학에 "가장 큰 무한"은 없습니다'); }
  },

  // ══════ 연속의 엄밀한 정의(ch25_03) ▸ 코시 수열·완비성 ══════
  { id:'math_br_cauchy', branchOf:'ch25_03',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ steps(E, [
      {t:'코시 수열: 항들이 서로 한없이 가까워지는 수열', c:'#ffb27a', b:true, fs:18},
      {t:'(∀ε>0, 충분히 뒤의 두 항 거리 < ε — 극한값을 몰라도 판정!)', c:'#9b99a3', fs:14},
      {t:'실수의 완비성: 모든 코시 수열은 실수 안에서 수렴한다', c:'#7ab8ff', b:true},
      {t:'유리수엔 "구멍"이: √2로 가는 코시 수열이 유리수 안엔 극한이 없음', c:'#f4a0c0'},
      {t:'→ 실수 = 유리수의 구멍을 메워 완비하게 만든 수 체계', c:'#8fe3b5', b:true, fs:17}
    ], {y0:E.H*0.28, lh:E.H*0.09});
      E.big('코시 수열 & 실수의 완비성', '극한값을 미리 몰라도 "항들이 서로 가까워지면" 수렴을 판정(코시). ★실수는 코시 수열이 항상 수렴하는 "완비"한 체계 — 1장 √2(#5)가 만든 유리수의 구멍을 메운 결과. 미적분이 실수 위에서만 안전한 이유'); }
  },

  // ══════ 정규분포(ch26_03) ▸ 기댓값과 분산 ══════
  { id:'math_br_expvar', branchOf:'ch26_03',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, cx=E.W/2, vals=[1,2,3,4,5,6], baseY=E.H*0.6, bw=54, gap=16, total=6*bw+5*gap, x0=cx-total/2, h=E.H*0.16;
      // 주사위 균등분포 막대
      for(var i=0;i<6;i++){ var x=x0+i*(bw+gap); ctx.fillStyle='rgba(122,184,255,0.3)'; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=1.5; ctx.fillRect(x,baseY-h,bw,h); ctx.strokeRect(x,baseY-h,bw,h);
        ctx.fillStyle='#dfeefb'; ctx.font='600 16px sans-serif'; ctx.textAlign='center'; ctx.fillText(vals[i],x+bw/2,baseY+20); ctx.fillStyle='#6f6e7a'; ctx.font='11px sans-serif'; ctx.fillText('1/6',x+bw/2,baseY-h-8); }
      // 평균선
      var mx=x0+3*(bw+gap)-gap/2; ctx.strokeStyle='#ffb27a'; ctx.lineWidth=2; ctx.setLineDash([5,4]); ctx.beginPath(); ctx.moveTo(mx,baseY-h-20); ctx.lineTo(mx,baseY+4); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='#ffb27a'; ctx.font='13px sans-serif'; ctx.fillText('평균 μ = 3.5', mx, baseY-h-26);
      ctx.fillStyle='#8fe3b5'; ctx.font='600 15px sans-serif'; ctx.textAlign='center';
      ctx.fillText('E[X] = Σ x·p(x) = 3.5   ·   분산 Var = E[(X−μ)²] ≈ 2.92', cx, E.H*0.78);
      E.big('기댓값과 분산 — 분포의 중심과 퍼짐', '기댓값 E[X]=Σx·p(x)는 "평균적으로 기대되는 값"(무게중심), 분산은 평균에서 얼마나 퍼졌는지. 정규분포(#141)는 (μ, σ²)로 완전히 결정! 통계·투자위험·머신러닝의 기본 측도'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);

  // 화살표 헬퍼(합성함수 도식용)
  function AV_arrow(ctx,x1,y,x2,y2){ y2=y2||y; ctx.strokeStyle='#9b99a3'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x1,y); ctx.lineTo(x2,y2); ctx.stroke(); ctx.fillStyle='#9b99a3'; ctx.beginPath(); ctx.moveTo(x2,y2); ctx.lineTo(x2-9,y2-5); ctx.lineTo(x2-9,y2+5); ctx.fill(); }
})();
