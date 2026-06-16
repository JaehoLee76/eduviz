/* 알고리즘 제1장 알고리즘과 복잡도 — VIZ 포맷
   algo1_01: 코드+스텝(최댓값 찾기). 나머지: concept(오른쪽 핵심요약 + 왼쪽 인터랙티브 시각화).
   텍스트는 content/algo1.json. */
(function(){
  var BLU='#7ab8ff', ORA='#ffb27a', GRN='#8fe3b5', PNK='#f4a0c0';
  var A=[3,7,2,8,5];

  var scenes=[

  // ══════════ 1.1 알고리즘이란 — 최댓값 찾기 (코드+스텝) ══════════
  { id:'algo1_01',
    code:[
      'int findMax(int a[], int n) {',
      '  int max = a[0];',
      '  for (int i = 1; i < n; i++) {',
      '    if (a[i] > max)',
      '      max = a[i];',
      '  }',
      '  return max;',
      '}'
    ],
    build:function(V){ var n=A.length, max=A[0], mi=0, st=[];
      st.push({line:1, cap:'첫 값을 최댓값 후보로: max = <b>'+A[0]+'</b>', scan:0, maxIdx:0});
      for(var i=1;i<n;i++){
        st.push({line:3, cap:'비교: a['+i+']=<b>'+A[i]+'</b> > max '+max+' ?', scan:i, maxIdx:mi});
        if(A[i]>max){ max=A[i]; mi=i; st.push({line:4, cap:'더 큼 → max 를 <b>'+A[i]+'</b> 로 갱신', scan:i, maxIdx:mi, upd:true}); }
      }
      st.push({line:6, cap:'끝! 최댓값 = <b>'+max+'</b>. n개를 한 번씩 훑음 = <b>O(n)</b>', maxIdx:mi, done:true});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx, MAXV=Math.max.apply(null,A), maxH=V.H*0.40, baseY=V.H*0.64;
      var info=AV.bars(V, A, { baseY:baseY, maxH:maxH, label:true, bw:60, gap:18, hl:function(k){
        if(k===f.maxIdx) return ORA; if(k===f.scan&&f.found==null&&!f.done) return GRN; return BLU; } });
      // 현재 최대 높이 가로 점선 + 라벨 → "가장 큰 값"이 시각적으로 명확
      if(f.maxIdx!=null && f.maxIdx>=0){ var mv=A[f.maxIdx], ly=baseY-(mv/MAXV)*maxH, rightX=info.x0+A.length*(info.bw+info.gap)-info.gap;
        ctx.strokeStyle=ORA; ctx.lineWidth=1.5; ctx.setLineDash([6,5]); ctx.beginPath(); ctx.moveTo(info.x0-24, ly); ctx.lineTo(rightX+10, ly); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle=ORA; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('지금까지 최대 = '+mv, info.x0-24, ly-9);
        var mx=info.x0+f.maxIdx*(info.bw+info.gap)+info.bw/2; ctx.textAlign='center'; ctx.fillText('▲ MAX', mx, ly-26); }
      if(f.scan!=null && f.scan>=0 && f.found==null && !f.done){ var sx=info.x0+f.scan*(info.bw+info.gap)+info.bw/2; ctx.fillStyle=GRN; ctx.font='600 12px sans-serif'; ctx.textAlign='center'; ctx.fillText('보는 중', sx, baseY+34); } }
  },

  // ══════════ 1.2 효율성 — 같은 답, 다른 비용 (concept) ══════════
  { id:'algo1_02', concept:true,
    enter:function(E){ this.s={n:10}; E.setOn([]);
      E.controls('<div class="ctrl"><label>n (1+2+…+n)</label><input type="range" id="nn" min="5" max="100" step="5" value="10"><output id="nno">10</output></div>');
      var self=this; E.bind('#nn','input',function(e){ self.s.n=+e.target.value; document.getElementById('nno').textContent=e.target.value; E.blip(440,0.08); }); },
    draw:function(E){ var ctx=E.ctx, n=this.s.n, cx=E.W/2, sum=n*(n+1)/2;
      function card(x,title,steps,col){ var w=E.W*0.40, h=E.H*0.26, y=E.H*0.30;
        ctx.fillStyle='rgba(255,255,255,0.03)'; ctx.strokeStyle=col; ctx.lineWidth=2;
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x-w/2,y,w,h,14);ctx.fill();ctx.stroke();}else ctx.strokeRect(x-w/2,y,w,h);
        ctx.fillStyle=col; ctx.font='600 15px sans-serif'; ctx.textAlign='center'; ctx.fillText(title, x, y+30);
        ctx.fillStyle='#cfcdc6'; ctx.font='13px sans-serif'; ctx.fillText('필요한 계산 횟수', x, y+h-42);
        ctx.fillStyle=col; ctx.font='600 28px sans-serif'; ctx.fillText(steps, x, y+h-12); }
      card(cx-E.W*0.22, '① 하나씩 더하기', n+' 번', PNK);
      card(cx+E.W*0.22, '② 가우스 공식', '1 번', GRN);
      ctx.fillStyle=ORA; ctx.font='600 17px sans-serif'; ctx.textAlign='center'; ctx.fillText('두 방법 모두 답 = '+sum, cx, E.H*0.64); }
  },

  // ══════════ 1.3 빅오 — 성장 곡선 (concept) ══════════
  { id:'algo1_03', concept:true,
    enter:function(E){ this.s={}; E.Plot.range(0,20,0,40); E.setOn([]); },
    draw:function(E){ var P=E.Plot, ctx=E.ctx; P.axes();
      P.curve(function(x){return 1;}, GRN);
      P.curve(function(x){return x>0?Math.log2(x):0;}, BLU);
      P.curve(function(x){return x;}, ORA);
      P.curve(function(x){return x*x;}, PNK);
      function lab(t,col,x,y){ ctx.fillStyle=col; ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.fillText(t, P.X(x), P.Y(y)); }
      lab('O(n²)',PNK,5.5,38); lab('O(n)',ORA,16,18); lab('O(log n)',BLU,14,5.4); lab('O(1)',GRN,16,2.4); }
  },

  // ══════════ 1.3 O(log n)의 마법 (concept) ══════════
  { id:'algo1_04', concept:true,
    enter:function(E){ this.s={n:64}; E.setOn([]);
      E.controls('<div class="ctrl"><label>후보 개수 n</label><input type="range" id="nn" min="2" max="1024" step="1" value="64"><output id="nno">64</output></div>');
      var self=this; E.bind('#nn','input',function(e){ self.s.n=+e.target.value; document.getElementById('nno').textContent=e.target.value; E.blip(440,0.08); }); },
    draw:function(E){ var ctx=E.ctx, n=this.s.n, cx=E.W/2, y0=E.H*0.26, steps=Math.ceil(Math.log2(n)),
        cur=n, x=cx-E.W*0.36, bw=E.W*0.50, k=0;
      ctx.font='13px sans-serif'; ctx.textAlign='left';
      while(cur>=1 && k<=steps){ var w=bw*cur/n, yy=y0+k*32;
        ctx.fillStyle=k===steps?'rgba(255,178,122,0.4)':'rgba(122,184,255,0.22)'; ctx.strokeStyle=k===steps?ORA:BLU; ctx.lineWidth=1.5;
        if(w>2){ ctx.fillRect(x,yy,Math.max(w,3),24); ctx.strokeRect(x,yy,Math.max(w,3),24); }
        ctx.fillStyle='#9b99a3'; ctx.fillText((k+1)+'단계: '+Math.max(1,Math.round(cur))+'개 남음', x+bw+12, yy+16);
        if(cur<=1) break; cur=cur/2; k++; }
      ctx.fillStyle=ORA; ctx.font='600 18px sans-serif'; ctx.textAlign='center'; ctx.fillText('n = '+n+' → 약 '+steps+'단계면 끝!', cx, E.H*0.74); }
  },

  // ══════════ 1.3 복잡도 등급 한눈에 (concept) ══════════
  { id:'algo1_05', concept:true,
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, cx=E.W/2, y0=E.H*0.24, rh=Math.min(48,E.H*0.10),
        rows=[['O(1)','상수','1',GRN],['O(log n)','로그','~10',BLU],['O(n)','선형','1,000','#cfcdc6'],['O(n log n)','선형로그','~10,000',ORA],['O(n²)','제곱','1,000,000',PNK],['O(2ⁿ)','지수','천문학적','#e24b4a']];
      ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillStyle='#6f6e7a';
      ctx.fillText('n = 1,000 일 때 대략 계산 횟수', cx-E.W*0.32, y0-18);
      for(var i=0;i<rows.length;i++){ var y=y0+i*rh, r=rows[i];
        ctx.fillStyle=r[3]; ctx.font='600 17px sans-serif'; ctx.textAlign='left'; ctx.fillText(r[0], cx-E.W*0.32, y+18);
        ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.fillText(r[1], cx-E.W*0.16, y+18);
        ctx.fillStyle=r[3]; ctx.globalAlpha=0.5; ctx.fillRect(cx-E.W*0.02, y+2, Math.min(E.W*0.26, 8+i*i*8), rh-14); ctx.globalAlpha=1;
        ctx.fillStyle='#dfeefb'; ctx.font='600 14px sans-serif'; ctx.textAlign='right'; ctx.fillText(r[2], cx+E.W*0.34, y+18); ctx.textAlign='left'; } }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
