/* C++ 제2장 — bool·참조자(&)·참조자와 함수·new/delete·const 참조
   동작(behavior)만. 텍스트=content/cpp2.json. 엔진 js/engine.js 공유. 색: C++=블루(#5ab4e8).
   골든룰: 화면의 모든 값(참조로 바뀐 값·swap 결과·주소식별자·할당 배열)은 draw에서 실제로 계산. */
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
  // 메모리 상자 (변수 셀)
  function cell(ctx,x,y,w,h,col,name,val){
    roundRect(ctx,x,y,w,h,8); ctx.fillStyle='rgba(90,180,232,0.07)'; ctx.fill(); ctx.strokeStyle=col; ctx.lineWidth=1.8; ctx.stroke();
    ctx.fillStyle=col; ctx.font='700 20px ui-monospace,Menlo,monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(''+val, x+w/2, y+h/2+1); ctx.textBaseline='alphabetic';
    if(name){ ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText(name, x+w/2, y+h+16); }
  }

  var scenes = [

  // ══════════ 1. bool ══════════
  { id:'cpp2_01',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*90,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var a=7, b=4;
      // 조건식 실계산
      var cases=[
        {expr:'a > b',   val:(a>b)},
        {expr:'a == b',  val:(a===b)},
        {expr:'a>b && b>0', val:(a>b && b>0)}
      ];
      var c=cases[s.step];
      var code=[
        {t:'#include <iostream>', dim:true},
        {t:'bool flag = true;', hl:'bool'},
        {t:'int a = 7, b = 4;', dim:true},
        {t:'', dim:true},
        {t:'bool r1 = (a > b);       // ?', hl:'bool'},
        {t:'bool r2 = (a == b);      // ?', hl:'bool'},
        {t:'bool r3 = (a>b && b>0);  // ?', hl:'bool'},
        {t:'std::cout << std::boolalpha << r1;', hl:'boolalpha'}
      ];
      var act=[4,5,6][s.step];
      var codeBot=codePanel(E, W*0.04, H*0.15, W*0.50, code, 'bool.cpp', act);

      var bx=W*0.60, cy=Math.max(H*0.11,22);
      ctx.textAlign='left'; ctx.fillStyle=CPD; ctx.font='600 15px sans-serif';
      ctx.fillText('조건식 평가', bx, cy);
      ctx.fillStyle='#e7ecda'; ctx.font='13px ui-monospace,Menlo,monospace';
      ctx.fillText('a = 7,  b = 4', bx, cy+24);
      ctx.font='700 22px ui-monospace,Menlo,monospace'; ctx.fillStyle=CPD;
      ctx.fillText(c.expr, bx, cy+60);
      // 결과 = true/false 칩
      var on=c.val;
      roundRect(ctx, bx, cy+76, 160, 42, 10); ctx.fillStyle= on?'rgba(126,224,176,0.16)':'rgba(240,136,138,0.14)'; ctx.fill();
      ctx.strokeStyle= on?GRN:RED; ctx.lineWidth=2; ctx.stroke();
      ctx.fillStyle= on?GRN:RED; ctx.font='700 22px ui-monospace,Menlo,monospace'; ctx.textAlign='center';
      ctx.fillText(on?'true':'false', bx+80, cy+103);
      ctx.textAlign='left'; ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
      ctx.fillText('내부적으로 true = 1, false = 0 (1바이트).', bx, cy+142);
      ctx.fillText('boolalpha 를 쓰면 1/0 대신 true/false 로 출력됩니다.', bx, cy+162);

      // C 대비 — 코드패널 아래 좌측
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left';
      var footY=Math.min(H*0.93, Math.max(codeBot+22, cy+188));
      ctx.fillText('C에는 bool이 없어 int(0/1)로 대신했지만, C++은 bool·true·false가 정식 키워드입니다.', W*0.05, footY);

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 조건식 (a>b → a==b → 논리곱)', true);
      E.big('bool — 참과 거짓의 자료형', 'C에서는 참/거짓을 int로 흉내 냈습니다 — 0이면 거짓, 그밖은 참. C++은 아예 bool이라는 자료형과 true·false 키워드를 갖췄습니다. 값은 딱 두 가지, 내부적으로는 1과 0이지만 의미가 또렷하죠. 비교 연산(>, ==)과 논리 연산(&&, ||, !)의 결과가 모두 bool입니다. std::boolalpha를 스트림에 끼우면 1/0 대신 true/false로 예쁘게 찍혀 나와, 코드의 뜻이 화면에서도 그대로 읽힙니다.'); }
  },

  // ══════════ 2. 참조자(&) ══════════
  { id:'cpp2_02',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(340+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 실제 값의 변화를 시뮬레이션: x=10, ref=x, ref=99 → x도 99
      var x=10;
      if(s.step>=2) x=99;      // ref = 99; 를 실행하면 원본도 바뀜
      var code=[
        {t:'int x = 10;', hl:'x'},
        {t:'int& ref = x;    // ref 는 x 의 별명', hl:'int&'},
        {t:'', dim:true},
        {t:'ref = 99;        // ref 를 바꾸면...', hl:'ref = 99'},
        {t:'std::cout << x;  // → '+x, dim:true}
      ];
      var act=[0,1,3][s.step];
      codePanel(E, W*0.04, H*0.17, W*0.48, code, 'reference.cpp', act);

      // 우측: 이름 두 개(x, ref)가 한 상자를 가리키는 그림
      var bx=W*0.60, cy=Math.min(H*0.30,H-176), cw=90, ch=64;
      cy=Math.max(cy,30);
      // 상자 (하나의 메모리)
      cell(ctx, bx+70, cy, cw, ch, CPB, null, x);
      // 이름표 x
      ctx.fillStyle=CPD; ctx.font='700 16px ui-monospace,Menlo,monospace'; ctx.textAlign='right'; ctx.fillText('x', bx+2, cy-6);
      ctx.strokeStyle=CPD; ctx.lineWidth=1.6;
      ctx.beginPath(); ctx.moveTo(bx+6, cy-2); ctx.lineTo(bx+70, cy+ch*0.35); ctx.stroke();
      // 이름표 ref (step>=1 부터 등장)
      if(s.step>=1){
        ctx.fillStyle=GLD; ctx.font='700 16px ui-monospace,Menlo,monospace'; ctx.textAlign='left'; ctx.fillText('ref', bx+cw+120, cy-6);
        ctx.strokeStyle=GLD; ctx.lineWidth=1.6;
        ctx.beginPath(); ctx.moveTo(bx+cw+118, cy-2); ctx.lineTo(bx+70+cw, cy+ch*0.35); ctx.stroke();
      }
      // 라벨
      ctx.textAlign='center'; ctx.fillStyle=DIM; ctx.font='12px sans-serif';
      ctx.fillText('하나의 메모리 상자', bx+70+cw/2, cy+ch+22);

      // 설명
      var ty=cy+ch+56;
      ctx.textAlign='left';
      if(s.step===0){ ctx.fillStyle='#e7ecda'; ctx.font='13px sans-serif'; ctx.fillText('int x = 10;  —  값 10을 담은 상자 x 를 만듭니다.', bx, ty); }
      else if(s.step===1){ ctx.fillStyle=GLD; ctx.font='13px sans-serif'; ctx.fillText('int& ref = x;  —  ref 는 새 상자가 아니라 x 의 또 다른 이름(별명).', bx, ty);
        ctx.fillStyle=DIM; ctx.fillText('선언할 때 반드시 대상을 정해야 하고, 이후엔 다른 것을 가리킬 수 없습니다.', bx, ty+22); }
      else { ctx.fillStyle=GRN; ctx.font='600 14px sans-serif'; ctx.fillText('ref = 99;  →  같은 상자를 고쳤으니 x 도 '+x+' !', bx, ty);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText('ref 와 x 는 완전히 같은 변수 — 주소도 값도 언제나 하나입니다.', bx, ty+24); }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (x 선언 → 별명 ref → ref=99 로 원본 변화)', true);
      E.big('참조자(&) — 변수의 별명', 'int& ref = x; 는 새 변수를 만드는 게 아닙니다. x가 사는 바로 그 메모리에 ref라는 두 번째 이름표를 붙이는 것이죠 — 사람으로 치면 "본명"과 "별명"이 한 사람을 가리키는 것과 같습니다. 그래서 ref를 99로 바꾸면 x도 99가 됩니다. 둘은 다른 변수가 아니라 같은 변수니까요. 포인터와 달리 참조자는 선언할 때 반드시 짝을 정해야 하고, 한 번 정하면 다른 대상으로 갈아탈 수 없으며, * 같은 역참조 기호 없이 그냥 이름처럼 씁니다.'); }
  },

  // ══════════ 3. 참조자와 함수 (call-by-reference) ══════════
  { id:'cpp2_03',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(340+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // swap(int&,int&) — 실제로 교환 시뮬레이션. x=3, y=8
      var x=3, y=8;
      if(s.step>=2){ var t=x; x=y; y=t; }   // 교환 완료 상태
      var code=[
        {t:'void swap(int& a, int& b) {', hl:'int&'},
        {t:'    int t = a;', hl:'t = a'},
        {t:'    a = b;', hl:'a = b'},
        {t:'    b = t;', hl:'b = t'},
        {t:'}', dim:true},
        {t:'int x = 3, y = 8;', dim:true},
        {t:'swap(x, y);   // 원본이 바뀜', hl:'swap(x, y)'}
      ];
      var act=[5,6,6][s.step];
      var codeBot=codePanel(E, W*0.04, H*0.15, W*0.50, code, 'swap.cpp', act);

      var bx=W*0.60, cy=Math.max(H*0.12,24);
      ctx.textAlign='left'; ctx.fillStyle=CPD; ctx.font='600 15px sans-serif';
      ctx.fillText(s.step<2 ? 'swap 호출 전' : 'swap 호출 후', bx, cy);

      // x, y 셀
      cell(ctx, bx, cy+16, 80, 60, CPB, 'x', x);
      cell(ctx, bx+130, cy+16, 80, 60, GLD, 'y', y);

      // a, b 는 x, y 의 별명임을 화살표로
      if(s.step>=1){
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center';
        ctx.fillText('a(별명)', bx+40, cy+96);
        ctx.fillText('b(별명)', bx+170, cy+96);
        ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.setLineDash([3,3]); ctx.lineWidth=1.2;
        ctx.beginPath(); ctx.moveTo(bx+40, cy+90); ctx.lineTo(bx+40, cy+78); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx+170, cy+90); ctx.lineTo(bx+170, cy+78); ctx.stroke();
        ctx.setLineDash([]);
      }

      var ty=cy+130;
      ctx.textAlign='left';
      if(s.step===0){ ctx.fillStyle='#e7ecda'; ctx.font='13px sans-serif'; ctx.fillText('x = 3, y = 8 — 두 값을 맞바꾸고 싶습니다.', bx, ty); }
      else if(s.step===1){ ctx.fillStyle=GLD; ctx.font='13px sans-serif'; ctx.fillText('swap(x, y): a는 x의, b는 y의 별명이 됩니다(값 복사 아님).', bx, ty);
        ctx.fillStyle=DIM; ctx.fillText('함수 안에서 a·b를 바꾸면 곧 x·y를 바꾸는 것.', bx, ty+22); }
      else { ctx.fillStyle=GRN; ctx.font='600 15px sans-serif'; ctx.fillText('교환 완료 →  x = '+x+',  y = '+y, bx, ty);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText('call-by-reference 라서 원본이 실제로 바뀌었습니다.', bx, ty+24); }

      // C 대비 (포인터 버전) — 코드패널 아래 좌측
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left';
      var footY=Math.min(H*0.93, Math.max(codeBot+22, ty+52));
      ctx.fillText('C에서는 swap(int* a,int* b) 로 주소를 넘기고 *a 로 역참조했지만, 참조자는 * 없이 간결합니다.', W*0.05, footY);

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (호출 전 → 별명 연결 → 교환 후)', true);
      E.big('참조자와 함수 — 원본을 넘기다', '함수에 값을 그냥 넘기면(call-by-value) 사본이 복사되어, 함수 안에서 아무리 바꿔도 원본은 그대로입니다. 그래서 두 변수를 맞바꾸는 swap이 값 전달로는 불가능했죠. 매개변수를 int& a로 선언하면, a는 넘어온 인자 x의 별명이 됩니다 — 함수 안의 a를 고치는 순간 밖의 x가 고쳐지는 것이죠. C에서는 이걸 포인터(int*)와 역참조(*a)로 힘겹게 했지만, C++의 참조자는 * 하나 없이 마치 지역 변수처럼 자연스럽게 원본을 다룹니다.'); }
  },

  // ══════════ 4. new · delete ══════════
  { id:'cpp2_04',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(340+this.s.step*80,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 결정적 "주소" 식별자 (골든룰: 난수 금지 — 고정)
      var HEAP_ADDR='0x5f8a10';
      var n=4, arr=[10,20,30,40];   // new int[4] 초기화 예
      var code=[
        {t:'int* p = new int(5);   // 힙에 int 하나', hl:'new int(5)'},
        {t:'std::cout << *p;       // → 5', hl:'*p'},
        {t:'delete p;              // 반납', hl:'delete p'},
        {t:'', dim:true},
        {t:'int* arr = new int[4];  // 배열', hl:'new int[4]'},
        {t:'arr[0]=10; arr[1]=20; ...', dim:true},
        {t:'delete[] arr;          // [] 필수', hl:'delete[]'}
      ];
      var act=[0,1,2,4][s.step];
      var codeBot=codePanel(E, W*0.04, H*0.13, W*0.50, code, 'new_delete.cpp', act);

      var bx=W*0.58, topY=Math.max(H*0.07,16);
      ctx.textAlign='left';
      // 스택 영역 (포인터 p)
      ctx.fillStyle=CPD; ctx.font='600 13px sans-serif'; ctx.fillText('스택 (지역변수)', bx, topY);
      var pAlive = s.step<3;   // step3에선 배열로 이동, p는 개념상 이미 소개됨
      // 포인터 셀
      cell(ctx, bx, topY+10, 120, 46, GLD, 'int* p', (s.step>=2 && s.step<3)?'(dangling)':HEAP_ADDR);

      // 힙 영역
      var heapY=topY+98;
      ctx.fillStyle=PNK; ctx.font='600 13px sans-serif'; ctx.fillText('힙 (동적 할당 · new)', bx, heapY-10);

      if(s.step<3){
        // 단일 int 할당
        if(s.step<2){
          // 살아있는 힙 셀
          cell(ctx, bx+40, heapY, 80, 56, CPB, '*p', 5);
          // 화살표 p → 힙
          ctx.strokeStyle='rgba(255,211,122,0.7)'; ctx.lineWidth=1.8;
          ctx.beginPath(); ctx.moveTo(bx+60, topY+56); ctx.lineTo(bx+80, heapY); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(bx+80,heapY); ctx.lineTo(bx+72,heapY-8); ctx.lineTo(bx+82,heapY-6); ctx.closePath(); ctx.fillStyle='rgba(255,211,122,0.7)'; ctx.fill();
          ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
          ctx.fillText(s.step===0?'new int(5) → 힙에 5를 담은 상자, 그 주소를 p 에 저장.':'*p 로 힙의 값을 읽습니다 → 5', bx, heapY+82);
        } else {
          // delete 후: 힙 반납 + p는 dangling
          roundRect(ctx, bx+40, heapY, 80, 56, 8); ctx.fillStyle='rgba(240,136,138,0.10)'; ctx.fill();
          ctx.strokeStyle=RED; ctx.setLineDash([5,4]); ctx.lineWidth=1.6; ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle=RED; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('반납됨', bx+80, heapY+32); ctx.textAlign='left';
          ctx.fillStyle=RED; ctx.font='12.5px sans-serif';
          ctx.fillText('delete p; → 힙 메모리를 OS에 돌려줍니다.', bx, heapY+82);
          ctx.fillStyle=DIM; ctx.fillText('반납 후 p 는 허공을 가리킴(dangling) — 더 쓰면 위험.', bx, heapY+102);
        }
      } else {
        // 배열 할당
        var ux=54;
        for(var i=0;i<n;i++){ cell(ctx, bx+i*ux, heapY, ux-6, 48, CPB, 'arr['+i+']', arr[i]); }
        // p → arr[0]
        ctx.strokeStyle='rgba(255,211,122,0.7)'; ctx.lineWidth=1.8;
        ctx.beginPath(); ctx.moveTo(bx+40, topY+56); ctx.lineTo(bx+22, heapY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx+22,heapY); ctx.lineTo(bx+16,heapY-8); ctx.lineTo(bx+26,heapY-7); ctx.closePath(); ctx.fillStyle='rgba(255,211,122,0.7)'; ctx.fill();
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.textAlign='left';
        ctx.fillText('new int[4] → 연속된 상자 '+n+'칸을 힙에 할당. 합 = '+arr.reduce(function(a,b){return a+b;},0), bx, heapY+74);
        ctx.fillStyle=RED; ctx.fillText('배열은 delete[] arr; 로 반납 — [] 를 빼면 메모리 누수!', bx, heapY+94);
      }

      // 요약 각주 — 코드패널 아래 좌측(패널 침범·하단 잘림 방지)
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left';
      var footY=Math.min(H*0.93, Math.max(codeBot+22, heapY+118));
      ctx.fillText('new 로 얻은 힙 메모리는 스스로 사라지지 않습니다 — 반드시 delete 로 짝을 맞춰 반납.', W*0.05, footY);

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (new → *p 읽기 → delete → 배열)', true);
      E.big('new · delete — 힙 동적 할당', '지역 변수는 스택에 자동으로 생겼다 사라지지만, 크기를 실행 중에야 아는 데이터는 힙에서 직접 빌려 와야 합니다. new int(5)는 힙에 int 상자 하나를 만들고 5로 채운 뒤 그 주소를 포인터 p에 건네줍니다. *p로 그 값을 읽고요. 다 쓰면 delete p;로 반드시 돌려줘야 합니다 — 안 그러면 메모리 누수. 배열은 new int[n]으로 여러 칸을 연속 할당하고, 반납은 반드시 delete[]로 [] 를 붙여야 합니다. C의 malloc/free를 대신하는, 타입을 아는 안전한 할당이죠.'); }
  },

  // ══════════ 5. const 참조 · 참조 vs 포인터 정리 ══════════
  { id:'cpp2_05',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(340+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'int x = 42;', dim:true},
        {t:'const int& r = x;   // 읽기전용 별명', hl:'const int&'},
        {t:'std::cout << r;     // 읽기 OK → 42', hl:'<< r'},
        {t:'// r = 99;          // 컴파일 오류!', hl:'컴파일 오류'},
        {t:'', dim:true},
        {t:'void print(const string& s);', hl:'const string&'},
        {t:'// 큰 객체를 복사 없이·안전하게 전달', dim:true}
      ];
      var act=[1,2,3][s.step];
      var codeBot=codePanel(E, W*0.04, H*0.13, W*0.50, code, 'const_ref.cpp', act);

      var bx=W*0.58, cw=W*0.36, cy=Math.max(H*0.10,20);
      ctx.textAlign='left';
      if(s.step===0){
        ctx.fillStyle=CPD; ctx.font='600 15px sans-serif'; ctx.fillText('const int& r = x;', bx, cy);
        cell(ctx, bx, cy+16, 80, 56, CPB, 'x', 42);
        ctx.fillStyle=GLD; ctx.font='700 15px ui-monospace,Menlo,monospace'; ctx.fillText('r', bx+130, cy+40);
        ctx.strokeStyle=GLD; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(bx+126, cy+36); ctx.lineTo(bx+80, cy+40); ctx.stroke();
        // 자물쇠 표시
        ctx.fillStyle=GRN; ctx.font='20px sans-serif'; ctx.fillText('🔒', bx+130, cy+68);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText('r 은 x 를 가리키되 "읽기만" 허용 — 별명이되 잠긴 별명.', bx, cy+110);
      } else if(s.step===1){
        ctx.fillStyle=GRN; ctx.font='600 15px sans-serif'; ctx.fillText('읽기: std::cout << r;  → 42  (허용)', bx, cy);
        ctx.fillStyle=RED; ctx.fillText('쓰기: r = 99;  → 컴파일 오류 (금지)', bx, cy+34);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
        ctx.fillText('const 참조로는 원본을 훔쳐볼 수만 있고 바꿀 수 없습니다.', bx, cy+66);
        ctx.fillText('그래서 함수가 "이 인자는 절대 안 바꾼다"는 약속을 코드로 새길 수 있죠 —', bx, cy+88);
        ctx.fillText('void print(const string& s) 는 큰 문자열을 복사 없이(빠르게),', bx, cy+110);
        ctx.fillText('실수로 훼손하지 않게(안전하게) 받습니다.', bx, cy+132);
      } else {
        // 참조 vs 포인터 vs const참조 비교표
        ctx.fillStyle='#e7ecda'; ctx.font='600 14px sans-serif'; ctx.fillText('언제 무엇을 쓰나', bx, cy);
        var rows=[
          {k:'값 전달',       col:DIM,  d:'작은 값·원본 보호 필요 없음'},
          {k:'참조 &',        col:GLD,  d:'원본을 바꿔야 할 때(swap 등)'},
          {k:'const 참조',    col:GRN,  d:'큰 객체를 안 바꾸고 빠르게 읽기'},
          {k:'포인터 *',      col:BLU,  d:'재지정·nullptr·동적할당(new)'}
        ];
        for(var i=0;i<rows.length;i++){ var y=cy+22+i*36;
          roundRect(ctx, bx, y, cw, 30, 7); ctx.fillStyle='rgba(255,255,255,0.03)'; ctx.fill();
          ctx.strokeStyle=rows[i].col; ctx.lineWidth=1.3; ctx.stroke();
          ctx.fillStyle=rows[i].col; ctx.font='600 13px ui-monospace,Menlo,monospace'; ctx.textAlign='left'; ctx.fillText(rows[i].k, bx+12, y+20);
          ctx.fillStyle='#dfeaf2'; ctx.font='12px sans-serif'; ctx.fillText(rows[i].d, bx+130, y+20);
        }
        ctx.fillStyle=DIM; ctx.font='13.5px sans-serif';
        ctx.fillText('참조 = 반드시 초기화·재지정 불가·null 없음 / 포인터 = 유연하되 관리 책임 큼.', bx, cy+22+4*36+14);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (잠긴 별명 → 읽기/쓰기 → 참조 vs 포인터)', true);
      E.big('const 참조 — 읽기전용 별명, 그리고 정리', 'const int& r = x; 는 x의 별명이되 "읽기 전용"으로 잠긴 별명입니다. r로 값을 볼 수는 있어도 r = 99처럼 고치려 하면 컴파일러가 막죠. 이게 왜 중요할까요? 함수에 큰 객체(긴 문자열·벡터)를 넘길 때, 값으로 넘기면 통째로 복사돼 느리고, 보통 참조로 넘기면 원본이 훼손될 위험이 있습니다. const 참조는 복사 없이(빠르게) 그리고 원본을 못 바꾸게(안전하게) — 두 마리 토끼를 잡습니다. 참조는 반드시 초기화하고 재지정할 수 없으며 null이 없는 반면, 포인터는 재지정·nullptr·동적 할당까지 다루는 대신 관리 책임이 큽니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
