/* 빅데이터 분석 제6장 — 데이터 시각화
   동작(behavior)만. 텍스트=content/bda6.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 화면의 모든 수(도수·사분위수·상관계수·집계값·격자선 개수)는 JS로 실제 계산(하드코딩 금지).
   왼쪽=진짜 matplotlib 코드 패널+줄커서, 오른쪽=실계산 시각화(직접 그린 그래프). HUD 꺼짐(bda.html) → 텍스트 좌표는 이 파일이 직접 관리. */
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

  // ── 통계 헬퍼 (골든룰: 전부 고정 배열에서 실제 계산) ──
  function mean(a){ var s=0,i; for(i=0;i<a.length;i++) s+=a[i]; return s/a.length; }
  function variance(a){ var m=mean(a), s=0,i; for(i=0;i<a.length;i++) s+=(a[i]-m)*(a[i]-m); return s/a.length; }
  function stdev(a){ return Math.sqrt(variance(a)); }
  // 선형보간 백분위수(넘파이 기본 방식과 동일한 논리). sorted=오름차순 배열, p=0..1
  function percentile(sorted,p){
    var idx=(sorted.length-1)*p, lo=Math.floor(idx), hi=Math.ceil(idx);
    if(lo===hi) return sorted[lo];
    return sorted[lo] + (idx-lo)*(sorted[hi]-sorted[lo]);
  }
  function pearsonR(x,y){
    var mx=mean(x), my=mean(y), sxy=0, sxx=0, syy=0, i;
    for(i=0;i<x.length;i++){ var dx=x[i]-mx, dy=y[i]-my; sxy+=dx*dy; sxx+=dx*dx; syy+=dy*dy; }
    return sxy/Math.sqrt(sxx*syy);
  }
  function linreg(x,y){ // 최소제곱 {a:절편,b:기울기}
    var mx=mean(x), my=mean(y), sxy=0, sxx=0, i;
    for(i=0;i<x.length;i++){ sxy+=(x[i]-mx)*(y[i]-my); sxx+=(x[i]-mx)*(x[i]-mx); }
    var b=sxy/sxx, a=my-b*mx;
    return {a:a,b:b};
  }
  function histogram(data,bins,mn,mx){
    var w=(mx-mn)/bins, counts=[], i;
    for(i=0;i<bins;i++) counts.push(0);
    for(i=0;i<data.length;i++){ var idx=Math.floor((data[i]-mn)/w); if(idx>=bins) idx=bins-1; if(idx<0) idx=0; counts[idx]++; }
    return counts;
  }

  var scenes = [

  // ══════════ 1. 그림 한 장의 구조 — Figure와 Axes ══════════
  { id:'bda6_01',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(340+this.s.step*90,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var DAYS=[1,2,3,4,5,6,7,8];
      var SCORE=[62,68,71,75,74,80,83,88];

      var code=[
        {t:'import matplotlib.pyplot as plt', dim:true},
        {t:'fig = plt.figure(figsize=(8,5))', hl:'figure'},
        {t:'ax = fig.add_axes(', hl:'add_axes'},
        {t:'    [0.12, 0.12, 0.80, 0.70])', hl:'0.12'},
        {t:'ax.plot(days, score, label="점수")', hl:'.plot'},
        {t:'ax.set_xlabel("일차")', hl:'set_xlabel'},
        {t:'ax.set_ylabel("점수")', hl:'set_ylabel'},
        {t:'ax.set_title("학습 진행"); ax.legend()', hl:'legend'}
      ];
      var act=[1,3,4,7][s.step];
      var codeBot=codePanel(E, W*0.03, H*0.03, W*0.44, code, 'figure_axes.py', act);

      var hint=[
        'Figure — 맷플롯립이 그리는 도화지 전체입니다.',
        'Axes — 그 도화지 위, 실제 그래프가 그려지는 좌표 영역입니다.',
        'Axes 안에 데이터가 선으로 그려집니다 — 좌표는 실제 값으로 계산됩니다.',
        '라벨·제목·범례까지 붙어야 그림 한 장이 완성됩니다.'
      ][s.step];
      ctx.fillStyle=DIM; ctx.font='11.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText(hint, W*0.03, codeBot+22);

      // 우측: Figure/Axes 구조 해부
      var fx=W*0.52, fy=H*0.08, fw=W*0.45, fh=H*0.80;
      ctx.fillStyle='rgba(255,255,255,0.03)'; ctx.strokeStyle=BLU; ctx.lineWidth=1.4;
      roundRect(ctx,fx,fy,fw,fh,8); ctx.fill(); ctx.stroke();
      ctx.fillStyle=BLU; ctx.font='600 11.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText('Figure (도화지)', fx+6, fy-8);

      if(s.step>=1){
        var axFx=0.14, axFy=0.16, axFw=0.76, axFh=0.62;
        var ax=fx+axFx*fw, ay=fy+axFy*fh, aw=axFw*fw, ah=axFh*fh;
        ctx.fillStyle='rgba(255,178,122,0.07)'; ctx.strokeStyle=GLD; ctx.lineWidth=1.4;
        ctx.fillRect(ax,ay,aw,ah); ctx.strokeRect(ax,ay,aw,ah);
        ctx.fillStyle=GLD; ctx.font='600 11.5px sans-serif'; ctx.textAlign='left';
        ctx.fillText('Axes (그래프 영역)', ax, ay-6);
        ctx.fillStyle=DIM; ctx.font='10.5px ui-monospace,Menlo,monospace';
        ctx.fillText('픽셀 ('+Math.round(ax)+','+Math.round(ay)+') '+Math.round(aw)+'×'+Math.round(ah)+' — [0.12,0.12,0.80,0.70]에서 계산', ax, ay+ah+16);

        if(s.step>=2){
          var mn=Math.min.apply(null,SCORE), mx=Math.max.apply(null,SCORE);
          var pad=(mx-mn)*0.2||1, ymin=mn-pad, ymax=mx+pad;
          var plotX=ax+aw*0.08, plotY=ay+ah*0.08, plotW=aw*0.84, plotH=ah*0.72;
          function px(d){ return plotX+(d-1)/(8-1)*plotW; }
          function py(v){ return plotY+plotH-(v-ymin)/(ymax-ymin)*plotH; }
          ctx.strokeStyle=ROSE; ctx.lineWidth=2;
          ctx.beginPath();
          for(i=0;i<DAYS.length;i++){ var xx=px(DAYS[i]),yy=py(SCORE[i]); if(i===0) ctx.moveTo(xx,yy); else ctx.lineTo(xx,yy); }
          ctx.stroke();
          for(i=0;i<DAYS.length;i++){ ctx.fillStyle=ROSE; ctx.beginPath(); ctx.arc(px(DAYS[i]),py(SCORE[i]),3,0,7); ctx.fill(); }
          ctx.fillStyle=DIM; ctx.font='10.5px ui-monospace,Menlo,monospace'; ctx.textAlign='right';
          ctx.fillText(''+mx, plotX-4, py(mx)+4);
          ctx.fillText(''+mn, plotX-4, py(mn)+4);
          ctx.textAlign='center'; ctx.fillText('1', px(1), plotY+plotH+13); ctx.fillText('8', px(8), plotY+plotH+13);

          if(s.step===3){
            ctx.fillStyle=TXT; ctx.font='600 11.5px sans-serif'; ctx.textAlign='center';
            ctx.fillText('학습 진행', ax+aw/2, ay-18);
            ctx.save(); ctx.translate(ax-20, ay+ah*0.42); ctx.rotate(-Math.PI/2);
            ctx.fillStyle=TXT; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('점수', 0, 0);
            ctx.restore();
            ctx.fillStyle=TXT; ctx.font='11px sans-serif'; ctx.textAlign='center';
            ctx.fillText('일차', ax+aw/2, ay+ah-4);
            var avg=mean(SCORE);
            ctx.fillStyle='rgba(255,255,255,0.07)'; ctx.strokeStyle=ROSE; ctx.lineWidth=1.2;
            roundRect(ctx, ax+aw-104, ay+6, 100, 30, 6); ctx.fill(); ctx.stroke();
            ctx.fillStyle=ROSE; ctx.font='600 11px sans-serif'; ctx.textAlign='left';
            ctx.fillText('― 점수', ax+aw-98, ay+20);
            ctx.fillStyle=DIM; ctx.font='10px sans-serif'; ctx.fillText('평균 '+avg.toFixed(1)+'점', ax+aw-98, ay+32);
          }
        }
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (Figure → Axes → 그래프 → 라벨·범례)', true);
      E.big('그림 한 장의 구조 — Figure와 Axes', '맷플롯립 그림은 층이 둘입니다. Figure는 도화지 전체, Axes는 그 위에 실제로 좌표가 그려지는 영역입니다. add_axes의 네 수치는 도화지에 대한 비율(왼쪽,아래,너비,높이)인데, 실제 픽셀 위치는 도화지 크기를 곱해야 나옵니다 — 탭할 때마다 그 계산값이 바뀌는 걸 보세요. 선·라벨·제목·범례는 전부 이 Axes 좌표 위에 얹히는 요소일 뿐입니다.'); }
  },

  // ══════════ 2. 분포를 보는 눈 — 히스토그램과 상자그림 ══════════
  { id:'bda6_02',
    enter:function(E){ var self=this; this.s={bins:6};
      E.controls('<div class="ctrl"><label>구간 수(bins)</label><input type="range" id="bn" min="3" max="12" step="1" value="6"><output id="bno">6</output></div>');
      E.bind('#bn','input',function(e){ self.s.bins=+e.target.value; document.getElementById('bno').textContent=self.s.bins; E.blip(340+self.s.bins*10,0.06); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var SCORES=[42,58,60,62,64,65,66,67,68,69,70,71,71,72,73,74,75,76,77,78,79,80,81,82,83,85,88,90,93,99];
      var n=SCORES.length;
      var mn=Math.min.apply(null,SCORES), mx=Math.max.apply(null,SCORES);
      var N=s.bins;
      var counts=histogram(SCORES,N,mn,mx);
      var maxC=Math.max.apply(null,counts);

      var sorted=SCORES.slice().sort(function(a,b){return a-b;});
      var q1=percentile(sorted,0.25), med=percentile(sorted,0.5), q3=percentile(sorted,0.75);
      var iqr=q3-q1, lowB=q1-1.5*iqr, highB=q3+1.5*iqr;
      var outliers=[], within=[];
      for(i=0;i<sorted.length;i++){ if(sorted[i]<lowB||sorted[i]>highB) outliers.push(sorted[i]); else within.push(sorted[i]); }
      var wLo=Math.min.apply(null,within), wHi=Math.max.apply(null,within);

      var code=[
        {t:'fig, ax = plt.subplots(2, 1)', dim:true},
        {t:'ax[0].hist(scores, bins='+N+')', hl:'bins='},
        {t:'ax[0].set_ylabel("도수")', hl:'set_ylabel'},
        {t:'ax[1].boxplot(scores, vert=False)', hl:'boxplot'},
        {t:'ax[1].set_xlabel("점수")', hl:'set_xlabel'}
      ];
      var codeBot=codePanel(E, W*0.03, H*0.03, W*0.42, code, 'dist.py', 1);
      ctx.fillStyle=DIM; ctx.font='11.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText('표본 '+n+'개 · 원자료 최소 '+mn+' · 최대 '+mx, W*0.03, codeBot+20);
      ctx.fillText('구간 수를 바꾸면 도수가 실제로 다시 계산됩니다.', W*0.03, codeBot+38);
      ctx.fillStyle=(N<=4)?RED:GRN; ctx.font='11.5px sans-serif';
      ctx.fillText(N<=4?'구간이 너무 넓으면 봉우리가 뭉개져 보입니다.':(N>=10?'구간이 너무 잘면 잡음까지 도수로 보입니다.':'적당한 구간 수 — 분포의 모양이 드러납니다.'), W*0.03, codeBot+56);

      // 우측 상단: 히스토그램(실계산 도수)
      var hx=W*0.50, hy=H*0.08, hw=W*0.46, hh=H*0.38;
      ctx.fillStyle=ROSE; ctx.font='600 12.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText('히스토그램 — bins='+N, hx, hy-6);
      ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(hx,hy); ctx.lineTo(hx,hy+hh); ctx.lineTo(hx+hw,hy+hh); ctx.stroke();
      var barW=hw/N;
      for(i=0;i<N;i++){
        var bh=(counts[i]/maxC)*(hh-18), bx=hx+i*barW, by=hy+hh-bh;
        ctx.fillStyle='rgba(255,122,184,0.45)'; ctx.strokeStyle=ROSE; ctx.lineWidth=1;
        ctx.fillRect(bx+1,by,barW-2,bh); ctx.strokeRect(bx+1,by,barW-2,bh);
        if(counts[i]>0){ ctx.fillStyle=TXT; ctx.font='10.5px ui-monospace,Menlo,monospace'; ctx.textAlign='center'; ctx.fillText(''+counts[i], bx+barW/2, by-4); }
      }
      ctx.fillStyle=DIM; ctx.font='10.5px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
      ctx.fillText(''+mn, hx, hy+hh+13); ctx.textAlign='right'; ctx.fillText(''+mx, hx+hw, hy+hh+13);

      // 우측 하단: 상자그림(실계산 사분위수) — 가로형
      var bx0=W*0.50, by0=H*0.58, bw0=W*0.46, byMid=by0+22;
      ctx.fillStyle=ROSE; ctx.font='600 12.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText('상자그림 — 사분위수 실측', bx0, by0-4);
      var range=mx-mn||1;
      function bxp(v){ return bx0 + (v-mn)/range*bw0; }
      ctx.strokeStyle=DIM; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(bxp(wLo),byMid); ctx.lineTo(bxp(q1),byMid); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bxp(q3),byMid); ctx.lineTo(bxp(wHi),byMid); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bxp(wLo),byMid-8); ctx.lineTo(bxp(wLo),byMid+8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bxp(wHi),byMid-8); ctx.lineTo(bxp(wHi),byMid+8); ctx.stroke();
      ctx.fillStyle='rgba(122,184,255,0.30)'; ctx.strokeStyle=BLU; ctx.lineWidth=1.4;
      ctx.fillRect(bxp(q1),byMid-16,bxp(q3)-bxp(q1),32); ctx.strokeRect(bxp(q1),byMid-16,bxp(q3)-bxp(q1),32);
      ctx.strokeStyle=GLD; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(bxp(med),byMid-16); ctx.lineTo(bxp(med),byMid+16); ctx.stroke();
      for(i=0;i<outliers.length;i++){ ctx.fillStyle=RED; ctx.beginPath(); ctx.arc(bxp(outliers[i]),byMid,4,0,7); ctx.fill(); }
      ctx.fillStyle=TXT; ctx.font='10.5px ui-monospace,Menlo,monospace'; ctx.textAlign='center';
      ctx.fillText('Q1='+q1.toFixed(1), bxp(q1), byMid+32);
      ctx.fillText('중앙값='+med.toFixed(1), bxp(med), byMid-24);
      ctx.fillText('Q3='+q3.toFixed(1), bxp(q3), byMid+32);

      var sy=byMid+52;
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left';
      ctx.fillText('IQR='+iqr.toFixed(1)+' · 이상치 경계 ['+lowB.toFixed(1)+', '+highB.toFixed(1)+']', bx0, sy);
      ctx.fillStyle=outliers.length?RED:GRN;
      ctx.fillText('이상치(빨간 점) '+outliers.length+'개'+(outliers.length?' — 값: '+outliers.join(', '):''), bx0, sy+16);

      E.tapHint(W/2, H*0.97, '슬라이더로 구간 수를 바꿔 보세요 — 도수가 다시 계산됩니다', true);
      E.big('분포를 보는 눈 — 히스토그램과 상자그림', '같은 30개 점수를 두 방식으로 봅니다. 히스토그램은 구간(bin)마다 개수를 세어 막대로 쌓는데, 구간 수를 바꾸면 인상이 완전히 달라집니다 — 너무 넓으면 봉우리가 뭉개지고, 너무 잘면 잡음까지 튀어 보이죠. 상자그림은 그런 선택이 필요 없습니다. 사분위수로 중앙 50%(상자)와 이상치 경계(1.5×IQR)를 실제로 계산해 한눈에 보여 줍니다.'); }
  },

  // ══════════ 3. 관계를 보는 눈 — 산점도와 상관 ══════════
  { id:'bda6_03',
    enter:function(E){ var self=this; this.s={jit:3};
      E.controls('<div class="ctrl"><label>흔들기 강도</label><input type="range" id="jt" min="0" max="10" step="1" value="3"><output id="jto">3</output></div>');
      E.bind('#jt','input',function(e){ self.s.jit=+e.target.value; document.getElementById('jto').textContent=self.s.jit; E.blip(340+self.s.jit*15,0.06); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var HOURS=[1,2,3,4,5,6,7,8,9,10,11,12];
      var NOISE=[4,-6,8,-3,10,-9,5,-7,2,-4,9,-8];
      var factor=s.jit*0.8;
      var SCORE=[]; for(i=0;i<HOURS.length;i++) SCORE.push(50+3*HOURS[i]+factor*NOISE[i]);

      var r=pearsonR(HOURS,SCORE);
      var lr=linreg(HOURS,SCORE);

      var code=[
        {t:'plt.scatter(hours, score)', hl:'.scatter'},
        {t:'b, a = np.polyfit(hours, score, 1)', hl:'polyfit'},
        {t:'plt.plot(hours, b*hours + a, "--")', hl:'.plot'},
        {t:'r = np.corrcoef(hours, score)[0, 1]', hl:'corrcoef'}
      ];
      var codeBot=codePanel(E, W*0.03, H*0.05, W*0.42, code, 'scatter.py', 3);
      ctx.fillStyle=DIM; ctx.font='11.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText('공부 시간 12명 × 흔들기 강도로 잡음을 더한 시험 점수', W*0.03, codeBot+22);
      ctx.fillStyle=GLD; ctx.font='11.5px ui-monospace,Menlo,monospace';
      ctx.fillText('회귀식: 점수 ≈ '+lr.b.toFixed(2)+' × 시간 + '+lr.a.toFixed(1), W*0.03, codeBot+42);

      ctx.fillStyle='#c9b8cf'; ctx.font='11.5px sans-serif';
      var note='상관계수가 높다고 원인은 아닙니다 — 예를 들어 아이스크림 판매량과 익사 사고는 함께 늘지만, 진짜 원인은 무더위 하나입니다.';
      ctx.fillText(note.length>34?note.slice(0,34):note, W*0.03, codeBot+64);
      ctx.fillText(note.slice(34), W*0.03, codeBot+80);

      // 우측: 산점도(실계산 좌표) + 회귀선
      var px0=W*0.52, py0=H*0.10, pw=W*0.44, ph=H*0.62;
      var xmn=0, xmx=13, ymn=40, ymx=100;
      function X(v){ return px0+(v-xmn)/(xmx-xmn)*pw; }
      function Y(v){ return py0+ph-(v-ymn)/(ymx-ymn)*ph; }
      ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(X(xmn),Y(ymn)); ctx.lineTo(X(xmn),Y(ymx)); ctx.moveTo(X(xmn),Y(ymn)); ctx.lineTo(X(xmx),Y(ymn)); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center';
      ctx.fillText('공부 시간', px0+pw/2, py0+ph+18);
      ctx.save(); ctx.translate(px0-24, py0+ph/2); ctx.rotate(-Math.PI/2); ctx.fillText('시험 점수', 0, 0); ctx.restore();

      ctx.strokeStyle=GLD; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(X(xmn+0.5), Y(lr.a+lr.b*(xmn+0.5))); ctx.lineTo(X(xmx-0.5), Y(lr.a+lr.b*(xmx-0.5))); ctx.stroke();
      for(i=0;i<HOURS.length;i++){
        ctx.fillStyle=ROSE; ctx.beginPath(); ctx.arc(X(HOURS[i]),Y(SCORE[i]),5,0,7); ctx.fill();
        ctx.strokeStyle='#fff'; ctx.lineWidth=1.2; ctx.stroke();
      }

      var rCol = Math.abs(r)>0.7?GRN:(Math.abs(r)>0.3?GLD:RED);
      ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.strokeStyle=rCol; ctx.lineWidth=1.4;
      roundRect(ctx, px0+pw-108, py0, 104, 40, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle=rCol; ctx.font='600 16px ui-monospace,Menlo,monospace'; ctx.textAlign='center';
      ctx.fillText('r = '+r.toFixed(2), px0+pw-56, py0+22);
      ctx.fillStyle=DIM; ctx.font='10.5px sans-serif';
      ctx.fillText(Math.abs(r)>0.7?'강한 상관':(Math.abs(r)>0.3?'중간 상관':'약한 상관'), px0+pw-56, py0+34);

      E.tapHint(W/2, H*0.97, '슬라이더로 점을 흔들어 보세요 — 상관계수가 다시 계산됩니다', true);
      E.big('관계를 보는 눈 — 산점도와 상관', '두 변수를 점 하나하나로 흩뿌려 관계를 봅니다. 흔들기 강도를 올려 잡음을 더하면 점들이 추세선에서 멀어지고, 그만큼 상관계수 r이 실제로 작아지는 걸 확인할 수 있습니다. r은 −1에서 1 사이 숫자일 뿐 — 얼마나 강한 관계인지는 말해도, 무엇이 무엇을 일으키는지는 말하지 않습니다.'); }
  },

  // ══════════ 4. 비교를 보는 눈 — 막대와 그룹 비교 ══════════
  { id:'bda6_04',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(340+this.s.step*90,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var REG=['서울','부산','대구','광주','대전'];
      var SALES=[820,790,805,760,835];

      var order=REG.map(function(r,idx){return idx;});
      if(s.step>=1){ order=order.slice().sort(function(a,b){return SALES[b]-SALES[a];}); }

      var mx=Math.max.apply(null,SALES), mn=Math.min.apply(null,SALES);
      var baseline = (s.step<3) ? 0 : mn-20;

      var code=[
        {t:'plt.bar(region, sales)', hl:'.bar'},
        {t:'order = sorted(region, key=..., reverse=True)', hl:'sorted'},
        {t:'plt.ylim(0, max(sales)*1.1)', hl:'ylim(0'},
        {t:'plt.ylim('+baseline.toFixed(0)+', max(sales)*1.02)', hl:'ylim('+baseline.toFixed(0)}
      ];
      var act=[0,1,2,3][s.step];
      var codeBot=codePanel(E, W*0.03, H*0.04, W*0.40, code, 'compare.py', act);
      var hint=[
        '입력 순서 그대로 — 어느 지역이 큰지 한눈에 안 들어옵니다.',
        '값 기준 정렬 — 큰 순서대로 눈이 자연스럽게 훑입니다.',
        '기준선을 0에서 시작 — 막대 높이가 실제 비율을 그대로 보여줍니다.',
        '기준선을 값 근처에서 자르면 — 작은 차이가 크게 부풀려집니다.'
      ][s.step];
      ctx.fillStyle=DIM; ctx.font='11.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText(hint, W*0.03, codeBot+22);

      // 우측: 막대차트(실계산 높이)
      var gx=W*0.48, gy=H*0.10, gw=W*0.48, gh=H*0.56;
      var top = mx*1.08;
      function barH(v){ return (v-baseline)/(top-baseline)*gh; }
      var n=REG.length, bw=Math.min(76,(gw)/n-14);
      ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(gx,gy); ctx.lineTo(gx,gy+gh); ctx.lineTo(gx+gw,gy+gh); ctx.stroke();
      for(i=0;i<n;i++){
        var idx=order[i], v=SALES[idx], h=barH(v), x0=gx+8+i*(bw+14), y0=gy+gh-h;
        var isMax=(v===mx);
        ctx.fillStyle=isMax?'rgba(255,122,184,0.55)':'rgba(122,184,255,0.35)';
        ctx.strokeStyle=isMax?ROSE:BLU; ctx.lineWidth=1.4;
        ctx.fillRect(x0,y0,bw,h); ctx.strokeRect(x0,y0,bw,h);
        ctx.fillStyle=TXT; ctx.font='600 11px ui-monospace,Menlo,monospace'; ctx.textAlign='center';
        ctx.fillText(''+v, x0+bw/2, y0-6);
        ctx.fillStyle=DIM; ctx.font='11px sans-serif';
        ctx.fillText(REG[idx], x0+bw/2, gy+gh+16);
      }
      ctx.fillStyle=DIM; ctx.font='10.5px ui-monospace,Menlo,monospace'; ctx.textAlign='right';
      ctx.fillText(baseline.toFixed(0), gx-6, gy+gh+4);
      ctx.fillText(top.toFixed(0), gx-6, gy+6);

      var sy=gy+gh+36;
      if(s.step===3){
        var realPct=(mx-mn)/mx*100;
        var dispPct=(mx-mn)/(top-baseline)*100;
        ctx.fillStyle=RED; ctx.font='600 12px sans-serif'; ctx.textAlign='left';
        ctx.fillText('실제 격차 = '+realPct.toFixed(1)+'%인데, 화면에서는 '+dispPct.toFixed(1)+'%처럼 보입니다.', gx, sy);
        ctx.fillStyle=DIM; ctx.font='11px sans-serif';
        ctx.fillText('기준선을 자르면 눈에 보이는 차이가 실제보다 '+(dispPct/realPct).toFixed(1)+'배로 부풀려집니다.', gx, sy+18);
      } else {
        ctx.fillStyle=GRN; ctx.font='11.5px sans-serif'; ctx.textAlign='left';
        ctx.fillText('최댓값 '+mx+' · 최솟값 '+mn+' · 실제 격차 '+((mx-mn)/mx*100).toFixed(1)+'%', gx, sy);
      }

      E.tapHint(W/2, H*0.97, '화면 탭 = 다음 (정렬 전 → 정렬 후 → 0부터 → 축 자르기)', true);
      E.big('비교를 보는 눈 — 막대와 그룹 비교', '지역별 매출 다섯 개를 막대로 비교합니다. 정렬만 해도 크기 순서가 눈에 들어오고, 기준선을 0에서 시작해야 막대 높이의 비율이 실제 값의 비율과 같아집니다. 기준선을 값 근처에서 자르면 — 코드 한 줄(ylim)만 바꿔도 몇 퍼센트 차이가 몇 배로 보이도록 조작할 수 있다는 뜻입니다.'); }
  },

  // ══════════ 5. 좋은 그래프의 원칙 ══════════
  { id:'bda6_05',
    enter:function(E){ this.s={good:false}; E.setOn([]); },
    tap:function(E){ this.s.good=!this.s.good; E.blip(this.s.good?520:320,0.09); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var CATS=['A제품','B제품','C제품','D제품','E제품'];
      var VALS=[412,388,405,120,398];
      var BADCOL=['#ff7ab8','#7ee0b0','#7ab8ff','#ffd27a','#f0888a'];
      var mx=Math.max.apply(null,VALS), maxIdx=VALS.indexOf(mx);

      var code = s.good ? [
        {t:'order = sorted(cats, key=vals, reverse=True)', hl:'sorted'},
        {t:'plt.barh(order, vals, color=gray)', hl:'.barh'},
        {t:'plt.bar[best].set_color(accent)', hl:'accent'},
        {t:'for x, v in zip(vals, order):', dim:true},
        {t:'    plt.text(v, x, str(v))', hl:'plt.text'}
      ] : [
        {t:'plt.bar(cats, vals, color=rainbow)', hl:'rainbow'},
        {t:'plt.ylim(100, max(vals))', hl:'ylim(100'},
        {t:'plt.grid(True, step=50)', hl:'grid'},
        {t:'plt.legend(cats)', hl:'legend'}
      ];
      var codeBot=codePanel(E, W*0.03, H*0.04, W*0.40, code, s.good?'good.py':'bad.py', s.good?1:0);

      var gridN = Math.ceil((mx-100)/50);
      var legendRefs = s.good?0:CATS.length;
      var directLabels = s.good?CATS.length:0;
      ctx.fillStyle=DIM; ctx.font='11.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText('격자선 '+(s.good?0:gridN)+'개 · 범례 대조 '+legendRefs+'회 · 직접 라벨 '+directLabels+'개', W*0.03, codeBot+22);
      ctx.fillStyle=s.good?GRN:RED; ctx.font='600 11.5px sans-serif';
      ctx.fillText(s.good?'잉크는 줄고, 읽는 시간은 줄었습니다.':'같은 정보인데 읽으려면 격자와 범례를 오가야 합니다.', W*0.03, codeBot+42);

      var gx=W*0.48, gy=H*0.10, gw=W*0.48, gh=H*0.58;

      if(!s.good){
        // 나쁜 그림: 세로 막대, 축 잘림(100부터), 무지개색, 격자선, 범례 별도
        var base=100, top=mx*1.05;
        ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1;
        for(i=0;i<=gridN;i++){ var gv=base+i*50, gyy=gy+gh-(gv-base)/(top-base)*gh;
          ctx.beginPath(); ctx.moveTo(gx,gyy); ctx.lineTo(gx+gw*0.72,gyy); ctx.stroke(); }
        var n=CATS.length, bw=Math.min(46,(gw*0.72)/n-10);
        for(i=0;i<n;i++){
          var v=VALS[i], h=(v-base)/(top-base)*gh, x0=gx+6+i*(bw+10), y0=gy+gh-h;
          ctx.fillStyle=BADCOL[i]; ctx.fillRect(x0,y0,bw,h);
        }
        // 범례(막대와 떨어진 상자)
        var lx=gx+gw*0.80, ly=gy+6;
        ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1;
        roundRect(ctx,lx,ly,gw*0.19,20*n+10,6); ctx.fill(); ctx.stroke();
        for(i=0;i<n;i++){ var ry=ly+10+i*20;
          ctx.fillStyle=BADCOL[i]; ctx.fillRect(lx+8,ry-8,10,10);
          ctx.fillStyle=TXT; ctx.font='10.5px sans-serif'; ctx.textAlign='left';
          ctx.fillText(CATS[i], lx+22, ry); }
        ctx.fillStyle=DIM; ctx.font='10px sans-serif'; ctx.textAlign='right';
        ctx.fillText(''+base, gx-4, gy+gh+4);
      } else {
        // 좋은 그림: 가로 막대, 정렬, 회색+강조색 1개, 값 직접 라벨, 축 0부터, 격자 없음
        var order=CATS.map(function(c,idx){return idx;}).sort(function(a,b){return VALS[b]-VALS[a];});
        var rh=Math.min(30,(gh)/CATS.length-8);
        for(i=0;i<order.length;i++){
          var idx=order[i], v=VALS[idx], w=(v/mx)*(gw*0.72), y0=gy+i*(rh+10);
          ctx.fillStyle=(idx===maxIdx)?'rgba(255,122,184,0.6)':'rgba(255,255,255,0.14)';
          ctx.strokeStyle=(idx===maxIdx)?ROSE:'rgba(255,255,255,0.3)'; ctx.lineWidth=1.2;
          ctx.fillRect(gx,y0,w,rh); ctx.strokeRect(gx,y0,w,rh);
          ctx.fillStyle=TXT; ctx.font='11px sans-serif'; ctx.textAlign='right';
          ctx.fillText(CATS[idx], gx-8, y0+rh*0.68);
          ctx.fillStyle=(idx===maxIdx)?ROSE:DIM; ctx.font='600 11px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
          ctx.fillText(''+v, gx+w+8, y0+rh*0.68);
        }
      }

      E.tapHint(W/2, H*0.97, '화면 탭 = 나쁜 그림 ↔ 좋은 그림', true);
      E.big('좋은 그래프의 원칙', '같은 다섯 개 값인데 그리는 방식에 따라 읽는 수고가 다릅니다. 무지개색은 색이 아무 뜻도 없을 때 눈만 어지럽히고, 범례는 눈을 표와 상자 사이로 오가게 하며, 격자선은 값을 어림하게 만듭니다. 정렬하고, 뜻이 있을 때만 색을 쓰고(최댓값 강조), 라벨을 값 옆에 직접 붙이면 — 같은 정보를 잉크는 줄이고 더 빨리 전달합니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
