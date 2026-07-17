/* C++ 제10장 — 템플릿: 함수 템플릿(maxOf) · 클래스 템플릿(Stack) · 특수화(Stack<bool>) · 비타입 인자(Array<T,N>) · 인스턴스화·STL 예고
   동작(behavior)만. 텍스트=content/cpp10.json. 엔진 js/engine.js 공유. 색: C++=파랑(#5ab4e8).
   골든룰: 화면의 모든 비교 결과·스택 push/pop 상태·비트 팩킹·배열 인덱싱·인스턴스화 목록은 draw에서 실제로 계산(가짜·난수 금지). 진짜 표준 C++. */
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

  var scenes = [

  // ══════════ 1. 함수 템플릿 — template<typename T> T maxOf(T,T) ══════════
  { id:'cpp10_01',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*80,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 실제 비교 계산
      var cases=[
        {T:'int',    a:3,       b:7,       fmt:function(v){return ''+v;},  cmp:function(a,b){return b>a;}},
        {T:'double', a:2.5,     b:1.4,     fmt:function(v){return v.toFixed(1);}, cmp:function(a,b){return b>a;}},
        {T:'string', a:'"apple"', b:'"pear"', fmt:function(v){return v;}, cmp:function(a,b){return a<b;} } // 사전순 "pear">"apple"
      ];
      var cur=cases[s.step];
      // maxOf 실측
      var mx;
      if(s.step<2) mx = (cur.b>cur.a) ? cur.b : cur.a;
      else mx = ('apple'<'pear') ? '"pear"' : '"apple"'; // 사전순 실제 비교

      var code=[
        {t:'template <typename T>', hl:'typename T'},
        {t:'T maxOf(T a, T b) {', hl:'T maxOf(T a, T b)'},
        {t:'  return (a > b) ? a : b;', hl:'a > b'},
        {t:'}', dim:true},
        {t:'', dim:true},
        {t:'maxOf('+cur.a+', '+cur.b+');   // T = '+cur.T, hl:'maxOf('+cur.a+', '+cur.b+')'}
      ];
      codePanel(E, W*0.04, H*0.14, W*0.48, code, 'function_template.cpp', 5);

      // 우측: 하나의 틀(T)에서 세 타입이 나오는 그림
      var px=W*0.58, py=H*0.20;
      ctx.textAlign='left'; ctx.fillStyle=CPB; ctx.font='600 14px sans-serif';
      ctx.fillText('틀 하나(T)로 모든 타입 처리', px, py);

      // 세 케이스 카드(현재 것 강조)
      var cy=py+18, ch=64, cw=W*0.36;
      for(var k=0;k<3;k++){
        var C=cases[k], on=(k===s.step), y=cy+k*(ch+10);
        ctx.strokeStyle= on?CPB:'rgba(255,255,255,0.14)'; ctx.lineWidth= on?2.2:1;
        ctx.fillStyle= on?'rgba(90,180,232,0.10)':'rgba(255,255,255,0.03)';
        roundRect(ctx,px,y,cw,ch,10); ctx.fill(); ctx.stroke();
        // 라벨: T = int
        ctx.fillStyle= on?CPB:DIM; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('T = '+C.T, px+14, y+22);
        // 계산 표시
        var cmx;
        if(k<2) cmx = (C.b>C.a)?C.b:C.a;
        else cmx = ('apple'<'pear')?'"pear"':'"apple"';
        ctx.fillStyle= on?'#dfeaf2':DIM; ctx.font='14px ui-monospace,Menlo,monospace';
        ctx.fillText('maxOf('+(k<2?C.fmt(C.a):C.a)+', '+(k<2?C.fmt(C.b):C.b)+')', px+14, y+44);
        // 결과
        ctx.fillStyle= on?GRN:DIM; ctx.font='700 16px ui-monospace,Menlo,monospace'; ctx.textAlign='right';
        ctx.fillText('→ '+(k<2?C.fmt(cmx):cmx), px+cw-14, y+40);
        ctx.textAlign='left';
      }

      var lpx=W*0.05, lpy=H*0.84;
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText('문자열은 사전순으로 비교됩니다: "apple" < "pear" → 큰 쪽은 "pear".', lpx, lpy);
      ctx.fillStyle=CPB; ctx.fillText('같은 코드 한 벌로 int·double·string 어디에나 통합니다.', lpx, lpy+20);

      E.tapHint(W/2, H*0.94, '화면 탭 = 다음 (int → double → string)', true);
      E.big('함수 템플릿 — 타입을 매개변수로', '두 값 중 큰 것을 고르는 max 함수를 생각해 봅시다. int용, double용, string용… 타입마다 똑같은 함수를 복사해 만드는 건 낭비죠. 그래서 C++은 타입 자체를 매개변수로 받는 방법을 줍니다 — template <typename T>. 이제 T는 "아직 정해지지 않은 타입"이고, maxOf(3, 7)이라 쓰면 컴파일러가 "아, T는 int구나" 하고 int 버전을 즉석에서 찍어냅니다. maxOf(2.5, 1.4)면 double 버전, maxOf(문자열)이면 string 버전을 자동으로요. 놀라운 건 문자열에서도 그대로 통한다는 점 — a > b가 사전순 비교로 알아서 풀립니다. 코드는 한 벌인데 타입은 무한. 이 "타입을 나중에 채우는" 생각이 STL 전체를 떠받칩니다.'); }
  },

  // ══════════ 2. 클래스 템플릿 — template<class T> class Stack ══════════
  { id:'cpp10_02',
    enter:function(E){ this.s={ops:0}; E.setOn([]); },
    tap:function(E){ this.s.ops=(this.s.ops+1)%7; E.blip(340+this.s.ops*40,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // push 10,20,30 → pop → pop  (7 스텝: 0=빈, 1..3 push, 4 top, 5 pop, 6 pop)
      var script=[
        {act:'초기 상태', line:8, stack:[]},
        {act:'push(10)',  line:2, stack:[10]},
        {act:'push(20)',  line:2, stack:[10,20]},
        {act:'push(30)',  line:2, stack:[10,20,30]},
        {act:'top() → 30',line:5, stack:[10,20,30]},
        {act:'pop() → 30',line:4, stack:[10,20]},
        {act:'pop() → 20',line:4, stack:[10]}
      ];
      var st=script[s.ops];

      var code=[
        {t:'template <class T>', hl:'class T'},
        {t:'class Stack {', hl:'Stack'},
        {t:'  T data[100]; int n = 0;', dim:true},
        {t:'  void push(T v) { data[n++] = v; }', hl:'push(T v)'},
        {t:'  T pop()  { return data[--n]; }', hl:'pop()'},
        {t:'  T top()  { return data[n-1]; }', hl:'top()'},
        {t:'  bool empty() { return n == 0; }', hl:'empty()'},
        {t:'};', dim:true},
        {t:'Stack<int> s;   // T = int 스택', hl:'Stack<int>'}
      ];
      var codeBot=codePanel(E, W*0.04, H*0.13, W*0.48, code, 'class_template.cpp', st.line);

      // 우측: 스택 시각화 (아래→위 쌓임)
      var bx=W*0.66, baseY=H*0.70, cw=W*0.16, chh=32;
      ctx.fillStyle='#dfeaf2'; ctx.font='600 13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('Stack<int>', bx+cw/2, H*0.15);
      // 바닥 선
      ctx.strokeStyle='rgba(90,180,232,0.5)'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(bx-6, baseY+4); ctx.lineTo(bx+cw+6, baseY+4);
      ctx.moveTo(bx-6, baseY+4); ctx.lineTo(bx-6, baseY-4*chh);
      ctx.moveTo(bx+cw+6, baseY+4); ctx.lineTo(bx+cw+6, baseY-4*chh); ctx.stroke();
      for(var k=0;k<st.stack.length;k++){
        var y=baseY - (k+1)*chh + 2, top=(k===st.stack.length-1);
        ctx.fillStyle= top?'rgba(126,224,176,0.18)':'rgba(90,180,232,0.14)';
        ctx.fillRect(bx, y, cw, chh-4);
        ctx.strokeStyle= top?GRN:CPB; ctx.lineWidth=1.6; ctx.strokeRect(bx, y, cw, chh-4);
        ctx.fillStyle= top?GRN:'#dfeaf2'; ctx.font='700 17px ui-monospace,Menlo,monospace'; ctx.textAlign='center';
        ctx.fillText(''+st.stack[k], bx+cw/2, y+(chh-4)/2+6);
      }
      // top 화살표
      if(st.stack.length){
        var ty=baseY - st.stack.length*chh + 2;
        ctx.fillStyle=GRN; ctx.font='600 12px sans-serif'; ctx.textAlign='left';
        ctx.fillText('← top (n='+st.stack.length+')', bx+cw+14, ty+18);
      } else {
        ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='center';
        ctx.fillText('(비어 있음)', bx+cw/2, baseY-20);
      }

      // 현재 연산 캡션 — 코드패널 아래 여백에 배치(겹침 방지). 자리가 좁으면 스택 아래(우측)로.
      var lpx, lpy, room=(H*0.90)-(codeBot+24);
      if(room>=66){ lpx=W*0.05; lpy=Math.max(codeBot+24, H*0.66); }   // 코드 아래 충분
      else { lpx=W*0.55; lpy=Math.min(H*0.90-44, baseY+28); }        // 좁으면 스택 아래 우측
      ctx.textAlign='left'; ctx.fillStyle=CPB; ctx.font='600 15px sans-serif';
      ctx.fillText('연산: '+st.act, lpx, lpy);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
      ctx.fillText('마지막에 넣은 것이 먼저 나옴 (LIFO — 후입선출).', lpx, lpy+22);
      ctx.fillStyle='#dfeaf2'; ctx.font='13px ui-monospace,Menlo,monospace';
      ctx.fillText('n = '+st.stack.length+'   내용 = ['+st.stack.join(', ')+']', lpx, lpy+44);

      E.tapHint(W/2, H*0.94, '화면 탭 = 다음 (push ×3 → top → pop ×2)', true);
      E.big('클래스 템플릿 — 어떤 타입이든 담는 그릇', '함수뿐 아니라 클래스도 타입을 매개변수로 받을 수 있습니다. Stack<T>를 한 번 만들어 두면, Stack<int>는 정수 스택, Stack<string>은 문자열 스택, Stack<Complex>는 복소수 스택 — 담을 타입만 <>안에 바꿔 끼우면 됩니다. 내부의 T data[100]에서 T가 그때그때 실제 타입으로 채워지죠. 스택은 접시 쌓기처럼 마지막에 올린 것을 가장 먼저 꺼내는(LIFO) 자료구조입니다. push로 위에 얹고, top으로 꼭대기를 엿보고, pop으로 걷어냅니다. 화면에서 10·20·30을 쌓았다가 30·20을 꺼내는 과정을 실제 배열 상태로 따라가 보세요. 이 하나의 템플릿이 필요한 만큼의 서로 다른 스택 클래스로 불어납니다.'); }
  },

  // ══════════ 3. 템플릿 특수화 — template<> class Stack<bool> ══════════
  { id:'cpp10_03',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(340+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 8개의 bool을 담는 경우: 일반=bool[8](8바이트), 특수화=1바이트 비트마스크
      var bits=[1,0,1,1,0,0,1,0]; // 실제 데이터
      var mask=0; for(var i=0;i<8;i++) if(bits[i]) mask |= (1<<i); // 실제 비트팩킹

      if(s.step===0){
        var code=[
          {t:'// 일반 템플릿 (모든 T)', dim:true},
          {t:'template <class T>', hl:'class T'},
          {t:'class Stack {', dim:true},
          {t:'  T data[100];   // T 하나당 한 칸', hl:'T data[100]'},
          {t:'  // ... push / pop / top ...', dim:true},
          {t:'};', dim:true},
          {t:'', dim:true},
          {t:'Stack<bool> s;', hl:'Stack<bool>'},
          {t:'// bool 하나에 1바이트 통째 사용', dim:true}
        ];
        codePanel(E, W*0.04, H*0.14, W*0.48, code, 'general_template.cpp', 3);

        // 8개 bool을 8바이트로: 각 칸이 1바이트
        var bx=W*0.58, by=H*0.30, cw=W*0.042;
        ctx.fillStyle=GLD; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('일반 Stack<bool> — bool 하나가 1바이트', bx, by-14);
        for(i=0;i<8;i++){
          var x=bx+i*(cw+4);
          ctx.fillStyle= bits[i]?'rgba(122,184,255,0.18)':'rgba(255,255,255,0.04)';
          ctx.fillRect(x, by, cw, cw); ctx.strokeStyle=BLU; ctx.lineWidth=1.2; ctx.strokeRect(x, by, cw, cw);
          ctx.fillStyle=bits[i]?BLU:DIM; ctx.font='700 15px ui-monospace,Menlo,monospace'; ctx.textAlign='center';
          ctx.fillText(bits[i]?'1':'0', x+cw/2, by+cw/2+6);
          ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('1B', x+cw/2, by+cw+14);
        }
        ctx.fillStyle=RED; ctx.font='600 15px sans-serif'; ctx.textAlign='left';
        ctx.fillText('8개 bool = 8 바이트  (참/거짓에 8배 낭비)', bx, by+cw+44);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
        ctx.fillText('bool은 1비트면 충분한데, 일반 배열은 칸마다 1바이트를 씁니다.', W*0.05, H*0.84);
      } else {
        var code=[
          {t:'// bool 전용 특수화', dim:true},
          {t:'template <>', hl:'template <>'},
          {t:'class Stack<bool> {', hl:'Stack<bool>'},
          {t:'  unsigned char bits;  // 8칸을 1바이트에', hl:'unsigned char'},
          {t:'  void push(bool v) {', dim:true},
          {t:'    if(v) bits |=  (1 << n);', hl:'bits |='},
          {t:'    else  bits &= ~(1 << n);', dim:true},
          {t:'    n++;', dim:true},
          {t:'  }', dim:true},
          {t:'};', dim:true}
        ];
        codePanel(E, W*0.04, H*0.13, W*0.48, code, 'specialize_bool.cpp', 5);

        // 8개 bool을 1바이트(8비트)로: 한 칸 안에 8비트
        var bx=W*0.56, by=H*0.32, bw=W*0.36, bh=44;
        ctx.fillStyle=GRN; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('특수화 Stack<bool> — 8개를 1바이트에 압축', bx, by-14);
        ctx.strokeStyle=GRN; ctx.lineWidth=2; ctx.fillStyle='rgba(126,224,176,0.06)';
        roundRect(ctx,bx,by,bw,bh,8); ctx.fill(); ctx.stroke();
        var bitw=bw/8;
        for(i=0;i<8;i++){
          var x=bx+i*bitw;
          if(i>0){ ctx.strokeStyle='rgba(126,224,176,0.35)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(x,by); ctx.lineTo(x,by+bh); ctx.stroke(); }
          ctx.fillStyle= bits[i]?GRN:DIM; ctx.font='700 16px ui-monospace,Menlo,monospace'; ctx.textAlign='center';
          ctx.fillText(bits[i]?'1':'0', x+bitw/2, by+bh/2+6);
        }
        ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='center';
        ctx.fillText('1 바이트 = 8 비트', bx+bw/2, by+bh+16);
        ctx.fillStyle=GRN; ctx.font='600 15px sans-serif'; ctx.textAlign='left';
        ctx.fillText('8개 bool = 1 바이트  (8배 절약!)', bx, by+bh+42);
        // 실제 mask 값 노출(검산)
        ctx.fillStyle='#dfeaf2'; ctx.font='13px ui-monospace,Menlo,monospace';
        ctx.fillText('비트 '+bits.slice().reverse().join('')+'₂  =  '+mask+'  (0x'+mask.toString(16).toUpperCase()+')', bx, by+bh+66);
        ctx.fillStyle=CPB; ctx.font='12.5px sans-serif';
        ctx.fillText('bool만은 다르게 구현 — 이것이 특수화입니다. (실제 std::vector<bool>도 이렇게)', W*0.05, H*0.88);
      }

      E.tapHint(W/2, H*0.94, '화면 탭 = 일반 Stack<bool> ↔ 특수화 비교', true);
      E.big('템플릿 특수화 — 특정 타입만 다르게', '템플릿은 "모든 타입에 같은 코드"가 기본이지만, 어떤 타입엔 특별한 사정이 있습니다. 대표적인 게 bool이죠. 참/거짓은 사실 1비트면 되는데, 일반 Stack<bool>은 배열의 칸마다 1바이트(8비트)를 통째로 써 버립니다 — 8개를 담으면 8바이트, 8배 낭비. 그래서 template<> class Stack<bool>처럼 "bool일 때만은 이렇게 만들어라"라고 별도 구현을 줄 수 있습니다. 여기서는 8개의 참/거짓을 정수 1바이트의 8비트에 비트 연산으로 촘촘히 눌러 담습니다 — 화면의 실제 비트 패턴이 하나의 정수 값으로 팩킹되는 게 보이죠. 컴파일러는 Stack<bool>을 만나면 일반 틀 대신 이 특수화 버전을 골라 씁니다. 실제 표준 라이브러리의 std::vector<bool>이 바로 이 트릭을 씁니다.'); }
  },

  // ══════════ 4. 비타입 템플릿 인자 — template<typename T, int N> class Array ══════════
  { id:'cpp10_04',
    enter:function(E){ var self=this; this.s={n:5};
      E.controls('<div class="ctrl"><label>배열 크기 N (컴파일타임 상수)</label><input type="range" id="nn" min="2" max="8" step="1" value="5"><output id="nno">5</output></div>');
      E.bind('#nn','input',function(e){ self.s.n=+e.target.value; document.getElementById('nno').textContent=e.target.value; E.blip(360,0.06); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var N=s.n;
      // 실제 데이터: 각 칸 = (index+1)*10
      var data=[]; for(var i=0;i<N;i++) data.push((i+1)*10);
      var bytes=N*4; // int 4바이트 가정

      var code=[
        {t:'template <typename T, int N>', hl:'int N'},
        {t:'class Array {', hl:'Array'},
        {t:'  T data[N];   // 크기가 컴파일타임 상수', hl:'T data[N]'},
        {t:'public:', dim:true},
        {t:'  T& operator[](int i){ return data[i]; }', hl:'operator[]'},
        {t:'  int size() const { return N; }', hl:'size()'},
        {t:'};', dim:true},
        {t:'Array<int, '+N+'> a;   // 스택에 딱 '+N+'칸', hl:'Array<int, '+N+'>'},
        {t:'a.size();  // = '+N+'  (컴파일타임에 확정)', hl:'a.size()'}
      ];
      var codeBot=codePanel(E, W*0.04, H*0.13, W*0.48, code, 'nontype_param.cpp', 7);

      // 우측: N칸 고정 배열 (오른쪽 여백 확보 위해 칸 폭·가용폭 축소)
      var bx=W*0.56, by=H*0.30, cw=Math.min(W*0.042, (W*0.39)/N), chh=40;
      ctx.fillStyle=CPB; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
      ctx.fillText('Array<int, '+N+'>  —  정확히 '+N+'칸', bx, by-16);
      for(i=0;i<N;i++){
        var x=bx+i*(cw+3);
        ctx.fillStyle='rgba(90,180,232,0.14)'; ctx.fillRect(x, by, cw, chh);
        ctx.strokeStyle=CPB; ctx.lineWidth=1.4; ctx.strokeRect(x, by, cw, chh);
        ctx.fillStyle='#dfeaf2'; ctx.font='700 14px ui-monospace,Menlo,monospace'; ctx.textAlign='center';
        ctx.fillText(''+data[i], x+cw/2, by+chh/2+5);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('['+i+']', x+cw/2, by+chh+14);
      }
      // 크기 브레이스
      ctx.strokeStyle=GLD; ctx.lineWidth=1.6;
      ctx.beginPath(); ctx.moveTo(bx, by+chh+26); ctx.lineTo(bx+N*(cw+3)-3, by+chh+26); ctx.stroke();
      ctx.fillStyle=GLD; ctx.font='600 13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('N = '+N, bx+(N*(cw+3))/2, by+chh+44);

      // 요약 설명 — 코드패널 아래 여백이 넉넉하면 좌측, 좁으면 우측(브레이스 아래). 겹침 방지.
      var lpx, lpy, roomL=(H*0.90)-(codeBot+24);
      if(roomL>=70){ lpx=W*0.05; lpy=Math.max(codeBot+24, H*0.72); }
      else { lpx=W*0.55; lpy=Math.min(H*0.90-44, by+chh+62); }
      ctx.textAlign='left'; ctx.fillStyle=GRN; ctx.font='600 14px sans-serif';
      ctx.fillText('a.size() = '+N+'  ·  메모리 = '+N+'×4 = '+bytes+'바이트', lpx, lpy);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif';
      ctx.fillText('N은 타입 아닌 값. Array<int,3>과 Array<int,5>는 다른 타입!', lpx, lpy+22);
      ctx.fillStyle=CPB; ctx.font='12px sans-serif';
      ctx.fillText('컴파일타임 확정 → 힙 할당 없이 스택에 통째로 얹힘 (빠름).', lpx, lpy+44);

      E.tapHint(W/2, H*0.94, '슬라이더로 크기 N을 바꿔 배열 칸·타입을 보세요', true);
      E.big('비타입 템플릿 인자 — 값도 매개변수로', '템플릿 인자가 꼭 타입일 필요는 없습니다. 정수 같은 값도 넘길 수 있죠 — 이걸 비타입(non-type) 인자라 부릅니다. template <typename T, int N>에서 T는 원소의 타입, N은 배열의 크기입니다. 핵심은 N이 컴파일타임에 확정되는 상수라는 점 — 그래서 T data[N]처럼 고정 크기 배열을 곧장 잡을 수 있고, 힙 할당(new) 없이 스택에 통째로 올라가 아주 빠릅니다. 재미있는 결과: Array<int,3>과 Array<int,5>는 크기가 다르니 아예 서로 다른 타입입니다 — 실수로 섞어 넣으면 컴파일러가 막아 줍니다. 슬라이더로 N을 바꿔 보면 칸 수와 함께 차지하는 메모리(N×4바이트)까지 그대로 따라 변하는 게 보입니다. 표준 라이브러리의 std::array<int, N>이 바로 이 방식입니다.'); }
  },

  // ══════════ 5. 인스턴스화 · STL 예고 ══════════
  { id:'cpp10_05',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(340+this.s.step*80,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'template <class T>', hl:'class T'},
        {t:'class vector { /* ... T ... */ };', hl:'vector'},
        {t:'', dim:true},
        {t:'vector<int>    vi;   // 정수 벡터', hl:'vector<int>'},
        {t:'vector<double> vd;   // 실수 벡터', hl:'vector<double>'},
        {t:'vector<string> vs;   // 문자열 벡터', hl:'vector<string>'},
        {t:'', dim:true},
        {t:'// 컴파일러가 타입마다 코드를', dim:true},
        {t:'// 자동으로 찍어냅니다 = 인스턴스화', hl:'인스턴스화'}
      ];
      var act=[3,4,5][s.step];
      var codeBot=codePanel(E, W*0.04, H*0.13, W*0.48, code, 'instantiation.cpp', act);

      // 우측: 하나의 템플릿 → 여러 구체 타입(공장 그림). 낮은 창에서 3단이 들어가게 압축.
      var mx=W*0.70, my=H*0.15, mw=W*0.22, mh=42;
      // 틀(공장)
      ctx.strokeStyle=CPB; ctx.lineWidth=2; ctx.fillStyle='rgba(90,180,232,0.10)';
      roundRect(ctx,mx,my,mw,mh,10); ctx.fill(); ctx.stroke();
      ctx.fillStyle=CPB; ctx.font='600 12px sans-serif'; ctx.textAlign='center';
      ctx.fillText('template', mx+mw/2, my+17);
      ctx.font='13px ui-monospace,Menlo,monospace'; ctx.fillText('vector<T>', mx+mw/2, my+34);

      // 산출물(현재 step까지)
      var outs=[
        {t:'vector<int>',    col:GLD},
        {t:'vector<double>', col:GRN},
        {t:'vector<string>', col:PNK}
      ];
      var oy0=my+mh+24, oh=34, og=10, ow=Math.min(W*0.24,W*0.97-mx), ox=mx+mw/2-ow/2;
      for(var k=0;k<=s.step;k++){
        var o=outs[k], y=oy0+k*(oh+og);
        // 연결선
        ctx.strokeStyle=DIM; ctx.lineWidth=1.4; ctx.setLineDash([4,3]);
        ctx.beginPath(); ctx.moveTo(mx+mw/2, my+mh); ctx.lineTo(ox+ow/2, y); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle=o.col; ctx.lineWidth=1.8; ctx.fillStyle='rgba(255,255,255,0.04)';
        roundRect(ctx,ox,y,ow,oh,8); ctx.fill(); ctx.stroke();
        ctx.fillStyle=o.col; ctx.font='700 14px ui-monospace,Menlo,monospace'; ctx.textAlign='center';
        ctx.fillText(o.t, ox+ow/2, y+17);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText('전용 코드 1벌 생성', ox+ow/2, y+30);
      }

      // 설명 — 코드패널 아래 여백이 넉넉하면 좌측, 좁으면 우측(출력 아래). 겹침 방지.
      var outsBot=oy0+2*(oh+og)+oh;   // 3단 산출물의 최하단
      var lpx, lpy, roomL=(H*0.90)-(codeBot+22);
      if(roomL>=64){ lpx=W*0.05; lpy=Math.max(codeBot+22, H*0.72); }
      else { lpx=W*0.55; lpy=Math.min(H*0.88-40, outsBot+22); }
      ctx.textAlign='left'; ctx.fillStyle=CPB; ctx.font='600 14px sans-serif';
      ctx.fillText('인스턴스화 — 필요한 타입만 코드가 태어납니다', lpx, lpy);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif';
      ctx.fillText('vector<int>를 쓰는 순간 int 전용 vector 코드가 그때 생깁니다.', lpx, lpy+20);
      ctx.fillStyle=GRN; ctx.font='12px sans-serif';
      ctx.fillText('STL — vector·map·set·sort … 전부 이 템플릿입니다.', lpx, lpy+40);

      // STL 칩 — 설명 아래, 화면 하단(H*0.92) 안쪽으로 클램프
      var chips=['vector','map','set','sort','pair'], chx=lpx, chy=Math.min(lpy+52, H*0.92-20);
      ctx.font='13.5px sans-serif';
      for(k=0;k<chips.length;k++){
        var wch=ctx.measureText(chips[k]).width+18;
        ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.strokeStyle=CPB; ctx.lineWidth=1;
        roundRect(ctx,chx,chy,wch,20,6); ctx.fill(); ctx.stroke();
        ctx.fillStyle=CPD; ctx.textAlign='left'; ctx.fillText(chips[k], chx+9, chy+14);
        chx+=wch+10;
      }

      E.tapHint(W/2, H*0.94, '화면 탭 = 다음 (vector<int> → <double> → <string>)', true);
      E.big('인스턴스화, 그리고 STL의 문', '템플릿은 그 자체로는 코드가 아니라 "코드를 찍는 틀"입니다. vector<int>를 실제로 쓰기 전엔 int용 벡터 코드가 세상에 존재하지 않죠. 그러다 vector<int>를 처음 만나는 순간, 컴파일러가 틀의 T 자리에 int를 대입해 그 타입 전용 코드를 즉석에서 만들어냅니다 — 이 과정을 인스턴스화라고 합니다. vector<double>을 또 쓰면 double용 코드가 하나 더 태어나고요. 필요한 타입만큼만, 필요할 때 코드가 생기는 셈입니다. 이 아이디어가 C++ 표준 라이브러리(STL) 전체를 떠받칩니다 — vector, map, set 같은 컨테이너와 sort, find 같은 알고리즘이 모두 템플릿이라, 여러분의 어떤 타입에도 그대로 맞춰 씁니다. 지금까지 배운 함수 템플릿·클래스 템플릿·특수화·비타입 인자가 한데 모여, 다음에 만날 STL이라는 거대한 도구 상자의 열쇠가 됩니다.'); }
  },

  // ══════════════════ 심화학습 (branchOf:'cpp10_01') ══════════════════

  // ─── 의존 이름과 typename ───
  { id:'cpp10_01_typename', branchOf:'cpp10_01', ord:1,
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(340+this.s.step*90,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var bad = s.step<=1;
      var code = bad ? [
        {t:'template <class T>', hl:'class T'},
        {t:'void print(const T& c){', dim:true},
        {t:'  // T::iterator 가 타입인지 값인지', dim:true},
        {t:'  // 컴파일러는 아직 모른다!', dim:true},
        {t:'  T::iterator it = c.begin();', hl:'T::iterator'},
        {t:'  // ↑ "곱셈?" 으로 오해 → 파싱 오류', dim:true},
        {t:'}', dim:true}
      ] : [
        {t:'template <class T>', hl:'class T'},
        {t:'void print(const T& c){', dim:true},
        {t:'  // typename 으로 "이건 타입!" 이라', dim:true},
        {t:'  // 컴파일러에게 알려 준다', dim:true},
        {t:'  typename T::iterator it = c.begin();', hl:'typename'},
        {t:'  for(; it != c.end(); ++it) ...', dim:true},
        {t:'}', dim:true}
      ];
      codePanel(E, W*0.04, H*0.13, W*0.50, code, bad?'dependent_bad.cpp':'dependent_ok.cpp', 4);

      // 우측: 의존 이름 T::iterator 의 두 해석
      var px=W*0.58, py=H*0.15, bw=W*0.37;
      ctx.textAlign='left'; ctx.fillStyle=CPB; ctx.font='600 14px sans-serif';
      ctx.fillText('T::iterator — 무엇으로 읽을까?', px, py);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif';
      ctx.fillText('T가 정해지기 전엔 두 갈래로 읽힐 수 있습니다.', px, py+18);

      // 두 해석 카드
      function card(y,tag,expr,col,ok,detail){
        ctx.strokeStyle=col; ctx.lineWidth=1.8; ctx.fillStyle='rgba(255,255,255,0.035)';
        roundRect(ctx,px,y,bw,70,10); ctx.fill(); ctx.stroke();
        ctx.fillStyle=col; ctx.font='600 12.5px sans-serif'; ctx.textAlign='left';
        ctx.fillText(tag, px+14, y+20);
        ctx.fillStyle='#dfeaf2'; ctx.font='13px ui-monospace,Menlo,monospace';
        ctx.fillText(expr, px+14, y+42);
        ctx.fillStyle=ok?GRN:RED; ctx.font='12px sans-serif';
        ctx.fillText(detail, px+14, y+62);
      }
      // 두 해석 항상 표시 (step0), step1=모호 강조, step2=typename으로 확정
      card(py+34, '① 타입으로', 'T::iterator it;  // it 은 반복자', s.step>=2?GRN:DIM, s.step>=2, s.step>=2?'typename → 타입으로 확정':'선언인지…');
      card(py+34+82, '② 값으로 (곱셈)', 'T::iterator * it; // 정적멤버 × it', s.step>=2?RED:GLD, false, s.step>=2?'typename이 이 오해를 막음':'…곱셈식인지 모호!');

      // 하단 캡션(우측)
      var lpx=px, lpy=Math.min(py+34+82+70+26, H*0.88);
      ctx.textAlign='left';
      if(s.step===0){ ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
        ctx.fillText('컴파일러는 T가 뭔지 아직 몰라 ①·② 중 못 고릅니다.', lpx, lpy); }
      else if(s.step===1){ ctx.fillStyle=RED; ctx.font='600 13.5px sans-serif';
        ctx.fillText('규칙: 확신 없으면 값(곱셈)으로 가정 → 선언이 깨짐.', lpx, lpy); }
      else { ctx.fillStyle=GRN; ctx.font='600 13.5px sans-serif';
        ctx.fillText('typename T::iterator → "이건 타입!" 모호성 해소.', lpx, lpy); }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (모호 → 규칙 → typename 해결)', true);
      E.big('심화 · 의존 이름과 typename — 타입임을 알려 주기', '<b>T::iterator</b>처럼 템플릿 매개변수 T에 <b>기대어(의존해)</b> 정해지는 이름을 <b>의존 이름</b>이라 합니다. 문제는 T가 아직 무엇인지 정해지기 전이라, 컴파일러가 T::iterator를 <b>타입</b>으로 읽어야 할지 <b>값(정적 멤버)</b>으로 읽어야 할지 알 수 없다는 점입니다. 예컨대 <b>T::iterator * it;</b>은 "반복자 타입의 포인터 선언"일 수도, "정적 멤버 iterator와 it의 곱셈"일 수도 있죠. 이 모호함 앞에서 C++의 규칙은 <b>확신이 없으면 값(곱셈)으로 가정</b>하는 것이라, 우리가 의도한 타입 선언이 그대로 깨져 버립니다. 그래서 의존 이름이 <b>타입</b>임을 뜻할 때는 앞에 <b>typename</b>을 붙여 "이건 타입이야"라고 못박아 줍니다 — <b>typename T::iterator it;</b>. 규칙은 간단합니다: 템플릿 안에서 T에 의존하는 이름을 타입으로 쓸 땐 typename을 붙인다. 컴파일러의 오해를 미리 막는 한 단어입니다.'); }
  },

  // ─── 템플릿 타입 추론 (T · T& · const T&) ───
  { id:'cpp10_01_deduction', branchOf:'cpp10_01', ord:2,
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(340+this.s.step*80,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 세 함수형: f(T) 값 / f(T&) 참조 / f(const T&) const참조.  인자 int x, int& r, const int& c
      // 표준 추론 규칙(실제):
      //  f(T)      : 참조·const·최상위 모두 벗김 → T=int (항상)
      //  f(T&)     : 참조는 벗기되 const 유지 → x:int, r:int, c:const int
      //  f(const T&): const 흡수 → T=int (항상)
      var forms=[
        {sig:'template<class T> void f(T  x);',   fname:'f(T)',        title:'값 전달 — 벗겨진다',
          rows:[['f(x)  // x:int',      'int'],['f(r)  // r:int&',     'int'],['f(c)  // c:const int&','int']],
          note:'참조·const·최상위가 모두 벗겨져 항상 T=int.'},
        {sig:'template<class T> void f(T& x);',   fname:'f(T&)',       title:'참조 전달 — const는 남는다',
          rows:[['f(x)  // x:int',      'int'],['f(r)  // r:int&',     'int'],['f(c)  // c:const int&','const int']],
          note:'참조는 벗기되 const 는 T 안으로 흡수돼 유지.'},
        {sig:'template<class T> void f(const T& x);', fname:'f(const T&)', title:'const참조 — const 흡수',
          rows:[['f(x)  // x:int',      'int'],['f(r)  // r:int&',     'int'],['f(c)  // c:const int&','int']],
          note:'매개변수가 이미 const& — 남는 T 는 항상 int.'}
      ];
      var cur=forms[s.step];

      var code=[
        {t:'template <class T>', hl:'class T'},
        {t:cur.sig.replace('template<class T> ',''), hl:cur.fname},
        {t:'', dim:true},
        {t:'int       x = 3;', dim:true},
        {t:'int&      r = x;', dim:true},
        {t:'const int c = 3;', dim:true},
        {t:'f(x);  f(r);  f(c);   // T 추론', hl:'f(x)'}
      ];
      var codeBot=codePanel(E, W*0.04, H*0.14, W*0.48, code, 'deduction.cpp', 1);

      // 우측: 인자별 추론된 T 표 (실제 규칙)
      var px=W*0.56, py=H*0.16, tw=W*0.40;
      ctx.textAlign='left'; ctx.fillStyle=CPB; ctx.font='600 14px sans-serif';
      ctx.fillText(cur.title, px, py);
      ctx.fillStyle=DIM; ctx.font='12.5px ui-monospace,monospace';
      ctx.fillText(cur.fname+' 에서 추론된 T', px, py+18);

      // 표 헤더
      var ty=py+32, rh=44, col2=px+tw*0.60;
      ctx.strokeStyle='rgba(90,180,232,0.35)'; ctx.lineWidth=1;
      ctx.fillStyle=DIM; ctx.font='13.5px sans-serif';
      ctx.fillText('인자 (호출)', px+10, ty+16);
      ctx.fillText('추론된 T', col2+10, ty+16);
      ctx.beginPath(); ctx.moveTo(px, ty+24); ctx.lineTo(px+tw, ty+24); ctx.stroke();
      for(var k=0;k<3;k++){
        var y=ty+24+k*rh, row=cur.rows[k];
        // 세로 구분선
        ctx.strokeStyle='rgba(255,255,255,0.10)'; ctx.beginPath(); ctx.moveTo(col2, y); ctx.lineTo(col2, y+rh); ctx.stroke();
        ctx.fillStyle='#dfeaf2'; ctx.font='12.5px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
        ctx.fillText(row[0], px+10, y+27);
        // 결과 T: const가 남으면 강조색
        var kept=(row[1].indexOf('const')>=0);
        ctx.fillStyle=kept?GLD:GRN; ctx.font='700 15px ui-monospace,Menlo,monospace';
        ctx.fillText('T = '+row[1], col2+10, y+27);
        ctx.strokeStyle='rgba(255,255,255,0.08)'; ctx.beginPath(); ctx.moveTo(px, y+rh); ctx.lineTo(px+tw, y+rh); ctx.stroke();
      }
      ctx.strokeStyle='rgba(90,180,232,0.35)'; ctx.strokeRect(px, ty+24, tw, rh*3);

      // 노트
      ctx.fillStyle=CPB; ctx.font='12.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText(cur.note, px, ty+24+rh*3+24);

      // 좌측 하단 캡션
      var lpx=W*0.05, lpy=Math.min(H*0.90, Math.max(codeBot+22, H*0.78));
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillText('값(T)은 다 벗기고, 참조(T&)만 const 를 남긴다 — 핵심 규칙.', lpx, lpy);

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (f(T) → f(T&) → f(const T&))', true);
      E.big('심화 · 템플릿 타입 추론 — 참조와 const는 어떻게 될까', '<b>maxOf(3, 7)</b>처럼 인자만 넘기면 컴파일러가 T를 알아서 맞춥니다. 그런데 매개변수를 <b>값(T)</b>으로 받느냐, <b>참조(T&)</b>로 받느냐, <b>const 참조(const T&)</b>로 받느냐에 따라 벗겨지는 것이 달라집니다. 핵심 규칙 세 가지입니다. ① <b>f(T)</b> — 값으로 받으면 인자의 참조성·const·최상위 한정자가 <b>모두 벗겨져</b> 항상 T=int가 됩니다(어차피 복사본이니까). ② <b>f(T&)</b> — 참조로 받으면 참조는 벗기지만 <b>const 는 T 안으로 흡수</b>돼 남습니다. 그래서 const int를 넘기면 T=const int가 되죠. ③ <b>f(const T&)</b> — 매개변수가 이미 const 참조라, 인자의 const는 여기에 녹아 남는 T는 항상 int입니다. 오른쪽 표에서 같은 세 인자(int·int&·const int&)가 형태마다 다른 T로 추론되는 게 실제 규칙 그대로 보입니다. "값은 다 벗기고, 참조만 const 를 남긴다" — 이 한 줄이 추론의 뼈대입니다.'); }
  },

  // ══════════════════ 심화학습 (branchOf:'cpp10_03') ══════════════════

  // ─── 특수화 vs 오버로딩 ───
  { id:'cpp10_03_overloadvsspec', branchOf:'cpp10_03', ord:1,
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(340+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var isFunc = s.step===0;
      var code = isFunc ? [
        {t:'// 함수: 오버로딩으로 특정 타입 처리', dim:true},
        {t:'template <class T>', hl:'class T'},
        {t:'void f(T x){ /* 일반 */ }', dim:true},
        {t:'', dim:true},
        {t:'// 부분특수화 X — 대신 오버로딩', dim:true},
        {t:'void f(int* x){ /* 포인터 전용 */ }', hl:'f(int* x)'},
        {t:'', dim:true},
        {t:'f(3);      // 일반 f<int>', hl:'f(3)'},
        {t:'int a; f(&a); // 오버로드 f(int*)', hl:'f(&a)'}
      ] : [
        {t:'// 클래스: 특수화로 특정 타입 처리', dim:true},
        {t:'template <class T>', hl:'class T'},
        {t:'struct Box { /* 일반 */ };', dim:true},
        {t:'', dim:true},
        {t:'// 부분특수화 O (포인터 전부)', dim:true},
        {t:'template <class T>', dim:true},
        {t:'struct Box<T*> { /* 포인터 전용 */ };', hl:'Box<T*>'},
        {t:'', dim:true},
        {t:'Box<int>  bi;   // 일반', hl:'Box<int>'},
        {t:'Box<int*> bp;   // 부분특수화', hl:'Box<int*>'}
      ];
      codePanel(E, W*0.04, H*0.11, W*0.50, code, isFunc?'func_overload.cpp':'class_specialize.cpp', isFunc?5:6);

      // 우측: 두 세계 대비 카드
      var px=W*0.60, py=H*0.16, bw=Math.min(W*0.33, W*0.97-px);
      ctx.textAlign='left'; ctx.fillStyle=CPB; ctx.font='600 14px sans-serif';
      ctx.fillText(isFunc?'함수 템플릿':'클래스 템플릿', px, py);

      function rule(y,label,ok,detail){
        ctx.fillStyle=ok?GRN:RED; ctx.font='700 15px sans-serif'; ctx.textAlign='left';
        ctx.fillText(ok?'✓':'✗', px, y);
        ctx.fillStyle='#dfeaf2'; ctx.font='13px sans-serif';
        ctx.fillText(label, px+22, y);
        ctx.fillStyle=DIM; ctx.font='13.5px sans-serif';
        ctx.fillText(detail, px+22, y+18);
      }
      if(isFunc){
        rule(py+28, '부분특수화 불가',       false, '함수 템플릿은 부분특수화 문법이 없음');
        rule(py+70, '오버로딩이 우선',        true,  'f(int*) 같은 오버로드로 대체·먼저 고려');
        rule(py+112,'과부하 해소 규칙 적용',  true,  '가장 잘 맞는 함수를 오버로드 목록에서 선택');
      } else {
        rule(py+28, '완전특수화 가능',        true,  'template<> struct Box<int> { … }');
        rule(py+70, '부분특수화 가능',        true,  'Box<T*> — 포인터 전부를 한 번에');
        rule(py+112,'오버로딩 개념 없음',     false, '클래스는 특수화로만 타입별 분기');
      }

      // 선택 결과 박스
      var oy=py+112+40;
      ctx.fillStyle='#0c0f16'; ctx.strokeStyle='rgba(126,224,176,0.5)'; ctx.lineWidth=1.4;
      roundRect(ctx,px,oy,bw,52,8); ctx.fill(); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.textAlign='left'; ctx.fillText('무엇이 선택되나', px+10, oy+15);
      ctx.fillStyle=GRN; ctx.font='600 13px ui-monospace,Menlo,monospace';
      if(isFunc) ctx.fillText('f(&a) → f(int*)  (오버로드)', px+10, oy+36);
      else       ctx.fillText('Box<int*> → 부분특수화판', px+10, oy+36);

      // 좌측 하단 캡션
      var lpx=W*0.05, lpy=H*0.88;
      ctx.textAlign='left';
      if(isFunc){ ctx.fillStyle=RED; ctx.font='600 12.5px sans-serif';
        ctx.fillText('흔한 함정: 함수를 부분특수화하려다 막힘 → 오버로딩으로!', lpx, lpy); }
      else { ctx.fillStyle=CPB; ctx.font='600 12.5px sans-serif';
        ctx.fillText('클래스는 부분특수화로 "포인터 전부" 같은 묶음도 잡습니다.', lpx, lpy); }

      E.tapHint(W/2, H*0.95, '화면 탭 = 함수(오버로딩) ↔ 클래스(특수화)', true);
      E.big('심화 · 특수화 vs 오버로딩 — 함수와 클래스는 다르다', '특정 타입만 다르게 처리하고 싶을 때, <b>함수</b>와 <b>클래스</b>는 방법이 다릅니다 — 이걸 헷갈리는 것이 아주 흔한 함정입니다. <b>클래스 템플릿</b>은 완전특수화(template&lt;&gt; struct Box&lt;int&gt;)뿐 아니라 <b>부분특수화</b>(Box&lt;T*&gt; — 모든 포인터)까지 됩니다. 그래서 "포인터 전부"처럼 타입의 <b>묶음</b>을 한 번에 잡을 수 있죠. 반면 <b>함수 템플릿</b>은 <b>부분특수화가 아예 불가능</b>합니다. 대신 함수는 <b>오버로딩</b>이라는 더 강력한 도구가 있어서, f(int*)처럼 그냥 다른 함수를 하나 더 정의하면 됩니다. 호출이 일어나면 컴파일러는 <b>오버로드 후보들 중 가장 잘 맞는 것을 먼저 고르고</b>, 그 다음에야 그 함수의 특수화를 봅니다. 그래서 함수는 "부분특수화하지 말고 오버로딩하라"가 모범 사례입니다. 요약: <b>클래스는 특수화, 함수는 오버로딩</b> — 화면에서 f(&a)가 오버로드 f(int*)로, Box&lt;int*&gt;가 부분특수화판으로 각각 실제로 선택되는 걸 보세요.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
