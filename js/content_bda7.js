/* 빅데이터 분석 제7장 — 통계 분석 (분포·기초통계량·표준오차·카이제곱·가설검정)
   동작(behavior)만. 텍스트=content/bda7.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 화면의 모든 수(확률·평균·분위수·표준오차·χ²·t·p값)는 JS로 실제 계산(하드코딩 금지).
   확률은 수치 적분(사다리꼴 누적표·심프슨), p값은 분포 밀도의 수치 적분(랜초스 lgamma).
   난수 금지 — 표본은 역변환(분위수 함수) 격자·고정 LCG(Park–Miller)로 결정적으로 추출. */
(function(){
  var ROSE='#ff7ab8', GRN='#7ee0b0', BLU='#7ab8ff', GLD='#ffd27a', DIM='#9b99a3', RED='#f0888a', TXT='#eadfe8';

  function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  // 등폭 코드 패널: lines=[{t,hl?,dim?}|문자열]. hl 토큰만 로즈 강조. 반환=패널 하단 y.
  function codePanel(E, x, y, w, lines, title, actLine){
    var ctx=E.ctx, lh=21, pad=14, top=y, n=lines.length, ht=n*lh+pad*2+(title?26:0);
    ctx.fillStyle='rgba(255,255,255,0.035)'; ctx.strokeStyle='rgba(255,122,184,0.30)'; ctx.lineWidth=1;
    roundRect(ctx,x,top,w,ht,10); ctx.fill(); ctx.stroke();
    var cy=top+pad+(title?26:0);
    if(title){ ctx.fillStyle=ROSE; ctx.font='600 12px ui-monospace,Menlo,monospace'; ctx.textAlign='left'; ctx.fillText(title, x+pad, top+pad+12); }
    ctx.font='13px ui-monospace,Menlo,Consolas,monospace'; ctx.textAlign='left';
    for(var i=0;i<n;i++){
      var L=lines[i], t=(typeof L==='string')?L:L.t, hl=(typeof L==='object')?L.hl:null;
      var ty=cy+i*lh+11;
      if(actLine!=null && i===actLine){ ctx.fillStyle='rgba(255,122,184,0.16)'; ctx.fillRect(x+4, cy+i*lh+1, w-8, lh-2); ctx.fillStyle=ROSE; ctx.fillRect(x+4, cy+i*lh+1, 3, lh-2); }
      if(hl && t.indexOf(hl)>=0){
        var a=t.split(hl), pre=a[0], post=a.slice(1).join(hl);
        ctx.fillStyle=DIM; ctx.fillText(pre, x+pad, ty);
        var wpre=ctx.measureText(pre).width;
        ctx.fillStyle=ROSE; ctx.fillText(hl, x+pad+wpre, ty);
        var whl=ctx.measureText(hl).width;
        ctx.fillStyle=DIM; ctx.fillText(post, x+pad+wpre+whl, ty);
      } else {
        ctx.fillStyle=(L.dim?DIM:'#efe4ea'); ctx.fillText(t, x+pad, ty);
      }
    }
    return top+ht;
  }

  // ── 수치 도구 (골든룰의 심장) ──────────────────────────────
  function simpson(f,a,b,n){ if(n%2)n++; var h=(b-a)/n, s=f(a)+f(b), i;
    for(i=1;i<n;i++) s+=f(a+i*h)*((i%2)?4:2);
    return s*h/3; }

  // 랜초스 근사 lgamma — χ²·t 분포 밀도의 정규화 상수 계산용
  var LG=[676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,
          12.507343278686905,-0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];
  function lgamma(x){
    if(x<0.5) return Math.log(Math.PI/Math.sin(Math.PI*x))-lgamma(1-x);
    x-=1; var a=0.99999999999980993, t=x+7.5;
    for(var i=0;i<8;i++) a+=LG[i]/(x+i+1);
    return 0.5*Math.log(2*Math.PI)+(x+0.5)*Math.log(t)-t+Math.log(a);
  }

  // 표준정규: 누적표(사다리꼴 수치 적분)를 1회 구축 → cdf 보간, ppf 이분 탐색
  var NT=null;
  function normTable(){
    if(NT) return NT;
    var N=1600, z0=-8, dz=16/N, c=[0], z=[z0], s=0, prev=Math.exp(-z0*z0/2)/Math.sqrt(2*Math.PI), i;
    for(i=1;i<=N;i++){ var zz=z0+i*dz, f=Math.exp(-zz*zz/2)/Math.sqrt(2*Math.PI);
      s+=(prev+f)/2*dz; prev=f; c.push(s); z.push(zz); }
    for(i=0;i<=N;i++) c[i]/=s;
    NT={z:z,c:c,N:N,z0:z0,dz:dz}; return NT;
  }
  function cdfZ(t){ var T=normTable(), i=(t-T.z0)/T.dz;
    if(i<=0) return 0; if(i>=T.N) return 1;
    var k=Math.floor(i), fr=i-k; return T.c[k]*(1-fr)+T.c[k+1]*fr; }
  function ppfZ(q){ var T=normTable(), lo=0, hi=T.N;
    while(hi-lo>1){ var m=(lo+hi)>>1; if(T.c[m]<q) lo=m; else hi=m; }
    var c0=T.c[lo], c1=T.c[hi], fr=(q-c0)/((c1-c0)||1e-12);
    return T.z[lo]+fr*T.dz; }

  // χ² 생존함수 p=P(X≥x): 밀도를 심프슨으로 수치 적분
  function chi2sf(x,k){
    var lg=lgamma(k/2);
    function f(t){ return t<=0?0:Math.exp((k/2-1)*Math.log(t)-t/2-(k/2)*Math.LN2-lg); }
    return simpson(f,x,x+140,700);
  }
  // t 분포 생존함수 P(T≥t), t>0: 밀도를 심프슨으로 수치 적분
  function tsf(t,df){
    var lg=lgamma((df+1)/2)-lgamma(df/2)-0.5*Math.log(df*Math.PI);
    function f(x){ return Math.exp(lg-((df+1)/2)*Math.log(1+x*x/df)); }
    return simpson(f,t,t+60,600);
  }

  function mean(a){ var s=0,i; for(i=0;i<a.length;i++) s+=a[i]; return s/a.length; }
  function sd(a,ddof){ var m=mean(a), s=0,i; for(i=0;i<a.length;i++) s+=(a[i]-m)*(a[i]-m);
    return Math.sqrt(s/(a.length-(ddof||0))); }
  function perc(sorted,q){ var pos=(sorted.length-1)*q, k=Math.floor(pos), fr=pos-k;
    return (k+1<sorted.length) ? sorted[k]*(1-fr)+sorted[k+1]*fr : sorted[k]; }

  var scenes = [

  // ══════════ 1. 분포를 다루는 도구 — pdf · cdf · ppf · rvs ══════════
  { id:'bda7_01',
    enter:function(E){ var self=this; this.s={mu:0, sg:1};
      E.controls('<div class="ctrl"><label>평균 µ</label><input type="range" id="b71m" min="-3" max="3" step="0.5" value="0"><output id="b71mo">0.0</output></div>'
                +'<div class="ctrl"><label>표준편차 σ</label><input type="range" id="b71s" min="0.5" max="3" step="0.1" value="1"><output id="b71so">1.0</output></div>');
      E.bind('#b71m','input',function(e){ self.s.mu=+e.target.value; document.getElementById('b71mo').textContent=self.s.mu.toFixed(1); });
      E.bind('#b71s','input',function(e){ self.s.sg=+e.target.value; document.getElementById('b71so').textContent=self.s.sg.toFixed(1); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, mu=s.mu, sg=s.sg, i;
      function pdf(x){ var z=(x-mu)/sg; return Math.exp(-z*z/2)/(sg*Math.sqrt(2*Math.PI)); }
      // ★실계산: 구간확률=심프슨 적분, 분위수=누적표 역탐색, 표본=역변환(결정적)
      var pdf1=pdf(1.0);
      var prob=simpson(pdf,0,2,200);
      var q1=mu+sg*ppfZ(0.25), q3=mu+sg*ppfZ(0.75);
      var visible=simpson(pdf,-6,6,400);
      var smp=[], ssum=0;
      for(i=0;i<60;i++){ var u=(i+0.5)/60, x=mu+sg*ppfZ(u); smp.push(x); ssum+=x; }
      var smean=ssum/60;

      var code=[
        {t:'from scipy import stats', dim:true},
        {t:'X = stats.norm('+mu.toFixed(1)+', '+sg.toFixed(1)+')', hl:'stats.norm'},
        {t:'X.pdf(1.0)   # 밀도(높이)', hl:'.pdf'},
        {t:'X.cdf(2)-X.cdf(0)  # 확률', hl:'.cdf'},
        {t:'X.ppf(0.25)  # 분위수', hl:'.ppf'},
        {t:'X.rvs(60)    # 표본 60개', hl:'.rvs'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.40, code, 'distribution.py', null);

      // 코드 패널 아래: 네 도구의 실계산 결과(codeBot 기준 배치)
      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=BLU;  ctx.fillText('pdf(1.0) = '+pdf1.toFixed(4)+'  (곡선의 높이)', W*0.04, ry);
      ctx.fillStyle=GRN;  ctx.fillText('P(0 ≤ X ≤ 2) = '+prob.toFixed(4)+'  (수치 적분)', W*0.04, ry+19);
      ctx.fillStyle=GLD;  ctx.fillText('ppf(0.25) = '+q1.toFixed(2)+' · ppf(0.75) = '+q3.toFixed(2), W*0.04, ry+38);
      ctx.fillStyle=DIM;  ctx.fillText('표본 60개 평균 = '+smean.toFixed(2)+'  (µ = '+mu.toFixed(1)+')', W*0.04, ry+57);

      // 우측: 정규곡선 + 적분 넓이 + 분위수 + 표본 눈금
      var px0=W*0.47, px1=W*0.965, baseY=248, ysc=200/0.85;
      function PX(x){ return px0+(x+6)/12*(px1-px0); }
      ctx.font='11.5px sans-serif'; ctx.textAlign='left';
      ctx.fillStyle=ROSE; ctx.fillText('― 밀도 pdf', px0, 28);
      ctx.fillStyle=GRN;  ctx.fillText('▨ P(0≤X≤2)', px0+92, 28);
      ctx.fillStyle=GLD;  ctx.fillText('┆ 사분위수 ppf', px0+192, 28);
      ctx.fillStyle=BLU;  ctx.fillText('| 표본 rvs', px0+310, 28);
      // 축
      ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,baseY); ctx.lineTo(px1,baseY); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center';
      for(i=-6;i<=6;i+=2){ ctx.fillText(''+i, PX(i), 262);
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(PX(i),baseY); ctx.lineTo(PX(i),baseY+4); ctx.stroke(); }
      // 적분 영역(0..2) 채우기 — 실제 pdf 값으로 세로선 적층
      ctx.fillStyle='rgba(126,224,176,0.30)';
      ctx.beginPath(); ctx.moveTo(PX(0),baseY);
      for(i=0;i<=60;i++){ var xx=0+2*i/60; ctx.lineTo(PX(xx), baseY-pdf(xx)*ysc); }
      ctx.lineTo(PX(2),baseY); ctx.closePath(); ctx.fill();
      // 곡선
      ctx.strokeStyle=ROSE; ctx.lineWidth=2.5; ctx.beginPath();
      for(i=0;i<=240;i++){ var x2=-6+12*i/240, py=baseY-pdf(x2)*ysc;
        if(i===0) ctx.moveTo(PX(x2),py); else ctx.lineTo(PX(x2),py); }
      ctx.stroke();
      // pdf(1.0) 점
      ctx.fillStyle=BLU; ctx.beginPath(); ctx.arc(PX(1), baseY-pdf1*ysc, 4.5, 0, 7); ctx.fill();
      // 사분위수 점선(곡선 높이까지)
      ctx.strokeStyle=GLD; ctx.lineWidth=1.5; ctx.setLineDash([4,4]);
      var qs=[q1,q3];
      for(i=0;i<2;i++){ if(qs[i]>-6&&qs[i]<6){
        ctx.beginPath(); ctx.moveTo(PX(qs[i]),baseY); ctx.lineTo(PX(qs[i]),baseY-pdf(qs[i])*ysc); ctx.stroke(); } }
      ctx.setLineDash([]);
      // 표본 60개 눈금(역변환 실제 추출) — 축 아래 별도 줄
      ctx.strokeStyle='rgba(122,184,255,0.75)'; ctx.lineWidth=1;
      for(i=0;i<60;i++){ if(smp[i]>-6&&smp[i]<6){
        ctx.beginPath(); ctx.moveTo(PX(smp[i]),268); ctx.lineTo(PX(smp[i]),278); ctx.stroke(); } }
      ctx.fillStyle=BLU; ctx.font='11px sans-serif'; ctx.textAlign='left';
      ctx.fillText('표본 60개 — 분위수 함수로 역변환해 실제 추출한 위치입니다', px0, 294);
      // 판독값
      ctx.fillStyle=GRN; ctx.font='600 15px ui-monospace,Menlo,monospace';
      ctx.fillText('P(0 ≤ X ≤ 2) = '+prob.toFixed(4), px0, 320);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif';
      ctx.fillText('화면 구간의 확률 P(−6 ≤ X ≤ 6) = '+visible.toFixed(4)+' — 곡선 아래 전체 넓이는 1입니다', px0, 342);

      E.tapHint(W/2, H*0.95, '슬라이더로 µ·σ를 바꿔 보세요 — 확률·분위수·표본이 다시 계산됩니다', true);
      E.big('분포를 다루는 도구 — 확률분포의 네 가지 얼굴', '하나의 분포에는 네 개의 손잡이가 있습니다 — 높이를 주는 pdf, 넓이(확률)를 주는 cdf, 그 역함수인 ppf(분위수), 그리고 표본을 뽑는 rvs. 곡선 아래 초록 넓이는 매 프레임 수치 적분으로 계산한 진짜 확률입니다. µ를 밀면 곡선과 확률이 함께 움직이고, σ를 키우면 확률이 낮아지는 걸 확인해 보세요.'); }
  },

  // ══════════ 2. 데이터를 요약하는 수 — 기초 통계량 ══════════
  { id:'bda7_02',
    enter:function(E){ var self=this; this.s={v:120};
      E.controls('<div class="ctrl"><label>마지막 값(이상치)</label><input type="range" id="b72v" min="70" max="250" step="2" value="120"><output id="b72vo">120</output></div>');
      E.bind('#b72v','input',function(e){ self.s.v=+e.target.value; document.getElementById('b72vo').textContent=self.s.v; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var BASE=[52,55,58,60,61,63,64,66,68,70];
      var arr=BASE.concat([s.v]);
      var srt=arr.slice().sort(function(a,b){return a-b;});
      // ★실계산: 평균·중앙값·표준편차·사분위수 전부 이 자리에서 계산
      var m=mean(arr), med=perc(srt,0.5), st=sd(arr,1), Q1=perc(srt,0.25), Q3=perc(srt,0.75);
      // 기준(v=70)과의 비교도 실계산 — 이상치가 각 통계량을 얼마나 끌고 가는가
      var arr0=BASE.concat([70]), srt0=arr0.slice().sort(function(a,b){return a-b;});
      var m0=mean(arr0), med0=perc(srt0,0.5);
      var dMean=m-m0, dMed=med-med0;

      var code=[
        {t:'x = np.array([52, 55, ..., 70,', dim:true},
        {t:'              '+s.v+'])  # 이상치', hl:''+s.v},
        {t:'np.mean(x)', hl:'mean'},
        {t:'np.median(x)', hl:'median'},
        {t:'x.std(ddof=1)', hl:'std'},
        {t:'np.percentile(x, [25, 75])', hl:'percentile'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.40, code, 'summary.py', null);

      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('평균     = '+m.toFixed(2), W*0.04, ry);
      ctx.fillStyle=GRN; ctx.fillText('중앙값   = '+med.toFixed(2), W*0.04, ry+19);
      ctx.fillStyle=TXT; ctx.fillText('표준편차 = '+st.toFixed(2)+' (ddof=1)', W*0.04, ry+38);
      ctx.fillStyle=DIM; ctx.fillText('Q1 = '+Q1.toFixed(2)+' · Q3 = '+Q3.toFixed(2), W*0.04, ry+57);

      // 우측: 수직선 + 상자(Q1~Q3) + 평균/중앙값 마커
      var px0=W*0.47, px1=W*0.965, lo=40, hi=260, axisY=150;
      function PX(x){ return px0+(x-lo)/(hi-lo)*(px1-px0); }
      ctx.font='11.5px sans-serif'; ctx.textAlign='left';
      ctx.fillStyle=BLU; ctx.fillText('● 자료 11개', px0, 28);
      ctx.fillStyle=GLD; ctx.fillText('― 평균(끌려감)', px0+96, 28);
      ctx.fillStyle=GRN; ctx.fillText('― 중앙값(버팀)', px0+212, 28);
      // 축과 눈금
      ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,axisY); ctx.lineTo(px1,axisY); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center';
      for(i=40;i<=260;i+=40){ ctx.fillText(''+i, PX(i), axisY+46);
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(PX(i),axisY); ctx.lineTo(PX(i),axisY+5); ctx.stroke(); }
      // 상자(Q1~Q3, 실계산) — 축 아래
      ctx.fillStyle='rgba(255,122,184,0.16)'; ctx.strokeStyle=ROSE; ctx.lineWidth=1.4;
      ctx.fillRect(PX(Q1), axisY+8, PX(Q3)-PX(Q1), 22); ctx.strokeRect(PX(Q1), axisY+8, PX(Q3)-PX(Q1), 22);
      // 자료 점(축 위)
      for(i=0;i<arr.length;i++){
        var isOut=(i===arr.length-1);
        ctx.fillStyle=isOut?RED:BLU; ctx.beginPath(); ctx.arc(PX(arr[i]), axisY-12, isOut?5:4, 0, 7); ctx.fill();
      }
      ctx.fillStyle=RED; ctx.font='11px sans-serif'; ctx.textAlign='center';
      ctx.fillText('이상치 '+s.v, Math.min(PX(s.v), px1-30), axisY-24);
      // 평균/중앙값 수직 마커(높이를 달리해 라벨 충돌 방지)
      ctx.strokeStyle=GLD; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(PX(m),104); ctx.lineTo(PX(m),axisY+34); ctx.stroke();
      ctx.fillStyle=GLD; ctx.font='600 12px sans-serif';
      ctx.fillText('평균 '+m.toFixed(1), PX(m), 96);
      ctx.strokeStyle=GRN; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(PX(med),120); ctx.lineTo(PX(med),axisY+34); ctx.stroke();
      ctx.fillStyle=GRN; ctx.fillText('중앙값 '+med.toFixed(1), PX(med), 116);
      // 이상치 민감도 비교(기준 v=70 대비, 실계산)
      var by=238;
      ctx.fillStyle=TXT; ctx.font='12.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText('이상치를 70 → '+s.v+'로 끌었을 때 (실측)', px0, by);
      var bw=(px1-px0)*0.55, maxD=Math.max(dMean,1);
      ctx.fillStyle='rgba(255,210,122,0.4)'; ctx.strokeStyle=GLD; ctx.lineWidth=1.2;
      var w1=Math.max(2, dMean/maxD*bw);
      ctx.fillRect(px0+110, by+12, w1, 15); ctx.strokeRect(px0+110, by+12, w1, 15);
      ctx.fillStyle=GLD; ctx.font='12px ui-monospace,Menlo,monospace';
      ctx.fillText('평균 +'+dMean.toFixed(2), px0+118+w1, by+24);
      var w2=Math.max(2, dMed/maxD*bw);
      ctx.fillStyle='rgba(126,224,176,0.4)'; ctx.strokeStyle=GRN;
      ctx.fillRect(px0+110, by+34, w2, 15); ctx.strokeRect(px0+110, by+34, w2, 15);
      ctx.fillStyle=GRN; ctx.fillText('중앙값 +'+dMed.toFixed(2), px0+118+w2, by+46);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif';
      ctx.fillText('값 하나가 평균을 '+dMean.toFixed(1)+' 끌고 가는 동안 중앙값은 '+dMed.toFixed(1)+'만 움직였습니다', px0, by+72);

      E.tapHint(W/2, H*0.95, '슬라이더로 이상치를 끌어 보세요 — 평균은 끌려가고 중앙값은 버팁니다', true);
      E.big('데이터를 요약하는 수 — 기초 통계량', '평균·중앙값·표준편차·사분위수는 데이터라는 긴 목록을 몇 개의 수로 접는 도구입니다. 그런데 대푯값마다 성격이 다르죠 — 슬라이더로 마지막 값 하나를 250까지 끌면, 평균은 크게 끌려가지만 중앙값은 거의 버팁니다. 소득·집값처럼 한쪽 꼬리가 긴 데이터에서 중앙값을 쓰는 이유가 바로 이것입니다.'); }
  },

  // ══════════ 3. 표본이 모집단을 말하다 — 표준오차와 1/√n ══════════
  { id:'bda7_03',
    enter:function(E){ var self=this; this.s={n:9};
      E.controls('<div class="ctrl"><label>표본 크기 n</label><input type="range" id="b73n" min="4" max="100" step="1" value="9"><output id="b73no">9</output></div>');
      E.bind('#b73n','input',function(e){ self.s.n=+e.target.value; document.getElementById('b73no').textContent=self.s.n; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, n=s.n, i, j;
      // 모집단 240명(키): 분위수 격자 역변환으로 결정적 생성 — 정규 모양의 고정 데이터
      var POP=[], NPOP=240;
      for(i=0;i<NPOP;i++) POP.push(170+8*ppfZ((i+0.5)/NPOP));
      var pmu=mean(POP), psd=sd(POP,0);
      // ★표본 60벌: Park–Miller LCG(고정 시드) 복원 추출 → 표본평균 60개 실계산
      var M=60, means=[], r=48271;
      for(j=0;j<M;j++){ var sum=0;
        for(i=0;i<n;i++){ r=(r*48271)%2147483647; sum+=POP[r%NPOP]; }
        means.push(sum/n); }
      var seMeas=sd(means,1), seTh=psd/Math.sqrt(n);

      var code=[
        {t:'n = '+n, hl:''+n},
        {t:'ms = [rng.choice(pop, n).mean()', hl:'.mean()'},
        {t:'      for _ in range(60)]', dim:true},
        {t:'np.std(ms, ddof=1)   # 실측 SE', hl:'np.std'},
        {t:'pop.std()/np.sqrt(n) # 이론 SE', hl:'np.sqrt(n)'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.40, code, 'sampling.py', null);

      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=DIM; ctx.fillText('모집단 240명 · µ='+pmu.toFixed(1)+' · σ='+psd.toFixed(2), W*0.04, ry);
      ctx.fillStyle=GRN; ctx.fillText('표본평균 60개의 표준편차 = '+seMeas.toFixed(3)+' (실측)', W*0.04, ry+19);
      ctx.fillStyle=GLD; ctx.fillText('σ/√n = '+psd.toFixed(2)+'/√'+n+' = '+seTh.toFixed(3)+' (이론)', W*0.04, ry+38);
      ctx.fillStyle=TXT; ctx.fillText('실측/이론 = '+(seMeas/seTh).toFixed(2)+'  (≈1이면 이론이 맞습니다)', W*0.04, ry+57);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif';
      ctx.fillText('n을 4배로 키우면 √4=2, 표준오차는 절반이 됩니다', W*0.04, ry+80);

      // 우측: 표본평균 60개의 히스토그램(실계산)
      var px0=W*0.47, px1=W*0.965, lo=164, hi=176, baseY=250;
      function PX(x){ return px0+(x-lo)/(hi-lo)*(px1-px0); }
      ctx.font='11.5px sans-serif'; ctx.textAlign='left';
      ctx.fillStyle=ROSE; ctx.fillText('표본평균 60개의 분포 (n='+n+'일 때, 실제 추출·계산)', px0, 28);
      var NB=24, cnt=[], mx=1;
      for(i=0;i<NB;i++) cnt.push(0);
      for(j=0;j<M;j++){ var b=Math.floor((means[j]-lo)/(hi-lo)*NB); if(b>=0&&b<NB){ cnt[b]++; if(cnt[b]>mx) mx=cnt[b]; } }
      var bw=(px1-px0)/NB;
      for(i=0;i<NB;i++){ if(!cnt[i]) continue;
        var bh=cnt[i]/mx*165;
        ctx.fillStyle='rgba(255,122,184,0.42)'; ctx.strokeStyle=ROSE; ctx.lineWidth=1;
        ctx.fillRect(px0+i*bw+1, baseY-bh, bw-2, bh); ctx.strokeRect(px0+i*bw+1, baseY-bh, bw-2, bh); }
      // 모평균 기준선
      ctx.strokeStyle=GRN; ctx.lineWidth=1.5; ctx.setLineDash([5,4]);
      ctx.beginPath(); ctx.moveTo(PX(pmu),40); ctx.lineTo(PX(pmu),baseY); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=GRN; ctx.font='11px sans-serif'; ctx.textAlign='center';
      ctx.fillText('모평균 µ='+pmu.toFixed(1), PX(pmu), 38);
      // ±SE(실측) 폭 표시 — 히스토그램 위쪽
      var xa=PX(pmu-seMeas), xb=PX(pmu+seMeas);
      ctx.strokeStyle=GLD; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(xa,58); ctx.lineTo(xb,58); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(xa,52); ctx.lineTo(xa,64); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(xb,52); ctx.lineTo(xb,64); ctx.stroke();
      ctx.fillStyle=GLD; ctx.textAlign='left'; ctx.fillText('±SE(실측) = ±'+seMeas.toFixed(3), Math.min(xb+8,px1-140), 62);
      // 축·눈금
      ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,baseY); ctx.lineTo(px1,baseY); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center';
      for(i=lo;i<=hi;i+=2){ ctx.fillText(''+i, PX(i), baseY+16);
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(PX(i),baseY); ctx.lineTo(PX(i),baseY+4); ctx.stroke(); }
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillText('표본 하나하나의 평균은 조금씩 다릅니다 — 그 흩어짐이 표준오차(SE)입니다', px0, baseY+40);
      ctx.fillStyle=TXT;
      ctx.fillText('n을 키우면 산이 좁아집니다: 표본이 클수록 표본평균은 모평균 근처에 몰립니다', px0, baseY+62);

      E.tapHint(W/2, H*0.95, '슬라이더로 n을 키워 보세요 — 산이 좁아지고 SE가 1/√n로 줄어듭니다', true);
      E.big('표본이 모집단을 말하다 — 표본추출과 표준오차', '240명 전체(모집단)를 다 잴 수 없어 n명만 뽑는다면, 표본평균은 뽑을 때마다 조금씩 다릅니다. 그 흩어짐의 크기가 표준오차 — 그리고 놀랍게도 정확히 σ/√n을 따르죠. 화면의 실측값은 60벌의 표본을 실제로 뽑아 계산한 것입니다. n을 키우면 산이 좁아지는 것, 이것이 큰수의 법칙이 눈에 보이는 순간입니다.'); }
  },

  // ══════════ 4. 범주 대 범주 — 분할표와 카이제곱 독립성 검정 ══════════
  { id:'bda7_04',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(340+this.s.step*90,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i, j;
      // 고정 관측도수: 성별 × 운동 빈도 (설문 140명)
      var ROWS=['남','여'], COLS=['안 함','가끔','자주'];
      var O=[[18,30,22],[34,26,10]];
      // ★실계산: 주변합 → 기대도수 → 셀별 기여 → χ² → p(수치 적분)
      var rs=[0,0], cs=[0,0,0], N=0;
      for(i=0;i<2;i++) for(j=0;j<3;j++){ rs[i]+=O[i][j]; cs[j]+=O[i][j]; N+=O[i][j]; }
      var Ex=[], CT=[], chi2=0, maxCT=0;
      for(i=0;i<2;i++){ Ex.push([]); CT.push([]);
        for(j=0;j<3;j++){ var e=rs[i]*cs[j]/N, c=(O[i][j]-e)*(O[i][j]-e)/e;
          Ex[i].push(e); CT[i].push(c); chi2+=c; if(c>maxCT) maxCT=c; } }
      var df=(2-1)*(3-1);
      var p=chi2sf(chi2,df);

      var code=[
        {t:'tab = pd.crosstab(df.성별, df.운동)', hl:'crosstab'},
        {t:'E = expected_freq(tab) # 기대', hl:'expected_freq'},
        {t:'((tab-E)**2 / E).sum() # χ²', hl:'(tab-E)**2 / E'},
        {t:'chi2, p, dof, E = \\', hl:'p'},
        {t:'    chi2_contingency(tab)', hl:'chi2_contingency'},
        {t:'p < 0.05  # 독립이 아닌가?', hl:'p < 0.05'}
      ];
      var act=[0,1,2,5][s.step];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'chi2_test.py', act);

      var caps=['설문 140명을 세어 만든 관측도수 O — 남녀의 운동 습관이 달라 보이나요?',
                '기대도수 E = 행합×열합÷전체 — 성별과 운동이 "독립이라면" 이랬어야 할 수치입니다',
                '셀마다 (O−E)²/E — 기대와 어긋난 만큼 χ²가 쌓입니다(붉을수록 큰 기여)',
                'χ²가 우연으로 나올 확률 p를 계산해 판정합니다'];
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText(caps[s.step], W*0.04, codeBot+26);

      // 우측: 분할표 (행 라벨 52 + 셀 86×3 + 합 60)
      var gx=W*0.47, gy=34, cw=86, rh=34, lw=52;
      ctx.font='600 12px sans-serif'; ctx.textAlign='center';
      ctx.fillStyle='rgba(255,122,184,0.14)'; ctx.fillRect(gx,gy,lw+cw*3+60,rh*0.8);
      ctx.fillStyle=ROSE;
      for(j=0;j<3;j++) ctx.fillText(COLS[j], gx+lw+j*cw+cw/2, gy+18);
      ctx.fillStyle=DIM; ctx.fillText('합', gx+lw+3*cw+30, gy+18);
      for(i=0;i<2;i++){
        var ry=gy+rh*0.8+i*rh;
        ctx.fillStyle=(i%2)?'rgba(255,255,255,0.02)':'rgba(255,255,255,0.05)';
        ctx.fillRect(gx,ry,lw+cw*3+60,rh);
        ctx.fillStyle=ROSE; ctx.font='600 12px sans-serif'; ctx.fillText(ROWS[i], gx+lw/2, ry+rh/2+4);
        for(j=0;j<3;j++){
          var cx=gx+lw+j*cw;
          if(s.step>=2){ // 기여도 열지도
            ctx.fillStyle='rgba(240,136,138,'+(0.10+0.45*CT[i][j]/maxCT).toFixed(3)+')';
            ctx.fillRect(cx+1,ry+1,cw-2,rh-2);
          }
          ctx.fillStyle=TXT; ctx.font='600 13px ui-monospace,Menlo,monospace';
          ctx.fillText(''+O[i][j], cx+cw/2, ry+(s.step>=1?13:rh/2+4));
          if(s.step>=1){ ctx.fillStyle=GLD; ctx.font='11px ui-monospace,Menlo,monospace';
            ctx.fillText('E '+Ex[i][j].toFixed(1), cx+cw/2, ry+27); }
        }
        ctx.fillStyle=DIM; ctx.font='12px ui-monospace,Menlo,monospace';
        ctx.fillText(''+rs[i], gx+lw+3*cw+30, ry+rh/2+4);
      }
      var my=gy+rh*0.8+2*rh;
      ctx.fillStyle=DIM; ctx.font='12px ui-monospace,Menlo,monospace';
      ctx.fillText('합', gx+lw/2, my+15);
      for(j=0;j<3;j++) ctx.fillText(''+cs[j], gx+lw+j*cw+cw/2, my+15);
      ctx.fillText(''+N, gx+lw+3*cw+30, my+15);

      // 아래: 단계별 수식·판정 (표 하단 기준 배치)
      var fy=my+42;
      ctx.textAlign='left';
      if(s.step>=2){
        var terms=[];
        for(i=0;i<2;i++) for(j=0;j<3;j++) terms.push(CT[i][j].toFixed(2));
        ctx.fillStyle=RED; ctx.font='600 12.5px ui-monospace,Menlo,monospace';
        ctx.fillText('χ² = '+terms.join(' + ')+' = '+chi2.toFixed(2), gx, fy);
      }
      if(s.step>=3){
        ctx.fillStyle=GLD; ctx.font='600 13px ui-monospace,Menlo,monospace';
        ctx.fillText('자유도 = (2−1)×(3−1) = '+df+' · p = '+p.toFixed(4)+' (밀도 수치 적분)', gx, fy+24);
        var ok=p<0.05;
        ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.strokeStyle=ok?GRN:RED; ctx.lineWidth=1.5;
        roundRect(ctx, gx, fy+38, W*0.46, 30, 8); ctx.fill(); ctx.stroke();
        ctx.fillStyle=ok?GRN:RED; ctx.font='600 13px sans-serif';
        ctx.fillText(ok?('p = '+p.toFixed(4)+' < 0.05 → 성별과 운동은 독립이 아닙니다 (관련 있음)')
                       :('p = '+p.toFixed(4)+' ≥ 0.05 → 독립이 아니라고 말할 근거가 부족합니다'), gx+14, fy+58);
      } else if(s.step===1){
        ctx.fillStyle=GLD; ctx.font='12.5px sans-serif';
        ctx.fillText('예: 남×안함 E = 70×52÷140 = '+Ex[0][0].toFixed(1)+' — 그런데 관측은 '+O[0][0]+'입니다', gx, fy);
      } else if(s.step===0){
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
        ctx.fillText('남녀 각 70명 — "자주"에서 남 '+O[0][2]+' vs 여 '+O[1][2]+'. 우연일까요?', gx, fy);
      }

      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 (관측 → 기대 → 기여 → 판정)', true);
      E.big('범주 대 범주 — 분할표와 독립성 검정', '성별과 운동 습관, 두 범주형 변수가 관련이 있을까요? 먼저 교차해 세고(분할표), "독립이라면 이랬을" 기대도수를 계산한 뒤, 관측과 기대의 어긋남을 (O−E)²/E로 전부 더한 것이 카이제곱 통계량입니다. 이 값이 우연으로 나올 확률 p가 충분히 작으면 — 두 변수는 독립이 아닙니다. 모든 수치는 화면에서 실제로 계산됩니다.'); }
  },

  // ══════════ 5. 차이가 진짜인가 — t 검정과 p값의 논리 ══════════
  { id:'bda7_05',
    enter:function(E){ var self=this; this.s={d:3};
      E.controls('<div class="ctrl"><label>B반 향상폭 d</label><input type="range" id="b75d" min="0" max="12" step="0.5" value="3"><output id="b75do">3.0</output></div>');
      E.bind('#b75d','input',function(e){ self.s.d=+e.target.value; document.getElementById('b75do').textContent=self.s.d.toFixed(1); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, d=s.d, i;
      // 고정 표본: A반(기존 교육) 12명 · B반(새 교육) 12명 + 향상폭 d
      var A=[72,75,78,80,81,83,84,86,88,90,91,94];
      var B0=[70,73,76,78,80,82,83,85,86,88,90,92], B=[];
      for(i=0;i<12;i++) B.push(B0[i]+d);
      // ★실계산: 합동분산 t 통계량 → p값(t 밀도 수치 적분)
      var nA=12, nB=12, mA=mean(A), mB=mean(B), sA=sd(A,1), sB=sd(B,1);
      var sp2=((nA-1)*sA*sA+(nB-1)*sB*sB)/(nA+nB-2);
      var t=(mB-mA)/Math.sqrt(sp2*(1/nA+1/nB));
      var df=nA+nB-2;
      var p=2*tsf(Math.abs(t),df);
      if(p>1) p=1;

      var code=[
        {t:'a = scores[grp=="A"]  # 기존', dim:true},
        {t:'b = scores[grp=="B"] + '+d.toFixed(1), hl:'+ '+d.toFixed(1)},
        {t:'from scipy import stats', dim:true},
        {t:'t, p = stats.ttest_ind(a, b)', hl:'ttest_ind'},
        {t:'p < 0.05  # 우연이라 보기 어려운가', hl:'p < 0.05'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'ttest.py', null);

      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=BLU; ctx.fillText('A반 평균 = '+mA.toFixed(2)+' (n=12)', W*0.04, ry);
      ctx.fillStyle=ROSE; ctx.fillText('B반 평균 = '+mB.toFixed(2)+' (n=12)', W*0.04, ry+19);
      ctx.fillStyle=GLD; ctx.fillText('t = '+t.toFixed(3)+' · df = '+df, W*0.04, ry+38);
      ctx.fillStyle=(p<0.05)?GRN:RED; ctx.fillText('p = '+p.toFixed(4)+' (양측, 수치 적분)', W*0.04, ry+57);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif';
      ctx.fillText('귀무가설 H₀: 두 반의 평균은 같다 (차이는 우연)', W*0.04, ry+80);

      // 우측: 두 집단 점 띠 + 평균 + p값 게이지
      var px0=W*0.47, px1=W*0.965, lo=60, hi=112;
      function PX(x){ return px0+(x-lo)/(hi-lo)*(px1-px0); }
      ctx.font='11.5px sans-serif'; ctx.textAlign='left';
      ctx.fillStyle=BLU; ctx.fillText('● A반(기존)', px0, 26);
      ctx.fillStyle=ROSE; ctx.fillText('● B반(새 교육, +d)', px0+96, 26);
      // A 띠
      for(i=0;i<12;i++){ ctx.fillStyle='rgba(122,184,255,0.8)'; ctx.beginPath(); ctx.arc(PX(A[i]), 52, 4, 0, 7); ctx.fill(); }
      ctx.strokeStyle=BLU; ctx.lineWidth=2.5;
      ctx.beginPath(); ctx.moveTo(PX(mA),40); ctx.lineTo(PX(mA),64); ctx.stroke();
      // B 띠
      for(i=0;i<12;i++){ ctx.fillStyle='rgba(255,122,184,0.8)'; ctx.beginPath(); ctx.arc(PX(B[i]), 92, 4, 0, 7); ctx.fill(); }
      ctx.strokeStyle=ROSE; ctx.lineWidth=2.5;
      ctx.beginPath(); ctx.moveTo(PX(mB),80); ctx.lineTo(PX(mB),104); ctx.stroke();
      // 평균 차 화살표(두 띠 아래)
      ctx.strokeStyle=GLD; ctx.lineWidth=1.5; ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.moveTo(PX(mA),64); ctx.lineTo(PX(mA),126); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(PX(mB),104); ctx.lineTo(PX(mB),126); ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle=GLD; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(PX(mA),126); ctx.lineTo(PX(mB),126); ctx.stroke();
      ctx.fillStyle=GLD; ctx.font='600 12px ui-monospace,Menlo,monospace'; ctx.textAlign='center';
      ctx.fillText('Δ = '+(mB-mA).toFixed(2), (PX(mA)+PX(mB))/2, 142);
      // 점수 축
      ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,156); ctx.lineTo(px1,156); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif';
      for(i=60;i<=110;i+=10){ ctx.fillText(''+i, PX(i), 172);
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(PX(i),156); ctx.lineTo(PX(i),160); ctx.stroke(); }
      // p값 게이지: −log10(p)를 0~6 트랙에 (α=0.05 문턱 표시)
      var gy2=214, gw=px1-px0, lp=Math.min(6, -Math.log(Math.max(p,1e-6))/Math.LN10), la=-Math.log(0.05)/Math.LN10;
      ctx.fillStyle=TXT; ctx.font='12.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText('p값 게이지 (오른쪽으로 갈수록 "우연이라 보기 어려움")', px0, gy2-10);
      ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(px0,gy2,gw,14);
      ctx.fillStyle=(p<0.05)?'rgba(126,224,176,0.5)':'rgba(240,136,138,0.5)';
      ctx.fillRect(px0,gy2,gw*lp/6,14);
      // α=0.05 문턱
      var ax=px0+gw*la/6;
      ctx.strokeStyle=GLD; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(ax,gy2-4); ctx.lineTo(ax,gy2+18); ctx.stroke();
      ctx.fillStyle=GLD; ctx.font='11px sans-serif';
      ctx.fillText('유의수준 0.05', ax+6, gy2-2);
      ctx.fillStyle=(p<0.05)?GRN:RED; ctx.font='600 13px ui-monospace,Menlo,monospace';
      ctx.fillText('p = '+p.toFixed(4), px0, gy2+34);
      // 판정 박스
      var vy=gy2+48, ok=p<0.05;
      ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.strokeStyle=ok?GRN:RED; ctx.lineWidth=1.5;
      roundRect(ctx, px0, vy, gw, 30, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle=ok?GRN:RED; ctx.font='600 12.5px sans-serif';
      ctx.fillText(ok?'H₀ 기각 — 이 정도 차이가 우연히 나올 확률은 '+ (p*100).toFixed(2)+'%뿐입니다'
                     :'H₀ 기각 불가 — 이 차이는 우연으로도 충분히 나올 수 있습니다 (p='+p.toFixed(3)+')', px0+14, vy+20);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif';
      ctx.fillText('주의: p는 "H₀가 참일 때 이런 데이터가 나올 확률"이지, "가설이 참일 확률"이 아닙니다', px0, vy+52);

      E.tapHint(W/2, H*0.95, '슬라이더로 차이 d를 벌려 보세요 — t와 p가 실제로 다시 계산됩니다', true);
      E.big('차이가 진짜인가 — 가설검정의 논리', '새 교육을 받은 B반이 A반보다 점수가 높습니다. 그런데 이 차이, 진짜일까요 우연일까요? 가설검정은 "차이가 없다"는 귀무가설을 일단 참이라 두고, 그때 이런 차이가 나올 확률(p값)을 계산합니다. 슬라이더로 d를 벌리면 t가 커지고 p가 곤두박질치는 것 — 전부 실제 계산입니다. p가 0.05 아래로 내려가는 순간을 찾아보세요.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
