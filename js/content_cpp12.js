/* C++ 제12장 — STL 알고리즘·람다 (iterator · sort/find · accumulate/for_each/transform · 람다식 · 람다+알고리즘)
   동작(behavior)만. 텍스트=content/cpp12.json. 엔진 js/engine.js 공유. 색: C++=블루(#5ab4e8).
   골든룰: 화면의 정렬결과·합계·변환값·탐색위치·조건개수는 전부 draw에서 실제로 계산(JS로 표준 <algorithm> 동작을 시뮬).
   좌측=진짜 표준 C++ 코드(<algorithm>,<numeric>,람다) + 줄커서, 우측=원소별 연산 결과 실측 시각화. */
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
  function vcell(ctx,x,y,w,h,txt,fill,stroke,tcol,fs){
    ctx.fillStyle=fill||'rgba(255,255,255,0.05)'; ctx.fillRect(x,y,w,h);
    ctx.strokeStyle=stroke||'rgba(90,180,232,0.35)'; ctx.lineWidth=1.4; ctx.strokeRect(x,y,w,h);
    if(txt!=null){ ctx.fillStyle=tcol||'#dfeaf2'; ctx.font='600 '+(fs||14)+'px ui-monospace,Menlo,monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(''+txt, x+w/2, y+h/2+1); ctx.textBaseline='alphabetic'; }
  }
  // 배열을 칸으로 그리기 → 각 칸 x좌표 반환(연결선용)
  function drawArr(ctx, x, y, arr, cw, gap, hiIdx, hiCol){
    var xs=[];
    for(var i=0;i<arr.length;i++){ var cx=x+i*(cw+gap); xs.push(cx);
      var on=(hiIdx!=null && (Array.isArray(hiIdx)?hiIdx.indexOf(i)>=0:hiIdx===i));
      vcell(ctx,cx,y,cw,40, arr[i], on?'rgba(255,210,122,0.22)':'rgba(90,180,232,0.16)', on?(hiCol||GLD):CPB, on?(hiCol||GLD):'#dfeaf2', 15);
    }
    return xs;
  }

  var scenes = [

  // ══════════ 1. iterator(반복자) — begin→end 공통 인터페이스 ══════════
  { id:'cpp12_01',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%6; E.blip(360+this.s.step*35,0.07); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var v=[7,3,9,4,6];                    // 실제 원소
      var pos=s.step;                        // 반복자 위치 0..5 (5=end)
      var atEnd=(pos>=v.length);
      var seen = v.slice(0, Math.min(pos+ (atEnd?0:1), v.length)); // 여기까지 방문(진행 중 현재 원소 포함)
      // sum: 방문한 원소들의 실제 합
      var sumSoFar=0; for(var i=0;i<Math.min(pos,v.length);i++) sumSoFar+=v[i];

      var code=[
        {t:'vector<int> v = {7,3,9,4,6};', hl:'vector<int>'},
        {t:'for (auto it = v.begin();', hl:'begin'},
        {t:'     it != v.end();', hl:'end'},
        {t:'     ++it)', hl:'++it'},
        {t:'    cout << *it << " ";   // 역참조', hl:'*it'},
        {t:'// 같은 문법으로 list·map·set도 순회', dim:true},
        {t:'// C++11: for (int x : v) 로 축약', hl:'for (int x : v)'}
      ];
      var act = atEnd?2:(pos===0?1:4);
      codePanel(E, W*0.04, H*0.13, W*0.48, code, 'iterator_walk.cpp', act);

      // 우측: 배열 + 반복자 화살표(현재 위치)
      var bx=W*0.56, by=H*0.30, cw=48, gap=8;
      ctx.fillStyle=CPB; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
      ctx.fillText('반복자 it — begin()에서 end()까지 한 칸씩', bx, by-16);
      var xs=drawArr(ctx, bx, by, v, cw, gap, atEnd?null:pos, GLD);
      // end 마커(마지막 원소 뒤 가상 위치)
      var endX = bx + v.length*(cw+gap);
      ctx.strokeStyle=DIM; ctx.setLineDash([4,3]); ctx.lineWidth=1.4;
      ctx.strokeRect(endX, by, cw, 40); ctx.setLineDash([]);
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('end()', endX+cw/2, by+24);
      ctx.fillText('(마지막 다음)', endX+cw/2, by+56);
      // begin 라벨
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.fillText('begin()', xs[0]+cw/2, by+56);
      // it 포인터 (삼각형)
      var px = atEnd ? endX+cw/2 : xs[pos]+cw/2;
      ctx.fillStyle= atEnd?RED:GLD; ctx.beginPath();
      ctx.moveTo(px, by-8); ctx.lineTo(px-7, by-22); ctx.lineTo(px+7, by-22); ctx.closePath(); ctx.fill();
      ctx.fillStyle= atEnd?RED:GLD; ctx.font='600 12px ui-monospace,monospace'; ctx.textAlign='center';
      ctx.fillText('it', px, by-28);

      // 출력·상태
      var oy=by+96;
      ctx.textAlign='left';
      if(!atEnd){
        ctx.fillStyle=GLD; ctx.font='600 14px sans-serif';
        ctx.fillText('*it = '+v[pos]+'   ← 지금 가리키는 값', bx, oy);
      } else {
        ctx.fillStyle=RED; ctx.font='600 14px sans-serif';
        ctx.fillText('it == end() → 순회 끝', bx, oy);
      }
      ctx.fillStyle='#dfeaf2'; ctx.font='13px ui-monospace,monospace';
      ctx.fillText('cout: '+v.slice(0,Math.min(pos,v.length)).join(' '), bx, oy+26);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
      ctx.fillText('반복자는 "위치를 가리키는 포인터 같은 것" — 컨테이너가 달라도 begin/end/++/* 인터페이스는 같음.', bx, oy+50);
      ctx.fillStyle=GRN; ctx.font='12.5px sans-serif';
      ctx.fillText('이 공통 인터페이스 덕에 sort·find 같은 알고리즘이 어떤 컨테이너에도 통합니다.', bx, oy+72);

      E.tapHint(W/2, H*0.95, '화면 탭 = 반복자 한 칸 전진 (++it, end까지)', true);
      E.big('iterator — 순회의 공통 언어', 'vector·list·map은 속이 완전히 다른데, 어떻게 같은 <b>for</b> 문으로 훑을까요? 답은 <b>반복자(iterator)</b>입니다 — "지금 이 위치"를 가리키는 <b>포인터 같은 손가락</b>이죠. <b>begin()</b>이 첫 칸, <b>end()</b>가 <b>마지막 바로 다음</b>(빈 표식), <b>++it</b>로 한 칸 나아가고 <b>*it</b>로 그 자리 값을 봅니다. 컨테이너마다 손가락의 실제 동작은 다르지만 <b>인터페이스는 똑같아서</b>, sort·find·accumulate 같은 알고리즘이 컨테이너 종류를 몰라도 <b>begin/end만 받으면</b> 동작합니다. 이것이 STL을 하나로 묶는 접착제입니다.'); }
  },

  // ══════════ 2. sort · find ══════════
  { id:'cpp12_02',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*50,0.07); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var orig=[5,2,8,1,9,3];
      var sorted=orig.slice().sort(function(a,b){return a-b;});     // 실제 오름차순 정렬
      var target=8;
      var idx = sorted.indexOf(target);                             // find가 반환할 위치(정렬본 기준)

      var code=[
        {t:'#include <algorithm>', hl:'<algorithm>'},
        {t:'vector<int> v = {5,2,8,1,9,3};', hl:'vector<int>'},
        {t:'sort(v.begin(), v.end());', hl:'sort'},
        {t:'//  → 1  2  3  5  8  9', dim:true},
        {t:'auto it = find(v.begin(),', hl:'find'},
        {t:'               v.end(), 8);', dim:true},
        {t:'int pos = it - v.begin();', dim:true},
        {t:'//  8은 인덱스 '+idx+' 에 있음', dim:true}
      ];
      var act=[2,2,4][s.step];
      codePanel(E, W*0.04, H*0.13, W*0.48, code, 'sort_find.cpp', act);

      var bx=W*0.55, cw=46, gap=9;
      // 정렬 전
      ctx.fillStyle=DIM; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
      ctx.fillText('정렬 전:', bx, H*0.24-8);
      drawArr(ctx, bx, H*0.24, orig, cw, gap, null);
      // 화살표 아래로
      ctx.fillStyle=CPB; ctx.font='20px sans-serif'; ctx.textAlign='left'; ctx.fillText('↓ sort', bx, H*0.24+66);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('(비교로 오름차순, O(n log n))', bx+70, H*0.24+64);

      if(s.step===0){
        ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('탭하면 정렬 결과가 나타납니다.', bx, H*0.24+108);
      } else {
        // 정렬 후
        var hi = (s.step===2) ? idx : null;
        ctx.fillStyle=GRN; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('정렬 후:', bx, H*0.24+96);
        var xs=drawArr(ctx, bx, H*0.24+104, sorted, cw, gap, hi, GLD);
        // 인덱스
        for(var i=0;i<sorted.length;i++){ ctx.fillStyle=DIM; ctx.font='11px ui-monospace,monospace'; ctx.textAlign='center'; ctx.fillText('['+i+']', xs[i]+cw/2, H*0.24+104+56); }
        if(s.step===2){
          // find 포인터
          var px=xs[idx]+cw/2, ay=H*0.24+104;
          ctx.fillStyle=GLD; ctx.beginPath(); ctx.moveTo(px, ay-6); ctx.lineTo(px-7, ay-20); ctx.lineTo(px+7, ay-20); ctx.closePath(); ctx.fill();
          ctx.fillStyle=GLD; ctx.font='600 12px ui-monospace,monospace'; ctx.textAlign='center'; ctx.fillText('find→8', px, ay-26);
          ctx.fillStyle=GRN; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
          ctx.fillText('find(begin, end, 8) → 인덱스 '+idx+' 의 반복자', bx, H*0.24+190);
          ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
          ctx.fillText('찾지 못하면 end()를 돌려줍니다(== end() 로 판정). 정렬본이면 binary_search로 O(log n).', bx, H*0.24+214);
        } else {
          ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='left';
          ctx.fillText('탭하면 find로 8의 위치를 찾습니다.', bx, H*0.24+190);
        }
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (원본 → sort → find 8)', true);
      E.big('sort · find — 정렬과 탐색, 한 줄로', '직접 버블·퀵정렬을 짤 필요가 없습니다. <b>sort(v.begin(), v.end())</b> 한 줄이면 STL이 <b>O(n log n)</b>의 최적 정렬(보통 introsort)을 돌려 줍니다 — 넘겨준 건 <b>"어디서부터 어디까지"</b>라는 반복자 한 쌍뿐이죠. <b>find(begin, end, x)</b>는 원하는 값을 앞에서부터 훑어 <b>그 위치의 반복자</b>를 돌려주고, 없으면 <b>end()</b>를 줍니다. 반복자 인터페이스 덕에 같은 sort·find가 vector든 배열이든 통하고, 이미 정렬된 데이터라면 <b>binary_search</b>로 O(log n)까지 줄일 수 있습니다.'); }
  },

  // ══════════ 3. accumulate · for_each · transform ══════════
  { id:'cpp12_03',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*50,0.07); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var v=[2,4,6,8,10];
      var sum=0; for(var i=0;i<v.length;i++) sum+=v[i];              // accumulate 실측
      var doubled=v.map(function(x){return x*2;});                   // transform 실측

      var code=[
        {t:'#include <numeric>   // accumulate', hl:'<numeric>'},
        {t:'vector<int> v = {2,4,6,8,10};', hl:'vector<int>'},
        {t:'int total = accumulate(', hl:'accumulate'},
        {t:'    v.begin(), v.end(), 0);', dim:true},
        {t:'//  total = '+sum, dim:true},
        {t:'for_each(v.begin(), v.end(),', hl:'for_each'},
        {t:'    [](int x){ cout << x; });', hl:'[](int x)'},
        {t:'transform(v.begin(), v.end(),', hl:'transform'},
        {t:'  out.begin(), [](int x){return x*2;});', hl:'x*2'}
      ];
      var act=[2,5,7][s.step];
      codePanel(E, W*0.04, H*0.11, W*0.48, code, 'reduce_map.cpp', act);

      var bx=W*0.56, by=H*0.22, cw=44, gap=8;
      ctx.fillStyle=CPB; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
      ctx.fillText('v =', bx, by-8);
      var xs=drawArr(ctx, bx+30, by, v, cw, gap, null);

      if(s.step===0){
        // accumulate: 누적합을 원소마다 표시
        var acc=0, ay=by+80;
        ctx.fillStyle=GLD; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('accumulate — 왼쪽부터 하나씩 더해 접기', bx, ay);
        var run=[];
        for(i=0;i<v.length;i++){ acc+=v[i]; run.push(acc); }
        for(i=0;i<v.length;i++){
          var cx=bx+30+i*(cw+gap);
          ctx.fillStyle=DIM; ctx.font='11px ui-monospace,monospace'; ctx.textAlign='center';
          ctx.fillText('+'+v[i], cx+cw/2, ay+22);
          ctx.fillStyle=GRN; ctx.font='600 13px ui-monospace,monospace';
          ctx.fillText('='+run[i], cx+cw/2, ay+42);
        }
        ctx.fillStyle=GRN; ctx.font='700 20px sans-serif'; ctx.textAlign='left';
        ctx.fillText('total = '+sum, bx, ay+80);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
        ctx.fillText('초깃값 0에서 시작해 원소를 차례로 더합니다. 곱·최대 등 다른 연산도 인자로.', bx, ay+104);
      } else if(s.step===1){
        // for_each: 각 원소에 동작 적용(여기선 출력)
        var fy=by+80;
        ctx.fillStyle=GLD; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('for_each — 각 원소에 같은 동작을 실행', bx, fy);
        ctx.fillStyle='#dfeaf2'; ctx.font='13px ui-monospace,monospace';
        ctx.fillText('cout << x  →  '+v.join(' '), bx, fy+28);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
        ctx.fillText('결과를 만들지 않고 "각 원소마다 무언가 하기"(출력·누적·부수효과)에 씁니다.', bx, fy+54);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
        ctx.fillText('넘기는 [](int x){...} 가 람다 — 다음 장면에서 자세히.', bx, fy+76);
      } else {
        // transform: 원소별 변환 결과 배열
        var ty=by+80;
        ctx.fillStyle=GLD; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('transform — 각 원소를 바꿔 새 배열로 (x → x*2)', bx, ty);
        var ys=drawArr(ctx, bx+30, ty+14, doubled, cw, gap, null);
        // 매핑 화살표
        for(i=0;i<v.length;i++){ var fx=xs[i]+cw/2;
          ctx.strokeStyle='rgba(126,224,176,0.6)'; ctx.lineWidth=1.4;
          ctx.beginPath(); ctx.moveTo(fx, by+40+2); ctx.lineTo(fx, ty+14-2); ctx.stroke();
        }
        ctx.fillStyle=GRN; ctx.font='13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('out = { '+doubled.join(', ')+' }  (원소마다 변환식 적용)', bx, ty+14+62);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
        ctx.fillText('accumulate=접어서 하나로 · transform=하나하나 바꿔 같은 길이로.', bx, ty+14+86);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (accumulate → for_each → transform)', true);
      E.big('accumulate · for_each · transform', '루프를 손으로 짜는 대신, <b>"무엇을 할지"</b>만 알고리즘에 넘깁니다. <b>accumulate</b>는 원소를 왼쪽부터 <b>하나로 접습니다</b> — 초깃값 0에서 시작해 다 더하면 합계(연산을 바꾸면 곱·최대도). <b>for_each</b>는 <b>각 원소마다 같은 동작</b>을 실행하고(출력 같은 부수효과), <b>transform</b>은 <b>원소마다 변환식을 적용해 새 배열</b>을 만듭니다(x→x*2). 함수형의 <b>reduce/map</b>이 바로 이것 — <b>무엇을 하느냐</b>는 <b>람다</b>로 끼워 넣습니다. 그게 다음 장면의 주인공입니다.'); }
  },

  // ══════════ 4. 람다식 — 정렬 기준 · 필터 ══════════
  { id:'cpp12_04',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*50,0.07); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var v=[5,2,8,1,9,3];
      var desc=v.slice().sort(function(a,b){return b-a;});      // 내림차순(람다 a>b)

      var code=[
        {t:'vector<int> v = {5,2,8,1,9,3};', hl:'vector<int>'},
        {t:'auto cmp = [](int a, int b){', hl:'[](int a, int b)'},
        {t:'    return a > b;   // 큰 게 앞', hl:'a > b'},
        {t:'};', dim:true},
        {t:'sort(v.begin(), v.end(), cmp);', hl:'cmp'},
        {t:'//  → 9  8  5  3  2  1  (내림차순)', dim:true},
        {t:'// [capture](params){ body }', hl:'[capture]'},
        {t:'int th = 4;', hl:'th'},
        {t:'auto big = [th](int x){ return x > th; };', hl:'[th]'}
      ];
      var act=[1,4,8][s.step];
      codePanel(E, W*0.04, H*0.11, W*0.48, code, 'lambda.cpp', act);

      var bx=W*0.56;
      if(s.step===0){
        // 람다 해부도
        ctx.fillStyle=CPB; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('람다 = 이름 없는 즉석 함수', bx, H*0.26);
        var ly=H*0.34;
        ctx.font='600 22px ui-monospace,Menlo,monospace';
        var parts=[['[ ]',PNK,'캡처'],['(int a,int b)',CPB,'매개변수'],['{ return a>b; }',GRN,'본문']];
        var px=bx;
        for(var p=0;p<parts.length;p++){ ctx.fillStyle=parts[p][1]; ctx.font='600 20px ui-monospace,monospace'; ctx.fillText(parts[p][0], px, ly);
          var wp=ctx.measureText(parts[p][0]).width;
          ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText(parts[p][2], px+wp/2, ly+24); ctx.textAlign='left';
          px+=wp+16; }
        ctx.fillStyle='#cfd8e0'; ctx.font='13px sans-serif';
        ctx.fillText('· 함수를 따로 정의하지 않고 그 자리에서 만들어 넘깁니다.', bx, ly+64);
        ctx.fillText('· [ ]에 바깥 변수를 담으면(캡처) 본문에서 쓸 수 있습니다.', bx, ly+88);
        ctx.fillText('· auto로 받아 이름을 붙이거나, 알고리즘에 바로 인자로.', bx, ly+112);
      } else if(s.step===1){
        // 내림차순 정렬 결과
        ctx.fillStyle=DIM; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('정렬 전:', bx, H*0.24-6);
        drawArr(ctx, bx, H*0.24, v, 44, 8, null);
        ctx.fillStyle=CPB; ctx.font='18px sans-serif'; ctx.fillText('↓ sort(…, [](a,b){return a>b;})', bx, H*0.24+64);
        ctx.fillStyle=GRN; ctx.font='600 13px sans-serif'; ctx.fillText('정렬 후 (내림차순):', bx, H*0.24+94);
        drawArr(ctx, bx, H*0.24+102, desc, 44, 8, 0, GLD);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.textAlign='left';
        ctx.fillText('람다가 "누가 앞에 오나"의 기준(비교 함수)이 됩니다 — a>b면 큰 값이 앞.', bx, H*0.24+170);
      } else {
        // 필터: x > 4 (th 캡처)
        var th=4;
        var kept=v.filter(function(x){return x>th;});
        ctx.fillStyle=CPB; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('필터 — 람다가 "통과 조건"  (x > '+th+', th는 캡처)', bx, H*0.26);
        var fy=H*0.32;
        var xs=drawArr(ctx, bx, fy, v, 44, 8, null);
        // 통과/탈락 표시
        for(var i=0;i<v.length;i++){ var pass=v[i]>th, cx=xs[i];
          ctx.fillStyle=pass?GRN:RED; ctx.font='600 13px sans-serif'; ctx.textAlign='center';
          ctx.fillText(pass?'✓':'✗', cx+22, fy+58);
        }
        ctx.fillStyle=GRN; ctx.font='600 15px sans-serif'; ctx.textAlign='left';
        ctx.fillText('통과한 값 (x > '+th+'): { '+kept.join(', ')+' }', bx, fy+96);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
        ctx.fillText('[th] 로 바깥 변수 th를 잡아(capture) 조건에 씁니다 — 이게 일반 함수와의 차이.', bx, fy+120);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (람다 구조 → 내림차순 → 필터)', true);
      E.big('람다식 — 그 자리에서 만드는 함수', '정렬 기준이나 필터 조건은 대개 <b>한 줄짜리</b>인데, 그걸 위해 이름 붙은 함수를 따로 정의하긴 번거롭죠. <b>람다</b>는 <b>그 자리에서 즉석으로</b> 함수를 만듭니다: <b>[캡처](매개변수){ 본문 }</b>. <b>[](int a,int b){return a&gt;b;}</b>를 sort의 셋째 인자로 주면 "큰 게 앞"이라는 <b>정렬 기준</b>이 되고, <b>[th](int x){return x&gt;th;}</b>처럼 <b>대괄호에 바깥 변수 th를 담으면(캡처)</b> 본문에서 그 값을 씁니다 — 이 캡처가 일반 함수 포인터와 다른 결정적 힘입니다. "무엇을 하느냐"를 데이터처럼 알고리즘에 끼워 넣는 것이죠.'); }
  },

  // ══════════ 5. 람다 + 알고리즘 조합 — count_if · 커스텀 정렬 ══════════
  { id:'cpp12_05',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*50,0.07); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 이름·점수 쌍 → 점수 내림차순 정렬 + 90 이상 개수
      var people=[['kim',72],['lee',95],['ahn',88],['park',60],['yun',91]];
      var byScore=people.slice().sort(function(a,b){return b[1]-a[1];});   // 점수 내림차순 실측
      var cntHi=people.filter(function(p){return p[1]>=90;}).length;       // count_if 실측

      var code=[
        {t:'vector<pair<string,int>> ranks = {...};', hl:'pair<string,int>'},
        {t:'sort(ranks.begin(), ranks.end(),', hl:'sort'},
        {t:'  [](auto& a, auto& b){', hl:'[](auto& a, auto& b)'},
        {t:'    return a.second > b.second; });', hl:'a.second > b.second'},
        {t:'//  점수 높은 순으로 정렬', dim:true},
        {t:'int n = count_if(ranks.begin(),', hl:'count_if'},
        {t:'  ranks.end(),', dim:true},
        {t:'  [](auto& p){ return p.second >= 90; });', hl:'p.second >= 90'},
        {t:'//  90점 이상 = '+cntHi+' 명', dim:true}
      ];
      var act=[1,1,5][s.step];
      codePanel(E, W*0.04, H*0.11, W*0.48, code, 'lambda_algorithm.cpp', act);

      var bx=W*0.56;
      if(s.step===0){
        // 정렬 전 명단
        ctx.fillStyle=CPB; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('원본 명단 (이름, 점수):', bx, H*0.24-6);
        var ry=H*0.24;
        for(var i=0;i<people.length;i++){ var yy=ry+i*30;
          vcell(ctx,bx,yy,80,26, people[i][0], 'rgba(90,180,232,0.14)', 'rgba(90,180,232,0.3)', '#dfeaf2', 13);
          vcell(ctx,bx+80,yy,60,26, people[i][1], 'rgba(255,255,255,0.03)', 'rgba(90,180,232,0.3)', '#dfeaf2', 14);
        }
        ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.fillText('탭하면 점수 내림차순으로 정렬합니다.', bx, ry+people.length*30+24);
      } else if(s.step===1){
        // 점수 내림차순 정렬 결과 (막대)
        ctx.fillStyle=GRN; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('람다 기준 정렬: a.second > b.second (점수 높은 순)', bx, H*0.24-6);
        var ry=H*0.26, maxS=100, bw=W*0.30;
        for(var i=0;i<byScore.length;i++){ var yy=ry+i*34;
          ctx.fillStyle='#dfeaf2'; ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.fillText((i+1)+'. '+byScore[i][0], bx, yy+16);
          var barx=bx+80, bl=bw*byScore[i][1]/maxS;
          ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(barx, yy+3, bw, 18);
          ctx.fillStyle= byScore[i][1]>=90?GRN:CPB; ctx.fillRect(barx, yy+3, bl, 18);
          ctx.fillStyle='#dfeaf2'; ctx.font='600 12px ui-monospace,monospace'; ctx.fillText(byScore[i][1], barx+bl+8, yy+17);
        }
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.textAlign='left';
        ctx.fillText('pair의 .second(점수)로 비교 — 같은 sort에 람다만 갈아 끼우면 기준이 바뀝니다.', bx, ry+byScore.length*34+16);
      } else {
        // count_if 결과
        ctx.fillStyle=GRN; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('count_if: 조건(p.second >= 90)을 만족하는 개수', bx, H*0.24-6);
        var ry=H*0.26;
        for(var i=0;i<byScore.length;i++){ var yy=ry+i*32, hi=byScore[i][1]>=90;
          vcell(ctx,bx,yy,80,28, byScore[i][0], hi?'rgba(126,224,176,0.20)':'rgba(255,255,255,0.03)', hi?GRN:'rgba(90,180,232,0.3)', '#dfeaf2', 13);
          vcell(ctx,bx+80,yy,60,28, byScore[i][1], hi?'rgba(126,224,176,0.14)':'rgba(255,255,255,0.03)', hi?GRN:'rgba(90,180,232,0.3)', hi?GRN:'#dfeaf2', 14);
          if(hi){ ctx.fillStyle=GRN; ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.fillText('✓ ≥90', bx+150, yy+19); }
        }
        ctx.fillStyle=GLD; ctx.font='700 22px sans-serif'; ctx.textAlign='left';
        ctx.fillText('count_if → '+cntHi+' 명', bx, ry+byScore.length*32+30);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
        ctx.fillText('조건 람다 하나로 세기·거르기·찾기(find_if)·나누기(partition)까지 재사용.', bx, ry+byScore.length*32+54);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (명단 → 점수순 정렬 → 90↑ 세기)', true);
      E.big('람다 + 알고리즘 — 진짜 힘은 조합', '람다와 STL 알고리즘이 만나면 <b>선언적 데이터 처리</b>가 됩니다 — 루프·인덱스·임시변수 없이 <b>"무엇을"</b>만 말하죠. <b>sort(begin, end, [](a,b){return a.second&gt;b.second;})</b>는 <b>pair의 점수로 내림차순</b>, <b>count_if(begin, end, [](p){return p.second&gt;=90;})</b>는 <b>조건을 만족하는 개수</b>를 셉니다. 같은 알고리즘에 <b>람다만 갈아 끼우면</b> 기준·조건이 통째로 바뀌고, 같은 조건 람다를 <b>find_if·copy_if·partition</b>에 재사용할 수 있습니다. C++가 저수준 언어이면서도 <b>파이썬처럼 간결한 데이터 처리</b>를 쓰는 비결 — 이게 모던 STL 스타일입니다. 화면의 정렬 순서·개수는 모두 실제로 계산한 값입니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
