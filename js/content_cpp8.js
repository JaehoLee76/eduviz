/* C++ 제8장 — 다형성·가상함수(virtual)
   동작(behavior)만. 텍스트=content/cpp8.json. 엔진 js/engine.js 공유. 색: C++=하늘색(#5ab4e8).
   골든룰: 화면의 모든 바인딩 결과·넓이·자원 누수 판정은 draw에서 실제 규칙/실공식으로 계산(베껴 박지 않음).
   좌측=진짜 C++ 코드(줄커서), 우측=포인터 vs 실제객체·virtual 유무 결과 대비·추상클래스·가상소멸자·넓이 합 실측.
   "virtual — 포인터가 아니라 진짜 객체가 답한다" (다형성 실무 기반). */
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
      var codeBot=codePanel(E, W*0.04, H*0.14, W*0.46, code, 'base_pointer.cpp', act);

      // 우측: 포인터(타입) vs 실제 객체(내용) — 우측영역 x∈[0.56W, 0.96W]
      var px=W*0.56, py=H*0.22, pbw=W*0.11;
      // 포인터 상자
      roundRect(ctx, px, py, pbw, 54, 8); ctx.fillStyle='rgba(90,180,232,0.10)'; ctx.fill();
      ctx.strokeStyle=CPB; ctx.lineWidth=1.6; roundRect(ctx,px,py,pbw,54,8); ctx.stroke();
      ctx.fillStyle=CPB; ctx.font='600 14px ui-monospace,monospace'; ctx.textAlign='center';
      ctx.fillText('p', px+pbw/2, py+22); ctx.fillStyle=DIM; ctx.font='13px sans-serif';
      ctx.fillText('타입: Animal*', px+pbw/2, py+42);

      // 화살표 → 힙 객체
      var ox=W*0.71, oy=py-6;
      ctx.strokeStyle=GRN; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(px+pbw, py+27); ctx.lineTo(ox-4, py+27); ctx.stroke();
      ctx.fillStyle=GRN; ctx.beginPath(); ctx.moveTo(ox+8,py+27); ctx.lineTo(ox-4,py+21); ctx.lineTo(ox-4,py+33); ctx.closePath(); ctx.fill();

      // 실제 객체 = Cat (Animal 부분 + Cat 부분)
      var owx=W*0.20;
      roundRect(ctx, ox+10, oy, owx, 96, 9); ctx.fillStyle='rgba(126,224,176,0.08)'; ctx.fill();
      ctx.strokeStyle=GRN; ctx.lineWidth=1.6; roundRect(ctx,ox+10,oy,owx,96,9); ctx.stroke();
      ctx.fillStyle=GRN; ctx.font='700 13px sans-serif'; ctx.textAlign='center'; ctx.fillText('실제 객체: Cat', ox+10+owx/2, oy+18);
      // Animal 부분 (포인터로 보이는 창)
      ctx.fillStyle= (s.step>=1)?'rgba(90,180,232,0.20)':'rgba(90,180,232,0.08)';
      ctx.fillRect(ox+22, oy+28, owx-24, 26);
      ctx.strokeStyle=CPB; ctx.lineWidth= (s.step>=1)?2:1; ctx.strokeRect(ox+22, oy+28, owx-24, 26);
      ctx.fillStyle=CPD; ctx.font='13px ui-monospace,monospace'; ctx.textAlign='left'; ctx.fillText('name·eat()·sleep()', ox+28, oy+45);
      // Cat 부분 (가려진 창)
      ctx.globalAlpha = (s.step>=2)?1:0.4;
      ctx.fillStyle='rgba(255,255,255,0.03)'; ctx.fillRect(ox+22, oy+60, owx-24, 26);
      ctx.strokeStyle= (s.step>=2)?RED:'rgba(255,255,255,0.15)'; ctx.lineWidth=1.4; ctx.setLineDash(s.step>=2?[4,3]:[]); ctx.strokeRect(ox+22, oy+60, owx-24, 26); ctx.setLineDash([]);
      ctx.fillStyle= (s.step>=2)?RED:DIM; ctx.font='13px ui-monospace,monospace'; ctx.fillText('meow() ← p 로는 안 보임', ox+28, oy+77);
      ctx.globalAlpha=1;

      // 설명 (좌측 — 코드패널 아래로). 2번째 줄이 하단(0.92H)을 넘지 않게 상한 클램프.
      var lx=W*0.05, ly=Math.max(py+140, codeBot+26); var lyMax=H*0.92-24; if(ly>lyMax) ly=lyMax; ctx.textAlign='left';
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
      var codeBot=codePanel(E, W*0.03, H*0.10, W*0.50, code, 'abstract_shape.cpp', act);

      // 우측: 추상 Shape → Circle / Rect. 실제 넓이 계산. 우측영역 x∈[0.54W, 0.97W]
      var cx=W*0.755, pw=W*0.22, py=H*0.16;
      // Shape (추상, 점선)
      roundRect(ctx, cx-pw/2, py, pw, 50, 9); ctx.fillStyle='rgba(90,180,232,0.06)'; ctx.fill();
      ctx.strokeStyle=CPB; ctx.lineWidth=1.6; ctx.setLineDash([6,4]); roundRect(ctx,cx-pw/2,py,pw,50,9); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=CPB; ctx.font='700 13px sans-serif'; ctx.textAlign='center'; ctx.fillText('Shape (추상)', cx, py+20);
      ctx.fillStyle=DIM; ctx.font='13.5px ui-monospace,monospace'; ctx.fillText('area() = 0  (약속만)', cx, py+38);

      // 두 자식
      var chY=py+96, cw2=pw*0.86;
      var r=3, w=4, h=2;
      var aCircle=3.14159*r*r, aRect=w*h;
      // Circle
      var c1x=cx-pw*0.52;
      roundRect(ctx, c1x-cw2/2, chY, cw2, 78, 9); ctx.fillStyle='rgba(126,224,176,0.08)'; ctx.fill();
      ctx.strokeStyle=GRN; ctx.lineWidth=1.5; roundRect(ctx,c1x-cw2/2,chY,cw2,78,9); ctx.stroke();
      ctx.fillStyle=GRN; ctx.font='700 12.5px sans-serif'; ctx.textAlign='center'; ctx.fillText('Circle (r='+r+')', c1x, chY+18);
      // 원 그림
      ctx.strokeStyle=GRN; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(c1x, chY+44, 16, 0, 7); ctx.stroke();
      ctx.fillStyle= (s.step>=2)?GRN:DIM; ctx.font='600 12px ui-monospace,monospace';
      ctx.fillText('πr² = '+aCircle.toFixed(2), c1x, chY+72);
      // Rect
      var c2x=cx+pw*0.52;
      roundRect(ctx, c2x-cw2/2, chY, cw2, 78, 9); ctx.fillStyle='rgba(122,184,255,0.08)'; ctx.fill();
      ctx.strokeStyle=BLU; ctx.lineWidth=1.5; roundRect(ctx,c2x-cw2/2,chY,cw2,78,9); ctx.stroke();
      ctx.fillStyle=BLU; ctx.font='700 12.5px sans-serif'; ctx.textAlign='center'; ctx.fillText('Rect ('+w+'×'+h+')', c2x, chY+18);
      ctx.strokeStyle=BLU; ctx.lineWidth=2; ctx.strokeRect(c2x-16, chY+34, 32, 18);
      ctx.fillStyle= (s.step>=2)?BLU:DIM; ctx.font='600 12px ui-monospace,monospace';
      ctx.fillText('w·h = '+aRect.toFixed(2), c2x, chY+72);

      // 상속 화살표
      ctx.strokeStyle=CPB; ctx.lineWidth=1.6;
      [c1x,c2x].forEach(function(bx){ ctx.beginPath(); ctx.moveTo(bx, chY-4); ctx.lineTo(cx, py+58); ctx.stroke(); });

      // 설명 = 우측영역 자식 박스 아래(코드패널이 좌측을 꽉 채우므로)
      var lx=W*0.55, ly=chY+78+34; var lyMax=H*0.90-22; if(ly>lyMax) ly=lyMax; ctx.textAlign='left';
      var msg=[
        {c:CPB, t:'area()=0 은 "순수 가상함수" — 몸통 없이 약속만.'},
        {c:GRN, t:'Circle 은 그 약속을 πr² 로 실제 구현합니다.'},
        {c:BLU, t:'Rect 는 같은 약속을 w·h 로 — 각자의 방식으로.'}
      ][s.step];
      ctx.fillStyle=msg.c; ctx.font='600 13.5px sans-serif'; ctx.fillText(msg.t, lx, ly);
      ctx.fillStyle=GLD; ctx.font='12px sans-serif';
      ctx.fillText('추상 클래스는 인스턴스를 못 만듭니다 — 순수 가상을 채운 자식만 실체.', lx, ly+22);

      E.tapHint(W/2, H*0.96, '화면 탭 = 순수 가상 → Circle 구현 → Rect 구현', true);
      E.big('순수 가상함수 · 추상 클래스 — 약속과 이행', '"모든 도형은 넓이를 잴 수 있다." 하지만 "도형 일반"의 넓이 공식은 없습니다 — 원인지 사각형인지에 따라 다르니까요. C++ 은 이 상황을 순수 가상함수로 표현합니다: virtual double area() = 0; 은 "몸통 없이 약속만" 하는 선언이죠. 이런 함수를 하나라도 가진 클래스는 추상 클래스가 되어 그 자체로는 객체를 만들 수 없습니다(Shape s; 는 오류). Shape 는 "넓이를 잴 줄 알아야 한다"는 인터페이스일 뿐입니다. 대신 Circle 은 πr², Rect 는 w·h 로 각자 약속을 이행합니다. 이렇게 "무엇을 할지"(인터페이스)와 "어떻게 할지"(구현)를 분리하면, 도형 종류가 아무리 늘어도 area() 한 이름으로 다룰 수 있습니다.'); }
  },

  // ══════════ 4. 가상 소멸자 (핵심 규칙) ══════════
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
      ctx.fillText('규칙: 부모 포인터로 delete 할 자식이 있다면 부모 소멸자는 반드시 virtual.', W*0.05, H*0.92);

      E.tapHint(W/2, H*0.96, '슬라이더로 ~Animal 의 virtual 을 켜고 끄며 누수를 비교하세요', true);
      E.big('가상 소멸자 — 자원을 새지 않게 (핵심 규칙)', 'Animal* p = new Cat(); delete p; — 부모 포인터로 자식을 지웁니다. 이때 부모 소멸자에 virtual 이 없으면, 컴파일러는 포인터 타입만 보고 ~Animal 만 부릅니다. 자식 ~Cat 은 건너뛰어지죠. 문제는 Cat 이 생성자에서 new int[100] 으로 힙을 잡았고 그 반납을 ~Cat 의 delete[] 에 맡겼다는 것 — ~Cat 이 안 불리면 그 400바이트는 영영 새어 나갑니다. 해결은 한 단어: 부모 소멸자를 virtual ~Animal() 로 만들면, delete p 가 실제 객체가 Cat 임을 알아채 ~Cat → ~Animal 을 순서대로 부릅니다. 자원은 안전히 반납되고 누수는 0. 한 문장 규칙으로 요약하면 — "다형적으로 쓸 기반 클래스에는 가상 소멸자를 두라."'); }
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
      if(visited>=4){ ctx.fillStyle=DIM; ctx.font='13.5px sans-serif';
        ctx.fillText('= '+(Math.PI*4).toFixed(3)+' + 12 + '+(Math.PI*2.25).toFixed(3)+' + 10  (원 둘은 πr²)', tx, sy+52); }

      ctx.fillStyle=GLD; ctx.font='12.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText('코드는 도형 종류를 전혀 모릅니다 — s->area() 가 알아서 각자의 공식을 부릅니다.', W*0.05, H*0.93);

      E.tapHint(W/2, H*0.96, '화면 탭 = 도형을 하나씩 순회하며 넓이 누적', true);
      E.big('다형성의 활용 — 하나의 이름, 각자의 답', '이제 다형성이 왜 강력한지 보입니다. Shape* 포인터 배열에 원과 사각형을 뒤섞어 담고, for 문 한 줄로 s->area() 를 부릅니다. 이 코드는 s 가 원인지 사각형인지 전혀 묻지 않습니다 — virtual 덕분에, 매 반복마다 그 자리에 실제로 들어 있는 객체가 제 넓이 공식으로 답하죠. 원이면 πr², 사각형이면 w·h. 오른쪽에서 넓이가 하나씩 total 에 쌓입니다. 만약 내일 Triangle 을 추가해도 이 for 문은 한 글자도 바뀌지 않습니다 — area() 를 구현한 새 자식만 배열에 넣으면 끝. "같은 인터페이스, 다른 구현" — 이 확장성이 객체지향 다형성의 진짜 힘입니다.'); }
  },

  // ══════════════════ 심화학습 (제8장 다형성) ══════════════════

  // ─── NVI (비가상 인터페이스) 관용구 ───
  { id:'cpp8_02_nvi', branchOf:'cpp8_02', ord:1,
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(340+this.s.step*60,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'class Report {', hl:'Report'},
        {t:'public:', dim:true},
        {t:'  void run(){          // 비가상 (고정)', hl:'void run'},
        {t:'    log("start");      // 공통 전처리', hl:'log("start")'},
        {t:'    doRun();           // 가상 알맹이', hl:'doRun()'},
        {t:'    log("end");        // 공통 후처리', hl:'log("end")'},
        {t:'  }', dim:true},
        {t:'private:', dim:true},
        {t:'  virtual void doRun() = 0; // 파생이 채움', hl:'virtual void doRun'},
        {t:'};', dim:true},
        {t:'class Sales : public Report {', hl:'Sales'},
        {t:'  void doRun(){ /* 매출 표 */ }', hl:'doRun'},
        {t:'};   Sales r;  r.run();', hl:'r.run()'}
      ];
      var act=[3,4,5,12][s.step];
      var codeBot=codePanel(E, W*0.03, H*0.08, W*0.50, code, 'nvi_idiom.cpp', act);

      // 골든룰: run() 호출 시 실제 실행 로그를 순서대로 조립
      var seq=[
        {t:'log("start")',        note:'부모가 통제하는 전처리', col:CPB, on:s.step>=1},
        {t:'doRun()  (가상 호출)', note:'실제 객체 Sales::doRun 실행', col:GRN, on:s.step>=2},
        {t:'log("end")',          note:'부모가 통제하는 후처리', col:CPB, on:s.step>=3}
      ];

      // 우측 x∈[0.55W,0.97W]: public run() → private doRun() 흐름
      var bx=W*0.57, by=H*0.14, bw=W*0.38;
      // public run() 헤더
      roundRect(ctx,bx,by,bw,38,8); ctx.fillStyle='rgba(90,180,232,0.12)'; ctx.fill();
      ctx.strokeStyle=CPB; ctx.lineWidth=1.8; roundRect(ctx,bx,by,bw,38,8); ctx.stroke();
      ctx.fillStyle=CPB; ctx.font='700 13px ui-monospace,monospace'; ctx.textAlign='left';
      ctx.fillText('public run()  ← 사용자가 부름', bx+12, by+23);

      var sy=by+56, rowh=52;
      for(var i=0;i<seq.length;i++){ var e=seq[i], ry=sy+i*rowh;
        ctx.globalAlpha=e.on?1:0.25;
        var isVirtual=(i===1);
        roundRect(ctx,bx+18,ry,bw-18,rowh-12,8);
        ctx.fillStyle= e.on?(isVirtual?'rgba(126,224,176,0.12)':'rgba(90,180,232,0.08)'):'rgba(255,255,255,0.03)'; ctx.fill();
        ctx.strokeStyle= e.on?e.col:'rgba(255,255,255,0.15)'; ctx.lineWidth= e.on?1.6:1.2;
        ctx.setLineDash(isVirtual?[5,3]:[]); roundRect(ctx,bx+18,ry,bw-18,rowh-12,8); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle= e.on?e.col:DIM; ctx.font='600 13px ui-monospace,monospace';
        ctx.fillText((i+1)+'. '+e.t, bx+30, ry+18);
        ctx.fillStyle=DIM; ctx.font='13px sans-serif';
        ctx.fillText(e.note, bx+30, ry+35);
        ctx.globalAlpha=1;
        // 연결선
        if(i<seq.length-1){ ctx.strokeStyle='rgba(90,180,232,0.3)'; ctx.lineWidth=1.5;
          ctx.beginPath(); ctx.moveTo(bx+30, ry+rowh-12); ctx.lineTo(bx+30, ry+rowh); ctx.stroke(); }
      }
      // 실제 출력 로그 조립 (골든룰)
      var out=''; if(s.step>=1) out+='start '; if(s.step>=2) out+='[Sales] '; if(s.step>=3) out+='end';
      var oy=sy+seq.length*rowh+8;
      ctx.fillStyle=DIM; ctx.font='13.5px sans-serif'; ctx.textAlign='left'; ctx.fillText('실행 로그:', bx, oy);
      ctx.fillStyle=GRN; ctx.font='600 15px ui-monospace,monospace'; ctx.fillText(out||'(아직 없음)', bx, oy+22);

      var lx=W*0.05, ly=Math.max(codeBot+26, H*0.86); if(ly>H*0.92) ly=H*0.92; ctx.textAlign='left';
      ctx.fillStyle=GLD; ctx.font='12.5px sans-serif';
      ctx.fillText('전·후처리는 부모가 붙박이로 통제하고, 파생은 가운데 알맹이(doRun)만 바꿉니다.', lx, ly);

      E.tapHint(W/2, H*0.96, '화면 탭 = 전처리 → 가상 알맹이 → 후처리', true);
      E.big('심화 · 비가상 인터페이스(NVI) 관용구', '가상 함수를 public 으로 그냥 노출하면, 파생 클래스마다 전처리·후처리를 잊거나 제각각으로 넣어 일관성이 무너지기 쉽습니다. NVI(비가상 인터페이스) 관용구는 이 순서를 뒤집습니다: 바깥에 드러나는 함수 run() 은 비가상으로 고정하고, 그 안에서 private 가상 함수 doRun() 을 부릅니다. 사용자는 언제나 run() 만 호출하죠. run() 은 항상 같은 골격을 실행합니다 — 먼저 공통 전처리(로깅·락·검증), 그다음 doRun() 으로 파생마다 다른 "알맹이"를 실행, 마지막에 공통 후처리. 파생 클래스 Sales 는 doRun() 만 채우면 되고, 전·후처리를 손댈 수도 없고 잊을 수도 없습니다 — 부모가 뼈대를 완전히 통제하니까요. 오른쪽 로그가 순서 그대로입니다: start → [Sales] → end. "무엇을 언제 하는지(뼈대)는 부모가, 그 사이 알맹이만 자식이" — 재정의의 범위를 안전하게 좁히는 강력한 설계 관용구입니다.'); }
  },

  // ─── 가상함수 기본 매개변수 함정 ───
  { id:'cpp8_02_defarg', branchOf:'cpp8_02', ord:2,
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(340+this.s.step*80,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'class Shape {', hl:'Shape'},
        {t:'public:', dim:true},
        {t:'  virtual void draw(int color = 1){', hl:'color = 1'},
        {t:'    print("Shape", color); }', dim:true},
        {t:'};', dim:true},
        {t:'class Circle : public Shape {', hl:'Circle'},
        {t:'  void draw(int color = 5){        // 기본 5', hl:'color = 5'},
        {t:'    print("Circle", color); }', dim:true},
        {t:'};', dim:true},
        {t:'Shape* p = new Circle();', hl:'new Circle()'},
        {t:'p->draw();   // 기본 인자? 구현?', hl:'p->draw()'}
      ];
      var act=[2,6,10][s.step];
      var codeBot=codePanel(E, W*0.03, H*0.10, W*0.50, code, 'virtual_default_arg.cpp', act);

      // 골든룰: 규칙으로 두 조각을 각각 정적/동적으로 결정
      // 기본 인자: 정적 바인딩 → 포인터 타입 Shape 의 기본값 = 1
      // 함수 본체: 동적 바인딩 → 실제 객체 Circle::draw 실행
      // 결과: Circle 의 코드가 color=1(Shape 기본값!)로 실행 → print("Circle", 1)
      var argFrom = 'Shape (정적 타입)';   var argVal = 1;
      var bodyFrom = 'Circle (동적 객체)'; var bodyName = 'Circle::draw';
      var result = 'print("Circle", '+argVal+')';

      // 우측 x∈[0.55W,0.97W]: 두 조각이 서로 다른 출처에서 온다
      var bx=W*0.57, by=H*0.15, bw=W*0.38, rowh=70;
      var rows=[
        {label:'기본 인자 color', from:argFrom, val:'= '+argVal, bind:'정적 바인딩', col:GLD, on:s.step>=1},
        {label:'함수 본체 draw',  from:bodyFrom, val:bodyName, bind:'동적 바인딩', col:GRN, on:s.step>=2}
      ];
      ctx.textAlign='left'; ctx.fillStyle=CPD; ctx.font='600 13px sans-serif';
      ctx.fillText('p->draw() 는 두 조각으로 쪼개집니다', bx, by-8);
      for(var i=0;i<rows.length;i++){ var r=rows[i], ry=by+i*rowh;
        ctx.globalAlpha=r.on?1:0.25;
        roundRect(ctx,bx,ry,bw,rowh-14,9); ctx.fillStyle= r.on?(r.col===GLD?'rgba(255,210,122,0.10)':'rgba(126,224,176,0.10)'):'rgba(255,255,255,0.03)'; ctx.fill();
        ctx.strokeStyle= r.on?r.col:'rgba(255,255,255,0.15)'; ctx.lineWidth= r.on?1.7:1.2; roundRect(ctx,bx,ry,bw,rowh-14,9); ctx.stroke();
        ctx.fillStyle= r.on?r.col:DIM; ctx.font='600 13px ui-monospace,monospace';
        ctx.fillText(r.label+'  '+r.val, bx+14, ry+22);
        ctx.fillStyle=DIM; ctx.font='13px sans-serif';
        ctx.fillText('출처: '+r.from+'  ('+r.bind+')', bx+14, ry+42);
        ctx.globalAlpha=1;
      }
      // 뒤섞인 결과
      var oy=by+rows.length*rowh+6;
      if(s.step>=2){
        ctx.fillStyle=RED; ctx.font='700 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('⚠ 뒤섞임: Circle 의 몸통이 Shape 의 기본값 1 로 실행', bx, oy);
        ctx.fillStyle='#dfeaf2'; ctx.font='600 12px sans-serif'; ctx.fillText('실제 출력:', bx, oy+26);
        ctx.fillStyle=RED; ctx.font='700 17px ui-monospace,monospace'; ctx.fillText(result, bx, oy+50);
        ctx.fillStyle=DIM; ctx.font='13px sans-serif';
        ctx.fillText('기대했던 5(Circle 기본값)도 아니고 "Shape"도 아닌 이상한 조합', bx, oy+70);
      }

      var lx=W*0.05, ly=Math.max(codeBot+26, H*0.88); if(ly>H*0.93) ly=H*0.93; ctx.textAlign='left';
      ctx.fillStyle=GLD; ctx.font='12.5px sans-serif';
      ctx.fillText('기본 인자는 포인터 타입으로, 함수 본체는 실제 객체로 — 출처가 갈려 사고가 납니다.', lx, ly);

      E.tapHint(W/2, H*0.96, '화면 탭 = 기본 인자(정적) → 본체(동적) → 뒤섞인 결과', true);
      E.big('심화 · 가상함수 기본 매개변수의 함정', '가상 함수 하나에 기본 인자를 걸어 두면, 겉보기엔 편해도 조용한 함정이 생깁니다. p->draw() 한 번의 호출이 사실은 서로 다른 규칙을 따르는 두 조각으로 쪼개지기 때문입니다. 첫째, 기본 인자 color 의 값은 정적 바인딩으로 결정됩니다 — 즉 포인터에 적힌 타입 Shape 를 보고 Shape 의 기본값 1 을 씁니다(실행 시점이 아니라 컴파일 시점에 박힘). 둘째, 실제 실행될 함수 본체는 동적 바인딩으로 결정됩니다 — 진짜 객체가 Circle 이니 Circle::draw 의 코드가 돕니다. 이 둘이 뒤섞이면 결과는 print("Circle", 1) — Circle 의 몸통이 엉뚱하게 Shape 의 기본값 1 로 실행됩니다. 개발자가 기대한 5(Circle 의 기본값)도, 부모의 "Shape"도 아닌 괴상한 조합이죠. 이유를 모르면 몇 시간을 태우는 버그입니다. 안전한 습관은 분명합니다 — 가상 함수에는 기본 인자를 걸지 마세요. 정 필요하면 앞서 본 NVI 처럼 비가상 함수 쪽에 기본값을 두고 그 안에서 인자 없는 가상 함수를 부르면 됩니다.'); }
  },

  // ─── 순수 가상함수에 구현 제공 ───
  { id:'cpp8_03_purevimpl', branchOf:'cpp8_03', ord:1,
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(340+this.s.step*80,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'class Animal {', hl:'Animal'},
        {t:'public:', dim:true},
        {t:'  virtual void move() = 0;  // 순수 가상', hl:'= 0'},
        {t:'};', dim:true},
        {t:'// 하지만 몸통을 줄 수 있다!', dim:true},
        {t:'void Animal::move(){', hl:'Animal::move'},
        {t:'  cout << "다리로 걷기(공통 기본)";', hl:'공통 기본'},
        {t:'}', dim:true},
        {t:'class Dog : public Animal {', hl:'Dog'},
        {t:'  void move(){', hl:'move'},
        {t:'    Animal::move();  // 공통 동작 재사용', hl:'Animal::move()'},
        {t:'    cout << " + 꼬리 흔들기"; }', hl:'꼬리'},
        {t:'};', dim:true}
      ];
      var act=[2,5,10][s.step];
      var codeBot=codePanel(E, W*0.03, H*0.08, W*0.50, code, 'pure_virtual_impl.cpp', act);

      // 골든룰: Dog::move() 실행 시 실제로 이어붙는 출력
      // 1) 선언 =0 → 추상 (Dog 는 반드시 재정의)
      // 2) 그럼에도 Animal::move 에 몸통 존재 → 공통 기본 동작
      // 3) Dog::move 가 Animal::move() 를 명시 호출 후 자기 것 추가
      var base='다리로 걷기(공통 기본)';
      var extra=' + 꼬리 흔들기';
      var out=''; if(s.step>=1) out=base; if(s.step>=2) out=base+extra;

      // 우측 x∈[0.55W,0.97W]
      var bx=W*0.57, by=H*0.14, bw=W*0.38;
      // Animal (추상, 하지만 구현 보유)
      roundRect(ctx,bx,by,bw,58,9); ctx.fillStyle='rgba(90,180,232,0.06)'; ctx.fill();
      ctx.strokeStyle=CPB; ctx.lineWidth=1.6; ctx.setLineDash([6,4]); roundRect(ctx,bx,by,bw,58,9); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=CPB; ctx.font='700 13px sans-serif'; ctx.textAlign='left';
      ctx.fillText('Animal  (추상: move()=0)', bx+12, by+22);
      ctx.fillStyle= (s.step>=1)?GRN:DIM; ctx.font='13.5px ui-monospace,monospace';
      ctx.fillText('▸ 하지만 move() 몸통 존재 → 공통 기본', bx+12, by+44);

      // Dog (구체)
      var dy=by+80;
      roundRect(ctx,bx,dy,bw,58,9); ctx.fillStyle='rgba(126,224,176,0.08)'; ctx.fill();
      ctx.strokeStyle=GRN; ctx.lineWidth=1.6; roundRect(ctx,bx,dy,bw,58,9); ctx.stroke();
      ctx.fillStyle=GRN; ctx.font='700 13px sans-serif';
      ctx.fillText('Dog::move()  (구체)', bx+12, dy+22);
      ctx.fillStyle= (s.step>=2)?GLD:DIM; ctx.font='13.5px ui-monospace,monospace';
      ctx.fillText('Animal::move() 호출 + 자기 동작 추가', bx+12, dy+44);
      // 화살표 Dog → Animal (공통 재사용)
      if(s.step>=2){ ctx.strokeStyle=GLD; ctx.lineWidth=1.6; ctx.setLineDash([4,3]);
        ctx.beginPath(); ctx.moveTo(bx+bw-30, dy-2); ctx.lineTo(bx+bw-30, by+60); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle=GLD; ctx.font='12px sans-serif'; ctx.textAlign='right';
        ctx.fillText('공통 재사용', bx+bw-4, (dy+by+60)/2); ctx.textAlign='left'; }

      // 실제 출력
      var oy=dy+82;
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('d.move() 출력:', bx, oy);
      ctx.fillStyle=GRN; ctx.font='600 15px ui-monospace,monospace'; ctx.fillText(out||'(아직 없음)', bx, oy+24);

      var lx=W*0.05, ly=Math.max(codeBot+26, H*0.86); if(ly>H*0.92) ly=H*0.92; ctx.textAlign='left';
      ctx.fillStyle=GLD; ctx.font='12.5px sans-serif';
      ctx.fillText('=0 이라도 몸통을 줄 수 있어 파생이 공통 기본동작을 Base::f() 로 재사용합니다.', lx, ly);

      E.tapHint(W/2, H*0.96, '화면 탭 = 순수 가상 선언 → 공통 몸통 → Dog 가 재사용', true);
      E.big('심화 · 순수 가상함수에 구현 제공', '순수 가상함수 = 0 은 흔히 "몸통이 없다"고 배우지만, 정확히는 "파생이 반드시 재정의해야 한다"는 뜻일 뿐 몸통을 못 준다는 말이 아닙니다. C++ 은 = 0 으로 선언한 함수에도 클래스 밖에서 별도로 구현(void Animal::move(){ ... })을 붙이는 것을 허용합니다. 그러면 Animal 은 여전히 추상 클래스라 그 자체로는 객체를 못 만들지만(반드시 파생해야 함), 그 안에는 "모든 동물의 공통 이동 방식" 같은 기본 동작이 담깁니다. 파생 클래스 Dog 는 move() 를 재정의할 의무를 지되, 그 안에서 Animal::move() 를 명시적으로 불러 공통 부분을 그대로 재사용하고 자기만의 동작을 덧붙일 수 있죠. 오른쪽 출력이 그 결과입니다 — "다리로 걷기(공통 기본)" + " 꼬리 흔들기". "인터페이스는 강제하되(재정의 필수), 공통 살림은 부모가 한 번만 써 두고 자식이 빌려 쓴다" — 중복을 줄이는 유용한 관용구입니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
