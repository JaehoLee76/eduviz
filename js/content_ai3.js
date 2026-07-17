/* 인공지능 제3장 — 지도학습: 회귀vs분류 · 로지스틱 회귀(시그모이드) · 결정경계와 정확도 · 손실함수(MSE vs 크로스엔트로피) · 학습=손실 최소화
   동작(behavior)만. 텍스트=content/ai3.json. 엔진 js/engine.js 공유. 색: AI=시안.
   골든룰: 화면의 확률·정확도·손실·경계·예측은 전부 draw에서 실시간 계산(시그모이드·로지스틱손실·실측정확도). 난수는 결정적 sin/해시. 베껴 그리기 금지. */
(function(){
  var CYA='#3dd6dc', BLU='#7ab8ff', GLD='#ffd27a', GRN='#7ee0b0', PNK='#f4a0c0', DIM='#9b99a3', RED='#f0888a';

  function sigmoid(z){ return 1/(1+Math.exp(-z)); }
  // 결정적 의사난수 (난수 금지)
  function rnd(i){ return ((Math.sin(i*12.9898+78.233)*43758.5453)%1+1)%1; }

  // ai3_03/05용 결정적 2D 점: 두 클래스(진짜 경계 y=x 위/아래 + 잡음). [x1,x2,label]
  var PTS2 = (function(){ var a=[],N=24; for(var i=0;i<N;i++){ var x1=0.08+rnd(i)*0.84, x2=0.08+rnd(i*7+3)*0.84;
      var margin=x2-x1, lab=margin>0?1:0; if(Math.abs(margin)<0.08){ lab = rnd(i*13+5)>0.5?1:0; } // 경계 근처는 흔들어 100%불가
      a.push([x1,x2,lab]); } return a; })();

  // ai3_02용 1D 점: x값과 라벨(x>0.5면 1). 결정적
  var PTS1 = (function(){ var a=[],N=14; for(var i=0;i<N;i++){ var x=0.05+i/(N-1)*0.9; var p=sigmoid((x-0.5)*8); var lab=(rnd(i*5+2)<p)?1:0; a.push([x,lab]); } return a; })();

  // ai3_05용 회귀 데이터(학습된 선형모델로 예측). 결정적: 진짜 y=1.4x-0.2+잡음
  var REG = (function(){ var a=[],N=12; for(var i=0;i<N;i++){ var x=0.05+i/(N-1)*0.9; var y=1.4*x-0.2 + (rnd(i*9+1)-0.5)*0.18; a.push([x,y]); } return a; })();

  function axes(E,ox,oy,pw,pv){ var ctx=E.ctx; ctx.strokeStyle='rgba(61,214,220,0.22)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(ox,oy); ctx.lineTo(ox+pw,oy); ctx.moveTo(ox,oy); ctx.lineTo(ox,oy-pv); ctx.stroke(); }

  var scenes = [

  // ══════════ 1. 회귀 vs 분류 ══════════
  { id:'ai3_01',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(360+this.s.step*120,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 왼쪽: 회귀(연속값 — 직선 적합) · 오른쪽: 분류(2클래스 + 경계)
      var pw=W*0.30, pv=H*0.42, oy=H*0.70;
      // ── 왼쪽 회귀: REG 점 + 최소제곱 직선(실계산) ──
      var Lx=W*0.08;
      axes(E,Lx,oy,pw,pv);
      var n=REG.length, sx=0,sy=0,sxx=0,sxy=0; for(var i=0;i<n;i++){ sx+=REG[i][0]; sy+=REG[i][1]; sxx+=REG[i][0]*REG[i][0]; sxy+=REG[i][0]*REG[i][1]; }
      var w=(n*sxy-sx*sy)/(n*sxx-sx*sx), b=(sy-w*sx)/n;
      function LX(x){ return Lx+x*pw; } function LY(y){ return oy-((y+0.2)/1.7)*pv; }
      for(i=0;i<n;i++){ ctx.fillStyle=CYA; ctx.beginPath(); ctx.arc(LX(REG[i][0]),LY(REG[i][1]),4.5,0,7); ctx.fill(); }
      var hi=(s.step===0);
      ctx.strokeStyle=GLD; ctx.lineWidth=hi?3:1.6; ctx.globalAlpha=hi?1:0.45;
      ctx.beginPath(); ctx.moveTo(LX(0),LY(b)); ctx.lineTo(LX(0.95),LY(w*0.95+b)); ctx.stroke(); ctx.globalAlpha=1;
      ctx.fillStyle=GLD; ctx.font='600 15px sans-serif'; ctx.textAlign='center'; ctx.fillText('회귀 — 연속값 예측', Lx+pw/2, oy-pv-14);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('ŷ = '+w.toFixed(2)+'·x '+(b<0?'−':'+')+' '+Math.abs(b).toFixed(2), Lx+pw/2, oy+22);
      ctx.fillStyle=DIM; ctx.fillText('출력: 실수 (집값·온도·키)', Lx+pw/2, oy+40);

      // ── 오른쪽 분류: PTS2 두 클래스 + 경계선 ──
      var Rx=W*0.56;
      axes(E,Rx,oy,pw,pv);
      function RX(x){ return Rx+x*pw; } function RY(x){ return oy-x*pv; }
      for(i=0;i<PTS2.length;i++){ var P=PTS2[i]; ctx.fillStyle=P[2]?BLU:RED; ctx.beginPath(); ctx.arc(RX(P[0]),RY(P[1]),4.5,0,7); ctx.fill(); }
      var hi2=(s.step===1);
      ctx.strokeStyle=GRN; ctx.lineWidth=hi2?3:1.6; ctx.globalAlpha=hi2?1:0.45; ctx.setLineDash([6,5]);
      ctx.beginPath(); ctx.moveTo(RX(0),RY(0)); ctx.lineTo(RX(0.92),RY(0.92)); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha=1;
      ctx.fillStyle=GRN; ctx.font='600 15px sans-serif'; ctx.textAlign='center'; ctx.fillText('분류 — 범주 예측', Rx+pw/2, oy-pv-14);
      ctx.fillStyle=BLU; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('● 클래스 A', Rx+6, oy+22);
      ctx.fillStyle=RED; ctx.fillText('● 클래스 B', Rx+6, oy+40);
      ctx.fillStyle=DIM; ctx.textAlign='center'; ctx.fillText('출력: 범주 (스팸/정상·개/고양이)', Rx+pw/2, oy+58);

      E.tapHint(W/2, H*0.93, '화면 탭 = 회귀 ↔ 분류', true);
      E.big('회귀 vs 분류 — 지도학습의 두 얼굴', '지도학습은 출력이 무엇이냐로 갈립니다. 출력이 ‘얼마’라는 연속된 숫자면 회귀(집값·온도), ‘어느 쪽’이라는 범주면 분류(스팸/정상)입니다. 같은 데이터라도 무엇을 맞히려 하느냐에 따라 문제가 달라지죠.'); }
  },

  // ══════════ 2. 로지스틱 회귀 — 시그모이드로 확률 출력 ══════════
  { id:'ai3_02',
    enter:function(E){ var self=this; this.s={w:8};
      E.controls('<div class="ctrl"><label>기울기 w (경계의 가파름)</label><input type="range" id="ww" min="2" max="20" step="1" value="8"><output id="wwo">8</output></div>');
      E.bind('#ww','input',function(e){ self.s.w=+e.target.value; document.getElementById('wwo').textContent=e.target.value; E.blip(360,0.06); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var ox=W*0.12, oy=H*0.74, pw=W*0.62, pv=H*0.52;
      function SX(x){ return ox+x*pw; } function SY(p){ return oy-p*pv; } // p∈[0,1]
      axes(E,ox,oy,pw,pv);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('확률 σ(z)', ox+4, oy-pv-6); ctx.textAlign='right'; ctx.fillText('입력 x →', ox+pw, oy+18);
      // 0.5 결정경계 가로선 + σ=0.5인 x (경계: w(x-0.5)=0 → x=0.5)
      ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.setLineDash([4,4]); ctx.beginPath(); ctx.moveTo(SX(0),SY(0.5)); ctx.lineTo(SX(1),SY(0.5)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=DIM; ctx.textAlign='left'; ctx.font='13px sans-serif'; ctx.fillText('σ=0.5 (결정 임계값)', SX(0.02), SY(0.5)-5);
      // 시그모이드 곡선(실계산): z = w·(x-0.5)
      ctx.strokeStyle=GLD; ctx.lineWidth=2.8; ctx.beginPath();
      for(var x=0;x<=1.0001;x+=0.004){ var p=sigmoid(s.w*(x-0.5)); if(x===0)ctx.moveTo(SX(x),SY(p)); else ctx.lineTo(SX(x),SY(p)); } ctx.stroke();
      // 결정경계 세로선 x=0.5
      ctx.strokeStyle=GRN; ctx.lineWidth=2; ctx.setLineDash([6,5]); ctx.beginPath(); ctx.moveTo(SX(0.5),oy); ctx.lineTo(SX(0.5),oy-pv); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=GRN; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('경계 x=0.5', SX(0.5), oy-pv-2);
      // 점들: 위(라벨1)·아래(라벨0)에 배치, 각 점의 예측확률(실계산)·정/오 표시
      var correct=0;
      for(var i=0;i<PTS1.length;i++){ var px=PTS1[i][0], lab=PTS1[i][1], p=sigmoid(s.w*(px-0.5));
        var py=lab? SY(0.92): SY(0.08);
        ctx.fillStyle=lab?BLU:RED; ctx.beginPath(); ctx.arc(SX(px),py,5,0,7); ctx.fill();
        var pred=(p>=0.5)?1:0; if(pred===lab)correct++;
        // 예측확률을 곡선 위 작은 점으로
        ctx.fillStyle='rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.arc(SX(px),SY(p),2.5,0,7); ctx.fill(); }
      var acc=correct/PTS1.length*100;
      // 범례·식
      ctx.fillStyle='#dfeef0'; ctx.font='600 16px sans-serif'; ctx.textAlign='left'; ctx.fillText('σ(z) = 1 / (1 + e^−z),  z = w·(x − 0.5)', W*0.12, H*0.13);
      ctx.fillStyle=CYA; ctx.font='600 15px sans-serif'; ctx.fillText('정확도 = '+acc.toFixed(0)+'%  ('+correct+'/'+PTS1.length+')', W*0.12, H*0.13+24);
      ctx.fillStyle=BLU; ctx.font='12px sans-serif'; ctx.textAlign='right'; ctx.fillText('● 라벨 1', W*0.86, H*0.13); ctx.fillStyle=RED; ctx.fillText('● 라벨 0', W*0.86, H*0.13+20);
      E.tapHint(W/2, H*0.95, 'w를 키워 시그모이드가 가팔라지는 것을 보세요', true);
      E.big('로지스틱 회귀 — 직선을 확률로', '분류인데 왜 ‘회귀’일까요? 먼저 직선 z=w·(x−0.5)로 점수를 내고, 그 점수를 시그모이드 σ에 통과시켜 0~1 사이 확률로 짜부라뜨립니다. 확률이 0.5를 넘으면 ‘예’, 아니면 ‘아니오’. w가 클수록 ‘아니오’에서 ‘예’로 넘어가는 문턱이 가팔라집니다.'); }
  },

  // ══════════ 3. 결정경계와 정확도 ══════════
  { id:'ai3_03',
    enter:function(E){ var self=this; this.s={slope:1.0};
      E.controls('<div class="ctrl"><label>경계 기울기</label><input type="range" id="sl" min="0.3" max="2.5" step="0.05" value="1.00"><output id="slo">1.00</output></div>');
      E.bind('#sl','input',function(e){ self.s.slope=+e.target.value; document.getElementById('slo').textContent=(+e.target.value).toFixed(2); E.blip(360,0.06); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var ox=W*0.12, oy=H*0.76, pw=W*0.50, pv=H*0.56;
      function SX(x){ return ox+x*pw; } function SY(y){ return oy-y*pv; }
      axes(E,ox,oy,pw,pv);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('x₂', ox+4, oy-pv-6); ctx.textAlign='right'; ctx.fillText('x₁ →', ox+pw, oy+18);
      // 경계: 원점 지나는 직선 x2 = slope·x1. 위(x2>slope·x1) → 예측 1, 아래 → 0
      ctx.strokeStyle=GRN; ctx.lineWidth=2.6; ctx.setLineDash([7,5]); ctx.beginPath();
      // 그릴 끝점: x2=slope*x1, 화면 범위(0..1) 안에서
      var x1end = (s.slope>1) ? 1/s.slope : 1, x2end = (s.slope>1)? 1 : s.slope;
      ctx.moveTo(SX(0),SY(0)); ctx.lineTo(SX(x1end),SY(x2end)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=GRN; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('경계 x₂ = '+s.slope.toFixed(2)+'·x₁', SX(0.04), oy-pv+2);
      // 점 분류 + 정확도 실측
      var correct=0;
      for(var i=0;i<PTS2.length;i++){ var P=PTS2[i], pred=(P[1] > s.slope*P[0])?1:0; if(pred===P[2])correct++;
        var ok=(pred===P[2]);
        ctx.fillStyle=P[2]?BLU:RED; ctx.beginPath(); ctx.arc(SX(P[0]),SY(P[1]),5.5,0,7); ctx.fill();
        if(!ok){ ctx.strokeStyle=GLD; ctx.lineWidth=2.4; ctx.beginPath(); ctx.arc(SX(P[0]),SY(P[1]),8.5,0,7); ctx.stroke(); } } // 오분류 = 금색 테두리
      var acc=correct/PTS2.length*100;
      // 패널
      var px=W*0.70, py=H*0.30;
      ctx.fillStyle='#dfeef0'; ctx.font='15px sans-serif'; ctx.textAlign='left'; ctx.fillText('경계 한 줄이 평면을 둘로 가릅니다.', px, py);
      ctx.fillStyle=BLU; ctx.beginPath(); ctx.arc(px+8,py+30,6,0,7); ctx.fill(); ctx.fillStyle='#dfeef0'; ctx.font='14px sans-serif'; ctx.fillText('클래스 A (위쪽이 정답)', px+22, py+35);
      ctx.fillStyle=RED; ctx.beginPath(); ctx.arc(px+8,py+54,6,0,7); ctx.fill(); ctx.fillStyle='#dfeef0'; ctx.fillText('클래스 B (아래쪽이 정답)', px+22, py+59);
      ctx.strokeStyle=GLD; ctx.lineWidth=2.4; ctx.beginPath(); ctx.arc(px+8,py+78,7,0,7); ctx.stroke(); ctx.fillStyle='#dfeef0'; ctx.fillText('금색 테두리 = 오분류', px+22, py+83);
      var col = acc>=90?GRN : acc>=75?GLD : RED;
      ctx.fillStyle=col; ctx.font='600 22px sans-serif'; ctx.fillText('정확도 = '+acc.toFixed(1)+'%', px, py+126);
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.fillText('맞힌 점 '+correct+' / 전체 '+PTS2.length, px, py+150);
      E.tapHint(W/2, H*0.95, '경계 기울기를 돌려 정확도를 최대로', true);
      E.big('결정경계(decision boundary)와 정확도', '분류기가 하는 일은 결국 평면 위에 ‘선 하나 긋기’입니다. 선의 한쪽은 A, 다른 쪽은 B라고 우기는 거죠. 잘 그으면 거의 다 맞고, 비뚤면 멀쩡한 점들이 엉뚱한 편에 떨어집니다. 정확도는 맞힌 점의 비율을 세어 보여 줍니다.'); }
  },

  // ══════════ 4. 손실함수: MSE vs 크로스엔트로피 ══════════
  { id:'ai3_04',
    enter:function(E){ var self=this; this.s={p:0.7};
      E.controls('<div class="ctrl"><label>예측확률 p (정답은 y=1)</label><input type="range" id="pp" min="0.02" max="0.98" step="0.01" value="0.70"><output id="ppo">0.70</output></div>');
      E.bind('#pp','input',function(e){ self.s.p=+e.target.value; document.getElementById('ppo').textContent=(+e.target.value).toFixed(2); E.blip(340,0.06); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var ox=W*0.12, oy=H*0.76, pw=W*0.52, pv=H*0.56;
      // y축 손실 0..4로 스케일
      function SX(p){ return ox+p*pw; } function SY(L){ return oy-Math.min(L,4)/4*pv; }
      axes(E,ox,oy,pw,pv);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('손실', ox+4, oy-pv-6); ctx.textAlign='right'; ctx.fillText('예측확률 p →', ox+pw, oy+18);
      // 크로스엔트로피 곡선 CE = -log(p)  (정답 y=1)
      ctx.strokeStyle=PNK; ctx.lineWidth=2.8; ctx.beginPath();
      for(var p=0.02;p<=0.9801;p+=0.004){ var L=-Math.log(p); if(p===0.02)ctx.moveTo(SX(p),SY(L)); else ctx.lineTo(SX(p),SY(L)); } ctx.stroke();
      // MSE 곡선 (정답 y=1): (1-p)^2  — 비교용
      ctx.strokeStyle=BLU; ctx.lineWidth=2; ctx.setLineDash([6,5]); ctx.beginPath();
      for(p=0.02;p<=0.9801;p+=0.004){ var L2=(1-p)*(1-p); if(p===0.02)ctx.moveTo(SX(p),SY(L2)); else ctx.lineTo(SX(p),SY(L2)); } ctx.stroke(); ctx.setLineDash([]);
      // 현재 p 표시점(실계산)
      var ce=-Math.log(s.p), mse=(1-s.p)*(1-s.p);
      ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(SX(s.p),oy); ctx.lineTo(SX(s.p),oy-pv); ctx.stroke();
      ctx.fillStyle=PNK; ctx.beginPath(); ctx.arc(SX(s.p),SY(ce),6,0,7); ctx.fill();
      ctx.fillStyle=BLU; ctx.beginPath(); ctx.arc(SX(s.p),SY(mse),5,0,7); ctx.fill();
      // 범례·값
      var lx=W*0.70, ly=H*0.28;
      ctx.fillStyle=PNK; ctx.font='600 15px sans-serif'; ctx.textAlign='left'; ctx.fillText('크로스엔트로피', lx, ly);
      ctx.fillStyle='#dfeef0'; ctx.font='13px sans-serif'; ctx.fillText('CE = −log(p)', lx, ly+22);
      ctx.fillStyle=PNK; ctx.font='600 20px sans-serif'; ctx.fillText('= '+ce.toFixed(3), lx, ly+48);
      ctx.fillStyle=BLU; ctx.font='600 15px sans-serif'; ctx.fillText('MSE (비교)', lx, ly+88);
      ctx.fillStyle='#dfeef0'; ctx.font='13px sans-serif'; ctx.fillText('= (1 − p)²', lx, ly+110);
      ctx.fillStyle=BLU; ctx.font='600 20px sans-serif'; ctx.fillText('= '+mse.toFixed(3), lx, ly+136);
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.fillText(s.p<0.2?'정답서 멀다 → CE 급증!':(s.p>0.85?'정답에 가깝다 → 손실 ≈ 0':'어중간'), lx, ly+170);
      E.tapHint(W/2, H*0.95, 'p를 0쪽으로 밀어 보세요 — 크로스엔트로피가 폭발', true);
      E.big('손실함수 — MSE vs 크로스엔트로피', '분류에서는 ‘얼마나 틀렸나’를 크로스엔트로피로 잽니다. 정답이 1인데 확률 p를 작게 내놓을수록 −log(p)가 가파르게 치솟아 ‘확신에 찬 오답’을 호되게 벌합니다. 같은 상황에서 MSE(파란 점선)는 1을 넘지 못해 처벌이 미지근하죠 — 그래서 분류엔 크로스엔트로피가 정석입니다.'); }
  },

  // ══════════ 5. 학습 = 손실 최소화 (학습된 모델로 예측) ══════════
  { id:'ai3_05',
    enter:function(E){ var self=this; this.s={x:0.5};
      E.controls('<div class="ctrl"><label>입력 x</label><input type="range" id="xi" min="0.05" max="0.95" step="0.01" value="0.50"><output id="xio">0.50</output></div>');
      E.bind('#xi','input',function(e){ self.s.x=+e.target.value; document.getElementById('xio').textContent=(+e.target.value).toFixed(2); E.blip(360,0.06); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var ox=W*0.12, oy=H*0.74, pw=W*0.56, pv=H*0.52;
      function SX(x){ return ox+x*pw; } function SY(y){ return oy-((y+0.2)/1.7)*pv; }
      axes(E,ox,oy,pw,pv);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('y', ox+4, oy-pv-6); ctx.textAlign='right'; ctx.fillText('x →', ox+pw, oy+18);
      // 손실 최소화로 학습된 선형모델(최소제곱 해 = 경사하강이 도달하는 곳). 실계산.
      var n=REG.length, sx=0,sy=0,sxx=0,sxy=0; for(var i=0;i<n;i++){ sx+=REG[i][0]; sy+=REG[i][1]; sxx+=REG[i][0]*REG[i][0]; sxy+=REG[i][0]*REG[i][1]; }
      var w=(n*sxy-sx*sy)/(n*sxx-sx*sx), b=(sy-w*sx)/n;
      // MSE(학습 후) 실측
      var mse=0; for(i=0;i<n;i++){ var e=(w*REG[i][0]+b)-REG[i][1]; mse+=e*e; } mse/=n;
      // 데이터 점
      for(i=0;i<n;i++){ ctx.fillStyle=CYA; ctx.beginPath(); ctx.arc(SX(REG[i][0]),SY(REG[i][1]),4.5,0,7); ctx.fill(); }
      // 학습된 직선
      ctx.strokeStyle=GLD; ctx.lineWidth=2.8; ctx.beginPath(); ctx.moveTo(SX(0),SY(b)); ctx.lineTo(SX(1),SY(w+b)); ctx.stroke();
      // 입력 x → 예측 ŷ (실계산)
      var yh=w*s.x+b;
      ctx.strokeStyle='rgba(126,224,176,0.6)'; ctx.lineWidth=1.4; ctx.setLineDash([5,4]);
      ctx.beginPath(); ctx.moveTo(SX(s.x),oy); ctx.lineTo(SX(s.x),SY(yh)); ctx.lineTo(SX(0),SY(yh)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(SX(s.x),SY(yh),7,0,7); ctx.fill();
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('x='+s.x.toFixed(2), SX(s.x), oy+16);
      // 패널
      var px=W*0.72, py=H*0.30;
      ctx.fillStyle='#dfeef0'; ctx.font='15px sans-serif'; ctx.textAlign='left'; ctx.fillText('손실 최소화로 학습된 모델:', px, py);
      ctx.fillStyle=GLD; ctx.font='600 17px sans-serif'; ctx.fillText('ŷ = '+w.toFixed(2)+'·x '+(b<0?'−':'+')+' '+Math.abs(b).toFixed(2), px, py+30);
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.fillText('최종 손실 MSE = '+mse.toFixed(4), px, py+56);
      ctx.fillStyle=GRN; ctx.font='600 24px sans-serif'; ctx.fillText('예측 ŷ = '+yh.toFixed(3), px, py+100);
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.fillText('입력 x를 넣으면 학습된 w·b로', px, py+128);
      ctx.fillStyle=DIM; ctx.fillText('즉시 답을 계산합니다(추론).', px, py+146);
      E.tapHint(W/2, H*0.95, 'x를 움직여 학습된 모델의 예측을 확인', true);
      E.big('학습 = 손실 최소화, 그리고 예측', '지도학습의 한 바퀴를 복습합시다 — 데이터를 보고(특징·라벨), 손실을 정의하고, 그 손실이 가장 작아지는 파라미터 w·b를 찾았습니다. 학습이 끝나면 모델은 새 입력 x에 대해 ŷ = w·x + b를 곧바로 계산해 답합니다(추론). 분류든 회귀든, 큰 신경망이든 — 뼈대는 똑같습니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
