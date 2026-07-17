/* 파이썬 제2장 — 자료구조: list · tuple/set · dict · 리스트 컴프리헨션 · 자료구조 고르기
   동작(behavior)만. 텍스트=content/py2.json. 엔진 js/engine.js 공유. 색: Python=골드/노랑 테마.
   원칙: 왼쪽=복사하면 도는 진짜 파이썬 코드, 오른쪽=실제 출력 시각화.
   골든룰: 화면에 표시되는 모든 인덱스·슬라이스·집합연산·딕트값·컴프리헨션 결과는 전부 JS에서 실제로 계산한 값(박아넣기 금지). */
(function(){
  var PYL='#ffd343', PYB='#6cb6e8', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', PNK='#f4a0c0', DIM='#9b99a3';

  function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  // 등폭 코드 패널 렌더러: lines=[{t:'코드', hl:'tok', dim:bool, cur:line인덱스와 일치 시 강조줄}|문자열]. hl 토큰만 노랑 강조.
  function codePanel(E, x, y, w, lines, title, curLine){
    var ctx=E.ctx, lh=21, pad=14, top=y, n=lines.length, ht=n*lh+pad*2+(title?26:0);
    ctx.fillStyle='rgba(255,255,255,0.035)'; ctx.strokeStyle='rgba(255,211,67,0.30)'; ctx.lineWidth=1;
    roundRect(ctx,x,top,w,ht,10); ctx.fill(); ctx.stroke();
    var cy=top+pad+(title?26:0);
    if(title){ ctx.fillStyle=PYL; ctx.font='600 12px sans-serif'; ctx.textAlign='left'; ctx.fillText(title, x+pad, top+pad+12); }
    ctx.font='13px ui-monospace,Menlo,Consolas,monospace'; ctx.textAlign='left';
    for(var i=0;i<n;i++){
      var L=lines[i], t=(typeof L==='string')?L:L.t, hl=(typeof L==='object')?L.hl:null;
      var ty=cy+i*lh+11;
      if(curLine===i){ ctx.fillStyle='rgba(255,211,67,0.10)'; ctx.fillRect(x+4, ty-13, w-8, lh-2); ctx.fillStyle=PYL; ctx.fillRect(x+4, ty-13, 3, lh-2); }
      if(hl && t.indexOf(hl)>=0){
        var a=t.split(hl), pre=a[0], post=a.slice(1).join(hl);
        ctx.fillStyle=DIM; ctx.fillText(pre, x+pad, ty);
        var wpre=ctx.measureText(pre).width;
        ctx.fillStyle=PYL; ctx.fillText(hl, x+pad+wpre, ty);
        var whl=ctx.measureText(hl).width;
        ctx.fillStyle=DIM; ctx.fillText(post, x+pad+wpre+whl, ty);
      } else {
        ctx.fillStyle=((typeof L==='object'&&L.dim)?DIM:'#efe6cf'); ctx.fillText(t, x+pad, ty);
      }
    }
    return top+ht;
  }

  // 작은 셀(리스트/표/집합 공용)
  function cell(ctx,x,y,w,h,txt,fill,stroke,tcol,fs){
    ctx.fillStyle=fill||'rgba(255,255,255,0.04)'; ctx.fillRect(x,y,w,h);
    ctx.strokeStyle=stroke||'rgba(255,255,255,0.12)'; ctx.lineWidth=1; ctx.strokeRect(x,y,w,h);
    if(txt!=null){ ctx.fillStyle=tcol||'#efe6cf'; ctx.font=(fs||13)+'px ui-monospace,Menlo,monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(''+txt, x+w/2, y+h/2+1); ctx.textBaseline='alphabetic'; }
  }

  var scenes = [

  // ══════════ 1. 리스트(list) — 생성·인덱싱·슬라이싱·append/pop ══════════
  { id:'py2_01',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(340+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 기준 리스트 (전부 실제 JS 배열로 계산)
      var base=['a','b','c','d','e'];
      var code=[
        {t:"fruits = ['a','b','c','d','e']", hl:'fruits'},
        {t:'fruits[0]      # 첫 원소', hl:'fruits[0]'},
        {t:'fruits[-1]     # 마지막', hl:'fruits[-1]'},
        {t:'fruits[1:4]    # 슬라이스', hl:'fruits[1:4]'},
        {t:"fruits.append('f')   # 끝에 추가", hl:'.append'},
        {t:'fruits.pop()         # 끝에서 꺼냄', hl:'.pop'}
      ];
      codePanel(E, W*0.05, H*0.16, W*0.42, code, 'list_basics.py', [null,1,2,3,4][s.step]);

      // 우측: 인덱스 표기된 리스트 셀
      var rx=W*0.55, ry=H*0.20, cw=Math.min(48,W*0.04), ch=36, gap=6;
      ctx.fillStyle=PYL; ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.fillText('list = 순서 있고, 바뀌고, 중복 OK', rx, ry-12);

      var arr=base.slice();
      var hi=-1, hiLo=-1, hiHi=-1;
      if(s.step===1) hi=0;
      else if(s.step===2) hi=arr.length-1;
      else if(s.step===3){ hiLo=1; hiHi=3; }  // 슬라이스 1:4 → 인덱스 1,2,3

      // append/pop 단계: 별도 작업본
      var work=base.slice();
      if(s.step>=4){ work.push('f'); }   // append('f')
      // (pop은 결과만 텍스트로; work엔 append만 적용하여 그림은 6개 표시)

      for(var i=0;i<work.length;i++){
        var inSlice=(i>=hiLo && i<=hiHi && hiLo>=0);
        var isHi=(i===hi);
        var fill='rgba(255,255,255,0.04)', strk='rgba(255,255,255,0.14)', tc='#efe6cf';
        if(isHi){ fill='rgba(255,211,67,0.16)'; strk=PYL; tc=PYL; }
        else if(inSlice){ fill='rgba(126,224,176,0.14)'; strk=GRN; tc=GRN; }
        if(s.step>=4 && i===5){ fill='rgba(122,184,255,0.16)'; strk=BLU; tc=BLU; }   // 새로 추가된 'f'
        cell(ctx, rx+i*(cw+gap), ry, cw, ch, work[i], fill, strk, tc, 15);
        // 양수 인덱스(위)
        ctx.fillStyle=DIM; ctx.font='13px ui-monospace,monospace'; ctx.textAlign='center'; ctx.fillText(i, rx+i*(cw+gap)+cw/2, ry-4);
        // 음수 인덱스(아래)
        ctx.fillStyle=(i===arr.length-1&&s.step===2)?PYL:'#7a7782'; ctx.fillText('-'+(work.length-i), rx+i*(cw+gap)+cw/2, ry+ch+14);
      }
      ctx.fillStyle='#7a7782'; ctx.font='13px sans-serif'; ctx.textAlign='right'; ctx.fillText('음수 인덱스 →', rx-6, ry+ch+14);
      ctx.textAlign='left'; ctx.fillStyle=DIM; ctx.fillText('양수 인덱스 →', rx-86+0, ry-4);

      // 결과 패널
      var oy=ry+ch+44;
      ctx.font='600 15px sans-serif'; ctx.textAlign='left';
      if(s.step===0){ ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.fillText('탭하면 인덱싱 → 슬라이싱 → append/pop 순으로 봅니다.', rx, oy); }
      else if(s.step===1){ ctx.fillStyle=GRN; ctx.fillText("fruits[0]  →  '"+base[0]+"'", rx, oy);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText('인덱스는 0부터 — 첫 원소가 [0]입니다.', rx, oy+22); }
      else if(s.step===2){ ctx.fillStyle=GRN; ctx.fillText("fruits[-1]  →  '"+base[base.length-1]+"'", rx, oy);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText('음수는 뒤에서부터 — [-1]이 마지막, [-2]가 그 앞.', rx, oy+22); }
      else if(s.step===3){ var sl=base.slice(1,4);
        ctx.fillStyle=GRN; ctx.fillText("fruits[1:4]  →  ['"+sl.join("','")+"']", rx, oy);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText('[시작:끝] — 시작 포함, 끝 제외(1,2,3번 = 3개).', rx, oy+22); }
      else { var afterApp=base.concat(['f']), afterPop=afterApp.slice(0,afterApp.length-1);
        ctx.fillStyle=BLU; ctx.fillText("append('f')  →  ['"+afterApp.join("','")+"']", rx, oy);
        ctx.fillStyle=GLD; ctx.fillText("pop()  →  'f' 반환,  남음: ['"+afterPop.join("','")+"']", rx, oy+24);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText('append=끝에 추가, pop=끝에서 꺼내며 반환(스택처럼).', rx, oy+48); }

      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 (인덱싱 → 슬라이싱 → append/pop)', true);
      E.big('리스트(list) — 순서 있는 만능 상자', '리스트는 파이썬에서 가장 많이 쓰는 자료구조입니다. 칸칸이 번호(인덱스)가 붙은 상자 줄이라고 보세요 — 0부터 세고, 뒤에서는 -1부터 셉니다. [a:b]로 한 토막 잘라 오고, append로 끝에 넣고 pop으로 끝에서 꺼냅니다. 화면의 모든 결과는 실제로 그 연산을 돌려 얻은 값입니다.'); }
  },

  // ══════════ 2. 튜플·집합(tuple/set) — 불변·중복없음·합/교집합 ══════════
  { id:'py2_02',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(330+this.s.step*90,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'p = (37.5, 127.0)     # 튜플(불변)', hl:'(37.5, 127.0)'},
        {t:'p[0]                  # 37.5 (읽기만)', hl:'p[0]'},
        {t:'# p[0] = 0  →  TypeError!', dim:true},
        {t:'', dim:true},
        {t:'s = {1, 2, 2, 3, 3, 3}  # 집합', hl:'{1, 2, 2, 3, 3, 3}'},
        {t:'a = {1, 2, 3}; b = {2, 3, 4}', hl:'set'},
        {t:'a | b     # 합집합', hl:'a | b'},
        {t:'a & b     # 교집합', hl:'a & b'}
      ];
      var curMap=[null,1,5,6,7];
      codePanel(E, W*0.05, H*0.15, W*0.43, code, 'tuple_set.py', curMap[s.step]!==undefined?curMap[s.step]:null);

      var rx=W*0.56, gx=rx;
      if(s.step===0){
        // 튜플 = 잠긴 상자
        ctx.fillStyle=PYL; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('튜플 — 한 번 만들면 못 바꿈 (불변)', gx, H*0.20);
        var tup=[37.5,127.0], cw=84, ch=40, ty=H*0.30;
        for(var i=0;i<tup.length;i++){ cell(ctx, gx+i*(cw+8), ty, cw, ch, tup[i], 'rgba(255,211,67,0.10)', PYL, '#efe6cf', 15);
          ctx.fillStyle=DIM; ctx.font='13px ui-monospace,monospace'; ctx.textAlign='center'; ctx.fillText('['+i+']', gx+i*(cw+8)+cw/2, ty-4); }
        // 자물쇠
        ctx.fillStyle=GLD; ctx.font='22px sans-serif'; ctx.textAlign='left'; ctx.fillText('🔒', gx+2*(cw+8)+10, ty+28);
        ctx.fillStyle=GRN; ctx.font='600 14px sans-serif'; ctx.fillText('p[0]  →  '+tup[0]+'  (읽기는 OK)', gx, ty+78);
        ctx.fillStyle=PNK; ctx.font='13px ui-monospace,monospace'; ctx.fillText("p[0] = 0   →   TypeError (변경 불가)", gx, ty+104);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText('좌표·날짜처럼 "바뀌면 안 되는 묶음"에 씁니다.', gx, ty+130);
      } else if(s.step===1){
        // set = 중복 자동 제거
        ctx.fillStyle=PYL; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('집합(set) — 중복은 자동으로 사라짐', gx, H*0.20);
        var inp=[1,2,2,3,3,3];
        // 입력(중복 그대로)
        var cw=40, ch=36, ty=H*0.30;
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('입력 {1,2,2,3,3,3}', gx, ty-6);
        for(var i=0;i<inp.length;i++){ var dup=(inp.indexOf(inp[i])!==i);
          cell(ctx, gx+i*(cw+6), ty, cw, ch, inp[i], dup?'rgba(244,160,192,0.10)':'rgba(255,255,255,0.05)', dup?PNK:'rgba(255,255,255,0.14)', dup?PNK:'#efe6cf', 15); }
        // 결과 set (실제 중복 제거)
        var uniq=[]; inp.forEach(function(v){ if(uniq.indexOf(v)<0) uniq.push(v); });
        var ty2=ty+ch+44;
        ctx.fillStyle=GRN; ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.fillText('결과 set  →  {'+uniq.join(', ')+'}   (3개)', gx, ty2-8);
        for(var j=0;j<uniq.length;j++) cell(ctx, gx+j*(cw+6), ty2, cw, ch, uniq[j], 'rgba(126,224,176,0.14)', GRN, GRN, 15);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText('순서 없음 · 중복 없음 — "있다/없다" 검사가 매우 빠릅니다.', gx, ty2+ch+22);
      } else {
        // 합집합/교집합 벤다이어그램
        ctx.fillStyle=PYL; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('합집합(|)·교집합(&) — 집합 연산', gx, H*0.18);
        var A=[1,2,3], B=[2,3,4];
        var uni=[]; A.concat(B).forEach(function(v){ if(uni.indexOf(v)<0) uni.push(v); }); uni.sort(function(x,y){return x-y;});
        var inter=A.filter(function(v){ return B.indexOf(v)>=0; });
        var cyv=H*0.42, r=Math.min(W*0.075,H*0.16), ax=gx+r*0.95, bx=gx+r*1.75;
        ctx.strokeStyle=BLU; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(ax,cyv,r,0,7); ctx.stroke();
        ctx.strokeStyle=GLD; ctx.beginPath(); ctx.arc(bx,cyv,r,0,7); ctx.stroke();
        ctx.fillStyle=BLU; ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.fillText('a', ax-r*0.7, cyv-r-6);
        ctx.fillStyle=GLD; ctx.fillText('b', bx+r*0.7, cyv-r-6);
        // 원소 배치
        ctx.font='15px ui-monospace,monospace';
        ctx.fillStyle=BLU; ctx.fillText('1', ax-r*0.55, cyv+5);
        ctx.fillStyle=GRN; ctx.fillText('2', (ax+bx)/2-9, cyv+5);
        ctx.fillStyle=GRN; ctx.fillText('3', (ax+bx)/2+9, cyv+5);
        ctx.fillStyle=GLD; ctx.fillText('4', bx+r*0.55, cyv+5);
        // 결과
        var oy=cyv+r+34;
        ctx.textAlign='left'; ctx.font='600 14px sans-serif';
        ctx.fillStyle=PNK; ctx.fillText('a | b  (합집합)  →  {'+uni.join(', ')+'}', gx, oy);
        ctx.fillStyle=GRN; ctx.fillText('a & b  (교집합)  →  {'+inter.join(', ')+'}', gx, oy+26);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText('초록 = 양쪽 모두에 있는 원소(교집합).', gx, oy+50);
      }
      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 (튜플 → set 중복제거 → 합/교집합)', true);
      E.big('튜플·집합 — 불변 묶음과 중복 없는 모음', '튜플은 한 번 만들면 못 바꾸는 리스트입니다 — 좌표나 날짜처럼 "바뀌면 안 되는" 묶음에 딱이죠. 집합(set)은 수학의 집합 그대로 — 순서도 중복도 없고, "이거 있어?"를 눈 깜짝할 새 확인합니다. 합집합 |, 교집합 &도 한 글자면 끝납니다. 화면의 {2,3} 같은 결과는 실제 집합 연산으로 뽑았습니다.'); }
  },

  // ══════════ 3. 딕셔너리(dict) — 키:값·조회·추가·keys/values/items ══════════
  { id:'py2_03',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(340+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 기준 딕트(키→값) — 실제 JS 객체로
      var keys=['수학','영어','과학'], vals=[95,88,73];
      var code=[
        {t:"score = {'수학':95, '영어':88,", hl:'score'},
        {t:"         '과학':73}", dim:false},
        {t:"score['수학']         # 조회", hl:"score['수학']"},
        {t:"score['국어'] = 90    # 추가", hl:"score['국어']"},
        {t:'score.keys()          # 키 목록', hl:'.keys'},
        {t:'score.values()        # 값 목록', hl:'.values'},
        {t:'score.items()         # (키,값) 쌍', hl:'.items'}
      ];
      var curMap=[null,2,3,4];   // step0=없음, step1=조회, step2=추가, step3=keys/values/items
      codePanel(E, W*0.05, H*0.15, W*0.44, code, 'dict_basics.py', curMap[s.step]);

      var rx=W*0.57, gx=rx, ty=H*0.22, kw=72, vw=58, ch=30;
      ctx.fillStyle=PYL; ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.fillText('dict = 키 → 값 (이름표로 찾는 표)', gx, ty-12);

      // 작업본 (추가 단계면 국어 추가)
      var wk=keys.slice(), wv=vals.slice();
      if(s.step>=2){ wk.push('국어'); wv.push(90); }

      // 헤더
      cell(ctx, gx, ty, kw, ch, 'key', 'rgba(255,211,67,0.16)', PYL, PYL, 12.5);
      cell(ctx, gx+kw, ty, vw, ch, 'value', 'rgba(255,211,67,0.16)', PYL, PYL, 12.5);
      for(var i=0;i<wk.length;i++){
        var newRow=(s.step>=2 && i===3);
        var lookup=(s.step===1 && wk[i]==='수학');
        var kf='rgba(122,184,255,0.10)', kc=BLU, vf='rgba(255,255,255,0.05)', vc='#efe6cf';
        if(newRow){ kf='rgba(126,224,176,0.16)'; kc=GRN; vf='rgba(126,224,176,0.12)'; vc=GRN; }
        if(lookup){ kf='rgba(255,211,67,0.18)'; kc=PYL; vf='rgba(255,211,67,0.14)'; vc=PYL; }
        cell(ctx, gx, ty+ch*(i+1), kw, ch, wk[i], kf, newRow?GRN:'rgba(255,255,255,0.12)', kc, 13);
        cell(ctx, gx+kw, ty+ch*(i+1), vw, ch, wv[i], vf, newRow?GRN:'rgba(255,255,255,0.12)', vc, 13);
      }
      var oy=ty+ch*(wk.length+1)+30;
      ctx.textAlign='left';
      if(s.step===0){ ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.fillText('탭하면 조회 → 추가 → keys/values/items 순으로 봅니다.', gx, oy); }
      else if(s.step===1){ ctx.fillStyle=PYL; ctx.font='600 14px sans-serif'; ctx.fillText("score['수학']  →  "+vals[0], gx, oy);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText('키로 값을 즉시 찾습니다 (목록을 훑지 않음).', gx, oy+22); }
      else if(s.step===2){ ctx.fillStyle=GRN; ctx.font='600 14px sans-serif'; ctx.fillText("score['국어'] = 90  →  새 키:값 추가됨", gx, oy);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText('없는 키에 대입하면 바로 새 항목이 생깁니다.', gx, oy+22); }
      else {
        ctx.fillStyle=BLU; ctx.font='13px ui-monospace,monospace'; ctx.fillText('keys():   '+wk.join(', '), gx, oy);
        ctx.fillStyle=PNK; ctx.fillText('values(): '+wv.join(', '), gx, oy+22);
        ctx.fillStyle=GRN; ctx.font='12px ui-monospace,monospace';
        ctx.fillText("items(): "+wk.map(function(k,i){return "('"+k+"',"+wv[i]+")";}).join(' '), gx, oy+44);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText('for k, v in score.items(): 로 한 번에 순회합니다.', gx, oy+68);
      }
      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 (조회 → 추가 → keys/values/items)', true);
      E.big('딕셔너리(dict) — 이름표로 찾는 표', '리스트가 번호로 찾는다면, 딕셔너리는 이름(키)으로 찾습니다. score["수학"]이라고 하면 목록을 처음부터 훑지 않고 곧장 95를 꺼내 옵니다 — 전화번호부에서 이름으로 번호를 찾듯이요. 없는 키에 값을 넣으면 항목이 새로 생기고, keys/values/items로 통째로 순회합니다. JSON·설정·카운팅 등 어디에나 쓰입니다.'); }
  },

  // ══════════ 4. 리스트 컴프리헨션 — [x*x for ...] · 조건부 if ══════════
  { id:'py2_04',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(330+this.s.step*80,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'# for 문 (긴 버전)', dim:true},
        {t:'squares = []', hl:'squares'},
        {t:'for x in range(6):', hl:'range(6)'},
        {t:'    squares.append(x*x)', hl:'x*x'},
        {t:'', dim:true},
        {t:'# 컴프리헨션 (한 줄)', dim:true},
        {t:'[x*x for x in range(6)]', hl:'x*x for x in range(6)'},
        {t:'[x for x in range(6) if x%2==0]', hl:'if x%2==0'}
      ];
      var curMap=[null,6,7];
      codePanel(E, W*0.04, H*0.15, W*0.48, code, 'comprehension.py', curMap[s.step]);

      var gx=W*0.58, ty=H*0.20, cw=Math.min(44,W*0.037), ch=34, gap=6;
      // 입력 range(6)
      ctx.fillStyle=DIM; ctx.font='12px ui-monospace,monospace'; ctx.textAlign='left'; ctx.fillText('range(6) = 0 1 2 3 4 5', gx, ty-8);
      for(var i=0;i<6;i++) cell(ctx, gx+i*(cw+gap), ty, cw, ch, i, 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.14)', '#efe6cf', 14);

      var ty2=ty+ch+50;
      if(s.step===0){
        // for문과 컴프리헨션이 같은 결과임을 강조
        var sq=[]; for(i=0;i<6;i++) sq.push(i*i);   // 실제 계산 [0,1,4,9,16,25]
        ctx.fillStyle=GLD; ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.fillText('두 코드는 똑같은 결과 →  [x*x for x in range(6)]', gx, ty2-10);
        for(i=0;i<sq.length;i++){ cell(ctx, gx+i*(cw+gap), ty2, cw, ch, sq[i], 'rgba(255,211,67,0.12)', PYL, PYL, 14);
          // 화살표 입력 i → i*i
          ctx.strokeStyle='rgba(255,211,67,0.30)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(gx+i*(cw+gap)+cw/2, ty+ch+4); ctx.lineTo(gx+i*(cw+gap)+cw/2, ty2-4); ctx.stroke(); }
        ctx.fillStyle=GRN; ctx.font='13px ui-monospace,monospace'; ctx.fillText('→ ['+sq.join(', ')+']', gx, ty2+ch+24);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText('4줄 for문이 한 줄로 — 읽기 쉽고 빠릅니다.', gx, ty2+ch+46);
      } else if(s.step===1){
        var sq=[]; for(i=0;i<6;i++) sq.push(i*i);
        ctx.fillStyle=GLD; ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.fillText('[x*x for x in range(6)]  — 각 x를 제곱', gx, ty2-10);
        for(i=0;i<sq.length;i++){ cell(ctx, gx+i*(cw+gap), ty2, cw, ch, sq[i], 'rgba(255,211,67,0.12)', PYL, PYL, 14);
          ctx.strokeStyle='rgba(255,211,67,0.30)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(gx+i*(cw+gap)+cw/2, ty+ch+4); ctx.lineTo(gx+i*(cw+gap)+cw/2, ty2-4); ctx.stroke();
          ctx.fillStyle=DIM; ctx.font='12px ui-monospace,monospace'; ctx.textAlign='center'; ctx.fillText(i+'²', gx+i*(cw+gap)+cw/2, ty+ch+24); }
        ctx.textAlign='left'; ctx.fillStyle=GRN; ctx.font='13px ui-monospace,monospace'; ctx.fillText('→ ['+sq.join(', ')+']', gx, ty2+ch+24);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText('[식  for  변수 in 반복] — 모든 원소를 변환.', gx, ty2+ch+46);
      } else {
        // 조건부: 짝수만
        var even=[]; for(i=0;i<6;i++) if(i%2===0) even.push(i);   // [0,2,4]
        ctx.fillStyle=GLD; ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.fillText('[x for x in range(6) if x%2==0]  — 짝수만 통과', gx, ty2-10);
        // 입력 위에 통과/탈락 표시
        ctx.font='13px sans-serif'; ctx.textAlign='center';
        for(i=0;i<6;i++){ ctx.fillStyle=(i%2===0)?GRN:PNK; ctx.fillText(i%2===0?'✓':'✗', gx+i*(cw+gap)+cw/2, ty+ch+18); }
        // 결과
        ctx.textAlign='left';
        for(var j=0;j<even.length;j++) cell(ctx, gx+j*(cw+gap), ty2, cw, ch, even[j], 'rgba(126,224,176,0.14)', GRN, GRN, 14);
        ctx.fillStyle=GRN; ctx.font='13px ui-monospace,monospace'; ctx.fillText('→ ['+even.join(', ')+']', gx, ty2+ch+24);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText('if 조건을 붙이면 통과한 원소만 남깁니다(필터).', gx, ty2+ch+46);
      }
      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 (for문 대비 → 변환 → if 필터)', true);
      E.big('리스트 컴프리헨션 — 한 줄로 리스트 만들기', '"0부터 5까지 각각 제곱해 모아라"를 for문으로 쓰면 네 줄이지만, [x*x for x in range(6)]이면 한 줄입니다. 마치 영어처럼 읽히죠 — "x의 제곱을, range의 각 x에 대해". 뒤에 if를 붙이면 조건에 맞는 것만 거릅니다. 화면의 [0,1,4,9,16,25]·[0,2,4]는 실제로 그 식을 돌려 얻은 값입니다.'); }
  },

  // ══════════ 5. 자료구조 고르기 — list vs tuple vs dict vs set + 중첩 ══════════
  { id:'py2_05',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(340+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      if(s.step===0){
        // 특성 비교표
        var cols=['','순서','변경','중복','찾기 키'];
        var rows=[
          {n:'list  []',  c:PYL, v:['있음','가능','허용','번호(인덱스)'], use:'순서대로 쌓는 항목들'},
          {n:'tuple ()',  c:BLU, v:['있음','불가','허용','번호(인덱스)'], use:'바뀌면 안 되는 묶음'},
          {n:'dict  {k:v}',c:GRN, v:['삽입순','가능','키 유일','이름(키)'], use:'이름표로 찾는 짝'},
          {n:'set   {}',  c:PNK, v:['없음','가능','금지','—(멤버십)'], use:'중복 제거·있다/없다'}
        ];
        var gx=W*0.06, gy=H*0.20, colw=[118,70,70,70,118], ch=40;
        // 헤더
        var cx=gx;
        for(var c=0;c<cols.length;c++){ cell(ctx, cx, gy, colw[c], 32, cols[c], 'rgba(255,211,67,0.14)', PYL, PYL, 12.5); cx+=colw[c]; }
        for(var r=0;r<rows.length;r++){
          cx=gx; var R=rows[r], y=gy+32+r*ch;
          cell(ctx, cx, y, colw[0], ch, R.n, 'rgba(255,255,255,0.05)', R.c, R.c, 13); cx+=colw[0];
          for(var k=0;k<R.v.length;k++){ cell(ctx, cx, y, colw[k+1], ch, R.v[k], 'rgba(255,255,255,0.03)', 'rgba(255,255,255,0.12)', '#efe6cf', 12); cx+=colw[k+1]; }
        }
        // 용도 열(표 오른쪽)
        var ux=gx+colw.reduce(function(a,b){return a+b;},0)+18;
        ctx.fillStyle=DIM; ctx.font='600 12px sans-serif'; ctx.textAlign='left'; ctx.fillText('언제 쓰나', ux, gy+22);
        for(r=0;r<rows.length;r++){ ctx.fillStyle=rows[r].c; ctx.font='12.5px sans-serif'; ctx.fillText(rows[r].use, ux, gy+32+r*ch+ch/2+4); }
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.textAlign='left'; ctx.fillText('고르는 법: 순서가 필요? → list/tuple.  이름으로 찾기? → dict.  유일성·집합연산? → set.', gx, gy+32+4*ch+34);
      } else {
        // 중첩 자료구조 — dict 안에 list, list 안에 dict
        var code=[
          {t:'students = [', hl:'students'},
          {t:"  {'name':'민지', 'subjects':['수학','미술']},", hl:"'subjects'"},
          {t:"  {'name':'준호', 'subjects':['과학']}", dim:false},
          {t:']', dim:false},
          {t:'', dim:true},
          {t:"students[0]['subjects'][1]", hl:"['subjects'][1]"},
          {t:"#  →  '미술'", dim:true}
        ];
        codePanel(E, W*0.05, H*0.16, W*0.46, code, 'nested.py', null);
        // 실제 중첩 구조 (JS로 그대로 구성 → 결과 실계산)
        var students=[ {name:'민지', subjects:['수학','미술']}, {name:'준호', subjects:['과학']} ];
        var got=students[0].subjects[1];   // '미술'
        var gx=W*0.56, ty=H*0.20;
        ctx.fillStyle=PYL; ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.fillText('중첩 — 자료구조 안에 자료구조', gx, ty-2);
        // 리스트[ ] 박스
        ctx.strokeStyle=PYL; ctx.lineWidth=1.5; roundRect(ctx, gx, ty+10, W*0.38, H*0.46, 10); ctx.stroke();
        ctx.fillStyle=PYL; ctx.font='13px ui-monospace,monospace'; ctx.fillText('list students', gx+8, ty+24);
        for(var i=0;i<students.length;i++){
          var by=ty+34+i*(H*0.20);
          ctx.strokeStyle=GRN; ctx.lineWidth=1.2; roundRect(ctx, gx+14, by, W*0.34, H*0.16, 8); ctx.stroke();
          ctx.fillStyle=GRN; ctx.font='12.5px ui-monospace,monospace'; ctx.textAlign='left'; ctx.fillText('dict ['+i+']', gx+22, by+15);
          ctx.fillStyle=BLU; ctx.font='12.5px ui-monospace,monospace'; ctx.fillText("name: '"+students[i].name+"'", gx+22, by+34);
          // subjects 리스트
          var subj=students[i].subjects, sx=gx+22, sy=by+44, cw=58, ch=24;
          ctx.fillStyle=PNK; ctx.font='12.5px ui-monospace,monospace'; ctx.fillText('subjects:', sx, sy+15);
          for(var j=0;j<subj.length;j++){ var hiCell=(i===0 && j===1);
            cell(ctx, sx+74+j*(cw+6), sy, cw, ch, "'"+subj[j]+"'", hiCell?'rgba(255,211,67,0.20)':'rgba(255,255,255,0.05)', hiCell?PYL:'rgba(255,255,255,0.14)', hiCell?PYL:'#efe6cf', 11.5); }
        }
        // 인덱싱 경로 결과
        var oy=ty+10+H*0.46+24;
        ctx.fillStyle=GLD; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText("students[0]['subjects'][1]  →  '"+got+"'", gx, oy);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('대괄호를 이어 붙여 깊이 들어갑니다 (JSON 구조 그대로).', gx, oy+20);
      }
      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 (특성 비교표 → 중첩 자료구조)', true);
      E.big('어떤 자료구조를 고를까', '네 자료구조는 쓰임이 다릅니다. 순서대로 쌓고 바꿀 거면 list, 바뀌면 안 되는 묶음이면 tuple, 이름표로 찾으면 dict, 유일성·집합연산이면 set입니다. 실전 데이터(JSON·API 응답)는 이들이 겹겹이 중첩된 형태죠 — 리스트 안에 딕셔너리, 그 안에 또 리스트. 대괄호를 이어 붙여 원하는 깊이까지 곧장 꺼냅니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
