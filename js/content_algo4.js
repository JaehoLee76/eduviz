/* 알고리즘 제4장 탐색 — VIZ 포맷
   선형·이분 탐색=코드+스텝, 비교·전략=concept. 텍스트는 content/algo4.json. */
(function(){
  var BLU='#7ab8ff', ORA='#ffb27a', GRN='#8fe3b5', PNK='#f4a0c0', DIM='#6f6e7a';

  var scenes=[

  // ══════════ 4.1 선형 탐색 (코드+스텝) ══════════
  { id:'algo4_01',
    input:'A = [ 42, 17, 8, 99, 23, 4, 61 ] ,  찾는 값 x = 23  (정렬 안 됨)',
    code:[
      'LINEAR-SEARCH(A, n, x) {',
      '  for (i = 0; i < n; i++)',
      '    if (A[i] == x)',
      '      return i      // 찾음',
      '  return NIL        // 끝까지 없음',
      '}'
    ],
    build:function(V){ var A=[42,17,8,99,23,4,61], x=23, st=[];
      st.push({line:0, cap:'정렬 안 된 배열에서 <b>'+x+'</b> 을 찾습니다(처음부터 하나씩).', A:A, i:-1});
      for(var i=0;i<A.length;i++){
        st.push({line:2, cap:'A['+i+']=<b>'+A[i]+'</b> 이 '+x+' 인가?', A:A, i:i});
        if(A[i]===x){ st.push({line:3, cap:'일치! 위치 <b>'+i+'</b> 반환 ('+(i+1)+'번 확인). 최악 O(n).', A:A, i:i, found:i}); return st; }
      }
      st.push({line:4, cap:'끝까지 없음 → NIL. 정렬 불필요하지만 최악 n번(O(n)).', A:A, i:A.length, done:true});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 16px sans-serif';
      ctx.fillText('정렬 안 된 배열에서  찾는 값 x = 23  탐색', V.W/2, V.H*0.20);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('처음부터 하나씩 비교 (주황 = 확인 중, 회색 = 이미 지나침)', V.W/2, V.H*0.20+22);
      AV.arr(V, f.A, { y:V.H*0.42, bw:64, gap:10, idx:true, hl:function(k){
      if(k===f.found) return {fill:'rgba(143,227,181,0.35)',stroke:GRN,text:GRN,tag:'찾음!'};
      if(k===f.i&&f.found==null) return {fill:'rgba(255,178,122,0.3)',stroke:ORA,text:ORA,tag:'확인'};
      if(k<f.i) return {fill:'rgba(255,255,255,0.04)',stroke:'rgba(255,255,255,0.2)',text:DIM}; return null; } }); }
  },

  // ══════════ 4.2 이분 탐색 (코드+스텝) ══════════
  { id:'algo4_02',
    input:'A = [ 4, 8, 17, 23, 42, 55, 61, 99 ] ,  찾는 값 x = 23  (정렬됨)',
    code:[
      'BINARY-SEARCH(A, x) {        // A는 정렬됨',
      '  lo = 0;  hi = n-1',
      '  while (lo <= hi) {',
      '    mid = (lo + hi) / 2',
      '    if (A[mid] == x) return mid',
      '    else if (A[mid] < x) lo = mid+1   // 오른쪽',
      '    else hi = mid-1                    // 왼쪽',
      '  }',
      '  return NIL',
      '}'
    ],
    build:function(V){ var A=[4,8,17,23,42,55,61,99], x=23, lo=0, hi=A.length-1, st=[];
      st.push({line:1, cap:'<b>정렬된</b> 배열에서 '+x+' 찾기. lo=0, hi='+hi+'.', A:A, lo:lo, hi:hi, mid:-1});
      while(lo<=hi){
        var mid=Math.floor((lo+hi)/2);
        st.push({line:3, cap:'중앙 mid='+mid+' → A['+mid+']=<b>'+A[mid]+'</b> 과 '+x+' 비교.', A:A, lo:lo, hi:hi, mid:mid});
        if(A[mid]===x){ st.push({line:4, cap:'일치! 위치 <b>'+mid+'</b>. 매번 절반을 버려 O(log n).', A:A, lo:lo, hi:hi, mid:mid, found:mid}); return st; }
        else if(A[mid]<x){ st.push({line:5, cap:'A[mid] '+A[mid]+' < '+x+' → 왼쪽 절반 버림. lo='+(mid+1)+'.', A:A, lo:lo, hi:hi, mid:mid}); lo=mid+1; }
        else { st.push({line:6, cap:'A[mid] '+A[mid]+' > '+x+' → 오른쪽 절반 버림. hi='+(mid-1)+'.', A:A, lo:lo, hi:hi, mid:mid}); hi=mid-1; }
      }
      st.push({line:8, cap:'범위 소진 → 없음. n개도 약 log₂n 번이면 끝!', A:A, lo:lo, hi:hi, mid:-1, done:true});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 16px sans-serif';
      ctx.fillText('정렬된 배열에서  찾는 값 x = 23  탐색', V.W/2, V.H*0.20);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('가운데(mid)와 비교 → 절반을 버림 (회색 = 버려진 범위)', V.W/2, V.H*0.20+22);
      AV.arr(V, f.A, { y:V.H*0.42, bw:58, gap:8, idx:true, hl:function(k){
        if(k===f.found) return {fill:'rgba(143,227,181,0.35)',stroke:GRN,text:GRN,tag:'찾음!'};
        if(k===f.mid&&f.found==null) return {fill:'rgba(255,178,122,0.3)',stroke:ORA,text:ORA,tag:'mid'};
        if(k<f.lo||k>f.hi) return {fill:'rgba(255,255,255,0.03)',stroke:'rgba(255,255,255,0.12)',text:'#4a4955'};
        return {fill:'rgba(122,184,255,0.16)',stroke:BLU,text:'#dfeefb'}; } });
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('회색 = 버려진 범위 (절반씩 사라짐)   lo='+f.lo+', hi='+f.hi, V.W/2, V.H*0.60); }
  },

  // ══════════ 4.2 선형 vs 이분 비교 (concept) ══════════
  { id:'algo4_03', concept:true,
    enter:function(E){ this.s={n:1024}; E.setOn([]);
      E.controls('<div class="ctrl"><label>데이터 크기 n</label><input type="range" id="nn" min="16" max="1048576" step="16" value="1024"><output id="nno">1024</output></div>');
      var self=this; E.bind('#nn','input',function(e){ self.s.n=+e.target.value; document.getElementById('nno').textContent=(+e.target.value).toLocaleString(); E.blip(440,0.08); }); },
    draw:function(E){ var ctx=E.ctx, n=this.s.n, lin=n, bin=Math.ceil(Math.log2(n)), cx=E.W/2;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('데이터 '+n.toLocaleString()+'개에서 한 값 찾기 — 최악 몇 번 볼까?', cx, E.H*0.15);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('아래 슬라이더로 n을 키우면 두 방법의 차이가 폭발합니다.', cx, E.H*0.15+22);
      function card(x,title,val,col){ var w=E.W*0.40, h=E.H*0.26, y=E.H*0.30;
        ctx.strokeStyle=col; ctx.lineWidth=2; ctx.fillStyle='rgba(255,255,255,0.03)';
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x-w/2,y,w,h,14);ctx.fill();ctx.stroke();}else ctx.strokeRect(x-w/2,y,w,h);
        ctx.fillStyle=col; ctx.font='600 15px sans-serif'; ctx.textAlign='center'; ctx.fillText(title, x, y+30);
        ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.fillText('최악의 경우 확인 횟수', x, y+h-46);
        ctx.fillStyle=col; ctx.font='600 28px sans-serif'; ctx.fillText(val.toLocaleString(), x, y+h-12); }
      card(cx-E.W*0.22, '선형 O(n)', lin, PNK);
      card(cx+E.W*0.22, '이분 O(log n)', bin, GRN);
      ctx.fillStyle=ORA; ctx.font='600 16px sans-serif'; ctx.textAlign='center'; ctx.fillText('약 '+Math.round(lin/bin).toLocaleString()+'배 빠름!', cx, E.H*0.64); }
  },

  // ══════════ 4.2 탐색 전략 (concept, quiz) ══════════
  { id:'algo4_04', concept:true,
    enter:function(E){ this.s={}; E.setOn([]);
      E.quiz({q:'정렬 안 된 데이터에서 딱 한 번만 찾을 때 가장 적합한 탐색은?', choices:['선형 탐색','이분 탐색','정렬 후 이분','해시'], answer:0, explain:'한 번뿐이면 정렬(O(n log n)) 비용이 아까움 → 선형 O(n)이 최선. 자주 찾으면 정렬·해시가 유리.'}); },
    draw:function(E){ var ctx=E.ctx, cx=E.W/2, y0=E.H*0.18, rh=Math.min(50,E.H*0.10),
        rows=[['정렬 안 됨, 가끔 찾기','선형 O(n)',PNK],['정렬됨, 자주 찾기','이분 O(log n)',GRN],['키-값 조회','해시 O(1)',BLU]];
      for(var i=0;i<rows.length;i++){ var y=y0+i*rh;
        ctx.fillStyle='#cfcdc6'; ctx.font='14px sans-serif'; ctx.textAlign='left'; ctx.fillText(rows[i][0], cx-E.W*0.32, y+18);
        ctx.fillStyle=rows[i][2]; ctx.font='600 14px sans-serif'; ctx.textAlign='right'; ctx.fillText(rows[i][1], cx+E.W*0.32, y+18); } }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
