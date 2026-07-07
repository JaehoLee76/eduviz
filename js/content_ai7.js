/* 인공지능 제7장 — 역전파와 최적화: 연쇄법칙 · 역전파 · 경사하강 · 학습률 · 옵티마이저
   동작(behavior)만. 텍스트=content/ai7.json. 엔진 js/engine.js 공유. 색: AI=시안.
   골든룰: 화면의 그래디언트·손실·가중치 갱신은 전부 draw()에서 실시간으로 실제 계산
   (수치미분·역전파·경사하강을 진짜 수행). 난수표시·하드코딩 금지. */
(function(){
  var CYA='#3dd6dc', BLU='#7ab8ff', GLD='#ffd27a', GRN='#7ee0b0', PNK='#f4a0c0', DIM='#9b99a3', RED='#f0888a';

  // 수치미분 (중심차분)
  function ndf(f,x){ return (f(x+1e-4)-f(x-1e-4))/2e-4; }

  function axes(E,ox,oy,pw,pv){ var ctx=E.ctx; ctx.strokeStyle='rgba(61,214,220,0.22)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(ox,oy); ctx.lineTo(ox+pw,oy); ctx.moveTo(ox,oy); ctx.lineTo(ox,oy-pv); ctx.stroke(); }

  // ── 작은 신경망 (입력 x → 은닉 1개(tanh) → 출력) 한 개의 결정적 예제 ──
  // z1 = w1*x + b1 ; h = tanh(z1) ; ŷ = w2*h + b2 ; L = (ŷ - y)^2
  var NET = { x:1.0, y:0.5, w1:0.8, b1:-0.3, w2:1.2, b2:0.2 };
  function forward(p){ var z1=p.w1*p.x+p.b1, h=Math.tanh(z1), yh=p.w2*h+p.b2, L=(yh-p.y)*(yh-p.y);
    return { z1:z1, h:h, yh:yh, L:L }; }
  // 각 파라미터의 ∂L/∂θ 를 수치미분으로 실제 계산
  function gradOf(p,key){ var base=p[key]; function f(v){ var q={}; for(var k in p)q[k]=p[k]; q[key]=v; return forward(q).L; }
    return ndf(f,base); }

  var scenes = [

  // ══════════ 1. 연쇄법칙 — 합성함수 y=f(g(x)) ══════════
  { id:'ai7_01',
    enter:function(E){ var self=this; this.s={x:0.6};
      E.controls('<div class="ctrl"><label>입력 x</label><input type="range" id="xx" min="-1.4" max="1.4" step="0.02" value="0.6"><output id="xxo">0.60</output></div>');
      E.bind('#xx','input',function(e){ self.s.x=+e.target.value; document.getElementById('xxo').textContent=(+e.target.value).toFixed(2); E.blip(360,0.05); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, x=s.x;
      // 합성함수: u = g(x) = x^2 + 1 ;  y = f(u) = sin(u)
      function g(t){ return t*t+1; }
      function f(u){ return Math.sin(u); }
      var u=g(x), y=f(u);
      // 각 단계 도함수(수치미분 실측) — 연쇄법칙: dy/dx = f'(g(x)) · g'(x)
      var dg = ndf(g,x);        // g'(x)
      var df = ndf(f,u);        // f'(u) at u=g(x)
      var chain = df*dg;        // 연쇄법칙 합성
      var direct = ndf(function(t){ return f(g(t)); }, x);  // 합성을 통째로 미분(검산)

      // ── 상단 파이프라인 다이어그램 ──
      var cy=H*0.30, bw=W*0.15, bh=H*0.16;
      var bx=[W*0.07, W*0.40, W*0.73];
      function node(i,col,lab,val){ var X=bx[i];
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(X,cy-bh/2,bw,bh,12);}else{ctx.beginPath();ctx.rect(X,cy-bh/2,bw,bh);}
        ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.fill(); ctx.strokeStyle=col; ctx.lineWidth=2; ctx.stroke();
        ctx.fillStyle=col; ctx.font='600 16px sans-serif'; ctx.textAlign='center'; ctx.fillText(lab, X+bw/2, cy-6);
        ctx.fillStyle='#dfeef0'; ctx.font='600 18px sans-serif'; ctx.fillText(val, X+bw/2, cy+22); }
      node(0,CYA,'x',x.toFixed(2));
      node(1,GLD,'u = g(x) = x²+1',u.toFixed(2));
      node(2,GRN,'y = f(u) = sin(u)',y.toFixed(3));
      // 화살표 + 국소 기울기
      function arrow(i,lab,col){ var X0=bx[i]+bw, X1=bx[i+1], my=cy;
        ctx.strokeStyle=col; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(X0,my); ctx.lineTo(X1-8,my); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(X1-8,my); ctx.lineTo(X1-15,my-5); ctx.lineTo(X1-15,my+5); ctx.closePath(); ctx.fillStyle=col; ctx.fill();
        ctx.fillStyle=col; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText(lab, (X0+X1)/2, my-12); }
      arrow(0, "g'(x) = "+dg.toFixed(3), GLD);
      arrow(1, "f'(u) = "+df.toFixed(3), GRN);

      // ── 연쇄법칙 식 (실측값으로 조립) ──
      ctx.textAlign='center';
      ctx.fillStyle='#dffafa'; ctx.font='600 18px sans-serif';
      ctx.fillText('dy/dx = f′(g(x)) · g′(x)', W/2, H*0.58);
      ctx.fillStyle=CYA; ctx.font='600 20px sans-serif';
      ctx.fillText('= '+df.toFixed(3)+' × '+dg.toFixed(3)+' = '+chain.toFixed(3), W/2, H*0.58+30);
      // 검산: 합성을 통째로 미분한 값과 일치
      ctx.fillStyle=Math.abs(chain-direct)<1e-2?GRN:RED; ctx.font='13.5px sans-serif';
      ctx.fillText('검산 — 합성함수를 통째로 미분: '+direct.toFixed(3)+'  (연쇄법칙과 일치 ✓)', W/2, H*0.58+58);

      // ── 하단 미니 그래프: y=f(g(x))와 점 x, 접선 ──
      var ox=W*0.18, oy=H*0.92, pw=W*0.64, pv=H*0.20, X0=-1.4, X1=1.4;
      function SX(t){ return ox+(t-X0)/(X1-X0)*pw; }
      var ymin=-1.1, ymax=1.1;
      function SY(v){ return oy - (v-ymin)/(ymax-ymin)*pv; }
      axes(E,ox,oy,pw,pv);
      ctx.strokeStyle='rgba(126,224,176,0.9)'; ctx.lineWidth=2; ctx.beginPath();
      for(var t=X0;t<=X1;t+=0.02){ var p=SY(f(g(t))); if(t===X0)ctx.moveTo(SX(t),p); else ctx.lineTo(SX(t),p); } ctx.stroke();
      // 접선(연쇄법칙 기울기로)
      var px=SX(x), py=SY(y), dx=0.5;
      ctx.strokeStyle='rgba(255,210,122,0.9)'; ctx.lineWidth=1.6; ctx.beginPath();
      ctx.moveTo(SX(x-dx),SY(y-chain*dx)); ctx.lineTo(SX(x+dx),SY(y+chain*dx)); ctx.stroke();
      ctx.fillStyle=GLD; ctx.beginPath(); ctx.arc(px,py,5,0,7); ctx.fill();

      E.tapHint(W/2, H*0.965, '슬라이더로 x를 옮기며 각 단계 기울기가 곱해지는 것을 보세요', true);
      E.big('연쇄법칙 — 역전파의 수학적 심장', '합성함수 y = f(g(x))의 기울기는 바깥 도함수와 안쪽 도함수의 곱입니다 — dy/dx = f′(g)·g′(x). 신경망은 함수를 수십 겹 포갠 합성함수일 뿐이라, 이 곱셈 규칙을 거꾸로 따라가면 어느 가중치든 손실에 끼친 영향(기울기)을 정확히 구할 수 있습니다. 그것이 역전파입니다.'); }
  },

  // ══════════ 2. 역전파 — 작은 신경망의 ∂L/∂w 실계산 ══════════
  { id:'ai7_02',
    enter:function(E){ var self=this; this.s={w1:NET.w1, b1:NET.b1, w2:NET.w2, b2:NET.b2};
      E.controls('<div class="ctrl"><label>은닉 가중치 w₁</label><input type="range" id="w1" min="-2" max="2" step="0.05" value="'+NET.w1+'"><output id="w1o">'+NET.w1.toFixed(2)+'</output>'
        +'<label style="margin-left:14px">출력 가중치 w₂</label><input type="range" id="w2" min="-2" max="2" step="0.05" value="'+NET.w2+'"><output id="w2o">'+NET.w2.toFixed(2)+'</output></div>');
      E.bind('#w1','input',function(e){ self.s.w1=+e.target.value; document.getElementById('w1o').textContent=(+e.target.value).toFixed(2); E.blip(360,0.05); });
      E.bind('#w2','input',function(e){ self.s.w2=+e.target.value; document.getElementById('w2o').textContent=(+e.target.value).toFixed(2); E.blip(320,0.05); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var p={ x:NET.x, y:NET.y, w1:s.w1, b1:s.b1, w2:s.w2, b2:s.b2 };
      var fw=forward(p);
      // 각 파라미터 그래디언트 — 수치미분으로 실제 계산
      var gw1=gradOf(p,'w1'), gb1=gradOf(p,'b1'), gw2=gradOf(p,'w2'), gb2=gradOf(p,'b2');

      // ── 신경망 그림: 입력 노드 · 은닉 노드 · 출력 노드 ──
      var ix=W*0.16, hx=W*0.46, ox2=W*0.76, midY=H*0.34;
      function nd(X,Y,col,lab,val){ ctx.fillStyle='rgba(20,40,46,0.9)'; ctx.strokeStyle=col; ctx.lineWidth=2.4;
        ctx.beginPath(); ctx.arc(X,Y,26,0,7); ctx.fill(); ctx.stroke();
        ctx.fillStyle=col; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.fillText(lab,X,Y-2);
        ctx.fillStyle='#dfeef0'; ctx.font='12px sans-serif'; ctx.fillText(val,X,Y+14); }
      // 연결선 + 가중치 라벨
      function edge(X0,Y0,X1,Y1,col,lab){ ctx.strokeStyle=col; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(X0+26,Y0); ctx.lineTo(X1-26,Y1); ctx.stroke();
        ctx.fillStyle=col; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText(lab,(X0+X1)/2,(Y0+Y1)/2-8); }
      edge(ix,midY,hx,midY,GLD,'w₁='+s.w1.toFixed(2));
      edge(hx,midY,ox2,midY,GRN,'w₂='+s.w2.toFixed(2));
      nd(ix,midY,CYA,'x',p.x.toFixed(2));
      nd(hx,midY,GLD,'h=tanh',fw.h.toFixed(3));
      nd(ox2,midY,GRN,'ŷ',fw.yh.toFixed(3));
      // 목표·손실
      ctx.fillStyle=PNK; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('목표 y = '+p.y.toFixed(2), ox2, midY+50);
      ctx.fillStyle=RED; ctx.font='600 16px sans-serif'; ctx.fillText('손실 L = (ŷ−y)² = '+fw.L.toFixed(4), ox2, midY+72);

      // ── 순전파 / 역전파 라벨 ──
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center';
      ctx.fillText('순전파 →', (ix+ox2)/2, midY-58);
      ctx.fillStyle='rgba(244,160,192,0.8)'; ctx.fillText('← 역전파 (오차를 거꾸로)', (ix+ox2)/2, H*0.55);

      // ── 그래디언트 표 (실측 ∂L/∂θ) ──
      var tx=W*0.10, ty=H*0.62, rows=[
        ['∂L/∂w₂', gw2, GRN], ['∂L/∂b₂', gb2, GRN],
        ['∂L/∂w₁', gw1, GLD], ['∂L/∂b₁', gb1, GLD] ];
      ctx.textAlign='left'; ctx.fillStyle='#dffafa'; ctx.font='600 15px sans-serif';
      ctx.fillText('각 가중치의 그래디언트 (∂L/∂θ)', tx, ty);
      var lr=0.3;
      for(var i=0;i<rows.length;i++){ var R=rows[i], yy=ty+26+i*24;
        ctx.fillStyle=R[2]; ctx.font='14px sans-serif'; ctx.fillText(R[0], tx, yy);
        ctx.fillStyle='#dfeef0'; ctx.fillText('= '+R[1].toFixed(4), tx+90, yy);
        // 막대(크기 시각화)
        var bx=tx+250, bv=Math.max(-1,Math.min(1,R[1])), bw=Math.abs(bv)*W*0.10;
        ctx.fillStyle=bv<0?'rgba(122,184,255,0.7)':'rgba(244,160,192,0.7)';
        ctx.fillRect(bv<0?bx-bw:bx, yy-11, bw, 12);
        ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.beginPath(); ctx.moveTo(bx,yy-13); ctx.lineTo(bx,yy+2); ctx.stroke();
        // 갱신 미리보기
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        var key=R[0].replace('∂L/∂',''); ctx.fillText('θ ← θ − η·g = '+( (s[key]!=null?s[key]:NET[key]) - lr*R[1]).toFixed(3), bx+W*0.12, yy); }

      E.tapHint(W/2, H*0.965, 'w₁·w₂를 움직여 손실과 각 그래디언트가 함께 바뀌는 것을 보세요', true);
      E.big('역전파 — 오차를 거꾸로 흘려 모든 기울기를 한 번에', '순전파로 예측 ŷ와 손실 L을 구한 뒤, 연쇄법칙을 출력에서 입력 방향으로 거꾸로 적용하면 모든 가중치의 ∂L/∂θ를 한 번의 역방향 통과로 전부 얻습니다. 여기 네 그래디언트는 손실 함수를 각 가중치로 직접 수치미분한 값 — 부호는 ‘이 가중치를 키우면 손실이 늘까 줄까’를 말해 줍니다.'); }
  },

  // ══════════ 3. 경사하강 — 손실곡면 위 공이 굴러 내려감 ══════════
  { id:'ai7_03',
    enter:function(E){ var self=this; this.s={iters:0};
      E.controls('<div class="ctrl"><label>반복 횟수 (스텝)</label><input type="range" id="it" min="0" max="40" step="1" value="0"><output id="ito">0</output></div>');
      E.bind('#it','input',function(e){ self.s.iters=+e.target.value; document.getElementById('ito').textContent=e.target.value; E.blip(300+self.s.iters*8,0.05); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 손실 곡면 L(w) — 비대칭 볼록(미분 가능)
      function L(w){ return 0.6*(w-1.5)*(w-1.5) + 0.12*Math.cos(2.5*w) + 0.25; }
      var lr=0.18, w0=-1.6;
      // 경로를 실제 경사하강으로 생성 (난수 없음)
      var path=[w0], w=w0;
      for(var k=0;k<40;k++){ w = w - lr*ndf(L,w); path.push(w); }
      var wNow = path[s.iters];

      var X0=-2.2, X1=4.2, ox=W*0.12, pw=W*0.76, oy=H*0.78, pv=H*0.54;
      var LMAX=Math.max(L(X0),L(X1));
      function SX(x){ return ox+(x-X0)/(X1-X0)*pw; }
      function SY(y){ return oy - y/LMAX*pv; }
      axes(E,ox,oy,pw,pv);
      // 손실 곡선
      ctx.strokeStyle='rgba(61,214,220,0.92)'; ctx.lineWidth=2.6; ctx.beginPath();
      for(var x=X0;x<=X1;x+=0.02){ var p=SY(L(x)); if(x===X0)ctx.moveTo(SX(x),p); else ctx.lineTo(SX(x),p); } ctx.stroke();
      ctx.fillStyle='#caa86a'; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('손실 L(w)', ox+4, SY(LMAX)+4);
      // 지나온 발자국
      for(k=0;k<=s.iters;k++){ var a=k/Math.max(1,s.iters); ctx.fillStyle='rgba(255,210,122,'+(0.18+0.5*a)+')';
        ctx.beginPath(); ctx.arc(SX(path[k]),SY(L(path[k])),3.5,0,7); ctx.fill(); }
      // 현재 공 + 접선(기울기) + 갱신 화살표
      var m=ndf(L,wNow);
      ctx.strokeStyle='rgba(126,224,176,0.85)'; ctx.lineWidth=2; var dxv=0.8;
      ctx.beginPath(); ctx.moveTo(SX(wNow-dxv),SY(L(wNow)-m*dxv)); ctx.lineTo(SX(wNow+dxv),SY(L(wNow)+m*dxv)); ctx.stroke();
      ctx.fillStyle=GLD; ctx.beginPath(); ctx.arc(SX(wNow),SY(L(wNow)),8,0,7); ctx.fill();
      // 다음 스텝 방향 화살표 (−η∇L)
      if(s.iters<40){ var wNext=wNow-lr*m, ax0=SX(wNow), ax1=SX(wNext), ay=SY(L(wNow))+22;
        ctx.strokeStyle=GRN; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(ax0,ay); ctx.lineTo(ax1,ay); ctx.stroke();
        var dir=ax1>ax0?1:-1; ctx.beginPath(); ctx.moveTo(ax1,ay); ctx.lineTo(ax1-7*dir,ay-4); ctx.lineTo(ax1-7*dir,ay+4); ctx.closePath(); ctx.fillStyle=GRN; ctx.fill(); }

      // ── 패널: 갱신식 + 실측 손실 ──
      var px=W*0.62, py=H*0.16;
      ctx.textAlign='left'; ctx.fillStyle='#dffafa'; ctx.font='600 17px sans-serif';
      ctx.fillText('w ← w − η · ∇L(w)', px, py);
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.fillText('학습률 η = '+lr.toFixed(2), px, py+24);
      ctx.fillStyle=GLD; ctx.font='600 15px sans-serif'; ctx.fillText('스텝 '+s.iters+' :  w = '+wNow.toFixed(3), px, py+50);
      ctx.fillStyle=GRN; ctx.fillText('기울기 ∇L = '+m.toFixed(3), px, py+72);
      ctx.fillStyle=CYA; ctx.font='600 17px sans-serif'; ctx.fillText('손실 L = '+L(wNow).toFixed(4), px, py+98);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif';
      ctx.fillText('처음 L = '+L(w0).toFixed(4)+'  →  '+(L(w0)-L(wNow)>0?'−'+(L(w0)-L(wNow)).toFixed(4)+' 감소':'—'), px, py+120);

      E.tapHint(W/2, H*0.95, '슬라이더로 반복 횟수를 늘리며 공이 골짜기로 굴러 내려가는 것을 보세요', true);
      E.big('경사하강 — 기울기 반대로 한 걸음씩', '손실 곡면 위에서 기울기(∇L)는 가장 가파르게 오르는 방향입니다. 그 반대 방향으로 학습률 η만큼 내려가면(w ← w − η∇L) 손실 골짜기로 점점 굴러 내려가죠. 반복할수록 기울기가 0에 가까워지고 손실이 멈춥니다 — 그곳이 최적의 가중치입니다.'); }
  },

  // ══════════ 4. 학습률 η — 너무 크면 발산, 작으면 느림 ══════════
  { id:'ai7_04',
    enter:function(E){ var self=this; this.s={lr:0.18};
      E.controls('<div class="ctrl"><label>학습률 η</label><input type="range" id="lr" min="0.02" max="1.05" step="0.01" value="0.18"><output id="lro">0.18</output></div>');
      E.bind('#lr','input',function(e){ self.s.lr=+e.target.value; document.getElementById('lro').textContent=(+e.target.value).toFixed(2); E.blip(360,0.05); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, lr=s.lr;
      // 손실곡면 L(w) — 3번과 같은 모양이되 곡률을 키워 슬라이더 범위 안에서 발산이 드러나게
      function L(w){ return 1.4*(w-1.5)*(w-1.5) + 0.12*Math.cos(2.5*w) + 0.25; }
      var w0=-1.6, NSTEP=24;
      // 실제 경사하강 경로 (발산할 수 있음 — 클립)
      var path=[w0], w=w0, diverged=false;
      for(var k=0;k<NSTEP;k++){ var g=ndf(L,w); w = w - lr*g; if(!isFinite(w)||Math.abs(w)>30){ diverged=true; w=Math.max(-30,Math.min(30,w)); } path.push(w); }
      var Lend=L(path[NSTEP]);

      var X0=-2.6, X1=4.6, ox=W*0.10, pw=W*0.80, oy=H*0.78, pv=H*0.50;
      var LMAX=Math.max(L(X0),L(X1));
      function SX(x){ return ox+(x-X0)/(X1-X0)*pw; }
      function clamp(v){ return Math.max(-0.1,Math.min(LMAX*1.15,v)); }
      function SY(y){ return oy - clamp(y)/LMAX*pv; }
      axes(E,ox,oy,pw,pv);
      ctx.strokeStyle='rgba(61,214,220,0.9)'; ctx.lineWidth=2.4; ctx.beginPath();
      for(var x=X0;x<=X1;x+=0.02){ var p=SY(L(x)); if(x===X0)ctx.moveTo(SX(x),p); else ctx.lineTo(SX(x),p); } ctx.stroke();
      // 경로 연결선(점핑 보이게)
      ctx.strokeStyle='rgba(255,210,122,0.55)'; ctx.lineWidth=1.4; ctx.beginPath();
      for(k=0;k<=NSTEP;k++){ var wk=Math.max(X0,Math.min(X1,path[k])); var px=SX(wk),py=SY(L(path[k]));
        if(k===0)ctx.moveTo(px,py); else ctx.lineTo(px,py); } ctx.stroke();
      for(k=0;k<=NSTEP;k++){ var wk2=Math.max(X0,Math.min(X1,path[k])); var a=k/NSTEP;
        ctx.fillStyle='rgba(255,210,122,'+(0.25+0.6*a)+')'; ctx.beginPath(); ctx.arc(SX(wk2),SY(L(path[k])),3.2,0,7); ctx.fill(); }
      // 최종 위치
      var wf=Math.max(X0,Math.min(X1,path[NSTEP]));
      ctx.fillStyle= diverged?RED:(Lend<0.2?GRN:GLD); ctx.beginPath(); ctx.arc(SX(wf),SY(L(path[NSTEP])),8,0,7); ctx.fill();
      // 최소 표시
      ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.setLineDash([3,4]); ctx.beginPath(); ctx.moveTo(SX(1.45),oy); ctx.lineTo(SX(1.45),SY(L(1.45))); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('최소', SX(1.45), oy+16);

      // ── 진단 ──
      var verdict, vc;
      if(diverged || Lend>L(w0)){ verdict='η 너무 큼 — 발산(진동)'; vc=RED; }
      else if(lr<0.07){ verdict='η 너무 작음 — 느린 수렴'; vc=GLD; }
      else if(Lend<0.18){ verdict='η 적당 — 빠르고 안정'; vc=GRN; }
      else { verdict='수렴 중 — 조금 느림'; vc=GLD; }
      ctx.fillStyle=vc; ctx.font='600 18px sans-serif'; ctx.textAlign='center'; ctx.fillText(verdict, W/2, H*0.12);
      ctx.fillStyle=DIM; ctx.font='13px sans-serif';
      ctx.fillText(NSTEP+'스텝 후  손실 L = '+(diverged?'∞ (발산)':Lend.toFixed(4))+'   (시작 '+L(w0).toFixed(3)+')', W/2, H*0.12+24);

      E.tapHint(W/2, H*0.95, 'η를 키워 보세요 — 어느 순간부터 공이 골짜기를 뛰어넘어 발산합니다', true);
      E.big('학습률 η — 보폭이 너무 크면 골짜기를 뛰어넘는다', '같은 손실곡면, 같은 시작점인데 결과는 η가 가릅니다. η가 작으면 안전하지만 답답할 만큼 느리고, 적당하면 빠르게 골짜기에 안착하며, 너무 크면 한 걸음에 골짜기를 건너뛰어 좌우로 진동하다 발산합니다. 학습률 선택은 모든 학습의 첫 단추 — 자격시험 단골입니다.'); }
  },

  // ══════════ 5. 옵티마이저 — SGD vs 모멘텀 ══════════
  { id:'ai7_05',
    enter:function(E){ var self=this; this.s={iters:0};
      E.controls('<div class="ctrl"><label>반복 횟수 (스텝)</label><input type="range" id="it" min="0" max="60" step="1" value="0"><output id="ito">0</output></div>');
      E.bind('#it','input',function(e){ self.s.iters=+e.target.value; document.getElementById('ito').textContent=e.target.value; E.blip(300+self.s.iters*6,0.05); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 좁고 긴 골짜기(병)를 흉내내는 손실: 완만한 바닥 + 잔물결 → 모멘텀이 유리
      function L(w){ return 0.18*(w-1.5)*(w-1.5) + 0.10*Math.cos(3.2*w) + 0.30; }
      var w0=-2.0, lr=0.12, beta=0.85, N=60;
      // 두 경로를 실제로 반복 생성
      var sgd=[w0], mom=[w0], wS=w0, wM=w0, v=0;
      for(var k=0;k<N;k++){ var gS=ndf(L,wS); wS = wS - lr*gS; sgd.push(wS);
        var gM=ndf(L,wM); v = beta*v - lr*gM; wM = wM + v; mom.push(wM); }
      var i=s.iters, wSn=sgd[i], wMn=mom[i];

      var X0=-2.6, X1=5.0, ox=W*0.10, pw=W*0.80, oy=H*0.76, pv=H*0.50;
      var LMAX=Math.max(L(X0),L(X1));
      function SX(x){ return ox+(x-X0)/(X1-X0)*pw; }
      function SY(y){ return oy - y/LMAX*pv; }
      axes(E,ox,oy,pw,pv);
      ctx.strokeStyle='rgba(61,214,220,0.85)'; ctx.lineWidth=2.4; ctx.beginPath();
      for(var x=X0;x<=X1;x+=0.02){ var p=SY(L(x)); if(x===X0)ctx.moveTo(SX(x),p); else ctx.lineTo(SX(x),p); } ctx.stroke();
      // 최소
      ctx.strokeStyle='rgba(255,255,255,0.13)'; ctx.setLineDash([3,4]); ctx.beginPath(); ctx.moveTo(SX(1.5),oy); ctx.lineTo(SX(1.5),SY(L(1.5))); ctx.stroke(); ctx.setLineDash([]);
      // 두 경로 발자국
      function trail(path,col){ for(var k=0;k<=i;k++){ var a=k/Math.max(1,i); ctx.fillStyle=col.replace('A',(0.15+0.5*a).toFixed(2));
        ctx.beginPath(); ctx.arc(SX(path[k]),SY(L(path[k])),3,0,7); ctx.fill(); } }
      trail(sgd,'rgba(122,184,255,A)');
      trail(mom,'rgba(126,224,176,A)');
      // 현재 두 공
      ctx.fillStyle=BLU; ctx.beginPath(); ctx.arc(SX(wSn),SY(L(wSn))-9,7,0,7); ctx.fill();
      ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(SX(wMn),SY(L(wMn))+9,7,0,7); ctx.fill();

      // ── 패널: 두 옵티마이저 실측 손실 비교 ──
      var px=W*0.13, py=H*0.14;
      ctx.textAlign='left';
      ctx.fillStyle=BLU; ctx.font='600 15px sans-serif'; ctx.fillText('● 일반 SGD :  w ← w − η∇L', px, py);
      ctx.fillStyle='#dfeef0'; ctx.font='13px sans-serif'; ctx.fillText('스텝 '+i+'  w='+wSn.toFixed(3)+'   손실 L = '+L(wSn).toFixed(4), px+18, py+20);
      ctx.fillStyle=GRN; ctx.font='600 15px sans-serif'; ctx.fillText('● 모멘텀 :  v ← βv − η∇L,  w ← w + v', px, py+48);
      ctx.fillStyle='#dfeef0'; ctx.font='13px sans-serif'; ctx.fillText('스텝 '+i+'  w='+wMn.toFixed(3)+'   손실 L = '+L(wMn).toFixed(4)+'   (관성 β='+beta+')', px+18, py+68);
      // 누가 더 가까운가
      var dS=Math.abs(wSn-1.5), dM=Math.abs(wMn-1.5);
      ctx.fillStyle = dM<dS-0.02?GRN : (dS<dM-0.02?BLU:DIM); ctx.font='600 14px sans-serif';
      ctx.fillText(dM<dS-0.02?'→ 모멘텀이 최소에 더 가까이 — 관성으로 더 빨리 내려감'
                 :(dS<dM-0.02?'→ 아직 SGD가 앞섬':'→ 비슷'), px, py+96);

      E.tapHint(W/2, H*0.95, '슬라이더로 스텝을 늘려 두 공의 속도를 비교해 보세요', true);
      E.big('옵티마이저 — 관성을 더하면 더 빨리 내려간다', '일반 SGD는 매 스텝 현재 기울기만 보고 움직여, 완만하거나 구불구불한 골짜기에서 느립니다. 모멘텀은 지나온 방향의 ‘관성’(속도 v)을 쌓아 같은 방향이면 가속하고 잔물결은 평균내 지워 더 곧고 빠르게 내려갑니다. Adam·RMSProp 같은 현대 옵티마이저는 여기에 보폭 자동조절을 더한 것 — 자격시험 핵심입니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
