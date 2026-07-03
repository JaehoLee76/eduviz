/* C++ 제7장 — 상속(inheritance)
   동작(behavior)만. 텍스트=content/cpp7.json. 엔진 js/engine.js 공유. 색: C++=하늘색(#5ab4e8).
   골든룰: 화면의 모든 접근 판정·생성/소멸 순서·재정의 결과는 draw에서 실제 규칙으로 계산(베껴 박지 않음).
   좌측=진짜 C++ 코드(줄커서), 우측=상속 다이어그램·접근 매트릭스·생성/소멸 타임라인 실시각화.
   "class Cat : public Animal — 물려받고 확장한다" (C++ 실무 기반). */
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
  // 클래스 박스 렌더러: 제목 + 멤버 줄들 → 높이 반환
  function classBox(E, x, y, w, name, members, headCol){
    var ctx=E.ctx, lh=20, pad=10, hh=26, ht=hh+members.length*lh+pad;
    ctx.fillStyle='rgba(255,255,255,0.03)'; ctx.strokeStyle=headCol||CPB; ctx.lineWidth=1.4;
    roundRect(ctx,x,y,w,ht,9); ctx.fill(); ctx.stroke();
    ctx.fillStyle=headCol||CPB; ctx.fillRect(x,y,w,hh); // (그린 뒤 라운드 잘림 무시 — 헤더 띠)
    roundRect(ctx,x,y,w,ht,9); ctx.save(); ctx.clip();
    ctx.fillStyle='rgba(90,180,232,0.16)'; ctx.fillRect(x,y,w,hh); ctx.restore();
    ctx.fillStyle=headCol||CPB; ctx.font='700 13px sans-serif'; ctx.textAlign='center'; ctx.fillText(name, x+w/2, y+17);
    ctx.textAlign='left'; ctx.font='12px ui-monospace,Menlo,monospace';
    for(var i=0;i<members.length;i++){ var m=members[i];
      ctx.fillStyle=m.col||'#dfeaf2'; ctx.fillText(m.t, x+12, y+hh+16+i*lh); }
    return ht;
  }
  function arrowUp(ctx,x,y0,y1,col){ ctx.strokeStyle=col||CPB; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x,y0); ctx.lineTo(x,y1); ctx.stroke();
    ctx.fillStyle=col||CPB; ctx.beginPath(); ctx.moveTo(x,y1); ctx.lineTo(x-6,y1+11); ctx.lineTo(x+6,y1+11); ctx.closePath(); ctx.fill(); }

  var scenes = [

  // ══════════ 1. 상속의 이해 (is-a) ══════════
  { id:'cpp7_01',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*90,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'class Animal {           // 부모(기반)', hl:'Animal'},
        {t:'public:', dim:true},
        {t:'  string name;', hl:'name'},
        {t:'  void eat()  { ... }', hl:'eat'},
        {t:'  void sleep(){ ... }', hl:'sleep'},
        {t:'};', dim:true},
        {t:'class Cat : public Animal {  // 자식', hl:': public Animal'},
        {t:'public:', dim:true},
        {t:'  void meow() { ... }   // 추가 기능', hl:'meow'},
        {t:'};', dim:true},
        {t:'Cat c;  c.eat();  c.meow();', hl:'c.eat'}
      ];
      var act=[0,6,10][s.step];
      codePanel(E, W*0.04, H*0.13, W*0.46, code, 'inheritance_isa.cpp', act);

      // 우측: Animal → Cat 상속 다이어그램
      var cx=W*0.72, pw=W*0.30;
      var pMem=[{t:'name',col:CPD},{t:'eat()',col:CPD},{t:'sleep()',col:CPD}];
      var py=H*0.16;
      var ph=classBox(E, cx-pw/2, py, pw, 'Animal (부모)', pMem, CPB);

      var cy=py+ph+56;
      var cMem=[];
      // step2: 물려받은 것 회색으로 표시, 추가한 것 초록
      cMem.push({t:'name      (물려받음)', col: DIM});
      cMem.push({t:'eat()     (물려받음)', col: DIM});
      cMem.push({t:'sleep()   (물려받음)', col: DIM});
      cMem.push({t:'meow()    (추가)',     col: GRN});
      var ch=classBox(E, cx-pw/2, cy, pw, 'Cat : public Animal', cMem, GRN);

      arrowUp(ctx, cx, cy-4, py+ph+8, CPB);
      ctx.fillStyle=CPB; ctx.font='600 12px sans-serif'; ctx.textAlign='left';
      ctx.fillText('is-a', cx+8, (cy+py+ph)/2+8);

      // 좌하 요약
      var lx=W*0.05, ly=cy+ch+40; if(ly>H*0.9) ly=H*0.9;
      ctx.textAlign='left';
      if(s.step>=1){ ctx.fillStyle=GRN; ctx.font='600 14px sans-serif';
        ctx.fillText('Cat 은 Animal 의 멤버(name·eat·sleep)를 그대로 물려받습니다.', lx, ly); }
      if(s.step>=2){ ctx.fillStyle=GLD; ctx.font='13px sans-serif';
        ctx.fillText('그 위에 meow() 만 새로 얹으면 됩니다 — "고양이는 동물이다(is-a)".', lx, ly+22); }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (부모 → 자식 선언 → 사용)', true);
      E.big('상속의 이해 — is-a 관계', '이미 만들어 둔 Animal 클래스가 있다고 합시다. name 을 갖고 eat(), sleep() 을 할 줄 알죠. 이제 Cat 을 만들려는데, 고양이도 이름이 있고 먹고 잡니다 — 똑같은 코드를 또 쓰긴 아깝습니다. 그래서 class Cat : public Animal 이라고 적으면, Cat 은 Animal 의 모든 멤버를 물려받은 채로 태어납니다. 여기에 meow() 만 새로 더하면 끝. 상속은 "고양이는 동물이다(Cat is-a Animal)"라는 자연스러운 관계를 코드로 옮긴 것입니다. 물려받고, 그 위에 확장한다 — 이것이 객체지향의 재사용입니다.'); }
  },

  // ══════════ 2. protected 접근 ══════════
  { id:'cpp7_02',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(340+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'class Animal {', hl:'Animal'},
        {t:' private:',   hl:'private'},
        {t:'   int secret;   // 자식도 못 봄', hl:'secret'},
        {t:' protected:', hl:'protected'},
        {t:'   int age;      // 자식만 접근 OK', hl:'age'},
        {t:' public:', hl:'public'},
        {t:'   string name;  // 누구나', hl:'name'},
        {t:'};', dim:true},
        {t:'class Cat : public Animal {', hl:': public Animal'},
        {t:'  void f(){ age=3;   /* OK */ }', hl:'age=3'},
        {t:'  //         secret=1;  // 오류!', hl:'secret=1'},
        {t:'};', dim:true}
      ];
      var act=[1,3,5][s.step];
      codePanel(E, W*0.04, H*0.11, W*0.48, code, 'protected_access.cpp', act);

      // 우측: 접근 매트릭스 (실제 규칙으로 O/X 계산)
      // 행: private/protected/public, 열: 외부 코드 / 자식 클래스 / 자기 자신
      var rows=['private','protected','public'];
      var cols=['자기 클래스','자식(Cat)','외부 코드'];
      // 규칙표: 각 접근지정자에서 [self, child, outside]
      var rule={ 'private':[true,false,false], 'protected':[true,true,false], 'public':[true,true,true] };
      var gx=W*0.56, gy=H*0.20, cw=W*0.10, ch=40, lw=W*0.085;
      ctx.textAlign='center'; ctx.font='600 12px sans-serif';
      for(var c=0;c<3;c++){ ctx.fillStyle=CPD; ctx.fillText(cols[c], gx+lw+c*cw+cw/2, gy-10); }
      for(var r=0;r<3;r++){ var ry=gy+r*ch;
        var rcol = r===0?RED:(r===1?GLD:GRN);
        ctx.fillStyle=rcol; ctx.font='600 13px ui-monospace,monospace'; ctx.textAlign='right'; ctx.fillText(rows[r], gx+lw-6, ry+ch/2+5);
        for(c=0;c<3;c++){ var ok=rule[rows[r]][c], x=gx+lw+c*cw, y=ry;
          ctx.fillStyle= ok?'rgba(126,224,176,0.12)':'rgba(240,136,138,0.12)'; ctx.fillRect(x,y,cw-4,ch-4);
          ctx.strokeStyle= ok?GRN:RED; ctx.lineWidth=1.3; ctx.strokeRect(x,y,cw-4,ch-4);
          ctx.fillStyle= ok?GRN:RED; ctx.font='700 20px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.fillText(ok?'O':'X', x+(cw-4)/2, y+(ch-4)/2); ctx.textBaseline='alphabetic'; } }

      // 강조: step에 따라 해당 행 테두리 굵게
      var hiRow=[0,1,2][s.step]; // private→protected→public
      var hy=gy+hiRow*ch; ctx.strokeStyle='#fff'; ctx.lineWidth=2.2; ctx.strokeRect(gx+lw-2, hy-2, cw*3+4, ch-4+4);

      var lx=W*0.56, ly=gy+3*ch+34; ctx.textAlign='left';
      var msg=[
        {c:RED, t:'private: 부모 자신만 씀 — 자식 Cat 도 볼 수 없습니다.'},
        {c:GLD, t:'protected: 외부엔 감추되, 자식에게는 열어 줍니다.'},
        {c:GRN, t:'public: 누구에게나 공개 — 외부 코드도 접근합니다.'}
      ][s.step];
      ctx.fillStyle=msg.c; ctx.font='600 14px sans-serif'; ctx.fillText(msg.t, lx, ly);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
      ctx.fillText('상속받은 자식이 부모 내부를 쓰려면 protected 로 열어 둡니다.', W*0.05, H*0.92);

      E.tapHint(W/2, H*0.96, '화면 탭 = private → protected → public 행 강조', true);
      E.big('protected — 자식에게만 여는 문', 'public 은 누구나, private 는 나만. 그런데 상속을 하다 보면 애매한 자리가 생깁니다 — "외부에는 숨기고 싶지만, 내 자식 클래스는 써야 하는" 멤버 말이죠. private 으로 두면 자식조차 접근이 막히고, public 으로 열면 외부에 다 노출됩니다. 이때 쓰는 것이 protected: 딱 자식 클래스까지만 문을 열어 줍니다. 오른쪽 매트릭스가 규칙 그대로입니다 — private 은 자식 열이 X, protected 는 자식 열이 O, 외부 열은 여전히 X. 캡슐화를 지키면서 상속을 편하게 하는 절충점이 바로 protected 입니다.'); }
  },

  // ══════════ 3. 유도 클래스 생성자 ══════════
  { id:'cpp7_03',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(350+this.s.step*90,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'class Animal {', hl:'Animal'},
        {t:'  string name;', hl:'name'},
        {t:'public:', dim:true},
        {t:'  Animal(string n): name(n) {', hl:'Animal(string n)'},
        {t:'    cout << "Animal(" << n << ")";', dim:true},
        {t:'  }', dim:true},
        {t:'};', dim:true},
        {t:'class Cat : public Animal {', hl:': public Animal'},
        {t:'  int age;', hl:'age'},
        {t:'public:', dim:true},
        {t:'  Cat(string n,int a)', hl:'Cat(string n,int a)'},
        {t:'    : Animal(n), age(a) {  // 부모 먼저', hl:': Animal(n)'},
        {t:'    cout << "Cat(" << a << ")";', dim:true},
        {t:'  }', dim:true},
        {t:'};', dim:true},
        {t:'Cat c("Kitty", 3);', hl:'Cat c'}
      ];
      // 실행 흐름: Cat 생성자 진입 → 초기화리스트로 Animal(n) → Animal 본문 → Cat 본문
      var act=[15,11,12][s.step];
      codePanel(E, W*0.03, H*0.10, W*0.50, code, 'derived_ctor.cpp', act);

      // 우측: 생성 순서 실행 로그 (실제 규칙으로 단계 생성)
      // 초기화리스트가 Animal(n) 을 먼저 호출 → 부모 본문 → 자식 본문
      var log=[];
      log.push({t:'Cat("Kitty", 3) 호출', col:GLD, on: s.step>=0});
      log.push({t:'  → : Animal("Kitty")  (부모 생성자 위임)', col:CPB, on: s.step>=1});
      log.push({t:'      Animal 본문 실행  → "Animal(Kitty)"', col:CPD, on: s.step>=1});
      log.push({t:'  → age(3) 초기화', col:GRN, on: s.step>=2});
      log.push({t:'      Cat 본문 실행     → "Cat(3)"', col:GRN, on: s.step>=2});

      var lx=W*0.58, ly=H*0.20, lh=30;
      ctx.textAlign='left'; ctx.fillStyle=CPD; ctx.font='600 13px sans-serif';
      ctx.fillText('객체 하나가 지어지는 순서 (부모 → 자식)', lx, ly-14);
      for(var i=0;i<log.length;i++){ var L=log[i];
        ctx.globalAlpha = L.on?1:0.22;
        ctx.fillStyle = L.on ? L.col : DIM; ctx.font=(i%2===0?'600 ':'')+'13px ui-monospace,Menlo,monospace';
        ctx.fillText(L.t, lx, ly+i*lh); ctx.globalAlpha=1; }

      // 실제 출력 스트림 조립 (골든룰: 순서 규칙으로 실제 이어붙임)
      var out=''; if(s.step>=1) out+='Animal(Kitty)'; if(s.step>=2) out+=' Cat(3)';
      var oy=ly+log.length*lh+24;
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('cout 출력:', lx, oy);
      ctx.fillStyle=GRN; ctx.font='600 15px ui-monospace,Menlo,monospace'; ctx.fillText(out||'(아직 없음)', lx, oy+22);

      ctx.fillStyle=GLD; ctx.font='12.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText('자식 생성자는 반드시 부모 생성자를 먼저 호출합니다(안 적으면 기본 생성자).', W*0.05, H*0.93);

      E.tapHint(W/2, H*0.96, '화면 탭 = Cat 호출 → 부모 Animal(n) → 자식 본문', true);
      E.big('유도 클래스 생성자 — 부모부터 짓는다', '자식 객체를 만들 때, 자식 부분만 짓고 부모 부분을 빼먹으면 반쪽짜리가 됩니다. 그래서 C++ 은 자식 생성자가 실행되기 직전에 반드시 부모 생성자를 먼저 불러 부모 부분을 완성하도록 강제합니다. Cat(string n, int a) : Animal(n), age(a) — 이 콜론 뒤의 초기화 리스트에서 Animal(n) 을 명시하면, 물려받은 name 을 부모 손으로 정확히 채웁니다. 만약 적지 않으면 부모의 "기본 생성자"가 자동 호출되죠(없으면 컴파일 오류). 출력이 "Animal(Kitty)" 다음에 "Cat(3)" 순서인 이유가 여기 있습니다 — 집은 언제나 기초(부모)부터 올립니다.'); }
  },

  // ══════════ 4. 생성/소멸 순서 ══════════
  { id:'cpp7_04',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; E.blip(340+this.s.step*60,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'{',                 dim:true},
        {t:'  Cat c("Kitty",3);  // 생성', hl:'Cat c'},
        {t:'  c.eat();  c.meow();', dim:true},
        {t:'}   // 스코프 끝 → 소멸', hl:'소멸'},
        {t:'',                  dim:true},
        {t:'// 생성: 부모 → 자식', dim:true},
        {t:'// 소멸: 자식 → 부모  (역순!)', hl:'역순'}
      ];
      codePanel(E, W*0.04, H*0.14, W*0.44, code, 'construct_destruct.cpp', s.step<2?1:3);

      // 우측: 타임라인 — 생성(부모→자식), 소멸(자식→부모). 실제 순서로 단계 노출.
      // 이벤트 배열(실제 규칙): 0 Animal 생성, 1 Cat 생성 → 3 ~Cat, 4 ~Animal
      var events=[
        {t:'Animal 생성자',  side:'ctor', who:'부모', col:CPB},
        {t:'Cat 생성자',     side:'ctor', who:'자식', col:GRN},
        {t:'~Cat 소멸자',    side:'dtor', who:'자식', col:GRN},
        {t:'~Animal 소멸자', side:'dtor', who:'부모', col:CPB}
      ];
      var visN=s.step; // step 0..4 → 이벤트 0..4개 노출
      var tx=W*0.58, ty=H*0.20, rowh=52;
      // 세로 타임라인 축
      ctx.strokeStyle='rgba(90,180,232,0.25)'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(tx, ty-6); ctx.lineTo(tx, ty+events.length*rowh); ctx.stroke();

      for(var i=0;i<events.length;i++){ var e=events[i], on=(i<visN), ey=ty+i*rowh+10;
        ctx.globalAlpha = on?1:0.20;
        // 노드
        ctx.fillStyle = e.side==='ctor'? e.col : 'rgba(0,0,0,0)';
        ctx.strokeStyle=e.col; ctx.lineWidth=2.4;
        ctx.beginPath(); ctx.arc(tx, ey, 8, 0, 7);
        if(e.side==='ctor'){ ctx.fill(); } else { ctx.stroke(); } // 소멸=속 빈 원
        ctx.stroke();
        // 라벨
        ctx.fillStyle=e.col; ctx.font='600 15px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
        ctx.fillText(e.t, tx+22, ey+5);
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
        ctx.fillText((e.side==='ctor'?'생성 ':'소멸 ')+e.who, tx+22, ey+22);
        // 번호
        ctx.fillStyle= on? e.col : DIM; ctx.font='11px sans-serif'; ctx.textAlign='right';
        ctx.fillText('#'+(i+1), tx-16, ey+4);
        ctx.globalAlpha=1;
      }
      // 구분선: 생성 구간 / 소멸 구간
      var midY=ty+2*rowh+2;
      ctx.strokeStyle='rgba(255,255,255,0.12)'; ctx.setLineDash([4,4]); ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(tx-40, midY); ctx.lineTo(tx+W*0.28, midY); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=GLD; ctx.font='11px sans-serif'; ctx.textAlign='left';
      ctx.fillText('↑ 생성 (부모→자식)', tx+W*0.18, ty+rowh);
      ctx.fillText('↓ 소멸 (자식→부모)', tx+W*0.18, ty+3*rowh);

      ctx.fillStyle=GRN; ctx.font='600 13.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText('소멸은 생성의 정확한 역순입니다 — 나중에 지어진 것부터 헐립니다.', W*0.05, H*0.92);

      E.tapHint(W/2, H*0.96, '화면 탭 = 한 단계씩 (Animal→Cat 생성, ~Cat→~Animal 소멸)', true);
      E.big('생성과 소멸의 순서 — 지은 역순으로 헐린다', '객체는 기초부터 올라갑니다: 부모(Animal) 생성자가 먼저 돌고, 그 위에 자식(Cat) 생성자가 얹힙니다. 그리고 스코프가 끝나 객체가 사라질 때는 정반대 — 나중에 얹은 자식(~Cat)부터 헐고, 마지막에 토대인 부모(~Animal)를 정리합니다. 왜 역순일까요? 자식은 부모 부분에 기대어 만들어졌으니, 부모를 먼저 없애면 자식이 밟고 선 땅이 사라지기 때문입니다. 스택에 쌓았다 꺼내는 것과 똑같은 이치죠(LIFO). 이 규칙은 다음 장의 "가상 소멸자"를 이해하는 열쇠가 됩니다 — 부모 포인터로 지울 때 자식 소멸자가 제대로 불리는가?'); }
  },

  // ══════════ 5. 재정의(overriding, 정적) · 이름 가림 ══════════
  { id:'cpp7_05',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(340+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'class Animal {',        hl:'Animal'},
        {t:'public:',               dim:true},
        {t:'  void speak(){ cout<<"..."; }', hl:'speak'},
        {t:'};', dim:true},
        {t:'class Cat : public Animal {', hl:': public Animal'},
        {t:'public:', dim:true},
        {t:'  void speak(){ cout<<"Meow"; }', hl:'speak'},
        {t:'};   // 같은 이름 재정의', dim:true},
        {t:'Cat c;', hl:'Cat c'},
        {t:'c.speak();          // Cat::speak → "Meow"', hl:'c.speak()'},
        {t:'c.Animal::speak();  // 가려진 부모 것 호출', hl:'c.Animal::speak()'}
      ];
      var act=[6,9,10][s.step];
      codePanel(E, W*0.03, H*0.12, W*0.50, code, 'overriding_static.cpp', act);

      // 우측: 이름 가림 그림 — Cat::speak 가 Animal::speak 를 덮음
      var cx=W*0.74, bx=W*0.58, bw=W*0.34;
      // Animal::speak (뒤, 가려짐)
      var y1=H*0.20;
      ctx.globalAlpha = (s.step===2)?1:0.35;
      roundRect(ctx, bx, y1, bw, 46, 8); ctx.fillStyle='rgba(90,180,232,0.10)'; ctx.fill();
      ctx.strokeStyle=CPB; ctx.lineWidth=1.4; roundRect(ctx,bx,y1,bw,46,8); ctx.stroke();
      ctx.fillStyle=CPB; ctx.font='600 13px ui-monospace,monospace'; ctx.textAlign='left';
      ctx.fillText('Animal::speak()  → "..."', bx+14, y1+20);
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.fillText('부모 것 (가려짐 — name hiding)', bx+14, y1+37);
      ctx.globalAlpha=1;

      // Cat::speak (앞, 덮음)
      var y2=y1+70;
      roundRect(ctx, bx+16, y2, bw, 46, 8); ctx.fillStyle='rgba(126,224,176,0.12)'; ctx.fill();
      ctx.strokeStyle=GRN; ctx.lineWidth=1.6; roundRect(ctx,bx+16,y2,bw,46,8); ctx.stroke();
      ctx.fillStyle=GRN; ctx.font='600 13px ui-monospace,monospace';
      ctx.fillText('Cat::speak()  → "Meow"', bx+30, y2+20);
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.fillText('자식이 재정의 — 기본으로 이게 불림', bx+30, y2+37);

      // 호출 결과 (실제 규칙으로 문자열 결정)
      var callName, result, rcol;
      if(s.step<2){ callName='c.speak()'; result='"Meow"'; rcol=GRN; }
      else { callName='c.Animal::speak()'; result='"..."'; rcol=CPB; }
      var ry=y2+90;
      ctx.fillStyle='#dfeaf2'; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
      ctx.fillText(callName+'  호출 →', bx, ry);
      ctx.fillStyle=rcol; ctx.font='700 22px ui-monospace,Menlo,monospace'; ctx.fillText(result, bx, ry+32);

      // 정적 바인딩 경고 + 8장 예고
      ctx.fillStyle=GLD; ctx.font='12.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText('아직은 "정적 바인딩" — 변수의 타입으로 함수가 정해집니다.', W*0.05, H*0.88);
      ctx.fillStyle=PNK; ctx.font='12.5px sans-serif';
      ctx.fillText('Animal* p = &cat; p->speak() 는? → 8장 virtual 이 답합니다.', W*0.05, H*0.92);

      E.tapHint(W/2, H*0.96, '화면 탭 = c.speak() → 가림 → c.Animal::speak()', true);
      E.big('재정의(overriding)와 이름 가림', '자식이 부모와 똑같은 이름·형태의 함수를 다시 정의하면, 자식 객체에서는 자식 것이 부모 것을 "가립니다"(name hiding). Cat 이 speak() 를 "Meow" 로 재정의하면 c.speak() 는 "Meow" 를 냅니다 — 부모의 speak 는 그늘에 가려지죠. 정 부모 것을 부르고 싶다면 c.Animal::speak() 처럼 범위를 콕 집어야 합니다. 그런데 여기엔 함정이 있습니다: 지금은 c 라는 변수의 "적힌 타입"만 보고 어느 speak 를 부를지 컴파일 때 미리 정해집니다("정적 바인딩"). Animal* 포인터로 고양이를 가리키면 부모 것이 불려 버리는, 다형성의 벽에 부딪히죠. 이 벽을 허무는 열쇠 virtual 은 바로 다음 장에서 만납니다.'); }
  },

  // ══════════════════ 심화학습 (제7장 상속) ══════════════════

  // ─── is-a 원칙과 잘못된 상속 (리스코프) ───
  { id:'cpp7_01_isa', branchOf:'cpp7_01', ord:1,
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(340+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'class Rectangle {', hl:'Rectangle'},
        {t:'protected: int w, h;', dim:true},
        {t:'public:', dim:true},
        {t:'  virtual void setW(int x){ w=x; }', hl:'setW'},
        {t:'  virtual void setH(int y){ h=y; }', hl:'setH'},
        {t:'  int area(){ return w*h; }', hl:'area'},
        {t:'};', dim:true},
        {t:'class Square : public Rectangle {', hl:': public Rectangle'},
        {t:'  void setW(int x){ w=h=x; }  // 강제', hl:'w=h=x'},
        {t:'  void setH(int y){ w=h=y; }  // 정사각!', hl:'w=h=y'},
        {t:'};', dim:true},
        {t:'r.setW(5); r.setH(4);  // 기대 area=20', hl:'setW(5)'}
      ];
      // 실계산: 같은 호출을 Rectangle / Square 각각에 적용
      // Rectangle: setW(5)->w=5, setH(4)->h=4 => 5*4=20 (기대대로)
      // Square: setW(5)->w=h=5, setH(4)->w=h=4 => 4*4=16 (불변식 깨짐)
      var rw=5, rh=4, rArea=rw*rh;          // 20
      var sq=5; if(s.step>=2) sq=4;          // setH(4)가 폭도 4로 강제
      var sArea=sq*sq;                        // 16 (기대 20과 어긋남)
      var act=[3,4,4,4][s.step];
      var codeBot=codePanel(E, W*0.03, H*0.09, W*0.50, code, 'liskov_square.cpp', act);

      // 우측 x∈[0.54W,0.97W]: 두 도형 실제 넓이 비교
      var rx0=W*0.56, topY=H*0.16, boxMax=118, scale=14;
      // Rectangle 결과
      ctx.textAlign='left'; ctx.fillStyle=CPB; ctx.font='700 13px sans-serif';
      ctx.fillText('Rectangle r', rx0, topY-6);
      var rW=rw*scale, rH=rh*scale;
      ctx.strokeStyle=CPB; ctx.lineWidth=2; ctx.strokeRect(rx0, topY+6, rW, rH);
      ctx.fillStyle='rgba(90,180,232,0.10)'; ctx.fillRect(rx0, topY+6, rW, rH);
      ctx.fillStyle=CPD; ctx.font='11px ui-monospace,monospace';
      ctx.fillText('w='+rw+', h='+rh, rx0, topY+6+rH+18);
      ctx.fillStyle=GRN; ctx.font='700 15px ui-monospace,monospace';
      ctx.fillText('area = '+rw+'×'+rh+' = '+rArea, rx0, topY+6+rH+40);
      ctx.fillStyle=GRN; ctx.font='11.5px sans-serif'; ctx.fillText('✓ 기대대로', rx0, topY+6+rH+58);

      // Square 결과 (오른쪽)
      var sx0=W*0.78;
      ctx.fillStyle=RED; ctx.font='700 13px sans-serif'; ctx.textAlign='left';
      ctx.fillText('Square r  (Rectangle 상속)', sx0-W*0.02, topY-6);
      if(s.step>=1){
        var sPix=sq*scale;
        ctx.strokeStyle= (s.step>=2)?RED:CPB; ctx.lineWidth=2; ctx.strokeRect(sx0, topY+6, sPix, sPix);
        ctx.fillStyle= (s.step>=2)?'rgba(240,136,138,0.10)':'rgba(90,180,232,0.10)'; ctx.fillRect(sx0, topY+6, sPix, sPix);
        ctx.fillStyle=CPD; ctx.font='11px ui-monospace,monospace';
        ctx.fillText('w=h='+sq, sx0, topY+6+sPix+18);
        var sc= (s.step>=2)?RED:GLD;
        ctx.fillStyle=sc; ctx.font='700 15px ui-monospace,monospace';
        ctx.fillText('area = '+sq+'×'+sq+' = '+sArea, sx0, topY+6+sPix+40);
        if(s.step>=2){ ctx.fillStyle=RED; ctx.font='11.5px sans-serif';
          ctx.fillText('✗ 기대 20 ≠ 실제 '+sArea, sx0, topY+6+sPix+58); }
      }

      // 좌하 설명 (codeBot+16 이상)
      var lx=W*0.05, ly=Math.max(codeBot+26, H*0.72); if(ly>H*0.90) ly=H*0.90; ctx.textAlign='left';
      var msg=[
        {c:CPB, t:'Rectangle 은 setW·setH 가 서로 독립 — setW(5)·setH(4) 면 넓이 20.'},
        {c:GLD, t:'Square 는 정사각형 유지를 위해 한 쪽을 바꾸면 다른 쪽도 강제로 바꿉니다.'},
        {c:RED, t:'그래서 setH(4) 가 폭까지 4로 만들어 area=16 — 부모 코드의 기대(20)가 깨집니다.'},
        {c:GLD, t:'"정사각형 is-a 직사각형"은 수학은 맞아도 동작 계약은 어긋납니다 → public 상속 부적합.'}
      ][s.step];
      ctx.fillStyle=msg.c; ctx.font='600 14px sans-serif'; ctx.fillText(msg.t, lx, ly);

      E.tapHint(W/2, H*0.96, '화면 탭 = setW(5) → setH(4) → 넓이 어긋남 → 결론', true);
      E.big('심화 · is-a 원칙과 잘못된 상속', 'public 상속에는 엄격한 계약이 있습니다: "자식은 부모다(is-a)" — 부모를 쓰는 모든 코드가 자식으로 바꿔도 똑같이 동작해야 합니다. 언뜻 정사각형은 직사각형의 특수한 경우니 Square 가 Rectangle 을 상속하면 자연스러워 보입니다. 하지만 함정이 있습니다. 부모 Rectangle 은 "폭과 높이를 따로 정할 수 있다"는 것을 전제로 setW·setH 를 둡니다. Square 는 정사각형을 지키려 setH(4) 를 부르는 순간 폭까지 4로 바꿔 버리죠. 그러면 setW(5) 뒤 setH(4) 를 했을 때 부모 코드가 기대한 넓이 20 대신 16 이 나옵니다 — 부모를 믿고 짠 코드가 조용히 틀립니다. 이것이 상속 계약 위반입니다. 수학적 "특수한 경우"와 코드의 "치환 가능"은 다릅니다. 이럴 땐 상속 대신 별개 클래스로 두거나 불변식을 다시 설계해야 합니다. 상속을 쓸 땐 늘 물으세요 — "부모가 약속한 모든 동작을 자식이 그대로 지키는가?"'); }
  },

  // ─── 이름 가림(name hiding)과 using ───
  { id:'cpp7_05_namehide', branchOf:'cpp7_05', ord:1,
    enter:function(E){ var self=this; this.s={u:0};
      E.controls('<div class="ctrl"><label>using Base::f; 선언</label><input type="range" id="u" min="0" max="1" step="1" value="0"><output id="uo">using 없음</output></div>');
      E.bind('#u','input',function(e){ self.s.u=+e.target.value; document.getElementById('uo').textContent=self.s.u?'using 있음':'using 없음'; E.blip(self.s.u?420:300,0.07); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var use=(s.u===1);
      var code=[
        {t:'class Base {', hl:'Base'},
        {t:'public:', dim:true},
        {t:'  void f(int i)   { /* 정수 */ }', hl:'f(int i)'},
        {t:'  void f(double d){ /* 실수 */ }', hl:'f(double d)'},
        {t:'};', dim:true},
        {t:'class Derived : public Base {', hl:': public Base'},
        {t:'public:', dim:true},
        use ? {t:'  using Base::f;   // 부모 오버로드 복구', hl:'using Base::f'}
            : {t:'  // (using 없음)', dim:true},
        {t:'  void f(char* s) { /* 문자열 */ }', hl:'f(char* s)'},
        {t:'};', dim:true},
        {t:'Derived d;',       hl:'Derived d'},
        {t:'d.f(3);        // f(int) 를 원함', hl:'d.f(3)'}
      ];
      var codeBot=codePanel(E, W*0.03, H*0.09, W*0.50, code, use?'name_hiding_using.cpp':'name_hiding.cpp', 12);

      // 골든룰: 규칙으로 어떤 f 가 보이는지 결정
      // 자식이 f(char*) 하나라도 정의 → 이름 f 전체가 가려짐 (using 없으면 부모 f(int)/f(double) 안 보임)
      // using Base::f; 있으면 부모 오버로드 복구 → f(int) 후보 존재
      // d.f(3): int 인자 3
      var candidates=[
        {sig:'Base::f(int)',    visible: use, group:'부모'},
        {sig:'Base::f(double)', visible: use, group:'부모'},
        {sig:'Derived::f(char*)', visible: true, group:'자식'}
      ];
      // 3(int) 에 맞는 호출 결정
      var chosen, resultOK;
      if(use){ chosen='Base::f(int)'; resultOK=true; }        // 정확히 f(int)
      else { chosen='Derived::f(char*)?'; resultOK=false; }   // 부모 가려짐 → int→char* 변환 불가 → 컴파일 오류

      // 우측 x∈[0.55W,0.97W]: 오버로드 후보 가시성
      var bx=W*0.57, by=H*0.15, bw=W*0.38, rowh=42;
      ctx.textAlign='left'; ctx.fillStyle=CPD; ctx.font='600 13px sans-serif';
      ctx.fillText('이름 f 의 오버로드 후보 (보임/가려짐)', bx, by-8);
      for(var i=0;i<candidates.length;i++){ var c=candidates[i], ry=by+i*rowh;
        var vis=c.visible;
        roundRect(ctx,bx,ry,bw,rowh-8,8); ctx.fillStyle= vis?(c.group==='자식'?'rgba(126,224,176,0.10)':'rgba(90,180,232,0.12)'):'rgba(255,255,255,0.03)'; ctx.fill();
        ctx.strokeStyle= vis?(c.group==='자식'?GRN:CPB):'rgba(255,255,255,0.15)'; ctx.lineWidth= vis?1.6:1.2;
        ctx.setLineDash(vis?[]:[4,3]); roundRect(ctx,bx,ry,bw,rowh-8,8); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle= vis?(c.group==='자식'?GRN:CPB):DIM; ctx.font='600 13px ui-monospace,monospace';
        ctx.fillText(c.sig, bx+12, ry+22);
        ctx.fillStyle= vis?GRN:RED; ctx.font='11px sans-serif'; ctx.textAlign='right';
        ctx.fillText(vis?'보임':'가려짐', bx+bw-12, ry+22); ctx.textAlign='left';
      }
      // 호출 결과
      var oy=by+candidates.length*rowh+18;
      ctx.fillStyle='#dfeaf2'; ctx.font='600 14px ui-monospace,monospace';
      ctx.fillText('d.f(3)  →', bx, oy);
      if(resultOK){ ctx.fillStyle=GRN; ctx.font='700 17px ui-monospace,monospace';
        ctx.fillText(chosen+'  ✓', bx+90, oy);
        ctx.fillStyle=GRN; ctx.font='12px sans-serif'; ctx.fillText('부모 오버로드가 복구되어 정확히 f(int) 이 불립니다.', bx, oy+26); }
      else { ctx.fillStyle=RED; ctx.font='700 17px ui-monospace,monospace';
        ctx.fillText('컴파일 오류 ✗', bx+90, oy);
        ctx.fillStyle=RED; ctx.font='12px sans-serif'; ctx.fillText('부모 f(int)/f(double) 가 가려져 남은 건 f(char*) 뿐 — 3 을 못 받습니다.', bx, oy+26); }

      var lx=W*0.05, ly=Math.max(codeBot+26, H*0.86); if(ly>H*0.92) ly=H*0.92;
      ctx.fillStyle= use?GRN:GLD; ctx.font='12.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText(use ? '핵심 규칙: 부모 오버로드를 살리려면 자식에 using Base::f; 를 넣습니다.'
                       : '자식이 같은 이름 함수를 하나라도 정의하면 부모의 그 이름 오버로드가 전부 가려집니다.', lx, ly);

      E.tapHint(W/2, H*0.96, '슬라이더로 using 선언을 켜고 끄며 f(int) 가 살아나는지 보세요', true);
      E.big('심화 · 이름 가림과 using', '오버로딩과 상속이 만나면 놀라운 함정이 생깁니다. Base 에 f(int) 와 f(double) 두 오버로드가 있는데, Derived 가 f(char*) 하나만 새로 정의했다고 합시다. 상식적으로는 자식이 세 가지 f 를 모두 가질 것 같지만, C++ 의 규칙은 냉정합니다 — 자식이 이름 f 를 하나라도 선언하는 순간, 부모의 이름 f 전체(f(int)·f(double) 모두)가 가려집니다(name hiding). 그래서 d.f(3) 처럼 정수를 넘겨도 부모의 f(int) 은 후보에 없고, 남은 f(char*) 는 정수를 못 받아 컴파일 오류가 납니다. 왜 이렇게 설계했을까요? 상속 깊은 이름들이 뒤섞여 뜻밖의 오버로드가 불리는 사고를 막기 위해서입니다. 살리고 싶으면 자식에 using Base::f; 한 줄을 넣습니다 — 그러면 부모의 오버로드가 다시 후보에 올라와 d.f(3) 이 정확히 f(int) 을 부릅니다. "자식이 이름을 재정의하면 그 이름의 부모 오버로드를 함께 끌어올려라(using)"가 안전한 관용구입니다.'); }
  },

  // ─── 상속 비가상함수 재정의 금지 ───
  { id:'cpp7_05_novre', branchOf:'cpp7_05', ord:2,
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(340+this.s.step*90,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'class Base {', hl:'Base'},
        {t:'public:', dim:true},
        {t:'  void draw(){ cout<<"Base"; }  // 비가상', hl:'void draw'},
        {t:'};', dim:true},
        {t:'class Derived : public Base {', hl:': public Base'},
        {t:'public:', dim:true},
        {t:'  void draw(){ cout<<"Derived"; } // 재정의', hl:'void draw'},
        {t:'};', dim:true},
        {t:'Derived d;', hl:'Derived d'},
        {t:'Derived* pd = &d;  pd->draw();', hl:'pd->draw()'},
        {t:'Base*    pb = &d;  pb->draw();', hl:'pb->draw()'}
      ];
      var act=[9,9,10][s.step];
      var codeBot=codePanel(E, W*0.03, H*0.10, W*0.50, code, 'nonvirtual_redefine.cpp', act);

      // 골든룰: 비가상 → 정적 바인딩 → 포인터의 적힌 타입으로 함수 결정
      // 같은 객체 d 를 가리키는 두 포인터가 타입에 따라 다른 draw 를 부름
      var calls=[
        {ptr:'Derived* pd', decl:'Derived', out:'Derived', col:GRN, on: s.step>=1},
        {ptr:'Base*    pb', decl:'Base',    out:'Base',    col:RED, on: s.step>=2}
      ];

      // 우측 x∈[0.55W,0.97W]: 같은 객체 d, 두 포인터, 서로 다른 결과
      var ox=W*0.74, oy=H*0.16, ow=W*0.18;
      // 실제 객체
      roundRect(ctx, ox, oy, ow, 60, 9); ctx.fillStyle='rgba(126,224,176,0.08)'; ctx.fill();
      ctx.strokeStyle=GRN; ctx.lineWidth=1.6; roundRect(ctx,ox,oy,ow,60,9); ctx.stroke();
      ctx.fillStyle=GRN; ctx.font='700 13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('실제 객체 d', ox+ow/2, oy+24);
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.fillText('(진짜 타입 = Derived)', ox+ow/2, oy+42);

      // 두 포인터 박스
      var px=W*0.56, py=H*0.42, pw=W*0.40, rowh=64;
      for(var i=0;i<calls.length;i++){ var c=calls[i], ry=py+i*rowh;
        ctx.globalAlpha=c.on?1:0.25;
        roundRect(ctx,px,ry,pw,rowh-12,8); ctx.fillStyle= c.on?(c.col===GRN?'rgba(126,224,176,0.10)':'rgba(240,136,138,0.12)'):'rgba(255,255,255,0.03)'; ctx.fill();
        ctx.strokeStyle= c.on?c.col:'rgba(255,255,255,0.15)'; ctx.lineWidth= c.on?1.8:1.2; roundRect(ctx,px,ry,pw,rowh-12,8); ctx.stroke();
        ctx.fillStyle= c.on?c.col:DIM; ctx.font='600 13px ui-monospace,monospace'; ctx.textAlign='left';
        ctx.fillText(c.ptr+' = &d', px+14, ry+22);
        ctx.fillStyle=DIM; ctx.font='11px sans-serif';
        ctx.fillText('정적 바인딩 → 포인터 타입('+c.decl+')의 draw', px+14, ry+40);
        ctx.fillStyle= c.on?c.col:DIM; ctx.font='700 16px ui-monospace,monospace'; ctx.textAlign='right';
        ctx.fillText('→ "'+c.out+'"', px+pw-14, ry+30);
        ctx.globalAlpha=1;
      }

      // 화살표: 두 포인터 → 같은 객체 d
      if(s.step>=1){ ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1.4; ctx.setLineDash([4,4]);
        ctx.beginPath(); ctx.moveTo(px+pw*0.5, py-4); ctx.lineTo(ox+ow/2, oy+62); ctx.stroke(); ctx.setLineDash([]); }

      var lx=W*0.05, ly=Math.max(codeBot+26, H*0.88); if(ly>H*0.93) ly=H*0.93; ctx.textAlign='left';
      if(s.step>=2){ ctx.fillStyle=RED; ctx.font='600 14px sans-serif';
        ctx.fillText('같은 객체인데 pb->draw() 는 "Base" — 포인터 타입이 함수를 정해 버립니다.', lx, ly); }
      else { ctx.fillStyle=GLD; ctx.font='600 14px sans-serif';
        ctx.fillText('draw() 가 비가상이라 호출은 "적힌 포인터 타입"으로 컴파일 때 못 박힙니다.', lx, ly); }

      E.tapHint(W/2, H*0.96, '화면 탭 = Derived* 호출 → Base* 호출 → 결과 어긋남', true);
      E.big('심화 · 비가상함수를 재정의하지 말라', '앞에서 배운 재정의(name hiding)에는 위험한 형제가 하나 있습니다 — 비가상 함수를 자식이 다시 정의하는 것입니다. draw() 가 virtual 이 아니면, 그 호출은 "실제 객체가 무엇인가"가 아니라 "포인터·참조에 적힌 타입이 무엇인가"만 보고 컴파일 때 못 박힙니다(정적 바인딩). 오른쪽을 보세요 — 똑같은 객체 d 를 가리키는데도, Derived* 로 부르면 "Derived", Base* 로 부르면 "Base" 가 나옵니다. 같은 물건이 어느 손잡이를 잡았느냐에 따라 다르게 행동하는 셈이죠. 이건 거의 항상 버그입니다: 코드를 읽는 사람은 "d 는 Derived 니까 당연히 Derived::draw 가 불리겠지"라고 믿는데, 어딘가 Base& 로 넘기는 순간 조용히 Base 것이 불려 버립니다. 그래서 규칙은 분명합니다 — 다형적으로 행동을 바꾸고 싶으면 부모에서 virtual 로 선언하고, 그럴 뜻이 없는 비가상 함수라면 자식에서 절대 같은 이름으로 재정의하지 마세요.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
