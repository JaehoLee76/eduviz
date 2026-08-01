/* 빅데이터 분석 제33장 — 빅데이터의 가치와 데이터 사이언스
   (3V · 표본조사→전수조사(+질보다 양) · 인과관계→상관관계(교란변수) · 가치산정 어려움/위기요인·통제방안 ·
    데이터 사이언스의 구성과 하드/소프트 스킬)
   동작(behavior)만. 텍스트=content/bda33.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 화면의 모든 수는 아래 고정 데이터로부터 이 파일 로드 시 실제 계산(하드코딩 금지).
   Math.random()/Date.now() 금지 — 예제 데이터는 고정 배열 또는 고정 시드 LCG.
   이 장의 예시 수치(3V 부하 가정·재사용 효용값 등)는 개념을 실제로 돌려 보이기 위한 모형 안의
   가정값이며, 시장 통계·실제 조사치를 주장하지 않는다(장면 안에서 그렇게 밝힌다). */
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

  function LCG(seed){ var s=seed>>>0; return function(){ s=(1103515245*s+12345)>>>0; return s/4294967296; }; }
  function mean(arr){ return arr.reduce(function(s,v){ return s+v; },0)/arr.length; }
  function pearson(x,y){
    var n=x.length, mx=mean(x), my=mean(y), num=0, dx2=0, dy2=0;
    for(var i=0;i<n;i++){ var dx=x[i]-mx, dy=y[i]-my; num+=dx*dy; dx2+=dx*dx; dy2+=dy*dy; }
    return num/Math.sqrt(dx2*dy2);
  }
  function wrapText(ctx, text, x, y, maxW, lh){
    var chars=text.split(''), line='', ty=y;
    for(var i=0;i<chars.length;i++){
      var test=line+chars[i];
      if(ctx.measureText(test).width>maxW && line){ ctx.fillText(line, x, ty); line=chars[i]; ty+=lh; }
      else line=test;
    }
    if(line) ctx.fillText(line, x, ty);
    return ty+lh;
  }

  // ══════════ 33.1: 3V ══════════
  var DISK_UNIT_GB=500;     // 가정: 저장장치 1대 용량
  var REC_SIZE_KB=2.5;      // 가정: 레코드 1건 평균 크기

  // ══════════ 33.2: 표본조사 vs 전수조사 (+ 질보다 양) ══════════
  var POP_N33=200;
  var POP33=[];
  (function(){ var rng=LCG(918273); for(var i=0;i<POP_N33;i++){ POP33.push(+(40+rng()*60).toFixed(1)); } })();
  var RARE_IDX33=[13,97,181];
  RARE_IDX33.forEach(function(i,k){ POP33[i] = +(320+k*11).toFixed(1); }); // 드물게 매우 높은 매출 매장(전체 3곳)
  var POP_MEAN33 = mean(POP33);
  // 표본 뽑는 순서를 고정 셔플(피셔-예이츠, 고정 시드)로 한 번만 만들어 둔다
  var SHUF33=(function(){
    var arr=[]; for(var i=0;i<POP_N33;i++) arr.push(i);
    var rng=LCG(552013);
    for(var j=arr.length-1;j>0;j--){ var k=Math.floor(rng()*(j+1)); var t=arr[j]; arr[j]=arr[k]; arr[k]=t; }
    return arr;
  })();

  // ══════════ 33.3: 인과관계 vs 상관관계(교란변수) ══════════
  var MONTH33=['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
  var TEMP33=[2,4,8,14,19,24,27,26,21,15,9,3];
  var NOISE_I33=[1,-2,0,3,-1,2,-3,1,0,-2,2,-1];
  var NOISE_D33=[0,1,-1,0,1,-1,0,1,-1,0,1,-1];
  var ICE33 = TEMP33.map(function(t,i){ return Math.round(t*8+40+NOISE_I33[i]); });
  var DRW33 = TEMP33.map(function(t,i){ return Math.round(t*0.6+1+NOISE_D33[i]); });
  var R_RAW33 = pearson(ICE33,DRW33);
  var R_IT33 = pearson(ICE33,TEMP33);
  var R_DT33 = pearson(DRW33,TEMP33);
  var R_PARTIAL33 = (R_RAW33 - R_IT33*R_DT33) / Math.sqrt((1-R_IT33*R_IT33)*(1-R_DT33*R_DT33));

  // ══════════ 33.4: 재사용 가치 + 위기요인 3가지 ══════════
  var REUSE33=[
    {name:'방범(도난 감지)', util:10, cost:6},
    {name:'고객 동선 분석', util:7, cost:6},
    {name:'재고 자동 확인', util:5, cost:6}
  ];
  var BUILD_COST_SHARED33=10; // 공유 시스템 1회 구축 가정 비용
  var ADAPT_COST33=1;         // 추가 용도마다 드는 적용 비용 가정
  var RISK33=[
    {risk:'사생활 침해', control:'동의(opt-in)에서 결과 기반 책임으로'},
    {risk:'책임 원칙 훼손', control:'행동 결과에 기반한 책임 원칙 강화'},
    {risk:'데이터 오용', control:'알고리즘에 대한 접근권 제공'}
  ];

  // ══════════ 33.5: 데이터 사이언스의 구성 + 하드/소프트 스킬 ══════════
  var VC33 = [ {name:'분석 기술', x:0, y:-38, r:78, col:BLU}, {name:'IT', x:-68, y:38, r:78, col:GRN}, {name:'비즈니스 컨설팅', x:68, y:38, r:78, col:GLD} ];
  function insideAll(px,py){
    for(var i=0;i<VC33.length;i++){ var c=VC33[i], dx=px-c.x, dy=py-c.y; if(dx*dx+dy*dy>c.r*c.r) return false; }
    return true;
  }
  var TRIPLE_AREA33=(function(){
    var step=2, cnt=0;
    for(var x=-150;x<=150;x+=step){ for(var y=-150;y<=150;y+=step){ if(insideAll(x,y)) cnt++; } }
    return cnt*step*step; // px^2 단위(그리드 적분, 결정적)
  })();
  var HARD33=['수학·통계 지식','머신러닝 기법 이해','프로그래밍(파이썬 등)','데이터 처리 기술'];
  var SOFT33=['통찰력 있는 분석','설득력 있는 전달','협력과 소통','호기심 어린 질문'];

  var scenes = [

  // ══════════ 1. 3V로 보는 빅데이터의 출현 ══════════
  { id:'bda33_01',
    enter:function(E){ var self=this; self.s={vol:200, vty:2, vel:50};
      E.controls('<div class="ctrl"><label>데이터 양 Volume(GB)</label><input type="range" id="b331v" min="10" max="5000" step="10" value="200"><output id="b331vo">200</output></div>'
               +'<div class="ctrl"><label>데이터 종류 Variety(유형 수)</label><input type="range" id="b331t" min="1" max="4" step="1" value="2"><output id="b331to">2</output></div>'
               +'<div class="ctrl"><label>유입 속도 Velocity(건/초)</label><input type="range" id="b331s" min="1" max="2000" step="1" value="50"><output id="b331so">50</output></div>');
      E.bind('#b331v','input',function(e){ self.s.vol=+e.target.value; document.getElementById('b331vo').textContent=self.s.vol; });
      E.bind('#b331t','input',function(e){ self.s.vty=+e.target.value; document.getElementById('b331to').textContent=self.s.vty; });
      E.bind('#b331s','input',function(e){ self.s.vel=+e.target.value; document.getElementById('b331so').textContent=self.s.vel; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var diskUnits = Math.ceil(s.vol/DISK_UNIT_GB);
      var convRules = s.vty*(s.vty-1)/2;
      var thrMBs = s.vel*REC_SIZE_KB/1024;
      var code=[
        {t:'disk_units   = ceil(volume_gb / '+DISK_UNIT_GB+')      # 저장장치 1대='+DISK_UNIT_GB+'GB', hl:'ceil'},
        {t:'conv_rules   = variety*(variety-1)//2   # 형식 쌍마다 변환규칙', hl:'conv_rules'},
        {t:'throughput   = velocity * '+REC_SIZE_KB+'/1024   # 레코드 1건='+REC_SIZE_KB+'KB', hl:'throughput'}
      ];
      var codeBot = codePanel(E, W*0.04, 12, W*0.42, code, 'threeV_load.py', [0,1,2]);
      var ry=codeBot+18;
      ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
      wrapText(ctx, '아래 세 계산은 이 모형이 정한 가정(저장장치 1대='+DISK_UNIT_GB+'GB, 레코드 1건='+REC_SIZE_KB+'KB) 위에서 실제로 돌린 결과입니다', W*0.04, ry, W*0.42, 15);

      var rx0=W*0.49, rx1=W*0.965, rTop=30;
      var rows=[
        {lab:'Volume — 저장 부하', val:diskUnits, unit:'대(저장장치)', col:BLU, note:s.vol+'GB ÷ '+DISK_UNIT_GB+'GB'},
        {lab:'Variety — 통합 부하', val:convRules, unit:'개(변환 규칙)', col:GLD, note:s.vty+'개 형식의 모든 쌍'},
        {lab:'Velocity — 처리 부하', val:+thrMBs.toFixed(2), unit:'MB/s', col:GRN, note:s.vel+'건/초 × '+REC_SIZE_KB+'KB'}
      ];
      var maxvs=[Math.max(diskUnits,1), Math.max(convRules,1), Math.max(thrMBs,0.1)];
      rows.forEach(function(r,ri){
        var y=rTop+ri*66;
        ctx.font='12px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText(r.lab, rx0, y);
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=DIM; ctx.textAlign='right';
        ctx.fillText(r.note, rx1, y);
        var bw=rx1-rx0, bh=16;
        ctx.fillStyle='rgba(255,255,255,0.10)'; ctx.fillRect(rx0, y+8, bw, bh);
        var frac=Math.min(1, r.val/maxvs[ri]);
        ctx.fillStyle=r.col; ctx.fillRect(rx0, y+8, bw*frac, bh);
        ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText(r.val+' '+r.unit, rx0+6, y+8+bh-4);
      });

      E.tapHint(W/2, H*0.95, '슬라이더로 Volume·Variety·Velocity를 바꿔 세 부하가 실제로 재계산되는 것을 보세요', true);
      E.big('3V로 보는 빅데이터의 출현', '빅데이터가 만든 새로운 도전과 기회를 요약한 특징이 <b>3V</b>입니다 — 데이터의 양(Volume), 형태와 소스의 다양성(Variety), 수집·처리 속도(Velocity)가 한꺼번에 급격히 커진 상태를 가리킵니다. 이 모형에서는 저장장치 1대를 '+DISK_UNIT_GB+'GB로 가정해 Volume='+s.vol+'GB일 때 실제로 필요한 저장장치가 '+diskUnits+'대라고 계산합니다. Variety는 형식이 늘수록 서로 다른 형식 쌍마다 변환 규칙이 필요해 '+s.vty+'개 형식이면 '+convRules+'개 변환 규칙이 조합적으로 필요합니다(형식이 늘어날수록 부담이 산술이 아니라 조합으로 커지는 이유입니다). Velocity는 레코드 1건을 '+REC_SIZE_KB+'KB로 가정하면 초당 '+s.vel+'건이 밀려들 때 처리해야 할 양이 실제로 '+thrMBs.toFixed(2)+'MB/s에 이릅니다. 슬라이더를 극단으로 밀어 보면, 예전에는 한 대의 서버로 감당하던 정형 데이터 처리가 왜 저장·통합·처리 세 방향에서 동시에 한계를 넘어서는지 감이 잡힙니다 — 이것이 빅데이터가 "그냥 큰 데이터"가 아니라 세 축이 함께 커지는 현상인 이유입니다.'); }
  },

  // ══════════ 2. 표본조사에서 전수조사로 ══════════
  { id:'bda33_02',
    enter:function(E){ var self=this; self.s={n:20};
      E.controls('<div class="ctrl"><label>표본 크기 n</label><input type="range" id="b332n" min="5" max="200" step="5" value="20"><output id="b332no">20</output></div>');
      E.bind('#b332n','input',function(e){ self.s.n=+e.target.value; document.getElementById('b332no').textContent=self.s.n; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var idxs = SHUF33.slice(0, s.n);
      var idxSet={}; idxs.forEach(function(i){ idxSet[i]=true; });
      var sampVals = idxs.map(function(i){ return POP33[i]; });
      var sampMean = mean(sampVals);
      var err = Math.abs(sampMean-POP_MEAN33);
      var captured = RARE_IDX33.filter(function(i){ return idxSet[i]; }).length;
      var code=[
        {t:'sample = df.sample(n='+s.n+', random_state=0)', hl:'.sample'},
        {t:'sample.mean(), abs(sample.mean() - population.mean())', hl:'.mean()'},
        {t:'rare_found = len(set(sample.index) & set(rare_idx))', hl:'rare_found'}
      ];
      var codeBot = codePanel(E, W*0.04, 12, W*0.42, code, 'sample_vs_census.py', [0,1,2]);
      var ry=codeBot+18;
      ctx.font='12px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
      ctx.fillStyle=BLU; ctx.fillText('표본평균(n='+s.n+') = '+sampMean.toFixed(2)+'만원', W*0.04, ry);
      ctx.fillStyle=GRN; ctx.fillText('전수평균(N=200) = '+POP_MEAN33.toFixed(2)+'만원', W*0.04, ry+20);
      ctx.fillStyle=(err<1)?GRN:GLD; ctx.fillText('오차 = '+err.toFixed(2)+'만원', W*0.04, ry+40);
      ctx.fillStyle=(captured===3)?GRN:RED;
      ctx.fillText('희귀 고매출 매장 포착 = '+captured+'/3', W*0.04, ry+60);
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
      wrapText(ctx, 'n을 200(전수)까지 올리면 오차는 0, 포착은 3/3이 됩니다 — 표본은 매번 "운"이 섞입니다', W*0.04, ry+82, W*0.42, 15);

      var rx0=W*0.49, rx1=W*0.965, rTop=26, rBot=210;
      var px0=rx0+10, px1=rx1-10;
      function PX(i){ return px0+(i/(POP_N33-1))*(px1-px0); }
      var maxv=340;
      function PY(v){ return rBot-(v/maxv)*(rBot-rTop); }
      ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,rBot); ctx.lineTo(px1,rBot); ctx.stroke();
      for(var i=0;i<POP_N33;i++){
        var rare = RARE_IDX33.indexOf(i)>=0;
        var inS = !!idxSet[i];
        ctx.fillStyle = rare ? (inS?GLD:RED) : (inS?BLU:'rgba(155,153,163,0.35)');
        ctx.beginPath(); ctx.arc(PX(i), PY(POP33[i]), rare?3.6:(inS?2.6:1.6), 0, 7); ctx.fill();
      }
      ctx.strokeStyle=GRN; ctx.setLineDash([4,3]); ctx.lineWidth=1.4;
      ctx.beginPath(); ctx.moveTo(px0,PY(POP_MEAN33)); ctx.lineTo(px1,PY(POP_MEAN33)); ctx.stroke();
      ctx.strokeStyle=BLU; ctx.beginPath(); ctx.moveTo(px0,PY(sampMean)); ctx.lineTo(px1,PY(sampMean)); ctx.stroke(); ctx.setLineDash([]);
      ctx.font='11px sans-serif'; ctx.textAlign='left';
      ctx.fillStyle=GRN; ctx.fillText('전수평균', px1-58, PY(POP_MEAN33)-4);
      ctx.fillStyle=BLU; ctx.fillText('표본평균', px1-58, PY(sampMean)+13);
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
      ctx.fillText('점 하나 = 매장 1곳의 하루 매출(만원). 파랑=표본에 포함, 금색=포착된 희귀 고매출', rx0, rTop-8);

      E.tapHint(W/2, H*0.95, '슬라이더로 표본 크기 n을 바꿔 오차·희귀패턴 포착이 실제로 달라지는 것을 보세요', true);
      E.big('표본조사에서 전수조사로', '매장 200곳의 하루 매출을 모집단으로 놓고, 표본 크기 n을 슬라이더로 바꿔 가며 실제로 뽑아 봅니다. n='+s.n+'일 때 표본평균은 '+sampMean.toFixed(2)+'만원으로 전수평균 '+POP_MEAN33.toFixed(2)+'만원과 '+err.toFixed(2)+'만원 차이가 나고, 일부러 섞어 둔 희귀 고매출 매장 3곳 중 '+captured+'곳만 표본에 걸렸습니다. 기존에는 데이터 수집·처리 비용 때문에 <b>표본조사</b>에 의존했지만, 빅데이터 시대에는 그 제약이 사라지며 <b>전수조사</b>가 가능해졌습니다 — n을 200까지 올려 보면 오차는 정확히 0이 되고 희귀 매장도 3/3 모두 포착됩니다. 표본은 정유 배관의 부식 패턴이나 카드사의 불법거래 패턴처럼 <b>드물지만 중요한 패턴</b>을 통째로 놓칠 수 있는데, 이것이 "질보다 양"이 중요해지는 이유이기도 합니다 — 데이터가 충분히 많아지면 소수의 오류나 예외가 전체 판단에 주는 영향은 줄어들고, 반대로 드문 진짜 패턴은 양이 많아야 비로소 눈에 띕니다. 또한 표본은 애초에 정한 질문에 맞춰 수집하므로(<b>사전처리</b>) 질문이 바뀌면 다시 모아야 하지만, 전수 데이터를 일단 모아 두면(<b>사후처리</b>) 나중에 질문이 바뀌어도 같은 데이터를 다시 가공해 답할 수 있습니다.'); }
  },

  // ══════════ 3. 인과관계보다 상관관계 — 그리고 숨은 변수 ══════════
  { id:'bda33_03',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(340+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var codes=[
        [ {t:'corr(icecream, drowning)', hl:'corr'} ],
        [ {t:'corr(icecream, temp), corr(drowning, temp)', hl:'corr'} ],
        [ {t:'r_xy_z = (r_xy - r_xz*r_yz) / sqrt((1-r_xz**2)*(1-r_yz**2))', hl:'r_xy_z'} ]
      ];
      var codeBot = codePanel(E, W*0.04, 12, W*0.42, codes[s.step], 'confound.py', 0);
      var ry=codeBot+18;
      ctx.font='12px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
      if(s.step===0){
        ctx.fillStyle=RED; ctx.fillText('아이스크림 판매 ↔ 익사 사고, 상관계수 = '+R_RAW33.toFixed(3), W*0.04, ry);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        wrapText(ctx, '12개월 실측 상관이 매우 높습니다 — 아이스크림이 익사를 일으킨다고 봐야 할까요?', W*0.04, ry+22, W*0.42, 15);
      } else if(s.step===1){
        ctx.fillStyle=GLD; ctx.fillText('숨은 변수: 월평균 기온', W*0.04, ry);
        ctx.fillStyle=BLU; ctx.fillText('기온↔아이스크림 = '+R_IT33.toFixed(3), W*0.04, ry+20);
        ctx.fillStyle=PUR; ctx.fillText('기온↔익사사고 = '+R_DT33.toFixed(3), W*0.04, ry+40);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        wrapText(ctx, '둘 다 더운 달에 함께 오릅니다 — 공통 원인이 있을 수 있습니다', W*0.04, ry+62, W*0.42, 15);
      } else {
        ctx.fillStyle=RED; ctx.fillText('원래 상관 r = '+R_RAW33.toFixed(3), W*0.04, ry);
        ctx.fillStyle=GRN; ctx.fillText('기온을 통제한 부분상관 = '+R_PARTIAL33.toFixed(3), W*0.04, ry+20);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        wrapText(ctx, '기온이라는 공통 원인을 실제로 걷어내면 상관이 크게 줄어듭니다 — 인과가 아니라 교란이었습니다', W*0.04, ry+42, W*0.42, 15);
      }

      var rx0=W*0.49, rx1=W*0.965, rTop=30, rMid=140, rBot=224;
      function mx(i){ return rx0+(i/11)*(rx1-rx0); }
      if(s.step<=1){
        function my(v,mn,mx2){ return rMid-((v-mn)/(mx2-mn))*(rMid-rTop); }
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText('아이스크림 판매(개, 파랑) · 익사 사고(건, 보라)', rx0, rTop-8);
        var iceMin=Math.min.apply(null,ICE33), iceMax=Math.max.apply(null,ICE33);
        var drwMin=Math.min.apply(null,DRW33), drwMax=Math.max.apply(null,DRW33);
        ctx.strokeStyle=BLU; ctx.lineWidth=2; ctx.beginPath();
        ICE33.forEach(function(v,i){ var x=mx(i),y=my(v,iceMin,iceMax); if(i===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); }); ctx.stroke();
        ctx.strokeStyle=PUR; ctx.lineWidth=2; ctx.beginPath();
        DRW33.forEach(function(v,i){ var x=mx(i),y=(rMid-((v-drwMin)/(drwMax-drwMin))*(rMid-rTop)); if(i===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); }); ctx.stroke();
        if(s.step===1){
          var tMin=Math.min.apply(null,TEMP33), tMax=Math.max.apply(null,TEMP33);
          ctx.strokeStyle=GLD; ctx.lineWidth=2.4; ctx.beginPath();
          TEMP33.forEach(function(v,i){ var x=mx(i),y=(rBot-16-((v-tMin)/(tMax-tMin))*(rBot-16-(rMid+16))); if(i===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); }); ctx.stroke();
          ctx.font='11px sans-serif'; ctx.fillStyle=GLD; ctx.textAlign='left';
          ctx.fillText('월평균 기온(숨은 변수)', rx0, rMid+14);
        }
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
        MONTH33.forEach(function(m,i){ if(i%2===0) ctx.fillText(m, mx(i), rBot+14); });
      } else {
        var bx0=rx0+30, bx1=rx1-10, bTop=rTop, bBot=rBot-20, bh=(bBot-bTop);
        ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.moveTo(bx0,bTop); ctx.lineTo(bx0,bBot); ctx.moveTo(bx0,(bTop+bBot)/2); ctx.lineTo(bx1,(bTop+bBot)/2); ctx.stroke();
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='right';
        ctx.fillText('1.0', bx0-4, bTop+4); ctx.fillText('0', bx0-4, (bTop+bBot)/2+4); ctx.fillText('-1.0', bx0-4, bBot+4);
        function by(v){ return (bTop+bBot)/2 - v*(bh/2); }
        var bars=[{lab:'원래 상관 r', v:R_RAW33, col:RED},{lab:'기온 통제 후', v:R_PARTIAL33, col:GRN}];
        var bw=70;
        bars.forEach(function(b,bi){
          var xk=bx0+40+bi*140;
          var y0=by(0), y1=by(b.v);
          ctx.fillStyle=b.col; ctx.fillRect(xk, Math.min(y0,y1), bw, Math.abs(y1-y0));
          ctx.font='12px ui-monospace,Menlo,monospace'; ctx.textAlign='center'; ctx.fillStyle=TXT;
          ctx.fillText(b.v.toFixed(3), xk+bw/2, (y1<y0? y1-8 : y1+16));
          ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
          ctx.fillText(b.lab, xk+bw/2, bBot+16);
        });
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 원래 상관 → 숨은 변수(기온) → 기온을 통제한 부분상관', true);
      E.big('인과관계보다 상관관계 — 그리고 숨은 변수', '12개월치 아이스크림 판매량과 익사 사고 건수를 실제로 상관계수를 계산해 보면 r='+R_RAW33.toFixed(3)+'로 매우 높게 나옵니다. 빅데이터 시대는 <b>인과관계보다 상관관계</b>를 앞세웁니다 — 왜 그런지 몰라도 상관만 확실하면 실무적으로 충분한 경우가 많기 때문입니다(독감 확산을 예측하는 45개 검색어 사례처럼). 하지만 이 숫자를 "아이스크림이 익사를 부른다"고 읽으면 틀립니다. 월평균 기온이라는 <b>숨은 변수(교란 변수)</b>가 둘 다에 영향을 주기 때문입니다 — 기온과 아이스크림의 상관은 '+R_IT33.toFixed(3)+', 기온과 익사사고의 상관은 '+R_DT33.toFixed(3)+'로 둘 다 기온과 강하게 얽혀 있습니다. 기온을 실제로 통제한 <b>부분상관</b>을 계산하면 '+R_PARTIAL33.toFixed(3)+'로 크게 줄어듭니다 — 두 변수가 함께 움직인 것은 서로가 서로의 원인이어서가 아니라 더운 날씨라는 공통 원인 때문이었습니다. 이론의 종말이라는 말처럼 인과관계가 완전히 불필요해진 것은 아닙니다 — 상관관계로 빠르게 행동하되, 중요한 결정 앞에서는 이렇게 숨은 변수를 의심하고 걷어내 보는 습관이 필요합니다.'); }
  },

  // ══════════ 4. 가치는 어떻게 커지고, 무엇이 위험한가 ══════════
  { id:'bda33_04',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(320+this.s.step*60,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var used = REUSE33.slice(0, Math.min(s.step+1, REUSE33.length));
      var cumUtil = used.reduce(function(a,u){ return a+u.util; },0);
      var sharedCost = BUILD_COST_SHARED33 + Math.max(0, used.length-1)*ADAPT_COST33;
      var soloCost = used.reduce(function(a,u){ return a+u.cost; },0);
      var code = (s.step<3) ? [
        {t:'uses = [("방범",10),("동선분석",7),("재고확인",5)][:'+(s.step+1)+']', hl:'uses'},
        {t:'cum_util = sum(u for _, u in uses)', hl:'cum_util'},
        {t:'shared_cost = 10 + max(0, len(uses)-1)*1', hl:'shared_cost'}
      ] : [
        {t:'risks = ["사생활침해","책임원칙훼손","데이터오용"]', hl:'risks'},
        {t:'controls = ["동의→책임","결과기반 책임","알고리즘 접근권"]', hl:'controls'},
        {t:'dict(zip(risks, controls))  # 위기요인 ↔ 통제방안', hl:'zip'}
      ];
      var codeBot = codePanel(E, W*0.04, 12, W*0.42, code, s.step<3?'reuse_value.py':'risk_control.py', s.step<3?[0,1,2]:2);
      var ry=codeBot+18;
      ctx.font='12px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
      if(s.step<3){
        ctx.fillStyle=GLD; ctx.fillText('누적 효용 = '+cumUtil+' (용도 '+used.length+'개)', W*0.04, ry);
        ctx.fillStyle=BLU; ctx.fillText('공유 구축 비용 = '+sharedCost, W*0.04, ry+20);
        ctx.fillStyle=RED; ctx.fillText('용도별 별도 구축 비용 = '+soloCost, W*0.04, ry+40);
        if(s.step===2){
          ctx.fillStyle=GRN; ctx.fillText('공유 재사용으로 아낀 비용 = '+(soloCost-sharedCost), W*0.04, ry+60);
        }
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
        wrapText(ctx, 'CCTV 영상 하나를 여러 목적에 재사용할 때마다 효용이 실제로 더해집니다', W*0.04, ry+(s.step===2?82:62), W*0.42, 15);
      } else {
        ctx.fillStyle=TXT; ctx.fillText('위기 요인 3가지 ↔ 통제 방안 3가지', W*0.04, ry);
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
        wrapText(ctx, '각 위기 요인에 대응하는 통제 방안이 실제로 1:1로 짝지어집니다', W*0.04, ry+20, W*0.42, 15);
      }

      var rx0=W*0.49, rx1=W*0.965, rTop=28;
      if(s.step<3){
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText('CCTV 데이터 1개의 재사용 (가정 효용값)', rx0, rTop);
        var bh0=rTop+16, bw=(rx1-rx0)/3;
        REUSE33.forEach(function(u,ui){
          var active = ui<=s.step;
          var hh=(u.util/10)*70;
          ctx.fillStyle= active? GRN : 'rgba(255,255,255,0.10)';
          ctx.fillRect(rx0+ui*bw+10, bh0+74-hh, bw-20, hh);
          ctx.font='11px ui-monospace,Menlo,monospace'; ctx.textAlign='center'; ctx.fillStyle= active? TXT : DIM;
          ctx.fillText('+'+u.util, rx0+ui*bw+bw/2, bh0+74-hh-6);
          ctx.font='11px sans-serif'; ctx.fillStyle= active? TXT : DIM;
          ctx.fillText(u.name, rx0+ui*bw+bw/2, bh0+90);
        });
        var by2=bh0+118;
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
        ctx.fillText('누적 효용 막대', rx0, by2);
        var cw=(rx1-rx0)*Math.min(1,cumUtil/22);
        ctx.fillStyle='rgba(255,255,255,0.1)'; ctx.fillRect(rx0, by2+8, rx1-rx0, 16);
        ctx.fillStyle=GLD; ctx.fillRect(rx0, by2+8, cw, 16);
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT; ctx.fillText(cumUtil, rx0+6, by2+21);
      } else {
        var rh=58;
        RISK33.forEach(function(r,ri){
          var y=rTop+ri*rh;
          ctx.strokeStyle=RED; ctx.lineWidth=1.4;
          roundRect(ctx, rx0, y, (rx1-rx0)*0.42, 34, 7); ctx.stroke();
          ctx.font='11.5px sans-serif'; ctx.fillStyle=RED; ctx.textAlign='center';
          ctx.fillText(r.risk, rx0+(rx1-rx0)*0.21, y+21);
          ctx.strokeStyle=GRN; roundRect(ctx, rx0+(rx1-rx0)*0.54, y, (rx1-rx0)*0.46, 34, 7); ctx.stroke();
          ctx.font='11px sans-serif'; ctx.fillStyle=GRN; ctx.textAlign='center';
          wrapTextCenter(ctx, r.control, rx0+(rx1-rx0)*0.54+(rx1-rx0)*0.23, y+15, (rx1-rx0)*0.44, 13);
          ctx.strokeStyle=DIM; ctx.lineWidth=1; ctx.beginPath();
          ctx.moveTo(rx0+(rx1-rx0)*0.42, y+17); ctx.lineTo(rx0+(rx1-rx0)*0.54, y+17); ctx.stroke();
        });
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 재사용 용도를 하나씩 추가 → 위기요인과 통제방안 짝짓기', true);
      E.big('가치는 어떻게 커지고, 무엇이 위험한가', '빅데이터의 가치 산정이 어려운 첫째 이유는 <b>재사용·재조합</b>입니다 — 전기차 배터리 데이터가 충전 시간 안내(1차 목적)뿐 아니라 충전소 입지 선정(2차 목적)에도 쓰이듯, CCTV 데이터도 방범뿐 아니라 고객 동선 분석·재고 확인에 함께 쓰일 수 있습니다. 이 모형의 가정값으로 실제로 더해 보면, 용도 하나만 구축할 때 효용은 최대 10이지만 세 용도를 공유 재사용하면 누적 효용 '+REUSE33.reduce(function(a,u){return a+u.util;},0)+'을 얻으면서도, 각 용도를 따로 구축하는 비용 '+REUSE33.reduce(function(a,u){return a+u.cost;},0)+'보다 공유 구축 비용('+ (BUILD_COST_SHARED33+2*ADAPT_COST33) +')이 더 적게 듭니다 — 재사용이 비용은 줄이고 가치는 불리는 이유입니다. 하지만 이런 자유로운 재사용은 어두운 면도 만듭니다. 빅데이터 시대의 위기 요인 셋 — <b>사생활 침해</b>(본래 목적 밖 2차·3차 활용), <b>책임 원칙 훼손</b>(예측만으로 처벌하는 사전 판단의 위험), <b>데이터 오용</b> — 에는 각각 대응하는 통제 방안이 있습니다: 매번 동의를 구하기 어려운 현실을 인정하고 <b>결과에 대한 책임</b>으로 무게중심을 옮기며, 데이터를 다루는 <b>알고리즘 자체에 접근권</b>을 주어 오용을 검증할 수 있게 하는 것입니다.'); }
  },

  // ══════════ 5. 데이터 사이언스 — 기술과 사람이 만나는 곳 ══════════
  { id:'bda33_05',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*60,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var codes=[
        [ {t:'inside = lambda p: all(dist(p,c)<=c.r for c in circles)', hl:'inside'}, {t:'area = sum(inside(p) for p in grid) * cell_area', hl:'area'} ],
        [ {t:'hard = ["수학·통계","머신러닝","프로그래밍","데이터처리"]', hl:'hard'}, {t:'soft = ["통찰력","전달력","협력","호기심"]', hl:'soft'}, {t:'len(hard), len(soft)  # 절반씩', hl:'len'} ],
        [ {t:'roles = ["데이터 사이언티스트", "알고리즈미스트"]', hl:'roles'}, {t:'# 가치를 찾는 사람 · 그 위험을 감시하는 사람', dim:true} ]
      ];
      var codeBot = codePanel(E, W*0.04, 12, W*0.42, codes[s.step], ['venn_area.py','hard_soft.py','future_roles.py'][s.step], s.step===0?[0,1]:(s.step===1?2:null));
      var ry=codeBot+18;
      ctx.font='12px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
      if(s.step===0){
        ctx.fillStyle=GLD; ctx.fillText('세 영역이 모두 겹치는 넓이(격자 적분) = '+TRIPLE_AREA33+'px²', W*0.04, ry);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        wrapText(ctx, '데이터 사이언스는 분석기술·IT·비즈니스 컨설팅, 세 영역이 겹치는 자리입니다', W*0.04, ry+22, W*0.42, 15);
      } else if(s.step===1){
        ctx.fillStyle=BLU; ctx.fillText('하드 스킬 '+HARD33.length+'개', W*0.04, ry);
        ctx.fillStyle=ROSE; ctx.fillText('소프트 스킬 '+SOFT33.length+'개', W*0.04, ry+20);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        wrapText(ctx, '정확히 절반씩 — 하드 스킬은 능력의 절반에 불과합니다', W*0.04, ry+42, W*0.42, 15);
      } else {
        ctx.fillStyle=TXT; ctx.fillText('미래: 모든 것의 데이터화', W*0.04, ry);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        wrapText(ctx, '가치를 찾아내는 사람(데이터 사이언티스트)과 그 힘을 감시하는 사람(알고리즈미스트)', W*0.04, ry+22, W*0.42, 15);
      }

      var rx0=W*0.49, rx1=W*0.965, rTop=26, rBot=232;
      var cx=(rx0+rx1)/2, cy=(rTop+rBot)/2+6;
      if(s.step===0){
        VC33.forEach(function(c){
          ctx.globalAlpha=0.30; ctx.fillStyle=c.col;
          ctx.beginPath(); ctx.arc(cx+c.x, cy+c.y, c.r, 0, 7); ctx.fill(); ctx.globalAlpha=1;
          ctx.strokeStyle=c.col; ctx.lineWidth=1.6;
          ctx.beginPath(); ctx.arc(cx+c.x, cy+c.y, c.r, 0, 7); ctx.stroke();
        });
        ctx.font='11.5px sans-serif'; ctx.textAlign='center';
        ctx.fillStyle=BLU; ctx.fillText('분석 기술', cx+VC33[0].x, cy+VC33[0].y-VC33[0].r+16);
        ctx.fillStyle=GRN; ctx.fillText('IT', cx+VC33[1].x-30, cy+VC33[1].y+8);
        ctx.fillStyle=GLD; ctx.fillText('비즈니스 컨설팅', cx+VC33[2].x+8, cy+VC33[2].y+8);
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT;
        ctx.fillText('데이터 사이언스', cx, cy+6);
      } else if(s.step===1){
        ctx.font='11.5px sans-serif'; ctx.textAlign='left'; ctx.fillStyle=TXT;
        ctx.fillText('하드 스킬', rx0, rTop);
        HARD33.forEach(function(h,i){ ctx.font='11px sans-serif'; ctx.fillStyle=BLU; ctx.fillText('· '+h, rx0, rTop+22+i*20); });
        ctx.font='11.5px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText('소프트 스킬', rx0+ (rx1-rx0)*0.52, rTop);
        SOFT33.forEach(function(h,i){ ctx.font='11px sans-serif'; ctx.fillStyle=ROSE; ctx.fillText('· '+h, rx0+(rx1-rx0)*0.52, rTop+22+i*20); });
        var by=rTop+22+4*20+16;
        var bw=(rx1-rx0-16)/2, bh=40;
        ctx.fillStyle=BLU; ctx.fillRect(rx0, by, bw, bh);
        ctx.fillStyle=ROSE; ctx.fillRect(rx0+bw+16, by, bw, bh);
        ctx.font='13px ui-monospace,Menlo,monospace'; ctx.textAlign='center'; ctx.fillStyle=TXT;
        ctx.fillText(HARD33.length+'개', rx0+bw/2, by+bh/2+5);
        ctx.fillText(SOFT33.length+'개', rx0+bw+16+bw/2, by+bh/2+5);
      } else {
        ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillStyle=TXT;
        var roles=[
          {name:'데이터 사이언티스트', role:'빅데이터에서 가치를 찾아 조직 전략에 반영', col:GLD},
          {name:'알고리즈미스트(Algorithmist)', role:'그 결정이 부당한 피해를 만들지 감시·견제', col:BLU}
        ];
        roles.forEach(function(r,ri){
          var y=rTop+ri*90;
          ctx.strokeStyle=r.col; ctx.lineWidth=1.5;
          roundRect(ctx, rx0, y, rx1-rx0, 70, 9); ctx.stroke();
          ctx.font='12.5px sans-serif'; ctx.fillStyle=r.col; ctx.textAlign='left';
          ctx.fillText(r.name, rx0+14, y+26);
          ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
          wrapText(ctx, r.role, rx0+14, y+46, rx1-rx0-28, 15);
        });
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 세 영역의 교집합 → 하드·소프트 스킬 → 미래의 두 역할', true);
      E.big('데이터 사이언스 — 기술과 사람이 만나는 곳', '데이터 사이언스는 데이터 처리와 관련된 <b>IT 영역</b>, 수학·머신러닝 같은 <b>분석 영역</b>, 그리고 커뮤니케이션·프레젠테이션 같은 <b>비즈니스 컨설팅 영역</b>이 겹치는 자리입니다 — 세 원을 실제 좌표로 그리고 격자로 셈해 보면 세 영역이 함께 겹치는 부분의 넓이가 '+TRIPLE_AREA33+'px²로 계산됩니다(전체 대비 일부러 좁게 설계했습니다 — "모두를 다 잘하는 사람"은 원래 드뭅니다). 데이터 사이언티스트에게 필요한 능력을 세어 보면 통계·머신러닝·프로그래밍 같은 <b>하드 스킬</b> '+HARD33.length+'개와, 통찰력 있는 분석·설득력 있는 전달·협력 같은 <b>소프트 스킬</b> '+SOFT33.length+'개로 정확히 절반씩입니다 — 하드 스킬은 훌륭한 데이터 사이언티스트가 갖춰야 할 능력의 절반에 불과하며, 나머지 절반이 소프트 스킬이라는 뜻입니다. 미래에는 <b>모든 것의 데이터화</b>가 진행되며 데이터에서 가치를 찾는 <b>데이터 사이언티스트</b>와, 그 힘이 부당한 피해로 이어지지 않도록 감시하는 <b>알고리즈미스트</b>라는 두 역할이 함께 중요해질 것으로 전망됩니다 — 가치를 만드는 사람과 그 가치의 위험을 통제하는 사람이 짝을 이루는 구조입니다.'); }
  }

  ];

  function wrapTextCenter(ctx, text, cx, y, maxW, lh){
    var chars=text.split(''), line='', ty=y, lines=[];
    for(var i=0;i<chars.length;i++){
      var test=line+chars[i];
      if(ctx.measureText(test).width>maxW && line){ lines.push(line); line=chars[i]; }
      else line=test;
    }
    if(line) lines.push(line);
    lines.forEach(function(l,li){ ctx.fillText(l, cx, ty+li*lh); });
  }

  if(window.Engine) window.Engine.addScenes(scenes);
})();
