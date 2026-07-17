/* 파이썬 제3장 — 제어흐름과 함수: if/elif/else · for · while+break/continue · def · lambda·고차함수
   동작(behavior)만. 텍스트=content/py3.json. 엔진 js/engine.js 공유. 색: Python=골드/노랑 테마.
   골든룰: 화면에 표시되는 모든 출력값(등급·누적합·반환값·변환결과)은 전부 JS에서 실제로 계산한 값(베껴 박지 않음).
   왼쪽=진짜 파이썬 코드(줄커서 강조), 오른쪽=실제 실행 흐름/출력 시각화. 들여쓰기로 블록을 잡는 파이썬 특징을 강조. */
(function(){
  var PYL='#ffd343', PYB='#6cb6e8', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', PNK='#f4a0c0', DIM='#9b99a3', RED='#f0888a';

  function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  // 들여쓰기를 살린 코드 패널. lines=[{t,ind,act,com}] — ind=들여쓰기 깊이(블록 시각화), act=현재 실행 줄, com=주석.
  // act줄은 노란 막대+밝은 글씨로 '실행 줄 커서'를 표현한다(파이썬은 들여쓰기로 블록을 잡으므로 가이드라인도 그린다).
  function codePanel(E, x, y, w, lines, title, actLine){
    var ctx=E.ctx, lh=22, pad=14, top=y, n=lines.length, ht=n*lh+pad*2+(title?26:0);
    ctx.fillStyle='rgba(255,255,255,0.035)'; ctx.strokeStyle='rgba(255,211,67,0.30)'; ctx.lineWidth=1;
    roundRect(ctx,x,top,w,ht,10); ctx.fill(); ctx.stroke();
    var cy=top+pad+(title?26:0);
    if(title){ ctx.fillStyle=PYL; ctx.font='600 12px sans-serif'; ctx.textAlign='left'; ctx.fillText(title, x+pad, top+pad+12); }
    var indW=18;
    for(var i=0;i<n;i++){
      var L=lines[i], t=L.t||'', ind=L.ind||0, ty=cy+i*lh+15, lx=x+pad+ind*indW;
      var isAct=(actLine!=null && i===actLine);
      if(isAct){ ctx.fillStyle='rgba(255,211,67,0.16)'; ctx.fillRect(x+4, cy+i*lh+2, w-8, lh-2);
        ctx.fillStyle=PYL; ctx.fillRect(x+4, cy+i*lh+2, 3, lh-2); }
      // 들여쓰기 가이드라인(블록 = 들여쓰기)
      for(var g=0; g<ind; g++){ ctx.strokeStyle='rgba(255,211,67,0.13)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(x+pad+g*indW+2, cy+i*lh+1); ctx.lineTo(x+pad+g*indW+2, cy+i*lh+lh-1); ctx.stroke(); }
      ctx.font='13px ui-monospace,Menlo,Consolas,monospace'; ctx.textAlign='left';
      // 주석 분리 색
      var ci=t.indexOf('#');
      if(ci>=0 && !L.nocom){
        var code=t.slice(0,ci), com=t.slice(ci);
        ctx.fillStyle=isAct?'#fff7df':(L.dim?DIM:'#f0e7cf'); ctx.fillText(code, lx, ty);
        var cw=ctx.measureText(code).width;
        ctx.fillStyle=DIM; ctx.fillText(com, lx+cw, ty);
      } else {
        ctx.fillStyle=isAct?'#fff7df':(L.dim?DIM:'#f0e7cf'); ctx.fillText(t, lx, ty);
      }
    }
    return top+ht;
  }

  function chip(ctx,x,y,w,h,txt,fill,stroke,tcol,fs){
    ctx.fillStyle=fill||'rgba(255,255,255,0.04)'; ctx.strokeStyle=stroke||'rgba(255,255,255,0.14)'; ctx.lineWidth=1.4;
    roundRect(ctx,x,y,w,h,7); ctx.fill(); ctx.stroke();
    if(txt!=null){ ctx.fillStyle=tcol||'#f0e7cf'; ctx.font='600 '+(fs||13)+'px ui-monospace,Menlo,monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(''+txt, x+w/2, y+h/2+1); ctx.textBaseline='alphabetic'; }
  }
  function cell(ctx,x,y,w,h,txt,fill,stroke,tcol,fs){
    ctx.fillStyle=fill||'rgba(255,255,255,0.04)'; ctx.fillRect(x,y,w,h);
    ctx.strokeStyle=stroke||'rgba(255,255,255,0.12)'; ctx.lineWidth=1; ctx.strokeRect(x,y,w,h);
    if(txt!=null){ ctx.fillStyle=tcol||'#f0e7cf'; ctx.font=(fs||13)+'px ui-monospace,Menlo,monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(''+txt, x+w/2, y+h/2+1); ctx.textBaseline='alphabetic'; }
  }

  var scenes = [

  // ══════════ 1. if / elif / else — 들여쓰기 블록 · 분기 판정(점수→등급) ══════════
  { id:'py3_01',
    enter:function(E){ var self=this; this.s={score:78};
      E.controls('<div class="ctrl"><label>점수 score</label><input type="range" id="sc" min="0" max="100" step="1" value="78"><output id="sco">78</output></div>');
      E.bind('#sc','input',function(e){ self.s.score=+e.target.value; document.getElementById('sco').textContent=e.target.value; E.blip(360,0.05); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, sc=s.score;
      // 실제 판정 — 화면 등급은 JS가 계산
      var grade, gi;
      if(sc>=90){ grade='A'; gi=0; } else if(sc>=80){ grade='B'; gi=1; } else if(sc>=70){ grade='C'; gi=2; } else { grade='F'; gi=3; }
      // 코드 줄: 0 헤더, 1 if, 2 print, 3 elif90, 4 print, 5 elif80, 6 print, 7 else, 8 print
      var code=[
        {t:'score = '+sc, ind:0},
        {t:'if score >= 90:', ind:0},
        {t:'grade = "A"', ind:1},
        {t:'elif score >= 80:', ind:0},
        {t:'grade = "B"', ind:1},
        {t:'elif score >= 70:', ind:0},
        {t:'grade = "C"', ind:1},
        {t:'else:', ind:0},
        {t:'grade = "F"   # 어느 분기도 아니면', ind:1},
        {t:'print(grade)', ind:0}
      ];
      // 실행 줄 = 채택된 분기의 대입줄
      var act=[2,4,6,8][gi];
      codePanel(E, W*0.04, H*0.16, W*0.46, code, 'grade.py', act);

      // 우측: 어느 조건이 참인지 사다리로 판정 표시
      var gx=W*0.56, gy=H*0.18, gw=W*0.40;
      ctx.fillStyle=PYL; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('위에서부터 처음 참인 조건 하나만 실행', gx, gy);
      var conds=[ {label:'score ≥ 90', test:sc>=90, g:'A', c:GRN},
        {label:'score ≥ 80', test:sc>=80, g:'B', c:BLU},
        {label:'score ≥ 70', test:sc>=70, g:'C', c:GLD},
        {label:'else (그 외)', test:true, g:'F', c:RED} ];
      var rh=44, ry=gy+18;
      for(var i=0;i<conds.length;i++){
        var c=conds[i], taken=(i===gi), skipped=(i<gi), y=ry+i*(rh+8);
        ctx.globalAlpha = taken?1 : (skipped?0.42:0.7);
        chip(ctx, gx, y, gw, rh, null, taken?'rgba(255,211,67,0.12)':'rgba(255,255,255,0.04)', taken?PYL:c, null);
        ctx.fillStyle=c; ctx.font='600 14px ui-monospace,Menlo,monospace'; ctx.textAlign='left'; ctx.fillText(c.label, gx+12, y+rh/2+5);
        // 판정 결과
        var verdict = taken?'✓ 채택 → grade="'+c.g+'"' : (skipped?'✗ 거짓(통과)':'(검사 안 함)');
        ctx.fillStyle = taken?GRN : (skipped?DIM:DIM); ctx.font='12.5px sans-serif'; ctx.textAlign='right'; ctx.fillText(verdict, gx+gw-12, y+rh/2+5);
        ctx.globalAlpha=1;
      }
      // 결과 배지
      ctx.fillStyle=PYL; ctx.font='600 17px sans-serif'; ctx.textAlign='left'; ctx.fillText('출력', gx, ry+4*(rh+8)+24);
      chip(ctx, gx+44, ry+4*(rh+8)+4, 64, 30, grade, 'rgba(126,224,176,0.12)', GRN, GRN, 18);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText('score='+sc+' → '+grade, gx+118, ry+4*(rh+8)+24);
      E.tapHint(W/2, H*0.95, '슬라이더로 점수를 바꿔 어느 분기를 타는지 보세요', true);
      E.big('if · elif · else — 들여쓰기로 잡는 분기', '파이썬은 중괄호가 없습니다 — 조건문 다음 줄을 <b>들여쓰기</b>한 만큼이 그 블록이죠. 콜론(:)으로 “여기부터 블록” 신호를 주고, 같은 깊이로 줄 맞춘 문장들이 함께 묶입니다. 여러 조건은 <b>위에서부터</b> 검사해 <b>처음 참인 하나</b>만 실행하고 나머지는 건너뜁니다.'); }
  },

  // ══════════ 2. for — range·리스트 순회 · 누적합(실계산) ══════════
  { id:'py3_02',
    enter:function(E){ this.s={k:0, n:5, auto:false}; E.setOn([]); },
    tap:function(E){ var s=this.s; s.k=(s.k+1)%(s.n+1); E.blip(340+s.k*40,0.07); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var arr=[3,1,4,1,5];   // 순회 대상(고정)
      var done=s.k;          // 지금까지 처리한 원소 수(0..n)
      // 누적합 실계산
      var total=0; for(var i=0;i<done;i++) total+=arr[i];
      var cur = done<s.n ? done : null;   // 지금 가리키는 인덱스(끝나면 null)
      // 코드: 0 nums, 1 total=0, 2 for, 3 total+=, 4 print
      var act = done===0 ? 1 : (done<s.n ? 3 : 4);
      var code=[
        {t:'nums = [3, 1, 4, 1, 5]', ind:0},
        {t:'total = 0', ind:0},
        {t:'for i in range(len(nums)):  # 0..4', ind:0},
        {t:'total += nums[i]   # 누적', ind:1},
        {t:'print(total)', ind:0}
      ];
      codePanel(E, W*0.04, H*0.16, W*0.46, code, 'loop_sum.py', act);

      // 우측: 리스트 셀 — 현재 가리키는 칸 강조, 처리 끝난 칸은 채움
      var gx=W*0.56, gy=H*0.20, cw=Math.min(52,W*0.05), ch=42, gap=8;
      ctx.fillStyle=PYL; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('루프가 한 칸씩 이동하며 더해 나갑니다', gx, gy-12);
      for(i=0;i<arr.length;i++){
        var x=gx+i*(cw+gap), processed=(i<done), isCur=(i===cur);
        var fill = isCur?'rgba(255,211,67,0.20)' : (processed?'rgba(126,224,176,0.12)':'rgba(255,255,255,0.04)');
        var stroke = isCur?PYL : (processed?GRN:'rgba(255,255,255,0.18)');
        cell(ctx, x, gy, cw, ch, arr[i], fill, stroke, isCur?PYL:(processed?GRN:'#f0e7cf'), 17);
        ctx.fillStyle=DIM; ctx.font='13px ui-monospace,monospace'; ctx.textAlign='center'; ctx.fillText('['+i+']', x+cw/2, gy+ch+14);
      }
      if(cur!=null){ var ax=gx+cur*(cw+gap)+cw/2; ctx.fillStyle=PYL; ctx.font='600 12px sans-serif'; ctx.textAlign='center'; ctx.fillText('i='+cur+' ▲', ax, gy-2); }
      // 누적 진행 막대 + total
      var by=gy+ch+40;
      ctx.fillStyle='#f0e7cf'; ctx.font='600 15px sans-serif'; ctx.textAlign='left'; ctx.fillText('total = '+total, gx, by);
      // 더해진 항 표시
      var terms=[]; for(i=0;i<done;i++) terms.push(arr[i]);
      ctx.fillStyle=DIM; ctx.font='13px ui-monospace,monospace'; ctx.fillText(done? '= '+terms.join(' + ') : '아직 0 (시작 전)', gx, by+24);
      if(done===s.n){ chip(ctx, gx, by+38, 150, 32, 'print → '+total, 'rgba(126,224,176,0.12)', GRN, GRN, 14);
        ctx.fillStyle=GRN; ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.fillText('✓ 순회 완료 (3+1+4+1+5=14)', gx+165, by+58); }
      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 반복 (i가 한 칸 이동·누적)', true);
      E.big('for 반복 — 컬렉션을 하나씩 훑기', '파이썬의 for는 ‘몇 번 돌까’보다 ‘무엇을 차례로 꺼낼까’에 가깝습니다 — 리스트·문자열·range가 내놓는 값을 하나씩 받아 같은 일을 반복하죠. 여기선 <b>range</b>로 인덱스를 만들어 원소를 더하지만, 보통은 <code>for x in nums:</code>처럼 값 자체를 바로 받습니다. 들여쓴 한 줄이 루프 몸통입니다.'); }
  },

  // ══════════ 3. while · break / continue — 조건 반복(누적 until > N) ══════════
  { id:'py3_03',
    enter:function(E){ this.s={k:0, auto:false};
      // 시뮬레이션: n=1,2,3.. 더해 total>30 되면 break. 짝수는 continue(건너뜀)로 데모.
      var trace=[], total=0, n=0, step=0;
      // 각 step = while 한 바퀴
      while(true){
        n+=1;
        var ev = {n:n, skip:false, brk:false, before:total, after:total};
        if(n%2===0){ ev.skip=true; trace.push(ev); continue; }   // continue: 짝수는 더하지 않고 다음 바퀴
        total+=n; ev.after=total;
        if(total>30){ ev.brk=true; trace.push(ev); break; }       // break: 30 초과면 종료
        trace.push(ev);
        if(n>40) break; // 안전장치
      }
      this.s.trace=trace; E.setOn([]); },
    tap:function(E){ var s=this.s; s.k=(s.k+1)%(s.trace.length+1); E.blip(330+s.k*30,0.07); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, tr=s.trace;
      var shown=s.k;                       // 보여 줄 바퀴 수
      var last = shown>0 ? tr[shown-1] : null;
      var total = last ? last.after : 0;
      var code=[
        {t:'total, n = 0, 0', ind:0},
        {t:'while True:', ind:0},
        {t:'n += 1', ind:1},
        {t:'if n % 2 == 0:', ind:1},
        {t:'continue   # 짝수는 건너뜀', ind:2},
        {t:'total += n', ind:1},
        {t:'if total > 30:', ind:1},
        {t:'break      # 넘으면 종료', ind:2},
        {t:'print(n, total)', ind:0}
      ];
      // act 매핑(continue는 4번줄, total+= 5번줄, break 7번줄, print 8번줄)
      var actLine = shown===tr.length ? 8 : (last? (last.brk?7 : (last.skip?4:5)) : 1);
      codePanel(E, W*0.03, H*0.14, W*0.47, code, 'while_break.py', actLine);

      // 우측: 반복 트레이스 테이블
      var gx=W*0.55, gy=H*0.16, gw=W*0.42;
      ctx.fillStyle=PYL; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('한 바퀴씩 — continue는 건너뛰고, break는 탈출', gx, gy);
      var cols=[ {t:'n', w:40}, {t:'동작', w:gw*0.34}, {t:'total', w:gw*0.28} ];
      var rh=28, hy=gy+14, x0=gx;
      // 헤더
      var cx=x0; for(var c=0;c<cols.length;c++){ cell(ctx,cx,hy,cols[c].w,rh,cols[c].t,'rgba(255,211,67,0.16)',PYL,PYL,12.5); cx+=cols[c].w; }
      for(var r=0;r<shown;r++){ var ev=tr[r]; cx=x0; var y=hy+rh*(r+1);
        var act2 = ev.skip?'continue (짝수)' : (ev.brk?'break! (>30)':'total += '+ev.n);
        var col = ev.skip?DIM : (ev.brk?RED:GRN);
        cell(ctx,cx,y,cols[0].w,rh,ev.n,'rgba(255,255,255,0.04)',null,'#f0e7cf',13); cx+=cols[0].w;
        ctx.fillStyle='rgba(255,255,255,0.03)'; ctx.fillRect(cx,y,cols[1].w,rh); ctx.strokeStyle='rgba(255,255,255,0.12)'; ctx.strokeRect(cx,y,cols[1].w,rh);
        ctx.fillStyle=col; ctx.font='12.5px ui-monospace,monospace'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText(act2, cx+8, y+rh/2+1); ctx.textBaseline='alphabetic'; cx+=cols[1].w;
        cell(ctx,cx,y,cols[2].w,rh, ev.skip?'—':ev.after, 'rgba(255,255,255,0.04)',null, ev.skip?DIM:'#f0e7cf',13);
      }
      // 결과
      var by=hy+rh*(shown+1)+22;
      ctx.fillStyle='#f0e7cf'; ctx.font='600 15px sans-serif'; ctx.textAlign='left'; ctx.fillText('total = '+total, gx, by);
      if(shown===tr.length){ var fin=tr[tr.length-1];
        chip(ctx, gx, by+12, 200, 32, 'print → '+fin.n+', '+fin.after, 'rgba(126,224,176,0.12)', GRN, GRN, 14);
        ctx.fillStyle=GRN; ctx.font='12.5px sans-serif'; ctx.textAlign='left'; ctx.fillText('✓ 1+3+5+7+9+11=36 > 30 에서 멈춤', gx, by+62); }
      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 바퀴 (continue·break 동작 확인)', true);
      E.big('while · break · continue — 조건이 끝낼 때까지', '<b>while</b>은 ‘몇 번’이 아니라 ‘조건이 참인 동안’ 반복합니다. 몸통 안에서 <b>break</b>는 즉시 루프를 <b>탈출</b>하고, <b>continue</b>는 남은 부분을 건너뛰고 <b>다음 바퀴로</b> 점프하죠. 여기선 홀수만 더하다(짝수는 continue) 합이 30을 넘는 순간 break로 멈춥니다 — 끝 조건을 코드가 직접 정합니다.'); }
  },

  // ══════════ 4. def — 인자·기본값·return·*args (호출→반환 흐름) ══════════
  { id:'py3_04',
    enter:function(E){ this.s={step:0, auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(350+this.s.step*60,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, st=s.step;
      var code=[
        {t:'def add(a, b=10):       # b는 기본값 10', ind:0},
        {t:'return a + b', ind:1},
        {t:'', ind:0, dim:true},
        {t:'def total(*args):      # 가변 인자', ind:0},
        {t:'s = 0', ind:1},
        {t:'for x in args:', ind:1},
        {t:'s += x', ind:2},
        {t:'return s', ind:1},
        {t:'', ind:0, dim:true},
        {t:'add(3, 4)     # 둘 다 전달', ind:0},
        {t:'add(3)        # b 생략 → 기본값 10', ind:0},
        {t:'total(1,2,3,4)  # 몇 개든 OK', ind:0}
      ];
      // 강조 줄: step0=add(3,4)호출+return, step1=add(3)기본값, step2=total
      var act = st===0?9 : (st===1?10:11);
      codePanel(E, W*0.04, H*0.14, W*0.48, code, 'functions.py', act);

      var gx=W*0.56, gy=H*0.18, gw=W*0.40;
      ctx.fillStyle=PYL; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('호출 → 인자 바인딩 → return 값', gx, gy);
      var callTxt, bind, ret, expl;
      if(st===0){ callTxt='add(3, 4)'; bind=['a = 3','b = 4']; ret = 3+4; expl='두 인자를 모두 전달'; }
      else if(st===1){ callTxt='add(3)'; bind=['a = 3','b = 10  (기본값 사용)']; ret = 3+10; expl='b를 생략 → 정의의 기본값 10'; }
      else { callTxt='total(1, 2, 3, 4)'; bind=['args = (1, 2, 3, 4)']; ret = 1+2+3+4; expl='*args가 남는 인자를 튜플로 모음'; }
      // 호출 박스
      var y=gy+18;
      chip(ctx, gx, y, gw, 36, null, 'rgba(108,182,232,0.10)', PYB, null);
      ctx.fillStyle=PYB; ctx.font='600 15px ui-monospace,Menlo,monospace'; ctx.textAlign='left'; ctx.fillText(callTxt, gx+14, y+23);
      // 화살표 ↓
      ctx.strokeStyle='rgba(255,255,255,0.30)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(gx+gw/2,y+36); ctx.lineTo(gx+gw/2,y+58); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(gx+gw/2-5,y+52); ctx.lineTo(gx+gw/2,y+58); ctx.lineTo(gx+gw/2+5,y+52); ctx.fillStyle='rgba(255,255,255,0.30)'; ctx.fill();
      // 바인딩 박스
      var y2=y+60;
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('함수 안에서 인자가 이렇게 묶입니다:', gx, y2-4);
      for(var i=0;i<bind.length;i++){ var by=y2+8+i*30;
        chip(ctx, gx, by, gw, 26, null, 'rgba(255,211,67,0.08)', 'rgba(255,211,67,0.5)', null);
        ctx.fillStyle=PYL; ctx.font='13px ui-monospace,Menlo,monospace'; ctx.textAlign='left'; ctx.fillText(bind[i], gx+12, by+18); }
      // 반환
      var y3=y2+8+bind.length*30+14;
      ctx.fillStyle='#f0e7cf'; ctx.font='600 15px sans-serif'; ctx.textAlign='left'; ctx.fillText('return →', gx, y3+18);
      chip(ctx, gx+86, y3, 70, 32, ret, 'rgba(126,224,176,0.14)', GRN, GRN, 18);
      ctx.fillStyle=GRN; ctx.font='600 13px sans-serif'; ctx.fillText(callTxt+' == '+ret, gx, y3+56);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText(expl, gx, y3+78);
      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 호출 (전달 → 기본값 → *args)', true);
      E.big('def 함수 — 입력을 받아 값을 돌려준다', '<b>def</b>로 한 번 정의해 두면, 같은 일을 이름 하나로 반복 호출할 수 있습니다. 매개변수에 <b>기본값</b>(b=10)을 주면 인자를 생략해도 동작하고, <b>*args</b>는 개수가 정해지지 않은 인자를 튜플로 모읍니다. 결과는 <b>return</b>으로 돌려주죠 — <code>add(3,4)</code>를 부르면 함수 안 a·b가 묶이고, a+b가 계산되어 7이 나옵니다.'); }
  },

  // ══════════ 5. lambda · 고차함수 — map / filter / sorted(key=) (실변환) ══════════
  { id:'py3_05',
    enter:function(E){ this.s={step:0, auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, st=s.step;
      var base=[1,2,3,4,5];
      var code=[
        {t:'square = lambda x: x*x   # 익명 함수', ind:0},
        {t:'nums = [1, 2, 3, 4, 5]', ind:0},
        {t:'', ind:0, dim:true},
        {t:'list(map(square, nums))      # 변환', ind:0},
        {t:'list(filter(lambda x: x%2, nums))  # 홀수만', ind:0},
        {t:'sorted(nums, key=lambda x: -x)     # 내림차순', ind:0}
      ];
      var act = st===0?3 : (st===1?4:5);
      codePanel(E, W*0.03, H*0.16, W*0.48, code, 'lambda_hof.py', act);

      var gx=W*0.55, gy=H*0.22, cw=Math.min(46,W*0.045), chh=38, gap=8;
      var title2, out, opLabel;
      if(st===0){ title2='map — 각 원소에 함수 적용'; out=base.map(function(x){return x*x;}); opLabel='square(x) = x*x'; }
      else if(st===1){ title2='filter — 조건 참인 것만 남김'; out=base.filter(function(x){return x%2;}); opLabel='x % 2 != 0 (홀수)'; }
      else { title2='sorted(key=) — 키 기준 정렬'; out=base.slice().sort(function(a,b){return b-a;}); opLabel='key = -x (내림차순)'; }
      ctx.fillStyle=PYL; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText(title2, gx, gy-14);
      ctx.fillStyle=DIM; ctx.font='12.5px ui-monospace,monospace'; ctx.fillText(opLabel, gx, gy+2);

      // 입력 행
      ctx.fillStyle='#f0e7cf'; ctx.font='600 13px sans-serif'; ctx.textAlign='right'; ctx.fillText('입력', gx-10, gy+24+chh/2+4);
      for(var i=0;i<base.length;i++){ cell(ctx, gx+i*(cw+gap), gy+24, cw, chh, base[i], 'rgba(108,182,232,0.10)', PYB, PYB, 16); }
      // 화살표
      var ax=gx+base.length*(cw+gap)/2 - gap/2;
      ctx.strokeStyle='rgba(255,255,255,0.30)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(ax, gy+24+chh+6); ctx.lineTo(ax, gy+24+chh+28); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ax-5,gy+24+chh+22); ctx.lineTo(ax,gy+24+chh+28); ctx.lineTo(ax+5,gy+24+chh+22); ctx.fillStyle='rgba(255,255,255,0.30)'; ctx.fill();
      // 출력 행
      var oy=gy+24+chh+34;
      ctx.fillStyle='#f0e7cf'; ctx.font='600 13px sans-serif'; ctx.textAlign='right'; ctx.fillText('출력', gx-10, oy+chh/2+4);
      for(i=0;i<out.length;i++){ cell(ctx, gx+i*(cw+gap), oy, cw, chh, out[i], 'rgba(126,224,176,0.14)', GRN, GRN, 16); }
      // 결과 문자열
      ctx.fillStyle=GRN; ctx.font='600 14px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
      ctx.fillText('= ['+out.join(', ')+']', gx, oy+chh+26);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
      var note = st===0?'[1,2,3,4,5] → 각 제곱' : (st===1?'홀수만 통과(2·4 제거)':'큰 값부터 정렬');
      ctx.fillText(note, gx, oy+chh+48);
      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 (map → filter → sorted)', true);
      E.big('lambda · 고차함수 — 함수를 값처럼 넘긴다', '<b>lambda</b>는 이름 없이 한 줄로 만드는 작은 함수입니다. 파이썬에선 함수도 ‘값’이라, 다른 함수에 <b>인자로 넘길</b> 수 있죠 — 이런 함수를 <b>고차함수</b>라 합니다. <b>map</b>은 모든 원소에 함수를 적용해 변환하고, <b>filter</b>는 조건 참인 것만 남기며, <b>sorted(key=)</b>는 키 함수로 정렬 기준을 정합니다. <code>map(lambda x:x*x,[1,2,3])</code> → [1,4,9].'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
