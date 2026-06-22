/* 물리학 제5장 회전운동 — 회전 EOM을 매 프레임 적분(병진 PhysLab의 회전판)
   각속도/각가속도, 토크 τ=Iα, 관성모멘트 I, 각운동량 보존 L=Iω, 구심력(스프링 끈).
   회전은 ω,θ를 반암시적 오일러로 직접 적분(엔진 시뮬레이션 정신). 구심력은 PhysLab 스프링으로.
   골든룰: 표시 수치는 전부 현재 상태(θ,ω,I,v,r)에서 실시간 계산.
   텍스트=content/phys5.json. 엔진=js/physlab.js, js/engine.js 공유. */
(function(){
  var GRN='#5fd6a8', BLU='#7ab8ff', ORA='#ffb27a', PNK='#f4a0c0', DIM='#9b99a3';

  // 회전 반암시적 오일러 적분(서브스텝)
  function spin(s, alpha){ var h=1/60/6; for(var i=0;i<6;i++){ s.om += alpha*h; s.th += s.om*h; } }
  function arrow(E,x1,y1,x2,y2,col,lw){ var ctx=E.ctx; ctx.strokeStyle=col; ctx.lineWidth=lw||2.5;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    var a=Math.atan2(y2-y1,x2-x1); ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(x2,y2);
    ctx.lineTo(x2-10*Math.cos(a-0.4),y2-10*Math.sin(a-0.4)); ctx.lineTo(x2-10*Math.cos(a+0.4),y2-10*Math.sin(a+0.4)); ctx.fill(); }
  function disk(E,cx,cy,R,col){ var ctx=E.ctx; ctx.fillStyle=col; ctx.globalAlpha=0.14; ctx.beginPath(); ctx.arc(cx,cy,R,0,7); ctx.fill(); ctx.globalAlpha=1;
    ctx.strokeStyle=col; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(cx,cy,R,0,7); ctx.stroke(); }

  var scenes=[

  // ══════════ 5.1 각속도·각가속도 — v = rω ══════════
  { id:'phys5_01',
    enter:function(E){ var self=this; this.s={alpha:1.2,th:0,om:0,r:2};
      E.controls('<div class="ctrl"><label>각가속도 α (rad/s²)</label><input type="range" id="aa" min="0" max="3" step="0.2" value="1.2"><output id="aao">1.2</output></div>');
      E.bind('#aa','input',function(e){ self.s.alpha=+e.target.value; document.getElementById('aao').textContent=(+e.target.value).toFixed(1); E.blip(380,0.07); });
      E.setOn([]); },
    tap:function(E){ this.s.th=0; this.s.om=0; E.blip(360,0.12); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      spin(s, s.alpha); if(s.om>7){ s.om=0; }
      var cx=W*0.40, cy=H*0.46, R=Math.min(W*0.22,H*0.30), v=s.r*s.om;
      disk(E,cx,cy,R,BLU);
      // 회전 표시 반경선 + 점들
      for(var k=0;k<6;k++){ var a=s.th+k*Math.PI/3; ctx.strokeStyle='rgba(122,184,255,0.4)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+R*Math.cos(a),cy+R*Math.sin(a)); ctx.stroke(); }
      var rx=cx+R*Math.cos(s.th), ry=cy+R*Math.sin(s.th);
      arrow(E,cx,cy,rx,ry,ORA,3);
      ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(rx,ry,8,0,7); ctx.fill();
      // 접선 속도 벡터(반경에 수직)
      var tx=-Math.sin(s.th), ty=Math.cos(s.th), vl=v*16;
      arrow(E,rx,ry,rx+tx*vl,ry+ty*vl,GRN,2.5);
      ctx.fillStyle=GRN; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('v=rω', rx+tx*vl+6, ry+ty*vl);
      E.tapHint(W/2, H*0.88, '화면 탭 = 멈춤·재가속', true);
      E.big('ω = '+s.om.toFixed(2)+' rad/s,   v = rω = '+v.toFixed(2)+' m/s', '회전운동은 각도로 기술합니다: 각가속도 α가 각속도 ω를 키우고(ω=∫α dt), ω가 각도 θ를 키웁니다 — 직선운동의 a→v→x와 완전히 같은 구조. 반지름 r 지점의 실제 속력은 v=rω, 바깥일수록 빠릅니다(r='+s.r+' m).'); }
  },

  // ══════════ 5.2 토크 τ = r·F — 회전의 '힘' ══════════
  { id:'phys5_02',
    enter:function(E){ var self=this; this.s={r:1.5,F:4,th:-0.4,om:0,I:2};
      E.controls('<div class="ctrl"><label>지렛대 r (m)</label><input type="range" id="rr" min="0.5" max="2.5" step="0.1" value="1.5"><output id="rro">1.5</output>'
        +'<label style="margin-left:14px">힘 F (N)</label><input type="range" id="ff" min="1" max="8" step="0.5" value="4"><output id="ffo">4.0</output></div>');
      E.bind('#rr','input',function(e){ self.s.r=+e.target.value; document.getElementById('rro').textContent=(+e.target.value).toFixed(1); E.blip(360,0.07); });
      E.bind('#ff','input',function(e){ self.s.F=+e.target.value; document.getElementById('ffo').textContent=(+e.target.value).toFixed(1); E.blip(420,0.07); });
      E.setOn([]); },
    tap:function(E){ this.s.th=-0.4; this.s.om=0; E.blip(360,0.12); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var tau=s.r*s.F, alpha=tau/s.I; spin(s, alpha); if(s.om>7){ s.om=0; }
      var cx=W*0.40, cy=H*0.48, scale=Math.min(W*0.13,H*0.18);
      // 피벗
      ctx.fillStyle=DIM; ctx.beginPath(); ctx.arc(cx,cy,6,0,7); ctx.fill();
      // 지렛대 막대(길이 r)
      var ex=cx+s.r*scale*Math.cos(s.th), ey=cy+s.r*scale*Math.sin(s.th);
      ctx.strokeStyle=BLU; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(ex,ey); ctx.stroke();
      // 끝에 수직 힘(접선 방향)
      var tx=-Math.sin(s.th), ty=Math.cos(s.th);
      arrow(E,ex,ey,ex+tx*s.F*10,ey+ty*s.F*10,ORA,3);
      ctx.fillStyle=ORA; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('F', ex+tx*s.F*10+6, ey+ty*s.F*10);
      ctx.fillStyle=DIM; ctx.fillText('r', (cx+ex)/2+6, (cy+ey)/2-6);
      E.tapHint(W/2, H*0.88, '화면 탭 = 정지', true);
      E.big('토크 τ = r·F = '+tau.toFixed(1)+' N·m  →  α = τ/I = '+alpha.toFixed(2)+' rad/s²', '토크는 "회전시키는 능력" = 힘 × 지렛대 길이. 같은 힘이라도 멀리(r↑) 작용하면 토크가 커집니다 — 문손잡이가 경첩에서 먼 이유. 토크가 각가속도를 만듭니다: τ = Iα (회전판 F=ma). I='+s.I+' kg·m².'); }
  },

  // ══════════ 5.3 관성모멘트 I — 질량 분포가 회전 저항 ══════════
  { id:'phys5_03',
    enter:function(E){ var self=this; this.s={d:1.5,th:0,om:0,tau:6,m:1};
      E.controls('<div class="ctrl"><label>질량 위치 d (m)</label><input type="range" id="dd" min="0.4" max="2.4" step="0.1" value="1.5"><output id="ddo">1.5</output></div>');
      E.bind('#dd','input',function(e){ self.s.d=+e.target.value; document.getElementById('ddo').textContent=(+e.target.value).toFixed(1); E.blip(360,0.07); });
      E.setOn([]); },
    tap:function(E){ this.s.th=0; this.s.om=0; E.blip(360,0.12); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var I=2*s.m*s.d*s.d, alpha=s.tau/I; spin(s, alpha); if(s.om>7){ s.om=0; }
      var cx=W*0.40, cy=H*0.46, scale=Math.min(W*0.15,H*0.20);
      ctx.fillStyle=DIM; ctx.beginPath(); ctx.arc(cx,cy,5,0,7); ctx.fill();
      // 막대(축) 양끝에 질량
      var tx=Math.cos(s.th), ty=Math.sin(s.th), L=s.d*scale;
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(cx-tx*L,cy-ty*L); ctx.lineTo(cx+tx*L,cy+ty*L); ctx.stroke();
      [1,-1].forEach(function(sgn){ var mx=cx+sgn*tx*L, my=cy+sgn*ty*L; ctx.fillStyle=ORA; ctx.beginPath(); ctx.arc(mx,my,12,0,7); ctx.fill(); });
      E.tapHint(W/2, H*0.88, '화면 탭 = 정지', true);
      E.big('I = 2m·d² = '+I.toFixed(2)+' kg·m²  →  같은 토크에 α = '+alpha.toFixed(2)+' rad/s²', '관성모멘트 I = 회전의 "관성"(돌리기 어려운 정도) = Σmr². 같은 토크('+s.tau+' N·m)라도 질량이 바깥(d↑)이면 I가 커져 천천히 가속됩니다. 줄타기 장대를 길게 드는 이유, 팽이가 잘 도는 이유가 모두 질량 분포!'); }
  },

  // ══════════ 5.4 각운동량 보존 L = Iω — 피겨 스핀 ══════════
  { id:'phys5_04',
    enter:function(E){ var self=this; this.s={r:1.8,th:0,Icore:0.4,m:1,L0:null};
      // 초기 L 고정: I0 = Icore + 2 m r0² , ω0 = 2  →  L0
      var I0=0.4+2*1*1.8*1.8; this.s.L0=I0*2.0;
      E.controls('<div class="ctrl"><label>팔 길이 r (m)</label><input type="range" id="rr" min="0.3" max="2.2" step="0.1" value="1.8"><output id="rro">1.8</output></div>');
      E.bind('#rr','input',function(e){ self.s.r=+e.target.value; document.getElementById('rro').textContent=(+e.target.value).toFixed(1); E.blip(420-(+e.target.value)*40,0.07); });
      E.setOn([]); },
    tap:function(E){ this.s.th=0; E.blip(360,0.12); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var I=s.Icore+2*s.m*s.r*s.r, om=s.L0/I;        // 각운동량 보존: ω = L0 / I
      var h=1/60/6; for(var i=0;i<6;i++){ s.th += om*h; }
      var cx=W*0.40, cy=H*0.46, scale=Math.min(W*0.13,H*0.18);
      // 몸통
      disk(E,cx,cy,18,BLU);
      // 두 팔(질량)
      var tx=Math.cos(s.th), ty=Math.sin(s.th), L=s.r*scale;
      [1,-1].forEach(function(sgn){ var mx=cx+sgn*tx*L, my=cy+sgn*ty*L;
        ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(mx,my); ctx.stroke();
        ctx.fillStyle=PNK; ctx.beginPath(); ctx.arc(mx,my,10,0,7); ctx.fill(); });
      // 막대 그래프: L(보존)·I·ω
      var baseY=H*0.80, bh=H*0.32, items=[['L=Iω',s.L0,GRN],['I',I,BLU],['ω',om,ORA]], mx2=Math.max(s.L0,I,om,1)*1.15;
      items.forEach(function(it,i){ var x=W*0.66+i*64, hh=it[1]/mx2*bh;
        ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(x,baseY-bh,44,bh); ctx.fillStyle=it[2]; ctx.globalAlpha=0.85; ctx.fillRect(x,baseY-hh,44,hh); ctx.globalAlpha=1;
        ctx.fillStyle='#dfeefb'; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText(it[1].toFixed(2), x+22, baseY-hh-6);
        ctx.fillStyle=it[2]; ctx.fillText(it[0], x+22, baseY+18); });
      E.tapHint(W/2, H*0.90, '팔을 당기면(r↓) 회전이 빨라집니다', true);
      E.big('L = Iω = '+s.L0.toFixed(2)+' (보존)   ω = '+om.toFixed(2)+' rad/s', '각운동량 L=Iω는 외부 토크가 없으면 보존됩니다. 피겨 선수가 팔을 당기면(r↓) I가 줄어 ω가 커져 더 빨리 돕니다 — L은 그대로(초록 막대 고정). 다이빙·고양이 착지·중성자별의 빠른 자전이 모두 같은 원리!'); }
  },

  // ══════════ 5.5 구심력·원운동 — 줄을 끊으면 직선으로(엔진) ══════════
  { id:'phys5_05',
    enter:function(E){ var self=this; this.s={v0:3.2,r0:2.4,cut:false,trail:[]};
      var w=PhysLab.world({g:0}); this.s.w=w;
      var b=w.add({x:2.4,y:0,m:1,r:0.3,vx:0,vy:3.2,color:GRN}); this.s.b=b;
      this.setSpring(); E.setOn([]);
      E.controls('<div class="ctrl"><label>속력 v (m/s)</label><input type="range" id="vv" min="1.5" max="5" step="0.5" value="3.2"><output id="vvo">3.2</output></div>');
      E.bind('#vv','input',function(e){ self.s.v0=+e.target.value; document.getElementById('vvo').textContent=(+e.target.value).toFixed(1); self.relaunch(); E.blip(380,0.07); });
    },
    setSpring:function(){ var s=this.s, b=s.b; s.w.clearForces();
      if(!s.cut){ var k=b.m*s.v0*s.v0/(s.r0*s.r0); s.w.force(PhysLab.F.spring(b,0,0,k,0)); } },   // 원궤도: k=mv²/r²
    relaunch:function(){ var s=this.s, b=s.b; b.x=s.r0; b.y=0; b.vx=0; b.vy=s.v0; s.cut=false; s.trail=[]; this.setSpring(); },
    tap:function(E){ var s=this.s; if(!s.cut){ s.cut=true; this.setSpring(); E.blip(240,0.16); } else { this.relaunch(); E.blip(420,0.12); } },
    draw:function(E){ var s=this.s, w=s.w, b=s.b, W=E.W, H=E.H, ctx=E.ctx;
      w.step(1/60,6);
      var cx=W*0.42, cy=H*0.48, scale=Math.min(W*0.12,H*0.16);
      var v=PhysLab.view(cx,cy,scale); s.view=v;
      // 자취
      s.trail.push([b.x,b.y]); if(s.trail.length>140) s.trail.shift();
      ctx.strokeStyle='rgba(95,214,168,0.35)'; ctx.lineWidth=1.5; ctx.beginPath();
      s.trail.forEach(function(p,i){ if(i===0)ctx.moveTo(v.X(p[0]),v.Y(p[1])); else ctx.lineTo(v.X(p[0]),v.Y(p[1])); }); ctx.stroke();
      // 중심
      ctx.fillStyle=DIM; ctx.beginPath(); ctx.arc(cx,cy,5,0,7); ctx.fill();
      var px=v.X(b.x), py=v.Y(b.y), r=Math.hypot(b.x,b.y), sp=Math.hypot(b.vx,b.vy);
      // 줄(or 끊김)
      if(!s.cut){ ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(px,py); ctx.stroke();
        // 구심력 화살표(공→중심 방향, 길이 ∝ F)
        var Fmag=b.m*sp*sp/r, ux=(cx-px), uy=(cy-py), ud=Math.hypot(ux,uy)||1, fl=Math.min(ud*0.85, Fmag*7);
        arrow(E,px,py,px+ux/ud*fl,py+uy/ud*fl,ORA,2.5);
      }
      // 속도 화살표(접선)
      arrow(E,px,py,px+b.vx*scale*0.5,py-b.vy*scale*0.5,BLU,2.5);
      ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(px,py,8,0,7); ctx.fill();
      var Fc=b.m*sp*sp/r, om=sp/r;
      E.tapHint(W/2, H*0.90, s.cut?'화면 탭=줄 다시 매기':'화면을 눌러 줄 끊기', true);
      if(s.cut) E.big('줄을 끊으면 직선으로! (관성)', '구심력이 사라지자 공은 접선 방향으로 곧장 날아갑니다 — 뉴턴 1법칙. 원운동에는 "안쪽으로 당기는 힘"이 끊임없이 필요했던 것. 원심력은 가짜 힘, 진짜는 중심으로 당기는 구심력입니다.');
      else E.big('구심력 F = mv²/r = '+Fc.toFixed(2)+' N (중심 방향)', '등속 원운동도 "가속" 운동입니다 — 속력은 일정해도 속도(방향)가 계속 바뀌니까. 그 방향 변화를 만드는 힘이 구심력 F=mv²/r, 항상 중심을 향합니다. v='+sp.toFixed(2)+' m/s, ω=v/r='+om.toFixed(2)+' rad/s. 끈을 끊어 보세요!'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
