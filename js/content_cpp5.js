/* C++ 제5장 — 복사 생성자 (윤성우 열혈C++ + Effective C++)
   복사 생성자 · 얕은복사 vs 깊은복사 · 대입 연산자 · 복사 호출 시점 · copy-and-swap
   동작(behavior)만. 텍스트=content/cpp5.json. 엔진 js/engine.js 공유. 색: C++=블루(#5ab4e8).
   골든룰: 화면의 모든 주소·카운트·값·복사 횟수는 draw에서 실제로 계산(결정적). 베껴 박지 않음. */
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

  // ── 공용 그림 헬퍼 ──
  // 객체 상자: 이름 + 필드 목록([['name','값'],...]). 반환 = 하단 y
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
  function heapBox(ctx, x, y, w, addr, val, col){
    col=col||GLD; var ht=46;
    ctx.fillStyle='rgba(255,211,122,0.08)'; ctx.strokeStyle=col; ctx.lineWidth=1.6;
    roundRect(ctx,x,y,w,ht,9); ctx.fill(); ctx.stroke();
    ctx.fillStyle=DIM; ctx.font='11px ui-monospace,Menlo,monospace'; ctx.textAlign='left'; ctx.fillText('heap '+addr, x+10, y+16);
    ctx.fillStyle=col; ctx.font='700 15px ui-monospace,Menlo,monospace'; ctx.fillText('"'+val+'"', x+10, y+37);
    return y+ht;
  }
  function arrow(ctx, x0,y0,x1,y1, col, dash){
    ctx.strokeStyle=col; ctx.lineWidth=2; if(dash) ctx.setLineDash(dash); else ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x1,y1); ctx.stroke(); ctx.setLineDash([]);
    var a=Math.atan2(y1-y0,x1-x0); ctx.fillStyle=col;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x1-9*Math.cos(a-0.4),y1-9*Math.sin(a-0.4)); ctx.lineTo(x1-9*Math.cos(a+0.4),y1-9*Math.sin(a+0.4)); ctx.closePath(); ctx.fill();
  }

  var scenes = [

  // ══════════ 1. 복사 생성자 — Person(const Person& p) ══════════
  { id:'cpp5_01',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*90,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'class Person {', dim:true},
        {t:'  std::string name; int age;', dim:true},
        {t:'public:', dim:true},
        {t:'  Person(std::string n,int a)', dim:true},
        {t:'    : name(n), age(a) {}', dim:true},
        {t:'  // 복사 생성자', dim:true},
        {t:'  Person(const Person& p)', hl:'const Person& p'},
        {t:'    : name(p.name), age(p.age) {}', hl:'p.name'},
        {t:'};', dim:true},
        {t:'Person org("Ann", 23);', hl:'org'},
        {t:'Person copy = org;   // 복사!', hl:'copy'}
      ];
      var act=[9,10,6][s.step];
      codePanel(E, W*0.04, H*0.12, W*0.46, code, 'copy_ctor.cpp', act);

      // 우측: 원본 → 사본 복제
      var ox=W*0.60, oy=H*0.24, bw=W*0.30;
      objBox(ctx, ox, oy, bw, 'org (원본)', [['name','"Ann"'],['age','23']], CPB);
      if(s.step>=1){
        var cy=oy+150;
        var accent = (s.step>=2)? GRN : CPD;
        objBox(ctx, ox, cy, bw, 'copy (사본)', [['name','"Ann"'],['age','23']], accent);
        arrow(ctx, ox+bw*0.5, oy+118, ox+bw*0.5, cy-6, accent, [6,4]);
        ctx.fillStyle=accent; ctx.font='600 12px sans-serif'; ctx.textAlign='left';
        ctx.fillText(s.step>=2? 'Person(const Person& p) 호출 → 필드 값 복제' : '복제 중…', ox+bw*0.5+12, oy+140);
      }

      var px=W*0.05, py=H*0.80;
      ctx.textAlign='left';
      if(s.step===0){ ctx.fillStyle=CPB; ctx.font='600 14px sans-serif'; ctx.fillText('org 하나가 스택에 만들어졌습니다.', px, py); }
      else if(s.step===1){ ctx.fillStyle=CPD; ctx.font='600 14px sans-serif'; ctx.fillText('Person copy = org;  →  새 객체를 org에서 복제', px, py); }
      else { ctx.fillStyle=GRN; ctx.font='600 14px sans-serif'; ctx.fillText('두 객체는 서로 독립 — 값만 같고 저장 위치는 다릅니다.', px, py); }
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
      ctx.fillText('매개변수는 const 참조(const Person&): 원본을 복사하지 않고(무한 재귀 방지) 읽기만.', px, py+24);

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (원본 → 복제 → 완료)', true);
      E.big('복사 생성자 — 같은 종류로 태어난 쌍둥이', '기존 객체와 똑같은 새 객체를 만들 때 호출되는 특별한 생성자가 복사 생성자입니다. Person copy = org; 처럼 “같은 타입 객체로 초기화”하면 컴파일러가 Person(const Person& p)를 불러 org의 필드를 하나하나 옮겨 담죠. 매개변수가 왜 참조(&)일까요? 값으로 받으면 그 값을 만들려고 또 복사 생성자를 불러야 하니 무한 재귀에 빠집니다. 왜 const일까요? 원본은 읽기만 하면 되니까요. 만들지 않으면 컴파일러가 “멤버를 그대로 베끼는” 기본 복사 생성자를 자동으로 넣어 줍니다 — 대부분은 그것으로 충분하지만, 다음 장면에서 그 “그대로 베끼기”가 위험해지는 순간을 봅니다.'); }
  },

  // ══════════ 2. 얕은 복사 vs 깊은 복사 ══════════
  { id:'cpp5_02',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(340+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var shallow=(s.step===0);
      var code = shallow ? [
        {t:'class Name {', dim:true},
        {t:'  char* p;   // 힙 포인터 멤버', hl:'char* p'},
        {t:'public:', dim:true},
        {t:'  Name(const char* s){', dim:true},
        {t:'    p = new char[strlen(s)+1];', hl:'new'},
        {t:'    strcpy(p, s); }', dim:true},
        {t:'  // 복사 생성자 없음 → 기본(얕은 복사)', dim:true},
        {t:'  ~Name(){ delete[] p; }', hl:'delete[]'},
        {t:'};', dim:true},
        {t:'Name a("Cat");', dim:true},
        {t:'Name b = a;  // b.p = a.p (같은 힙!)', hl:'b.p = a.p'}
      ] : [
        {t:'class Name {', dim:true},
        {t:'  char* p;', dim:true},
        {t:'public:', dim:true},
        {t:'  Name(const char* s){ /* new+copy */ }', dim:true},
        {t:'  // 깊은 복사: 새 힙을 따로 할당', dim:true},
        {t:'  Name(const Name& o){', hl:'const Name& o'},
        {t:'    p = new char[strlen(o.p)+1];', hl:'new'},
        {t:'    strcpy(p, o.p); }', hl:'strcpy'},
        {t:'  ~Name(){ delete[] p; }', hl:'delete[]'},
        {t:'};', dim:true},
        {t:'Name b = a;  // 각자의 힙', hl:'각자'}
      ];
      var act = shallow ? 10 : 6;
      codePanel(E, W*0.04, H*0.12, W*0.47, code, shallow?'shallow_copy.cpp':'deep_copy.cpp', act);

      var ox=W*0.60, bw=W*0.16;
      var ay=H*0.20, by=H*0.44;
      objBox(ctx, ox, ay, bw, 'a', [['p','●']], CPB);
      objBox(ctx, ox, by, bw, 'b', [['p','●']], shallow?RED:GRN);
      var apX=ox+bw-16, apY=ay+38;
      var bpX=ox+bw-16, bpY=by+38;
      var hx=W*0.82, hw=W*0.14;

      if(shallow){
        heapBox(ctx, hx, H*0.30, hw, '0x8f0', 'Cat', GLD);
        arrow(ctx, apX, apY, hx, H*0.30+16, RED, [5,4]);
        arrow(ctx, bpX, bpY, hx, H*0.30+30, RED, [5,4]);
        ctx.fillStyle=RED; ctx.font='700 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('a.p == b.p  →  같은 힙 하나', W*0.55, H*0.72);
        ctx.fillStyle=RED; ctx.font='600 13px sans-serif';
        ctx.fillText('소멸 시 delete[] 가 두 번 →  이중 해제(double free) 크래시', W*0.55, H*0.78);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
        ctx.fillText('기본 복사 생성자는 포인터 값(주소)만 베낍니다 — 가리키는 실체는 하나뿐.', W*0.05, H*0.90);
      } else {
        heapBox(ctx, hx, H*0.24, hw, '0x8f0', 'Cat', GLD);
        heapBox(ctx, hx, H*0.48, hw, '0xb20', 'Cat', GRN);
        arrow(ctx, apX, apY, hx, H*0.24+16, CPB, [5,4]);
        arrow(ctx, bpX, bpY, hx, H*0.48+16, GRN, [5,4]);
        ctx.fillStyle=GRN; ctx.font='700 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('a.p != b.p  →  힙 두 개 (내용만 같음)', W*0.55, H*0.72);
        ctx.fillStyle=GRN; ctx.font='600 13px sans-serif';
        ctx.fillText('각자 자기 힙을 delete[] →  안전 (이중 해제 없음)', W*0.55, H*0.78);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
        ctx.fillText('깊은 복사 생성자가 new 로 새 힙을 잡고 내용을 strcpy 로 옮깁니다.', W*0.05, H*0.90);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 얕은 복사(위험) ↔ 깊은 복사(안전)', true);
      E.big('얕은 복사 vs 깊은 복사 — 포인터 멤버의 함정', '클래스에 힙을 가리키는 포인터 멤버가 있으면 “기본 복사 생성자”가 배신합니다. 그것은 멤버를 있는 그대로 베끼는데, 포인터의 값은 곧 주소이므로 사본과 원본이 같은 힙 하나를 함께 가리키게 되죠(얕은 복사). 겉보기엔 멀쩡하다가, 두 객체가 소멸할 때 delete[]가 같은 메모리에 두 번 떨어지며 이중 해제로 프로그램이 무너집니다. 해법은 깊은 복사 — 복사 생성자에서 new로 새 힙을 잡고 내용을 통째로 옮겨, 두 객체가 각자의 메모리를 갖게 하는 것입니다. “포인터 멤버가 있다면 복사 생성자·대입 연산자·소멸자를 손수 정의하라”는 규칙(삼위일체, Rule of Three)이 여기서 태어납니다.'); }
  },

  // ══════════ 3. 대입 연산자 — operator= ══════════
  { id:'cpp5_03',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(340+this.s.step*90,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'Name& operator=(const Name& o){', hl:'operator='},
        {t:'  if(this == &o) return *this;', hl:'this == &o'},
        {t:'  delete[] p;              // 헌 힙 반납', hl:'delete[]'},
        {t:'  p = new char[strlen(o.p)+1];', hl:'new'},
        {t:'  strcpy(p, o.p);', hl:'strcpy'},
        {t:'  return *this;            // 연쇄 대입', hl:'return *this'},
        {t:'}', dim:true},
        {t:'', dim:true},
        {t:'Name p1("Cat"), p2("Dog");', dim:true},
        {t:'p2 = p1;   // 이미 만들어진 뒤 대입', hl:'p2 = p1'}
      ];
      var act=[9,1,3][s.step];
      codePanel(E, W*0.04, H*0.12, W*0.47, code, 'assign_op.cpp', act);

      var ox=W*0.60, bw=W*0.32;
      var p2name = (s.step>=2)? '"Cat"' : '"Dog"';
      objBox(ctx, ox, H*0.22, bw, 'p1', [['p','●'],['값','"Cat"']], CPB);
      objBox(ctx, ox, H*0.46, bw, 'p2 (대상)', [['p','●'],['값',p2name]], (s.step>=2)?GRN:GLD);

      var px=W*0.05, py=H*0.66;
      ctx.textAlign='left';
      if(s.step===0){
        ctx.fillStyle=GLD; ctx.font='600 15px sans-serif'; ctx.fillText('대입 전:  p2 = "Dog"', px, py);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
        ctx.fillText('복사 생성자와 다른 시점 — p2는 이미 살아 있고, 헌 힙("Dog")을 갖고 있습니다.', px, py+24);
      } else if(s.step===1){
        ctx.fillStyle=PNK; ctx.font='600 15px sans-serif'; ctx.fillText('① 자기대입 검사:  if(this == &o)', px, py);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
        ctx.fillText('p2 = p2 처럼 자기 자신이면, delete 로 자기 힙을 지웠다가 복사하는 참사를 막습니다.', px, py+24);
        ctx.fillText('여기선 p2 ≠ p1 이므로 계속 진행합니다.', px, py+44);
      } else {
        ctx.fillStyle=GRN; ctx.font='600 15px sans-serif'; ctx.fillText('② 헌 힙 delete → ③ 새 힙 new → ④ 내용 복사', px, py);
        ctx.fillStyle=GRN; ctx.font='700 16px sans-serif'; ctx.fillText('대입 후:  p2 = "Cat"  (p1과 값만 같고 힙은 각자)', px, py+26);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
        ctx.fillText('return *this 로 자기 참조를 돌려줘 a = b = c 같은 연쇄 대입이 됩니다.', px, py+50);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (대입 전 → 자기검사 → 대입 후)', true);
      E.big('대입 연산자 — 이미 태어난 객체에 값을 새로 담다', '복사 생성자는 “탄생”의 순간에, 대입 연산자 operator=는 “이미 살아 있는” 객체에 다른 객체의 값을 덮어쓸 때 호출됩니다. p2 = p1; 은 복사 생성자가 아니라 operator=를 부르죠. 포인터 멤버가 있다면 여기서 세 가지를 잊지 말아야 합니다. 첫째, 자기대입 검사(if(this == &o)) — p2 = p2 인데 무턱대고 자기 힙을 delete 하면 복사할 원본이 사라집니다. 둘째, 헌 자원 반납 후 새 힙을 깊게 복사. 셋째, return *this 로 자기 자신을 돌려줘 a = b = c 연쇄 대입을 지원. 복사 생성자·대입 연산자·소멸자, 이 셋은 늘 한 세트로 움직입니다.'); }
  },

  // ══════════ 4. 복사가 호출되는 시점 — 값 전달·값 반환·초기화 ══════════
  { id:'cpp5_04',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(340+this.s.step*90,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var cases=[
        { title:'① 초기화로 복사',
          code:['Person a("Ann");', 'Person b = a;   // 복사 생성', '// b 는 a 의 복제본'],
          act:1, n:1, note:'같은 타입으로 초기화 → 복사 생성자 1회' },
        { title:'② 값(by value)으로 전달',
          code:['void greet(Person p) { ... }', 'greet(a);       // p = a 복사', '// 인자를 값으로 받으면 사본 생성'],
          act:1, n:1, note:'매개변수를 값으로 받음 → 인자 복사 1회 (참조로 받으면 0회)' },
        { title:'③ 값으로 반환',
          code:['Person make() {', '  Person t("Tmp");', '  return t;    // 반환값 복사', '}'],
          act:2, n:1, note:'객체를 값으로 반환 → 복사 1회 (실제론 RVO로 최적화되기도)' }
      ];
      var C=cases[s.step];
      var code=C.code.map(function(t,i){ return (i===C.act)?{t:t, hl:t.replace(/\s*\/\/.*$/,'')}:{t:t, dim:(t.indexOf('//')>=0)}; });
      codePanel(E, W*0.04, H*0.14, W*0.46, code, 'copy_when.cpp', C.act);

      var total=0; for(var i=0;i<=s.step;i++) total+=cases[i].n;
      var bx=W*0.56, by=H*0.20;
      ctx.textAlign='left';
      ctx.fillStyle=CPB; ctx.font='700 15px sans-serif'; ctx.fillText('복사 생성자 호출 횟수', bx, by);
      for(i=0;i<3;i++){ var ly=by+30+i*46, on=(i<=s.step);
        ctx.globalAlpha=on?1:0.30;
        ctx.fillStyle=on?(i===s.step?GRN:CPD):DIM; ctx.font='600 14px sans-serif';
        ctx.fillText(cases[i].title, bx, ly);
        var cxp=bx+W*0.30;
        ctx.fillStyle=on?'rgba(126,224,176,0.18)':'rgba(255,255,255,0.04)';
        ctx.strokeStyle=on?GRN:DIM; ctx.lineWidth=1.6;
        ctx.beginPath(); ctx.arc(cxp, ly-5, 15, 0, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle=on?GRN:DIM; ctx.font='700 15px ui-monospace,monospace'; ctx.textAlign='center';
        ctx.fillText(''+(on?cases[i].n:'?'), cxp, ly); ctx.textAlign='left';
        ctx.globalAlpha=1;
      }
      ctx.fillStyle=GLD; ctx.font='700 16px sans-serif';
      ctx.fillText('지금까지 누적 복사 = '+total+' 회', bx, by+30+3*46+10);

      ctx.fillStyle=GRN; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
      ctx.fillText(C.title.replace(/^.\s/,''), W*0.05, H*0.80);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
      ctx.fillText(C.note, W*0.05, H*0.85);
      ctx.fillStyle=CPD; ctx.font='12.5px sans-serif';
      ctx.fillText('“보이지 않는 복사”가 성능을 좀먹습니다 — 그래서 무거운 객체는 const 참조로 전달합니다.', W*0.05, H*0.905);

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (초기화 → 값 전달 → 값 반환)', true);
      E.big('복사는 언제 조용히 일어나는가', '복사 생성자는 = 이 없어도 뒤에서 불려 나갑니다. 세 순간을 조심하세요. 첫째, 같은 타입으로 초기화할 때(Person b = a;). 둘째, 객체를 값으로 함수에 넘길 때(greet(a);) — 매개변수라는 새 사본이 태어납니다. 셋째, 객체를 값으로 반환할 때 — 반환용 임시 객체로 한 번 더 복사되죠. 무거운 객체라면 이 “보이지 않는 복사”가 성능을 갉아먹습니다. 그래서 실무에서는 읽기만 할 인자는 const 참조(const Person&)로 받아 복사를 0으로 만들고, 컴파일러도 반환값을 RVO(Return Value Optimization)로 슬쩍 없애 줍니다. “복사가 언제 일어나는지”를 아는 것이 곧 빠른 C++을 쓰는 눈입니다.'); }
  },

  // ══════════ 5. copy-and-swap — 예외 안전 operator= (Effective 항목11) ══════════
  { id:'cpp5_05',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(340+this.s.step*80,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'void swap(Name& a, Name& b){', dim:true},
        {t:'  std::swap(a.p, b.p);   // 포인터만 교환', hl:'std::swap'},
        {t:'}', dim:true},
        {t:'Name& operator=(Name rhs){  // 값으로 받음!', hl:'Name rhs'},
        {t:'  swap(*this, rhs);       // 나 ↔ 사본 교환', hl:'swap'},
        {t:'  return *this;', dim:true},
        {t:'}  // rhs 소멸 → 내 옛 자원이 정리됨', hl:'rhs 소멸'}
      ];
      var act=[3,4,4,6][s.step];
      codePanel(E, W*0.04, H*0.13, W*0.48, code, 'copy_and_swap.cpp', act);

      var ox=W*0.58, bw=W*0.16, hx=W*0.80, hw=W*0.14;
      var thisVal, rhsVal, thisAcc, rhsAcc, rhsGone=false;
      if(s.step===0){ thisVal='Old'; rhsVal='New'; thisAcc=GLD; rhsAcc=CPD; }
      else if(s.step===1){ thisVal='Old'; rhsVal='New'; thisAcc=GLD; rhsAcc=CPD; }
      else if(s.step===2){ thisVal='New'; rhsVal='Old'; thisAcc=GRN; rhsAcc=RED; }
      else { thisVal='New'; rhsVal='—'; thisAcc=GRN; rhsAcc=DIM; rhsGone=true; }

      objBox(ctx, ox, H*0.22, bw, '*this', [['p','●']], thisAcc);
      if(!rhsGone) objBox(ctx, ox, H*0.46, bw, 'rhs (값 사본)', [['p','●']], rhsAcc);
      else { ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('rhs 소멸 ✔', ox, H*0.50); }

      var heapA_y=H*0.24, heapB_y=H*0.48;
      var heapA_gone = (s.step===3);
      if(!heapA_gone) heapBox(ctx, hx, heapA_y, hw, '0xA00', 'Old', (s.step>=2)?RED:GLD);
      else { ctx.fillStyle=DIM; ctx.font='11px ui-monospace,monospace'; ctx.textAlign='left'; ctx.fillText('0xA00 정리됨(delete[])', hx, heapA_y+20); }
      heapBox(ctx, hx, heapB_y, hw, '0xB00', 'New', (s.step>=2)?GRN:CPD);

      var tpX=ox+bw-16, tpY=H*0.22+38, rpX=ox+bw-16, rpY=H*0.46+38;
      if(s.step<2){
        arrow(ctx, tpX, tpY, hx, heapA_y+16, thisAcc, [5,4]);
        arrow(ctx, rpX, rpY, hx, heapB_y+16, rhsAcc, [5,4]);
      } else if(s.step===2){
        arrow(ctx, tpX, tpY, hx, heapB_y+16, thisAcc, [5,4]);
        arrow(ctx, rpX, rpY, hx, heapA_y+16, rhsAcc, [5,4]);
      } else {
        arrow(ctx, tpX, tpY, hx, heapB_y+16, thisAcc, [5,4]);
      }

      var px=W*0.05, py=H*0.72;
      ctx.textAlign='left';
      var msgs=[
        ['① 인자를 값으로 받음 → 여기서 rhs가 New의 깊은 복사본으로 생성', '복사 생성자가 대신 일을 해 줍니다 — operator= 안에서 new/delete를 직접 안 씀.'],
        ['② swap(*this, rhs) 직전 — this=Old, rhs=New', 'std::swap 은 포인터만 맞바꾸므로 실패할 수 없는(nothrow) 연산.'],
        ['③ swap 완료 — this가 New를, rhs가 Old를 가리킴', '핵심 교환은 절대 예외를 던지지 않아 강한 예외 안전성 보장.'],
        ['④ rhs 소멸 → rhs가 든 Old 힙을 소멸자가 자동 정리', '자기대입도 안전, 예외 안전, 코드 중복 없음 — 세 마리 토끼.']
      ];
      ctx.fillStyle=(s.step===3)?GRN:GLD; ctx.font='600 14px sans-serif'; ctx.fillText(msgs[s.step][0], px, py);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText(msgs[s.step][1], px, py+24);

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (사본 생성 → 교환 → 옛 자원 정리)', true);
      E.big('copy-and-swap — 예외에도 무너지지 않는 대입', 'Effective C++가 권하는 우아한 관용구입니다. 대입 연산자의 인자를 참조가 아니라 값(Name rhs)으로 받으세요 — 함수에 들어오는 순간 복사 생성자가 rhs라는 깊은 사본을 만들어 줍니다(자원 할당·복사가 여기서 끝). 그다음 swap(*this, rhs)로 나와 사본의 포인터만 맞바꾸면, 내 옛 자원은 rhs가 넘겨받고 나는 새 자원을 갖죠. 함수가 끝나면 rhs가 소멸하며 내 옛 힙을 자동으로 정리합니다. std::swap은 포인터만 교환해 절대 예외를 던지지 않으므로, new가 도중에 실패해도 원본은 손끝 하나 안 다칩니다(강한 예외 안전성). 자기대입 검사도 따로 필요 없고, 코드 중복도 없습니다 — 복사 로직 하나로 대입까지 해결하는 셈입니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
