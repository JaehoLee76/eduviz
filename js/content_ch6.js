/* 제6장 도형과 식 — 6.1 점의 좌표 · 6.2 직선 · 6.3 원과 자취 · 6.4 영역
   동작(behavior)만. 텍스트는 content/ch6.json */
(function(){
  // 좌표축의 x·y 픽셀 스케일(원을 정확히 그리기 위함)
  function sx(P){ var g=P.geom(); return g.w/(P.xmax-P.xmin); }
  function sy(P){ var g=P.geom(); return g.h/(P.ymax-P.ymin); }

  var scenes=[

  // ══════════ 6.1 점의 좌표 ══════════
  // 6.1a 두 점 사이의 거리 — 피타고라스 회수
  { id:'ch6_01',
    enter:function(E){ this.s={bx:4,by:3}; E.Plot.range(-5,6,-3,6).lab('x','y');
      E.controls('<div class="ctrl"><label>B의 x</label><input type="range" id="bx" min="-4" max="5" step="1" value="4"><output id="bxo">4</output><label style="margin-left:14px">B의 y</label><input type="range" id="by" min="-2" max="5" step="1" value="3"><output id="byo">3</output></div>');
      var self=this;
      E.bind('#bx','input',function(e){ self.s.bx=+e.target.value; document.getElementById('bxo').textContent=e.target.value; E.blip(440,0.1); });
      E.bind('#by','input',function(e){ self.s.by=+e.target.value; document.getElementById('byo').textContent=e.target.value; E.blip(400,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, s=this.s, ctx=E.ctx, ax=1,ay=1,bx=s.bx,by=s.by; P.axes();
      var dx=bx-ax, dy=by-ay, d=Math.sqrt(dx*dx+dy*dy);
      // 직각삼각형(밑변·높이)
      ctx.strokeStyle='rgba(244,160,192,0.7)'; ctx.lineWidth=2; ctx.setLineDash([5,4]);
      ctx.beginPath(); ctx.moveTo(P.X(ax),P.Y(ay)); ctx.lineTo(P.X(bx),P.Y(ay)); ctx.lineTo(P.X(bx),P.Y(by)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='#f4a0c0'; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('|Δx|='+Math.abs(dx),(P.X(ax)+P.X(bx))/2,P.Y(ay)+18);
      ctx.textAlign='left'; ctx.fillText('|Δy|='+Math.abs(dy),P.X(bx)+8,(P.Y(ay)+P.Y(by))/2);
      // 빗변(거리)
      ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(P.X(ax),P.Y(ay)); ctx.lineTo(P.X(bx),P.Y(by)); ctx.stroke();
      // d 값 읽음판은 플롯 아래 중앙에 고정 — B가 슬라이더로 우상단 모서리까지 이동해도 B 라벨과 안 겹치게
      ctx.fillStyle='#7ab8ff'; ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.fillText('d = '+(d%1===0?d:d.toFixed(2)),(P.geom().left+P.geom().right)/2,P.geom().bot+22);
      P.dot(ax,ay,'#ffb27a','A(1, 1)'); P.dot(bx,by,'#8fe3b5','B('+bx+', '+by+')');
      E.big('d = √('+(dx*dx)+' + '+(dy*dy)+') = '+(d%1===0?d:d.toFixed(2)), '거리 = √(Δx² + Δy²) — 피타고라스 정리'); }
  },

  // 6.1b 내분점·중점
  { id:'ch6_02',
    enter:function(E){ this.s={t:0.5}; E.Plot.range(-1,9,-1,7).lab('x','y');
      E.controls('<div class="ctrl"><label>비율 t (A→B)</label><input type="range" id="vt" min="0" max="1" step="0.1" value="0.5"><output id="vto">0.5</output></div>');
      var self=this; E.bind('#vt','input',function(e){ self.s.t=+e.target.value; document.getElementById('vto').textContent=(+e.target.value).toFixed(1); E.blip(420+self.s.t*120,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, s=this.s, ctx=E.ctx, t=s.t, ax=1,ay=1,bx=7,by=5; P.axes();
      ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(P.X(ax),P.Y(ay)); ctx.lineTo(P.X(bx),P.Y(by)); ctx.stroke();
      var px=ax+(bx-ax)*t, py=ay+(by-ay)*t;
      P.dot(ax,ay,'#ffb27a','A(1, 1)'); P.dot(bx,by,'#7ab8ff','B(7, 5)');
      // 중점일 때 강조
      if(Math.abs(t-0.5)<0.001){ ctx.strokeStyle='rgba(143,227,181,0.5)'; ctx.lineWidth=1.5; ctx.setLineDash([4,4]); ctx.beginPath(); ctx.arc(P.X(px),P.Y(py),14,0,7); ctx.stroke(); ctx.setLineDash([]); }
      ctx.globalAlpha=E.blink(); P.dot(px,py,'#8fe3b5',(Math.abs(t-0.5)<0.001?'중점':'P')+'('+(px%1===0?px:px.toFixed(1))+', '+(py%1===0?py:py.toFixed(1))+')'); ctx.globalAlpha=1;
      E.big('P = (1−t)·A + t·B,  t = '+t.toFixed(1), Math.abs(t-0.5)<0.001?'t = 0.5 → 중점 = (A+B)/2':'A에서 B로 t만큼 간 점(내분점)'); }
  },

  // ══════════ 6.2 직선 ══════════
  // 6.2a 직선의 방정식 — 두 점을 지나는 직선(5장 일차함수 회수)
  { id:'ch6_03',
    enter:function(E){ this.s={bx:4,by:5}; E.Plot.range(-5,6,-4,7).lab('x','y');
      E.controls('<div class="ctrl"><label>B의 x</label><input type="range" id="lx" min="-3" max="5" step="1" value="4"><output id="lxo">4</output><label style="margin-left:14px">B의 y</label><input type="range" id="ly" min="-3" max="6" step="1" value="5"><output id="lyo">5</output></div>');
      var self=this;
      E.bind('#lx','input',function(e){ self.s.bx=+e.target.value; document.getElementById('lxo').textContent=e.target.value; E.blip(440,0.1); });
      E.bind('#ly','input',function(e){ self.s.by=+e.target.value; document.getElementById('lyo').textContent=e.target.value; E.blip(400,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, s=this.s, ctx=E.ctx, ax=-1,ay=1,bx=s.bx,by=s.by; P.axes();
      var ddx=bx-ax; if(ddx===0){ // 수직선
        ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(P.X(ax),P.Y(P.ymin)); ctx.lineTo(P.X(ax),P.Y(P.ymax)); ctx.stroke();
        P.dot(ax,ay,'#ffb27a','A(−1, 1)'); P.dot(bx,by,'#8fe3b5',null);
        var bpx0=P.X(bx), bpy0=P.Y(by);
        ctx.fillStyle='#8fe3b5'; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('B('+bx+', '+by+')', bpx0+12, bpy0-16);
        E.big('x = −1  (수직선)', '기울기가 무한대 — x가 일정한 직선'); return; }
      var m=(by-ay)/ddx;
      P.curve(function(x){ return m*(x-ax)+ay; }, '#7ab8ff');
      P.dot(ax,ay,'#ffb27a','A(−1, 1)'); P.dot(bx,by,'#8fe3b5',null);
      var bpx=P.X(bx), bpy=P.Y(by);
      ctx.fillStyle='#8fe3b5'; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
      ctx.fillText('B('+bx+', '+by+')', bpx+12, bpy-16);
      var mTxt=(m%1===0?m:m.toFixed(2));
      var mCo=(m===1?'':m===-1?'−':mTxt);
      var ps=(m===0?'y = 1':'y − 1 = '+mCo+'(x + 1)');
      E.big('기울기 m = Δy/Δx = '+mTxt, ps+'  — 한 점과 기울기로 결정'); }
  },

  // 6.2b 평행·수직 (기울기 관계)
  { id:'ch6_04',
    enter:function(E){ this.s={m:1}; E.Plot.range(-5,5,-5,5).lab('x','y');
      E.controls('<div class="ctrl"><label>파란선 기울기 m</label><input type="range" id="pm" min="-2" max="2" step="0.5" value="1"><output id="pmo">1</output></div>');
      var self=this; E.bind('#pm','input',function(e){ self.s.m=+e.target.value; document.getElementById('pmo').textContent=e.target.value; E.blip(440,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, s=this.s, ctx=E.ctx, m=s.m, m2=2; P.axes();
      P.curve(function(x){ return m*x; }, '#7ab8ff');          // 움직이는 선
      P.curve(function(x){ return m2*x+1; }, '#8fe3b5');        // 기준선 y=2x+1
      // 두 직선 이름표(기울기 동행)
      var lmTxt=(m%1===0?m:m.toFixed(1));
      ctx.font='600 13px sans-serif'; ctx.textAlign='left';
      ctx.fillStyle='#7ab8ff'; ctx.fillText('ℓ₁: y = '+(m===1?'x':m===-1?'−x':lmTxt+'x')+'  (m₁ = '+lmTxt+')', P.X(-4.8), P.Y(4.3));
      ctx.fillStyle='#8fe3b5'; ctx.fillText('ℓ₂: y = 2x + 1  (m₂ = 2)', P.X(-4.8), P.Y(3.5));
      var rel, det, parallel=(m===m2), perp=(Math.abs(m*m2+1)<0.001);
      if(parallel){ rel='평행 (m₁ = m₂)'; det='두 직선이 만나지 않습니다'; }
      else if(perp){ rel='수직 (m₁·m₂ = −1)'; det='두 직선이 직각으로 만납니다'; }
      else { rel='한 점에서 만남'; det='m₁ ≠ m₂ → 교점 하나'; }
      // 수직일 때 교점에 직각기호(실제 교점 좌표 계산: m·x = 2x+1)
      if(perp && m!==m2){ var ix=1/(m-m2), iy=m*ix;   // 교점 (ix, iy)
        var a1=Math.atan2(m,1);                         // 움직이는 직선 방향각
        ctx.save(); ctx.translate(P.X(ix),P.Y(iy)); ctx.scale(1,-1); ctx.rotate(a1);
        ctx.strokeStyle='#ffb27a'; ctx.lineWidth=2; ctx.strokeRect(0,0,12,12); ctx.restore(); }
      E.big('m₁ = '+m+',  m₂ = 2', rel+' · '+det); }
  },

  // ══════════ 6.3 원과 자취 ══════════
  // 6.3a 원의 방정식
  { id:'ch6_05',
    // x:y span = 15:10 = 1.5 → plot 박스(w≈h*1.5)와 같은 비율 → 픽셀 정사각형 → 원이 둥글게 보임
    enter:function(E){ this.s={a:0,b:0,r:2}; E.Plot.range(-7.5,7.5,-5,5).lab('x','y');
      E.controls('<div class="ctrl"><label>중심 a</label><input type="range" id="ca" min="-2" max="2" step="1" value="0"><output id="cao">0</output><label style="margin-left:12px">중심 b</label><input type="range" id="cb" min="-2" max="2" step="1" value="0"><output id="cbo">0</output><label style="margin-left:12px">반지름 r</label><input type="range" id="cr" min="1" max="3" step="1" value="2"><output id="cro">2</output></div>');
      var self=this;
      E.bind('#ca','input',function(e){ self.s.a=+e.target.value; document.getElementById('cao').textContent=e.target.value; E.blip(440,0.1); });
      E.bind('#cb','input',function(e){ self.s.b=+e.target.value; document.getElementById('cbo').textContent=e.target.value; E.blip(420,0.1); });
      E.bind('#cr','input',function(e){ self.s.r=+e.target.value; document.getElementById('cro').textContent=e.target.value; E.blip(400,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, s=this.s, ctx=E.ctx, a=s.a,b=s.b,r=s.r; P.axes();
      ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2.5; ctx.beginPath();
      ctx.ellipse(P.X(a),P.Y(b), r*sx(P), r*sy(P), 0, 0, 7); ctx.stroke();
      // 반지름선
      ctx.strokeStyle='rgba(255,178,122,0.8)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(P.X(a),P.Y(b)); ctx.lineTo(P.X(a+r),P.Y(b)); ctx.stroke();
      ctx.fillStyle='#ffb27a'; ctx.font='13px sans-serif'; ctx.textAlign='right'; ctx.fillText('r='+r,P.geom().right-8,P.geom().top+22);
      P.dot(a,b,'#8fe3b5',null);
      ctx.fillStyle='#8fe3b5'; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
      ctx.fillText('중심('+a+', '+b+')', P.geom().left+8, P.geom().top+22);
      E.big('(x − '+a+')² + (y − '+b+')² = '+(r*r), '중심 ('+a+', '+b+'), 반지름 '+r+' — 거리 공식의 자취'); }
  },

  // ══════════ 6.4 부등식이 나타내는 영역 ══════════
  { id:'ch6_06',
    enter:function(E){ this.s={mode:0,m:1,r:3}; E.Plot.range(-7.5,7.5,-5,5).lab('x','y');
      E.controls('<div class="ctrl"><label>직선 기울기 m</label><input type="range" id="rm" min="-2" max="2" step="0.5" value="1"><output id="rmo">1</output><label style="margin-left:14px">원 반지름 r</label><input type="range" id="rr" min="1" max="4" step="1" value="3"><output id="rro">3</output></div>');
      var self=this;
      E.bind('#rm','input',function(e){ self.s.m=+e.target.value; document.getElementById('rmo').textContent=(+e.target.value); E.blip(440,0.1); });
      E.bind('#rr','input',function(e){ self.s.r=+e.target.value; document.getElementById('rro').textContent=e.target.value; E.blip(400,0.1); }); E.setOn([]); },
    tap:function(E){ this.s.mode=(this.s.mode+1)%3; E.blip(440+this.s.mode*50,0.15); },
    draw:function(E){ var P=E.Plot, s=this.s, ctx=E.ctx, g=P.geom(), m=s.m, r=s.r; P.axes();
      var mTxt=(m%1===0?m:m.toFixed(1));
      var mxT=(m===0?'1':(m===1?'x':m===-1?'−x':mTxt+'x')+' + 1');   // y = m·x + 1 의 우변(계수 1/−1/0 정리)
      // 직선 y = m·x + 1 을 클립 사각형 안에서 채울 사다리꼴 꼭짓점(실계산)
      function fillAbove(){ ctx.beginPath();
        ctx.moveTo(g.left,P.Y(m*P.xmin+1)); ctx.lineTo(g.right,P.Y(m*P.xmax+1)); ctx.lineTo(g.right,g.top); ctx.lineTo(g.left,g.top); ctx.closePath(); ctx.fill(); }
      ctx.save(); ctx.beginPath(); ctx.rect(g.left,g.top,g.w,g.h); ctx.clip();
      if(s.mode===0){ // y > m·x + 1
        ctx.fillStyle='rgba(122,184,255,0.25)'; fillAbove();
        ctx.restore(); ctx.save(); ctx.setLineDash([6,5]); P.curve(function(x){return m*x+1;},'#7ab8ff'); ctx.restore();
        E.big('y &gt; '+mxT, '직선 위쪽 영역 (점선 경계=미포함) — 기울기 '+mTxt); return;
      } else if(s.mode===1){ // 원 내부 x²+y²<r²
        ctx.fillStyle='rgba(143,227,181,0.25)'; ctx.beginPath(); ctx.ellipse(P.X(0),P.Y(0),r*sx(P),r*sy(P),0,0,7); ctx.fill();
        ctx.restore();
        ctx.save(); ctx.setLineDash([6,5]); ctx.strokeStyle='#8fe3b5'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.ellipse(P.X(0),P.Y(0),r*sx(P),r*sy(P),0,0,7); ctx.stroke(); ctx.restore();
        // 반지름선 + 중심 O(실측값 동행)
        ctx.strokeStyle='rgba(143,227,181,0.8)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(P.X(0),P.Y(0)); ctx.lineTo(P.X(r),P.Y(0)); ctx.stroke();
        ctx.fillStyle='#8fe3b5'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('r = '+r,(P.X(0)+P.X(r))/2,P.Y(0)-6);
        P.dot(0,0,'#8fe3b5','O(0, 0)');
        E.big('x² + y² &lt; '+(r*r), '중심 O, 반지름 '+r+' 인 원의 내부 (점선 경계=미포함)'); return;
      } else { // 교집합: y > m·x+1 그리고 원 내부
        ctx.fillStyle='rgba(255,178,122,0.30)';
        ctx.beginPath(); ctx.ellipse(P.X(0),P.Y(0),r*sx(P),r*sy(P),0,0,7); ctx.clip();
        fillAbove();
        ctx.restore();
        ctx.save(); ctx.setLineDash([6,5]); ctx.strokeStyle='#8fe3b5'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(P.X(0),P.Y(0),r*sx(P),r*sy(P),0,0,7); ctx.stroke(); P.curve(function(x){return m*x+1;},'#7ab8ff'); ctx.restore();
        E.big('y &gt; '+mxT+'  그리고  x² + y² &lt; '+(r*r), '두 부등식을 동시에 — 교집합 영역'); return;
      } }
  }

  ];
  // tap 힌트(영역 장면)
  scenes[5].draw=(function(orig){ return function(E){ orig.call(this,E); E.tapHint(E.W/2, E.Plot.geom().bot+40, '▶ 영역 바꾸기 (탭)', true); }; })(scenes[5].draw);

  if(window.Engine) window.Engine.addScenes(scenes);
})();
