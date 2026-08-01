/* 빅데이터 분석 제38장 — 시각화로 인사이트를 얻는 과정 (탐색 1단계 · 분석 2단계 · 활용 3단계)
   동작(behavior)만. 텍스트=content/bda38.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 화면의 모든 수(평균·중앙값·사분위·결측수·이상값 판정·성장률·상관계수 등)는 아래 고정
   데이터로부터 이 파일 로드 시 또는 draw 시점에 실제 계산(하드코딩 금지). 난수 사용 없음(전부 고정 배열). */
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
      if(actLine!=null && ((typeof actLine==='number'&&i===actLine)||(actLine.indexOf&&actLine.indexOf(i)>=0))){ ctx.fillStyle='rgba(255,122,184,0.16)'; ctx.fillRect(x+4, cy+i*lh+1, w-8, lh-2); ctx.fillStyle=ROSE; ctx.fillRect(x+4, cy+i*lh+1, 3, lh-2); }
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

  // ── 통계 헬퍼(고정 배열을 실제로 계산) ─────────────────────────────────────
  function mean(a){ return a.reduce(function(s,v){return s+v;},0)/a.length; }
  function variance(a){ var m=mean(a); return a.reduce(function(s,v){return s+(v-m)*(v-m);},0)/a.length; }
  function stddev(a){ return Math.sqrt(variance(a)); }
  function corr(a,b){ var ma=mean(a),mb=mean(b),n=a.length,sxy=0,sxx=0,syy=0;
    for(var i=0;i<n;i++){ sxy+=(a[i]-ma)*(b[i]-mb); sxx+=(a[i]-ma)*(a[i]-ma); syy+=(b[i]-mb)*(b[i]-mb); }
    return sxy/Math.sqrt(sxx*syy); }
  function describeMissing(arr){
    var vals=arr.filter(function(v){return v!=null;});
    var n=vals.length, missing=arr.length-n;
    var sorted=vals.slice().sort(function(a,b){return a-b;});
    function pct(p){ var idx=(sorted.length-1)*p, lo=Math.floor(idx), hi=Math.ceil(idx); return lo===hi?sorted[lo]:sorted[lo]+(sorted[hi]-sorted[lo])*(idx-lo); }
    var med=pct(0.5), q1=pct(0.25), q3=pct(0.75), iqr=q3-q1, lo=q1-1.5*iqr, hi=q3+1.5*iqr;
    var outliers=[]; arr.forEach(function(v,i){ if(v!=null&&(v<lo||v>hi)) outliers.push({i:i,v:v}); });
    return {n:n, missing:missing, mean:mean(vals), median:med, q1:q1, q3:q3, iqr:iqr, lo:lo, hi:hi, outliers:outliers};
  }

  // ══════════ 38.1 데이터: 광고비 대비 매출증가(두 지점, A/B) — 요약통계는 같고 모양은 다름 ══════════
  var ADX = [10,8,13,9,11,14,6,4,12,7,5]; // 광고비(백만원, 두 지점 공통)
  var SALEA = [8.04,6.95,7.58,8.81,8.33,9.96,7.24,4.26,10.84,4.82,5.68]; // A지점 매출증가(백만원)
  var SALEB = [9.14,8.14,8.74,8.77,9.26,8.10,6.13,3.10,9.13,7.26,4.74]; // B지점 매출증가(백만원)
  var STA = {mx:mean(ADX), my:mean(SALEA), vx:variance(ADX), vy:variance(SALEA), r:corr(ADX,SALEA)};
  var STB = {mx:mean(ADX), my:mean(SALEB), vx:variance(ADX), vy:variance(SALEB), r:corr(ADX,SALEB)};

  // ══════════ 38.2~38.5 데이터: 12개월 × 3제품 판매량(결측 1건 · 이상값 1건 포함) ══════════
  var MON = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
  var P1 = [120,125,130,128,135,140,null,150,155,160,165,170]; // 가전 — 7월 결측
  var P2 = [80,82,85,90,95,270,105,110,108,112,115,120];       // 의류 — 6월 이상값(270)
  var P3 = [60,58,62,65,63,67,70,72,75,74,78,80];              // 식품 — 정상 분포
  var DP1 = describeMissing(P1), DP2 = describeMissing(P2), DP3 = describeMissing(P3);
  var P2FIX = P2.slice(); P2FIX[5] = (P2[4]+P2[6])/2; // 이상값을 인접월 평균으로 보정
  var DP2FIX = describeMissing(P2FIX);
  function growthRate(a){ var f=a[0], l=a[a.length-1]; return (l-f)/f; }
  var GR1=growthRate(P1), GR2FIX=growthRate(P2FIX), GR3=growthRate(P3);
  var MONTOT=[]; for(var mi=0; mi<12; mi++){ var t=0; [P1,P2,P3].forEach(function(a){ if(a[mi]!=null) t+=a[mi]; }); MONTOT.push(t); }

  function fmt1(v){ return v.toFixed(1); }
  function fmtPct(v){ return (v*100).toFixed(1)+'%'; }

  var scenes = [

  // ══════════ 1. 숫자만 보면 안 보이는 것 ══════════
  { id:'bda38_01',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code0=[
        {t:'dfA.mean(); dfA.var(); dfA.corr()', hl:'.mean()'},
        {t:'dfB.mean(); dfB.var(); dfB.corr()', hl:'.corr()'}
      ];
      var code1=[
        {t:'dfA.mean(); dfA.var(); dfA.corr()', hl:'.mean()'},
        {t:'dfB.mean(); dfB.var(); dfB.corr()', hl:'.corr()'},
        {t:"plt.scatter(dfA['광고비'], dfA['매출증가'])", hl:'plt.scatter'}
      ];
      var code2=[
        {t:'dfA.mean(); dfA.var(); dfA.corr()', hl:'.mean()'},
        {t:'dfB.mean(); dfB.var(); dfB.corr()', hl:'.corr()'},
        {t:"plt.scatter(dfB['광고비'], dfB['매출증가'])", hl:'plt.scatter'}
      ];
      var code=(s.step===0)?code0:(s.step===1?code1:code2);
      var act=(s.step===0)?null:2;
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'summary_vs_shape.py', act);
      var caps=['두 지점 A·B의 광고비 대비 매출증가 자료입니다 — 먼저 표(요약통계)만 봅니다',
                '표만 보면 두 지점이 거의 똑같아 보입니다 — 그런데 정말 같을까요? A지점을 그려봅니다',
                'B지점도 같은 축 위에 그려봅니다 — 요약통계는 같은데 모양이 이렇게 다릅니다'];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step], W*0.04, codeBot+20);

      // 요약통계 표(항상 표시)
      var tx=W*0.04, ty=codeBot+42, rh=18;
      ctx.font='11px sans-serif'; ctx.textAlign='left';
      ctx.fillStyle=TXT; ctx.fillText('구분', tx, ty);
      ctx.fillText('평균x', tx+70, ty); ctx.fillText('평균y', tx+140, ty); ctx.fillText('분산x', tx+210, ty); ctx.fillText('분산y', tx+280, ty); ctx.fillText('상관', tx+350, ty);
      ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.moveTo(tx,ty+5); ctx.lineTo(tx+390,ty+5); ctx.stroke();
      [{lab:'A지점',st:STA,col:BLU},{lab:'B지점',st:STB,col:ORG}].forEach(function(row,ri){
        var ry=ty+rh*(ri+1)+4;
        ctx.font='11px ui-monospace,Menlo,monospace';
        ctx.fillStyle=row.col; ctx.fillText(row.lab, tx, ry);
        ctx.fillStyle=TXT;
        ctx.fillText(fmt1(row.st.mx), tx+70, ry); ctx.fillText(fmt1(row.st.my), tx+140, ry);
        ctx.fillText(fmt1(row.st.vx), tx+210, ry); ctx.fillText(fmt1(row.st.vy), tx+280, ry);
        ctx.fillText(row.st.r.toFixed(3), tx+350, ry);
      });
      ctx.font='11px sans-serif'; ctx.fillStyle=GRN;
      ctx.fillText('→ 소수 셋째 자리까지 사실상 동일한 숫자입니다', tx, ty+rh*3+8);

      // 산점도(오른쪽)
      var px0=W*0.50, px1=W*0.965, pTop=26, pBot=232, xmin=3, xmax=15, ymin=2, ymax=11;
      function PX(v){ return px0+((v-xmin)/(xmax-xmin))*(px1-px0); }
      function PY(v){ return pBot-((v-ymin)/(ymax-ymin))*(pBot-pTop); }
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.moveTo(px0,pTop); ctx.lineTo(px0,pBot); ctx.stroke();
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
      ctx.fillText('광고비(백만원)', (px0+px1)/2, pBot+20);
      ctx.save(); ctx.translate(px0-26,(pTop+pBot)/2); ctx.rotate(-Math.PI/2); ctx.fillText('매출증가(백만원)',0,0); ctx.restore();
      if(s.step>=1){
        ctx.fillStyle=BLU; ADX.forEach(function(x,i){ ctx.beginPath(); ctx.arc(PX(x),PY(SALEA[i]),3.4,0,7); ctx.fill(); });
      }
      if(s.step>=2){
        ctx.fillStyle=ORG; ADX.forEach(function(x,i){ ctx.beginPath(); ctx.arc(PX(x),PY(SALEB[i]),3.4,0,7); ctx.fill(); });
      }
      if(s.step===0){ ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center'; ctx.fillText('(아직 그리지 않았습니다 — 화면 탭)', (px0+px1)/2, (pTop+pBot)/2); }

      E.tapHint(W/2, H*0.95, '화면 탭 = 표만 보기 → A지점 그리기 → B지점 그리기', true);
      E.big('숫자만 보면 안 보이는 것', '두 지점 A·B의 「광고비 대비 매출증가」 자료 11건씩을 실제로 계산해 보면 평균x '+STA.mx.toFixed(2)+', 평균y '+STA.my.toFixed(2)+', 분산x '+STA.vx.toFixed(2)+', 분산y '+STA.vy.toFixed(2)+', 상관계수 A='+STA.r.toFixed(3)+' · B='+STB.r.toFixed(3)+'로 <b>소수 셋째 자리까지 사실상 같습니다</b>. 표만 보고서라면 두 지점을 「똑같다」고 결론 내렸을 것입니다. 그런데 같은 좌표축 위에 실제로 점을 찍어보면 A지점은 광고비가 늘수록 매출증가가 고르게 늘어나는 직선에 가까운 관계지만, B지점은 뚜렷한 곡선(포화 구간이 있는 관계)입니다 — 요약 숫자로는 완전히 가려져 있던 차이입니다. 이것이 이 장의 핵심 메시지입니다: <b>시각화는 결과를 예쁘게 포장하는 보고 수단이 아니라, 숫자만으로는 놓치는 것을 찾아내는 분석 도구</b>입니다.'); }
  },

  // ══════════ 2. 탐색(1단계) — 구조·분포·결측·이상값을 훑다 ══════════
  { id:'bda38_02',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(360+this.s.step*60,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var codes=[
        [{t:'df = pd.DataFrame({...})', hl:'DataFrame'}, {t:'df.head(12)   # 12개월 원자료', hl:'.head(12)'}],
        [{t:"df['P1'].isna().sum()   # 결측 개수", hl:'.isna()'}, {t:"df['P1'].describe()   # n·평균·중앙값·사분위", hl:'.describe()'}],
        [{t:"q1,q3 = df['P2'].quantile([.25,.75])", hl:'.quantile'}, {t:'iqr = q3-q1; hi = q3+1.5*iqr', hl:'1.5*iqr'}, {t:"df[df['P2']>hi]   # 상한 초과 판정", hl:'df['+"df['P2']>hi"+']'}],
        [{t:'for col in [P1,P2,P3]:', dim:true}, {t:'    df[col].isna().sum()', hl:'.isna()'}, {t:'    df[col].mean()', hl:'.mean()'}]
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, codes[s.step], 'explore_12m.py', s.step===0?null:(codes[s.step].length-1));
      var caps=['탐색의 첫걸음 — 정답을 찾는 게 아니라 표를 훑으며 「질문」을 만듭니다',
                '어? 7월 P1(가전) 칸이 비어 있습니다 — 결측을 실제로 세고 기본 통계를 냅니다',
                '6월 P2(의류) 값이 유난히 큽니다 — 이상값인지 실제 규칙(사분위범위)으로 판정합니다',
                '세 제품을 정리하면 탐색이 끝나고 분석으로 이어집니다'];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step], W*0.04, codeBot+20);

      var tx=W*0.50, colW=32, labelW=32, rowH=17, ty0=26;
      function drawRawTable(hlR, hlC, hlCol){
        ctx.font='11px sans-serif'; ctx.textAlign='center';
        MON.forEach(function(m,c){ ctx.fillStyle=DIM; ctx.fillText(m, tx+labelW+c*colW+colW/2, ty0+rowH-4); });
        ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.moveTo(tx,ty0+rowH); ctx.lineTo(tx+labelW+12*colW,ty0+rowH); ctx.stroke();
        var rows=[{lab:'P1',a:P1},{lab:'P2',a:P2},{lab:'P3',a:P3}];
        rows.forEach(function(row,r){
          var ry=ty0+rowH*(r+2)-4;
          ctx.textAlign='left'; ctx.font='11px sans-serif'; ctx.fillStyle=TXT;
          ctx.fillText(row.lab, tx, ry);
          row.a.forEach(function(v,c){
            var cx=tx+labelW+c*colW+colW/2;
            var bad=(hlR===r && hlC===c);
            if(bad){ ctx.fillStyle=hlCol; ctx.fillRect(cx-colW/2+2, ty0+rowH*(r+1)+2, colW-4, rowH-4); }
            ctx.font='11px ui-monospace,Menlo,monospace'; ctx.textAlign='center';
            ctx.fillStyle=bad?'#241019':TXT;
            ctx.fillText(v==null?'—':(''+v), cx, ry);
          });
        });
        return ty0+rowH*4;
      }
      var tbot;
      if(s.step===0){ tbot=drawRawTable(-1,-1,null); }
      else if(s.step===1){ tbot=drawRawTable(0,6,GLD); }
      else if(s.step===2){ tbot=drawRawTable(1,5,RED); }
      else { tbot=drawRawTable(-1,-1,null); }

      var iy=tbot+22;
      ctx.font='12px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
      if(s.step===1){
        ctx.fillStyle=GLD; ctx.fillText('P1: n='+DP1.n+'  결측='+DP1.missing+'개(7월)', tx, iy);
        ctx.fillStyle=TXT; ctx.fillText('평균='+fmt1(DP1.mean)+'  중앙값='+fmt1(DP1.median)+'  Q1='+fmt1(DP1.q1)+'  Q3='+fmt1(DP1.q3), tx, iy+20);
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('결측은 있는 값만으로 계산하되, 「왜 비었는지」는 표만 봐서는 알 수 없습니다', tx, iy+40);
      } else if(s.step===2){
        ctx.fillStyle=RED; ctx.fillText('P2: Q1='+fmt1(DP2.q1)+'  Q3='+fmt1(DP2.q3)+'  IQR='+fmt1(DP2.iqr), tx, iy);
        ctx.fillText('상한 = Q3+1.5×IQR = '+fmt1(DP2.hi), tx, iy+20);
        ctx.fillStyle=GLD; ctx.fillText('6월 값 270 > 상한 '+fmt1(DP2.hi)+' → 이상값 판정', tx, iy+40);
      } else if(s.step===3){
        ctx.fillStyle=TXT;
        var rows3=[['P1',DP1],['P2',DP2],['P3',DP3]];
        ctx.font='11px sans-serif'; ctx.fillText('제품', tx, iy); ctx.fillText('n', tx+50, iy); ctx.fillText('결측', tx+90, iy); ctx.fillText('평균', tx+140, iy); ctx.fillText('이상값', tx+200, iy);
        rows3.forEach(function(row,ri){
          var ry=iy+18*(ri+1);
          ctx.font='11px ui-monospace,Menlo,monospace';
          ctx.fillText(row[0], tx, ry); ctx.fillText(''+row[1].n, tx+50, ry); ctx.fillText(''+row[1].missing, tx+90, ry);
          ctx.fillText(fmt1(row[1].mean), tx+140, ry);
          ctx.fillStyle=row[1].outliers.length?RED:GRN; ctx.fillText(row[1].outliers.length?'있음':'없음', tx+200, ry); ctx.fillStyle=TXT;
        });
      } else {
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('구조·결측·이상값 — 무엇을 물어야 할지부터 찾습니다', tx, iy);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 원자료 훑기 → 결측 확인 → 이상값 판정 → 요약', true);
      E.big('탐색(1단계) — 구조·분포·결측·이상값을 훑다', '탐색 단계에서 가장 먼저 할 일은 정답을 찾는 것이 아니라 <b>질문을 만드는 것</b>입니다. 12개월×3제품 원자료를 실제로 훑어보면 P1(가전)의 7월 칸이 비어 있습니다 — 결측을 세어 보면 n='+DP1.n+'(전체 12개월 중 '+DP1.missing+'개 결측), 남은 값들로 평균 '+fmt1(DP1.mean)+'·중앙값 '+fmt1(DP1.median)+'·1사분위 '+fmt1(DP1.q1)+'·3사분위 '+fmt1(DP1.q3)+'을 실제로 계산할 수 있습니다. P2(의류)는 6월 값이 유독 큰데, 「눈으로 튀어 보인다」를 실제 규칙으로 검증하면 사분위범위(IQR) '+fmt1(DP2.iqr)+'의 1.5배를 3사분위에 더한 상한 '+fmt1(DP2.hi)+'을 6월 값 270이 실제로 넘어서므로 이상값으로 판정됩니다. P3(식품)은 결측·이상값 모두 없습니다. 탐색 단계는 이렇게 세 제품을 같은 잣대(n·결측·평균·이상값 여부)로 훑어 「7월은 왜 비었을까? 6월은 왜 튀었을까?」라는 질문을 만들어내는 단계이며, 이 질문에 답하는 것은 다음 <b>분석 단계</b>의 몫입니다.'); }
  },

  // ══════════ 3. 분석(2단계) — 비교·분해·관계를 확인하다 ══════════
  { id:'bda38_03',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(360+this.s.step*60,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var codes=[
        [{t:'monthly = df[[P1,P2,P3]].sum(axis=1)', hl:'.sum(axis=1)'}],
        [{t:"df.loc['6월', ['P1','P2','P3']]", hl:".loc['6월'"}],
        [{t:"fix = df['P2'].copy()", hl:'.copy()'}, {t:"fix['6월'] = (may+jul)/2   # 보정", hl:'보정'}, {t:'df.mean(); fix.mean()   # 왜곡 비교', hl:'.mean()'}],
        [{t:'(fix.iloc[-1]-fix.iloc[0])/fix.iloc[0]', hl:'성장률'}]
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, codes[s.step], 'analyze_12m.py', codes[s.step].length-1);
      var caps=['6월 총합이 유독 튀는데 — 전체가 늘어난 걸까, 제품 하나 때문일까? 분해해 봅니다',
                '6월만 제품별로 떼어 비교하면 원인이 보입니다',
                '이상값을 인접월 평균으로 보정하면 평균·표준편차가 실제로 이렇게 바뀝니다',
                '보정한 값으로 세 제품의 성장률(1월→12월)을 실제로 비교합니다'];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step], W*0.04, codeBot+20);

      var rx0=W*0.50, rx1=W*0.965, rTop=28, rBot=210;
      if(s.step===0){
        function sx(m){ return rx0+(m/11)*(rx1-rx0); }
        var maxT=Math.max.apply(null,MONTOT);
        function sy(v){ return rBot-(v/maxT)*(rBot-rTop); }
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(rx0,rBot); ctx.lineTo(rx1,rBot); ctx.stroke();
        ctx.strokeStyle=BLU; ctx.lineWidth=2; ctx.beginPath();
        MONTOT.forEach(function(v,i){ var x=sx(i),y=sy(v); if(i===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); });
        ctx.stroke();
        MONTOT.forEach(function(v,i){ ctx.fillStyle=(i===5)?RED:BLU; ctx.beginPath(); ctx.arc(sx(i),sy(v),(i===5)?4.5:2.6,0,7); ctx.fill(); });
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
        MON.forEach(function(m,i){ if(i%2===0) ctx.fillText(m, sx(i), rBot+16); });
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=RED; ctx.textAlign='left';
        ctx.fillText('6월 총합='+MONTOT[5]+' (다음으로 큰 5월='+MONTOT[4]+')', rx0, rTop-8);
      } else if(s.step===1){
        var vals=[P1[5],P2[5],P3[5]], labs=['P1(가전)','P2(의류)','P3(식품)'], cols=[BLU,RED,GRN];
        var maxv=Math.max.apply(null,vals);
        var bw=(rx1-rx0)/3*0.5;
        vals.forEach(function(v,i){
          var xk=rx0+i*(rx1-rx0)/3+((rx1-rx0)/3-bw)/2;
          var hh=(v/maxv)*(rBot-rTop-24);
          ctx.fillStyle=cols[i]; ctx.fillRect(xk, rBot-hh, bw, hh);
          ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='center';
          ctx.fillText(labs[i], xk+bw/2, rBot+16);
          ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=cols[i];
          ctx.fillText(''+v, xk+bw/2, rBot-hh-8);
        });
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
        ctx.fillText('6월 총합('+MONTOT[5]+') 중 P2 비중 = '+(P2[5]/MONTOT[5]*100).toFixed(1)+'%', rx0, rTop-8);
      } else if(s.step===2){
        var pairs=[{lab:'평균',a:DP2.mean,b:DP2FIX.mean},{lab:'표준편차',a:stddev(P2),b:stddev(P2FIX)}];
        var bw2=(rx1-rx0)/2*0.32, gap=(rx1-rx0)/2;
        pairs.forEach(function(p,pi){
          var base=rx0+pi*gap+gap*0.15;
          var maxv=Math.max(p.a,p.b);
          var h1=(p.a/maxv)*(rBot-rTop-30), h2=(p.b/maxv)*(rBot-rTop-30);
          ctx.fillStyle=RED; ctx.fillRect(base, rBot-h1, bw2, h1);
          ctx.fillStyle=GRN; ctx.fillRect(base+bw2+10, rBot-h2, bw2, h2);
          ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='center';
          ctx.fillText(p.lab, base+bw2+5, rBot+16);
          ctx.font='11px ui-monospace,Menlo,monospace';
          ctx.fillStyle=RED; ctx.fillText(fmt1(p.a), base+bw2/2, rBot-h1-8);
          ctx.fillStyle=GRN; ctx.fillText(fmt1(p.b), base+bw2+10+bw2/2, rBot-h2-8);
        });
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
        ctx.fillText('빨강=원본(이상값 포함) · 초록=보정 후', rx0, rTop-8);
        ctx.fillStyle=GLD;
        ctx.fillText('표준편차가 '+(stddev(P2)/stddev(P2FIX)).toFixed(1)+'배 부풀려져 있었습니다', rx0, rBot+34);
      } else {
        var gr=[{lab:'P1',v:GR1,col:BLU},{lab:'P2(보정)',v:GR2FIX,col:ORG},{lab:'P3',v:GR3,col:GRN}];
        var maxg=Math.max.apply(null,gr.map(function(g){return g.v;}));
        var bw3=(rx1-rx0)/3*0.5;
        gr.forEach(function(g,i){
          var xk=rx0+i*(rx1-rx0)/3+((rx1-rx0)/3-bw3)/2;
          var hh=(g.v/maxg)*(rBot-rTop-24);
          ctx.fillStyle=g.col; ctx.fillRect(xk, rBot-hh, bw3, hh);
          ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='center';
          ctx.fillText(g.lab, xk+bw3/2, rBot+16);
          ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=g.col;
          ctx.fillText(fmtPct(g.v), xk+bw3/2, rBot-hh-8);
        });
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
        ctx.fillText('1월→12월 성장률(보정된 값 기준)', rx0, rTop-8);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 월별 총합 → 6월 분해 → 이상값 보정 → 성장률 비교', true);
      E.big('분석(2단계) — 비교·분해·관계를 확인하다', '탐색에서 「6월이 왜 튀었을까?」라는 질문을 만들었다면, 분석 단계는 실제로 답을 냅니다. 월별 총합을 계산해 보면 6월이 '+MONTOT[5]+'로 다음으로 큰 5월('+MONTOT[4]+')보다 훨씬 큰데, 6월만 제품별로 <b>분해</b>해 보면 P2(의류)가 270으로 6월 총합의 '+(P2[5]/MONTOT[5]*100).toFixed(1)+'%를 차지합니다 — 전체가 늘어난 게 아니라 제품 하나 때문이었습니다. 이 이상값을 인접월(5월·7월) 평균으로 보정하면 P2의 평균은 '+fmt1(DP2.mean)+'→'+fmt1(DP2FIX.mean)+', 표준편차는 '+fmt1(stddev(P2))+'→'+fmt1(stddev(P2FIX))+'로 실제로 '+(stddev(P2)/stddev(P2FIX)).toFixed(1)+'배나 부풀려져 있었음이 드러납니다. 그런데 흥미롭게도 <b>성장률(1월 대비 12월)은 원본이든 보정본이든 '+fmtPct(GR2FIX)+'로 똑같습니다</b> — 이상값이 중간(6월)에 있어 양 끝 값에는 영향을 주지 않았기 때문입니다. 보정된 값으로 세 제품을 비교하면 P1 '+fmtPct(GR1)+', P2 '+fmtPct(GR2FIX)+', P3 '+fmtPct(GR3)+'로 P2가 가장 빠르게 컸습니다 — <b>어떤 지표(평균·표준편차·성장률)로 보느냐에 따라 이상값의 영향이 다르다</b>는 것 자체가 분석 단계의 중요한 발견입니다.'); }
  },

  // ══════════ 4. 활용(3단계) — 정보 구조화 → 시각화 → 시각 표현 ══════════
  { id:'bda38_04',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(360+this.s.step*60,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var codes=[
        [{t:"fix_growth.round(3)   # 표로만 전달", hl:'.round(3)'}],
        [{t:'plt.bar(labels, fix_growth)', hl:'plt.bar'}],
        [{t:'plt.plot(months, P1); plt.plot(months, P2); plt.plot(months, P3)', hl:'plt.plot'}],
        [{t:'# 결론(P2가 가장 빨리 컸다)을 전달하는 데', dim:true}, {t:'# 어느 표현이 가장 빨리 읽히는가?', dim:true}]
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, codes[s.step], 'convey_growth.py', s.step===3?null:0);
      var caps=['같은 결론(「P2가 가장 빨리 컸다」)을 세 방식으로 전달해 봅니다 — 먼저 표',
                '같은 숫자를 막대그래프로',
                '같은 3제품을 12개월 선그래프로',
                '세 표현이 이 결론을 읽는 데 필요한 것을 실제로 세어 비교합니다'];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step], W*0.04, codeBot+20);

      var rx0=W*0.50, rx1=W*0.965, rTop=28, rBot=210;
      var gr=[{lab:'P1',v:GR1},{lab:'P2',v:GR2FIX},{lab:'P3',v:GR3}];
      var nComp = gr.length*(gr.length-1)/2; // nC2

      if(s.step===0){
        ctx.font='12px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
        gr.forEach(function(g,i){ ctx.fillStyle=TXT; ctx.fillText(g.lab+' 성장률 = '+fmtPct(g.v), rx0, rTop+20+i*22); });
        ctx.font='11px sans-serif'; ctx.fillStyle=GLD;
        ctx.fillText('가장 큰 값을 찾으려면 세 값을 서로 대조해야 합니다', rx0, rTop+20+3*22+8);
        ctx.fillText('→ 짝비교 '+nComp+'번(3개 중 2개씩 고르는 경우의 수)', rx0, rTop+20+3*22+26);
      } else if(s.step===1){
        var maxg=Math.max.apply(null,gr.map(function(g){return g.v;}));
        var bw=(rx1-rx0)/3*0.5;
        gr.forEach(function(g,i){
          var xk=rx0+i*(rx1-rx0)/3+((rx1-rx0)/3-bw)/2;
          var hh=(g.v/maxg)*(rBot-rTop-24);
          ctx.fillStyle=(g.v===maxg)?GRN:BLU; ctx.fillRect(xk, rBot-hh, bw, hh);
          ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='center';
          ctx.fillText(g.lab, xk+bw/2, rBot+16);
          ctx.font='11px ui-monospace,Menlo,monospace';
          ctx.fillText(fmtPct(g.v), xk+bw/2, rBot-hh-8);
        });
        ctx.font='11px sans-serif'; ctx.fillStyle=GLD; ctx.textAlign='left';
        ctx.fillText('가장 높은 막대를 찾는 데 계산은 필요 없습니다 — 한 번 훑어보면 끝(1회)', rx0, rTop-8);
      } else if(s.step===2){
        function sx(m){ return rx0+(m/11)*(rx1-rx0); }
        var maxv=Math.max.apply(null,[Math.max.apply(null,P1),Math.max.apply(null,P2),Math.max.apply(null,P3)]);
        function sy(v){ return rBot-(v/maxv)*(rBot-rTop); }
        [{a:P1,col:BLU},{a:P2,col:ORG},{a:P3,col:GRN}].forEach(function(s2){
          ctx.strokeStyle=s2.col; ctx.lineWidth=1.8; ctx.beginPath(); var started=false;
          s2.a.forEach(function(v,i){ if(v==null)return; var x=sx(i),y=sy(v); if(!started){ctx.moveTo(x,y);started=true;} else ctx.lineTo(x,y); });
          ctx.stroke();
        });
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
        MON.forEach(function(m,i){ if(i%3===0) ctx.fillText(m, sx(i), rBot+16); });
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
        ctx.fillStyle=BLU; ctx.fillText('P1', rx0, rTop-8);
        ctx.fillStyle=ORG; ctx.fillText('P2', rx0+30, rTop-8);
        ctx.fillStyle=GRN; ctx.fillText('P3', rx0+60, rTop-8);
        ctx.font='11px sans-serif'; ctx.fillStyle=GLD;
        ctx.fillText('점 36개(3계열×12개월)를 다 훑어야 순위를 알 수 있지만,', rx0, rBot+32);
        ctx.fillText('6월 튐 같은 「언제」 정보는 이 그림에만 있습니다', rx0, rBot+48);
      } else {
        var rows=[['표','3회 짝비교 필요','정밀한 값'],['막대','1회 훑어보기','정밀한 값은 감춤'],['선(12개월)','36개 점 훑기','시점별 변화(이상값 타이밍)']];
        ctx.font='11px sans-serif'; ctx.textAlign='left';
        ctx.fillStyle=TXT; ctx.fillText('표현', rx0, rTop+14); ctx.fillText('결론을 읽는 데', rx0+90, rTop+14); ctx.fillText('대신 얻는 것', rx0+260, rTop+14);
        ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.moveTo(rx0,rTop+20); ctx.lineTo(rx1,rTop+20); ctx.stroke();
        rows.forEach(function(r,ri){
          var ry=rTop+20+22*(ri+1);
          ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=[BLU,GRN,ORG][ri];
          ctx.fillText(r[0], rx0, ry);
          ctx.font='11px sans-serif'; ctx.fillStyle=TXT;
          ctx.fillText(r[1], rx0+90, ry); ctx.fillText(r[2], rx0+260, ry);
        });
        ctx.font='11px sans-serif'; ctx.fillStyle=GLD;
        ctx.fillText('이번 결론(누가 가장 빨랐나)에는 막대가 가장 빠르지만, 「왜」를 물으려면 선이 필요합니다', rx0, rTop+20+22*4+16);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 표 → 막대 → 선 → 세 표현 비교', true);
      E.big('활용(3단계) — 정보 구조화 → 시각화 → 시각 표현', '분석에서 얻은 같은 결론(P1 '+fmtPct(GR1)+', P2 '+fmtPct(GR2FIX)+', P3 '+fmtPct(GR3)+' — P2가 가장 빨랐다)을 세 가지 표현으로 실제로 그려 비교합니다. <b>표</b>는 정밀한 값을 다 보여주지만 「누가 가장 큰가」를 알려면 세 숫자를 마음속으로 대조해야 합니다(3개 중 2개씩 짝짓는 경우의 수 = '+nComp+'번). <b>막대그래프</b>는 높이만 보면 계산 없이 한 번에 순위가 보입니다 — 대신 정확한 소수점 값은 감춥니다. <b>선그래프</b>(12개월×3제품, 점 36개)는 결론을 읽으려면 표·막대보다 눈이 더 많이 움직여야 하지만, 그 대가로 <b>6월에 무슨 일이 있었는지</b>(이상값의 타이밍)라는, 표와 막대에는 아예 없는 정보를 보여줍니다. 활용 단계란 정보를 구조화(무엇을 비교할지 정하고) → 시각화(그래프 형태로 옮기고) → 시각 표현(누구에게 무엇을 강조해 보여줄지 고르는) 과정입니다. <b>정답은 하나의 표현이 아니라, 전달하려는 결론에 맞는 표현을 고르는 것</b>입니다.'); }
  },

  // ══════════ 5. 세 단계를 관통하는 질문 ══════════
  { id:'bda38_05',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(360+this.s.step*60,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var codes=[
        [{t:'# 탐색: 무엇이 있는가?', dim:true}, {t:"df.isna().sum(); df.describe()", hl:'.describe()'}],
        [{t:'# 분석: 왜 그런가?', dim:true}, {t:'fix.mean(); growth_rate(fix)', hl:'growth_rate'}],
        [{t:'# 활용: 어떻게 전달할까?', dim:true}, {t:'plt.bar(labels, growth)   # 최종 선택', hl:'plt.bar'}],
        [{t:'탐색 → 분석 → 활용', hl:'→'}, {t:'(산출물이 다음 단계의 입력이 됩니다)', dim:true}]
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, codes[s.step], 'pipeline.py', 0);
      var caps=['탐색 단계의 질문: 「무엇이 있는가?」',
                '분석 단계의 질문: 「왜 그런가? 비교하면 어떤가?」',
                '활용 단계의 질문: 「누구에게 어떻게 전달할까?」',
                '세 단계는 순서대로 흐릅니다 — 각 산출물이 다음 단계의 재료가 됩니다'];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step], W*0.04, codeBot+20);

      var rx0=W*0.50, rx1=W*0.965, boxW=(rx1-rx0-2*16)/3, boxH=120, by=40;
      var boxes=[
        {lab:'탐색', col:BLU, q:'무엇이 있는가?', out:'결측 1건·이상값 1건'},
        {lab:'분석', col:ORG, q:'왜 그런가?', out:'보정 성장률 P2 '+fmtPct(GR2FIX)},
        {lab:'활용', col:GRN, q:'어떻게 전달할까?', out:'막대그래프 채택'}
      ];
      boxes.forEach(function(b,i){
        var bx=rx0+i*(boxW+16);
        var active=(s.step===3)||(s.step===i);
        ctx.fillStyle=active?'rgba(255,255,255,0.06)':'rgba(255,255,255,0.02)';
        ctx.strokeStyle=active?b.col:'rgba(255,255,255,0.15)'; ctx.lineWidth=active?2:1;
        roundRect(ctx,bx,by,boxW,boxH,10); ctx.fill(); ctx.stroke();
        ctx.font='600 13px sans-serif'; ctx.fillStyle=b.col; ctx.textAlign='center';
        ctx.fillText(b.lab, bx+boxW/2, by+22);
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText(b.q, bx+boxW/2, by+44);
        if(active){
          ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT;
          var words=b.out.split(' ');
          var line1=words.slice(0,Math.ceil(words.length/2)).join(' '), line2=words.slice(Math.ceil(words.length/2)).join(' ');
          ctx.fillText(line1, bx+boxW/2, by+70);
          ctx.fillText(line2, bx+boxW/2, by+88);
        }
        if(i<2){
          ctx.strokeStyle=(s.step===3)?GLD:'rgba(255,255,255,0.25)'; ctx.lineWidth=2;
          ctx.beginPath(); ctx.moveTo(bx+boxW+3, by+boxH/2); ctx.lineTo(bx+boxW+13, by+boxH/2); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(bx+boxW+13, by+boxH/2); ctx.lineTo(bx+boxW+8, by+boxH/2-4); ctx.moveTo(bx+boxW+13, by+boxH/2); ctx.lineTo(bx+boxW+8, by+boxH/2+4); ctx.stroke();
        }
      });
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
      ctx.fillText('같은 12개월×3제품 자료가 세 단계를 실제로 관통합니다', rx0, by+boxH+26);

      E.tapHint(W/2, H*0.95, '화면 탭 = 탐색 → 분석 → 활용 → 전체 흐름', true);
      E.big('세 단계를 관통하는 질문', '이 장에서 다룬 12개월×3제품 판매 자료 하나가 세 단계를 실제로 관통했습니다. <b>탐색</b>은 「무엇이 있는가?」를 묻고 결측 '+DP1.missing+'건(P1 7월)과 이상값 1건(P2 6월=270)을 실제 규칙(사분위범위)으로 찾아냈습니다. <b>분석</b>은 「왜 그런가?」를 물어 6월 총합 급증의 원인이 P2 하나임을 분해로 확인하고, 이상값을 보정한 뒤 세 제품의 성장률(P1 '+fmtPct(GR1)+', P2 '+fmtPct(GR2FIX)+', P3 '+fmtPct(GR3)+')을 실제로 비교했습니다. <b>활용</b>은 「누구에게 어떻게 전달할까?」를 물어, 같은 결론이라도 표·막대·선 중 목적에 맞는 표현(이번엔 순위를 빨리 전달하는 막대그래프)을 골랐습니다. 세 단계는 한 방향으로만 흐르지 않습니다 — 활용 단계에서 그린 그림을 보다가 새로운 질문이 떠오르면 다시 탐색으로 돌아가기도 합니다. 다음 장에서는 이 <b>활용(시각 표현)</b> 단계를 더 깊이 파고들어, 무엇을 어떻게 그릴지의 구체적인 방법들을 다룹니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
