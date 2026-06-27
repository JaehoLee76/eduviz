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
      ctx.font='11px sans-serif'; ctx.textAlign='left';
      ctx.fillStyle=GRN; ctx.fillText('v', px+b.vx*sc*0.4+4, py-b.vy*sc*0.4);
      ctx.fillStyle=ORA; ctx.fillText('F=qv×B', px+Fx/Fm*30+4, py-Fy/Fm*30);
      ctx.fillStyle='rgba(122,184,255,0.7)'; ctx.fillText('B (⊙ 화면 밖)', v.X(-4), v.Y(3)+4);
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
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx; if(!E.frozen)s.ph+=s.I*0.004;
      var cx=W*0.40, cy=H*0.46;
      // 전선(수직, 전류 위로)
      ctx.strokeStyle=ORA; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(cx,cy-H*0.32); ctx.lineTo(cx,cy+H*0.32); ctx.stroke();
      arrow(E,cx,cy+30,cx,cy-30,ORA,0); ctx.fillStyle=ORA; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('전류 I='+s.I+'A↑', cx+10, cy-H*0.30);
      ctx.fillStyle='rgba(122,184,255,0.8)'; ctx.fillText('자기장 B (B ∝ I/r)', cx+4*Math.min(W*0.05,H*0.07)+8, cy);
      // 동심원 B (오른손 법칙: 전류 위 → B 시계반대, 앞쪽). 세기 ∝ I/r
      [1,2,3,4].forEach(function(rr){ var R=rr*Math.min(W*0.05,H*0.07), n=Math.max(3,Math.round(s.I*0.8/rr*4));
        ctx.strokeStyle='rgba(122,184,255,'+(0.5-rr*0.07)+')'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(cx,cy,R,0,7); ctx.stroke();
        // 방향 화살표(원 위 점들이 도는 느낌)
        for(var k=0;k<n;k++){ var a=s.ph/rr+k/n*6.2832, ax=cx+R*Math.cos(a), ay=cy+R*Math.sin(a), ta=a+Math.PI/2;
          arrow(E,ax-Math.cos(ta)*6,ay-Math.sin(ta)*6,ax+Math.cos(ta)*6,ay+Math.sin(ta)*6,'rgba(122,184,255,0.6)',1.2); } });
      E.tapHint(W/2, H*0.90, '전류를 키우면 자기장이 강해집니다', true);
      E.big('전류는 자기장을 만든다 (B ∝ I/r, 오른손 법칙)', '외르스테드의 발견: <b>전류가 흐르면 둘레에 자기장이 생깁니다</b>. 직선 전선 둘레로 자기장이 동심원을 그리며 감아 돕니다(B = μ₀I/2πr) — 전류가 셀수록, 가까울수록 강합니다. 방향은 <b>오른손 법칙</b>(엄지=전류, 감는 손가락=B). 전선을 코일로 감으면(솔레노이드) 자석처럼 강한 장이 생겨 전자석이 됩니다. 전기와 자기는 하나로 얽혀 있습니다.'); }
  },

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
