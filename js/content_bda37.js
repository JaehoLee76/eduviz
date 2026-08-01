/* 빅데이터 분석 제37장 — 분석 마스터 플랜과 거버넌스
   (마스터 플랜 수립·우선순위 평가·이행계획·분석 거버넌스 체계·준비도/성숙도·조직구조)
   동작(behavior)만. 텍스트=content/bda37.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 화면의 모든 수(ROI·우선순위 점수·정렬 순서·준비도/성숙도 평균·조직구조별 소요일)는
   아래 고정 데이터로부터 draw() 시 실제 계산(하드코딩 금지). 난수 없음(전 고정 배열/결정적 계산). */
(function(){
  var ROSE='#ff7ab8', GRN='#7ee0b0', BLU='#7ab8ff', GLD='#ffd27a', DIM='#9b99a3', RED='#f0888a', TXT='#eadfe8', PUR='#c79dff', ORG='#ffb27a', WHITE='#efe4ea';

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

  function meanA(a){ var s=0; for(var i=0;i<a.length;i++) s+=a[i]; return s/a.length; }
  function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }

  // ══════════ 37.1 데이터: ROI(3V=투자비용, Value=비즈니스효과) ══════════
  var ROI_P=[
    {n:'실시간 이상거래 탐지', V:5,Var:4,Vel:5, val:5},
    {n:'월간 매출 리포트 자동화', V:2,Var:1,Vel:1, val:2},
    {n:'고객 세그먼트 마케팅', V:3,Var:3,Vel:2, val:4},
    {n:'설비 예지보전', V:4,Var:2,Vel:4, val:4},
    {n:'재고 최적화', V:3,Var:2,Vel:3, val:3},
    {n:'SNS 감성분석', V:2,Var:5,Vel:3, val:2},
    {n:'가격 동적 책정', V:3,Var:3,Vel:5, val:4},
    {n:'직원 이직 예측', V:2,Var:2,Vel:1, val:3}
  ];
  ROI_P.forEach(function(p){ p.cost=(p.V+p.Var+p.Vel)/3; });

  // ══════════ 37.2 / 37.3 데이터: 시급성·난이도 사분면 + 로드맵 ══════════
  var P37=[
    {n:'실시간 이상거래 탐지', urg:5, diff:4},
    {n:'고객 이탈 방지', urg:4, diff:2},
    {n:'콜센터 대기시간 최소화', urg:3, diff:2},
    {n:'설비 예지보전', urg:2, diff:4},
    {n:'가격 동적 책정', urg:4, diff:4},
    {n:'재고 최적화', urg:3, diff:3},
    {n:'SNS 감성분석', urg:2, diff:2},
    {n:'직원 이직 예측', urg:2, diff:3},
    {n:'신규 시장 수요예측', urg:1, diff:5}
  ];
  function quadOf(p){ var now=p.urg>=3, difficult=p.diff>=3; if(difficult&&now) return 'I'; if(difficult&&!now) return 'II'; if(!difficult&&now) return 'III'; return 'IV'; }
  P37.forEach(function(p){ p.q=quadOf(p); });
  var STAGE_OF_Q={I:2,II:3,III:1,IV:2};
  P37.forEach(function(p){ p.stage=STAGE_OF_Q[p.q]; });
  function quickScore(p){ return (6-p.diff)*2+p.urg; }
  function longScore(p){ return p.urg*2+(6-p.diff); }
  var QCOL={I:RED, II:DIM, III:GRN, IV:BLU};

  // ══════════ 37.4 데이터: 분석 준비도(6)·성숙도(3) ══════════
  var READY_NAMES=['분석업무','인력및조직','분석기법','분석데이터','분석문화','IT인프라'];
  var READY_BASE=[42,28,33,47,61,29];
  var MAT_NAMES=['비즈니스','조직·역량','IT'];
  var MAT_BASE=[50,45,58];

  // ══════════ 37.5 데이터: 분석 조직구조 3유형 흐름 ══════════
  var ORG_TYPES=[
    { key:'집중형', stations:[{n:'요청 접수',d:1},{n:'분석전담조직 우선순위 조정',d:3},{n:'분석 수행',d:5},{n:'현업 결과 전달',d:2}], extra:2, extraLabel:'현업과 이원화 충돌' },
    { key:'기능형', stations:[{n:'요청 접수(업무부서 내)',d:1},{n:'부서 자체 분석',d:4}], extra:3, extraLabel:'타부서 중복분석 확인' },
    { key:'분산형', stations:[{n:'요청 접수(현업배치 인력)',d:1},{n:'전사 우선순위 조율',d:2},{n:'현업 내 분석 수행',d:3},{n:'즉시 Action 반영',d:1}], extra:0, extraLabel:'' }
  ];
  ORG_TYPES.forEach(function(o){
    o.hops=o.stations.length;
    o.base=o.stations.reduce(function(s,st){return s+st.d;},0);
    o.total=o.base+o.extra;
    o.bottleneck=Math.max.apply(null,o.stations.map(function(st){return st.d;}));
    o.bnName=o.stations.filter(function(st){return st.d===o.bottleneck;})[0].n;
  });

  var scenes = [

  // ══════════ 1. 우선순위 평가기준 — ROI(3V vs Value)를 실제로 계산한다 ══════════
  { id:'bda37_01',
    enter:function(E){ var self=this; self.s={wCost:1.0, wValue:1.0};
      E.controls('<div class="ctrl"><label>투자비용 가중치(3V)</label><input type="range" id="b371c" min="0.5" max="2.0" step="0.1" value="1.0"><output id="b371co">1.0</output></div>'
               +'<div class="ctrl"><label>비즈니스효과 가중치(Value)</label><input type="range" id="b371v" min="0.5" max="2.0" step="0.1" value="1.0"><output id="b371vo">1.0</output></div>');
      E.bind('#b371c','input',function(e){ self.s.wCost=+e.target.value; document.getElementById('b371co').textContent=self.s.wCost.toFixed(1); });
      E.bind('#b371v','input',function(e){ self.s.wValue=+e.target.value; document.getElementById('b371vo').textContent=self.s.wValue.toFixed(1); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        "cost = (Volume+Variety+Velocity)/3   # 투자비용(3V)",
        "value = 비즈니스효과                  # Value(Return)",
        "roi = (value*wValue) / (cost*wCost)",
        "적용과제 = [p for p in 과제들 if roi(p) >= 1.0]"
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'roi_priority.py', 2);
      var rows = ROI_P.map(function(p){ return {n:p.n, roi:(p.val*s.wValue)/(p.cost*s.wCost)}; });
      var nPass = rows.filter(function(r){return r.roi>=1.0;}).length;
      var ry=codeBot+18;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD;
      ctx.fillText('wCost='+s.wCost.toFixed(1)+'  wValue='+s.wValue.toFixed(1), W*0.04, ry);
      ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT;
      ctx.fillText('임계 ROI=1.0 통과 과제 = '+nPass+'/'+rows.length+'건 (실시간 재계산)', W*0.04, ry+20);
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('투자비용 요소(3V=Volume·Variety·Velocity)가 클수록, 효과가 작을수록 ROI가 낮아집니다', W*0.04, ry+40);

      var x0=W*0.49, x1=W*0.965, y0=30, y1=225;
      var maxRoi=Math.max.apply(null,rows.map(function(r){return r.roi;}));
      var barMax=Math.max(2.0, maxRoi*1.15);
      var rh=(y1-y0)/rows.length;
      function BX(v){ return x0+150+(v/barMax)*(x1-x0-160); }
      rows.forEach(function(r,i){
        var y=y0+i*rh, pass=r.roi>=1.0;
        ctx.fillStyle= pass?GRN:RED; ctx.fillRect(x0+150, y+2, BX(r.roi)-(x0+150), rh-6);
        ctx.font='11px sans-serif'; ctx.fillStyle=WHITE; ctx.textAlign='left';
        ctx.fillText(r.n, x0, y+rh/2+2);
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=pass?GRN:RED;
        ctx.fillText(r.roi.toFixed(2), BX(r.roi)+4, y+rh/2+2);
      });
      var thX=BX(1.0);
      ctx.strokeStyle=GLD; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(thX,y0); ctx.lineTo(thX,y1); ctx.stroke(); ctx.setLineDash([]);
      ctx.font='11px sans-serif'; ctx.fillStyle=GLD; ctx.textAlign='center'; ctx.fillText('ROI=1.0', thX, y0-6);

      E.tapHint(W/2, H*0.95, '슬라이더로 투자비용·효과 가중치를 바꿔 임계선을 넘는 과제가 실제로 바뀌는 것을 보세요', true);
      E.big('우선순위 평가기준 — ROI 관점', '마스터 플랜의 첫 단계는 도출된 분석 과제들의 우선순위를 정하는 것입니다. 빅데이터의 특징인 3V(Volume·Variety·Velocity)는 저장·가공·처리에 드는 <b>투자비용</b> 요소이고, 분석 결과를 활용해 얻는 <b>비즈니스 효과(Value)</b>는 그 대가로 얻는 편익입니다. 이 둘의 비율(ROI)을 실제로 계산하면 가중치가 wCost='+s.wCost.toFixed(1)+', wValue='+s.wValue.toFixed(1)+'일 때 '+rows.length+'개 과제 중 '+nPass+'개가 임계값 1.0을 넘습니다. 투자비용 가중치를 올리면(데이터가 더 크거나 다양하거나 빠르게 쌓일수록) 더 많은 과제가 임계선 아래로 떨어지고, 효과 가중치를 올리면 반대로 더 많은 과제가 통과합니다 — 우선순위는 고정된 서열이 아니라 두 요소의 실제 비율로 매 순간 재계산됩니다.'); }
  },

  // ══════════ 2. 시급성·난이도 포트폴리오 — 전략을 바꾸면 순서가 실제로 바뀐다 ══════════
  { id:'bda37_02',
    enter:function(E){ var self=this; self.s={view:0, strategy:0};
      E.controls('<div class="ctrl"><label>전략 목표</label><input type="range" id="b372s" min="0" max="1" step="1" value="0"><output id="b372so">빠른 성과 우선</output></div>');
      E.bind('#b372s','input',function(e){ self.s.strategy=+e.target.value; document.getElementById('b372so').textContent=self.s.strategy?'장기 가치 우선':'빠른 성과 우선'; });
      E.setOn([]); },
    tap:function(E){ this.s.view=(this.s.view+1)%2; E.blip(360+this.s.view*40,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var scoreFn = s.strategy? longScore : quickScore;
      var code = s.strategy?
        ["score = urgency*2 + (6-difficulty)   # 장기 가치 우선"] :
        ["score = (6-difficulty)*2 + urgency   # 빠른 성과 우선"];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'priority_'+(s.strategy?'longterm':'quickwin')+'.py', 0);
      var sorted=P37.slice().sort(function(a,b){ return scoreFn(b)-scoreFn(a); });
      var ry=codeBot+18;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD;
      ctx.fillText(s.view===0?'사분면 분류':'실행 순서(1위부터)', W*0.04, ry);
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('전략: '+(s.strategy?'장기 가치 우선':'빠른 성과 우선')+' — 화면 탭으로 사분면⇄순서 전환', W*0.04, ry+20);
      var i;
      for(i=0;i<3;i++){ ctx.font='11px sans-serif'; ctx.fillStyle=WHITE; ctx.fillText((i+1)+'위 '+sorted[i].n+' (score='+scoreFn(sorted[i])+')', W*0.04, ry+44+i*18); }

      var x0=W*0.49, x1=W*0.965, y0=30, y1=225;
      if(s.view===0){
        var midx=x0+(x1-x0)*0.4, midy=y0+(y1-y0)*0.6; // urg 3/5 => 0.4 x-span(1..5→(3-1)/4=0.5 실제 계산)
        function UX(u){ return x0+((5-u)/4)*(x1-x0); } function DY(d){ return y1-((d-1)/4)*(y1-y0); }
        var thX=UX(3), thY=DY(3);
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.strokeRect(x0,y0,x1-x0,y1-y0);
        ctx.beginPath(); ctx.moveTo(thX,y0); ctx.lineTo(thX,y1); ctx.moveTo(x0,thY); ctx.lineTo(x1,thY); ctx.stroke();
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
        ctx.fillText('시급성(현재←→미래)', (x0+x1)/2, y1+16);
        ctx.save(); ctx.translate(x0-18,(y0+y1)/2); ctx.rotate(-Math.PI/2); ctx.fillText('난이도(쉬움←→어려움)',0,0); ctx.restore();
        var top3ids={}; sorted.slice(0,3).forEach(function(p){ top3ids[p.n]=true; });
        P37.forEach(function(p){
          var px=UX(p.urg), py=DY(p.diff);
          ctx.fillStyle=QCOL[p.q]; ctx.beginPath(); ctx.arc(px,py,5,0,7); ctx.fill();
          if(top3ids[p.n]){ ctx.strokeStyle=GLD; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(px,py,8,0,7); ctx.stroke(); }
        });
        ['I','II','III','IV'].forEach(function(q,qi){
          var lx = qi%2===0? x0+8 : x1-8, ly = qi<2? y0+14 : y1-8;
          ctx.font='11px sans-serif'; ctx.fillStyle=QCOL[q]; ctx.textAlign=qi%2===0?'left':'right';
          ctx.fillText(q+'영역', lx, ly);
        });
      } else {
        var rh=(y1-y0)/sorted.length;
        var maxS=Math.max.apply(null,sorted.map(scoreFn));
        sorted.forEach(function(p,i){
          var y=y0+i*rh, bw=(scoreFn(p)/maxS)*(x1-x0-170);
          ctx.fillStyle= i<3?GLD:BLU; ctx.fillRect(x0+160,y+2,bw,rh-6);
          ctx.font='11px sans-serif'; ctx.fillStyle=WHITE; ctx.textAlign='left';
          ctx.fillText((i+1)+'. '+p.n+' ['+p.q+']', x0, y+rh/2+2);
          ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=DIM;
          ctx.fillText(''+scoreFn(p), x0+160+bw+6, y+rh/2+2);
        });
      }

      var quickTop=P37.slice().sort(function(a,b){return quickScore(b)-quickScore(a);})[0].n;
      var longTop=P37.slice().sort(function(a,b){return longScore(b)-longScore(a);})[0].n;
      E.tapHint(W/2, H*0.95, '화면 탭 = 사분면⇄실행순서 전환, 슬라이더 = 전략 목표(순서가 실제로 재계산)', true);
      E.big('시급성·난이도 포트폴리오', '분석 과제 9개를 시급성·난이도 두 축으로 실제 배치하면 4개 영역이 나옵니다 — 시급하고 쉬운 III영역이 가장 먼저, 시급하지 않고 어려운 II영역이 가장 나중입니다. 그런데 "빠른 성과 우선"과 "장기 가치 우선" 중 어느 전략을 택하느냐에 따라 실행 순서는 실제로 달라집니다. 빠른 성과 우선(난이도에 가중치)으로 정렬하면 1위는 "'+quickTop+'"이지만, 장기 가치 우선(시급성에 가중치)으로 바꾸면 1위가 "'+longTop+'"으로 실제로 바뀝니다 — 난이도가 높아도 전략적으로 시급한 과제가 앞으로 올라옵니다.'); }
  },

  // ══════════ 3. 이행계획 수립 — 우선순위를 단계별 로드맵으로 ══════════
  { id:'bda37_03',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(360+this.s.step*40,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        "for p in 과제들:",
        "    if p.q=='III': p.stage=1   # 시급+쉬움 → 우선 적용",
        "    elif p.q=='II': p.stage=3  # 비시급+어려움 → 나중",
        "    else: p.stage=2            # I,IV → 중간 단계"
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'roadmap_assign.py', s.step<3?s.step+1:null);
      var stageNames=['Stage1 — 데이터 분석체계 도입','Stage2 — 분석 유효성 검증','Stage3 — 분석 확산 및 고도화','요약 로드맵'];
      var ry=codeBot+18;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD;
      ctx.fillText(stageNames[s.step], W*0.04, ry);
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
      if(s.step<3) ctx.fillText('사분면 판정 결과로 실제 배정된 과제', W*0.04, ry+20);

      var x0=W*0.49, x1=W*0.965, y0=32, y1=225;
      if(s.step<3){
        var stage=s.step+1;
        var items=P37.filter(function(p){return p.stage===stage;});
        var rh=(y1-y0)/Math.max(items.length,1);
        items.forEach(function(p,i){
          var y=y0+i*rh;
          ctx.fillStyle=QCOL[p.q]; ctx.beginPath(); ctx.arc(x0+8,y+rh/2,5,0,7); ctx.fill();
          ctx.font='11.5px sans-serif'; ctx.fillStyle=WHITE; ctx.textAlign='left';
          ctx.fillText(p.n+' ['+p.q+'영역]', x0+20, y+rh/2+4);
        });
        ctx.font='11px sans-serif'; ctx.fillStyle=GLD; ctx.textAlign='left';
        ctx.fillText('이 단계 과제 수 = '+items.length+'개 (전체 '+P37.length+'개 중)', x0, y1+18);
      } else {
        var cols=3, cw=(x1-x0)/cols;
        [1,2,3].forEach(function(stage,ci){
          var items=P37.filter(function(p){return p.stage===stage;});
          var x=x0+ci*cw;
          ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.strokeRect(x+4,y0,cw-8,y1-y0);
          ctx.font='11.5px sans-serif'; ctx.fillStyle=ROSE; ctx.textAlign='center';
          ctx.fillText('Stage'+stage+' ('+items.length+'개)', x+cw/2, y0+16);
          items.forEach(function(p,i){ ctx.font='11px sans-serif'; ctx.fillStyle=WHITE; ctx.fillText(p.n, x+cw/2, y0+38+i*30); ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.fillText('['+p.q+'영역]', x+cw/2, y0+38+i*30+13); });
        });
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = Stage1→2→3→요약 순서로 진행(단계 배정은 사분면 결과에서 실제 계산)', true);
      E.big('이행계획 수립 — 로드맵', '포트폴리오 사분면에서 정한 우선순위를 그대로 로드맵에 옮깁니다. <b>III영역</b>(시급+쉬움) 과제 '+P37.filter(function(p){return p.stage===1;}).length+'개는 Pilot으로 먼저 검증하는 Stage1로, <b>I·IV영역</b> 과제 '+P37.filter(function(p){return p.stage===2;}).length+'개는 유효성이 검증된 뒤 업무에 내재화하는 Stage2로, <b>II영역</b>(비시급+어려움) 과제 '+P37.filter(function(p){return p.stage===3;}).length+'개는 시스템을 고도화하며 확산하는 Stage3로 실제 배정됩니다. 이 배정은 임의로 정한 것이 아니라, 앞 장면에서 계산한 사분면 결과를 그대로 규칙에 넣어 나온 결과입니다 — 우선순위 평가와 로드맵 수립이 하나로 이어지는 것이 마스터 플랜의 핵심입니다.'); }
  },

  // ══════════ 4. 분석 준비도·성숙도 진단 — 점수를 바꾸면 유형이 실제로 바뀐다 ══════════
  { id:'bda37_04',
    enter:function(E){ var self=this; self.s={dReady:0, dMat:0};
      E.controls('<div class="ctrl"><label>준비도 조정</label><input type="range" id="b374r" min="-30" max="30" step="5" value="0"><output id="b374ro">0</output></div>'
               +'<div class="ctrl"><label>성숙도 조정</label><input type="range" id="b374m" min="-30" max="30" step="5" value="0"><output id="b374mo">0</output></div>');
      E.bind('#b374r','input',function(e){ self.s.dReady=+e.target.value; document.getElementById('b374ro').textContent=self.s.dReady; });
      E.bind('#b374m','input',function(e){ self.s.dMat=+e.target.value; document.getElementById('b374mo').textContent=self.s.dMat; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var readyAdj=READY_BASE.map(function(v){ return clamp(v+s.dReady,0,100); });
      var matAdj=MAT_BASE.map(function(v){ return clamp(v+s.dMat,0,100); });
      var readyAvg=meanA(readyAdj), matAvg=meanA(matAdj);
      var hiR=readyAvg>=50, hiM=matAvg>=50;
      var type = hiR&&hiM?'확산형' : hiR&&!hiM?'도입형' : !hiR&&hiM?'정착형' : '준비형';
      var code=[
        "readiness = mean([업무,인력조직,기법,데이터,문화,IT인프라])",
        "maturity  = mean([비즈니스,조직역량,IT])",
        "if readiness>=50 and maturity>=50: type='확산형'",
        "elif readiness>=50: type='도입형'",
        "elif maturity>=50: type='정착형'",
        "else: type='준비형'"
      ];
      var actLine = hiR&&hiM?2:(hiR?3:(hiM?4:5));
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'readiness_maturity.py', actLine);
      var ry=codeBot+18;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD;
      ctx.fillText('준비도 평균='+readyAvg.toFixed(1)+'  성숙도 평균='+matAvg.toFixed(1), W*0.04, ry);
      ctx.font='13px ui-monospace,Menlo,monospace'; ctx.fillStyle=ROSE;
      ctx.fillText('→ 진단 유형 = '+type, W*0.04, ry+22);
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
      READY_NAMES.forEach(function(n,i){ ctx.fillText(n+' '+readyAdj[i].toFixed(0), W*0.04+(i%3)*70, ry+42+Math.floor(i/3)*15); });

      var x0=W*0.49, x1=W*0.965, y0=34, y1=222, midx=(x0+x1)/2, midy=(y0+y1)/2;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.strokeRect(x0,y0,x1-x0,y1-y0);
      ctx.beginPath(); ctx.moveTo(midx,y0); ctx.lineTo(midx,y1); ctx.moveTo(x0,midy); ctx.lineTo(x1,midy); ctx.stroke();
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
      ctx.fillText('성숙도 낮음', (x0+midx)/2, y1+14); ctx.fillText('성숙도 높음', (midx+x1)/2, y1+14);
      ctx.save(); ctx.translate(x0-10,(y0+midy)/2); ctx.rotate(-Math.PI/2); ctx.fillText('준비도 높음',0,0); ctx.restore();
      ctx.save(); ctx.translate(x0-10,(midy+y1)/2); ctx.rotate(-Math.PI/2); ctx.fillText('준비도 낮음',0,0); ctx.restore();
      var qn=[['준비형',(x0+midx)/2,(midy+y1)/2],['정착형',(midx+x1)/2,(midy+y1)/2],['도입형',(x0+midx)/2,(y0+midy)/2],['확산형',(midx+x1)/2,(y0+midy)/2]];
      qn.forEach(function(q){ ctx.font='11px sans-serif'; ctx.fillStyle= q[0]===type?WHITE:DIM; ctx.fillText(q[0],q[1],q[2]-4); });
      var px=x0+(matAvg/100)*(x1-x0), py=y1-(readyAvg/100)*(y1-y0);
      ctx.fillStyle=GLD; ctx.beginPath(); ctx.arc(px,py,7,0,7); ctx.fill(); ctx.strokeStyle=TXT; ctx.lineWidth=1.3; ctx.stroke();

      E.tapHint(W/2, H*0.95, '슬라이더로 6개 준비도·3개 성숙도 항목을 함께 조정해 유형이 실제로 바뀌는 것을 보세요', true);
      E.big('분석 준비도·성숙도 진단', '거버넌스 체계(조직·프로세스·시스템·데이터·교육)가 잘 작동하는지는 <b>준비도</b>(분석업무·인력및조직·분석기법·분석데이터·분석문화·IT인프라 6영역)와 <b>성숙도</b>(비즈니스·조직역량·IT 3부문, 도입→활용→확산→최적화 단계)를 함께 진단해야 알 수 있습니다. 지금 6개 항목의 평균은 '+readyAvg.toFixed(1)+', 3개 항목의 평균은 '+matAvg.toFixed(1)+'로, 두 값을 50을 기준으로 실제 판정하면 <b>'+type+'</b>에 해당합니다. 슬라이더로 점수를 올리거나 내리면 평균과 유형이 그 자리에서 실제로 재계산됩니다 — 예컨대 준비도만 크게 올리면 정착형에서 확산형으로, 성숙도만 내리면 확산형에서 도입형으로 넘어갑니다. 네 유형 모두 진단으로 끝나는 것이 아니라 각각 다른 개선 처방(사전준비/정착/도입/확산)으로 이어집니다.'); }
  },

  // ══════════ 5. 분석 조직구조 3유형 — 같은 요청을 실제로 흘려본다 ══════════
  { id:'bda37_05',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(360+this.s.step*40,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var names=['집중형','기능형','분산형','비교'];
      var code=[
        "총소요 = sum(station.days for station in 구조.단계들)",
        "총소요 += 구조.추가지연   # 이원화/중복확인 등",
        "병목 = max(station.days for station in 구조.단계들)"
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'org_flow.py', s.step<3?2:null);
      var ry=codeBot+18;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD;
      ctx.fillText(names[s.step]+' 조직구조', W*0.04, ry);
      var x0=W*0.49, x1=W*0.965, y0=34, y1=222;
      if(s.step<3){
        var o=ORG_TYPES[s.step];
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('요청 접수부터 결과 반영까지 '+o.hops+'단계를 실제로 통과', W*0.04, ry+20);
        var n=o.stations.length, cw=(x1-x0)/n;
        var maxD=Math.max.apply(null,o.stations.map(function(st){return st.d;}));
        o.stations.forEach(function(st,i){
          var x=x0+i*cw, h=(st.d/maxD)*(y1-y0-40), yTop=y1-h;
          var isBottleneck = st.d===o.bottleneck;
          ctx.fillStyle= isBottleneck?RED:BLU; ctx.fillRect(x+8, yTop, cw-16, h);
          ctx.font='11px sans-serif'; ctx.fillStyle=WHITE; ctx.textAlign='center';
          ctx.fillText(st.d+'일', x+cw/2, yTop-6);
          ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
          var words=st.n.split(''); // 줄바꿈 없이 짧게: 그대로 출력, 폭 초과시 축소
          ctx.font='11px sans-serif'; ctx.fillText(st.n.length>9? st.n.slice(0,9)+'…':st.n, x+cw/2, y1+14);
          if(i<n-1){ ctx.strokeStyle=DIM; ctx.beginPath(); ctx.moveTo(x+cw-6,y1-8); ctx.lineTo(x+cw+6,y1-8); ctx.stroke(); }
        });
        ctx.font='11px sans-serif'; ctx.fillStyle=GLD; ctx.textAlign='left';
        var extraTxt = o.extra>0? (' + 지연 '+o.extra+'일('+o.extraLabel+')') : '';
        ctx.fillText('총 소요 = '+o.base+'일'+extraTxt+' = '+o.total+'일  ·  병목 = '+o.bnName+'('+o.bottleneck+'일)', x0, y0-10);
      } else {
        var rh=(y1-y0)/ORG_TYPES.length;
        var maxT=Math.max.apply(null,ORG_TYPES.map(function(o){return o.total;}));
        var orgBarSpan=x1-x0-180-100; // 막대 뒤 "N일 병목N일" 라벨 공간을 미리 확보(넘침 방지)
        ORG_TYPES.forEach(function(o,i){
          var y=y0+i*rh, bw=(o.total/maxT)*orgBarSpan;
          ctx.fillStyle= o.total===Math.min.apply(null,ORG_TYPES.map(function(t){return t.total;}))?GRN:BLU;
          ctx.fillRect(x0+180, y+2, bw, rh-6);
          ctx.font='11.5px sans-serif'; ctx.fillStyle=WHITE; ctx.textAlign='left';
          ctx.fillText(o.key+' ('+o.hops+'단계)', x0, y+rh/2+2);
          ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=DIM;
          ctx.fillText(o.total+'일  병목'+o.bottleneck+'일', x0+180+bw+6, y+rh/2+2);
        });
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 집중형→기능형→분산형→비교 순서로, 같은 요청이 실제로 통과하는 단계를 봅니다', true);
      E.big('분석 조직구조 3유형', '같은 분석 요청을 세 조직구조에 실제로 흘려보내면 결과가 다릅니다. <b>집중형</b>은 전담조직이 전사 우선순위를 조정하지만 현업과 이원화될 위험이 있어 총 '+ORG_TYPES[0].total+'일(병목: '+ORG_TYPES[0].bnName+' '+ORG_TYPES[0].bottleneck+'일)이 걸립니다. <b>기능형</b>은 부서 내에서 바로 처리해 단계는 '+ORG_TYPES[1].hops+'개뿐이지만 중복분석 확인이 붙어 '+ORG_TYPES[1].total+'일, <b>분산형</b>은 현업에 배치된 인력이 전사 우선순위까지 반영하면서도 지연 없이 '+ORG_TYPES[2].total+'일로 가장 빠릅니다. 이 계산은 각 구조의 단계 수·소요일을 실제로 더한 결과이지, 어느 구조가 더 좋다고 미리 정해둔 것이 아닙니다 — 실제로는 데이터 표준화(용어·코드·메타데이터 정비)와 분석 교육까지 갖춰야 어떤 조직구조든 제 속도를 낼 수 있습니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
