/* 제26장 종합 — 삼차방정식·체의 공리·확률분포·한정기호·여정의 끝
   동작(behavior)만. 텍스트는 content/ch26.json */
(function(){
  var TAU=Math.PI*2;

  var scenes=[

  // ══════════ 26.1 삼·사차방정식 ══════════
  { id:'ch26_01',
    enter:function(E){ this.s={q:0}; E.Plot.range(-3,3,-4,4).lab('x','y');
      E.controls('<div class="ctrl"><label>상수항 q</label><input type="range" id="qq" min="-3" max="3" step="0.5" value="0"><output id="qqo">0</output></div>');
      var self=this; E.bind('#qq','input',function(e){ self.s.q=+e.target.value; document.getElementById('qqo').textContent=(+e.target.value); E.blip(440,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, q=this.s.q, ctx=E.ctx; P.axes();
      function f(x){return x*x*x-3*x+q;}
      P.curve(f,'#7ab8ff');
      // 상수항 q: 0→항 생략, 음수→− |q|, 양수→+ q
      var qt=(q===0?'':q>0?' + '+q:' − '+(-q));
      ctx.fillStyle='#7ab8ff'; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('y = x³ − 3x'+qt, P.X(1.3), P.Y(f(1.3))-8);
      // 근(x절편) 표시 + 실근 개수 실측
      var roots=0;
      for(var x=-3;x<=3;x+=0.01){ if(f(x)*f(x+0.01)<0){ ctx.globalAlpha=E.blink(); P.dot(x+0.005,0,'#ffb27a'); ctx.globalAlpha=1; roots++; } }
      ctx.fillStyle='#ffb27a'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('실근 '+roots+'개 (x절편)', P.X(0), P.geom().bot+22);
      E.big('x³ − 3x'+qt+' = 0', '삼차방정식 — 카르다노 공식으로 풀립니다(복소수 필요!). q에 따라 실근 1~3개. 5차부턴 일반 공식 없음(갈루아)'); }
  },

  // ══════════ 26.2 체의 공리 (수 체계) ══════════
  { id:'ch26_02',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, cx=E.W/2, cy=E.H*0.42, sets=[['ℂ 복소수',150],['ℝ 실수',118],['ℚ 유리수',86],['ℤ 정수',56],['ℕ 자연수',28]], cols=['#f4a0c0','#ffb27a','#8fe3b5','#7ab8ff','#cfcdc6'];
      for(var i=0;i<sets.length;i++){ var r=sets[i][1]*Math.min(1,E.H/720);
        ctx.strokeStyle=cols[i]; ctx.lineWidth=2; ctx.fillStyle=cols[i].replace(')',',0.06)').replace('#','rgba(');
        ctx.beginPath(); ctx.ellipse(cx,cy,r*1.4,r,0,0,TAU); ctx.stroke();
        ctx.fillStyle=cols[i]; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText(sets[i][0], cx, cy-r+16); }
      E.big('ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ ⊂ ℂ', '수의 확장 여정 — 1장 자연수에서 복소수까지. ℚ·ℝ·ℂ는 사칙연산이 닫힌 "체(field)"'); }
  },

  // ══════════ 26.4 확률분포와 평균 ══════════
  { id:'ch26_03',
    enter:function(E){ this.s={s:1}; E.Plot.range(-4,4,-0.1,1.0).lab('값','밀도');
      E.controls('<div class="ctrl"><label>표준편차 σ</label><input type="range" id="ss" min="0.5" max="2" step="0.25" value="1"><output id="sso">1</output></div>');
      var self=this; E.bind('#ss','input',function(e){ self.s.s=+e.target.value; document.getElementById('sso').textContent=(+e.target.value); E.blip(440,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, s=this.s.s, ctx=E.ctx; P.axes();
      function dens(x){ return Math.exp(-x*x/(2*s*s))/(s*Math.sqrt(2*Math.PI)); }
      P.curve(dens, '#7ab8ff');
      var peak=dens(0);   // 최댓값(밀도) 실계산
      ctx.fillStyle='#7ab8ff'; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('밀도 f(x)', P.X(1.1), P.Y(dens(1.1))-6);
      // 평균(중심)
      ctx.strokeStyle='rgba(255,178,122,0.6)'; ctx.lineWidth=1.5; ctx.setLineDash([5,4]); ctx.beginPath(); ctx.moveTo(P.X(0),P.Y(0)); ctx.lineTo(P.X(0),P.Y(0.95)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='#ffb27a'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('평균 μ = 0', P.X(0), P.Y(0.95)+0);
      ctx.fillStyle='#cfcdc6'; ctx.font='12px sans-serif'; ctx.fillText('최고밀도 f(0) = '+peak.toFixed(3), P.X(0), P.geom().bot+22);
      E.big('정규분포 N(0, σ²),  σ = '+s, '확률분포 — 종 모양 곡선. 평균=중심, σ=퍼짐. 곡선 아래 전체 넓이=1(19장 적분!). 큰수의법칙·통계의 정점'); }
  },

  // ══════════ 26.5 "전부"와 "존재" (한정기호) ══════════
  { id:'ch26_04',
    enter:function(E){ this.s={mode:0}; E.setOn([]); },
    tap:function(E){ this.s.mode=(this.s.mode+1)%2; E.blip(440+this.s.mode*80,0.15); },
    draw:function(E){ var ctx=E.ctx, m=this.s.mode, cx=E.W/2, cy=E.H*0.42, n=6, R=Math.min(130,E.H*0.18);
      for(var i=0;i<n;i++){ var t=-Math.PI/2+i*TAU/n, x=cx+R*Math.cos(t), y=cy+R*Math.sin(t);
        var ok = m===0? true : (i===2);  // ∀: 모두 / ∃: 하나
        ctx.fillStyle=ok?'rgba(143,227,181,0.5)':'rgba(255,255,255,0.08)'; ctx.strokeStyle=ok?'#8fe3b5':'rgba(255,255,255,0.25)'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.arc(x,y,22,0,TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle=ok?'#8fe3b5':'#6f6e7a'; ctx.font='600 16px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(ok?'✓':'·',x,y); ctx.textBaseline='alphabetic'; }
      E.tapHint(E.W/2, cy+R+50, '▶ ∀ (전부) / ∃ (존재)', true);
      E.big(m===0?'∀x : 모든 것에 대해 참 (전칭)':'∃x : 적어도 하나 존재 (존재)', '한정기호 — 수학 명제의 두 기둥. "모든"과 "어떤"의 정확한 구별이 모든 정의·증명의 언어입니다'); }
  },

  // ══════════ 26 여정의 끝 ══════════
  { id:'ch26_05',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, cx=E.W/2, cy=E.H*0.44, items=['수','식','함수','도형','벡터','미분','적분','확률','무한'], R=Math.min(150,E.H*0.22);
      // 별자리처럼 연결
      var pts=items.map(function(s,i){ var t=-Math.PI/2+i*TAU/items.length; return [cx+R*Math.cos(t),cy+R*Math.sin(t),s]; });
      ctx.strokeStyle='rgba(122,184,255,0.3)'; ctx.lineWidth=1.5; ctx.beginPath();
      for(var i=0;i<pts.length;i++){ if(i===0)ctx.moveTo(pts[i][0],pts[i][1]); else ctx.lineTo(pts[i][0],pts[i][1]); } ctx.closePath(); ctx.stroke();
      for(var k=0;k<pts.length;k++){ var bl=0.5+0.5*Math.sin(E.frame*0.05+k); ctx.globalAlpha=0.5+0.5*bl;
        ctx.fillStyle='#ffb27a'; ctx.beginPath(); ctx.arc(pts[k][0],pts[k][1],5,0,TAU); ctx.fill(); ctx.globalAlpha=1;
        ctx.fillStyle='#cfcdc6'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText(pts[k][2], pts[k][0], pts[k][1]-12); }
      ctx.fillStyle='#ffd9bd'; ctx.font='600 18px sans-serif'; ctx.textAlign='center'; ctx.fillText('🎓', cx, cy+5);
      E.big('수학의 여정 — 완주!', '하나의 화면이 모양을 바꿔 여기까지 왔습니다. 수→무한, 26장 전부 연결된 하나의 이야기. 다음은 알고리즘!'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
