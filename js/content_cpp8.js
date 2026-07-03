/* C++ 제8장 — 다형성·가상함수(virtual)
   동작(behavior)만. 텍스트=content/cpp8.json. 엔진 js/engine.js 공유. 색: C++=하늘색(#5ab4e8).
   골든룰: 화면의 모든 바인딩 결과·넓이·자원 누수 판정은 draw에서 실제 규칙/실공식으로 계산(베껴 박지 않음).
   좌측=진짜 C++ 코드(줄커서), 우측=포인터 vs 실제객체·virtual 유무 결과 대비·추상클래스·가상소멸자·넓이 합 실측.
   "virtual — 포인터가 아니라 진짜 객체가 답한다" (윤성우 열혈C++ + Effective C++ 항목7). */
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

  // ══════════ 1. 객체 포인터 참조관계 (Base* → Derived) ══════════
  { id:'cpp8_01',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*90,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'Animal* p;', hl:'Animal*'},
        {t:'p = new Cat();     // 부모 포인터가', hl:'new Cat()'},
        {t:'                   // 자식을 가리킴 (OK)', dim:true},
        {t:'',                 dim:true},
        {t:'// Cat is-a Animal 이므로 허용', dim:true},
        {t:'p->eat();          // 물려받은 것 OK', hl:'p->eat()'},
        {t:'// p->meow();      // Cat 전용 → 오류', hl:'p->meow()'},
        {t:'//   p 의 타입은 Animal* 라서', dim:true},
        {t:'//   Animal 에 있는 것만 보입니다', dim:true}
      ];
      var act=[1,5,6][s.step];
      codePanel(E, W*0.04, H*0.14, W*0.46, code, 'base_pointer.cpp', act);

      // 우측: 포인터(타입) vs 실제 객체(내용)
      var px=W*0.60, py=H*0.22;
      // 포인터 상자
      roundRect(ctx, px, py, W*0.14, 54, 8); ctx.fillStyle='rgba(90,180,232,0.10)'; ctx.fill();
      ctx.strokeStyle=CPB; ctx.lineWidth=1.6; roundRect(ctx,px,py,W*0.14,54,8); ctx.stroke();
      ctx.fillStyle=CPB; ctx.font='600 14px ui-monospace,monospace'; ctx.textAlign='center';
      ctx.fillText('p', px+W*0.07, py+22); ctx.fillStyle=DIM; ctx.font='11px sans-serif';
      ctx.fillText('타입: Animal*', px+W*0.07, py+42);

      // 화살표 → 힙 객체
      var ox=px+W*0.24, oy=py-6;
      ctx.strokeStyle=GRN; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(px+W*0.14, py+27); ctx.lineTo(ox-4, py+27); ctx.stroke();
      ctx.fillStyle=GRN; ctx.beginPath(); ctx.moveTo(ox+8,py+27); ctx.lineTo(ox-4,py+21); ctx.lineTo(ox-4,py+33); ctx.closePath(); ctx.fill();

      // 실제 객체 = Cat (Animal 부분 + Cat 부분)
      var owx=W*0.26;
      roundRect(ctx, ox+10, oy, owx, 96, 9); ctx.fillStyle='rgba(126,224,176,0.08)'; ctx.fill();
      ctx.strokeStyle=GRN; ctx.lineWidth=1.6; roundRect(ctx,ox+10,oy,owx,96,9); ctx.stroke();
      ctx.fillStyle=GRN; ctx.font='700 13px sans-serif'; ctx.textAlign='center'; ctx.fillText('실제 객체: Cat', ox+10+owx/2, oy+18);
      // Animal 부분 (포인터로 보이는 창)
      ctx.fillStyle= (s.step>=1)?'rgba(90,180,232,0.20)':'rgba(90,180,232,0.08)';
      ctx.fillRect(ox+22, oy+28, owx-24, 26);
      ctx.strokeStyle=CPB; ctx.lineWidth= (s.step>=1)?2:1; ctx.strokeRect(ox+22, oy+28, owx-24, 26);
      ctx.fillStyle=CPD; ctx.font='12px ui-monospace,monospace'; ctx.textAlign='left'; ctx.fillText('name · eat() · sleep()', ox+30, oy+45);
      // Cat 부분 (가려진 창)
      ctx.globalAlpha = (s.step>=2)?1:0.4;
      ctx.fillStyle='rgba(255,255,255,0.03)'; ctx.fillRect(ox+22, oy+60, owx-24, 26);
      ctx.strokeStyle= (s.step>=2)?RED:'rgba(255,255,255,0.15)'; ctx.lineWidth=1.4; ctx.setLineDash(s.step>=2?[4,3]:[]); ctx.strokeRect(ox+22, oy+60, owx-24, 26); ctx.setLineDash([]);
      ctx.fillStyle= (s.step>=2)?RED:DIM; ctx.fillText('meow()   ← p 로는 안 보임', ox+30, oy+77);
      ctx.globalAlpha=1;

      // 설명
      var lx=W*0.05, ly=py+140; ctx.textAlign='left';
      var msg=[
        {c:GRN, t:'부모 타입 포인터가 자식 객체를 가리킬 수 있습니다 (Cat is-a Animal).'},
        {c:CPB, t:'하지만 p 로 볼 수 있는 창은 Animal 부분 — eat() 은 OK.'},
        {c:RED, t:'p->meow() 는 컴파일 오류: p 의 타입(Animal*)에 meow 가 없습니다.'}
      ][s.step];
      ctx.fillStyle=msg.c; ctx.font='600 14px sans-serif'; ctx.fillText(msg.t, lx, ly);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
      ctx.fillText('그렇다면 물려받아 재정의한 함수는? 다음 장면 virtual 이 핵심입니다.', lx, ly+24);

      E.tapHint(W/2, H*0.95, '화면 탭 = 대입 → eat() OK → meow() 오류', true);
      E.big('객체 포인터의 참조관계 — 부모 손잡이로 자식 잡기', '"고양이는 동물이다"라는 상속 관계는 포인터에서도 통합니다. Animal* p = new Cat(); — 부모 타입 포인터가 자식 객체를 아무 문제 없이 가리킵니다. 여기서 미묘한 점: 포인터 p 에 적힌 타입은 Animal* 이므로, p 를 통해 보이는 창은 딱 Animal 부분(name, eat, sleep)뿐입니다. 실제 상자 안엔 Cat 의 meow() 도 들어 있지만, p->meow() 라고 쓰면 컴파일러가 "Animal 에는 meow 가 없다"며 막습니다. 이 "포인터 타입 vs 실제 객체"의 어긋남이 다형성의 무대입니다 — 그럼 p->speak() 처럼 부모·자식 둘 다 가진 함수는 누구 걸 부를까요? virtual 이 답합니다.'); }
  },

  // ══════════ 2. virtual 함수 — 동적 바인딩 ══════════
  { id:'cpp8_02',
    enter:function(E){ var self=this; this.s={v:1};
      E.controls('<div class="ctrl"><label>speak() 앞 virtual</label><input type="range" id="vt" min="0" max="1" step="1" value="1"><output id="vto">virtual 있음</output></div>');
      E.bind('#vt','input',function(e){ self.s.v=+e.target.value; document.getElementById('vto').textContent = self.s.v? 'virtual 있음':'virtual 없음'; E.blip(self.s.v?420:300,0.07); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var v=s.v; // 1=virtual, 0=아님
      var vk = v? 'virtual ':'';
      var code=[
        {t:'class Animal {',              hl:'Animal'},
        {t:'public:', dim:true},
        {t:'  '+vk+'string speak(){', hl: v?'virtual':'string'},
        {t:'      return "..."; }', dim:true},
        {t:'};', dim:true},
        {t:'class Cat : public Animal {', hl:': public Animal'},
        {t:'public:', dim:true},
        {t:'  string speak(){ return "Meow"; }', hl:'speak'},
        {t:'};', dim:true},
        {t:'Animal* p = new Cat();', hl:'new Cat()'},
        {t:'cout << p->speak();', hl:'p->speak()'}
      ];
      codePanel(E, W*0.04, H*0.11, W*0.48, code, v?'virtual_dynamic.cpp':'no_virtual_static.cpp', 10);

      // 골든룰: 바인딩 규칙으로 실제 호출 결정
      // virtual 있으면 실제객체(Cat)의 speak → "Meow"
      // 없으면 포인터 타입(Animal)의 speak → "..."
      var called = v ? 'Cat::speak()' : 'Animal::speak()';
      var result = v ? '"Meow"' : '"..."';
      var bindName = v ? '동적 바인딩 (실행 시 실제 객체로)' : '정적 바인딩 (컴파일 시 포인터 타입으로)';
      var bcol = v ? GRN : RED;

      // 우측: 두 후보 함수 + 실제로 어디로 화살표가 가는지
      var bx=W*0.58, bw=W*0.34;
      // 후보 1: Animal::speak
      var y1=H*0.18;
      var pickAnimal = (v===0);
      ctx.globalAlpha = pickAnimal?1:0.4;
      roundRect(ctx,bx,y1,bw,44,8); ctx.fillStyle=pickAnimal?'rgba(240,136,138,0.14)':'rgba(90,180,232,0.06)'; ctx.fill();
      ctx.strokeStyle= pickAnimal?RED:CPB; ctx.lineWidth= pickAnimal?2:1.2; roundRect(ctx,bx,y1,bw,44,8); ctx.stroke();
      ctx.fillStyle= pickAnimal?RED:CPB; ctx.font='600 13px ui-monospace,monospace'; ctx.textAlign='left';
      ctx.fillText('Animal::speak() → "..."', bx+14, y1+27); ctx.globalAlpha=1;
      // 후보 2: Cat::speak
      var y2=y1+64;
      var pickCat = (v===1);
      ctx.globalAlpha = pickCat?1:0.4;
      roundRect(ctx,bx,y2,bw,44,8); ctx.fillStyle=pickCat?'rgba(126,224,176,0.14)':'rgba(255,255,255,0.03)'; ctx.fill();
      ctx.strokeStyle= pickCat?GRN:'rgba(255,255,255,0.2)'; ctx.lineWidth= pickCat?2:1.2; roundRect(ctx,bx,y2,bw,44,8); ctx.stroke();
      ctx.fillStyle= pickCat?GRN:DIM; ctx.font='600 13px ui-monospace,monospace';
      ctx.fillText('Cat::speak()  → "Meow"', bx+14, y2+27); ctx.globalAlpha=1;

      // p->speak() 라벨에서 선택된 후보로 화살표
      var srcY=y2+90;
      ctx.fillStyle='#dfeaf2'; ctx.font='600 14px ui-monospace,monospace'; ctx.textAlign='left';
      ctx.fillText('p->speak()', bx, srcY);
      var tgtY = v? (y2+22):(y1+22);
      ctx.strokeStyle=bcol; ctx.lineWidth=2; ctx.setLineDash([5,4]);
      ctx.beginPath(); ctx.moveTo(bx+90, srcY-6); ctx.lineTo(bx+bw*0.5, tgtY+22); ctx.stroke(); ctx.setLineDash([]);

      // 결과 대비
      var ly=srcY+30;
      ctx.fillStyle=bcol; ctx.font='700 24px ui-monospace,Menlo,monospace'; ctx.fillText('결과: '+result, bx, ly+18);
      ctx.fillStyle=bcol; ctx.font='600 13px sans-serif'; ctx.fillText(bindName, bx, ly+42);

      ctx.fillStyle= v?GRN:GLD; ctx.font='12.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText(v? 'virtual 이 있으면 "손에 든 실제 객체"가 대답합니다 — 다형성의 핵심.'
                    : 'virtual 이 없으면 "포인터에 적힌 타입"이 대답 — 자식 것이 무시됩니다.',
                  W*0.05, H*0.93);

      E.tapHint(W/2, H*0.96, '슬라이더로 virtual 유무를 켜고 끄며 결과를 비교하세요', true);
      E.big('virtual — 진짜 객체가 대답한다 (동적 바인딩)', '앞 장의 벽을 넘을 시간입니다. Animal* p = new Cat(); 로 두고 p->speak() 를 부르면 누구 게 불릴까요? 답은 speak 앞에 virtual 이 붙었는지에 달렸습니다. virtual 이 없으면 컴파일러는 p 의 "적힌 타입"(Animal)만 보고 미리 Animal::speak 로 못 박습니다 — 정적 바인딩. 그래서 고양이인데도 "..." 이 나오죠. 하지만 virtual 을 붙이면, 프로그램이 실행되는 순간 p 가 "실제로 들고 있는 객체"가 Cat 임을 확인하고 Cat::speak 를 부릅니다 — 동적 바인딩. 이제 "Meow" 가 나옵니다. 부모 손잡이 하나로 어떤 자식이든 제 목소리를 내게 하는 것, 이것이 다형성입니다. C++ 에서 다형성의 문은 오직 virtual 로 열립니다.'); }
  },

  // ══════════ 3. 순수 가상함수 · 추상 클래스 ══════════
  { id:'cpp8_03',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(340+this.s.step*90,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'class Shape {          // 추상 클래스', hl:'Shape'},
        {t:'public:', dim:true},
        {t:'  virtual double area() = 0;  // 순수 가상', hl:'= 0'},
        {t:'};', dim:true},
        {t:'// Shape s;  // 오류! 인스턴스 못 만듦', hl:'오류'},
        {t:'class Circle : public Shape {', hl:'Circle'},
        {t:'  double r;', hl:'r'},
        {t:'  double area(){ return 3.14159*r*r; }', hl:'area'},
        {t:'};', dim:true},
        {t:'class Rect : public Shape {', hl:'Rect'},
        {t:'  double w, h;', hl:'w, h'},
        {t:'  double area(){ return w*h; }', hl:'area'},
        {t:'};', dim:true}
      ];
      var act=[2,7,11][s.step];
      codePanel(E, W*0.03, H*0.10, W*0.50, code, 'abstract_shape.cpp', act);

      // 우측: 추상 Shape → Circle / Rect. 실제 넓이 계산.
      var cx=W*0.74, pw=W*0.30, py=H*0.16;
      // Shape (추상, 점선)
      roundRect(ctx, cx-pw/2, py, pw, 50, 9); ctx.fillStyle='rgba(90,180,232,0.06)'; ctx.fill();
      ctx.strokeStyle=CPB; ctx.lineWidth=1.6; ctx.setLineDash([6,4]); roundRect(ctx,cx-pw/2,py,pw,50,9); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=CPB; ctx.font='700 13px sans-serif'; ctx.textAlign='center'; ctx.fillText('Shape (추상)', cx, py+20);
      ctx.fillStyle=DIM; ctx.font='11.5px ui-monospace,monospace'; ctx.fillText('area() = 0  (약속만)', cx, py+38);

      // 두 자식
      var chY=py+96, cw2=pw*0.92;
      var r=3, w=4, h=2;
      var aCircle=3.14159*r*r, aRect=w*h;
      // Circle
      var c1x=cx-pw*0.62;
      roundRect(ctx, c1x-cw2/2, chY, cw2, 78, 9); ctx.fillStyle='rgba(126,224,176,0.08)'; ctx.fill();
      ctx.strokeStyle=GRN; ctx.lineWidth=1.5; roundRect(ctx,c1x-cw2/2,chY,cw2,78,9); ctx.stroke();
      ctx.fillStyle=GRN; ctx.font='700 12.5px sans-serif'; ctx.textAlign='center'; ctx.fillText('Circle (r='+r+')', c1x, chY+18);
      // 원 그림
      ctx.strokeStyle=GRN; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(c1x, chY+44, 16, 0, 7); ctx.stroke();
      ctx.fillStyle= (s.step>=2)?GRN:DIM; ctx.font='600 12px ui-monospace,monospace';
      ctx.fillText('πr² = '+aCircle.toFixed(2), c1x, chY+72);
      // Rect
      var c2x=cx+pw*0.62;
      roundRect(ctx, c2x-cw2/2, chY, cw2, 78, 9); ctx.fillStyle='rgba(122,184,255,0.08)'; ctx.fill();
      ctx.strokeStyle=BLU; ctx.lineWidth=1.5; roundRect(ctx,c2x-cw2/2,chY,cw2,78,9); ctx.stroke();
      ctx.fillStyle=BLU; ctx.font='700 12.5px sans-serif'; ctx.textAlign='center'; ctx.fillText('Rect ('+w+'×'+h+')', c2x, chY+18);
      ctx.strokeStyle=BLU; ctx.lineWidth=2; ctx.strokeRect(c2x-16, chY+34, 32, 18);
      ctx.fillStyle= (s.step>=2)?BLU:DIM; ctx.font='600 12px ui-monospace,monospace';
      ctx.fillText('w·h = '+aRect.toFixed(2), c2x, chY+72);

      // 상속 화살표
      ctx.strokeStyle=CPB; ctx.lineWidth=1.6;
      [c1x,c2x].forEach(function(bx){ ctx.beginPath(); ctx.moveTo(bx, chY-4); ctx.lineTo(cx, py+58); ctx.stroke(); });

      var lx=W*0.05, ly=chY+108; if(ly>H*0.9) ly=H*0.9; ctx.textAlign='left';
      var msg=[
        {c:CPB, t:'area()=0 은 "순수 가상함수" — 몸통 없이 약속만 하는 인터페이스.'},
        {c:GRN, t:'Circle 은 그 약속을 πr² 로 실제 구현합니다.'},
        {c:BLU, t:'Rect 는 같은 약속을 w·h 로 — 각자의 방식으로 지킵니다.'}
      ][s.step];
      ctx.fillStyle=msg.c; ctx.font='600 14px sans-serif'; ctx.fillText(msg.t, lx, ly);
      ctx.fillStyle=GLD; ctx.font='12.5px sans-serif';
      ctx.fillText('추상 클래스는 인스턴스를 못 만듭니다 — 모든 순수 가상을 채운 자식만 실체가 됩니다.', lx, ly+24);

      E.tapHint(W/2, H*0.96, '화면 탭 = 순수 가상 → Circle 구현 → Rect 구현', true);
      E.big('순수 가상함수 · 추상 클래스 — 약속과 이행', '"모든 도형은 넓이를 잴 수 있다." 하지만 "도형 일반"의 넓이 공식은 없습니다 — 원인지 사각형인지에 따라 다르니까요. C++ 은 이 상황을 순수 가상함수로 표현합니다: virtual double area() = 0; 은 "몸통 없이 약속만" 하는 선언이죠. 이런 함수를 하나라도 가진 클래스는 추상 클래스가 되어 그 자체로는 객체를 만들 수 없습니다(Shape s; 는 오류). Shape 는 "넓이를 잴 줄 알아야 한다"는 인터페이스일 뿐입니다. 대신 Circle 은 πr², Rect 는 w·h 로 각자 약속을 이행합니다. 이렇게 "무엇을 할지"(인터페이스)와 "어떻게 할지"(구현)를 분리하면, 도형 종류가 아무리 늘어도 area() 한 이름으로 다룰 수 있습니다.'); }
  },

  // ══════════ 4. 가상 소멸자 (Effective 항목 7) ══════════
  { id:'cpp8_04',
    enter:function(E){ var self=this; this.s={v:1};
      E.controls('<div class="ctrl"><label>~Animal 앞 virtual</label><input type="range" id="vd" min="0" max="1" step="1" value="1"><output id="vdo">virtual 있음</output></div>');
      E.bind('#vd','input',function(e){ self.s.v=+e.target.value; document.getElementById('vdo').textContent = self.s.v?'virtual 있음':'virtual 없음'; E.blip(self.s.v?420:280,0.07); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var v=s.v, vk= v?'virtual ':'';
      var code=[
        {t:'class Animal {', hl:'Animal'},
        {t:'public:', dim:true},
        {t:'  '+vk+'~Animal(){ cout<<"~Animal "; }', hl: v?'virtual':'~Animal'},
        {t:'};', dim:true},
        {t:'class Cat : public Animal {', hl:': public Animal'},
        {t:'  int* buf;   // 힙 자원', hl:'int* buf'},
        {t:'public:', dim:true},
        {t:'  Cat(){ buf = new int[100]; }', hl:'new int'},
        {t:'  ~Cat(){ delete[] buf;         // 해제', hl:'delete[] buf'},
        {t:'          cout<<"~Cat "; }', dim:true},
        {t:'};', dim:true},
        {t:'Animal* p = new Cat();', hl:'new Cat()'},
        {t:'delete p;   // 부모 포인터로 소멸', hl:'delete p'}
      ];
      codePanel(E, W*0.03, H*0.10, W*0.50, code, v?'virtual_dtor.cpp':'nonvirtual_dtor_leak.cpp', 12);

      // 골든룰: 규칙으로 어떤 소멸자가 불리는지 결정
      // virtual 이면 ~Cat → ~Animal 둘 다, delete[] buf 실행 → 누수 없음
      // 아니면 ~Animal 만 → buf 미해제 → 누수
      var callsCat = (v===1);
      var out = callsCat ? '~Cat ~Animal ' : '~Animal ';
      var leak = !callsCat;                 // buf 해제 안 됨
      var leakBytes = leak ? 100*4 : 0;     // int[100] = 400바이트 실계산

      // 우측: delete p 로 불리는 소멸자 사슬
      var bx=W*0.58, by=H*0.18, rowh=46;
      ctx.textAlign='left';
      // ~Cat 노드
      ctx.globalAlpha = callsCat?1:0.28;
      roundRect(ctx,bx,by,W*0.34,40,8); ctx.fillStyle= callsCat?'rgba(126,224,176,0.14)':'rgba(255,255,255,0.03)'; ctx.fill();
      ctx.strokeStyle= callsCat?GRN:'rgba(255,255,255,0.2)'; ctx.lineWidth= callsCat?2:1.2; roundRect(ctx,bx,by,W*0.34,40,8); ctx.stroke();
      ctx.fillStyle= callsCat?GRN:DIM; ctx.font='600 13px ui-monospace,monospace';
      ctx.fillText('~Cat()   → delete[] buf  (자원 해제)', bx+12, by+25); ctx.globalAlpha=1;
      // 화살표
      ctx.strokeStyle=CPB; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(bx+W*0.05, by+40); ctx.lineTo(bx+W*0.05, by+rowh+4); ctx.stroke();
      // ~Animal 노드 (항상 불림)
      var ay=by+rowh+6;
      roundRect(ctx,bx,ay,W*0.34,40,8); ctx.fillStyle='rgba(90,180,232,0.12)'; ctx.fill();
      ctx.strokeStyle=CPB; ctx.lineWidth=1.6; roundRect(ctx,bx,ay,W*0.34,40,8); ctx.stroke();
      ctx.fillStyle=CPB; ctx.font='600 13px ui-monospace,monospace'; ctx.fillText('~Animal()  (부모 소멸자)', bx+12, ay+25);

      // 출력 + 누수 판정
      var oy=ay+70;
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('cout 출력:', bx, oy);
      ctx.fillStyle=GRN; ctx.font='600 16px ui-monospace,Menlo,monospace'; ctx.fillText(out, bx, oy+24);

      var ly=oy+58;
      if(leak){ ctx.fillStyle=RED; ctx.font='700 17px sans-serif';
        ctx.fillText('⚠ 메모리 누수 '+leakBytes+' 바이트!', bx, ly);
        ctx.fillStyle=RED; ctx.font='12.5px sans-serif';
        ctx.fillText('~Cat 이 안 불려 delete[] buf 가 실행되지 못했습니다.', bx, ly+22); }
      else { ctx.fillStyle=GRN; ctx.font='700 17px sans-serif';
        ctx.fillText('✓ 누수 0 바이트', bx, ly);
        ctx.fillStyle=GRN; ctx.font='12.5px sans-serif';
        ctx.fillText('~Cat 이 먼저 불려 힙 자원을 안전하게 반납했습니다.', bx, ly+22); }

      ctx.fillStyle= v?GRN:GLD; ctx.font='12.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText('규칙: 부모 포인터로 delete 할 자식이 있다면 부모 소멸자는 반드시 virtual.', W*0.05, H*0.94);

      E.tapHint(W/2, H*0.96, '슬라이더로 ~Animal 의 virtual 을 켜고 끄며 누수를 비교하세요', true);
      E.big('가상 소멸자 — 자원을 새지 않게 (Effective C++ 항목 7)', 'Animal* p = new Cat(); delete p; — 부모 포인터로 자식을 지웁니다. 이때 부모 소멸자에 virtual 이 없으면, 컴파일러는 포인터 타입만 보고 ~Animal 만 부릅니다. 자식 ~Cat 은 건너뛰어지죠. 문제는 Cat 이 생성자에서 new int[100] 으로 힙을 잡았고 그 반납을 ~Cat 의 delete[] 에 맡겼다는 것 — ~Cat 이 안 불리면 그 400바이트는 영영 새어 나갑니다. 해결은 한 단어: 부모 소멸자를 virtual ~Animal() 로 만들면, delete p 가 실제 객체가 Cat 임을 알아채 ~Cat → ~Animal 을 순서대로 부릅니다. 자원은 안전히 반납되고 누수는 0. 스콧 마이어스의 격언 그대로 — "다형적으로 쓸 기반 클래스에는 가상 소멸자를 두라."'); }
  },

  // ══════════ 5. 다형성 활용 — Shape* 배열 넓이 합 ══════════
  { id:'cpp8_05',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; E.blip(340+this.s.step*50,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 도형 배열 (결정적). type: 0=Circle(r), 1=Rect(w,h)
      var shapes=[
        {ty:0, r:2},          // Circle r=2
        {ty:1, w:3, h:4},     // Rect 3×4
        {ty:0, r:1.5},        // Circle r=1.5
        {ty:1, w:5, h:2}      // Rect 5×2
      ];
      function areaOf(sh){ return sh.ty===0 ? Math.PI*sh.r*sh.r : sh.w*sh.h; }
      function nameOf(sh){ return sh.ty===0 ? ('Circle(r='+sh.r+')') : ('Rect('+sh.w+'×'+sh.h+')'); }
      function formOf(sh){ return sh.ty===0 ? ('π·'+sh.r+'²') : (sh.w+'·'+sh.h); }

      var code=[
        {t:'Shape* shapes[] = {', hl:'Shape*'},
        {t:'  new Circle(2), new Rect(3,4),', dim:true},
        {t:'  new Circle(1.5), new Rect(5,2) };', dim:true},
        {t:'',                    dim:true},
        {t:'double total = 0;', hl:'total'},
        {t:'for (Shape* s : shapes)', hl:'for'},
        {t:'    total += s->area();  // 각자!', hl:'s->area()'},
        {t:'cout << "합 = " << total;', hl:'total'}
      ];
      codePanel(E, W*0.04, H*0.12, W*0.46, code, 'polymorphism_sum.cpp', s.step===0?0:(s.step<5?6:7));

      // 우측: 배열 순회하며 각 도형 area() 실계산, running total 누적
      var tx=W*0.56, ty=H*0.18, rowh=48;
      var visited = s.step;      // step 1..4 → 도형 0..3 처리, step 4 = 전부
      var total=0;
      ctx.textAlign='left';
      ctx.fillStyle=CPD; ctx.font='600 13px sans-serif'; ctx.fillText('for 루프 — 부모 포인터 하나로 각자의 area()', tx, ty-12);
      for(var i=0;i<shapes.length;i++){ var sh=shapes[i], done=(i<visited), a=areaOf(sh);
        if(done) total+=a;
        var ry=ty+i*rowh, active=(i===visited-1);
        var col = sh.ty===0?GRN:BLU;
        ctx.globalAlpha = done?1:0.32;
        roundRect(ctx,tx,ry,W*0.38,rowh-8,8); ctx.fillStyle= done? (sh.ty===0?'rgba(126,224,176,0.10)':'rgba(122,184,255,0.10)') : 'rgba(255,255,255,0.03)'; ctx.fill();
        ctx.strokeStyle= active?'#fff':(done?col:'rgba(255,255,255,0.15)'); ctx.lineWidth= active?2.2:1.3; roundRect(ctx,tx,ry,W*0.38,rowh-8,8); ctx.stroke();
        // 미니 도형
        var gx=tx+22, gy=ry+(rowh-8)/2;
        if(sh.ty===0){ ctx.strokeStyle=col; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(gx,gy,10,0,7); ctx.stroke(); }
        else { ctx.strokeStyle=col; ctx.lineWidth=2; ctx.strokeRect(gx-11,gy-7,22,14); }
        ctx.fillStyle= done?col:DIM; ctx.font='600 13px ui-monospace,monospace'; ctx.textAlign='left';
        ctx.fillText(nameOf(sh), tx+46, ry+18);
        ctx.fillStyle= done?'#dfeaf2':DIM; ctx.font='12px ui-monospace,monospace';
        ctx.fillText('area = '+formOf(sh)+' = '+a.toFixed(3), tx+46, ry+35);
        ctx.globalAlpha=1;
      }

      // 누적 합 (실측)
      var sy=ty+shapes.length*rowh+16;
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText('total += s->area()  (누적)', tx, sy);
      var col= (visited>=4)?GRN:GLD;
      ctx.fillStyle=col; ctx.font='700 22px ui-monospace,Menlo,monospace';
      ctx.fillText('합 = '+total.toFixed(3), tx, sy+30);
      if(visited>=4){ ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
        ctx.fillText('= '+(Math.PI*4).toFixed(3)+' + 12 + '+(Math.PI*2.25).toFixed(3)+' + 10  (원 둘은 πr² 실측)', tx, sy+52); }

      ctx.fillStyle=GLD; ctx.font='12.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText('코드는 도형 종류를 전혀 모릅니다 — s->area() 가 알아서 각자의 공식을 부릅니다.', W*0.05, H*0.93);

      E.tapHint(W/2, H*0.96, '화면 탭 = 도형을 하나씩 순회하며 넓이 누적', true);
      E.big('다형성의 활용 — 하나의 이름, 각자의 답', '이제 다형성이 왜 강력한지 보입니다. Shape* 포인터 배열에 원과 사각형을 뒤섞어 담고, for 문 한 줄로 s->area() 를 부릅니다. 이 코드는 s 가 원인지 사각형인지 전혀 묻지 않습니다 — virtual 덕분에, 매 반복마다 그 자리에 실제로 들어 있는 객체가 제 넓이 공식으로 답하죠. 원이면 πr², 사각형이면 w·h. 오른쪽에서 넓이가 하나씩 실제로 계산되어 total 에 쌓입니다(원 넓이는 π 로 진짜 계산). 만약 내일 Triangle 을 추가해도 이 for 문은 한 글자도 바뀌지 않습니다 — area() 를 구현한 새 자식만 배열에 넣으면 끝. "같은 인터페이스, 다른 구현" — 이 확장성이 객체지향 다형성의 진짜 힘입니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
