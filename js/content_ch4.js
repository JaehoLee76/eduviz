/* 제4장 부등식 — 4.1 기본 성질 · 4.2 해법 · 4.3 집합·명제·조건 */
(function(){
  function ez(p){ p=Math.max(0,Math.min(1,p)); return p<0.5?2*p*p:1-Math.pow(-2*p+2,2)/2; }

  var scenes = [

  // ══════════ 4.1 부등식의 기본 성질 ══════════
  { id:'ch4_01',
    enter:function(E){ this.s={p:0,play:false,a:1,b:3}; E.NL.range(-5,5); E.setOn([]); },
    tap:function(E){ if(this.s.play)return; if(this.s.p>=1){ this.s.p=0; E.blip(340,0.12); } else { this.s.play=true; E.blip(540,0.15); } },
    back:function(E){ E.NL.step(); E.NL.draw(); },
    draw:function(E){ var s=this.s, ctx=E.ctx; if(s.play){ s.p+=0.012; if(s.p>=1){s.p=1;s.play=false;} }
      var mp=ez(s.p), a=s.a*(1-2*mp), b=s.b*(1-2*mp), y=E.NL.yy();
      // 0 기준 반사선(애니 중 옅게)
      if(s.play){ ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1; ctx.setLineDash([4,4]); ctx.beginPath(); ctx.moveTo(E.NL.px(0),y-60); ctx.lineTo(E.NL.px(0),y+60); ctx.stroke(); ctx.setLineDash([]); }
      E.NL.dot(a,'#7ab8ff',8); E.NL.dot(b,'#ffb27a',8);
      ctx.font='600 15px sans-serif'; ctx.textAlign='center';
      ctx.fillStyle='#7ab8ff'; ctx.fillText(Math.round(a),E.NL.px(a),y-20);
      ctx.fillStyle='#ffb27a'; ctx.fillText(Math.round(b),E.NL.px(b),y-20);
      if(s.p===0&&!s.play) E.tapHint(E.W/2, y+78,'▶ 눌러서 ×(−1)',true);
      else if(s.p>=1&&!s.play) E.tapHint(E.W/2, y+78,'↻ 다시 보기',false);
      var done=s.p>=1;
      E.big(done?'−1 &gt; −3':'1 &lt; 3', done?'부등호가 < 에서 > 로 뒤집힘 ✓':'음수를 곱하면 순서가 뒤집힙니다'); }
  },

  // ══════════ 4.2 부등식의 해법 ══════════
  { id:'ch4_02',
    enter:function(E){ this.s={}; E.NL.range(-3,7); E.setOn([]);
      E.quiz({q:'x − 3 < 1 의 해는?', choices:['x < 4','x > 4','x < −2','x > −2'], answer:0, explain:'양변에 +3 → x < 4'}); },
    back:function(E){ E.NL.step(); E.NL.draw(); },
    draw:function(E){ var ctx=E.ctx, y=E.NL.yy(), x2=E.NL.px(2), xr=E.NL.px(6.7);
      ctx.strokeStyle=E.COL.accent; ctx.lineWidth=6; ctx.globalAlpha=0.5; ctx.beginPath(); ctx.moveTo(x2,y); ctx.lineTo(xr,y); ctx.stroke(); ctx.globalAlpha=1;
      ctx.fillStyle=E.COL.accent; ctx.beginPath(); ctx.moveTo(xr,y); ctx.lineTo(xr-10,y-6); ctx.lineTo(xr-10,y+6); ctx.fill();
      ctx.fillStyle='#0b0b10'; ctx.strokeStyle=E.COL.accent; ctx.lineWidth=2.5; ctx.beginPath(); ctx.arc(x2,y,7,0,7); ctx.fill(); ctx.stroke();
      ctx.fillStyle=E.COL.accent; ctx.font='700 16px sans-serif'; ctx.textAlign='center'; ctx.fillText('x > 2', (x2+xr)/2, y-18);
      E.big('2x + 1 > 5  →  x > 2', '해 = 2보다 오른쪽 전체 (영역)'); }
  },

  { id:'ch4_03',
    enter:function(E){ this.s={lt:true}; E.Plot.range(-5,6,-9,5); E.setOn([]); },
    tap:function(E){ this.s.lt=!this.s.lt; E.blip(this.s.lt?420:520,0.15); },
    draw:function(E){ var s=this.s, P=E.Plot, ctx=E.ctx; P.axes();
      P.curve(function(x){return x*x-x-6;},'#7ab8ff');
      var r1=-2, r2=3, y0=P.Y(0);
      ctx.fillStyle=s.lt?'rgba(255,178,122,0.35)':'rgba(143,227,181,0.35)';
      if(s.lt){ ctx.fillRect(P.X(r1), y0-6, P.X(r2)-P.X(r1), 12); }
      else { ctx.fillRect(P.X(-5), y0-6, P.X(r1)-P.X(-5), 12); ctx.fillRect(P.X(r2), y0-6, P.X(6)-P.X(r2), 12); }
      ctx.globalAlpha=E.blink(); P.dot(r1,0,'#ffb27a'); P.dot(r2,0,'#ffb27a'); ctx.globalAlpha=1;
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
      E.tapHint(cx, cy+r+52, '▶ 연산 바꾸기', true);
      var t=['합집합   A ∪ B','교집합   A ∩ B','여집합   Aᶜ'][s.op], d2=['A 또는 B (둘 다 포함)','A 그리고 B (겹친 부분)','A 가 아닌 모든 것'][s.op];
      E.big(t, d2); }
  },

  { id:'ch4_05',
    enter:function(E){ this.s={}; E.setOn([]);
      E.quiz({q:'"x = 2 이면 x² = 4" 에서 x = 2 는?', choices:['충분조건','필요조건','필요충분조건','조건 아님'], answer:0, explain:'{2} ⊂ {−2, 2} → x=2는 충분조건(역은 거짓). 작은 집합 쪽이 충분조건.'}); },
    draw:function(E){ var ctx=E.ctx, cx=E.W/2, cy=E.H*0.46, R=Math.min(150,E.H*0.21), r=R*0.5;
      ctx.fillStyle='rgba(143,227,181,0.14)'; ctx.beginPath(); ctx.arc(cx,cy,R,0,7); ctx.fill();
      ctx.strokeStyle='#8fe3b5'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(cx,cy,R,0,7); ctx.stroke();
      ctx.fillStyle='rgba(255,178,122,0.28)'; ctx.beginPath(); ctx.arc(cx,cy-R*0.4,r,0,7); ctx.fill();
      ctx.strokeStyle='#ffb27a'; ctx.beginPath(); ctx.arc(cx,cy-R*0.4,r,0,7); ctx.stroke();
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillStyle='#ffb27a'; ctx.font='600 14px sans-serif'; ctx.fillText('P (정사각형)', cx, cy-R*0.4);
      ctx.fillStyle='#8fe3b5'; ctx.fillText('Q (직사각형)', cx, cy+R*0.72); ctx.textBaseline='alphabetic';
      ctx.globalAlpha=E.blink(); ctx.fillStyle='#ffd9bd'; ctx.font='700 16px sans-serif'; ctx.fillText('P ⊂ Q   ⟺   p → q', cx, cy-R-16); ctx.globalAlpha=1;
      E.big('p → q   ⟺   P ⊂ Q', 'p = 충분조건 · q = 필요조건'); }
  }

  ];

  if(window.Engine) window.Engine.addScenes(scenes);
})();
