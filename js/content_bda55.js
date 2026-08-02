/* 빅데이터 분석 제55장 — 실기에 자주 나오는 특수 기법
   (생존분석 Kaplan-Meier·로그순위검정 · 분위수 회귀 vs 최소제곱 · 베이즈 정리로 확률 갱신 · 선형계획법 운송 최적화 · 결론 서술)
   동작(behavior)만. 텍스트=content/bda55.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 생존확률(구간별 곱)·로그순위 χ²·회귀계수(최소제곱 폐형해 + 분위수회귀 반복가중최소제곱)·
   베이즈 사후확률·운송문제 꼭짓점 비용은 전부 이 파일 로드 시 고정 데이터로부터 실제 계산.
   난수(Math.random)·Date.now 절대 금지 — 데이터는 전부 고정 배열. */
(function(){
  var ROSE='#ff7ab8', GRN='#7ee0b0', BLU='#7ab8ff', GLD='#ffd27a', DIM='#9b99a3', RED='#f0888a', TXT='#eadfe8', PUR='#c79dff', ORG='#ffb27a';

  function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function codePanel(E, x, y, w, lines, title, actLine){
    var ctx=E.ctx, lh=19, pad=12, top=y, n=lines.length, ht=n*lh+pad*2+(title?24:0);
    ctx.fillStyle='rgba(255,255,255,0.035)'; ctx.strokeStyle='rgba(255,122,184,0.30)'; ctx.lineWidth=1;
    roundRect(ctx,x,top,w,ht,10); ctx.fill(); ctx.stroke();
    var cy=top+pad+(title?24:0);
    if(title){ ctx.fillStyle=ROSE; ctx.font='600 11.5px ui-monospace,Menlo,monospace'; ctx.textAlign='left'; ctx.fillText(title, x+pad, top+pad+11); }
    ctx.font='12px ui-monospace,Menlo,Consolas,monospace'; ctx.textAlign='left';
    for(var i=0;i<n;i++){
      var L=lines[i], t=(typeof L==='string')?L:L.t, hl=(typeof L==='object')?L.hl:null;
      var ty=cy+i*lh+11;
      if(actLine!=null && ((typeof actLine==='number'&&i===actLine)||(actLine.indexOf&&actLine.indexOf(i)>=0))){ ctx.fillStyle='rgba(255,122,184,0.16)'; ctx.fillRect(x+4, cy+i*lh+1, w-8, lh-2); ctx.fillStyle=ROSE; ctx.fillRect(x+4, cy+i*lh+1, 3, lh-2); }
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

  function wrapText(ctx, text, x, y, maxW, lh){
    var chars=text.split(''), line='', ty=y;
    for(var i=0;i<chars.length;i++){
      var test=line+chars[i];
      if(ctx.measureText(test).width>maxW && line){ ctx.fillText(line, x, ty); line=chars[i]; ty+=lh; }
      else line=test;
    }
    if(line) ctx.fillText(line, x, ty);
    return ty+lh;
  }

  function frame55(ctx,px0,px1,pTop,pBot,xlab,ylab){
    ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.moveTo(px0,pTop); ctx.lineTo(px0,pBot); ctx.stroke();
    ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
    ctx.fillText(xlab, (px0+px1)/2, pBot+18);
    ctx.save(); ctx.translate(px0-24,(pTop+pBot)/2); ctx.rotate(-Math.PI/2); ctx.fillText(ylab,0,0); ctx.restore();
  }

  // ════════════════════════════════════════════════════════════════════════
  // 55.1 데이터 · 계산 — 생존분석: 두 집단(A=신약, B=표준치료) 각 10명, 개월 단위 관찰
  // GA_E/GB_E: 1=사건(재발) 관측, 0=중도절단(관찰 종료 시점까지 사건 없이 추적 종료)
  // ════════════════════════════════════════════════════════════════════════
  var GA_T=[5,7,7,9,10,12,12,14,16,18], GA_E=[1,1,0,1,1,1,0,1,0,1];
  var GB_T=[2,3,4,4,5,6,7,8,9,9],       GB_E=[1,1,1,0,1,1,1,1,0,1];

  function kaplanMeier55(times, events){
    var n=times.length, idx=times.map(function(t,i){return i;});
    idx.sort(function(a,b){return times[a]-times[b];});
    var sT=idx.map(function(i){return times[i];}), sE=idx.map(function(i){return events[i];});
    var atRisk=n, i=0, S=1, steps=[];
    while(i<n){
      var t=sT[i], d=0, c=0;
      while(i<n && sT[i]===t){ if(sE[i]===1) d++; else c++; i++; }
      var n0=atRisk;
      if(d>0){ var factor=1-d/n0; S*=factor; steps.push({t:t,n:n0,d:d,c:c,factor:factor,S:S}); }
      else steps.push({t:t,n:n0,d:d,c:c,factor:1,S:S});
      atRisk -= (d+c);
    }
    return steps;
  }
  var KMA55=kaplanMeier55(GA_T,GA_E), KMB55=kaplanMeier55(GB_T,GB_E);
  var KMA55_D=KMA55.filter(function(s){return s.d>0;}), KMB55_D=KMB55.filter(function(s){return s.d>0;});

  function logRank55(t1,e1,t2,e2){
    var ev=[];
    for(var i=0;i<t1.length;i++) if(e1[i]===1) ev.push(t1[i]);
    for(i=0;i<t2.length;i++) if(e2[i]===1) ev.push(t2[i]);
    ev=ev.filter(function(v,idx,arr){return arr.indexOf(v)===idx;}).sort(function(a,b){return a-b;});
    var sumOE=0, sumV=0, rows=[];
    ev.forEach(function(tt){
      var n1=t1.filter(function(x){return x>=tt;}).length, n2=t2.filter(function(x){return x>=tt;}).length;
      var d1=0; for(var i=0;i<t1.length;i++) if(t1[i]===tt&&e1[i]===1) d1++;
      var d2=0; for(i=0;i<t2.length;i++) if(t2[i]===tt&&e2[i]===1) d2++;
      var nt=n1+n2, dt=d1+d2, e1t=dt*n1/nt, vt=(nt>1)?(dt*(nt-dt)*n1*n2)/(nt*nt*(nt-1)):0;
      sumOE+=(d1-e1t); sumV+=vt;
      rows.push({t:tt,n1:n1,n2:n2,d1:d1,d2:d2,e1:e1t,v:vt});
    });
    return {rows:rows, sumOE:sumOE, sumV:sumV, chi2: sumV>0?(sumOE*sumOE)/sumV:0};
  }
  var LR55=logRank55(GA_T,GA_E,GB_T,GB_E);

  // 표준정규 누적분포(급수 근사 erf, Abramowitz-Stegun 7.1.26) → 자유도1 카이제곱의 생존함수(정확한 관계식)
  function erf55(x){ var sg=x<0?-1:1; x=Math.abs(x);
    var a1=0.254829592,a2=-0.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429,p=0.3275911;
    var t=1/(1+p*x);
    var y=1-(((((a5*t+a4)*t)+a3)*t+a2)*t+a1)*t*Math.exp(-x*x);
    return sg*y; }
  function normCdf55(z){ return 0.5*(1+erf55(z/Math.SQRT2)); }
  function chi2sfDf1_55(x){ return x<=0?1:2*(1-normCdf55(Math.sqrt(x))); }
  var LR_P55=chi2sfDf1_55(LR55.chi2);

  function stepPts55(steps,curT){
    var pts=[{t:0,S:1}], Scur=1;
    for(var i=0;i<steps.length;i++){ var st=steps[i]; if(st.t<=curT){ pts.push({t:st.t,S:Scur}); Scur=st.S; pts.push({t:st.t,S:Scur}); } }
    var ext=Math.max(curT,0); pts.push({t:ext,S:Scur});
    return pts;
  }

  // ════════════════════════════════════════════════════════════════════════
  // 55.2 데이터 · 계산 — 분위수 회귀: 12개 관측치(분산이 x에 따라 커지는 패턴) + 이상값 1개
  // ════════════════════════════════════════════════════════════════════════
  var QX55=[1,2,3,4,5,6,7,8,9,10,11,12];
  var QY55=[4.1,6.2,6.6,9.5,9.0,12.7,11.2,16.1,13.6,19.4,15.8,22.7];
  var QOUT_X55=13, QOUT_Y55=52;

  function wls55(X,Y,W){
    var n=X.length, sw=0,swx=0,swy=0,swxx=0,swxy=0, i;
    for(i=0;i<n;i++){ var w=W[i]; sw+=w; swx+=w*X[i]; swy+=w*Y[i]; swxx+=w*X[i]*X[i]; swxy+=w*X[i]*Y[i]; }
    var mx=swx/sw, my=swy/sw, sxy=swxy-sw*mx*my, sxx=swxx-sw*mx*mx;
    var b=sxy/sxx, a=my-b*mx;
    return {a:a,b:b};
  }
  function ols55(X,Y){ return wls55(X,Y,X.map(function(){return 1;})); }
  function quantileIRLS55(X,Y,tau,iters){
    var n=X.length, fit=ols55(X,Y), a=fit.a, b=fit.b, eps=1e-3;
    for(var it=0; it<iters; it++){
      var W=[];
      for(var i=0;i<n;i++){ var u=Y[i]-(a+b*X[i]); var ww=(u>=0)?tau:(1-tau); W.push(ww/(Math.abs(u)+eps)); }
      var r=wls55(X,Y,W); a=r.a; b=r.b;
    }
    return {a:a,b:b};
  }
  var TAUS55=[0.1,0.5,0.9];
  var QX_OUT55=QX55.concat([QOUT_X55]), QY_OUT55=QY55.concat([QOUT_Y55]);
  function fitAll55(X,Y){
    var out={ols:ols55(X,Y), q:{}};
    TAUS55.forEach(function(tau){ out.q[tau]=quantileIRLS55(X,Y,tau,120); });
    return out;
  }
  var QR_NO55=fitAll55(QX55,QY55), QR_OUT55=fitAll55(QX_OUT55,QY_OUT55);
  var QR_OLS_DPCT55=(QR_OUT55.ols.b-QR_NO55.ols.b)/QR_NO55.ols.b*100;
  var QR_MED_DPCT55=(QR_OUT55.q[0.5].b-QR_NO55.q[0.5].b)/QR_NO55.q[0.5].b*100;

  // ════════════════════════════════════════════════════════════════════════
  // 55.3 계산 — 베이즈 정리(검사 정확도·유병률 → 사후확률), 반복 양성으로 사전확률 갱신
  // ════════════════════════════════════════════════════════════════════════
  var PREV_OPTS55=[0.001,0.005,0.01,0.02,0.05,0.10];
  var PREV_LABEL55=['0.1%','0.5%','1%','2%','5%','10%'];
  function bayesPost55(prior,acc){ var tp=acc*prior, fp=(1-acc)*(1-prior); return tp/(tp+fp); }
  function bayesChain55(prior,acc,kmax){
    var arr=[prior], cur=prior;
    for(var i=0;i<kmax;i++){ cur=bayesPost55(cur,acc); arr.push(cur); }
    return arr;
  }
  var BAYES_DEFAULT55=bayesChain55(0.01,0.95,4); // [사전, 1회양성, 2회, 3회, 4회]

  // ════════════════════════════════════════════════════════════════════════
  // 55.4 계산 — 운송 최적화 LP: 창고2개(S1=70,S2=50) → 매장2개(D1=60,D2=50), 결정변수 x=S1→D1, y=S1→D2
  // 비용: c11=4, c12=6, c21=5, c22=3.  목적함수 f = -x + 3y + 450 (전개해 정리한 총비용)
  // ════════════════════════════════════════════════════════════════════════
  var LP_S1_55=70, LP_S2_55=50, LP_D1_55=60, LP_D2_55=50;
  var LP_C11_55=4, LP_C12_55=6, LP_C21_55=5, LP_C22_55=3;
  function lpCost55(x,y){ return LP_C11_55*x + LP_C12_55*y + LP_C21_55*(LP_D1_55-x) + LP_C22_55*(LP_D2_55-y); }
  var LP_CONS55=[
    {a:1,b:0,c:LP_D1_55},                       // x<=D1
    {a:0,b:1,c:LP_D2_55},                       // y<=D2
    {a:1,b:1,c:LP_S1_55},                       // x+y<=S1
    {a:-1,b:-1,c:-(LP_D1_55+LP_D2_55-LP_S2_55)},// x+y>=D1+D2-S2
    {a:-1,b:0,c:0}, {a:0,b:-1,c:0}              // x>=0, y>=0
  ];
  function lpVertices55(cons){
    var pts=[];
    for(var i=0;i<cons.length;i++){
      for(var j=i+1;j<cons.length;j++){
        var c1=cons[i], c2=cons[j], det=c1.a*c2.b-c2.a*c1.b;
        if(Math.abs(det)<1e-9) continue;
        var x=(c1.c*c2.b-c2.c*c1.b)/det, y=(c1.a*c2.c-c2.a*c1.c)/det;
        var ok=true;
        for(var k=0;k<cons.length;k++){ var ck=cons[k]; if(ck.a*x+ck.b*y>ck.c+1e-6){ ok=false; break; } }
        if(ok) pts.push({x:+x.toFixed(4), y:+y.toFixed(4)});
      }
    }
    var uniq=[];
    pts.forEach(function(p){ if(!uniq.some(function(q){return Math.abs(q.x-p.x)<1e-3&&Math.abs(q.y-p.y)<1e-3;})) uniq.push(p); });
    uniq.forEach(function(p){ p.cost=lpCost55(p.x,p.y); });
    return uniq;
  }
  var LP_VERTS55=lpVertices55(LP_CONS55);
  var LP_MIN55=LP_VERTS55.reduce(function(m,p){return p.cost<m.cost?p:m;}, LP_VERTS55[0]);
  function lpSortPoly55(pts){
    var cx=0,cy=0; pts.forEach(function(p){cx+=p.x;cy+=p.y;}); cx/=pts.length; cy/=pts.length;
    return pts.slice().sort(function(a,b){ return Math.atan2(a.y-cy,a.x-cx)-Math.atan2(b.y-cy,b.x-cx); });
  }
  var LP_POLY55=lpSortPoly55(LP_VERTS55);
  var LP_INTERIOR55={x:37.5, y:27.5}; LP_INTERIOR55.cost=lpCost55(LP_INTERIOR55.x,LP_INTERIOR55.y);
  var LP_INTERIOR2_55={x:40, y:25}; LP_INTERIOR2_55.cost=lpCost55(LP_INTERIOR2_55.x,LP_INTERIOR2_55.y);
  var LP_CAND55=LP_VERTS55.map(function(p){ return {x:p.x,y:p.y,cost:p.cost,type:'꼭짓점'}; })
    .concat([{x:LP_INTERIOR55.x,y:LP_INTERIOR55.y,cost:LP_INTERIOR55.cost,type:'내부점'},
             {x:LP_INTERIOR2_55.x,y:LP_INTERIOR2_55.y,cost:LP_INTERIOR2_55.cost,type:'내부점'}]);

  var scenes = [

  // ══════════ 55.1 생존분석 — 중도절단을 실제로 처리하다 ══════════
  { id:'bda55_01',
    enter:function(E){ var self=this; self.s={si:0};
      E.controls('<div class="ctrl"><label>사건 시점 진행</label><input type="range" id="b5501s" min="0" max="'+LR55.rows.length+'" step="1" value="0"><output id="b5501so">0/'+LR55.rows.length+'</output></div>');
      E.bind('#b5501s','input',function(e){ self.s.si=+e.target.value; document.getElementById('b5501so').textContent=self.s.si+'/'+LR55.rows.length; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var si=s.si, row=(si>0)?LR55.rows[si-1]:null, curT=row?row.t:-1;
      var code=[
        'S = 1.0',
        'for t in sorted(사건시점들):',
        '    n_t = 위험집합_크기(t)      # 아직 관찰 중인 사람 수',
        '    d_t = 사건_수(t)           # 그 시점 실제 사건 건수',
        '    S *= (1 - d_t/n_t)         # 구간 생존확률을 계속 곱함'
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.44, code, 'kaplan_meier.py', row?4:0);

      var ry=codeBot+20;
      ctx.textAlign='left'; ctx.font='12px ui-monospace,Menlo,monospace';
      if(!row){
        ctx.fillStyle=DIM; ctx.fillText('아직 진행 전 — 두 집단 모두 S=1.000(전원 생존)에서 시작합니다', W*0.04, ry);
      } else {
        ctx.fillStyle=GLD; ctx.fillText((si)+'번째 사건 시점  t='+curT+'개월', W*0.04, ry);
        var aStep=KMA55_D.filter(function(x){return x.t===curT;})[0];
        var bStep=KMB55_D.filter(function(x){return x.t===curT;})[0];
        ctx.font='11.5px ui-monospace,Menlo,monospace';
        if(aStep){ ctx.fillStyle=GRN; ctx.fillText('A(신약): n='+aStep.n+' d='+aStep.d+'  계수(1-'+aStep.d+'/'+aStep.n+')='+aStep.factor.toFixed(3)+'  누적 S_A='+aStep.S.toFixed(3), W*0.04, ry+20); }
        else { ctx.fillStyle=DIM; ctx.fillText('A(신약): 이 시점엔 사건 없음(위험집합 n1='+row.n1+' 유지)', W*0.04, ry+20); }
        if(bStep){ ctx.fillStyle=BLU; ctx.fillText('B(표준): n='+bStep.n+' d='+bStep.d+'  계수(1-'+bStep.d+'/'+bStep.n+')='+bStep.factor.toFixed(3)+'  누적 S_B='+bStep.S.toFixed(3), W*0.04, ry+38); }
        else { ctx.fillStyle=DIM; ctx.fillText('B(표준): 이 시점엔 사건 없음(위험집합 n2='+row.n2+' 유지)', W*0.04, ry+38); }
        var sumOE=0,sumV=0; for(var k=0;k<si;k++){ sumOE+=(LR55.rows[k].d1-LR55.rows[k].e1); sumV+=LR55.rows[k].v; }
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('로그순위 누적: Σ(관측-기대)='+sumOE.toFixed(2)+'  Σ분산='+sumV.toFixed(2)+(si<LR55.rows.length?'  (아직 전체 시점을 다 보지 않았습니다)':''), W*0.04, ry+58);
        if(si===LR55.rows.length){
          ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=(LR_P55<0.05?RED:TXT);
          ctx.fillText('χ²='+LR55.chi2.toFixed(2)+'(자유도1)  p='+LR_P55.toFixed(3)+(LR_P55<0.05?'  → 두 곡선이 유의하게 다릅니다':'  → 유의한 차이 아님'), W*0.04, ry+78);
        }
      }

      var px0=W*0.50, px1=W*0.965, pTop=26, pBot=232, tMax=19;
      function PX(v){ return px0+(v/tMax)*(px1-px0); }
      function PY(v){ return pBot-v*(pBot-pTop); }
      frame55(ctx,px0,px1,pTop,pBot,'개월','생존확률 S(t)');
      ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillStyle=GRN; ctx.fillText('● A(신약)', px0+4, pTop+12);
      ctx.fillStyle=BLU; ctx.fillText('● B(표준치료)', px0+80, pTop+12);
      var ptsA=stepPts55(KMA55_D,curT), ptsB=stepPts55(KMB55_D,curT);
      [{p:ptsA,c:GRN},{p:ptsB,c:BLU}].forEach(function(o){
        ctx.strokeStyle=o.c; ctx.lineWidth=2.2; ctx.beginPath();
        o.p.forEach(function(pt,i){ var x=PX(pt.t), y=PY(pt.S); if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); });
        ctx.stroke();
        var last=o.p[o.p.length-1];
        ctx.fillStyle=o.c; ctx.beginPath(); ctx.arc(PX(last.t),PY(last.S),3.4,0,7); ctx.fill();
      });
      if(row){
        ctx.strokeStyle=GLD; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(PX(curT),pTop); ctx.lineTo(PX(curT),pBot); ctx.stroke(); ctx.setLineDash([]);
      }

      E.tapHint(W/2, H*0.95, '슬라이더로 사건 시점을 하나씩 넘기며 생존확률이 실제로 곱해지는 것을 보세요', true);
      E.big('생존분석 — 중도절단을 실제로 처리하다', '카플란-마이어 추정은 「구간마다 생존확률을 곱해 나가는」 방식입니다. 각 사건 시점에서 위험집합(아직 사건이 안 일어난 채 관찰 중인 사람 수) n과 실제 사건 수 d를 세어 계수 (1-d/n)를 구하고, 이전까지의 누적값에 곱합니다 — <b>중도절단</b>(추적이 끝날 때까지 사건이 안 일어난 관측치)은 사건으로 세지 않되 그 시점 이후 위험집합에서는 빠집니다. 신약 A집단은 마지막 사건(18개월)까지 계속 사건이 나와 S=0으로 끝나지만, 표준치료 B집단은 9개월 이후 남은 관측치가 중도절단되어 S=0.117에서 곡선이 멈춥니다. 두 곡선의 차이를 <b>로그순위검정</b>(각 사건 시점의 관측 대 기대 사건 수 차이를 누적)으로 실제 검정하면 χ²='+LR55.chi2.toFixed(2)+'(자유도 1), p='+LR_P55.toFixed(3)+'로 유의수준 0.05보다 작아 두 집단의 생존곡선이 통계적으로 유의하게 다르다고 판단합니다.'); }
  },

  // ══════════ 55.2 분위수 회귀 — 이상값에도 흔들리지 않는 선 ══════════
  { id:'bda55_02',
    enter:function(E){ var self=this; self.s={out:0};
      E.controls('<div class="ctrl"><label>이상값 포함(0=제외,1=포함)</label><input type="range" id="b5502o" min="0" max="1" step="1" value="0"><output id="b5502oo">제외</output></div>');
      E.bind('#b5502o','input',function(e){ self.s.out=+e.target.value; document.getElementById('b5502oo').textContent=self.s.out?'포함':'제외'; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var on=s.out===1;
      var X=on?QX_OUT55:QX55, Y=on?QY_OUT55:QY55;
      var FIT=on?QR_OUT55:QR_NO55;
      var code=[
        'ols = 최소제곱(X, y)                 # 폐형해(닫힌 식)',
        'a, b = mean(y), 0',
        'for _ in range(iters):               # 반복가중최소제곱(IRLS)',
        "    w = tau_or_(1-tau) / |y-(a+b*X)|",
        '    a, b = 가중최소제곱(X, y, w)      # τ=0.5면 중위수 회귀'
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.44, code, 'quantile_reg.py', on?3:2);
      var ry=codeBot+18;
      ctx.textAlign='left'; ctx.font='11.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=RED; ctx.fillText('최소제곱(OLS) 기울기: '+QR_NO55.ols.b.toFixed(2)+' → '+QR_OUT55.ols.b.toFixed(2)+'  ('+(QR_OLS_DPCT55>=0?'+':'')+QR_OLS_DPCT55.toFixed(1)+'%)', W*0.04, ry);
      ctx.fillStyle=GRN; ctx.fillText('중위수(τ=0.5) 기울기: '+QR_NO55.q[0.5].b.toFixed(3)+' → '+QR_OUT55.q[0.5].b.toFixed(3)+'  ('+(QR_MED_DPCT55>=0?'+':'')+QR_MED_DPCT55.toFixed(2)+'%)', W*0.04, ry+19);
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('같은 이상값 앞에서 최소제곱은 크게 흔들리고 중위수 회귀는 거의 그대로입니다', W*0.04, ry+40);
      ctx.font='11px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('현재('+(on?'이상값 포함':'이상값 제외')+'): OLS a='+FIT.ols.a.toFixed(2)+' b='+FIT.ols.b.toFixed(2), W*0.04, ry+62);
      ctx.fillStyle=TXT; ctx.fillText('τ=0.1 b='+FIT.q[0.1].b.toFixed(2)+'  τ=0.5 b='+FIT.q[0.5].b.toFixed(2)+'  τ=0.9 b='+FIT.q[0.9].b.toFixed(2), W*0.04, ry+80);

      var xMax=on?14:13, yMax=on?55:26;
      var px0=W*0.50, px1=W*0.965, pTop=26, pBot=232;
      function PX(v){ return px0+(v/xMax)*(px1-px0); }
      function PY(v){ return pBot-(v/yMax)*(pBot-pTop); }
      frame55(ctx,px0,px1,pTop,pBot,'x','y');
      for(var i=0;i<X.length;i++){
        var isOut=on && i===X.length-1;
        ctx.fillStyle=isOut?RED:TXT;
        ctx.beginPath(); ctx.arc(PX(X[i]),PY(Math.min(Y[i],yMax)),isOut?4.2:2.8,0,7); ctx.fill();
      }
      function line(fitv,colr,dash){
        ctx.strokeStyle=colr; ctx.lineWidth=dash?1.6:2.4; if(dash) ctx.setLineDash(dash);
        ctx.beginPath();
        var y0=fitv.a+fitv.b*0, y1=fitv.a+fitv.b*xMax;
        ctx.moveTo(PX(0),PY(Math.max(0,Math.min(y0,yMax)))); ctx.lineTo(PX(xMax),PY(Math.max(0,Math.min(y1,yMax))));
        ctx.stroke(); ctx.setLineDash([]);
      }
      line(FIT.q[0.1],GLD,[3,3]);
      line(FIT.q[0.9],PUR,[3,3]);
      line(FIT.q[0.5],GRN,null);
      line(FIT.ols,RED,null);
      ctx.font='11px sans-serif'; ctx.textAlign='left';
      ctx.fillStyle=RED; ctx.fillText('━ OLS(평균)', px0+4, pTop+12);
      ctx.fillStyle=GRN; ctx.fillText('━ τ=0.5(중위수)', px0+90, pTop+12);
      ctx.fillStyle=GLD; ctx.fillText('┅ τ=0.1', px0+200, pTop+12);
      ctx.fillStyle=PUR; ctx.fillText('┅ τ=0.9', px0+260, pTop+12);

      E.tapHint(W/2, H*0.95, '슬라이더로 이상값을 넣고 빼며 OLS와 중위수 회귀선이 실제로 얼마나 움직이는지 비교하세요', true);
      E.big('분위수 회귀 — 이상값에도 흔들리지 않는 선', '같은 12개 자료에 최소제곱(OLS)과 분위수 회귀(중위수 τ=0.5, 하위 τ=0.1, 상위 τ=0.9)를 실제로 적합했습니다. 이상값(x=13,y=52) 하나를 더하면 OLS의 기울기는 '+QR_NO55.ols.b.toFixed(2)+'→'+QR_OUT55.ols.b.toFixed(2)+'('+QR_OLS_DPCT55.toFixed(1)+'% 변화)로 크게 흔들리지만, 중위수 회귀의 기울기는 '+QR_NO55.q[0.5].b.toFixed(3)+'→'+QR_OUT55.q[0.5].b.toFixed(3)+'('+QR_MED_DPCT55.toFixed(2)+'% 변화)로 사실상 그대로입니다 — 평균은 극단값 하나에도 크게 끌려가지만 중앙값은 「가운데 순위」만 신경 쓰므로 자료 하나가 아무리 극단적이어도 영향이 제한적입니다. 하위·중위·상위 세 분위수 선을 함께 그리면 x가 커질수록 세 선의 간격이 벌어지는 것도 보이는데, 이는 y의 흩어진 정도(분산)가 x에 따라 커지는 이 자료의 실제 특징을 그대로 반영한 것입니다 — 평균 하나만 보는 회귀로는 이런 「퍼짐의 변화」를 알 수 없습니다.'); }
  },

  // ══════════ 55.3 베이즈 정리로 확률을 갱신하다 ══════════
  { id:'bda55_03',
    enter:function(E){ var self=this; self.s={acc:0.95, pi:2, k:1};
      E.controls('<div class="ctrl"><label>검사 정확도(민감도=특이도)</label><input type="range" id="b5503a" min="0.80" max="0.99" step="0.01" value="0.95"><output id="b5503ao">95%</output></div>'
               +'<div class="ctrl"><label>유병률</label><input type="range" id="b5503p" min="0" max="5" step="1" value="2"><output id="b5503po">1%</output></div>'
               +'<div class="ctrl"><label>연속 양성 반복 횟수</label><input type="range" id="b5503k" min="0" max="4" step="1" value="1"><output id="b5503ko">1회</output></div>');
      E.bind('#b5503a','input',function(e){ self.s.acc=+e.target.value; document.getElementById('b5503ao').textContent=Math.round(self.s.acc*100)+'%'; });
      E.bind('#b5503p','input',function(e){ self.s.pi=+e.target.value; document.getElementById('b5503po').textContent=PREV_LABEL55[self.s.pi]; });
      E.bind('#b5503k','input',function(e){ self.s.k=+e.target.value; document.getElementById('b5503ko').textContent=self.s.k+'회'; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var acc=s.acc, prev=PREV_OPTS55[s.pi], k=s.k;
      var chain=bayesChain55(prev,acc,4);
      var code=[
        'def posterior(prior, acc):',
        '    tp = acc*prior            # 참양성 비율',
        '    fp = (1-acc)*(1-prior)    # 거짓양성 비율',
        '    return tp / (tp+fp)       # 베이즈 정리',
        'prior = posterior(prior, acc)  # 반복 검사: 사후확률→다음 사전확률'
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.44, code, 'bayes_update.py', k>0?4:2);
      var N=100000, TP=acc*prev*N, FN=(1-acc)*prev*N, FP=(1-acc)*(1-prev)*N, TN=acc*(1-prev)*N;
      var ry=codeBot+16;
      ctx.textAlign='left'; ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('가정: 민감도=특이도='+Math.round(acc*100)+'%, 유병률='+PREV_LABEL55[s.pi]+', 인구 '+N.toLocaleString()+'명 기준', W*0.04, ry);
      // 2x2 population table
      var tx=W*0.04, ty=ry+14, cw=[62,68,68], rh=16;
      ctx.font='11px ui-monospace,Menlo,monospace';
      var headers=['','검사양성','검사음성'];
      var col0x=tx, col1x=tx+cw[0], col2x=tx+cw[0]+cw[1];
      ctx.fillStyle=DIM; ctx.fillText(headers[1], col1x, ty+11); ctx.fillText(headers[2], col2x, ty+11);
      ctx.fillStyle=TXT; ctx.fillText('실제양성', col0x, ty+11+rh);
      ctx.fillStyle=GRN; ctx.fillText(Math.round(TP).toLocaleString(), col1x, ty+11+rh);
      ctx.fillStyle=DIM; ctx.fillText(Math.round(FN).toLocaleString(), col2x, ty+11+rh);
      ctx.fillStyle=TXT; ctx.fillText('실제음성', col0x, ty+11+rh*2);
      ctx.fillStyle=RED; ctx.fillText(Math.round(FP).toLocaleString(), col1x, ty+11+rh*2);
      ctx.fillStyle=DIM; ctx.fillText(Math.round(TN).toLocaleString(), col2x, ty+11+rh*2);
      var ppv1=chain[1];
      ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=(ppv1<0.5?RED:GRN);
      ctx.fillText('양성예측도(1회 양성) = '+Math.round(TP)+'/('+Math.round(TP)+'+'+Math.round(FP)+') = '+(ppv1*100).toFixed(1)+'%', tx, ty+11+rh*2+22);
      if(k>1){
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD;
        var chainTxt=chain.slice(1,k+1).map(function(v){return (v*100).toFixed(1)+'%';}).join(' → ');
        wrapText(ctx, k+'회 연속 양성 갱신: '+chainTxt, tx, ty+11+rh*2+42, W*0.42, 15);
      }

      var px0=W*0.50, px1=W*0.965, pTop=26, pBot=232;
      function PX(kk){ return px0+(kk/4)*(px1-px0); }
      function PY(v){ return pBot-v*(pBot-pTop); }
      frame55(ctx,px0,px1,pTop,pBot,'','사후확률(발병 확률)');
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
      ctx.fillText('연속 양성 횟수', (px0+px1)/2, pBot+32);
      ctx.strokeStyle=BLU; ctx.lineWidth=2; ctx.beginPath();
      chain.forEach(function(v,i){ var x=PX(i), y=PY(v); if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); });
      ctx.stroke();
      chain.forEach(function(v,i){
        ctx.fillStyle=(i===k)?GLD:BLU; ctx.beginPath(); ctx.arc(PX(i),PY(v),(i===k)?4.6:3,0,7); ctx.fill();
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
        ctx.fillText(i===0?'사전':i+'회', PX(i), pBot+14);
      });
      ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD; ctx.textAlign='center';
      ctx.fillText((chain[k]*100).toFixed(1)+'%', PX(k), PY(chain[k])-10);

      E.tapHint(W/2, H*0.95, '정확도·유병률 슬라이더로 사후확률이, 반복 횟수 슬라이더로 확률이 갱신되는 과정을 실제로 보세요', true);
      E.big('베이즈 정리로 확률을 갱신하다', '검사 정확도(민감도=특이도) '+Math.round(acc*100)+'%, 유병률 '+PREV_LABEL55[s.pi]+'을 가정하면, 첫 양성 판정 후 실제로 병이 있을 확률(양성예측도)은 베이즈 정리로 정확히 '+(ppv1*100).toFixed(1)+'%로 계산됩니다 — <b>검사가 정확해도 병이 드물면 양성 판정자 대부분이 오진</b>이라는 뜻입니다. 인구 '+N.toLocaleString()+'명으로 환산하면 검사양성 '+Math.round(TP+FP).toLocaleString()+'명 중 실제 환자는 '+Math.round(TP).toLocaleString()+'명뿐이고 나머지 '+Math.round(FP).toLocaleString()+'명은 거짓양성입니다. 결정적인 것은 <b>사전확률(유병률)</b>이지 정확도가 아닙니다. 같은 검사를 독립적으로 반복해 연속 양성이 나오면 이전 사후확률이 다음 사전확률이 되어 값이 실제로 갱신됩니다 — 기본값(정확도 95%, 유병률 1%)에서는 '+(BAYES_DEFAULT55[1]*100).toFixed(1)+'%→'+(BAYES_DEFAULT55[2]*100).toFixed(1)+'%→'+(BAYES_DEFAULT55[3]*100).toFixed(1)+'%→'+(BAYES_DEFAULT55[4]*100).toFixed(1)+'%로 증거가 쌓일수록 확신이 빠르게 커집니다.'); }
  },

  // ══════════ 55.4 선형계획법 — 운송 최적화와 꼭짓점 정리 ══════════
  { id:'bda55_04',
    enter:function(E){ var self=this; self.s={ci:0};
      E.controls('<div class="ctrl"><label>탐색 후보 지점</label><input type="range" id="b5504c" min="0" max="'+(LP_CAND55.length-1)+'" step="1" value="0"><output id="b5504co">0</output></div>');
      E.bind('#b5504c','input',function(e){ self.s.ci=+e.target.value; document.getElementById('b5504co').textContent=self.s.ci+1; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var cand=LP_CAND55[s.ci];
      var code=[
        'from scipy.optimize import linprog',
        'res = linprog(c=[-1, 3],                    # 비용 정리식 계수',
        '  A_ub=[[1,1], [-1,-1]], b_ub=['+LP_S1_55+', '+(-(LP_D1_55+LP_D2_55-LP_S2_55))+'],',
        '  bounds=[(0,'+LP_D1_55+'), (0,'+LP_D2_55+')])',
        '# 최적해는 실행가능영역의 꼭짓점에서 나온다'
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.44, code, 'transport_lp.py', 4);
      var ry=codeBot+18;
      ctx.textAlign='left'; ctx.font='11.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=(cand.type==='꼭짓점')?GLD:DIM;
      ctx.fillText('현재 후보: '+cand.type+' (x='+cand.x+', y='+cand.y+')  비용='+cand.cost.toFixed(0), W*0.04, ry);
      var isMin=Math.abs(cand.cost-LP_MIN55.cost)<1e-6;
      ctx.fillStyle=isMin?GRN:RED;
      ctx.fillText(isMin?'→ 이 지점이 최적해입니다(비용 '+LP_MIN55.cost.toFixed(0)+', 최소)':'→ 최적 꼭짓점('+LP_MIN55.cost.toFixed(0)+')보다 '+(cand.cost-LP_MIN55.cost).toFixed(0)+' 더 비쌉니다', W*0.04, ry+19);
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
      wrapText(ctx,'창고1→매장1='+cand.x+', 창고1→매장2='+cand.y+', 창고2→매장1='+(LP_D1_55-cand.x)+', 창고2→매장2='+(LP_D2_55-cand.y), W*0.04, ry+40, W*0.42, 15);
      ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT;
      var vy=ry+72;
      LP_VERTS55.forEach(function(v,vi){
        ctx.fillStyle=(Math.abs(v.cost-LP_MIN55.cost)<1e-6)?GRN:TXT;
        ctx.fillText('꼭짓점('+v.x+','+v.y+') 비용='+v.cost.toFixed(0), W*0.04, vy+vi*15);
      });

      var px0=W*0.50, px1=W*0.965, pTop=26, pBot=232, xMax=70, yMax=60;
      function PX(v){ return px0+(v/xMax)*(px1-px0); }
      function PY(v){ return pBot-(v/yMax)*(pBot-pTop); }
      ctx.save(); ctx.beginPath(); ctx.rect(px0,pTop,px1-px0,pBot-pTop); ctx.clip();
      ctx.fillStyle='rgba(199,157,255,0.16)'; ctx.beginPath();
      LP_POLY55.forEach(function(p,i){ var x=PX(p.x),y=PY(p.y); if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); });
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle=PUR; ctx.lineWidth=1.6; ctx.stroke();
      ctx.restore();
      frame55(ctx,px0,px1,pTop,pBot,'창고1→매장1 (x)','창고1→매장2 (y)');
      LP_VERTS55.forEach(function(v){
        ctx.fillStyle=(Math.abs(v.cost-LP_MIN55.cost)<1e-6)?GRN:BLU;
        ctx.beginPath(); ctx.arc(PX(v.x),PY(v.y),4,0,7); ctx.fill();
      });
      ctx.fillStyle=GLD; ctx.beginPath(); ctx.arc(PX(cand.x),PY(cand.y),cand.type==='꼭짓점'?7:5.5,0,7);
      if(cand.type==='꼭짓점'){ ctx.stroke(); } else { ctx.fill(); }
      ctx.strokeStyle=GLD; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(PX(cand.x),PY(cand.y),8,0,7); ctx.stroke();
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
      ctx.fillText('보라색 영역 = 실행가능영역', px0+4, pTop+14);

      E.tapHint(W/2, H*0.95, '슬라이더로 후보 지점을 옮겨 비용을 비교하고, 최소값이 항상 꼭짓점에 있는지 확인하세요', true);
      E.big('선형계획법 — 운송 최적화와 꼭짓점 정리', '창고1(용량'+LP_S1_55+')·창고2(용량'+LP_S2_55+')에서 매장1(수요'+LP_D1_55+')·매장2(수요'+LP_D2_55+')로 배송하는 문제를 두 변수(x=창고1→매장1, y=창고1→매장2)로 정리하면, 제약을 만족하는 <b>실행가능영역</b>은 실제로 4개 꼭짓점을 가진 다각형이 됩니다. 이 다각형의 모든 변·꼭짓점·내부점의 비용을 실제로 계산해 비교하면, 4개 꼭짓점 중 (x='+LP_MIN55.x+', y='+LP_MIN55.y+')에서 비용 '+LP_MIN55.cost.toFixed(0)+'로 가장 낮고, 다각형 내부의 점('+LP_INTERIOR55.x+','+LP_INTERIOR55.y+')은 비용 '+LP_INTERIOR55.cost.toFixed(0)+'로 그보다 항상 높습니다 — 이것이 <b>선형계획법의 기본정리</b>: 목적함수가 직선(1차식)이면 실행가능영역이 아무리 넓어도 최적해는 반드시 꼭짓점에서 나옵니다. 최적해는 창고1→매장1 '+LP_MIN55.x+'개, 창고2→매장2 '+(LP_D2_55-LP_MIN55.y)+'개를 배송하고 창고1→매장2, 창고2→매장1은 보내지 않는 배분입니다.'); }
  },

  // ══════════ 55.5 결론을 답안 문장으로 옮기기 ══════════
  { id:'bda55_05',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; E.blip(360+this.s.step*60,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var flow=['가정 확인','기법·검정 선택 근거','공식대로 실제 계산','기준과 비교해 판단','결론 문장으로 서술'];
      var code=flow.map(function(t,i){ return (i+1)+') '+t; });
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, '결론 서술의 골격', s.step);
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
      wrapText(ctx,'모델링 문제의 답안 골격은 앞서 다뤘습니다 — 이 장에서는 통계적 판단·최적화 결과를 결론 문장으로 옮기는 법만 봅니다', W*0.04, codeBot+22, W*0.42, 16);

      var cards=[
        {tag:'개요', col:TXT, lines:['생존분석·분위수 회귀·베이즈·선형계획법 네 기법 모두','같은 흐름을 따릅니다 — 계산은 다르지만 결론 문장의','골격(왼쪽 5단계)은 똑같습니다.']},
        {tag:'생존분석', col:GRN, lines:['로그순위검정 χ²='+LR55.chi2.toFixed(2)+'(자유도1), p='+LR_P55.toFixed(3)+'로','유의수준 0.05보다 작으므로 두 집단의 생존곡선이','통계적으로 유의하게 다르다고 판단합니다. 7개월 시점','생존확률은 A(신약) '+(KMA55_D.filter(function(x){return x.t===7;})[0].S).toFixed(2)+' vs B(표준) '+(KMB55_D.filter(function(x){return x.t===7;})[0].S).toFixed(2)+'.']},
        {tag:'분위수 회귀', col:BLU, lines:['이상값 포함 시 OLS 기울기는 '+QR_NO55.ols.b.toFixed(2)+'→'+QR_OUT55.ols.b.toFixed(2)+'로','크게 흔들렸지만 중위수 회귀 기울기는 '+QR_NO55.q[0.5].b.toFixed(2)+'→'+QR_OUT55.q[0.5].b.toFixed(2)+'로','거의 그대로입니다. 이상값이 의심되는 자료라면','평균보다 중앙값 기반 결론이 더 안정적입니다.']},
        {tag:'베이즈 정리', col:GLD, lines:['정확도 95%, 유병률 1%에서 1회 양성 후 사후확률은','약 '+(BAYES_DEFAULT55[1]*100).toFixed(1)+'%에 불과합니다 — 결론에는 정확도가 아니라','사전확률(유병률)이 판단을 좌우한다는 근거를 반드시','적어야 합니다. 재검사로 사후확률을 갱신해야 합니다.']},
        {tag:'선형계획법', col:PUR, lines:['실행가능영역 꼭짓점 중 (x='+LP_MIN55.x+',y='+LP_MIN55.y+')에서','비용 '+LP_MIN55.cost.toFixed(0)+'로 최소이므로, 창고1→매장1 '+LP_MIN55.x+'개,','창고2→매장2 '+(LP_D2_55-LP_MIN55.y)+'개로 배송하는 것이 최적','배분이라고 결론 짓습니다.']}
      ];
      var card=cards[s.step];
      var bx=W*0.50, by=28, bw=W*0.965-bx, bh=204;
      ctx.fillStyle='rgba(255,255,255,0.035)'; ctx.strokeStyle='rgba(255,122,184,0.30)'; ctx.lineWidth=1;
      roundRect(ctx,bx,by,bw,bh,10); ctx.fill(); ctx.stroke();
      ctx.font='600 12.5px sans-serif'; ctx.fillStyle=card.col; ctx.textAlign='left';
      ctx.fillText((s.step+1)+'/5  '+card.tag+' 결론', bx+14, by+24);
      ctx.font='11.5px sans-serif'; ctx.fillStyle=TXT;
      var ly=by+48;
      card.lines.forEach(function(t){ ctx.fillText(t, bx+14, ly); ly+=19; });
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
      for(var d=0; d<5; d++){ ctx.fillStyle=(d===s.step)?card.col:'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.arc(bx+14+d*16, by+bh-14, 3.2, 0, 7); ctx.fill(); }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 기법의 결론 문장 보기', true);
      E.big('결론을 답안 문장으로 옮기기', '이 장에서 다룬 네 기법 — 생존분석·분위수 회귀·베이즈 정리·선형계획법 — 은 계산 방식은 저마다 다르지만 답안을 쓰는 순서는 똑같습니다: 가정을 확인하고, 왜 이 기법을 골랐는지 근거를 밝히고, 공식대로 실제 계산하고, 기준(유의수준·최솟값·임계값)과 비교해 판단하고, 그 판단을 문장으로 씁니다. 실기 채점은 최종 숫자만이 아니라 <b>계산 과정과 판단 기준을 답안에 함께 적었는지</b>를 봅니다 — 「χ²=7.31이므로 유의하다」보다 「χ²=7.31(자유도1), p=0.007<0.05이므로 귀무가설을 기각하고 두 집단의 생존곡선이 다르다고 판단한다」처럼 근거·비교·결론을 한 문장에 담아야 합니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
