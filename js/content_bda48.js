/* 빅데이터 분석 제48장 — 필기 관문: 과락을 피하고 서술형을 잡는 법 (ADP 필기 대비)
   동작(behavior)만. 텍스트=content/bda48.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   이 장은 새 분석 기법이 아니라 시험 제도(180분·객관식80문항+서술형20점·70점 합격·과목별 40% 과락)를
   통과하는 전략을 다룬다. 다섯 과목의 정확한 문항수·배점은 공표 자료가 아니므로 이 파일이 가정한
   값임을 화면에 명시하고, 그 가정을 슬라이더로 조절 가능하게 둔다(48.2). 골든룰: 총점·과목별 달성률·
   그리디 배분·객관식 시뮬레이션 정답수·서술형 누적점수·자가진단 총점은 전부 아래 고정 데이터로부터
   이 파일 로드 시 또는 draw 시 실제 계산한다(하드코딩 금지). 난수 없음(고정 시드 LCG만 48.3에 사용). */
(function(){
  var ROSE='#ff7ab8', GRN='#7ee0b0', BLU='#7ab8ff', GLD='#ffd27a', DIM='#9b99a3', RED='#f0888a', TXT='#eadfe8', PUR='#c79dff', ORG='#ffb27a';
  var SUBJ_COL=[BLU,GRN,GLD,ROSE,PUR];

  function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function codePanel(E, x, y, w, lines, title, actLine){
    var ctx=E.ctx, lh=18, pad=11, top=y, n=lines.length, ht=n*lh+pad*2+(title?22:0);
    ctx.fillStyle='rgba(255,255,255,0.035)'; ctx.strokeStyle='rgba(255,122,184,0.30)'; ctx.lineWidth=1;
    roundRect(ctx,x,top,w,ht,10); ctx.fill(); ctx.stroke();
    var cy=top+pad+(title?22:0);
    if(title){ ctx.fillStyle=ROSE; ctx.font='600 11.5px ui-monospace,Menlo,monospace'; ctx.textAlign='left'; ctx.fillText(title, x+pad, top+pad+11); }
    ctx.font='11.5px ui-monospace,Menlo,Consolas,monospace'; ctx.textAlign='left';
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

  function LCG(seed){ var s=seed>>>0; return function(){ s=(1103515245*s+12345)>>>0; return s/4294967296; }; }

  // ══════════ 48장 공통 상수: 다섯 과목과 이 트랙에서 이미 다룬 대응 장 ══════════
  var SUBJ=['I 데이터 이해','II 데이터 처리 기술 이해','III 데이터 분석 기획','IV 데이터 분석','V 데이터 시각화'];
  var SUBJ_SHORT=['I','II','III','IV','V'];
  var SUBJ_CH=['32~33장','34~35장','36~37장','1~31·40~45장','38~39장'];
  var W_DEFAULT=[15,15,20,40,10]; // 이 트랙이 가정한 배점(100점=객관식80문항+서술형20점). 문항수는 비공표라 가정값.

  function scoreArr(pct,W){ return pct.map(function(v,i){ return W[i]*v/100; }); }
  function totalOf(pct,W){ return scoreArr(pct,W).reduce(function(a,b){ return a+b; },0); }
  function argmin(a){ var bi=0; for(var i=1;i<a.length;i++) if(a[i]<a[bi]) bi=i; return bi; }
  function argmax(a){ var bi=0; for(var i=1;i<a.length;i++) if(a[i]>a[bi]) bi=i; return bi; }

  // ══════════ 48.3 고정 문항은행: 80문항(시간·아는지 여부) — 고정 시드 LCG, Math.random 아님 ══════════
  var Q80=(function(){
    var rng=LCG(583920), out=[];
    for(var i=0;i<80;i++){
      var cert=rng(), known=cert>0.45;
      var tc=known ? (30+rng()*60) : (60+rng()*150);
      out.push({i:i, known:known, tc:+tc.toFixed(1)});
    }
    return out;
  })();
  var N_KNOWN=Q80.filter(function(q){ return q.known; }).length;
  var ORDER_SEQ=Q80.slice();
  var ORDER_KF=Q80.slice().sort(function(a,b){ if(a.known!==b.known) return a.known?-1:1; return a.tc-b.tc; });
  function simulateExam(order,budgetSec){
    // 순서대로 시간을 쓰다가 예산을 넘기는 순간 시험 종료 — 그 뒤 문항은 전부 손도 못 대고 0점(시간초과)
    var used=0, correct=0, states=new Array(80), stopped=false;
    for(var k=0;k<order.length;k++){
      var q=order[k];
      if(stopped || used+q.tc>budgetSec){ stopped=true; states[q.i]='out'; continue; }
      used+=q.tc; states[q.i]=q.known?'ok':'wrong';
      if(q.known) correct++;
    }
    return {correct:correct, used:used, states:states};
  }

  // ══════════ 48.4 서술형 채점 기준(고정) — CRISP-DM 6단계 답안 ══════════
  var RUBRIC=[
    {k:'정의', pt:5, txt:'정의: 데이터 마이닝 프로젝트를 표준화한 절차 모델'},
    {k:'절차·단계', pt:7, txt:'절차: 업무이해→데이터이해→데이터준비→모델링→평가→전개'},
    {k:'장단점·비교', pt:4, txt:'비교: 폭포수와 달리 평가에서 모델링으로 되돌아가는 반복 가능'},
    {k:'실제 적용 예', pt:4, txt:'적용예: 이탈예측 모델이 평가 실패 후 f1→f2로 재모델링한 사례'}
  ];
  var RUBRIC_TOTAL=RUBRIC.reduce(function(s,r){ return s+r.pt; },0); // 20

  // ══════════ 48.5 자가진단 체크리스트(고정) — 과목별 대표 4항목 ══════════
  var CHECK=[
    ['DIKW 피라미드','OLTP·OLAP 차이','빅데이터 3V','표본→전수조사'],
    ['ETL·CDC 차이','CAP 정리','맵리듀스 원리','해시 파티셔닝'],
    ['KDD·CRISP-DM','하향식·상향식','시급성·난이도','성숙도 진단'],
    ['회귀·잔차진단','정밀도·재현율','K-means·DBSCAN','텍스트·연관·시계열'],
    ['원 vs 막대','왜곡된 축','전주의적 속성','시각화 5분류']
  ];

  var scenes = [

  // ══════════ 1. 과락의 산술 ══════════
  { id:'bda48_01',
    enter:function(E){ var self=this; self.s={pct:[76,76,76,76,25]};
      var lab=SUBJ_SHORT;
      var html='';
      for(var i=0;i<5;i++){ html+='<div class="ctrl"><label>'+lab[i]+' 달성률</label><input type="range" id="b481_'+i+'" min="0" max="100" step="1" value="'+self.s.pct[i]+'"><output id="b481o_'+i+'">'+self.s.pct[i]+'</output></div>'; }
      E.controls(html);
      for(var j=0;j<5;j++){ (function(idx){
        E.bind('#b481_'+idx,'input',function(e){ self.s.pct[idx]=+e.target.value; document.getElementById('b481o_'+idx).textContent=self.s.pct[idx]; });
      })(j); }
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, Wt=W_DEFAULT;
      var pct=s.pct, sc=scoreArr(pct,Wt), total=totalOf(pct,Wt);
      var passSubj=pct.map(function(v){ return v>=40; });
      var allPass=passSubj.every(function(v){ return v; });
      var overallPass = total>=70 && allPass;
      var weakIdx=argmin(pct), strongIdx=argmax(sc);
      var delta=Math.max(0,40-pct[weakIdx]);
      var pctA=pct.slice(); pctA[weakIdx]=Math.min(100,pct[weakIdx]+delta); var totalA=totalOf(pctA,Wt); var passA=pctA.every(function(v){return v>=40;})&&totalA>=70;
      var pctB=pct.slice(); pctB[strongIdx]=Math.min(100,pct[strongIdx]+delta); var totalB=totalOf(pctB,Wt); var passB=pctB.every(function(v){return v>=40;})&&totalB>=70;
      var du=Math.max(0,70-total,40-pct[weakIdx]);
      var dt=Math.max(0,40-pct[weakIdx], Wt[weakIdx]>0?(70-total)*100/Wt[weakIdx]:0);
      var effU=du*5, effT=dt;

      var code=[
        'def check(pct, W):',
        '    score = sum(w*p/100 for w,p in zip(W,pct))',
        '    ok = all(p >= 40 for p in pct)  # 과목별 과락 기준',
        '    return score, score >= 70 and ok'
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.44, code, 'pass_check.py', allPass?3:2);

      var ry=codeBot+20;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=(overallPass?GRN:RED); ctx.fillText('총점 '+total.toFixed(1)+'점 → '+(overallPass?'합격 판정':'불합격 판정'), W*0.04, ry);
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText((total>=70?'총점은 70점을 넘었지만':'총점도 70점 미만이고')+(allPass?' 과락 과목 없음':' 과락 과목 있음 — 총점과 무관하게 불합격'), W*0.04, ry+18);

      var ty=ry+40;
      for(var i=0;i<5;i++){
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
        ctx.fillStyle=SUBJ_COL[i]; ctx.fillText(SUBJ_SHORT[i], W*0.04, ty+i*16);
        ctx.fillStyle=TXT; ctx.fillText(pct[i]+'%  '+sc[i].toFixed(1)+'/'+Wt[i]+'점', W*0.04+22, ty+i*16);
        ctx.fillStyle=passSubj[i]?GRN:RED; ctx.fillText(passSubj[i]?'✓':'✖ 과락', W*0.04+150, ty+i*16);
      }

      // 우측: 같은 노력(Δ%p) 두 시나리오 비교
      var rx0=W*0.51, rx1=W*0.965, by0=30, barTop=by0+16, bh=76;
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
      ctx.fillText('같은 노력 Δ='+delta.toFixed(0)+'%p를 어디에 쓸까', rx0, by0-10);
      var bars=[
        {name:'약점('+SUBJ_SHORT[weakIdx]+') 40%까지', v:totalA, ok:passA},
        {name:'강한 과목('+SUBJ_SHORT[strongIdx]+') 추가', v:totalB, ok:passB}
      ];
      var maxv=Math.max(bars[0].v,bars[1].v,100), bw=(rx1-rx0)/2*0.5;
      bars.forEach(function(b,bi){
        var xk=rx0+bi*(rx1-rx0)/2+(rx1-rx0)/2*0.25-bw/2;
        var hh=(b.v/maxv)*bh;
        ctx.fillStyle=b.ok?GRN:RED; ctx.fillRect(xk, barTop+bh-hh, bw, hh);
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=b.ok?GRN:RED; ctx.textAlign='center';
        ctx.fillText(b.v.toFixed(1)+'점', xk+bw/2, barTop+bh-hh-6);
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT;
        ctx.fillText(b.name, xk+bw/2, barTop+bh+14);
        ctx.fillStyle=b.ok?GRN:RED; ctx.fillText(b.ok?'합격':'불합격(과락)', xk+bw/2, barTop+bh+28);
      });
      var cutY=barTop+bh-(70/maxv)*bh;
      ctx.strokeStyle=GLD; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(rx0,cutY); ctx.lineTo(rx1,cutY); ctx.stroke(); ctx.setLineDash([]);
      ctx.font='11px sans-serif'; ctx.fillStyle=GLD; ctx.textAlign='left'; ctx.fillText('70점', rx1-34, cutY-4);

      var ry2=barTop+bh+50;
      ctx.font='11.5px ui-monospace,Menlo,monospace'; ctx.textAlign='left'; ctx.fillStyle=GLD;
      ctx.fillText('모든 과목 고르게 올리면 필요 학습량 '+effU.toFixed(0)+'%p', rx0, ry2);
      ctx.fillText('약점만 targeted면 '+effT.toFixed(0)+'%p', rx0, ry2+18);
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(effT>0 ? ('→ targeted가 '+(effU/effT).toFixed(1)+'배 더 적은 노력으로 같은 결과') : '→ 이미 과락 과목이 없어 균등 상향이 불필요', rx0, ry2+36);

      E.tapHint(W/2, H*0.95, '슬라이더 다섯 개로 과목별 달성률을 조절해 과락·합격이 실제로 갈리는 지점을 찾아보세요', true);
      E.big('과락의 산술', '지금 슬라이더 값(각 과목 달성률)으로 계산한 총점은 '+total.toFixed(1)+'점입니다. '+(total>=70?'70점을 넘었지만 ':'')+(allPass?'과락 과목이 없어 '+(total>=70?'<b>합격</b>':'총점 미달로 <b>불합격</b>'):'<b>'+SUBJ_SHORT[weakIdx]+'과목이 '+pct[weakIdx]+'%로 40% 미만(과락)이라 총점과 무관하게 <b>불합격</b>')+'입니다. 같은 '+delta.toFixed(0)+'%p의 노력을 어디에 쓰느냐로 비교하면 더 뚜렷합니다 — 약점 과목을 40%까지만 끌어올리면 총점은 '+totalA.toFixed(1)+'점(더 낮음)이지만 '+(passA?'<b>합격</b>':'불합격')+'이고, 이미 점수가 높은 '+SUBJ_SHORT[strongIdx]+'과목을 같은 크기만큼 더 올리면 총점은 '+totalB.toFixed(1)+'점(더 높음)인데도 '+(passB?'합격':'<b>불합격</b>')+'입니다 — 총점을 더 많이 올린 쪽이 오히려 떨어집니다. 이것이 과목별 40% 과락 제도의 핵심입니다: <b>총점은 필요조건일 뿐, 약한 과목의 최소선을 넘는 것이 먼저</b>입니다. 모든 과목을 고르게 올려 합격선을 맞추려면 '+effU.toFixed(0)+'%p만큼의 상승이 필요하지만, 약점 과목 하나만 targeted로 올리면 '+effT.toFixed(0)+'%p로 충분합니다 — 시험 막판일수록 약점 보완이 훨씬 효율적인 이유입니다.'); }
  },

  // ══════════ 2. 과목별 배점과 학습 배분 ══════════
  { id:'bda48_02',
    enter:function(E){ var self=this; self.s={ivw:40, budget:25};
      E.controls('<div class="ctrl"><label>IV 데이터분석 배점 가정(점)</label><input type="range" id="b482w" min="25" max="55" step="1" value="40"><output id="b482wo">40</output></div>'
               +'<div class="ctrl"><label>남은 학습 시간(시간)</label><input type="range" id="b482b" min="0" max="58" step="1" value="25"><output id="b482bo">25</output></div>');
      E.bind('#b482w','input',function(e){ self.s.ivw=+e.target.value; document.getElementById('b482wo').textContent=self.s.ivw; });
      E.bind('#b482b','input',function(e){ self.s.budget=+e.target.value; document.getElementById('b482bo').textContent=self.s.budget; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var H_HRS=[8,9,11,25,5]; // 각 과목을 현재 이해도→100%까지 끌어올리는 데 필요하다고 가정한 학습시간
      var BASE=[30,30,20,15,40]; // 가정한 현재 이해도(%)
      var baseOther=[15,15,20,10], scale=(100-s.ivw)/60;
      var Wt=[baseOther[0]*scale, baseOther[1]*scale, baseOther[2]*scale, s.ivw, baseOther[3]*scale];
      var value=Wt.map(function(w,i){ return w/H_HRS[i]; });
      var order=[0,1,2,3,4].slice().sort(function(a,b){ return value[b]-value[a]; });
      var pct=BASE.slice(), rem=s.budget, usedH=[0,0,0,0,0];
      order.forEach(function(i){
        if(rem<=0) return;
        var use=Math.min(rem,H_HRS[i]);
        usedH[i]=use;
        pct[i]=BASE[i]+(use/H_HRS[i])*(100-BASE[i]);
        rem-=use;
      });
      var total=totalOf(pct,Wt);
      var passSubj=pct.map(function(v){ return v>=40; });
      var overallPass = total>=70 && passSubj.every(function(v){return v;});

      var code=[
        'value = {s: W[s]/H[s] for s in subjects}  # 시간당 점수 상승',
        'order = sorted(subjects, key=value, reverse=True)',
        'for s in order:',
        '    use = min(remaining, H[s]); remaining -= use',
        '    pct[s] += use/H[s] * (100-pct[s])'
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.44, code, 'greedy_alloc.py', 2);

      var ry=codeBot+18;
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
      ctx.fillText('가정 배점(100점): I'+Wt[0].toFixed(0)+' II'+Wt[1].toFixed(0)+' III'+Wt[2].toFixed(0)+' IV'+Wt[3]+'(슬라이더) V'+Wt[4].toFixed(0)+' — 문항수 비공표라 가정', W*0.04, ry);
      var ty=ry+20;
      for(var i=0;i<5;i++){
        var rank=order.indexOf(i)+1;
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
        ctx.fillStyle=SUBJ_COL[i]; ctx.fillText(rank+'.'+SUBJ_SHORT[i], W*0.04, ty+i*17);
        ctx.fillStyle=TXT; ctx.fillText('효율'+value[i].toFixed(2)+'점/h  '+usedH[i].toFixed(1)+'h→'+pct[i].toFixed(0)+'%', W*0.04+58, ty+i*17);
        ctx.fillStyle=passSubj[i]?GRN:RED; ctx.fillText(passSubj[i]?'✓':'✖', W*0.04+250, ty+i*17);
      }
      var ry3=ty+5*17+8;
      ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=overallPass?GRN:RED;
      ctx.fillText('배분 결과 총점 '+total.toFixed(1)+'점 → '+(overallPass?'합격 판정':'불합격 판정'), W*0.04, ry3);

      // 우측: 과목별 달성률 막대 + 40% 컷라인
      var rx0=W*0.51, rx1=W*0.965, rTop=28, chartTop=rTop+18, rBot=250;
      ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(rx0,rBot); ctx.lineTo(rx1,rBot); ctx.stroke();
      var bw=(rx1-rx0)/5*0.55, gap=(rx1-rx0)/5;
      for(var k=0;k<5;k++){
        var xk=rx0+k*gap+gap*0.5-bw/2;
        var hh=(pct[k]/100)*(rBot-chartTop);
        ctx.fillStyle=SUBJ_COL[k]; ctx.fillRect(xk, rBot-hh, bw, hh);
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=SUBJ_COL[k]; ctx.textAlign='center';
        ctx.fillText(pct[k].toFixed(0)+'%', xk+bw/2, rBot-hh-6);
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT;
        ctx.fillText(SUBJ_SHORT[k], xk+bw/2, rBot+14);
      }
      var cutY=rBot-(40/100)*(rBot-chartTop);
      ctx.strokeStyle=GLD; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(rx0,cutY); ctx.lineTo(rx1,cutY); ctx.stroke(); ctx.setLineDash([]);
      ctx.font='11px sans-serif'; ctx.fillStyle=GLD; ctx.textAlign='left'; ctx.fillText('40% 과락선', rx0, cutY-6);
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
      ctx.fillText('배분 순서(효율 높은 순): '+order.map(function(i){return SUBJ_SHORT[i];}).join('→'), rx0, rTop-10);

      E.tapHint(W/2, H*0.95, 'IV 배점 가정과 남은 학습 시간을 슬라이더로 바꿔 그리디 배분이 실제로 재계산되는 것을 보세요', true);
      E.big('과목별 배점과 학습 배분', '다섯 과목을 각각 100%까지 끌어올리는 데 필요한 시간을 가정하고, 배점(가중치)을 그 시간으로 나눈 <b>시간당 점수 상승</b>(효율)이 큰 과목부터 채우는 탐욕적 배분을 실제로 계산합니다. 지금 조건에서 효율 순서는 '+order.map(function(i){return SUBJ_SHORT[i];}).join('→')+'입니다 — 흥미롭게도 배점이 가장 큰 IV(데이터분석)는 범위가 넓어 시간이 많이 들기 때문에 효율이 가장 낮아 맨 뒤로 밀립니다. 남은 학습 시간 '+s.budget+'시간을 이 순서로 다 채우면 '+order.map(function(i){return SUBJ_SHORT[i]+' '+pct[i].toFixed(0)+'%';}).join(', ')+'가 되고 총점 '+total.toFixed(1)+'점으로 '+(overallPass?'<b>합격 조건을 만족</b>':'<b>아직 합격 조건에 못 미칩니다</b>')+'. 슬라이더로 학습 시간을 늘려 가면 배점이 가장 큰 IV가 마지막에 배정되기 때문에, IV가 40%를 넘는 순간이 곧 합격의 병목이라는 것을 직접 확인할 수 있습니다 — <b>배점이 크다고 무조건 먼저 공부하는 것이 최선은 아닙니다.</b>'); }
  },

  // ══════════ 3. 객관식을 푸는 순서 ══════════
  { id:'bda48_03',
    enter:function(E){ var self=this; self.s={reserve:60};
      E.controls('<div class="ctrl"><label>서술형에 남길 시간(분)</label><input type="range" id="b483r" min="20" max="70" step="5" value="60"><output id="b483ro">60</output></div>');
      E.bind('#b483r','input',function(e){ self.s.reserve=+e.target.value; document.getElementById('b483ro').textContent=self.s.reserve; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var objMin=180-s.reserve, objSec=objMin*60, avgPerQ=objSec/80;
      var rSeq=simulateExam(ORDER_SEQ,objSec), rKF=simulateExam(ORDER_KF,objSec);

      var code=[
        'obj_sec = (180 - essay_reserve) * 60',
        'for q in order:',
        '    if used + q.time > obj_sec: break   # 시간초과 = 0점',
        '    used += q.time; correct += q.known'
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.44, code, 'time_budget.py', 2);

      ctx.font='11.5px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
      ctx.fillStyle=TXT; ctx.fillText('180분 − 서술형 '+s.reserve+'분 = 객관식 '+objMin+'분 = '+objSec+'초', W*0.51, 32);
      ctx.fillStyle=GLD; ctx.fillText('80문항 평균 문항당 '+avgPerQ.toFixed(1)+'초', W*0.51, 52);
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('고정 문항은행 80개 중 실제로 아는 문항 '+N_KNOWN+'개', W*0.51, 72);

      var ry=codeBot+20;
      ctx.font='12px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
      ctx.fillStyle=(rSeq.correct>=rKF.correct)?TXT:RED; ctx.fillText('순서대로 풀기: '+rSeq.correct+'/80 정답', W*0.04, ry);
      ctx.fillStyle=GRN; ctx.fillText('확실한 것부터: '+rKF.correct+'/80 정답', W*0.04, ry+20);
      ctx.font='11.5px sans-serif'; ctx.fillStyle=(rKF.correct>rSeq.correct)?GLD:DIM;
      ctx.fillText(rKF.correct>rSeq.correct ? ('→ '+(rKF.correct-rSeq.correct)+'문항 더 맞습니다') : '→ 시간이 충분해 두 전략이 같습니다', W*0.04, ry+40);

      // 80칸 스트립 두 줄
      var sx0=W*0.04, sx1=W*0.965, cw=(sx1-sx0)/80, cellH=13;
      function drawStrip(states,y,label){
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText(label, sx0, y-4);
        for(var i=0;i<80;i++){
          var st=states[i], col=(st==='ok')?GRN:(st==='wrong')?RED:'rgba(155,153,163,0.45)';
          ctx.fillStyle=col; ctx.fillRect(sx0+i*cw, y, cw-1, cellH);
        }
      }
      drawStrip(rSeq.states, ry+62, '순서대로');
      drawStrip(rKF.states, ry+62+34, '확실한 것부터');

      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
      ctx.fillText('■정답  ■오답(풀었지만 틀림)  ■시간초과(못 풂=0점)', sx0, ry+62+34+cellH+18);
      ctx.fillStyle=GRN; ctx.fillRect(sx0+150, ry+62+34+cellH+11, 9,9);
      ctx.fillStyle=RED; ctx.fillRect(sx0+150+120, ry+62+34+cellH+11, 9,9);
      ctx.fillStyle='rgba(155,153,163,0.45)'; ctx.fillRect(sx0+150+120+150, ry+62+34+cellH+11, 9,9);

      E.tapHint(W/2, H*0.95, '서술형 예약 시간을 슬라이더로 바꿔 시간이 촉박해질수록 순서 전략이 왜 중요해지는지 확인하세요', true);
      E.big('객관식을 푸는 순서', '180분에서 서술형에 '+s.reserve+'분을 남기면 객관식 80문항에는 '+objMin+'분('+objSec+'초), 문항당 평균 '+avgPerQ.toFixed(1)+'초가 남습니다. 같은 고정 80문항(풀이 시간과 실제로 아는지 여부가 문항마다 정해져 있음, 아는 문항 '+N_KNOWN+'개)을 두 전략으로 실제로 풀어 보면: <b>순서대로 풀기</b>는 앞에서부터 시간을 다 쓰다가 뒤쪽에 있는 쉬운(아는) 문항까지 도달하지 못해 '+rSeq.correct+'문항을 맞히고, <b>확실한 것부터(짧고 아는 문항 우선) 풀기</b>는 맞힐 수 있는 문항을 먼저 확보해 '+rKF.correct+'문항을 맞힙니다. '+(rKF.correct>rSeq.correct?('그 차이는 '+(rKF.correct-rSeq.correct)+'문항 — 시간이 촉박할수록 벌어집니다.'):'지금 설정은 시간이 넉넉해 두 전략의 차이가 없습니다 — 슬라이더로 서술형 예약 시간을 늘려 객관식 시간을 줄여 보세요.')+' 순서 자체가 정답을 아는지와는 무관하지만, <b>시간이 부족해질수록 무엇을 먼저 푸느냐가 실제로 맞힌 개수를 바꿉니다.</b>'); }
  },

  // ══════════ 4. 서술형 20점을 잡는 법 ══════════
  { id:'bda48_04',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%(RUBRIC.length+1); E.blip(360+this.s.step*60,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var filled=s.step; // 0..4개 항목 완성
      var running=0, rows=RUBRIC.map(function(r,i){ var got=(i<filled)?r.pt:0; running+=got; return {r:r,got:got,cum:running}; });
      var cumTotal=running;

      var code=[
        'rubric = {"정의":5, "절차":7, "장단점":4, "적용예":4}',
        'score = 0',
        'for part in written_answer:',
        '    score += rubric[part]   # 항목별 부분점수 누적'
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.44, code, 'essay_score.py', filled>0?3:1);

      var ty=codeBot+18;
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
      ctx.fillText('주제: CRISP-DM 6단계 서술 (총 '+RUBRIC_TOTAL+'점)', W*0.04, ty);
      rows.forEach(function(row,i){
        var y=ty+22+i*24;
        ctx.font='11px sans-serif'; ctx.fillStyle=(row.got>0)?GRN:DIM;
        ctx.fillText((row.got>0?'✓ ':'☐ ')+row.r.txt+' ('+row.r.pt+'점)', W*0.04, y);
      });
      var by=ty+22+RUBRIC.length*24+14;
      ctx.font='13px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD;
      ctx.fillText('누적 점수 '+cumTotal+' / '+RUBRIC_TOTAL+'점', W*0.04, by);

      // 우측: 완벽한 한 항목 vs 모든 항목 절반
      var rx0=W*0.51, rx1=W*0.965, by0=32, bh=140;
      var maxSingle=Math.max.apply(null, RUBRIC.map(function(r){return r.pt;}));
      var halfAll=RUBRIC_TOTAL*0.5;
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
      ctx.fillText('전략 비교: 한 항목만 완벽 vs 전 항목 절반', rx0, by0-10);
      var comp=[{name:'가장 큰 항목만\n완벽('+maxSingle+'점)', v:maxSingle, col:RED},{name:'모든 항목을\n절반씩('+halfAll.toFixed(1)+'점)', v:halfAll, col:GRN}];
      var maxv=RUBRIC_TOTAL, bw=(rx1-rx0)/2*0.5;
      comp.forEach(function(c,ci){
        var xk=rx0+ci*(rx1-rx0)/2+(rx1-rx0)/2*0.25-bw/2;
        var hh=(c.v/maxv)*bh;
        ctx.fillStyle=c.col; ctx.fillRect(xk, by0+bh-hh, bw, hh);
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=c.col; ctx.textAlign='center';
        ctx.fillText(c.v.toFixed(1)+'점', xk+bw/2, by0+bh-hh-6);
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT;
        c.name.split('\n').forEach(function(ln,li){ ctx.fillText(ln, xk+bw/2, by0+bh+14+li*13); });
      });
      var ty2=by0+bh+48;
      ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=DIM; ctx.textAlign='left';
      RUBRIC.forEach(function(r,i){
        ctx.fillText(r.k+' 단독 완벽='+r.pt+'점 (<'+halfAll.toFixed(1)+')', rx0, ty2+i*15);
      });

      E.tapHint(W/2, H*0.95, '화면을 탭해 항목을 하나씩 채워 누적 점수가 실제로 오르는 것을 보세요', true);
      E.big('서술형 20점을 잡는 법', 'CRISP-DM 6단계를 서술하는 답안을 항목별로 채워 갑니다 — 지금까지 '+filled+'개 항목을 채워 누적 '+cumTotal+'점입니다. 백지(0점)에서 시작해 정의('+RUBRIC[0].pt+'점)·절차('+RUBRIC[1].pt+'점)·장단점('+RUBRIC[2].pt+'점)·적용예('+RUBRIC[3].pt+'점) 순으로 채우면 점수가 실제로 누적됩니다. 그런데 <b>가장 배점이 큰 항목(절차, '+maxSingle+'점) 하나만 완벽하게 써도 '+maxSingle+'점</b>인데, <b>네 항목을 모두 절반씩만 채우면 '+halfAll.toFixed(1)+'점</b>으로 오히려 더 높습니다 — 네 항목 각각의 만점('+RUBRIC.map(function(r){return r.pt;}).join('·')+')이 전부 '+halfAll.toFixed(1)+'점보다 작기 때문에, 어떤 항목을 골라 완벽하게 써도 절반씩 고르게 쓰는 것을 이길 수 없습니다. 서술형은 부분 점수가 있으므로, <b>한 항목을 완벽히 다듬는 데 시간을 다 쓰기보다 모든 항목에 손을 대는 것이 점수 전략상 유리</b>합니다.'); }
  },

  // ══════════ 5. 다섯 과목 자가진단 ══════════
  { id:'bda48_05',
    enter:function(E){ this.s={checked:[false,false,false,false,false, false,false,false,false,false, false,false,false,false,false, false,false,false,false,false]}; E.setOn([]); },
    itemRects:function(E){
      var W=E.W, H=E.H, x0=W*0.04, x1=W*0.965, colW=(x1-x0)/5, headY=150, rowH=22, out=[];
      for(var sIdx=0;sIdx<5;sIdx++){
        for(var iIdx=0;iIdx<4;iIdx++){
          out.push({x:x0+sIdx*colW+8, y:headY+18+iIdx*rowH, w:colW-14, h:rowH-4, s:sIdx, i:iIdx});
        }
      }
      return out;
    },
    tap:function(E,cx,cy){ var rects=this.itemRects(E), s=this.s;
      for(var k=0;k<rects.length;k++){ var r=rects[k];
        if(cx>=r.x&&cx<=r.x+r.w&&cy>=r.y-10&&cy<=r.y+10){ var idx=r.s*4+r.i; s.checked[idx]=!s.checked[idx]; return; } } },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, Wt=W_DEFAULT;
      var pct=[0,0,0,0,0];
      for(var sIdx=0;sIdx<5;sIdx++){ var c=0; for(var i=0;i<4;i++) if(s.checked[sIdx*4+i]) c++; pct[sIdx]=c/4*100; }
      var total=totalOf(pct,Wt);
      var passSubj=pct.map(function(v){return v>=40;});
      var overallPass = total>=70 && passSubj.every(function(v){return v;});
      var checkedCount=s.checked.filter(function(v){return v;}).length;

      var code=[
        'pct[s] = checked_count[s] / 4 * 100',
        'score = sum(W[s]*pct[s]/100 for s in subjects)',
        'passed = score >= 70 and all(pct[s] >= 40 for s in subjects)'
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.92, code, 'self_check.py', overallPass?2:1);

      var ry=codeBot+18;
      ctx.font='12.5px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
      ctx.fillStyle=overallPass?GRN:RED;
      ctx.fillText('체크 '+checkedCount+'/20 항목 → 예상 총점 '+total.toFixed(1)+'점 → '+(overallPass?'합격 판정':'불합격 판정'), W*0.04, ry);

      var x0=W*0.04, x1=W*0.965, colW=(x1-x0)/5, headY=150;
      for(var k=0;k<5;k++){
        var cx0=x0+k*colW;
        ctx.font='11.5px sans-serif'; ctx.fillStyle=SUBJ_COL[k]; ctx.textAlign='left';
        ctx.fillText(SUBJ_SHORT[k]+' 과목', cx0+8, headY);
        for(var ii=0;ii<4;ii++){
          var yy=headY+18+ii*22;
          var on=s.checked[k*4+ii];
          ctx.strokeStyle=on?GRN:DIM; ctx.fillStyle=on?GRN:'rgba(0,0,0,0)'; ctx.lineWidth=1.3;
          roundRect(ctx,cx0+8,yy-10,10,10,2); ctx.stroke(); if(on) ctx.fill();
          ctx.font='11px sans-serif'; ctx.fillStyle=on?TXT:DIM; ctx.textAlign='left';
          ctx.fillText(CHECK[k][ii], cx0+23, yy-1);
        }
        var py=headY+18+4*22+8;
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=passSubj[k]?GRN:RED; ctx.textAlign='left';
        ctx.fillText(pct[k].toFixed(0)+'% '+(passSubj[k]?'✓':'✖ 과락'), cx0+8, py);
      }

      var weak=[]; for(var w=0;w<5;w++) if(!passSubj[w]) weak.push(w);
      var relWeak = argmin(pct);
      var ry2=headY+18+4*22+8+22;
      ctx.font='11.5px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
      if(weak.length>0){
        ctx.fillStyle=RED; ctx.fillText('과락 과목: '+weak.map(function(i){return SUBJ_SHORT[i];}).join(', ')+' → 다시 볼 장: '+weak.map(function(i){return SUBJ_CH[i];}).join(' · '), x0, ry2);
      } else if(!overallPass){
        ctx.fillStyle=GLD; ctx.fillText('과락 과목은 없지만 총점 미달 — 가장 약한 '+SUBJ_SHORT[relWeak]+'과목('+SUBJ_CH[relWeak]+') 우선 복습 권장', x0, ry2);
      } else {
        ctx.fillStyle=GRN; ctx.fillText('현재 체크만으로도 합격 조건을 만족합니다 — 다만 이 진단은 대표 항목일 뿐, 실제 이해도를 과신하지 마세요', x0, ry2);
      }

      E.tapHint(W/2, H*0.95, '아는 항목을 화면에서 직접 탭해 체크하면 과목별 달성률과 합격 여부가 실시간으로 계산됩니다', true);
      E.big('다섯 과목 자가진단', '다섯 과목의 대표 항목(과목당 4개, 총 20개)을 놓고 아는 것을 직접 체크하면, 체크 비율을 그 과목의 달성률로 보아 48.1과 같은 방식(배점 '+Wt.join('·')+')으로 예상 총점과 과목별 과락 여부를 실시간으로 계산합니다. 지금까지 '+checkedCount+'개를 체크해 예상 총점 '+total.toFixed(1)+'점, '+(overallPass?'합격 조건을 만족합니다':'아직 합격 조건에 못 미칩니다')+'. '+(weak.length>0?('특히 '+weak.map(function(i){return SUBJ_SHORT[i];}).join(', ')+' 과목이 40% 미만이라 과락입니다 — 이 트랙의 '+weak.map(function(i){return SUBJ_CH[i];}).join(' · ')+'을 다시 보는 것이 총점을 올리는 것보다 먼저입니다.'):'과락 과목은 없습니다.')+' 이 20개 항목은 각 과목의 극히 일부만 대표하므로, 실제 준비 상태를 정확히 재는 도구가 아니라 <b>어느 과목이 상대적으로 약한지 방향을 잡는 용도</b>로만 쓰세요.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
