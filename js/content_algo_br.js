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

  var scenes=[

  // ══════ 퀵정렬(algo3_05) ▸ 최악의 경우 O(n²) ══════
  { id:'algo_br_qs1', concept:true, branchOf:'algo3_05',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, levels=[[1,2,3,4,5,6],[1,2,3,4,5],[1,2,3,4],[1,2,3],[1,2]], top=E.H*0.22, lh=E.H*0.10, cell=34, cx=E.W/2;
      for(var L=0;L<levels.length;L++){ var a=levels[L], x0=cx-(a.length*cell)/2, y=top+L*lh;
        for(var i=0;i<a.length;i++){ var x=x0+i*cell, isPivot=(i===a.length-1);
          ctx.fillStyle=isPivot?'rgba(244,160,192,0.3)':'rgba(122,184,255,0.12)'; ctx.strokeStyle=isPivot?'#f4a0c0':'#7ab8ff'; ctx.lineWidth=1.5;
          ctx.fillRect(x,y,cell-3,cell-3); ctx.strokeRect(x,y,cell-3,cell-3);
          ctx.fillStyle='#dfeefb'; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(a[i],x+cell/2-1,y+cell/2-1); ctx.textBaseline='alphabetic'; }
        ctx.fillStyle='#f4a0c0'; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('피벗 '+a[a.length-1]+' → 한쪽만 줄어듦', x0+a.length*cell+12, y+cell/2); }
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('비교 = (n−1)+(n−2)+…+1 = n(n−1)/2  (가우스 합!)', cx, top+levels.length*lh+24);
      E.big('이미 정렬된 입력 + 끝값 피벗 = O(n²)', '퀵정렬 최악의 경우 — 분할이 (n−1):0으로 치우쳐 깊이 n. 좋은 피벗이 관건 (다음 분기: 랜덤화)'); }
  },

  // ══════ 퀵정렬(algo3_05) ▸ 랜덤화된 퀵정렬 ══════
  { id:'algo_br_qs2', concept:true, branchOf:'algo3_05',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, cx=E.W/2, cy=E.H*0.30;
      // 균형 분할 트리 (랜덤 피벗 → 기대 균형)
      function box(x,y,w,col){ ctx.fillStyle=col.replace(')',',0.14)').replace('#','rgba('); ctx.fillStyle='rgba(143,227,181,0.14)'; ctx.strokeStyle=col; ctx.lineWidth=1.5; ctx.fillRect(x-w/2,y,w,20); ctx.strokeRect(x-w/2,y,w,20); }
      var W0=E.W*0.5;
      box(cx,cy,W0,'#8fe3b5');
      box(cx-W0*0.27,cy+44,W0*0.46,'#8fe3b5'); box(cx+W0*0.27,cy+44,W0*0.46,'#8fe3b5');
      var q=W0*0.21;
      [cx-W0*0.38,cx-W0*0.14,cx+W0*0.14,cx+W0*0.38].forEach(function(X){ box(X,cy+88,q,'#8fe3b5'); });
      ctx.fillStyle='#8fe3b5'; ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillText('log n 층', cx+W0*0.5+16, cy+50);
      ctx.fillStyle='#9b99a3'; ctx.textAlign='center';
      ctx.fillText('무작위 피벗 → 기대 균형 분할 → 깊이 ≈ log n', cx, cy+130);
      E.big('랜덤화된 퀵정렬 = 기대 O(n log n)', '피벗을 무작위로 고르면 최악(정렬된 입력)을 입력이 아닌 운에 맡겨, 어떤 입력에도 기대 O(n log n). 실전 표준'); }
  },

  // ══════ 빅오(algo1_03) ▸ 마스터 정리 ══════
  { id:'algo_br_master', concept:true, branchOf:'algo1_03',
    enter:function(E){ this.s={k:0}; this.ex=[
        {r:'T(n)=2T(n/2)+n', a:2,b:2,f:'n', cmp:'n^(log₂2)=n¹ = f(n)', res:'Θ(n log n)', note:'병합정렬 (case 2)'},
        {r:'T(n)=2T(n/2)+1', a:2,b:2,f:'1', cmp:'n¹ > f(n)', res:'Θ(n)', note:'트리 순회 (case 1)'},
        {r:'T(n)=T(n/2)+1', a:1,b:2,f:'1', cmp:'n⁰=1 = f(n)', res:'Θ(log n)', note:'이분탐색 (case 2)'},
        {r:'T(n)=3T(n/2)+n', a:3,b:2,f:'n', cmp:'n^(log₂3)≈n¹·⁵⁸ > f', res:'Θ(n^1.58)', note:'카라츠바류 (case 1)'} ]; E.setOn([]);
      E.controls('<div class="ctrl"><label>예시 점화식</label><input type="range" id="kk" min="0" max="3" step="1" value="0"><output id="kko">병합정렬</output></div>');
      var self=this; E.bind('#kk','input',function(e){ self.s.k=+e.target.value; document.getElementById('kko').textContent=self.ex[self.s.k].note.split(' (')[0]; E.blip(440,0.1); }); },
    draw:function(E){ var ctx=E.ctx, ex=this.ex[this.s.k], cx=E.W/2, y=E.H*0.34;
      ctx.font='600 24px sans-serif'; ctx.textAlign='center'; ctx.fillStyle='#7ab8ff'; ctx.fillText(ex.r, cx, y);
      ctx.font='15px sans-serif'; ctx.fillStyle='#9b99a3'; ctx.fillText('분할 a='+ex.a+' 조각, 크기 1/'+ex.b+', 합치기 f(n)='+ex.f, cx, y+34);
      ctx.fillStyle='#ffb27a'; ctx.fillText('n^(log_b a) 와 f(n) 비교:  '+ex.cmp, cx, y+64);
      ctx.font='600 26px sans-serif'; ctx.fillStyle='#8fe3b5'; ctx.fillText('→ '+ex.res, cx, y+104);
      ctx.font='13px sans-serif'; ctx.fillStyle='#6f6e7a'; ctx.fillText(ex.note, cx, y+130);
      E.big('마스터 정리 — 점화식을 한눈에', '분할정복 T(n)=a·T(n/b)+f(n)의 복잡도를 n^(log_b a)와 f(n)의 비교로 즉결. 재귀 트리를 풀지 않고 답!'); }
  },

  // ══════ 병합(algo3_04) ▸ 정렬의 하한 (결정 트리) ══════
  { id:'algo_br_lb', concept:true, branchOf:'algo3_04',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, cx=E.W/2, top=E.H*0.20;
      function nd(x,y,t,leaf){ var w=leaf?70:50,h=26; ctx.fillStyle=leaf?'rgba(143,227,181,0.18)':'rgba(122,184,255,0.16)'; ctx.strokeStyle=leaf?'#8fe3b5':'#7ab8ff'; ctx.lineWidth=1.5;
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x-w/2,y,w,h,6);ctx.fill();ctx.stroke();}else ctx.strokeRect(x-w/2,y,w,h);
        ctx.fillStyle=leaf?'#8fe3b5':'#bfe0ff'; ctx.font=(leaf?'11px':'600 13px')+' sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(t,x,y+13); ctx.textBaseline='alphabetic'; }
      function ed(x1,y1,x2,y2){ ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(x1,y1+26); ctx.lineTo(x2,y2); ctx.stroke(); }
      var dy=E.H*0.155, L=E.W*0.22, M=E.W*0.11;
      nd(cx,top,'a:b');
      ed(cx,top,cx-L,top+dy); ed(cx,top,cx+L,top+dy);
      nd(cx-L,top+dy,'b:c'); nd(cx+L,top+dy,'a:c');
      var lv=top+2*dy, xs=[cx-L-M,cx-L+M,cx+L-M,cx+L+M], labs=['abc','acb / cab','bac','bca / cba'];
      for(var i=0;i<4;i++){ ed([cx-L,cx-L,cx+L,cx+L][i], top+dy, xs[i], lv); nd(xs[i],lv,labs[i],true); }
      ctx.fillStyle='#ffb27a'; ctx.font='600 15px sans-serif'; ctx.textAlign='center';
      ctx.fillText('잎(가능한 순서) = n!  ≤  2^(트리 높이 h)', cx, lv+58);
      ctx.fillStyle='#9b99a3'; ctx.font='14px sans-serif'; ctx.fillText('→ h ≥ log₂(n!) = Ω(n log n)', cx, lv+84);
      E.big('비교 정렬의 한계 — Ω(n log n)', '비교만으로 정렬하는 모든 알고리즘 = 결정 트리. n!개 결과를 구분하려면 높이 ≥ log₂(n!) → 어떤 비교정렬도 O(n log n)보다 빠를 수 없음!'); }
  },

  // ══════ 병합(algo3_04) ▸ 계수 정렬 ══════
  { id:'algo_br_count', concept:true, branchOf:'algo3_04',
    enter:function(E){ this.A=[2,5,3,0,2,3,0,3]; this.K=6; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, A=this.A, K=this.K, cnt=[];
      for(var v=0;v<K;v++) cnt[v]=0; A.forEach(function(x){cnt[x]++;});
      var out=[]; for(var v2=0;v2<K;v2++) for(var c=0;c<cnt[v2];c++) out.push(v2);
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('입력 (값 0~'+(K-1)+')', E.W/2, E.H*0.20);
      AV.arr(E, A, { y:E.H*0.23, bw:44, cx:E.W/2 });
      ctx.fillText('각 값의 개수를 센다 (count)', E.W/2, E.H*0.42);
      AV.arr(E, cnt, { y:E.H*0.45, bw:44, idx:true, cx:E.W/2, hl:function(i){ return {fill:'rgba(255,178,122,0.22)',stroke:'#ffb27a',text:'#ffb27a'}; } });
      ctx.fillText('센 개수대로 펼치면 정렬 완료!', E.W/2, E.H*0.64);
      AV.arr(E, out, { y:E.H*0.67, bw:44, cx:E.W/2, hl:function(i){ return {fill:'rgba(143,227,181,0.2)',stroke:'#8fe3b5',text:'#8fe3b5'}; } });
      E.big('계수 정렬 — 비교 없이 O(n + k)', '값의 범위 k가 작을 때, 비교 대신 각 값의 개수를 세서 정렬! 하한 Ω(n log n)을 우회(비교를 안 하니까). 안정 정렬'); }
  },

  // ══════ 병합(algo3_04) ▸ 기수 정렬 ══════
  { id:'algo_br_radix', concept:true, branchOf:'algo3_04',
    enter:function(E){ this.base=[329,457,657,839,436,720,355]; this.s={pass:0}; E.setOn([]); },
    tap:function(E){ this.s.pass=(this.s.pass+1)%4; E.blip(440+this.s.pass*60,0.1); },
    draw:function(E){ var ctx=E.ctx, s=this.s, arr=this.base.slice();
      function digit(n,d){ return Math.floor(n/Math.pow(10,d))%10; }
      // pass번 LSD 안정정렬 적용한 상태 계산
      for(var p=0;p<s.pass;p++){ arr.sort(function(a,b){ return digit(a,p)-digit(b,p); }); }
      var dnames=['원본','1의 자리','10의 자리','100의 자리'];
      AV.arr(E, arr, { y:E.H*0.40, bw:72, cx:E.W/2, hl:function(i){ return {fill:'rgba(122,184,255,0.16)',stroke:'#7ab8ff',text:'#dfeefb'}; } });
      ctx.fillStyle='#ffb27a'; ctx.font='600 15px sans-serif'; ctx.textAlign='center';
      ctx.fillText(s.pass===0?'정렬 전':((s.pass)+'단계: '+dnames[s.pass]+'로 안정 정렬'), E.W/2, E.H*0.34);
      E.tapHint(E.W/2, E.H*0.56, s.pass>=3?'↻ 다시':'▶ 다음 자릿수로 정렬', true);
      E.big('기수 정렬 — 자릿수별로 O(d(n+k))', '낮은 자리(1의자리)부터 높은 자리로, 각 자리를 계수정렬(안정)로 반복. d자리면 d번. 자릿수가 적으면 사실상 선형!'); }
  },

  // ══════ 퀵(algo3_05) ▸ 순서 통계 / quickselect ══════
  { id:'algo_br_select', concept:true, branchOf:'algo3_05',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, cx=E.W/2;
      var full=[3,7,1,8,2,5,9,4], k=4; // 4번째 작은 값 찾기
      AV.bars(E, full, { baseY:E.H*0.40, maxH:E.H*0.22, bw:40, label:true, cx:cx, hl:function(i){ return '#7ab8ff'; } });
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('피벗으로 분할 후, k가 있는 쪽만 재귀 (반대쪽 버림)', cx, E.H*0.46);
      // 한쪽만 남기는 도식
      var keep=[3,1,2], drop=[7,8,5,9];
      AV.bars(E, keep, { baseY:E.H*0.74, maxH:E.H*0.18, bw:40, label:true, cx:cx-E.W*0.16, hl:function(){ return '#8fe3b5'; } });
      ctx.fillStyle='#8fe3b5'; ctx.fillText('이쪽만 재귀 ✓', cx-E.W*0.16, E.H*0.78);
      ctx.fillStyle='#6f6e7a'; ctx.fillText('버림 ✗', cx+E.W*0.18, E.H*0.66);
      E.big('순서 통계 — k번째 값을 평균 O(n)', '퀵정렬은 양쪽 다 재귀(O(n log n))지만, k번째만 찾을 땐 k가 있는 한쪽만 재귀 → 평균 O(n)! (정렬 안 하고 중앙값 찾기)'); }
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
  { id:'algo_br_buildheap', concept:true, branchOf:'algo5_04',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, cx=E.W/2, y0=E.H*0.30;
      ctx.font='15px sans-serif'; ctx.textAlign='center';
      ctx.fillStyle='#cfcdc6'; ctx.fillText('힙 만들기: 마지막 부모(n/2)부터 거꾸로 sift-down', cx, y0);
      ctx.fillStyle='#7ab8ff'; ctx.font='600 17px sans-serif';
      ctx.fillText('순진하게: n개 × 각 O(log n) = O(n log n)?', cx, y0+44);
      ctx.fillStyle='#8fe3b5'; ctx.fillText('실제로는 O(n)!', cx, y0+80);
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif';
      ctx.fillText('대부분의 노드는 트리 바닥 근처 → sift-down 거리가 짧다', cx, y0+112);
      ctx.fillText('높이 h인 노드 수 ≈ n/2^(h+1), Σ h·n/2^(h+1) = O(n)', cx, y0+136);
      E.big('build-heap = O(n) (놀랍게도!)', 'n개를 힙으로 만드는 건 O(n log n)이 아니라 O(n). 바닥 노드가 압도적으로 많고 그들의 이동 거리가 짧아서 — 합이 O(n)으로 수렴'); }
  },

  // ══════ DFS(algo6_04) ▸ 위상 정렬 ══════
  { id:'algo_br_topo', concept:true, branchOf:'algo6_04',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx;
      var P=[[0.16,0.30],[0.16,0.62],[0.46,0.22],[0.46,0.58],[0.32,0.86],[0.80,0.50]];
      var NM=['속옷','바지','셔츠','벨트','신발','재킷'];
      var EG=[[0,1],[1,3],[2,3],[3,5],[1,4],[2,5]];
      function px(i){ return [E.W*0.12+P[i][0]*E.W*0.62, E.H*0.16+P[i][1]*E.H*0.56]; }
      EG.forEach(function(e){ gedge(E, px(e[0]), px(e[1]), 'rgba(122,184,255,0.5)'); });
      for(var i=0;i<P.length;i++){ var p=px(i); AV.node(E,p[0],p[1],NM[i],{r:24,fs:12,fill:'rgba(122,184,255,0.16)',stroke:'#7ab8ff'}); }
      var order=['속옷','셔츠','바지','벨트','신발','재킷'];
      ctx.fillStyle='#8fe3b5'; ctx.font='600 16px sans-serif'; ctx.textAlign='center';
      ctx.fillText('위상 순서:  '+order.join('  →  '), E.W/2, E.H*0.84);
      E.big('위상 정렬 — 순서가 있는 작업 줄세우기', '방향 비순환 그래프(DAG)에서 "A→B면 A가 먼저"를 모두 만족하는 일렬 순서. DFS 끝나는 역순! 작업 스케줄·빌드 의존성·선수과목'); }
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
  { id:'algo_br_bellman', concept:true, branchOf:'algo6_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx;
      var P=[[0.12,0.4],[0.42,0.2],[0.42,0.62],[0.74,0.4]];
      var NM=['A','B','C','D'], dist=['0','6','7','2'];
      var EG=[[0,1,6],[0,2,7],[1,2,8],[1,3,-4],[2,3,-3]];
      function px(i){ return [E.W*0.16+P[i][0]*E.W*0.56, E.H*0.20+P[i][1]*E.H*0.5]; }
      EG.forEach(function(e){ gedge(E, px(e[0]), px(e[1]), e[2]<0?'#f4a0c0':'rgba(122,184,255,0.5)', 2, e[2]); });
      for(var i=0;i<P.length;i++){ var p=px(i); AV.node(E,p[0],p[1],NM[i]+':'+dist[i],{r:24,fs:13,fill:i===0?'rgba(255,178,122,0.25)':'rgba(122,184,255,0.16)',stroke:i===0?'#ffb27a':'#7ab8ff'}); }
      ctx.fillStyle='#f4a0c0'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('분홍 = 음수 간선 (다익스트라는 못 다룸!)', E.W/2, E.H*0.80);
      E.big('벨만-포드 — 음수 간선도 OK', '모든 간선을 V−1번 반복 완화(relax). 다익스트라(그리디)와 달리 음수 가중치 허용! O(VE). 한 번 더 완화되면 음수 사이클 존재 = 탐지'); }
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
  { id:'algo_br_mst', concept:true, branchOf:'algo6_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx;
      var P=[[0.15,0.25],[0.5,0.15],[0.85,0.3],[0.25,0.7],[0.6,0.72]];
      var NM=['A','B','C','D','E'];
      var EG=[[0,1,3,1],[1,2,5,0],[0,3,2,1],[3,4,4,1],[1,4,6,0],[2,4,1,1],[1,3,7,0]]; // [u,v,w,inMST]
      function px(i){ return [E.W*0.14+P[i][0]*E.W*0.6, E.H*0.18+P[i][1]*E.H*0.52]; }
      EG.forEach(function(e){ uedge(E, px(e[0]), px(e[1]), e[3]?'#8fe3b5':'rgba(255,255,255,0.18)', e[3]?3:1.5, e[2]); });
      for(var i=0;i<P.length;i++){ var p=px(i); AV.node(E,p[0],p[1],NM[i],{r:22,fill:'rgba(122,184,255,0.16)',stroke:'#7ab8ff'}); }
      ctx.fillStyle='#8fe3b5'; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.fillText('초록 = 선택된 MST 간선 (총 가중치 최소, 사이클 없이 전부 연결)', E.W/2, E.H*0.84);
      E.big('최소 신장 트리(MST) — 최소 비용 연결', '모든 정점을 사이클 없이 잇는 가장 싼 방법. 크루스칼(간선 정렬+union-find로 사이클 회피) / 프림(다익스트라처럼 우선순위큐로 성장). 둘 다 그리디!'); }
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
  { id:'algo_br_lcs', concept:true, branchOf:'algo7_05',
    enter:function(E){ this.X='ABCB'; this.Y='BDCB'; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, X=this.X, Y=this.Y, m=X.length, n=Y.length;
      var dp=[]; for(var i=0;i<=m;i++){ dp[i]=[]; for(var j=0;j<=n;j++){ if(i===0||j===0)dp[i][j]=0; else if(X[i-1]===Y[j-1])dp[i][j]=dp[i-1][j-1]+1; else dp[i][j]=Math.max(dp[i-1][j],dp[i][j-1]); } }
      var cell=Math.min(56,E.H*0.085), x0=E.W/2-(n+1)*cell/2+cell*0.5, y0=E.H*0.26;
      // 헤더 (Y)
      ctx.font='600 14px sans-serif'; ctx.textAlign='center';
      for(var j=0;j<n;j++){ ctx.fillStyle='#8fe3b5'; ctx.fillText(Y[j], x0+(j+1)*cell+cell/2, y0-6); }
      for(var i=0;i<m;i++){ ctx.fillStyle='#ffb27a'; ctx.fillText(X[i], x0-cell/2, y0+(i+1)*cell+cell/2+4); }
      for(var i=0;i<=m;i++)for(var j=0;j<=n;j++){ var x=x0+j*cell,y=y0+i*cell, match=(i>0&&j>0&&X[i-1]===Y[j-1]);
        ctx.fillStyle=match?'rgba(143,227,181,0.22)':'rgba(122,184,255,0.08)'; ctx.strokeStyle=match?'#8fe3b5':'rgba(122,184,255,0.3)'; ctx.lineWidth=1; ctx.fillRect(x,y,cell-2,cell-2); ctx.strokeRect(x,y,cell-2,cell-2);
        ctx.fillStyle=(i===m&&j===n)?'#ffb27a':'#dfeefb'; ctx.font=(i===m&&j===n?'600 18px':'14px')+' sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(dp[i][j], x+cell/2-1, y+cell/2-1); ctx.textBaseline='alphabetic'; }
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('글자가 같으면 ↖+1, 다르면 max(↑, ←)', E.W/2, y0+(m+1)*cell+24);
      E.big('LCS("'+X+'", "'+Y+'") = '+dp[m][n]+'  ("BCB")', '최장 공통 부분수열 — 두 문자열에 공통으로(순서대로) 나타나는 가장 긴 수열. 격자 DP. DNA 비교·diff·맞춤법 교정의 핵심'); }
  },

  // ══════ 격자 DP(algo7_05) ▸ 0/1 배낭 ══════
  { id:'algo_br_knap', concept:true, branchOf:'algo7_05',
    enter:function(E){ this.items=[[2,3],[3,4],[4,5],[5,6]]; this.cap=5; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, it=this.items, cap=this.cap, n=it.length;
      var dp=[]; for(var i=0;i<=n;i++){ dp[i]=[]; for(var w=0;w<=cap;w++){ if(i===0)dp[i][w]=0; else if(it[i-1][0]>w)dp[i][w]=dp[i-1][w]; else dp[i][w]=Math.max(dp[i-1][w], dp[i-1][w-it[i-1][0]]+it[i-1][1]); } }
      // 선택된 아이템 역추적
      var sel={}, w=cap; for(var i=n;i>0;i--){ if(dp[i][w]!==dp[i-1][w]){ sel[i-1]=true; w-=it[i-1][0]; } }
      ctx.fillStyle='#9b99a3'; ctx.font='14px sans-serif'; ctx.textAlign='center'; ctx.fillText('배낭 용량 '+cap+'kg — 가치 합을 최대로', E.W/2, E.H*0.24);
      var bw=120, gap=18, total=n*bw+(n-1)*gap, x0=E.W/2-total/2, y=E.H*0.34;
      for(var k=0;k<n;k++){ var x=x0+k*(bw+gap), on=sel[k];
        ctx.fillStyle=on?'rgba(143,227,181,0.22)':'rgba(255,255,255,0.04)'; ctx.strokeStyle=on?'#8fe3b5':'rgba(255,255,255,0.25)'; ctx.lineWidth=2;
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,bw,72,10);ctx.fill();ctx.stroke();}else ctx.strokeRect(x,y,bw,72);
        ctx.fillStyle=on?'#8fe3b5':'#cfcdc6'; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.fillText('물건 '+(k+1), x+bw/2, y+24);
        ctx.font='13px sans-serif'; ctx.fillText(it[k][0]+'kg / ₩'+it[k][1], x+bw/2, y+46); if(on){ ctx.fillStyle='#8fe3b5'; ctx.fillText('✓ 담음', x+bw/2, y+64); } }
      E.big('최대 가치 = ₩'+dp[n][cap]+' (용량 '+cap+'kg)', '0/1 배낭 — 각 물건을 담거나 말거나, 무게 한도 내 가치 최대화. dp[i][w] 표를 채워 해결(격자 DP). 자원 배분의 대표 문제'); }
  },

  // ══════ 복잡도 등급표(algo1_05) ▸ 분할상환 분석 ══════
  { id:'algo_br_amort', concept:true, branchOf:'algo1_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, N=16, x0=E.W*0.16, w=E.W*0.68, bw=w/N, baseY=E.H*0.66, unit=E.H*0.034;
      // push 비용: 보통 1, 용량(1,2,4,8) 꽉찰때 복사
      var cost=[]; for(var i=1;i<=N;i++){ cost[i]= (i>1 && (i-1 & (i-2))===0 && (i-1)>=1)?(i-1):1; }
      // 간단화: i가 2의 거듭제곱+1 일 때 복사비용 i-1
      var total=0;
      for(var i=1;i<=N;i++){ var c=1; if(i===2||i===3||i===5||i===9){ c=i-1; } // 복사 시점 근사
        total+=c; var h=c*unit, x=x0+(i-1)*bw;
        ctx.fillStyle=c>1?'rgba(244,160,192,0.4)':'rgba(122,184,255,0.3)'; ctx.strokeStyle=c>1?'#f4a0c0':'#7ab8ff'; ctx.lineWidth=1;
        ctx.fillRect(x,baseY-h,bw-2,h); ctx.strokeRect(x,baseY-h,bw-2,h); }
      // 평균선
      ctx.strokeStyle='#8fe3b5'; ctx.lineWidth=1.5; ctx.setLineDash([6,4]); ctx.beginPath(); ctx.moveTo(x0,baseY-3*unit); ctx.lineTo(x0+w,baseY-3*unit); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='#8fe3b5'; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('분할상환 평균 ≈ 3 = O(1)', x0+w-160, baseY-3*unit-6);
      ctx.fillStyle='#f4a0c0'; ctx.textAlign='center'; ctx.fillText('분홍 = 배열 꽉 참 → 2배로 복사(가끔 비쌈)', E.W/2, E.H*0.74);
      E.big('분할상환 분석 — 가끔 비싸도 평균은 싸다', '동적 배열 push는 보통 O(1)이지만 꽉 차면 2배 복사(O(n)). 그래도 n번 총비용 = n+(1+2+4+…) ≈ 3n → 1번당 평균 O(1)! 최악 1회가 아닌 "긴 안목"의 분석'); }
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
  { id:'algo_br_approx', concept:true, branchOf:'algo8_04',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, cx=E.W/2, y0=E.H*0.26;
      ctx.font='15px sans-serif'; ctx.textAlign='center';
      ctx.fillStyle='#f4a0c0'; ctx.fillText('NP-난해 문제(외판원 TSP 등) — 최적해를 빠르게 못 구함', cx, y0);
      ctx.fillStyle='#cfcdc6'; ctx.font='600 17px sans-serif'; ctx.fillText('그럼 포기? 아니, "충분히 좋은" 답을!', cx, y0+40);
      ctx.fillStyle='#8fe3b5'; ctx.fillText('근사 알고리즘: 다항시간 + 최적의 c배 이내 보장', cx, y0+76);
      ctx.fillStyle='#9b99a3'; ctx.font='14px sans-serif';
      ctx.fillText('예) TSP(삼각부등식) — MST 기반 2-근사 (최적의 2배 이내)', cx, y0+112);
      ctx.fillText('예) 정점 커버 — 간선 양끝 모두 선택, 2-근사', cx, y0+138);
      E.big('근사 알고리즘 — 최적은 못 풀어도', 'P≠NP라면 NP-난해 문제의 최적해는 사실상 불가. 대신 "최적의 c배 이내"를 다항시간에 보장하는 근사 알고리즘으로 현실 문제를 풉니다. 휴리스틱과 함께 실전의 답'); }
  },

  // ══════ 분할정복(algo8_03) ▸ 스트라센 행렬곱 ══════
  { id:'algo_br_strassen', concept:true, branchOf:'algo8_03',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, cx=E.W/2, y=E.H*0.34;
      function blk(x,y,labs,col){ var c=44; for(var i=0;i<2;i++)for(var j=0;j<2;j++){ ctx.fillStyle='rgba(122,184,255,0.1)'; ctx.strokeStyle=col; ctx.lineWidth=1.5; ctx.fillRect(x+j*c,y+i*c,c-2,c-2); ctx.strokeRect(x+j*c,y+i*c,c-2,c-2); ctx.fillStyle='#dfeefb'; ctx.font='600 16px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(labs[i*2+j],x+j*c+c/2,y+i*c+c/2); ctx.textBaseline='alphabetic'; } }
      blk(cx-200,y,['A','B','C','D'],'#7ab8ff');
      ctx.fillStyle='#9b99a3'; ctx.font='600 22px sans-serif'; ctx.textAlign='center'; ctx.fillText('×', cx-26, y+44);
      blk(cx+12,y,['E','F','G','H'],'#8fe3b5');
      ctx.fillStyle='#f4a0c0'; ctx.font='15px sans-serif'; ctx.textAlign='center';
      ctx.fillText('순진한 분할: 곱셈 8번 → T(n)=8T(n/2)+O(n²)=O(n³)', cx, y+140);
      ctx.fillStyle='#8fe3b5'; ctx.fillText('스트라센: 영리하게 곱셈 7번! → T(n)=7T(n/2)+O(n²)', cx, y+168);
      ctx.fillStyle='#ffb27a'; ctx.font='600 18px sans-serif'; ctx.fillText('= O(n^log₂7) ≈ O(n^2.81)', cx, y+200);
      E.big('스트라센 행렬곱 — 8번을 7번으로', '2×2 블록 곱은 보통 곱셈 8번. 스트라센은 덧셈을 늘리는 대신 곱셈을 7번으로 줄여 O(n³)→O(n^2.81)! 마스터 정리(case 1)로 분석. 분할정복의 영리함'); }
  },

  // ══════ 분할정복(algo8_03) ▸ FFT 고속 푸리에 변환 ══════
  { id:'algo_br_fft', concept:true, branchOf:'algo8_03',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, cx=E.W/2, y0=E.H*0.26;
      ctx.font='15px sans-serif'; ctx.textAlign='center';
      ctx.fillStyle='#cfcdc6'; ctx.fillText('두 다항식(또는 큰 수) 곱하기', cx, y0);
      ctx.fillStyle='#f4a0c0'; ctx.font='600 16px sans-serif'; ctx.fillText('순진하게 항끼리 다 곱: O(n²)', cx, y0+36);
      ctx.fillStyle='#8fe3b5'; ctx.fillText('FFT: 계수 → 점값 표현으로 바꿔 곱하면 O(n log n)!', cx, y0+72);
      ctx.fillStyle='#9b99a3'; ctx.font='14px sans-serif';
      ctx.fillText('비결: 짝수·홀수 계수로 분할(분할정복) + 복소수 단위근 활용', cx, y0+108);
      ctx.fillStyle='#7ab8ff'; ctx.fillText('계수표현 ⇄ 점값표현 (복소평면!)', cx, y0+136);
      E.big('FFT — 곱셈을 O(n log n)으로', '고속 푸리에 변환. 다항식·큰수 곱셈을 O(n²)에서 O(n log n)으로! 짝/홀 분할정복 + 복소수 단위근. 신호처리·이미지·음향의 심장'); }
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
  { id:'algo_br_lp', concept:true, branchOf:'algo8_04',
    enter:function(E){ E.Plot.range(-0.5,5,-0.5,4); E.setOn([]); },
    draw:function(E){ var P=E.Plot, ctx=E.ctx; P.axes();
      // 실행가능영역: x,y≥0, x+y≤4, x+3y≤6 → 꼭짓점 (0,0)(4,0)(3,1)(0,2)
      var V=[[0,0],[4,0],[3,1],[0,2]];
      ctx.fillStyle='rgba(122,184,255,0.18)'; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2; ctx.beginPath();
      V.forEach(function(v,i){ if(i===0)ctx.moveTo(P.X(v[0]),P.Y(v[1])); else ctx.lineTo(P.X(v[0]),P.Y(v[1])); }); ctx.closePath(); ctx.fill(); ctx.stroke();
      // 목적함수 x+2y 최대 → (3,1)=5
      V.forEach(function(v){ var opt=(v[0]===3&&v[1]===1); P.dot(v[0],v[1], opt?'#ffb27a':'#8fe3b5', opt?'최적('+v[0]+','+v[1]+') = 5':null); });
      // 목적함수 방향 화살표
      ctx.strokeStyle='rgba(244,160,192,0.7)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(P.X(0),P.Y(0)); ctx.lineTo(P.X(1),P.Y(2)); ctx.stroke();
      ctx.fillStyle='#f4a0c0'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('목적함수 z=x+2y 증가 방향 → 최적은 꼭짓점에서!', E.W/2, E.H*0.82);
      E.big('선형계획법 — 제약 속 최적화', '여러 일차 부등식(제약)이 만드는 다각형 영역에서 일차 목적함수를 최대/최소화. ★최적해는 항상 꼭짓점! 심플렉스(꼭짓점 순회)·내부점법. 생산·물류·금융 최적화의 기본'); }
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
  { id:'algo_br_closest', concept:true, branchOf:'algo8_03',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx;
      var pts=[[0.15,0.3],[0.3,0.65],[0.45,0.35],[0.52,0.4],[0.7,0.25],[0.78,0.7],[0.88,0.5],[0.6,0.78]];
      function px(i){ return [E.W*0.2+pts[i][0]*E.W*0.55, E.H*0.2+pts[i][1]*E.H*0.5]; }
      // 분할선
      ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1.5; ctx.setLineDash([6,4]); var mid=E.W*0.2+0.5*E.W*0.55; ctx.beginPath(); ctx.moveTo(mid,E.H*0.16); ctx.lineTo(mid,E.H*0.72); ctx.stroke(); ctx.setLineDash([]);
      // 가장 가까운 쌍 = pts[2],pts[3] (0.45,0.35)-(0.52,0.4)
      var a=px(2),b=px(3); ctx.strokeStyle='#ffb27a'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke();
      for(var i=0;i<pts.length;i++){ var p=px(i), close=(i===2||i===3); ctx.fillStyle=close?'#ffb27a':'#7ab8ff'; ctx.beginPath(); ctx.arc(p[0],p[1],close?7:5,0,Math.PI*2); ctx.fill(); }
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('점선=좌우 분할 / 주황=가장 가까운 두 점', E.W/2, E.H*0.80);
      E.big('가장 가까운 점 쌍 — O(n log n)', '평면 점들 중 가장 가까운 두 점. 모든 쌍 비교는 O(n²)지만, 분할정복(좌우로 쪼개 각각 + 경계 띠만 검사)으로 O(n log n)! 충돌감지·군집화·지도 서비스'); }
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
  { id:'algo_br_insinv', concept:true, branchOf:'algo3_03',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, arr=[2,4,5,7,3,8,1,6], sortedLen=4;
      var info=AV.arr(E, arr, { y:E.H*0.36, bw:50, gap:10, hl:function(i){ if(i<sortedLen) return {fill:'rgba(143,227,181,0.2)',stroke:'#8fe3b5',text:'#8fe3b5'}; if(i===sortedLen) return {fill:'rgba(255,178,122,0.3)',stroke:'#ffb27a',text:'#ffb27a',tag:'key'}; return {fill:'rgba(255,255,255,0.04)',stroke:'rgba(255,255,255,0.2)',text:'#6f6e7a'}; } });
      ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillStyle='#8fe3b5'; ctx.fillText('◀ 불변식: A[0..i−1] 는 항상 정렬됨', E.W*0.30, E.H*0.54);
      ctx.fillStyle='#6f6e7a'; ctx.fillText('아직 안 본 부분 ▶', E.W*0.74, E.H*0.54); }
  },

  // ══════ 그리디(algo8_01) ▸ 허프만 코딩 (concept) ══════
  { id:'algo_br_huffman', concept:true, branchOf:'algo8_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, cx=E.W/2, top=E.H*0.18, lg=E.H*0.16;
      function nd(x,y,lbl,col){ AV.node(E,x,y,lbl,{r:20,fill:'rgba(122,184,255,0.16)',stroke:col||'#7ab8ff',text:'#dfeefb',fs:13}); }
      var R=[cx,top], A=[cx-E.W*0.22,top+lg], n4=[cx+E.W*0.10,top+lg], B=[cx-E.W*0.04,top+2*lg], n2=[cx+E.W*0.24,top+2*lg], C=[cx+E.W*0.12,top+3*lg], D=[cx+E.W*0.36,top+3*lg];
      function edge(a,b,lab){ ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke();
        ctx.fillStyle='#ffb27a'; ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.fillText(lab,(a[0]+b[0])/2-6,(a[1]+b[1])/2); }
      edge(R,A,'0'); edge(R,n4,'1'); edge(n4,B,'0'); edge(n4,n2,'1'); edge(n2,C,'0'); edge(n2,D,'1');
      nd(R[0],R[1],'9'); nd(A[0],A[1],'A:5','#8fe3b5'); nd(n4[0],n4[1],'4'); nd(B[0],B[1],'B:2','#8fe3b5'); nd(n2[0],n2[1],'2'); nd(C[0],C[1],'C:1','#8fe3b5'); nd(D[0],D[1],'D:1','#8fe3b5');
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('코드: A=0  B=10  C=110  D=111  (자주 쓰는 A가 가장 짧음!)', cx, top+4*lg); }
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
  { id:'algo_br_rotate', concept:true, branchOf:'algo5_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx;
      function nd(x,y,l,col){ AV.node(E,x,y,l,{r:19,fill:'rgba(122,184,255,0.16)',stroke:col||'#7ab8ff',text:'#dfeefb',fs:14}); }
      function ed(a,b){ ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke(); }
      // 좌: 회전 전 (x 위, y 아래오른쪽)
      var L=E.W*0.27, R=E.W*0.73, t=E.H*0.24, g=E.H*0.15;
      var x1=[L,t], y1=[L+E.W*0.10,t+g], a1=[L-E.W*0.07,t+g], b1=[L+E.W*0.03,t+2*g], c1=[L+E.W*0.17,t+2*g];
      ed(x1,a1); ed(x1,y1); ed(y1,b1); ed(y1,c1); nd(a1[0],a1[1],'α'); nd(b1[0],b1[1],'β'); nd(c1[0],c1[1],'γ'); nd(y1[0],y1[1],'y'); nd(x1[0],x1[1],'x','#ffb27a');
      // 우: 회전 후 (y 위, x 아래왼쪽)
      var y2=[R,t], x2=[R-E.W*0.10,t+g], c2=[R+E.W*0.07,t+g], a2=[R-E.W*0.17,t+2*g], b2=[R-E.W*0.03,t+2*g];
      ed(y2,x2); ed(y2,c2); ed(x2,a2); ed(x2,b2); nd(a2[0],a2[1],'α'); nd(b2[0],b2[1],'β'); nd(c2[0],c2[1],'γ'); nd(x2[0],x2[1],'x','#ffb27a'); nd(y2[0],y2[1],'y');
      AV.arrow(ctx, E.W*0.46, t+g, E.W*0.54, t+g, '#8fe3b5', 3);
      ctx.fillStyle='#8fe3b5'; ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.fillText('좌회전', E.W*0.5, t+g-14);
      ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif'; ctx.fillText('회전 전 (x가 위)', L, t-16); ctx.fillText('회전 후 (y가 위)', R, t-16);
      ctx.fillStyle='#6f6e7a'; ctx.fillText('순서 α<x<β<y<γ 는 그대로 — BST 규칙 보존, 높이만 재조정', E.W/2, t+3*g); }
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
  { id:'algo_br_reduction', concept:true, branchOf:'algo8_04',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, cx=E.W/2, cy=E.H*0.42;
      function box(x,l,sub,col){ var w=E.W*0.22,h=E.H*0.15; ctx.fillStyle='rgba(255,255,255,0.03)'; ctx.strokeStyle=col; ctx.lineWidth=2;
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x-w/2,cy-h/2,w,h,12);ctx.fill();ctx.stroke();}else ctx.strokeRect(x-w/2,cy-h/2,w,h);
        ctx.fillStyle=col; ctx.font='600 18px sans-serif'; ctx.textAlign='center'; ctx.fillText(l,x,cy-2); ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif'; ctx.fillText(sub,x,cy+20); }
      box(cx-E.W*0.24,'문제 A','(풀고 싶은 것)','#ffb27a');
      box(cx+E.W*0.24,'문제 B','(NP-하드 known)','#f4a0c0');
      AV.arrow(ctx, cx-E.W*0.11, cy, cx+E.W*0.11, cy, '#8fe3b5', 3);
      ctx.fillStyle='#8fe3b5'; ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.fillText('다항시간 변환 A→B', cx, cy-E.H*0.12);
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.fillText('B를 빠르게 풀면 A도 빠르게 풀림  ⇔  A가 어려우면 B도 어렵다', cx, cy+E.H*0.16); }
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
  { id:'algo_br_nqueens', concept:true, branchOf:'algo8_03',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, N=4, cell=Math.min(72,E.H*0.15), x0=E.W/2-N*cell/2, y0=E.H*0.22, sol=[1,3,0,2];
      for(var r=0;r<N;r++)for(var c=0;c<N;c++){ var x=x0+c*cell,y=y0+r*cell, dark=(r+c)%2;
        ctx.fillStyle=dark?'rgba(255,255,255,0.07)':'rgba(255,255,255,0.02)'; ctx.fillRect(x,y,cell,cell);
        ctx.strokeStyle='rgba(255,255,255,0.1)'; ctx.lineWidth=1; ctx.strokeRect(x,y,cell,cell);
        if(sol[r]===c){ ctx.fillStyle='#ffb27a'; ctx.font=Math.round(cell*0.5)+'px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('♛',x+cell/2,y+cell/2); ctx.textBaseline='alphabetic'; } }
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('4-퀸 해 하나 — 같은 행·열·대각선에 두 퀸이 없음', E.W/2, y0+N*cell+26); }
  },

  // ══════ 힙(algo5_04) ▸ 세그먼트 트리 (concept) ══════
  { id:'algo_br_segtree', concept:true, branchOf:'algo5_04',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx;
      drawTreeB(E, [10,4,6,3,1,4,2], function(j){ if(j===0) return {fill:'rgba(255,178,122,0.3)',stroke:'#ffb27a',text:'#ffb27a',tag:'전체 합'}; if(j>=3) return {fill:'rgba(143,227,181,0.2)',stroke:'#8fe3b5',text:'#8fe3b5',tag:'원소'}; return null; }, {lg:E.H*0.18,r:22});
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('잎=원소 [3,1,4,2], 내부=구간 합. 구간 질의·갱신을 O(log n)에', E.W/2, E.H*0.88); }
  },

  // ══════ 해시(algo2_05) ▸ 트라이(Trie) (concept) ══════
  { id:'algo_br_trie', concept:true, branchOf:'algo2_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, cx=E.W/2, top=E.H*0.16, lg=E.H*0.16;
      function nd(p,l,end){ AV.node(E,p[0],p[1],l,{r:18,fill:end?'rgba(143,227,181,0.25)':'rgba(122,184,255,0.16)',stroke:end?'#8fe3b5':'#7ab8ff',text:'#dfeefb',fs:15,tag:end?'끝':null}); }
      function ed(a,b){ ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke(); }
      var root=[cx,top], C=[cx-E.W*0.2,top+lg], D=[cx+E.W*0.2,top+lg], A=[cx-E.W*0.2,top+2*lg], O=[cx+E.W*0.2,top+2*lg], T=[cx-E.W*0.32,top+3*lg], R=[cx-E.W*0.08,top+3*lg], G=[cx+E.W*0.2,top+3*lg];
      ed(root,C);ed(root,D);ed(C,A);ed(D,O);ed(A,T);ed(A,R);ed(O,G);
      nd(root,'●'); nd(C,'c'); nd(D,'d'); nd(A,'a'); nd(O,'o'); nd(T,'t',true); nd(R,'r',true); nd(G,'g',true);
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('cat · car · dog — 공통 접두어(c-a)를 공유하는 경로', E.W/2, top+4*lg); }
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
      'SIEVE(n) {                      // n 이하 소수 찾기',
      '  is_prime[2..n] = true',
      '  for p = 2 to √n:',
      '    if (is_prime[p])',
      '      for m = p*p to n step p:',
      '        is_prime[m] = false      // p의 배수 제거',
      '}'
    ],
    build:function(V){ var n=30, isp=[], st=[];
      for(var i=0;i<=n;i++) isp[i]=i>=2;
      function snap(line,cap,p,extra){ var f={line:line,cap:cap,isp:isp.slice(),n:n,p:p==null?-1:p}; if(extra)for(var k in extra)f[k]=extra[k]; st.push(f); }
      snap(1,'2부터 '+n+'까지 모두 소수 후보로 표시.',-1);
      for(var p=2;p*p<=n;p++){ if(!isp[p]) continue;
        snap(3,'<b>'+p+'</b> 은 소수 → 그 배수들을 지웁니다.',p);
        for(var m=p*p;m<=n;m+=p){ isp[m]=false; }
        snap(5,p+'의 배수('+(p*p)+', '+(p*p+p)+', …) 전부 합성수로 제거.',p);
      }
      snap(6,'<b>완료!</b> 남은 초록이 소수. 약 O(n log log n)로 매우 빠름.',-1,{done:true});
      return st; },
    draw:function(V,f){ var ctx=V.ctx, cols=7, cell=Math.min(60,V.W*0.095), x0=V.W/2-cols*cell/2, y0=V.H*0.2;
      for(var v=2;v<=f.n;v++){ var idx=v-2, r=Math.floor(idx/cols), c=idx%cols, x=x0+c*cell, y=y0+r*cell;
        var prime=f.isp[v], isP=(v===f.p);
        ctx.fillStyle=isP?'rgba(255,178,122,0.35)':prime?'rgba(143,227,181,0.22)':'rgba(255,255,255,0.03)';
        ctx.strokeStyle=isP?'#ffb27a':prime?'#8fe3b5':'rgba(255,255,255,0.12)'; ctx.lineWidth=1.5;
        ctx.fillRect(x,y,cell-4,cell-4); ctx.strokeRect(x,y,cell-4,cell-4);
        ctx.fillStyle=prime?(isP?'#ffb27a':'#8fe3b5'):'#5a5f6b'; ctx.font='600 16px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(v,x+(cell-4)/2,y+(cell-4)/2); ctx.textBaseline='alphabetic'; } }
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
  { id:'algo_br_kmeans', concept:true, branchOf:'algo8_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx;
      var c1=[[0.25,0.3],[0.34,0.42],[0.2,0.48],[0.3,0.58]], c2=[[0.7,0.32],[0.78,0.48],[0.64,0.58],[0.8,0.38]];
      function px(p){ return [E.W*0.18+p[0]*E.W*0.62, E.H*0.18+p[1]*E.H*0.5]; }
      c1.forEach(function(p){ var q=px(p); ctx.fillStyle='#ffb27a'; ctx.beginPath(); ctx.arc(q[0],q[1],7,0,7); ctx.fill(); });
      c2.forEach(function(p){ var q=px(p); ctx.fillStyle='#7ab8ff'; ctx.beginPath(); ctx.arc(q[0],q[1],7,0,7); ctx.fill(); });
      [[px([0.27,0.44]),'#ffb27a'],[px([0.73,0.44]),'#7ab8ff']].forEach(function(c){ ctx.fillStyle=c[1]; ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(c[0][0],c[0][1]-11); ctx.lineTo(c[0][0]+10,c[0][1]+7); ctx.lineTo(c[0][0]-10,c[0][1]+7); ctx.closePath(); ctx.fill(); ctx.stroke(); });
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('점=데이터, ▲=군집 중심. 가까운 중심에 배정 → 중심 재계산 → 반복', E.W/2, E.H*0.78); }
  },

  // ══════ 종합(algo8_05) ▸ 경사하강법 (concept) ══════
  { id:'algo_br_graddesc', concept:true, branchOf:'algo8_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, cx=E.W/2, baseY=E.H*0.70, w=E.W*0.52, x0=cx-w/2, amp=E.H*0.4;
      function Y(t){ return baseY-amp*Math.pow((t-0.5)*2,2); }
      ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2.5; ctx.beginPath();
      for(var i=0;i<=100;i++){ var t=i/100, xx=x0+t*w; if(i===0)ctx.moveTo(xx,Y(t)); else ctx.lineTo(xx,Y(t)); } ctx.stroke();
      var ts=[0.08,0.24,0.38,0.46,0.5];
      ts.forEach(function(t,i){ var xx=x0+t*w, yy=Y(t), last=(i===ts.length-1);
        if(i>0){ var pt=ts[i-1]; ctx.strokeStyle='rgba(255,178,122,0.5)'; ctx.lineWidth=1.5; ctx.setLineDash([4,3]); ctx.beginPath(); ctx.moveTo(x0+pt*w,Y(pt)); ctx.lineTo(xx,yy); ctx.stroke(); ctx.setLineDash([]); }
        ctx.fillStyle=last?'#8fe3b5':'#ffb27a'; ctx.strokeStyle='#fff'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(xx,yy,last?9:6,0,7); ctx.fill(); if(last)ctx.stroke(); });
      ctx.fillStyle='#8fe3b5'; ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.fillText('최소점', cx, Y(0.5)+22);
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.fillText('기울기 반대 방향으로 조금씩 내려가 비용 최소점에 도달', cx, E.H*0.84); }
  },

  // ══════ 힙(algo5_04) ▸ 펜윅 트리(BIT) (concept) ══════
  { id:'algo_br_fenwick', concept:true, branchOf:'algo5_04',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, n=8, cell=Math.min(62,E.W*0.085), x0=E.W/2-n*cell/2, baseY=E.H*0.56;
      function lowbit(i){ return i&(-i); }
      for(var i=1;i<=n;i++){ var x=x0+(i-1)*cell; ctx.fillStyle='rgba(122,184,255,0.12)'; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=1.5; ctx.fillRect(x,baseY,cell-5,cell-5); ctx.strokeRect(x,baseY,cell-5,cell-5); ctx.fillStyle='#dfeefb'; ctx.font='600 15px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(i,x+(cell-5)/2,baseY+(cell-5)/2); ctx.textBaseline='alphabetic'; }
      for(i=1;i<=n;i++){ var lb=lowbit(i), start=i-lb+1, bx=x0+(start-1)*cell, bw=lb*cell-8, lvl=Math.round(Math.log2(lb)), by=baseY-16-lvl*16;
        ctx.fillStyle='rgba(143,227,181,0.3)'; ctx.strokeStyle='#8fe3b5'; ctx.lineWidth=1.5; ctx.fillRect(bx,by,bw,11); ctx.strokeRect(bx,by,bw,11); }
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('각 BIT[i]는 lowbit(i) 길이 구간의 합을 담당(초록 막대) → 누적합·갱신 O(log n)', E.W/2, baseY+cell+18); }
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
  { id:'algo_br_parallel', concept:true, branchOf:'algo8_03',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx;
      drawTreeB(E, [10,4,6,3,1,4,2], function(j){ if(j===0)return{fill:'rgba(255,178,122,0.3)',stroke:'#ffb27a',text:'#ffb27a',tag:'합'}; if(j>=3)return{fill:'rgba(143,227,181,0.2)',stroke:'#8fe3b5',text:'#8fe3b5',tag:'동시'}; return null; }, {lg:E.H*0.17,r:21});
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('병렬 합산: 같은 층은 동시에! 작업량(work) O(n), 깊이(span) O(log n) → 병렬도 n/log n', E.W/2, E.H*0.88); }
  },

  // ══════ 그리디(algo8_01) ▸ 온라인 알고리즘 (concept) ══════
  { id:'algo_br_online', concept:true, branchOf:'algo8_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, cx=E.W/2;
      ctx.textAlign='center'; ctx.fillStyle='#cfcdc6'; ctx.font='600 16px sans-serif'; ctx.fillText('스키 대여 문제 — 며칠 탈지 모른 채 결정', cx, E.H*0.26);
      ctx.fillStyle='#9b99a3'; ctx.font='14px sans-serif'; ctx.fillText('빌리기 = 하루 1원  vs  사기 = B원 (입력이 시간 따라 도착)', cx, E.H*0.38);
      ctx.fillStyle='#8fe3b5'; ctx.font='600 16px sans-serif'; ctx.fillText('전략: B−1일까지 빌리다 B일째 사기', cx, E.H*0.54);
      ctx.fillStyle='#ffb27a'; ctx.fillText('→ 미래를 몰라도 최적의 2배 이내 (경쟁비 = 2)', cx, E.H*0.64);
      ctx.fillStyle='#6f6e7a'; ctx.font='13px sans-serif'; ctx.fillText('온라인 = 전체 입력을 미리 못 봄. 경쟁비로 성능을 잼', cx, E.H*0.76); }
  },

  // ══════ 종합(algo8_05) ▸ LU 분해 (concept) ══════
  { id:'algo_br_lu', concept:true, branchOf:'algo8_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, cy=E.H*0.4, s=Math.min(40,E.H*0.08);
      function mat(cx,kind,col){ for(var r=0;r<3;r++)for(var c=0;c<3;c++){ var x=cx+c*s, y=cy+r*s;
        var on = kind==='A'?true : kind==='L'?(c<=r) : (c>=r);
        ctx.fillStyle=on?(col+'33'):'rgba(255,255,255,0.02)'; ctx.strokeStyle=on?col:'rgba(255,255,255,0.1)'; ctx.lineWidth=1.5;
        ctx.fillRect(x,y,s-3,s-3); ctx.strokeRect(x,y,s-3,s-3); } }
      mat(E.W*0.18,'A','#ffb27a'); mat(E.W*0.46,'L','#8fe3b5'); mat(E.W*0.72,'U','#7ab8ff');
      ctx.font='600 22px sans-serif'; ctx.textAlign='center'; ctx.fillStyle='#cfcdc6';
      ctx.fillText('=', E.W*0.40, cy+s*1.5); ctx.fillText('×', E.W*0.66, cy+s*1.5);
      ctx.font='600 14px sans-serif'; ctx.fillText('A', E.W*0.18+s, cy-12); ctx.fillStyle='#8fe3b5'; ctx.fillText('L (하삼각)', E.W*0.46+s, cy-12); ctx.fillStyle='#7ab8ff'; ctx.fillText('U (상삼각)', E.W*0.72+s, cy-12);
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.fillText('A=LU 로 분해하면 Ax=b 를 전진·후진 대입으로 O(n²)에 풀이(가우스 소거)', E.W/2, cy+s*4); }
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
  { id:'algo_br_segtree', concept:true, branchOf:'algo2_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, x0=W*0.14, x1=W*0.86, top=H*0.22, lg=H*0.135;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('세그먼트 트리 — 구간 합을 O(log n)에', W/2, H*0.08);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('각 노드 = 자기 구간의 합. 질의 [2,5]는 겹치는 노드(주황) 둘만 더하면 끝', W/2, H*0.08+22);
      var levels=[ [[0,7,31]], [[0,3,9],[4,7,22]], [[0,1,4],[2,3,5],[4,5,14],[6,7,8]] ], hi={'2-3':1,'4-5':1};
      function nx(L,i){ return x0+(x1-x0)*((i+0.5)/levels[L].length); }
      for(var L=0;L<levels.length-1;L++){ for(var i=0;i<levels[L].length;i++){ var px=nx(L,i), py=top+L*lg+16;
        [2*i,2*i+1].forEach(function(ci){ if(ci<levels[L+1].length){ var cx2=nx(L+1,ci), cy=top+(L+1)*lg; ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(cx2,cy); ctx.stroke(); } }); } }
      for(L=0;L<levels.length;L++){ for(i=0;i<levels[L].length;i++){ var nd=levels[L][i], x=nx(L,i), y=top+L*lg, on=hi[nd[0]+'-'+nd[1]], bw=Math.min(56,(x1-x0)/levels[L].length-10), bh=32;
        ctx.fillStyle=on?'rgba(255,178,122,0.3)':'rgba(122,184,255,0.14)'; ctx.strokeStyle=on?'#ffb27a':'#7ab8ff'; ctx.lineWidth=1.6;
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x-bw/2,y,bw,bh,7);ctx.fill();ctx.stroke();}else ctx.strokeRect(x-bw/2,y,bw,bh);
        ctx.fillStyle=on?'#ffb27a':'#dfeefb'; ctx.font='600 16px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(nd[2],x,y+bh/2); ctx.textBaseline='alphabetic';
        ctx.fillStyle='#6f7686'; ctx.font='10px sans-serif'; ctx.fillText('['+nd[0]+','+nd[1]+']',x,y+bh+11); } }
      var A=[3,1,4,1,5,9,2,6], ly=top+3*lg+2;
      AV.arr(E, A, { y:ly, bw:Math.min(46,(W*0.62)/8), gap:6, idx:true, hl:function(k){ return (k>=2&&k<=5)?{fill:'rgba(255,178,122,0.16)',stroke:'#ffb27a',text:'#ffb27a'}:null; } });
      ctx.fillStyle='#8fe3b5'; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('질의 합[2,5] = 노드[2,3]:5 + 노드[4,5]:14 = 19  —  6칸 대신 2개 노드만!', W/2, ly+H*0.15); }
  },

  // ══════ 배열(algo2_01) ▸ 펜윅 트리(BIT) ══════
  { id:'algo_br_fenwick', concept:true, branchOf:'algo2_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, cx=W/2, y=H*0.34;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('펜윅 트리(BIT) — 누적 합을 O(log n)에', W/2, H*0.11);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('각 칸은 "마지막 1비트" 폭의 구간을 저장. prefix(i): i −= i&(−i) 로 점프', W/2, H*0.11+22);
      var chain=[ ['7','111','tree[7]=a[7]'], ['6','110','tree[6]=a[5..6]'], ['4','100','tree[4]=a[1..4]'] ];
      var bw=W*0.17, gap=W*0.045, total=chain.length*bw+(chain.length-1)*gap, x=cx-total/2;
      for(var i=0;i<chain.length;i++){ var bx=x+i*(bw+gap), c=chain[i];
        ctx.fillStyle='rgba(122,184,255,0.16)'; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=1.8;
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(bx,y,bw,H*0.17,10);ctx.fill();ctx.stroke();}else ctx.strokeRect(bx,y,bw,H*0.17);
        ctx.fillStyle='#bfe0ff'; ctx.font='600 27px sans-serif'; ctx.textAlign='center'; ctx.fillText(c[0], bx+bw/2, y+H*0.055);
        ctx.fillStyle='#8a8893'; ctx.font='13px ui-monospace,monospace'; ctx.fillText('0b'+c[1], bx+bw/2, y+H*0.092);
        ctx.fillStyle='#8fe3b5'; ctx.font='12px sans-serif'; ctx.fillText(c[2], bx+bw/2, y+H*0.14);
        if(i<chain.length-1){ AV.arrow(ctx, bx+bw+4, y+H*0.085, bx+bw+gap-4, y+H*0.085, '#ffb27a', 2); } }
      ctx.fillStyle='#ffb27a'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('각 점프 = 마지막 1비트 제거 (7→6→4→0)', cx, y+H*0.22);
      ctx.fillStyle='#dfeefb'; ctx.font='600 15px sans-serif'; ctx.fillText('prefix(7) = tree[7] + tree[6] + tree[4] = a[1..7]   (단 3번!)', cx, y+H*0.28);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif'; ctx.fillText('갱신은 반대로 i += i&(−i) 로 올라감. 코드 두 줄로 구간합·갱신 모두 O(log n)', cx, y+H*0.33); }
  },

  // ══════ 해시(algo2_05) ▸ 트라이(Trie) ══════
  { id:'algo_br_trie', concept:true, branchOf:'algo2_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('트라이(Trie) — 접두사를 공유하는 문자열 사전', W/2, H*0.09);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('단어: cat, car, cup, dog  ·  같은 접두사는 길을 공유 → 검색 O(단어 길이)', W/2, H*0.09+22);
      var N={ root:[0.5,0.18,'•'], c:[0.30,0.36,'c'], d:[0.74,0.36,'d'], a:[0.20,0.54,'a'], u:[0.40,0.54,'u'], o:[0.74,0.54,'o'], t:[0.13,0.74,'t'], r:[0.27,0.74,'r'], p:[0.40,0.74,'p'], g:[0.74,0.74,'g'] };
      var ends={t:1,r:1,p:1,g:1}, edges=[['root','c'],['root','d'],['c','a'],['c','u'],['a','t'],['a','r'],['u','p'],['d','o'],['o','g']];
      function xy(k){ return [W*0.10+N[k][0]*W*0.80, H*0.20+N[k][1]*H*0.60]; }
      edges.forEach(function(e){ var a=xy(e[0]),b=xy(e[1]); ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke(); });
      Object.keys(N).forEach(function(k){ var p=xy(k), end=ends[k];
        AV.node(E,p[0],p[1],N[k][2],{r:18,fs:15,fill:end?'rgba(143,227,181,0.28)':'rgba(122,184,255,0.16)',stroke:end?'#8fe3b5':'#7ab8ff',text:end?'#8fe3b5':'#dfeefb',tag:end?'단어끝':null}); });
      ctx.fillStyle='#8fe3b5'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('초록 = 단어의 끝 표시. "car" 검색 = 루트→c→a→r 따라가면 끝', W/2, H*0.93); }
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
  { id:'algo_br_millerrabin', concept:true, branchOf:'algo8_04',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('밀러-라빈 — 큰 수의 빠른 소수 판정(확률적)', W/2, H*0.12);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('n−1 = 2^s · d 로 쓰고, 무작위 a로 a^d, a^(2d), … 가 1 또는 −1을 지나는지 검사', W/2, H*0.12+22);
      ctx.fillStyle='#bfe0ff'; ctx.font='600 18px ui-monospace, monospace'; ctx.textAlign='center';
      ctx.fillText('소수면:  a^d ≡ 1   또는   a^(2^r·d) ≡ −1  (mod n)', W/2, H*0.34);
      ctx.fillStyle='#8fe3b5'; ctx.font='15px ui-monospace, monospace';
      ctx.fillText('예) n=561 (카마이클 수, 합성수지만 까다로움)', W/2, H*0.44);
      ctx.fillStyle='#e2607a'; ctx.font='14px sans-serif';
      ctx.fillText('a=2 로 검사 → 조건 불만족 → "합성수" 판정 (증인 a 발견)', W/2, H*0.52);
      ctx.fillStyle='#dfeefb'; ctx.font='13px sans-serif';
      ctx.fillText('한 번의 a로 합성수를 놓칠 확률 ≤ 1/4 → 여러 a로 반복하면 오류 ≪ 1', W/2, H*0.62);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('한 번 검사 O(log³n). 결정적 판정도 작은 a 집합으로 64비트까지 가능. RSA 키 생성의 핵심', W/2, H*0.72); }
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
  { id:'algo_br_mo', concept:true, branchOf:'algo3_04',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText("Mo's 알고리즘 — 오프라인 구간 질의를 영리하게 정렬", W/2, H*0.11);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('질의들을 블록(√n) 기준으로 정렬해, 두 포인터 [l,r]를 조금씩만 움직이며 답을 갱신', W/2, H*0.11+22);
      // 배열 + 두 질의 구간
      var n=12, bw=Math.min(46,(W*0.62)/n), gap=5, total=n*bw+(n-1)*gap, x0=W/2-total/2, y=H*0.36;
      for(var i=0;i<n;i++){ var x=x0+i*(bw+gap); ctx.fillStyle='rgba(122,184,255,0.10)'; ctx.strokeStyle='rgba(122,184,255,0.3)'; ctx.lineWidth=1.5; ctx.fillRect(x,y,bw,bw); ctx.strokeRect(x,y,bw,bw); ctx.fillStyle='#6f7686'; ctx.font='10px sans-serif'; ctx.textAlign='center'; ctx.fillText(i,x+bw/2,y+bw+12); }
      function rng(l,r,col,yy,lab){ var xa=x0+l*(bw+gap), xb=x0+r*(bw+gap)+bw; ctx.strokeStyle=col; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(xa,yy); ctx.lineTo(xb,yy); ctx.stroke(); ctx.fillStyle=col; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText(lab,xa,yy-6); }
      rng(2,6,'#8fe3b5',y+bw+26,'질의 A [2,6]');
      rng(3,9,'#ffb27a',y+bw+50,'질의 B [3,9] — A에서 l은 +1, r은 +3만 이동');
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif'; ctx.textAlign='center';
      ctx.fillText('블록순 정렬 → 포인터 총 이동 O((n+q)√n). 원소 1개 추가/제거가 O(1)인 질의에 만능', W/2, H*0.82);
      ctx.fillStyle='#8a8893'; ctx.fillText('예: 구간 내 서로 다른 수의 개수, 최빈값, 합·빈도 통계 (온라인 자료구조가 어려운 것)', W/2, H*0.82+22); }
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
      ctx.fillText('에드몬즈 블로섬 알고리즘 O(V³)(또는 O(V·E)). 이분 매칭(증가경로)을 일반 그래프로 확장한 고전', W/2, H*0.84+22); }
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
  { id:'algo_br_fftmul', concept:true, branchOf:'algo8_04',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, cx=W/2;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('FFT 곱셈 — 다항식·큰 수 곱을 O(n log n)에', W/2, H*0.11);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('계수 ⇄ 점값 표현을 빠르게 오가며, 곱셈을 점별 곱(O(n))으로 바꾼다', W/2, H*0.11+22);
      // 파이프라인 3단계
      var y=H*0.34, bw=W*0.22, gap=W*0.05, total=3*bw+2*gap, x0=cx-total/2;
      var steps=[['계수표현','A(x), B(x)','#7ab8ff'],['점값표현','각 점에서 값','#8fe3b5'],['계수표현','곱 C(x)','#ffb27a']];
      for(var i=0;i<3;i++){ var x=x0+i*(bw+gap);
        ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.strokeStyle=steps[i][2]; ctx.lineWidth=2;
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,bw,H*0.16,10);ctx.fill();ctx.stroke();}else ctx.strokeRect(x,y,bw,H*0.16);
        ctx.fillStyle=steps[i][2]; ctx.font='600 15px sans-serif'; ctx.textAlign='center'; ctx.fillText(steps[i][0],x+bw/2,y+H*0.06);
        ctx.fillStyle='#cfcdc6'; ctx.font='12px sans-serif'; ctx.fillText(steps[i][1],x+bw/2,y+H*0.105);
        if(i<2){ var lab=i===0?'FFT (평가)':'역FFT (보간)'; AV.arrow(ctx, x+bw+4, y+H*0.08, x+bw+gap-4, y+H*0.08, '#dfeefb', 2); ctx.fillStyle='#8a8893'; ctx.font='11px sans-serif'; ctx.fillText(lab, x+bw+gap/2, y-8); } }
      ctx.fillStyle='#8fe3b5'; ctx.font='600 14px ui-monospace, monospace'; ctx.textAlign='center';
      ctx.fillText('점값에서는 C(xᵢ) = A(xᵢ) · B(xᵢ)  (그냥 곱셈, O(n))', cx, y+H*0.30);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('평가점으로 복소수 단위근을 쓰면 분할정복으로 평가·보간이 O(n log n) → 전체 O(n log n)', cx, y+H*0.30+24);
      ctx.fillStyle='#8a8893'; ctx.fillText('큰 정수 곱셈, 문자열 매칭(비트), 컨볼루션, 신호·이미지 처리의 토대. 정수환은 NTT', cx, y+H*0.30+44); }
  },

  // ══════ NP(algo8_04) ▸ 이산 로그(Baby-step Giant-step) ══════
  { id:'algo_br_bsgs', concept:true, branchOf:'algo8_04',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, cx=W/2;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('이산 로그 — Baby-step Giant-step', W/2, H*0.12);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('a^x ≡ b (mod m) 의 x를, 모든 x(=m번) 대신 √m·√m 으로 나눠 찾는다', W/2, H*0.12+22);
      ctx.fillStyle='#bfe0ff'; ctx.font='600 16px ui-monospace, monospace'; ctx.textAlign='center';
      ctx.fillText('x = i·n − j   (n = ⌈√m⌉)', cx, H*0.32);
      ctx.fillStyle='#8fe3b5'; ctx.font='14px ui-monospace, monospace';
      ctx.fillText('Baby: a^0, a^1, …, a^(n−1) 를 해시테이블에 저장', cx, H*0.44);
      ctx.fillStyle='#ffb27a'; ctx.font='14px ui-monospace, monospace';
      ctx.fillText('Giant: b·a^(−in) 가 그 테이블에 있나 검사 (i = 0…n)', cx, H*0.54);
      ctx.fillStyle='#dfeefb'; ctx.font='13px sans-serif';
      ctx.fillText('일치하면 a^j ≡ b·a^(−in) → x = i·n − j', cx, H*0.64);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('시간·메모리 O(√m). 무차별 O(m)에서 제곱근으로 단축 — 디피-헬먼 등 암호 분석에', cx, H*0.74); }
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
  { id:'algo_br_monostack', concept:true, branchOf:'algo2_03',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, A=[2,5,3,6,1], NGE=[5,6,6,-1,-1];
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('단조 스택 — "다음 큰 원소"를 O(n)에', W/2, H*0.12);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('스택에 값을 줄어드는(또는 늘어나는) 순서로만 유지 → 각 원소는 한 번 push·한 번 pop', W/2, H*0.12+22);
      var n=A.length, bw=Math.min(64,(W*0.55)/n), gap=10, total=n*bw+(n-1)*gap, x0=W/2-total/2, y=H*0.36;
      for(var i=0;i<n;i++){ var x=x0+i*(bw+gap);
        ctx.fillStyle='rgba(122,184,255,0.14)'; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2;
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,bw,bw,8);ctx.fill();ctx.stroke();}else ctx.strokeRect(x,y,bw,bw);
        ctx.fillStyle='#dfeefb'; ctx.font='600 22px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(A[i],x+bw/2,y+bw/2); ctx.textBaseline='alphabetic';
        ctx.fillStyle='#6f7686'; ctx.font='11px sans-serif'; ctx.fillText(i,x+bw/2,y-8);
        var g=NGE[i]; ctx.fillStyle=g<0?'#6f6e7a':'#8fe3b5'; ctx.font='600 13px sans-serif'; ctx.fillText(g<0?'없음':('→'+g), x+bw/2, y+bw+18); }
      ctx.fillStyle='#8fe3b5'; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('아래 = 각 원소의 "다음 큰 값"(NGE). 예: 2→5, 3→6, 6→없음', W/2, H*0.62);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('새 값이 스택 top보다 크면 top을 pop하며 "네 다음 큰 값은 나야"라고 정답 기록 → 총 O(n)', W/2, H*0.62+22);
      ctx.fillStyle='#8a8893'; ctx.fillText('쓰임: 다음/이전 큰·작은 원소, 히스토그램 최대 직사각형, 주가 스팬, 온도 문제', W/2, H*0.62+42); }
  },

  // ══════ 큐(algo2_04) ▸ 슬라이딩 윈도우 최댓값(단조 덱) ══════
  { id:'algo_br_slidemax', concept:true, branchOf:'algo2_04',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, A=[1,3,2,5,4], k=3;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('슬라이딩 윈도우 최댓값 — 단조 덱으로 O(n)', W/2, H*0.12);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('크기 k 창이 한 칸씩 이동할 때 각 창의 최댓값을, 덱에 줄어드는 순서로 인덱스만 유지', W/2, H*0.12+22);
      var n=A.length, bw=Math.min(62,(W*0.55)/n), gap=9, total=n*bw+(n-1)*gap, x0=W/2-total/2, y=H*0.36;
      for(var i=0;i<n;i++){ var x=x0+i*(bw+gap), inwin=(i>=2&&i<=4);  // 현재 창 [2,4]
        ctx.fillStyle=inwin?'rgba(255,178,122,0.22)':'rgba(122,184,255,0.12)'; ctx.strokeStyle=inwin?'#ffb27a':'rgba(122,184,255,0.4)'; ctx.lineWidth=2;
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,bw,bw,8);ctx.fill();ctx.stroke();}else ctx.strokeRect(x,y,bw,bw);
        ctx.fillStyle=A[i]===5&&inwin?'#ffb27a':'#dfeefb'; ctx.font='600 22px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(A[i],x+bw/2,y+bw/2); ctx.textBaseline='alphabetic';
        ctx.fillStyle='#6f7686'; ctx.font='11px sans-serif'; ctx.fillText(i,x+bw/2,y-8); }
      ctx.fillStyle='#ffb27a'; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('주황 = 현재 창 [2..4] = {2,5,4} → 최댓값 5 (덱의 맨 앞)', W/2, H*0.60);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('덱 규칙: 새 값보다 작은 뒤쪽을 모두 제거(작은 건 영원히 최대 못 됨), 창 벗어난 앞쪽 제거', W/2, H*0.60+22);
      ctx.fillStyle='#8a8893'; ctx.fillText('덱 맨 앞 = 현재 창 최댓값. 각 인덱스 한 번 들고 한 번 나가 O(n). 그냥 매번 최대 찾기는 O(nk)', W/2, H*0.60+42); }
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
  { id:'algo_br_sieve', concept:true, branchOf:'algo2_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('에라토스테네스의 체 — N까지 소수를 한꺼번에', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('2부터, 각 소수의 배수를 모두 지운다. 남은 것이 소수 → O(N log log N)', W/2, H*0.10+22);
      var prime={2:1,3:1,5:1,7:1,11:1,13:1,17:1,19:1,23:1,29:1};
      var cols=10, cell=Math.min(48,(W*0.62)/cols), x0=W/2-cols*cell/2, y0=H*0.28;
      for(var v=1;v<=30;v++){ var idx=v-1, r=Math.floor(idx/cols), c=idx%cols, x=x0+c*cell, y=y0+r*cell, p=prime[v];
        ctx.fillStyle=v===1?'rgba(255,255,255,0.03)':p?'rgba(143,227,181,0.26)':'rgba(255,255,255,0.04)'; ctx.strokeStyle=v===1?'rgba(255,255,255,0.15)':p?'#8fe3b5':'rgba(226,96,122,0.4)'; ctx.lineWidth=1.5;
        ctx.fillRect(x,y,cell-3,cell-3); ctx.strokeRect(x,y,cell-3,cell-3);
        ctx.fillStyle=v===1?'#5a5f6b':p?'#8fe3b5':'#7a5560'; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(v,x+cell/2-1,y+cell/2-1); ctx.textBaseline='alphabetic'; }
      ctx.fillStyle='#8fe3b5'; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('초록 = 소수 (배수로 지워지지 않고 살아남음). 빨강 테두리 = 합성수(지워짐)', W/2, y0+3*cell+22);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('소수 p는 p²부터 지우면 충분. 선형 체(각 수를 최소소인수로 한 번만)면 O(N) + 최소소인수 분해표', W/2, y0+3*cell+44); }
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
  { id:'algo_br_gauss', concept:true, branchOf:'algo8_04',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, cx=W/2;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('가우스 소거법 — 연립 일차방정식을 O(n³)에', W/2, H*0.11);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('행 연산으로 위는 0을 만들어 계단(상삼각) 꼴 → 아래에서 위로 대입해 해를 구한다', W/2, H*0.11+22);
      var rowsB=[['2','1','−1','| 8'],['−3','−1','2','| −11'],['−2','1','2','| −3']];
      var rowsA=[['2','1','−1','| 8'],['0','½','½','| 1'],['0','0','−1','| 1']];
      function mat(rows, x, y, lab, col){ ctx.fillStyle=col; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText(lab, x, y-12);
        for(var r=0;r<rows.length;r++){ ctx.fillStyle='#cfd6e2'; ctx.font='15px ui-monospace, monospace'; ctx.textAlign='left'; ctx.fillText(rows[r].join('  '), x-W*0.10, y+r*24); } }
      mat(rowsB, W*0.28, H*0.40, '원래 (증강) 행렬', '#7ab8ff');
      AV.arrow(ctx, W*0.46, H*0.46, W*0.54, H*0.46, '#8fe3b5', 2.4);
      ctx.fillStyle='#8fe3b5'; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('행 소거', W*0.50, H*0.42);
      mat(rowsA, W*0.74, H*0.40, '상삼각(계단) 꼴', '#ffb27a');
      ctx.fillStyle='#ffb27a'; ctx.font='600 14px ui-monospace, monospace'; ctx.textAlign='center';
      ctx.fillText('역대입: z=−1 → y=3 → x=2', cx, H*0.66);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('수치 안정성을 위해 절댓값 큰 행을 위로(부분 피벗팅). 역행렬·행렬식·랭크·XOR 연립(가우스-조던)에', cx, H*0.74); }
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
  { id:'algo_br_sqrtdecomp', concept:true, branchOf:'algo3_04',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('평방 분할 — 배열을 √n 블록으로 나눠 질의 O(√n)', W/2, H*0.11);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('블록마다 미리 합(또는 최댓값)을 저장 → 구간 질의 = 완전한 블록 + 양끝 자투리', W/2, H*0.11+22);
      var n=12, blk=4, bw=Math.min(50,(W*0.62)/n), gap=4, total=n*bw+(n-1)*gap, x0=W/2-total/2, y=H*0.36;
      for(var i=0;i<n;i++){ var x=x0+i*(bw+gap), b=Math.floor(i/blk), inq=(i>=2&&i<=9);
        var col=['rgba(122,184,255,0.14)','rgba(143,227,181,0.14)','rgba(244,160,192,0.14)'][b];
        ctx.fillStyle=inq?'rgba(255,178,122,0.22)':col; ctx.strokeStyle=inq?'#ffb27a':['#7ab8ff','#8fe3b5','#f4a0c0'][b]; ctx.lineWidth=2;
        ctx.fillRect(x,y,bw,bw); ctx.strokeRect(x,y,bw,bw);
        ctx.fillStyle='#9bb0c8'; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText(i,x+bw/2,y+bw/2+4); }
      // 블록 라벨
      for(var bb=0;bb<3;bb++){ var bx=x0+(bb*blk+blk/2)*(bw+gap)-bw/2; ctx.fillStyle=['#7ab8ff','#8fe3b5','#f4a0c0'][bb]; ctx.font='600 12px sans-serif'; ctx.textAlign='center'; ctx.fillText('블록'+bb+' Σ', bx, y-8); }
      ctx.fillStyle='#ffb27a'; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('질의 [2,9] = 자투리(2,3) + 블록1 전체합 + 자투리(8,9). 완전 블록은 미리 합으로 O(1)', W/2, H*0.62);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('블록 √n개·블록 크기 √n → 질의·갱신 O(√n). 세그트리보다 단순, Mo·구간 갱신에 두루', W/2, H*0.62+22); }
  },

  // ══════ NP(algo8_04) ▸ 중간에서 만나기(Meet in the Middle) ══════
  { id:'algo_br_mitm', concept:true, branchOf:'algo8_04',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, cx=W/2;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('중간에서 만나기 — 2ⁿ 을 2·2^(n/2) 로', W/2, H*0.12);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('원소를 절반으로 나눠 각 절반의 모든 조합을 만든 뒤, 둘을 합쳐 답을 찾는다', W/2, H*0.12+22);
      // 두 반쪽 박스 + 합치기
      function half(x, lab, col){ ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.strokeStyle=col; ctx.lineWidth=2;
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x-W*0.13,H*0.34,W*0.26,H*0.14,10);ctx.fill();ctx.stroke();}else ctx.strokeRect(x-W*0.13,H*0.34,W*0.26,H*0.14);
        ctx.fillStyle=col; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.fillText(lab, x, H*0.39);
        ctx.fillStyle='#cfcdc6'; ctx.font='12px sans-serif'; ctx.fillText('2^(n/2) 가지 조합', x, H*0.435); }
      half(W*0.30, '왼쪽 절반', '#7ab8ff'); half(W*0.70, '오른쪽 절반', '#8fe3b5');
      ctx.fillStyle='#ffb27a'; ctx.font='600 14px sans-serif'; ctx.textAlign='center';
      ctx.fillText('정렬·해시로 합치기: 왼쪽 합 x → 오른쪽에서 target−x 를 이분/해시 탐색', cx, H*0.58);
      ctx.fillStyle='#bfe0ff'; ctx.font='600 16px ui-monospace, monospace';
      ctx.fillText('O(2ⁿ)  →  O(2^(n/2) · n)', cx, H*0.68);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('n=40도 2²⁰≈백만 두 번이면 끝. 부분집합 합·배낭(작은 n·큰 값)·BSGS(이산로그)가 같은 원리', cx, H*0.76); }
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

  { id:'algo_br_sparse', concept:true, branchOf:'algo2_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('희소 테이블 — 구간 최솟값(RMQ)을 O(1)에', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('각 칸에서 길이 2^j 구간의 답을 미리 저장. 갱신은 없지만 질의는 O(1)', W/2, H*0.10+22);
      var arr=[5,2,8,1,9,3,7,4]; var n=arr.length;
      var bx=W*0.5-(n*46)/2, by=H*0.30, cw=42;
      for(var i=0;i<n;i++){ var x=bx+i*46;
        ctx.fillStyle='rgba(122,184,255,0.14)'; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=1.5;
        ctx.fillRect(x,by,cw,34); ctx.strokeRect(x,by,cw,34);
        ctx.fillStyle='#dfeefb'; ctx.font='600 14px sans-serif'; ctx.fillText(arr[i],x+cw/2,by+22);
        ctx.fillStyle='#6a6873'; ctx.font='10px sans-serif'; ctx.fillText(i,x+cw/2,by-6); }
      // 질의 [2,6] = min of two overlapping 2^2=4 blocks: [2..5],[3..6]
      function blk(l,len,row,col){ var x1=bx+l*46, w=(len-1)*46+cw, y=by+row*30+50;
        ctx.strokeStyle=col; ctx.lineWidth=2; ctx.strokeRect(x1-2,y,w+4,20);
        ctx.fillStyle=col; ctx.font='11px sans-serif'; ctx.textAlign='left';
        ctx.fillText('min['+l+'..'+(l+len-1)+']', x1, y+34); ctx.textAlign='center'; }
      blk(2,4,0,'#ffb27a'); blk(3,4,1,'#8fe3b5');
      ctx.fillStyle='#dfeefb'; ctx.font='600 14px sans-serif'; ctx.textAlign='center';
      ctx.fillText('질의 [2..6] = min( sparse[2][2] , sparse[3][2] ) = min(1, 1) = 1', W/2, H*0.74);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('겹쳐도 되는 연산(min·max·gcd)이라 두 개의 2^k 블록으로 임의 구간을 덮음 → O(1)', W/2, H*0.86);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('전처리 O(n log n)·메모리 O(n log n). 합처럼 겹치면 안 되는 연산은 펜윅/세그트리 사용', W/2, H*0.86+20); }
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

  { id:'algo_br_grundy', concept:true, branchOf:'algo8_03',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('님과 그런디 수 — 공정 게임의 승패 공식', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('각 상태에 그런디 수 g = mex(다음 상태들의 g). g=0이면 패(다음 차례가 짐)', W/2, H*0.10+22);
      // Nim: 3 piles, XOR
      var piles=[3,4,5]; var px=W*0.5-(piles.length*120)/2+60, py=H*0.30;
      ctx.font='600 14px sans-serif';
      for(var i=0;i<piles.length;i++){ var cx=px+i*120;
        for(var j=0;j<piles[i];j++){ ctx.fillStyle='rgba(122,184,255,0.5)'; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=1.5;
          var ry=py+90-j*22; ctx.fillRect(cx-22,ry,44,16); ctx.strokeRect(cx-22,ry,44,16); }
        ctx.fillStyle='#8fe3b5'; ctx.fillText('g='+piles[i], cx, py+120);
        ctx.fillStyle='#6a6873'; ctx.font='12px sans-serif'; ctx.fillText('더미 '+(i+1), cx, py-14); ctx.font='600 14px sans-serif'; }
      ctx.fillStyle='#ffb27a'; ctx.font='600 18px sans-serif';
      ctx.fillText('3 XOR 4 XOR 5 = 2  ≠ 0  →  먼저 두는 쪽이 이긴다', W/2, H*0.66);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('님: 각 더미 크기를 모두 XOR. 결과 0=현재 차례 패, 0 아님=현재 차례 승', W/2, H*0.80);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('스프라그-그런디 정리: 모든 공정 게임은 님 더미 하나와 동치. 독립 게임의 합 = 그런디 수의 XOR', W/2, H*0.80+20);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('mex(집합) = 집합에 없는 가장 작은 음 아닌 정수. 예: mex{0,1,3}=2', W/2, H*0.80+40); }
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

  { id:'algo_br_incexc', concept:true, branchOf:'algo8_03',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('포함배제 원리 — 겹친 것을 더하고 빼며 세기', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('|A∪B∪C| = (각각 더하기) − (둘씩 겹침 빼기) + (셋 겹침 다시 더하기)', W/2, H*0.10+22);
      // three overlapping circles
      var cyc=H*0.50, r=H*0.20, cx=W/2;
      var circ=[[cx-r*0.7,cyc-r*0.4,'#7ab8ff','A'],[cx+r*0.7,cyc-r*0.4,'#8fe3b5','B'],[cx,cyc+r*0.7,'#ffb27a','C']];
      ctx.lineWidth=2.5;
      circ.forEach(function(c){ ctx.strokeStyle=c[2]; ctx.fillStyle=c[2].replace(')',',0.10)').replace('#','rgba(').length? c[2]:c[2];
        ctx.beginPath(); ctx.arc(c[0],c[1],r,0,Math.PI*2);
        ctx.globalAlpha=0.12; ctx.fillStyle=c[2]; ctx.fill(); ctx.globalAlpha=1; ctx.stroke(); });
      circ.forEach(function(c){ ctx.fillStyle=c[2]; ctx.font='600 18px sans-serif';
        ctx.fillText(c[3], c[0]+(c[3]==='A'?-r*0.5:c[3]==='B'?r*0.5:0), c[1]+(c[3]==='C'?r*0.5:-r*0.4)); });
      ctx.fillStyle='#dfeefb'; ctx.font='600 14px sans-serif';
      ctx.fillText('|A∪B∪C| = |A|+|B|+|C| − |A∩B|−|A∩C|−|B∩C| + |A∩B∩C|', W/2, H*0.84);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('홀수 개 교집합은 더하고(+), 짝수 개는 뺀다(−). 일반화: Σ (−1)^(|S|+1) |∩S|', W/2, H*0.84+20);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('쓰임: "어떤 조건도 만족 안 하는 것" 세기(여사건), 오일러 피·뫼비우스·교란순열(완전순열)', W/2, H*0.84+38); }
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

  { id:'algo_br_ntt', concept:true, branchOf:'algo8_03',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('수론 변환(NTT) — 오차 없는 정수 FFT', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('FFT의 복소수 단위근을, 소수 모듈러의 원시근으로 바꿔 정수만으로 합성곱', W/2, H*0.10+22);
      // contrast two columns: FFT vs NTT
      function col(x,title,col1,lines){ ctx.fillStyle=col1; ctx.font='600 15px sans-serif'; ctx.fillText(title,x,H*0.32);
        ctx.fillStyle='#cfd8e6'; ctx.font='13px sans-serif';
        lines.forEach(function(t,i){ ctx.fillText(t,x,H*0.40+i*24); }); }
      col(W*0.27,'FFT (복소수)','#7ab8ff',['단위근 e^(2πi/n)','부동소수점 사용','반올림 오차 가능','큰 계수에서 위험']);
      col(W*0.73,'NTT (정수 mod p)','#8fe3b5',['원시근 g^((p−1)/n)','정수 모듈러 연산','오차 0 (정확)','계수가 p 미만이어야']);
      // divider
      ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(W*0.5,H*0.30); ctx.lineTo(W*0.5,H*0.74); ctx.stroke();
      ctx.fillStyle='#ffb27a'; ctx.font='600 14px sans-serif';
      ctx.fillText('대표 소수 998244353 = 119·2²³ + 1 → 길이 2²³까지 변환 가능', W/2, H*0.82);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('O(n log n) 합성곱을 정수로 정확히. 큰 정수·다항식 곱, 모듈러 조합론, 문자열 문제에 사용', W/2, H*0.90); }
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

  { id:'algo_br_anneal', concept:true, branchOf:'algo8_04',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('시뮬레이티드 어닐링 — 가끔 손해도 받아들이기', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('경사하강은 가까운 골짜기에 갇힌다. 담금질은 온도를 천천히 낮추며 더 깊은 골짜기를 찾는다', W/2, H*0.10+22);
      // energy landscape with local & global minima, a ball
      var gx0=W*0.16, gx1=W*0.84, gy=H*0.62, amp=H*0.16;
      ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2.5; ctx.beginPath();
      function fY(x){ var t=(x-gx0)/(gx1-gx0); // two valleys, global on right deeper
        var y = Math.sin(t*Math.PI*2)*0.5 + (t-0.6)*(t-0.6)*1.6 - t*0.5; return gy - y*amp; }
      for(var x=gx0;x<=gx1;x+=4){ var yy=fY(x); if(x===gx0)ctx.moveTo(x,yy);else ctx.lineTo(x,yy); } ctx.stroke();
      // local min ball (left) escaping toward global (right)
      var bx=gx0+(gx1-gx0)*0.30; ctx.fillStyle='#ffb27a'; ctx.beginPath(); ctx.arc(bx,fY(bx)-8,9,0,Math.PI*2); ctx.fill();
      var gx=gx0+(gx1-gx0)*0.78; ctx.fillStyle='rgba(143,227,181,0.5)'; ctx.beginPath(); ctx.arc(gx,fY(gx)-8,9,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif'; ctx.fillText('지역 최솟값(갇힘)', bx, fY(bx)+28); ctx.fillStyle='#8fe3b5'; ctx.fillText('전역 최솟값', gx, fY(gx)+28);
      // arrow over the hump
      ctx.strokeStyle='#ffb27a'; ctx.lineWidth=2; ctx.setLineDash([5,4]); ctx.beginPath();
      ctx.moveTo(bx+12,fY(bx)-18); ctx.quadraticCurveTo((bx+gx)/2,H*0.30,gx-12,fY(gx)-18); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='#ffb27a'; ctx.font='600 13px sans-serif';
      ctx.fillText('나빠지는 이동도 확률 exp(−Δ/T)로 수용 → 언덕을 넘는다', W/2, H*0.30);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('온도 T가 높으면 거의 무작위 탐색, 낮아지면 점점 욕심내기. 천천히 식히면(냉각 스케줄) 전역해로 수렴', W/2, H*0.84);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('금속을 천천히 식혀 결정 결함을 없애는 담금질에서 따옴. NP-난해 최적화(TSP·배치)의 메타휴리스틱', W/2, H*0.84+20); }
  },

  { id:'algo_br_karatsuba', concept:true, branchOf:'algo8_03',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('카라츠바 — 곱셈 4번을 3번으로', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('큰 수를 반으로 쪼개 곱하면 곱셈 4번. 한 번을 덧셈으로 대체해 O(n^1.585)', W/2, H*0.10+22);
      ctx.fillStyle='#dfeefb'; ctx.font='600 14px sans-serif';
      ctx.fillText('x = a·Bⁿ + b,   y = c·Bⁿ + d   →   xy = ac·B²ⁿ + (ad+bc)·Bⁿ + bd', W/2, H*0.30);
      // three products boxes
      var boxes=[['z₂ = a·c','#7ab8ff'],['z₀ = b·d','#7ab8ff'],['z₁ = (a+b)(c+d) − z₂ − z₀','#ffb27a']];
      var by=H*0.42;
      boxes.forEach(function(b,i){ var y=by+i*44;
        ctx.fillStyle=b[1]==='#ffb27a'?'rgba(255,178,122,0.16)':'rgba(122,184,255,0.12)'; ctx.strokeStyle=b[1]; ctx.lineWidth=2;
        ctx.fillRect(W*0.28,y,W*0.44,34); ctx.strokeRect(W*0.28,y,W*0.44,34);
        ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif'; ctx.fillText(b[0],W*0.5,y+22); });
      ctx.fillStyle='#ffb27a'; ctx.font='600 13px sans-serif';
      ctx.fillText('ad+bc = z₁ — 따로 두 번 곱하지 않고 z₁ 한 번으로! (곱셈 3번)', W/2, H*0.66);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('점화식 T(n)=3·T(n/2)+O(n) → 마스터 정리로 O(n^log₂3) ≈ O(n^1.585)', W/2, H*0.80);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('학교 곱셈 O(n²)보다 빠름(큰 수에서). 더 빠른 건 FFT/NTT O(n log n). 스트라센의 정수판 사촌', W/2, H*0.80+20); }
  },

  { id:'algo_br_lagrange', concept:true, branchOf:'algo8_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('라그랑주 보간 — 점들을 지나는 다항식 한 개', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('서로 다른 n+1개 점을 지나는 n차 다항식은 유일. 그것을 바로 적어 내는 공식', W/2, H*0.10+22);
      // plot points and a smooth curve through them
      var px=[0.20,0.40,0.62,0.82], py=[0.66,0.40,0.58,0.34];
      function X(t){return W*0.1+t*W*0.8;} function Y(t){return H*0.24+t*H*0.5;}
      // curve (just a wavy interpolation visual)
      ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2.5; ctx.beginPath();
      for(var i=0;i<px.length;i++){ var x=X(px[i]),y=Y(py[i]); if(i===0)ctx.moveTo(x,y); else { var pxm=X((px[i-1]+px[i])/2); ctx.quadraticCurveTo(pxm,Y(py[i-1]),x,y);} } ctx.stroke();
      for(var i=0;i<px.length;i++){ ctx.fillStyle='#ffb27a'; ctx.beginPath(); ctx.arc(X(px[i]),Y(py[i]),6,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#8a8893'; ctx.font='11px sans-serif'; ctx.fillText('(x'+i+', y'+i+')',X(px[i]),Y(py[i])-12); }
      ctx.fillStyle='#dfeefb'; ctx.font='600 14px sans-serif';
      ctx.fillText('P(x) = Σ yᵢ · ℓᵢ(x),   ℓᵢ(x) = ∏(j≠i) (x − xⱼ)/(xᵢ − xⱼ)', W/2, H*0.80);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('기저 ℓᵢ는 xᵢ에서 1, 다른 xⱼ에서 0 → 합치면 모든 점을 정확히 통과. O(n²)로 한 점 평가', W/2, H*0.80+20);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('쓰임: 거듭제곱 합 같은 다항식 수열 외삽, 비밀 분산(샤미르), 수치해석. 같은 점=같은 다항식(유일성)', W/2, H*0.80+38); }
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

  { id:'algo_br_burnside', concept:true, branchOf:'algo8_03',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('번사이드 보조정리 — 대칭을 같게 보고 세기', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('회전·반사로 겹치는 배치를 하나로 셀 때, "고정점의 평균"이 답', W/2, H*0.10+22);
      // necklace of beads with rotation
      var cx=W/2, cy=H*0.44, r=H*0.16, beads=6;
      ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.stroke();
      var colors=['#7ab8ff','#ffb27a','#7ab8ff','#8fe3b5','#ffb27a','#8fe3b5'];
      for(var i=0;i<beads;i++){ var a=-Math.PI/2+i*2*Math.PI/beads; var x=cx+r*Math.cos(a), y=cy+r*Math.sin(a);
        ctx.fillStyle=colors[i]; ctx.beginPath(); ctx.arc(x,y,11,0,Math.PI*2); ctx.fill(); }
      // rotation arrow
      ctx.strokeStyle='#ffb27a'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(cx,cy,r*0.5,-0.6,1.6); ctx.stroke();
      ctx.fillStyle='#ffb27a'; ctx.font='12px sans-serif'; ctx.fillText('회전 대칭', cx, cy+4);
      ctx.fillStyle='#dfeefb'; ctx.font='600 15px sans-serif';
      ctx.fillText('서로 다른 배치 수 = (1/|G|) · Σ(g∈G) |g가 고정하는 배치 수|', W/2, H*0.70);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('각 대칭 변환 g마다 "g를 적용해도 그대로인 색칠 수"를 세어 평균 — 궤도(같은 것끼리)의 개수', W/2, H*0.82);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('폴리아 열거 정리로 확장(고정점 = 순환마디 수의 거듭제곱). 목걸이·주사위 색칠·동형 그래프 세기', W/2, H*0.90); }
  },

  { id:'algo_br_dlx', concept:true, branchOf:'algo8_03',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('댄싱 링크(DLX) — 정확 덮개를 우아하게 백트래킹', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('"각 열을 정확히 한 번씩 덮는 행 집합 고르기"(정확 덮개)를, 이중 연결 리스트로 빠르게', W/2, H*0.10+22);
      // exact cover matrix
      var M=[[1,0,0,1,0],[0,1,1,0,0],[1,0,0,0,1],[0,1,0,0,1],[0,0,1,1,0]];
      var bx=W*0.34, by=H*0.30, cw=40;
      ctx.font='12px sans-serif';
      for(var c=0;c<5;c++){ ctx.fillStyle='#6a6873'; ctx.fillText('열'+(c+1),bx+c*cw+cw/2,by-8); }
      for(var r=0;r<5;r++){ ctx.fillStyle='#6a6873'; ctx.textAlign='right'; ctx.fillText('행'+(r+1),bx-8,by+r*30+20); ctx.textAlign='center';
        for(var c=0;c<5;c++){ var x=bx+c*cw,y=by+r*30; var on=M[r][c]===1;
          ctx.fillStyle=on?'rgba(143,227,181,0.3)':'rgba(122,184,255,0.06)'; ctx.strokeStyle=on?'#8fe3b5':'#36405a'; ctx.lineWidth=on?2:1;
          ctx.fillRect(x,y,cw-6,26); ctx.strokeRect(x,y,cw-6,26);
          if(on){ ctx.fillStyle='#8fe3b5'; ctx.font='600 13px sans-serif'; ctx.fillText('1',x+(cw-6)/2,y+18); ctx.font='12px sans-serif'; } } }
      ctx.fillStyle='#8fe3b5'; ctx.font='600 13px sans-serif';
      ctx.fillText('해: 행1{1,4} + 행2{2,3} + 행4{?}… 모든 열을 정확히 한 번 덮는 조합', W/2, H*0.70);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('Algorithm X: 가장 1이 적은 열 선택 → 그 열을 덮는 행을 시도 → 충돌 행·열을 리스트에서 "제거"', W/2, H*0.82);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('이중 연결 리스트라 제거/복원이 포인터 몇 개로 O(1)(춤추듯) → 백트래킹 초고속. 스도쿠·N-퀸·펜토미노', W/2, H*0.90); }
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

  { id:'algo_br_dinkelbach', concept:true, branchOf:'algo8_01',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('분수계획법(Dinkelbach) — 비율을 최대화하기', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('"합/합"(예 평균 비용) 최대화를, 매개변수 λ를 도입해 "합 − λ·합" 문제 반복으로', W/2, H*0.10+22);
      ctx.fillStyle='#dfeefb'; ctx.font='600 15px sans-serif';
      ctx.fillText('max  ( Σ profit ) / ( Σ cost )   →   g(λ) = max ( Σ profit − λ·Σ cost )', W/2, H*0.32);
      // g(λ) decreasing curve crossing zero at optimal λ*
      var ax=W*0.18, bx2=W*0.82, ay=H*0.44, by2=H*0.74;
      ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(ax,by2); ctx.lineTo(bx2,by2); ctx.stroke();
      // zero line
      var zy=(ay+by2)/2; ctx.strokeStyle='rgba(143,227,181,0.4)'; ctx.setLineDash([5,4]); ctx.beginPath(); ctx.moveTo(ax,zy); ctx.lineTo(bx2,zy); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2.5; ctx.beginPath();
      for(var t=0;t<=1.001;t+=0.02){ var x=ax+t*(bx2-ax), y=ay+ (by2-ay)*t; if(t===0)ctx.moveTo(x,y); else ctx.lineTo(x,y);} ctx.stroke();
      var lx=ax+0.5*(bx2-ax); ctx.fillStyle='#ffb27a'; ctx.beginPath(); ctx.arc(lx,zy,5,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#ffb27a'; ctx.font='12px sans-serif'; ctx.fillText('g(λ*)=0 → λ* = 최적 비율', lx, zy-12);
      ctx.fillStyle='#6a6873'; ctx.font='11px sans-serif'; ctx.fillText('g(λ) 감소', bx2-40, by2-8); ctx.fillText('λ', bx2-6, by2+16);
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('g(λ)는 λ에 대해 단조 감소. g(λ)=0이 되는 λ*가 최적 비율 → 뉴턴식 반복 or 이분 탐색', W/2, H*0.84);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('각 반복은 일반 최적화(최대평균사이클·최적비용신장트리 등). 최소평균사이클·최대밀도부분그래프에', W/2, H*0.84+20); }
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

  { id:'algo_br_xorbasis', concept:true, branchOf:'algo8_03',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('XOR 선형 기저 — 부분집합 XOR의 모든 값', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('수들의 부분집합 XOR로 만들 수 있는 값 전체를, 가우스 소거의 XOR판으로 압축', W/2, H*0.10+22);
      // basis vectors as bit rows (leading bits distinct)
      var basis=['1 0 1 1','0 1 1 0','0 0 1 0']; var by=H*0.32, bw=30;
      ctx.fillStyle='#6a6873'; ctx.font='12px sans-serif'; ctx.fillText('선형 기저(각 행의 선두 1 위치가 서로 다름)', W/2, by-16);
      basis.forEach(function(b,r){ var bits=b.split(' '); var y=by+r*40;
        for(var c=0;c<bits.length;c++){ var x=W*0.5-(bits.length*bw)/2+c*bw; var one=bits[c]==='1'; var lead=(one && bits.slice(0,c).every(function(z){return z==='0';}));
          ctx.fillStyle=lead?'rgba(255,178,122,0.3)':(one?'rgba(122,184,255,0.25)':'rgba(122,184,255,0.05)'); ctx.strokeStyle=lead?'#ffb27a':'#3a4358'; ctx.lineWidth=lead?2.5:1;
          ctx.fillRect(x,y,bw-4,30); ctx.strokeRect(x,y,bw-4,30);
          ctx.fillStyle=one?'#dfeefb':'#4a5568'; ctx.font='600 14px monospace'; ctx.fillText(bits[c],x+(bw-4)/2,y+20); } });
      ctx.fillStyle='#ffb27a'; ctx.font='12px sans-serif'; ctx.fillText('주황=선두 비트(pivot)', W/2, by+3*40+8);
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif';
      ctx.fillText('삽입: 새 수의 최상위 비트부터, 그 비트의 기저가 있으면 XOR로 지우고 내려감', W/2, H*0.80);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('기저 크기 k → 만들 수 있는 XOR 값은 2ᵏ개. 최대 XOR=큰 비트부터 탐욕적으로 켜기', W/2, H*0.88);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('쓰임: 부분집합 최대 XOR, XOR로 특정값 가능여부, k번째 XOR값. GF(2) 벡터공간의 가우스 소거', W/2, H*0.88+20); }
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

  { id:'algo_br_matrixtree', concept:true, branchOf:'algo8_03',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 17px sans-serif';
      ctx.fillText('키르히호프 정리 — 신장 트리의 개수를 행렬식으로', W/2, H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('그래프의 서로 다른 신장 트리 수 = 라플라시안 행렬의 여인수(한 행·열 지운 행렬식)', W/2, H*0.10+22);
      // small graph + a couple spanning trees
      var N={a:[0.22,0.34],b:[0.40,0.34],c:[0.22,0.62],d:[0.40,0.62]};
      var edges=[['a','b'],['a','c'],['b','d'],['c','d'],['a','d']];
      function xy(t){ return [W*t[0], H*0.22+t[1]*H*0.5]; }
      edges.forEach(function(e){ var p=xy(N[e[0]]),q=xy(N[e[1]]); ctx.strokeStyle='rgba(122,184,255,0.5)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(p[0],p[1]); ctx.lineTo(q[0],q[1]); ctx.stroke(); });
      Object.keys(N).forEach(function(k){ var p=xy(N[k]); ctx.fillStyle='rgba(122,184,255,0.18)'; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(p[0],p[1],13,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.fillStyle='#dfeefb'; ctx.font='600 12px sans-serif'; ctx.fillText(k.toUpperCase(),p[0],p[1]+4); });
      ctx.fillStyle='#dfeefb'; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
      ctx.fillText('라플라시안 L = D(차수 대각) − A(인접행렬)', W*0.56, H*0.36);
      ctx.fillText('신장트리 수 = det( L에서 임의의', W*0.56, H*0.46);
      ctx.fillText('한 행과 한 열을 지운 행렬 )', W*0.56, H*0.53); ctx.textAlign='center';
      ctx.fillStyle='#ffb27a'; ctx.font='600 14px sans-serif';
      ctx.fillText('어느 행·열을 지워도 같은 값(여인수가 모두 동일)', W/2, H*0.74);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('가우스 소거로 행렬식 O(V³). 케일리 공식(완전그래프 nⁿ⁻²)도 이 정리의 특수 경우', W/2, H*0.85);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('가중(곱)·방향(루트 향한 arborescence) 버전도 존재. 회로 이론(키르히호프)에서 유래', W/2, H*0.85+20); }
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
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
