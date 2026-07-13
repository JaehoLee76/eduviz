/* 물리학 「상대성이론 — 시공간의 기하학」 — 로렌츠 변환·불변간격·슈바르츠실트 곡률·측지선 세차·프리드만 우주.
   특수상대성(26장)·일반상대성과 우주론(27장)에서 정성적으로 본 그림을, 이번엔 실제 수식을 직접 계산해 다시 본다.
   골든룰: γ·Δs²·r_s·dτ/dt·세차각·a(t)는 전부 슬라이더 값에서 실시간 계산(RK4 궤도·프리드만 수치적분 실행, 닫힌공식 베끼기 아님).
   동작=이 파일, 텍스트=content/phys30.json. */
(function(){
  var GRN='#5fd6a8', BLU='#7ab8ff', ORA='#ffb27a', PNK='#f4a0c0', DIM='#9b99a3', YLW='#e3d26f', PUR='#c792ea', RED='#ff7a6b', CYA='#58d6ff';

  // ---- 민코프스키 다이어그램 공용 좌표계(30.1·30.2 공유) ----
  // px(x,ct): 시공간 좌표(단위=광초·광초×c) → 화면 픽셀. ray: 한 점을 지나는 방향(dx,dct) 직선을 화면 폭만큼 그림.
  // rows: 아래에 쌓일 텍스트 줄 수 — 캔버스 높이가 작아도(모바일·좁은 창) 다이어그램이 텍스트를 침범하지 않도록 가용 높이를 역산해 배정.
  function minkSetup(E,rows){ var W=E.W,H=E.H,ctx=E.ctx; rows=rows||3;
    var gap=Math.max(18,H*0.075), textH=rows*gap+16, topPad=Math.max(22,H*0.055);
    var availH=Math.max(70,H-textH-topPad);
    var cx=W*0.5, cy=topPad+availH*0.52, HALF=4.6, S=Math.min(W*0.40, availH*0.47)/HALF;
    function px(x,ct){ return [cx+x*S, cy-ct*S]; }
    function seg(x1,y1,x2,y2,col,w,dash){ ctx.save(); ctx.strokeStyle=col; ctx.lineWidth=w||1; if(dash)ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); ctx.restore(); }
    function ray(x0,ct0,dx,dct,col,w,dash){ var L=10, p1=px(x0-dx*L,ct0-dct*L), p2=px(x0+dx*L,ct0+dct*L); seg(p1[0],p1[1],p2[0],p2[1],col,w,dash); }
    function axisLabel(dx,dct,lab,col){ var norm=Math.hypot(dx,dct)||1, ux=dx/norm*4.15, uct=dct/norm*4.15, p=px(ux,uct);
      ctx.fillStyle=col; ctx.font='13px ui-monospace,monospace'; ctx.textAlign='left'; ctx.fillText(lab,p[0]+6,p[1]); }
    function drawGrid(beta,g){
      for(var n=-4;n<=4;n++){ ray(n,0,0,1,'rgba(255,255,255,0.07)',1); ray(0,n,1,0,'rgba(255,255,255,0.07)',1); }
      ray(0,0,1,1,YLW,1.8,[7,5]); ray(0,0,1,-1,YLW,1.8,[7,5]);   // 빛원뿔 ct=±x
      ray(0,0,1,0,BLU,2.2); ray(0,0,0,1,BLU,2.2);                 // 정지 관찰자 축
      if(Math.abs(beta)>0.004){ for(var n2=-5;n2<=5;n2++){ if(!n2) continue;   // 이동 관찰자의 프라임 격자
        ray(g*beta*n2, g*n2, 1, beta, 'rgba(95,214,168,0.30)',1);   // t′=n2 선(방향 (1,β))
        ray(g*n2, g*beta*n2, beta, 1, 'rgba(95,214,168,0.30)',1); } }   // x′=n2 선(방향 (β,1))
      ray(0,0,beta,1,GRN,2.6); ray(0,0,1,beta,GRN,2.6);            // 프라임 축 ct′(방향 β,1)·x′(방향 1,β)
      axisLabel(0,1,'ct',BLU); axisLabel(1,0,'x',BLU); axisLabel(beta,1,"ct′",GRN); axisLabel(1,beta,"x′",GRN);
    }
    // 텍스트 줄의 y좌표들(위→아래, 캔버스 하단에 고정 간격으로 정렬 — H가 작아도 겹치지 않음)
    function textY(i){ return H-12-(rows-1-i)*gap; }
    return {px:px,ray:ray,seg:seg,drawGrid:drawGrid,textY:textY,cx:cx,cy:cy,S:S};
  }
  // 캔버스 하단에 고정 간격으로 텍스트 줄을 쌓는 공용 헬퍼(30.3·30.4·30.5) — H가 작아도 줄끼리 겹치지 않도록 최소 간격 보장
  function rowY(H,rows,i){ var gap=Math.max(18,H*0.075); return H-12-(rows-1-i)*gap; }
  // 불변 쌍곡선 (ct)²−x² = ±m² (m=1,2,3) — 어떤 β에서도 절대 움직이지 않는다
  function drawHyperbolas(M,ctx){
    [1,2,3].forEach(function(m){
      ctx.lineWidth=1.3; ctx.strokeStyle='rgba(255,178,122,0.55)';   // 시간꼴 Δs²=+m²
      [1,-1].forEach(function(sg){ ctx.beginPath(); var first=true;
        for(var x=-4.4;x<=4.4;x+=0.06){ var t=sg*Math.sqrt(x*x+m*m); var p=M.px(x,t); if(first){ctx.moveTo(p[0],p[1]);first=false;} else ctx.lineTo(p[0],p[1]); } ctx.stroke(); });
      ctx.strokeStyle='rgba(88,214,255,0.5)';   // 공간꼴 Δs²=−m²
      [1,-1].forEach(function(sg){ ctx.beginPath(); var first2=true;
        for(var t2=-4.4;t2<=4.4;t2+=0.06){ var x2=sg*Math.sqrt(t2*t2+m*m); var p2=M.px(x2,t2); if(first2){ctx.moveTo(p2[0],p2[1]);first2=false;} else ctx.lineTo(p2[0],p2[1]); } ctx.stroke(); });
    });
  }

  var scenes=[

  // ══════════ 30.1 시공간 다이어그램과 로렌츠 부스트 ══════════
  { id:'phys30_01',
    enter:function(E){ var self=this; this.s={beta:0.5};
      E.controls('<div class="ctrl"><label>관찰자 속도 β = v/c</label><input type="range" id="bt" min="-0.95" max="0.95" step="0.01" value="0.5"><output id="bto">0.50</output></div>');
      E.bind('#bt','input',function(e){ self.s.beta=+e.target.value; document.getElementById('bto').textContent=(+e.target.value).toFixed(2); E.blip(300+Math.abs(self.s.beta)*300,0.06); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var beta=s.beta, g=1/Math.sqrt(1-beta*beta);
      var M=minkSetup(E,3); M.drawGrid(beta,g);
      ctx.textAlign='center'; ctx.font='600 14px ui-monospace,monospace'; ctx.fillStyle='#dfeefb';
      ctx.fillText('γ = 1/√(1−β²) = '+g.toFixed(4), W/2, M.textY(0));
      ctx.font='12px ui-monospace,monospace'; ctx.fillStyle=DIM;
      ctx.fillText('시간 지연 1초→'+g.toFixed(3)+'초 · 길이 수축 1m→'+(1/g).toFixed(4)+'m', W/2, M.textY(1));
      ctx.font='11.5px sans-serif';
      ctx.fillText('β를 올리면 초록 축(ct′,x′)이 빛원뿔 쪽으로 가위처럼 접힙니다 — 시간·공간이 서로 섞이는 것', W/2, M.textY(2));
      E.tapHint(W/2, H*0.965, 'β=0이면 두 축이 겹치고, β→1이면 빛원뿔에 달라붙습니다', true);
      E.big('민코프스키 다이어그램 — 로렌츠 부스트', '시간과 공간은 관찰자마다 다른 그림자입니다.'); }
  },

  // ══════════ 30.2 불변 간격 Δs² ══════════
  { id:'phys30_02',
    enter:function(E){ var self=this; this.s={beta:0.5, bx:-0.8, bct:0.9};
      E.controls('<div class="ctrl"><label>β = v/c</label><input type="range" id="b2" min="-0.95" max="0.95" step="0.01" value="0.5"><output id="b2o">0.50</output>'
        +'<label style="margin-left:14px">사건 B의 x</label><input type="range" id="bx" min="-4" max="4" step="0.1" value="-0.8"><output id="bxo">-0.8</output>'
        +'<label style="margin-left:14px">사건 B의 ct</label><input type="range" id="bc" min="-4" max="4" step="0.1" value="0.9"><output id="bco">0.9</output></div>');
      E.bind('#b2','input',function(e){ self.s.beta=+e.target.value; document.getElementById('b2o').textContent=(+e.target.value).toFixed(2); E.blip(300,0.05); });
      E.bind('#bx','input',function(e){ self.s.bx=+e.target.value; document.getElementById('bxo').textContent=(+e.target.value).toFixed(1); E.blip(360,0.05); });
      E.bind('#bc','input',function(e){ self.s.bct=+e.target.value; document.getElementById('bco').textContent=(+e.target.value).toFixed(1); E.blip(400,0.05); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var beta=s.beta, g=1/Math.sqrt(1-beta*beta);
      var M=minkSetup(E,4); M.drawGrid(beta,g); drawHyperbolas(M,ctx);
      var A={x:1.4,ct:2.4}, B={x:s.bx,ct:s.bct};
      function toPrime(e){ return {x:g*(e.x-beta*e.ct), ct:g*(e.ct-beta*e.x)}; }
      var Ap=toPrime(A), Bp=toPrime(B);
      function dot(e,col,lab){ var p=M.px(e.x,e.ct); ctx.fillStyle=col; ctx.beginPath(); ctx.arc(p[0],p[1],7,0,7); ctx.fill();
        ctx.fillStyle='#10141a'; ctx.font='bold 10px sans-serif'; ctx.textAlign='center'; ctx.fillText(lab,p[0],p[1]+3.5); }
      var pa=M.px(A.x,A.ct), pb=M.px(B.x,B.ct);
      ctx.strokeStyle='rgba(223,238,251,0.5)'; ctx.setLineDash([4,4]); ctx.lineWidth=1.2;
      ctx.beginPath(); ctx.moveTo(pa[0],pa[1]); ctx.lineTo(pb[0],pb[1]); ctx.stroke(); ctx.setLineDash([]);
      dot(A,CYA,'A'); dot(B,RED,'B');
      var dT=A.ct-B.ct, dX=A.x-B.x, dTp=Ap.ct-Bp.ct, dXp=Ap.x-Bp.x;
      var s2=dT*dT-dX*dX, s2p=dTp*dTp-dXp*dXp;
      ctx.textAlign='center'; ctx.font='600 12.5px ui-monospace,monospace';
      ctx.fillStyle='#dfeefb'; ctx.fillText('정지계 S:  cΔt = '+dT.toFixed(3)+'   Δx = '+dX.toFixed(3), W/2, M.textY(0));
      ctx.fillStyle=GRN; ctx.fillText('이동계 S′:  cΔt′ = '+dTp.toFixed(3)+'   Δx′ = '+dXp.toFixed(3), W/2, M.textY(1));
      ctx.fillStyle=YLW; ctx.font='700 13.5px ui-monospace,monospace';
      ctx.fillText('Δs² = (cΔt)²−Δx² = '+s2.toFixed(4)+'  =  '+s2p.toFixed(4)+'  (불변)', W/2, M.textY(2));
      ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
      ctx.fillText('좌표(cΔt, Δx)는 관찰자마다 다르지만, 결합량 Δs²는 완전히 같습니다', W/2, M.textY(3));
      E.tapHint(W/2, H*0.965, '사건 B를 옮기고 β를 바꿔도 Δs²는 항상 같습니다', true);
      E.big('불변 간격 Δs² — 좌표는 그림자, 결합량이 실체', '시간차·거리차는 달라도 결합량은 불변입니다.'); }
  },

  // ══════════ 30.3 중력 = 시공간의 휨 (슈바르츠실트) ══════════
  { id:'phys30_03',
    enter:function(E){ var self=this; this.s={M:10, rclk:3, yaw:0.65};
      E.controls('<div class="ctrl"><label>질량 M (태양질량)</label><input type="range" id="ms" min="1" max="40" step="0.5" value="10"><output id="mso">10.0</output>'
        +'<label style="margin-left:14px">시계 위치 r (r_s 배수)</label><input type="range" id="rc" min="1.02" max="20" step="0.02" value="3"><output id="rco">3.00</output></div>');
      E.bind('#ms','input',function(e){ self.s.M=+e.target.value; document.getElementById('mso').textContent=(+e.target.value).toFixed(1); E.blip(300+self.s.M*8,0.06); });
      E.bind('#rc','input',function(e){ self.s.rclk=+e.target.value; document.getElementById('rco').textContent=(+e.target.value).toFixed(2); E.blip(360,0.06); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      if(!E.frozen) s.yaw += 0.0028;   // 느린 자동 회전(일시정지 중엔 정지) — !E.frozen 게이트
      var textTop=rowY(H,3,0)-16;   // 텍스트 3줄이 시작되는 y — 다이어그램이 이보다 아래로 내려오지 않게 상단 여유를 역산
      var Rmax=16, scale=Math.min(W,H)*0.028;
      var rsWorld=1+s.M/9;   // 렌더용 세계단위 r_s(깔때기 형태를 질량에 비례해 시각적으로 조절). 물리적 r_s(km)는 아래 별도 계산
      function zfun(r){ var a=rsWorld; return r>a? 2*Math.sqrt(a*(r-a))-2*Math.sqrt(a*(Rmax-a)) : -2*Math.sqrt(a*(Rmax-a)); }
      var cx=W*0.46, cy=Math.min(H*0.34, textTop*0.56);
      function proj(x,y,z){ var X=x*Math.cos(s.yaw)-y*Math.sin(s.yaw), Y=x*Math.sin(s.yaw)+y*Math.cos(s.yaw);
        var per=760/(760+Y*13); return [cx+X*scale*per, cy+(Y*0.40-z*0.85)*scale*per]; }
      function dilColor(f){ var t=Math.max(0,Math.min(1,f)); var r=Math.round(255*(1-t)+88*t), g2=Math.round(91*(1-t)+214*t), b=Math.round(91*(1-t)+255*t); return 'rgb('+r+','+g2+','+b+')'; }
      var a=rsWorld, NR=20, NP=56, i,j;
      for(i=0;i<=NR;i++){ var r=a*1.001+(Rmax-a)*Math.pow(i/NR,1.6), z=zfun(r);
        var fdil=Math.sqrt(Math.max(0,1-a/r));
        ctx.strokeStyle=dilColor(fdil); ctx.lineWidth=i===0?2.2:1.1; ctx.globalAlpha=0.85; ctx.beginPath();
        for(j=0;j<=NP;j++){ var ph=j/NP*2*Math.PI, P=proj(r*Math.cos(ph),r*Math.sin(ph),z); j?ctx.lineTo(P[0],P[1]):ctx.moveTo(P[0],P[1]); } ctx.stroke(); }
      ctx.globalAlpha=0.35; ctx.strokeStyle='#6f7f95'; ctx.lineWidth=1;
      for(j=0;j<20;j++){ var ph2=j/20*2*Math.PI; ctx.beginPath();
        for(i=0;i<=26;i++){ var r2=a*1.001+(Rmax-a)*Math.pow(i/26,1.6); var P2=proj(r2*Math.cos(ph2),r2*Math.sin(ph2),zfun(r2)); i?ctx.lineTo(P2[0],P2[1]):ctx.moveTo(P2[0],P2[1]); } ctx.stroke(); }
      ctx.globalAlpha=1;
      ctx.fillStyle='rgba(0,0,0,0.85)'; ctx.strokeStyle=RED; ctx.lineWidth=1.6; ctx.beginPath();
      for(j=0;j<=NP;j++){ var ph3=j/NP*2*Math.PI, P3=proj(a*Math.cos(ph3),a*Math.sin(ph3),zfun(a)); j?ctx.lineTo(P3[0],P3[1]):ctx.moveTo(P3[0],P3[1]); } ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle=ORA; ctx.font='11px sans-serif'; ctx.textAlign='center'; var evP=proj(a,0,zfun(a)); ctx.fillText('사건지평선', evP[0], evP[1]+16);
      // 시계 위치(고리 위 표식) — 그림은 Rmax로 잘린 시야이므로 위치만 시야 안으로 클램프, 표시 수치는 실제 rclk로 계산
      var rTrue=s.rclk*a, rShow=Math.min(rTrue,Rmax*0.96), zC=zfun(rShow), dilC=Math.sqrt(Math.max(0,1-a/rTrue));
      var Pc=proj(rShow*Math.cos(0.7),rShow*Math.sin(0.7),zC);
      ctx.fillStyle=dilColor(dilC); ctx.beginPath(); ctx.arc(Pc[0],Pc[1],6,0,7); ctx.fill(); ctx.strokeStyle='#fff'; ctx.lineWidth=1.5; ctx.stroke();
      ctx.fillStyle='#dfeefb'; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('시계', Pc[0], Pc[1]-12);
      var rsKm=2.953*s.M;
      ctx.textAlign='center'; ctx.font='600 13px ui-monospace,monospace'; ctx.fillStyle='#dfeefb';
      ctx.fillText('r_s = 2GM/c² = '+rsKm.toFixed(1)+' km', W/2, rowY(H,3,0));
      ctx.font='12px ui-monospace,monospace'; ctx.fillStyle=dilColor(dilC);
      ctx.fillText('dτ/dt = √(1−r_s/r) = '+dilC.toFixed(4)+'  → 먼 곳보다 '+((1-dilC)*100).toFixed(1)+'% 느림', W/2, rowY(H,3,1));
      ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
      ctx.fillText('공간의 휨(깔때기): z(r) = 2√(r_s(r−r_s))  ·  고리 색 = 그 위치의 시간 흐름 속도', W/2, rowY(H,3,2));
      E.tapHint(W/2, H*0.965, '질량을 키우면 깔때기가 깊어지고 시계가 더 느려집니다', true);
      E.big('중력 = 시공간의 휨 — 슈바르츠실트 깔때기', '중력은 힘이 아니라 시공간, 특히 시간의 휨입니다.'); }
  },

  // ══════════ 30.4 측지선과 세차 (수성 근일점) ══════════
  { id:'phys30_04',
    enter:function(E){ var self=this; this.s={p:8, e:0.55};
      this.resetOrbit();
      E.controls('<div class="ctrl"><label>궤도 크기 p (r_s 배수)</label><input type="range" id="ps" min="4" max="20" step="0.5" value="8"><output id="pso">8.0</output>'
        +'<label style="margin-left:14px">이심률 e</label><input type="range" id="ec" min="0" max="0.8" step="0.05" value="0.55"><output id="eco">0.55</output></div>');
      E.bind('#ps','input',function(e){ self.s.p=+e.target.value; document.getElementById('pso').textContent=(+e.target.value).toFixed(1); self.resetOrbit(); E.blip(360,0.06); });
      E.bind('#ec','input',function(e){ self.s.e=+e.target.value; document.getElementById('eco').textContent=(+e.target.value).toFixed(2); self.resetOrbit(); E.blip(360,0.06); });
      E.setOn([]); },
    resetOrbit:function(){ var s=this.s; s.orb={u:(1+s.e)/s.p, du:0, phi:0, trail:[]}; },
    tap:function(E){ this.resetOrbit(); E.blip(360,0.12); },
    // 측지선(적도면): d²u/dφ²+u = 1/p + (3/2)r_s·u²  (u=1/r, 정규화 단위 r_s=1) — RK4 적분
    orbStep:function(n,dphi){ var s=this.s, orb=s.orb, rs=1;
      function f(u,du){ return [du, 1/s.p + 1.5*rs*u*u - u]; }
      for(var i=0;i<n;i++){
        var u=orb.u, du=orb.du;
        var k1=f(u,du), k2=f(u+dphi/2*k1[0],du+dphi/2*k1[1]), k3=f(u+dphi/2*k2[0],du+dphi/2*k2[1]), k4=f(u+dphi*k3[0],du+dphi*k3[1]);
        orb.u += dphi/6*(k1[0]+2*k2[0]+2*k3[0]+k4[0]);
        orb.du += dphi/6*(k1[1]+2*k2[1]+2*k3[1]+k4[1]);
        orb.phi += dphi;
        var r=1/orb.u;
        if(r<rs*1.05 || r>60 || !isFinite(r)){ this.resetOrbit(); return; }
        orb.trail.push([orb.phi,r]); if(orb.trail.length>1200) orb.trail.shift();
      } },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      if(!E.frozen) this.orbStep(3,0.03);
      var textTop=rowY(H,3,0)-16;
      var cx=W*0.5, cy=textTop*0.46;
      var availR=Math.min(W*0.42, textTop*0.44);   // 화면에 확보된 반지름(px)
      var rMaxView=Math.max(4, s.p/(1-Math.min(s.e,0.95)))*1.12;   // 현재 p,e의 대략적 원일점 반경(r_s단위) — 궤도가 항상 화면에 맞도록 자동 축척
      var scale=availR/rMaxView;
      function P(phi,r){ return [cx+r*Math.cos(phi)*scale, cy+r*Math.sin(phi)*scale]; }
      ctx.fillStyle='#000'; ctx.strokeStyle=RED; ctx.lineWidth=1.6; ctx.beginPath(); ctx.arc(cx,cy,scale,0,7); ctx.fill(); ctx.stroke();
      ctx.strokeStyle=PUR; ctx.lineWidth=1.6; ctx.beginPath();
      var tr=s.orb.trail, i;
      for(i=0;i<tr.length;i++){ var pp=P(tr[i][0],tr[i][1]); i?ctx.lineTo(pp[0],pp[1]):ctx.moveTo(pp[0],pp[1]); } ctx.stroke();
      if(tr.length){ var cur=P(s.orb.phi,1/s.orb.u); ctx.fillStyle=PUR; ctx.beginPath(); ctx.arc(cur[0],cur[1],5,0,7); ctx.fill(); }
      var prec=3*Math.PI/s.p;   // Δφ = 3π·r_s/p (r_s=1 정규화)
      ctx.textAlign='center'; ctx.font='600 12.5px ui-monospace,monospace'; ctx.fillStyle='#dfeefb';
      ctx.fillText('측지선: d²u/dφ² + u = 1/p + (3/2)r_s·u²  (u=1/r, r_s=1)', W/2, rowY(H,3,0));
      ctx.font='700 13.5px ui-monospace,monospace'; ctx.fillStyle=ORA;
      ctx.fillText('세차량 Δφ = 3π·r_s/p = '+prec.toFixed(4)+' rad = '+(prec*180/Math.PI).toFixed(2)+'°/공전', W/2, rowY(H,3,1));
      ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
      ctx.fillText('뉴턴 중력이면 타원이 닫히지만, u² 항(순수 상대론 효과) 때문에 타원 자체가 회전합니다', W/2, rowY(H,3,2));
      E.tapHint(W/2, H*0.965, '화면 탭 = 궤도 리셋 · p를 줄일수록(가까울수록) 세차가 커집니다', true);
      E.big('측지선과 세차 — 수성 근일점 이동의 원리', '휘어진 시공간에서는 타원 궤도 자체가 돕니다.'); }
  },

  // ══════════ 30.5 우주의 시작 — 프리드만과 빅바운스 ══════════
  { id:'phys30_05',
    enter:function(E){ var self=this; this.s={om:0.315, ol:0.685, lqc:false};
      E.controls('<div class="ctrl"><label>물질 Ω_m</label><input type="range" id="om" min="0" max="2.5" step="0.005" value="0.315"><output id="omo">0.315</output>'
        +'<label style="margin-left:14px">암흑에너지 Ω_Λ</label><input type="range" id="ol" min="-0.6" max="1.6" step="0.005" value="0.685"><output id="olo">0.685</output></div>'
        +'<div class="ctrl" style="margin-top:4px"><label style="display:flex;align-items:center;gap:8px;cursor:pointer;width:auto"><input type="checkbox" id="lq"> 루프양자우주론 보정 (1−ρ/ρ_c) — 빅뱅을 빅바운스로</label></div>');
      E.bind('#om','input',function(e){ self.s.om=+e.target.value; document.getElementById('omo').textContent=(+e.target.value).toFixed(3); E.blip(320,0.05); });
      E.bind('#ol','input',function(e){ self.s.ol=+e.target.value; document.getElementById('olo').textContent=(+e.target.value).toFixed(3); E.blip(360,0.05); });
      E.bind('#lq','change',function(e){ self.s.lqc=!!e.target.checked; E.blip(self.s.lqc?520:280,0.08); });
      E.setOn([]); },
    // 프리드만 방정식 (ȧ/a)² = H₀²(Ω_m/a³+Ω_r/a⁴+Ω_k/a²+Ω_Λ)·[lqc 시 (1−ρ/ρ_c)] 를 과거·미래로 수치적분
    solve:function(){
      var s=this.s, Om=s.om, OL=s.ol, Or=8.6e-5, H0=67.4, TH=977.8/H0, Ec=2.5;   // Ec(ρ_c)는 대표값 2.5로 고정 — Ω_m·Ω_Λ만 슬라이더
      var Ok=1-Om-OL-Or;
      function E2(a){ return Om/(a*a*a) + Or/(a*a*a*a) + Ok/(a*a) + OL; }
      function run(dir){ var a=1,t=0,sgn=1,pts=[[0,1]],bb=null,bounce=null;
        var h=0.012*TH*dir;
        for(var i=0;i<26000;i++){
          var e=E2(a), f=s.lqc? e*(1-e/Ec) : e;
          if(f<=0){ if(s.lqc && e/Ec>=1) bounce=t; sgn=-sgn; a*=(1+1e-6*sgn*dir); f=Math.abs(f)+1e-12; }
          var dadt=sgn*a*Math.sqrt(Math.max(f,0))/TH;
          a+=dadt*h; t+=h;
          if(a<=1.5e-3){ bb=t; pts.push([t,0]); break; }
          if(a>3.8 || t>52 || t<-24){ pts.push([t,Math.min(a,3.9)]); break; }
          if(i%6===0) pts.push([t,a]);
        }
        return {pts:pts,bb:bb,bounce:bounce};
      }
      return {past:run(-1), fut:run(1), Ok:Ok};
    },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var sol=this.solve();
      var padL=W*0.09, padR=W*0.04, padT=Math.max(46,H*0.24), padB=Math.max(46,H*0.22);
      var Tmin=-22,Tmax=50,Amax=3.6;
      function X(t){ return padL+(t-Tmin)/(Tmax-Tmin)*(W-padL-padR); }
      function Y(a){ return (H-padB)-(a/Amax)*(H-padT-padB); }
      ctx.strokeStyle='rgba(255,255,255,0.10)'; ctx.fillStyle=DIM; ctx.font='11px ui-monospace,monospace'; ctx.textAlign='center';
      var t,a;
      for(t=-20;t<=50;t+=10){ ctx.beginPath(); ctx.moveTo(X(t),padT); ctx.lineTo(X(t),H-padB); ctx.stroke(); ctx.fillText(''+t, X(t), H-padB+16); }
      ctx.textAlign='right';
      for(a=0;a<=3.5;a+=0.5){ ctx.beginPath(); ctx.moveTo(padL,Y(a)); ctx.lineTo(W-padR,Y(a)); ctx.stroke(); ctx.fillText(a.toFixed(1), padL-8, Y(a)+4); }
      ctx.textAlign='center'; ctx.fillText('시간 (Gyr, 0=현재)', (padL+W-padR)/2, H-padB+34);
      ctx.save(); ctx.translate(padL-46,(padT+H-padB)/2); ctx.rotate(-Math.PI/2); ctx.fillText('척도인자 a', 0,0); ctx.restore();
      ctx.strokeStyle=YLW; ctx.setLineDash([4,4]); ctx.beginPath(); ctx.moveTo(X(0),padT); ctx.lineTo(X(0),H-padB); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=YLW; ctx.textAlign='left'; ctx.fillText('현재', X(0)+4, padT+12);
      var all=sol.past.pts.slice(1).reverse().concat(sol.fut.pts);
      ctx.strokeStyle=BLU; ctx.lineWidth=2.2; ctx.beginPath(); var started=false;
      all.forEach(function(pt){ var tt=pt[0], aa=pt[1]; if(tt<Tmin-1||tt>Tmax+1){ started=false; return; }
        var x=X(tt), y=Y(Math.min(aa,Amax*1.05)); if(started) ctx.lineTo(x,y); else { ctx.moveTo(x,y); started=true; } });
      ctx.stroke();
      var ageTxt='—', fateTxt='';
      if(sol.past.bounce!=null){ var tb=sol.past.bounce; ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(X(tb),Y(0.06),6,0,7); ctx.fill();
        ctx.textAlign='left'; ctx.fillText('빅바운스(특이점 없음)', X(tb)+8, Y(0.18)); ageTxt='바운스 후 '+(-tb).toFixed(1)+' Gyr'; }
      else if(sol.past.bb!=null){ ctx.fillStyle=YLW; ctx.beginPath(); ctx.arc(X(sol.past.bb),Y(0),6,0,7); ctx.fill();
        ctx.textAlign='left'; ctx.fillText('빅뱅(a→0, 시공간의 시작)', X(sol.past.bb)+8, Y(0)-10); ageTxt=(-sol.past.bb).toFixed(2)+' Gyr'; }
      var lastFut=sol.fut.pts[sol.fut.pts.length-1];
      if(sol.fut.bb!=null || lastFut[1]<0.5) fateTxt='재수축 → 빅크런치';
      else fateTxt = (s.ol>0? '가속 팽창(영원히)' : '감속 팽창 지속');
      ctx.textAlign='center'; ctx.font='600 12.5px ui-monospace,monospace'; ctx.fillStyle='#dfeefb';
      ctx.fillText('(ȧ/a)² = H₀²(Ω_m/a³+Ω_r/a⁴+Ω_k/a²+Ω_Λ)'+(s.lqc?'·(1−ρ/ρ_c)':''), W/2, 16);
      ctx.font='11.5px ui-monospace,monospace'; ctx.fillStyle=DIM;
      ctx.fillText('Ω_k = 1−ΣΩ = '+sol.Ok.toFixed(3)+' ('+(Math.abs(sol.Ok)<0.01?'평평':sol.Ok<0?'닫힘':'열림')+')   우주 나이: '+ageTxt+'   운명: '+fateTxt, W/2, 36);
      E.tapHint(W/2, H*0.965, 'Ω_Λ를 낮추면 팽창이 느려지고, 체크박스를 켜면 특이점이 사라집니다', true);
      E.big('우주의 시작 — 프리드만 방정식과 빅바운스', '시공간이 한 몸이므로 우주의 시작에서 시간·공간이 함께 시작합니다.'); }
  }

  ];
  if(window.Engine&&Engine.addScenes) Engine.addScenes(scenes);
})();
