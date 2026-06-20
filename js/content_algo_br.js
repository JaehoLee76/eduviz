/* 알고리즘 — 분기(세부) 장면. 뼈대 장면에서 branchOf로 갈라짐. 자료 충실 반영의 시작.
   동작(behavior)만. 텍스트는 content/algo_br.json. AV 사용. */
(function(){
  // 노드 가장자리~가장자리 화살표(방향 그래프). p=[x,y] 픽셀, r=노드 반지름
  function gedge(E,a,b,col,w,wt){ var ctx=E.ctx, dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy)||1,r=24;
    var ax=a[0]+dx/d*r,ay=a[1]+dy/d*r,bx=b[0]-dx/d*r,by=b[1]-dy/d*r;
    AV.arrow(ctx,ax,ay,bx,by,col||'rgba(255,255,255,0.3)',w||2);
    if(wt!=null){ ctx.fillStyle=col||'#9b99a3'; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText(wt,(ax+bx)/2,(ay+by)/2-4); } }
  function uedge(E,a,b,col,w,wt){ var ctx=E.ctx; ctx.strokeStyle=col||'rgba(255,255,255,0.3)'; ctx.lineWidth=w||2; ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke();
    if(wt!=null){ ctx.fillStyle=col||'#9b99a3'; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText(wt,(a[0]+b[0])/2,(a[1]+b[1])/2-4); } }
  // 배열-인덱스 이진트리 드로어 (노드 i의 자식 = 2i+1, 2i+2)
  function tpos(E,i,o){ var L=Math.floor(Math.log2(i+1)), cnt=Math.pow(2,L), pil=i-(cnt-1);
    var left=o.left||E.W*0.10, right=o.right||E.W*0.90, top=o.top||E.H*0.24, lg=o.lg||E.H*0.155;
    return [left+(right-left)*((pil+0.5)/cnt), top+L*lg]; }
  function drawTreeB(E, arr, hl, o){ o=o||{}; var ctx=E.ctx, r=o.r||20;
    for(var i=0;i<arr.length;i++){ if(arr[i]==null) continue; var p=tpos(E,i,o);
      [2*i+1,2*i+2].forEach(function(c){ if(c<arr.length&&arr[c]!=null){ var cp=tpos(E,c,o); ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(p[0],p[1]); ctx.lineTo(cp[0],cp[1]); ctx.stroke(); } }); }
    for(var j=0;j<arr.length;j++){ if(arr[j]==null) continue; var q=tpos(E,j,o), h=hl&&hl(j);
      AV.node(E,q[0],q[1],arr[j],{r:r,fill:(h&&h.fill)||'rgba(122,184,255,0.18)',stroke:(h&&h.stroke)||'#7ab8ff',text:(h&&h.text)||'#dfeefb',tag:h&&h.tag,fs:14}); } }

  // 연습문제 세트 분기를 만드는 헬퍼: 문항 카드 목록 + 좌우 키로 한 문항씩 집중
  function exSet(id, parent, head, items){
    return { id:id, concept:true, branchOf:parent, codeHead:head,
      keys:[{code:'KeyN',key:'N',label:'다음 문항',act:function(E){ E._exi=((E._exi||0)+1)%items.length; }},
            {code:'KeyP',key:'P',label:'이전 문항',act:function(E){ E._exi=((E._exi||0)+items.length-1)%items.length; }}],
      tap:function(E){ E._exi=((E._exi||0)+1)%items.length; },
      enter:function(E){ E._exi=0; E.setOn&&E.setOn([]); },
      draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, sel=E._exi||0;
        ctx.textAlign='left';
        ctx.fillStyle='#cfd8e6'; ctx.font='600 17px sans-serif';
        ctx.fillText(head+'  ('+items.length+'문항)', W*0.06, H*0.13);
        var y0=H*0.24, rowH=Math.min(60,(H*0.62)/items.length);
        for(var i=0;i<items.length;i++){ var y=y0+i*rowH, on=(i===sel);
          ctx.fillStyle=on?'rgba(122,184,255,0.16)':'rgba(255,255,255,0.04)';
          ctx.strokeStyle=on?'#7ab8ff':'rgba(255,255,255,0.10)'; ctx.lineWidth=on?2:1;
          ctx.beginPath(); if(ctx.roundRect)ctx.roundRect(W*0.06,y,W*0.88,rowH-10,9); else ctx.rect(W*0.06,y,W*0.88,rowH-10); ctx.fill(); ctx.stroke();
          ctx.fillStyle=items[i][0].indexOf('★★')>=0?'#f4a0c0':(items[i][0].indexOf('★')>=0?'#ffb27a':'#8fe3b5');
          ctx.font='15px sans-serif'; ctx.fillText(items[i][0], W*0.09, y+rowH*0.43);
          ctx.fillStyle=on?'#eaf2ff':'#c3ccda'; ctx.font=(on?'600 ':'')+'15px sans-serif';
          var q=items[i][1], maxc=Math.floor(W*0.74/8.2); if(q.length>maxc)q=q.slice(0,maxc-1)+'…';
          ctx.fillText((i+1)+'. '+q, W*0.145, y+rowH*0.43); }
        ctx.textAlign='center'; ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
        ctx.fillText('난이도 ☆입문 · ★표준 · ★★심화  —  풀이는 아래 \"연습문제\" 패널에서', W/2, H*0.97); }
    };
  }

  // 증명 분기 헬퍼: 제목 + 색상 강조 줄들 + 하단 결론. lines=[[색,텍스트],...]
  function proofScene(id, parent, head, lead, lines, footer){
    return { id:id, concept:true, branchOf:parent, codeHead:head,
      enter:function(E){ E.setOn&&E.setOn([]); },
      draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
        ctx.textAlign='left'; ctx.font='600 17px sans-serif'; ctx.fillStyle='#cfd8e6';
        ctx.fillText(head, W*0.05, H*0.11);
        ctx.font='14px sans-serif'; ctx.fillStyle='#9fb0c8';
        wrapText(ctx, lead, W*0.05, H*0.17, W*0.9, 22);
        ctx.font='14px sans-serif';
        for(var i=0;i<lines.length;i++){ ctx.fillStyle=lines[i][0];
          ctx.fillText(lines[i][1], W*0.05, H*0.27+i*29); }
        ctx.textAlign='center'; ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
        wrapText(ctx, footer, W/2, H*0.94, W*0.86, 19, true); }
    };
  }
  function rrect(ctx,x,y,w,h,r){ if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,w,h,r);} else {ctx.beginPath();ctx.rect(x,y,w,h);} }
  function wrapText(ctx, text, x, y, maxw, lh, center){
    var words=text.split(' '), line='', yy=y;
    for(var n=0;n<words.length;n++){ var test=line+words[n]+' ';
      if(ctx.measureText(test).width>maxw && line){ ctx.fillText(line.trim(), x, yy); line=words[n]+' '; yy+=lh; }
      else line=test; }
    ctx.fillText(line.trim(), x, yy);
  }

  var scenes=[

  // ══════ 퀵정렬(algo3_05) ▸ 최악의 경우 O(n²) ══════
  { id:'algo_br_qs1', concept:true, branchOf:'algo3_05',
    enter:function(E){ this.s={shown:-1,t0:0}; E.setOn([]); },
    build:function(E){ return [
      {n:0, cap:'<b>이미 정렬된</b> [1·2·3·4·5·6]. 마지막 끝값 <b>6</b>을 피벗으로 잡습니다.'},
      {n:1, cap:'6보다 작은 값이 <b>전부 왼쪽</b>으로 — 분할이 <b>5 : 0</b>으로 극단으로 치우칩니다.'},
      {n:2, cap:'남은 [1..5]에서 또 끝값 <b>5</b>가 피벗 → 다시 <b>4 : 0</b>.'},
      {n:3, cap:'매 단계 한 칸씩만 줄어, 재귀 <b>깊이가 n</b>까지 자랍니다(균형이면 log n).'},
      {n:4, cap:'각 단계의 비교 수는 n−1, n−2, … 처럼 한 칸씩 줄어듭니다.'},
      {n:5, cap:'총 비교 = (n−1)+…+1 = <b>n(n−1)/2 = O(n²)</b>. 좋은 피벗 선택이 관건!'}
    ]; },
    draw:function(E, st){ var s=this.s, ctx=E.ctx;
      var levels=[[1,2,3,4,5,6],[1,2,3,4,5],[1,2,3,4],[1,2,3],[1,2],[1]];
      var show=(st&&st.n!=null)?st.n:0;
      if(s.shown!==show){ s.shown=show; s.t0=E.frame; }
      var ap=Math.min(1,(E.frame-s.t0)*0.12), ez=ap<0.5?2*ap*ap:1-Math.pow(-2*ap+2,2)/2;
      var top=E.H*0.17, lh=Math.min(52,E.H*0.107), cell=Math.min(36,E.W*0.05), cx=E.W*0.5;
      for(var L=0;L<=show && L<levels.length;L++){ var a=levels[L], x0=cx-(a.length*cell)/2, y=top+L*lh;
        var newest=(L===show), la=newest?ez:1, dy=newest?(1-ez)*-16:0;
        for(var i=0;i<a.length;i++){ var x=x0+i*cell, isPiv=(i===a.length-1);
          ctx.globalAlpha=la;
          ctx.fillStyle=isPiv?'rgba(244,160,192,0.32)':'rgba(122,184,255,0.13)';
          ctx.strokeStyle=isPiv?'#f4a0c0':'#7ab8ff'; ctx.lineWidth=1.6;
          ctx.fillRect(x,y+dy,cell-4,cell-4); ctx.strokeRect(x,y+dy,cell-4,cell-4);
          ctx.fillStyle='#dfeefb'; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.fillText(a[i], x+(cell-4)/2, y+dy+(cell-4)/2); ctx.textBaseline='alphabetic'; }
        ctx.globalAlpha=la*0.9; ctx.fillStyle='#f4a0c0'; ctx.font='12px sans-serif'; ctx.textAlign='left';
        ctx.fillText('피벗 '+a[a.length-1]+' → '+(a.length-1)+' : 0', x0+a.length*cell+14, y+dy+cell/2);
        ctx.globalAlpha=1; }
      if(show>=5){ ctx.fillStyle='#ffb27a'; ctx.font='600 15px sans-serif'; ctx.textAlign='center';
        ctx.fillText('비교 = (n−1)+(n−2)+…+1 = n(n−1)/2 = O(n²)', cx, top+levels.length*lh+16); }
      E.big('이미 정렬된 입력 + 끝값 피벗 = O(n²)', '퀵정렬 최악 — 분할이 (n−1):0으로 치우쳐 깊이 n. D로 단계 진행 · S 자동'); }
  },

  // ══════ 퀵정렬(algo3_05) ▸ 랜덤화된 퀵정렬 ══════
  { id:'algo_br_qs2', branchOf:'algo3_05',
    code:[
      'quicksort(a, lo, hi):',
      '  if lo >= hi: return',
      '  r ← 무작위 인덱스 [lo..hi]   // 랜덤 피벗',
      '  swap(a[r], a[hi])           // 피벗을 끝으로',
      '  pivot ← a[hi];  i ← lo',
      '  for j = lo .. hi-1:         // 분할',
      '    if a[j] < pivot: swap(a[i++], a[j])',
      '  swap(a[i], a[hi])           // 피벗 제자리',
      '  quicksort(a, lo, i-1); quicksort(a, i+1, hi)'
    ],
    build:function(V){
      var a=[5,2,8,1,3]; var n=a.length; var st=[];
      // 미리 정한 "무작위" 피벗(상대 인덱스 = 구간 중 몇 번째). 결정적으로 고정.
      var randSeq=[2,1,0,0]; var rsi=0;
      function snap(line,cap,o){ o=o||{};
        st.push({line:line,cap:cap,arr:a.slice(),n:n,
          lo:(o.lo==null?-1:o.lo), hi:(o.hi==null?-1:o.hi),
          i:(o.i==null?-1:o.i), j:(o.j==null?-1:o.j),
          piv:(o.piv==null?-1:o.piv), pivVal:(o.pivVal==null?null:o.pivVal),
          swap:o.swap||null, done:o.done||[], depth:(o.depth==null?0:o.depth),
          fin:!!o.fin}); }
      function sw(x,y){ var t=a[x]; a[x]=a[y]; a[y]=t; }
      var settled=[];
      snap([0],'정렬할 배열: <b>[5, 2, 8, 1, 3]</b>. 랜덤화된 퀵정렬 — 매번 피벗을 무작위로 골라 최악을 피합니다.',{lo:0,hi:n-1,done:[]});
      function qs(lo,hi,depth){
        if(lo>=hi){ if(lo===hi) settled.push(lo); return; }
        var rel = randSeq[rsi % randSeq.length]; rsi++;
        var r = lo + Math.min(rel, hi-lo);
        snap([2],'구간 ['+lo+'..'+hi+'] : <b>무작위 피벗</b>으로 인덱스 '+r+' (값 <b>'+a[r]+'</b>)을 골랐습니다.',{lo:lo,hi:hi,piv:r,pivVal:a[r],done:settled.slice(),depth:depth});
        if(r!==hi){ snap([3],'피벗 '+a[r]+'을 구간 <b>끝(인덱스 '+hi+')</b>으로 swap합니다.',{lo:lo,hi:hi,piv:r,pivVal:a[r],swap:[r,hi],done:settled.slice(),depth:depth}); sw(r,hi); }
        var pivot=a[hi];
        snap([4],'피벗 = <b>'+pivot+'</b>. 경계 i='+lo+' 부터 시작. i 왼쪽은 피벗보다 작은 값만 모읍니다.',{lo:lo,hi:hi,piv:hi,pivVal:pivot,i:lo,done:settled.slice(),depth:depth});
        var i=lo;
        for(var j=lo;j<hi;j++){
          if(a[j]<pivot){
            if(i!==j){ snap([5,6],'a['+j+']='+a[j]+' &lt; 피벗 '+pivot+' → a['+i+']↔a['+j+'] swap, 경계 i를 '+(i+1)+'로.',{lo:lo,hi:hi,piv:hi,pivVal:pivot,i:i,j:j,swap:[i,j],done:settled.slice(),depth:depth}); sw(i,j); }
            else { snap([5,6],'a['+j+']='+a[j]+' &lt; 피벗 '+pivot+' → 제자리(i=j), 경계 i를 '+(i+1)+'로.',{lo:lo,hi:hi,piv:hi,pivVal:pivot,i:i,j:j,done:settled.slice(),depth:depth}); }
            i++;
          } else {
            snap([5,6],'a['+j+']='+a[j]+' ≥ 피벗 '+pivot+' → 그대로 둡니다(경계 i 유지).',{lo:lo,hi:hi,piv:hi,pivVal:pivot,i:i,j:j,done:settled.slice(),depth:depth});
          }
        }
        if(i!==hi){ snap([7],'분할 끝 → 피벗을 경계 i='+i+'로 swap. 이제 a['+i+']='+pivot+'은 <b>최종 위치 확정</b>.',{lo:lo,hi:hi,piv:hi,pivVal:pivot,i:i,swap:[i,hi],done:settled.slice(),depth:depth}); sw(i,hi); }
        settled.push(i);
        snap([8],'피벗 <b>'+pivot+'</b> (인덱스 '+i+') 확정. 왼쪽 ['+lo+'..'+(i-1)+'] 과 오른쪽 ['+(i+1)+'..'+hi+'] 을 재귀합니다.',{lo:lo,hi:hi,piv:i,pivVal:pivot,done:settled.slice(),depth:depth});
        qs(lo,i-1,depth+1);
        qs(i+1,hi,depth+1);
      }
      qs(0,n-1,0);
      snap([1],'<b>정렬 완료!</b> 모든 피벗이 제자리에 — 매번 무작위 피벗이라 어떤 입력도 기대 <b>O(n log n)</b>으로 처리됩니다.',{done:settled.slice(),fin:true});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H,n=f.n,a=f.arr;
      ctx.textAlign='center'; ctx.textBaseline='alphabetic';
      ctx.fillStyle='#cfd8e6'; ctx.font='600 15px sans-serif';
      ctx.fillText('랜덤화된 퀵정렬 — 무작위 피벗으로 최악 회피', W/2, H*0.10);
      var cw=Math.min(72,(W*0.78)/n), totalW=n*cw, x0=W/2-totalW/2, y0=H*0.30, chh=58;
      // active range bracket
      if(f.lo>=0 && f.hi>=0 && !f.fin){
        var rx0=x0+f.lo*cw, rx1=x0+(f.hi+1)*cw;
        ctx.fillStyle='rgba(122,184,255,0.06)'; ctx.fillRect(rx0,y0-10,rx1-rx0,chh+20);
        ctx.strokeStyle='rgba(122,184,255,0.4)'; ctx.lineWidth=1; ctx.setLineDash([4,3]);
        ctx.strokeRect(rx0,y0-10,rx1-rx0,chh+20); ctx.setLineDash([]);
        ctx.fillStyle='#7ab8ff'; ctx.font='11px sans-serif'; ctx.textAlign='center';
        ctx.fillText('현재 구간 ['+f.lo+'..'+f.hi+']', (rx0+rx1)/2, y0-16);
      }
      for(var k=0;k<n;k++){
        var px=x0+k*cw;
        var isPiv=(k===f.piv), isI=(k===f.i), isJ=(k===f.j);
        var isSwap=f.swap&&(k===f.swap[0]||k===f.swap[1]);
        var isDone=f.done.indexOf(k)>=0 || f.fin;
        var col,fill;
        if(isPiv){ col='#ffb27a'; fill='rgba(255,178,122,0.28)'; }
        else if(isSwap){ col='#f4a0c0'; fill='rgba(244,160,192,0.25)'; }
        else if(isDone){ col='#8fe3b5'; fill='rgba(143,227,181,0.20)'; }
        else if(isJ){ col='#7ab8ff'; fill='rgba(122,184,255,0.22)'; }
        else { col='#7ab8ff'; fill='rgba(122,184,255,0.10)'; }
        ctx.fillStyle=fill; ctx.strokeStyle=col; ctx.lineWidth=(isPiv||isSwap||isJ)?2.6:1.4;
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(px+3,y0,cw-6,chh,8);}else{ctx.beginPath();ctx.rect(px+3,y0,cw-6,chh);}
        ctx.fill(); ctx.stroke();
        ctx.fillStyle=col; ctx.font='600 22px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(''+a[k], px+cw/2, y0+chh/2); ctx.textBaseline='alphabetic';
        // index label
        ctx.fillStyle='#6f6e7a'; ctx.font='11px monospace'; ctx.fillText(''+k, px+cw/2, y0+chh+16);
        // i / j / pivot markers
        var marks=[];
        if(isI && !f.fin) marks.push(['i','#ffd9b8']);
        if(isJ) marks.push(['j','#7ab8ff']);
        if(isPiv && f.pivVal!=null) marks.push(['piv','#ffb27a']);
        for(var m=0;m<marks.length;m++){ ctx.fillStyle=marks[m][1]; ctx.font='600 12px sans-serif';
          ctx.fillText(marks[m][0], px+cw/2, y0-8-m*15); }
      }
      // swap arrow
      if(f.swap){ var s0=x0+f.swap[0]*cw+cw/2, s1=x0+f.swap[1]*cw+cw/2;
        ctx.strokeStyle='#f4a0c0'; ctx.lineWidth=2; ctx.beginPath();
        var my=y0+chh+30; ctx.moveTo(s0,my); ctx.quadraticCurveTo((s0+s1)/2,my+18,s1,my); ctx.stroke();
        ctx.fillStyle='#f4a0c0'; ctx.font='600 12px sans-serif'; ctx.textAlign='center';
        ctx.fillText('swap', (s0+s1)/2, my+34); }
      // pivot value badge
      if(f.pivVal!=null && !f.fin){ ctx.textAlign='center'; ctx.fillStyle='#ffb27a'; ctx.font='600 13px sans-serif';
        ctx.fillText('피벗 값 = '+f.pivVal, W/2, H*0.78); }
      // legend
      ctx.textAlign='center'; ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif';
      ctx.fillText('주황=피벗  ·  파랑=비교 중(j)  ·  분홍=swap  ·  초록=제자리 확정', W/2, H*0.92);
      if(f.fin){ ctx.fillStyle='#8fe3b5'; ctx.font='700 16px monospace';
        ctx.fillText('정렬 완료 · 기대 O(n log n)', W/2, H*0.97); } }
  },

  // ══════ 빅오(algo1_03) ▸ 마스터 정리 ══════
  { id:'algo_br_master', branchOf:'algo1_03',
    code:[
      'MASTER(T(n) = a·T(n/b) + f(n)):',
      '  예: T(n) = 2·T(n/2) + n   // a=2, b=2, f(n)=n',
      '  watershed ← n^(log_b a)   // 재귀(잎)의 총량',
      '  f(n) 과 watershed 의 크기 비교:',
      '    Case 1: f << watershed → Θ(n^(log_b a))',
      '    Case 2: f ≈ watershed → Θ(n^(log_b a)·log n)',
      '    Case 3: f >> watershed → Θ(f(n))',
      '  return 해당 Case 의 Θ'
    ],
    build:function(V){
      var a=2,b=2; var lba=Math.log(a)/Math.log(b); // log_b a = 1
      var st=[];
      function snap(line,cap,o){ o=o||{};
        st.push({line:line,cap:cap,a:a,b:b,lba:lba,
          watExp:(o.watExp==null?null:o.watExp), fStr:(o.fStr==null?'n':o.fStr),
          phase:o.phase||'setup', kase:(o.kase==null?0:o.kase),
          ans:(o.ans==null?null:o.ans)}); }
      snap([0],'분할정복의 실행시간은 점화식 <b>T(n)=a·T(n/b)+f(n)</b>으로 나옵니다. a=하위문제 수, n/b=크기, f(n)=합치는 비용.',{phase:'setup'});
      snap([1],'구체 예시: <b>T(n)=2·T(n/2)+n</b> (병합정렬). a=<b>2</b>, b=<b>2</b>, f(n)=<b>n</b>.',{phase:'setup'});
      snap([2],'재귀가 만드는 잎의 총량 <b>n^(log_b a)</b> = n^(log₂2) = <b>n¹ = n</b>. 이것이 분수령(watershed)입니다.',{phase:'wat',watExp:1});
      snap([3],'이제 두 양만 비교합니다 — 합치기 비용 <b>f(n)=n</b> 과 분수령 <b>n^(log_b a)=n</b>.',{phase:'compare',watExp:1,fStr:'n'});
      snap([3,5],'둘 다 <b>n</b> 차수로 <b>비등</b>합니다 → <b>Case 2</b> 성립. (f가 watershed와 같은 차수)',{phase:'compare',watExp:1,fStr:'n',kase:2});
      snap([5,7],'<b>Case 2 → Θ(n^(log_b a)·log n) = Θ(n·log n) = Θ(n log n).</b> 균형 분할이라 로그 인수 하나가 붙습니다.',{phase:'done',watExp:1,fStr:'n',kase:2,ans:'Θ(n log n)'});
      snap([4],'만약 f가 더 작다면 (예 T(n)=2T(n/2)+1, f=1 &lt;&lt; n) → <b>Case 1: Θ(n^(log_b a))=Θ(n)</b> — 잎이 지배.',{phase:'alt1',watExp:1,fStr:'1',kase:1,ans:'Θ(n)'});
      snap([6],'만약 f가 더 크다면 (예 T(n)=2T(n/2)+n², f=n² &gt;&gt; n) → <b>Case 3: Θ(f(n))=Θ(n²)</b> — 꼭대기 합치기가 지배.',{phase:'alt3',watExp:1,fStr:'n²',kase:3,ans:'Θ(n²)'});
      snap([7],'<b>완료!</b> 마스터 정리는 재귀 트리를 펼치지 않고 <b>두 양 비교</b>로 복잡도를 즉결합니다.',{phase:'fin',watExp:1,fStr:'n',kase:2,ans:'Θ(n log n)'});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H;
      ctx.textAlign='center'; ctx.textBaseline='alphabetic';
      ctx.fillStyle='#cfd8e6'; ctx.font='600 15px sans-serif';
      ctx.fillText('마스터 정리: n^(log_b a) 와 f(n) 의 크기 싸움', W/2, H*0.09);
      // recurrence box
      ctx.fillStyle='#9b99a3'; ctx.font='600 14px monospace';
      ctx.fillText('T(n) = '+f.a+'·T(n/'+f.b+') + '+f.fStr, W/2, H*0.16);
      // two growth bars: watershed vs f(n)
      var baseY=H*0.66, maxH=H*0.40, bw=Math.min(120,W*0.16);
      var leftX=W*0.32, rightX=W*0.68;
      // heights proportional to exponent (1 = baseline unit); use exponent value
      var watExp=(f.watExp==null?1:f.watExp);
      var fExp = (f.fStr==='1')?0 : (f.fStr==='n²')?2 : 1;
      function barH(exp){ return maxH*(0.30+0.35*exp); }
      var wH=barH(watExp), fH=barH(fExp);
      // watershed bar (blue)
      var col1='#7ab8ff';
      ctx.fillStyle='rgba(122,184,255,0.20)'; ctx.strokeStyle=col1; ctx.lineWidth=2;
      ctx.beginPath(); ctx.rect(leftX-bw/2, baseY-wH, bw, wH); ctx.fill(); ctx.stroke();
      ctx.fillStyle=col1; ctx.font='600 14px monospace'; ctx.textAlign='center';
      ctx.fillText('n^(log_b a)', leftX, baseY+22);
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px monospace';
      ctx.fillText('= n^'+(f.lba.toFixed(0)), leftX, baseY+40);
      ctx.fillStyle=col1; ctx.font='600 13px sans-serif';
      ctx.fillText('잎(재귀) 총량', leftX, baseY-wH-10);
      // f(n) bar — color by relation
      var rel = (fExp>watExp)?'gt':(fExp<watExp)?'lt':'eq';
      var col2 = (rel==='eq')?'#ffb27a':(rel==='gt')?'#f4a0c0':'#8fe3b5';
      ctx.fillStyle = (rel==='eq')?'rgba(255,178,122,0.20)':(rel==='gt')?'rgba(244,160,192,0.20)':'rgba(143,227,181,0.20)';
      ctx.strokeStyle=col2; ctx.lineWidth=2;
      ctx.beginPath(); ctx.rect(rightX-bw/2, baseY-fH, bw, fH); ctx.fill(); ctx.stroke();
      ctx.fillStyle=col2; ctx.font='600 14px monospace';
      ctx.fillText('f(n) = '+f.fStr, rightX, baseY+22);
      ctx.fillStyle=col2; ctx.font='600 13px sans-serif';
      ctx.fillText('합치기 비용', rightX, baseY-fH-10);
      // baseline
      ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(W*0.16,baseY); ctx.lineTo(W*0.84,baseY); ctx.stroke();
      // relation symbol between bars
      var sym = (rel==='eq')?'≈':(rel==='gt')?'>>':'<<';
      ctx.fillStyle=col2; ctx.font='700 30px sans-serif'; ctx.textAlign='center';
      ctx.fillText(sym, W/2, baseY-Math.max(wH,fH)/2);
      // case badges (highlight active)
      var cy=H*0.80; var labels=[['Case 1','f << wat → Θ(n^(log_b a))',1],['Case 2','f ≈ wat → Θ(·log n)',2],['Case 3','f >> wat → Θ(f(n))',3]];
      var bwid=W*0.27, bx0=W*0.5-bwid*1.5-12;
      for(var i=0;i<3;i++){ var lx=bx0+i*(bwid+8), act=(labels[i][2]===f.kase);
        ctx.fillStyle=act?'rgba(255,178,122,0.22)':'rgba(122,184,255,0.07)';
        ctx.strokeStyle=act?'#ffb27a':'#3c4a5e'; ctx.lineWidth=act?2.2:1;
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(lx,cy,bwid,46,7);}else{ctx.beginPath();ctx.rect(lx,cy,bwid,46);}
        ctx.fill(); ctx.stroke();
        ctx.fillStyle=act?'#ffb27a':'#9b99a3'; ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(labels[i][0], lx+bwid/2, cy+15);
        ctx.fillStyle=act?'#dfeefb':'#6f6e7a'; ctx.font='11px sans-serif';
        ctx.fillText(labels[i][1], lx+bwid/2, cy+33); ctx.textBaseline='alphabetic'; }
      // answer
      if(f.ans){ ctx.fillStyle='#8fe3b5'; ctx.font='700 18px monospace'; ctx.textAlign='center';
        ctx.fillText('⇒ '+f.ans, W/2, H*0.95); } }
  },

  // ══════ 병합(algo3_04) ▸ 정렬의 하한 (결정 트리) ══════
  { id:'algo_br_lb', concept:true, branchOf:'algo3_04',
    enter:function(E){ this.s={shown:-1,t0:0}; E.setOn&&E.setOn([]); },
    build:function(E){ return [
      {n:0, cap:'<b>비교 한 번</b> = 예/아니오 갈림길. 모든 비교 정렬은 <b>결정 트리</b>로 그릴 수 있습니다. 뿌리: 첫 비교 <b>a&lt;b ?</b>'},
      {n:1, cap:'결과에 따라 두 갈래로 — <b>a&lt;b</b>면 왼쪽(b:c), <b>a&gt;b</b>면 오른쪽(a:c). 한 층 = 비교 한 번.'},
      {n:2, cap:'다시 비교하면 또 두 갈래. 트리가 한 층씩 자랄 때마다 잎이 <b>최대 2배</b>로 늘어납니다.'},
      {n:3, cap:'끝까지 갈라지면 <b>잎 = 가능한 모든 순서</b>. n=3이면 <b>3! = 6개</b> 결과를 전부 가려내야 합니다.'},
      {n:4, cap:'잎이 n!개 이상 필요한데, 높이 h 이진트리의 잎은 ≤ 2^h. <b>n! ≤ 2^h</b>.'},
      {n:5, cap:'∴ 트리 높이(=최악 비교 횟수) <b>h ≥ log₂(n!) ≈ n log₂n</b>. 어떤 비교 정렬도 <b>Ω(n log n)</b>보다 빠를 수 없습니다.'}
    ]; },
    draw:function(E, st){ var s=this.s, ctx=E.ctx, cx=E.W/2;
      var show=(st&&st.n!=null)?st.n:0;
      if(s.shown!==show){ s.shown=show; s.t0=E.frame; }
      var ap=Math.min(1,(E.frame-s.t0)*0.12), ez=ap<0.5?2*ap*ap:1-Math.pow(-2*ap+2,2)/2;
      var top=E.H*0.15, dy=Math.min(E.H*0.155,78), L=E.W*0.225, M=E.W*0.105;
      // 트리 깊이는 show를 따라 자란다: depth = min(show,2) 비교층, leaf는 show>=3
      var dispDepth=Math.min(show,2);   // 비교 노드 층 (0=뿌리, 1, 2)
      function nd(x,y,t,leaf,a){ var w=leaf?78:54,h=26; ctx.globalAlpha=a;
        ctx.fillStyle=leaf?'rgba(143,227,181,0.18)':'rgba(122,184,255,0.16)';
        ctx.strokeStyle=leaf?'#8fe3b5':'#7ab8ff'; ctx.lineWidth=1.6;
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x-w/2,y,w,h,6);ctx.fill();ctx.stroke();}else{ctx.fillRect(x-w/2,y,w,h);ctx.strokeRect(x-w/2,y,w,h);}
        ctx.fillStyle=leaf?'#9be8c0':'#bfe0ff'; ctx.font=(leaf?'600 11px':'600 13px')+' sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(t,x,y+13); ctx.textBaseline='alphabetic'; ctx.globalAlpha=1; }
      function ed(x1,y1,x2,y2,lab,a){ ctx.globalAlpha=a*0.9; ctx.strokeStyle='rgba(255,255,255,0.20)'; ctx.lineWidth=1.3;
        ctx.beginPath(); ctx.moveTo(x1,y1+26); ctx.lineTo(x2,y2); ctx.stroke();
        if(lab){ ctx.fillStyle='#7ab8ff'; ctx.font='10px sans-serif'; ctx.textAlign='center';
          ctx.fillText(lab,(x1+x2)/2+(x2<x1?-9:9),(y1+26+y2)/2); }
        ctx.globalAlpha=1; }
      // 뿌리 (a:b)
      nd(cx,top,'a:b',false,1);
      // 층 1 노드 (b:c / a:c) — show>=1
      if(show>=1){ var a1=(show===1)?ez:1, d1=(show===1)?(1-ez)*-16:0;
        ed(cx,top,cx-L,top+dy+d1,'a<b',a1); ed(cx,top,cx+L,top+dy+d1,'a>b',a1);
        nd(cx-L,top+dy+d1,'b:c',false,a1); nd(cx+L,top+dy+d1,'a:c',false,a1); }
      // 층 2 잎 (6개) — show>=2 비교/잎이 차오름
      var lv=top+2*dy;
      var leafX=[cx-L-M, cx-L+M, cx+L-M, cx+L+M];
      var leafLab=['abc','b<c<a','bac','a<c<b'];  // 단순화된 분기 라벨
      var leafLab2=['acb','cba'];
      if(show>=2){ var a2=(show===2)?ez:1, d2=(show===2)?(1-ez)*-14:0;
        var parents=[cx-L,cx-L,cx+L,cx+L];
        for(var i=0;i<4;i++){ ed(parents[i],top+dy,leafX[i],lv+d2,i<2?'<':'>',a2);
          nd(leafX[i],lv+d2,leafLab[i],true,a2); } }
      // 결론 텍스트
      var by=lv+62;
      if(show>=3){ var a3=(show===3)?ez:1; ctx.globalAlpha=a3;
        ctx.fillStyle='#8fe3b5'; ctx.font='600 14px sans-serif'; ctx.textAlign='center';
        ctx.fillText('잎 = 가능한 모든 순서 = n! (n=3 → 6개)', cx, by); ctx.globalAlpha=1; }
      if(show>=4){ var a4=(show===4)?ez:1; ctx.globalAlpha=a4;
        ctx.fillStyle='#ffb27a'; ctx.font='600 15px sans-serif'; ctx.textAlign='center';
        ctx.fillText('n!  ≤  2^h   (h = 트리 높이 = 최악 비교 횟수)', cx, by+24); ctx.globalAlpha=1; }
      if(show>=5){ var a5=(show===5)?ez:1; ctx.globalAlpha=a5;
        ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif'; ctx.textAlign='center';
        ctx.fillText('→  h ≥ log₂(n!) = Ω(n log n)', cx, by+50); ctx.globalAlpha=1; }
      E.big('비교 정렬의 한계 — Ω(n log n)', '비교만으로 정렬하는 모든 알고리즘 = 결정 트리. n!개 결과를 구분하려면 높이 ≥ log₂(n!) → 어떤 비교정렬도 O(n log n)보다 빠를 수 없음! D로 단계 · S 자동'); }
  },

  // ══════ 병합(algo3_04) ▸ 계수 정렬 ══════
  { id:'algo_br_count', branchOf:'algo3_04', impl_lang:'C++',
    impl:['#include <iostream>','#include <vector>','using namespace std;','',
      '// 계수 정렬 — 값의 범위가 0..k-1일 때 비교 없이 O(n+k)',
      'vector<int> countingSort(const vector<int>& A, int k) {',
      '    int n = A.size();',
      '    vector<int> cnt(k, 0), out(n);',
      '    for (int i = 0; i < n; i++) cnt[A[i]]++;        // 1) 개수 세기',
      '    for (int v = 1; v < k; v++) cnt[v] += cnt[v-1]; // 2) 누적합(끝 위치)',
      '    for (int i = n - 1; i >= 0; i--)                // 3) 뒤에서부터 안정 배치',
      '        out[--cnt[A[i]]] = A[i];',
      '    return out;',
      '}',
      '',
      'int main() {',
      '    vector<int> A = {2,5,3,0,2,3,0,3};',
      '    vector<int> sorted = countingSort(A, 6);',
      '    for (int x : sorted) std::cout << x << " ";  // 0 0 2 2 3 3 3 5',
      '    std::cout << "\\n";',
      '    return 0;',
      '}'],
    code:[
      'countingSort(A, k) {',
      '  cnt[0..k-1] = 0',
      '  for i in 0..n-1: cnt[A[i]]++       // 1) 개수 세기',
      '  for v in 1..k-1: cnt[v]+=cnt[v-1]  // 2) 누적합',
      '  for i in n-1..0:                    // 3) 뒤에서부터',
      '    out[--cnt[A[i]]] = A[i]           //    안정 배치',
      '  return out',
      '}'
    ],
    build:function(V){ var A=[2,5,3,0,2,3,0,3], K=6, n=A.length, st=[];
      function snap(line,cap,o){ var cntC=o.cnt?o.cnt.slice():null, outC=o.out?o.out.slice():null;
        st.push({line:line, cap:cap, A:A, K:K, cnt:cntC, out:outC, cur:(o.cur==null?-1:o.cur), hcnt:(o.hcnt==null?-1:o.hcnt), phase:o.phase}); }
      var cnt=[]; for(var v=0;v<K;v++) cnt[v]=0;
      snap(1,'값의 범위는 <b>0~'+(K-1)+'</b>. 길이 '+K+'짜리 <b>count 배열을 0으로</b> 초기화합니다.',{cnt:cnt,phase:'init'});
      // 1) 개수 세기
      for(var i=0;i<n;i++){ cnt[A[i]]++;
        snap(2,'입력 A['+i+'] = <b>'+A[i]+'</b> → count['+A[i]+'] 를 1 증가 (이제 '+cnt[A[i]]+').',{cnt:cnt,cur:i,hcnt:A[i],phase:'count'}); }
      snap(2,'<b>개수 세기 완료.</b> count[v] = 값 v가 몇 번 나왔는가.',{cnt:cnt,phase:'count'});
      // 2) 누적합
      for(var w=1;w<K;w++){ cnt[w]+=cnt[w-1];
        snap(3,'누적합: count['+w+'] += count['+(w-1)+'] → <b>'+cnt[w]+'</b>. (값 '+w+'의 <b>끝 위치+1</b>)',{cnt:cnt,hcnt:w,phase:'prefix'}); }
      snap(3,'<b>누적합 완료.</b> 이제 count[v]는 값 v가 들어갈 출력의 <b>경계(끝+1)</b>입니다.',{cnt:cnt,phase:'prefix'});
      // 3) 안정 배치 (뒤에서부터)
      var out=[]; for(var z=0;z<n;z++) out[z]=null;
      for(var j=n-1;j>=0;j--){ var val=A[j]; cnt[val]--; var pos=cnt[val]; out[pos]=val;
        snap(5,'A['+j+'] = <b>'+val+'</b> : count['+val+']을 1 줄여 <b>'+pos+'</b> → out['+pos+'] = '+val+'. (뒤에서부터라 <b>안정</b>)',{cnt:cnt,out:out,cur:j,hcnt:val,phase:'place'}); }
      snap(6,'<b>정렬 완료!</b> 비교 한 번 없이 O(n+k). 같은 값의 원래 순서가 보존되는 <b>안정 정렬</b>입니다.',{cnt:cnt,out:out,phase:'done'});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H, A=f.A, K=f.K, n=A.length;
      ctx.textAlign='center';
      // 제목
      ctx.fillStyle='#cfd8e6'; ctx.font='600 15px sans-serif';
      ctx.fillText('계수 정렬 = 개수 세기 → 누적합(경계) → 뒤에서부터 안정 배치', W/2, H*0.085);
      // 공통 셀 렌더 헬퍼
      function cells(arr,y,bw,opt){ opt=opt||{}; var m=arr.length, totalW=m*bw+(m-1)*6, x0=W/2-totalW/2;
        for(var i=0;i<m;i++){ var x=x0+i*(bw+6), val=arr[i];
          var hl=opt.hl?opt.hl(i,val):null;
          ctx.fillStyle=hl?hl.fill:'rgba(122,184,255,0.10)'; ctx.strokeStyle=hl?hl.stroke:'#3c4a5e'; ctx.lineWidth=hl?2:1;
          rrect(ctx,x,y,bw,bw,7); ctx.fill(); ctx.stroke();
          ctx.fillStyle=hl?hl.text:'#dfeefb'; ctx.font='600 16px monospace'; ctx.textAlign='center';
          ctx.fillText(val==null?'·':(''+val), x+bw/2, y+bw/2+6);
          if(opt.idx){ ctx.fillStyle='#6f6e7a'; ctx.font='10px sans-serif'; ctx.fillText(''+i, x+bw/2, y+bw+14); }
        } return {x0:x0,bw:bw}; }
      var BW=Math.min(40,(W*0.80)/Math.max(n,K)-6);
      // 입력 배열
      ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillText('입력 A', W/2-(n*BW+(n-1)*6)/2, H*0.155);
      cells(A, H*0.18, BW, { idx:true, hl:function(i,val){
        if(i===f.cur) return {fill:'rgba(255,178,122,0.28)',stroke:'#ffb27a',text:'#ffb27a'};
        return null; } });
      // count 배열
      if(f.cnt){
        ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif'; ctx.textAlign='left';
        var lbl=(f.phase==='prefix'||f.phase==='place'||f.phase==='done')?'count (누적합 = 경계)':'count (개수)';
        ctx.fillText(lbl, W/2-(K*BW+(K-1)*6)/2, H*0.405);
        cells(f.cnt, H*0.43, BW, { idx:true, hl:function(i,val){
          if(i===f.hcnt) return {fill:'rgba(255,178,122,0.28)',stroke:'#ffb27a',text:'#ffb27a'};
          return {fill:'rgba(122,184,255,0.14)',stroke:'#7ab8ff',text:'#dfeefb'}; } });
        // count 인덱스가 곧 '값 v' 임을 표기
        ctx.fillStyle='#6f6e7a'; ctx.font='10px sans-serif'; ctx.textAlign='center';
        ctx.fillText('(인덱스 = 값 v)', W/2, H*0.43+BW+28);
      }
      // 출력 배열
      if(f.out){
        ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif'; ctx.textAlign='left';
        ctx.fillText('출력 out', W/2-(n*BW+(n-1)*6)/2, H*0.655);
        cells(f.out, H*0.68, BW, { idx:true, hl:function(i,val){
          if(val==null) return {fill:'rgba(255,255,255,0.03)',stroke:'#2c3543',text:'#5a5a64'};
          if(f.phase==='place' && f.hcnt!=null && val===f.hcnt && f.cnt && i===f.cnt[f.hcnt])
            return {fill:'rgba(255,178,122,0.30)',stroke:'#ffb27a',text:'#ffb27a'};
          return {fill:'rgba(143,227,181,0.20)',stroke:'#8fe3b5',text:'#8fe3b5'}; } });
      }
      // 단계 배지
      var badge = f.phase==='init'?'준비':f.phase==='count'?'1단계 · 개수 세기':f.phase==='prefix'?'2단계 · 누적합':f.phase==='place'?'3단계 · 안정 배치':'완료';
      var bcol = (f.phase==='done')?'#8fe3b5':'#ffb27a';
      ctx.textAlign='center'; ctx.fillStyle=bcol; ctx.font='600 13px sans-serif';
      ctx.fillText('▶ '+badge, W/2, H*0.95); }
  },

  // ══════ 병합(algo3_04) ▸ 기수 정렬 ══════
  { id:'algo_br_radix', branchOf:'algo3_04',
    code:[
      'RADIX-SORT(a):                  // LSD, 낮은 자리부터',
      '  for d = 1, 10, 100, ...:      // 각 자릿수',
      '    bucket[0..9] ← 빈 큐 10개',
      '    for x in a:                 // 분배(distribute)',
      '      digit ← (x / d) % 10',
      '      bucket[digit].push(x)     // 해당 칸으로',
      '    a ← bucket0 ++ bucket1 ++ ... ++ bucket9  // 수집(안정)',
      '  // 최고 자리까지 끝나면 정렬 완료'
    ],
    build:function(V){
      var a=[66,45,75,90,2,24]; var n=a.length; var st=[];
      var maxV=Math.max.apply(null,a);
      function snap(line,cap,o){ o=o||{};
        st.push({line:line,cap:cap, arr:(o.arr||a).slice(), n:n,
          d:(o.d==null?0:o.d), digitPos:(o.digitPos==null?-1:o.digitPos),
          buckets:o.buckets?o.buckets.map(function(b){return b.slice();}):null,
          cur:(o.cur==null?-1:o.cur), curDigit:(o.curDigit==null?-1:o.curDigit),
          phase:o.phase||'', done:!!o.done}); }
      snap([0],'정렬할 수: <b>[66, 45, 75, 90, 2, 24]</b>. 통째 비교하지 않고 <b>자릿수 하나씩</b> 처리합니다(LSD).',{arr:a});
      var dpNames=['1의 자리','10의 자리','100의 자리'];
      var d=1, pos=0;
      while(Math.floor(maxV/d)>0){
        var buckets=[]; for(var b=0;b<10;b++) buckets.push([]);
        snap([1,2],'<b>'+dpNames[pos]+'</b> (d='+d+') 처리: 10개의 빈 버킷(0~9)을 준비합니다.',{arr:a,d:d,digitPos:pos,buckets:buckets,phase:'init'});
        // distribute
        for(var i=0;i<a.length;i++){
          var dig=Math.floor(a[i]/d)%10;
          buckets[dig].push(a[i]);
          snap([4,5],'<b>'+a[i]+'</b> 의 '+dpNames[pos]+' = ('+a[i]+'/'+d+')%10 = <b>'+dig+'</b> → 버킷 '+dig+'에 넣습니다.',{arr:a,d:d,digitPos:pos,buckets:buckets,cur:i,curDigit:dig,phase:'dist'});
        }
        // collect (stable)
        var out=[]; for(b=0;b<10;b++){ for(var q=0;q<buckets[b].length;q++) out.push(buckets[b][q]); }
        snap([6],'버킷 0→9 순서로 꺼내 이어붙입니다(안정): <b>['+out.join(', ')+']</b>. 같은 자릿값은 넣은 순서 유지.',{arr:out,d:d,digitPos:pos,buckets:buckets,phase:'collect'});
        a=out;
        d*=10; pos++;
      }
      snap([7],'<b>정렬 완료!</b> 최고 자리까지 끝났습니다 → <b>['+a.join(', ')+']</b>. 안정성 덕에 자리별 순서가 누적됩니다. O(d(n+k)).',{arr:a,d:0,digitPos:-1,phase:'done',done:true});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H,n=f.n,a=f.arr;
      ctx.textAlign='center'; ctx.textBaseline='alphabetic';
      ctx.fillStyle='#cfd8e6'; ctx.font='600 15px sans-serif';
      ctx.fillText('기수 정렬(LSD) — 낮은 자리부터 버킷에 분배·수집', W/2, H*0.09);
      // current array row
      var cw=Math.min(78,(W*0.80)/n), totalW=n*cw, x0=W/2-totalW/2, y0=H*0.17, chh=42;
      ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillText('현재 배열', x0, y0-8);
      for(var k=0;k<n;k++){
        var px=x0+k*cw, isCur=(k===f.cur);
        var col=isCur?'#ffb27a':(f.done?'#8fe3b5':'#7ab8ff');
        var fill=isCur?'rgba(255,178,122,0.28)':(f.done?'rgba(143,227,181,0.18)':'rgba(122,184,255,0.12)');
        ctx.fillStyle=fill; ctx.strokeStyle=col; ctx.lineWidth=isCur?2.4:1.3;
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(px+3,y0,cw-6,chh,7);}else{ctx.beginPath();ctx.rect(px+3,y0,cw-6,chh);}
        ctx.fill(); ctx.stroke();
        // highlight current digit
        var s=''+a[k];
        ctx.fillStyle=col; ctx.font='600 18px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
        if(f.digitPos>=0){
          // show number, underline the active digit place
          ctx.fillText(s, px+cw/2, y0+chh/2);
          var dig=Math.floor(a[k]/(f.d||1))%10;
          ctx.fillStyle=isCur?'#ffb27a':'#ffd9b8'; ctx.font='600 11px monospace';
          ctx.textBaseline='alphabetic'; ctx.fillText('['+dig+']', px+cw/2, y0+chh-4);
        } else {
          ctx.fillText(s, px+cw/2, y0+chh/2);
        }
        ctx.textBaseline='alphabetic';
      }
      // buckets grid (10 buckets)
      if(f.buckets){
        var bw=Math.min(64,(W*0.92)/10), bx0=W/2-(bw*10)/2, by0=H*0.40, bh=H*0.42;
        ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif'; ctx.textAlign='left';
        ctx.fillText('버킷 0~9 (자릿값별)', bx0, by0-8);
        for(var bi=0;bi<10;bi++){
          var bxx=bx0+bi*bw;
          var active=(bi===f.curDigit);
          ctx.strokeStyle=active?'#ffb27a':'rgba(122,184,255,0.30)'; ctx.lineWidth=active?2.4:1.2;
          ctx.fillStyle=active?'rgba(255,178,122,0.08)':'rgba(122,184,255,0.04)';
          ctx.beginPath(); ctx.rect(bxx+2,by0,bw-4,bh); ctx.fill(); ctx.stroke();
          // bucket label
          ctx.fillStyle=active?'#ffb27a':'#7f8a9b'; ctx.font='600 13px monospace'; ctx.textAlign='center'; ctx.textBaseline='alphabetic';
          ctx.fillText(''+bi, bxx+bw/2, by0+bh+16);
          // contents (stacked from bottom)
          var bucket=f.buckets[bi];
          for(var q=0;q<bucket.length;q++){
            var vy=by0+bh-8-(bucket.length-1-q)*26 - 10;
            ctx.fillStyle='rgba(143,227,181,0.18)'; ctx.strokeStyle='#8fe3b5'; ctx.lineWidth=1.2;
            if(ctx.roundRect){ctx.beginPath();ctx.roundRect(bxx+5,vy,bw-10,22,5);}else{ctx.beginPath();ctx.rect(bxx+5,vy,bw-10,22);}
            ctx.fill(); ctx.stroke();
            ctx.fillStyle='#8fe3b5'; ctx.font='600 13px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
            ctx.fillText(''+bucket[q], bxx+bw/2, vy+11); ctx.textBaseline='alphabetic';
          }
        }
      }
      // status badge
      ctx.textAlign='center';
      var badge = f.done?'정렬 완료':(f.phase==='dist')?'분배(distribute)':(f.phase==='collect')?'수집(collect, 안정)':(f.phase==='init')?'버킷 준비':'시작';
      var bcol = f.done?'#8fe3b5':(f.phase==='collect')?'#8fe3b5':'#ffb27a';
      ctx.fillStyle=bcol; ctx.font='600 14px sans-serif';
      ctx.fillText('▶ '+badge, W/2, H*0.965); }
  },

  // ══════ 퀵(algo3_05) ▸ 순서 통계 / quickselect ══════
  { id:'algo_br_select', branchOf:'algo3_05', impl_lang:'C++',
    impl:['#include <iostream>','#include <vector>','using namespace std;','',
      '// Lomuto 분할: arr[lo..hi]를 피벗 기준으로 나누고 피벗의 최종 위치 반환',
      'int partition(vector<int>& a, int lo, int hi) {',
      '    int pivot = a[hi];          // 맨 뒤 원소를 피벗으로',
      '    int i = lo - 1;             // 작은 값 경계',
      '    for (int j = lo; j < hi; j++)',
      '        if (a[j] < pivot)       // 피벗보다 작으면 왼쪽으로',
      '            swap(a[++i], a[j]);',
      '    swap(a[i + 1], a[hi]);      // 피벗을 제자리에',
      '    return i + 1;               // 피벗의 최종 인덱스',
      '}',
      '',
      '// k번째(0-기반) 작은 값을 평균 O(n)에 — 한쪽만 재귀',
      'int quickselect(vector<int>& a, int lo, int hi, int k) {',
      '    if (lo == hi) return a[lo];        // 원소 하나 → 그것이 답',
      '    int p = partition(a, lo, hi);      // 피벗 위치 p',
      '    if (k == p) return a[p];           // 찾음!',
      '    else if (k < p)',
      '        return quickselect(a, lo, p - 1, k);   // 왼쪽만',
      '    else',
      '        return quickselect(a, p + 1, hi, k);   // 오른쪽만',
      '}',
      '',
      'int main() {',
      '    vector<int> a = {7, 2, 9, 4, 1, 6, 3};',
      '    int k = 5;                         // 5번째 작은 값(1-기반)',
      '    cout << k << "th smallest = "',
      '         << quickselect(a, 0, a.size() - 1, k - 1) << "\\n";  // 6',
      '    return 0;',
      '}'],
    code:[
      'int quickselect(a, lo, hi, k) {  // k=0기반 목표 인덱스',
      '  if (lo == hi) return a[lo];',
      '  p = partition(a, lo, hi);      // 피벗 제자리 → 위치 p',
      '  if (k == p) return a[p];       // 찾음!',
      '  else if (k < p)',
      '    return quickselect(a, lo, p-1, k);  // 왼쪽만 재귀',
      '  else',
      '    return quickselect(a, p+1, hi, k);  // 오른쪽만 재귀',
      '}'
    ],
    build:function(V){ var st=[];
      var a=[7,2,9,4,1,6,3], K=5, target=K-1; // 5번째 작은 값 → 0기반 인덱스 4
      function snap(line,cap,o){ var f={line:line,cap:cap,a:a.slice(),target:target,K:K,
        lo:o.lo, hi:o.hi, pivot:o.pivot==null?-1:o.pivot, i:o.i==null?-2:o.i, j:o.j==null?-1:o.j,
        p:o.p==null?-1:o.p, found:o.found==null?-1:o.found, done:!!o.done};
        st.push(f); }
      function swap(x,y){ var t=a[x]; a[x]=a[y]; a[y]=t; }
      function partition(lo,hi){
        var pv=a[hi]; snap(2,'분할 시작: 구간 ['+lo+'..'+hi+'], 피벗 = 맨 뒤 <b>a['+hi+']='+pv+'</b>. 작은 값을 왼쪽으로 모읍니다.',{lo:lo,hi:hi,pivot:hi,i:lo-1});
        var i=lo-1;
        for(var j=lo;j<hi;j++){
          if(a[j]<pv){ snap(2,'a['+j+']='+a[j]+' &lt; 피벗 '+pv+' → 작은쪽으로. i 전진 후 a['+(i+1)+']↔a['+j+'] 교환.',{lo:lo,hi:hi,pivot:hi,i:i,j:j});
            i++; swap(i,j); }
          else { snap(2,'a['+j+']='+a[j]+' ≥ 피벗 '+pv+' → 그대로 둠.',{lo:lo,hi:hi,pivot:hi,i:i,j:j}); }
        }
        swap(i+1,hi); var p=i+1;
        snap(2,'피벗 '+pv+'을 제자리 <b>인덱스 '+p+'</b>로. 이제 a['+p+'] 왼쪽은 모두 작고 오른쪽은 모두 큼(정렬 불필요).',{lo:lo,hi:hi,pivot:p,i:i,j:-1,p:p});
        return p;
      }
      function qs(lo,hi){
        if(lo===hi){ snap(1,'구간 원소 하나(['+lo+'..'+hi+']) → <b>a['+lo+']='+a[lo]+'</b> 가 곧 답.',{lo:lo,hi:hi,found:lo,done:true}); return; }
        var p=partition(lo,hi);
        snap(3,'피벗 위치 p='+p+' 과 목표 k='+target+' 비교.',{lo:lo,hi:hi,pivot:p,p:p});
        if(target===p){ snap(3,'<b>k == p</b> → 피벗이 바로 '+K+'번째 작은 값! <b>답 = '+a[p]+'</b>',{lo:lo,hi:hi,pivot:p,p:p,found:p,done:true}); return; }
        else if(target<p){ snap(4,'k='+target+' &lt; p='+p+' → 답은 <b>왼쪽 구간 ['+lo+'..'+(p-1)+']</b>. 오른쪽은 통째로 <b>버립니다</b>(O(n) 핵심).',{lo:lo,hi:hi,pivot:p,p:p});
          snap(5,'왼쪽만 재귀: quickselect('+lo+', '+(p-1)+', k).',{lo:lo,hi:p-1,pivot:-1}); qs(lo,p-1); }
        else { snap(6,'k='+target+' &gt; p='+p+' → 답은 <b>오른쪽 구간 ['+(p+1)+'..'+hi+']</b>. 왼쪽은 통째로 <b>버립니다</b>(O(n) 핵심).',{lo:lo,hi:hi,pivot:p,p:p});
          snap(7,'오른쪽만 재귀: quickselect('+(p+1)+', '+hi+', k).',{lo:p+1,hi:hi,pivot:-1}); qs(p+1,hi); }
      }
      snap(0,'배열 [7,2,9,4,1,6,3] 에서 <b>'+K+'번째 작은 값</b>(0기반 목표 인덱스 k='+target+')을 정렬 없이 찾습니다.',{lo:0,hi:a.length-1});
      qs(0,a.length-1);
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx, W=V.W, H=V.H;
      // 안내 헤더
      ctx.textAlign='center'; ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif';
      ctx.fillText('퀵셀렉트 — 피벗으로 분할 후 k가 있는 한쪽만 재귀(반대쪽 버림) → 평균 O(n)', W/2, H*0.16);
      // 배열 박스
      var info=AV.arr(V, f.a, { y:H*0.34, bw:54, gap:9, idx:true, cx:W/2, hl:function(idx){
        var inRange = (idx>=f.lo && idx<=f.hi);
        if(idx===f.found) return {fill:'rgba(143,227,181,0.40)',stroke:'#8fe3b5',text:'#eafff4',tag:'답'};
        if(idx===f.pivot) return {fill:'rgba(255,178,122,0.34)',stroke:'#ffb27a',text:'#fff',tag:'피벗'};
        if(idx===f.j)     return {fill:'rgba(122,184,255,0.28)',stroke:'#7ab8ff',text:'#dfeefb',tag:'j'};
        if(!inRange)      return {fill:'rgba(255,255,255,0.03)',stroke:'rgba(255,255,255,0.14)',text:'#5a5f6b'}; // 버려진 구간 흐리게
        return {fill:'rgba(223,238,251,0.10)',stroke:'#dfeefb',text:'#dfeefb'}; // 탐색 구간 강조
      } });
      // i 경계 포인터
      if(f.i>=-1 && f.i<f.a.length){ var ix= f.i<0 ? info.x0-info.gap-4 : info.boxes[f.i].cx;
        AV.pointer(V, ix, info.y+info.bw+30, 'i', '#ffb27a'); }
      // lo / hi / k(목표) 표시 라인
      ctx.font='600 13px sans-serif'; ctx.textBaseline='alphabetic';
      var lox=info.boxes[f.lo].cx, hix=info.boxes[f.hi].cx, kbx=info.boxes[f.target].cx;
      ctx.fillStyle='#7ab8ff'; ctx.textAlign='center';
      ctx.fillText('lo='+f.lo, lox, info.y-30);
      ctx.fillText('hi='+f.hi, hix, info.y-48);
      // 탐색 구간 괄호선
      ctx.strokeStyle='rgba(223,238,251,0.45)'; ctx.lineWidth=2; ctx.beginPath();
      var lx=info.boxes[f.lo].x-3, rx=info.boxes[f.hi].x+info.bw+3, by=info.y-14;
      ctx.moveTo(lx,by-6); ctx.lineTo(lx,by); ctx.lineTo(rx,by); ctx.lineTo(rx,by-6); ctx.stroke();
      // 목표 k 마커 (배열 아래)
      ctx.fillStyle='#f4a0c0'; ctx.font='600 12px sans-serif';
      ctx.fillText('▲ 목표 k='+f.target, kbx, info.y+info.bw+52);
      // 우상단 요약 박스
      var px=W*0.5, py=H*0.62;
      ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif'; ctx.textAlign='center';
      ctx.fillText(f.K+'번째 작은 값 = 정렬했을 때 인덱스 '+f.target+'의 값', px, py);
      if(f.p>=0){ ctx.fillStyle='#ffb27a'; ctx.font='600 14px monospace';
        var rel = f.target===f.p?'k == p (찾음)':(f.target<f.p?'k < p → 왼쪽':'k > p → 오른쪽');
        ctx.fillText('피벗 위치 p='+f.p+'   vs   목표 k='+f.target+'   ⇒   '+rel, px, py+26); }
      if(f.found>=0){ ctx.fillStyle='#8fe3b5'; ctx.font='600 18px monospace'; ctx.textAlign='center';
        ctx.fillText('↩ '+f.K+'번째 작은 값 = '+f.a[f.found], px, py+62); }
      // 색 범례
      ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillStyle='#6f6e7a';
      ctx.fillText('주황=피벗  ·  파랑=비교 중(j)  ·  밝은=탐색 구간  ·  흐림=버린 구간  ·  초록=답', W/2, H*0.96); }
  },

  // ══════ 힙(algo5_04) ▸ 힙 정렬 ══════
  { id:'algo_br_heapsort', concept:true, branchOf:'algo5_04',
    enter:function(E){ this.s={step:0}; this.snaps=this.build(); E.setOn([]); },
    build:function(){ // 힙에서 최댓값을 끝으로 빼는 과정 스냅샷
      var h=[42,35,30,28,18,9,12], n=h.length, snaps=[{a:h.slice(),sorted:0}];
      function siftDown(a,i,sz){ while(true){ var l=2*i+1,r=2*i+2,m=i; if(l<sz&&a[l]>a[m])m=l; if(r<sz&&a[r]>a[m])m=r; if(m===i)break; var t=a[i];a[i]=a[m];a[m]=t; i=m; } }
      for(var sz=n; sz>1; sz--){ var t=h[0]; h[0]=h[sz-1]; h[sz-1]=t; siftDown(h,0,sz-1); snaps.push({a:h.slice(),sorted:n-sz+1}); }
      return snaps; },
    tap:function(E){ this.s.step=(this.s.step+1)%this.snaps.length; E.blip(440+this.s.step*30,0.1); },
    draw:function(E){ var ctx=E.ctx, snap=this.snaps[this.s.step], n=snap.a.length;
      AV.bars(E, snap.a, { baseY:E.H*0.62, maxH:E.H*0.40, bw:52, label:true, cx:E.W/2, hl:function(i){ return i>=n-snap.sorted?'#8fe3b5':(i===0?'#ffb27a':'#7ab8ff'); } });
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('주황=루트(최댓값) → 끝으로 / 초록=정렬 완료', E.W/2, E.H*0.68);
      E.tapHint(E.W/2, E.H*0.74, this.s.step>=this.snaps.length-1?'↻ 다시':'▶ 최댓값을 끝으로 빼기', true);
      E.big('힙 정렬 — O(n log n), 제자리', '최대 힙의 루트=최댓값을 끝으로 빼고 힙 크기를 줄여 sift-down 반복. 추가 메모리 없이(in-place) O(n log n)!'); }
  },

  // ══════ 힙(algo5_04) ▸ 힙 만들기 build-heap O(n) ══════
  { id:'algo_br_buildheap', branchOf:'algo5_04', impl_lang:'C++',
    impl:['#include <iostream>','using namespace std;','',
      '// 한 노드를 자식들과 비교하며 아래로 내려보내 힙성질 복구',
      'void siftDown(int a[], int i, int n){',
      '    while(true){',
      '        int l=2*i+1, r=2*i+2, big=i;',
      '        if(l<n && a[l]>a[big]) big=l;   // 왼자식이 더 큼',
      '        if(r<n && a[r]>a[big]) big=r;   // 오른자식이 더 큼',
      '        if(big==i) break;               // 더 내려갈 곳 없음',
      '        swap(a[i], a[big]); i=big;      // 교환 후 그 자리로',
      '    }',
      '}',
      '// 잎은 이미 힙 → 마지막 내부노드(n/2-1)부터 거꾸로',
      'void buildHeap(int a[], int n){',
      '    for(int i = n/2-1; i >= 0; i--)',
      '        siftDown(a, i, n);',
      '}',
      '',
      'int main(){',
      '    int a[] = {3,9,2,1,7,5,8,4,6};',
      '    buildHeap(a, 9);',
      '    for(int x: a) std::cout << x << " ";  // 9 7 8 6 3 5 2 4 1',
      '    return 0;',
      '}'],
    code:[
      'BUILD-MAX-HEAP(a, n) {',
      '  for i = n/2-1 downto 0      // 마지막 부모부터 거꾸로',
      '    SIFT-DOWN(a, i, n)        // 그 노드를 아래로 내림',
      '}',
      'SIFT-DOWN(a, i, n) {',
      '  big = i; l = 2i+1; r = 2i+2',
      '  if l<n & a[l]>a[big]: big=l  // 더 큰 자식 고르기',
      '  if r<n & a[r]>a[big]: big=r',
      '  if big != i: swap(a[i],a[big]); i=big; repeat',
      '}'
    ],
    build:function(V){ var H=[3,9,2,1,7,5,8,4,6], n=H.length, st=[];
      var settled={};                       // 이미 힙성질 확정된 인덱스
      function snap(line,cap,cur,extra){
        var f={line:line, cap:cap, H:H.slice(), cur:(cur==null?-1:cur),
               settled:Object.keys(settled).map(Number)};
        if(extra)for(var k in extra)f[k]=extra[k]; st.push(f); }
      snap(0,'배열 <b>[3,9,2,1,7,5,8,4,6]</b> 를 힙으로. 잎(인덱스 4~8)은 이미 힙 → 마지막 <b>부모</b> 인덱스 <b>n/2-1 = '+(n/2-1|0)+'</b> 부터 거꾸로 sift-down.',-1);
      for(var i=(n/2-1|0); i>=0; i--){
        snap(1,'i = <b>'+i+'</b> (값 '+H[i]+') 의 sift-down 시작.',i);
        var j=i;
        while(true){
          var l=2*j+1, r=2*j+2, big=j;
          if(l<n && H[l]>H[big]) big=l;
          if(r<n && H[r]>H[big]) big=r;
          // 비교 스냅: 자식과 비교
          var cl=(l<n)?l:-1, cr=(r<n)?r:-1;
          snap(6,'노드 '+H[j]+'(idx '+j+') 의 자식과 비교: '
                 +(cl>=0?('왼 '+H[cl]):'없음')+(cr>=0?(', 오른 '+H[cr]):'')
                 +' → 가장 큰 값은 <b>'+H[big]+'</b>(idx '+big+').',
                 j,{cmpL:cl, cmpR:cr});
          if(big===j){
            settled[j]=1;
            snap(8,'부모 '+H[j]+' ≥ 자식 → <b>제자리 확정</b>. sift-down 종료.',j);
            break;
          }
          // 교환 스냅
          snap(8,'부모 '+H[j]+' < 자식 '+H[big]+' → <b>교환</b>(부모를 아래로).',
               j,{swap:[j,big]});
          var t=H[j]; H[j]=H[big]; H[big]=t;
          settled[j]=1;                      // 위쪽 노드는 확정
          j=big;                             // 교환된 자리로 내려감
        }
      }
      snap(3,'<b>완료!</b> 전체가 최대 힙 → '+JSON.stringify(H)+'. 부모마다 비용은 높이 h, 높이 h 노드는 ~n/2^(h+1)개 → 합 <b>O(n)</b>.',-1,{done:true});
      return st; },
    draw:function(V,f){ var ctx=V.ctx, W=V.W, H=V.H, arr=f.H, n=arr.length;
      ctx.textAlign='center'; ctx.fillStyle='#cfd8e6'; ctx.font='600 15px sans-serif';
      ctx.fillText('힙 만들기: 마지막 부모(n/2-1)부터 거꾸로 sift-down — 잎은 건너뜀', W/2, H*0.07);
      var sset={}; (f.settled||[]).forEach(function(x){ sset[x]=1; });
      var sw=f.swap||[];
      function col(j){
        if(j===sw[0]||j===sw[1]) return {fill:'rgba(244,160,192,0.30)',stroke:'#f4a0c0',text:'#f4a0c0',tag:'교환'};
        if(j===f.cur) return {fill:'rgba(255,178,122,0.32)',stroke:'#ffb27a',text:'#ffb27a',tag:'내리는 중'};
        if(j===f.cmpL||j===f.cmpR) return {fill:'rgba(122,184,255,0.22)',stroke:'#7ab8ff',text:'#dfeefb',tag:'비교'};
        if(sset[j]) return {fill:'rgba(143,227,181,0.20)',stroke:'#8fe3b5',text:'#8fe3b5'};
        return null;
      }
      // 1) 이진 트리
      drawTreeB(V, arr, col, {top:H*0.20, lg:H*0.155, r:18});
      // 2) 배열 박스 (트리 인덱스와 동일 색)
      var bw=Math.min(W*0.86, n*48), bx0=W/2-bw/2, cw=bw/n, by=H*0.80;
      ctx.font='12px sans-serif'; ctx.fillStyle='#6f6e7a'; ctx.textAlign='center';
      ctx.fillText('▼ 배열 (인덱스 i의 자식 = 2i+1, 2i+2)', W/2, by-12);
      for(var k=0;k<n;k++){ var c=col(k), x=bx0+k*cw;
        ctx.fillStyle=(c&&c.fill)||'rgba(122,184,255,0.10)';
        ctx.strokeStyle=(c&&c.stroke)||'rgba(255,255,255,0.18)'; ctx.lineWidth=c?2:1;
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x+3,by,cw-6,40,7);ctx.fill();ctx.stroke();}
        else {ctx.fillRect(x+3,by,cw-6,40);ctx.strokeRect(x+3,by,cw-6,40);}
        ctx.fillStyle=(c&&c.text)||'#dfeefb'; ctx.font='600 16px monospace';
        ctx.fillText(arr[k], x+cw/2, by+26);
        ctx.fillStyle='#6f6e7a'; ctx.font='10px monospace'; ctx.fillText(k, x+cw/2, by+52); }
      // 3) 범례 / 결과
      ctx.textAlign='center'; ctx.font='12px sans-serif';
      if(f.done){ ctx.fillStyle='#8fe3b5'; ctx.font='600 15px sans-serif';
        ctx.fillText('최대 힙 완성 — build 단계는 O(n) (삽입 n번 O(n log n)보다 빠름)', W/2, H*0.95); }
      else { ctx.fillStyle='#9b99a3';
        ctx.fillText('주황=내리는 노드 · 분홍=교환쌍 · 파랑=비교 자식 · 초록=확정', W/2, H*0.95); } }
  },

  // ══════ DFS(algo6_04) ▸ 위상 정렬 ══════
  // ══════ DFS(algo6_04) ▸ 위상 정렬 (코드+빌드: 칸 알고리즘) ══════
  { id:'algo_br_topo', branchOf:'algo6_04', impl_lang:'C++',
    impl:['#include <iostream>','#include <vector>','#include <queue>','using namespace std;','',
      '// 칸(Kahn) 알고리즘: 진입차수 0인 정점을 차례로 빼며 위상 순서를 만든다',
      'int main() {',
      '    const int V = 6;                       // 정점 0..5',
      '    vector<vector<int>> adj(V);            // 인접 리스트(방향)',
      '    int indeg[V] = {0};                    // 각 정점의 진입차수',
      '',
      '    // 간선 u -> v 추가 (u가 v보다 먼저)',
      '    auto add = [&](int u, int v){ adj[u].push_back(v); indeg[v]++; };',
      '    add(0,1); add(0,2); add(1,3); add(2,3); add(3,4); add(1,5); add(3,5);',
      '',
      '    queue<int> q;',
      '    for (int i = 0; i < V; i++)            // 진입차수 0인 정점을 큐에',
      '        if (indeg[i] == 0) q.push(i);',
      '',
      '    vector<int> order;',
      '    while (!q.empty()) {',
      '        int u = q.front(); q.pop();        // 꺼내서 출력에 추가',
      '        order.push_back(u);',
      '        for (int v : adj[u])               // 이웃의 진입차수 감소',
      '            if (--indeg[v] == 0) q.push(v); // 0이 되면 큐에',
      '    }',
      '',
      '    for (int x : order) cout << x << " ";   // 0 1 2 3 4 5',
      '    cout << "\\n";',
      '    return 0;',
      '}'],
    code:[
      'for each v: compute indeg[v]   // 진입차수 계산',
      'Q = { v : indeg[v] == 0 }      // 0인 정점 큐에',
      'while Q not empty:',
      '  u = Q.pop();  order += u     // 꺼내 출력',
      '  for each edge u -> v:        // 이웃 순회',
      '    indeg[v] -= 1              // 진입차수 감소',
      '    if indeg[v] == 0: Q.push(v)// 0되면 큐에'
    ],
    build:function(V){
      var NM=['미적분','선대','자구','알고리즘','OS','ML'], n=6;
      // 고정 DAG: u -> v (u가 v보다 먼저)
      var EG=[[0,1],[0,2],[1,3],[2,3],[3,4],[1,5],[3,5]];
      var adj=[]; for(var a=0;a<n;a++) adj[a]=[];
      var indeg=[0,0,0,0,0,0];
      for(var e=0;e<EG.length;e++){ adj[EG[e][0]].push(EG[e][1]); indeg[EG[e][1]]++; }
      var st=[], Q=[], order=[];
      function snap(line,cap,cur,upd){
        st.push({line:line, cap:cap, eg:EG, indeg:indeg.slice(),
          queue:Q.slice(), order:order.slice(),
          cur:cur==null?-1:cur, upd:upd==null?-1:upd}); }
      // 1) 진입차수 계산
      snap(0,'<b>진입차수 계산</b>: 각 정점으로 들어오는 화살표 수를 셉니다. 0=선수과목 없음.', -1, -1);
      // 2) 진입차수 0인 정점을 큐에
      for(var i=0;i<n;i++){ if(indeg[i]===0){ Q.push(i);
        snap(1,'<b>'+NM[i]+'</b>(진입차수 0) → 큐에 넣습니다. 바로 들을 수 있는 과목.', i, -1); } }
      // 3) 메인 루프
      while(Q.length){
        var u=Q.shift(); order.push(u);
        snap(3,'큐에서 <b>'+NM[u]+'</b> 꺼냄 → 출력 순서 '+(order.length)+'번째로 확정.', u, -1);
        for(var k=0;k<adj[u].length;k++){
          var v=adj[u][k];
          snap(4,'<b>'+NM[u]+' → '+NM[v]+'</b> 간선: 이웃 '+NM[v]+'의 진입차수를 줄입니다.', u, v);
          indeg[v]--;
          if(indeg[v]===0){ Q.push(v);
            snap(6,'<b>'+NM[v]+'</b> 진입차수 0 도달 → 선수과목 모두 끝남! 큐에 넣습니다.', u, v);
          } else {
            snap(5,NM[v]+' 진입차수 = <b>'+indeg[v]+'</b> (아직 ≠0) → 큐에 안 넣음.', u, v);
          }
        }
      }
      snap(2,'<b>완료!</b> 위상 순서: '+order.map(function(x){return NM[x];}).join(' → ')+'. 모든 "A→B면 A 먼저"를 만족. O(V+E).', -1, -1);
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx, W=V.W, H=V.H;
      var NM=['미적분','선대','자구','알고리즘','OS','ML'];
      // 고정 좌표(상대값) — 왼→오 위상 흐름
      var P=[[0.06,0.20],[0.32,0.10],[0.32,0.62],[0.60,0.34],[0.86,0.16],[0.86,0.66]];
      function px(i){ return [W*0.14+P[i][0]*W*0.60, H*0.18+P[i][1]*H*0.50]; }
      // 출력 완료 여부
      var done={}; for(var o=0;o<f.order.length;o++) done[f.order[o]]=o+1;
      // 간선 그리기 (현재 처리 정점에서 나가는 간선 강조)
      for(var k=0;k<f.eg.length;k++){ var e=f.eg[k];
        var hot=(e[0]===f.cur && e[1]===f.upd);
        var col=hot?'#ffb27a':(done[e[0]]?'rgba(143,227,181,0.35)':'rgba(122,184,255,0.45)');
        gedge(V, px(e[0]), px(e[1]), col, hot?3.5:2); }
      // 정점 그리기
      for(var i=0;i<6;i++){ var p=px(i), isCur=(i===f.cur && done[i]==null), isUpd=(i===f.upd), isDone=(done[i]!=null);
        var fill, stroke;
        if(isCur){ fill='rgba(255,178,122,0.28)'; stroke='#ffb27a'; }
        else if(isUpd){ fill='rgba(255,178,122,0.18)'; stroke='#ffb27a'; }
        else if(isDone){ fill='rgba(143,227,181,0.16)'; stroke='#8fe3b5'; }
        else { fill='rgba(122,184,255,0.16)'; stroke='#7ab8ff'; }
        if(isCur){ ctx.save(); ctx.shadowColor='#ffb27a'; ctx.shadowBlur=18; }
        AV.node(V,p[0],p[1],NM[i],{r:26,fs:12,fill:fill,stroke:stroke,text:isDone&&!isCur?'#9b99a3':'#dfeefb'});
        if(isCur) ctx.restore();
        // 진입차수 배지(우상단)
        var bd=f.indeg[i], bx=p[0]+20, by=p[1]-20;
        ctx.beginPath(); ctx.arc(bx,by,11,0,Math.PI*2);
        ctx.fillStyle=(bd===0)?'#8fe3b5':'#34323c'; ctx.fill();
        ctx.strokeStyle=(bd===0)?'#8fe3b5':'#7ab8ff'; ctx.lineWidth=1.5; ctx.stroke();
        ctx.fillStyle=(bd===0)?'#1a1820':'#dfeefb'; ctx.font='600 12px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(bd, bx, by); ctx.textBaseline='alphabetic';
        // 출력 순번 배지(좌하단)
        if(isDone){ ctx.fillStyle='#8fe3b5'; ctx.font='600 12px sans-serif'; ctx.textAlign='center';
          ctx.fillText('#'+done[i], p[0]-22, p[1]+22); } }
      // 하단: 큐 + 출력 순서
      ctx.textAlign='left'; ctx.font='600 13px sans-serif';
      ctx.fillStyle='#7ab8ff'; ctx.fillText('큐(Q):', W*0.10, H*0.86);
      var qx=W*0.22;
      if(f.queue.length===0){ ctx.fillStyle='#6f6e7a'; ctx.font='13px sans-serif'; ctx.fillText('(비어 있음)', qx, H*0.86); }
      for(var j=0;j<f.queue.length;j++){ var qn=NM[f.queue[j]];
        ctx.fillStyle='rgba(122,184,255,0.14)'; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=1.5;
        var qw=Math.max(46,qn.length*13+18);
        rrect(ctx,qx,H*0.86-15,qw,22,6); ctx.fill(); ctx.stroke();
        ctx.fillStyle='#dfeefb'; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText(qn, qx+qw/2, H*0.86); ctx.textAlign='left';
        qx+=qw+8; }
      ctx.fillStyle='#8fe3b5'; ctx.font='600 13px sans-serif';
      ctx.fillText('출력 순서:', W*0.10, H*0.94);
      var ostr=f.order.map(function(x){return NM[x];}).join('  →  ');
      ctx.fillStyle='#8fe3b5'; ctx.font='600 14px sans-serif';
      ctx.fillText(ostr||'(아직 없음)', W*0.24, H*0.94);
      ctx.fillStyle='#9b99a3'; ctx.font='11px sans-serif'; ctx.textAlign='center';
      ctx.fillText('초록 배지 = 진입차수 0(지금 들을 수 있음)  ·  주황 = 처리 중  ·  #n = 출력 순번', W/2, H*0.99); ctx.textAlign='left'; }
  },

  // ══════ DFS(algo6_04) ▸ 강연결요소 SCC ══════
  { id:'algo_br_scc', concept:true, branchOf:'algo6_04',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx;
      var P=[[0.12,0.3],[0.32,0.18],[0.30,0.55],[0.62,0.30],[0.82,0.20],[0.78,0.58]];
      var EG=[[0,1],[1,2],[2,0],[1,3],[3,4],[4,5],[5,3]]; // {0,1,2} 와 {3,4,5} 두 SCC
      var grp=[0,0,0,1,1,1], cols=['#8fe3b5','#f4a0c0'];
      function px(i){ return [E.W*0.14+P[i][0]*E.W*0.6, E.H*0.18+P[i][1]*E.H*0.5]; }
      EG.forEach(function(e){ gedge(E, px(e[0]), px(e[1]), 'rgba(255,255,255,0.28)'); });
      for(var i=0;i<P.length;i++){ var p=px(i); AV.node(E,p[0],p[1],'',{r:20,fill:cols[grp[i]].replace? 'rgba(143,227,181,0.18)':'',stroke:cols[grp[i]]}); }
      ctx.font='600 14px sans-serif'; ctx.textAlign='center';
      ctx.fillStyle='#8fe3b5'; ctx.fillText('SCC 1 (서로 오갈 수 있음)', E.W*0.28, E.H*0.76);
      ctx.fillStyle='#f4a0c0'; ctx.fillText('SCC 2', E.W*0.72, E.H*0.76);
      E.big('강연결요소(SCC) — 서로 도달 가능한 덩어리', '방향 그래프에서 "서로 오갈 수 있는" 정점들의 최대 그룹. DFS 두 번(원그래프+역그래프)으로 O(V+E)에 찾음. 웹·SNS 군집 분석'); }
  },

  // ══════ 다익스트라(algo6_05) ▸ 벨만-포드 ══════
  { id:'algo_br_bellman', branchOf:'algo6_05', impl_lang:'C++',
    impl:['#include <iostream>','#include <vector>','using namespace std;','',
      'const int V = 5, INF = 1e9;',
      'struct Edge { int u, v, w; };',
      '',
      '// 벨만-포드: 출발 s에서 모든 정점까지 최단거리(음수 간선 OK)',
      'int main() {',
      '    // 정점 0=A 1=B 2=C 3=D 4=E,  간선 (u,v,가중치)',
      '    vector<Edge> edges = {',
      '        {2,4,-2}, {1,2,5}, {3,2,-3},',
      '        {0,1, 6}, {0,3,7}, {1,4, 8}',
      '    };',
      '    vector<int> d(V, INF);',
      '    d[0] = 0;                          // 출발점 A = 0',
      '',
      '    for (int i = 1; i < V; i++) {      // V-1번 반복',
      '        bool changed = false;',
      '        for (auto& e : edges)          // 모든 간선 완화(relax)',
      '            if (d[e.u] != INF && d[e.u] + e.w < d[e.v]) {',
      '                d[e.v] = d[e.u] + e.w; // 더 짧으면 갱신',
      '                changed = true;',
      '            }',
      '        if (!changed) break;           // 갱신 없으면 조기 종료',
      '    }',
      '',
      '    const char* nm = "ABCDE";',
      '    for (int v = 0; v < V; v++)',
      '        cout << nm[v] << " = " << d[v] << "\\n";',
      '    return 0;                          // A=0 B=6 C=4 D=7 E=2',
      '}'],
    code:[
      'd[s] = 0;                  // 출발=0, 나머지=∞',
      'for i = 1 to V-1:          // V-1번 반복',
      '  changed = false',
      '  for each edge (u,v,w):   // 모든 간선 완화',
      '    if d[u] + w < d[v]:    // 더 짧아지면',
      '      d[v] = d[u] + w      // 완화(relax)',
      '      changed = true',
      '  if not changed: break    // 갱신 없으면 종료'
    ],
    build:function(V){
      var NM=['A','B','C','D','E'], INF=1e9, n=5;
      // 간선 (u,v,w) — 처리 순서 고정. 한 칸씩 전파되도록 정렬됨.
      var EG=[[2,4,-2],[1,2,5],[3,2,-3],[0,1,6],[0,3,7],[1,4,8]];
      var d=[INF,INF,INF,INF,INF]; d[0]=0;
      var st=[];
      function dv(x){ return x>=INF?'∞':(''+x); }
      function snap(line,cap,cur,upd){
        st.push({line:line, cap:cap, dist:d.slice(), eg:EG, src:0,
          cur:cur==null?-1:cur, upd:upd==null?-1:upd}); }
      snap(0,'초기화: 출발점 <b>A=0</b>, 나머지 정점은 <b>∞</b>(아직 도달 못함).', -1, 0);
      for(var i=1;i<n;i++){
        snap(1,'<b>라운드 '+i+'</b> / '+(n-1)+' 시작 — 모든 간선을 한 차례 검사·완화합니다.', -1, -1);
        var changed=false;
        for(var k=0;k<EG.length;k++){
          var u=EG[k][0], v=EG[k][1], w=EG[k][2];
          var us=d[u]>=INF?'∞':d[u], vs=d[v]>=INF?'∞':d[v];
          if(d[u]<INF && d[u]+w<d[v]){
            snap(4, NM[u]+'→'+NM[v]+' (w='+w+'): d['+NM[u]+']+w = '+us+'+('+w+') = <b>'+(d[u]+w)+'</b> &lt; d['+NM[v]+']='+vs+' → 완화!', k, -1);
            d[v]=d[u]+w; changed=true;
            snap(5,'<b>완화(relax)</b> 적용: d['+NM[v]+'] = <b>'+d[v]+'</b> 로 갱신.', k, v);
          } else {
            var reason = d[u]>=INF ? ('d['+NM[u]+']=∞ (아직 도달 못함) → 건너뜀')
                                   : (us+'+('+w+') = '+(d[u]+w)+' ≥ d['+NM[v]+']='+vs+' → 갱신 없음');
            snap(4, NM[u]+'→'+NM[v]+' (w='+w+'): '+reason, k, -1);
          }
        }
        if(!changed){
          snap(7,'<b>라운드 '+i+'에서 갱신 0건</b> → 거리 안정. 조기 종료(break)!', -1, -1);
          break;
        }
        snap(2,'라운드 '+i+' 끝 — 갱신이 있었으므로 다음 라운드로. 정보가 한 칸씩 더 멀리 전파됩니다.', -1, -1);
      }
      snap(7,'<b>완료!</b> 최단거리 A=0, B=6, C=4, D=7, <b>E=2</b>. 음수 간선이 있어도 정확! O(VE).', -1, -1);
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx, W=V.W, H=V.H;
      var NM=['A','B','C','D','E'], INF=1e9;
      // 고정 좌표(상대값) — V.W/V.H 비례 배치
      var P=[[0.10,0.45],[0.40,0.18],[0.40,0.72],[0.72,0.30],[0.90,0.62]];
      function px(i){ return [W*0.14+P[i][0]*W*0.62, H*0.20+P[i][1]*H*0.52]; }
      // 간선 그리기 (현재 검사 간선 강조)
      for(var k=0;k<f.eg.length;k++){ var e=f.eg[k], cur=(k===f.cur);
        var neg=e[2]<0, col=cur?'#ffb27a':(neg?'#f4a0c0':'rgba(122,184,255,0.5)');
        gedge(V, px(e[0]), px(e[1]), col, cur?3.5:2, e[2]); }
      // 정점 그리기 (출발=주황, 갱신=초록 펄스)
      for(var i=0;i<P.length;i++){ var p=px(i), dval=f.dist[i];
        var lab=NM[i]+':'+(dval>=INF?'∞':dval);
        var isSrc=(i===f.src), isUpd=(i===f.upd);
        var fill=isUpd?'rgba(143,227,181,0.32)':isSrc?'rgba(255,178,122,0.25)':'rgba(122,184,255,0.16)';
        var stroke=isUpd?'#8fe3b5':isSrc?'#ffb27a':'#7ab8ff';
        if(isUpd){ ctx.save(); ctx.shadowColor='#8fe3b5'; ctx.shadowBlur=18; }
        AV.node(V,p[0],p[1],lab,{r:24,fs:13,fill:fill,stroke:stroke});
        if(isUpd) ctx.restore(); }
      // 거리표
      var tx=W*0.13, ty=H*0.86, cw=Math.min(72,(W*0.74)/5);
      ctx.font='600 12px sans-serif'; ctx.textAlign='center';
      for(var j=0;j<5;j++){ var cx=tx+j*cw, dval=f.dist[j], upd=(j===f.upd);
        ctx.fillStyle=upd?'#8fe3b5':'#9b99a3'; ctx.fillText('d['+NM[j]+']', cx+cw/2, ty);
        ctx.fillStyle=upd?'#8fe3b5':'#dfeefb'; ctx.font='600 16px sans-serif';
        ctx.fillText(dval>=INF?'∞':dval, cx+cw/2, ty+22); ctx.font='600 12px sans-serif'; }
      ctx.fillStyle='#f4a0c0'; ctx.font='12px sans-serif'; ctx.textAlign='center';
      ctx.fillText('분홍 = 음수 간선  ·  주황 = 지금 검사하는 간선  ·  초록 펄스 = 방금 완화된 거리', W/2, H*0.96); }
  },

  // ══════ 다익스트라(algo6_05) ▸ 플로이드-워셜 ══════
  { id:'algo_br_floyd', concept:true, branchOf:'algo6_05',
    enter:function(E){ this.s={k:0}; E.setOn([]);
      var INF=9; var d0=[[0,3,INF,7],[8,0,2,INF],[5,INF,0,1],[2,INF,INF,0]];
      this.snaps=[JSON.parse(JSON.stringify(d0))];
      var d=JSON.parse(JSON.stringify(d0));
      for(var k=0;k<4;k++){ for(var i=0;i<4;i++)for(var j=0;j<4;j++){ if(d[i][k]+d[k][j]<d[i][j]) d[i][j]=d[i][k]+d[k][j]; } this.snaps.push(JSON.parse(JSON.stringify(d))); }
      E.controls('<div class="ctrl"><label>경유 정점 k까지</label><input type="range" id="kk" min="0" max="4" step="1" value="0"><output id="kko">0</output></div>');
      var self=this; E.bind('#kk','input',function(e){ self.s.k=+e.target.value; document.getElementById('kko').textContent=e.target.value; E.blip(440,0.1); }); },
    draw:function(E){ var ctx=E.ctx, M=this.snaps[this.s.k], N=4, cell=Math.min(64,E.H*0.11), x0=E.W/2-N*cell/2, y0=E.H*0.30, NM=['A','B','C','D'];
      for(var j=0;j<N;j++){ ctx.fillStyle='#7ab8ff'; ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.fillText(NM[j], x0+j*cell+cell/2, y0-8); ctx.fillText(NM[j], x0-16, y0+j*cell+cell/2+4); }
      for(var i=0;i<N;i++)for(var j2=0;j2<N;j2++){ var x=x0+j2*cell,y=y0+i*cell,v=M[i][j2];
        ctx.fillStyle='rgba(122,184,255,0.10)'; ctx.strokeStyle='rgba(122,184,255,0.4)'; ctx.lineWidth=1; ctx.fillRect(x,y,cell-2,cell-2); ctx.strokeRect(x,y,cell-2,cell-2);
        ctx.fillStyle=v>=9?'#4a4955':'#dfeefb'; ctx.font='600 16px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(v>=9?'∞':v, x+cell/2-1, y+cell/2-1); ctx.textBaseline='alphabetic'; }
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j])', E.W/2, y0+N*cell+24);
      E.big('플로이드-워셜 — 모든 쌍 최단경로', 'k를 거쳐 더 짧아지면 갱신, k=모든 정점 반복 → 모든 쌍 동시 해결! 삼중 반복 O(V³), 동적계획법. 음수 간선 OK'); }
  },

  // ══════ 다익스트라(algo6_05) ▸ 최소 신장 트리 MST ══════
  { id:'algo_br_mst', branchOf:'algo6_05', impl_lang:'C++',
    impl:['#include <iostream>','#include <vector>','#include <algorithm>','using namespace std;','',
      'const int V = 5;                 // 정점 0=A 1=B 2=C 3=D 4=E',
      'struct Edge { int u, v, w; };',
      '',
      'int par[V];                      // union-find 부모 배열',
      'int find(int x){ return par[x]==x ? x : par[x]=find(par[x]); }',
      'bool uni(int a,int b){           // 합치기 (이미 한 집합이면 false)',
      '    a=find(a); b=find(b);',
      '    if(a==b) return false;       // 사이클 → 거부',
      '    par[a]=b; return true;       // 다른 집합 → 합침',
      '}',
      '',
      '// 크루스칼: 간선을 가중치 오름차순으로 보며 사이클 없는 것만 채택',
      'int main(){',
      '    vector<Edge> e = {',
      '        {0,1,1},{1,2,2},{0,2,3},{1,3,4},',
      '        {3,4,5},{2,4,6},{0,3,7}',
      '    };',
      '    sort(e.begin(), e.end(),',
      '         [](Edge a, Edge b){ return a.w < b.w; });',
      '    for(int i=0;i<V;i++) par[i]=i;  // 각자 자기 집합',
      '',
      '    int total=0, cnt=0;',
      '    for(auto& x : e){',
      '        if(uni(x.u, x.v)){          // 합쳐지면 = 사이클 아님',
      '            total += x.w; cnt++;     // MST에 채택',
      '            if(cnt == V-1) break;    // 간선 V-1개면 완성',
      '        }',
      '    }',
      '    cout << "MST weight = " << total << "\\n";  // 12',
      '    return 0;',
      '}'],
    code:[
      'sort(edges by w)            // 가중치 오름차순',
      'for v in V: par[v] = v      // 각자 자기 집합',
      'total = 0;  cnt = 0',
      'for each (u,v,w) in order:',
      '  if find(u) != find(v):    // 다른 집합 → 사이클 X',
      '    union(u, v);  total += w   // MST에 채택',
      '    if cnt == V-1: break     // 간선 V-1개면 완성',
      '  else: skip                // 같은 집합 → 사이클'
    ],
    build:function(V){
      var NM=['A','B','C','D','E'], n=5;
      // 정렬 전 간선 [u,v,w]
      var RAW=[[0,1,1],[1,2,2],[0,2,3],[1,3,4],[3,4,5],[2,4,6],[0,3,7]];
      var EG=RAW.slice().sort(function(a,b){ return a[2]-b[2]; }); // 가중치 오름차순
      var par=[0,1,2,3,4];
      function find(x){ while(par[x]!==x){ par[x]=par[par[x]]; x=par[x]; } return x; }
      // 채택 상태: -1=미검사, 1=채택, 0=거부(사이클)
      var state=EG.map(function(){ return -1; });
      var st=[], total=0, cnt=0;
      function snap(line,cap,cur){
        st.push({line:line, cap:cap, eg:EG, state:state.slice(),
          par:par.slice(), cur:cur==null?-1:cur, total:total, cnt:cnt}); }
      var ord = EG.map(function(e){ return NM[e[0]]+NM[e[1]]+'('+e[2]+')'; }).join('  ');
      snap(0,'간선을 가중치 오름차순으로 정렬: <b>'+ord+'</b>. 싼 것부터 봅니다.', -1);
      snap(1,'union-find 초기화: 정점 5개가 <b>각자 자기 집합</b>(par[v]=v). 아직 아무것도 연결 안 됨.', -1);
      snap(2,'채택 간선 합 total=0, 개수 cnt=0. <b>간선 '+(n-1)+'개</b>를 채우면 MST 완성.', -1);
      for(var k=0;k<EG.length;k++){
        var u=EG[k][0], v=EG[k][1], w=EG[k][2];
        var ru=find(u), rv=find(v);
        if(ru!==rv){
          snap(4, '<b>'+NM[u]+'–'+NM[v]+' (w='+w+')</b>: find('+NM[u]+')≠find('+NM[v]+') → 서로 다른 집합, <b>사이클 아님</b>.', k);
          par[ru]=rv; state[k]=1; total+=w; cnt++;
          snap(5, '<b>채택!</b> '+NM[u]+', '+NM[v]+' 집합을 합칩니다. total = <b>'+total+'</b>, 채택 간선 '+cnt+'개.', k);
          if(cnt===n-1){
            snap(6, '간선이 <b>'+(n-1)+'개</b> 모였습니다 → 모든 정점 연결 완료, <b>break</b>!', k);
            break;
          }
        } else {
          snap(7, '<b>'+NM[u]+'–'+NM[v]+' (w='+w+')</b>: find('+NM[u]+')=find('+NM[v]+') → 이미 같은 집합. 추가하면 <b>사이클</b> → 건너뜀.', k);
          state[k]=0;
        }
      }
      snap(6,'<b>완성!</b> MST 총 가중치 = <b>'+total+'</b> (간선 '+cnt+'개, 사이클 없이 전부 연결). 크루스칼: 그리디 + union-find, O(E log E).', -1);
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx, W=V.W, H=V.H;
      var NM=['A','B','C','D','E'];
      // 고정 좌표(상대값) — V.W/V.H 비례 배치
      var P=[[0.22,0.30],[0.55,0.12],[0.88,0.34],[0.18,0.74],[0.62,0.78]];
      function px(i){ return [W*0.14+P[i][0]*W*0.60, H*0.18+P[i][1]*H*0.52]; }
      // union-find 집합별 색 (find 루트로 그룹)
      var SET=['#7ab8ff','#ffb27a','#f4a0c0','#8fe3b5','#c9a8ff'];
      function root(x){ var p=f.par; while(p[x]!==x){ x=p[x]; } return x; }
      // 간선 그리기
      for(var k=0;k<f.eg.length;k++){ var e=f.eg[k], cur=(k===f.cur), s=f.state[k];
        var col, lw;
        if(s===1){ col='#8fe3b5'; lw=4; }                 // 채택(초록 굵게)
        else if(cur && s===0){ col='#f4a0c0'; lw=2.5; }   // 지금 거부(사이클)
        else if(cur){ col='#ffb27a'; lw=3; }              // 지금 검사
        else if(s===0){ col='rgba(244,160,192,0.28)'; lw=1.2; } // 거부됨(흐림)
        else { col='rgba(255,255,255,0.16)'; lw=1.2; }    // 미검사
        uedge(V, px(e[0]), px(e[1]), col, lw, e[2]); }
      // 정점 그리기 (집합 색으로 구분)
      for(var i=0;i<P.length;i++){ var p=px(i), r=root(i), endpt=(f.cur>=0 && (f.eg[f.cur][0]===i||f.eg[f.cur][1]===i));
        var col=SET[r%SET.length];
        var fillCol = endpt ? 'rgba(255,178,122,0.30)' : 'rgba(122,184,255,0.10)';
        if(endpt){ ctx.save(); ctx.shadowColor='#ffb27a'; ctx.shadowBlur=16; }
        AV.node(V,p[0],p[1],NM[i],{r:23,fs:15,fill:fillCol,stroke:endpt?'#ffb27a':col});
        if(endpt) ctx.restore(); }
      // 진행 패널 (채택 합 / 간선 수)
      ctx.textAlign='center'; ctx.font='600 14px sans-serif'; ctx.fillStyle='#8fe3b5';
      ctx.fillText('MST 가중치 합  total = '+f.total+'    ·    채택 간선  '+f.cnt+' / '+(NM.length-1), W/2, H*0.88);
      ctx.font='12px sans-serif'; ctx.fillStyle='#9b99a3';
      ctx.fillText('초록 = 채택(MST)  ·  주황 = 검사 중  ·  분홍 = 사이클로 거부  ·  정점 테두리색 = 같은 union-find 집합', W/2, H*0.95); }
  },

  // ══════ BST(algo5_03) ▸ 레드블랙 트리 ══════
  { id:'algo_br_rbt', concept:true, branchOf:'algo5_03',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx;
      // [val, color('R'/'B'), xrel, level]
      var N=[[13,'B',0.5,0],[8,'R',0.3,1],[17,'R',0.7,1],[6,'B',0.18,2],[11,'B',0.42,2],[15,'B',0.6,2],[25,'B',0.82,2]];
      var EG=[[0,1],[0,2],[1,3],[1,4],[2,5],[2,6]];
      function px(i){ return [E.W*0.14+N[i][2]*E.W*0.62, E.H*0.22+N[i][3]*E.H*0.18]; }
      EG.forEach(function(e){ var a=px(e[0]),b=px(e[1]); ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke(); });
      for(var i=0;i<N.length;i++){ var p=px(i), red=N[i][1]==='R';
        ctx.fillStyle=red?'rgba(226,75,74,0.85)':'rgba(40,40,52,0.95)'; ctx.strokeStyle=red?'#e24b4a':'#cfcdc6'; ctx.lineWidth=2.5;
        ctx.beginPath(); ctx.arc(p[0],p[1],22,0,7); ctx.fill(); ctx.stroke();
        ctx.fillStyle='#fff'; ctx.font='600 15px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(N[i][0],p[0],p[1]); ctx.textBaseline='alphabetic'; }
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('규칙: 루트=검정 · 빨강은 연속 불가 · 모든 경로의 검정 수 동일 → 높이 ≤ 2log(n+1)', E.W/2, E.H*0.74);
      E.big('레드블랙 트리 — 스스로 균형 잡는 BST', 'BST가 한쪽으로 치우치는 걸 막는 자가균형 트리(#24). 노드에 빨강/검정 색을 칠하고 삽입·삭제 시 회전+재색칠로 O(log n) 보장. map·set·DB 인덱스'); }
  },

  // ══════ 균형(algo5_05) ▸ B-트리 ══════
  { id:'algo_br_btree', concept:true, branchOf:'algo5_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx;
      function node(cx,cy,keys,col){ var kw=42,w=keys.length*kw,x=cx-w/2;
        ctx.fillStyle='rgba(122,184,255,0.12)'; ctx.strokeStyle=col||'#7ab8ff'; ctx.lineWidth=2;
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,cy,w,34,6);ctx.fill();ctx.stroke();}else{ctx.fillRect(x,cy,w,34);ctx.strokeRect(x,cy,w,34);}
        for(var i=0;i<keys.length;i++){ if(i>0){ ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.moveTo(x+i*kw,cy); ctx.lineTo(x+i*kw,cy+34); ctx.stroke(); }
          ctx.fillStyle='#dfeefb'; ctx.font='600 15px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(keys[i],x+i*kw+kw/2,cy+17); ctx.textBaseline='alphabetic'; }
        return {x:x,w:w,cy:cy}; }
      var root=node(E.W/2,E.H*0.26,[17,35],'#ffb27a');
      var cy2=E.H*0.5;
      var c1=node(E.W*0.22,cy2,[4,9,12]); var c2=node(E.W*0.5,cy2,[22,28]); var c3=node(E.W*0.78,cy2,[40,50,60]);
      [c1,c2,c3].forEach(function(c,i){ ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(root.x+i*(root.w/2),root.cy+34); ctx.lineTo(c.x+c.w/2,c.cy); ctx.stroke(); });
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('한 노드에 키 여러 개 → 한 번 읽기로 많은 키 확인 (디스크 접근 최소화)', E.W/2, E.H*0.66);
      E.big('B-트리 — 디스크·DB를 위한 다진(多進) 트리', '한 노드가 키를 여러 개 담아 자식이 많은 낮고 넓은 트리. 디스크 블록 하나=노드 하나로 읽어 디스크 접근을 최소화 → 데이터베이스·파일시스템 인덱스의 표준'); }
  },

  // ══════ 균형(algo5_05) ▸ union-find 서로소 집합 ══════
  { id:'algo_br_uf', concept:true, branchOf:'algo5_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx;
      // 병합 전: 두 트리 / 경로압축 후: 납작
      function nd(x,y,t,root){ ctx.fillStyle=root?'rgba(255,178,122,0.25)':'rgba(122,184,255,0.16)'; ctx.strokeStyle=root?'#ffb27a':'#7ab8ff'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.arc(x,y,20,0,7); ctx.fill(); ctx.stroke(); ctx.fillStyle='#dfeefb'; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(t,x,y); ctx.textBaseline='alphabetic'; }
      function par(a,b){ ctx.strokeStyle='rgba(143,227,181,0.6)'; ctx.lineWidth=2; AV.arrow(ctx,a[0],a[1]-20,b[0],b[1]+20,'rgba(143,227,181,0.6)',2); }
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('union(C, F): 두 집합을 하나로 (한 루트가 다른 루트의 자식)', E.W/2, E.H*0.20);
      var A=[E.W*0.5,E.H*0.30], B=[E.W*0.38,E.H*0.5], C=[E.W*0.62,E.H*0.5], D=[E.W*0.28,E.H*0.7], F=[E.W*0.7,E.H*0.7];
      par(B,A); par(C,A); par(D,B); par(F,C);
      nd(A[0],A[1],'A',true); nd(B[0],B[1],'B'); nd(C[0],C[1],'C'); nd(D[0],D[1],'D'); nd(F[0],F[1],'F');
      ctx.fillStyle='#8fe3b5'; ctx.font='13px sans-serif'; ctx.fillText('find(D) → 루트 A. 경로압축: 거쳐온 노드를 루트에 직접 연결 → 거의 O(1)', E.W/2, E.H*0.82);
      E.big('union-find — 집합 합치고·찾기', '"이 둘이 같은 그룹?"을 거의 O(1)에. 각 원소가 부모를 가리키는 트리 숲 + 두 기법(union by rank, path compression)으로 초고속. MST 크루스칼·네트워크 연결성·이미지 분할'); }
  },

  // ══════ DP 두 조건(algo7_04) ▸ 막대 자르기 ══════
  { id:'algo_br_rod', concept:true, branchOf:'algo7_04',
    enter:function(E){ this.p=[0,1,5,8,9,10,17,17,20]; this.s={n:4}; E.setOn([]);
      E.controls('<div class="ctrl"><label>막대 길이 n</label><input type="range" id="nn" min="1" max="8" step="1" value="4"><output id="nno">4</output></div>');
      var self=this; E.bind('#nn','input',function(e){ self.s.n=+e.target.value; document.getElementById('nno').textContent=e.target.value; E.blip(440,0.1); }); },
    draw:function(E){ var ctx=E.ctx, p=this.p, n=this.s.n;
      var r=[0], cut=[[]]; for(var i=1;i<=n;i++){ var best=-1,bj=0; for(var j=1;j<=i;j++){ if(p[j]+r[i-j]>best){best=p[j]+r[i-j];bj=j;} } r[i]=best; cut[i]=[bj].concat(cut[i-bj]); }
      // 막대 그리기
      var pieces=cut[n], total=n, x0=E.W/2-E.W*0.3, w=E.W*0.6, y=E.H*0.40, px=x0;
      for(var k=0;k<pieces.length;k++){ var pw=w*pieces[k]/total;
        ctx.fillStyle='rgba(122,184,255,0.2)'; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2; ctx.fillRect(px,y,pw-3,44); ctx.strokeRect(px,y,pw-3,44);
        ctx.fillStyle='#dfeefb'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('길이'+pieces[k], px+pw/2, y+20); ctx.fillStyle='#8fe3b5'; ctx.fillText('₩'+p[pieces[k]], px+pw/2, y+38); px+=pw; }
      // 가격표
      ctx.fillStyle='#6f6e7a'; ctx.font='12px sans-serif'; ctx.textAlign='center';
      ctx.fillText('길이별 가격: '+p.slice(1,9).map(function(v,i){return (i+1)+'→'+v;}).join('  '), E.W/2, E.H*0.62);
      E.big('막대 '+n+' = '+pieces.join('+')+' 자르기 → 최대 ₩'+r[n], '막대 자르기 — DP의 고전. r[n]=max over j (가격[j] + r[n−j]). 자르는 모든 방법을 표로 따져 최대 수익! (안 자른 통짜보다 이득일 때가 많음)'); }
  },

  // ══════ 격자 DP(algo7_05) ▸ 최장 공통 부분수열 LCS ══════
  { id:'algo_br_lcs', branchOf:'algo7_05', impl_lang:'C++',
    impl:['#include <iostream>','#include <string>','#include <vector>','#include <algorithm>','using namespace std;','',
      '// 최장 공통 부분수열 (LCS) — 격자 DP',
      'int lcs(const string& X, const string& Y) {',
      '    int m = X.size(), n = Y.size();',
      '    vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));',
      '    for (int i = 1; i <= m; i++)',
      '        for (int j = 1; j <= n; j++)',
      '            if (X[i-1] == Y[j-1])               // 글자 같음',
      '                dp[i][j] = dp[i-1][j-1] + 1;    // ↖ 대각선 + 1',
      '            else                                 // 글자 다름',
      '                dp[i][j] = max(dp[i-1][j], dp[i][j-1]); // ↑,← 중 큰 값',
      '    return dp[m][n];',
      '}',
      '',
      'int main() {',
      '    string X = "ABCB", Y = "BDCB";',
      '    cout << "LCS = " << lcs(X, Y) << "\\n";  // 3 ("BCB")',
      '    return 0;',
      '}'],
    code:[
      'LCS(X, Y) {                       // 최장 공통 부분수열',
      '  dp[i][0]=0;  dp[0][j]=0          // 기저(빈 문자열)',
      '  for i=1..m, j=1..n:',
      '    if (X[i-1] == Y[j-1])',
      '      dp[i][j] = dp[i-1][j-1] + 1  // ↖ 대각선 +1',
      '    else',
      '      dp[i][j] = max(dp[i-1][j],   // ↑ 위',
      '                     dp[i][j-1])   // ← 왼쪽',
      '  return dp[m][n]',
      '}'
    ],
    build:function(V){ var X='ABCB', Y='BDCB', m=X.length, n=Y.length, dp=[], st=[];
      for(var i=0;i<=m;i++){ dp[i]=[]; for(var j=0;j<=n;j++) dp[i][j]=0; }
      function copy(){ return dp.map(function(r){return r.slice();}); }
      function snap(line,cap,cur,src,diag){ st.push({line:line,cap:cap,X:X,Y:Y,m:m,n:n,dp:copy(),cur:cur||null,src:src||null,diag:!!diag}); }
      snap(1,'기저: 한쪽이 빈 문자열이면 공통 부분수열 길이는 <b>0</b> → 0번 행·열을 0으로 채웁니다.', null, null, false);
      for(i=1;i<=m;i++)for(j=1;j<=n;j++){
        if(X[i-1]===Y[j-1]){ dp[i][j]=dp[i-1][j-1]+1; snap(4,"X[<b>"+(i-1)+"</b>]='"+X[i-1]+"' = Y[<b>"+(j-1)+"</b>]='"+Y[j-1]+"' <b>같음</b> → ↖ 대각선 "+dp[i-1][j-1]+" + 1 = <b>"+dp[i][j]+"</b>", [i,j], [[i-1,j-1]], true); }
        else { dp[i][j]=Math.max(dp[i-1][j],dp[i][j-1]); snap(6,"'"+X[i-1]+"' ≠ '"+Y[j-1]+"' <b>다름</b> → max(↑"+dp[i-1][j]+", ←"+dp[i][j-1]+") = <b>"+dp[i][j]+"</b>", [i,j], [[i-1,j],[i,j-1]], false); }
      }
      snap(8,'<b>LCS 길이 = '+dp[m][n]+'</b> — 공통 부분수열은 "BCB"(순서 유지). 표의 오른쪽 끝 아래칸이 최종 답입니다.', [m,n], null, false);
      return st; },
    draw:function(V,f){ var ctx=V.ctx, cell=Math.min(60,V.H*0.12), x0=V.W/2-(f.n+1)*cell/2+cell*0.35, y0=V.H*0.28;
      ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      for(var j=0;j<=f.n;j++){ var x=x0+j*cell; ctx.fillStyle='#8fe3b5'; ctx.fillText(j===0?'∅':f.Y[j-1], x+cell/2, y0-cell*0.45); }
      for(var i=0;i<=f.m;i++){ var y=y0+i*cell; ctx.fillStyle='#ffb27a'; ctx.fillText(i===0?'∅':f.X[i-1], x0-cell*0.45, y+cell/2); }
      for(i=0;i<=f.m;i++)for(j=0;j<=f.n;j++){ var x=x0+j*cell, y=y0+i*cell;
        var cur=f.cur&&f.cur[0]===i&&f.cur[1]===j, src=f.src&&f.src.some(function(c){return c[0]===i&&c[1]===j;});
        ctx.fillStyle=cur?'rgba(255,178,122,0.32)':src?'rgba(143,227,181,0.22)':'rgba(122,184,255,0.12)';
        ctx.strokeStyle=cur?'#ffb27a':src?'#8fe3b5':'#7ab8ff'; ctx.lineWidth=1.5;
        ctx.fillRect(x,y,cell-3,cell-3); ctx.strokeRect(x,y,cell-3,cell-3);
        ctx.fillStyle=cur?'#ffb27a':'#dfeefb'; ctx.font='600 16px sans-serif'; ctx.fillText(f.dp[i][j], x+cell/2, y+cell/2); }
      // 현재 셀과 참조 셀이 같은(일치) 비교일 때 대각선 강조 화살표
      if(f.cur&&f.src&&f.diag){ var cx=x0+f.cur[1]*cell+cell/2, cyy=y0+f.cur[0]*cell+cell/2, sx=x0+f.src[0][1]*cell+cell/2, sy=y0+f.src[0][0]*cell+cell/2;
        ctx.strokeStyle='#8fe3b5'; ctx.lineWidth=2; ctx.setLineDash([4,3]); ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(cx,cyy); ctx.stroke(); ctx.setLineDash([]); }
      ctx.textBaseline='alphabetic';
      ctx.fillStyle='#6f6e7a'; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('주황=X 문자(행) / 초록=Y 문자(열) / 초록칸=참고한 이웃, 같으면 ↖+1·다르면 max(↑,←)', V.W/2, y0+(f.m+1)*cell+8); }
  },

  // ══════ 격자 DP(algo7_05) ▸ 0/1 배낭 ══════
  { id:'algo_br_knap', branchOf:'algo7_05', impl_lang:'C++',
    impl:['#include <iostream>','#include <vector>','#include <algorithm>','using namespace std;','',
      'int main() {',
      '    int wt[] = {2, 3, 4};      // 물건 무게',
      '    int val[] = {3, 4, 5};     // 물건 가치',
      '    int n = 3, W = 5;          // 물건 수, 배낭 용량',
      '    // dp[i][w] = 물건 1..i, 용량 w 에서의 최대 가치',
      '    vector<vector<int>> dp(n + 1, vector<int>(W + 1, 0));',
      '    for (int i = 1; i <= n; i++)',
      '        for (int w = 0; w <= W; w++) {',
      '            dp[i][w] = dp[i-1][w];            // 물건 i 안 담음',
      '            if (wt[i-1] <= w)                 // 담을 수 있으면',
      '                dp[i][w] = max(dp[i][w],',
      '                    val[i-1] + dp[i-1][w - wt[i-1]]);  // 담음',
      '        }',
      '    cout << "최대 가치 = " << dp[n][W] << "\\n";  // 7',
      '    return 0;',
      '}'],
    code:[
      'KNAPSACK(wt, val, n, W) {          // 0/1 배낭',
      '  dp[0][w] = 0                      // 기저: 물건 0개',
      '  for i = 1..n, w = 0..W:',
      '    dp[i][w] = dp[i-1][w]           // ① 물건 i 안 담음 (위 칸)',
      '    if (wt[i] <= w)                 // 담을 수 있으면',
      '      dp[i][w] = max(dp[i][w],',
      '        val[i] + dp[i-1][w-wt[i]])  // ② 담음 (가치 + 대각 왼쪽 위)',
      '  return dp[n][W]',
      '}'
    ],
    build:function(V){ var wt=[2,3,4], val=[3,4,5], nm=['A','B','C'], n=3, W=5, dp=[], st=[];
      for(var i=0;i<=n;i++){ dp[i]=[]; for(var w=0;w<=W;w++) dp[i][w]=0; }
      function copy(){ return dp.map(function(r){return r.slice();}); }
      function snap(line,cap,cur,src){ st.push({line:line,cap:cap,wt:wt,val:val,nm:nm,n:n,W:W,dp:copy(),cur:cur||null,src:src||null}); }
      snap(1,'기저: 물건이 0개면 어떤 용량이든 가치 = 0 (맨 윗줄 전부 0).', null, null);
      for(i=1;i<=n;i++)for(var w=0;w<=W;w++){
        var skip=dp[i-1][w];
        if(wt[i-1]>w){ dp[i][w]=skip;
          snap(3,'물건 '+nm[i-1]+'(무게 '+wt[i-1]+') > 용량 '+w+' → 못 담음. <b>위 칸 '+skip+'</b> 그대로.', [i,w], [[i-1,w]]); }
        else { var take=val[i-1]+dp[i-1][w-wt[i-1]];
          dp[i][w]=Math.max(skip,take);
          var pick=(take>skip);
          snap(6,'물건 '+nm[i-1]+': max( 안 담음 <b>'+skip+'</b>(위), 담음 <b>'+take+'</b> = 가치'+val[i-1]+'+'+dp[i-1][w-wt[i-1]]+'(대각) ) = <b>'+dp[i][w]+'</b>'+(pick?' → 담는 게 이득!':'.'),
            [i,w], pick?[[i-1,w],[i-1,w-wt[i-1]]]:[[i-1,w]]); }
      }
      snap(7,'<b>최대 가치 = '+dp[n][W]+'</b> (용량 '+W+': A+B = 무게 5, 가치 3+4 = 7 선택). 표 오른쪽 아래 칸이 답.', [n,W], null);
      return st; },
    draw:function(V,f){ var ctx=V.ctx, cell=Math.min(56,V.H*0.115,V.W/(f.W+3)), x0=V.W/2-(f.W+1)*cell/2+cell*0.35, y0=V.H*0.30;
      ctx.textAlign='center'; ctx.fillStyle='#cfd8e6'; ctx.font='600 15px sans-serif';
      ctx.fillText('0/1 배낭 DP — 행=물건(누적), 열=용량 w. 한 칸씩: max( 위 칸, 가치+대각 )', V.W/2, V.H*0.13);
      ctx.font='600 14px sans-serif'; ctx.textBaseline='middle';
      // 열 머리글(용량 w)
      for(var w=0;w<=f.W;w++){ var x=x0+w*cell; ctx.fillStyle='#8fe3b5'; ctx.fillText('w='+w, x+cell/2, y0-cell*0.45); }
      // 행 머리글(물건)
      for(var i=0;i<=f.n;i++){ var y=y0+i*cell; ctx.fillStyle='#ffb27a';
        ctx.fillText(i===0?'∅':(f.nm[i-1]+'('+f.wt[i-1]+'/'+f.val[i-1]+')'), x0-cell*0.95, y+cell/2); }
      // 표 본체
      for(i=0;i<=f.n;i++)for(w=0;w<=f.W;w++){ var x=x0+w*cell, y=y0+i*cell;
        var cur=f.cur&&f.cur[0]===i&&f.cur[1]===w;
        var src=f.src&&f.src.some(function(c){return c[0]===i&&c[1]===w;});
        var isAns=(i===f.n&&w===f.W&&f.line===7);
        ctx.fillStyle=cur?'rgba(255,178,122,0.32)':isAns?'rgba(143,227,181,0.32)':src?'rgba(143,227,181,0.22)':'rgba(122,184,255,0.12)';
        ctx.strokeStyle=cur?'#ffb27a':isAns?'#8fe3b5':src?'#8fe3b5':'#7ab8ff'; ctx.lineWidth=cur||isAns?2:1.4;
        ctx.fillRect(x,y,cell-3,cell-3); ctx.strokeRect(x,y,cell-3,cell-3);
        ctx.fillStyle=cur?'#ffb27a':isAns?'#8fe3b5':'#dfeefb'; ctx.font='600 16px sans-serif';
        ctx.fillText(f.dp[i][w], x+cell/2, y+cell/2); }
      ctx.textBaseline='alphabetic';
      ctx.fillStyle='#6f6e7a'; ctx.font='12px sans-serif';
      ctx.fillText('주황=계산 중인 칸 / 초록=참고한 칸(위·대각) / 물건 라벨 = 이름(무게/가치)', V.W/2, y0+(f.n+1)*cell+8); }
  },

  // ══════ 복잡도 등급표(algo1_05) ▸ 분할상환 분석 ══════
  { id:'algo_br_amort', branchOf:'algo1_05',
    code:[
      'PUSH(arr, x):                  // 동적 배열',
      '  if size == capacity:         // 꽉 찼으면',
      '    새 배열 ← capacity·2 크기   // 2배로',
      '    copy(전체 size개)           // 전부 복사 = O(size)',
      '    capacity ← capacity·2',
      '  arr[size++] = x              // 자리 추가 = O(1)',
      '// n번 후 총비용 ÷ n = 분할상환 O(1)'
    ],
    build:function(V){
      var N=8; var st=[];
      var cap=1, size=0, total=0;
      var costs=[]; // per-push cost
      function snap(line,capText,o){ o=o||{};
        st.push({line:line,cap:capText,N:N, capacity:cap, size:size,
          total:total, costs:costs.slice(), cur:(o.cur==null?-1:o.cur),
          resize:!!o.resize, done:!!o.done}); }
      for(var i=0;i<N;i++){
        var val=i+1; var c;
        if(size===cap){
          // resize: copy 'size' elements + 1 insert
          c = size + 1;
          var newcap=cap*2;
          cap=newcap; size++; total+=c; costs.push(c);
          snap([1,2,3,5],'push('+val+'): 용량이 꽉 찼습니다 → <b>2배('+newcap+')로 늘리고 기존 '+(size-1)+'개를 전부 복사</b>. 비용 = '+(size-1)+'(복사)+1 = <b>'+c+'</b>.', {cur:size-1,resize:true});
        } else {
          c = 1;
          size++; total+=c; costs.push(c);
          snap([5],'push('+val+'): 자리가 있습니다 → 그냥 끝에 추가. 비용 = <b>1</b> (O(1)).', {cur:size-1});
        }
      }
      snap([6],'<b>완료!</b> '+N+'번 push의 총비용 = <b>'+total+'</b>. 복사는 용량 1,2,4… 일 때만 일어나 합이 ≈2n에 묶입니다.', {done:true});
      snap([6],'분할상환 비용 = 총비용 '+total+' ÷ '+N+'회 ≈ <b>'+(total/N).toFixed(2)+'</b> = <b>O(1)</b>. 가끔의 비싼 복사가 많은 싼 push에 분산됩니다.', {done:true});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H;
      ctx.textAlign='center'; ctx.textBaseline='alphabetic';
      ctx.fillStyle='#cfd8e6'; ctx.font='600 15px sans-serif';
      ctx.fillText('동적 배열 push — 가끔 비싸도 평균은 O(1)', W/2, H*0.09);
      // array slots
      var cells=f.capacity; var cw=Math.min(50,(W*0.74)/Math.max(cells,1));
      var totalW=cells*cw, x0=W/2-totalW/2, y0=H*0.20, chh=44;
      for(var i=0;i<cells;i++){
        var px=x0+i*cw, filled=(i<f.size);
        var isCur=(i===f.cur);
        ctx.fillStyle=isCur?'rgba(255,178,122,0.28)':filled?'rgba(122,184,255,0.16)':'rgba(122,184,255,0.04)';
        ctx.strokeStyle=isCur?'#ffb27a':filled?'#7ab8ff':'rgba(255,255,255,0.14)'; ctx.lineWidth=isCur?2.4:1.2;
        ctx.beginPath(); ctx.rect(px,y0,cw-3,chh); ctx.fill(); ctx.stroke();
        if(filled){ ctx.fillStyle=isCur?'#ffb27a':'#dfeefb'; ctx.font='600 15px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.fillText(''+(i+1), px+(cw-3)/2, y0+chh/2); ctx.textBaseline='alphabetic'; }
      }
      ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif'; ctx.textAlign='center';
      ctx.fillText('용량 capacity = '+f.capacity+'   ·   사용 size = '+f.size, W/2, y0+chh+20);
      if(f.resize){ ctx.fillStyle='#f4a0c0'; ctx.font='600 13px sans-serif'; ctx.fillText('⚡ 리사이즈! 전체 복사 발생', W/2, y0-8); }
      // per-push cost bar chart
      var by=H*0.78, bmaxH=H*0.30, n=f.costs.length;
      var bx0=W*0.13, bspan=W*0.74, bw2=Math.min(46,bspan/Math.max(f.N,1));
      var maxC=1; for(i=0;i<f.costs.length;i++) if(f.costs[i]>maxC) maxC=f.costs[i];
      // baseline
      ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(bx0,by); ctx.lineTo(bx0+f.N*bw2,by); ctx.stroke();
      for(i=0;i<f.costs.length;i++){
        var hgt=bmaxH*(f.costs[i]/maxC), spike=(f.costs[i]>1);
        var bcol=spike?'#f4a0c0':'#8fe3b5';
        ctx.fillStyle=spike?'rgba(244,160,192,0.25)':'rgba(143,227,181,0.22)'; ctx.strokeStyle=bcol; ctx.lineWidth=1.5;
        var bx=bx0+i*bw2;
        ctx.beginPath(); ctx.rect(bx+3, by-hgt, bw2-6, hgt); ctx.fill(); ctx.stroke();
        ctx.fillStyle=bcol; ctx.font='600 11px monospace'; ctx.textAlign='center'; ctx.textBaseline='alphabetic';
        ctx.fillText(''+f.costs[i], bx+bw2/2, by-hgt-4);
        ctx.fillStyle='#6f6e7a'; ctx.font='10px monospace';
        ctx.fillText('p'+(i+1), bx+bw2/2, by+13);
      }
      ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
      ctx.fillText('push별 비용 (분홍=복사 스파이크, 초록=O(1))', bx0, by-bmaxH-6);
      // running total + amortized
      ctx.textAlign='center';
      ctx.fillStyle='#dfeefb'; ctx.font='600 14px monospace';
      var amort = f.size>0 ? (f.total/f.size) : 0;
      ctx.fillStyle=f.done?'#8fe3b5':'#ffb27a'; ctx.font='600 15px monospace';
      ctx.fillText('누적 총비용 = '+f.total+'   ·   평균/push = '+amort.toFixed(2)+(f.done?'  →  O(1)':''), W/2, H*0.965); }
  },

  // ══════ 선형 탐색(algo4_01) ▸ 문자열 매칭 KMP ══════
  { id:'algo_br_kmp', concept:true, branchOf:'algo4_01',
    enter:function(E){ E.setOn([]); this.T='ABABABCABAB'; this.P='ABABC'; },
    draw:function(E){ var ctx=E.ctx, T=this.T, P=this.P, cell=Math.min(48,E.W*0.06), x0=E.W/2-T.length*cell/2, y=E.H*0.34;
      // 텍스트
      for(var i=0;i<T.length;i++){ var x=x0+i*cell;
        ctx.fillStyle='rgba(122,184,255,0.12)'; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=1.5; ctx.fillRect(x,y,cell-3,cell-3); ctx.strokeRect(x,y,cell-3,cell-3);
        ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(T[i],x+cell/2,y+cell/2); ctx.textBaseline='alphabetic'; }
      // 패턴 (offset 2에 정렬, 4번째서 불일치 예시)
      var off=2, y2=y+cell+10;
      for(var j=0;j<P.length;j++){ var x=x0+(off+j)*cell, match=(off+j<T.length && T[off+j]===P[j]), mis=(j===4);
        ctx.fillStyle=mis?'rgba(226,75,74,0.25)':(match?'rgba(143,227,181,0.22)':'rgba(255,255,255,0.06)'); ctx.strokeStyle=mis?'#e24b4a':(match?'#8fe3b5':'#9b99a3'); ctx.lineWidth=1.5; ctx.fillRect(x,y2,cell-3,cell-3); ctx.strokeRect(x,y2,cell-3,cell-3);
        ctx.fillStyle=mis?'#f0a0a0':'#dfeefb'; ctx.font='600 17px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(P[j],x+cell/2,y2+cell/2); ctx.textBaseline='alphabetic'; }
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('불일치! 순진하면 1칸 뒤로 재시작 — KMP는 이미 맞은 "ABAB"를 활용해 점프', E.W/2, E.H*0.58);
      E.big('문자열 매칭(KMP) — O(n+m)', '긴 텍스트에서 패턴 찾기. 순진한 방법은 불일치마다 처음부터(O(nm)). KMP는 "실패 함수"로 이미 일치한 접두사를 활용해 안 돌아가 O(n+m)! 검색·DNA·grep'); }
  },

  // ══════ P vs NP(algo8_04) ▸ 근사 알고리즘 ══════
  { id:'algo_br_approx', branchOf:'algo8_04',
    code:[
      'VERTEX-COVER-2APPROX(G):',
      '  C ← ∅',
      '  E\' ← G의 모든 간선',
      '  while E\' ≠ ∅:',
      '    (u,v) ← E\' 에서 아무 간선',
      '    C ← C ∪ {u, v}            // 양 끝점 둘 다',
      '    E\' 에서 u·v 닿은 간선 제거',
      '  return C   // |C| ≤ 2·OPT'
    ],
    build:function(V){
      // 정점 6개 좌표 (0..5)
      var pos=[ {x:0.20,y:0.28}, {x:0.50,y:0.18}, {x:0.80,y:0.30},
                {x:0.22,y:0.72}, {x:0.52,y:0.78}, {x:0.82,y:0.70} ];
      var names=['A','B','C','D','E','F'];
      var edges=[ [0,1],[1,2],[0,3],[1,4],[2,5],[3,4],[4,5],[1,3] ];
      // 처리 순서(고정): 매번 남은 간선 중 첫 번째
      var st=[];
      function snap(line,cap,o){ var fr={line:line,cap:cap,pos:pos,names:names,edges:edges};
        for(var k in o) fr[k]=o[k]; st.push(fr); }
      function covered(e,cov){ return cov.indexOf(e[0])>=0||cov.indexOf(e[1])>=0; }
      var cover=[], removed=[]; // removed: edge index 제거 여부
      for(var i=0;i<edges.length;i++) removed.push(false);
      snap([0,1,2],'<b>정점 커버 2-근사</b>: 모든 간선의 양 끝 중 하나는 커버에 들어가도록 최소 정점 집합을 찾습니다. 간선 8개로 시작합니다.',
        {cover:cover.slice(),removed:removed.slice(),pick:null});
      var round=0;
      while(true){
        // 남은 간선 중 첫 번째
        var idx=-1; for(i=0;i<edges.length;i++){ if(!removed[i] && !covered(edges[i],cover)){ idx=i; break; } }
        if(idx<0) break;
        round++;
        var u=edges[idx][0], v=edges[idx][1];
        snap([4],'아무 미커버 간선 하나 선택: <b>('+names[u]+','+names[v]+')</b>. 이 간선을 덮어야 합니다.',
          {cover:cover.slice(),removed:removed.slice(),pick:idx});
        cover.push(u); cover.push(v);
        // 닿은 간선 제거
        var rmCount=0;
        for(i=0;i<edges.length;i++){ if(!removed[i] && (edges[i][0]===u||edges[i][1]===u||edges[i][0]===v||edges[i][1]===v)){ removed[i]=true; rmCount++; } }
        snap([5,6],'양 끝점 <b>둘 다</b> 커버에 추가: {'+names[u]+', '+names[v]+'}. 이 둘에 닿은 간선 '+rmCount+'개가 모두 덮여 제거됩니다. (현재 |C|='+cover.length+')',
          {cover:cover.slice(),removed:removed.slice(),pick:idx});
      }
      snap([7],'<b>완료!</b> 커버 C = {'+cover.map(function(c){return names[c];}).join(', ')+'} (크기 '+cover.length+'). 매번 끝점 2개를 넣었고 최적은 최소 그 절반이므로 <b>|C| ≤ 2·OPT</b>가 보장됩니다.',
        {cover:cover.slice(),removed:removed.slice(),pick:null});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H;
      var x0=W*0.08,x1=W*0.92,y0=H*0.16,y1=H*0.82;
      function PX(p){ return x0+(x1-x0)*p.x; }
      function PY(p){ return y0+(y1-y0)*p.y; }
      ctx.textAlign='center'; ctx.textBaseline='alphabetic'; ctx.fillStyle='#cfd8e6'; ctx.font='600 14px sans-serif';
      ctx.fillText('간선 하나를 고르면 양 끝점 둘 다 커버에 — 닿은 간선이 모두 사라집니다', W/2, H*0.09);
      // 간선
      for(var i=0;i<f.edges.length;i++){
        var e=f.edges[i], a=f.pos[e[0]], b=f.pos[e[1]];
        var rm=f.removed[i], isPick=(i===f.pick);
        ctx.strokeStyle=isPick?'#ffb27a':rm?'rgba(110,110,120,0.22)':'#7ab8ff';
        ctx.lineWidth=isPick?4:rm?1.5:2.2;
        if(rm){ ctx.setLineDash([4,4]); } else ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(PX(a),PY(a)); ctx.lineTo(PX(b),PY(b)); ctx.stroke();
        ctx.setLineDash([]);
      }
      // 정점
      for(i=0;i<f.pos.length;i++){
        var p=f.pos[i], px=PX(p),py=PY(p);
        var inCover=f.cover.indexOf(i)>=0;
        var isPick=(f.pick!=null && (f.edges[f.pick][0]===i||f.edges[f.pick][1]===i) && !inCover);
        var col=inCover?'#8fe3b5':isPick?'#ffb27a':'#7ab8ff';
        var fc=inCover?'rgba(143,227,181,0.25)':isPick?'rgba(255,178,122,0.25)':'rgba(122,184,255,0.12)';
        ctx.fillStyle=fc; ctx.strokeStyle=col; ctx.lineWidth=2.5;
        ctx.beginPath(); ctx.arc(px,py,18,0,7); ctx.fill(); ctx.stroke();
        ctx.fillStyle=col; ctx.font='600 15px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(f.names[i],px,py); ctx.textBaseline='alphabetic';
      }
      // 커버 집합 표시
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.textAlign='left';
      var lbl='커버 C = { '+f.cover.map(function(c){return f.names[c];}).join(', ')+' }   |C| = '+f.cover.length;
      ctx.fillStyle='#8fe3b5'; ctx.font='600 14px monospace'; ctx.fillText(lbl, x0, H*0.93);
    }
  },

  // ══════ 분할정복(algo8_03) ▸ 스트라센 행렬곱 ══════
  { id:'algo_br_strassen', branchOf:'algo8_03',
    code:[
      '// 스트라센: 2×2 블록 곱을 곱셈 8번 → 7번',
      'M1 = (A11+A22)(B11+B22)',
      'M2 = (A21+A22)·B11',
      'M3 = A11·(B12−B22)',
      'M4 = A22·(B21−B11)',
      'M5 = (A11+A12)·B22',
      'M6 = (A21−A11)(B11+B12)',
      'M7 = (A12−A22)(B21+B22)',
      'C11=M1+M4−M5+M7   C12=M3+M5',
      'C21=M2+M4         C22=M1−M2+M3+M6'
    ],
    build:function(V){
      // 작은 정수 예 (2×2)
      var A=[[1,2],[3,4]];   // A11 A12 / A21 A22
      var B=[[5,6],[7,8]];   // B11 B12 / B21 B22
      var a11=A[0][0],a12=A[0][1],a21=A[1][0],a22=A[1][1];
      var b11=B[0][0],b12=B[0][1],b21=B[1][0],b22=B[1][1];
      var M=[];
      M[1]=(a11+a22)*(b11+b22);
      M[2]=(a21+a22)*b11;
      M[3]=a11*(b12-b22);
      M[4]=a22*(b21-b11);
      M[5]=(a11+a12)*b22;
      M[6]=(a21-a11)*(b11+b12);
      M[7]=(a12-a22)*(b21+b22);
      var C11=M[1]+M[4]-M[5]+M[7];
      var C12=M[3]+M[5];
      var C21=M[2]+M[4];
      var C22=M[1]-M[2]+M[3]+M[6];
      // 검산 (정의대로): 결과가 일치하는지 보장
      var R11=a11*b11+a12*b21, R12=a11*b12+a12*b22, R21=a21*b11+a22*b21, R22=a21*b12+a22*b22;
      var mForm=['', '(A11+A22)(B11+B22)','(A21+A22)·B11','A11·(B12−B22)','A22·(B21−B11)','(A11+A12)·B22','(A21−A11)(B11+B12)','(A12−A22)(B21+B22)'];
      var mNum =['', '('+a11+'+'+a22+')('+b11+'+'+b22+')','('+a21+'+'+a22+')·'+b11,a11+'·('+b12+'−'+b22+')',a22+'·('+b21+'−'+b11+')','('+a11+'+'+a12+')·'+b22,'('+a21+'−'+a11+')('+b11+'+'+b12+')','('+a12+'−'+a22+')('+b21+'+'+b22+')'];
      var st=[];
      function snap(line,cap,extra){ var f={line:line,cap:cap,A:A,B:B,M:M,mForm:mForm,mNum:mNum,C:{c11:C11,c12:C12,c21:C21,c22:C22},R:{r11:R11,r12:R12,r21:R21,r22:R22}}; if(extra)for(var k in extra)f[k]=extra[k]; st.push(f); }
      snap(0,'2×2 행렬 A·B 를 곱합니다. 순진한 분할정복은 블록 곱 <b>8번</b>(T(n)=8T(n/2)+O(n²)=O(n³)).',{shown:0, chl:null});
      for(var i=1;i<=7;i++){
        snap(i,'<b>M'+i+'</b> = '+mForm[i]+' = '+mNum[i]+' = <b>'+M[i]+'</b>. 덧셈·뺄셈을 섞어 곱셈은 <b>한 번</b>만.',{shown:i, chl:null});
      }
      snap([1,2,3,4,5,6,7],'<b>곱셈 7번 끝!</b> M1~M7 = ['+M[1]+', '+M[2]+', '+M[3]+', '+M[4]+', '+M[5]+', '+M[6]+', '+M[7]+']. 이제 더하기·빼기로 결과 블록을 조립합니다.',{shown:7, chl:null});
      snap(8,'<b>C11</b> = M1+M4−M5+M7 = '+M[1]+'+'+M[4]+'−'+M[5]+'+'+M[7]+' = <b>'+C11+'</b>   (정의대로 a11·b11+a12·b21 = '+R11+' ✓)',{shown:7, chl:'c11'});
      snap(8,'<b>C12</b> = M3+M5 = '+M[3]+'+'+M[5]+' = <b>'+C12+'</b>   (= '+R12+' ✓)',{shown:7, chl:'c12'});
      snap(9,'<b>C21</b> = M2+M4 = '+M[2]+'+'+M[4]+' = <b>'+C21+'</b>   (= '+R21+' ✓)',{shown:7, chl:'c21'});
      snap(9,'<b>C22</b> = M1−M2+M3+M6 = '+M[1]+'−'+M[2]+'+'+M[3]+'+'+M[6]+' = <b>'+C22+'</b>   (= '+R22+' ✓)',{shown:7, chl:'c22'});
      snap([1,8,9],'<b>완성!</b> 곱셈을 8→7로 줄여 <b>T(n)=7T(n/2)+O(n²)</b> → 마스터정리 → <b>O(n^log₂7)≈O(n^2.81)</b>. n³ 벽을 처음 넘은 결과입니다.',{shown:7, chl:'all'});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H;
      ctx.textAlign='center'; ctx.textBaseline='alphabetic';
      ctx.fillStyle='#cfd8e6'; ctx.font='600 15px sans-serif';
      ctx.fillText('스트라센: 곱셈 7번으로 2×2 블록 곱 (8→7이 지수 3→2.81)', W/2, H*0.075);
      // 행렬 그리기 헬퍼
      function mat(M2,cx,cy,title,hl){
        var cw=30, ch=30, x0=cx-cw, y0=cy-ch;
        ctx.fillStyle='#9b99a3'; ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.fillText(title, cx, y0-10);
        for(var r=0;r<2;r++)for(var c=0;c<2;c++){
          var x=x0+c*cw, y=y0+r*ch;
          var isHl=hl&&hl(r,c);
          ctx.fillStyle=isHl?'rgba(255,178,122,0.28)':'rgba(122,184,255,0.10)'; ctx.strokeStyle=isHl?'#ffb27a':'#3c4a5e'; ctx.lineWidth=isHl?2:1;
          ctx.fillRect(x,y,cw,ch); ctx.strokeRect(x,y,cw,ch);
          ctx.fillStyle=isHl?'#ffb27a':'#dfeefb'; ctx.font='600 14px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.fillText(''+M2[r][c], x+cw/2, y+ch/2); ctx.textBaseline='alphabetic';
        }
      }
      // A, B, C 상단
      mat(f.A, W*0.18, H*0.20, 'A');
      ctx.fillStyle='#dfeefb'; ctx.font='600 18px sans-serif'; ctx.textAlign='center'; ctx.fillText('×', W*0.275, H*0.21);
      mat(f.B, W*0.37, H*0.20, 'B');
      ctx.fillStyle='#dfeefb'; ctx.font='600 18px sans-serif'; ctx.fillText('=', W*0.475, H*0.21);
      // C 결과 (chl 따라 점등)
      var Cv=[[f.C.c11,f.C.c12],[f.C.c21,f.C.c22]];
      var cmap=[['c11','c12'],['c21','c22']];
      var cx=W*0.58, cy=H*0.20, cw=34, ch=34, cx0=cx-cw, cy0=cy-ch;
      ctx.fillStyle='#9b99a3'; ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.fillText('C = A·B', cx, cy0-10);
      for(var r=0;r<2;r++)for(var c=0;c<2;c++){
        var x=cx0+c*cw, y=cy0+r*ch, key=cmap[r][c];
        var lit=(f.chl===key||f.chl==='all');
        ctx.fillStyle=lit?'rgba(143,227,181,0.25)':'rgba(255,255,255,0.04)'; ctx.strokeStyle=lit?'#8fe3b5':'#2c3543'; ctx.lineWidth=lit?2.2:1;
        ctx.fillRect(x,y,cw,ch); ctx.strokeRect(x,y,cw,ch);
        ctx.fillStyle=lit?'#8fe3b5':'#5a5a64'; ctx.font='600 15px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(lit?(''+Cv[r][c]):'?', x+cw/2, y+ch/2); ctx.textBaseline='alphabetic';
      }
      // M1..M7 리스트 (하단 2열)
      var lx=[W*0.18, W*0.58], ly=H*0.42, rh=26;
      ctx.textAlign='left';
      for(var i=1;i<=7;i++){ var col=(i<=4)?0:1, row=(i<=4)?(i-1):(i-5);
        var bx=lx[col], by=ly+row*rh;
        var on=(f.shown>=i), hot=(f.line===i || (f.line&&f.line.indexOf&&f.line.indexOf(i)>=0 && f.shown<7) );
        // active = 막 계산된 것
        var active=(f.shown===i && f.chl===null);
        ctx.fillStyle=active?'#ffb27a':on?'#8fe3b5':'#56555f';
        ctx.font=(active?'600 ':'')+'12px monospace';
        var label='M'+i+' = '+f.mNum[i]+' = '+(on?f.M[i]:'?');
        ctx.fillText(label, bx, by);
      }
      // 조립식 패널
      if(f.chl){
        var py=H*0.84;
        ctx.textAlign='center'; ctx.font='600 13px monospace';
        var lines=[
          ['C11 = M1+M4−M5+M7', f.chl==='c11'||f.chl==='all'],
          ['C12 = M3+M5', f.chl==='c12'||f.chl==='all'],
          ['C21 = M2+M4', f.chl==='c21'||f.chl==='all'],
          ['C22 = M1−M2+M3+M6', f.chl==='c22'||f.chl==='all']
        ];
        for(var j=0;j<4;j++){ ctx.fillStyle=lines[j][1]?'#8fe3b5':'#56555f';
          ctx.fillText(lines[j][0], W*0.27+(j%2)*W*0.46, py+Math.floor(j/2)*22); }
      }
      ctx.textAlign='center';
      ctx.fillStyle=(f.chl==='all')?'#8fe3b5':'#ffb27a'; ctx.font='600 13px sans-serif';
      ctx.fillText('▶ '+(f.chl==='all'?'완료: T(n)=7T(n/2)+O(n²) → O(n^2.81)':'곱셈 '+f.shown+' / 7'), W/2, H*0.96); }
  },

  // ══════ 분할정복(algo8_03) ▸ FFT 고속 푸리에 변환 ══════
  { id:'algo_br_fft', branchOf:'algo8_03',
    code:[
      'FFT(a):                    // a 길이 n=2^k',
      '  if |a|==1: return a',
      '  (a_even, a_odd) ← 짝수·홀수 차수로 분할',
      '  y_e ← FFT(a_even);  y_o ← FFT(a_odd)',
      '  for k in 0..n/2-1:        // 버터플라이',
      '    w ← exp(2πi·k/n)        // 단위근',
      '    y[k]      ← y_e[k] + w·y_o[k]',
      '    y[k+n/2]  ← y_e[k] - w·y_o[k]',
      '  return y                  // 점값 표현'
    ],
    build:function(V){
      // a = [1,2,3,4]  (계수). n=4. DFT를 정직하게 계산.
      var a=[1,2,3,4], n=4, st=[];
      function snap(line,cap,extra){ var f={line:line,cap:cap,a:a,n:n}; if(extra)for(var k in extra)f[k]=extra[k]; st.push(f); }
      // even = [1,3], odd = [2,4]
      var ev=[a[0],a[2]], od=[a[1],a[3]];
      // size-2 DFT: y0=x0+x1, y1=x0-x1
      var Ye=[ {re:ev[0]+ev[1],im:0}, {re:ev[0]-ev[1],im:0} ]; // FFT([1,3]) = [4,-2]
      var Yo=[ {re:od[0]+od[1],im:0}, {re:od[0]-od[1],im:0} ]; // FFT([2,4]) = [6,-2]
      // roots w_k = exp(2πi k/4): w0=1, w1=i
      var W=[ {re:1,im:0}, {re:0,im:1} ];
      function cadd(p,q){ return {re:p.re+q.re, im:p.im+q.im}; }
      function csub(p,q){ return {re:p.re-q.re, im:p.im-q.im}; }
      function cmul(p,q){ return {re:p.re*q.re-p.im*q.im, im:p.re*q.im+p.im*q.re}; }
      var Y=[null,null,null,null];
      snap(0,'다항식 a(x)=1+2x+3x²+4x³ 의 계수 <b>[1,2,3,4]</b> (n=4). FFT는 이를 4개 <b>단위근</b>에서의 점값으로 바꿉니다.',{stage:'start'});
      snap(2,'<b>분할:</b> 짝수 차수 [1,3] 과 홀수 차수 [2,4] 로 나눕니다. (분할정복!)',{stage:'split',ev:ev,od:od});
      snap(3,'두 절반을 <b>재귀</b> FFT. 크기 2는 (x₀+x₁, x₀−x₁): FFT[1,3]=<b>[4,−2]</b>, FFT[2,4]=<b>[6,−2]</b>.',{stage:'recurse',ev:ev,od:od,Ye:Ye,Yo:Yo});
      for(var k=0;k<n/2;k++){
        var wo=cmul(W[k],Yo[k]);
        Y[k]=cadd(Ye[k],wo); Y[k+n/2]=csub(Ye[k],wo);
        snap([4,5,6,7],'<b>버터플라이 k='+k+':</b> w='+fmtC(W[k])+', w·y_odd['+k+']='+fmtC(wo)+'. → y['+k+']=y_e+w·y_o=<b>'+fmtC(Y[k])+'</b>, y['+(k+n/2)+']=y_e−w·y_o=<b>'+fmtC(Y[k+n/2])+'</b>.',
          {stage:'bfly',ev:ev,od:od,Ye:Ye,Yo:Yo,W:W,Y:Y.slice(),bk:k});
      }
      snap(8,'<b>완료!</b> 점값 [10, −2+2i, −2, −2−2i]. 점값에선 곱셈이 점마다 한 번이라 <b>O(n)</b> — 변환 자체는 <b>O(n log n)</b>.',{stage:'done',ev:ev,od:od,Ye:Ye,Yo:Yo,W:W,Y:Y.slice(),bk:-1});
      function fmtC(c){ var r=Math.round(c.re*100)/100, i=Math.round(c.im*100)/100;
        if(Math.abs(i)<1e-9) return ''+r;
        return r+(i>=0?'+':'−')+Math.abs(i)+'i'; }
      // attach fmtC for draw reuse via string is not possible; recompute in draw.
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H;
      function fmtC(c){ if(!c) return '·'; var r=Math.round(c.re*100)/100, i=Math.round(c.im*100)/100;
        if(Math.abs(i)<1e-9) return ''+r; return r+(i>=0?'+':'−')+Math.abs(i)+'i'; }
      ctx.textAlign='center'; ctx.textBaseline='alphabetic';
      ctx.fillStyle='#cfd8e6'; ctx.font='600 15px sans-serif';
      ctx.fillText('FFT = 짝/홀 분할 → 재귀 → 버터플라이(단위근 결합)', W/2, H*0.085);
      // 좌측: 단위근 복소평면
      var cx=W*0.24, cy=H*0.50, R=Math.min(W*0.16,H*0.30);
      ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.arc(cx,cy,R,0,7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx-R-10,cy); ctx.lineTo(cx+R+10,cy); ctx.moveTo(cx,cy-R-10); ctx.lineTo(cx,cy+R+10); ctx.stroke();
      ctx.fillStyle='#6f6e7a'; ctx.font='11px sans-serif'; ctx.fillText('복소 단위근 (n=4)', cx, cy-R-18);
      var ang=[0,Math.PI/2,Math.PI,3*Math.PI/2];
      for(var t=0;t<4;t++){ var px=cx+R*Math.cos(ang[t]), py=cy-R*Math.sin(ang[t]);
        var hot=(f.stage==='bfly'||f.stage==='done') && f.bk!=null && (t===f.bk||t===f.bk+2);
        ctx.fillStyle=hot?'#ffb27a':'#7ab8ff'; ctx.beginPath(); ctx.arc(px,py,hot?7:5,0,7); ctx.fill();
        ctx.fillStyle=hot?'#ffb27a':'#9fb6d6'; ctx.font='11px monospace';
        ctx.fillText('ω'+t, px+(Math.cos(ang[t])>=0?14:-14), py-(Math.sin(ang[t])>0?10:-14)); }
      // 우측: 버터플라이 / 배열 패널
      var rx=W*0.50, rw=W*0.46;
      function row(label,arr,y,colf,fmt){ ctx.textAlign='left'; ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif';
        ctx.fillText(label, rx, y-6);
        var m=arr.length, bw=Math.min(78,(rw)/m-8), x0=rx;
        for(var i=0;i<m;i++){ var x=x0+i*(bw+8);
          var col=colf?colf(i):null;
          ctx.fillStyle=col?col.fill:'rgba(122,184,255,0.10)'; ctx.strokeStyle=col?col.stroke:'#3c4a5e'; ctx.lineWidth=col?2:1;
          if(ctx.roundRect){ctx.beginPath(); ctx.roundRect(x,y,bw,30,6); ctx.fill(); ctx.stroke();} else {ctx.fillRect(x,y,bw,30); ctx.strokeRect(x,y,bw,30);}
          ctx.fillStyle=col?col.text:'#dfeefb'; ctx.font='600 13px monospace'; ctx.textAlign='center';
          ctx.fillText(fmt?fmt(arr[i]):(''+arr[i]), x+bw/2, y+20); ctx.textAlign='left'; }
      }
      row('입력 계수 a', f.a, H*0.20, function(i){ if(f.stage==='split'&&(i%2===0)) return {fill:'rgba(143,227,181,0.2)',stroke:'#8fe3b5',text:'#8fe3b5'}; if(f.stage==='split') return {fill:'rgba(244,160,192,0.2)',stroke:'#f4a0c0',text:'#f4a0c0'}; return null; });
      if(f.ev){ row('짝수 [a0,a2]', f.ev, H*0.36, function(){return {fill:'rgba(143,227,181,0.16)',stroke:'#8fe3b5',text:'#8fe3b5'};});
        ctx.textAlign='left'; ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif'; ctx.fillText('홀수 [a1,a3]', rx+rw*0.5, H*0.36-6);
        var bw=Math.min(78,(rw)/2-8);
        var x0=rx+rw*0.5;
        for(var i=0;i<f.od.length;i++){ var x=x0+i*(bw+8);
          ctx.fillStyle='rgba(244,160,192,0.16)'; ctx.strokeStyle='#f4a0c0'; ctx.lineWidth=2;
          if(ctx.roundRect){ctx.beginPath(); ctx.roundRect(x,H*0.36,bw,30,6); ctx.fill(); ctx.stroke();} else {ctx.fillRect(x,H*0.36,bw,30);}
          ctx.fillStyle='#f4a0c0'; ctx.font='600 13px monospace'; ctx.textAlign='center'; ctx.fillText(''+f.od[i],x+bw/2,H*0.36+20); ctx.textAlign='left'; }
      }
      if(f.Ye){ row('FFT(짝)=y_e', f.Ye, H*0.52, function(i){ return {fill:'rgba(143,227,181,0.16)',stroke:'#8fe3b5',text:'#8fe3b5'};}, fmtC);
        ctx.textAlign='left'; ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif'; ctx.fillText('FFT(홀)=y_o', rx+rw*0.5, H*0.52-6);
        var bw2=Math.min(78,(rw)/2-8), x02=rx+rw*0.5;
        for(var q=0;q<f.Yo.length;q++){ var xx=x02+q*(bw2+8);
          ctx.fillStyle='rgba(244,160,192,0.16)'; ctx.strokeStyle='#f4a0c0'; ctx.lineWidth=2;
          if(ctx.roundRect){ctx.beginPath(); ctx.roundRect(xx,H*0.52,bw2,30,6); ctx.fill(); ctx.stroke();} else {ctx.fillRect(xx,H*0.52,bw2,30);}
          ctx.fillStyle='#f4a0c0'; ctx.font='600 13px monospace'; ctx.textAlign='center'; ctx.fillText(fmtC(f.Yo[q]),xx+bw2/2,H*0.52+20); ctx.textAlign='left'; }
      }
      if(f.Y){ row('점값 결과 y', f.Y, H*0.70, function(i){ if(f.Y[i]==null) return {fill:'rgba(255,255,255,0.03)',stroke:'#2c3543',text:'#5a5a64'};
        if(f.bk!=null&&(i===f.bk||i===f.bk+2)&&f.stage==='bfly') return {fill:'rgba(255,178,122,0.28)',stroke:'#ffb27a',text:'#ffb27a'};
        return {fill:'rgba(122,184,255,0.16)',stroke:'#7ab8ff',text:'#dfeefb'}; }, fmtC);
      }
      // 배지
      var badge=f.stage==='start'?'준비':f.stage==='split'?'분할':f.stage==='recurse'?'재귀':f.stage==='bfly'?'버터플라이':'완료';
      ctx.textAlign='center'; ctx.fillStyle=(f.stage==='done')?'#8fe3b5':'#ffb27a'; ctx.font='600 13px sans-serif';
      ctx.fillText('▶ '+badge, W/2, H*0.95); }
  },

  // ══════ 다익스트라(algo6_05) ▸ 최대 플로우 ══════
  { id:'algo_br_maxflow', concept:true, branchOf:'algo6_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx;
      var P=[[0.1,0.5],[0.42,0.25],[0.42,0.75],[0.78,0.5]];
      var NM=['s','a','b','t'];
      var EG=[[0,1,'2/3'],[0,2,'2/2'],[1,3,'2/2'],[2,3,'2/3'],[1,2,'0/1']];
      function px(i){ return [E.W*0.16+P[i][0]*E.W*0.6, E.H*0.22+P[i][1]*E.H*0.5]; }
      EG.forEach(function(e){ gedge(E, px(e[0]), px(e[1]), 'rgba(122,184,255,0.5)', 2, e[2]); });
      for(var i=0;i<P.length;i++){ var p=px(i), src=(i===0||i===3); AV.node(E,p[0],p[1],NM[i],{r:24,fs:16,fill:src?'rgba(255,178,122,0.25)':'rgba(122,184,255,0.16)',stroke:src?'#ffb27a':'#7ab8ff'}); }
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('간선 라벨 = 흐름/용량. s에서 t로 최대한 흘려보내기', E.W/2, E.H*0.80);
      ctx.fillStyle='#8fe3b5'; ctx.font='600 14px sans-serif'; ctx.fillText('최대 플로우 = 4 (= 최소 컷 용량)', E.W/2, E.H*0.85);
      E.big('최대 플로우 — 최대 유량 = 최소 컷', '관(간선 용량)으로 s→t에 물을 최대한 흘리기. 증가 경로를 찾아 반복(포드-풀커슨). ★최대 유량 = 최소 컷(병목)! 네트워크·매칭·이미지 분할'); }
  },

  // ══════ 해시(algo2_05) ▸ 개방 주소법 ══════
  { id:'algo_br_openaddr', concept:true, branchOf:'algo2_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, M=7, cell=58, x0=E.W/2-M*cell/2, y=E.H*0.42;
      var slots=['','dog','cat','fox','','',''];  // cat,fox 충돌 가정 시연
      for(var i=0;i<M;i++){ var on=(i===2||i===3), x=x0+i*cell;
        ctx.fillStyle=on?'rgba(255,178,122,0.2)':'rgba(122,184,255,0.08)'; ctx.strokeStyle=on?'#ffb27a':'#7ab8ff'; ctx.lineWidth=1.5; ctx.fillRect(x,y,cell-3,cell-3); ctx.strokeRect(x,y,cell-3,cell-3);
        ctx.fillStyle='#6f6e7a'; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('['+i+']', x+cell/2, y+cell+14);
        if(slots[i]){ ctx.fillStyle=on?'#ffb27a':'#dfeefb'; ctx.font='600 14px sans-serif'; ctx.textBaseline='middle'; ctx.fillText(slots[i], x+cell/2, y+cell/2); ctx.textBaseline='alphabetic'; } }
      ctx.fillStyle='#f4a0c0'; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('"fox"도 [2]로 해시됐지만 이미 참 → 다음 빈칸 [3]에 (선형 탐사)', E.W/2, E.H*0.66);
      E.big('개방 주소법 — 충돌 시 다음 칸으로', '해시 충돌을 연결리스트 대신 "테이블 안에서" 해결. 자리 차면 다음 빈칸 탐사(선형/이차/이중해시). 캐시 친화적, 부하율 낮을 때 빠름'); }
  },

  // ══════ 해시(algo2_05) ▸ RSA 암호 (정수론) ══════
  { id:'algo_br_rsa', concept:true, branchOf:'algo2_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, cx=E.W/2, y0=E.H*0.24;
      ctx.font='14px sans-serif'; ctx.textAlign='center';
      ctx.fillStyle='#ffb27a'; ctx.font='600 16px sans-serif'; ctx.fillText('① 키 생성: 소수 p, q → n = p·q', cx, y0);
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.fillText('공개키 (e, n) — 누구나 / 비밀키 d — 본인만', cx, y0+24);
      // 파이프라인
      function box(x,t,sub,col){ var w=E.W*0.22,h=64,y=E.H*0.42; ctx.fillStyle='rgba(122,184,255,0.06)'; ctx.strokeStyle=col; ctx.lineWidth=2; if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x-w/2,y,w,h,12);ctx.fill();ctx.stroke();}else ctx.strokeRect(x-w/2,y,w,h); ctx.fillStyle=col; ctx.font='600 15px sans-serif'; ctx.fillText(t,x,y+26); ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif'; ctx.fillText(sub,x,y+48); return [x,E.H*0.42+h/2]; }
      var b1=box(E.W*0.22,'평문 m','메시지','#cfcdc6');
      var b2=box(E.W*0.5,'암호문 c','c = mᵉ mod n','#f4a0c0');
      var b3=box(E.W*0.78,'평문 m','m = cᵈ mod n','#8fe3b5');
      AV.arrow(ctx,E.W*0.33,b1[1],E.W*0.39,b2[1],'#ffb27a',2);
      AV.arrow(ctx,E.W*0.61,b2[1],E.W*0.67,b3[1],'#ffb27a',2);
      ctx.fillStyle='#ffb27a'; ctx.font='12px sans-serif'; ctx.fillText('암호화(공개키 e)',E.W*0.36,b1[1]-14); ctx.fillText('복호화(비밀키 d)',E.W*0.64,b2[1]-14);
      ctx.fillStyle='#f4a0c0'; ctx.font='600 14px sans-serif'; ctx.fillText('안전성: n을 소인수분해(p,q 찾기)가 사실상 불가능', cx, E.H*0.66);
      E.big('RSA — 인수분해의 어려움이 곧 보안', '두 소수 곱은 쉽지만 되돌리기(인수분해)는 어렵다. 이 비대칭으로 공개키 암호 구현. 빠른 거듭제곱 mod + 유클리드 + 소수판정. HTTPS·전자서명의 토대'); }
  },

  // ══════ 스택(algo2_03) ▸ 볼록 껍질 (계산기하) ══════
  { id:'algo_br_hull', concept:true, branchOf:'algo2_03',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx;
      var pts=[[0.2,0.25],[0.5,0.12],[0.82,0.28],[0.88,0.62],[0.55,0.82],[0.18,0.65],[0.45,0.45],[0.62,0.55]];
      var hull=[0,1,2,3,4,5]; // 바깥 점들(내부 6,7 제외)
      function px(i){ return [E.W*0.2+pts[i][0]*E.W*0.55, E.H*0.22+pts[i][1]*E.H*0.5]; }
      // 껍질 다각형
      ctx.fillStyle='rgba(143,227,181,0.1)'; ctx.strokeStyle='#8fe3b5'; ctx.lineWidth=2; ctx.beginPath();
      hull.forEach(function(h,k){ var p=px(h); if(k===0)ctx.moveTo(p[0],p[1]); else ctx.lineTo(p[0],p[1]); }); ctx.closePath(); ctx.fill(); ctx.stroke();
      // 점들
      for(var i=0;i<pts.length;i++){ var p=px(i), onHull=hull.indexOf(i)>=0; ctx.fillStyle=onHull?'#8fe3b5':'#6f6e7a'; ctx.beginPath(); ctx.arc(p[0],p[1],onHull?7:5,0,7); ctx.fill(); }
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('초록 = 껍질 위 점 / 회색 = 내부 점 (고무줄을 씌운 듯한 바깥 경계)', E.W/2, E.H*0.80);
      E.big('볼록 껍질 — 점들을 감싸는 최소 다각형', '흩어진 점들을 고무줄로 감싼 바깥 경계. 그레이엄 스캔: 각도순 정렬 + 스택으로 O(n log n). 충돌 감지·패턴 인식·지도'); }
  },

  // ══════ P vs NP(algo8_04) ▸ 선형계획법 ══════
  { id:'algo_br_lp', branchOf:'algo8_04',
    code:[
      'SIMPLEX(max c·x):  // 제약 속 최적화',
      '  v ← 시작 꼭짓점 (예: 원점)',
      '  repeat:',
      '    이웃 꼭짓점들을 본다',
      '    if 더 좋은 이웃 있음:',
      '      v ← 가장 좋아지는 이웃 (모서리 따라)',
      '    else:',
      '      return v   // 최적 — 개선 없음',
      '  // 최적은 항상 꼭짓점에서'
    ],
    build:function(V){
      // 다각형 꼭짓점 (좌표는 수학 좌표; 반시계)
      var verts=[ {x:0,y:0}, {x:4,y:0}, {x:3,y:1}, {x:0,y:2} ];
      var names=['O','A','B','C'];
      // 인접: 다각형 변 = 연속 정점
      var adj=[ [1,3], [0,2], [1,3], [2,0] ];
      var cx=3, cy=2; // 목적함수 3x+2y
      function obj(v){ return cx*v.x+cy*v.y; }
      var st=[];
      function snap(line,cap,o){ var fr={line:line,cap:cap,verts:verts,names:names,cx:cx,cy:cy};
        for(var k in o) fr[k]=o[k]; st.push(fr); }
      snap([0,1],'<b>선형계획법</b>: max 3x+2y, 제약 x,y≥0 · x+y≤4 · x+3y≤6. 실현가능 영역은 볼록 사각형. 최적은 반드시 <b>꼭짓점</b>에 있습니다.',
        {cur:-1,cand:[],next:-1,best:-1,done:false});
      snap([1],'시작 꼭짓점 = 원점 O(0,0), 목적값 3·0+2·0 = <b>0</b>.',
        {cur:0,cand:[],next:-1,best:-1,done:false});
      var cur=0;
      var guard=0;
      while(guard++<6){
        var neigh=adj[cur];
        snap([3],'꼭짓점 '+names[cur]+'('+verts[cur].x+','+verts[cur].y+') 목적값 '+obj(verts[cur])+'. 모서리로 이어진 이웃 '+neigh.map(function(n){return names[n];}).join('·')+' 의 목적값을 봅니다.',
          {cur:cur,cand:neigh.slice(),next:-1,best:-1,done:false});
        // 가장 좋아지는 이웃
        var best=-1, bestVal=obj(verts[cur]);
        for(var k=0;k<neigh.length;k++){ var nv=obj(verts[neigh[k]]); if(nv>bestVal){ bestVal=nv; best=neigh[k]; } }
        if(best<0){
          snap([6,7],'모든 이웃이 더 낮음 → 개선 불가. <b>최적해 도달!</b> '+names[cur]+'('+verts[cur].x+','+verts[cur].y+'), 최댓값 = <b>'+obj(verts[cur])+'</b>.',
            {cur:cur,cand:neigh.slice(),next:-1,best:cur,done:true});
          break;
        } else {
          snap([4,5],'이웃 '+names[best]+' 목적값 '+obj(verts[best])+' > 현재 '+obj(verts[cur])+' → 모서리를 따라 <b>'+names[best]+'</b> 로 이동합니다.',
            {cur:cur,cand:neigh.slice(),next:best,best:-1,done:false});
          cur=best;
        }
      }
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H;
      // 수학좌표 → 화면. x:0..4.5, y:0..2.5
      var px0=W*0.16,px1=W*0.84,py0=H*0.22,py1=H*0.80;
      var xmx=4.6,ymx=2.6;
      function X(x){ return px0+(px1-px0)*x/xmx; }
      function Y(y){ return py1-(py1-py0)*y/ymx; }
      ctx.textAlign='center'; ctx.textBaseline='alphabetic'; ctx.fillStyle='#cfd8e6'; ctx.font='600 14px sans-serif';
      ctx.fillText('볼록 다각형의 꼭짓점을 따라 목적값이 좋아지는 쪽으로 이동 → 최적 꼭짓점', W/2, H*0.11);
      // 축
      ctx.strokeStyle='rgba(255,255,255,0.14)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(X(0),Y(0)); ctx.lineTo(X(xmx),Y(0)); ctx.moveTo(X(0),Y(0)); ctx.lineTo(X(0),Y(ymx)); ctx.stroke();
      ctx.fillStyle='#7f8a9b'; ctx.font='12px sans-serif';
      ctx.fillText('x', X(xmx)-6, Y(0)+18); ctx.fillText('y', X(0)-14, Y(ymx)+4);
      // 실현가능 다각형
      var vt=f.verts;
      ctx.fillStyle='rgba(122,184,255,0.10)'; ctx.strokeStyle='#5a6b82'; ctx.lineWidth=2;
      ctx.beginPath();
      for(var i=0;i<vt.length;i++){ var sx=X(vt[i].x),sy=Y(vt[i].y); if(i===0)ctx.moveTo(sx,sy); else ctx.lineTo(sx,sy); }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // 목적함수 방향 화살표 (c=(3,2))
      var ax=X(0.5)+0, ay=Y(0.4);
      var dx=f.cx, dy=f.cy, dl=Math.sqrt(dx*dx+dy*dy); dx/=dl; dy/=dl;
      var alen=70;
      ctx.strokeStyle='#ffb27a'; ctx.lineWidth=2.5; ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(ax+dx*alen,ay-dy*alen); ctx.stroke();
      // 화살촉
      var hx=ax+dx*alen, hy=ay-dy*alen;
      ctx.beginPath(); ctx.moveTo(hx,hy);
      ctx.lineTo(hx-dx*12-dy*7, hy+dy*12-dx*7);
      ctx.lineTo(hx-dx*12+dy*7, hy+dy*12+dx*7);
      ctx.closePath(); ctx.fillStyle='#ffb27a'; ctx.fill();
      ctx.fillStyle='#ffb27a'; ctx.font='11px sans-serif'; ctx.textAlign='left';
      ctx.fillText('목적 c=(3,2) ↗', ax+8, ay+16);
      // 이동 화살표 (cur→next)
      if(f.next>=0){
        var a=vt[f.cur], b=vt[f.next];
        ctx.strokeStyle='#ffb27a'; ctx.lineWidth=3.5; ctx.setLineDash([7,5]);
        ctx.beginPath(); ctx.moveTo(X(a.x),Y(a.y)); ctx.lineTo(X(b.x),Y(b.y)); ctx.stroke(); ctx.setLineDash([]);
      }
      // 꼭짓점
      for(i=0;i<vt.length;i++){
        var v=vt[i], vx=X(v.x),vy=Y(v.y);
        var isCur=(i===f.cur), isCand=(f.cand.indexOf(i)>=0), isBest=(i===f.best), isNext=(i===f.next);
        var col=isBest?'#8fe3b5':isCur?'#ffb27a':isNext?'#ffd9b8':isCand?'#7ab8ff':'#5a6b82';
        var r=isCur||isBest?11:8;
        ctx.fillStyle=isBest?'rgba(143,227,181,0.3)':isCur?'rgba(255,178,122,0.3)':'rgba(122,184,255,0.15)';
        ctx.strokeStyle=col; ctx.lineWidth=2.5;
        ctx.beginPath(); ctx.arc(vx,vy,r,0,7); ctx.fill(); ctx.stroke();
        ctx.fillStyle=col; ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='alphabetic';
        var ofy=(v.y>1.5)?-16:18;
        ctx.fillText(f.names[i]+'('+v.x+','+v.y+')='+(f.cx*v.x+f.cy*v.y), vx, vy+ofy);
      }
      // 상태 배지
      ctx.textAlign='center';
      ctx.fillStyle=f.done?'#8fe3b5':'#ffb27a'; ctx.font='600 14px sans-serif';
      ctx.fillText(f.done?'▶ 최적해 — 모든 이웃이 더 나쁨':(f.cur>=0?'▶ 현재 꼭짓점에서 이웃 탐색':'▶ 시작'), W/2, H*0.93);
    }
  },

  // ══════ 해시(algo2_05) ▸ 유클리드 확장 & 모듈러 역원 ══════
  { id:'algo_br_extgcd', concept:true, branchOf:'algo2_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, cx=E.W/2;
      ctx.font='15px sans-serif'; ctx.textAlign='center';
      ctx.fillStyle='#ffb27a'; ctx.font='600 18px sans-serif'; ctx.fillText('확장 유클리드:  ax + by = gcd(a, b)', cx, E.H*0.26);
      ctx.fillStyle='#cfcdc6'; ctx.font='15px sans-serif'; ctx.fillText('gcd를 구하면서 그 gcd를 만드는 정수 x, y도 함께 구함', cx, E.H*0.34);
      ctx.fillStyle='#7ab8ff'; ctx.font='15px sans-serif';
      ctx.fillText('예) gcd(3, 7)=1 →  3·(−2) + 7·(1) = 1', cx, E.H*0.46);
      ctx.fillStyle='#8fe3b5'; ctx.font='600 17px sans-serif';
      ctx.fillText('→ 3·(−2) ≡ 1 (mod 7) →  3의 역원 = −2 ≡ 5', cx, E.H*0.56);
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif';
      ctx.fillText('모듈러 역원: a·x ≡ 1 (mod m) 의 x — RSA 키 d 계산의 핵심!', cx, E.H*0.66);
      E.big('확장 유클리드 — 모듈러 역원의 열쇠', '유클리드 호제법을 거꾸로 따라가며 ax+by=gcd의 x,y를 구합니다(베주 항등식). gcd가 1이면 x가 곧 a의 모듈러 역원 → RSA의 비밀키 d 계산, 중국인의 나머지 정리에 필수'); }
  },

  // ══════ 분할정복(algo8_03) ▸ 가장 가까운 점 쌍 ══════
  { id:'algo_br_closest', branchOf:'algo8_03',
    code:[
      'CLOSEST(P):                       // x로 정렬됨',
      '  if |P| <= 3: return 무식하게 최소거리',
      '  mid ← 중앙 x좌표, 좌우로 분할',
      '  dL ← CLOSEST(왼쪽);  dR ← CLOSEST(오른쪽)',
      '  d  ← min(dL, dR)',
      '  strip ← 중앙선에서 |x-mid| < d 인 점들',
      '  strip 을 y로 정렬',
      '  for 각 점 p: 위쪽 이웃 7개만 검사',
      '  return min(d, strip에서 찾은 최소)'
    ],
    build:function(V){
      var pts=[
        {x:0.12,y:0.30},{x:0.20,y:0.62},{x:0.30,y:0.40},{x:0.40,y:0.72},
        {x:0.55,y:0.36},{x:0.62,y:0.66},{x:0.74,y:0.48},{x:0.86,y:0.28}
      ];
      for(var i=0;i<pts.length;i++) pts[i].id=i;
      function dist(a,b){ var dx=a.x-b.x, dy=a.y-b.y; return Math.sqrt(dx*dx+dy*dy); }
      var st=[];
      function snap(line,cap,o){ o=o||{};
        st.push({line:line,cap:cap,pts:pts,
          mid:(o.mid==null?-1:o.mid), d:(o.d==null?-1:o.d),
          best:o.best||null, test:o.test||null,
          strip:o.strip||null, side:o.side||null, phase:o.phase||''}); }
      // brute force on a subset
      function brute(idx){ var bp=null,bd=1e9;
        for(var a=0;a<idx.length;a++)for(var b=a+1;b<idx.length;b++){
          var dd=dist(pts[idx[a]],pts[idx[b]]); if(dd<bd){bd=dd;bp=[idx[a],idx[b]];} }
        return {d:bd,pair:bp}; }
      var mid=(pts[3].x+pts[4].x)/2;
      var L=[0,1,2,3], R=[4,5,6,7];
      snap(0,'평면의 8개 점 중 <b>가장 가까운 두 점</b>을 찾습니다. 점들은 x좌표로 미리 정렬돼 있습니다.',{});
      snap([2],'중앙 x ≈ <b>'+mid.toFixed(2)+'</b> 를 기준으로 <b>왼쪽 4개·오른쪽 4개</b>로 분할합니다(분할정복).',{mid:mid,side:'split'});
      var rl=brute(L);
      snap([1,3],'<b>왼쪽</b> 절반에서 재귀로 최소거리를 구합니다 → dL = <b>'+rl.d.toFixed(3)+'</b>.',{mid:mid,side:'L',best:rl.pair,d:rl.d});
      var rr=brute(R);
      snap([1,3],'<b>오른쪽</b> 절반에서 재귀로 최소거리를 구합니다 → dR = <b>'+rr.d.toFixed(3)+'</b>.',{mid:mid,side:'R',best:rr.pair,d:rr.d});
      var d0=Math.min(rl.d,rr.d), best0=(rl.d<=rr.d)?rl.pair:rr.pair;
      snap([4],'두 값 중 작은 쪽 d = min(dL,dR) = <b>'+d0.toFixed(3)+'</b>. 지금까지의 최선입니다.',{mid:mid,d:d0,best:best0});
      // strip
      var strip=[]; for(i=0;i<pts.length;i++){ if(Math.abs(pts[i].x-mid)<d0) strip.push(i); }
      snap([5],'남은 일: <b>경계를 가로지르는 쌍</b>. 그런 쌍은 중앙선 좌우 <b>폭 d 띠</b> 안에만 있을 수 있습니다.',{mid:mid,d:d0,best:best0,strip:strip,phase:'strip'});
      // sort strip by y, check neighbors -> find cross pair if any closer
      strip.sort(function(a,b){ return pts[a].y-pts[b].y; });
      snap([6],'띠 안의 점들을 <b>y좌표 순</b>으로 정렬합니다. 위에서 아래로 훑으며 검사합니다.',{mid:mid,d:d0,best:best0,strip:strip,phase:'strip'});
      var bestD=d0, bestPair=best0;
      for(var s=0;s<strip.length;s++){
        for(var t=s+1; t<strip.length && t<=s+7; t++){
          var p=pts[strip[s]], q=pts[strip[t]];
          var dd=dist(p,q);
          var closer=(dd<bestD-1e-9);
          snap([7],'띠 점 '+strip[s]+' ↔ '+strip[t]+' 거리 '+dd.toFixed(3)+(closer?' → <b>더 가깝습니다!</b> d 갱신.':' → d 이상, 통과.'),
            {mid:mid,d:bestD,best:bestPair,strip:strip,test:[strip[s],strip[t]],phase:'check'});
          if(closer){ bestD=dd; bestPair=[strip[s],strip[t]]; }
        }
      }
      snap([8],'<b>완료!</b> 가장 가까운 쌍은 '+bestPair[0]+' ↔ '+bestPair[1]+', 거리 <b>'+bestD.toFixed(3)+'</b>. 띠 검사는 점당 상수개라 전체 <b>O(n log n)</b>.',
        {mid:mid,d:bestD,best:bestPair,strip:strip,phase:'done'});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H,P=f.pts;
      function PX(p){ return W*0.10+p.x*W*0.80; }
      function PY(p){ return H*0.16+p.y*H*0.70; }
      ctx.textAlign='center'; ctx.fillStyle='#cfd8e6'; ctx.font='600 14px sans-serif';
      ctx.fillText('가장 가까운 점 쌍 — 분할정복', W/2, H*0.085);
      // strip band
      if(f.mid>=0 && f.d>0 && (f.phase==='strip'||f.phase==='check'||f.phase==='done')){
        var mx=W*0.10+f.mid*W*0.80, dw=f.d*W*0.80;
        ctx.fillStyle='rgba(244,160,192,0.10)'; ctx.fillRect(mx-dw,H*0.16,dw*2,H*0.70);
        ctx.strokeStyle='rgba(244,160,192,0.45)'; ctx.lineWidth=1; ctx.setLineDash([4,4]);
        ctx.beginPath(); ctx.moveTo(mx-dw,H*0.16); ctx.lineTo(mx-dw,H*0.86);
        ctx.moveTo(mx+dw,H*0.16); ctx.lineTo(mx+dw,H*0.86); ctx.stroke(); ctx.setLineDash([]);
      }
      // mid line
      if(f.mid>=0){
        var mxx=W*0.10+f.mid*W*0.80;
        ctx.strokeStyle='rgba(122,184,255,0.55)'; ctx.lineWidth=1.6; ctx.setLineDash([6,5]);
        ctx.beginPath(); ctx.moveTo(mxx,H*0.14); ctx.lineTo(mxx,H*0.88); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle='#7ab8ff'; ctx.font='11px sans-serif'; ctx.fillText('중앙선', mxx, H*0.125);
      }
      // best pair line
      if(f.best){ var a=P[f.best[0]],b=P[f.best[1]];
        ctx.strokeStyle=(f.phase==='done')?'#8fe3b5':'#ffb27a'; ctx.lineWidth=2.6;
        ctx.beginPath(); ctx.moveTo(PX(a),PY(a)); ctx.lineTo(PX(b),PY(b)); ctx.stroke(); }
      // test pair line
      if(f.test){ var c=P[f.test[0]],e=P[f.test[1]];
        ctx.strokeStyle='rgba(244,160,192,0.8)'; ctx.lineWidth=1.6; ctx.setLineDash([3,3]);
        ctx.beginPath(); ctx.moveTo(PX(c),PY(c)); ctx.lineTo(PX(e),PY(e)); ctx.stroke(); ctx.setLineDash([]); }
      // points
      for(var i=0;i<P.length;i++){
        var px=PX(P[i]),py=PY(P[i]);
        var inStrip=f.strip&&f.strip.indexOf(i)>=0;
        var inBest=f.best&&f.best.indexOf(i)>=0;
        var inTest=f.test&&f.test.indexOf(i)>=0;
        var sideL=(f.side==='L'&&[0,1,2,3].indexOf(i)>=0);
        var sideR=(f.side==='R'&&[4,5,6,7].indexOf(i)>=0);
        var col=inBest?((f.phase==='done')?'#8fe3b5':'#ffb27a'):inTest?'#f4a0c0':(sideL||sideR)?'#ffb27a':inStrip?'#f4a0c0':'#7ab8ff';
        ctx.fillStyle=col; ctx.beginPath(); ctx.arc(px,py,(inBest||inTest)?7:5.5,0,7); ctx.fill();
        ctx.fillStyle='#9b99a3'; ctx.font='10px monospace'; ctx.textBaseline='middle';
        ctx.fillText(''+i, px, py-13); ctx.textBaseline='alphabetic';
      }
      if(f.d>0){ ctx.textAlign='left'; ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
        ctx.fillText('현재 최소거리 d = '+f.d.toFixed(3), W*0.10, H*0.95); }
      ctx.textAlign='left'; ctx.fillStyle='#9b99a3'; ctx.font='11px sans-serif';
      ctx.fillText('주황=최근접 후보  분홍=띠/검사쌍  파랑=일반 점', W*0.10, H*0.985); }
  },

  // ══════ 그리디(algo8_01) ▸ 활동 선택 문제 (코드+스텝) ══════
  { id:'algo_br_actsel', branchOf:'algo8_01',
    code:[
      'GREEDY-ACTIVITY(s, f) {      // 끝나는 시각 f로 정렬',
      '  A = { 활동1 }               // 가장 먼저 끝나는 것',
      '  last = 1',
      '  for m = 2 to n:',
      '    if (s[m] >= f[last])      // 직전과 안 겹치면',
      '      A = A ∪ { 활동m }',
      '      last = m',
      '  return A',
      '}'
    ],
    build:function(V){ var acts=[[1,4],[3,5],[0,6],[5,7],[3,9],[5,9],[6,10],[8,11]], st=[], sel=[0], last=0;
      function snap(line,cap,cur,extra){ var f={line:line,cap:cap,acts:acts,sel:sel.slice(),last:last,cur:cur==null?-1:cur}; if(extra)for(var k in extra)f[k]=extra[k]; st.push(f); }
      snap(1,'끝나는 시각 순 정렬됨 → 가장 먼저 끝나는 <b>a1[1,4]</b> 선택. 직전 끝=4.', 0);
      for(var m=1;m<acts.length;m++){
        snap(4,'a'+(m+1)+'['+acts[m][0]+','+acts[m][1]+'] : 시작 '+acts[m][0]+' ≥ 직전 끝 '+acts[last][1]+' ?', m);
        if(acts[m][0]>=acts[last][1]){ sel.push(m); last=m; snap(5,'안 겹침 → <b>선택!</b> 직전 끝을 '+acts[m][1]+'로.', m); }
        else { snap(4,'겹침 → 건너뜀.', m); }
      }
      snap(7,'<b>완료!</b> 최대 <b>'+sel.length+'개</b> 선택. "가장 먼저 끝나는 것 고르기"가 최적(교환논법 증명).', -1, {done:true});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx, T=12, x0=V.W*0.12, x1=V.W*0.88, y0=V.H*0.22, rh=Math.min(36,V.H*0.075);
      function X(t){ return x0+(x1-x0)*t/T; }
      ctx.strokeStyle='rgba(255,255,255,0.12)'; ctx.lineWidth=1;
      for(var t=0;t<=T;t+=2){ var x=X(t); ctx.beginPath(); ctx.moveTo(x,y0-12); ctx.lineTo(x,y0+f.acts.length*rh); ctx.stroke(); ctx.fillStyle='#6f6e7a'; ctx.font='10px sans-serif'; ctx.textAlign='center'; ctx.fillText(t,x,y0-18); }
      f.acts.forEach(function(a,i){ var y=y0+i*rh+4, picked=f.sel.indexOf(i)>=0, cur=(i===f.cur);
        var col=picked?'#8fe3b5':cur?'#ffb27a':'#7ab8ff';
        ctx.fillStyle=picked?'rgba(143,227,181,0.3)':cur?'rgba(255,178,122,0.3)':'rgba(122,184,255,0.12)'; ctx.strokeStyle=col; ctx.lineWidth=2;
        ctx.fillRect(X(a[0]),y,X(a[1])-X(a[0]),rh-8); ctx.strokeRect(X(a[0]),y,X(a[1])-X(a[0]),rh-8);
        ctx.fillStyle=col; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('a'+(i+1), X(a[1])+6, y+rh/2-1); }); }
  },

  // ══════ DP(algo7_03) ▸ 최장 증가 부분수열 LIS (코드+스텝) ══════
  { id:'algo_br_lis', branchOf:'algo7_03',
    code:[
      'LIS(A) {                   // 최장 증가 부분수열',
      '  for i = 0 to n-1:',
      '    dp[i] = 1              // 최소 자기 자신',
      '    for j = 0 to i-1:',
      '      if (A[j] < A[i])',
      '        dp[i] = max(dp[i], dp[j]+1)',
      '  return max(dp)',
      '}'
    ],
    build:function(V){ var A=[3,1,4,1,5,9,2,6], n=A.length, dp=[], st=[];
      function snap(line,cap,i,j,extra){ var f={line:line,cap:cap,A:A,dp:dp.slice(),i:i==null?-1:i,j:j==null?-1:j}; if(extra)for(var k in extra)f[k]=extra[k]; st.push(f); }
      for(var i=0;i<n;i++){ dp[i]=1; snap(2,'dp['+i+']=1 (A['+i+']='+A[i]+' 자기 자신만으로 길이 1).', i,-1);
        for(var j=0;j<i;j++){ snap(4,'A['+j+']='+A[j]+' < A['+i+']='+A[i]+' ?', i, j);
          if(A[j]<A[i] && dp[j]+1>dp[i]){ dp[i]=dp[j]+1; snap(5,'증가 가능! dp['+i+'] = dp['+j+']+1 = <b>'+dp[i]+'</b>', i, j); } }
      }
      var best=Math.max.apply(null,dp);
      snap(6,'<b>완료!</b> 최장 증가 부분수열 길이 = <b>'+best+'</b> (예: 1,4,5,9). O(n²) DP.', -1,-1,{done:true});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx;
      var info=AV.arr(V, f.A, { y:V.H*0.32, bw:52, gap:10, hl:function(k){ if(k===f.i)return {fill:'rgba(255,178,122,0.3)',stroke:'#ffb27a',text:'#ffb27a',tag:'i'}; if(k===f.j)return {fill:'rgba(143,227,181,0.25)',stroke:'#8fe3b5',text:'#8fe3b5',tag:'j'}; return null; } });
      ctx.font='600 16px sans-serif'; ctx.textAlign='center';
      for(var k=0;k<f.dp.length;k++){ var bx=info.x0+k*(info.bw+info.gap)+info.bw/2; ctx.fillStyle=k===f.i?'#ffb27a':'#8fe3b5'; ctx.fillText(f.dp[k], bx, info.y+info.bw+30); }
      ctx.fillStyle='#6f6e7a'; ctx.font='12px sans-serif'; ctx.fillText('아래 숫자 dp[i] = i에서 끝나는 최장 증가 길이', V.W/2, info.y+info.bw+56); }
  },

  // ══════ 삽입정렬(algo3_03) ▸ 루프 불변식 정확성 (concept) ══════
  { id:'algo_br_insinv', branchOf:'algo3_03',
    code:[
      'INSERTION-SORT(A):',
      '  inv ← 0                       // 전도 수',
      '  for i = 1 .. n-1:             // 불변식: A[0..i-1] 정렬됨',
      '    key ← A[i];  j ← i-1',
      '    while j ≥ 0 and A[j] > key: // key보다 큰 것',
      '      A[j+1] ← A[j];  inv++     // 한 칸 밀기 = 전도 1',
      '      j ← j-1',
      '    A[j+1] ← key                // 제자리에 끼움',
      '  return inv'
    ],
    build:function(V){
      var A=[5,2,4,1], n=A.length, st=[], inv=0;
      function snap(line,cap,o){ o=o||{};
        st.push({line:line,cap:cap,arr:A.slice(),n:n,inv:inv,
          i:(o.i==null?-1:o.i), j:(o.j==null?-1:o.j),
          key:(o.key==null?null:o.key), keyPos:(o.keyPos==null?-1:o.keyPos),
          shift:(o.shift==null?-1:o.shift), mode:o.mode||''}); }
      snap([0,1],'배열 <b>[5, 2, 4, 1]</b>을 삽입 정렬합니다. 밀어내는 횟수를 세면 곧 <b>전도(inversion) 수</b>가 됩니다.',{});
      for(var i=1;i<n;i++){
        var key=A[i], j=i-1;
        snap([2,3],'<b>i='+i+'</b>: A[0..'+(i-1)+']은 이미 정렬됨(불변식). 다음 키 <b>key='+key+'</b>를 앞쪽 제자리에 끼웁니다.',{i:i,key:key,keyPos:i,mode:'pick'});
        while(j>=0 && A[j]>key){
          snap([4],'A['+j+']='+A[j]+' &gt; key='+key+' → key보다 크므로 <b>한 칸 오른쪽으로 밀기</b>. (A['+j+']가 key 뒤에 와야 함 = 전도 1)',{i:i,j:j,key:key,keyPos:j+1,shift:j,mode:'compare'});
          A[j+1]=A[j]; inv++;
          snap([5,6],'A['+(j+1)+'] ← '+A[j+1]+' 밀기 완료. <b>전도 수 inv = '+inv+'</b> 증가.',{i:i,j:j,key:key,keyPos:j,shift:j+1,mode:'shift'});
          j--;
        }
        A[j+1]=key;
        snap([7],'더 이상 큰 값이 없으니 <b>key='+key+'</b>를 A['+(j+1)+']에 끼워 넣습니다. 이제 A[0..'+i+']가 정렬됨.',{i:i,j:j,key:key,keyPos:j+1,mode:'insert'});
      }
      snap([8],'<b>정렬 완료!</b> 결과 ['+A.join(', ')+']. 총 밀어낸 횟수 = <b>전도 수 '+inv+'</b> — 정렬 안 된 쌍의 개수와 정확히 같습니다.',{inv:inv,mode:'done'});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H,A=f.arr,n=f.n;
      ctx.textAlign='center'; ctx.fillStyle='#cfd8e6'; ctx.font='600 15px sans-serif';
      ctx.fillText('삽입 정렬 — 밀어낸 횟수 = 전도(inversion) 수', W/2, H*0.10);
      var maxv=5, bw=Math.min(72,(W*0.74)/n), gap=10;
      var totalW=n*bw+(n-1)*gap, x0=W/2-totalW/2, baseY=H*0.74, maxBarH=H*0.42;
      for(var i=0;i<n;i++){
        var v=A[i], bh=maxBarH*v/maxv, x=x0+i*(bw+gap), y=baseY-bh;
        var col,fill,tcol;
        var sortedZone=(f.i>=0 && i<f.i && f.mode!=='done');
        if(f.mode==='done'){ col='#8fe3b5'; fill='rgba(143,227,181,0.22)'; tcol='#8fe3b5'; }
        else if(i===f.keyPos && (f.mode==='pick'||f.mode==='insert')){ col='#ffb27a'; fill='rgba(255,178,122,0.28)'; tcol='#ffb27a'; }
        else if(i===f.shift && f.mode==='shift'){ col='#f4a0c0'; fill='rgba(244,160,192,0.28)'; tcol='#f4a0c0'; }
        else if(i===f.j && f.mode==='compare'){ col='#f4a0c0'; fill='rgba(244,160,192,0.20)'; tcol='#f4a0c0'; }
        else if(sortedZone){ col='#8fe3b5'; fill='rgba(143,227,181,0.14)'; tcol='#8fe3b5'; }
        else { col='#7ab8ff'; fill='rgba(122,184,255,0.13)'; tcol='#dfeefb'; }
        ctx.fillStyle=fill; ctx.strokeStyle=col; ctx.lineWidth=2.2;
        if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(x,y,bw,bh,6); ctx.fill(); ctx.stroke(); }
        else { ctx.fillRect(x,y,bw,bh); ctx.strokeRect(x,y,bw,bh); }
        ctx.fillStyle=tcol; ctx.font='600 18px sans-serif'; ctx.textBaseline='middle';
        ctx.fillText(v, x+bw/2, y-14);
        ctx.fillStyle='#7f8a9b'; ctx.font='11px monospace';
        ctx.fillText('['+i+']', x+bw/2, baseY+16);
        ctx.textBaseline='alphabetic';
      }
      // key chip floating
      if(f.key!=null && f.mode!=='done'){
        ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.textAlign='right';
        ctx.fillText('key =', x0-14, H*0.86);
        var kx=x0+4;
        ctx.fillStyle='rgba(255,178,122,0.25)'; ctx.strokeStyle='#ffb27a'; ctx.lineWidth=2;
        if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(kx,H*0.86-18,40,34,7); ctx.fill(); ctx.stroke(); }
        else { ctx.fillRect(kx,H*0.86-18,40,34); }
        ctx.fillStyle='#ffb27a'; ctx.font='600 17px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(f.key, kx+20, H*0.86); ctx.textBaseline='alphabetic';
      }
      // inversion counter
      ctx.textAlign='center'; ctx.fillStyle=(f.mode==='done')?'#8fe3b5':'#ffb27a'; ctx.font='600 16px sans-serif';
      ctx.fillText('전도 수 inv = '+f.inv, W*0.78, H*0.86);
      ctx.fillStyle='#9b99a3'; ctx.font='11px sans-serif';
      ctx.fillText('초록=정렬 완료 구간 · 주황=현재 키 · 분홍=밀어내는 원소', W/2, H*0.96); }
  },

  // ══════ 그리디(algo8_01) ▸ 허프만 코딩 (concept) ══════
  { id:'algo_br_huffman', branchOf:'algo8_01',
    code:[
      'HUFFMAN(C):',
      '  Q ← C의 글자들 (빈도 최소 힙)',
      '  while |Q| > 1:',
      '    x ← EXTRACT-MIN(Q)   // 가장 작은',
      '    y ← EXTRACT-MIN(Q)   // 다음 작은',
      '    z ← 새 노드',
      '    z.freq ← x.freq + y.freq',
      '    INSERT(Q, z)',
      '  return EXTRACT-MIN(Q)   // 루트'
    ],
    build:function(V){
      var nodes=[
        {ch:'f',fr:45,x:0,    d:1, cs:null,l:null,r:null},
        {ch:'c',fr:12,x:1,    d:3, cs:null,l:null,r:null},
        {ch:'d',fr:13,x:2,    d:3, cs:null,l:null,r:null},
        {ch:'a',fr:5, x:3,    d:4, cs:null,l:null,r:null},
        {ch:'b',fr:9, x:4,    d:4, cs:null,l:null,r:null},
        {ch:'e',fr:16,x:5,    d:3, cs:null,l:null,r:null},
        {ch:null,fr:14,x:3.5,  d:3, cs:1,l:3,r:4},
        {ch:null,fr:25,x:1.5,  d:2, cs:2,l:1,r:2},
        {ch:null,fr:30,x:4.25, d:2, cs:3,l:6,r:5},
        {ch:null,fr:55,x:2.875,d:1, cs:4,l:7,r:8},
        {ch:null,fr:100,x:1.4375,d:0,cs:5,l:0,r:9}
      ];
      var merges=[[3,4,6],[1,2,7],[6,5,8],[7,8,9],[0,9,10]];
      function lab(i){ return nodes[i].ch?(nodes[i].ch+':'+nodes[i].fr):('합 '+nodes[i].fr); }
      var st=[], consumed=[];
      function snap(line,cap,step,pair,cons){ st.push({line:line,cap:cap,nodes:nodes,step:step,pair:pair||null,consumed:(cons||[]).slice()}); }
      snap([0,1],'6개 글자를 <b>빈도 최소 우선순위 큐</b>에 넣습니다. a:5 b:9 c:12 d:13 e:16 f:45.',0,null,[]);
      for(var m=0;m<merges.length;m++){ var x=merges[m][0],y=merges[m][1],z=merges[m][2];
        snap([3,4],'큐에서 <b>가장 작은 둘</b>을 꺼냅니다: '+lab(x)+' , '+lab(y)+'.', m, [x,y], consumed);
        consumed=consumed.concat([x,y]);
        snap([5,6,7],lab(x)+' + '+lab(y)+' → 합쳐 부모 <b>'+nodes[z].fr+'</b> 를 만들어 큐에 다시 넣습니다.', m+1, [z], consumed);
      }
      snap(8,'<b>완료!</b> 루트 100. 빈도 큰 f는 코드 <b>0</b>(짧게), 드문 a·b는 <b>1100·1101</b>(길게) — 평균 부호길이 최소.', 5, [10], consumed);
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H,N=f.nodes;
      var x0=W*0.13,x1=W*0.87,y0=H*0.16,lg=Math.min(60,H*0.145);
      function X(s){ return x0+(x1-x0)*s/5; }
      function Y(d){ return y0+d*lg; }
      function rev(i){ return N[i].cs==null||N[i].cs<=f.step; }
      function parentCs(i){ for(var k=0;k<N.length;k++){ if(N[k].l===i||N[k].r===i) return N[k].cs; } return null; }
      ctx.lineWidth=2;
      for(var i=0;i<N.length;i++){ var n=N[i]; if(n.l==null||!rev(i)) continue;
        [[n.l,'0'],[n.r,'1']].forEach(function(pr){ var c=N[pr[0]];
          ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.moveTo(X(n.x),Y(n.d)); ctx.lineTo(X(c.x),Y(c.d)); ctx.stroke();
          ctx.fillStyle='#7f7e8a'; ctx.font='11px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.fillText(pr[1], X(n.x)*0.35+X(c.x)*0.65, Y(n.d)*0.35+Y(c.d)*0.65); }); }
      ctx.textBaseline='alphabetic';
      for(i=0;i<N.length;i++){ if(!rev(i)) continue; var nn=N[i];
        var isPair=f.pair&&f.pair.indexOf(i)>=0, isNew=(nn.cs===f.step&&nn.cs!=null);
        var consumed=f.consumed.indexOf(i)>=0 && !isPair;
        var col=isPair?'#ffb27a':isNew?'#8fe3b5':consumed?'#56555f':'#7ab8ff';
        var fc =isPair?'rgba(255,178,122,0.25)':isNew?'rgba(143,227,181,0.2)':consumed?'rgba(110,110,120,0.06)':'rgba(122,184,255,0.13)';
        var px=X(nn.x),py=Y(nn.d),r=17;
        ctx.fillStyle=fc; ctx.strokeStyle=col; ctx.lineWidth=2.2; ctx.beginPath(); ctx.arc(px,py,r,0,7); ctx.fill(); ctx.stroke();
        ctx.fillStyle=col; ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(nn.fr,px,py); ctx.textBaseline='alphabetic';
        if(nn.ch){ ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.fillText(nn.ch,px,py+r+15); } }
      var act=[]; for(i=0;i<N.length;i++){ if(!rev(i)) continue; var pc=parentCs(i); if(pc==null||pc>f.step) act.push(i); }
      act.sort(function(a,b){ return N[a].fr-N[b].fr; });
      ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.textBaseline='alphabetic'; ctx.fillText('우선순위 큐(작은 순):', x0, H*0.93);
      var cx=x0+148;
      for(i=0;i<act.length;i++){ var id=act[i], hot=(i<2&&f.pair&&f.pair.length===2&&f.pair.indexOf(id)>=0);
        var lbl=(N[id].ch||'•')+':'+N[id].fr; ctx.font='600 12px sans-serif';
        var w=ctx.measureText(lbl).width+16;
        ctx.fillStyle=hot?'rgba(255,178,122,0.25)':'rgba(122,184,255,0.12)'; ctx.strokeStyle=hot?'#ffb27a':'#7ab8ff'; ctx.lineWidth=1.5;
        if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(cx,H*0.895,w,22,6); ctx.fill(); ctx.stroke(); } else { ctx.fillRect(cx,H*0.895,w,22); ctx.strokeRect(cx,H*0.895,w,22); }
        ctx.fillStyle=hot?'#ffb27a':'#cfe0ff'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(lbl,cx+w/2,H*0.895+11); ctx.textBaseline='alphabetic';
        cx+=w+8; } }
  },

  // ══════ 격자DP(algo7_05) ▸ 편집 거리 (코드+스텝) ══════
  { id:'algo_br_editdist', branchOf:'algo7_05',
    code:[
      'EDIT-DIST(A, B) {                 // A→B 최소 편집',
      '  dp[i][0]=i;  dp[0][j]=j          // 기저',
      '  for i=1..m, j=1..n:',
      '    if (A[i-1] == B[j-1])',
      '      dp[i][j] = dp[i-1][j-1]      // 그대로',
      '    else dp[i][j] = 1 + min(',
      '      dp[i-1][j],   // 삭제',
      '      dp[i][j-1],   // 삽입',
      '      dp[i-1][j-1]) // 교체',
      '}'
    ],
    build:function(V){ var A='cat', B='map', m=A.length, n=B.length, dp=[], st=[], cnt=0;
      for(var i=0;i<=m;i++){ dp[i]=[]; for(var j=0;j<=n;j++) dp[i][j]=0; }
      function copy(){ return dp.map(function(r){return r.slice();}); }
      function snap(line,cap,cur,src){ st.push({line:line,cap:cap,A:A,B:B,m:m,n:n,dp:copy(),cur:cur||null,src:src||null}); }
      for(i=0;i<=m;i++) dp[i][0]=i; for(var j=0;j<=n;j++) dp[0][j]=j;
      snap(1,'기저: 빈 문자열로 만드는 비용 = 길이(삽입/삭제만).', null, null);
      for(i=1;i<=m;i++)for(j=1;j<=n;j++){
        if(A[i-1]===B[j-1]){ dp[i][j]=dp[i-1][j-1]; snap(4,"'"+A[i-1]+"' = '"+B[j-1]+"' 같음 → 대각선 "+dp[i][j]+" 그대로.", [i,j], [[i-1,j-1]]); }
        else { dp[i][j]=1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]); snap(5,"'"+A[i-1]+"' ≠ '"+B[j-1]+"' → 1 + min(삭제,삽입,교체) = <b>"+dp[i][j]+"</b>", [i,j], [[i-1,j],[i,j-1],[i-1,j-1]]); }
      }
      snap(0,'<b>편집 거리 = '+dp[m][n]+'</b> (cat→map: c→m, t→p 교체 2번).', [m,n], null);
      return st; },
    draw:function(V,f){ var ctx=V.ctx, cell=Math.min(62,V.H*0.12), x0=V.W/2-(f.n+1)*cell/2+cell*0.35, y0=V.H*0.28;
      ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      for(var j=0;j<=f.n;j++){ var x=x0+j*cell; ctx.fillStyle='#8fe3b5'; ctx.fillText(j===0?'∅':f.B[j-1], x+cell/2, y0-cell*0.45); }
      for(var i=0;i<=f.m;i++){ var y=y0+i*cell; ctx.fillStyle='#ffb27a'; ctx.fillText(i===0?'∅':f.A[i-1], x0-cell*0.45, y+cell/2); }
      for(i=0;i<=f.m;i++)for(j=0;j<=f.n;j++){ var x=x0+j*cell, y=y0+i*cell;
        var cur=f.cur&&f.cur[0]===i&&f.cur[1]===j, src=f.src&&f.src.some(function(c){return c[0]===i&&c[1]===j;});
        ctx.fillStyle=cur?'rgba(255,178,122,0.32)':src?'rgba(143,227,181,0.22)':'rgba(122,184,255,0.12)';
        ctx.strokeStyle=cur?'#ffb27a':src?'#8fe3b5':'#7ab8ff'; ctx.lineWidth=1.5;
        ctx.fillRect(x,y,cell-3,cell-3); ctx.strokeRect(x,y,cell-3,cell-3);
        ctx.fillStyle=cur?'#ffb27a':'#dfeefb'; ctx.font='600 16px sans-serif'; ctx.fillText(f.dp[i][j], x+cell/2, y+cell/2); }
      ctx.textBaseline='alphabetic';
      ctx.fillStyle='#6f6e7a'; ctx.font='12px sans-serif'; ctx.fillText('주황=A 문자(행) / 초록=B 문자(열) / 초록칸=참고한 이웃', V.W/2, y0+(f.m+1)*cell+6); }
  },

  // ══════ 타뷸레이션(algo7_03) ▸ 행렬 연쇄 곱셈 (concept) ══════
  { id:'algo_br_matchain', concept:true, branchOf:'algo7_03',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, cx=E.W/2;
      ctx.font='600 16px sans-serif'; ctx.textAlign='center';
      ctx.fillStyle='#cfcdc6'; ctx.fillText('A(10×100) · B(100×5) · C(5×50)', cx, E.H*0.24);
      ctx.fillStyle='#f4a0c0'; ctx.font='600 15px sans-serif'; ctx.fillText('((A·B)·C): 10·100·5 + 10·5·50 = 7,500', cx, E.H*0.42);
      ctx.fillStyle='#8fe3b5'; ctx.fillText('(A·(B·C)): 100·5·50 + 10·100·50 = 75,000', cx, E.H*0.52);
      ctx.fillStyle='#ffb27a'; ctx.font='600 16px sans-serif'; ctx.fillText('괄호 위치만 바꿔도 10배 차이!', cx, E.H*0.66);
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.fillText('DP로 모든 분할점을 시도해 최소 비용 괄호화를 O(n³)에 찾음', cx, E.H*0.74); }
  },

  // ══════ DFS(algo6_04) ▸ 간선 분류 (concept) ══════
  { id:'algo_br_edgeclass', concept:true, branchOf:'algo6_04',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, x0=E.W*0.18, y0=E.H*0.24, lh=E.H*0.13, len=E.W*0.16;
      var rows=[['#8fe3b5','트리 간선 (Tree)','DFS가 새 정점을 처음 발견'],
                ['#f4a0c0','후향 간선 (Back)','조상으로 → 사이클 존재!'],
                ['#7ab8ff','전향 간선 (Forward)','이미 끝난 자손으로'],
                ['#cfa0f4','교차 간선 (Cross)','다른 서브트리로']];
      rows.forEach(function(r,i){ var y=y0+i*lh;
        AV.arrow(ctx, x0, y, x0+len, y, r[0], 3);
        ctx.fillStyle=r[0]; ctx.font='600 16px sans-serif'; ctx.textAlign='left'; ctx.fillText(r[1], x0+len+24, y+5);
        ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.fillText(r[2], x0+len+24, y+26); });
      ctx.fillStyle='#6f6e7a'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('발견/종료 시간으로 네 종류를 구분 — 후향 간선이 있으면 사이클!', E.W/2, y0+4*lh+10); }
  },

  // ══════ 다익스트라(algo6_05) ▸ 정확성(그리디 불변식) (concept) ══════
  { id:'algo_br_dij_proof', concept:true, branchOf:'algo6_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, cx=E.W*0.42, cy=E.H*0.42;
      // 확정 집합 S
      ctx.fillStyle='rgba(143,227,181,0.10)'; ctx.strokeStyle='#8fe3b5'; ctx.lineWidth=2; ctx.setLineDash([5,4]); ctx.beginPath(); ctx.ellipse(cx,cy,E.W*0.22,E.H*0.20,0,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
      AV.node(E, cx-E.W*0.08, cy, 's', {r:18,stroke:'#8fe3b5',text:'#8fe3b5',fill:'rgba(143,227,181,0.2)'});
      AV.node(E, cx+E.W*0.04, cy-E.H*0.05, '', {r:14,stroke:'#8fe3b5',fill:'rgba(143,227,181,0.2)'});
      AV.node(E, cx+E.W*0.18, cy+E.H*0.10, 'u', {r:20,stroke:'#ffb27a',text:'#ffb27a',fill:'rgba(255,178,122,0.25)',tag:'꺼냄(min d)'});
      ctx.fillStyle='#8fe3b5'; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.fillText('확정 집합 S', cx, cy-E.H*0.16);
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.fillText('u로 가는 다른 경로는 이미 S 안 어떤 정점을 거쳐 더 길다', cx, cy+E.H*0.24);
      ctx.fillStyle='#ffb27a'; ctx.font='600 14px sans-serif'; ctx.fillText('→ 꺼낸 u의 d[u]는 최종 최단거리(더 줄 수 없음)', cx, cy+E.H*0.30); }
  },

  // ══════ 그리디(algo8_01) ▸ 분할 가능 배낭 (코드+스텝) ══════
  { id:'algo_br_fracknap', branchOf:'algo8_01',
    code:[
      'FRACTIONAL-KNAPSACK(items, W) {  // 가치/무게 내림차순',
      '  total = 0',
      '  for each item:',
      '    if (w[i] <= W)               // 통째로 넣기',
      '      W -= w[i];  total += v[i]',
      '    else                          // 일부만 넣기',
      '      total += v[i] * (W / w[i])',
      '      break',
      '  return total',
      '}'
    ],
    build:function(V){ var items=[{n:'A',v:60,w:10},{n:'B',v:100,w:20},{n:'C',v:120,w:30}], W=50, cap=50, total=0, st=[];
      items.forEach(function(it){ it.r=(it.v/it.w).toFixed(1); });
      function snap(line,cap2,cur,extra){ var f={line:line,cap:cap2,items:items,W:cap,used:cap-W,total:Math.round(total),cur:cur==null?-1:cur,state:{}}; items.forEach(function(it,i){ f.state[i]=st._state?st._state[i]:'none'; }); if(extra)for(var k in extra)f[k]=extra[k]; st.push(f); }
      st._state={};
      snap(0,'가치/무게 비율 내림차순 정렬됨 (A=6, B=5, C=4). 용량 W=50.',-1);
      for(var i=0;i<items.length;i++){ var it=items[i];
        snap(3,it.n+' (가치'+it.v+'/무게'+it.w+', 비율'+it.r+') : 무게 '+it.w+' ≤ 남은 '+W+' ?',i);
        if(it.w<=W){ W-=it.w; total+=it.v; st._state[i]='full'; snap(4,it.n+' <b>통째로</b> 넣음 → 총가치 '+Math.round(total)+', 남은용량 '+W,i); }
        else { var frac=W/it.w; total+=it.v*frac; st._state[i]='part'; snap(6,it.n+' 의 <b>'+Math.round(frac*100)+'%</b>만 넣음(+'+Math.round(it.v*frac)+') → 가방 가득!',i); break; }
      }
      snap(8,'<b>완료!</b> 최대 가치 = <b>'+Math.round(total)+'</b>. 비율 높은 것부터 = 분할 가능일 땐 그리디가 최적(0/1 배낭은 DP 필요).',-1,{done:true});
      return st; },
    draw:function(V,f){ var ctx=V.ctx, y0=V.H*0.24, rh=Math.min(46,V.H*0.09), x0=V.W*0.16, maxW=V.W*0.5;
      f.items.forEach(function(it,i){ var y=y0+i*rh, bw=maxW*it.w/30, stt=f.state[i], cur=(i===f.cur);
        var col=stt==='full'?'#8fe3b5':stt==='part'?'#ffb27a':cur?'#ffb27a':'#7ab8ff';
        ctx.fillStyle=stt==='full'?'rgba(143,227,181,0.3)':stt==='part'?'rgba(255,178,122,0.3)':cur?'rgba(255,178,122,0.18)':'rgba(122,184,255,0.12)';
        ctx.strokeStyle=col; ctx.lineWidth=2; ctx.fillRect(x0,y,bw,rh-8); ctx.strokeRect(x0,y,bw,rh-8);
        ctx.fillStyle=col; ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.fillText(it.n+'  가치'+it.v+'/무게'+it.w+' (비율 '+it.r+')  '+(stt==='full'?'✓전체':stt==='part'?'◐일부':''), x0+bw+12, y+rh/2-1); });
      // 용량 게이지
      var gy=y0+f.items.length*rh+20, gw=V.W*0.6, gx=V.W/2-gw/2;
      ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(gx,gy,gw,18); ctx.fillStyle='#8fe3b5'; ctx.fillRect(gx,gy,gw*Math.min(1,f.used/f.W),18);
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1.5; ctx.strokeRect(gx,gy,gw,18);
      ctx.fillStyle='#cfcdc6'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('가방: '+f.used+'/'+f.W+'    총가치 '+f.total, V.W/2, gy+40); }
  },

  // ══════ 해시(algo2_05) ▸ 체이닝 충돌 해결 (concept) ══════
  { id:'algo_br_chaining', concept:true, branchOf:'algo2_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, M=5, bx=E.W*0.30, by=E.H*0.20, bw=120, bh=Math.min(46,E.H*0.09);
      var buckets={1:['cat','fox'],3:['dog'],4:['owl','ant','bee']};
      for(var i=0;i<M;i++){ var y=by+i*(bh+8);
        ctx.fillStyle='rgba(122,184,255,0.10)'; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2; ctx.fillRect(bx,y,bw,bh); ctx.strokeRect(bx,y,bw,bh);
        ctx.fillStyle='#6f6e7a'; ctx.font='12px sans-serif'; ctx.textAlign='right'; ctx.fillText('['+i+']', bx-8, y+bh/2+4);
        var ch=buckets[i]||[];
        for(var k=0;k<ch.length;k++){ var nx=bx+bw+30+k*92, ny=y+bh/2;
          AV.arrow(ctx, nx-30, ny, nx-6, ny, '#8fe3b5', 2);
          ctx.fillStyle='rgba(143,227,181,0.2)'; ctx.strokeStyle='#8fe3b5'; ctx.fillRect(nx,y+4,76,bh-8); ctx.strokeRect(nx,y+4,76,bh-8);
          ctx.fillStyle='#8fe3b5'; ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.fillText('"'+ch[k]+'"', nx+38, y+bh/2+4); }
      }
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('같은 버킷에 충돌한 키들을 연결 리스트로 묶음', E.W/2, by+M*(bh+8)+10); }
  },

  // ══════ 균형(algo5_05) ▸ 레드블랙 회전 (concept) ══════
  { id:'algo_br_rotate', branchOf:'algo5_05', impl_lang:'C++',
    impl:['#include <iostream>','using namespace std;','',
      'struct Node { int key; Node *left, *right;',
      '  Node(int k):key(k),left(0),right(0){} };','',
      '// 우회전: 왼쪽으로 치우친 y를 균형잡기',
      '//   (BST 정렬 순서는 그대로, 높이만 줄임)',
      'Node* rightRotate(Node* y) {',
      '    Node* x  = y->left;     // x = 위로 올릴 왼쪽 자식',
      '    Node* T2 = x->right;    // T2 = x의 오른쪽 서브트리(β)',
      '    x->right = y;           // y를 x의 오른쪽 자식으로 내림',
      '    y->left  = T2;          // β를 y의 왼쪽에 다시 붙임',
      '    return x;               // x가 새 부분트리 루트',
      '}',
      '',
      '// 좌회전은 좌우 대칭 (left<->right)',
      'Node* leftRotate(Node* x) {',
      '    Node* y  = x->right;',
      '    Node* T2 = y->left;',
      '    y->left  = x;',
      '    x->right = T2;',
      '    return y;',
      '}',
      '',
      'void inorder(Node* r){',
      '    if(!r) return;',
      '    inorder(r->left);',
      '    std::cout << r->key << " ";',
      '    inorder(r->right);',
      '}',
      '',
      'int main() {',
      '    // 왼쪽으로 치우친 트리:    y(20)',
      '    //                       /     \\\\',
      '    //                     x(10)   γ(30)',
      '    //                    /    \\\\',
      '    //                  α(5)   β(15)',
      '    Node* y = new Node(20);',
      '    y->left = new Node(10); y->right = new Node(30);',
      '    y->left->left  = new Node(5);',
      '    y->left->right = new Node(15);',
      '',
      '    std::cout << "before: "; inorder(y); std::cout << "\\n";',
      '    Node* root = rightRotate(y);   // x(10)이 새 루트',
      '    std::cout << "after : "; inorder(root); std::cout << "\\n";',
      '    // 둘 다  5 10 15 20 30  — 순서 보존!',
      '    return 0;',
      '}'],
    code:[
      'Node* rightRotate(Node* y) {',
      '  Node* x  = y->left;     // 올릴 자식',
      '  Node* T2 = x->right;    // β 서브트리',
      '  x->right = y;           // y를 내림',
      '  y->left  = T2;          // β 재배선',
      '  return x;               // x = 새 루트',
      '}'
    ],
    // 노드별 목표 좌표(프랙션)를 단계마다 지정 → draw에서 frame 보간으로 부드럽게 이동.
    // 단계 사이 좌표가 바뀌는 노드가 '회전하며 재배치되는 노드'.
    build:function(V){ var st=[];
      // 좌표 프리셋: P_before(치우친 트리), P_after(균형 트리)
      // 키: y=20, x=10, a(α)=5, b(β)=15, g(γ)=30
      var Pb={ y:[0.50,0.20], x:[0.34,0.45], g:[0.70,0.45], a:[0.22,0.72], b:[0.46,0.72] };
      var Pa={ x:[0.42,0.22], a:[0.26,0.48], y:[0.62,0.48], b:[0.50,0.74], g:[0.78,0.74] };
      // 간선 목록: [부모키,자식키]. hl=강조(재배선)되는 간선 키문자열들.
      function snap(line,cap,pos,edges,move,hl,note){ st.push({line:line,cap:cap,pos:pos,edges:edges,move:move||[],hl:hl||[],note:note||''}); }
      var Eb=[['y','x'],['y','g'],['x','a'],['x','b']];
      snap(0,'왼쪽으로 치우친 트리. 루트 <b>y=20</b>의 왼쪽이 무거워(높이 3) 균형을 잡아야 합니다. 순서는 5&lt;10&lt;15&lt;20&lt;30.',
        Pb, Eb, [], [], '불균형: 왼쪽 무거움');
      snap(1,'<b>x = y->left</b> → 위로 올릴 후보는 y의 왼쪽 자식 <b>x=10</b>.',
        Pb, Eb, ['x'], [['y','x']], '');
      snap(2,'<b>T2 = x->right</b> → x의 오른쪽 서브트리 <b>β=15</b>를 따로 기억해 둡니다(나중에 옮길 가지).',
        Pb, Eb, ['x','b'], [['x','b']], '');
      // x->right=y : y가 x 아래(오른쪽)로 내려옴. a는 x의 왼쪽 그대로, β/γ는 잠시 그대로 두고 표시.
      var Em1=[['x','a'],['x','y'],['y','g'],['x','b']];
      snap(3,'<b>x->right = y</b> → x를 위로 올리고 <b>y를 x의 오른쪽 자식으로 내림</b>. x가 새 루트 자리로.',
        Pa, Em1, ['x','y'], [['x','y']], 'x를 위로 · y를 아래로');
      // y->left=T2 : β를 y의 왼쪽으로 재배선
      var Em2=[['x','a'],['x','y'],['y','b'],['y','g']];
      snap(4,'<b>y->left = T2</b> → 기억해 둔 <b>β=15</b>를 y의 왼쪽 자식으로 다시 붙입니다(β는 10과 20 사이라 자리가 맞음).',
        Pa, Em2, ['b','y'], [['y','b']], 'β를 y 왼쪽으로');
      snap(5,'<b>return x</b> → <b>x=10</b>이 새 부분트리 루트. 높이 3→2로 줄고 BST 순서 그대로!',
        Pa, Em2, ['x'], [], '균형 회복 · 높이 ↓');
      snap(6,'<b>완료!</b> 중위 순회는 회전 전후 모두 <b>5 10 15 20 30</b> — 순서 보존, 모양만 바뀜. 포인터 몇 개만 = O(1).',
        Pa, Em2, [], [], '순서 보존 · O(1)');
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H, r=21;
      var VAL={ y:20, x:10, a:5, b:15, g:30 };
      var LBL={ y:'y', x:'x', a:'α', b:'β', g:'γ' };
      // 프레임 전환 감지 → 보간 시작점 저장. _rp = 현재 화면상 좌표(프랙션)
      if(V._rotStep!==f){ V._rotPrev=V._rp; V._rotStep=f; V._rotT0=V.frame; }
      var tp=f.pos; if(!V._rp){ V._rp={}; for(var k0 in tp) V._rp[k0]=tp[k0].slice(); }
      // 모든 키가 _rp에 존재하도록(새로 등장하는 노드는 목표에서 시작)
      for(var k1 in tp){ if(!V._rp[k1]) V._rp[k1]=tp[k1].slice(); }
      // 이징 보간 (목표로 부드럽게)
      var ease=0.18; for(var k in tp){ var cur=V._rp[k], tg=tp[k];
        cur[0]+=(tg[0]-cur[0])*ease; cur[1]+=(tg[1]-cur[1])*ease; }
      function PX(k){ var c=V._rp[k]; return [c[0]*W, c[1]*H]; }
      // 헤더
      ctx.textAlign='center'; ctx.fillStyle='#cfd8e6'; ctx.font='600 15px sans-serif';
      ctx.fillText('우회전(rightRotate) — 왼쪽으로 치우친 트리의 균형을 O(1)에 회복', W/2, H*0.085);
      // 간선 그리기 (강조 간선은 #8fe3b5 굵게)
      function isHL(a,b){ for(var i=0;i<f.hl.length;i++){ var e=f.hl[i]; if((e[0]===a&&e[1]===b)||(e[0]===b&&e[1]===a)) return true; } return false; }
      for(var ei=0;ei<f.edges.length;ei++){ var pa=PX(f.edges[ei][0]), cb=PX(f.edges[ei][1]), hl=isHL(f.edges[ei][0],f.edges[ei][1]);
        ctx.strokeStyle=hl?'#8fe3b5':'rgba(255,255,255,0.22)'; ctx.lineWidth=hl?3:2;
        ctx.beginPath(); ctx.moveTo(pa[0],pa[1]); ctx.lineTo(cb[0],cb[1]); ctx.stroke(); }
      // 노드 그리기. move에 든 키 = #ffb27a 강조
      function moving(k){ return f.move.indexOf(k)>=0; }
      var order=['g','y','b','a','x'];
      for(var oi=0;oi<order.length;oi++){ var k2=order[oi]; if(VAL[k2]==null) continue; var p=PX(k2), mv=moving(k2);
        AV.node(V,p[0],p[1],VAL[k2],{ r:r,
          fill: mv?'rgba(255,178,122,0.28)':'rgba(122,184,255,0.16)',
          stroke: mv?'#ffb27a':'#7ab8ff',
          text: mv?'#fff':'#dfeefb', fs:15,
          tag: LBL[k2] });
        // β·T2 라벨 보조 표기(기억해 둔 가지 표시)
        if(k2==='b' && (f.line===2)){ ctx.fillStyle='#ffb27a'; ctx.font='600 11px sans-serif'; ctx.textAlign='center'; ctx.fillText('= T2 (기억)', p[0], p[1]+r+16); }
      }
      // 단계 노트 배지
      if(f.note){ ctx.textAlign='center'; ctx.fillStyle=(f.line>=5)?'#8fe3b5':'#ffb27a'; ctx.font='600 13px sans-serif';
        ctx.fillText('● '+f.note, W/2, H*0.93); }
      // 순서 보존 띠
      ctx.fillStyle='#6f6e7a'; ctx.font='12px sans-serif'; ctx.textAlign='center';
      ctx.fillText('중위(정렬) 순서  α(5) < x(10) < β(15) < y(20) < γ(30)  — 회전해도 불변', W/2, H*0.985); }
  },

  // ══════ BST(algo5_03) ▸ BST 삽입 (코드+스텝) ══════
  { id:'algo_br_bstins', branchOf:'algo5_03',
    code:[
      'TREE-INSERT(T, z) {           // z = 새 키',
      '  x = T.root;  parent = NIL',
      '  while (x != NIL) {          // 내려갈 자리 찾기',
      '    parent = x',
      '    if (z < x.key) x = x.left',
      '    else           x = x.right',
      '  }',
      '  z를 parent의 알맞은 자식으로 연결',
      '}'
    ],
    build:function(V){ var T=[8,3,10,1,6,null,14], z=5, i=0, path=[], st=[];
      function snap(line,cap,cur,extra){ var f={line:line,cap:cap,T:T.slice(),cur:cur,path:path.slice()}; if(extra)for(var k in extra)f[k]=extra[k]; st.push(f); }
      snap(1,'BST에 <b>5</b> 삽입 — 루트 8부터 내려갈 빈 자리를 찾습니다.',0);
      while(true){ path.push(i);
        snap(4,'노드 '+T[i]+' 와 5 비교 — '+(z<T[i]?'5 < '+T[i]+' → 왼쪽':'5 > '+T[i]+' → 오른쪽'),i);
        var nx = z<T[i] ? 2*i+1 : 2*i+2;
        if(nx>=T.length || T[nx]==null){ while(T.length<=nx) T.push(null); T[nx]=z; snap(7,'빈 자리 발견 → <b>5</b>를 '+T[i]+'의 '+(z<T[i]?'왼쪽':'오른쪽')+' 자식으로 삽입!',nx,{T:T.slice(),ins:nx}); break; }
        i=nx;
      }
      return st; },
    draw:function(V,f){ drawTreeB(V, f.T, function(j){ if(j===f.ins) return {fill:'rgba(143,227,181,0.35)',stroke:'#8fe3b5',text:'#8fe3b5',tag:'삽입!'}; if(j===f.cur) return {fill:'rgba(255,178,122,0.32)',stroke:'#ffb27a',text:'#ffb27a'}; if(f.path.indexOf(j)>=0) return {fill:'rgba(255,178,122,0.16)',stroke:'#ffb27a',text:'#ffb27a'}; return null; }, {lg:V.H*0.15,r:19}); }
  },

  // ══════ BST(algo5_03) ▸ BST 삭제 (concept) ══════
  { id:'algo_br_bstdel', concept:true, branchOf:'algo5_03',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, T=[8,3,10,1,6,null,14];
      drawTreeB(E, T, function(j){ if(j===0) return {fill:'rgba(244,160,192,0.3)',stroke:'#f4a0c0',text:'#f4a0c0',tag:'삭제'}; if(j===2) return {fill:'rgba(143,227,181,0.3)',stroke:'#8fe3b5',text:'#8fe3b5',tag:'후속자'}; return null; }, {lg:E.H*0.16,r:20});
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('자식 둘인 8 삭제 → 오른쪽 서브트리 최솟값(후속자 10)으로 교체', E.W/2, E.H*0.84); }
  },

  // ══════ DP(algo7_03) ▸ 최대 부분 배열 (카데인, 코드+스텝) ══════
  { id:'algo_br_kadane', branchOf:'algo7_03',
    code:[
      'MAX-SUBARRAY(A) {                // 카데인',
      '  best = cur = A[0]',
      '  for i = 1 to n-1:',
      '    cur = max(A[i], cur + A[i])  // 잇기 vs 새로 시작',
      '    best = max(best, cur)',
      '  return best',
      '}'
    ],
    build:function(V){ var A=[-2,1,-3,4,-1,2,1,-5,4], n=A.length, cur=A[0], best=A[0], st=[];
      function snap(line,cap,i,extra){ var f={line:line,cap:cap,A:A,cur:cur,best:best,i:i==null?-1:i}; if(extra)for(var k in extra)f[k]=extra[k]; st.push(f); }
      snap(1,'시작: cur = best = A[0] = '+A[0],0);
      for(var i=1;i<n;i++){ var ext=cur+A[i], rs=A[i]>ext; cur=rs?A[i]:ext;
        snap(3, rs?('A['+i+']='+A[i]+' 가 잇기('+ext+')보다 큼 → 새로 시작. cur='+cur):('이어붙임: cur+'+A[i]+' = '+cur), i);
        if(cur>best){ best=cur; snap(4,'최대 갱신! best = <b>'+best+'</b>',i); }
      }
      snap(5,'<b>완료!</b> 최대 연속 부분합 = <b>'+best+'</b> (4,−1,2,1). 한 번 훑어 O(n)!',-1,{done:true});
      return st; },
    draw:function(V,f){ var ctx=V.ctx;
      var info=AV.arr(V, f.A, { y:V.H*0.36, bw:46, gap:7, idx:true, hl:function(k){ if(k===f.i)return {fill:'rgba(255,178,122,0.3)',stroke:'#ffb27a',text:'#ffb27a',tag:'i'}; return null; } });
      ctx.font='600 17px sans-serif'; ctx.textAlign='center';
      ctx.fillStyle='#ffb27a'; ctx.fillText('cur = '+f.cur, V.W*0.4, info.y+info.bw+42);
      ctx.fillStyle='#8fe3b5'; ctx.fillText('best = '+f.best, V.W*0.6, info.y+info.bw+42); }
  },

  // ══════ DP(algo7_03) ▸ 동전 교환 (최소 동전, 코드+스텝) ══════
  { id:'algo_br_coinchange', branchOf:'algo7_03',
    code:[
      'COIN-CHANGE(coins, amount) {        // 최소 동전 수',
      '  dp[0]=0;  dp[1..amount]=∞',
      '  for a = 1 to amount:',
      '    for each c in coins:',
      '      if (c <= a)',
      '        dp[a] = min(dp[a], dp[a-c]+1)',
      '  return dp[amount]',
      '}'
    ],
    build:function(V){ var coins=[1,3,4], amount=6, INF=99, dp=[0], st=[];
      for(var a=1;a<=amount;a++) dp[a]=INF;
      function L(x){ return x>=INF?'∞':x; }
      function snap(line,cap,a2,extra){ var f={line:line,cap:cap,dp:dp.slice(),a:a2==null?-1:a2,INF:INF}; if(extra)for(var k in extra)f[k]=extra[k]; st.push(f); }
      snap(1,'dp[0]=0, 나머지 ∞. dp[a] = a원을 만드는 최소 동전 수.',-1);
      for(a=1;a<=amount;a++){
        for(var ci=0;ci<coins.length;ci++){ var c=coins[ci]; if(c>a) continue;
          snap(5,'dp['+a+'] : 동전 '+c+' 사용 → dp['+(a-c)+']('+L(dp[a-c])+')+1 vs 현재 '+L(dp[a]),a);
          if(dp[a-c]+1<dp[a]) dp[a]=dp[a-c]+1;
        }
        snap(5,'dp['+a+'] = <b>'+L(dp[a])+'</b> 확정.',a);
      }
      snap(6,'<b>완료!</b> 6원 최소 = <b>'+dp[amount]+'개</b> (3+3). ★그리디(4+1+1=3개)는 틀림 → DP가 정답!',-1,{done:true});
      return st; },
    draw:function(V,f){ var ctx=V.ctx;
      var labels=f.dp.map(function(x){return x>=f.INF?'∞':x;});
      var info=AV.arr(V, labels, { y:V.H*0.4, bw:50, gap:8, idx:true, hl:function(k){ if(k===f.a)return {fill:'rgba(255,178,122,0.3)',stroke:'#ffb27a',text:'#ffb27a',tag:'a'}; return null; } });
      ctx.fillStyle='#6f6e7a'; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('dp[a] = a원을 만드는 최소 동전 수 (동전 1,3,4)', V.W/2, info.y+info.bw+34); }
  },

  // ══════ 힙(algo5_04) ▸ 힙 삽입 sift-up (코드+스텝) ══════
  { id:'algo_br_heapins', branchOf:'algo5_04',
    code:[
      'MAX-HEAP-INSERT(H, key) {',
      '  H.append(key)               // 맨 끝에 추가',
      '  i = size - 1',
      '  while (i>0 && H[parent(i)] < H[i]) {',
      '    swap(H[i], H[parent(i)])   // 부모와 교환',
      '    i = parent(i)              // 위로 올라감',
      '  }',
      '}'
    ],
    build:function(V){ var H=[42,28,35,12,18,9,30], key=40, st=[];
      function par(i){ return (i-1)>>1; }
      function snap(line,cap,cur,extra){ var f={line:line,cap:cap,H:H.slice(),cur:cur==null?-1:cur}; if(extra)for(var k in extra)f[k]=extra[k]; st.push(f); }
      H.push(key); var i=H.length-1;
      snap(1,'새 키 <b>'+key+'</b> 를 맨 끝(인덱스 '+i+')에 추가.',i);
      while(i>0 && H[par(i)]<H[i]){
        snap(3,'부모 H['+par(i)+']='+H[par(i)]+' < '+H[i]+' → 힙 위반, 교환.',i,{parent:par(i)});
        var t=H[i]; H[i]=H[par(i)]; H[par(i)]=t; i=par(i);
        snap(5,'위로 올라감 → 인덱스 '+i,i);
      }
      snap(6,'<b>완료!</b> 부모 ≥ 자식 복구. 트리 높이만큼 = O(log n).',i,{done:true});
      return st; },
    draw:function(V,f){ drawTreeB(V, f.H, function(j){ if(j===f.cur)return {fill:'rgba(255,178,122,0.32)',stroke:'#ffb27a',text:'#ffb27a',tag:'올라가는 중'}; if(j===f.parent)return {fill:'rgba(244,160,192,0.25)',stroke:'#f4a0c0',text:'#f4a0c0',tag:'부모'}; if(j===0)return {fill:'rgba(143,227,181,0.2)',stroke:'#8fe3b5',text:'#8fe3b5'}; return null; }, {lg:V.H*0.16,r:19}); }
  },

  // ══════ P vs NP(algo8_04) ▸ 환원(reduction) (concept) ══════
  { id:'algo_br_reduction', branchOf:'algo8_04',
    code:[
      '환원: 3-SAT  ≤ₚ  독립집합',
      '입력 φ = (x∨y∨¬z) ∧ (¬x∨¬y∨z)',
      'for 각 절: 리터럴 3개를 삼각형으로',
      'for 모순쌍(ℓ, ¬ℓ): 간선으로 연결',
      'k ← 절의 개수 (=2)',
      '// φ 충족  ⇔  크기 k 독립집합 존재',
      '독립집합: 절마다 참 리터럴 하나씩 선택',
      '(서로 인접 안 함 = 모순 없는 일관 배정)'
    ],
    build:function(V){
      // 6 노드: 절1 삼각형(x,y,~z), 절2 삼각형(~x,~y,z)
      var nodes=[
        {lab:'x', cl:0, x:0.20,y:0.30},
        {lab:'y', cl:0, x:0.34,y:0.62},
        {lab:'¬z',cl:0, x:0.10,y:0.62},
        {lab:'¬x',cl:1, x:0.80,y:0.30},
        {lab:'¬y',cl:1, x:0.90,y:0.62},
        {lab:'z', cl:1, x:0.66,y:0.62}
      ];
      // 삼각형 간선 (절 내부)
      var triEdges=[ [0,1],[1,2],[2,0],  [3,4],[4,5],[5,3] ];
      // 모순쌍 간선 (절 사이): x↔¬x, y↔¬y, z↔¬z
      var conEdges=[ [0,3],[1,4],[2,5] ]; // x-¬x, y-¬y, ¬z-z
      var st=[];
      function snap(line,cap,o){ var fr={line:line,cap:cap,nodes:nodes,triEdges:triEdges,conEdges:conEdges};
        for(var k in o) fr[k]=o[k]; st.push(fr); }
      snap([0,1],'<b>환원</b>: 3-SAT를 독립집합 문제로 변환합니다. φ = (x∨y∨¬z) ∧ (¬x∨¬y∨z). 절 2개 → 가젯 그래프를 만듭니다.',
        {triShown:0,conShown:0,indep:[],phase:'init'});
      snap([2],'절1 (x∨y∨¬z): 세 리터럴을 <b>삼각형</b>으로 묶습니다. 삼각형 안에서는 하나만 독립집합에 들어갈 수 있습니다(= 절을 참으로 만드는 한 리터럴).',
        {triShown:1,conShown:0,indep:[],phase:'tri'});
      snap([2],'절2 (¬x∨¬y∨z): 같은 방식으로 또 하나의 삼각형. 이제 노드 6개·삼각형 2개.',
        {triShown:2,conShown:0,indep:[],phase:'tri'});
      snap([3],'<b>모순쌍 연결</b>: x↔¬x, y↔¬y, z↔¬z 를 간선으로 잇습니다. 모순되는 두 리터럴은 동시에 참일 수 없으므로 둘 다 독립집합에 못 들어갑니다.',
        {triShown:2,conShown:3,indep:[],phase:'con'});
      snap([4,5],'k = 절의 개수 = <b>2</b>. 핵심 동치: <b>φ가 충족 가능 ⇔ 크기 2인 독립집합이 존재</b>. 어려움이 그대로 옮겨졌습니다.',
        {triShown:2,conShown:3,indep:[],phase:'claim'});
      // 충족 배정 x=T,y=T,z=T → 절1 참 리터럴 x(0), 절2 참 리터럴 z(5)
      snap([6],'배정 x=참, y=참, z=참. 절1의 참 리터럴 <b>x</b>를 독립집합에 넣습니다 (삼각형에서 하나).',
        {triShown:2,conShown:3,indep:[0],phase:'pick'});
      snap([6,7],'절2의 참 리터럴 <b>z</b>를 넣습니다. x와 z는 모순쌍이 아니라 <b>간선이 없으므로</b> 서로 인접하지 않습니다 — 일관된 배정.',
        {triShown:2,conShown:3,indep:[0,5],phase:'pick'});
      snap([7],'<b>완성!</b> 독립집합 {x, z} (크기 2). 어떤 두 선택도 인접하지 않습니다(모순 없음). 따라서 φ 충족 ⇔ 독립집합 존재 — <b>독립집합도 NP-하드</b>임이 증명됩니다.',
        {triShown:2,conShown:3,indep:[0,5],phase:'done'});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H;
      var x0=W*0.06,x1=W*0.94,y0=H*0.20,y1=H*0.82;
      function PX(n){ return x0+(x1-x0)*n.x; }
      function PY(n){ return y0+(y1-y0)*n.y; }
      ctx.textAlign='center'; ctx.textBaseline='alphabetic'; ctx.fillStyle='#cfd8e6'; ctx.font='600 14px sans-serif';
      ctx.fillText('각 절 = 삼각형, 모순 리터럴은 간선 — 충족 배정 ⇔ 절마다 하나씩 고른 독립집합', W/2, H*0.10);
      var N=f.nodes;
      // 삼각형 간선
      for(var i=0;i<f.triEdges.length;i++){
        var e=f.triEdges[i]; var cl=N[e[0]].cl;
        var show=(cl===0 && f.triShown>=1)||(cl===1 && f.triShown>=2);
        if(!show) continue;
        ctx.strokeStyle='#5a6b82'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(PX(N[e[0]]),PY(N[e[0]])); ctx.lineTo(PX(N[e[1]]),PY(N[e[1]])); ctx.stroke();
      }
      // 모순쌍 간선 (점선 분홍)
      for(i=0;i<f.conEdges.length;i++){
        if(f.conShown<f.conEdges.length && i>=f.conShown) continue;
        if(f.conShown===0) continue;
        var ce=f.conEdges[i];
        ctx.strokeStyle='rgba(244,160,192,0.55)'; ctx.lineWidth=1.8; ctx.setLineDash([6,5]);
        ctx.beginPath(); ctx.moveTo(PX(N[ce[0]]),PY(N[ce[0]])); ctx.lineTo(PX(N[ce[1]]),PY(N[ce[1]])); ctx.stroke();
        ctx.setLineDash([]);
      }
      // 노드
      for(i=0;i<N.length;i++){
        var n=N[i], px=PX(n),py=PY(n);
        var inIndep=(f.indep.indexOf(i)>=0);
        var col=inIndep?'#8fe3b5':'#7ab8ff';
        var fc=inIndep?'rgba(143,227,181,0.28)':'rgba(122,184,255,0.12)';
        ctx.fillStyle=fc; ctx.strokeStyle=col; ctx.lineWidth=inIndep?3:2.2;
        ctx.beginPath(); ctx.arc(px,py,20,0,7); ctx.fill(); ctx.stroke();
        ctx.fillStyle=col; ctx.font='600 16px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(n.lab,px,py); ctx.textBaseline='alphabetic';
      }
      // 절 라벨
      ctx.fillStyle='#7f8a9b'; ctx.font='12px sans-serif'; ctx.textAlign='center';
      if(f.triShown>=1) ctx.fillText('절1: (x ∨ y ∨ ¬z)', PX({x:0.20,y:0}), y0-2);
      if(f.triShown>=2) ctx.fillText('절2: (¬x ∨ ¬y ∨ z)', PX({x:0.80,y:0}), y0-2);
      // 범례 / 결과
      ctx.textAlign='center';
      if(f.conShown>0){ ctx.fillStyle='#f4a0c0'; ctx.font='11px sans-serif';
        ctx.fillText('분홍 점선 = 모순쌍(동시에 못 고름)', W/2, H*0.90); }
      if(f.phase==='done'){
        ctx.fillStyle='#8fe3b5'; ctx.font='600 16px sans-serif';
        ctx.fillText('▶ 독립집합 {x, z} 크기 2  =  φ 충족 가능  →  독립집합도 NP-하드', W/2, H*0.96);
      }
    }
  },

  // ══════ O(log n)(algo1_04) ▸ 빠른 거듭제곱 (코드+스텝) ══════
  { id:'algo_br_fastpow', branchOf:'algo1_04',
    code:[
      'POWER(a, n) {                  // a^n in O(log n)',
      '  result = 1',
      '  while (n > 0) {',
      '    if (n is odd) result *= a   // 비트가 1이면 곱',
      '    a *= a                      // 밑을 제곱',
      '    n = n >> 1                  // 지수 비트 한 칸',
      '  }',
      '  return result',
      '}'
    ],
    build:function(V){ var a0=3,n0=13, a=a0,n=n0,result=1, st=[];
      function snap(line,cap,extra){ var f={line:line,cap:cap,a:a,n:n,result:result,a0:a0,n0:n0}; if(extra)for(var k in extra)f[k]=extra[k]; st.push(f); }
      snap(1,'3^13 계산 시작. result = 1.');
      while(n>0){
        if(n&1){ result*=a; snap(3,'n='+n+' 홀수(비트 1) → result ×= a = '+result); }
        else snap(3,'n='+n+' 짝수(비트 0) → 곱셈 건너뜀.');
        a*=a; n=n>>1;
        if(n>0) snap(5,'밑을 제곱(a='+a+'), 지수 절반(n='+n+').');
      }
      snap(7,'<b>완료!</b> 3^13 = <b>'+result+'</b>. 곱셈 ~log₂13 ≈ 4번뿐 = O(log n)!',{done:true});
      return st; },
    draw:function(V,f){ var ctx=V.ctx, cx=V.W/2; ctx.textAlign='center';
      ctx.fillStyle='#ffb27a'; ctx.font='600 26px sans-serif'; ctx.fillText('result = '+f.result, cx, V.H*0.34);
      ctx.fillStyle='#7ab8ff'; ctx.font='600 19px sans-serif'; ctx.fillText('현재 밑 a = '+f.a, cx, V.H*0.46);
      ctx.fillStyle='#8fe3b5'; ctx.fillText('남은 지수 n = '+f.n+'  (이진수 '+f.n.toString(2)+')', cx, V.H*0.56);
      ctx.fillStyle='#6f6e7a'; ctx.font='13px sans-serif'; ctx.fillText('지수를 이진수로 보고, 비트마다 제곱 + (비트가 1이면) 곱셈', cx, V.H*0.66); }
  },

  // ══════ 탐색(algo4_01) ▸ 투 포인터 (코드+스텝) ══════
  { id:'algo_br_twoptr', branchOf:'algo4_01',
    code:[
      'TWO-SUM-SORTED(A, target) {    // A는 정렬됨',
      '  lo = 0;  hi = n-1',
      '  while (lo < hi) {',
      '    s = A[lo] + A[hi]',
      '    if (s == target) return (lo, hi)',
      '    else if (s < target) lo++   // 합이 작으면 왼쪽↑',
      '    else hi--                    // 합이 크면 오른쪽↓',
      '  }',
      '}'
    ],
    build:function(V){ var A=[1,3,4,6,8,11], target=10, lo=0, hi=A.length-1, st=[];
      function snap(line,cap,extra){ var f={line:line,cap:cap,A:A,lo:lo,hi:hi,target:target}; if(extra)for(var k in extra)f[k]=extra[k]; st.push(f); }
      snap(1,'정렬된 배열에서 합이 '+target+'인 두 수 찾기. lo=양끝.');
      while(lo<hi){ var s=A[lo]+A[hi];
        snap(3,'A['+lo+']='+A[lo]+' + A['+hi+']='+A[hi]+' = <b>'+s+'</b>');
        if(s===target){ snap(4,'합 '+target+' 일치! 두 수 = '+A[lo]+', '+A[hi],{found:[lo,hi]}); return st; }
        else if(s<target){ snap(5,s+' < '+target+' → 합을 키우려 lo 오른쪽으로.'); lo++; }
        else { snap(6,s+' > '+target+' → 합을 줄이려 hi 왼쪽으로.'); hi--; }
      }
      snap(7,'없음.',{done:true}); return st; },
    draw:function(V,f){ var ctx=V.ctx;
      var info=AV.arr(V, f.A, { y:V.H*0.4, bw:56, gap:10, idx:true, hl:function(k){
        if(f.found&&(k===f.found[0]||k===f.found[1]))return {fill:'rgba(143,227,181,0.35)',stroke:'#8fe3b5',text:'#8fe3b5',tag:'합 일치!'};
        if(k===f.lo)return {fill:'rgba(255,178,122,0.3)',stroke:'#ffb27a',text:'#ffb27a',tag:'lo'};
        if(k===f.hi)return {fill:'rgba(244,160,192,0.3)',stroke:'#f4a0c0',text:'#f4a0c0',tag:'hi'};
        if(k>f.lo&&k<f.hi)return null; return {fill:'rgba(255,255,255,0.03)',stroke:'rgba(255,255,255,0.12)',text:'#4a4955'}; } });
      ctx.fillStyle='#6f6e7a'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('두 포인터를 안쪽으로 좁혀가며 합을 맞춤 → O(n)', V.W/2, info.y+info.bw+34); }
  },

  // ══════ 분할정복(algo8_03) ▸ 백트래킹: N-퀸 (concept) ══════
  { id:'algo_br_nqueens', branchOf:'algo8_03',
    code:[
      'solve(row):                       // N=4',
      '  if row == N: 해 발견! count++',
      '  for col in 0..N-1:',
      '    if 충돌 없음(열·대각선):',
      '      place(row,col)              // 놓고',
      '      solve(row+1)                // 다음 행 재귀',
      '      remove(row,col)             // 되돌리기(backtrack)'
    ],
    build:function(V){ var N=4, st=[];
      var qs=[];                         // qs[r] = 놓인 열 (or -1)
      for(var i=0;i<N;i++) qs[i]=-1;
      function attacked(row,col){        // 이미 놓인 퀸과 충돌?
        for(var r=0;r<row;r++){ var c=qs[r];
          if(c===col) return true;
          if(Math.abs(c-col)===Math.abs(r-row)) return true; }
        return false; }
      function snap(line,cap,o){ o=o||{};
        st.push({line:line,cap:cap,N:N,qs:qs.slice(),
          row:(o.row==null?-1:o.row), col:(o.col==null?-1:o.col),
          mode:o.mode||'try', count:o.count||0}); }
      var count=0, done=false;
      snap(0,'<b>4-퀸</b>: 4×4 판에 퀸 4개를 같은 행·열·대각선이 안 겹치게 놓습니다. 한 행에 하나씩 놓으며 시도합니다.',{row:0});
      function solve(row){
        if(done) return;
        if(row===N){ count++; done=true;
          snap(1,'<b>네 행 모두 배치 성공 — 해 발견!</b> 어떤 두 퀸도 같은 열·대각선에 없습니다.',{mode:'solved',count:count});
          return; }
        for(var col=0; col<N; col++){
          if(done) return;
          if(attacked(row,col)){
            snap(3,'행 '+row+', 열 '+col+': 이미 놓인 퀸과 <b>충돌</b> → 이 칸은 건너뜁니다.',{row:row,col:col,mode:'conflict',count:count});
            continue; }
          snap(3,'행 '+row+', 열 '+col+': 충돌 없음 → 여기에 퀸을 <b>놓아 봅니다</b>.',{row:row,col:col,mode:'place',count:count});
          qs[row]=col;
          snap([4,5],'(행 '+row+', 열 '+col+')에 퀸을 놓고 <b>다음 행 '+(row+1)+'</b>로 재귀합니다.',{row:row,col:col,mode:'placed',count:count});
          solve(row+1);
          if(done) return;
          qs[row]=-1;
          snap(6,'행 '+(row+1)+'에서 놓을 곳이 없었습니다 → (행 '+row+', 열 '+col+') 퀸을 <b>치우고 되돌아가</b> 다음 열을 시도합니다.',{row:row,col:col,mode:'backtrack',count:count});
        }
      }
      solve(0);
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H,N=f.N;
      var sz=Math.min(W*0.62,H*0.62), cs=sz/N, x0=W/2-sz/2, y0=H*0.16;
      // 충돌 집합 계산 (현재 행 아래로 공격받는 칸)
      function attackedBy(row,col,r,c){ if(c===col) return true; if(Math.abs(c-col)===Math.abs(r-row)) return true; return false; }
      // 보드
      ctx.textAlign='center'; ctx.textBaseline='middle';
      for(var r=0;r<N;r++) for(var c=0;c<N;c++){
        var px=x0+c*cs, py=y0+r*cs;
        var light=((r+c)%2===0);
        ctx.fillStyle=light?'rgba(122,184,255,0.10)':'rgba(122,184,255,0.04)';
        ctx.fillRect(px,py,cs,cs);
        ctx.strokeStyle='rgba(255,255,255,0.10)'; ctx.lineWidth=1; ctx.strokeRect(px,py,cs,cs);
      }
      // 공격 칸 표시 (놓인 퀸들 기준)
      for(r=0;r<N;r++){ var qc=f.qs[r]; if(qc<0) continue;
        for(var rr=0;rr<N;rr++) for(var cc=0;cc<N;cc++){
          if(rr===r&&cc===qc) continue;
          if(attackedBy(r,qc,rr,cc)){
            var ax=x0+cc*cs, ay=y0+rr*cs;
            ctx.fillStyle='rgba(244,160,192,0.10)'; ctx.fillRect(ax,ay,cs,cs);
          } } }
      // 현재 시도 칸 강조
      if(f.row>=0 && f.col>=0){
        var hx=x0+f.col*cs, hy=y0+f.row*cs;
        var col=(f.mode==='conflict')?'#f4a0c0':(f.mode==='backtrack')?'#f4a0c0':'#ffb27a';
        var fill=(f.mode==='conflict'||f.mode==='backtrack')?'rgba(244,160,192,0.25)':'rgba(255,178,122,0.25)';
        ctx.fillStyle=fill; ctx.fillRect(hx,hy,cs,cs);
        ctx.strokeStyle=col; ctx.lineWidth=3; ctx.strokeRect(hx+1.5,hy+1.5,cs-3,cs-3);
        if(f.mode==='conflict'){ ctx.strokeStyle='#f4a0c0'; ctx.lineWidth=3;
          ctx.beginPath(); ctx.moveTo(hx+cs*0.28,hy+cs*0.28); ctx.lineTo(hx+cs*0.72,hy+cs*0.72);
          ctx.moveTo(hx+cs*0.72,hy+cs*0.28); ctx.lineTo(hx+cs*0.28,hy+cs*0.72); ctx.stroke(); }
      }
      // 퀸들
      for(r=0;r<N;r++){ var c2=f.qs[r]; if(c2<0) continue;
        var qx=x0+c2*cs+cs/2, qy=y0+r*cs+cs/2;
        var isCur=(r===f.row && c2===f.col);
        var solved=(f.mode==='solved');
        var qcol=solved?'#8fe3b5':isCur&&f.mode==='backtrack'?'#f4a0c0':isCur?'#ffb27a':'#8fe3b5';
        ctx.fillStyle=qcol; ctx.font='600 '+Math.floor(cs*0.5)+'px serif';
        ctx.fillText('♛',qx,qy+1);
      }
      // 헤더 라벨
      ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
      ctx.fillText('행 0 → 위, 열 0 → 왼쪽',x0,y0-10);
      // 상태 배지
      var badge=(f.mode==='solved')?'해 발견':(f.mode==='conflict')?'충돌 — 건너뜀':(f.mode==='backtrack')?'되돌아가기':(f.mode==='placed'||f.mode==='place')?'퀸 배치':'시도';
      var bcol=(f.mode==='solved')?'#8fe3b5':(f.mode==='conflict'||f.mode==='backtrack')?'#f4a0c0':'#ffb27a';
      ctx.textAlign='center'; ctx.fillStyle=bcol; ctx.font='600 14px sans-serif';
      ctx.fillText('▶ '+badge, W/2, y0+sz+28);
      // 분홍 = 공격받는 칸 범례
      ctx.fillStyle='#9b99a3'; ctx.font='11px sans-serif';
      ctx.fillText('분홍 칸 = 놓인 퀸이 공격하는 위치(놓으면 충돌)', W/2, y0+sz+48); }
  },

  // ══════ 힙(algo5_04) ▸ 세그먼트 트리 (concept) ══════
  { id:'algo_br_segtree', branchOf:'algo5_04',
    code:[
      'build(node, l, r):            // 구간 [l,r] 합',
      '  if l == r: tree[node] = A[l]   // 리프',
      '  else:',
      '    m = (l+r)/2',
      '    build(left, l, m)',
      '    build(right, m+1, r)',
      '    tree[node] = left + right   // 자식 합',
      'query(node, l, r, ql, qr):',
      '  if [l,r] ⊆ [ql,qr]: return tree[node]  // 완전포함',
      '  if [l,r] ∩ [ql,qr] = ∅: return 0       // 벗어남',
      '  return query(left)+query(right)        // 겹침'
    ],
    build:function(V){
      var A=[5,8,6,3,2,7,9,1];   // 길이 8 배열
      // 노드: 1-기반 인덱스. node i: 자식 2i, 2i+1. 7개 내부 + 8 리프 = 15노드(완전이진).
      // 각 노드의 [lo,hi] 구간과 sum을 실제 계산.
      var node=[]; // node[i]={lo,hi,sum,x,depth}
      function place(i,lo,hi,depth,x0,x1){
        node[i]={lo:lo,hi:hi,depth:depth,x:(x0+x1)/2,sum:0};
        if(lo===hi){ node[i].sum=A[lo]; return A[lo]; }
        var m=(lo+hi)>>1, xm=(x0+x1)/2;
        var ls=place(2*i,lo,m,depth+1,x0,xm);
        var rs=place(2*i+1,m+1,hi,depth+1,xm,x1);
        node[i].sum=ls+rs; return node[i].sum;
      }
      place(1,0,7,0,0,1);
      var st=[];
      function rngLab(i){ return '['+node[i].lo+','+node[i].hi+']'; }
      function snap(line,cap,extra){ var f={line:line,cap:cap,A:A,node:node}; if(extra)for(var k in extra)f[k]=extra[k]; st.push(f); }
      // ---- BUILD 단계 ----
      snap([0,1],'길이 8 배열 <b>A=[5,8,6,3,2,7,9,1]</b>를 세그먼트 트리로 만듭니다. 리프 8개에 원소를 그대로 넣습니다.', {reveal:'leaves'});
      snap(6,'<b>상향 합치기</b>: 리프 쌍을 더해 부모를 채웁니다. [0,1]=5+8=<b>13</b>, [2,3]=6+3=<b>9</b>, [4,5]=2+7=<b>9</b>, [6,7]=9+1=<b>10</b>.', {reveal:'lvl2'});
      snap(6,'한 단계 위로: [0,3]=13+9=<b>22</b>, [4,7]=9+10=<b>19</b>. 각 노드가 자기 구간의 합을 담습니다.', {reveal:'lvl1'});
      snap(6,'루트 완성: 전체 합 [0,7]=22+19=<b>41</b>. 트리 구축 끝 — 전처리 O(n).', {reveal:'all'});
      // ---- QUERY [2,5] 단계 ----
      // 실제 재귀로 covering 노드 수집
      var QL=2, QR=5, cover=[], total=0;
      function query(i){
        var lo=node[i].lo, hi=node[i].hi;
        if(QR<lo||hi<QL) return 0;            // 벗어남
        if(QL<=lo&&hi<=QR){ cover.push(i); return node[i].sum; } // 완전포함
        return query(2*i)+query(2*i+1);
      }
      total=query(1);
      snap([7],'이제 <b>구간 합 질의 [2,5]</b>를 풉니다. 루트 [0,7]에서 시작해 아래로 내려갑니다.', {reveal:'all', path:[1], cover:[]});
      snap([10],'루트 [0,7]은 [2,5]와 <b>겹치지만 완전포함 아님</b> → 양쪽 자식으로 내려갑니다.', {reveal:'all', path:[1], cover:[]});
      snap([10],'노드 [0,3]도 [2,5]와 <b>겹침</b> → 자식 [0,1], [2,3]로 내려갑니다.', {reveal:'all', path:[1,2], cover:[]});
      snap([9],'[0,1]은 [2,5]와 <b>겹치지 않음</b>(벗어남) → 0 반환, 버립니다.', {reveal:'all', path:[1,2], cover:[], drop:[4]});
      snap([8],'<b>[2,3]은 [2,5]에 완전포함</b> → 저장값 <b>9</b>를 그대로 씁니다. 자식 안 봄!', {reveal:'all', path:[1,2], cover:[5]});
      snap([10],'반대쪽 노드 [4,7]도 [2,5]와 <b>겹침</b> → 자식 [4,5], [6,7]로.', {reveal:'all', path:[1,3], cover:[5]});
      snap([8],'<b>[4,5]는 [2,5]에 완전포함</b> → 저장값 <b>9</b> 사용.', {reveal:'all', path:[1,3], cover:[5,6]});
      snap([9],'[6,7]은 [2,5]와 <b>벗어남</b> → 0 반환, 버립니다.', {reveal:'all', path:[1,3], cover:[5,6], drop:[7]});
      snap([7,8],'<b>완료!</b> 합 [2,5] = 9([2,3]) + 9([4,5]) = <b>'+total+'</b>. 6칸을 더하지 않고 <b>커버링 노드 2개</b>만 — O(log n).', {reveal:'all', path:[], cover:[5,6], done:true});
      return st;
    },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H,N=f.node;
      var x0=W*0.10,x1=W*0.90,y0=H*0.13,lg=Math.min(H*0.155,72);
      function X(i){ return x0+(x1-x0)*N[i].x; }
      function Y(i){ return y0+N[i].depth*lg; }
      function shown(i){
        var d=N[i].depth, rv=f.reveal;
        if(rv==='all') return true;
        if(rv==='leaves') return d===3;
        if(rv==='lvl2') return d>=2;
        if(rv==='lvl1') return d>=1;
        return true;
      }
      var path=f.path||[], cover=f.cover||[], drop=f.drop||[];
      function inArr(a,i){ return a&&a.indexOf(i)>=0; }
      // edges
      ctx.lineWidth=1.6;
      for(var i=1;i<N.length;i++){ if(!N[i]||N[i].depth===0) continue; if(!shown(i)) continue;
        var par=i>>1; if(!shown(par)) continue;
        var on=(inArr(path,i)&&inArr(path,par))||(inArr(cover,i)&&inArr(path,par));
        ctx.strokeStyle=on?'rgba(255,178,122,0.55)':'rgba(255,255,255,0.18)';
        ctx.lineWidth=on?2.4:1.4;
        ctx.beginPath(); ctx.moveTo(X(par),Y(par)); ctx.lineTo(X(i),Y(i)); ctx.stroke();
      }
      // nodes
      ctx.textAlign='center'; ctx.textBaseline='middle';
      for(i=1;i<N.length;i++){ if(!N[i]||!shown(i)) continue;
        var isCover=inArr(cover,i), isPath=inArr(path,i)&&!isCover, isDrop=inArr(drop,i);
        var col=isCover?'#8fe3b5':isPath?'#ffb27a':isDrop?'#f4a0c0':'#7ab8ff';
        var fc =isCover?'rgba(143,227,181,0.24)':isPath?'rgba(255,178,122,0.22)':isDrop?'rgba(244,160,192,0.16)':'rgba(122,184,255,0.13)';
        var px=X(i),py=Y(i),r=N[i].depth===3?16:18;
        if(isCover){ ctx.save(); ctx.shadowColor='#8fe3b5'; ctx.shadowBlur=14; }
        ctx.fillStyle=fc; ctx.strokeStyle=col; ctx.lineWidth=2.2;
        ctx.beginPath(); ctx.arc(px,py,r,0,7); ctx.fill(); ctx.stroke();
        if(isCover) ctx.restore();
        ctx.fillStyle=col; ctx.font='600 13px sans-serif'; ctx.fillText(N[i].sum,px,py);
        ctx.fillStyle='#9b99a3'; ctx.font='10px monospace';
        ctx.fillText('['+N[i].lo+','+N[i].hi+']',px,py+r+10);
      }
      // query band marker [2,5] at bottom over leaves when querying
      if(f.path||f.cover&&f.cover.length){
        ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif'; ctx.textAlign='left';
        ctx.fillText('질의 구간 [2,5]', x0, H*0.95);
      }
      ctx.textBaseline='alphabetic'; ctx.textAlign='left';
    },
  },

  // ══════ 해시(algo2_05) ▸ 트라이(Trie) (concept) ══════
  { id:'algo_br_trie', branchOf:'algo2_05',
    code:[
      'insert(root, word):',
      '  cur = root',
      '  for c in word:',
      '    if cur.child[c] is null:',
      '      cur.child[c] = new Node   // 노드 생성',
      '    cur = cur.child[c]          // 한 칸 내려감',
      '  cur.end = true                // 단어 끝 표시',
      'search(root, word):',
      '  cur = root',
      '  for c in word:',
      '    cur = cur.child[c]',
      '    if cur is null: return false  // 경로 없음',
      '  return cur.end                  // 끝 표시면 단어'
    ],
    build:function(V){
      var WORDS=['cat','car','cup','cap'];
      // 트라이를 실제로 만든다. 노드: {id,ch,parent,depth,end,x}
      var nodes=[{id:0,ch:'',parent:-1,depth:0,end:false}]; // root
      var childMap={0:{}};
      function getChild(p,c){
        if(childMap[p][c]!=null) return childMap[p][c];
        var id=nodes.length;
        nodes.push({id:id,ch:c,parent:p,depth:nodes[p].depth+1,end:false});
        childMap[id]={};
        childMap[p][c]=id;
        return id;
      }
      var st=[];
      function snap(line,cap,extra){ var f={line:line,cap:cap}; if(extra)for(var k in extra)f[k]=extra[k]; st.push(f); }
      function snapNodes(){ return nodes.map(function(n){ return {id:n.id,ch:n.ch,parent:n.parent,depth:n.depth,end:n.end}; }); }
      snap([0,1],'빈 트라이(루트만)에 <b>cat, car, cup, cap</b> 네 단어를 한 글자씩 넣습니다.', {nodes:snapNodes(),active:[0],created:[]});
      // 단어별 삽입 — 각 글자 단계 스냅
      for(var w=0;w<WORDS.length;w++){
        var word=WORDS[w], cur=0, pathIds=[0], created=[];
        for(var ci=0;ci<word.length;ci++){
          var c=word[ci], existed=(childMap[cur][c]!=null);
          var nid=getChild(cur,c);
          cur=nid; pathIds.push(nid);
          if(!existed) created.push(nid);
          var capTxt = existed
            ? ("'"+word+"' 의 <b>'"+c+"'</b>: 자식이 이미 있어 <b>경로 공유</b> → 그대로 내려갑니다.")
            : ("'"+word+"' 의 <b>'"+c+"'</b>: 자식이 없어 <b>새 노드 생성</b> 후 내려갑니다.");
          snap(existed?[5]:[4,5], capTxt, {nodes:snapNodes(),active:pathIds.slice(),created:created.slice(),cur:nid});
        }
        nodes[cur].end=true;
        snap([6],"'"+word+"' 삽입 끝 → 마지막 노드 <b>'"+word[word.length-1]+"'</b>에 <b>단어끝</b> 표시.", {nodes:snapNodes(),active:pathIds.slice(),created:created.slice(),cur:cur,markEnd:cur});
      }
      // ---- SEARCH 'car' ----
      var sw='car', scur=0, spath=[0], ok=true;
      snap([7,8],'이제 <b>search("car")</b>: 루트에서 글자를 따라 내려갑니다.', {nodes:snapNodes(),active:[0],created:[],searchPath:[0]});
      for(var si=0;si<sw.length;si++){
        var sc=sw[si], next=childMap[scur][sc];
        scur=next; spath.push(scur);
        snap([10,11],"'"+sc+"' 자식으로 한 칸 이동 — 경로가 존재합니다.", {nodes:snapNodes(),active:spath.slice(),created:[],searchPath:spath.slice(),cur:scur});
      }
      snap([12],'마지막 노드에 <b>단어끝 표시가 있음</b> → "car" 는 사전에 <b>있습니다(true)</b>. 탐색은 길이 O(L), 사전 크기 무관!', {nodes:snapNodes(),active:spath.slice(),created:[],searchPath:spath.slice(),cur:scur,found:true});
      return st;
    },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H,N=f.nodes;
      // 레이아웃: 깊이별 y, 같은 부모 자식은 x 분산. 결정적 배치 — 리프 순서로 x 할당.
      // 각 노드 x를 in-order로 계산: 리프는 균등, 내부는 자식 평균.
      var leaves=[]; // dfs order leaf list
      var childrenOf={}; for(var i=0;i<N.length;i++) childrenOf[i]=[];
      for(i=1;i<N.length;i++) childrenOf[N[i].parent].push(i);
      // 정렬: 글자순
      for(var k in childrenOf) childrenOf[k].sort(function(a,b){ return N[a].ch<N[b].ch?-1:1; });
      var xpos={}, counter={v:0};
      (function dfs(id){ var ch=childrenOf[id];
        if(ch.length===0){ xpos[id]=counter.v++; return; }
        var sum=0; for(var j=0;j<ch.length;j++){ dfs(ch[j]); sum+=xpos[ch[j]]; }
        xpos[id]=sum/ch.length;
      })(0);
      var maxLeaf=Math.max(1,counter.v-1);
      var x0=W*0.12,x1=W*0.88,y0=H*0.14,lg=Math.min(H*0.18,80);
      function X(id){ return x0+(x1-x0)*(maxLeaf?xpos[id]/maxLeaf:0.5); }
      function Y(id){ return y0+N[id].depth*lg; }
      var active=f.active||[], created=f.created||[], spath=f.searchPath||[];
      function inA(a,i){ return a&&a.indexOf(i)>=0; }
      // edges
      ctx.lineWidth=1.6; ctx.textAlign='center'; ctx.textBaseline='middle';
      for(i=1;i<N.length;i++){ var par=N[i].parent;
        var onPath=(spath.length? (inA(spath,i)&&inA(spath,par)) : (inA(active,i)&&inA(active,par)));
        ctx.strokeStyle=onPath?'rgba(255,178,122,0.6)':'rgba(255,255,255,0.2)';
        ctx.lineWidth=onPath?2.6:1.5;
        ctx.beginPath(); ctx.moveTo(X(par),Y(par)); ctx.lineTo(X(i),Y(i)); ctx.stroke();
      }
      // nodes
      for(i=0;i<N.length;i++){ var n=N[i], px=X(i),py=Y(i);
        var isRoot=(i===0);
        var isCur=(f.cur===i);
        var isNew=inA(created,i)&&f.cur===i;
        var onSearch=inA(spath,i);
        var col, fc;
        if(isRoot){ col='#9b99a3'; fc='rgba(155,153,163,0.12)'; }
        else if(isCur){ col='#ffb27a'; fc='rgba(255,178,122,0.26)'; }
        else if(onSearch){ col='#ffb27a'; fc='rgba(255,178,122,0.18)'; }
        else if(n.end){ col='#8fe3b5'; fc='rgba(143,227,181,0.22)'; }
        else { col='#7ab8ff'; fc='rgba(122,184,255,0.14)'; }
        var r=17;
        if(isCur){ ctx.save(); ctx.shadowColor=col; ctx.shadowBlur=14; }
        ctx.fillStyle=fc; ctx.strokeStyle=col; ctx.lineWidth=2.2;
        ctx.beginPath(); ctx.arc(px,py,r,0,7); ctx.fill(); ctx.stroke();
        if(isCur) ctx.restore();
        ctx.fillStyle=isRoot?'#9b99a3':col; ctx.font='600 14px sans-serif';
        ctx.fillText(isRoot?'•':n.ch, px,py);
        if(n.end){ ctx.fillStyle='#8fe3b5'; ctx.font='9px sans-serif'; ctx.fillText('끝',px,py-r-7); }
      }
      // search result badge
      if(f.found){ ctx.fillStyle='#8fe3b5'; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('search("car") = true ✓', x0, H*0.95); }
      ctx.textBaseline='alphabetic'; ctx.textAlign='left';
    },
  },

  // ══════ 선형탐색(algo4_01) ▸ 슬라이딩 윈도우 (코드+스텝) ══════
  { id:'algo_br_window', branchOf:'algo4_01',
    code:[
      'WINDOW-MAX-SUM(A, k) {        // 크기 k 창 최대합',
      '  sum = (앞 k칸의 합)',
      '  best = sum',
      '  for i = k to n-1:',
      '    sum += A[i] - A[i-k]      // 한 칸 밀기',
      '    best = max(best, sum)',
      '  return best',
      '}'
    ],
    build:function(V){ var A=[2,1,5,1,3,2], k=3, n=A.length, sum=0, st=[];
      for(var i=0;i<k;i++) sum+=A[i]; var best=sum, bestL=0;
      function snap(line,cap,L,extra){ var f={line:line,cap:cap,A:A,k:k,L:L,sum:sum,best:best}; if(extra)for(var key in extra)f[key]=extra[key]; st.push(f); }
      snap(2,'처음 '+k+'칸 합 = '+sum+'. 이게 첫 윈도우.',0);
      for(i=k;i<n;i++){ sum+=A[i]-A[i-k];
        snap(4,'창을 한 칸 →: +A['+i+']('+A[i]+') −A['+(i-k)+']('+A[i-k]+') = 합 <b>'+sum+'</b>', i-k+1);
        if(sum>best){ best=sum; bestL=i-k+1; snap(5,'최대 갱신! best = <b>'+best+'</b>', i-k+1); }
      }
      snap(6,'<b>완료!</b> 크기 '+k+' 창 최대합 = <b>'+best+'</b>. 매번 재계산 없이 O(n)!',bestL,{done:true});
      return st; },
    draw:function(V,f){ var ctx=V.ctx;
      var info=AV.arr(V, f.A, { y:V.H*0.4, bw:56, gap:10, idx:true, hl:function(k){ if(k>=f.L&&k<f.L+f.k) return {fill:'rgba(255,178,122,0.28)',stroke:'#ffb27a',text:'#ffb27a'}; return null; } });
      ctx.font='600 16px sans-serif'; ctx.textAlign='center';
      ctx.fillStyle='#ffb27a'; ctx.fillText('현재 창 합 = '+f.sum, V.W*0.4, info.y+info.bw+40);
      ctx.fillStyle='#8fe3b5'; ctx.fillText('최대 = '+f.best, V.W*0.6, info.y+info.bw+40); }
  },

  // ══════ 효율성(algo1_02) ▸ 에라토스테네스의 체 (코드+스텝) ══════
  { id:'algo_br_sieve', branchOf:'algo1_02',
    code:[
      'SIEVE(N):',
      '  is_prime[2..N] ← true        // 모두 소수로 가정',
      '  for p = 2 to N:',
      '    if is_prime[p]:            // p가 살아있으면 소수',
      '      for m = p*p to N step p: // 배수를 p²부터',
      '        is_prime[m] ← false    // 합성수로 지움',
      '  return { p : is_prime[p] }   // 살아남은 수 = 소수'
    ],
    build:function(V){
      var N=30, cols=10;
      var prime=[]; for(var i=0;i<=N;i++) prime[i]=(i>=2);
      var st=[];
      function snap(line,cap,p,marks){
        st.push({line:line,cap:cap,N:N,cols:cols,prime:prime.slice(),
          p:(p==null?-1:p), marks:(marks||[]).slice()}); }
      snap([0,1],'1부터 '+N+'까지 늘어놓고 <b>2 이상은 일단 소수</b>로 가정합니다.',-1,[]);
      for(var p=2;p<=N;p++){
        if(prime[p]){
          if(p*p>N){
            snap([2,3],'p=<b>'+p+'</b> 는 살아있어 소수. 하지만 p²='+(p*p)+' &gt; '+N+' 이라 지울 배수가 없습니다(p&gt;√N).',p,[]);
            continue;
          }
          snap([2,3],'p=<b>'+p+'</b> 가 아직 안 지워짐 → <b>소수</b>! 그 배수를 p²='+(p*p)+'부터 한꺼번에 지웁니다.',p,[]);
          var mk=[];
          for(var m=p*p;m<=N;m+=p){ prime[m]=false; mk.push(m); }
          snap([4,5],'<b>'+p+'의 배수</b> '+mk.join(', ')+' 를 합성수로 지움. (p² 미만 배수는 더 작은 소수가 이미 지웠습니다.)',p,mk);
        }
      }
      var primes=[]; for(i=2;i<=N;i++) if(prime[i]) primes.push(i);
      snap([6],'<b>완료!</b> 살아남은 수가 소수: '+primes.join(', ')+'. 총 비용 <b>O(N log log N)</b>.',-1,[]);
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H;
      var cols=f.cols, rows=Math.ceil(f.N/cols);
      var cell=Math.min(46,(W*0.62)/cols), x0=W/2-cols*cell/2, y0=H*0.18;
      for(var v=1;v<=f.N;v++){
        var idx=v-1, r=Math.floor(idx/cols), c=idx%cols;
        var x=x0+c*cell, y=y0+r*cell, alive=f.prime[v];
        var isP=(v===f.p), isM=(f.marks&&f.marks.indexOf(v)>=0);
        var fill,stroke,txt;
        if(v===1){ fill='rgba(255,255,255,0.03)'; stroke='rgba(255,255,255,0.15)'; txt='#5a5f6b'; }
        else if(isP){ fill='rgba(255,178,122,0.30)'; stroke='#ffb27a'; txt='#ffb27a'; }
        else if(isM){ fill='rgba(244,160,192,0.30)'; stroke='#f4a0c0'; txt='#f4a0c0'; }
        else if(alive){ fill='rgba(143,227,181,0.26)'; stroke='#8fe3b5'; txt='#8fe3b5'; }
        else { fill='rgba(255,255,255,0.04)'; stroke='rgba(155,153,163,0.4)'; txt='#6e6c76'; }
        if(isM){ ctx.save(); ctx.shadowColor='#f4a0c0'; ctx.shadowBlur=14; }
        ctx.fillStyle=fill; ctx.strokeStyle=stroke; ctx.lineWidth=isP?2.4:1.5;
        ctx.fillRect(x,y,cell-4,cell-4); ctx.strokeRect(x,y,cell-4,cell-4);
        if(isM) ctx.restore();
        ctx.fillStyle=txt; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(v,x+(cell-4)/2,y+(cell-4)/2);
        if(!alive && v>1 && !isM){ ctx.strokeStyle='rgba(155,153,163,0.5)'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(x+4,y+4); ctx.lineTo(x+cell-8,y+cell-8); ctx.stroke(); }
        ctx.textBaseline='alphabetic';
      }
      ctx.textAlign='center'; ctx.font='12px sans-serif';
      var ly=y0+rows*cell+18;
      ctx.fillStyle='#ffb27a'; ctx.fillText('주황 = 현재 소수 p', W*0.28, ly);
      ctx.fillStyle='#f4a0c0'; ctx.fillText('분홍 = 방금 지운 배수', W*0.5, ly);
      ctx.fillStyle='#8fe3b5'; ctx.fillText('초록 = 살아남은 소수', W*0.72, ly); }
  },

  // ══════ 그래프(algo6_01) ▸ 이분 매칭 (concept) ══════
  { id:'algo_br_bipmatch', concept:true, branchOf:'algo6_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx;
      var L=[[E.W*0.34,E.H*0.30],[E.W*0.34,E.H*0.48],[E.W*0.34,E.H*0.66]], R=[[E.W*0.62,E.H*0.30],[E.W*0.62,E.H*0.48],[E.W*0.62,E.H*0.66]];
      var edges=[[0,0],[0,1],[1,0],[1,2],[2,1]], match=[[0,0],[1,2],[2,1]];
      function isM(a,b){ return match.some(function(m){return m[0]===a&&m[1]===b;}); }
      edges.forEach(function(e){ var a=L[e[0]],b=R[e[1]], m=isM(e[0],e[1]); ctx.strokeStyle=m?'#8fe3b5':'rgba(255,255,255,0.16)'; ctx.lineWidth=m?4:1.5; ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke(); });
      var ln=['A','B','C'], rn=['X','Y','Z'];
      L.forEach(function(p,i){ AV.node(E,p[0],p[1],ln[i],{r:20,stroke:'#ffb27a',fill:'rgba(255,178,122,0.18)',text:'#ffb27a'}); });
      R.forEach(function(p,i){ AV.node(E,p[0],p[1],rn[i],{r:20,stroke:'#7ab8ff',fill:'rgba(122,184,255,0.18)',text:'#bfe0ff'}); });
      ctx.fillStyle='#6f6e7a'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('지원자(주황)', E.W*0.34, E.H*0.22); ctx.fillText('직무(파랑)', E.W*0.62, E.H*0.22);
      ctx.fillStyle='#8fe3b5'; ctx.fillText('초록 = 최대 매칭 (3쌍 모두 짝지음)', E.W/2, E.H*0.82); }
  },

  // ══════ 균형(algo5_05) ▸ AVL 트리 (concept) ══════
  { id:'algo_br_avl', concept:true, branchOf:'algo5_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx;
      drawTreeB(E, [3,2,null,1], function(j){ if(j===0)return {fill:'rgba(244,160,192,0.25)',stroke:'#f4a0c0',text:'#f4a0c0',tag:'BF +2'}; return {fill:'rgba(244,160,192,0.15)',stroke:'#f4a0c0',text:'#f4a0c0'}; }, {left:E.W*0.02,right:E.W*0.46,top:E.H*0.26,lg:E.H*0.16,r:19});
      drawTreeB(E, [2,1,3], function(){ return {fill:'rgba(143,227,181,0.2)',stroke:'#8fe3b5',text:'#8fe3b5'}; }, {left:E.W*0.54,right:E.W*0.98,top:E.H*0.30,lg:E.H*0.16,r:19});
      AV.arrow(ctx, E.W*0.485, E.H*0.42, E.W*0.515, E.H*0.42, '#8fe3b5', 3);
      ctx.fillStyle='#8fe3b5'; ctx.font='600 12px sans-serif'; ctx.textAlign='center'; ctx.fillText('우회전', E.W*0.5, E.H*0.4);
      ctx.fillStyle='#f4a0c0'; ctx.font='13px sans-serif'; ctx.fillText('불균형 (높이차 2)', E.W*0.24, E.H*0.82);
      ctx.fillStyle='#8fe3b5'; ctx.fillText('회전 후 균형 (높이차 ≤1)', E.W*0.76, E.H*0.82); }
  },

  // ══════ 종합(algo8_05) ▸ k-means 클러스터링 (concept) ══════
  { id:'algo_br_kmeans', branchOf:'algo8_05',
    code:[
      'K-MEANS(data, k):',
      '  중심 c[0..k-1] ← 임의 초기화',
      '  repeat:',
      '    for 각 점 p:                    // 1) 배정',
      '      label[p] ← argmin_c dist(p, c)',
      '    for c = 0 .. k-1:               // 2) 갱신',
      '      c ← (label==c 인 점들의 평균)',
      '  until 중심이 안 움직임             // 수렴',
      '  return label, c'
    ],
    build:function(V){
      var pts=[[1,2],[1.5,1.8],[2,1],[1.2,2.5],[2.2,2.2],[0.8,1.5],
               [6,5],[6.5,5.5],[5.5,6],[7,5.2],[6.2,6.4],[5.8,4.8]];
      var cent=[[2.2,2.2],[2.0,1.0]], n=pts.length, k=2, st=[];
      function r2(v){ return Math.round(v*100)/100; }
      function CC(c){ var r=[]; for(var i=0;i<c.length;i++) r.push(c[i].slice()); return r; }
      function snap(line,cap,lab,c,o){ st.push({line:line,cap:cap,pts:pts,lab:lab?lab.slice():null,cent:CC(c),phase:(o&&o.phase)||'',cur:(o&&o.cur!=null)?o.cur:-1,moved:(o&&o.moved)||null,iter:(o&&o.iter!=null)?o.iter:0}); }
      function d2(p,c){ return (p[0]-c[0])*(p[0]-c[0])+(p[1]-c[1])*(p[1]-c[1]); }
      var lab=null;
      snap([0,1],'12개 점을 <b>k=2</b> 군집으로 묶습니다. 중심 2개를 <b>임의로</b> 잡았습니다(△).',lab,cent,{phase:'init'});
      var maxit=4, prev=null;
      for(var it=0; it<maxit; it++){
        // assign
        var nl=[];
        for(var i=0;i<n;i++){ nl[i] = d2(pts[i],cent[0])<=d2(pts[i],cent[1]) ? 0 : 1; }
        lab=nl;
        snap([3,4],'반복 '+(it+1)+' · <b>배정</b>: 각 점을 더 가까운 중심의 색으로 칠합니다.',lab,cent,{phase:'assign',iter:it+1});
        // update
        var nc=[];
        for(var c=0;c<k;c++){ var sx=0,sy=0,cnt=0; for(i=0;i<n;i++) if(lab[i]===c){sx+=pts[i][0];sy+=pts[i][1];cnt++;} nc[c]= cnt? [r2(sx/cnt),r2(sy/cnt)] : cent[c].slice(); }
        var movedArr=[[cent[0].slice(),nc[0].slice()],[cent[1].slice(),nc[1].slice()]];
        var same = (cent[0][0]===nc[0][0]&&cent[0][1]===nc[0][1]&&cent[1][0]===nc[1][0]&&cent[1][1]===nc[1][1]);
        if(same){
          snap([7],'<b>중심이 더 안 움직임 → 수렴!</b> 군집 내 분산이 최소인 안정 상태입니다.',lab,nc,{phase:'done',iter:it+1});
          break;
        }
        snap([5,6],'반복 '+(it+1)+' · <b>갱신</b>: 각 색 점들의 <b>평균</b>으로 중심을 옮깁니다(점선 화살표).',lab,cent,{phase:'update',moved:movedArr,iter:it+1});
        cent=nc;
        snap([5,6],'중심이 데이터 중앙으로 이동했습니다. 다시 배정 단계로 반복합니다.',lab,cent,{phase:'moved',iter:it+1});
      }
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H;
      ctx.textAlign='center'; ctx.fillStyle='#cfd8e6'; ctx.font='600 15px sans-serif'; ctx.textBaseline='alphabetic';
      ctx.fillText('k-평균: 배정(가장 가까운 중심) ↔ 갱신(평균으로 이동) 반복', W/2, H*0.09);
      var xmin=0,xmax=8,ymin=0,ymax=7.5;
      var px0=W*0.12,px1=W*0.90,py0=H*0.18,py1=H*0.86;
      function PX(x){ return px0+(px1-px0)*(x-xmin)/(xmax-xmin); }
      function PY(y){ return py1-(py1-py0)*(y-ymin)/(ymax-ymin); }
      // grid
      ctx.strokeStyle='rgba(255,255,255,0.07)'; ctx.lineWidth=1;
      for(var g=0;g<=8;g+=2){ ctx.beginPath(); ctx.moveTo(PX(g),py0); ctx.lineTo(PX(g),py1); ctx.stroke(); }
      for(g=0;g<=6;g+=2){ ctx.beginPath(); ctx.moveTo(px0,PY(g)); ctx.lineTo(px1,PY(g)); ctx.stroke(); }
      var COL=['#7ab8ff','#f4a0c0'], CFILL=['rgba(122,184,255,0.85)','rgba(244,160,192,0.85)'];
      // assignment connector lines (faint) when labeled
      if(f.lab){
        for(var i=0;i<f.pts.length;i++){ var p=f.pts[i], c=f.cent[f.lab[i]];
          ctx.strokeStyle=f.lab[i]===0?'rgba(122,184,255,0.18)':'rgba(244,160,192,0.18)'; ctx.lineWidth=1;
          ctx.beginPath(); ctx.moveTo(PX(p[0]),PY(p[1])); ctx.lineTo(PX(c[0]),PY(c[1])); ctx.stroke();
        }
      }
      // points
      for(i=0;i<f.pts.length;i++){ var pp=f.pts[i], lb=f.lab?f.lab[i]:-1;
        ctx.fillStyle=lb<0?'rgba(155,153,163,0.85)':CFILL[lb];
        ctx.beginPath(); ctx.arc(PX(pp[0]),PY(pp[1]),6,0,7); ctx.fill();
        ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.lineWidth=1; ctx.stroke();
      }
      // move arrows
      if(f.moved){ for(i=0;i<f.moved.length;i++){ var a=f.moved[i][0], b=f.moved[i][1];
        ctx.strokeStyle=COL[i]; ctx.lineWidth=2; ctx.setLineDash([5,4]);
        ctx.beginPath(); ctx.moveTo(PX(a[0]),PY(a[1])); ctx.lineTo(PX(b[0]),PY(b[1])); ctx.stroke(); ctx.setLineDash([]);
        // ghost target
        ctx.fillStyle='rgba(255,255,255,0.25)'; ctx.beginPath();
        ctx.moveTo(PX(b[0]),PY(b[1])-9); ctx.lineTo(PX(b[0])-8,PY(b[1])+6); ctx.lineTo(PX(b[0])+8,PY(b[1])+6); ctx.closePath(); ctx.fill();
      } }
      // centroids (triangles)
      for(i=0;i<f.cent.length;i++){ var cc=f.cent[i], cx=PX(cc[0]), cy=PY(cc[1]);
        ctx.fillStyle=CFILL[i]; ctx.strokeStyle='#fff'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(cx,cy-11); ctx.lineTo(cx-10,cy+8); ctx.lineTo(cx+10,cy+8); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle='#dfeefb'; ctx.font='600 11px monospace'; ctx.textAlign='center';
        ctx.fillText('('+cc[0]+','+cc[1]+')', cx, cy-16);
      }
      // legend
      ctx.textAlign='left'; ctx.font='12px sans-serif';
      ctx.fillStyle=COL[0]; ctx.fillText('● 군집 A', px0, py1+22);
      ctx.fillStyle=COL[1]; ctx.fillText('● 군집 B', px0+90, py1+22);
      ctx.fillStyle='#9b99a3'; ctx.fillText('△ 중심(centroid)', px0+185, py1+22);
      var badge=f.phase==='init'?'초기화':f.phase==='assign'?'배정 단계':(f.phase==='update'||f.phase==='moved')?'갱신 단계':f.phase==='done'?'수렴 완료':'';
      ctx.textAlign='center'; ctx.fillStyle=(f.phase==='done')?'#8fe3b5':'#ffb27a'; ctx.font='600 13px sans-serif';
      ctx.fillText('▶ '+badge, W/2, H*0.96); }
  },

  // ══════ 종합(algo8_05) ▸ 경사하강법 (concept) ══════
  { id:'algo_br_graddesc', branchOf:'algo8_05',
    code:[
      'GRADIENT-DESCENT(f, x0, η):',
      '  x ← x0',
      '  repeat:',
      "    g ← f'(x)              // 기울기(가장 가파른 증가)",
      '    x ← x − η · g          // 반대 방향으로 한 걸음',
      '    if |g| < ε: break      // 거의 평평하면 종료',
      '  return x                 // 최소점 근처'
    ],
    build:function(V){
      function fx(x){ return (x-3)*(x-3); }
      function gx(x){ return 2*(x-3); }
      var x=-1.5, lr=0.25, st=[], path=[];
      function r3(v){ return Math.round(v*1000)/1000; }
      function snap(line,cap,o){ st.push({line:line,cap:cap,x:r3(x),path:path.slice(),g:(o&&o.g!=null)?r3(o.g):null,done:(o&&o.done)||false,iter:(o&&o.iter!=null)?o.iter:-1}); }
      path.push(x);
      snap([0,1],'볼록함수 <b>f(x)=(x−3)²</b>의 최소점(x=3)을 찾습니다. 시작 x₀ = <b>−1.5</b>, 학습률 η=0.25.',{iter:0});
      for(var it=0; it<7; it++){
        var g=gx(x);
        snap([3],'반복 '+(it+1)+': 기울기 g = f\'('+r3(x)+') = 2(x−3) = <b>'+r3(g)+'</b>. (음수=오른쪽이 내리막)',{g:g,iter:it});
        if(Math.abs(g)<0.1){ snap([5],'|g| = '+r3(Math.abs(g))+' < ε → <b>거의 평평, 종료.</b>',{g:g,done:true,iter:it}); break; }
        x=x-lr*g; x=Math.round(x*1000)/1000; path.push(x);
        snap([4],'x ← x − η·g = '+r3(path[path.length-2])+' − 0.25·('+r3(g)+') = <b>'+r3(x)+'</b>. 한 걸음 내려갔습니다.',{g:g,iter:it});
      }
      snap([6],'<b>수렴!</b> x ≈ '+r3(x)+' → 최소점 3에 도달. 기울기 반대로 가니 매 걸음 f가 낮아집니다.',{done:true,iter:99});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H;
      function fx(x){ return (x-3)*(x-3); }
      function gx(x){ return 2*(x-3); }
      var xmin=-2.5, xmax=8.5, ymin=-2, ymax=22;
      var px0=W*0.12, px1=W*0.92, py0=H*0.18, py1=H*0.82;
      function PX(x){ return px0+(px1-px0)*(x-xmin)/(xmax-xmin); }
      function PY(y){ return py1-(py1-py0)*(y-ymin)/(ymax-ymin); }
      ctx.textAlign='center'; ctx.fillStyle='#cfd8e6'; ctx.font='600 15px sans-serif'; ctx.textBaseline='alphabetic';
      ctx.fillText('경사하강: x ← x − η·f′(x)   (기울기 반대로 한 걸음씩)', W/2, H*0.10);
      // axes
      ctx.strokeStyle='rgba(255,255,255,0.14)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(PX(xmin),PY(0)); ctx.lineTo(PX(xmax),PY(0)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(PX(0),PY(ymin)); ctx.lineTo(PX(0),PY(ymax)); ctx.stroke();
      ctx.fillStyle='#6f6e7a'; ctx.font='11px sans-serif';
      for(var t=-2;t<=8;t+=2){ ctx.fillText(''+t, PX(t), PY(0)+16); }
      // curve
      ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2.4; ctx.beginPath();
      for(var s=0;s<=160;s++){ var xx=xmin+(xmax-xmin)*s/160, yy=fx(xx); if(yy>ymax+2) {continue;} var X=PX(xx),Y=PY(yy); if(s===0||ctx._mvd===undefined){ctx.moveTo(X,Y);ctx._mvd=1;} else ctx.lineTo(X,Y); }
      ctx.stroke(); ctx._mvd=undefined;
      // minimum marker
      ctx.fillStyle='rgba(143,227,181,0.6)'; ctx.beginPath(); ctx.arc(PX(3),PY(0),4,0,7); ctx.fill();
      ctx.fillStyle='#8fe3b5'; ctx.font='11px sans-serif'; ctx.fillText('최소 x=3', PX(3), PY(0)+30);
      // path of iterates
      var P=f.path;
      ctx.strokeStyle='rgba(255,178,122,0.45)'; ctx.lineWidth=1.5;
      for(var i=0;i<P.length;i++){
        var xv=P[i], cx=PX(xv), cy=PY(fx(xv));
        if(i>0){ var pxv=P[i-1]; ctx.beginPath(); ctx.moveTo(PX(pxv),PY(fx(pxv))); ctx.lineTo(cx,cy); ctx.stroke(); }
      }
      for(i=0;i<P.length;i++){
        var xvv=P[i], dx=PX(xvv), dy=PY(fx(xvv)), last=(i===P.length-1);
        ctx.fillStyle=last?'#ffb27a':'rgba(255,178,122,0.4)'; ctx.strokeStyle=last?'#ffb27a':'rgba(255,178,122,0.5)'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.arc(dx,dy,last?7:4,0,7); ctx.fill(); if(last)ctx.stroke();
      }
      // current ball + tangent (gradient) arrow
      var xc=f.x, bx=PX(xc), by=PY(fx(xc));
      if(f.g!=null && !f.done){
        var g=f.g, slope=g;
        // tangent line segment
        var dd=1.1; var x1=xc-dd, x2=xc+dd, y1=fx(xc)+slope*(x1-xc), y2=fx(xc)+slope*(x2-xc);
        ctx.strokeStyle='#f4a0c0'; ctx.lineWidth=2; ctx.setLineDash([5,4]);
        ctx.beginPath(); ctx.moveTo(PX(x1),PY(y1)); ctx.lineTo(PX(x2),PY(y2)); ctx.stroke(); ctx.setLineDash([]);
        // step direction arrow (downhill, -g)
        var dir=(g<0)?1:-1;
        ctx.strokeStyle='#8fe3b5'; ctx.lineWidth=2.4; ctx.beginPath();
        ctx.moveTo(bx,by-14); ctx.lineTo(bx+dir*40,by-14); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx+dir*40,by-14); ctx.lineTo(bx+dir*40-dir*8,by-19); ctx.lineTo(bx+dir*40-dir*8,by-9); ctx.closePath();
        ctx.fillStyle='#8fe3b5'; ctx.fill();
        ctx.fillStyle='#f4a0c0'; ctx.font='11px sans-serif'; ctx.textAlign=dir>0?'right':'left';
        ctx.fillText('기울기 '+f.g, bx-dir*6, by+24);
      }
      // big current ball
      ctx.fillStyle='#ffb27a'; ctx.beginPath(); ctx.arc(bx,by,8,0,7); ctx.fill();
      ctx.strokeStyle='#fff'; ctx.lineWidth=1.2; ctx.stroke();
      ctx.fillStyle='#dfeefb'; ctx.font='600 12px monospace'; ctx.textAlign='center';
      ctx.fillText('x='+f.x, bx, by-22);
      var badge=f.done?'수렴 완료':'하강 중 (반복 '+(f.iter+1)+')';
      ctx.fillStyle=f.done?'#8fe3b5':'#ffb27a'; ctx.font='600 13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('▶ '+badge, W/2, H*0.95); }
  },

  // ══════ 힙(algo5_04) ▸ 펜윅 트리(BIT) (concept) ══════
  { id:'algo_br_fenwick', branchOf:'algo5_04',
    code:[
      'lowbit(i) = i & (-i)          // 마지막 1비트 값',
      'UPDATE(i, v):                 // a[i] 에 v 더하기',
      '  while i <= n:',
      '    tree[i] += v',
      '    i += lowbit(i)            // 위로 점프',
      'PREFIX(i):                    // a[1..i] 합',
      '  s = 0',
      '  while i > 0:',
      '    s += tree[i]',
      '    i -= lowbit(i)            // 아래로 점프',
      '  return s'
    ],
    build:function(V){
      var n=8;
      var a=[0,3,2,5,1,4,6,2,7];          // 1-based 원본
      var tree=[0,0,0,0,0,0,0,0,0];
      function lowbit(i){ return i&(-i); }
      var st=[];
      function snap(line,cap,i,jumps,extra){
        var f={line:line,cap:cap,n:n,a:a.slice(),tree:tree.slice(),
          i:(i==null?-1:i), jumps:(jumps||[]).slice()};
        if(extra) for(var k in extra) f[k]=extra[k];
        st.push(f); }
      // 진짜로 트리 구축(각 a[i]를 update) — 화면엔 최종 상태 + 두 데모만
      function build_real(){ for(var i=1;i<=n;i++){ var j=i; while(j<=n){ tree[j]+=a[i]; j+=lowbit(j); } } }
      build_real();
      snap([0],'펜윅 트리 준비 완료. <b>lowbit(i)=i&(−i)</b> 는 i의 마지막 1비트 값입니다(예: 6=110→2, 7=111→1).',-1,[]);
      // ── UPDATE 데모: a[5] 에 +3 ──
      var upd_i=5, upd_v=3, jp=[];
      snap([1],'<b>갱신 데모:</b> a[5] 에 <b>+'+upd_v+'</b> 를 더합니다. i=5(0b101)에서 위로 점프합니다.',5,[]);
      var i=upd_i;
      while(i<=n){
        tree[i]+=upd_v; jp.push(i);
        snap([2,3],'tree['+i+'] += '+upd_v+'  (i='+i+', 0b'+i.toString(2)+'). 이 칸이 a[5]를 구간에 포함합니다.',i,jp);
        var ni=i+lowbit(i);
        if(ni<=n) snap([4],'i += lowbit('+i+')='+lowbit(i)+'  →  i='+ni+' (0b'+ni.toString(2)+'). 부모 칸으로 올라갑니다.',ni,jp);
        else snap([4],'i += lowbit('+i+')='+lowbit(i)+' → '+ni+' &gt; n='+n+'. 갱신 종료 (O(log n)).',-1,jp);
        i=ni;
      }
      a[5]+=upd_v;
      // ── PREFIX 데모: prefix(7) ──
      var q_i=7, s=0, qj=[];
      snap([5,6],'<b>질의 데모:</b> prefix(7)=a[1..7] 합. i=7(0b111)에서 아래로 점프하며 tree를 더합니다.',7,[]);
      i=q_i;
      while(i>0){
        s+=tree[i]; qj.push(i);
        snap([7,8],'s += tree['+i+']='+tree[i]+'  →  s=<b>'+s+'</b>  (i='+i+', 0b'+i.toString(2)+').',i,qj,{psum:s});
        var ni2=i-lowbit(i);
        if(ni2>0) snap([9],'i −= lowbit('+i+')='+lowbit(i)+'  →  i='+ni2+' (0b'+ni2.toString(2)+'). 더 아래 구간으로.',ni2,qj,{psum:s});
        else snap([9],'i −= lowbit('+i+')='+lowbit(i)+' → 0. 합산 종료.',-1,qj,{psum:s});
        i=ni2;
      }
      // 검산: 실제 prefix
      var truesum=0; for(var k=1;k<=7;k++) truesum+=a[k];
      snap([10],'<b>완료!</b> prefix(7) = tree[7]+tree[6]+tree[4] = <b>'+s+'</b> (= a[1..7] 합 '+truesum+'). 단 3번 = 7의 1비트 수.',-1,qj,{psum:s});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H;
      var n=f.n, cell=Math.min(58,(W*0.78)/n), x0=W/2-n*cell/2, baseY=H*0.62;
      function lowbit(i){ return i&(-i); }
      function cxOf(i){ return x0+(i-1)*cell+(cell-5)/2; }
      // implicit BIT 구간 막대 (각 tree[i]가 담당하는 구간)
      for(var i=1;i<=n;i++){
        var lb=lowbit(i), start=i-lb+1;
        var bx=x0+(start-1)*cell, bw=lb*cell-7;
        var lvl=Math.round(Math.log2(lb)), by=baseY-18-lvl*17;
        var inJ=f.jumps&&f.jumps.indexOf(i)>=0, isI=(i===f.i);
        var col=isI?'#ffb27a':inJ?'#8fe3b5':'rgba(122,184,255,0.45)';
        var fil=isI?'rgba(255,178,122,0.28)':inJ?'rgba(143,227,181,0.28)':'rgba(122,184,255,0.10)';
        ctx.fillStyle=fil; ctx.strokeStyle=col; ctx.lineWidth=(isI||inJ)?2:1.3;
        ctx.fillRect(bx,by,bw,12); ctx.strokeRect(bx,by,bw,12);
        ctx.fillStyle=col; ctx.font='10px monospace'; ctx.textAlign='left'; ctx.textBaseline='middle';
        ctx.fillText('t'+i+'='+f.tree[i], bx+3, by+6); ctx.textBaseline='alphabetic';
      }
      // index cells
      for(i=1;i<=n;i++){
        var x=x0+(i-1)*cell, isI2=(i===f.i), inJ2=f.jumps&&f.jumps.indexOf(i)>=0;
        var col2=isI2?'#ffb27a':inJ2?'#8fe3b5':'#7ab8ff';
        var fil2=isI2?'rgba(255,178,122,0.25)':inJ2?'rgba(143,227,181,0.18)':'rgba(122,184,255,0.10)';
        if(isI2){ ctx.save(); ctx.shadowColor='#ffb27a'; ctx.shadowBlur=14; }
        ctx.fillStyle=fil2; ctx.strokeStyle=col2; ctx.lineWidth=isI2?2.4:1.5;
        ctx.fillRect(x,baseY,cell-5,cell-5); ctx.strokeRect(x,baseY,cell-5,cell-5);
        if(isI2) ctx.restore();
        ctx.fillStyle=col2; ctx.font='600 15px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(i,x+(cell-5)/2,baseY+(cell-5)/2-7);
        ctx.fillStyle='#9b99a3'; ctx.font='9px monospace';
        ctx.fillText('a='+f.a[i],x+(cell-5)/2,baseY+(cell-5)/2+9); ctx.textBaseline='alphabetic';
      }
      // jump arcs over cells
      if(f.jumps&&f.jumps.length>1){
        for(var k=0;k<f.jumps.length-1;k++){
          var ax=cxOf(f.jumps[k]), bx2=cxOf(f.jumps[k+1]);
          var midx=(ax+bx2)/2, top=baseY-58-Math.abs(bx2-ax)*0.12;
          ctx.strokeStyle='rgba(255,178,122,0.7)'; ctx.lineWidth=1.8;
          ctx.beginPath(); ctx.moveTo(ax,baseY-4); ctx.quadraticCurveTo(midx,top,bx2,baseY-4); ctx.stroke();
        }
      }
      // prefix sum readout
      if(f.psum!=null){
        ctx.fillStyle='#8fe3b5'; ctx.font='600 16px sans-serif'; ctx.textAlign='center';
        ctx.fillText('누적합 s = '+f.psum, W/2, baseY+cell+24);
      }
      ctx.fillStyle='#9b99a3'; ctx.font='11px sans-serif'; ctx.textAlign='center';
      ctx.fillText('막대 = 각 tree[i] 가 담당하는 구간(lowbit 폭)  ·  호 = i 점프 경로', W/2, H*0.10); }
  },

  // ══════ 이진트리(algo5_01) ▸ 최소 공통 조상 LCA (concept) ══════
  { id:'algo_br_lca', concept:true, branchOf:'algo5_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, T=[8,3,10,1,6,9,14];
      drawTreeB(E, T, function(j){ if(j===0)return {fill:'rgba(255,178,122,0.32)',stroke:'#ffb27a',text:'#ffb27a',tag:'LCA'}; if(j===3||j===5)return {fill:'rgba(143,227,181,0.3)',stroke:'#8fe3b5',text:'#8fe3b5',tag:'질의'}; return null; }, {lg:E.H*0.17,r:21});
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('노드 1과 9의 최소 공통 조상(LCA) = 8 — 양쪽으로 갈라지는 가장 깊은 노드', E.W/2, E.H*0.88); }
  },

  // ══════ 균형(algo5_05) ▸ 레드블랙 삽입 fixup (concept) ══════
  { id:'algo_br_rbfix', concept:true, branchOf:'algo5_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx;
      var redB={0:false,1:true,3:true};
      drawTreeB(E, [7,3,null,1], function(j){ var isRed=redB[j], viol=(j===1||j===3); return {fill:isRed?'rgba(226,75,74,0.3)':'rgba(255,255,255,0.1)', stroke:isRed?'#e24b4a':'#cfcdc6', text:isRed?'#f0a0a0':'#dfeefb', tag:viol?'빨강':null}; }, {left:E.W*0.02,right:E.W*0.46,top:E.H*0.26,lg:E.H*0.16,r:19});
      var redA={0:false,1:true,2:true};
      drawTreeB(E, [3,1,7], function(j){ var isRed=redA[j]; return {fill:isRed?'rgba(226,75,74,0.3)':'rgba(255,255,255,0.1)', stroke:isRed?'#e24b4a':'#cfcdc6', text:isRed?'#f0a0a0':'#dfeefb'}; }, {left:E.W*0.54,right:E.W*0.98,top:E.H*0.30,lg:E.H*0.16,r:19});
      AV.arrow(ctx, E.W*0.485, E.H*0.42, E.W*0.515, E.H*0.42, '#8fe3b5', 3);
      ctx.fillStyle='#e24b4a'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('빨강-빨강 위반', E.W*0.24, E.H*0.8);
      ctx.fillStyle='#8fe3b5'; ctx.fillText('회전 + 재색칠로 복구', E.W*0.76, E.H*0.8); }
  },

  // ══════ 배열(algo2_01) ▸ 분할상환 3기법 (concept) ══════
  { id:'algo_br_amort3', concept:true, branchOf:'algo2_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, cx=E.W/2, y0=E.H*0.22;
      function card(y,t,d,col){ ctx.fillStyle=col; ctx.font='600 16px sans-serif'; ctx.textAlign='center'; ctx.fillText(t, cx, y); ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.fillText(d, cx, y+22); }
      card(y0, '① 집계법 (Aggregate)', 'n번 연산 총비용 ÷ n = 1회 평균', '#7ab8ff');
      card(y0+E.H*0.17, '② 회계법 (Accounting)', '싼 연산에 요금 미리 적립 → 비싼 연산이 인출', '#8fe3b5');
      card(y0+E.H*0.34, '③ 잠재법 (Potential)', '저장된 에너지 Φ로 비싼 연산 비용 상쇄', '#ffb27a');
      ctx.fillStyle='#6f6e7a'; ctx.font='13px sans-serif'; ctx.fillText('동적 배열 2배 확장: n번 push 총 O(n) → 한 번당 평균(분할상환) O(1)', cx, y0+E.H*0.48); }
  },

  // ══════ 분할정복(algo8_03) ▸ 병렬 알고리즘 (concept) ══════
  { id:'algo_br_parallel', branchOf:'algo8_03',
    code:[
      'PARALLEL 분석 (작업 DAG):',
      '  work T1 ← 전체 작업 수',
      '  span T∞ ← 가장 긴 의존 사슬 길이',
      '  for t = 1,2,3,…:           // 시간 단계',
      '    ready ← 선행이 끝난 작업들',
      '    동시에 실행 (프로세서 충분)',
      '  parallelism ← T1 / T∞      // 최대 가속'
    ],
    build:function(V){
      // 7 작업 DAG (리덕션 트리 비슷): a,b,c,d 잎 → e=a+b, f=c+d → g=e+f
      // 인덱스 0..6, 위치(layer), 의존
      var tasks=[
        {id:0,nm:'a',x:0.12,y:0.78,dep:[]},
        {id:1,nm:'b',x:0.30,y:0.78,dep:[]},
        {id:2,nm:'c',x:0.55,y:0.78,dep:[]},
        {id:3,nm:'d',x:0.73,y:0.78,dep:[]},
        {id:4,nm:'e',x:0.21,y:0.50,dep:[0,1]},
        {id:5,nm:'f',x:0.64,y:0.50,dep:[2,3]},
        {id:6,nm:'g',x:0.42,y:0.22,dep:[4,5]}
      ];
      // 레벨(=작업이 끝나는 시간 단계) 계산
      var level=[];
      function lev(i){ if(level[i]!=null) return level[i]; var d=tasks[i].dep;
        if(d.length===0){ level[i]=1; return 1; }
        var m=0; for(var k=0;k<d.length;k++) m=Math.max(m,lev(d[k])); level[i]=m+1; return level[i]; }
      for(var i=0;i<tasks.length;i++) lev(i);
      var span=0; for(i=0;i<tasks.length;i++) span=Math.max(span,level[i]);
      var work=tasks.length;
      // 임계 경로 (한 사슬): g←f←c (length span)
      var crit=[6,5,2];
      var st=[];
      function snap(line,cap,o){ o=o||{}; st.push({line:line,cap:cap,tasks:tasks,level:level,
        span:span,work:work,crit:crit,
        t:(o.t==null?0:o.t),running:o.running||[],done:o.done||[],
        showCrit:o.showCrit||false,phase:o.phase||''}); }
      snap([0],'작업 DAG: 7개 작업(a~g), 화살표=의존(잎 a,b,c,d → e,f → 루트 g). 한 코어 vs 여러 코어를 비교합니다.',{phase:'intro'});
      snap([1],'<b>작업량 T₁ = '+work+'</b>: 한 코어로 전부 처리하면 '+work+'단계가 필요합니다.',{phase:'intro'});
      snap([2],'<b>깊이(스팬) T∞</b>: 가장 긴 의존 사슬을 따라갑니다. 분홍 경로 c → f → g 가 가장 깁니다.',{showCrit:true,phase:'span'});
      snap([2],'그 사슬 길이 = <b>'+span+'</b>. 무한 코어를 써도 이 '+span+'단계는 못 줄입니다(T∞ 하한).',{showCrit:true,phase:'span'});
      var doneAcc=[];
      for(var ti=1; ti<=span; ti++){
        var running=[]; for(i=0;i<tasks.length;i++) if(level[i]===ti) running.push(i);
        snap([3,4,5],'<b>시간 단계 '+ti+'</b>: 선행이 끝난 작업 '+running.map(function(r){return tasks[r].nm;}).join(',')+' 을 <b>동시에</b> 실행합니다.',
          {t:ti,running:running.slice(),done:doneAcc.slice(),phase:'schedule'});
        doneAcc=doneAcc.concat(running);
      }
      snap([6],'한 코어면 '+work+'단계, 여러 코어면 단 '+span+'단계 → 시간을 크게 단축했습니다.',
        {t:span,done:doneAcc.slice(),phase:'done'});
      snap([6],'<b>병렬도 = T₁/T∞ = '+work+'/'+span+' ≈ '+(Math.round(work/span*100)/100)+'</b>. 이론상 가능한 최대 가속입니다.',
        {t:span,done:doneAcc.slice(),phase:'done'});
      snap([6],'<b>완료!</b> 임계 경로(분홍)가 곧 병목입니다. 프로세서를 더 늘려도 T∞='+span+' 아래로는 못 줄입니다.',
        {t:span,done:doneAcc.slice(),showCrit:true,phase:'done'});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H,T=f.tasks;
      ctx.textAlign='center'; ctx.fillStyle='#cfd8e6'; ctx.font='600 15px sans-serif';
      ctx.fillText('병렬: 작업량 T₁ vs 깊이 T∞, 같은 층은 동시 실행', W/2, H*0.09);
      var x0=W*0.08,x1=W*0.78,y0=H*0.18,y1=H*0.80;
      function X(s){ return x0+(x1-x0)*s; }
      function Y(s){ return y0+(y1-y0)*s; }
      function inArr(a,v){ return a.indexOf(v)>=0; }
      // 간선
      ctx.lineWidth=2;
      for(var i=0;i<T.length;i++){ var t=T[i];
        for(var k=0;k<t.dep.length;k++){ var d=T[t.dep[k]];
          var onCrit=f.showCrit && inArr(f.crit,i) && inArr(f.crit,t.dep[k]);
          ctx.strokeStyle=onCrit?'#f4a0c0':'rgba(255,255,255,0.18)'; ctx.lineWidth=onCrit?3:2;
          var ax=X(d.x),ay=Y(d.y),bx=X(t.x),by=Y(t.y);
          ctx.beginPath(); ctx.moveTo(ax,ay-14); ctx.lineTo(bx,by+14); ctx.stroke();
          // arrow
          var ang=Math.atan2((by+14)-(ay-14),bx-ax);
          ctx.fillStyle=onCrit?'#f4a0c0':'rgba(255,255,255,0.3)';
          ctx.beginPath(); ctx.moveTo(bx,by+14);
          ctx.lineTo(bx-8*Math.cos(ang-0.4),by+14-8*Math.sin(ang-0.4));
          ctx.lineTo(bx-8*Math.cos(ang+0.4),by+14-8*Math.sin(ang+0.4)); ctx.fill();
        }
      }
      // 노드
      for(i=0;i<T.length;i++){ var n=T[i]; var px=X(n.x),py=Y(n.y),r=18;
        var running=inArr(f.running,i), done=inArr(f.done,i), onCrit=f.showCrit&&inArr(f.crit,i);
        var col='#9b99a3',fc='rgba(155,153,163,0.10)';
        if(running){ col='#ffb27a'; fc='rgba(255,178,122,0.26)'; }
        else if(done){ col='#8fe3b5'; fc='rgba(143,227,181,0.20)'; }
        else if(onCrit){ col='#f4a0c0'; fc='rgba(244,160,192,0.14)'; }
        ctx.fillStyle=fc; ctx.strokeStyle=col; ctx.lineWidth=running?3:2.2;
        ctx.beginPath(); ctx.arc(px,py,r,0,7); ctx.fill(); ctx.stroke();
        ctx.fillStyle=col; ctx.font='600 15px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(n.nm,px,py); ctx.textBaseline='alphabetic';
      }
      // 시간 단계 라벨 (왼쪽)
      if(f.t>0){ ctx.fillStyle='#ffb27a'; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('시간 단계 t = '+f.t, x0, H*0.95); }
      // 지표 패널 (오른쪽)
      var px2=W*0.81, py2=H*0.26;
      ctx.textAlign='left'; ctx.textBaseline='alphabetic';
      ctx.fillStyle='#9b99a3'; ctx.font='600 13px sans-serif'; ctx.fillText('지표', px2, py2-14);
      function metric(lbl,val,col,yy){ ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif'; ctx.fillText(lbl,px2,yy);
        ctx.fillStyle=col; ctx.font='600 20px monospace'; ctx.fillText(''+val,px2,yy+24); }
      metric('작업량 T₁',f.work,'#7ab8ff',py2);
      metric('깊이 T∞',f.span,'#f4a0c0',py2+58);
      var par=Math.round(f.work/f.span*100)/100;
      metric('병렬도 T₁/T∞',par,(f.phase==='done')?'#8fe3b5':'#ffb27a',py2+116);
      // 범례
      ctx.fillStyle='#7f8a9b'; ctx.font='11px sans-serif'; ctx.textAlign='left';
      ctx.fillText('주황=실행중  초록=완료', px2, py2+170);
      ctx.fillText('분홍=임계 경로(T∞)', px2, py2+186);
    }
  },

  // ══════ 그리디(algo8_01) ▸ 온라인 알고리즘 (concept) ══════
  { id:'algo_br_online', branchOf:'algo8_01',
    code:[
      'SKI-RENTAL(B):                  // 빌리기 $1/일, 사기 $B',
      '  spent ← 0                     // 누적 비용',
      '  for 매일 (며칠 탈지 모름):',
      '    if 이미 빌린 비용 = B − 1:   // B−1일 빌렸으면',
      '      사기 ($B 한 번)           // 이제 구매',
      '      break',
      '    else:',
      '      빌리기 ($1)               // 하루 더 빌림',
      '  // 최악 경쟁비 = 2  (최적의 2배 이내 보장)'
    ],
    build:function(V){
      var B=10, days=14;           // 실제로는 14일 탔다고 사후 판명
      var st=[];
      function snap(line,cap,extra){ var f={line:line,cap:cap,B:B,days:days}; if(extra)for(var k in extra)f[k]=extra[k]; st.push(f); }
      // optimal offline (knows 14 days): buy on day1 → cost B=10
      var opt=B;
      snap([0,1],'<b>스키 대여 문제</b>: 빌리면 하루 $1, 사면 $'+B+'. 며칠 탈지 <b>모른 채</b> 매일 결정해야 합니다 (B='+B+').',{d:0,alg:0,bought:false});
      var spent=0;
      for(var d=1; d<=days; d++){
        if(spent===B-1){
          spent+=B;  // buy
          snap([3,4,5],'<b>'+(d-1)+'일째까지 $'+(B-1)+' 썼습니다 = B−1.</b> 이제 <b>구매($'+B+')</b>! 누적 $'+spent+'. 더는 안 늘어납니다.',{d:d,alg:spent,bought:true,opt:opt});
          break;
        } else {
          spent+=1;
          snap([7,8],d+'일째: 아직 $'+(spent-1)+' < B−1 → <b>하루 더 빌림($1)</b>. 누적 $'+spent+'.',{d:d,alg:spent,bought:false,opt:opt});
        }
      }
      // continue accumulating opt fixed (already B). show final comparison
      snap(8,'결과: 온라인 $'+spent+' vs 미래를 다 안 <b>최적 오프라인 $'+opt+'</b>. 비 = '+(spent/opt).toFixed(1)+'배. <b>최악에도 2배 이내</b>가 보장됩니다.',{d:days,alg:spent,bought:true,opt:opt,done:true});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H,B=f.B,days=f.days;
      ctx.textBaseline='alphabetic';
      var x0=W*0.13, x1=W*0.92, y0=H*0.18, ybase=H*0.78;
      var maxC=2*B; // y scale ceiling
      function Y(c){ return ybase-(ybase-y0)*c/maxC; }
      function X(d){ return x0+(x1-x0)*d/days; }
      // axes
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x0,ybase); ctx.lineTo(x1,ybase); ctx.stroke();
      // y ticks
      ctx.fillStyle='#6f6e7a'; ctx.font='10px sans-serif'; ctx.textAlign='right';
      for(var c=0;c<=maxC;c+=5){ var yy=Y(c); ctx.strokeStyle='rgba(255,255,255,0.08)'; ctx.beginPath(); ctx.moveTo(x0,yy); ctx.lineTo(x1,yy); ctx.stroke(); ctx.fillStyle='#6f6e7a'; ctx.fillText('$'+c,x0-6,yy+3); }
      // x ticks
      ctx.textAlign='center';
      for(var d=0;d<=days;d+=2){ ctx.fillStyle='#6f6e7a'; ctx.fillText(d, X(d), ybase+16); }
      ctx.fillText('일(day)', (x0+x1)/2, ybase+34);
      // break-even line at day B
      var bx=X(B); ctx.strokeStyle='rgba(244,160,192,0.5)'; ctx.setLineDash([5,4]); ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(bx,y0); ctx.lineTo(bx,ybase); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='#f4a0c0'; ctx.font='10px sans-serif'; ctx.fillText('손익분기 (B일)', bx, y0-4);
      // optimal offline cost line (flat $B from start — buy day 1)
      if(f.opt!=null){ var oy=Y(f.opt); ctx.strokeStyle='#8fe3b5'; ctx.lineWidth=2; ctx.setLineDash([6,3]);
        ctx.beginPath(); ctx.moveTo(x0,oy); ctx.lineTo(x1,oy); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle='#8fe3b5'; ctx.textAlign='left'; ctx.font='11px sans-serif'; ctx.fillText('최적 오프라인 $'+f.opt, x1-110, oy-5); }
      // algorithm cumulative cost: rent $1/day until day B-1, then jump +B
      ctx.strokeStyle='#ffb27a'; ctx.lineWidth=2.5; ctx.beginPath();
      var prevC=0; ctx.moveTo(X(0),Y(0));
      for(d=1; d<=f.d; d++){
        var cc;
        if(d<=B-1){ cc=d; }       // renting
        else { cc=(B-1)+B; }      // bought
        if(d===B){ // jump
          ctx.lineTo(X(B-1+0.5),Y(B-1)); // approach
        }
        ctx.lineTo(X(d),Y(cc));
        prevC=cc;
      }
      ctx.stroke();
      // dots
      for(d=1; d<=f.d; d++){ var cc2=(d<=B-1)?d:(B-1)+B; ctx.fillStyle=(d===f.d)?'#ffb27a':'rgba(255,178,122,0.6)'; ctx.beginPath(); ctx.arc(X(d),Y(cc2),(d===f.d)?5:3,0,7); ctx.fill(); }
      // current cost label
      ctx.fillStyle='#ffb27a'; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
      ctx.fillText('알고리즘 누적 $'+f.alg, x0+8, y0+14);
      if(f.bought){ ctx.fillStyle='#f4a0c0'; ctx.fillText('★ 구매 완료 (이후 고정)', x0+8, y0+32); }
      // ratio badge
      if(f.done&&f.opt){ ctx.textAlign='center'; ctx.fillStyle='#8fe3b5'; ctx.font='600 14px sans-serif';
        ctx.fillText('경쟁비 = $'+f.alg+' / $'+f.opt+' = '+(f.alg/f.opt).toFixed(1)+'배  ≤ 2  보장', (x0+x1)/2, ybase+52); }
    }
  },

  // ══════ 종합(algo8_05) ▸ LU 분해 (concept) ══════
  { id:'algo_br_lu', branchOf:'algo8_05',
    code:[
      'LU(A):                       // A = L · U',
      '  L ← 단위행렬,  U ← A',
      '  for k = 0 .. n-1:          // 피벗 열',
      '    for i = k+1 .. n-1:      // 아래 행',
      '      f ← U[i][k] / U[k][k]',
      '      L[i][k] ← f            // 배수를 L에 기록',
      '      U[i] ← U[i] − f · U[k] // U는 상삼각으로',
      '  // 이후: Ly=b(전진대입), Ux=y(후진대입) — 재사용 O(n²)'
    ],
    build:function(V){
      function CP(a){ var r=[]; for(var i=0;i<a.length;i++) r.push(a[i].slice()); return r; }
      var n=3, A=[[4,3,2],[8,9,5],[4,3,8]], st=[];
      var U=CP(A), L=[[1,0,0],[0,1,0],[0,0,1]];
      function snap(line,cap,o){ st.push({line:line,cap:cap,n:n,A:CP(A),L:CP(L),U:CP(U),k:(o&&o.k!=null)?o.k:-1,ti:(o&&o.ti!=null)?o.ti:-1,lcell:(o&&o.lcell)?o.lcell:null,phase:(o&&o.phase)||'fac'}); }
      snap([0,1],'A를 <b>하삼각 L</b>(대각=1)과 <b>상삼각 U</b>의 곱으로 분해합니다. 시작: U=A, L=단위행렬.',{});
      for(var k=0;k<n;k++){
        snap([2],'피벗 열 '+k+': 대각 U['+k+']['+k+'] = <b>'+U[k][k]+'</b> 아래를 0으로 만듭니다.',{k:k});
        for(var i=k+1;i<n;i++){
          var f=U[i][k]/U[k][k]; f=Math.round(f*1000)/1000;
          snap([4,5],'배수 f = U['+i+']['+k+'] / U['+k+']['+k+'] = <b>'+f+'</b> → <b>L['+i+']['+k+']</b> 에 기록.',{k:k,ti:i,lcell:[i,k]});
          L[i][k]=f;
          for(var j=k;j<n;j++){ U[i][j]=Math.round((U[i][j]-f*U[k][j])*1000)/1000; if(Math.abs(U[i][j])<1e-9)U[i][j]=0; }
          snap([6],'U행 '+i+' ← U행 '+i+' − '+f+'·U행 '+k+'. 열 '+k+'이 <b>0</b>. (L은 그 배수를 보관)',{k:k,ti:i,lcell:[i,k]});
        }
      }
      snap([7],'<b>분해 완료: A = L·U.</b> L은 소거 배수, U는 상삼각. 같은 A·여러 b를 O(n²) 대입으로 재사용!',{phase:'done'});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H,n=f.n;
      ctx.textAlign='center'; ctx.fillStyle='#cfd8e6'; ctx.font='600 15px sans-serif';
      ctx.fillText('LU 분해: 가우스 소거를 L(배수)·U(상삼각)로 기록', W/2, H*0.09);
      var cw=Math.min(58,(W*0.27)/n), ch=cw, gap=7;
      function grid(mat,cx,cy,title,kind){
        var totalW=n*cw+(n-1)*gap, gx=cx-totalW/2, gy=cy;
        ctx.fillStyle='#9bb0c8'; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='alphabetic';
        ctx.fillText(title, cx, gy-12);
        for(var i=0;i<n;i++)for(var j=0;j<n;j++){
          var x=gx+j*(cw+gap), y=gy+i*(ch+gap), val=mat[i][j];
          var hl=null, isL=(kind==='L'), isU=(kind==='U');
          var struct = isL ? (j>i?'zero':(i===j?'diag':'fill')) : isU ? (j<i?'zero':'fill') : 'fill';
          if(kind==='L' && f.lcell && f.lcell[0]===i && f.lcell[1]===j) hl={fill:'rgba(255,178,122,0.30)',stroke:'#ffb27a',text:'#ffb27a'};
          else if(kind==='U' && i===f.ti && f.phase==='fac') hl={fill:'rgba(244,160,192,0.18)',stroke:'#f4a0c0',text:'#f4a0c0'};
          else if(kind==='U' && i===f.k && j>=f.k && f.k>=0 && f.phase==='fac') hl={fill:'rgba(255,178,122,0.14)',stroke:'#ffb27a',text:'#ffd9b8'};
          var base = struct==='zero'?'rgba(255,255,255,0.03)':struct==='diag'?'rgba(143,227,181,0.12)':'rgba(122,184,255,0.10)';
          var bstroke = struct==='zero'?'#2c3543':struct==='diag'?'#8fe3b5':(isL?'#4a6a8a':'#3c4a5e');
          ctx.fillStyle=hl?hl.fill:base; ctx.strokeStyle=hl?hl.stroke:bstroke; ctx.lineWidth=hl?2.2:1;
          if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,cw,ch,6);}else{ctx.beginPath();ctx.rect(x,y,cw,ch);}
          ctx.fill(); ctx.stroke();
          ctx.fillStyle=hl?hl.text:(struct==='zero'?'#5a5a64':struct==='diag'?'#8fe3b5':'#dfeefb');
          ctx.font='600 14px monospace'; ctx.textBaseline='middle';
          ctx.fillText(struct==='zero'?'0':(''+val), x+cw/2, y+ch/2);
        }
        ctx.textBaseline='alphabetic';
        return {gx:gx,right:gx+totalW};
      }
      var cy=H*0.32;
      var ga=grid(f.A,W*0.20,cy,'A','A');
      // = sign
      ctx.fillStyle='#7f8a9b'; ctx.font='600 22px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('=', W*0.40, cy+(n*ch)/2);
      var gl=grid(f.L,W*0.56,cy,'L (하삼각·배수)','L');
      ctx.fillStyle='#7f8a9b'; ctx.font='600 20px sans-serif'; ctx.textBaseline='middle';
      ctx.fillText('×', W*0.71, cy+(n*ch)/2);
      var gu=grid(f.U,W*0.86,cy,'U (상삼각)','U');
      ctx.textBaseline='alphabetic';
      // explanation strip
      ctx.fillStyle='#7f8a9b'; ctx.font='12px sans-serif'; ctx.textAlign='center';
      ctx.fillText('L: 대각선 1 + 소거 배수   |   U: 전진 소거로 얻은 상삼각', W/2, H*0.66);
      // solve reuse note (always visible, brighter when done)
      var doneCol = f.phase==='done'? '#8fe3b5':'#9b99a3';
      ctx.fillStyle=doneCol; ctx.font=(f.phase==='done'?'600 ':'')+'13px sans-serif';
      ctx.fillText('Ax=b  →  Ly=b (전진대입)  →  Ux=y (후진대입)', W/2, H*0.78);
      ctx.fillStyle='#6f6e7a'; ctx.font='11px sans-serif';
      ctx.fillText('분해는 한 번 O(n³), 우변 b마다 대입만 O(n²)으로 재사용', W/2, H*0.84);
      var badge=f.phase==='done'?'분해 완료':'분해 중';
      ctx.fillStyle=(f.phase==='done')?'#8fe3b5':'#ffb27a'; ctx.font='600 13px sans-serif';
      ctx.fillText('▶ '+badge, W/2, H*0.94); }
  },

  // ══════ 최단경로(algo6_05) ▸ DAG 최단경로 (concept) ══════
  { id:'algo_br_dagsp', concept:true, branchOf:'algo6_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx;
      var P={A:[E.W*0.14,E.H*0.46],B:[E.W*0.36,E.H*0.28],C:[E.W*0.36,E.H*0.64],D:[E.W*0.6,E.H*0.46],F:[E.W*0.84,E.H*0.46]};
      function gd(a,b,w){ var dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy),r=22, ax=a[0]+dx/d*r,ay=a[1]+dy/d*r,bx=b[0]-dx/d*r,by=b[1]-dy/d*r; AV.arrow(ctx,ax,ay,bx,by,'rgba(255,255,255,0.25)',2); ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText(w,(ax+bx)/2,(ay+by)/2-4); }
      gd(P.A,P.B,2); gd(P.A,P.C,4); gd(P.B,P.D,3); gd(P.C,P.D,1); gd(P.D,P.F,2);
      var dist={A:0,B:2,C:4,D:5,F:7};
      ['A','B','C','D','F'].forEach(function(k){ AV.node(E,P[k][0],P[k][1],k+':'+dist[k],{r:22,stroke:'#8fe3b5',fill:'rgba(143,227,181,0.18)',text:'#8fe3b5',fs:13}); });
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('위상순서(A→B→C→D→F)로 한 번 훑으며 완화 → O(V+E), 음수 가중치도 OK', E.W/2, E.H*0.84); }
  },

  // ══════ 이분탐색(algo4_02) ▸ lower/upper_bound ══════
  { id:'algo_br_lowerbound', concept:true, branchOf:'algo4_02',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, A=[1,3,3,3,5,7], x=3, cx=E.W/2;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 16px sans-serif';
      ctx.fillText('lower_bound — 정렬 배열에서  값 '+x+'이 처음 나오는 자리', cx, E.H*0.16);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('규칙: a[mid] ≥ x 면 mid를 후보로 두고 왼쪽으로 → 가장 왼쪽 후보가 답', cx, E.H*0.16+22);
      var lb=0; while(lb<A.length && A[lb]<x) lb++;
      var ub=0; while(ub<A.length && A[ub]<=x) ub++;
      AV.arr(E, A, { y:E.H*0.42, bw:60, gap:10, idx:true, hl:function(k){
        if(k===lb) return {fill:'rgba(143,227,181,0.32)',stroke:'#8fe3b5',text:'#8fe3b5',tag:'lower'};
        if(k===ub) return {fill:'rgba(122,184,255,0.3)',stroke:'#7ab8ff',text:'#bfe0ff',tag:'upper'};
        if(A[k]===x) return {fill:'rgba(255,178,122,0.2)',stroke:'#ffb27a',text:'#ffb27a'};
        return null; } });
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('lower='+lb+', upper='+ub+'  →  '+x+'의 개수 = upper − lower = '+(ub-lb)+'개', cx, E.H*0.66); }
  },

  // ══════ 이분탐색(algo4_02) ▸ 3대 함정 ══════
  { id:'algo_br_bsbug', concept:true, branchOf:'algo4_02',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, cx=E.W/2, y0=E.H*0.15;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('이분 탐색의 3대 함정', cx, y0);
      var rows=[
        ['① 중앙 계산','mid = (lo+hi)/2','mid = lo+(hi−lo)/2','lo+hi 오버플로 방지'],
        ['② 종료 조건','while (lo < hi)','while (lo ≤ hi)','마지막 한 칸도 검사'],
        ['③ 범위 갱신','lo = mid  /  hi = mid','lo = mid+1  /  hi = mid−1','mid 빼야 무한루프 안 남'] ];
      var ry=y0+46, rh=E.H*0.18, lx=cx-E.W*0.40;
      for(var i=0;i<rows.length;i++){ var y=ry+i*rh, r=rows[i];
        ctx.textAlign='left'; ctx.fillStyle='#bfe0ff'; ctx.font='600 15px sans-serif'; ctx.fillText(r[0], lx, y);
        ctx.fillStyle='#e2607a'; ctx.font='14px ui-monospace, monospace'; ctx.fillText('✗  '+r[1], lx+16, y+26);
        ctx.fillStyle='#8fe3b5'; ctx.fillText('✓  '+r[2], lx+16, y+50);
        ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif'; ctx.fillText('— '+r[3], lx+16, y+72); } }
  },

  // ══════ 최단경로/플로우(algo6_05) ▸ 디닉 알고리즘 (최대 유량) ══════
  { id:'algo_br_dinic', concept:true, branchOf:'algo6_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('디닉(Dinic) 알고리즘 — 레벨 그래프 + 막는 흐름', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('① BFS로 레벨(거리) 매김  →  ② 레벨이 한 칸씩 오르는 길로만 DFS로 흘림(blocking flow)  →  ③ 반복', W/2, H*0.10+22);
      var P={ s:[0.10,0.50], a:[0.36,0.30], b:[0.36,0.70], c:[0.63,0.30], d:[0.63,0.70], t:[0.90,0.50] };
      var lvl={ s:0, a:1, b:1, c:2, d:2, t:3 };
      function xy(k){ return [W*0.08+P[k][0]*W*0.84, H*0.24+P[k][1]*H*0.46]; }
      var E2=[['s','a',10],['s','b',10],['a','c',8],['b','c',4],['b','d',9],['c','t',10],['d','t',10]];
      // 레벨 띠 배경 + 라벨
      [0,1,2,3].forEach(function(L){ var x=W*0.08+([0.10,0.36,0.63,0.90][L])*W*0.84;
        ctx.fillStyle='rgba(122,184,255,0.04)'; ctx.fillRect(x-W*0.06, H*0.20, W*0.12, H*0.56);
        ctx.fillStyle='#6f7686'; ctx.font='600 12px sans-serif'; ctx.textAlign='center'; ctx.fillText('레벨 '+L, x, H*0.205); });
      E2.forEach(function(e){ var a=xy(e[0]), b=xy(e[1]), up=(lvl[e[1]]===lvl[e[0]]+1);
        var dx=b[0]-a[0], dy=b[1]-a[1], d=Math.hypot(dx,dy), r=22, ax=a[0]+dx/d*r, ay=a[1]+dy/d*r, bx=b[0]-dx/d*r, by=b[1]-dy/d*r;
        AV.arrow(ctx, ax,ay,bx,by, up?'#8fe3b5':'rgba(255,255,255,0.16)', up?2.5:1.5);
        ctx.fillStyle=up?'#8fe3b5':'#6f6e7a'; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText(e[2], (ax+bx)/2, (ay+by)/2-4); });
      Object.keys(P).forEach(function(k){ var p=xy(k), isST=(k==='s'||k==='t');
        AV.node(E, p[0], p[1], k.toUpperCase()+' ·'+lvl[k], { r:22, fs:13,
          fill:isST?'rgba(255,178,122,0.22)':'rgba(122,184,255,0.16)', stroke:isST?'#ffb27a':'#7ab8ff', text:isST?'#ffb27a':'#dfeefb' }); });
      ctx.fillStyle='#8fe3b5'; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('초록 간선 = 레벨이 +1 오르는 간선만 사용(전진만) → 한 번의 BFS로 여러 경로를 한꺼번에 포화', W/2, H*0.84);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('복잡도 O(V²E) — 포드-풀커슨보다 빠르고, 단위 용량(이분 매칭)에선 O(E√V)', W/2, H*0.84+22); }
  },

  // ══════ 최단경로(algo6_05) ▸ A* 탐색 (에이스타 — 마스코트!) ══════
  { id:'algo_br_astar', concept:true, branchOf:'algo6_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, R=6, C=7, cell=Math.min(50,(W*0.62)/C);
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('A* 탐색 — 다익스트라 + 목표 방향 휴리스틱', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='14px ui-monospace, monospace';
      ctx.fillText('f(n) = g(n) [시작부터 실제 거리]  +  h(n) [목표까지 추정]', W/2, H*0.10+24);
      var x0=W/2-C*cell/2, y0=H*0.24, S=[0,2], G=[6,3];
      var wall={'3-0':1,'3-1':1,'3-2':1,'3-4':1,'3-5':1};   // col3 벽(가운데 한 칸 열림)
      var path={'0-2':1,'1-2':1,'2-2':1,'3-3':1,'4-3':1,'5-3':1,'6-3':1};
      var open={'1-1':1,'2-1':1,'1-3':1,'2-3':1,'4-2':1,'4-4':1,'5-2':1};
      for(var c=0;c<C;c++)for(var r=0;r<R;r++){ var x=x0+c*cell, y=y0+r*cell, key=c+'-'+r, isS=(c===S[0]&&r===S[1]), isG=(c===G[0]&&r===G[1]);
        var fill='rgba(255,255,255,0.03)', stroke='rgba(255,255,255,0.12)', txt='';
        if(wall[key]){ fill='rgba(120,120,130,0.5)'; stroke='#555'; }
        else if(isS){ fill='rgba(255,178,122,0.3)'; stroke='#ffb27a'; txt='S'; }
        else if(isG){ fill='rgba(143,227,181,0.3)'; stroke='#8fe3b5'; txt='G'; }
        else if(path[key]){ fill='rgba(122,184,255,0.28)'; stroke='#7ab8ff'; }
        else if(open[key]){ fill='rgba(122,184,255,0.08)'; stroke='rgba(122,184,255,0.35)'; }
        ctx.fillStyle=fill; ctx.strokeStyle=stroke; ctx.lineWidth=1.5; ctx.fillRect(x,y,cell-2,cell-2); ctx.strokeRect(x,y,cell-2,cell-2);
        if(txt){ ctx.fillStyle=isS?'#ffb27a':'#8fe3b5'; ctx.font='600 16px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(txt,x+cell/2-1,y+cell/2-1); ctx.textBaseline='alphabetic'; } }
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif'; ctx.textAlign='center';
      ctx.fillText('파랑 = 실제 거쳐간 길 · 옅은 파랑 = 후보로만 열렸다 닫힘 · 회색 = 벽', W/2, y0+R*cell+22);
      ctx.fillStyle='#bfe0ff'; ctx.font='13px sans-serif';
      ctx.fillText('h가 목표 쪽으로 안내 → 다익스트라보다 훨씬 적게 탐색. h가 실제 거리를 넘지 않으면(admissible) 최적 경로 보장', W/2, y0+R*cell+46); }
  },

  // ══════ 배열(algo2_01) ▸ 세그먼트 트리 ══════
  { id:'algo_br_segtree', branchOf:'algo2_01',
    code:[
      'build(node, l, r):            // 구간 [l,r] 합',
      '  if l == r: tree[node] = A[l]   // 리프',
      '  else:',
      '    m = (l+r)/2',
      '    build(left, l, m)',
      '    build(right, m+1, r)',
      '    tree[node] = left + right   // 자식 합',
      'query(node, l, r, ql, qr):',
      '  if [l,r] ⊆ [ql,qr]: return tree[node]  // 완전포함',
      '  if [l,r] ∩ [ql,qr] = ∅: return 0       // 벗어남',
      '  return query(left)+query(right)        // 겹침'
    ],
    build:function(V){
      var A=[5,8,6,3,2,7,9,1];   // 길이 8 배열
      // 노드: 1-기반 인덱스. node i: 자식 2i, 2i+1. 7개 내부 + 8 리프 = 15노드(완전이진).
      // 각 노드의 [lo,hi] 구간과 sum을 실제 계산.
      var node=[]; // node[i]={lo,hi,sum,x,depth}
      function place(i,lo,hi,depth,x0,x1){
        node[i]={lo:lo,hi:hi,depth:depth,x:(x0+x1)/2,sum:0};
        if(lo===hi){ node[i].sum=A[lo]; return A[lo]; }
        var m=(lo+hi)>>1, xm=(x0+x1)/2;
        var ls=place(2*i,lo,m,depth+1,x0,xm);
        var rs=place(2*i+1,m+1,hi,depth+1,xm,x1);
        node[i].sum=ls+rs; return node[i].sum;
      }
      place(1,0,7,0,0,1);
      var st=[];
      function rngLab(i){ return '['+node[i].lo+','+node[i].hi+']'; }
      function snap(line,cap,extra){ var f={line:line,cap:cap,A:A,node:node}; if(extra)for(var k in extra)f[k]=extra[k]; st.push(f); }
      // ---- BUILD 단계 ----
      snap([0,1],'길이 8 배열 <b>A=[5,8,6,3,2,7,9,1]</b>를 세그먼트 트리로 만듭니다. 리프 8개에 원소를 그대로 넣습니다.', {reveal:'leaves'});
      snap(6,'<b>상향 합치기</b>: 리프 쌍을 더해 부모를 채웁니다. [0,1]=5+8=<b>13</b>, [2,3]=6+3=<b>9</b>, [4,5]=2+7=<b>9</b>, [6,7]=9+1=<b>10</b>.', {reveal:'lvl2'});
      snap(6,'한 단계 위로: [0,3]=13+9=<b>22</b>, [4,7]=9+10=<b>19</b>. 각 노드가 자기 구간의 합을 담습니다.', {reveal:'lvl1'});
      snap(6,'루트 완성: 전체 합 [0,7]=22+19=<b>41</b>. 트리 구축 끝 — 전처리 O(n).', {reveal:'all'});
      // ---- QUERY [2,5] 단계 ----
      // 실제 재귀로 covering 노드 수집
      var QL=2, QR=5, cover=[], total=0;
      function query(i){
        var lo=node[i].lo, hi=node[i].hi;
        if(QR<lo||hi<QL) return 0;            // 벗어남
        if(QL<=lo&&hi<=QR){ cover.push(i); return node[i].sum; } // 완전포함
        return query(2*i)+query(2*i+1);
      }
      total=query(1);
      snap([7],'이제 <b>구간 합 질의 [2,5]</b>를 풉니다. 루트 [0,7]에서 시작해 아래로 내려갑니다.', {reveal:'all', path:[1], cover:[]});
      snap([10],'루트 [0,7]은 [2,5]와 <b>겹치지만 완전포함 아님</b> → 양쪽 자식으로 내려갑니다.', {reveal:'all', path:[1], cover:[]});
      snap([10],'노드 [0,3]도 [2,5]와 <b>겹침</b> → 자식 [0,1], [2,3]로 내려갑니다.', {reveal:'all', path:[1,2], cover:[]});
      snap([9],'[0,1]은 [2,5]와 <b>겹치지 않음</b>(벗어남) → 0 반환, 버립니다.', {reveal:'all', path:[1,2], cover:[], drop:[4]});
      snap([8],'<b>[2,3]은 [2,5]에 완전포함</b> → 저장값 <b>9</b>를 그대로 씁니다. 자식 안 봄!', {reveal:'all', path:[1,2], cover:[5]});
      snap([10],'반대쪽 노드 [4,7]도 [2,5]와 <b>겹침</b> → 자식 [4,5], [6,7]로.', {reveal:'all', path:[1,3], cover:[5]});
      snap([8],'<b>[4,5]는 [2,5]에 완전포함</b> → 저장값 <b>9</b> 사용.', {reveal:'all', path:[1,3], cover:[5,6]});
      snap([9],'[6,7]은 [2,5]와 <b>벗어남</b> → 0 반환, 버립니다.', {reveal:'all', path:[1,3], cover:[5,6], drop:[7]});
      snap([7,8],'<b>완료!</b> 합 [2,5] = 9([2,3]) + 9([4,5]) = <b>'+total+'</b>. 6칸을 더하지 않고 <b>커버링 노드 2개</b>만 — O(log n).', {reveal:'all', path:[], cover:[5,6], done:true});
      return st;
    },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H,N=f.node;
      var x0=W*0.10,x1=W*0.90,y0=H*0.13,lg=Math.min(H*0.155,72);
      function X(i){ return x0+(x1-x0)*N[i].x; }
      function Y(i){ return y0+N[i].depth*lg; }
      function shown(i){
        var d=N[i].depth, rv=f.reveal;
        if(rv==='all') return true;
        if(rv==='leaves') return d===3;
        if(rv==='lvl2') return d>=2;
        if(rv==='lvl1') return d>=1;
        return true;
      }
      var path=f.path||[], cover=f.cover||[], drop=f.drop||[];
      function inArr(a,i){ return a&&a.indexOf(i)>=0; }
      // edges
      ctx.lineWidth=1.6;
      for(var i=1;i<N.length;i++){ if(!N[i]||N[i].depth===0) continue; if(!shown(i)) continue;
        var par=i>>1; if(!shown(par)) continue;
        var on=(inArr(path,i)&&inArr(path,par))||(inArr(cover,i)&&inArr(path,par));
        ctx.strokeStyle=on?'rgba(255,178,122,0.55)':'rgba(255,255,255,0.18)';
        ctx.lineWidth=on?2.4:1.4;
        ctx.beginPath(); ctx.moveTo(X(par),Y(par)); ctx.lineTo(X(i),Y(i)); ctx.stroke();
      }
      // nodes
      ctx.textAlign='center'; ctx.textBaseline='middle';
      for(i=1;i<N.length;i++){ if(!N[i]||!shown(i)) continue;
        var isCover=inArr(cover,i), isPath=inArr(path,i)&&!isCover, isDrop=inArr(drop,i);
        var col=isCover?'#8fe3b5':isPath?'#ffb27a':isDrop?'#f4a0c0':'#7ab8ff';
        var fc =isCover?'rgba(143,227,181,0.24)':isPath?'rgba(255,178,122,0.22)':isDrop?'rgba(244,160,192,0.16)':'rgba(122,184,255,0.13)';
        var px=X(i),py=Y(i),r=N[i].depth===3?16:18;
        if(isCover){ ctx.save(); ctx.shadowColor='#8fe3b5'; ctx.shadowBlur=14; }
        ctx.fillStyle=fc; ctx.strokeStyle=col; ctx.lineWidth=2.2;
        ctx.beginPath(); ctx.arc(px,py,r,0,7); ctx.fill(); ctx.stroke();
        if(isCover) ctx.restore();
        ctx.fillStyle=col; ctx.font='600 13px sans-serif'; ctx.fillText(N[i].sum,px,py);
        ctx.fillStyle='#9b99a3'; ctx.font='10px monospace';
        ctx.fillText('['+N[i].lo+','+N[i].hi+']',px,py+r+10);
      }
      // query band marker [2,5] at bottom over leaves when querying
      if(f.path||f.cover&&f.cover.length){
        ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif'; ctx.textAlign='left';
        ctx.fillText('질의 구간 [2,5]', x0, H*0.95);
      }
      ctx.textBaseline='alphabetic'; ctx.textAlign='left';
    },
  },

  // ══════ 배열(algo2_01) ▸ 펜윅 트리(BIT) ══════
  { id:'algo_br_fenwick', branchOf:'algo2_01',
    code:[
      'lowbit(i) = i & (-i)          // 마지막 1비트 값',
      'UPDATE(i, v):                 // a[i] 에 v 더하기',
      '  while i <= n:',
      '    tree[i] += v',
      '    i += lowbit(i)            // 위로 점프',
      'PREFIX(i):                    // a[1..i] 합',
      '  s = 0',
      '  while i > 0:',
      '    s += tree[i]',
      '    i -= lowbit(i)            // 아래로 점프',
      '  return s'
    ],
    build:function(V){
      var n=8;
      var a=[0,3,2,5,1,4,6,2,7];          // 1-based 원본
      var tree=[0,0,0,0,0,0,0,0,0];
      function lowbit(i){ return i&(-i); }
      var st=[];
      function snap(line,cap,i,jumps,extra){
        var f={line:line,cap:cap,n:n,a:a.slice(),tree:tree.slice(),
          i:(i==null?-1:i), jumps:(jumps||[]).slice()};
        if(extra) for(var k in extra) f[k]=extra[k];
        st.push(f); }
      // 진짜로 트리 구축(각 a[i]를 update) — 화면엔 최종 상태 + 두 데모만
      function build_real(){ for(var i=1;i<=n;i++){ var j=i; while(j<=n){ tree[j]+=a[i]; j+=lowbit(j); } } }
      build_real();
      snap([0],'펜윅 트리 준비 완료. <b>lowbit(i)=i&(−i)</b> 는 i의 마지막 1비트 값입니다(예: 6=110→2, 7=111→1).',-1,[]);
      // ── UPDATE 데모: a[5] 에 +3 ──
      var upd_i=5, upd_v=3, jp=[];
      snap([1],'<b>갱신 데모:</b> a[5] 에 <b>+'+upd_v+'</b> 를 더합니다. i=5(0b101)에서 위로 점프합니다.',5,[]);
      var i=upd_i;
      while(i<=n){
        tree[i]+=upd_v; jp.push(i);
        snap([2,3],'tree['+i+'] += '+upd_v+'  (i='+i+', 0b'+i.toString(2)+'). 이 칸이 a[5]를 구간에 포함합니다.',i,jp);
        var ni=i+lowbit(i);
        if(ni<=n) snap([4],'i += lowbit('+i+')='+lowbit(i)+'  →  i='+ni+' (0b'+ni.toString(2)+'). 부모 칸으로 올라갑니다.',ni,jp);
        else snap([4],'i += lowbit('+i+')='+lowbit(i)+' → '+ni+' &gt; n='+n+'. 갱신 종료 (O(log n)).',-1,jp);
        i=ni;
      }
      a[5]+=upd_v;
      // ── PREFIX 데모: prefix(7) ──
      var q_i=7, s=0, qj=[];
      snap([5,6],'<b>질의 데모:</b> prefix(7)=a[1..7] 합. i=7(0b111)에서 아래로 점프하며 tree를 더합니다.',7,[]);
      i=q_i;
      while(i>0){
        s+=tree[i]; qj.push(i);
        snap([7,8],'s += tree['+i+']='+tree[i]+'  →  s=<b>'+s+'</b>  (i='+i+', 0b'+i.toString(2)+').',i,qj,{psum:s});
        var ni2=i-lowbit(i);
        if(ni2>0) snap([9],'i −= lowbit('+i+')='+lowbit(i)+'  →  i='+ni2+' (0b'+ni2.toString(2)+'). 더 아래 구간으로.',ni2,qj,{psum:s});
        else snap([9],'i −= lowbit('+i+')='+lowbit(i)+' → 0. 합산 종료.',-1,qj,{psum:s});
        i=ni2;
      }
      // 검산: 실제 prefix
      var truesum=0; for(var k=1;k<=7;k++) truesum+=a[k];
      snap([10],'<b>완료!</b> prefix(7) = tree[7]+tree[6]+tree[4] = <b>'+s+'</b> (= a[1..7] 합 '+truesum+'). 단 3번 = 7의 1비트 수.',-1,qj,{psum:s});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H;
      var n=f.n, cell=Math.min(58,(W*0.78)/n), x0=W/2-n*cell/2, baseY=H*0.62;
      function lowbit(i){ return i&(-i); }
      function cxOf(i){ return x0+(i-1)*cell+(cell-5)/2; }
      // implicit BIT 구간 막대 (각 tree[i]가 담당하는 구간)
      for(var i=1;i<=n;i++){
        var lb=lowbit(i), start=i-lb+1;
        var bx=x0+(start-1)*cell, bw=lb*cell-7;
        var lvl=Math.round(Math.log2(lb)), by=baseY-18-lvl*17;
        var inJ=f.jumps&&f.jumps.indexOf(i)>=0, isI=(i===f.i);
        var col=isI?'#ffb27a':inJ?'#8fe3b5':'rgba(122,184,255,0.45)';
        var fil=isI?'rgba(255,178,122,0.28)':inJ?'rgba(143,227,181,0.28)':'rgba(122,184,255,0.10)';
        ctx.fillStyle=fil; ctx.strokeStyle=col; ctx.lineWidth=(isI||inJ)?2:1.3;
        ctx.fillRect(bx,by,bw,12); ctx.strokeRect(bx,by,bw,12);
        ctx.fillStyle=col; ctx.font='10px monospace'; ctx.textAlign='left'; ctx.textBaseline='middle';
        ctx.fillText('t'+i+'='+f.tree[i], bx+3, by+6); ctx.textBaseline='alphabetic';
      }
      // index cells
      for(i=1;i<=n;i++){
        var x=x0+(i-1)*cell, isI2=(i===f.i), inJ2=f.jumps&&f.jumps.indexOf(i)>=0;
        var col2=isI2?'#ffb27a':inJ2?'#8fe3b5':'#7ab8ff';
        var fil2=isI2?'rgba(255,178,122,0.25)':inJ2?'rgba(143,227,181,0.18)':'rgba(122,184,255,0.10)';
        if(isI2){ ctx.save(); ctx.shadowColor='#ffb27a'; ctx.shadowBlur=14; }
        ctx.fillStyle=fil2; ctx.strokeStyle=col2; ctx.lineWidth=isI2?2.4:1.5;
        ctx.fillRect(x,baseY,cell-5,cell-5); ctx.strokeRect(x,baseY,cell-5,cell-5);
        if(isI2) ctx.restore();
        ctx.fillStyle=col2; ctx.font='600 15px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(i,x+(cell-5)/2,baseY+(cell-5)/2-7);
        ctx.fillStyle='#9b99a3'; ctx.font='9px monospace';
        ctx.fillText('a='+f.a[i],x+(cell-5)/2,baseY+(cell-5)/2+9); ctx.textBaseline='alphabetic';
      }
      // jump arcs over cells
      if(f.jumps&&f.jumps.length>1){
        for(var k=0;k<f.jumps.length-1;k++){
          var ax=cxOf(f.jumps[k]), bx2=cxOf(f.jumps[k+1]);
          var midx=(ax+bx2)/2, top=baseY-58-Math.abs(bx2-ax)*0.12;
          ctx.strokeStyle='rgba(255,178,122,0.7)'; ctx.lineWidth=1.8;
          ctx.beginPath(); ctx.moveTo(ax,baseY-4); ctx.quadraticCurveTo(midx,top,bx2,baseY-4); ctx.stroke();
        }
      }
      // prefix sum readout
      if(f.psum!=null){
        ctx.fillStyle='#8fe3b5'; ctx.font='600 16px sans-serif'; ctx.textAlign='center';
        ctx.fillText('누적합 s = '+f.psum, W/2, baseY+cell+24);
      }
      ctx.fillStyle='#9b99a3'; ctx.font='11px sans-serif'; ctx.textAlign='center';
      ctx.fillText('막대 = 각 tree[i] 가 담당하는 구간(lowbit 폭)  ·  호 = i 점프 경로', W/2, H*0.10); }
  },

  // ══════ 해시(algo2_05) ▸ 트라이(Trie) ══════
  { id:'algo_br_trie', branchOf:'algo2_05',
    code:[
      'insert(root, word):',
      '  cur = root',
      '  for c in word:',
      '    if cur.child[c] is null:',
      '      cur.child[c] = new Node   // 노드 생성',
      '    cur = cur.child[c]          // 한 칸 내려감',
      '  cur.end = true                // 단어 끝 표시',
      'search(root, word):',
      '  cur = root',
      '  for c in word:',
      '    cur = cur.child[c]',
      '    if cur is null: return false  // 경로 없음',
      '  return cur.end                  // 끝 표시면 단어'
    ],
    build:function(V){
      var WORDS=['cat','car','cup','cap'];
      // 트라이를 실제로 만든다. 노드: {id,ch,parent,depth,end,x}
      var nodes=[{id:0,ch:'',parent:-1,depth:0,end:false}]; // root
      var childMap={0:{}};
      function getChild(p,c){
        if(childMap[p][c]!=null) return childMap[p][c];
        var id=nodes.length;
        nodes.push({id:id,ch:c,parent:p,depth:nodes[p].depth+1,end:false});
        childMap[id]={};
        childMap[p][c]=id;
        return id;
      }
      var st=[];
      function snap(line,cap,extra){ var f={line:line,cap:cap}; if(extra)for(var k in extra)f[k]=extra[k]; st.push(f); }
      function snapNodes(){ return nodes.map(function(n){ return {id:n.id,ch:n.ch,parent:n.parent,depth:n.depth,end:n.end}; }); }
      snap([0,1],'빈 트라이(루트만)에 <b>cat, car, cup, cap</b> 네 단어를 한 글자씩 넣습니다.', {nodes:snapNodes(),active:[0],created:[]});
      // 단어별 삽입 — 각 글자 단계 스냅
      for(var w=0;w<WORDS.length;w++){
        var word=WORDS[w], cur=0, pathIds=[0], created=[];
        for(var ci=0;ci<word.length;ci++){
          var c=word[ci], existed=(childMap[cur][c]!=null);
          var nid=getChild(cur,c);
          cur=nid; pathIds.push(nid);
          if(!existed) created.push(nid);
          var capTxt = existed
            ? ("'"+word+"' 의 <b>'"+c+"'</b>: 자식이 이미 있어 <b>경로 공유</b> → 그대로 내려갑니다.")
            : ("'"+word+"' 의 <b>'"+c+"'</b>: 자식이 없어 <b>새 노드 생성</b> 후 내려갑니다.");
          snap(existed?[5]:[4,5], capTxt, {nodes:snapNodes(),active:pathIds.slice(),created:created.slice(),cur:nid});
        }
        nodes[cur].end=true;
        snap([6],"'"+word+"' 삽입 끝 → 마지막 노드 <b>'"+word[word.length-1]+"'</b>에 <b>단어끝</b> 표시.", {nodes:snapNodes(),active:pathIds.slice(),created:created.slice(),cur:cur,markEnd:cur});
      }
      // ---- SEARCH 'car' ----
      var sw='car', scur=0, spath=[0], ok=true;
      snap([7,8],'이제 <b>search("car")</b>: 루트에서 글자를 따라 내려갑니다.', {nodes:snapNodes(),active:[0],created:[],searchPath:[0]});
      for(var si=0;si<sw.length;si++){
        var sc=sw[si], next=childMap[scur][sc];
        scur=next; spath.push(scur);
        snap([10,11],"'"+sc+"' 자식으로 한 칸 이동 — 경로가 존재합니다.", {nodes:snapNodes(),active:spath.slice(),created:[],searchPath:spath.slice(),cur:scur});
      }
      snap([12],'마지막 노드에 <b>단어끝 표시가 있음</b> → "car" 는 사전에 <b>있습니다(true)</b>. 탐색은 길이 O(L), 사전 크기 무관!', {nodes:snapNodes(),active:spath.slice(),created:[],searchPath:spath.slice(),cur:scur,found:true});
      return st;
    },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H,N=f.nodes;
      // 레이아웃: 깊이별 y, 같은 부모 자식은 x 분산. 결정적 배치 — 리프 순서로 x 할당.
      // 각 노드 x를 in-order로 계산: 리프는 균등, 내부는 자식 평균.
      var leaves=[]; // dfs order leaf list
      var childrenOf={}; for(var i=0;i<N.length;i++) childrenOf[i]=[];
      for(i=1;i<N.length;i++) childrenOf[N[i].parent].push(i);
      // 정렬: 글자순
      for(var k in childrenOf) childrenOf[k].sort(function(a,b){ return N[a].ch<N[b].ch?-1:1; });
      var xpos={}, counter={v:0};
      (function dfs(id){ var ch=childrenOf[id];
        if(ch.length===0){ xpos[id]=counter.v++; return; }
        var sum=0; for(var j=0;j<ch.length;j++){ dfs(ch[j]); sum+=xpos[ch[j]]; }
        xpos[id]=sum/ch.length;
      })(0);
      var maxLeaf=Math.max(1,counter.v-1);
      var x0=W*0.12,x1=W*0.88,y0=H*0.14,lg=Math.min(H*0.18,80);
      function X(id){ return x0+(x1-x0)*(maxLeaf?xpos[id]/maxLeaf:0.5); }
      function Y(id){ return y0+N[id].depth*lg; }
      var active=f.active||[], created=f.created||[], spath=f.searchPath||[];
      function inA(a,i){ return a&&a.indexOf(i)>=0; }
      // edges
      ctx.lineWidth=1.6; ctx.textAlign='center'; ctx.textBaseline='middle';
      for(i=1;i<N.length;i++){ var par=N[i].parent;
        var onPath=(spath.length? (inA(spath,i)&&inA(spath,par)) : (inA(active,i)&&inA(active,par)));
        ctx.strokeStyle=onPath?'rgba(255,178,122,0.6)':'rgba(255,255,255,0.2)';
        ctx.lineWidth=onPath?2.6:1.5;
        ctx.beginPath(); ctx.moveTo(X(par),Y(par)); ctx.lineTo(X(i),Y(i)); ctx.stroke();
      }
      // nodes
      for(i=0;i<N.length;i++){ var n=N[i], px=X(i),py=Y(i);
        var isRoot=(i===0);
        var isCur=(f.cur===i);
        var isNew=inA(created,i)&&f.cur===i;
        var onSearch=inA(spath,i);
        var col, fc;
        if(isRoot){ col='#9b99a3'; fc='rgba(155,153,163,0.12)'; }
        else if(isCur){ col='#ffb27a'; fc='rgba(255,178,122,0.26)'; }
        else if(onSearch){ col='#ffb27a'; fc='rgba(255,178,122,0.18)'; }
        else if(n.end){ col='#8fe3b5'; fc='rgba(143,227,181,0.22)'; }
        else { col='#7ab8ff'; fc='rgba(122,184,255,0.14)'; }
        var r=17;
        if(isCur){ ctx.save(); ctx.shadowColor=col; ctx.shadowBlur=14; }
        ctx.fillStyle=fc; ctx.strokeStyle=col; ctx.lineWidth=2.2;
        ctx.beginPath(); ctx.arc(px,py,r,0,7); ctx.fill(); ctx.stroke();
        if(isCur) ctx.restore();
        ctx.fillStyle=isRoot?'#9b99a3':col; ctx.font='600 14px sans-serif';
        ctx.fillText(isRoot?'•':n.ch, px,py);
        if(n.end){ ctx.fillStyle='#8fe3b5'; ctx.font='9px sans-serif'; ctx.fillText('끝',px,py-r-7); }
      }
      // search result badge
      if(f.found){ ctx.fillStyle='#8fe3b5'; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('search("car") = true ✓', x0, H*0.95); }
      ctx.textBaseline='alphabetic'; ctx.textAlign='left';
    },
  },

  // ══════ BST탐색(algo5_03) ▸ 최소 공통 조상(LCA) ══════
  { id:'algo_br_lca', concept:true, branchOf:'algo5_03',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, T=['A','B','C','D','E','F','G'], qu=3, qv=4, lca=1;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('LCA — 두 노드의 최소 공통 조상', W/2, H*0.09);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('u, v를 모두 조상으로 갖는 가장 깊은 노드. 질의: u=D, v=E', W/2, H*0.09+22);
      drawTreeB(E, T, function(i){ if(i===lca) return {fill:'rgba(255,178,122,0.32)',stroke:'#ffb27a',text:'#ffb27a',tag:'LCA'};
        if(i===qu||i===qv) return {fill:'rgba(122,184,255,0.32)',stroke:'#7ab8ff',text:'#bfe0ff',tag:'질의'}; return null; }, {top:H*0.30, lg:H*0.19, r:21});
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('D와 E에서 위로 올라가다 처음 만나는 노드 = B. 전처리(오일러+희소표 / 이진 점프)로 질의당 O(log n)~O(1)', W/2, H*0.88); }
  },

  // ══════ 최단경로/플로우(algo6_05) ▸ 최소 비용 최대 유량(MCMF) ══════
  { id:'algo_br_mcmf', concept:true, branchOf:'algo6_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('최소 비용 최대 유량 (MCMF)', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('간선마다 (비용, 용량). 최대 유량을 보내되 매번 \"비용이 가장 싼 증가 경로\"부터', W/2, H*0.10+22);
      var P={ s:[0.12,0.50], a:[0.42,0.28], b:[0.42,0.72], t:[0.84,0.50] };
      function xy(k){ return [W*0.08+P[k][0]*W*0.84, H*0.26+P[k][1]*H*0.44]; }
      var E2=[['s','a',1,3,1],['s','b',3,2,0],['a','t',1,2,1],['b','t',1,3,0],['a','b',1,1,0]];  // cost,cap,onpath
      E2.forEach(function(e){ var a=xy(e[0]),b=xy(e[1]); gedge(E,a,b, e[4]?'#8fe3b5':'rgba(255,255,255,0.18)', e[4]?2.6:1.6, '비용'+e[2]+'/용량'+e[3]); });
      Object.keys(P).forEach(function(k){ var p=xy(k), st=(k==='s'||k==='t');
        AV.node(E,p[0],p[1],k.toUpperCase(),{r:22,fs:15,fill:st?'rgba(255,178,122,0.22)':'rgba(122,184,255,0.16)',stroke:st?'#ffb27a':'#7ab8ff',text:st?'#ffb27a':'#dfeefb'}); });
      ctx.fillStyle='#8fe3b5'; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('초록 = 이번에 고른 최소비용 경로 s→a→t (비용 1+1=2). 포화될 때까지 반복', W/2, H*0.84);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('증가 경로를 \"최단(비용)\"으로 고르면 총비용 최소 보장 — SPFA/벨만포드, 또는 Dijkstra+퍼텐셜', W/2, H*0.84+22); }
  },

  // ══════ DFS(algo6_04) ▸ 2-SAT (함의 그래프 + SCC) ══════
  { id:'algo_br_2sat', concept:true, branchOf:'algo6_04',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('2-SAT — 절(clause)을 함의 그래프로', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('절 (x ∨ y) ⇒ 두 함의:  ¬x → y,  ¬y → x.  변수마다 참/거짓 두 정점', W/2, H*0.10+22);
      var P={ 'x':[0.25,0.34,'x'], 'nx':[0.25,0.70,'¬x'], 'y':[0.72,0.34,'y'], 'ny':[0.72,0.70,'¬y'] };
      function xy(k){ return [W*0.10+P[k][0]*W*0.80, H*0.26+P[k][1]*H*0.46]; }
      [['nx','y'],['ny','x']].forEach(function(e){ gedge(E,xy(e[0]),xy(e[1]),'#8fe3b5',2.4); });
      Object.keys(P).forEach(function(k){ var p=xy(k);
        AV.node(E,p[0],p[1],P[k][2],{r:24,fs:16,fill:'rgba(122,184,255,0.16)',stroke:'#7ab8ff',text:'#dfeefb'}); });
      ctx.fillStyle='#8fe3b5'; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('초록 화살표 = (x∨y)가 만든 두 함의', W/2, H*0.80);
      ctx.fillStyle='#bfe0ff'; ctx.font='13px sans-serif';
      ctx.fillText('SCC로 묶었을 때 x와 ¬x가 \"같은 덩어리\"면 모순 → 불가능. 아니면 위상 역순으로 값 배정. O(V+E)', W/2, H*0.80+24); }
  },

  // ══════ DFS(algo6_04) ▸ 오일러 경로 ══════
  { id:'algo_br_euler', concept:true, branchOf:'algo6_04',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('오일러 경로 — 모든 간선을 한 번씩 (한붓그리기)', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('조건: 연결 + 홀수 차수 정점이 0개(회로) 또는 정확히 2개(경로)', W/2, H*0.10+22);
      var P={ A:[0.22,0.30], B:[0.55,0.22], C:[0.80,0.46], D:[0.55,0.72], E0:[0.22,0.64] };
      var deg={ A:2, B:3, C:2, D:3, E0:2 };
      function xy(k){ return [W*0.10+P[k][0]*W*0.80, H*0.24+P[k][1]*H*0.50]; }
      var E2=[['A','B'],['B','C'],['C','D'],['D','E0'],['E0','A'],['B','D']];
      E2.forEach(function(e){ uedge(E,xy(e[0]),xy(e[1]),'rgba(255,255,255,0.22)',2); });
      Object.keys(P).forEach(function(k){ var p=xy(k), odd=(deg[k]%2===1);
        AV.node(E,p[0],p[1],k==='E0'?'E':k,{r:22,fs:14,fill:odd?'rgba(255,178,122,0.26)':'rgba(122,184,255,0.16)',stroke:odd?'#ffb27a':'#7ab8ff',text:odd?'#ffb27a':'#dfeefb',tag:'차수'+deg[k]}); });
      ctx.fillStyle='#ffb27a'; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('주황 = 홀수 차수(B, D 둘). 정확히 2개 → 오일러 경로 존재(B에서 시작해 D에서 끝)', W/2, H*0.86);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('히어홀저(Hierholzer): 막힐 때까지 걷고, 막히면 곁가지를 끼워 넣으며 합침 → O(E)', W/2, H*0.86+22); }
  },

  // ══════ 최단경로(algo6_05) ▸ 0-1 BFS ══════
  { id:'algo_br_01bfs', concept:true, branchOf:'algo6_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('0-1 BFS — 가중치가 0/1뿐인 최단경로를 O(V+E)에', W/2, H*0.11);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('덱(deque) 사용: 가중치 0 간선 → 맨 앞에 push,  가중치 1 간선 → 맨 뒤에 push', W/2, H*0.11+22);
      var nodes=['S','a','b','c','T'], y=H*0.40, x0=W*0.16, dx=W*0.66/4;
      var w=[0,1,0,1];  // 간선 가중치 S-a-b-c-T
      for(var i=0;i<nodes.length;i++){ var x=x0+i*dx;
        if(i>0){ var col=w[i-1]===0?'#8fe3b5':'#ffb27a'; AV.arrow(ctx, x-dx+22, y, x-22, y, col, 2.4); ctx.fillStyle=col; ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.fillText(w[i-1], x-dx/2, y-10); }
        AV.node(E, x, y, nodes[i], { r:20, fs:14, fill:'rgba(122,184,255,0.16)', stroke:'#7ab8ff', text:'#dfeefb' }); }
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif'; ctx.textAlign='center';
      ctx.fillText('초록 = 비용 0(같은 거리), 주황 = 비용 1(거리 +1)', W/2, y+H*0.10);
      // 덱 그림
      ctx.fillStyle='#bfe0ff'; ctx.font='600 14px sans-serif'; ctx.fillText('덱: [ 0간선은 앞으로 ]  ←  처리  →  [ 1간선은 뒤로 ]', W/2, y+H*0.20);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('0이면 같은 \"층\", 1이면 다음 \"층\" → BFS의 층 구조가 유지돼 우선순위 큐 없이 최단거리. 미로 벽 부수기 최소화 등에', W/2, y+H*0.27); }
  },

  // ══════ 선형탐색(algo4_01) ▸ 접미사 배열 ══════
  { id:'algo_br_suffixarray', concept:true, branchOf:'algo4_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('접미사 배열 — 모든 접미사를 정렬한 색인', W/2, H*0.09);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('문자열 "banana"의 접미사 6개를 사전순 정렬 → 시작 위치 목록이 SA', W/2, H*0.09+22);
      ctx.fillStyle='#bfe0ff'; ctx.font='600 20px ui-monospace, monospace'; ctx.fillText('b a n a n a', W/2, H*0.22);
      ctx.fillStyle='#6f7686'; ctx.font='11px ui-monospace, monospace'; ctx.fillText('0 1 2 3 4 5', W/2, H*0.22+18);
      var rows=[[5,'a'],[3,'ana'],[1,'anana'],[0,'banana'],[4,'na'],[2,'nana']];
      var y0=H*0.34, rh=H*0.085, cx=W/2;
      for(var i=0;i<rows.length;i++){ var y=y0+i*rh;
        ctx.textAlign='right'; ctx.fillStyle='#8fe3b5'; ctx.font='600 15px ui-monospace, monospace'; ctx.fillText('SA['+i+'] = '+rows[i][0], cx-20, y);
        ctx.textAlign='left'; ctx.fillStyle='#dfeefb'; ctx.font='15px ui-monospace, monospace'; ctx.fillText(rows[i][1], cx+10, y); }
      ctx.textAlign='center'; ctx.fillStyle='#ffb27a'; ctx.font='600 15px ui-monospace, monospace'; ctx.fillText('SA = [ 5, 3, 1, 0, 4, 2 ]', W/2, y0+6*rh+6);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif'; ctx.fillText('부분문자열 검색 = 정렬된 접미사에 이분 탐색 O(m log n). LCP 배열을 더하면 반복부분·검색이 더 강력', W/2, y0+6*rh+30); }
  },

  // ══════ 선형탐색(algo4_01) ▸ 아호-코라식 ══════
  { id:'algo_br_ahocorasick', concept:true, branchOf:'algo4_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('아호-코라식 — 여러 패턴을 한 번에 (트라이 + 실패 링크)', W/2, H*0.09);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('패턴 {he, she, his}를 트라이로. 빨강 점선 = 실패 링크(불일치 시 갈 곳) = 트라이판 KMP', W/2, H*0.09+22);
      var N={ root:[0.5,0.16,'•'], h:[0.30,0.36,'h'], s:[0.74,0.36,'s'], he:[0.18,0.58,'e'], hi:[0.42,0.58,'i'], sh:[0.74,0.58,'h'], his:[0.42,0.78,'s'], she:[0.74,0.78,'e'] };
      var ends={he:1,his:1,she:1};
      var edges=[['root','h'],['root','s'],['h','he'],['h','hi'],['hi','his'],['s','sh'],['sh','she']];
      var fails=[['sh','h'],['she','he'],['his','s']];
      function xy(k){ return [W*0.10+N[k][0]*W*0.80, H*0.20+N[k][1]*H*0.58]; }
      edges.forEach(function(e){ var a=xy(e[0]),b=xy(e[1]); ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.lineWidth=2; ctx.setLineDash([]); ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke(); });
      ctx.setLineDash([4,4]); fails.forEach(function(e){ var a=xy(e[0]),b=xy(e[1]); gedge(E,a,b,'#e2607a',1.8); }); ctx.setLineDash([]);
      Object.keys(N).forEach(function(k){ var p=xy(k), end=ends[k];
        AV.node(E,p[0],p[1],N[k][2],{r:17,fs:14,fill:end?'rgba(143,227,181,0.28)':'rgba(122,184,255,0.16)',stroke:end?'#8fe3b5':'#7ab8ff',text:end?'#8fe3b5':'#dfeefb',tag:end?'패턴끝':null}); });
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif'; ctx.textAlign='center';
      ctx.fillText('텍스트를 한 번 훑으며, 불일치하면 실패 링크로 점프 → O(텍스트 + 패턴들 길이 + 매칭 수)', W/2, H*0.94); }
  },

  // ══════ 선형탐색(algo4_01) ▸ Z 함수 ══════
  { id:'algo_br_zfunc', concept:true, branchOf:'algo4_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, sChars='aabaab'.split(''), Z=['-',1,0,3,1,0];
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('Z 함수 — 각 위치에서 "맨 앞 접두사"와 겹치는 길이', W/2, H*0.12);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('Z[i] = i부터 시작하는 부분문자열이 접두사(s[0..])와 일치하는 최대 길이', W/2, H*0.12+22);
      var n=sChars.length, bw=Math.min(70,(W*0.6)/n), gap=8, total=n*bw+(n-1)*gap, x0=W/2-total/2, y=H*0.40;
      for(var i=0;i<n;i++){ var x=x0+i*bw+i*gap, hot=(i===3);
        ctx.fillStyle=hot?'rgba(255,178,122,0.26)':'rgba(122,184,255,0.14)'; ctx.strokeStyle=hot?'#ffb27a':'#7ab8ff'; ctx.lineWidth=2;
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,bw,bw,8);ctx.fill();ctx.stroke();}else ctx.strokeRect(x,y,bw,bw);
        ctx.fillStyle='#dfeefb'; ctx.font='600 22px ui-monospace, monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(sChars[i], x+bw/2, y+bw/2); ctx.textBaseline='alphabetic';
        ctx.fillStyle='#6f7686'; ctx.font='11px sans-serif'; ctx.fillText(i, x+bw/2, y-8);
        ctx.fillStyle=hot?'#ffb27a':'#8fe3b5'; ctx.font='600 16px ui-monospace, monospace'; ctx.fillText('Z='+Z[i], x+bw/2, y+bw+20); }
      ctx.fillStyle='#ffb27a'; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('Z[3]=3: s[3..5]="aab" 가 접두사 "aab"와 3글자 일치(주황)', W/2, H*0.66);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('이미 아는 가장 오른쪽 일치구간(Z-박스)의 거울값을 재활용 → O(n). "패턴 $ 텍스트"로 이으면 문자열 검색', W/2, H*0.66+22); }
  },

  // ══════ 선형탐색(algo4_01) ▸ 매내처 ══════
  { id:'algo_br_manacher', concept:true, branchOf:'algo4_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, sChars='abacaba'.split(''), rad=[0,1,0,3,0,1,0];
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('매내처(Manacher) — 최장 회문을 O(n)에', W/2, H*0.12);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('각 중심의 회문 반지름을, 이미 아는 "오른쪽 회문 경계"의 거울값으로 재활용', W/2, H*0.12+22);
      var n=sChars.length, bw=Math.min(62,(W*0.62)/n), gap=7, total=n*bw+(n-1)*gap, x0=W/2-total/2, y=H*0.40;
      for(var i=0;i<n;i++){ var x=x0+i*(bw+gap), hot=(i===3);
        ctx.fillStyle=hot?'rgba(255,178,122,0.26)':'rgba(122,184,255,0.14)'; ctx.strokeStyle=hot?'#ffb27a':'#7ab8ff'; ctx.lineWidth=2;
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,bw,bw,8);ctx.fill();ctx.stroke();}else ctx.strokeRect(x,y,bw,bw);
        ctx.fillStyle='#dfeefb'; ctx.font='600 22px ui-monospace, monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(sChars[i], x+bw/2, y+bw/2); ctx.textBaseline='alphabetic';
        ctx.fillStyle='#6f7686'; ctx.font='11px sans-serif'; ctx.fillText(i, x+bw/2, y-8);
        ctx.fillStyle=hot?'#ffb27a':'#8fe3b5'; ctx.font='600 14px ui-monospace, monospace'; ctx.fillText('r='+rad[i], x+bw/2, y+bw+19); }
      // 중심3의 회문 범위 강조 선
      var cx3=x0+3*(bw+gap)+bw/2, lx=x0, rx=x0+(n-1)*(bw+gap)+bw;
      ctx.strokeStyle='#ffb27a'; ctx.lineWidth=2; ctx.setLineDash([5,4]); ctx.beginPath(); ctx.moveTo(lx,y+bw+34); ctx.lineTo(rx,y+bw+34); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='#ffb27a'; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('중심 3(c) 반지름 3 = "abacaba" 전체가 회문(최장)', W/2, y+bw+58);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('거울 대칭으로 중복 계산 생략 → O(n). 짝수 길이 회문은 글자 사이에 # 를 끼워 홀수로 통일', W/2, y+bw+80); }
  },

  // ══════ 유클리드(algo1_01... 없음 → 그리디 algo8_04 NP 근처) ▸ 밀러-라빈 소수판정 ══════
  { id:'algo_br_millerrabin', branchOf:'algo8_04',
    code:[
      'MILLER-RABIN(n, a):  // a = 증인 후보',
      '  n−1 = 2^s · d   (d 홀수)',
      '  x ← a^d mod n',
      '  if x == 1 or x == n−1: return "아마 소수"',
      '  repeat s−1 회:',
      '    x ← x² mod n           // 제곱',
      '    if x == n−1: return "아마 소수"',
      '  return "합성수"          // a 가 증인'
    ],
    build:function(V){
      var n=561, a=2;
      // n-1 = 2^s * d
      var d=n-1, s=0; while(d%2===0){ d/=2; s++; }
      function modpow(base,e,mod){ var r=1; base%=mod; while(e>0){ if(e&1) r=(r*base)%mod; base=(base*base)%mod; e>>=1; } return r; }
      var st=[];
      function snap(line,cap,o){ var fr={line:line,cap:cap,n:n,a:a,s:s,d:d};
        for(var k in o) fr[k]=o[k]; st.push(fr); }
      // 제곱 수열 구성: seq[0]=a^d, 이후 제곱
      var seq=[]; var x=modpow(a,d,n); seq.push(x);
      for(var i=0;i<s-1;i++){ x=(x*x)%n; seq.push(x); }
      snap([0,1],'<b>밀러-라빈 소수 판정</b>: n=561 (카마이클 수, 페르마 검사는 속음)을 밑 a=2로 검사합니다. n−1 = 560 = 2^'+s+'·'+d+' (d='+d+' 홀수).',
        {seq:seq,shown:-1,verdict:null,hitMinus:false,target:'n−1='+( n-1 )});
      snap([2],'x ← a^d mod n = 2^'+d+' mod 561 = <b>'+seq[0]+'</b>.',
        {seq:seq,shown:0,verdict:null,hitMinus:false});
      // 첫 검사
      var pp=(seq[0]===1||seq[0]===n-1);
      if(pp){
        snap([3],'x = '+seq[0]+' 가 1 또는 n−1('+(n-1)+') → <b>아마 소수</b>.',
          {seq:seq,shown:0,verdict:'prime',hitMinus:true});
      } else {
        snap([3],'x = '+seq[0]+' ≠ 1 이고 ≠ n−1('+(n-1)+'). 아직 결론 못 냄 → s−1='+(s-1)+'회 제곱하며 −1(=560)을 찾습니다.',
          {seq:seq,shown:0,verdict:null,hitMinus:false});
        var verdict=null, hitAt=-1;
        for(i=1;i<seq.length;i++){
          var isMinus=(seq[i]===n-1);
          if(isMinus){
            snap([5,6],'제곱 '+i+': x ← x² mod n = <b>'+seq[i]+'</b> = n−1 → <b>아마 소수</b> (멈춤).',
              {seq:seq,shown:i,verdict:'prime',hitMinus:true});
            verdict='prime'; hitAt=i; break;
          } else {
            snap([5],'제곱 '+i+': x ← x² mod n = <b>'+seq[i]+'</b>. n−1('+(n-1)+')이 아님 — 계속.',
              {seq:seq,shown:i,verdict:null,hitMinus:false});
          }
        }
        if(verdict===null){
          snap([7],'<b>마지막까지 −1이 한 번도 안 나옴.</b> 그런데 수열이 1로 끝났습니다 — 1의 제곱근은 ±1뿐인데 −1을 안 거쳤으므로 모순. n=561은 <b>확실히 합성수</b>, a=2가 증인입니다. (561 = 3·11·17)',
            {seq:seq,shown:seq.length-1,verdict:'composite',hitMinus:false});
        }
      }
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H;
      ctx.textAlign='center'; ctx.textBaseline='alphabetic'; ctx.fillStyle='#cfd8e6'; ctx.font='600 14px sans-serif';
      ctx.fillText('a^d 부터 제곱을 반복 — 수열에서 1 / −1(=n−1) 패턴으로 판정', W/2, H*0.11);
      // n-1 분해 표시
      ctx.fillStyle='#9b99a3'; ctx.font='14px monospace'; ctx.textAlign='center';
      ctx.fillText('n = '+f.n+'   n−1 = '+(f.n-1)+' = 2^'+f.s+' · '+f.d, W/2, H*0.22);
      ctx.fillStyle='#7f8a9b'; ctx.font='12px sans-serif';
      ctx.fillText('찾는 값: 1  또는  n−1 = '+(f.n-1), W/2, H*0.27);
      // 제곱 수열 셀
      var seq=f.seq, mlen=seq.length;
      var cw=Math.min(108,(W*0.84)/mlen), ch=58, gap=12;
      var totW=mlen*cw+(mlen-1)*gap, x0=W/2-totW/2, y0=H*0.36;
      ctx.textBaseline='middle';
      for(var i=0;i<mlen;i++){
        var bx=x0+i*(cw+gap);
        var shown=(i<=f.shown);
        var val=seq[i];
        var isOne=(val===1), isMinus=(val===f.n-1);
        var isCur=(i===f.shown);
        var col, fc;
        if(!shown){ col='#3c4a5e'; fc='rgba(122,184,255,0.03)'; }
        else if(isMinus){ col='#8fe3b5'; fc='rgba(143,227,181,0.22)'; }
        else if(isOne){ col=(f.verdict==='composite')?'#f4a0c0':'#8fe3b5'; fc=(f.verdict==='composite')?'rgba(244,160,192,0.22)':'rgba(143,227,181,0.18)'; }
        else if(isCur){ col='#ffb27a'; fc='rgba(255,178,122,0.22)'; }
        else { col='#7ab8ff'; fc='rgba(122,184,255,0.12)'; }
        ctx.fillStyle=fc; ctx.strokeStyle=col; ctx.lineWidth=isCur||isMinus?2.6:1.8;
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(bx,y0,cw,ch,9);}else{ctx.beginPath();ctx.rect(bx,y0,cw,ch);}
        ctx.fill(); ctx.stroke();
        ctx.textAlign='center';
        if(shown){
          ctx.fillStyle=col; ctx.font='600 20px monospace'; ctx.fillText(''+val, bx+cw/2, y0+ch/2);
        } else { ctx.fillStyle='#5a5a64'; ctx.font='600 16px monospace'; ctx.fillText('?', bx+cw/2, y0+ch/2); }
        ctx.textBaseline='alphabetic';
        ctx.fillStyle='#7f8a9b'; ctx.font='11px monospace';
        ctx.fillText(i===0?'a^d':('제곱 '+i), bx+cw/2, y0+ch+16);
        ctx.textBaseline='middle';
        // 제곱 화살표
        if(i<mlen-1){
          ctx.strokeStyle=shown?'#5a6b82':'#3c4a5e'; ctx.lineWidth=1.5;
          var ax=bx+cw, ay=y0+ch/2;
          ctx.beginPath(); ctx.moveTo(ax+1,ay); ctx.lineTo(ax+gap-1,ay); ctx.stroke();
        }
      }
      ctx.textBaseline='alphabetic';
      // 판정 배지
      if(f.verdict){
        var comp=(f.verdict==='composite');
        ctx.fillStyle=comp?'#f4a0c0':'#8fe3b5'; ctx.font='600 20px sans-serif'; ctx.textAlign='center';
        ctx.fillText(comp?('▶ 합성수 확정 — a=2가 증인  (561 = 3·11·17)'):'▶ 아마 소수 (이 밑 a는 통과)', W/2, H*0.66);
      }
    }
  },

  // ══════ NP(algo8_04) ▸ 중국인의 나머지 정리(CRT) ══════
  { id:'algo_br_crt', concept:true, branchOf:'algo2_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('중국인의 나머지 정리 (CRT)', W/2, H*0.12);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('서로소인 법들에 대한 나머지 조건을, 하나의 큰 법으로 유일하게 합친다', W/2, H*0.12+22);
      ctx.fillStyle='#bfe0ff'; ctx.font='600 17px ui-monospace, monospace'; ctx.textAlign='center';
      ctx.fillText('x ≡ 2 (mod 3)', W/2, H*0.30);
      ctx.fillText('x ≡ 3 (mod 5)', W/2, H*0.38);
      ctx.fillText('x ≡ 2 (mod 7)', W/2, H*0.46);
      ctx.fillStyle='#8fe3b5'; ctx.font='600 22px ui-monospace, monospace';
      ctx.fillText('⇒  x ≡ 23  (mod 105)', W/2, H*0.58);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('법 3·5·7이 서로소 → 0~104 중 모든 조건을 만족하는 x는 정확히 하나(=23)', W/2, H*0.66);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('합성 법을 작은 소법들로 쪼개 계산을 가볍게 → RSA·해시·큰수 연산·시그 가속에', W/2, H*0.74); }
  },

  // ══════ 스택(algo2_03) ▸ 선분 교차 판정(CCW) ══════
  { id:'algo_br_segintersect', concept:true, branchOf:'algo2_03',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('선분 교차 판정 — 외적(CCW)의 부호로', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('세 점의 방향(시계/반시계)을 외적 부호로 판정 → 두 선분이 교차하는지 O(1)', W/2, H*0.10+22);
      var A=[W*0.28,H*0.34], B=[W*0.66,H*0.66], C=[W*0.30,H*0.66], D=[W*0.66,H*0.34];
      ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(A[0],A[1]); ctx.lineTo(B[0],B[1]); ctx.stroke();
      ctx.strokeStyle='#8fe3b5'; ctx.beginPath(); ctx.moveTo(C[0],C[1]); ctx.lineTo(D[0],D[1]); ctx.stroke();
      function dot(p,lab,col){ ctx.fillStyle=col; ctx.beginPath(); ctx.arc(p[0],p[1],5,0,Math.PI*2); ctx.fill(); ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.fillText(lab,p[0],p[1]-10); }
      dot(A,'A','#7ab8ff'); dot(B,'B','#7ab8ff'); dot(C,'C','#8fe3b5'); dot(D,'D','#8fe3b5');
      // 교차점 표시
      ctx.fillStyle='#ffb27a'; ctx.beginPath(); ctx.arc(W*0.47,H*0.50,7,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#ffb27a'; ctx.font='600 13px sans-serif'; ctx.fillText('교차!', W*0.47,H*0.50-14);
      ctx.fillStyle='#bfe0ff'; ctx.font='14px ui-monospace, monospace'; ctx.textAlign='center';
      ctx.fillText('CCW(A,B,C) · CCW(A,B,D) < 0   그리고   CCW(C,D,A) · CCW(C,D,B) < 0', W/2, H*0.82);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('= C,D가 직선 AB의 서로 반대편 + A,B가 직선 CD의 서로 반대편 → 교차. (한 점이 0이면 일직선 처리)', W/2, H*0.82+22); }
  },

  // ══════ 볼록껍질(algo2_03) ▸ 회전하는 캘리퍼스(지름) ══════
  { id:'algo_br_calipers', concept:true, branchOf:'algo2_03',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, cx=W/2, cy=H*0.46, R=Math.min(W*0.18,H*0.26);
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('회전하는 캘리퍼스 — 볼록 껍질의 지름을 O(n)에', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('볼록 다각형을 두 평행선(캘리퍼스)으로 감싸 함께 돌리며 가장 먼 점 쌍을 찾는다', W/2, H*0.10+22);
      var pts=[]; for(var i=0;i<6;i++){ var a=-Math.PI/2+i*Math.PI*2/6 + 0.3; pts.push([cx+R*Math.cos(a)*(1+0.15*Math.sin(i)), cy+R*Math.sin(a)]); }
      ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2; ctx.beginPath();
      for(var j=0;j<pts.length;j++){ if(j===0)ctx.moveTo(pts[j][0],pts[j][1]); else ctx.lineTo(pts[j][0],pts[j][1]); } ctx.closePath(); ctx.stroke();
      pts.forEach(function(p){ ctx.fillStyle='#7ab8ff'; ctx.beginPath(); ctx.arc(p[0],p[1],4,0,Math.PI*2); ctx.fill(); });
      // 가장 먼 두 점(지름) + 평행 캘리퍼스
      var p0=pts[0], p3=pts[3];
      ctx.strokeStyle='#ffb27a'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(p0[0],p0[1]); ctx.lineTo(p3[0],p3[1]); ctx.stroke();
      ctx.fillStyle='#ffb27a'; ctx.font='600 13px sans-serif'; ctx.fillText('지름(최장 거리)', cx, cy-R-12);
      var dx=p3[0]-p0[0], dy=p3[1]-p0[1], d=Math.hypot(dx,dy), nx=-dy/d*40, ny=dx/d*40;
      ctx.strokeStyle='rgba(143,227,181,0.7)'; ctx.lineWidth=1.5; ctx.setLineDash([6,4]);
      ctx.beginPath(); ctx.moveTo(p0[0]-dx/d*30+nx, p0[1]-dy/d*30+ny); ctx.lineTo(p0[0]+dx/d*30+nx, p0[1]+dy/d*30+ny); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(p3[0]-dx/d*30-nx, p3[1]-dy/d*30-ny); ctx.lineTo(p3[0]+dx/d*30-nx, p3[1]+dy/d*30-ny); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif'; ctx.textAlign='center';
      ctx.fillText('두 평행선을 같은 방향으로 돌리면 접점 쌍이 후보 = O(n)으로 지름·너비·최소 외접 사각형까지', W/2, H*0.86); }
  },

  // ══════ 격자DP(algo7_05) ▸ 볼록 껍질 트릭(CHT) ══════
  { id:'algo_br_cht', concept:true, branchOf:'algo7_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, x0=W*0.16, x1=W*0.86, y0=H*0.30, y1=H*0.74;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('볼록 껍질 트릭(CHT) — 직선들의 최솟값을 빠르게', W/2, H*0.11);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('dp[i] = min_j ( m_j·x + b_j ) 꼴: 후보 직선들의 "아래 껍질"만 남겨 질의 O(log n)~O(1)', W/2, H*0.11+22);
      var lines=[[-1.4,0.95],[ -0.5,0.55],[0.2,0.30],[1.1,0.18]];   // m, b(정규화)
      function X(t){ return x0+(x1-x0)*t; } function Y(v){ return y1-(y1-y0)*Math.max(0,Math.min(1,v)); }
      lines.forEach(function(L,i){ ctx.strokeStyle=i===1||i===2?'#8fe3b5':'rgba(122,184,255,0.35)'; ctx.lineWidth=i===1||i===2?2.4:1.5;
        ctx.beginPath(); ctx.moveTo(X(0), Y(L[1])); ctx.lineTo(X(1), Y(L[0]*1+L[1])); ctx.stroke(); });
      // 아래 껍질(최솟값) 강조 — 굵은 초록 꺾은선
      ctx.strokeStyle='#ffb27a'; ctx.lineWidth=3; ctx.beginPath();
      ctx.moveTo(X(0),Y(0.30)); ctx.lineTo(X(0.45),Y(0.42)); ctx.lineTo(X(1),Y(0.18)); ctx.stroke();
      ctx.fillStyle='#ffb27a'; ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.fillText('← 아래 껍질(각 x의 최솟값)', X(0.5), Y(0.55));
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif'; ctx.textAlign='center';
      ctx.fillText('새 직선을 기울기 순으로 추가하며 불필요한 직선 제거 → O(n). 질의 x가 단조면 포인터로 O(1)', W/2, H*0.84);
      ctx.fillStyle='#8a8893'; ctx.fillText('O(n²) DP를 O(n log n)/O(n)으로. 일반화 = Li Chao 트리(임의 추가·질의)', W/2, H*0.84+22); }
  },

  // ══════ 격자DP(algo7_05) ▸ 분할 정복 최적화 ══════
  { id:'algo_br_dcopt', concept:true, branchOf:'algo7_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('분할 정복 최적화 — 최적 분기점의 단조성 이용', W/2, H*0.11);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('dp[i][j] = min_k dp[i−1][k] + C(k,j) 에서 최적 k = opt(j)가 j에 단조 증가하면…', W/2, H*0.11+22);
      ctx.fillStyle='#bfe0ff'; ctx.font='600 14px ui-monospace, monospace'; ctx.textAlign='center';
      ctx.fillText('opt(j₁) ≤ opt(jₘᵢ𝒹) ≤ opt(j₂)', W/2, H*0.32);
      // 가운데부터 분할정복하는 구조 그림
      var mid=W/2, y=H*0.44;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=2;
      function seg(x1,x2,yy,col,lab){ ctx.strokeStyle=col; ctx.beginPath(); ctx.moveTo(x1,yy); ctx.lineTo(x2,yy); ctx.stroke();
        ctx.fillStyle=col; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText(lab,(x1+x2)/2,yy-8); }
      seg(W*0.20,W*0.80,y,'#7ab8ff','구간 [lo, hi] — 가운데 mid의 최적 k를 직접 탐색');
      seg(W*0.20,W*0.49,y+H*0.13,'#8fe3b5','왼쪽: k ∈ [klo, opt(mid)]');
      seg(W*0.51,W*0.80,y+H*0.13,'#ffb27a','오른쪽: k ∈ [opt(mid), khi]');
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif'; ctx.textAlign='center';
      ctx.fillText('mid의 최적 k를 찾으면, 그 값이 양쪽 절반의 k 범위를 갈라줌 → 한 층이 O(n log n)', W/2, H*0.78);
      ctx.fillStyle='#8a8893'; ctx.fillText('층이 m개면 전체 O(m·n log n). C가 사각부등식(QI)을 만족할 때 단조성 보장', W/2, H*0.78+22); }
  },

  // ══════ 격자DP(algo7_05) ▸ 비트마스크 DP(외판원) ══════
  { id:'algo_br_bitmaskdp', concept:true, branchOf:'algo7_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('비트마스크 DP — "방문한 집합"을 정수 한 개로', W/2, H*0.11);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('부분집합을 비트(0/1)로 인코딩 → dp[mask][i] = mask 정점을 다 방문하고 i에 있을 때 최소비용', W/2, H*0.11+22);
      // 5개 도시, mask 예: 01011 = {0,1,3} 방문
      var bits=['1','1','0','1','0'];
      var bw=W*0.07, gap=W*0.02, total=bits.length*bw+(bits.length-1)*gap, x0=W/2-total/2, y=H*0.36;
      for(var i=0;i<bits.length;i++){ var x=x0+i*(bw+gap), on=bits[i]==='1';
        ctx.fillStyle=on?'rgba(143,227,181,0.28)':'rgba(255,255,255,0.04)'; ctx.strokeStyle=on?'#8fe3b5':'rgba(255,255,255,0.2)'; ctx.lineWidth=2;
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,bw,bw,7);ctx.fill();ctx.stroke();}else ctx.strokeRect(x,y,bw,bw);
        ctx.fillStyle=on?'#8fe3b5':'#6f6e7a'; ctx.font='600 20px ui-monospace, monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(bits[i],x+bw/2,y+bw/2); ctx.textBaseline='alphabetic';
        ctx.fillStyle='#6f7686'; ctx.font='11px sans-serif'; ctx.fillText('도시'+i, x+bw/2, y+bw+14); }
      ctx.fillStyle='#bfe0ff'; ctx.font='600 15px ui-monospace, monospace'; ctx.textAlign='center';
      ctx.fillText('mask = 01011₂ = 11  →  도시 {0,1,3} 방문 완료', W/2, H*0.58);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('상태 = 2ⁿ개 부분집합 × n개 현재위치 → 외판원(TSP)을 O(2ⁿ·n²)에 (브루트포스 n!보다 압도적)', W/2, H*0.68);
      ctx.fillStyle='#8a8893'; ctx.fillText('전이: dp[mask|1<<j][j] = min( dp[mask][i] + dist[i][j] ). n ≤ 20 규모에 실전적', W/2, H*0.68+22); }
  },

  // ══════ 세그먼트트리(algo2_01) ▸ 영속 세그먼트 트리 ══════
  { id:'algo_br_perseg', concept:true, branchOf:'algo2_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('영속(Persistent) 세그먼트 트리 — 과거 버전을 보존', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('갱신할 때 바뀌는 경로의 노드만 새로 만들고(O(log n)개), 나머지는 옛 버전과 공유', W/2, H*0.10+22);
      // 두 버전의 루트 → 공유 노드
      function nd(x,y,col,lab){ ctx.fillStyle=col.replace(')',',0.2)').replace('rgb','rgba'); ctx.fillStyle=col==='#ffb27a'?'rgba(255,178,122,0.22)':col==='#8fe3b5'?'rgba(143,227,181,0.22)':'rgba(122,184,255,0.16)'; ctx.strokeStyle=col; ctx.lineWidth=2;
        ctx.beginPath(); ctx.arc(x,y,16,0,Math.PI*2); ctx.fill(); ctx.stroke();
        if(lab){ ctx.fillStyle=col; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText(lab,x,y-22); } }
      function ln(a,b,dash){ ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1.6; ctx.setLineDash(dash?[4,3]:[]); ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke(); ctx.setLineDash([]); }
      var BL='#7ab8ff', GR='#8fe3b5', OR='#ffb27a';
      var r0=[W*0.32,H*0.30], r1=[W*0.60,H*0.30];      // 버전0 루트(파랑), 버전1 루트(주황=새로 만든 경로)
      var L=[W*0.24,H*0.52], R=[W*0.50,H*0.52], Rn=[W*0.70,H*0.52];  // 왼쪽(공유), 오른쪽(공유), 오른쪽 새버전
      var ll=[W*0.18,H*0.72], lr=[W*0.34,H*0.72], rl=[W*0.46,H*0.72], rr=[W*0.58,H*0.72], rrn=[W*0.78,H*0.72];
      // 버전0 트리(파랑)
      ln(r0,L); ln(r0,R); ln(L,ll); ln(L,lr); ln(R,rl); ln(R,rr);
      // 버전1: 루트→공유 왼쪽, 새 오른쪽→공유 rl + 새 rrn
      ln(r1,L,1); ln(r1,Rn); ln(Rn,rl,1); ln(Rn,rrn);
      [ll,lr,rl,rr].forEach(function(p){ nd(p[0],p[1],BL); }); nd(rrn[0],rrn[1],OR);
      nd(L[0],L[1],BL); nd(R[0],R[1],BL); nd(Rn[0],Rn[1],OR);
      nd(r0[0],r0[1],BL,'버전 0'); nd(r1[0],r1[1],OR,'버전 1');
      ctx.fillStyle='#ffb27a'; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('주황 = 새로 만든 노드(루트→리프 한 경로뿐). 점선 = 옛 버전 노드 재사용', W/2, H*0.86);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('갱신 1회 = O(log n) 추가 메모리. k번째 작은 수·구간 질의(머지소트트리 대체) 등에', W/2, H*0.86+22); }
  },

  // ══════ BST탐색(algo5_03) ▸ Heavy-Light 분해 ══════
  { id:'algo_br_hld', concept:true, branchOf:'algo5_03',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('Heavy-Light 분해 — 트리 경로 질의를 O(log²n)에', W/2, H*0.09);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('각 노드는 "자식 중 서브트리가 가장 큰 쪽"으로 굵은(heavy) 간선 → 트리를 몇 개의 사슬로', W/2, H*0.09+22);
      var P={1:[0.5,0.16],2:[0.32,0.36],3:[0.70,0.36],4:[0.20,0.58],5:[0.42,0.58],6:[0.70,0.58],7:[0.42,0.80]};
      var heavy=[[1,2],[2,5],[5,7],[1,3],[3,6]];  // 굵은 사슬 간선
      var light=[[2,4],[3,3]];
      var allE=[[1,2],[1,3],[2,4],[2,5],[3,6],[5,7]];
      function xy(k){ return [W*0.12+P[k][0]*W*0.76, H*0.20+P[k][1]*H*0.62]; }
      function isHeavy(a,b){ return heavy.some(function(e){return (e[0]==a&&e[1]==b)||(e[0]==b&&e[1]==a);}); }
      allE.forEach(function(e){ var a=xy(e[0]),b=xy(e[1]), hv=isHeavy(e[0],e[1]);
        ctx.strokeStyle=hv?'#ffb27a':'rgba(122,184,255,0.4)'; ctx.lineWidth=hv?4:1.6; ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke(); });
      Object.keys(P).forEach(function(k){ var p=xy(k); AV.node(E,p[0],p[1],k,{r:18,fs:14,fill:'rgba(122,184,255,0.16)',stroke:'#7ab8ff',text:'#dfeefb'}); });
      ctx.fillStyle='#ffb27a'; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('굵은 주황 = heavy 사슬. 각 사슬을 세그먼트 트리에 일렬로 올림', W/2, H*0.86);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('두 노드 사이 경로는 사슬을 O(log n)번만 갈아탐 → 경로 합/최댓값 질의·갱신 O(log²n)', W/2, H*0.86+22); }
  },

  // ══════ 정렬(algo3_04) ▸ Mo's 알고리즘(쿼리 정렬) ══════
  { id:'algo_br_mo', branchOf:'algo3_04',
    code:[
      'sort(queries, by block of L, then R)',
      'curL = 0;  curR = -1;  ans = 0',
      'for each query (l, r):',
      '  while curR < r: add(++curR)   // 오른쪽 확장',
      '  while curL > l: add(--curL)   // 왼쪽 확장',
      '  while curR > r: remove(curR--) // 오른쪽 축소',
      '  while curL < l: remove(curL++) // 왼쪽 축소',
      '  answer[query] = ans           // 서로 다른 수 개수'
    ],
    build:function(V){
      var A=[1,2,1,3,2,1,4,2], n=A.length;
      var B=3; // 블록 크기 (~√8≈2.83 → 3)
      // 질의 (l,r) — id 보존
      var raw=[{l:1,r:4,id:0},{l:5,r:6,id:2},{l:2,r:5,id:3}];
      // 블록 of l, then r 로 정렬
      var Q=raw.slice().sort(function(a,b){
        var ba=Math.floor(a.l/B), bb=Math.floor(b.l/B);
        if(ba!==bb) return ba-bb; return a.r-b.r; });
      var st=[], freq={}, distinct=0;
      function add(i){ var v=A[i]; if(!freq[v])freq[v]=0; if(freq[v]===0)distinct++; freq[v]++; }
      function rem(i){ var v=A[i]; freq[v]--; if(freq[v]===0)distinct--; }
      var curL=0,curR=-1;
      function snap(line,cap,qi,mode){
        st.push({line:line,cap:cap,arr:A.slice(),n:n,B:B,Q:Q,
          curL:curL,curR:curR,distinct:distinct,qi:(qi==null?-1:qi),mode:mode||''}); }
      var ordtxt=Q.map(function(q){ return '['+q.l+','+q.r+']'; }).join(' ');
      snap([0],'질의들을 <b>(l이 속한 블록 → r)</b> 순으로 정렬했습니다. 블록 크기 B=3. 처리 순서: <b>'+ordtxt+'</b>.',-1,'sort');
      snap([1],'두 포인터 curL=0, curR=−1 (빈 구간), 서로 다른 수 ans=0 으로 시작합니다.',-1,'init');
      for(var k=0;k<Q.length;k++){
        var q=Q[k];
        snap([2],'<b>질의 '+(k+1)+': [l='+q.l+', r='+q.r+']</b> 처리. 현재 구간 ['+curL+','+curR+']에서 포인터를 이 구간으로 옮깁니다.',k,'query');
        while(curR<q.r){ curR++; add(curR); snap([3],'curR 확장 → '+curR+': A['+curR+']='+A[curR]+' <b>추가</b>. 서로 다른 수 = '+distinct+'.',k,'addR'); }
        while(curL>q.l){ curL--; add(curL); snap([4],'curL 확장 → '+curL+': A['+curL+']='+A[curL]+' <b>추가</b>. 서로 다른 수 = '+distinct+'.',k,'addL'); }
        while(curR>q.r){ rem(curR); snap([5],'curR 축소: A['+curR+']='+A[curR]+' <b>제거</b>. 서로 다른 수 = '+distinct+'.',k,'remR'); curR--; }
        while(curL<q.l){ rem(curL); snap([6],'curL 축소: A['+curL+']='+A[curL]+' <b>제거</b>. 서로 다른 수 = '+distinct+'.',k,'remL'); curL++; }
        snap([7],'구간 ['+q.l+','+q.r+'] 완성 → <b>서로 다른 수 = '+distinct+'</b> 를 답으로 기록.',k,'answer');
      }
      snap([7],'<b>완료!</b> 모든 질의를 두 포인터를 조금씩만 움직여 답했습니다. 총 이동 <b>O((n+q)√n)</b>.',-1,'done');
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H,A=f.arr,n=f.n,B=f.B;
      ctx.textAlign='center'; ctx.fillStyle='#cfd8e6'; ctx.font='600 15px sans-serif';
      ctx.fillText("Mo's 알고리즘 — 두 포인터로 구간 내 서로 다른 수 세기", W/2, H*0.09);
      var cw=Math.min(60,(W*0.78)/n), gap=8;
      var totalW=n*cw+(n-1)*gap, x0=W/2-totalW/2, y0=H*0.26, ch=46;
      // block separators background
      for(var i=0;i<n;i++){
        var x=x0+i*(cw+gap), inRange=(i>=f.curL && i<=f.curR && f.curR>=f.curL);
        var blk=Math.floor(i/B);
        var col,fill,tcol;
        if(i===f.curL && i===f.curR && inRange){ col='#ffb27a'; }
        var isEnd=(i===f.curL||i===f.curR)&&inRange;
        if(inRange){ fill='rgba(143,227,181,0.16)'; col='#8fe3b5'; tcol='#dfeefb'; }
        else { fill=(blk%2===0)?'rgba(122,184,255,0.07)':'rgba(122,184,255,0.13)'; col='#3c4a5e'; tcol='#9fb0c4'; }
        ctx.fillStyle=fill; ctx.strokeStyle=col; ctx.lineWidth=inRange?2:1;
        if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(x,y0,cw,ch,6); ctx.fill(); ctx.stroke(); }
        else { ctx.fillRect(x,y0,cw,ch); ctx.strokeRect(x,y0,cw,ch); }
        ctx.fillStyle=tcol; ctx.font='600 18px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(A[i], x+cw/2, y0+ch/2); ctx.textBaseline='alphabetic';
        ctx.fillStyle='#7f8a9b'; ctx.font='10px monospace'; ctx.fillText(i, x+cw/2, y0+ch+14);
      }
      // block label row
      ctx.fillStyle='#6f6e7a'; ctx.font='10px sans-serif';
      for(var b=0;b*B<n;b++){ var bs=b*B, be=Math.min(n-1,b*B+B-1);
        var bx=(x0+bs*(cw+gap)+x0+be*(cw+gap)+cw)/2; ctx.fillText('블록'+b, bx, y0-8); }
      // pointer markers L / R
      function ptr(idx,lab,col){ if(idx<0||idx>=n)return; var px=x0+idx*(cw+gap)+cw/2;
        ctx.fillStyle=col; ctx.font='600 13px monospace'; ctx.textAlign='center';
        ctx.fillText(lab, px, y0-22);
        ctx.strokeStyle=col; ctx.lineWidth=2; ctx.beginPath();
        ctx.moveTo(px,y0-18); ctx.lineTo(px,y0-2); ctx.stroke(); }
      if(f.curR>=f.curL){ ptr(f.curL,'L','#ffb27a'); ptr(f.curR,'R','#7ab8ff'); }
      // distinct count
      ctx.textAlign='center'; ctx.fillStyle=(f.mode==='answer'||f.mode==='done')?'#8fe3b5':'#ffb27a'; ctx.font='600 17px sans-serif';
      ctx.fillText('현재 구간 ['+f.curL+', '+f.curR+'] 의 서로 다른 수 = '+f.distinct, W/2, H*0.56);
      // queries list
      ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillText('정렬된 질의(블록→r):', x0, H*0.68);
      var qx=x0, qy=H*0.72;
      for(var k=0;k<f.Q.length;k++){ var q=f.Q[k], hot=(k===f.qi), done=(f.qi>k)||(f.mode==='done');
        var lbl='['+q.l+','+q.r+']'; ctx.font='600 13px monospace';
        var w=ctx.measureText(lbl).width+18;
        ctx.fillStyle=hot?'rgba(255,178,122,0.25)':done?'rgba(143,227,181,0.16)':'rgba(122,184,255,0.10)';
        ctx.strokeStyle=hot?'#ffb27a':done?'#8fe3b5':'#3c4a5e'; ctx.lineWidth=hot?2.2:1.4;
        if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(qx,qy,w,28,6); ctx.fill(); ctx.stroke(); }
        else { ctx.fillRect(qx,qy,w,28); }
        ctx.fillStyle=hot?'#ffb27a':done?'#8fe3b5':'#cfe0ff'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(lbl, qx+w/2, qy+14); ctx.textBaseline='alphabetic'; ctx.textAlign='left';
        qx+=w+10; }
      ctx.fillStyle='#9b99a3'; ctx.font='11px sans-serif'; ctx.textAlign='center';
      ctx.fillText('초록 칸=현재 구간 · L/R=두 포인터 · ±1 추가/제거로 답 갱신', W/2, H*0.94); }
  },

  // ══════ 이진트리(algo5_01) ▸ 스플레이 트리 ══════
  { id:'algo_br_splay', concept:true, branchOf:'algo5_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('스플레이 트리 — 접근한 노드를 루트로 끌어올리기', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('찾거나 삽입한 노드를 회전(zig·zig-zig·zig-zag)으로 루트까지 → 자주 쓰는 것이 빨라짐', W/2, H*0.10+22);
      // before/after: x 깊은 곳 → 루트
      function tree(cx, nodes, edges, hlx, lab){ var ctx2=ctx;
        Object.keys(edges).forEach(function(){}); edges.forEach(function(e){ var a=nodes[e[0]],b=nodes[e[1]]; ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.lineWidth=1.8; ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke(); });
        Object.keys(nodes).forEach(function(k){ var p=nodes[k], hot=(k===hlx); AV.node(E,p[0],p[1],k,{r:15,fs:13,fill:hot?'rgba(255,178,122,0.3)':'rgba(122,184,255,0.16)',stroke:hot?'#ffb27a':'#7ab8ff',text:hot?'#ffb27a':'#dfeefb'}); });
        ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText(lab, cx, H*0.30); }
      var bx=W*0.27, ax=W*0.73;
      // before: 루트A→B→C→x (한쪽으로 깊음), x 강조
      var nb={ 'A':[bx,H*0.40],'B':[bx-W*0.07,H*0.54],'C':[bx-W*0.13,H*0.68],'x':[bx-W*0.19,H*0.82] };
      tree(bx, nb, [['A','B'],['B','C'],['C','x']], 'x', '접근 전: x가 깊다');
      // 화살표
      AV.arrow(ctx, W*0.46, H*0.58, W*0.54, H*0.58, '#8fe3b5', 2.5);
      ctx.fillStyle='#8fe3b5'; ctx.font='13px sans-serif'; ctx.fillText('splay(x)', W*0.50, H*0.54);
      // after: x 루트
      var na={ 'x':[ax,H*0.40],'C':[ax-W*0.08,H*0.56],'A':[ax+W*0.08,H*0.56],'B':[ax-W*0.13,H*0.70] };
      tree(ax, na, [['x','C'],['x','A'],['C','B']], 'x', '접근 후: x가 루트');
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif'; ctx.textAlign='center';
      ctx.fillText('한 연산은 느릴 수 있어도 분할상환 O(log n). 최근·자주 쓰는 키가 위로 모이는 자기조정 BST', W/2, H*0.90); }
  },

  // ══════ DFS(algo6_04) ▸ 단절점·다리(절단 정점/간선) ══════
  { id:'algo_br_bridge', concept:true, branchOf:'algo6_04',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('단절점·다리 — 끊으면 그래프가 쪼개지는 곳', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('DFS 한 번으로: 발견시각 tin과 "역방향으로 돌아갈 수 있는 가장 위 low"를 비교', W/2, H*0.10+22);
      var P={A:[0.20,0.34],B:[0.40,0.30],C:[0.40,0.66],D:[0.66,0.48],E0:[0.86,0.48]};
      var edges=[['A','B'],['A','C'],['B','C'],['C','D'],['D','E0']];
      var bridges=[['C','D'],['D','E0']];   // 다리
      function xy(k){ return [W*0.10+P[k][0]*W*0.80, H*0.26+P[k][1]*H*0.46]; }
      function isB(a,b){ return bridges.some(function(e){return(e[0]==a&&e[1]==b)||(e[0]==b&&e[1]==a);}); }
      edges.forEach(function(e){ var a=xy(e[0]),b=xy(e[1]), br=isB(e[0],e[1]);
        ctx.strokeStyle=br?'#e2607a':'rgba(122,184,255,0.45)'; ctx.lineWidth=br?3.5:2; ctx.setLineDash(br?[6,4]:[]); ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke(); ctx.setLineDash([]); });
      var arts={C:1,D:1};  // 단절점
      Object.keys(P).forEach(function(k){ var p=xy(k), art=arts[k];
        AV.node(E,p[0],p[1],k==='E0'?'E':k,{r:19,fs:14,fill:art?'rgba(255,178,122,0.26)':'rgba(122,184,255,0.16)',stroke:art?'#ffb27a':'#7ab8ff',text:art?'#ffb27a':'#dfeefb',tag:art?'단절점':null}); });
      ctx.fillStyle='#e2607a'; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('빨강 점선 = 다리(끊으면 연결 끊김): C-D, D-E. 주황 = 단절점: C, D', W/2, H*0.84);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('간선 (u,v): low[v] > tin[u] 면 다리. 정점 u: 자식 v가 low[v] ≥ tin[u] 면 단절점. 전체 O(V+E)', W/2, H*0.84+22); }
  },

  // ══════ 그래프표현(algo6_02) ▸ 이분 그래프 판정(2색칠) ══════
  { id:'algo_br_bipartite', concept:true, branchOf:'algo6_02',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('이분 그래프 판정 — 두 색으로 칠할 수 있나', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('BFS/DFS로 이웃마다 반대 색을 칠하다, 같은 색 이웃을 만나면(홀수 사이클) 불가능', W/2, H*0.10+22);
      var P={A:[0.22,0.30,0],B:[0.22,0.70,0],C:[0.52,0.30,1],D:[0.52,0.70,1],E0:[0.80,0.50,0]};
      var edges=[['A','C'],['A','D'],['B','C'],['B','D'],['C','E0'],['D','E0']];
      function xy(k){ return [W*0.12+P[k][0]*W*0.76, H*0.24+P[k][1]*H*0.50]; }
      edges.forEach(function(e){ var a=xy(e[0]),b=xy(e[1]); ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke(); });
      Object.keys(P).forEach(function(k){ var p=xy(k), c=P[k][2];
        AV.node(E,p[0],p[1],k==='E0'?'E':k,{r:20,fs:14,fill:c?'rgba(255,178,122,0.26)':'rgba(122,184,255,0.26)',stroke:c?'#ffb27a':'#7ab8ff',text:c?'#ffb27a':'#bfe0ff'}); });
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('파랑·주황 두 색으로 모순 없이 칠해짐 → 이분 그래프(2색 가능)', W/2, H*0.84);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('이분 ⇔ 홀수 길이 사이클이 없음. 매칭(쾨니그 정리)·스케줄링·2-색칠 문제의 토대. O(V+E)', W/2, H*0.84+22); }
  },

  // ══════ 최단경로(algo6_05) ▸ 일반 그래프 최대 매칭(블로섬) ══════
  { id:'algo_br_blossom', concept:true, branchOf:'algo6_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('일반 그래프 최대 매칭 — 블로섬(꽃) 수축', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('이분이 아닌 그래프엔 "홀수 사이클(블로섬)"이 증가경로 탐색을 방해 → 통째로 수축해 해결', W/2, H*0.10+22);
      // 홀수 사이클(블로섬) 5개 정점 + 줄기
      var cx=W*0.42, cy=H*0.48, R=Math.min(W*0.13,H*0.18);
      var pen=[]; for(var i=0;i<5;i++){ var a=-Math.PI/2+i*Math.PI*2/5; pen.push([cx+R*Math.cos(a),cy+R*Math.sin(a)]); }
      ctx.strokeStyle='#ffb27a'; ctx.lineWidth=2.5; ctx.beginPath();
      for(var j=0;j<5;j++){ var p=pen[j],q=pen[(j+1)%5]; ctx.moveTo(p[0],p[1]); ctx.lineTo(q[0],q[1]); } ctx.stroke();
      var stem=[W*0.16,H*0.48];
      ctx.strokeStyle='rgba(122,184,255,0.5)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(stem[0],stem[1]); ctx.lineTo(pen[3][0],pen[3][1]); ctx.stroke();
      pen.forEach(function(p){ AV.node(E,p[0],p[1],'',{r:13,fs:1,fill:'rgba(255,178,122,0.26)',stroke:'#ffb27a',text:'#ffb27a'}); });
      AV.node(E,stem[0],stem[1],'',{r:13,fs:1,fill:'rgba(122,184,255,0.16)',stroke:'#7ab8ff',text:'#dfeefb'});
      // 수축된 슈퍼노드
      AV.node(E,W*0.74,cy,'B',{r:26,fs:16,fill:'rgba(143,227,181,0.25)',stroke:'#8fe3b5',text:'#8fe3b5',tag:'수축'});
      AV.arrow(ctx, cx+R+18, cy, W*0.74-30, cy, '#8fe3b5', 2.4);
      ctx.fillStyle='#ffb27a'; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('주황 5각형 = 블로섬(홀수 사이클). 한 점으로 수축하면 다시 이분처럼 증가경로 탐색 가능', W/2, H*0.84);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('에드몬즈 블로섬 알고리즘 O(V³)(V=정점 수) 또는 O(V·E)(E=간선 수). 이분 매칭(증가경로)을 일반 그래프로 확장한 고전', W/2, H*0.84+22); }
  },

  // ══════ DFS(algo6_04) ▸ 위상정렬 응용: DAG 최장경로/일정 ══════
  { id:'algo_br_daglongest', concept:true, branchOf:'algo6_04',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('DAG 최장 경로 — 일정 관리(임계 경로)', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('일반 그래프의 최장 경로는 NP-난해지만, 사이클 없는 DAG에선 위상순서 DP로 O(V+E)', W/2, H*0.10+22);
      var P={A:[0.14,0.50],B:[0.38,0.28],C:[0.38,0.72],D:[0.64,0.50],F:[0.88,0.50]};
      var E2=[['A','B',3],['A','C',2],['B','D',4],['C','D',1],['D','F',2]];
      function xy(k){ return [W*0.10+P[k][0]*W*0.80, H*0.28+P[k][1]*H*0.42]; }
      var crit=[['A','B'],['B','D'],['D','F']];  // 임계 경로 A→B→D→F = 9
      function isC(a,b){ return crit.some(function(e){return e[0]==a&&e[1]==b;}); }
      E2.forEach(function(e){ var a=xy(e[0]),b=xy(e[1]), cc=isC(e[0],e[1]); gedge(E,a,b, cc?'#ffb27a':'rgba(255,255,255,0.2)', cc?3:1.6, e[2]); });
      var dist={A:0,B:3,C:2,D:7,F:9};
      Object.keys(P).forEach(function(k){ var p=xy(k); AV.node(E,p[0],p[1],k+':'+dist[k],{r:20,fs:13,fill:'rgba(122,184,255,0.16)',stroke:'#7ab8ff',text:'#dfeefb'}); });
      ctx.fillStyle='#ffb27a'; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('주황 = 임계 경로 A→B→D→F (길이 9). 라벨 = 시작에서의 최장 거리', W/2, H*0.84);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('위상순서대로 dist[v] = max(dist[u] + w)로 완화. 프로젝트 일정의 "임계 경로"가 곧 총 소요시간', W/2, H*0.84+22); }
  },

  // ══════ 선형탐색(algo4_01) ▸ 접미사 오토마톤(SAM) ══════
  { id:'algo_br_sam', concept:true, branchOf:'algo4_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('접미사 오토마톤(SAM) — 모든 부분문자열을 선형 크기로', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('문자열의 모든 부분문자열을 인식하는 최소 DFA. 상태·간선이 O(n)뿐', W/2, H*0.10+22);
      // 작은 오토마톤: 상태들 + 전이
      var P={0:[0.14,0.50],1:[0.36,0.32],2:[0.36,0.68],3:[0.62,0.50],4:[0.86,0.50]};
      var E2=[[0,1,'a'],[0,2,'b'],[1,3,'b'],[2,3,'a'],[3,4,'a']];
      function xy(k){ return [W*0.10+P[k][0]*W*0.80, H*0.26+P[k][1]*H*0.46]; }
      E2.forEach(function(e){ gedge(E,xy(e[0]),xy(e[1]),'rgba(143,227,181,0.6)',2,e[2]); });
      Object.keys(P).forEach(function(k){ var p=xy(k), init=(k==='0');
        AV.node(E,p[0],p[1],k,{r:18,fs:13,fill:init?'rgba(255,178,122,0.24)':'rgba(122,184,255,0.16)',stroke:init?'#ffb27a':'#7ab8ff',text:init?'#ffb27a':'#dfeefb',tag:init?'시작':null}); });
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('시작에서 글자를 따라가면 도달 가능한 모든 경로 = 모든 부분문자열', W/2, H*0.84);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('상태 ≤ 2n−1, 간선 ≤ 3n−4, 온라인 O(n) 구축. 서로 다른 부분문자열 개수·최장 공통 부분문자열·검색에', W/2, H*0.84+22); }
  },

  // ══════ NP(algo8_04) ▸ FFT로 큰 수·다항식 곱셈 ══════
  { id:'algo_br_fftmul', branchOf:'algo8_04',
    code:[
      'MULTIPLY(A, B):            // 다항식 곱',
      '  n ← 2의 거듭제곱 ≥ degA+degB+1',
      '  PA ← FFT(A)              // ① 점값으로 평가',
      '  PB ← FFT(B)',
      '  for k in 0..n-1:         // ② 점별 곱 (O(n))',
      '    PC[k] ← PA[k] · PB[k]',
      '  C ← inverseFFT(PC)       // ③ 계수로 보간',
      '  return C                 // 전체 O(n log n)'
    ],
    build:function(V){
      // (1+2x)(3+4x) = 3 +10x +8x^2.  n=4.
      var A=[1,2,0,0], B=[3,4,0,0], n=4, st=[];
      function snap(line,cap,extra){ var f={line:line,cap:cap,A:A,B:B,n:n}; if(extra)for(var k in extra)f[k]=extra[k]; st.push(f); }
      function dft(a,inv){ var out=[]; for(var k=0;k<n;k++){ var re=0,im=0;
        for(var j=0;j<n;j++){ var ang=(inv?2:-2)*Math.PI*k*j/n; re+=a[j]*Math.cos(ang); im+=a[j]*Math.sin(ang); }
        out.push({re:inv?re/n:re, im:inv?im/n:im}); } return out; }
      function cmul(p,q){ return {re:p.re*q.re-p.im*q.im, im:p.re*q.im+p.im*q.re}; }
      var PA=dft(A,false), PB=dft(B,false);
      var PC=[]; for(var k=0;k<n;k++) PC.push(cmul(PA[k],PB[k]));
      var C=dft(PC,true);
      snap([0,1],'두 다항식 A=1+2x, B=3+4x 를 곱합니다. 계수로 직접 곱하면 O(n²). 길이를 <b>n=4</b>(2의 거듭제곱)로 패딩.',{stage:'start'});
      snap([2,3],'<b>① 평가(FFT):</b> A,B를 4개 단위근에서의 <b>점값</b>으로. PA=[3, 1−2i, −1, 1+2i], PB=[7, 3−4i, −1, 3+4i].',{stage:'eval',PA:PA,PB:PB});
      for(var m=0;m<n;m++){
        snap([4,5],'<b>② 점별 곱 k='+m+':</b> PC['+m+'] = PA['+m+']·PB['+m+'] = <b>'+fmtC(PC[m])+'</b>. (각 점에서 그냥 한 번 곱 — O(n)!)',{stage:'mul',PA:PA,PB:PB,PC:PC.slice(0,m+1),mk:m});
      }
      snap(6,'<b>③ 보간(역FFT):</b> 점값 PC를 다시 계수로 되돌립니다. 역변환도 단위근+분할정복으로 O(n log n).',{stage:'interp',PA:PA,PB:PB,PC:PC,C:C});
      snap(7,'<b>완료!</b> C = [3, 10, 8, 0] → <b>3 + 10x + 8x²</b>. (1+2x)(3+4x)=3+10x+8x² 정답. 전체 <b>O(n log n)</b>.',{stage:'done',PA:PA,PB:PB,PC:PC,C:C});
      function fmtC(c){ var r=Math.round(c.re*100)/100, i=Math.round(c.im*100)/100;
        if(Math.abs(i)<1e-6) return ''+r; return r+(i>=0?'+':'−')+Math.abs(i)+'i'; }
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H;
      function fmtC(c){ if(c==null) return '·'; var r=Math.round(c.re*100)/100, i=Math.round(c.im*100)/100;
        if(Math.abs(i)<1e-6) return ''+r; return r+(i>=0?'+':'−')+Math.abs(i)+'i'; }
      function fmtR(c){ return ''+(Math.round(c.re*100)/100); }
      ctx.textAlign='center'; ctx.textBaseline='alphabetic';
      ctx.fillStyle='#cfd8e6'; ctx.font='600 15px sans-serif';
      ctx.fillText('FFT 곱셈 = 평가(FFT) → 점별 곱 → 보간(역FFT)', W/2, H*0.085);
      var n=f.n, rx=W*0.06, rw=W*0.88;
      function row(label,arr,y,colf,fmt){ ctx.textAlign='left'; ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif';
        ctx.fillText(label, rx, y-6);
        var bw=Math.min(120,rw/n-10);
        for(var i=0;i<n;i++){ var x=rx+i*(bw+10); var col=colf?colf(i):null;
          ctx.fillStyle=col?col.fill:'rgba(122,184,255,0.10)'; ctx.strokeStyle=col?col.stroke:'#3c4a5e'; ctx.lineWidth=col?2:1;
          if(ctx.roundRect){ctx.beginPath(); ctx.roundRect(x,y,bw,30,6); ctx.fill(); ctx.stroke();} else {ctx.fillRect(x,y,bw,30); ctx.strokeRect(x,y,bw,30);}
          ctx.fillStyle=col?col.text:'#dfeefb'; ctx.font='600 13px monospace'; ctx.textAlign='center';
          ctx.fillText(arr[i]==null?'·':(fmt?fmt(arr[i]):(''+arr[i])), x+bw/2, y+20); ctx.textAlign='left'; }
      }
      // 입력 계수
      row('A 계수 (1+2x)', f.A, H*0.18, function(){return {fill:'rgba(143,227,181,0.16)',stroke:'#8fe3b5',text:'#8fe3b5'};});
      row('B 계수 (3+4x)', f.B, H*0.30, function(){return {fill:'rgba(244,160,192,0.16)',stroke:'#f4a0c0',text:'#f4a0c0'};});
      // 점값
      if(f.PA){ row('① PA = FFT(A)', f.PA, H*0.45, function(i){ var h=(f.stage==='mul'&&i===f.mk); return h?{fill:'rgba(255,178,122,0.28)',stroke:'#ffb27a',text:'#ffb27a'}:{fill:'rgba(143,227,181,0.13)',stroke:'#8fe3b5',text:'#cfe9d6'}; }, fmtC);
        row('① PB = FFT(B)', f.PB, H*0.57, function(i){ var h=(f.stage==='mul'&&i===f.mk); return h?{fill:'rgba(255,178,122,0.28)',stroke:'#ffb27a',text:'#ffb27a'}:{fill:'rgba(244,160,192,0.13)',stroke:'#f4a0c0',text:'#f3cdda'}; }, fmtC);
      }
      // 점별 곱
      if(f.PC){ var pcfull=[]; for(var i=0;i<n;i++) pcfull[i]=(f.PC[i]!=null)?f.PC[i]:null;
        row('② PC = PA·PB', pcfull, H*0.69, function(i){ if(pcfull[i]==null) return {fill:'rgba(255,255,255,0.03)',stroke:'#2c3543',text:'#5a5a64'};
          var h=(f.stage==='mul'&&i===f.mk); return h?{fill:'rgba(255,178,122,0.28)',stroke:'#ffb27a',text:'#ffb27a'}:{fill:'rgba(122,184,255,0.16)',stroke:'#7ab8ff',text:'#dfeefb'}; }, fmtC);
      }
      // 결과 계수
      if(f.C && (f.stage==='interp'||f.stage==='done')){
        row('③ C = 역FFT(PC)', f.C, H*0.83, function(){return {fill:'rgba(143,227,181,0.22)',stroke:'#8fe3b5',text:'#8fe3b5'};}, fmtR);
      }
      var badge=f.stage==='start'?'준비':f.stage==='eval'?'① 평가':f.stage==='mul'?'② 점별 곱':f.stage==='interp'?'③ 보간':'완료';
      ctx.textAlign='center'; ctx.fillStyle=(f.stage==='done')?'#8fe3b5':'#ffb27a'; ctx.font='600 13px sans-serif';
      ctx.fillText('▶ '+badge, W/2, H*0.965); }
  },

  // ══════ NP(algo8_04) ▸ 이산 로그(Baby-step Giant-step) ══════
  { id:'algo_br_bsgs', branchOf:'algo8_04',
    code:[
      'BSGS(a, b, p):  // a^x ≡ b (mod p)',
      '  m ← ⌈√p⌉',
      '  // ① Baby step: a^j 표 작성',
      '  for j = 0 .. m−1:  tbl[a^j mod p] = j',
      '  f ← a^(−m) mod p',
      '  // ② Giant step: b·a^(−im) 조회',
      '  g ← b',
      '  for i = 0 .. m:',
      '    if g ∈ tbl:  return i·m + tbl[g]',
      '    g ← g · f mod p',
      '  return 없음'
    ],
    build:function(V){
      var a=2,b=3,p=13;
      var m=Math.ceil(Math.sqrt(p)); // 4
      function modpow(base,e,mod){ var r=1; base%=mod; while(e>0){ if(e&1) r=(r*base)%mod; base=(base*base)%mod; e>>=1; } return r; }
      function egcdInv(x,mod){ return modpow(x,mod-2,mod); } // p 소수
      // baby 표
      var baby=[]; // {val, j}
      var cur=1;
      var tbl={};
      for(var j=0;j<m;j++){ baby.push({val:cur,j:j}); tbl[cur]=j; cur=(cur*a)%p; }
      var ainv=egcdInv(a,p);
      var factor=modpow(ainv,m,p); // a^{-m}
      var st=[];
      function snap(line,cap,o){ var fr={line:line,cap:cap,a:a,b:b,p:p,m:m,baby:baby};
        for(var k in o) fr[k]=o[k]; st.push(fr); }
      snap([0,1],'<b>이산 로그</b>: 2^x ≡ 3 (mod 13)인 x를 찾습니다. 무차별이면 O(p). BSGS는 x = i·m + j로 쪼개 <b>O(√p)</b>로 — m = ⌈√13⌉ = <b>'+m+'</b>.',
        {phase:'init',giant:null,gi:-1,hit:-1,jHit:-1,ans:null});
      // baby step 빌드 (누적 표시)
      cur=1;
      for(j=0;j<m;j++){
        snap([3],'① Baby step: a^'+j+' = 2^'+j+' mod 13 = <b>'+baby[j].val+'</b> → 표에 (값 '+baby[j].val+' → j='+j+') 저장.',
          {phase:'baby',babyUpto:j,giant:null,gi:-1,hit:-1,jHit:-1,ans:null});
      }
      snap([4],'baby 표 완성 (4칸). 점프 보폭 f = a^(−m) = 2^(−4) mod 13 = <b>'+factor+'</b>. 이제 b에 f를 반복 곱하며 표를 조회합니다.',
        {phase:'baby',babyUpto:m-1,giant:null,gi:-1,hit:-1,jHit:-1,ans:null});
      // giant step
      var g=b, ans=null;
      for(var i=0;i<=m;i++){
        var inT=(tbl[g]!==undefined);
        if(inT){
          ans=i*m+tbl[g];
          snap([8,9],'② Giant step i='+i+': g = b·a^(−'+i+'m) = <b>'+g+'</b>. 표에 <b>있습니다!</b> j='+tbl[g]+' → x = i·m + j = '+i+'·'+m+' + '+tbl[g]+' = <b>'+ans+'</b>.',
            {phase:'giant',babyUpto:m-1,giant:g,gi:i,hit:g,jHit:tbl[g],ans:ans});
          break;
        } else {
          snap([8,10],'② Giant step i='+i+': g = b·a^(−'+i+'m) = <b>'+g+'</b>. 표에 없음 → f='+factor+' 곱해 다음 i로.',
            {phase:'giant',babyUpto:m-1,giant:g,gi:i,hit:-1,jHit:-1,ans:null});
        }
        g=(g*factor)%p;
      }
      snap([9],'<b>해: x = '+ans+'.</b> 검산: 2^'+ans+' mod 13 = '+modpow(a,ans,p)+' = b. 두 단계 각각 √p번 — meet-in-the-middle으로 O(p)→O(√p).',
        {phase:'done',babyUpto:m-1,giant:b,gi:ans/m|0,hit:-1,jHit:-1,ans:ans});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H;
      ctx.textAlign='center'; ctx.textBaseline='alphabetic'; ctx.fillStyle='#cfd8e6'; ctx.font='600 14px sans-serif';
      ctx.fillText('2^x ≡ 3 (mod 13) — baby 표를 만들고 giant 스텝으로 충돌을 찾습니다', W/2, H*0.10);
      // baby 표 (가로 셀)
      var m=f.m, cw=Math.min(96,(W*0.78)/m), ch=64, gap=10;
      var totW=m*cw+(m-1)*gap, bx0=W/2-totW/2, by0=H*0.24;
      ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillText('① Baby step 표  (값 → j):', bx0, by0-12);
      for(var j=0;j<m;j++){
        var bx=bx0+j*(cw+gap);
        var shown=(f.babyUpto!=null && j<=f.babyUpto)||f.phase==='init';
        var isHit=(f.hit>=0 && f.baby[j].val===f.hit && f.jHit===j);
        if(f.phase==='init') shown=false;
        var col=isHit?'#8fe3b5':shown?'#7ab8ff':'#3c4a5e';
        var fc=isHit?'rgba(143,227,181,0.22)':shown?'rgba(122,184,255,0.12)':'rgba(122,184,255,0.03)';
        ctx.fillStyle=fc; ctx.strokeStyle=col; ctx.lineWidth=isHit?2.6:1.8;
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(bx,by0,cw,ch,8);}else{ctx.beginPath();ctx.rect(bx,by0,cw,ch);}
        ctx.fill(); ctx.stroke();
        ctx.textAlign='center';
        if(shown){
          ctx.fillStyle=isHit?'#8fe3b5':'#dfeefb'; ctx.font='600 18px monospace'; ctx.textBaseline='middle';
          ctx.fillText('값 '+f.baby[j].val, bx+cw/2, by0+ch*0.36);
          ctx.fillStyle='#9b99a3'; ctx.font='13px monospace';
          ctx.fillText('j = '+j, bx+cw/2, by0+ch*0.72); ctx.textBaseline='alphabetic';
        } else {
          ctx.fillStyle='#5a5a64'; ctx.font='600 16px monospace'; ctx.textBaseline='middle';
          ctx.fillText('?', bx+cw/2, by0+ch/2); ctx.textBaseline='alphabetic';
        }
        ctx.fillStyle='#7f8a9b'; ctx.font='11px monospace'; ctx.textAlign='center';
        ctx.fillText('a^'+j, bx+cw/2, by0+ch+16);
      }
      // giant step 현재 값
      var gy=H*0.62;
      ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillText('② Giant step  (b에 a^(−m) 반복 곱):', bx0, gy-12);
      if(f.giant!=null && f.phase!=='init'){
        var hit=(f.hit>=0);
        var gx=W/2;
        ctx.fillStyle=hit?'rgba(143,227,181,0.22)':'rgba(255,178,122,0.20)';
        ctx.strokeStyle=hit?'#8fe3b5':'#ffb27a'; ctx.lineWidth=2.6;
        var gw=170,ghh=50, gxx=gx-gw/2;
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(gxx,gy,gw,ghh,9);}else{ctx.beginPath();ctx.rect(gxx,gy,gw,ghh);}
        ctx.fill(); ctx.stroke();
        ctx.fillStyle=hit?'#8fe3b5':'#ffb27a'; ctx.font='600 17px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText('i='+f.gi+'  g = '+f.giant, gx, gy+ghh/2); ctx.textBaseline='alphabetic';
        // 충돌 화살표
        if(hit){
          ctx.fillStyle='#8fe3b5'; ctx.font='600 13px sans-serif'; ctx.textAlign='center';
          ctx.fillText('▲ 표에서 발견!', gx, gy-22);
        }
      }
      // 정답
      if(f.ans!=null && f.phase==='done'){
        ctx.fillStyle='#8fe3b5'; ctx.font='600 20px sans-serif'; ctx.textAlign='center';
        ctx.fillText('x = '+f.ans+'   ✓  (2^'+f.ans+' mod 13 = 3)', W/2, H*0.88);
      } else if(f.ans!=null){
        ctx.fillStyle='#8fe3b5'; ctx.font='600 16px sans-serif'; ctx.textAlign='center';
        ctx.fillText('x = i·m + j = '+f.ans, W/2, H*0.88);
      }
    }
  },

  // ══════ 해시(algo2_05) ▸ 뫼비우스 함수·포함배제 ══════
  { id:'algo_br_mobius', concept:true, branchOf:'algo2_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, cx=W/2;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('뫼비우스 함수 μ — 정수론판 포함·배제', W/2, H*0.11);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('소인수의 "겹침"을 부호로 잡아, 배수 세기·서로소 개수를 깔끔하게', W/2, H*0.11+22);
      ctx.fillStyle='#bfe0ff'; ctx.font='600 15px ui-monospace, monospace'; ctx.textAlign='left';
      var lx=cx-W*0.26;
      ctx.fillText('μ(n) = +1  : 서로 다른 소수 짝수 개의 곱 (예 μ(1)=1, μ(6)=1)', lx, H*0.34);
      ctx.fillText('μ(n) = −1  : 서로 다른 소수 홀수 개의 곱 (예 μ(2)=μ(30)=−1)', lx, H*0.44);
      ctx.fillText('μ(n) =  0  : 제곱 인수 보유 (예 μ(4)=μ(12)=0)', lx, H*0.54);
      ctx.fillStyle='#8fe3b5'; ctx.font='600 15px ui-monospace, monospace'; ctx.textAlign='center';
      ctx.fillText('뫼비우스 반전:  g(n)=Σ_{d|n} f(d)  ⇔  f(n)=Σ_{d|n} μ(n/d)·g(d)', cx, H*0.66);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('1~N 중 k와 서로소인 수 = Σ μ(d)·⌊N/d⌋ (d|k). 약수·배수 합·서로소 쌍 세기를 포함배제로 가속', cx, H*0.76); }
  },

  // ══════ 격자DP(algo7_05) ▸ 자릿수 DP(Digit DP) ══════
  { id:'algo_br_digitdp', concept:true, branchOf:'algo7_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, cx=W/2;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('자릿수 DP — "범위 [0, N] 중 조건 맞는 수 세기"', W/2, H*0.11);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('숫자를 위 자리부터 한 칸씩 채우며, (위치, tight, 추가상태)로 메모이제이션', W/2, H*0.11+22);
      // N=527 자릿수 채우기
      var digs=['5','2','7'];
      var bw=W*0.10, gap=W*0.03, total=digs.length*bw+(digs.length-1)*gap, x0=cx-total/2, y=H*0.34;
      for(var i=0;i<digs.length;i++){ var x=x0+i*(bw+gap), cur=(i===1);
        ctx.fillStyle=cur?'rgba(255,178,122,0.26)':'rgba(122,184,255,0.16)'; ctx.strokeStyle=cur?'#ffb27a':'#7ab8ff'; ctx.lineWidth=2;
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,bw,bw,8);ctx.fill();ctx.stroke();}else ctx.strokeRect(x,y,bw,bw);
        ctx.fillStyle=cur?'#ffb27a':'#dfeefb'; ctx.font='600 26px ui-monospace, monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(digs[i],x+bw/2,y+bw/2); ctx.textBaseline='alphabetic';
        ctx.fillStyle='#6f7686'; ctx.font='11px sans-serif'; ctx.fillText('자리'+i, x+bw/2, y+bw+14); }
      ctx.fillStyle='#8fe3b5'; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('tight=참: 지금까지 N과 똑같음 → 이 자리 상한은 N의 자릿수(2). tight=거짓 → 0~9 자유', cx, H*0.58);
      ctx.fillStyle='#bfe0ff'; ctx.font='600 14px ui-monospace, monospace';
      ctx.fillText('dp[pos][tight][상태]  — pos는 O(자릿수), 상태는 작게', cx, H*0.68);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('O(자릿수 × 10 × 상태) ≪ N. [L,R]은 f(R)−f(L−1). "3 들어간 수 개수" 같은 문제의 정석', cx, H*0.76); }
  },

  // ══════ 격자DP(algo7_05) ▸ SOS DP(부분집합 합) ══════
  { id:'algo_br_sosdp', concept:true, branchOf:'algo7_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, cx=W/2;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('SOS DP — 모든 부분집합 합을 O(n·2ⁿ)에', W/2, H*0.11);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('F[mask] = Σ_{sub ⊆ mask} A[sub] 를, 비트 차원별로 더해 빠르게', W/2, H*0.11+22);
      ctx.fillStyle='#bfe0ff'; ctx.font='600 14px ui-monospace, monospace'; ctx.textAlign='center';
      ctx.fillText('for i in 0..n−1:', cx, H*0.34);
      ctx.fillText('  for mask: if mask &amp; (1&lt;&lt;i):  F[mask] += F[mask ^ (1&lt;&lt;i)]', cx, H*0.42);
      ctx.fillStyle='#8fe3b5'; ctx.font='13px sans-serif';
      ctx.fillText('비트 차원 i를 하나씩 "켜며" 부분합을 누적 → n번 통과 = O(n·2ⁿ)', cx, H*0.54);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('순진하게 모든 (mask, sub) 쌍을 보면 3ⁿ. 차원별 누적이 그 핵심 절약', cx, H*0.62);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('= 부분집합에 대한 고차원 누적합(zeta 변환). 부분집합 컨볼루션·포함배제·비트마스크 문제에', cx, H*0.72); }
  },

  // ══════ 격자DP(algo7_05) ▸ 행렬 거듭제곱 점화식 ══════
  { id:'algo_br_matexp', concept:true, branchOf:'algo7_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, cx=W/2;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('행렬 거듭제곱 — 선형 점화식을 O(k³ log n)에', W/2, H*0.12);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('피보나치 같은 선형 점화식을 행렬 곱으로 쓰고, 빠른 거듭제곱으로 n을 로그에', W/2, H*0.12+22);
      ctx.fillStyle='#bfe0ff'; ctx.font='600 16px ui-monospace, monospace'; ctx.textAlign='center';
      ctx.fillText('[ F(n+1) ]   =   [ 1  1 ]^n   [ F(1) ]', cx, H*0.36);
      ctx.fillText('[ F(n)   ]       [ 1  0 ]      [ F(0) ]', cx, H*0.43);
      ctx.fillStyle='#8fe3b5'; ctx.font='14px ui-monospace, monospace';
      ctx.fillText('M^n 을 빠른 거듭제곱(분할정복)으로 → O(log n)번 행렬 곱', cx, H*0.57);
      ctx.fillStyle='#ffb27a'; ctx.font='600 15px ui-monospace, monospace';
      ctx.fillText('F(10⁹) 도 약 30번의 2×2 행렬 곱이면 끝!', cx, H*0.66);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('항이 k개인 점화식이면 k×k 행렬 → O(k³ log n). 경로 수 세기·DP 전이가 고정선형일 때 만능', cx, H*0.76); }
  },

  // ══════ BST탐색(algo5_03) ▸ 트리 DP(서브트리 점화) ══════
  { id:'algo_br_treedp', concept:true, branchOf:'algo5_03',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('트리 DP — 서브트리 답을 모아 부모로', W/2, H*0.09);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('각 노드의 답을 자식들의 답으로 정의(DFS 후위순회). 예: 최대 독립 집합', W/2, H*0.09+22);
      var T=['A','B','C','D','E','F','G'];
      var take={A:1,D:1,E:1,G:1};  // 선택된 노드(독립집합 예시)
      drawTreeB(E, T, function(i){ var k=T[i]; if(take[k]) return {fill:'rgba(143,227,181,0.3)',stroke:'#8fe3b5',text:'#8fe3b5',tag:'선택'}; return {fill:'rgba(122,184,255,0.14)',stroke:'#7ab8ff',text:'#9bb0c8'}; }, {top:H*0.28, lg:H*0.18, r:20});
      ctx.fillStyle='#8fe3b5'; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('초록 = 고른 노드(서로 인접 안 함 = 독립집합). dp[v][0/1] = v를 빼고/넣고 서브트리 최적', W/2, H*0.84);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('dp[v][1]=1+Σ dp[child][0],  dp[v][0]=Σ max(dp[child][0],dp[child][1]). 후위순회 O(V)', W/2, H*0.84+22); }
  },

  // ══════ 스택(algo2_03) ▸ 단조 스택(다음 큰 원소) ══════
  { id:'algo_br_monostack', branchOf:'algo2_03',
    code:[
      'st = []                       // 인덱스 보관(값 감소)',
      'for i = 0 to n-1:',
      '  while st not empty and a[st.top] < a[i]:',
      '    next[st.top] = i          // i가 그들의 다음 큰 값',
      '    st.pop()                  // 답 확정 → 꺼냄',
      '  st.push(i)                  // 현재 인덱스 push',
      '// 각 원소 push 1회·pop 1회 → O(n)'
    ],
    build:function(V){
      var A=[2,5,3,6,1,4];          // 막대 높이
      var n=A.length;
      var NGE=new Array(n); for(var t=0;t<n;t++) NGE[t]=-1;  // -1 = 다음 큰 값 없음
      var stack=[];                  // 인덱스
      var st=[];
      function snap(line,cap,extra){ var f={line:line,cap:cap,A:A,nge:NGE.slice(),stack:stack.slice()}; if(extra)for(var k in extra)f[k]=extra[k]; st.push(f); }
      snap([0],'배열 <b>A=[2,5,3,6,1,4]</b>에서 각 원소의 <b>오른쪽 첫 더 큰 값(NGE)</b>을 단조 스택으로 한 번에 구합니다.', {i:-1});
      for(var i=0;i<n;i++){
        snap([1],'<b>i='+i+'</b> (높이 '+A[i]+') 를 봅니다. 스택 top과 비교합니다.', {i:i});
        while(stack.length && A[stack[stack.length-1]]<A[i]){
          var top=stack[stack.length-1];
          NGE[top]=i;
          snap([2,3,4],'top 인덱스 '+top+'(높이 '+A[top]+') &lt; 현재 '+A[i]+' → <b>'+top+'의 다음 큰 값 = '+A[i]+'</b>. 정답 확정 후 pop.', {i:i,resolve:top});
          stack.pop();
        }
        stack.push(i);
        snap([5],'현재 인덱스 '+i+'(높이 '+A[i]+')를 <b>push</b> — 스택은 값이 줄어드는 순서로 유지됩니다.', {i:i});
      }
      var leftover=stack.slice();
      snap([6],'<b>완료!</b> 스택에 남은 '+leftover.map(function(x){return A[x];}).join(', ')+'는 오른쪽에 더 큰 값이 없어 NGE=−1. 각 원소 push·pop 1회 → <b>O(n)</b>.', {i:-1,done:true});
      return st;
    },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H,A=f.A,n=A.length;
      var maxH=Math.max.apply(null,A);
      var bx0=W*0.10,bw=(W*0.80)/n, baseY=H*0.66, barMax=H*0.42;
      function barX(k){ return bx0+k*bw; }
      function barH(k){ return barMax*A[k]/maxH; }
      var stk=f.stack||[], nge=f.nge||[];
      function inStack(k){ return stk.indexOf(k)>=0; }
      ctx.textAlign='center'; ctx.textBaseline='middle';
      // bars
      for(var k=0;k<n;k++){ var bh=barH(k), x=barX(k)+bw*0.12, w=bw*0.76, y=baseY-bh;
        var isCur=(k===f.i), isResolve=(k===f.resolve), onStack=inStack(k);
        var col=isResolve?'#f4a0c0':isCur?'#ffb27a':onStack?'#7ab8ff':(nge[k]!==undefined&&nge[k]!==-1)?'#8fe3b5':(f.done&&nge[k]===-1?'#9b99a3':'#56555f');
        var fc =isResolve?'rgba(244,160,192,0.30)':isCur?'rgba(255,178,122,0.28)':onStack?'rgba(122,184,255,0.24)':(nge[k]!==-1?'rgba(143,227,181,0.20)':'rgba(120,120,130,0.10)');
        ctx.fillStyle=fc; ctx.strokeStyle=col; ctx.lineWidth=2.2;
        if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(x,y,w,bh,5); ctx.fill(); ctx.stroke(); }
        else { ctx.fillRect(x,y,w,bh); ctx.strokeRect(x,y,w,bh); }
        ctx.fillStyle=col; ctx.font='600 15px sans-serif'; ctx.fillText(A[k],x+w/2,y-12);
        ctx.fillStyle='#9b99a3'; ctx.font='11px monospace'; ctx.fillText('i'+k,x+w/2,baseY+14);
        // NGE answer label
        var ans=nge[k];
        if(ans!==undefined){ ctx.font='10px sans-serif';
          ctx.fillStyle=(ans!==-1)?'#8fe3b5':(f.done?'#9b99a3':'rgba(0,0,0,0)');
          ctx.fillText(ans!==-1?('NGE='+A[ans]):'NGE=∅', x+w/2, baseY+30); }
      }
      // stack panel (bottom)
      ctx.textAlign='left'; ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif';
      ctx.fillText('단조 스택(값 감소, top→):', bx0, H*0.86);
      var sx=bx0+186;
      for(k=0;k<stk.length;k++){ var id=stk[k], lbl=A[id], isTop=(k===stk.length-1);
        ctx.font='600 13px sans-serif'; var bw2=34;
        ctx.fillStyle=isTop?'rgba(255,178,122,0.26)':'rgba(122,184,255,0.16)';
        ctx.strokeStyle=isTop?'#ffb27a':'#7ab8ff'; ctx.lineWidth=1.6;
        if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(sx,H*0.835,bw2,26,6); ctx.fill(); ctx.stroke(); }
        else { ctx.fillRect(sx,H*0.835,bw2,26); ctx.strokeRect(sx,H*0.835,bw2,26); }
        ctx.fillStyle=isTop?'#ffb27a':'#cfe0ff'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(lbl,sx+bw2/2,H*0.835+13);
        if(isTop){ ctx.fillStyle='#ffb27a'; ctx.font='10px sans-serif'; ctx.fillText('top',sx+bw2/2,H*0.835-9); ctx.font='600 13px sans-serif'; }
        sx+=bw2+8; ctx.textAlign='left';
      }
      ctx.textBaseline='alphabetic'; ctx.textAlign='left';
    },
  },

  // ══════ 큐(algo2_04) ▸ 슬라이딩 윈도우 최댓값(단조 덱) ══════
  { id:'algo_br_slidemax', branchOf:'algo2_04',
    code:[
      'dq = []  (인덱스, 값 감소)   // 양끝 덱',
      'for i = 0 to n-1:',
      '  if dq.front <= i-k: dq.pop_front()   // 창 벗어난 앞 제거',
      '  while dq not empty and a[dq.back] <= a[i]:',
      '    dq.pop_back()             // 작은 값 뒤에서 제거',
      '  dq.push_back(i)',
      '  if i >= k-1: ans = a[dq.front]  // 창 최댓값',
      '// 각 인덱스 1회 들어오고 1회 나감 → O(n)'
    ],
    build:function(V){
      var A=[1,3,-1,-3,5,3];       // 고전 예제(축약)
      var k=3, n=A.length;
      var dq=[];                    // 인덱스, 값 감소
      var ans=[];                   // 각 창 최댓값
      var st=[];
      function snap(line,cap,extra){ var f={line:line,cap:cap,A:A,k:k,dq:dq.slice(),ans:ans.slice()}; if(extra)for(var key in extra)f[key]=extra[key]; st.push(f); }
      snap([0],'배열 <b>A=[1,3,-1,-3,5,3]</b>, 창 크기 <b>k=3</b>. 단조 덱(인덱스, 값 감소)으로 각 창 최댓값을 O(n)에 구합니다.', {i:-1});
      for(var i=0;i<n;i++){
        var lo=Math.max(0,i-k+1);
        // pop front out of window
        if(dq.length && dq[0]<=i-k){
          var rmv=dq[0];
          snap([1,2],'<b>i='+i+'</b>(값 '+A[i]+'): 덱 맨 앞 인덱스 '+rmv+'가 창 [<b>'+(i-k+1)+','+i+'</b>]을 벗어남 → <b>앞에서 제거</b>.', {i:i,win:[i-k+1,i],removeFront:rmv});
          dq.shift();
        }
        // pop back smaller
        while(dq.length && A[dq[dq.length-1]]<=A[i]){
          var b=dq[dq.length-1];
          snap([3,4],'<b>i='+i+'</b>: 덱 뒤 인덱스 '+b+'(값 '+A[b]+') ≤ 현재 '+A[i]+' → 최댓값 못 되므로 <b>뒤에서 제거</b>.', {i:i,win:[lo,i],removeBack:b});
          dq.pop();
        }
        dq.push(i);
        if(i>=k-1){
          ans.push(A[dq[0]]);
          snap([5,6],'<b>i='+i+'</b>: 인덱스 '+i+'(값 '+A[i]+') 뒤에 추가. 창 [<b>'+(i-k+1)+','+i+'</b>] 완성 → <b>덱 맨 앞 = 최댓값 '+A[dq[0]]+'</b>.', {i:i,win:[i-k+1,i],report:dq[0]});
        } else {
          snap([5],'<b>i='+i+'</b>: 인덱스 '+i+'(값 '+A[i]+')를 <b>뒤에 추가</b>. 덱은 값 감소 순서를 유지(아직 첫 창 미완성).', {i:i,win:[lo,i]});
        }
      }
      snap([7],'<b>완료!</b> 창별 최댓값 = ['+ans.join(', ')+']. 각 인덱스가 한 번 들어와 한 번 나가므로 전체 <b>O(n)</b>.', {i:-1,done:true});
      return st;
    },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H,A=f.A,n=A.length,k=f.k;
      var x0=W*0.08,cw=(W*0.84)/n, cy=H*0.30, ch=Math.min(cw*0.7,52);
      function cellX(j){ return x0+j*cw; }
      var dq=f.dq||[], win=f.win||null, ans=f.ans||[];
      function inDq(j){ return dq.indexOf(j)>=0; }
      ctx.textAlign='center'; ctx.textBaseline='middle';
      // window highlight band
      if(win){ var wx=cellX(win[0]), ww=cw*(win[1]-win[0]+1);
        ctx.fillStyle='rgba(255,178,122,0.10)'; ctx.strokeStyle='rgba(255,178,122,0.5)'; ctx.lineWidth=1.6;
        if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(wx+2,cy-ch/2-8,ww-4,ch+16,7); ctx.fill(); ctx.stroke(); }
        else { ctx.fillRect(wx+2,cy-ch/2-8,ww-4,ch+16); }
      }
      // array cells
      for(var j=0;j<n;j++){ var x=cellX(j)+cw*0.12, w=cw*0.76, y=cy-ch/2;
        var isCur=(j===f.i), isRb=(j===f.removeBack), isRf=(j===f.removeFront), inWin=(win&&j>=win[0]&&j<=win[1]), onDq=inDq(j), isRep=(j===f.report);
        var col=isRb||isRf?'#f4a0c0':isCur?'#ffb27a':isRep?'#8fe3b5':onDq?'#7ab8ff':inWin?'#cfe0ff':'#56555f';
        var fc =(isRb||isRf)?'rgba(244,160,192,0.28)':isCur?'rgba(255,178,122,0.26)':isRep?'rgba(143,227,181,0.24)':onDq?'rgba(122,184,255,0.20)':'rgba(120,120,130,0.08)';
        ctx.fillStyle=fc; ctx.strokeStyle=col; ctx.lineWidth=2.2;
        if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(x,y,w,ch,5); ctx.fill(); ctx.stroke(); }
        else { ctx.fillRect(x,y,w,ch); ctx.strokeRect(x,y,w,ch); }
        ctx.fillStyle=col; ctx.font='600 15px sans-serif'; ctx.fillText(A[j],x+w/2,y+ch/2);
        ctx.fillStyle='#9b99a3'; ctx.font='11px monospace'; ctx.fillText(j,x+w/2,y+ch+14);
      }
      // deque panel
      ctx.textAlign='left'; ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif';
      ctx.fillText('단조 덱 (앞=최댓값, 값 감소):', x0, H*0.62);
      var dx=x0+212;
      for(j=0;j<dq.length;j++){ var id=dq[j], isFront=(j===0);
        var lbl='i'+id+'='+A[id]; ctx.font='600 12px sans-serif';
        var bw=ctx.measureText(lbl).width+18;
        ctx.fillStyle=isFront?'rgba(143,227,181,0.22)':'rgba(122,184,255,0.16)';
        ctx.strokeStyle=isFront?'#8fe3b5':'#7ab8ff'; ctx.lineWidth=1.6;
        if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(dx,H*0.585,bw,26,6); ctx.fill(); ctx.stroke(); }
        else { ctx.fillRect(dx,H*0.585,bw,26); ctx.strokeRect(dx,H*0.585,bw,26); }
        ctx.fillStyle=isFront?'#8fe3b5':'#cfe0ff'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(lbl,dx+bw/2,H*0.585+13);
        if(isFront){ ctx.fillStyle='#8fe3b5'; ctx.font='10px sans-serif'; ctx.fillText('front',dx+bw/2,H*0.585-9); }
        dx+=bw+8; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
      }
      // answers
      ctx.textAlign='left'; ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif';
      ctx.fillText('창별 최댓값:', x0, H*0.80);
      ctx.fillStyle='#8fe3b5'; ctx.font='600 14px sans-serif';
      ctx.fillText('['+ans.join(', ')+']', x0+92, H*0.80);
      ctx.textBaseline='alphabetic'; ctx.textAlign='left';
    },
  },

  // ══════ 이분탐색(algo4_02) ▸ 삼분 탐색(단봉 함수) ══════
  { id:'algo_br_ternary', concept:true, branchOf:'algo4_02',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, P=E.Plot;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('삼분 탐색 — 단봉(볼록) 함수의 극값을 O(log n)에', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('구간을 셋으로 나눠 m1, m2를 비교 → 극값이 없는 1/3을 매번 버린다', W/2, H*0.10+22);
      // 위로 볼록 곡선(최댓값)
      var x0=W*0.16, x1=W*0.86, yb=H*0.78, yt=H*0.34, cx=(x0+x1)/2;
      function fy(t){ var u=(t-0.5); return yb-(yt-yb)*( -1)*(1-4*u*u); }  // 0~1 → 위로볼록
      ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2.5; ctx.beginPath();
      for(var i=0;i<=40;i++){ var t=i/40, X=x0+(x1-x0)*t, Y=yb-(yt-yb)*(4*t*(1-t)); if(i===0)ctx.moveTo(X,Y); else ctx.lineTo(X,Y); } ctx.stroke();
      function mark(t,col,lab){ var X=x0+(x1-x0)*t, Y=yb-(yt-yb)*(4*t*(1-t)); ctx.strokeStyle=col; ctx.setLineDash([4,3]); ctx.beginPath(); ctx.moveTo(X,yb+6); ctx.lineTo(X,Y); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle=col; ctx.beginPath(); ctx.arc(X,Y,5,0,Math.PI*2); ctx.fill(); ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText(lab,X,yb+22); }
      mark(0.40,'#8fe3b5','m1'); mark(0.60,'#ffb27a','m2'); mark(0.5,'#e2607a','정점');
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('f(m1) < f(m2) 면 정점은 m1 오른쪽 → [lo, m1] 버림 (반대면 [m2, hi] 버림)', W/2, H*0.88);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('이분 탐색의 사촌: 단조가 아니라 "단봉(볼록/오목)"일 때 극값을 찾음. 실수 구간은 비율 0.618(황금분할)', W/2, H*0.88+20); }
  },

  // ══════ 배열(algo2_01) ▸ 좌표 압축 ══════
  { id:'algo_br_coordcomp', concept:true, branchOf:'algo2_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, cx=W/2;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('좌표 압축 — 값의 "크기"만 남기고 0..k로 다시 번호 매기기', W/2, H*0.11);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('값이 10⁹까지 커도 종류가 n개뿐이면, 정렬·중복제거 후 등수로 바꿔 배열 크기를 n으로', W/2, H*0.11+22);
      var orig=[100,5,100,90000000,5], rank={5:0,100:1,90000000:2}, comp=[1,0,1,2,0];
      function row(vals,y,lab,col,fmt){ var n=vals.length, bw=Math.min(86,(W*0.62)/n), gap=10, total=n*bw+(n-1)*gap, x0=cx-total/2;
        ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif'; ctx.textAlign='right'; ctx.fillText(lab, x0-14, y+bw*0.3+6);
        for(var i=0;i<n;i++){ var x=x0+i*(bw+gap); ctx.fillStyle=col.bg; ctx.strokeStyle=col.st; ctx.lineWidth=2;
          if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,bw,bw*0.6,8);ctx.fill();ctx.stroke();}else ctx.strokeRect(x,y,bw,bw*0.6);
          ctx.fillStyle=col.tx; ctx.font='600 15px ui-monospace, monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(fmt(vals[i]),x+bw/2,y+bw*0.3); ctx.textBaseline='alphabetic'; } }
      row(orig, H*0.36, '원본 값', {bg:'rgba(122,184,255,0.14)',st:'#7ab8ff',tx:'#dfeefb'}, function(v){return v>=1e6?(v/1e6)+'M':v;});
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('↓ 정렬·중복제거 → 등수(rank)로 치환  {5→0, 100→1, 90M→2}', cx, H*0.50);
      row(comp, H*0.56, '압축 값', {bg:'rgba(143,227,181,0.2)',st:'#8fe3b5',tx:'#8fe3b5'}, function(v){return v;});
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif'; ctx.textAlign='center';
      ctx.fillText('대소 관계는 그대로 보존. 값 범위가 커서 못 쓰던 세그먼트 트리·BIT·DP 인덱스를 0..n−1로', cx, H*0.72);
      ctx.fillStyle='#8a8893'; ctx.fillText('정렬 O(n log n) + 이분 탐색으로 등수 찾기. 펜윅으로 전도 수 세기 등의 전처리 단골', cx, H*0.72+20); }
  },

  // ══════ 해시(algo2_05) ▸ 에라토스테네스의 체 ══════
  { id:'algo_br_sieve', branchOf:'algo2_05',
    code:[
      'SIEVE(N):',
      '  is_prime[2..N] ← true        // 모두 소수로 가정',
      '  for p = 2 to N:',
      '    if is_prime[p]:            // p가 살아있으면 소수',
      '      for m = p*p to N step p: // 배수를 p²부터',
      '        is_prime[m] ← false    // 합성수로 지움',
      '  return { p : is_prime[p] }   // 살아남은 수 = 소수'
    ],
    build:function(V){
      var N=30, cols=10;
      var prime=[]; for(var i=0;i<=N;i++) prime[i]=(i>=2);
      var st=[];
      function snap(line,cap,p,marks){
        st.push({line:line,cap:cap,N:N,cols:cols,prime:prime.slice(),
          p:(p==null?-1:p), marks:(marks||[]).slice()}); }
      snap([0,1],'1부터 '+N+'까지 늘어놓고 <b>2 이상은 일단 소수</b>로 가정합니다.',-1,[]);
      for(var p=2;p<=N;p++){
        if(prime[p]){
          if(p*p>N){
            snap([2,3],'p=<b>'+p+'</b> 는 살아있어 소수. 하지만 p²='+(p*p)+' &gt; '+N+' 이라 지울 배수가 없습니다(p&gt;√N).',p,[]);
            continue;
          }
          snap([2,3],'p=<b>'+p+'</b> 가 아직 안 지워짐 → <b>소수</b>! 그 배수를 p²='+(p*p)+'부터 한꺼번에 지웁니다.',p,[]);
          var mk=[];
          for(var m=p*p;m<=N;m+=p){ prime[m]=false; mk.push(m); }
          snap([4,5],'<b>'+p+'의 배수</b> '+mk.join(', ')+' 를 합성수로 지움. (p² 미만 배수는 더 작은 소수가 이미 지웠습니다.)',p,mk);
        }
      }
      var primes=[]; for(i=2;i<=N;i++) if(prime[i]) primes.push(i);
      snap([6],'<b>완료!</b> 살아남은 수가 소수: '+primes.join(', ')+'. 총 비용 <b>O(N log log N)</b>.',-1,[]);
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H;
      var cols=f.cols, rows=Math.ceil(f.N/cols);
      var cell=Math.min(46,(W*0.62)/cols), x0=W/2-cols*cell/2, y0=H*0.18;
      for(var v=1;v<=f.N;v++){
        var idx=v-1, r=Math.floor(idx/cols), c=idx%cols;
        var x=x0+c*cell, y=y0+r*cell, alive=f.prime[v];
        var isP=(v===f.p), isM=(f.marks&&f.marks.indexOf(v)>=0);
        var fill,stroke,txt;
        if(v===1){ fill='rgba(255,255,255,0.03)'; stroke='rgba(255,255,255,0.15)'; txt='#5a5f6b'; }
        else if(isP){ fill='rgba(255,178,122,0.30)'; stroke='#ffb27a'; txt='#ffb27a'; }
        else if(isM){ fill='rgba(244,160,192,0.30)'; stroke='#f4a0c0'; txt='#f4a0c0'; }
        else if(alive){ fill='rgba(143,227,181,0.26)'; stroke='#8fe3b5'; txt='#8fe3b5'; }
        else { fill='rgba(255,255,255,0.04)'; stroke='rgba(155,153,163,0.4)'; txt='#6e6c76'; }
        if(isM){ ctx.save(); ctx.shadowColor='#f4a0c0'; ctx.shadowBlur=14; }
        ctx.fillStyle=fill; ctx.strokeStyle=stroke; ctx.lineWidth=isP?2.4:1.5;
        ctx.fillRect(x,y,cell-4,cell-4); ctx.strokeRect(x,y,cell-4,cell-4);
        if(isM) ctx.restore();
        ctx.fillStyle=txt; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(v,x+(cell-4)/2,y+(cell-4)/2);
        if(!alive && v>1 && !isM){ ctx.strokeStyle='rgba(155,153,163,0.5)'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(x+4,y+4); ctx.lineTo(x+cell-8,y+cell-8); ctx.stroke(); }
        ctx.textBaseline='alphabetic';
      }
      ctx.textAlign='center'; ctx.font='12px sans-serif';
      var ly=y0+rows*cell+18;
      ctx.fillStyle='#ffb27a'; ctx.fillText('주황 = 현재 소수 p', W*0.28, ly);
      ctx.fillStyle='#f4a0c0'; ctx.fillText('분홍 = 방금 지운 배수', W*0.5, ly);
      ctx.fillStyle='#8fe3b5'; ctx.fillText('초록 = 살아남은 소수', W*0.72, ly); }
  },

  // ══════ 해시(algo2_05) ▸ 오일러 피(φ) 함수 ══════
  { id:'algo_br_totient', concept:true, branchOf:'algo2_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, cx=W/2;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('오일러 피 함수 φ(n) — n과 서로소인 수의 개수', W/2, H*0.12);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('1..n 중 gcd(k,n)=1 인 k의 개수. 소인수만 알면 곱셈 공식으로 바로', W/2, H*0.12+22);
      ctx.fillStyle='#bfe0ff'; ctx.font='600 18px ui-monospace, monospace'; ctx.textAlign='center';
      ctx.fillText('φ(n) = n · Π_{p|n} (1 − 1/p)', cx, H*0.34);
      ctx.fillStyle='#8fe3b5'; ctx.font='15px ui-monospace, monospace';
      ctx.fillText('φ(12) = 12 · (1−1/2)(1−1/3) = 12 · 1/2 · 2/3 = 4', cx, H*0.46);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('1..12 중 서로소: {1, 5, 7, 11} → 4개 ✓', cx, H*0.55);
      ctx.fillStyle='#ffb27a'; ctx.font='14px ui-monospace, monospace';
      ctx.fillText('오일러 정리: gcd(a,n)=1 이면  a^φ(n) ≡ 1 (mod n)', cx, H*0.66);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('페르마 소정리의 일반화 → 모듈러 역원 a^(φ(n)−1), RSA(φ(pq)=(p−1)(q−1))의 토대. 체로 1..N 일괄 O(N log log N)', cx, H*0.76); }
  },

  // ══════ 해시(algo2_05) ▸ 확장 유클리드·모듈러 역원 ══════
  { id:'algo_br_extgcd', concept:true, branchOf:'algo2_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, cx=W/2;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('확장 유클리드 — 역원·일차 합동의 만능 열쇠', W/2, H*0.12);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('gcd(a,b)를 구하면서 ax + by = gcd(a,b)를 만족하는 정수 x, y까지 함께 찾는다', W/2, H*0.12+22);
      ctx.fillStyle='#bfe0ff'; ctx.font='600 18px ui-monospace, monospace'; ctx.textAlign='center';
      ctx.fillText('a·x + b·y = gcd(a, b)', cx, H*0.34);
      ctx.fillStyle='#8fe3b5'; ctx.font='14px ui-monospace, monospace';
      ctx.fillText('예) 3·x + 11·y = 1  →  x = 4, y = −1  (3·4 + 11·(−1) = 1)', cx, H*0.45);
      ctx.fillStyle='#ffb27a'; ctx.font='600 15px ui-monospace, monospace';
      ctx.fillText('⇒ 3의 mod 11 역원 = 4   (3 · 4 ≡ 12 ≡ 1)', cx, H*0.56);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('gcd(a,m)=1 이면 a·x ≡ 1 (mod m)의 x = 역원. ax+my=1 의 x가 곧 답', cx, H*0.66);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('재귀로 O(log min(a,b)). 모듈러 역원·일차 합동 ax≡b·중국인 나머지정리(CRT)의 핵심 부품', cx, H*0.76); }
  },

  // ══════ NP(algo8_04) ▸ 가우스 소거법(선형 연립) ══════
  { id:'algo_br_gauss', branchOf:'algo8_04',
    code:[
      'GAUSS([A | b]):',
      '  for col = 0 .. n-1:',
      '    piv ← |A[i][col]| 가 가장 큰 행      // 부분 피벗팅',
      '    swap(row[piv], row[col])',
      '    for i = col+1 .. n-1:               // 아래 행 소거',
      '      f ← A[i][col] / A[col][col]',
      '      row[i] ← row[i] − f · row[col]',
      '  // 상삼각 완성 → 후진 대입',
      '  for i = n-1 .. 0:  x[i] = (b[i] − Σ A[i][j]x[j]) / A[i][i]'
    ],
    build:function(V){
      function M(a){ var r=[]; for(var i=0;i<a.length;i++) r.push(a[i].slice()); return r; }
      var A=[[2,1,-1,8],[-3,-1,2,-11],[-2,1,2,-3]], n=3, st=[];
      function snap(line,cap,o){ var f={line:line,cap:cap,mat:M(A),n:n,piv:(o&&o.piv!=null)?o.piv:-1,prow:(o&&o.prow!=null)?o.prow:-1,col:(o&&o.col!=null)?o.col:-1,trow:(o&&o.trow!=null)?o.trow:-1,x:(o&&o.x)?o.x.slice():null,xi:(o&&o.xi!=null)?o.xi:-1,phase:(o&&o.phase)||'fwd'}; st.push(f); }
      snap([0],'연립방정식 <b>Ax=b</b>를 증강 행렬 <b>[A | b]</b>로 적었습니다. 행 연산으로 풉니다.',{});
      for(var col=0; col<n; col++){
        var piv=col;
        for(var i=col+1;i<n;i++){ if(Math.abs(A[i][col])>Math.abs(A[piv][col])) piv=i; }
        snap([2],'열 '+col+': 아래 행 중 <b>|값|이 가장 큰</b> 행 '+piv+' 을 피벗으로 (부분 피벗팅, 수치 안정).',{col:col,piv:piv});
        if(piv!==col){ var t=A[piv]; A[piv]=A[col]; A[col]=t;
          snap([3],'행 '+piv+' ↔ 행 '+col+' <b>교환</b>. 이제 피벗은 대각선 A['+col+']['+col+'] = <b>'+A[col][col]+'</b>.',{col:col,prow:col});
        } else {
          snap([3],'이미 피벗 행이 제일 위 — 교환 불필요. 피벗 A['+col+']['+col+'] = <b>'+A[col][col]+'</b>.',{col:col,prow:col});
        }
        for(i=col+1;i<n;i++){
          var f=A[i][col]/A[col][col];
          snap([5,6],'행 '+i+' 소거: 배수 f = A['+i+']['+col+'] / A['+col+']['+col+'] = <b>'+(Math.round(f*1000)/1000)+'</b>.',{col:col,prow:col,trow:i});
          for(var j=col;j<=n;j++){ A[i][j]-=f*A[col][j]; if(Math.abs(A[i][j])<1e-9) A[i][j]=0; A[i][j]=Math.round(A[i][j]*1000)/1000; }
          snap([6],'행 '+i+' ← 행 '+i+' − '+(Math.round(f*1000)/1000)+'·행 '+col+'. 열 '+col+'이 <b>0</b>이 되었습니다.',{col:col,prow:col,trow:i});
        }
      }
      snap([7],'<b>상삼각 꼴 완성!</b> 대각선 아래가 모두 0. 이제 맨 아래 행부터 거꾸로 풉니다.',{phase:'back'});
      var x=[0,0,0];
      for(i=n-1;i>=0;i--){
        var s=A[i][n]; for(var k=i+1;k<n;k++) s-=A[i][k]*x[k];
        x[i]=Math.round((s/A[i][i])*1000)/1000;
        snap([8],'후진 대입 x['+i+'] = ('+A[i][n]+' − …) / '+A[i][i]+' = <b>'+x[i]+'</b>.',{trow:i,x:x,xi:i,phase:'back'});
      }
      snap([8],'<b>해: x = ('+x[0]+', '+x[1]+', '+x[2]+').</b> 전진 소거 + 후진 대입 = O(n³).',{x:x,phase:'done'});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H, m=f.mat, n=f.n, cols=n+1;
      ctx.textAlign='center'; ctx.fillStyle='#cfd8e6'; ctx.font='600 15px sans-serif';
      ctx.fillText('가우스 소거: 전진 소거(상삼각) → 후진 대입', W/2, H*0.09);
      var cw=Math.min(78,(W*0.74)/cols), ch=Math.min(50,H*0.13), gap=8;
      var totalW=cols*cw+(cols-1)*gap+18, x0=W/2-totalW/2, y0=H*0.20;
      // bracket bar before b column
      function cellX(j){ return x0+j*(cw+gap)+(j===n?18:0); }
      for(var i=0;i<n;i++){
        for(var j=0;j<cols;j++){
          var x=cellX(j), y=y0+i*(ch+gap), val=m[i][j];
          var hl=null;
          if(i===f.piv && j===f.col && f.phase==='fwd') hl={fill:'rgba(255,178,122,0.30)',stroke:'#ffb27a',text:'#ffb27a'};
          else if(i===f.prow && j>=f.col && f.col>=0 && f.phase==='fwd') hl={fill:'rgba(255,178,122,0.16)',stroke:'#ffb27a',text:'#ffd9b8'};
          else if(i===f.trow && f.phase==='fwd') hl={fill:'rgba(244,160,192,0.18)',stroke:'#f4a0c0',text:'#f4a0c0'};
          else if(i===f.trow && (f.phase==='back')) hl={fill:'rgba(143,227,181,0.18)',stroke:'#8fe3b5',text:'#8fe3b5'};
          ctx.fillStyle=hl?hl.fill:'rgba(122,184,255,0.10)'; ctx.strokeStyle=hl?hl.stroke:'#3c4a5e'; ctx.lineWidth=hl?2.2:1;
          if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,cw,ch,7);}else{ctx.beginPath();ctx.rect(x,y,cw,ch);}
          ctx.fill(); ctx.stroke();
          ctx.fillStyle=hl?hl.text:(j===n?'#9b99a3':'#dfeefb'); ctx.font='600 16px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
          var disp=(val===0?'0':(''+val)); ctx.fillText(disp, x+cw/2, y+ch/2);
        }
      }
      ctx.textBaseline='alphabetic';
      // column headers
      ctx.fillStyle='#7f8a9b'; ctx.font='12px sans-serif'; ctx.textAlign='center';
      var heads=['x','y','z','b'];
      for(j=0;j<cols;j++){ ctx.fillText(heads[j]==='b'?'= b':heads[j], cellX(j)+cw/2, y0-8); }
      // separator label
      ctx.fillStyle='#6f6e7a'; ctx.font='11px sans-serif';
      ctx.fillText('| 증강 행렬 [A | b]', W/2, y0+n*(ch+gap)+18);
      // solution vector
      if(f.x){
        ctx.textAlign='center'; ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif';
        ctx.fillText('해 x =', W*0.5-150, H*0.86+6);
        var sx=W*0.5-95, labs=['x','y','z'];
        for(i=0;i<n;i++){
          var bx=sx+i*78, known=(f.x[i]!==0||f.xi<=i)&&(f.xi<=i||f.phase==='done');
          var solved=(f.phase==='done')||(i>=f.xi);
          ctx.fillStyle=solved?'rgba(143,227,181,0.20)':'rgba(122,184,255,0.10)'; ctx.strokeStyle=solved?'#8fe3b5':'#3c4a5e'; ctx.lineWidth=solved?2:1;
          if(ctx.roundRect){ctx.beginPath();ctx.roundRect(bx,H*0.86-16,64,30,7);}else{ctx.beginPath();ctx.rect(bx,H*0.86-16,64,30);}
          ctx.fill(); ctx.stroke();
          ctx.fillStyle=solved?'#8fe3b5':'#5a5a64'; ctx.font='600 15px monospace'; ctx.textBaseline='middle';
          ctx.fillText(solved?(''+f.x[i]):'?', bx+32, H*0.86); ctx.textBaseline='alphabetic';
          ctx.fillStyle='#7f8a9b'; ctx.font='11px sans-serif'; ctx.fillText(labs[i], bx+32, H*0.86+30);
        }
      }
      var badge=f.phase==='back'?'후진 대입':f.phase==='done'?'완료':'전진 소거';
      ctx.textAlign='center'; ctx.fillStyle=(f.phase==='done')?'#8fe3b5':'#ffb27a'; ctx.font='600 13px sans-serif';
      ctx.fillText('▶ '+badge, W/2, H*0.965); }
  },

  // ══════ 선형탐색(algo4_01) ▸ 문자열 해싱(롤링 해시) ══════
  { id:'algo_br_strhash', concept:true, branchOf:'algo4_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, cx=W/2;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('문자열 해싱 — 부분문자열을 숫자로 O(1) 비교', W/2, H*0.12);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('문자열을 다항식 값으로: h(s) = Σ s[i]·base^i (mod M). 접두사 해시로 임의 구간 O(1)', W/2, H*0.12+22);
      ctx.fillStyle='#bfe0ff'; ctx.font='600 15px ui-monospace, monospace'; ctx.textAlign='center';
      ctx.fillText('h[i] = h[i−1]·base + s[i]   (접두사 해시)', cx, H*0.34);
      ctx.fillStyle='#8fe3b5'; ctx.font='14px ui-monospace, monospace';
      ctx.fillText('구간 [l,r] 해시 = h[r] − h[l−1]·base^(r−l+1)', cx, H*0.45);
      ctx.fillStyle='#ffb27a'; ctx.font='13px sans-serif';
      ctx.fillText('두 부분문자열이 같은가? → 해시 두 개를 O(1)에 비교', cx, H*0.55);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('전처리 O(n), 임의 구간 비교·검색 O(1). 라빈-카프(슬라이딩 해시)의 일반화', cx, H*0.65);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('충돌 위험 → 큰 소수 M·서로 다른 base로 이중 해시. 회문 판정·반복·LCP 이분탐색에', cx, H*0.73); }
  },

  // ══════ 정렬(algo3_04) ▸ 평방 분할(Sqrt Decomposition) ══════
  { id:'algo_br_sqrtdecomp', branchOf:'algo3_04',
    code:[
      'B = √n                          // 블록 크기',
      'build: blk[i/B] += a[i]         // 블록 합 미리 계산',
      'query(l, r):  s = 0',
      '  while i ≤ r:',
      '    if i가 블록 시작 and i+B-1 ≤ r:',
      '      s += blk[블록]; i += B     // 완전 블록 통째로',
      '    else:',
      '      s += a[i]; i += 1          // 가장자리 낱개',
      '  return s                       // O(√n)'
    ],
    build:function(V){
      var A=[3,1,4,1,5,9,2,6,5], n=A.length, B=3; // √9 = 3
      var l=1, r=7; // 질의 구간
      var st=[];
      var blk=[]; for(var b0=0;b0*B<n;b0++) blk.push(0);
      function snap(line,cap,o){ o=o||{};
        st.push({line:line,cap:cap,arr:A.slice(),n:n,B:B,blk:blk.slice(),l:l,r:r,
          i:(o.i==null?-1:o.i), block:(o.block==null?-1:o.block),
          acc:(o.acc==null?0:o.acc), mode:o.mode||'', take:o.take||null}); }
      snap([0],'배열 9개를 <b>크기 B=√9=3</b> 블록으로 나눕니다. 각 블록의 합을 미리 계산해 둡니다.',{mode:'start'});
      for(var b=0;b*B<n;b++){ var sB=0; for(var t=b*B;t<Math.min(n,b*B+B);t++) sB+=A[t]; blk[b]=sB;
        snap([1],'블록 '+b+' = ['+A.slice(b*B,b*B+B).join(', ')+'] 의 합 <b>blk['+b+'] = '+sB+'</b> 저장.',{block:b,mode:'buildblk'}); }
      snap([2],'<b>구간 질의 [l='+l+', r='+r+']</b>의 합을 구합니다. 왼쪽 자투리는 낱개, 가운데 완전 블록은 통째로, 오른쪽 자투리는 낱개.',{mode:'start'});
      var s=0, i=l;
      while(i<=r){
        if(i%B===0 && i+B-1<=r){
          var bi=i/B;
          s+=blk[bi];
          snap([4,5],'i='+i+'는 <b>블록 '+bi+'의 시작</b>이고 [i,i+2]가 구간 안 → 저장된 <b>blk['+bi+']='+blk[bi]+'</b>를 통째로 더함. 누적 s='+s+'. (O(1))',{i:i,block:bi,acc:s,mode:'fullblock',take:'blk'});
          i+=B;
        } else {
          s+=A[i];
          snap([6,7],'i='+i+'는 <b>가장자리 낱개</b> → a['+i+']='+A[i+0]+' 직접 더함. 누적 s='+s+'.',{i:i,acc:s,mode:'single',take:'elem'});
          i+=1;
        }
      }
      snap([8],'<b>완료!</b> 구간 ['+l+','+r+'] 합 = <b>'+s+'</b>. 자투리·완전 블록 각각 ≤√n개라 질의는 <b>O(√n)</b>.',{acc:s,mode:'done'});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H,A=f.arr,n=f.n,B=f.B;
      ctx.textAlign='center'; ctx.fillStyle='#cfd8e6'; ctx.font='600 15px sans-serif';
      ctx.fillText('평방 분할 — √n 블록 합으로 구간 합 O(√n)', W/2, H*0.09);
      var cw=Math.min(56,(W*0.80)/n), gap=6;
      var totalW=n*cw+(n-1)*gap, x0=W/2-totalW/2, y0=H*0.24, ch=46;
      for(var i=0;i<n;i++){
        var x=x0+i*(cw+gap), inQ=(i>=f.l && i<=f.r), bi=Math.floor(i/B);
        var done=(i<f.i && f.i>=0 && inQ);
        var cur=(i===f.i);
        var inFullBlock=((f.mode==='fullblock'||f.mode==='buildblk') && bi===f.block);
        var col,fill,tcol;
        if(inFullBlock){ col='#7ab8ff'; fill='rgba(122,184,255,0.30)'; tcol='#7ab8ff'; }
        else if(cur && f.mode==='single'){ col='#ffb27a'; fill='rgba(255,178,122,0.30)'; tcol='#ffb27a'; }
        else if(done){ col='#8fe3b5'; fill='rgba(143,227,181,0.18)'; tcol='#8fe3b5'; }
        else if(inQ){ col='#5b6b80'; fill='rgba(122,184,255,0.10)'; tcol='#dfeefb'; }
        else { col='#3c4a5e'; fill='rgba(122,184,255,0.04)'; tcol='#7f8a9b'; }
        ctx.fillStyle=fill; ctx.strokeStyle=col; ctx.lineWidth=(cur||inFullBlock)?2.4:1.2;
        if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(x,y0,cw,ch,6); ctx.fill(); ctx.stroke(); }
        else { ctx.fillRect(x,y0,cw,ch); ctx.strokeRect(x,y0,cw,ch); }
        ctx.fillStyle=tcol; ctx.font='600 17px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(A[i], x+cw/2, y0+ch/2); ctx.textBaseline='alphabetic';
        ctx.fillStyle='#7f8a9b'; ctx.font='10px monospace'; ctx.fillText(i, x+cw/2, y0+ch+13);
      }
      // block sum boxes below
      var by=y0+ch+34;
      for(var b=0;b*B<n;b++){
        var bs=b*B, be=Math.min(n-1,b*B+B-1);
        var bx0=x0+bs*(cw+gap), bx1=x0+be*(cw+gap)+cw;
        var hot=((f.mode==='fullblock'||f.mode==='buildblk') && b===f.block);
        ctx.strokeStyle=hot?'#7ab8ff':'rgba(255,255,255,0.18)'; ctx.lineWidth=hot?2.4:1.4;
        if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(bx0,by,bx1-bx0,34,7); ctx.stroke(); }
        else { ctx.strokeRect(bx0,by,bx1-bx0,34); }
        ctx.fillStyle=hot?'#7ab8ff':'#9b99a3'; ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText('blk['+b+']='+f.blk[b], (bx0+bx1)/2, by+17); ctx.textBaseline='alphabetic';
      }
      // query bracket
      var qx0=x0+f.l*(cw+gap), qx1=x0+f.r*(cw+gap)+cw;
      ctx.strokeStyle='#ffb27a'; ctx.lineWidth=2; ctx.beginPath();
      ctx.moveTo(qx0,y0-10); ctx.lineTo(qx0,y0-4); ctx.lineTo(qx1,y0-4); ctx.lineTo(qx1,y0-10); ctx.stroke();
      ctx.fillStyle='#ffb27a'; ctx.font='12px sans-serif'; ctx.textAlign='center';
      ctx.fillText('질의 [l='+f.l+', r='+f.r+']', (qx0+qx1)/2, y0-14);
      // accumulator
      ctx.textAlign='center'; ctx.fillStyle=(f.mode==='done')?'#8fe3b5':'#ffb27a'; ctx.font='600 18px sans-serif';
      ctx.fillText('누적 합 s = '+f.acc, W/2, H*0.82);
      ctx.fillStyle='#9b99a3'; ctx.font='11px sans-serif';
      ctx.fillText('파랑=완전 블록 통째(O(1)) · 주황=가장자리 낱개 · 초록=처리 완료', W/2, H*0.92); }
  },

  // ══════ NP(algo8_04) ▸ 중간에서 만나기(Meet in the Middle) ══════
  { id:'algo_br_mitm', branchOf:'algo8_04',
    code:[
      'MITM-SUBSET-SUM(nums, T):',
      '  나누기: A = 앞 절반, B = 뒤 절반',
      '  listA ← A의 모든 부분집합 합',
      '  sort(listA)',
      '  for sB in B의 모든 부분집합 합:',
      '    need ← T − sB',
      '    if 이분탐색(listA, need):   // 짝 찾기',
      '      return 발견  (sA + sB = T)',
      '  return 없음'
    ],
    build:function(V){
      var nums=[3,8,5,6,2,7], T=17;
      var A=nums.slice(0,3), B=nums.slice(3);
      function subsets(arr){ var res=[]; for(var m=0;m<(1<<arr.length);m++){ var s=0,pick=[]; for(var i=0;i<arr.length;i++){ if(m&(1<<i)){ s+=arr[i]; pick.push(arr[i]); } } res.push({s:s,pick:pick}); } return res; }
      var sa=subsets(A).sort(function(p,q){ return p.s-q.s; });
      var sb=subsets(B).sort(function(p,q){ return p.s-q.s; });
      var listA=sa.map(function(p){ return p.s; });
      var st=[];
      function snap(line,cap,o){ var fr={line:line,cap:cap,nums:nums,T:T,A:A,B:B,sa:sa,sb:sb};
        for(var k in o) fr[k]=o[k]; st.push(fr); }
      snap([0,1],'<b>중간에서 만나기</b>: 6개 {3,8,5,6,2,7} 중 합 = 17이 되는 부분집합을 찾습니다. 두 절반 A={3,8,5}, B={6,2,7}로 나눕니다. (2^6 대신 2·2^3)',
        {phase:'split',saShown:false,sbIdx:-1,need:-1,hitIdx:-1,found:null});
      snap([2,3],'① A={3,8,5}의 모든 부분집합 합을 만들어 <b>정렬</b>: ['+listA.join(', ')+'] (8개).',
        {phase:'baby',saShown:true,sbIdx:-1,need:-1,hitIdx:-1,found:null});
      // giant: each sB, binary search T-sB in listA
      var found=null;
      for(var i=0;i<sb.length;i++){
        var sB=sb[i].s, need=T-sB;
        // binary search index
        var hit=-1; for(var k=0;k<sa.length;k++){ if(sa[k].s===need){ hit=k; break; } }
        if(hit>=0){
          found={ a:sa[hit].pick, b:sb[i].pick, sa:need, sb:sB };
          snap([4,5,6,7],'② B 부분집합 합 sB = '+sB+' {'+(sb[i].pick.join(',')||'∅')+'} → need = T−sB = 17−'+sB+' = <b>'+need+'</b>. listA에서 이분탐색 → <b>찾음!</b> ['+sa[hit].pick.join(',')+']+['+sb[i].pick.join(',')+'] = 17.',
            {phase:'giant',saShown:true,sbIdx:i,need:need,hitIdx:hit,found:found});
          break;
        } else {
          snap([4,5,6],'② B 부분집합 합 sB = '+sB+' {'+(sb[i].pick.join(',')||'∅')+'} → need = 17−'+sB+' = <b>'+need+'</b>. listA 이분탐색 → 없음, 다음 B 합으로.',
            {phase:'giant',saShown:true,sbIdx:i,need:need,hitIdx:-1,found:null});
        }
      }
      snap([7],'<b>완료!</b> {'+found.a.join(', ')+'} ∪ {'+found.b.join(', ')+'} = '+found.sa+' + '+found.sb+' = <b>17</b>. 전수 2^6=64 대신 8+8 조회로 끝 — 지수가 절반으로(BSGS와 같은 원리).',
        {phase:'done',saShown:true,sbIdx:-1,need:-1,hitIdx:-1,found:found});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H;
      ctx.textAlign='center'; ctx.textBaseline='alphabetic'; ctx.fillStyle='#cfd8e6'; ctx.font='600 14px sans-serif';
      ctx.fillText('두 절반의 부분집합 합 — 한쪽 정렬, 다른 쪽마다 T−s 를 이분탐색', W/2, H*0.10);
      ctx.fillStyle='#9b99a3'; ctx.font='13px monospace'; ctx.textAlign='center';
      ctx.fillText('nums = {3, 8, 5, 6, 2, 7}   목표 T = 17', W/2, H*0.16);
      // listA (정렬된 A 합) - 가로
      var sa=f.sa, mlen=sa.length;
      var cw=Math.min(64,(W*0.86)/mlen), ch=44, gap=7;
      var totW=mlen*cw+(mlen-1)*gap, x0=W/2-totW/2, y0=H*0.26;
      ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillText('① A={3,8,5} 부분집합 합 (정렬, 이분탐색 대상):', x0, y0-12);
      ctx.textBaseline='middle';
      for(var i=0;i<mlen;i++){
        var bx=x0+i*(cw+gap);
        var shown=f.saShown;
        var isHit=(i===f.hitIdx);
        var col=isHit?'#8fe3b5':shown?'#7ab8ff':'#3c4a5e';
        var fc=isHit?'rgba(143,227,181,0.25)':shown?'rgba(122,184,255,0.12)':'rgba(122,184,255,0.03)';
        ctx.fillStyle=fc; ctx.strokeStyle=col; ctx.lineWidth=isHit?2.6:1.6;
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(bx,y0,cw,ch,7);}else{ctx.beginPath();ctx.rect(bx,y0,cw,ch);}
        ctx.fill(); ctx.stroke();
        ctx.textAlign='center';
        if(shown){ ctx.fillStyle=col; ctx.font='600 17px monospace'; ctx.fillText(''+sa[i].s, bx+cw/2, y0+ch/2);
          ctx.fillStyle='#7f8a9b'; ctx.font='9px monospace'; ctx.textBaseline='alphabetic';
          ctx.fillText('{'+(sa[i].pick.join(',')||'∅')+'}', bx+cw/2, y0+ch+13); ctx.textBaseline='middle';
        } else { ctx.fillStyle='#5a5a64'; ctx.font='600 15px monospace'; ctx.fillText('?', bx+cw/2, y0+ch/2); }
      }
      ctx.textBaseline='alphabetic';
      // listB - 현재 검사 중인 sB 와 need
      var sb=f.sb;
      var by0=H*0.56;
      var bw=Math.min(64,(W*0.86)/sb.length), bgap=7;
      var btotW=sb.length*bw+(sb.length-1)*bgap, bx0=W/2-btotW/2;
      ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillText('② B={6,2,7} 부분집합 합 (각각에 대해 17−sB 조회):', bx0, by0-12);
      ctx.textBaseline='middle';
      for(i=0;i<sb.length;i++){
        var bbx=bx0+i*(bw+bgap);
        var isCur=(i===f.sbIdx);
        var done=(f.found && f.found.sb===sb[i].s);
        var col2=done?'#8fe3b5':isCur?'#ffb27a':'#7ab8ff';
        var fc2=done?'rgba(143,227,181,0.22)':isCur?'rgba(255,178,122,0.22)':'rgba(122,184,255,0.10)';
        ctx.fillStyle=fc2; ctx.strokeStyle=col2; ctx.lineWidth=isCur||done?2.4:1.4;
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(bbx,by0,bw,ch,7);}else{ctx.beginPath();ctx.rect(bbx,by0,bw,ch);}
        ctx.fill(); ctx.stroke();
        ctx.textAlign='center'; ctx.fillStyle=col2; ctx.font='600 17px monospace';
        ctx.fillText(''+sb[i].s, bbx+bw/2, by0+ch/2);
        ctx.fillStyle='#7f8a9b'; ctx.font='9px monospace'; ctx.textBaseline='alphabetic';
        ctx.fillText('{'+(sb[i].pick.join(',')||'∅')+'}', bbx+bw/2, by0+ch+13); ctx.textBaseline='middle';
      }
      ctx.textBaseline='alphabetic';
      // need 표시
      if(f.need>=0){
        ctx.fillStyle=(f.hitIdx>=0)?'#8fe3b5':'#ffb27a'; ctx.font='600 15px monospace'; ctx.textAlign='center';
        ctx.fillText('need = T − sB = 17 − '+f.T+'... = '+f.need+(f.hitIdx>=0?'  ✓ A에 있음!':'  (A 조회)'), W/2, H*0.50);
      }
      // 결과
      if(f.found){
        ctx.fillStyle='#8fe3b5'; ctx.font='600 18px sans-serif'; ctx.textAlign='center';
        ctx.fillText('▶ {'+f.found.a.join(',')+'} + {'+f.found.b.join(',')+'} = '+f.found.sa+'+'+f.found.sb+' = 17  ✓', W/2, H*0.92);
      }
    }
  },

  // ══════ 이진트리(algo5_01) ▸ 트립(Treap) ══════
  { id:'algo_br_treap', concept:true, branchOf:'algo5_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('트립(Treap) — 트리 + 힙, 무작위로 균형', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('각 노드에 키와 무작위 우선순위. 키는 BST 순서, 우선순위는 힙 순서를 동시에 만족', W/2, H*0.10+22);
      // 노드: 키(위), 우선순위(아래) — 우선순위 힙(부모>자식)
      var N={ root:[0.5,0.30,'키 5','p:90'], l:[0.30,0.52,'키 3','p:60'], r:[0.72,0.52,'키 8','p:55'], ll:[0.18,0.74,'키 1','p:20'], lr:[0.42,0.74,'키 4','p:30'] };
      var edges=[['root','l'],['root','r'],['l','ll'],['l','lr']];
      function xy(k){ return [W*0.12+N[k][0]*W*0.76, H*0.24+N[k][1]*H*0.52]; }
      edges.forEach(function(e){ var a=xy(e[0]),b=xy(e[1]); ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke(); });
      Object.keys(N).forEach(function(k){ var p=xy(k), root=(k==='root');
        ctx.fillStyle=root?'rgba(255,178,122,0.22)':'rgba(122,184,255,0.16)'; ctx.strokeStyle=root?'#ffb27a':'#7ab8ff'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.arc(p[0],p[1],24,0,Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.fillStyle=root?'#ffb27a':'#dfeefb'; ctx.font='600 12px sans-serif'; ctx.textAlign='center'; ctx.fillText(N[k][2],p[0],p[1]-3);
        ctx.fillStyle='#8fe3b5'; ctx.font='10px sans-serif'; ctx.fillText(N[k][3],p[0],p[1]+11); });
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('키: 왼쪽<부모<오른쪽(BST). 우선순위: 부모 ≥ 자식(힙). 둘을 동시 만족 → 모양이 유일', W/2, H*0.88);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('우선순위가 무작위라 기대 높이 O(log n). 회전(또는 split/merge)으로 유지. 구간 트립=배열 연산까지', W/2, H*0.88+20); }
  },

  { id:'algo_br_centroid', concept:true, branchOf:'algo5_03',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('센트로이드 분할 — 트리를 절반씩 쪼개는 분할 정복', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('센트로이드(무게중심)를 떼면 남는 조각이 모두 절반 이하 → 재귀 깊이 O(log n)', W/2, H*0.10+22);
      // 트리: 센트로이드 c를 가운데, 양옆 서브트리
      var N={ c:[0.50,0.32], a:[0.26,0.52], b:[0.74,0.52], a1:[0.16,0.72], a2:[0.34,0.72], b1:[0.66,0.72], b2:[0.84,0.72] };
      var edges=[['c','a'],['c','b'],['a','a1'],['a','a2'],['b','b1'],['b','b2']];
      function xy(k){ return [W*0.12+N[k][0]*W*0.76, H*0.24+N[k][1]*H*0.46]; }
      edges.forEach(function(e){ var a=xy(e[0]),b=xy(e[1]); ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke(); });
      Object.keys(N).forEach(function(k){ var p=xy(k), c=(k==='c');
        ctx.fillStyle=c?'rgba(255,178,122,0.28)':'rgba(122,184,255,0.16)'; ctx.strokeStyle=c?'#ffb27a':'#7ab8ff'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.arc(p[0],p[1],c?22:16,0,Math.PI*2); ctx.fill(); ctx.stroke(); });
      var cp=xy('c'); ctx.fillStyle='#ffb27a'; ctx.font='600 12px sans-serif'; ctx.fillText('센트로이드', cp[0], cp[1]+4);
      ctx.fillStyle='#8fe3b5'; ctx.font='12px sans-serif';
      var ap=xy('a'),bp=xy('b'); ctx.fillText('≤ n/2', ap[0], ap[1]-24); ctx.fillText('≤ n/2', bp[0], bp[1]-24);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('각 정점은 센트로이드 분해 트리에서 O(log n)개 조각에만 속함 → 경로 질의를 센트로이드 경유로 분류', W/2, H*0.90);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('쓰임: 트리에서 거리 ≤ k 인 정점쌍 세기, 경로 합/색칠 질의. 전체 O(n log n)', W/2, H*0.90+20); }
  },

  { id:'algo_br_sparse', branchOf:'algo2_01',
    code:[
      'for i: sp[0][i] = a[i]        // 길이 1 = 원소',
      'for k = 1 .. while 2^k <= n:',
      '  for i: i+2^k <= n:',
      '    sp[k][i] = min( sp[k-1][i],           // 왼쪽 절반',
      '                    sp[k-1][i+2^(k-1)] )  // 오른쪽 절반',
      'query(l, r):                  // 구간 최솟값',
      '  k = floor(log2(r-l+1))',
      '  return min( sp[k][l],        // 왼쪽 2^k 블록',
      '              sp[k][r-2^k+1] ) // 오른쪽 2^k 블록(겹침 OK)'
    ],
    build:function(V){
      var A=[5,2,7,4,8,1,6,3];
      var n=A.length;
      var K=0; while((1<<(K+1))<=n) K++;   // 최대 k (=3, 길이 8)
      // sp[k][i] = min of A[i .. i+2^k-1]
      var sp=[]; for(var k=0;k<=K;k++) sp.push(new Array(n));
      for(var i=0;i<n;i++) sp[0][i]=A[i];
      var st=[];
      function copySp(){ return sp.map(function(row){ return row.slice(); }); }
      function snap(line,cap,extra){ var f={line:line,cap:cap,A:A,K:K,sp:copySp()}; if(extra)for(var key in extra)f[key]=extra[key]; st.push(f); }
      snap([0],'배열 <b>A=[5,2,7,4,8,1,6,3]</b>. 희소 테이블 sp[k][i] = A[i..i+2^k−1]의 <b>최솟값</b>을 채웁니다. k=0은 원소 그대로.', {fillRow:0,filled:{}});
      var filled={}; filled[0]={}; for(i=0;i<n;i++) filled[0][i]=true;
      for(k=1;k<=K;k++){
        filled[k]={};
        var len=1<<k, half=1<<(k-1);
        snap([1,2],'<b>k='+k+'</b> (길이 '+len+' 블록). 각 블록을 두 개의 길이 '+half+' 절반 블록의 min으로 만듭니다.', {fillRow:k,filled:JSON.parse(JSON.stringify(filled))});
        for(i=0;i+len<=n;i++){
          var lh=sp[k-1][i], rh=sp[k-1][i+half];
          sp[k][i]=Math.min(lh,rh);
          filled[k][i]=true;
          snap([3,4],'sp['+k+']['+i+'] = min( sp['+(k-1)+']['+i+']='+lh+' , sp['+(k-1)+']['+(i+half)+']='+rh+' ) = <b>'+sp[k][i]+'</b>  → A['+i+'..'+(i+len-1)+'] 최솟값.', {fillRow:k,filled:JSON.parse(JSON.stringify(filled)),hk:k,hi:i,src1:[k-1,i],src2:[k-1,i+half]});
        }
      }
      snap([1],'전처리 완료 — O(n log n). 이제 어떤 구간 질의든 <b>O(1)</b>에 답합니다.', {fillRow:-1,filled:JSON.parse(JSON.stringify(filled))});
      // ---- QUERY [2,6] ----
      var l=2,r=6, len=r-l+1; var qk=0; while((1<<(qk+1))<=len) qk++;  // floor(log2 len)
      var blk=1<<qk;
      var leftStart=l, rightStart=r-blk+1;
      var lv=sp[qk][leftStart], rv=sp[qk][rightStart], ansv=Math.min(lv,rv);
      snap([5,6],'<b>질의 min[2,6]</b>: 길이 '+len+' → k = ⌊log₂'+len+'⌋ = <b>'+qk+'</b> (블록 길이 '+blk+').', {fillRow:-1,filled:JSON.parse(JSON.stringify(filled)),qRange:[l,r]});
      snap([7],'왼쪽 블록 sp['+qk+']['+leftStart+'] = A['+leftStart+'..'+(leftStart+blk-1)+'] 최솟값 = <b>'+lv+'</b>.', {fillRow:-1,filled:JSON.parse(JSON.stringify(filled)),qRange:[l,r],blkA:[leftStart,leftStart+blk-1],hk:qk,hi:leftStart});
      snap([8],'오른쪽 블록 sp['+qk+']['+rightStart+'] = A['+rightStart+'..'+(rightStart+blk-1)+'] 최솟값 = <b>'+rv+'</b>. 두 블록이 [2,6]을 <b>겹쳐서</b> 정확히 덮습니다.', {fillRow:-1,filled:JSON.parse(JSON.stringify(filled)),qRange:[l,r],blkA:[leftStart,leftStart+blk-1],blkB:[rightStart,rightStart+blk-1],hk:qk,hi:rightStart});
      snap([7,8],'<b>완료!</b> min[2,6] = min('+lv+', '+rv+') = <b>'+ansv+'</b>. 겹쳐 봐도 min은 멱등이라 정확 — 단 두 블록, <b>O(1)</b>.', {fillRow:-1,filled:JSON.parse(JSON.stringify(filled)),qRange:[l,r],blkA:[leftStart,leftStart+blk-1],blkB:[rightStart,rightStart+blk-1],done:true,answer:ansv});
      return st;
    },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H,A=f.A,n=A.length,K=f.K,sp=f.sp;
      // array row at top
      var x0=W*0.10, cw=(W*0.80)/n, ay=H*0.14, ch=Math.min(cw*0.7,40);
      function cellX(j){ return x0+j*cw; }
      ctx.textAlign='center'; ctx.textBaseline='middle';
      var qR=f.qRange, blkA=f.blkA, blkB=f.blkB;
      function inR(rg,j){ return rg&&j>=rg[0]&&j<=rg[1]; }
      // query range band
      if(qR){ var qx=cellX(qR[0]), qw=cw*(qR[1]-qR[0]+1);
        ctx.fillStyle='rgba(255,178,122,0.08)'; ctx.strokeStyle='rgba(255,178,122,0.4)'; ctx.lineWidth=1.4;
        ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(qx+1,ay-ch/2-6,qw-2,ch+12,6); else ctx.rect(qx+1,ay-ch/2-6,qw-2,ch+12); ctx.fill(); ctx.stroke();
      }
      for(var j=0;j<n;j++){ var x=cellX(j)+cw*0.1, w=cw*0.8, y=ay-ch/2;
        var inA=inR(blkA,j), inB=inR(blkB,j), both=inA&&inB;
        var col=both?'#c9a8ff':inA?'#8fe3b5':inB?'#7ab8ff':'#cfe0ff';
        var fc =both?'rgba(201,168,255,0.30)':inA?'rgba(143,227,181,0.24)':inB?'rgba(122,184,255,0.22)':'rgba(122,184,255,0.10)';
        ctx.fillStyle=fc; ctx.strokeStyle=col; ctx.lineWidth=2;
        if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(x,y,w,ch,4); ctx.fill(); ctx.stroke(); }
        else { ctx.fillRect(x,y,w,ch); ctx.strokeRect(x,y,w,ch); }
        ctx.fillStyle=col; ctx.font='600 14px sans-serif'; ctx.fillText(A[j],x+w/2,y+ch/2);
        ctx.fillStyle='#9b99a3'; ctx.font='10px monospace'; ctx.fillText(j,x+w/2,y+ch+11);
      }
      // sparse table rows (k = 1..K), each cell sp[k][i] spanning 2^k columns
      var ty0=ay+ch+34, rowH=Math.min((H*0.62-ty0)/(K+0.5),46);
      for(var k=1;k<=K;k++){ var len=1<<k, ry=ty0+(k-1)*rowH;
        ctx.fillStyle='#9b99a3'; ctx.font='11px monospace'; ctx.textAlign='right'; ctx.textBaseline='middle';
        ctx.fillText('k='+k+' (len '+len+')', x0-6, ry+rowH*0.42);
        ctx.textAlign='center';
        for(var i2=0;i2+len<=n;i2++){
          var isFilled=f.filled&&f.filled[k]&&f.filled[k][i2];
          var bx=cellX(i2)+2, bw=cw*len-4, by=ry, bh=rowH*0.84;
          var isHot=(f.hk===k&&f.hi===i2);
          var isSrc=(f.src1&&f.src1[0]===k&&f.src1[1]===i2)||(f.src2&&f.src2[0]===k&&f.src2[1]===i2);
          var col=isHot?'#ffb27a':isSrc?'#8fe3b5':isFilled?'#7ab8ff':'#3a3a42';
          var fc =isHot?'rgba(255,178,122,0.26)':isSrc?'rgba(143,227,181,0.20)':isFilled?'rgba(122,184,255,0.14)':'rgba(80,80,90,0.06)';
          ctx.fillStyle=fc; ctx.strokeStyle=col; ctx.lineWidth=isHot?2.4:1.4;
          if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(bx,by,bw,bh,4); ctx.fill(); ctx.stroke(); }
          else { ctx.fillRect(bx,by,bw,bh); ctx.strokeRect(bx,by,bw,bh); }
          if(isFilled){ ctx.fillStyle=col; ctx.font='600 13px sans-serif'; ctx.fillText(sp[k][i2],bx+bw/2,by+bh/2); }
        }
      }
      // answer
      if(f.done){ ctx.textAlign='left'; ctx.fillStyle='#8fe3b5'; ctx.font='600 15px sans-serif';
        ctx.fillText('min[2,6] = '+f.answer, x0, H*0.88); }
      ctx.fillStyle='#9b99a3'; ctx.font='11px sans-serif'; ctx.textAlign='left';
      ctx.fillText('보라 = 두 블록이 겹치는 칸(멱등이라 OK)  ·  초록/파랑 = 왼쪽/오른쪽 2^k 블록', x0, H*0.95);
      ctx.textBaseline='alphabetic'; ctx.textAlign='left';
    },
  },

  { id:'algo_br_ett', concept:true, branchOf:'algo5_03',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('오일러 투어 기법 — 트리를 배열로 펼치기', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('DFS 진입/탈출 시각을 기록하면, 서브트리가 배열의 연속 구간 [tin, tout]이 된다', W/2, H*0.10+22);
      var N={ r:[0.50,0.26,'A','1..8'], a:[0.30,0.50,'B','2..5'], b:[0.70,0.50,'F','6..7'], c:[0.20,0.74,'C','3'], d:[0.40,0.74,'D','4'] };
      var edges=[['r','a'],['r','b'],['a','c'],['a','d']];
      function xy(k){ return [W*0.12+N[k][0]*W*0.5, H*0.22+N[k][1]*H*0.44]; }
      edges.forEach(function(e){ var a=xy(e[0]),b=xy(e[1]); ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke(); });
      Object.keys(N).forEach(function(k){ var p=xy(k), r=(k==='a');
        ctx.fillStyle=r?'rgba(255,178,122,0.22)':'rgba(122,184,255,0.16)'; ctx.strokeStyle=r?'#ffb27a':'#7ab8ff'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.arc(p[0],p[1],18,0,Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.fillStyle=r?'#ffb27a':'#dfeefb'; ctx.font='600 13px sans-serif'; ctx.fillText(N[k][2],p[0],p[1]+1);
        ctx.fillStyle='#8fe3b5'; ctx.font='10px sans-serif'; ctx.fillText(N[k][3],p[0],p[1]+30); });
      // euler array on the right
      var seq=['A','B','C','D','F']; var ex=W*0.66, ey=H*0.40;
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('DFS 순서 배열', ex+seq.length*16, ey-18);
      for(var i=0;i<seq.length;i++){ var x=ex+i*34;
        ctx.fillStyle='rgba(143,227,181,0.14)'; ctx.strokeStyle='#8fe3b5'; ctx.lineWidth=1.5;
        ctx.fillRect(x,ey,30,26); ctx.strokeRect(x,ey,30,26);
        ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif'; ctx.fillText(seq[i],x+15,ey+18);
        ctx.fillStyle='#6a6873'; ctx.font='10px sans-serif'; ctx.fillText(i+1,x+15,ey-6); }
      ctx.strokeStyle='#ffb27a'; ctx.lineWidth=2; ctx.strokeRect(ex+34-2,ey-2,30*4+34-30+4,30);
      ctx.fillStyle='#ffb27a'; ctx.font='11px sans-serif'; ctx.fillText('B의 서브트리 = 구간 [2..5]', ex+2.5*34, ey+44);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('서브트리 갱신·질의 = 배열 구간 연산 → 펜윅/세그트리로 O(log n). 경로는 HLD와 결합', W/2, H*0.90);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('정점 v의 조상 여부도 tin[u] ≤ tin[v] ≤ tout[u] 로 O(1) 판정', W/2, H*0.90+20); }
  },

  { id:'algo_br_grundy', branchOf:'algo8_03',
    code:[
      'grundy(n):                  // 빼기 게임: 1,2,3개 가져가기',
      '  if n == 0: return 0       // 못 두면 패배(종료)',
      '  S = {}                    // 갈 수 있는 다음 상태의 grundy',
      '  for d in {1,2,3} if n-d>=0:',
      '    S.add(grundy(n-d))',
      '  return mex(S)             // S에 없는 최소 음 아닌 정수',
      '// 게임 합의 grundy = 각 grundy의 XOR (0이면 패배)'
    ],
    build:function(V){ var st=[], MAXN=8;
      var g=[];                    // g[n]
      function snap(line,cap,o){ o=o||{};
        st.push({line:line,cap:cap,g:g.slice(),N:o.N==null?-1:o.N,
          moves:(o.moves||[]).slice(), mex:o.mex==null?-1:o.mex,
          phase:o.phase||'g', piles:o.piles||null, xor:o.xor==null?-1:o.xor,
          xstep:o.xstep==null?-1:o.xstep}); }
      snap(0,'<b>빼기 게임</b>: 돌 더미에서 1·2·3개를 가져가고, 못 가져가는(0개) 쪽이 집니다. 각 더미 크기 n의 <b>그런디 수 g(n)</b>을 작은 n부터 구합니다.',{phase:'g'});
      g[0]=0;
      snap(1,'<b>g(0)=0</b>: 더미가 비면 둘 수 없어 그 자리가 곧 <b>패배 상태</b>입니다.',{phase:'g',N:0});
      for(var n=1;n<=MAXN;n++){
        var moves=[];
        for(var d=1;d<=3;d++){ if(n-d>=0) moves.push({d:d,to:n-d,gv:g[n-d]}); }
        var setVals=moves.map(function(m){return m.gv;});
        snap([3,4],'<b>g('+n+')</b>: '+moves.map(function(m){return n+'−'+m.d+'='+m.to+' (g='+m.gv+')';}).join(', ')+' → 다음 상태 grundy 집합 {'+setVals.join(',')+'}.',{phase:'g',N:n,moves:moves});
        var mex=0; while(setVals.indexOf(mex)>=0) mex++;
        g[n]=mex;
        snap(5,'mex{'+setVals.join(',')+'} = <b>'+mex+'</b> (집합에 없는 최소 정수). 따라서 <b>g('+n+')='+mex+'</b>. '+(mex===0?'g=0 → 이 크기는 <b>패배 상태</b>.':'g≠0 → 승리 상태(g=0으로 가는 수 존재).'),{phase:'g',N:n,moves:moves,mex:mex});
      }
      snap(6,'<b>g 표 완성.</b> 이 빼기 게임은 g(n)=n mod 4 패턴이 보입니다 (4·8…에서 g=0=패배).',{phase:'g'});
      // Nim sum via XOR
      var piles=[3,5,6];           // grundy = 크기 자체(Nim)
      snap(7,'이제 더미 여러 개를 동시에 두는 <b>님(Nim)</b>. 한 더미의 grundy = 그 크기. 게임 합의 grundy = 각 크기의 <b>XOR</b>입니다. 더미 = '+piles.join(', ')+'.',{phase:'nim',piles:piles,xor:0,xstep:-1});
      var x=0;
      for(var i=0;i<piles.length;i++){
        x=x^piles[i];
        snap(7,'XOR 누적: '+piles.slice(0,i+1).join(' ⊕ ')+' = <b>'+x+'</b>.',{phase:'nim',piles:piles,xor:x,xstep:i});
      }
      snap(7,(x!==0?'<b>XOR = '+x+' ≠ 0 → 선수(둘 차례) 승리!</b> 어떤 더미를 XOR가 0이 되게 줄이는 수가 존재합니다.':'<b>XOR = 0 → 선수 패배.</b>'),{phase:'nim',piles:piles,xor:x,xstep:piles.length});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      if(f.phase==='g'){
        // 헤더
        ctx.fillStyle='#cfd8e6'; ctx.font='600 15px sans-serif'; ctx.textBaseline='alphabetic';
        ctx.fillText('그런디 수 g(n) = mex{ 다음 상태들의 grundy }', W/2, H*0.10);
        // g 표
        var maxN=8, cellsN=maxN+1;
        var bw=Math.min(46,(W*0.84)/cellsN-6);
        var totalW=cellsN*bw+(cellsN-1)*6, x0=W/2-totalW/2, y0=H*0.20;
        ctx.textBaseline='alphabetic'; ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif'; ctx.textAlign='left';
        ctx.fillText('n →', x0-2, y0-8);
        for(var n=0;n<cellsN;n++){
          var px=x0+n*(bw+6);
          var known=(f.g[n]!=null);
          var isCur=(n===f.N);
          var isLose=(known && f.g[n]===0);
          var col=isCur?'#ffb27a':isLose?'#f4a0c0':known?'#8fe3b5':'#56555f';
          var fill=isCur?'rgba(255,178,122,0.25)':isLose?'rgba(244,160,192,0.18)':known?'rgba(143,227,181,0.15)':'rgba(120,120,130,0.05)';
          if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(px,y0,bw,bw,7); ctx.fillStyle=fill; ctx.fill(); ctx.strokeStyle=col; ctx.lineWidth=isCur?2.4:1.6; ctx.stroke(); }
          else { ctx.fillStyle=fill; ctx.fillRect(px,y0,bw,bw); ctx.strokeStyle=col; ctx.strokeRect(px,y0,bw,bw); }
          ctx.textAlign='center';
          ctx.fillStyle='#9b99a3'; ctx.font='11px monospace'; ctx.fillText('n='+n, px+bw/2, y0+bw+15);
          ctx.fillStyle=col==='#56555f'?'#7f7e8a':'#dfeefb'; ctx.font='600 17px monospace'; ctx.textBaseline='middle';
          ctx.fillText(known?(''+f.g[n]):'?', px+bw/2, y0+bw/2);
          ctx.textBaseline='alphabetic';
        }
        ctx.textAlign='left'; ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif';
        ctx.fillText('g(n)', x0-2, y0+bw/2+4);
        // 현재 n의 다음 상태 화살표
        if(f.N>=0 && f.moves.length){
          var cy=y0+bw+50; ctx.textAlign='center';
          ctx.fillStyle='#cfd8e6'; ctx.font='600 13px sans-serif';
          ctx.fillText('n = '+f.N+' 에서 둘 수 있는 수', W/2, cy);
          var startx=W/2-(f.moves.length*150)/2+75;
          for(var i=0;i<f.moves.length;i++){ var m=f.moves[i];
            var mx=startx+i*150, my=cy+34;
            ctx.fillStyle='rgba(122,184,255,0.12)'; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=1.6;
            if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(mx-66,my-16,132,32,8); ctx.fill(); ctx.stroke(); }
            else { ctx.fillRect(mx-66,my-16,132,32); ctx.strokeRect(mx-66,my-16,132,32); }
            ctx.fillStyle='#cfe0ff'; ctx.font='12px monospace';
            ctx.fillText('−'+m.d+' → '+m.to+'  g='+m.gv, mx, my);
          }
          if(f.mex>=0){
            ctx.fillStyle='#ffb27a'; ctx.font='600 15px sans-serif';
            ctx.fillText('mex = g('+f.N+') = '+f.mex, W/2, my+44);
          }
        }
        // 범례
        ctx.textAlign='center'; ctx.fillStyle='#9b99a3'; ctx.font='11px sans-serif';
        ctx.fillText('초록=계산됨   분홍=g=0(패배 상태)   주황=계산 중', W/2, H*0.965);
      } else {
        // Nim XOR 화면
        ctx.fillStyle='#cfd8e6'; ctx.font='600 16px sans-serif'; ctx.textBaseline='alphabetic';
        ctx.fillText('님(Nim): 게임 합의 grundy = 각 더미 크기의 XOR', W/2, H*0.11);
        var piles=f.piles, n2=piles.length;
        var colW=W*0.74/n2, x0b=W*0.13;
        for(var p=0;p<n2;p++){
          var cx=x0b+colW*(p+0.5), sz=piles[p];
          var active=(p<=f.xstep || f.xstep>=n2);
          var col=active?'#7ab8ff':'#56555f';
          // 돌 더미 (세로 쌓기)
          var stoneR=11, baseY=H*0.62;
          for(var s=0;s<sz;s++){
            ctx.beginPath(); ctx.arc(cx, baseY-s*(stoneR*2+4), stoneR, 0, 7);
            ctx.fillStyle=active?'rgba(122,184,255,0.22)':'rgba(120,120,130,0.08)';
            ctx.fill(); ctx.strokeStyle=col; ctx.lineWidth=1.5; ctx.stroke();
          }
          ctx.textAlign='center'; ctx.fillStyle=active?'#cfe0ff':'#7f7e8a'; ctx.font='600 14px sans-serif';
          ctx.fillText('더미 '+(p+1), cx, baseY+30);
          ctx.fillStyle=active?'#ffb27a':'#56555f'; ctx.font='600 18px monospace';
          ctx.fillText('= '+sz, cx, baseY+54);
          // 이진 표현
          var bin=sz.toString(2);
          while(bin.length<3) bin='0'+bin;
          ctx.fillStyle=active?'#9bbff0':'#56555f'; ctx.font='13px monospace';
          ctx.fillText(bin+'(2)', cx, baseY+76);
          if(p<n2-1){ ctx.fillStyle='#9b99a3'; ctx.font='600 22px sans-serif'; ctx.fillText('⊕', x0b+colW*(p+1), baseY-10); }
        }
        // XOR 결과
        if(f.xor>=0){
          var done=(f.xstep>=n2);
          var xbin=f.xor.toString(2); while(xbin.length<3) xbin='0'+xbin;
          ctx.textAlign='center';
          ctx.fillStyle=done?(f.xor!==0?'#8fe3b5':'#f4a0c0'):'#ffb27a'; ctx.font='600 22px sans-serif';
          ctx.fillText('XOR = '+f.xor+'  ('+xbin+')₂', W/2, H*0.84);
          if(done){
            ctx.font='600 15px sans-serif';
            ctx.fillStyle=f.xor!==0?'#8fe3b5':'#f4a0c0';
            ctx.fillText(f.xor!==0?'≠ 0 → 둘 차례(선수) 승리':'= 0 → 둘 차례(선수) 패배', W/2, H*0.90);
          }
        }
      } }
  },

  { id:'algo_br_pollard', concept:true, branchOf:'algo2_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('폴라드 로 — 큰 합성수의 약수를 빠르게', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('수열 x→x²+c (mod n)이 ρ(로)처럼 순환. 그 주기에서 약수가 새어나온다', W/2, H*0.10+22);
      // draw a rho-shaped path: a tail leading into a cycle
      var cx=W*0.62, cy=H*0.48, r=H*0.18;
      ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2.5;
      ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W*0.20,H*0.30); ctx.lineTo(cx-r*0.72,cy-r*0.72); ctx.stroke();
      // dots
      ctx.fillStyle='#8fe3b5';
      var tail=[[0.20,0.30],[0.27,0.345],[0.34,0.39],[0.41,0.435]];
      tail.forEach(function(t){ ctx.beginPath(); ctx.arc(W*t[0],H*t[1],5,0,Math.PI*2); ctx.fill(); });
      ctx.fillStyle='#6a6873'; ctx.font='12px sans-serif';
      ctx.fillText('x₀ → x₁ → x₂ → …', W*0.27, H*0.27);
      ctx.fillText('꼬리(tail)', W*0.30, H*0.46);
      ctx.fillStyle='#ffb27a'; ctx.fillText('순환(cycle)', cx, cy);
      ctx.fillStyle='#dfeefb'; ctx.font='600 14px sans-serif';
      ctx.fillText('gcd( |xᵢ − x₂ᵢ| , n ) 가 1도 n도 아니면 → 그 값이 약수!', W/2, H*0.78);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('플로이드 거북-토끼로 순환 탐지. 기대 시간 O(n^¼) — 시행착오 나눗셈보다 압도적으로 빠름', W/2, H*0.88);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('밀러-라빈으로 소수 판정 + 폴라드 로로 약수 추출 → 큰 수 소인수분해의 표준 조합', W/2, H*0.88+20); }
  },

  { id:'algo_br_lucas', concept:true, branchOf:'algo7_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('뤼카 정리 — 이항계수를 소수 p로 나눈 나머지', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('C(n, k) mod p 를, n·k를 p진법으로 적어 자릿수별 작은 조합의 곱으로', W/2, H*0.10+22);
      // example C(7,3) mod 3 ; 7=21_3, 3=10_3
      ctx.fillStyle='#dfeefb'; ctx.font='600 16px sans-serif';
      ctx.fillText('예: C(7, 3) mod 3', W/2, H*0.30);
      ctx.font='600 15px sans-serif';
      ctx.fillStyle='#7ab8ff'; ctx.fillText('7 = (2 1)₃', W*0.34, H*0.42);
      ctx.fillStyle='#8fe3b5'; ctx.fillText('3 = (1 0)₃', W*0.66, H*0.42);
      ctx.fillStyle='#ffb27a'; ctx.font='600 17px sans-serif';
      ctx.fillText('C(7,3) ≡ C(2,1) × C(1,0)  (mod 3)', W/2, H*0.56);
      ctx.fillStyle='#dfeefb'; ctx.font='600 16px sans-serif';
      ctx.fillText('≡ 2 × 1 = 2  (mod 3)', W/2, H*0.68);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('자릿수별 C(nᵢ, kᵢ)의 곱. 어떤 자리에서 kᵢ > nᵢ 이면 그 항이 0 → 전체가 0', W/2, H*0.82);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('n이 10^18처럼 거대해도 p가 작은 소수면 O(log_p n) 자리만 계산. 조합론 mod 소수의 핵심', W/2, H*0.82+20); }
  },

  { id:'algo_br_incexc', branchOf:'algo8_03',
    code:[
      '|A∪B∪C| 포함배제:',
      '  s ← |A| + |B| + |C|          // 홀수 교집합: 더함',
      '  s ← s − |A∩B| − |A∩C| − |B∩C| // 짝수: 뺌',
      '  s ← s + |A∩B∩C|             // 홀수: 다시 더함',
      '  return s                     // 합집합 크기'
    ],
    build:function(V){
      // 영역별 개수 (1..100 중 2,3,5 의 배수 예)
      // A=2의배수, B=3의배수, C=5의배수, in 1..30 로 작은 예
      var Na=15,Nb=10,Nc=6, Nab=5,Nac=3,Nbc=2, Nabc=1; // 30 이하 가정값
      var st=[]; var s=0;
      function snap(line,cap,terms,total,o){ o=o||{}; st.push({line:line,cap:cap,
        terms:terms.slice(),total:total,active:o.active||null,sign:o.sign||0,done:o.done||false}); }
      var terms=[];
      snap([0],'1~30 중 <b>2·3·5의 배수</b> 개수를 셉니다. A=2의배수(15), B=3의배수(10), C=5의배수(6).',terms,0);
      snap([0],'세 집합은 서로 <b>겹칩니다</b>(예: 6 은 A·B 양쪽, 30 은 셋 모두). 그냥 더하면 겹친 영역이 여러 번 세어집니다.',terms,0);
      // ① 단일 더하기 (세 항을 하나씩)
      s+=Na; terms.push('+|A|');
      snap([1],'<b>① 단일(+)</b> |A| 더하기: +15. 합 = <b>'+s+'</b>.',terms,s,{active:'single',sign:1});
      s+=Nb; terms.push('+|B|');
      snap([1],'<b>① 단일(+)</b> |B| 더하기: +10. 합 = <b>'+s+'</b>.',terms,s,{active:'single',sign:1});
      s+=Nc; terms.push('+|C|');
      snap([1],'<b>① 단일(+)</b> |C| 더하기: +6. 합 = <b>'+s+'</b>. 겹친 영역이 중복으로 세어졌습니다.',terms,s,{active:'single',sign:1});
      // ② 둘씩 교집합 빼기
      s-=Nab; terms.push('−|A∩B|');
      snap([2],'<b>② 둘씩 교집합(−)</b> −|A∩B| = −5 (6·다 = 6의배수). 합 = <b>'+s+'</b>.',terms,s,{active:'pair',sign:-1});
      s-=Nac; terms.push('−|A∩C|');
      snap([2],'<b>② 둘씩 교집합(−)</b> −|A∩C| = −3 (10의배수). 합 = <b>'+s+'</b>.',terms,s,{active:'pair',sign:-1});
      s-=Nbc; terms.push('−|B∩C|');
      snap([2],'<b>② 둘씩 교집합(−)</b> −|B∩C| = −2 (15의배수). 합 = <b>'+s+'</b>. 두 번 센 부분을 뺐습니다.',terms,s,{active:'pair',sign:-1});
      // ③ 셋의 교집합 더하기
      s+=Nabc; terms.push('+|A∩B∩C|');
      snap([3],'<b>③ 셋의 교집합(+)</b> +|A∩B∩C| = +1 (30의배수). 너무 많이 빠진 가운데를 보정. 합 = <b>'+s+'</b>.',terms,s,{active:'triple',sign:1});
      snap([4],'<b>완료!</b> |A∪B∪C| = 31−10+1 = <b>'+s+'</b>. 홀수 교집합 +, 짝수 교집합 − 으로 각 영역이 정확히 한 번 세어집니다.',terms,s,{done:true});
      snap([4],'<b>여사건 응용</b>: 1~30 중 2·3·5 의 배수가 <b>아닌</b> 수 = 30 − '+s+' = <b>'+(30-s)+'</b>개 (전체 − 합집합).',terms,s,{done:true});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H;
      ctx.textAlign='center'; ctx.fillStyle='#cfd8e6'; ctx.font='600 15px sans-serif';
      ctx.fillText('포함배제: 더하고(+) 빼며(−) 중복 보정', W/2, H*0.10);
      var cx=W*0.5, cy=H*0.42, r=H*0.18, off=r*0.62;
      var A={x:cx-off,y:cy-off*0.55}, B={x:cx+off,y:cy-off*0.55}, C={x:cx,y:cy+off*0.7};
      var act=f.active;
      // 영역 채움: 활성에 따라
      function fillCircle(c,col,a){ ctx.fillStyle=col; ctx.globalAlpha=a; ctx.beginPath(); ctx.arc(c.x,c.y,r,0,7); ctx.fill(); ctx.globalAlpha=1; }
      // 기본 외곽
      var cols={A:'#ffb27a',B:'#7ab8ff',C:'#8fe3b5'};
      var baseA = act==='single'?0.20:0.10;
      fillCircle(A,'#ffb27a',baseA);
      fillCircle(B,'#7ab8ff',baseA);
      fillCircle(C,'#8fe3b5',baseA);
      // 교집합 강조 (근사: 중심 사이 작은 원으로 표시)
      function lens(p,q,col,a){ var mx=(p.x+q.x)/2,my=(p.y+q.y)/2;
        ctx.fillStyle=col; ctx.globalAlpha=a; ctx.beginPath(); ctx.arc(mx,my,r*0.42,0,7); ctx.fill(); ctx.globalAlpha=1; }
      if(act==='pair'){ lens(A,B,'#f4a0c0',0.4); lens(A,C,'#f4a0c0',0.4); lens(B,C,'#f4a0c0',0.4); }
      if(act==='triple'||f.done){ ctx.fillStyle='#dfeefb'; ctx.globalAlpha=(act==='triple')?0.55:0.25;
        ctx.beginPath(); ctx.arc(cx,cy-off*0.1,r*0.30,0,7); ctx.fill(); ctx.globalAlpha=1; }
      // 외곽선
      ctx.lineWidth=2.2;
      [[A,'#ffb27a','A'],[B,'#7ab8ff','B'],[C,'#8fe3b5','C']].forEach(function(o){
        ctx.strokeStyle=o[1]; ctx.beginPath(); ctx.arc(o[0].x,o[0].y,r,0,7); ctx.stroke();
        ctx.fillStyle=o[1]; ctx.font='600 16px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
        var lx=o[0].x+(o[2]==='A'?-r*0.7:o[2]==='B'?r*0.7:0), ly=o[0].y+(o[2]==='C'?r*0.7:-r*0.7);
        ctx.fillText(o[2],lx,ly); });
      ctx.textBaseline='alphabetic';
      // 항 누적 식
      ctx.textAlign='left'; ctx.fillStyle='#9b99a3'; ctx.font='600 13px sans-serif';
      var tx=W*0.10, ty=H*0.74;
      ctx.fillText('식:',tx,ty);
      var bx=tx+30;
      for(var i=0;i<f.terms.length;i++){ var t=f.terms[i];
        var plus=(t.charAt(0)==='+'); var col=plus?'#8fe3b5':'#f4a0c0';
        ctx.fillStyle=col; ctx.font='600 14px monospace';
        var w=ctx.measureText(t).width+6;
        if(bx+w>W*0.92){ bx=tx+30; ty+=24; }
        ctx.fillText(t,bx,ty); bx+=w+4;
      }
      // total
      ctx.textAlign='center'; ctx.fillStyle=f.done?'#8fe3b5':'#ffb27a'; ctx.font='600 18px sans-serif';
      ctx.fillText('합집합 크기 = '+f.total, W/2, H*0.92);
    }
  },

  { id:'algo_br_catalan', concept:true, branchOf:'algo7_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('카탈란 수 — 올바른 괄호·이진트리·경로의 개수', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('Cₙ = 1,1,2,5,14,42,… 서로 달라 보이는 수많은 문제가 모두 이 한 수열', W/2, H*0.10+22);
      // sequence boxes
      var seq=[['C₀',1],['C₁',1],['C₂',2],['C₃',5],['C₄',14],['C₅',42]];
      var bw=80, bx=W*0.5-(seq.length*bw)/2, by=H*0.28;
      for(var i=0;i<seq.length;i++){ var x=bx+i*bw;
        ctx.fillStyle='rgba(122,184,255,0.14)'; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=1.5;
        ctx.fillRect(x,by,bw-10,40); ctx.strokeRect(x,by,bw-10,40);
        ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif'; ctx.fillText(seq[i][0],x+(bw-10)/2,by-6);
        ctx.fillStyle='#dfeefb'; ctx.font='600 16px sans-serif'; ctx.fillText(seq[i][1],x+(bw-10)/2,by+26); }
      // C3=5 balanced parentheses
      ctx.fillStyle='#8fe3b5'; ctx.font='600 14px sans-serif';
      ctx.fillText('C₃ = 5 가지 올바른 괄호: ((())) (()()) (())() ()(()) ()()()', W/2, H*0.50);
      ctx.fillStyle='#ffb27a'; ctx.font='600 16px sans-serif';
      ctx.fillText('Cₙ = C(2n, n) / (n+1) = Σ Cᵢ · Cₙ₋₁₋ᵢ', W/2, H*0.64);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('점화식 = 첫 괄호 안(i쌍)과 밖(n−1−i쌍)으로 쪼개 곱하고 더하기 → DP로 O(n²) 또는 공식 O(n)', W/2, H*0.78);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('같은 수: 노드 n개 이진트리 모양, 격자 대각선 안 넘는 경로, 다각형 삼각분할, 스택 가능한 순열', W/2, H*0.88); }
  },

  { id:'algo_br_lct', concept:true, branchOf:'algo5_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('링크컷 트리 — 변하는 숲을 O(log n)에 다루기', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('간선을 잇고(link) 끊고(cut), 경로 질의까지 모두 분할상환 O(log n)', W/2, H*0.10+22);
      // draw a preferred-path chain (bold) and light edges
      var cx=W/2;
      // preferred path: vertical bold chain
      var chain=[[cx,H*0.30],[cx,H*0.44],[cx,H*0.58],[cx,H*0.72]];
      ctx.strokeStyle='#ffb27a'; ctx.lineWidth=4;
      ctx.beginPath(); ctx.moveTo(chain[0][0],chain[0][1]); for(var i=1;i<chain.length;i++)ctx.lineTo(chain[i][0],chain[i][1]); ctx.stroke();
      // light side edges
      ctx.strokeStyle='rgba(122,184,255,0.4)'; ctx.lineWidth=2;
      var sides=[[chain[1],[cx-W*0.16,H*0.52]],[chain[2],[cx+W*0.16,H*0.66]]];
      sides.forEach(function(s){ ctx.beginPath(); ctx.moveTo(s[0][0],s[0][1]); ctx.lineTo(s[1][0],s[1][1]); ctx.stroke(); });
      function node(p,col){ ctx.fillStyle=col.replace(')',',0.2)').indexOf('rgba')<0?'rgba(122,184,255,0.18)':col; ctx.fillStyle='rgba(122,184,255,0.18)'; if(col==='#ffb27a')ctx.fillStyle='rgba(255,178,122,0.22)';
        ctx.strokeStyle=col; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(p[0],p[1],13,0,Math.PI*2); ctx.fill(); ctx.stroke(); }
      chain.forEach(function(p){ node(p,'#ffb27a'); });
      node([cx-W*0.16,H*0.52],'#7ab8ff'); node([cx+W*0.16,H*0.66],'#7ab8ff');
      ctx.fillStyle='#ffb27a'; ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillText('선호 경로(splay 트리 한 개로 저장)', cx+18, H*0.30); ctx.textAlign='center';
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('access(v): v까지의 경로를 하나의 선호 경로로 모은다 → 그 트리의 루트로 splay', W/2, H*0.84);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('숲을 선호 경로들로 쪼개 각 경로를 스플레이 트리로. link/cut/경로합/경로최댓값 모두 분할상환 O(log n)', W/2, H*0.84+18);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('동적 트리 연결성, 동적 MST, 최대 유량의 동적 트리 가속 등에 사용. HLD의 동적 버전', W/2, H*0.84+36); }
  },

  { id:'algo_br_skiplist', concept:true, branchOf:'algo2_02',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('스킵 리스트 — 동전을 던져 만드는 빠른 리스트', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('정렬된 연결 리스트에 무작위 고속 차선을 얹어 탐색을 기대 O(log n)에', W/2, H*0.10+22);
      var vals=[1,3,5,7,9,11,13]; var n=vals.length;
      var bx=W*0.5-(n*60)/2, baseY=H*0.72, lvlH=H*0.13;
      // levels: which nodes appear at each level
      var lv=[[0,1,2,3,4,5,6],[0,2,4,6],[0,4],[0]];
      for(var L=0;L<lv.length;L++){ var y=baseY-L*lvlH; var prev=null;
        var col=L===0?'#7ab8ff':(L===3?'#ffb27a':'#8fe3b5');
        // line across
        for(var j=0;j<lv[L].length;j++){ var idx=lv[L][j]; var x=bx+idx*60;
          if(prev!==null){ ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(prev+18,y); ctx.lineTo(x-18,y); ctx.stroke();
            ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.moveTo(x-18,y); ctx.lineTo(x-24,y-4); ctx.lineTo(x-24,y+4); ctx.fill(); }
          ctx.fillStyle=L===0?'rgba(122,184,255,0.18)':'rgba(143,227,181,0.14)'; ctx.strokeStyle=col; ctx.lineWidth=2;
          ctx.beginPath(); ctx.arc(x,y,16,0,Math.PI*2); ctx.fill(); ctx.stroke();
          ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif'; ctx.fillText(vals[idx],x,y+4);
          prev=x; }
        ctx.fillStyle='#6a6873'; ctx.font='11px sans-serif'; ctx.textAlign='right'; ctx.fillText('L'+L,bx-30,y+4); ctx.textAlign='center'; }
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('탐색: 맨 위 차선에서 최대한 멀리 → 막히면 한 층 내려가기 (이분 탐색처럼)', W/2, H*0.90);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('각 노드는 동전을 던져 ½ 확률로 한 층씩 위로 → 기대 높이 O(log n). 균형 트리의 단순한 대안', W/2, H*0.90+18); }
  },

  { id:'algo_br_reservoir', concept:true, branchOf:'algo4_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('저수지 샘플링 — 끝을 모르는 스트림에서 공정하게 뽑기', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('데이터가 한 번에 흘러가고 전체 개수도 모를 때, 메모리 k칸으로 균등 표본을', W/2, H*0.10+22);
      // stream of items flowing into a reservoir of size k=1
      var stream=[1,2,3,4,5,6,7,8]; var sx=W*0.12, sy=H*0.38;
      ctx.font='600 14px sans-serif';
      for(var i=0;i<stream.length;i++){ var x=sx+i*((W*0.76)/stream.length);
        ctx.fillStyle='rgba(122,184,255,0.16)'; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.arc(x,sy,15,0,Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.fillStyle='#dfeefb'; ctx.fillText(stream[i],x,sy+5); }
      ctx.fillStyle='#6a6873'; ctx.font='12px sans-serif'; ctx.fillText('스트림: 1, 2, 3, … 끝을 모름 →', W*0.5, sy-26);
      // reservoir box
      ctx.strokeStyle='#ffb27a'; ctx.lineWidth=2.5; ctx.strokeRect(W*0.42,H*0.56,W*0.16,H*0.12);
      ctx.fillStyle='#ffb27a'; ctx.font='600 14px sans-serif'; ctx.fillText('저수지 (k=1)', W*0.5, H*0.54);
      ctx.fillStyle='#dfeefb'; ctx.font='600 16px sans-serif'; ctx.fillText('현재 표본', W*0.5, H*0.62);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('i번째 원소를 확률 k/i 로 받아들여 무작위 한 칸을 교체 → 매 시점 모든 원소가 정확히 k/i 확률', W/2, H*0.80);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('스트림이 끝나면 각 원소가 균등하게 k/n 확률로 표본 안에 → 1패스·O(1) 추가메모리(k칸)', W/2, H*0.80+18);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('쓰임: 거대 로그·무한 스트림 무작위 추출, 분산 환경 표본, A/B 테스트', W/2, H*0.80+36); }
  },

  { id:'algo_br_ntt', branchOf:'algo8_03',
    code:[
      'NTT(a):     // mod p=17, 원시근 g=3, n=4',
      '  ω ← g^((p-1)/n) mod p    // n차 원시근',
      '  if |a|==1: return a',
      '  (a_even, a_odd) ← 짝수·홀수 분할',
      '  y_e ← NTT(a_even);  y_o ← NTT(a_odd)',
      '  for k in 0..n/2-1:        // 버터플라이(mod p)',
      '    t ← ω^k · y_o[k]  mod p',
      '    y[k]      ← (y_e[k] + t) mod p',
      '    y[k+n/2]  ← (y_e[k] - t) mod p',
      '  return y'
    ],
    build:function(V){
      var a=[1,2,3,4], n=4, p=17, g=3, st=[];
      function snap(line,cap,extra){ var f={line:line,cap:cap,a:a,n:n,p:p}; if(extra)for(var k in extra)f[k]=extra[k]; st.push(f); }
      function mod(x){ return ((x%p)+p)%p; }
      function mpow(b,e){ var r=1; b=mod(b); while(e>0){ if(e&1) r=mod(r*b); b=mod(b*b); e>>=1; } return r; }
      var w=mpow(g,(p-1)/n);            // = 13
      var ev=[a[0],a[2]], od=[a[1],a[3]];
      var Ye=[mod(ev[0]+ev[1]), mod(ev[0]-ev[1])]; // [4,15]
      var Yo=[mod(od[0]+od[1]), mod(od[0]-od[1])]; // [6,15]
      var Y=[null,null,null,null];
      snap(0,'정수판 FFT. 모듈러 <b>p=17</b>, 원시근 <b>g=3</b>, 변환 길이 n=4. 부동소수 없이 <b>오차 0</b>.',{stage:'start'});
      snap(1,'복소 단위근 대신 <b>n차 원시근</b> ω = g^((p−1)/n) = 3^4 = <b>'+w+'</b> (mod 17). ω⁴≡1, ω²≡16≡−1 — 단위근 성질 그대로!',{stage:'root',w:w});
      snap(3,'<b>분할:</b> 짝수 [1,3], 홀수 [2,4]. FFT와 완전히 같은 분할정복 구조입니다.',{stage:'split',ev:ev,od:od,w:w});
      snap(4,'<b>재귀</b> (크기 2, mod 17): NTT[1,3]=[1+3,1−3]=<b>[4,15]</b>, NTT[2,4]=[6, −2≡<b>15</b>].',{stage:'recurse',ev:ev,od:od,Ye:Ye,Yo:Yo,w:w});
      for(var k=0;k<n/2;k++){
        var wk=mpow(w,k); var t=mod(wk*Yo[k]);
        Y[k]=mod(Ye[k]+t); Y[k+n/2]=mod(Ye[k]-t);
        snap([5,6,7,8],'<b>버터플라이 k='+k+':</b> ω^'+k+'='+wk+', t=ω^'+k+'·y_o['+k+']='+wk+'·'+Yo[k]+'≡<b>'+t+'</b>. → y['+k+']=('+Ye[k]+'+'+t+')≡<b>'+Y[k]+'</b>, y['+(k+n/2)+']=('+Ye[k]+'−'+t+')≡<b>'+Y[k+n/2]+'</b> (mod 17).',
          {stage:'bfly',ev:ev,od:od,Ye:Ye,Yo:Yo,w:w,Y:Y.slice(),bk:k,t:t,wk:wk});
      }
      snap(9,'<b>완료!</b> 점값 [10, 6, 15, 7] — 모두 정수. 같은 버터플라이를 mod p로 했을 뿐, 결과는 정확합니다. 큰 정수 곱셈을 <b>오차 없이</b> O(n log n).',{stage:'done',ev:ev,od:od,Ye:Ye,Yo:Yo,w:w,Y:Y.slice(),bk:-1});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H;
      ctx.textAlign='center'; ctx.textBaseline='alphabetic';
      ctx.fillStyle='#cfd8e6'; ctx.font='600 15px sans-serif';
      ctx.fillText('NTT = FFT의 버터플라이를 mod p 정수로 (오차 0)', W/2, H*0.085);
      // 모듈러 원시근 거듭제곱 고리 (좌)
      var cx=W*0.22, cy=H*0.50, R=Math.min(W*0.15,H*0.29);
      ctx.strokeStyle='rgba(255,255,255,0.13)'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(cx,cy,R,0,7); ctx.stroke();
      ctx.fillStyle='#6f6e7a'; ctx.font='11px sans-serif'; ctx.fillText('ω의 거듭제곱 (mod 17)', cx, cy-R-16);
      var pw=[1,13,16,4]; // w^0..w^3
      for(var t=0;t<4;t++){ var ang=-t*Math.PI/2+Math.PI/2; var px=cx+R*Math.cos(ang), py=cy-R*Math.sin(ang);
        var hot=(f.stage==='bfly'||f.stage==='done')&&f.bk!=null&&(t===f.bk||t===f.bk+2);
        ctx.fillStyle=hot?'#ffb27a':'#7ab8ff'; ctx.beginPath(); ctx.arc(px,py,hot?16:13,0,7); ctx.fill();
        ctx.fillStyle='#10131a'; ctx.font='600 12px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(''+pw[t],px,py); ctx.textBaseline='alphabetic';
        ctx.fillStyle=hot?'#ffb27a':'#9fb6d6'; ctx.font='10px monospace'; ctx.fillText('ω'+t, px, py+ (Math.sin(ang)>0?-22:26)); }
      // 배열 패널 (우)
      var rx=W*0.46, rw=W*0.50;
      function row(label,arr,y,colf,x0,wfrac){ x0=x0==null?rx:x0; var totw=wfrac?rw*wfrac:rw;
        ctx.textAlign='left'; ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif'; ctx.fillText(label,x0,y-6);
        var m=arr.length, bw=Math.min(64,totw/m-8);
        for(var i=0;i<m;i++){ var x=x0+i*(bw+8); var col=colf?colf(i):null;
          ctx.fillStyle=col?col.fill:'rgba(122,184,255,0.10)'; ctx.strokeStyle=col?col.stroke:'#3c4a5e'; ctx.lineWidth=col?2:1;
          if(ctx.roundRect){ctx.beginPath(); ctx.roundRect(x,y,bw,30,6); ctx.fill(); ctx.stroke();} else {ctx.fillRect(x,y,bw,30); ctx.strokeRect(x,y,bw,30);}
          ctx.fillStyle=col?col.text:'#dfeefb'; ctx.font='600 14px monospace'; ctx.textAlign='center';
          ctx.fillText(arr[i]==null?'·':(''+arr[i]), x+bw/2, y+20); ctx.textAlign='left'; }
      }
      row('입력 a', f.a, H*0.19, function(i){ if(f.stage==='split') return (i%2===0)?{fill:'rgba(143,227,181,0.2)',stroke:'#8fe3b5',text:'#8fe3b5'}:{fill:'rgba(244,160,192,0.2)',stroke:'#f4a0c0',text:'#f4a0c0'}; return null; });
      if(f.ev){ row('짝 [1,3]', f.ev, H*0.35, function(){return {fill:'rgba(143,227,181,0.16)',stroke:'#8fe3b5',text:'#8fe3b5'};}, rx, 0.46);
        row('홀 [2,4]', f.od, H*0.35, function(){return {fill:'rgba(244,160,192,0.16)',stroke:'#f4a0c0',text:'#f4a0c0'};}, rx+rw*0.52, 0.46);
      }
      if(f.Ye){ row('y_e (mod17)', f.Ye, H*0.51, function(){return {fill:'rgba(143,227,181,0.16)',stroke:'#8fe3b5',text:'#8fe3b5'};}, rx, 0.46);
        row('y_o (mod17)', f.Yo, H*0.51, function(){return {fill:'rgba(244,160,192,0.16)',stroke:'#f4a0c0',text:'#f4a0c0'};}, rx+rw*0.52, 0.46);
      }
      if(f.Y){ row('점값 y (mod17)', f.Y, H*0.69, function(i){ if(f.Y[i]==null) return {fill:'rgba(255,255,255,0.03)',stroke:'#2c3543',text:'#5a5a64'};
        if(f.stage==='bfly'&&f.bk!=null&&(i===f.bk||i===f.bk+2)) return {fill:'rgba(255,178,122,0.28)',stroke:'#ffb27a',text:'#ffb27a'};
        return {fill:'rgba(122,184,255,0.16)',stroke:'#7ab8ff',text:'#dfeefb'}; });
      }
      var badge=f.stage==='start'?'준비':f.stage==='root'?'원시근':f.stage==='split'?'분할':f.stage==='recurse'?'재귀':f.stage==='bfly'?'버터플라이(mod p)':'완료';
      ctx.textAlign='center'; ctx.fillStyle=(f.stage==='done')?'#8fe3b5':'#ffb27a'; ctx.font='600 13px sans-serif';
      ctx.fillText('▶ '+badge, W/2, H*0.95); }
  },

  { id:'algo_br_hungarian', concept:true, branchOf:'algo6_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('헝가리안 알고리즘 — 최소 비용 할당', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('n명의 일꾼을 n개의 일에 1:1로 배정, 총비용을 최소로. 비용 행렬에서 O(n³)', W/2, H*0.10+22);
      // cost matrix
      var M=[[4,2,8],[2,3,7],[3,1,6]]; var bx=W*0.30, by=H*0.30, cw=58;
      ctx.font='600 12px sans-serif';
      ctx.fillStyle='#6a6873'; ['일 A','일 B','일 C'].forEach(function(t,j){ ctx.fillText(t,bx+j*cw+cw/2,by-8); });
      var pick={0:1,1:0,2:1}; // chosen cells (row->col) example optimal: A1? illustrate
      for(var r=0;r<3;r++){ ctx.fillStyle='#6a6873'; ctx.textAlign='right'; ctx.fillText('일꾼 '+(r+1),bx-8,by+r*46+28); ctx.textAlign='center';
        for(var c=0;c<3;c++){ var x=bx+c*cw, y=by+r*46;
          var on=(r===0&&c===1)||(r===1&&c===0)||(r===2&&c===2);
          ctx.fillStyle=on?'rgba(143,227,181,0.25)':'rgba(122,184,255,0.10)'; ctx.strokeStyle=on?'#8fe3b5':'#43506a'; ctx.lineWidth=on?2.5:1.2;
          ctx.fillRect(x,y,cw-8,38); ctx.strokeRect(x,y,cw-8,38);
          ctx.fillStyle=on?'#8fe3b5':'#dfeefb'; ctx.font=on?'700 16px sans-serif':'14px sans-serif'; ctx.fillText(M[r][c],x+(cw-8)/2,y+24); } }
      ctx.fillStyle='#8fe3b5'; ctx.font='600 14px sans-serif';
      ctx.fillText('최적 할당: 1→B(2) + 2→A(2) + 3→C(6) = 10 (각 행·열 정확히 하나)', W/2, H*0.66);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('핵심: 행/열에서 상수를 빼도 최적 할당은 불변 → 0을 많이 만들고 0들로 완전 매칭 시도', W/2, H*0.80);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('쾨니그 정리(최소 선 덮기=최대 매칭)로 부족분을 조정. 이분 그래프 최소비용 완전매칭의 O(n³) 해법', W/2, H*0.80+20); }
  },

  { id:'algo_br_hopcroft', concept:true, branchOf:'algo6_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('호프크로프트-카프 — 이분 매칭을 더 빠르게', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('증대 경로를 하나씩 말고 BFS로 한꺼번에 여러 개 찾아 O(E√V)로 가속', W/2, H*0.10+22);
      // bipartite graph with matched (bold) and augmenting path
      var L=[[W*0.30,H*0.34],[W*0.30,H*0.50],[W*0.30,H*0.66]];
      var R=[[W*0.70,H*0.34],[W*0.70,H*0.50],[W*0.70,H*0.66]];
      // edges
      var matched=[[0,0],[1,1]]; var aug=[[2,1],[1,2]]; // augmenting path L2-R1=R1-L1? illustrate shortest aug
      ctx.lineWidth=1.5; ctx.strokeStyle='rgba(122,184,255,0.3)';
      [[0,0],[0,1],[1,1],[1,2],[2,1]].forEach(function(e){ ctx.beginPath(); ctx.moveTo(L[e[0]][0],L[e[0]][1]); ctx.lineTo(R[e[1]][0],R[e[1]][1]); ctx.stroke(); });
      ctx.strokeStyle='#8fe3b5'; ctx.lineWidth=4;
      matched.forEach(function(e){ ctx.beginPath(); ctx.moveTo(L[e[0]][0],L[e[0]][1]); ctx.lineTo(R[e[1]][0],R[e[1]][1]); ctx.stroke(); });
      ctx.strokeStyle='#ffb27a'; ctx.lineWidth=3; ctx.setLineDash([7,5]);
      [[2,1],[1,2]].forEach(function(e){ ctx.beginPath(); ctx.moveTo(L[e[0]][0],L[e[0]][1]); ctx.lineTo(R[e[1]][0],R[e[1]][1]); ctx.stroke(); }); ctx.setLineDash([]);
      function dots(arr,col){ arr.forEach(function(p,i){ ctx.fillStyle='rgba(122,184,255,0.18)'; ctx.strokeStyle=col; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(p[0],p[1],15,0,Math.PI*2); ctx.fill(); ctx.stroke(); }); }
      dots(L,'#7ab8ff'); dots(R,'#7ab8ff');
      ctx.fillStyle='#8fe3b5'; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('— 매칭된 간선', W*0.40, H*0.86); ctx.textAlign='center';
      ctx.fillStyle='#ffb27a'; ctx.fillText('--- 증대 경로(번갈아 가며 길이 늘리기)', W*0.5, H*0.92);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('각 라운드: BFS로 최단 증대 경로 길이를 구하고, 그 길이의 경로들을 DFS로 동시에 모두 증대', W/2, H*0.78);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('라운드 수가 O(√V)로 묶여 전체 O(E√V) — 단순 증대(O(VE))보다 빠른 이분 매칭의 표준', W/2, H*0.78+18); }
  },

  { id:'algo_br_stoerwagner', concept:true, branchOf:'algo6_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('슈토어-바그너 — 전역 최소 컷 (소스 지정 없이)', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('그래프를 두 덩어리로 가르는 가장 가벼운 절단을, s·t를 고르지 않고 직접', W/2, H*0.10+22);
      // graph with a cut line
      var N={a:[0.30,0.32],b:[0.44,0.58],c:[0.34,0.78],d:[0.66,0.32],e:[0.72,0.62],f:[0.60,0.82]};
      var ed=[['a','b',3],['b','c',4],['a','c',3],['b','e',2],['d','e',3],['d','f',2],['e','f',3]];
      function xy(k){ return [W*0.1+N[k][0]*W*0.8, H*0.24+N[k][1]*H*0.5]; }
      ed.forEach(function(e){ var p=xy(e[0]),q=xy(e[1]); var cut=(e[0]==='b'&&e[1]==='e');
        ctx.strokeStyle=cut?'#ff8d8d':'rgba(255,255,255,0.25)'; ctx.lineWidth=cut?3:2; ctx.beginPath(); ctx.moveTo(p[0],p[1]); ctx.lineTo(q[0],q[1]); ctx.stroke();
        ctx.fillStyle=cut?'#ff8d8d':'#8a8893'; ctx.font='11px sans-serif'; ctx.fillText(e[2],(p[0]+q[0])/2,(p[1]+q[1])/2-4); });
      Object.keys(N).forEach(function(k){ var p=xy(k); var left=['a','b','c'].indexOf(k)>=0;
        ctx.fillStyle=left?'rgba(122,184,255,0.18)':'rgba(143,227,181,0.16)'; ctx.strokeStyle=left?'#7ab8ff':'#8fe3b5'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.arc(p[0],p[1],15,0,Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.fillStyle='#dfeefb'; ctx.font='600 12px sans-serif'; ctx.fillText(k.toUpperCase(),p[0],p[1]+4); });
      // cut line
      ctx.strokeStyle='rgba(255,141,141,0.5)'; ctx.lineWidth=2; ctx.setLineDash([6,6]);
      ctx.beginPath(); ctx.moveTo(W*0.5,H*0.26); ctx.lineTo(W*0.5,H*0.76); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='#ff8d8d'; ctx.font='600 13px sans-serif';
      ctx.fillText('전역 최소 컷 = 2 (간선 B–E 하나만 자르면 두 덩어리)', W/2, H*0.84);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('최대유량은 s,t 쌍마다 최소컷을 줌. 전역은 모든 쌍을 볼 필요 없이, 단계마다 한 정점 합치기로', W/2, H*0.90);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('최대 인접도 순서로 정점을 흡수→마지막 컷(cut-of-the-phase) 후보, n−1단계, 전체 O(V³ or VE+V²logV)', W/2, H*0.90+18); }
  },

  { id:'algo_br_anneal', branchOf:'algo8_04',
    code:[
      'SA(f): T ← T0',
      'cur ← x0;  best ← cur',
      'while T > Tmin:',
      '  next ← perturb(cur)        // 이웃으로 살짝 이동',
      '  Δ ← f(next) − f(cur)',
      '  if Δ < 0 or rand() < exp(−Δ/T):',
      '    cur ← next               // 손해도 확률 수용',
      '  best ← argmin(best, cur)',
      '  T ← T · α                  // 천천히 냉각',
      'return best'
    ],
    build:function(V){
      // 비용 함수 f(x): 여러 골짜기 (전역 최소는 우측 깊은 골)
      function f(x){ return Math.sin(x)*1.1 + Math.sin(2.7*x)*0.6 + 0.12*(x-5)*(x-5)*0.18 - Math.sin(0.6*x)*0.5; }
      var xmin=0, xmax=10;
      // 곡선 샘플
      var curve=[]; for(var i=0;i<=120;i++){ var x=xmin+(xmax-xmin)*i/120; curve.push({x:x,y:f(x)}); }
      // 고정 의사난수 시퀀스 (재현 가능)
      var seed=12345; function rnd(){ seed=(seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff; }
      var T0=2.2, Tmin=0.05, alpha=0.82;
      var st=[];
      function snap(line,cap,o){ var fr={line:line,cap:cap,curve:curve,xmin:xmin,xmax:xmax,T0:T0};
        for(var k in o) fr[k]=o[k]; st.push(fr); }
      var cur=1.2, best=cur, T=T0;
      snap([0,1],'<b>담금질 기법</b>: 울퉁불퉁한 비용함수 f(x)의 최소를 찾습니다. 시작점 x=1.2, 초기 온도 T=2.2(높음).',
        {cur:cur,best:best,next:null,T:T,accepted:null});
      var iter=0, maxIter=7;
      while(T>Tmin && iter<maxIter){
        // 이웃: 현재에서 step 만큼 (고정 시퀀스)
        var step=(rnd()*2-1)*1.6;
        var next=cur+step; if(next<xmin) next=xmin+0.2; if(next>xmax) next=xmax-0.2;
        var dE=f(next)-f(cur);
        snap([3,4],'iter '+(iter+1)+': 이웃 x='+next.toFixed(2)+' 제안. Δ = f(이웃)−f(현재) = <b>'+dE.toFixed(2)+'</b>.',
          {cur:cur,best:best,next:next,T:T,accepted:null});
        var accept, why;
        if(dE<0){ accept=true; why='Δ<0 (더 좋음) → <b>항상 수용</b>'; }
        else {
          var p=Math.exp(-dE/T); var r=rnd();
          accept=(r<p);
          why='Δ>0 (손해). 확률 exp(−Δ/T)='+p.toFixed(2)+', 난수='+r.toFixed(2)+' → '+(accept?'<b>수용</b>(언덕 넘기)':'<b>거절</b>');
        }
        if(accept) cur=next;
        if(f(cur)<f(best)) best=cur;
        snap([5,6,7],'T='+T.toFixed(2)+': '+why+'. 현재 x='+cur.toFixed(2)+', 최선 x='+best.toFixed(2)+'.',
          {cur:cur,best:best,next:next,T:T,accepted:accept});
        T*=alpha;
        snap([8],'냉각: T ← T·α = <b>'+T.toFixed(2)+'</b>. 온도가 낮을수록 손해 이동을 덜 받아 욕심내기로 수렴합니다.',
          {cur:cur,best:best,next:null,T:T,accepted:null});
        iter++;
      }
      snap([9],'<b>완료!</b> 최선해 x='+best.toFixed(2)+' (f='+f(best).toFixed(2)+'). 높은 T로 지역 골짜기를 탈출하고, 냉각으로 전역 최소 부근에 수렴했습니다.',
        {cur:best,best:best,next:null,T:T,accepted:null});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H;
      var px0=W*0.10,px1=W*0.78,py0=H*0.18,py1=H*0.74;
      var cv=f.curve, xmn=f.xmin,xmx=f.xmax;
      var ys=cv.map(function(p){return p.y;}); var ymn=Math.min.apply(null,ys), ymx=Math.max.apply(null,ys);
      function X(x){ return px0+(px1-px0)*(x-xmn)/(xmx-xmn); }
      function Y(y){ return py1-(py1-py0)*(y-ymn)/(ymx-ymn); }
      // 제목
      ctx.textAlign='center'; ctx.textBaseline='alphabetic'; ctx.fillStyle='#cfd8e6'; ctx.font='600 14px sans-serif';
      ctx.fillText('비용함수 f(x) 위에서 현재점이 이웃으로 점프 — 온도가 낮아질수록 욕심내기', W/2, H*0.10);
      // 곡선
      ctx.strokeStyle='#5a6b82'; ctx.lineWidth=2; ctx.beginPath();
      for(var i=0;i<cv.length;i++){ var sx=X(cv[i].x),sy=Y(cv[i].y); if(i===0)ctx.moveTo(sx,sy); else ctx.lineTo(sx,sy); }
      ctx.stroke();
      // 기준 가로축
      ctx.strokeStyle='rgba(255,255,255,0.10)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(px0,py1+2); ctx.lineTo(px1,py1+2); ctx.stroke();
      function fy(x){ // 곡선 보간 y
        var t=(x-xmn)/(xmx-xmn)*(cv.length-1); var i0=Math.max(0,Math.min(cv.length-2,Math.floor(t))); var fr=t-i0;
        return cv[i0].y*(1-fr)+cv[i0+1].y*fr; }
      // next 후보 (점선 화살표)
      if(f.next!=null){
        var nx=X(f.next), ny=Y(fy(f.next));
        ctx.strokeStyle=(f.accepted===false)?'#f4a0c0':'#ffb27a'; ctx.lineWidth=1.6; ctx.setLineDash([5,4]);
        ctx.beginPath(); ctx.moveTo(X(f.cur),Y(fy(f.cur))); ctx.lineTo(nx,ny); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle=(f.accepted===false)?'rgba(244,160,192,0.25)':'rgba(255,178,122,0.25)';
        ctx.strokeStyle=(f.accepted===false)?'#f4a0c0':'#ffb27a'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.arc(nx,ny,7,0,7); ctx.fill(); ctx.stroke();
        ctx.fillStyle=(f.accepted===false)?'#f4a0c0':'#ffb27a'; ctx.font='11px sans-serif'; ctx.textAlign='center';
        ctx.fillText('이웃', nx, ny-12);
      }
      // best (초록)
      var bx=X(f.best), by=Y(fy(f.best));
      ctx.fillStyle='rgba(143,227,181,0.18)'; ctx.strokeStyle='#8fe3b5'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(bx,by,11,0,7); ctx.fill(); ctx.stroke();
      ctx.fillStyle='#8fe3b5'; ctx.font='10px sans-serif'; ctx.textAlign='center'; ctx.fillText('최선', bx, by+22);
      // cur (주황)
      var cx=X(f.cur), cy=Y(fy(f.cur));
      ctx.fillStyle='#ffb27a'; ctx.strokeStyle='#fff'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.arc(cx,cy,8,0,7); ctx.fill(); ctx.stroke();
      ctx.fillStyle='#ffb27a'; ctx.font='600 11px sans-serif'; ctx.textAlign='center'; ctx.fillText('현재', cx, cy-13);
      // 온도 바 (오른쪽)
      var bxx=W*0.86, bytop=py0, byh=(py1-py0);
      ctx.fillStyle='#9b99a3'; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('온도 T', bxx+10, bytop-10);
      ctx.strokeStyle='#3c4a5e'; ctx.lineWidth=1.5; ctx.strokeRect(bxx,bytop,20,byh);
      var frac=Math.max(0,Math.min(1,f.T/f.T0));
      var grad=ctx.createLinearGradient(0,bytop,0,bytop+byh);
      grad.addColorStop(0,'#ff9a5a'); grad.addColorStop(1,'#7ab8ff');
      ctx.fillStyle=grad; ctx.fillRect(bxx,bytop+byh*(1-frac),20,byh*frac);
      ctx.fillStyle='#dfeefb'; ctx.font='600 12px monospace'; ctx.textAlign='center';
      ctx.fillText('T='+f.T.toFixed(2), bxx+10, bytop+byh+18);
      ctx.fillStyle='#9b99a3'; ctx.font='10px sans-serif';
      ctx.fillText('높음=탐험', bxx+10, bytop-26);
    }
  },

  { id:'algo_br_karatsuba', branchOf:'algo8_03',
    code:[
      '// 카라츠바: x·y 를 곱셈 4번 → 3번 (예 1234×5678)',
      'x = a·B + b,   y = c·B + d   (B = 100)',
      '//  a=12  b=34   c=56  d=78',
      'z2 = a·c                 // 1) 상위곱',
      'z0 = b·d                 // 2) 하위곱',
      'z1 = (a+b)(c+d) − z2 − z0 // 3) 교차곱(가운데)',
      '//  (a+b)(c+d)=ac+ad+bc+bd, 빼면 ad+bc',
      'x·y = z2·B² + z1·B + z0',
      '// T(n)=3T(n/2)+O(n) → O(n^1.585)'
    ],
    build:function(V){
      var x=1234, y=5678, B=100;
      var a=Math.floor(x/B), b=x%B;   // 12, 34
      var c=Math.floor(y/B), d=y%B;   // 56, 78
      var z2=a*c;            // 672
      var z0=b*d;            // 2652
      var mid=(a+b)*(c+d);  // 46*134=6164
      var z1=mid-z2-z0;     // 6164-672-2652=2840 = ad+bc = 12*78+34*56=936+1904=2840
      var ad=a*d, bc=b*c;
      var result=z2*B*B + z1*B + z0;   // 6720000+284000+2652 = 7006652
      var check=x*y;                    // 7006652
      var st=[];
      function snap(line,cap,extra){ var f={line:line,cap:cap,x:x,y:y,B:B,a:a,b:b,c:c,d:d,z2:z2,z0:z0,mid:mid,z1:z1,ad:ad,bc:bc,result:result,check:check}; if(extra)for(var k in extra)f[k]=extra[k]; st.push(f); }
      snap(0,'<b>'+x+' × '+y+'</b> 를 분할정복으로. 학교식·순진한 4번 곱(ac,ad,bc,bd)은 O(n²) 그대로입니다.',{stage:'intro',muls:0,lit:null});
      snap([1,2],'각 수를 절반(B=100)으로 쪼갭니다. x: <b>a='+a+', b='+b+'</b>  /  y: <b>c='+c+', d='+d+'</b>. xy = ac·B² + (ad+bc)·B + bd.',{stage:'split',muls:0,lit:null});
      snap(3,'<b>곱셈①</b>  z2 = a·c = '+a+'·'+c+' = <b>'+z2+'</b>  (상위 자리).',{stage:'z2',muls:1,lit:'z2'});
      snap(4,'<b>곱셈②</b>  z0 = b·d = '+b+'·'+d+' = <b>'+z0+'</b>  (하위 자리).',{stage:'z0',muls:2,lit:'z0'});
      snap(5,'<b>곱셈③</b>  (a+b)(c+d) = '+(a+b)+'·'+(c+d)+' = <b>'+mid+'</b>. 가운데 항을 따로 두 번 곱하지 않습니다.',{stage:'mid',muls:3,lit:'mid'});
      snap([5,6],'<b>핵심 트릭</b>: z1 = (a+b)(c+d) − z2 − z0 = '+mid+'−'+z2+'−'+z0+' = <b>'+z1+'</b>.',{stage:'z1',muls:3,lit:'z1'});
      snap(6,'검증: ad+bc = '+a+'·'+d+' + '+b+'·'+c+' = '+ad+'+'+bc+' = <b>'+(ad+bc)+'</b> = z1. 곱 3번만으로 가운데를 얻었습니다!',{stage:'verify',muls:3,lit:'z1'});
      snap(7,'<b>재조립</b>: xy = z2·B² + z1·B + z0 = '+z2+'·10000 + '+z1+'·100 + '+z0+' = <b>'+result+'</b>.',{stage:'combine',muls:3,lit:'all'});
      snap([7,8],'<b>완료!</b> '+result+' = '+x+'×'+y+' ✓. 곱셈 4→3 → <b>T(n)=3T(n/2)+O(n)</b> → <b>O(n^1.585)</b>. (행렬판이 스트라센)',{stage:'done',muls:3,lit:'all'});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H;
      ctx.textAlign='center'; ctx.textBaseline='alphabetic';
      ctx.fillStyle='#cfd8e6'; ctx.font='600 15px sans-serif';
      ctx.fillText('카라츠바: 곱셈 3번으로 큰 수 곱하기 ('+f.x+' × '+f.y+')', W/2, H*0.075);
      // x, y 분할 박스
      function splitBox(label,hi,lo,full,cx,cy,hlH,hlL){
        ctx.fillStyle='#9b99a3'; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText(label+' = '+full, cx, cy-12);
        var bw=46, bh=30;
        // 상위
        ctx.fillStyle=hlH?'rgba(255,178,122,0.25)':'rgba(122,184,255,0.12)'; ctx.strokeStyle=hlH?'#ffb27a':'#7ab8ff'; ctx.lineWidth=hlH?2:1.5;
        ctx.fillRect(cx,cy,bw,bh); ctx.strokeRect(cx,cy,bw,bh);
        ctx.fillStyle=hlH?'#ffb27a':'#dfeefb'; ctx.font='600 16px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(''+hi, cx+bw/2, cy+bh/2); ctx.textBaseline='alphabetic';
        // 하위
        ctx.fillStyle=hlL?'rgba(143,227,181,0.22)':'rgba(122,184,255,0.12)'; ctx.strokeStyle=hlL?'#8fe3b5':'#7ab8ff'; ctx.lineWidth=hlL?2:1.5;
        ctx.fillRect(cx+bw+8,cy,bw,bh); ctx.strokeRect(cx+bw+8,cy,bw,bh);
        ctx.fillStyle=hlL?'#8fe3b5':'#dfeefb'; ctx.font='600 16px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(''+lo, cx+bw+8+bw/2, cy+bh/2); ctx.textBaseline='alphabetic';
      }
      var split=(f.stage!=='intro');
      var litMid=(f.lit==='mid'||f.lit==='z1'||f.lit==='all');
      splitBox('x', split?f.a:f.x, split?f.b:'', f.x, W*0.14, H*0.20, f.lit==='z2'||litMid, f.lit==='z0'||litMid);
      splitBox('y', split?f.c:f.y, split?f.d:'', f.y, W*0.56, H*0.20, f.lit==='z2'||litMid, f.lit==='z0'||litMid);
      if(split){
        ctx.fillStyle='#6f6e7a'; ctx.font='11px sans-serif'; ctx.textAlign='center';
        ctx.fillText('a       b', W*0.14+54, H*0.20+46); ctx.fillText('c       d', W*0.56+54, H*0.20+46);
      }
      // 세 곱셈 카드
      var cards=[
        {k:'z2', t:'① z2 = a·c', sub:f.a+'·'+f.c, val:f.z2, done:f.muls>=1, col:'#ffb27a'},
        {k:'z0', t:'② z0 = b·d', sub:f.b+'·'+f.d, val:f.z0, done:f.muls>=2, col:'#8fe3b5'},
        {k:'mid',t:'③ (a+b)(c+d)', sub:(f.a+f.b)+'·'+(f.c+f.d), val:f.mid, done:f.muls>=3, col:'#f4a0c0'}
      ];
      var cy0=H*0.40, cwid=W*0.27, ch=70, gap=W*0.025, totW=3*cwid+2*gap, sx=W/2-totW/2;
      for(var i=0;i<3;i++){ var cd=cards[i], cxx=sx+i*(cwid+gap);
        var on=cd.done, hot=(f.lit===cd.k);
        ctx.fillStyle=on?'rgba(255,255,255,0.05)':'rgba(255,255,255,0.02)'; ctx.strokeStyle=on?cd.col:'#2c3543'; ctx.lineWidth=hot?2.4:1.4;
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(cxx,cy0,cwid,ch,8);ctx.fill();ctx.stroke();}else{ctx.fillRect(cxx,cy0,cwid,ch);ctx.strokeRect(cxx,cy0,cwid,ch);}
        ctx.fillStyle=on?cd.col:'#56555f'; ctx.font='600 13px monospace'; ctx.textAlign='center';
        ctx.fillText(cd.t, cxx+cwid/2, cy0+22);
        ctx.fillStyle=on?'#9bb6d6':'#56555f'; ctx.font='13px monospace';
        ctx.fillText(cd.sub+' = '+(on?cd.val:'?'), cxx+cwid/2, cy0+46);
      }
      // z1 트릭 패널
      var ty=H*0.62;
      if(f.lit==='z1'||f.lit==='all'){
        ctx.fillStyle='#f4a0c0'; ctx.font='600 14px monospace'; ctx.textAlign='center';
        ctx.fillText('z1 = (a+b)(c+d) − z2 − z0 = '+f.mid+' − '+f.z2+' − '+f.z0+' = '+f.z1+'  ( = ad+bc )', W/2, ty);
        if(f.stage==='verify'){
          ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif';
          ctx.fillText('확인: ad+bc = '+f.ad+' + '+f.bc+' = '+(f.ad+f.bc)+' ✓ 가운데 항을 곱 한 번 없이 얻음', W/2, ty+22);
        }
      }
      // 재조립
      if(f.lit==='all'){
        ctx.fillStyle=(f.stage==='done')?'#8fe3b5':'#ffb27a'; ctx.font='600 15px monospace'; ctx.textAlign='center';
        ctx.fillText('xy = z2·B² + z1·B + z0 = '+f.z2+'·10000 + '+f.z1+'·100 + '+f.z0+' = '+f.result, W/2, H*0.76);
        if(f.stage==='done'){
          ctx.fillStyle='#8fe3b5'; ctx.font='600 13px sans-serif';
          ctx.fillText('검산: '+f.x+' × '+f.y+' = '+f.check+'  ✓', W/2, H*0.82);
        }
      }
      // 진행 배지
      ctx.fillStyle=(f.stage==='done')?'#8fe3b5':'#ffb27a'; ctx.font='600 13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('▶ 곱셈 '+f.muls+' / 3'+(f.stage==='done'?'  → O(n^1.585)':''), W/2, H*0.95); }
  },

  { id:'algo_br_lagrange', branchOf:'algo8_05',
    code:[
      'LAGRANGE(점들 (xᵢ,yᵢ)):',
      '  P(x) ← 0',
      '  for i in 0..n:',
      '    ℓᵢ(x) ← ∏_{j≠i} (x−xⱼ)/(xᵢ−xⱼ)   // 기저',
      '    // ℓᵢ(xᵢ)=1, ℓᵢ(xⱼ)=0 (j≠i)',
      '    P(x) ← P(x) + yᵢ · ℓᵢ(x)          // 가중합',
      '  return P(x)                          // 모든 점 통과'
    ],
    build:function(V){
      // 3 points
      var px=[-2,0,3], py=[3,-1,5];
      var n=px.length;
      function basis(i,x){ var t=1; for(var j=0;j<n;j++){ if(j!==i) t*=(x-px[j])/(px[i]-px[j]); } return t; }
      function partial(upto,x){ var y=0; for(var i=0;i<=upto;i++){ y+=py[i]*basis(i,x); } return y; }
      // sample full curve for final
      function curveUpto(upto){ var pts=[]; for(var k=0;k<=80;k++){ var x=-3.4+(6.8)*k/80; pts.push([x,partial(upto,x)]); } return pts; }
      var st=[];
      function snap(line,cap,extra){ var f={line:line,cap:cap,px:px,py:py}; if(extra)for(var k in extra)f[k]=extra[k]; st.push(f); }
      snap([0,1],'세 점 <b>(−2,3), (0,−1), (3,5)</b>를 모두 지나는 다항식 P(x)를 만듭니다. 기저 ℓᵢ의 <b>가중합</b>으로 구성합니다.',{curve:null,term:-1});
      for(var i=0;i<n;i++){
        // basis curve scaled (show ℓᵢ shape) and check it's 1 at xi, 0 at others
        var bc=[]; for(var k=0;k<=80;k++){ var x=-3.4+6.8*k/80; bc.push([x,basis(i,x)]); }
        snap([3,4],'기저 <b>ℓ'+i+'(x)</b> = ∏(x−xⱼ)/(x'+i+'−xⱼ) 을 만듭니다 (점선). 자기 점에서 1, 나머지에서 0이 되도록 설계됩니다.',{curve:null,basis:bc,bi:i,term:-1});
        var others=[]; for(var jj=0;jj<n;jj++){ if(jj!==i) others.push('ℓ'+i+'('+px[jj]+')='+basis(i,px[jj]).toFixed(0)); }
        snap(4,'검증: <b>ℓ'+i+'('+px[i]+')='+basis(i,px[i]).toFixed(0)+'</b> (자기 점=1), '+others.join(', ')+' (나머지=0). 분자에 (xⱼ−xⱼ)=0 인자가 생기기 때문입니다.',{curve:null,basis:bc,bi:i,term:-1});
        snap(5,'P(x) += y'+i+'·ℓ'+i+'(x) = <b>'+py[i]+'·ℓ'+i+'</b>. 누적 곡선이 점 (x'+i+', y'+i+')에서 정확히 '+py[i]+'를 통과합니다.',{curve:curveUpto(i),term:i});
      }
      snap(6,'<b>완료!</b> P(x) = 3·ℓ₀ + (−1)·ℓ₁ + 5·ℓ₂. 각 xₖ에서 yₖ만 살아남아 <b>세 점을 모두 통과</b>하는 유일한 2차 다항식입니다.',{curve:curveUpto(n-1),term:n-1,done:true});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H,PX=f.px,PY=f.py;
      ctx.textBaseline='alphabetic';
      var x0=W*0.13,x1=W*0.92,y0=H*0.14,y1=H*0.84;
      var xmin=-3.6,xmax=3.6,ymin=-3.5,ymax=6.5;
      function SX(x){ return x0+(x1-x0)*(x-xmin)/(xmax-xmin); }
      function SY(y){ return y1-(y1-y0)*(y-ymin)/(ymax-ymin); }
      // grid + axes
      ctx.strokeStyle='rgba(255,255,255,0.07)'; ctx.lineWidth=1;
      for(var gx=-3;gx<=3;gx++){ ctx.beginPath(); ctx.moveTo(SX(gx),y0); ctx.lineTo(SX(gx),y1); ctx.stroke(); }
      for(var gy=-3;gy<=6;gy++){ ctx.beginPath(); ctx.moveTo(x0,SY(gy)); ctx.lineTo(x1,SY(gy)); ctx.stroke(); }
      ctx.strokeStyle='rgba(255,255,255,0.30)'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(x0,SY(0)); ctx.lineTo(x1,SY(0)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(SX(0),y0); ctx.lineTo(SX(0),y1); ctx.stroke();
      ctx.fillStyle='#6f6e7a'; ctx.font='10px sans-serif'; ctx.textAlign='center';
      for(gx=-3;gx<=3;gx++){ if(gx!==0) ctx.fillText(gx,SX(gx),SY(0)+14); }
      // basis curve (dim orange) if present
      if(f.basis){ ctx.strokeStyle='rgba(244,160,192,0.7)'; ctx.lineWidth=2; ctx.setLineDash([5,4]); ctx.beginPath();
        for(var b=0;b<f.basis.length;b++){ var bx=SX(f.basis[b][0]), by=SY(f.basis[b][1]); if(b===0)ctx.moveTo(bx,by); else ctx.lineTo(bx,by); }
        ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle='#f4a0c0'; ctx.font='600 11px sans-serif'; ctx.textAlign='left'; ctx.fillText('ℓ'+f.bi+'(x) (점선)', x0+8, y0+14);
        // mark ℓ=1 line
        ctx.strokeStyle='rgba(244,160,192,0.25)'; ctx.setLineDash([2,3]); ctx.beginPath(); ctx.moveTo(x0,SY(1)); ctx.lineTo(x1,SY(1)); ctx.stroke(); ctx.setLineDash([]);
      }
      // accumulated polynomial curve
      if(f.curve){ ctx.strokeStyle=f.done?'#8fe3b5':'#ffb27a'; ctx.lineWidth=2.6; ctx.beginPath();
        for(var c=0;c<f.curve.length;c++){ var cx=SX(f.curve[c][0]), cy=SY(f.curve[c][1]); if(c===0)ctx.moveTo(cx,cy); else ctx.lineTo(cx,cy); }
        ctx.stroke();
      }
      // data points
      for(var i=0;i<PX.length;i++){ var dx=SX(PX[i]),dy=SY(PY[i]);
        var active=(f.term>=i)||(f.bi===i);
        ctx.fillStyle=active?'#8fe3b5':'#7ab8ff'; ctx.strokeStyle='#dfeefb'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.arc(dx,dy,6,0,7); ctx.fill(); ctx.stroke();
        ctx.fillStyle='#dfeefb'; ctx.font='11px sans-serif'; ctx.textAlign='left';
        ctx.fillText('('+PX[i]+','+PY[i]+')', dx+9, dy-7);
      }
      // formula status
      ctx.textAlign='left'; ctx.font='600 13px sans-serif';
      ctx.fillStyle=f.done?'#8fe3b5':'#ffb27a';
      var terms=['3·ℓ₀','−1·ℓ₁','5·ℓ₂'];
      var built=[]; for(i=0;i<=f.term;i++) built.push(terms[i]);
      ctx.fillText('P(x) = '+(built.length?built.join(' + '):'0'), x0, y1+24);
    }
  },

  { id:'algo_br_newton', concept:true, branchOf:'algo4_02',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('뉴턴법 — 접선을 타고 뿌리로 미끄러지기', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('f(x)=0 의 해를, 접선이 x축과 만나는 점으로 갱신하며 빠르게(이차 수렴) 찾기', W/2, H*0.10+22);
      // curve f, tangent lines stepping toward root
      var ax=W*0.12, bx2=W*0.88, axisY=H*0.66;
      ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(ax,axisY); ctx.lineTo(bx2,axisY); ctx.stroke();
      function fx(x){ var t=(x-ax)/(bx2-ax); return axisY - (Math.pow((t-0.2)*2.0,2)*1.0 - 0.6)*H*0.22; } // parabola-ish, root near t=0.2+
      ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2.5; ctx.beginPath();
      for(var x=ax;x<=bx2;x+=4){ var y=fx(x); if(x===ax)ctx.moveTo(x,y); else ctx.lineTo(x,y);} ctx.stroke();
      // iteration points x0 -> x1 -> x2
      var xs=[0.80,0.55,0.40].map(function(t){return ax+t*(bx2-ax);});
      ctx.font='12px sans-serif';
      xs.forEach(function(xv,i){ var fy=fx(xv);
        ctx.strokeStyle='rgba(255,178,122,0.6)'; ctx.lineWidth=1.5; ctx.setLineDash([4,3]);
        ctx.beginPath(); ctx.moveTo(xv,fy); ctx.lineTo(xv,axisY); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle='#ffb27a'; ctx.beginPath(); ctx.arc(xv,axisY,4,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#8a8893'; ctx.fillText('x'+i,xv,axisY+18); });
      ctx.fillStyle='#dfeefb'; ctx.font='600 15px sans-serif';
      ctx.fillText('xₙ₊₁ = xₙ − f(xₙ) / f′(xₙ)', W/2, H*0.80);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('현재 점에서 접선을 그어 x축과 만나는 곳이 다음 추정. 좋은 시작점이면 자릿수가 매 반복 두 배(이차 수렴)', W/2, H*0.88);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('√a 는 f(x)=x²−a 에 적용 → xₙ₊₁=(xₙ+a/xₙ)/2. 단, 시작점·다중근에서는 발산 주의(이분탐색은 안전)', W/2, H*0.88+20); }
  },

  { id:'algo_br_tonelli', concept:true, branchOf:'algo2_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('토넬리-샹크스 — 모듈러 제곱근 구하기', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('x² ≡ a (mod p) 를 만족하는 x를 찾기. 소수 p 위에서 "제곱근"을 푸는 법', W/2, H*0.10+22);
      ctx.fillStyle='#dfeefb'; ctx.font='600 15px sans-serif';
      ctx.fillText('예: x² ≡ 2 (mod 7)  →  x = 3  (3² = 9 ≡ 2)', W/2, H*0.30);
      ctx.fillStyle='#cfd8e6'; ctx.font='13px sans-serif'; ctx.textAlign='left';
      var lines=['1) 먼저 a가 제곱수인지: 오일러 판정 a^((p−1)/2) ≡ 1 (mod p) 이어야 해(이차잉여)',
        '2) p ≡ 3 (mod 4) 인 쉬운 경우: x = a^((p+1)/4) mod p 로 끝',
        '3) 일반 p: p−1 = Q·2^S 로 분해하고, 비잉여 z를 하나 골라',
        '4) 보정 인자를 단계마다 제곱해 "2의 거듭제곱 차수"를 0으로 줄여 감'];
      lines.forEach(function(t,i){ ctx.fillText(t, W*0.10, H*0.42+i*26); });
      ctx.textAlign='center';
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('기대 O(log² p). RSA·타원곡선 암호, 이차잉여 기반 알고리즘에서 핵심 부품', W/2, H*0.86);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('정수 제곱근(√ 정수부)과 다름 주의 — 이건 "모듈러 세계의 제곱근". 합성수 모듈러는 인수분해+CRT', W/2, H*0.86+20); }
  },

  { id:'algo_br_segbeats', concept:true, branchOf:'algo5_04',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('세그먼트 트리 빔즈 — 구간에 min을 "찍는" 갱신', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('"구간의 각 원소를 X와의 최솟값으로 바꾸기" 같은 갱신을 분할상환 O(log² n)에', W/2, H*0.10+22);
      // segment tree storing max, 2nd max, count of max
      var nodes=[[0.5,0.30,'최댓값 9','2nd 7 · 개수 1'],[0.28,0.55,'9 / 7','×1'],[0.72,0.55,'5 / 3','×1']];
      function xy(t){ return [W*0.12+t[0]*W*0.76, H*0.24+t[1]*H*0.4]; }
      ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.lineWidth=2;
      [[0,1],[0,2]].forEach(function(e){ var a=xy(nodes[e[0]]),b=xy(nodes[e[1]]); ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke(); });
      nodes.forEach(function(n,i){ var p=xy(n);
        ctx.fillStyle=i===0?'rgba(255,178,122,0.2)':'rgba(122,184,255,0.16)'; ctx.strokeStyle=i===0?'#ffb27a':'#7ab8ff'; ctx.lineWidth=2;
        ctx.fillRect(p[0]-66,p[1]-22,132,44); ctx.strokeRect(p[0]-66,p[1]-22,132,44);
        ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif'; ctx.fillText(n[2],p[0],p[1]-2);
        ctx.fillStyle='#8a8893'; ctx.font='11px sans-serif'; ctx.fillText(n[3],p[0],p[1]+14); });
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('각 노드에 [최댓값, 두 번째 최댓값, 최댓값 개수] 저장이 핵심', W/2, H*0.74);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('chmin(X): X ≥ 최댓값이면 건너뛰고, 2nd < X < 최댓값이면 최댓값만 일괄 감소(빠른 종료), 아니면 재귀', W/2, H*0.84);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('이 "빔(beats)" 가지치기로 구간 chmin/chmax + 합/최댓값 질의가 분할상환 O(log² n). 지전이 분석', W/2, H*0.84+20); }
  },

  { id:'algo_br_lichao', concept:true, branchOf:'algo7_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('리 차오 트리 — 직선들의 하한선을 트리로', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('여러 직선 중 한 점에서 최솟값을 주는 직선 찾기를 O(log n)에 (기울기 순서 무관)', W/2, H*0.10+22);
      // several lines and their lower envelope
      var ax=W*0.14, bx2=W*0.86, ay=H*0.30, by2=H*0.70;
      function clip(x,y){ return [x, Math.max(ay,Math.min(by2,y))]; }
      var lines=[[0.0,by2,1.0,ay+H*0.18],[0.0,ay+H*0.12,1.0,by2-H*0.05],[0.0,ay+H*0.30,1.0,ay+H*0.30]];
      var cols=['#7ab8ff','#8fe3b5','#9a86ff'];
      lines.forEach(function(L,i){ ctx.strokeStyle=cols[i]; ctx.lineWidth=2; ctx.beginPath();
        ctx.moveTo(ax+L[0]*(bx2-ax),L[1]); ctx.lineTo(ax+L[2]*(bx2-ax),L[3]); ctx.stroke(); });
      // lower envelope (min) bold
      ctx.strokeStyle='#ffb27a'; ctx.lineWidth=4; ctx.beginPath();
      for(var t=0;t<=1.001;t+=0.02){ var ys=lines.map(function(L){return L[1]+(L[3]-L[1])*t;}); var ymin=Math.max.apply(null,ys); // max y = lowest on screen since y down
        var x=ax+t*(bx2-ax); if(t===0)ctx.moveTo(x,ymin); else ctx.lineTo(x,ymin);} ctx.stroke();
      ctx.fillStyle='#ffb27a'; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('— 하한 포락선(매 x의 최솟값)', ax, by2+26); ctx.textAlign='center';
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('x좌표 구간을 노드로: 각 노드에 "그 구간 중앙을 지배하는 직선" 하나 보관', W/2, H*0.82);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('새 직선 삽입: 중앙에서 더 낮은 쪽을 노드에 두고, 교차하는 절반으로만 재귀 → 삽입·질의 O(log n)', W/2, H*0.90);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('볼록 껍질 트릭(CHT)과 같은 일을, 기울기 정렬 없이 처리. DP 가속(직선=상태 전이비용)', W/2, H*0.90+18); }
  },

  { id:'algo_br_burnside', branchOf:'algo8_03',
    code:[
      'BURNSIDE(n=4 구슬, k=2 색, 회전군):',
      '  total ← 0',
      '  for d = 0 .. n-1:        // d 칸 회전',
      '    cyc ← gcd(n, d)        // 순환마디 개수',
      '    fix ← k ^ cyc          // g 가 고정하는 색칠 수',
      '    total ← total + fix',
      '  return total / n         // = 궤도(서로 다른) 수'
    ],
    build:function(V){
      var n=4,k=2, st=[];
      function gcd(a,b){ while(b){ var t=a%b; a=b; b=t; } return a; }
      var total=0;
      function snap(line,cap,o){ o=o||{}; st.push({line:line,cap:cap,n:n,k:k,
        d:(o.d==null?-1:o.d),cyc:(o.cyc==null?-1:o.cyc),fix:(o.fix==null?-1:o.fix),
        total:total,done:o.done||false,ans:(o.ans==null?-1:o.ans)}); }
      snap([0,1],'구슬 <b>n=4</b>개 목걸이를 <b>k=2</b>색으로 칠합니다. 회전하면 같은 것을 하나로 셉니다. 회전군 |G|=4.',{});
      for(var d=0; d<n; d++){
        var cyc=gcd(n,d);
        snap([2,3],'<b>'+d+'칸 회전</b>: 정점을 따라가면 길이 합 4가 '+cyc+'개의 <b>순환마디</b>로 갈라집니다(gcd(4,'+d+')='+cyc+').',{d:d,cyc:cyc});
        var fix=Math.pow(k,cyc);
        total+=fix;
        snap([4,5],'한 마디는 같은 색이어야 고정됨 → Fix = 2^'+cyc+' = <b>'+fix+'</b>. 누적 합 = '+total+'.',{d:d,cyc:cyc,fix:fix});
      }
      var ans=total/n;
      snap([6],'<b>평균</b> = (Σ Fix)/|G| = '+total+'/4 = <b>'+ans+'</b>. 서로 다른 목걸이는 <b>'+ans+'</b>종류입니다.',{done:true,ans:ans});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H,n=f.n;
      var cx=W*0.5, cy=H*0.36, R=Math.min(W,H)*0.20;
      ctx.textAlign='center'; ctx.fillStyle='#cfd8e6'; ctx.font='600 15px sans-serif';
      ctx.fillText('번사이드: 각 회전이 고정하는 색칠을 세어 평균', W/2, H*0.10);
      // 마디 색 (순환마디별로 다른 색으로 구슬을 묶어 표시)
      function gcd(a,b){ while(b){ var t=a%b; a=b; b=t; } return a; }
      var cyc=f.cyc>=0?f.cyc:1;
      // 마디 그룹: 정점 i 는 회전 d 에 의해 (i+d)%n 으로 감 → 사이클 그룹
      var grp=[], seen=[]; for(var i=0;i<n;i++){ grp[i]=-1; seen[i]=false; }
      var g=0; var d=f.d>=0?f.d:0;
      for(i=0;i<n;i++){ if(seen[i])continue; var j=i; while(!seen[j]){ seen[j]=true; grp[j]=g; j=(j+d)%n; } g++; }
      var pal=['#ffb27a','#7ab8ff','#8fe3b5','#f4a0c0'];
      // 회전 화살표
      if(f.d>0){ ctx.strokeStyle='rgba(255,178,122,0.5)'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.arc(cx,cy,R+24,-Math.PI*0.55,Math.PI*0.15); ctx.stroke();
        ctx.fillStyle='#ffb27a'; ctx.font='12px sans-serif'; ctx.fillText('↻ '+f.d+'칸', cx+R+34, cy-R*0.5); }
      for(i=0;i<n;i++){ var ang=-Math.PI/2 + i*2*Math.PI/n;
        var px=cx+R*Math.cos(ang), py=cy+R*Math.sin(ang);
        var col=(f.d>=0)?pal[grp[i]%pal.length]:'#9b99a3';
        ctx.fillStyle='rgba(122,184,255,0.10)'; ctx.strokeStyle=col; ctx.lineWidth=3;
        ctx.beginPath(); ctx.arc(px,py,16,0,7); ctx.fill(); ctx.stroke();
        ctx.fillStyle=col; ctx.font='600 12px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(''+i,px,py); ctx.textBaseline='alphabetic'; }
      ctx.fillStyle='#7f8a9b'; ctx.font='11px sans-serif'; ctx.textAlign='center';
      ctx.fillText('같은 색 = 한 순환마디(같은 색이어야 회전에 고정)', cx, cy+R+34);
      // 표: d / cyc / fix
      var tx=W*0.12, ty=H*0.66, rh=24, cw=[70,120,130];
      ctx.textAlign='left'; ctx.textBaseline='middle';
      var heads=['회전 d','마디 gcd(4,d)','Fix = 2^마디'];
      ctx.fillStyle='#9b99a3'; ctx.font='600 12px sans-serif';
      var hx=tx; for(var c=0;c<3;c++){ ctx.fillText(heads[c],hx,ty); hx+=cw[c]; }
      for(d=0; d<n; d++){
        var ry=ty+rh*(d+1); var cc=gcd(n,d), fx=Math.pow(f.k,cc);
        var hot=(d===f.d);
        ctx.fillStyle=hot?'#ffb27a':(f.d>d||f.done?'#8fe3b5':'#5a5a64');
        ctx.font=(hot?'600 ':'')+'13px monospace';
        hx=tx;
        var vals=[''+d, ''+cc, '2^'+cc+' = '+fx];
        var shown=(d<=f.d)||f.done;
        for(c=0;c<3;c++){ ctx.fillText(shown?vals[c]:'·',hx,ry); hx+=cw[c]; }
      }
      // running total / answer
      ctx.textBaseline='alphabetic'; ctx.textAlign='left';
      ctx.fillStyle='#dfeefb'; ctx.font='600 14px sans-serif';
      ctx.fillText('Σ Fix = '+f.total, W*0.55, H*0.70);
      if(f.done){ ctx.fillStyle='#8fe3b5'; ctx.font='600 16px sans-serif';
        ctx.fillText('답 = '+f.total+' / 4 = '+f.ans+' 종류', W*0.55, H*0.78); }
      else { ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif';
        ctx.fillText('답 = (Σ Fix) / 4', W*0.55, H*0.78); }
    }
  },

  { id:'algo_br_dlx', branchOf:'algo8_03',
    code:[
      'search():                          // Algorithm X (정확 덮개)',
      '  if 남은 열 없음: 해 출력; return',
      '  c = 1이 가장 적은 열 고르기      // 분기 최소화',
      '  for 행 r in c:                     // c를 덮는 각 행 시도',
      '    해에 r 추가',
      '    r이 덮는 열들 cover → 그 열의 다른 행도 제거',
      '    search()                        // 재귀',
      '    uncover(되돌리기) — 춤추는 링크'
    ],
    build:function(V){ var st=[];
      // Knuth 예제: 7열 A..G, 6행. 정답 = 행1,행4,행5 (B,G / A,D / C,E,F)
      var cols=['A','B','C','D','E','F','G'];
      var rows=[
        {name:'R1',set:[2,4,5]},   // C E F
        {name:'R2',set:[0,3,6]},   // A D G
        {name:'R3',set:[1,2,5]},   // B C F
        {name:'R4',set:[0,3]},     // A D
        {name:'R5',set:[1,6]},     // B G
        {name:'R6',set:[3,4,6]}    // D E G
      ];
      function snap(line,cap,o){ o=o||{};
        st.push({line:line,cap:cap,cols:cols,rows:rows,
          activeCols:(o.activeCols||cols.map(function(_,i){return i;})).slice(),
          activeRows:(o.activeRows||rows.map(function(_,i){return i;})).slice(),
          chosenCol:o.chosenCol==null?-1:o.chosenCol,
          tryRow:o.tryRow==null?-1:o.tryRow,
          solution:(o.solution||[]).slice(),
          mode:o.mode||'pick', done:o.done||false}); }
      // 우리는 정답 경로를 직접 연출(교육용): R5(BG) → R4(AD) → R1(CEF)
      var allC=[0,1,2,3,4,5,6], allR=[0,1,2,3,4,5];
      snap(0,'<b>정확 덮개</b>: 모든 열(A~G)을 <b>정확히 한 번씩</b> 덮는 행 부분집합을 찾습니다. 1이 든 칸이 그 행이 덮는 열입니다.',{activeCols:allC,activeRows:allR,mode:'start'});
      // Step1: choose column B (열 1) — among fewest. B appears in R3,R5 (2). pick B
      snap(2,'남은 열 중 <b>1이 가장 적은 열</b>을 고릅니다 → 열 <b>B</b> (행 R3·R5 두 곳뿐). 분기 수를 줄입니다.',{activeCols:allC,activeRows:allR,chosenCol:1,mode:'pickcol'});
      // try R5 = {B,G}
      snap(3,'B를 덮는 행 중 <b>R5 = {B,G}</b> 를 해에 넣어 시도합니다.',{activeCols:allC,activeRows:allR,chosenCol:1,tryRow:4,mode:'tryrow'});
      // cover B,G and remove rows hitting them: R2(G),R3(B),R6(G)
      var c1=[0,2,3,4,5], r1=[0,3]; // 남은 열 A C D E F ; 남은 행 R1 R4 (R5 chosen, R2 R3 R6 제거)
      snap(5,'R5 채택 → 덮은 열 <b>B·G 제거</b>, 그 열을 덮던 다른 행(R2·R3·R6)도 함께 제거합니다. 행렬이 <b>줄어듭니다</b>.',{activeCols:c1,activeRows:r1,chosenCol:-1,solution:[4],mode:'covered'});
      // Step2: among A C D E F, choose A (in R4 only now)
      snap(2,'줄어든 행렬에서 다시 <b>가장 제약 많은 열</b> → 열 <b>A</b> (남은 행 중 R4뿐).',{activeCols:c1,activeRows:r1,chosenCol:0,solution:[4],mode:'pickcol'});
      snap(3,'A를 덮는 <b>R4 = {A,D}</b> 를 해에 추가해 시도합니다.',{activeCols:c1,activeRows:r1,chosenCol:0,tryRow:3,solution:[4],mode:'tryrow'});
      var c2=[2,4,5], r2=[0]; // 남은 열 C E F ; 남은 행 R1
      snap(5,'R4 채택 → 열 <b>A·D 제거</b>. 남은 열은 <b>C·E·F</b>, 남은 행은 <b>R1</b>뿐.',{activeCols:c2,activeRows:r2,chosenCol:-1,solution:[4,3],mode:'covered'});
      // Step3: choose C, row R1 = {C,E,F}
      snap(2,'남은 열 C 선택 → 덮는 행 <b>R1 = {C,E,F}</b>.',{activeCols:c2,activeRows:r2,chosenCol:2,solution:[4,3],mode:'pickcol'});
      snap(3,'R1을 해에 추가 → 마지막 열 C·E·F를 모두 덮습니다.',{activeCols:c2,activeRows:r2,chosenCol:2,tryRow:0,solution:[4,3],mode:'tryrow'});
      snap(1,'<b>남은 열 없음 — 정확 덮개 완성!</b> 해 = {R5, R4, R1} 이 A~G를 빠짐없이 한 번씩 덮습니다.',{activeCols:[],activeRows:[],solution:[4,3,0],mode:'solved',done:true});
      snap(7,'핵심은 cover/<b>uncover</b>가 이중 연결 리스트 포인터 잇기로 <b>O(1)</b>이라는 점 — 실패 시 즉시 복원해 백트래킹이 초고속이 됩니다.',{activeCols:[],activeRows:[],solution:[4,3,0],mode:'solved',done:true});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H;
      var cols=f.cols, rows=f.rows, nc=cols.length, nr=rows.length;
      var gw=Math.min(W*0.78,520), cw=gw/nc, gx=W/2-gw/2;
      var gy=H*0.20, ch=Math.min(34,H*0.07);
      ctx.textAlign='center'; ctx.textBaseline='middle';
      // 열 헤더
      for(var c=0;c<nc;c++){
        var active=f.activeCols.indexOf(c)>=0;
        var chosen=(c===f.chosenCol);
        var hx=gx+c*cw;
        var col=chosen?'#ffb27a':active?'#7ab8ff':'#56555f';
        ctx.fillStyle=chosen?'rgba(255,178,122,0.25)':active?'rgba(122,184,255,0.14)':'rgba(120,120,130,0.05)';
        ctx.fillRect(hx,gy,cw-2,ch-2);
        ctx.strokeStyle=col; ctx.lineWidth=chosen?2.4:1.4; ctx.strokeRect(hx,gy,cw-2,ch-2);
        ctx.fillStyle=active?'#dfeefb':'#6f6e7a'; ctx.font='600 14px sans-serif';
        ctx.fillText(cols[c],hx+cw/2,gy+ch/2);
      }
      // 행렬
      for(var r=0;r<nr;r++){
        var ry=gy+ch+ r*ch;
        var rActive=f.activeRows.indexOf(r)>=0;
        var inSol=f.solution.indexOf(r)>=0;
        var isTry=(r===f.tryRow);
        // 행 라벨
        ctx.textAlign='right'; ctx.font='600 12px sans-serif';
        ctx.fillStyle=inSol?'#8fe3b5':isTry?'#ffb27a':rActive?'#9bbff0':'#56555f';
        ctx.fillText(rows[r].name, gx-8, ry+ch/2);
        ctx.textAlign='center';
        for(c=0;c<nc;c++){
          var has=rows[r].set.indexOf(c)>=0;
          var cActive=f.activeCols.indexOf(c)>=0;
          var cellx=gx+c*cw, cellW=cw-2, cellH=ch-2;
          // 셀 배경
          var bg='rgba(255,255,255,0.02)';
          if(!rActive) bg='rgba(120,120,130,0.04)';
          ctx.fillStyle=bg; ctx.fillRect(cellx,ry,cellW,cellH);
          ctx.strokeStyle='rgba(255,255,255,0.07)'; ctx.lineWidth=1; ctx.strokeRect(cellx,ry,cellW,cellH);
          if(has){
            var dotCol, dotFill;
            if(inSol){ dotCol='#8fe3b5'; dotFill='rgba(143,227,181,0.30)'; }
            else if(isTry){ dotCol='#ffb27a'; dotFill='rgba(255,178,122,0.30)'; }
            else if(rActive && cActive){ dotCol='#7ab8ff'; dotFill='rgba(122,184,255,0.20)'; }
            else { dotCol='#56555f'; dotFill='rgba(120,120,130,0.08)'; }
            ctx.fillStyle=dotFill; ctx.strokeStyle=dotCol; ctx.lineWidth=1.6;
            ctx.beginPath(); ctx.arc(cellx+cellW/2, ry+cellH/2, Math.min(cellW,cellH)*0.32, 0,7);
            ctx.fill(); ctx.stroke();
            ctx.fillStyle=dotCol==='#56555f'?'#7f7e8a':'#eaf3ff'; ctx.font='600 11px monospace';
            ctx.fillText('1', cellx+cellW/2, ry+cellH/2+1);
          }
        }
      }
      // 해 표시
      ctx.textAlign='center'; ctx.textBaseline='alphabetic';
      var sy=gy+ch+nr*ch+34;
      ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif';
      var solStr=f.solution.length? f.solution.map(function(i){return rows[i].name;}).join(' + ') : '(아직 없음)';
      ctx.fillStyle=f.done?'#8fe3b5':'#cfd8e6'; ctx.font='600 14px sans-serif';
      ctx.fillText('현재 해: '+solStr, W/2, sy);
      // 배지
      var badge=f.mode==='solved'?'정확 덮개 완성':f.mode==='covered'?'cover — 행렬 축소':f.mode==='pickcol'?'최소 1 열 선택':f.mode==='tryrow'?'행 시도':'시작';
      var bcol=f.mode==='solved'?'#8fe3b5':f.mode==='covered'?'#8fe3b5':'#ffb27a';
      ctx.fillStyle=bcol; ctx.font='600 13px sans-serif';
      ctx.fillText('▶ '+badge, W/2, sy+24);
      ctx.fillStyle='#9b99a3'; ctx.font='11px sans-serif';
      ctx.fillText('회색=cover로 제거된 행/열 (uncover로 O(1) 복원)', W/2, sy+44); }
  },

  { id:'algo_br_berlekamp', concept:true, branchOf:'algo7_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('벨캄프-매시 — 수열에서 점화식을 역으로 찾기', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('처음 몇 항만 보고 "이 수열을 만드는 최단 선형 점화식"을 자동으로 복원', W/2, H*0.10+22);
      // sequence
      var seq=[1,1,2,3,5,8,13,21]; var bw=72, bx=W*0.5-(seq.length*bw)/2, by=H*0.30;
      ctx.font='600 14px sans-serif';
      for(var i=0;i<seq.length;i++){ var x=bx+i*bw;
        ctx.fillStyle='rgba(122,184,255,0.14)'; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=1.5;
        ctx.fillRect(x,by,bw-10,36); ctx.strokeRect(x,by,bw-10,36);
        ctx.fillStyle='#dfeefb'; ctx.fillText(seq[i],x+(bw-10)/2,by+24);
        ctx.fillStyle='#6a6873'; ctx.font='11px sans-serif'; ctx.fillText('a'+i,x+(bw-10)/2,by-6); ctx.font='600 14px sans-serif'; }
      ctx.fillStyle='#ffb27a'; ctx.font='600 17px sans-serif';
      ctx.fillText('찾은 점화식:  aₙ = 1·aₙ₋₁ + 1·aₙ₋₂  (피보나치!)', W/2, H*0.56);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('항을 하나씩 보며 현재 점화식의 예측 오차(불일치)가 나면, 이전 실패 정보로 최소 길이로 보정', W/2, H*0.72);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('길이 L짜리 선형 점화식이면 2L개 항만 있으면 복원, O(L²). 찾은 뒤 키타마사/행렬거듭제곱으로 N번째 항을', W/2, H*0.82);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('쓰임: DP 수열의 닫힌 점화식 추측, 모듈러 선형회귀, 오류정정부호(BCH/리드-솔로몬)', W/2, H*0.82+20); }
  },

  { id:'algo_br_virtualtree', concept:true, branchOf:'algo5_03',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('가상 트리 — 관심 정점만 추린 작은 트리', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('큰 트리에서 질의마다 일부 정점 k개만 관심일 때, 그들과 LCA만 모아 O(k log k) 트리로', W/2, H*0.10+22);
      // big faint tree + highlighted virtual tree nodes
      var big={r:[0.5,0.18],a:[0.3,0.40],b:[0.7,0.40],c:[0.18,0.64],d:[0.40,0.64],e:[0.62,0.64],f:[0.82,0.64],g:[0.30,0.86],h:[0.52,0.86]};
      var be=[['r','a'],['r','b'],['a','c'],['a','d'],['b','e'],['b','f'],['d','g'],['d','h']];
      function xy(t){ return [W*0.12+t[0]*W*0.76, H*0.22+t[1]*H*0.62]; }
      be.forEach(function(e){ var p=xy(big[e[0]]),q=xy(big[e[1]]); ctx.strokeStyle='rgba(255,255,255,0.12)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(p[0],p[1]); ctx.lineTo(q[0],q[1]); ctx.stroke(); });
      // virtual tree: keys = c, g, h ; needed LCAs = a, d ; root r
      var virt={r:1,a:1,d:1,c:2,g:2,h:2}; // 1=LCA node, 2=key node
      var ve=[['r','a'],['a','c'],['a','d'],['d','g'],['d','h']];
      ve.forEach(function(e){ var p=xy(big[e[0]]),q=xy(big[e[1]]); ctx.strokeStyle='#ffb27a'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(p[0],p[1]); ctx.lineTo(q[0],q[1]); ctx.stroke(); });
      Object.keys(big).forEach(function(k){ var p=xy(big[k]); var v=virt[k];
        ctx.fillStyle=v===2?'rgba(143,227,181,0.3)':v===1?'rgba(255,178,122,0.22)':'rgba(122,184,255,0.06)';
        ctx.strokeStyle=v===2?'#8fe3b5':v===1?'#ffb27a':'#3a4358'; ctx.lineWidth=v?2.5:1;
        ctx.beginPath(); ctx.arc(p[0],p[1],v?13:9,0,Math.PI*2); ctx.fill(); ctx.stroke(); });
      ctx.fillStyle='#8fe3b5'; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('● 관심(키) 정점', W*0.14, H*0.92); ctx.fillStyle='#ffb27a'; ctx.fillText('● 필요한 LCA', W*0.44, H*0.92); ctx.textAlign='center';
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('키 정점들을 DFS 순서로 정렬 → 인접 쌍의 LCA를 추가 → 그 정점들만으로 압축 트리 구성', W/2, H*0.84);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('질의마다 트리 크기가 O(k)라, 전체 키 수의 합에 비례. 여러 트리 DP 질의를 큰 트리 대신 가상 트리에서', W/2, H*0.84+18); }
  },

  { id:'algo_br_karger', concept:true, branchOf:'algo6_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('카거 알고리즘 — 무작위 간선 수축으로 최소 컷', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('간선을 무작위로 골라 양 끝 정점을 합치기를 반복 → 마지막 둘로 남은 분할이 컷', W/2, H*0.10+22);
      // graph contracting: show before -> after
      ctx.fillStyle='#cfd8e6'; ctx.font='600 13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('① 간선 하나 무작위 선택', W*0.27, H*0.30); ctx.fillText('② 양 끝을 한 정점으로 수축', W*0.73, H*0.30);
      // left graph
      var Lg={a:[0.18,0.5],b:[0.30,0.42],c:[0.30,0.62],d:[0.42,0.5]};
      var Le=[['a','b'],['a','c'],['b','c'],['b','d'],['c','d']];
      function xy(o,t){ return [t[0]*W, H*0.30+t[1]*H*0.4]; }
      Le.forEach(function(e){ var p=xy(0,Lg[e[0]]),q=xy(0,Lg[e[1]]); var sel=(e[0]==='b'&&e[1]==='c'); ctx.strokeStyle=sel?'#ffb27a':'rgba(255,255,255,0.25)'; ctx.lineWidth=sel?3:1.8; ctx.beginPath(); ctx.moveTo(p[0],p[1]); ctx.lineTo(q[0],q[1]); ctx.stroke(); });
      Object.keys(Lg).forEach(function(k){ var p=xy(0,Lg[k]); ctx.fillStyle='rgba(122,184,255,0.18)'; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(p[0],p[1],12,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.fillStyle='#dfeefb'; ctx.font='600 11px sans-serif'; ctx.fillText(k.toUpperCase(),p[0],p[1]+4); });
      // right graph (b,c merged into BC)
      var Rg={a:[0.62,0.5],bc:[0.74,0.5],d:[0.86,0.5]};
      var Re=[['a','bc'],['a','bc'],['bc','d'],['bc','d']];
      Re.forEach(function(e,i){ var p=xy(0,Rg[e[0]]),q=xy(0,Rg[e[1]]); var off=(i%2?8:-8); ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1.8; ctx.beginPath(); ctx.moveTo(p[0],p[1]+off); ctx.quadraticCurveTo((p[0]+q[0])/2,p[1]+off*2,q[0],q[1]+off); ctx.stroke(); });
      Object.keys(Rg).forEach(function(k){ var p=xy(0,Rg[k]); var m=(k==='bc'); ctx.fillStyle=m?'rgba(143,227,181,0.25)':'rgba(122,184,255,0.18)'; ctx.strokeStyle=m?'#8fe3b5':'#7ab8ff'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(p[0],p[1],m?15:12,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.fillStyle='#dfeefb'; ctx.font='600 11px sans-serif'; ctx.fillText(k.toUpperCase(),p[0],p[1]+4); });
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('정점이 둘 남을 때까지 수축 → 그 둘 사이 남은 간선 수 = 하나의 컷 후보', W/2, H*0.74);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('한 번은 최소 컷일 확률 ≥ 2/n(n−1). O(n²)번 반복하면 높은 확률로 진짜 최소 컷 발견', W/2, H*0.84);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('카거-스타인 개선: 작아질 때만 더 자주 반복 → O(n² log n)에 높은 성공확률. 랜덤 알고리즘의 명작', W/2, H*0.84+20); }
  },

  { id:'algo_br_fenwick2d', concept:true, branchOf:'algo5_04',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('2D 펜윅 트리 — 평면 위 직사각형 합', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('격자에서 점 갱신과 "직사각형 구간 합"을 각각 O(log n · log m)에', W/2, H*0.10+22);
      // grid
      var gx=W*0.30, gy=H*0.28, cell=34, n=6;
      for(var r=0;r<n;r++)for(var c=0;c<n;c++){ var x=gx+c*cell,y=gy+r*cell;
        var inRect=(r>=1&&r<=3&&c>=2&&c<=4);
        ctx.fillStyle=inRect?'rgba(255,178,122,0.22)':'rgba(122,184,255,0.06)'; ctx.strokeStyle='#3a4358'; ctx.lineWidth=1;
        ctx.fillRect(x,y,cell-2,cell-2); ctx.strokeRect(x,y,cell-2,cell-2); }
      // rectangle outline
      ctx.strokeStyle='#ffb27a'; ctx.lineWidth=2.5; ctx.strokeRect(gx+2*cell-1,gy+1*cell-1,3*cell,3*cell);
      ctx.fillStyle='#ffb27a'; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
      ctx.fillText('직사각형 [r1..r2]×[c1..c2] 합', gx+n*cell+14, gy+1.5*cell); ctx.textAlign='center';
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('합 = S(r2,c2) − S(r1−1,c2) − S(r2,c1−1) + S(r1−1,c1−1)', W/2, H*0.80);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('S(r,c)=원점부터의 누적합. 펜윅을 두 축에 중첩(인덱스 lowbit를 두 번) → 갱신·질의 O(log n·log m)', W/2, H*0.88);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('포함배제 네 모서리로 직사각형 합. 평면 점 개수 세기, 2D 누적, 오프라인이면 좌표압축+1D로도', W/2, H*0.88+20); }
  },

  { id:'algo_br_knuthopt', concept:true, branchOf:'algo7_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('크누스 최적화 — 최적 분기점의 단조성', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('구간 DP의 O(n³)을, "최적 분기점이 단조로 움직인다"는 성질로 O(n²)로', W/2, H*0.10+22);
      // dp table with opt[i][j] monotone band
      var T=W*0.30, by=H*0.30, cell=40, n=6;
      for(var i=0;i<n;i++)for(var j=0;j<n;j++){ if(j<i)continue; var x=T+j*cell,y=by+i*cell;
        var band=(j>=i && Math.abs((j-i)-1)<=1 && j>i); // illustrative opt band near diagonal+1
        ctx.fillStyle=band?'rgba(255,178,122,0.25)':'rgba(122,184,255,0.08)'; ctx.strokeStyle='#3a4358'; ctx.lineWidth=1;
        ctx.fillRect(x,y,cell-3,cell-3); ctx.strokeRect(x,y,cell-3,cell-3); }
      ctx.fillStyle='#ffb27a'; ctx.font='600 12px sans-serif'; ctx.textAlign='left';
      ctx.fillText('opt[i][j] = 최적 분기점', T+n*cell+12, by+1.5*cell); ctx.textAlign='center';
      ctx.fillStyle='#dfeefb'; ctx.font='600 14px sans-serif';
      ctx.fillText('opt[i][j−1] ≤ opt[i][j] ≤ opt[i+1][j]', W/2, H*0.80);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('분기점 후보를 0..n−1 전부가 아니라 위·왼쪽 답 사이로만 좁힘 → 총 후보 합이 O(n²)', W/2, H*0.88);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('조건: 사각부등식(quadrangle inequality) 성립 시. 최적 BST·파일 합치기·구간 분할 DP 가속', W/2, H*0.88+20); }
  },

  { id:'algo_br_aliens', concept:true, branchOf:'algo7_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('Aliens 트릭(WQS 이분) — "정확히 k개" 제약 풀기', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('"정확히 k번 사용" 제약을, 사용마다 벌점 λ를 매겨 자유 DP로 바꾸고 λ를 이분 탐색', W/2, H*0.10+22);
      // convex curve f(k) and a tangent line of slope -λ
      var ax=W*0.16, bx2=W*0.84, ay=H*0.28, by2=H*0.66;
      ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(ax,by2); ctx.lineTo(ax,ay); ctx.moveTo(ax,by2); ctx.lineTo(bx2,by2); ctx.stroke();
      ctx.fillStyle='#6a6873'; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('비용', ax-6, ay-8); ctx.fillText('사용 개수 k', bx2-60, by2+18); ctx.textAlign='center';
      ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2.5; ctx.beginPath();
      function fk(t){ return by2 - (0.9 - (t-0.55)*(t-0.55)*2.2)*(by2-ay)*0.7; }
      for(var t=0;t<=1.001;t+=0.02){ var x=ax+t*(bx2-ax),y=fk(t); if(t===0)ctx.moveTo(x,y); else ctx.lineTo(x,y);} ctx.stroke();
      // tangent at k*
      var ts=0.55, xs=ax+ts*(bx2-ax), ys=fk(ts);
      ctx.strokeStyle='#ffb27a'; ctx.lineWidth=2; ctx.setLineDash([6,4]);
      ctx.beginPath(); ctx.moveTo(xs-W*0.18,ys-(by2-ay)*0.10); ctx.lineTo(xs+W*0.18,ys+(by2-ay)*0.10); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='#ffb27a'; ctx.beginPath(); ctx.arc(xs,ys,5,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#ffb27a'; ctx.font='12px sans-serif'; ctx.fillText('기울기 −λ 접선이 k에 닿음', xs, ys-14);
      ctx.fillStyle='#8fe3b5'; ctx.font='11px sans-serif'; ctx.fillText('k=목표', xs, by2+14);
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('벌점 λ를 키우면 최적 사용 개수가 줄어듦(단조) → λ를 이분 탐색해 개수=k 맞추기', W/2, H*0.80);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('전제: 답 f(k)가 k에 대해 볼록(또는 오목). 제약 없는 DP를 O(log) 번 풀어 제약 DP 해결', W/2, H*0.88);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('이름은 IOI 2016 Aliens 문제. 라그랑주 완화의 이산 버전. "정확히 k" 분할/매칭 DP에 활용', W/2, H*0.88+20); }
  },

  { id:'algo_br_bitset', concept:true, branchOf:'algo2_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('비트셋 가속 — 한 워드에 64칸을 한 번에', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('불리언 배열을 비트로 묶어, 64개(워드 크기) 연산을 명령 한 번에 → 상수 1/64', W/2, H*0.10+22);
      // bit rows
      function bits(y,arr,col){ var bx=W*0.22, bw=24;
        for(var i=0;i<arr.length;i++){ var x=bx+i*bw;
          ctx.fillStyle=arr[i]?col:'rgba(122,184,255,0.06)'; ctx.strokeStyle='#36405a'; ctx.lineWidth=1;
          ctx.fillRect(x,y,bw-3,24); ctx.strokeRect(x,y,bw-3,24);
          ctx.fillStyle=arr[i]?'#0d1117':'#4a5568'; ctx.font='600 12px sans-serif'; ctx.fillText(arr[i],x+(bw-3)/2,y+17); } }
      var a=[1,0,1,1,0,0,1,0,1,1,0,1], b=[1,1,0,1,0,1,1,0,0,1,1,1];
      var r=a.map(function(v,i){return v&b[i];});
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif'; ctx.textAlign='right';
      ctx.fillText('A', W*0.20, H*0.34+17); ctx.fillText('B', W*0.20, H*0.46+17); ctx.fillText('A & B', W*0.20, H*0.60+17); ctx.textAlign='center';
      bits(H*0.34,a,'#7ab8ff'); bits(H*0.46,b,'#8fe3b5'); bits(H*0.60,r,'#ffb27a');
      ctx.fillStyle='#ffb27a'; ctx.font='600 14px sans-serif';
      ctx.fillText('AND/OR/XOR/shift 한 번이 64비트를 동시 처리', W/2, H*0.74);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('O(n²) DP·도달성·부분집합합을 비트 연산으로 묶으면 실측 64배 빠름(점근은 O(n²/64))', W/2, H*0.84);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('쓰임: 이분 매칭(인접 비트셋), 부분집합합/배낭, 추이폐쇄, 문자열 비트병렬(Shift-And). C++ std::bitset', W/2, H*0.84+20); }
  },

  { id:'algo_br_fibheap', concept:true, branchOf:'algo6_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('피보나치 힙 — decrease-key를 O(1)에', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('게으른 합치기로 삽입·키감소를 분할상환 O(1), 최소 추출만 O(log n)', W/2, H*0.10+22);
      // forest of heap-ordered trees (roots in a circular list)
      var roots=[[0.22,0.42,'3'],[0.42,0.42,'7'],[0.64,0.42,'5'],[0.82,0.42,'9']];
      // root list line
      ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(W*0.2,H*0.42); ctx.lineTo(W*0.84,H*0.42); ctx.stroke();
      function node(x,y,t,col,r){ ctx.fillStyle=col==='min'?'rgba(255,178,122,0.22)':'rgba(122,184,255,0.16)'; ctx.strokeStyle=col==='min'?'#ffb27a':'#7ab8ff'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.arc(x,y,r||14,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.fillStyle='#dfeefb'; ctx.font='600 12px sans-serif'; ctx.fillText(t,x,y+4); }
      roots.forEach(function(rt,i){ var x=W*rt[0],y=H*rt[1]; node(x,y,rt[2], i===0?'min':'',15);
        // children for some
        if(i===2){ ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x-W*0.05,y+H*0.16); ctx.moveTo(x,y); ctx.lineTo(x+W*0.05,y+H*0.16); ctx.stroke(); node(x-W*0.05,y+H*0.16,'8','',12); node(x+W*0.05,y+H*0.16,'6','',12); } });
      ctx.fillStyle='#ffb27a'; ctx.font='12px sans-serif'; ctx.fillText('min 포인터', W*0.22, H*0.30);
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('뿌리 목록에 그냥 던져 두고, extract-min 때만 차수별로 모아 정리(consolidate)', W/2, H*0.74);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('decrease-key는 노드를 잘라 뿌리로(O(1)). 다익스트라/프림이 이론상 O(E + V log V)로', W/2, H*0.84);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('상수가 커 실무는 이진/쌍 힙이 보통 더 빠름. 이론적 하한을 보여 주는 명품 자료구조', W/2, H*0.84+20); }
  },

  { id:'algo_br_veb', concept:true, branchOf:'algo2_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('van Emde Boas 트리 — 정수 키를 O(log log U)에', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('0..U−1 정수 키에서 삽입·삭제·후속자(successor)를 비교 한계(log n)보다 빠르게', W/2, H*0.10+22);
      // recursive split: U into sqrt(U) clusters + summary
      var topY=H*0.30;
      ctx.fillStyle='rgba(255,178,122,0.18)'; ctx.strokeStyle='#ffb27a'; ctx.lineWidth=2;
      ctx.fillRect(W*0.5-70,topY,140,32); ctx.strokeRect(W*0.5-70,topY,140,32);
      ctx.fillStyle='#ffb27a'; ctx.font='600 12px sans-serif'; ctx.fillText('summary (√U 개 클러스터 중 빈/참)', W/2, topY+20);
      var cy=H*0.56, k=4, cw=W*0.16;
      for(var i=0;i<k;i++){ var x=W*0.16+i*(cw+W*0.04);
        ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(W/2,topY+32); ctx.lineTo(x+cw/2,cy); ctx.stroke();
        ctx.fillStyle='rgba(122,184,255,0.14)'; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2;
        ctx.fillRect(x,cy,cw,30); ctx.strokeRect(x,cy,cw,30);
        ctx.fillStyle='#dfeefb'; ctx.font='600 12px sans-serif'; ctx.fillText('클러스터 '+i,x+cw/2,cy+20); }
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('전체 우주 U를 √U개 클러스터 + 요약(summary)으로 재귀 분해', W/2, H*0.76);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('각 연산은 클러스터 안 또는 요약 중 한 쪽으로만 재귀 → T(U)=T(√U)+O(1)=O(log log U)', W/2, H*0.86);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('min/max를 따로 저장해 재귀를 한 번 끊는 게 핵심. 메모리 O(U)(축소판은 해시로). 정수 전용 우선순위 큐', W/2, H*0.86+20); }
  },

  { id:'algo_br_wavelet', concept:true, branchOf:'algo2_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('웨이블릿 트리 — 구간 k번째 값·등수를 O(log σ)에', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('값의 비트(또는 중앙값)로 수열을 반복해 좌/우로 가르며, 각 층에 "어디로 갔는지" 비트맵 저장', W/2, H*0.10+22);
      // top array, split into left(small) right(big)
      var arr=[3,1,4,1,5,2,6]; var bx=W*0.5-(arr.length*40)/2, by=H*0.28, cw=36;
      for(var i=0;i<arr.length;i++){ var x=bx+i*40; var small=arr[i]<=3;
        ctx.fillStyle=small?'rgba(122,184,255,0.2)':'rgba(255,178,122,0.2)'; ctx.strokeStyle=small?'#7ab8ff':'#ffb27a'; ctx.lineWidth=1.5;
        ctx.fillRect(x,by,cw,28); ctx.strokeRect(x,by,cw,28);
        ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif'; ctx.fillText(arr[i],x+cw/2,by+19);
        ctx.fillStyle='#6a6873'; ctx.font='10px sans-serif'; ctx.fillText(small?'0':'1',x+cw/2,by+40); }
      ctx.fillStyle='#6a6873'; ctx.font='11px sans-serif'; ctx.fillText('비트맵(≤중앙값?0:1) — rank로 좌/우 위치 추적', W/2, by+54);
      // two children
      ctx.fillStyle='#7ab8ff'; ctx.font='600 13px sans-serif'; ctx.fillText('왼쪽(작은 값): 3 1 1 2', W*0.3, H*0.62);
      ctx.fillStyle='#ffb27a'; ctx.fillText('오른쪽(큰 값): 4 5 6', W*0.72, H*0.62);
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('질의: 비트맵 rank로 구간을 자식으로 사상하며 내려가 k번째/등수/빈도 계산', W/2, H*0.78);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('값 종류 σ에 대해 높이 log σ, 각 층 O(1) rank → 구간 k번째 값·X 이하 개수 O(log σ)', W/2, H*0.88);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('정적 배열의 "압축된 만능 질의기". Mo·머지소트트리·영속세그의 대안', W/2, H*0.88+20); }
  },

  { id:'algo_br_pairingheap', concept:true, branchOf:'algo6_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('쌍 힙(Pairing Heap) — 단순하고 빠른 합치기 힙', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('두 힙을 "루트가 작은 쪽 밑에 붙이기"로 합침. 피보나치 힙의 실전적 대안', W/2, H*0.10+22);
      // meld: two roots -> smaller becomes parent
      function node(x,y,t,col,r){ ctx.fillStyle=col==='r'?'rgba(255,178,122,0.22)':'rgba(122,184,255,0.16)'; ctx.strokeStyle=col==='r'?'#ffb27a':'#7ab8ff'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(x,y,r||15,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif'; ctx.fillText(t,x,y+4); }
      ctx.fillStyle='#cfd8e6'; ctx.font='600 13px sans-serif'; ctx.fillText('합치기(meld): 루트가 작은 힙 밑에 큰 힙을 자식으로', W/2, H*0.30);
      // result tree: root 3 with children 5(and its child 8), 7
      var root=[W*0.5,H*0.44]; node(root[0],root[1],'3','r');
      var ch=[[W*0.30,H*0.64,'5'],[W*0.5,H*0.64,'7'],[W*0.70,H*0.64,'9']];
      ch.forEach(function(c){ ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(root[0],root[1]); ctx.lineTo(c[0],c[1]); ctx.stroke(); node(c[0],c[1],c[2],'',13); });
      // grandchild
      ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(ch[0][0],ch[0][1]); ctx.lineTo(ch[0][0]-W*0.06,H*0.82); ctx.stroke(); node(ch[0][0]-W*0.06,H*0.82,'8','',11);
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('insert·decrease-key·merge = meld 한 번으로 O(1). 정리는 delete-min에서만', W/2, H*0.90);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('delete-min: 루트 제거 후 자식들을 둘씩 짝지어 합치고(two-pass) 다시 합침. 실측 매우 빠름', W/2, H*0.90+18); }
  },

  { id:'algo_br_ukkonen', concept:true, branchOf:'algo4_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('우코넨 — 접미사 트리를 O(n)에 짓기', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('한 문자열의 모든 접미사를 압축 트라이(접미사 트리)로, 한 글자씩 온라인으로 선형 시간에', W/2, H*0.10+22);
      // suffix tree for "banana$" (illustrative compressed trie)
      var root=[W*0.5,H*0.28];
      function node(x,y,r){ ctx.fillStyle='rgba(122,184,255,0.16)'; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(x,y,r||9,0,Math.PI*2); ctx.fill(); ctx.stroke(); }
      function edge(a,b,lbl,col){ ctx.strokeStyle=col||'rgba(255,255,255,0.25)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke(); ctx.fillStyle=col?'#ffb27a':'#8fe3b5'; ctx.font='11px sans-serif'; ctx.fillText(lbl,(a[0]+b[0])/2+10,(a[1]+b[1])/2); }
      var kids=[[W*0.18,H*0.56,'a'],[W*0.40,H*0.56,'na'],[W*0.62,H*0.56,'banana$'],[W*0.84,H*0.56,'$']];
      kids.forEach(function(k){ edge(root,k,k[2]); node(k[0],k[1]); });
      node(root[0],root[1],11);
      // suffix link (dashed)
      ctx.strokeStyle='rgba(255,178,122,0.6)'; ctx.lineWidth=2; ctx.setLineDash([5,4]); ctx.beginPath(); ctx.moveTo(kids[1][0],kids[1][1]); ctx.quadraticCurveTo(W*0.3,H*0.7,kids[0][0],kids[0][1]); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='#ffb27a'; ctx.font='11px sans-serif'; ctx.fillText('접미사 링크(suffix link)', W*0.30, H*0.74);
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('간선에 [시작,끝] 인덱스만 저장(전역 끝=암묵 확장), 접미사 링크로 다음 위치로 점프', W/2, H*0.84);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('"활성점 + 남은 개수 + 전역 끝" 규칙으로 각 글자 분할상환 O(1) → 전체 O(n)', W/2, H*0.91);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('부분문자열 검색·최장 반복·여러 문자열 LCS. 접미사 배열+LCP가 더 단순한 대안', W/2, H*0.91+18); }
  },

  { id:'algo_br_offdyncon', concept:true, branchOf:'algo5_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('오프라인 동적 연결성 — 시간 축에 세그트리', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('간선이 생겼다 사라지는 그래프의 연결성을, 롤백 union-find + 시간 구간으로', W/2, H*0.10+22);
      // time axis with edge life intervals mapped onto a segment tree
      var ax=W*0.12, bx2=W*0.88, ty=H*0.34; ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(ax,ty); ctx.lineTo(bx2,ty); ctx.stroke();
      ctx.fillStyle='#6a6873'; ctx.font='11px sans-serif'; for(var t=0;t<=8;t++){ var x=ax+t/8*(bx2-ax); ctx.fillText(t,x,ty+16); }
      // edge intervals
      var iv=[[1,5,'간선 e1','#7ab8ff'],[2,4,'e2','#8fe3b5'],[5,8,'e3','#ffb27a']];
      iv.forEach(function(v,i){ var x1=ax+v[0]/8*(bx2-ax), x2=ax+v[1]/8*(bx2-ax), y=ty-24-i*22;
        ctx.strokeStyle=v[3]; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(x1,y); ctx.lineTo(x2,y); ctx.stroke();
        ctx.fillStyle=v[3]; ctx.font='11px sans-serif'; ctx.fillText(v[2],x1+(x2-x1)/2,y-6); });
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('각 간선의 "존재 구간 [생성, 삭제)"를 시간 세그먼트 트리의 O(log) 노드에 등록', W/2, H*0.62);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('세그트리를 DFS: 노드 진입 시 그 간선들 union(롤백 가능, 경로압축 X·랭크만), 나갈 때 되돌리기', W/2, H*0.74);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('잎(시각 t)에 도달하면 그 순간 연결성 질의에 답 → 전체 O((n+q) log n · α)', W/2, H*0.84);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('삭제가 어려운 union-find를, "삭제=구간 끝"으로 바꿔 롤백만으로 처리. 오프라인(질의 미리 앎) 전제', W/2, H*0.84+20); }
  },

  { id:'algo_br_bcc', concept:true, branchOf:'algo6_04',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('이중연결성분(BCC) — 단절점으로 안 끊기는 덩어리', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('한 정점/간선을 없애도 여전히 연결인 부분. 단절점·다리로 그래프를 블록으로 분해', W/2, H*0.10+22);
      // two blocks joined by an articulation point
      var N={a:[0.20,0.40],b:[0.34,0.62],c:[0.20,0.74],ap:[0.50,0.52],d:[0.66,0.36],e:[0.80,0.60],f:[0.66,0.78]};
      var blockL=[['a','b'],['b','c'],['c','a'],['a','ap'],['b','ap']];
      var blockR=[['ap','d'],['d','e'],['e','f'],['f','ap'],['d','f']];
      function xy(t){ return [W*0.1+t[0]*W*0.8, H*0.22+t[1]*H*0.56]; }
      blockL.forEach(function(e){ var p=xy(N[e[0]]),q=xy(N[e[1]]); ctx.strokeStyle='rgba(122,184,255,0.5)'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(p[0],p[1]); ctx.lineTo(q[0],q[1]); ctx.stroke(); });
      blockR.forEach(function(e){ var p=xy(N[e[0]]),q=xy(N[e[1]]); ctx.strokeStyle='rgba(143,227,181,0.5)'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(p[0],p[1]); ctx.lineTo(q[0],q[1]); ctx.stroke(); });
      Object.keys(N).forEach(function(k){ var p=xy(N[k]); var ap=(k==='ap');
        ctx.fillStyle=ap?'rgba(255,141,141,0.3)':'rgba(122,184,255,0.16)'; ctx.strokeStyle=ap?'#ff8d8d':'#7ab8ff'; ctx.lineWidth=ap?3:2;
        ctx.beginPath(); ctx.arc(p[0],p[1],ap?16:13,0,Math.PI*2); ctx.fill(); ctx.stroke();
        if(ap){ ctx.fillStyle='#ff8d8d'; ctx.font='600 11px sans-serif'; ctx.fillText('단절점',p[0],p[1]-24); } });
      ctx.fillStyle='#7ab8ff'; ctx.font='12px sans-serif'; ctx.fillText('블록 1', W*0.24, H*0.86); ctx.fillStyle='#8fe3b5'; ctx.fillText('블록 2', W*0.70, H*0.86);
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('단절점(제거 시 분리되는 정점)을 공유하는 두 이중연결 블록', W/2, H*0.90);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('DFS의 low-link로 단절점·다리 탐지(low[v] ≥ disc[u]면 u가 단절점). 블록컷 트리로 응용', W/2, H*0.90+18); }
  },

  { id:'algo_br_mergesorttree', concept:true, branchOf:'algo5_04',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('머지 소트 트리 — 각 노드에 정렬된 구간 보관', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('세그먼트 트리 노드마다 그 구간을 "정렬해" 들고 있어, 구간 안 X 이하 개수를 O(log²n)에', W/2, H*0.10+22);
      // segment tree nodes showing sorted lists
      var nodes=[[0.5,0.30,'[1 2 3 5 8 9]'],[0.27,0.54,'[2 5 8]'],[0.73,0.54,'[1 3 9]'],[0.16,0.78,'[5 8]'],[0.38,0.78,'[2]']];
      function xy(t){ return [W*0.1+t[0]*W*0.8, H*0.24+t[1]*H*0.5]; }
      var edges=[[0,1],[0,2],[1,3],[1,4]];
      edges.forEach(function(e){ var a=xy(nodes[e[0]]),b=xy(nodes[e[1]]); ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke(); });
      nodes.forEach(function(n,i){ var p=xy(n);
        ctx.fillStyle=i===0?'rgba(255,178,122,0.18)':'rgba(122,184,255,0.14)'; ctx.strokeStyle=i===0?'#ffb27a':'#7ab8ff'; ctx.lineWidth=2;
        var w=n[2].length*7+12; ctx.fillRect(p[0]-w/2,p[1]-13,w,26); ctx.strokeRect(p[0]-w/2,p[1]-13,w,26);
        ctx.fillStyle='#dfeefb'; ctx.font='11px monospace'; ctx.fillText(n[2],p[0],p[1]+4); });
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('질의 [l,r]에 X 이하 개수: 구간을 덮는 O(log n) 노드 각각에서 이분 탐색(upper_bound)', W/2, H*0.80);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('노드당 정렬 리스트라 이분 탐색 O(log n) → 질의 O(log² n). 구축 O(n log n)·공간 O(n log n)', W/2, H*0.88);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('구간 k번째·등수·X이하 개수. 분할비(fractional cascading)로 O(log n)까지. 웨이블릿·Mo의 대안', W/2, H*0.88+20); }
  },

  { id:'algo_br_sternbrocot', concept:true, branchOf:'algo4_02',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('Stern-Brocot 트리 — 모든 기약분수의 이진 탐색', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('0/1과 1/0 사이를 중간값(mediant)으로 갈라, 모든 기약분수를 딱 한 번씩 만드는 트리', W/2, H*0.10+22);
      // tree of fractions
      var nodes=[[0.5,0.28,'1/1'],[0.28,0.50,'1/2'],[0.72,0.50,'2/1'],[0.16,0.72,'1/3'],[0.40,0.72,'2/3'],[0.60,0.72,'3/2'],[0.84,0.72,'3/1']];
      function xy(t){ return [W*0.1+t[0]*W*0.8, H*0.24+t[1]*H*0.5]; }
      var edges=[[0,1],[0,2],[1,3],[1,4],[2,5],[2,6]];
      edges.forEach(function(e){ var a=xy(nodes[e[0]]),b=xy(nodes[e[1]]); ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke(); });
      nodes.forEach(function(n,i){ var p=xy(n);
        ctx.fillStyle=i===0?'rgba(255,178,122,0.2)':'rgba(122,184,255,0.16)'; ctx.strokeStyle=i===0?'#ffb27a':'#7ab8ff'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.arc(p[0],p[1],17,0,Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.fillStyle='#dfeefb'; ctx.font='600 12px sans-serif'; ctx.fillText(n[2],p[0],p[1]+4); });
      ctx.fillStyle='#8fe3b5'; ctx.font='12px sans-serif';
      ctx.fillText('중간값(mediant): a/b 와 c/d 사이 = (a+c)/(b+d)', W/2, H*0.78);
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('1/2 와 2/1 사이 → (1+2)/(2+1)=3/3? 아니 부모 1/1. 좌우 이웃의 중간값이 자식', W/2, H*0.86);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('각 기약분수가 정확히 한 번 등장. L/R 경로 = 연분수. 분모 제한 근사·유리수 이분탐색에 사용', W/2, H*0.86+20); }
  },

  { id:'algo_br_smawk', concept:true, branchOf:'algo7_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('SMAWK — 완전단조 행렬의 행별 최솟값을 O(n)에', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('각 행의 최솟값 위치가 단조로 증가하면, 행마다 다 보지 않고도 한꺼번에', W/2, H*0.10+22);
      // matrix with min positions monotone (staircase)
      var R=5,C=6, bx=W*0.30, by=H*0.28, cw=42, ch=34;
      var minc=[0,1,1,3,4];
      for(var r=0;r<R;r++)for(var c=0;c<C;c++){ var x=bx+c*cw,y=by+r*ch; var on=(c===minc[r]);
        ctx.fillStyle=on?'rgba(255,178,122,0.3)':'rgba(122,184,255,0.07)'; ctx.strokeStyle=on?'#ffb27a':'#3a4358'; ctx.lineWidth=on?2.5:1;
        ctx.fillRect(x,y,cw-4,ch-4); ctx.strokeRect(x,y,cw-4,ch-4);
        if(on){ ctx.fillStyle='#ffb27a'; ctx.font='600 11px sans-serif'; ctx.fillText('min',x+(cw-4)/2,y+ch/2); } }
      ctx.fillStyle='#6a6873'; ctx.font='11px sans-serif'; ctx.textAlign='right';
      for(var r=0;r<R;r++) ctx.fillText('행'+r,bx-6,by+r*ch+ch/2); ctx.textAlign='center';
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('완전단조: 행 최솟값 열 위치가 행이 내려갈수록 ≥ (계단처럼 단조)', W/2, H*0.74);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('REDUCE(쓸모없는 열 제거) + 홀수 행만 재귀 후 짝수 행은 좁은 범위서만 탐색 → 전체 O(n+m)', W/2, H*0.84);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('쓰임: 분할정복/크누스로 안 풀리는 1D1D DP, 최소 둘레 다각형, 행렬 검색을 선형으로', W/2, H*0.84+20); }
  },

  { id:'algo_br_dinkelbach', branchOf:'algo8_01',
    code:[
      'DINKELBACH(items):              // max (Σa)/(Σb)',
      '  λ ← 0',
      '  repeat:',
      '    S ← { i : a[i] − λ·b[i] > 0 }   // g(λ) 최대화',
      '    g ← Σ_{i∈S}(a[i] − λ·b[i])',
      '    if |g| < ε: break',
      '    λ ← (Σ_{i∈S} a[i]) / (Σ_{i∈S} b[i])   // 비율로 갱신',
      '  return λ                        // 최적 비율 λ*'
    ],
    build:function(V){
      var items=[{a:9,b:4},{a:7,b:3},{a:5,b:5},{a:8,b:2},{a:3,b:6}];
      var st=[];
      function snap(line,cap,extra){ var f={line:line,cap:cap,items:items}; if(extra)for(var k in extra)f[k]=extra[k]; st.push(f); }
      function solve(lam){ var S=[],ga=0,gb=0,g=0; for(var i=0;i<items.length;i++){ var v=items[i].a-lam*items[i].b; if(v>1e-9){ S.push(i); ga+=items[i].a; gb+=items[i].b; g+=v; } } return {S:S,ga:ga,gb:gb,g:g}; }
      snap([0,1],'비율 <b>(Σa)/(Σb)</b> 최대화. 분모가 변수라 어려우므로 <b>g(λ)=max Σ(a−λ·b)</b>로 바꿉니다. λ를 0에서 시작합니다.',{lam:0,S:[],g:null,hist:[0]});
      var lam=0, hist=[0], iter=0;
      while(iter<6){
        var r=solve(lam);
        snap(3,'반복 '+(iter+1)+': 각 항목의 <b>a−λ·b</b>가 양수인 것만 고릅니다 (g(λ) 최대화). λ='+lam.toFixed(3)+'.',{lam:lam,S:r.S.slice(),g:null,gline:r.g,hist:hist.slice()});
        snap(4,'선택집합 합: <b>g(λ)='+r.g.toFixed(2)+'</b>  (Σa='+r.ga+', Σb='+r.gb+'). g가 0보다 크면 비율이 더 커질 수 있다는 신호입니다.',{lam:lam,S:r.S.slice(),g:r.g,gline:r.g,hist:hist.slice(),ga:r.ga,gb:r.gb});
        if(Math.abs(r.g)<0.02){
          snap([5,7],'<b>|g(λ)|≈0 → 수렴!</b> 최적 비율 <b>λ* = '+lam.toFixed(3)+'</b>. 분모를 뺄셈으로 바꿔 비율 문제를 풀었습니다.',{lam:lam,S:r.S.slice(),g:r.g,done:true,hist:hist.slice()});
          break;
        }
        var nl=r.ga/r.gb;
        snap(6,'아직 g>0 → 현재 해의 비율로 <b>λ ← '+r.ga+'/'+r.gb+' = '+nl.toFixed(3)+'</b> 갱신. g는 λ에 단조 감소하므로 다음엔 더 작아집니다.',{lam:lam,S:r.S.slice(),g:r.g,newlam:nl,hist:hist.slice(),ga:r.ga,gb:r.gb});
        lam=nl; hist.push(lam); iter++;
      }
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H,IT=f.items;
      ctx.textBaseline='alphabetic';
      // 항목 막대: a, b, a-λb
      var x0=W*0.10, colw=Math.min(78,(W*0.46)/IT.length), y0=H*0.20, bh=Math.min(130,H*0.30);
      ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('항목별  a−λ·b  (양수=선택)', x0, y0-14);
      var lam=f.lam;
      for(var i=0;i<IT.length;i++){
        var v=IT[i].a-lam*IT[i].b, sel=f.S&&f.S.indexOf(i)>=0;
        var cx=x0+i*colw, base=y0+bh, scale=bh/12;
        // a-λb 값 막대 (0 기준 위/아래)
        var hgt=v*scale, col=sel?'#8fe3b5':(v>0?'#ffb27a':'#9b99a3');
        ctx.fillStyle=sel?'rgba(143,227,181,0.28)':(v>0?'rgba(255,178,122,0.22)':'rgba(155,153,163,0.12)');
        ctx.strokeStyle=col; ctx.lineWidth=2;
        var top=v>0?base-hgt:base, hh=Math.abs(hgt);
        ctx.fillRect(cx,top,colw-12,hh); ctx.strokeRect(cx,top,colw-12,hh);
        // zero line
        ctx.strokeStyle='rgba(255,255,255,0.20)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(cx-2,base); ctx.lineTo(cx+colw-8,base); ctx.stroke();
        ctx.fillStyle=col; ctx.font='600 12px sans-serif'; ctx.textAlign='center';
        ctx.fillText(v.toFixed(1), cx+(colw-12)/2, v>0?top-5:base+hh+14);
        ctx.fillStyle='#7ab8ff'; ctx.font='10px sans-serif'; ctx.fillText('a'+IT[i].a+' b'+IT[i].b, cx+(colw-12)/2, base+bh*0.42);
      }
      // λ 수직선 (오른쪽)
      var nx0=W*0.62, nx1=W*0.92, ny=H*0.30, lo=0, hi=2.6;
      function NX(l){ return nx0+(nx1-nx0)*(l-lo)/(hi-lo); }
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(nx0,ny); ctx.lineTo(nx1,ny); ctx.stroke();
      ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('λ 수렴', (nx0+nx1)/2, ny-26);
      for(var t=0;t<=2.5;t+=0.5){ var tx=NX(t); ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.beginPath(); ctx.moveTo(tx,ny-5); ctx.lineTo(tx,ny+5); ctx.stroke(); ctx.fillStyle='#6f6e7a'; ctx.font='10px sans-serif'; ctx.fillText(t.toFixed(1),tx,ny+18); }
      // history dots
      if(f.hist){ for(var h=0;h<f.hist.length;h++){ var hx=NX(f.hist[h]); ctx.fillStyle='rgba(122,184,255,0.5)'; ctx.beginPath(); ctx.arc(hx,ny,4,0,7); ctx.fill(); } }
      // current λ
      var clx=NX(lam); ctx.fillStyle=f.done?'#8fe3b5':'#ffb27a'; ctx.beginPath(); ctx.arc(clx,ny,7,0,7); ctx.fill();
      ctx.font='600 12px sans-serif'; ctx.fillText('λ='+lam.toFixed(3), clx, ny+34);
      // new λ arrow
      if(f.newlam!=null){ var nlx=NX(f.newlam); ctx.strokeStyle='#ffb27a'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(clx,ny-14); ctx.lineTo(nlx,ny-14); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(nlx,ny-14); ctx.lineTo(nlx-5,ny-18); ctx.lineTo(nlx-5,ny-10); ctx.fill();
        ctx.fillStyle='#ffb27a'; ctx.fillText('→ '+f.newlam.toFixed(3), nlx, ny-22); }
      // g(λ) 표시
      if(f.g!=null){ ctx.textAlign='left'; ctx.font='600 14px sans-serif';
        ctx.fillStyle=Math.abs(f.g)<0.02?'#8fe3b5':'#ffb27a';
        ctx.fillText('g(λ) = '+f.g.toFixed(2), nx0, ny+H*0.22);
        ctx.fillStyle='#9b99a3'; ctx.font='11px sans-serif';
        ctx.fillText(Math.abs(f.g)<0.02?'g≈0 → 최적 λ* 도달':'g>0 → 비율 더 키울 여지', nx0, ny+H*0.22+18); }
    }
  },

  { id:'algo_br_tarjanlca', concept:true, branchOf:'algo5_03',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('타잔 오프라인 LCA — DFS + union-find로 한 번에', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('모든 LCA 질의를 미리 알 때, DFS 한 번 + union-find로 거의 선형에 모두 답', W/2, H*0.10+22);
      var N={a:[0.5,0.26,'1'],b:[0.30,0.48,'2'],c:[0.70,0.48,'3'],d:[0.18,0.70,'4'],e:[0.42,0.70,'5'],f:[0.70,0.70,'6']};
      var edges=[['a','b'],['a','c'],['b','d'],['b','e'],['c','f']];
      function xy(t){ return [W*0.1+t[0]*W*0.8, H*0.22+t[1]*H*0.5]; }
      edges.forEach(function(e){ var p=xy(N[e[0]]),q=xy(N[e[1]]); ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(p[0],p[1]); ctx.lineTo(q[0],q[1]); ctx.stroke(); });
      Object.keys(N).forEach(function(k){ var p=xy(N[k]); var done=['b','d','e'].indexOf(k)>=0;
        ctx.fillStyle=done?'rgba(143,227,181,0.2)':'rgba(122,184,255,0.16)'; ctx.strokeStyle=done?'#8fe3b5':'#7ab8ff'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.arc(p[0],p[1],14,0,Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.fillStyle='#dfeefb'; ctx.font='600 12px sans-serif'; ctx.fillText(N[k][2],p[0],p[1]+4); });
      ctx.fillStyle='#ffb27a'; ctx.font='12px sans-serif';
      ctx.fillText('질의 LCA(4,5)=2 — DFS가 2의 서브트리를 마칠 때 둘 다 방문완료 → 답=2의 묶음 대표', W/2, H*0.84);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('DFS: 자식 끝나면 부모로 union. 정점 u 방문중, 이미 끝난 짝 v와의 질의는 LCA=find(v)', W/2, H*0.91);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('전체 O((n+q)·α). 온라인 LCA(희소테이블·오일러투어+RMQ)와 달리 질의 선행 필요(오프라인)', W/2, H*0.91+18); }
  },

  { id:'algo_br_johnson', concept:true, branchOf:'algo6_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('존슨 알고리즘 — 희소 그래프 모든 쌍 최단경로', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('음수 간선을 포텐셜로 "0 이상으로 재가중"한 뒤, 정점마다 다익스트라', W/2, H*0.10+22);
      // steps list
      ctx.fillStyle='#cfd8e6'; ctx.font='13px sans-serif'; ctx.textAlign='left';
      var lines=['① 가상 정점 q 추가 → 모든 정점에 가중치 0 간선',
        '② 벨만-포드로 q에서 각 정점까지 거리 h[v] 계산 (음수사이클 검출도)',
        '③ 재가중: w′(u,v) = w(u,v) + h[u] − h[v]  ≥ 0  (음수 제거!)',
        '④ 각 정점에서 다익스트라(빠름) → 거리 d′ 복원: d = d′ − h[u] + h[v]'];
      lines.forEach(function(t,i){ ctx.fillText(t, W*0.10, H*0.34+i*30); });
      ctx.textAlign='center';
      ctx.fillStyle='#ffb27a'; ctx.font='600 14px sans-serif';
      ctx.fillText('핵심: h[u]−h[v]는 경로 합에서 텔레스코핑 → 최단경로 순위 불변', W/2, H*0.74);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('시간 O(V·E + V² log V) — 희소(E≪V²)면 플로이드-워셜 O(V³)보다 빠름', W/2, H*0.85);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('음수 간선 허용(음수 사이클은 불가). 다익스트라가 음수를 못 다루는 문제를 포텐셜로 우회', W/2, H*0.85+20); }
  },

  { id:'algo_br_bittricks', concept:true, branchOf:'algo2_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('비트 연산 트릭 — 한 줄로 끝내는 정수 마술', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('최하위 비트·1의 개수·부분집합 순회·그레이 코드를 비트 연산 한두 번에', W/2, H*0.10+22);
      var rows=[['x & (−x)','최하위 켜진 비트만 남김 (펜윅의 lowbit)','#7ab8ff'],
        ['x & (x−1)','최하위 1을 끔 → popcount 루프','#8fe3b5'],
        ['for(s=m; s; s=(s−1)&m)','부분집합 전부 순회 (마스크 m)','#ffb27a'],
        ['x ^ (x>>1)','정수 → 그레이 코드 (이웃이 1비트차)','#9a86ff']];
      var by=H*0.30;
      rows.forEach(function(r,i){ var y=by+i*52;
        ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.fillRect(W*0.14,y,W*0.72,42);
        ctx.strokeStyle=r[2]; ctx.lineWidth=2; ctx.strokeRect(W*0.14,y,W*0.72,42);
        ctx.fillStyle=r[2]; ctx.font='600 15px monospace'; ctx.textAlign='left'; ctx.fillText(r[0],W*0.17,y+19);
        ctx.fillStyle='#cfd8e6'; ctx.font='12px sans-serif'; ctx.fillText(r[1],W*0.17,y+36); ctx.textAlign='center'; });
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('비트 = 집합. AND=교집합·OR=합집합·XOR=대칭차·<<=원소이동. 비트마스크 DP의 토대', W/2, H*0.86);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('m의 부분집합 순회는 3ⁿ(전체), popcount는 하드웨어 명령(__builtin_popcount)이 가장 빠름', W/2, H*0.86+20); }
  },

  { id:'algo_br_xorbasis', branchOf:'algo8_03',
    code:[
      'INSERT(x):                // XOR 선형 기저',
      '  for b = 상위비트 .. 0:',
      '    if (x >> b & 1) == 0: continue',
      '    if basis[b] == 0:',
      '      basis[b] ← x; return // 새 기저 추가',
      '    x ← x XOR basis[b]     // 최상위 비트 소거',
      '  // x == 0 → 기존 기저로 표현 가능(추가 안 함)'
    ],
    build:function(V){
      var BITS=4;            // 0..15
      var nums=[6,11,5,3,9];  // 6=0110, 11=1011, 5=0101, 3=0011, 9=1001
      var basis=[0,0,0,0];    // basis[b]
      function hi(x){ for(var b=BITS-1;b>=0;b--) if(x>>b&1) return b; return -1; }
      function bin(x){ var s=''; for(var b=BITS-1;b>=0;b--) s+=(x>>b&1); return s; }
      var st=[], sizes=[];
      function snap(line,cap,o){ o=o||{}; st.push({line:line,cap:cap,BITS:BITS,
        basis:basis.slice(),cur:(o.cur==null?-1:o.cur),orig:(o.orig==null?-1:o.orig),
        bit:(o.bit==null?-1:o.bit),inserted:(o.inserted==null?-1:o.inserted),
        reduced:o.reduced||false,redundant:o.redundant||false,count:o.count||0,done:o.done||false}); }
      snap([0],'수 [6,11,5,3,9] 를 차례로 <b>XOR 선형 기저</b>에 넣습니다. basis[b]=선두 비트가 b인 기저.',{count:0});
      var cnt=0;
      for(var t=0;t<nums.length;t++){
        var x=nums[t], orig=nums[t];
        snap([1],'<b>'+orig+'</b> ('+bin(orig)+') 삽입 시도. 최상위 비트부터 내려갑니다.',{cur:x,orig:orig});
        var inserted=-1, redundant=false;
        for(var b=BITS-1;b>=0;b--){
          if(!(x>>b&1)) continue;
          if(basis[b]===0){
            basis[b]=x; inserted=b; cnt++;
            snap([3,4],'비트 '+b+' 자리가 비어 있음 → <b>basis['+b+'] ← '+x+'</b> ('+bin(x)+') 새 기저로 추가! (크기 '+cnt+')',
              {cur:x,orig:orig,bit:b,inserted:b,count:cnt});
            break;
          } else {
            var before=x; x=x^basis[b];
            snap([5],'비트 '+b+' 가 켜져 있고 basis['+b+']='+basis[b]+' 존재 → x = '+before+' XOR '+basis[b]+' = <b>'+x+'</b> ('+bin(x)+'). 최상위 비트 소거.',
              {cur:x,orig:orig,bit:b,reduced:true,count:cnt});
          }
        }
        if(inserted<0 && x===0){
          snap([6],'<b>'+orig+'</b> 는 0 으로 줄었습니다 → 기존 기저들의 XOR 로 <b>이미 표현 가능</b>, 추가하지 않습니다.',
            {orig:orig,redundant:true,count:cnt});
        }
      }
      var span=Math.pow(2,cnt);
      snap([0],'<b>완료!</b> 기저 크기 k='+cnt+' → 부분집합 XOR 로 만들 수 있는 값은 정확히 <b>2^'+cnt+' = '+span+'개</b>입니다.',{count:cnt,done:true});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H,BITS=f.BITS;
      ctx.textAlign='center'; ctx.fillStyle='#cfd8e6'; ctx.font='600 15px sans-serif';
      ctx.fillText('XOR 기저: 최상위 비트로 줄여 빈 자리에 삽입', W/2, H*0.10);
      function bin(x){ var s=''; for(var b=BITS-1;b>=0;b--) s+=(x>>b&1); return s; }
      // 현재 처리 중인 수
      if(f.cur>=0){
        ctx.textAlign='center'; ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif';
        ctx.fillText('처리 중인 수 '+(f.orig>=0?('(원본 '+f.orig+')'):''), W/2, H*0.20);
        var bw=44, sx=W/2-(BITS*bw)/2, sy=H*0.23;
        for(var b=BITS-1;b>=0;b--){ var idx=BITS-1-b; var x2=sx+idx*bw;
          var on=(f.cur>>b&1);
          var hot=(b===f.bit);
          ctx.fillStyle=hot?'rgba(255,178,122,0.25)':(on?'rgba(122,184,255,0.18)':'rgba(155,153,163,0.06)');
          ctx.strokeStyle=hot?'#ffb27a':(on?'#7ab8ff':'#3c4a5e'); ctx.lineWidth=hot?2.4:1.4;
          if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x2,sy,bw-6,36,6);}else{ctx.beginPath();ctx.rect(x2,sy,bw-6,36);}
          ctx.fill(); ctx.stroke();
          ctx.fillStyle=hot?'#ffb27a':(on?'#dfeefb':'#5a5a64'); ctx.font='600 18px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.fillText(''+on,x2+(bw-6)/2,sy+18); ctx.textBaseline='alphabetic';
          ctx.fillStyle='#6f6e7a'; ctx.font='10px monospace'; ctx.fillText('비트'+b,x2+(bw-6)/2,sy+50);
        }
        ctx.fillStyle='#7ab8ff'; ctx.font='600 15px monospace'; ctx.textAlign='left';
        ctx.fillText('= '+f.cur, sx+BITS*bw+6, sy+20);
      }
      // 기저 배열 (비트 인덱스별)
      var ty0=H*0.46, rh=Math.min(44,H*0.10), lx=W*0.18;
      ctx.textAlign='left'; ctx.fillStyle='#9b99a3'; ctx.font='600 13px sans-serif'; ctx.textBaseline='alphabetic';
      ctx.fillText('선형 기저 (비트 자리별)', lx, ty0-12);
      for(b=BITS-1;b>=0;b--){
        var rowi=BITS-1-b; var y=ty0+rowi*(rh+6);
        var val=f.basis[b];
        var justIns=(b===f.inserted);
        var empty=(val===0);
        ctx.fillStyle='#7f8a9b'; ctx.font='600 13px monospace'; ctx.textAlign='right'; ctx.textBaseline='middle';
        ctx.fillText('basis['+b+']', lx-8, y+rh/2);
        var bx=lx+8, bw2=W*0.34;
        ctx.fillStyle=justIns?'rgba(143,227,181,0.22)':empty?'rgba(155,153,163,0.05)':'rgba(122,184,255,0.12)';
        ctx.strokeStyle=justIns?'#8fe3b5':empty?'#3c4a5e':'#7ab8ff'; ctx.lineWidth=justIns?2.4:1.4;
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(bx,y,bw2,rh,8);}else{ctx.beginPath();ctx.rect(bx,y,bw2,rh);}
        ctx.fill(); ctx.stroke();
        ctx.textAlign='left'; ctx.fillStyle=justIns?'#8fe3b5':empty?'#5a5a64':'#dfeefb'; ctx.font='600 16px monospace';
        ctx.fillText(empty?'(빈 자리)':(bin(val)+'  = '+val), bx+12, y+rh/2);
        ctx.textBaseline='alphabetic';
      }
      // 상태
      ctx.textAlign='center'; ctx.textBaseline='alphabetic';
      if(f.redundant){ ctx.fillStyle='#f4a0c0'; ctx.font='600 14px sans-serif';
        ctx.fillText('중복 — 기존 기저로 표현 가능 (추가 안 함)', W/2, H*0.90); }
      else if(f.done){ ctx.fillStyle='#8fe3b5'; ctx.font='600 16px sans-serif';
        ctx.fillText('기저 크기 k = '+f.count+'  →  만들 수 있는 값 2^'+f.count+' = '+Math.pow(2,f.count)+'개', W/2, H*0.90); }
      else { ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif';
        ctx.fillText('현재 기저 크기 = '+f.count, W/2, H*0.90); }
    }
  },

  { id:'algo_br_stablematch', concept:true, branchOf:'algo6_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('안정 결혼 — 게일-섀플리 청혼 알고리즘', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('서로 더 좋아하는 짝이 없도록(불안정 쌍 0) 짝짓기. 항상 존재하고 O(n²)에 구성', W/2, H*0.10+22);
      // two columns proposers/receivers with matched lines
      var L=[[0.28,0.34,'A'],[0.28,0.50,'B'],[0.28,0.66,'C']];
      var R=[[0.72,0.34,'X'],[0.72,0.50,'Y'],[0.72,0.66,'Z']];
      var match=[[0,1],[1,0],[2,2]];
      ctx.strokeStyle='#8fe3b5'; ctx.lineWidth=3;
      match.forEach(function(m){ var a=L[m[0]],b=R[m[1]]; ctx.beginPath(); ctx.moveTo(W*a[0],H*a[1]); ctx.lineTo(W*b[0],H*b[1]); ctx.stroke(); });
      function dots(arr,col){ arr.forEach(function(p){ ctx.fillStyle='rgba(122,184,255,0.18)'; ctx.strokeStyle=col; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(W*p[0],H*p[1],16,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif'; ctx.fillText(p[2],W*p[0],H*p[1]+5); }); }
      dots(L,'#7ab8ff'); dots(R,'#ffb27a');
      ctx.fillStyle='#7ab8ff'; ctx.font='12px sans-serif'; ctx.fillText('청혼자', W*0.28, H*0.24); ctx.fillStyle='#ffb27a'; ctx.fillText('수락자', W*0.72, H*0.24);
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('자유 청혼자가 다음 선호 상대에게 청혼 → 상대는 더 나은 제안이면 갈아탐(이전 짝 자유화)', W/2, H*0.82);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('항상 안정 매칭으로 종료(불안정 쌍 없음). 청혼하는 쪽에 최적, 받는 쪽에 최악인 매칭', W/2, H*0.90);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('쓰임: 인턴-병원 배정(NRMP), 학생-학교 배정. 2012 노벨경제학상(섀플리·로스)', W/2, H*0.90+18); }
  },

  { id:'algo_br_boyermoore', concept:true, branchOf:'algo4_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('보이어-무어 다수결 — 과반 원소를 O(1) 공간에', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('절반 넘게 나오는 원소를, 후보 하나와 카운터 하나만으로 한 번 훑어 찾기', W/2, H*0.10+22);
      var arr=['A','A','B','A','C','A','A']; var bx=W*0.5-(arr.length*48)/2, by=H*0.32, cw=42;
      var cand=['A','A','A','A','A','A','A']; var cnt=[1,2,1,2,1,2,3];
      for(var i=0;i<arr.length;i++){ var x=bx+i*48; var maj=arr[i]==='A';
        ctx.fillStyle=maj?'rgba(255,178,122,0.22)':'rgba(122,184,255,0.14)'; ctx.strokeStyle=maj?'#ffb27a':'#7ab8ff'; ctx.lineWidth=1.5;
        ctx.fillRect(x,by,cw,34); ctx.strokeRect(x,by,cw,34);
        ctx.fillStyle='#dfeefb'; ctx.font='600 15px sans-serif'; ctx.fillText(arr[i],x+cw/2,by+22);
        ctx.fillStyle='#8fe3b5'; ctx.font='10px sans-serif'; ctx.fillText('cnt'+cnt[i],x+cw/2,by+48); }
      ctx.fillStyle='#ffb27a'; ctx.font='600 16px sans-serif';
      ctx.fillText('최종 후보 = A  (카운터가 0이 안 돼 살아남음)', W/2, H*0.62);
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('규칙: 같으면 cnt++, 다르면 cnt−−. cnt=0이면 현재 원소를 새 후보로', W/2, H*0.78);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('직관: 과반 원소는 "다른 모든 원소와 1:1 상쇄"해도 반드시 남는다. O(n) 시간·O(1) 공간', W/2, H*0.86);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('주의: 과반 보장 없으면 후보를 2차 패스로 검증. ⌊n/3⌋ 초과는 후보 2개로 일반화', W/2, H*0.86+20); }
  },

  { id:'algo_br_partition', concept:true, branchOf:'algo7_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('정수 분할 — n을 합으로 쪼개는 가짓수', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('순서 무관하게 n을 양의 정수 합으로 적는 방법의 수 p(n). 동전교환의 사촌', W/2, H*0.10+22);
      // Ferrers diagrams for partitions of 4
      ctx.fillStyle='#dfeefb'; ctx.font='600 14px sans-serif';
      ctx.fillText('p(4) = 5 가지 (페러스 점 그림)', W/2, H*0.28);
      var parts=[[4],[3,1],[2,2],[2,1,1],[1,1,1,1]];
      var dot=11, gx=W*0.12, gy=H*0.38, colw=W*0.16;
      parts.forEach(function(p,i){ var x0=gx+i*colw;
        for(var r=0;r<p.length;r++)for(var c=0;c<p[r];c++){ ctx.fillStyle='#7ab8ff'; ctx.beginPath(); ctx.arc(x0+c*(dot+3),gy+r*(dot+3),dot/2,0,Math.PI*2); ctx.fill(); }
        ctx.fillStyle='#8a8893'; ctx.font='11px sans-serif'; ctx.fillText(p.join('+'),x0+18,gy+5*(dot+3)+6); });
      ctx.fillStyle='#ffb27a'; ctx.font='600 14px sans-serif';
      ctx.fillText('DP: dp[i][s] = i 이하 정수로 s 만들기 = dp[i−1][s] + dp[i][s−i]', W/2, H*0.74);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('동전교환(중복허용)과 같은 점화식 — 단 "가짓수"를 셈. 부분합·부품 1..n 한 번씩 누적', W/2, H*0.84);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('오일러 오각수 정리로 O(n√n), 생성함수 ∏ 1/(1−xᵏ). 켤레=페러스 그림 뒤집기(전치)', W/2, H*0.84+20); }
  },

  { id:'algo_br_matrixtree', branchOf:'algo8_03',
    code:[
      'MATRIX-TREE(G):           // 신장 트리 수',
      '  A ← 인접행렬, D ← 차수 대각',
      '  L ← D − A               // 라플라시안',
      '  L\' ← L 에서 한 행·한 열 삭제',
      '  return det(L\')          // = 신장 트리 개수'
    ],
    build:function(V){
      // 4 정점 그래프: 0-1,0-2,0-3,1-2 (cycle 0-1-2 + pendant 3)
      var n=4, pos=[[0.5,0.22],[0.25,0.55],[0.75,0.55],[0.5,0.82]];
      var E=[[0,1],[0,2],[0,3],[1,2]];
      var A=[]; for(var i=0;i<n;i++){ A.push([]); for(var j=0;j<n;j++) A[i][j]=0; }
      E.forEach(function(e){ A[e[0]][e[1]]=1; A[e[1]][e[0]]=1; });
      var deg=[]; for(i=0;i<n;i++){ var d=0; for(j=0;j<n;j++) d+=A[i][j]; deg[i]=d; }
      var L=[]; for(i=0;i<n;i++){ L.push([]); for(j=0;j<n;j++) L[i][j]=(i===j?deg[i]:0)-A[i][j]; }
      // 코팩터: 0행0열 삭제 → 3x3
      var M=[]; for(i=1;i<n;i++){ var row=[]; for(j=1;j<n;j++) row.push(L[i][j]); M.push(row); }
      function det3(m){ return m[0][0]*(m[1][1]*m[2][2]-m[1][2]*m[2][1])
        - m[0][1]*(m[1][0]*m[2][2]-m[1][2]*m[2][0])
        + m[0][2]*(m[1][0]*m[2][1]-m[1][1]*m[2][0]); }
      var ans=det3(M);
      var st=[];
      function snap(line,cap,o){ o=o||{}; st.push({line:line,cap:cap,n:n,pos:pos,E:E,
        A:A,deg:deg,L:L,M:M,ans:ans,show:o.show||'graph',del:o.del||false,detv:(o.detv==null?-1:o.detv),lrow:(o.lrow==null?-1:o.lrow)}); }
      snap([0],'정점 4개 그래프: 삼각형 0-1-2 + 정점 0 에 매달린 가지 0-3. 신장 트리 수를 행렬식으로 구합니다.',{show:'graph'});
      snap([1],'<b>인접행렬 A</b>: 간선이 있으면 1. 차수 D = 각 정점의 이웃 수 = ['+deg.join(',')+'].',{show:'A'});
      for(var rr=0;rr<n;rr++){
        snap([2],'행 '+rr+': L['+rr+']['+rr+'] = 차수 '+deg[rr]+', 이웃은 −1 → ['+L[rr].join(', ')+'] (행 합 0).',{show:'L',lrow:rr});
      }
      snap([2],'<b>라플라시안 L = D − A</b> 완성: 대각엔 차수, 비대각엔 −(간선). 모든 행 합이 0 입니다.',{show:'L'});
      snap([3],'L 은 고윳값 0 을 가져 det(L)=0 → 정보가 중복. <b>0번 행·0번 열을 삭제</b>(분홍)해 3×3 코팩터 L′ 을 만듭니다.',{show:'L',del:true});
      snap([4],'코팩터 <b>L′</b> 만 남겼습니다. 이제 이 3×3 의 <b>행렬식</b>을 라플라스 전개로 계산합니다.',{show:'M'});
      snap([4],'1행 전개: '+M[0][0]+'·(소행렬식) − ('+M[0][1]+')·(…) + '+M[0][2]+'·(…) 를 차례로 더합니다.',{show:'M'});
      snap([4],'<b>det(L′) = '+ans+'</b> → 이 그래프의 <b>신장 트리는 '+ans+'개</b>입니다(삼각형의 3가지 × 가지 0-3 은 항상 포함).',{show:'M',detv:ans});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H,n=f.n;
      ctx.textAlign='center'; ctx.fillStyle='#cfd8e6'; ctx.font='600 15px sans-serif';
      ctx.fillText('행렬-트리 정리: L=D−A → 한 행·열 삭제 → det', W/2, H*0.09);
      // 그래프 (왼쪽)
      var gx0=W*0.06,gx1=W*0.42,gy0=H*0.18,gy1=H*0.70;
      function GX(s){ return gx0+(gx1-gx0)*s; }
      function GY(s){ return gy0+(gy1-gy0)*s; }
      ctx.lineWidth=2; ctx.strokeStyle='#7ab8ff';
      f.E.forEach(function(e){ var a=f.pos[e[0]],b=f.pos[e[1]];
        ctx.beginPath(); ctx.moveTo(GX(a[0]),GY(a[1])); ctx.lineTo(GX(b[0]),GY(b[1])); ctx.stroke(); });
      for(var v=0;v<n;v++){ var px=GX(f.pos[v][0]),py=GY(f.pos[v][1]);
        var deleted=(f.del&&v===0);
        ctx.fillStyle=deleted?'rgba(244,160,192,0.18)':'rgba(122,184,255,0.15)';
        ctx.strokeStyle=deleted?'#f4a0c0':'#7ab8ff'; ctx.lineWidth=2.4;
        ctx.beginPath(); ctx.arc(px,py,16,0,7); ctx.fill(); ctx.stroke();
        ctx.fillStyle=deleted?'#f4a0c0':'#dfeefb'; ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(''+v,px,py); ctx.textBaseline='alphabetic'; }
      ctx.fillStyle='#7f8a9b'; ctx.font='11px sans-serif'; ctx.textAlign='center';
      ctx.fillText('차수: '+f.deg.join(' '), (gx0+gx1)/2, gy1+20);
      // 행렬 (오른쪽)
      var mat = (f.show==='A')?f.A:(f.show==='M')?f.M:f.L;
      var dim=mat.length;
      var mx0=W*0.52, my0=H*0.24, cs=Math.min(56,(W*0.40)/dim);
      var lbl=(f.show==='A')?'A (인접)':(f.show==='M')?"L' (코팩터 3×3)":'L = D − A (라플라시안)';
      ctx.fillStyle='#9b99a3'; ctx.font='600 13px sans-serif'; ctx.textAlign='center';
      ctx.fillText(lbl, mx0+dim*cs/2, my0-14);
      for(var i=0;i<dim;i++) for(var j=0;j<dim;j++){
        var x=mx0+j*cs, y=my0+i*cs, val=mat[i][j];
        var del=(f.del&&f.show==='L'&&(i===0||j===0));
        var rowhl=(f.lrow>=0&&f.show==='L'&&i===f.lrow&&!del);
        var diag=(f.show==='L'&&i===j&&!del&&!rowhl);
        ctx.fillStyle=del?'rgba(244,160,192,0.16)':rowhl?'rgba(143,227,181,0.18)':diag?'rgba(255,178,122,0.14)':'rgba(122,184,255,0.10)';
        ctx.strokeStyle=del?'#f4a0c0':rowhl?'#8fe3b5':diag?'#ffb27a':'#3c4a5e'; ctx.lineWidth=(del||rowhl)?2:1;
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,cs-4,cs-4,6);}else{ctx.beginPath();ctx.rect(x,y,cs-4,cs-4);}
        ctx.fill(); ctx.stroke();
        ctx.fillStyle=del?'#f4a0c0':rowhl?'#8fe3b5':diag?'#ffb27a':'#dfeefb'; ctx.font='600 15px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText((val>0?'':'')+val, x+(cs-4)/2, y+(cs-4)/2); ctx.textBaseline='alphabetic';
      }
      // det 결과
      if(f.detv>=0){ ctx.textAlign='center'; ctx.fillStyle='#8fe3b5'; ctx.font='600 18px sans-serif';
        ctx.fillText("det(L') = "+f.detv+'  →  신장 트리 '+f.ans+'개', W/2, H*0.90); }
      else if(f.show==='M'){ ctx.textAlign='center'; ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif';
        ctx.fillText("det(L') 계산 중…", W/2, H*0.90); }
    }
  },

  { id:'algo_br_hierholzer', concept:true, branchOf:'algo6_04',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('Hierholzer — 오일러 회로를 실제로 그리기', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('모든 간선을 한 번씩 지나는 회로(존재 조건 만족 시)를 O(E)에 구성', W/2, H*0.10+22);
      // graph with a circuit, show stitching of subtours
      var N={a:[0.30,0.34],b:[0.55,0.30],c:[0.70,0.55],d:[0.50,0.72],e:[0.30,0.60]};
      var edges=[['a','b'],['b','c'],['c','d'],['d','e'],['e','a'],['b','d']];
      function xy(t){ return [W*t[0], H*0.20+t[1]*H*0.56]; }
      edges.forEach(function(e){ var p=xy(N[e[0]]),q=xy(N[e[1]]); ctx.strokeStyle='rgba(122,184,255,0.45)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(p[0],p[1]); ctx.lineTo(q[0],q[1]); ctx.stroke(); });
      Object.keys(N).forEach(function(k){ var p=xy(N[k]); var deg=k==='b'||k==='d'?3:2; // illustrative
        ctx.fillStyle='rgba(122,184,255,0.18)'; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(p[0],p[1],14,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.fillStyle='#dfeefb'; ctx.font='600 12px sans-serif'; ctx.fillText(k.toUpperCase(),p[0],p[1]+4); });
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('조건: (무방향) 모든 정점 차수 짝수 + 연결 → 오일러 회로 존재', W/2, H*0.80);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('한 정점에서 막힐 때까지 따라가며 간선 소비(부분 회로) → 미사용 간선 가진 정점서 새 회로 → 끼워 합침', W/2, H*0.88);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('스택으로 구현(현재경로 push, 막히면 pop해 결과에). 한붓그리기·드브루인 수열·DNA 조립', W/2, H*0.88+20); }
  },

  { id:'algo_br_minmeancycle', concept:true, branchOf:'algo6_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('최소 평균 사이클 — 칸(Karp)의 공식', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('사이클의 (간선 합)/(간선 수)를 최소화하는 사이클을, DP 한 판으로 O(VE)에', W/2, H*0.10+22);
      // cycle illustration
      var N={a:[0.34,0.36,'2'],b:[0.62,0.34,'3'],c:[0.70,0.60,'1'],d:[0.40,0.64,'4']};
      var edges=[['a','b','2'],['b','c','3'],['c','d','1'],['d','a','4']];
      function xy(t){ return [W*t[0], H*0.22+t[1]*H*0.5]; }
      edges.forEach(function(e){ var p=xy(N[e[0]]),q=xy(N[e[1]]); ctx.strokeStyle='#ffb27a'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(p[0],p[1]); ctx.lineTo(q[0],q[1]); ctx.stroke(); ctx.fillStyle='#ffb27a'; ctx.font='12px sans-serif'; ctx.fillText(e[2],(p[0]+q[0])/2,(p[1]+q[1])/2-4); });
      Object.keys(N).forEach(function(k){ var p=xy(N[k]); ctx.fillStyle='rgba(122,184,255,0.18)'; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(p[0],p[1],13,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.fillStyle='#dfeefb'; ctx.font='600 12px sans-serif'; ctx.fillText(k.toUpperCase(),p[0],p[1]+4); });
      ctx.fillStyle='#8fe3b5'; ctx.font='600 13px sans-serif';
      ctx.fillText('이 사이클 평균 = (2+3+1+4)/4 = 2.5', W/2, H*0.74);
      ctx.fillStyle='#dfeefb'; ctx.font='600 14px sans-serif';
      ctx.fillText('칸 공식: λ* = minᵥ maxₖ ( d_n(v) − d_k(v) ) / ( n − k )', W/2, H*0.84);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('d_k(v)=시작점서 정확히 k간선으로 v까지 최단. DP O(VE)로 모든 d_k 채운 뒤 위 공식', W/2, H*0.84+18);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('쓰임: 음수사이클 판정 임계, 분수계획(Dinkelbach) 부품, 스케줄 주기·이익률 사이클', W/2, H*0.84+36); }
  },

  { id:'algo_br_gomoryhu', concept:true, branchOf:'algo6_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('Gomory-Hu 트리 — 모든 쌍 최소컷을 트리 하나로', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('n−1번의 최소컷만 계산해, 임의의 두 정점 최소컷을 트리 경로의 최솟값으로', W/2, H*0.10+22);
      // tree with edge weights
      var N={a:[0.30,0.32,'A'],b:[0.62,0.30,'B'],c:[0.74,0.58,'C'],d:[0.46,0.62,'D'],e:[0.26,0.66,'E']};
      var edges=[['a','b','6'],['b','c','5'],['a','d','4'],['d','e','3']];
      function xy(t){ return [W*t[0], H*0.22+t[1]*H*0.52]; }
      edges.forEach(function(e){ var p=xy(N[e[0]]),q=xy(N[e[1]]); ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(p[0],p[1]); ctx.lineTo(q[0],q[1]); ctx.stroke(); ctx.fillStyle='#ffb27a'; ctx.font='600 12px sans-serif'; ctx.fillText(e[2],(p[0]+q[0])/2+6,(p[1]+q[1])/2); });
      Object.keys(N).forEach(function(k){ var p=xy(N[k]); ctx.fillStyle='rgba(122,184,255,0.18)'; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(p[0],p[1],14,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.fillStyle='#dfeefb'; ctx.font='600 12px sans-serif'; ctx.fillText(N[k][2],p[0],p[1]+4); });
      ctx.fillStyle='#8fe3b5'; ctx.font='600 13px sans-serif';
      ctx.fillText('mincut(C,E) = 경로 C–B–A–D–E 의 최소 간선 = min(5,6,4,3) = 3', W/2, H*0.80);
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('임의 두 정점의 최소컷 = 트리 경로상 가장 가벼운 간선', W/2, H*0.88);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('Gusfield 알고리즘으로 n−1번 max-flow만에 구축. O(n²) 쌍 최소컷을 트리로 압축', W/2, H*0.88+18); }
  },

  { id:'algo_br_dominator', concept:true, branchOf:'algo6_04',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('도미네이터 트리 — 반드시 거쳐야 하는 길목', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('시작점에서 v로 가는 모든 경로가 반드시 지나는 정점(지배자)을 트리로 정리', W/2, H*0.10+22);
      // flow graph + dominator relation
      var N={s:[0.18,0.48,'S'],a:[0.40,0.30,'A'],b:[0.40,0.66,'B'],c:[0.64,0.48,'C'],d:[0.85,0.48,'D']};
      var edges=[['s','a'],['s','b'],['a','c'],['b','c'],['c','d']];
      function xy(t){ return [W*t[0], H*0.24+t[1]*H*0.5]; }
      edges.forEach(function(e){ var p=xy(N[e[0]]),q=xy(N[e[1]]); ctx.strokeStyle='rgba(122,184,255,0.45)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(p[0],p[1]); ctx.lineTo(q[0],q[1]); ctx.stroke();
        var mx=(p[0]+q[0])/2,my=(p[1]+q[1])/2,ang=Math.atan2(q[1]-p[1],q[0]-p[0]); ctx.fillStyle='rgba(122,184,255,0.6)'; ctx.beginPath(); ctx.moveTo(mx,my); ctx.lineTo(mx-8*Math.cos(ang-0.4),my-8*Math.sin(ang-0.4)); ctx.lineTo(mx-8*Math.cos(ang+0.4),my-8*Math.sin(ang+0.4)); ctx.fill(); });
      Object.keys(N).forEach(function(k){ var p=xy(N[k]); var dom=(k==='c'||k==='s'||k==='d');
        ctx.fillStyle=dom?'rgba(255,178,122,0.22)':'rgba(122,184,255,0.16)'; ctx.strokeStyle=dom?'#ffb27a':'#7ab8ff'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(p[0],p[1],14,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.fillStyle='#dfeefb'; ctx.font='600 12px sans-serif'; ctx.fillText(N[k][2],p[0],p[1]+4); });
      ctx.fillStyle='#ffb27a'; ctx.font='12px sans-serif';
      ctx.fillText('D의 지배자: S, C, D — A·B는 둘 중 하나만 거쳐도 되므로 지배자 아님', W/2, H*0.78);
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('idom(v)=v의 직속 지배자 → 도미네이터 트리(부모=가장 가까운 필수 길목)', W/2, H*0.86);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('렌가워-타잔 O(E α). 컴파일러 최적화(SSA·코드 이동)·프로그램 분석의 핵심', W/2, H*0.86+20); }
  },

  { id:'algo_br_lowerboundflow', concept:true, branchOf:'algo6_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('하한 있는 유량 — 간선마다 최소 흘림 강제', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('각 간선 [하한 L, 상한 U] 제약을, 하한을 미리 흘린 뒤 초과/부족을 보조 그래프로', W/2, H*0.10+22);
      ctx.fillStyle='#cfd8e6'; ctx.font='13px sans-serif'; ctx.textAlign='left';
      var lines=['① 각 간선 (u→v, [L,U])에서 하한 L을 "이미 흘렸다" 가정 → 용량 U−L로 축소',
        '② 강제로 흘린 L 때문에 v는 +L 들어옴, u는 −L 나감 → 불균형 발생',
        '③ 초과 정점은 새 소스 S′→정점(용량=초과), 부족 정점은 정점→새 싱크 T′',
        '④ S′→T′ 최대유량이 포화되면 실현 가능 → 원래 흐름 = L + 보조 흐름'];
      lines.forEach(function(t,i){ ctx.fillText(t, W*0.08, H*0.36+i*30); });
      ctx.textAlign='center';
      ctx.fillStyle='#ffb27a'; ctx.font='600 13px sans-serif';
      ctx.fillText('하한 = "반드시 흘려야 하는 양" → 강제 후 남은 자유분만 일반 최대유량', W/2, H*0.76);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('실현가능 흐름 → (s,t 추가) 최대/최소 유량까지. 순환 유량·t→s 무한간선으로 닫기', W/2, H*0.86);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('쓰임: 스케줄(최소 근무시간)·공급망 최소 처리량·행렬 행·열합 맞추기(수송)', W/2, H*0.86+20); }
  },

  { id:'algo_br_steiner', concept:true, branchOf:'algo7_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('스타이너 트리 — 지정 정점들을 최소 비용으로 잇기', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('터미널 k개를 잇는 최소 트리(중간 정점 추가 허용). k 작으면 부분집합 DP로 O(3ᵏ·n)', W/2, H*0.10+22);
      // graph with terminals highlighted and a steiner tree
      var N={a:[0.25,0.32],b:[0.55,0.26],c:[0.78,0.50],d:[0.50,0.55],e:[0.30,0.70],f:[0.66,0.74]};
      var tree=[['a','d'],['b','d'],['d','f'],['c','f']];
      var allE=[['a','d'],['b','d'],['d','f'],['c','f'],['d','e'],['a','e']];
      function xy(t){ return [W*t[0], H*0.22+t[1]*H*0.54]; }
      allE.forEach(function(e){ var p=xy(N[e[0]]),q=xy(N[e[1]]); var on=tree.some(function(t){return t[0]===e[0]&&t[1]===e[1];}); ctx.strokeStyle=on?'#8fe3b5':'rgba(255,255,255,0.15)'; ctx.lineWidth=on?3:1.5; ctx.beginPath(); ctx.moveTo(p[0],p[1]); ctx.lineTo(q[0],q[1]); ctx.stroke(); });
      var terms=['a','b','c'];
      Object.keys(N).forEach(function(k){ var p=xy(N[k]); var term=terms.indexOf(k)>=0;
        ctx.fillStyle=term?'rgba(255,178,122,0.28)':'rgba(122,184,255,0.14)'; ctx.strokeStyle=term?'#ffb27a':'#7ab8ff'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(p[0],p[1],term?14:11,0,Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.fillStyle=term?'#ffb27a':'#8a8893'; ctx.font='600 11px sans-serif'; ctx.fillText(term?'단말':'',p[0],p[1]-20); });
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('주황=단말(반드시 연결), 초록=고른 스타이너 트리(중간점 D·F 활용)', W/2, H*0.84);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('DP: dp[부분집합][정점] = 그 정점에 모인 단말 부분집합 연결 최소비용. 부분집합 병합 + 완화', W/2, H*0.91);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('NP-난해이나 단말 k 작으면 O(3ᵏ·n + 2ᵏ·n log n). MST는 중간점 없는 근사(2배 이내)', W/2, H*0.91+18); }
  },

  { id:'algo_br_waveletmatrix', concept:true, branchOf:'algo2_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('웨이블릿 행렬 — 비트 평면으로 다시 짠 웨이블릿', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('웨이블릿 트리를 "값의 비트 평면 log σ장"으로 펴서, 캐시 효율과 구현을 단순화', W/2, H*0.10+22);
      // bit planes: each row = one bit level, stable partition by that bit
      var planes=[['1 0 1 1 0 0 1','상위비트로 안정 분할'],['0 1 1 0 1 0 0','다음 비트'],['1 0 0 1 0 1 1','하위 비트']];
      var by=H*0.30, cw=30;
      planes.forEach(function(p,r){ var bits=p[0].split(' '); var y=by+r*54;
        ctx.fillStyle=['#7ab8ff','#8fe3b5','#ffb27a'][r]; ctx.font='600 12px sans-serif'; ctx.textAlign='right'; ctx.fillText('비트'+r,W*0.5-(bits.length*cw)/2-10,y+18); ctx.textAlign='center';
        for(var c=0;c<bits.length;c++){ var x=W*0.5-(bits.length*cw)/2+c*cw; var one=bits[c]==='1';
          ctx.fillStyle=one?'rgba(122,184,255,0.3)':'rgba(122,184,255,0.06)'; ctx.strokeStyle='#3a4358'; ctx.lineWidth=1;
          ctx.fillRect(x,y,cw-3,26); ctx.strokeRect(x,y,cw-3,26);
          ctx.fillStyle=one?'#dfeefb':'#4a5568'; ctx.font='600 13px monospace'; ctx.fillText(bits[c],x+(cw-3)/2,y+18); } });
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('각 비트 평면에서 0인 원소를 앞, 1인 원소를 뒤로 안정 분할(zero_count 저장)', W/2, H*0.78);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('웨이블릿 트리와 같은 질의(구간 k번째·등수·빈도) O(log σ)이나, 평면 배열이라 캐시 친화·코드 단순', W/2, H*0.88);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('포인터 없는 비트벡터 log σ개 + rank. 대용량 정적 수열 질의의 실전 표준', W/2, H*0.88+20); }
  },

  { id:'algo_br_persistent', concept:true, branchOf:'algo5_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('영속 자료구조 — 과거 버전을 통째로 보존', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('갱신할 때 바뀌는 경로만 복사(path copying) → 옛 버전 그대로 + 새 버전, 공간 O(log n)/갱신', W/2, H*0.10+22);
      // two roots sharing subtrees
      var old=[W*0.30,H*0.30], neu=[W*0.62,H*0.30];
      function node(x,y,col,t){ ctx.fillStyle=col==='n'?'rgba(255,178,122,0.22)':(col==='s'?'rgba(143,227,181,0.18)':'rgba(122,184,255,0.16)'); ctx.strokeStyle=col==='n'?'#ffb27a':(col==='s'?'#8fe3b5':'#7ab8ff'); ctx.lineWidth=2; ctx.beginPath(); ctx.arc(x,y,13,0,Math.PI*2); ctx.fill(); ctx.stroke(); if(t){ctx.fillStyle='#dfeefb';ctx.font='600 11px sans-serif';ctx.fillText(t,x,y+4);} }
      // shared subtree
      var shL=[W*0.22,H*0.58], shR=[W*0.46,H*0.58], newR=[W*0.74,H*0.58];
      function edge(a,b,col){ ctx.strokeStyle=col||'rgba(255,255,255,0.25)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke(); }
      edge(old,shL); edge(old,shR);
      edge(neu,shL,'#ffb27a'); edge(neu,newR,'#ffb27a'); // new root shares left, new right
      node(old[0],old[1],'o','v1'); node(neu[0],neu[1],'n','v2');
      node(shL[0],shL[1],'s'); node(shR[0],shR[1],'s'); node(newR[0],newR[1],'n');
      ctx.fillStyle='#8fe3b5'; ctx.font='12px sans-serif'; ctx.fillText('공유(복사 안 함)', shL[0]-4, H*0.70);
      ctx.fillStyle='#ffb27a'; ctx.fillText('새로 복사된 경로', newR[0], H*0.70);
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('v1과 v2는 변하지 않은 서브트리를 공유 → 옛 버전 손상 없이 새 버전 생성', W/2, H*0.82);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('영속 세그트리=이 원리로 "과거 구간 질의". 함수형 불변 자료구조의 핵심(경로 복사)', W/2, H*0.90);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('부분 영속(과거 읽기)·완전 영속(과거 갱신)·합류 영속. k번째 구간 질의·롤백·버전 관리', W/2, H*0.90+18); }
  },

  { id:'algo_br_planar', concept:true, branchOf:'algo6_04',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('평면 그래프와 오일러 공식 — V − E + F = 2', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('간선이 안 교차하게 평면에 그릴 수 있는 그래프. 정점·간선·면의 수가 항상 V−E+F=2', W/2, H*0.10+22);
      // planar graph drawing with faces
      var N={a:[0.32,0.32],b:[0.58,0.30],c:[0.66,0.58],d:[0.40,0.66],e:[0.28,0.54]};
      var edges=[['a','b'],['b','c'],['c','d'],['d','e'],['e','a'],['a','c']];
      function xy(t){ return [W*t[0], H*0.22+t[1]*H*0.5]; }
      edges.forEach(function(e){ var p=xy(N[e[0]]),q=xy(N[e[1]]); ctx.strokeStyle='rgba(122,184,255,0.5)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(p[0],p[1]); ctx.lineTo(q[0],q[1]); ctx.stroke(); });
      Object.keys(N).forEach(function(k){ var p=xy(N[k]); ctx.fillStyle='rgba(122,184,255,0.18)'; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(p[0],p[1],12,0,Math.PI*2); ctx.fill(); ctx.stroke(); });
      // face labels
      ctx.fillStyle='#8fe3b5'; ctx.font='600 13px sans-serif'; ctx.fillText('F1', W*0.42, H*0.40); ctx.fillText('F2', W*0.46, H*0.56);
      ctx.fillStyle='#ffb27a'; ctx.fillText('F3 (바깥 면)', W*0.78, H*0.30);
      ctx.fillStyle='#dfeefb'; ctx.font='600 14px sans-serif';
      ctx.fillText('V=5, E=6, F=3  →  5 − 6 + 3 = 2  ✓ (바깥 무한 면 포함)', W/2, H*0.80);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('따름정리: 단순 평면그래프는 E ≤ 3V−6 → 평면그래프는 희소(O(V) 간선)', W/2, H*0.88);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('K₅·K₃,₃는 비평면(쿠라토프스키). 판정 O(V)(호프크로프트-타잔). 4색 정리·외판원 근사', W/2, H*0.88+20); }
  },

  { id:'algo_br_segtree2d', concept:true, branchOf:'algo5_04',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('2D 세그먼트 트리 — 세그트리 안에 세그트리', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('한 축은 세그트리, 그 각 노드가 다른 축의 세그트리 → 직사각형 질의·갱신 O(log²n)', W/2, H*0.10+22);
      // outer segtree (x) nodes, each holding a small inner tree
      var xs=[[0.5,0.28],[0.30,0.46],[0.70,0.46]];
      function xy(t){ return [W*t[0], H*0.22+t[1]*H*0.4]; }
      [[0,1],[0,2]].forEach(function(e){ var a=xy(xs[e[0]]),b=xy(xs[e[1]]); ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke(); });
      xs.forEach(function(t,i){ var p=xy(t);
        ctx.fillStyle=i===0?'rgba(255,178,122,0.16)':'rgba(122,184,255,0.14)'; ctx.strokeStyle=i===0?'#ffb27a':'#7ab8ff'; ctx.lineWidth=2;
        ctx.fillRect(p[0]-44,p[1]-16,88,32); ctx.strokeRect(p[0]-44,p[1]-16,88,32);
        ctx.fillStyle='#dfeefb'; ctx.font='11px sans-serif'; ctx.fillText('x-노드',p[0],p[1]-2);
        ctx.fillStyle='#8fe3b5'; ctx.font='10px sans-serif'; ctx.fillText('→ y-세그트리',p[0],p[1]+12); });
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('질의 [x1..x2]×[y1..y2]: 바깥 x 트리 O(log n) 노드 → 각 노드의 y 트리서 O(log n)', W/2, H*0.74);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('질의·점갱신 O(log² n), 공간 O(n log n). 동적 점·구간 갱신까지(2D 펜윅보다 유연)', W/2, H*0.84);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('정적이면 머지소트트리/오프라인 1D로 더 가볍게. 구간갱신엔 lazy를 양 축에', W/2, H*0.84+20); }
  },

  { id:'algo_br_eertree', concept:true, branchOf:'algo4_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('회문 트리(Eertree) — 모든 회문 부분문자열을 한 트리에', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('문자열의 서로 다른 회문은 최대 n개뿐. 글자를 하나씩 추가하며 O(n)에 모두 보관', W/2, H*0.10+22);
      // two roots (len -1 and 0) + palindrome nodes
      var nodes=[[0.30,0.26,'뿌리 −1'],[0.70,0.26,'뿌리 0'],[0.30,0.50,'a'],[0.70,0.50,'b'],[0.50,0.70,'aba'],[0.80,0.70,'bb']];
      function xy(t){ return [W*t[0], H*0.22+t[1]*H*0.46]; }
      var edges=[[0,2,'a'],[1,3,'b'],[2,4,'a'],[1,5,'b']];
      edges.forEach(function(e){ var a=xy(nodes[e[0]]),b=xy(nodes[e[1]]); ctx.strokeStyle='rgba(122,184,255,0.4)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke(); ctx.fillStyle='#8fe3b5'; ctx.font='11px sans-serif'; ctx.fillText(e[2],(a[0]+b[0])/2+8,(a[1]+b[1])/2); });
      nodes.forEach(function(n,i){ var p=xy(n); var root=i<2;
        ctx.fillStyle=root?'rgba(255,178,122,0.2)':'rgba(122,184,255,0.16)'; ctx.strokeStyle=root?'#ffb27a':'#7ab8ff'; ctx.lineWidth=2;
        var w=n[2].length*8+16; ctx.beginPath(); ctx.arc(p[0],p[1],14,0,Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.fillStyle='#dfeefb'; ctx.font='600 11px sans-serif'; ctx.fillText(n[2],p[0],p[1]+4); });
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('노드 = 서로 다른 회문 하나. 두 뿌리(길이 −1·0)와 접미사 링크(suffix link)', W/2, H*0.78);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('글자 추가 시 현재 최장 회문 접미사를 링크 따라 찾아 양쪽에 그 글자를 붙여 새 회문 생성', W/2, H*0.87);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('서로 다른 회문 수·각 회문 출현 횟수·최장 회문을 O(n)에. 회문 부분문자열 세기의 표준', W/2, H*0.87+20); }
  },

  { id:'algo_br_lyndon', concept:true, branchOf:'algo4_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('Lyndon 분해 — 문자열을 내림차순 최소 조각으로', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('모든 문자열은 "자신이 모든 회전보다 작은" Lyndon 단어들의 내림차순 곱으로 유일하게', W/2, H*0.10+22);
      // string split into lyndon words
      ctx.fillStyle='#dfeefb'; ctx.font='600 15px monospace';
      ctx.fillText('b b a b a a b a', W/2, H*0.32);
      var parts=[['bb','#7ab8ff'],['ab','#8fe3b5'],['aab','#ffb27a'],['a','#9a86ff']];
      var by=H*0.44, x0=W*0.5-(parts.length*90)/2;
      parts.forEach(function(p,i){ var x=x0+i*90;
        ctx.fillStyle=p[1].replace(')',',0.18)').indexOf('rgba')<0?'rgba(122,184,255,0.14)':'rgba(122,184,255,0.14)'; ctx.fillStyle='rgba(122,184,255,0.12)';
        ctx.strokeStyle=p[1]; ctx.lineWidth=2; ctx.fillRect(x,by,80,32); ctx.strokeRect(x,by,80,32);
        ctx.fillStyle=p[1]; ctx.font='600 15px monospace'; ctx.fillText(p[0],x+40,by+21); });
      ctx.fillStyle='#8fe3b5'; ctx.font='600 13px sans-serif';
      ctx.fillText('내림차순: bb ≥ ab ≥ aab ≥ a  (각 조각은 Lyndon 단어)', W/2, H*0.66);
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('Lyndon 단어 = 자신의 모든 진회전(rotation)보다 사전순으로 엄격히 작은 문자열', W/2, H*0.78);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('Duval 알고리즘: 두 포인터로 O(n)·O(1) 공간에 유일 분해. 마지막 조각이 최소 접미사', W/2, H*0.87);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('쓰임: 최소 회전(부스 대안)·최소 접미사·de Bruijn 수열·자유 리 대수 기저', W/2, H*0.87+20); }
  },

  { id:'algo_br_chinesepostman', concept:true, branchOf:'algo6_04',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('중국인 우편배달부 — 모든 간선을 최소 비용으로 돌기', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('모든 간선을 최소 한 번씩 지나 출발점 복귀. 홀수차수 정점들을 짝지어 최소 추가', W/2, H*0.10+22);
      var N={a:[0.30,0.32],b:[0.62,0.30],c:[0.72,0.60],d:[0.44,0.66],e:[0.26,0.58]};
      var edges=[['a','b'],['b','c'],['c','d'],['d','e'],['e','a'],['b','d']];
      function xy(t){ return [W*t[0], H*0.22+t[1]*H*0.5]; }
      edges.forEach(function(e){ var p=xy(N[e[0]]),q=xy(N[e[1]]); var dup=(e[0]==='b'&&e[1]==='d'); ctx.strokeStyle=dup?'#ffb27a':'rgba(122,184,255,0.5)'; ctx.lineWidth=dup?3.5:2; if(dup)ctx.setLineDash([6,4]); ctx.beginPath(); ctx.moveTo(p[0],p[1]); ctx.lineTo(q[0],q[1]); ctx.stroke(); ctx.setLineDash([]); });
      Object.keys(N).forEach(function(k){ var p=xy(N[k]); var odd=(k==='b'||k==='d');
        ctx.fillStyle=odd?'rgba(255,141,141,0.25)':'rgba(122,184,255,0.16)'; ctx.strokeStyle=odd?'#ff8d8d':'#7ab8ff'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(p[0],p[1],14,0,Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.fillStyle='#dfeefb'; ctx.font='600 12px sans-serif'; ctx.fillText(k.toUpperCase(),p[0],p[1]+4); if(odd){ctx.fillStyle='#ff8d8d';ctx.font='10px sans-serif';ctx.fillText('홀수차수',p[0],p[1]-22);} });
      ctx.fillStyle='#ffb27a'; ctx.font='12px sans-serif'; ctx.fillText('주황 점선 = 중복 추가한 간선(B–D)', W/2, H*0.80);
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('홀수차수 정점이 0개면 오일러 회로(추가 0). 있으면 짝지어 최단경로만큼 간선 중복', W/2, H*0.88);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('홀수정점 짝짓기 = 최소 가중 완전매칭(블로섬). 우편배달·제설·드론 순찰 경로 최적화', W/2, H*0.88+20); }
  },

  { id:'algo_br_konig', concept:true, branchOf:'algo6_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('쾨니그 정리 — 최대 매칭 = 최소 정점 덮개', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('이분 그래프에서 짝지은 최대 쌍 수 = 모든 간선을 덮는 최소 정점 수', W/2, H*0.10+22);
      var L=[[0.30,0.32,'a'],[0.30,0.50,'b'],[0.30,0.68,'c']];
      var R=[[0.70,0.32,'x'],[0.70,0.50,'y'],[0.70,0.68,'z']];
      var all=[[0,0],[0,1],[1,1],[2,1],[2,2]]; var match=[[0,0],[1,1],[2,2]];
      all.forEach(function(e){ var a=L[e[0]],b=R[e[1]]; ctx.strokeStyle='rgba(122,184,255,0.3)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(W*a[0],H*a[1]); ctx.lineTo(W*b[0],H*b[1]); ctx.stroke(); });
      match.forEach(function(e){ var a=L[e[0]],b=R[e[1]]; ctx.strokeStyle='#8fe3b5'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(W*a[0],H*a[1]); ctx.lineTo(W*b[0],H*b[1]); ctx.stroke(); });
      function dots(arr,cover){ arr.forEach(function(p,i){ var cov=cover.indexOf(i)>=0; ctx.fillStyle=cov?'rgba(255,178,122,0.3)':'rgba(122,184,255,0.16)'; ctx.strokeStyle=cov?'#ffb27a':'#7ab8ff'; ctx.lineWidth=cov?3:2; ctx.beginPath(); ctx.arc(W*p[0],H*p[1],14,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.fillStyle='#dfeefb'; ctx.font='600 12px sans-serif'; ctx.fillText(p[2],W*p[0],H*p[1]+4); }); }
      dots(L,[0]); dots(R,[1]); // cover = {a, y}
      ctx.fillStyle='#ffb27a'; ctx.font='12px sans-serif'; ctx.fillText('주황=최소 정점 덮개 {a, y} (2개)', W/2, H*0.84);
      ctx.fillStyle='#8fe3b5'; ctx.font='600 13px sans-serif';
      ctx.fillText('최대 매칭 3? 아니 2(a-x, b-y, c-z 중 y가 겹쳐 실제 최대=2) → 덮개도 2, 일치!', W/2, H*0.90);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('덮개 구성: 매칭 후 미매칭 정점서 교대경로 BFS. 최대독립집합 = 전체 − 최소덮개(쾨니그)', W/2, H*0.90+18); }
  },

  { id:'algo_br_shoelace', concept:true, branchOf:'algo2_03',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('신발끈 공식과 Pick 정리 — 다각형의 넓이', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('좌표만으로 다각형 넓이 = ½|Σ(xᵢyᵢ₊₁ − xᵢ₊₁yᵢ)|. 격자점이면 Pick: A = I + B/2 − 1', W/2, H*0.10+22);
      // polygon on a light grid
      var ox=W*0.30, oy=H*0.62, g=30;
      ctx.strokeStyle='rgba(255,255,255,0.08)'; ctx.lineWidth=1;
      for(var i=0;i<=6;i++){ ctx.beginPath(); ctx.moveTo(ox+i*g,oy-6*g); ctx.lineTo(ox+i*g,oy); ctx.stroke(); ctx.beginPath(); ctx.moveTo(ox,oy-i*g); ctx.lineTo(ox+6*g,oy-i*g); ctx.stroke(); }
      var poly=[[0,0],[4,0],[5,3],[2,5],[0,3]];
      ctx.strokeStyle='#7ab8ff'; ctx.fillStyle='rgba(122,184,255,0.12)'; ctx.lineWidth=2.5; ctx.beginPath();
      poly.forEach(function(p,i){ var x=ox+p[0]*g,y=oy-p[1]*g; if(i===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); }); ctx.closePath(); ctx.fill(); ctx.stroke();
      poly.forEach(function(p){ ctx.fillStyle='#ffb27a'; ctx.beginPath(); ctx.arc(ox+p[0]*g,oy-p[1]*g,4,0,Math.PI*2); ctx.fill(); });
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
      ctx.fillText('신발끈: 좌표를 위·아래로 교차 곱', W*0.62, H*0.34);
      ctx.fillText('(끈을 꿰듯) 한 뒤 차의 절반', W*0.62, H*0.41);
      ctx.fillText('Pick: A = I + B/2 − 1', W*0.62, H*0.52);
      ctx.fillText('I=내부 격자점, B=경계 격자점', W*0.62, H*0.59); ctx.textAlign='center';
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('부호 있는 넓이라 시계/반시계 방향까지 알려줌(외적의 합). 볼록·오목 모두 O(n)', W/2, H*0.84);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('Pick은 모든 꼭짓점이 격자점일 때만. 신발끈은 임의 좌표 OK. 삼각분할·무게중심에도', W/2, H*0.84+20); }
  },

  { id:'algo_br_pointinpoly', concept:true, branchOf:'algo2_03',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('점-다각형 포함 판정 — 광선 쏘기(ray casting)', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('점에서 한 방향으로 반직선을 쏴 다각형 변과 교차하는 횟수가 홀수면 내부, 짝수면 외부', W/2, H*0.10+22);
      var poly=[[0.30,0.30],[0.62,0.26],[0.70,0.58],[0.46,0.70],[0.28,0.52]];
      function xy(t){ return [W*t[0], H*0.20+t[1]*H*0.6]; }
      ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2.5; ctx.beginPath();
      poly.forEach(function(p,i){ var c=xy(p); if(i===0)ctx.moveTo(c[0],c[1]); else ctx.lineTo(c[0],c[1]); }); ctx.closePath(); ctx.stroke();
      // inside point + ray
      var pin=xy([0.45,0.45]); ctx.fillStyle='#8fe3b5'; ctx.beginPath(); ctx.arc(pin[0],pin[1],5,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='#8fe3b5'; ctx.lineWidth=1.5; ctx.setLineDash([5,4]); ctx.beginPath(); ctx.moveTo(pin[0],pin[1]); ctx.lineTo(W*0.92,pin[1]); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='#8fe3b5'; ctx.font='12px sans-serif'; ctx.fillText('내부(교차 1회=홀수)', pin[0]+10, pin[1]-10);
      // outside point + ray
      var pout=xy([0.10,0.45]); ctx.fillStyle='#ff8d8d'; ctx.beginPath(); ctx.arc(pout[0],pout[1],5,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='#ff8d8d'; ctx.lineWidth=1.5; ctx.setLineDash([5,4]); ctx.beginPath(); ctx.moveTo(pout[0],pout[1]); ctx.lineTo(W*0.92,pout[1]); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='#ff8d8d'; ctx.font='12px sans-serif'; ctx.fillText('외부(교차 2회=짝수)', pout[0], pout[1]-10);
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('교차 횟수 홀수 ⟺ 내부 (Jordan 곡선 정리). 변마다 광선과 교차 검사 O(n)', W/2, H*0.86);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('경계·꼭짓점 통과는 일관 규칙으로 처리. 볼록이면 모든 변 같은 쪽(CCW부호)으로 O(log n) 가능', W/2, H*0.86+20); }
  },

  { id:'algo_br_sweepline', branchOf:'algo8_03',
    code:[
      'SWEEP(선분들):',
      '  이벤트 ← 모든 끝점을 x순으로 정렬',
      '  active ← ∅      // 현재 스위프선과 만나는 선분',
      '  while 이벤트 남음:',
      '    e ← 다음 이벤트(왼쪽→오른쪽)',
      '    if e == 선분 시작:',
      '      active 에 추가, 위·아래 이웃과 교차 검사',
      '    else (선분 끝):',
      '      active 에서 제거, 위·아래 이웃끼리 교차 검사'
    ],
    build:function(V){
      // segments: {x1,y1,x2,y2}, ensure x1<x2
      var seg=[
        {x1:0.10,y1:0.30,x2:0.55,y2:0.55,id:0},
        {x1:0.18,y1:0.70,x2:0.62,y2:0.35,id:1},
        {x1:0.40,y1:0.20,x2:0.90,y2:0.62,id:2},
        {x1:0.50,y1:0.78,x2:0.88,y2:0.30,id:3}
      ];
      // intersection helper
      function inter(a,b){
        var d=(a.x2-a.x1)*(b.y2-b.y1)-(a.y2-a.y1)*(b.x2-b.x1);
        if(Math.abs(d)<1e-9) return null;
        var t=((b.x1-a.x1)*(b.y2-b.y1)-(b.y1-a.y1)*(b.x2-b.x1))/d;
        var u=((b.x1-a.x1)*(a.y2-a.y1)-(b.y1-a.y1)*(a.x2-a.x1))/d;
        if(t<0||t>1||u<0||u>1) return null;
        return {x:a.x1+t*(a.x2-a.x1), y:a.y1+t*(a.y2-a.y1)}; }
      // build events
      var ev=[];
      for(var i=0;i<seg.length;i++){
        ev.push({x:seg[i].x1,type:'start',seg:seg[i].id});
        ev.push({x:seg[i].x2,type:'end',seg:seg[i].id});
      }
      ev.sort(function(a,b){ return a.x-b.x; });
      function yAt(s,x){ var t=(x-s.x1)/(s.x2-s.x1); return s.y1+t*(s.y2-s.y1); }
      var st=[];
      function snap(line,cap,o){ o=o||{};
        st.push({line:line,cap:cap,seg:seg,sweepx:(o.sweepx==null?-1:o.sweepx),
          active:(o.active||[]).slice(), cur:(o.cur==null?-1:o.cur),
          found:(o.found||[]).map(function(p){return {x:p.x,y:p.y};}),
          checking:o.checking||null}); }
      snap(0,'<b>스위프라인</b>: 세로선을 왼쪽→오른쪽으로 쓸며, 선이 만나는 선분들만 관리해 교차를 찾습니다.',{sweepx:0.05});
      snap([1,2],'모든 선분 끝점을 <b>x좌표 순 이벤트</b>로 정렬합니다. active 집합은 비어 있습니다.',{sweepx:0.05});
      var active=[], found=[];
      for(var k=0;k<ev.length;k++){
        var e=ev[k];
        if(e.type==='start'){
          // neighbors in active sorted by y at this x
          active.push(e.seg);
          active.sort(function(a,b){ return yAt(seg[a],e.x)-yAt(seg[b],e.x); });
          var pos=active.indexOf(e.seg);
          var checks=[];
          if(pos>0) checks.push(active[pos-1]);
          if(pos<active.length-1) checks.push(active[pos+1]);
          snap([5,6],'x='+e.x.toFixed(2)+': 선분 <b>'+e.seg+'</b> 시작 → active 추가. 위·아래 이웃 '+(checks.length?checks.join(','):'없음')+'과 교차 검사.',
            {sweepx:e.x,active:active,cur:e.seg,found:found,checking:checks.length?[e.seg].concat(checks):null});
          for(var c=0;c<checks.length;c++){
            var ip=inter(seg[e.seg],seg[checks[c]]);
            if(ip){ var dup=false; for(var z=0;z<found.length;z++){ if(Math.abs(found[z].x-ip.x)<1e-6&&Math.abs(found[z].y-ip.y)<1e-6) dup=true; }
              if(!dup){ found.push(ip);
                snap([6],'<b>교차 발견!</b> 선분 '+e.seg+' 과 '+checks[c]+' 이 ('+ip.x.toFixed(2)+', '+ip.y.toFixed(2)+')에서 만납니다.',
                  {sweepx:e.x,active:active,cur:e.seg,found:found,checking:[e.seg,checks[c]]}); } }
          }
        } else {
          active.sort(function(a,b){ return yAt(seg[a],e.x)-yAt(seg[b],e.x); });
          var p2=active.indexOf(e.seg);
          var above=(p2>0)?active[p2-1]:-1, below=(p2<active.length-1)?active[p2+1]:-1;
          active.splice(p2,1);
          snap([8],'x='+e.x.toFixed(2)+': 선분 <b>'+e.seg+'</b> 끝 → active 제거. 빈자리의 위·아래 이웃끼리 교차 검사.',
            {sweepx:e.x,active:active,cur:e.seg,found:found,checking:(above>=0&&below>=0)?[above,below]:null});
          if(above>=0&&below>=0){
            var ip2=inter(seg[above],seg[below]);
            if(ip2 && ip2.x>e.x){ var dup2=false; for(var z2=0;z2<found.length;z2++){ if(Math.abs(found[z2].x-ip2.x)<1e-6) dup2=true; }
              if(!dup2){ found.push(ip2);
                snap([8],'<b>교차 발견!</b> 인접해진 '+above+' 과 '+below+' 이 ('+ip2.x.toFixed(2)+', '+ip2.y.toFixed(2)+')에서 만납니다.',
                  {sweepx:e.x,active:active,cur:e.seg,found:found,checking:[above,below]}); } }
          }
        }
      }
      snap(0,'<b>완료!</b> 스위프선이 끝까지 지나며 인접 선분만 비교 — 교차점 <b>'+found.length+'</b>개 검출. 모든 쌍 비교 O(n²) 대신 효율적입니다.',
        {sweepx:0.95,active:[],found:found});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H,S=f.seg;
      function PX(x){ return W*0.08+x*W*0.84; }
      function PY(y){ return H*0.16+y*H*0.66; }
      ctx.textAlign='center'; ctx.fillStyle='#cfd8e6'; ctx.font='600 14px sans-serif';
      ctx.fillText('스위프라인 — 선분 교차 검출', W/2, H*0.085);
      // segments
      for(var i=0;i<S.length;i++){
        var s=S[i];
        var isActive=f.active.indexOf(s.id)>=0;
        var isCur=(s.id===f.cur);
        var isChk=f.checking&&f.checking.indexOf(s.id)>=0;
        var col=isCur?'#ffb27a':isChk?'#f4a0c0':isActive?'#8fe3b5':'#5f6b7e';
        ctx.strokeStyle=col; ctx.lineWidth=isCur?3.2:isActive?2.6:1.8;
        ctx.beginPath(); ctx.moveTo(PX(s.x1),PY(s.y1)); ctx.lineTo(PX(s.x2),PY(s.y2)); ctx.stroke();
        ctx.fillStyle=col; ctx.font='11px monospace'; ctx.textAlign='left';
        ctx.fillText('s'+s.id, PX(s.x1)-2, PY(s.y1)-6);
      }
      // sweep line
      if(f.sweepx>=0){
        var sx=PX(f.sweepx);
        ctx.strokeStyle='rgba(122,184,255,0.9)'; ctx.lineWidth=2; ctx.setLineDash([5,4]);
        ctx.beginPath(); ctx.moveTo(sx,H*0.14); ctx.lineTo(sx,H*0.84); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle='#7ab8ff'; ctx.font='11px sans-serif'; ctx.textAlign='center';
        ctx.fillText('스위프선', sx, H*0.125);
      }
      // intersection points
      for(i=0;i<f.found.length;i++){
        var p=f.found[i];
        ctx.fillStyle='#8fe3b5'; ctx.beginPath(); ctx.arc(PX(p.x),PY(p.y),6,0,7); ctx.fill();
        ctx.strokeStyle='#fff'; ctx.lineWidth=1; ctx.stroke();
      }
      // active set label
      ctx.textAlign='left'; ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif';
      var lbl='active(스위프선과 만나는 선분): '+(f.active.length?f.active.map(function(a){return 's'+a;}).join('  '):'∅');
      ctx.fillText(lbl, W*0.08, H*0.93);
      ctx.fillStyle='#8fe3b5'; ctx.font='12px sans-serif';
      ctx.fillText('초록=active  주황=현재 이벤트  분홍=교차 검사  ● 초록점=교차 발견', W*0.08, H*0.975); }
  },

  { id:'algo_br_welzl', branchOf:'algo8_03',
    code:[
      'MEC(점들):                 // 최소 외접원',
      '  원 ← 비어 있음',
      '  for 각 점 p in 점들:',
      '    if p 가 현재 원 밖에 있으면:',
      '      // p 는 새 원의 경계 위에 있어야 함',
      '      원 ← p 를 포함하도록 다시 계산',
      '  return 원   // 모든 점을 덮는 가장 작은 원'
    ],
    build:function(V){
      var pts=[
        {x:0.30,y:0.30},{x:0.62,y:0.26},{x:0.74,y:0.55},
        {x:0.55,y:0.74},{x:0.26,y:0.62},{x:0.46,y:0.48},{x:0.40,y:0.70}
      ];
      for(var i=0;i<pts.length;i++) pts[i].id=i;
      function d(a,b){ var dx=a.x-b.x,dy=a.y-b.y; return Math.sqrt(dx*dx+dy*dy); }
      function circ2(a,b){ return {cx:(a.x+b.x)/2, cy:(a.y+b.y)/2, r:d(a,b)/2}; }
      function circ3(a,b,c){
        var ax=a.x,ay=a.y,bx=b.x,by=b.y,cx=c.x,cy=c.y;
        var dd=2*(ax*(by-cy)+bx*(cy-ay)+cx*(ay-by));
        if(Math.abs(dd)<1e-12) return circ2(a,c);
        var ux=((ax*ax+ay*ay)*(by-cy)+(bx*bx+by*by)*(cy-ay)+(cx*cx+cy*cy)*(ay-by))/dd;
        var uy=((ax*ax+ay*ay)*(cx-bx)+(bx*bx+by*by)*(ax-cx)+(cx*cx+cy*cy)*(bx-ax))/dd;
        return {cx:ux,cy:uy,r:Math.sqrt((ax-ux)*(ax-ux)+(ay-uy)*(ay-uy))}; }
      function inCirc(c,p){ if(!c) return false; return d({x:c.cx,y:c.cy},p)<=c.r+1e-9; }
      function mecBoundary(idx){
        // minimal enclosing circle of points idx (small) by brute boundary
        var P=idx.map(function(j){return pts[j];});
        if(P.length===1) return {cx:P[0].x,cy:P[0].y,r:0};
        var best=null;
        for(var a=0;a<P.length;a++)for(var b=a+1;b<P.length;b++){
          var c2=circ2(P[a],P[b]); var ok=true;
          for(var m=0;m<P.length;m++){ if(!inCirc(c2,P[m])){ok=false;break;} }
          if(ok&&(!best||c2.r<best.r)) best=c2; }
        for(a=0;a<P.length;a++)for(b=a+1;b<P.length;b++)for(var cc=b+1;cc<P.length;cc++){
          var c3=circ3(P[a],P[b],P[cc]); if(!c3) continue; var ok3=true;
          for(m=0;m<P.length;m++){ if(!inCirc(c3,P[m])){ok3=false;break;} }
          if(ok3&&(!best||c3.r<best.r)) best=c3; }
        return best; }
      var st=[];
      function snap(line,cap,circle,cur,inset){
        st.push({line:line,cap:cap,pts:pts,
          circle:circle?{cx:circle.cx,cy:circle.cy,r:circle.r}:null,
          cur:(cur==null?-1:cur), inset:(inset||[]).slice()}); }
      snap(0,'<b>최소 외접원(MEC)</b>: 주어진 모든 점을 덮는 <b>가장 작은 원</b>을 점진적으로 찾습니다.',null,-1,[]);
      snap([1],'원을 <b>비워둔 채</b> 시작합니다. 점을 하나씩 넣으며 필요할 때만 원을 키웁니다.',null,-1,[]);
      var circle=null, inset=[];
      // seed with first two points
      inset.push(0); inset.push(1); circle=mecBoundary(inset);
      snap([2,5],'처음 두 점 0·1 을 지름으로 하는 작은 원으로 <b>씨앗 원</b>을 만듭니다.',circle,1,inset);
      for(i=2;i<pts.length;i++){
        if(circle && inCirc(circle,pts[i])){
          inset.push(i);
          snap([2,3],'점 '+i+' 은 현재 원 <b>안</b>에 있습니다 → 원을 바꿀 필요 없이 그대로 둡니다.',circle,i,inset);
        } else {
          inset.push(i);
          circle=mecBoundary(inset);
          snap([3,4,5],'점 '+i+' 이 원 <b>밖</b>! → 0~'+i+' 번째 점을 모두 덮도록 원을 <b>다시 계산</b>합니다. 새 점은 경계 위에 놓입니다.',circle,i,inset);
        }
      }
      snap([3,6],'마지막 점까지 모두 원 안에 들어왔는지 확인합니다 — 밖에 남은 점이 없으면 답이 확정됩니다.',circle,-1,inset);
      snap(6,'<b>완료!</b> 모든 점을 덮는 최소 외접원 — 반지름 <b>'+circle.r.toFixed(3)+'</b>. 각 점은 한 번만 처리해 평균 <b>O(n)</b>(Welzl).',circle,-1,inset);
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H,P=f.pts;
      function PX(x){ return W*0.12+x*W*0.72; }
      function PY(y){ return H*0.16+y*H*0.70; }
      var sc=Math.min(W*0.72,H*0.70);
      ctx.textAlign='center'; ctx.fillStyle='#cfd8e6'; ctx.font='600 14px sans-serif';
      ctx.fillText('최소 외접원 — 점진적 확장 (Welzl)', W/2, H*0.085);
      // circle
      if(f.circle){
        var cx=PX(f.circle.cx), cy=PY(f.circle.cy), r=f.circle.r*sc;
        ctx.fillStyle='rgba(122,184,255,0.08)'; ctx.beginPath(); ctx.arc(cx,cy,r,0,7); ctx.fill();
        var done=(f.cur<0&&f.inset.length===P.length);
        ctx.strokeStyle=done?'#8fe3b5':'#7ab8ff'; ctx.lineWidth=2.4; ctx.beginPath(); ctx.arc(cx,cy,r,0,7); ctx.stroke();
        ctx.fillStyle=done?'#8fe3b5':'#7ab8ff'; ctx.beginPath(); ctx.arc(cx,cy,2.5,0,7); ctx.fill();
      }
      // points
      for(var i=0;i<P.length;i++){
        var px=PX(P[i].x), py=PY(P[i].y);
        var processed=f.inset.indexOf(i)>=0;
        var isCur=(i===f.cur);
        var col=isCur?'#ffb27a':processed?'#8fe3b5':'#5f6b7e';
        ctx.fillStyle=col; ctx.beginPath(); ctx.arc(px,py,isCur?7:5.5,0,7); ctx.fill();
        if(isCur){ ctx.strokeStyle='#ffb27a'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(px,py,11,0,7); ctx.stroke(); }
        ctx.fillStyle='#9b99a3'; ctx.font='10px monospace'; ctx.textBaseline='middle';
        ctx.fillText(''+i, px, py-13); ctx.textBaseline='alphabetic';
      }
      ctx.textAlign='left'; ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif';
      if(f.circle) ctx.fillText('현재 반지름 r = '+f.circle.r.toFixed(3), W*0.12, H*0.95);
      ctx.fillText('주황=처리 중인 점  초록=원에 포함된 점  파랑/초록 원=현재 외접원', W*0.12, H*0.985); }
  },

  { id:'algo_br_wht', branchOf:'algo8_03',
    code:[
      'WHT(a, n):                 // n=2^m, 제자리',
      '  for len = 1; len < n; len <<= 1:',
      '    for i = 0; i < n; i += len<<1:',
      '      for j = i; j < i+len; j++:',
      '        x = a[j];  y = a[j+len]',
      '        a[j]     = x + y      // 버터플라이',
      '        a[j+len] = x - y      //   (단위근 없음!)',
      '  return a',
      '// XOR 합성곱:  C = WHT^-1( WHT(A)·WHT(B) )'
    ],
    build:function(V){
      var a=[1,2,3,4], n=4, st=[];
      function snap(line,cap,arr,extra){ var f={line:line,cap:cap,arr:arr.slice(),n:n}; if(extra)for(var k in extra)f[k]=extra[k]; st.push(f); }
      var arr=a.slice();
      snap(0,'벡터 a=[1,2,3,4] (n=4). WHT는 <b>XOR 군의 푸리에 변환</b> — 버터플라이가 단순 <b>(a,b)→(a+b, a−b)</b>입니다.',arr,{stage:'start',pair:null,len:0});
      var len=1, stageNo=1;
      while(len<n){
        snap(1,'<b>'+stageNo+'단계 (len='+len+'):</b> 거리 '+len+' 떨어진 짝을 결합합니다.',arr,{stage:'stage',pair:null,len:len});
        for(var i=0;i<n;i+=len<<1){
          for(var j=i;j<i+len;j++){
            var x=arr[j], y=arr[j+len];
            arr[j]=x+y; arr[j+len]=x-y;
            snap([4,5,6],'쌍 (a['+j+']='+x+', a['+(j+len)+']='+y+') → a['+j+']=<b>'+(x+y)+'</b>, a['+(j+len)+']=<b>'+(x-y)+'</b>. (덧셈·뺄셈뿐, 곱셈근 없음)',arr,{stage:'bfly',pair:[j,j+len],len:len});
          }
        }
        len<<=1; stageNo++;
      }
      snap(7,'<b>완료!</b> WHT(a)=[10,−2,−4,0]. 같은 변환을 두 벡터에 한 뒤 <b>점별 곱</b>, 다시 역WHT(÷n)하면 <b>XOR 합성곱</b>이 나옵니다. 전부 ±합 → 정수면 오차 0.',arr,{stage:'done',pair:null,len:0});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H, arr=f.arr, n=f.n;
      ctx.textAlign='center'; ctx.textBaseline='alphabetic';
      ctx.fillStyle='#cfd8e6'; ctx.font='600 15px sans-serif';
      ctx.fillText('월시-아다마르: (a,b) → (a+b, a−b) 버터플라이 (±1 기저)', W/2, H*0.085);
      // 셀 좌표
      var bw=Math.min(76,(W*0.74)/n-12), gap=14, totalW=n*bw+(n-1)*gap, x0=W/2-totalW/2, cy=H*0.50;
      function cellX(i){ return x0+i*(bw+gap); }
      // 버터플라이 연결선
      if(f.pair){ var a0=cellX(f.pair[0])+bw/2, b0=cellX(f.pair[1])+bw/2;
        ctx.strokeStyle='rgba(255,178,122,0.6)'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(a0,cy-bw/2-10); ctx.bezierCurveTo(a0,cy-bw/2-44,b0,cy-bw/2-44,b0,cy-bw/2-10); ctx.stroke();
        ctx.fillStyle='#ffb27a'; ctx.font='12px sans-serif'; ctx.textAlign='center';
        ctx.fillText('a+b , a−b', (a0+b0)/2, cy-bw/2-50); }
      else if(f.len>0){ // show all pairs at this stage faintly
        for(var i=0;i<n;i+=f.len<<1){ for(var j=i;j<i+f.len;j++){
          var aa=cellX(j)+bw/2, bb=cellX(j+f.len)+bw/2;
          ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1.5;
          ctx.beginPath(); ctx.moveTo(aa,cy-bw/2-8); ctx.bezierCurveTo(aa,cy-bw/2-36,bb,cy-bw/2-36,bb,cy-bw/2-8); ctx.stroke();
        } } }
      // 셀
      for(var k=0;k<n;k++){ var x=cellX(k);
        var hot=f.pair&&f.pair.indexOf(k)>=0, done=(f.stage==='done');
        var col=hot?{f:'rgba(255,178,122,0.28)',s:'#ffb27a',t:'#ffb27a'}:done?{f:'rgba(143,227,181,0.2)',s:'#8fe3b5',t:'#8fe3b5'}:{f:'rgba(122,184,255,0.12)',s:'#7ab8ff',t:'#dfeefb'};
        ctx.fillStyle=col.f; ctx.strokeStyle=col.s; ctx.lineWidth=hot?2.4:1.6;
        if(ctx.roundRect){ctx.beginPath(); ctx.roundRect(x,cy-bw/2,bw,bw,9); ctx.fill(); ctx.stroke();} else {ctx.fillRect(x,cy-bw/2,bw,bw); ctx.strokeRect(x,cy-bw/2,bw,bw);}
        ctx.fillStyle=col.t; ctx.font='600 20px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(''+arr[k], x+bw/2, cy); ctx.textBaseline='alphabetic';
        ctx.fillStyle='#6f6e7a'; ctx.font='11px monospace'; ctx.fillText('a['+k+']', x+bw/2, cy+bw/2+16);
        // 이진 인덱스 (XOR 군 강조)
        ctx.fillStyle='#56555f'; ctx.font='10px monospace'; ctx.fillText('('+k.toString(2).padStart(2,'0')+')', x+bw/2, cy+bw/2+30);
      }
      // XOR 합성곱 안내
      ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif'; ctx.textAlign='center';
      ctx.fillText('인덱스를 XOR로 결합:  c[k] = Σ_{ i⊕j=k } a[i]·b[j]', W/2, H*0.80);
      var badge=f.stage==='start'?'준비':f.stage==='stage'?'단계 시작':f.stage==='bfly'?'버터플라이':'완료';
      ctx.fillStyle=(f.stage==='done')?'#8fe3b5':'#ffb27a'; ctx.font='600 13px sans-serif';
      ctx.fillText('▶ '+badge, W/2, H*0.93); }
  },

  { id:'algo_br_legendre', concept:true, branchOf:'algo2_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('르장드르·야코비 기호 — 제곱수인지 빠르게 판정', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('a가 소수 p로 나눈 제곱(이차잉여)인지를 (a|p)=±1로. 상호법칙으로 gcd처럼 빠르게', W/2, H*0.10+22);
      ctx.fillStyle='#dfeefb'; ctx.font='600 15px sans-serif';
      ctx.fillText('르장드르 기호 (a|p):', W/2, H*0.30);
      ctx.fillStyle='#cfd8e6'; ctx.font='13px sans-serif'; ctx.textAlign='left';
      var lines=['= +1  →  a는 이차잉여 (x²≡a mod p 해 있음)',
        '= −1  →  이차비잉여 (해 없음)',
        '=  0  →  p | a',
        '오일러 판정: (a|p) ≡ a^((p−1)/2)  (mod p)'];
      lines.forEach(function(t,i){ ctx.fillText(t, W*0.22, H*0.40+i*26); });
      ctx.textAlign='center';
      ctx.fillStyle='#ffb27a'; ctx.font='600 13px sans-serif';
      ctx.fillText('이차 상호법칙: (p|q)(q|p) = (−1)^((p−1)/2·(q−1)/2)', W/2, H*0.74);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('야코비 기호는 합성수 분모로 확장(상호법칙으로 인수분해 없이 gcd처럼 O(log) 계산)', W/2, H*0.84);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('쓰임: 토넬리-샹크스 전 제곱 가능성 판정, 솔로베이-스트라센 소수판정, 암호', W/2, H*0.84+20); }
  },

  { id:'algo_br_contfrac', concept:true, branchOf:'algo4_02',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('연분수 — 실수를 정수 계단으로 펼치기', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('수를 [a₀; a₁, a₂, …]로. 유클리드 호제법의 몫이 곧 연분수 항, 근사분수는 최적 유리근사', W/2, H*0.10+22);
      ctx.fillStyle='#dfeefb'; ctx.font='600 16px sans-serif';
      ctx.fillText('415 / 93  =  [4; 2, 6, 7]', W/2, H*0.32);
      ctx.fillStyle='#cfd8e6'; ctx.font='15px sans-serif';
      ctx.fillText('= 4 + 1/(2 + 1/(6 + 1/7))', W/2, H*0.44);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif'; ctx.textAlign='left';
      ctx.fillText('항 aᵢ = 유클리드 호제법의 i번째 몫', W*0.24, H*0.56);
      ctx.fillText('근사분수 pᵢ/qᵢ: p=a·p₋₁+p₋₂ (q도 동형)', W*0.24, H*0.63); ctx.textAlign='center';
      ctx.fillStyle='#ffb27a'; ctx.font='600 14px sans-serif';
      ctx.fillText('근사분수는 분모 한정 "최선" 유리근사 (|x − p/q| < 1/q²)', W/2, H*0.76);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('√n은 주기적 연분수 → 펠 방정식 x²−n y²=1 해. 황금비=[1;1,1,…]가 가장 느린 근사', W/2, H*0.86);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('쓰임: 최선 유리근사(기어비·달력), 펠 방정식, Stern-Brocot 경로, 격자기약', W/2, H*0.86+20); }
  },

  { id:'algo_br_simpson', branchOf:'algo8_05',
    code:[
      'SIMPSON(f, a, b, N):            // N=짝수 구간',
      '  h ← (b − a) / N',
      '  sum ← f(a) + f(b)',
      '  for k in 1..N−1:',
      '    w ← (k 홀수) ? 4 : 2        // 가중치 4,2,4,2,...',
      '    sum ← sum + w · f(a + k·h)',
      '  return (h/3) · sum            // 포물선 합',
      '  // 오차 O(h⁴), 3차까지 정확'
    ],
    build:function(V){
      // f(x) = 0.5*x^2 - 2*x + 4 on [0,4]; ∫ = (x^3/6 - x^2 + 4x) | 0..4
      function f(x){ return 0.5*x*x - 2*x + 4; }
      var a=0,b=4,N=4, h=(b-a)/N;
      var trueI = (Math.pow(4,3)/6 - 4*4 + 4*4) - 0; // = 64/6 - 16 + 16 = 10.6667
      var xs=[],ys=[]; for(var k=0;k<=N;k++){ xs.push(a+k*h); ys.push(f(a+k*h)); }
      var w=[1,4,2,4,1];
      var st=[];
      function snap(line,cap,extra){ var f2={line:line,cap:cap,xs:xs,ys:ys,a:a,b:b,N:N,h:h,trueI:trueI,w:w}; if(extra)for(var kk in extra)f2[kk]=extra[kk]; st.push(f2); }
      snap([0,1],'∫f(x)dx 를 [0,4]에서 근사. 구간 수 <b>N=4</b>(짝수)로 쪼갭니다.',{sum:null,kdone:-1,parab:0});
      snap(1,'간격 <b>h = (b−a)/N = (4−0)/4 = 1</b>. 표본점 x=0,1,2,3,4 — 총 5개를 찍습니다.',{sum:null,kdone:-1,parab:0});
      snap(2,'양 끝 가중치 <b>1</b>: sum = f(0)+f(4) = '+ys[0].toFixed(2)+'+'+ys[4].toFixed(2)+' = '+(ys[0]+ys[4]).toFixed(2)+'.',{sum:ys[0]+ys[4],kdone:0,parab:0,hiEnds:true});
      var sum=ys[0]+ys[4];
      for(var kk=1;kk<=N-1;kk++){
        var wt=(kk%2===1)?4:2;
        sum+=wt*ys[kk];
        snap([3,4,5],'k='+kk+' ('+(kk%2===1?'홀수':'짝수')+') → 가중치 <b>'+wt+'</b>. sum += '+wt+'·f('+xs[kk]+')='+wt+'·'+ys[kk].toFixed(2)+'. 누적 sum='+sum.toFixed(2)+'.',{sum:sum,kdone:kk,parab:Math.ceil(kk/2),hiK:kk,wt:wt});
      }
      var est=(h/3)*sum;
      snap(6,'<b>적분값 = (h/3)·sum = (1/3)·'+sum.toFixed(2)+' = '+est.toFixed(4)+'</b>.',{sum:sum,kdone:N,parab:N/2,est:est});
      // trapezoid baseline for comparison (same 5 points): h*(y0/2+y1+y2+y3+y4/2)
      var trap=h*(ys[0]/2+ys[1]+ys[2]+ys[3]+ys[4]/2);
      snap(7,'사다리꼴(직선 연결)이면 같은 점으로 '+trap.toFixed(4)+'. 심슨은 <b>포물선</b>(곡률 반영)이라 '+est.toFixed(4)+' — 곡선 아래를 더 잘 채웁니다.',{sum:sum,kdone:N,parab:N/2,est:est,trap:trap});
      snap(7,'참값 ∫ = <b>'+trueI.toFixed(4)+'</b>. 심슨 오차 '+(Math.abs(est-trueI)).toFixed(4)+' (이 2차함수는 정확!). <b>3차까지 정확</b>, 합성오차 O(h⁴)로 사다리꼴 O(h²)보다 우수합니다.',{sum:sum,kdone:N,parab:N/2,est:est,trap:trap,done:true});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H,XS=f.xs,YS=f.ys;
      ctx.textBaseline='alphabetic';
      var x0=W*0.13,x1=W*0.92,yb=H*0.78,yt=H*0.16;
      var xmin=-0.3,xmax=4.3,ymin=0,ymax=5;
      function SX(x){ return x0+(x1-x0)*(x-xmin)/(xmax-xmin); }
      function SY(y){ return yb-(yb-yt)*(y-ymin)/(ymax-ymin); }
      function fx(x){ return 0.5*x*x-2*x+4; }
      // axes
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(SX(0),yt); ctx.lineTo(SX(0),yb); ctx.lineTo(SX(4.2),yb); ctx.stroke();
      ctx.fillStyle='#6f6e7a'; ctx.font='10px sans-serif'; ctx.textAlign='center';
      for(var gx=0;gx<=4;gx++){ ctx.fillText(gx,SX(gx),yb+15); }
      // parabolic fill segments (each pair of subintervals = 1 parabola through 3 pts)
      // parabola through (x0,y0),(x1,y1),(x2,y2)
      function quad(p0,p1,p2,x){
        var x0_=p0[0],x1_=p1[0],x2_=p2[0],y0_=p0[1],y1_=p1[1],y2_=p2[1];
        var L0=((x-x1_)*(x-x2_))/((x0_-x1_)*(x0_-x2_));
        var L1=((x-x0_)*(x-x2_))/((x1_-x0_)*(x1_-x2_));
        var L2=((x-x0_)*(x-x1_))/((x2_-x0_)*(x2_-x1_));
        return y0_*L0+y1_*L1+y2_*L2;
      }
      var npar=f.parab;
      for(var s=0;s<npar;s++){
        var i0=2*s,i1=2*s+1,i2=2*s+2;
        if(i2>=XS.length) break;
        var p0=[XS[i0],YS[i0]],p1=[XS[i1],YS[i1]],p2=[XS[i2],YS[i2]];
        ctx.fillStyle='rgba(255,178,122,0.18)'; ctx.beginPath();
        ctx.moveTo(SX(XS[i0]),SY(0));
        for(var t=0;t<=24;t++){ var xx=XS[i0]+(XS[i2]-XS[i0])*t/24; ctx.lineTo(SX(xx),SY(quad(p0,p1,p2,xx))); }
        ctx.lineTo(SX(XS[i2]),SY(0)); ctx.closePath(); ctx.fill();
        // parabola outline
        ctx.strokeStyle='#ffb27a'; ctx.lineWidth=2; ctx.beginPath();
        for(t=0;t<=24;t++){ var xx2=XS[i0]+(XS[i2]-XS[i0])*t/24; var yy2=SY(quad(p0,p1,p2,xx2)); if(t===0)ctx.moveTo(SX(xx2),yy2); else ctx.lineTo(SX(xx2),yy2); }
        ctx.stroke();
      }
      // true f(x) curve (green)
      ctx.strokeStyle='#8fe3b5'; ctx.lineWidth=2.4; ctx.beginPath();
      for(var c=0;c<=100;c++){ var cx=0+4*c/100; var px=SX(cx), py=SY(fx(cx)); if(c===0)ctx.moveTo(px,py); else ctx.lineTo(px,py); }
      ctx.stroke();
      // sample points + weights
      for(var k=0;k<XS.length;k++){ var dx=SX(XS[k]),dy=SY(YS[k]);
        var counted=(f.kdone>=k)||(f.hiEnds&&(k===0||k===XS.length-1));
        var hi=(f.hiK===k);
        ctx.fillStyle=hi?'#f4a0c0':counted?'#8fe3b5':'#7ab8ff'; ctx.strokeStyle='#dfeefb'; ctx.lineWidth=1.4;
        ctx.beginPath(); ctx.arc(dx,dy,hi?7:5,0,7); ctx.fill(); ctx.stroke();
        // weight label
        ctx.fillStyle=hi?'#f4a0c0':counted?'#8fe3b5':'#9b99a3'; ctx.font='600 11px sans-serif'; ctx.textAlign='center';
        ctx.fillText('w'+f.w[k], dx, dy-12);
        // stem
        ctx.strokeStyle='rgba(122,184,255,0.25)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(dx,dy); ctx.lineTo(dx,SY(0)); ctx.stroke();
      }
      // status
      ctx.textAlign='left'; ctx.font='600 13px sans-serif';
      ctx.fillStyle='#dfeefb';
      if(f.sum!=null) ctx.fillText('sum = '+f.sum.toFixed(2), x0, yt+8);
      if(f.est!=null){ ctx.fillStyle='#ffb27a'; ctx.fillText('근사 ∫ = (h/3)·sum = '+f.est.toFixed(4), x0, yb+34); }
      if(f.done){ ctx.fillStyle='#8fe3b5'; ctx.fillText('참값 = '+f.trueI.toFixed(4)+'  ·  오차 '+Math.abs(f.est-f.trueI).toFixed(4)+'  (O(h⁴))', x0, yb+54); }
      // legend
      ctx.textAlign='right'; ctx.font='11px sans-serif'; ctx.fillStyle='#8fe3b5'; ctx.fillText('초록=f(x)  주황=포물선 근사', x1, yt+8);
    }
  },

  { id:'algo_br_kasai', concept:true, branchOf:'algo4_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('Kasai 알고리즘 — LCP 배열을 O(n)에', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('접미사 배열에서 "사전순 이웃 접미사들의 최장 공통 접두사"를 선형 시간에', W/2, H*0.10+22);
      // suffix array + LCP table for "banana"
      var rows=[['5','a','—'],['3','ana','0'],['1','anana','3'],['0','banana','0'],['4','na','0'],['2','nana','2']];
      var bx=W*0.26, by=H*0.30, rh=30;
      ctx.font='12px sans-serif'; ctx.fillStyle='#6a6873';
      ctx.fillText('SA', bx+20, by-8); ctx.fillText('접미사', bx+120, by-8); ctx.fillText('LCP', bx+250, by-8);
      rows.forEach(function(r,i){ var y=by+i*rh;
        ctx.fillStyle='rgba(122,184,255,0.08)'; ctx.fillRect(bx,y,300,rh-3); ctx.strokeStyle='#3a4358'; ctx.lineWidth=1; ctx.strokeRect(bx,y,300,rh-3);
        ctx.fillStyle='#dfeefb'; ctx.font='12px monospace'; ctx.textAlign='left'; ctx.fillText(r[0],bx+12,y+19); ctx.fillText(r[1],bx+100,y+19);
        ctx.fillStyle=r[2]==='—'?'#6a6873':'#ffb27a'; ctx.font='600 13px sans-serif'; ctx.fillText(r[2],bx+255,y+19); ctx.textAlign='center'; });
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('LCP[i] = SA에서 i번째와 (i−1)번째 접미사의 공통 접두사 길이', W/2, H*0.80);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('핵심: 원문 위치 순으로 보면 LCP가 한 번에 1만 줄어듦 → 포인터 안 되돌리고 O(n)', W/2, H*0.88);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('LCP+SA로 서로 다른 부분문자열 수·최장 반복·두 문자열 LCS. RMQ 얹으면 임의 두 접미사 LCP', W/2, H*0.88+20); }
  },

  { id:'algo_br_binarylifting', concept:true, branchOf:'algo5_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('이진 점프(binary lifting) — 2의 거듭제곱 조상 점프', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('각 정점의 2^j번째 조상을 미리 저장 → k번째 조상·LCA를 O(log n)에', W/2, H*0.10+22);
      // chain with jump arcs of length 1,2,4
      var n=8, bx=W*0.12, y=H*0.50, gap=(W*0.76)/(n-1);
      for(var i=0;i<n;i++){ var x=bx+i*gap; ctx.fillStyle='rgba(122,184,255,0.18)'; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(x,y,12,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.fillStyle='#dfeefb'; ctx.font='600 11px sans-serif'; ctx.fillText(i,x,y+4);
        if(i<n-1){ ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(x+12,y); ctx.lineTo(x+gap-12,y); ctx.stroke(); } }
      // jump arcs from node 7
      function arc(from,len,col){ var x1=bx+from*gap, x2=bx+(from-len)*gap; ctx.strokeStyle=col; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(x1,y-12); ctx.quadraticCurveTo((x1+x2)/2,y-12-len*8,x2,y-12); ctx.stroke(); ctx.fillStyle=col; ctx.font='11px sans-serif'; ctx.fillText('2^'+Math.log2(len),(x1+x2)/2,y-18-len*8); }
      arc(7,1,'#8fe3b5'); arc(7,2,'#ffb27a'); arc(7,4,'#9a86ff');
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('up[v][j] = up[ up[v][j−1] ][j−1]  (2^j 조상 = 2^(j−1) 두 번)', W/2, H*0.74);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('k번째 조상: k를 이진수로 보고 켜진 비트마다 그만큼 점프. LCA: 깊이 맞춘 뒤 함께 점프', W/2, H*0.84);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('전처리 O(n log n)·질의 O(log n). 트리 LCA·경로 질의·함수 반복(functional graph)에', W/2, H*0.84+20); }
  },

  { id:'algo_br_dsuontree', concept:true, branchOf:'algo5_03',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('DSU on tree — 작은 것을 큰 것에 합치기', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('각 서브트리의 통계(색깔 빈도 등)를, 큰 자식 것을 유지하고 작은 자식만 더해 O(n log n)에', W/2, H*0.10+22);
      // tree with heavy(big) child kept, light children merged
      var N={r:[0.5,0.26],a:[0.30,0.50],b:[0.70,0.50],a1:[0.18,0.74],a2:[0.40,0.74],b1:[0.60,0.74],b2:[0.82,0.74]};
      var edges=[['r','a'],['r','b'],['a','a1'],['a','a2'],['b','b1'],['b','b2']];
      function xy(t){ return [W*0.1+N[t][0]*W*0.8, H*0.24+N[t][1]*H*0.5]; }
      edges.forEach(function(e){ var p=xy(N[e[0]]?e[0]:e[0]),q=e[1]; var a=xy(e[0]),b=xy(e[1]); var heavy=(e[0]==='r'&&e[1]==='b'); ctx.strokeStyle=heavy?'#ffb27a':'rgba(122,184,255,0.4)'; ctx.lineWidth=heavy?3.5:2; ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke(); });
      Object.keys(N).forEach(function(k){ var p=xy(k); ctx.fillStyle='rgba(122,184,255,0.16)'; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(p[0],p[1],12,0,Math.PI*2); ctx.fill(); ctx.stroke(); });
      ctx.fillStyle='#ffb27a'; ctx.font='12px sans-serif'; ctx.fillText('굵은 간선 = heavy(큰 자식): 통계 유지', W/2, H*0.86);
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('큰(heavy) 자식의 통계는 지우지 않고 물려받고, 작은 자식들만 다시 더한다', W/2, H*0.92);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('각 정점은 자기보다 큰 조상 경로로만 재추가됨 → 총 O(n log n). 서브트리 색깔 최빈·distinct 수', W/2, H*0.92+18); }
  },

  { id:'algo_br_xortrie', concept:true, branchOf:'algo2_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('0/1 트라이 — 최대 XOR 짝을 비트로 탐욕', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('수들을 비트(상위→하위)로 트라이에 넣고, 질의 수와 "반대 비트"로 내려가 최대 XOR을', W/2, H*0.10+22);
      // binary trie
      var nodes=[[0.5,0.26,''],[0.35,0.44,'0'],[0.65,0.44,'1'],[0.27,0.62,'0'],[0.43,0.62,'1'],[0.57,0.62,'0'],[0.73,0.62,'1']];
      function xy(t){ return [W*0.1+t[0]*W*0.8, H*0.22+t[1]*H*0.5]; }
      var edges=[[0,1,'0'],[0,2,'1'],[1,3,'0'],[1,4,'1'],[2,5,'0'],[2,6,'1']];
      edges.forEach(function(e){ var a=xy(nodes[e[0]]),b=xy(nodes[e[1]]); var path=(e[0]===0&&e[1]===2)||(e[0]===2&&e[1]===5); ctx.strokeStyle=path?'#ffb27a':'rgba(122,184,255,0.4)'; ctx.lineWidth=path?3:1.8; ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke(); ctx.fillStyle=path?'#ffb27a':'#8a8893'; ctx.font='11px sans-serif'; ctx.fillText(e[2],(a[0]+b[0])/2+8,(a[1]+b[1])/2); });
      nodes.forEach(function(n,i){ var p=xy(n); ctx.fillStyle='rgba(122,184,255,0.16)'; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(p[0],p[1],10,0,Math.PI*2); ctx.fill(); ctx.stroke(); });
      ctx.fillStyle='#ffb27a'; ctx.font='12px sans-serif';
      ctx.fillText('질의 비트가 0이면 1쪽으로(있으면) → 그 비트 XOR=1 (주황 경로)', W/2, H*0.80);
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('상위 비트부터 "반대 비트 자식"이 있으면 그쪽으로 → 최대 XOR 탐욕적 선택', W/2, H*0.88);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('삽입·질의 O(비트수). 최대 XOR 쌍·구간 XOR(영속 트라이)·XOR 조건 카운트. XOR기저와 짝', W/2, H*0.88+20); }
  },

  { id:'algo_br_brokenprofile', concept:true, branchOf:'algo7_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('윤곽선 DP — 격자를 칸 단위로 채우는 비트마스크', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('도미노/타일로 격자 채우기를, "지금까지 채운 경계(윤곽선) 모양"을 비트마스크 상태로', W/2, H*0.10+22);
      // grid partially filled, profile boundary highlighted
      var R=4,C=5, gx=W*0.32, gy=H*0.30, cell=42;
      for(var r=0;r<R;r++)for(var c=0;c<C;c++){ var x=gx+c*cell,y=gy+r*cell;
        var filled=(r*C+c) < 9; // first 9 cells filled (row-major)
        ctx.fillStyle=filled?'rgba(122,184,255,0.28)':'rgba(122,184,255,0.05)'; ctx.strokeStyle='#3a4358'; ctx.lineWidth=1; ctx.fillRect(x,y,cell-3,cell-3); ctx.strokeRect(x,y,cell-3,cell-3); }
      // profile boundary (staircase) at cell 9
      ctx.strokeStyle='#ffb27a'; ctx.lineWidth=3;
      ctx.beginPath(); ctx.moveTo(gx,gy+2*cell); ctx.lineTo(gx+4*cell,gy+2*cell); ctx.lineTo(gx+4*cell,gy+1*cell); ctx.lineTo(gx+C*cell-3,gy+1*cell); ctx.stroke();
      ctx.fillStyle='#ffb27a'; ctx.font='12px sans-serif'; ctx.fillText('윤곽선(profile) = 비트마스크', gx+2*cell, gy+R*cell+18);
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('상태 = 현재 칸 + 윤곽선 m비트(위·왼쪽 채움 여부). 칸마다 빈칸/가로/세로 타일 전이', W/2, H*0.80);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('한 칸씩 진행하므로 마스크 폭이 열 수 C → 상태 O(nm·2^C), 좁은 쪽을 C로(min(행,열))', W/2, H*0.88);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('도미노·타일링 경우의 수, 격자 독립집합, 좁은 그리드 최적화. 행 전체 마스크보다 칸 단위가 효율', W/2, H*0.88+20); }
  },

  { id:'algo_br_expdp', concept:true, branchOf:'algo7_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('기댓값 DP — 확률 점화식으로 평균을 구하기', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('E[상태] = Σ 확률·(비용 + E[다음 상태]). 무작위 과정의 기대 횟수/비용을 DP로', W/2, H*0.10+22);
      // states with transition probabilities
      var states=[[0.5,0.32,'E[n]'],[0.30,0.58,'E[n−1]'],[0.70,0.58,'E[n−2]']];
      function xy(t){ return [W*t[0], H*0.22+t[1]*H*0.4]; }
      [[0,1,'p'],[0,2,'1−p']].forEach(function(e){ var a=xy(states[e[0]]),b=xy(states[e[1]]); ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke(); ctx.fillStyle='#8fe3b5'; ctx.font='12px sans-serif'; ctx.fillText(e[2],(a[0]+b[0])/2,(a[1]+b[1])/2-4); });
      states.forEach(function(st,i){ var p=xy(st); ctx.fillStyle='rgba(122,184,255,0.16)'; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2; ctx.fillRect(p[0]-34,p[1]-16,68,32); ctx.strokeRect(p[0]-34,p[1]-16,68,32); ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif'; ctx.fillText(st[2],p[0],p[1]+4); });
      ctx.fillStyle='#ffb27a'; ctx.font='600 14px sans-serif';
      ctx.fillText('E[n] = 1 + p·E[n−1] + (1−p)·E[n−2]', W/2, H*0.72);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('선형성 E[X+Y]=E[X]+E[Y]로 분해. 자기참조(루프)면 연립방정식(가우스 소거)으로 풀기', W/2, H*0.82);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('쓰임: 주사위 게임 기대 턴, 랜덤워크 도달시간, 쿠폰 수집가, 카드 뽑기 기대값', W/2, H*0.82+20);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('★뒤에서 앞으로(역방향) 또는 흡수상태부터. 무한 가능성은 등비급수로 닫힌 형태', W/2, H*0.82+38); }
  },

  { id:'algo_br_boundedknapsack', concept:true, branchOf:'algo7_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('다중 배낭 — 개수 제한 물건을 빠르게', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('각 물건이 k개까지일 때, k개를 하나씩 넣으면 느림 → 이진 분할 또는 단조 덱으로 가속', W/2, H*0.10+22);
      // binary split visualization: 13 -> 1,2,4,6
      ctx.fillStyle='#dfeefb'; ctx.font='600 14px sans-serif';
      ctx.fillText('이진 분할: 개수 13개 →  1 + 2 + 4 + 6  묶음', W/2, H*0.32);
      var chunks=[1,2,4,6]; var bw=70, bx=W*0.5-(chunks.length*bw)/2, by=H*0.40;
      chunks.forEach(function(c,i){ var x=bx+i*bw; ctx.fillStyle='rgba(122,184,255,0.16)'; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2; ctx.fillRect(x,by,bw-12,34); ctx.strokeRect(x,by,bw-12,34); ctx.fillStyle='#dfeefb'; ctx.font='600 14px sans-serif'; ctx.fillText('×'+c,x+(bw-12)/2,by+22); });
      ctx.fillStyle='#8fe3b5'; ctx.font='600 13px sans-serif';
      ctx.fillText('이 묶음들로 0~13 어떤 개수든 부분합으로 표현 가능 → 0/1 배낭으로 환원', W/2, H*0.62);
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('이진 분할: 개수 k를 1,2,4,…,나머지 묶음으로 → O(N·W·Σlog kᵢ)', W/2, H*0.76);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('더 빠른 단조 덱: 무게로 나눈 나머지류(residue)별 슬라이딩 윈도우 최대 → O(N·W)', W/2, H*0.85);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('완전 배낭(무제한)=정방향 1차원, 0/1=역방향. 다중=이 둘 사이, 동전·자원 배분', W/2, H*0.85+20); }
  },

  { id:'algo_br_edmondskarp', concept:true, branchOf:'algo6_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('에드몬즈-카프 — BFS로 최단 증대 경로', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('포드-풀커슨의 증대 경로를 BFS(최단)로 고르면 종료가 보장되고 O(V·E²)', W/2, H*0.10+22);
      // flow network s->t with augmenting path
      var N={s:[0.14,0.50,'s'],a:[0.40,0.30,'a'],b:[0.40,0.70,'b'],c:[0.66,0.30,'c'],t:[0.88,0.50,'t']};
      var edges=[['s','a'],['s','b'],['a','c'],['b','c'],['c','t'],['b','t']];
      function xy(t){ return [W*N[t][0], H*0.22+N[t][1]*H*0.5]; }
      edges.forEach(function(e){ var p=xy(e[0]),q=xy(e[1]); var path=(['s','a','c','t'].indexOf(e[0])>=0 && ['a','c','t'].indexOf(e[1])>=0 && !(e[0]==='b')); ctx.strokeStyle=path?'#8fe3b5':'rgba(122,184,255,0.4)'; ctx.lineWidth=path?3.5:2; ctx.beginPath(); ctx.moveTo(p[0],p[1]); ctx.lineTo(q[0],q[1]); ctx.stroke();
        var mx=(p[0]+q[0])/2,my=(p[1]+q[1])/2,ang=Math.atan2(q[1]-p[1],q[0]-p[0]); ctx.fillStyle=path?'#8fe3b5':'rgba(122,184,255,0.5)'; ctx.beginPath(); ctx.moveTo(mx,my); ctx.lineTo(mx-9*Math.cos(ang-0.4),my-9*Math.sin(ang-0.4)); ctx.lineTo(mx-9*Math.cos(ang+0.4),my-9*Math.sin(ang+0.4)); ctx.fill(); });
      Object.keys(N).forEach(function(k){ var p=xy(k); var st=(k==='s'||k==='t'); ctx.fillStyle=st?'rgba(255,178,122,0.22)':'rgba(122,184,255,0.16)'; ctx.strokeStyle=st?'#ffb27a':'#7ab8ff'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(p[0],p[1],14,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif'; ctx.fillText(N[k][2],p[0],p[1]+4); });
      ctx.fillStyle='#8fe3b5'; ctx.font='12px sans-serif'; ctx.fillText('초록 = BFS가 찾은 최단 증대 경로 s→a→c→t', W/2, H*0.80);
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('잔여 그래프에서 BFS로 최단 경로 찾아 병목만큼 흘리기를 반복(증대 경로법)', W/2, H*0.88);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('최단 경로라 증대 횟수 O(VE) 보장 → O(VE²). 디닉(레벨그래프+블로킹)이 더 빠른 발전형', W/2, H*0.88+20); }
  },

  { id:'algo_br_linearsieve', concept:true, branchOf:'algo2_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('선형 체 — 각 합성수를 딱 한 번만 지우기', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('에라토스테네스 체는 합성수를 여러 번 지움. 선형 체는 "최소 소인수"로 한 번만 → O(n)', W/2, H*0.10+22);
      // numbers 2..16 colored, with smallest prime factor
      var nums=[2,3,4,5,6,7,8,9,10,11,12,13,14,15,16];
      var spf={4:2,6:2,8:2,9:3,10:2,12:2,14:2,15:3,16:2};
      var bx=W*0.5-(nums.length*42)/2, by=H*0.34, cw=38;
      nums.forEach(function(v,i){ var x=bx+i*42; var prime=!(v in spf);
        ctx.fillStyle=prime?'rgba(143,227,181,0.25)':'rgba(122,184,255,0.12)'; ctx.strokeStyle=prime?'#8fe3b5':'#7ab8ff'; ctx.lineWidth=prime?2.5:1.5;
        ctx.fillRect(x,by,cw,34); ctx.strokeRect(x,by,cw,34);
        ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif'; ctx.fillText(v,x+cw/2,by+18);
        if(!prime){ ctx.fillStyle='#ffb27a'; ctx.font='9px sans-serif'; ctx.fillText('spf'+spf[v],x+cw/2,by+30); } });
      ctx.fillStyle='#8fe3b5'; ctx.font='12px sans-serif'; ctx.fillText('초록=소수, spf=최소 소인수', W/2, by+50);
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('각 i를, "이미 찾은 소수 p ≤ spf(i)"와 곱한 i·p만 지움 → 각 합성수는 정확히 한 번', W/2, H*0.78);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('p가 i를 나누면 멈춤(i·p의 최소 소인수가 p임을 보장). 전체 O(n), 부산물로 spf·오일러피·뫼비우스', W/2, H*0.88);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('에라토스테네스 O(n log log n)보다 점근 우월(상수는 비슷). 곱셈적 함수 일괄 계산에 유용', W/2, H*0.88+20); }
  },

  { id:'algo_br_lazyprop', concept:true, branchOf:'algo5_04',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('Lazy propagation — 구간 갱신을 미뤄서 O(log n)', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('"구간 전체에 더하기"를 잎마다 하면 O(n). 노드에 "미룬 갱신" 표시를 달아 필요할 때만 내림', W/2, H*0.10+22);
      // segment tree with a lazy tag on a node
      var nodes=[[0.5,0.28,'합 +레이지'],[0.30,0.52,'레이지 +5'],[0.70,0.52,''],[0.18,0.74,''],[0.42,0.74,'']];
      function xy(t){ return [W*0.12+t[0]*W*0.76, H*0.24+t[1]*H*0.46]; }
      var edges=[[0,1],[0,2],[1,3],[1,4]];
      edges.forEach(function(e){ var a=xy(nodes[e[0]]),b=xy(nodes[e[1]]); ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke(); });
      nodes.forEach(function(n,i){ var p=xy(n); var lazy=(i===1);
        ctx.fillStyle=lazy?'rgba(255,178,122,0.22)':'rgba(122,184,255,0.16)'; ctx.strokeStyle=lazy?'#ffb27a':'#7ab8ff'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.arc(p[0],p[1],16,0,Math.PI*2); ctx.fill(); ctx.stroke();
        if(n[2]){ ctx.fillStyle=lazy?'#ffb27a':'#dfeefb'; ctx.font='10px sans-serif'; ctx.fillText(n[2],p[0],p[1]+3); } });
      ctx.fillStyle='#ffb27a'; ctx.font='12px sans-serif'; ctx.fillText('이 노드 구간 전체에 +5를 "미뤄둠"', xy(nodes[1])[0], xy(nodes[1])[1]+34);
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('구간 갱신: 완전히 덮인 노드에 lazy 태그만 달고 멈춤(자식엔 안 내려감)', W/2, H*0.80);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('내려갈 일이 생기면 그때 push-down: 태그를 두 자식에 전파하고 자기 태그 비움', W/2, H*0.88);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('구간 더하기/덮기 + 구간 합/최댓값을 모두 O(log n). 태그 합성 규칙이 핵심(더하기·할당 순서)', W/2, H*0.88+20); }
  },

  { id:'algo_br_dilworth', concept:true, branchOf:'algo6_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('딜워스 정리 — 최소 사슬 분할 = 최대 반사슬', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('부분순서를 덮는 최소 사슬(비교 가능한 줄) 수 = 가장 큰 반사슬(서로 비교 불가) 크기', W/2, H*0.10+22);
      // poset as DAG with chains colored
      var N={a:[0.30,0.30,'#7ab8ff'],b:[0.55,0.30,'#8fe3b5'],c:[0.30,0.55,'#7ab8ff'],d:[0.55,0.55,'#8fe3b5'],e:[0.42,0.78,'#7ab8ff']};
      var edges=[['a','c'],['c','e'],['b','d']];
      function xy(t){ return [W*N[t][0], H*0.22+N[t][1]*H*0.5]; }
      edges.forEach(function(e){ var p=xy(e[0]),q=xy(e[1]); ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(p[0],p[1]); ctx.lineTo(q[0],q[1]); ctx.stroke(); });
      Object.keys(N).forEach(function(k){ var p=xy(k); ctx.fillStyle=N[k][2].replace('#','rgba(')+''; ctx.fillStyle='rgba(122,184,255,0.16)'; ctx.strokeStyle=N[k][2]; ctx.lineWidth=2.5; ctx.beginPath(); ctx.arc(p[0],p[1],14,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.fillStyle='#dfeefb'; ctx.font='600 12px sans-serif'; ctx.fillText(k.toUpperCase(),p[0],p[1]+4); });
      ctx.fillStyle='#7ab8ff'; ctx.font='12px sans-serif'; ctx.fillText('사슬1: a→c→e', W*0.20, H*0.88); ctx.fillStyle='#8fe3b5'; ctx.fillText('사슬2: b→d', W*0.55, H*0.88);
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('최소 2개 사슬로 덮음 = 최대 반사슬 크기 2 (예: {a,b} 서로 비교불가)', W/2, H*0.78);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('최소 사슬 분할 = n − (이분 매칭 최대). DAG 최소 경로 덮개·LIS와 쌍대(Mirsky)', W/2, H*0.78+18); }
  },

  { id:'algo_br_modinverse', concept:true, branchOf:'algo2_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('모듈러 역원 — 나눗셈을 곱셈으로 바꾸기', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('mod 세계엔 나눗셈이 없다 → a로 나누기 = a의 역원 a⁻¹(a·a⁻¹≡1) 곱하기', W/2, H*0.10+22);
      ctx.fillStyle='#dfeefb'; ctx.font='600 15px sans-serif';
      ctx.fillText('a · a⁻¹ ≡ 1 (mod m)   를 만족하는 a⁻¹', W/2, H*0.30);
      ctx.fillStyle='#cfd8e6'; ctx.font='13px sans-serif'; ctx.textAlign='left';
      var lines=['① m이 소수: 페르마 소정리 → a⁻¹ = a^(m−2) mod m (빠른 거듭제곱)',
        '② 일반 m(gcd(a,m)=1): 확장 유클리드로 a·x + m·y = 1 의 x',
        '③ 1..n 일괄: inv[i] = −(m/i)·inv[m mod i] mod m  → O(n)',
        '④ 역원 없음: gcd(a,m) ≠ 1 이면 a⁻¹ 부재'];
      lines.forEach(function(t,i){ ctx.fillText(t, W*0.10, H*0.42+i*26); });
      ctx.textAlign='center';
      ctx.fillStyle='#ffb27a'; ctx.font='600 13px sans-serif';
      ctx.fillText('예: 3⁻¹ mod 7 = 5  (3·5=15≡1)', W/2, H*0.78);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('쓰임: 이항계수 mod 소수(팩토리얼 역원 미리계산), 분수의 모듈러 값, CRT, 해시', W/2, H*0.86);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('역원이 존재할 조건 = a와 m이 서로소. 그래서 보통 m을 소수로 잡음(998244353 등)', W/2, H*0.86+20); }
  },

  { id:'algo_br_permcycle', branchOf:'algo3_05',
    code:[
      'for i = 0 .. n-1:',
      '  if not vis[i]:                 // 새 사이클 시작',
      '    j ← i;  len ← 0',
      '    while not vis[j]:            // 화살표 따라가기',
      '      vis[j] ← true',
      '      j ← p[j];  len++           // i → p[i] → …',
      '    cycles.push(len)             // 한 고리 닫힘',
      '  // 최소 교환 = n − (사이클 수)'
    ],
    build:function(V){
      var p=[2,3,4,1,0,6,5], n=p.length; // 사이클 (0 2 4)(1 3)(5 6)
      var vis=[]; for(var t=0;t<n;t++) vis[t]=false;
      var cycOf=[]; for(t=0;t<n;t++) cycOf[t]=-1;
      var st=[], cycles=[], cidx=0;
      function snap(line,cap,o){ o=o||{};
        st.push({line:line,cap:cap,p:p,n:n,vis:vis.slice(),cycOf:cycOf.slice(),
          i:(o.i==null?-1:o.i), j:(o.j==null?-1:o.j),
          curCyc:(o.curCyc==null?-1:o.curCyc), nCyc:cycles.length,
          cycles:cycles.slice(), mode:o.mode||''}); }
      snap([0],'순열 <b>p = ['+p.join(', ')+']</b> 를 함수 <b>i → p[i]</b> 로 봅니다. 화살표를 따라가 서로소 사이클로 분해합니다.',{mode:'start'});
      for(var i=0;i<n;i++){
        if(!vis[i]){
          var j=i, len=0;
          snap([1,2],'i='+i+' 는 아직 방문 안 됨 → <b>새 사이클 '+(cidx+1)+'</b> 시작. j='+i+'.',{i:i,j:i,curCyc:cidx,mode:'newcyc'});
          while(!vis[j]){
            vis[j]=true; cycOf[j]=cidx;
            var nx=p[j];
            snap([4,5],'정점 '+j+' 방문 표시 → 화살표 따라 <b>'+j+' → p['+j+']='+nx+'</b>. 사이클 길이 '+(len+1)+'.',{i:i,j:nx,curCyc:cidx,mode:'follow'});
            j=nx; len++;
          }
          cycles.push(len);
          // build cycle node list for caption
          var members=[]; for(var m=0;m<n;m++) if(cycOf[m]===cidx) members.push(m);
          snap([6],'j='+j+' 가 이미 방문됨 → 출발점으로 돌아옴, <b>사이클 ('+members.join(' ')+') 닫힘</b> (길이 '+len+').',{i:i,curCyc:cidx,mode:'close'});
          cidx++;
        }
      }
      var swaps=n-cycles.length;
      snap([7],'<b>완료!</b> 사이클 <b>'+cycles.length+'개</b> (길이 '+cycles.join(', ')+'). 정렬 최소 교환 = n − 사이클수 = '+n+' − '+cycles.length+' = <b>'+swaps+'</b>.',{mode:'done'});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H,p=f.p,n=f.n;
      ctx.textAlign='center'; ctx.fillStyle='#cfd8e6'; ctx.font='600 15px sans-serif';
      ctx.fillText('순열 사이클 분해 — i → p[i] 화살표 따라 도는 고리', W/2, H*0.09);
      var CYCCOL=['#7ab8ff','#ffb27a','#8fe3b5','#f4a0c0','#c9a8ff'];
      // nodes on a circle
      var cx=W/2, cy=H*0.50, R=Math.min(W*0.32,H*0.32);
      var pos=[];
      for(var i=0;i<n;i++){ var ang=-Math.PI/2 + 2*Math.PI*i/n;
        pos.push([cx+R*Math.cos(ang), cy+R*Math.sin(ang)]); }
      // draw arrows i -> p[i]
      for(i=0;i<n;i++){
        var a=pos[i], b=pos[p[i]];
        var c=f.cycOf[i];
        var visited=f.vis[i];
        var isActive=(i===f.j && f.mode==='follow');
        var col;
        if(c>=0 && visited){ col=CYCCOL[c%CYCCOL.length]; }
        else { col='rgba(255,255,255,0.16)'; }
        var lw=isActive?3.5:(visited?2.2:1.2);
        // curved-ish: straight with arrowhead, offset slightly for self
        if(i===p[i]){ // self loop
          ctx.strokeStyle=col; ctx.lineWidth=lw; ctx.beginPath();
          ctx.arc(a[0],a[1]-26,12,0.2,Math.PI*2-0.2); ctx.stroke();
        } else {
          var dx=b[0]-a[0], dy=b[1]-a[1], d=Math.hypot(dx,dy)||1;
          var ux=dx/d, uy=dy/d, r1=22, r2=22;
          var sx=a[0]+ux*r1, sy=a[1]+uy*r1, ex=b[0]-ux*r2, ey=b[1]-uy*r2;
          ctx.strokeStyle=col; ctx.lineWidth=lw; ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(ex,ey); ctx.stroke();
          // arrowhead
          var ah=9, ang2=Math.atan2(ey-sy,ex-sx);
          ctx.fillStyle=col; ctx.beginPath();
          ctx.moveTo(ex,ey);
          ctx.lineTo(ex-ah*Math.cos(ang2-0.4), ey-ah*Math.sin(ang2-0.4));
          ctx.lineTo(ex-ah*Math.cos(ang2+0.4), ey-ah*Math.sin(ang2+0.4));
          ctx.closePath(); ctx.fill();
        }
      }
      // draw nodes
      for(i=0;i<n;i++){ var pt=pos[i], c2=f.cycOf[i];
        var isCur=(i===f.j && (f.mode==='follow'||f.mode==='newcyc'));
        var col=(c2>=0)?CYCCOL[c2%CYCCOL.length]:'#5b6b80';
        var fill=(c2>=0)?'rgba(255,255,255,0.06)':'rgba(122,184,255,0.08)';
        if(isCur){ ctx.save(); ctx.shadowColor=col; ctx.shadowBlur=16; }
        ctx.fillStyle=isCur?'rgba(255,178,122,0.28)':fill; ctx.strokeStyle=isCur?'#ffb27a':col; ctx.lineWidth=isCur?3:2.2;
        ctx.beginPath(); ctx.arc(pt[0],pt[1],20,0,7); ctx.fill(); ctx.stroke();
        if(isCur) ctx.restore();
        ctx.fillStyle=isCur?'#ffb27a':(c2>=0?col:'#dfeefb'); ctx.font='600 16px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(i, pt[0], pt[1]); ctx.textBaseline='alphabetic';
      }
      // p array display
      ctx.fillStyle='#9b99a3'; ctx.font='12px monospace'; ctx.textAlign='left';
      var ax0=W*0.10, ay=H*0.90;
      ctx.fillText('i :', ax0, ay-20);
      ctx.fillText('p[i]:', ax0, ay);
      var aw=Math.min(38,(W*0.72)/n);
      for(i=0;i<n;i++){ var bx=ax0+50+i*aw;
        var c3=f.cycOf[i], col=(c3>=0)?CYCCOL[c3%CYCCOL.length]:'#7f8a9b';
        ctx.fillStyle='#7f8a9b'; ctx.textAlign='center'; ctx.fillText(i, bx, ay-20);
        ctx.fillStyle=col; ctx.font='600 14px monospace'; ctx.fillText(p[i], bx, ay); ctx.font='12px monospace';
      }
      // cycle count badge
      ctx.textAlign='center'; ctx.fillStyle=(f.mode==='done')?'#8fe3b5':'#ffb27a'; ctx.font='600 14px sans-serif';
      var cyctxt=f.cycles.length? ('사이클 '+f.nCyc+'개 (길이 '+f.cycles.join(', ')+')') : '사이클 0개';
      ctx.fillText(cyctxt, W*0.5, H*0.965); }
  },

  { id:'algo_br_montgomery', concept:true, branchOf:'algo2_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('몽고메리 곱셈 — 나눗셈 없는 빠른 모듈러 곱', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('a·b mod m 을 느린 나눗셈(%) 없이, 2의 거듭제곱 R로의 시프트·곱셈만으로', W/2, H*0.10+22);
      ctx.fillStyle='#cfd8e6'; ctx.font='13px sans-serif'; ctx.textAlign='left';
      var lines=['느린 부분: 모듈러 곱마다 나눗셈 % m (CPU에서 비쌈)',
        '몽고메리 영역: 수 x를 x·R mod m 로 표현 (R=2^k, m과 서로소)',
        'REDUCE(t): t·R⁻¹ mod m 을 시프트+곱셈만으로 (나눗셈 없음)',
        '곱셈: REDUCE( ā · b̄ ) 가 (a·b)의 몽고메리 표현'];
      lines.forEach(function(t,i){ ctx.fillText(t, W*0.10, H*0.34+i*28); });
      ctx.textAlign='center';
      ctx.fillStyle='#ffb27a'; ctx.font='600 13px sans-serif';
      ctx.fillText('나눗셈 한 번 → R로 나누기(=비트 시프트)로 대체 → 모듈러 곱이 훨씬 빠름', W/2, H*0.76);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('영역 변환 비용은 1회뿐 → 같은 m으로 곱을 많이 할 때(거듭제곱·NTT·소수판정) 이득', W/2, H*0.86);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('사촌 바레트(Barrett) reduction은 1/m 근사 미리 계산. 밀러라빈·폴라드로 가속에 핵심', W/2, H*0.86+20); }
  },

  { id:'algo_br_kshortest', concept:true, branchOf:'algo6_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('k번째 최단 경로 — 1등 말고 K등까지', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('최단 1개가 아니라 짧은 순서로 K개. 우선순위 큐로 도착 횟수를 세는 일반화 다익스트라', W/2, H*0.10+22);
      // graph with multiple s-t paths of different lengths
      var N={s:[0.14,0.5,'s'],a:[0.40,0.30,'a'],b:[0.40,0.70,'b'],t:[0.86,0.5,'t']};
      var edges=[['s','a','2'],['s','b','3'],['a','t','4'],['b','t','2'],['a','b','1']];
      function xy(t){ return [W*N[t][0], H*0.22+N[t][1]*H*0.5]; }
      edges.forEach(function(e){ var p=xy(e[0]),q=xy(e[1]); ctx.strokeStyle='rgba(122,184,255,0.5)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(p[0],p[1]); ctx.lineTo(q[0],q[1]); ctx.stroke(); ctx.fillStyle='#ffb27a'; ctx.font='12px sans-serif'; ctx.fillText(e[2],(p[0]+q[0])/2,(p[1]+q[1])/2-4); });
      Object.keys(N).forEach(function(k){ var p=xy(k); var st=(k==='s'||k==='t'); ctx.fillStyle=st?'rgba(255,178,122,0.22)':'rgba(122,184,255,0.16)'; ctx.strokeStyle=st?'#ffb27a':'#7ab8ff'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(p[0],p[1],14,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif'; ctx.fillText(N[k][2],p[0],p[1]+4); });
      ctx.fillStyle='#8fe3b5'; ctx.font='600 13px sans-serif';
      ctx.fillText('s→t 경로: s-b-t=5, s-a-t=6, s-a-b-t=5 … 짧은 순 K개', W/2, H*0.80);
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('단순법: 다익스트라 변형 — 정점에 K번 도착할 때까지 큐에서 꺼냄(cnt[v]<K)', W/2, H*0.88);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('단순경로 한정이면 Yen 알고리즘(분기마다 최단 재계산). 경로 다양화·대안 경로·k-best', W/2, H*0.88+20); }
  },

  { id:'algo_br_transclosure', concept:true, branchOf:'algo6_04',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('추이 폐쇄 — 도달 가능성을 모두 채우기', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('"u에서 v로 (여러 단계 거쳐) 갈 수 있나?"를 모든 쌍에 대해. 플로이드형 DP 또는 비트셋', W/2, H*0.10+22);
      // reachability matrix
      var V=4, gx=W*0.34, gy=H*0.30, cell=42;
      var reach=[[1,1,1,1],[0,1,1,1],[0,0,1,1],[0,0,0,1]];
      ctx.font='12px sans-serif';
      for(var c=0;c<V;c++){ ctx.fillStyle='#6a6873'; ctx.fillText(String.fromCharCode(65+c),gx+c*cell+cell/2,gy-8); }
      for(var r=0;r<V;r++){ ctx.fillStyle='#6a6873'; ctx.textAlign='right'; ctx.fillText(String.fromCharCode(65+r),gx-8,gy+r*cell+cell/2); ctx.textAlign='center';
        for(var c=0;c<V;c++){ var x=gx+c*cell,y=gy+r*cell; var on=reach[r][c];
          ctx.fillStyle=on?'rgba(143,227,181,0.25)':'rgba(122,184,255,0.06)'; ctx.strokeStyle=on?'#8fe3b5':'#3a4358'; ctx.lineWidth=on?2:1;
          ctx.fillRect(x,y,cell-4,cell-4); ctx.strokeRect(x,y,cell-4,cell-4);
          ctx.fillStyle=on?'#8fe3b5':'#4a5568'; ctx.font='600 14px sans-serif'; ctx.fillText(on?'1':'0',x+(cell-4)/2,y+(cell-4)/2+5); } }
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('reach[i][j] |= reach[i][k] & reach[k][j]  (플로이드-워셜형, k 중간정점)', W/2, H*0.80);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('O(V³). 각 행을 비트셋으로: reach[i] |= reach[k] (if reach[i][k]) → O(V³/64)', W/2, H*0.88);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('DAG면 위상역순 DP. 쓰임: 도달성·부분순서 완성·관계 닫기·타입 추론·스케줄 의존성', W/2, H*0.88+20); }
  },

  { id:'algo_br_cdq', branchOf:'algo8_03',
    code:[
      'CDQ(lo, hi):              // 역순 쌍 세기 예',
      '  if lo == hi: return',
      '  mid ← (lo+hi)/2',
      '  CDQ(lo, mid)            // 왼쪽 풀기',
      '  CDQ(mid+1, hi)          // 오른쪽 풀기',
      '  // 교차 기여: 왼쪽 i 가 오른쪽 j 에 주는 영향',
      '  for j in 오른쪽: count += (j 보다 큰 왼쪽 수)'
    ],
    build:function(V){
      var A=[5,2,6,1], st=[];
      function snap(line,cap,o){ o=o||{}; st.push({line:line,cap:cap,A:A.slice(),
        lo:(o.lo==null?-1:o.lo),hi:(o.hi==null?-1:o.hi),mid:(o.mid==null?-1:o.mid),
        cross:o.cross||null,count:o.count||0,phase:o.phase||'',depth:o.depth||0}); }
      var count=0;
      snap([0],'배열 [5,2,6,1] 에서 <b>역순 쌍</b>(왼쪽이 더 큰 쌍)을 셉니다. 분할정복으로 교차 쌍만 모읍니다.',{lo:0,hi:3});
      function CDQ(lo,hi,depth){
        if(lo===hi){ snap([1],'구간 ['+lo+'] 크기 1 → 더 나눌 게 없습니다.',{lo:lo,hi:hi,depth:depth}); return; }
        var mid=Math.floor((lo+hi)/2);
        snap([2],'['+lo+'..'+hi+'] 을 mid='+mid+' 에서 <b>둘로 분할</b>합니다.',{lo:lo,hi:hi,mid:mid,depth:depth});
        CDQ(lo,mid,depth+1);
        CDQ(mid+1,hi,depth+1);
        // cross
        var pairs=[];
        for(var j=mid+1;j<=hi;j++){
          for(var i=lo;i<=mid;i++){ if(A[i]>A[j]){ pairs.push([i,j]); count++; } }
        }
        snap([5,6],'<b>교차 기여</b>: 왼쪽['+lo+'..'+mid+'] 과 오른쪽['+(mid+1)+'..'+hi+'] 사이 역순 쌍 '+pairs.length+'개 발견. 누적='+count+'.',
          {lo:lo,hi:hi,mid:mid,cross:pairs,count:count,depth:depth,phase:'cross'});
      }
      CDQ(0,3,0);
      snap([6],'<b>완료!</b> 역순 쌍 총 <b>'+count+'</b>개: (5,2)(5,1)(2,1)(6,1). 각 쌍은 한 분할 레벨에서 정확히 한 번 세집니다.',{count:count,phase:'done'});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H,A=f.A,n=A.length;
      ctx.textAlign='center'; ctx.fillStyle='#cfd8e6'; ctx.font='600 15px sans-serif';
      ctx.fillText('CDQ: 분할 후 왼쪽→오른쪽 교차 기여만 계산', W/2, H*0.10);
      var cw=Math.min(86,W*0.16), gap=14, totalW=n*cw+(n-1)*gap, x0=W/2-totalW/2, y0=H*0.30, ch=58;
      function cellX(i){ return x0+i*(cw+gap); }
      // 분할 괄호
      if(f.lo>=0 && f.hi>=0){
        var bx0=cellX(f.lo), bx1=cellX(f.hi)+cw, by=y0-18;
        ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(bx0,by+6); ctx.lineTo(bx0,by); ctx.lineTo(bx1,by); ctx.lineTo(bx1,by+6); ctx.stroke();
        if(f.mid>=0){ var mx=cellX(f.mid)+cw+gap/2;
          ctx.strokeStyle='#ffb27a'; ctx.lineWidth=2; ctx.setLineDash([4,4]);
          ctx.beginPath(); ctx.moveTo(mx,y0-10); ctx.lineTo(mx,y0+ch+10); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle='#ffb27a'; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('mid',mx,y0-22); }
      }
      // cells
      for(var i=0;i<n;i++){
        var x=cellX(i), inseg=(i>=f.lo&&i<=f.hi);
        var left=(f.mid>=0&&i<=f.mid&&i>=f.lo), right=(f.mid>=0&&i>f.mid&&i<=f.hi);
        var col='#9b99a3', fc='rgba(155,153,163,0.08)';
        if(f.phase==='cross'&&left){ col='#ffb27a'; fc='rgba(255,178,122,0.16)'; }
        else if(f.phase==='cross'&&right){ col='#7ab8ff'; fc='rgba(122,184,255,0.16)'; }
        else if(inseg){ col='#dfeefb'; fc='rgba(122,184,255,0.12)'; }
        ctx.fillStyle=fc; ctx.strokeStyle=col; ctx.lineWidth=2;
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y0,cw,ch,8);}else{ctx.beginPath();ctx.rect(x,y0,cw,ch);}
        ctx.fill(); ctx.stroke();
        ctx.fillStyle=col; ctx.font='600 22px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(''+A[i],x+cw/2,y0+ch/2); ctx.textBaseline='alphabetic';
        ctx.fillStyle='#6f6e7a'; ctx.font='11px sans-serif'; ctx.fillText('['+i+']',x+cw/2,y0+ch+16);
      }
      // cross arrows
      if(f.cross && f.cross.length){
        ctx.strokeStyle='rgba(244,160,192,0.8)'; ctx.lineWidth=2;
        for(var p=0;p<f.cross.length;p++){ var a=f.cross[p][0],b=f.cross[p][1];
          var ax=cellX(a)+cw/2, bx2=cellX(b)+cw/2, ay=y0+ch+26;
          ctx.beginPath(); ctx.moveTo(ax,ay); ctx.bezierCurveTo(ax,ay+28,bx2,ay+28,bx2,ay); ctx.stroke();
          // arrow head
          ctx.fillStyle='rgba(244,160,192,0.9)'; ctx.beginPath();
          ctx.moveTo(bx2,ay); ctx.lineTo(bx2-4,ay+7); ctx.lineTo(bx2+4,ay+7); ctx.fill();
        }
        ctx.fillStyle='#f4a0c0'; ctx.font='12px sans-serif'; ctx.textAlign='center';
        ctx.fillText('분홍 = 교차 역순 쌍 (왼쪽 > 오른쪽)', W/2, y0+ch+88);
      }
      // count
      ctx.textAlign='center'; ctx.fillStyle=(f.phase==='done')?'#8fe3b5':'#ffb27a'; ctx.font='600 16px sans-serif';
      ctx.fillText('역순 쌍 누적 = '+f.count, W/2, H*0.92);
    }
  },

  { id:'algo_br_slopetrick', concept:true, branchOf:'algo7_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('슬로프 트릭 — 볼록 비용함수를 기울기로 관리', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('DP 값함수가 조각별 선형 볼록일 때, 기울기 변화점(꺾임)만 우선순위 큐로 관리', W/2, H*0.10+22);
      // piecewise linear convex function with breakpoints
      var ax=W*0.16, bx2=W*0.84, base=H*0.60;
      var pts=[[0,0.30],[0.25,0.10],[0.45,0.0],[0.65,0.0],[0.85,0.18],[1.0,0.45]];
      ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2.5; ctx.beginPath();
      pts.forEach(function(p,i){ var x=ax+p[0]*(bx2-ax), y=base-p[1]*H*0.5; if(i===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); }); ctx.stroke();
      pts.forEach(function(p){ ctx.fillStyle='#ffb27a'; ctx.beginPath(); ctx.arc(ax+p[0]*(bx2-ax),base-p[1]*H*0.5,4,0,Math.PI*2); ctx.fill(); });
      ctx.fillStyle='#ffb27a'; ctx.font='12px sans-serif'; ctx.fillText('꺾임점(기울기 −1씩 변화) = 큐에 저장', W/2, base+24);
      ctx.fillStyle='#8fe3b5'; ctx.font='12px sans-serif'; ctx.fillText('평평한 바닥 = 최솟값 구간', W/2, base+44);
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('|x − a| 더하기·prefix min 같은 연산이 "꺾임점 추가·이동·병합"으로', W/2, H*0.80);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('왼쪽/오른쪽 기울기를 두 힙(최대·최소)으로 → 각 전이 O(log n), 함수 전체 안 저장', W/2, H*0.88);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('쓰임: 비감소로 만들기 최소비용·근접 조정·창고/주식 DP. 볼록성 유지가 전제', W/2, H*0.88+20); }
  },

  { id:'algo_br_parallelbs', concept:true, branchOf:'algo4_02',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('병렬 이분 탐색 — 여러 질의의 답을 한꺼번에', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('질의마다 따로 이분 탐색하면 비쌈. 모든 질의의 "중간값"을 동시에 검사하며 함께 좁히기', W/2, H*0.10+22);
      // queries with their lo/mid/hi ranges aligned at same mid step
      var qy=[0.32,0.46,0.60], ax=W*0.20, bx2=W*0.82;
      qy.forEach(function(t,i){ var y=H*0.22+t*H*0.5; ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(ax,y); ctx.lineTo(bx2,y); ctx.stroke();
        ctx.fillStyle='#6a6873'; ctx.font='11px sans-serif'; ctx.textAlign='right'; ctx.fillText('질의'+(i+1),ax-8,y+4); ctx.textAlign='center';
        var mid=ax+(0.3+i*0.15)*(bx2-ax); ctx.fillStyle='#ffb27a'; ctx.beginPath(); ctx.arc(mid,y,5,0,Math.PI*2); ctx.fill(); });
      // a sweep that processes events up to each mid
      ctx.fillStyle='#8fe3b5'; ctx.font='600 13px sans-serif';
      ctx.fillText('한 라운드: 시간 1→T로 이벤트 적용하며, 각 질의의 mid 시점에서 판정', W/2, H*0.74);
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('질의들을 현재 mid로 그룹핑 → 자료구조에 이벤트 한 번 흘리며 모두 판정', W/2, H*0.82);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('log T 라운드 × (이벤트 적용 O(T·연산)) → O((Q+T)·log T·연산), 질의별 분리보다 빠름', W/2, H*0.90);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('쓰임: "몇 번째 추가에서 조건 충족?"류 다수 질의(연결성·합 임계), 시간축 단조 판정', W/2, H*0.90+18); }
  },

  { id:'algo_br_polyinv', branchOf:'algo8_03',
    code:[
      'INVERSE(A, n):            // B ≡ 1/A mod x^n',
      '  B ← [1/A[0]]            // 정밀도 k=1',
      '  while k < n:',
      '    k ← 2k                // 정밀도 배가',
      '    B ← B·(2 − A·B) mod x^k',
      '  return B'
    ],
    build:function(V){
      // A = 1 + x + x^2 + x^3 ... (예: 1/(1-x) 꼴 대신 A=1+2x+3x^2+...) 간단히 A=1 - x
      // 1/(1-x) = 1 + x + x^2 + ... 이므로 A=[1,-1,0,0,0,0,0,0], 역원=[1,1,1,1,...]
      var n=8;
      var A=[1,-1,0,0,0,0,0,0];
      function mul(P,Q,mod){ var r=[]; for(var i=0;i<mod;i++) r[i]=0;
        for(i=0;i<P.length;i++) for(var j=0;j<Q.length;j++){ if(i+j<mod) r[i+j]+=P[i]*Q[j]; } return r; }
      var st=[];
      function snap(line,cap,B,k,o){ o=o||{}; st.push({line:line,cap:cap,A:A.slice(),
        B:B.slice(),k:k,n:n,iter:o.iter||0,done:o.done||false}); }
      snap([0],'형식적 거듭제곱급수 <b>A = 1 − x</b> 의 역원 1/A 를 mod x^8 까지 구합니다(정답은 1+x+x²+…).',[1],1,{iter:0});
      snap([1],'시작점: 상수항만 보면 1/A[0] = 1/1 = 1 → <b>B = [1]</b>, 정밀도 <b>k=1</b> (앞 1자리만 정확).',[1],1,{iter:0});
      var B=[1], k=1, it=0;
      while(k<n){
        var pk=k; k=2*k; it++;
        snap([2,3],'정밀도를 <b>k: '+pk+' → '+k+'</b> 로 배가합니다. 현재 B 는 앞 '+pk+'개만 정확합니다.',B,pk,{iter:it});
        var AB=mul(A.slice(0,k),B,k);
        var twoAB=[]; for(var i=0;i<k;i++) twoAB[i]=(i===0?2:0)-AB[i];
        B=mul(B,twoAB,k);
        // 정수 반올림(부동소수 잡음 제거)
        for(i=0;i<B.length;i++) B[i]=Math.round(B[i]);
        snap([4],'갱신 <b>B ← B·(2 − A·B) mod x^'+k+'</b>. 이제 앞 '+k+'개 계수가 올바르게 채워집니다(초록).',B,k,{iter:it});
      }
      snap([5],'<b>완료!</b> 8자리 정밀도로 1/A = [1,1,1,1,1,1,1,1] = 1+x+x²+…+x⁷. 각 단계 정밀도가 1→2→4→8 로 배가됩니다.',B,k,{iter:it,done:true});
      snap([5],'검산: A·B = (1−x)(1+x+…+x⁷) = 1 − x⁸ ≡ <b>1 (mod x⁸)</b>. 비용은 log n 번의 곱셈으로 <b>O(n log n)</b>.',B,k,{iter:it,done:true});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H,n=f.n;
      ctx.textAlign='center'; ctx.fillStyle='#cfd8e6'; ctx.font='600 15px sans-serif';
      ctx.fillText('뉴턴법 다항식 역원: 정밀도를 1→2→4→8 배가', W/2, H*0.10);
      // A 계수 (위)
      var cw=Math.min(72,(W*0.86)/n), gap=8, totalW=n*cw+(n-1)*gap, x0=W/2-totalW/2;
      var ayy=H*0.24;
      ctx.fillStyle='#9b99a3'; ctx.font='600 12px sans-serif'; ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.fillText('A = 1 − x', x0, ayy-26);
      for(var i=0;i<n;i++){ var x=x0+i*(cw+gap);
        ctx.fillStyle='rgba(122,184,255,0.10)'; ctx.strokeStyle='#3c4a5e'; ctx.lineWidth=1;
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,ayy,cw,40,7);}else{ctx.beginPath();ctx.rect(x,ayy,cw,40);}
        ctx.fill(); ctx.stroke();
        ctx.fillStyle='#cfd8e6'; ctx.font='600 16px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(''+f.A[i],x+cw/2,ayy+20); ctx.textBaseline='alphabetic';
        ctx.fillStyle='#6f6e7a'; ctx.font='10px monospace'; ctx.fillText('x'+(i?'^'+i:'⁰'),x+cw/2,ayy+54);
      }
      // 정밀도 표시 막대
      var byy=H*0.52;
      ctx.fillStyle='#ffb27a'; ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.fillText('정밀도 k = '+f.k, x0, byy-28);
      // 정밀도 윈도우 박스
      var kw=f.k*cw+(f.k-1)*gap;
      ctx.strokeStyle='#ffb27a'; ctx.lineWidth=2; ctx.setLineDash([5,4]);
      if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x0-4,byy-4,kw+8,48,8);ctx.stroke();}else ctx.strokeRect(x0-4,byy-4,kw+8,48);
      ctx.setLineDash([]);
      // B 계수 (아래) — 정밀도 k 안은 초록(확정), 밖은 회색
      ctx.fillStyle='#9b99a3'; ctx.font='600 12px sans-serif'; ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.fillText('B = 1/A', x0, byy-28+0);
      for(i=0;i<n;i++){ var bx=x0+i*(cw+gap);
        var correct=(i<f.k);
        var bv=(i<f.B.length)?f.B[i]:0;
        ctx.fillStyle=correct?'rgba(143,227,181,0.20)':'rgba(155,153,163,0.06)';
        ctx.strokeStyle=correct?'#8fe3b5':'#3c4a5e'; ctx.lineWidth=correct?2:1;
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(bx,byy,cw,40,7);}else{ctx.beginPath();ctx.rect(bx,byy,cw,40);}
        ctx.fill(); ctx.stroke();
        ctx.fillStyle=correct?'#8fe3b5':'#5a5a64'; ctx.font='600 16px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(correct?(''+bv):'·',bx+cw/2,byy+20); ctx.textBaseline='alphabetic';
        ctx.fillStyle='#6f6e7a'; ctx.font='10px monospace'; ctx.textAlign='center'; ctx.fillText('x'+(i?'^'+i:'⁰'),bx+cw/2,byy+54);
      }
      // 진행 라벨
      ctx.textAlign='center'; ctx.fillStyle=f.done?'#8fe3b5':'#ffb27a'; ctx.font='600 14px sans-serif';
      var steps='정밀도: 1';
      var kk=1; while(kk<f.k){ kk*=2; steps+=' → '+kk; }
      ctx.fillText(f.done?('완료 — '+steps):('갱신 '+f.iter+'회: '+steps), W/2, H*0.80);
      ctx.fillStyle='#7f8a9b'; ctx.font='12px sans-serif';
      ctx.fillText('초록 = 확정된 계수(정밀도 k 안), 회색 = 아직 미확정', W/2, H*0.87);
    }
  },

  { id:'algo_br_halfplane', branchOf:'algo8_03',
    code:[
      'HALFPLANE-INTERSECT(반평면들):',
      '  poly ← 아주 큰 사각형(전체 평면 근사)',
      '  for 각 반평면 h:  // a·x + b·y <= c',
      '    poly ← CLIP(poly, h)   // h 밖 부분을 잘라냄',
      '  return poly   // 볼록한 가능 영역',
      'CLIP(poly, h):',
      '  각 변에 대해 h 안/밖 판정',
      '  안→안 유지, 경계 교차점 추가, 밖→버림'
    ],
    build:function(V){
      // half-plane: a*x + b*y <= c  (inside if <=)
      var hps=[
        {a:1,  b:0,  c:0.80, lbl:'x ≤ 0.80'},
        {a:-1, b:0,  c:-0.18,lbl:'x ≥ 0.18'},
        {a:0,  b:1,  c:0.78, lbl:'y ≤ 0.78'},
        {a:0,  b:-1, c:-0.20,lbl:'y ≥ 0.20'},
        {a:1,  b:1,  c:1.20, lbl:'x+y ≤ 1.20'}
      ];
      // start polygon big square
      var poly=[{x:0.05,y:0.05},{x:0.95,y:0.05},{x:0.95,y:0.95},{x:0.05,y:0.95}];
      function inside(h,p){ return h.a*p.x+h.b*p.y <= h.c+1e-9; }
      function isect(h,p,q){
        var dp=h.a*p.x+h.b*p.y-h.c, dq=h.a*q.x+h.b*q.y-h.c;
        var t=dp/(dp-dq);
        return {x:p.x+t*(q.x-p.x), y:p.y+t*(q.y-p.y)}; }
      function clip(poly,h){
        var out=[];
        for(var i=0;i<poly.length;i++){
          var cur=poly[i], nxt=poly[(i+1)%poly.length];
          var ci=inside(h,cur), ni=inside(h,nxt);
          if(ci){ out.push(cur); if(!ni) out.push(isect(h,cur,nxt)); }
          else { if(ni) out.push(isect(h,cur,nxt)); }
        }
        return out; }
      var st=[];
      function snap(line,cap,poly,hidx,line2){
        st.push({line:line2!=null?[line,line2]:line,cap:cap,
          poly:poly.map(function(p){return {x:p.x,y:p.y};}),
          hps:hps, hidx:(hidx==null?-1:hidx)}); }
      snap([0,1],'<b>반평면 교집합</b>: 여러 \"a·x+b·y ≤ c\" 조건을 모두 만족하는 영역을 찾습니다(선형계획 가능 영역).',poly,-1);
      snap([1],'전체 평면을 근사하는 <b>아주 큰 사각형</b>에서 출발합니다.',poly,-1);
      for(var k=0;k<hps.length;k++){
        snap([2,3],'반평면 '+(k+1)+': <b>'+hps[k].lbl+'</b> — 이 선 밖에 있는 영역을 잘라낼 차례입니다.',poly,k);
        poly=clip(poly,hps[k]);
        snap([3,6],'경계와의 교차점을 새 꼭짓점으로 추가하고, 밖 부분을 버려 다각형을 <b>축소</b>했습니다.',poly,k);
      }
      snap(4,'<b>완료!</b> 다섯 반평면을 모두 적용 — 남은 <b>볼록 다각형</b>이 가능 영역입니다. 한 변씩 자르므로 효율적입니다.',poly,-1);
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H;
      function PX(x){ return W*0.12+x*W*0.74; }
      function PY(y){ return H*0.16+(1-y)*H*0.68; }
      ctx.textAlign='center'; ctx.fillStyle='#cfd8e6'; ctx.font='600 14px sans-serif';
      ctx.fillText('반평면 교집합 — 한 변씩 잘라내기', W/2, H*0.085);
      // grid box
      ctx.strokeStyle='rgba(255,255,255,0.06)'; ctx.lineWidth=1;
      ctx.strokeRect(PX(0),PY(1),PX(1)-PX(0),PY(0)-PY(1));
      // half-plane boundary lines (active + applied)
      for(var k=0;k<f.hps.length;k++){
        var h=f.hps[k];
        // draw boundary line a x + b y = c across box; param by endpoints
        var pa,pb;
        if(Math.abs(h.b)<1e-9){ var xv=h.c/h.a; pa={x:xv,y:0}; pb={x:xv,y:1}; }
        else if(Math.abs(h.a)<1e-9){ var yv=h.c/h.b; pa={x:0,y:yv}; pb={x:1,y:yv}; }
        else { pa={x:0,y:h.c/h.b}; pb={x:1,y:(h.c-h.a)/h.b}; }
        var isCur=(k===f.hidx);
        ctx.strokeStyle=isCur?'#ffb27a':'rgba(122,184,255,0.30)';
        ctx.lineWidth=isCur?2.4:1.2; ctx.setLineDash(isCur?[]:[4,4]);
        ctx.beginPath(); ctx.moveTo(PX(pa.x),PY(pa.y)); ctx.lineTo(PX(pb.x),PY(pb.y)); ctx.stroke(); ctx.setLineDash([]);
        if(isCur){ ctx.fillStyle='#ffb27a'; ctx.font='12px sans-serif'; ctx.textAlign='left';
          ctx.fillText(h.lbl, PX(pb.x)+4, PY(pb.y)); }
      }
      // feasible polygon
      if(f.poly&&f.poly.length>=3){
        var done=(f.hidx<0&&f.poly.length>=3);
        ctx.beginPath();
        for(var i=0;i<f.poly.length;i++){ var p=f.poly[i]; var x=PX(p.x),y=PY(p.y); if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y); }
        ctx.closePath();
        ctx.fillStyle=done?'rgba(143,227,181,0.22)':'rgba(122,184,255,0.16)';
        ctx.fill();
        ctx.strokeStyle=done?'#8fe3b5':'#7ab8ff'; ctx.lineWidth=2.4; ctx.stroke();
        for(i=0;i<f.poly.length;i++){ var pp=f.poly[i];
          ctx.fillStyle=done?'#8fe3b5':'#7ab8ff'; ctx.beginPath(); ctx.arc(PX(pp.x),PY(pp.y),3.5,0,7); ctx.fill(); }
      }
      ctx.textAlign='left'; ctx.fillStyle='#9b99a3'; ctx.font='11px sans-serif';
      ctx.fillText('주황 실선=지금 적용하는 반평면  파랑/초록 영역=현재 가능 영역', W*0.12, H*0.96); }
  },

  { id:'algo_br_delaunay', branchOf:'algo8_03',
    code:[
      'DELAUNAY(점들):              // 증분 + 빈 외접원',
      '  큰 삼각형으로 시작(모든 점 포함)',
      '  for 각 점 p:',
      '    p 를 포함하는 삼각형 t 찾기',
      '    t 를 p 와 잇는 작은 삼각형들로 분할',
      '    for 각 새 변 (a,b):',
      '      if 반대편 점이 외접원 안 → 변 뒤집기(flip)',
      '  return 들로네 삼각분할'
    ],
    build:function(V){
      var pts=[
        {x:0.25,y:0.30},{x:0.72,y:0.28},{x:0.78,y:0.70},
        {x:0.30,y:0.72},{x:0.52,y:0.50}
      ];
      for(var i=0;i<pts.length;i++) pts[i].id=i;
      function circ3(a,b,c){
        var ax=a.x,ay=a.y,bx=b.x,by=b.y,cx=c.x,cy=c.y;
        var dd=2*(ax*(by-cy)+bx*(cy-ay)+cx*(ay-by));
        if(Math.abs(dd)<1e-12) return null;
        var ux=((ax*ax+ay*ay)*(by-cy)+(bx*bx+by*by)*(cy-ay)+(cx*cx+cy*cy)*(ay-by))/dd;
        var uy=((ax*ax+ay*ay)*(cx-bx)+(bx*bx+by*by)*(ax-cx)+(cx*cx+cy*cy)*(bx-ax))/dd;
        return {cx:ux,cy:uy,r:Math.sqrt((ax-ux)*(ax-ux)+(ay-uy)*(ay-uy))}; }
      function inCircumcircle(tri,p){ var c=circ3(pts[tri[0]],pts[tri[1]],pts[tri[2]]); if(!c) return false;
        var dx=p.x-c.cx,dy=p.y-c.cy; return Math.sqrt(dx*dx+dy*dy)<c.r-1e-9; }
      var st=[];
      function snap(line,cap,tris,cur,circle,flip){
        st.push({line:line,cap:cap,pts:pts,
          tris:(tris||[]).map(function(t){return t.slice();}),
          cur:(cur==null?-1:cur),
          circle:circle?{cx:circle.cx,cy:circle.cy,r:circle.r}:null,
          flip:flip||null}); }
      snap(0,'<b>들로네 삼각분할</b>: 어떤 삼각형의 외접원 안에도 다른 점이 없게 만드는 \"가장 통통한\" 삼각화입니다.',[],-1,null,null);
      snap([0],'좁고 긴 삼각형은 좋지 않습니다. 점을 하나씩 넣으며 \"빈 외접원\" 규칙으로 모양을 다듬어 나갑니다.',[],-1,null,null);
      // start with triangle of 0,1,3 (a big one), then insert
      var tris=[[0,1,3],[1,2,3]];
      snap([1],'네 모서리 점 0·1·2·3 으로 사각형을 두 삼각형 [0,1,3],[1,2,3] 으로 나눠 시작합니다.',tris,-1,null,null);
      // insert point 4 (center)
      var p=4;
      // find triangle containing p (here [0,1,3] or [1,2,3]); compute sign
      function sgn(o,a,b){ return (a.x-o.x)*(b.y-o.y)-(a.y-o.y)*(b.x-o.x); }
      function inTri(t,q){ var a=pts[t[0]],b=pts[t[1]],c=pts[t[2]];
        var s1=sgn(a,b,q),s2=sgn(b,c,q),s3=sgn(c,a,q);
        var neg=(s1<0)||(s2<0)||(s3<0), pos=(s1>0)||(s2>0)||(s3>0); return !(neg&&pos); }
      var host=-1; for(var t=0;t<tris.length;t++){ if(inTri(tris[t],pts[p])){host=t;break;} }
      if(host<0) host=0;
      snap([3],'점 '+p+' 을 삽입 — 이 점을 <b>포함하는 삼각형</b> ['+tris[host].join(',')+'] 을 찾습니다.',tris,p,null,null);
      var ht=tris[host];
      var newTris=[];
      for(t=0;t<tris.length;t++){ if(t!==host) newTris.push(tris[t]); }
      newTris.push([ht[0],ht[1],p]); newTris.push([ht[1],ht[2],p]); newTris.push([ht[2],ht[0],p]);
      tris=newTris;
      snap([4],'그 삼각형을 점 '+p+' 과 세 꼭짓점을 잇는 <b>작은 삼각형 3개</b>로 분할합니다.',tris,p,null,null);
      snap([5],'분할로 생긴 <b>새 변</b>들이 들로네 조건을 깨뜨릴 수 있습니다. 이웃 삼각형마다 외접원을 확인해야 합니다.',tris,p,null,null);
      // check circumcircle empty test on neighbor edge: test triangle [1,2,3] circumcircle contains p?
      var testTri=[1,2,3];
      var c0=circ3(pts[1],pts[2],pts[3]);
      var bad=inCircumcircle(testTri,pts[p]);
      snap([5,6],'<b>빈 외접원 검사</b>: 이웃 삼각형 [1,2,3] 의 외접원 안에 점 '+p+' 이 들어오는지 봅니다 → '+(bad?'<b>위반!</b>':'통과'),tris,p,c0,null);
      if(bad){
        // flip the shared edge (1,3) -> (2,4)
        // remove triangles using edge (1,3): [0,1,3] gone already replaced; here testTri [1,2,3] and one of new [3,1? ]
        // For visual: replace [1,2,3] and [3,0? ] ... we flip edge 1-3 to 2-4
        var flipped=[];
        for(t=0;t<tris.length;t++){ var tr=tris[t];
          var has13=(tr.indexOf(1)>=0&&tr.indexOf(3)>=0);
          if(has13) continue; flipped.push(tr); }
        // add new flipped triangles around edge 2-4
        flipped.push([1,2,p]); flipped.push([2,3,p]);
        tris=flipped;
        snap([6],'위반 → 공유 변 (1,3)을 <b>뒤집어(flip)</b> (2,'+p+') 로 교체합니다. 두 삼각형이 더 \"통통\"해집니다.',tris,p,c0,[1,3]);
        snap([5,6],'뒤집은 뒤 다시 외접원 검사 → 더 이상 위반이 없으면 멈춥니다(연쇄 flip이 끝남).',tris,p,null,null);
      }
      snap(7,'<b>완료!</b> 모든 삼각형의 외접원이 비어 있음 — 들로네 조건 만족. 좁고 긴 삼각형이 사라졌습니다.',tris,-1,null,null);
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H,P=f.pts;
      function PX(x){ return W*0.14+x*W*0.70; }
      function PY(y){ return H*0.16+y*H*0.70; }
      var sc=Math.min(W*0.70,H*0.70);
      ctx.textAlign='center'; ctx.fillStyle='#cfd8e6'; ctx.font='600 14px sans-serif';
      ctx.fillText('들로네 삼각분할 — 빈 외접원 + 변 뒤집기', W/2, H*0.085);
      // triangles
      for(var i=0;i<f.tris.length;i++){
        var t=f.tris[i];
        ctx.beginPath();
        for(var k=0;k<3;k++){ var p=P[t[k]]; var x=PX(p.x),y=PY(p.y); if(k===0)ctx.moveTo(x,y);else ctx.lineTo(x,y); }
        ctx.closePath();
        ctx.fillStyle=(f.flip)?'rgba(143,227,181,0.08)':'rgba(122,184,255,0.06)';
        ctx.fill();
        ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=1.8; ctx.stroke();
      }
      // circumcircle test
      if(f.circle){
        var cx=PX(f.circle.cx),cy=PY(f.circle.cy),r=f.circle.r*sc;
        ctx.strokeStyle='#f4a0c0'; ctx.lineWidth=1.8; ctx.setLineDash([5,4]);
        ctx.beginPath(); ctx.arc(cx,cy,r,0,7); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle='#f4a0c0'; ctx.beginPath(); ctx.arc(cx,cy,2.5,0,7); ctx.fill();
        ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('외접원', cx, cy-r-6);
      }
      // flip edge highlight
      if(f.flip){ var a=P[f.flip[0]],b=P[f.flip[1]];
        ctx.strokeStyle='#ffb27a'; ctx.lineWidth=3; ctx.setLineDash([6,4]);
        ctx.beginPath(); ctx.moveTo(PX(a.x),PY(a.y)); ctx.lineTo(PX(b.x),PY(b.y)); ctx.stroke(); ctx.setLineDash([]); }
      // points
      for(i=0;i<P.length;i++){
        var px=PX(P[i].x),py=PY(P[i].y);
        var isCur=(i===f.cur);
        var col=isCur?'#ffb27a':'#8fe3b5';
        ctx.fillStyle=col; ctx.beginPath(); ctx.arc(px,py,isCur?7:5.5,0,7); ctx.fill();
        if(isCur){ ctx.strokeStyle='#ffb27a'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(px,py,11,0,7); ctx.stroke(); }
        ctx.fillStyle='#9b99a3'; ctx.font='10px monospace'; ctx.textBaseline='middle';
        ctx.fillText(''+i, px, py-13); ctx.textBaseline='alphabetic';
      }
      ctx.textAlign='left'; ctx.fillStyle='#9b99a3'; ctx.font='11px sans-serif';
      ctx.fillText('초록=점  주황=삽입 중  분홍 점선=외접원 검사  주황 점선=뒤집은 변', W*0.14, H*0.97); }
  },

  { id:'algo_br_treediameter', concept:true, branchOf:'algo5_03',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('트리 지름과 중심 — 가장 먼 두 점, 한가운데', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('지름=가장 먼 두 정점 거리. "아무 정점서 가장 먼 점 u, u서 가장 먼 점 v"(BFS 두 번)', W/2, H*0.10+22);
      // tree with a longest path highlighted
      var N={a:[0.16,0.40],b:[0.34,0.30],c:[0.34,0.55],d:[0.55,0.45],e:[0.74,0.32],f:[0.74,0.60],g:[0.90,0.46]};
      var edges=[['a','b'],['b','c'],['b','d'],['d','e'],['d','f'],['e','g']];
      var diam=[['a','b'],['b','d'],['d','e'],['e','g']];
      function xy(t){ return [W*N[t][0], H*0.24+N[t][1]*H*0.5]; }
      edges.forEach(function(e){ var p=xy(e[0]),q=xy(e[1]); var on=diam.some(function(d){return (d[0]===e[0]&&d[1]===e[1])||(d[0]===e[1]&&d[1]===e[0]);}); ctx.strokeStyle=on?'#ffb27a':'rgba(122,184,255,0.4)'; ctx.lineWidth=on?3.5:2; ctx.beginPath(); ctx.moveTo(p[0],p[1]); ctx.lineTo(q[0],q[1]); ctx.stroke(); });
      Object.keys(N).forEach(function(k){ var p=xy(k); var end=(k==='a'||k==='g'); var ctr=(k==='d');
        ctx.fillStyle=ctr?'rgba(143,227,181,0.3)':(end?'rgba(255,178,122,0.25)':'rgba(122,184,255,0.16)'); ctx.strokeStyle=ctr?'#8fe3b5':(end?'#ffb27a':'#7ab8ff'); ctx.lineWidth=2.5;
        ctx.beginPath(); ctx.arc(p[0],p[1],13,0,Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.fillStyle='#dfeefb'; ctx.font='600 12px sans-serif'; ctx.fillText(k.toUpperCase(),p[0],p[1]+4); });
      ctx.fillStyle='#ffb27a'; ctx.font='12px sans-serif'; ctx.fillText('지름 경로 a–b–d–e–g (길이 4)', W*0.4, H*0.84); ctx.fillStyle='#8fe3b5'; ctx.fillText('중심 = d', W*0.78, H*0.84);
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('지름: BFS/DFS로 임의 점서 최원점 u, u서 최원점 v → dist(u,v)가 지름', W/2, H*0.90);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('왜 맞나: 트리에선 최원점이 항상 지름의 한 끝. 중심=지름 경로의 중점(1~2개). 트리DP로도 O(n)', W/2, H*0.90+18); }
  },

  { id:'algo_br_funcgraph', concept:true, branchOf:'algo6_04',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('함수 그래프 — 각 정점 출차수 1의 ρ 구조', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('i→f[i] 처럼 나가는 간선이 하나뿐인 그래프. 각 성분이 "사이클 + 거기로 흘러드는 나무들"', W/2, H*0.10+22);
      // rho shape: tail trees flowing into a cycle
      var cx=W*0.64, cy=H*0.50, r=H*0.16;
      ctx.strokeStyle='#ffb27a'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.stroke();
      // cycle nodes
      for(var k=0;k<5;k++){ var a=-Math.PI/2+k*2*Math.PI/5; var x=cx+r*Math.cos(a),y=cy+r*Math.sin(a); ctx.fillStyle='rgba(255,178,122,0.22)'; ctx.strokeStyle='#ffb27a'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(x,y,9,0,Math.PI*2); ctx.fill(); ctx.stroke(); }
      // trees flowing in (tails)
      var tails=[[0.16,0.30],[0.26,0.40],[0.36,0.50],[0.20,0.62],[0.32,0.70]];
      ctx.strokeStyle='rgba(122,184,255,0.45)'; ctx.lineWidth=2;
      var prev=null; tails.forEach(function(t,i){ var x=W*t[0],y=H*0.22+t[1]*H*0.5; ctx.fillStyle='rgba(122,184,255,0.18)'; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(x,y,8,0,Math.PI*2); ctx.fill(); ctx.stroke(); });
      ctx.strokeStyle='rgba(122,184,255,0.45)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(W*0.36+8,H*0.22+0.50*H*0.5); ctx.lineTo(cx-r-2,cy-4); ctx.stroke();
      ctx.fillStyle='#ffb27a'; ctx.font='12px sans-serif'; ctx.fillText('사이클', cx, cy+4);
      ctx.fillStyle='#7ab8ff'; ctx.font='12px sans-serif'; ctx.fillText('흘러드는 나무(꼬리)', W*0.24, H*0.82);
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('각 약연결 성분 = 사이클 하나 + 그 사이클로 들어오는 나무들 (ρ 모양)', W/2, H*0.88);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('사이클 찾기=방문표시/플로이드 거북토끼. fᵏ(x)=이진점프. 순열은 꼬리없는 특수형(사이클만)', W/2, H*0.88+18); }
  },

  { id:'algo_br_kdtree', concept:true, branchOf:'algo2_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('k-d 트리 — 평면을 축 번갈아 가르기', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('점들을 x·y 축을 번갈아 중앙값으로 분할 → 최근접 이웃·범위 질의를 평균 O(log n)에', W/2, H*0.10+22);
      // plane with alternating splits
      var bx=W*0.16, by=H*0.28, bw=W*0.40, bh=H*0.52;
      ctx.strokeStyle='#3a4358'; ctx.lineWidth=1.5; ctx.strokeRect(bx,by,bw,bh);
      // vertical split (x), then horizontal splits (y)
      ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(bx+bw*0.5,by); ctx.lineTo(bx+bw*0.5,by+bh); ctx.stroke();
      ctx.strokeStyle='#8fe3b5'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(bx,by+bh*0.45); ctx.lineTo(bx+bw*0.5,by+bh*0.45); ctx.moveTo(bx+bw*0.5,by+bh*0.6); ctx.lineTo(bx+bw,by+bh*0.6); ctx.stroke();
      var pts=[[0.25,0.25],[0.3,0.7],[0.7,0.3],[0.8,0.8],[0.6,0.55]];
      pts.forEach(function(p){ ctx.fillStyle='#ffb27a'; ctx.beginPath(); ctx.arc(bx+p[0]*bw,by+p[1]*bh,4,0,Math.PI*2); ctx.fill(); });
      ctx.fillStyle='#7ab8ff'; ctx.font='11px sans-serif'; ctx.fillText('x로 분할', bx+bw*0.5, by-6); ctx.fillStyle='#8fe3b5'; ctx.fillText('y로 분할', bx+bw+20, by+bh*0.45);
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
      ctx.fillText('깊이 d마다 (d mod k)번째 축으로', W*0.62, H*0.36);
      ctx.fillText('중앙값 분할 → 균형 이진 트리', W*0.62, H*0.44);
      ctx.fillText('최근접: 가까운 쪽 먼저, 경계까지', W*0.62, H*0.54);
      ctx.fillText('거리 < 현재 최선이면 반대쪽도', W*0.62, H*0.61); ctx.textAlign='center';
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('구축 O(n log n). 최근접/범위 질의 평균 O(log n), 최악 O(n)(고차원서 저주)', W/2, H*0.86);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('쓰임: 최근접 이웃·k-NN, 범위 검색, 충돌·레이트레이싱, 군집. 저차원에 강함', W/2, H*0.86+20); }
  },

  { id:'algo_br_minkowski', branchOf:'algo8_03',
    code:[
      'MINKOWSKI-SUM(P, Q):       // 둘 다 볼록',
      '  P, Q 를 최하단점부터 반시계로 정렬',
      '  i ← 0; j ← 0; result ← []',
      '  while i < |P| or j < |Q|:',
      '    result 에 P[i] + Q[j] 추가',
      '    // 각도가 더 작은 변을 따라 전진',
      '    if angle(P변 i) < angle(Q변 j): i++',
      '    elif angle(P변 i) > angle(Q변 j): j++',
      '    else: i++; j++',
      '  return result'
    ],
    build:function(V){
      // two small convex polygons, CCW from lowest point
      var P=[{x:0.18,y:0.30},{x:0.36,y:0.28},{x:0.34,y:0.48},{x:0.16,y:0.50}]; // square-ish
      var Q=[{x:0.10,y:0.12},{x:0.26,y:0.10},{x:0.20,y:0.26}];                  // triangle
      function edgeAngle(poly,i){ var a=poly[i], b=poly[(i+1)%poly.length];
        return Math.atan2(b.y-a.y, b.x-a.x); }
      function norm(t){ while(t<0)t+=2*Math.PI; return t; }
      var st=[];
      function snap(line,cap,sum,i,j,addPt){
        st.push({line:line,cap:cap,P:P,Q:Q,
          sum:(sum||[]).map(function(p){return {x:p.x,y:p.y};}),
          i:(i==null?-1:i), j:(j==null?-1:j),
          addPt:addPt?{x:addPt.x,y:addPt.y}:null}); }
      snap(0,'<b>민코프스키 합 P⊕Q</b>: 두 볼록 다각형의 모든 점 합 {p+q}. 변을 <b>각도 순</b>으로 합치면 됩니다.',[],-1,-1,null);
      snap([1],'두 다각형을 각각 <b>최하단 점</b>부터 반시계로 정렬합니다. P는 사각형, Q는 삼각형입니다.',[],-1,-1,null);
      var i=0,j=0,sum=[],steps=P.length+Q.length;
      for(var s=0;s<steps;s++){
        var pi=P[i%P.length], qj=Q[j%Q.length];
        var pt={x:pi.x+qj.x, y:pi.y+qj.y};
        sum.push(pt);
        snap([4],'꼭짓점 추가: P['+(i%P.length)+'] + Q['+(j%Q.length)+'] = ('+pt.x.toFixed(2)+', '+pt.y.toFixed(2)+'). 합 다각형의 변이 하나 늘었습니다.',sum,i%P.length,j%Q.length,pt);
        var aP=norm(edgeAngle(P,i%P.length)), aQ=norm(edgeAngle(Q,j%Q.length));
        if(i>=P.length){ j++; }
        else if(j>=Q.length){ i++; }
        else if(aP<aQ-1e-9){ i++; }
        else if(aP>aQ+1e-9){ j++; }
        else { i++; j++; }
      }
      snap(9,'<b>완료!</b> 두 다각형의 변을 각도 순으로 이어 붙여 민코프스키 합 다각형 완성. 변 수는 |P|+|Q| 이하, <b>O(|P|+|Q|)</b>.',sum,-1,-1,null);
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H;
      function PX(x){ return W*0.10+x*W*0.80; }
      function PY(y){ return H*0.90-y*H*0.78; }
      ctx.textAlign='center'; ctx.fillStyle='#cfd8e6'; ctx.font='600 14px sans-serif';
      ctx.fillText('민코프스키 합 — 변을 각도 순으로 결합', W/2, H*0.075);
      function poly(pts,stroke,fill,lw){
        ctx.beginPath();
        for(var k=0;k<pts.length;k++){ var p=pts[k]; var x=PX(p.x),y=PY(p.y); if(k===0)ctx.moveTo(x,y);else ctx.lineTo(x,y); }
        ctx.closePath();
        if(fill){ ctx.fillStyle=fill; ctx.fill(); }
        ctx.strokeStyle=stroke; ctx.lineWidth=lw||2; ctx.stroke();
      }
      // input P (blue), Q (pink)
      poly(f.P,'#7ab8ff','rgba(122,184,255,0.10)',2);
      poly(f.Q,'#f4a0c0','rgba(244,160,192,0.10)',2);
      ctx.fillStyle='#7ab8ff'; ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillText('P', PX(f.P[1].x)+4, PY(f.P[1].y));
      ctx.fillStyle='#f4a0c0'; ctx.fillText('Q', PX(f.Q[1].x)+4, PY(f.Q[1].y));
      // active vertices
      if(f.i>=0){ var pi=f.P[f.i]; ctx.fillStyle='#ffb27a'; ctx.beginPath(); ctx.arc(PX(pi.x),PY(pi.y),6,0,7); ctx.fill(); }
      if(f.j>=0){ var qj=f.Q[f.j]; ctx.fillStyle='#ffb27a'; ctx.beginPath(); ctx.arc(PX(qj.x),PY(qj.y),6,0,7); ctx.fill(); }
      // sum polygon (partial path / closed when done)
      if(f.sum&&f.sum.length>=1){
        var done=(f.i<0&&f.j<0&&f.sum.length>=3);
        ctx.beginPath();
        for(var k=0;k<f.sum.length;k++){ var p=f.sum[k]; var x=PX(p.x),y=PY(p.y); if(k===0)ctx.moveTo(x,y);else ctx.lineTo(x,y); }
        if(done) ctx.closePath();
        ctx.strokeStyle=done?'#8fe3b5':'#ffb27a'; ctx.lineWidth=2.6; ctx.stroke();
        if(done){ ctx.fillStyle='rgba(143,227,181,0.12)'; ctx.fill(); }
        for(k=0;k<f.sum.length;k++){ var sp=f.sum[k];
          ctx.fillStyle=done?'#8fe3b5':'#ffb27a'; ctx.beginPath(); ctx.arc(PX(sp.x),PY(sp.y),3.5,0,7); ctx.fill(); }
      }
      // newest added point highlight
      if(f.addPt){ ctx.strokeStyle='#8fe3b5'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(PX(f.addPt.x),PY(f.addPt.y),9,0,7); ctx.stroke(); }
      ctx.textAlign='left'; ctx.fillStyle='#9b99a3'; ctx.font='11px sans-serif';
      ctx.fillText('파랑=P  분홍=Q  주황/초록=합 P⊕Q  주황 점=현재 결합 중인 꼭짓점', W*0.10, H*0.98); }
  },

  { id:'algo_br_quadtree', concept:true, branchOf:'algo2_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('사분 트리 — 공간을 네 칸씩 재귀 분할', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('2D 영역을 점이 많으면 4등분 반복. 점 검색·충돌·이미지 압축·근사 중력(Barnes-Hut)', W/2, H*0.10+22);
      // recursive quad subdivision
      var bx=W*0.30, by=H*0.28, sz=H*0.5;
      function quad(x,y,s,depth){ ctx.strokeStyle='rgba(122,184,255,'+(0.5-depth*0.1)+')'; ctx.lineWidth=1.5; ctx.strokeRect(x,y,s,s);
        if(depth<2){ // subdivide top-right and bottom-left for variety
          ctx.beginPath(); ctx.moveTo(x+s/2,y); ctx.lineTo(x+s/2,y+s); ctx.moveTo(x,y+s/2); ctx.lineTo(x+s,y+s/2); ctx.stroke();
          quad(x+s/2,y,s/2,depth+1); quad(x,y+s/2,s/2,depth+1); } }
      quad(bx,by,sz,0);
      var pts=[[0.15,0.2],[0.6,0.15],[0.7,0.35],[0.2,0.7],[0.35,0.85],[0.8,0.8]];
      pts.forEach(function(p){ ctx.fillStyle='#ffb27a'; ctx.beginPath(); ctx.arc(bx+p[0]*sz,by+p[1]*sz,4,0,Math.PI*2); ctx.fill(); });
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('칸에 점이 임계치 넘으면 4분할(NW·NE·SW·SE) → 밀집한 곳만 깊게', W/2, H*0.84);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('범위/최근접 질의는 겹치는 칸만 재귀. 3D는 팔분트리(octree). 적응형 해상도', W/2, H*0.90);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('쓰임: 충돌 브로드페이즈, 이미지 압축, GIS, Barnes-Hut N체(O(n log n) 중력)', W/2, H*0.90+18); }
  },

  { id:'algo_br_sufarraybuild', concept:true, branchOf:'algo4_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('접미사 배열 구축 — 접두사 배가(prefix doubling)', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('길이 1,2,4,…로 접미사를 순위 매겨 정렬. 이전 순위로 다음 길이 비교 → O(n log n)', W/2, H*0.10+22);
      // doubling rounds: rank by first 1, 2, 4 chars
      var rounds=[['길이 1','각 글자로 순위'],['길이 2','(현재순위, 다음순위)쌍 정렬'],['길이 4','앞 길이 순위 두 개로'],['길이 8','…유일해질 때까지']];
      var bx=W*0.5-(rounds.length*100)/2, by=H*0.34;
      rounds.forEach(function(r,i){ var x=bx+i*100; ctx.fillStyle='rgba(122,184,255,0.14)'; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2; ctx.fillRect(x,by,88,46); ctx.strokeRect(x,by,88,46);
        ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif'; ctx.fillText(r[0],x+44,by+18); ctx.fillStyle='#8a8893'; ctx.font='9px sans-serif'; ctx.fillText(r[1],x+44,by+34);
        if(i<rounds.length-1){ ctx.strokeStyle='#ffb27a'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x+88,by+23); ctx.lineTo(x+100,by+23); ctx.stroke(); } });
      ctx.fillStyle='#ffb27a'; ctx.font='600 14px sans-serif';
      ctx.fillText('길이 2k 순위 = (길이 k 순위, k칸 뒤 길이 k 순위) 쌍을 정렬', W/2, H*0.64);
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('각 라운드 정렬을 기수정렬로 O(n) → log n 라운드 → O(n log n)', W/2, H*0.80);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('이전 길이의 순위를 재사용하므로 글자 비교 없이 정수 쌍 비교. SA-IS는 O(n)', W/2, H*0.88);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('Kasai로 LCP 얹으면 부분문자열·반복·LCS. 접미사 트라이/트리의 배열판', W/2, H*0.88+20); }
  },

  { id:'algo_br_boruvka', concept:true, branchOf:'algo6_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('보루프카 — 모든 성분이 동시에 가장 싼 간선 선택', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('MST를 "각 덩어리가 자기 최소 간선을 동시에 고르고 병합" 반복으로. 라운드 O(log V)', W/2, H*0.10+22);
      // components each picking cheapest outgoing edge
      var N={a:[0.22,0.34],b:[0.40,0.30],c:[0.30,0.60],d:[0.66,0.34],e:[0.82,0.58],f:[0.62,0.66]};
      var edges=[['a','b','1'],['a','c','3'],['b','d','5'],['d','e','2'],['e','f','4'],['c','f','6']];
      var chosen={'a-b':1,'d-e':1,'e-f':1};
      function xy(t){ return [W*N[t][0], H*0.22+N[t][1]*H*0.5]; }
      edges.forEach(function(e){ var p=xy(e[0]),q=xy(e[1]); var on=chosen[e[0]+'-'+e[1]]; ctx.strokeStyle=on?'#8fe3b5':'rgba(122,184,255,0.4)'; ctx.lineWidth=on?3.5:2; ctx.beginPath(); ctx.moveTo(p[0],p[1]); ctx.lineTo(q[0],q[1]); ctx.stroke(); ctx.fillStyle=on?'#8fe3b5':'#8a8893'; ctx.font='12px sans-serif'; ctx.fillText(e[2],(p[0]+q[0])/2,(p[1]+q[1])/2-4); });
      Object.keys(N).forEach(function(k){ var p=xy(k); ctx.fillStyle='rgba(122,184,255,0.16)'; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(p[0],p[1],13,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.fillStyle='#dfeefb'; ctx.font='600 12px sans-serif'; ctx.fillText(k.toUpperCase(),p[0],p[1]+4); });
      ctx.fillStyle='#8fe3b5'; ctx.font='12px sans-serif'; ctx.fillText('초록 = 이번 라운드 각 성분의 최소 간선', W/2, H*0.82);
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('한 라운드: 각 성분이 밖으로 나가는 최소 간선 선택→병합. 성분 수 ≥절반 감소', W/2, H*0.88);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('O(log V) 라운드 × O(E) = O(E log V). 병렬·외부메모리 친화(크루스칼·프림과 다른 MST)', W/2, H*0.88+20); }
  },

  { id:'algo_br_secondmst', concept:true, branchOf:'algo6_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('차선 신장 트리 — MST 다음으로 싼 트리', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('MST에 비트리 간선 하나를 넣으면 사이클 → 그 사이클 최대 간선과 교환, 증가 최소가 답', W/2, H*0.10+22);
      // MST tree + a non-tree edge forming a cycle
      var N={a:[0.25,0.35],b:[0.5,0.28],c:[0.75,0.38],d:[0.40,0.62],e:[0.66,0.66]};
      function xy(t){ return [W*N[t][0], H*0.22+N[t][1]*H*0.5]; }
      var tree=[['a','b','2'],['b','c','3'],['a','d','4'],['c','e','1']];
      tree.forEach(function(e){ var p=xy(e[0]),q=xy(e[1]); ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(p[0],p[1]); ctx.lineTo(q[0],q[1]); ctx.stroke(); ctx.fillStyle='#7ab8ff'; ctx.font='12px sans-serif'; ctx.fillText(e[2],(p[0]+q[0])/2,(p[1]+q[1])/2-4); });
      // non-tree edge d-e (forms cycle d-a-b-c-e)
      var p=xy('d'),q=xy('e'); ctx.strokeStyle='#ffb27a'; ctx.lineWidth=2.5; ctx.setLineDash([6,4]); ctx.beginPath(); ctx.moveTo(p[0],p[1]); ctx.lineTo(q[0],q[1]); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle='#ffb27a'; ctx.font='12px sans-serif'; ctx.fillText('+6', (p[0]+q[0])/2, (p[1]+q[1])/2+16);
      Object.keys(N).forEach(function(k){ var pp=xy(k); ctx.fillStyle='rgba(122,184,255,0.16)'; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(pp[0],pp[1],13,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.fillStyle='#dfeefb'; ctx.font='600 12px sans-serif'; ctx.fillText(k.toUpperCase(),pp[0],pp[1]+4); });
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('d–e(+6) 넣으면 사이클 d-a-b-c-e, 그 경로 최대간선 a-d(4) 제거 → 증가 +2', W/2, H*0.84);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('모든 비트리 간선에 대해 (그 간선 − 사이클 최대간선) 최소 = 차선 MST', W/2, H*0.90);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('경로 최대간선은 이진점프(LCA)로 O(log V). 전체 O(E log V). 네트워크 백업 트리', W/2, H*0.90+18); }
  },

  { id:'algo_br_palindromepart', concept:true, branchOf:'algo7_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('회문 분할 DP — 최소 횟수로 회문 조각내기', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('문자열을 모두 회문인 조각으로 자르는 최소 컷 수. dp[i]=앞 i글자 최소 컷', W/2, H*0.10+22);
      // string aabba -> a|abba? no; show aab|b|a or aa|b|b|a; show palindrome cuts
      ctx.fillStyle='#dfeefb'; ctx.font='600 16px monospace';
      ctx.fillText('a  a  b  a  a', W/2, H*0.32);
      // cut into "aa | b | aa" (2 cuts) -> all palindromes
      var parts=[['aa','#7ab8ff'],['b','#8fe3b5'],['aa','#7ab8ff']]; var bx=W*0.5-(parts.length*100)/2, by=H*0.42;
      parts.forEach(function(pp,i){ var x=bx+i*100; ctx.fillStyle='rgba(122,184,255,0.12)'; ctx.strokeStyle=pp[1]; ctx.lineWidth=2; ctx.fillRect(x,by,88,34); ctx.strokeRect(x,by,88,34); ctx.fillStyle=pp[1]; ctx.font='600 15px monospace'; ctx.fillText(pp[0],x+44,by+22); });
      ctx.fillStyle='#8fe3b5'; ctx.font='600 13px sans-serif';
      ctx.fillText('aa | b | aa — 컷 2번, 세 조각 모두 회문', W/2, H*0.62);
      ctx.fillStyle='#ffb27a'; ctx.font='600 14px sans-serif';
      ctx.fillText('dp[i] = min over j<i ( dp[j] + 1 )  단, s[j..i)가 회문일 때', W/2, H*0.74);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('회문 여부 isPal[j][i]를 2D DP로 O(n²) 선계산 → 전체 O(n²)', W/2, H*0.84);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('변형: 모든 조각 회문 분할 수, 최장 회문 부분수열=LCS(s,역s). 회문트리·매내처로 가속', W/2, H*0.84+20); }
  },

  { id:'algo_br_stirling', concept:true, branchOf:'algo7_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('스털링·벨 수 — 집합을 그룹으로 나누는 가짓수', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('S(n,k)=n개를 비지 않은 k그룹으로 나누기. 벨 수 B(n)=Σ_k S(n,k)(모든 분할)', W/2, H*0.10+22);
      // partitions of {1,2,3} into groups
      ctx.fillStyle='#dfeefb'; ctx.font='600 14px sans-serif';
      ctx.fillText('{1,2,3}의 분할 = 벨 수 B(3) = 5', W/2, H*0.30);
      var parts=['{1,2,3}','{1,2}{3}','{1,3}{2}','{2,3}{1}','{1}{2}{3}'];
      var ks=['k=1','k=2','k=2','k=2','k=3'];
      var bx=W*0.5-(parts.length*92)/2, by=H*0.40;
      parts.forEach(function(p,i){ var x=bx+i*92; ctx.fillStyle='rgba(122,184,255,0.12)'; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=1.5; ctx.fillRect(x,by,84,40); ctx.strokeRect(x,by,84,40); ctx.fillStyle='#dfeefb'; ctx.font='11px monospace'; ctx.fillText(p,x+42,by+18); ctx.fillStyle='#8fe3b5'; ctx.font='10px sans-serif'; ctx.fillText(ks[i],x+42,by+33); });
      ctx.fillStyle='#8fe3b5'; ctx.font='600 13px sans-serif';
      ctx.fillText('S(3,1)=1, S(3,2)=3, S(3,3)=1  →  B(3)=1+3+1=5', W/2, H*0.62);
      ctx.fillStyle='#ffb27a'; ctx.font='600 14px sans-serif';
      ctx.fillText('점화: S(n,k) = k·S(n−1,k) + S(n−1,k−1)', W/2, H*0.74);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('새 원소를 기존 k그룹 중 하나(k가지)에 넣거나, 혼자 새 그룹(k−1→k). 제2종 스털링', W/2, H*0.84);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('제1종 스털링=순열의 사이클 수 분포. 벨=종/EGF e^(e^x−1). 카탈란·이항과 함께 조합 기둥', W/2, H*0.84+20); }
  },

  { id:'algo_br_fastfib', concept:true, branchOf:'algo7_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('빠른 피보나치 — 두 배 공식으로 O(log n)', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('F(n)을 한 칸씩이 아니라 n을 절반씩 줄여 계산. 행렬거듭제곱보다 가벼운 항등식', W/2, H*0.10+22);
      ctx.fillStyle='#dfeefb'; ctx.font='600 15px sans-serif';
      ctx.fillText('두 배 공식 (fast doubling):', W/2, H*0.30);
      ctx.fillStyle='#cfd8e6'; ctx.font='15px sans-serif';
      ctx.fillText('F(2k)   = F(k) · ( 2·F(k+1) − F(k) )', W/2, H*0.42);
      ctx.fillText('F(2k+1) = F(k+1)² + F(k)²', W/2, H*0.52);
      ctx.fillStyle='#ffb27a'; ctx.font='600 13px sans-serif';
      ctx.fillText('(F(k), F(k+1))을 알면 (F(2k), F(2k+1))을 곱셈 몇 번에', W/2, H*0.66);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('n의 이진 비트를 위에서 아래로 보며 한 비트마다 두 배+1 → O(log n) 곱셈', W/2, H*0.78);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('행렬 [[1,1],[1,0]]^n 과 같은 결과지만 곱셈 수가 적음(2×2 행렬 8곱 vs 3~4곱)', W/2, H*0.86);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('mod로 거대 n의 F(n)을 즉시. 일반 선형점화식은 행렬거듭제곱·키타마사로', W/2, H*0.86+20); }
  },

  { id:'algo_br_graphcolor', concept:true, branchOf:'algo6_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('그래프 채색 — 이웃끼리 다른 색, 탐욕적으로', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('인접 정점은 다른 색. 최소 색 수(채색수)는 NP-난해지만, 탐욕은 Δ+1색 보장', W/2, H*0.10+22);
      var N={a:[0.30,0.32,'#7ab8ff'],b:[0.58,0.28,'#8fe3b5'],c:[0.72,0.55,'#7ab8ff'],d:[0.44,0.60,'#ffb27a'],e:[0.26,0.62,'#8fe3b5']};
      var edges=[['a','b'],['b','c'],['c','d'],['d','e'],['e','a'],['a','d'],['b','d']];
      function xy(t){ return [W*N[t][0], H*0.22+N[t][1]*H*0.5]; }
      edges.forEach(function(e){ var p=xy(e[0]),q=xy(e[1]); ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(p[0],p[1]); ctx.lineTo(q[0],q[1]); ctx.stroke(); });
      Object.keys(N).forEach(function(k){ var p=xy(k); ctx.fillStyle=N[k][2]; ctx.strokeStyle='#dfeefb'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(p[0],p[1],15,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.fillStyle='#0d1117'; ctx.font='600 12px sans-serif'; ctx.fillText(k.toUpperCase(),p[0],p[1]+4); });
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('탐욕: 정점을 순서대로 보며, 이웃이 안 쓴 가장 작은 색 번호 배정', W/2, H*0.82);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('항상 ≤ Δ+1색(Δ=최대 차수). 순서에 따라 색 수 달라짐(최적은 NP). Welsh-Powell=큰차수 먼저', W/2, H*0.90);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('쓰임: 레지스터 할당·시험 시간표·주파수 배정·스도쿠. 이분=2색, 평면=4색 정리', W/2, H*0.90+18); }
  },

  { id:'algo_br_fenwickrange', concept:true, branchOf:'algo5_04',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('펜윅 구간 갱신 — 두 BIT로 구간+구간', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('기본 펜윅은 점 갱신+구간 합. 차분과 보조 BIT를 더하면 구간 갱신+구간 합을 O(log n)에', W/2, H*0.10+22);
      ctx.fillStyle='#cfd8e6'; ctx.font='13px sans-serif'; ctx.textAlign='left';
      var lines=['차분(difference): [l,r]에 +v → diff[l]+=v, diff[r+1]−=v',
        'prefix[i] = Σ diff = 원소값. 구간합엔 i·diff 보정이 필요',
        'BIT1: Σ diff,  BIT2: Σ (i−1)·diff 두 개를 유지',
        'prefix합(i) = i·query(BIT1, i) − query(BIT2, i)'];
      lines.forEach(function(t,i){ ctx.fillText(t, W*0.10, H*0.34+i*28); });
      ctx.textAlign='center';
      ctx.fillStyle='#ffb27a'; ctx.font='600 13px sans-serif';
      ctx.fillText('두 펜윅(원래 차분 + i 가중 차분)으로 구간갱신·구간합 모두 O(log n)', W/2, H*0.76);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('lazy 세그트리와 같은 능력을, 더 적은 상수·간단한 코드로(합 연산 한정)', W/2, H*0.86);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('점갱신+구간합=BIT 1개, 구간갱신+점질의=차분 BIT 1개, 구간+구간=BIT 2개', W/2, H*0.86+20); }
  },

  { id:'algo_br_medians', branchOf:'algo3_05',
    code:[
      'SELECT(A, k):                   // k번째 작은 값',
      '  if |A| ≤ 5: return 정렬후 A[k]',
      '  5개씩 묶어 각 그룹 중앙값 → meds',
      '  pivot ← SELECT(meds, |meds|/2) // 중앙값의 중앙값',
      '  p ← partition(A, pivot)        // pivot 기준 분할',
      '  if k == p: return A[p]',
      '  if k < p:  recurse 왼쪽',
      '  else:      recurse 오른쪽(≤ 7n/10)'
    ],
    build:function(V){
      // 15 elements = 3 groups of 5. 결정론적 고정.
      var A=[12,3,5,7,4,  19,11,1,9,8,  2,15,6,14,10], n=A.length, B=5;
      var groups=[]; for(var g=0; g*B<n; g++){ groups.push(A.slice(g*B,g*B+B)); }
      // group medians (sorted middle)
      var meds=groups.map(function(grp){ var s=grp.slice().sort(function(a,b){return a-b;}); return s[2]; });
      var medsSorted=meds.slice().sort(function(a,b){return a-b;});
      var pivot=medsSorted[Math.floor(meds.length/2)]; // 중앙값의 중앙값
      // count smaller / larger than pivot in full array
      var smaller=A.filter(function(v){return v<pivot;}).length;
      var larger=A.filter(function(v){return v>pivot;}).length;
      var st=[];
      function snap(line,cap,o){ o=o||{};
        st.push({line:line,cap:cap,arr:A.slice(),n:n,B:B,groups:groups,meds:meds.slice(),
          pivot:(o.pivot==null?-1:o.pivot), gi:(o.gi==null?-1:o.gi),
          medsShown:(o.medsShown==null?0:o.medsShown),
          smaller:(o.smaller==null?-1:o.smaller), larger:(o.larger==null?-1:o.larger),
          mode:o.mode||''}); }
      snap([0],'원소 15개에서 <b>k번째 작은 값</b>을 찾습니다. 퀵셀렉트의 피벗 운을 없애려고 항상 좋은 피벗을 만듭니다.',{mode:'intro'});
      snap([2],'원소들을 <b>5개씩 3그룹</b>으로 묶습니다. 각 그룹이 작아 그룹 중앙값을 O(1)에 구할 수 있습니다.',{mode:'group'});
      for(var g=0; g<groups.length; g++){
        var sortedGrp=groups[g].slice().sort(function(a,b){return a-b;});
        snap([2],'그룹 '+(g+1)+' = ['+groups[g].join(', ')+'] 정렬 → ['+sortedGrp.join(', ')+'], 가운데 값 <b>중앙값 = '+meds[g]+'</b>.',{gi:g,medsShown:g+1,mode:'gmed'});
      }
      snap([3],'그룹 중앙값들 <b>meds = ['+meds.join(', ')+']</b> 에서 다시 <b>중앙값</b>을 재귀로 구함 → 피벗.',{medsShown:groups.length,mode:'medofmed'});
      snap([3],'<b>중앙값의 중앙값 = '+pivot+'</b> 를 피벗으로 씁니다. 항상 "충분히 좋은" 피벗.',{pivot:pivot,medsShown:groups.length,mode:'pivot'});
      snap([4],'이제 피벗 <b>'+pivot+'</b> 기준으로 전체 15개를 작은 값 / 큰 값으로 <b>분할</b>합니다.',{pivot:pivot,medsShown:groups.length,mode:'pivot'});
      snap([4],'분할 결과: 피벗보다 작은 값 <b>'+smaller+'개</b>, 큰 값 <b>'+larger+'개</b>.',{pivot:pivot,medsShown:groups.length,smaller:smaller,larger:larger,mode:'partition'});
      snap([7],'양쪽이 각각 <b>≥ 약 3n/10</b> 라 분할이 최소 <b>30:70</b>. 큰 쪽 ≤ 7n/10 으로만 재귀 → T(n)=T(n/5)+T(7n/10)+O(n) = <b>O(n)</b>.',{pivot:pivot,medsShown:groups.length,smaller:smaller,larger:larger,mode:'done'});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H,B=f.B;
      ctx.textAlign='center'; ctx.fillStyle='#cfd8e6'; ctx.font='600 15px sans-serif';
      ctx.fillText('중앙값의 중앙값 (BFPRT) — 5개씩 묶어 좋은 피벗 만들기', W/2, H*0.085);
      var G=f.groups, ng=G.length;
      var cw=Math.min(54,(W*0.26)/B), gap=5, gw=B*cw+(B-1)*gap;
      var gtotal=ng*gw+(ng-1)*40, gx0=W/2-gtotal/2, gy=H*0.20, ch=42;
      // partition mode: show smaller/larger split bar instead of groups detail? keep groups always, add split below.
      for(var g=0; g<ng; g++){
        var gx=gx0+g*(gw+40);
        var grpShown=(f.medsShown>g) || f.mode==='partition' || f.mode==='done' || f.mode==='medofmed' || f.mode==='pivot';
        var grpActive=(g===f.gi);
        for(var c=0;c<B;c++){
          var v=G[g][c], x=gx+c*(cw+gap);
          var isMed=(grpShown && v===f.meds[g]);
          var col,fill,tcol;
          if(f.pivot>=0 && v===f.pivot){ col='#ffb27a'; fill='rgba(255,178,122,0.34)'; tcol='#ffb27a'; }
          else if(isMed){ col='#8fe3b5'; fill='rgba(143,227,181,0.24)'; tcol='#8fe3b5'; }
          else if(grpActive){ col='#7ab8ff'; fill='rgba(122,184,255,0.20)'; tcol='#dfeefb'; }
          else { col='#3c4a5e'; fill='rgba(122,184,255,0.09)'; tcol='#9fb0c4'; }
          ctx.fillStyle=fill; ctx.strokeStyle=col; ctx.lineWidth=(isMed||(f.pivot>=0&&v===f.pivot))?2.4:1.2;
          if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(x,gy,cw,ch,6); ctx.fill(); ctx.stroke(); }
          else { ctx.fillRect(x,gy,cw,ch); ctx.strokeRect(x,gy,cw,ch); }
          ctx.fillStyle=tcol; ctx.font='600 15px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.fillText(v, x+cw/2, gy+ch/2); ctx.textBaseline='alphabetic';
        }
        ctx.fillStyle=grpActive?'#7ab8ff':'#7f8a9b'; ctx.font='11px sans-serif'; ctx.textAlign='center';
        ctx.fillText('그룹 '+(g+1), gx+gw/2, gy-8);
      }
      // medians row
      if(f.medsShown>0){
        var my=gy+ch+44;
        ctx.fillStyle='#8fe3b5'; ctx.font='12px sans-serif'; ctx.textAlign='center';
        ctx.fillText('그룹 중앙값 meds', W/2, my-10);
        var mn=f.medsShown, mcw=48, mgap=10, mtot=mn*mcw+(mn-1)*mgap, mx0=W/2-mtot/2;
        for(var m=0;m<mn;m++){
          var mv=f.meds[m], mx=mx0+m*(mcw+mgap);
          var isPv=(f.pivot>=0 && mv===f.pivot);
          ctx.fillStyle=isPv?'rgba(255,178,122,0.34)':'rgba(143,227,181,0.22)';
          ctx.strokeStyle=isPv?'#ffb27a':'#8fe3b5'; ctx.lineWidth=isPv?2.4:1.6;
          if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(mx,my,mcw,34,6); ctx.fill(); ctx.stroke(); }
          else { ctx.fillRect(mx,my,mcw,34); }
          ctx.fillStyle=isPv?'#ffb27a':'#8fe3b5'; ctx.font='600 16px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.fillText(mv, mx+mcw/2, my+17); ctx.textBaseline='alphabetic';
        }
      }
      // pivot + partition info
      if(f.pivot>=0){
        ctx.textAlign='center'; ctx.fillStyle='#ffb27a'; ctx.font='600 17px sans-serif';
        ctx.fillText('피벗 = 중앙값의 중앙값 = '+f.pivot, W/2, H*0.74);
      }
      if(f.smaller>=0){
        var by=H*0.80, bw=Math.min(W*0.7,420), bx=W/2-bw/2, bh=30;
        var sFrac=f.smaller/f.n;
        ctx.fillStyle='rgba(122,184,255,0.25)'; ctx.fillRect(bx,by,bw*sFrac,bh);
        ctx.fillStyle='rgba(244,160,192,0.22)'; ctx.fillRect(bx+bw*sFrac,by,bw*(1-sFrac),bh);
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1.4; ctx.strokeRect(bx,by,bw,bh);
        ctx.fillStyle='#7ab8ff'; ctx.font='600 12px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText('작은 값 '+f.smaller+'개', bx+bw*sFrac/2, by+bh/2);
        ctx.fillStyle='#f4a0c0';
        ctx.fillText('큰 값 '+f.larger+'개', bx+bw*sFrac+bw*(1-sFrac)/2, by+bh/2);
        ctx.textBaseline='alphabetic';
        ctx.fillStyle='#9b99a3'; ctx.font='11px sans-serif';
        ctx.fillText('양쪽 각각 ≥ 약 3n/10 → 분할이 최소 30:70 보장 (한쪽 ≤ 7n/10)', W/2, by+bh+18);
      }
      ctx.fillStyle='#9b99a3'; ctx.font='11px sans-serif'; ctx.textAlign='center';
      ctx.fillText('초록=그룹 중앙값 · 주황=중앙값의 중앙값(피벗)', W/2, H*0.965); }
  },

  { id:'algo_br_kitamasa', concept:true, branchOf:'algo7_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('키타마사 — 선형 점화식의 N번째 항을 빠르게', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('차수 L 선형점화의 a_N을 행렬거듭제곱(O(L³ log N))보다 빠른 O(L² log N)에', W/2, H*0.10+22);
      ctx.fillStyle='#dfeefb'; ctx.font='600 14px sans-serif';
      ctx.fillText('aₙ = c₁aₙ₋₁ + … + c_L aₙ₋_L  의 N번째 항', W/2, H*0.30);
      ctx.fillStyle='#cfd8e6'; ctx.font='13px sans-serif'; ctx.textAlign='left';
      var lines=['아이디어: a_N = Σ (xᴺ mod 특성다항식 f(x))의 계수 · a_초기',
        'f(x) = xᴸ − c₁xᴸ⁻¹ − … − c_L (특성 다항식)',
        'xᴺ mod f(x) 를 빠른 거듭제곱 + 다항식 mod 로 계산',
        '각 곱셈/나머지가 O(L²) (또는 NTT면 O(L log L))'];
      lines.forEach(function(t,i){ ctx.fillText(t, W*0.10, H*0.40+i*26); });
      ctx.textAlign='center';
      ctx.fillStyle='#ffb27a'; ctx.font='600 13px sans-serif';
      ctx.fillText('xᴺ을 f(x)로 나눈 나머지(차수<L)의 계수가 곧 초기항 결합 가중치', W/2, H*0.78);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('벨캄프-매시로 점화식을 복원한 뒤 키타마사로 N항 — 미지 수열의 강력 콤보', W/2, H*0.86);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('행렬거듭제곱과 동치지만 다항식이라 L에 비해 빠름. 거대 N의 피보나치·DP수열', W/2, H*0.86+20); }
  },

  { id:'algo_br_hall', concept:true, branchOf:'algo6_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('Hall의 결혼 정리 — 완전 매칭이 가능한 조건', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('왼쪽을 모두 짝지을 수 있다 ⟺ 어떤 부분집합 S도 이웃 수 |N(S)| ≥ |S|', W/2, H*0.10+22);
      var L=[[0.30,0.30,'a'],[0.30,0.48,'b'],[0.30,0.66,'c']];
      var R=[[0.70,0.30,'x'],[0.70,0.48,'y'],[0.70,0.66,'z']];
      var edges=[[0,0],[0,1],[1,1],[2,1],[2,2]];
      edges.forEach(function(e){ var a=L[e[0]],b=R[e[1]]; ctx.strokeStyle='rgba(122,184,255,0.4)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(W*a[0],H*a[1]); ctx.lineTo(W*b[0],H*b[1]); ctx.stroke(); });
      function dots(arr,col){ arr.forEach(function(p){ ctx.fillStyle='rgba(122,184,255,0.16)'; ctx.strokeStyle=col; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(W*p[0],H*p[1],14,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.fillStyle='#dfeefb'; ctx.font='600 12px sans-serif'; ctx.fillText(p[2],W*p[0],H*p[1]+4); }); }
      dots(L,'#7ab8ff'); dots(R,'#ffb27a');
      ctx.fillStyle='#ff8d8d'; ctx.font='12px sans-serif'; ctx.fillText('S={b,c}의 이웃 = {y,z}? 아니 {y} → |N(S)|=1 < 2', W/2, H*0.80);
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('Hall 조건 위반(b,c가 모두 y만 가리킴) → 완전 매칭 불가능', W/2, H*0.88);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('증명·구성은 쾨니그/최대유량과 동치. 결혼·배정·라틴방진·정규그래프 1-인수분해', W/2, H*0.88+18); }
  },

  { id:'algo_br_altsubseq', concept:true, branchOf:'algo7_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('최장 교대 부분수열 — 오르락내리락 가장 길게', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('연속 차이의 부호가 번갈아(↑↓↑↓) 가장 긴 부분수열. 봉우리·골 개수 세기', W/2, H*0.10+22);
      // zigzag sequence
      var vals=[1,5,2,7,3,6,4]; var bx=W*0.16, baseY=H*0.62, gap=(W*0.68)/(vals.length-1);
      ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2.5; ctx.beginPath();
      vals.forEach(function(v,i){ var x=bx+i*gap, y=baseY-v*H*0.05; if(i===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); }); ctx.stroke();
      vals.forEach(function(v,i){ var x=bx+i*gap, y=baseY-v*H*0.05; var ext=(i>0&&i<vals.length-1); ctx.fillStyle=ext?'#ffb27a':'#8fe3b5'; ctx.beginPath(); ctx.arc(x,y,5,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#8a8893'; ctx.font='11px sans-serif'; ctx.fillText(v,x,baseY+16); });
      ctx.fillStyle='#ffb27a'; ctx.font='12px sans-serif'; ctx.fillText('주황 = 봉우리/골(방향 전환점)', W/2, H*0.78);
      ctx.fillStyle='#ffb27a'; ctx.font='600 14px sans-serif';
      ctx.fillText('up = (aᵢ>aᵢ₋₁ ? down+1 : up),  down = (aᵢ<aᵢ₋₁ ? up+1 : down)', W/2, H*0.86);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('탐욕/DP로 O(n): 방향이 바뀔 때마다 길이 +1. 답 = max(up, down)', W/2, H*0.92);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('LIS는 O(n log n)인데 교대수열은 단조 구간을 한 점으로 줄여 O(n). 주식 거래 변형', W/2, H*0.92+18); }
  },

  { id:'algo_br_multipoint', branchOf:'algo8_03',
    code:[
      'MULTIPOINT-EVAL(f, x0..x3):     // f를 여러 점에서',
      '  // 1) 부분곱 트리: 잎=(x - x_i)',
      '  내부노드 ← 자식 두 다항식의 곱',
      '  // 2) 위→아래로 나머지 전파',
      '  루트에서 r = f',
      '  각 노드: r ← f mod (그 노드의 곱)',
      '  잎 (x - x_i) 의 나머지 = 상수 = f(x_i)',
      '  return [f(x0), f(x1), f(x2), f(x3)]'
    ],
    build:function(V){
      // f(x) = x^2 - 3x + 2  evaluate at points 0,1,2,3
      // f(0)=2, f(1)=0, f(2)=0, f(3)=2
      var xs=[0,1,2,3];
      function f(x){ return x*x-3*x+2; }
      // subproduct tree nodes (7 nodes: 4 leaves + 2 mid + 1 root)
      // positions in a binary tree drawn top-down
      var nodes=[
        {id:0,par:-1,kids:[1,2],depth:0,xpos:0.5, lab:'(x-x0)(x-x1)(x-x2)(x-x3)', short:'전체 곱'},
        {id:1,par:0,kids:[3,4],depth:1,xpos:0.27,lab:'(x-x0)(x-x1)', short:'좌 곱'},
        {id:2,par:0,kids:[5,6],depth:1,xpos:0.73,lab:'(x-x2)(x-x3)', short:'우 곱'},
        {id:3,par:1,kids:[],depth:2,xpos:0.15,lab:'(x-0)', short:'x-0', xi:0},
        {id:4,par:1,kids:[],depth:2,xpos:0.39,lab:'(x-1)', short:'x-1', xi:1},
        {id:5,par:2,kids:[],depth:2,xpos:0.61,lab:'(x-2)', short:'x-2', xi:2},
        {id:6,par:2,kids:[],depth:2,xpos:0.85,lab:'(x-3)', short:'x-3', xi:3}
      ];
      var st=[];
      function snap(line,cap,nodeset,cur,phase,vals){
        st.push({line:line,cap:cap,nodes:nodes,
          built:(nodeset||[]).slice(), cur:(cur==null?-1:cur),
          phase:phase||'', vals:(vals||[]).slice()}); }
      snap(0,'<b>다중 점 평가</b>: 한 다항식 f를 여러 점에서 한꺼번에 계산. f(x)=x²−3x+2 를 x=0,1,2,3 에서 평가합니다.',[],-1,'',[]);
      // build leaves
      snap([1],'먼저 <b>부분곱 트리</b>의 잎을 만듭니다: 각 점 x_i 마다 (x − x_i).',[3,4,5,6],-1,'build',[]);
      snap([2],'두 잎을 곱해 중간 노드를 만듭니다: (x−0)(x−1), (x−2)(x−3).',[3,4,5,6,1,2],-1,'build',[]);
      snap([2],'중간 노드 둘을 곱해 <b>루트</b>(전체 곱)를 완성 — 트리가 다 세워졌습니다.',[0,1,2,3,4,5,6],0,'build',[]);
      // descent
      snap([4,5],'이제 <b>위→아래로 나머지</b>를 전파합니다. 루트에서 r = f 로 시작합니다.',[0,1,2,3,4,5,6],0,'desc',[]);
      snap([5],'왼쪽 노드: r ← f mod (x−0)(x−1). 오른쪽: r ← f mod (x−2)(x−3). 각자 작은 나머지로 줄어듭니다.',[0,1,2,3,4,5,6],1,'desc',[]);
      // leaves -> values
      var vals=[];
      for(var k=0;k<xs.length;k++){
        vals.push(f(xs[k]));
        var leafId=3+k;
        snap([6],'잎 (x−'+xs[k]+') 에서의 나머지는 상수 = <b>f('+xs[k]+') = '+f(xs[k])+'</b>.',[0,1,2,3,4,5,6],leafId,'leaf',vals.slice());
      }
      snap(7,'<b>완료!</b> [f(0),f(1),f(2),f(3)] = ['+xs.map(f).join(', ')+']. 트리로 나눠 평가해 <b>O(M(n) log n)</b> — 점마다 따로 푸는 것보다 빠릅니다.',[0,1,2,3,4,5,6],-1,'done',xs.map(f));
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H,N=f.nodes;
      function NX(n){ return W*0.08+n.xpos*W*0.84; }
      function NY(n){ return H*0.18+n.depth*H*0.24; }
      ctx.textAlign='center'; ctx.fillStyle='#cfd8e6'; ctx.font='600 14px sans-serif';
      ctx.fillText('다중 점 평가 — 부분곱(나머지) 트리', W/2, H*0.085);
      // edges
      ctx.lineWidth=1.6;
      for(var i=0;i<N.length;i++){ var n=N[i];
        if(f.built.indexOf(n.id)<0) continue;
        for(var k=0;k<n.kids.length;k++){ var c=N[n.kids[k]];
          if(f.built.indexOf(c.id)<0) continue;
          var act=(f.phase==='desc'||f.phase==='leaf'||f.phase==='done');
          ctx.strokeStyle=act?'rgba(143,227,181,0.35)':'rgba(122,184,255,0.30)';
          ctx.beginPath(); ctx.moveTo(NX(n),NY(n)); ctx.lineTo(NX(c),NY(c)); ctx.stroke();
        }
      }
      // nodes
      for(i=0;i<N.length;i++){ var nd=N[i];
        if(f.built.indexOf(nd.id)<0) continue;
        var x=NX(nd),y=NY(nd), isCur=(nd.id===f.cur);
        var isLeaf=(nd.kids.length===0);
        var solved=(f.phase==='done')||(isLeaf&&f.vals.length>(nd.xi==null?-1:nd.xi));
        var col=isCur?'#ffb27a':solved?'#8fe3b5':'#7ab8ff';
        var fc=isCur?'rgba(255,178,122,0.18)':solved?'rgba(143,227,181,0.14)':'rgba(122,184,255,0.10)';
        var w=isLeaf?54:96, h=30;
        ctx.fillStyle=fc; ctx.strokeStyle=col; ctx.lineWidth=isCur?2.4:1.8;
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x-w/2,y-h/2,w,h,7);}else{ctx.beginPath();ctx.rect(x-w/2,y-h/2,w,h);}
        ctx.fill(); ctx.stroke();
        ctx.fillStyle=col; ctx.font=(isLeaf?'600 12px':'11px')+' monospace';
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(isLeaf?nd.lab:nd.lab.length>16?nd.short:nd.lab, x, y);
        ctx.textBaseline='alphabetic';
        // value under leaf
        if(isLeaf && nd.xi!=null && f.vals.length>nd.xi){
          ctx.fillStyle='#8fe3b5'; ctx.font='600 13px monospace'; ctx.textAlign='center';
          ctx.fillText('f('+nd.xi+')='+f.vals[nd.xi], x, y+h/2+18);
        }
      }
      // result row
      if(f.phase==='done'){
        ctx.textAlign='center'; ctx.fillStyle='#8fe3b5'; ctx.font='600 14px sans-serif';
        ctx.fillText('결과 = ['+f.vals.join(', ')+']', W/2, H*0.96);
      } else {
        ctx.textAlign='left'; ctx.fillStyle='#9b99a3'; ctx.font='11px sans-serif';
        ctx.fillText('f(x) = x² − 3x + 2   ·   주황=현재 노드  초록=나머지 확정/잎 값', W*0.08, H*0.96);
      } }
  },

  { id:'algo_br_binarygcd', concept:true, branchOf:'algo2_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('이진 GCD — 나눗셈 없이 시프트와 뺄셈으로', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('유클리드의 % 대신 2의 인수 빼기·짝수 시프트로. 큰 수·하드웨어에서 빠름(Stein)', W/2, H*0.10+22);
      ctx.fillStyle='#cfd8e6'; ctx.font='14px sans-serif'; ctx.textAlign='left';
      var lines=['둘 다 짝수: gcd(a,b) = 2·gcd(a/2, b/2)',
        '하나만 짝수: 짝수만 /2 (2는 공약수 아님)',
        '둘 다 홀수: gcd(a,b) = gcd(|a−b|, min(a,b))',
        '하나가 0: gcd = 다른 수 × (모은 2의 거듭제곱)'];
      lines.forEach(function(t,i){ ctx.fillStyle=['#7ab8ff','#8fe3b5','#ffb27a','#9a86ff'][i]; ctx.fillText(t, W*0.12, H*0.36+i*30); });
      ctx.textAlign='center';
      ctx.fillStyle='#dfeefb'; ctx.font='600 14px sans-serif';
      ctx.fillText('예: gcd(48,36) → 둘짝 →4·gcd(12,9) → gcd(12,9)→/2..→gcd(3,3)→3 ⇒ 12', W/2, H*0.72);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('나눗셈(%)이 시프트·뺄셈·비교로 대체 → CPU에서 빠름. O(log² max) 비트 연산', W/2, H*0.84);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('빅넘버 라이브러리·암호의 gcd에 표준. 확장판으로 모듈러 역원도', W/2, H*0.84+20); }
  },

  { id:'algo_br_sat', branchOf:'algo8_03',
    code:[
      '// 분리축 정리: 두 볼록이 안 겹침 ⟺ 분리축 존재',
      'for ax in 각 변의 법선(A, B):       // 후보 축',
      '  [minA,maxA] = project(A, ax)      // 내적 투영',
      '  [minB,maxB] = project(B, ax)',
      '  if maxA < minB or maxB < minA:    // 구간 분리?',
      '    return 충돌 아님                // 분리축 발견!',
      'return 충돌                          // 모든 축에서 겹침'
    ],
    build:function(V){ var st=[];
      // A = 삼각형, B = 사각형 (떨어져 있음 → 분리축 존재)
      var A=[[120,300],[230,170],[260,330]];
      var B=[[420,210],[560,180],[580,340],[440,360]];
      // 변의 법선들 (단위) — A의 3변 + B의 4변
      function edgesNormals(P){ var ns=[]; for(var i=0;i<P.length;i++){ var a=P[i],b=P[(i+1)%P.length];
        var ex=b[0]-a[0], ey=b[1]-a[1]; var nx=-ey, ny=ex; var L=Math.hypot(nx,ny); ns.push([nx/L,ny/L,a.slice(),b.slice()]); } return ns; }
      var axes=edgesNormals(A).concat(edgesNormals(B));
      function project(P,ax){ var mn=1e9,mx=-1e9; for(var i=0;i<P.length;i++){ var d=P[i][0]*ax[0]+P[i][1]*ax[1]; if(d<mn)mn=d; if(d>mx)mx=d; } return [mn,mx]; }
      function snap(line,cap,o){ o=o||{};
        st.push({line:line,cap:cap,A:A,B:B,
          axis:o.axis||null, axIdx:o.axIdx==null?-1:o.axIdx, nAxes:axes.length,
          pA:o.pA||null, pB:o.pB||null, sep:o.sep||false, result:o.result||null,
          edge:o.edge||null, mode:o.mode||'try', axisOwner:o.axisOwner||''}); }
      snap([0,1],'<b>분리축 정리(SAT)</b>: 두 <b>볼록</b> 도형이 안 겹친다 ⟺ 어떤 축에 투영했을 때 두 그림자(구간)가 떨어지는 <b>분리축</b>이 하나라도 존재합니다. 후보 축 = 각 변의 법선.',{mode:'intro'});
      // iterate axes; A's first edge normal is between A and B? we hand-pick: first try A edge0 (overlap), then find a separating one.
      var found=false;
      for(var k=0;k<axes.length;k++){
        if(found) break;
        var ax=axes[k];
        var owner=(k<3)?'A':'B';
        var pa=project(A,ax), pb=project(B,ax);
        var sep=(pa[1]<pb[0] || pb[1]<pa[0]);
        snap([2,3],'후보 축 '+(k+1)+'/'+axes.length+' ('+owner+'의 한 변 법선)에 두 도형을 <b>내적으로 투영</b>해 그림자 구간을 구합니다.',{axis:ax,axIdx:k,pA:pa,pB:pb,edge:[ax[2],ax[3]],mode:'project',axisOwner:owner});
        if(sep){
          snap([4,5],'A 구간과 B 구간이 <b>겹치지 않습니다 → 분리축 발견!</b> 두 도형은 <b>충돌 아님</b>으로 즉시 종료합니다.',{axis:ax,axIdx:k,pA:pa,pB:pb,edge:[ax[2],ax[3]],sep:true,result:'NO_COLLISION',mode:'separated',axisOwner:owner});
          found=true;
        } else {
          snap(4,'이 축에서는 두 그림자가 <b>겹칩니다</b> → 아직 분리 판정 불가. 다음 후보 축으로 넘어갑니다.',{axis:ax,axIdx:k,pA:pa,pB:pb,edge:[ax[2],ax[3]],sep:false,mode:'overlap',axisOwner:owner});
        }
      }
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H;
      // 좌표계: build의 점들은 0..700 가정 → 스케일 맞춤
      var SX=W/700, SY=H/520*0.9, OY=H*0.04;
      function tx(p){ return [p[0]*SX, p[1]*SY+OY]; }
      function poly(P,col,fill){ ctx.beginPath(); for(var i=0;i<P.length;i++){ var q=tx(P[i]); if(i===0)ctx.moveTo(q[0],q[1]); else ctx.lineTo(q[0],q[1]); } ctx.closePath();
        ctx.fillStyle=fill; ctx.fill(); ctx.strokeStyle=col; ctx.lineWidth=2.4; ctx.stroke(); }
      var sep=f.sep;
      var aCol=sep?'#8fe3b5':'#7ab8ff', bCol=sep?'#8fe3b5':'#f4a0c0';
      poly(f.A,aCol,sep?'rgba(143,227,181,0.16)':'rgba(122,184,255,0.16)');
      poly(f.B,bCol,sep?'rgba(143,227,181,0.16)':'rgba(244,160,192,0.16)');
      // 라벨
      ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle=aCol; ctx.font='600 15px sans-serif';
      var ca=tx([203,266]); ctx.fillText('A',ca[0],ca[1]);
      ctx.fillStyle=bCol; var cb=tx([500,272]); ctx.fillText('B',cb[0],cb[1]);
      // 현재 검사 변 강조
      if(f.edge){ var e0=tx(f.edge[0]), e1=tx(f.edge[1]);
        ctx.strokeStyle='#ffb27a'; ctx.lineWidth=3.5; ctx.beginPath(); ctx.moveTo(e0[0],e0[1]); ctx.lineTo(e1[0],e1[1]); ctx.stroke(); }
      // 투영 축 + 그림자
      if(f.axis && f.pA && f.pB){
        var ax=f.axis;
        // 축 방향선: 화면 하단을 지나는 축선
        var cx=W*0.5, cy=H*0.80;
        var len=Math.max(W,H);
        // 축 방향 (정규화된 ax[0],ax[1]) — 스케일 무시(방향만)
        var ux=ax[0], uy=ax[1], L=Math.hypot(ux,uy); ux/=L; uy/=L;
        var axColor=f.sep?'#8fe3b5':f.mode==='overlap'?'#f4a0c0':'#ffb27a';
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.setLineDash([4,4]); ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.moveTo(cx-ux*len,cy-uy*len); ctx.lineTo(cx+ux*len,cy+uy*len); ctx.stroke(); ctx.setLineDash([]);
        // 그림자: 투영값을 화면 축선 위 점으로. project 값은 원좌표 내적 → 화면에선 스케일 다르지만 상대만 필요.
        // map projection scalar t → point cx+ (t - tmid)*scale * u
        var allMin=Math.min(f.pA[0],f.pB[0]), allMax=Math.max(f.pA[1],f.pB[1]);
        var mid=(allMin+allMax)/2, span=(allMax-allMin)||1;
        var scale=(Math.min(W,H)*0.42)/span;
        function P(t){ return [cx+(t-mid)*scale*ux, cy+(t-mid)*scale*uy]; }
        // perpendicular offset for two bands
        var px=-uy, py=ux;
        function band(rng,col,off,lbl){ var s=P(rng[0]), e=P(rng[1]);
          ctx.strokeStyle=col; ctx.lineWidth=6;
          ctx.beginPath(); ctx.moveTo(s[0]+px*off,s[1]+py*off); ctx.lineTo(e[0]+px*off,e[1]+py*off); ctx.stroke();
          // 끝 캡
          ctx.fillStyle=col; ctx.font='600 12px sans-serif'; ctx.textAlign='center';
          var mid2=P((rng[0]+rng[1])/2);
          ctx.fillText(lbl, mid2[0]+px*(off+14), mid2[1]+py*(off+14));
        }
        band(f.pA, aCol, -11, 'A그림자');
        band(f.pB, bCol, 11, 'B그림자');
      }
      // 헤더 텍스트
      ctx.textAlign='center'; ctx.textBaseline='alphabetic';
      ctx.fillStyle='#cfd8e6'; ctx.font='600 14px sans-serif';
      if(f.mode==='intro'){ ctx.fillText('볼록 도형 A·B를 각 변의 법선 축에 투영해 그림자가 떨어지는지 검사', W/2, H*0.07); }
      else if(f.axIdx>=0){ ctx.fillText('후보 축 '+(f.axIdx+1)+' / '+f.nAxes+'  ('+f.axisOwner+'의 변 법선)', W/2, H*0.07); }
      // 결과 배지
      var badge, bcol;
      if(f.result==='NO_COLLISION'){ badge='분리축 발견 → 충돌 아님'; bcol='#8fe3b5'; }
      else if(f.mode==='overlap'){ badge='이 축은 겹침 → 다음 축'; bcol='#f4a0c0'; }
      else if(f.mode==='project'){ badge='투영 검사 중'; bcol='#ffb27a'; }
      else { badge='SAT 시작'; bcol='#7ab8ff'; }
      ctx.fillStyle=bcol; ctx.font='600 14px sans-serif';
      ctx.fillText('▶ '+badge, W/2, H*0.965); }
  },

  { id:'algo_br_moupdates', branchOf:'algo3_04',
    code:[
      "MO-WITH-UPDATES:",
      '  질의에 시간 t(직전 갱신 수) 부착',
      '  정렬: (L블록, R블록, t)',
      '  for each 질의 (l, r, t):',
      '    while curT < t: 갱신 적용(T++)',
      '    while curT > t: 갱신 되돌림(T--)',
      '    while R < r: R++  (원소 추가)',
      '    while L > l: L--  (원소 추가)',
      '    while R > r: R--  ; while L < l: L++',
      '    답 ← distinct(현재 [L,R])'
    ],
    build:function(V){
      // 배열 a[1..8], 질의는 "구간 내 서로 다른 값의 수(distinct)".
      var a=[0,1,2,1,3,2,4,1,5];           // 1-based
      var n=8, B=3;                          // 블록 크기(예시; 실제론 n^(2/3))
      // 이벤트(시간순): 질의 Q, 갱신 U. 갱신 = (pos, newVal).
      // 각 질의의 t = 그 전까지 적용된 갱신 수.
      var updates=[ {pos:4,nv:5}, {pos:2,nv:4} ];   // U1: a[4]=5, U2: a[2]=4
      var queries=[
        {id:1,l:2,r:6,t:0},   // 갱신 0개 적용 상태
        {id:2,l:1,r:4,t:1},   // U1 적용 후
        {id:3,l:3,r:8,t:2},   // U1,U2 적용 후
        {id:4,l:5,r:7,t:1}    // U1만 적용 상태
      ];
      function block(x){ return Math.floor((x-1)/B); }
      // 정렬: (l블록, r블록, t)
      var order=queries.slice().sort(function(p,q){
        if(block(p.l)!==block(q.l)) return block(p.l)-block(q.l);
        if(block(p.r)!==block(q.r)) return block(p.r)-block(q.r);
        return p.t-q.t; });
      var st=[];
      // 현재 배열 상태(시간에 따라 변함) — applied 갱신 수 = curT
      function arrAtTime(T){ var b=a.slice(); for(var k=0;k<T;k++) b[updates[k].pos]=updates[k].nv; return b; }
      function distinct(arr,l,r){ var s={},c=0; for(var i=l;i<=r;i++){ if(!s[arr[i]]){s[arr[i]]=1;c++;} } return c; }
      function snap(line,cap,extra){
        var f={line:line,cap:cap,n:n,B:B};
        if(extra) for(var k in extra) f[k]=extra[k];
        st.push(f); }
      var curArr=a.slice();
      var updTxt='U1:a['+updates[0].pos+']='+updates[0].nv+', U2:a['+updates[1].pos+']='+updates[1].nv;
      snap([0,1,2],'배열 a[1..8]. 질의=구간 distinct(서로 다른 값 수). 갱신 '+updTxt+'. '+
        '질의를 <b>(L블록,R블록,t)</b> 로 정렬: '+order.map(function(o){return 'Q'+o.id;}).join('→')+'.',
        {arr:curArr.slice(),L:-1,R:-1,T:0,cur:null,ans:null});
      var L=1,R=0,curT=0;     // 빈 구간에서 시작
      for(var oi=0;oi<order.length;oi++){
        var Q=order[oi];
        snap([3],'<b>Q'+Q.id+'</b> 처리: 목표 [L='+Q.l+', R='+Q.r+'], 시간 t='+Q.t+'. 현재 [L='+L+',R='+R+'], T='+curT+'.',
          {arr:arrAtTime(curT),L:L,R:R,T:curT,cur:Q,ans:null,target:{l:Q.l,r:Q.r,t:Q.t}});
        // 시간 포인터 이동
        while(curT<Q.t){
          curT++;
          var up=updates[curT-1];
          curArr=arrAtTime(curT);
          var inside=(up.pos>=L && up.pos<=R);
          snap([4],'시간 T: '+( curT-1)+'→'+curT+' — 갱신 U'+curT+' 적용 a['+up.pos+']='+up.nv+'. '+
            (inside?'위치 '+up.pos+'이 [L,R] 안 → <b>답에 반영</b>.':'위치 '+up.pos+'이 [L,R] 밖 → 배열만 바꿈.'),
            {arr:curArr.slice(),L:L,R:R,T:curT,cur:Q,ans:null,target:{l:Q.l,r:Q.r,t:Q.t},updHit:up.pos});
        }
        while(curT>Q.t){
          var up2=updates[curT-1];
          curT--;
          curArr=arrAtTime(curT);
          snap([5],'시간 T: '+(curT+1)+'→'+curT+' — 갱신 U'+(curT+1)+' <b>되돌림</b> a['+up2.pos+'] 복구.',
            {arr:curArr.slice(),L:L,R:R,T:curT,cur:Q,ans:null,target:{l:Q.l,r:Q.r,t:Q.t},updHit:up2.pos});
        }
        // 구간 포인터 이동 (한 줄로 요약, 실제 이동 수행)
        while(R<Q.r){ R++; }
        while(L>Q.l){ L--; }
        while(R>Q.r){ R--; }
        while(L<Q.l){ L++; }
        snap([6,7,8],'L·R 포인터를 한 칸씩 옮겨 구간을 [L='+L+', R='+R+'] 로 맞춥니다.',
          {arr:arrAtTime(curT),L:L,R:R,T:curT,cur:Q,ans:null,target:{l:Q.l,r:Q.r,t:Q.t}});
        var ans=distinct(arrAtTime(curT),L,R);
        snap([9],'<b>Q'+Q.id+' 답</b> = distinct([' +L+','+R+'], 시간 '+curT+') = <b>'+ans+'</b>.',
          {arr:arrAtTime(curT),L:L,R:R,T:curT,cur:Q,ans:ans,target:{l:Q.l,r:Q.r,t:Q.t},answered:Q.id});
      }
      snap([0],'<b>완료!</b> 세 포인터 L·R·T를 조금씩만 움직여 모든 질의를 처리. 블록 n^(2/3) → 전체 <b>O(n^(5/3))</b>.',
        {arr:arrAtTime(curT),L:L,R:R,T:curT,cur:null,ans:null,done:true});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H;
      var n=f.n, arr=f.arr;
      var cw=Math.min(60,(W*0.82)/n), x0=W/2-n*cw/2, baseY=H*0.42;
      // 시간 포인터 라인
      ctx.textAlign='center'; ctx.font='600 14px sans-serif'; ctx.fillStyle='#c9a8ff';
      ctx.fillText('시간 포인터 T = '+f.T+'  (적용된 갱신 수)', W/2, H*0.13);
      // 블록 경계 배경
      for(var bk=0; bk*f.B<n; bk++){
        var bx=x0+(bk*f.B)*cw, bwid=Math.min(f.B,n-bk*f.B)*cw;
        if(bk%2===0){ ctx.fillStyle='rgba(255,255,255,0.03)'; ctx.fillRect(bx,baseY-6,bwid,cw+34); }
      }
      // 셀
      var tg=f.target;
      for(var i=1;i<=n;i++){
        var x=x0+(i-1)*cw, val=arr[i];
        var inRange=(f.L>=1 && f.R>=f.L && i>=f.L && i<=f.R);
        var inTarget=(tg && i>=tg.l && i<=tg.r);
        var hit=(i===f.updHit);
        var col,fil;
        if(hit){ col='#c9a8ff'; fil='rgba(201,168,255,0.30)'; }
        else if(inRange){ col='#8fe3b5'; fil='rgba(143,227,181,0.24)'; }
        else if(inTarget){ col='#ffb27a'; fil='rgba(255,178,122,0.10)'; }
        else { col='#7ab8ff'; fil='rgba(122,184,255,0.10)'; }
        if(hit){ ctx.save(); ctx.shadowColor='#c9a8ff'; ctx.shadowBlur=14; }
        ctx.fillStyle=fil; ctx.strokeStyle=col; ctx.lineWidth=(inRange||hit)?2.2:1.4;
        ctx.fillRect(x+3,baseY,cw-6,cw); ctx.strokeRect(x+3,baseY,cw-6,cw);
        if(hit) ctx.restore();
        ctx.fillStyle=col; ctx.font='600 18px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(val,x+cw/2,baseY+cw/2);
        ctx.fillStyle='#9b99a3'; ctx.font='10px sans-serif'; ctx.textBaseline='alphabetic';
        ctx.fillText(i,x+cw/2,baseY+cw+13);
      }
      // L / R 포인터 화살표
      function ptr(idx,label,color){
        if(idx<1||idx>n) return;
        var px=x0+(idx-1)*cw+cw/2;
        ctx.fillStyle=color; ctx.font='600 13px sans-serif'; ctx.textAlign='center';
        ctx.fillText(label, px, baseY-12);
        ctx.beginPath(); ctx.moveTo(px,baseY-8); ctx.lineTo(px-5,baseY-2); ctx.lineTo(px+5,baseY-2); ctx.closePath(); ctx.fill();
      }
      if(f.L>=1 && f.R>=f.L){ ptr(f.L,'L','#8fe3b5'); ptr(f.R,'R','#8fe3b5'); }
      // 목표 구간 표시 막대
      if(tg){
        var tx0=x0+(tg.l-1)*cw+3, tx1=x0+(tg.r-1)*cw+cw-3;
        ctx.strokeStyle='#ffb27a'; ctx.lineWidth=2; ctx.setLineDash([5,4]);
        ctx.beginPath(); ctx.moveTo(tx0,baseY+cw+22); ctx.lineTo(tx1,baseY+cw+22); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle='#ffb27a'; ctx.font='11px sans-serif'; ctx.textAlign='center';
        ctx.fillText('목표 [L='+tg.l+', R='+tg.r+'], t='+tg.t, (tx0+tx1)/2, baseY+cw+38);
      }
      // 답 표시
      if(f.ans!=null){
        ctx.fillStyle='#8fe3b5'; ctx.font='600 17px sans-serif'; ctx.textAlign='center';
        ctx.fillText('distinct = '+f.ans, W/2, H*0.78);
      }
      ctx.fillStyle='#8a8893'; ctx.font='11px sans-serif'; ctx.textAlign='center';
      ctx.fillText('초록 = 현재 [L,R]  ·  주황 점선 = 목표 구간  ·  보라 = 갱신된 칸', W/2, H*0.90); }
  },

  { id:'algo_br_fordjohnson', branchOf:'algo3_04',
    code:[
      'FORD-JOHNSON(A):',
      '  쌍으로 묶어 각 쌍 1번씩 비교',
      '    → 큰 쪽(b) / 작은 쪽(a)',
      '  주 사슬 ← 큰 쪽들을 재귀 정렬',
      '  주 사슬 앞에 b들의 짝 a₁ 삽입',
      '  남은 a들을 야코브스탈 순서로',
      '    이분 삽입(2의 거듭제곱 구간)',
      '  return 주 사슬   // 비교 ≈ ⌈log₂ n!⌉'
    ],
    build:function(V){
      // 작은 고정 배열 (서로 다른 값, 짝수 개)
      var A=[8,3,11,1,6,9,4,2];     // n=8
      var st=[]; var cmp=0;
      function snap(line,cap,extra){
        var f={line:line,cap:cap,cmp:cmp};
        if(extra) for(var k in extra) f[k]=extra[k];
        st.push(f); }
      snap([0],'입력 A = ['+A.join(', ')+']  (n=8). 비교 횟수를 최소로 정렬합니다.',
        {pairs:[],chain:[],pend:[],phase:'init',arr:A.slice()});
      // ── ① 쌍 비교 ──
      var pairs=[];   // {b:큰, a:작은}
      for(var i=0;i+1<A.length;i+=2){
        cmp++;
        var x=A[i], y=A[i+1];
        var b=Math.max(x,y), a=Math.min(x,y);
        pairs.push({b:b,a:a});
        snap([1,2],'쌍 ('+x+', '+y+') 비교(누적 '+cmp+'회) → 큰 쪽 <b>'+b+'</b>, 작은 쪽 '+a+'.',
          {pairs:pairs.map(function(p){return {b:p.b,a:p.a};}),chain:[],pend:[],phase:'pair',hotPair:pairs.length-1});
      }
      // ── ② 큰 쪽(b들) 재귀 정렬 = 주 사슬 (Ford-Johnson 자체로, 비교 정직 카운트) ──
      var bigs=pairs.map(function(p){return p.b;});
      function jOrder(m){              // 야코브스탈 순서(1-based 인덱스 처리순)
        var J=[1,3,5,11,21,43], res=[], prev=0;
        for(var g=0; res.length<m && g<J.length; g++){
          var hi=Math.min(J[g],m);
          for(var x=hi;x>prev;x--) res.push(x);
          prev=Math.max(prev,hi);
        }
        for(var z=1;z<=m;z++) if(res.indexOf(z)<0) res.push(z);
        return res;
      }
      function binIns(sorted,val){     // 이분 삽입(비교 카운트)
        var lo=0,hi=sorted.length;
        while(lo<hi){ var mid=(lo+hi)>>1; cmp++; if(val<sorted[mid]) hi=mid; else lo=mid+1; }
        sorted.splice(lo,0,val); return lo;
      }
      function fj(arr){               // 재귀 Ford-Johnson, cmp 누적
        arr=arr.slice();
        if(arr.length<=1) return arr;
        var P=[];                     // {b,a}
        for(var i=0;i+1<arr.length;i+=2){ cmp++; var b=Math.max(arr[i],arr[i+1]), a=Math.min(arr[i],arr[i+1]); P.push({b:b,a:a}); }
        var odd=(arr.length%2)?arr[arr.length-1]:null;
        var bsorted=fj(P.map(function(p){return p.b;}));   // 주 사슬(큰 쪽 재귀) — 한 번만
        function mate(b){ for(var k=0;k<P.length;k++) if(P[k].b===b) return P[k].a; return null; }
        var mc=bsorted.slice();
        mc.unshift(mate(bsorted[0]));  // 첫 짝은 비교 없이 앞에
        var aS=[]; for(var u=1;u<bsorted.length;u++) aS.push(mate(bsorted[u]));
        var ord=jOrder(aS.length);
        for(var o=0;o<ord.length;o++){ binIns(mc, aS[ord[o]-1]); }
        if(odd!=null) binIns(mc, odd);
        return mc;
      }
      var chain=fj(bigs);
      snap([3],'큰 쪽들 {'+bigs.join(',')+'} 을 재귀 정렬 → <b>주 사슬</b> ['+chain.join(', ')+'] (누적 '+cmp+'회).',
        {pairs:pairs.map(function(p){return {b:p.b,a:p.a};}),chain:chain.slice(),pend:[],phase:'chain'});
      // 주 사슬의 맨 앞 b 의 짝 a₁ 은 무조건 그 앞에 들어감(비교 0)
      // a 목록을 주사슬 b순서에 맞춰 정렬
      function mateOf(b){ for(var k=0;k<pairs.length;k++) if(pairs[k].b===b) return pairs[k].a; return null; }
      var firstB=chain[0], a1=mateOf(firstB);
      chain.unshift(a1);
      snap([4],'주 사슬 맨 앞 '+firstB+' 의 짝 a₁=<b>'+a1+'</b> 는 비교 없이 맨 앞에 삽입 → ['+chain.join(', ')+'].',
        {pairs:pairs.map(function(p){return {b:p.b,a:p.a};}),chain:chain.slice(),pend:[],phase:'a1',inserted:a1});
      // ── ③ 남은 a 들을 야코브스탈 순서로 이분 삽입 ──
      // bigSorted = 주 사슬의 큰 쪽 정렬 순서(= a1 삽입 전의 chain 상태)
      var bigSorted=chain.slice(1);            // 방금 unshift 한 a1 을 뺀 큰 쪽들
      var aSeq=[];  // a2,a3,... : 큰 쪽 순서대로의 짝
      for(var t=1;t<bigSorted.length;t++) aSeq.push(mateOf(bigSorted[t]));
      var order=jOrder(aSeq.length);           // 야코브스탈 순서(앞서 정의)
      for(var oi=0;oi<order.length;oi++){
        var aval=aSeq[order[oi]-1];
        var pos=binIns(chain,aval);
        snap([5,6],'야코브스탈 순서로 <b>a'+(order[oi]+1)+'='+aval+'</b> 를 이분 삽입(구간≈2의 거듭제곱). 위치 '+pos+', 누적 '+cmp+'회.',
          {pairs:pairs.map(function(p){return {b:p.b,a:p.a};}),chain:chain.slice(),pend:[],phase:'insert',inserted:aval});
      }
      // 검산: 진짜 정렬됐는지
      var ok=true; for(var q=1;q<chain.length;q++) if(chain[q-1]>chain[q]) ok=false;
      var lb=0,fac=1; for(var nn=2;nn<=A.length;nn++) fac*=nn; lb=Math.ceil(Math.log2(fac));
      snap([7],'<b>완료!</b> 정렬 = ['+chain.join(', ')+']'+(ok?'':' (오류)')+'. 총 비교 <b>'+cmp+'회</b> (정보이론 하한 ⌈log₂ 8!⌉='+lb+'에 매우 가까움).',
        {pairs:[],chain:chain.slice(),pend:[],phase:'done'});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H;
      ctx.textAlign='center'; ctx.font='600 15px sans-serif'; ctx.fillStyle='#ffb27a';
      ctx.fillText('누적 비교 횟수 = '+f.cmp, W/2, H*0.10);
      // ── 쌍 (winner chain) 표시 ──
      var pr=f.pairs||[];
      if(pr.length){
        var pw=Math.min(72,(W*0.8)/pr.length), x0=W/2-pr.length*pw/2, py=H*0.26;
        ctx.font='12px sans-serif'; ctx.fillStyle='#9b99a3'; ctx.textAlign='center';
        ctx.fillText('쌍 비교 — 위=큰 쪽(b), 아래=작은 쪽(a)', W/2, py-22);
        for(var i=0;i<pr.length;i++){
          var x=x0+i*pw+pw/2, hot=(i===f.hotPair);
          // big
          ctx.fillStyle=hot?'rgba(255,178,122,0.3)':'rgba(143,227,181,0.22)';
          ctx.strokeStyle=hot?'#ffb27a':'#8fe3b5'; ctx.lineWidth=hot?2.4:1.6;
          ctx.beginPath(); ctx.arc(x,py,16,0,7); ctx.fill(); ctx.stroke();
          ctx.fillStyle=hot?'#ffb27a':'#8fe3b5'; ctx.font='600 14px sans-serif'; ctx.textBaseline='middle'; ctx.textAlign='center';
          ctx.fillText(pr[i].b,x,py);
          // small
          ctx.fillStyle='rgba(122,184,255,0.16)'; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=1.4;
          ctx.beginPath(); ctx.arc(x,py+46,15,0,7); ctx.fill(); ctx.stroke();
          ctx.fillStyle='#7ab8ff'; ctx.fillText(pr[i].a,x,py+46);
          ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1.2;
          ctx.beginPath(); ctx.moveTo(x,py+16); ctx.lineTo(x,py+31); ctx.stroke();
          ctx.textBaseline='alphabetic';
        }
      }
      // ── 주 사슬 (정렬 결과) ──
      var ch=f.chain||[];
      if(ch.length){
        var cw=Math.min(54,(W*0.86)/ch.length), cx0=W/2-ch.length*cw/2, cy=H*0.66;
        ctx.font='12px sans-serif'; ctx.fillStyle='#9b99a3'; ctx.textAlign='center';
        ctx.fillText(f.phase==='done'?'정렬 완료':'주 사슬(정렬 중)', W/2, cy-24);
        for(var k=0;k<ch.length;k++){
          var x2=cx0+k*cw, ins=(ch[k]===f.inserted && f.inserted!=null);
          var col=f.phase==='done'?'#8fe3b5':(ins?'#ffb27a':'#7ab8ff');
          var fil=f.phase==='done'?'rgba(143,227,181,0.24)':(ins?'rgba(255,178,122,0.3)':'rgba(122,184,255,0.14)');
          if(ins){ ctx.save(); ctx.shadowColor='#ffb27a'; ctx.shadowBlur=14; }
          ctx.fillStyle=fil; ctx.strokeStyle=col; ctx.lineWidth=ins?2.6:1.6;
          ctx.fillRect(x2+3,cy,cw-6,40); ctx.strokeRect(x2+3,cy,cw-6,40);
          if(ins) ctx.restore();
          ctx.fillStyle=col; ctx.font='600 16px sans-serif'; ctx.textBaseline='middle'; ctx.textAlign='center';
          ctx.fillText(ch[k],x2+cw/2,cy+20); ctx.textBaseline='alphabetic';
        }
      }
      ctx.textAlign='center'; ctx.font='11px sans-serif'; ctx.fillStyle='#8a8893';
      ctx.fillText('야코브스탈 순서 삽입이 이분 탐색을 꽉 찬 비교로 만들어 횟수를 최소화합니다', W/2, H*0.92); }
  },

  { id:'algo_br_sais', concept:true, branchOf:'algo4_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('SA-IS — 접미사 배열을 선형 시간 O(n)에', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('접두사 배가 O(n log n)을 넘어, 유도 정렬(induced sorting)로 O(n)에 짓기', W/2, H*0.10+22);
      // S/L typing of suffixes
      ctx.fillStyle='#dfeefb'; ctx.font='600 15px monospace';
      ctx.fillText('m  m  i  s  s  i  s  s  i  p  p  i  $', W/2, H*0.30);
      var types=['L','L','S','L','L','S','L','L','S','L','L','L','S'];
      var bx=W*0.5-(types.length*30)/2;
      types.forEach(function(t,i){ var x=bx+i*30+15; var star=(t==='S'&&i>0&&types[i-1]==='L'); ctx.fillStyle=t==='S'?'#8fe3b5':'#7ab8ff'; ctx.font=(star?'700':'400')+' 13px sans-serif'; ctx.fillText(t,x,H*0.30+24); if(star){ctx.fillStyle='#ffb27a';ctx.font='9px sans-serif';ctx.fillText('★',x,H*0.30+36);} });
      ctx.fillStyle='#8a8893'; ctx.font='11px sans-serif'; ctx.fillText('S=뒤보다 작음, L=큼, ★=LMS(L다음 S)', W/2, H*0.46);
      ctx.fillStyle='#cfd8e6'; ctx.font='13px sans-serif'; ctx.textAlign='left';
      var lines=['① 각 접미사를 S형/L형으로 분류 + LMS 위치 표시',
        '② LMS 부분문자열을 유도 정렬로 일단 정렬·이름붙임',
        '③ 이름 수열을 재귀로 정렬(또는 모두 다르면 바로)',
        '④ 정렬된 LMS로 전체 SA를 유도(induce)'];
      lines.forEach(function(t,i){ ctx.fillText(t, W*0.14, H*0.56+i*26); });
      ctx.textAlign='center';
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('재귀 크기가 절반 이하 → T(n)=T(n/2)+O(n)=O(n). DC3(skew)도 같은 선형', W/2, H*0.90);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('대용량 텍스트 색인·BWT(압축)·바이오 정렬의 표준. 구현 복잡하나 가장 빠름', W/2, H*0.90+18); }
  },

  { id:'algo_br_kmpauto', concept:true, branchOf:'algo4_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('KMP 자동자 — 실패함수를 상태기계로, DP까지', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('패턴 매칭 상태(몇 글자 맞췄나)를 노드로, 각 글자 전이를 미리 표로 → 그 위에서 DP', W/2, H*0.10+22);
      // automaton states 0..m with transitions
      var m=4, n=m+1, bx=W*0.14, y=H*0.42, gap=(W*0.72)/(n-1);
      for(var i=0;i<n;i++){ var x=bx+i*gap; var acc=(i===m); ctx.fillStyle=acc?'rgba(143,227,181,0.3)':'rgba(122,184,255,0.16)'; ctx.strokeStyle=acc?'#8fe3b5':'#7ab8ff'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(x,y,16,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.fillStyle='#dfeefb'; ctx.font='600 12px sans-serif'; ctx.fillText(i,x,y+4);
        if(i<n-1){ ctx.strokeStyle='#8fe3b5'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x+16,y); ctx.lineTo(x+gap-16,y); ctx.stroke(); ctx.fillStyle='#8fe3b5'; ctx.font='11px sans-serif'; ctx.fillText('맞음',x+gap/2,y-6); } }
      // fail transition (back arc)
      ctx.strokeStyle='#ff8d8d'; ctx.lineWidth=1.5; ctx.setLineDash([4,3]); ctx.beginPath(); ctx.moveTo(bx+m*gap,y+16); ctx.quadraticCurveTo(bx+m*gap*0.5,y+60,bx+1*gap,y+16); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='#ff8d8d'; ctx.font='11px sans-serif'; ctx.fillText('틀리면 실패함수로 후퇴(다음 상태로 점프)', W/2, y+50);
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('전이표 δ[상태][글자] = 그 글자 후 매칭 상태. 매칭은 표 따라가기 O(n)', W/2, H*0.80);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('DP: dp[i][상태] = 길이 i, 매칭상태인 문자열 수 → "패턴을 포함/회피하는 문자열 세기"', W/2, H*0.88);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('아호코라식은 여러 패턴판. 금지패턴 회피 카운팅·자동자 DP의 기본', W/2, H*0.88+20); }
  },

  { id:'algo_br_samapp', concept:true, branchOf:'algo4_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('접미사 오토마톤 응용 — 서로 다른 부분문자열 수', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('SAM의 각 상태가 부분문자열의 동치류. len−link.len 합 = 서로 다른 부분문자열 수', W/2, H*0.10+22);
      // SAM states with len/link
      var nodes=[[0.5,0.26,'0','len0'],[0.30,0.50,'1','len1'],[0.70,0.50,'2','len2'],[0.40,0.74,'3','len3']];
      function xy(t){ return [W*0.1+t[0]*W*0.8, H*0.22+t[1]*H*0.5]; }
      var edges=[[0,1],[0,2],[1,3]];
      edges.forEach(function(e){ var a=xy(nodes[e[0]]),b=xy(nodes[e[1]]); ctx.strokeStyle='rgba(122,184,255,0.45)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke(); });
      nodes.forEach(function(n,i){ var p=xy(n); ctx.fillStyle=i===0?'rgba(255,178,122,0.2)':'rgba(122,184,255,0.16)'; ctx.strokeStyle=i===0?'#ffb27a':'#7ab8ff'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(p[0],p[1],15,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.fillStyle='#dfeefb'; ctx.font='600 12px sans-serif'; ctx.fillText(n[2],p[0],p[1]+4); ctx.fillStyle='#8fe3b5'; ctx.font='9px sans-serif'; ctx.fillText(n[3],p[0],p[1]+26); });
      ctx.fillStyle='#ffb27a'; ctx.font='12px sans-serif'; ctx.fillText('점선 화살표 = suffix link(접미사 링크)', W/2, H*0.80);
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('서로 다른 부분문자열 수 = Σ (len[v] − len[link[v]])  (각 상태가 새로 더하는 길이)', W/2, H*0.87);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('상태 ≤ 2n개·간선 ≤ 3n개로 선형. 최장공통부분문자열·k번째 부분문자열·출현횟수도', W/2, H*0.87+20); }
  },

  { id:'algo_br_rollbackdsu', concept:true, branchOf:'algo5_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('롤백 union-find — 합치기를 되돌릴 수 있게', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('경로 압축을 포기하고 union by rank만 → 각 합치기가 바꾼 것을 스택에 저장해 되감기', W/2, H*0.10+22);
      // stack of operations to undo
      ctx.fillStyle='#cfd8e6'; ctx.font='13px sans-serif'; ctx.textAlign='left';
      var lines=['union(a,b): 작은 트리를 큰 트리 밑에 (rank/size 기준)',
        '바뀐 것 = 부모 1개 + (필요시 rank 1개) → 스택에 push',
        'rollback(): 스택에서 pop해 부모·rank를 원래대로',
        '경로압축은 트리를 광범위 변형 → 되돌리기 불가, 그래서 금지'];
      lines.forEach(function(t,i){ ctx.fillStyle=i<3?'#cfd8e6':'#8a8893'; ctx.fillText(t, W*0.10, H*0.34+i*28); });
      ctx.textAlign='center';
      // small stack visual
      ctx.fillStyle='#ffb27a'; ctx.font='600 13px sans-serif';
      ctx.fillText('find는 O(log n)(압축 없음), union/rollback은 O(log n)', W/2, H*0.76);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('쓰임: 오프라인 동적 연결성(시간 세그트리 DFS)·롤백 Mo·되돌리는 분할정복', W/2, H*0.86);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('삭제가 어려운 union-find를 "추가만+되감기"로. 함수형 영속 DSU의 절차적 사촌', W/2, H*0.86+20); }
  },

  { id:'algo_br_edgecolor', concept:true, branchOf:'algo6_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('간선 채색·비징 정리 — 한 점에 닿는 간선은 다른 색', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('한 정점에서 만나는 간선들에 서로 다른 색. 필요한 색 수는 Δ 또는 Δ+1뿐(비징)', W/2, H*0.10+22);
      var N={a:[0.30,0.32],b:[0.62,0.30],c:[0.72,0.60],d:[0.42,0.66],e:[0.26,0.60]};
      var edges=[['a','b','#7ab8ff'],['b','c','#8fe3b5'],['c','d','#7ab8ff'],['d','e','#ffb27a'],['e','a','#8fe3b5'],['a','d','#9a86ff']];
      function xy(t){ return [W*N[t][0], H*0.22+N[t][1]*H*0.5]; }
      edges.forEach(function(e){ var p=xy(e[0]),q=xy(e[1]); ctx.strokeStyle=e[2]; ctx.lineWidth=3.5; ctx.beginPath(); ctx.moveTo(p[0],p[1]); ctx.lineTo(q[0],q[1]); ctx.stroke(); });
      Object.keys(N).forEach(function(k){ var p=xy(k); ctx.fillStyle='rgba(122,184,255,0.18)'; ctx.strokeStyle='#dfeefb'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(p[0],p[1],13,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.fillStyle='#dfeefb'; ctx.font='600 12px sans-serif'; ctx.fillText(k.toUpperCase(),p[0],p[1]+4); });
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('비징 정리: 단순 그래프의 간선 채색수는 Δ 또는 Δ+1 (단 둘 중 하나)', W/2, H*0.82);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('이분 그래프는 항상 Δ색(쾨니그). d-정규 이분 = d개 완전매칭으로 분해(1-인수분해)', W/2, H*0.90);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('쓰임: 시간표(교사-반=간선)·라운드로빈 대진표·주파수, 선분그래프 정점채색과 동치', W/2, H*0.90+18); }
  },

  { id:'algo_br_closure', concept:true, branchOf:'algo6_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('최대 가중 폐포 — 프로젝트 선택을 최소 컷으로', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('"고르려면 선행도 함께"인 의존성에서 이익 최대 부분집합 = 최소 컷', W/2, H*0.10+22);
      // s -> profit nodes -> cost nodes -> t
      var N={s:[0.12,0.5,'s'],p1:[0.38,0.32,'+5'],p2:[0.38,0.68,'+3'],c1:[0.64,0.32,'−2'],c2:[0.64,0.68,'−4'],t:[0.88,0.5,'t']};
      var edges=[['s','p1'],['s','p2'],['p1','c1'],['p2','c1'],['p2','c2'],['c1','t'],['c2','t']];
      function xy(t){ return [W*N[t][0], H*0.24+N[t][1]*H*0.46]; }
      edges.forEach(function(e){ var p=xy(e[0]),q=xy(e[1]); ctx.strokeStyle='rgba(122,184,255,0.45)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(p[0],p[1]); ctx.lineTo(q[0],q[1]); ctx.stroke(); });
      Object.keys(N).forEach(function(k){ var p=xy(k); var st=(k==='s'||k==='t'); var prof=(k[0]==='p'); ctx.fillStyle=st?'rgba(255,178,122,0.22)':(prof?'rgba(143,227,181,0.2)':'rgba(255,141,141,0.18)'); ctx.strokeStyle=st?'#ffb27a':(prof?'#8fe3b5':'#ff8d8d'); ctx.lineWidth=2; ctx.beginPath(); ctx.arc(p[0],p[1],14,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.fillStyle='#dfeefb'; ctx.font='600 11px sans-serif'; ctx.fillText(N[k][2],p[0],p[1]+4); });
      ctx.fillStyle='#8fe3b5'; ctx.font='11px sans-serif'; ctx.fillText('이익(+)은 s→용량=이익', W*0.34, H*0.16); ctx.fillStyle='#ff8d8d'; ctx.fillText('비용(−)은 →t 용량=비용', W*0.66, H*0.16);
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('의존(고르면 선행도)은 ∞ 간선. 최대 이익 = (이익 합) − (최소 s-t 컷)', W/2, H*0.82);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('∞ 간선이 의존 위반(이익 선택+선행 미선택)을 컷에서 배제. 프로젝트·이미지 분할·라벨링', W/2, H*0.82+20); }
  },

  { id:'algo_br_hull3d', branchOf:'algo8_03',
    code:[
      'INCREMENTAL-HULL(점들):       // 증분 볼록껍질',
      '  hull ← 처음 두 점으로 시작',
      '  for 각 새 점 p:',
      '    if p 가 hull 안에 있으면: 건너뜀',
      '    else:',
      '      p 에서 보이는 hull 변(edge)들을 찾아 제거',
      '      p 와 경계점들을 잇는 새 변을 추가',
      '  return hull'
    ],
    build:function(V){
      // 2D incremental convex hull as faithful proxy (clearly labeled). insertion order chosen.
      var pts=[
        {x:0.50,y:0.20},{x:0.80,y:0.40},{x:0.70,y:0.78},
        {x:0.30,y:0.74},{x:0.18,y:0.42},{x:0.50,y:0.50},{x:0.88,y:0.66}
      ];
      for(var i=0;i<pts.length;i++) pts[i].id=i;
      function cross(o,a,b){ return (a.x-o.x)*(b.y-o.y)-(a.y-o.y)*(b.x-o.x); }
      // build convex hull (monotone chain) of a set of ids
      function hullOf(ids){
        var P=ids.map(function(j){return {x:pts[j].x,y:pts[j].y,id:j};});
        P.sort(function(a,b){ return a.x-b.x||a.y-b.y; });
        if(P.length<3) return P.map(function(p){return p.id;});
        var lo=[]; for(var k=0;k<P.length;k++){ while(lo.length>=2&&cross(lo[lo.length-2],lo[lo.length-1],P[k])<=0) lo.pop(); lo.push(P[k]); }
        var up=[]; for(k=P.length-1;k>=0;k--){ while(up.length>=2&&cross(up[up.length-2],up[up.length-1],P[k])<=0) up.pop(); up.push(P[k]); }
        lo.pop(); up.pop();
        return lo.concat(up).map(function(p){return p.id;}); }
      function inHull(hull,p){
        // point in convex polygon (hull ordered ccw)
        if(hull.length<3) return false;
        for(var k=0;k<hull.length;k++){ var a=pts[hull[k]], b=pts[hull[(k+1)%hull.length]];
          if(cross(a,b,p)<-1e-9) return false; }
        return true; }
      var st=[];
      function snap(line,cap,hull,cur,mode){
        st.push({line:line,cap:cap,pts:pts,hull:(hull||[]).slice(),
          cur:(cur==null?-1:cur), mode:mode||''}); }
      snap(0,'<b>증분 볼록껍질</b>: 점을 하나씩 추가하며 껍질을 키웁니다. (2D 투영으로 시각화 — 3D도 같은 원리)',[],-1,'');
      var ids=[0,1,2];
      var hull=hullOf(ids);
      snap([1],'처음 세 점 0·1·2 로 작은 삼각형 껍질을 만듭니다.',hull,-1,'init');
      var order=[3,4,5,6];
      for(var o=0;o<order.length;o++){
        var p=order[o];
        if(inHull(hull,pts[p])){
          snap([3],'점 '+p+' 은 현재 껍질 <b>내부</b>에 있습니다 → 껍질에 영향 없음, 건너뜁니다.',hull,p,'inside');
        } else {
          snap([4,5],'점 '+p+' 은 껍질 <b>밖</b>! → 거기서 보이는 변을 제거하고 새 변을 잇습니다.',hull,p,'outside');
          ids.push(p);
          hull=hullOf(ids);
          snap([6],'점 '+p+' 을 껍질에 편입 — 보이던 변을 새 두 변으로 교체해 껍질을 <b>확장</b>했습니다.',hull,p,'added');
        }
      }
      snap(7,'<b>완료!</b> 모든 점을 감싸는 볼록껍질이 완성됐습니다. 점 추가마다 보이는 면만 갱신해 효율적입니다.',hull,-1,'done');
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H,P=f.pts;
      function PX(x){ return W*0.14+x*W*0.70; }
      function PY(y){ return H*0.16+y*H*0.70; }
      ctx.textAlign='center'; ctx.fillStyle='#cfd8e6'; ctx.font='600 14px sans-serif';
      ctx.fillText('증분 볼록껍질 (3D 원리 · 2D 투영)', W/2, H*0.085);
      // hull polygon
      if(f.hull&&f.hull.length>=2){
        var done=(f.mode==='done');
        ctx.beginPath();
        for(var k=0;k<f.hull.length;k++){ var p=P[f.hull[k]]; var x=PX(p.x),y=PY(p.y); if(k===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); }
        ctx.closePath();
        ctx.fillStyle=done?'rgba(143,227,181,0.10)':'rgba(122,184,255,0.08)';
        ctx.fill();
        ctx.strokeStyle=done?'#8fe3b5':'#7ab8ff'; ctx.lineWidth=2.4; ctx.stroke();
      }
      // visibility lines when outside
      if(f.cur>=0 && (f.mode==='outside'||f.mode==='added') && f.hull.length>=2){
        var cp=P[f.cur];
        ctx.strokeStyle='rgba(255,178,122,0.5)'; ctx.lineWidth=1.3; ctx.setLineDash([4,3]);
        for(k=0;k<f.hull.length;k++){ var hp=P[f.hull[k]];
          ctx.beginPath(); ctx.moveTo(PX(cp.x),PY(cp.y)); ctx.lineTo(PX(hp.x),PY(hp.y)); ctx.stroke(); }
        ctx.setLineDash([]);
      }
      // points
      for(var i=0;i<P.length;i++){
        var px=PX(P[i].x),py=PY(P[i].y);
        var onHull=f.hull.indexOf(i)>=0;
        var isCur=(i===f.cur);
        var col=isCur?(f.mode==='inside'?'#9b99a3':'#ffb27a'):onHull?'#8fe3b5':'#5f6b7e';
        ctx.fillStyle=col; ctx.beginPath(); ctx.arc(px,py,isCur?7:5.5,0,7); ctx.fill();
        if(isCur){ ctx.strokeStyle=col; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(px,py,11,0,7); ctx.stroke(); }
        ctx.fillStyle='#9b99a3'; ctx.font='10px monospace'; ctx.textBaseline='middle';
        ctx.fillText(''+i, px, py-13); ctx.textBaseline='alphabetic';
      }
      ctx.textAlign='left'; ctx.fillStyle='#9b99a3'; ctx.font='11px sans-serif';
      ctx.fillText('초록=껍질 꼭짓점  주황=추가 중인 점  파랑=내부 점  점선=가시성(보이는 변)', W*0.14, H*0.97); }
  },

  { id:'algo_br_mincostcirc', concept:true, branchOf:'algo6_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('최소 비용 순환 — 음수 사이클을 다 없앨 때까지', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('s·t 없이, 잔여 그래프에 음수 비용 사이클이 남지 않게 흘려 총비용 최소화', W/2, H*0.10+22);
      // a cycle with costs
      var N={a:[0.34,0.34,'2'],b:[0.64,0.32,'−3'],c:[0.70,0.62,'1'],d:[0.40,0.66,'−1']};
      var edges=[['a','b','2'],['b','c','−3'],['c','d','1'],['d','a','−1']];
      function xy(t){ return [W*N[t][0], H*0.22+N[t][1]*H*0.5]; }
      edges.forEach(function(e){ var p=xy(e[0]),q=xy(e[1]); var neg=e[2][0]==='−'; ctx.strokeStyle=neg?'#ff8d8d':'rgba(122,184,255,0.5)'; ctx.lineWidth=neg?3:2; ctx.beginPath(); ctx.moveTo(p[0],p[1]); ctx.lineTo(q[0],q[1]); ctx.stroke(); ctx.fillStyle=neg?'#ff8d8d':'#8a8893'; ctx.font='12px sans-serif'; ctx.fillText(e[2],(p[0]+q[0])/2+8,(p[1]+q[1])/2); });
      Object.keys(N).forEach(function(k){ var p=xy(k); ctx.fillStyle='rgba(122,184,255,0.16)'; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(p[0],p[1],13,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.fillStyle='#dfeefb'; ctx.font='600 12px sans-serif'; ctx.fillText(k.toUpperCase(),p[0],p[1]+4); });
      ctx.fillStyle='#ff8d8d'; ctx.font='12px sans-serif'; ctx.fillText('음수 사이클(합 −1) 발견 → 그 사이클로 흘려 비용 감소', W/2, H*0.80);
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('최적성: 잔여 그래프에 음수 비용 사이클이 없다 ⟺ 현재 흐름이 최소 비용', W/2, H*0.88);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('사이클 소거(음수사이클 찾아 포화)·SSP(최단경로 증대). MCMF의 일반형, 수송·할당', W/2, H*0.88+20); }
  },

  { id:'algo_br_bidirectional', concept:true, branchOf:'algo6_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('양방향 탐색 — 양쪽에서 동시에 BFS', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('출발·도착에서 동시에 BFS를 키워 가운데서 만나기. 탐색 공간 b^d → 2·b^(d/2)', W/2, H*0.10+22);
      // two expanding circles meeting
      var sx=W*0.26, tx=W*0.74, cy=H*0.50;
      ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2; [0.10,0.16,0.22].forEach(function(r){ ctx.beginPath(); ctx.arc(sx,cy,r*W,0,Math.PI*2); ctx.stroke(); });
      ctx.strokeStyle='#8fe3b5'; [0.10,0.16,0.22].forEach(function(r){ ctx.beginPath(); ctx.arc(tx,cy,r*W,0,Math.PI*2); ctx.stroke(); });
      ctx.fillStyle='#ffb27a'; ctx.beginPath(); ctx.arc(W*0.5,cy,7,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#7ab8ff'; ctx.beginPath(); ctx.arc(sx,cy,8,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#8fe3b5'; ctx.beginPath(); ctx.arc(tx,cy,8,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#dfeefb'; ctx.font='600 12px sans-serif'; ctx.fillText('출발 s', sx, cy-H*0.26); ctx.fillText('도착 t', tx, cy-H*0.26); ctx.fillStyle='#ffb27a'; ctx.fillText('만남', W*0.5, cy+24);
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('두 프런티어가 처음 교차하는 정점에서 경로 결합 → 최단(가중치 1) 경로', W/2, H*0.82);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('각 BFS가 깊이 d/2만 → 방문 노드 b^(d/2)씩, 합쳐도 한쪽 b^d보다 훨씬 적음', W/2, H*0.90);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('역방향 간선을 알아야 함(t에서 거꾸로). 퍼즐 최단해·미로·소셜 거리. A*도 양방향 변형', W/2, H*0.90+18); }
  },

  { id:'algo_br_iddfs', branchOf:'algo8_03',
    code:[
      'for limit = 0,1,2,...:            // 깊이 한계를 늘려가며',
      '  if dfs(start, 0, limit): return limit',
      '',
      'dfs(u, depth, limit):',
      '  if depth == limit: return isGoal(u)   // 한계 도달',
      '  for v in children(u):',
      '    if dfs(v, depth+1, limit): return true',
      '  return false'
    ],
    build:function(V){ var st=[];
      // 작은 트리: 노드 0..12, 깊이 3. 목표 = 노드 9 (깊이 3)
      // 0 -[1,2] / 1 -[3,4] / 2 -[5,6] / 3 -[7,8] / 6 -[9,10] ...
      var par={1:0,2:0,3:1,4:1,5:2,6:2,7:3,8:4,9:5,10:6,11:6,12:2};
      var kids={0:[1,2],1:[3,4],2:[5,6,12],3:[7],4:[8],5:[9],6:[10,11]};
      var depth={0:0,1:1,2:1,3:2,4:2,5:2,6:2,12:2,7:3,8:3,9:3,10:3,11:3};
      var GOAL=9;
      function snap(line,cap,o){ o=o||{};
        st.push({line:line,cap:cap,par:par,kids:kids,depthMap:depth,
          limit:o.limit==null?-1:o.limit, visited:(o.visited||[]).slice(),
          cur:o.cur==null?-1:o.cur, goal:GOAL, found:o.found||false,
          atLimit:(o.atLimit||[]).slice()}); }
      function run(){
        for(var limit=0; limit<=3; limit++){
          snap(0,'<b>깊이 한계 L = '+limit+'</b> 라운드 시작. 이 한계까지만 내려가는 DFS를 처음부터 다시 실행합니다.',{limit:limit});
          var visited=[], atLimit=[], found={v:false};
          (function dfs(u,d){
            if(found.v) return true;
            visited.push(u);
            if(d===limit){
              atLimit.push(u);
              var isG=(u===GOAL);
              snap(4,'한계 깊이 '+limit+' 도달: 노드 '+u+' 가 목표인가? '+(isG?'<b>예 — 발견!</b>':'아니오.'),{limit:limit,visited:visited,cur:u,found:isG,atLimit:atLimit});
              if(isG){ found.v=true; }
              return isG;
            }
            snap([5,6],'노드 '+u+' (깊이 '+d+') 방문 → 자식으로 더 내려갑니다.',{limit:limit,visited:visited,cur:u,atLimit:atLimit});
            var ch=kids[u]||[];
            for(var i=0;i<ch.length;i++){ if(dfs(ch[i],d+1)) return true; }
            return false;
          })(0,0);
          if(found.v){
            snap(1,'<b>L = '+limit+' 에서 목표 발견 → 최단 깊이 = '+limit+'!</b> 처음 찾은 한계가 곧 최단 깊이라 BFS의 최단성이 보장됩니다.',{limit:limit,visited:visited,cur:GOAL,found:true,atLimit:atLimit});
            return;
          }
          snap(7,'L = '+limit+' 에서 목표 없음 → 한계를 +1 늘려 <b>처음부터 다시</b> 탐색합니다. (얕은 층 재방문은 마지막 층이 지배하므로 총비용은 O(b^d))',{limit:limit,visited:visited,atLimit:atLimit});
        }
      }
      run();
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H;
      // 노드 좌표: 깊이별 x 분산
      var pos={
        0:[0.5,0.14],
        1:[0.30,0.36], 2:[0.70,0.36],
        3:[0.16,0.58], 4:[0.34,0.58], 5:[0.58,0.58], 6:[0.78,0.58], 12:[0.92,0.58],
        7:[0.16,0.82], 8:[0.34,0.82], 9:[0.58,0.82], 10:[0.70,0.82], 11:[0.86,0.82]
      };
      function X(id){ return pos[id][0]*W; }
      function Y(id){ return pos[id][1]*H*0.92+H*0.04; }
      // 간선
      ctx.lineWidth=2;
      for(var id in f.par){ var p=f.par[id]; var ci=parseInt(id,10);
        var inLimit=(f.depthMap[ci]<=f.limit);
        var bothVis=(f.visited.indexOf(ci)>=0);
        ctx.strokeStyle=bothVis?'rgba(255,178,122,0.55)':inLimit?'rgba(255,255,255,0.22)':'rgba(255,255,255,0.07)';
        ctx.beginPath(); ctx.moveTo(X(p),Y(p)); ctx.lineTo(X(ci),Y(ci)); ctx.stroke(); }
      // 한계선 (점선)
      if(f.limit>=0){
        var depths=[0.14,0.36,0.58,0.82];
        var ly=depths[Math.min(f.limit,3)]*H*0.92+H*0.04;
        ctx.strokeStyle='rgba(244,160,192,0.45)'; ctx.setLineDash([6,5]); ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.moveTo(W*0.05,ly+24); ctx.lineTo(W*0.95,ly+24); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle='#f4a0c0'; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
        ctx.fillText('깊이 한계 L = '+f.limit,W*0.06,ly+18);
      }
      // 노드
      ctx.textAlign='center'; ctx.textBaseline='middle';
      for(var nid in pos){ var n=parseInt(nid,10);
        var px=X(n),py=Y(n),rad=15;
        var isGoal=(n===f.goal);
        var isCur=(n===f.cur);
        var vis=(f.visited.indexOf(n)>=0);
        var atL=(f.atLimit.indexOf(n)>=0);
        var inLimit=(f.depthMap[n]<=f.limit);
        var col,fill;
        if(isGoal && f.found){ col='#8fe3b5'; fill='rgba(143,227,181,0.30)'; }
        else if(isCur){ col='#ffb27a'; fill='rgba(255,178,122,0.30)'; }
        else if(atL){ col='#f4a0c0'; fill='rgba(244,160,192,0.18)'; }
        else if(vis){ col='#ffb27a'; fill='rgba(255,178,122,0.12)'; }
        else if(inLimit){ col='#7ab8ff'; fill='rgba(122,184,255,0.10)'; }
        else { col='#56555f'; fill='rgba(120,120,130,0.05)'; }
        ctx.fillStyle=fill; ctx.strokeStyle=col; ctx.lineWidth=isCur?2.6:2;
        ctx.beginPath(); ctx.arc(px,py,rad,0,7); ctx.fill(); ctx.stroke();
        ctx.fillStyle=col==='#56555f'?'#7f7e8a':'#dfeefb'; ctx.font='600 12px sans-serif';
        ctx.fillText(n,px,py);
        if(isGoal){ ctx.fillStyle=f.found?'#8fe3b5':'#f4a0c0'; ctx.font='11px sans-serif';
          ctx.fillText('목표',px,py-rad-9); }
      }
      // 범례
      ctx.textAlign='left'; ctx.textBaseline='alphabetic'; ctx.font='11px sans-serif';
      ctx.fillStyle='#9b99a3';
      ctx.fillText('주황=이번 라운드 방문   분홍=한계 깊이 노드   회색=한계 밖(못 감)', W*0.05, H*0.985); }
  },

  { id:'algo_br_bronkerbosch', branchOf:'algo8_03',
    code:[
      'BronKerbosch(R, P, X):',
      '  if P 와 X 가 모두 비면:',
      '    report R   // 극대 클리크 보고',
      '  for v in P (사본):',
      '    BK(R∪{v}, P∩N(v), X∩N(v))',
      '    P ← P − {v}   // v 를 X 로 이동',
      '    X ← X ∪ {v}'
    ],
    build:function(V){
      // 5 정점 그래프: 0-1-2 삼각형 + 경로 2-3-4 → 클리크 {0,1,2},{2,3},{3,4}
      var pos=[[0.22,0.28],[0.18,0.66],[0.46,0.50],[0.68,0.30],[0.86,0.62]];
      var E=[[0,1],[0,2],[1,2],[2,3],[3,4]];
      var adj=[]; for(var i=0;i<5;i++) adj.push([]);
      E.forEach(function(e){ adj[e[0]].push(e[1]); adj[e[1]].push(e[0]); });
      function N(v){ return adj[v]; }
      function inter(S,v){ var r=[]; for(var i=0;i<S.length;i++) if(adj[v].indexOf(S[i])>=0) r.push(S[i]); return r; }
      var st=[], cliques=[];
      function snap(line,cap,R,P,X,o){ o=o||{}; st.push({line:line,cap:cap,pos:pos,E:E,
        R:R.slice(),P:P.slice(),X:X.slice(),pick:(o.pick==null?-1:o.pick),
        cliques:cliques.slice(),found:o.found||null}); }
      snap(0,'<b>R</b>=현재 클리크, <b>P</b>=후보, <b>X</b>=제외. 처음엔 R=∅, P=모든 정점, X=∅ 으로 시작합니다.',[],[0,1,2,3,4],[]);
      function BK(R,P,X,depth){
        if(P.length===0 && X.length===0){
          cliques.push(R.slice());
          snap([1,2],'P·X 가 <b>모두 비었습니다</b> → R={'+R.join(',')+'} 은 <b>극대 클리크</b>! 기록합니다.',R,P,X,{found:R.slice()});
          return;
        }
        if(P.length===0){
          snap(1,'P 는 비었지만 X={'+X.join(',')+'} 가 남음 → R={'+R.join(',')+'} 는 극대가 아니라 건너뜁니다.',R,P,X,{});
          return;
        }
        var Pc=P.slice();
        for(var k=0;k<Pc.length;k++){
          var v=Pc[k];
          if(P.indexOf(v)<0) continue;
          snap([3,4],'후보 v=<b>'+v+'</b> 선택 → R 에 넣고 P·X 를 v 의 이웃으로 좁혀 더 깊이 들어갑니다.',R,P,X,{pick:v});
          var R2=R.concat([v]), P2=inter(P,v), X2=inter(X,v);
          BK(R2,P2,X2,depth+1);
          P=P.filter(function(z){return z!==v;});
          X=X.concat([v]);
          if(depth===0){
            snap([5,6],'v=<b>'+v+'</b> 분기 완료 → P 에서 빼고 X 로 옮깁니다(이후 분기에서 중복 열거 방지).',R,P,X,{pick:v});
          }
        }
      }
      BK([],[0,1,2,3,4],[],0);
      snap(2,'<b>완료!</b> 극대 클리크 '+cliques.length+'개: '+cliques.map(function(c){return '{'+c.join(',')+'}';}).join(' , ')+'.',[],[],[],{});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H;
      var x0=W*0.10,x1=W*0.92,y0=H*0.18,y1=H*0.72;
      function X(s){ return x0+(x1-x0)*s; }
      function Y(s){ return y0+(y1-y0)*s; }
      function inR(v){ return f.R.indexOf(v)>=0; }
      function inP(v){ return f.P.indexOf(v)>=0; }
      function inX(v){ return f.X.indexOf(v)>=0; }
      // edges
      ctx.lineWidth=2;
      f.E.forEach(function(e){ var a=f.pos[e[0]],b=f.pos[e[1]];
        var both=inR(e[0])&&inR(e[1]);
        ctx.strokeStyle=both?'#8fe3b5':'rgba(255,255,255,0.18)';
        ctx.lineWidth=both?3:2;
        ctx.beginPath(); ctx.moveTo(X(a[0]),Y(a[1])); ctx.lineTo(X(b[0]),Y(b[1])); ctx.stroke(); });
      // nodes
      for(var v=0;v<f.pos.length;v++){
        var px=X(f.pos[v][0]),py=Y(f.pos[v][1]),r=18;
        var col='#9b99a3',fc='rgba(155,153,163,0.10)';
        if(inR(v)){ col='#8fe3b5'; fc='rgba(143,227,181,0.22)'; }
        else if(inP(v)){ col='#7ab8ff'; fc='rgba(122,184,255,0.15)'; }
        else if(inX(v)){ col='#f4a0c0'; fc='rgba(244,160,192,0.13)'; }
        if(v===f.pick){ col='#ffb27a'; fc='rgba(255,178,122,0.28)'; r=21; }
        ctx.fillStyle=fc; ctx.strokeStyle=col; ctx.lineWidth=2.4;
        ctx.beginPath(); ctx.arc(px,py,r,0,7); ctx.fill(); ctx.stroke();
        ctx.fillStyle=col; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(''+v,px,py); ctx.textBaseline='alphabetic'; }
      // chips for R/P/X
      function chips(label,arr,col,cx,cy){
        ctx.fillStyle='#9b99a3'; ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.textBaseline='middle';
        ctx.fillText(label,cx,cy);
        var bx=cx+34;
        if(arr.length===0){ ctx.fillStyle='#5a5a64'; ctx.font='12px sans-serif'; ctx.fillText('∅',bx,cy); }
        for(var i=0;i<arr.length;i++){ var lbl=''+arr[i];
          ctx.font='600 12px sans-serif'; var w=22;
          ctx.fillStyle='rgba(0,0,0,0)'; ctx.strokeStyle=col; ctx.lineWidth=1.5;
          if(ctx.roundRect){ctx.beginPath();ctx.roundRect(bx,cy-10,w,20,5);ctx.stroke();}else ctx.strokeRect(bx,cy-10,w,20);
          ctx.fillStyle=col; ctx.textAlign='center'; ctx.fillText(lbl,bx+w/2,cy); ctx.textAlign='left'; bx+=w+6; }
        ctx.textBaseline='alphabetic';
      }
      chips('R',f.R,'#8fe3b5',W*0.08,H*0.80);
      chips('P',f.P,'#7ab8ff',W*0.40,H*0.80);
      chips('X',f.X,'#f4a0c0',W*0.70,H*0.80);
      // found cliques
      ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
      var s='극대 클리크: '+ (f.cliques.length? f.cliques.map(function(c){return '{'+c.join(',')+'}';}).join('  ') : '(아직 없음)');
      ctx.fillStyle=f.found?'#8fe3b5':'#9b99a3'; ctx.fillText(s,W*0.08,H*0.90);
    }
  },

  { id:'algo_br_treeiso', concept:true, branchOf:'algo5_03',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('트리 동형 판정 — 두 트리가 같은 모양인가', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('서브트리마다 정규 해시(자식 해시 정렬→인코딩)를 매겨, 루트 해시 비교로 O(n)', W/2, H*0.10+22);
      // two trees with same shape, different drawing
      function tree(ox,N,edges){ function xy(t){ return [ox+N[t][0]*W*0.30, H*0.26+N[t][1]*H*0.4]; } edges.forEach(function(e){ var p=xy(e[0]),q=xy(e[1]); ctx.strokeStyle='rgba(122,184,255,0.45)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(p[0],p[1]); ctx.lineTo(q[0],q[1]); ctx.stroke(); }); Object.keys(N).forEach(function(k){ var p=xy(k); ctx.fillStyle='rgba(122,184,255,0.18)'; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(p[0],p[1],10,0,Math.PI*2); ctx.fill(); ctx.stroke(); }); }
      tree(W*0.08,{r:[0.5,0],a:[0.2,0.5],b:[0.8,0.5],c:[0.6,1]}, [['r','a'],['r','b'],['b','c']]);
      tree(W*0.56,{r:[0.5,0],a:[0.8,0.5],b:[0.2,0.5],c:[0.4,1]}, [['r','a'],['r','b'],['b','c']]);
      ctx.fillStyle='#8fe3b5'; ctx.font='600 14px sans-serif'; ctx.fillText('같은 해시 → 동형 ✓ (좌우만 다름)', W/2, H*0.74);
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('AHU: 잎=()부터, 각 노드 = 자식 해시들을 정렬해 묶은 정규 라벨', W/2, H*0.84);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('루트 없으면 중심(center)에 고정(지름 중점 1~2개)해 비교. O(n)', W/2, H*0.91);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('자식 정렬이 좌우 순서 무시의 핵심. 일반 그래프 동형은 다항시간 미해결(준다항)', W/2, H*0.91+18); }
  },

  // ─── 심화(원서 깊이): 분석 기초 — 점근표기·점화식 풀이 ───
  { id:'algo_br_asymptotic', branchOf:'algo1_03',
    code:[
      'f(n) = Θ(g(n))  정의:',
      '  ∃ 양의 상수 c₁, c₂, n₀ 가 있어',
      '  모든 n ≥ n₀ 에서:',
      '    c₁·g(n) ≤ f(n) ≤ c₂·g(n)',
      '  // f 가 g 의 상수배 둘 사이에 끼임',
      '예: f(n)=3n²+2n,  g(n)=n²',
      '  c₁=3, c₂=5, n₀=2 로 양쪽 경계 성립',
      '  ⇒ f(n) = Θ(n²)'
    ],
    build:function(V){
      // f(n)=3n^2+2n, g=n^2, c1=3, c2=5, n0=2
      function fF(n){ return 3*n*n+2*n; }
      function gF(n){ return n*n; }
      var c1=3,c2=5,n0=2, nmax=10;
      var pts=[]; for(var n=0;n<=nmax;n++){ pts.push({n:n,f:fF(n),lo:c1*gF(n),hi:c2*gF(n)}); }
      var st=[];
      function snap(line,cap,o){ o=o||{};
        st.push({line:line,cap:cap,pts:pts,c1:c1,c2:c2,n0:n0,nmax:nmax,
          show:(o.show==null?nmax:o.show), drawLo:!!o.drawLo, drawHi:!!o.drawHi,
          mark:!!o.mark, done:!!o.done, check:(o.check==null?-1:o.check)}); }
      snap([0,1],'점근 표기는 비유가 아니라 <b>상수 c와 문턱 n₀로 정의된 함수 집합</b>입니다. <b>Θ</b>는 정확한 차수(상한+하한).',{show:0,drawHi:false,drawLo:false});
      snap([5],'구체 예: <b>f(n)=3n²+2n</b>. 이것이 <b>g(n)=n²</b>의 Θ인지 두 상수배로 가두어 봅니다.',{show:nmax,drawHi:false,drawLo:false});
      snap([6,3],'상한 후보 <b>c₂·g(n)=5n²</b>를 그립니다. f가 이 곡선 <b>아래</b>에 있어야 O(n²).',{show:nmax,drawHi:true,drawLo:false});
      snap([6,3],'하한 후보 <b>c₁·g(n)=3n²</b>를 그립니다. f가 이 곡선 <b>위</b>에 있어야 Ω(n²).',{show:nmax,drawHi:true,drawLo:true});
      snap([2,3],'작은 n에서는 +2n 때문에 살짝 어긋날 수 있습니다. <b>문턱 n₀=2</b>부터 두 부등식이 모두 성립합니다.',{show:nmax,drawHi:true,drawLo:true,mark:true});
      // verify a few points at/after n0
      snap([3],'검증 n=2: 3·4=<b>12</b> ≤ f=3·4+4=<b>16</b> ≤ 5·4=<b>20</b>. 끼임 성립 ✓.',{show:nmax,drawHi:true,drawLo:true,mark:true,check:2});
      snap([3],'검증 n=5: 3·25=<b>75</b> ≤ f=75+10=<b>85</b> ≤ 5·25=<b>125</b>. 성립 ✓. n이 커질수록 여유롭게 끼입니다.',{show:nmax,drawHi:true,drawLo:true,mark:true,check:5});
      snap([7],'<b>모든 n≥n₀=2 에서 3n² ≤ f(n) ≤ 5n²</b> → f(n)=O(n²) 이고 Ω(n²) → <b>f(n)=Θ(n²)</b>. 저차항 2n은 무시됩니다.',{show:nmax,drawHi:true,drawLo:true,mark:true,done:true});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H;
      ctx.textAlign='center'; ctx.textBaseline='alphabetic';
      ctx.fillStyle='#cfd8e6'; ctx.font='600 15px sans-serif';
      ctx.fillText('Θ 정의: f(n) 이 c₁·g(n) 과 c₂·g(n) 사이에 끼임', W/2, H*0.09);
      // plot area
      var x0=W*0.13, x1=W*0.90, y0=H*0.18, y1=H*0.84;
      var nmax=f.nmax;
      var ymax=5*nmax*nmax; // c2*g(nmax)=5*100=500
      function PX(n){ return x0+(x1-x0)*n/nmax; }
      function PY(val){ return y1-(y1-y0)*val/ymax; }
      // axes
      ctx.strokeStyle='rgba(255,255,255,0.20)'; ctx.lineWidth=1.2;
      ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x0,y1); ctx.lineTo(x1,y1); ctx.stroke();
      ctx.fillStyle='#9b99a3'; ctx.font='11px sans-serif'; ctx.textAlign='center';
      for(var n=0;n<=nmax;n+=2){ ctx.fillText(''+n, PX(n), y1+15); }
      ctx.textAlign='left'; ctx.fillText('값', x0-4, y0-6); ctx.textAlign='center'; ctx.fillText('n', x1, y1+15);
      // n0 vertical threshold
      if(f.mark){ var nx=PX(f.n0);
        ctx.strokeStyle='rgba(255,178,122,0.6)'; ctx.lineWidth=1.5; ctx.setLineDash([5,4]);
        ctx.beginPath(); ctx.moveTo(nx,y0); ctx.lineTo(nx,y1); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle='#ffb27a'; ctx.font='600 12px sans-serif'; ctx.textAlign='center';
        ctx.fillText('n₀='+f.n0, nx, y0-4);
        // shade region n>=n0
        ctx.fillStyle='rgba(143,227,181,0.06)'; ctx.fillRect(nx,y0,x1-nx,y1-y0);
      }
      function curve(getY,col,lw,dash){ ctx.strokeStyle=col; ctx.lineWidth=lw; if(dash)ctx.setLineDash(dash); else ctx.setLineDash([]);
        ctx.beginPath(); for(var k=0;k<=f.show;k++){ var p=f.pts[k]; var xx=PX(p.n),yy=PY(getY(p)); if(k===0)ctx.moveTo(xx,yy); else ctx.lineTo(xx,yy); } ctx.stroke(); ctx.setLineDash([]); }
      // c2*g (upper bound) - blue dashed
      if(f.drawHi){ curve(function(p){return p.hi;}, '#7ab8ff', 2, [6,4]); }
      // c1*g (lower bound) - green dashed
      if(f.drawLo){ curve(function(p){return p.lo;}, '#8fe3b5', 2, [6,4]); }
      // f(n) - orange solid
      if(f.show>0){ curve(function(p){return p.f;}, '#ffb27a', 3, null);
        // dots on f
        for(var k=0;k<=f.show;k++){ var p=f.pts[k]; ctx.fillStyle='#ffb27a'; ctx.beginPath(); ctx.arc(PX(p.n),PY(p.f),3,0,7); ctx.fill(); }
      }
      // check marker
      if(f.check>=0){ var p=f.pts[f.check];
        var cx=PX(p.n);
        ctx.strokeStyle='#dfeefb'; ctx.lineWidth=1; ctx.setLineDash([2,3]);
        ctx.beginPath(); ctx.moveTo(cx,PY(p.lo)); ctx.lineTo(cx,PY(p.hi)); ctx.stroke(); ctx.setLineDash([]);
        [['lo',p.lo,'#8fe3b5'],['f',p.f,'#ffb27a'],['hi',p.hi,'#7ab8ff']].forEach(function(it){
          ctx.fillStyle=it[2]; ctx.beginPath(); ctx.arc(cx,PY(it[1]),5,0,7); ctx.fill();
          ctx.fillStyle=it[2]; ctx.font='600 11px monospace'; ctx.textAlign='left'; ctx.textBaseline='middle';
          ctx.fillText(' '+it[1], cx+6, PY(it[1])); ctx.textBaseline='alphabetic';
        });
      }
      // legend
      ctx.textAlign='left'; ctx.font='600 12px sans-serif';
      var ly=H*0.92;
      ctx.fillStyle='#7ab8ff'; ctx.fillText('— — c₂·g(n)=5n² (상한)', x0, ly);
      ctx.fillStyle='#ffb27a'; ctx.fillText('— f(n)=3n²+2n', x0+W*0.30, ly);
      ctx.fillStyle='#8fe3b5'; ctx.fillText('— — c₁·g(n)=3n² (하한)', x0+W*0.55, ly);
      // verdict
      if(f.done){ ctx.textAlign='center'; ctx.fillStyle='#8fe3b5'; ctx.font='700 17px monospace';
        ctx.fillText('⇒ f(n) = Θ(n²)', W/2, H*0.975); } }
  },

  { id:'algo_br_substitution', branchOf:'algo8_03',
    code:[
      '// 치환법: T(n)=2T(n/2)+n 이 O(n lg n) 임을 증명',
      'STEP1 추측:   T(n) ≤ c·n·lg n        (c>0 뒤에서 결정)',
      'STEP2 귀납가정: T(n/2) ≤ c·(n/2)·lg(n/2)',
      'STEP3 대입:   T(n) ≤ 2·[c·(n/2)·lg(n/2)] + n',
      '             = c·n·lg(n/2) + n',
      '             = c·n·(lg n − 1) + n',
      '             = c·n·lg n − c·n + n',
      'STEP4 닫기:   −c·n + n ≤ 0  ⇔  c ≥ 1',
      '             ∴ T(n) ≤ c·n·lg n   (c≥1, 기저도 흡수)'
    ],
    build:function(V){
      var st=[];
      function snap(line,cap,extra){ var f={line:line,cap:cap}; if(extra)for(var k in extra)f[k]=extra[k]; st.push(f); }
      // 단계별로 우변 식 조각을 점등. expr 배열 각 항은 {t:텍스트, on:점등여부, hot:강조}
      function E(arr){ return arr.map(function(x){ return {t:x[0],on:x[1],hot:x[2]||false}; }); }
      snap(0,'점화식 <b>T(n)=2T(n/2)+n</b> 의 해를 <b>O(n lg n)</b> 이라 증명합니다. (lg n = log₂ n)',{
        guess:false, hyp:false,
        expr:E([['',true]]), goal:false, c:null, prove:'준비'});
      snap(1,'<b>① 추측</b>: 답의 꼴을 <b>T(n) ≤ c·n·lg n</b> 으로 가정합니다. 상수 c>0는 끝에서 정합니다.',{
        guess:true, hyp:false,
        expr:E([['T(n) ≤ c·n·lg n',true,true]]), goal:true, c:null, prove:'추측'});
      snap(2,'<b>② 귀납 가정</b>: n보다 작은 값, 특히 <b>n/2</b>에 대해 <b>T(n/2) ≤ c·(n/2)·lg(n/2)</b> 가 성립한다고 가정합니다.',{
        guess:true, hyp:true,
        expr:E([['T(n/2) ≤ c·(n/2)·lg(n/2)',true,true]]), goal:true, c:null, prove:'귀납가정'});
      snap(3,'<b>③ 대입</b>: 점화식의 T(n/2) 자리에 가정을 넣습니다. <b>T(n) ≤ 2·[c·(n/2)·lg(n/2)] + n</b>.',{
        guess:true, hyp:true,
        expr:E([['T(n) ≤ 2·[c·(n/2)·lg(n/2)] + n',true,true]]), goal:true, c:null, prove:'대입'});
      snap(4,'2와 (n/2)가 약분되어 <b>c·n·lg(n/2) + n</b>. 계수가 정리됩니다.',{
        guess:true, hyp:true,
        expr:E([['= c·n·lg(n/2) + n',true,true]]), goal:true, c:null, prove:'정리'});
      snap(5,'로그 성질 <b>lg(n/2) = lg n − 1</b> 을 적용 → <b>c·n·(lg n − 1) + n</b>.',{
        guess:true, hyp:true,
        expr:E([['= c·n·(lg n − 1) + n',true,true]]), goal:true, c:null, prove:'로그전개'});
      snap(6,'괄호를 풀면 <b>c·n·lg n − c·n + n</b>. 목표항 c·n·lg n 과 <b>잉여항 (−c·n + n)</b> 으로 갈립니다.',{
        guess:true, hyp:true,
        expr:E([['= c·n·lg n',true,false],['  − c·n + n',true,true]]), goal:true, c:null, prove:'분리'});
      snap(7,'<b>④ 닫기</b>: 이 식이 c·n·lg n 이하가 되려면 <b>잉여항 −c·n + n ≤ 0</b>, 즉 <b>c ≥ 1</b> 이면 충분합니다.',{
        guess:true, hyp:true,
        expr:E([['c·n·lg n',true,false],['  − c·n + n  ≤ 0',true,true]]), goal:true, c:1, prove:'c≥1'});
      snap(8,'<b>증명 완료!</b> c≥1 (기저 작은 n도 c를 크게 잡아 흡수) → <b>T(n) ≤ c·n·lg n = O(n lg n)</b>. 귀납이 깔끔히 닫혔습니다.',{
        guess:true, hyp:true,
        expr:E([['T(n) ≤ c·n·lg n',true,false]]), goal:true, c:1, prove:'완료'});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H;
      ctx.textAlign='center'; ctx.textBaseline='alphabetic';
      ctx.fillStyle='#cfd8e6'; ctx.font='600 15px sans-serif';
      ctx.fillText('치환법 = 추측 → 귀납 대입 → 상수 c로 닫기', W/2, H*0.085);
      // 점화식 박스 (상단)
      var bx=W*0.5-130, by=H*0.135, bw=260, bh=34;
      ctx.fillStyle='rgba(122,184,255,0.10)'; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=1.5;
      if(ctx.roundRect){ctx.beginPath();ctx.roundRect(bx,by,bw,bh,8);ctx.fill();ctx.stroke();}else{ctx.fillRect(bx,by,bw,bh);ctx.strokeRect(bx,by,bw,bh);}
      ctx.fillStyle='#dfeefb'; ctx.font='600 15px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('T(n) = 2T(n/2) + n', W/2, by+bh/2);
      // 추측 목표 박스
      ctx.textBaseline='alphabetic';
      if(f.goal){
        var gy=H*0.25;
        ctx.fillStyle=(f.prove==='완료')?'#8fe3b5':'#ffb27a'; ctx.font='600 13px sans-serif'; ctx.textAlign='center';
        ctx.fillText('목표(추측):  T(n) ≤ c·n·lg n', W/2, gy);
      }
      // 4단계 진행 배지(좌측 수직)
      var steps=[['① 추측',f.guess],['② 귀납가정',f.hyp],['③ 대입',f.prove==='대입'||f.prove==='정리'||f.prove==='로그전개'||f.prove==='분리'||f.prove==='c≥1'||f.prove==='완료'],['④ 닫기',f.prove==='c≥1'||f.prove==='완료']];
      var sx=W*0.10, sy=H*0.34;
      for(var i=0;i<steps.length;i++){ var on=steps[i][1];
        ctx.fillStyle=on?'#8fe3b5':'#56555f'; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText((on?'✓ ':'   ')+steps[i][0], sx, sy+i*26);
      }
      // 유도식 (중앙 큰 박스)
      var ey=H*0.50, lh=30;
      ctx.textAlign='center';
      for(var j=0;j<f.expr.length;j++){ var e=f.expr[j];
        if(!e.on) continue;
        ctx.fillStyle=e.hot?'#ffb27a':'#9bb6d6';
        ctx.font=(e.hot?'600 ':'')+'17px monospace';
        ctx.fillText(e.t, W/2, ey+j*lh);
      }
      // 닫기 시각화: 잉여항 막대
      if(f.c!=null){
        var cy=H*0.70;
        ctx.fillStyle='#dfeefb'; ctx.font='600 14px sans-serif'; ctx.textAlign='center';
        ctx.fillText('잉여항  −c·n + n  ≤ 0   ⇔   c ≥ 1', W/2, cy);
        // 막대: c·n vs n
        var barY=cy+24, barW=W*0.5, barX=W*0.5-barW/2, barH=18;
        // n (기준)
        ctx.fillStyle='rgba(122,184,255,0.30)'; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=1.5;
        ctx.fillRect(barX,barY,barW*0.5,barH); ctx.strokeRect(barX,barY,barW*0.5,barH);
        ctx.fillStyle='#bfe0ff'; ctx.font='11px sans-serif'; ctx.textBaseline='middle'; ctx.fillText('+n', barX+barW*0.25, barY+barH/2); ctx.textBaseline='alphabetic';
        // c·n (c=1이면 같음, 차감)
        ctx.fillStyle='rgba(255,178,122,0.30)'; ctx.strokeStyle='#ffb27a'; ctx.lineWidth=1.5;
        ctx.fillRect(barX+barW*0.5,barY,barW*0.5,barH); ctx.strokeRect(barX+barW*0.5,barY,barW*0.5,barH);
        ctx.fillStyle='#ffb27a'; ctx.font='11px sans-serif'; ctx.textBaseline='middle'; ctx.fillText('−c·n', barX+barW*0.75, barY+barH/2); ctx.textBaseline='alphabetic';
        ctx.fillStyle='#8fe3b5'; ctx.font='600 12px sans-serif'; ctx.textAlign='center';
        ctx.fillText('c≥1 일 때  c·n ≥ n  →  −c·n+n ≤ 0  (잉여 소멸)', W/2, barY+barH+22);
      }
      // 단계 배지(하단)
      ctx.textAlign='center';
      var done=(f.prove==='완료');
      ctx.fillStyle=done?'#8fe3b5':'#ffb27a'; ctx.font='600 13px sans-serif';
      ctx.fillText('▶ '+f.prove, W/2, H*0.95); }
  },

  { id:'algo_br_recursiontree', branchOf:'algo8_03',
    code:[
      '// 재귀 트리: T(n)=2T(n/2)+n  (예: n=8)',
      '층 0:        n                         합 = n',
      '층 1:     n/2 + n/2                    합 = n',
      '층 2:  n/4 + n/4 + n/4 + n/4           합 = n',
      '   ⋮   (매 층 노드 2배, 비용 절반)',
      '층 k:  2^k 개 × (n/2^k)                합 = n',
      '잎까지 높이 = lg n  →  층 수 = lg n + 1',
      'TOTAL = (층 합 n) × (층 수 lg n) = n·lg n',
      '∴ T(n) = Θ(n lg n)'
    ],
    build:function(V){
      var n=8;                 // 작은 예: n=8 → 높이 lg8 = 3
      var st=[];
      function snap(line,cap,extra){ var f={line:line,cap:cap,n:n}; if(extra)for(var k in extra)f[k]=extra[k]; st.push(f); }
      // 트리 노드: level L 에 2^L개, 각 비용 n/2^L. 좌표는 draw에서 계산.
      // reveal: 현재까지 펼친 최대 층, sumRevealed: 층합 누적 더한 층들
      snap(1,'점화식 <b>T(n)=2T(n/2)+n</b> 을 트리로 펼칩니다. <b>루트(층0)</b>는 자신이 직접 쓰는 비용 <b>n=8</b>.',{
        maxL:0, levelSum:[8], summed:[], total:null});
      snap([2],'루트가 <b>두 개의 하위 호출 T(n/2)</b> 을 만듭니다(층1). 각 노드 비용 <b>n/2=4</b>.',{
        maxL:1, levelSum:[8,8], summed:[], total:null});
      snap([2],'층1 비용을 가로로 더하면 <b>4+4 = 8 = n</b>. 루트와 <b>같습니다</b>!',{
        maxL:1, levelSum:[8,8], summed:[1], total:null});
      snap([3],'한 층 더 펼침(층2): <b>4개 노드</b>, 각 비용 <b>n/4=2</b>.',{
        maxL:2, levelSum:[8,8,8], summed:[1], total:null});
      snap([3],'층2 합 = <b>2×4 = 8 = n</b>. 노드 수는 2배, 비용은 절반 → <b>층 합은 그대로 n</b>.',{
        maxL:2, levelSum:[8,8,8], summed:[1,2], total:null});
      snap([4,5],'층3은 <b>8개 노드</b>, 각 비용 <b>n/8=1</b> → 크기 1, 즉 <b>잎(기저)</b>. 합 = 1×8 = <b>8 = n</b>.',{
        maxL:3, levelSum:[8,8,8,8], summed:[1,2,3], total:null});
      snap([1,2,3,5],'핵심 관찰: <b>모든 층의 비용 합이 n=8</b> 으로 동일합니다(등비 공비=1).',{
        maxL:3, levelSum:[8,8,8,8], summed:[0,1,2,3], total:null});
      snap([6],'크기가 매 층 절반이라 잎까지 <b>높이 = lg n = lg 8 = 3</b> → <b>층 수 = lg n + 1 = 4</b>.',{
        maxL:3, levelSum:[8,8,8,8], summed:[0,1,2,3], total:null, showH:true});
      snap([7,8],'<b>세로로 합산</b>: (층 합 n) × (층 수 lg n) = <b>8 × 3 = 24</b> 의 차수 = <b>Θ(n lg n)</b>.',{
        maxL:3, levelSum:[8,8,8,8], summed:[0,1,2,3], total:24, showH:true});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H;
      ctx.textAlign='center'; ctx.textBaseline='alphabetic';
      ctx.fillStyle='#cfd8e6'; ctx.font='600 15px sans-serif';
      ctx.fillText('재귀 트리: 각 층 합 × 층 수 = 총비용  (T(n)=2T(n/2)+n, n=8)', W/2, H*0.075);
      var x0=W*0.10, x1=W*0.80, y0=H*0.16, lg=Math.min(58,H*0.155);
      var maxNodes=8;
      // 노드 그리기: 층 L, 인덱스 i (0..2^L-1)
      function nodeX(L,i){ var cnt=Math.pow(2,L); var span=x1-x0; return x0 + span*(i+0.5)/cnt; }
      function nodeY(L){ return y0 + L*lg; }
      // 엣지
      ctx.lineWidth=1.5;
      for(var L=0; L<f.maxL; L++){ var cnt=Math.pow(2,L);
        for(var i=0;i<cnt;i++){ var px=nodeX(L,i), py=nodeY(L);
          [2*i,2*i+1].forEach(function(ci){ var cx=nodeX(L+1,ci), cy=nodeY(L+1);
            ctx.strokeStyle='rgba(255,255,255,0.20)'; ctx.beginPath(); ctx.moveTo(px,py+12); ctx.lineTo(cx,cy-12); ctx.stroke(); });
        } }
      // 노드
      for(L=0; L<=f.maxL; L++){ var cnt2=Math.pow(2,L), cost=8/Math.pow(2,L), isLeaf=(L===3);
        for(var k=0;k<cnt2;k++){ var nx=nodeX(L,k), ny=nodeY(L), r=Math.max(10, 17-L*1.2);
          var col=isLeaf?'#8fe3b5':'#7ab8ff';
          ctx.fillStyle=isLeaf?'rgba(143,227,181,0.20)':'rgba(122,184,255,0.16)'; ctx.strokeStyle=col; ctx.lineWidth=2;
          ctx.beginPath(); ctx.arc(nx,ny,r,0,7); ctx.fill(); ctx.stroke();
          ctx.fillStyle=col; ctx.font='600 '+(L<2?13:11)+'px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.fillText(''+cost, nx,ny); ctx.textBaseline='alphabetic';
        }
        // 층 합 라벨 (우측)
        var sumOn=(f.summed.indexOf(L)>=0);
        ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.textBaseline='middle';
        ctx.fillStyle=sumOn?'#ffb27a':'#56555f';
        var nodes=Math.pow(2,L);
        ctx.fillText(nodes+'×'+(8/nodes)+' = '+(sumOn?'8 = n':'?'), x1+W*0.02, nodeY(L));
        ctx.textBaseline='alphabetic';
      }
      // 높이 화살표
      if(f.showH){
        var ax=x0-W*0.04;
        ctx.strokeStyle='#f4a0c0'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.moveTo(ax,nodeY(0)); ctx.lineTo(ax,nodeY(3)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ax,nodeY(0)); ctx.lineTo(ax-4,nodeY(0)+8); ctx.moveTo(ax,nodeY(0)); ctx.lineTo(ax+4,nodeY(0)+8); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ax,nodeY(3)); ctx.lineTo(ax-4,nodeY(3)-8); ctx.moveTo(ax,nodeY(3)); ctx.lineTo(ax+4,nodeY(3)-8); ctx.stroke();
        ctx.save(); ctx.translate(ax-12, (nodeY(0)+nodeY(3))/2); ctx.rotate(-Math.PI/2);
        ctx.fillStyle='#f4a0c0'; ctx.font='600 12px sans-serif'; ctx.textAlign='center'; ctx.fillText('높이 = lg n = 3', 0,0); ctx.restore();
      }
      // 합산 패널 (하단)
      var py2=H*0.90;
      ctx.textAlign='center';
      if(f.total!=null){
        ctx.fillStyle='#8fe3b5'; ctx.font='600 16px sans-serif';
        ctx.fillText('TOTAL = (층 합 n=8) × (층 수 lg n=3) = 24  →  Θ(n lg n)', W/2, py2);
      } else {
        var cntS=f.summed.length;
        ctx.fillStyle='#ffb27a'; ctx.font='600 14px sans-serif';
        ctx.fillText('층 합이 모두 n=8 인지 확인 중...  ('+cntS+' / 4 층 합산)', W/2, py2);
      } }
  },

  { id:'algo_br_akrabazzi', branchOf:'algo8_03',
    code:[
      '// 아크라-바지: 불균등 분할 점화식의 마스터 정리',
      '// 예  T(n) = T(n/3) + T(2n/3) + Θ(n)',
      '//     a1=1,b1=1/3   a2=1,b2=2/3   f(n)=n',
      'STEP1  임계지수 p:   Σ aᵢ·bᵢ^p = 1',
      '       (1/3)^p + (2/3)^p = 1   →   p = 1',
      'STEP2  적분:  ∫₁ⁿ f(u)/u^(p+1) du',
      '       = ∫₁ⁿ u/u² du = ∫₁ⁿ (1/u) du = ln n',
      'STEP3  T(n) = Θ( n^p · (1 + 적분) )',
      '       = Θ( n·(1+ln n) ) = Θ(n log n)'
    ],
    build:function(V){
      // g(p) = (1/3)^p + (2/3)^p, 단조감소. p=0 → 2, p=1 → 1.
      function g(p){ return Math.pow(1/3,p)+Math.pow(2/3,p); }
      var st=[];
      function snap(line,cap,extra){ var f={line:line,cap:cap}; if(extra)for(var k in extra)f[k]=extra[k]; st.push(f); }
      snap([1,2],'점화식 <b>T(n)=T(n/3)+T(2n/3)+Θ(n)</b>. 조각 크기가 <b>n/3과 2n/3로 달라</b> 마스터 정리를 직접 못 씁니다.',{
        phase:'intro', p:null, gp:null, integ:false, result:null});
      snap(3,'<b>① 임계지수 p</b>: 방정식 <b>(1/3)^p + (2/3)^p = 1</b> 의 (유일한) 해를 찾습니다. 좌변은 p가 커지면 단조 감소합니다.',{
        phase:'search', p:0, gp:g(0), integ:false, result:null});
      // p 탐색 애니메이션 (이분 느낌으로 몇 점)
      var probes=[0,0.3,0.6,0.8,1.0];
      for(var i=0;i<probes.length;i++){ var pv=probes[i], gv=g(pv);
        var msg = (Math.abs(gv-1)<1e-9) ? 'p = <b>'+pv+'</b> → (1/3)¹+(2/3)¹ = 1/3+2/3 = <b>1</b>. 정확히 1! → <b>p = 1</b>.'
                  : 'p = '+pv+' → (1/3)^'+pv+'+(2/3)^'+pv+' = <b>'+gv.toFixed(3)+'</b> '+(gv>1?'(아직 1보다 큼, p↑)':'(1보다 작음, p↓)');
        snap(4,msg,{phase:(Math.abs(gv-1)<1e-9?'found':'search'), p:pv, gp:gv, integ:false, result:null});
      }
      snap([5,6],'<b>② 적분</b>: p=1을 공식에 넣습니다. ∫₁ⁿ f(u)/u^(p+1) du = ∫₁ⁿ u/u² du = ∫₁ⁿ (1/u) du = <b>ln n</b>.',{
        phase:'integ', p:1, gp:1, integ:true, result:null});
      snap([7,8],'<b>③ 결합</b>: T(n) = Θ(n^p·(1+적분)) = Θ(n¹·(1+ln n)) = <b>Θ(n log n)</b>.',{
        phase:'done', p:1, gp:1, integ:true, result:'Θ(n log n)'});
      snap([3,7],'직관: <b>n^p</b>는 분할 트리의 <b>잎 비용 차수</b>, <b>적분</b>은 내부 층에서 f가 쌓는 양. 마스터 정리는 모든 bᵢ=1/b 인 특수 경우(p=log_b a)일 뿐입니다.',{
        phase:'done', p:1, gp:1, integ:true, result:'Θ(n log n)'});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H;
      ctx.textAlign='center'; ctx.textBaseline='alphabetic';
      ctx.fillStyle='#cfd8e6'; ctx.font='600 15px sans-serif';
      ctx.fillText('아크라-바지: 임계지수 p (Σaᵢbᵢ^p=1) + 적분', W/2, H*0.075);
      // 점화식 박스
      var bx=W*0.5-150, by=H*0.13, bw=300, bh=32;
      ctx.fillStyle='rgba(122,184,255,0.10)'; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=1.5;
      if(ctx.roundRect){ctx.beginPath();ctx.roundRect(bx,by,bw,bh,8);ctx.fill();ctx.stroke();}else{ctx.fillRect(bx,by,bw,bh);ctx.strokeRect(bx,by,bw,bh);}
      ctx.fillStyle='#dfeefb'; ctx.font='600 15px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('T(n)=T(n/3)+T(2n/3)+Θ(n)', W/2, by+bh/2); ctx.textBaseline='alphabetic';
      // 그래프: g(p) = (1/3)^p+(2/3)^p, p in [0,1.5]
      var gx0=W*0.16, gx1=W*0.66, gyTop=H*0.30, gyBot=H*0.66;
      var pMin=0, pMax=1.5, vMin=0.6, vMax=2.05;
      function gx(p){ return gx0 + (gx1-gx0)*(p-pMin)/(pMax-pMin); }
      function gy(v){ return gyBot - (gyBot-gyTop)*(v-vMin)/(vMax-vMin); }
      // 축
      ctx.strokeStyle='rgba(255,255,255,0.20)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(gx0,gyBot); ctx.lineTo(gx1,gyBot); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(gx0,gyTop); ctx.lineTo(gx0,gyBot); ctx.stroke();
      ctx.fillStyle='#6f6e7a'; ctx.font='11px sans-serif'; ctx.textAlign='center';
      for(var pp=0;pp<=1.5;pp+=0.5){ ctx.fillText('p='+pp, gx(pp), gyBot+15); }
      ctx.textAlign='right';
      [1,1.5,2].forEach(function(vv){ ctx.fillStyle='#6f6e7a'; ctx.fillText(''+vv, gx0-6, gy(vv)+4); });
      // y=1 기준선
      ctx.strokeStyle='rgba(143,227,181,0.5)'; ctx.setLineDash([5,4]); ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(gx0,gy(1)); ctx.lineTo(gx1,gy(1)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='#8fe3b5'; ctx.font='600 11px sans-serif'; ctx.textAlign='left'; ctx.fillText('Σ aᵢbᵢ^p = 1 (목표)', gx1-W*0.18, gy(1)-6);
      // 곡선 g(p)
      ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2; ctx.beginPath();
      for(var s=0;s<=60;s++){ var pv2=pMin+(pMax-pMin)*s/60, gv2=Math.pow(1/3,pv2)+Math.pow(2/3,pv2);
        var X=gx(pv2), Y=gy(gv2); if(s===0)ctx.moveTo(X,Y); else ctx.lineTo(X,Y); }
      ctx.stroke();
      ctx.fillStyle='#7ab8ff'; ctx.font='600 12px sans-serif'; ctx.textAlign='left'; ctx.fillText('g(p)=(1/3)^p+(2/3)^p', gx(0.05), gy(1.95));
      // 현재 탐침 점
      if(f.p!=null && f.gp!=null){
        var found=(f.phase==='found'||f.phase==='integ'||f.phase==='done');
        var col=found?'#8fe3b5':'#ffb27a';
        var X2=gx(f.p), Y2=gy(f.gp);
        // 수직 점선
        ctx.strokeStyle=col; ctx.setLineDash([3,3]); ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(X2,gyBot); ctx.lineTo(X2,Y2); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle=col; ctx.beginPath(); ctx.arc(X2,Y2,6,0,7); ctx.fill();
        ctx.font='600 12px sans-serif'; ctx.textAlign='center'; ctx.fillStyle=col;
        ctx.fillText('g('+f.p+')='+f.gp.toFixed(3), X2, Y2-12);
        if(found){ ctx.fillStyle='#8fe3b5'; ctx.font='600 14px sans-serif'; ctx.fillText('p = 1 ✓', X2, gyBot+34); }
      }
      // 우측 패널: 적분 + 결과
      var rx=W*0.70;
      ctx.textAlign='left';
      ctx.fillStyle=f.integ?'#ffb27a':'#56555f'; ctx.font='600 13px sans-serif';
      ctx.fillText('② 적분', rx, gyTop+6);
      ctx.fillStyle=f.integ?'#9bb6d6':'#56555f'; ctx.font='12px monospace';
      ctx.fillText('∫₁ⁿ u/u² du', rx, gyTop+28);
      ctx.fillText('= ∫₁ⁿ 1/u du', rx, gyTop+46);
      ctx.fillStyle=f.integ?'#8fe3b5':'#56555f'; ctx.font='600 13px monospace';
      ctx.fillText('= ln n', rx, gyTop+66);
      // 결과 박스
      if(f.result){
        var ry=H*0.62, rw=W*0.26, rhh=46, rxx=rx-4;
        ctx.fillStyle='rgba(143,227,181,0.14)'; ctx.strokeStyle='#8fe3b5'; ctx.lineWidth=2;
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(rxx,ry,rw,rhh,8);ctx.fill();ctx.stroke();}else{ctx.fillRect(rxx,ry,rw,rhh);ctx.strokeRect(rxx,ry,rw,rhh);}
        ctx.fillStyle='#8fe3b5'; ctx.font='600 12px sans-serif'; ctx.textAlign='center';
        ctx.fillText('T(n)=Θ(n·(1+ln n))', rxx+rw/2, ry+19);
        ctx.font='600 16px sans-serif'; ctx.fillText('= '+f.result, rxx+rw/2, ry+38);
      }
      // 단계 배지
      ctx.textAlign='center';
      var phaseTxt = f.phase==='intro'?'준비':f.phase==='search'?'① p 탐색 중':f.phase==='found'?'① p=1 발견':f.phase==='integ'?'② 적분':'완료';
      ctx.fillStyle=(f.phase==='done')?'#8fe3b5':'#ffb27a'; ctx.font='600 13px sans-serif';
      ctx.fillText('▶ '+phaseTxt, W/2, H*0.95); }
  },

  // ─── 심화(원서 깊이): 정렬·자료구조 분석 증명 ───
  { id:'algo_br_buildheap_proof', concept:true, branchOf:'algo5_04',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('힙 만들기는 왜 O(n)인가 — 높이별 합산', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('각 노드 sift-down은 O(log n)이지만 n개 합치면 O(n log n)이 아니라 O(n)', W/2, H*0.10+22);
      // tree by levels with node counts and heights
      var rows=[['높이 0 (잎)','n/2개','×0'],['높이 1','n/4개','×1'],['높이 2','n/8개','×2'],['높이 h','1개','×h']];
      var by=H*0.30;
      rows.forEach(function(r,i){ var y=by+i*40; ctx.fillStyle=i===3?'rgba(255,178,122,0.14)':'rgba(122,184,255,0.12)'; ctx.strokeStyle=i===3?'#ffb27a':'#7ab8ff'; ctx.lineWidth=1.6; ctx.fillRect(W*0.16,y,W*0.5,32); ctx.strokeRect(W*0.16,y,W*0.5,32);
        ctx.fillStyle='#dfeefb'; ctx.font='600 12px sans-serif'; ctx.textAlign='left'; ctx.fillText(r[0],W*0.19,y+20); ctx.fillStyle='#8fe3b5'; ctx.fillText(r[1],W*0.39,y+20); ctx.fillStyle='#ffb27a'; ctx.fillText('비용 '+r[2],W*0.54,y+20); ctx.textAlign='center'; });
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif'; ctx.fillText('⋮', W*0.41, by+3.6*40);
      ctx.fillStyle='#dfeefb'; ctx.font='600 14px monospace';
      ctx.fillText('총비용 = Σ (높이 h의 노드 수 ⌈n/2^(h+1)⌉) × O(h)', W/2, H*0.74);
      ctx.fillStyle='#ffb27a'; ctx.font='600 15px monospace';
      ctx.fillText('= O( n · Σ_{h≥0} h/2^h ) = O(n · 2) = O(n)', W/2, H*0.82);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('열쇠: 잎(절반)은 비용 0, 비싼 노드는 적다. Σ h/2^h = 2 (수렴) → 선형', W/2, H*0.90);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('루트만 log n이고 대부분 노드는 거의 안 내려감 → 합이 n에 비례', W/2, H*0.90+18); }
  },

  { id:'algo_br_quicksort_avg', branchOf:'algo3_05',
    code:[
      'QUICKSORT(A, lo, hi):',
      '  if lo >= hi: return',
      '  p ← A[ random(lo..hi) ]     // 랜덤 피벗',
      '  // 피벗을 나머지와 1번씩 비교해 분할',
      '  left  ← { x in A : x < p }',
      '  right ← { x in A : x > p }',
      '  QUICKSORT(left);  QUICKSORT(right)',
      '  // E[비교] = Σ 2/(j−i+1) = O(n log n)'
    ],
    build:function(V){
      // 정렬 후 값 = z1..z6 (1..6). 입력은 섞인 배열.
      var A=[3,6,1,5,2,4];                 // 6개, 모두 서로 다름
      var n=A.length;
      // 고정(precomputed) 피벗 선택 — random() 금지. 각 호출의 피벗 인덱스를 미리 정함.
      var st=[];
      var cmpTotal=0;
      function snap(line,cap,extra){
        var f={line:line,cap:cap,n:n, cmp:cmpTotal};
        if(extra) for(var k in extra) f[k]=extra[k];
        st.push(f); }
      snap([0,1],'입력 A = ['+A.join(', ')+']. 랜덤 피벗 퀵정렬의 <b>기대 비교 횟수</b>를 직접 세어 봅니다.',{arr:A.slice(),lo:0,hi:n-1,pivot:-1,less:[],gtr:[]});
      // 결정론적 분할 시뮬: 각 부분배열에서 고정 피벗(첫 원소)을 쓴다.
      // 비교는 피벗 vs 나머지: |sub|-1 회.
      function part(sub){           // sub = 값 배열, 정렬해 반환하며 비교 누적
        if(sub.length<=1) return sub.slice();
        var p=sub[0], less=[], gtr=[];
        for(var i=1;i<sub.length;i++){ cmpTotal++; if(sub[i]<p) less.push(sub[i]); else gtr.push(sub[i]); }
        snap([2,3,4,5],'피벗 <b>'+p+'</b> 를 나머지 '+(sub.length-1)+'개와 각각 1번씩 비교(누적 '+cmpTotal+'회). '+
          '작은 {'+less.join(',')+'} | 큰 {'+gtr.join(',')+'} 로 분할.',
          {arr:sub.slice(),lo:0,hi:sub.length-1,pivot:0,less:less.slice(),gtr:gtr.slice()});
        var ls=part(less), gs=part(gtr);
        return ls.concat([p],gs);
      }
      var sorted=part(A);
      snap([6],'재귀가 끝나면 정렬 완료: ['+sorted.join(', ')+']. 지금까지 <b>총 비교 '+cmpTotal+'회</b>.',
        {arr:sorted.slice(),lo:0,hi:n-1,pivot:-1,less:[],gtr:[],done:true});
      // ── 확률 직관: 두 원소 zi, zj 가 비교될 확률 2/(j-i+1) ──
      // 정렬값 1..6 에 대해 표를 만든다. prob = 2/(d+1), d=j-i.
      snap([7],'<b>왜 평균이 O(n log n)일까?</b> 정렬 후 i,j번째 원소 zᵢ,zⱼ는 <b>많아야 한 번</b> 비교됩니다.',
        {probShow:true,n:n});
      snap([7],'가까운 쌍 z₁,z₃: 사이 구간 {z₁,z₂,z₃}에서 <b>z₁나 z₃가 먼저 피벗</b>이 될 확률 = <b>2/3 ≈ 0.67</b> (자주 비교).',
        {probShow:true,n:n,highlight:[1,3]});
      snap([7],'먼 쌍 z₁,z₆: 사이 6개 중 양끝이 먼저 뽑힐 확률 = <b>2/6 ≈ 0.33</b>. 멀수록(j−i 큼) <b>덜 비교</b>됩니다.',
        {probShow:true,n:n,highlight:[1,6]});
      // 기대 비교 = Σ 2/(d+1). 실제로 합산.
      var E=0; for(var i=1;i<=n;i++) for(var j=i+1;j<=n;j++) E+=2/(j-i+1);
      snap([7],'모든 쌍의 확률을 더하면 E[비교] = Σ 2/(j−i+1) = <b>'+E.toFixed(2)+'</b> (n=6). 멀수록(j−i 큼) 확률↓ → 합이 <b>O(n log n)</b>.',
        {probShow:true,n:n,Eval:E});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H;
      // ── 상단: 비교 카운터 ──
      ctx.textAlign='center'; ctx.font='600 15px sans-serif'; ctx.fillStyle='#ffb27a';
      ctx.fillText('누적 비교 횟수 = '+f.cmp, W/2, H*0.10);
      if(f.probShow){
        // 확률 표: 정렬값 1..n 을 가로 점으로, 쌍 (i,j) 확률 2/(j-i+1)
        var nn=f.n, R=W*0.30, cy=H*0.30, cx=W/2;
        ctx.font='13px sans-serif'; ctx.fillStyle='#dfeefb';
        ctx.fillText('정렬 후 원소 z₁ … z'+nn+' (값 1..'+nn+')', cx, cy-30);
        var dotY=cy, x0=cx-R, dx=(2*R)/(nn-1);
        var hl=f.highlight||[];
        for(var t=1;t<=nn;t++){
          var px=x0+(t-1)*dx, on=(hl.indexOf(t)>=0);
          ctx.fillStyle=on?'#ffb27a':'#7ab8ff';
          ctx.beginPath(); ctx.arc(px,dotY,on?9:6,0,7); ctx.fill();
          ctx.fillStyle='#9b99a3'; ctx.font='11px sans-serif'; ctx.textAlign='center';
          ctx.fillText('z'+t,px,dotY+22);
        }
        if(hl.length===2){
          var ai=Math.min(hl[0],hl[1]), bj=Math.max(hl[0],hl[1]);
          var pax=x0+(ai-1)*dx, pbx=x0+(bj-1)*dx;
          ctx.strokeStyle='#ffb27a'; ctx.lineWidth=2;
          ctx.beginPath(); ctx.moveTo(pax,dotY-16); ctx.quadraticCurveTo((pax+pbx)/2,dotY-46,pbx,dotY-16); ctx.stroke();
          var prob=2/(bj-ai+1);
          ctx.fillStyle='#ffb27a'; ctx.font='600 13px sans-serif'; ctx.textAlign='center';
          ctx.fillText('Pr[z'+ai+'~z'+bj+' 비교] = 2/('+(bj-ai+1)+') = '+prob.toFixed(2),(pax+pbx)/2,dotY-52);
        }
        // 확률 삼각 표
        var ty=H*0.52, tlx=W*0.20, cw=Math.min(56,(W*0.60)/nn);
        ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillStyle='#9b99a3';
        ctx.fillText('쌍 (i,j) 비교 확률 = 2/(j−i+1)', W/2, ty-14);
        for(var i=1;i<nn;i++){ for(var j=i+1;j<=nn;j++){
          var gx=tlx+(j-1)*cw, gy=ty+(i-1)*22, pr=2/(j-i+1);
          var sh=Math.min(0.9,pr);
          ctx.fillStyle='rgba(122,184,255,'+(0.12+sh*0.5)+')';
          ctx.fillRect(gx,gy,cw-4,18);
          ctx.fillStyle='#dfeefb'; ctx.font='10px monospace'; ctx.textBaseline='middle';
          ctx.fillText(pr.toFixed(2),gx+(cw-4)/2,gy+9); ctx.textBaseline='alphabetic';
        }}
        if(f.Eval!=null){
          ctx.fillStyle='#8fe3b5'; ctx.font='600 16px sans-serif'; ctx.textAlign='center';
          ctx.fillText('Σ 모든 쌍 = E[비교] = '+f.Eval.toFixed(2)+'  →  O(n log n)', W/2, H*0.90);
        }
        return;
      }
      // ── 배열 막대 + 피벗/분할 ──
      var arr=f.arr||[], m=arr.length;
      var bw=Math.min(64,(W*0.7)/Math.max(m,1)), x0b=W/2-m*bw/2, baseY=H*0.62, maxv=6;
      for(var k=0;k<m;k++){
        var x=x0b+k*bw, val=arr[k], hgt=(H*0.26)*val/maxv;
        var isP=(k===f.pivot);
        var inL=f.less&&f.less.indexOf(val)>=0, inG=f.gtr&&f.gtr.indexOf(val)>=0;
        var col=isP?'#ffb27a':inL?'#7ab8ff':inG?'#f4a0c0':(f.done?'#8fe3b5':'#7ab8ff');
        var fil=isP?'rgba(255,178,122,0.30)':inL?'rgba(122,184,255,0.20)':inG?'rgba(244,160,192,0.22)':(f.done?'rgba(143,227,181,0.24)':'rgba(122,184,255,0.14)');
        ctx.fillStyle=fil; ctx.strokeStyle=col; ctx.lineWidth=isP?2.6:1.6;
        ctx.fillRect(x+4,baseY-hgt,bw-8,hgt); ctx.strokeRect(x+4,baseY-hgt,bw-8,hgt);
        ctx.fillStyle=col; ctx.font='600 15px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(val,x+bw/2,baseY-hgt-12);
        if(isP){ ctx.fillStyle='#ffb27a'; ctx.font='600 12px sans-serif'; ctx.fillText('피벗',x+bw/2,baseY+16); }
        ctx.textBaseline='alphabetic';
      }
      ctx.textAlign='center'; ctx.font='12px sans-serif';
      ctx.fillStyle='#7ab8ff'; ctx.fillText('파랑 = 피벗보다 작음', W*0.30, H*0.80);
      ctx.fillStyle='#f4a0c0'; ctx.fillText('분홍 = 피벗보다 큼', W*0.55, H*0.80);
      if(f.done){ ctx.fillStyle='#8fe3b5'; ctx.font='600 14px sans-serif'; ctx.fillText('정렬 완료', W*0.78, H*0.80); } }
  },

  { id:'algo_br_universal_hash', concept:true, branchOf:'algo2_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('보편·완전 해싱 — 최악을 무작위로 막기', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('고정 해시함수는 적이 최악 입력을 만들 수 있다. 해시함수를 무작위로 골라 기대 O(1) 보장', W/2, H*0.10+22);
      ctx.fillStyle='#cfd8e6'; ctx.font='13px sans-serif'; ctx.textAlign='left';
      var lines=['보편 해시족 H: 서로 다른 키 x≠y가 충돌할 확률 ≤ 1/m  (h를 H에서 무작위 선택)',
        '  예: h(k)=((a·k+b) mod p) mod m  (p 소수, a∈{1..p−1},b∈{0..p−1} 무작위)',
        '기대 충돌 수 E[버킷 길이] ≤ 1 + 적재율 α=n/m → 체이닝 조회 기대 O(1+α)',
        '완전 해싱(정적 키): 2단계 — 1차로 버킷 나누고, 충돌난 버킷은 크기 nᵢ²의',
        '  2차 테이블로 (보편족에서 무충돌 함수를 기대 O(1)회 시도해 찾음) → 최악 O(1) 조회'];
      lines.forEach(function(t,i){ ctx.fillStyle=i===1?'#8fe3b5':(i===2?'#ffb27a':'#cfd8e6'); ctx.fillText(t, W*0.05, H*0.36+i*26); });
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('보편성: Pr[h(x)=h(y)] ≤ 1/m → 어떤 입력에도 기대 성능 보장', W/2, H*0.84);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('완전 해싱은 정적 키집합에 충돌 0(최악도 O(1))·총 공간 O(n). 2차 크기 nᵢ²가 핵심', W/2, H*0.84+18); }
  },

  { id:'algo_br_dynamic_table', concept:true, branchOf:'algo2_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('동적 테이블 — 2배 확장의 분할상환 O(1)', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('가득 차면 2배 새 배열로 전체 복사(O(n)). 그래도 삽입당 평균(상각) 비용은 O(1)', W/2, H*0.10+22);
      // doubling cost spikes
      var ax=W*0.14, bx=W*0.86, base=H*0.62; ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(ax,base); ctx.lineTo(bx,base); ctx.stroke();
      var spikes=[1,2,4,8,16]; var n=18;
      for(var i=1;i<=n;i++){ var x=ax+(i/n)*(bx-ax); var sp=spikes.indexOf(i)>=0?i:0; var hgt=sp?Math.min(sp,16)*H*0.018:H*0.012;
        ctx.fillStyle=sp?'#ff8d8d':'#7ab8ff'; ctx.fillRect(x-3,base-hgt,5,hgt); }
      ctx.fillStyle='#ff8d8d'; ctx.font='11px sans-serif'; ctx.fillText('빨강 = 2배 확장(복사 O(현재크기))', W/2, base+18);
      ctx.fillStyle='#cfd8e6'; ctx.font='13px sans-serif'; ctx.textAlign='left';
      var lines=['n번 삽입 중 확장은 크기 1,2,4,…,n에서 일어남 → 복사 총비용 = 1+2+4+…+n < 2n',
        '삽입 자체 n번(각 O(1)) + 복사 총 <2n  →  전체 O(n)  →  삽입당 상각 O(1)'];
      lines.forEach(function(t,i){ ctx.fillText(t, W*0.06, H*0.76+i*24); });
      ctx.textAlign='center'; ctx.fillStyle='#ffb27a'; ctx.font='600 14px monospace';
      ctx.fillText('상각 비용 = 전체 비용 / 연산 수 = O(n)/n = O(1)', W/2, H*0.92);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('회계법: 삽입마다 3 충전(자기 1+미래 복사 2) → 확장 비용을 미리 적립. 1.5배도 동일 원리', W/2, H*0.97); }
  },

  // ─── 심화(원서 깊이): 그래프 정확성 증명 ───
  { id:'algo_br_bfs_proof', concept:true, branchOf:'algo6_03',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('BFS는 왜 최단거리를 주는가 — 층별 증명', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('BFS가 매긴 d[v]가 실제 최단거리 δ(s,v)와 같음. 큐가 거리순을 보장', W/2, H*0.10+22);
      // BFS layers
      var layers=[[0.5],[0.28,0.72],[0.14,0.42,0.62,0.86]], lab=[['s'],['1','1'],['2','2','2','2']];
      var top=H*0.30, lg=H*0.17;
      layers.forEach(function(row,L){ var y=top+L*lg;
        ctx.fillStyle='#8a8893'; ctx.font='11px sans-serif'; ctx.textAlign='right'; ctx.fillText('d='+L, W*0.08, y+4); ctx.textAlign='center';
        row.forEach(function(fx,k){ var x=W*0.12+fx*W*0.7; ctx.fillStyle=L===0?'rgba(255,178,122,0.28)':'rgba(122,184,255,0.18)'; ctx.strokeStyle=L===0?'#ffb27a':'#7ab8ff'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(x,y,13,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.fillStyle='#dfeefb'; ctx.font='600 11px sans-serif'; ctx.fillText(lab[L][k],x,y+4);
          if(L<layers.length-1){ var nx=W*0.12+layers[L+1][Math.min(k*2,layers[L+1].length-1)]*W*0.7; ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(x,y+13); ctx.lineTo(nx,top+(L+1)*lg-13); ctx.stroke(); } }); });
      ctx.fillStyle='#cfd8e6'; ctx.font='13px sans-serif'; ctx.textAlign='left';
      var lines=['① 하한: 간선 하나는 거리를 ≤1만 늘림 → d[v] ≥ δ(s,v) (귀납)',
        '② 상한: 큐에서 거리 비감소 순으로 꺼냄(불변식) → v를 d[u]+1에 발견 → d[v] ≤ δ(s,v)',
        '③ 둘 합쳐 d[v] = δ(s,v). BFS 트리 경로가 곧 최단 경로'];
      lines.forEach(function(t,i){ ctx.fillText(t, W*0.06, H*0.78+i*22); });
      ctx.textAlign='center'; ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('핵심 불변식: 큐 안 정점들의 거리가 [k, k+1] 두 값뿐 → 층을 순서대로 완성', W/2, H*0.965); }
  },

  { id:'algo_br_dfs_parenthesis', concept:true, branchOf:'algo6_04',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('DFS 괄호 정리 — 발견·종료 시각의 중첩 구조', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('각 정점에 발견시각 d[v]·종료시각 f[v]. 두 구간 [d,f]는 완전히 중첩되거나 완전히 분리', W/2, H*0.10+22);
      // nested parentheses bars
      var bars=[[0.10,0.90,'u','#7ab8ff'],[0.18,0.50,'v','#8fe3b5'],[0.24,0.42,'w','#ffb27a'],[0.58,0.84,'x','#9a86ff']];
      var by=H*0.34;
      bars.forEach(function(b,i){ var y=by+i*36, x1=W*0.12+b[0]*W*0.72, x2=W*0.12+b[1]*W*0.72;
        ctx.strokeStyle=b[3]; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(x1,y); ctx.lineTo(x2,y); ctx.stroke();
        ctx.fillStyle=b[3]; ctx.font='12px sans-serif'; ctx.fillText('('+b[2], x1, y-6); ctx.fillText(b[2]+')', x2, y-6); });
      ctx.fillStyle='#cfd8e6'; ctx.font='13px sans-serif'; ctx.textAlign='left';
      var lines=['괄호 정리: 임의 u,v에 대해 [d[u],f[u]]와 [d[v],f[v]]는',
        '  ① 완전 분리(서로 조상 아님), 또는 ② 한쪽이 다른쪽에 완전 포함(조상-자손)',
        '  — 절대 부분적으로 겹치지 않음 ( (u (v u) v) 같은 엇갈림 불가 )',
        '흰색 경로 정리: u 발견 순간 v로 가는 "모두 흰색(미발견)" 경로가 있으면 v는 u의 자손'];
      lines.forEach(function(t,i){ ctx.fillStyle=i===3?'#8fe3b5':'#cfd8e6'; ctx.fillText(t, W*0.06, H*0.66+i*24); });
      ctx.textAlign='center'; ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('이 중첩 구조가 간선 분류(트리/후진/전진/교차)와 사이클 검출(후진간선)의 토대', W/2, H*0.965); }
  },

  { id:'algo_br_mst_cut', concept:true, branchOf:'algo6_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('MST 절단(cut) 성질 — 안전한 간선의 증명', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('크루스칼·프림이 왜 옳은가의 핵심. 어떤 컷을 가로지르는 최소 간선은 MST에 안전', W/2, H*0.10+22);
      // a cut dividing vertices, crossing edges, the light one chosen
      var N={a:[0.26,0.34],b:[0.34,0.62],c:[0.30,0.46],d:[0.70,0.36],e:[0.74,0.62],f:[0.66,0.5]};
      function xy(t){ return [W*N[t][0], H*0.24+N[t][1]*H*0.46]; }
      var cross=[['c','f','4'],['b','e','7']];
      cross.forEach(function(e){ var p=xy(e[0]),q=xy(e[1]); var light=e[2]==='4'; ctx.strokeStyle=light?'#8fe3b5':'rgba(255,141,141,0.6)'; ctx.lineWidth=light?3.5:2; if(!light)ctx.setLineDash([5,4]); ctx.beginPath(); ctx.moveTo(p[0],p[1]); ctx.lineTo(q[0],q[1]); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle=light?'#8fe3b5':'#ff8d8d'; ctx.font='600 12px sans-serif'; ctx.fillText(e[2],(p[0]+q[0])/2,(p[1]+q[1])/2-5); });
      // internal edges
      [['a','c'],['c','b'],['d','f'],['f','e']].forEach(function(e){ var p=xy(e[0]),q=xy(e[1]); ctx.strokeStyle='rgba(122,184,255,0.4)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(p[0],p[1]); ctx.lineTo(q[0],q[1]); ctx.stroke(); });
      Object.keys(N).forEach(function(k){ var p=xy(k); var left=['a','b','c'].indexOf(k)>=0; ctx.fillStyle=left?'rgba(122,184,255,0.18)':'rgba(255,178,122,0.18)'; ctx.strokeStyle=left?'#7ab8ff':'#ffb27a'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(p[0],p[1],13,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.fillStyle='#dfeefb'; ctx.font='600 11px sans-serif'; ctx.fillText(k.toUpperCase(),p[0],p[1]+4); });
      ctx.strokeStyle='rgba(244,160,192,0.5)'; ctx.lineWidth=2; ctx.setLineDash([6,6]); ctx.beginPath(); ctx.moveTo(W*0.5,H*0.24); ctx.lineTo(W*0.5,H*0.72); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='#f4a0c0'; ctx.font='12px sans-serif'; ctx.fillText('컷(점선): 정점을 두 집합으로', W/2, H*0.20);
      ctx.fillStyle='#cfd8e6'; ctx.font='13px sans-serif'; ctx.textAlign='left';
      var lines=['정리: 컷을 가로지르는 최소 간선(경량간선) (c,f)=4 는 어떤 MST에도 속한다(안전).',
        '증명(교환논법): 4를 안 쓴 MST T가 있다 치면, T에 4를 더하면 사이클 생김.',
        '그 사이클은 컷을 가로지르는 다른 간선 e′(≥4)를 포함 → e′를 4로 바꾸면',
        '연결 유지 + 가중치 ≤ → 더 작거나 같은 신장트리. 모순/대체 → 4는 안전.'];
      lines.forEach(function(t,i){ ctx.fillStyle=i===0?'#8fe3b5':'#cfd8e6'; ctx.fillText(t, W*0.05, H*0.78+i*22); });
      ctx.textAlign='center'; }
  },

  { id:'algo_br_topo_proof', concept:true, branchOf:'algo6_04',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('위상정렬 정확성 — DAG ⟺ 후진 간선 없음', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('DFS 종료시각 내림차순이 왜 올바른 위상순서인가. 사이클 ⟺ 후진간선 정리', W/2, H*0.10+22);
      // DAG with finish-time order
      var N={a:[0.2,0.3,'f=8'],b:[0.45,0.25,'f=7'],c:[0.45,0.6,'f=4'],d:[0.7,0.45,'f=5'],e:[0.9,0.45,'f=2']};
      function xy(t){ return [W*N[t][0], H*0.26+N[t][1]*H*0.42]; }
      var edges=[['a','b'],['a','c'],['b','d'],['c','d'],['d','e']];
      edges.forEach(function(e){ var p=xy(e[0]),q=xy(e[1]); ctx.strokeStyle='rgba(122,184,255,0.5)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(p[0],p[1]); ctx.lineTo(q[0],q[1]); ctx.stroke(); var mx=(p[0]+q[0])/2,my=(p[1]+q[1])/2,a=Math.atan2(q[1]-p[1],q[0]-p[0]); ctx.fillStyle='rgba(122,184,255,0.6)'; ctx.beginPath(); ctx.moveTo(mx,my); ctx.lineTo(mx-9*Math.cos(a-0.4),my-9*Math.sin(a-0.4)); ctx.lineTo(mx-9*Math.cos(a+0.4),my-9*Math.sin(a+0.4)); ctx.fill(); });
      Object.keys(N).forEach(function(k){ var p=xy(k); ctx.fillStyle='rgba(122,184,255,0.18)'; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(p[0],p[1],14,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.fillStyle='#dfeefb'; ctx.font='600 11px sans-serif'; ctx.fillText(k.toUpperCase(),p[0],p[1]+4); ctx.fillStyle='#8fe3b5'; ctx.font='9px sans-serif'; ctx.fillText(N[k][2],p[0],p[1]+24); });
      ctx.fillStyle='#cfd8e6'; ctx.font='13px sans-serif'; ctx.textAlign='left';
      var lines=['알고리즘: DFS 후 각 정점을 종료시각 f[v] 내림차순으로 나열',
        '정확성 핵심: 간선 (u,v)가 있으면 항상 f[u] > f[v] (u가 더 늦게 끝남)',
        '  ∵ v는 u의 자손이거나(괄호정리로 f[v]<f[u]) 교차간선(이미 끝난 v) → 둘 다 f[u]>f[v]',
        '  단, DAG라 후진간선 없음(있으면 f[u]<f[v]가 되어 사이클)'];
      lines.forEach(function(t,i){ ctx.fillStyle=i===1?'#ffb27a':'#cfd8e6'; ctx.fillText(t, W*0.05, H*0.76+i*22); });
      ctx.textAlign='center'; ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('정리: 방향그래프가 DAG ⟺ DFS에 후진 간선이 없다 (사이클 검출의 토대)', W/2, H*0.965); }
  },

  // ─── 심화(원서 깊이): DP·그리디·최단경로 정당성 ───
  { id:'algo_br_dp_principles', concept:true, branchOf:'algo7_04',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('DP 적용 조건 — 최적부분구조·겹치는부분문제', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('"언제 DP를 쓸 수 있나"의 두 형식 조건과, 최적부분구조의 절단-붙이기 증명', W/2, H*0.10+22);
      ctx.fillStyle='#cfd8e6'; ctx.font='13px sans-serif'; ctx.textAlign='left';
      var lines=['① 최적 부분 구조: 문제의 최적해가 부분문제들의 최적해로 구성됨',
        '   증명(절단-붙이기): 부분해가 최적이 아니면 더 좋은 것으로 "바꿔치기" 하면',
        '   전체가 더 좋아져 모순 → 부분해도 반드시 최적 (cut-and-paste)',
        '② 겹치는 부분 문제: 같은 부분문제가 재귀에서 여러 번 등장(다항 개) →',
        '   메모/표로 한 번만 풀면 지수 → 다항. (서로 다른 부분문제 수 = 표 크기)',
        '주의: 최적부분구조가 "안 성립"하는 예도 있음 — 무가중 최장경로(부분경로가',
        '   최적이라고 전체 최장 보장 안 됨, 정점 재사용 불가 의존성). DP 적용 전 검증 필수'];
      lines.forEach(function(t,i){ ctx.fillStyle=(i===0||i===3)?'#8fe3b5':(i===5?'#f4a0c0':'#cfd8e6'); ctx.fillText(t, W*0.05, H*0.30+i*26); });
      ctx.textAlign='center'; ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('두 조건 모두 만족 → DP. 하나라도 빠지면 분할정복(겹침 없음)이나 다른 기법', W/2, H*0.965); }
  },

  { id:'algo_br_greedy_proof', branchOf:'algo8_01',
    code:[
      '교환 논법(Exchange Argument):',
      '  O ← 임의의 최적해 (활동 수 최대)',
      '  a ← 가장 먼저 끝나는 활동 (그리디 선택)',
      '  if O의 첫 활동 = a: 이미 a 포함',
      '  else:',
      '    O의 첫 활동을 a 로 교환',
      '    a.finish ≤ O첫.finish 이므로 나머지와 안 겹침',
      '    → 실현가능 + 활동 수 동일',
      '  ∴ a 를 포함하는 최적해 존재 → 그리디 안전'
    ],
    build:function(V){
      // acts: [start,finish]
      var acts=[[1,4],[3,5],[0,6],[5,7],[6,10],[8,11]];
      // O = some optimal selection that does NOT start with the greedy choice (a3[0,6])
      var O=[2,3,5];        // a3[0,6], a4[5,7], a6[8,11]  (3 activities)
      var greedy=0;         // a1[1,4] earliest finishing
      var st=[];
      function snap(line,cap,extra){ var f={line:line,cap:cap,acts:acts}; if(extra)for(var k in extra)f[k]=extra[k]; st.push(f); }
      snap(0,'<b>주장</b>: 활동 선택에서 "가장 먼저 끝나는 활동"을 고르는 그리디는 최적입니다. 교환 논법으로 증명합니다.',{sel:[],hi:[],mode:'intro'});
      snap([1],'먼저 <b>임의의 최적해 O</b>를 하나 가정합니다. 여기선 <b>{a3, a4, a6}</b> — 서로 안 겹치는 최대(3개) 집합입니다.',{sel:O.slice(),hi:[],mode:'opt'});
      snap(2,'그리디 선택 <b>a = 가장 먼저 끝나는 활동 = a1[1,4]</b> (끝=4, 모든 활동 중 가장 이름).',{sel:O.slice(),hi:[greedy],mode:'pick'});
      snap(3,'O의 첫 활동은 <b>a3[0,6]</b> (끝=6). 이것이 a1과 같은가? 다릅니다 → else 분기로 갑니다.',{sel:O.slice(),hi:[2,greedy],mode:'compare'});
      snap([4,5],'<b>교환 시작</b>: O의 첫 활동 a3를 빼고 그 자리에 그리디 a1을 넣습니다.',{sel:O.slice(),hi:[2,greedy],mode:'preswap',removed:2});
      snap(6,'핵심: <b>a1.끝=4 ≤ a3.끝=6</b>. a1이 더 일찍 끝나므로 뒤 활동들과 여유가 <b>더 많아</b> 겹칠 수 없습니다.',{sel:[greedy,3,5],hi:[greedy],mode:'swap',removed:2});
      snap(7,'교환 결과 <b>{a1, a4, a6}</b> — 여전히 실현가능(겹침 없음), 활동 수도 <b>3개로 동일</b>합니다.',{sel:[greedy,3,5],hi:[greedy],mode:'after'});
      snap(8,'∴ <b>a를 포함하는 최적해가 존재</b>. 즉 그리디 첫 선택은 손해가 아닙니다(안전).',{sel:[greedy,3,5],hi:[greedy],mode:'safe'});
      snap(8,'이제 a1과 겹치는 a2·a3를 제거한 <b>남은 부분문제</b>에 같은 논법을 적용합니다(귀납).',{sel:[greedy,3,5],hi:[3],mode:'sub'});
      snap(8,'부분문제의 그리디 선택 = <b>a4[5,7]</b> — 남은 것 중 가장 먼저 끝남. 또 안전합니다.',{sel:[greedy,3,5],hi:[3],mode:'sub2'});
      snap(8,'반복하면 <b>a6[8,11]</b>까지. 매 단계 그리디가 안전 → <b>그리디 전체가 최적</b>임이 증명됩니다.',{sel:[greedy,3,5],hi:[greedy,3,5],mode:'done'});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H,A=f.acts;
      var T=12, x0=W*0.12, x1=W*0.90, y0=H*0.24, rh=Math.min(40,H*0.085);
      function X(t){ return x0+(x1-x0)*t/T; }
      ctx.textBaseline='alphabetic';
      // time grid
      ctx.strokeStyle='rgba(255,255,255,0.10)'; ctx.lineWidth=1;
      for(var t=0;t<=T;t+=2){ var x=X(t); ctx.beginPath(); ctx.moveTo(x,y0-14); ctx.lineTo(x,y0+A.length*rh+4); ctx.stroke(); ctx.fillStyle='#6f6e7a'; ctx.font='10px sans-serif'; ctx.textAlign='center'; ctx.fillText(t,x,y0-20); }
      for(var i=0;i<A.length;i++){ var a=A[i], y=y0+i*rh+5;
        var sel=f.sel.indexOf(i)>=0, hot=f.hi.indexOf(i)>=0, rem=(f.removed===i);
        var col,fc;
        if(rem){ col='#f4a0c0'; fc='rgba(244,160,192,0.18)'; }
        else if(hot){ col='#ffb27a'; fc='rgba(255,178,122,0.30)'; }
        else if(sel){ col='#8fe3b5'; fc='rgba(143,227,181,0.28)'; }
        else { col='#7ab8ff'; fc='rgba(122,184,255,0.10)'; }
        ctx.fillStyle=fc; ctx.strokeStyle=col; ctx.lineWidth=hot?3:2;
        var bx=X(a[0]), bw=X(a[1])-X(a[0]);
        ctx.fillRect(bx,y,bw,rh-10); ctx.strokeRect(bx,y,bw,rh-10);
        ctx.fillStyle=col; ctx.font='600 11px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText('a'+(i+1), bx+bw/2, y+(rh-10)/2);
        ctx.textBaseline='alphabetic'; ctx.font='10px sans-serif'; ctx.fillStyle='#9b99a3'; ctx.textAlign='left';
        ctx.fillText('['+a[0]+','+a[1]+']', X(a[1])+6, y+(rh-10)/2+4);
        if(rem){ ctx.strokeStyle='#f4a0c0'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(bx,y); ctx.lineTo(bx+bw,y+rh-10); ctx.moveTo(bx+bw,y); ctx.lineTo(bx,y+rh-10); ctx.stroke(); }
      }
      // legend / status
      ctx.textAlign='left'; ctx.textBaseline='alphabetic';
      var sy=y0+A.length*rh+22;
      ctx.font='600 13px sans-serif';
      var msg, mc;
      if(f.mode==='intro'){ msg='교환 논법: 그리디가 최적임을 증명합니다'; mc='#7ab8ff'; }
      else if(f.mode==='opt'){ msg='초록 = 임의의 최적해 O 의 활동들'; mc='#8fe3b5'; }
      else if(f.mode==='pick'){ msg='주황 a1 = 그리디 선택(가장 먼저 끝남)'; mc='#ffb27a'; }
      else if(f.mode==='compare'){ msg='O의 첫 활동(a3) ≠ 그리디(a1) → 교환 시도'; mc='#ffb27a'; }
      else if(f.mode==='preswap'){ msg='교환: O에서 a3(✕)를 빼고 a1을 넣음'; mc='#f4a0c0'; }
      else if(f.mode==='swap'){ msg='a1.끝=4 ≤ a3.끝=6 → 뒤와 안 겹침(안전)'; mc='#f4a0c0'; }
      else if(f.mode==='after'){ msg='교환 후 {a1,a4,a6} — 여전히 3개, 실현가능'; mc='#8fe3b5'; }
      else if(f.mode==='safe'){ msg='∴ a 포함 최적해 존재 → 그리디 첫 선택 안전'; mc='#8fe3b5'; }
      else if(f.mode==='sub'){ msg='남은 부분문제에 같은 논법 반복(귀납)'; mc='#ffb27a'; }
      else if(f.mode==='sub2'){ msg='부분문제 그리디 = a4 (또 가장 먼저 끝남)'; mc='#ffb27a'; }
      else { msg='매 단계 안전 → 그리디 전체가 최적'; mc='#8fe3b5'; }
      ctx.fillStyle=mc; ctx.fillText('▶ '+msg, x0, sy);
      // count
      ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif';
      ctx.fillText('선택 수: '+f.sel.length+'개  (교환해도 활동 수 불변)', x0, sy+20);
    }
  },

  { id:'algo_br_matroid', branchOf:'algo8_01',
    code:[
      'MATROID-GREEDY(그래프 매트로이드):',
      '  간선들을 가중치 오름차순 정렬',
      '  A ← ∅                       // 독립집합(숲)',
      '  for 각 간선 e (가벼운 순):',
      '    if A ∪ {e} 가 독립 (사이클 없음):',
      '      A ← A ∪ {e}             // 채택',
      '    else:',
      '      skip e                  // 사이클 → 종속, 기각',
      '  return A                    // 최대가중 기저 = MST'
    ],
    build:function(V){
      // vertices 0..4
      var pos=[{x:0.30,y:0.22},{x:0.68,y:0.22},{x:0.80,y:0.58},{x:0.50,y:0.82},{x:0.20,y:0.58}];
      // edges: [u,v,w]
      var edges=[[0,1,1],[1,2,2],[0,4,3],[3,4,4],[2,3,5],[0,3,6],[1,3,7]];
      var order=edges.map(function(e,i){return i;}).sort(function(p,q){return edges[p][2]-edges[q][2];});
      // union-find
      function mk(){ var p=[0,1,2,3,4]; return p; }
      function find(p,x){ while(p[x]!==x){ p[x]=p[p[x]]; x=p[x]; } return x; }
      var st=[];
      function snap(line,cap,extra){ var f={line:line,cap:cap,pos:pos,edges:edges}; if(extra)for(var k in extra)f[k]=extra[k]; st.push(f); }
      snap([0,1],'그래프 매트로이드: <b>독립 = 사이클 없는 숲</b>. 간선을 <b>가중치 오름차순</b>으로 정렬합니다 (1,2,3,4,5,6,7).',{accepted:[],rejected:[],cur:-1});
      snap(2,'독립집합 A를 빈 숲으로 시작합니다. 가벼운 간선부터 차례로 검사합니다.',{accepted:[],rejected:[],cur:-1});
      var p=mk(), acc=[], rej=[];
      for(var k=0;k<order.length;k++){
        var ei=order[k], e=edges[ei], ru=find(p,e[0]), rv=find(p,e[1]);
        snap(4,'간선 ('+e[0]+'–'+e[1]+', 가중치 '+e[2]+') 검사: A∪{e}가 <b>독립</b>(사이클 없음)인가?',{accepted:acc.slice(),rejected:rej.slice(),cur:ei});
        if(ru!==rv){
          p[ru]=rv; acc.push(ei);
          snap(5,'두 끝점이 <b>다른 트리</b> → 사이클 없음 → <b>채택</b>(독립 유지). A에 추가.',{accepted:acc.slice(),rejected:rej.slice(),cur:ei,act:'accept'});
        } else {
          rej.push(ei);
          snap([6,7],'두 끝점이 <b>이미 연결됨</b> → 추가하면 사이클(종속) → <b>기각</b>. 교환 성질이 이 탐욕을 정당화합니다.',{accepted:acc.slice(),rejected:rej.slice(),cur:ei,act:'reject'});
        }
        if(acc.length===4) break;
      }
      snap(8,'<b>완료!</b> 채택 4개 = 정점 5개의 신장 트리 = <b>최대가중 기저(MST)</b>. 그리디가 매트로이드에서 최적임을 보였습니다.',{accepted:acc.slice(),rejected:rej.slice(),cur:-1,done:true});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H,P=f.pos,E=f.edges;
      function PX(i){ return W*0.12+(W*0.66)*P[i].x; }
      function PY(i){ return H*0.16+(H*0.68)*P[i].y; }
      ctx.textBaseline='alphabetic';
      // edges
      for(var i=0;i<E.length;i++){ var e=E[i], ux=PX(e[0]),uy=PY(e[0]),vx=PX(e[1]),vy=PY(e[1]);
        var acc=f.accepted.indexOf(i)>=0, rej=f.rejected.indexOf(i)>=0, cur=(f.cur===i);
        var col,lw;
        if(cur&&f.act==='accept'){ col='#8fe3b5'; lw=4; }
        else if(cur&&f.act==='reject'){ col='#f4a0c0'; lw=4; }
        else if(cur){ col='#ffb27a'; lw=4; }
        else if(acc){ col='#8fe3b5'; lw=3; }
        else if(rej){ col='rgba(244,160,192,0.35)'; lw=1.5; }
        else { col='rgba(122,184,255,0.30)'; lw=1.5; }
        ctx.strokeStyle=col; ctx.lineWidth=lw;
        if(rej&&!cur){ ctx.setLineDash([5,4]); } else { ctx.setLineDash([]); }
        ctx.beginPath(); ctx.moveTo(ux,uy); ctx.lineTo(vx,vy); ctx.stroke(); ctx.setLineDash([]);
        // weight label
        var mx=(ux+vx)/2, my=(uy+vy)/2;
        ctx.fillStyle=acc?'#8fe3b5':rej?'#9b99a3':cur?'#ffb27a':'#7ab8ff';
        ctx.font='600 12px sans-serif'; ctx.textAlign='center';
        ctx.fillStyle='rgba(20,20,28,0.85)'; ctx.beginPath(); ctx.arc(mx,my,9,0,7); ctx.fill();
        ctx.fillStyle=acc?'#8fe3b5':rej?'#9b99a3':cur?'#ffb27a':'#7ab8ff'; ctx.fillText(e[2],mx,my+4);
      }
      // vertices
      for(i=0;i<P.length;i++){ var x=PX(i),y=PY(i);
        ctx.fillStyle='rgba(122,184,255,0.18)'; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.arc(x,y,16,0,7); ctx.fill(); ctx.stroke();
        ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(i,x,y); ctx.textBaseline='alphabetic';
      }
      // status
      ctx.textAlign='left';
      ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif';
      ctx.fillText('채택 '+f.accepted.length+'개  ·  기각 '+f.rejected.length+'개', W*0.12, H*0.94);
      ctx.fillStyle=f.done?'#8fe3b5':'#9b99a3'; ctx.font='600 12px sans-serif'; ctx.textAlign='right';
      ctx.fillText(f.done?'최대가중 기저 = MST 완성':'초록=숲(독립)  분홍점선=사이클(종속·기각)', W*0.90, H*0.94);
    }
  },

  { id:'algo_br_bellman_proof', concept:true, branchOf:'algo6_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('벨만-포드 정확성 — 완화 V−1번이면 충분한 이유', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('모든 간선을 V−1번 완화하면 최단거리 수렴. 한 번 더 줄면 음수 사이클', W/2, H*0.10+22);
      ctx.fillStyle='#cfd8e6'; ctx.font='13px sans-serif'; ctx.textAlign='left';
      var lines=['완화(relax): d[v] = min(d[v], d[u]+w(u,v)) — 간선 하나로 더 짧아지면 갱신',
        '핵심 보조정리(경로 완화 성질): 최단경로 s→…→v의 간선들을 그 순서로 완화하면',
        '  d[v] = δ(s,v)가 된다(중간에 다른 완화가 섞여도 무방).',
        '최단경로는 간선 ≤ V−1개(사이클 없음) → 모든 간선을 V−1라운드 완화하면',
        '  i번째 라운드 후 "간선 i개짜리 최단경로"가 확정 → V−1라운드면 모두 수렴.',
        '음수 사이클 검출: V−1라운드 후 한 번 더 완화해 줄어드는 간선이 있으면 →',
        '  도달가능한 음수 사이클 존재(최단거리 −∞). 다익스트라와 달리 음수 간선 OK'];
      lines.forEach(function(t,i){ ctx.fillStyle=(i===1)?'#8fe3b5':(i===3?'#ffb27a':(i===5?'#f4a0c0':'#cfd8e6')); ctx.fillText(t, W*0.04, H*0.30+i*24); });
      ctx.textAlign='center'; ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('전체 O(VE). 경로 길이(간선 수)에 대한 귀납이 V−1 라운드의 정당성', W/2, H*0.965); }
  },

  // ===== 연습문제 세트 (책 두께의 핵심 차원: 장별 다문항) =====
  exSet('algo_br_ex_analysis','algo1_03','연습문제 — 복잡도·점근·점화식',[
    ['☆','n log n 과 n^1.01, 어느 쪽이 더 빠르게 자라나?'],
    ['☆','3n^2+5n+2 = Θ(n^2) 임을 c1,c2,n0 로 보여라'],
    ['★','T(n)=2T(n/2)+n 을 마스터 정리로 풀어라'],
    ['★','삽입정렬의 최선/최악 입력은 각각 무엇인가?'],
    ['★★','f=O(g) 이면 항상 2^f=O(2^g) 인가? 반례를 찾아라']]),
  exSet('algo_br_ex_sorting','algo3_05','연습문제 — 정렬·선택·하한',[
    ['☆','퀵정렬이 이미 정렬된 배열에서 O(n^2)이 되는 이유'],
    ['★','병합정렬을 안정 정렬로 유지하는 비교 조건은?'],
    ['★','비교정렬 하한 Ω(n log n) 을 결정트리로 설명하라'],
    ['★','계수정렬이 O(n+k) 인데 일반정렬을 못 대체하는 이유'],
    ['★★','중앙값의 중앙값으로 k번째 원소를 O(n)에 찾는 절차']]),
  exSet('algo_br_ex_ds','algo2_05','연습문제 — 자료구조·해시·상각',[
    ['☆','스택 2개로 큐를 구현하라. 각 연산의 상각 비용은?'],
    ['★','동적 배열을 2배씩 늘릴 때 push 상각이 O(1)인 증명'],
    ['★','체이닝 해시에서 적재율 α일 때 탐색 기대 시간'],
    ['★','개방 주소법에서 삭제가 까다로운 이유와 해결(tombstone)'],
    ['★★','이진검색트리에서 중위 후속자를 O(h)에 찾는 절차']]),
  exSet('algo_br_ex_graph','algo6_05','연습문제 — 그래프·탐색·최단경로',[
    ['☆','인접 리스트 vs 인접 행렬: 공간/간선조회 비용 비교'],
    ['★','BFS가 무가중 그래프 최단경로를 주는 이유'],
    ['★','DFS 간선 분류(트리/후방/전방/교차)와 사이클 판정'],
    ['★','다익스트라가 음수 간선에서 실패하는 구체적 예'],
    ['★★','위상정렬 DAG에서 최장경로를 O(V+E)에 구하는 법']]),
  exSet('algo_br_ex_dp','algo7_04','연습문제 — 동적 계획법',[
    ['☆','막대 절단에서 메모이제이션이 지수→다항으로 바꾸는 이유'],
    ['★','LCS 길이 점화식을 세우고 표 채우는 순서를 말하라'],
    ['★','0/1 배낭의 부분문제와 점화식, 시간복잡도는?'],
    ['★','편집 거리(레벤슈타인)의 세 가지 연산과 점화식'],
    ['★★','행렬 연쇄 곱셈에서 괄호를 최적으로 묶는 점화식']]),
  exSet('algo_br_ex_greedy','algo8_01','연습문제 — 그리디·허프만',[
    ['☆','활동 선택에서 "가장 빨리 끝나는 것"이 최적인 이유'],
    ['★','허프만 코드가 최적 접두 코드임을 그리디로 설명'],
    ['★','분할 가능 배낭이 그리디로 풀리는 조건(0/1과 차이)'],
    ['★','그리디 선택 속성과 최적 부분구조의 차이'],
    ['★★','매트로이드 위 최대 가중 독립집합 = 그리디 최적']]),
  exSet('algo_br_ex_advds','algo5_05','연습문제 — 고급 자료구조',[
    ['☆','이진 힙에서 build-heap이 O(n)인 이유(O(n log n) 아님)'],
    ['★','유니온-파인드의 경로 압축+랭크 결합 시간복잡도'],
    ['★','구간 합 질의/갱신을 O(log n)에 하는 세그먼트 트리'],
    ['★','B-트리가 디스크 기반에서 유리한 이유(분기 인수)'],
    ['★★','트라이로 문자열 집합 탐색·접두사 질의 비용']]),
  exSet('algo_br_ex_complexity','algo8_05','연습문제 — NP·근사',[
    ['☆','P, NP, NP-완전, NP-난해의 관계를 그림으로 설명'],
    ['★','다항 시간 환원 A ≤p B 의 의미와 방향'],
    ['★','SAT가 NP-완전임이 왜 중요한가(쿡-레빈)'],
    ['★','정점 덮개의 2-근사 알고리즘과 근사비 증명'],
    ['★★','여행하는 외판원(TSP)이 삼각부등식 하에 2-근사']]),
  exSet('algo_br_ex_search','algo4_04','연습문제 — 탐색',[
    ['☆','이분 탐색에서 mid=(lo+hi)/2 의 오버플로 함정과 안전한 식'],
    ['★','이분 탐색 경계: lower_bound(처음 ≥x 위치)를 구하는 불변식'],
    ['★','회전된 정렬 배열에서 O(log n) 탐색이 가능한 이유'],
    ['★','정답을 이분하는 "매개변수 탐색(parametric)" 적용 조건'],
    ['★★','단봉 함수의 최댓값을 찾는 삼분 탐색의 수렴']]),
  exSet('algo_br_ex_tree','algo5_05','연습문제 — 트리·균형',[
    ['☆','이진 트리에서 노드 n개일 때 가능한 최소/최대 높이'],
    ['★','BST 중위 순회가 정렬된 순서를 주는 이유'],
    ['★','AVL 트리에서 삽입 후 회전(LL/RR/LR/RL) 선택 기준'],
    ['★','레드-블랙 트리가 높이를 2 log(n+1) 이하로 보장하는 원리'],
    ['★★','두 노드의 최소 공통 조상(LCA)을 O(h)에 찾는 절차']]),
  exSet('algo_br_ex_divide','algo3_05','연습문제 — 분할 정복',[
    ['☆','분할 정복의 세 단계(분할·정복·결합)를 병합정렬로 설명'],
    ['★','최대 부분 배열을 분할 정복으로 O(n log n)에 푸는 법'],
    ['★','카라츠바 곱셈이 O(n^1.585)인 점화식 유도'],
    ['★','거듭제곱 a^n 을 O(log n)에 계산하는 분할(빠른 거듭제곱)'],
    ['★★','병합 과정에서 역위(inversion) 쌍을 세는 O(n log n) 알고리즘']]),
  exSet('algo_br_ex_random','algo2_05','연습문제 — 확률·랜덤화',[
    ['☆','무작위 피벗 퀵정렬의 기대 시간이 O(n log n)인 직관'],
    ['★','보편 해싱(universal hashing)이 최악 충돌을 막는 원리'],
    ['★','생일 역설: n개 키를 m버킷에 넣을 때 충돌 시작 규모'],
    ['★','라스베가스 vs 몬테카를로 알고리즘의 차이'],
    ['★★','무작위 선택(randomized-select)의 기대 선형 시간 분석']]),

  // ===== D5 정당성 증명 배치 (기존 알고리즘 분기가 빠뜨린 핵심 정리) =====
  proofScene('algo_br_maxflow_proof','algo6_05','최대 유량 = 최소 컷 정리',
    '증대 경로 정리: 다음 셋은 동치다 — 어느 하나가 참이면 셋 다 참.',
    [['#8fe3b5','① f 는 최대 유량이다.'],
     ['#ffb27a','② 잔여 그래프 G_f 에 증대 경로가 없다.'],
     ['#f4a0c0','③ 어떤 컷 (S,T)에 대해 |f| = c(S,T) (컷 용량과 같다).'],
     ['#cfd8e6','①→②: 증대 경로가 있으면 유량을 더 늘릴 수 있어 최대가 아님(대우).'],
     ['#cfd8e6','②→③: S = G_f에서 s가 도달하는 정점들. T = 나머지. S→T 간선은 포화,'],
     ['#cfd8e6','        T→S 간선은 유량 0 → |f| = c(S,T).'],
     ['#cfd8e6','③→①: 모든 유량 ≤ 모든 컷 용량(약한 쌍대성)이므로 |f|=c(S,T)면 최대.']],
    '결론: 증대 경로가 없을 때의 유량 = 최소 컷 용량. 에드몬즈-카프/디닉이 이 정리로 종료를 보장한다.')
  ,
  proofScene('algo_br_dfs_theorems','algo6_03','DFS 괄호 정리 · 흰 경로 정리',
    'DFS는 각 정점에 발견시간 d[v]와 종료시간 f[v]를 매긴다. 구간 [d[v], f[v]]를 보면:',
    [['#8fe3b5','괄호 정리: 두 구간 [d[u],f[u]], [d[v],f[v]]는 완전히 포개지거나(조상-자손)'],
     ['#8fe3b5','           완전히 분리된다(서로 무관). 부분적으로 겹칠 수 없다.'],
     ['#ffb27a','흰 경로 정리: u를 발견한 순간 v까지 "아직 안 본(흰) 정점만" 지나는 경로가'],
     ['#ffb27a','           있으면, v는 DFS 트리에서 u의 자손이 된다.'],
     ['#cfd8e6','간선 분류: 트리(흰 정점으로), 후방(회색 조상으로 — 사이클 신호),'],
     ['#cfd8e6','           전방/교차(검은 정점으로). 무방향엔 트리·후방만.'],
     ['#f4a0c0','응용: 후방 간선 ⟺ 사이클, 종료시간 역순 = 위상정렬, SCC 2-pass의 토대.']],
    '결론: 발견/종료 시간의 중첩 구조가 트리 모양과 사이클·위상순서를 모두 규정한다.')
  ,
  proofScene('algo_br_master_proof','algo1_03','마스터 정리 — 재귀 트리 증명',
    'T(n)=aT(n/b)+f(n). 재귀 트리는 깊이 log_b n, i층에 a^i개 노드, 각 크기 n/b^i.',
    [['#8fe3b5','잎의 수 = a^{log_b n} = n^{log_b a}. 이 값과 f(n)을 비교한다.'],
     ['#ffb27a','경우 1: f(n)=O(n^{log_b a − ε}) → 잎이 지배 → T(n)=Θ(n^{log_b a}).'],
     ['#f4a0c0','경우 2: f(n)=Θ(n^{log_b a}) → 각 층 비용이 같음(log n층) → Θ(n^{log_b a} log n).'],
     ['#7ab8ff','경우 3: f(n)=Ω(n^{log_b a + ε}) + 정규성 a·f(n/b)≤c·f(n) → 뿌리가 지배 → Θ(f(n)).'],
     ['#cfd8e6','직관: 층별 비용 합이 등비급수 → 첫 항(뿌리) 또는 마지막 항(잎) 중 큰 쪽이 결정.'],
     ['#cfd8e6','예: 병합정렬 a=b=2,f=n → 경우2 → Θ(n log n). 이분탐색 a=1,b=2 → Θ(log n).']],
    '결론: 잎의 총비용 n^{log_b a} 와 뿌리 비용 f(n)의 균형이 점근 차수를 정한다.')
  ,
  proofScene('algo_br_quicksort_analysis','algo3_05','퀵정렬 기대 시간 — 지표 변수 증명',
    '무작위 피벗 퀵정렬의 기대 비교 횟수를 지표 변수와 기댓값의 선형성으로 센다.',
    [['#8fe3b5','X_{ij} = (정렬 후 i번째와 j번째 원소가 한 번이라도 비교되면 1).'],
     ['#ffb27a','두 원소는 둘 사이 구간에서 처음 뽑히는 피벗이 자기들 중 하나일 때만 비교된다.'],
     ['#ffb27a','그 구간 크기는 j−i+1 → P(비교) = 2/(j−i+1).'],
     ['#f4a0c0','E[비교] = ΣΣ 2/(j−i+1) = Σ_i 2·(조화합) = O(n·H_n) = O(n log n).'],
     ['#cfd8e6','최악(정렬된 입력+고정 피벗) = Θ(n^2)이지만, 무작위화로 어떤 입력도 기대 O(n log n).'],
     ['#cfd8e6','조화수 H_n = 1+1/2+…+1/n ≈ ln n 이 log 인수의 출처다.']],
    '결론: 무작위 피벗은 입력과 무관하게 기대 비교 O(n log n)을 보장한다(적대적 입력 무력화).')
  ,
  // ===== D6 정당성 증명 배치 (자료구조·DP·해시의 핵심 정리) =====
  proofScene('algo_br_rbtree_height_proof','algo5_05','레드-블랙 트리 높이 ≤ 2 log(n+1)',
    '흑색 높이(bh) 개념으로, n개 노드 레드-블랙 트리의 높이가 O(log n)임을 증명한다.',
    [['#8fe3b5','5규칙: ①모든 노드 적/흑 ②루트 흑 ③잎(NIL) 흑 ④적색의 자식은 흑색'],
     ['#8fe3b5','        ⑤임의 노드→자손 잎 경로의 흑색 노드 수(bh)가 모두 같다.'],
     ['#ffb27a','보조정리: 노드 x를 뿌리로 하는 서브트리는 내부 노드 ≥ 2^{bh(x)} − 1 개.'],
     ['#ffb27a','        (높이에 대한 귀납: 자식의 bh ≥ bh(x)−1 → 2^{bh−1}−1 둘 + 1)'],
     ['#f4a0c0','규칙④로 임의 경로에서 적색은 연속 불가 → 적색 노드 ≤ 흑색 노드 수.'],
     ['#f4a0c0','따라서 높이 h ≤ 2·bh(root). 또 n ≥ 2^{bh(root)} − 1 → bh ≤ log(n+1).'],
     ['#cfd8e6','결합: h ≤ 2·bh(root) ≤ 2 log(n+1) = O(log n).']],
    '결론: 흑색 균형(규칙⑤) + 적색 비연속(규칙④)이 높이를 흑색높이의 2배로 묶는다.')
  ,
  proofScene('algo_br_counting_radix_proof','algo3_05','계수 정렬 안정성 · 기수 정렬 정당성',
    '계수 정렬이 안정 정렬이며 O(n+k)임을, 기수 정렬이 자릿수별 안정 정렬로 올바름을 보인다.',
    [['#8fe3b5','계수 정렬: 각 키 ≤ v 인 원소 수를 누적해, 원소를 출력 위치로 직접 보낸다.'],
     ['#8fe3b5','        입력을 뒤에서 앞으로 훑으면 같은 키의 원래 순서가 보존됨 → 안정.'],
     ['#ffb27a','시간 O(n+k): 계수 배열 초기화 O(k) + 누적 O(k) + 배치 O(n). k=O(n)이면 O(n).'],
     ['#f4a0c0','기수 정렬: 가장 낮은 자릿수부터 안정 정렬을 d번 반복(LSD).'],
     ['#f4a0c0','귀납: i자리까지 정렬됐다고 가정 → (i+1)자리 안정 정렬 후 상위가 같으면'],
     ['#f4a0c0','        하위 순서(이미 정렬됨)가 안정성으로 보존 → i+1자리까지 정렬.'],
     ['#cfd8e6','전체 O(d(n+k)). 안정성이 없으면 기수 정렬은 무너진다(상위 정렬이 하위를 뒤섞음).']],
    '결론: "안정성"이 자릿수별 정렬을 누적시키는 기수 정렬 정당성의 핵심 전제다.')
  ,
  proofScene('algo_br_knapsack_dp_proof','algo7_04','0/1 배낭 — 최적 부분구조 증명',
    'K[i][w] = 처음 i개 물건, 용량 w일 때 최대 가치. 이 점화식의 최적성을 보인다.',
    [['#8fe3b5','점화식: K[i][w] = max( K[i−1][w],  v_i + K[i−1][w−w_i] )  (w_i ≤ w).'],
     ['#ffb27a','최적 부분구조: i번 물건을 안 넣는 최적해 ⇒ 나머지는 (i−1, w)의 최적해.'],
     ['#ffb27a','        i번 물건을 넣는 최적해 ⇒ 나머지는 (i−1, w−w_i)의 최적해.'],
     ['#f4a0c0','증명(오려붙이기): 만약 부분해가 최적이 아니면, 더 좋은 부분해로 바꿔'],
     ['#f4a0c0','        전체 가치를 키울 수 있어 원해의 최적성에 모순.'],
     ['#cfd8e6','겹치는 부분문제: K[i−1][·]가 여러 K[i][·]에서 재사용 → 표로 메모.'],
     ['#cfd8e6','시간 O(nW)=의사다항(W에 비례). 분할 가능 배낭과 달리 그리디는 실패.']],
    '결론: 각 물건의 포함/제외 결정이 더 작은 같은 종류 문제로 환원되어 DP가 성립한다.')
  ,
  proofScene('algo_br_hashing_proof','algo2_05','해시 체이닝 기대 탐색 시간 Θ(1+α)',
    '단순 균등 해싱 가정 하에 체이닝 해시의 평균 탐색 시간을 기댓값으로 분석한다.',
    [['#8fe3b5','적재율 α = n/m (원소 수 / 버킷 수). 각 키가 m개 버킷에 균등 분포 가정.'],
     ['#ffb27a','실패 탐색: 키가 매핑된 버킷의 평균 길이 = α → 기대 Θ(1+α).'],
     ['#ffb27a','성공 탐색: 찾는 원소 앞에 같은 버킷에 먼저 들어온 원소 수의 기댓값'],
     ['#ffb27a','        = 1 + (평균적으로 α/2) → 역시 Θ(1+α).'],
     ['#f4a0c0','m = Θ(n)으로 유지(필요시 재해싱)하면 α = O(1) → 기대 O(1) 연산.'],
     ['#cfd8e6','단, "균등 분포"는 가정 — 적이 키를 알면 한 버킷에 몰 수 있다.'],
     ['#cfd8e6','보편 해싱: 함수족에서 무작위로 골라 어떤 두 키도 충돌 확률 ≤ 1/m 보장.']],
    '결론: 적재율 α를 상수로 유지하면 체이닝 해시의 모든 연산이 기대 O(1)이다.')
  ,
  // ===== R 재귀 구조 심화 배치 (인터랙티브) =====
  // R1 하노이 탑 — 재귀의 정수, N/P로 한 수씩 이동
  { id:'algo_br_hanoi', concept:true, branchOf:'algo7_01', codeHead:'하노이 탑',
    keys:[{code:'KeyN',key:'N',label:'다음 이동',act:function(E){ if(E._hi<E._moves.length)E._hi++; }},
          {code:'KeyP',key:'P',label:'이전 이동',act:function(E){ if(E._hi>0)E._hi--; }},
          {code:'KeyR',key:'R',label:'처음으로',act:function(E){ E._hi=0; }}],
    enter:function(E){ E.setOn&&E.setOn([]); E._hn=3; E._moves=[];
      (function rec(n,f,t,v){ if(n===0)return; rec(n-1,f,v,t); E._moves.push([n,f,t]); rec(n-1,v,t,f); })(E._hn,0,2,1);
      E._hi=0; },
    draw:function(E){ var ctx=E.ctx,W=E.W,H=E.H;
      var pegs=[[],[],[]]; for(var d=E._hn;d>=1;d--)pegs[0].push(d);
      for(var m=0;m<E._hi;m++){ var mv=E._moves[m]; pegs[mv[2]].push(pegs[mv[1]].pop()); }
      var names=['A (출발)','B (경유)','C (목표)'], baseY=H*0.80, pegH=H*0.52, maxW=W*0.24, cols=['#7ab8ff','#8fe3b5','#ffb27a','#f4a0c0','#c9a0f4'];
      ctx.textAlign='center';
      for(var p=0;p<3;p++){ var px=W*(0.24+0.26*p);
        ctx.strokeStyle='rgba(255,255,255,0.28)'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(px,baseY); ctx.lineTo(px,baseY-pegH); ctx.stroke();
        ctx.fillStyle='rgba(255,255,255,0.14)'; ctx.fillRect(px-maxW/2-6,baseY,maxW+12,5);
        ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif'; ctx.fillText(names[p],px,baseY+22);
        for(var i=0;i<pegs[p].length;i++){ var disk=pegs[p][i], dw=maxW*(0.35+0.65*disk/E._hn), dh=21, dy=baseY-(i+1)*(dh+3);
          ctx.fillStyle=cols[disk-1]||'#7ab8ff'; rrect(ctx,px-dw/2,dy,dw,dh,5); ctx.fill();
          ctx.fillStyle='#1a1c24'; ctx.font='600 12px sans-serif'; ctx.fillText(disk,px,dy+15); } }
      ctx.fillStyle='#cfd8e6'; ctx.font='600 15px sans-serif'; ctx.fillText('하노이 탑 — 원반 '+E._hn+'개를 A에서 C로 (한 번에 하나, 큰 원반은 위로 못 감)', W/2, H*0.11);
      ctx.fillStyle='#ffb27a'; ctx.font='13px sans-serif';
      var msg = E._hi===0 ? '시작: 모두 A에. N을 눌러 한 수씩 진행' : (E._hi>=E._moves.length ? '완성! 최소 '+E._moves.length+'수 = 2³−1' : E._hi+'수째: 원반 '+E._moves[E._hi-1][0]+' 을 '+names[E._moves[E._hi-1][1]][0]+'→'+names[E._moves[E._hi-1][2]][0]);
      ctx.fillText(msg, W/2, H*0.16);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('재귀: hanoi(n,A,C,B) = hanoi(n−1,A,B,C) → 원반 n을 A→C → hanoi(n−1,B,C,A)   ⟹   T(n)=2T(n−1)+1=2ⁿ−1', W/2, H*0.93);
      ctx.fillText('이동 '+E._hi+' / '+E._moves.length, W/2, H*0.97); } }
  ,
  // R2 퀵정렬 재귀 구조 — partition 후 두 갈래 재귀 트리
  { id:'algo_br_quicksort_recursion', concept:true, branchOf:'algo3_05', codeHead:'퀵정렬 재귀 구조',
    enter:function(E){ E.setOn&&E.setOn([]); },
    draw:function(E){ var ctx=E.ctx,W=E.W,H=E.H;
      // 재귀 트리: 각 노드=부분배열, 피벗=마지막원소. 미리 정해진 분할 결과를 그린다.
      var nodes=[ {x:0.5,y:0.22,a:'5 2 8 1 9 3',p:'3'},
        {x:0.27,y:0.42,a:'2 1',p:'1'}, {x:0.73,y:0.42,a:'5 8 9',p:'9'},
        {x:0.15,y:0.62,a:'·'}, {x:0.37,y:0.62,a:'2'},
        {x:0.62,y:0.62,a:'5 8',p:'8'}, {x:0.85,y:0.62,a:'·'},
        {x:0.55,y:0.80,a:'5'}, {x:0.70,y:0.80,a:'·'} ];
      var edges=[[0,1],[0,2],[1,3],[1,4],[2,5],[2,6],[5,7],[5,8]];
      ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.lineWidth=2;
      edges.forEach(function(e){ var A=nodes[e[0]],B=nodes[e[1]]; ctx.beginPath(); ctx.moveTo(A.x*W,A.y*H+14); ctx.lineTo(B.x*W,B.y*H-14); ctx.stroke(); });
      ctx.textAlign='center';
      nodes.forEach(function(n){ var tw=ctx.measureText(n.a).width+24, bx=n.x*W-tw/2, by=n.y*H-15;
        ctx.fillStyle=n.p?'rgba(244,160,192,0.14)':'rgba(143,227,181,0.14)'; ctx.strokeStyle=n.p?'#f4a0c0':'#8fe3b5'; ctx.lineWidth=1.4;
        rrect(ctx,bx,by,tw,30,7); ctx.fill(); ctx.stroke();
        ctx.fillStyle='#dfeefb'; ctx.font='13px monospace'; ctx.fillText(n.a,n.x*W,n.y*H+4);
        if(n.p){ ctx.fillStyle='#f4a0c0'; ctx.font='10px sans-serif'; ctx.fillText('피벗 '+n.p,n.x*W,n.y*H+18); } });
      ctx.fillStyle='#cfd8e6'; ctx.font='600 15px sans-serif'; ctx.fillText('퀵정렬 = partition 한 번 + 양쪽 부분배열에 같은 일을 재귀', W/2, H*0.09);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('quicksort(a,lo,hi){ if(lo<hi){ p=partition(a,lo,hi); quicksort(a,lo,p−1); quicksort(a,p+1,hi); } }', W/2, H*0.93);
      ctx.fillText('피벗(분홍)이 제자리에 박히고 왼쪽<피벗<오른쪽으로 갈라짐. 균형 분할이면 깊이 log n, 한쪽 쏠리면 n(최악).', W/2, H*0.965); } }
  ,
  // R3 병합정렬 재귀 구조 — 쪼개 내려가고(분할) 합쳐 올라온다(병합)
  { id:'algo_br_mergesort_recursion', concept:true, branchOf:'algo3_05', codeHead:'병합정렬 재귀 구조',
    keys:[{code:'KeyN',key:'N',label:'분할↔병합 전환',act:function(E){ E._msPhase=E._msPhase?0:1; }}],
    enter:function(E){ E.setOn&&E.setOn([]); E._msPhase=0; },
    draw:function(E){ var ctx=E.ctx,W=E.W,H=E.H, merge=E._msPhase;
      // 고정 트리: 분할 단계 vs 병합 단계 라벨만 다르게
      var split=[ ['38 27 43 3 9 82 10'], ['38 27 43 3','9 82 10'], ['38 27','43 3','9 82','10'], ['38','27','43','3','9','82','10'] ];
      var merged=[ ['3 9 10 27 38 43 82'], ['3 27 38 43','9 10 82'], ['27 38','3 43','9 82','10'], ['38','27','43','3','9','82','10'] ];
      var rows = merge ? merged : split;
      ctx.textAlign='center';
      for(var r=0;r<rows.length;r++){ var row=rows[r], yy=H*(0.24+r*0.16), n=row.length;
        for(var c=0;c<n;c++){ var xx=W*((c+0.5)/n), txt=row[c], tw=ctx.measureText(txt).width+18, bx=xx-tw/2;
          ctx.fillStyle=merge?'rgba(143,227,181,0.15)':'rgba(122,184,255,0.13)'; ctx.strokeStyle=merge?'#8fe3b5':'#7ab8ff'; ctx.lineWidth=1.3;
          rrect(ctx,bx,yy-13,tw,26,6); ctx.fill(); ctx.stroke();
          ctx.fillStyle='#dfeefb'; ctx.font='12px monospace'; ctx.fillText(txt,xx,yy+4);
          if(r<rows.length-1){ ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.beginPath();
            var below=rows[r+1].length, c2=Math.min(below-1, c*2+(merge?0:0));
            ctx.moveTo(xx,yy+13); ctx.lineTo(W*((Math.floor(c*below/n)+0.5)/below), H*(0.24+(r+1)*0.16)-13); ctx.stroke(); } } }
      ctx.fillStyle='#cfd8e6'; ctx.font='600 15px sans-serif';
      ctx.fillText(merge?'② 병합(merge): 정렬된 조각들을 짝지어 합치며 위로 올라온다':'① 분할(divide): 반씩 쪼개 한 칸이 될 때까지 내려간다', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('mergeSort(a){ if(len>1){ L,R=쪼갬; mergeSort(L); mergeSort(R); merge(L,R); } }   ⟹   T(n)=2T(n/2)+n=O(n log n)', W/2, H*0.93);
      ctx.fillText('층은 log n개(반씩 쪼개므로), 각 층 병합 비용 합 = n → n·log n.', W/2, H*0.97); } }
  ,
  // R4 재귀와 호출 스택 — factorial(4) 프레임 push/pop
  { id:'algo_br_callstack', branchOf:'algo7_01', impl_lang:'C++',
    impl:['#include <iostream>','using namespace std;','',
      '// 재귀: 자기 자신을 호출하며 호출 스택에 프레임을 쌓는다',
      'int fact(int n) {',
      '    if (n == 1)              // 기저 사례 — 재귀를 멈추는 조건',
      '        return 1;',
      '    return n * fact(n - 1);  // 재귀 호출: 더 작은 문제로',
      '}',
      '',
      'int main() {',
      '    std::cout << "fact(4) = " << fact(4) << "\\n";  // 24',
      '    return 0;',
      '}'],
    code:[
      'int fact(int n) {',
      '  if (n == 1)              // 기저 사례',
      '    return 1;',
      '  return n * fact(n - 1);  // 재귀 호출',
      '}'
    ],
    build:function(V){ var st=[];
      function snap(line,stack,cap,rv){ st.push({line:line, st:stack.slice(), cap:cap, rv:rv||''}); }
      snap(0,[4],'fact(4) 호출 → 호출 스택에 프레임 <b>4</b>를 push.');
      snap(1,[4],'n==1? <b>4≠1</b> → 기저 아님.');
      snap(3,[4],'<b>4 × fact(3)</b> 가 필요 → fact(3) 호출.');
      snap(0,[4,3],'fact(3) 진입 → 프레임 <b>3</b> push.');
      snap(3,[4,3],'<b>3 × fact(2)</b> → fact(2) 호출.');
      snap(0,[4,3,2],'프레임 <b>2</b> push.');
      snap(3,[4,3,2],'<b>2 × fact(1)</b> → fact(1) 호출.');
      snap(0,[4,3,2,1],'프레임 <b>1</b> push. 스택이 가장 깊어졌습니다.');
      snap(1,[4,3,2,1],'n==1? <b>1==1</b> → <b>기저 사례 도달!</b>');
      snap(2,[4,3,2,1],'<b>1을 반환</b> → 이제 위에서부터 되돌아옵니다(pop).','fact(1) = 1');
      snap(3,[4,3,2],'프레임 1 pop. fact(2) = 2×1 = <b>2</b>.','fact(2) = 2');
      snap(3,[4,3],'프레임 2 pop. fact(3) = 3×2 = <b>6</b>.','fact(3) = 6');
      snap(3,[4],'프레임 3 pop. fact(4) = 4×6 = <b>24</b>.','fact(4) = 24');
      snap(4,[],'프레임 4 pop. <b>최종 답 24</b> 반환, 스택이 비워졌습니다.','24');
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H;
      ctx.textAlign='center'; ctx.fillStyle='#cfd8e6'; ctx.font='600 15px sans-serif';
      ctx.fillText('재귀 = 호출 스택에 프레임을 쌓고(내려감) 되돌아오며 푸는(올라옴) 과정', W/2, H*0.12);
      ctx.fillStyle='#6f6e7a'; ctx.font='12px sans-serif'; ctx.fillText('▼ 호출 스택 (위 = 가장 최근 호출)', W*0.5, H*0.24);
      var bx=W*0.5, bw=Math.min(W*0.62,360), baseY=H*0.80, fh=42;
      for(var i=0;i<f.st.length;i++){ var n=f.st[i], fy=baseY-(i+1)*(fh+5), top=(i===f.st.length-1);
        ctx.fillStyle=top?'rgba(255,178,122,0.22)':'rgba(122,184,255,0.12)'; ctx.strokeStyle=top?'#ffb27a':'#7ab8ff'; ctx.lineWidth=top?2:1.2;
        rrect(ctx,bx-bw/2,fy,bw,fh,8); ctx.fill(); ctx.stroke();
        ctx.fillStyle='#dfeefb'; ctx.font='15px monospace'; ctx.textAlign='center';
        ctx.fillText('fact('+n+')  '+(n===1?'→ return 1':'= '+n+' × fact('+(n-1)+')'), bx, fy+26); }
      if(f.st.length===0){ ctx.fillStyle='#8fe3b5'; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.fillText('(스택 비어 있음)', bx, baseY-20); }
      if(f.rv){ ctx.fillStyle='#8fe3b5'; ctx.font='600 16px monospace'; ctx.textAlign='center'; ctx.fillText('↩ 반환  '+f.rv, W*0.5, H*0.90); } }
  },
  // R5 트리 순회 재귀 — 중위 순회의 호출 순서
  { id:'algo_br_tree_recursion', concept:true, branchOf:'algo5_02', codeHead:'트리 순회 재귀',
    keys:[{code:'KeyN',key:'N',label:'다음 방문',act:function(E){ if(E._tvi<E._tvOrder.length)E._tvi++; }},
          {code:'KeyP',key:'P',label:'이전',act:function(E){ if(E._tvi>0)E._tvi--; }},
          {code:'KeyR',key:'R',label:'처음으로',act:function(E){ E._tvi=0; }}],
    enter:function(E){ E.setOn&&E.setOn([]);
      // 완전이진트리 배열: 인덱스 0..6, 값
      E._tvVals=[4,2,6,1,3,5,7];
      // 중위 순회 방문 순서(인덱스): 3,1,4,0,5,2,6
      E._tvOrder=[3,1,4,0,5,2,6]; E._tvi=0; },
    draw:function(E){ var ctx=E.ctx,W=E.W,H=E.H, vals=E._tvVals;
      var visited={}; for(var k=0;k<E._tvi;k++)visited[E._tvOrder[k]]=k+1;
      var cur = E._tvi>0 ? E._tvOrder[E._tvi-1] : -1;
      drawTreeB(E, vals, function(j){ if(j===cur) return {fill:'rgba(255,178,122,0.3)',stroke:'#ffb27a',text:'#fff',tag:visited[j]?('#'+visited[j]):null};
        if(visited[j]) return {fill:'rgba(143,227,181,0.18)',stroke:'#8fe3b5',text:'#dfeefb',tag:'#'+visited[j]};
        return null; }, {top:0.30, r:20});
      ctx.textAlign='center'; ctx.fillStyle='#cfd8e6'; ctx.font='600 15px sans-serif';
      ctx.fillText('중위 순회(inorder) = 왼쪽 재귀 → 자기 방문 → 오른쪽 재귀', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('inorder(x){ if(x){ inorder(x.left); visit(x); inorder(x.right); } }', W/2, H*0.155);
      var seq=E._tvOrder.slice(0,E._tvi).map(function(idx){return vals[idx];});
      ctx.fillStyle='#8fe3b5'; ctx.font='600 14px monospace';
      ctx.fillText('방문 순서: '+(seq.length?seq.join(' → '):'(N을 눌러 시작)'), W/2, H*0.86);
      ctx.fillStyle='#ffb27a'; ctx.font='13px sans-serif';
      ctx.fillText('BST에서 중위 순회는 항상 오름차순 — 재귀가 트리의 좌→중→우 구조를 그대로 따라감', W/2, H*0.92);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('방문 '+E._tvi+' / '+E._tvOrder.length+'   ·   전위=중간을 먼저, 후위=중간을 마지막에', W/2, H*0.97); } }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
