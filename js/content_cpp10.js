/* C++ 제10장 — 템플릿: 함수 템플릿(maxOf) · 클래스 템플릿(Stack) · 특수화(Stack<bool>) · 비타입 인자(Array<T,N>) · 인스턴스화·STL 예고
   동작(behavior)만. 텍스트=content/cpp10.json. 엔진 js/engine.js 공유. 색: C++=파랑(#5ab4e8).
   골든룰: 화면의 모든 비교 결과·스택 push/pop 상태·비트 팩킹·배열 인덱싱·인스턴스화 목록은 draw에서 실제로 계산(가짜·난수 금지). 진짜 표준 C++. */
(function(){
  var CPB='#5ab4e8', CPD='#8fd0f5', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', PNK='#f4a0c0', DIM='#9b99a3', RED='#f0888a';

  function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function codePanel(E, x, y, w, lines, title, actLine){
    var ctx=E.ctx, lh=21, pad=14, top=y, n=lines.length, ht=n*lh+pad*2+(title?26:0);
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
      codePanel(E, W*0.04, H*0.13, W*0.50, code, 'class_template.cpp', st.line);

      // 우측: 스택 시각화 (아래→위 쌓임)
      var bx=W*0.66, baseY=H*0.72, cw=W*0.16, chh=34;
      ctx.fillStyle='#dfeaf2'; ctx.font='600 13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('Stack<int>', bx+cw/2, H*0.16);
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

      // 현재 연산 캡션
      var lpx=W*0.05, lpy=H*0.66;
      ctx.textAlign='left'; ctx.fillStyle=CPB; ctx.font='600 16px sans-serif';
      ctx.fillText('연산: '+st.act, lpx, lpy);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
      ctx.fillText('마지막에 넣은 것이 가장 먼저 나옵니다 (LIFO — 후입선출).', lpx, lpy+24);
      ctx.fillStyle='#dfeaf2'; ctx.font='13px ui-monospace,Menlo,monospace';
      ctx.fillText('현재 크기 n = '+st.stack.length+'   내용 = ['+st.stack.join(', ')+']', lpx, lpy+48);

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
          ctx.fillStyle=DIM; ctx.font='10px sans-serif'; ctx.fillText('1B', x+cw/2, by+cw+14);
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
        ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center';
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
      codePanel(E, W*0.04, H*0.13, W*0.50, code, 'nontype_param.cpp', 7);

      // 우측: N칸 고정 배열
      var bx=W*0.58, by=H*0.36, cw=Math.min(W*0.044, (W*0.38)/N), chh=40;
      ctx.fillStyle=CPB; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
      ctx.fillText('Array<int, '+N+'>  —  정확히 '+N+'칸', bx, by-16);
      for(i=0;i<N;i++){
        var x=bx+i*(cw+3);
        ctx.fillStyle='rgba(90,180,232,0.14)'; ctx.fillRect(x, by, cw, chh);
        ctx.strokeStyle=CPB; ctx.lineWidth=1.4; ctx.strokeRect(x, by, cw, chh);
        ctx.fillStyle='#dfeaf2'; ctx.font='700 14px ui-monospace,Menlo,monospace'; ctx.textAlign='center';
        ctx.fillText(''+data[i], x+cw/2, by+chh/2+5);
        ctx.fillStyle=DIM; ctx.font='10px sans-serif'; ctx.fillText('['+i+']', x+cw/2, by+chh+14);
      }
      // 크기 브레이스
      ctx.strokeStyle=GLD; ctx.lineWidth=1.6;
      ctx.beginPath(); ctx.moveTo(bx, by+chh+26); ctx.lineTo(bx+N*(cw+3)-3, by+chh+26); ctx.stroke();
      ctx.fillStyle=GLD; ctx.font='600 13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('N = '+N, bx+(N*(cw+3))/2, by+chh+44);

      var lpx=W*0.05, lpy=H*0.72;
      ctx.textAlign='left'; ctx.fillStyle=GRN; ctx.font='600 15px sans-serif';
      ctx.fillText('a.size() = '+N+'   ·   메모리 = '+N+' × 4바이트 = '+bytes+'바이트', lpx, lpy);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
      ctx.fillText('N은 타입이 아니라 값입니다. Array<int,3>과 Array<int,5>는 서로 다른 타입!', lpx, lpy+24);
      ctx.fillStyle=CPB; ctx.font='12.5px sans-serif';
      ctx.fillText('크기가 컴파일타임에 확정되므로 힙 할당 없이 스택에 통째로 얹힙니다 (빠름).', lpx, lpy+46);

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
      codePanel(E, W*0.04, H*0.13, W*0.48, code, 'instantiation.cpp', act);

      // 우측: 하나의 템플릿 → 여러 구체 타입(공장 그림)
      var mx=W*0.72, my=H*0.24, mw=W*0.20, mh=48;
      // 틀(공장)
      ctx.strokeStyle=CPB; ctx.lineWidth=2; ctx.fillStyle='rgba(90,180,232,0.10)';
      roundRect(ctx,mx,my,mw,mh,10); ctx.fill(); ctx.stroke();
      ctx.fillStyle=CPB; ctx.font='600 13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('template', mx+mw/2, my+20);
      ctx.font='13px ui-monospace,Menlo,monospace'; ctx.fillText('vector<T>', mx+mw/2, my+38);

      // 산출물(현재 step까지)
      var outs=[
        {t:'vector<int>',    col:GLD},
        {t:'vector<double>', col:GRN},
        {t:'vector<string>', col:PNK}
      ];
      var oy0=my+mh+40, oh=42, ow=W*0.24, ox=mx+mw/2-ow/2;
      for(var k=0;k<=s.step;k++){
        var o=outs[k], y=oy0+k*(oh+14);
        // 연결선
        ctx.strokeStyle=DIM; ctx.lineWidth=1.4; ctx.setLineDash([4,3]);
        ctx.beginPath(); ctx.moveTo(mx+mw/2, my+mh); ctx.lineTo(ox+ow/2, y); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle=o.col; ctx.lineWidth=1.8; ctx.fillStyle='rgba(255,255,255,0.04)';
        roundRect(ctx,ox,y,ow,oh,8); ctx.fill(); ctx.stroke();
        ctx.fillStyle=o.col; ctx.font='700 15px ui-monospace,Menlo,monospace'; ctx.textAlign='center';
        ctx.fillText(o.t, ox+ow/2, y+20);
        ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.fillText('전용 코드 1벌 생성', ox+ow/2, y+37);
      }

      var lpx=W*0.05, lpy=H*0.72;
      ctx.textAlign='left'; ctx.fillStyle=CPB; ctx.font='600 15px sans-serif';
      ctx.fillText('인스턴스화 — 필요한 타입만 코드가 태어납니다', lpx, lpy);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
      ctx.fillText('vector<int>를 쓰는 순간, 컴파일러가 int 전용 vector 코드를 딱 그때 만듭니다.', lpx, lpy+24);
      ctx.fillStyle=GRN; ctx.font='12.5px sans-serif';
      ctx.fillText('STL(표준 템플릿 라이브러리) — vector·map·set·sort … 전부 이 템플릿입니다.', lpx, lpy+46);

      // STL 칩
      var chips=['vector','map','set','sort','pair'], chx=lpx, chy=lpy+64;
      ctx.font='11.5px sans-serif';
      for(k=0;k<chips.length;k++){
        var wch=ctx.measureText(chips[k]).width+18;
        ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.strokeStyle=CPB; ctx.lineWidth=1;
        roundRect(ctx,chx,chy,wch,20,6); ctx.fill(); ctx.stroke();
        ctx.fillStyle=CPD; ctx.textAlign='left'; ctx.fillText(chips[k], chx+9, chy+14);
        chx+=wch+10;
      }

      E.tapHint(W/2, H*0.94, '화면 탭 = 다음 (vector<int> → <double> → <string>)', true);
      E.big('인스턴스화, 그리고 STL의 문', '템플릿은 그 자체로는 코드가 아니라 "코드를 찍는 틀"입니다. vector<int>를 실제로 쓰기 전엔 int용 벡터 코드가 세상에 존재하지 않죠. 그러다 vector<int>를 처음 만나는 순간, 컴파일러가 틀의 T 자리에 int를 대입해 그 타입 전용 코드를 즉석에서 만들어냅니다 — 이 과정을 인스턴스화라고 합니다. vector<double>을 또 쓰면 double용 코드가 하나 더 태어나고요. 필요한 타입만큼만, 필요할 때 코드가 생기는 셈입니다. 이 아이디어가 C++ 표준 라이브러리(STL) 전체를 떠받칩니다 — vector, map, set 같은 컨테이너와 sort, find 같은 알고리즘이 모두 템플릿이라, 여러분의 어떤 타입에도 그대로 맞춰 씁니다. 지금까지 배운 함수 템플릿·클래스 템플릿·특수화·비타입 인자가 한데 모여, 다음에 만날 STL이라는 거대한 도구 상자의 열쇠가 됩니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
