/* C++ 제1장 — 입출력·함수 오버로딩·디폴트 매개변수·inline·namespace
   동작(behavior)만. 텍스트=content/cpp1.json. 엔진 js/engine.js 공유. 색: C++=블루(#5ab4e8).
   골든룰: 화면의 모든 값(연산결과·선택된 함수·박스 크기·이름공간 구분)은 draw에서 실제로 계산.
   진짜 컴파일 가능한 표준 C++(C++11/17) 코드 + 실계산 결과. */
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

  // 값 상자(변수/스트림 토큰) 헬퍼
  function chip(ctx,x,y,w,h,col,label,fs){
    roundRect(ctx,x,y,w,h,8); ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.fill();
    ctx.strokeStyle=col; ctx.lineWidth=1.6; ctx.stroke();
    ctx.fillStyle=col; ctx.font='600 '+(fs||13)+'px ui-monospace,Menlo,monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(label, x+w/2, y+h/2+1); ctx.textBaseline='alphabetic';
  }

  var scenes = [

  // ══════════ 1. cout · cin · endl ══════════
  { id:'cpp1_01',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(360+this.s.step*90,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 실제 프로그램 의미대로 값 계산
      var n = 7;                    // cin >> n 로 읽었다고 가정한 입력
      var sq = n*n;                 // 프로그램이 출력할 값
      var code=[
        {t:'#include <iostream>', hl:'<iostream>'},
        {t:'int main() {', dim:true},
        {t:'    int n;', dim:true},
        {t:'    std::cin >> n;      // 입력 받기', hl:'std::cin'},
        {t:'    std::cout << "n^2 = "', hl:'std::cout'},
        {t:'             << n * n', hl:'n * n'},
        {t:'             << std::endl;', hl:'std::endl'},
        {t:'    return 0;', dim:true},
        {t:'}', dim:true}
      ];
      // 줄커서: 입력 → cout 시작 → 값 삽입 → endl(줄바꿈/flush)
      var act=[3,4,5,6][s.step];
      var codeBot=codePanel(E, W*0.04, H*0.13, W*0.46, code, 'io.cpp', act);

      // 우측: 입출력 스트림 흐름 (x∈[W*0.54, W*0.97] 안, 위에서부터 조밀하게)
      var bx=W*0.56, cy=Math.max(H*0.10,20);
      ctx.textAlign='left';
      // 입력 흐름 (cin)
      ctx.fillStyle=CPD; ctx.font='600 14px sans-serif'; ctx.fillText('키보드 입력', bx, cy);
      chip(ctx, bx+120, cy-16, 44, 24, GLD, ''+n, 14);
      ctx.strokeStyle='rgba(255,211,122,0.6)'; ctx.lineWidth=1.6;
      ctx.beginPath(); ctx.moveTo(bx+164, cy-4); ctx.lineTo(bx+230, cy-4); ctx.stroke();
      // 화살표 머리
      ctx.beginPath(); ctx.moveTo(bx+230,cy-4); ctx.lineTo(bx+222,cy-9); ctx.lineTo(bx+222,cy+1); ctx.closePath(); ctx.fillStyle='rgba(255,211,122,0.6)'; ctx.fill();
      chip(ctx, bx+236, cy-16, 70, 24, GLD, 'n = '+n, 13);
      ctx.fillStyle=(s.step>=0)?GRN:DIM; ctx.font='11.5px ui-monospace,Menlo,monospace';
      ctx.fillText('std::cin >> n;   // >> 연산자가 n에 값을 채움', bx, cy+28);

      // 출력 스트림 조립 (cout << ... << ...)
      var oy=cy+62;
      ctx.fillStyle=CPD; ctx.font='600 14px sans-serif'; ctx.fillText('std::cout  ( << 로 이어붙이기 )', bx, oy);
      // 조립되는 토큰들 (step 진행에 따라 나타남)
      var toks=[{t:'"n^2 = "',on:s.step>=1},{t:''+sq,on:s.step>=2},{t:'\\n',on:s.step>=3}];
      var tx=bx, ty=oy+14;
      for(var i=0;i<toks.length;i++){ if(!toks[i].on) continue;
        var lab=toks[i].t, wch=ctx.measureText?0:0;
        ctx.font='600 13px ui-monospace,Menlo,monospace'; var wc=ctx.measureText(lab).width+22;
        chip(ctx, tx, ty, wc, 26, (i===2?PNK:(i===1?GRN:CPB)), lab, 13);
        if(i<2 && toks[i+1] && toks[i+1].on){ ctx.fillStyle=DIM; ctx.font='16px sans-serif'; ctx.fillText('<<', tx+wc+4, ty+18); }
        tx += wc + 30;
      }
      // 실제 콘솔 출력
      var conY=oy+58;
      ctx.fillStyle='#e7ecda'; ctx.font='600 12px sans-serif'; ctx.textAlign='left'; ctx.fillText('콘솔 화면', bx, conY-8);
      roundRect(ctx, bx, conY, W*0.34, 48, 8); ctx.fillStyle='rgba(0,0,0,0.35)'; ctx.fill(); ctx.strokeStyle='rgba(90,180,232,0.35)'; ctx.lineWidth=1; ctx.stroke();
      ctx.fillStyle=GRN; ctx.font='15px ui-monospace,Menlo,monospace';
      var line = (s.step>=1?'n^2 = ':'') + (s.step>=2?sq:'') ;
      ctx.fillText(line, bx+12, conY+22);
      if(s.step>=3){ ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.fillText('▮ ← endl 로 줄바꿈+버퍼 비움(flush)', bx+12, conY+40); }

      // C 대비 각주 — 코드패널 아래 좌측(패널 침범·하단 잘림 방지)
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left';
      var footY=Math.min(H*0.93, Math.max(codeBot+22, conY+66));
      ctx.fillText('C의  printf("n^2 = %d\\n", n*n);  →  C++은 << 로 이어붙입니다.', W*0.05, footY);

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (입력 → 출력 조립 → endl)', true);
      E.big('cout · cin · endl — C++의 입출력', '<< 는 "값을 스트림으로 밀어 넣는다"는 뜻입니다. std::cout << "n^2 = " << n*n << std::endl; 한 줄을 왼쪽에서 오른쪽으로 읽으면, 문자열·숫자·줄바꿈이 차례로 화면 스트림에 얹힙니다. C의 printf는 "%d"처럼 형식을 미리 선언해야 하지만, C++의 <<는 자료형을 스스로 알아채므로 %d/%f를 헷갈릴 일이 없습니다. 반대 방향 >> 는 std::cin에서 값을 꺼내 변수에 담고요. endl은 줄바꿈에 더해 버퍼를 즉시 비웁니다.'); }
  },

  // ══════════ 2. 함수 오버로딩 ══════════
  { id:'cpp1_02',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(340+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 세 오버로드 후보와 호출 3가지 — 컴파일러가 인자로 실제 선택
      var overloads=[
        {sig:'add(int, int)',        params:['int','int'],        col:CPB},
        {sig:'add(double, double)',  params:['double','double'],  col:GLD},
        {sig:'add(int, int, int)',   params:['int','int','int'],  col:GRN}
      ];
      // 호출 케이스 (인자 타입 목록) — 실제 값과 결과를 계산
      var calls=[
        {txt:'add(3, 4)',        types:['int','int'],       vals:[3,4],      res:7},
        {txt:'add(2.5, 1.5)',    types:['double','double'], vals:[2.5,1.5],  res:4.0},
        {txt:'add(1, 2, 3)',     types:['int','int','int'], vals:[1,2,3],    res:6}
      ];
      // 오버로드 선택 규칙: 인자 개수·타입이 정확히 일치하는 시그니처
      function pick(types){ for(var i=0;i<overloads.length;i++){ var p=overloads[i].params;
        if(p.length!==types.length) continue; var ok=true; for(var j=0;j<p.length;j++) if(p[j]!==types[j]){ok=false;break;} if(ok) return i; } return -1; }
      var call=calls[s.step], sel=pick(call.types);

      var code=[
        {t:'int    add(int a, int b)         { return a+b; }', hl:'int'},
        {t:'double add(double a, double b)   { return a+b; }', hl:'double'},
        {t:'int    add(int a,int b,int c)    { return a+b+c; }', hl:'int'},
        {t:'', dim:true},
        {t:'add(3, 4);        // ?', dim:true},
        {t:'add(2.5, 1.5);    // ?', dim:true},
        {t:'add(1, 2, 3);     // ?', dim:true}
      ];
      var act=[4,5,6][s.step];
      var codeBot=codePanel(E, W*0.04, H*0.15, W*0.50, code, 'overload.cpp', act);

      // 우측: 호출 → 후보 → 선택된 함수 하이라이트 (x∈[W*0.54,W*0.97], 위에서부터 조밀하게)
      var bx=W*0.58, cw=W*0.36, cy=Math.max(H*0.10,20);
      ctx.textAlign='left'; ctx.fillStyle=CPD; ctx.font='600 15px sans-serif';
      ctx.fillText('호출: ', bx, cy);
      chip(ctx, bx+52, cy-18, 132, 26, GLD, call.txt, 13);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif';
      ctx.fillText('인자 타입 = ('+call.types.join(', ')+')  ·  개수 '+call.types.length, bx, cy+22);

      // 세 후보 카드 — 선택된 것만 진하게
      var oy=cy+40;
      for(var i=0;i<overloads.length;i++){ var y=oy+i*40, on=(i===sel);
        ctx.globalAlpha = on?1:0.34;
        roundRect(ctx, bx, y, cw, 34, 8);
        ctx.fillStyle = on?'rgba(90,180,232,0.14)':'rgba(255,255,255,0.03)'; ctx.fill();
        ctx.strokeStyle = on?overloads[i].col:'rgba(255,255,255,0.14)'; ctx.lineWidth=on?2:1; ctx.stroke();
        ctx.fillStyle=overloads[i].col; ctx.font='600 13px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
        ctx.fillText(overloads[i].sig, bx+14, y+22);
        if(on){ ctx.fillStyle=GRN; ctx.font='600 12px sans-serif'; ctx.textAlign='right'; ctx.fillText('✓ 선택', bx+cw-14, y+22); }
        ctx.globalAlpha=1;
      }
      // 결과
      var ry=oy+3*40+14;
      ctx.textAlign='left'; ctx.fillStyle='#e7ecda'; ctx.font='14px sans-serif';
      ctx.fillText('실행 결과: ', bx, ry);
      ctx.fillStyle=GRN; ctx.font='700 20px ui-monospace,Menlo,monospace';
      ctx.fillText(call.txt.replace(/\)$/,')') + ' = ' + (Number.isInteger(call.res)? call.res : call.res.toFixed(1)), bx+92, ry);

      // 각주 — 코드패널 아래 좌측(패널 침범·하단 잘림 방지)
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left';
      var footY=Math.min(H*0.93, Math.max(codeBot+22, ry+8));
      ctx.fillText('이름은 같아도 매개변수(개수·타입)가 다르면 다른 함수 — 컴파일러가 최적 후보를 고릅니다.', W*0.05, footY);

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 호출 (int,int → double,double → 3개)', true);
      E.big('함수 오버로딩 — 같은 이름, 다른 매개변수', 'C에서는 함수 이름이 곧 신분증이라 add 하나뿐이지만, C++은 매개변수의 개수와 타입까지 이름의 일부로 봅니다(name mangling). 그래서 add(int,int)·add(double,double)·add(int,int,int)가 사이좋게 공존하죠. 호출하는 쪽은 그냥 add(...)라고만 쓰면 됩니다 — 컴파일러가 넘긴 인자를 보고 가장 잘 맞는 후보를 스스로 골라 줍니다. 반환형만 다른 것으로는 오버로딩할 수 없다는 점만 기억하세요. 구분 기준은 오직 매개변수입니다.'); }
  },

  // ══════════ 3. 디폴트 매개변수 ══════════
  { id:'cpp1_03',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(340+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // int box(int w, int h=1, int d=1) → 부피 실계산
      function box(w,h,d){ return w*h*d; }
      var calls=[
        {txt:'box(3)',       w:3, h:1, d:1, given:['3']},
        {txt:'box(3, 4)',    w:3, h:4, d:1, given:['3','4']},
        {txt:'box(3, 4, 2)', w:3, h:4, d:2, given:['3','4','2']}
      ];
      var call=calls[s.step], vol=box(call.w,call.h,call.d);

      var code=[
        {t:'int box(int w, int h = 1, int d = 1) {', hl:'= 1'},
        {t:'    return w * h * d;', hl:'w * h * d'},
        {t:'}', dim:true},
        {t:'', dim:true},
        {t:'box(3);        // h,d 생략', dim:true},
        {t:'box(3, 4);     // d 생략', dim:true},
        {t:'box(3, 4, 2);  // 모두 지정', dim:true}
      ];
      var act=[4,5,6][s.step];
      var codeBot=codePanel(E, W*0.04, H*0.15, W*0.50, code, 'default_args.cpp', act);

      // 우측: 세 인자 슬롯 — 준 값 vs 디폴트 채움 (위에서부터 조밀)
      var bx=W*0.58, cy=Math.max(H*0.10,20);
      ctx.textAlign='left'; ctx.fillStyle=CPD; ctx.font='600 15px sans-serif';
      ctx.fillText('호출: ', bx, cy); chip(ctx, bx+52, cy-18, 132, 26, GLD, call.txt, 13);

      var slots=[{n:'w',v:call.w,def:false},{n:'h',v:call.h,def:call.given.length<2},{n:'d',v:call.d,def:call.given.length<3}];
      var sy=cy+36;
      for(var i=0;i<slots.length;i++){ var y=sy+i*42, sl=slots[i];
        ctx.fillStyle=CPD; ctx.font='600 15px ui-monospace,Menlo,monospace'; ctx.textAlign='left'; ctx.fillText(sl.n+' =', bx, y+22);
        chip(ctx, bx+50, y, 60, 30, sl.def?PNK:GRN, ''+sl.v, 16);
        ctx.fillStyle=sl.def?PNK:GRN; ctx.font='12px sans-serif';
        ctx.fillText(sl.def?'← 디폴트값 자동 채움':'← 호출에서 준 값', bx+124, y+20);
      }
      // 부피 계산 (실측) — 라벨+값 한 줄
      var ry=sy+3*42+18;
      ctx.fillStyle='#e7ecda'; ctx.font='14px sans-serif'; ctx.textAlign='left'; ctx.fillText('부피 = w × h × d :', bx, ry);
      ctx.fillStyle=GRN; ctx.font='700 20px ui-monospace,Menlo,monospace';
      ctx.fillText(call.w+'×'+call.h+'×'+call.d+' = '+vol, bx+128, ry+1);

      // 3D 상자 미리보기 (크기가 값에 비례 — 실계산) — 슬롯 오른쪽 여백에
      var boxX=bx+248, boxY=sy+8, ux=8;
      var bw=call.w*ux, bh=call.h*ux, bd=call.d*ux*0.6;
      ctx.strokeStyle=CPB; ctx.lineWidth=1.6; ctx.fillStyle='rgba(90,180,232,0.10)';
      // 앞면
      ctx.fillRect(boxX, boxY, bw, bh); ctx.strokeRect(boxX, boxY, bw, bh);
      // 윗면/옆면 (깊이)
      ctx.beginPath(); ctx.moveTo(boxX,boxY); ctx.lineTo(boxX+bd,boxY-bd); ctx.lineTo(boxX+bw+bd,boxY-bd); ctx.lineTo(boxX+bw,boxY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(boxX+bw,boxY); ctx.lineTo(boxX+bw+bd,boxY-bd); ctx.lineTo(boxX+bw+bd,boxY+bh-bd); ctx.lineTo(boxX+bw,boxY+bh); ctx.stroke();

      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left';
      var footY=Math.min(H*0.93, Math.max(codeBot+22, ry+14));
      ctx.fillText('디폴트값은 반드시 뒤쪽 매개변수부터 — 앞을 생략하고 뒤만 줄 수는 없습니다.', W*0.05, footY);

      E.tapHint(W/2, H*0.95, '화면 탭 = 인자 개수 늘리기 (box(3) → box(3,4) → box(3,4,2))', true);
      E.big('디폴트 매개변수 — 생략하면 기본값', '매개변수에 = 값을 붙여 두면, 호출할 때 그 인자를 생략해도 됩니다. box(int w, int h=1, int d=1)에서 box(3)이라 부르면 h와 d는 자동으로 1이 채워져 부피 3이 나오죠. 오버로딩을 여러 개 만드는 수고를 한 함수로 줄여 주는 셈입니다. 규칙은 하나 — 디폴트는 뒤에서부터 채워야 합니다. h만 생략하고 d를 주는 건 불가능해요. 인자를 순서대로 나열하는 이상, "여기부터 뒤는 알아서"라는 선을 그으려면 그 선이 오른쪽 끝에 붙어 있어야 하니까요.'); }
  },

  // ══════════ 4. inline 함수 ══════════
  { id:'cpp1_04',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(340+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'#define SQ(x) ((x)*(x))   // 매크로', hl:'#define'},
        {t:'inline int sq(int x){ return x*x; }', hl:'inline'},
        {t:'', dim:true},
        {t:'int a = sq(4);        // 안전', hl:'sq(4)'},
        {t:'int b = SQ(2 + 1);    // 매크로 함정', hl:'SQ(2 + 1)'},
        {t:'int c = SQ(++n);      // 부작용 두 번!', hl:'SQ(++n)'}
      ];
      var act=[3,4,5][s.step];
      var codeBot=codePanel(E, W*0.04, H*0.16, W*0.50, code, 'inline.cpp', act);

      var bx=W*0.58, cy=Math.max(H*0.09,18);
      ctx.textAlign='left';
      if(s.step===0){
        // inline 함수 호출 → 호출부에 코드가 펼쳐짐(인라인화)
        ctx.fillStyle=CPD; ctx.font='600 15px sans-serif'; ctx.fillText('inline int sq(int x){ return x*x; }', bx, cy);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText('int a = sq(4);  →  컴파일러가 호출을 본문으로 펼침', bx, cy+26);
        // 화살표 & 펼쳐진 형태
        chip(ctx, bx, cy+44, 120, 30, CPB, 'sq(4)', 14);
        ctx.strokeStyle='rgba(90,180,232,0.6)'; ctx.lineWidth=1.6;
        ctx.beginPath(); ctx.moveTo(bx+130,cy+59); ctx.lineTo(bx+186,cy+59); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx+186,cy+59); ctx.lineTo(bx+178,cy+54); ctx.lineTo(bx+178,cy+64); ctx.closePath(); ctx.fillStyle='rgba(90,180,232,0.6)'; ctx.fill();
        chip(ctx, bx+196, cy+44, 130, 30, GRN, '4 * 4', 15);
        ctx.fillStyle=GRN; ctx.font='700 22px ui-monospace,Menlo,monospace';
        ctx.fillText('a = 16', bx, cy+120);   // 실계산 4*4
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('함수 호출 비용 없이 그 자리에 코드가 심어집니다 — 매크로만큼 빠르되', bx, cy+150);
        ctx.fillText('타입 검사·괄호를 컴파일러가 지켜 줍니다(안전).', bx, cy+170);
      } else if(s.step===1){
        // SQ(2+1) 매크로 함정: 괄호 없으면 2+1*2+1
        ctx.fillStyle=PNK; ctx.font='600 15px sans-serif'; ctx.fillText('매크로는 "텍스트 그대로" 치환합니다', bx, cy);
        ctx.fillStyle=DIM; ctx.font='13px ui-monospace,Menlo,monospace';
        ctx.fillText('#define SQ(x) ((x)*(x))', bx, cy+26);
        // 이 경우 괄호가 있어 안전 → 하지만 흔한 실수 버전 대비
        // 여기선 괄호 없는 버전과 대비 (교육적)
        ctx.fillStyle='#e7ecda'; ctx.font='13px ui-monospace,Menlo,monospace';
        ctx.fillText('괄호 있는 매크로:  SQ(2+1) → ((2+1)*(2+1)) = ' + ((2+1)*(2+1)), bx, cy+56);
        ctx.fillStyle=RED;
        ctx.fillText('괄호 뺀 매크로 #define SQ(x) x*x :', bx, cy+90);
        ctx.fillText('   SQ(2+1) → 2+1*1+1... 이 아니라 2+1*2+1 = ' + (2+1*2+1), bx, cy+114); // 실계산=5
        ctx.fillStyle=GRN; ctx.font='13px ui-monospace,Menlo,monospace';
        ctx.fillText('inline sq(2+1) → 항상 3*3 = ' + ((2+1)*(2+1)), bx, cy+148);  // 9
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('inline 함수는 인자를 먼저 계산한 값(3)을 넘기므로 이런 함정이 없습니다.', bx, cy+178);
      } else {
        // SQ(++n) 부작용: 매크로는 ++n을 두 번 씀
        var n0=5;
        // 매크로 ((++n)*(++n)) : n=5→6→7, 결과 6*7=42, n=7
        var mMul = 6*7, mN=7;
        // inline sq(++n): ++n 한 번 → n=6, 6*6=36
        var iMul = 6*6, iN=6;
        ctx.fillStyle=RED; ctx.font='600 15px sans-serif'; ctx.fillText('매크로 SQ(++n) — n이 두 번 증가!', bx, cy);
        ctx.fillStyle=DIM; ctx.font='13px ui-monospace,Menlo,monospace';
        ctx.fillText('n = '+n0+' 에서 시작', bx, cy+26);
        ctx.fillStyle=PNK; ctx.font='13px ui-monospace,Menlo,monospace';
        ctx.fillText('SQ(++n) → ((++n)*(++n)) = 6 * 7 = '+mMul+',  n = '+mN, bx, cy+56);
        ctx.fillStyle=GRN;
        ctx.fillText('sq(++n)  → ++n 한 번 → sq(6) = 6 * 6 = '+iMul+',  n = '+iN, bx, cy+90);
        // 비교 막대
        var byv=cy+120;
        ctx.fillStyle=PNK; roundRect(ctx,bx,byv,200,30,6); ctx.fill(); ctx.fillStyle='#10131a'; ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.fillText('매크로: '+mMul+' (n='+mN+') 버그', bx+100, byv+20);
        ctx.fillStyle=GRN; roundRect(ctx,bx,byv+40,200,30,6); ctx.fill(); ctx.fillStyle='#10131a'; ctx.fillText('inline: '+iMul+' (n='+iN+') 정상', bx+100, byv+60);
        ctx.textAlign='left'; ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('inline은 진짜 함수라 인자를 딱 한 번 계산합니다 — 부작용 안전.', bx, byv+96);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (인라인화 → 괄호 함정 → 부작용)', true);
      E.big('inline 함수 — 매크로의 속도, 함수의 안전', '자주 부르는 짧은 함수는 호출 비용이 아깝습니다. C 시절엔 #define 매크로로 그 자리에 코드를 심어 속도를 얻었지만, 매크로는 "글자 그대로" 치환하는 탓에 SQ(2+1)이 2+1*2+1로 어긋나거나, SQ(++n)에서 n이 두 번 증가하는 함정이 있었죠. inline 함수는 컴파일러에게 "이 호출은 본문으로 펼쳐 넣어 줘"라고 부탁하는 것 — 매크로만큼 빠르되, 진짜 함수라 타입을 검사하고 인자를 딱 한 번만 계산합니다. C++에서 매크로 대신 inline을 쓰는 이유입니다.'); }
  },

  // ══════════ 5. namespace ══════════
  { id:'cpp1_05',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(340+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 두 이름공간에 같은 이름 pi / area — 실제 값으로 구분
      var GEO_PI=3.14159, PHY_PI=3.14159265;
      // geo::area(r) = pi*r*r ,  phys::area(v,t) = 0.5*v*t (예: 거리) — 이름은 같지만 다른 의미
      var r=2;
      var geoArea = GEO_PI*r*r;                 // 원 넓이 실계산
      var code=[
        {t:'namespace geo {', hl:'namespace'},
        {t:'    const double pi = 3.14159;', hl:'pi'},
        {t:'    double area(double r){return pi*r*r;}', hl:'area'},
        {t:'}', dim:true},
        {t:'namespace phys {', hl:'namespace'},
        {t:'    const double pi = 3.14159265;', hl:'pi'},
        {t:'}', dim:true},
        {t:'', dim:true},
        {t:'geo::pi;            geo::area(2);', hl:'geo::'},
        {t:'phys::pi;', hl:'phys::'},
        {t:'using namespace geo;  area(2);', hl:'using namespace'}
      ];
      var act=[8,9,10][s.step];
      var codeBot=codePanel(E, W*0.04, H*0.12, W*0.48, code, 'namespace.cpp', act);

      // 우측: 두 이름공간 상자 — 나란히(side-by-side)로 세로 공간 절약
      var bx=W*0.545, cy=Math.max(H*0.07,14), boxW=W*0.195, gap=W*0.015;
      ctx.textAlign='left';
      function nsBox(x,y,name,col,pi,extra){
        roundRect(ctx, x, y, boxW, extra?86:66, 10);
        ctx.fillStyle='rgba(90,180,232,0.06)'; ctx.fill(); ctx.strokeStyle=col; ctx.lineWidth=1.6; ctx.stroke();
        ctx.fillStyle=col; ctx.font='700 13px ui-monospace,Menlo,monospace'; ctx.fillText('namespace '+name, x+12, y+22);
        ctx.fillStyle='#e7ecda'; ctx.font='12.5px ui-monospace,Menlo,monospace';
        ctx.fillText('pi = '+pi, x+12, y+44);
        if(extra){ ctx.fillStyle=DIM; ctx.fillText(extra, x+12, y+64); }
      }
      nsBox(bx, cy, 'geo', CPB, GEO_PI.toFixed(5), 'area(r)=pi·r·r');
      nsBox(bx+boxW+gap, cy, 'phys', GLD, PHY_PI.toFixed(8), null);

      // 접근 결과 (step별) — 상자 아래
      var ry=cy+110;
      ctx.fillStyle='#e7ecda'; ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.fillText('접근 방법', bx, ry);
      ctx.font='13px ui-monospace,Menlo,monospace';
      if(s.step===0){
        ctx.fillStyle=CPB; ctx.fillText('geo::pi = '+GEO_PI, bx, ry+26);
        ctx.fillStyle=GRN; ctx.fillText('geo::area(2) = '+geoArea.toFixed(5)+'  (원 넓이)', bx, ry+50);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('범위 지정 연산자 :: 로 "어느 이름공간의 것"인지 콕 집어 부릅니다.', bx, ry+78);
      } else if(s.step===1){
        ctx.fillStyle=CPB; ctx.fillText('geo::pi  = '+GEO_PI, bx, ry+26);
        ctx.fillStyle=GLD; ctx.fillText('phys::pi = '+PHY_PI, bx, ry+50);
        ctx.fillStyle=PNK; ctx.font='12px sans-serif'; ctx.fillText('같은 이름 pi 지만 값이 다릅니다 — 이름공간이 충돌을 막아 줍니다.', bx, ry+78);
        ctx.fillStyle=RED; ctx.fillText('그냥 pi 라고만 쓰면? → 모호(ambiguous) 컴파일 오류.', bx, ry+98);
      } else {
        ctx.fillStyle=GRN; ctx.fillText('using namespace geo;', bx, ry+26);
        ctx.fillStyle='#e7ecda'; ctx.fillText('이제 area(2) = '+geoArea.toFixed(5)+' — geo:: 생략 가능', bx, ry+50);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('std::cout 를 매번 쓰기 싫어 using namespace std; 를 쓰는 것과 같은 이치.', bx, ry+78);
        ctx.fillText('편하지만 이름 충돌 위험이 생기니 헤더에선 자제합니다.', bx, ry+98);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (:: 접근 → 같은 이름 구분 → using)', true);
      E.big('namespace — 이름 충돌을 막는 울타리', '큰 프로그램에선 서로 다른 라이브러리가 같은 이름을 쓰기 마련입니다 — 두 곳 모두 pi나 area를 정의하면 충돌하죠. namespace는 이름들을 하나의 울타리 안에 묶어, geo::pi와 phys::pi처럼 소속을 붙여 구분하게 합니다. :: 는 "이 이름공간 안의 것"을 콕 집는 범위 지정 연산자예요. using namespace geo; 라고 선언하면 그 뒤로는 geo:: 를 생략할 수 있고, 우리가 std::cout의 std:: 를 매번 쓰지 않으려고 using namespace std; 를 쓰는 것도 정확히 같은 원리입니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
