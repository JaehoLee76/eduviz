/* 인공지능 제2장 — 데이터와 학습: 데이터 종류 · 스케일링(정규화/표준화) · 인코딩·결측치 · 피처 엔지니어링 · 데이터 양과 성능
   동작(behavior)만. 텍스트=content/ai2.json. 엔진 js/engine.js 공유. 색: AI=시안.
   골든룰: 스케일 변환·원핫·분리 정확도·학습곡선 검증오차는 전부 draw()에서 실제 계산(베껴 그리기 금지). */
(function(){
  var CYA='#3dd6dc', BLU='#7ab8ff', GLD='#ffd27a', GRN='#7ee0b0', PNK='#f4a0c0', DIM='#9b99a3', RED='#f0888a';
  function noise(i){ return ((Math.sin(i*12.9898)*43758.5453)%1+1)%1 - 0.5; }
  function mean(a){ var s=0,i; for(i=0;i<a.length;i++)s+=a[i]; return s/a.length; }
  function std(a){ var m=mean(a),s=0,i; for(i=0;i<a.length;i++)s+=(a[i]-m)*(a[i]-m); return Math.sqrt(s/a.length); }

  var scenes = [

  // ══════════ 1. 데이터의 종류 ══════════
  { id:'ai2_01',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(360,0.07); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 정형 vs 비정형
      ctx.fillStyle='#dfeef0'; ctx.font='600 17px sans-serif'; ctx.textAlign='center';
      if(s.step===0){
        ctx.fillText('정형 데이터 (테이블) — 행=샘플, 열=특징', W*0.5, H*0.12);
        var tx=W*0.22, ty=H*0.24, cw=W*0.13, rh=H*0.09, cols=['키(cm)','나이','도시','구매?'], rows=[['172','25','서울','예'],['158','41','부산','아니오'],['180','33','서울','예']];
        for(var c=0;c<4;c++){ ctx.fillStyle=(c<2?BLU:(c<3?GLD:GRN)); ctx.font='600 14px sans-serif'; ctx.fillText(cols[c], tx+c*cw+cw/2, ty-8); }
        for(var r=0;r<3;r++){ for(c=0;c<4;c++){ ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1; ctx.strokeRect(tx+c*cw, ty+r*rh, cw, rh);
          ctx.fillStyle='#dfeef0'; ctx.font='14px sans-serif'; ctx.fillText(rows[r][c], tx+c*cw+cw/2, ty+r*rh+rh*0.62); } }
        ctx.fillStyle=BLU; ctx.font='14px sans-serif'; ctx.fillText('● 수치형(키·나이): 크기·순서 의미', W*0.5, ty+3*rh+34);
        ctx.fillStyle=GLD; ctx.fillText('● 범주형(도시): 종류만, 크기 의미 없음', W*0.5, ty+3*rh+58);
      } else {
        ctx.fillText('비정형 데이터 — 표로 안 떨어지는 것들', W*0.5, H*0.12);
        var items=[['🖼','이미지','픽셀 격자',BLU],['📝','텍스트','단어의 열',GRN],['🔊','음성','파형 신호',PNK]];
        for(var i=0;i<3;i++){ var cx=W*(0.25+i*0.25);
          ctx.font='40px sans-serif'; ctx.fillText(items[i][0], cx, H*0.34);
          ctx.fillStyle=items[i][3]; ctx.font='600 16px sans-serif'; ctx.fillText(items[i][1], cx, H*0.42);
          ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.fillText(items[i][2], cx, H*0.46); }
        ctx.fillStyle='#dfeef0'; ctx.font='14px sans-serif'; ctx.fillText('비정형도 결국 숫자(벡터)로 바꿔 모델에 넣습니다 — 임베딩(10장).', W*0.5, H*0.56);
      }
      E.tapHint(W/2, H*0.93, '화면 탭 = 정형 ↔ 비정형', true);
      E.big('데이터의 종류 — 정형·비정형, 수치형·범주형', 'AI의 연료는 데이터입니다. 표로 깔끔히 떨어지는 <b>정형</b>(테이블)과 이미지·텍스트 같은 <b>비정형</b>이 있고, 특징은 크기·순서가 있는 <b>수치형</b>과 종류만 있는 <b>범주형</b>으로 나뉩니다. 종류에 따라 다루는 법이 달라지죠.'); }
  },

  // ══════════ 2. 스케일링 — 정규화 vs 표준화 ══════════
  { id:'ai2_02',
    enter:function(E){ var self=this; this.s={mode:0};
      E.controls('<div class="ctrl"><label>변환 방법</label><input type="range" id="md" min="0" max="2" step="1" value="0"><output id="mdo">원본</output></div>');
      E.bind('#md','input',function(e){ self.s.mode=+e.target.value; document.getElementById('mdo').textContent=['원본','정규화(0~1)','표준화(평균0)'][self.s.mode]; E.blip(360,0.06); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 두 특징: 나이(20~60), 연봉(2000~9000만) — 스케일 천차만별
      var N=14, age=[], sal=[]; for(var i=0;i<N;i++){ age.push(30+noise(i)*30); sal.push(5000+noise(i*3+1)*4500); }
      function tx(arr){ if(s.mode===0) return arr.slice();
        if(s.mode===1){ var mn=Math.min.apply(null,arr),mx=Math.max.apply(null,arr); return arr.map(function(v){return (v-mn)/(mx-mn);}); }
        var m=mean(arr),sd=std(arr); return arr.map(function(v){return (v-m)/sd;}); }
      var ax=tx(age), sx=tx(sal);
      // 표시 범위
      var lo,hi; if(s.mode===0){ lo=0; hi=1; } else if(s.mode===1){ lo=-0.1; hi=1.1; } else { lo=-2.6; hi=2.6; }
      var ox=W*0.16, oy=H*0.72, pw=W*0.56, pv=H*0.50;
      function SX(v,arr){ if(s.mode===0){ var mn=Math.min.apply(null,arr),mx=Math.max.apply(null,arr); v=(v-mn)/(mx-mn);} return ox+(v-lo)/(hi-lo)*pw; }
      function SY(v,arr){ if(s.mode===0){ var mn=Math.min.apply(null,arr),mx=Math.max.apply(null,arr); v=(v-mn)/(mx-mn);} return oy-(v-lo)/(hi-lo)*pv; }
      // 축
      ctx.strokeStyle='rgba(61,214,220,0.25)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(ox,oy); ctx.lineTo(ox+pw,oy); ctx.moveTo(ox,oy); ctx.lineTo(ox,oy-pv); ctx.stroke();
      ctx.fillStyle=GLD; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('연봉(만원)', ox+4, oy-pv-6); ctx.fillStyle=BLU; ctx.textAlign='right'; ctx.fillText('나이 →', ox+pw, oy+16);
      for(i=0;i<N;i++){ ctx.fillStyle=CYA; ctx.beginPath(); ctx.arc(SX(ax[i],ax),SY(sx[i],sx),6,0,7); ctx.fill(); }
      // 설명·실측 통계
      var px=W*0.78, py=H*0.30;
      ctx.fillStyle='#dfeef0'; ctx.font='600 15px sans-serif'; ctx.textAlign='left';
      var lab=['원본 — 스케일 천차만별','정규화: (x−min)/(max−min) → [0,1]','표준화: (x−평균)/표준편차 → 평균0·분산1'][s.mode];
      ctx.fillText(lab, px-W*0.10, py);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
      if(s.mode===0){ ctx.fillText('나이 20~60, 연봉 ~9000 — 연봉이 거리 계산을', px-W*0.10, py+24); ctx.fillText('지배해 나이는 무시됩니다.', px-W*0.10, py+42); }
      else { ctx.fillText('나이 평균 '+mean(age).toFixed(1)+', 연봉 평균 '+mean(sal).toFixed(0), px-W*0.10, py+24);
        ctx.fillText('→ 두 특징이 같은 눈금이 되어 공정하게 비교.', px-W*0.10, py+42); }
      E.tapHint(W/2, H*0.95, '변환 방법을 바꿔 두 특징이 같은 눈금이 되는 걸 보세요', true);
      E.big('스케일링 — 정규화 vs 표준화', '특징마다 단위·범위가 다르면(나이 vs 연봉) 큰 값이 거리·경사하강을 지배합니다. 그래서 같은 눈금으로 맞춥니다 — <b>정규화</b>는 [0,1]로, <b>표준화</b>는 평균0·표준편차1로(실제 변환값 표시). 스케일링은 거의 모든 모델의 필수 전처리입니다.'); }
  },

  // ══════════ 3. 범주형 인코딩 · 결측치 ══════════
  { id:'ai2_03',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(360,0.07); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var cities=['서울','부산','서울','대구'], cats=['서울','부산','대구'];
      ctx.textAlign='center';
      if(s.step===0){
        ctx.fillStyle='#dfeef0'; ctx.font='600 16px sans-serif'; ctx.fillText('범주형 "도시"를 숫자로? — 원-핫 인코딩', W*0.5, H*0.12);
        // 원본 열
        var ox=W*0.18, oy=H*0.24, rh=H*0.10;
        ctx.fillStyle=GLD; ctx.font='600 14px sans-serif'; ctx.fillText('도시', ox, oy-8);
        for(var r=0;r<4;r++){ ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.strokeRect(ox-40,oy+r*rh,80,rh); ctx.fillStyle='#dfeef0'; ctx.font='14px sans-serif'; ctx.fillText(cities[r], ox, oy+r*rh+rh*0.62); }
        // 화살표
        ctx.fillStyle=CYA; ctx.font='22px sans-serif'; ctx.fillText('→', W*0.34, oy+2*rh);
        // 원핫(실제 계산)
        var hx=W*0.46;
        for(var c=0;c<3;c++){ ctx.fillStyle=CYA; ctx.font='600 13px sans-serif'; ctx.fillText('도시='+cats[c], hx+c*W*0.13, oy-8);
          for(r=0;r<4;r++){ var v=(cities[r]===cats[c])?1:0; ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.strokeRect(hx+c*W*0.13-36,oy+r*rh,72,rh);
            ctx.fillStyle=v?CYA:DIM; ctx.font=(v?'600 ':'')+'15px sans-serif'; ctx.fillText(v, hx+c*W*0.13, oy+r*rh+rh*0.62); } }
        ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.fillText('각 범주를 별도의 0/1 열로 — "서울=1·부산=2"처럼 크기를 주면 안 됨(순서 없음).', W*0.5, oy+4*rh+30);
      } else {
        ctx.fillStyle='#dfeef0'; ctx.font='600 16px sans-serif'; ctx.fillText('결측치(빈 칸) 다루기', W*0.5, H*0.12);
        var vals=[172,null,180,165,null], filled=vals.filter(function(v){return v!==null;}), m=mean(filled);
        var ox2=W*0.30, oy2=H*0.26, rh2=H*0.085;
        ctx.font='14px sans-serif';
        for(var i=0;i<5;i++){ ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.strokeRect(ox2-50,oy2+i*rh2,100,rh2);
          if(vals[i]===null){ ctx.fillStyle=RED; ctx.fillText('(빈 칸)', ox2, oy2+i*rh2+rh2*0.62); }
          else { ctx.fillStyle='#dfeef0'; ctx.fillText(vals[i], ox2, oy2+i*rh2+rh2*0.62); } }
        ctx.fillStyle=CYA; ctx.font='22px sans-serif'; ctx.fillText('→', W*0.46, oy2+2.5*rh2);
        var hx2=W*0.62;
        for(i=0;i<5;i++){ var fv=(vals[i]===null)?m:vals[i]; ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.strokeRect(hx2-50,oy2+i*rh2,100,rh2);
          ctx.fillStyle=(vals[i]===null)?GRN:'#dfeef0'; ctx.fillText(fv.toFixed(1), hx2, oy2+i*rh2+rh2*0.62); }
        ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.fillText('빈 칸을 평균('+m.toFixed(1)+')으로 채움(실계산) — 또는 중앙값·최빈값·예측값.', W*0.5, oy2+5*rh2+28);
      }
      E.tapHint(W/2, H*0.93, '화면 탭 = 인코딩 ↔ 결측치', true);
      E.big('범주형 인코딩 · 결측치', '모델은 숫자만 먹습니다. 범주형(도시·색)은 <b>원-핫 인코딩</b>으로 각 범주를 0/1 열로 펼칩니다(숫자 1·2·3을 주면 가짜 순서가 생기니까요). 빈 칸(결측치)은 버리거나 <b>평균·중앙값·최빈값</b>으로 채웁니다 — 화면 값은 실제 계산입니다.'); }
  },

  // ══════════ 4. 피처 엔지니어링 — 좋은 특징이 절반 ══════════
  { id:'ai2_04',
    enter:function(E){ var self=this; this.s={thr:1.0};
      E.controls('<div class="ctrl"><label>반지름 r 임계값</label><input type="range" id="th" min="0.4" max="1.6" step="0.05" value="1.0"><output id="tho">1.00</output></div>');
      E.bind('#th','input',function(e){ self.s.thr=+e.target.value; document.getElementById('tho').textContent=(+e.target.value).toFixed(2); E.blip(360,0.06); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 두 동심 고리: 안쪽(클래스 A, r<1), 바깥(클래스 B, r>1). 직선으론 분리 불가.
      var pts=[]; for(var i=0;i<28;i++){ var ang=i*2.39, rr=(i%2===0)?(0.4+0.35*((Math.sin(i*7.7)*1e3%1+1)%1)):(1.2+0.4*((Math.sin(i*3.3)*1e3%1+1)%1)); pts.push({x:Math.cos(ang)*rr, y:Math.sin(ang)*rr, cls:(i%2===0)?0:1, r:rr}); }
      // 왼쪽: 원래 2D 공간(직선 불가)
      var cx=W*0.28, cy=H*0.46, sc=Math.min(W*0.14,H*0.24);
      ctx.strokeStyle='rgba(255,255,255,0.1)'; ctx.beginPath(); ctx.arc(cx,cy,sc*1.0,0,7); ctx.stroke();
      for(i=0;i<pts.length;i++){ ctx.fillStyle=pts[i].cls?PNK:BLU; ctx.beginPath(); ctx.arc(cx+pts[i].x*sc, cy-pts[i].y*sc, 5,0,7); ctx.fill(); }
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('원래 특징 (x, y) — 직선 하나론 못 가름', cx, cy+sc*1.8+8);
      // 오른쪽: 새 특징 r=√(x²+y²) 1D 축 → 임계값으로 분리
      var ax0=W*0.52, ax1=W*0.92, ay=H*0.46, rmax=1.7;
      ctx.strokeStyle='rgba(61,214,220,0.4)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(ax0,ay); ctx.lineTo(ax1,ay); ctx.stroke();
      ctx.fillStyle=CYA; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('새 특징  r = √(x²+y²)  →', (ax0+ax1)/2, ay-sc*1.6);
      var correct=0;
      for(i=0;i<pts.length;i++){ var px=ax0+(pts[i].r/rmax)*(ax1-ax0), pred=(pts[i].r<s.thr)?0:1; if(pred===pts[i].cls)correct++;
        ctx.fillStyle=pts[i].cls?PNK:BLU; ctx.beginPath(); ctx.arc(px, ay+(pts[i].cls?14:-14), 5,0,7); ctx.fill(); }
      var thX=ax0+(s.thr/rmax)*(ax1-ax0);
      ctx.strokeStyle=GLD; ctx.lineWidth=2; ctx.setLineDash([5,4]); ctx.beginPath(); ctx.moveTo(thX, ay-sc*1.4); ctx.lineTo(thX, ay+sc*1.4); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=GLD; ctx.font='12px sans-serif'; ctx.fillText('임계값 r='+s.thr.toFixed(2), thX, ay+sc*1.7);
      var acc=correct/pts.length*100;
      ctx.fillStyle=acc>95?GRN:CYA; ctx.font='600 17px sans-serif'; ctx.textAlign='center'; ctx.fillText('분리 정확도 = '+acc.toFixed(0)+'%'+(acc>95?'  ★ 완벽 분리!':''), W*0.5, H*0.13);
      E.tapHint(W/2, H*0.95, '임계값을 r=1 근처로 — 새 특징 하나로 완벽 분리됩니다', true);
      E.big('피처 엔지니어링 — 좋은 특징이 모델 절반', '왼쪽 두 고리는 직선으로 못 가릅니다. 그런데 <b>새 특징 r=√(x²+y²)</b> 하나를 만들면, r 임계값 하나로 <b>완벽히 분리</b>되죠(정확도 실측). 복잡한 모델보다 <b>좋은 특징</b>이 더 강력할 때가 많습니다 — 이것이 피처 엔지니어링입니다.'); }
  },

  // ══════════ 5. 데이터 양과 성능 — 학습 곡선 ══════════
  { id:'ai2_05',
    enter:function(E){ var self=this; this.s={n:12};
      E.controls('<div class="ctrl"><label>훈련 데이터 수 N</label><input type="range" id="nn" min="4" max="80" step="4" value="12"><output id="nno">12</output></div>');
      E.bind('#nn','input',function(e){ self.s.n=+e.target.value; document.getElementById('nno').textContent=e.target.value; E.blip(300+self.s.n,0.05); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 참함수 + 잡음. N개 훈련으로 평균(상수)·1차 적합? → 검증오차를 N에 따라 실측(학습곡선)
      function f(x){ return 0.5+0.35*Math.sin(2.2*x+0.4); }
      function fit1(N){ // 1차 회귀(최소제곱)로 N개 훈련 → 검증오차
        var X=[],Y=[]; for(var i=0;i<N;i++){ var x=((Math.sin(i*1.7)*1e3%1+1)%1); X.push(x); Y.push(f(x)+noise(i*5+2)*0.12); }
        var n=N,sx=0,sy=0,sxx=0,sxy=0; for(i=0;i<n;i++){sx+=X[i];sy+=Y[i];sxx+=X[i]*X[i];sxy+=X[i]*Y[i];}
        var w=(n*sxy-sx*sy)/(n*sxx-sx*sx||1e-9), b=(sy-w*sx)/n;
        // 검증오차: 고정 검증셋 30개
        var ve=0,M=30; for(i=0;i<M;i++){ var xv=(i+0.5)/M, e=(w*xv+b)-f(xv); ve+=e*e; } return {w:w,b:b,ve:ve/M}; }
      var r=fit1(s.n);
      // 왼쪽: 현재 적합
      var ox=W*0.12, oy=H*0.70, pw=W*0.42, pv=H*0.46;
      function SX(x){return ox+x*pw;} function SY(y){return oy-(y-0.05)/0.95*pv;}
      ctx.strokeStyle='rgba(61,214,220,0.22)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(ox,oy);ctx.lineTo(ox+pw,oy);ctx.moveTo(ox,oy);ctx.lineTo(ox,oy-pv);ctx.stroke();
      ctx.strokeStyle='rgba(126,224,176,0.5)'; ctx.lineWidth=1.5; ctx.beginPath(); for(var x=0;x<=1;x+=0.02){var p=SY(f(x));if(x===0)ctx.moveTo(SX(x),p);else ctx.lineTo(SX(x),p);} ctx.stroke();
      for(var i=0;i<s.n && i<60;i++){ var xx=((Math.sin(i*1.7)*1e3%1+1)%1), yy=f(xx)+noise(i*5+2)*0.12; ctx.fillStyle=CYA; ctx.beginPath(); ctx.arc(SX(xx),SY(yy),4,0,7); ctx.fill(); }
      ctx.strokeStyle=GLD; ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(SX(0),SY(r.b)); ctx.lineTo(SX(1),SY(r.w+r.b)); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('N='+s.n+'개로 학습한 모델', ox+pw/2, oy+18);
      // 오른쪽: 학습 곡선(N vs 검증오차) — 여러 N에서 실측
      var bx=W*0.62, by=H*0.24, bw=W*0.30, bh=H*0.42;
      ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(bx,by);ctx.lineTo(bx,by+bh);ctx.lineTo(bx+bw,by+bh);ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='right'; ctx.fillText('검증오차', bx-6, by+8); ctx.textAlign='center'; ctx.fillText('데이터 수 N →', bx+bw/2, by+bh+18);
      var vmax=0.06; ctx.strokeStyle=CYA; ctx.lineWidth=2; ctx.beginPath();
      for(var Nn=4;Nn<=80;Nn+=4){ var ve=fit1(Nn).ve, px=bx+(Nn-4)/76*bw, py=by+bh-Math.min(bh,ve/vmax*bh); if(Nn===4)ctx.moveTo(px,py); else ctx.lineTo(px,py); } ctx.stroke();
      var curPx=bx+(s.n-4)/76*bw, curPy=by+bh-Math.min(bh,r.ve/vmax*bh);
      ctx.fillStyle=GLD; ctx.beginPath(); ctx.arc(curPx,curPy,6,0,7); ctx.fill();
      ctx.fillStyle=GLD; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.fillText('검증오차 = '+r.ve.toFixed(4), bx+bw/2, by-6);
      E.tapHint(W/2, H*0.95, 'N을 늘려 보세요 — 데이터가 많을수록 검증오차가 줄고 안정됩니다', true);
      E.big('데이터 양과 성능 — 학습 곡선', '<b>데이터는 많을수록 좋습니다.</b> 훈련 데이터 N을 늘리면 모델이 잡음에 덜 휘둘려 검증오차가 줄고 안정됩니다(실측 곡선). “더 똑똑한 모델”보다 “더 많은 좋은 데이터”가 성능을 끌어올릴 때가 많죠 — 그래서 데이터 수집·정제가 AI의 절반입니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
