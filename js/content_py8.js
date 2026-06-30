/* 파이썬 제8장 — pandas: 표 데이터 (DataFrame·Series · 선택·필터 · groupby 집계 · 결측치 정제 · ML 준비)
   동작(behavior)만. 텍스트=content/py8.json. 엔진 js/engine.js 공유. 색: Python=골드/노랑 테마.
   골든룰: 화면의 모든 표·필터 결과·groupby 집계·결측 채움값은 JS에서 실제로 계산한 값(베껴 박지 않음).
   왼쪽=진짜 pandas 코드(import pandas as pd), 오른쪽=DataFrame 표와 연산 결과를 실측해 시각화.
   "엑셀의 파이썬 버전, 데이터 정제의 주력" — pandas는 표 데이터 분석의 사실상 표준. */
(function(){
  var PYL='#ffd343', PYB='#6cb6e8', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', PNK='#f4a0c0', DIM='#9b99a3', RED='#f0888a';

  // ───────── 등폭 코드 패널 렌더러: lines=[{t:'코드', hl:'tok'}|문자열]. hl 토큰만 노랑 강조 ─────────
  function codePanel(E, x, y, w, lines, title){
    var ctx=E.ctx, lh=21, pad=14, top=y, n=lines.length, ht=n*lh+pad*2+(title?26:0);
    ctx.fillStyle='rgba(255,255,255,0.035)'; ctx.strokeStyle='rgba(255,211,67,0.30)'; ctx.lineWidth=1;
    roundRect(ctx,x,top,w,ht,10); ctx.fill(); ctx.stroke();
    var cy=top+pad+(title?26:0);
    if(title){ ctx.fillStyle=PYL; ctx.font='600 12px sans-serif'; ctx.textAlign='left'; ctx.fillText(title, x+pad, top+pad+12); }
    ctx.font='13px ui-monospace,Menlo,Consolas,monospace'; ctx.textAlign='left';
    for(var i=0;i<n;i++){
      var L=lines[i], t=(typeof L==='string')?L:L.t, hl=(typeof L==='object')?L.hl:null;
      var ty=cy+i*lh+11;
      if(hl && t.indexOf(hl)>=0){
        var a=t.split(hl), pre=a[0], post=a.slice(1).join(hl);
        ctx.fillStyle=DIM; ctx.fillText(pre, x+pad, ty);
        var wpre=ctx.measureText(pre).width;
        ctx.fillStyle=PYL; ctx.fillText(hl, x+pad+wpre, ty);
        var whl=ctx.measureText(hl).width;
        ctx.fillStyle=DIM; ctx.fillText(post, x+pad+wpre+whl, ty);
      } else {
        ctx.fillStyle=((typeof L==='object'&&L.dim)?DIM:'#efe7cf'); ctx.fillText(t, x+pad, ty);
      }
    }
    return top+ht;
  }
  function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  // 작은 셀 격자(표/행렬 공용)
  function cell(ctx,x,y,w,h,txt,fill,stroke,tcol,fs){
    ctx.fillStyle=fill||'rgba(255,255,255,0.04)'; ctx.fillRect(x,y,w,h);
    ctx.strokeStyle=stroke||'rgba(255,255,255,0.12)'; ctx.lineWidth=1; ctx.strokeRect(x,y,w,h);
    if(txt!=null){ ctx.fillStyle=tcol||'#efe7cf'; ctx.font=(fs||13)+'px ui-monospace,Menlo,monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(''+txt, x+w/2, y+h/2+1); ctx.textBaseline='alphabetic'; }
  }
  // 라벨 달린 DataFrame 표(인덱스 열 포함) 렌더러 → 표 높이 반환
  function dframe(ctx, x, y, cols, rows, opt){
    opt=opt||{}; var ch=opt.ch||26, idxw=opt.idxw||34, cw=opt.cw, hi=opt.hi, accent=opt.accent||PYL;
    // 인덱스 헤더(빈칸)
    cell(ctx,x,y,idxw,ch,'', 'rgba(255,255,255,0.02)','rgba(255,255,255,0.10)',DIM,12);
    var cx=x+idxw;
    for(var c=0;c<cols.length;c++){ cell(ctx,cx,y,cw[c],ch,cols[c],'rgba(255,211,67,0.16)',accent,accent,12.5); cx+=cw[c]; }
    for(var r=0;r<rows.length;r++){
      var lit = hi ? hi(rows[r],r) : true;          // 행 강조 여부
      cell(ctx,x,y+ch*(r+1),idxw,ch, r, 'rgba(255,255,255,0.02)','rgba(255,255,255,0.10)', DIM, 11.5);
      cx=x+idxw;
      for(c=0;c<cols.length;c++){
        var v=rows[r][c];
        var na=(v==null||v==='NaN');
        var fill = lit ? (na?'rgba(240,136,138,0.12)':'rgba(255,255,255,0.05)') : 'rgba(255,255,255,0.02)';
        var tc   = na ? RED : (lit?'#efe7cf':DIM);
        cell(ctx,cx,y+ch*(r+1),cw[c],ch, na?'NaN':v, fill,'rgba(255,255,255,0.12)', tc, 12.5);
        cx+=cw[c];
      }
    }
    return ch*(rows.length+1);
  }

  var scenes = [

  // ══════════ 1. DataFrame · Series — pd.DataFrame(dict) / read_csv ══════════
  { id:'py8_01',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 결정적 작은 표: 학생 5명 (이름·나이·점수)
      var cols=['name','age','score'];
      var rows=[ ['Ann',23,88], ['Bob',31,72], ['Cho',27,95], ['Dan',45,60], ['Eli',29,81] ];

      var code=[
        {t:'import pandas as pd', hl:'pandas'},
        {t:'', dim:true},
        {t:'data = {', },
        {t:"  'name': ['Ann','Bob',...],", hl:"'name'"},
        {t:"  'age':  [23, 31, 27, ...],", hl:"'age'"},
        {t:"  'score':[88, 72, 95, ...]}", hl:"'score'"},
        {t:'df = pd.DataFrame(data)', hl:'DataFrame'},
        {t:'df.head()      # 앞 5행 보기', hl:'head'}
      ];
      codePanel(E, W*0.04, H*0.14, W*0.44, code, 'dataframe_basics.py');

      var tx=W*0.53, ty=H*0.18, cw=[64,46,52];
      ctx.fillStyle=PYL; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
      ctx.fillText('DataFrame = 라벨 달린 2차원 표 (행=샘플, 열=특징)', tx, ty-10);
      var th = dframe(ctx, tx, ty, cols, rows, {cw:cw});

      var oy=ty+th+30;
      if(s.step===0){
        ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('각 열(column)이 하나의 Series — 같은 형(dtype)의 1차원 배열입니다.', tx, oy);
        ctx.fillText('탭하면 한 열을 Series로 꺼내고, 모양(shape)을 봅니다.', tx, oy+20);
      } else if(s.step===1){
        // 한 열 = Series 강조
        ctx.fillStyle=GLD; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText("df['score']  →  Series (이름표 + 값)", tx, oy);
        var sy=oy+12, scol=rows.map(function(r){return r[2];});
        cell(ctx,tx,sy,46,24,'idx','rgba(255,255,255,0.02)','rgba(255,255,255,0.10)',DIM,11.5);
        cell(ctx,tx+46,sy,60,24,'score','rgba(255,211,67,0.16)',PYL,PYL,12.5);
        for(var i=0;i<scol.length;i++){
          cell(ctx,tx,sy+24*(i+1),46,24,i,'rgba(255,255,255,0.02)','rgba(255,255,255,0.10)',DIM,11.5);
          cell(ctx,tx+46,sy+24*(i+1),60,24,scol[i],'rgba(126,224,176,0.10)',GRN,'#efe7cf',12.5);
        }
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('dtype: int64  ·  길이 '+scol.length, tx, sy+24*(scol.length+1)+18);
      } else {
        // shape / 통계 요약 (실측)
        ctx.fillStyle=GLD; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('df.shape  ·  df.describe()  (실제 계산값)', tx, oy);
        var ages=rows.map(function(r){return r[1];}), scs=rows.map(function(r){return r[2];});
        function mean(a){ var t=0; a.forEach(function(v){t+=v;}); return t/a.length; }
        function mn(a){ return Math.min.apply(null,a); } function mx(a){ return Math.max.apply(null,a); }
        var ix=tx, iy=oy+14, c0=70,c1=80,c2=80, rh=24;
        var hd=['', 'age', 'score'];
        cell(ctx,ix,iy,c0,rh,hd[0],'rgba(255,211,67,0.16)',PYL,PYL,12);
        cell(ctx,ix+c0,iy,c1,rh,hd[1],'rgba(255,211,67,0.16)',PYL,PYL,12);
        cell(ctx,ix+c0+c1,iy,c2,rh,hd[2],'rgba(255,211,67,0.16)',PYL,PYL,12);
        var stat=[ ['mean', mean(ages).toFixed(1), mean(scs).toFixed(1)],
                   ['min',  mn(ages),               mn(scs)],
                   ['max',  mx(ages),               mx(scs)] ];
        for(var k=0;k<stat.length;k++){
          cell(ctx,ix,iy+rh*(k+1),c0,rh,stat[k][0],'rgba(255,255,255,0.03)','rgba(255,255,255,0.10)',DIM,12);
          cell(ctx,ix+c0,iy+rh*(k+1),c1,rh,stat[k][1],'rgba(255,255,255,0.05)','rgba(255,255,255,0.12)','#efe7cf',12.5);
          cell(ctx,ix+c0+c1,iy+rh*(k+1),c2,rh,stat[k][2],'rgba(255,255,255,0.05)','rgba(255,255,255,0.12)','#efe7cf',12.5);
        }
        ctx.fillStyle=GRN; ctx.font='600 13px sans-serif'; ctx.fillText('df.shape = (5, 3)   ← 5행 3열', ix, iy+rh*(stat.length+1)+20);
      }
      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 (표 → Series → shape·통계)', true);
      E.big('pandas — 표 데이터의 표준', 'pandas의 DataFrame은 엑셀 시트를 파이썬으로 옮긴 것입니다 — 행은 샘플, 열은 특징이고, 각 열은 같은 형의 값을 담은 Series죠. CSV·엑셀·데이터베이스에서 한 줄로 읽어 들여, head()로 앞을 엿보고 describe()로 통계를 즉시 봅니다. AI에 쓰이는 데이터는 거의 다 여기서 출발합니다.'); }
  },

  // ══════════ 2. 선택·필터 — df['col'] · df[df.age>30] · .loc/.iloc ══════════
  { id:'py8_02',
    enter:function(E){ var self=this; this.s={th:30};
      E.controls('<div class="ctrl"><label>나이 임계값 (df.age &gt; ?)</label><input type="range" id="th" min="20" max="45" step="1" value="30"><output id="tho">30</output></div>');
      E.bind('#th','input',function(e){ self.s.th=+e.target.value; document.getElementById('tho').textContent=e.target.value; E.blip(360,0.06); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var cols=['name','age','score'];
      var rows=[ ['Ann',23,88], ['Bob',31,72], ['Cho',27,95], ['Dan',45,60], ['Eli',29,81] ];
      var th=s.th;

      var code=[
        {t:'df[\'age\']            # 한 열', hl:"df['age']"},
        {t:'', dim:true},
        {t:'mask = df.age > '+th, hl:'df.age > '+th},
        {t:'df[mask]            # 불리언 필터', hl:'df[mask]'},
        {t:'', dim:true},
        {t:'df.loc[0, \'name\']   # 라벨 위치', hl:'.loc'},
        {t:'df.iloc[0, 0]       # 정수 위치', hl:'.iloc'}
      ];
      codePanel(E, W*0.04, H*0.13, W*0.44, code, 'select_filter.py');

      // 불리언 마스크 실측
      var mask=rows.map(function(r){ return r[1]>th; });
      var pass=mask.filter(Boolean).length;

      var tx=W*0.54, ty=H*0.16, cw=[64,46,52];
      ctx.fillStyle=PYL; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
      ctx.fillText('df[df.age > '+th+']  —  조건 통과 행만 강조', tx, ty-10);
      // 강조: 통과 행은 초록 테두리
      var th2 = dframe(ctx, tx, ty, cols, rows, {cw:cw, hi:function(r,i){ return mask[i]; }, accent:PYL });
      // 마스크 열(True/False)을 표 오른쪽에 붙임
      var mx=tx+34+cw[0]+cw[1]+cw[2]+10, ch=26;
      cell(ctx,mx,ty,58,ch,'mask','rgba(122,184,255,0.16)',BLU,BLU,12);
      for(var i=0;i<rows.length;i++){
        var on=mask[i];
        cell(ctx,mx,ty+ch*(i+1),58,ch, on?'True':'False',
             on?'rgba(126,224,176,0.14)':'rgba(255,255,255,0.02)', on?GRN:'rgba(255,255,255,0.12)', on?GRN:DIM, 12);
      }

      var oy=ty+th2+34;
      ctx.fillStyle=GRN; ctx.font='600 15px sans-serif'; ctx.textAlign='left';
      ctx.fillText('통과: '+pass+'행 / 5행', tx, oy);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
      var names=rows.filter(function(r){return r[1]>th;}).map(function(r){return r[0];});
      ctx.fillText('남는 행 → ['+names.join(', ')+']', tx, oy+22);
      ctx.fillStyle=BLU; ctx.font='12.5px sans-serif';
      ctx.fillText('.loc=라벨로, .iloc=정수 위치로 행·열을 콕 집어 꺼냅니다.', tx, oy+46);

      E.tapHint(W/2, H*0.95, '슬라이더로 나이 임계값을 바꿔 통과 행을 보세요', true);
      E.big('선택과 필터 — 원하는 행·열만 콕', '표 전체에서 필요한 부분만 꺼내는 게 분석의 절반입니다. df[\'age\']로 한 열을 뽑고, df[df.age>30]처럼 조건을 적으면 pandas가 각 행에 True/False ‘마스크’를 만들어 참인 행만 남깁니다 — for문 한 줄도 없이요. 위치로 집을 땐 .loc(라벨)와 .iloc(정수)를 씁니다. 슬라이더로 임계값을 바꾸면 통과하는 행이 실시간으로 바뀌죠.'); }
  },

  // ══════════ 3. 집계·groupby — df.groupby('city').mean()/sum() ══════════
  { id:'py8_03',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(340+this.s.step*90,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 도시·매출 — 결정적 6행
      var cols=['city','sales'];
      var rows=[ ['Seoul',30], ['Busan',20], ['Seoul',50], ['Busan',10], ['Seoul',40], ['Busan',24] ];

      var code=[
        {t:"df.groupby('city')", hl:'groupby'},
        {t:"  .sales.sum()       # 합", hl:'sum'},
        {t:'', dim:true},
        {t:"df.groupby('city')", hl:'groupby'},
        {t:"  .sales.mean()      # 평균", hl:'mean'},
        {t:'', dim:true},
        {t:"df.groupby('city')", hl:'groupby'},
        {t:"  .sales.count()     # 개수", hl:'count'}
      ];
      codePanel(E, W*0.04, H*0.13, W*0.44, code, 'groupby_agg.py');

      var tx=W*0.54, ty=H*0.15, cw=[72,56];
      ctx.fillStyle=PYL; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
      ctx.fillText('원본 표 — 도시별 매출', tx, ty-10);
      // groupby 키별 색
      var keyCol={ Seoul:BLU, Busan:PNK };
      dframe(ctx, tx, ty, cols, rows, {cw:cw, ch:24, hi:function(r,i){return true;},
        accent:PYL });

      // 실제 집계
      var g={}; rows.forEach(function(r){ if(!g[r[0]]) g[r[0]]={sum:0,n:0}; g[r[0]].sum+=r[1]; g[r[0]].n++; });
      var keys=Object.keys(g);
      var op = s.step===0?'sum':(s.step===1?'mean':'count');
      var label = s.step===0?"sum() — 도시별 합계":(s.step===1?"mean() — 도시별 평균":"count() — 도시별 행 수");

      var gx=tx+cw[0]+cw[1]+34+50, gy=ty;
      // 화살표
      ctx.strokeStyle='rgba(255,211,67,0.5)'; ctx.lineWidth=2; ctx.beginPath();
      ctx.moveTo(gx-44, gy+50); ctx.lineTo(gx-12, gy+50); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(gx-18,gy+45); ctx.lineTo(gx-12,gy+50); ctx.lineTo(gx-18,gy+55); ctx.fillStyle='rgba(255,211,67,0.7)'; ctx.fill();
      ctx.fillStyle=GLD; ctx.font='600 12px sans-serif'; ctx.textAlign='center'; ctx.fillText('groupby', gx-28, gy+40);

      ctx.fillStyle=GLD; ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.fillText(label, gx, gy-10);
      var ch=26;
      cell(ctx,gx,gy,72,ch,'city','rgba(255,211,67,0.16)',PYL,PYL,12.5);
      cell(ctx,gx+72,gy,64,ch,'sales','rgba(255,211,67,0.16)',PYL,PYL,12.5);
      for(var k=0;k<keys.length;k++){
        var key=keys[k], v;
        if(op==='sum') v=g[key].sum;
        else if(op==='mean') v=(g[key].sum/g[key].n).toFixed(1);
        else v=g[key].n;
        cell(ctx,gx,gy+ch*(k+1),72,ch,key, 'rgba(255,255,255,0.05)', keyCol[key]||BLU, keyCol[key]||BLU, 12.5);
        cell(ctx,gx+72,gy+ch*(k+1),64,ch,v, 'rgba(126,224,176,0.12)', GRN, GRN, 13);
      }
      // 계산식 노출 (검산)
      var ey=gy+ch*(keys.length+1)+22;
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left';
      if(op==='sum'){
        ctx.fillText('Seoul = 30+50+40 = '+g.Seoul.sum, gx, ey);
        ctx.fillText('Busan = 20+10+24 = '+g.Busan.sum, gx, ey+18);
      } else if(op==='mean'){
        ctx.fillText('Seoul = 120/3 = '+(g.Seoul.sum/g.Seoul.n).toFixed(1), gx, ey);
        ctx.fillText('Busan = 54/3 = '+(g.Busan.sum/g.Busan.n).toFixed(1), gx, ey+18);
      } else {
        ctx.fillText('Seoul 3행, Busan 3행', gx, ey);
      }
      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 (sum → mean → count)', true);
      E.big('groupby — 묶고, 집계하라', '“도시별 평균 매출은?” 같은 질문이 분석의 핵심입니다. groupby는 같은 키(city)를 가진 행을 묶고, 각 묶음에 sum·mean·count 같은 집계를 한 번에 적용합니다 — 이른바 split-apply-combine. 엑셀의 피벗테이블을 코드 한 줄로 끝내는 셈이죠. 화면의 모든 합·평균은 실제로 더해 계산한 값입니다.'); }
  },

  // ══════════ 4. 결측치·정제 — isna / fillna / dropna (평균 채움 실계산) ══════════
  { id:'py8_04',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(330+this.s.step*90,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 더러운 표: 결측(NaN) 포함. age 일부 누락
      var cols=['name','age','score'];
      var raw=[ ['Ann',23,88], ['Bob',null,72], ['Cho',27,null], ['Dan',45,60], ['Eli',null,81] ];

      var code=[
        {t:'df.isna()           # 결측 위치', hl:'isna'},
        {t:'df.isna().sum()     # 열별 개수', hl:'isna'},
        {t:'', dim:true},
        {t:'m = df.age.mean()   # 평균(결측 제외)', hl:'mean'},
        {t:'df.age.fillna(m)    # 평균으로 채움', hl:'fillna'},
        {t:'', dim:true},
        {t:'df.dropna()         # 결측 행 제거', hl:'dropna'}
      ];
      codePanel(E, W*0.04, H*0.13, W*0.44, code, 'clean_missing.py');

      // age 평균(결측 제외) 실측
      var ageVals=raw.filter(function(r){return r[1]!=null;}).map(function(r){return r[1];});
      var ageMean = ageVals.reduce(function(a,b){return a+b;},0)/ageVals.length; // (23+45)/2 = 34
      var cw=[64,46,52];

      var tx=W*0.54, ty=H*0.16;
      if(s.step===0){
        ctx.fillStyle=PYL; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('원본(더러운 표) — NaN = 빠진 값', tx, ty-10);
        var h=dframe(ctx, tx, ty, cols, raw, {cw:cw});
        // 열별 결측 개수(실측)
        var miss=[0,0,0]; raw.forEach(function(r){ for(var c=0;c<3;c++) if(r[c]==null) miss[c]++; });
        ctx.fillStyle=RED; ctx.font='600 13px sans-serif'; ctx.fillText('df.isna().sum() →  name:'+miss[0]+'  age:'+miss[1]+'  score:'+miss[2], tx, ty+h+26);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText('탭 = 평균으로 채우기(fillna) → 행 제거(dropna)', tx, ty+h+48);
      } else if(s.step===1){
        ctx.fillStyle=PYL; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText("df.age.fillna(mean)  —  빈 age를 평균 "+ageMean.toFixed(0)+"로 채움", tx, ty-10);
        var filled=raw.map(function(r){ return [r[0], r[1]==null?ageMean:r[1], r[2]==null?'NaN':r[2]]; });
        var h2=dframe(ctx, tx, ty, cols, filled, {cw:cw, hi:function(r,i){ return true; }});
        ctx.fillStyle=GRN; ctx.font='600 13px sans-serif'; ctx.fillText('age 평균 = (23+45)/2 = '+ageMean.toFixed(0)+'  → 빈 칸을 이 값으로', tx, ty+h2+24);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('(score의 NaN은 아직 남아 있음 — 열마다 따로 정제)', tx, ty+h2+44);
      } else {
        ctx.fillStyle=PYL; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('df.dropna()  —  하나라도 NaN인 행 통째로 제거', tx, ty-10);
        var clean=raw.filter(function(r){ return r.every(function(v){return v!=null;}); });
        var h3=dframe(ctx, tx, ty, cols, clean, {cw:cw, accent:GRN});
        ctx.fillStyle=GRN; ctx.font='600 14px sans-serif'; ctx.fillText('5행 → '+clean.length+'행 (깨끗한 표)', tx, ty+h3+26);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('Bob·Cho·Eli는 NaN이 있어 빠지고, Ann·Dan만 남았습니다.', tx, ty+h3+46);
      }
      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 (결측 보기 → fillna → dropna)', true);
      E.big('결측치 정제 — 데이터는 늘 더럽다', '현실의 데이터엔 빈칸(NaN)이 가득합니다 — 입력 누락, 센서 고장, 응답 거부. 모델에 넣기 전 반드시 손봐야 하죠. isna()로 어디가 비었는지 찾고, fillna로 평균·중앙값 같은 값으로 메우거나, dropna로 해당 행을 통째로 버립니다. 채워 넣을 평균은 결측을 빼고 실제로 계산한 값입니다 — 이 ‘청소’가 분석 시간의 대부분을 차지합니다.'); }
  },

  // ══════════ 5. 머신러닝 준비 — X·y 분리, df.values → NumPy (pandas→sklearn 다리) ══════════
  { id:'py8_05',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(360+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 특징 2개 + 라벨 1개
      var cols=['hours','sleep','pass'];
      var data=[ [5, 7, 1], [2, 5, 0], [8, 8, 1], [1, 4, 0], [6, 6, 1] ];

      var code=[
        {t:'X = df[[\'hours\',\'sleep\']]   # 특징', hl:'X'},
        {t:'y = df[\'pass\']             # 라벨', hl:'y'},
        {t:'', dim:true},
        {t:'X = X.values   # → NumPy 배열', hl:'.values'},
        {t:'y = y.values', hl:'.values'},
        {t:'', dim:true},
        {t:'from sklearn... import Model', hl:'sklearn'},
        {t:'model.fit(X, y)   # 학습!', hl:'.fit'}
      ];
      codePanel(E, W*0.04, H*0.14, W*0.46, code, 'ml_prep.py');

      var tx=W*0.55, ty=H*0.16, ch=26;
      if(s.step===0){
        // 전체 표에서 X(특징 2열)와 y(라벨 1열)를 색으로 분리
        ctx.fillStyle=PYL; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('한 표를  특징 X  +  라벨 y  로 나눕니다', tx, ty-10);
        var cw=[58,56,52], x=tx;
        // 헤더
        cell(ctx,x,ty,34,ch,'','rgba(255,255,255,0.02)','rgba(255,255,255,0.10)',DIM,11.5);
        var cx=x+34, hcol=[GLD,GLD,PNK];
        for(var c=0;c<3;c++){ cell(ctx,cx,ty,cw[c],ch,cols[c],'rgba(255,255,255,0.06)',hcol[c],hcol[c],12.5); cx+=cw[c]; }
        for(var r=0;r<data.length;r++){
          cell(ctx,x,ty+ch*(r+1),34,ch,r,'rgba(255,255,255,0.02)','rgba(255,255,255,0.10)',DIM,11.5);
          cx=x+34;
          for(c=0;c<3;c++){
            var isLabel=(c===2);
            cell(ctx,cx,ty+ch*(r+1),cw[c],ch,data[r][c],
              isLabel?'rgba(244,160,192,0.12)':'rgba(255,211,67,0.08)',
              isLabel?'rgba(244,160,192,0.4)':'rgba(255,211,67,0.4)',
              '#efe7cf',12.5);
            cx+=cw[c];
          }
        }
        var by=ty+ch*(data.length+1)+24;
        ctx.fillStyle=GLD; ctx.font='600 13px sans-serif'; ctx.fillText('X = 노랑 두 열 (입력 특징)', tx, by);
        ctx.fillStyle=PNK; ctx.fillText('y = 분홍 한 열 (맞힐 정답)', tx, by+22);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('규칙: 특징은 여러 열(2D), 라벨은 한 열(1D).', tx, by+44);
      } else {
        // df.values → NumPy 2D 배열 + sklearn 다리
        ctx.fillStyle=PYL; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('df.values  →  순수 숫자 격자 (NumPy ndarray)', tx, ty-10);
        // X 행렬 (5x2)
        var cw2=54, x=tx;
        ctx.fillStyle=GLD; ctx.font='600 12px sans-serif'; ctx.fillText('X  (5×2)', x, ty-26+14);
        for(var r=0;r<data.length;r++) for(var c=0;c<2;c++)
          cell(ctx,x+c*cw2,ty+r*ch,cw2,ch,data[r][c],'rgba(255,211,67,0.10)',GLD,'#efe7cf',13);
        // y 벡터 (5x1)
        var yx=x+2*cw2+24;
        ctx.fillStyle=PNK; ctx.font='600 12px sans-serif'; ctx.fillText('y  (5,)', yx, ty-26+14);
        for(r=0;r<data.length;r++)
          cell(ctx,yx,ty+r*ch,46,ch,data[r][2],'rgba(244,160,192,0.12)',PNK,'#efe7cf',13);

        // 다리 화살표 → sklearn
        var ay=ty+ch*data.length+38;
        ctx.fillStyle=GRN; ctx.font='600 15px sans-serif'; ctx.fillText('model.fit(X, y)', tx, ay);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
        ctx.fillText('pandas로 정제·분리한 표가, 이제 NumPy 배열이 되어', tx, ay+24);
        ctx.fillText('scikit-learn·PyTorch 모델로 곧장 들어갑니다.', tx, ay+42);
        // 흐름 칩
        var chips=['pandas DataFrame','.values','NumPy array','model.fit'], chx=tx, chy=ay+58, cc=[PYL,DIM,BLU,GRN];
        ctx.font='11.5px sans-serif';
        for(var i=0;i<chips.length;i++){
          var wch=ctx.measureText(chips[i]).width+16;
          ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.strokeStyle=cc[i]; ctx.lineWidth=1; roundRect(ctx,chx,chy,wch,20,5); ctx.fill(); ctx.stroke();
          ctx.fillStyle=cc[i]; ctx.textAlign='left'; ctx.fillText(chips[i], chx+8, chy+14);
          chx+=wch+ (i<chips.length-1?18:0);
          if(i<chips.length-1){ ctx.strokeStyle=DIM; ctx.beginPath(); ctx.moveTo(chx-14,chy+10); ctx.lineTo(chx-4,chy+10); ctx.stroke(); ctx.beginPath(); ctx.moveTo(chx-8,chy+6); ctx.lineTo(chx-4,chy+10); ctx.lineTo(chx-8,chy+14); ctx.fillStyle=DIM; ctx.fill(); }
        }
      }
      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 (X·y 분리 → df.values → fit)', true);
      E.big('머신러닝 준비 — pandas에서 모델로', '모델은 표가 아니라 숫자 격자를 먹습니다. 그래서 마지막 단계는 표를 둘로 가르는 일 — 입력이 될 특징들을 X(여러 열의 2차원), 맞힐 정답을 y(한 열의 1차원)로 나눕니다. df.values로 NumPy 배열로 바꾸면, scikit-learn이든 PyTorch든 model.fit(X, y) 한 줄로 학습이 시작되죠. pandas는 바로 이 다리, 날것의 데이터와 학습 사이를 잇는 주력입니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
