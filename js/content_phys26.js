/* 물리학 「정적 평형과 탄성」 — 멈춰 있는 물체에 작용하는 힘들의 균형. 다리·건물·뼈대가 안 무너지는 이유.
   평형 두 조건(ΣF=0, Στ=0)·무게중심·들보 반력·사다리·탄성(영률). 회전(앞)의 토크를 정지 구조에 적용.
   골든룰: 토크 균형·반력·필요 마찰·ΔL=FL/AY 모두 식에서 실시간 계산.
   동작=이 파일, 텍스트=content/phys26.json. */
(function(){
  var GRN='#5fd6a8', BLU='#7ab8ff', ORA='#ffb27a', PNK='#f4a0c0', DIM='#9b99a3', RED='#ff7a6b';
  function arrow(E,x1,y1,x2,y2,col,lw){ var ctx=E.ctx; ctx.strokeStyle=col; ctx.lineWidth=lw||2;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    if(Math.hypot(x2-x1,y2-y1)<3) return; var a=Math.atan2(y2-y1,x2-x1); ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(x2,y2);
    ctx.lineTo(x2-9*Math.cos(a-0.4),y2-9*Math.sin(a-0.4)); ctx.lineTo(x2-9*Math.cos(a+0.4),y2-9*Math.sin(a+0.4)); ctx.fill(); }

  var scenes=[

  // ══════════ 1. 평형의 두 조건 — ΣF=0 그리고 Στ=0 ══════════
  { id:'phys26_01',
    enter:function(E){ var self=this; this.s={W1:3,d1:3,W2:2,d2:3};
      E.controls('<div class="ctrl"><label>오른쪽 추 무게 W₂</label><input type="range" id="ww" min="1" max="5" step="0.5" value="2"><output id="wwo">2.0</output>'
        +'<label style="margin-left:14px">오른쪽 거리 d₂</label><input type="range" id="dd" min="1" max="5" step="0.5" value="3"><output id="ddo">3.0</output></div>');
      E.bind('#ww','input',function(e){ self.s.W2=+e.target.value; document.getElementById('wwo').textContent=(+e.target.value).toFixed(1); E.blip(360,0.06); });
      E.bind('#dd','input',function(e){ self.s.d2=+e.target.value; document.getElementById('ddo').textContent=(+e.target.value).toFixed(1); E.blip(340,0.06); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var t1=s.W1*s.d1, t2=s.W2*s.d2, net=t2-t1;   // 토크: 왼쪽 CCW, 오른쪽 CW. Στ=0이면 균형 (골든룰)
      var bal=Math.abs(net)<0.05, tilt=Math.max(-0.3,Math.min(0.3,net*0.04));
      var cx=W*0.42, cy=H*0.44, sc=W*0.06;
      // 받침대(삼각형 피벗)
      ctx.fillStyle=DIM; ctx.beginPath(); ctx.moveTo(cx,cy+6); ctx.lineTo(cx-16,cy+40); ctx.lineTo(cx+16,cy+40); ctx.fill();
      // 막대(기울기 tilt)
      ctx.save(); ctx.translate(cx,cy); ctx.rotate(tilt);
      ctx.strokeStyle=ORA; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(-s.d1*sc-20,0); ctx.lineTo(W*0.3,0); ctx.stroke();
      // 왼쪽 추
      ctx.fillStyle=BLU; ctx.fillRect(-s.d1*sc-12, 2, 24, s.W1*8); ctx.fillStyle='#fff'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('W₁='+s.W1, -s.d1*sc, s.W1*8+14);
      arrow(E,-s.d1*sc,2,-s.d1*sc,2+s.W1*10,BLU,2);
      // 오른쪽 추
      ctx.fillStyle=PNK; ctx.fillRect(s.d2*sc-12, 2, 24, s.W2*8); ctx.fillStyle='#fff'; ctx.fillText('W₂='+s.W2, s.d2*sc, s.W2*8+14);
      arrow(E,s.d2*sc,2,s.d2*sc,2+s.W2*10,PNK,2);
      ctx.restore();
      // 수치
      ctx.fillStyle=BLU; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('왼쪽 토크 τ₁ = W₁·d₁ = '+t1.toFixed(1), W*0.06, H*0.78);
      ctx.fillStyle=PNK; ctx.fillText('오른쪽 토크 τ₂ = W₂·d₂ = '+t2.toFixed(1), W*0.06, H*0.85);
      ctx.fillStyle=bal?GRN:RED; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.fillText(bal?'★ 평형! ΣF=0 이고 Στ=0 (τ₁=τ₂)':'기울어짐 (Στ≠0 → '+(net>0?'오른쪽':'왼쪽')+'으로)', W/2, H*0.71);
      E.tapHint(W/2, H*0.93, '두 토크가 같아야(W₁d₁=W₂d₂) 막대가 균형을 이룹니다', true);
      E.big('정적 평형 — ΣF=0 그리고 Στ=0', '힘의 합도, 돌림힘의 합도 0이어야 멈춰 있습니다.'); }
  },

  // ══════════ 2. 무게중심 — 기울이면 언제 넘어질까 ══════════
  { id:'phys26_02',
    enter:function(E){ var self=this; this.s={lean:10};
      E.controls('<div class="ctrl"><label>기울기 각 (도)</label><input type="range" id="aa" min="0" max="45" step="1" value="10"><output id="aao">10</output></div>');
      E.bind('#aa','input',function(e){ self.s.lean=+e.target.value; document.getElementById('aao').textContent=e.target.value; E.blip(300+self.s.lean*4,0.06); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var bw=W*0.14, bh=H*0.34, th=s.lean*Math.PI/180;
      var floorY=H*0.74, pivotX=W*0.42, pivotY=floorY;   // 오른쪽 아래 모서리를 축으로 기울임
      // 무게중심이 받침면(밑변) 밖으로 나가면 넘어짐. CG 수평위치 vs 밑변 오른끝
      // 직육면체 CG는 중심. 회전축=오른아래모서리. CG의 수평위치 = pivot - (bw/2)cosθ + (bh/2)sinθ ... 기울일수록 오른쪽으로
      ctx.save(); ctx.translate(pivotX,pivotY); ctx.rotate(th);   // 오른아래 모서리 축, 오른쪽(시계방향)으로 기울임
      ctx.fillStyle='rgba(122,184,255,0.25)'; ctx.fillRect(-bw,-bh,bw,bh); ctx.strokeStyle=BLU; ctx.lineWidth=2; ctx.strokeRect(-bw,-bh,bw,bh);
      // 무게중심 점
      var cgx=-bw/2, cgy=-bh/2; ctx.fillStyle=ORA; ctx.beginPath(); ctx.arc(cgx,cgy,6,0,7); ctx.fill();
      ctx.restore();
      // CG의 절대 위치 (rotate(+th)) — 기울일수록 CG가 받침 모서리(pivot, 오른끝) 쪽으로 다가가 넘으면 전도
      var CGx=pivotX + (cgx*Math.cos(th) - cgy*Math.sin(th));
      var CGy=pivotY + (cgx*Math.sin(th) + cgy*Math.cos(th));
      // 무게(연직 아래) — CG에서
      arrow(E,CGx,CGy,CGx,floorY+10,ORA,2.5);
      ctx.fillStyle=ORA; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('무게중심', CGx, CGy-10);
      // 바닥
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(W*0.12,floorY); ctx.lineTo(W*0.72,floorY); ctx.stroke();
      // 받침면(밑변): 왼끝 ~ pivot
      var baseL = pivotX - bw; ctx.strokeStyle=GRN; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(baseL,floorY); ctx.lineTo(pivotX,floorY); ctx.stroke();
      ctx.fillStyle=GRN; ctx.font='13px sans-serif'; ctx.fillText('받침면', (baseL+pivotX)/2, floorY+18);
      // 판정: CG 수평선이 받침면(baseL~pivotX) 안이면 안정
      var stable = CGx>=baseL && CGx<=pivotX;
      ctx.fillStyle=stable?GRN:RED; ctx.font='600 15px sans-serif'; ctx.textAlign='center';
      ctx.fillText(stable?'✓ 안정 (무게중심이 받침면 위 → 되돌아옴)':'✗ 넘어짐! (무게중심이 받침면 밖)', W/2, H*0.84);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('무게중심에서 내린 연직선이 받침면 안에 있으면 안 넘어진다', W/2, H*0.90);
      E.tapHint(W/2, H*0.95, '기울이다 무게중심이 받침면 끝을 넘으면 넘어집니다(피사의 사탑)', true);
      E.big('무게중심 — 연직선이 받침면 안이면 안 넘어진다', '안정성은 무게중심과 받침면이 정합니다.'); }
  },

  // ══════════ 3. 들보의 받침 반력 — 어느 기둥이 더 받치나 ══════════
  { id:'phys26_03',
    enter:function(E){ var self=this; this.s={x:0.5,Wl:6};
      E.controls('<div class="ctrl"><label>하중 위치 (0=왼 ~ 1=오)</label><input type="range" id="xx" min="0.1" max="0.9" step="0.05" value="0.5"><output id="xxo">0.50</output>'
        +'<label style="margin-left:14px">하중 W</label><input type="range" id="ww" min="2" max="10" step="1" value="6"><output id="wwo">6</output></div>');
      E.bind('#xx','input',function(e){ self.s.x=+e.target.value; document.getElementById('xxo').textContent=(+e.target.value).toFixed(2); E.blip(360,0.06); });
      E.bind('#ww','input',function(e){ self.s.Wl=+e.target.value; document.getElementById('wwo').textContent=e.target.value; E.blip(340,0.06); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var R2=s.Wl*s.x, R1=s.Wl-R2;   // Στ(왼축): R2·L = W·x → R2=Wx/L, R1=W−R2 (골든룰)
      var bx0=W*0.16, bx1=W*0.80, by=H*0.42, L=bx1-bx0;
      // 들보
      ctx.strokeStyle=ORA; ctx.lineWidth=8; ctx.beginPath(); ctx.moveTo(bx0,by); ctx.lineTo(bx1,by); ctx.stroke();
      // 받침(양끝 삼각형)
      [bx0,bx1].forEach(function(x){ ctx.fillStyle=DIM; ctx.beginPath(); ctx.moveTo(x,by+5); ctx.lineTo(x-12,by+34); ctx.lineTo(x+12,by+34); ctx.fill(); });
      // 하중 위치
      var lx=bx0+s.x*L; arrow(E,lx,by-6-s.Wl*7,lx,by-6,RED,3); ctx.fillStyle=RED; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('하중 W='+s.Wl, lx, by-12-s.Wl*7);
      // 반력 화살표(위로)
      arrow(E,bx0,by+34,bx0,by+34-R1*7,GRN,3); ctx.fillStyle=GRN; ctx.fillText('R₁='+R1.toFixed(1), bx0, by+48);
      arrow(E,bx1,by+34,bx1,by+34-R2*7,GRN,3); ctx.fillText('R₂='+R2.toFixed(1), bx1, by+48);
      // 수치
      ctx.fillStyle='#dfeefb'; ctx.font='600 14px sans-serif'; ctx.textAlign='center';
      ctx.fillText('ΣF=0: R₁+R₂ = W = '+s.Wl+'   ·   Στ=0: R₂ = W·x/L', W/2, H*0.72);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('하중이 가까운 기둥이 더 많이 받친다 (R₁='+R1.toFixed(1)+', R₂='+R2.toFixed(1)+')', W/2, H*0.80);
      E.tapHint(W/2, H*0.92, '하중을 한쪽으로 옮기면 그쪽 기둥의 반력이 커집니다', true);
      E.big('들보 반력 — R₁+R₂=W, R₂=W·x/L', '두 평형 조건이 각 기둥의 부담을 정합니다.'); }
  },

  // ══════════ 4. 사다리 — 미끄러지지 않으려면 ══════════
  { id:'phys26_04',
    enter:function(E){ var self=this; this.s={ang:60,mu:0.4};
      E.controls('<div class="ctrl"><label>사다리 각도 (도)</label><input type="range" id="aa" min="30" max="80" step="2" value="60"><output id="aao">60</output>'
        +'<label style="margin-left:14px">바닥 마찰계수 μ</label><input type="range" id="mm" min="0.1" max="0.8" step="0.05" value="0.4"><output id="mmo">0.40</output></div>');
      E.bind('#aa','input',function(e){ self.s.ang=+e.target.value; document.getElementById('aao').textContent=e.target.value; E.blip(300+self.s.ang*4,0.06); });
      E.bind('#mm','input',function(e){ self.s.mu=+e.target.value; document.getElementById('mmo').textContent=(+e.target.value).toFixed(2); E.blip(360,0.06); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var th=s.ang*Math.PI/180, mg=1;
      // 평형: 벽 수직항력 Nw, 바닥 수직 Nf=mg, 필요 마찰 f=Nw=mg/(2 tanθ). 미끄럼 안 함 조건 f≤μNf (골든룰)
      var fReq=mg/(2*Math.tan(th)), fMax=s.mu*mg, safe=fReq<=fMax;
      var footX=W*0.30, floorY=H*0.74, Llen=Math.min(W*0.34,H*0.46);
      var topX=footX+Llen*Math.cos(th), topY=floorY-Llen*Math.sin(th);
      // 벽·바닥
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(W*0.14,floorY); ctx.lineTo(W*0.80,floorY); ctx.stroke();
      var wallX=topX; ctx.beginPath(); ctx.moveTo(wallX,floorY); ctx.lineTo(wallX,topY-20); ctx.stroke();
      // 사다리
      ctx.strokeStyle=safe?ORA:RED; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(footX,floorY); ctx.lineTo(topX,topY); ctx.stroke();
      // 무게(중앙)
      var mx=(footX+topX)/2, my=(floorY+topY)/2; arrow(E,mx,my,mx,my+40,ORA,2.5); ctx.fillStyle=ORA; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('무게 mg', mx+6, my+30);
      // 벽 반력(수평), 바닥 수직·마찰
      arrow(E,topX,topY,topX-30,topY,BLU,2); ctx.fillStyle=BLU; ctx.fillText('벽 Nw', topX-54, topY-4);
      arrow(E,footX,floorY,footX,floorY-40,GRN,2); ctx.fillStyle=GRN; ctx.fillText('바닥 Nf', footX-44, floorY-30);
      arrow(E,footX,floorY,footX+ (safe?30:30),floorY,safe?GRN:RED,2.5); ctx.fillStyle=safe?GRN:RED; ctx.fillText('마찰 f', footX+8, floorY+16);
      // 판정
      ctx.fillStyle=safe?GRN:RED; ctx.font='600 15px sans-serif'; ctx.textAlign='center';
      ctx.fillText(safe?'✓ 안 미끄러짐 (필요마찰 ≤ 최대마찰)':'✗ 미끄러진다! (필요마찰 > μ·mg)', W/2, H*0.84);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('필요 마찰 f=mg/(2tanθ)='+fReq.toFixed(2)+'  vs  최대 μ·mg='+fMax.toFixed(2)+'  (세울수록 안전)', W/2, H*0.90);
      E.tapHint(W/2, H*0.95, '사다리를 눕힐수록(각↓) 필요 마찰이 커져 미끄러집니다', true);
      E.big('사다리 정역학 — 필요 마찰 f = mg/(2 tanθ)', '세 힘의 균형이 미끄럼을 결정합니다.'); }
  },

  // ══════════ 5. 탄성 — 늘어남과 영률 (ΔL = FL/AY) ══════════
  { id:'phys26_05',
    enter:function(E){ var self=this; this.s={F:3};
      E.controls('<div class="ctrl"><label>잡아당기는 힘 F</label><input type="range" id="ff" min="0" max="10" step="0.5" value="3"><output id="ffo">3.0</output></div>');
      E.bind('#ff','input',function(e){ self.s.F=+e.target.value; document.getElementById('ffo').textContent=(+e.target.value).toFixed(1); E.blip(300+self.s.F*40,0.06); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, L0=H*0.34, A=1, Y=1.4;
      // ΔL = F·L₀/(A·Y). 탄성한계(F>7) 넘으면 소성·파단 (골든룰)
      var elastic=s.F<=7, dL=s.F*L0/(A*Y)/10*(elastic?1:1.6), strain=dL/L0, stress=s.F/A;
      var cx=W*0.26, topY=H*0.18;
      // 천장
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(cx-40,topY); ctx.lineTo(cx+40,topY); ctx.stroke();
      // 막대(늘어남)
      ctx.strokeStyle=elastic?ORA:RED; ctx.lineWidth=10; ctx.beginPath(); ctx.moveTo(cx,topY); ctx.lineTo(cx,topY+L0+dL); ctx.stroke();
      // 원래 길이 기준
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.setLineDash([4,4]); ctx.beginPath(); ctx.moveTo(cx+20,topY+L0); ctx.lineTo(cx+70,topY+L0); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('원래 길이 L₀', cx+24, topY+L0-4);
      // 당기는 힘
      arrow(E,cx,topY+L0+dL,cx,topY+L0+dL+40,RED,Math.max(2,s.F)); ctx.fillStyle=RED; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('F='+s.F.toFixed(1), cx, topY+L0+dL+58);
      // 응력-변형 곡선
      var gx0=W*0.56, gx1=W*0.92, gy0=H*0.70, gh=H*0.46;
      ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(gx0,gy0); ctx.lineTo(gx1,gy0); ctx.moveTo(gx0,gy0); ctx.lineTo(gx0,gy0-gh); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.fillText('응력 σ',gx0+3,gy0-gh+2); ctx.textAlign='right'; ctx.fillText('변형 ε →',gx1,gy0+14);
      // 탄성구간(직선, 기울기=Y) + 소성구간(꺾임)
      ctx.strokeStyle=GRN; ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(gx0,gy0); ctx.lineTo(gx0+(gx1-gx0)*0.5,gy0-gh*0.7); ctx.stroke();
      ctx.strokeStyle=RED; ctx.setLineDash([4,3]); ctx.beginPath(); ctx.moveTo(gx0+(gx1-gx0)*0.5,gy0-gh*0.7); ctx.lineTo(gx1*0.99,gy0-gh*0.85); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=GRN; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('탄성(σ=Yε)', gx0+(gx1-gx0)*0.25, gy0-gh*0.45);
      ctx.fillStyle=RED; ctx.fillText('탄성한계→소성·파단', gx0+(gx1-gx0)*0.72, gy0-gh*0.95);
      // 현재 점
      var px=gx0+Math.min(1,s.F/10)*(gx1-gx0)*0.9, py=gy0-Math.min(gh,(elastic?s.F/7*0.7:0.7+(s.F-7)/3*0.15)*gh); ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(px,py,5,0,7); ctx.fill();
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.fillText('ΔL = F·L₀/(A·Y)   응력 σ=F/A='+stress.toFixed(1)+'  변형 ε='+strain.toFixed(2), W/2, H*0.80);
      ctx.fillStyle=elastic?GRN:RED; ctx.font='600 13px sans-serif'; ctx.fillText(elastic?'탄성 영역: 힘을 빼면 원래대로 (σ=Yε, Y=영률)':'탄성한계 초과! 영구 변형·파단', W/2, H*0.87);
      E.tapHint(W/2, H*0.93, '힘을 키우면 늘어나고, 탄성한계를 넘으면 영구 변형됩니다', true);
      E.big('탄성 — ΔL = F·L₀/(A·Y), 응력 σ = Y·변형 ε', '재료가 늘어나고 버티고 끊어집니다.'); }
  }

  ];
  if(window.Engine&&Engine.addScenes) Engine.addScenes(scenes);
})();
