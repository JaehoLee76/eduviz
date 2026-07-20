/* 빅데이터 분석 제9장 — 분류 준비 (탐색 · 전처리 · 평가 설계)
   동작(behavior)만. 텍스트=content/bda9.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 화면의 모든 수(클래스 비율·결측률·표준편차·열 개수·정확도·정밀도·재현율·F1)는
   전부 아래 고정 배열(고객 50명 표본)로부터 draw/build에서 실제 계산(하드코딩 금지).
   난수 금지 — 4장의 잡음-특징 데이터는 Park–Miller LCG(고정 시드)로 결정적 생성. */
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

  // ── 수치 도구 ──────────────────────────────────────────────
  function mean(a){ var s=0,i; for(i=0;i<a.length;i++) s+=a[i]; return s/a.length; }
  function sd(a,ddof){ var m=mean(a), s=0,i; for(i=0;i<a.length;i++) s+=(a[i]-m)*(a[i]-m);
    return Math.sqrt(s/(a.length-(ddof||0))); }
  function median(a){ var s=a.slice().sort(function(x,y){return x-y;}), n=s.length;
    return (n%2) ? s[(n-1)/2] : (s[n/2-1]+s[n/2])/2; }
  function corr(xs,ys){ var n=xs.length, mx=mean(xs), my=mean(ys), sx=0,sy=0,sxy=0,i;
    for(i=0;i<n;i++){ sx+=(xs[i]-mx)*(xs[i]-mx); sy+=(ys[i]-my)*(ys[i]-my); sxy+=(xs[i]-mx)*(ys[i]-my); }
    if(sx===0||sy===0) return 0; return sxy/Math.sqrt(sx*sy); }
  // Park–Miller LCG(결정적) — 4장 잡음-특징 데이터 생성용
  function lcgNext(st){ st.r=(st.r*48271)%2147483647; return st.r/2147483647; }

  // ── 고정 예제 데이터: 고객 50명(가입개월·월요금·나이·요금제·지역·이탈여부) ──
  // 요금제(plan)는 basic<standard<premium 순서가 있고, 지역(region)은 순서가 없다.
  var N=50;
  var TENURE=[1,68,32,40,35,58,49,68,4,62,30,41,63,28,37,24,57,26,71,26,45,16,3,2,15,9,11,69,62,34,40,59,42,66,55,44,39,55,65,64,23,42,48,60,19,21,13,1,36,36];
  var CHARGE=[62.5,77.5,100.2,58.3,33.0,102.4,27.3,64.6,36.1,55.8,110.7,39.4,102.0,84.4,53.7,36.4,115.4,27.0,116.5,118.2,95.6,95.0,31.3,105.1,106.8,101.7,86.3,96.2,24.7,20.7,75.0,31.1,48.1,26.9,72.3,37.6,108.9,37.1,50.4,73.6,29.5,53.3,71.8,107.2,52.3,104.1,90.6,71.1,47.9,75.6];
  var CHARGE_MISS=[1,1,0,0,1,0,1,0,0,0,0,0,0,1,0,0,0,0,0,1,0,1,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0];
  var AGE=[18,69,65,68,43,33,46,55,69,67,22,21,43,63,64,67,47,66,43,42,41,53,19,43,61,57,64,47,57,59,68,30,27,31,56,51,18,30,35,24,65,27,55,51,67,20,53,58,33,30];
  var AGE_MISS=[0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  var PLAN=['standard','basic','basic','standard','basic','standard','standard','premium','basic','basic','premium','standard','premium','basic','standard','premium','standard','premium','standard','basic','premium','standard','premium','basic','premium','standard','premium','premium','standard','basic','premium','basic','basic','basic','premium','basic','premium','standard','basic','basic','premium','standard','premium','basic','premium','basic','standard','basic','premium','standard'];
  var REGION=['광주','부산','부산','서울','대구','광주','광주','광주','부산','부산','서울','대구','대구','광주','부산','광주','서울','서울','대구','서울','대구','부산','대구','부산','서울','대구','광주','서울','광주','부산','서울','부산','부산','부산','광주','광주','부산','부산','서울','서울','서울','부산','광주','광주','대구','부산','대구','광주','부산','대구'];
  var CHURN=[1,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,1,1,0,1,0,1,1,1,0,1,0,0,0,0,1,0,1,0,0,0,0,0,0,1,0,1,0,0,0,0,1,1,0,1];

  var scenes = [

  // ══════════ 1. 모델을 만들기 전에 데이터를 본다 — 탐색 ══════════
  { id:'bda9_01',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*80,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      // ★실계산: 클래스 비율 · 열별 결측률 · 그룹평균 — 전부 고정 배열에서 계산
      var n1=0, missC=0, missA=0;
      for(i=0;i<N;i++){ if(CHURN[i]) n1++; if(CHARGE_MISS[i]) missC++; if(AGE_MISS[i]) missA++; }
      var n0=N-n1, rate1=n1/N, rate0=n0/N;
      var t1=[], t0=[], c1=[], c0=[];
      for(i=0;i<N;i++){
        if(CHURN[i]){ t1.push(TENURE[i]); if(!CHARGE_MISS[i]) c1.push(CHARGE[i]); }
        else { t0.push(TENURE[i]); if(!CHARGE_MISS[i]) c0.push(CHARGE[i]); }
      }
      var mt1=mean(t1), mt0=mean(t0), mc1=mean(c1), mc0=mean(c0);

      var code=[
        "df['churn'].value_counts(",
        "    normalize=True)",
        "df.isna().mean()   # 열별 결측률",
        "df.groupby('churn')[['tenure',",
        "    'charge']].mean()"
      ];
      var act=[0,2,3][s.step];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'explore.py', act);

      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      var caps=['고객 50명 중 몇 명이 떠났을까요 — 먼저 목표변수부터 셉니다',
                '값이 비어있는 열은 어디고, 얼마나 비었을까요',
                '이탈한 사람과 남은 사람, 각 변수의 평균은 다를까요'];
      ctx.fillText(caps[s.step], W*0.04, codeBot+22);

      var px0=W*0.50, px1=W*0.965;
      ctx.font='11.5px sans-serif'; ctx.textAlign='left';

      if(s.step===0){
        // 클래스 균형: 가로 막대(유지 vs 이탈)
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif';
        ctx.fillText('목표변수 churn(이탈여부)의 클래스 균형', px0, 40);
        var by=64, bh=34, bw=(px1-px0)*(n0/N);
        ctx.fillStyle='rgba(122,184,255,0.45)'; ctx.strokeStyle=BLU; ctx.lineWidth=1.3;
        ctx.fillRect(px0,by,bw,bh); ctx.strokeRect(px0,by,bw,bh);
        ctx.fillStyle=BLU; ctx.font='600 12px ui-monospace,Menlo,monospace';
        ctx.fillText('유지(0) '+n0+'명 · '+(rate0*100).toFixed(1)+'%', px0+8, by+22);
        var by2=by+bh+14, bw2=(px1-px0)*(n1/N);
        ctx.fillStyle='rgba(255,122,184,0.45)'; ctx.strokeStyle=ROSE;
        ctx.fillRect(px0,by2,bw2,bh); ctx.strokeRect(px0,by2,bw2,bh);
        ctx.fillStyle=ROSE; ctx.fillText('이탈(1) '+n1+'명 · '+(rate1*100).toFixed(1)+'%', px0+8, by2+22);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('유지가 이탈보다 훨씬 많습니다 — 이런 "불균형"은 5장의 평가에서 중요해집니다', px0, by2+bh+26);
        ctx.fillText('n = '+N+'명 (n0='+n0+', n1='+n1+')', px0, by2+bh+46);
      } else if(s.step===1){
        // 결측 패턴: 열별 결측률 막대
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif';
        ctx.fillText('열(변수)별 결측률', px0, 40);
        var cols=['tenure','charge','age','plan'];
        var rates=[0, missC/N, missA/N, 0];
        var cnts=[0, missC, missA, 0];
        var by0=60, rh=32;
        for(i=0;i<4;i++){
          var yy=by0+i*rh, ww=(px1-px0-70)*rates[i];
          ctx.fillStyle=DIM; ctx.font='12px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
          ctx.fillText(cols[i], px0, yy+13);
          ctx.fillStyle=rates[i]>0?'rgba(255,122,184,0.4)':'rgba(255,255,255,0.08)';
          ctx.strokeStyle=rates[i]>0?ROSE:'rgba(255,255,255,0.3)'; ctx.lineWidth=1.2;
          ctx.fillRect(px0+70,yy,Math.max(2,ww),16); ctx.strokeRect(px0+70,yy,Math.max(2,ww),16);
          ctx.fillStyle=rates[i]>0?ROSE:DIM; ctx.font='11.5px ui-monospace,Menlo,monospace';
          ctx.fillText((rates[i]*100).toFixed(1)+'% ('+cnts[i]+'명)', px0+76+Math.max(2,ww), yy+13);
        }
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('charge가 '+missC+'/'+N+'명, age가 '+missA+'/'+N+'명 비어 있습니다', px0, by0+4*rh+22);
        ctx.fillText('이 비율을 알아야 다음 장면의 대치 전략을 고를 수 있습니다', px0, by0+4*rh+42);
      } else {
        // 변수-목표 관계: tenure vs charge, 그룹평균 비교
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif';
        ctx.fillText('그룹별 평균 — 이탈(1) vs 유지(0)', px0, 40);
        function pair(y,label,v1,v0,unit,maxv){
          ctx.font='12px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
          ctx.fillStyle=DIM; ctx.fillText(label, px0, y-4);
          var bw=(px1-px0-10)*0.5, w1=bw*(v1/maxv), w0=bw*(v0/maxv);
          ctx.fillStyle='rgba(255,122,184,0.45)'; ctx.strokeStyle=ROSE;
          ctx.fillRect(px0,y,w1,16); ctx.strokeRect(px0,y,w1,16);
          ctx.fillStyle=ROSE; ctx.fillText('이탈 '+v1.toFixed(1)+unit, px0+w1+6, y+13);
          ctx.fillStyle='rgba(122,184,255,0.45)'; ctx.strokeStyle=BLU;
          ctx.fillRect(px0,y+22,w0,16); ctx.strokeRect(px0,y+22,w0,16);
          ctx.fillStyle=BLU; ctx.fillText('유지 '+v0.toFixed(1)+unit, px0+w0+6, y+35);
        }
        pair(66,'가입개월(tenure)', mt1, mt0, '개월', 80);
        pair(146,'월요금(charge, 결측 제외)', mc1, mc0, '', 130);
        var gap=Math.abs(mt1-mt0), gap2=Math.abs(mc1-mc0);
        ctx.fillStyle=GRN; ctx.font='600 12.5px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
        ctx.fillText('가입개월 차이 '+gap.toFixed(1)+'개월 — 뚜렷한 신호', px0, 208);
        ctx.fillStyle=DIM; ctx.font='12px ui-monospace,Menlo,monospace';
        ctx.fillText('월요금 차이 '+gap2.toFixed(1)+' — 거의 차이 없음(약한 신호)', px0, 228);
        ctx.fillStyle=TXT; ctx.font='12px sans-serif';
        ctx.fillText('가입 초기에 이탈이 몰려 있다는 뜻 — 여기서 본 것이 뒤의 모든 선택을 좌우합니다', px0, 254);
      }

      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 (클래스 균형 → 결측 → 변수-목표 관계)', true);
      E.big('모델을 만들기 전에 데이터를 본다 — 탐색', '분류 모델을 짜기 전에 반드시 먼저 할 일이 있습니다. 목표변수는 얼마나 치우쳐 있는지, 값은 어디가 얼마나 비어 있는지, 각 변수는 목표와 정말 관련이 있는지 — 이 세 가지를 눈으로 확인하는 것입니다. 화면의 모든 수는 고객 50명의 고정 표본에서 실제로 계산됩니다. 여기서 본 불균형과 결측과 신호의 강약이, 이번 장 나머지 전부의 전제가 됩니다.'); }
  },

  // ══════════ 2. 전처리 — 결측 · 이상치 · 스케일 ══════════
  { id:'bda9_02',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var observed=[], missIdx=[];
      for(i=0;i<N;i++){ if(!CHARGE_MISS[i]) observed.push(CHARGE[i]); else missIdx.push(i); }
      var meanObs=mean(observed), sdObs=sd(observed,1), medObs=median(observed);
      var imputedMean=[], imputedMed=[];
      for(i=0;i<N;i++){
        imputedMean.push(CHARGE_MISS[i]?meanObs:CHARGE[i]);
        imputedMed.push(CHARGE_MISS[i]?medObs:CHARGE[i]);
      }
      var sdMean=sd(imputedMean,1), sdMed=sd(imputedMed,1);
      var churnMiss=0; for(i=0;i<missIdx.length;i++) if(CHURN[missIdx[i]]) churnMiss++;
      var rateMiss=churnMiss/missIdx.length, rateAll=(function(){var s=0,j;for(j=0;j<N;j++)s+=CHURN[j];return s/N;})();

      var OUT=[42,55,48,60,52,58,45,63], OUTX=OUT.concat([420]);
      var mO=mean(OUT), medO=median(OUT), mX=mean(OUTX), medX=median(OUTX);

      var i0=0, i1=30; // 두 고객: 스케일 비교
      var spend=[]; for(i=0;i<N;i++) spend.push(TENURE[i]*(CHARGE_MISS[i]?meanObs:CHARGE[i]));
      var muT=mean(TENURE), sdT=sd(TENURE,1), muS=mean(spend), sdS=sd(spend,1);
      var dRawT=TENURE[i0]-TENURE[i1], dRawS=spend[i0]-spend[i1];
      var distRaw=Math.sqrt(dRawT*dRawT+dRawS*dRawS);
      var pctSpendRaw=(dRawS*dRawS)/(distRaw*distRaw)*100;
      var zT0=(TENURE[i0]-muT)/sdT, zT1=(TENURE[i1]-muT)/sdT, zS0=(spend[i0]-muS)/sdS, zS1=(spend[i1]-muS)/sdS;
      var dZT=zT0-zT1, dZS=zS0-zS1, distZ=Math.sqrt(dZT*dZT+dZS*dZS);
      var pctSpendZ=(dZS*dZS)/(distZ*distZ)*100;

      var code=[
        "x.dropna()                # 제거",
        "x.fillna(x.mean())        # 평균대치",
        "x.fillna(x.median())      # 중앙값대치",
        "df['x_na']=x.isna()       # 지시변수",
        "StandardScaler().fit_transform(X)"
      ];
      var act=[0,3,1,4][s.step];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'preprocess.py', act);

      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      var caps=['비어 있는 값을 무엇으로 채울까요 — 세 가지 방법을 실제로 비교합니다',
                '비어 있다는 사실 자체가 신호일 수도 있습니다',
                '값 하나가 극단적으로 크면 평균과 표준편차는 어떻게 될까요',
                '스케일이 다른 두 변수를 그대로 두면 거리는 한쪽에 지배당합니다'];
      ctx.fillText(caps[s.step], W*0.04, codeBot+22);

      var px0=W*0.50, px1=W*0.965;
      ctx.textAlign='left';

      if(s.step===0){
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif';
        ctx.fillText('charge 결측 '+missIdx.length+'/'+N+'명 — 대치 전략별 결과', px0, 38);
        function row(y,label,nn,m,sdv,col){
          ctx.font='12px ui-monospace,Menlo,monospace';
          ctx.fillStyle=col; ctx.fillText(label+'  n='+nn+'  평균='+m.toFixed(2)+'  표준편차='+sdv.toFixed(2), px0, y);
        }
        row(58,'제거',      observed.length, meanObs, sdObs, BLU);
        row(80,'평균대치',   N, meanObs, sdMean, GLD);
        row(102,'중앙값대치', N, mean(imputedMed), sdMed, GRN);
        ctx.fillStyle=RED; ctx.font='600 12.5px ui-monospace,Menlo,monospace';
        var drop=(sdObs-sdMean)/sdObs*100;
        ctx.fillText('평균대치는 평균은 그대로지만 표준편차가 '+drop.toFixed(1)+'% 줄어듭니다', px0, 128);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('같은 값을 반복해서 채우니 흩어짐이 실제보다 작아 보이는 것입니다', px0, 148);
        ctx.fillText('제거는 표본이 '+N+'명에서 '+observed.length+'명으로 줄어드는 대가를 치릅니다', px0, 168);
      } else if(s.step===1){
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif';
        ctx.fillText('결측 여부와 이탈률의 관계', px0, 38);
        var by=60, bh=30, bw=(px1-px0)*0.6;
        ctx.fillStyle='rgba(255,122,184,0.45)'; ctx.strokeStyle=ROSE; ctx.lineWidth=1.3;
        ctx.fillRect(px0,by,bw*rateMiss,bh); ctx.strokeRect(px0,by,bw*rateMiss,bh);
        ctx.fillStyle=ROSE; ctx.font='12px ui-monospace,Menlo,monospace';
        ctx.fillText('charge 결측 고객 이탈률 '+(rateMiss*100).toFixed(1)+'%', px0+8, by+20);
        var by2=by+bh+16;
        ctx.fillStyle='rgba(122,184,255,0.45)'; ctx.strokeStyle=BLU;
        ctx.fillRect(px0,by2,bw*rateAll,bh); ctx.strokeRect(px0,by2,bw*rateAll,bh);
        ctx.fillStyle=BLU; ctx.fillText('전체 평균 이탈률 '+(rateAll*100).toFixed(1)+'%', px0+8, by2+20);
        ctx.fillStyle=GLD; ctx.font='600 12.5px sans-serif';
        ctx.fillText('결측 고객의 이탈률이 훨씬 높습니다 — 결측 자체가 정보입니다', px0, by2+bh+26);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('그래서 값만 채우지 말고 "원래 비어 있었다"는 지시변수를 함께 남겨둡니다', px0, by2+bh+46);
      } else if(s.step===2){
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif';
        ctx.fillText('월요금 9명 — 마지막 1명이 이상치(420)', px0, 38);
        var lo=0, hi=430, ax0=px0, ax1=px1, ay=100;
        function PX(v){ return ax0+(v-lo)/(hi-lo)*(ax1-ax0); }
        ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.moveTo(ax0,ay); ctx.lineTo(ax1,ay); ctx.stroke();
        for(i=0;i<OUTX.length;i++){
          var isOut=(i===OUTX.length-1);
          ctx.fillStyle=isOut?RED:BLU; ctx.beginPath(); ctx.arc(PX(OUTX[i]), ay-10, isOut?5:4, 0, 7); ctx.fill();
        }
        ctx.fillStyle=RED; ctx.font='11px sans-serif'; ctx.textAlign='center';
        ctx.fillText('이상치 420', Math.min(PX(420),ax1-30), ay-22);
        ctx.textAlign='left';
        ctx.fillStyle=GLD; ctx.font='600 12px ui-monospace,Menlo,monospace';
        ctx.fillText('평균: '+mO.toFixed(1)+' → '+mX.toFixed(1)+'  (값 하나가 +'+(mX-mO).toFixed(1)+' 끌어올림)', px0, ay+36);
        ctx.fillStyle=GRN;
        ctx.fillText('중앙값: '+medO.toFixed(1)+' → '+medX.toFixed(1)+'  (거의 안 움직임)', px0, ay+56);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('표준편차는 '+sd(OUT,1).toFixed(1)+' → '+sd(OUTX,1).toFixed(1)+'로 16배 넘게 커집니다', px0, ay+80);
        ctx.fillText('이상치를 그대로 표준화에 넣으면 나머지 데이터가 한 점으로 뭉개집니다', px0, ay+100);
      } else {
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif';
        ctx.fillText('가입개월 vs 누적금액 — 두 고객의 거리', px0, 38);
        ctx.font='12px ui-monospace,Menlo,monospace';
        ctx.fillStyle=DIM;
        ctx.fillText('고객A: 가입 '+TENURE[i0]+'개월, 누적 '+spend[i0].toFixed(0), px0, 58);
        ctx.fillText('고객B: 가입 '+TENURE[i1]+'개월, 누적 '+spend[i1].toFixed(0), px0, 78);
        var by=96, bw=px1-px0-100;
        ctx.fillStyle=TXT; ctx.font='11.5px sans-serif';
        ctx.fillText('원자료 그대로', px0, by);
        ctx.fillStyle='rgba(240,136,138,0.5)'; ctx.strokeStyle=RED;
        ctx.fillRect(px0+100,by-12,bw*pctSpendRaw/100,16); ctx.strokeRect(px0+100,by-12,bw*pctSpendRaw/100,16);
        ctx.fillStyle=RED; ctx.font='11.5px ui-monospace,Menlo,monospace';
        ctx.fillText('누적금액이 '+pctSpendRaw.toFixed(1)+'% 좌우', px0+106, by);
        var by2=by+34;
        ctx.fillStyle=TXT; ctx.font='11.5px sans-serif';
        ctx.fillText('표준화(z-score) 후', px0, by2);
        ctx.fillStyle='rgba(126,224,176,0.5)'; ctx.strokeStyle=GRN;
        ctx.fillRect(px0+100,by2-12,bw*pctSpendZ/100,16); ctx.strokeRect(px0+100,by2-12,bw*pctSpendZ/100,16);
        ctx.fillStyle=GRN; ctx.font='11.5px ui-monospace,Menlo,monospace';
        ctx.fillText('누적금액 '+pctSpendZ.toFixed(1)+'% · 가입개월 '+(100-pctSpendZ).toFixed(1)+'%', px0+106, by2);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('스케일이 큰 변수가 거리를 통째로 삼켜 버립니다 — kNN·SVM은 특히 취약합니다', px0, by2+34);
        ctx.fillText('표준화하면 두 변수가 비로소 공평하게 목소리를 냅니다', px0, by2+54);
      }

      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 (대치 → 지시변수 → 이상치 → 스케일)', true);
      E.big('전처리 — 결측 · 이상치 · 스케일', '탐색으로 문제를 발견했다면, 이제 데이터를 모델이 먹을 수 있는 형태로 다듬을 차례입니다. 결측을 어떻게 채우느냐에 따라 표준편차가 실제로 달라지고, 값 하나의 이상치가 평균을 통째로 끌어올리며, 스케일이 다른 두 변수를 방치하면 거리 계산이 한쪽으로 쏠립니다. 전부 실제 계산으로 확인합니다.'); }
  },

  // ══════════ 3. 범주형을 숫자로 — 인코딩 ══════════
  { id:'bda9_03',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*80,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var planOrd={basic:0,standard:1,premium:2};
      var regions=['서울','부산','대구','광주'];
      var regionOrd={}; for(i=0;i<regions.length;i++) regionOrd[regions[i]]=i;
      var nPlan=3, nRegion=regions.length;
      var oheCols=nRegion-1;             // drop_first
      var totalBefore=5;                  // tenure, charge, age, plan, region
      var totalAfter=3+1+oheCols;         // 수치3 + plan순서형1 + region원핫(nRegion-1)

      var code=[
        "OrdinalEncoder().fit_transform(",
        "    df[['plan']])   # basic<standard<premium",
        "pd.get_dummies(df['region'],",
        "    drop_first=True)  # 순서 없음 → 원-핫",
        "X.shape[1]   # 인코딩 후 열 개수"
      ];
      var act=[0,2,4][s.step];
      var codeBot=codePanel(E, W*0.04, 12, W*0.44, code, 'encode.py', act);

      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      var caps=['범주형 변수 2개 — plan은 순서가 있고 region은 순서가 없습니다',
                'plan에 숫자를 매기는 건 괜찮지만, region에 매기면 거짓말이 됩니다',
                '원-핫으로 바꾸면 열이 몇 개가 될까요 — 실제로 세어 봅니다'];
      ctx.fillText(caps[s.step], W*0.04, codeBot+22);

      var px0=W*0.50, px1=W*0.965;

      if(s.step===0){
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif';
        ctx.fillText('고객 5명 원본 (일부 열)', px0, 38);
        var rows=[0,8,16,22,33], cols=['plan','region'];
        var gx=px0, gy=54, cw=100, rh=22;
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=ROSE;
        ctx.fillText('plan', gx, gy); ctx.fillText('region', gx+cw, gy);
        for(i=0;i<rows.length;i++){
          var r=rows[i], yy=gy+16+i*rh;
          ctx.fillStyle=(i%2)?'rgba(255,255,255,0.02)':'rgba(255,255,255,0.05)';
          ctx.fillRect(gx-4,yy-14,cw*2+20,rh);
          ctx.fillStyle=TXT; ctx.font='12px ui-monospace,Menlo,monospace';
          ctx.fillText(PLAN[r], gx, yy); ctx.fillText(REGION[r], gx+cw, yy);
        }
        var by=gy+16+rows.length*rh+20;
        ctx.fillStyle=GLD; ctx.font='600 12.5px sans-serif';
        ctx.fillText('plan: basic → standard → premium — 요금 등급이라는 순서가 있습니다', px0, by);
        ctx.fillStyle=BLU; ctx.font='600 12.5px sans-serif';
        ctx.fillText('region: 서울·부산·대구·광주 — 어느 쪽이 "더 큰" 지역이 아닙니다', px0, by+22);
      } else if(s.step===1){
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif';
        ctx.fillText('region을 순서형으로 잘못 인코딩하면', px0, 38);
        var gx=px0, gy=58;
        for(i=0;i<regions.length;i++){
          ctx.fillStyle=GLD; ctx.font='600 13px ui-monospace,Menlo,monospace'; ctx.textAlign='center';
          ctx.fillText(''+i, gx+i*90+20, gy);
          ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
          ctx.fillText(regions[i], gx+i*90+20, gy+18);
          if(i<regions.length-1){ ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.beginPath();
            ctx.moveTo(gx+i*90+34,gy-4); ctx.lineTo(gx+(i+1)*90+6,gy-4); ctx.stroke(); }
        }
        ctx.textAlign='left';
        var d1=Math.abs(regionOrd['서울']-regionOrd['부산']);
        var d2=Math.abs(regionOrd['서울']-regionOrd['광주']);
        ctx.fillStyle=RED; ctx.font='600 12.5px ui-monospace,Menlo,monospace';
        ctx.fillText('숫자로는 |서울−부산|='+d1+', |서울−광주|='+d2+' — 광주가 부산보다 "3배 더 멀다"?', px0, gy+50);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('지역 이름을 알파벳처럼 나열한 순서일 뿐, 실제 유사성과는 무관합니다', px0, gy+72);
        ctx.fillStyle=GRN; ctx.font='600 12.5px sans-serif';
        ctx.fillText('반면 plan의 |basic−premium|=2는', px0, gy+96);
        ctx.fillText('실제로 "두 단계 위" 요금제라는 뜻이 맞습니다', px0, gy+116);
      } else {
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif';
        ctx.fillText('원-핫 인코딩 후 열 개수(실제 계산)', px0, 38);
        function box(x,y,w,h,label,col){
          ctx.fillStyle=col+'26'; ctx.strokeStyle=col; ctx.lineWidth=1.2;
          roundRect(ctx,x,y,w,h,6); ctx.fill(); ctx.stroke();
          ctx.fillStyle=col; ctx.font='11.5px ui-monospace,Menlo,monospace'; ctx.textAlign='center';
          ctx.fillText(label, x+w/2, y+h/2+4);
        }
        var by=54, bw=70, bh=26, gap=8, x=px0;
        box(x,by,bw,bh,'수치 3',BLU); x+=bw+gap;
        box(x,by,bw,bh,'plan 1',GLD); x+=bw+gap;
        box(x,by,bw,bh,'region '+oheCols,ROSE);
        ctx.textAlign='left'; ctx.fillStyle=TXT; ctx.font='600 13px ui-monospace,Menlo,monospace';
        ctx.fillText('= 총 '+totalAfter+'열   (원본 '+totalBefore+'열에서 +'+(totalAfter-totalBefore)+')', px0, by+bh+24);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('region 4종은 drop_first로 '+oheCols+'열이 됩니다(기준 범주 하나는 나머지가 전부 0일 때)', px0, by+bh+48);
        var hyp=49; // 50 unique -> k-1
        ctx.fillStyle=RED; ctx.font='600 12.5px ui-monospace,Menlo,monospace';
        ctx.fillText('만약 region 대신 "우편번호"(50가지 전부 다름)였다면?', px0, by+bh+72);
        ctx.fillStyle=RED; ctx.font='12.5px sans-serif';
        ctx.fillText('원-핫만으로 '+hyp+'열 — 총 '+(3+1+hyp)+'열. 고차원의 함정입니다', px0, by+bh+92);
      }

      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 (원본 → 순서의 함정 → 열 개수)', true);
      E.big('범주형을 숫자로 — 인코딩', '모델은 숫자만 이해합니다. plan처럼 등급이 뚜렷한 범주는 순서형으로 0·1·2를 매겨도 괜찮지만, region처럼 순서가 없는 범주에 숫자를 매기면 존재하지 않는 거리를 지어내는 셈입니다. 그래서 순서 없는 범주는 원-핫으로 풀어 씁니다. 다만 범주가 많을수록 열이 폭발적으로 늘어난다는 대가도 함께 계산해 두어야 합니다.'); }
  },

  // ══════════ 4. 새어나가면 안 된다 — 데이터 누수와 분할 ══════════
  { id:'bda9_04',
    enter:function(E){ this.s={step:0};
      // ★결정적 생성: Park–Miller LCG(seed=1) — 라벨과 실제로 무관한 잡음 특징 120개
      var st={r:1}, Ntot=32, P=120, Ntr=24, K=6, i,j;
      var y=[], X=[];
      for(i=0;i<Ntot;i++) y.push(lcgNext(st)>0.5?1:0);
      for(i=0;i<Ntot;i++){ var row=[]; for(j=0;j<P;j++) row.push(lcgNext(st)*2-1); X.push(row); }
      function col(j,idx){ var out=[]; for(var k=0;k<idx.length;k++) out.push(X[idx[k]][j]); return out; }
      var trainIdx=[], testIdx=[];
      for(i=0;i<Ntr;i++) trainIdx.push(i);
      for(i=Ntr;i<Ntot;i++) testIdx.push(i);
      var yTr=[]; for(i=0;i<trainIdx.length;i++) yTr.push(y[trainIdx[i]]);
      var yAll=y;
      var corrsHonest=[], corrsLeak=[];
      for(j=0;j<P;j++){ corrsHonest.push(corr(col(j,trainIdx), yTr)); corrsLeak.push(corr(col(j,[].concat(trainIdx,testIdx)), yAll)); }
      function topK(corrs){ var idx=[]; for(var jj=0;jj<P;jj++) idx.push(jj);
        idx.sort(function(a,b){ return Math.abs(corrs[b])-Math.abs(corrs[a]); }); return idx.slice(0,K); }
      var topH=topK(corrsHonest), topL=topK(corrsLeak);
      function classify(top, corrs, idx){ var preds=[];
        for(var k=0;k<idx.length;k++){ var s=0; for(var t=0;t<top.length;t++){ var jj=top[t];
          s += (corrs[jj]>0?1:-1) * X[idx[k]][jj]; } preds.push(s>0?1:0); }
        return preds; }
      var predH=classify(topH, corrsHonest, testIdx), predL=classify(topL, corrsLeak, testIdx);
      var yTe=[]; for(i=0;i<testIdx.length;i++) yTe.push(y[testIdx[i]]);
      var okH=0, okL=0; for(i=0;i<yTe.length;i++){ if(predH[i]===yTe[i]) okH++; if(predL[i]===yTe[i]) okL++; }
      this.s.data={ Ntot:Ntot,P:P,Ntr:Ntr,K:K, nTe:testIdx.length, nTrPos:yTr.reduce(function(a,b){return a+b;},0),
        accH:okH/testIdx.length, accL:okL/testIdx.length, predH:predH, predL:predL, yTe:yTe };
      E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, d=s.data, i;

      var code=[
        "Xtr,Xte,ytr,yte = train_test_split(",
        "    X, y, test_size=0.25)",
        "# 올바른 순서 — 훈련 "+d.Ntr+"명으로만 선택",
        "f = f_classif(Xtr, ytr)[0]",
        "top = np.argsort(-abs(f))[:"+d.K+"]",
        "# 틀린 순서 — 시험 "+d.nTe+"명까지 포함(누수)",
        "f_leak = f_classif(X, y)[0]",
        "top = np.argsort(-abs(f_leak))[:"+d.K+"]"
      ];
      var act=[0,3,6,6][s.step];
      var codeBot=codePanel(E, W*0.04, 12, W*0.46, code, 'no_leak.py', act);

      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      var caps=['특징 '+d.P+'개는 전부 잡음입니다 — 라벨과 실제로는 무관하게 만들었습니다',
                '올바른 순서: 먼저 나누고, 훈련 '+d.Ntr+'명으로만 특징을 고릅니다',
                '틀린 순서: 특징을 고를 때부터 시험 '+d.nTe+'명을 들여다봅니다',
                '같은 잡음, 같은 시험셋 — 순서만 바꿨는데 정확도가 이렇게 다릅니다'];
      ctx.fillText(caps[s.step], W*0.04, codeBot+22);

      var px0=W*0.53, px1=W*0.965;

      if(s.step===0){
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('훈련 '+d.Ntr+'명 · 시험 '+d.nTe+'명 · 잡음 특징 '+d.P+'개', px0, 44);
        ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=DIM;
        ctx.fillText('각 특징은 라벨과 무관한 값(−1~1)으로 만들었습니다', px0, 68);
        ctx.fillText('훈련 라벨: 1이(이탈) '+d.nTrPos+'/'+d.Ntr+'명', px0, 90);
        ctx.fillStyle=GLD; ctx.font='600 12.5px sans-serif';
        ctx.fillText('질문: 라벨과 무관한 특징을 "잘 고르기"만 하면 학습이 될까요?', px0, 122);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('다음 두 단계에서 "고르는 순서"만 바꿔 실제로 확인해 봅니다', px0, 146);
      } else if(s.step===1){
        ctx.fillStyle=GRN; ctx.font='600 13px sans-serif';
        ctx.fillText('✓ 올바른 순서', px0, 44);
        ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT;
        ctx.fillText('1. train_test_split → 훈련 '+d.Ntr+' / 시험 '+d.nTe, px0, 68);
        ctx.fillText('2. 상관은 훈련 '+d.Ntr+'명만으로 계산', px0, 90);
        ctx.fillText('3. 상위 '+d.K+'개 선택 → 시험셋에 적용·평가', px0, 112);
        ctx.fillStyle=GRN; ctx.font='600 14px ui-monospace,Menlo,monospace';
        ctx.fillText('시험 정확도 = '+(d.accH*100).toFixed(1)+'%', px0, 146);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('잡음이니 우연 수준(50%) 근처가 나오는 게 정직한 결과입니다', px0, 168);
      } else if(s.step===2){
        ctx.fillStyle=RED; ctx.font='600 13px sans-serif';
        ctx.fillText('✗ 틀린 순서', px0, 44);
        ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT;
        ctx.fillText('1. 상관을 '+d.Ntot+'명 전체(시험 포함!)로 계산', px0, 68);
        ctx.fillText('2. 상위 '+d.K+'개 선택 → 그제서야 분할', px0, 90);
        ctx.fillText('3. 그 "선택된" 특징으로 시험셋 평가', px0, 112);
        ctx.fillStyle=RED; ctx.font='600 14px ui-monospace,Menlo,monospace';
        ctx.fillText('시험 정확도 = '+(d.accL*100).toFixed(1)+'%', px0, 146);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('시험 8명의 값을 특징 선택 단계가 이미 훔쳐봤기 때문입니다', px0, 168);
      } else {
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif';
        ctx.fillText('같은 잡음 데이터, 순서만 다른 결과', px0, 40);
        var by=60, bh=30, bw=px1-px0-140, maxv=1.0;
        function row(y,label,v,col){
          ctx.font='12px ui-monospace,Menlo,monospace'; ctx.textAlign='left'; ctx.fillStyle=col;
          ctx.fillText(label, px0, y+bh/2+4);
          ctx.fillStyle=col+'40'; ctx.strokeStyle=col; ctx.lineWidth=1.3;
          ctx.fillRect(px0+120,y,bw*v/maxv,bh); ctx.strokeRect(px0+120,y,bw*v/maxv,bh);
          ctx.fillStyle=col; ctx.font='600 13px ui-monospace,Menlo,monospace';
          ctx.fillText((v*100).toFixed(1)+'%', px0+128+bw*v/maxv, y+bh/2+4);
        }
        row(by,'올바른 순서', d.accH, GRN);
        row(by+bh+14,'틀린 순서(누수)', d.accL, RED);
        var xh=px0+120+bw*0.5;
        ctx.strokeStyle=GLD; ctx.setLineDash([4,4]); ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.moveTo(xh, by-8); ctx.lineTo(xh, by+2*bh+14); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle=GLD; ctx.font='11px sans-serif'; ctx.textAlign='center';
        ctx.fillText('우연 수준 50%', xh, by-14);
        ctx.textAlign='left'; ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('라벨과 무관한 잡음인데도 누수만으로 정확도가 부풀려집니다', px0, by+2*bh+42);
        ctx.fillText('그래서 전처리·특징선택은 반드시 분할 뒤, 훈련셋에만 적용합니다', px0, by+2*bh+62);
      }

      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 (셋업 → 올바른 순서 → 틀린 순서 → 대비)', true);
      E.big('새어나가면 안 된다 — 데이터 누수와 분할', '전처리·인코딩을 배웠으니 이제 가장 흔하면서도 치명적인 실수를 확인할 차례입니다. 시험 데이터의 정보가 학습 과정에 조금이라도 스며들면 — 성능은 거짓으로 부풀려집니다. 라벨과 아무 관계도 없는 순수한 잡음 특징 120개로 실제로 확인해 보세요. 순서만 바꿨을 뿐인데 정확도가 완전히 달라집니다. 올바른 순서는 하나뿐입니다 — 먼저 나누고, 훈련셋으로만 배웁니다.'); }
  },

  // ══════════ 5. 무엇으로 평가할 것인가 ══════════
  { id:'bda9_05',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var n1=0; for(i=0;i<N;i++) if(CHURN[i]) n1++;
      var n0=N-n1, majAcc=n0/N;

      var pred=[1,0,0,1,1,1,0,0,0,1,1,1], act=[1,0,0,1,1,0,1,1,0,1,1,1];
      var TP=0,TN=0,FP=0,FN=0;
      for(i=0;i<pred.length;i++){
        if(pred[i]===1&&act[i]===1) TP++;
        else if(pred[i]===0&&act[i]===0) TN++;
        else if(pred[i]===1&&act[i]===0) FP++;
        else FN++;
      }
      var accuracy=(TP+TN)/pred.length;
      var precision=TP/(TP+FP), recall=TP/(TP+FN), f1=2*precision*recall/(precision+recall);

      // 5겹 교차검증: churn을 5등분해 다수결 기준선 정확도의 흔들림을 실측
      var K=5, foldSize=Math.floor(N/K), accs=[];
      for(var k=0;k<K;k++){
        var testIdx=[]; for(i=k*foldSize;i<(k+1)*foldSize;i++) testIdx.push(i);
        var trSum=0, trN=0;
        for(i=0;i<N;i++){ if(testIdx.indexOf(i)<0){ trSum+=CHURN[i]; trN++; } }
        var maj=(trSum>trN/2)?1:0;
        var ok=0; for(i=0;i<testIdx.length;i++){ if(CHURN[testIdx[i]]===maj) ok++; }
        accs.push(ok/testIdx.length);
      }
      var accMean=mean(accs), accSd=sd(accs,1);

      var code=[
        "confusion_matrix(y_true, y_pred)",
        "precision_score(y_true, y_pred)",
        "recall_score(y_true, y_pred)",
        "f1_score(y_true, y_pred)",
        "cross_val_score(model, X, y, cv=5)"
      ];
      var acti=[0,0,2,4][s.step];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'evaluate.py', acti);

      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      var caps=['"항상 유지라고만 찍어도" 정확도가 이렇게 높습니다 — 불균형의 함정',
                '예측 12개로 혼동행렬을 실제로 채웁니다',
                '혼동행렬에서 정밀도·재현율·F1을 계산합니다',
                '한 번의 분할로는 못 믿습니다 — 5번 나눠 흔들림을 봅니다'];
      ctx.fillText(caps[s.step], W*0.04, codeBot+22);

      var px0=W*0.50, px1=W*0.965;

      if(s.step===0){
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif';
        ctx.fillText('"무조건 유지(0)" 예측기의 성적표', px0, 40);
        var by=62, bh=32, bw=(px1-px0)*majAcc;
        ctx.fillStyle='rgba(126,224,176,0.4)'; ctx.strokeStyle=GRN; ctx.lineWidth=1.3;
        ctx.fillRect(px0,by,bw,bh); ctx.strokeRect(px0,by,bw,bh);
        ctx.fillStyle=GRN; ctx.font='600 13px ui-monospace,Menlo,monospace';
        ctx.fillText('정확도 = '+(majAcc*100).toFixed(1)+'%', px0+8, by+21);
        var by2=by+bh+18;
        ctx.fillStyle=RED; ctx.font='600 13px ui-monospace,Menlo,monospace';
        ctx.fillText('이탈(1) 재현율 = 0/'+n1+' = 0.0%', px0, by2);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('아무것도 배우지 않았는데 정확도만 보면 훌륭해 보입니다', px0, by2+24);
        ctx.fillText('불균형 데이터일수록 정확도 하나만으로는 절대 안심할 수 없습니다', px0, by2+44);
      } else if(s.step===1){
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif';
        ctx.fillText('혼동행렬 (예측 12개)', px0, 38);
        var gx=px0, gy=54, cw=70, rh=30, lw=60;
        ctx.font='600 11px sans-serif'; ctx.textAlign='center';
        ctx.fillStyle=DIM; ctx.fillText('실제 1', gx+lw+cw/2, gy);
        ctx.fillText('실제 0', gx+lw+cw+cw/2, gy);
        var cells=[[TP,FP],[FN,TN]], labels=[['TP','FP'],['FN','TN']], rlab=['예측 1','예측 0'];
        for(var r=0;r<2;r++){
          var ry=gy+16+r*rh;
          ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left';
          ctx.fillText(rlab[r], gx, ry+rh/2+4);
          for(var c=0;c<2;c++){
            var cx=gx+lw+c*cw;
            var col=(labels[r][c]==='TP'||labels[r][c]==='TN')?GRN:RED;
            ctx.fillStyle=col+'26'; ctx.strokeStyle=col; ctx.lineWidth=1.2;
            ctx.fillRect(cx,ry,cw-4,rh-4); ctx.strokeRect(cx,ry,cw-4,rh-4);
            ctx.fillStyle=col; ctx.font='600 13px ui-monospace,Menlo,monospace'; ctx.textAlign='center';
            ctx.fillText(labels[r][c]+'='+cells[r][c], cx+(cw-4)/2, ry+rh/2+5);
          }
        }
        ctx.textAlign='left'; ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('accuracy = (TP+TN)/12 = '+accuracy.toFixed(3), px0, gy+16+2*rh+24);
      } else if(s.step===2){
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif';
        ctx.fillText('정밀도 · 재현율 · F1 (실제 계산)', px0, 38);
        ctx.font='12.5px ui-monospace,Menlo,monospace';
        ctx.fillStyle=BLU; ctx.fillText('정밀도 = TP/(TP+FP) = '+TP+'/'+(TP+FP)+' = '+precision.toFixed(3), px0, 62);
        ctx.fillStyle=GLD; ctx.fillText('재현율 = TP/(TP+FN) = '+TP+'/'+(TP+FN)+' = '+recall.toFixed(3), px0, 86);
        ctx.fillStyle=GRN; ctx.fillText('F1 = 2×P×R/(P+R) = '+f1.toFixed(3), px0, 110);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('스팸 필터처럼 "정상을 스팸으로" 오분류가 아프면 정밀도를', px0, 138);
        ctx.fillText('암 진단처럼 "환자를 놓치는" 게 더 아프면 재현율을 우선합니다', px0, 158);
        ctx.fillText('두 값을 같이 챙기고 싶을 때 F1을 씁니다', px0, 178);
      } else {
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif';
        ctx.fillText('5겹 교차검증 — 다수결 기준선 정확도의 흔들림', px0, 38);
        var bx0=px0, bx1=px1, by0=56, bh2=110, lo=0.5, hi=0.9;
        ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.moveTo(bx0,by0+bh2); ctx.lineTo(bx1,by0+bh2); ctx.stroke();
        // 평균 기준선을 먼저 그려 점·라벨이 항상 위에 오도록(겹침 방지)
        ctx.strokeStyle=GLD; ctx.setLineDash([4,4]); ctx.lineWidth=1.3;
        var ym=by0+bh2-(accMean-lo)/(hi-lo)*bh2;
        ctx.beginPath(); ctx.moveTo(bx0,ym); ctx.lineTo(bx1,ym); ctx.stroke(); ctx.setLineDash([]);
        for(i=0;i<K;i++){
          var xx=bx0+(bx1-bx0)*(i+0.5)/K;
          var yy=by0+bh2-(accs[i]-lo)/(hi-lo)*bh2;
          ctx.fillStyle=ROSE; ctx.beginPath(); ctx.arc(xx,yy,5,0,7); ctx.fill();
          ctx.fillStyle='#1a1720'; ctx.font='600 11px ui-monospace,Menlo,monospace'; ctx.textAlign='center';
          ctx.fillRect(xx-16,yy-24,32,14);
          ctx.fillStyle=DIM; ctx.fillText((accs[i]*100).toFixed(0)+'%', xx, yy-13);
          ctx.fillText('fold'+(i+1), xx, by0+bh2+16);
        }
        ctx.textAlign='left'; ctx.fillStyle=GLD; ctx.font='600 12px ui-monospace,Menlo,monospace';
        ctx.fillText('평균 '+(accMean*100).toFixed(1)+'% ± '+(accSd*100).toFixed(1)+'%p', bx0, by0+bh2+38);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText((Math.min.apply(null,accs)*100).toFixed(0)+'%에서 '+(Math.max.apply(null,accs)*100).toFixed(0)+'%까지 — 한 번만 봤다면 운이 성적을 갈랐을 것입니다', bx0, by0+bh2+58);
      }

      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 (불균형 함정 → 혼동행렬 → 지표 → 교차검증)', true);
      E.big('무엇으로 평가할 것인가', '탐색·전처리·인코딩·올바른 분할까지 마쳤다면, 마지막으로 남는 질문은 하나 — 무엇을 "좋다"고 부를 것인가입니다. 정확도만 보면 다수 클래스를 찍기만 해도 높은 점수가 나오는 착시에 빠집니다. 혼동행렬에서 정밀도·재현율·F1을 실제로 계산해 문제에 맞는 잣대를 고르고, 한 번의 분할이 아니라 여러 번 나눠 평균 내는 교차검증으로 그 숫자를 믿을 만하게 만듭니다. 10장의 분류 알고리즘이 이 잣대 위에서 심판받습니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
