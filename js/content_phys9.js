/* 물리학 제9장 유체 — 압력 P=F/A, 깊이압력 P=ρgh, 부력(PhysLab 엔진 시뮬), 연속방정식, 베르누이
   부력 장면은 PhysLab에 '잠긴 부피만큼 위로 미는' 부력 힘을 더해 실시간 적분 — 진짜 엔진 시뮬.
   나머지(압력·유속·베르누이)는 유체식에서 실시간 계산.
   골든룰: 표시 수치는 전부 현재 상태/유체식에서 계산.
   텍스트=content/phys9.json. 엔진=js/physlab.js, js/engine.js 공유. */
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
      E.tapHint(W/2, H*0.90, 'A/D로 접촉 면적 — 좁으면 깊이 박힘', true);
      E.big('압력 P = F/A = '+Math.round(P)+' Pa', '같은 힘이라도 좁은 면적에 작용하면 압력이 커집니다(P=F/A). 압정·칼날·하이힐이 작은 면적으로 큰 압력을 내고, 눈신발·낙타 발은 넓은 면적으로 압력을 낮춰 안 빠집니다. 면적을 줄이면 자국이 깊어지는 것을 보세요. 1 Pa = 1 N/m².'); }
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
      E.tapHint(W/2, H*0.90, 'A/D로 액체 밀도 — 깊을수록 세게 분출', true);
      E.big('P = ρgh — 바닥 압력 '+(Pbot/1000).toFixed(1)+' kPa', '유체 속 압력은 <b>깊이에 비례</b>해 커집니다: P = ρgh(+대기압). 깊은 구멍일수록 물이 더 세게(멀리) 뿜어 나옵니다(분출속도 v=√(2gh)). 댐이 아래쪽을 두껍게 짓는 이유, 잠수할수록 귀가 아픈 이유. 압력은 깊이에만 의존하고 그릇 모양과는 무관(파스칼의 역설).'); }
  },

  // ══════════ 9.3 부력 — 아르키메데스(PhysLab 엔진 시뮬) ══════════
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
      E.tapHint(W/2, H*0.93, '블록을 끌어 눌러 보기 · A/D로 밀도', true);
      E.big('부력 = 밀어낸 물의 무게  ('+state+', 잠김 '+frac+'%)', '아르키메데스: 유체에 잠긴 물체는 <b>밀어낸 유체의 무게만큼</b> 위로 부력을 받습니다(F=ρ_유체·g·V_잠김). 밀도가 물보다 작으면(d<1) 일부만 잠긴 채 떠서 평형 — 잠긴 비율 = 물체밀도/유체밀도. 빙산이 90% 잠기는 이유(얼음 0.9), 쇠는 가라앉지만 배는 뜨는 이유(속이 비어 평균밀도↓). 엔진이 부력을 매 프레임 적분합니다.'); }
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
      E.tapHint(W/2, H*0.90, 'A/D로 좁은 곳 단면적 — 좁을수록 빠르게', true);
      E.big('연속방정식 A₁v₁ = A₂v₂  →  v₂ = '+v2.toFixed(2), '비압축 유체는 좁은 곳에서 빨라집니다 — 단위시간당 지나는 부피(유량 A·v)가 일정해야 하니까요. 호스 끝을 손가락으로 좁히면 물이 빠르게 멀리 나가는 것, 강이 좁아지면 급류가 되는 것이 연속방정식. A가 작아진 만큼 v가 커집니다(A·v=일정).'); }
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
      E.tapHint(W/2, H*0.92, 'A/D로 좁은 곳 — 빠른 곳(주황) 압력↓', true);
      E.big('베르누이: 빠른 흐름 = 낮은 압력  (좁은 곳 P='+Math.round(Pn)+' < 넓은 곳 '+Math.round(Pw)+')', '베르누이 정리: P + ½ρv² = 일정. 유체가 빨라지면(좁은 곳) 압력이 <b>낮아집니다</b>(게이지 기둥이 낮음). 비행기 날개 윗면의 빠른 공기가 낮은 압력→양력, 샤워커튼이 안으로 빨려드는 것, 야구공의 커브가 모두 베르누이. 에너지 보존을 유체로 옮긴 것 — 운동E(½ρv²)가 커지면 압력E가 줄어듭니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
