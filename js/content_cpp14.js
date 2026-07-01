/* C++ 제14장 — 스마트 포인터·RAII (RAII · unique_ptr · shared_ptr · weak_ptr · 자원관리 규칙)
   동작(behavior)만. 텍스트=content/cpp14.json. 엔진 js/engine.js 공유. 색: C++=블루(#5ab4e8).
   골든룰: 화면의 모든 값(자원 획득/반납 타임라인·소유 이동·참조 카운트·순환 누수 판정·비교표)은 draw에서 실제로 계산.
   진짜 컴파일 가능한 표준 C++(C++11/14/17) 코드 + 실계산 결과. 윤성우 열혈C++ + Effective C++ 항목13~17 기반. */
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
  function box(ctx,x,y,w,h,col,label,fs,fill){
    roundRect(ctx,x,y,w,h,8); ctx.fillStyle=fill||'rgba(255,255,255,0.05)'; ctx.fill();
    ctx.strokeStyle=col; ctx.lineWidth=1.6; ctx.stroke();
    if(label!=null){ ctx.fillStyle=col; ctx.font='600 '+(fs||13)+'px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(label, x+w/2, y+h/2+1); ctx.textBaseline='alphabetic'; }
  }
  function arrow(ctx,x1,y1,x2,y2,col,dash){ ctx.strokeStyle=col; ctx.lineWidth=1.8; if(dash)ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); ctx.setLineDash([]);
    var a=Math.atan2(y2-y1,x2-x1); ctx.beginPath(); ctx.moveTo(x2,y2);
    ctx.lineTo(x2-9*Math.cos(a-0.4), y2-9*Math.sin(a-0.4)); ctx.lineTo(x2-9*Math.cos(a+0.4), y2-9*Math.sin(a+0.4)); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }

  var scenes = [

  // ══════════ 1. RAII — 생성자 획득 / 소멸자 반납 ══════════
  { id:'cpp14_01',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(340+this.s.step*60,0.07); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // step 0: 스코프 진입, 1: 생성자=파일 열림(자원 획득), 2: 사용, 3: 스코프 이탈=소멸자=파일 닫힘
      var code=[
        {t:'class FileGuard {', dim:true},
        {t:'    std::FILE* f;', dim:true},
        {t:'  public:', dim:true},
        {t:'    FileGuard(const char* p)', dim:true},
        {t:'      : f(std::fopen(p, "r")) {}   // 획득', hl:'fopen'},
        {t:'    ~FileGuard() { std::fclose(f); } // 반납', hl:'fclose'},
        {t:'};', dim:true},
        {t:'{                        // 스코프 진입', dim:true},
        {t:'    FileGuard g("data.txt");  // 열림', hl:'FileGuard g'},
        {t:'    use(g);                   // 사용', hl:'use(g)'},
        {t:'}                        // 스코프 이탈 → 닫힘', dim:true}
      ];
      var actMap=[7,8,9,10];
      codePanel(E, W*0.04, H*0.10, W*0.50, code, 'raii.cpp', actMap[s.step]);

      // 우측: 자원 상태 + 획득/반납 타임라인
      var bx=W*0.58, ty=H*0.16;
      var open=(s.step>=1 && s.step<=2);   // 자원(파일) 열려 있는가
      var freed=(s.step>=3);
      ctx.textAlign='center';
      // 자원 아이콘
      var rcol = open?GRN:(freed?RED:DIM);
      box(ctx, bx+W*0.10, ty, W*0.16, 46, rcol, null, 0, open?'rgba(126,224,176,0.12)':'rgba(255,255,255,0.03)');
      ctx.fillStyle=rcol; ctx.font='600 13px sans-serif';
      ctx.fillText(open?'파일 OPEN':(freed?'CLOSED':'—'), bx+W*0.18, ty+27);

      // 타임라인
      var tlY=ty+90, tlX=bx, tlW=W*0.34;
      ctx.strokeStyle=DIM; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(tlX, tlY); ctx.lineTo(tlX+tlW, tlY); ctx.stroke();
      var marks=[['{ 진입',0.05,DIM,0],['생성자\n(획득)',0.30,GRN,1],['사용',0.58,CPB,2],['} 이탈\n소멸자(반납)',0.90,RED,3]];
      for(var i=0;i<marks.length;i++){ var mx=tlX+tlW*marks[i][1], on=(s.step>=marks[i][3]);
        ctx.fillStyle=on?marks[i][2]:DIM; ctx.beginPath(); ctx.arc(mx, tlY, on?6:4, 0, 7); ctx.fill();
        var lines2=marks[i][0].split('\n');
        ctx.font='11px sans-serif'; ctx.textAlign='center';
        for(var k=0;k<lines2.length;k++) ctx.fillText(lines2[k], mx, tlY+22+k*14);
      }
      // 자원 보유 구간(획득~반납)을 초록 띠로
      var aX=tlX+tlW*0.30, bX=tlX+tlW*0.90;
      var holdEnd = s.step>=3 ? bX : (s.step>=1 ? tlX+tlW*(0.30+(s.step-1)*0.30) : aX);
      if(s.step>=1){ ctx.strokeStyle=GRN; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(aX, tlY-14); ctx.lineTo(holdEnd, tlY-14); ctx.stroke();
        ctx.fillStyle=GRN; ctx.font='10.5px sans-serif'; ctx.fillText('자원 보유 구간', (aX+bX)/2, tlY-20); }

      // 상태 캡션
      var caps=['블록 { 에 진입 — 아직 자원 없음',
                '생성자 실행: fopen()으로 파일 획득(OPEN)',
                'g 사용 중 — 자원은 g의 수명에 묶임',
                '블록 } 이탈 → 소멸자 자동 호출 → fclose()(반납)'];
      ctx.fillStyle=(s.step>=3?RED:(s.step>=1?GRN:CPD)); ctx.font='600 13px sans-serif'; ctx.textAlign='left';
      ctx.fillText(caps[s.step], W*0.05, H*0.80);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif';
      ctx.fillText('return이든, 예외든, 어떤 경로로 블록을 나가도 소멸자는 반드시 불립니다.', W*0.05, H*0.86);
      if(s.step>=3){ ctx.fillStyle=GLD; ctx.font='600 12.5px sans-serif';
        ctx.fillText('“획득 = 초기화, 반납 = 소멸” — 자원 수명을 객체 수명에 못 박는 것이 RAII입니다.', W*0.05, H*0.92); }

      E.tapHint(W/2, H*0.96, '화면 탭 = 다음 (진입 → 획득 → 사용 → 반납)', true);
      E.big('RAII — 자원의 수명을 객체에 묶다', 'C의 오랜 골칫거리: fopen 했으면 fclose, new 했으면 delete, lock 했으면 unlock — 짝을 손으로 맞춰야 하고, 중간에 return이나 예외가 튀면 그 뒷정리를 잊어 자원이 샙니다. C++의 해답은 우아합니다. 자원을 객체가 “소유”하게 하고, 생성자에서 획득·소멸자에서 반납하는 것 — 이것이 RAII(Resource Acquisition Is Initialization)입니다. 그러면 그 객체가 스코프를 벗어나는 순간, 언어가 소멸자를 자동으로 불러 뒷정리를 해 줍니다. return으로 나가든, 예외로 나가든, 심지어 열 갈래로 나가든 예외 없이. 파일·락·소켓·메모리… 모든 자원을 이 한 원리로 다스립니다. 스마트 포인터는 바로 이 RAII를 “메모리”에 적용한 표준 도구입니다.'); }
  },

  // ══════════ 2. unique_ptr — 독점 소유·이동 ══════════
  { id:'cpp14_02',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(340+this.s.step*60,0.07); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // step 0: p가 자원 소유, 1: 복사 시도=컴파일 에러, 2: std::move, 3: q가 소유·p는 비었고 스코프 끝=해제
      var code=[
        {t:'auto p = std::make_unique<int>(5);', hl:'make_unique'},
        {t:'                    // p 가 소유', dim:true},
        {t:'auto q = p;         // ✗ 복사 불가!', hl:'p;'},
        {t:'                    // (컴파일 에러)', dim:true},
        {t:'auto q = std::move(p);  // 소유권 이동', hl:'std::move'},
        {t:'// 이제 q 가 소유, p 는 nullptr', dim:true},
        {t:'*q += 1;            // q 로 접근', hl:'*q'},
        {t:'}  // q 소멸 → delete 자동', dim:true}
      ];
      var actMap=[0,2,4,7];
      codePanel(E, W*0.04, H*0.11, W*0.50, code, 'unique_ptr.cpp', actMap[s.step]);

      // 우측: 소유자 p/q + 힙 객체
      var bx=W*0.58, ty=H*0.18, heapX=bx+W*0.20, heapY=ty+90;
      // 힙 객체
      var val = (s.step>=3)?6:5;
      var alive = (s.step<3);   // step3 마지막에 해제되지만, 이동 후 살아 있다가 스코프 끝에 해제 — 여기선 step3 표시 시점=q소유,값6
      // 힙 노드
      box(ctx, heapX, heapY, W*0.14, 40, alive?GRN:RED, 'int = '+val, 13, alive?'rgba(126,224,176,0.10)':'rgba(240,136,138,0.10)');
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('힙(heap)', heapX+W*0.07, heapY-8);

      // p 소유자
      var pOwns = (s.step<=1);
      box(ctx, bx, ty, W*0.13, 34, pOwns?CPB:DIM, 'p', 13, pOwns?'rgba(90,180,232,0.10)':'rgba(255,255,255,0.03)');
      // q 소유자
      var qOwns = (s.step>=2);
      box(ctx, bx, ty+180, W*0.13, 34, qOwns?CPB:DIM, 'q', 13, qOwns?'rgba(90,180,232,0.10)':'rgba(255,255,255,0.03)');

      // 소유 화살표
      if(pOwns) arrow(ctx, bx+W*0.13, ty+17, heapX, heapY+20, CPB);
      if(qOwns) arrow(ctx, bx+W*0.13, ty+197, heapX, heapY+20, CPB);

      // 상태 캡션
      var caps=['make_unique<int>(5) — p 가 힙 객체를 홀로 소유',
                'auto q = p; 는 컴파일 에러 — unique_ptr은 복사 불가',
                'std::move(p) — 소유권이 p 에서 q 로 넘어감',
                'p 는 nullptr, q 가 소유. 블록 끝에서 q 가 delete'];
      ctx.textAlign='left';
      if(s.step===1){ ctx.fillStyle=RED; ctx.font='600 13px sans-serif';
        ctx.fillText('✗ 복사 불가: 소유자가 둘이면 delete가 두 번 → 금지', W*0.05, H*0.78); }
      else { ctx.fillStyle=(s.step>=2?GRN:CPD); ctx.font='600 13px sans-serif';
        ctx.fillText(caps[s.step], W*0.05, H*0.78); }
      ctx.fillStyle=DIM; ctx.font='12px sans-serif';
      ctx.fillText('unique_ptr = "이 자원의 주인은 딱 하나". 복사는 막고, 이동(move)만 허용합니다.', W*0.05, H*0.84);
      ctx.fillText('크기·비용이 raw 포인터와 같아 사실상 공짜 — 기본으로 unique_ptr을 쓰세요.', W*0.05, H*0.90);

      E.tapHint(W/2, H*0.96, '화면 탭 = 다음 (소유 → 복사 금지 → move → 해제)', true);
      E.big('unique_ptr — 홀로 소유하고, 넘겨주다', '가장 흔하고 가장 가벼운 스마트 포인터입니다. std::make_unique<T>(...)로 힙 객체를 만들면, 그 unique_ptr 하나만이 객체의 “유일한 주인”이 됩니다. 주인이 스코프를 벗어나면 자동으로 delete — new/delete를 손으로 짝맞출 필요가 사라지죠. 핵심 규칙은 “주인은 하나”이므로 복사가 금지된다는 것. auto q = p;는 컴파일조차 되지 않습니다(둘 다 소멸하며 같은 메모리를 두 번 지울 테니까). 대신 std::move(p)로 소유권을 넘길 수 있습니다 — 이사하듯 열쇠를 건네고 p는 빈손(nullptr)이 되죠. 함수가 소유권을 넘겨받거나 반환할 때도 unique_ptr을 값으로 주고받으면 됩니다. 크기가 raw 포인터와 같고 런타임 비용이 사실상 0이라, “동적 객체엔 일단 unique_ptr”이 현대 C++의 기본값입니다.'); }
  },

  // ══════════ 3. shared_ptr — 참조 카운트 공유 소유 ══════════
  { id:'cpp14_03',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; E.blip(340+this.s.step*50,0.07); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // step 0: a 생성 count=1, 1: b=a count=2, 2: c=a count=3, 3: c 스코프 끝 count=2, 4: a,b 끝 count=0 → 해제
      // 실제로 소유자 목록을 계산해 카운트를 셈
      var owners;                 // 현재 살아 있는 shared_ptr 이름들
      if(s.step===0) owners=['a'];
      else if(s.step===1) owners=['a','b'];
      else if(s.step===2) owners=['a','b','c'];
      else if(s.step===3) owners=['a','b'];
      else owners=[];
      var count=owners.length;    // use_count() 실측
      var freed=(count===0);

      var code=[
        {t:'auto a = std::make_shared<Node>();', hl:'make_shared'},
        {t:'// a.use_count() == 1', dim:true},
        {t:'{ auto b = a;   // 공유', hl:'b = a'},
        {t:'  auto c = a;   // 공유', hl:'c = a'},
        {t:'  // use_count() == 3', dim:true},
        {t:'}  // c 소멸 → count 감소', hl:'}'},
        {t:'// b 는 위 블록 밖? (여기선 함께)', dim:true},
        {t:'// 마지막 a 소멸 → count 0 → delete', dim:true}
      ];
      var actMap=[0,2,3,5,7];
      codePanel(E, W*0.04, H*0.11, W*0.50, code, 'shared_ptr.cpp', actMap[s.step]);

      // 우측: 여러 소유자 → 한 객체 + 카운트
      var bx=W*0.56, ty=H*0.16, objX=bx+W*0.22, objY=ty+70;
      // 객체 + 제어블록(카운트)
      box(ctx, objX, objY, W*0.16, 46, freed?RED:GRN, freed?'해제됨':'Node', 13, freed?'rgba(240,136,138,0.10)':'rgba(126,224,176,0.10)');
      // 카운트 배지
      box(ctx, objX+W*0.055, objY+52, W*0.05, 26, freed?RED:GLD, 'cnt '+count, 12, 'rgba(255,211,122,0.12)');

      // 소유자 3개(a,b,c) 자리 고정, 현재 소유 여부로 활성
      var names=['a','b','c'], ys=[ty, ty+50, ty+100];
      for(var i=0;i<3;i++){ var nm=names[i], on=(owners.indexOf(nm)>=0);
        box(ctx, bx, ys[i], W*0.11, 32, on?CPB:DIM, 'shared '+nm, 11.5, on?'rgba(90,180,232,0.10)':'rgba(255,255,255,0.03)');
        if(on && !freed) arrow(ctx, bx+W*0.11, ys[i]+16, objX, objY+23, CPB);
      }

      // 카운트 히스토리 막대
      var hx=W*0.05, hy=H*0.72;
      ctx.textAlign='left'; ctx.fillStyle=DIM; ctx.font='12px sans-serif';
      ctx.fillText('use_count() 변화: 1 → 2 → 3 → 2 → 0', hx, hy);
      var seq=[1,2,3,2,0], bw=26, gap=10;
      for(i=0;i<seq.length;i++){ var on2=(i<=s.step), bx2=hx+i*(bw+gap);
        var bh=8+seq[i]*10;
        ctx.fillStyle=on2?(seq[i]===0?RED:CPB):'rgba(255,255,255,0.06)';
        ctx.fillRect(bx2, hy+50-bh, bw, bh);
        ctx.fillStyle=on2?'#dfeaf2':DIM; ctx.font='600 11px sans-serif'; ctx.textAlign='center'; ctx.fillText(seq[i], bx2+bw/2, hy+64);
      }
      ctx.textAlign='left';
      var caps=['a 생성 — use_count() = 1',
                'b = a 복사 — 같은 객체 공유, count = 2',
                'c = a 복사 — count = 3 (셋이 한 객체를 가리킴)',
                'c 소멸 → count = 2 (아직 살아 있음)',
                '마지막 소유자 소멸 → count = 0 → 이때 delete'];
      ctx.fillStyle=(freed?RED:GRN); ctx.font='600 13px sans-serif';
      ctx.fillText(caps[s.step], W*0.05, H*0.90);

      E.tapHint(W/2, H*0.96, '화면 탭 = 다음 (count 1 → 2 → 3 → 2 → 0 해제)', true);
      E.big('shared_ptr — 여럿이 나눠 소유하다', '한 객체를 여러 곳에서 함께 써야 할 때가 있습니다 — 그래프 노드, 캐시된 자원, 관찰자들. unique_ptr의 “주인 하나” 규칙으론 곤란하죠. shared_ptr은 복사할 때마다 뒤에 숨은 참조 카운트를 하나 올리고, 소멸할 때마다 하나 내립니다. 그리고 카운트가 정확히 0이 되는 순간 — 마지막 소유자가 사라질 때 — 객체를 delete합니다. 화면의 카운트는 실제로 살아 있는 소유자 수를 세어 표시한 값입니다. 편리하지만 공짜는 아닙니다: 제어 블록을 위한 원자적 카운트 증감이 unique_ptr보다 무겁고, 만든 방법은 make_shared가 객체와 제어블록을 한 번에 할당해 더 빠릅니다. “정말 공유가 필요할 때만 shared_ptr, 아니면 unique_ptr”이 원칙입니다.'); }
  },

  // ══════════ 4. weak_ptr — 순환 참조 끊기 ══════════
  { id:'cpp14_04',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(360+this.s.step*90,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var leak=(s.step===0);  // step0=순환(누수), step1=weak_ptr(해결)
      var code = leak ? [
        {t:'struct Node {', dim:true},
        {t:'    std::shared_ptr<Node> next;', hl:'shared_ptr'},
        {t:'    std::shared_ptr<Node> prev; // ✗', hl:'shared_ptr'},
        {t:'};', dim:true},
        {t:'a->next = b;  b->prev = a;', hl:'b->prev = a'},
        {t:'// a,b 지역변수 소멸해도...', dim:true},
        {t:'// 서로가 서로를 붙잡아 count>0', dim:true},
        {t:'// → 절대 delete 안 됨 (메모리 누수)', dim:true}
      ] : [
        {t:'struct Node {', dim:true},
        {t:'    std::shared_ptr<Node> next;', hl:'shared_ptr'},
        {t:'    std::weak_ptr<Node>   prev; // ✓', hl:'weak_ptr'},
        {t:'};', dim:true},
        {t:'a->next = b;  b->prev = a;', hl:'weak_ptr'},
        {t:'// weak 는 count 를 올리지 않음', dim:true},
        {t:'// 접근 시 auto p = w.lock();', hl:'.lock()'},
        {t:'// a,b 소멸 → count 0 → 정상 해제', dim:true}
      ];
      codePanel(E, W*0.04, H*0.12, W*0.50, code, leak?'cycle_leak.cpp':'weak_ptr_fix.cpp', 4);

      // 우측: 두 노드 A,B 상호 참조
      var bx=W*0.60, ay=H*0.24, byy=H*0.50, nw=W*0.13;
      box(ctx, bx, ay, nw, 40, leak?RED:GRN, 'Node A', 13, leak?'rgba(240,136,138,0.08)':'rgba(126,224,176,0.08)');
      box(ctx, bx, byy, nw, 40, leak?RED:GRN, 'Node B', 13, leak?'rgba(240,136,138,0.08)':'rgba(126,224,176,0.08)');
      // A.next → B (항상 shared, 실선)
      arrow(ctx, bx+nw*0.35, ay+40, bx+nw*0.35, byy, CPB);
      ctx.fillStyle=CPB; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('next (shared)', bx+nw*0.4, (ay+byy)/2);
      // B.prev → A (shared=실선 빨강 / weak=점선 초록)
      if(leak){ arrow(ctx, bx+nw*0.75, byy, bx+nw*0.75, ay+40, RED);
        ctx.fillStyle=RED; ctx.font='11px sans-serif'; ctx.fillText('prev (shared) ✗', bx+nw*0.8, (ay+byy)/2+16); }
      else { arrow(ctx, bx+nw*0.75, byy, bx+nw*0.75, ay+40, GRN, [5,4]);
        ctx.fillStyle=GRN; ctx.font='11px sans-serif'; ctx.fillText('prev (weak) ✓', bx+nw*0.8, (ay+byy)/2+16); }

      // 카운트 표시(실측): shared 순환이면 각 노드 count=2, weak면 A:1 B:1 → 0 가능
      var cA = leak ? 2 : 1, cB = leak ? 2 : 1;
      ctx.textAlign='center'; ctx.fillStyle=leak?RED:GRN; ctx.font='11px sans-serif';
      ctx.fillText('use_count '+cA, bx+nw+42, ay+22);
      ctx.fillText('use_count '+cB, bx+nw+42, byy+22);

      // 판정
      ctx.textAlign='left';
      if(leak){ ctx.fillStyle=RED; ctx.font='600 14px sans-serif';
        ctx.fillText('순환 참조 → 지역 a,b 가 사라져도 count가 1 밑으로 안 내려감', W*0.05, H*0.78);
        ctx.fillStyle=RED; ctx.font='12.5px sans-serif';
        ctx.fillText('서로가 서로를 붙잡아 영원히 count>0 → delete 불가 → 메모리 누수', W*0.05, H*0.85); }
      else { ctx.fillStyle=GRN; ctx.font='600 14px sans-serif';
        ctx.fillText('한쪽을 weak_ptr로 → 소유권 없이 "관찰"만, count 안 올림', W*0.05, H*0.78);
        ctx.fillStyle=GRN; ctx.font='12.5px sans-serif';
        ctx.fillText('a,b 소멸 → 강한 참조 0 → 정상 해제. 쓸 땐 w.lock()으로 유효성 확인', W*0.05, H*0.85); }
      ctx.fillStyle=DIM; ctx.font='12px sans-serif';
      ctx.fillText('규칙: 소유는 shared_ptr, 되돌아가는(비소유) 참조는 weak_ptr — 사이클을 끊습니다.', W*0.05, H*0.92);

      E.tapHint(W/2, H*0.96, '화면 탭 = 순환 참조 누수 ↔ weak_ptr 해결', true);
      E.big('weak_ptr — 붙잡지 않고 지켜보다', 'shared_ptr에도 함정이 있습니다. 두 객체가 shared_ptr로 서로를 가리키면 — 부모↔자식, 노드↔노드 — 각자의 참조 카운트가 서로 때문에 절대 0이 되지 않습니다. 바깥의 지역 변수가 다 사라져도, 둘이 서로의 손을 꽉 잡고 있어 아무도 delete되지 못하죠. 이것이 순환 참조로 인한 메모리 누수입니다. 해법은 weak_ptr: “나는 이 객체를 관찰하되 소유하진 않는다”. weak_ptr은 참조 카운트를 올리지 않아 사이클을 끊습니다. 대신 소유하지 않으니 그 객체가 아직 살아 있는지 보장할 수 없어, 접근할 땐 w.lock()으로 잠깐 shared_ptr을 얻어 유효한지 확인하고 씁니다(죽었으면 nullptr). 규칙은 간단합니다 — 소유 방향은 shared_ptr, 되돌아 가리키는 비소유 방향은 weak_ptr.'); }
  },

  // ══════════ 5. 자원관리 규칙 — raw new/delete vs 스마트 포인터 (Effective 13~17) ══════════
  { id:'cpp14_05',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(360+this.s.step*90,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code = (s.step===0) ? [
        {t:'// ✗ 옛 방식: 손으로 짝맞추기', dim:true},
        {t:'Widget* w = new Widget();', hl:'new Widget()'},
        {t:'process(w);        // 예외 나면?', hl:'process(w)'},
        {t:'delete w;          // ← 도달 못 할 수', hl:'delete w'},
        {t:'                   //   있음 → 누수!', dim:true},
        {t:'', dim:true},
        {t:'// ✓ 현대 방식: 스마트 포인터', dim:true},
        {t:'auto w = std::make_unique<Widget>();', hl:'make_unique'},
        {t:'process(*w);   // 예외 나도 자동 delete', hl:'*w'}
      ] : [
        {t:'// 규칙 요약 (Effective C++ 13~17)', dim:true},
        {t:'// 소유 → make_unique / make_shared', hl:'make_unique'},
        {t:'auto a = std::make_unique<T>(args);', hl:'make_unique'},
        {t:'auto b = std::make_shared<T>(args);', hl:'make_shared'},
        {t:'', dim:true},
        {t:'// 매개변수는 스마트 포인터로 명확히', dim:true},
        {t:'void take(std::unique_ptr<T> p); //소유이전', hl:'unique_ptr'},
        {t:'void use (const T& r);           //비소유', hl:'const T&'},
        {t:'// new/delete 를 직접 쓰지 말라', hl:'new/delete'}
      ];
      codePanel(E, W*0.04, H*0.11, W*0.50, code, s.step===0?'why_smart.cpp':'rules.cpp');

      if(s.step===0){
        // raw vs smart 대비표
        var bx=W*0.56, ty=H*0.15, cw=W*0.19, rh=36;
        var rows=[
          ['짝맞추기','new ↔ delete 손수','획득=소멸 자동'],
          ['예외 발생 시','delete 건너뛰어 누수','스코프 이탈=자동 해제'],
          ['이중 해제','실수로 delete 두 번','소유 규칙이 방지'],
          ['소유권','포인터만 봐선 불명확','타입이 소유를 말함'],
          ['런타임 비용','0','unique=0, shared=약간']
        ];
        ctx.textAlign='center';
        box(ctx, bx, ty, cw, rh, DIM, '측면', 12, 'rgba(255,255,255,0.04)');
        box(ctx, bx+cw, ty, cw, rh, RED, 'raw new/delete', 12, 'rgba(240,136,138,0.10)');
        box(ctx, bx+cw*2, ty, cw, rh, GRN, '스마트 포인터', 12, 'rgba(126,224,176,0.10)');
        for(var r=0;r<rows.length;r++){ var y=ty+rh*(r+1);
          box(ctx, bx, y, cw, rh, DIM, null, 0, 'rgba(255,255,255,0.02)');
          ctx.fillStyle='#dfeaf2'; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText(rows[r][0], bx+cw/2, y+rh/2+4);
          box(ctx, bx+cw, y, cw, rh, 'rgba(240,136,138,0.4)', null, 0, 'rgba(255,255,255,0.02)');
          ctx.fillStyle=RED; ctx.font='10.5px sans-serif'; ctx.fillText(rows[r][1], bx+cw+cw/2, y+rh/2+4);
          box(ctx, bx+cw*2, y, cw, rh, 'rgba(126,224,176,0.4)', null, 0, 'rgba(255,255,255,0.02)');
          ctx.fillStyle=GRN; ctx.font='10.5px sans-serif'; ctx.fillText(rows[r][2], bx+cw*2+cw/2, y+rh/2+4); }
        ctx.textAlign='left'; ctx.fillStyle=GLD; ctx.font='600 12.5px sans-serif';
        ctx.fillText('같은 코드라도 예외가 나면 raw는 누수, 스마트는 안전 — 위험이 다릅니다.', W*0.05, H*0.90);
      } else {
        // 규칙 카드 목록
        var bx=W*0.56, ty=H*0.15;
        var rules=[
          ['자원은 객체에 담아라','생성=획득, 소멸=반납 (RAII)', CPB],
          ['소유엔 스마트 포인터','기본 unique_ptr, 공유 필요시 shared_ptr', GRN],
          ['make_ 함수를 써라','make_unique·make_shared (예외 안전·간결)', GLD],
          ['new/delete 직접 금지','손 짝맞추기 = 버그의 온상', RED],
          ['소유·비소유를 타입으로','넘기면 unique_ptr, 빌려주면 참조/포인터', BLU]
        ];
        for(var i=0;i<rules.length;i++){ var y=ty+i*52;
          box(ctx, bx, y, W*0.36, 44, rules[i][2], null, 0, 'rgba(255,255,255,0.03)');
          ctx.fillStyle=rules[i][2]; ctx.font='600 12.5px sans-serif'; ctx.textAlign='left';
          ctx.fillText((i+1)+'. '+rules[i][0], bx+12, y+18);
          ctx.fillStyle='#dfeaf2'; ctx.font='11.5px sans-serif'; ctx.fillText(rules[i][1], bx+12, y+36); }
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('이 규칙만 지키면 C++ 메모리 문제의 태반은 애초에 생기지 않습니다.', W*0.05, H*0.92);
      }

      E.tapHint(W/2, H*0.96, '화면 탭 = raw vs 스마트 대비 ↔ 규칙 요약', true);
      E.big('자원관리 규칙 — new를 직접 쓰지 마라 (Effective 13~17)', '이 장의 결론은 한 문장으로 압축됩니다: “동적 자원은 손으로 관리하지 말고, 관리 객체에게 맡겨라.” new Widget() 뒤에 delete를 손수 적는 순간, 그 사이에서 예외가 튀거나 이른 return이 끼면 delete는 실행되지 못하고 메모리가 샙니다. 스마트 포인터는 이 짝맞추기를 언어에 위임합니다 — make_unique/make_shared로 만들면, 어떤 경로로 스코프를 나가든 소멸자가 반드시 정리하죠. 기본은 unique_ptr(비용 0), 정말 공유가 필요할 때만 shared_ptr, 되돌아 가리키는 참조는 weak_ptr. new/delete를 코드에서 거의 볼 일이 없어지는 것이 잘 쓴 현대 C++의 표식입니다. 함수 시그니처도 정직해집니다: 소유권을 넘기면 unique_ptr을 값으로, 잠깐 빌려줄 뿐이면 참조나 raw 포인터로 — 타입만 봐도 “누가 이 자원의 주인인지”가 드러나니까요.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
