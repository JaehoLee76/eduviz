/* 알고리즘 — 분기(세부) 장면. 뼈대 장면에서 branchOf로 갈라짐. 자료(CLRS) 충실 반영의 시작.
   동작(behavior)만. 텍스트는 content/algo_br.json. AV 사용. */
(function(){
  var scenes=[

  // ══════ 퀵정렬(algo3_05) ▸ 최악의 경우 O(n²) (CLRS 7.2) ══════
  { id:'algo_br_qs1', branchOf:'algo3_05',
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
  { id:'algo_br_qs2', branchOf:'algo3_05',
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
  { id:'algo_br_master', branchOf:'algo1_03',
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
  { id:'algo_br_lb', branchOf:'algo3_04',
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
  { id:'algo_br_count', branchOf:'algo3_04',
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
  { id:'algo_br_radix', branchOf:'algo3_04',
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
  { id:'algo_br_select', branchOf:'algo3_05',
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
  { id:'algo_br_heapsort', branchOf:'algo5_04',
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
  { id:'algo_br_buildheap', branchOf:'algo5_04',
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
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
