/* 알고리즘 제1장 알고리즘과 복잡도 — 1.1 알고리즘 · 1.2 효율성 · 1.3 빅오
   동작(behavior)만. 텍스트는 content/algo1.json
   ※ 수학 트랙과 동일 engine.js 사용 (E.Plot, E.controls, E.big, E.tapHint, E.blink ...) */
(function(){
  // 배열 박스 그리기 (전 장 공용)
  function arr(E, vals, opts){ opts=opts||{}; var ctx=E.ctx, n=vals.length,
      bw=Math.min(opts.bw||64, (E.W*0.8)/n), gap=opts.gap!=null?opts.gap:10,
      total=n*bw+(n-1)*gap, x0=(opts.cx||E.W/2)-total/2, y=opts.y||E.H*0.44;
    for(var i=0;i<n;i++){ var x=x0+i*(bw+gap), hl=opts.hl&&opts.hl(i);
      ctx.fillStyle=hl?hl.fill:'rgba(122,184,255,0.14)'; ctx.strokeStyle=hl?hl.stroke:'#7ab8ff'; ctx.lineWidth=2;
      if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,bw,bw,8);ctx.fill();ctx.stroke();}else{ctx.fillRect(x,y,bw,bw);ctx.strokeRect(x,y,bw,bw);}
      ctx.fillStyle=hl?hl.text:'#dfeefb'; ctx.font='600 22px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(vals[i], x+bw/2, y+bw/2); ctx.textBaseline='alphabetic';
      if(opts.idx){ ctx.fillStyle='#6f6e7a'; ctx.font='11px sans-serif'; ctx.fillText(i, x+bw/2, y+bw+16); }
      if(hl&&hl.tag){ ctx.fillStyle=hl.stroke; ctx.font='600 12px sans-serif'; ctx.fillText(hl.tag, x+bw/2, y-10); }
    }
    return {x0:x0,y:y,bw:bw,gap:gap};
  }

  var scenes=[

  // ══════════ 1.1 알고리즘이란 ══════════
  { id:'algo1_01',
    enter:function(E){ this.s={i:0,max:-99,play:false}; E.setOn([]); this.A=[3,7,2,8,5]; },
    tap:function(E){ var s=this.s; if(s.i>=this.A.length){ s.i=0; s.max=-99; E.blip(340,0.12); } else { s.max=Math.max(s.max,this.A[s.i]); s.i++; E.blip(520+s.i*30,0.1); } },
    draw:function(E){ var s=this.s, A=this.A;
      arr(E, A, { y:E.H*0.42, idx:true, hl:function(i){
        if(i===s.i-1 && A[i]===s.max) return {fill:'rgba(255,178,122,0.3)',stroke:'#ffb27a',text:'#ffb27a',tag:'최대!'};
        if(i<s.i && A[i]===s.max) return {fill:'rgba(255,178,122,0.2)',stroke:'#ffb27a',text:'#ffb27a',tag:'max'};
        if(i===s.i) return {fill:'rgba(143,227,181,0.25)',stroke:'#8fe3b5',text:'#8fe3b5',tag:'보는 중'};
        return null; } });
      var done=s.i>=A.length;
      if(!done) E.tapHint(E.W/2, E.H*0.62, s.i===0?'▶ 한 단계씩 실행':'▶ 다음 단계', true);
      else E.tapHint(E.W/2, E.H*0.62, '↻ 처음부터', false);
      E.big(done?('최댓값 = '+s.max+' (5단계로 완료)'):('현재까지 최댓값: '+(s.max<-90?'—':s.max)), '알고리즘 = 문제를 푸는 명확한 단계들. "최댓값 찾기": 하나씩 보며 더 큰 값을 기억'); }
  },

  // ══════════ 1.2 효율성 — 같은 답, 다른 비용 ══════════
  { id:'algo1_02',
    enter:function(E){ this.s={n:10}; E.setOn([]);
      E.controls('<div class="ctrl"><label>n (1+2+…+n)</label><input type="range" id="nn" min="5" max="100" step="5" value="10"><output id="nno">10</output></div>');
      var self=this; E.bind('#nn','input',function(e){ self.s.n=+e.target.value; document.getElementById('nno').textContent=e.target.value; E.blip(440,0.08); }); },
    draw:function(E){ var ctx=E.ctx, n=this.s.n, cx=E.W/2, sum=n*(n+1)/2;
      // 두 방법 카드
      function card(x,title,steps,col){ var w=E.W*0.32, h=E.H*0.30, y=E.H*0.30;
        ctx.fillStyle='rgba(255,255,255,0.03)'; ctx.strokeStyle=col; ctx.lineWidth=2;
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x-w/2,y,w,h,14);ctx.fill();ctx.stroke();}else ctx.strokeRect(x-w/2,y,w,h);
        ctx.fillStyle=col; ctx.font='600 17px sans-serif'; ctx.textAlign='center'; ctx.fillText(title, x, y+34);
        ctx.fillStyle='#cfcdc6'; ctx.font='14px sans-serif'; ctx.fillText('필요한 계산 횟수', x, y+h-46);
        ctx.fillStyle=col; ctx.font='600 30px sans-serif'; ctx.fillText(steps, x, y+h-14); }
      card(cx-E.W*0.18, '① 하나씩 더하기 (반복)', n+' 번', '#f4a0c0');
      card(cx+E.W*0.18, '② 가우스 공식 n(n+1)/2', '1 번', '#8fe3b5');
      ctx.fillStyle='#ffb27a'; ctx.font='600 18px sans-serif'; ctx.textAlign='center'; ctx.fillText('두 방법 모두 답 = '+sum, cx, E.H*0.68);
      E.big('같은 답, 다른 비용', '효율성 — 답이 같아도 계산량이 달라요! 반복은 O(n), 공식은 O(1). 수학 13장 가우스 합(#79)의 위력'); }
  },

  // ══════════ 1.3 빅오 표기법 — 성장 곡선 ══════════
  { id:'algo1_03',
    enter:function(E){ this.s={}; E.Plot.range(0,20,0,40); E.setOn([]); },
    draw:function(E){ var P=E.Plot, ctx=E.ctx; P.axes();
      P.curve(function(x){return 1;}, '#8fe3b5');                 // O(1)
      P.curve(function(x){return x>0?Math.log2(x):0;}, '#7ab8ff'); // O(log n)
      P.curve(function(x){return x;}, '#ffb27a');                 // O(n)
      P.curve(function(x){return x*x;}, '#f4a0c0');               // O(n²)
      function lab(t,col,x,y){ ctx.fillStyle=col; ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.fillText(t, P.X(x), P.Y(y)); }
      lab('O(n²)','#f4a0c0',5.5,38); lab('O(n)','#ffb27a',16,18); lab('O(log n)','#7ab8ff',14,5.4); lab('O(1)','#8fe3b5',16,2.4);
      E.big('빅오 표기법 — 입력 n이 커지면?', '복잡도 = 입력이 커질 때 계산량이 자라는 속도. 곡선 기울기가 곧 효율! (수학 5·7장 함수 성장)'); }
  },

  // ══════════ 1.3 O(log n)의 마법 — 반으로 줄이기 ══════════
  { id:'algo1_04',
    enter:function(E){ this.s={n:64}; E.setOn([]);
      E.controls('<div class="ctrl"><label>후보 개수 n</label><input type="range" id="nn" min="2" max="1024" step="1" value="64"><output id="nno">64</output></div>');
      var self=this; E.bind('#nn','input',function(e){ self.s.n=+e.target.value; document.getElementById('nno').textContent=e.target.value; E.blip(440,0.08); }); },
    draw:function(E){ var ctx=E.ctx, n=this.s.n, cx=E.W/2, y0=E.H*0.26, steps=Math.ceil(Math.log2(n)),
        cur=n, x=cx-E.W*0.30, bw=E.W*0.60, k=0;
      ctx.font='13px sans-serif'; ctx.textAlign='left';
      while(cur>=1 && k<=steps){ var w=bw*cur/n, yy=y0+k*30;
        ctx.fillStyle=k===steps?'rgba(255,178,122,0.4)':'rgba(122,184,255,0.22)'; ctx.strokeStyle=k===steps?'#ffb27a':'#7ab8ff'; ctx.lineWidth=1.5;
        if(w>2){ ctx.fillRect(x,yy,Math.max(w,3),22); ctx.strokeRect(x,yy,Math.max(w,3),22); }
        ctx.fillStyle='#9b99a3'; ctx.fillText((k+1)+'단계: '+Math.max(1,Math.round(cur))+'개 남음', x+bw+12, yy+15);
        if(cur<=1) break; cur=cur/2; k++; }
      E.big('n = '+n+' →  약 '+steps+'단계면 끝!', '★O(log n) — 매번 절반씩 버리면 백만 개도 ~20단계! 로그(수학 7장)의 위력 = 이분 탐색(4장)의 비밀'); }
  },

  // ══════════ 1.3 복잡도 등급 한눈에 ══════════
  { id:'algo1_05',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, cx=E.W/2, y0=E.H*0.20, rh=Math.min(46,E.H*0.085), n=1000,
        rows=[['O(1)','상수','1','#8fe3b5'],['O(log n)','로그','~10','#7ab8ff'],['O(n)','선형','1,000','#cfcdc6'],['O(n log n)','선형로그','~10,000','#ffb27a'],['O(n²)','제곱','1,000,000','#f4a0c0'],['O(2ⁿ)','지수','천문학적','#e24b4a']];
      ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillStyle='#6f6e7a';
      ctx.fillText('n = 1,000 일 때 대략 계산 횟수', cx-E.W*0.26, y0-16);
      for(var i=0;i<rows.length;i++){ var y=y0+i*rh, r=rows[i], bw=Math.min(E.W*0.30, 30+i*i*8);
        ctx.fillStyle=r[3].replace(')',',0.22)').replace('#','rgba('); ctx.fillStyle='rgba(255,255,255,0.03)';
        ctx.fillStyle=r[3]; ctx.font='600 17px sans-serif'; ctx.fillText(r[0], cx-E.W*0.26, y+18);
        ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.fillText(r[1], cx-E.W*0.13, y+18);
        // 막대
        ctx.fillStyle=r[3].replace(')',',0.3)').replace('rgb','rgba'); ctx.fillStyle=r[3]; ctx.globalAlpha=0.5; ctx.fillRect(cx-E.W*0.02, y+2, Math.min(E.W*0.22, 8+i*i*7), rh-12); ctx.globalAlpha=1;
        ctx.fillStyle='#dfeefb'; ctx.font='600 14px sans-serif'; ctx.textAlign='right'; ctx.fillText(r[2], cx+E.W*0.30, y+18); ctx.textAlign='left'; }
      E.big('복잡도 등급 — 빠른 순서', 'O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ). 좋은 알고리즘 = 위쪽 등급으로!'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
