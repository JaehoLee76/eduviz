/* 제4장 부등식 — 4.1 기본 성질 · 4.2 해법 · 4.3 집합·명제·조건 */
(function(){
  function ez(p){ p=Math.max(0,Math.min(1,p)); return p<0.5?2*p*p:1-Math.pow(-2*p+2,2)/2; }

  var scenes = [

  // ══════════ 4.1 부등식의 기본 성질 ══════════
  { id:'ch4_01',
    enter:function(E){ this.s={p:0,tgt:0,auto:false,a:1,b:3}; E.NL.range(-5,5); E.setOn([]); },
    tap:function(E){ var s=this.s; if(s.p>=1){ s.p=0; s.tgt=0; s.auto=false; E.blip(340,0.12); } else { s.tgt=1; s.auto=false; E.blip(540,0.15); } },
    back:function(E){ E.NL.step(); E.NL.draw(); },
    draw:function(E){ var s=this.s, ctx=E.ctx; var tgt=s.auto?1:(s.tgt||0); if(s.p<tgt) s.p=Math.min(tgt,s.p+0.012); if(s.auto&&s.p>=1)s.auto=false;
      var mp=ez(s.p), a=s.a*(1-2*mp), b=s.b*(1-2*mp), y=E.NL.yy();
      // 0 기준 반사선(애니 중 옅게)
      if(s.p>0&&s.p<1){ ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1; ctx.setLineDash([4,4]); ctx.beginPath(); ctx.moveTo(E.NL.px(0),y-60); ctx.lineTo(E.NL.px(0),y+60); ctx.stroke(); ctx.setLineDash([]); }
      E.NL.dot(a,'#7ab8ff',8); E.NL.dot(b,'#ffb27a',8);
      ctx.font='600 15px sans-serif'; ctx.textAlign='center';
      ctx.fillStyle='#7ab8ff'; ctx.fillText('a = '+Math.round(a),E.NL.px(a),y-20);
      ctx.fillStyle='#ffb27a'; ctx.fillText('b = '+Math.round(b),E.NL.px(b),y-20);
      if(s.p<=0) E.tapHint(E.W/2, y+78,'▶ ×(−1) D · 자동 S',true);
      else if(s.p>=1) E.tapHint(E.W/2, y+78,'↻ 다시 보기 (D)',false);
      var done=s.p>=1;
      E.big(done?'−1 &gt; −3':'1 &lt; 3', done?'부등호가 < 에서 > 로 뒤집힘 ✓':'음수를 곱하면 순서가 뒤집힙니다'); }
  },

  // ══════════ 4.2 부등식의 해법 ══════════
  { id:'ch4_02',
    enter:function(E){ this.s={c:5,incl:false}; E.NL.range(-3,7);
      E.controls('<div class="ctrl"><label>우변 상수 c</label><input type="range" id="rc" min="1" max="9" step="2" value="5"><output id="rco">5</output></div>');
      var self=this;
      E.bind('#rc','input',function(e){ self.s.c=+e.target.value; document.getElementById('rco').textContent=e.target.value; E.blip(440,0.1); }); E.setOn([]); },
    tap:function(E){ this.s.incl=!this.s.incl; E.blip(this.s.incl?520:420,0.15); },
    back:function(E){ E.NL.step(); E.NL.draw(); },
    draw:function(E){ var s=this.s, ctx=E.ctx, y=E.NL.yy();
      // 2x + 1 (>|≥) c  →  x (>|≥) (c−1)/2 = 끝점
      var ep=(s.c-1)/2, sign=s.incl?'≥':'>', xe=E.NL.px(ep), xr=E.NL.px(E.NL.tmax-0.3);
      ctx.strokeStyle=E.COL.accent; ctx.lineWidth=6; ctx.globalAlpha=0.5; ctx.beginPath(); ctx.moveTo(xe,y); ctx.lineTo(xr,y); ctx.stroke(); ctx.globalAlpha=1;
      ctx.fillStyle=E.COL.accent; ctx.beginPath(); ctx.moveTo(xr,y); ctx.lineTo(xr-10,y-6); ctx.lineTo(xr-10,y+6); ctx.fill();
      // 끝점: ≥ 면 닫힌(●) · > 면 열린(○)
      ctx.lineWidth=2.5; ctx.strokeStyle=E.COL.accent; ctx.beginPath(); ctx.arc(xe,y,7,0,7);
      if(s.incl){ ctx.fillStyle=E.COL.accent; ctx.fill(); } else { ctx.fillStyle='#0b0b10'; ctx.fill(); ctx.stroke(); }
      ctx.fillStyle=E.COL.accent; ctx.font='700 16px sans-serif'; ctx.textAlign='center';
      var eTxt=(ep%1===0?ep:ep.toFixed(1));
      ctx.fillText('x '+sign+' '+eTxt, (xe+xr)/2, y-18);
      ctx.font='600 13px sans-serif'; ctx.fillText('끝점 x = '+eTxt, xe, y+48);
      E.tapHint(E.W/2, y+78, '↔ '+(s.incl?'≥ → > (열린 끝점)':'> → ≥ (닫힌 끝점)'), true);
      E.big('2x + 1 '+sign+' '+s.c+'  →  x '+sign+' '+eTxt, s.incl?'끝점 포함(●) — 닫힌 끝점':'끝점 미포함(○) — 열린 끝점'); }
  },

  { id:'ch4_03',
    enter:function(E){ this.s={lt:true}; E.Plot.range(-5,6,-9,5).lab('x','y'); E.setOn([]); },
    tap:function(E){ this.s.lt=!this.s.lt; E.blip(this.s.lt?420:520,0.15); },
    draw:function(E){ var s=this.s, P=E.Plot, ctx=E.ctx; P.axes();
      P.curve(function(x){return x*x-x-6;},'#7ab8ff');
      var r1=-2, r2=3, y0=P.Y(0);
      ctx.fillStyle=s.lt?'rgba(255,178,122,0.35)':'rgba(143,227,181,0.35)';
      if(s.lt){ ctx.fillRect(P.X(r1), y0-6, P.X(r2)-P.X(r1), 12); }
      else { ctx.fillRect(P.X(-5), y0-6, P.X(r1)-P.X(-5), 12); ctx.fillRect(P.X(r2), y0-6, P.X(6)-P.X(r2), 12); }
      ctx.globalAlpha=E.blink(); P.dot(r1,0,'#ffb27a','x = '+r1); P.dot(r2,0,'#ffb27a','x = '+r2); ctx.globalAlpha=1;
      E.tapHint(E.W/2, P.geom().bot+40, '↔ 부등호 방향 바꾸기', true);
      E.big(s.lt?'(x−3)(x+2) &lt; 0  →  −2 &lt; x &lt; 3':'(x−3)(x+2) &gt; 0  →  x &lt; −2 또는 x &gt; 3', s.lt?'포물선이 x축 아래 (두 근 사이)':'포물선이 x축 위 (두 근 바깥)'); }
  },

  // ══════════ 4.3 집합·명제·조건 ══════════
  { id:'ch4_04',
    enter:function(E){ this.s={op:0}; E.setOn([]); },
    tap:function(E){ this.s.op=(this.s.op+1)%3; E.blip(440+this.s.op*60,0.15); },
    draw:function(E){ var s=this.s, ctx=E.ctx, cx=E.W/2, cy=E.H*0.44, r=Math.min(140,E.H*0.19), d=r*0.85, ax=cx-d/2, bx=cx+d/2, col='rgba(255,178,122,0.32)';
      function cir(X){ ctx.beginPath(); ctx.arc(X,cy,r,0,7); }
      ctx.save();
      if(s.op===0){ ctx.fillStyle=col; cir(ax); ctx.fill(); cir(bx); ctx.fill(); }
      else if(s.op===1){ cir(ax); ctx.clip(); ctx.fillStyle=col; cir(bx); ctx.fill(); }
      else { ctx.fillStyle=col; ctx.fillRect(cx-r*2.3, cy-r*1.5, r*4.6, r*3.0);
        ctx.globalCompositeOperation='destination-out'; ctx.fillStyle='#000'; cir(ax); ctx.fill(); }
      ctx.restore();
      ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2; cir(ax); ctx.stroke();
      ctx.strokeStyle='#8fe3b5'; cir(bx); ctx.stroke();
      ctx.font='600 18px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillStyle='#7ab8ff'; ctx.fillText('A', ax-r*0.55, cy); ctx.fillStyle='#8fe3b5'; ctx.fillText('B', bx+r*0.55, cy); ctx.textBaseline='alphabetic';
      E.tapHint(cx, cy+r*1.5+30, '▶ 연산 바꾸기', true);   // 전체집합 박스(cy±1.5r) 아래로
      var t=['합집합   A ∪ B','교집합   A ∩ B','여집합   Aᶜ'][s.op], d2=['A 또는 B (둘 중 하나라도)','A 그리고 B (겹친 부분)','A 가 아닌 모든 것'][s.op];
      E.big(t, d2); }
  },

  { id:'ch4_05',
    enter:function(E){ this.s={d:0}; // d = P 중심을 Q 중심에서 오른쪽으로 민 거리(반지름 R 단위, 0~1.6)
      E.controls('<div class="ctrl"><label>P의 위치 (Q 밖으로)</label><input type="range" id="pp" min="0" max="1.6" step="0.2" value="0"><output id="ppo">0.0</output></div>');
      var self=this; E.bind('#pp','input',function(e){ self.s.d=+e.target.value; document.getElementById('ppo').textContent=(+e.target.value).toFixed(1); E.blip(420+self.s.d*120,0.1); }); E.setOn([]); },
    draw:function(E){ var s=this.s, ctx=E.ctx, cx=E.W/2, cy=E.H*0.46, R=Math.min(150,E.H*0.21), r=R*0.5;
      var px=cx+s.d*R, py=cy;   // P 중심
      // P ⊂ Q 판정: 두 중심거리 + r ≤ R 이면 P가 Q 안에 완전히 들어감(실계산)
      var dist=Math.abs(px-cx), subset=(dist+r<=R+0.001);
      // Q
      ctx.fillStyle='rgba(143,227,181,0.14)'; ctx.beginPath(); ctx.arc(cx,cy,R,0,7); ctx.fill();
      ctx.strokeStyle='#8fe3b5'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(cx,cy,R,0,7); ctx.stroke();
      // P (포함이면 주황, 벗어나면 분홍 경고)
      var pcol=subset?'#ffb27a':'#f4a0c0';
      ctx.fillStyle=subset?'rgba(255,178,122,0.28)':'rgba(244,160,192,0.28)'; ctx.beginPath(); ctx.arc(px,py,r,0,7); ctx.fill();
      ctx.strokeStyle=pcol; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(px,py,r,0,7); ctx.stroke();
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillStyle=pcol; ctx.font='600 14px sans-serif'; ctx.fillText('P', px, py);
      ctx.fillStyle='#8fe3b5'; ctx.fillText('Q', cx, cy+R*0.78); ctx.textBaseline='alphabetic';
      ctx.globalAlpha=E.blink(); ctx.fillStyle=subset?'#8fe3b5':'#f4a0c0'; ctx.font='700 16px sans-serif'; ctx.textAlign='center';
      ctx.fillText(subset?'P ⊂ Q  성립  →  p → q  참':'P ⊄ Q  불성립  →  p → q  거짓', cx, cy-R-16); ctx.globalAlpha=1;
      E.tapHint(E.W/2, cy+R+44, '◂▸ P를 Q 안팎으로 이동', true);
      E.big('p → q   ⟺   P ⊂ Q', subset?'P가 Q 안에 있으면 명제 p→q 는 참 (p는 충분조건)':'P가 Q를 벗어나면 반례 존재 → 명제 거짓'); }
  }

  ];

  if(window.Engine) window.Engine.addScenes(scenes);
})();
