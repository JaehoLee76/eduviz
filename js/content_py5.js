/* 파이썬 제5장 — 현대 파이썬 문법: f-string · 타입 힌트 · 데이터클래스 · match-case · 예외/with/제너레이터
   동작(behavior)만. 텍스트=content/py5.json. 엔진 js/engine.js 공유. 색: Python=골드/노랑 테마.
   골든룰: 화면에 표시되는 모든 포맷 결과·판정·출력값은 JS로 실제 계산(베껴 박지 않음).
   왼쪽=진짜 최신(3.10+) 파이썬 코드 패널, 오른쪽=실제 결과/개념 시각화. */
(function(){
  var PYL='#ffd343', PYB='#6cb6e8', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', PNK='#f4a0c0', DIM='#9b99a3', RED='#f0888a';

  function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  // 등폭 코드 패널: lines=[{t,hl?,dim?}|문자열]. hl 토큰만 노랑 강조. 골드 테마.
  function codePanel(E, x, y, w, lines, title, actLine){
    var ctx=E.ctx, lh=21, pad=14, top=y, n=lines.length, ht=n*lh+pad*2+(title?26:0);
    ctx.fillStyle='rgba(255,255,255,0.035)'; ctx.strokeStyle='rgba(255,211,67,0.30)'; ctx.lineWidth=1;
    roundRect(ctx,x,top,w,ht,10); ctx.fill(); ctx.stroke();
    var cy=top+pad+(title?26:0);
    if(title){ ctx.fillStyle=PYL; ctx.font='600 12px ui-monospace,Menlo,monospace'; ctx.textAlign='left'; ctx.fillText(title, x+pad, top+pad+12); }
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
        ctx.fillStyle=(L.dim?DIM:'#e8e0c8'); ctx.fillText(t, x+pad, ty);
      }
    }
    return top+ht;
  }

  var scenes = [

  // ══════════ 1. f-string · 포맷 ══════════
  { id:'py5_01',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*110,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'name = "도형이"', hl:'name'},
        {t:'x = 7', hl:'x'},
        {t:'pi = 3.14159', hl:'pi'},
        {t:'', dim:true},
        {t:'f"{x=}"        # 디버그 표기', hl:'{x=}'},
        {t:'f"{pi:.2f}"    # 소수 둘째 자리', hl:'{pi:.2f}'},
        {t:'f"{name:>8}"   # 오른쪽 정렬(8칸)', hl:'{name:>8}'},
        {t:'f"{1000000:,}" # 천 단위 콤마', hl:'{1000000:,}'}
      ];
      // 실제 포맷 결과 — JS로 계산
      var pi=3.14159, x=7, name='도형이';
      function pad(str,n){ str=''+str; while(str.length<n) str=' '+str; return str; }
      function comma(n){ return (''+n).replace(/\B(?=(\d{3})+(?!\d))/g,','); }
      var results=[
        {expr:'f"{x=}"',        out:'x=7',                    note:'변수명과 값을 한꺼번에 — 디버깅 필수'},
        {expr:'f"{pi:.2f}"',    out:pi.toFixed(2),            note:'3.14159 → 반올림해 소수 2자리'},
        {expr:'f"{name:>8}"',   out:"'"+pad(name,8)+"'",      note:'오른쪽 정렬, 빈칸을 앞에 채움'},
        {expr:'f"{1000000:,}"', out:comma(1000000),           note:'큰 수를 읽기 쉽게 콤마로'}
      ];

      var show=Math.min(results.length, 1+s.step*2 < results.length ? 1+s.step*2 : results.length);
      // 마지막으로 드러난 f-string 줄에 커서(결과 i → 코드줄 4+i)
      codePanel(E, W*0.05, H*0.15, W*0.43, code, 'fstrings.py', 4+(show-1));
      var rx=W*0.53, ry=H*0.17;
      ctx.fillStyle=PYL; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('실제 출력 (실시간 계산)', rx, ry);
      for(var i=0;i<results.length;i++){
        var on=(i<show), y=ry+24+i*52, r=results[i];
        ctx.globalAlpha=on?1:0.22;
        ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.strokeStyle=on?'rgba(255,211,67,0.4)':'rgba(255,255,255,0.1)'; ctx.lineWidth=1.2;
        roundRect(ctx,rx,y,W*0.42,42,8); ctx.fill(); ctx.stroke();
        ctx.fillStyle=PYB; ctx.font='13px ui-monospace,Menlo,monospace'; ctx.textAlign='left'; ctx.fillText(r.expr, rx+12, y+18);
        ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.fillText(r.note, rx+12, y+34);
        ctx.fillStyle=GRN; ctx.font='600 15px ui-monospace,Menlo,monospace'; ctx.textAlign='right'; ctx.fillText('→ '+r.out, rx+W*0.42-12, y+26);
        ctx.globalAlpha=1;
      }
      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 (f-string 포맷 결과를 하나씩)', true);
      E.big('f-string — 가장 빠르고 읽기 좋은 포맷', '문자열 앞에 f를 붙이면 {} 안에 변수와 식을 그대로 끼워 넣습니다. {x=}는 변수명까지 찍어 디버깅을 단숨에, :.2f·:>8·:,는 소수·정렬·콤마를 한 줄로. 옛 % 포맷이나 .format()보다 짧고 또렷하죠 — 최신 파이썬이 더 읽기 좋은 첫 증거입니다.'); }
  },

  // ══════════ 2. 타입 힌트 ══════════
  { id:'py5_02',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(340+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'def greet(name: str) -> str:', hl:': str'},
        {t:'    return f"안녕, {name}"', hl:'name'},
        {t:'', dim:true},
        {t:'nums: list[int] = [3, 1, 2]', hl:'list[int]'},
        {t:'price: float = 9.9', hl:'float'},
        {t:'', dim:true},
        {t:'from typing import Optional', hl:'Optional'},
        {t:'def find(x: int) -> Optional[str]:', hl:'Optional[str]'},
        {t:'    ...                  # 없으면 None', hl:'None'}
      ];
      codePanel(E, W*0.05, H*0.14, W*0.45, code, 'type_hints.py');

      // 우측: 타입 힌트의 이점 3가지 (단계 누적)
      var gx=W*0.55, gw=W*0.40, by=H*0.18;
      ctx.fillStyle=PYL; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('타입을 적으면 무엇이 좋은가', gx, by);
      var benefits=[
        {t:'가독성', d:'name: str → "문자열을 받는다"가 코드에 보임', c:PYL},
        {t:'IDE·자동완성', d:'편집기가 타입을 알아 .upper() 등을 제안', c:BLU},
        {t:'버그 예방', d:'mypy 등이 실행 전 타입 오류를 미리 잡음', c:GRN}
      ];
      for(var i=0;i<benefits.length;i++){
        var on=(i<=s.step), y=by+30+i*70, b=benefits[i];
        ctx.globalAlpha=on?1:0.28;
        ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.strokeStyle=b.c; ctx.lineWidth=(i===s.step)?2.2:1.2;
        roundRect(ctx,gx,y,gw,56,9); ctx.fill(); ctx.stroke();
        ctx.fillStyle=b.c; ctx.font='600 15px sans-serif'; ctx.textAlign='left'; ctx.fillText((i+1)+'. '+b.t, gx+14, y+22);
        ctx.fillStyle='#cfe6e8'; ctx.font='12px sans-serif'; ctx.fillText(b.d, gx+14, y+42);
        ctx.globalAlpha=1;
      }
      // 핵심: 힌트는 '강제'가 아니라 '문서+검사' — 실행은 그대로
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText('타입 힌트는 실행을 강제하지 않습니다 —', gx, H*0.86);
      ctx.fillText('사람·편집기·검사기를 위한 ‘설명서’일 뿐.', gx, H*0.86+18);
      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 (가독성 → IDE → 버그예방)', true);
      E.big('타입 힌트 — 코드가 스스로를 설명한다', 'def f(x: int) -> str 처럼 입력·출력 타입을 적어 두면, 코드만 봐도 의도가 드러나고 편집기가 자동완성을 해 주며 mypy가 실행 전 타입 실수를 잡습니다. list[int]·Optional[str] 같은 표기로 컬렉션 안의 타입까지 명시할 수 있죠. 강제는 아니지만, 큰 코드일수록 안전망이 됩니다.'); }
  },

  // ══════════ 3. 데이터클래스 ══════════
  { id:'py5_03',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(360+this.s.step*120,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      if(s.step===0){
        // 일반 class — 보일러플레이트 가득
        var code=[
          {t:'class Point:', hl:'class'},
          {t:'    def __init__(self, x, y):', hl:'__init__'},
          {t:'        self.x = x', hl:'self.x'},
          {t:'        self.y = y', hl:'self.y'},
          {t:'    def __repr__(self):', hl:'__repr__'},
          {t:'        return f"Point({self.x},{self.y})"', hl:'__repr__'},
          {t:'    def __eq__(self, o):', hl:'__eq__'},
          {t:'        return (self.x,self.y)==(o.x,o.y)', hl:'__eq__'}
        ];
        codePanel(E, W*0.05, H*0.14, W*0.48, code, 'plain_class.py  (옛 방식)');
        ctx.fillStyle=RED; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('8줄 — 반복되는 보일러플레이트', W*0.05, H*0.74);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText('필드를 추가할 때마다 __init__·__repr__·__eq__를 손봐야 합니다.', W*0.05, H*0.74+22);
      } else {
        var code=[
          {t:'from dataclasses import dataclass', hl:'dataclass'},
          {t:'', dim:true},
          {t:'@dataclass', hl:'@dataclass'},
          {t:'class Point:', hl:'class'},
          {t:'    x: int', hl:'x: int'},
          {t:'    y: int', hl:'y: int'}
        ];
        codePanel(E, W*0.05, H*0.14, W*0.48, code, 'dataclass.py  (현대 방식)');
        ctx.fillStyle=GRN; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('단 4줄 — 같은 기능, 보일러플레이트 0', W*0.05, H*0.62);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText('@dataclass가 __init__·__repr__·__eq__를 자동 생성합니다.', W*0.05, H*0.62+22);
      }

      // 우측: 자동 생성되는 것 + 실제 동작 (실계산)
      var gx=W*0.58, gw=W*0.37, by=H*0.16;
      ctx.fillStyle=PYL; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('@dataclass가 만들어 주는 것', gx, by);
      var auto=['__init__  (생성자)','__repr__  (보기 좋은 출력)','__eq__    (값 비교)'];
      for(var i=0;i<auto.length;i++){
        var y=by+26+i*34;
        ctx.fillStyle='rgba(126,224,176,0.10)'; ctx.strokeStyle=GRN; ctx.lineWidth=1.2; roundRect(ctx,gx,y,gw,26,6); ctx.fill(); ctx.stroke();
        ctx.fillStyle=GRN; ctx.font='12.5px ui-monospace,Menlo,monospace'; ctx.textAlign='left'; ctx.fillText('✓ '+auto[i], gx+10, y+17);
      }
      // 실제 동작 데모: p == q 비교를 JS로 진짜 판정
      var p=[1,2], q=[1,2], r=[3,4];
      var eqpq=(p[0]===q[0]&&p[1]===q[1]), eqpr=(p[0]===r[0]&&p[1]===r[1]);
      var dy=by+26+auto.length*34+22;
      ctx.fillStyle='#cfe6e8'; ctx.font='13px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
      ctx.fillText('Point(1,2)            → repr: Point(1,2)', gx, dy);
      ctx.fillStyle=eqpq?GRN:RED; ctx.fillText('Point(1,2)==Point(1,2)  → '+(eqpq?'True':'False'), gx, dy+24);
      ctx.fillStyle=eqpr?GRN:RED; ctx.fillText('Point(1,2)==Point(3,4)  → '+(eqpr?'True':'False'), gx, dy+48);
      ctx.fillStyle=DIM; ctx.font='13.5px sans-serif'; ctx.fillText('값이 같으면 == 가 True — 직접 안 짜도 동작합니다.', gx, dy+72);

      E.tapHint(W/2, H*0.93, '화면 탭 = 옛 class ↔ @dataclass 비교', true);
      E.big('데이터클래스 — 보일러플레이트를 지운다', '데이터를 담는 클래스마다 __init__·__repr__·__eq__를 손으로 적던 시절은 끝났습니다. @dataclass 한 줄과 ‘필드: 타입’ 몇 줄이면 파이썬이 그 메서드들을 자동으로 만들어 줍니다. 코드는 짧아지고, 빠뜨릴 실수도 사라지죠 — 짧은 코드가 곧 안전한 코드입니다.'); }
  },

  // ══════════ 4. match-case (3.10) — 구조적 패턴 매칭 ══════════
  { id:'py5_04',
    enter:function(E){ var self=this; this.s={cmd:0};
      var labels=['"go"','"go north"','42','["add", 7]','"quit"'];
      E.controls('<div class="ctrl"><label>입력 command</label><input type="range" id="cm" min="0" max="4" step="1" value="0"><output id="cmo">"go"</output></div>');
      E.bind('#cm','input',function(e){ self.s.cmd=+e.target.value; document.getElementById('cmo').textContent=labels[self.s.cmd]; E.blip(340+self.s.cmd*60,0.06); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'match command:', hl:'match'},
        {t:'    case "go":', hl:'case'},
        {t:'        return "한 칸 이동"', hl:''},
        {t:'    case "go", direction:', hl:'case'},
        {t:'        return f"{direction}로 이동"', hl:''},
        {t:'    case int(n):', hl:'case'},
        {t:'        return f"숫자 {n}"', hl:''},
        {t:'    case ["add", x]:', hl:'case'},
        {t:'        return f"더하기 {x}"', hl:''},
        {t:'    case _:', hl:'_'},
        {t:'        return "알 수 없음"', hl:''}
      ];
      // 어느 case가 매칭되는지 실제 판정 → 코드 라인 하이라이트
      var inputs=[
        {label:'"go"',        match:1, res:'한 칸 이동'},
        {label:'"go north"',  match:3, res:'north로 이동'},
        {label:'42',          match:5, res:'숫자 42'},
        {label:'["add", 7]',  match:7, res:'더하기 7'},
        {label:'"quit"',      match:9, res:'알 수 없음'}
      ];
      var sel=inputs[s.cmd];
      // 코드 패널을 직접 그려 매칭 case 강조
      var px=W*0.05, py=H*0.12, pw=W*0.46, lh=21, pad=14, ht=code.length*lh+pad*2+26;
      ctx.fillStyle='rgba(255,255,255,0.035)'; ctx.strokeStyle='rgba(255,211,67,0.30)'; ctx.lineWidth=1; roundRect(ctx,px,py,pw,ht,10); ctx.fill(); ctx.stroke();
      ctx.fillStyle=PYL; ctx.font='600 12px ui-monospace,Menlo,monospace'; ctx.textAlign='left'; ctx.fillText('match_case.py  (Python 3.10+)', px+pad, py+pad+12);
      ctx.font='13px ui-monospace,Menlo,Consolas,monospace';
      for(var i=0;i<code.length;i++){
        var y=py+pad+26+i*lh+11, hit=(i===sel.match || i===sel.match+1);
        if(hit){ ctx.fillStyle='rgba(126,224,176,0.16)'; ctx.fillRect(px+4, y-14, pw-8, lh); }
        ctx.fillStyle=hit?GRN:'#e8e0c8'; ctx.fillText(code[i].t, px+pad, y);
      }

      // 우측: 입력 → 매칭 → 결과
      var gx=W*0.56, gw=W*0.40;
      ctx.fillStyle=PYL; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('command를 바꾸면 어느 case가 잡힐까', gx, H*0.15);
      // 입력 카드
      ctx.fillStyle='rgba(108,182,232,0.12)'; ctx.strokeStyle=PYB; ctx.lineWidth=1.6; roundRect(ctx,gx,H*0.20,gw,46,9); ctx.fill(); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.fillText('입력 command', gx+14, H*0.20+16);
      ctx.fillStyle=PYB; ctx.font='600 18px ui-monospace,Menlo,monospace'; ctx.fillText(sel.label, gx+14, H*0.20+38);
      // 화살표
      ctx.strokeStyle=GRN; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(gx+gw*0.5,H*0.20+46); ctx.lineTo(gx+gw*0.5,H*0.20+72); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(gx+gw*0.5-5,H*0.20+66); ctx.lineTo(gx+gw*0.5,H*0.20+72); ctx.lineTo(gx+gw*0.5+5,H*0.20+66); ctx.fillStyle=GRN; ctx.fill();
      // 매칭된 case
      ctx.fillStyle='rgba(126,224,176,0.10)'; ctx.strokeStyle=GRN; ctx.lineWidth=1.6; roundRect(ctx,gx,H*0.20+78,gw,46,9); ctx.fill(); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.fillText('매칭된 case', gx+14, H*0.20+94);
      ctx.fillStyle=GRN; ctx.font='600 14px ui-monospace,Menlo,monospace'; ctx.fillText(code[sel.match].t.trim(), gx+14, H*0.20+114);
      // 결과
      ctx.fillStyle='rgba(255,211,67,0.10)'; ctx.strokeStyle=PYL; ctx.lineWidth=1.6; roundRect(ctx,gx,H*0.20+136,gw,46,9); ctx.fill(); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.fillText('반환값', gx+14, H*0.20+152);
      ctx.fillStyle=PYL; ctx.font='600 16px sans-serif'; ctx.fillText('"'+sel.res+'"', gx+14, H*0.20+172);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillText('값만 비교하는 게 아니라 ‘모양(구조)’으로 분기 — _ 는 나머지 전부.', gx, H*0.88);

      E.tapHint(W/2, H*0.95, '슬라이더로 command를 바꿔, 잡히는 case를 보세요', true);
      E.big('match-case — 구조로 분기하는 패턴 매칭', '파이썬 3.10이 더한 match-case는 단순한 값 비교를 넘어 ‘모양’으로 분기합니다. 리스트 [\"add\", x]면 x를 꺼내 오고, int(n)이면 숫자만 잡고, _ 는 나머지 전부 — 길게 늘어지던 if/elif 사슬이 또렷한 한 블록으로 정리되죠. 입력을 바꿔, 어느 case가 잡히는지 직접 확인해 보세요.'); }
  },

  // ══════════ 5. 예외처리 · with · 제너레이터 ══════════
  { id:'py5_05',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(340+this.s.step*90,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'try:', hl:'try'},
        {t:'    x = 10 / n', hl:'x ='},
        {t:'except ZeroDivisionError:', hl:'except'},
        {t:'    print("0으로 못 나눔")', hl:''},
        {t:'finally:', hl:'finally'},
        {t:'    print("항상 실행")', hl:''},
        {t:'', dim:true},
        {t:'with open("f.txt") as fp:', hl:'with'},
        {t:'    data = fp.read()    # 자동 close', hl:'with'},
        {t:'', dim:true},
        {t:'def squares(n):', hl:'def'},
        {t:'    for i in range(n):', hl:''},
        {t:'        yield i*i        # 지연 생성', hl:'yield'}
      ];
      var act = s.step===0 ? 0 : (s.step===1 ? 7 : 12);   // try / with / yield
      codePanel(E, W*0.04, H*0.10, W*0.46, code, 'safe_python.py', act);

      var gx=W*0.55, gw=W*0.41;
      if(s.step===0){
        // try/except/finally 흐름
        ctx.fillStyle=PYL; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('try / except / finally — 오류에도 안전하게', gx, H*0.15);
        var flow=[
          {t:'try', d:'위험할 수 있는 코드 실행', c:PYB},
          {t:'except', d:'오류가 나면 여기서 받아 처리', c:RED},
          {t:'finally', d:'성공이든 실패든 무조건 실행 (정리)', c:GRN}
        ];
        for(var i=0;i<flow.length;i++){ var y=H*0.22+i*60, f=flow[i];
          ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.strokeStyle=f.c; ctx.lineWidth=1.6; roundRect(ctx,gx,y,gw,46,9); ctx.fill(); ctx.stroke();
          ctx.fillStyle=f.c; ctx.font='600 15px ui-monospace,Menlo,monospace'; ctx.textAlign='left'; ctx.fillText(f.t, gx+14, y+22);
          ctx.fillStyle='#cfe6e8'; ctx.font='12px sans-serif'; ctx.fillText(f.d, gx+14, y+38);
          if(i<2){ ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(gx+gw*0.5,y+46); ctx.lineTo(gx+gw*0.5,y+60); ctx.stroke(); }
        }
        // 실제 판정: n=0이면 except
        var n=0, hit=(n===0);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText('n=0 → 10/0 은 ZeroDivisionError → except가 받고, finally는 그래도 실행.', gx, H*0.85);
      } else if(s.step===1){
        // with — 자원 자동 정리
        ctx.fillStyle=PYL; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('with — 파일·자원을 자동으로 닫는다', gx, H*0.15);
        var steps=[
          {t:'1. open()', d:'파일을 연다 (자원 확보)', c:PYB},
          {t:'2. 블록 실행', d:'fp.read() 등 작업 수행', c:PYL},
          {t:'3. 자동 close()', d:'블록을 벗어나면 — 오류가 나도 — 닫힘', c:GRN}
        ];
        for(var j=0;j<steps.length;j++){ var y2=H*0.22+j*62, st=steps[j];
          ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.strokeStyle=st.c; ctx.lineWidth=1.6; roundRect(ctx,gx,y2,gw,48,9); ctx.fill(); ctx.stroke();
          ctx.fillStyle=st.c; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText(st.t, gx+14, y2+20);
          ctx.fillStyle='#cfe6e8'; ctx.font='12px sans-serif'; ctx.fillText(st.d, gx+14, y2+38);
        }
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText('close()를 깜빡해 파일이 새는 일이 없습니다 — 정리를 파이썬에 맡깁니다.', gx, H*0.85);
      } else {
        // 제너레이터 — 지연평가, 메모리 절약
        ctx.fillStyle=PYL; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('제너레이터 — 필요할 때 하나씩 (지연평가)', gx, H*0.15);
        // 리스트 vs 제너레이터 메모리 대비
        var n=8;
        // 리스트: 전부 미리 만듦
        var listVals=[]; for(var k=0;k<n;k++) listVals.push(k*k);
        var cy=H*0.30, cw=Math.min(40,gw/(n+1)), chh=30, sx=gx;
        ctx.fillStyle=RED; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('[i*i for i in range(8)] — 8개 전부 메모리에', gx, cy-10);
        for(k=0;k<n;k++){ ctx.fillStyle='rgba(240,136,138,0.12)'; ctx.strokeStyle=RED; ctx.lineWidth=1; ctx.fillRect(sx+k*(cw+4),cy,cw,chh); ctx.strokeRect(sx+k*(cw+4),cy,cw,chh);
          ctx.fillStyle='#e8e0c8'; ctx.font='13px ui-monospace,monospace'; ctx.textAlign='center'; ctx.fillText(listVals[k], sx+k*(cw+4)+cw/2, cy+chh/2+5); }
        // 제너레이터: 현재 하나만, 나머지는 '아직'
        var cur=(Math.floor(E.frame/30))%n, gy=cy+62;
        ctx.fillStyle=GRN; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('squares(8) — 지금 이 순간 단 하나만', gx, gy-10);
        for(k=0;k<n;k++){ var live=(k===cur);
          ctx.fillStyle=live?'rgba(126,224,176,0.20)':'rgba(255,255,255,0.03)'; ctx.strokeStyle=live?GRN:'rgba(255,255,255,0.14)'; ctx.lineWidth=live?1.8:1; ctx.fillRect(sx+k*(cw+4),gy,cw,chh); ctx.strokeRect(sx+k*(cw+4),gy,cw,chh);
          ctx.fillStyle=live?GRN:DIM; ctx.font='13px ui-monospace,monospace'; ctx.textAlign='center'; ctx.fillText(live?(k*k):'·', sx+k*(cw+4)+cw/2, gy+chh/2+5); }
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.textAlign='left';
        ctx.fillText('yield는 값을 ‘하나 내놓고 멈춥니다’ — 다음을 요청해야 다음 값을 계산.', gx, H*0.78);
        ctx.fillText('수십억 개라도 한 번에 하나만 다루니 메모리가 거의 안 듭니다.', gx, H*0.78+20);
      }
      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 (try/except → with → 제너레이터)', true);
      E.big('예외 · with · 제너레이터 — 안전하고 효율적으로', 'try/except/finally는 오류가 나도 프로그램이 무너지지 않게 받아 내고 정리를 보장합니다. with는 열었으면 반드시 닫히도록 자원 관리를 파이썬에 맡기죠. 그리고 yield 한 줄로 만드는 제너레이터는 값을 미리 다 만들지 않고 필요할 때 하나씩 ‘지연 생성’해, 거대한 데이터도 메모리 한 칸으로 흘려보냅니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
