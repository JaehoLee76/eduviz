/* 알고리즘 — 분기(세부) 장면. 뼈대 장면에서 branchOf로 갈라짐. 자료(CLRS) 충실 반영의 시작.
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

  // ══════ 퀵정렬(algo3_05) ▸ 최악의 경우 O(n²) (CLRS 7.2) ══════
  { id:'algo_br_qs1', concept:true, branchOf:'algo3_05',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, levels=[[1,2,3,4,5,6],[1,2,3,4,5],[1,2,3,4],[1,2,3],[1,2]], top=E.H*0.22, lh=E.H*0.10, cell=34, cx=E.W/2;
      for(var L=0;L<levels.length;L++){ var a=levels[L], x0=cx-(a.length*cell)/2, y=top+L*lh;
        for(var i=0;i<a.length;i++){ var x=x0+i*cell, isPivot=(i===a.length-1);
          ctx.fillStyle=isPivot?'rgba(244,160,192,0.3)':'rgba(122,184,255,0.12)'; ctx.strokeStyle=isPivot?'#f4a0c0':'#7ab8ff'; ctx.lineWidth=1.5;
          ctx.fillRect(x,y,cell-3,cell-3); ctx.strokeRect(x,y,cell-3,cell-3);
          ctx.fillStyle='#dfeefb'; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(a[i],x+cell/2-1,y+cell/2-1); ctx.textBaseline='alphabetic'; }
        ctx.fillStyle='#f4a0c0'; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('피벗 '+a[a.length-1]+' → 한쪽만 줄어듦', x0+a.length*cell+12, y+cell/2); }
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('비교 = (n−1)+(n−2)+…+1 = n(n−1)/2  (수학 13장 가우스 합!)', cx, top+levels.length*lh+24);
      E.big('이미 정렬된 입력 + 끝값 피벗 = O(n²)', '퀵정렬 최악의 경우 — 분할이 (n−1):0으로 치우쳐 깊이 n. 좋은 피벗이 관건 (다음 분기: 랜덤화)'); }
  },

  // ══════ 퀵정렬(algo3_05) ▸ 랜덤화된 퀵정렬 (CLRS 7.3) ══════
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

  // ══════ 빅오(algo1_03) ▸ 마스터 정리 (CLRS 4.5) ══════
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

  // ══════ 병합(algo3_04) ▸ 정렬의 하한 (CLRS 8.1, 결정 트리) ══════
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

  // ══════ 병합(algo3_04) ▸ 계수 정렬 (CLRS 8.2) ══════
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

  // ══════ 병합(algo3_04) ▸ 기수 정렬 (CLRS 8.3) ══════
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

  // ══════ 퀵(algo3_05) ▸ 순서 통계 / quickselect (CLRS 9) ══════
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

  // ══════ 힙(algo5_04) ▸ 힙 정렬 (CLRS 6.4) ══════
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
      E.big('힙 정렬 — O(n log n), 제자리', '최대 힙(5장)의 루트=최댓값을 끝으로 빼고 힙 크기를 줄여 sift-down 반복. 추가 메모리 없이(in-place) O(n log n)!'); }
  },

  // ══════ 힙(algo5_04) ▸ 힙 만들기 build-heap O(n) (CLRS 6.3) ══════
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

  // ══════ DFS(algo6_04) ▸ 위상 정렬 (CLRS 20.4) ══════
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

  // ══════ DFS(algo6_04) ▸ 강연결요소 SCC (CLRS 20.5) ══════
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

  // ══════ 다익스트라(algo6_05) ▸ 벨만-포드 (CLRS 22.1) ══════
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

  // ══════ 다익스트라(algo6_05) ▸ 플로이드-워셜 (CLRS 23.2) ══════
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
      E.big('플로이드-워셜 — 모든 쌍 최단경로', 'k를 거쳐 더 짧아지면 갱신, k=모든 정점 반복 → 모든 쌍 동시 해결! 삼중 반복 O(V³), 동적계획법(7장). 음수 간선 OK'); }
  },

  // ══════ 다익스트라(algo6_05) ▸ 최소 신장 트리 MST (CLRS 21) ══════
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

  // ══════ BST(algo5_03) ▸ 레드블랙 트리 (CLRS 13) ══════
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
      E.big('레드블랙 트리 — 스스로 균형 잡는 BST', 'BST가 한쪽으로 치우치는 걸 막는 자가균형 트리(5장 #24). 노드에 빨강/검정 색을 칠하고 삽입·삭제 시 회전+재색칠로 O(log n) 보장. map·set·DB 인덱스'); }
  },

  // ══════ 균형(algo5_05) ▸ B-트리 (CLRS 18) ══════
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

  // ══════ 균형(algo5_05) ▸ union-find 서로소 집합 (CLRS 19) ══════
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

  // ══════ DP 두 조건(algo7_04) ▸ 막대 자르기 (CLRS 14.1) ══════
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

  // ══════ 격자 DP(algo7_05) ▸ 최장 공통 부분수열 LCS (CLRS 14.4) ══════
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
      E.big('LCS("'+X+'", "'+Y+'") = '+dp[m][n]+'  ("BCB")', '최장 공통 부분수열 — 두 문자열에 공통으로(순서대로) 나타나는 가장 긴 수열. 격자 DP(7장). DNA 비교·diff·맞춤법 교정의 핵심'); }
  },

  // ══════ 격자 DP(algo7_05) ▸ 0/1 배낭 (CLRS 부록/고전 DP) ══════
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
      E.big('최대 가치 = ₩'+dp[n][cap]+' (용량 '+cap+'kg)', '0/1 배낭 — 각 물건을 담거나 말거나, 무게 한도 내 가치 최대화. dp[i][w] 표를 채워 해결(7장 격자 DP). 자원 배분의 대표 문제'); }
  },

  // ══════ 복잡도 등급표(algo1_05) ▸ 분할상환 분석 (CLRS 16) ══════
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
      E.big('분할상환 분석 — 가끔 비싸도 평균은 싸다', '동적 배열 push는 보통 O(1)이지만 꽉 차면 2배 복사(O(n)). 그래도 n번 총비용 = n+(1+2+4+…) ≈ 3n → 1번당 평균 O(1)! 최악 1회가 아닌 "긴 안목"의 분석(CLRS 16)'); }
  },

  // ══════ 선형 탐색(algo4_01) ▸ 문자열 매칭 KMP (CLRS 32) ══════
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

  // ══════ P vs NP(algo8_04) ▸ 근사 알고리즘 (CLRS 35) ══════
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
      E.big('근사 알고리즘 — 최적은 못 풀어도', 'P≠NP라면 NP-난해 문제의 최적해는 사실상 불가. 대신 "최적의 c배 이내"를 다항시간에 보장하는 근사 알고리즘으로 현실 문제를 풀어요(CLRS 35). 휴리스틱과 함께 실전의 답'); }
  },

  // ══════ 분할정복(algo8_03) ▸ 스트라센 행렬곱 (CLRS 4.2) ══════
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
      ctx.fillStyle='#7ab8ff'; ctx.fillText('계수표현 ⇄ 점값표현 (수학 10장 복소평면!)', cx, y0+136);
      E.big('FFT — 곱셈을 O(n log n)으로', '고속 푸리에 변환. 다항식·큰수 곱셈을 O(n²)에서 O(n log n)으로! 짝/홀 분할정복 + 복소수 단위근(수학 10장). 신호처리·이미지·음향의 심장'); }
  },

  // ══════ 다익스트라(algo6_05) ▸ 최대 플로우 (CLRS 24) ══════
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

  // ══════ 해시(algo2_05) ▸ 개방 주소법 (CLRS 11.4) ══════
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
      E.big('개방 주소법 — 충돌 시 다음 칸으로', '해시 충돌(2장)을 연결리스트 대신 "테이블 안에서" 해결. 자리 차면 다음 빈칸 탐사(선형/이차/이중해시). 캐시 친화적, 부하율 낮을 때 빠름'); }
  },

  // ══════ 해시(algo2_05) ▸ RSA 암호 (CLRS 31, 정수론) ══════
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

  // ══════ 스택(algo2_03) ▸ 볼록 껍질 (CLRS 33, 계산기하) ══════
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
      E.big('볼록 껍질 — 점들을 감싸는 최소 다각형', '흩어진 점들을 고무줄로 감싼 바깥 경계. 그레이엄 스캔: 각도순 정렬(3장) + 스택(2장)으로 O(n log n). 충돌 감지·패턴 인식·지도'); }
  },

  // ══════ P vs NP(algo8_04) ▸ 선형계획법 (CLRS 29) ══════
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
      E.big('확장 유클리드 — 모듈러 역원의 열쇠', '유클리드 호제법을 거꾸로 따라가며 ax+by=gcd의 x,y를 구해요(베주 항등식). gcd가 1이면 x가 곧 a의 모듈러 역원 → RSA의 비밀키 d 계산, 중국인의 나머지 정리에 필수'); }
  },

  // ══════ 분할정복(algo8_03) ▸ 가장 가까운 점 쌍 (CLRS 33.4) ══════
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

  // ══════ 그리디(algo8_01) ▸ 활동 선택 문제 (CLRS 15.1, 코드+스텝) ══════
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

  // ══════ DP(algo7_03) ▸ 최장 증가 부분수열 LIS (CLRS 14, 코드+스텝) ══════
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

  // ══════ 삽입정렬(algo3_03) ▸ 루프 불변식 정확성 (CLRS 2.1, concept) ══════
  { id:'algo_br_insinv', concept:true, branchOf:'algo3_03',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, arr=[2,4,5,7,3,8,1,6], sortedLen=4;
      var info=AV.arr(E, arr, { y:E.H*0.36, bw:50, gap:10, hl:function(i){ if(i<sortedLen) return {fill:'rgba(143,227,181,0.2)',stroke:'#8fe3b5',text:'#8fe3b5'}; if(i===sortedLen) return {fill:'rgba(255,178,122,0.3)',stroke:'#ffb27a',text:'#ffb27a',tag:'key'}; return {fill:'rgba(255,255,255,0.04)',stroke:'rgba(255,255,255,0.2)',text:'#6f6e7a'}; } });
      ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillStyle='#8fe3b5'; ctx.fillText('◀ 불변식: A[0..i−1] 는 항상 정렬됨', E.W*0.30, E.H*0.54);
      ctx.fillStyle='#6f6e7a'; ctx.fillText('아직 안 본 부분 ▶', E.W*0.74, E.H*0.54); }
  },

  // ══════ 그리디(algo8_01) ▸ 허프만 코딩 (CLRS 15.3, concept) ══════
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

  // ══════ 격자DP(algo7_05) ▸ 편집 거리 (CLRS 14, 코드+스텝) ══════
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

  // ══════ 타뷸레이션(algo7_03) ▸ 행렬 연쇄 곱셈 (CLRS 14.2, concept) ══════
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

  // ══════ DFS(algo6_04) ▸ 간선 분류 (CLRS 20.3, concept) ══════
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

  // ══════ 다익스트라(algo6_05) ▸ 정확성(그리디 불변식) (CLRS 22.3, concept) ══════
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

  // ══════ 그리디(algo8_01) ▸ 분할 가능 배낭 (CLRS 15 종합문제, 코드+스텝) ══════
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

  // ══════ 해시(algo2_05) ▸ 체이닝 충돌 해결 (CLRS 11.2, concept) ══════
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

  // ══════ 균형(algo5_05) ▸ 레드블랙 회전 (CLRS 13.2, concept) ══════
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

  // ══════ BST(algo5_03) ▸ BST 삽입 (CLRS 12.3, 코드+스텝) ══════
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

  // ══════ BST(algo5_03) ▸ BST 삭제 (CLRS 12.3, concept) ══════
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

  // ══════ 힙(algo5_04) ▸ 힙 삽입 sift-up (CLRS 6.5, 코드+스텝) ══════
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

  // ══════ P vs NP(algo8_04) ▸ 환원(reduction) (CLRS 34.3, concept) ══════
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
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
