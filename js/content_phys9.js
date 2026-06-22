/* 물리학 제9장 유체 — 압력 P=F/A, 깊이압력 P=ρgh, 부력(아르키메데스), 연속방정식, 베르누이
   골든룰: 표시 수치는 전부 현재 상태/유체식에서 계산.
   텍스트=content/phys9.json. js/physlab.js, js/engine.js 공유. */
(function(){
  var GRN='#5fd6a8', BLU='#7ab8ff', ORA='#ffb27a', PNK='#f4a0c0', DIM='#9b99a3', WAT='rgba(122,184,255,0.20)';

  var scenes=[

  // ══════════ 9.1 압력 P = F/A ══════════
  { id:'phys9_01',
    enter:function(E){ var self=this; this.s={A:0.04,F:600};
      E.controls('<div class="ctrl"><label>접촉 면적 A (m²)</label><input type="range" id="aa" min="0.01" max="0.4" step="0.01" value="0.04"><output id="aao">0.04</output></div>');
      E.bind('#aa','input',function(e){ self.s.A=+e.target.value; document.getElementById('aao').textContent=(+e.target.value).toFixed(2); E.blip(520-self.s.A*400,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var P=s.F/s.A;   // 압력
      var groundY=H*0.62, cx=W*0.40;
      // 발판 폭 ∝ √A (정사각 가정)
      var footW=Math.sqrt(s.A)*340, sink=Math.min(70, P/200);   // 침투깊이 ∝ 압력
      // 지면(부드러운 눈/흙)
      ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.fillRect(W*0.10,groundY,W*0.6,H*0.3);
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(W*0.10,groundY); ctx.lineTo(W*0.70,groundY); ctx.stroke();
      // 눌린 자국
      ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(cx-footW/2, groundY, footW, sink);
      // 무게(블록) + 힘 화살표
      ctx.fillStyle=ORA; ctx.globalAlpha=0.3; ctx.fillRect(cx-footW/2, groundY+sink-50, footW, 50); ctx.globalAlpha=1;
      ctx.strokeStyle=ORA; ctx.lineWidth=2; ctx.strokeRect(cx-footW/2, groundY+sink-50, footW, 50);
      ctx.strokeStyle=PNK; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(cx,groundY+sink-90); ctx.lineTo(cx,groundY+sink-54); ctx.stroke();
      ctx.fillStyle=PNK; ctx.beginPath(); ctx.moveTo(cx,groundY+sink-54); ctx.lineTo(cx-5,groundY+sink-64); ctx.lineTo(cx+5,groundY+sink-64); ctx.fill();
      ctx.fillStyle=PNK; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('F = '+s.F+' N', cx, groundY+sink-96);
      ctx.fillStyle=DIM; ctx.fillText('면적 A = '+s.A.toFixed(2)+' m²', cx, groundY+sink+18);
      E.tapHint(W/2, H*0.90, '접촉 면적이 좁을수록 압력이 커져 깊이 박힙니다', true);
      E.big('압력 P = F/A = '+Math.round(P)+' Pa', '눈밭에서 그냥 걸으면 푹 빠지는데 눈신발을 신으면 안 빠지죠? 무게는 똑같은데 말입니다. 비밀은 <b>면적</b>입니다. 중요한 건 힘 자체가 아니라 그 힘이 얼마나 좁은 면적에 몰리느냐 — 그게 압력 P=F/A입니다. 같은 손가락 힘이라도 압정 뾰족한 끝에 모이면 벽을 뚫습니다. 칼이 잘 드는 것도 힘이 세서가 아니라 날이 얇아 면적이 거의 0이기 때문이죠. 면적을 줄여 보세요 — 자국이 쑥 깊어집니다. 1 Pa = 1 N/m².'); }
  },

  // ══════════ 9.2 깊이 압력 P = ρgh ══════════
  { id:'phys9_02',
    enter:function(E){ var self=this; this.s={rho:1000,t:0};
      E.controls('<div class="ctrl"><label>액체 밀도 ρ (물=1000)</label><input type="range" id="rr" min="600" max="1400" step="50" value="1000"><output id="rro">1000</output></div>');
      E.bind('#rr','input',function(e){ self.s.rho=+e.target.value; document.getElementById('rro').textContent=e.target.value; E.blip(360,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, g=9.8; s.t+=1/60;
      var tankX=W*0.14, tankW=W*0.30, topY=H*0.16, botY=H*0.74, Hm=3;   // 탱크 깊이 3 m
      var scaleY=(botY-topY)/Hm, scaleX=(W*0.5)/8;
      // 물탱크
      ctx.fillStyle=WAT; ctx.fillRect(tankX,topY,tankW,botY-topY);
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(tankX,topY); ctx.lineTo(tankX,botY); ctx.lineTo(tankX+tankW,botY); ctx.lineTo(tankX+tankW,topY); ctx.stroke();
      // 깊이별 구멍 + 분출(토리첼리 v=√(2gh))
      [0.8,1.6,2.5].forEach(function(h,i){ var hy=topY+h*scaleY, v=Math.sqrt(2*g*h), P=s.rho*g*h;
        ctx.fillStyle=BLU; ctx.beginPath(); ctx.arc(tankX+tankW,hy,4,0,7); ctx.fill();
        // 포물선 물줄기
        ctx.strokeStyle='rgba(122,184,255,0.7)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(tankX+tankW,hy);
        for(var k=0;k<=30;k++){ var tt=k/30*0.9, x=tankX+tankW+v*tt*scaleX, y=hy+0.5*g*tt*tt*scaleY; if(y>botY)break; ctx.lineTo(x,y); } ctx.stroke();
        ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('h='+h+'m  P='+(P/1000).toFixed(1)+' kPa', tankX+tankW+6, hy-6); });
      // 깊이 화살표
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='right'; ctx.fillText('수면', tankX-6, topY+4); ctx.fillText('바닥', tankX-6, botY);
      var Pbot=s.rho*g*Hm;
      E.tapHint(W/2, H*0.90, '깊은 구멍일수록 물이 세게 분출됩니다', true);
      E.big('P = ρgh — 바닥 압력 '+(Pbot/1000).toFixed(1)+' kPa', '수영장 깊이 잠수하면 왜 귀가 아플까요? 머리 위로 쌓인 물이 통째로 누르기 때문입니다. 깊을수록 위에 쌓인 물기둥이 무거워지니 압력도 그만큼 커지죠 — 딱 P = ρgh입니다(깊이 h가 핵심). 보세요: 깊은 구멍일수록 물이 더 세게, 더 멀리 뿜어 나옵니다(속도 v=√(2gh)). 댐을 아래쪽일수록 두껍게 짓는 이유가 바로 이것입니다. 신기한 점 — 압력은 오직 깊이로 정해지고, 그릇이 가늘든 굵든 물이 몇 톤이든 상관없습니다(파스칼의 역설).'); }
  },

  // ══════════ 9.3 부력 — 아르키메데스 ══════════
  { id:'phys9_03',
    enter:function(E){ var self=this; this.s={d:0.6,grab:false,surf:5,L:1};
      var w=PhysLab.world({g:9.8, floor:0}); this.s.w=w;
      var b=w.add({x:5,y:6.5,m:0.6,r:0.5,color:ORA}); this.s.b=b;
      var S=this.s;
      w.force(function(){ var half=S.L/2, sub=Math.max(0,Math.min(S.L, S.surf-(b.y-half)));   // 잠긴 높이
        b.fy += 1000*9.8*S.L*sub/1000;        // 부력 = ρ_물·g·잠긴부피 (ρ_물=1000, 단위면적)
        if(sub>0) b.fy -= 2.2*b.vy; });        // 물의 점성 저항
      E.controls('<div class="ctrl"><label>물체 밀도 (물=1.0)</label><input type="range" id="dd" min="0.2" max="1.6" step="0.1" value="0.6"><output id="ddo">0.6</output></div>');
      E.bind('#dd','input',function(e){ S.d=+e.target.value; b.m=S.d*S.L*S.L*1; document.getElementById('ddo').textContent=(+e.target.value).toFixed(1); E.blip(380,0.07); });
      b.m=S.d; E.setOn([]); },
    down:function(E,cx,cy){ var s=this.s, v=s.view; if(!v)return; var b=s.b, wx=v.wx(cx), wy=v.wy(cy);
      if(Math.abs(b.x-wx)<0.7 && Math.abs(b.y-wy)<0.7){ b.held=true; s.grab=true; } },
    move:function(E,cx,cy){ var s=this.s; if(s.grab&&s.view){ var b=s.b, wy=s.view.wy(cy); b.y=Math.max(0.5,Math.min(8,wy)); b.vy=0; } },
    up:function(E){ var s=this.s; if(s.grab){ s.b.held=false; s.grab=false; } },
    draw:function(E){ var s=this.s, w=s.w, b=s.b, ctx=E.ctx, W=E.W, H=E.H, L=s.L;
      if(!s.grab) w.step(1/60,6);
      var ox=W*0.30, sc=Math.min(W*0.06,H*0.085), oy=H*0.86, view=PhysLab.view(ox,oy,sc); s.view=view;
      function X(x){return view.X(x);} function Y(y){return view.Y(y);}
      // 물(수면 surf 이하)
      ctx.fillStyle=WAT; ctx.fillRect(X(0),Y(s.surf),X(10)-X(0),Y(0)-Y(s.surf));
      ctx.strokeStyle='rgba(122,184,255,0.5)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(X(0),Y(s.surf)); ctx.lineTo(X(10),Y(s.surf)); ctx.stroke();
      ctx.fillStyle=BLU; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('수면', X(10)+6, Y(s.surf)+4);
      // 블록(잠긴 부분 진하게)
      var half=L/2, px=X(b.x), pyTop=Y(b.y+half), Lpx=L*sc, sub=Math.max(0,Math.min(L,s.surf-(b.y-half)));
      ctx.fillStyle=ORA; ctx.globalAlpha=0.25; ctx.fillRect(px-Lpx/2,pyTop,Lpx,Lpx); ctx.globalAlpha=1;
      if(sub>0){ ctx.fillStyle='rgba(255,178,122,0.5)'; var subTop=Y(Math.min(s.surf,b.y+half)); ctx.fillRect(px-Lpx/2, subTop, Lpx, sub*sc); }
      ctx.strokeStyle=ORA; ctx.lineWidth=2; ctx.strokeRect(px-Lpx/2,pyTop,Lpx,Lpx);
      if(b.held){ ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.strokeRect(px-Lpx/2-3,pyTop-3,Lpx+6,Lpx+6); }
      // 힘 화살표: 무게(아래)·부력(위)
      var Fb=1000*9.8*L*sub/1000, Wt=b.m*9.8;
      ctx.strokeStyle=PNK; ctx.lineWidth=2.5; var cy0=pyTop+Lpx/2; ctx.beginPath(); ctx.moveTo(px+Lpx/2+8,cy0); ctx.lineTo(px+Lpx/2+8,cy0+Math.min(50,Wt*4)); ctx.stroke();
      ctx.fillStyle=PNK; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('무게 '+Wt.toFixed(1), px+Lpx/2+12, cy0+14);
      ctx.strokeStyle=GRN; ctx.beginPath(); ctx.moveTo(px-Lpx/2-8,cy0); ctx.lineTo(px-Lpx/2-8,cy0-Math.min(50,Fb*4)); ctx.stroke();
      ctx.fillStyle=GRN; ctx.textAlign='right'; ctx.fillText('부력 '+Fb.toFixed(1), px-Lpx/2-12, cy0-14);
      var frac=Math.round(sub/L*100), state=s.d<1?'뜸(부분 잠김)':(s.d>1?'가라앉음':'중성부력');
      E.tapHint(W/2, H*0.93, '블록을 끌어 물속으로 눌러 보세요', true);
      E.big('부력 = 밀어낸 물의 무게  ('+state+', 잠김 '+frac+'%)', '욕조에 몸을 담그면 몸이 가벼워지죠? 물이 위로 떠받치기 때문입니다 — 이게 부력입니다. 얼마나 떠받칠까요? 아르키메데스가 욕조에서 깨달았듯, 정확히 <b>내가 밀어낸 물의 무게만큼</b>입니다(F=ρ_유체·g·V_잠김). 그래서 물보다 가벼우면(d<1) 딱 무게만큼만 밀어낼 정도로 잠긴 뒤 멈춰서 뜹니다 — 잠긴 비율 = 물체밀도÷물밀도. 빙산이 90% 잠기는 건 얼음 밀도가 0.9라서고, 쇳덩이는 가라앉아도 배가 뜨는 건 속이 비어 평균밀도가 낮기 때문이죠. 블록을 물속으로 눌렀다 놓아 보세요 — 통통 떠오릅니다.'); }
  },

  // ══════════ 9.4 연속 방정식 A₁v₁ = A₂v₂ ══════════
  { id:'phys9_04',
    enter:function(E){ var self=this; this.s={A2:0.3,t:0,parts:[]};
      for(var i=0;i<22;i++) this.s.parts.push(i/22*10);
      E.controls('<div class="ctrl"><label>좁은 곳 단면적 A₂</label><input type="range" id="aa" min="0.15" max="0.9" step="0.05" value="0.3"><output id="aao">0.30</output></div>');
      E.bind('#aa','input',function(e){ self.s.A2=+e.target.value; document.getElementById('aao').textContent=(+e.target.value).toFixed(2); E.blip(360,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx; s.t+=1/60;
      var x0=W*0.10, x1=W*0.90, midY=H*0.42, A1=0.9, v1=1.2;
      // 파이프 폭: 넓음 A1 → 좁음 A2 → 넓음 (가운데 좁아짐)
      function rad(xu){ var t=xu/10; var nar=Math.exp(-Math.pow((t-0.5)/0.16,2)); return (A1-(A1-s.A2)*nar)*70; }
      function vel(xu){ var t=xu/10; var nar=Math.exp(-Math.pow((t-0.5)/0.16,2)); var A=A1-(A1-s.A2)*nar; return v1*A1/A; }   // A·v 일정
      // 파이프 벽
      ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.lineWidth=2; ctx.beginPath();
      for(var i=0;i<=100;i++){ var xu=i/100*10, X=x0+(x1-x0)*i/100, r=rad(xu); if(i===0)ctx.moveTo(X,midY-r); else ctx.lineTo(X,midY-r); } ctx.stroke();
      ctx.beginPath(); for(i=0;i<=100;i++){ var xu2=i/100*10, X2=x0+(x1-x0)*i/100, r2=rad(xu2); if(i===0)ctx.moveTo(X2,midY+r2); else ctx.lineTo(X2,midY+r2); } ctx.stroke();
      ctx.fillStyle=WAT; ctx.beginPath();
      for(i=0;i<=100;i++){ var xu3=i/100*10, X3=x0+(x1-x0)*i/100; ctx.lineTo(X3,midY-rad(xu3)); }
      for(i=100;i>=0;i--){ var xu4=i/100*10, X4=x0+(x1-x0)*i/100; ctx.lineTo(X4,midY+rad(xu4)); } ctx.fill();
      // 흐르는 입자(좁은 곳에서 빨라짐)
      s.parts.forEach(function(p,idx){ s.parts[idx]+=vel(p)*(1/60)*1.4; if(s.parts[idx]>10) s.parts[idx]-=10;
        var xu=s.parts[idx], X=x0+(x1-x0)*xu/10, r=rad(xu); var yoff=((idx*37)%100/100-0.5)*1.4*r;
        ctx.fillStyle=BLU; ctx.beginPath(); ctx.arc(X, midY+yoff, 3, 0, 7); ctx.fill(); });
      var v2=v1*A1/s.A2;
      ctx.fillStyle=GRN; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('넓음: A₁='+A1+', v₁='+v1.toFixed(1), x0+W*0.10, H*0.66);
      ctx.fillStyle=ORA; ctx.fillText('좁음: A₂='+s.A2.toFixed(2)+', v₂='+v2.toFixed(1), W*0.5, H*0.20);
      E.tapHint(W/2, H*0.90, '좁은 곳일수록 유속이 빨라집니다', true);
      E.big('연속방정식 A₁v₁ = A₂v₂  →  v₂ = '+v2.toFixed(2), '호스 끝을 손가락으로 살짝 막으면 물이 더 세차게 멀리 뿜어 나가죠? 왜 그럴까요? 들어온 물은 어디 갈 데가 없으니 나간 만큼 그대로 나와야 합니다. 그런데 출구가 좁아졌으니, 같은 양이 빠져나가려면 더 빨리 흘러야 하죠. 그게 연속방정식 <b>A₁v₁ = A₂v₂</b>입니다 — 단면적이 작아진 만큼 속도가 커집니다. 강이 좁아지면 급류가 되고, 빌딩 사이 좁은 골목에서 바람이 거세지는 것도 똑같은 이치입니다. 좁은 곳을 더 좁혀 보세요 — 그곳 속도가 치솟습니다.'); }
  },

  // ══════════ 9.5 베르누이 — 빠른 흐름은 낮은 압력 ══════════
  { id:'phys9_05',
    enter:function(E){ var self=this; this.s={A2:0.3,t:0,parts:[]};
      for(var i=0;i<22;i++) this.s.parts.push(i/22*10);
      E.controls('<div class="ctrl"><label>좁은 곳 단면적 A₂</label><input type="range" id="aa" min="0.15" max="0.9" step="0.05" value="0.3"><output id="aao">0.30</output></div>');
      E.bind('#aa','input',function(e){ self.s.A2=+e.target.value; document.getElementById('aao').textContent=(+e.target.value).toFixed(2); E.blip(360,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, rho=1.2, P0=100; s.t+=1/60;
      var x0=W*0.10, x1=W*0.90, midY=H*0.46, A1=0.9, v1=2;
      function area(xu){ var t=xu/10, nar=Math.exp(-Math.pow((t-0.5)/0.16,2)); return A1-(A1-s.A2)*nar; }
      function rad(xu){ return area(xu)*60; }
      function vel(xu){ return v1*A1/area(xu); }
      function pres(xu){ var v=vel(xu); return P0 + 0.5*rho*v1*v1 - 0.5*rho*v*v; }   // 베르누이: P+½ρv²=일정
      ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.lineWidth=2;
      ctx.beginPath(); for(var i=0;i<=100;i++){ var xu=i/100*10, X=x0+(x1-x0)*i/100; if(i===0)ctx.moveTo(X,midY-rad(xu)); else ctx.lineTo(X,midY-rad(xu)); } ctx.stroke();
      ctx.beginPath(); for(i=0;i<=100;i++){ var xu2=i/100*10, X2=x0+(x1-x0)*i/100; if(i===0)ctx.moveTo(X2,midY+rad(xu2)); else ctx.lineTo(X2,midY+rad(xu2)); } ctx.stroke();
      ctx.fillStyle=WAT; ctx.beginPath();
      for(i=0;i<=100;i++){ var a=i/100*10, X3=x0+(x1-x0)*i/100; ctx.lineTo(X3,midY-rad(a)); }
      for(i=100;i>=0;i--){ var b2=i/100*10, X4=x0+(x1-x0)*i/100; ctx.lineTo(X4,midY+rad(b2)); } ctx.fill();
      // 압력 게이지(수직 관) — 느린(넓은) 곳 높이↑, 빠른(좁은) 곳 낮음
      [1.5,5,8.5].forEach(function(xu){ var X=x0+(x1-x0)*xu/10, r=rad(xu), P=pres(xu), colh=(P-60)*1.4;
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1; ctx.strokeRect(X-7, midY-r-colh-30, 14, colh+30);
        ctx.fillStyle=(xu===5?ORA:BLU); ctx.globalAlpha=0.7; ctx.fillRect(X-7, midY-r-colh, 14, colh); ctx.globalAlpha=1;
        ctx.fillStyle=(xu===5?ORA:BLU); ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText(Math.round(P), X, midY-r-colh-36); });
      // 입자
      s.parts.forEach(function(p,idx){ s.parts[idx]+=vel(p)*(1/60)*1.1; if(s.parts[idx]>10) s.parts[idx]-=10;
        var xu=s.parts[idx], X=x0+(x1-x0)*xu/10, r=rad(xu), yoff=((idx*37)%100/100-0.5)*1.4*r;
        ctx.fillStyle=BLU; ctx.beginPath(); ctx.arc(X, midY+yoff, 3, 0, 7); ctx.fill(); });
      var Pn=pres(5), Pw=pres(1.5);
      E.tapHint(W/2, H*0.92, '빠른 곳(주황)일수록 압력이 낮아집니다', true);
      E.big('베르누이: 빠른 흐름 = 낮은 압력  (좁은 곳 P='+Math.round(Pn)+' < 넓은 곳 '+Math.round(Pw)+')', '종이 두 장을 들고 사이에 입김을 불면, 벌어질 것 같지만 오히려 서로 달라붙습니다 — 놀랍죠? 직관과 정반대지만, 유체는 <b>빨리 흐르는 곳에서 압력이 낮아집니다</b>. 왜냐고요? 에너지는 보존되니까요. 흐름이 빨라지면 운동에너지(½ρv²)가 커지고, 그 대가로 압력이 줄어듭니다 — 그게 P + ½ρv² = 일정(베르누이). 비행기 날개 윗면으로 공기가 더 빨리 지나가 위쪽 압력이 낮아지면, 아래 높은 압력이 날개를 밀어 올립니다 — 그게 양력입니다. 샤워 커튼이 안으로 빨려드는 것도, 야구공이 휘는 것도 같은 원리죠. 좁은 곳(주황)을 더 좁혀 보세요 — 압력이 더 떨어집니다.'); }
  },

  // ─── 심화: 파스칼 원리(유압잭) ───
  { id:'phys9_01_pascal', branchOf:'phys9_01', ord:1,
    enter:function(E){ var self=this; this.s={ratio:4,F1:50};
      E.controls('<div class="ctrl"><label>면적비 A₂/A₁</label><input type="range" id="rt" min="1" max="10" step="1" value="4"><output id="rto">4</output>'
        +'<label style="margin-left:14px">가한 힘 F₁ (N)</label><input type="range" id="ff" min="20" max="100" step="10" value="50"><output id="ffo">50</output></div>');
      E.bind('#rt','input',function(e){ self.s.ratio=+e.target.value; document.getElementById('rto').textContent=e.target.value; E.blip(360,0.07); });
      E.bind('#ff','input',function(e){ self.s.F1=+e.target.value; document.getElementById('ffo').textContent=e.target.value; E.blip(380,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var F2=s.F1*s.ratio, P=s.F1;   // 압력 동일(면적1=1)
      var baseY=H*0.62, w1=40, w2=40*Math.sqrt(s.ratio);
      // U자 유압관
      var lx=W*0.28, rx=W*0.60;
      ctx.fillStyle=WAT; ctx.fillRect(lx-w1/2,baseY-10,w1,H*0.18); ctx.fillRect(rx-w2/2,baseY-10,w2,H*0.18); ctx.fillRect(lx,baseY+H*0.16,rx-lx,16);
      ctx.strokeStyle='rgba(122,184,255,0.5)'; ctx.lineWidth=2; ctx.strokeRect(lx-w1/2,baseY-10,w1,H*0.2);  ctx.strokeRect(rx-w2/2,baseY-10,w2,H*0.2);
      // 피스톤(작은쪽 눌림)
      ctx.fillStyle=DIM; ctx.fillRect(lx-w1/2,baseY-10,w1,8); ctx.fillRect(rx-w2/2,baseY-22,w2,8);
      // 힘 화살표
      function arr(x,y,len,col,lab){ ctx.strokeStyle=col; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x,y+len); ctx.stroke(); ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(x,y+len); ctx.lineTo(x-5,y+len-10); ctx.lineTo(x+5,y+len-10); ctx.fill(); ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText(lab,x,y-6); }
      arr(lx, baseY-60, Math.min(48,s.F1*0.5), PNK, 'F₁='+s.F1+'N');
      arr(rx, baseY-72, -Math.min(60,F2*0.12), GRN, 'F₂='+F2+'N');   // 위로(들어올림)
      E.tapHint(W/2, H*0.90, '면적비를 키우면 작은 힘이 큰 힘으로', true);
      E.big('파스칼 유압: F₂ = F₁·(A₂/A₁) = '+s.F1+'×'+s.ratio+' = '+F2+' N', '한 손으로 자동차를 들 수 있을까요? 유압잭이 있으면 가능합니다. 비밀은 갇힌 액체입니다 — 갇힌 유체를 누르면 그 <b>압력이 구석구석 똑같이 전달</b>됩니다(파스칼 원리). 작은 피스톤을 살짝 누르면 압력 P=F₁/A₁이 생기고, 이 압력이 넓은 피스톤 전체에 걸리면 면적이 큰 만큼 힘이 불어납니다: <b>F₂ = P·A₂ = F₁·(A₂/A₁)</b>. 면적비만큼 힘이 증폭되는 거죠! 공짜는 아닙니다 — 큰 피스톤은 그만큼 조금밖에 안 올라갑니다(일은 보존, 지렛대와 같음). 자동차 브레이크·굴착기·프레스가 다 이 원리입니다.'); }
  },

  // ─── 심화: 모세관 현상(표면장력) ───
  { id:'phys9_02_capillary', branchOf:'phys9_02', ord:1,
    enter:function(E){ var self=this; this.s={r:0.6};
      E.controls('<div class="ctrl"><label>관 반지름 r (mm)</label><input type="range" id="rr" min="0.2" max="2" step="0.1" value="0.6"><output id="rro">0.6</output></div>');
      E.bind('#rr','input',function(e){ self.s.r=+e.target.value; document.getElementById('rro').textContent=(+e.target.value).toFixed(1); E.blip(420-self.s.r*100,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, gam=0.073, rho=1000, g=9.8;
      var hmm = 2*gam/(rho*g*(s.r/1000))*1000;   // 상승 높이 h=2γ/(ρgr), mm
      var poolY=H*0.66, tubeW=s.r*40, tx=W*0.42;
      // 물웅덩이
      ctx.fillStyle=WAT; ctx.fillRect(W*0.16,poolY,W*0.6,H*0.18);
      ctx.strokeStyle='rgba(122,184,255,0.5)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(W*0.16,poolY); ctx.lineTo(W*0.76,poolY); ctx.stroke();
      // 가는 관 + 상승한 물기둥(h ∝ 1/r, 화면 스케일)
      var riseP = Math.min(H*0.42, hmm*1.2);
      ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.lineWidth=2; ctx.strokeRect(tx-tubeW/2, poolY-H*0.42, tubeW, H*0.42+H*0.16);
      ctx.fillStyle='rgba(122,184,255,0.4)'; ctx.fillRect(tx-tubeW/2+2, poolY-riseP, tubeW-4, riseP+H*0.16);
      // 메니스커스
      ctx.fillStyle=BLU; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('h='+hmm.toFixed(0)+' mm', tx+tubeW/2+8, poolY-riseP+4);
      E.tapHint(W/2, H*0.90, '관이 가늘수록 물이 더 높이 올라갑니다(h ∝ 1/r)', true);
      E.big('모세관 상승 h = 2γ/(ρgr) = '+hmm.toFixed(0)+' mm', '종이 타월 끝을 물에 살짝 대면 물이 위로 스멀스멀 기어 올라가죠 — 펌프도 없는데 말입니다. 물 분자는 유리벽에 들러붙기를 좋아하고(부착력), 그러면서 표면을 끌어올립니다. 물기둥의 무게가 그 끌어올리는 힘과 딱 균형 잡힐 때까지 올라가죠: <b>h = 2γ/(ρgr)</b>. 관이 가늘수록(r가 작을수록) 더 높이 올라갑니다 — 무게는 줄고 끌어올리는 가장자리 효과는 상대적으로 커지니까요. 나무가 펌프 없이 꼭대기 잎까지 물을 보내는 것, 촛불 심지가 기름을 빨아올리는 것이 다 이 현상입니다. γ는 표면장력(물은 0.073 N/m).'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
