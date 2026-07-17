/* 파이썬 제1장 — 파이썬 첫걸음: 변수와 타입 · 산술연산자 · 문자열 · 입출력·형변환 · 첫 프로그램
   동작(behavior)만. 텍스트=content/py1.json. 엔진 js/engine.js 공유. 색: Python=골드/노랑(#ffd343).
   골든룰: 화면에 보이는 출력값(7//2·2**10·슬라이싱·구구단)은 전부 JS에서 실제로 계산 — 코드를 복사하면 Colab에서 같은 결과. */
(function(){
  var PYL='#ffd343', PYB='#6cb6e8', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', PNK='#f4a0c0', DIM='#9b99a3', RED='#f0888a';

  function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  // 등폭 코드 패널: lines = [ {t:'코드줄', hl:'강조토큰', dim:false} | '문자열' ].
  // hl이 줄 안에 있으면 그 부분만 노랑(PYL) 강조. 복사하면 바로 도는 진짜 파이썬 코드.
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
        ctx.fillStyle=((typeof L==='object'&&L.dim)?DIM:'#e8e2cf'); ctx.fillText(t, x+pad, ty);
      }
    }
    return top+ht;
  }
  // 작은 셀(변수 박스·문자 칸 공용)
  function cell(ctx,x,y,w,h,txt,fill,stroke,tcol,fs){
    ctx.fillStyle=fill||'rgba(255,255,255,0.04)'; ctx.fillRect(x,y,w,h);
    ctx.strokeStyle=stroke||'rgba(255,255,255,0.12)'; ctx.lineWidth=1; ctx.strokeRect(x,y,w,h);
    if(txt!=null){ ctx.fillStyle=tcol||'#efe7d4'; ctx.font=(fs||13)+'px ui-monospace,Menlo,monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(''+txt, x+w/2, y+h/2+1); ctx.textBaseline='alphabetic'; }
  }
  // 콘솔식 출력 줄(>>> 결과)
  function outLine(ctx,x,y,label,val,vcol){
    ctx.font='14px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
    ctx.fillStyle=DIM; ctx.fillText(label, x, y);
    var lw=ctx.measureText(label).width;
    ctx.fillStyle=vcol||GRN; ctx.fillText(val, x+lw, y);
  }

  var scenes = [

  // ══════════ 1. 변수와 타입 — int · float · str · bool · 동적 타이핑 ══════════
  { id:'py1_01',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(360+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'x = 5            # 정수 int', hl:'5'},
        {t:'pi = 3.14        # 실수 float', hl:'3.14'},
        {t:'name = "Guido"   # 문자열 str', hl:'"Guido"'},
        {t:'ok = True        # 불리언 bool', hl:'True'},
        {t:'', dim:true},
        {t:'type(x)          # <class \'int\'>', hl:'type'},
        {t:'x = "다섯"        # 같은 이름에 다른 타입!', hl:'"다섯"'}
      ];
      var act = s.step===0 ? 0 : 6;
      codePanel(E, W*0.05, H*0.16, W*0.43, code, 'variables.py', act);

      // 우측: 각 변수를 '이름표 → 값 상자(타입)' 로
      var rx=W*0.56, ry=H*0.20, rowh=46, bw=120, bh=34;
      var vars=[
        {nm:'x',    val:'5',       ty:'int',   c:PYL},
        {nm:'pi',   val:'3.14',    ty:'float', c:GRN},
        {nm:'name', val:'"Guido"', ty:'str',   c:BLU},
        {nm:'ok',   val:'True',    ty:'bool',  c:PNK}
      ];
      ctx.fillStyle=PYL; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
      ctx.fillText('변수 = 값에 붙인 이름표', rx, ry-14);
      for(var i=0;i<vars.length;i++){
        var v=vars[i], y=ry+i*rowh;
        ctx.fillStyle='#efe7d4'; ctx.font='600 15px ui-monospace,Menlo,monospace'; ctx.textAlign='right';
        ctx.fillText(v.nm, rx+34, y+bh/2+5);
        // 화살표
        ctx.strokeStyle=DIM; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(rx+42,y+bh/2); ctx.lineTo(rx+64,y+bh/2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(rx+64,y+bh/2); ctx.lineTo(rx+58,y+bh/2-4); ctx.lineTo(rx+58,y+bh/2+4); ctx.closePath(); ctx.fillStyle=DIM; ctx.fill();
        cell(ctx, rx+70, y, bw, bh, v.val, 'rgba(255,211,67,0.06)', v.c, '#efe7d4', 14);
        // 타입 칩
        ctx.fillStyle=v.c; ctx.font='600 12px sans-serif'; ctx.textAlign='left'; ctx.fillText(v.ty, rx+70+bw+12, y+bh/2+5);
      }
      var oy=ry+vars.length*rowh+8;
      if(s.step===0){
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.textAlign='left';
        ctx.fillText('탭하면 — 같은 이름 x에 문자열을 다시 담아 봅니다.', rx, oy+10);
      } else {
        // 동적 타이핑: x가 int에서 str로 바뀜
        ctx.fillStyle=GLD; ctx.font='600 13.5px sans-serif'; ctx.textAlign='left';
        ctx.fillText('x = "다섯"  →  x의 타입이 int 에서 str 로 변신!', rx, oy+10);
        var bx=rx;
        cell(ctx, bx, oy+22, 70, bh, 'x', 'rgba(255,255,255,0.04)', DIM, DIM, 14);
        // 화살표 5 -> "다섯"
        cell(ctx, bx+86, oy+22, 60, bh, '5', 'rgba(255,255,255,0.03)', RED, DIM, 13);
        ctx.fillStyle=DIM; ctx.font='16px sans-serif'; ctx.textAlign='center'; ctx.fillText('→', bx+160, oy+22+bh/2+5);
        cell(ctx, bx+176, oy+22, 80, bh, '"다섯"', 'rgba(122,184,255,0.10)', BLU, '#efe7d4', 13);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('(타입을 미리 선언 안 함 = 동적 타이핑)', bx, oy+22+bh+18);
      }
      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 (네 가지 타입 → 동적 타이핑)', true);
      E.big('변수와 타입 — 값에 이름표 붙이기', '파이썬에서 변수는 ‘상자’라기보다 값에 붙인 <b>이름표</b>입니다. x=5 한 줄이면 정수(int), 3.14는 실수(float), "Guido"는 문자열(str), True/False는 불리언(bool)이 되죠. 자바·C와 달리 <b>타입을 미리 선언하지 않습니다</b> — 담는 값에 따라 타입이 정해지고, 같은 이름에 다른 타입을 다시 담아도 됩니다(동적 타이핑).'); }
  },

  // ══════════ 2. 산술·연산자 — + − * / // % ** ══════════
  { id:'py1_02',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(340+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'7 + 2     # 더하기', hl:'7 + 2'},
        {t:'7 - 2     # 빼기', hl:'7 - 2'},
        {t:'7 * 2     # 곱하기', hl:'7 * 2'},
        {t:'7 / 2     # 나누기(항상 float)', hl:'7 / 2'},
        {t:'7 // 2    # 몫 (정수 나눗셈)', hl:'7 // 2'},
        {t:'7 % 2     # 나머지', hl:'7 % 2'},
        {t:'2 ** 10   # 거듭제곱', hl:'2 ** 10'}
      ];
      var act = s.step===1 ? 4 : null;   // step1=// 몫 강조(헷갈리는 줄)
      codePanel(E, W*0.05, H*0.15, W*0.42, code, 'arithmetic.py', act);

      // 우측: 각 연산을 실제 계산해 결과 표로
      var ops=[
        {ex:'7 + 2',   v:7+2,    note:'더하기',            c:GRN},
        {ex:'7 - 2',   v:7-2,    note:'빼기',              c:GRN},
        {ex:'7 * 2',   v:7*2,    note:'곱하기',            c:GRN},
        {ex:'7 / 2',   v:(7/2).toFixed(1), note:'/ 는 항상 실수 3.5', c:PYB},
        {ex:'7 // 2',  v:Math.floor(7/2),  note:'몫만 — 소수 버림', c:PYL},
        {ex:'7 % 2',   v:7%2,    note:'나머지(짝/홀 판별)', c:PYL},
        {ex:'2 ** 10', v:Math.pow(2,10),   note:'2를 10번 곱함',    c:PNK}
      ];
      var rx=W*0.55, ry=H*0.18, rh=30, ew=88, vw=78;
      ctx.fillStyle=PYL; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('계산 결과 (Colab과 동일)', rx, ry-12);
      // 헤더
      cell(ctx, rx, ry, ew, rh, '식', 'rgba(255,211,67,0.14)', PYL, PYL, 12.5);
      cell(ctx, rx+ew, ry, vw, rh, '결과', 'rgba(255,211,67,0.14)', PYL, PYL, 12.5);
      for(var i=0;i<ops.length;i++){
        var o=ops[i], y=ry+rh*(i+1);
        cell(ctx, rx, y, ew, rh, o.ex, 'rgba(255,255,255,0.03)', 'rgba(255,255,255,0.12)', '#efe7d4', 13);
        cell(ctx, rx+ew, y, vw, rh, o.v, 'rgba(126,224,176,0.07)', o.c, o.c, 14);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText(o.note, rx+ew+vw+12, y+rh/2+4);
      }
      // 핵심 대비 강조: / vs //
      var ny=ry+rh*(ops.length+1)+20;
      if(s.step===1){
        ctx.fillStyle=GLD; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('헷갈리기 쉬운 점:  7/2 = 3.5  ≠  7//2 = 3', rx, ny);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
        ctx.fillText('/ 는 나눠서 소수까지(float), // 는 몫만 남기고 버립니다.', rx, ny+20);
      } else {
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.textAlign='left';
        ctx.fillText('탭하면 — / 와 // 의 차이를 짚어 줍니다.', rx, ny);
      }
      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 (전체 결과 → / vs // 강조)', true);
      E.big('산술과 연산자 — 파이썬을 계산기처럼', '+ − * 는 익숙하죠. 헷갈리는 셋만 익히면 됩니다: <b>/ 는 항상 실수</b>(7/2=3.5), <b>// 는 몫</b>(7//2=3, 소수 버림), <b>% 는 나머지</b>(7%2=1 — 짝수·홀수 판별에 단골), <b>** 는 거듭제곱</b>(2**10=1024).'); }
  },

  // ══════════ 3. 문자열 — 인덱싱 · 슬라이싱 · f-string · 메서드 ══════════
  { id:'py1_03',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(330+this.s.step*90,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var word='Python';
      var code=[
        {t:'s = "Python"', hl:'"Python"'},
        {t:'s[0]            # 첫 글자', hl:'s[0]'},
        {t:'s[-1]           # 마지막 글자', hl:'s[-1]'},
        {t:'s[0:3]          # 슬라이싱', hl:'s[0:3]'},
        {t:'name = "도형이"', hl:'"도형이"'},
        {t:'f"안녕, {name}!" # f-string', hl:'f"안녕, {name}!"'},
        {t:'s.upper()       # 대문자', hl:'s.upper()'},
        {t:'"a,b,c".split(",")', hl:'.split(",")'}
      ];
      var act = s.step===0 ? 1 : (s.step===1 ? 3 : 5);   // 인덱싱 s[0] / 슬라이싱 s[0:3] / f-string
      codePanel(E, W*0.04, H*0.13, W*0.46, code, 'strings.py', act);

      var rx=W*0.55, ry=H*0.17;
      // 항상: 문자 칸 + 인덱스(양수/음수)
      var cw=34, ch=34, x0=rx;
      ctx.fillStyle=PYL; ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.fillText('문자열 "Python" — 글자마다 번호(인덱스)', rx, ry-8);
      for(var i=0;i<word.length;i++){
        var hot = (s.step===0 && (i===0||i===word.length-1));
        cell(ctx, x0+i*cw, ry+8, cw, ch, word[i], hot?'rgba(255,211,67,0.16)':'rgba(255,255,255,0.04)', hot?PYL:'rgba(255,255,255,0.16)', '#efe7d4', 16);
        ctx.fillStyle=PYB; ctx.font='13px ui-monospace,monospace'; ctx.textAlign='center'; ctx.fillText(i, x0+i*cw+cw/2, ry+8+ch+13);      // 양수 인덱스
        ctx.fillStyle=DIM; ctx.fillText('-'+(word.length-i), x0+i*cw+cw/2, ry+8+ch+28);                                                  // 음수 인덱스
      }
      var oy=ry+8+ch+50;
      if(s.step===0){
        ctx.fillStyle=GLD; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        outLine(ctx, rx, oy+16, "s[0]  = ", "'"+word[0]+"'", GRN);
        outLine(ctx, rx, oy+40, "s[-1] = ", "'"+word[word.length-1]+"'", GRN);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('0=첫 글자, -1=마지막 글자(뒤에서부터).', rx, oy+64);
      } else if(s.step===1){
        // 슬라이싱 s[0:3] = "Pyt"
        var sl=word.slice(0,3);
        ctx.fillStyle=GLD; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('s[0:3]  →  0,1,2 번 글자 (3은 제외)', rx, oy+10);
        for(i=0;i<word.length;i++){
          var inSl=(i>=0&&i<3);
          cell(ctx, x0+i*cw, oy+22, cw, ch, word[i], inSl?'rgba(126,224,176,0.18)':'rgba(255,255,255,0.02)', inSl?GRN:'rgba(255,255,255,0.10)', inSl?'#efe7d4':DIM, 16);
        }
        outLine(ctx, rx, oy+22+ch+26, "결과 = ", "'"+sl+"'", GRN);
      } else {
        // f-string + 메서드
        var name='도형이';
        ctx.fillStyle=GLD; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('f-string & 메서드 (실제 출력)', rx, oy+10);
        outLine(ctx, rx, oy+34, 'f"안녕, {name}!" = ', '"안녕, '+name+'!"', BLU);
        outLine(ctx, rx, oy+58, 's.upper()         = ', "'"+word.toUpperCase()+"'", PNK);
        var parts='a,b,c'.split(',');
        outLine(ctx, rx, oy+82, '"a,b,c".split(",") = ', '['+parts.map(function(p){return "'"+p+"'";}).join(', ')+']', PYL);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('f"...{변수}..." 가 변수 값을 문자열에 끼워 넣습니다.', rx, oy+106);
      }
      E.tapHint(W/2, H*0.94, '화면 탭 = 다음 (인덱싱 → 슬라이싱 → f-string·메서드)', true);
      E.big('문자열 — 글자들의 열', '문자열은 글자가 줄지어 선 것이고, 각 글자에 <b>번호(인덱스)</b>가 붙습니다: s[0]은 첫 글자, s[-1]은 마지막. <b>슬라이싱</b> s[0:3]은 0,1,2번만 잘라 "Pyt"(끝 번호 3은 제외!). <b>f-string</b> f"안녕, {name}!"은 중괄호 안 변수 값을 문장에 끼워 넣고, <b>.upper()·.split(",")</b> 같은 메서드로 변형합니다 — 화면의 결과는 Colab에서도 그대로 재현됩니다.'); }
  },

  // ══════════ 4. 입력·출력·형변환 — input() print() int() str() ══════════
  { id:'py1_04',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(350+this.s.step*110,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'a = input("첫 수: ")   # "12" (문자열!)', hl:'input'},
        {t:'b = input("둘째 수: ") # "30"', hl:'input'},
        {t:'', dim:true},
        {t:'a + b          # 문자열 이어붙이기 → "1230"', hl:'a + b'},
        {t:'int(a) + int(b)# 숫자 변환 후 더하기 → 42', hl:'int'},
        {t:'', dim:true},
        {t:'print("합:", int(a)+int(b))', hl:'print'}
      ];
      var act = s.step===0 ? 3 : 4;   // a+b 이어붙이기 / int()+int() 덧셈
      codePanel(E, W*0.04, H*0.15, W*0.47, code, 'io_cast.py', act);

      var rx=W*0.56, ry=H*0.19;
      var A='12', B='30';
      ctx.fillStyle=PYL; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('input()은 언제나 문자열(str)을 돌려줍니다', rx, ry-12);
      // 입력 두 칸
      cell(ctx, rx, ry, 90, 32, '"'+A+'"', 'rgba(122,184,255,0.10)', BLU, '#efe7d4', 15);
      cell(ctx, rx+104, ry, 90, 32, '"'+B+'"', 'rgba(122,184,255,0.10)', BLU, '#efe7d4', 15);
      ctx.fillStyle=DIM; ctx.font='13.5px sans-serif'; ctx.textAlign='left'; ctx.fillText('a = "12" (str)', rx, ry+50); ctx.fillText('b = "30" (str)', rx+104, ry+50);

      var oy=ry+72;
      if(s.step===0){
        // 잘못된 길: a + b = "1230"
        ctx.fillStyle=RED; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('a + b  (문자열끼리)  →  이어붙이기!', rx, oy);
        outLine(ctx, rx, oy+26, '"12" + "30" = ', '"'+(A+B)+'"', RED);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.textAlign='left'; ctx.fillText('숫자가 아니라 글자라서 그냥 붙습니다 (12+30 아님).', rx, oy+48);
        ctx.fillText('탭하면 — int()로 변환해 제대로 더해 봅니다.', rx, oy+68);
      } else {
        // 옳은 길: int(a)+int(b) = 42
        ctx.fillStyle=GRN; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('int(a) + int(b)  (숫자로 변환 후)  →  덧셈!', rx, oy);
        // 변환 시각화
        cell(ctx, rx, oy+16, 70, 30, '"12"', 'rgba(255,255,255,0.03)', DIM, DIM, 13);
        ctx.fillStyle=PYL; ctx.font='12px ui-monospace,monospace'; ctx.textAlign='center'; ctx.fillText('int()', rx+92, oy+16+18);
        cell(ctx, rx+118, oy+16, 50, 30, parseInt(A,10), 'rgba(255,211,67,0.10)', PYL, PYL, 14);
        cell(ctx, rx, oy+54, 70, 30, '"30"', 'rgba(255,255,255,0.03)', DIM, DIM, 13);
        ctx.fillStyle=PYL; ctx.font='12px ui-monospace,monospace'; ctx.textAlign='center'; ctx.fillText('int()', rx+92, oy+54+18);
        cell(ctx, rx+118, oy+54, 50, 30, parseInt(B,10), 'rgba(255,211,67,0.10)', PYL, PYL, 14);
        var sum=parseInt(A,10)+parseInt(B,10);
        outLine(ctx, rx, oy+108, 'print("합:", ', parseInt(A,10)+' + '+parseInt(B,10)+' = '+sum+' )', GRN);
        ctx.fillStyle=GRN; ctx.font='600 16px ui-monospace,monospace'; ctx.textAlign='left'; ctx.fillText('출력 →  합: '+sum, rx, oy+134);
      }
      E.tapHint(W/2, H*0.94, '화면 탭 = 다음 (문자열 더하기 → int() 변환 후 덧셈)', true);
      E.big('입력·출력·형변환 — 문자열의 함정', '<b>input()</b>으로 받은 값은 숫자처럼 보여도 항상 <b>문자열(str)</b>입니다. 그래서 "12"+"30"은 42가 아니라 글자가 붙은 "1230"이 되죠 — 초보자가 가장 많이 걸리는 함정입니다. 숫자로 계산하려면 <b>int()</b>(정수)·<b>float()</b>(실수)로 변환해야 합니다: int("12")+int("30")=42. 반대로 <b>str()</b>은 숫자를 문자열로 바꾸고, <b>print()</b>는 화면에 출력하죠.'); }
  },

  // ══════════ 5. 첫 프로그램 — 여러 줄 코드 + 실제 출력 표 (구구단) ══════════
  { id:'py1_05',
    enter:function(E){ var self=this; this.s={dan:3};
      E.controls('<div class="ctrl"><label>구구단 단(段)</label><input type="range" id="dn" min="2" max="9" step="1" value="3"><output id="dno">3</output></div>');
      E.bind('#dn','input',function(e){ self.s.dan=+e.target.value; document.getElementById('dno').textContent=e.target.value; E.blip(300+self.s.dan*30,0.06); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, dan=s.dan;
      var code=[
        {t:'dan = '+dan+'                  # 단 선택', hl:''+dan},
        {t:'print(f"=== {dan}단 ===")', hl:'print'},
        {t:'for i in range(1, 10):   # 1~9', hl:'for'},
        {t:'    result = dan * i', hl:'dan * i'},
        {t:'    print(f"{dan} x {i} = {result}")', hl:'f"{dan} x {i} = {result}"'}
      ];
      codePanel(E, W*0.04, H*0.15, W*0.45, code, 'gugudan.py');
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillText('변수·연산·f-string·반복을 한데 모은 첫 프로그램.', W*0.04, H*0.15+5*21+44);
      ctx.fillText('슬라이더로 단을 바꾸면 — 코드와 출력이 함께 바뀝니다.', W*0.04, H*0.15+5*21+62);

      // 우측: 실제 실행 결과(콘솔)
      var rx=W*0.55, ry=H*0.14, lh=24;
      ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.strokeStyle='rgba(255,211,67,0.28)'; ctx.lineWidth=1;
      roundRect(ctx, rx, ry, W*0.40, lh*11+24, 9); ctx.fill(); ctx.stroke();
      ctx.fillStyle=PYL; ctx.font='600 12px sans-serif'; ctx.textAlign='left'; ctx.fillText('▶ 출력', rx+14, ry+18);
      ctx.font='15px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('=== '+dan+'단 ===', rx+14, ry+18+lh);
      for(var i=1;i<=9;i++){
        var r=dan*i;                                   // 실제 곱셈 — 골든룰
        var ty=ry+18+lh*(i+1);
        ctx.textAlign='left'; ctx.fillStyle='#cfd9e8';
        ctx.fillText(dan+' x '+i+' = ', rx+14, ty);
        var lw=ctx.measureText(dan+' x '+i+' = ').width;
        ctx.fillStyle=GRN; ctx.fillText(''+r, rx+14+lw, ty);
      }
      E.tapHint(W/2, H*0.95, '슬라이더로 단을 바꿔 보세요 — 코드와 출력이 같이 갱신', true);
      E.big('첫 프로그램 — 구구단 출력', '드디어 배운 것을 다 모았습니다: <b>변수</b>(dan)에 값을 담고, <b>곱셈</b>(dan*i)으로 계산하고, <b>f-string</b>으로 결과를 문장으로 만들고, <b>for 반복</b>으로 1~9를 한 번에 처리합니다(반복은 다음 장에서 자세히). 슬라이더로 단을 바꾸면 코드의 dan과 오른쪽 출력 표가 함께 바뀌죠. 여러분의 첫 프로그램, 축하합니다!'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
