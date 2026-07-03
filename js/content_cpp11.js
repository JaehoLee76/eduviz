/* C++ 제11장 — STL 컨테이너 (vector · list/deque · map · set · pair/컨테이너 선택)
   동작(behavior)만. 텍스트=content/cpp11.json. 엔진 js/engine.js 공유. 색: C++=블루(#5ab4e8).
   골든룰: 화면의 컨테이너 상태·용량(capacity)·정렬결과·조회값은 전부 draw에서 실제로 계산(JS로 표준 C++ 동작을 시뮬).
   좌측=진짜 표준 C++ 코드(<vector>,<list>,<map>,<set>) + 줄커서, 우측=컨테이너 내부 상태 실측 시각화. */
(function(){
  var CPB='#5ab4e8', CPD='#8fd0f5', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', PNK='#f4a0c0', DIM='#9b99a3', RED='#f0888a';

  function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function codePanel(E, x, y, w, lines, title, actLine){
    var ctx=E.ctx, lh=16, pad=14, top=y, n=lines.length, ht=n*lh+pad*2+(title?26:0);
    ctx.fillStyle='rgba(255,255,255,0.035)'; ctx.strokeStyle='rgba(90,180,232,0.30)'; ctx.lineWidth=1;
    roundRect(ctx,x,top,w,ht,10); ctx.fill(); ctx.stroke();
    var cy=top+pad+(title?26:0);
    if(title){ ctx.fillStyle=CPB; ctx.font='600 12px sans-serif'; ctx.textAlign='left'; ctx.fillText(title, x+pad, top+pad+12); }
    ctx.font='13px ui-monospace,Menlo,Consolas,monospace'; ctx.textAlign='left';
    for(var i=0;i<n;i++){
      var L=lines[i], t=(typeof L==='string')?L:L.t, hl=(typeof L==='object')?L.hl:null;
      var ty=cy+i*lh+11;
      if(actLine!=null && i===actLine){ ctx.fillStyle='rgba(90,180,232,0.16)'; ctx.fillRect(x+4, cy+i*lh+1, w-8, lh-2); ctx.fillStyle=CPB; ctx.fillRect(x+4, cy+i*lh+1, 3, lh-2); }
      if(hl && t.indexOf(hl)>=0){ var a=t.split(hl), pre=a[0], post=a.slice(1).join(hl);
        ctx.fillStyle=DIM; ctx.fillText(pre, x+pad, ty); var wpre=ctx.measureText(pre).width;
        ctx.fillStyle=CPB; ctx.fillText(hl, x+pad+wpre, ty); var whl=ctx.measureText(hl).width;
        ctx.fillStyle=DIM; ctx.fillText(post, x+pad+wpre+whl, ty);
      } else { ctx.fillStyle=((typeof L==='object'&&L.dim)?DIM:'#dfeaf2'); ctx.fillText(t, x+pad, ty); }
    }
    return top+ht;
  }
  // 값 셀(공용): 배열·노드·표에 재사용
  function vcell(ctx,x,y,w,h,txt,fill,stroke,tcol,fs){
    ctx.fillStyle=fill||'rgba(255,255,255,0.05)'; ctx.fillRect(x,y,w,h);
    ctx.strokeStyle=stroke||'rgba(90,180,232,0.35)'; ctx.lineWidth=1.4; ctx.strokeRect(x,y,w,h);
    if(txt!=null){ ctx.fillStyle=tcol||'#dfeaf2'; ctx.font='600 '+(fs||14)+'px ui-monospace,Menlo,monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(''+txt, x+w/2, y+h/2+1); ctx.textBaseline='alphabetic'; }
  }

  var scenes = [

  // ══════════ 1. vector — 동적 배열 · push_back · capacity 배증 ══════════
  { id:'cpp11_01',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%6; E.blip(360+this.s.step*40,0.07); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // push_back 순서(실제 값). step 0..5 마다 하나씩 추가 → v = [3,1,4,1,5]
      var PUSH=[3,1,4,1,5];
      var k=s.step;                       // 몇 개까지 넣었나 (0..5)
      var vec=PUSH.slice(0,k);            // 현재 원소들 (실제 상태)
      var size=vec.length;
      // capacity 실측: 표준 libstdc++/MSVC처럼 필요할 때마다 2배(초기 0→1→2→4→8). 실제로 재계산.
      var cap=0; for(var t=0;t<size;t++){ if(t+1>cap) cap=(cap===0?1:cap*2); }

      var code=[
        {t:'#include <vector>', hl:'<vector>'},
        {t:'vector<int> v;          // size 0', hl:'vector<int>'},
        {t:'v.push_back(3);', hl:'push_back'},
        {t:'v.push_back(1);', hl:'push_back'},
        {t:'v.push_back(4);', hl:'push_back'},
        {t:'v.push_back(1);', hl:'push_back'},
        {t:'v.push_back(5);', hl:'push_back'},
        {t:'v[2];   v.size();     // 임의접근·크기', hl:'v[2]'},
        {t:'//  v = { '+PUSH.join(' ')+' }', dim:true}
      ];
      // 줄커서: step k → k번째 push_back 줄(1..6=code[2..6]), k=0 → 선언 줄
      var act = (k===0)?1:Math.min(1+k,6);
      codePanel(E, W*0.04, H*0.13, W*0.48, code, 'vector_pushback.cpp', act);

      // 우측: 연속 메모리 슬롯 — cap개 칸, 앞 size개 채움, 뒤는 예약(빈칸)
      var bx=W*0.56, by=H*0.24, cw=Math.min(48, (W*0.40)/Math.max(cap,4)-6), gap=6;
      ctx.fillStyle=CPB; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
      ctx.fillText('연속 메모리 (한 덩어리) — 채운 칸 + 예약 칸', bx, by-14);
      for(var i=0;i<Math.max(cap,1);i++){
        var cx=bx+i*(cw+gap);
        if(i<size){ vcell(ctx,cx,by,cw,42, vec[i], 'rgba(90,180,232,0.16)', CPB, '#dfeaf2', 15); }
        else { vcell(ctx,cx,by,cw,42, '', 'rgba(255,255,255,0.02)', 'rgba(255,255,255,0.14)', DIM, 13);
          ctx.fillStyle=DIM; ctx.font='10px sans-serif'; ctx.textAlign='center'; ctx.fillText('예약', cx+cw/2, by+26); }
        // 인덱스
        if(i<size){ ctx.fillStyle=DIM; ctx.font='11px ui-monospace,monospace'; ctx.textAlign='center'; ctx.fillText('['+i+']', cx+cw/2, by+58); }
      }
      // size/capacity 게이지
      var gy=by+96;
      ctx.textAlign='left';
      ctx.fillStyle='#dfeaf2'; ctx.font='600 15px sans-serif';
      ctx.fillText('size = '+size, bx, gy);
      ctx.fillStyle=GLD; ctx.fillText('capacity = '+cap, bx+140, gy);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
      ctx.fillText('size가 capacity를 넘으면 → 더 큰 메모리로 옮기고 capacity를 2배로.', bx, gy+24);
      // 배증 로그
      var caps=[]; var c2=0; for(t=0;t<size;t++){ if(t+1>c2){ c2=(c2===0?1:c2*2); caps.push(c2); } }
      ctx.fillStyle=GRN; ctx.font='12.5px ui-monospace,monospace';
      ctx.fillText('capacity 이력: '+(caps.length?('0 → '+caps.join(' → ')):'0'), bx, gy+48);
      if(k>=1){ ctx.fillStyle=GLD; ctx.font='12.5px sans-serif';
        ctx.fillText('방금 넣은 값 = '+vec[size-1]+'  ·  v.back()', bx, gy+72); }

      E.tapHint(W/2, H*0.94, '화면 탭 = push_back 한 번 더 (칸이 차면 capacity 2배)', true);
      E.big('vector — 크기가 자라는 배열', 'C 배열은 크기를 미리 못 박아야 했죠. <b>vector</b>는 그 답답함을 풉니다 — <b>push_back()</b>으로 뒤에 값을 얼마든지 붙이면 스스로 커집니다. 비결은 <b>여유분을 미리 잡아 두는 것</b>: 칸(capacity)이 차면 <b>두 배 큰 메모리로 통째로 옮기고</b> 예전 것을 버립니다. 그래서 push_back은 가끔 이사를 하지만 평균적으로는 매우 빠르고(상환 O(1)), 옮기는 사이엔 값이 <b>연속된 한 덩어리</b>로 붙어 있어 <b>v[i] 임의접근이 즉시</b>입니다. 화면의 capacity는 실제로 2배씩 뛰는 걸 세어 보여 줍니다.'); }
  },

  // ══════════ 2. list · deque — 이중연결리스트 (중간 삽입 빠름) vs vector ══════════
  { id:'cpp11_02',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(340+this.s.step*50,0.07); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // list<int> = [10,20,40] → 중간(20과 40 사이)에 30 삽입 → [10,20,30,40]
      var base=[10,20,40];
      var inserted = (s.step>=2);
      var lst = inserted ? [10,20,30,40] : base.slice();
      var insIdx = 2;   // 30이 들어갈 자리

      var code=[
        {t:'#include <list>', hl:'<list>'},
        {t:'list<int> L = {10, 20, 40};', hl:'list<int>'},
        {t:'auto it = L.begin();', hl:'begin'},
        {t:'++it; ++it;        // 40 앞을 가리킴', dim:true},
        {t:'L.insert(it, 30);  // 중간 삽입 O(1)', hl:'insert'},
        {t:'//  → 10  20  30  40', dim:true},
        {t:'// deque<int>: 양끝 삽입/삭제 O(1)', hl:'deque<int>'},
        {t:'dq.push_front(5); dq.push_back(9);', hl:'push_front'}
      ];
      var act=[1,3,4,7][s.step];
      codePanel(E, W*0.04, H*0.13, W*0.48, code, 'list_deque.cpp', act);

      // 우측 상단: list 노드 — 값 상자 + prev/next 화살표
      var ny=H*0.26, nw=Math.min(64,(W*0.42)/lst.length-14), ng=W*0.028, nx0=W*0.56;
      ctx.fillStyle=CPB; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
      ctx.fillText('list = 흩어진 노드들이 서로를 가리킴 (이중연결)', nx0, ny-14);
      for(var i=0;i<lst.length;i++){
        var cx=nx0+i*(nw+ng), isNew=(inserted && i===insIdx);
        var fill = isNew ? 'rgba(126,224,176,0.22)' : 'rgba(90,180,232,0.16)';
        var strk = isNew ? GRN : CPB;
        vcell(ctx,cx,ny,nw,40, lst[i], fill, strk, isNew?GRN:'#dfeaf2', 15);
        // 양방향 화살표
        if(i<lst.length-1){ var ax=cx+nw, bxx=cx+nw+ng;
          ctx.strokeStyle='rgba(143,208,245,0.7)'; ctx.lineWidth=1.6;
          ctx.beginPath(); ctx.moveTo(ax+2, ny+13); ctx.lineTo(bxx-2, ny+13); ctx.stroke();  // next
          ctx.beginPath(); ctx.moveTo(bxx-2, ny+13); ctx.lineTo(bxx-7, ny+9); ctx.moveTo(bxx-2, ny+13); ctx.lineTo(bxx-7, ny+17); ctx.stroke();
          ctx.strokeStyle='rgba(159,153,163,0.6)'; ctx.beginPath(); ctx.moveTo(bxx-2, ny+27); ctx.lineTo(ax+2, ny+27); ctx.stroke();  // prev
          ctx.beginPath(); ctx.moveTo(ax+2, ny+27); ctx.lineTo(ax+7, ny+23); ctx.moveTo(ax+2, ny+27); ctx.lineTo(ax+7, ny+31); ctx.stroke();
        }
        if(isNew){ ctx.fillStyle=GRN; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('새 노드', cx+nw/2, ny+56); }
      }
      // 삽입 설명
      var iy=ny+90;
      ctx.textAlign='left'; ctx.fillStyle='#dfeaf2'; ctx.font='13px sans-serif';
      if(s.step<2){ ctx.fillStyle=GLD; ctx.fillText('중간에 30을 끼우려 합니다. list는 어떻게 할까요?', nx0, iy); }
      else { ctx.fillStyle=GRN; ctx.font='600 13px sans-serif';
        ctx.fillText('앞뒤 노드의 화살표(포인터) 2개만 바꿔 끼웁니다 → O(1)', nx0, iy); }

      // vector와 비교 표 — 우측 열에 배치(좌측 코드패널 침범·하단 잘림 방지)
      var cy2=iy+24, rowh=22, tx0=nx0;
      ctx.fillStyle='#dfeaf2'; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
      ctx.fillText('중간 삽입/삭제:  list vs vector', tx0, cy2);
      var rows=[['','list (연결)','vector (연속)'],
                ['중간 삽입','O(1) 포인터만','O(n) 뒤를 다 밀기'],
                ['임의접근 v[i]','O(n) 따라가기','O(1) 즉시'],
                ['메모리','노드마다 흩어짐','한 덩어리(캐시 유리)']];
      var cwv=[W*0.10,W*0.14,W*0.16];
      for(var r=0;r<rows.length;r++){ var rx=tx0, ryy=cy2+12+r*rowh;
        for(var c=0;c<3;c++){ var head=(r===0), first=(c===0);
          ctx.fillStyle = head?'rgba(90,180,232,0.16)':(first?'rgba(255,255,255,0.03)':'rgba(255,255,255,0.02)');
          ctx.fillRect(rx,ryy,cwv[c],rowh); ctx.strokeStyle='rgba(255,255,255,0.10)'; ctx.lineWidth=1; ctx.strokeRect(rx,ryy,cwv[c],rowh);
          ctx.fillStyle= head?CPB:(c===1?GRN:(c===2&&r===1?RED:'#cfd8e0')); ctx.font=(head||first?'600 ':'')+'12px sans-serif'; ctx.textAlign='left'; ctx.textBaseline='middle';
          ctx.fillText(rows[r][c], rx+8, ryy+rowh/2+1); ctx.textBaseline='alphabetic';
          rx+=cwv[c]; } }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (반복자 이동 → 중간 삽입 → deque)', true);
      E.big('list · deque — 흩어진 노드, 빠른 삽입', '<b>vector</b>는 한 덩어리라 임의접근이 빠르지만, 중간에 값을 끼우려면 <b>뒤를 전부 한 칸씩 밀어야</b> 합니다(O(n)). <b>list</b>는 정반대예요 — 값마다 독립된 <b>노드</b>가 앞뒤 노드를 <b>화살표(포인터)</b>로 가리킵니다. 중간 삽입은 그 화살표 <b>둘만 고쳐 끼우면</b> 끝(O(1)). 대신 n번째 값을 찾으려면 처음부터 따라가야 하죠. <b>deque</b>는 둘의 절충 — 임의접근이 되면서 <b>양끝 push_front/push_back이 모두 O(1)</b>입니다. “중간을 자주 헤집나, 인덱스로 꺼내 쓰나”로 고릅니다.'); }
  },

  // ══════════ 3. map — 키→값 (정렬된 트리) ══════════
  { id:'cpp11_03',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; E.blip(360+this.s.step*40,0.07); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // map<string,int>: 넣은 순서 lee(85)→kim(90)→ahn(77)→park(88). map은 키(사전순) 정렬로 보관.
      var INS=[['lee',85],['kim',90],['ahn',77],['park',88]];
      var have = INS.slice(0, Math.min(s.step, 4));            // step 1..4 = 원소 개수
      // 실제 정렬: 키 사전순 (std::map 내부 = 균형 이진탐색트리, 순회하면 정렬)
      var sorted = have.slice().sort(function(a,b){ return a[0]<b[0]?-1:(a[0]>b[0]?1:0); });

      var code=[
        {t:'#include <map>', hl:'<map>'},
        {t:'map<string,int> score;', hl:'map<string,int>'},
        {t:'score["lee"]  = 85;', hl:'"lee"'},
        {t:'score["kim"]  = 90;', hl:'"kim"'},
        {t:'score["ahn"]  = 77;', hl:'"ahn"'},
        {t:'score["park"] = 88;', hl:'"park"'},
        {t:'score["kim"];        // 조회 → 90', hl:'"kim"'},
        {t:'// 순회하면 키 사전순으로 나옴', dim:true}
      ];
      var act=[1,2,3,4,5][s.step];
      codePanel(E, W*0.04, H*0.13, W*0.48, code, 'map_keyvalue.cpp', act);

      // 우측: 정렬된 키→값 표 (실제 정렬 결과)
      var tx=W*0.56, ty=H*0.24, cwk=W*0.16, cwv=W*0.13, rh=30;
      ctx.fillStyle=CPB; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
      ctx.fillText('map 내부 = 키(사전순)로 정렬 보관', tx, ty-14);
      // 헤더
      vcell(ctx,tx,ty,cwk,rh,'key','rgba(90,180,232,0.16)',CPB,CPB,13);
      vcell(ctx,tx+cwk,ty,cwv,rh,'value','rgba(90,180,232,0.16)',CPB,CPB,13);
      for(var i=0;i<sorted.length;i++){
        var lookedUp = (sorted[i][0]==='kim' && s.step>=5);
        var kf = lookedUp?'rgba(255,210,122,0.22)':'rgba(255,255,255,0.03)';
        vcell(ctx,tx,ty+rh*(i+1),cwk,rh, '"'+sorted[i][0]+'"', kf, lookedUp?GLD:'rgba(90,180,232,0.35)', lookedUp?GLD:'#dfeaf2', 13);
        vcell(ctx,tx+cwk,ty+rh*(i+1),cwv,rh, sorted[i][1], lookedUp?'rgba(126,224,176,0.20)':'rgba(255,255,255,0.03)', lookedUp?GRN:'rgba(90,180,232,0.35)', lookedUp?GRN:'#dfeaf2', 14);
        if(lookedUp){ ctx.fillStyle=GLD; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('← score["kim"] 조회', tx+cwk+cwv+12, ty+rh*(i+1)+rh/2+4); }
      }
      // 정렬 안내 (넣은 순서 vs 저장 순서)
      var oy=ty+rh*(sorted.length+1)+26;
      ctx.textAlign='left';
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
      ctx.fillText('넣은 순서: '+have.map(function(p){return p[0];}).join(' → '), tx, oy);
      ctx.fillStyle=GRN; ctx.font='12.5px sans-serif';
      ctx.fillText('저장 순서: '+sorted.map(function(p){return p[0];}).join(' → ')+'  (항상 사전순)', tx, oy+22);
      if(s.step>=5){ ctx.fillStyle=GLD; ctx.font='12.5px sans-serif';
        ctx.fillText('키로 값을 O(log n)에 바로 찾습니다 — 이름표로 꺼내는 사전.', tx, oy+46); }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (한 쌍씩 넣기 → kim 조회)', true);
      E.big('map — 이름표로 꺼내는 사전', '배열은 <b>0,1,2…</b> 정수 번호로만 값을 찾죠. <b>map</b>은 번호 대신 <b>어떤 키든</b> — 문자열 이름, 날짜, 좌표 — 로 값을 매깁니다. <b>score["kim"] = 90</b>처럼 넣고, 같은 대괄호로 꺼냅니다. 내부는 <b>균형 이진탐색트리</b>라 넣는 순서와 상관없이 <b>키가 항상 사전순으로 정렬</b>돼 있고, 조회·삽입·삭제가 모두 <b>O(log n)</b>입니다. 그래서 순회하면 저절로 정렬된 순서로 나오죠. “무엇으로 값을 찾고 싶은가”가 키가 됩니다.'); }
  },

  // ══════════ 4. set — 중복 없는 정렬 집합 ══════════
  { id:'cpp11_04',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%7; E.blip(360+this.s.step*35,0.07); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // insert 순서(중복 포함): 5,2,8,2,1,8  → set = {1,2,5,8} (중복 무시·정렬)
      var INS=[5,2,8,2,1,8];
      var k=s.step;                    // 0..6: 몇 번 insert 시도했나
      var tried=INS.slice(0,k);
      // 실제 set: 순서대로 넣되 중복은 거름
      var setArr=[];
      for(var t=0;t<tried.length;t++){ if(setArr.indexOf(tried[t])<0) setArr.push(tried[t]); }
      setArr.sort(function(a,b){return a-b;});
      var lastVal = k>0 ? INS[k-1] : null;
      var wasDup = (k>0) && (INS.slice(0,k-1).indexOf(lastVal)>=0);

      var code=[
        {t:'#include <set>', hl:'<set>'},
        {t:'set<int> s;', hl:'set<int>'},
        {t:'s.insert(5);', hl:'insert'},
        {t:'s.insert(2);', hl:'insert'},
        {t:'s.insert(8);', hl:'insert'},
        {t:'s.insert(2);   // 이미 있음 → 무시', hl:'insert'},
        {t:'s.insert(1);', hl:'insert'},
        {t:'s.insert(8);   // 이미 있음 → 무시', hl:'insert'},
        {t:'//  s = { 1  2  5  8 }   (중복X·정렬O)', dim:true}
      ];
      var act = (k===0)?1:Math.min(1+k,7);
      codePanel(E, W*0.04, H*0.11, W*0.48, code, 'set_unique.cpp', act);

      // 우측 상단: 방금 들어온 값 (중복이면 튕겨나감)
      var by=H*0.24, bx=W*0.56;
      ctx.textAlign='left'; ctx.fillStyle=CPB; ctx.font='600 13px sans-serif';
      ctx.fillText('insert 시도 → set은 걸러 담습니다', bx, by-14);
      if(lastVal!=null){
        var col = wasDup ? RED : GRN;
        vcell(ctx,bx,by,44,40, lastVal, wasDup?'rgba(240,136,138,0.18)':'rgba(126,224,176,0.20)', col, col, 16);
        ctx.fillStyle=col; ctx.font='13px sans-serif'; ctx.textAlign='left';
        ctx.fillText(wasDup? ('insert('+lastVal+') → 이미 있음, 버림') : ('insert('+lastVal+') → 새 값, 담음'), bx+58, by+25);
      }
      // set 내용: 정렬된 칸
      var sy=by+72, cw=46, gap=8;
      ctx.fillStyle='#dfeaf2'; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
      ctx.fillText('현재 집합 (정렬 상태 유지):', bx, sy-10);
      for(var i=0;i<setArr.length;i++){
        var cx=bx+i*(cw+gap);
        vcell(ctx,cx,sy,cw,42, setArr[i], 'rgba(90,180,232,0.16)', CPB, '#dfeaf2', 16);
      }
      if(setArr.length===0){ ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.fillText('(비어 있음)', bx, sy+26); }
      // count / 정보
      var iy=sy+72;
      ctx.textAlign='left';
      ctx.fillStyle=GLD; ctx.font='600 14px sans-serif';
      ctx.fillText('원소 수 = '+setArr.length+'  (시도 '+tried.length+'회 중 중복 '+(tried.length-setArr.length)+'개 걸러짐)', bx, iy);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
      ctx.fillText('s.count(x): 있으면 1, 없으면 0  ·  s.find(x)로 위치.', bx, iy+22);
      ctx.fillStyle=GRN; ctx.font='12.5px sans-serif';
      ctx.fillText('삽입·검색·삭제 모두 O(log n) — 내부는 균형 이진탐색트리.', bx, iy+44);

      E.tapHint(W/2, H*0.95, '화면 탭 = insert 한 번 더 (중복은 자동으로 걸러짐)', true);
      E.big('set — 중복 없는 정렬 집합', '“이미 본 것”을 기억하거나 “서로 다른 것만” 모으고 싶을 때가 있죠. <b>set</b>은 정확히 그 자료구조입니다 — <b>같은 값을 두 번 넣으면 조용히 무시</b>하고, 남은 원소는 <b>항상 정렬된 채</b> 보관합니다. map에서 <b>값을 뺀 키만의 컨테이너</b>라고 보면 돼요(내부도 같은 균형 이진탐색트리). 그래서 <b>count(x)</b>로 존재를 O(log n)에 묻고, 순회하면 정렬 순서로 흘러나옵니다. 중복 제거 + 정렬 + 빠른 조회, 이 셋이 필요하면 set입니다.'); }
  },

  // ══════════ 5. pair · 컨테이너 선택 ══════════
  { id:'cpp11_05',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(340+this.s.step*80,0.07); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'#include <utility>   // pair', hl:'pair'},
        {t:'pair<int,string> p = {3, "kim"};', hl:'pair<int,string>'},
        {t:'p.first;   // 3', hl:'.first'},
        {t:'p.second;  // "kim"', hl:'.second'},
        {t:'', dim:true},
        {t:'// map은 사실 pair의 컨테이너', dim:true},
        {t:'for (auto& [key, val] : score) ...', hl:'[key, val]'},
        {t:'// 구조적 바인딩으로 first/second를 풀기', dim:true}
      ];
      var act = s.step===0 ? 1 : 6;
      // step0=pair 해부(코드패널+우측). step1=컨테이너 선택 표(전체폭 → 코드패널 생략, 겹침 방지).
      if(s.step===0) codePanel(E, W*0.04, H*0.13, W*0.48, code, 'pair_choose.cpp', act);

      if(s.step===0){
        // pair 시각화: 한 상자에 두 칸 (first / second)
        var bx=W*0.58, by=H*0.28, w1=70, w2=110, hh=48;
        ctx.fillStyle=CPB; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('pair = 서로 다른 두 값을 한 묶음으로', bx, by-16);
        vcell(ctx,bx,by,w1,hh, 3, 'rgba(90,180,232,0.16)', CPB, '#dfeaf2', 18);
        vcell(ctx,bx+w1,by,w2,hh, '"kim"', 'rgba(126,224,176,0.18)', GRN, '#dfeaf2', 16);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center';
        ctx.fillText('.first (int)', bx+w1/2, by+hh+18);
        ctx.fillText('.second (string)', bx+w1+w2/2, by+hh+18);
        ctx.textAlign='left'; ctx.fillStyle='#cfd8e0'; ctx.font='13px sans-serif';
        ctx.fillText('· make_pair(a,b) 또는 {a,b} 로 만듭니다.', bx, by+hh+56);
        ctx.fillText('· map의 각 원소가 바로 pair<const Key, Value>.', bx, by+hh+80);
        ctx.fillText('· 세 개 이상 묶으려면 tuple, get<0>(t)로 꺼냅니다.', bx, by+hh+104);
      } else {
        // 컨테이너 선택 표 (연산 복잡도) — 코드패널 없이 전체폭 사용(겹침 방지)
        var tx=W*0.045, ty=H*0.15;
        ctx.fillStyle='#eaf4fb'; ctx.font='600 15px sans-serif'; ctx.textAlign='left';
        ctx.fillText('어떤 상황에 어떤 컨테이너? — 연산별 복잡도', tx, ty-8);
        var head=['컨테이너','임의접근 [i]','끝 삽입','중간 삽입','키로 조회','정렬 유지'];
        var rows=[
          ['vector', 'O(1)',  'O(1)*', 'O(n)',    '—',        '아니오'],
          ['deque',  'O(1)',  'O(1)',  'O(n)',    '—',        '아니오'],
          ['list',   'O(n)',  'O(1)',  'O(1)',    '—',        '아니오'],
          ['map',    '—',     '—',     'O(log n)','O(log n)', '예(키순)'],
          ['set',    '—',     '—',     'O(log n)','O(log n)', '예(값순)'],
          ['u_map',  '—',     '—',     'O(1)평균','O(1)평균', '아니오']
        ];
        var cwc=[W*0.135,W*0.155,W*0.13,W*0.155,W*0.155,W*0.155], rh=27, x0=tx, y0=ty+8;
        // 헤더
        var cx=x0;
        for(var c=0;c<head.length;c++){ ctx.fillStyle='rgba(90,180,232,0.16)'; ctx.fillRect(cx,y0,cwc[c],rh); ctx.strokeStyle='rgba(90,180,232,0.35)'; ctx.lineWidth=1; ctx.strokeRect(cx,y0,cwc[c],rh);
          ctx.fillStyle=CPB; ctx.font='600 11.5px sans-serif'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText(head[c], cx+6, y0+rh/2+1); ctx.textBaseline='alphabetic'; cx+=cwc[c]; }
        for(var r=0;r<rows.length;r++){ cx=x0; var ry=y0+rh*(r+1);
          for(c=0;c<head.length;c++){ var first=(c===0); var v=rows[r][c];
            ctx.fillStyle= first?'rgba(255,255,255,0.05)':'rgba(255,255,255,0.02)'; ctx.fillRect(cx,ry,cwc[c],rh);
            ctx.strokeStyle='rgba(255,255,255,0.10)'; ctx.lineWidth=1; ctx.strokeRect(cx,ry,cwc[c],rh);
            var good = /O\(1\)/.test(v), tree=/log/.test(v);
            ctx.fillStyle = first?CPB : (good?GRN : (tree?GLD : (v==='—'?DIM:'#cfd8e0')));
            ctx.font=(first?'600 ':'')+'11.5px ui-monospace,Menlo,monospace'; ctx.textAlign='left'; ctx.textBaseline='middle';
            ctx.fillText(v, cx+6, ry+rh/2+1); ctx.textBaseline='alphabetic'; cx+=cwc[c]; } }
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left';
        ctx.fillText('* vector 끝 삽입은 상환 O(1) (가끔 배증 이사).  u_map = unordered_map(해시).', x0, y0+rh*(rows.length+1)+22);
        ctx.fillStyle='#cfd8e0'; ctx.font='12.5px sans-serif';
        ctx.fillText('인덱스로 자주 꺼내면 vector · 중간을 자주 헤집으면 list · 키로 찾으면 map/set · 순서 상관없이 최속 조회면 unordered_map.', x0, y0+rh*(rows.length+1)+46);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (pair → 컨테이너 선택 표)', true);
      E.big('pair · 어떤 컨테이너를 고를까', '<b>pair</b>는 <b>서로 다른 두 값</b>을 한 묶음으로 든 작은 상자입니다 — <b>.first</b>와 <b>.second</b>로 꺼내죠. map의 각 원소가 바로 <b>pair&lt;key, value&gt;</b>라, 범위 for에서 <b>[key, val]</b>로 풀어 쓸 수 있습니다. STL 컨테이너는 저마다 잘하는 게 달라요: <b>임의접근이 잦으면 vector</b>, <b>중간을 자주 헤집으면 list</b>, <b>키로 찾고 정렬이 필요하면 map/set</b>, <b>순서는 필요 없고 조회만 최고로 빠르면 unordered_map</b>. “어떤 연산을 가장 자주 하는가”가 컨테이너를 정합니다 — 복잡도 표가 그 답을 보여 줍니다.'); }
  },

  // ══════════════════ 심화학습 (branchOf: cpp11_01 · cpp11_03) ══════════════════

  // ─── 심화 1. reserve로 재할당(이사) 방지 (branchOf: cpp11_01) ───
  { id:'cpp11_01_reserve', branchOf:'cpp11_01', ord:1,
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(360,0.06); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var N=8;                                  // push_back 횟수
      // reserve 없이: capacity 0→1→2→4→8, 넘칠 때마다 기존 원소 전부 이사(복사/이동)
      var cap=0, moves=0, movesLog=[], capLog=[];
      for(var t=0;t<N;t++){ if(t+1>cap){ var old=cap; cap=(cap===0?1:cap*2); if(old>0){ moves+=old; movesLog.push(old); } capLog.push(cap); } }
      // reserve(N) 후: 한 덩어리를 미리 확보 → push_back N번 동안 이사 0회
      var resMoves=0;
      var mode=s.step;                          // 0=reserve 없음, 1=reserve(N)

      var code=[
        {t:'vector<int> v;              // cap 0', hl:'vector<int>'},
        {t:'v.reserve('+N+');            // 미리 확보', hl:'reserve'},
        {t:'for(int i=0;i<'+N+';i++)', dim:true},
        {t:'    v.push_back(i);', hl:'push_back'},
        {t:'//  reserve 없으면 cap 0→1→2→4→8', dim:true},
        {t:'//  넘칠 때마다 기존 원소를 전부 이사', dim:true},
        {t:'//  reserve('+N+') 후엔 이사 0회', dim:true}
      ];
      var act = mode===0 ? 3 : 1;
      var codeBot=codePanel(E, W*0.04, H*0.13, W*0.48, code, 'reserve.cpp', act);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText(mode===0?'지금: reserve 없이 push_back '+N+'회':'지금: reserve('+N+') 후 push_back '+N+'회', W*0.055, codeBot+22);

      // 우측: capacity 성장 계단 + 이사 마커
      var bx=W*0.56, by=H*0.24, cw=Math.min(40,(W*0.40)/N-6), gap=6;
      ctx.fillStyle=CPB; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
      ctx.fillText(mode===0?'capacity가 배증할 때마다 전체 이사':'reserve로 처음부터 '+N+'칸 — 이사 없음', bx, by-14);
      // 칸: N개 채움, 배경으로 배증 경계 표시
      for(var i=0;i<N;i++){ var cx=bx+i*(cw+gap);
        vcell(ctx,cx,by,cw,40, i, 'rgba(90,180,232,0.16)', CPB, '#dfeaf2', 13);
        // reserve 없을 때: capacity 경계(1,2,4,8)에서 이사 표시
        if(mode===0){ var boundary=(i===1||i===2||i===4); // 새 capacity로 넘어가기 직전 원소들
        }
      }
      // 배증 경계선(reserve 없을 때만)
      if(mode===0){
        var bnds=[1,2,4]; // 이 인덱스에 도달할 때 이사 발생 (0→1은 이사 0)
        ctx.strokeStyle='rgba(240,136,138,0.7)'; ctx.setLineDash([3,3]); ctx.lineWidth=1.4;
        for(var b=0;b<bnds.length;b++){ var lx=bx+bnds[b]*(cw+gap)-gap/2;
          ctx.beginPath(); ctx.moveTo(lx,by-4); ctx.lineTo(lx,by+52); ctx.stroke();
          ctx.fillStyle=RED; ctx.font='10px sans-serif'; ctx.textAlign='center'; ctx.setLineDash([]);
          ctx.fillText('이사', lx, by+64); ctx.setLineDash([3,3]);
        }
        ctx.setLineDash([]);
      }

      // 이사 횟수 카운터
      var gy=by+90;
      ctx.textAlign='left';
      if(mode===0){
        ctx.fillStyle='#dfeaf2'; ctx.font='600 15px sans-serif';
        ctx.fillText('capacity 이력: 0 → '+capLog.join(' → '), bx, gy);
        ctx.fillStyle=RED; ctx.font='700 18px sans-serif';
        ctx.fillText('원소 이사 총 '+moves+'회', bx, gy+30);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
        ctx.fillText('이사 세부: '+movesLog.map(function(m){return m+'개';}).join(' + ')+' = '+moves, bx, gy+54);
        ctx.fillStyle=DIM;
        ctx.fillText('배증 때마다 이미 있던 원소를 새 메모리로 전부 복사/이동합니다.', bx, gy+76);
      } else {
        ctx.fillStyle='#dfeaf2'; ctx.font='600 15px sans-serif';
        ctx.fillText('capacity: 처음부터 '+N+' (배증 없음)', bx, gy);
        ctx.fillStyle=GRN; ctx.font='700 18px sans-serif';
        ctx.fillText('원소 이사 총 '+resMoves+'회', bx, gy+30);
        ctx.fillStyle=GRN; ctx.font='12.5px sans-serif';
        ctx.fillText('넣을 개수를 알면 reserve로 한 덩어리를 미리 잡아 이사를 없앱니다.', bx, gy+54);
        ctx.fillStyle=GLD; ctx.font='12.5px sans-serif';
        ctx.fillText('절약: '+moves+'회 → 0회  (반복 push_back 전 reserve가 핵심 규칙)', bx, gy+76);
      }

      E.tapHint(W/2, H*0.94, '화면 탭 = reserve 없음 ↔ reserve('+N+')', true);
      E.big('심화 · reserve로 이사를 없애다', 'push_back으로 vector가 자랄 때, 칸(capacity)이 차면 <b>두 배 큰 메모리로 통째로 이사</b>합니다 — 이미 있던 원소를 전부 새 자리로 복사/이동하죠. '+N+'번 push_back하면 capacity가 <b>0→1→2→4→8</b>로 뛰며 <b>이사가 '+moves+'회</b> 일어납니다. 그런데 넣을 개수를 미리 안다면? <b>v.reserve('+N+')</b> 한 줄로 <b>'+N+'칸을 한 덩어리로 먼저 확보</b>하면, 이후 push_back은 남은 칸을 채우기만 하니 <b>이사가 0회</b>입니다. 반복 삽입 앞에 reserve를 두는 것 — 큰 데이터를 다룰 때 성능을 좌우하는 핵심 규칙입니다. 화면의 이사 횟수는 배증 경계를 실제로 세어 계산한 값입니다.'); }
  },

  // ─── 심화 2. 반복자 무효화 (재할당 시 댕글링) (branchOf: cpp11_01) ───
  { id:'cpp11_01_invalidation', branchOf:'cpp11_01', ord:2,
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*30,0.06); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // v={10,20,30} cap 4 → it가 v[1] 가리킴 → push_back 두 번 → cap 초과(4→8) 재할당 → 주소 바뀜
      var base=[10,20,30];
      var step=s.step;                              // 0=반복자 획득, 1=push_back로 재할당, 2=옛 반복자 사용=위험
      var reallocated=(step>=1);
      var oldAddr=0x1000, newAddr=0x2A00;           // 시각용 결정적 주소(실제 계산 아님이나 개념 표식)
      var curAddr = reallocated ? newAddr : oldAddr;
      var vec = reallocated ? [10,20,30,40,50] : base.slice();

      var code=[
        {t:'vector<int> v = {10,20,30};', hl:'vector<int>'},
        {t:'auto it = v.begin() + 1;   // →20', hl:'it'},
        {t:'int* p = &v[1];            // →20', hl:'&v[1]'},
        {t:'v.push_back(40);', hl:'push_back'},
        {t:'v.push_back(50);  // 재할당 발생!', hl:'push_back'},
        {t:'//  v가 새 메모리로 이사 → 주소 바뀜', dim:true},
        {t:'*it;   // 옛 주소 → 댕글링(위험)', hl:'*it'},
        {t:'//  안전: 재할당 뒤 반복자를 다시 얻기', dim:true}
      ];
      var act=[1,4,6][step];
      var codeBot=codePanel(E, W*0.04, H*0.11, W*0.48, code, 'iterator_invalidation.cpp', act);

      var bx=W*0.56, by=H*0.22, cw=42, gap=7;
      // 옛 메모리 블록
      ctx.fillStyle=DIM; ctx.font='600 12.5px ui-monospace,monospace'; ctx.textAlign='left';
      ctx.fillText('옛 메모리 @0x'+oldAddr.toString(16).toUpperCase(), bx, by-12);
      for(var i=0;i<3;i++){ var cx=bx+i*(cw+gap);
        var dead=reallocated;
        vcell(ctx,cx,by,cw,36, base[i], dead?'rgba(120,120,128,0.10)':'rgba(90,180,232,0.16)', dead?'rgba(159,153,163,0.4)':CPB, dead?DIM:'#dfeaf2', 13);
      }
      if(reallocated){ ctx.fillStyle=RED; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('← 버려진(해제된) 메모리', bx+3*(cw+gap)+8, by+22); }
      // it 포인터(항상 옛 주소의 [1]을 가리킴)
      var itx=bx+1*(cw+gap)+cw/2;
      ctx.fillStyle= reallocated?RED:GLD; ctx.beginPath();
      ctx.moveTo(itx, by-6); ctx.lineTo(itx-6, by-18); ctx.lineTo(itx+6, by-18); ctx.closePath(); ctx.fill();
      ctx.font='600 11px ui-monospace,monospace'; ctx.textAlign='center'; ctx.fillText('it', itx, by-22);

      // 새 메모리 블록(재할당 후)
      if(reallocated){
        var ny=by+80;
        ctx.fillStyle=GRN; ctx.font='600 12.5px ui-monospace,monospace'; ctx.textAlign='left';
        ctx.fillText('새 메모리 @0x'+newAddr.toString(16).toUpperCase()+' (v는 여기로 옮겨감)', bx, ny-12);
        for(i=0;i<vec.length;i++){ var cx2=bx+i*(cw+gap);
          vcell(ctx,cx2,ny,cw,36, vec[i], 'rgba(126,224,176,0.16)', GRN, '#dfeaf2', 13);
        }
      }

      // 설명
      var oy = reallocated ? by+140 : by+70;
      ctx.textAlign='left';
      if(step===0){
        ctx.fillStyle=GLD; ctx.font='600 14px sans-serif';
        ctx.fillText('it와 p가 v[1](값 20)을 가리킵니다.', bx, oy);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
        ctx.fillText('지금은 유효 — it도 p도 옛 메모리의 올바른 자리를 봅니다.', bx, oy+24);
      } else if(step===1){
        ctx.fillStyle=RED; ctx.font='600 14px sans-serif';
        ctx.fillText('capacity 초과 → v가 새 메모리로 이사(재할당)!', bx, oy);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
        ctx.fillText('옛 메모리는 해제됩니다. 그런데 it·p는 여전히 옛 주소를 가리키죠.', bx, oy+24);
      } else {
        ctx.fillStyle=RED; ctx.font='700 16px sans-serif';
        ctx.fillText('*it → 댕글링(dangling): 해제된 메모리 접근 = 미정의 동작', bx, oy);
        ctx.fillStyle=GLD; ctx.font='12.5px sans-serif';
        ctx.fillText('핵심 규칙: 재할당을 일으킬 수 있는 연산 뒤엔 반복자·포인터·참조를 다시 얻으세요.', bx, oy+24);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 반복자 획득 → 재할당 → 옛 반복자 사용', true);
      E.big('심화 · 반복자 무효화 — 소리 없는 함정', 'vector의 원소를 가리키는 <b>반복자·포인터·참조</b>는 그 원소가 앉은 <b>메모리 주소</b>를 붙듭니다. 그런데 push_back으로 capacity가 넘치면 vector는 <b>통째로 새 메모리로 이사</b>하고 <b>옛 메모리를 해제</b>합니다 — 원소들의 주소가 전부 바뀌죠. 이때 이사 전에 얻어 둔 <b>it은 여전히 옛(해제된) 주소</b>를 가리킵니다. 이걸 <b>*it</b>로 읽거나 쓰면 <b>댕글링</b> — 이미 없어진 자리를 건드리는 <b>미정의 동작</b>이라 조용히 엉뚱한 값을 주거나 프로그램을 무너뜨립니다. 컴파일러는 잡아 주지 않아요. 규칙은 하나: <b>재할당을 부를 수 있는 연산(push_back·insert·resize) 뒤엔 반복자를 다시 얻는다</b>. reserve로 미리 용량을 잡아 두면 재할당 자체를 막을 수도 있습니다.'); }
  },

  // ─── 심화 3. emplace_back vs push_back (branchOf: cpp11_03) ───
  { id:'cpp11_03_emplace', branchOf:'cpp11_03', ord:1,
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(360+this.s.step*40,0.06); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var mode=s.step;                              // 0=push_back(임시생성→이동/복사), 1=emplace_back(제자리)
      // 단계 카운트(개념적): push_back = 3단계(생성·이동·소멸), emplace_back = 1단계(제자리 생성)
      var pushSteps=3, empSteps=1;

      var code = mode===0 ? [
        {t:'vector<pair<int,string>> v;', hl:'vector<pair'},
        {t:'v.push_back(', hl:'push_back'},
        {t:'   pair<int,string>(3,"kim")', hl:'pair<int,string>(3,"kim")'},
        {t:');', dim:true},
        {t:'//  ① 임시 pair 객체를 밖에서 생성', dim:true},
        {t:'//  ② 컨테이너 안으로 이동/복사', dim:true},
        {t:'//  ③ 임시 객체 소멸', dim:true}
      ] : [
        {t:'vector<pair<int,string>> v;', hl:'vector<pair'},
        {t:'v.emplace_back(3, "kim");', hl:'emplace_back'},
        {t:'', dim:true},
        {t:'//  인자만 넘기면', dim:true},
        {t:'//  ① 컨테이너 안에서 직접 생성', dim:true},
        {t:'//  임시객체·이동·소멸 없음', dim:true},
        {t:'//  → 복사/이동 비용 절감', dim:true}
      ];
      var act = mode===0 ? 1 : 1;
      var codeBot=codePanel(E, W*0.04, H*0.13, W*0.48, code, mode===0?'push_back.cpp':'emplace_back.cpp', act);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText(mode===0?'push_back: 밖에서 만들어 안으로 옮김':'emplace_back: 인자로 안에서 바로 만듦', W*0.055, codeBot+22);

      // 우측: 단계 흐름(임시 상자 → 컨테이너 vs 제자리)
      var bx=W*0.56, by=H*0.24;
      var contX=W*0.80, contY=by+4, contW=W*0.14, contH=44;   // 컨테이너 슬롯
      // 컨테이너 슬롯(공통)
      ctx.fillStyle=CPB; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
      ctx.fillText('컨테이너 v', contX, contY-12);
      if(mode===0){
        // 임시 객체 상자
        ctx.fillStyle=GLD; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('① 임시 pair 생성 (스택 밖)', bx, by-12);
        vcell(ctx,bx,by,60,contH, 3, 'rgba(255,210,122,0.18)', GLD, '#dfeaf2', 15);
        vcell(ctx,bx+60,by,80,contH, '"kim"', 'rgba(255,210,122,0.14)', GLD, '#dfeaf2', 14);
        ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('임시 객체', bx+70, by+contH+16);
        // 이동 화살표 → 컨테이너
        ctx.strokeStyle='rgba(240,136,138,0.8)'; ctx.lineWidth=2;
        var ax0=bx+140, ax1=contX-6;
        ctx.beginPath(); ctx.moveTo(ax0, by+contH/2); ctx.lineTo(ax1, contY+contH/2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ax1, contY+contH/2); ctx.lineTo(ax1-8, contY+contH/2-4); ctx.moveTo(ax1, contY+contH/2); ctx.lineTo(ax1-8, contY+contH/2+4); ctx.stroke();
        ctx.fillStyle=RED; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('② 이동/복사', (ax0+ax1)/2, by-8);
        // 컨테이너 슬롯(이동된 결과)
        vcell(ctx,contX,contY,contW,contH, '(3,kim)', 'rgba(90,180,232,0.16)', CPB, '#dfeaf2', 13);
        ctx.fillStyle=RED; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('③ 임시 소멸', bx+70, by+contH+34);
      } else {
        // 인자만 → 컨테이너 안에서 제자리 생성
        ctx.fillStyle=GRN; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('인자 (3, "kim") 만 전달', bx, by-12);
        vcell(ctx,bx,by,44,contH, 3, 'rgba(255,255,255,0.03)', 'rgba(90,180,232,0.3)', '#dfeaf2', 15);
        vcell(ctx,bx+44,by,80,contH, '"kim"', 'rgba(255,255,255,0.03)', 'rgba(90,180,232,0.3)', '#dfeaf2', 14);
        ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('인자(값 자체)', bx+62, by+contH+16);
        // 화살표 → 컨테이너 안에서 생성
        ctx.strokeStyle='rgba(126,224,176,0.85)'; ctx.lineWidth=2;
        var bx0=bx+124, bx1=contX-6;
        ctx.beginPath(); ctx.moveTo(bx0, by+contH/2); ctx.lineTo(bx1, contY+contH/2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx1, contY+contH/2); ctx.lineTo(bx1-8, contY+contH/2-4); ctx.moveTo(bx1, contY+contH/2); ctx.lineTo(bx1-8, contY+contH/2+4); ctx.stroke();
        ctx.fillStyle=GRN; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('제자리 생성', (bx0+bx1)/2, by-8);
        vcell(ctx,contX,contY,contW,contH, '(3,kim)', 'rgba(126,224,176,0.18)', GRN, '#dfeaf2', 13);
        ctx.fillStyle=GRN; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('바로 여기서 생성', contX+contW/2, contY+contH+16);
      }

      // 단계 수 비교
      var gy=by+110;
      ctx.textAlign='left';
      ctx.fillStyle='#dfeaf2'; ctx.font='600 15px sans-serif';
      ctx.fillText(mode===0?'push_back 단계: 생성 → 이동/복사 → 소멸 = '+pushSteps+'단계':'emplace_back 단계: 제자리 생성 = '+empSteps+'단계', bx, gy);
      ctx.fillStyle= mode===0?RED:GRN; ctx.font='700 16px sans-serif';
      ctx.fillText(mode===0?'객체 연산 '+pushSteps+'회 (임시 생성·소멸 낭비)':'객체 연산 '+empSteps+'회 (임시 없음)', bx, gy+28);
      ctx.fillStyle=GLD; ctx.font='12.5px sans-serif';
      ctx.fillText('절감: '+pushSteps+'단계 → '+empSteps+'단계  (임시객체·이동·소멸 '+(pushSteps-empSteps)+'단계 제거)', bx, gy+52);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
      ctx.fillText('이미 만든 객체를 넣을 땐 push_back, 인자로 새로 만들 땐 emplace_back이 유리합니다.', bx, gy+74);

      E.tapHint(W/2, H*0.95, '화면 탭 = push_back ↔ emplace_back', true);
      E.big('심화 · emplace_back — 제자리에서 만들기', '<b>push_back(pair(3,"kim"))</b>은 세 걸음을 밟습니다 — ① 컨테이너 <b>밖에서 임시 pair를 만들고</b>, ② 그걸 컨테이너 안으로 <b>이동/복사</b>한 뒤, ③ <b>임시 객체를 소멸</b>시키죠. <b>emplace_back(3, "kim")</b>은 값 자체가 아니라 <b>생성에 필요한 인자만</b> 넘깁니다 — 그러면 컨테이너가 <b>자기 안의 자리에서 직접</b> 객체를 만들어, <b>임시 생성·이동·소멸이 통째로 사라집니다</b>. 무거운 객체나 대량 삽입에서 이 절감이 쌓이면 큰 차이가 되죠. 기억할 관용구: <b>이미 만든 객체를 넣을 땐 push_back, 인자로 새로 만들 땐 emplace_back</b>. 화면의 단계 수는 두 방식이 거치는 객체 연산을 세어 보여 줍니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
