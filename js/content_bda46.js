/* 빅데이터 분석 제46장 — 실기 240분 ① 탐색부터 변수 준비까지 (ADP 실기 대비)
   동작(behavior)만. 텍스트=content/bda46.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 화면의 모든 수(행/열 개수·결측 개수·IQR 경계·왜도·표준화값·분할 비율·배점 등)는
   아래 고정 데이터로부터 이 파일 로드 시 실제 계산(하드코딩 금지). 난수(Math.random) 절대 금지 —
   설비 고장 예측 데이터(40행)는 고정 시드 LCG로 생성 후 특정 인덱스에 결측·경계값을 결정적으로 주입.
   47장(content_bda47.js)이 같은 데이터를 이어받아 모델링한다 — 두 파일은 같은 상수를 각자 보유
   (전역 공유 금지 지침에 따름). 데이터·분할 로직을 바꾸면 반드시 47장 쪽도 동일하게 맞출 것. */
(function(){
  var ROSE='#ff7ab8', GRN='#7ee0b0', BLU='#7ab8ff', GLD='#ffd27a', DIM='#9b99a3', RED='#f0888a', TXT='#eadfe8', PUR='#c79dff', ORG='#ffb27a';

  function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function codePanel(E, x, y, w, lines, title, actLine){
    var ctx=E.ctx, lh=19, pad=12, top=y, n=lines.length, ht=n*lh+pad*2+(title?24:0);
    ctx.fillStyle='rgba(255,255,255,0.035)'; ctx.strokeStyle='rgba(255,122,184,0.30)'; ctx.lineWidth=1;
    roundRect(ctx,x,top,w,ht,10); ctx.fill(); ctx.stroke();
    var cy=top+pad+(title?24:0);
    if(title){ ctx.fillStyle=ROSE; ctx.font='600 11.5px ui-monospace,Menlo,monospace'; ctx.textAlign='left'; ctx.fillText(title, x+pad, top+pad+11); }
    ctx.font='12px ui-monospace,Menlo,Consolas,monospace'; ctx.textAlign='left';
    for(var i=0;i<n;i++){
      var L=lines[i], t=(typeof L==='string')?L:L.t, hl=(typeof L==='object')?L.hl:null;
      var ty=cy+i*lh+11;
      if(actLine!=null && (actLine===i || (Array.isArray(actLine)&&actLine.indexOf(i)>=0))){ ctx.fillStyle='rgba(255,122,184,0.16)'; ctx.fillRect(x+4, cy+i*lh+1, w-8, lh-2); ctx.fillStyle=ROSE; ctx.fillRect(x+4, cy+i*lh+1, 3, lh-2); }
      if(hl && t.indexOf(hl)>=0){
        var a=t.split(hl), pre=a[0], post=a.slice(1).join(hl);
        ctx.fillStyle=DIM; ctx.fillText(pre, x+pad, ty);
        var wpre=ctx.measureText(pre).width;
        ctx.fillStyle=ROSE; ctx.fillText(hl, x+pad+wpre, ty);
        var whl=ctx.measureText(hl).width;
        ctx.fillStyle=DIM; ctx.fillText(post, x+pad+wpre+whl, ty);
      } else {
        ctx.fillStyle=(L.dim?DIM:'#efe4ea'); ctx.fillText(t, x+pad, ty);
      }
    }
    return top+ht;
  }

  function LCG(seed){ var s=seed>>>0; return function(){ s=(1103515245*s+12345)>>>0; return s/4294967296; }; }
  function mean(a){ var f=a.filter(function(v){return v!=null;}); return f.reduce(function(s,v){return s+v;},0)/f.length; }
  function std(a){ var f=a.filter(function(v){return v!=null;}); var m=mean(f); return Math.sqrt(f.reduce(function(s,v){return s+(v-m)*(v-m);},0)/f.length); }
  function skew(a){ var f=a.filter(function(v){return v!=null;}); var m=mean(f),s=std(f); return f.reduce(function(sum,v){return sum+Math.pow((v-m)/s,3);},0)/f.length; }
  function median(a){ var f=a.filter(function(v){return v!=null;}).slice().sort(function(x,y){return x-y;}); var n=f.length; return n%2? f[(n-1)/2] : (f[n/2-1]+f[n/2])/2; }
  function iqrBounds(a){
    var f=a.filter(function(v){return v!=null;}).slice().sort(function(x,y){return x-y;});
    function pct(p){ var idx=(f.length-1)*p, lo=Math.floor(idx), hi=Math.ceil(idx); if(lo===hi) return f[lo]; return f[lo]+(f[hi]-f[lo])*(idx-lo); }
    var q1=pct(0.25), q3=pct(0.75), iqr=q3-q1;
    return {q1:q1, q3:q3, iqr:iqr, lo:q1-1.5*iqr, hi:q3+1.5*iqr};
  }

  // ══════════ 고정 데이터: 설비 고장 예측 40행 (46·47장 공유, 각자 보유) ══════════
  // 열: 가동시간(h)·온도(℃)·진동(mm/s)·압력(bar)·정비경과일(일)·교대조(A/B/C)·고장여부(0/1)
  var GRP46=[
    {n:32, fail:0, hBase:700, hScale:650, tempC:58, tempR:13, vibC:1.10, vibR:0.85, pressC:6.0, pressR:2.1, maintC:15, maintR:15, seedH:601, seedT:501},
    {n:8,  fail:1, hBase:1800,hScale:1150,tempC:72, tempR:13, vibC:2.90, vibR:1.00, pressC:6.3, pressR:1.6, maintC:30, maintR:18, seedH:602, seedT:502}
  ];
  var HOURS46=[],TEMP46=[],VIB46=[],PRESS46=[],MAINT46=[],SHIFTI46=[],FAIL46=[];
  GRP46.forEach(function(g){
    var rngH=LCG(g.seedH), rng=LCG(g.seedT);
    for(var i=0;i<g.n;i++){
      var uh=rngH();
      var h=g.hBase - g.hScale*Math.log(1-uh*0.965); // 지수분포 꼴(오른쪽 긴 꼬리) — 46.4 로그변환 예제용
      var t=g.tempC+(rng()*2-1)*g.tempR;
      var v=g.vibC+(rng()*2-1)*g.vibR;
      var p=g.pressC+(rng()*2-1)*g.pressR;
      var m=g.maintC+(rng()*2-1)*g.maintR;
      HOURS46.push(Math.round(h));
      TEMP46.push(+Math.max(35,t).toFixed(1));
      VIB46.push(+Math.max(0.15,v).toFixed(2));
      PRESS46.push(+Math.max(1.5,p).toFixed(2));
      MAINT46.push(Math.max(0,Math.round(m)));
      SHIFTI46.push(Math.floor(rng()*3)); // 0=A,1=B,2=C
      FAIL46.push(g.fail);
    }
  });
  var N46=HOURS46.length; // 40
  var ORD46=[]; for(var _i=0;_i<N46;_i++) ORD46.push(_i);
  (function(){ var rng=LCG(909090); for(var i=N46-1;i>0;i--){ var j=Math.floor(rng()*(i+1)); var t=ORD46[i]; ORD46[i]=ORD46[j]; ORD46[j]=t; } })();
  function reorder46(a){ return ORD46.map(function(idx){ return a[idx]; }); }
  HOURS46=reorder46(HOURS46); TEMP46=reorder46(TEMP46); VIB46=reorder46(VIB46); PRESS46=reorder46(PRESS46);
  MAINT46=reorder46(MAINT46); SHIFTI46=reorder46(SHIFTI46); FAIL46=reorder46(FAIL46);
  // 의도적 경계 사례(실무 데이터의 흔한 함정) — idx7: 진동은 정상 범위지만 다른 원인으로 실제 고장,
  // idx10: 고장은 아니지만 진동 센서만 튄 노이즈. 47장 모델링에서 이 두 사례가 그대로 쓰인다.
  VIB46[7]=1.75; VIB46[10]=2.15;
  var SHIFT_NAME46=['A','B','C'];

  // ── 결측 주입(고정 인덱스 5건, 4개 열) ──
  var MISSING46=[[3,'HOURS'],[11,'TEMP'],[19,'VIB'],[24,'HOURS'],[30,'PRESS']];
  var HOURS_M46=HOURS46.slice(), TEMP_M46=TEMP46.slice(), VIB_M46=VIB46.slice(), PRESS_M46=PRESS46.slice();
  MISSING46.forEach(function(m){
    var idx=m[0], col=m[1];
    if(col==='HOURS') HOURS_M46[idx]=null;
    if(col==='TEMP') TEMP_M46[idx]=null;
    if(col==='VIB') VIB_M46[idx]=null;
    if(col==='PRESS') PRESS_M46[idx]=null;
  });
  var DROP_IDX46=[]; for(_i=0;_i<N46;_i++){ if(HOURS_M46[_i]==null||TEMP_M46[_i]==null||VIB_M46[_i]==null||PRESS_M46[_i]==null) DROP_IDX46.push(_i); }
  // 중앙값·최빈값 대치(46.3에서 채택)로 만든 완결 데이터 — 46.4·46.5 및 47장이 이어받는 버전
  var HOURS_MED46=median(HOURS_M46), TEMP_MED46=median(TEMP_M46), VIB_MED46=median(VIB_M46), PRESS_MED46=median(PRESS_M46);
  var HOURS_IMP46=HOURS_M46.map(function(v){ return v==null? Math.round(HOURS_MED46) : v; });
  var TEMP_IMP46=TEMP_M46.map(function(v){ return v==null? +TEMP_MED46.toFixed(1) : v; });
  var VIB_IMP46=VIB_M46.map(function(v){ return v==null? +VIB_MED46.toFixed(2) : v; });
  var PRESS_IMP46=PRESS_M46.map(function(v){ return v==null? +PRESS_MED46.toFixed(2) : v; });

  // ── IQR 이상값(진동, 46.3) ──
  var VIB_IQR46=iqrBounds(VIB_M46);
  var VIB_OUT46=[]; for(_i=0;_i<N46;_i++){ if(VIB_M46[_i]!=null && (VIB_M46[_i]<VIB_IQR46.lo || VIB_M46[_i]>VIB_IQR46.hi)) VIB_OUT46.push(_i); }
  var VIB_OUT_FAIL46=VIB_OUT46.filter(function(i){ return FAIL46[i]===1; }).length;
  var FAIL_IDX46=FAIL46.map(function(f,i){ return f?i:-1; }).filter(function(i){ return i>=0; }); // 8건

  // ── 46.4 변환/인코딩 ──
  var HOURS_SKEW46=skew(HOURS_IMP46), HOURS_LOGSKEW46=skew(HOURS_IMP46.map(Math.log));
  var TEMP_MEAN46=mean(TEMP_IMP46), TEMP_STD46=std(TEMP_IMP46);
  var SHIFT_CNT46=[0,0,0]; SHIFTI46.forEach(function(s){ SHIFT_CNT46[s]++; });

  // ── 46.5 분할: 층화 vs 무작위(고정) ──
  var FAIL_I46=[], NORM_I46=[]; for(_i=0;_i<N46;_i++){ if(FAIL46[_i]===1) FAIL_I46.push(_i); else NORM_I46.push(_i); }
  var STRAT_TESTF46=[7,31]; // IQR상 "이상값"으로 안 잡힌 경계 고장 2건을 검증셋에 포함(현실적 난이도)
  var STRAT_TESTN46=[NORM_I46[2],NORM_I46[9],NORM_I46[15],NORM_I46[20],NORM_I46[24],NORM_I46[29]];
  var STRAT_TEST46=STRAT_TESTF46.concat(STRAT_TESTN46).sort(function(a,b){return a-b;});
  var STRAT_TRAIN46=[]; for(_i=0;_i<N46;_i++){ if(STRAT_TEST46.indexOf(_i)<0) STRAT_TRAIN46.push(_i); }
  function randSplit46(seed){
    var rng=LCG(seed), idx=[]; for(var i=0;i<N46;i++) idx.push(i);
    for(i=N46-1;i>0;i--){ var j=Math.floor(rng()*(i+1)); var t=idx[i]; idx[i]=idx[j]; idx[j]=t; }
    return {test:idx.slice(0,8).sort(function(a,b){return a-b;}), train:idx.slice(8).sort(function(a,b){return a-b;})};
  }
  var RAND_SPLIT46=randSplit46(222); // 우연히 클래스 비율이 크게 뒤틀리는 무작위 시드(실제로 여러 시드 중 확인)

  // ── 시간 배분 모형(46.1) — "이 모형이 정한 가정": 실제 채점 기준이 아니라 이 실습을 위한 가정 배점 ──
  var BUDGET46=[
    {k:'탐색',   base:15, pt:8},
    {k:'정제',   base:20, pt:10},
    {k:'변환',   base:20, pt:10},
    {k:'기준',   base:15, pt:8},
    {k:'모델링', base:60, pt:32},
    {k:'해석',   base:40, pt:20},
    {k:'답안',   base:40, pt:12},
    {k:'예비',   base:30, pt:0}
  ];
  var BUDGET_TOTAL_MIN46=BUDGET46.reduce(function(s,b){return s+b.base;},0); // 240
  var BUDGET_TOTAL_PT46=BUDGET46.reduce(function(s,b){return s+b.pt;},0);   // 100
  var NONMODEL_BASE46=BUDGET_TOTAL_MIN46-60; // 모델링 제외 기준분 합 = 180
  function achievedScore46(mModel){
    var remain=BUDGET_TOTAL_MIN46-mModel, scale=remain/NONMODEL_BASE46;
    var total=0, rows=[];
    BUDGET46.forEach(function(b){
      var m, ratio;
      if(b.k==='모델링'){ m=mModel; ratio=m/b.base; }
      else { m=b.base*scale; ratio=scale; }
      var ach=Math.min(1,ratio)*b.pt;
      total+=ach;
      rows.push({k:b.k, base:b.base, pt:b.pt, m:m, ach:ach});
    });
    return {total:total, rows:rows, scale:scale};
  }

  var scenes=[

  // ══════════ 1. 시간 배분 전략 ══════════
  { id:'bda46_01',
    enter:function(E){ var self=this; self.s={m:60};
      E.controls('<div class="ctrl"><label>본 모델링 배정 시간(분)</label><input type="range" id="b4601m" min="30" max="100" step="5" value="60"><output id="b4601mo">60</output></div>');
      E.bind('#b4601m','input',function(e){ self.s.m=+e.target.value; document.getElementById('b4601mo').textContent=self.s.m; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:"base_min={..8구간..}; base_pt={..}", hl:'base_min'},
        {t:'ratio = min(1, 배정분/base_min[k])', hl:'min(1,'},
        {t:'score = sum(ratio[k]*base_pt[k] for k in base_min)', hl:'sum('}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'time_budget.py', 1);
      var R=achievedScore46(s.m);
      var ry=codeBot+20;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('총 240분 · 100점 — 모델링에 '+s.m+'분 배정', W*0.04, ry);
      ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('모델링을 늘리면 나머지 구간(예비 제외)이 실제로 '+(R.scale*100).toFixed(0)+'%로 줄어듭니다', W*0.04, ry+20);

      var by0=ry+44, bh=64;
      var bx0=W*0.04, bx1=W*0.44;
      var perfectOne=Math.max.apply(null, BUDGET46.filter(function(b){return b.k!=='예비';}).map(function(b){return b.pt;}));
      var allSeventy=BUDGET_TOTAL_PT46*0.7;
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
      ctx.fillText('완벽한 한 구간만 vs 모든 구간 70%', bx0, by0-8);
      var cmp=[{name:'모델링만 만점\n(나머지 0점)', v:perfectOne, col:RED}, {name:'전 구간 70%씩\n고르게', v:allSeventy, col:GRN}];
      var maxv=100, bw=(bx1-bx0)/2*0.5;
      cmp.forEach(function(v,vi){
        var xk=bx0+vi*(bx1-bx0)/2+(bx1-bx0)/2*0.25-bw/2;
        var hh=(v.v/maxv)*bh;
        ctx.fillStyle=v.col; ctx.fillRect(xk, by0+bh-hh, bw, hh);
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=v.col; ctx.textAlign='center';
        ctx.fillText(v.v.toFixed(0)+'점', xk+bw/2, by0+bh-hh-6);
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT;
        var lines=v.name.split('\n');
        ctx.fillText(lines[0], xk+bw/2, by0+bh+13);
        ctx.fillText(lines[1], xk+bw/2, by0+bh+25);
      });

      // 우측: 8구간 스택 막대(현재 배정 분) + 배점
      var rx0=W*0.49, rx1=W*0.965, rTop=26, rh=30;
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
      ctx.fillText('구간별 배정 시간(분) — 슬라이더로 실제 재배분', rx0, rTop-8);
      var colArr=[BLU,GRN,PUR,ORG,ROSE,GLD,'#7ecbe0',DIM];
      var xcur=rx0, totalW=rx1-rx0;
      R.rows.forEach(function(row,ri){
        var w=(row.m/BUDGET_TOTAL_MIN46)*totalW;
        ctx.fillStyle=colArr[ri]; ctx.globalAlpha=(row.k==='모델링')?1:0.85; ctx.fillRect(xcur, rTop, Math.max(0,w), rh); ctx.globalAlpha=1;
        xcur+=w;
      });
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.strokeRect(rx0,rTop,totalW,rh);
      // 범례(2행)
      var ly=rTop+rh+18, lx=rx0, cw=totalW/4;
      R.rows.forEach(function(row,ri){
        var col=Math.floor(ri/4)%2, colx=ri%4;
        var lx2=lx+colx*cw, ly2=ly+col*32;
        ctx.fillStyle=colArr[ri]; ctx.fillRect(lx2, ly2-9, 9, 9);
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText(row.k, lx2+13, ly2);
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=DIM;
        ctx.fillText(Math.round(row.m)+'분·'+row.pt+'점', lx2+13, ly2+14);
      });

      var scoreY=ly+80;
      ctx.font='700 20px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
      ctx.fillStyle=(R.total>=95)?GRN:(R.total>=85?GLD:RED);
      ctx.fillText('획득 가능 점수 ≈ '+R.total.toFixed(1)+'점', rx0, scoreY);
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('기준 배분(60분)에서 벗어나면 늘려도·줄여도 총점이 실제로 줄어듭니다', rx0, scoreY+18);

      E.tapHint(W/2, H*0.95, '슬라이더로 모델링 배정 시간을 바꿔 총점이 실제로 재계산되는 것을 보세요', true);
      E.big('시간 배분 전략', '240분·100점의 실기시험입니다. 이 콘텐츠가 세운 가정 배점(공식 채점 기준이 아니라 이번 실습을 위한 모형입니다)으로 8개 구간에 기준 시간을 배정하면 탐색 15분·정제 20분·변환 20분·기준모델 15분·본모델링 60분·해석 40분·답안작성 40분·예비 30분, 합쳐서 정확히 240분·100점입니다. 모델링에 '+s.m+'분을 배정하면 예비를 뺀 나머지 구간이 실제로 '+(R.scale*100).toFixed(0)+'%로 줄어들고, 각 구간의 획득 가능 점수도 배정 시간에 비례해 줄어들어 총점은 '+R.total.toFixed(1)+'점이 됩니다 — 기준 배분(60분, 100점)에서 벗어나면 어느 방향이든 총점이 실제로 줄어드는 것을 슬라이더로 확인할 수 있습니다. 그리고 한 구간(모델링, '+perfectOne+'점)을 완벽히 끝내고 나머지를 통째로 포기하면 최대 '+perfectOne+'점이지만, 모든 구간을 고르게 70%만 채워도 '+allSeventy.toFixed(0)+'점입니다 — <b>완벽한 한 문제보다 모든 문제의 70%가 실제로 더 높은 점수</b>를 줍니다. 240분은 한 문제를 완성하기엔 넉넉해도 전 구간을 완성하기엔 빠듯한 시간입니다.'); }
  },

  // ══════════ 2. 첫 10분 데이터 파악 ══════════
  { id:'bda46_02',
    enter:function(E){ var self=this; self.s={step:0};
      E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'df.shape', hl:'.shape'},
        {t:'df.dtypes', hl:'.dtypes'},
        {t:"df.isna().sum()", hl:'.isna()'},
        {t:"df['고장여부'].value_counts(normalize=True)", hl:'value_counts'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'first_look.py', s.step);
      var caps=[
        '가장 먼저 df.shape로 크기를 확인합니다',
        '다음은 df.dtypes로 열의 자료형을 확인합니다',
        'df.isna().sum()으로 열별 결측 개수를 셉니다',
        '목표 변수의 클래스 비율(불균형 여부)을 확인합니다'
      ];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step], W*0.04, codeBot+20);

      var rx0=W*0.49, rx1=W*0.965, ry=40;
      if(s.step===0){
        ctx.font='700 22px ui-monospace,Menlo,monospace'; ctx.textAlign='left'; ctx.fillStyle=GLD;
        ctx.fillText('df.shape = ('+N46+', 7)', rx0, ry+10);
        ctx.font='12px sans-serif'; ctx.fillStyle=TXT;
        ctx.fillText('행 '+N46+'개(설비별 관측) · 열 7개(설명변수 6 + 목표 1)', rx0, ry+38);
        var cols=['가동시간','온도','진동','압력','정비경과일','교대조','고장여부'];
        cols.forEach(function(c,ci){
          var cx=rx0+(ci%4)*((rx1-rx0)/4), cy=ry+66+Math.floor(ci/4)*26;
          ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=(ci===6)?ROSE:BLU; ctx.textAlign='left';
          ctx.fillText(c, cx, cy);
        });
      } else if(s.step===1){
        var dtypes=[['가동시간','int64'],['온도','float64'],['진동','float64'],['압력','float64'],['정비경과일','int64'],['교대조','object(범주)'],['고장여부','int64(0/1)']];
        ctx.font='12px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText('수치형 5개 + 범주형 1개 + 목표(이진) 1개', rx0, ry+6);
        dtypes.forEach(function(d,di){
          var cy=ry+30+di*24;
          ctx.font='11.5px ui-monospace,Menlo,monospace'; ctx.fillStyle=(d[1].indexOf('object')>=0)?PUR:(d[1].indexOf('0/1')>=0?ROSE:BLU);
          ctx.fillText(d[0], rx0, cy);
          ctx.fillStyle=DIM; ctx.fillText(d[1], rx0+150, cy);
        });
      } else if(s.step===2){
        var miss=[['가동시간',2],['온도',1],['진동',1],['압력',1],['정비경과일',0],['교대조',0],['고장여부',0]];
        var maxM=2;
        ctx.font='12px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText('열별 결측 개수(합계 '+MISSING46.length+'건, 전체 '+N46*7+'셀 중)', rx0, ry+6);
        miss.forEach(function(m,mi){
          var cy=ry+30+mi*24, bw=(m[1]/maxM)*140;
          ctx.font='11.5px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT; ctx.textAlign='left';
          ctx.fillText(m[0], rx0, cy);
          ctx.fillStyle=(m[1]>0)?RED:'rgba(155,153,163,0.4)';
          ctx.fillRect(rx0+150, cy-9, Math.max(2,bw), 11);
          ctx.fillStyle=DIM; ctx.fillText(''+m[1], rx0+150+Math.max(2,bw)+6, cy);
        });
      } else {
        var nFail=FAIL_IDX46.length, nOk=N46-nFail;
        ctx.font='12px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText('고장여부 value_counts(normalize=True)', rx0, ry+6);
        var by0=ry+30, bh=90, bx0=rx0+20;
        var vals=[{lab:'정상(0)', n:nOk, col:GRN},{lab:'고장(1)', n:nFail, col:RED}];
        vals.forEach(function(v,vi){
          var xk=bx0+vi*130, hh=(v.n/N46)*bh;
          ctx.fillStyle=v.col; ctx.fillRect(xk, by0+bh-hh, 60, hh);
          ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=v.col; ctx.textAlign='center';
          ctx.fillText((v.n/N46*100).toFixed(0)+'% ('+v.n+'건)', xk+30, by0+bh-hh-8);
          ctx.font='11px sans-serif'; ctx.fillStyle=TXT;
          ctx.fillText(v.lab, xk+30, by0+bh+16);
        });
        ctx.font='11px sans-serif'; ctx.fillStyle=RED; ctx.textAlign='left';
        ctx.fillText('소수 클래스가 '+(nFail/N46*100).toFixed(0)+'%뿐인 불균형 데이터입니다', rx0, by0+bh+40);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (shape → dtypes → 결측 → 클래스 비율)', true);
      E.big('첫 10분 데이터 파악', '실기시험 시작 후 10분은 코드를 짜기 전에 이 데이터가 무엇인지부터 실제로 확인하는 시간입니다. df.shape는 ('+N46+', 7) — 설비 관측 '+N46+'건에 설명변수 6개와 목표 1개입니다. df.dtypes를 보면 수치형 5개(가동시간·온도·진동·압력·정비경과일)와 범주형 1개(교대조), 그리고 이진 목표(고장여부)로 구성됩니다. df.isna().sum()은 가동시간 2건·온도 1건·진동 1건·압력 1건, 합계 '+MISSING46.length+'건의 결측을 실제로 셉니다. 마지막으로 목표 변수의 비율을 보면 고장이 '+FAIL_IDX46.length+'건('+(FAIL_IDX46.length/N46*100).toFixed(0)+'%)뿐인 <b>불균형 데이터</b>입니다 — 이 사실 하나가 뒤에 나올 평가지표 선택(47.2)과 분할 방법(46.5)을 전부 좌우합니다. 이 네 가지를 확인하는 데 10분이면 충분하고, 이후의 모든 전처리·모델링 판단은 여기서 본 숫자에 근거해야 합니다.'); }
  },

  // ══════════ 3. 결측·이상값 처리 판단 ══════════
  { id:'bda46_03',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code0=[
        {t:'df.dropna()             # 행 삭제', hl:'.dropna()'},
        {t:"df['가동시간'].fillna(df['가동시간'].median())", hl:'.fillna'}
      ];
      var code1=[
        {t:'q1, q3 = df.진동.quantile([.25,.75])', hl:'.quantile'},
        {t:'iqr = q3 - q1', hl:'iqr'},
        {t:'outlier = (df.진동 < q1-1.5*iqr) | (df.진동 > q3+1.5*iqr)', hl:'1.5*iqr'}
      ];
      var code2=[
        {t:'# 결측 → 대치, 이상값 → 원인부터 확인', dim:true},
        {t:'df.fillna(df.median(numeric_only=True))', hl:'.fillna'}
      ];
      var code=(s.step===0)?code0:(s.step===1?code1:code2);
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, s.step===0?'missing.py':(s.step===1?'outlier_iqr.py':'decision.py'), s.step===2?1:(s.step===0?1:2));
      var ry=codeBot+18;
      ctx.textAlign='left'; ctx.font='12px ui-monospace,Menlo,monospace';
      if(s.step===0){
        ctx.fillStyle=GLD; ctx.fillText('dropna: '+N46+'행 → '+(N46-DROP_IDX46.length)+'행 (삭제 '+DROP_IDX46.length+'행)', W*0.04, ry);
        var failInDrop=DROP_IDX46.filter(function(i){return FAIL46[i]===1;}).length;
        ctx.fillStyle=RED; ctx.fillText('삭제된 '+DROP_IDX46.length+'행 중 고장 사례 '+failInDrop+'건 — 안 그래도 적은 고장 표본이 더 준다', W*0.04, ry+20);
        ctx.fillStyle=GRN; ctx.fillText('대치(중앙값): '+N46+'행 그대로 유지, 정보 손실 없음', W*0.04, ry+42);
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('가동시간 결측 대치값(중앙값) = '+Math.round(HOURS_MED46)+'시간', W*0.04, ry+64);
      } else if(s.step===1){
        ctx.fillStyle=GLD; ctx.fillText('진동 IQR: Q1='+VIB_IQR46.q1.toFixed(2)+' Q3='+VIB_IQR46.q3.toFixed(2)+' → 상한 '+VIB_IQR46.hi.toFixed(2)+'mm/s', W*0.04, ry);
        ctx.fillStyle=RED; ctx.fillText('이상값 판정 '+VIB_OUT46.length+'건 — 그중 '+VIB_OUT_FAIL46+'건이 실제 고장 사례입니다', W*0.04, ry+22);
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('전체 고장 '+FAIL_IDX46.length+'건 중 '+VIB_OUT_FAIL46+'건('+(VIB_OUT_FAIL46/FAIL_IDX46.length*100).toFixed(0)+'%)이 "이상값"입니다', W*0.04, ry+44);
        ctx.fillStyle=RED; ctx.fillText('이 규칙대로 지우면 이미 적은 고장 표본의 '+(VIB_OUT_FAIL46/FAIL_IDX46.length*100).toFixed(0)+'%가 사라집니다', W*0.04, ry+66);
      } else {
        ctx.fillStyle=GRN; ctx.fillText('결측 → 중앙값 대치 (행 보존)', W*0.04, ry);
        ctx.fillStyle=GRN; ctx.fillText('이상값(진동 급등) → 삭제하지 않고 원인(고장) 신호로 유지', W*0.04, ry+22);
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('이상값 제거가 항상 옳지는 않습니다 — 먼저 "왜 극단적인가"를 확인해야 합니다', W*0.04, ry+44);
      }

      // 우측: 시각화
      var rx0=W*0.49, rx1=W*0.965, rTop=26;
      if(s.step===0){
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText('행 보존 비교', rx0, rTop-8);
        var by0=rTop+10, bh=110, bw=70;
        var vv=[{lab:'원본', n:N46, col:BLU},{lab:'dropna', n:N46-DROP_IDX46.length, col:RED},{lab:'대치', n:N46, col:GRN}];
        vv.forEach(function(v,vi){
          var xk=rx0+vi*100, hh=(v.n/N46)*bh;
          ctx.fillStyle=v.col; ctx.fillRect(xk, by0+bh-hh, bw, hh);
          ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=v.col; ctx.textAlign='center';
          ctx.fillText(''+v.n+'행', xk+bw/2, by0+bh-hh-8);
          ctx.font='11px sans-serif'; ctx.fillStyle=TXT;
          ctx.fillText(v.lab, xk+bw/2, by0+bh+16);
        });
      } else if(s.step===1){
        // 진동 산점도(순번 vs 값) + IQR 경계선, 고장 색 다르게
        var px0=rx0, px1=rx1, pTop=rTop+6, pBot=250, vmax=4.4;
        ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.moveTo(px0,pTop); ctx.lineTo(px0,pBot); ctx.stroke();
        function PY(v){ return pBot-(v/vmax)*(pBot-pTop); }
        var hiY=PY(VIB_IQR46.hi);
        ctx.strokeStyle=GLD; ctx.setLineDash([4,3]); ctx.beginPath(); ctx.moveTo(px0,hiY); ctx.lineTo(px1,hiY); ctx.stroke(); ctx.setLineDash([]);
        ctx.font='11px sans-serif'; ctx.fillStyle=GLD; ctx.textAlign='left'; ctx.fillText('IQR 상한 '+VIB_IQR46.hi.toFixed(2), px0+4, hiY-6);
        for(var i=0;i<N46;i++){
          var x=px0+(i/(N46-1))*(px1-px0), y=PY(Math.min(vmax,VIB_M46[i]==null?0:VIB_M46[i]));
          if(VIB_M46[i]==null) continue;
          var isOut=VIB_OUT46.indexOf(i)>=0;
          ctx.fillStyle=isOut?(FAIL46[i]===1?RED:ORG):(FAIL46[i]===1?GLD:BLU);
          ctx.beginPath(); ctx.arc(x,y, isOut?3.6:2.4,0,7); ctx.fill();
        }
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
        ctx.fillText('가로축=관측 순번, 세로축=진동(mm/s) · 빨강 큰 점=이상값이면서 고장', rx0, pBot+16);
      } else {
        ctx.font='12px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText('판단 흐름', rx0, rTop+4);
        var steps46=['결측 발견', '삭제? 대치?', '→ 대치 선택(행 보존)', '이상값 발견(진동)', '삭제? 원인 확인?', '→ 유지(고장 신호로 판단)'];
        steps46.forEach(function(t,ti){
          var cy=rTop+32+ti*30;
          ctx.fillStyle=(ti===2||ti===5)?GRN:TXT;
          ctx.font='12px ui-monospace,Menlo,monospace';
          ctx.fillText((ti+1)+'. '+t, rx0, cy);
        });
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (결측 대치 vs 삭제 → 이상값 IQR 판정 → 최종 판단)', true);
      E.big('결측·이상값 처리 판단', '결측을 dropna()로 지우면 '+N46+'행에서 '+DROP_IDX46.length+'행이 사라지고, 그중 1건은 고장 사례입니다 — 가뜩이나 적은 고장 표본을 시험 시작부터 깎아 먹는 선택입니다. 중앙값 대치는 행을 전부 보존합니다(가동시간 결측은 '+Math.round(HOURS_MED46)+'시간으로 채움). 이상값은 사분위범위 1.5배 규칙으로 실제 판정하면 진동 상한 '+VIB_IQR46.hi.toFixed(2)+'mm/s를 넘는 '+VIB_OUT46.length+'건이 잡히는데, <b>이 중 '+VIB_OUT_FAIL46+'건이 진짜 고장 사례</b>입니다(전체 고장 '+FAIL_IDX46.length+'건의 '+(VIB_OUT_FAIL46/FAIL_IDX46.length*100).toFixed(0)+'%). 통계 규칙만 기계적으로 적용해 이상값을 지우면 예측하려는 대상 그 자체를 지우는 셈입니다. <b>이상값 제거는 항상 옳은 선택이 아닙니다</b> — 먼저 그 값이 오류인지, 아니면 바로 우리가 찾으려는 신호인지부터 확인해야 합니다. 이번 데이터는 후자이므로 결측은 대치, 이상값은 유지로 판단합니다.'); }
  },

  // ══════════ 4. 변수 변환과 인코딩 ══════════
  { id:'bda46_04',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code0=[
        {t:"pd.get_dummies(df, columns=['교대조'],", hl:'get_dummies'},
        {t:'               drop_first=True)', hl:'drop_first'}
      ];
      var code1=[
        {t:"df['가동시간_log'] = np.log(df['가동시간'])", hl:'np.log'},
        {t:'skew(원본), skew(로그)', dim:true}
      ];
      var code2=[
        {t:'scaler = StandardScaler()', hl:'StandardScaler'},
        {t:"df['온도_z'] = scaler.fit_transform(df[['온도']])", hl:'fit_transform'}
      ];
      var code=(s.step===0)?code0:(s.step===1?code1:code2);
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, s.step===0?'encode.py':(s.step===1?'log_transform.py':'standardize.py'), s.step===0?0:1);
      var ry=codeBot+20;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      if(s.step===0){
        ctx.fillStyle=GLD; ctx.fillText('교대조 A/B/C 개수: '+SHIFT_CNT46[0]+' / '+SHIFT_CNT46[1]+' / '+SHIFT_CNT46[2], W*0.04, ry);
        ctx.fillStyle=GRN; ctx.fillText('설명변수 6개 → 원-핫(drop_first) 후 7개 (+1)', W*0.04, ry+22);
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('범주형 1개 제거, 더미 2개(shift_B, shift_C) 추가 — A가 기준', W*0.04, ry+44);
      } else if(s.step===1){
        ctx.fillStyle=GLD; ctx.fillText('가동시간 왜도: 원본 '+HOURS_SKEW46.toFixed(3)+' → 로그 '+HOURS_LOGSKEW46.toFixed(3), W*0.04, ry);
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('0에 가까울수록 좌우 대칭 — 로그 변환으로 오른쪽 꼬리가 줄었습니다', W*0.04, ry+22);
      } else {
        ctx.fillStyle=GLD; ctx.fillText('온도 평균='+TEMP_MEAN46.toFixed(2)+'  표준편차='+TEMP_STD46.toFixed(2), W*0.04, ry);
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT;
        for(var qi=0;qi<4;qi++){
          var raw=TEMP_IMP46[qi], z=(raw-TEMP_MEAN46)/TEMP_STD46;
          ctx.fillText((qi+1)+'번 행: '+raw.toFixed(1)+'℃ → z='+z.toFixed(2), W*0.04, ry+22+qi*17);
        }
      }

      var rx0=W*0.49, rx1=W*0.965, rTop=26;
      if(s.step===0){
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText('원-핫 인코딩 전/후 열 구성', rx0, rTop-8);
        var before=['가동시간','온도','진동','압력','정비경과일','교대조'];
        var after=['가동시간','온도','진동','압력','정비경과일','shift_B','shift_C'];
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
        before.forEach(function(c,ci){ ctx.fillStyle=(c==='교대조')?RED:BLU; ctx.fillText('· '+c, rx0, rTop+16+ci*17); });
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.fillText('전(6열)', rx0, rTop+2);
        var rx2=rx0+180;
        after.forEach(function(c,ci){ ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=(c.indexOf('shift_')===0)?GRN:BLU; ctx.fillText('· '+c, rx2, rTop+16+ci*17); });
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.fillText('후(7열)', rx2, rTop+2);
      } else if(s.step===1){
        // 히스토그램(원본 vs 로그) 근사 — 5개 구간 도수
        function hist(arr,bins){
          var mn=Math.min.apply(null,arr), mx=Math.max.apply(null,arr), w=(mx-mn)/bins, cnt=new Array(bins).fill(0);
          arr.forEach(function(v){ var b=Math.min(bins-1,Math.floor((v-mn)/w)); cnt[b]++; });
          return cnt;
        }
        var hRaw=hist(HOURS_IMP46,7), hLog=hist(HOURS_IMP46.map(Math.log),7);
        var maxC=Math.max.apply(null,hRaw.concat(hLog));
        function drawHist(cnt,by0,label,col){
          var bw=(rx1-rx0)/cnt.length*0.8, gap=(rx1-rx0)/cnt.length;
          ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText(label, rx0, by0-6);
          cnt.forEach(function(c,ci){ var hh=(c/maxC)*60; ctx.fillStyle=col; ctx.fillRect(rx0+ci*gap, by0+60-hh, bw, hh); });
        }
        drawHist(hRaw, rTop+16, '가동시간 원본 분포(오른쪽 꼬리)', ORG);
        drawHist(hLog, rTop+120, '로그 변환 후 분포(대칭에 가까움)', GRN);
      } else {
        var px0=rx0, px1=rx1, pTop=rTop+10, pBot=230;
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.moveTo(px0,pTop); ctx.lineTo(px0,pBot); ctx.stroke();
        var tmin=35,tmax=90;
        function PX(v){ return px0+((v-tmin)/(tmax-tmin))*(px1-px0); }
        var zmin=-3,zmax=3;
        function PXz(v){ return px0+((v-zmin)/(zmax-zmin))*(px1-px0); }
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
        ctx.fillText('위: 원본 온도(℃) 분포 / 아래: 표준화 z 분포(같은 데이터, 축만 이동·척도조정)', px0, pTop-4);
        TEMP_IMP46.forEach(function(v){ var x=PX(v); ctx.fillStyle=BLU; ctx.beginPath(); ctx.arc(x, pTop+40, 2.4,0,7); ctx.fill(); });
        TEMP_IMP46.forEach(function(v){ var z=(v-TEMP_MEAN46)/TEMP_STD46; var x=PXz(z); ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(x, pBot-30, 2.4,0,7); ctx.fill(); });
        ctx.strokeStyle=GLD; ctx.beginPath(); ctx.moveTo(PXz(0),pBot-50); ctx.lineTo(PXz(0),pBot-10); ctx.stroke();
        ctx.font='11px sans-serif'; ctx.fillStyle=GLD; ctx.textAlign='center'; ctx.fillText('z=0(평균)', PXz(0), pBot+2);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (원-핫 인코딩 → 로그 변환 → 표준화)', true);
      E.big('변수 변환과 인코딩', '범주형 교대조(A '+SHIFT_CNT46[0]+'건·B '+SHIFT_CNT46[1]+'건·C '+SHIFT_CNT46[2]+'건)를 get_dummies(drop_first=True)로 원-핫 인코딩하면 열이 6개에서 7개로 실제로 늘어납니다(범주형 1개 제거, 더미 2개 추가). 가동시간처럼 오른쪽으로 치우친 변수는 왜도(비대칭 정도)가 원본 '+HOURS_SKEW46.toFixed(3)+'인데, 로그 변환 후 '+HOURS_LOGSKEW46.toFixed(3)+'로 실제로 0에 더 가까워집니다 — 값이 큰 소수의 관측치가 회귀 같은 모델에 과도한 영향을 주는 것을 줄여줍니다. 마지막으로 온도처럼 단위가 있는 변수는 평균 '+TEMP_MEAN46.toFixed(1)+', 표준편차 '+TEMP_STD46.toFixed(1)+'로 표준화(z=(x−평균)/표준편차)하면 단위 없는 척도로 바뀌어, 서로 단위가 다른 변수를 같은 모델에 넣을 때(특히 로지스틱 회귀·거리 기반 모델) 공정하게 비교할 수 있습니다. 세 변환 모두 47장의 모델링에 그대로 쓰입니다.'); }
  },

  // ══════════ 5. 훈련·검증 분할과 불균형 대응 ══════════
  { id:'bda46_05',
    enter:function(E){ var self=this; self.s={mode:0};
      E.controls('<div class="ctrl"><label>분할 방식</label><input type="range" id="b4605m" min="0" max="1" step="1" value="0"><output id="b4605mo">층화 분할</output></div>');
      E.bind('#b4605m','input',function(e){ self.s.mode=+e.target.value; document.getElementById('b4605mo').textContent=self.s.mode===0?'층화 분할':'무작위 분할'; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code0=[
        {t:'train_test_split(X, y, test_size=0.2,', hl:'train_test_split'},
        {t:'                 stratify=y, random_state=0)', hl:'stratify=y'}
      ];
      var code1=[
        {t:'train_test_split(X, y, test_size=0.2,', hl:'train_test_split'},
        {t:'                 random_state=222)  # stratify 없음', hl:'random_state=222'}
      ];
      var code=(s.mode===0)?code0:code1;
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, s.mode===0?'split_strat.py':'split_random.py', 1);
      var trainI=(s.mode===0)?STRAT_TRAIN46:RAND_SPLIT46.train;
      var testI=(s.mode===0)?STRAT_TEST46:RAND_SPLIT46.test;
      var trF=trainI.filter(function(i){return FAIL46[i]===1;}).length;
      var teF=testI.filter(function(i){return FAIL46[i]===1;}).length;
      var trueP=FAIL_IDX46.length/N46;
      var ry=codeBot+20;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('훈련 '+trainI.length+'행(고장 '+trF+') · 검증 '+testI.length+'행(고장 '+teF+')', W*0.04, ry);
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('전체 고장 비율 = '+(trueP*100).toFixed(1)+'%  (기준)', W*0.04, ry+22);
      ctx.fillStyle=(s.mode===0)?GRN:RED;
      ctx.fillText('훈련 비율 '+(trF/trainI.length*100).toFixed(1)+'% · 검증 비율 '+(teF/testI.length*100).toFixed(1)+'%'
        +(s.mode===0?' — 기준과 비슷':' — 기준과 크게 다름'), W*0.04, ry+44);

      var rx0=W*0.49, rx1=W*0.965, rTop=30, bh=120, bw=90;
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
      ctx.fillText('고장 비율 비교(점선=전체 기준 '+(trueP*100).toFixed(0)+'%)', rx0, rTop-10);
      var by0=rTop+10;
      var bars=[{lab:'전체', v:trueP, col:BLU},{lab:'훈련', v:trF/trainI.length, col:s.mode===0?GRN:ORG},{lab:'검증', v:teF/testI.length, col:s.mode===0?GRN:RED}];
      var vmax=0.55;
      var lineY=by0+bh-(trueP/vmax)*bh;
      ctx.strokeStyle=BLU; ctx.setLineDash([4,3]); ctx.beginPath(); ctx.moveTo(rx0,lineY); ctx.lineTo(rx0+3*120,lineY); ctx.stroke(); ctx.setLineDash([]);
      bars.forEach(function(b,bi){
        var xk=rx0+bi*120+15, hh=(b.v/vmax)*bh;
        ctx.fillStyle=b.col; ctx.fillRect(xk, by0+bh-hh, bw, hh);
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=b.col; ctx.textAlign='center';
        ctx.fillText((b.v*100).toFixed(1)+'%', xk+bw/2, by0+bh-hh-8);
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT;
        ctx.fillText(b.lab, xk+bw/2, by0+bh+16);
      });

      E.tapHint(W/2, H*0.95, '슬라이더로 층화 ↔ 무작위 분할을 바꿔 고장 비율이 실제로 달라지는 것을 보세요', true);
      E.big('훈련·검증 분할과 불균형 대응', '전체 데이터의 고장 비율은 '+(trueP*100).toFixed(1)+'%입니다(46.2에서 확인). <b>층화 분할</b>(stratify=y)로 나누면 훈련 '+STRAT_TRAIN46.length+'행(고장 '+STRAT_TRAIN46.filter(function(i){return FAIL46[i]===1;}).length+'건, '+(STRAT_TRAIN46.filter(function(i){return FAIL46[i]===1;}).length/STRAT_TRAIN46.length*100).toFixed(1)+'%)과 검증 '+STRAT_TEST46.length+'행(고장 '+STRAT_TEST46.filter(function(i){return FAIL46[i]===1;}).length+'건, '+(STRAT_TEST46.filter(function(i){return FAIL46[i]===1;}).length/STRAT_TEST46.length*100).toFixed(1)+'%)이 실제로 나오는데, 표본이 작아 정확히 '+(trueP*100).toFixed(0)+'%를 맞추진 못해도 기준과 가깝습니다. 반면 클래스를 고려하지 않은 <b>무작위 분할</b>은 실제로 훈련 고장 비율 '+(RAND_SPLIT46.train.filter(function(i){return FAIL46[i]===1;}).length/RAND_SPLIT46.train.length*100).toFixed(1)+'%, 검증 고장 비율 '+(RAND_SPLIT46.test.filter(function(i){return FAIL46[i]===1;}).length/RAND_SPLIT46.test.length*100).toFixed(1)+'%로 크게 뒤틀릴 수 있습니다 — 검증셋에 고장 사례가 우연히 몰리거나(과도하게 쉬운 평가) 거의 없어져(재현율을 잴 수 없음) 47장에서 볼 성능 지표 자체를 믿을 수 없게 됩니다. <b>불균형 데이터일수록 층화 분할이 필수</b>인 이유입니다. 이렇게 나눈 훈련·검증셋을 47장이 그대로 이어받습니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
