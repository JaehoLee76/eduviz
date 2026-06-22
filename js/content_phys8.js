/* 물리학 제8장 파동 — 진행파·v=fλ·중첩·정상파(유한차분 파동방정식 시뮬)·도플러
   정상파는 줄(매질)을 N개 점으로 나눠 파동방정식 ∂²y/∂t²=c²∂²y/∂x²를 매 프레임 적분 — 진짜 매질 시뮬.
   진행파/중첩/도플러는 파동함수에서 실시간 계산(파동의 본질은 닫힌 형태, 운동학 예외와 동일).
   골든룰: 표시 수치는 전부 현재 상태/파동식에서 계산.
   텍스트=content/phys8.json. 엔진=js/physlab.js(공유), js/engine.js 공유. */
(function(){
  var GRN='#5fd6a8', BLU='#7ab8ff', ORA='#ffb27a', PNK='#f4a0c0', DIM='#9b99a3';

  var scenes=[

  // ══════════ 8.1 파동이란 — 매질은 제자리, 패턴만 전파 ══════════
  { id:'phys8_01',
    enter:function(E){ var self=this; this.s={t:0,f:0.6,A:1};
      E.controls('<div class="ctrl"><label>진동수 f</label><input type="range" id="ff" min="0.3" max="1.4" step="0.1" value="0.6"><output id="ffo">0.6</output>'
        +'<label style="margin-left:14px">진폭 A</label><input type="range" id="aa" min="0.4" max="1.4" step="0.1" value="1.0"><output id="aao">1.0</output></div>');
      E.bind('#ff','input',function(e){ self.s.f=+e.target.value; document.getElementById('ffo').textContent=(+e.target.value).toFixed(1); E.blip(300+self.s.f*200,0.07); });
      E.bind('#aa','input',function(e){ self.s.A=+e.target.value; document.getElementById('aao').textContent=(+e.target.value).toFixed(1); E.blip(380,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx; s.t+=1/60;
      var c=3, k=2*Math.PI*s.f/c, w=2*Math.PI*s.f, midY=H*0.42, x0=W*0.08, x1=W*0.92, sc=H*0.16;
      function Y(xx){ return midY - s.A*sc*Math.sin(k*xx - w*s.t); }
      // 매질 점들
      ctx.fillStyle='rgba(122,184,255,0.5)';
      for(var px=x0; px<=x1; px+=14){ var xu=(px-x0)/(x1-x0)*10; ctx.beginPath(); ctx.arc(px, Y(xu), 2.5, 0, 7); ctx.fill(); }
      // 파형 곡선
      ctx.strokeStyle=BLU; ctx.lineWidth=2; ctx.beginPath();
      for(var i=0;i<=200;i++){ var xu=i/200*10, X=x0+(x1-x0)*i/200, y=Y(xu); if(i===0)ctx.moveTo(X,y); else ctx.lineTo(X,y); } ctx.stroke();
      // 강조된 한 입자(제자리에서 위아래만)
      var mxu=5, mX=x0+(x1-x0)*0.5, mY=Y(mxu);
      ctx.strokeStyle='rgba(255,178,122,0.4)'; ctx.lineWidth=1; ctx.setLineDash([3,4]); ctx.beginPath(); ctx.moveTo(mX,midY-sc-10); ctx.lineTo(mX,midY+sc+10); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=ORA; ctx.beginPath(); ctx.arc(mX,mY,8,0,7); ctx.fill();
      ctx.fillStyle=ORA; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('이 점은 위아래로만!', mX, midY+sc+28);
      // 진행 방향 화살표
      ctx.strokeStyle=GRN; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(W*0.62,midY-sc-30); ctx.lineTo(W*0.78,midY-sc-30); ctx.stroke();
      ctx.fillStyle=GRN; ctx.beginPath(); ctx.moveTo(W*0.78,midY-sc-30); ctx.lineTo(W*0.78-9,midY-sc-35); ctx.lineTo(W*0.78-9,midY-sc-25); ctx.fill();
      ctx.fillStyle=GRN; ctx.fillText('파동 진행', W*0.70, midY-sc-38);
      E.tapHint(W/2, H*0.90, '패턴은 흘러가도 입자(주황)는 제자리에서 진동', true);
      E.big('파동 = 패턴(에너지)의 전파, 매질은 제자리 진동', '파동은 매질(물·줄·공기)을 실어 나르지 않습니다 — 매질의 각 점은 제자리에서 위아래로 진동만 하고(주황 점), 그 진동의 <b>패턴과 에너지</b>만 옆으로 전달됩니다. 경기장 파도타기처럼 사람은 제자리, 물결만 돕니다. 진동 방향이 진행 방향과 수직이면 횡파(줄·빛).'); }
  },

  // ══════════ 8.2 파동의 요소 v = fλ ══════════
  { id:'phys8_02',
    enter:function(E){ var self=this; this.s={t:0,f:0.6};
      E.controls('<div class="ctrl"><label>진동수 f (Hz)</label><input type="range" id="ff" min="0.3" max="1.5" step="0.1" value="0.6"><output id="ffo">0.6</output></div>');
      E.bind('#ff','input',function(e){ self.s.f=+e.target.value; document.getElementById('ffo').textContent=(+e.target.value).toFixed(1); E.blip(300+self.s.f*200,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx; s.t+=1/60;
      var c=3, lambda=c/s.f, k=2*Math.PI/lambda, w=2*Math.PI*s.f, midY=H*0.42, x0=W*0.08, x1=W*0.92, sc=H*0.16, span=10;
      function Y(xx){ return midY - sc*Math.sin(k*xx - w*s.t); }
      ctx.strokeStyle=BLU; ctx.lineWidth=2.5; ctx.beginPath();
      for(var i=0;i<=240;i++){ var xu=i/240*span, X=x0+(x1-x0)*i/240, y=Y(xu); if(i===0)ctx.moveTo(X,y); else ctx.lineTo(X,y); } ctx.stroke();
      // 파장 표시(연속한 두 마루 사이) — 현재 위상의 첫 마루 찾기
      var pxScale=(x1-x0)/span;
      // 마루: k*xu - w*t = π/2 + 2πn  → xu = (π/2 + w*t + 2πn)/k
      var n0=Math.ceil((k*0 - w*s.t - Math.PI/2)/(2*Math.PI));
      var c1=(Math.PI/2 + w*s.t + 2*Math.PI*n0)/k, c2=c1+lambda;
      if(c1>=0 && c2<=span){ var X1=x0+c1*pxScale, X2=x0+c2*pxScale, topY=midY-sc-16;
        ctx.strokeStyle=ORA; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(X1,topY); ctx.lineTo(X2,topY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(X1,topY-5); ctx.lineTo(X1,midY-sc); ctx.moveTo(X2,topY-5); ctx.lineTo(X2,midY-sc); ctx.stroke();
        ctx.fillStyle=ORA; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('λ = '+lambda.toFixed(2), (X1+X2)/2, topY-8); }
      E.tapHint(W/2, H*0.90, '진동수 f를 올리면 파장 λ가 줄어듭니다 (v 일정)', true);
      E.big('v = f·λ = '+s.f.toFixed(1)+' × '+lambda.toFixed(2)+' = '+c.toFixed(1)+' (일정)', '파동의 세 요소: 진동수 f(1초당 진동 횟수), 파장 λ(한 주기의 공간 길이), 속력 v. 관계는 <b>v = fλ</b>. 매질이 정해지면 속력 v는 일정하므로, 진동수를 높이면 파장이 그만큼 짧아집니다(f↑ → λ↓). 높은 음(고주파)이 짧은 파장인 이유.'); }
  },

  // ══════════ 8.3 중첩과 간섭 — 보강과 상쇄 ══════════
  { id:'phys8_03',
    enter:function(E){ var self=this; this.s={t:0,sign:1};
      E.controls('<div class="ctrl"><label>오른쪽 펄스 부호 (+1 보강 / −1 상쇄)</label><input type="range" id="sg" min="-1" max="1" step="2" value="1"><output id="sgo">+1</output></div>');
      E.bind('#sg','input',function(e){ self.s.sign=+e.target.value; document.getElementById('sgo').textContent=(self.s.sign>0?'+1':'−1'); E.blip(360,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx; s.t+=1/60;
      var midY=H*0.46, x0=W*0.08, x1=W*0.92, sc=H*0.18, span=10, c=2.2;
      var period=8, tt=(s.t%period); // 0..8 주기적으로 펄스가 교차
      var p1c=1.5+c*tt, p2c=8.5-c*tt;   // 왼쪽 펄스 오른쪽으로, 오른쪽 펄스 왼쪽으로
      function pulse(xu,center,amp){ var d=(xu-center)/0.7; return amp*Math.exp(-d*d); }
      function Y(xu){ return pulse(xu,p1c,1) + pulse(xu,p2c,s.sign); }
      // 개별 펄스(옅게)
      [[p1c,1,'rgba(95,214,168,0.35)'],[p2c,s.sign,'rgba(244,160,192,0.35)']].forEach(function(p){
        ctx.strokeStyle=p[2]; ctx.lineWidth=1.5; ctx.beginPath();
        for(var i=0;i<=200;i++){ var xu=i/200*span, X=x0+(x1-x0)*i/200, y=midY-pulse(xu,p[0],p[1])*sc; if(i===0)ctx.moveTo(X,y); else ctx.lineTo(X,y); } ctx.stroke(); });
      // 합(중첩)
      ctx.strokeStyle=BLU; ctx.lineWidth=2.5; ctx.beginPath();
      for(var j=0;j<=200;j++){ var xu2=j/200*span, X2=x0+(x1-x0)*j/200, y2=midY-Y(xu2)*sc; if(j===0)ctx.moveTo(X2,y2); else ctx.lineTo(X2,y2); } ctx.stroke();
      // 기준선
      ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(x0,midY); ctx.lineTo(x1,midY); ctx.stroke();
      var overlap=Math.abs(p1c-p2c)<1.2;
      E.tapHint(W/2, H*0.90, '두 펄스가 만나는 순간 보강(+)·상쇄(−)', true);
      E.big(s.sign>0?'보강 간섭 — 만나면 더 커진다':'상쇄 간섭 — 만나면 사라진다', '두 파동이 겹치면 변위가 <b>그대로 더해집니다</b>(중첩 원리). 같은 방향(부호 +)이면 만나는 순간 마루가 합쳐져 <b>보강</b>(더 큰 파동), 반대 방향(−)이면 마루와 골이 만나 순간적으로 <b>상쇄</b>(평평). 신기하게도 겹친 뒤 두 파동은 아무 일 없던 듯 원래 모습으로 지나갑니다. 소음제거 이어폰이 상쇄 간섭.'); }
  },

  // ══════════ 8.4 정상파 — 줄(매질) 파동방정식 시뮬 + 배음 ══════════
  { id:'phys8_04',
    enter:function(E){ var self=this; this.s={n:2,N:64,c:20};
      this.initMode(); E.setOn([]);
      E.controls('<div class="ctrl"><label>배음 n (마디 수)</label><input type="range" id="nn" min="1" max="5" step="1" value="2"><output id="nno">2</output></div>');
      E.bind('#nn','input',function(e){ self.s.n=+e.target.value; document.getElementById('nno').textContent=e.target.value; self.initMode(); E.blip(200+self.s.n*120,0.08); }); },
    initMode:function(){ var s=this.s, N=s.N; s.y=[]; s.vy=[];
      for(var i=0;i<N;i++){ s.y[i]=Math.sin(s.n*Math.PI*i/(N-1)); s.vy[i]=0; } },   // n번째 모드 초기형
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, N=s.N, c=s.c;
      // 파동방정식 유한차분 적분(양끝 고정): ∂²y/∂t² = c² ∂²y/∂x²
      var sub=10, h=1/60/sub, dx=1;
      for(var t=0;t<sub;t++){ for(var i=1;i<N-1;i++){ var a=c*c*(s.y[i-1]-2*s.y[i]+s.y[i+1])/(dx*dx); s.vy[i]+=a*h; }
        for(i=1;i<N-1;i++) s.y[i]+=s.vy[i]*h; s.y[0]=0; s.y[N-1]=0; }
      var x0=W*0.10, x1=W*0.90, midY=H*0.44, sc=H*0.18;
      function X(i){ return x0+(x1-x0)*i/(N-1); } function Y(i){ return midY - s.y[i]*sc; }
      // 고정단
      ctx.fillStyle=DIM; ctx.beginPath(); ctx.arc(X(0),midY,6,0,7); ctx.fill(); ctx.beginPath(); ctx.arc(X(N-1),midY,6,0,7); ctx.fill();
      // 줄
      ctx.strokeStyle=BLU; ctx.lineWidth=2.5; ctx.beginPath();
      for(var k=0;k<N;k++){ if(k===0)ctx.moveTo(X(k),Y(k)); else ctx.lineTo(X(k),Y(k)); } ctx.stroke();
      // 마디(node) 표시 — sin(nπx/L)=0 위치
      ctx.fillStyle=PNK; ctx.font='10px sans-serif'; ctx.textAlign='center';
      for(var m=0;m<=s.n;m++){ var xi=Math.round(m/s.n*(N-1)); ctx.beginPath(); ctx.arc(X(xi),midY,3.5,0,7); ctx.fill(); }
      ctx.fillStyle=PNK; ctx.fillText('● 마디(node) — 움직이지 않는 점', W/2, H*0.66);
      var name=['기본 진동(1배음)','2배음','3배음','4배음','5배음'][s.n-1];
      E.tapHint(W/2, H*0.90, '배음 n을 바꿔 마디·배 패턴을 보세요 (양끝 고정)', true);
      E.big('정상파 '+name+' — 마디 '+(s.n+1)+'개, 배 '+s.n+'개', '양끝이 고정된 줄에서는 특정 진동수(배음)에서만 <b>정상파</b>가 섭니다 — 줄(매질)을 64점으로 나눠 파동방정식을 적분한 결과입니다. 마디(node)는 전혀 안 움직이고, 배(antinode)는 크게 진동. 정상파는 반대로 진행하는 두 파동의 중첩(8.3)! 기타·바이올린·관악기의 음높이가 이 배음으로 결정됩니다.'); }
  },

  // ══════════ 8.5 도플러 효과 — 다가오면 높고, 멀어지면 낮다 ══════════
  { id:'phys8_05',
    enter:function(E){ var self=this; this.s={vs:1.2,X0:0};
      E.controls('<div class="ctrl"><label>음원 속력 vs (음속=3)</label><input type="range" id="vv" min="0" max="2.6" step="0.1" value="1.2"><output id="vvo">1.2</output></div>');
      E.bind('#vv','input',function(e){ self.s.vs=+e.target.value; document.getElementById('vvo').textContent=(+e.target.value).toFixed(1); E.blip(300+self.s.vs*120,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var c=3, f=1, dt_emit=0.8;   // 음속 3, 0.8초마다 파면 방출
      s.X0+=s.vs*(1/60); if(s.X0>6) s.X0=-6;     // 음원 천천히 이동(시각용)
      var cy=H*0.46, ox=W*0.5, sc=Math.min(W,H)*0.045;
      function SX(x){ return ox+x*sc; }
      // 최근 M개 파면: k번째는 kΔ 전 방출, 그때 음원 위치 X0 - vs·kΔ, 반지름 c·kΔ
      var M=9;
      for(var kk=M;kk>=1;kk--){ var age=kk*dt_emit, cxw=s.X0 - s.vs*age, rad=c*age*sc;
        ctx.strokeStyle='rgba(122,184,255,'+(0.55-kk*0.045)+')'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.arc(SX(cxw), cy, rad, 0, 7); ctx.stroke(); }
      // 음원
      ctx.fillStyle=ORA; ctx.beginPath(); ctx.arc(SX(s.X0), cy, 8, 0, 7); ctx.fill();
      // 진행 방향
      if(s.vs>0.05){ ctx.strokeStyle=ORA; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(SX(s.X0)+12,cy); ctx.lineTo(SX(s.X0)+12+24,cy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(SX(s.X0)+12+24,cy); ctx.lineTo(SX(s.X0)+12+16,cy-5); ctx.lineTo(SX(s.X0)+12+16,cy+5); ctx.fill(); }
      // 관찰자(앞·뒤) + 진동수
      var ff=f*c/(c-s.vs), fb=f*c/(c+s.vs);
      ctx.fillStyle=GRN; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('앞쪽: f\' = '+ff.toFixed(2)+'  (높은 음)', W*0.80, H*0.30);
      ctx.fillStyle=PNK; ctx.fillText('뒤쪽: f\' = '+fb.toFixed(2)+'  (낮은 음)', W*0.20, H*0.30);
      if(s.vs>c){ ctx.fillStyle=ORA; ctx.fillText('★ 음속 돌파 — 충격파(소닉붐)!', W/2, H*0.72); }
      E.tapHint(W/2, H*0.90, '음원이 빠를수록 앞은 촘촘(고음)·뒤는 성김(저음)', true);
      E.big('도플러: 앞 f\'='+ff.toFixed(2)+' ↑,  뒤 f\'='+fb.toFixed(2)+' ↓', '움직이는 음원은 진행 방향 <b>앞쪽 파면을 압축</b>(파장↓→진동수↑→고음), <b>뒤쪽은 늘립니다</b>(저음). 그래서 구급차가 다가올 땐 높고 지나가면 낮게 들립니다. f\' = f·c/(c∓vs). 음원이 음속을 넘으면 파면이 겹쳐 충격파(소닉붐)가 생깁니다. 별빛의 적색편이도 빛의 도플러!'); }
  },

  // ─── 심화: 음의 세기와 데시벨 ───
  { id:'phys8_02_db', branchOf:'phys8_02', ord:1,
    enter:function(E){ var self=this; this.s={r:2,t:0};
      E.controls('<div class="ctrl"><label>음원에서 거리 r (m)</label><input type="range" id="rr" min="1" max="10" step="0.5" value="2"><output id="rro">2.0</output></div>');
      E.bind('#rr','input',function(e){ self.s.r=+e.target.value; document.getElementById('rro').textContent=(+e.target.value).toFixed(1); E.blip(420-self.s.r*30,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx; s.t+=1/60;
      var P=4, I=P/(4*Math.PI*s.r*s.r), I0=1e-3, db=10*Math.log(I/I0)/Math.LN10;
      var cx=W*0.30, cy=H*0.46, sc=Math.min(W*0.05,H*0.07);
      // 음원 + 퍼지는 파면(세기 ∝ 1/r²로 옅어짐)
      for(var k=1;k<10;k++){ var rr=((s.t*1.2+k*0.5)%9); var al=0.5/(rr*rr*0.3+1); ctx.strokeStyle='rgba(122,184,255,'+al.toFixed(3)+')'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(cx,cy,rr*sc,0,7); ctx.stroke(); }
      ctx.fillStyle=ORA; ctx.beginPath(); ctx.arc(cx,cy,9,0,7); ctx.fill();
      // 청취자(거리 r)
      var lx=cx+s.r*sc; ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(lx,cy,7,0,7); ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.setLineDash([4,4]); ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(lx,cy); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('r='+s.r.toFixed(1), (cx+lx)/2, cy-10);
      // 세기 막대
      var bx=W*0.74, baseY=H*0.74, bh=H*0.46, Imax=P/(4*Math.PI);
      ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(bx,baseY-bh,46,bh); ctx.fillStyle=ORA; ctx.globalAlpha=0.85; ctx.fillRect(bx,baseY-Math.min(1,I/Imax)*bh,46,Math.min(1,I/Imax)*bh); ctx.globalAlpha=1;
      ctx.fillStyle=ORA; ctx.font='12px sans-serif'; ctx.fillText('세기 I', bx+23, baseY+16);
      E.tapHint(W/2, H*0.90, '멀어지면 세기는 1/r²로 급감(거리 2배=¼)', true);
      E.big('음의 세기 I = P/4πr² ∝ 1/r²  (소리크기 '+db.toFixed(0)+' dB)', '점음원에서 나온 소리는 구면으로 퍼져, 세기 I(단위면적당 일률)가 <b>거리²에 반비례</b>합니다(I=P/4πr²) — 거리가 2배면 세기는 ¼. 우리 귀는 세기를 <b>로그</b>로 느껴 데시벨(dB)로 잽니다: β=10·log(I/I₀). 세기가 10배면 +10 dB. 거리 2배마다 약 −6 dB. 빛·중력·방사선도 같은 역제곱(구면으로 퍼짐).'); }
  },

  // ─── 심화: 맥놀이 (beats) ───
  { id:'phys8_03_beats', branchOf:'phys8_03', ord:1,
    enter:function(E){ var self=this; this.s={f2:5.5,t:0};
      E.controls('<div class="ctrl"><label>둘째 진동수 f₂ (f₁=5)</label><input type="range" id="ff" min="4" max="6" step="0.1" value="5.5"><output id="ffo">5.5</output></div>');
      E.bind('#ff','input',function(e){ self.s.f2=+e.target.value; document.getElementById('ffo').textContent=(+e.target.value).toFixed(1); E.blip(300+self.s.f2*40,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx; s.t+=1/60;
      var f1=5, f2=s.f2, x0=W*0.08, x1=W*0.92, midY=H*0.42, A=H*0.13, span=4;
      function w1(x){ return Math.sin(2*Math.PI*f1*(x-s.t*0.5)); } function w2(x){ return Math.sin(2*Math.PI*f2*(x-s.t*0.5)); }
      // 두 파동(옅게)
      [['rgba(95,214,168,0.35)',w1],['rgba(244,160,192,0.35)',w2]].forEach(function(p){ ctx.strokeStyle=p[0]; ctx.lineWidth=1.5; ctx.beginPath();
        for(var i=0;i<=300;i++){ var xu=i/300*span, X=x0+(x1-x0)*i/300, y=midY-A*0.5*p[1](xu); if(i===0)ctx.moveTo(X,y); else ctx.lineTo(X,y); } ctx.stroke(); });
      // 합(맥놀이)
      ctx.strokeStyle=BLU; ctx.lineWidth=2.5; ctx.beginPath();
      for(var j=0;j<=300;j++){ var xu2=j/300*span, X2=x0+(x1-x0)*j/300, y2=midY-A*(w1(xu2)+w2(xu2))/2; if(j===0)ctx.moveTo(X2,y2); else ctx.lineTo(X2,y2); } ctx.stroke();
      // 맥놀이 포락선
      ctx.strokeStyle='rgba(255,178,122,0.5)'; ctx.lineWidth=1; ctx.setLineDash([4,3]);
      [1,-1].forEach(function(sgn){ ctx.beginPath(); for(var k=0;k<=200;k++){ var xu3=k/200*span, env=Math.abs(Math.cos(Math.PI*(f1-f2)*(xu3-s.t*0.5))), X3=x0+(x1-x0)*k/200, y3=midY-sgn*A*env; if(k===0)ctx.moveTo(X3,y3); else ctx.lineTo(X3,y3); } ctx.stroke(); }); ctx.setLineDash([]);
      var fbeat=Math.abs(f1-f2);
      E.tapHint(W/2, H*0.90, 'f₂를 f₁에 가까이 — 맥놀이가 느려짐', true);
      E.big('맥놀이 진동수 = |f₁−f₂| = '+fbeat.toFixed(1)+' Hz', '비슷한 두 진동수가 겹치면 소리가 <b>주기적으로 커졌다 작아졌다</b> 합니다 — 맥놀이(beats). 두 파동이 같은 위상일 때 보강(큼), 반대 위상일 때 상쇄(작음)를 반복하기 때문. 맥놀이 진동수 = <b>|f₁−f₂|</b>. f₂를 f₁에 가까이 하면 맥놀이가 느려지고, 똑같아지면 사라집니다 — 악기 조율의 원리(맥놀이가 0이 될 때까지 맞춤). 주황 포락선이 소리 크기 변화입니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
