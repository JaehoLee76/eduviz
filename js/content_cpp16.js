/* C++ 제16장 — 주요 알고리즘 구현 (표준 알고리즘 기반, 실제 C++): 정렬(퀵·병합) · 이진탐색 · 그래프(BFS·DFS) · 다익스트라 · DP(0/1 배낭)
   동작(behavior)만. 텍스트=content/cpp16.json. 엔진 js/engine.js 공유. 색: C++=파랑(#5ab4e8).
   골든룰(엄수): 정렬결과·비교/교환·탐색위치·방문순서·최단거리·DP표 값은 draw에서 실제로 알고리즘을 한 단계씩 돌려 계산.
   고정 입력 배열·그래프. Math.random()/Date.now() 금지. 좌측=진짜 표준 C++ 코드 + 줄커서, 우측=캔버스 단계 실연. */
(function(){
  var CPB='#5ab4e8', CPD='#8fd0f5', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', PNK='#f4a0c0', DIM='#9b99a3', RED='#f0888a';

  function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function codePanel(E, x, y, w, lines, title, actLine){
    var ctx=E.ctx, pad=14, top=y, n=lines.length;
    // 줄높이를 남는 세로공간에 맞춰 축소(낮은 창서 코드가 캔버스 밑으로 잘리지 않게). 기본 16, 하한 12.
    var botLimit=E.H*0.93, avail=botLimit - top - pad*2 - (title?26:0);
    var lh=Math.max(12, Math.min(16, Math.floor(avail/n)));
    var ht=n*lh+pad*2+(title?26:0);
    ctx.fillStyle='rgba(255,255,255,0.035)'; ctx.strokeStyle='rgba(90,180,232,0.30)'; ctx.lineWidth=1;
    roundRect(ctx,x,top,w,ht,10); ctx.fill(); ctx.stroke();
    var cy=top+pad+(title?26:0);
    if(title){ ctx.fillStyle=CPB; ctx.font='600 12px sans-serif'; ctx.textAlign='left'; ctx.fillText(title, x+pad, top+pad+12); }
    var fs=Math.max(11, Math.min(13, lh-3));
    ctx.font=fs+'px ui-monospace,Menlo,Consolas,monospace'; ctx.textAlign='left';
    for(var i=0;i<n;i++){
      var L=lines[i], t=(typeof L==='string')?L:L.t, hl=(typeof L==='object')?L.hl:null;
      var ty=cy+i*lh+lh-5;
      if(actLine!=null && i===actLine){ ctx.fillStyle='rgba(90,180,232,0.16)'; ctx.fillRect(x+4, cy+i*lh+1, w-8, lh-2); ctx.fillStyle=CPB; ctx.fillRect(x+4, cy+i*lh+1, 3, lh-2); }
      if(hl && t.indexOf(hl)>=0){ var a=t.split(hl), pre=a[0], post=a.slice(1).join(hl);
        ctx.fillStyle=DIM; ctx.fillText(pre, x+pad, ty); var wpre=ctx.measureText(pre).width;
        ctx.fillStyle=CPB; ctx.fillText(hl, x+pad+wpre, ty); var whl=ctx.measureText(hl).width;
        ctx.fillStyle=DIM; ctx.fillText(post, x+pad+wpre+whl, ty);
      } else { ctx.fillStyle=((typeof L==='object'&&L.dim)?DIM:'#dfeaf2'); ctx.fillText(t, x+pad, ty); }
    }
    return top+ht;
  }
  function cell(ctx,x,y,w,h,txt,fill,stroke,tcol,fs){
    ctx.fillStyle=fill||'rgba(255,255,255,0.04)'; ctx.fillRect(x,y,w,h);
    ctx.strokeStyle=stroke||'rgba(255,255,255,0.12)'; ctx.lineWidth=1; ctx.strokeRect(x,y,w,h);
    if(txt!=null){ ctx.fillStyle=tcol||'#dfeaf2'; ctx.font=(fs||13)+'px ui-monospace,Menlo,monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(''+txt, x+w/2, y+h/2+1); ctx.textBaseline='alphabetic'; }
  }
  // 막대 그래프 렌더러 (정렬·탐색 공용). states: 각 인덱스 상태색 함수 반환
  function bars(ctx, x, y, w, h, arr, colOf, maxv){
    var n=arr.length, bw=w/n, mv=maxv||Math.max.apply(null,arr);
    for(var i=0;i<n;i++){ var bh=arr[i]/mv*h, bx=x+i*bw+3, by=y+h-bh;
      ctx.fillStyle=colOf(i); ctx.fillRect(bx, by, bw-6, bh);
      ctx.fillStyle='#dfeaf2'; ctx.font='12px ui-monospace,monospace'; ctx.textAlign='center'; ctx.fillText(arr[i], x+i*bw+bw/2, y+h+15);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText(i, x+i*bw+bw/2, y+h+30);
    }
  }

  var scenes = [

  // ══════════ 1. 정렬 — 퀵정렬·병합정렬 ══════════
  { id:'cpp16_01',
    enter:function(E){ var self=this; this.s={which:0, step:0};
      // 두 정렬 각각의 전체 프레임을 실제로 돌려 사전 계산 (골든룰)
      var input=[5,2,8,1,9,3];
      // ── 퀵정렬 (Lomuto 파티션) 프레임 기록 ──
      function quick(){
        var a=input.slice(), frames=[];
        function snap(lo,hi,i,j,piv,note,line){ frames.push({arr:a.slice(),lo:lo,hi:hi,i:i,j:j,piv:piv,note:note,line:line}); }
        function part(lo,hi){
          var pivot=a[hi], i=lo-1;
          snap(lo,hi,i,lo,hi,'피벗 = a['+hi+'] = '+pivot,3);
          for(var j=lo;j<hi;j++){
            snap(lo,hi,i,j,hi,'a['+j+']='+a[j]+' 와 피벗 '+pivot+' 비교',4);
            if(a[j]<pivot){ i++; var t=a[i]; a[i]=a[j]; a[j]=t; snap(lo,hi,i,j,hi,'a['+j+']<피벗 → i증가·교환',5); }
          }
          var t=a[i+1]; a[i+1]=a[hi]; a[hi]=t; snap(lo,hi,i+1,hi,i+1,'피벗을 제자리 '+(i+1)+'로',6);
          return i+1;
        }
        function qs(lo,hi){ if(lo>=hi) return; var p=part(lo,hi); qs(lo,p-1); qs(p+1,hi); }
        qs(0,a.length-1); frames.push({arr:a.slice(),lo:-1,hi:-1,i:-1,j:-1,piv:-1,note:'정렬 완료',line:0}); return frames;
      }
      // ── 병합정렬 프레임 기록 ──
      function merge(){
        var a=input.slice(), frames=[];
        function snap(rangeL,rangeR,merged,note,line){ frames.push({arr:a.slice(),L:rangeL,R:rangeR,merged:merged?merged.slice():null,note:note,line:line}); }
        function ms(lo,hi){
          if(lo>=hi) return;
          var mid=(lo+hi)>>1;
          snap(lo,hi,null,'['+lo+'..'+hi+'] 를 둘로 분할',2);
          ms(lo,mid); ms(mid+1,hi);
          // 병합
          var tmp=[], p=lo, q=mid+1;
          while(p<=mid && q<=hi){ if(a[p]<=a[q]) tmp.push(a[p++]); else tmp.push(a[q++]); }
          while(p<=mid) tmp.push(a[p++]);
          while(q<=hi) tmp.push(a[q++]);
          for(var k=0;k<tmp.length;k++) a[lo+k]=tmp[k];
          snap(lo,hi,null,'['+lo+'..'+mid+'] + ['+(mid+1)+'..'+hi+'] 병합 → 정렬됨',7);
        }
        ms(0,a.length-1); frames.push({arr:a.slice(),L:-1,R:-1,merged:null,note:'정렬 완료',line:0}); return frames;
      }
      this.qf=quick(); this.mf=merge();
      E.controls('<div class="ctrl"><label>알고리즘 (퀵 ↔ 병합)</label><input type="range" id="w" min="0" max="1" step="1" value="0"><output id="wo">퀵정렬</output></div>');
      E.bind('#w','input',function(e){ self.s.which=+e.target.value; self.s.step=0; document.getElementById('wo').textContent=(+e.target.value?'병합정렬':'퀵정렬'); E.blip(340,0.06); });
      E.setOn([]); },
    tap:function(E){ var f=this.s.which===0?this.qf:this.mf; this.s.step=(this.s.step+1)%f.length; E.blip(360,0.06); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var isQuick=(s.which===0), frames=isQuick?this.qf:this.mf, f=frames[Math.min(s.step,frames.length-1)];
      var code = isQuick ? [
        {t:'// 퀵정렬 (Lomuto 파티션)', dim:true},
        {t:'int part(int a[],int lo,int hi){', hl:'part'},
        {t:'  int piv=a[hi], i=lo-1;', hl:'piv=a[hi]'},
        {t:'  for(int j=lo;j<hi;++j)', hl:'j<hi'},
        {t:'    if(a[j]<piv) swap(a[++i],a[j]);', hl:'a[j]<piv'},
        {t:'  swap(a[i+1],a[hi]); return i+1;', hl:'swap'},
        {t:'}', dim:true},
        {t:'void qsort(int a[],int lo,int hi){', hl:'qsort'},
        {t:'  if(lo>=hi) return;', dim:true},
        {t:'  int p=part(a,lo,hi);', hl:'part'},
        {t:'  qsort(a,lo,p-1); qsort(a,p+1,hi);', hl:'qsort'},
        {t:'}', dim:true}
      ] : [
        {t:'// 병합정렬', dim:true},
        {t:'void msort(int a[],int lo,int hi){', hl:'msort'},
        {t:'  if(lo>=hi) return; int mid=(lo+hi)/2;', hl:'mid'},
        {t:'  msort(a,lo,mid);', hl:'msort'},
        {t:'  msort(a,mid+1,hi);', hl:'msort'},
        {t:'  // 두 정렬 구간을 병합', dim:true},
        {t:'  int tmp[N],p=lo,q=mid+1,k=0;', dim:true},
        {t:'  while(p<=mid&&q<=hi)', hl:'while'},
        {t:'    tmp[k++]=(a[p]<=a[q])?a[p++]:a[q++];', hl:'tmp[k++]'},
        {t:'  /* 남은 원소 복사 후 a에 되쓰기 */', dim:true},
        {t:'}', dim:true}
      ];
      var act = isQuick ? f.line : (f.line===2?2:(f.line===7?8:f.line));
      codePanel(E, W*0.03, H*0.09, W*0.47, code, isQuick?'quicksort.cpp':'mergesort.cpp', act);

      var tx=W*0.54, tw=W*0.42, ty=H*0.10, botY=H*0.93;
      ctx.fillStyle=CPB; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
      ctx.fillText(isQuick?'퀵정렬 — 피벗 기준 분할(파티션)':'병합정렬 — 분할 후 정렬 병합', tx, ty);
      // 하단 3줄(범례·STEP·결과)을 botY 위에 고정 배치하고, 막대는 그 위 남는 공간을 채움 → 낮은 창서도 안 넘침
      var resultY=botY-10, stepY=resultY-22, legendY=stepY-24;
      var bh=Math.max(52, legendY - 14 - 30/*막대 하단 값·인덱스*/ - (ty+18));

      if(isQuick){
        bars(ctx, tx, ty+18, tw, bh, f.arr, function(i){
          if(f.piv>=0 && i===f.piv) return GLD;          // 피벗
          if(i===f.j) return CPB;                         // 현재 j
          if(f.lo>=0 && i>=f.lo && i<=f.i) return GRN;     // 피벗보다 작은 확정 구간
          if(f.lo>=0 && (i<f.lo || i>f.hi)) return 'rgba(120,140,160,0.35)'; // 구간 밖
          return 'rgba(122,184,255,0.55)';
        });
        // 범례
        var ly=legendY;
        ctx.font='13.5px sans-serif'; ctx.textAlign='left';
        ctx.fillStyle=GLD; ctx.fillText('■ 피벗', tx, ly); ctx.fillStyle=CPB; ctx.fillText('■ 비교중 j', tx+70, ly);
        ctx.fillStyle=GRN; ctx.fillText('■ 피벗보다 작음(확정)', tx+170, ly);
      } else {
        bars(ctx, tx, ty+18, tw, bh, f.arr, function(i){
          if(f.L>=0 && i>=f.L && i<=f.R) return (f.line===7?GRN:CPB); // 현재 작업 구간
          if(f.L>=0) return 'rgba(120,140,160,0.35)';
          return 'rgba(122,184,255,0.55)';
        });
        var ly=legendY;
        ctx.font='13.5px sans-serif'; ctx.textAlign='left';
        ctx.fillStyle=CPB; ctx.fillText('■ 분할 구간', tx, ly); ctx.fillStyle=GRN; ctx.fillText('■ 병합 완료(정렬됨)', tx+90, ly);
      }
      // STEP 노트 (하단 고정)
      ctx.fillStyle='#dfeaf2'; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
      ctx.fillText('STEP '+(s.step+1)+'/'+frames.length+' — '+f.note, tx, stepY);
      var sorted=frames[frames.length-1].arr;
      ctx.fillStyle=GRN; ctx.font='12.5px ui-monospace,monospace';
      ctx.fillText('최종 정렬 결과: ['+sorted.join(', ')+']', tx, resultY);

      E.tapHint(W/2, H*0.95, '슬라이더=알고리즘 전환 · 화면 탭=한 단계 진행', true);
      E.big('정렬 — 퀵정렬과 병합정렬', '입력 [5,2,8,1,9,3]을 두 명작 알고리즘이 서로 다른 지혜로 정돈합니다. 퀵정렬은 피벗 하나를 골라 “그보다 작은 것은 왼쪽, 큰 것은 오른쪽”으로 자리를 나누고(파티션), 두 쪽을 재귀로 반복하죠 — 평균 O(n log n), 제자리(추가 메모리 거의 0). 병합정렬은 반대로 끝까지 반으로 쪼갠 뒤, 정렬된 두 조각을 지퍼처럼 맞물려 합칩니다 — 항상 O(n log n), 안정 정렬. 화면의 막대 색·비교·교환·최종 결과는 모두 실제로 코드를 한 줄씩 돌려 얻은 값입니다.'); }
  },

  // ══════════ 2. 이진 탐색 ══════════
  { id:'cpp16_02',
    enter:function(E){ var self=this; this.s={target:7, step:0};
      // 정렬된 고정 배열
      this.arr=[1,3,4,7,9,11,15,20,25,31];
      function run(target){ var a=self.arr, lo=0, hi=a.length-1, frames=[];
        frames.push({lo:lo,hi:hi,mid:-1,note:'lo=0, hi='+hi+' 로 시작',found:-1,line:2});
        while(lo<=hi){ var mid=(lo+hi)>>1;
          frames.push({lo:lo,hi:hi,mid:mid,note:'mid=('+lo+'+'+hi+')/2='+mid+',  a[mid]='+a[mid],found:-1,line:4});
          if(a[mid]===target){ frames.push({lo:lo,hi:hi,mid:mid,note:'a['+mid+']='+a[mid]+' = target! 찾음',found:mid,line:5}); return frames; }
          if(a[mid]<target){ frames.push({lo:mid+1,hi:hi,mid:mid,note:'a[mid]<target → lo=mid+1='+(mid+1),found:-1,line:6}); lo=mid+1; }
          else { frames.push({lo:lo,hi:mid-1,mid:mid,note:'a[mid]>target → hi=mid-1='+(mid-1),found:-1,line:7}); hi=mid-1; }
        }
        frames.push({lo:lo,hi:hi,mid:-1,note:'lo>hi → 없음',found:-2,line:8}); return frames;
      }
      this.build=run; this.frames=run(7);
      E.controls('<div class="ctrl"><label>찾을 값 target</label><input type="range" id="t" min="1" max="33" step="1" value="7"><output id="to">7</output></div>');
      E.bind('#t','input',function(e){ self.s.target=+e.target.value; self.s.step=0; self.frames=self.build(self.s.target); document.getElementById('to').textContent=e.target.value; E.blip(340,0.06); });
      E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%this.frames.length; E.blip(360,0.06); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, a=this.arr;
      var f=this.frames[Math.min(s.step,this.frames.length-1)];
      var code=[
        {t:'// 이진 탐색 (정렬된 배열)', dim:true},
        {t:'int bsearch(int a[],int n,int target){', hl:'bsearch'},
        {t:'  int lo=0, hi=n-1;', hl:'lo=0, hi=n-1'},
        {t:'  while(lo<=hi){', hl:'lo<=hi'},
        {t:'    int mid=(lo+hi)/2;', hl:'mid=(lo+hi)/2'},
        {t:'    if(a[mid]==target) return mid;', hl:'a[mid]==target'},
        {t:'    else if(a[mid]<target) lo=mid+1;', hl:'lo=mid+1'},
        {t:'    else hi=mid-1;', hl:'hi=mid-1'},
        {t:'  } return -1;  // 없음', dim:true}
      ];
      codePanel(E, W*0.04, H*0.09, W*0.46, code, 'binary_search.cpp', f.line);

      var tx=W*0.53, ty=H*0.15, cw=Math.min(W*0.038, 46), cellY=ty+30, ch=44;
      ctx.fillStyle=CPB; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
      ctx.fillText('target = '+s.target+' 를 찾는 중 (탐색 구간 절반씩 축소)', tx, ty);
      for(var i=0;i<a.length;i++){
        var inRange=(i>=f.lo && i<=f.hi), isMid=(i===f.mid), isFound=(f.found===i);
        var fill = isFound?'rgba(126,224,176,0.30)':(isMid?'rgba(90,180,232,0.28)':(inRange?'rgba(122,184,255,0.10)':'rgba(120,140,160,0.06)'));
        var stroke = isFound?GRN:(isMid?CPB:(inRange?'rgba(122,184,255,0.4)':'rgba(255,255,255,0.10)'));
        var tcol = inRange||isFound?'#dfeaf2':DIM;
        cell(ctx, tx+i*cw, cellY, cw-2, ch, a[i], fill, stroke, tcol, 14);
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif'; ctx.textAlign='center'; ctx.fillText(i, tx+i*cw+(cw-2)/2, cellY+ch+12);
      }
      // lo/hi/mid 포인터
      function ptr(idx,lab,col){ if(idx<0||idx>=a.length) return; var px=tx+idx*cw+(cw-2)/2;
        ctx.fillStyle=col; ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.fillText(lab, px, cellY-6);
        ctx.beginPath(); ctx.moveTo(px,cellY-2); ctx.lineTo(px-4,cellY-9); ctx.lineTo(px+4,cellY-9); ctx.fill(); }
      ptr(f.lo,'lo',BLU); ptr(f.hi,'hi',PNK); if(f.mid>=0) ptr(f.mid,'mid',CPB);

      var ny=cellY+ch+40;
      ctx.fillStyle='#dfeaf2'; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
      ctx.fillText('STEP '+(s.step+1)+'/'+this.frames.length+' — '+f.note, tx, ny);
      if(f.found>=0){ ctx.fillStyle=GRN; ctx.font='700 17px sans-serif'; ctx.fillText('✓ 인덱스 '+f.found+' 에서 발견', tx, ny+28); }
      else if(f.found===-2){ ctx.fillStyle=RED; ctx.font='700 16px sans-serif'; ctx.fillText('✗ 배열에 없음 (return -1)', tx, ny+28); }
      else { var span=f.hi-f.lo+1; ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText('남은 후보 = '+Math.max(span,0)+'칸 (매 단계 절반 → 최대 log₂10 ≈ 4회)', tx, ny+26); }

      E.tapHint(W/2, H*0.95, '슬라이더=target · 화면 탭=한 단계', true);
      E.big('이진 탐색 — 매 걸음 절반을 버린다', '정렬된 배열에서라면, 한복판을 짚어 보는 것만으로 답이 어느 쪽에 있는지 알 수 있습니다. a[mid]가 찾는 값보다 작으면 왼쪽 절반은 통째로 버리고, 크면 오른쪽 절반을 버리죠. 후보가 매번 반으로 줄기에 1024개라도 단 10번, 100만 개라도 20번이면 끝납니다 — O(log n)의 위력. 단 전제 하나: 배열이 정렬돼 있어야 합니다. 화면의 lo·hi·mid와 a[mid] 비교는 모두 실제로 코드를 돌려 정한 값입니다.'); }
  },

  // ══════════ 3. 그래프 — BFS·DFS ══════════
  { id:'cpp16_03',
    enter:function(E){ var self=this; this.s={which:0, step:0};
      // 고정 그래프 (인접리스트) — 정점 0..6
      var adj={0:[1,2],1:[0,3,4],2:[0,5],3:[1],4:[1,5,6],5:[2,4],6:[4]};
      this.adj=adj;
      this.pos=[[0.5,0.15],[0.28,0.40],[0.72,0.40],[0.12,0.68],[0.44,0.68],[0.80,0.68],[0.55,0.92]];
      // BFS 프레임
      function bfs(){ var frames=[], vis={0:true}, q=[0], order=[];
        frames.push({vis:{0:true},q:[0],cur:-1,order:[],note:'큐에 시작 0 넣음',line:3});
        while(q.length){ var u=q.shift(); order.push(u);
          frames.push({vis:Object.assign({},vis),q:q.slice(),cur:u,order:order.slice(),note:'큐에서 '+u+' 꺼내 방문',line:5});
          for(var k=0;k<adj[u].length;k++){ var w=adj[u][k];
            if(!vis[w]){ vis[w]=true; q.push(w);
              frames.push({vis:Object.assign({},vis),q:q.slice(),cur:u,edge:[u,w],order:order.slice(),note:u+'→'+w+' 미방문 → 큐에 추가',line:7}); } }
        }
        frames.push({vis:Object.assign({},vis),q:[],cur:-1,order:order.slice(),note:'BFS 완료',line:9,done:true}); return frames;
      }
      // DFS (재귀) 프레임
      function dfs(){ var frames=[], vis={}, order=[];
        function go(u,parent){ vis[u]=true; order.push(u);
          frames.push({vis:Object.assign({},vis),cur:u,order:order.slice(),edge:parent>=0?[parent,u]:null,note:'방문 '+u+' (재귀 진입)',line:3});
          for(var k=0;k<adj[u].length;k++){ var w=adj[u][k];
            if(!vis[w]){ frames.push({vis:Object.assign({},vis),cur:u,order:order.slice(),edge:[u,w],note:u+'→'+w+' 미방문 → 깊이 들어감',line:5}); go(w,u); } }
        }
        go(0,-1);
        frames.push({vis:Object.assign({},vis),cur:-1,order:order.slice(),note:'DFS 완료',line:6,done:true}); return frames;
      }
      this.bf=bfs(); this.df=dfs();
      E.controls('<div class="ctrl"><label>탐색 (BFS ↔ DFS)</label><input type="range" id="w" min="0" max="1" step="1" value="0"><output id="wo">BFS (너비)</output></div>');
      E.bind('#w','input',function(e){ self.s.which=+e.target.value; self.s.step=0; document.getElementById('wo').textContent=(+e.target.value?'DFS (깊이)':'BFS (너비)'); E.blip(340,0.06); });
      E.setOn([]); },
    tap:function(E){ var f=this.s.which===0?this.bf:this.df; this.s.step=(this.s.step+1)%f.length; E.blip(360,0.06); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, adj=this.adj, pos=this.pos;
      var isBFS=(s.which===0), frames=isBFS?this.bf:this.df, f=frames[Math.min(s.step,frames.length-1)];
      var code = isBFS ? [
        {t:'// BFS — 큐로 너비 우선', dim:true},
        {t:'queue<int> q; q.push(0);', hl:'queue'},
        {t:'vector<bool> vis(N,false); vis[0]=1;', hl:'vis'},
        {t:'q.push(start);', hl:'q.push'},
        {t:'while(!q.empty()){', hl:'while'},
        {t:'  int u=q.front(); q.pop();', hl:'q.front'},
        {t:'  for(int w : adj[u])', hl:'adj[u]'},
        {t:'    if(!vis[w]){ vis[w]=1; q.push(w); }', hl:'q.push(w)'},
        {t:'}', dim:true},
        {t:'// 방문 순서 = 가까운 것부터', dim:true}
      ] : [
        {t:'// DFS — 재귀로 깊이 우선', dim:true},
        {t:'void dfs(int u){', hl:'dfs'},
        {t:'  vis[u]=true;', hl:'vis[u]=true'},
        {t:'  visit(u);', hl:'visit(u)'},
        {t:'  for(int w : adj[u])', hl:'adj[u]'},
        {t:'    if(!vis[w]) dfs(w);', hl:'dfs(w)'},
        {t:'}', dim:true},
        {t:'// 한 길 끝까지 → 막히면 되돌아옴', dim:true}
      ];
      codePanel(E, W*0.04, H*0.11, W*0.46, code, isBFS?'bfs.cpp':'dfs.cpp', f.line);

      var botY=H*0.93;
      // 하단 텍스트 블록(STEP + 큐 + 방문순서, 최대 3줄) 높이를 예약하고 그래프는 그 위로 제한
      var txtLines=isBFS?3:2, txtH=6+txtLines*20;
      var gx=W*0.52, gy=H*0.10, gw=W*0.46;
      var gh=Math.max(120, botY - txtH - gy - 22 /*노드 반지름·라벨 여유*/);
      function px(i){ return gx+pos[i][0]*gw; } function py(i){ return gy+pos[i][1]*gh; }
      // 간선
      for(var u in adj){ u=+u; for(var k=0;k<adj[u].length;k++){ var w=adj[u][k]; if(u<w){
        var active=f.edge && ((f.edge[0]===u&&f.edge[1]===w)||(f.edge[0]===w&&f.edge[1]===u));
        ctx.strokeStyle=active?CPB:'rgba(122,184,255,0.22)'; ctx.lineWidth=active?3:1.3;
        ctx.beginPath(); ctx.moveTo(px(u),py(u)); ctx.lineTo(px(w),py(w)); ctx.stroke(); } } }
      // 정점
      for(var i=0;i<7;i++){ var visited=f.vis[i], cur=(f.cur===i);
        ctx.fillStyle = cur?'rgba(90,180,232,0.9)':(visited?'rgba(126,224,176,0.75)':'rgba(120,140,160,0.35)');
        ctx.strokeStyle= cur?'#fff':(visited?GRN:'rgba(255,255,255,0.3)'); ctx.lineWidth=cur?2.6:1.6;
        ctx.beginPath(); ctx.arc(px(i),py(i),18,0,7); ctx.fill(); ctx.stroke();
        ctx.fillStyle= cur||visited?'#0b1016':'#dfeaf2'; ctx.font='700 14px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(i, px(i),py(i)+1); ctx.textBaseline='alphabetic';
        // 방문 순서 번호
        var ord=f.order.indexOf(i); if(ord>=0){ ctx.fillStyle=GLD; ctx.font='600 13px sans-serif'; ctx.fillText('#'+(ord+1), px(i)+22, py(i)-14); }
      }
      // 큐/순서 표시 (하단 예약 영역)
      var ny=botY - txtH + 16;
      ctx.fillStyle='#dfeaf2'; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
      ctx.fillText('STEP '+(s.step+1)+'/'+frames.length+' — '+f.note, gx, ny);
      if(isBFS){ ctx.fillStyle=BLU; ctx.font='12.5px ui-monospace,monospace'; ctx.fillText('큐: ['+(f.q||[]).join(', ')+']', gx, ny+20); }
      ctx.fillStyle=GRN; ctx.font='12.5px ui-monospace,monospace'; ctx.fillText('방문 순서: '+(f.order.length?f.order.join(' → '):'—'), gx, ny+(isBFS?40:20));

      E.tapHint(W/2, H*0.95, '슬라이더=BFS↔DFS · 화면 탭=한 노드씩', true);
      E.big('그래프 탐색 — BFS와 DFS', '정점과 간선으로 이루어진 그래프를 어떻게 빠짐없이 훑을까요? 두 가지 성격이 있습니다. BFS(너비 우선)는 큐를 써서 “시작점에서 가까운 이웃부터 물결처럼” 퍼져 나갑니다 — 최단 경로(간선 수)를 찾을 때 씁니다. DFS(깊이 우선)는 재귀(스택)로 “한 길을 끝까지 파고들다 막히면 되돌아” 옵니다 — 연결 요소·사이클·위상정렬에 씁니다. 같은 그래프라도 방문 순서가 달라지죠. 화면의 방문 순서(#번호)와 큐 내용은 실제로 알고리즘을 돌려 얻은 값입니다.'); }
  },

  // ══════════ 4. 최단경로 — 다익스트라 ══════════
  { id:'cpp16_04',
    enter:function(E){ var self=this; this.s={step:0};
      // 고정 가중그래프 (0=출발). 간선 [u,v,w]
      var edges=[[0,1,4],[0,2,1],[2,1,2],[1,3,1],[2,3,5],[3,4,3],[1,4,7]];
      this.edges=edges;
      this.pos=[[0.10,0.50],[0.40,0.20],[0.40,0.80],[0.72,0.50],[0.94,0.30]];
      var N=5, adj={}; for(var i=0;i<N;i++) adj[i]=[];
      edges.forEach(function(e){ adj[e[0]].push([e[1],e[2]]); adj[e[1]].push([e[0],e[2]]); }); // 무향
      // 다익스트라 프레임 (실제 최단거리 계산 — 골든룰)
      function run(){ var INF=1e9, dist=[], done=[], frames=[];
        for(var i=0;i<N;i++){ dist[i]=INF; done[i]=false; } dist[0]=0;
        frames.push({dist:dist.slice(),done:done.slice(),cur:-1,relax:null,note:'dist[0]=0, 나머지 ∞',line:2});
        for(var it=0;it<N;it++){
          // 미확정 중 dist 최소 정점 선택 (우선순위큐 top)
          var u=-1, best=INF; for(i=0;i<N;i++) if(!done[i]&&dist[i]<best){ best=dist[i]; u=i; }
          if(u<0) break; done[u]=true;
          frames.push({dist:dist.slice(),done:done.slice(),cur:u,relax:null,note:'미확정 중 최소 dist='+dist[u]+' 인 '+u+' 확정',line:5});
          for(var k=0;k<adj[u].length;k++){ var v=adj[u][k][0], w=adj[u][k][1];
            if(!done[v] && dist[u]+w<dist[v]){ var old=dist[v]; dist[v]=dist[u]+w;
              frames.push({dist:dist.slice(),done:done.slice(),cur:u,relax:[u,v],old:old,note:'완화: dist['+v+'] '+(old>=INF?'∞':old)+' → '+dist[u]+'+'+w+' = '+dist[v],line:8}); }
          }
        }
        frames.push({dist:dist.slice(),done:done.slice(),cur:-1,relax:null,note:'모든 최단거리 확정',line:10,fin:true}); return frames;
      }
      this.frames=run();
      E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%this.frames.length; E.blip(360,0.06); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, edges=this.edges, pos=this.pos;
      var f=this.frames[Math.min(s.step,this.frames.length-1)];
      var code=[
        {t:'// 다익스트라 (우선순위큐)', dim:true},
        {t:'vector<int> dist(N,INF); dist[s]=0;', hl:'dist[s]=0'},
        {t:'priority_queue<pair<int,int>> pq;', hl:'priority_queue'},
        {t:'pq.push({0,s});', dim:true},
        {t:'while(!pq.empty()){', hl:'while'},
        {t:'  int u=pq.top().second; pq.pop();', hl:'pq.top'},
        {t:'  if(done[u]) continue; done[u]=1;', hl:'done[u]'},
        {t:'  for(auto[v,w]:adj[u])', hl:'adj[u]'},
        {t:'    if(dist[u]+w<dist[v]){', hl:'dist[u]+w<dist[v]'},
        {t:'      dist[v]=dist[u]+w; pq.push({-dist[v],v});', hl:'dist[v]=dist[u]+w'},
        {t:'    }', dim:true},
        {t:'}', dim:true}
      ];
      codePanel(E, W*0.03, H*0.10, W*0.47, code, 'dijkstra.cpp', f.line);

      var botY=H*0.93;
      // 하단 블록: dist라벨(8) + 표(64) + STEP(18) + 결과(22) ≈ 112px 예약 → 그래프는 그 위로
      var lowH=8+64+18+22;
      var gx=W*0.52, gy=H*0.09, gw=W*0.46;
      var gh=Math.max(96, botY - lowH - gy);
      function px(i){ return gx+pos[i][0]*gw; } function py(i){ return gy+pos[i][1]*gh; }
      // 간선 + 가중치
      edges.forEach(function(e){ var u=e[0],v=e[1],w=e[2];
        var active=f.relax && ((f.relax[0]===u&&f.relax[1]===v)||(f.relax[0]===v&&f.relax[1]===u));
        ctx.strokeStyle=active?GLD:'rgba(122,184,255,0.28)'; ctx.lineWidth=active?3.2:1.4;
        ctx.beginPath(); ctx.moveTo(px(u),py(u)); ctx.lineTo(px(v),py(v)); ctx.stroke();
        var mx=(px(u)+px(v))/2, my=(py(u)+py(v))/2;
        ctx.fillStyle=active?GLD:DIM; ctx.font='600 12px ui-monospace,monospace'; ctx.textAlign='center';
        ctx.fillStyle='#0b1016'; ctx.fillRect(mx-9,my-8,18,16); ctx.fillStyle=active?GLD:DIM; ctx.fillText(w, mx, my+4);
      });
      // 정점 + dist
      for(var i=0;i<5;i++){ var done=f.done[i], cur=(f.cur===i);
        ctx.fillStyle = cur?'rgba(255,210,122,0.9)':(done?'rgba(126,224,176,0.75)':'rgba(120,140,160,0.35)');
        ctx.strokeStyle= cur?'#fff':(done?GRN:'rgba(255,255,255,0.3)'); ctx.lineWidth=cur?2.6:1.6;
        ctx.beginPath(); ctx.arc(px(i),py(i),19,0,7); ctx.fill(); ctx.stroke();
        ctx.fillStyle= cur||done?'#0b1016':'#dfeaf2'; ctx.font='700 14px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(i, px(i),py(i)+1); ctx.textBaseline='alphabetic';
        var d=f.dist[i]; ctx.fillStyle=GLD; ctx.font='600 12px ui-monospace,monospace'; ctx.fillText(d>=1e9?'∞':d, px(i), py(i)-26);
      }
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('노랑 = dist[] (0에서의 최단거리)', gx, gy+gh+8);

      // dist[] 표
      var tabY=gy+gh+20, cw=Math.min(W*0.06,54);
      ctx.fillStyle='#dfeaf2'; ctx.font='600 12.5px sans-serif'; ctx.fillText('dist[] 배열', gx, tabY);
      cell(ctx,gx,tabY+8,44,22,'정점','rgba(90,180,232,0.14)',CPB,CPB,11.5);
      cell(ctx,gx,tabY+30,44,22,'dist','rgba(90,180,232,0.14)',CPB,CPB,11.5);
      for(i=0;i<5;i++){ var d2=f.dist[i], dn=f.done[i];
        cell(ctx,gx+44+i*cw,tabY+8,cw,22,i,'rgba(255,255,255,0.04)','rgba(255,255,255,0.12)','#dfeaf2',12.5);
        cell(ctx,gx+44+i*cw,tabY+30,cw,22, d2>=1e9?'∞':d2, dn?'rgba(126,224,176,0.16)':'rgba(255,255,255,0.04)', dn?GRN:'rgba(255,255,255,0.12)', dn?GRN:'#dfeaf2',13);
      }
      var ny=tabY+66;
      ctx.fillStyle='#dfeaf2'; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
      ctx.fillText('STEP '+(s.step+1)+'/'+this.frames.length+' — '+f.note, gx, ny);
      if(f.fin){ var fin=this.frames[this.frames.length-1].dist;
        ctx.fillStyle=GRN; ctx.font='12.5px ui-monospace,monospace'; ctx.fillText('0→각 정점 최단거리: ['+fin.join(', ')+']', gx, ny+18); }

      E.tapHint(W/2, H*0.95, '화면 탭 = 한 단계 (정점 확정 → 완화)', true);
      E.big('다익스트라 — 가장 짧은 길 찾기', '가중치 있는 그래프에서 출발점 0으로부터 모든 정점까지의 최단거리를 구합니다. 핵심 아이디어는 탐욕: “아직 확정 안 된 정점 중 dist가 가장 작은 것”은 더 줄어들 수 없으니 곧장 확정하고, 그 정점을 거쳐 이웃으로 가는 길이 지금까지보다 짧으면 dist를 갱신(완화, relax)합니다. 우선순위큐가 “가장 가까운 미확정 정점”을 O(log n)에 꺼내 줘 전체 O(E log V). 화면의 dist[] 값·완화·확정 순서는 모두 실제로 코드를 돌려 계산한 최단거리입니다.'); }
  },

  // ══════════ 5. 동적계획법 — 0/1 배낭 ══════════
  { id:'cpp16_05',
    enter:function(E){ var self=this; this.s={step:0};
      // 고정 아이템 (무게, 가치), 용량 W=5
      this.items=[{w:1,v:1,name:'A'},{w:2,v:6,name:'B'},{w:3,v:10,name:'C'},{w:2,v:7,name:'D'}];
      this.CAP=5;
      // DP 표 채우기 프레임 (실제 점화식 — 골든룰)
      function run(){ var items=self.items, CAP=self.CAP, n=items.length, frames=[];
        var dp=[]; for(var i=0;i<=n;i++){ dp[i]=[]; for(var c=0;c<=CAP;c++) dp[i][c]=0; }
        frames.push({dp:dp.map(function(r){return r.slice();}),i:-1,c:-1,note:'표 초기화 (0행/0열 = 0)',line:2});
        for(i=1;i<=n;i++){ var it=items[i-1];
          for(var c=0;c<=CAP;c++){
            if(it.w>c){ dp[i][c]=dp[i-1][c];
              frames.push({dp:dp.map(function(r){return r.slice();}),i:i,c:c,note:'아이템'+it.name+'(w='+it.w+') > '+c+' → 못 담음, 위값 '+dp[i-1][c],line:5}); }
            else { var skip=dp[i-1][c], take=dp[i-1][c-it.w]+it.v; dp[i][c]=Math.max(skip,take);
              frames.push({dp:dp.map(function(r){return r.slice();}),i:i,c:c,note:it.name+': max(뺌 '+skip+', 담음 '+dp[i-1][c-it.w]+'+'+it.v+'='+take+') = '+dp[i][c],line:7,take:take>skip}); }
          }
        }
        frames.push({dp:dp.map(function(r){return r.slice();}),i:n,c:CAP,note:'완성 — 최적 가치 = dp['+n+']['+CAP+'] = '+dp[n][CAP],line:9,fin:true}); return frames;
      }
      this.frames=run();
      E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%this.frames.length; E.blip(360,0.06); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, items=this.items, CAP=this.CAP, n=items.length;
      var f=this.frames[Math.min(s.step,this.frames.length-1)];
      var code=[
        {t:'// 0/1 배낭 — DP 표', dim:true},
        {t:'int dp[N+1][W+1] = {0};', hl:'dp[N+1][W+1]'},
        {t:'for(int i=1;i<=n;++i)', hl:'i<=n'},
        {t:'  for(int c=0;c<=W;++c)', hl:'c<=W'},
        {t:'    if(wt[i]>c)', hl:'wt[i]>c'},
        {t:'      dp[i][c]=dp[i-1][c];', hl:'dp[i-1][c]'},
        {t:'    else dp[i][c]=max(', hl:'max'},
        {t:'      dp[i-1][c], dp[i-1][c-wt[i]]+val[i]);', hl:'+val[i]'},
        {t:'// 답 = dp[n][W]', dim:true},
        {t:'return dp[n][W];', hl:'dp[n][W]'}
      ];
      codePanel(E, W*0.03, H*0.10, W*0.47, code, 'knapsack.cpp', f.line);

      var botY=H*0.93;
      // 아이템 목록
      var ix=W*0.53, iy=H*0.09;
      ctx.fillStyle=CPB; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
      ctx.fillText('아이템 (용량 W='+CAP+')', ix, iy);
      for(var k=0;k<items.length;k++){ var it=items[k], on=(f.i===k+1);
        ctx.fillStyle=on?'rgba(90,180,232,0.18)':'rgba(255,255,255,0.04)'; ctx.strokeStyle=on?CPB:'rgba(255,255,255,0.12)'; ctx.lineWidth=1.2;
        roundRect(ctx,ix+k*88,iy+8,82,38,6); ctx.fill(); ctx.stroke();
        ctx.fillStyle=on?CPB:'#dfeaf2'; ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.fillText(it.name, ix+k*88+41, iy+24);
        ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.fillText('w='+it.w+' v='+it.v, ix+k*88+41, iy+40); }

      // DP 표 — 행 높이 ch를 남는 높이에 맞춰 축소(낮은 창서도 note까지 다 들어오게)
      var tx=W*0.53, ty=iy+64, cw=Math.min(W*0.052,50);
      var noteH=60;                                   // STEP+note+결과 예약
      var ch=Math.max(18, Math.min(26, Math.floor((botY - noteH - ty) / (n+2))));
      ctx.fillStyle='#dfeaf2'; ctx.font='600 12.5px sans-serif'; ctx.textAlign='left'; ctx.fillText('DP 표: dp[아이템 i][용량 c]', tx, ty-6);
      // 헤더 (용량 0..CAP)
      cell(ctx,tx,ty,cw,ch,'i\\c','rgba(90,180,232,0.14)',CPB,CPB,11);
      for(var c=0;c<=CAP;c++) cell(ctx,tx+cw+c*cw,ty,cw,ch,c,'rgba(90,180,232,0.10)',CPB,CPB,12);
      for(var i=0;i<=n;i++){
        var rowLab=(i===0)?'∅':items[i-1].name;
        cell(ctx,tx,ty+ch*(i+1),cw,ch,rowLab,'rgba(90,180,232,0.10)',CPB,CPB,12);
        for(c=0;c<=CAP;c++){
          var cur=(f.i===i && f.c===c), filled=(f.dp[i][c]!==undefined) && (i<f.i || (i===f.i && c<=f.c) || (f.i===n&&f.c===CAP) || (i===0));
          var fill = cur?'rgba(255,210,122,0.30)':(filled?'rgba(126,224,176,0.10)':'rgba(255,255,255,0.03)');
          var stroke = cur?GLD:(filled?'rgba(126,224,176,0.4)':'rgba(255,255,255,0.10)');
          var tcol = cur?GLD:(filled?'#dfeaf2':DIM);
          cell(ctx,tx+cw+c*cw,ty+ch*(i+1),cw,ch, f.dp[i][c], fill, stroke, tcol, 12.5);
        }
      }
      // 화살표: 현재 셀이 참조하는 위/좌상단 셀
      if(f.i>0 && f.c>=0){ var cellX=tx+cw+f.c*cw, cellY=ty+ch*(f.i+1);
        var upX=cellX+cw/2, upY=ty+ch*f.i+ch/2;
        ctx.strokeStyle=BLU; ctx.lineWidth=1.6; ctx.setLineDash([3,2]);
        ctx.beginPath(); ctx.moveTo(cellX+cw/2, cellY); ctx.lineTo(upX, upY+ch/2); ctx.stroke(); ctx.setLineDash([]); }

      var ny=ty+ch*(n+2)+16;
      ctx.fillStyle='#dfeaf2'; ctx.font='600 12.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText('STEP '+(s.step+1)+'/'+this.frames.length, tx, ny);
      ctx.fillStyle=DIM; ctx.font='13.5px sans-serif'; ctx.fillText(f.note, tx, ny+16);
      if(f.fin){ var ans=this.frames[this.frames.length-1].dp[n][CAP];
        ctx.fillStyle=GRN; ctx.font='700 16px sans-serif'; ctx.fillText('최적 가치 = '+ans+' (아이템 C+D: w=5, v=17)', tx, ny+38); }

      E.tapHint(W/2, H*0.95, '화면 탭 = DP 셀 하나씩 채우기', true);
      E.big('동적계획법 — 0/1 배낭', '용량이 정해진 배낭에 아이템을 골라 담아 가치를 최대로 — 각 아이템은 통째로 넣거나 빼거나(0/1)입니다. 무식하게 모든 부분집합을 시도하면 2ⁿ이지만, DP는 작은 문제의 답을 표에 적어 재활용합니다. dp[i][c] = “처음 i개 아이템으로 용량 c를 채운 최대 가치”이고, 각 칸은 딱 두 선택의 max — 이 아이템을 빼거나(위 칸 그대로), 담거나(그만큼 용량을 뺀 이전 답 + 이 가치). 표를 왼쪽 위부터 채워 dp[n][W]가 답입니다. 화면의 모든 셀 값은 실제 점화식으로 계산했고, 최적 가치는 17(C+D)입니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
