/* 빅데이터 분석 제5장 — 데이터 조작 II: 분할·적용·재조합과 성능
   동작(behavior)만. 텍스트=content/bda5.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 화면의 모든 수(행 수·평균·메모리·청크 수·복사 횟수·일치 여부)는 JS로 실제 계산(하드코딩 금지).
   왼쪽=진짜 Python 코드 패널+줄커서, 오른쪽=실계산 시각화. HUD 꺼진 트랙 — 텍스트 좌표 직접 관리(H=380 기준 설계). */
(function(){
  var ROSE='#ff7ab8', GRN='#7ee0b0', BLU='#7ab8ff', GLD='#ffd27a', DIM='#9b99a3', RED='#f0888a', TXT='#eadfe8';

  function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  // 등폭 코드 패널: lines=[{t,hl?,dim?}|문자열]. hl 토큰만 로즈 강조. 반환=패널 하단 y.
  function codePanel(E, x, y, w, lines, title, actLine){
    var ctx=E.ctx, lh=21, pad=14, top=y, n=lines.length, ht=n*lh+pad*2+(title?26:0);
    ctx.fillStyle='rgba(255,255,255,0.035)'; ctx.strokeStyle='rgba(255,122,184,0.30)'; ctx.lineWidth=1;
    roundRect(ctx,x,top,w,ht,10); ctx.fill(); ctx.stroke();
    var cy=top+pad+(title?26:0);
    if(title){ ctx.fillStyle=ROSE; ctx.font='600 12px ui-monospace,Menlo,monospace'; ctx.textAlign='left'; ctx.fillText(title, x+pad, top+pad+12); }
    ctx.font='13px ui-monospace,Menlo,Consolas,monospace'; ctx.textAlign='left';
    for(var i=0;i<n;i++){
      var L=lines[i], t=(typeof L==='string')?L:L.t, hl=(typeof L==='object')?L.hl:null;
      var ty=cy+i*lh+11;
      if(actLine!=null && i===actLine){ ctx.fillStyle='rgba(255,122,184,0.16)'; ctx.fillRect(x+4, cy+i*lh+1, w-8, lh-2); ctx.fillStyle=ROSE; ctx.fillRect(x+4, cy+i*lh+1, 3, lh-2); }
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

  // 미니 DataFrame 표. 반환=표 하단 y.
  function drawTable(E,x,y,title,cols,rows,opts){
    opts=opts||{};
    var ctx=E.ctx, cw=opts.cw||64, rh=opts.rh||22, w=cw*cols.length;
    if(title){ ctx.fillStyle=opts.tc||ROSE; ctx.font='600 12px sans-serif'; ctx.textAlign='left'; ctx.fillText(title, x, y-6); }
    ctx.fillStyle='rgba(255,122,184,0.14)'; ctx.fillRect(x,y,w,rh);
    ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1; ctx.strokeRect(x,y,w,rh);
    ctx.font='600 12px ui-monospace,Menlo,monospace'; ctx.textAlign='center';
    for(var c=0;c<cols.length;c++){ ctx.fillStyle=ROSE; ctx.fillText(cols[c], x+c*cw+cw/2, y+rh/2+4); }
    ctx.font='12px ui-monospace,Menlo,monospace';
    for(var r=0;r<rows.length;r++){
      var ry=y+rh*(r+1), drop=opts.dropRows && opts.dropRows.indexOf(r)>=0;
      ctx.fillStyle=(r%2)?'rgba(255,255,255,0.02)':'rgba(255,255,255,0.05)';
      ctx.fillRect(x,ry,w,rh); ctx.strokeStyle='rgba(255,255,255,0.10)'; ctx.strokeRect(x,ry,w,rh);
      for(var c2=0;c2<cols.length;c2++){
        var v=rows[r][c2];
        ctx.fillStyle=drop?RED:TXT;
        ctx.fillText(''+v, x+c2*cw+cw/2, ry+rh/2+4);
      }
    }
    return y+rh*(rows.length+1);
  }

  function fmt(x){ return String(x).replace(/\B(?=(\d{3})+(?!\d))/g,','); }

  var scenes = [

  // ══════════ 1. 표를 SQL처럼 질의하기 — DuckDB와 pandas, 같은 질문 두 방언 ══════════
  { id:'bda5_01',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(340+this.s.step*90,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i, j;
      // 고정 예제: 카페 주문 8행
      var COLS=['분류','상품','가격'];
      var ROWS=[['음료','아메리카노',350],['음료','라떼',420],['베이커리','크루아상',280],['음료','에이드',390],
                ['베이커리','스콘',310],['베이커리','식빵',260],['음료','티',300],['베이커리','베이글',330]];
      var THR=320;

      // ★실제 질의 실행 1: 필터를 두 경로로(SQL식 스캔 vs 불리언 마스크) 계산해 대조
      var f1=[]; for(i=0;i<ROWS.length;i++) if(ROWS[i][2]>=THR) f1.push(ROWS[i]);          // SQL: WHERE 스캔
      var mask=[]; for(i=0;i<ROWS.length;i++) mask.push(ROWS[i][2]>=THR);                  // pandas: 불리언 마스크
      var f2=[]; for(i=0;i<ROWS.length;i++) if(mask[i]) f2.push(ROWS[i]);
      var cellEq=0, cellN=0;
      for(i=0;i<Math.min(f1.length,f2.length);i++) for(j=0;j<3;j++){ cellN++; if(f1[i][j]===f2[i][j]) cellEq++; }
      var filterSame=(f1.length===f2.length && cellEq===cellN);

      // ★실제 질의 실행 2: 그룹 평균을 두 경로로(해시 집계 vs 정렬 키 순회) 계산해 대조
      var acc={}, order=[];
      for(i=0;i<ROWS.length;i++){ var k=ROWS[i][0]; if(!acc[k]){acc[k]={n:0,sum:0}; order.push(k);} acc[k].n++; acc[k].sum+=ROWS[i][2]; }
      var keys=order.slice().sort();                                                       // pandas groupby는 키 정렬
      var g2={}; for(j=0;j<keys.length;j++){ var t=0,cnt=0; for(i=0;i<ROWS.length;i++) if(ROWS[i][0]===keys[j]){t+=ROWS[i][2];cnt++;} g2[keys[j]]=t/cnt; }
      var maxDiff=0; for(j=0;j<keys.length;j++){ var d=Math.abs(acc[keys[j]].sum/acc[keys[j]].n - g2[keys[j]]); if(d>maxDiff) maxDiff=d; }

      var code=[
        {t:'import duckdb', dim:true},
        {t:'duckdb.sql("""SELECT * FROM df', hl:'SELECT'},
        {t:'    WHERE 가격 >= 320""").df()', hl:'WHERE'},
        {t:'df[df["가격"] >= 320]', hl:'df["가격"] >= 320'},
        {t:'duckdb.sql("""SELECT 분류, AVG(가격)', hl:'AVG(가격)'},
        {t:'    FROM df GROUP BY 분류""").df()', hl:'GROUP BY'},
        {t:'df.groupby("분류")["가격"].mean()', hl:'groupby'}
      ];
      var act=[2,3,5,6][s.step];
      var codeBot=codePanel(E, W*0.04, H*0.03, W*0.40, code, 'query.py', act);

      // 좌측 하단: 원본 표(고정 예제) — 행 높이를 줄여 H=380에서도 캔버스 안에
      drawTable(E, W*0.04, codeBot+20, 'df — 주문 8행 (고정 예제)', COLS, ROWS, {cw:82, rh:13});

      // 우측: 단계별 결과(전부 실계산)
      var gx=W*0.52, gy=26, isSQL=(s.step===0||s.step===2);
      ctx.fillStyle=isSQL?BLU:ROSE; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
      ctx.fillText(['① SQL로 묻기 — DuckDB가 df를 직접 질의','② 같은 질문을 pandas 표현식으로',
                    '③ SQL로 집계 — GROUP BY','④ 같은 집계를 pandas groupby로'][s.step], gx, gy);

      if(s.step<2){
        var rb=drawTable(E, gx, gy+14, null, COLS, (s.step===0?f1:f2), {cw:82, rh:15});
        ctx.fillStyle=GLD; ctx.font='600 13px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
        ctx.fillText('WHERE 가격 >= '+THR+'  ->  '+(s.step===0?f1.length:f2.length)+'행 (전체 '+ROWS.length+'행 중)', gx, rb+22);
        if(s.step===1){
          ctx.fillStyle=filterSame?GRN:RED; ctx.font='12.5px sans-serif';
          ctx.fillText('SQL 결과와 대조: 행 수 '+f1.length+' = '+f2.length+' · 셀 '+cellN+'개 중 '+cellEq+'개 일치 '+(filterSame?'✓':'✗'), gx, rb+44);
          ctx.fillStyle=DIM; ctx.font='12px sans-serif';
          ctx.fillText('문법은 달라도 실행 결과는 같은 표입니다.', gx, rb+64);
        } else {
          ctx.fillStyle=DIM; ctx.font='12px sans-serif';
          ctx.fillText('표를 아는 사람이라면 SQL부터 읽을 수 있습니다 — 그대로 물어보세요.', gx, rb+44);
        }
      } else {
        var arows=[]; for(j=0;j<keys.length;j++) arows.push([keys[j], (acc[keys[j]].sum/acc[keys[j]].n).toFixed(2)]);
        var ab=drawTable(E, gx, gy+14, null, ['분류','평균가격'], arows, {cw:96, rh:16});
        ctx.fillStyle=DIM; ctx.font='12px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
        var vf=[]; for(j=0;j<keys.length;j++) vf.push(keys[j]+' = '+acc[keys[j]].sum+'/'+acc[keys[j]].n);
        ctx.fillText('검산: '+vf.join(' · '), gx, ab+22);
        if(s.step===3){
          ctx.fillStyle=(maxDiff===0)?GRN:RED; ctx.font='12.5px sans-serif';
          ctx.fillText('두 방식의 평균값 최대 차이 = '+maxDiff.toFixed(2)+' — 완전히 같은 결과 '+(maxDiff===0?'✓':'✗'), gx, ab+46);
          ctx.fillStyle=DIM; ctx.font='12px sans-serif';
          ctx.fillText('결론: 그때그때 편한 방언으로 — 답은 하나입니다.', gx, ab+66);
        } else {
          ctx.fillStyle=DIM; ctx.font='12px sans-serif';
          ctx.fillText('AVG·GROUP BY — 4장의 groupby와 정확히 같은 일을 합니다.', gx, ab+46);
        }
      }

      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 (SQL 필터 → pandas → SQL 집계 → pandas)', true);
      E.big('표를 SQL처럼 질의하기', '같은 표에 같은 질문을 두 언어로 던져 봅니다. DuckDB는 메모리 위의 DataFrame을 SQL로 바로 질의하고, pandas는 표현식으로 답하죠. 행 수와 평균이 두 경로에서 실제로 계산되어 정확히 일치하는 걸 확인해 보세요 — 도구는 취향, 결과는 하나입니다.'); }
  },

  // ══════════ 2. 긴 형식 ↔ 넓은 형식 — melt와 pivot ══════════
  { id:'bda5_02',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(330+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i, j;
      // 고정 예제: 학생 3명 × 과목 3열(넓은 형식)
      var NAMES=['민준','서연','지호'], SUBJ=['국어','영어','수학'];
      var SC=[[90,85,78],[72,95,88],[84,70,91]];
      var wideCols=['이름'].concat(SUBJ), wideRows=[];
      for(i=0;i<NAMES.length;i++) wideRows.push([NAMES[i]].concat(SC[i]));

      // ★실제 melt: 열(과목) 순서로 세로로 녹임 — 한 행 = 관측 하나
      var LONG=[]; for(j=0;j<SUBJ.length;j++) for(i=0;i<NAMES.length;i++) LONG.push([NAMES[i],SUBJ[j],SC[i][j]]);
      // ★실제 groupby: 긴 형식에서 과목별 평균
      var means=[]; for(j=0;j<SUBJ.length;j++){ var sum=0,n=0; for(i=0;i<LONG.length;i++) if(LONG[i][1]===SUBJ[j]){sum+=LONG[i][2];n++;} means.push(sum/n); }
      // ★실제 pivot: 긴 형식 → 넓은 형식 복원 후 원본과 셀 단위 대조
      var BACK=[], eqN=0, totN=0;
      for(i=0;i<NAMES.length;i++){ var row=[NAMES[i]];
        for(j=0;j<SUBJ.length;j++){ var v=null;
          for(var k=0;k<LONG.length;k++) if(LONG[k][0]===NAMES[i]&&LONG[k][1]===SUBJ[j]) v=LONG[k][2];
          row.push(v); totN++; if(v===SC[i][j]) eqN++; }
        BACK.push(row); }

      var code=[
        {t:'long = wide.melt(id_vars="이름",', hl:'melt'},
        {t:'    var_name="과목", value_name="점수")'},
        {t:'long.groupby("과목")["점수"].mean()', hl:'groupby'},
        {t:'back = long.pivot(index="이름",', hl:'pivot'},
        {t:'    columns="과목", values="점수")'},
        {t:'(back == wide_vals).all().all()', hl:'=='}
      ];
      var act=[-1,0,2,3][s.step];
      var codeBot=codePanel(E, W*0.04, H*0.03, W*0.40, code, 'reshape.py', act);

      // 좌측 하단: 넓은 형식 원본 — shape는 배열에서 실측
      drawTable(E, W*0.04, codeBot+22, '넓은 형식 wide — shape ('+wideRows.length+', '+wideCols.length+')', wideCols, wideRows, {cw:70, rh:15});
      ctx.fillStyle=DIM; ctx.font='11.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText('한 행 = 학생 한 명 · 열 = 과목 (사람이 읽기 좋은 배치)', W*0.04, codeBot+22+15*4+18);

      var gx=W*0.52;
      if(s.step===0){
        // 개념: 두 형식의 구조 차이(수치는 배열에서 실측)
        var bw=W*0.42;
        ctx.strokeStyle=BLU; ctx.lineWidth=1.4; ctx.fillStyle='rgba(255,255,255,0.04)';
        roundRect(ctx,gx,36,bw,54,8); ctx.fill(); ctx.stroke();
        ctx.fillStyle=BLU; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('넓은 형식 — '+wideRows.length+'행 × '+wideCols.length+'열 · 보고서용', gx+14, 56);
        ctx.fillStyle=TXT; ctx.font='11.5px sans-serif';
        ctx.fillText('새 과목 추가 = 열 추가 → 표의 구조가 바뀝니다', gx+14, 76);
        ctx.fillStyle=ROSE; ctx.font='600 13px sans-serif'; ctx.textAlign='center';
        ctx.fillText('melt ↓      ↑ pivot', gx+bw/2, 110);
        ctx.strokeStyle=GLD; ctx.fillStyle='rgba(255,255,255,0.04)';
        roundRect(ctx,gx,124,bw,54,8); ctx.fill(); ctx.stroke();
        ctx.fillStyle=GLD; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('긴 형식 — '+(NAMES.length*SUBJ.length)+'행 × 3열 · 분석용', gx+14, 144);
        ctx.fillStyle=TXT; ctx.font='11.5px sans-serif';
        ctx.fillText('새 과목 추가 = 행만 늘어남 → 구조 불변, 코드 불변', gx+14, 164);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('탭하며 실제 변환을 실행해 보겠습니다.', gx, 206);
      } else if(s.step===1){
        ctx.fillStyle=ROSE; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('melt 결과 — 긴 형식 (실제 변환)', gx, 28);
        drawTable(E, gx, 36, null, ['이름','과목','점수'], LONG, {cw:66, rh:13});
        ctx.fillStyle=GLD; ctx.font='600 13px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
        ctx.fillText('shape = ('+LONG.length+', 3) — '+NAMES.length+'명 × '+SUBJ.length+'과목 = '+(NAMES.length*SUBJ.length)+'행', gx, 36+13*10+22);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('한 행 = 관측 하나(누가 · 무엇을 · 몇 점) — 기계가 좋아하는 모양입니다.', gx, 36+13*10+42);
      } else if(s.step===2){
        ctx.fillStyle=ROSE; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('긴 형식이라 가능한 한 줄 집계', gx, 28);
        var tb2=drawTable(E, gx, 36, null, ['이름','과목','점수'], LONG, {cw:66, rh:13});
        // 과목별 평균(실계산) — 표 아래에 막대(폭은 W 비례로 넘침 방지)
        var mx=gx+40, labelW=44, valW=42, barMaxW=Math.max(50, Math.min(150, W-mx-labelW-valW-16));
        for(j=0;j<SUBJ.length;j++){ var my=tb2+22+j*22;
          ctx.fillStyle=DIM; ctx.font='11.5px sans-serif'; ctx.textAlign='left'; ctx.fillText(SUBJ[j], gx, my+4);
          var bw2=(means[j]/100)*barMaxW;
          ctx.fillStyle='rgba(255,122,184,0.35)'; ctx.strokeStyle=ROSE; ctx.lineWidth=1.2;
          ctx.fillRect(mx,my-8,bw2,14); ctx.strokeRect(mx,my-8,bw2,14);
          ctx.fillStyle=GRN; ctx.font='600 12px ui-monospace,Menlo,monospace';
          ctx.fillText(means[j].toFixed(2), mx+bw2+6, my+4);
        }
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif'; ctx.textAlign='left';
        ctx.fillText('과목이 100개여도 groupby 코드는 그대로 — 넓은 표라면 열마다 손대야 하죠.', gx, tb2+22+3*22+14);
      } else {
        ctx.fillStyle=ROSE; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('pivot 결과 — 넓은 형식 복원 (실제 변환)', gx, 28);
        drawTable(E, gx, 36, null, wideCols, BACK, {cw:70, rh:15});
        ctx.fillStyle=(eqN===totN)?GRN:RED; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('원본과 대조: 값 '+totN+'개 중 '+eqN+'개 일치 '+(eqN===totN?'✓ (왕복 무손실)':'✗'), gx, 36+15*4+26);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('계산은 긴 형식으로, 보여줄 때만 넓게 — 재구조화의 기본 리듬입니다.', gx, 36+15*4+48);
      }

      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 (넓은 표 → melt → 집계 → pivot 복원)', true);
      E.big('긴 형식 ↔ 넓은 형식 — melt와 pivot', '같은 데이터도 모양이 두 가지입니다. 사람 눈에는 과목이 열로 펼쳐진 넓은 표가 좋고, 계산에는 한 행이 관측 하나인 긴 표가 좋죠. melt로 녹이고 pivot으로 되돌리는 왕복 변환을 실제로 실행해, 행·열 개수와 복원 일치 여부를 전부 계산으로 확인합니다.'); }
  },

  // ══════════ 3. 그룹 연산의 세 얼굴 — agg · transform · filter ══════════
  { id:'bda5_03',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(350+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i, j;
      // 고정 예제: 학생 8명(반 A=4명, B=3명, C=1명)
      var STU=[['A',72],['A',88],['A',64],['A',95],['B',81],['B',77],['B',90],['C',55]];
      var CRIT=75;

      // ★실제 split-apply-combine
      var groups={}, order=[];
      for(i=0;i<STU.length;i++){ var k=STU[i][0];
        if(!groups[k]){ groups[k]={n:0,sum:0}; order.push(k); }
        groups[k].n++; groups[k].sum+=STU[i][1]; }
      var aggRows=[]; for(j=0;j<order.length;j++){ var g=groups[order[j]]; aggRows.push([order[j], (g.sum/g.n).toFixed(2)]); }
      var tfRows=[]; for(i=0;i<STU.length;i++){ var gg=groups[STU[i][0]]; tfRows.push([STU[i][0], STU[i][1], (gg.sum/gg.n).toFixed(2)]); }
      var keepRows=[], dropped=[];
      for(i=0;i<STU.length;i++){ var gm=groups[STU[i][0]].sum/groups[STU[i][0]].n;
        if(gm>=CRIT) keepRows.push([STU[i][0], STU[i][1]]); }
      for(j=0;j<order.length;j++){ var gm2=groups[order[j]].sum/groups[order[j]].n; if(gm2<CRIT) dropped.push(order[j]+'반(평균 '+gm2.toFixed(2)+')'); }
      var counts=[aggRows.length, tfRows.length, keepRows.length];   // 3 · 8 · 7 (실계산)

      var code=[
        {t:'g = df.groupby("반")["점수"]', hl:'groupby'},
        {t:'g.agg("mean")           # 줄이기', hl:'agg'},
        {t:'g.transform("mean")     # 길이 유지', hl:'transform'},
        {t:'df.groupby("반").filter(', hl:'filter'},
        {t:'  lambda t: t["점수"].mean() >= 75)', hl:'mean() >= 75'}
      ];
      var act=[1,2,3][s.step];
      var codeBot=codePanel(E, W*0.04, H*0.03, W*0.40, code, 'three_faces.py', act);

      // 좌측 하단: 원본 8행
      drawTable(E, W*0.04, codeBot+20, '원본 df — '+STU.length+'행 (반 3개)', ['반','점수'], STU, {cw:66, rh:13});

      // 우측: 현재 모드 결과(실계산)
      var gx=W*0.50;
      ctx.fillStyle=ROSE; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
      ctx.fillText(['agg — 그룹당 1행으로 줄이기','transform — 원본 길이를 유지하며 브로드캐스트','filter — 그룹 통째로 거르기'][s.step], gx, 26);
      var rb;
      if(s.step===0){
        rb=drawTable(E, gx, 40, null, ['반','평균'], aggRows, {cw:70, rh:15});
        ctx.fillStyle=GLD; ctx.font='600 13px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
        ctx.fillText(STU.length+'행 -> '+aggRows.length+'행 (그룹 수 = '+order.length+')', gx, rb+24);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('요약표·보고서가 목적일 때 — 결과의 단위는 "그룹"입니다.', gx, rb+46);
      } else if(s.step===1){
        rb=drawTable(E, gx, 40, null, ['반','점수','그룹평균'], tfRows, {cw:70, rh:13});
        ctx.fillStyle=GLD; ctx.font='600 13px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
        ctx.fillText(STU.length+'행 -> '+tfRows.length+'행 (길이 그대로)', gx, rb+22);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('각 행에 자기 그룹의 평균 — 편차 열·그룹별 결측 채우기의 재료입니다.', gx, rb+42);
      } else {
        rb=drawTable(E, gx, 40, null, ['반','점수'], keepRows, {cw:70, rh:13});
        ctx.fillStyle=GLD; ctx.font='600 13px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
        ctx.fillText(STU.length+'행 -> '+keepRows.length+'행', gx, rb+22);
        ctx.fillStyle=RED; ctx.font='12.5px sans-serif';
        ctx.fillText('탈락: '+dropped.join(', ')+' — 기준 '+CRIT+' 미달', gx, rb+42);
      }

      // 우측 끝: 세 얼굴 요약(항상 표시, 전부 실계산 행 수) — 결과표 아래 가로 배치(폭 W비례로 넘침 방지)
      var names=['agg','transform','filter'], subs=['줄인다','붙인다','거른다'];
      var sy=Math.max(rb+58, 190), boxGap=8, boxW=Math.min(150, (W-gx-16-boxGap*2)/3);
      for(j=0;j<3;j++){ var bx=gx+j*(boxW+boxGap), on=(j===s.step);
        ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.strokeStyle=on?ROSE:'rgba(255,255,255,0.16)'; ctx.lineWidth=on?1.6:1;
        roundRect(ctx,bx,sy,boxW,40,8); ctx.fill(); ctx.stroke();
        ctx.fillStyle=on?ROSE:DIM; ctx.font='600 11.5px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
        ctx.fillText(names[j]+' -> '+counts[j]+'행', bx+8, sy+17);
        ctx.fillStyle=on?TXT:DIM; ctx.font='11px sans-serif';
        ctx.fillText(subs[j], bx+8, sy+32);
      }
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left';
      ctx.fillText('세 방식 모두 같은 '+STU.length+'행에서 출발합니다.', gx, sy+58);

      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 (agg → transform → filter)', true);
      E.big('그룹 연산의 세 얼굴 — agg · transform · filter', '같은 8행을 세 방식으로 다뤄 봅니다. agg는 그룹당 한 행으로 줄이고, transform은 길이를 지키며 그룹 통계를 각 행에 돌려주고, filter는 조건에 못 미치는 그룹을 통째로 떨어뜨리죠. 결과 행 수 3·8·7이 전부 실제 계산에서 나온다는 점에 주목하세요.'); }
  },

  // ══════════ 4. 큰 데이터를 견디는 법 — dtype 다이어트와 청크 처리 ══════════
  { id:'bda5_04',
    enter:function(E){ var self=this; this.s={v:10};
      E.controls('<div class="ctrl"><label>행 수</label><input type="range" id="nr" min="1" max="100" step="1" value="10"><output id="nro">100만 행</output></div>');
      E.bind('#nr','input',function(e){ self.s.v=+e.target.value; document.getElementById('nro').textContent=(self.s.v*10)+'만 행'; E.blip(320+self.s.v*2,0.05); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var n=s.v*100000;
      // 고정 스키마: 열별 기본/최적화 dtype과 바이트 수(행당)
      var SCHEMA=[['고객ID','int64',8,'int32',4],['금액','float64',8,'float32',4],
                  ['지역','object',58,'category',1],['횟수','int64',8,'int8',1]];
      var bpr=0, opr=0;
      for(i=0;i<SCHEMA.length;i++){ bpr+=SCHEMA[i][2]; opr+=SCHEMA[i][4]; }
      // ★실계산: 메모리(MB)·절약 배수·청크 수·청크당 메모리
      var mbB=n*bpr/1048576, mbO=n*opr/1048576, ratio=bpr/opr;
      var CH=500000, kk=Math.ceil(n/CH), chunkMB=Math.min(CH,n)*opr/1048576;
      var maxMB=100*100000*bpr/1048576;   // 슬라이더 최대(1000만 행 기본 dtype) 기준 스케일

      var code=[
        {t:'df = pd.read_csv("logs.csv",', hl:'read_csv'},
        {t:'  dtype={"고객ID": "int32",', hl:'dtype'},
        {t:'         "지역": "category"})', hl:'category'},
        {t:'for c in pd.read_csv("logs.csv",', hl:'for c'},
        {t:'         chunksize=500_000):', hl:'chunksize'},
        {t:'    total += c["금액"].sum()', hl:'sum()'}
      ];
      var codeBot=codePanel(E, W*0.04, H*0.03, W*0.40, code, 'big_data.py', 1);

      // 좌측 하단: 열별 dtype 다이어트 표(고정 스키마)
      var fx=W*0.04, fy=codeBot+22;
      ctx.font='600 11.5px sans-serif'; ctx.textAlign='left';
      ctx.fillStyle=DIM; ctx.fillText('열', fx, fy);
      ctx.fillStyle=RED; ctx.fillText('기본 dtype', fx+96, fy);
      ctx.fillStyle=GRN; ctx.fillText('다이어트 후', fx+250, fy);
      ctx.font='11.5px ui-monospace,Menlo,monospace';
      for(i=0;i<SCHEMA.length;i++){ var ry=fy+16+i*15;
        ctx.fillStyle=TXT; ctx.fillText(SCHEMA[i][0], fx, ry);
        ctx.fillStyle=DIM; ctx.fillText(SCHEMA[i][1]+' '+SCHEMA[i][2]+'B', fx+96, ry);
        ctx.fillStyle=GRN; ctx.fillText(SCHEMA[i][3]+' '+SCHEMA[i][4]+'B', fx+250, ry);
      }
      ctx.fillStyle=GLD; ctx.font='600 12px ui-monospace,Menlo,monospace';
      ctx.fillText('행당 '+bpr+'B -> '+opr+'B ('+ratio.toFixed(1)+'배 절약)', fx, fy+16+4*15+8);

      // 우측: 메모리 막대(실계산 MB) + 청크 스트립
      var gx=W*0.52, barW=W*0.36;
      ctx.fillStyle=ROSE; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
      ctx.fillText('메모리 실측 — '+(s.v*10)+'만 행 기준', gx, 26);
      ctx.fillStyle=DIM; ctx.font='11.5px sans-serif'; ctx.fillText('기본 dtype로 전부 올리면', gx, 46);
      var wB=Math.max(3, mbB/maxMB*barW);
      ctx.fillStyle='rgba(240,136,138,0.4)'; ctx.strokeStyle=RED; ctx.lineWidth=1.2;
      ctx.fillRect(gx,52,wB,18); ctx.strokeRect(gx,52,wB,18);
      ctx.fillStyle=RED; ctx.font='600 12.5px ui-monospace,Menlo,monospace';
      ctx.fillText(mbB.toFixed(1)+' MB', gx+wB+8, 66);
      ctx.fillStyle=DIM; ctx.font='11.5px sans-serif'; ctx.fillText('다운캐스트 + 범주형이면', gx, 92);
      var wO=Math.max(3, mbO/maxMB*barW);
      ctx.fillStyle='rgba(126,224,176,0.4)'; ctx.strokeStyle=GRN;
      ctx.fillRect(gx,98,wO,18); ctx.strokeRect(gx,98,wO,18);
      ctx.fillStyle=GRN; ctx.font='600 12.5px ui-monospace,Menlo,monospace';
      ctx.fillText(mbO.toFixed(1)+' MB  ('+ratio.toFixed(1)+'배↓)', gx+wO+8, 112);

      ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
      ctx.fillText('그래도 크면 — 청크로 나눠 차례로: '+kk+'청크 × 50만 행', gx, 146);
      var chStep=Math.min(22,(W-gx-16)/Math.max(kk,1)), chSq=Math.max(6,chStep-5);
      for(i=0;i<kk;i++){ var cx=gx+i*chStep;
        if(i===0){ ctx.fillStyle='rgba(126,224,176,0.5)'; ctx.fillRect(cx,154,chSq,chSq); }
        ctx.strokeStyle=(i===0)?GRN:'rgba(255,255,255,0.25)'; ctx.lineWidth=1.2;
        ctx.strokeRect(cx,154,chSq,chSq);
      }
      ctx.fillStyle=GRN; ctx.font='600 12px sans-serif';
      ctx.fillText('메모리에는 한 번에 1청크만 = '+chunkMB.toFixed(1)+' MB', gx, 192);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif';
      ctx.fillText('합계·건수 같은 집계는 청크마다 계산해 더하면 전체와 정확히 같습니다.', gx, 212);

      E.tapHint(W/2, H*0.95, '슬라이더 = 행 수 — 메모리와 청크 수가 다시 계산됩니다', true);
      E.big('큰 데이터를 견디는 법', '데이터가 커지면 기교보다 산수가 먼저입니다 — 행 수 × 행당 바이트가 곧 메모리니까요. 정수 다운캐스트와 범주형으로 행당 82바이트를 10바이트로 줄이고, 그래도 크면 청크로 나눠 한 덩이씩 처리합니다. 슬라이더로 행 수를 키우며 메모리와 청크 수가 실제로 계산되는 걸 보세요.'); }
  },

  // ══════════ 5. 빠른지 어떻게 아는가 — 측정과 검증 ══════════
  { id:'bda5_05',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(340+this.s.step*90,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      // 고정 예제: 3글자 단어 100개(결정적 생성) — 문자열 이어붙이기 두 구현
      var WORDS=[]; for(i=0;i<100;i++) WORDS.push('w'+(i<10?'0':'')+i);
      // ★실측 1: 방법 A(+= 반복)가 복사하는 글자 수를 실제 루프로 셈
      var out='', copyA=0;
      for(i=0;i<WORDS.length;i++){ copyA+=out.length+WORDS[i].length; out+=WORDS[i]; }
      // ★실측 2: 방법 B(join)는 최종 길이만큼 한 번
      var fast=WORDS.join(''), copyB=fast.length;
      var eqAB=(out===fast);
      // ★회귀: 구분자를 잘못 넣은 수정본 — assert가 실제로 잡는가
      var bad=WORDS.join(','), eqBad=(bad===out), diffAt=-1;
      for(i=0;i<Math.min(bad.length,out.length);i++){ if(bad.charAt(i)!==out.charAt(i)){ diffAt=i; break; } }

      var code=[
        {t:'out = ""'},
        {t:'for w in words:          # 방법 A', hl:'for w'},
        {t:'    out += w', hl:'out += w'},
        {t:'fast = "".join(words)    # 방법 B', hl:'"".join'},
        {t:'assert fast == out       # 같은가?', hl:'assert'},
        {t:'fast2 = ",".join(words)  # 실수', hl:'",".join'},
        {t:'assert fast2 == out      # 회귀 검출', hl:'assert'}
      ];
      var act=[2,3,4,6][s.step];
      var codeBot=codePanel(E, W*0.04, H*0.03, W*0.40, code, 'measure_test.py', act);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left';
      var hint=['두 구현 모두 같은 문자열을 만듭니다 — 그런데 속도는?',
                'timeit처럼 반복 실측 — 여기서는 복사된 글자 수를 직접 셉니다.',
                'assert는 공짜 보험 — 빠른 길과 느린 길의 답을 맞춰 봅니다.',
                '수정한 뒤에는 테스트를 다시 — 회귀를 그 자리에서 잡습니다.'][s.step];
      ctx.fillText(hint, W*0.04, codeBot+26);

      var gx=W*0.50, bw=W*0.44;
      if(s.step===0){
        ctx.strokeStyle=BLU; ctx.lineWidth=1.4; ctx.fillStyle='rgba(255,255,255,0.04)';
        roundRect(ctx,gx,40,bw,54,8); ctx.fill(); ctx.stroke();
        ctx.fillStyle=BLU; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('방법 A — 반복문 +=', gx+14, 60);
        ctx.fillStyle=TXT; ctx.font='11.5px sans-serif';
        ctx.fillText('붙일 때마다 지금까지 만든 문자열 전체를 다시 복사합니다', gx+14, 80);
        ctx.strokeStyle=GRN; ctx.fillStyle='rgba(255,255,255,0.04)';
        roundRect(ctx,gx,112,bw,54,8); ctx.fill(); ctx.stroke();
        ctx.fillStyle=GRN; ctx.font='600 13px sans-serif';
        ctx.fillText('방법 B — "".join(words)', gx+14, 132);
        ctx.fillStyle=TXT; ctx.font='11.5px sans-serif';
        ctx.fillText('전체 길이를 미리 계산해 두고 마지막에 한 번만 씁니다', gx+14, 152);
        ctx.fillStyle=ROSE; ctx.font='600 13px sans-serif';
        ctx.fillText('어느 쪽이 몇 배 빠를까요? — 추측하지 말고 잽니다.', gx, 200);
      } else if(s.step===1){
        ctx.fillStyle=ROSE; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('복사된 글자 수 실측 — 단어 '+WORDS.length+'개 × 3글자', gx, 30);
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif'; ctx.fillText('방법 A (+=)', gx, 52);
        var wA=bw*0.78;
        ctx.fillStyle='rgba(240,136,138,0.4)'; ctx.strokeStyle=RED; ctx.lineWidth=1.2;
        ctx.fillRect(gx,58,wA,18); ctx.strokeRect(gx,58,wA,18);
        ctx.fillStyle=RED; ctx.font='600 12.5px ui-monospace,Menlo,monospace';
        ctx.fillText(fmt(copyA)+'회', gx+wA+8, 72);
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif'; ctx.fillText('방법 B (join)', gx, 98);
        var wJ=Math.max(3, copyB/copyA*wA);
        ctx.fillStyle='rgba(126,224,176,0.4)'; ctx.strokeStyle=GRN;
        ctx.fillRect(gx,104,wJ,18); ctx.strokeRect(gx,104,wJ,18);
        ctx.fillStyle=GRN; ctx.font='600 12.5px ui-monospace,Menlo,monospace';
        ctx.fillText(fmt(copyB)+'회', gx+wJ+8, 118);
        ctx.fillStyle=GLD; ctx.font='600 14px ui-monospace,Menlo,monospace';
        ctx.fillText((copyA/copyB).toFixed(1)+'배 차이', gx, 152);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('단어가 n개면 방법 A의 복사량은 n²에 비례해 커집니다 — 실측이 증거입니다.', gx, 174);
      } else if(s.step===2){
        ctx.strokeStyle=GRN; ctx.lineWidth=1.6; ctx.fillStyle='rgba(126,224,176,0.08)';
        roundRect(ctx,gx,40,bw,66,8); ctx.fill(); ctx.stroke();
        ctx.fillStyle=GRN; ctx.font='600 13px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
        ctx.fillText('assert fast == out  ->  통과 '+(eqAB?'✓':'✗'), gx+14, 62);
        ctx.fillStyle=TXT; ctx.font='12px sans-serif';
        ctx.fillText('길이 '+fast.length+' = '+out.length+' · 내용 문자 단위 완전 일치 (실제 비교)', gx+14, 86);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('최적화는 답이 같을 때만 최적화입니다 — 작은 예제로 늘 대조하세요.', gx, 132);
      } else {
        ctx.strokeStyle=RED; ctx.lineWidth=1.6; ctx.fillStyle='rgba(240,136,138,0.08)';
        roundRect(ctx,gx,40,bw,66,8); ctx.fill(); ctx.stroke();
        ctx.fillStyle=RED; ctx.font='600 13px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
        ctx.fillText('assert fast2 == out  ->  AssertionError!', gx+14, 62);
        ctx.fillStyle=TXT; ctx.font='12px sans-serif';
        ctx.fillText('길이 '+bad.length+' ≠ '+out.length+' · 첫 불일치 = '+diffAt+'번째 글자 (실제 비교'+(eqBad?'':': 다름')+')', gx+14, 86);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('구분자 하나 잘못 넣은 회귀를 테스트가 즉시 잡았습니다.', gx, 132);
        ctx.fillStyle=GLD; ctx.font='600 12.5px sans-serif';
        ctx.fillText('측정으로 빠르게, 테스트로 정확하게 — 성능 작업의 두 바퀴입니다.', gx, 158);
      }

      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 (두 구현 → 실측 → 검증 → 회귀 검출)', true);
      E.big('빠른지 어떻게 아는가 — 측정과 검증', '성능의 첫 계명은 "추측하지 말고 재라"입니다. 같은 문자열을 만드는 두 구현의 복사 횟수를 실제로 세어 50배 차이를 확인하고, assert 한 줄로 두 답이 같은지 검증합니다. 그리고 수정하다 생긴 실수를 그 테스트가 즉시 잡아내는 순간까지 — 빠르고도 옳은 코드의 습관입니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
