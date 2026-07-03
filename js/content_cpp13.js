/* C++ 제13장 — 예외처리 (try/catch/throw · 예외 클래스 계층 · 스택 풀기 · 예외 안전성 · noexcept)
   동작(behavior)만. 텍스트=content/cpp13.json. 엔진 js/engine.js 공유. 색: C++=블루(#5ab4e8).
   골든룰: 화면의 모든 값(제어 흐름 도달 여부·잡히는 catch·소멸 순서·자원 개수·비교표 판정)은 draw에서 실제로 계산.
   진짜 컴파일 가능한 표준 C++(C++11/17) 코드 + 실계산 결과. 윤성우 열혈C++ + Effective C++ 항목29 기반. */
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
  // 둥근 상자 + 라벨 헬퍼
  function box(ctx,x,y,w,h,col,label,fs,fill){
    roundRect(ctx,x,y,w,h,8); ctx.fillStyle=fill||'rgba(255,255,255,0.05)'; ctx.fill();
    ctx.strokeStyle=col; ctx.lineWidth=1.6; ctx.stroke();
    if(label!=null){ ctx.fillStyle=col; ctx.font='600 '+(fs||13)+'px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(label, x+w/2, y+h/2+1); ctx.textBaseline='alphabetic'; }
  }
  function arrow(ctx,x1,y1,x2,y2,col){ ctx.strokeStyle=col; ctx.lineWidth=1.8; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    var a=Math.atan2(y2-y1,x2-x1); ctx.beginPath(); ctx.moveTo(x2,y2);
    ctx.lineTo(x2-9*Math.cos(a-0.4), y2-9*Math.sin(a-0.4)); ctx.lineTo(x2-9*Math.cos(a+0.4), y2-9*Math.sin(a+0.4)); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }

  var scenes = [

  // ══════════ 1. try / catch / throw ══════════
  { id:'cpp13_01',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(360+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // step0 = 정상 흐름(b!=0), step1 = 예외 흐름(b==0)
      var b = (s.step===0) ? 2 : 0;      // 나눗셈 분모
      var a = 10;
      var thrown = (b===0);
      var result = thrown ? null : a/b;

      var code=[
        {t:'double divide(int a, int b) {', dim:true},
        {t:'    if (b == 0)', hl:'if (b == 0)'},
        {t:'        throw std::runtime_error("0으로 나눔");', hl:'throw'},
        {t:'    return a / b;', hl:'return a / b'},
        {t:'}', dim:true},
        {t:'try {', hl:'try'},
        {t:'    double r = divide(10, b);', hl:'divide(10, b)'},
        {t:'    std::cout << r;   // 정상', dim:true},
        {t:'} catch (std::exception& e) {', hl:'catch'},
        {t:'    std::cerr << e.what();', hl:'e.what()'},
        {t:'}', dim:true}
      ];
      // 줄커서: 정상=검사→나눗셈→출력, 예외=검사→throw→catch
      var act = thrown ? 2 : 6;
      codePanel(E, W*0.04, H*0.12, W*0.48, code, 'try_catch.cpp', act);

      // 우측: 제어 흐름 두 경로
      var bx=W*0.58, cy=H*0.20;
      ctx.textAlign='center';
      box(ctx, bx, cy, W*0.30, 34, CPD, 'divide(10, '+b+')', 13);
      var mid=bx+W*0.15;
      arrow(ctx, mid, cy+34, mid, cy+64, DIM);
      box(ctx, bx, cy+64, W*0.30, 30, thrown?DIM:GRN, 'b == 0 ?  →  '+(thrown?'참(throw)':'거짓'), 12);

      if(!thrown){
        arrow(ctx, mid, cy+94, mid, cy+124, GRN);
        box(ctx, bx+W*0.03, cy+124, W*0.24, 34, GRN, 'return '+result, 14, 'rgba(126,224,176,0.10)');
        arrow(ctx, mid, cy+158, mid, cy+188, GRN);
        box(ctx, bx+W*0.02, cy+188, W*0.26, 34, GRN, 'cout << '+result+'  ✓', 13, 'rgba(126,224,176,0.08)');
        ctx.fillStyle=GRN; ctx.font='600 13px sans-serif';
        ctx.fillText('정상 흐름: try 블록이 끝까지 실행', mid, cy+250);
      } else {
        arrow(ctx, mid, cy+94, mid, cy+124, RED);
        box(ctx, bx+W*0.02, cy+124, W*0.26, 34, RED, 'throw runtime_error', 12.5, 'rgba(240,136,138,0.10)');
        // 점프 곡선: throw 지점에서 catch 로
        ctx.strokeStyle=RED; ctx.lineWidth=1.8; ctx.setLineDash([5,4]);
        ctx.beginPath(); ctx.moveTo(bx+W*0.28, cy+141); ctx.lineTo(bx+W*0.31, cy+141); ctx.lineTo(bx+W*0.31, cy+205); ctx.lineTo(bx+W*0.28, cy+205); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle=RED; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('return·cout 건너뜀', bx+W*0.315, cy+173);
        ctx.textAlign='center';
        box(ctx, bx+W*0.005, cy+188, W*0.29, 34, RED, 'catch: e.what() = "0으로 나눔"', 11.5, 'rgba(240,136,138,0.08)');
        ctx.fillStyle=RED; ctx.font='600 13px sans-serif';
        ctx.fillText('예외 흐름: throw 즉시 catch 로 점프', mid, cy+250);
      }

      E.tapHint(W/2, H*0.94, '화면 탭 = 정상 흐름 ↔ 예외 발생 흐름', true);
      E.big('try · catch · throw — 오류를 던지고 받다', '어떤 코드는 계속 진행하는 게 재앙일 때가 있습니다 — 0으로 나누기, 없는 파일 열기처럼. 그럴 때 throw는 “여기서 멈춰!”라며 예외 객체를 위로 던집니다. 그러면 그 아래 남은 코드(return도, cout도)는 전부 건너뛰고, 실행은 가장 가까운 catch로 점프하죠. try는 “이 안에서 사고가 나면 아래 catch로 받겠다”는 울타리입니다. catch(std::exception& e)는 표준 예외를 참조로 받아 e.what()으로 사연을 읽고요. 오류 처리 코드를 정상 로직과 뒤섞지 않고 한곳에 모아 두는 것 — 이것이 예외의 힘입니다.'); }
  },

  // ══════════ 2. 예외 클래스 계층 — std::exception 상속 ══════════
  { id:'cpp13_02',
    enter:function(E){ var self=this; this.s={sel:1};
      E.controls('<div class="ctrl"><label>던질 예외</label><input type="range" id="ex" min="0" max="2" step="1" value="1"><output id="exo">out_of_range</output></div>');
      E.bind('#ex','input',function(e){ self.s.sel=+e.target.value; document.getElementById('exo').textContent=['invalid_argument','out_of_range','runtime_error'][self.s.sel]; E.blip(340+self.s.sel*40,0.06); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 계층: exception ← {logic_error ← {invalid_argument, out_of_range}, runtime_error}
      // 던진 예외의 조상 사슬을 실제로 판정해 "어떤 catch가 잡나"를 계산.
      var thrown=['invalid_argument','out_of_range','runtime_error'][s.sel];
      var chains={
        'invalid_argument':['invalid_argument','logic_error','exception'],
        'out_of_range':['out_of_range','logic_error','exception'],
        'runtime_error':['runtime_error','exception']
      };
      var chain=chains[thrown];
      var catches=['out_of_range','logic_error','exception'];   // catch 절 순서(위부터 첫 일치)
      var caughtBy=null;
      for(var ci=0;ci<catches.length;ci++){ if(chain.indexOf(catches[ci])>=0){ caughtBy=catches[ci]; break; } }

      var code=[
        {t:'try {', hl:'try'},
        {t:'    throw std::'+thrown+'("...");', hl:thrown},
        {t:'}', dim:true},
        {t:'catch (std::out_of_range& e) {', hl:'out_of_range'},
        {t:'    /* 범위 초과 처리 */', dim:true},
        {t:'catch (std::logic_error& e) {', hl:'logic_error'},
        {t:'    /* 논리 오류 처리 */', dim:true},
        {t:'catch (std::exception& e) {', hl:'exception'},
        {t:'    /* 그 밖의 모든 표준 예외 */', dim:true}
      ];
      var actMap={'out_of_range':3,'logic_error':5,'exception':7};
      codePanel(E, W*0.04, H*0.12, W*0.48, code, 'exception_hierarchy.cpp', actMap[caughtBy]);

      // 우측: 상속 계층도
      var bx=W*0.56, cw=W*0.19;
      function nodeAt(nm,x,y,w,active){ var inChain=chain.indexOf(nm)>=0;
        var col=active?GLD:(inChain?CPB:DIM);
        box(ctx, x, y, w, 30, col, nm, 12, active?'rgba(255,211,122,0.14)':(inChain?'rgba(90,180,232,0.10)':'rgba(255,255,255,0.03)')); }
      var y0=H*0.16;
      nodeAt('std::exception', bx+cw*0.5, y0, cw, caughtBy==='exception');
      var y1=y0+56;
      nodeAt('logic_error', bx, y1, cw, caughtBy==='logic_error');
      nodeAt('runtime_error', bx+cw*1.1, y1, cw, false);
      arrow(ctx, bx+cw*0.7, y0+30, bx+cw*0.5, y1, DIM);
      arrow(ctx, bx+cw*1.1, y0+30, bx+cw*1.5, y1, DIM);
      var y2=y1+56;
      nodeAt('invalid_argument', bx-cw*0.25, y2, cw*1.05, false);
      nodeAt('out_of_range', bx+cw*0.9, y2, cw, caughtBy==='out_of_range');
      arrow(ctx, bx+cw*0.35, y1+30, bx+cw*0.25, y2, DIM);
      arrow(ctx, bx+cw*0.6, y1+30, bx+cw*1.4, y2, DIM);

      // 던진 예외 표식 + 잡힌 절
      var iy=y2+60;
      ctx.textAlign='left'; ctx.fillStyle=RED; ctx.font='600 13px sans-serif';
      ctx.fillText('throw std::'+thrown, bx-cw*0.2, iy);
      ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
      ctx.fillText('조상 사슬: '+chain.join('  →  '), bx-cw*0.2, iy+22);
      ctx.fillStyle=GLD; ctx.font='600 14px sans-serif';
      ctx.fillText('→ catch (std::'+caughtBy+'&) 가 잡습니다', bx-cw*0.2, iy+48);
      ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
      ctx.fillText('기반 참조로 파생 예외를 잡습니다(다형성). 좁은 catch를 위쪽에.', bx-cw*0.2, iy+70);

      E.tapHint(W/2, H*0.95, '슬라이더로 던질 예외를 바꿔 어떤 catch가 잡는지 보세요', true);
      E.big('예외 클래스 — <stdexcept>의 계통도', '표준 라이브러리는 예외를 족보로 정리해 둡니다. 뿌리는 std::exception, 그 아래로 “호출자가 미리 막을 수 있었던” logic_error(invalid_argument·out_of_range·length_error…)와 “실행 중에야 드러나는” runtime_error(overflow_error·range_error…)로 갈립니다. 핵심은 상속의 다형성 — catch(std::exception&) 하나면 모든 표준 예외를 참조로 받아 냅니다. 파생일수록 위에, 기반일수록 아래에 catch를 놓아야 “좁은 그물”이 먼저 걸러 냅니다. 슬라이더로 예외를 바꾸면, 그 예외의 조상 사슬을 따라 실제로 어느 catch에 걸리는지가 계산되어 표시됩니다.'); }
  },

  // ══════════ 3. 스택 풀기(stack unwinding) — 소멸자 호출 순서 ══════════
  { id:'cpp13_03',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%6; E.blip(340+this.s.step*40,0.06); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 콜스택: main → level1(Res A) → level2(Res B) → throw
      // step 0: 쌓임, 1: A생성, 2: B생성, 3: throw, 4: B소멸, 5: A소멸+catch
      var code=[
        {t:'struct Res {', dim:true},
        {t:'    ~Res() { log("소멸 " + name); }', hl:'~Res()'},
        {t:'};', dim:true},
        {t:'void level2() {', dim:true},
        {t:'    Res B{"B"};', hl:'Res B'},
        {t:'    throw std::runtime_error("!");', hl:'throw'},
        {t:'}', dim:true},
        {t:'void level1() {', dim:true},
        {t:'    Res A{"A"};', hl:'Res A'},
        {t:'    level2();          // 여기서 예외', dim:true},
        {t:'}',  dim:true},
        {t:'try { level1(); }', hl:'try'},
        {t:'catch (std::exception& e) { ... }', hl:'catch'}
      ];
      var actMap=[11,8,4,5,4,12]; // 각 step 활성줄
      codePanel(E, W*0.04, H*0.09, W*0.50, code, 'stack_unwinding.cpp', actMap[s.step]);

      // 우측: 콜스택 프레임 (아래=main, 위로 쌓임) + 지역 객체 + 소멸 로그
      var bx=W*0.60, fw=W*0.30, fh=30, baseY=H*0.58;
      var frames=[['main / try',null],['level1()','A'],['level2()','B']];
      var alive = [1,2,3,3,2,1][s.step];  // 살아 있는 프레임 개수
      ctx.textAlign='center';
      for(var i=0;i<frames.length;i++){
        var fy=baseY - i*(fh+18);
        var on=(i<alive);
        var throwing=(s.step===3 && i===2);
        var col=throwing?RED:(on?CPB:DIM);
        box(ctx, bx, fy, fw, fh, col, frames[i][0], 12.5, on?'rgba(90,180,232,0.08)':'rgba(255,255,255,0.02)');
        if(frames[i][1]){
          var resAlive = on && !(s.step>=4 && i===2) && !(s.step>=5 && i===1);
          var rcol=resAlive?GRN:RED;
          box(ctx, bx+fw+14, fy, 66, fh, rcol, 'Res '+frames[i][1], 12, resAlive?'rgba(126,224,176,0.10)':'rgba(240,136,138,0.10)');
          if(!resAlive && s.step>=4){ ctx.fillStyle=RED; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('~Res()', bx+fw+84, fy+fh/2+4); ctx.textAlign='center'; }
        }
      }
      // 상태 캡션 + 소멸 순서 로그
      var caps=['try 안에서 level1() 호출 — 스택이 쌓입니다',
                'level1: 지역 객체 Res A 생성',
                'level2: 지역 객체 Res B 생성',
                'level2에서 throw! — 스택 풀기 시작',
                '풀기: level2 프레임 정리 → ~Res(B) 먼저',
                '풀기: level1 프레임 정리 → ~Res(A) — catch 도달'];
      ctx.fillStyle=(s.step>=3?RED:CPD); ctx.font='600 13px sans-serif'; ctx.textAlign='left';
      ctx.fillText(caps[s.step], W*0.05, H*0.70);
      var order=[]; if(s.step>=4) order.push('B'); if(s.step>=5) order.push('A');
      ctx.fillStyle=GRN; ctx.font='600 13px sans-serif';
      ctx.fillText('소멸 순서(생성의 역순, LIFO): '+(order.length?order.map(function(n){return '~Res('+n+')';}).join('  →  '):'—'), W*0.05, H*0.76);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif';
      ctx.fillText('예외가 위로 전파되며, 지나치는 각 스코프의 지역 객체 소멸자가 자동 호출됩니다.', W*0.05, H*0.82);
      if(s.step>=5){ ctx.fillStyle=GLD; ctx.font='600 12.5px sans-serif';
        ctx.fillText('자원 A·B 모두 정상 반납된 뒤 catch가 잡음 — RAII+예외의 안전망입니다.', W*0.05, H*0.88); }

      E.tapHint(W/2, H*0.96, '화면 탭 = 다음 (스택 쌓임 → throw → 소멸 → catch)', true);
      E.big('스택 풀기 — 예외가 지나간 자리는 깨끗하다', 'throw가 일어나면 실행은 catch를 찾아 콜스택을 거슬러 올라갑니다. 이때 마법 같은 일이 벌어지죠 — 빠져나가는 각 함수의 지역 객체들이 생성의 역순(LIFO)으로 소멸자가 호출됩니다. 이 과정이 “스택 풀기”입니다. level2의 Res B가 먼저 소멸하고, 그다음 level1의 Res A가 소멸한 뒤에야 catch가 예외를 받죠. 덕분에 파일은 닫히고, 락은 풀리고, 메모리는 반납됩니다 — 오류가 나도 자원이 새지 않는 것. 그래서 “자원은 소멸자에게 맡겨라(RAII)”가 C++의 철칙입니다. 소멸자에서 예외를 다시 던지면 이 풀기 도중에 두 예외가 겹쳐 프로그램이 죽으니, 소멸자는 절대 예외를 밖으로 내보내지 않습니다.'); }
  },

  // ══════════ 4. 예외 안전성 — 기본/강력/무예외 보장 (Effective 항목29) ══════════
  { id:'cpp13_04',
    enter:function(E){ var self=this; this.s={lv:1};
      E.controls('<div class="ctrl"><label>보장 수준</label><input type="range" id="gr" min="0" max="2" step="1" value="1"><output id="gro">강력 보장</output></div>');
      E.bind('#gr','input',function(e){ self.s.lv=+e.target.value; document.getElementById('gro').textContent=['기본 보장','강력 보장','무예외 보장'][self.s.lv]; E.blip(340+self.s.lv*50,0.06); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var LV=s.lv;
      // 실제 판정: 세 수준 모두 누수 없음, 강력 이상만 롤백, 무예외만 throw 안 함
      var leaks = false;
      var rollback = (LV>=1);
      var canThrow = (LV<2);

      var codeByLv=[
        [ {t:'// 기본 보장: 예외 나도 불변식 유지', dim:true},
          {t:'void set(Widget w) {', dim:true},
          {t:'    delete pImpl;', hl:'delete pImpl'},
          {t:'    pImpl = new Impl(w); // ← throw 가능', hl:'new Impl(w)'},
          {t:'}  // 실패 시 pImpl 는 이미 delete됨', dim:true},
          {t:'   // 누수 없음. 그러나 이전 값은 잃음', dim:true} ],
        [ {t:'// 강력 보장: copy-and-swap', dim:true},
          {t:'void set(Widget w) {', dim:true},
          {t:'    auto tmp = new Impl(w); // throw면 여기', hl:'new Impl(w)'},
          {t:'    std::swap(pImpl, tmp);  // no-throw', hl:'std::swap'},
          {t:'    delete tmp;             // no-throw', hl:'delete tmp'},
          {t:'}  // 실패해도 원래 상태 그대로', dim:true} ],
        [ {t:'// 무예외 보장: 절대 던지지 않음', dim:true},
          {t:'void swap(Widget& o) noexcept {', hl:'noexcept'},
          {t:'    std::swap(pImpl, o.pImpl);', hl:'std::swap'},
          {t:'}  // 포인터 교환만 — 실패 불가', dim:true},
          {t:'~Widget() noexcept { delete pImpl; }', hl:'noexcept'},
          {t:'   // 소멸자는 언제나 무예외', dim:true} ]
      ];
      codePanel(E, W*0.04, H*0.12, W*0.50, codeByLv[LV], 'exception_safety.cpp');

      // 우측: 세 보장의 사다리 + 현재 수준 강조
      var bx=W*0.60, ty=H*0.14, rw=W*0.34, rh=44;
      var levels=[['기본 보장 (basic)','자원 누수 없음·불변식 유지', GLD],
                  ['강력 보장 (strong)','성공 아니면 완전 원상복구', GRN],
                  ['무예외 보장 (nothrow)','절대 예외를 던지지 않음', CPB]];
      for(var i=0;i<3;i++){ var y=ty+i*(rh+14), on=(i===LV);
        box(ctx, bx, y, rw, rh, on?levels[i][2]:DIM, null, 0, on?'rgba(90,180,232,0.10)':'rgba(255,255,255,0.03)');
        ctx.textAlign='left'; ctx.fillStyle=on?levels[i][2]:DIM; ctx.font='600 13px sans-serif';
        ctx.fillText(levels[i][0], bx+14, y+18);
        ctx.fillStyle=on?'#dfeaf2':DIM; ctx.font='12px sans-serif';
        ctx.fillText(levels[i][1], bx+14, y+36);
        if(on){ ctx.fillStyle=levels[i][2]; ctx.font='16px sans-serif'; ctx.textAlign='right'; ctx.fillText('◄', bx+rw-10, y+26); }
      }

      // 판정 배지(실측)
      var jy=ty+3*(rh+14)+18, px=bx;
      function badge(label,ok,x){ var col=ok?GRN:RED;
        box(ctx, x, jy, W*0.16, 30, col, null, 0, ok?'rgba(126,224,176,0.10)':'rgba(240,136,138,0.10)');
        ctx.fillStyle=col; ctx.font='600 12px sans-serif'; ctx.textAlign='center';
        ctx.fillText(label+': '+(ok?'✓':'✗'), x+W*0.08, jy+19); }
      badge('자원 누수 없음', !leaks, px);
      badge('상태 롤백', rollback, px+W*0.18);
      ctx.textAlign='left'; ctx.fillStyle=DIM; ctx.font='12px sans-serif';
      ctx.fillText('무예외 보장 여부: '+(canThrow?'throw 가능':'noexcept — 절대 실패 안 함'), px, jy+56);

      ctx.fillStyle=GLD; ctx.font='600 12.5px sans-serif';
      ctx.fillText('강력 보장 = 트랜잭션처럼 “전부 아니면 전무”. copy-and-swap 관용구로 얻습니다.', W*0.05, H*0.92);

      E.tapHint(W/2, H*0.96, '슬라이더로 보장 수준을 올려 코드·성질을 비교하세요', true);
      E.big('예외 안전성 — 세 단계의 약속 (Effective 항목29)', '예외를 던지는 함수는 반드시 “예외가 나면 어떤 상태를 보장하는가”를 약속해야 합니다. 가장 약한 기본 보장은 “예외가 나도 자원이 새지 않고 객체의 불변식은 지킨다”입니다 — 다만 값이 바뀌었을 수는 있죠. 강력 보장은 한 단계 위, “성공하면 다 바뀌고, 실패하면 호출 전과 완벽히 똑같다” — 데이터베이스 트랜잭션의 커밋/롤백과 같습니다. 이건 copy-and-swap 관용구로 얻습니다: 먼저 복사본을 만들다 예외가 나면 원본은 무사하고, 다 만든 뒤 no-throw인 swap으로 갈아 끼우는 것. 최고는 무예외 보장(noexcept) — “나는 절대 실패하지 않는다”. swap과 소멸자가 여기 속합니다. 함수 하나가 여러 수준을 뒤섞지 말고, 도달 가능한 가장 강한 보장을 골라 문서화하세요.'); }
  },

  // ══════════ 5. noexcept · 예외 vs 오류코드 ══════════
  { id:'cpp13_05',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(360+this.s.step*90,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'// noexcept: "이 함수는 예외를 안 던짐"', dim:true},
        {t:'int size() const noexcept { return n; }', hl:'noexcept'},
        {t:'void swap(T& o) noexcept;', hl:'noexcept'},
        {t:'', dim:true},
        {t:'// 던지면? → std::terminate() 즉시 호출', dim:true},
        {t:'', dim:true},
        {t:'// move 연산에 noexcept를 붙이면', dim:true},
        {t:'T(T&& o) noexcept;   // vector 재할당이', hl:'noexcept'},
        {t:'                     // move를 안심하고 사용', dim:true}
      ];
      codePanel(E, W*0.04, H*0.12, W*0.50, code, 'noexcept.cpp', s.step===0?1:7);

      if(s.step===0){
        var bx=W*0.60, ty=H*0.16;
        ctx.textAlign='left'; ctx.fillStyle=CPB; ctx.font='600 14px sans-serif';
        ctx.fillText('noexcept — 컴파일러와의 계약', bx, ty);
        var items=[['호출자에게','이 함수는 예외를 던지지 않는다고 약속', CPD],
                   ['컴파일러에게','예외 전파 코드 생략 → 더 빠른 최적화', GRN],
                   ['어기면','스택 풀기 없이 std::terminate() — 종료', RED],
                   ['꼭 붙일 곳','소멸자·swap·이동 생성/대입 연산', GLD]];
        for(var i=0;i<items.length;i++){ var y=ty+24+i*54;
          box(ctx, bx, y, W*0.34, 44, items[i][2], null, 0, 'rgba(255,255,255,0.03)');
          ctx.fillStyle=items[i][2]; ctx.font='600 12.5px sans-serif'; ctx.textAlign='left';
          ctx.fillText(items[i][0], bx+12, y+18);
          ctx.fillStyle='#dfeaf2'; ctx.font='12px sans-serif'; ctx.fillText(items[i][1], bx+12, y+36); }
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('move가 noexcept면 std::vector가 성장 시 복사 대신 이동을 택합니다 — 성능 급상승.', W*0.05, H*0.92);
      } else {
        var bx=W*0.55, ty=H*0.15, cw=W*0.20, rh=34;
        var rows=[
          ['오류를 무시하면','반환값 무시 가능(위험)','건너뛸 수 없음(강제)'],
          ['정상 로직과','반환값·if로 뒤섞임','분리(try/catch 한곳)'],
          ['깊은 호출에서','한 단계씩 손수 전파','자동으로 위까지 전파'],
          ['생성자 실패','반환값이 없어 곤란','throw로 자연스럽게'],
          ['비용','항상 검사(작음)','던질 때만(평소 0)']
        ];
        ctx.textAlign='center';
        box(ctx, bx, ty, cw, rh, DIM, '상황', 12.5, 'rgba(255,255,255,0.04)');
        box(ctx, bx+cw, ty, cw, rh, GLD, '오류 코드', 12.5, 'rgba(255,211,122,0.10)');
        box(ctx, bx+cw*2, ty, cw, rh, GRN, '예외', 12.5, 'rgba(126,224,176,0.10)');
        for(var r=0;r<rows.length;r++){ var y=ty+rh*(r+1);
          box(ctx, bx, y, cw, rh, DIM, null, 0, 'rgba(255,255,255,0.02)');
          ctx.fillStyle='#dfeaf2'; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText(rows[r][0], bx+cw/2, y+rh/2+4);
          box(ctx, bx+cw, y, cw, rh, 'rgba(255,211,122,0.4)', null, 0, 'rgba(255,255,255,0.02)');
          ctx.fillStyle=GLD; ctx.font='11px sans-serif'; ctx.fillText(rows[r][1], bx+cw+cw/2, y+rh/2+4);
          box(ctx, bx+cw*2, y, cw, rh, 'rgba(126,224,176,0.4)', null, 0, 'rgba(255,255,255,0.02)');
          ctx.fillStyle=GRN; ctx.font='11px sans-serif'; ctx.fillText(rows[r][2], bx+cw*2+cw/2, y+rh/2+4); }
        ctx.textAlign='left'; ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('둘 다 도구입니다: 흔하고 예상된 실패는 값 반환(std::optional/expected)으로,', W*0.05, H*0.90);
        ctx.fillText('드물고 예외적인 실패나 생성자 실패는 예외로 — 상황에 맞게 고릅니다.', W*0.05, H*0.945);
      }

      E.tapHint(W/2, H*0.96, '화면 탭 = noexcept 의미 ↔ 예외 vs 오류코드 비교', true);
      E.big('noexcept · 예외를 언제 쓰나', 'noexcept는 “이 함수는 절대 예외를 던지지 않는다”는 강한 선언입니다. 어기고 던지면 스택 풀기도 없이 std::terminate()가 프로그램을 즉시 끝냅니다 — 그러니 함부로 붙이지 말고, 확실할 때만. 대신 붙이면 컴파일러가 예외 전파 코드를 지워 더 빠르고, 무엇보다 이동 연산이 noexcept면 std::vector가 커질 때 복사 대신 이동을 골라 성능이 껑충 뜁니다. 소멸자·swap·이동 연산은 관례상 noexcept죠. 그럼 예외 자체는 언제? 반환값을 무시할 수 있는 오류코드와 달리 예외는 무시할 수 없고, 오류 처리를 정상 로직과 깔끔히 분리하며, 반환값을 낼 수 없는 생성자의 실패도 자연스럽게 알립니다. 다만 흔하고 예상되는 실패(파일 없음, 파싱 실패)는 std::optional·expected 같은 값 반환이 더 정직할 때가 많습니다 — 예외는 “예외적인” 일에.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
