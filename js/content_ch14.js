/* 제14장 극한 — 14.1 수렴·발산 · 14.2 극한의 계산 · 14.3 무한급수
   동작(behavior)만. 텍스트는 content/ch14.json */
(function(){

  var scenes=[

  // ══════════ 14.1 수렴·발산 ══════════
  // 14.1a 수열의 수렴
  { id:'ch14_01',
    enter:function(E){ this.s={N:6}; E.Plot.range(0,13,0,3);
      E.controls('<div class="ctrl"><label>항의 개수 N</label><input type="range" id="nn" min="2" max="12" step="1" value="6"><output id="nno">6</output></div>');
      var self=this; E.bind('#nn','input',function(e){ self.s.N=+e.target.value; document.getElementById('nno').textContent=e.target.value; E.blip(420+self.s.N*20,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, N=this.s.N, ctx=E.ctx; P.axes();
      // 극한선 y=1 + ε밴드
      var eps=0.15; ctx.fillStyle='rgba(255,178,122,0.12)'; ctx.fillRect(P.X(0),P.Y(1+eps),P.X(13)-P.X(0),P.Y(1-eps)-P.Y(1+eps));
      ctx.strokeStyle='#ffb27a'; ctx.lineWidth=1.5; ctx.setLineDash([6,4]); ctx.beginPath(); ctx.moveTo(P.X(0),P.Y(1)); ctx.lineTo(P.X(13),P.Y(1)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='#ffb27a'; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('극한 L = 1', P.X(10), P.Y(1)-8);
      for(var n=1;n<=N;n++){ var v=1+1/n; P.dot(n,v,'#7ab8ff'); }
      var last=1+1/N;
      E.big('aₙ = 1 + 1/n → 1', 'n이 커질수록 항이 극한 1에 한없이 가까워져요 (현재 a'+N+'='+last.toFixed(3)+') = 수렴'); }
  },

  // 14.1b 발산 · 진동
  { id:'ch14_02',
    enter:function(E){ this.s={mode:0}; E.Plot.range(0,13,-2,5); E.setOn([]); },
    tap:function(E){ this.s.mode=(this.s.mode+1)%2; E.blip(this.s.mode?300:520,0.15); },
    draw:function(E){ var P=E.Plot, m=this.s.mode, ctx=E.ctx; P.axes();
      for(var n=1;n<=12;n++){ var v = m===0 ? n*0.35 : (n%2===0?1:-1);
        if(v>=P.ymin&&v<=P.ymax) P.dot(n,v, m===0?'#f4a0c0':'#8fe3b5'); }
      E.tapHint(E.W/2, P.geom().bot+40, '▶ 발산 / 진동 바꾸기', true);
      E.big(m===0?'aₙ = n/3 → ∞  (발산)':'aₙ = (−1)ⁿ  (진동)', m===0?'한없이 커져 한 값에 머물지 않아요 = 발산':'두 값 사이를 오가 극한이 없어요 = 진동(발산)'); }
  },

  // ══════════ 14.2 극한의 계산 ══════════
  // 14.2a 함수의 극한 — 0/0 구멍
  { id:'ch14_03',
    enter:function(E){ this.s={}; E.Plot.range(-2,4,-1,5); E.setOn([]); },
    draw:function(E){ var P=E.Plot, ctx=E.ctx; P.axes();
      // y=(x²-1)/(x-1) = x+1 (x≠1)
      P.curve(function(x){ return x+1; }, '#7ab8ff');
      // x=1 에서 구멍(빈 원)
      ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2; ctx.fillStyle='#0b0b10';
      ctx.beginPath(); ctx.arc(P.X(1),P.Y(2),6,0,7); ctx.fill(); ctx.stroke();
      // 양쪽에서 접근 화살표
      ctx.fillStyle='#ffb27a'; ctx.font='13px sans-serif'; ctx.textAlign='center';
      P.dot(0.4,1.4,'#8fe3b5'); P.dot(1.6,2.6,'#8fe3b5');
      ctx.strokeStyle='rgba(255,178,122,0.7)'; ctx.lineWidth=1.5; ctx.setLineDash([3,3]);
      ctx.beginPath(); ctx.moveTo(P.X(1),P.Y(2)); ctx.lineTo(P.X(1),P.Y(0)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='#ffb27a'; ctx.fillText('x → 1', P.X(1), P.Y(0)-6);
      E.big('lim(x→1) (x²−1)/(x−1) = 2', 'x=1에서 0/0이라 값은 없지만(구멍), 양쪽서 다가가는 극한은 2'); }
  },

  // 14.2b lim x→∞  (1/x → 0)
  { id:'ch14_04',
    enter:function(E){ this.s={}; E.Plot.range(0,10,-0.5,4); E.setOn([]); },
    draw:function(E){ var P=E.Plot, ctx=E.ctx; P.axes();
      P.curve(function(x){ return x>0.1? 1/x : 99; }, '#7ab8ff');
      ctx.strokeStyle='rgba(255,178,122,0.6)'; ctx.lineWidth=1.5; ctx.setLineDash([6,4]); ctx.beginPath(); ctx.moveTo(P.X(0),P.Y(0)); ctx.lineTo(P.X(10),P.Y(0)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='#ffb27a'; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('점근선 y = 0', P.X(6), P.Y(0)-8);
      P.dot(2,0.5,'#8fe3b5'); P.dot(5,0.2,'#8fe3b5'); P.dot(8,0.125,'#8fe3b5');
      E.big('lim(x→∞) 1/x = 0', 'x가 무한히 커지면 1/x는 0에 한없이 가까워져요 (점근선)'); }
  },

  // ══════════ 14.3 e의 정의 ══════════
  { id:'ch14_05',
    enter:function(E){ this.s={k:1}; E.Plot.range(0,7,0,3.2);
      E.controls('<div class="ctrl"><label>n = 2^</label><input type="range" id="ek" min="0" max="7" step="1" value="1"><output id="eko">2</output></div>');
      var self=this; E.bind('#ek','input',function(e){ self.s.k=+e.target.value; document.getElementById('eko').textContent=Math.pow(2,self.s.k); E.blip(440,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, k=this.s.k, ctx=E.ctx; P.axes();
      // 극한선 e
      ctx.strokeStyle='#ffb27a'; ctx.lineWidth=1.5; ctx.setLineDash([6,4]); ctx.beginPath(); ctx.moveTo(P.X(0),P.Y(Math.E)); ctx.lineTo(P.X(7),P.Y(Math.E)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='#ffb27a'; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('e ≈ 2.718', P.X(4.5), P.Y(Math.E)-8);
      for(var j=0;j<=k;j++){ var n=Math.pow(2,j), v=Math.pow(1+1/n,n); P.dot(j+0.5,v,'#7ab8ff'); }
      var n=Math.pow(2,k), val=Math.pow(1+1/n,n);
      E.big('(1 + 1/'+n+')^'+n+' = '+val.toFixed(4), 'n→∞이면 (1+1/n)ⁿ → e ≈ 2.71828… (자연상수, 7장 지수·17장 미분의 핵심)'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
