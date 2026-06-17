/* 제23장 수론 — 23.1 산술의 기본정리 · 23.2 합동식
   동작(behavior)만. 텍스트는 content/ch23.json */
(function(){
  var TAU=Math.PI*2;
  function primeFactors(n){ var f=[], d=2; while(d*d<=n){ while(n%d===0){ f.push(d); n/=d; } d++; } if(n>1)f.push(n); return f; }
  function gcd(a,b){ return b?gcd(b,a%b):a; }

  var scenes=[

  // ══════════ 23.1 소인수분해 = 산술의 기본정리 ══════════
  { id:'ch23_01',
    enter:function(E){ this.s={n:60}; E.setOn([]);
      E.controls('<div class="ctrl"><label>수 n</label><input type="range" id="nn" min="12" max="96" step="1" value="60"><output id="nno">60</output></div>');
      var self=this; E.bind('#nn','input',function(e){ self.s.n=+e.target.value; document.getElementById('nno').textContent=e.target.value; E.blip(420+self.s.n,0.08); }); },
    draw:function(E){ var ctx=E.ctx, n=this.s.n, fs=primeFactors(n), cx=E.W/2, y=E.H*0.42;
      // 소수 블록
      var bw=52, gap=14, total=fs.length*bw+(fs.length-1)*gap, x0=cx-total/2;
      for(var i=0;i<fs.length;i++){ var x=x0+i*(bw+gap);
        ctx.fillStyle='rgba(143,227,181,0.22)'; ctx.strokeStyle='#8fe3b5'; ctx.lineWidth=2;
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,bw,bw,10);ctx.fill();ctx.stroke();}else{ctx.fillRect(x,y,bw,bw);ctx.strokeRect(x,y,bw,bw);}
        ctx.fillStyle='#8fe3b5'; ctx.font='600 22px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(fs[i], x+bw/2, y+bw/2); ctx.textBaseline='alphabetic';
        if(i<fs.length-1){ ctx.fillStyle='#9b99a3'; ctx.font='600 20px sans-serif'; ctx.fillText('×', x+bw+gap/2, y+bw/2+7); } }
      // 지수 표기
      var counts={}; fs.forEach(function(p){counts[p]=(counts[p]||0)+1;});
      var expr=Object.keys(counts).map(function(p){return counts[p]>1?p+'^'+counts[p]:p;}).join(' × ');
      E.big(n+' = '+expr, '산술의 기본정리 — 모든 자연수는 소수의 곱으로 단 한 가지로! (1장 소수 #16, 소수=수의 원자)'); }
  },

  // ══════════ 23.2 유클리드 호제법 ══════════
  { id:'ch23_02',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, a=48, b=36, cx=E.W/2, y=E.H*0.30;
      ctx.fillStyle='#cfcdc6'; ctx.font='600 17px sans-serif'; ctx.textAlign='center';
      var steps=[], x=a, yv=b; while(yv>0){ var q=Math.floor(x/yv), r=x%yv; steps.push(x+' = '+q+'×'+yv+' + '+r); x=yv; yv=r; }
      for(var i=0;i<steps.length;i++){ ctx.fillStyle=i===steps.length-1?'#ffb27a':'#cfcdc6'; ctx.fillText(steps[i], cx, y+i*40); }
      ctx.fillStyle='#8fe3b5'; ctx.font='600 15px sans-serif'; ctx.fillText('나머지가 0이 될 때의 나눈 수 = 최대공약수', cx, y+steps.length*40+24);
      E.big('gcd(48, 36) = '+gcd(48,36), '유클리드 호제법 — 큰 수를 작은 수로 나눈 나머지로 계속 바꿉니다. 가장 오래된 알고리즘!'); }
  },

  // ══════════ 23.2 합동식 (시계 산술) ══════════
  { id:'ch23_03',
    enter:function(E){ this.s={n:17}; E.setOn([]);
      E.controls('<div class="ctrl"><label>수 (mod 12)</label><input type="range" id="nn" min="0" max="36" step="1" value="17"><output id="nno">17</output></div>');
      var self=this; E.bind('#nn','input',function(e){ self.s.n=+e.target.value; document.getElementById('nno').textContent=e.target.value; E.blip(440,0.1); }); },
    draw:function(E){ var ctx=E.ctx, n=this.s.n, m=12, r=n%m, cx=E.W/2, cy=E.H*0.42, R=Math.min(E.H*0.24,E.W*0.18);
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(cx,cy,R,0,TAU); ctx.stroke();
      for(var i=0;i<m;i++){ var t=-Math.PI/2 + i*TAU/m, x=cx+R*Math.cos(t), y=cy+R*Math.sin(t), on=(i===r);
        ctx.fillStyle=on?'#ffb27a':'#6f6e7a'; ctx.font=on?'600 16px sans-serif':'13px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(i, x, y); ctx.textBaseline='alphabetic';
        if(on){ ctx.strokeStyle='#ffb27a'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(x,y,14,0,TAU); ctx.stroke(); } }
      // 바늘
      var tt=-Math.PI/2 + r*TAU/m; ctx.strokeStyle='#ffb27a'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+R*0.7*Math.cos(tt),cy+R*0.7*Math.sin(tt)); ctx.stroke();
      E.big(n+' ≡ '+r+'  (mod 12)', '합동식 = 시계 산술! 12로 나눈 나머지가 같으면 합동. '+n+'시는 '+r+'시와 같습니다'); }
  },

  // ══════════ 23.2 합동의 응용 (거듭제곱 주기) ══════════
  { id:'ch23_04',
    enter:function(E){ this.s={k:1}; E.setOn([]);
      E.controls('<div class="ctrl"><label>지수 k (3^k의 일의자리)</label><input type="range" id="kk" min="1" max="12" step="1" value="1"><output id="kko">1</output></div>');
      var self=this; E.bind('#kk','input',function(e){ self.s.k=+e.target.value; document.getElementById('kko').textContent=e.target.value; E.blip(440,0.1); }); },
    draw:function(E){ var ctx=E.ctx, k=this.s.k, cx=E.W/2, y=E.H*0.42;
      var cyc=[3,9,7,1]; // 3^k mod 10
      var bw=56, gap=12, total=4*bw+3*gap, x0=cx-total/2;
      for(var i=0;i<4;i++){ var on=((k-1)%4===i), x=x0+i*(bw+gap);
        ctx.fillStyle=on?'rgba(255,178,122,0.25)':'rgba(122,184,255,0.12)'; ctx.strokeStyle=on?'#ffb27a':'#7ab8ff'; ctx.lineWidth=2;
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,bw,bw,10);ctx.fill();ctx.stroke();}else{ctx.fillRect(x,y,bw,bw);ctx.strokeRect(x,y,bw,bw);}
        ctx.fillStyle=on?'#ffb27a':'#cfcdc6'; ctx.font='600 22px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(cyc[i], x+bw/2, y+bw/2); ctx.textBaseline='alphabetic';
        ctx.fillStyle='#8a8893'; ctx.font='11px sans-serif'; ctx.fillText('3^'+(i+1), x+bw/2, y+bw+16); }
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('↻ 4개마다 반복 (주기 4)', cx, y+bw+44);
      var last=cyc[(k-1)%4];
      E.big('3^'+k+' 의 일의 자리 = '+last, '합동 응용 — 일의 자리는 3,9,7,1 주기4로 반복. 3^100의 일의자리도 즉시! (암호·RSA의 토대)'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
