/* 물리학 제13장 자기·전자기유도 — 자기장, 로런츠 힘(PhysLab lorentzB), 전류의 자기장, 패러데이 유도, 발전기
   로런츠 힘 장면은 lorentzB(qv×B)를 적분해 원운동을 '생성', 발전기는 회전 적분으로 EMF 생성 — 엔진 시뮬.
   골든룰: 표시 수치는 전부 현재 상태/전자기식에서 실시간 계산.
   텍스트=content/phys13.json. 엔진=js/physlab.js, js/engine.js 공유. */
(function(){
  var GRN='#5fd6a8', BLU='#7ab8ff', ORA='#ffb27a', PNK='#f4a0c0', DIM='#9b99a3', NRED='#ff7a6b', SBLU='#6ba8ff';
  function arrow(E,x1,y1,x2,y2,col,lw){ var ctx=E.ctx; ctx.strokeStyle=col; ctx.lineWidth=lw||2;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    var a=Math.atan2(y2-y1,x2-x1); ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(x2,y2);
    ctx.lineTo(x2-9*Math.cos(a-0.4),y2-9*Math.sin(a-0.4)); ctx.lineTo(x2-9*Math.cos(a+0.4),y2-9*Math.sin(a+0.4)); ctx.fill(); }

  var scenes=[

  // ══════════ 13.1 자기장 — 자석과 나침반 ══════════
  { id:'phys13_01',
    enter:function(E){ var self=this; this.s={pol:1};
      E.controls('<div class="ctrl"><label>극 방향 (1 N오른쪽 / -1 뒤집기)</label><input type="range" id="pp" min="-1" max="1" step="2" value="1"><output id="ppo">N→S</output></div>');
      E.bind('#pp','input',function(e){ self.s.pol=+e.target.value; document.getElementById('ppo').textContent=self.s.pol>0?'N→S':'S→N'; E.blip(360,0.08); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var cx=W*0.42, cy=H*0.44, sc=Math.min(W*0.05,H*0.08);
      // 두 자극(N=+, S=−)을 자기홀극 근사로 두고 장 계산
      var pN=[s.pol*2,0], pS=[-s.pol*2,0];   // 월드 좌표
      function field(x,y){ var fx=0,fy=0; [[pN,1],[pS,-1]].forEach(function(p){ var dx=x-p[0][0],dy=y-p[0][1],r=Math.hypot(dx,dy)||0.4; var m=p[1]/(r*r); fx+=m*dx/r; fy+=m*dy/r; }); return [fx,fy]; }
      function X(x){return cx+x*sc;} function Y(y){return cy-y*sc;}
      // 나침반 바늘(격자에서 장 방향)
      for(var gx=-5;gx<=5;gx+=1.5){ for(var gy=-3.5;gy<=3.5;gy+=1.5){ if(Math.hypot(gx-2,gy)<1||Math.hypot(gx+2,gy)<1)continue;
        var f=field(gx,gy), fm=Math.hypot(f[0],f[1])||1, ux=f[0]/fm, uy=f[1]/fm, px=X(gx),py=Y(gy);
        arrow(E,px-ux*9,py+uy*9,px+ux*9,py-uy*9,'rgba(122,184,255,0.5)',1.3); } }
      // 막대자석 (N 빨강·S 파랑)
      var nx=X(s.pol*1.2), sx=X(-s.pol*1.2);
      ctx.fillStyle=s.pol>0?NRED:SBLU; ctx.fillRect(Math.min(nx,X(0)),Y(0)-16, Math.abs(nx-X(0)),32);
      ctx.fillStyle=s.pol>0?SBLU:NRED; ctx.fillRect(Math.min(sx,X(0)),Y(0)-16, Math.abs(sx-X(0)),32);
      ctx.fillStyle='#fff'; ctx.font='bold 14px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('N', X(s.pol*1.4), Y(0)); ctx.fillText('S', X(-s.pol*1.4), Y(0)); ctx.textBaseline='alphabetic';
      E.tapHint(W/2, H*0.90, '극을 뒤집으면 나침반이 따라 돕니다', true);
      E.big('자기장 — N에서 나와 S로 (나침반이 가리킴)', '자석 둘레에는 <b>자기장 B</b>가 있어 나침반 바늘을 정렬시킵니다 — 장은 <b>N극에서 나와 S극으로</b> 들어갑니다(파란 바늘). 극을 뒤집으면 장 전체가 반대로. 전기와 결정적 차이: <b>자기 홀극은 없습니다</b> — 자석을 쪼개도 항상 N·S가 함께 생깁니다. 지구도 거대한 자석이라 나침반 N이 북쪽을 가리킵니다.'); }
  },

  // ══════════ 13.2 로런츠 힘 — 자기장 속 원운동(lorentzB) ══════════
  { id:'phys13_02',
    enter:function(E){ var self=this; this.s={B:2,q:1,trail:[]};
      var w=PhysLab.world({g:0}); this.s.w=w;
      var b=w.add({x:0,y:-1.5,m:1,r:0.18,q:1,vx:3,vy:0,color:GRN}); this.s.b=b;
      w.force(PhysLab.F.lorentzB(self.s.B));
      E.controls('<div class="ctrl"><label>자기장 B</label><input type="range" id="bb" min="0.5" max="5" step="0.5" value="2"><output id="bbo">2.0</output>'
        +'<label style="margin-left:14px">전하 q</label><input type="range" id="qq" min="-2" max="2" step="1" value="1"><output id="qqo">+1</output></div>');
      E.bind('#bb','input',function(e){ self.s.B=+e.target.value; self.refield(); document.getElementById('bbo').textContent=(+e.target.value).toFixed(1); self.relaunch(); E.blip(360,0.07); });
      E.bind('#qq','input',function(e){ self.s.q=+e.target.value; self.s.b.q=self.s.q; document.getElementById('qqo').textContent=(self.s.q>0?'+':'')+self.s.q; self.relaunch(); E.blip(320,0.07); });
      E.setOn([]); },
    refield:function(){ this.s.w.clearForces(); this.s.w.force(PhysLab.F.lorentzB(this.s.B)); },
    relaunch:function(){ var s=this.s, b=s.b; b.x=0; b.y=-1.5; b.vx=3; b.vy=0; s.trail=[]; },
    tap:function(E){ this.relaunch(); E.blip(360,0.12); },
    draw:function(E){ var s=this.s, w=s.w, b=s.b, ctx=E.ctx, W=E.W, H=E.H;
      w.step(1/60,6);
      var cx=W*0.40, cy=H*0.46, sc=Math.min(W*0.07,H*0.10), v=PhysLab.view(cx,cy,sc); s.view=v;
      // B 장 표시(화면 밖으로 ⊙)
      for(var gx=-4;gx<=4;gx+=2){ for(var gy=-3;gy<=3;gy+=2){ ctx.strokeStyle='rgba(122,184,255,0.3)'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(v.X(gx),v.Y(gy),4,0,7); ctx.stroke(); ctx.fillStyle='rgba(122,184,255,0.5)'; ctx.beginPath(); ctx.arc(v.X(gx),v.Y(gy),1.3,0,7); ctx.fill(); } }
      // 자취
      s.trail.push([b.x,b.y]); if(s.trail.length>400) s.trail.shift();
      ctx.strokeStyle='rgba(95,214,168,0.5)'; ctx.lineWidth=1.5; ctx.beginPath();
      s.trail.forEach(function(p,i){ if(i===0)ctx.moveTo(v.X(p[0]),v.Y(p[1])); else ctx.lineTo(v.X(p[0]),v.Y(p[1])); }); ctx.stroke();
      var sp=Math.hypot(b.vx,b.vy), px=v.X(b.x), py=v.Y(b.y);
      // 속도·힘 화살표
      arrow(E,px,py,px+b.vx*sc*0.4,py-b.vy*sc*0.4,GRN,2);
      var Fx=b.q*b.vy*s.B, Fy=-b.q*b.vx*s.B, Fm=Math.hypot(Fx,Fy)||1;
      arrow(E,px,py,px+Fx/Fm*30,py-Fy/Fm*30,ORA,2.5);
      ctx.fillStyle=b.q>=0?NRED:SBLU; ctx.beginPath(); ctx.arc(px,py,7,0,7); ctx.fill();
      var r=Math.abs(b.m*sp/(s.q*s.B))||0;
      E.tapHint(W/2, H*0.92, '화면 탭 = 재발사', true);
      E.big('로런츠 힘 F = qv×B → 원운동 (반지름 r = mv/qB = '+r.toFixed(2)+')', '자기장 속을 가로지르는 전하는 늘 <b>진행 방향에 직각으로 미는 힘 F = qv×B</b>를 받습니다. 옆구리만 끝없이 밀리니 속력은 그대로인 채 방향만 휘어 — <b>빙글빙글 원을 그립니다</b>(자기력이 곧 구심력!). 자기장이 셀수록(B↑) 원이 작아지고(r=mv/qB), 전하 부호를 바꾸면 도는 방향이 뒤집힙니다. 오로라, 사이클로트론 가속기, 질량분석기의 원리입니다.'); }
  },

  // ══════════ 13.3 전류가 만드는 자기장 ══════════
  { id:'phys13_03',
    enter:function(E){ var self=this; this.s={I:4,ph:0};
      E.controls('<div class="ctrl"><label>전류 I</label><input type="range" id="ii" min="1" max="8" step="1" value="4"><output id="iio">4</output></div>');
      E.bind('#ii','input',function(e){ self.s.I=+e.target.value; document.getElementById('iio').textContent=e.target.value; E.blip(320,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx; s.ph+=s.I*0.004;
      var cx=W*0.40, cy=H*0.46;
      // 전선(수직, 전류 위로)
      ctx.strokeStyle=ORA; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(cx,cy-H*0.32); ctx.lineTo(cx,cy+H*0.32); ctx.stroke();
      arrow(E,cx,cy+30,cx,cy-30,ORA,0); ctx.fillStyle=ORA; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('전류 I↑', cx+10, cy-H*0.30);
      // 동심원 B (오른손 법칙: 전류 위 → B 시계반대, 앞쪽). 세기 ∝ I/r
      [1,2,3,4].forEach(function(rr){ var R=rr*Math.min(W*0.05,H*0.07), n=Math.max(3,Math.round(s.I*0.8/rr*4));
        ctx.strokeStyle='rgba(122,184,255,'+(0.5-rr*0.07)+')'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(cx,cy,R,0,7); ctx.stroke();
        // 방향 화살표(원 위 점들이 도는 느낌)
        for(var k=0;k<n;k++){ var a=s.ph/rr+k/n*6.2832, ax=cx+R*Math.cos(a), ay=cy+R*Math.sin(a), ta=a+Math.PI/2;
          arrow(E,ax-Math.cos(ta)*6,ay-Math.sin(ta)*6,ax+Math.cos(ta)*6,ay+Math.sin(ta)*6,'rgba(122,184,255,0.6)',1.2); } });
      E.tapHint(W/2, H*0.90, '전류를 키우면 자기장이 강해집니다', true);
      E.big('전류는 자기장을 만든다 (B ∝ I/r, 오른손 법칙)', '외르스테드의 발견: <b>전류가 흐르면 둘레에 자기장이 생깁니다</b>. 직선 전선 둘레로 자기장이 동심원을 그리며 감아 돕니다(B = μ₀I/2πr) — 전류가 셀수록, 가까울수록 강합니다. 방향은 <b>오른손 법칙</b>(엄지=전류, 감는 손가락=B). 전선을 코일로 감으면(솔레노이드) 자석처럼 강한 장이 생겨 전자석이 됩니다. 전기와 자기는 하나로 얽혀 있습니다.'); }
  },

  // ══════════ 13.4 전자기 유도 — 패러데이 법칙 ══════════
  { id:'phys13_04',
    enter:function(E){ var self=this; this.s={mx:-3,vmag:0,dir:1,t:0};
      E.controls('<div class="ctrl"><label>자석 속도</label><input type="range" id="vv" min="0" max="4" step="0.5" value="2"><output id="vvo">2.0</output></div>');
      E.bind('#vv','input',function(e){ self.s.vmag=+e.target.value; document.getElementById('vvo').textContent=(+e.target.value).toFixed(1); E.blip(360,0.07); });
      this.s.vmag=2; E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      // 자석 왕복 이동
      s.mx += s.dir*s.vmag*(1/60); if(s.mx>2){ s.mx=2; s.dir=-1; } if(s.mx<-5){ s.mx=-5; s.dir=1; }
      var cx=W*0.5, cy=H*0.42, sc=Math.min(W*0.06,H*0.09);
      function X(x){return cx+x*sc;}
      // 코일(오른쪽)
      var coilX=X(0); ctx.strokeStyle=DIM; ctx.lineWidth=2.5;
      for(var i=0;i<6;i++){ ctx.beginPath(); ctx.ellipse(coilX+i*10,cy,10,34,0,0,7); ctx.stroke(); }
      // 자석
      var magX=X(s.mx); ctx.fillStyle=NRED; ctx.fillRect(magX,cy-16,34,32); ctx.fillStyle=SBLU; ctx.fillRect(magX-34,cy-16,34,32);
      ctx.fillStyle='#fff'; ctx.font='bold 13px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('N',magX+17,cy); ctx.fillText('S',magX-17,cy); ctx.textBaseline='alphabetic';
      // 자속 변화율 ∝ 속도·근접도 → 유도기전력(검류계)
      var dist=Math.abs(s.mx), prox=Math.exp(-dist*dist/4), emf=s.dir*s.vmag*prox*(s.mx<0.5?1:0.3);
      // 검류계(바늘)
      var gx=W*0.78, gy=H*0.42; ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(gx,gy,40,Math.PI,0); ctx.stroke();
      var ang=Math.PI/2 - Math.max(-1.2,Math.min(1.2,emf*0.6)); ctx.strokeStyle=ORA; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(gx,gy); ctx.lineTo(gx+38*Math.cos(Math.PI+ang),gy-38*Math.sin(ang)); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('검류계', gx, gy+24);
      // 연결선
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(coilX+55,cy+34); ctx.lineTo(gx-40,gy+40); ctx.moveTo(coilX+55,cy-34); ctx.lineTo(gx+40,gy+40); ctx.stroke();
      E.tapHint(W/2, H*0.90, '자석이 빠를수록 큰 기전력이 유도됩니다', true);
      E.big('유도 기전력 ∝ 자속 변화율 (EMF = −dΦ/dt)', '코일을 지나는 <b>자기장(자속)이 변하면 전류가 유도</b>됩니다 — 패러데이의 전자기 유도. 자석을 코일에 넣었다 뺄 때 검류계 바늘이 흔들립니다. <b>빠를수록 큰 기전력</b>(EMF = −N·dΦ/dt). 자석이 멈춰 있으면(속도 0) 자속이 안 변해 전류도 0 — 변화가 핵심! 들어갈 때와 나올 때 전류 방향이 반대(렌츠 법칙). 발전기·마이크·무선충전·교통카드의 원리.'); }
  },

  // ══════════ 13.5 발전기 — 회전이 만드는 교류(EMF 적분) ══════════
  { id:'phys13_05',
    enter:function(E){ var self=this; this.s={w:2,th:0,hist:[]};
      E.controls('<div class="ctrl"><label>회전 속도 ω</label><input type="range" id="ww" min="0.5" max="5" step="0.5" value="2"><output id="wwo">2.0</output></div>');
      E.bind('#ww','input',function(e){ self.s.w=+e.target.value; document.getElementById('wwo').textContent=(+e.target.value).toFixed(1); E.blip(300+self.s.w*60,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      s.th += s.w*(1/60);
      var cx=W*0.30, cy=H*0.42, R=Math.min(W*0.11,H*0.17);
      // 자극(N 위, S 아래) — 균일장 영역
      ctx.fillStyle='rgba(255,122,107,0.15)'; ctx.fillRect(cx-R*1.5,cy-R*1.4,R*3,R*0.4);
      ctx.fillStyle='rgba(107,168,255,0.15)'; ctx.fillRect(cx-R*1.5,cy+R,R*3,R*0.4);
      ctx.fillStyle=NRED; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('N', cx-R*1.7, cy-R*1.1);
      ctx.fillStyle=SBLU; ctx.fillText('S', cx-R*1.7, cy+R*1.3);
      // 회전 코일(타원, 각 th)
      var c=Math.cos(s.th), w2=Math.abs(c)*R*1.3+3;
      ctx.strokeStyle=ORA; ctx.lineWidth=3; ctx.beginPath(); ctx.ellipse(cx,cy,w2,R,0,0,7); ctx.stroke();
      // 회전 표시 점(앞·뒤)
      ctx.fillStyle=c>0?GRN:DIM; ctx.beginPath(); ctx.arc(cx+w2,cy,5,0,7); ctx.fill();
      // EMF = NBAω sin(ωt) (회전 각속도로 적분된 θ에서)
      var emf=s.w*Math.sin(s.th); s.hist.push(emf); if(s.hist.length>240) s.hist.shift();
      var gx0=W*0.52, gx1=W*0.95, gy0=H*0.44, gh=H*0.30;
      ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(gx0,gy0); ctx.lineTo(gx1,gy0); ctx.moveTo(gx0,gy0-gh); ctx.lineTo(gx0,gy0+gh); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('EMF', gx0+3, gy0-gh+2); ctx.fillText('t', gx1-8, gy0+14);
      ctx.strokeStyle=ORA; ctx.lineWidth=2; ctx.beginPath();
      s.hist.forEach(function(v,i){ var x=gx0+(gx1-gx0)*i/240, y=gy0-(v/5)*gh; if(i===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); }); ctx.stroke();
      E.tapHint(W/2, H*0.90, '빠르게 돌릴수록 큰 교류가 나옵니다', true);
      E.big('발전기 — 코일 회전이 교류(AC)를 만든다  EMF ∝ ω·sin(ωt)', '발전기는 유도(13.4)를 거꾸로 활용합니다 — 자기장 속에서 <b>코일을 회전</b>시키면 코일을 지나는 자속이 사인형으로 변해, <b>교류(AC) 기전력</b>이 유도됩니다(EMF=NBAω·sinωt). 코일이 자극과 나란할 때 자속 변화율(EMF)이 최대, 수직일 때 0. 빠르게 돌릴수록(ω↑) 전압이 커지고 주파수도 높아집니다. 수력·풍력·화력 발전이 모두 이 원리 — 무언가를 돌려 코일을 회전시킵니다.'); }
  },

  // ─── 심화: 솔레노이드(전자석) ───
  { id:'phys13_03_solenoid', branchOf:'phys13_03', ord:1,
    enter:function(E){ var self=this; this.s={I:4,N:8};
      E.controls('<div class="ctrl"><label>전류 I</label><input type="range" id="ii" min="1" max="8" step="1" value="4"><output id="iio">4</output>'
        +'<label style="margin-left:14px">감은 수 N</label><input type="range" id="nn" min="4" max="14" step="1" value="8"><output id="nno">8</output></div>');
      E.bind('#ii','input',function(e){ self.s.I=+e.target.value; document.getElementById('iio').textContent=e.target.value; E.blip(360,0.07); });
      E.bind('#nn','input',function(e){ self.s.N=+e.target.value; document.getElementById('nno').textContent=e.target.value; E.blip(340,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var cx=W*0.42, cy=H*0.44, L=W*0.4, x0=cx-L/2, x1=cx+L/2;
      // 코일 감김(원들)
      ctx.strokeStyle=ORA; ctx.lineWidth=2.5;
      for(var i=0;i<s.N;i++){ var x=x0+L*i/(s.N-1); ctx.beginPath(); ctx.ellipse(x,cy,8,40,0,0,7); ctx.stroke(); }
      // 내부 균일 자기장(오른쪽으로), 세기 ∝ N·I
      var B=s.N*s.I; var nl=Math.max(2,Math.round(B/8));
      for(var k=0;k<nl;k++){ var yy=cy-20+k*(40/(nl-1||1)); arrow(E,x0+6,yy,x1-6,yy,'rgba(122,184,255,0.6)',2); }
      // 바깥 N/S 표시
      ctx.fillStyle=NRED; ctx.font='bold 16px sans-serif'; ctx.textAlign='center'; ctx.fillText('N', x1+24, cy+5);
      ctx.fillStyle=SBLU; ctx.fillText('S', x0-24, cy+5);
      E.tapHint(W/2, H*0.90, '전류·감은 수를 키우면 내부 자기장이 강해집니다', true);
      E.big('솔레노이드: 내부 균일 자기장 B = μ₀·n·I  (N·I = '+B+')', '전선을 촘촘히 감으면(솔레노이드) 각 고리의 자기장이 합쳐져 <b>내부에 균일한 강한 자기장</b>이 생깁니다 — 막대자석과 똑같은 N·S 극! 세기 <b>B = μ₀·n·I</b>(n=단위길이당 감은 수). 전류·감은 수에 비례하고, 전류를 끄면 자성도 사라지는 <b>전자석</b> — 크레인의 고철 자석, 자기부상열차, 스피커, MRI, 릴레이가 모두 솔레노이드. 안에 철심을 넣으면 수천 배 강해집니다.'); }
  },

  // ─── 심화: 변압기(상호유도) ───
  { id:'phys13_05_transformer', branchOf:'phys13_05', ord:1,
    enter:function(E){ var self=this; this.s={Np:4,Ns:8,Vp:10,t:0};
      E.controls('<div class="ctrl"><label>1차 감은 수 Np</label><input type="range" id="np" min="2" max="10" step="1" value="4"><output id="npo">4</output>'
        +'<label style="margin-left:14px">2차 감은 수 Ns</label><input type="range" id="ns" min="2" max="12" step="1" value="8"><output id="nso">8</output></div>');
      E.bind('#np','input',function(e){ self.s.Np=+e.target.value; document.getElementById('npo').textContent=e.target.value; E.blip(360,0.07); });
      E.bind('#ns','input',function(e){ self.s.Ns=+e.target.value; document.getElementById('nso').textContent=e.target.value; E.blip(340,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx; s.t+=1/60;
      var Vs=s.Vp*s.Ns/s.Np, cy=H*0.44;
      // 철심(가운데 사각)
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=6; ctx.strokeRect(W*0.40,cy-60,W*0.16,120);
      // 1차 코일(왼쪽)
      var px=W*0.38; ctx.strokeStyle=BLU; ctx.lineWidth=2.5; for(var i=0;i<s.Np;i++){ var y=cy-50+i*(100/(s.Np-1||1)); ctx.beginPath(); ctx.ellipse(px,y,10,6,0,0,7); ctx.stroke(); }
      // 2차 코일(오른쪽)
      var sx=W*0.58; ctx.strokeStyle=ORA; for(i=0;i<s.Ns;i++){ var y2=cy-50+i*(100/(s.Ns-1||1)); ctx.beginPath(); ctx.ellipse(sx,y2,10,6,0,0,7); ctx.stroke(); }
      // 자속 표시(철심 따라 도는 화살표)
      ctx.fillStyle=GRN; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('변하는 자속 Φ', W*0.48, cy-70);
      // 전압 막대
      ctx.fillStyle=BLU; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('1차 Vp='+s.Vp+'V (Np='+s.Np+')', px, cy+80);
      ctx.fillStyle=ORA; ctx.fillText('2차 Vs='+Vs.toFixed(1)+'V (Ns='+s.Ns+')', sx, cy+80);
      var type = s.Ns>s.Np?'승압':(s.Ns<s.Np?'강압':'1:1');
      E.tapHint(W/2, H*0.90, '감은 수 비를 바꿔 전압을 올리고 내리세요', true);
      E.big('변압기('+type+'): Vs/Vp = Ns/Np → Vs = '+Vs.toFixed(1)+' V', '변압기는 상호유도로 <b>교류 전압을 바꿉니다</b>. 1차 코일의 변하는 자속이 철심을 타고 2차 코일에 기전력을 유도 — <b>Vs/Vp = Ns/Np</b>(감은 수 비). 2차가 많으면 승압, 적으면 강압. 에너지 보존이라 전압을 올리면 전류는 그만큼 줄어듭니다(VpIp=VsIs). 발전소→고압 송전(I²R 손실↓)→가정용 강압의 핵심. 직류는 자속이 안 변해 작동 안 함(교류 전용).'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
