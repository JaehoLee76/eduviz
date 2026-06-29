/* 인공지능 제1장 — AI 기초: AI·ML·DL 관계 · 학습의 세 종류 · 특징과 라벨 · 모델=파라미터(손실 최소화) · 과적합과 일반화
   동작(behavior)만. 텍스트=content/ai1.json. 엔진 js/engine.js 공유. 색: AI=시안.
   골든룰: 화면의 직선·손실·다항식·오차는 전부 실시간 경사하강/최소제곱으로 계산(베껴 그리기 금지). */
(function(){
  var CYA='#3dd6dc', BLU='#7ab8ff', GLD='#ffd27a', GRN='#7ee0b0', PNK='#f4a0c0', DIM='#9b99a3', RED='#f0888a';

  // 결정적 데이터(난수 없음)
  function noise(i){ return ((Math.sin(i*12.9898)*43758.5453)%1+1)%1 - 0.5; }
  var LIN=(function(){ var a=[],N=11; for(var i=0;i<N;i++){ var x=0.06+i/(N-1)*0.88; a.push([x, 0.6*x+0.2 + noise(i)*0.16]); } return a; })();
  // 과적합용: 매끄러운 곡선 + 잡음, 훈련/검증 분할(짝=훈련, 홀=검증)
  function gfn(x){ return 0.5 + 0.33*Math.sin(2.4*x+0.3); }
  var TR=[], TE=[];
  (function(){ var N=18; for(var i=0;i<N;i++){ var x=0.04+i/(N-1)*0.92, y=gfn(x)+noise(i*7+3)*0.11; (i%2?TE:TR).push([x,y]); } })();

  // 최소제곱 다항회귀: 정규방정식 + 가우스 소거. x는 [-1,1]로 스케일.
  function solve(A,b){ var n=b.length, i,j,k; A=A.map(function(r){return r.slice();}); b=b.slice();
    for(i=0;i<n;i++){ var p=i; for(k=i+1;k<n;k++) if(Math.abs(A[k][i])>Math.abs(A[p][i])) p=k;
      var t=A[i];A[i]=A[p];A[p]=t; var tb=b[i];b[i]=b[p];b[p]=tb;
      var piv=A[i][i]||1e-9; for(k=i+1;k<n;k++){ var f=A[k][i]/piv; for(j=i;j<n;j++) A[k][j]-=f*A[i][j]; b[k]-=f*b[i]; } }
    var x=new Array(n); for(i=n-1;i>=0;i--){ var s=b[i]; for(j=i+1;j<n;j++) s-=A[i][j]*x[j]; x[i]=s/(A[i][i]||1e-9); } return x; }
  function polyfit(pts,deg){ var n=deg+1, ATA=[], ATy=[], r,c,i;
    for(r=0;r<n;r++){ ATA.push(new Array(n).fill(0)); ATy.push(0); }
    for(i=0;i<pts.length;i++){ var xs=2*pts[i][0]-1, pw=[], v=1, j; for(j=0;j<n;j++){ pw.push(v); v*=xs; }
      for(r=0;r<n;r++){ for(c=0;c<n;c++) ATA[r][c]+=pw[r]*pw[c]; ATy[r]+=pw[r]*pts[i][1]; } }
    for(r=0;r<n;r++) ATA[r][r]+=1e-7; return solve(ATA,ATy); }
  function polyval(co,x){ var xs=2*x-1, v=0, j; for(j=co.length-1;j>=0;j--) v=v*xs+co[j]; return v; }
  function mse(pts,co){ var s=0,i; for(i=0;i<pts.length;i++){ var e=polyval(co,pts[i][0])-pts[i][1]; s+=e*e; } return s/pts.length; }

  function plot(E,ox,oy,pw,pv){ var ctx=E.ctx; ctx.strokeStyle='rgba(61,214,220,0.22)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(ox,oy); ctx.lineTo(ox+pw,oy); ctx.moveTo(ox,oy); ctx.lineTo(ox,oy-pv); ctx.stroke(); }

  var scenes = [

  // ══════════ 1. AI ⊃ ML ⊃ DL — 포함 관계 ══════════
  { id:'ai1_01',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*120,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, cx=W*0.36, cy=H*0.40;
      var rings=[ {r:Math.min(W*0.27,H*0.34), c:CYA, t:'인공지능 (AI)', d:'사람 같은 지능을 흉내 내는 모든 기술', ex:'규칙기반·탐색·머신러닝 전부 포함'},
        {r:Math.min(W*0.27,H*0.34)*0.70, c:GLD, t:'머신러닝 (ML)', d:'데이터로부터 규칙을 스스로 학습', ex:'회귀·결정트리·SVM·신경망'},
        {r:Math.min(W*0.27,H*0.34)*0.40, c:GRN, t:'딥러닝 (DL)', d:'여러 층 신경망으로 표현을 깊게 학습', ex:'CNN·RNN·Transformer·LLM'} ];
      for(var i=0;i<3;i++){ var on=(i<=s.step); ctx.globalAlpha=on?1:0.30;
        ctx.beginPath(); ctx.arc(cx,cy,rings[i].r,0,7); ctx.fillStyle='rgba(255,255,255,0.03)'; ctx.fill();
        ctx.strokeStyle=rings[i].c; ctx.lineWidth=(i===s.step?3:1.6); ctx.stroke();
        ctx.fillStyle=rings[i].c; ctx.font='600 14px sans-serif'; ctx.textAlign='center';
        ctx.fillText(rings[i].t, cx, cy-rings[i].r+ (i===0?-8:18)); ctx.globalAlpha=1; }
      // 설명 패널(현재 단계)
      var cur=rings[s.step], px=W*0.66, py=H*0.30;
      ctx.fillStyle=cur.c; ctx.font='600 19px sans-serif'; ctx.textAlign='left'; ctx.fillText(cur.t, px, py);
      ctx.fillStyle='#dfeef0'; ctx.font='15px sans-serif'; ctx.fillText(cur.d, px, py+30);
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.fillText('예: '+cur.ex, px, py+56);
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.fillText('딥러닝 ⊂ 머신러닝 ⊂ 인공지능', px, py+92);
      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 (AI → ML → DL)', true);
      E.big('AI ⊃ ML ⊃ DL — 포함 관계', 'AI는 가장 넓은 우산이고, 그 안에 데이터로 배우는 머신러닝, 다시 그 안에 깊은 신경망인 딥러닝이 들어 있습니다. LLM은 딥러닝의 한 갈래죠.'); }
  },

  // ══════════ 2. 학습의 세 종류 ══════════
  { id:'ai1_02',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, fr=E.frame;
      var cols=[ {x:W*0.20, c:GLD, t:'지도학습', s:'정답(라벨) 보고 배움', e:'분류·회귀 (스팸판별·집값예측)'},
        {x:W*0.50, c:GRN, t:'비지도학습', s:'정답 없이 구조를 찾음', e:'군집·차원축소 (고객 분류)'},
        {x:W*0.80, c:PNK, t:'강화학습', s:'보상을 따라 시행착오', e:'게임·로봇·제어 (알파고)'} ];
      var cy=H*0.40, R=Math.min(W*0.11,H*0.16);
      for(var i=0;i<3;i++){ var o=cols[i];
        ctx.fillStyle=o.c; ctx.font='600 18px sans-serif'; ctx.textAlign='center'; ctx.fillText(o.t, o.x, H*0.16);
        ctx.fillStyle='#dfeef0'; ctx.font='13.5px sans-serif'; ctx.fillText(o.s, o.x, H*0.16+24);
        // 미니 그림
        if(i===0){ // 라벨된 점 + 경계
          var pa=[[-0.6,-0.4,1],[-0.3,0.3,1],[0.1,-0.2,1],[0.4,0.5,0],[0.6,-0.1,0],[0.2,0.6,0]];
          for(var k=0;k<pa.length;k++){ ctx.fillStyle=pa[k][2]?BLU:RED; ctx.beginPath(); ctx.arc(o.x+pa[k][0]*R,cy+pa[k][1]*R,5,0,7); ctx.fill(); }
          ctx.strokeStyle=o.c; ctx.lineWidth=2; ctx.setLineDash([5,4]); ctx.beginPath(); ctx.moveTo(o.x-R*0.8,cy+R*0.7); ctx.lineTo(o.x+R*0.8,cy-R*0.7); ctx.stroke(); ctx.setLineDash([]);
        } else if(i===1){ // 군집 두 덩어리
          for(k=0;k<5;k++){ var a1=k*1.3; ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(o.x-R*0.45+Math.cos(a1)*R*0.28, cy-R*0.2+Math.sin(a1)*R*0.28,4.5,0,7); ctx.fill();
            ctx.fillStyle=CYA; ctx.beginPath(); ctx.arc(o.x+R*0.5+Math.cos(a1+2)*R*0.26, cy+R*0.3+Math.sin(a1+2)*R*0.26,4.5,0,7); ctx.fill(); }
          ctx.strokeStyle='rgba(126,224,176,0.5)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(o.x-R*0.45,cy-R*0.2,R*0.5,0,7); ctx.stroke();
          ctx.strokeStyle='rgba(61,214,220,0.5)'; ctx.beginPath(); ctx.arc(o.x+R*0.5,cy+R*0.3,R*0.5,0,7); ctx.stroke();
        } else { // 에이전트→보상 화살표 순환
          var ph=(fr*0.03)%(2*Math.PI);
          ctx.strokeStyle=o.c; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(o.x,cy,R*0.6, ph, ph+Math.PI*1.4); ctx.stroke();
          var ex=o.x+Math.cos(ph+Math.PI*1.4)*R*0.6, ey=cy+Math.sin(ph+Math.PI*1.4)*R*0.6;
          ctx.fillStyle=o.c; ctx.beginPath(); ctx.arc(ex,ey,5,0,7); ctx.fill();
          ctx.fillStyle=GLD; ctx.font='13px sans-serif'; ctx.fillText('＋보상', o.x, cy+4);
        }
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText(o.e, o.x, cy+R+26); }
      E.big('학습의 세 종류 — 지도 · 비지도 · 강화', '정답(라벨)을 보고 배우면 지도학습, 정답 없이 데이터의 구조만 찾으면 비지도학습, 행동의 보상으로 시행착오하며 배우면 강화학습입니다. 대부분의 LLM 사전학습은 ‘다음 단어 맞히기’라는 자기지도(지도학습의 변형)입니다.'); }
  },

  // ══════════ 3. 특징·라벨·훈련/검증 분할 ══════════
  { id:'ai1_03',
    enter:function(E){ var self=this; this.s={split:70};
      E.controls('<div class="ctrl"><label>훈련 데이터 비율 (%)</label><input type="range" id="sp" min="50" max="90" step="10" value="70"><output id="spo">70</output></div>');
      E.bind('#sp','input',function(e){ self.s.split=+e.target.value; document.getElementById('spo').textContent=e.target.value; E.blip(360,0.06); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 데이터 = 특징(x1,x2) + 라벨(색). 결정적 20개
      var N=20, ntr=Math.round(N*s.split/100);
      var ox=W*0.16, oy=H*0.74, pw=W*0.42, pv=H*0.46;
      plot(E,ox,oy,pw,pv);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('특징 x₂', ox+4, oy-pv-6); ctx.textAlign='right'; ctx.fillText('특징 x₁ →', ox+pw, oy+16);
      for(var i=0;i<N;i++){ var x1=((Math.sin(i*3.1)*1e4)%1+1)%1, x2=((Math.cos(i*2.3)*1e4)%1+1)%1, lab=(x1+x2>1)?1:0, train=(i<ntr);
        var px=ox+x1*pw, py=oy-x2*pv;
        ctx.globalAlpha=train?1:0.9; ctx.fillStyle=lab?BLU:RED; ctx.beginPath(); ctx.arc(px,py,6,0,7); ctx.fill();
        if(!train){ ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(px,py,8.5,0,7); ctx.stroke(); }   // 검증=흰 테두리
        ctx.globalAlpha=1; }
      // 범례·설명
      var px2=W*0.64, py2=H*0.30;
      ctx.fillStyle='#dfeef0'; ctx.font='15px sans-serif'; ctx.textAlign='left';
      ctx.fillText('한 데이터 = 특징(입력) + 라벨(정답)', px2, py2);
      ctx.fillStyle=BLU; ctx.beginPath(); ctx.arc(px2+8,py2+28,6,0,7); ctx.fill(); ctx.fillStyle='#dfeef0'; ctx.font='14px sans-serif'; ctx.fillText('라벨 A (파랑)', px2+22, py2+33);
      ctx.fillStyle=RED; ctx.beginPath(); ctx.arc(px2+8,py2+52,6,0,7); ctx.fill(); ctx.fillStyle='#dfeef0'; ctx.fillText('라벨 B (빨강)', px2+22, py2+57);
      ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(px2+8,py2+76,7,0,7); ctx.stroke(); ctx.fillStyle='#dfeef0'; ctx.fillText('흰 테두리 = 검증용(학습에 안 씀)', px2+22, py2+81);
      ctx.fillStyle=CYA; ctx.font='600 16px sans-serif'; ctx.fillText('훈련 '+ntr+'개  ·  검증 '+(N-ntr)+'개', px2, py2+116);
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.fillText('모델은 훈련 데이터로만 배우고,', px2, py2+142);
      ctx.fillStyle=DIM; ctx.fillText('한 번도 못 본 검증 데이터로 실력을 잽니다.', px2, py2+160);
      E.tapHint(W/2, H*0.95, '슬라이더로 훈련/검증 비율을 바꿔 보세요', true);
      E.big('특징·라벨, 그리고 훈련/검증 분할', '데이터를 ‘훈련용’과 ‘검증용’으로 나눠야 합니다 — 시험 문제를 미리 보고 외운 학생처럼, 본 데이터에만 잘하는 모델은 진짜 실력이 아니니까요(과적합).'); }
  },

  // ══════════ 4. 모델=파라미터, 학습=손실 최소화 (직접 맞춰 보기) ══════════
  { id:'ai1_04',
    enter:function(E){ var self=this; this.s={w:0.0,b:0.5};
      E.controls('<div class="ctrl"><label>기울기 w</label><input type="range" id="ww" min="-0.5" max="1.5" step="0.05" value="0"><output id="wwo">0.00</output>'
        +'<label style="margin-left:14px">절편 b</label><input type="range" id="bb" min="-0.2" max="0.8" step="0.02" value="0.5"><output id="bbo">0.50</output></div>');
      E.bind('#ww','input',function(e){ self.s.w=+e.target.value; document.getElementById('wwo').textContent=(+e.target.value).toFixed(2); E.blip(360,0.05); });
      E.bind('#bb','input',function(e){ self.s.b=+e.target.value; document.getElementById('bbo').textContent=(+e.target.value).toFixed(2); E.blip(320,0.05); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var ox=W*0.16, oy=H*0.74, pw=W*0.68, pv=H*0.50;
      function SX(x){ return ox+x*pw; } function SY(y){ return oy - y/1.05*pv; }
      plot(E,ox,oy,pw,pv);
      // 최적(최소제곱) 직선 — 비교용
      var n=LIN.length, sx=0,sy=0,sxx=0,sxy=0; for(var i=0;i<n;i++){ sx+=LIN[i][0]; sy+=LIN[i][1]; sxx+=LIN[i][0]*LIN[i][0]; sxy+=LIN[i][0]*LIN[i][1]; }
      var wb=(n*sxy-sx*sy)/(n*sxx-sx*sx), bb2=(sy-wb*sx)/n;
      ctx.strokeStyle='rgba(126,224,176,0.5)'; ctx.lineWidth=1.6; ctx.setLineDash([6,5]); ctx.beginPath(); ctx.moveTo(SX(0),SY(bb2)); ctx.lineTo(SX(1),SY(wb+bb2)); ctx.stroke(); ctx.setLineDash([]);
      // 내 직선 + 잔차 + MSE(실측)
      var m=0; for(i=0;i<n;i++){ var yh=s.w*LIN[i][0]+s.b, e=yh-LIN[i][1]; m+=e*e;
        ctx.strokeStyle='rgba(244,160,192,0.6)'; ctx.lineWidth=1.3; ctx.beginPath(); ctx.moveTo(SX(LIN[i][0]),SY(LIN[i][1])); ctx.lineTo(SX(LIN[i][0]),SY(yh)); ctx.stroke();
        ctx.fillStyle=CYA; ctx.beginPath(); ctx.arc(SX(LIN[i][0]),SY(LIN[i][1]),5,0,7); ctx.fill(); }
      m/=n; var mopt=0; for(i=0;i<n;i++){ var e2=(wb*LIN[i][0]+bb2)-LIN[i][1]; mopt+=e2*e2; } mopt/=n;
      ctx.strokeStyle=GLD; ctx.lineWidth=2.8; ctx.beginPath(); ctx.moveTo(SX(0),SY(s.b)); ctx.lineTo(SX(1),SY(s.w+s.b)); ctx.stroke();
      ctx.fillStyle=GLD; ctx.font='600 16px sans-serif'; ctx.textAlign='left'; ctx.fillText('예측 ŷ = w·x + b', SX(0)+8, SY(s.w+s.b)-8);
      ctx.fillStyle='rgba(126,224,176,0.85)'; ctx.font='12px sans-serif'; ctx.fillText('초록 점선 = 최적(최소 손실)', SX(0)+8, oy-pv+4);
      var good=(m<mopt*1.08);
      ctx.fillStyle=good?GRN:CYA; ctx.font='600 17px sans-serif'; ctx.textAlign='center';
      ctx.fillText('손실(MSE) = '+m.toFixed(4)+(good?'  ★ 최적에 도달!':'   (최소 '+mopt.toFixed(4)+')'), W/2, H*0.10);
      E.tapHint(W/2, H*0.95, 'w·b를 움직여 손실(MSE)을 최소로 만들어 보세요', true);
      E.big('모델 = 파라미터, 학습 = 손실 최소화', '직선 모델의 ‘지식’은 단 두 숫자 w·b에 들어 있습니다. 학습이란 이 숫자를 조절해 예측 오차(손실)를 가장 작게 만드는 일 — 손이 아니라 경사하강이 자동으로 합니다. 신경망은 같은 일을 수십억 개 파라미터로 할 뿐입니다.'); }
  },

  // ══════════ 5. 과적합 vs 일반화 (다항식 차수) ══════════
  { id:'ai1_05',
    enter:function(E){ var self=this; this.s={deg:3};
      E.controls('<div class="ctrl"><label>다항식 차수 (모델 복잡도)</label><input type="range" id="dg" min="1" max="9" step="1" value="3"><output id="dgo">3</output></div>');
      E.bind('#dg','input',function(e){ self.s.deg=+e.target.value; document.getElementById('dgo').textContent=e.target.value; E.blip(300+self.s.deg*40,0.06); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var ox=W*0.10, oy=H*0.72, pw=W*0.54, pv=H*0.50;
      function SX(x){ return ox+x*pw; } function SY(y){ return oy - (y-0.05)/0.95*pv; }
      plot(E,ox,oy,pw,pv);
      var co=polyfit(TR,s.deg);
      // 적합 곡선(실제 다항식)
      ctx.strokeStyle=GLD; ctx.lineWidth=2.6; ctx.beginPath();
      for(var x=0;x<=1.0001;x+=0.005){ var y=polyval(co,x), py=SY(y); if(py<H*0.16)py=H*0.16; if(py>oy+4)py=oy+4; if(x===0)ctx.moveTo(SX(x),py); else ctx.lineTo(SX(x),py); } ctx.stroke();
      // 훈련(채움)·검증(흰테) 점
      var i; for(i=0;i<TR.length;i++){ ctx.fillStyle=CYA; ctx.beginPath(); ctx.arc(SX(TR[i][0]),SY(TR[i][1]),5,0,7); ctx.fill(); }
      for(i=0;i<TE.length;i++){ ctx.fillStyle='rgba(244,160,192,0.85)'; ctx.beginPath(); ctx.arc(SX(TE[i][0]),SY(TE[i][1]),5,0,7); ctx.fill(); ctx.strokeStyle='#fff'; ctx.lineWidth=1.6; ctx.stroke(); }
      ctx.fillStyle=CYA; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('● 훈련 데이터', ox, oy-pv-4);
      ctx.fillStyle=PNK; ctx.fillText('◯ 검증 데이터(흰테)', ox+110, oy-pv-4);
      // 오차 막대(실측)
      var etr=mse(TR,co), ete=mse(TE,co), bx=W*0.72, by=H*0.30, bw=W*0.04, scl=H*0.34/0.08;
      function bar(x,v,c,lab){ var h=Math.min(H*0.34, v*scl); ctx.fillStyle=c; ctx.fillRect(x,by+H*0.34-h,bw,h);
        ctx.fillStyle=c; ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.fillText(v.toFixed(4), x+bw/2, by+H*0.34-h-6); ctx.fillStyle='#dfeef0'; ctx.font='13px sans-serif'; ctx.fillText(lab, x+bw/2, by+H*0.34+18); }
      bar(bx, etr, CYA, '훈련오차'); bar(bx+W*0.10, ete, PNK, '검증오차');
      var verdict = s.deg<=2 ? '과소적합 — 너무 단순' : (ete>etr*2.4 ? '과적합 — 훈련만 잘함' : '적당 — 잘 일반화');
      ctx.fillStyle = s.deg<=2?GLD : (ete>etr*2.4?RED:GRN); ctx.font='600 16px sans-serif'; ctx.textAlign='center'; ctx.fillText(verdict, bx+W*0.05, by-14);
      E.tapHint(W/2, H*0.95, '차수를 올려 보세요 — 훈련오차↓ 인데 검증오차↑ 되는 순간이 과적합', true);
      E.big('과적합 vs 일반화', '모델이 복잡할수록(고차) 훈련 데이터는 완벽히 외우지만(훈련오차 0), 못 본 검증 데이터에서는 오히려 더 틀립니다 — 잡음까지 외운 탓이죠. 좋은 모델은 외우지 않고 ‘일반화’합니다. 차수를 올리며 검증오차가 다시 치솟는 순간을 잡아 보세요.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
