/* 물리학 제10장 열역학 — PhysLab로 상자 속 기체 분자를 직접 시뮬레이션
   온도=분자 평균 운동E, 압력=벽 충돌(운동론), PV=nRT, 1법칙 ΔU=Q-W, 엔트로피(자유팽창).
   기체 장면은 N개 분자를 탄성충돌로 적분 — 통계역학을 입자로 생성(진짜 엔진 시뮬).
   골든룰: 표시 수치(온도·압력)는 분자 속도에서 실시간 측정. Math.random 금지(결정적 해시).
   텍스트=content/phys10.json. 엔진=js/physlab.js, js/engine.js 공유. */
(function(){
  var GRN='#5fd6a8', BLU='#7ab8ff', ORA='#ffb27a', PNK='#f4a0c0', DIM='#9b99a3';
  function hash(i,sd){ var x=Math.sin(i*12.9898+sd*78.233)*43758.5453; return x-Math.floor(x); }   // 결정적 의사난수
  function gas(w,N,x0,y0,x1,y1,speed){ for(var i=0;i<N;i++){ var a=hash(i,1)*6.2832, px=x0+hash(i,2)*(x1-x0), py=y0+hash(i,3)*(y1-y0);
    w.add({x:px,y:py,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:0.16,m:1}); } }
  function rescale(w,targetSp){ var n=w.bodies.length,s=0,i; for(i=0;i<n;i++){ var b=w.bodies[i]; s+=Math.hypot(b.vx,b.vy); } var avg=s/n||1, k=targetSp/avg;
    for(i=0;i<n;i++){ w.bodies[i].vx*=k; w.bodies[i].vy*=k; } }
  function speedColor(v,vmax){ var t=Math.min(1,v/vmax); // 느림 파랑 → 빠름 주황/빨강
    var r=Math.round(120+t*135), g=Math.round(184-t*100), b=Math.round(255-t*180); return 'rgb('+r+','+g+','+b+')'; }
  function avgKE(w){ var n=w.bodies.length,s=0; for(var i=0;i<n;i++){ var b=w.bodies[i]; s+=0.5*b.m*(b.vx*b.vx+b.vy*b.vy); } return s/n; }

  var scenes=[

  // ══════════ 10.1 온도 = 분자 운동 ══════════
  { id:'phys10_01',
    enter:function(E){ var self=this; this.s={T:2};
      var w=PhysLab.world({g:0,bounds:[0,10],floor:0,ceil:7,rest:1}); this.s.w=w;
      gas(w,30,0.5,0.5,9.5,6.5,Math.sqrt(2*this.s.T)); E.setOn([]);
      E.controls('<div class="ctrl"><label>온도 T</label><input type="range" id="tt" min="0.5" max="6" step="0.5" value="2"><output id="tto">2.0</output></div>');
      E.bind('#tt','input',function(e){ self.s.T=+e.target.value; rescale(w,Math.sqrt(2*self.s.T)); document.getElementById('tto').textContent=(+e.target.value).toFixed(1); E.blip(300+self.s.T*70,0.07); }); },
    draw:function(E){ var s=this.s, w=s.w, ctx=E.ctx, W=E.W, H=E.H;
      w.step(1/60,6); w.collide();
      var ox=W*0.18, sc=Math.min(W*0.055,H*0.10), oy=H*0.80, v=PhysLab.view(ox,oy,sc); s.view=v;
      // 상자
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=2; ctx.strokeRect(v.X(0),v.Y(7),v.X(10)-v.X(0),v.Y(0)-v.Y(7));
      var vmax=Math.sqrt(2*6)*1.4;
      w.bodies.forEach(function(b){ var sp=Math.hypot(b.vx,b.vy); ctx.fillStyle=speedColor(sp,vmax); ctx.beginPath(); ctx.arc(v.X(b.x),v.Y(b.y),b.r*sc,0,7); ctx.fill(); });
      var ke=avgKE(w);
      E.tapHint(W/2, H*0.90, '온도를 올리면 분자가 빨라집니다', true);
      E.big('온도 ∝ 분자 평균 운동에너지 = '+ke.toFixed(2), '온도의 정체는 <b>분자들의 평균 운동에너지</b>입니다. 뜨겁다 = 분자가 빠르게 움직인다, 차갑다 = 느리다. 슬라이더로 온도를 올리면 분자(빠를수록 붉게)가 격렬히 부딪힙니다 — 30개 분자를 탄성충돌로 적분한 결과입니다. 절대영도(0 K)는 분자 운동이 멈추는 한계. 충돌로 속도가 섞여 자연히 맥스웰 분포가 됩니다.'); }
  },

  // ══════════ 10.2 기체 압력 — 벽 충돌(운동론) ══════════
  { id:'phys10_02',
    enter:function(E){ var self=this; this.s={T:2,N:24};
      this.build(); E.setOn([]);
      E.controls('<div class="ctrl"><label>온도 T</label><input type="range" id="tt" min="0.5" max="6" step="0.5" value="2"><output id="tto">2.0</output>'
        +'<label style="margin-left:14px">분자 수 N</label><input type="range" id="nn" min="8" max="44" step="4" value="24"><output id="nno">24</output></div>');
      E.bind('#tt','input',function(e){ self.s.T=+e.target.value; rescale(self.s.w,Math.sqrt(2*self.s.T)); document.getElementById('tto').textContent=(+e.target.value).toFixed(1); E.blip(320,0.07); });
      E.bind('#nn','input',function(e){ self.s.N=+e.target.value; document.getElementById('nno').textContent=e.target.value; self.build(); E.blip(380,0.07); }); },
    build:function(){ var s=this.s; var w=PhysLab.world({g:0,bounds:[0,10],floor:0,ceil:7,rest:1}); s.w=w; gas(w,s.N,0.5,0.5,9.5,6.5,Math.sqrt(2*s.T)); },
    draw:function(E){ var s=this.s, w=s.w, ctx=E.ctx, W=E.W, H=E.H;
      w.step(1/60,6); w.collide();
      var ox=W*0.10, sc=Math.min(W*0.05,H*0.092), oy=H*0.78, v=PhysLab.view(ox,oy,sc); s.view=v;
      ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.lineWidth=2.5; ctx.strokeRect(v.X(0),v.Y(7),v.X(10)-v.X(0),v.Y(0)-v.Y(7));
      var vmax=Math.sqrt(2*6)*1.4;
      w.bodies.forEach(function(b){ var sp=Math.hypot(b.vx,b.vy); ctx.fillStyle=speedColor(sp,vmax); ctx.beginPath(); ctx.arc(v.X(b.x),v.Y(b.y),b.r*sc,0,7); ctx.fill(); });
      // 운동론 압력 P = N·m·<v²>/(2·면적)  (2D), 분자 속도에서 측정
      var area=10*7, ke=avgKE(w), P=w.bodies.length*2*ke/(2*area)*100;
      // 압력 막대
      var bx=W*0.74, baseY=H*0.78, bh=H*0.5, mx=44*2*6/(2*area)*100*1.1;
      ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(bx,baseY-bh,46,bh);
      ctx.fillStyle=ORA; ctx.globalAlpha=0.85; ctx.fillRect(bx,baseY-Math.min(1,P/mx)*bh,46,Math.min(1,P/mx)*bh); ctx.globalAlpha=1;
      ctx.fillStyle=ORA; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('압력', bx+23, baseY+16);
      E.tapHint(W/2, H*0.90, '온도·분자 수를 바꿔 압력 변화를 보세요', true);
      E.big('압력 = 분자들의 벽 충돌 = '+P.toFixed(1), '기체 압력의 정체는 <b>수많은 분자가 벽을 두드리는 충격</b>입니다. 분자가 많을수록(N↑), 빠를수록(T↑) 벽 충돌이 잦고 세져 압력이 커집니다 — P ∝ N·T/V(운동론). 표시 압력은 분자 속도에서 P=N·m·〈v²〉/2A로 측정한 값. 풍선이 빵빵한 것, 더운 날 타이어 공기압이 오르는 것이 이것.'); }
  },

  // ══════════ 10.3 이상기체 법칙 PV = nRT ══════════
  { id:'phys10_03',
    enter:function(E){ var self=this; this.s={Vx:8,T:2};
      var w=PhysLab.world({g:0,bounds:[0,8],floor:0,ceil:7,rest:1}); this.s.w=w;
      gas(w,26,0.5,0.5,7.5,6.5,Math.sqrt(2*this.s.T)); E.setOn([]);
      E.controls('<div class="ctrl"><label>부피 V (피스톤)</label><input type="range" id="vv" min="3" max="9.5" step="0.5" value="8"><output id="vvo">8.0</output>'
        +'<label style="margin-left:14px">온도 T</label><input type="range" id="tt" min="0.8" max="5" step="0.4" value="2"><output id="tto">2.0</output></div>');
      E.bind('#vv','input',function(e){ self.s.Vx=+e.target.value; document.getElementById('vvo').textContent=(+e.target.value).toFixed(1); E.blip(360,0.07); });
      E.bind('#tt','input',function(e){ self.s.T=+e.target.value; rescale(self.s.w,Math.sqrt(2*self.s.T)); document.getElementById('tto').textContent=(+e.target.value).toFixed(1); E.blip(320,0.07); }); },
    draw:function(E){ var s=this.s, w=s.w, ctx=E.ctx, W=E.W, H=E.H;
      w.bounds[1]=s.Vx; w.step(1/60,6); w.collide();   // 피스톤 = 오른쪽 벽
      var ox=W*0.12, sc=Math.min(W*0.06,H*0.092), oy=H*0.74, v=PhysLab.view(ox,oy,sc); s.view=v;
      // 실린더(고정 폭 10) + 기체영역(0..Vx)
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=2; ctx.strokeRect(v.X(0),v.Y(7),v.X(10)-v.X(0),v.Y(0)-v.Y(7));
      ctx.fillStyle='rgba(122,184,255,0.08)'; ctx.fillRect(v.X(0),v.Y(7),v.X(s.Vx)-v.X(0),v.Y(0)-v.Y(7));
      var vmax=Math.sqrt(2*5)*1.4;
      w.bodies.forEach(function(b){ var sp=Math.hypot(b.vx,b.vy); ctx.fillStyle=speedColor(sp,vmax); ctx.beginPath(); ctx.arc(v.X(b.x),v.Y(b.y),b.r*sc,0,7); ctx.fill(); });
      // 피스톤
      ctx.fillStyle=DIM; ctx.fillRect(v.X(s.Vx)-3,v.Y(7),12,v.Y(0)-v.Y(7));
      var ke=avgKE(w), P=w.bodies.length*2*ke/(2*(s.Vx*7))*100, PV=P*s.Vx*7/100, nT=w.bodies.length*2*ke/2;
      ctx.fillStyle=GRN; ctx.font='13px sans-serif'; ctx.textAlign='left';
      ctx.fillText('P = '+P.toFixed(1), W*0.66, H*0.30); ctx.fillText('V ∝ '+s.Vx.toFixed(1), W*0.66, H*0.38); ctx.fillText('T ∝ '+ke.toFixed(2), W*0.66, H*0.46);
      ctx.fillStyle=ORA; ctx.fillText('PV/T ≈ 일정(nR)', W*0.66, H*0.56);
      E.tapHint(W/2, H*0.90, '피스톤(부피)과 온도를 바꿔 보세요', true);
      E.big('PV = nRT — 압축하면 압력↑, 데우면 압력↑', '이상기체 법칙 PV=nRT는 앞의 운동론에서 자연히 나옵니다. 피스톤으로 부피를 줄이면(V↓) 같은 분자가 좁은 곳에서 벽을 더 자주 두드려 압력이 오르고(보일 법칙 P∝1/V), 온도를 올리면(T↑) 분자가 빨라져 압력·부피가 커집니다(샤를). n·R은 분자 수가 정하는 상수.'); }
  },

  // ══════════ 10.4 열역학 제1법칙 ΔU = Q − W ══════════
  { id:'phys10_04',
    enter:function(E){ var self=this; this.s={Q:6,wf:0.4};
      E.controls('<div class="ctrl"><label>가한 열 Q</label><input type="range" id="qq" min="0" max="10" step="1" value="6"><output id="qqo">6</output>'
        +'<label style="margin-left:14px">팽창(일 비율)</label><input type="range" id="wf" min="0" max="1" step="0.1" value="0.4"><output id="wfo">0.4</output></div>');
      E.bind('#qq','input',function(e){ self.s.Q=+e.target.value; document.getElementById('qqo').textContent=e.target.value; E.blip(360,0.07); });
      E.bind('#wf','input',function(e){ self.s.wf=+e.target.value; document.getElementById('wfo').textContent=(+e.target.value).toFixed(1); E.blip(380,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var Wk=s.Q*s.wf, dU=s.Q-Wk, cx=W*0.40, cy=H*0.44;
      // 실린더
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=2; ctx.strokeRect(cx-70,cy-50,140,100);
      ctx.fillStyle='rgba(255,178,122,'+(0.1+dU*0.03)+')'; ctx.fillRect(cx-68,cy-48,136,96);
      ctx.fillStyle=ORA; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('내부에너지 U', cx, cy);
      // Q 들어옴(아래 빨강 화살표)
      ctx.strokeStyle=PNK; ctx.lineWidth=Math.max(2,s.Q); ctx.beginPath(); ctx.moveTo(cx,cy+90); ctx.lineTo(cx,cy+52); ctx.stroke();
      ctx.fillStyle=PNK; ctx.beginPath(); ctx.moveTo(cx,cy+52); ctx.lineTo(cx-7,cy+62); ctx.lineTo(cx+7,cy+62); ctx.fill();
      ctx.font='13px sans-serif'; ctx.fillText('열 Q = '+s.Q, cx, cy+108);
      // W 나감(위 피스톤 밀림, 초록 화살표)
      var push=Wk*5; ctx.fillStyle=DIM; ctx.fillRect(cx-70,cy-50-push-8,140,8);
      ctx.strokeStyle=GRN; ctx.lineWidth=Math.max(2,Wk); ctx.beginPath(); ctx.moveTo(cx,cy-58-push); ctx.lineTo(cx,cy-58-push-30); ctx.stroke();
      ctx.fillStyle=GRN; ctx.beginPath(); ctx.moveTo(cx,cy-58-push-30); ctx.lineTo(cx-7,cy-58-push-20); ctx.lineTo(cx+7,cy-58-push-20); ctx.fill();
      ctx.fillText('일 W = '+Wk.toFixed(1), cx, cy-58-push-38);
      // 에너지 막대
      var bx=W*0.68, baseY=H*0.70, bh=H*0.4, mx=11;
      [['열 Q',s.Q,PNK],['일 W',Wk,GRN],['ΔU',dU,ORA]].forEach(function(it,i){ var x=bx+i*64, hh=it[1]/mx*bh;
        ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(x,baseY-bh,44,bh); ctx.fillStyle=it[2]; ctx.globalAlpha=0.85; ctx.fillRect(x,baseY-hh,44,hh); ctx.globalAlpha=1;
        ctx.fillStyle='#dfeefb'; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText(it[1].toFixed(1),x+22,baseY-hh-6); ctx.fillStyle=it[2]; ctx.fillText(it[0],x+22,baseY+18); });
      E.tapHint(W/2, H*0.90, '가한 열 Q와 팽창(일) 비율을 바꿔 보세요', true);
      E.big('ΔU = Q − W = '+s.Q+' − '+Wk.toFixed(1)+' = '+dU.toFixed(1), '열역학 제1법칙은 에너지 보존입니다: 기체에 <b>열 Q를 넣으면</b>, 그 에너지는 ① 내부에너지 U를 올리거나(온도↑) ② 기체가 팽창하며 <b>일 W를 하는</b> 데 쓰입니다. ΔU = Q − W. 부피를 고정하면(팽창 0) 모든 열이 온도로, 팽창을 허용하면 일부가 일로 빠져나갑니다. 에너지는 사라지지 않고 형태만 바뀝니다.'); }
  },

  // ══════════ 10.5 엔트로피 — 자유팽창(시간의 화살) ══════════
  { id:'phys10_05',
    enter:function(E){ var self=this; this.s={open:false};
      this.build(); E.setOn([]); },
    build:function(){ var s=this.s; var w=PhysLab.world({g:0,bounds:[0,10],floor:0,ceil:7,rest:1}); s.w=w;
      gas(w,34,0.4,0.4,4.6,6.6,Math.sqrt(2*2.5)); s.open=false; },   // 처음엔 왼쪽 절반에만
    tap:function(E){ if(!this.s.open){ this.s.open=true; E.blip(220,0.16); } else { this.build(); E.blip(420,0.12); } },
    draw:function(E){ var s=this.s, w=s.w, ctx=E.ctx, W=E.W, H=E.H;
      // 닫힘: 오른쪽 벽=5(칸막이), 열림: 벽=10(전체)
      w.bounds[1]= s.open?10:5; w.step(1/60,6); w.collide();
      var ox=W*0.16, sc=Math.min(W*0.058,H*0.10), oy=H*0.74, v=PhysLab.view(ox,oy,sc); s.view=v;
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=2; ctx.strokeRect(v.X(0),v.Y(7),v.X(10)-v.X(0),v.Y(0)-v.Y(7));
      // 칸막이
      if(!s.open){ ctx.strokeStyle='rgba(255,178,122,0.7)'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(v.X(5),v.Y(7)); ctx.lineTo(v.X(5),v.Y(0)); ctx.stroke(); }
      else { ctx.strokeStyle='rgba(255,178,122,0.2)'; ctx.setLineDash([4,6]); ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(v.X(5),v.Y(7)); ctx.lineTo(v.X(5),v.Y(0)); ctx.stroke(); ctx.setLineDash([]); }
      var nL=0,nR=0; w.bodies.forEach(function(b){ if(b.x<5)nL++; else nR++; ctx.fillStyle=BLU; ctx.beginPath(); ctx.arc(v.X(b.x),v.Y(b.y),b.r*sc,0,7); ctx.fill(); });
      // 좌우 개수 막대
      ctx.fillStyle=GRN; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('왼쪽 '+nL, v.X(2.5), H*0.84); ctx.fillText('오른쪽 '+nR, v.X(7.5), H*0.84);
      E.tapHint(W/2, H*0.92, s.open?'화면 탭=다시 가두기(되감기)':'화면을 눌러 칸막이 제거', true);
      E.big(s.open?'자유팽창 — 분자가 고르게 퍼진다 (엔트로피↑)':'칸막이로 왼쪽에 가둔 기체', '칸막이를 없애면 기체는 <b>저절로 퍼져 양쪽을 고르게</b> 채웁니다(엔트로피 증가). 하지만 퍼진 분자가 <b>스스로 한쪽으로 다시 모이는 일은 결코 없습니다</b> — 통계적으로 거의 불가능하니까요. 이 비가역성이 <b>시간의 화살</b>입니다. 열역학 제2법칙: 고립계의 엔트로피(무질서)는 늘 증가. 컵의 물에 떨어진 잉크가 퍼지기만 하는 것과 같습니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
