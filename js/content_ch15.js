/* 제15장 순열·조합 — 15.1 순열 · 15.2 조합 · 15.3 이항정리
   동작(behavior)만. 텍스트는 content/ch15.json */
(function(){
  function fact(n){ var f=1; for(var i=2;i<=n;i++) f*=i; return f; }
  function nPr(n,r){ return fact(n)/fact(n-r); }
  function nCr(n,r){ return nPr(n,r)/fact(r); }

  var scenes=[

  // ══════════ 15.1 경우의 수·순열 ══════════
  // 15.1a 곱의 법칙 (나무그림)
  { id:'ch15_01',
    enter:function(E){ this.s={m:2,n:3}; E.setOn([]);
      E.controls('<div class="ctrl"><label>상의 수 m</label><input type="range" id="lm" min="1" max="4" step="1" value="2"><output id="lmo">2</output></div>'+
                 '<div class="ctrl"><label>하의 수 n</label><input type="range" id="ln" min="1" max="4" step="1" value="3"><output id="lno">3</output></div>');
      var self=this;
      E.bind('#lm','input',function(e){ self.s.m=+e.target.value; document.getElementById('lmo').textContent=e.target.value; E.blip(440,0.1); });
      E.bind('#ln','input',function(e){ self.s.n=+e.target.value; document.getElementById('lno').textContent=e.target.value; E.blip(500,0.1); }); },
    draw:function(E){ var ctx=E.ctx, m=this.s.m, n=this.s.n, rootX=E.W*0.16, rootY=E.H*0.50;
      var tops=['셔츠A','셔츠B','셔츠C','셔츠D'], bots=['청','반','치','코'];
      ctx.fillStyle='#ffb27a'; ctx.beginPath(); ctx.arc(rootX,rootY,8,0,7); ctx.fill();
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('시작', rootX, rootY-16);
      ctx.font='12px sans-serif'; ctx.textAlign='left';
      var midX=E.W*0.42, leafX=E.W*0.66, cnt=0;
      var topSpan=E.H*0.60, leafSpan=topSpan/m*0.9;   // 잎이 겹치지 않도록 가지 폭에 맞춰 분배
      for(var i=0;i<m;i++){ var ty = m===1 ? rootY : rootY-topSpan/2 + i*(topSpan/(m-1));
        ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(rootX,rootY); ctx.lineTo(midX,ty); ctx.stroke();
        ctx.fillStyle='#7ab8ff'; ctx.beginPath(); ctx.arc(midX,ty,6,0,7); ctx.fill(); ctx.fillText(tops[i], midX-46, ty+4);
        for(var j=0;j<n;j++){ var ly = n===1 ? ty : ty-leafSpan/2 + j*(leafSpan/(n-1));
          ctx.strokeStyle='rgba(143,227,181,0.7)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(midX,ty); ctx.lineTo(leafX,ly); ctx.stroke();
          ctx.fillStyle='#8fe3b5'; ctx.beginPath(); ctx.arc(leafX,ly,5,0,7); ctx.fill();
          ctx.fillStyle='#cfcdc6'; ctx.fillText(tops[i].slice(-1)+'+'+bots[j], leafX+10, ly+4); cnt++; } }
      // 골든룰: 표시값 = 실제로 그린 잎 개수
      E.big(m+' × '+n+' = '+cnt+' 가지', '곱의 법칙 — 상의 '+m+'가지 각각에 하의 '+n+'가지 → 잎 '+cnt+'개가 모든 옷차림'); }
  },

  // 15.1b 순열 nPr (순서 있음)
  { id:'ch15_02',
    enter:function(E){ this.s={r:2}; E.setOn([]);
      E.controls('<div class="ctrl"><label>뽑는 수 r (4명 중)</label><input type="range" id="rr" min="1" max="4" step="1" value="2"><output id="rro">2</output></div>');
      var self=this; E.bind('#rr','input',function(e){ self.s.r=+e.target.value; document.getElementById('rro').textContent=e.target.value; E.blip(440,0.1); }); },
    draw:function(E){ var ctx=E.ctx, r=this.s.r, n=4, bw=80, gap=24, totalW=r*bw+(r-1)*gap, x0=E.W/2-totalW/2, y=E.H*0.46;
      var choices=[]; for(var i=0;i<r;i++){ var c=n-i;
        ctx.fillStyle='rgba(122,184,255,0.18)'; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2;
        var x=x0+i*(bw+gap); ctx.fillRect(x,y,bw,70); ctx.strokeRect(x,y,bw,70);
        ctx.fillStyle='#7ab8ff'; ctx.font='600 26px sans-serif'; ctx.textAlign='center'; ctx.fillText(c, x+bw/2, y+44);
        ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif'; ctx.fillText((i+1)+'번 자리', x+bw/2, y+90); choices.push(c);
        if(i<r-1){ ctx.fillStyle='#ffb27a'; ctx.font='600 22px sans-serif'; ctx.fillText('×', x+bw+gap/2, y+44); } }
      E.big('₄P'+r+' = '+choices.join('×')+' = '+nPr(n,r), '순열 = 순서 있게 뽑기. 칸을 채울수록 선택지가 하나씩 줄어듭니다 (n!/(n−r)!)'); }
  },

  // ══════════ 15.2 조합 ══════════
  { id:'ch15_03',
    enter:function(E){ this.s={n:4,r:2}; E.setOn([]);
      E.controls('<div class="ctrl"><label>전체 수 n</label><input type="range" id="cn" min="2" max="5" step="1" value="4"><output id="cno">4</output></div>'+
                 '<div class="ctrl"><label>뽑는 수 r</label><input type="range" id="cr" min="0" max="5" step="1" value="2"><output id="cro">2</output></div>');
      var self=this;
      E.bind('#cn','input',function(e){ self.s.n=+e.target.value; if(self.s.r>self.s.n) self.s.r=self.s.n; document.getElementById('cno').textContent=e.target.value; document.getElementById('cro').textContent=self.s.r; E.blip(440,0.1); });
      E.bind('#cr','input',function(e){ var v=+e.target.value; if(v>self.s.n) v=self.s.n; self.s.r=v; e.target.value=v; document.getElementById('cro').textContent=v; E.blip(500,0.1); }); },
    draw:function(E){ var ctx=E.ctx, n=this.s.n, r=this.s.r, cx=E.W/2, names='ABCDE'.split('');
      // 모든 r-순열을 실제로 생성 (집합/곱 동기) → 같은 묶음(조합) r!개가 1개로 접힘을 시각화
      function perms(arr){ if(arr.length<=1) return [arr.slice()]; var out=[]; for(var i=0;i<arr.length;i++){ var rest=arr.slice(0,i).concat(arr.slice(i+1)); var sub=perms(rest); for(var s=0;s<sub.length;s++) out.push([arr[i]].concat(sub[s])); } return out; }
      var rep = names.slice(0,r);                  // 대표 한 조합 {앞 r명}
      var pl  = (r>=1 && r<=n) ? perms(rep) : [];   // 그 조합의 순열 r!개 (실제 나열)
      var rf  = fact(r);
      // 상단: 대표 조합 한 묶음(둥근 박스)
      var topY=E.H*0.26;
      ctx.font='600 18px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif'; ctx.fillText('대표 한 조합  { '+(rep.join(', ')||'∅')+' }', cx, topY-34);
      ctx.font='600 18px sans-serif';
      var gw=Math.min(40,E.H*0.07), gtot=r*gw+(r-1)*10, gx0=cx-gtot/2;
      for(var i=0;i<r;i++){ var x=gx0+i*(gw+10)+gw/2;
        ctx.fillStyle='rgba(255,178,122,0.85)'; ctx.beginPath(); ctx.arc(x,topY,gw/2,0,7); ctx.fill();
        ctx.fillStyle='#1a1a22'; ctx.fillText(rep[i],x,topY); }
      // 가운데: 이 한 조합에서 나오는 순열 r!개를 나란히 (AB, BA …) — 모두 화살표로 위 묶음에 모임(접힘)
      var rowY=E.H*0.56, cw=Math.min(74,E.W/(Math.max(pl.length,1)+1));
      var ptot=pl.length*cw, px0=cx-ptot/2;
      var pulse=E.blink ? E.blink() : 1;
      for(var p=0;p<pl.length;p++){ var x=px0+p*cw+cw/2;
        ctx.fillStyle='rgba(122,184,255,0.16)'; ctx.strokeStyle='rgba(122,184,255,'+(0.4+0.5*pulse)+')'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.arc(x,rowY,cw*0.30,0,7); ctx.fill(); ctx.stroke();
        ctx.fillStyle='#dfeefb'; ctx.font='600 15px sans-serif'; ctx.fillText(pl[p].join(''),x,rowY);
        // 접힘 화살표: 각 순열 → 위 대표 묶음
        ctx.strokeStyle='rgba(255,178,122,'+(0.25+0.45*pulse)+')'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.moveTo(x,rowY-cw*0.30); ctx.lineTo(cx,topY+gw/2+4); ctx.stroke(); }
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('↑ 순서만 다른 '+rf+' (= '+r+'!) 개 순열이 같은 1개 조합으로 접힙니다', cx, rowY+cw*0.30+26);
      ctx.textBaseline='alphabetic';
      // 골든룰: nPr / r! = nCr 모두 실제 계산
      E.big(n+'C'+r+' = '+n+'P'+r+' / '+r+'! = '+nPr(n,r)+' / '+rf+' = '+nCr(n,r),
            '조합 = 순서 없이 뽑기. 순열 '+nPr(n,r)+'개를 같은 묶음의 순서 '+r+'!='+rf+'로 나눕니다'); }
  },

  // ══════════ 15.3 파스칼·이항정리 ══════════
  // 15.3a 파스칼의 삼각형
  { id:'ch15_04',
    enter:function(E){ this.s={rows:5, hk:1}; E.setOn([]); },   // rows=표시 행 수, hk=합 강조가 향하는 마지막 행의 칸 인덱스
    tap:function(E){ var s=this.s, MAX=9;
      // 한 행 안에서 강조 칸을 순회하다가 행 끝에 닿으면 다음 행 추가
      if(s.rows>=MAX && s.hk>=s.rows-1){ s.rows=5; s.hk=1; E.blip(320,0.12); return; }  // ↻ 처음부터
      if(s.hk < s.rows-2){ s.hk++; E.blip(520+s.hk*20,0.12); }                          // 같은 행 내 다음 칸
      else if(s.rows<MAX){ s.rows++; s.hk=1; E.blip(560,0.14); }                         // 다음 행 추가, 강조 리셋
      else { s.hk++; E.blip(520,0.12); } },
    draw:function(E){ var ctx=E.ctx, s=this.s, rows=s.rows, cell=Math.min(46, E.H*0.66/rows), topY=E.H*0.20, cx=E.W/2, rad=Math.min(17,cell*0.37);
      ctx.font='600 '+Math.round(Math.min(16,cell*0.35))+'px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      var dr=rows-1, dk=s.hk;                 // 합 강조 대상: dr행 dk칸 = (dr-1행 dk-1칸)+(dr-1행 dk칸)
      var ax,ay,bx,by,dx,dy, va=0,vb=0,vd=0;
      for(var r=0;r<rows;r++){ var y=topY+r*cell, x0=cx-r*cell/2;
        for(var k=0;k<=r;k++){ var x=x0+k*cell, v=nCr(r,k);   // 골든룰: 모든 값 실제 계산
          var src=(r===dr-1 && (k===dk-1||k===dk)), res=(r===dr && k===dk);
          ctx.fillStyle= res?'rgba(255,178,122,0.85)':src?'rgba(122,184,255,0.5)':'rgba(122,184,255,0.16)';
          ctx.beginPath(); ctx.arc(x,y,rad,0,7); ctx.fill();
          ctx.fillStyle= res?'#1a1a22':'#dfeefb'; ctx.fillText(v,x,y);
          if(r===dr-1&&k===dk-1){ ax=x; ay=y; va=v; }
          if(r===dr-1&&k===dk){ bx=x; by=y; vb=v; }
          if(r===dr&&k===dk){ dx=x; dy=y; vd=v; } } }
      // "위 두 수의 합" 화살표 (dr-1행 dk-1·dk → dr행 dk)
      if(ax!=null && bx!=null && dx!=null){ ctx.strokeStyle='#ffb27a'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.moveTo(ax,ay+rad); ctx.lineTo(dx,dy-rad); ctx.moveTo(bx,by+rad); ctx.lineTo(dx,dy-rad); ctx.stroke(); }
      ctx.textBaseline='alphabetic';
      E.tapHint(cx, topY+rows*cell+6, (rows>=9&&dk>=rows-1)?'↻ 처음부터 (D)':'▶ 다음 합·행 (D)', !(rows>=9&&dk>=rows-1));
      var sumTxt = (va!=null) ? (va+' + '+vb+' = '+vd) : '';
      E.big('파스칼의 삼각형 · '+rows+'행', '각 수 = 바로 위 두 수의 합'+(sumTxt?' (지금: '+sumTxt+')':'')+' · 양 끝은 항상 1 · n번째 줄 = ₙCᵣ'); }
  },

  // 15.3b 이항정리
  { id:'ch15_05',
    enter:function(E){ this.s={n:3}; E.setOn([]);
      E.controls('<div class="ctrl"><label>지수 n</label><input type="range" id="bn" min="1" max="5" step="1" value="3"><output id="bno">3</output></div>');
      var self=this; E.bind('#bn','input',function(e){ self.s.n=+e.target.value; document.getElementById('bno').textContent=e.target.value; E.blip(440,0.1); }); },
    draw:function(E){ var ctx=E.ctx, n=this.s.n, cx=E.W/2, y=E.H*0.42;
      // 계수(파스칼 n행)
      var coefs=[]; for(var k=0;k<=n;k++) coefs.push(nCr(n,k));
      ctx.font='600 18px sans-serif'; ctx.textAlign='center';
      var cw=58, total=(n+1)*cw, x0=cx-total/2;
      for(var i=0;i<=n;i++){ var x=x0+i*cw+cw/2;
        ctx.fillStyle='rgba(255,178,122,0.85)'; ctx.beginPath(); ctx.arc(x,y,18,0,7); ctx.fill();
        ctx.fillStyle='#1a1a22'; ctx.textBaseline='middle'; ctx.fillText(coefs[i],x,y); ctx.textBaseline='alphabetic';
        ctx.fillStyle='#8fe3b5'; ctx.font='13px sans-serif'; var p=n-i;
        var aP=(p>1?'a^'+p:p===1?'a':''), bP=(i>1?'b^'+i:i===1?'b':''); ctx.fillText((aP+bP)||'1', x, y+38); ctx.font='600 18px sans-serif'; }
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('↑ 계수 = 파스칼 '+n+'번째 줄', cx, y-36);
      E.big('(a + b)^'+n+'  계수: '+coefs.join(', '), '이항정리 — 전개 계수가 곧 ₙCᵣ (파스칼 줄). 3장 (a+b)²(#33)의 일반화!'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
