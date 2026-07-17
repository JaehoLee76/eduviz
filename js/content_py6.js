/* 파이썬 제6장 — NumPy 기초: ndarray 생성 · 인덱싱/슬라이싱 · 브로드캐스팅 · 벡터화 vs 반복 · 유용한 연산(축)
   동작(behavior)만. 텍스트=content/py6.json. 엔진 js/engine.js 공유. 색: Python=골드 테마(#ffd343).
   골든룰: 화면의 배열 값·슬라이스·브로드캐스트·축별 합/평균은 전부 JS에서 실제로 계산해 표시(베껴 박지 않음).
   왼쪽=진짜 numpy 코드 패널 + 줄강조, 오른쪽=실제 배열/연산 결과를 격자로 시각화. NumPy 배열은 AI 데이터의 기본 그릇. */
(function(){
  var PYL='#ffd343', PYB='#6cb6e8', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', PNK='#f4a0c0', DIM='#9b99a3';

  function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  // 등폭 코드 패널 렌더러: lines=[{t:'코드', hl:'tok', dim:bool, on:bool}|문자열]. hl 토큰만 골드 강조. on=true면 현재 실행 줄(왼쪽 마커).
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
      var isAct=(actLine!=null && i===actLine);
      if(isAct || (typeof L==='object' && L.on)){ ctx.fillStyle='rgba(255,211,67,0.16)'; ctx.fillRect(x+4, ty-13, w-8, 18);
        ctx.fillStyle=PYL; ctx.fillRect(x+4, ty-13, 3, 18); }
      if(hl && t.indexOf(hl)>=0){
        var a=t.split(hl), pre=a[0], post=a.slice(1).join(hl);
        ctx.fillStyle=DIM; ctx.fillText(pre, x+pad, ty);
        var wpre=ctx.measureText(pre).width;
        ctx.fillStyle=PYL; ctx.fillText(hl, x+pad+wpre, ty);
        var whl=ctx.measureText(hl).width;
        ctx.fillStyle=DIM; ctx.fillText(post, x+pad+wpre+whl, ty);
      } else {
        ctx.fillStyle=(L.dim?DIM:'#e6e1cf'); ctx.fillText(t, x+pad, ty);
      }
    }
    return top+ht;
  }

  // 작은 셀 격자(배열/행렬 공용)
  function cell(ctx,x,y,w,h,txt,fill,stroke,tcol,fs){
    ctx.fillStyle=fill||'rgba(255,255,255,0.04)'; ctx.fillRect(x,y,w,h);
    ctx.strokeStyle=stroke||'rgba(255,255,255,0.12)'; ctx.lineWidth=1; ctx.strokeRect(x,y,w,h);
    if(txt!=null){ ctx.fillStyle=tcol||'#e6e1cf'; ctx.font=(fs||13)+'px ui-monospace,Menlo,monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(''+txt, x+w/2, y+h/2+1); ctx.textBaseline='alphabetic'; }
  }
  // 1D 배열 행: 라벨 + 셀들. 반환 = 다음 y.
  function arrRow(ctx, rx, y, arr, col, lab, opt){ opt=opt||{};
    var cw=opt.cw||46, ch=opt.ch||30, gap=opt.gap||7;
    if(lab!=null){ ctx.fillStyle=col; ctx.font='600 13px sans-serif'; ctx.textAlign='right'; ctx.fillText(lab, rx-10, y+ch/2+5); }
    for(var i=0;i<arr.length;i++){ var hi=opt.hi&&opt.hi(i);
      cell(ctx, rx+i*(cw+gap), y, cw, ch, (typeof arr[i]==='number'&&arr[i]%1!==0)?(+arr[i].toFixed(2)):arr[i],
        hi?'rgba(126,224,176,0.16)':'rgba(255,211,67,0.06)', hi?GRN:col, '#e6e1cf', opt.fs||14); }
    return y+ch;
  }

  var scenes = [

  // ══════════ 1. ndarray 생성 — array · zeros · ones · arange · linspace ══════════
  { id:'py6_01',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; E.blip(340+this.s.step*60,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 다섯 가지 생성법 — 실제로 계산
      var makers=[
        {hl:'np.array', code:'a = np.array([1, 2, 3, 4])',  val:[1,2,3,4],                       note:'파이썬 리스트를 ndarray로 — 같은 형(dtype)의 수를 격자에 담습니다.'},
        {hl:'np.zeros', code:'z = np.zeros(5)',             val:[0,0,0,0,0],                     note:'0으로 채운 길이 5 배열 — 누적·버퍼의 출발점.'},
        {hl:'np.ones',  code:'o = np.ones(4)',              val:[1,1,1,1],                       note:'1로 채운 배열 — 상수·마스크의 기본.'},
        {hl:'np.arange',code:'r = np.arange(0, 10, 2)',     val:[0,2,4,6,8],                     note:'start..stop(미포함)을 step 간격으로 — range의 배열판.'},
        {hl:'np.linspace',code:'L = np.linspace(0, 1, 5)',  val:[0,0.25,0.5,0.75,1],             note:'0~1을 5개로 등분(끝점 포함) — 그래프 x축에 단골.'}
      ];
      // 코드 패널: 모든 줄, 현재 줄 강조
      var code=[{t:'import numpy as np', hl:'numpy'}, {t:'', dim:true}];
      for(var m=0;m<makers.length;m++) code.push({t:makers[m].code, hl:makers[m].hl, on:(m===s.step)});
      codePanel(E, W*0.05, H*0.16, W*0.43, code, 'create.py');

      // 결과 격자
      var cur=makers[s.step], rx=W*0.62, ry=H*0.30;
      ctx.fillStyle=PYL; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('생성된 배열 (실제 값)', rx-60, ry-26);
      arrRow(ctx, rx, ry, cur.val, PYB, null, {cw:Math.min(50,W*0.04)});
      ctx.fillStyle=GRN; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
      ctx.fillText('shape = ('+cur.val.length+',)   ·   dtype = '+(s.step>=3 && s.step===4?'float64':(s.step>=1&&s.step<=2?'float64':'int64')), rx-60, ry+58);
      ctx.fillStyle=DIM; ctx.font='13px sans-serif';
      // note 줄바꿈
      var note=cur.note, max=46, words=note.split(' '), ln='', ly=ry+90;
      for(var w2=0;w2<words.length;w2++){ var tn=ln+(ln?' ':'')+words[w2]; if(tn.length>max){ ctx.fillText(ln, rx-60, ly); ly+=20; ln=words[w2]; } else ln=tn; }
      ctx.fillText(ln, rx-60, ly);
      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 (array → zeros → ones → arange → linspace)', true);
      E.big('ndarray 만들기 — AI 데이터의 기본 그릇', 'NumPy의 ndarray는 같은 형의 수를 격자에 빽빽이 담은 배열입니다. 리스트로 직접 만들거나(np.array), 0·1로 채우거나(zeros·ones), 규칙으로 찍어내죠(arange·linspace). AI에서 다루는 이미지·소리·표·가중치는 결국 모두 이 ndarray로 들어옵니다 — 데이터의 첫 번째 그릇이에요.'); }
  },

  // ══════════ 2. 인덱싱·슬라이싱 — a[1:3] · 2D a[i,j] · 불리언 마스킹 a[a>0] ══════════
  { id:'py6_02',
    enter:function(E){ var self=this; this.s={lo:1, hi:4};
      E.controls('<div class="ctrl"><label>슬라이스 시작 i</label><input type="range" id="lo" min="0" max="6" step="1" value="1"><output id="loo">1</output>'
        +'<label style="margin-left:14px">끝 j (미포함)</label><input type="range" id="hi" min="1" max="7" step="1" value="4"><output id="hio">4</output></div>');
      E.bind('#lo','input',function(e){ self.s.lo=+e.target.value; if(self.s.lo>=self.s.hi){ self.s.hi=self.s.lo+1; var h=document.getElementById('hi'); if(h){h.value=self.s.hi;} var ho=document.getElementById('hio'); if(ho)ho.textContent=self.s.hi; }
        document.getElementById('loo').textContent=e.target.value; E.blip(360,0.05); });
      E.bind('#hi','input',function(e){ self.s.hi=+e.target.value; if(self.s.hi<=self.s.lo){ self.s.lo=self.s.hi-1; var l=document.getElementById('lo'); if(l){l.value=self.s.lo;} var lo2=document.getElementById('loo'); if(lo2)lo2.textContent=self.s.lo; }
        document.getElementById('hio').textContent=e.target.value; E.blip(320,0.05); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var a=[10,11,12,13,14,15,16], lo=s.lo, hi=Math.max(lo+1,s.hi);
      var sliced=a.slice(lo,hi);
      var code=[
        {t:'a = np.arange(10, 17)', hl:'arange'},
        {t:'#   [10 11 12 13 14 15 16]', dim:true},
        {t:'a['+lo+':'+hi+']        # 슬라이스', hl:'a['+lo+':'+hi+']', on:true},
        {t:'', dim:true},
        {t:'M = a.reshape(...)     # 2D 예시', hl:'reshape'},
        {t:'M[1, 2]   # 2행 3열', hl:'M[1, 2]'},
        {t:'', dim:true},
        {t:'a[a > 13]   # 불리언 마스킹', hl:'a[a > 13]'}
      ];
      codePanel(E, W*0.04, H*0.14, W*0.44, code, 'index.py');

      var rx=W*0.62, ry=H*0.16, cw=Math.min(42,W*0.034);
      // (가) 1D 슬라이스 — 선택 셀 강조 + 인덱스
      ctx.fillStyle=PYL; ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.fillText('a['+lo+':'+hi+']  →  실제 선택', rx-70, ry-28);
      // 인덱스 라벨
      ctx.fillStyle=DIM; ctx.font='12px ui-monospace,monospace'; ctx.textAlign='center';
      for(var i=0;i<a.length;i++) ctx.fillText(i, rx+i*(cw+5)+cw/2, ry-12);
      arrRow(ctx, rx, ry, a, PYB, null, {cw:cw, gap:5, fs:12, hi:function(i){ return i>=lo && i<hi; }});
      ctx.fillStyle=GRN; ctx.font='12px ui-monospace,monospace'; ctx.textAlign='left';
      ctx.fillText('= ['+sliced.join(' ')+']   ('+sliced.length+'개)', rx, ry+44);

      // (나) 2D 인덱싱 M[1,2]
      var M=[[10,11,12],[13,14,15]];   // a를 (2,3)으로 본 예
      var my=ry+78;
      ctx.fillStyle=PYL; ctx.font='600 13px sans-serif'; ctx.fillText('M[1, 2]  →  2행·3열 = '+M[1][2], rx-70, my-8);
      for(var r=0;r<2;r++) for(var c=0;c<3;c++){
        var sel=(r===1&&c===2);
        cell(ctx, rx+c*(cw+5), my+r*(30+5), cw, 30, M[r][c], sel?'rgba(126,224,176,0.20)':'rgba(255,211,67,0.06)', sel?GRN:PYB, '#e6e1cf', 13);
      }

      // (다) 불리언 마스킹 a[a>13]
      var by=my+2*35+24, mask=a.map(function(v){return v>13;}), picked=a.filter(function(v){return v>13;});
      ctx.fillStyle=PYL; ctx.font='600 13px sans-serif'; ctx.fillText('a[a > 13]  →  조건 True인 원소만', rx-70, by-8);
      arrRow(ctx, rx, by, mask.map(function(b){return b?'T':'F';}), PNK, null, {cw:cw, gap:5, fs:12, hi:function(i){ return mask[i]; }});
      ctx.fillStyle=GRN; ctx.font='12px ui-monospace,monospace'; ctx.textAlign='left';
      ctx.fillText('= ['+picked.join(' ')+']', rx, by+44);
      E.tapHint(W/2, H*0.95, '슬라이더로 슬라이스 범위 a[i:j]를 바꿔 보세요 (j는 미포함)', true);
      E.big('인덱싱 · 슬라이싱 · 불리언 마스킹', '배열에서 원하는 부분만 꺼내는 세 가지 길입니다. a[i:j]는 i부터 j 바로 앞까지 잘라 오고(끝은 미포함!), 2차원은 M[행, 열]로 콕 집습니다. 가장 강력한 건 불리언 마스킹 — a[a>13]처럼 ‘조건이 참인 원소만’ 한 번에 골라내죠. 데이터 정제의 절반은 이 한 줄로 끝납니다.'); }
  },

  // ══════════ 3. 브로드캐스팅 — (2,3)+(3,) · 스칼라*배열 ══════════
  { id:'py6_03',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(340+this.s.step*90,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var M=[[0,1,2],[3,4,5]], v=[10,20,30], k=3;
      var code=[
        {t:'M = np.arange(6).reshape(2,3)', hl:'reshape'},
        {t:'#   [[0 1 2]', dim:true},
        {t:'#    [3 4 5]]', dim:true},
        {t:'v = np.array([10, 20, 30])', hl:'np.array'},
        {t:'', dim:true},
        {t:'M + v       # (2,3)+(3,)', hl:'M + v', on:(s.step===0)},
        {t:'M * 3       # 스칼라 곱', hl:'M * 3', on:(s.step===1)},
        {t:'v - 5       # 스칼라 뺄셈', hl:'v - 5', on:(s.step===2)}
      ];
      codePanel(E, W*0.04, H*0.15, W*0.44, code, 'broadcast.py');

      var rx=W*0.60, cw=Math.min(48,W*0.04), ch=32, gap=6;
      function grid(x,y,G,col){ for(var r=0;r<G.length;r++) for(var c=0;c<G[0].length;c++)
        cell(ctx, x+c*(cw+gap), y+r*(ch+gap), cw, ch, G[r][c], 'rgba(255,211,67,0.06)', col, '#e6e1cf', 14); return y+G.length*(ch+gap); }

      ctx.textAlign='left';
      if(s.step===0){
        // M + v : v가 각 행에 복제되어 더해짐
        ctx.fillStyle=PYL; ctx.font='600 14px sans-serif'; ctx.fillText('M (2,3)', rx, H*0.18-8);
        grid(rx, H*0.18, M, PYB);
        ctx.fillStyle=BLU; ctx.font='600 14px sans-serif'; ctx.fillText('+  v (3,) — 모든 행에 퍼짐', rx, H*0.18+2*(ch+gap)+24);
        arrRow(ctx, rx, H*0.18+2*(ch+gap)+34, v, BLU, null, {cw:cw, ch:ch, gap:gap});
        var R=M.map(function(row){ return row.map(function(e,c){ return e+v[c]; }); });
        ctx.fillStyle=GRN; ctx.font='600 14px sans-serif'; ctx.fillText('=  M + v  (실제 결과)', rx, H*0.18+3*(ch+gap)+62);
        grid(rx, H*0.18+3*(ch+gap)+72, R, GRN);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('각 원소: M[r][c] + v[c] — 행 (3,)이 자동 복제', rx, H*0.18+5*(ch+gap)+86);
      } else if(s.step===1){
        ctx.fillStyle=PYL; ctx.font='600 14px sans-serif'; ctx.fillText('M (2,3)', rx, H*0.20-8);
        grid(rx, H*0.20, M, PYB);
        var R2=M.map(function(row){ return row.map(function(e){ return e*k; }); });
        ctx.fillStyle=GRN; ctx.font='600 14px sans-serif'; ctx.fillText('×  3  →  M * 3 (스칼라가 모든 원소로)', rx, H*0.20+2*(ch+gap)+30);
        grid(rx, H*0.20+2*(ch+gap)+40, R2, GRN);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('스칼라 3 = (1,)이 (2,3) 전체로 브로드캐스트', rx, H*0.20+4*(ch+gap)+54);
      } else {
        ctx.fillStyle=PYL; ctx.font='600 14px sans-serif'; ctx.fillText('v (3,)', rx, H*0.30-8);
        arrRow(ctx, rx, H*0.30, v, PYB, null, {cw:cw, ch:ch, gap:gap});
        var R3=v.map(function(e){ return e-5; });
        ctx.fillStyle=GRN; ctx.font='600 14px sans-serif'; ctx.fillText('−  5  →  v - 5 (각 원소에서 5 뺌)', rx, H*0.30+ch+26);
        arrRow(ctx, rx, H*0.30+ch+36, R3, GRN, null, {cw:cw, ch:ch, gap:gap});
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('반복문 없이 배열 전체가 한 번에 — 이것이 벡터화', rx, H*0.30+2*ch+60);
      }
      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 (행렬+벡터 → 스칼라곱 → 스칼라뺄셈)', true);
      E.big('브로드캐스팅 — 모양이 달라도 맞춰 계산', '모양이 다른 배열끼리 더할 때, NumPy는 작은 쪽을 자동으로 ‘늘려’ 모양을 맞춥니다. (2,3) 행렬에 길이 3 벡터를 더하면 그 벡터가 두 행 모두에 복제되어 더해지고, 스칼라 하나는 배열 전체로 퍼지죠. 덕분에 ‘각 행에 평균 빼기’ 같은 연산이 반복문 없이 한 줄로 끝납니다.'); }
  },

  // ══════════ 4. 벡터화 vs 반복 — for 합 vs np.sum · 원소별 a*b ══════════
  { id:'py6_04',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(340+this.s.step*120,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var a=[1,2,3,4,5], b=[10,20,30,40,50];
      // 실제 계산
      var loopSum=0; for(var i=0;i<a.length;i++) loopSum+=a[i];
      var npSum=a.reduce(function(p,c){return p+c;},0);
      var prod=a.map(function(v,i){return v*b[i];});
      var code=[
        {t:'a = np.array([1,2,3,4,5])', hl:'np.array'},
        {t:'b = np.array([10,20,30,40,50])', hl:'np.array'},
        {t:'', dim:true},
        {t:'# 느린 길 — 파이썬 반복문', dim:true},
        {t:'tot = 0', on:(s.step===0)},
        {t:'for x in a: tot += x', hl:'for x in a', on:(s.step===0)},
        {t:'', dim:true},
        {t:'# 빠른 길 — 벡터화', dim:true},
        {t:'a.sum()        # 같은 결과', hl:'.sum', on:(s.step===0)},
        {t:'a * b          # 원소별 곱', hl:'a * b', on:(s.step===1)}
      ];
      codePanel(E, W*0.04, H*0.13, W*0.46, code, 'vectorize.py');

      var rx=W*0.58, ry=H*0.18, cw=Math.min(44,W*0.036);
      ctx.textAlign='left';
      if(s.step===0){
        // 합: for vs sum — 같은 값
        ctx.fillStyle=PYB; ctx.font='600 13px sans-serif'; ctx.fillText('a', rx-22, ry+18);
        arrRow(ctx, rx, ry, a, PYB, null, {cw:cw, gap:6});
        ctx.fillStyle=DIM; ctx.font='12px ui-monospace,monospace';
        ctx.fillText('반복문: 0+1+2+3+4+5 = '+loopSum, rx, ry+58);
        ctx.fillStyle=GRN; ctx.font='600 16px sans-serif';
        ctx.fillText('a.sum() = '+npSum, rx, ry+88);
        ctx.fillStyle=(loopSum===npSum?GRN:PNK); ctx.font='600 14px sans-serif';
        ctx.fillText(loopSum===npSum? '✓ 두 결과 동일 — 값은 같다' : '✗', rx, ry+114);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('하지만 sum()은 루프를 C에서 한 번에 돌려 훨씬 빠릅니다.', rx, ry+142);
        ctx.fillText('백만 원소면 반복문보다 수십~수백 배 빠르죠.', rx, ry+162);
        // 속도 막대(개념적 — 상대 비교)
        var sy=ry+186, bw=W*0.30;
        ctx.fillStyle=PNK; ctx.fillRect(rx, sy, bw, 16); ctx.fillStyle='#1a1a1a'; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('  for 루프 (느림)', rx+4, sy+12);
        ctx.fillStyle=GRN; ctx.fillRect(rx, sy+24, bw*0.10, 16); ctx.fillStyle=GRN; ctx.fillText('  np.sum (≈10× 이상 빠름)', rx+bw*0.10+6, sy+36);
      } else {
        // 원소별 곱
        ctx.fillStyle=PYB; ctx.font='600 13px sans-serif'; ctx.fillText('a', rx-22, ry+18);
        arrRow(ctx, rx, ry, a, PYB, null, {cw:cw, gap:6});
        ctx.fillStyle=BLU; ctx.font='600 13px sans-serif'; ctx.fillText('b', rx-22, ry+30+18);
        arrRow(ctx, rx, ry+36, b, BLU, null, {cw:cw, gap:6});
        ctx.fillStyle=GRN; ctx.font='600 14px sans-serif'; ctx.fillText('a * b  (위아래 짝끼리 곱 — 실제 결과)', rx, ry+90);
        arrRow(ctx, rx, ry+100, prod, GRN, null, {cw:cw, gap:6});
        ctx.fillStyle=DIM; ctx.font='12px ui-monospace,monospace';
        ctx.fillText('1·10, 2·20, 3·30, 4·40, 5·50 = '+prod.join(', '), rx, ry+148);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('* 는 행렬곱이 아니라 원소별 곱(elementwise)입니다.', rx, ry+172);
      }
      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 (for vs sum → 원소별 곱 a*b)', true);
      E.big('벡터화 — 같은 결과, 훨씬 빠르게', 'a를 한 원소씩 더하는 파이썬 for 루프와 a.sum()은 같은 답을 줍니다. 하지만 sum()은 그 반복을 C로 짜인 내부에서 한 번에 돌려요 — 파이썬 인터프리터를 매번 거치지 않으니 수십, 수백 배 빠르죠. 곱셈도 마찬가지로 a*b 한 줄이면 모든 원소가 동시에 곱해집니다. AI가 거대한 데이터를 다룰 수 있는 비결이 바로 이 벡터화입니다.'); }
  },

  // ══════════ 5. 유용한 연산 — sum/mean/max · 축(axis) · reshape ══════════
  { id:'py6_05',
    enter:function(E){ var self=this; this.s={axis:0};
      E.controls('<div class="ctrl"><label>축 axis</label><input type="range" id="ax" min="-1" max="1" step="1" value="0"><output id="axo">0</output> <span style="opacity:.6">(-1=전체 · 0=열↓ · 1=행→)</span></div>');
      E.bind('#ax','input',function(e){ self.s.axis=+e.target.value; document.getElementById('axo').textContent=e.target.value; E.blip(340,0.05); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, ax=s.axis;
      var M=[[1,2,3],[4,5,6]];   // (2,3)
      // 실제 축별 합 계산
      var total=0; M.forEach(function(r){ r.forEach(function(e){ total+=e; }); });
      var col=[0,0,0]; for(var r=0;r<2;r++) for(var c=0;c<3;c++) col[c]+=M[r][c];   // axis=0 → 길이3
      var row=M.map(function(r){ return r.reduce(function(p,c){return p+c;},0); });   // axis=1 → 길이2
      var axStr = ax<0?'M.sum()':('M.sum(axis='+ax+')');
      var code=[
        {t:'M = np.arange(1,7).reshape(2,3)', hl:'reshape'},
        {t:'#   [[1 2 3]', dim:true},
        {t:'#    [4 5 6]]', dim:true},
        {t:'', dim:true},
        {t:'M.sum()         # 전체 합', hl:'M.sum()', on:(ax<0)},
        {t:'M.sum(axis=0)   # 열 방향 ↓', hl:'axis=0', on:(ax===0)},
        {t:'M.sum(axis=1)   # 행 방향 →', hl:'axis=1', on:(ax===1)},
        {t:'', dim:true},
        {t:'M.mean(), M.max()  # 평균·최대', hl:'.mean'}
      ];
      codePanel(E, W*0.04, H*0.15, W*0.45, code, 'reduce.py');

      // 행렬 그리기 + 축 합 강조
      var rx=W*0.60, ry=H*0.26, cw=Math.min(50,W*0.042), ch=36, gap=6;
      ctx.textAlign='left'; ctx.fillStyle=PYL; ctx.font='600 14px sans-serif'; ctx.fillText('M (2,3)  ·  '+axStr, rx, ry-12);
      for(var rr=0;rr<2;rr++) for(var cc=0;cc<3;cc++){
        var lit = ax<0 ? true : (ax===0 ? false : false); // 전체일 때만 전부 밝게; 축은 합 셀로 강조
        cell(ctx, rx+cc*(cw+gap), ry+rr*(ch+gap), cw, ch, M[rr][cc], 'rgba(255,211,67,0.06)', PYB, '#e6e1cf', 15);
      }
      var gridR = ry+2*(ch+gap);
      if(ax<0){
        ctx.fillStyle=GRN; ctx.font='600 17px sans-serif'; ctx.fillText('M.sum() = '+total+'  (모든 원소: 1+2+3+4+5+6)', rx, gridR+30);
        ctx.fillStyle=DIM; ctx.font='13px sans-serif';
        ctx.fillText('M.mean() = '+(total/6).toFixed(2)+'   ·   M.max() = 6', rx, gridR+56);
        ctx.fillText('축을 안 주면 배열 전체를 하나의 수로 줄입니다.', rx, gridR+80);
      } else if(ax===0){
        // 열 합 — 각 열 아래에 합 셀
        ctx.fillStyle=GLD; ctx.font='12px sans-serif'; ctx.fillText('axis=0 → 행을 가로질러 세로(↓)로 합산, 결과 길이 3', rx, gridR+24);
        for(var c2=0;c2<3;c2++) cell(ctx, rx+c2*(cw+gap), gridR+34, cw, ch, col[c2], 'rgba(126,224,176,0.18)', GRN, GRN, 15);
        // 화살표 ↓
        ctx.strokeStyle=GRN; ctx.lineWidth=2;
        for(c2=0;c2<3;c2++){ var x0=rx+c2*(cw+gap)+cw/2; ctx.beginPath(); ctx.moveTo(x0, ry+2*ch+4); ctx.lineTo(x0, gridR+30); ctx.stroke(); }
        ctx.fillStyle=GRN; ctx.font='600 14px ui-monospace,monospace'; ctx.fillText('= ['+col.join(' ')+']   (1+4, 2+5, 3+6)', rx, gridR+34+ch+24);
      } else {
        ctx.fillStyle=GLD; ctx.font='12px sans-serif'; ctx.fillText('axis=1 → 열을 가로질러 가로(→)로 합산, 결과 길이 2', rx, gridR+24);
        for(var r2=0;r2<2;r2++) cell(ctx, rx+3*(cw+gap)+18, ry+r2*(ch+gap), cw, ch, row[r2], 'rgba(126,224,176,0.18)', GRN, GRN, 15);
        ctx.strokeStyle=GRN; ctx.lineWidth=2;
        for(r2=0;r2<2;r2++){ var y0=ry+r2*(ch+gap)+ch/2; ctx.beginPath(); ctx.moveTo(rx+3*(cw+gap)-2, y0); ctx.lineTo(rx+3*(cw+gap)+16, y0); ctx.stroke(); }
        ctx.fillStyle=GRN; ctx.font='600 14px ui-monospace,monospace'; ctx.fillText('= ['+row.join(' ')+']   (1+2+3, 4+5+6)', rx, gridR+40);
      }
      E.tapHint(W/2, H*0.95, '슬라이더로 축(axis)을 바꿔 보세요 — 전체 · 열↓ · 행→', true);
      E.big('유용한 연산과 축(axis)', 'sum·mean·max는 배열을 하나의 수로 ‘줄입니다’. 핵심은 axis 인자예요 — axis=0이면 행을 가로질러 세로로(열별 합), axis=1이면 열을 가로질러 가로로(행별 합) 줄입니다. 데이터가 (샘플 × 특징) 표라면, 특징별 평균은 axis=0, 샘플별 합은 axis=1이죠. reshape로 같은 데이터의 모양을 바꿔 가며 이 축을 자유자재로 다루는 게 NumPy의 진짜 힘입니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
