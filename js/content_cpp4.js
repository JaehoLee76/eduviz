/* C++ 제4장 — 생성자·소멸자 (생성자 · 소멸자 · 멤버 이니셜라이저 리스트 · this 포인터 · 객체 배열 생성/소멸 순서)
   동작(behavior)만. 텍스트=content/cpp4.json. 엔진 js/engine.js 공유. 색: C++=파랑(#5ab4e8).
   골든룰: 화면의 모든 좌표·생성/소멸 순서·this 구분은 draw에서 실제로 계산(가짜·Math.random·Date.now 금지). 진짜 표준 C++. */
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
  function cell(ctx,x,y,w,h,txt,fill,stroke,tcol,fs){
    ctx.fillStyle=fill||'rgba(255,255,255,0.04)'; ctx.fillRect(x,y,w,h);
    ctx.strokeStyle=stroke||'rgba(255,255,255,0.12)'; ctx.lineWidth=1; ctx.strokeRect(x,y,w,h);
    if(txt!=null){ ctx.fillStyle=tcol||'#dfeaf2'; ctx.font=(fs||13)+'px ui-monospace,Menlo,Consolas,monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(''+txt, x+w/2, y+h/2+1); ctx.textBaseline='alphabetic'; }
  }

  var scenes = [

  // ══════════ 1. 생성자 ══════════
  { id:'cpp4_01',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 실행: Point p(3,4); → 생성자가 x=3,y=4 로 초기화
      var made=(s.step>=2), midConstruct=(s.step===1);
      var code=[
        {t:'class Point {', hl:'class'},
        {t:'  int x, y;', dim:true},
        {t:'public:', hl:'public'},
        {t:'  Point(int a, int b){  // 생성자', hl:'Point(int a, int b)'},
        {t:'    x = a;  y = b;', hl:'x = a'},
        {t:'  }', dim:true},
        {t:'};', dim:true},
        {t:'Point p(3, 4);   // 생성 → 자동 호출', hl:'Point p(3, 4)'}
      ];
      var act=[7,3,4][s.step];
      codePanel(E, W*0.04, H*0.14, W*0.46, code, 'constructor.cpp', act);

      // 우측: 생성 순간 x,y가 인자로 채워지는 그림
      var bx=W*0.58, by=H*0.17, bw=W*0.34;
      ctx.textAlign='left'; ctx.fillStyle=CPB; ctx.font='600 14px sans-serif';
      ctx.fillText('Point p(3, 4)  —  태어나는 순간', bx, by);

      // 인자 알약
      ctx.fillStyle='rgba(122,184,255,0.14)'; ctx.strokeStyle=BLU; ctx.lineWidth=1.4;
      roundRect(ctx,bx,by+16,60,28,7); ctx.fill(); ctx.stroke();
      roundRect(ctx,bx+72,by+16,60,28,7); ctx.fill(); ctx.stroke();
      ctx.fillStyle=BLU; ctx.font='600 13px ui-monospace,monospace'; ctx.textAlign='center';
      ctx.fillText('a = 3', bx+30, by+34); ctx.fillText('b = 4', bx+102, by+34);

      // 객체 상자 (멤버 x,y)
      var oX=bx, oY=by+70, oW=bw*0.7;
      ctx.fillStyle='rgba(90,180,232,0.08)'; ctx.strokeStyle=CPB; ctx.lineWidth=1.8;
      roundRect(ctx,oX,oY,oW,84,9); ctx.fill(); ctx.stroke();
      ctx.fillStyle=CPD; ctx.font='600 12px sans-serif'; ctx.textAlign='left'; ctx.fillText('객체 p', oX+12, oY+20);
      var vx=made||midConstruct? (midConstruct?['3','?']:['3','4']) : ['?','?'];
      cell(ctx,oX+14,oY+30,oW-28,24,'x = '+vx[0], (made||midConstruct)?'rgba(126,224,176,0.12)':'rgba(255,255,255,0.04)', (made||midConstruct)?GRN:'rgba(255,255,255,0.14)', (made||midConstruct)?GRN:DIM,13);
      cell(ctx,oX+14,oY+56,oW-28,24,'y = '+vx[1], made?'rgba(126,224,176,0.12)':'rgba(255,255,255,0.04)', made?GRN:'rgba(255,255,255,0.14)', made?GRN:DIM,13);

      // 화살표 인자→멤버
      if(s.step>=1){ ctx.strokeStyle=GLD; ctx.lineWidth=1.8;
        ctx.beginPath(); ctx.moveTo(bx+30,by+44); ctx.lineTo(oX+40,oY+42); ctx.stroke(); }
      if(s.step>=2){ ctx.strokeStyle=GLD; ctx.lineWidth=1.8;
        ctx.beginPath(); ctx.moveTo(bx+102,by+44); ctx.lineTo(oX+40,oY+68); ctx.stroke(); }

      var oy2=oY+110;
      ctx.textAlign='left'; ctx.font='12.5px sans-serif';
      if(s.step===0){ ctx.fillStyle=DIM; ctx.fillText('생성자가 없으면 x·y는 쓰레기값. 있으면 태어날 때 채워집니다.', bx, oy2); }
      else if(s.step===1){ ctx.fillStyle=GLD; ctx.fillText('생성자 몸통 실행: x = a(=3) 대입 중…', bx, oy2); }
      else { ctx.fillStyle=GRN; ctx.fillText('완료: p 는 (3, 4)로 초기화되어 태어났습니다.', bx, oy2); }

      E.tapHint(W/2, H*0.94, '화면 탭 = 다음 (호출 → x=a → y=b 완료)', true);
      E.big('생성자 — 객체가 태어나는 의식', '객체를 만들어 놓고 초기화를 깜빡하면, 멤버변수에는 정체 모를 쓰레기값이 들어 있습니다. 생성자는 이 위험을 없앱니다 — 클래스와 같은 이름을 가진 특별한 함수로, 객체가 태어나는 바로 그 순간 자동으로 호출되죠. Point p(3, 4); 라고 쓰면 우리가 부르지 않아도 생성자가 실행되어 x에 3, y에 4를 넣어 줍니다. ‘생성하면서 동시에 초기화한다’ — 미초기화 상태가 존재할 틈을 아예 주지 않는 것입니다. 오른쪽을 보세요: 인자 3, 4가 생성자 몸통을 거쳐 멤버 x, y로 실제로 흘러 들어갑니다.'); }
  },

  // ══════════ 2. 소멸자 (생명주기) ══════════
  { id:'cpp4_02',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(340+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'class File {', hl:'class'},
        {t:'public:', hl:'public'},
        {t:'  File(){  open();  }    // 생성자', hl:'File()'},
        {t:'  ~File(){ close(); }    // 소멸자', hl:'~File()'},
        {t:'};', dim:true},
        {t:'{', dim:true},
        {t:'  File f;    // 태어남 → open()', hl:'File f'},
        {t:'  // ... f 사용 ...', dim:true},
        {t:'}          // 블록 끝 → ~File() close()', hl:'}'}
      ];
      var act=[2,6,7,8][s.step];
      var codeBot=codePanel(E, W*0.04, H*0.13, W*0.46, code, 'destructor.cpp', act);

      // 우측: 생명주기 타임라인 (생성 → 사용 → 소멸)
      var bx=W*0.56, bw=W*0.40, midY=H*0.40;
      ctx.strokeStyle='rgba(90,180,232,0.35)'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(bx, midY); ctx.lineTo(bx+bw, midY); ctx.stroke();
      // 마디: 생성 / 사용 / 소멸
      var stages=[
        {x:bx+bw*0.10, lab:'생성', sub:'생성자 File()', col:GRN, on:s.step>=1},
        {x:bx+bw*0.50, lab:'사용', sub:'f 로 작업', col:CPB, on:s.step>=2},
        {x:bx+bw*0.90, lab:'소멸', sub:'소멸자 ~File()', col:RED, on:s.step>=3}
      ];
      for(var i=0;i<stages.length;i++){ var g=stages[i];
        ctx.fillStyle= g.on? g.col : 'rgba(255,255,255,0.10)';
        ctx.strokeStyle= g.on? g.col : DIM; ctx.lineWidth=2;
        ctx.beginPath(); ctx.arc(g.x, midY, 11, 0,7); ctx.fill(); ctx.stroke();
        ctx.fillStyle= g.on? g.col : DIM; ctx.font='600 13px sans-serif'; ctx.textAlign='center';
        ctx.fillText(g.lab, g.x, midY-26);
        ctx.fillStyle= g.on? '#dfeaf2' : DIM; ctx.font='11.5px sans-serif';
        ctx.fillText(g.sub, g.x, midY+30);
      }
      // 진행 채움
      if(s.step>=1){ var endX = s.step>=3? stages[2].x : (s.step>=2? stages[1].x : stages[0].x);
        ctx.strokeStyle=GLD; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(stages[0].x, midY); ctx.lineTo(endX, midY); ctx.stroke(); }

      // 자원 상태 배지 (open/close)
      var badgeY=H*0.62;
      var opened = (s.step>=1 && s.step<3);
      ctx.textAlign='left'; ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText('파일 자원 상태:', bx, badgeY);
      var bcol = opened? GRN : RED;
      ctx.fillStyle= opened?'rgba(126,224,176,0.14)':'rgba(240,136,138,0.14)'; ctx.strokeStyle=bcol; ctx.lineWidth=1.5;
      roundRect(ctx,bx+120,badgeY-16,110,26,7); ctx.fill(); ctx.stroke();
      ctx.fillStyle=bcol; ctx.font='600 13px sans-serif'; ctx.textAlign='center';
      ctx.fillText(opened? 'OPEN (열림)':'CLOSED (닫힘)', bx+175, badgeY+2);

      var capY=Math.min(Math.max(H*0.80, codeBot+18), H*0.92);
      ctx.textAlign='left'; ctx.font='12.5px sans-serif';
      if(s.step===0){ ctx.fillStyle=DIM; ctx.fillText('생성자는 자원을 얻고(open), 소멸자는 되돌려 줍니다(close).', W*0.05, capY); }
      else if(s.step===1){ ctx.fillStyle=GRN; ctx.fillText('블록에 들어서며 f 생성 → 생성자가 open() 실행.', W*0.05, capY); }
      else if(s.step===2){ ctx.fillStyle=CPB; ctx.fillText('블록 안에서 f 를 사용하는 동안 자원은 열려 있습니다.', W*0.05, capY); }
      else { ctx.fillStyle=RED; ctx.fillText('} 를 지나며 f 소멸 → 소멸자가 자동으로 close(). 잊을 수 없습니다.', W*0.05, capY); }

      E.tapHint(W/2, H*0.94, '화면 탭 = 생명주기 진행 (생성 → 사용 → 소멸)', true);
      E.big('소멸자 — 뒷정리는 자동으로', '생성자가 객체의 탄생 의식이라면, 소멸자는 장례 의식입니다 — 이름은 클래스명 앞에 물결표(~)를 붙이고, 객체가 사라지는 순간 자동으로 호출됩니다. 지역 객체라면 그 객체가 선언된 블록 { } 이 끝나는 순간이죠. 왜 중요할까요? 객체가 파일·메모리·연결 같은 자원을 쥐고 있었다면, 사라지기 전에 반드시 돌려줘야 합니다. 생성자에서 open()으로 자원을 얻고 소멸자에서 close()로 반납하면 — 우리가 close를 부르는 걸 잊어도, C++이 블록 끝에서 소멸자를 반드시 불러 뒷정리해 줍니다. 이 ‘생성=획득, 소멸=반납’ 짝이 C++ 자원 관리(RAII)의 심장입니다.'); }
  },

  // ══════════ 3. 멤버 이니셜라이저 리스트 ══════════
  { id:'cpp4_03',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(340+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var assignMode=(s.step===0);
      var code = assignMode ? [
        {t:'// ① 몸통에서 대입 (assignment)', dim:true},
        {t:'class Point {', hl:'class'},
        {t:'  int x, y;', dim:true},
        {t:'public:', hl:'public'},
        {t:'  Point(int a, int b){', hl:'Point'},
        {t:'    x = a;   // 먼저 기본생성 후 대입', hl:'x = a'},
        {t:'    y = b;', hl:'y = b'},
        {t:'  }', dim:true},
        {t:'};', dim:true}
      ] : [
        {t:'// ② 이니셜라이저 리스트 (initialize)', dim:true},
        {t:'class Point {', hl:'class'},
        {t:'  const int x;   // const 멤버!', hl:'const int x'},
        {t:'  int& y;        // 참조 멤버!', hl:'int& y'},
        {t:'public:', hl:'public'},
        {t:'  Point(int a, int& b)', hl:'Point'},
        {t:'    : x(a), y(b) {}   // 곧바로 초기화', hl:': x(a), y(b)'},
        {t:'};', dim:true}
      ];
      var act = assignMode ? 5 : 6;
      codePanel(E, W*0.04, H*0.14, W*0.46, code, assignMode?'assign.cpp':'init_list.cpp', act);

      // 우측: 두 방식 대비 — 대입=2단계(생성 후 값바꿈), 초기화=1단계(태어날 때 확정)
      var bx=W*0.58, by=H*0.17, bw=W*0.34;
      ctx.textAlign='left';
      if(assignMode){
        ctx.fillStyle=GLD; ctx.font='600 14px sans-serif'; ctx.fillText('대입: 두 걸음', bx, by);
        // step1: 기본값으로 생성
        ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.strokeStyle=DIM; ctx.lineWidth=1.4; roundRect(ctx,bx,by+16,bw,40,8); ctx.fill(); ctx.stroke();
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('① 먼저 기본값(쓰레기)으로 x, y 생성', bx+12, by+40);
        // arrow
        ctx.fillStyle=GLD; ctx.font='20px sans-serif'; ctx.textAlign='center'; ctx.fillText('↓', bx+bw/2, by+72);
        ctx.textAlign='left';
        // step2: 값 대입
        ctx.fillStyle='rgba(255,211,122,0.12)'; ctx.strokeStyle=GLD; ctx.lineWidth=1.5; roundRect(ctx,bx,by+80,bw,40,8); ctx.fill(); ctx.stroke();
        ctx.fillStyle=GLD; ctx.font='12px sans-serif'; ctx.fillText('② 몸통 { } 에서 x = a, y = b 로 덮어씀', bx+12, by+104);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
        ctx.fillText('생성 → 다시 대입 = 낭비. 그리고 결정적 문제가 있습니다:', bx, by+150);
        ctx.fillStyle=RED; ctx.fillText('const·참조(&) 멤버는 ‘한 번만 초기화’ 가능 → 대입 불가!', bx, by+172);
      } else {
        ctx.fillStyle=GRN; ctx.font='600 14px sans-serif'; ctx.fillText('초기화: 한 걸음', bx, by);
        ctx.fillStyle='rgba(126,224,176,0.12)'; ctx.strokeStyle=GRN; ctx.lineWidth=1.6; roundRect(ctx,bx,by+16,bw,48,8); ctx.fill(); ctx.stroke();
        ctx.fillStyle=GRN; ctx.font='12px sans-serif'; ctx.fillText('x(a), y(b) — 태어나는 즉시 값 확정', bx+12, by+38);
        ctx.fillStyle=DIM; ctx.fillText('(중간 ‘빈 상태’가 없음)', bx+12, by+56);
        // const/ref 배지
        var badges=[['const int x','한 번만 초기화 가능'],['int& y','참조는 선언 시 결속 필수']];
        for(var i=0;i<badges.length;i++){ var byy=by+82+i*34;
          ctx.fillStyle='rgba(90,180,232,0.10)'; ctx.strokeStyle=CPB; ctx.lineWidth=1.3; roundRect(ctx,bx,byy,bw,28,6); ctx.fill(); ctx.stroke();
          ctx.fillStyle=CPD; ctx.font='12px ui-monospace,monospace'; ctx.fillText(badges[i][0], bx+10, byy+18);
          ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.fillText(badges[i][1], bx+130, byy+18);
        }
        ctx.fillStyle=GRN; ctx.font='12.5px sans-serif';
        ctx.fillText('이니셜라이저 리스트만이 const·참조 멤버를 초기화할 수 있습니다.', bx, by+168);
      }

      E.tapHint(W/2, H*0.94, '화면 탭 = 대입 ↔ 초기화 리스트 비교', true);
      E.big('멤버 이니셜라이저 리스트', '생성자 몸통에서 x = a; 라고 쓰는 건 사실 두 걸음입니다 — 먼저 x가 기본값으로 생성된 뒤, 곧바로 a로 덮어쓰는 것이죠. 반면 Point(int a, int b): x(a), y(b) {} 처럼 콜론(:) 뒤에 적는 멤버 이니셜라이저 리스트는 x를 처음부터 a로 초기화합니다 — 중간에 ‘빈 상태’를 거치지 않는 한 걸음입니다. 성능상 조금 낫기도 하지만, 결정적인 이유는 따로 있습니다: const 멤버와 참조(&) 멤버는 태어날 때 딱 한 번만 값을 정할 수 있어 나중에 대입이 아예 불가능합니다. 이런 멤버는 오직 이니셜라이저 리스트로만 초기화할 수 있죠. ‘대입이 아니라 초기화’ — 이 구분이 C++에서 중요한 이유입니다.'); }
  },

  // ══════════ 4. this 포인터 ══════════
  { id:'cpp4_04',
    enter:function(E){ var self=this; this.s={sel:0};
      E.controls('<div class="ctrl"><label>메서드를 호출한 객체</label><input type="range" id="sel" min="0" max="2" step="1" value="0"><output id="selo">a</output></div>');
      E.bind('#sel','input',function(e){ self.s.sel=+e.target.value; document.getElementById('selo').textContent=['a','b','c'][self.s.sel]; E.blip(360,0.05); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 세 객체, 서로 다른 x,y. 같은 grow() 코드를 호출 — this 가 누구를 가리키냐로 결과가 갈림 (실측)
      var objs=[ {n:'a',x:2,y:1}, {n:'b',x:5,y:3}, {n:'c',x:8,y:6} ];
      var sel=s.sel;
      // grow(): this->x += 1; return *this;  (실행 결과 계산)
      var o = objs[sel];
      var resX = o.x+1, resY = o.y;

      var code=[
        {t:'class Point {', hl:'class'},
        {t:'  int x, y;', dim:true},
        {t:'public:', hl:'public'},
        {t:'  Point& grow(){', hl:'Point&'},
        {t:'    this->x += 1;   // 나의 x', hl:'this->x'},
        {t:'    return *this;   // 나 자신', hl:'*this'},
        {t:'  }', dim:true},
        {t:'};', dim:true},
        {t:''+['a','b','c'][sel]+'.grow().grow();  // 체이닝', hl:'.grow()'}
      ];
      var codeBot=codePanel(E, W*0.04, H*0.13, W*0.46, code, 'this_pointer.cpp', 4);

      // 우측: 세 객체가 하나의 코드(grow)를 공유, this 화살표가 선택 객체를 가리킴
      var codeBoxX=W*0.56, codeBoxY=H*0.16, cbw=W*0.16, cbh=H*0.16;
      ctx.fillStyle='rgba(126,224,176,0.10)'; ctx.strokeStyle=GRN; ctx.lineWidth=1.6;
      roundRect(ctx,codeBoxX,codeBoxY,cbw,cbh,9); ctx.fill(); ctx.stroke();
      ctx.fillStyle=GRN; ctx.font='600 12px sans-serif'; ctx.textAlign='center'; ctx.fillText('grow() 코드', codeBoxX+cbw/2, codeBoxY+22);
      ctx.fillStyle='#dfeaf2'; ctx.font='11.5px ui-monospace,monospace';
      ctx.fillText('this->x += 1', codeBoxX+cbw/2, codeBoxY+cbh*0.55);
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.fillText('(단 하나, 공유됨)', codeBoxX+cbw/2, codeBoxY+cbh-12);

      // 세 객체 상자 (우측 영역 [W*0.78, W*0.945] 안에 배치, 화면밖 방지)
      var objX=W*0.78, objY=H*0.13, ow=W*0.165, oh=H*0.15, gap=H*0.025;
      for(var i=0;i<3;i++){
        var oy=objY+i*(oh+gap), on=(i===sel);
        var ob=objs[i];
        var dx = on? resX : ob.x, dy = on? resY : ob.y;
        ctx.fillStyle= on?'rgba(90,180,232,0.14)':'rgba(255,255,255,0.04)'; ctx.strokeStyle= on?CPB:'rgba(255,255,255,0.16)'; ctx.lineWidth= on?2:1.3;
        roundRect(ctx,objX,oy,ow,oh,8); ctx.fill(); ctx.stroke();
        ctx.fillStyle= on?CPB:DIM; ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.fillText('객체 '+ob.n, objX+12, oy+oh*0.32);
        ctx.fillStyle= on?'#dfeaf2':DIM; ctx.font='13px ui-monospace,monospace';
        ctx.fillText('x = '+dx, objX+12, oy+oh*0.62);
        ctx.fillText('y = '+dy, objX+12, oy+oh*0.88);
        // this 화살표: 공유코드 → 선택 객체
        if(on){ ctx.strokeStyle=GLD; ctx.lineWidth=2.2;
          ctx.beginPath(); ctx.moveTo(codeBoxX+cbw, codeBoxY+cbh/2); ctx.lineTo(objX-4, oy+oh/2); ctx.stroke();
          var ax=objX-4, ay=oy+oh/2;
          ctx.beginPath(); ctx.moveTo(ax-9,ay-5); ctx.lineTo(ax,ay); ctx.lineTo(ax-9,ay+5); ctx.fillStyle=GLD; ctx.fill();
          ctx.fillStyle=GLD; ctx.font='600 12px sans-serif'; ctx.textAlign='left'; ctx.fillText('this →', (codeBoxX+cbw+objX)/2-16, (codeBoxY+cbh/2+oy+oh/2)/2-6);
        }
      }

      // 실측 결과 (좌측 캡션 = codePanel 아래(codeBot+18) 이면서 화면 밑단(H*0.93) 위, 낮은 창에서도 코드패널 침범·밑단 초과 없이 2줄)
      var capY1=Math.max(H*0.83, codeBot+18), capY2=Math.min(capY1+22, H*0.92);
      ctx.textAlign='left'; ctx.fillStyle=CPB; ctx.font='600 14px sans-serif';
      ctx.fillText(['a','b','c'][sel]+'.grow() → this 는 '+o.n+' 를 가리킴  ·  '+o.n+'.x : '+o.x+' → '+resX+' (다른 객체는 그대로)', W*0.05, capY1);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif';
      ctx.fillText('return *this 로 자기 자신을 돌려주니 a.grow().grow() 처럼 연달아 부를 수 있습니다(체이닝).', W*0.05, capY2);

      E.tapHint(W/2, H*0.965, '슬라이더로 호출 객체를 바꿔 this 가 누구를 가리키는지 보세요', true);
      E.big('this 포인터 — 나 자신을 가리키는 화살표', '멤버함수의 코드는 클래스마다 딱 하나뿐입니다 — a, b, c 세 객체가 있어도 grow() 코드는 한 벌을 공유하죠. 그렇다면 a.grow()를 부를 때 x += 1은 대체 누구의 x일까요? 답은 this 포인터입니다. 멤버함수가 호출되는 순간, C++은 ‘점(.) 앞에 놓인 그 객체의 주소’를 this라는 숨은 인자로 몰래 넘깁니다. 그래서 this->x는 언제나 지금 호출한 그 객체의 x가 되죠. 슬라이더로 호출 객체를 바꿔 보세요 — 같은 코드인데 this가 가리키는 대상만 바뀌어, 그 객체의 x만 늘어납니다. return *this로 자기 자신을 돌려주면 a.grow().grow()처럼 메서드를 사슬로 이을 수도 있습니다.'); }
  },

  // ══════════ 5. 객체 배열·생성/소멸 순서 ══════════
  { id:'cpp4_05',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%7; E.blip(330+this.s.step*50,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // arr[3]: 생성 순서 0→1→2, 소멸 역순 2→1→0 (스택). 실측 순서로 진행.
      // step 0: 시작, 1: 생성 arr[0], 2: arr[1], 3: arr[2], 4: 소멸 arr[2], 5: arr[1], 6: arr[0]
      var N=3;
      // 각 원소 상태: 'none' | 'alive' | 'dead'
      var state=['none','none','none'];
      if(s.step>=1) state[0]='alive';
      if(s.step>=2) state[1]='alive';
      if(s.step>=3) state[2]='alive';
      if(s.step>=4) state[2]='dead';
      if(s.step>=5) state[1]='dead';
      if(s.step>=6) state[0]='dead';

      var code=[
        {t:'{', dim:true},
        {t:'  Widget arr[3];   // 배열 선언', hl:'Widget arr[3]'},
        {t:'  //  생성: arr[0] → arr[1] → arr[2]', hl:'생성'},
        {t:'  //  (앞에서 뒤로)', dim:true},
        {t:'  // ... 사용 ...', dim:true},
        {t:'}  // 블록 끝: 소멸은 역순', hl:'소멸은 역순'},
        {t:'  //  소멸: arr[2] → arr[1] → arr[0]', hl:'소멸'},
        {t:'  //  (뒤에서 앞으로, 스택처럼)', dim:true}
      ];
      var act = s.step===0?1 : (s.step<=3? 2 : (s.step===4||s.step===5||s.step===6? 6 : 5));
      var codeBot=codePanel(E, W*0.04, H*0.13, W*0.46, code, 'array_lifecycle.cpp', act);

      // 우측: 배열 3칸, 생성=쌓임 / 소멸=역순으로 사라짐
      var bx=W*0.58, by=H*0.20, cw=W*0.10, chh=H*0.11, gap=H*0.03;
      ctx.textAlign='left'; ctx.fillStyle=CPB; ctx.font='600 14px sans-serif'; ctx.fillText('Widget arr[3]  —  생성/소멸 순서', bx, by);
      for(var i=0;i<N;i++){
        var ey=by+18+i*(chh+gap);
        var stt=state[i];
        var col = stt==='alive'? GRN : (stt==='dead'? RED : DIM);
        var fill = stt==='alive'? 'rgba(126,224,176,0.14)' : (stt==='dead'? 'rgba(240,136,138,0.10)' : 'rgba(255,255,255,0.03)');
        ctx.fillStyle=fill; ctx.strokeStyle=col; ctx.lineWidth= stt==='alive'?2:1.4;
        roundRect(ctx,bx,ey,cw*2,chh,8); ctx.fill(); ctx.stroke();
        ctx.fillStyle=col; ctx.font='600 14px ui-monospace,monospace'; ctx.textAlign='left';
        ctx.fillText('arr['+i+']', bx+14, ey+chh*0.6);
        ctx.font='11.5px sans-serif';
        var lbl = stt==='alive'? '살아 있음 (생성됨)' : (stt==='dead'? '소멸됨 (~Widget)' : '아직 없음');
        ctx.fillText(lbl, bx+90, ey+chh*0.6);
        // 순서 배지
        if(stt==='alive'){ ctx.fillStyle=GRN; ctx.font='600 11px sans-serif'; ctx.textAlign='right'; ctx.fillText('생성 #'+(i+1), bx+cw*2-12, ey+18); }
        if(stt==='dead'){ ctx.fillStyle=RED; ctx.font='600 11px sans-serif'; ctx.textAlign='right'; ctx.fillText('소멸 #'+(N-i), bx+cw*2-12, ey+18); }
      }

      // 하단: 순서 화살표 요약
      // 좌측 3줄 요약: codePanel 아래(codeBot+18)이면서 3줄이 H*0.93 밑단을 넘지 않도록 시작점을 위로 clamp
      ctx.textAlign='left';
      var conY=Math.min(Math.max(H*0.72, codeBot+18), H*0.93-48);
      ctx.fillStyle=GRN; ctx.font='600 13px sans-serif';
      ctx.fillText('생성 순서:  arr[0] → arr[1] → arr[2]   (앞→뒤)', W*0.05, conY);
      ctx.fillStyle=RED; ctx.font='600 13px sans-serif';
      ctx.fillText('소멸 순서:  arr[2] → arr[1] → arr[0]   (뒤→앞, 역순)', W*0.05, conY+24);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif';
      var phase = s.step===0?'배열 선언 직전' : (s.step<=3? '생성 단계 '+s.step+'/3' : '소멸 단계 '+(s.step-3)+'/3');
      ctx.fillText('현재: '+phase+'  ·  나중에 태어난 것이 먼저 죽습니다(LIFO, 스택 규칙).', W*0.05, conY+48);

      E.tapHint(W/2, H*0.95, '화면 탭 = 생성 3 → 소멸 3 (순서 확인)', true);
      E.big('객체 배열 — 생성은 순서대로, 소멸은 역순으로', 'Widget arr[3]; 라고 쓰면 객체 세 개가 한 줄로 태어납니다 — 각각의 생성자가 arr[0], arr[1], arr[2] 순서로, 앞에서 뒤로 호출되죠. 그런데 블록이 끝나 이들이 사라질 때는 순서가 뒤집힙니다: arr[2]가 먼저, 그다음 arr[1], 마지막이 arr[0] — 태어난 역순입니다. 왜 그럴까요? 나중에 만들어진 객체가 먼저 만들어진 객체에 기대고 있을 수 있기 때문입니다. 그래서 ‘나중에 태어난 것이 먼저 죽는다’(LIFO)는 스택 규칙을 따르면, 소멸 시점에 의존 대상이 아직 살아 있음이 보장됩니다. 화면에서 세 칸이 위→아래로 생성되고, 다시 아래→위로 소멸하는 것을 실제 순서 그대로 확인해 보세요.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
