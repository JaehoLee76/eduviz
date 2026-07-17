/* 파이썬 제4장 — 객체와 모듈: 클래스·객체 · 상속 · 매직메서드 · 모듈·import · 패키지·가상환경
   동작(behavior)만. 텍스트=content/py4.json. 엔진 js/engine.js 공유. 색: Python=골드/노랑(#ffd343).
   골든룰: 화면에 표시되는 모든 출력값(bark 결과·Vector 합·math.sqrt·len 등)은 실제로 계산한 값(베껴 박지 않음).
   왼쪽=진짜 파이썬 코드 패널, 오른쪽=객체 상태/실행 결과 시각화. */
(function(){
  var PYL='#ffd343', PYB='#6cb6e8', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', PNK='#f4a0c0', DIM='#9b99a3', RED='#f0888a';

  function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  // 등폭 코드 패널: lines=[{t:'코드', hl:'tok', dim:true}|문자열]. tok이 들어간 부분만 골드 강조.
  function codePanel(E, x, y, w, lines, title, actLine){
    var ctx=E.ctx, lh=21, pad=14, top=y, n=lines.length, ht=n*lh+pad*2+(title?26:0);
    ctx.fillStyle='rgba(255,255,255,0.035)'; ctx.strokeStyle='rgba(255,211,67,0.30)'; ctx.lineWidth=1;
    roundRect(ctx,x,top,w,ht,10); ctx.fill(); ctx.stroke();
    var cy=top+pad+(title?26:0);
    if(title){ ctx.fillStyle=PYL; ctx.font='600 12px sans-serif'; ctx.textAlign='left'; ctx.fillText(title, x+pad, top+pad+12); }
    ctx.font='13px ui-monospace,Menlo,Consolas,monospace'; ctx.textAlign='left';
    for(var i=0;i<n;i++){
      var L=lines[i], t=(typeof L==='string')?L:L.t, hl=(typeof L==='object')?L.hl:null;
      var ty=cy+i*lh+11;
      if(actLine!=null && i===actLine){ ctx.fillStyle='rgba(255,211,67,0.16)'; ctx.fillRect(x+4, cy+i*lh+1, w-8, lh-2); ctx.fillStyle=PYL; ctx.fillRect(x+4, cy+i*lh+1, 3, lh-2); }
      if(hl && t.indexOf(hl)>=0){
        var a=t.split(hl), pre=a[0], post=a.slice(1).join(hl);
        ctx.fillStyle=DIM; ctx.fillText(pre, x+pad, ty);
        var wpre=ctx.measureText(pre).width;
        ctx.fillStyle=PYL; ctx.fillText(hl, x+pad+wpre, ty);
        var whl=ctx.measureText(hl).width;
        ctx.fillStyle=DIM; ctx.fillText(post, x+pad+wpre+whl, ty);
      } else {
        ctx.fillStyle=(L.dim?DIM:'#e8e2cf'); ctx.fillText(t, x+pad, ty);
      }
    }
    return top+ht;
  }

  // 객체 상태 박스(속성 테이블)
  function objBox(ctx,x,y,w,title,rows,col){
    var lh=24, hh=28, ht=hh+rows.length*lh+10;
    ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.strokeStyle=col; ctx.lineWidth=2; roundRect(ctx,x,y,w,ht,9); ctx.fill(); ctx.stroke();
    ctx.fillStyle=col; ctx.font='600 13.5px ui-monospace,Menlo,monospace'; ctx.textAlign='left'; ctx.fillText(title, x+12, y+18);
    ctx.strokeStyle='rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.moveTo(x,y+hh); ctx.lineTo(x+w,y+hh); ctx.stroke();
    for(var i=0;i<rows.length;i++){
      var ry=y+hh+i*lh+16;
      ctx.fillStyle='#cfe6e8'; ctx.font='13px ui-monospace,Menlo,monospace'; ctx.textAlign='left'; ctx.fillText(rows[i][0], x+12, ry);
      ctx.fillStyle=GLD; ctx.textAlign='right'; ctx.fillText(rows[i][1], x+w-12, ry);
    }
    return y+ht;
  }

  function cell(ctx,x,y,w,h,txt,fill,stroke,tcol,fs){
    ctx.fillStyle=fill||'rgba(255,255,255,0.04)'; ctx.fillRect(x,y,w,h);
    ctx.strokeStyle=stroke||'rgba(255,255,255,0.12)'; ctx.lineWidth=1; ctx.strokeRect(x,y,w,h);
    if(txt!=null){ ctx.fillStyle=tcol||'#dfeef0'; ctx.font=(fs||13)+'px ui-monospace,Menlo,monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(''+txt, x+w/2, y+h/2+1); ctx.textBaseline='alphabetic'; }
  }

  var scenes = [

  // ══════════ 1. 클래스 · 객체 — class Dog: __init__/메서드 ══════════
  { id:'py4_01',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'class Dog:', hl:'class'},
        {t:'    def __init__(self, name, age):', hl:'__init__'},
        {t:'        self.name = name', hl:'self.name'},
        {t:'        self.age  = age', hl:'self.age'},
        {t:'    def bark(self):', hl:'bark'},
        {t:'        return f"{self.name}: 멍멍!"', hl:'멍멍'},
        {t:'', dim:true},
        {t:'d = Dog("바둑이", 3)', hl:'Dog'},
        {t:'d.bark()', hl:'bark'}
      ];
      var act = s.step===1 ? 7 : (s.step===2 ? 8 : null);   // 객체 생성 / bark() 호출
      codePanel(E, W*0.05, H*0.16, W*0.42, code, 'dog.py', act);

      var gx=W*0.55, gw=W*0.40;
      // 클래스(설계도) → 객체(인스턴스) 그림
      ctx.fillStyle=PYL; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('클래스 = 설계도,  객체 = 그 설계로 찍어낸 실체', gx-20, H*0.16);

      // 설계도 박스
      var bx=gx, by=H*0.22;
      ctx.fillStyle='rgba(108,182,232,0.08)'; ctx.strokeStyle=PYB; ctx.lineWidth=2; ctx.setLineDash([5,4]); roundRect(ctx,bx,by,gw*0.46,84,9); ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=PYB; ctx.font='600 13px ui-monospace,Menlo,monospace'; ctx.fillText('class Dog', bx+12, by+22);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('속성: name, age', bx+12, by+44);
      ctx.fillText('메서드: bark()', bx+12, by+62);

      // 화살표
      var ay=by+42;
      ctx.strokeStyle=GLD; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(bx+gw*0.46+4, ay); ctx.lineTo(bx+gw*0.46+30, ay); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx+gw*0.46+30,ay); ctx.lineTo(bx+gw*0.46+22,ay-5); ctx.lineTo(bx+gw*0.46+22,ay+5); ctx.closePath(); ctx.fillStyle=GLD; ctx.fill();

      // 객체 상태 박스(실제 속성)
      var name='바둑이', age=3;
      objBox(ctx, bx+gw*0.46+40, by-6, gw*0.50, 'd : Dog 객체', [['name', '"'+name+'"'],['age', age]], GRN);

      // 실행 단계
      var oy=by+120;
      if(s.step===0){
        ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('탭 → __init__ 호출 → bark() 결과를 봅니다.', gx, oy);
      } else if(s.step===1){
        ctx.fillStyle=GLD; ctx.font='600 13.5px sans-serif'; ctx.textAlign='left'; ctx.fillText('d = Dog("바둑이", 3)  →  __init__이 self에 속성을 새김', gx, oy);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText('self = 그 객체 자신. self.name=name 으로 상태가 d 안에 저장됩니다.', gx, oy+22);
      } else {
        // 실제 계산: f"{name}: 멍멍!"
        var out=name+': 멍멍!';
        ctx.fillStyle=GLD; ctx.font='600 13.5px sans-serif'; ctx.textAlign='left'; ctx.fillText('d.bark()  →  self.name 을 읽어 문자열을 만듦', gx, oy);
        ctx.fillStyle='rgba(126,224,176,0.10)'; ctx.strokeStyle=GRN; ctx.lineWidth=1.6; roundRect(ctx,gx,oy+14,gw*0.9,34,7); ctx.fill(); ctx.stroke();
        ctx.fillStyle=GRN; ctx.font='600 16px ui-monospace,Menlo,monospace'; ctx.textAlign='left'; ctx.fillText('"'+out+'"', gx+14, oy+36);
      }
      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 (설계도 → 객체 생성 → bark() 호출)', true);
      E.big('클래스와 객체 — 데이터와 동작을 한 덩어리로', '클래스는 ‘붕어빵 틀’, 객체는 그 틀로 찍어낸 붕어빵입니다. __init__은 객체가 태어날 때 한 번 불려 self(자기 자신)에 속성을 새기고, 메서드는 그 속성을 읽어 행동합니다. d.bark()가 "바둑이: 멍멍!"을 돌려주는 건, d 안에 저장된 name을 실제로 꺼내 썼기 때문이죠.'); }
  },

  // ══════════ 2. 상속 — class Cat(Animal) · 오버라이드 · super() ══════════
  { id:'py4_02',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(340+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'class Animal:', hl:'Animal'},
        {t:'    def __init__(self, name):', hl:'__init__'},
        {t:'        self.name = name', hl:'self.name'},
        {t:'    def speak(self):', hl:'speak'},
        {t:'        return "..."', hl:'...'},
        {t:'', dim:true},
        {t:'class Cat(Animal):', hl:'Cat(Animal)'},
        {t:'    def speak(self):       # 오버라이드', hl:'speak'},
        {t:'        return f"{self.name}: 야옹"', hl:'야옹'}
      ];
      var act = s.step===1 ? 8 : null;   // 오버라이드한 speak의 return 실행
      codePanel(E, W*0.04, H*0.15, W*0.46, code, 'animals.py', act);

      var gx=W*0.55, gw=W*0.40, cx=gx+gw*0.5;
      ctx.fillStyle=PYL; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('상속 — 부모의 것을 물려받고, 일부만 새로 쓰기', gx-30, H*0.15);

      // 부모 박스
      var pw=gw*0.6, py=H*0.24, px=cx-pw/2;
      ctx.fillStyle='rgba(108,182,232,0.10)'; ctx.strokeStyle=PYB; ctx.lineWidth=2; roundRect(ctx,px,py,pw,58,9); ctx.fill(); ctx.stroke();
      ctx.fillStyle=PYB; ctx.font='600 14px ui-monospace,Menlo,monospace'; ctx.textAlign='center'; ctx.fillText('Animal (부모)', cx, py+22);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('name · speak()', cx, py+42);

      // 화살표(부모 → 자식, 상속)
      var ay0=py+58, ay1=py+96;
      ctx.strokeStyle=GRN; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(cx, ay0); ctx.lineTo(cx, ay1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx,ay1); ctx.lineTo(cx-5,ay1-8); ctx.lineTo(cx+5,ay1-8); ctx.closePath(); ctx.fillStyle=GRN; ctx.fill();
      ctx.fillStyle=GRN; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('extends', cx+8, (ay0+ay1)/2+4);

      // 자식 박스
      var cyb=ay1, ch2=66, cpx=cx-pw/2;
      ctx.fillStyle='rgba(255,211,67,0.08)'; ctx.strokeStyle=PYL; ctx.lineWidth=2; roundRect(ctx,cpx,cyb,pw,ch2,9); ctx.fill(); ctx.stroke();
      ctx.fillStyle=PYL; ctx.font='600 14px ui-monospace,Menlo,monospace'; ctx.textAlign='center'; ctx.fillText('Cat (자식)', cx, cyb+22);
      ctx.fillStyle=GRN; ctx.font='13.5px sans-serif'; ctx.fillText('name  ← 물려받음', cx, cyb+40);
      ctx.fillStyle=PYL; ctx.fillText('speak() ← 새로 정의(오버라이드)', cx, cyb+57);

      // 실행 단계: 실제 문자열 계산
      var oy=cyb+ch2+26;
      if(s.step===0){
        ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('Cat은 Animal의 name을 그대로 받고, speak만 자기 식으로 바꿉니다.', gx-30, oy);
      } else if(s.step===1){
        var nm='나비', out=nm+': 야옹';
        ctx.fillStyle=GLD; ctx.font='600 13.5px sans-serif'; ctx.textAlign='left'; ctx.fillText('c = Cat("나비"); c.speak()', gx-30, oy);
        ctx.fillStyle='rgba(126,224,176,0.10)'; ctx.strokeStyle=GRN; ctx.lineWidth=1.6; roundRect(ctx,gx-30,oy+12,gw*0.95,32,7); ctx.fill(); ctx.stroke();
        ctx.fillStyle=GRN; ctx.font='600 15px ui-monospace,Menlo,monospace'; ctx.fillText('"'+out+'"   (자식 speak가 부모 것을 덮음)', gx-18, oy+33);
      } else {
        ctx.fillStyle=GLD; ctx.font='600 13.5px sans-serif'; ctx.textAlign='left'; ctx.fillText('super() — 부모의 기능을 빌려 쓰기', gx-30, oy);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('※ 위 Cat은 __init__이 없어 부모 것을 그대로 씁니다(그래서 super 불필요).', gx-30, oy+20);
        ctx.fillText('   name 말고 색깔 같은 새 속성을 더하고 싶을 때만 이렇게 씁니다:', gx-30, oy+37);
        ctx.fillStyle=DIM; ctx.font='12.5px ui-monospace,Menlo,monospace';
        ctx.fillText('def __init__(self, name, color):', gx-30, oy+59);
        ctx.fillText('    super().__init__(name)  # 부모 init 재사용', gx-30, oy+77);
        ctx.fillText('    self.color = color      # 내 것만 추가', gx-30, oy+95);
      }
      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 (상속 관계 → 오버라이드 → super())', true);
      E.big('상속 — 코드를 물려받아 확장하기', '같은 코드를 두 번 쓰지 않으려면, 공통된 것(name·기본 동작)을 부모 Animal에 모으고 Cat·Dog가 물려받게 합니다. 자식이 같은 이름의 메서드를 다시 쓰면 ‘오버라이드’ — 부모 것을 덮어쓰죠. 부모의 기능이 여전히 필요하면 super()로 불러 재사용합니다. "is-a 관계"(고양이 is-a 동물)일 때 쓰는 도구입니다.'); }
  },

  // ══════════ 3. 매직메서드 — __str__ · __len__ · __add__ (연산자 오버로딩) ══════════
  { id:'py4_03',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(320+this.s.step*90,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'class Vector:', hl:'Vector'},
        {t:'    def __init__(self, x, y):', hl:'__init__'},
        {t:'        self.x, self.y = x, y', dim:false},
        {t:'    def __add__(self, o):', hl:'__add__'},
        {t:'        return Vector(self.x+o.x,', hl:'__add__'},
        {t:'                      self.y+o.y)', dim:false},
        {t:'    def __str__(self):', hl:'__str__'},
        {t:'        return f"Vector({self.x},{self.y})"', hl:'__str__'},
        {t:'    def __len__(self):  return 2', hl:'__len__'}
      ];
      var act = s.step===0 ? 4 : (s.step===1 ? 7 : 8);   // __add__ return / __str__ return / __len__
      codePanel(E, W*0.04, H*0.13, W*0.47, code, 'vector.py', act);

      var gx=W*0.56, gw=W*0.40;
      ctx.fillStyle=PYL; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('매직메서드 — 파이썬 문법을 내 객체에 연결', gx-20, H*0.14);

      // 실제 계산
      var a=[1,2], b=[3,4], sum=[a[0]+b[0], a[1]+b[1]];
      var oy=H*0.22;
      if(s.step===0){
        // __add__ : Vector(1,2) + Vector(3,4) = Vector(4,6)
        ctx.fillStyle=GLD; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('__add__  →  +  연산자', gx-20, oy);
        function vbox(x,y,vx,vy,col){ ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.strokeStyle=col; ctx.lineWidth=2; roundRect(ctx,x,y,108,44,8); ctx.fill(); ctx.stroke();
          ctx.fillStyle=col; ctx.font='600 15px ui-monospace,Menlo,monospace'; ctx.textAlign='center'; ctx.fillText('Vector('+vx+','+vy+')', x+54, y+27); }
        var ry=oy+24;
        vbox(gx-20, ry, a[0],a[1], PYB);
        ctx.fillStyle=PYL; ctx.font='600 22px sans-serif'; ctx.textAlign='center'; ctx.fillText('+', gx-20+108+18, ry+30);
        vbox(gx-20+108+38, ry, b[0],b[1], PYB);
        ctx.fillStyle=GLD; ctx.font='600 22px sans-serif'; ctx.fillText('=', gx-20+108+38+108+18, ry+30);
        vbox(gx-20+108+38+108+38, ry, sum[0],sum[1], GRN);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.textAlign='left';
        ctx.fillText('v1 + v2 → 파이썬이 v1.__add__(v2)를 대신 호출', gx-20, ry+74);
        ctx.fillStyle=GRN; ctx.font='600 13.5px ui-monospace,Menlo,monospace';
        ctx.fillText('(1+3, 2+4) = (4, 6)', gx-20, ry+98);
      } else if(s.step===1){
        // __str__ : print(v) → "Vector(1,2)"
        ctx.fillStyle=GLD; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('__str__  →  print() / str()', gx-20, oy);
        ctx.fillStyle='#cfe6e8'; ctx.font='13px ui-monospace,Menlo,monospace'; ctx.fillText('print(Vector(4, 6))', gx-20, oy+34);
        ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(gx-20, oy+48); ctx.lineTo(gx-20+gw*0.7, oy+48); ctx.stroke();
        ctx.fillStyle='rgba(126,224,176,0.10)'; ctx.strokeStyle=GRN; ctx.lineWidth=1.6; roundRect(ctx,gx-20,oy+58,gw*0.7,34,7); ctx.fill(); ctx.stroke();
        ctx.fillStyle=GRN; ctx.font='600 16px ui-monospace,Menlo,monospace'; ctx.fillText('Vector(4,6)', gx-6, oy+80);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText('__str__이 없으면 <__main__.Vector object at 0x...> 가 찍힙니다.', gx-20, oy+114);
      } else {
        // __len__ : len(v) → 2
        ctx.fillStyle=GLD; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('__len__  →  len()', gx-20, oy);
        ctx.fillStyle='#cfe6e8'; ctx.font='13px ui-monospace,Menlo,monospace'; ctx.fillText('len(Vector(4, 6))', gx-20, oy+34);
        ctx.fillStyle='rgba(126,224,176,0.10)'; ctx.strokeStyle=GRN; ctx.lineWidth=1.6; roundRect(ctx,gx-20,oy+48,90,34,7); ctx.fill(); ctx.stroke();
        ctx.fillStyle=GRN; ctx.font='600 18px ui-monospace,Menlo,monospace'; ctx.textAlign='center'; ctx.fillText('2', gx-20+45, oy+71);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.textAlign='left';
        ctx.fillText('len, +, ==, [], print … 파이썬의 모든 문법은 사실', gx-20, oy+108);
        ctx.fillText('숨은 매직메서드 호출입니다. 내 객체도 똑같이 행동하게 만들 수 있죠.', gx-20, oy+128);
      }
      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 (__add__ → __str__ → __len__)', true);
      E.big('매직메서드 — 객체에 파이썬 문법을 입히기', '__로 둘러싸인 ‘던더(dunder)’ 메서드는 파이썬이 몰래 부르는 약속입니다. __add__를 정의하면 + 가, __len__을 정의하면 len()이, __str__을 정의하면 print()가 내 객체에서도 동작하죠. 그래서 Vector(1,2)+Vector(3,4)가 진짜로 Vector(4,6)을 만들어 냅니다 — 내장 타입처럼 자연스럽게.'); }
  },

  // ══════════ 4. 모듈 · import — 표준 라이브러리 (math/random/datetime) ══════════
  { id:'py4_04',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(340+this.s.step*90,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'import math', hl:'math'},
        {t:'from random import randint', hl:'randint'},
        {t:'', dim:true},
        {t:'math.sqrt(2)      # 1.4142...', hl:'sqrt'},
        {t:'math.pi           # 3.14159...', hl:'pi'},
        {t:'math.factorial(5) # 120', hl:'factorial'},
        {t:'', dim:true},
        {t:'import datetime as dt', hl:'datetime'},
        {t:'dt.date(2026, 6, 30)', hl:'date'}
      ];
      var act = s.step===1 ? 3 : null;   // math 모듈 실제 결과값(math.sqrt 등)
      codePanel(E, W*0.04, H*0.14, W*0.46, code, 'using_modules.py', act);

      var gx=W*0.55, gw=W*0.40;
      ctx.fillStyle=PYL; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('모듈 = 이미 만들어진 도구상자, import로 꺼내 쓰기', gx-30, H*0.14);

      var oy=H*0.22;
      if(s.step===0){
        // import 형태 비교
        ctx.fillStyle=GLD; ctx.font='600 13.5px sans-serif'; ctx.textAlign='left'; ctx.fillText('두 가지 import 방식', gx-30, oy);
        var forms=[
          ['import math', 'math.sqrt(2)', '상자째 가져옴 — math. 붙여 호출', PYB],
          ['from math import sqrt', 'sqrt(2)', '필요한 함수만 꺼냄 — 바로 호출', GRN],
          ['import numpy as np', 'np.array(...)', 'as 로 별명 — 긴 이름 줄이기', PNK]
        ];
        for(var i=0;i<forms.length;i++){ var y=oy+18+i*52, f=forms[i];
          ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.strokeStyle=f[3]; ctx.lineWidth=1.4; roundRect(ctx,gx-30,y,gw*0.95,44,7); ctx.fill(); ctx.stroke();
          ctx.fillStyle=f[3]; ctx.font='600 12.5px ui-monospace,Menlo,monospace'; ctx.textAlign='left'; ctx.fillText(f[0], gx-18, y+18);
          ctx.fillStyle='#cfe6e8'; ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillText('→ '+f[1], gx-18, y+36);
          ctx.fillStyle=DIM; ctx.font='13.5px sans-serif'; ctx.textAlign='right'; ctx.fillText(f[2], gx-30+gw*0.95-12, y+27); }
      } else if(s.step===1){
        // 실제 계산값
        ctx.fillStyle=GLD; ctx.font='600 13.5px sans-serif'; ctx.textAlign='left'; ctx.fillText('math 모듈 — 실제 결과값', gx-30, oy);
        var rows=[
          ['math.sqrt(2)', Math.sqrt(2).toFixed(6)],
          ['math.pi', Math.PI.toFixed(6)],
          ['math.e', Math.E.toFixed(6)],
          ['math.factorial(5)', (function(){var p=1;for(var k=2;k<=5;k++)p*=k;return p;})()],
          ['math.gcd(48, 36)', (function(){var a=48,b=36;while(b){var t=b;b=a%b;a=t;}return a;})()],
          ['math.log(math.e)', Math.log(Math.E).toFixed(4)]
        ];
        for(var i=0;i<rows.length;i++){ var y=oy+14+i*30;
          ctx.fillStyle='#cfe6e8'; ctx.font='13px ui-monospace,Menlo,monospace'; ctx.textAlign='left'; ctx.fillText(rows[i][0], gx-30, y+16);
          ctx.fillStyle=GLD; ctx.font='600 22px sans-serif'; ctx.textAlign='center'; ctx.fillText('→', gx-30+gw*0.52, y+18);
          ctx.fillStyle=GRN; ctx.font='600 14px ui-monospace,Menlo,monospace'; ctx.textAlign='left'; ctx.fillText(''+rows[i][1], gx-30+gw*0.60, y+16); }
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('√2 = 1.414213… 무리수도 정확히. 전부 C로 짜여 빠릅니다.', gx-30, oy+14+rows.length*30+14);
      } else {
        // 표준 라이브러리 지도
        ctx.fillStyle=GLD; ctx.font='600 13.5px sans-serif'; ctx.textAlign='left'; ctx.fillText('“배터리 포함” — 파이썬 표준 라이브러리', gx-30, oy);
        var libs=[
          ['math', '수학 함수·상수', PYB],
          ['random', '난수·표본추출', GRN],
          ['datetime', '날짜·시간', PNK],
          ['os / sys', '파일·시스템', GLD],
          ['json', 'JSON 읽기·쓰기', PYB],
          ['collections', '특수 자료구조', GRN]
        ];
        for(var i=0;i<libs.length;i++){ var col=i%2, rrow=Math.floor(i/2), x=gx-30+col*(gw*0.49), y=oy+16+rrow*46;
          ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.strokeStyle=libs[i][2]; ctx.lineWidth=1.4; roundRect(ctx,x,y,gw*0.45,38,7); ctx.fill(); ctx.stroke();
          ctx.fillStyle=libs[i][2]; ctx.font='600 13px ui-monospace,Menlo,monospace'; ctx.textAlign='left'; ctx.fillText(libs[i][0], x+10, y+17);
          ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.fillText(libs[i][1], x+10, y+31); }
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('설치 없이 import만 하면 바로 쓰는 수백 개의 모듈이 기본 내장.', gx-30, oy+16+3*46+12);
      }
      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 (import 방식 → math 실제값 → 표준 라이브러리)', true);
      E.big('모듈과 import — 남이 만든 도구 빌려 쓰기', '모듈은 함수·클래스를 모아 둔 .py 파일입니다. import 한 줄이면 수학(math)·난수(random)·날짜(datetime) 같은 도구상자가 통째로 열리죠. math.sqrt(2)가 1.414213…을 정확히 내는 건, 잘 검증된 코드를 그대로 쓰기 때문입니다 — 바퀴를 다시 발명하지 마세요. 파이썬은 “배터리 포함”, 수백 개 모듈이 기본 내장입니다.'); }
  },

  // ══════════ 5. 패키지 · 가상환경 — pip install · import 경로 · AI 라이브러리로의 다리 ══════════
  { id:'py4_05',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*80,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'$ python -m venv .venv', hl:'venv'},
        {t:'$ source .venv/bin/activate', hl:'activate'},
        {t:'$ pip install numpy pandas', hl:'pip install'},
        {t:'', dim:true},
        {t:'# mypkg/__init__.py 가 패키지 표시', hl:'__init__.py'},
        {t:'from mypkg.utils import clean', hl:'mypkg.utils'},
        {t:'', dim:true},
        {t:'import torch        # 설치된 AI 라이브러리', hl:'torch'}
      ];
      var act = s.step===0 ? 5 : (s.step===1 ? 2 : 7);   // 패키지 import / pip install / AI 라이브러리 import
      codePanel(E, W*0.04, H*0.14, W*0.46, code, 'setup.sh', act);

      var gx=W*0.55, gw=W*0.40;
      var oy=H*0.16;
      if(s.step===0){
        // 패키지 구조 트리
        ctx.fillStyle=PYL; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('패키지 = 모듈을 담은 폴더(__init__.py 포함)', gx-30, oy);
        var tree=[
          ['📦 mypkg/', 0, PYL],
          ['__init__.py   # 폴더를 패키지로', 1, DIM],
          ['utils.py      # clean(), load()', 1, PYB],
          ['models.py     # 클래스들', 1, PYB],
          ['📁 data/', 1, GRN],
          ['__init__.py', 2, DIM],
          ['loader.py', 2, PYB]
        ];
        for(var i=0;i<tree.length;i++){ var y=oy+30+i*26;
          ctx.fillStyle=tree[i][2]; ctx.font='13px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
          ctx.fillText(tree[i][0], gx-30+tree[i][1]*22, y); }
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('점(.)으로 폴더를 타고 들어갑니다: mypkg.data.loader', gx-30, oy+30+tree.length*26+6);
      } else if(s.step===1){
        // pip / venv 개념도
        ctx.fillStyle=PYL; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('가상환경 — 프로젝트마다 격리된 도구상자', gx-30, oy);
        // PyPI → pip → venv
        function pillBox(x,y,w,t,d,col){ ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.strokeStyle=col; ctx.lineWidth=1.8; roundRect(ctx,x,y,w,46,8); ctx.fill(); ctx.stroke();
          ctx.fillStyle=col; ctx.font='600 13.5px sans-serif'; ctx.textAlign='left'; ctx.fillText(t, x+12, y+20);
          ctx.fillStyle=DIM; ctx.font='13.5px sans-serif'; ctx.fillText(d, x+12, y+37); }
        pillBox(gx-30, oy+22, gw*0.95, 'PyPI (전 세계 패키지 저장소)', '50만+ 패키지 — numpy, pandas, torch …', PNK);
        ctx.fillStyle=GLD; ctx.font='600 16px sans-serif'; ctx.textAlign='center'; ctx.fillText('↓  pip install', gx-30+gw*0.475, oy+86);
        pillBox(gx-30, oy+96, gw*0.95, '.venv (이 프로젝트 전용 환경)', 'numpy 2.0 · pandas 2.2 — 버전 충돌 없음', GRN);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('프로젝트 A는 torch 1.x, B는 2.x — venv로 서로 안 섞이게.', gx-30, oy+96+62);
      } else {
        // AI 라이브러리로의 다리
        ctx.fillStyle=PYL; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('여기서 AI 라이브러리로 가는 다리', gx-30, oy);
        var libs=[
          ['numpy', '수치계산의 토대', PYB],
          ['pandas', '표 데이터 분석', GRN],
          ['scikit-learn', '전통 머신러닝', GLD],
          ['pytorch', '딥러닝·신경망', PNK]
        ];
        for(var i=0;i<libs.length;i++){ var y=oy+24+i*44;
          ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.strokeStyle=libs[i][2]; ctx.lineWidth=1.6; roundRect(ctx,gx-30,y,gw*0.95,36,7); ctx.fill(); ctx.stroke();
          ctx.fillStyle=libs[i][2]; ctx.font='600 13.5px ui-monospace,Menlo,monospace'; ctx.textAlign='left'; ctx.fillText('pip install '+libs[i][0], gx-18, y+22);
          ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='right'; ctx.fillText(libs[i][1], gx-30+gw*0.95-12, y+22); }
        ctx.fillStyle=GRN; ctx.font='600 12.5px sans-serif'; ctx.textAlign='left'; ctx.fillText('파이썬 기초는 여기까지 — 이제 AI 트랙으로 이어집니다.', gx-30, oy+24+libs.length*44+10);
      }
      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 (패키지 구조 → pip·가상환경 → AI 라이브러리)', true);
      E.big('패키지·가상환경 — 큰 프로젝트와 AI로 가는 길', '여러 모듈을 폴더로 묶으면 ‘패키지’(폴더에 __init__.py). 점(.)으로 경로를 타고 import하죠. 남의 패키지는 PyPI에서 pip install로 내려받는데, 프로젝트마다 venv(가상환경)로 격리해 버전 충돌을 막습니다. pip install numpy pandas torch — 이 한 줄이 바로 AI 세계로 들어가는 문입니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
