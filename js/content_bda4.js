/* 빅데이터 분석 제4장 — 데이터 조작 I: 입출력·결합·집계
   동작(behavior)만. 텍스트=content/bda4.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 화면의 모든 수(행 수·NaN 개수·dtype·평균·합계·조인 결과)는 JS로 실제 계산(하드코딩 금지).
   왼쪽=진짜 pandas 코드 패널+줄커서, 오른쪽=실계산 시각화(표·벤다이어그램·막대). */
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

  // 미니 DataFrame 표. rows에 null=NaN(빨강). idx 배열 주면 인덱스 열 표시. 반환=표 하단 y.
  function drawTable(E,x,y,title,cols,rows,opts){
    opts=opts||{};
    var ctx=E.ctx, cw=opts.cw||64, rh=opts.rh||22, hasIdx=!!opts.idx, iw=hasIdx?30:0, w=iw+cw*cols.length;
    if(title){ ctx.fillStyle=opts.tc||ROSE; ctx.font='600 12px sans-serif'; ctx.textAlign='left'; ctx.fillText(title, x, y-6); }
    ctx.fillStyle='rgba(255,122,184,0.14)'; ctx.fillRect(x,y,w,rh);
    ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1; ctx.strokeRect(x,y,w,rh);
    ctx.font='600 12px ui-monospace,Menlo,monospace'; ctx.textAlign='center';
    if(hasIdx){ ctx.fillStyle=DIM; ctx.fillText('', x+iw/2, y+rh/2+4); }
    for(var c=0;c<cols.length;c++){ ctx.fillStyle=ROSE; ctx.fillText(cols[c], x+iw+c*cw+cw/2, y+rh/2+4); }
    ctx.font='12px ui-monospace,Menlo,monospace';
    for(var r=0;r<rows.length;r++){
      var ry=y+rh*(r+1), dup=opts.dupIdx && opts.dupIdx.indexOf(r)>=0;
      ctx.fillStyle=(r%2)?'rgba(255,255,255,0.02)':'rgba(255,255,255,0.05)';
      ctx.fillRect(x,ry,w,rh); ctx.strokeStyle='rgba(255,255,255,0.10)'; ctx.strokeRect(x,ry,w,rh);
      if(hasIdx){ ctx.fillStyle=dup?RED:DIM; ctx.fillText(''+opts.idx[r], x+iw/2, ry+rh/2+4); }
      for(var c2=0;c2<cols.length;c2++){
        var v=rows[r][c2], na=(v===null||v!==v);
        ctx.fillStyle=na?RED:TXT;
        ctx.fillText(na?'NaN':(''+v), x+iw+c2*cw+cw/2, ry+rh/2+4);
      }
    }
    return y+rh*(rows.length+1);
  }

  function nanCount(rows){ var n=0; for(var i=0;i<rows.length;i++) for(var j=0;j<rows[i].length;j++) if(rows[i][j]===null) n++; return n; }

  // ── 실제 concat 구현 (골든룰) ──
  // tab = {cols:[..], idx:[..], rows:[[..]]}
  function concatV(tabs, ignoreIndex){
    var cols=[], i, j;
    for(i=0;i<tabs.length;i++) for(j=0;j<tabs[i].cols.length;j++) if(cols.indexOf(tabs[i].cols[j])<0) cols.push(tabs[i].cols[j]);
    var rows=[], idx=[];
    for(i=0;i<tabs.length;i++){ var t=tabs[i];
      for(j=0;j<t.rows.length;j++){ var row=[], r=t.rows[j];
        for(var c=0;c<cols.length;c++){ var k=t.cols.indexOf(cols[c]); row.push(k<0?null:r[k]); }
        rows.push(row); idx.push(t.idx[j]); } }
    if(ignoreIndex){ idx=[]; for(i=0;i<rows.length;i++) idx.push(i); }
    return {cols:cols, idx:idx, rows:rows};
  }
  function concatH(a,b,inner){
    var idx=[], i;
    if(inner){ for(i=0;i<a.idx.length;i++) if(b.idx.indexOf(a.idx[i])>=0) idx.push(a.idx[i]); }
    else { idx=a.idx.slice(); for(i=0;i<b.idx.length;i++) if(idx.indexOf(b.idx[i])<0) idx.push(b.idx[i]); idx.sort(function(p,q){return p-q;}); }
    var cols=a.cols.concat(b.cols), rows=[];
    for(i=0;i<idx.length;i++){ var ra=a.idx.indexOf(idx[i]), rb=b.idx.indexOf(idx[i]), row=[], j;
      for(j=0;j<a.cols.length;j++) row.push(ra<0?null:a.rows[ra][j]);
      for(j=0;j<b.cols.length;j++) row.push(rb<0?null:b.rows[rb][j]);
      rows.push(row); }
    return {cols:cols, idx:idx, rows:rows};
  }

  // ── 실제 merge(해시 조인) 구현 (골든룰) ──
  function merge(a,b,key,how){
    var ka=a.cols.indexOf(key), kb=b.cols.indexOf(key), map={}, i, j;
    for(i=0;i<b.rows.length;i++){ var k=b.rows[i][kb]; (map[k]=map[k]||[]).push(b.rows[i]); }  // build(해시 적재)
    var cols=[key]; for(j=0;j<a.cols.length;j++) if(j!==ka) cols.push(a.cols[j]);
    for(j=0;j<b.cols.length;j++) if(j!==kb) cols.push(b.cols[j]);
    function join(ra,rb){ var row=[ ra?ra[ka]:rb[kb] ], j2;
      for(j2=0;j2<a.cols.length;j2++) if(j2!==ka) row.push(ra?ra[j2]:null);
      for(j2=0;j2<b.cols.length;j2++) if(j2!==kb) row.push(rb?rb[j2]:null);
      return row; }
    var out=[], usedB={};
    for(i=0;i<a.rows.length;i++){ var ra=a.rows[i], hits=map[ra[ka]]||[];   // probe(탐침)
      if(hits.length){ for(j=0;j<hits.length;j++) out.push(join(ra,hits[j])); usedB[ra[ka]]=1; }
      else if(how==='left'||how==='outer') out.push(join(ra,null)); }
    if(how==='right'||how==='outer')
      for(i=0;i<b.rows.length;i++) if(!usedB[b.rows[i][kb]]) out.push(join(null,b.rows[i]));
    return {cols:cols, rows:out};
  }

  var scenes = [

  // ══════════ 1. 데이터를 불러오고 내보내기 — read_csv의 실전 함정 ══════════
  { id:'bda4_01',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(340+this.s.step*90,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 고정 원본 파일(문자열 그대로) — 파싱은 아래서 실제 수행
      var RAWC=['id','name','score'];
      var RAW=[['001','민준','95'],['002','서연','NIL'],['003','지호','88']];

      // 실제 파싱 시뮬레이션: 열별 타입 추론(pandas 규칙과 동일한 논리)
      function parse(naVals, strCols){
        var cols=RAWC, out=[], dtypes=[], c, r;
        for(c=0;c<cols.length;c++){
          var vals=[], hasNa=false, allNum=true, allInt=true;
          for(r=0;r<RAW.length;r++) vals.push(RAW[r][c]);
          var conv=[], forceStr=strCols.indexOf(cols[c])>=0;
          for(r=0;r<vals.length;r++){
            var v=vals[r];
            if(naVals.indexOf(v)>=0){ conv.push(null); hasNa=true; continue; }
            if(forceStr){ conv.push(v); allNum=false; continue; }
            var num=Number(v);
            if(v!=='' && isFinite(num)){ conv.push(num); if(num%1!==0) allInt=false; }
            else { conv.push(v); allNum=false; }
          }
          var dt = forceStr ? 'object' : (!allNum ? 'object' : (hasNa ? 'float64' : (allInt?'int64':'float64')));
          if(!allNum && !forceStr){ // 혼합 열: 전부 문자열로 남음(pandas object 동작)
            conv=[]; for(r=0;r<vals.length;r++) conv.push(naVals.indexOf(vals[r])>=0?null:vals[r]);
          }
          if(dt==='float64'){ for(r=0;r<conv.length;r++) if(conv[r]!==null) conv[r]=conv[r].toFixed(1); }
          out.push(conv); dtypes.push(dt);
        }
        var rows=[]; for(r=0;r<RAW.length;r++){ var row=[]; for(c=0;c<cols.length;c++) row.push(out[c][r]); rows.push(row); }
        return {rows:rows, dtypes:dtypes};
      }
      var confs=[
        {na:[], str:[], cap:'그냥 읽으면 — "NIL" 한 글자가 score 열 전체를 문자열로 만듭니다'},
        {na:['NIL'], str:[], cap:'na_values로 결측 표기를 알려주면 — score가 숫자(float64)가 됩니다'},
        {na:['NIL'], str:['id'], cap:'dtype으로 id를 문자열로 고정 — 앞자리 0("001")이 살아남습니다'},
        {na:['NIL'], str:['id'], cap:'파케이로 내보내면 — 타입과 결측이 파일에 함께 저장됩니다'}
      ];
      var P=parse(confs[s.step].na, confs[s.step].str);
      var nn=nanCount(P.rows.map(function(r){return r;}));

      var code=[
        {t:'import pandas as pd', dim:true},
        {t:'df = pd.read_csv("scores.csv")', hl:'read_csv'},
        {t:'df = pd.read_csv("scores.csv",', hl:'read_csv'},
        {t:'        na_values=["NIL"])', hl:'na_values'},
        {t:'df = pd.read_csv("scores.csv",', hl:'read_csv'},
        {t:'        na_values=["NIL"],', hl:'na_values'},
        {t:'        dtype={"id": str})', hl:'dtype'},
        {t:'df.to_parquet("scores.parquet")', hl:'to_parquet'}
      ];
      var act=[1,3,6,7][s.step];
      var codeBot=codePanel(E, W*0.04, H*0.02, W*0.44, code, 'read_write.py', act);

      // 코드 패널 아래: 원본 파일(있는 그대로) — 행 높이를 줄여 패널 전체가 캔버스 안에 들어오게, 패널 테두리와 겹치지 않게 여백 확보
      var fx=W*0.04, fy=codeBot+18;
      ctx.fillStyle=DIM; ctx.font='600 11.5px sans-serif'; ctx.textAlign='left'; ctx.fillText('scores.csv (원본 파일 그대로)', fx, fy-6);
      ctx.fillStyle='rgba(255,255,255,0.03)'; ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1;
      roundRect(ctx,fx,fy,W*0.30,4*12+14,8); ctx.fill(); ctx.stroke();
      ctx.font='11.5px ui-monospace,Menlo,monospace';
      var fl=['id,name,score','001,민준,95','002,서연,NIL','003,지호,88'];
      for(var i=0;i<fl.length;i++){
        var line=fl[i], ly=fy+7+i*12+5;
        if(line.indexOf('NIL')>=0 && s.step===0){
          var pre=line.split('NIL')[0];
          ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText(pre, fx+12, ly);
          ctx.fillStyle=RED; ctx.fillText('NIL', fx+12+ctx.measureText(pre).width, ly);
        } else { ctx.fillStyle=(i===0)?DIM:TXT; ctx.textAlign='left'; ctx.fillText(line, fx+12, ly); }
      }

      // 우측: 파싱된 DataFrame + dtype 판정(실계산) — 표 행 높이·간격을 줄여 4단계(내보내기 비교 박스)까지 캔버스 안에
      var gx=W*0.53, gy=H*0.09;
      ctx.fillStyle=ROSE; ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.fillText('읽은 결과 (파싱 규칙대로 실제 판정)', gx, gy);
      var tb=drawTable(E, gx, gy+16, null, RAWC, P.rows, {cw:86, rh:14});
      // dtype 행
      ctx.font='600 12px ui-monospace,Menlo,monospace'; ctx.textAlign='center';
      for(var c=0;c<3;c++){
        var dt=P.dtypes[c], bad=(dt==='object' && c===2);
        ctx.fillStyle=bad?RED:(dt==='object'?DIM:GRN);
        ctx.fillText(dt, gx+c*86+43, tb+14);
      }
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='right'; ctx.fillText('dtype', gx-8, tb+14); ctx.textAlign='left';
      // 판정 요약(실계산 값)
      var vy=tb+26;
      ctx.textAlign='left'; ctx.font='12px sans-serif';
      ctx.fillStyle=(P.dtypes[2]==='object')?RED:GRN;
      ctx.fillText('score 열 타입 = '+P.dtypes[2]+' · 결측(NaN) '+nn+'개', gx, vy);
      ctx.fillStyle=(s.step>=2)?GRN:RED; ctx.font='12px ui-monospace,Menlo,monospace';
      ctx.fillText('id 첫 값 = '+(P.rows[0][0]===null?'NaN':P.rows[0][0])+(s.step>=2?'  (앞자리 0 보존)':'  (0이 사라짐!)'), gx, vy+16);

      if(s.step===3){
        // 내보내기 비교: 무엇이 보존되는가 (파싱 결과에서 실제 판정)
        var cy2=vy+30;
        ctx.fillStyle=GLD; ctx.font='600 12px sans-serif'; ctx.fillText('CSV vs 파케이 — 다시 읽을 때', gx, cy2);
        var cmp=[
          ['CSV(텍스트)', '타입을 매번 다시 추론 — 옵션을 또 챙겨야 함', RED],
          ['파케이(열 저장)', '타입·결측을 파일이 기억 — 그대로 복원, 열만 골라 읽어 빠름', GRN]
        ];
        for(var k=0;k<2;k++){ var ry=cy2+8+k*30;
          ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.strokeStyle=cmp[k][2]; ctx.lineWidth=1.4;
          roundRect(ctx,gx,ry,W*0.42,26,8); ctx.fill(); ctx.stroke();
          ctx.fillStyle=cmp[k][2]; ctx.font='600 11.5px sans-serif'; ctx.fillText(cmp[k][0], gx+12, ry+11);
          ctx.fillStyle=TXT; ctx.font='11px sans-serif'; ctx.fillText(cmp[k][1], gx+12, ry+22);
        }
      } else {
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText(confs[s.step].cap, gx, vy+30);
      }

      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 (그냥 읽기 → na_values → dtype → 내보내기)', true);
      E.big('데이터를 불러오고 내보내기', '분석의 첫 줄은 언제나 read_csv입니다. 그런데 결측 표기 하나("NIL")가 숫자 열 전체를 문자열로 바꾸고, 사원번호 "001"의 0을 지워 버리죠. na_values와 dtype으로 파일의 사정을 알려주면 표가 바로잡힙니다 — 그리고 그 결과를 파케이로 저장하면 타입까지 파일이 기억합니다.'); }
  },

  // ══════════ 2. 표를 이어 붙이기 — concat ══════════
  { id:'bda4_02',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(330+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 고정 예제 표
      var A={cols:['이름','국어'], idx:[0,1], rows:[['민준',90],['서연',85]]};
      var B={cols:['이름','수학'], idx:[0,1], rows:[['지호',78],['하은',92]]};
      var C={cols:['수학'],       idx:[1,2], rows:[[77],[93]]};

      var code=[
        {t:'pd.concat([A, B])', hl:'concat'},
        {t:'pd.concat([A, B],', hl:'concat'},
        {t:'    ignore_index=True)', hl:'ignore_index'},
        {t:'pd.concat([A, C], axis=1)', hl:'axis=1'},
        {t:'pd.concat([A, C], axis=1,', hl:'axis=1'},
        {t:'    join="inner")', hl:'join="inner"'}
      ];
      var act=[0,2,3,5][s.step];
      var codeBot=codePanel(E, W*0.04, H*0.10, W*0.40, code, 'concat.py', act);

      // 결과를 실제 concat 연산으로 계산
      var R, cap, dup=null, right=(s.step>=2)?C:B;
      if(s.step===0){ R=concatV([A,B],false); cap='열이 다르면 합집합 — 빈 자리는 NaN, 인덱스는 0,1,0,1로 중복!';
        dup=[]; var seen={}; for(var d=0;d<R.idx.length;d++){ if(seen[R.idx[d]]!=null){dup.push(d);dup.push(seen[R.idx[d]]);} seen[R.idx[d]]=d; } }
      else if(s.step===1){ R=concatV([A,B],true); cap='ignore_index=True — 인덱스를 0부터 새로 매겨 중복 해소.'; }
      else if(s.step===2){ R=concatH(A,C,false); cap='좌우 붙이기는 위치가 아니라 인덱스로 맞춥니다 — 어긋난 인덱스는 NaN.'; }
      else { R=concatH(A,C,true); cap='join="inner" — 양쪽에 다 있는 인덱스만 남깁니다.'; }
      var nn=nanCount(R.rows);

      // 좌측 하단: 원본 두 표
      var ty=codeBot+34;
      var b1=drawTable(E, W*0.04, ty, 'A ('+A.rows.length+'행)', A.cols, A.rows, {cw:58, idx:A.idx});
      drawTable(E, W*0.24, ty, (s.step>=2?'C (인덱스 1,2)':'B ('+B.rows.length+'행)'), right.cols, right.rows, {cw:58, idx:right.idx});

      // 우측: 결과(실계산)
      var gx=W*0.52, gy=H*0.13;
      ctx.fillStyle=ROSE; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
      ctx.fillText('결과 — 실제로 이어 붙여 계산', gx, gy);
      var rb=drawTable(E, gx, gy+22, null, R.cols, R.rows, {cw:64, idx:R.idx, dupIdx:dup});
      // shape·NaN 실측 표시
      ctx.fillStyle=GLD; ctx.font='600 14px ui-monospace,Menlo,monospace';
      ctx.fillText('shape = ('+R.rows.length+', '+R.cols.length+')', gx, rb+24);
      ctx.fillStyle=nn>0?RED:GRN;
      ctx.fillText('NaN = '+nn+'개', gx+190, rb+24);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText(cap, gx, rb+48);
      if(s.step===0 && dup && dup.length){
        ctx.fillStyle=RED; ctx.font='12px sans-serif';
        ctx.fillText('빨간 인덱스 = 중복 — df.loc[0]이 두 행을 돌려줍니다.', gx, rb+70);
      }

      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 (위아래 → ignore_index → 좌우 → inner)', true);
      E.big('표를 이어 붙이기 — concat', '월별 파일처럼 같은 꼴의 표는 위아래로 쌓고(axis=0), 다른 정보의 표는 좌우로 붙입니다(axis=1). 함정은 두 가지 — 쌓으면 인덱스가 중복되고, 좌우 붙이기는 위치가 아니라 인덱스로 정렬한다는 것. 결과의 shape과 NaN 개수를 실제로 세어 확인해 보세요.'); }
  },

  // ══════════ 3. 표를 짝지어 합치기 — merge(조인) ══════════
  { id:'bda4_03',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(340+this.s.step*90,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 고정 예제: 고객 표와 주문 표 (cid 1,4는 주문 없음 · cid 5는 고객 정보 없음 · cid 3은 주문 2건)
      var CUST={cols:['cid','이름'], rows:[[1,'가영'],[2,'나윤'],[3,'다인'],[4,'라온']]};
      var ORD ={cols:['cid','금액'], rows:[[2,300],[3,150],[3,220],[5,90]]};
      var hows=['inner','left','right','outer'];
      var how=hows[s.step];
      var R=merge(CUST,ORD,'cid',how);            // ★실제 해시 조인 수행
      var nn=nanCount(R.rows);

      var code=[
        {t:'pd.merge(customers, orders,', hl:'merge'},
        {t:'    on="cid", how="inner")', hl:'"inner"'},
        {t:'pd.merge(..., how="left")', hl:'"left"'},
        {t:'pd.merge(..., how="right")', hl:'"right"'},
        {t:'pd.merge(..., how="outer")', hl:'"outer"'}
      ];
      var act=[1,2,3,4][s.step];
      var codeBot=codePanel(E, W*0.04, H*0.05, W*0.38, code, 'merge.py', act);

      // 좌측 하단: 두 원본 표 — 행 높이를 줄여 캔버스 안에
      var ty=codeBot+16;
      drawTable(E, W*0.04, ty, 'customers (고객 '+CUST.rows.length+'명)', CUST.cols, CUST.rows, {cw:56, rh:16});
      drawTable(E, W*0.22, ty, 'orders (주문 '+ORD.rows.length+'건)', ORD.cols, ORD.rows, {cw:56, rh:16});

      // 중앙: 벤 다이어그램 — how에 따라 살아남는 영역 강조. r·vy를 H에 맞춰 축소해 작은 화면에서도 라벨이 캔버스 안에
      var vx=W*0.50, r=Math.min(52,H*0.15), off=r*0.6, vy=Math.max(H*0.30, r+40);
      ctx.font='600 13px sans-serif'; ctx.textAlign='center';
      var keepL=(how==='left'||how==='outer'), keepR=(how==='right'||how==='outer');
      // 왼쪽 원(고객만), 교집합, 오른쪽 원(주문만)
      ctx.globalAlpha=keepL?0.55:0.12; ctx.fillStyle=BLU;
      ctx.beginPath(); ctx.arc(vx-off,vy,r,0,7); ctx.fill();
      ctx.globalAlpha=keepR?0.55:0.12; ctx.fillStyle=GLD;
      ctx.beginPath(); ctx.arc(vx+off,vy,r,0,7); ctx.fill();
      ctx.globalAlpha=0.75; ctx.fillStyle=GRN;   // 교집합은 모든 조인에서 생존
      ctx.beginPath(); ctx.arc(vx-off,vy,r,-1.0,1.0); ctx.arc(vx+off,vy,r,Math.PI-1.0,Math.PI+1.0); ctx.fill();
      ctx.globalAlpha=1;
      ctx.strokeStyle=BLU; ctx.lineWidth=1.6; ctx.beginPath(); ctx.arc(vx-off,vy,r,0,7); ctx.stroke();
      ctx.strokeStyle=GLD; ctx.beginPath(); ctx.arc(vx+off,vy,r,0,7); ctx.stroke();
      ctx.fillStyle=BLU; ctx.fillText('고객만', vx-off-r-4, vy-r-10);
      ctx.fillStyle=GLD; ctx.fillText('주문만', vx+off+r+4, vy-r-10);
      // how="..." 라벨은 다이어그램 아래(짝 있음 밑)에 둬 상단 제목과 겹치지 않게
      ctx.fillStyle=GRN; ctx.fillText('짝 있음', vx, vy+r+18);
      ctx.fillStyle=ROSE; ctx.font='600 15px ui-monospace,Menlo,monospace';
      ctx.fillText('how="'+how+'"', vx, vy+r+38);

      // 우측: 결과 표(실계산) + 행 수·NaN
      var gx=W*0.66, gy=H*0.12;
      ctx.fillStyle=ROSE; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('조인 결과 (실제 연산)', gx, gy);
      var rb=drawTable(E, gx, gy+22, null, R.cols, R.rows, {cw:56});
      ctx.fillStyle=GLD; ctx.font='600 14px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
      ctx.fillText(R.rows.length+'행', gx, rb+22);
      ctx.fillStyle=nn>0?RED:GRN; ctx.fillText('NaN '+nn+'개', gx+70, rb+22);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif';
      var caps={inner:'짝이 있는 행만 — 고객 3(다인)은 주문 2건이라 두 번 등장합니다.',
                left:'고객은 전원 유지 — 주문 없는 가영·라온의 금액은 NaN.',
                right:'주문은 전부 유지 — 고객 정보 없는 cid 5의 이름은 NaN.',
                outer:'양쪽 전부 — 빠진 자리는 모두 NaN으로 채웁니다.'};
      ctx.fillText(caps[how], gx, rb+44);

      E.tapHint(W/2, H*0.93, '화면 탭 = 조인 종류 (inner → left → right → outer)', true);
      E.big('표를 짝지어 합치기 — merge(조인)', '이어 붙이기가 아니라 열쇠(키)로 짝을 맞추는 결합입니다. how가 결정하는 건 "짝 없는 행의 운명" — inner는 버리고, left/right는 한쪽을 지키고, outer는 전부 살립니다. 내부에서는 한쪽을 해시 표에 적재하고 다른 쪽으로 탐침하는, 알고리즘 트랙에서 본 그 해시 탐색이 돌아갑니다.'); }
  },

  // ══════════ 4. 한 번에 하나씩 — apply · map ══════════
  { id:'bda4_04',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(350+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 고정 예제 표
      var NAMES=['민준','서연','지호','하은'];
      var SUBJ=['국어','영어','수학'];
      var SC=[[90,85,78],[72,95,88],[84,70,91],[66,88,79]];
      var i,j;

      var code=[
        {t:'df.mean()          # 열 방향', hl:'.mean()'},
        {t:'# = df.apply("mean", axis=0)', dim:true},
        {t:'', dim:true},
        {t:'df.mean(axis=1)    # 행 방향', hl:'axis=1'},
        {t:'', dim:true},
        {t:'grade = lambda x: \\', hl:'lambda'},
        {t:'    "A" if x >= 80 else "B"', hl:'if x >= 80'},
        {t:'df["국어"].map(grade)', hl:'.map'}
      ];
      var act=[0,3,7][s.step];
      var codeBot=codePanel(E, W*0.04, H*0.10, W*0.42, code, 'apply_map.py', act);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.textAlign='left';
      var hint=['축(axis) 0 = 열을 따라 위→아래로 요약합니다.',
                '축 1 = 행을 따라 왼→오른쪽으로 요약합니다.',
                'map은 표가 아니라 원소 하나하나에 함수를 적용합니다.'][s.step];
      ctx.fillText(hint, W*0.04, codeBot+26);

      // 실계산: 열 평균 · 행 평균 · 등급 매핑
      var colMean=[], rowMean=[], grades=[];
      for(j=0;j<3;j++){ var cs=0; for(i=0;i<4;i++) cs+=SC[i][j]; colMean.push(cs/4); }
      for(i=0;i<4;i++){ var rs=0; for(j=0;j<3;j++) rs+=SC[i][j]; rowMean.push(rs/3); }
      for(i=0;i<4;i++) grades.push(SC[i][0]>=80?'A':'B');

      // 우측: 표 + 방향 강조 + 결과(실계산)
      var gx=W*0.52, gy=H*0.14, cw=64, rh=24;
      ctx.fillStyle=ROSE; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
      ctx.fillText(['열 단위 — 과목별 평균','행 단위 — 학생별 평균','원소 단위 — 국어 등급'][s.step], gx, gy-4);
      var cols=['이름'].concat(SUBJ);
      var rows=[]; for(i=0;i<4;i++) rows.push([NAMES[i]].concat(SC[i]));
      var tb=drawTable(E, gx, gy+14, null, cols, rows, {cw:cw, rh:rh});

      if(s.step===0){
        // 열 화살표(셀 텍스트를 피해 열 오른쪽 가장자리) + 아래에 평균 행
        for(j=0;j<3;j++){ var ax=gx+cw*(j+1)+cw/2, axr=ax+24;
          ctx.strokeStyle=GRN; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(axr, gy+40); ctx.lineTo(axr, tb-4); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(axr-4,tb-10); ctx.lineTo(axr,tb-4); ctx.lineTo(axr+4,tb-10); ctx.fillStyle=GRN; ctx.fill();
          ctx.fillStyle=GRN; ctx.font='600 13px ui-monospace,Menlo,monospace'; ctx.textAlign='center';
          ctx.fillText(colMean[j].toFixed(2), ax, tb+20);
        }
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('mean', gx+8, tb+20);
        ctx.fillStyle=GRN; ctx.font='12.5px sans-serif';
        ctx.fillText('4개 값이 열마다 1개로 접힙니다 — 결과는 길이 3의 Series.', gx, tb+46);
      } else if(s.step===1){
        // 행 화살표(텍스트 밑줄 위치) + 오른쪽에 평균 열
        for(i=0;i<4;i++){ var ay=gy+14+rh*(i+1)+rh/2+4, ex=gx+cw*4+8;
          ctx.strokeStyle=BLU; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(gx+cw+4, ay+5); ctx.lineTo(ex, ay+5); ctx.stroke();
          ctx.fillStyle=BLU; ctx.font='600 13px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
          ctx.fillText(rowMean[i].toFixed(2), ex+8, ay);
        }
        ctx.fillStyle=BLU; ctx.font='12.5px sans-serif'; ctx.textAlign='left';
        ctx.fillText('행마다 1개 — 결과는 길이 4의 Series(학생별 평균).', gx, tb+24);
        // 벡터화 대비: 함수 호출 횟수를 실제로 셈
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('내장 mean(axis=1)은 C 루프 1번 · 파이썬 함수를 apply하면 행 수만큼('+rowMean.length+'번) 호출됩니다.', gx, tb+48);
      } else {
        // 국어 열 → 등급 (원소 단위, 실판정) — 표 오른쪽에 결과 나열
        for(i=0;i<4;i++){ var ay2=gy+14+rh*(i+1)+rh/2+4, gx2=gx+cw*4+14;
          ctx.fillStyle=DIM; ctx.font='13px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
          ctx.fillText('→', gx2, ay2);
          ctx.fillStyle=(grades[i]==='A')?GRN:GLD; ctx.font='600 14px ui-monospace,Menlo,monospace';
          ctx.fillText(grades[i], gx2+22, ay2);
          ctx.fillStyle=DIM; ctx.font='11.5px ui-monospace,Menlo,monospace';
          ctx.fillText('('+SC[i][0]+(SC[i][0]>=80?' ≥ 80':' < 80')+')', gx2+40, ay2);
        }
        ctx.fillStyle=GLD; ctx.font='12.5px sans-serif'; ctx.textAlign='left';
        ctx.fillText('국어 점수 4개가 각각 grade()를 통과 — 80점 기준으로 실제 판정한 결과입니다.', gx, tb+24);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('사전(dict)을 넘기면 값 치환도 됩니다: s.map({"A":1,"B":0}).', gx, tb+48);
      }

      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 (열 단위 → 행 단위 → 원소 단위)', true);
      E.big('한 번에 하나씩 — apply · map', '표 전체를 요약할 땐 방향이 전부입니다 — axis=0은 열을 접고, axis=1은 행을 접습니다. 원소 하나하나를 바꿀 땐 map이죠. 단, 파이썬 함수를 apply로 돌리면 행 수만큼 호출이 일어납니다 — 3장에서 본 것처럼, 내장 벡터화 연산이 있으면 언제나 그쪽이 먼저입니다.'); }
  },

  // ══════════ 5. 쪼개고 계산하고 합치기 — groupby ══════════
  { id:'bda4_05',
    enter:function(E){ var self=this; this.s={gk:0};
      var labels=['"반"','"성별"','["반","성별"]'];
      E.controls('<div class="ctrl"><label>그룹 키</label><input type="range" id="gk" min="0" max="2" step="1" value="0"><output id="gko">"반"</output></div>');
      E.bind('#gk','input',function(e){ self.s.gk=+e.target.value; document.getElementById('gko').textContent=labels[self.s.gk]; E.blip(340+self.s.gk*80,0.06); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 고정 예제: 학생 8명 (반·성별·점수)
      var STU=[['A','남',72],['A','여',88],['A','남',64],['A','여',95],
               ['B','남',81],['B','여',77],['B','남',90],['B','여',69]];
      var keys=[[0],[1],[0,1]][s.gk], i, j;

      // ★실제 split-apply-combine: 키로 쪼개 그룹별 n·합·평균 계산
      var groups={}, order=[];
      for(i=0;i<STU.length;i++){
        var kparts=[]; for(j=0;j<keys.length;j++) kparts.push(STU[i][keys[j]]);
        var k=kparts.join('·');
        if(!groups[k]){ groups[k]={n:0,sum:0}; order.push(k); }
        groups[k].n++; groups[k].sum+=STU[i][2];
      }
      order.sort();
      var agg=[]; for(i=0;i<order.length;i++){ var g=groups[order[i]];
        agg.push({key:order[i], n:g.n, sum:g.sum, mean:g.sum/g.n}); }
      // transform: 각 원본 행에 자기 그룹 평균을 붙임(길이 유지)
      var tf=[]; for(i=0;i<STU.length;i++){
        var kp=[]; for(j=0;j<keys.length;j++) kp.push(STU[i][keys[j]]);
        var gg=groups[kp.join('·')]; tf.push((gg.sum/gg.n).toFixed(2)); }

      var keyLbl=['"반"','"성별"','["반","성별"]'][s.gk];
      var code=[
        {t:'g = df.groupby('+keyLbl+')', hl:'groupby'},
        {t:'g["점수"].agg(', hl:'agg'},
        {t:'    인원="size", 평균="mean", 합계="sum")', hl:'mean'},
        {t:'df["그룹평균"] = g["점수"] \\', hl:'그룹평균'},
        {t:'    .transform("mean")', hl:'transform'}
      ];
      var codeBot=codePanel(E, W*0.04, H*0.02, W*0.40, code, 'groupby.py', 0);

      // 좌측 하단: 원본 8행 + transform 열(실계산, 길이 유지) — 행 높이를 줄여 캔버스 안에, 패널 테두리와 겹치지 않게 여백 확보
      var rows=[]; for(i=0;i<8;i++) rows.push([STU[i][0],STU[i][1],STU[i][2],tf[i]]);
      var ot=drawTable(E, W*0.04, codeBot+18, '원본 8행 + transform 열(길이 그대로)', ['반','성별','점수','그룹평균'], rows, {cw:60, rh:12});

      // 우측 상단: 집계 표(실계산) — 행 높이를 줄여 막대까지 캔버스 안에
      var gx=W*0.50, gy=H*0.08;
      ctx.fillStyle=ROSE; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
      ctx.fillText('그룹 '+agg.length+'개 — 쪼개서(split) 계산해(apply) 합친(combine) 결과', gx, gy);
      var arows=[]; for(i=0;i<agg.length;i++) arows.push([agg[i].key, agg[i].n, agg[i].mean.toFixed(2), agg[i].sum]);
      var ab=drawTable(E, gx, gy+14, null, ['그룹','인원','평균','합계'], arows, {cw:66, rh:16});

      // 우측 하단: 그룹 평균 막대(실계산 값에 비례)
      var bx=gx, bw=Math.min(84, (W*0.44)/agg.length-14), bb=ab+70, maxM=0;
      for(i=0;i<agg.length;i++) if(agg[i].mean>maxM) maxM=agg[i].mean;
      for(i=0;i<agg.length;i++){
        var h=(agg[i].mean/maxM)*56, x0=bx+i*(bw+14), y0=bb-h;
        ctx.fillStyle='rgba(255,122,184,0.35)'; ctx.strokeStyle=ROSE; ctx.lineWidth=1.4;
        ctx.fillRect(x0,y0,bw,h); ctx.strokeRect(x0,y0,bw,h);
        ctx.fillStyle=GRN; ctx.font='600 12px ui-monospace,Menlo,monospace'; ctx.textAlign='center';
        ctx.fillText(agg[i].mean.toFixed(1), x0+bw/2, y0-5);
        ctx.fillStyle=TXT; ctx.font='11px sans-serif';
        ctx.fillText(agg[i].key+' (n='+agg[i].n+')', x0+bw/2, bb+12);
      }
      ctx.fillStyle=DIM; ctx.font='11.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText('agg는 그룹당 1행으로 줄이고, transform은 8행 길이를 지킵니다.', gx, bb+28);

      E.tapHint(W/2, H*0.95, '슬라이더로 그룹 키를 바꿔 보세요 — 그룹 수·평균이 다시 계산됩니다', true);
      E.big('쪼개고 계산하고 합치기 — groupby', '"반별 평균은?" 같은 질문의 표준 해법입니다. 키로 표를 쪼개고(split), 그룹마다 계산하고(apply), 다시 합칩니다(combine). 키를 바꾸면 그룹 수와 모든 집계가 그 자리에서 다시 계산되죠. agg는 그룹당 한 행으로 요약하고, transform은 원본 길이를 지켜 "자기 그룹 평균과의 차이" 같은 새 열을 만들 때 씁니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
