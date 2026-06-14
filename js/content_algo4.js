/* 알고리즘 제4장 탐색 — 4.1 선형 탐색 · 4.2 이분 탐색
   동작(behavior)만. 텍스트는 content/algo4.json. AV 사용. */
(function(){
  var scenes=[

  // ══════════ 4.1 선형 탐색 ══════════
  { id:'algo4_01',
    enter:function(E){ this.s={i:0,found:-1,done:false}; this.A=[42,17,8,99,23,4,61]; this.target=23; E.setOn([]); },
    tap:function(E){ var s=this.s; if(s.done){ this.enter(E); return; }
      if(this.A[s.i]===this.target){ s.found=s.i; s.done=true; E.blip(680,0.14); return; }
      s.i++; if(s.i>=this.A.length){ s.done=true; E.blip(260,0.12);} else E.blip(500,0.08); },
    draw:function(E){ var s=this.s, ctx=E.ctx, self=this;
      AV.arr(E, this.A, { y:E.H*0.42, idx:true, hl:function(i){
        if(i===s.found) return {fill:'rgba(143,227,181,0.35)',stroke:'#8fe3b5',text:'#8fe3b5',tag:'찾음!'};
        if(i===s.i&&!s.done) return {fill:'rgba(255,178,122,0.3)',stroke:'#ffb27a',text:'#ffb27a',tag:'확인'};
        if(i<s.i) return {fill:'rgba(255,255,255,0.04)',stroke:'rgba(255,255,255,0.2)',text:'#6f6e7a'};
        return null; } });
      E.tapHint(E.W/2, E.H*0.60, s.done?'↻ 다시':'▶ 다음 칸 확인', true);
      E.big(s.found>=0?('찾음! 위치 '+s.found+' ('+(s.found+1)+'번 확인)'):(s.done?'못 찾음':('찾는 값: '+this.target)), '선형 탐색 — 처음부터 하나씩 확인. 정렬 안 된 데이터에도 OK지만 최악 n번(O(n))'); }
  },

  // ══════════ 4.2 이분 탐색 ══════════
  { id:'algo4_02',
    enter:function(E){ this.A=[4,8,17,23,42,55,61,99]; this.target=23; this.s={lo:0,hi:this.A.length-1,mid:-1,found:-1,done:false,step:0}; E.setOn([]); },
    tap:function(E){ var s=this.s, A=this.A; if(s.done){ this.enter(E); return; }
      if(s.lo>s.hi){ s.done=true; E.blip(260,0.12); return; }
      s.mid=Math.floor((s.lo+s.hi)/2); s.step++;
      if(A[s.mid]===this.target){ s.found=s.mid; s.done=true; E.blip(680,0.14); }
      else if(A[s.mid]<this.target){ s.lo=s.mid+1; E.blip(500,0.1); }
      else { s.hi=s.mid-1; E.blip(440,0.1); } },
    draw:function(E){ var s=this.s, ctx=E.ctx, self=this;
      AV.arr(E, this.A, { y:E.H*0.42, idx:true, hl:function(i){
        if(i===s.found) return {fill:'rgba(143,227,181,0.35)',stroke:'#8fe3b5',text:'#8fe3b5',tag:'찾음!'};
        if(i===s.mid&&!s.done) return {fill:'rgba(255,178,122,0.3)',stroke:'#ffb27a',text:'#ffb27a',tag:'mid'};
        if(i<s.lo||i>s.hi) return {fill:'rgba(255,255,255,0.03)',stroke:'rgba(255,255,255,0.12)',text:'#4a4955'};
        return {fill:'rgba(122,184,255,0.16)',stroke:'#7ab8ff',text:'#dfeefb'}; } });
      ctx.fillStyle='#6f6e7a'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('회색 = 버려진 범위 (절반씩 사라짐)', E.W/2, E.H*0.58);
      E.tapHint(E.W/2, E.H*0.64, s.done?'↻ 다시':'▶ 중앙과 비교 후 절반 버리기', true);
      E.big(s.found>=0?('찾음! 위치 '+s.found+' ('+s.step+'단계만에)'):(s.done?'못 찾음':('찾는 값: '+this.target)), '이분 탐색 — 정렬된 데이터의 중앙과 비교해 절반을 버려요. O(log n)! (1장 #4 회수)'); }
  },

  // ══════════ 4.2 선형 vs 이분 비교 ══════════
  { id:'algo4_03',
    enter:function(E){ this.s={n:1024}; E.setOn([]);
      E.controls('<div class="ctrl"><label>데이터 크기 n</label><input type="range" id="nn" min="16" max="1048576" step="16" value="1024"><output id="nno">1024</output></div>');
      var self=this; E.bind('#nn','input',function(e){ self.s.n=+e.target.value; document.getElementById('nno').textContent=(+e.target.value).toLocaleString(); E.blip(440,0.08); }); },
    draw:function(E){ var ctx=E.ctx, n=this.s.n, lin=n, bin=Math.ceil(Math.log2(n)), cx=E.W/2;
      function card(x,title,val,col){ var w=E.W*0.34, h=E.H*0.28, y=E.H*0.30;
        ctx.strokeStyle=col; ctx.lineWidth=2; ctx.fillStyle='rgba(255,255,255,0.03)';
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x-w/2,y,w,h,14);ctx.fill();ctx.stroke();}else ctx.strokeRect(x-w/2,y,w,h);
        ctx.fillStyle=col; ctx.font='600 16px sans-serif'; ctx.textAlign='center'; ctx.fillText(title, x, y+32);
        ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.fillText('최악의 경우 확인 횟수', x, y+h-50);
        ctx.fillStyle=col; ctx.font='600 30px sans-serif'; ctx.fillText(val.toLocaleString(), x, y+h-14); }
      card(cx-E.W*0.19, '선형 탐색 O(n)', lin, '#f4a0c0');
      card(cx+E.W*0.19, '이분 탐색 O(log n)', bin, '#8fe3b5');
      ctx.fillStyle='#ffb27a'; ctx.font='600 16px sans-serif'; ctx.textAlign='center'; ctx.fillText('약 '+Math.round(lin/bin).toLocaleString()+'배 빠름!', cx, E.H*0.66);
      E.big('n = '+n.toLocaleString()+'  →  '+lin.toLocaleString()+' vs '+bin, '같은 탐색, 압도적 차이 — 백만 개도 이분 탐색은 단 20번. 단, 이분 탐색은 정렬이 전제(그래서 3장 정렬이 중요!)'); }
  },

  // ══════════ 4.2 탐색 전략 ══════════
  { id:'algo4_04',
    enter:function(E){ this.s={}; E.setOn([]);
      E.quiz({q:'정렬되지 않은 데이터에서 한 번만 찾을 때 가장 적합한 탐색은?', choices:['선형 탐색','이분 탐색','먼저 정렬 후 이분','해시'], answer:0, explain:'한 번뿐이면 정렬(O(n log n)) 비용이 아까움 → 선형 O(n)이 최선. 자주 찾으면 정렬·해시가 유리.'}); },
    draw:function(E){ var ctx=E.ctx, cx=E.W/2, y0=E.H*0.20, rh=Math.min(54,E.H*0.10),
        rows=[['정렬 안 됨, 가끔 찾기','선형 탐색 O(n)','#f4a0c0'],['정렬됨, 자주 찾기','이분 탐색 O(log n)','#8fe3b5'],['키-값 조회','해시 테이블 O(1)','#7ab8ff']];
      for(var i=0;i<rows.length;i++){ var y=y0+i*rh;
        ctx.fillStyle='#cfcdc6'; ctx.font='15px sans-serif'; ctx.textAlign='left'; ctx.fillText(rows[i][0], cx-E.W*0.28, y+20);
        ctx.fillStyle=rows[i][2]; ctx.font='600 15px sans-serif'; ctx.textAlign='right'; ctx.fillText(rows[i][1], cx+E.W*0.28, y+20); }
      E.big('상황에 맞는 탐색 고르기', '만능 탐색은 없어요 — 데이터 상태와 조회 빈도로 선택. 정렬·해시(2·3장)가 탐색 속도를 결정'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
