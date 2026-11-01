/* 주제: 평균의 표준오차는 왜 n 이 아니라 √n 으로 나누는가 */
AdpTopics.add('why-sqrt-n', {
  title: '평균의 흔들림은 왜 n 이 아니라 √n 으로 나누나',
  tags: ['검정 기본', '분포', '표준오차'],
  html: (function(){
    /* 이 팝업의 숫자는 전부 여기서 계산합니다(고정 씨앗이라 열 때마다 같은 값). */
    function rng(seed){ var a=seed>>>0; return function(){ a|=0; a=a+0x6D2B79F5|0;
      var t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
    var rnd=rng(20261101);
    function gauss(){ var u=1-rnd(), v=rnd(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }
    function f(v,d){ return v.toFixed(d); }

    /* 손계산 가능한 크기: 각 값이 +1 또는 −1 (같은 확률) → 분산 1 */
    var two=[[1,1],[1,-1],[-1,1],[-1,-1]], sums=two.map(function(p){return p[0]+p[1];});
    function sg(v){ return (v<0?'−':' ')+Math.abs(v); }
    var sumVar=sums.reduce(function(a,s){return a+s*s;},0)/sums.length;   /* 평균이 0 이므로 제곱의 평균 */

    /* 실증: 평균 μ=10, 표준편차 σ=2 인 값을 n=4 개씩 뽑아 합과 평균을 2000번 */
    var MU=10, SIG=2, n=4, R=2000, sumArr=[], meanArr=[];
    for(var r=0;r<R;r++){ var s=0; for(var i=0;i<n;i++) s+=MU+SIG*gauss(); sumArr.push(s); meanArr.push(s/n); }
    function sd(a){ var m=a.reduce(function(x,y){return x+y;},0)/a.length;
      return Math.sqrt(a.reduce(function(x,y){return x+(y-m)*(y-m);},0)/(a.length-1)); }
    var sdSum=sd(sumArr), sdMean=sd(meanArr);

    return `
  <p><b>여기서 이런 의문이 드실 겁니다.</b> "평균은 합을 n 으로 나눈 것이니, 흔들림도 n 으로 나누면 되지 않나? 그리고 분자의 s 는 분산이 아니라 표준편차인데, 왜 하필 제곱근(√)이 붙나?" 둘 다 정당한 물음이고, 답은 한 문장에서 나옵니다.</p>
  <div style="background:var(--code);border:1px solid var(--rule);border-radius:9px;padding:.7rem .9rem;margin:.7rem 0"><b>서로 독립인 값을 더하면 합쳐지는 것은 표준편차가 아니라 분산입니다.</b> 이것이 정식 이름입니다 — "독립이면 분산이 더해진다".</div>

  <p><b>1) 아주 작은 손계산으로 확인합니다.</b> 값 하나는 +1 아니면 −1 이고 둘이 나올 확률은 같습니다. 이 값의 분산은 1, 표준편차도 1 입니다. 이런 값 두 개를 서로 상관없이 뽑아 더하면 경우는 네 가지입니다.</p>
  <pre>(+1, +1) → 합 ${sg(sums[0])}
(+1, −1) → 합 ${sg(sums[1])}
(−1, +1) → 합 ${sg(sums[2])}
(−1, −1) → 합 ${sg(sums[3])}
합의 분산 = (${sums[0]*sums[0]} + ${sums[1]*sums[1]} + ${sums[2]*sums[2]} + ${sums[3]*sums[3]}) ÷ 4 = ${f(sumVar,0)}      ← 1 + 1 (분산이 더해졌다)
합의 표준편차 = √${f(sumVar,0)} = ${f(Math.sqrt(sumVar),3)}   ← 1 + 1 = 2 가 아니다</pre>
  <p>합이 0 이 되는 경우(+와 −가 서로 지우는 경우)가 절반이라서, 표준편차가 2 까지 커지지 못합니다. <b>두 오차가 항상 같은 방향이라면 2 이겠지만, 독립이면 일부가 상쇄됩니다.</b></p>

  <p><b>2) 그림으로 보면 직각입니다.</b> 서로 독립인 두 오차는 직각으로 놓인 두 변처럼 합쳐진다고 생각하면 됩니다. 길이 1 인 변 둘이 직각이면 빗변은 √(1² + 1²) = √2 = ${f(Math.SQRT2,3)} 이지 2 가 아닙니다. 이 "직각"은 감을 잡기 위한 비유이고, 정식 이름은 위의 "독립이면 분산이 더해진다"입니다.</p>

  <p><b>3) 같은 값을 n 개로 늘립니다.</b> 표준편차가 σ 인 독립인 값 n 개의 합은 이렇게 됩니다.</p>
  <div style="text-align:center;margin:.6rem 0">
   <math display="block" style="font-size:1.25rem">
    <mtext>합의 분산</mtext><mo>=</mo>
    <msup><mi>σ</mi><mn>2</mn></msup><mo>+</mo><msup><mi>σ</mi><mn>2</mn></msup><mo>+</mo><mo>⋯</mo><mo>+</mo><msup><mi>σ</mi><mn>2</mn></msup>
    <mo>=</mo><mi>n</mi><msup><mi>σ</mi><mn>2</mn></msup></math>
   <math display="block" style="font-size:1.25rem">
    <mtext>합의 표준편차</mtext><mo>=</mo>
    <msqrt><mrow><mi>n</mi><msup><mi>σ</mi><mn>2</mn></msup></mrow></msqrt><mo>=</mo>
    <msqrt><mi>n</mi></msqrt><mo>⋅</mo><mi>σ</mi></math>
  </div>
  <p>n = 4 이면 합의 표준편차는 √4 · σ = <b>2σ</b> 입니다. 4σ 가 아닙니다. 합의 표준편차는 n 에 비례해 커지는 것이 아니라 √n 에 비례해 커집니다.</p>

  <p><b>4) 이제 n 으로 나눕니다.</b> 평균은 합을 n 으로 나눈 것이고, 어떤 수로 나누면 표준편차도 같은 수로 나뉩니다. 합의 표준편차에서 √n 이 이미 생겼으니 그것을 n 으로 나누면 이렇게 됩니다.</p>
  <div style="text-align:center;margin:.6rem 0">
   <math display="block" style="font-size:1.25rem">
    <mtext>평균의 표준편차</mtext><mo>=</mo>
    <mfrac><mrow><msqrt><mi>n</mi></msqrt><mo>⋅</mo><mi>σ</mi></mrow><mi>n</mi></mfrac><mo>=</mo>
    <mfrac><mi>σ</mi><msqrt><mi>n</mi></msqrt></mfrac></math>
  </div>
  <p>그래서 나누는 수는 n 이 아니라 √n 입니다. 분자의 σ 가 표준편차인 것도 이것으로 설명됩니다 — σ/√n 은 분산 σ²/n 에 제곱근을 씌운 것과 같은 수입니다. 같은 값을 분산 단위로 말하면 "분산이 n 분의 1 로 줄어든다"이고, 표준편차 단위로 말하면 "√n 분의 1 로 줄어든다"입니다.</p>

  <p><b>5) 실제로 뽑아서 확인합니다.</b> 평균 ${MU}, 표준편차 σ = ${SIG} 인 값을 ${n} 개씩 뽑아 합과 평균을 구하는 일을 ${R} 번 되풀이했습니다(고정 씨앗).</p>
  <pre>합들의 표준편차         ${f(sdSum,3)}     이론 √${n}·σ = ${f(Math.sqrt(n)*SIG,3)}     (${n}σ = ${f(n*SIG,1)} 이 아니다)
평균들의 표준편차       ${f(sdMean,3)}     이론 σ/√${n} = ${f(SIG/Math.sqrt(n),3)}     (σ/${n} = ${f(SIG/n,2)} 이 아니다)</pre>
  <p>실제로 잰 값이 σ/√n 쪽에 붙습니다. 값 하나의 흔들림이 ${f(SIG,1)} 인데 ${n} 개를 평균 내면 ${f(SIG/Math.sqrt(n),1)} 으로 줄어듭니다. 절반이지 4분의 1 이 아닙니다. <b>그래서 자료를 4배로 늘려야 표준오차가 절반이 됩니다</b> — 정밀도를 두 배로 올리는 값은 비쌉니다.</p>
  <p><b>한 줄로</b> — 독립이면 분산이 더해지고, 분산이 더해지니 합의 표준편차는 √n 으로 자라며, 평균은 그것을 n 으로 나눈 σ/√n 입니다. 관련: [[degrees-of-freedom]]</p>
  `;
  })()
});
