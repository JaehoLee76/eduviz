/* 제13장 수열 — 13.1 수열과 그 합 · 13.2 수학적 귀납법
   동작(behavior)만. 텍스트는 content/ch13.json */
(function(){
  var TAU=Math.PI*2;

  var scenes=[

  // ══════════ 13.1 수열과 그 합 ══════════
  // 13.1a 등차수열
  { id:'ch13_01',
    enter:function(E){ this.s={d:2}; E.setOn([]);
      E.controls('<div class="ctrl"><label>공차 d</label><input type="range" id="dd" min="-2" max="3" step="1" value="2"><output id="ddo">2</output></div>');
      var self=this; E.bind('#dd','input',function(e){ self.s.d=+e.target.value; document.getElementById('ddo').textContent=e.target.value; E.blip(360+self.s.d*60,0.1); }); },
    draw:function(E){ var ctx=E.ctx, d=this.s.d, a1=2, N=8, baseY=E.H*0.70, x0=E.W*0.18, gap=(E.W*0.64)/N, unit=22;
      ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(x0-20,baseY); ctx.lineTo(x0+gap*N,baseY); ctx.stroke();
      var terms=[];
      for(var n=0;n<N;n++){ var v=a1+n*d, h=v*unit, x=x0+n*gap; terms.push(v);
        ctx.fillStyle='rgba(122,184,255,0.3)'; ctx.fillRect(x, baseY-h, gap*0.6, h);
        ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=1.5; ctx.strokeRect(x, baseY-h, gap*0.6, h);
        ctx.fillStyle='#cfcdc6'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText(v, x+gap*0.3, baseY-h-8);
        if(n>0){ ctx.fillStyle='#ffb27a'; ctx.font='11px sans-serif'; ctx.fillText((d>=0?'+':'')+d, x-gap*0.2, baseY-h+18); } }
      E.big('aₙ = 2 + (n−1)·('+d+')', '등차수열 — 일정한 양 d씩 더해 갑니다 (계단처럼 일정한 기울기)'); }
  },

  // 13.1b 등비수열 (7장 지수 회수)
  { id:'ch13_02',
    enter:function(E){ this.s={r:2}; E.setOn([]);
      E.controls('<div class="ctrl"><label>공비 r</label><input type="range" id="rr" min="0.5" max="2" step="0.5" value="2"><output id="rro">2</output></div>');
      var self=this; E.bind('#rr','input',function(e){ self.s.r=+e.target.value; document.getElementById('rro').textContent=(+e.target.value); E.blip(360+self.s.r*120,0.1); }); },
    draw:function(E){ var ctx=E.ctx, r=this.s.r, a1=1, N=8, baseY=E.H*0.70, x0=E.W*0.18, gap=(E.W*0.64)/N;
      ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(x0-20,baseY); ctx.lineTo(x0+gap*N,baseY); ctx.stroke();
      var maxH=E.H*0.42, last=a1*Math.pow(r,N-1), unit=maxH/Math.max(last,4);
      for(var n=0;n<N;n++){ var v=a1*Math.pow(r,n), h=v*unit, x=x0+n*gap;
        ctx.fillStyle='rgba(143,227,181,0.3)'; ctx.fillRect(x, baseY-h, gap*0.6, h);
        ctx.strokeStyle='#8fe3b5'; ctx.lineWidth=1.5; ctx.strokeRect(x, baseY-h, gap*0.6, h);
        ctx.fillStyle='#cfcdc6'; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText(v%1===0?v:v.toFixed(2), x+gap*0.3, baseY-h-7); }
      E.big('aₙ = 1 · ('+r+')ⁿ⁻¹', r>1?'등비수열 — 일정 배율 r씩 곱해 폭발 성장 (7장 지수함수!)':'r<1이면 점점 작아집니다 (지수 감쇠)'); }
  },

  // 13.1c 등차수열의 합 — 가우스 짝짓기
  { id:'ch13_03',
    enter:function(E){ this.s={n:6}; E.setOn([]);
      E.controls('<div class="ctrl"><label>n 까지 합</label><input type="range" id="nn" min="3" max="9" step="1" value="6"><output id="nno">6</output></div>');
      var self=this; E.bind('#nn','input',function(e){ self.s.n=+e.target.value; document.getElementById('nno').textContent=e.target.value; E.blip(440,0.1); }); },
    draw:function(E){ var ctx=E.ctx, n=this.s.n, cell=Math.min(34, (E.W*0.5)/n), x0=E.W/2-(n*cell)/2, baseY=E.H*0.66;
      // 오름 계단(파랑) + 내림 계단(주황) = 직사각형 n×(n+1)
      for(var i=0;i<n;i++){ var hUp=(i+1), hDn=(n-i);
        for(var j=0;j<hUp;j++){ ctx.fillStyle='rgba(122,184,255,0.4)'; ctx.fillRect(x0+i*cell, baseY-(j+1)*cell, cell-2, cell-2); }
        for(var k2=0;k2<hDn;k2++){ ctx.fillStyle='rgba(255,178,122,0.35)'; ctx.fillRect(x0+i*cell, baseY-(hUp+k2+1)*cell, cell-2, cell-2); } }
      ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=2; ctx.strokeRect(x0, baseY-(n+1)*cell, n*cell, (n+1)*cell);
      var sum=n*(n+1)/2;
      E.big('1 + 2 + … + '+n+' = '+n+'·'+(n+1)+'/2 = '+sum, '오름+내림 계단 = 직사각형 n×(n+1) → 합은 그 절반 (가우스!)'); }
  },

  // 13.1d 무한등비급수 — 14장 극한 예고
  { id:'ch13_04',
    enter:function(E){ this.s={k:1}; E.setOn([]); },
    tap:function(E){ if(this.s.k<10) this.s.k++; else this.s.k=1; E.blip(500+this.s.k*40,0.12); },
    draw:function(E){ var ctx=E.ctx, k=this.s.k, L=E.W*0.64, x0=E.W*0.18, y=E.H*0.46, hh=46;
      // 전체 길이 1 (목표)
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1.5; ctx.strokeRect(x0,y,L,hh);
      var sum=0, cur=0.5, px=x0, cols=['#7ab8ff','#8fe3b5','#ffb27a','#f4a0c0'];
      for(var i=0;i<k;i++){ var w=cur*L; ctx.fillStyle=cols[i%4].replace(')',',0.5)').replace('#','rgba(')==cols[i%4]?cols[i%4]:cols[i%4];
        ctx.globalAlpha=0.45; ctx.fillStyle=cols[i%4]; ctx.fillRect(px,y,w,hh); ctx.globalAlpha=1;
        ctx.strokeStyle=cols[i%4]; ctx.lineWidth=1; ctx.strokeRect(px,y,w,hh);
        if(w>26){ ctx.fillStyle='#fff'; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('1/'+Math.pow(2,i+1), px+w/2, y+hh/2+4); }
        sum+=cur; px+=w; cur/=2; }
      E.tapHint(E.W/2, y+hh+44, '▶ 항 더하기 ('+k+'개)', true);
      E.big('1/2 + 1/4 + … = '+sum.toFixed(4)+' → 1', '무한히 더해도 1을 넘지 않고 다가갑니다 — 합이 수렴! (14장 극한 예고)'); }
  },

  // ══════════ 13.2 수학적 귀납법 ══════════
  // 도미노
  { id:'ch13_05',
    enter:function(E){ this.s={fall:0,play:false}; E.setOn([]); },
    tap:function(E){ if(this.s.play)return; if(this.s.fall>=8){ this.s.fall=0; E.blip(340,0.12); } else { this.s.play=true; E.blip(560,0.15); } },
    draw:function(E){ var s=this.s, ctx=E.ctx, N=8, baseY=E.H*0.62, x0=E.W*0.18, gap=(E.W*0.64)/N, dw=14, dh=64;
      if(s.play){ s.fall+=0.08; if(s.fall>=N){ s.fall=N; s.play=false; } }
      for(var i=0;i<N;i++){ var x=x0+i*gap+gap/2;
        var lean=Math.max(0,Math.min(1, s.fall-i)); var ang=lean*Math.PI*0.42;
        ctx.save(); ctx.translate(x,baseY); ctx.rotate(-ang);
        ctx.fillStyle = (i===0)?'#ffb27a':(lean>=1?'rgba(143,227,181,0.85)':'rgba(122,184,255,0.8)');
        ctx.fillRect(-dw/2,-dh,dw,dh);
        ctx.restore();
        ctx.fillStyle='#6f6e7a'; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('P('+(i+1)+')', x, baseY+16); }
      ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(x0,baseY); ctx.lineTo(x0+gap*N,baseY); ctx.stroke();
      if(s.fall===0&&!s.play) E.tapHint(E.W/2, baseY+50, '▶ 첫 도미노 밀기 P(1)', true);
      else if(s.fall>=N&&!s.play) E.tapHint(E.W/2, baseY+50, '↻ 다시 세우기', false);
      E.big('P(1) 참 + [P(k) → P(k+1)] ⟹ 모든 n 에서 참', '수학적 귀납법 = 도미노! 첫 개를 넘기고, 다음을 넘긴다는 규칙이면 전부 넘어갑니다'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
