/* C++ 제9장 — 연산자 오버로딩: operator+ (복소수) · 단항(-,++) · 이항·교환법칙(friend) · <<>> (cout 정체) · [] 첨자
   동작(behavior)만. 텍스트=content/cpp9.json. 엔진 js/engine.js 공유. 색: C++=파랑(#5ab4e8).
   골든룰: 화면의 모든 복소수 합·부호·증가·곱·출력문자열·인덱싱 결과는 draw에서 실제로 계산(가짜·난수 금지). 진짜 표준 C++. */
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

  // 복소수 평면 헬퍼: 실수부/허수부를 화면 좌표로
  function cplane(ox,oy,unit){
    return { ox:ox, oy:oy, unit:unit,
      X:function(re){ return ox+re*unit; },
      Y:function(im){ return oy-im*unit; } }; }
  function drawAxes(E,P,rng){ var ctx=E.ctx;
    ctx.strokeStyle='rgba(90,180,232,0.22)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(P.X(-rng),P.oy); ctx.lineTo(P.X(rng),P.oy);
    ctx.moveTo(P.ox,P.Y(-rng)); ctx.lineTo(P.ox,P.Y(rng)); ctx.stroke();
    ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left';
    ctx.fillText('실수부(Re) →', P.X(rng)-70, P.oy-8);
    ctx.textAlign='left'; ctx.fillText('허수부(Im) ↑', P.ox+8, P.Y(rng)+14); }
  // 복소수 화살표(원점→(re,im))
  function cvec(E,P,re,im,col,label){ var ctx=E.ctx, x=P.X(re), y=P.Y(im);
    ctx.strokeStyle=col; ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(P.ox,P.oy); ctx.lineTo(x,y); ctx.stroke();
    var ang=Math.atan2(P.oy-y, x-P.ox);
    ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x-9*Math.cos(ang-0.4), y+9*Math.sin(ang-0.4));
    ctx.lineTo(x-9*Math.cos(ang+0.4), y+9*Math.sin(ang+0.4)); ctx.closePath(); ctx.fillStyle=col; ctx.fill();
    if(label){ ctx.fillStyle=col; ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.fillText(label, x+8, y-4); } }
  function cstr(re,im){ // 복소수를 "a+bi" 문자열로(실측 포맷)
    var s=(re===Math.round(re)?re:re.toFixed(1)); var b=(im===Math.round(im)?Math.abs(im):Math.abs(im).toFixed(1));
    var sign=im<0?'-':'+'; return s+' '+sign+' '+b+'i'; }

  var scenes = [

  // ══════════ 1. 연산자 오버로딩 이해 — Complex operator+ ══════════
  { id:'cpp9_01',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(360+this.s.step*90,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 실제 계산: (1+2i) + (3+4i) = 4+6i
      var a={re:1,im:2}, b={re:3,im:4};
      var sum={re:a.re+b.re, im:a.im+b.im};

      var code=[
        {t:'class Complex {', dim:true},
        {t:'  double re, im;', dim:true},
        {t:'public:', dim:true},
        {t:'  Complex(double r,double i):re(r),im(i){}', hl:'Complex'},
        {t:'  Complex operator+(const Complex& r) {', hl:'operator+'},
        {t:'    return Complex(re + r.re,', hl:'re + r.re'},
        {t:'                   im + r.im);', hl:'im + r.im'},
        {t:'  }', dim:true},
        {t:'};', dim:true},
        {t:'Complex a(1,2), b(3,4);', hl:'a(1,2)'},
        {t:'Complex c = a + b;   // a.operator+(b)', hl:'a + b'}
      ];
      var act=[3,4,5,10][s.step];
      codePanel(E, W*0.04, H*0.12, W*0.48, code, 'complex_add.cpp', act);

      // 우측: 복소평면에서 벡터 덧셈
      var P=cplane(W*0.72, H*0.52, Math.min(W*0.052,H*0.09));
      drawAxes(E,P,5);
      cvec(E,P,a.re,a.im,CPB,'a = '+cstr(a.re,a.im));
      if(s.step>=1) cvec(E,P,b.re,b.im,GLD,'b = '+cstr(b.re,b.im));
      if(s.step>=3){
        // 평행이동으로 합 시각화(b를 a 끝에서)
        ctx.setLineDash([4,3]); ctx.strokeStyle='rgba(255,211,67,0.5)'; ctx.lineWidth=1.6;
        ctx.beginPath(); ctx.moveTo(P.X(a.re),P.Y(a.im)); ctx.lineTo(P.X(sum.re),P.Y(sum.im)); ctx.stroke(); ctx.setLineDash([]);
        cvec(E,P,sum.re,sum.im,GRN,'c = '+cstr(sum.re,sum.im));
      }

      // 좌하 설명
      var px=W*0.05, py=H*0.72;
      ctx.textAlign='left';
      if(s.step===0){ ctx.fillStyle=DIM; ctx.font='13px sans-serif';
        ctx.fillText('+는 원래 int·double에만 쓰는 기호였습니다.', px, py);
        ctx.fillText('operator+ 함수를 정의하면 Complex끼리도 +로 더할 수 있습니다.', px, py+22); }
      else { ctx.fillStyle=CPB; ctx.font='600 15px sans-serif';
        ctx.fillText('a + b  =  a.operator+(b)', px, py);
        ctx.fillStyle='#dfeaf2'; ctx.font='14px ui-monospace,Menlo,monospace';
        ctx.fillText('('+a.re+' + '+b.re+') + ('+a.im+' + '+b.im+')i  =  '+cstr(sum.re,sum.im), px, py+26);
        ctx.fillStyle=GRN; ctx.font='600 16px sans-serif';
        ctx.fillText('c = '+cstr(sum.re,sum.im), px, py+54); }

      E.tapHint(W/2, H*0.94, '화면 탭 = 다음 (a → b → operator+ → 합 c)', true);
      E.big('연산자 오버로딩 — + 에 새 뜻을 주다', '컴퓨터는 원래 1+2 같은 숫자 덧셈만 압니다. 그런데 복소수 (1+2i)와 (3+4i)를 더하고 싶다면? add(a,b) 같은 함수를 부를 수도 있지만, 수학처럼 그냥 a + b라고 쓰면 훨씬 자연스럽죠. C++은 operator+라는 이름의 멤버 함수를 정의하게 해 줍니다 — 그러면 컴파일러가 a + b를 몰래 a.operator+(b) 호출로 바꿔 줍니다. 실수부는 실수부끼리, 허수부는 허수부끼리 더한 새 Complex를 돌려주면 끝. 오른쪽 복소평면에서 두 화살표를 이어 붙이면 그 합이 바로 눈에 보입니다. 연산자에 우리 타입의 뜻을 입히는 것 — 이것이 연산자 오버로딩입니다.'); }
  },

  // ══════════ 2. 단항 연산자 — operator-() · 전위/후위 ++ ══════════
  { id:'cpp9_02',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(340+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 벡터 v=(3,2) → -v=(-3,-2). 카운터 cnt: ++cnt(전위) / cnt++(후위)
      var v={x:3,y:2}; var neg={x:-v.x,y:-v.y};

      var code=[
        {t:'class Point {', dim:true},
        {t:'  int x, y;', dim:true},
        {t:'public:', dim:true},
        {t:'  Point operator-() const {   // 단항 -', hl:'operator-()'},
        {t:'    return Point(-x, -y);', hl:'-x, -y'},
        {t:'  }', dim:true},
        {t:'  Point& operator++() {       // 전위 ++', hl:'operator++()'},
        {t:'    ++x; ++y; return *this;', hl:'++x; ++y'},
        {t:'  }', dim:true},
        {t:'  Point operator++(int) {     // 후위 ++', hl:'operator++(int)'},
        {t:'    Point t=*this; ++x; ++y; return t;', hl:'return t'},
        {t:'  }', dim:true},
        {t:'};', dim:true}
      ];
      var act=[4,7,10][s.step];
      codePanel(E, W*0.04, H*0.11, W*0.50, code, 'unary_ops.cpp', act);

      var px=W*0.05, py=H*0.66;
      ctx.textAlign='left';
      if(s.step===0){
        // -v 시각화
        var P=cplane(W*0.74, H*0.42, Math.min(W*0.05,H*0.08)); drawAxes(E,P,4);
        cvec(E,P,v.x,v.y,CPB,'v = ('+v.x+','+v.y+')');
        cvec(E,P,neg.x,neg.y,PNK,'-v = ('+neg.x+','+neg.y+')');
        ctx.fillStyle=CPB; ctx.font='600 15px sans-serif'; ctx.fillText('단항 -  (부호 뒤집기)', px, py);
        ctx.fillStyle='#dfeaf2'; ctx.font='14px ui-monospace,Menlo,monospace';
        ctx.fillText('-v  =  Point(-('+v.x+'), -('+v.y+'))  =  ('+neg.x+', '+neg.y+')', px, py+26);
        ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.fillText('인자 없는 operator-()가 단항(하나짜리) 마이너스입니다.', px, py+52);
      } else {
        // 카운터 애니: 전위 vs 후위
        var cnt=5;
        var pre_ret, pre_after, post_ret, post_after;
        pre_ret = cnt+1; pre_after = cnt+1;     // ++cnt: 먼저 증가, 증가값 반환
        post_ret = cnt;  post_after = cnt+1;    // cnt++: 옛값 반환, 뒤에서 증가
        ctx.fillStyle=CPB; ctx.font='600 15px sans-serif';
        ctx.fillText(s.step===1?'전위 ++cnt  (먼저 늘리고, 늘어난 값을 씀)':'후위 cnt++  (옛 값을 쓰고, 뒤에서 늘림)', px, py);
        // 박스로 값 흐름 표시
        var bx=px, by=py+18, bw=90, bh=44;
        function vbox(x,label,val,col){ ctx.strokeStyle=col; ctx.lineWidth=1.6; ctx.fillStyle='rgba(255,255,255,0.04)';
          roundRect(ctx,x,by,bw,bh,8); ctx.fill(); ctx.stroke();
          ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText(label, x+bw/2, by+16);
          ctx.fillStyle=col; ctx.font='700 20px ui-monospace,Menlo,monospace'; ctx.fillText(''+val, x+bw/2, by+38); ctx.textAlign='left'; }
        vbox(bx,        'cnt (전)', cnt, DIM);
        vbox(bx+bw+30,  '식의 값',  s.step===1?pre_ret:post_ret, s.step===1?GRN:GLD);
        vbox(bx+2*(bw+30),'cnt (후)', s.step===1?pre_after:post_after, CPB);
        // 화살표
        ctx.strokeStyle=DIM; ctx.lineWidth=1.4;
        ctx.beginPath(); ctx.moveTo(bx+bw+4,by+bh/2); ctx.lineTo(bx+bw+26,by+bh/2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx+2*bw+34,by+bh/2); ctx.lineTo(bx+2*bw+56,by+bh/2); ctx.stroke();
        ctx.fillStyle='#dfeaf2'; ctx.font='13px ui-monospace,Menlo,monospace';
        ctx.fillText(s.step===1? 'int r = ++cnt;  // r='+pre_ret+',  cnt='+pre_after
                               : 'int r = cnt++;  // r='+post_ret+',  cnt='+post_after, px, by+bh+30);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
        ctx.fillText('후위는 옛 값을 복사해 두려고 임시 객체를 만듭니다 → 전위가 더 빠름.', px, by+bh+52);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (단항 - → 전위 ++ → 후위 ++)', true);
      E.big('단항 연산자 — 부호와 증가', '피연산자 하나에만 붙는 연산자도 오버로딩할 수 있습니다. 인자 없는 operator-()는 단항 마이너스 — 점 (3,2)를 (-3,-2)로 부호만 뒤집죠. 재미있는 건 ++입니다. C++엔 ++cnt(전위)와 cnt++(후위) 두 가지가 있고 결과가 다릅니다. 전위 operator++()는 먼저 값을 늘린 뒤 늘어난 자신을 돌려주고, 후위 operator++(int)는 옛 값을 복사해 둔 뒤 늘리고서 그 옛 값을 돌려줍니다. 저 int 매개변수는 값을 쓰지 않는 그저 "이건 후위야"라는 표식일 뿐입니다. 그래서 후위는 임시 복사본이 하나 더 생기고, 그만큼 전위가 미세하게 빠릅니다 — 반복문에서 ++i를 즐겨 쓰는 이유죠.'); }
  },

  // ══════════ 3. 이항 연산자·교환법칙 — friend operator* ══════════
  { id:'cpp9_03',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(340+this.s.step*90,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // c = (2+1i). k=2. k*c 와 c*k 둘 다 = (4+2i)
      var c={re:2,im:1}, k=2;
      var res={re:k*c.re, im:k*c.im};

      var code=[
        {t:'class Complex {', dim:true},
        {t:'  double re, im;', dim:true},
        {t:'public:', dim:true},
        {t:'  // 멤버: c * k  (좌변이 Complex)', dim:true},
        {t:'  Complex operator*(double k) const {', hl:'operator*'},
        {t:'    return Complex(re*k, im*k);', hl:'re*k, im*k'},
        {t:'  }', dim:true},
        {t:'  // friend: k * c  (좌변이 double!)', dim:true},
        {t:'  friend Complex operator*(', hl:'friend'},
        {t:'      double k, const Complex& c) {', hl:'double k'},
        {t:'    return Complex(k*c.re, k*c.im);', hl:'k*c.re, k*c.im'},
        {t:'  }', dim:true},
        {t:'};', dim:true}
      ];
      codePanel(E, W*0.04, H*0.11, W*0.50, code, 'friend_mul.cpp', s.step===1?8:(s.step===2?10:4));

      // 우측: 두 방향 배치 카드
      var bx=W*0.60, by=H*0.20, bw=W*0.34;
      function card(y,expr,method,ok,col,detail){
        ctx.strokeStyle=col; ctx.lineWidth=1.8; ctx.fillStyle='rgba(255,255,255,0.035)';
        roundRect(ctx,bx,y,bw,72,10); ctx.fill(); ctx.stroke();
        ctx.fillStyle=col; ctx.font='700 18px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
        ctx.fillText(expr, bx+16, y+26);
        ctx.fillStyle=ok?GRN:RED; ctx.font='600 13px sans-serif';
        ctx.fillText(ok?'✓ 컴파일 OK':'✗ 오류', bx+bw-96, y+26);
        ctx.fillStyle=DIM; ctx.font='12px ui-monospace,Menlo,monospace';
        ctx.fillText(method, bx+16, y+46);
        ctx.fillStyle='#dfeaf2'; ctx.font='12.5px sans-serif';
        ctx.fillText(detail, bx+16, y+64);
      }
      card(by,      'c * '+k, 'Complex::operator*(double)', true, CPB, '좌변 c가 자기 멤버함수를 호출');
      if(s.step>=1) card(by+92, k+' * c', s.step>=2?'friend operator*(double,Complex)':'멤버 함수로는… 불가능', s.step>=2, s.step>=2?GRN:RED, s.step>=2?'좌변 2는 friend 전역함수가 처리':'2.operator*(c)? int엔 멤버함수 못 넣음');

      var px=W*0.05, py=H*0.70;
      ctx.textAlign='left';
      if(s.step===0){ ctx.fillStyle=DIM; ctx.font='13px sans-serif';
        ctx.fillText('c * 2 는 멤버 operator*로 잘 됩니다. 그런데 2 * c 는?', px, py);
        ctx.fillText('탭 = 2 * c 를 시도 → 문제 → friend로 해결', px, py+22); }
      else if(s.step===1){ ctx.fillStyle=RED; ctx.font='600 14px sans-serif';
        ctx.fillText('멤버 함수는 좌변이 반드시 그 클래스여야 합니다.', px, py);
        ctx.fillStyle=DIM; ctx.font='13px sans-serif';
        ctx.fillText('2 * c 는 2.operator*(c) 여야 하는데 int(2)엔 멤버함수를 넣을 수 없죠.', px, py+22); }
      else { ctx.fillStyle=GRN; ctx.font='600 15px sans-serif';
        ctx.fillText('friend 전역 함수 operator*(double, Complex)로 해결!', px, py);
        ctx.fillStyle='#dfeaf2'; ctx.font='14px ui-monospace,Menlo,monospace';
        ctx.fillText('2 * (2+1i)  =  (4+2i)     (2+1i) * 2  =  (4+2i)', px, py+26);
        ctx.fillStyle=CPB; ctx.font='600 13px sans-serif';
        ctx.fillText('두 방향 모두 = '+cstr(res.re,res.im)+'  → 교환법칙 회복', px, py+52); }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (c*k → k*c 문제 → friend 해결)', true);
      E.big('이항 연산자와 교환법칙 — friend의 쓸모', '수학에서 2 × c와 c × 2는 같아야 합니다. 그런데 멤버 함수로 만든 operator*는 좌변이 반드시 그 클래스여야 한다는 제약이 있습니다. c * 2는 c.operator*(2)로 잘 풀리지만, 2 * c는 2.operator*(c)가 되어야 하는데 int인 2에는 멤버 함수를 붙일 수 없죠. 그래서 좌변이 클래스가 아닌 경우엔 클래스 바깥의 전역 함수 operator*(double, Complex)를 씁니다. 이 전역 함수가 클래스의 private 멤버(re, im)에 손대야 하니 friend로 선언해 특별 출입증을 주는 것입니다. 이제 2*c도 c*2도 똑같이 (4+2i) — 교환법칙이 회복됩니다. friend는 캡슐화를 조금 여는 대신 이렇게 자연스러운 문법을 얻는 도구입니다.'); }
  },

  // ══════════ 4. << >> — cout/cin의 정체 ══════════
  { id:'cpp9_04',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*80,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var c={re:3,im:4};
      var out='(3 + 4i)'; // operator<<가 만들 실제 문자열

      var code=[
        {t:'#include <iostream>', dim:true},
        {t:'ostream& operator<<(ostream& os,', hl:'ostream&'},
        {t:'                    const Complex& c) {', hl:'const Complex&'},
        {t:'  os << "(" << c.re << " + "', hl:'os <<'},
        {t:'     << c.im << "i)";', hl:'c.im'},
        {t:'  return os;    // 연쇄를 위해 os 반환', hl:'return os'},
        {t:'}', dim:true},
        {t:'Complex c(3,4);', hl:'c(3,4)'},
        {t:'cout << c << endl;   // (3 + 4i)', hl:'cout << c'}
      ];
      codePanel(E, W*0.04, H*0.13, W*0.50, code, 'stream_out.cpp', s.step===0?3:(s.step===1?5:8));

      // 우측: cout이 << 로 흐르는 파이프라인
      var px=W*0.58, py=H*0.22;
      ctx.textAlign='left';
      ctx.fillStyle=CPB; ctx.font='600 14px sans-serif';
      ctx.fillText('cout 은 그냥 ostream 객체입니다.', px, py);
      ctx.fillStyle=DIM; ctx.font='13px sans-serif';
      ctx.fillText('<< 는 "출력 스트림에 밀어넣기" 연산자.', px, py+22);

      // 흐름: cout << c  →  operator<<(cout, c)  →  "(3 + 4i)"
      var fy=py+56, bh=40, bw=W*0.30;
      function fbox(y,txt,col){ ctx.strokeStyle=col; ctx.lineWidth=1.6; ctx.fillStyle='rgba(255,255,255,0.04)';
        roundRect(ctx,px,y,bw,bh,8); ctx.fill(); ctx.stroke();
        ctx.fillStyle=col; ctx.font='13px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
        ctx.fillText(txt, px+12, y+25); }
      function down(y){ ctx.strokeStyle=DIM; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(px+bw/2,y); ctx.lineTo(px+bw/2,y+16); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px+bw/2-4,y+11); ctx.lineTo(px+bw/2,y+16); ctx.lineTo(px+bw/2+4,y+11); ctx.fillStyle=DIM; ctx.fill(); }
      fbox(fy,           'cout << c', CPB);
      if(s.step>=1){ down(fy+bh); fbox(fy+bh+16, 'operator<<(cout, c)', GLD); }
      if(s.step>=2){ down(fy+2*bh+16); fbox(fy+2*bh+32, 'os << "(" << 3 << " + " << 4 << "i)"', BLU); }

      // 실제 콘솔 출력 박스
      if(s.step>=2){
        var oy=fy+3*bh+48;
        ctx.fillStyle='#0c0f16'; ctx.strokeStyle='rgba(126,224,176,0.5)'; ctx.lineWidth=1.4;
        roundRect(ctx,px,oy,bw,38,8); ctx.fill(); ctx.stroke();
        ctx.fillStyle=DIM; ctx.font='10px sans-serif'; ctx.textAlign='left'; ctx.fillText('콘솔 출력', px+10, oy+14);
        ctx.fillStyle=GRN; ctx.font='700 18px ui-monospace,Menlo,monospace'; ctx.fillText(out, px+10, oy+31);
      }

      var lpx=W*0.05, lpy=H*0.78;
      ctx.textAlign='left'; ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
      if(s.step<2) ctx.fillText('탭 = cout << c 가 어떻게 함수 호출로 바뀌는지 따라가 보세요.', lpx, lpy);
      else { ctx.fillStyle=CPB; ctx.font='600 13px sans-serif';
        ctx.fillText('return os; 덕분에 cout << a << b << c 처럼 줄줄이 연쇄됩니다.', lpx, lpy); }

      E.tapHint(W/2, H*0.94, '화면 탭 = 다음 (operator<< 정의 → 함수 호출 → 콘솔 출력)', true);
      E.big('<< 의 정체 — cout은 왜 << 로 출력할까', 'C++를 처음 배울 때 외운 cout << "Hello"의 << — 사실 이것도 오버로딩된 연산자입니다! cout은 마법이 아니라 그저 ostream 타입의 객체이고, <<는 "이 스트림에 값을 밀어넣어라"라는 이항 연산자죠. 그래서 우리 Complex를 cout으로 찍고 싶으면 operator<<(ostream&, const Complex&)를 직접 정의하면 됩니다. 안에서 os << "(" << c.re ... 로 조각들을 흘려보내고, 마지막에 return os; 로 스트림 자신을 돌려줍니다. 바로 이 반환 덕분에 cout << a << b << c가 왼쪽부터 차례로 os를 물려주며 연쇄되는 것이죠. 지금껏 써 온 출력의 정체가 오버로딩이었다는 게 이 장의 재미입니다.'); }
  },

  // ══════════ 5. [] 첨자 연산자 — 안전한 배열 ══════════
  { id:'cpp9_05',
    enter:function(E){ var self=this; this.s={i:2, oob:false};
      E.controls('<div class="ctrl"><label>arr[ i ] — 인덱스 i</label><input type="range" id="idx" min="-1" max="5" step="1" value="2"><output id="idxo">2</output></div>');
      E.bind('#idx','input',function(e){ self.s.i=+e.target.value; document.getElementById('idxo').textContent=e.target.value; E.blip(360,0.06); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 실제 배열 데이터, 크기 5. 경계검사 실측
      var data=[10,20,30,40,50], N=data.length;
      var i=s.i, inRange=(i>=0 && i<N);
      var val = inRange ? data[i] : null;

      var code=[
        {t:'class SafeArray {', dim:true},
        {t:'  int a[5]; int n = 5;', dim:true},
        {t:'public:', dim:true},
        {t:'  int& operator[](int i) {', hl:'operator[]'},
        {t:'    if (i < 0 || i >= n)', hl:'i < 0 || i >= n'},
        {t:'      throw out_of_range("index!");', hl:'throw'},
        {t:'    return a[i];   // 참조 반환 → 쓰기도 가능', hl:'return a[i]'},
        {t:'  }', dim:true},
        {t:'};', dim:true},
        {t:'SafeArray arr;', dim:true},
        {t:'int x = arr['+i+'];'+(inRange?'   // = '+val:'   // throw!'), hl:'arr['+i+']'}
      ];
      var act = inRange ? 6 : 5;
      codePanel(E, W*0.04, H*0.12, W*0.50, code, 'safe_array.cpp', act);

      // 우측: 배열 칸 + 인덱스 포인터
      var bx=W*0.58, by=H*0.30, cw=Math.min(W*0.062,64), cellH=44;
      ctx.fillStyle='#dfeaf2'; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
      ctx.fillText('SafeArray  (크기 5)', bx, by-16);
      for(var k=0;k<N;k++){
        var x=bx+k*cw, sel=(k===i);
        ctx.fillStyle= sel ? 'rgba(90,180,232,0.22)' : 'rgba(255,255,255,0.04)';
        ctx.fillRect(x, by, cw-4, cellH);
        ctx.strokeStyle= sel ? CPB : 'rgba(255,255,255,0.14)'; ctx.lineWidth= sel?2.2:1;
        ctx.strokeRect(x, by, cw-4, cellH);
        ctx.fillStyle= sel?CPB:'#dfeaf2'; ctx.font='700 18px ui-monospace,Menlo,monospace'; ctx.textAlign='center';
        ctx.fillText(''+data[k], x+(cw-4)/2, by+cellH/2+6);
        ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.fillText('['+k+']', x+(cw-4)/2, by+cellH+16);
      }
      // 인덱스 화살표(범위 밖이면 배열 옆 빨간 표시)
      if(inRange){
        var ax=bx+i*cw+(cw-4)/2;
        ctx.strokeStyle=CPB; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(ax,by-40); ctx.lineTo(ax,by-6); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ax-5,by-12); ctx.lineTo(ax,by-6); ctx.lineTo(ax+5,by-12); ctx.fillStyle=CPB; ctx.fill();
        ctx.fillStyle=CPB; ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.fillText('i='+i, ax, by-46);
      } else {
        var ex = i<0 ? bx-30 : bx+N*cw+8;
        ctx.fillStyle=RED; ctx.font='700 30px sans-serif'; ctx.textAlign='center'; ctx.fillText('✗', ex, by+cellH/2+6);
      }

      // 결과 박스
      var oy=by+cellH+50;
      ctx.textAlign='left';
      if(inRange){
        ctx.fillStyle=GRN; ctx.font='700 20px sans-serif'; ctx.fillText('arr['+i+']  =  '+val, bx, oy);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
        ctx.fillText('int& 참조를 반환하므로 arr['+i+'] = 99; 처럼 쓰기도 됩니다.', bx, oy+24);
      } else {
        ctx.fillStyle=RED; ctx.font='700 18px sans-serif'; ctx.fillText('arr['+i+']  →  out_of_range 예외!', bx, oy);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
        ctx.fillText('생 C 배열이라면 조용히 엉뚱한 메모리를 읽습니다 — 여기선 잡아냅니다.', bx, oy+24);
      }

      var lpx=W*0.05, lpy=H*0.80;
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
      ctx.fillText('operator[] 를 정의하면 우리 객체를 arr[i] 처럼 배열같이 쓸 수 있습니다.', lpx, lpy);
      ctx.fillStyle=CPB; ctx.fillText('여기선 경계검사를 넣어 "안전한 배열"을 만들었습니다.', lpx, lpy+20);

      E.tapHint(W/2, H*0.95, '슬라이더로 인덱스 i를 바꿔 접근·경계검사를 보세요', true);
      E.big('[] 등 기타 연산자 — 객체를 배열처럼', '연산자 오버로딩은 산술에만 쓰이지 않습니다. operator[]를 정의하면 우리 객체에 arr[i]라는 첨자 문법을 붙여, 마치 진짜 배열처럼 다룰 수 있습니다. 게다가 int& (참조)를 돌려주면 arr[i]를 읽는 것뿐 아니라 arr[i] = 99처럼 값을 쓰는 것도 됩니다 — 대입식의 왼쪽에 설 수 있는 것이죠. 진짜 C 배열은 범위를 넘어가도 조용히 엉뚱한 메모리를 건드려 버그의 온상이 됩니다. 그래서 operator[] 안에 경계 검사를 넣어, 잘못된 인덱스면 예외를 던지는 "안전한 배열"을 만들 수 있습니다. 슬라이더로 인덱스를 -1이나 5로 밀어 보면, 생 배열이라면 지나쳤을 실수를 이 클래스가 딱 잡아내는 게 보입니다. STL의 vector, string, map이 모두 이 operator[]로 대괄호 문법을 제공합니다 — 다음 장 템플릿과 함께 그 세계로 들어갑니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
