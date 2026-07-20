/* 빅데이터 분석 제14장 — 데이터 전처리 (예측 모델링의 절반)
   동작(behavior)만. 텍스트=content/bda14.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 화면의 모든 수(평균·표준편차·왜도·공분산·고유값·상관계수·정확도)는 아래 고정 배열로부터
   draw/build에서 실제 계산(하드코딩 금지). 공분산행렬 고유벡터는 2×2 대칭행렬의 닫힌해로 직접 구현.
   난수 금지 — 모든 표본은 파일 상단 고정 배열. */
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
  function variance(a){ var m=mean(a),s=0,i; for(i=0;i<a.length;i++){ var d=a[i]-m; s+=d*d; } return s/a.length; }
  function stdev(a){ return Math.sqrt(variance(a)); }
  function skewness(a){ var m=mean(a),n=a.length,s2=0,s3=0,i;
    for(i=0;i<n;i++){ var d=a[i]-m; s2+=d*d; s3+=d*d*d; }
    var sd=Math.sqrt(s2/n); if(sd<1e-9) return 0;
    return (s3/n)/(sd*sd*sd); }
  function corr2(a,b){ var ma=mean(a),mb=mean(b),sa=0,sb=0,sab=0,i;
    for(i=0;i<a.length;i++){ var da=a[i]-ma, db=b[i]-mb; sa+=da*da; sb+=db*db; sab+=da*db; }
    return sab/Math.sqrt(sa*sb); }
  function boxcox(v,lam){ if(Math.abs(lam)<1e-6) return Math.log(v); return (Math.pow(v,lam)-1)/lam; }
  // 2×2 대칭행렬 [[a,b],[b,d]]의 고유값·고유벡터를 닫힌해로 직접 계산
  function eig2x2(a,b,d){
    var tr=a+d, diff=(a-d)/2, rad=Math.sqrt(diff*diff+b*b);
    var lam1=tr/2+rad, lam2=tr/2-rad;
    var theta=0.5*Math.atan2(2*b, a-d);
    return { lam1:lam1, lam2:lam2, theta:theta, v1:[Math.cos(theta),Math.sin(theta)], v2:[-Math.sin(theta),Math.cos(theta)] };
  }

  var scenes = [

  // ══════════ 1. 중심화와 척도화 ══════════
  { id:'bda14_01',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var income=[4550,8000,3100,8700,4200,6100,2900,7400,3600,5000];
      var age   =[60,31,31,45,29,38,24,55,33,41];
      var q=[4500,30];
      var mI=mean(income), sI=stdev(income), mA=mean(age), sA=stdev(age);
      var code=[
        {t:"scaler = StandardScaler()", hl:'StandardScaler'},
        {t:"Xz = scaler.fit_transform(X)", hl:'fit_transform'},
        {t:"# z = (x - 평균) / 표준편차", dim:true},
        {t:"nbrs = NearestNeighbors(n_neighbors=1)", hl:'NearestNeighbors'},
        {t:"nbrs.fit(Xz).kneighbors([qz])", hl:'.kneighbors('}
      ];
      var acti=[null,null,1,4][s.step];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'scale_demo.py', acti);
      var caps=['소득(만원)과 나이(세) — 두 특징의 눈금이 전혀 다릅니다',
                '거리를 재는 모델과 그렇지 않은 모델이 있습니다',
                '평균을 빼고 표준편차로 나눕니다 — 실제로 계산해 보죠',
                '표준화 전후, 가장 가까운 이웃이 바뀝니다'];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step], W*0.04, codeBot+22);

      var px0=W*0.47, px1=W*0.965;

      if(s.step===0){
        ctx.fillStyle=TXT; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('고객 10명 — 소득과 나이', px0, 28);
        var ty=68, rh=24;
        ctx.font='11.5px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
        ctx.fillStyle=DIM; ctx.fillText('소득(만원)', px0, ty-18); ctx.fillText('나이(세)', px0+150, ty-18);
        for(i=0;i<income.length;i++){
          ctx.fillStyle=(i===4)?GRN:TXT;
          ctx.fillText(income[i], px0, ty+i*rh);
          ctx.fillText(age[i], px0+150, ty+i*rh);
        }
        var qy=ty+income.length*rh+14;
        ctx.fillStyle=GLD; ctx.font='600 12px ui-monospace,Menlo,monospace';
        ctx.fillText('질문 고객 q = (소득 '+q[0]+', 나이 '+q[1]+')', px0, qy);
        ctx.fillStyle=DIM; ctx.font='11px sans-serif';
        ctx.fillText('소득은 수천 단위, 나이는 두 자릿수 — 눈금 차이가 100배 가까이 납니다', px0, qy+20);
        ctx.fillText('이 상태로 "거리"를 재면 어느 쪽이 결과를 좌우할까요?', px0, qy+38);
      } else if(s.step===1){
        ctx.fillStyle=TXT; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('거리에 민감한 모델 vs 둔감한 모델', px0, 32);
        var bw=(px1-px0-16)/2, bh=118, by=48;
        roundRect(ctx,px0,by,bw,bh,8); ctx.fillStyle='rgba(255,122,184,0.10)'; ctx.strokeStyle=ROSE; ctx.lineWidth=1; ctx.fill(); ctx.stroke();
        ctx.fillStyle=ROSE; ctx.font='600 12.5px sans-serif'; ctx.fillText('민감함 — 척도화 필수', px0+10, by+22);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('k-최근접 이웃(거리)', px0+10, by+44);
        ctx.fillText('SVM · k-평균(거리)', px0+10, by+62);
        ctx.fillText('선형·로지스틱회귀(계수 벌점)', px0+10, by+80);
        ctx.fillText('큰 눈금의 변수가 거리를 독식', px0+10, by+100);
        var bx2=px0+bw+16;
        roundRect(ctx,bx2,by,bw,bh,8); ctx.fillStyle='rgba(126,224,176,0.10)'; ctx.strokeStyle=GRN; ctx.fill(); ctx.stroke();
        ctx.fillStyle=GRN; ctx.font='600 12.5px sans-serif'; ctx.fillText('둔감함 — 굳이 필요 없음', bx2+10, by+22);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('의사결정나무 · 랜덤포레스트', bx2+10, by+44);
        ctx.fillText('그레이디언트 부스팅', bx2+10, by+62);
        ctx.fillText('변수 하나씩 기준값으로 나눔', bx2+10, by+80);
        ctx.fillText('눈금이 달라도 분기 순서는 그대로', bx2+10, by+100);
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif'; ctx.textAlign='left';
        ctx.fillText('오늘은 k-최근접 이웃으로 척도화의 효과를 직접 확인합니다', px0, by+bh+26);
      } else if(s.step===2){
        ctx.fillStyle=TXT; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('StandardScaler — 평균 빼고 표준편차로 나누기', px0, 32);
        ctx.font='12.5px ui-monospace,Menlo,monospace';
        ctx.fillStyle=BLU; ctx.fillText('소득: 평균='+mI.toFixed(0)+', 표준편차='+sI.toFixed(0), px0, 60);
        ctx.fillStyle=GLD; ctx.fillText('나이: 평균='+mA.toFixed(1)+', 표준편차='+sA.toFixed(1), px0, 82);
        ctx.fillStyle=TXT; ctx.font='12px sans-serif';
        ctx.fillText('고객5(소득 '+income[4]+', 나이 '+age[4]+')를 표준화하면', px0, 112);
        var z0=(income[4]-mI)/sI, z1=(age[4]-mA)/sA;
        ctx.font='12.5px ui-monospace,Menlo,monospace'; ctx.fillStyle=GRN;
        ctx.fillText('z = (('+income[4]+'-'+mI.toFixed(0)+')/'+sI.toFixed(0)+',  ('+age[4]+'-'+mA.toFixed(1)+')/'+sA.toFixed(1)+')', px0, 134);
        ctx.fillText('  = ('+z0.toFixed(2)+',  '+z1.toFixed(2)+')', px0, 156);
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
        ctx.fillText('두 값 모두 "평균에서 표준편차 몇 개만큼 떨어졌는가"라는 같은 잣대가 됩니다', px0, 186);
        ctx.fillText('이제 소득과 나이가 동등한 무게로 거리 계산에 들어갑니다', px0, 206);
      } else {
        function distRaw(idx){ var d0=income[idx]-q[0], d1=age[idx]-q[1]; return Math.sqrt(d0*d0+d1*d1); }
        function distStd(idx){ var zi=(income[idx]-mI)/sI, za=(age[idx]-mA)/sA;
          var zq0=(q[0]-mI)/sI, zq1=(q[1]-mA)/sA; var d0=zi-zq0, d1=za-zq1; return Math.sqrt(d0*d0+d1*d1); }
        var rawD=[],stdD=[],i2;
        for(i2=0;i2<income.length;i2++){ rawD.push(distRaw(i2)); stdD.push(distStd(i2)); }
        function argmin(a){ var mi=0; for(var j=1;j<a.length;j++) if(a[j]<a[mi]) mi=j; return mi; }
        var winRaw=argmin(rawD), winStd=argmin(stdD);
        ctx.fillStyle=TXT; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('같은 질문, 다른 답 — 가장 가까운 이웃', px0, 30);
        ctx.font='12px ui-monospace,Menlo,monospace';
        ctx.fillStyle=RED; ctx.fillText('원값 거리 1등 → 고객'+(winRaw+1)+' (소득'+income[winRaw]+', 나이'+age[winRaw]+')', px0, 54);
        ctx.fillStyle=DIM; ctx.font='11px sans-serif';
        ctx.fillText('거리='+rawD[winRaw].toFixed(1)+' — 소득이 가깝다는 이유로 뽑혔지만 나이는 30살이나 차이납니다', px0, 72);
        ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=GRN;
        ctx.fillText('표준화 거리 1등 → 고객'+(winStd+1)+' (소득'+income[winStd]+', 나이'+age[winStd]+')', px0, 100);
        ctx.fillStyle=DIM; ctx.font='11px sans-serif';
        ctx.fillText('거리='+stdD[winStd].toFixed(3)+' — 소득·나이 둘 다 질문 고객과 실제로 가깝습니다', px0, 118);
        // mini scatter
        var sx0=px0, sx1=px1, sy0=140, sy1=272;
        var xMin=2500,xMax=9000,yMin=15,yMax=65;
        function PX(v){ return sx0+(v-xMin)/(xMax-xMin)*(sx1-sx0); }
        function PY(v){ return sy1-(v-yMin)/(yMax-yMin)*(sy1-sy0); }
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
        ctx.strokeRect(sx0,sy0,sx1-sx0,sy1-sy0);
        for(i2=0;i2<income.length;i2++){
          ctx.fillStyle=(i2===winRaw)?RED:(i2===winStd?GRN:'rgba(155,153,163,0.6)');
          ctx.beginPath(); ctx.arc(PX(income[i2]),PY(age[i2]),(i2===winRaw||i2===winStd)?6:3.5,0,7); ctx.fill();
        }
        ctx.fillStyle=GLD; ctx.beginPath(); ctx.arc(PX(q[0]),PY(q[1]),6,0,7); ctx.fill();
        ctx.strokeStyle=GLD; ctx.lineWidth=1.4; ctx.stroke();
        ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillStyle=GLD;
        ctx.fillText('★질문 q', PX(q[0])+8, PY(q[1])-6);
        ctx.fillStyle=DIM; ctx.font='11px sans-serif';
        ctx.fillText('가로=소득, 세로=나이 — 빨강(원값 1등) · 초록(표준화 1등)', px0, sy1+18);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (데이터 → 민감모델 → 표준화 → 이웃 비교)', true);
      E.big('중심화와 척도화', '거리로 판단하는 모델은 눈금이 큰 변수에 휘둘립니다. 소득(수천 단위)과 나이(두 자릿수)를 그대로 두고 최근접 이웃을 찾으면, 소득 몇백만 원 차이가 나이 30년 차이보다 "더 가깝다"는 이상한 결론에 도달합니다. 평균을 빼고 표준편차로 나누는 표준화(centering and scaling)를 실제로 계산해 적용하면, 두 변수가 동등한 잣대로 비교되어 진짜로 비슷한 이웃(나이도 가깝고 소득도 가까운 사람)을 찾아냅니다 — 표를 눈으로 봐도 알기 어려운 이 차이가 계산으로는 선명하게 드러납니다.'); }
  },

  // ══════════ 2. 치우친 분포 바로잡기 ══════════
  { id:'bda14_02',
    enter:function(E){ var self=this;
      var x=[6,7,9,10,12,15,18,22,27,32,39,47,57,69];
      var lamGrid=[]; for(var lam=-2; lam<=2.0001; lam+=0.1) lamGrid.push(+lam.toFixed(2));
      var curve=lamGrid.map(function(lam){ return Math.abs(skewness(x.map(function(v){return boxcox(v,lam);}))); });
      var best=null;
      for(var i=0;i<lamGrid.length;i++) if(best===null||curve[i]<best.sk) best={lam:lamGrid[i], sk:curve[i], idx:i};
      self.s={x:x, lamGrid:lamGrid, curve:curve, best:best, lam:0};
      E.controls('<div class="ctrl"><label>변환 강도 λ (Box-Cox류)</label><input type="range" id="b142lam" min="-2" max="2" step="0.1" value="0"><output id="b142lamo">0.0</output></div>');
      E.bind('#b142lam','input',function(e){ self.s.lam=+e.target.value; document.getElementById('b142lamo').textContent=self.s.lam.toFixed(1); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var x=s.x, rawSkew=skewness(x), logSkew=skewness(x.map(function(v){return boxcox(v,0);}));
      var code=[
        {t:"pt = PowerTransformer(method='box-cox')", hl:'PowerTransformer'},
        {t:'x_t = pt.fit_transform(x)', hl:'.fit_transform('},
        {t:'skew(x)      # 변환 전', hl:'skew(x)'},
        {t:'skew(x_t)    # 변환 후', hl:'skew(x_t)'},
        {t:'pt.lambdas_  # 찾아낸 λ', hl:'lambdas_'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'fix_skew.py', 4);
      var curSkew=Math.abs(skewness(x.map(function(v){return boxcox(v,s.lam);})));
      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=RED; ctx.fillText('원값 왜도 = '+rawSkew.toFixed(3)+'  (오른쪽으로 길게 늘어짐)', W*0.04, ry);
      ctx.fillStyle=GLD; ctx.fillText('로그(λ=0) 왜도 = '+logSkew.toFixed(3), W*0.04, ry+19);
      ctx.fillStyle=GRN; ctx.fillText('λ='+s.lam.toFixed(1)+' 왜도 = '+curSkew.toFixed(3), W*0.04, ry+38);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif';
      ctx.fillText('왜도 0에 가까울수록 좌우로 균형 잡힌 분포입니다', W*0.04, ry+60);
      ctx.fillText('슬라이더로 λ를 움직여 왜도가 0에 가장 가까워지는 지점을 찾아보세요', W*0.04, ry+80);

      var px0=W*0.47, px1=W*0.965, pTop=42, pBot=230;
      var yMax=Math.max.apply(null,s.curve)+0.1;
      function PXl(lam){ return px0+(lam+2)/4*(px1-px0); }
      function PYs(sk){ return pBot-(sk/yMax)*(pBot-pTop); }
      ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillStyle=TXT;
      ctx.fillText('|왜도| vs λ — 격자 탐색(-2..2, 0.1 간격)', px0, 14);
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px0,pTop); ctx.lineTo(px0,pBot); ctx.stroke();
      ctx.strokeStyle=BLU; ctx.lineWidth=2; ctx.beginPath();
      for(i=0;i<s.lamGrid.length;i++){ var x2=PXl(s.lamGrid[i]), y2=PYs(s.curve[i]); if(i===0) ctx.moveTo(x2,y2); else ctx.lineTo(x2,y2); }
      ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center';
      for(var lv=-2; lv<=2.001; lv+=1){ ctx.fillText(lv.toFixed(0), PXl(lv), pBot+16);
        ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.moveTo(PXl(lv),pBot); ctx.lineTo(PXl(lv),pBot+4); ctx.stroke(); }
      ctx.strokeStyle=GRN; ctx.setLineDash([4,3]); ctx.lineWidth=1.4;
      ctx.beginPath(); ctx.moveTo(PXl(s.best.lam),pTop); ctx.lineTo(PXl(s.best.lam),pBot); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=GRN; ctx.font='600 11px sans-serif'; ctx.textAlign='center';
      ctx.fillText('λ*='+s.best.lam.toFixed(1), PXl(s.best.lam), pTop-10);
      ctx.fillStyle=GLD; ctx.beginPath(); ctx.arc(PXl(s.lam),PYs(curSkew),5,0,7); ctx.fill();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left';
      ctx.fillText('금색 점 = 현재 슬라이더 위치 · 초록 점선 = 격자 탐색이 찾은 λ*', px0, pBot+34);

      // mini histogram of raw x at bottom-right
      var hx0=px0, hx1=px1, hy0=pBot+50, hy1=pBot+80;
      var xmax=Math.max.apply(null,x);
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
      ctx.fillText('원값 분포(오른쪽 꼬리가 깁니다):', hx0, hy0-6);
      for(i=0;i<x.length;i++){
        var bx=hx0+(x[i]/xmax)*(hx1-hx0-8);
        ctx.fillStyle=RED; ctx.beginPath(); ctx.arc(bx, hy0+ (i%3)*9, 3,0,7); ctx.fill();
      }

      E.tapHint(W/2, H*0.93, '슬라이더로 λ를 조절해 왜도가 0에 가장 가까운 지점을 찾아보세요', true);
      E.big('치우친 분포 바로잡기', '오른쪽으로 길게 늘어진(치우친) 변수는 원값 왜도가 '+rawSkew.toFixed(2)+'로 큽니다. 로그를 취하면(λ=0) 왜도가 '+logSkew.toFixed(2)+'로 거의 0에 가까워지는데, 이는 우연이 아니라 이 변수가 원래 "로그를 취하면 대칭이 되는" 형태였기 때문입니다. λ를 -2부터 2까지 격자로 훑어 |왜도|를 실제로 계산하면 λ*≈'+s.best.lam.toFixed(1)+' 근방이 가장 대칭에 가깝다는 것이 드러납니다 — 제곱근(λ=0.5)은 절반만 고쳐주고, 로그가 이 데이터에는 거의 정답입니다.'); }
  },

  // ══════════ 3. 차원을 줄이다 — 주성분 ══════════
  { id:'bda14_03',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var width =[12,13,15,11,17,14,16,13,18,12,15,19,14,16,13];
      var noise =[1,-1,2,0,-2,1,0,-1,2,-2,1,0,-1,2,0];
      var length=width.map(function(w,idx){return Math.round(w*2.4+noise[idx]);});
      var mw=mean(width), ml=mean(length);
      var varW=variance(width), varL=variance(length);
      var covWL=0; for(i=0;i<width.length;i++) covWL+=(width[i]-mw)*(length[i]-ml); covWL/=width.length;
      var r=corr2(width,length);
      var eig=eig2x2(varW,covWL,varL);
      var totalVar=eig.lam1+eig.lam2;

      var code=[
        {t:'X = df[["width","length"]].values', dim:true},
        {t:'Xc = X - X.mean(axis=0)', hl:'X.mean('},
        {t:'cov = np.cov(Xc, rowvar=False)', hl:'np.cov'},
        {t:'vals, vecs = np.linalg.eigh(cov)', hl:'eigh'},
        {t:'ratio = vals / vals.sum()', hl:'vals.sum()'}
      ];
      var acti=[1,2,3,4][s.step];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'pca_2d.py', acti);
      var caps=['세포 폭과 길이 — 두 변수가 함께 움직입니다',
                '공분산행렬로 "함께 움직이는 정도"를 잽니다',
                '고유벡터 방향으로 데이터를 회전시킵니다',
                '첫 축이 정보를 얼마나 담았는지 봅니다'];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step], W*0.04, codeBot+22);

      var px0=W*0.47, px1=W*0.965;
      var sx0=px0, sx1=px1, sy0=44, sy1=252;
      var xMin=9,xMax=21,yMin=22,yMax=50;
      function PX(v){ return sx0+(v-xMin)/(xMax-xMin)*(sx1-sx0); }
      function PY(v){ return sy1-(v-yMin)/(yMax-yMin)*(sy1-sy0); }

      if(s.step===0){
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('세포 15개 — 폭(가로) vs 길이(세로)', px0, 30);
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1; ctx.strokeRect(sx0,sy0,sx1-sx0,sy1-sy0);
        for(i=0;i<width.length;i++){ ctx.fillStyle=ROSE; ctx.beginPath(); ctx.arc(PX(width[i]),PY(length[i]),4,0,7); ctx.fill(); }
        ctx.fillStyle=GLD; ctx.font='600 12px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
        ctx.fillText('상관계수 r = '+r.toFixed(3), px0, sy1+22);
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
        ctx.fillText('폭이 큰 세포는 길이도 거의 항상 큽니다 — 사실상 "하나의 정보"를 두 변수로 중복 기록', px0, sy1+42);
      } else if(s.step===1){
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('공분산행렬 — 실제로 계산한 값', px0, 30);
        var mx=px0+40, my=60, cs=100;
        ctx.font='13px ui-monospace,Menlo,monospace'; ctx.textAlign='center';
        ctx.fillStyle=DIM; ctx.fillText('폭', mx+cs*0.5, my-14); ctx.fillText('길이', mx+cs*1.5, my-14);
        function cell(cx,cy,val,col){ roundRect(ctx,cx-45,cy-16,90,32,6); ctx.fillStyle=col+'26'; ctx.strokeStyle=col; ctx.lineWidth=1; ctx.fill(); ctx.stroke();
          ctx.fillStyle=col; ctx.font='600 13px ui-monospace,Menlo,monospace'; ctx.fillText(val.toFixed(2), cx, cy+5); }
        cell(mx+cs*0.5, my+cs*0.5, varW, BLU); cell(mx+cs*1.5, my+cs*0.5, covWL, GLD);
        cell(mx+cs*0.5, my+cs*1.5, covWL, GLD); cell(mx+cs*1.5, my+cs*1.5, varL, GRN);
        var matrixBot = my+cs*1.5+16;
        ctx.textAlign='left'; ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('대각선(파랑·초록) = 각 변수의 분산, 나머지(금) = 공분산', px0, matrixBot+26);
        ctx.fillText('공분산이 클수록 두 변수가 강하게 "함께" 흔들린다는 뜻입니다', px0, matrixBot+46);
      } else if(s.step===2){
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('고유벡터 방향(주성분 축)을 겹쳐 그리면', px0, 30);
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1; ctx.strokeRect(sx0,sy0,sx1-sx0,sy1-sy0);
        for(i=0;i<width.length;i++){ ctx.fillStyle='rgba(255,122,184,0.55)'; ctx.beginPath(); ctx.arc(PX(width[i]),PY(length[i]),3.5,0,7); ctx.fill(); }
        var cx=PX(mw), cy=PY(ml);
        var L1=90, L2=35;
        ctx.strokeStyle=GLD; ctx.lineWidth=2.2;
        ctx.beginPath(); ctx.moveTo(cx-eig.v1[0]*L1, cy+eig.v1[1]*L1); ctx.lineTo(cx+eig.v1[0]*L1, cy-eig.v1[1]*L1); ctx.stroke();
        ctx.strokeStyle=GRN; ctx.lineWidth=1.8;
        ctx.beginPath(); ctx.moveTo(cx-eig.v2[0]*L2, cy+eig.v2[1]*L2); ctx.lineTo(cx+eig.v2[0]*L2, cy-eig.v2[1]*L2); ctx.stroke();
        ctx.fillStyle=GLD; ctx.font='600 12px sans-serif'; ctx.textAlign='left';
        ctx.fillText('PC1 (λ='+eig.lam1.toFixed(2)+')', cx+eig.v1[0]*L1+8, cy-eig.v1[1]*L1);
        ctx.fillStyle=GRN; ctx.fillText('PC2 (λ='+eig.lam2.toFixed(2)+')', cx+eig.v2[0]*L2+8, cy-eig.v2[1]*L2-8);
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
        ctx.fillText('데이터가 가장 많이 흩어진 방향(PC1)이 자동으로 찾아졌습니다', px0, sy1+22);
      } else {
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('설명 분산 비율 — 실제 계산', px0, 32);
        var by=54, bh=40, bw=(px1-px0-16);
        var r1=eig.lam1/totalVar, r2=eig.lam2/totalVar;
        ctx.fillStyle=GLD+'55'; ctx.strokeStyle=GLD; ctx.lineWidth=1.2;
        ctx.fillRect(px0,by,bw*r1,bh); ctx.strokeRect(px0,by,bw*r1,bh);
        ctx.fillStyle=GLD; ctx.font='600 13px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
        ctx.fillText('PC1 = '+(r1*100).toFixed(1)+'%', px0+10, by+bh/2+5);
        var by2=by+bh+14;
        ctx.fillStyle=GRN+'55'; ctx.strokeStyle=GRN;
        ctx.fillRect(px0,by2,Math.max(2,bw*r2),bh); ctx.strokeRect(px0,by2,Math.max(2,bw*r2),bh);
        ctx.fillStyle=GRN; ctx.fillText('PC2 = '+(r2*100).toFixed(1)+'%', px0+10, by2+bh/2+5);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('첫 축 하나로 전체 분산의 '+(r1*100).toFixed(0)+'%를 설명합니다', px0, by2+bh+34);
        ctx.fillText('폭·길이 두 변수를 PC1 하나로 줄여도 정보 손실이 거의 없다는 뜻입니다', px0, by2+bh+54);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (산점도 → 공분산 → 고유벡터 → 설명분산)', true);
      E.big('차원을 줄이다 — 주성분', '세포의 폭과 길이는 상관계수 '+r.toFixed(2)+'로 거의 같은 정보를 중복해서 담고 있습니다. 공분산행렬을 실제로 계산하고, 2×2 대칭행렬의 고유값·고유벡터를 닫힌해로 직접 구하면 데이터가 가장 많이 흩어진 방향(첫 번째 주성분)이 드러납니다. 이 예제에서 첫 축 하나가 전체 분산의 '+((eig.lam1/totalVar)*100).toFixed(0)+'%를 설명합니다 — 두 변수를 하나로 압축해도 정보를 거의 잃지 않는다는 것을 계산으로 확인한 것입니다.'); }
  },

  // ══════════ 4. 쓸모없는·해로운 변수 걸러내기 ══════════
  { id:'bda14_04',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i,j;
      var ch1=[120,135,110,142,128,119,133,125,140,115,130,122];
      var width=[12,13,11,14,12,11,13,12,14,11,13,12];
      var boundary=[27,28,24,33,25,24,30,25,32,24,29,27];
      var flag=[0,0,0,0,0,1,0,0,0,0,0,0];
      var noise=[5,2,8,3,9,1,7,4,6,2,8,3];
      var N=12;
      var vars={ch1:ch1, width:width, boundary:boundary, noise:noise};
      var names=['ch1_강도','폭','경곗값','noise'];
      var keys=['ch1','width','boundary','noise'];

      function greedyRemove(varsObj, thresh){
        var ks=keys.slice(), removed=[], steps=[];
        while(true){
          var maxAbs=0, pair=null;
          for(var a=0;a<ks.length;a++) for(var b=a+1;b<ks.length;b++){
            var c=Math.abs(corr2(varsObj[ks[a]],varsObj[ks[b]]));
            if(c>maxAbs){ maxAbs=c; pair=[ks[a],ks[b]]; }
          }
          if(maxAbs<=thresh || !pair) break;
          function avgC(k){ var s2=0,c2=0; ks.forEach(function(k2){ if(k2!==k){ s2+=Math.abs(corr2(varsObj[k],varsObj[k2])); c2++; } }); return c2?s2/c2:0; }
          var a1=avgC(pair[0]), a2=avgC(pair[1]);
          var rm = a1>=a2?pair[0]:pair[1];
          steps.push({pair:pair,maxAbs:maxAbs,rm:rm});
          removed.push(rm); ks.splice(ks.indexOf(rm),1);
        }
        return {remaining:ks, removed:removed, steps:steps};
      }
      var greedy=greedyRemove(vars,0.75);

      var uniqCnt={}; flag.forEach(function(v){ uniqCnt[v]=(uniqCnt[v]||0)+1; });
      var freqs=Object.keys(uniqCnt).map(function(k){return uniqCnt[k];}).sort(function(a,b){return b-a;});
      var uniqRatio=Object.keys(uniqCnt).length/N*100, freqRatio=freqs[0]/(freqs[1]||1);

      var code=[
        {t:"sel = VarianceThreshold()", hl:'VarianceThreshold'},
        {t:'sel.fit(X)  # 근사 0분산 제거', hl:'.fit('},
        {t:'corr = X.corr().abs()', hl:'.corr('},
        {t:'# 최대상관쌍 반복 제거(임계 0.75)', dim:true},
        {t:'X_reduced = X[kept_cols]', hl:'kept_cols'}
      ];
      var acti=[null,1,2,4][s.step];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'filter_vars.py', acti);
      var caps=['변수 5개 — 다 쓸모 있을까요',
                '거의 안 변하는 변수를 찾습니다',
                '서로 닮은 변수를 상관행렬로 찾습니다',
                '반복 제거 후, 남은 변수 수를 셉니다'];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step], W*0.04, codeBot+22);

      var px0=W*0.47, px1=W*0.965;

      if(s.step===0){
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('원본 변수 5개 (관측 12건)', px0, 30);
        var ty=54, rh=26;
        var allVars={'ch1_강도':ch1,'폭':width,'경곗값':boundary,'flag_rare':flag,'noise':noise};
        var allNames=Object.keys(allVars);
        for(i=0;i<allNames.length;i++){
          var arr=allVars[allNames[i]];
          ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=(allNames[i]==='flag_rare')?GLD:TXT;
          ctx.fillText(allNames[i], px0, ty+i*rh);
          ctx.fillStyle=DIM; ctx.font='11px ui-monospace,Menlo,monospace';
          ctx.fillText('분산='+variance(arr).toFixed(1), px0+130, ty+i*rh);
        }
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
        ctx.fillText('flag_rare는 분산이 유난히 작고, 폭·경곗값은 서로 닮아 보입니다', px0, ty+allNames.length*rh+16);
      } else if(s.step===1){
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('flag_rare — 근사 0분산 판정', px0, 30);
        var by=50, bh=30, bw=(px1-px0-16);
        var w0=bw*(freqs[0]/N), w1=bw*((freqs[1]||0)/N);
        ctx.fillStyle='rgba(126,224,176,0.32)'; ctx.strokeStyle=GRN; ctx.lineWidth=1.2;
        ctx.fillRect(px0,by,w0,bh); ctx.strokeRect(px0,by,w0,bh);
        ctx.fillStyle='rgba(240,136,138,0.32)'; ctx.strokeStyle=RED;
        ctx.fillRect(px0+w0,by,w1,bh); ctx.strokeRect(px0+w0,by,w1,bh);
        ctx.font='600 11.5px ui-monospace,Menlo,monospace'; ctx.textAlign='center'; ctx.fillStyle=GRN;
        ctx.fillText('0값 '+freqs[0]+'건', px0+w0/2, by+19);
        ctx.fillStyle=RED; ctx.fillText('1값 '+(freqs[1]||0)+'건', px0+w0+w1/2, by+19);
        ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD;
        ctx.fillText('고유값 비율 = '+uniqRatio.toFixed(1)+'%  (전체 12건 중 서로 다른 값은 2개뿐)', px0, by+bh+30);
        ctx.fillText('최다/차다 빈도비 = '+freqRatio.toFixed(1)+'배', px0, by+bh+50);
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
        ctx.fillText('두 기준 모두 "거의 한 값만 반복된다"는 신호 — 이 변수는 제거 대상입니다', px0, by+bh+76);
      } else if(s.step===2){
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('상관행렬 (숫자 변수 4개)', px0, 30);
        var cs=52, mx=px0+70, my=50;
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.textAlign='center';
        for(i=0;i<4;i++){ ctx.fillStyle=DIM; ctx.fillText(names[i], mx+cs*(i+0.5), my-8); ctx.fillText(names[i], mx-40, my+cs*(i+0.5)+4); }
        for(i=0;i<4;i++) for(j=0;j<4;j++){
          var c=corr2(vars[keys[i]],vars[keys[j]]);
          var t=(c+1)/2;
          var col = (i===j)?'rgba(255,255,255,0.10)' : ('rgba('+Math.round(240-100*t)+','+Math.round(120+100*t)+','+Math.round(140)+',0.45)');
          ctx.fillStyle=col; ctx.fillRect(mx+cs*i, my+cs*j, cs-3, cs-3);
          ctx.fillStyle=(Math.abs(c)>0.75&&i!==j)?'#1a1420':TXT; ctx.font='600 11px ui-monospace,Menlo,monospace';
          ctx.fillText(c.toFixed(2), mx+cs*i+(cs-3)/2, my+cs*j+(cs-3)/2+4);
        }
        ctx.textAlign='left'; ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
        ctx.fillText('가장 진한 칸(폭 · 경곗값) = 상관 '+corr2(width,boundary).toFixed(2)+' — 임계 0.75를 넘습니다', px0, my+4*cs+22);
      } else {
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('반복 제거 — 실제 알고리즘 진행', px0, 30);
        var ty2=52;
        ctx.font='12px ui-monospace,Menlo,monospace';
        greedy.steps.forEach(function(st,idx){
          ctx.fillStyle=RED; ctx.fillText((idx+1)+') '+st.pair[0]+' · '+st.pair[1]+' 상관 '+st.maxAbs.toFixed(2)+' → "'+st.rm+'" 제거', px0, ty2+idx*24);
        });
        var by3=ty2+greedy.steps.length*24+20;
        ctx.font='600 13px ui-monospace,Menlo,monospace';
        ctx.fillStyle=RED; ctx.fillText('제거 전: 5개 (flag_rare 포함)', px0, by3);
        ctx.fillStyle=GRN; ctx.fillText('제거 후: '+(greedy.remaining.length)+'개 ('+greedy.remaining.map(function(k){return names[keys.indexOf(k)];}).join(', ')+')', px0, by3+24);
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
        ctx.fillText('근사 0분산 1개 + 상관필터 '+greedy.removed.length+'개 = 총 '+(1+greedy.removed.length)+'개 제거', px0, by3+50);
        ctx.fillText('남은 변수만으로도 원래 정보의 핵심은 거의 그대로 남습니다', px0, by3+70);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (변수목록 → 근사0분산 → 상관행렬 → 반복제거)', true);
      E.big('쓸모없는·해로운 변수 걸러내기', '거의 변하지 않는 변수(flag_rare, 고유값 비율 '+uniqRatio.toFixed(0)+'%·빈도비 '+freqRatio.toFixed(1)+'배)는 모델에 거의 정보를 주지 못합니다. 서로 너무 닮은 변수(폭·경곗값, 상관 '+corr2(width,boundary).toFixed(2)+')는 같은 정보를 중복해서 담고 있어 모델을 불안정하게 만들 수 있습니다. 상관행렬을 실제로 계산하고, 가장 높은 상관쌍을 찾아 평균상관이 더 큰 쪽을 반복해서 제거하는 알고리즘을 그대로 적용하면 5개였던 변수가 '+greedy.remaining.length+'개로 줄어듭니다 — 정보는 거의 그대로 남긴 채로.'); }
  },

  // ══════════ 5. 사례: 세포 이미지 품질 판정 ══════════
  { id:'bda14_05',
    enter:function(E){ var self=this;
      var ch1=[118,132,108,140,126,121,135,124,138,113,129,120,131,116,141,109,127,134,112,137];
      var width=[11,13,10,14,12,11,13,12,14,10,13,11,13,11,14,10,12,13,10,14];
      var boundary=[25,30,24,32,28,26,30,28,33,23,30,25,31,25,48,23,29,30,23,53];
      var flag=[0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0];
      var noise=[52,18,81,29,95,11,67,41,58,23,88,32,49,92,15,71,38,64,22,85];
      var y=[0,1,1,1,1,0,1,0,1,1,1,0,1,0,1,0,0,1,0,1];
      var N=20;
      var logb = boundary.map(function(v){ return Math.log(v); });

      function standardizeTrTe(Xtr,Xte){
        var ncol=Xtr[0].length, means=[], sds=[],c,r;
        for(c=0;c<ncol;c++){ var s=0; for(r=0;r<Xtr.length;r++)s+=Xtr[r][c]; var m=s/Xtr.length;
          var v=0; for(r=0;r<Xtr.length;r++){var d=Xtr[r][c]-m; v+=d*d;} v/=Xtr.length;
          means.push(m); sds.push(v>1e-9?Math.sqrt(v):1); }
        function tr(X){ return X.map(function(row){ return row.map(function(x,c2){ return (x-means[c2])/sds[c2]; }); }); }
        return {trS:tr(Xtr), teS:tr(Xte)};
      }
      function knnPred(Xtr,Ytr,Xte,k){
        return Xte.map(function(xte){
          var d=Xtr.map(function(xtr,j){ var s=0; for(var c=0;c<xte.length;c++){var df=xte[c]-xtr[c]; s+=df*df;} return [s,Ytr[j]]; });
          d.sort(function(a,b){return a[0]-b[0];});
          var sum=0; for(var m=0;m<k;m++) sum+=d[m][1];
          return sum*2>=k?1:0;
        });
      }
      function accOf(yy,p){ var c=0; for(var i=0;i<yy.length;i++) if(yy[i]===p[i]) c++; return c/yy.length; }
      function buildRaw(idxs){ return idxs.map(function(i){ return [ch1[i],width[i],boundary[i],flag[i],noise[i]]; }); }
      function buildPipe(idxs){ return idxs.map(function(i){ return [width[i], noise[i]]; }); }
      function cvAcc(buildFn,K){
        var accs=[];
        for(var kf=0;kf<K;kf++){
          var testIdx=[],trainIdx=[];
          for(var j=0;j<N;j++){ if(j%K===kf) testIdx.push(j); else trainIdx.push(j); }
          var Xtr=buildFn(trainIdx), Xte=buildFn(testIdx);
          var Ytr=trainIdx.map(function(i){return y[i];}), Yte=testIdx.map(function(i){return y[i];});
          var std=standardizeTrTe(Xtr,Xte);
          var preds=knnPred(std.trS,Ytr,std.teS,3);
          accs.push(accOf(Yte,preds));
        }
        return accs;
      }
      var rawAcc=cvAcc(buildRaw,5), pipeAcc=cvAcc(buildPipe,5);
      self.s={step:0, ch1:ch1, width:width, boundary:boundary, flag:flag, noise:noise, logb:logb,
        rawAcc:rawAcc, pipeAcc:pipeAcc };
      E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var skewRaw=skewness(s.boundary), skewLog=skewness(s.logb);
      var code=[
        {t:'boundary_t = np.log(boundary)', hl:'np.log'},
        {t:'X = X.drop(columns=drop_cols)', hl:'.drop('},
        {t:'pipe = Pipeline([("scale",StandardScaler()),', hl:'Pipeline'},
        {t:'                 ("clf", KNeighborsClassifier(3))])', dim:true},
        {t:'cross_val_score(pipe, X, y, cv=5)', hl:'cross_val_score'}
      ];
      var acti=[0,1,4][s.step];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'segment_case.py', acti);
      var caps=['치우친 변수부터 로그로 바로잡습니다',
                '근사0분산·상관필터로 5개→2개로 줄입니다',
                'kNN 교차검증으로 전후 성능을 실제 비교합니다'];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step], W*0.04, codeBot+22);

      var px0=W*0.47, px1=W*0.965;

      if(s.step===0){
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('세포 경곗값(boundary) — 왜도 실측', px0, 30);
        ctx.font='12.5px ui-monospace,Menlo,monospace';
        ctx.fillStyle=RED; ctx.fillText('원값 왜도 = '+skewRaw.toFixed(3), px0, 58);
        ctx.fillStyle=GRN; ctx.fillText('log(경곗값) 왜도 = '+skewLog.toFixed(3), px0, 80);
        var by=104, bh=28, bw=(px1-px0-16);
        var rMax=Math.max(Math.abs(skewRaw),Math.abs(skewLog));
        ctx.fillStyle='rgba(240,136,138,0.32)'; ctx.strokeStyle=RED; ctx.lineWidth=1.2;
        ctx.fillRect(px0,by,bw*(Math.abs(skewRaw)/rMax),bh); ctx.strokeRect(px0,by,bw*(Math.abs(skewRaw)/rMax),bh);
        ctx.fillStyle='rgba(126,224,176,0.32)'; ctx.strokeStyle=GRN;
        ctx.fillRect(px0,by+bh+10,bw*(Math.abs(skewLog)/rMax),bh); ctx.strokeRect(px0,by+bh+10,bw*(Math.abs(skewLog)/rMax),bh);
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
        ctx.fillText('원값(위, 빨강) vs 로그값(아래, 초록) — 막대 길이 = |왜도|', px0, by+2*bh+34);
        ctx.fillText('20건 중 2건(48, 53)이 유난히 커서 오른쪽으로 꼬리가 깁니다', px0, by+2*bh+54);
        ctx.fillText('로그를 취하면 그 꼬리가 짧아져 왜도가 줄어듭니다', px0, by+2*bh+74);
      } else if(s.step===1){
        var names=['ch1_강도','폭','log(경곗값)','flag_const','noise'];
        var vars={ch1:s.ch1, width:s.width, boundary:s.logb, noise:s.noise};
        var keys=['ch1','width','boundary','noise'];
        function greedyRemove(varsObj, thresh){
          var ks=keys.slice(), removed=[];
          while(true){
            var maxAbs=0, pair=null;
            for(var a=0;a<ks.length;a++) for(var b=a+1;b<ks.length;b++){
              var c=Math.abs(corr2(varsObj[ks[a]],varsObj[ks[b]]));
              if(c>maxAbs){ maxAbs=c; pair=[ks[a],ks[b]]; }
            }
            if(maxAbs<=thresh || !pair) break;
            function avgC(k){ var s2=0,c2=0; ks.forEach(function(k2){ if(k2!==k){ s2+=Math.abs(corr2(varsObj[k],varsObj[k2])); c2++; } }); return c2?s2/c2:0; }
            var a1=avgC(pair[0]), a2=avgC(pair[1]);
            var rm=a1>=a2?pair[0]:pair[1];
            removed.push(rm); ks.splice(ks.indexOf(rm),1);
          }
          return {remaining:ks, removed:removed};
        }
        var greedy=greedyRemove(vars,0.75);
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('필터링 전후 변수 목록', px0, 30);
        var ty=54,rh=24;
        for(i=0;i<5;i++){
          var isFlagRemoved = (names[i]==='flag_const');
          var keyOf=['ch1','width','boundary',null,'noise'][i];
          var isCorrRemoved = keyOf && greedy.removed.indexOf(keyOf)>=0;
          var removed = isFlagRemoved||isCorrRemoved;
          ctx.font='12px ui-monospace,Menlo,monospace';
          ctx.fillStyle= removed?RED:GRN;
          ctx.fillText((removed?'✗ ':'✓ ')+names[i]+(removed?'  ('+(isFlagRemoved?'근사0분산':'상관 중복')+')':'  (유지)'), px0, ty+i*rh);
        }
        ctx.fillStyle=GLD; ctx.font='600 13px ui-monospace,Menlo,monospace';
        ctx.fillText('5개 → '+(greedy.remaining.length)+'개 ('+greedy.remaining.map(function(k){return names[keys.indexOf(k)];}).join(', ')+')', px0, ty+5*rh+20);
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
        ctx.fillText('ch1_강도는 폭과 상관이 너무 높아(0.98) 오히려 먼저 걸러졌습니다', px0, ty+5*rh+44);
        ctx.fillText('상관필터는 "정보가 많은 변수"가 아니라 "덜 얽힌 변수"를 남깁니다', px0, ty+5*rh+64);
      } else {
        var m1=mean(s.rawAcc), m2=mean(s.pipeAcc);
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('5겹 교차검증 정확도 — kNN(k=3)', px0, 30);
        var by0=54,rh2=56,bw=(px1-px0-160-90);
        var groups=[{name:'원본 5변수', accs:s.rawAcc, col:RED, m:m1},{name:'정제 2변수', accs:s.pipeAcc, col:GRN, m:m2}];
        groups.forEach(function(g,gi){
          var y2=by0+gi*rh2;
          ctx.font='12px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
          ctx.fillText(g.name, px0, y2-4);
          ctx.fillStyle=g.col+'40'; ctx.strokeStyle=g.col; ctx.lineWidth=1.3;
          ctx.fillRect(px0+160,y2,bw*g.m,20); ctx.strokeRect(px0+160,y2,bw*g.m,20);
          for(var k=0;k<g.accs.length;k++){ ctx.fillStyle=g.col; ctx.beginPath(); ctx.arc(px0+160+bw*g.accs[k], y2+10, 2.6,0,7); ctx.fill(); }
          ctx.fillStyle=g.col; ctx.font='600 12px ui-monospace,Menlo,monospace';
          ctx.fillText('정확도='+g.m.toFixed(3), px0+160+bw+8, y2+15);
        });
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif'; ctx.textAlign='left';
        ctx.fillText('작은 점 = 폴드 5개 각각의 정확도 · 막대 = 평균', px0, by0+2*rh2+10);
        ctx.fillText('변수를 5개에서 2개로 줄였는데도 정확도는 '+(m1*100).toFixed(0)+'% → '+(m2*100).toFixed(0)+'%로 오히려 올랐습니다', px0, by0+2*rh2+32);
        ctx.fillText('중복·잡음 변수가 kNN 거리 계산을 방해하고 있었다는 뜻입니다', px0, by0+2*rh2+52);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (왜도교정 → 변수필터 → 성능비교)', true);
      E.big('사례: 세포 이미지 품질 판정', '지금까지 배운 전처리를 한 흐름으로 적용합니다. 치우친 세포 경곗값은 로그로(왜도 '+skewRaw.toFixed(2)+' → '+skewLog.toFixed(2)+'), 거의 안 변하는 변수는 근사 0분산 규칙으로, 서로 닮은 변수는 상관필터(임계 0.75)로 걸러 5개였던 변수를 2개로 줄입니다. kNN(k=3)으로 5겹 교차검증을 실제로 돌려 보면, 원본 5변수의 평균 정확도는 '+(mean(s.rawAcc)*100).toFixed(0)+'%인데 정제된 2변수는 '+(mean(s.pipeAcc)*100).toFixed(0)+'%로 오히려 더 높습니다 — 전처리가 정보를 "잃는" 과정이 아니라 잡음을 걸러 신호를 더 또렷하게 만드는 과정임을 숫자로 확인한 것입니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
