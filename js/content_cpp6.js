/* C++ 제6장 — static·const·friend (윤성우 열혈C++ + Effective C++)
   static 멤버변수 · static 멤버함수 · const 멤버함수 · friend · mutable/const
   동작(behavior)만. 텍스트=content/cpp6.json. 엔진 js/engine.js 공유. 색: C++=블루(#5ab4e8).
   골든룰: 화면의 모든 카운트·접근 허용/차단·매트릭스는 draw에서 실제로 계산(결정적). 베껴 박지 않음. */
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
  function objBox(ctx, x, y, w, title, fields, accent, tcol){
    accent=accent||CPB; tcol=tcol||'#dfeaf2';
    var rowH=24, ht=28+fields.length*rowH+8;
    ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.strokeStyle=accent; ctx.lineWidth=1.6;
    roundRect(ctx,x,y,w,ht,9); ctx.fill(); ctx.stroke();
    ctx.fillStyle=accent; ctx.font='700 13px sans-serif'; ctx.textAlign='left'; ctx.fillText(title, x+12, y+19);
    ctx.font='12.5px ui-monospace,Menlo,monospace';
    for(var i=0;i<fields.length;i++){ var fy=y+28+i*rowH;
      ctx.fillStyle=DIM; ctx.fillText(fields[i][0], x+14, fy+15);
      ctx.fillStyle=tcol; ctx.textAlign='right'; ctx.fillText(''+fields[i][1], x+w-12, fy+15); ctx.textAlign='left'; }
    return y+ht;
  }
  function arrow(ctx, x0,y0,x1,y1, col, dash){
    ctx.strokeStyle=col; ctx.lineWidth=2; if(dash) ctx.setLineDash(dash); else ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x1,y1); ctx.stroke(); ctx.setLineDash([]);
    var a=Math.atan2(y1-y0,x1-x0); ctx.fillStyle=col;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x1-9*Math.cos(a-0.4),y1-9*Math.sin(a-0.4)); ctx.lineTo(x1-9*Math.cos(a+0.4),y1-9*Math.sin(a+0.4)); ctx.closePath(); ctx.fill();
  }

  var scenes = [

  // ══════════ 1. static 멤버변수 — 모든 객체가 공유 ══════════
  { id:'cpp6_01',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 실제 카운트: 생성자 호출마다 count++. step = 지금까지 만든 객체 수(0..3)
      var made=s.step;   // step0→0개, step3→3개
      var code=[
        {t:'class Widget {', dim:true},
        {t:'  static int count;   // 클래스에 하나', hl:'static int count'},
        {t:'public:', dim:true},
        {t:'  Widget(){ ++count; }   // 생성마다 증가', hl:'++count'},
        {t:'  ~Widget(){ --count; }', dim:true},
        {t:'  static int howMany(){ return count; }', hl:'howMany'},
        {t:'};', dim:true},
        {t:'int Widget::count = 0;   // 딱 한 번 정의', hl:'Widget::count = 0'},
        {t:'Widget a, b, c;   // 세 개 생성', hl:'a, b, c'},
        {t:'Widget::howMany();  // → '+made, dim:true}
      ];
      var act=[7,3,3,5][s.step];
      codePanel(E, W*0.04, H*0.12, W*0.47, code, 'static_var.cpp', act);

      // 우측: 여러 객체 상자 + 공유 static 상자
      var ox=W*0.56, bw=W*0.12, gap=W*0.135;
      var names=['a','b','c'];
      for(var i=0;i<3;i++){ var on=(i<made);
        ctx.globalAlpha=on?1:0.22;
        objBox(ctx, ox+i*gap, H*0.22, bw, names[i], [['id',on?'#'+(i+1):'—']], on?CPB:DIM);
        ctx.globalAlpha=1;
      }
      // 공유 static 상자 (아래 중앙)
      var scx=W*0.60, scy=H*0.56, scw=W*0.24;
      ctx.fillStyle='rgba(255,211,122,0.10)'; ctx.strokeStyle=GLD; ctx.lineWidth=2;
      roundRect(ctx, scx, scy, scw, 62, 10); ctx.fill(); ctx.stroke();
      ctx.fillStyle=GLD; ctx.font='700 13px sans-serif'; ctx.textAlign='left';
      ctx.fillText('static count  (모든 객체가 공유하는 하나)', scx+12, scy+20);
      ctx.fillStyle=GLD; ctx.font='700 26px ui-monospace,monospace'; ctx.textAlign='center';
      ctx.fillText(''+made, scx+scw/2, scy+50);
      // 각 살아있는 객체 → 공유 상자로 화살표
      for(i=0;i<made;i++){ arrow(ctx, ox+i*gap+bw/2, H*0.22+52, scx+scw*(0.3+i*0.2), scy-4, GLD, [4,4]); }

      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText('객체마다 따로 있는 게 아니라, 클래스 전체에 단 하나 — 그래서 "몇 개 만들어졌나"를 셀 수 있죠.', W*0.05, H*0.80);
      ctx.fillStyle=CPD; ctx.font='12.5px sans-serif';
      ctx.fillText('static 멤버변수는 클래스 밖에서 딱 한 번 정의(int Widget::count = 0;)해야 합니다.', W*0.05, H*0.85);
      ctx.fillStyle=GRN; ctx.font='600 13px sans-serif';
      ctx.fillText('지금 살아있는 Widget = '+made+'개  (실측 카운트)', W*0.05, H*0.905);

      E.tapHint(W/2, H*0.95, '화면 탭 = 객체 하나씩 생성 (공유 count 증가)', true);
      E.big('static 멤버변수 — 클래스에 단 하나뿐인 값', '보통 멤버변수는 객체마다 따로 존재하지만, static을 붙이면 클래스 전체에 단 하나만 만들어지고 모든 객체가 그것을 함께 씁니다. 가장 흔한 쓰임이 “객체 개수 세기” — 생성자에서 ++count, 소멸자에서 --count 하면 지금 몇 개가 살아 있는지 언제든 알 수 있죠. static 변수는 특정 객체의 것이 아니라 클래스의 것이므로, 선언만으로는 부족하고 클래스 밖에서 int Widget::count = 0; 처럼 딱 한 번 “정의”해 실제 저장 공간을 잡아 줘야 합니다. 화면의 카운트는 실제로 생성자를 부른 만큼 증가한 값입니다 — 세 객체가 하나의 상자를 함께 바라보는 그림이 static의 본질입니다.'); }
  },

  // ══════════ 2. static 멤버함수 — 객체 없이 호출 ══════════
  { id:'cpp6_02',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(340+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var bad=(s.step===1);
      var code=[
        {t:'class Math {', dim:true},
        {t:'  static int calls;    // static 멤버', hl:'static int calls'},
        {t:'  int seed;            // 인스턴스 멤버', hl:'int seed'},
        {t:'public:', dim:true},
        {t:'  static int square(int x){', hl:'static int square'},
        {t:'    ++calls;      // static 접근 OK', hl:'calls'},
        bad ? {t:'    return x*x + seed;  // ✗ seed 접근 불가', hl:'seed'}
            : {t:'    return x * x;      // this 없음', hl:'x * x'},
        {t:'  }', dim:true},
        {t:'};', dim:true},
        {t:'Math::square(7);   // 객체 없이 호출!', hl:'Math::square(7)'}
      ];
      var act=bad?6:9;
      codePanel(E, W*0.04, H*0.12, W*0.48, code, 'static_func.cpp', act);

      var px=W*0.56, py=H*0.22;
      if(!bad){
        // 정상 호출: 클래스 이름으로 직접 호출, 결과 실계산
        ctx.textAlign='left'; ctx.fillStyle=CPB; ctx.font='700 15px sans-serif';
        ctx.fillText('Math::square(7)  — 인스턴스 없이 클래스에서 직접', px, py);
        // 클래스 상자
        ctx.fillStyle='rgba(90,180,232,0.08)'; ctx.strokeStyle=CPB; ctx.lineWidth=1.8;
        roundRect(ctx, px, py+20, W*0.34, 74, 10); ctx.fill(); ctx.stroke();
        ctx.fillStyle=CPB; ctx.font='700 13px sans-serif'; ctx.fillText('class Math', px+14, py+42);
        ctx.fillStyle='#dfeaf2'; ctx.font='13px ui-monospace,monospace';
        var res=7*7;
        ctx.fillText('square(7) → 7 * 7 = '+res, px+14, py+66);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('객체(a.square) 없이 스코프 연산자 :: 로 호출', px+14, py+86);
        ctx.fillStyle=GRN; ctx.font='700 16px sans-serif';
        ctx.fillText('반환값 = '+res+'  (실계산)', px, py+128);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
        ctx.fillText('static 멤버함수엔 this 포인터가 없습니다 — 그래서 특정 객체의 멤버(seed)는 못 봅니다.', W*0.05, H*0.86);
        ctx.fillText('오직 static 멤버(calls)만 만질 수 있죠. 탭하면 그 규칙을 어겼을 때를 봅니다.', W*0.05, H*0.905);
      } else {
        // 위반: 인스턴스 멤버 seed 접근 → 컴파일 에러 개념
        ctx.textAlign='left'; ctx.fillStyle=RED; ctx.font='700 15px sans-serif';
        ctx.fillText('규칙 위반 — static 함수가 인스턴스 멤버 seed 접근', px, py);
        ctx.fillStyle='rgba(240,136,138,0.08)'; ctx.strokeStyle=RED; ctx.lineWidth=1.8;
        roundRect(ctx, px, py+20, W*0.36, 96, 10); ctx.fill(); ctx.stroke();
        ctx.fillStyle=RED; ctx.font='600 12.5px ui-monospace,monospace';
        ctx.fillText("error: invalid use of member", px+14, py+44);
        ctx.fillText("  'Math::seed' in static", px+14, py+62);
        ctx.fillText("  member function", px+14, py+80);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('this 가 없어 어느 객체의 seed 인지 알 수 없음', px+14, py+102);
        ctx.fillStyle=CPD; ctx.font='12.5px sans-serif';
        ctx.fillText('static 멤버함수는 “어떤 객체”에 매이지 않은, 클래스에 소속된 유틸리티입니다.', W*0.05, H*0.86);
        ctx.fillText('그래서 static 데이터만 다룰 수 있고, 인스턴스 데이터엔 손댈 수 없습니다.', W*0.05, H*0.905);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 정상 호출 ↔ 규칙 위반(인스턴스 멤버 접근)', true);
      E.big('static 멤버함수 — 객체가 필요 없는 함수', 'static 멤버함수는 특정 객체가 아니라 클래스 자체에 소속됩니다. 그래서 인스턴스를 만들지 않고 Math::square(7)처럼 클래스 이름과 스코프 연산자(::)로 곧장 부르죠. 팩토리 함수, 유틸리티, static 카운터를 읽는 howMany() 같은 것들이 대표적입니다. 대신 큰 제약이 하나 있습니다 — this 포인터가 없다는 것. static 함수가 실행될 때는 “어느 객체”라는 맥락이 아예 없으므로, 인스턴스 멤버변수(seed)나 비-static 멤버함수엔 접근할 수 없습니다. 오직 static 멤버만 다룰 수 있죠. 이 규칙을 어기면 컴파일러가 “어느 객체의 seed냐”며 딱 잘라 거부합니다.'); }
  },

  // ══════════ 3. const 멤버함수 — 객체 상태 불변 보장 (Effective 항목3) ══════════
  { id:'cpp6_03',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(340+this.s.step*90,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'class Account {', dim:true},
        {t:'  int balance;', dim:true},
        {t:'public:', dim:true},
        {t:'  int get() const {      // 읽기 전용 약속', hl:'const'},
        {t:'    return balance;      // OK: 읽기만', hl:'return balance'},
        {t:'  }', dim:true},
        {t:'  void deposit(int n){ balance += n; }', hl:'balance += n'},
        {t:'};', dim:true},
        {t:'const Account acc{100};   // const 객체', hl:'const Account'},
        {t:'acc.get();       // OK (const 함수)', hl:'acc.get()'},
        {t:'acc.deposit(50); // ✗ 비-const 함수', hl:'acc.deposit'}
      ];
      var act=[3,9,10][s.step];
      codePanel(E, W*0.04, H*0.11, W*0.48, code, 'const_member.cpp', act);

      var px=W*0.58, py=H*0.22;
      ctx.textAlign='left';
      // const 객체 상자
      objBox(ctx, px, py, W*0.32, 'const Account acc', [['balance','100']], (s.step===2?RED:CPB));

      // 두 함수 접근 결과 표
      var ty=py+120;
      ctx.fillStyle='#dfeaf2'; ctx.font='600 13px sans-serif'; ctx.fillText('const 객체 → 어떤 멤버함수를 부를 수 있나', px, ty);
      var funcs=[
        { name:'get() const', ok:true },
        { name:'deposit(int)', ok:false }
      ];
      for(var i=0;i<2;i++){ var ry=ty+18+i*34, f=funcs[i];
        var show = (i===0) || (s.step>=2);   // deposit 결과는 step2에서 강조
        var col = f.ok?GRN:RED;
        ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.strokeStyle=col; ctx.lineWidth=1.4;
        roundRect(ctx, px, ry, W*0.32, 28, 6); ctx.fill(); ctx.stroke();
        ctx.fillStyle='#dfeaf2'; ctx.font='12.5px ui-monospace,monospace'; ctx.textAlign='left';
        ctx.fillText('acc.'+f.name, px+12, ry+18);
        ctx.fillStyle=col; ctx.font='700 12.5px sans-serif'; ctx.textAlign='right';
        ctx.fillText(f.ok?'허용 ✔':'거부 ✗', px+W*0.32-12, ry+18); ctx.textAlign='left';
      }

      var bx=W*0.05, by=H*0.80;
      if(s.step===0){ ctx.fillStyle=CPB; ctx.font='600 14px sans-serif'; ctx.fillText('int get() const — 이 함수는 객체를 절대 바꾸지 않겠다는 약속', bx, by); }
      else if(s.step===1){ ctx.fillStyle=GRN; ctx.font='600 14px sans-serif'; ctx.fillText('const 객체 acc는 “안 바꾸겠다”는 함수(get)만 부를 수 있습니다.', bx, by); }
      else { ctx.fillStyle=RED; ctx.font='600 14px sans-serif'; ctx.fillText('acc.deposit(50) → 컴파일 에러: const 객체에 비-const 함수 호출 불가', bx, by); }
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
      ctx.fillText('만약 const 함수 안에서 멤버를 바꾸려 하면(balance += n) 컴파일러가 그 자리에서 막습니다.', bx, by+24);

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (const 함수 → const 객체 → 위반)', true);
      E.big('const 멤버함수 — “나는 객체를 바꾸지 않는다”는 약속', '함수 뒤에 붙는 const는 “이 함수는 객체의 상태를 절대 건드리지 않겠다”는 컴파일러와의 계약입니다. int get() const 안에서 실수로 멤버를 수정하면(balance += n) 컴파일이 즉시 거부되죠 — 약속을 코드로 강제하는 셈입니다. 이 구분이 왜 중요할까요? const 객체나 const 참조로 넘어온 객체는 오직 const 멤버함수만 부를 수 있기 때문입니다. 만약 get()에 const를 안 붙였다면, const Account를 받아 잔액을 읽는 것조차 불가능해집니다. Effective C++은 “바꾸지 않는 멤버함수엔 반드시 const를 붙이라”고 못 박습니다 — 이 작은 키워드 하나가 const 정확성(const-correctness)이라는 큰 안전망을 짜 줍니다.'); }
  },

  // ══════════ 4. friend — private 접근 허용 ══════════
  { id:'cpp6_04',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(340+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var isFriend=(s.step===1);
      var code=[
        {t:'class Box {', dim:true},
        {t:'  int secret = 42;   // private', hl:'private'},
        isFriend ? {t:'  friend void peek(const Box&);', hl:'friend'}
                 : {t:'  // (friend 선언 없음)', dim:true},
        {t:'};', dim:true},
        {t:'void peek(const Box& b){', hl:'peek'},
        isFriend ? {t:'  std::cout << b.secret;  // OK ✔', hl:'b.secret'}
                 : {t:'  std::cout << b.secret;  // ✗ 접근 불가', hl:'b.secret'},
        {t:'}', dim:true},
        {t:'peek(box);', hl:'peek(box)'}
      ];
      codePanel(E, W*0.04, H*0.13, W*0.48, code, 'friend.cpp', 5);

      // 우측: Box 상자(private 벽) + 외부 함수 peek + 접근선
      var bxX=W*0.58, bxY=H*0.24, bxW=W*0.24, bxH=110;
      // private 벽 (점선 테두리)
      ctx.fillStyle='rgba(90,180,232,0.06)'; ctx.strokeStyle=CPB; ctx.lineWidth=1.8; ctx.setLineDash([6,4]);
      roundRect(ctx, bxX, bxY, bxW, bxH, 10); ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=CPB; ctx.font='700 13px sans-serif'; ctx.textAlign='left'; ctx.fillText('class Box', bxX+12, bxY+22);
      // secret 자물쇠 칸
      ctx.fillStyle='rgba(244,160,192,0.12)'; ctx.strokeStyle=PNK; ctx.lineWidth=1.4;
      roundRect(ctx, bxX+14, bxY+40, bxW-28, 40, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle=PNK; ctx.font='700 13px ui-monospace,monospace'; ctx.fillText('🔒 secret = 42', bxX+26, bxY+65);
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.fillText('private', bxX+bxW-58, bxY+96);

      // 외부 함수 peek
      var fx=W*0.58, fy=H*0.62, fw=W*0.24;
      ctx.fillStyle='rgba(255,211,122,0.08)'; ctx.strokeStyle=isFriend?GRN:RED; ctx.lineWidth=1.8;
      roundRect(ctx, fx, fy, fw, 44, 9); ctx.fill(); ctx.stroke();
      ctx.fillStyle=isFriend?GRN:RED; ctx.font='700 13px sans-serif'; ctx.fillText('void peek()  (외부 함수)', fx+12, fy+27);

      // 접근선: friend면 초록 통과, 아니면 빨강 차단
      var lineX=fx+fw*0.5;
      if(isFriend){
        arrow(ctx, lineX, fy-4, bxX+bxW*0.5, bxY+bxH-6, GRN, [5,4]);
        ctx.fillStyle=GRN; ctx.font='700 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('friend 선언 → private 벽 통과 (secret=42 읽음)', W*0.05, H*0.85);
      } else {
        // 차단 X
        ctx.strokeStyle=RED; ctx.lineWidth=2.4;
        ctx.beginPath(); ctx.moveTo(lineX, fy-4); ctx.lineTo(bxX+bxW*0.5, bxY+bxH-6); ctx.stroke();
        var mx=(lineX+bxX+bxW*0.5)/2, my=(fy-4+bxY+bxH-6)/2;
        ctx.beginPath(); ctx.moveTo(mx-10,my-10); ctx.lineTo(mx+10,my+10); ctx.moveTo(mx+10,my-10); ctx.lineTo(mx-10,my+10); ctx.stroke();
        ctx.fillStyle=RED; ctx.font='700 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('friend 아님 → error: secret is private', W*0.05, H*0.85);
      }
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText('friend는 클래스가 “너에게만 내 속을 보여 줄게”라고 콕 집어 허락하는 것 — 함수·클래스 모두 지정 가능.', W*0.05, H*0.905);

      E.tapHint(W/2, H*0.95, '화면 탭 = friend 없음(차단) ↔ friend 선언(허용)', true);
      E.big('friend — 특별히 초대한 손님에게만 여는 문', '캡슐화의 원칙은 private을 외부로부터 감추는 것이지만, 때로는 특정 외부 함수나 클래스에게만 예외적으로 속을 보여 주고 싶을 때가 있습니다. 그럴 때 클래스 안에 friend void peek(...); 또는 friend class B; 라고 선언하면, 그 함수·클래스는 이 객체의 private 멤버에 직접 손을 뻗을 수 있죠. 흔한 예가 두 객체를 비교·연산하는 함수(연산자 오버로딩)나, 긴밀히 협력하는 짝 클래스입니다. 주의할 점 — friend는 클래스가 스스로 “너를 믿는다”고 내리는 결정이지, 외부가 억지로 비집고 드는 게 아닙니다. 그래서 캡슐화를 깨는 게 아니라 “의도된 예외”이며, 남발하면 오히려 결합도가 높아지니 꼭 필요한 곳에만 씁니다.'); }
  },

  // ══════════ 5. mutable · const 객체 — 접근 매트릭스 ══════════
  { id:'cpp6_05',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(340+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'class Cache {', dim:true},
        {t:'  int value;', dim:true},
        {t:'  mutable int hits = 0;   // const에서도 변경 가능', hl:'mutable'},
        {t:'public:', dim:true},
        {t:'  int read() const {', hl:'const'},
        {t:'    ++hits;    // mutable → OK', hl:'++hits'},
        {t:'    return value;   // 일반 멤버는 읽기만', hl:'return value'},
        {t:'  }', dim:true},
        {t:'};', dim:true},
        {t:'const Cache c;', hl:'const Cache'},
        {t:'c.read();   // value 불변, hits는 늘어남', hl:'c.read()'}
      ];
      codePanel(E, W*0.04, H*0.11, W*0.48, code, 'mutable.cpp', s.step===0?2:5);

      // 우측: 접근 매트릭스 (행=멤버 종류, 열=const 함수 안에서 쓰기 가능?)
      var mx=W*0.56, my=H*0.20, cw=W*0.14, rh=40;
      var rows=[
        { name:'일반 멤버 value', read:true, write:false },
        { name:'mutable 멤버 hits', read:true, write:true }
      ];
      // 헤더
      ctx.fillStyle='#dfeaf2'; ctx.font='600 12.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText('const 멤버함수 안에서…', mx, my-8);
      ctx.textAlign='center';
      ctx.fillStyle=CPD; ctx.fillText('읽기', mx+W*0.20+cw*0.5, my+18);
      ctx.fillStyle=CPD; ctx.fillText('쓰기', mx+W*0.20+cw*1.5, my+18);
      for(var i=0;i<2;i++){ var ry=my+30+i*(rh+10), r=rows[i];
        ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.strokeStyle=(i===1?GLD:CPB); ctx.lineWidth=1.5;
        roundRect(ctx, mx, ry, W*0.20, rh, 8); ctx.fill(); ctx.stroke();
        ctx.fillStyle=(i===1?GLD:'#dfeaf2'); ctx.font='12.5px ui-monospace,monospace'; ctx.textAlign='left';
        ctx.fillText(r.name, mx+12, ry+rh/2+5);
        // 읽기 / 쓰기 셀
        var cells=[r.read, r.write];
        for(var c=0;c<2;c++){ var cx=mx+W*0.20+c*cw;
          var ok=cells[c];
          ctx.fillStyle= ok?'rgba(126,224,176,0.14)':'rgba(240,136,138,0.12)';
          ctx.strokeStyle= ok?GRN:RED; ctx.lineWidth=1.4;
          roundRect(ctx, cx, ry, cw-8, rh, 8); ctx.fill(); ctx.stroke();
          ctx.fillStyle= ok?GRN:RED; ctx.font='700 15px sans-serif'; ctx.textAlign='center';
          ctx.fillText(ok?'✔':'✗', cx+(cw-8)/2, ry+rh/2+6);
        }
      }
      ctx.textAlign='left';

      // 실측 hits 카운트: read() 를 부른 만큼 (step 반영: 여기선 개념적으로 2회 예시)
      var reads = (s.step===0)?1:3;
      ctx.fillStyle=GLD; ctx.font='600 14px sans-serif';
      ctx.fillText('const 객체 c 에서 read() 를 '+reads+'번 호출:', mx, my+30+2*(rh+10)+24);
      ctx.fillStyle='#dfeaf2'; ctx.font='13px ui-monospace,monospace';
      ctx.fillText('value = 그대로 (불변)      hits = '+reads+'  (mutable이라 증가)', mx, my+30+2*(rh+10)+48);

      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
      ctx.fillText('mutable은 “논리적으로는 안 바뀐 척, 물리적으로만 바뀌는” 멤버 — 캐시·히트 카운터·잠금 플래그 등에 씁니다.', W*0.05, H*0.87);
      ctx.fillStyle=CPD; ctx.font='12.5px sans-serif';
      ctx.fillText('정리: const 객체·const 참조 → const 함수만 · const 함수 안 → 일반 멤버 읽기만 · 단, mutable은 예외.', W*0.05, H*0.915);

      E.tapHint(W/2, H*0.95, '화면 탭 = read() 호출 (hits는 mutable이라 계속 증가)', true);
      E.big('mutable — const 안에서도 열리는 작은 예외', 'const 멤버함수는 객체를 안 바꾸겠다는 약속이지만, 현실에는 “겉으로는 안 바뀐 것 같지만 속으로는 바뀌어도 되는” 멤버가 있습니다. 예컨대 조회수를 세는 hits, 결과를 저장해 두는 캐시, 스레드 잠금 플래그 같은 것들 — 이들은 객체의 “논리적 상태”가 아니라 “구현상의 부기”일 뿐이죠. 그런 멤버에 mutable을 붙이면, const 함수 안에서도, 심지어 const 객체를 통해서도 자유롭게 수정할 수 있습니다. 정리하면 이렇습니다. const 객체나 const 참조로는 const 멤버함수만 부를 수 있고, const 함수 안에서 일반 멤버는 읽기만 가능하되, mutable 멤버만은 예외로 쓰기가 허용됩니다. 이 규칙들이 모여 C++의 const-correctness — “바뀌면 안 되는 것은 컴파일러가 지켜 준다”는 안전 문화를 이룹니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
