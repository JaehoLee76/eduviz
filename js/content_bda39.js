/* 빅데이터 분석 제39장 — 무엇을 어떻게 그릴 것인가 (정의·프로세스·목적별 방법·시각 표현 원칙·빅데이터 과제)
   동작(behavior)만. 텍스트=content/bda39.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 화면의 모든 수(각도·픽셀 길이·과장 배율·탐색 항목 수·상관계수·겹침 비율·격자 집계값 등)는
   아래 고정 데이터로부터 이 파일 로드 시 또는 draw 시점에 실제 계산(하드코딩 금지). 난수는 고정 시드
   LCG만 사용(39.5의 점 좌표), Math.random·Date.now 금지. */
(function(){
  var ROSE='#ff7ab8', GRN='#7ee0b0', BLU='#7ab8ff', GLD='#ffd27a', DIM='#9b99a3', RED='#f0888a', TXT='#eadfe8', PUR='#c79dff', ORG='#ffb27a';
  var COLS5=[BLU,ORG,GRN,PUR,ROSE];

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
  function mean(a){ return a.reduce(function(s,v){return s+v;},0)/a.length; }
  function variance(a){ var m=mean(a); return a.reduce(function(s,v){return s+(v-m)*(v-m);},0)/a.length; }
  function stddev(a){ return Math.sqrt(variance(a)); }
  function corr(a,b){ var ma=mean(a),mb=mean(b),n=a.length,sxy=0,sxx=0,syy=0;
    for(var i=0;i<n;i++){ sxy+=(a[i]-ma)*(b[i]-mb); sxx+=(a[i]-ma)*(a[i]-ma); syy+=(b[i]-mb)*(b[i]-mb); }
    return sxy/Math.sqrt(sxx*syy); }
  function heatColor(t){
    t=Math.max(0,Math.min(1,t));
    var lo=[46,28,58], hi=[255,122,184];
    var r=Math.round(lo[0]+(hi[0]-lo[0])*t), g=Math.round(lo[1]+(hi[1]-lo[1])*t), b=Math.round(lo[2]+(hi[2]-lo[2])*t);
    return 'rgb('+r+','+g+','+b+')';
  }

  // ══════════ 39.1 데이터: 5개 항목 점유율(원그래프 vs 막대그래프) ══════════
  var CVALS=[28,24,22,15,11], CLABS=['가전','의류','식품','도서','기타'];
  var CSUM=CVALS.reduce(function(s,v){return s+v;},0);
  var CANG=CVALS.map(function(v){return v/CSUM*360;});
  var CPAIR=(function(){ var best=null;
    for(var i=0;i<CVALS.length;i++) for(var j=i+1;j<CVALS.length;j++){ var d=Math.abs(CVALS[i]-CVALS[j]); if(!best||d<best.d) best={i:i,j:j,d:d}; }
    return best; })();
  var CANGDIFF=Math.abs(CANG[CPAIR.i]-CANG[CPAIR.j]);
  var CBARMAXPX=170, CPXUNIT=CBARMAXPX/Math.max.apply(null,CVALS);
  var CLENDIFF=CPXUNIT*CPAIR.d;

  // ══════════ 39.2 데이터: 왜곡된 축(두 지점 매출) ══════════
  var AXA=42, AXB=45;

  // ══════════ 39.3 데이터: 전주의적 속성(6×5 격자, 30항목) ══════════
  var GCOLS=6, GROWS=5, GN=GCOLS*GROWS;
  var COLOR_TARGET=16, SHAPE_TARGET=25;

  // ══════════ 39.4 데이터: 5개 지역 다지표(목적별 시각화 5분류) ══════════
  var REG=['서울','부산','대구','광주','대전'];
  var R_SALES=[82,65,48,37,44];      // 매출(억원)
  var R_CUST=[120,95,70,55,60];      // 고객수(천명)
  var R_GROWTH=[12.5,8.2,-3.1,5.4,2.0]; // 성장률(%)
  var R_RETURN=[3.2,4.5,6.8,2.9,5.1];   // 반품률(%)
  var R_COORD=[[5.5,8.6],[7.8,2.0],[7.0,3.6],[4.0,2.5],[5.3,5.0]]; // 간이 좌표(0~10)
  var R_TOTAL=R_SALES.reduce(function(s,v){return s+v;},0);
  var R_SHARE=R_SALES.map(function(v){return v/R_TOTAL*100;});
  var R_CORR=corr(R_CUST,R_SALES);
  var R_SLOPE=R_CORR*(stddev(R_SALES)/stddev(R_CUST));
  var R_INTERCEPT=mean(R_SALES)-R_SLOPE*mean(R_CUST);
  var MTOT=[20,22,21,23,25,24,26,29,31,30,33,36]; // 전사 12개월 총매출(억원)
  var MON12=['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
  var MGROWTH=(MTOT[11]-MTOT[0])/MTOT[0];
  var R_METRICS=[R_SALES,R_CUST,R_GROWTH,R_RETURN];
  var R_MCOLS=['매출','고객수','성장률','반품률'];
  var R_MNORM=R_METRICS.map(function(col){
    var mn=Math.min.apply(null,col), mx=Math.max.apply(null,col);
    return col.map(function(v){ return mx>mn?(v-mn)/(mx-mn):0.5; });
  });

  // ══════════ 39.5 데이터: 과밀 실험용 점 800개(3개 밀집 지역, 고정 시드) ══════════
  var CLU=[{cx:3,cy:3.4,n:300,r:3.4,seed:501},{cx:7.4,cy:3.2,n:300,r:3.1,seed:502},{cx:5.1,cy:7.6,n:200,r:2.9,seed:503}];
  var OPX=[], OPY=[];
  (function(){
    CLU.forEach(function(g){
      var rng=LCG(g.seed);
      for(var i=0;i<g.n;i++){
        var ang=rng()*2*Math.PI, rad=Math.sqrt(rng())*g.r;
        OPX.push(Math.max(0.2,Math.min(9.8,g.cx+Math.cos(ang)*rad)));
        OPY.push(Math.max(0.2,Math.min(9.8,g.cy+Math.sin(ang)*rad)));
      }
    });
  })();
  var ONMAX=OPX.length; // 800
  var OW=380, OH=190, ODMAX=10; // 실험용 화면 매핑(px)
  function opx(v){ return v/ODMAX*OW; }
  function opy(v){ return v/ODMAX*OH; }
  function occlusionRatio(n, thresh){
    var xs=[], ys=[];
    for(var i=0;i<n;i++){ xs.push(opx(OPX[i])); ys.push(opy(OPY[i])); }
    var cnt=0;
    for(i=0;i<n;i++){ var hit=false;
      for(var j=0;j<n;j++){ if(i===j) continue; var dx=xs[i]-xs[j], dy=ys[i]-ys[j]; if(dx*dx+dy*dy<thresh*thresh){ hit=true; break; } }
      if(hit) cnt++;
    }
    return cnt/n;
  }
  function binCounts(n, cols, rows){
    var cw=OW/cols, ch=OH/rows, grid=new Array(cols*rows).fill(0), maxc=0;
    for(var i=0;i<n;i++){
      var cx=Math.min(cols-1,Math.floor(opx(OPX[i])/cw)), cy=Math.min(rows-1,Math.floor(opy(OPY[i])/ch));
      var k=cy*cols+cx; grid[k]++; if(grid[k]>maxc) maxc=grid[k];
    }
    var used=grid.filter(function(v){return v>0;}).length;
    return {grid:grid, maxc:maxc, used:used, total:cols*rows};
  }

  var scenes = [

  // ══════════ 1. 원과 막대 — 판독 정확도 ══════════
  { id:'bda39_01',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code0=[
        {t:"labels=['가전','의류','식품','도서','기타']", dim:true},
        {t:"plt.pie(vals, labels=labels, autopct='%.0f%%')", hl:'plt.pie'}
      ];
      var code1=[{t:'plt.bar(labels, vals)', hl:'plt.bar'}];
      var code2=[
        {t:'angle_diff = abs(a[i]-a[j])/100*360', hl:'angle_diff'},
        {t:'len_diff = px_per_unit*abs(v[i]-v[j])', hl:'len_diff'}
      ];
      var code=(s.step===0)?code0:(s.step===1?code1:code2);
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'pie_vs_bar.py', code.length-1);
      var caps=['같은 다섯 항목 점유율을 원그래프로 봅니다 — 「의류」와 「식품」, 어느 쪽이 큰지 바로 보이나요?',
                '같은 값을 막대그래프로 봅니다 — 이번엔 어떤가요?',
                '두 항목의 차이를 실제로 재보면: 각도로는 이만큼, 길이로는 이만큼입니다'];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step], W*0.04, codeBot+20);

      var rx0=W*0.50, rx1=W*0.965;
      if(s.step===0 || s.step===2){
        var pcx=s.step===2?rx0+95:(rx0+rx1)/2-10, pcy=s.step===2?110:126, pr=s.step===2?68:88;
        var curAng=-Math.PI/2;
        CVALS.forEach(function(v,i){
          var sliceAng=v/CSUM*2*Math.PI;
          ctx.beginPath(); ctx.moveTo(pcx,pcy); ctx.arc(pcx,pcy,pr,curAng,curAng+sliceAng); ctx.closePath();
          ctx.fillStyle=COLS5[i]; ctx.fill();
          if(i===CPAIR.i||i===CPAIR.j){ ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.stroke(); }
          var midAng=curAng+sliceAng/2;
          var lx=pcx+Math.cos(midAng)*(pr*0.62), ly=pcy+Math.sin(midAng)*(pr*0.62);
          ctx.fillStyle='#221830'; ctx.font='11px sans-serif'; ctx.textAlign='center';
          ctx.fillText(CVALS[i]+'%', lx, ly+4);
          curAng+=sliceAng;
        });
        if(s.step===0){
          ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
          var ly0=pcy+pr+30;
          var lx0=rx0;
          CLABS.forEach(function(l,i){ var xx=lx0+i*72; ctx.fillStyle=COLS5[i]; ctx.beginPath(); ctx.arc(xx,ly0,4,0,7); ctx.fill(); ctx.fillStyle=TXT; ctx.fillText(l, xx+8, ly0+4); });
        }
      }
      if(s.step===1 || s.step===2){
        var bx0=s.step===2?rx0+195:rx0+10, bTop=s.step===2?42:36, bBot=s.step===2?200:222;
        var bw=(s.step===2?(rx1-bx0-10)/5*0.55:(rx1-bx0-10)/5*0.6);
        var gap=(s.step===2?(rx1-bx0-10)/5:(rx1-bx0-10)/5);
        CVALS.forEach(function(v,i){
          var xk=bx0+i*gap+(gap-bw)/2;
          var hh=(v/Math.max.apply(null,CVALS))*(bBot-bTop-16);
          ctx.fillStyle=COLS5[i]; ctx.fillRect(xk, bBot-hh, bw, hh);
          if(i===CPAIR.i||i===CPAIR.j){ ctx.strokeStyle='#fff'; ctx.lineWidth=1.6; ctx.strokeRect(xk, bBot-hh, bw, hh); }
          ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
          ctx.fillText(CLABS[i], xk+bw/2, bBot+14);
          ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT;
          ctx.fillText(v+'%', xk+bw/2, bBot-hh-6);
        });
      }
      if(s.step===2){
        ctx.font='12px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
        ctx.fillStyle=GLD; ctx.fillText('각도 차이 = '+CANGDIFF.toFixed(1)+'°', rx0, 240);
        ctx.fillStyle=GRN; ctx.fillText('길이 차이 = '+CLENDIFF.toFixed(0)+'px', rx0, 260);
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText(CLABS[CPAIR.i]+'('+CVALS[CPAIR.i]+'%) vs '+CLABS[CPAIR.j]+'('+CVALS[CPAIR.j]+'%) 두 항목 기준', rx0, 280);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 원그래프 → 막대그래프 → 실제 차이 계산', true);
      E.big('원과 막대 — 판독 정확도', '같은 다섯 항목 점유율('+CVALS.join('%, ')+'%)을 원그래프와 막대그래프로 각각 실제로 그려 비교합니다. 가장 가까운 두 항목은 '+CLABS[CPAIR.i]+'('+CVALS[CPAIR.i]+'%)과 '+CLABS[CPAIR.j]+'('+CVALS[CPAIR.j]+'%)로 차이는 '+CPAIR.d+'%포인트뿐입니다. 이 차이를 원그래프의 <b>각도</b>로 실제 계산하면 '+CANGDIFF.toFixed(1)+'도, 막대그래프의 <b>길이</b>로 계산하면 '+CLENDIFF.toFixed(0)+'픽셀입니다. 사람의 눈은 두 부채꼴의 각도(또는 넓이)를 비교하는 일보다, 두 막대의 끝 높이를 비교하는 일을 훨씬 더 정확하게 해냅니다 — 그래서 정보 시각화 연구에서는 위치·길이를 이용한 표현이 각도·넓이·색상을 이용한 표현보다 일반적으로 더 정확하게 읽힌다고 봅니다. 다섯 항목이 뚜렷이 차이 나면 원그래프도 무난하지만, 이번처럼 값이 서로 가까울 때는 막대그래프가 더 정직하게 차이를 전달합니다.'); }
  },

  // ══════════ 2. 왜곡된 축 ══════════
  { id:'bda39_02',
    enter:function(E){ var self=this; self.s={base:0};
      E.controls('<div class="ctrl"><label>y축 시작값(기준선)</label><input type="range" id="b392b" min="0" max="41" step="1" value="0"><output id="b392bo">0</output></div>');
      E.bind('#b392b','input',function(e){ self.s.base=+e.target.value; document.getElementById('b392bo').textContent=self.s.base; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'fig, ax = plt.subplots()', dim:true},
        {t:"ax.bar(['A지점','B지점'], [42, 45])", hl:'ax.bar'},
        {t:'ax.set_ylim(bottom='+s.base+')', hl:'set_ylim'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'axis_baseline.py', 2);
      var apparent=(AXB-s.base)/(AXA-s.base);
      var real=AXB/AXA;
      var over=apparent/real;
      ctx.textAlign='left'; ctx.font='12px ui-monospace,Menlo,monospace';
      ctx.fillStyle=TXT; ctx.fillText('실제 값: A='+AXA+'  B='+AXB+'  (실제 비율 '+real.toFixed(3)+', '+((real-1)*100).toFixed(1)+'% 차이)', W*0.04, codeBot+22);
      ctx.fillStyle=(s.base>0)?RED:GRN;
      ctx.fillText('화면상 비율 = '+apparent.toFixed(3)+'  →  '+((apparent-1)*100).toFixed(0)+'%나 커 보임', W*0.04, codeBot+44);
      ctx.fillStyle=GLD;
      ctx.fillText('과장 배율 = 화면상비율÷실제비율 = '+over.toFixed(2)+'배', W*0.04, codeBot+66);

      var rx0=W*0.50, rx1=W*0.90;
      function panel(px0, py0, pw, ph, base, title, col){
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
        ctx.fillText(title, px0, py0-8);
        ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.moveTo(px0,py0+ph); ctx.lineTo(px0+pw,py0+ph); ctx.stroke();
        var maxV=AXB, rangeV=Math.max(1,maxV-base);
        var bw=pw*0.28, gap=pw*0.14;
        [{lab:'A지점',v:AXA},{lab:'B지점',v:AXB}].forEach(function(b,i){
          var hh=Math.max(2,((b.v-base)/rangeV)*ph);
          var xk=px0+gap+i*(bw+gap);
          ctx.fillStyle=col[i]; ctx.fillRect(xk, py0+ph-hh, bw, hh);
          ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='center';
          ctx.fillText(b.lab, xk+bw/2, py0+ph+14);
          ctx.font='11px ui-monospace,Menlo,monospace';
          ctx.fillText(''+b.v, xk+bw/2, py0+ph-hh-6);
        });
      }
      panel(rx0, 40, rx1-rx0, 70, 0, '정직한 기준선(0)', [BLU,GRN]);
      panel(rx0, 170, rx1-rx0, 70, s.base, '지금 기준선('+s.base+')', [BLU,RED]);

      E.tapHint(W/2, H*0.95, '슬라이더로 y축 시작값을 바꿔 과장 배율이 실제로 변하는 것을 보세요', true);
      E.big('왜곡된 축', 'A지점 매출 '+AXA+'과 B지점 매출 '+AXB+'는 실제로는 '+((real-1)*100).toFixed(1)+'%밖에 차이 나지 않습니다. 그런데 그래프의 y축 시작값(기준선)을 0이 아닌 값으로 올리면, 막대의 <b>보이는 높이 비율</b>이 실제 값 비율과 달라집니다 — 기준선을 '+s.base+'로 두면 화면상 비율이 '+apparent.toFixed(3)+'이 되어 실제로 <b>'+over.toFixed(2)+'배</b>나 부풀려진 차이로 보입니다. 이것은 두 값 자체를 조작한 것이 아니라(막대 위 숫자는 그대로 42와 45입니다), 오직 <b>기준선의 위치</b>만 바꿔서 같은 숫자를 다른 인상으로 전달하는 방법입니다. 기준선을 슬라이더로 최대치(41, 두 값에 거의 붙는 지점)까지 올리면 별것 아닌 차이가 몇 배로 과장되어 보이는 것을 실제로 확인할 수 있습니다. 막대그래프의 y축은 반드시 0에서 시작해야 하는 이유가 여기 있습니다 — 선그래프처럼 「변화의 흐름」이 목적이라면 예외적으로 허용되기도 하지만, 「크기 비교」가 목적인 막대그래프에서 기준선을 옮기는 것은 대표적인 시각적 왜곡입니다.'); }
  },

  // ══════════ 3. 눈에 먼저 들어오는 것 — 전주의적 속성 ══════════
  { id:'bda39_03',
    enter:function(E){ var self=this; self.s={mode:0, scanIdx:-1};
      E.controls('<div class="ctrl"><label>탐색 방식</label><input type="range" id="b393m" min="0" max="1" step="1" value="0"><output id="b393mo">색으로 구분</output></div>');
      E.bind('#b393m','input',function(e){ self.s.mode=+e.target.value; self.s.scanIdx=-1; document.getElementById('b393mo').textContent=(self.s.mode===0?'색으로 구분':'모양으로 구분'); });
      E.setOn([]); },
    tap:function(E){ var s=this.s;
      if(s.mode===0){ s.scanIdx=COLOR_TARGET; }
      else { if(s.scanIdx<SHAPE_TARGET) s.scanIdx++; }
      E.blip(400,0.06); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code0=[{t:'# 색으로 구분 — 팝아웃(전주의적 처리)', dim:true}, {t:'found = True   # 훑어볼 필요 없음', hl:'found = True'}];
      var code1=[{t:'for i, cell in enumerate(grid):', dim:true}, {t:'    if cell.shape != base_shape:', hl:'!= base_shape'}, {t:'        found_at = i; break   # 순차 탐색', hl:'break'}];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, s.mode===0?code0:code1, 'preattentive.py', s.mode===0?1:2);
      var cap=(s.mode===0)?'다른 색 하나를 찾아보세요 — 화면 탭 = 확인':'다른 모양 하나를 찾아보세요 — 화면 탭마다 한 칸씩 순서대로 확인합니다';
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(cap, W*0.04, codeBot+20);
      var found = (s.mode===0)?(s.scanIdx===COLOR_TARGET):(s.scanIdx===SHAPE_TARGET);
      var count = (s.mode===0)?(s.scanIdx>=0?1:0):(s.scanIdx+1);
      ctx.font='12px ui-monospace,Menlo,monospace';
      ctx.fillStyle=found?GRN:TXT;
      ctx.fillText('지금까지 확인한 항목 수 = '+Math.max(0,count)+' / '+GN, W*0.04, codeBot+44);
      if(found){ ctx.fillStyle=GLD; ctx.fillText((s.mode===0?'1회':count+'회')+' 만에 찾았습니다', W*0.04, codeBot+66); }

      var gx0=W*0.50, gy0=54, cw=60, ch=36;
      for(var idx=0; idx<GN; idx++){
        var row=Math.floor(idx/GCOLS), col=idx%GCOLS;
        var cx=gx0+col*cw+cw/2, cy=gy0+row*ch+ch/2;
        var isTarget=(s.mode===0)?(idx===COLOR_TARGET):(idx===SHAPE_TARGET);
        var revealed=(s.mode===0)?(s.scanIdx>=0):(idx<=s.scanIdx);
        var fillCol = (s.mode===0 && isTarget) ? RED : BLU;
        ctx.globalAlpha=(s.mode===1 && idx>s.scanIdx)?0.55:1;
        if(s.mode===1 && isTarget){
          ctx.fillStyle=fillCol; ctx.fillRect(cx-9,cy-9,18,18);
        } else {
          ctx.fillStyle=fillCol; ctx.beginPath(); ctx.arc(cx,cy,9,0,7); ctx.fill();
        }
        if(s.mode===1 && idx<=s.scanIdx && idx!==SHAPE_TARGET){
          ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(cx,cy,12,0,7); ctx.stroke();
        }
        ctx.globalAlpha=1;
        if(s.mode===1 && idx===s.scanIdx && !found){
          ctx.strokeStyle=GLD; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(cx,cy,13,0,7); ctx.stroke();
        }
      }
      var gybot=gy0+GROWS*ch;
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
      ctx.fillText('색 구분: 파란 원 사이에 빨간 원 1개', gx0, gybot+22);
      ctx.fillText('모양 구분: 파란 원 사이에 파란 사각형 1개(같은 색)', gx0, gybot+40);

      E.tapHint(W/2, H*0.95, '슬라이더=탐색 방식 전환, 화면 탭=확인(모양 구분은 한 칸씩 진행)', true);
      E.big('눈에 먼저 들어오는 것 — 전주의적 속성', '같은 30개 항목 중 딱 하나 다른 것을 찾는 과제를 색과 모양 두 가지로 실제로 비교합니다. <b>색으로 구분</b>할 때(파란 원 29개 속 빨간 원 1개)는 눈이 그림 전체를 인식하는 순간 저절로 튀어 보입니다 — 실제로 몇 번째 항목을 순서대로 훑었는지 셀 필요가 없는 <b>1회</b>입니다. 이런 즉각적 지각을 <b>전주의적(preattentive) 속성</b>이라 부르며, 색상·크기·기울기 같은 몇몇 시각 속성만 여기 해당합니다. <b>모양으로 구분</b>할 때(파란 원 29개 속 파란 사각형 1개, 색은 같음)는 그렇지 않습니다 — 한 칸씩 순서대로 확인해야 하는 <b>순차 탐색</b>이 되어, 이번 배치에서는 목표가 '+(SHAPE_TARGET+1)+'번째에 있어 실제로 '+(SHAPE_TARGET+1)+'번(전체 '+GN+'개 중)을 확인해야 찾아집니다. 항목 수가 30개가 아니라 3만 개라면 이 차이는 「즉시」와 「한참」의 차이로 벌어집니다 — 빅데이터 시각화에서 <b>강조하고 싶은 것을 색으로, 나머지를 회색으로</b> 처리하는 관행은 이 원리를 그대로 이용한 것입니다.'); }
  },

  // ══════════ 4. 목적별 시각화 5분류 — 한 데이터를 다섯 방식으로 ══════════
  { id:'bda39_04',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; E.blip(360+this.s.step*50,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var titles=['시간 시각화','분포 시각화','관계 시각화','비교 시각화','공간 시각화'];
      var fnames=['time_viz','dist_viz','relation_viz','compare_viz','space_viz'];
      var codes=[
        [{t:'plt.plot(months, monthly_total)', hl:'plt.plot'}],
        [{t:'plt.pie(sales_by_region, labels=regions)', hl:'plt.pie'}],
        [{t:'plt.scatter(customers, sales)', hl:'plt.scatter'}, {t:'np.corrcoef(customers, sales)', hl:'corrcoef'}],
        [{t:'plt.imshow(metrics_norm, cmap="magma")', hl:'plt.imshow'}],
        [{t:'plt.scatter(x, y, s=sales_area)  # 좌표+크기', hl:'s=sales_area'}]
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, codes[s.step], fnames[s.step]+'.py', codes[s.step].length-1);
      var caps=['시간 흐름 — 12개월 총매출 추이. 「언제 늘었는가」는 보이지만 지역별 몫은 안 보입니다',
                '분포 — 지역별 매출 점유율. 「누가 많은가」는 보이지만 시간 흐름은 안 보입니다',
                '관계 — 고객수와 매출의 관계. 상관은 보이지만 시간·개별 지역 성장률은 안 보입니다',
                '비교 — 5지역×4지표를 한 화면에서 색으로 견줍니다',
                '공간 — 지역 위치+매출 크기. 지리적 분포는 보이지만 정확한 수치 비교는 어렵습니다'];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step], W*0.04, codeBot+18);
      ctx.font='600 12px sans-serif'; ctx.fillStyle=ROSE;
      ctx.fillText('['+(s.step+1)+'/5] '+titles[s.step], W*0.04, codeBot+40);

      var rx0=W*0.50, rx1=W*0.965, rTop=28, rBot=222;
      if(s.step===0){
        function sx(m){ return rx0+(m/11)*(rx1-rx0); }
        var maxV=Math.max.apply(null,MTOT), minV=Math.min.apply(null,MTOT);
        function sy(v){ return rBot-((v-minV)/(maxV-minV))*(rBot-rTop); }
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(rx0,rBot); ctx.lineTo(rx1,rBot); ctx.stroke();
        ctx.strokeStyle=ROSE; ctx.lineWidth=2; ctx.beginPath();
        MTOT.forEach(function(v,i){ var x=sx(i),y=sy(v); if(i===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); });
        ctx.stroke();
        MTOT.forEach(function(v,i){ ctx.fillStyle=ROSE; ctx.beginPath(); ctx.arc(sx(i),sy(v),2.6,0,7); ctx.fill(); });
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
        MON12.forEach(function(m,i){ if(i%2===0) ctx.fillText(m, sx(i), rBot+16); });
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD; ctx.textAlign='left';
        ctx.fillText('1월 '+MTOT[0]+' → 12월 '+MTOT[11]+' (누적 성장률 '+(MGROWTH*100).toFixed(0)+'%)', rx0, rTop-8);
      } else if(s.step===1){
        var pcx=rx0+120, pcy=118, pr=80, ir=40;
        var curAng=-Math.PI/2;
        R_SALES.forEach(function(v,i){
          var a=v/R_TOTAL*2*Math.PI;
          ctx.beginPath(); ctx.moveTo(pcx,pcy); ctx.arc(pcx,pcy,pr,curAng,curAng+a); ctx.closePath();
          ctx.fillStyle=COLS5[i]; ctx.fill();
          var mid=curAng+a/2, lx=pcx+Math.cos(mid)*(pr*0.72), ly=pcy+Math.sin(mid)*(pr*0.72);
          ctx.fillStyle='#221830'; ctx.font='11px sans-serif'; ctx.textAlign='center';
          ctx.fillText(R_SHARE[i].toFixed(0)+'%', lx, ly+4);
          curAng+=a;
        });
        ctx.fillStyle='#171018'; ctx.beginPath(); ctx.arc(pcx,pcy,ir,0,7); ctx.fill();
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        REG.forEach(function(r,i){ var ly=44+i*20; ctx.fillStyle=COLS5[i]; ctx.beginPath(); ctx.arc(pcx+150,ly,4,0,7); ctx.fill(); ctx.fillStyle=TXT; ctx.fillText(r+' '+R_SALES[i]+'억', pcx+160, ly+4); });
      } else if(s.step===2){
        var xmax=Math.max.apply(null,R_CUST)*1.15, ymax=Math.max.apply(null,R_SALES)*1.15;
        function sx2(v){ return rx0+(v/xmax)*(rx1-rx0-20); }
        function sy2(v){ return rBot-(v/ymax)*(rBot-rTop); }
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(rx0,rBot); ctx.lineTo(rx1-20,rBot); ctx.moveTo(rx0,rTop); ctx.lineTo(rx0,rBot); ctx.stroke();
        ctx.strokeStyle=GLD; ctx.setLineDash([3,3]); ctx.beginPath();
        ctx.moveTo(sx2(0), sy2(R_INTERCEPT)); ctx.lineTo(sx2(xmax), sy2(R_INTERCEPT+R_SLOPE*xmax));
        ctx.stroke(); ctx.setLineDash([]);
        R_CUST.forEach(function(v,i){
          ctx.fillStyle=COLS5[i]; ctx.beginPath(); ctx.arc(sx2(v),sy2(R_SALES[i]),5,0,7); ctx.fill();
          ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
          ctx.fillText(REG[i], sx2(v)+8, sy2(R_SALES[i])+4);
        });
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
        ctx.fillText('고객수(천명)', (rx0+rx1-20)/2, rBot+18);
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=GRN; ctx.textAlign='left';
        ctx.fillText('상관계수 = '+R_CORR.toFixed(3), rx0, rTop-8);
      } else if(s.step===3){
        var mcx0=rx0, mcw=(rx1-rx0)/4, mrh=32, mty0=40;
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
        R_MCOLS.forEach(function(c,ci){ ctx.fillText(c, mcx0+ci*mcw+mcw/2, mty0-6); });
        REG.forEach(function(r,ri){
          ctx.textAlign='left'; ctx.fillStyle=TXT; ctx.font='11px sans-serif';
          ctx.fillText(r, mcx0-38, mty0+ri*mrh+mrh/2+4);
          R_MCOLS.forEach(function(c,ci){
            var t=R_MNORM[ci][ri];
            ctx.fillStyle=heatColor(t);
            ctx.fillRect(mcx0+ci*mcw+2, mty0+ri*mrh+2, mcw-4, mrh-4);
            ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=(t>0.55)?'#221830':'#e8e0ef'; ctx.textAlign='center';
            var raw=R_METRICS[ci][ri];
            ctx.fillText((ci<2?raw.toFixed(0):raw.toFixed(1)), mcx0+ci*mcw+mcw/2, mty0+ri*mrh+mrh/2+4);
          });
        });
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
        ctx.fillText('색=열마다 정규화(0~1) · 숫자=실제 값', mcx0-38, mty0+5*mrh+22);
      } else {
        var mdmax=10;
        function mxp(v){ return rx0+30+ (v/mdmax)*(rx1-rx0-70); }
        function myp(v){ return rTop+10 + (1-v/mdmax)*(rBot-rTop-20); }
        var maxS=Math.max.apply(null,R_SALES);
        REG.forEach(function(r,i){
          var cx=mxp(R_COORD[i][0]), cy=myp(R_COORD[i][1]);
          var rad=7+22*Math.sqrt(R_SALES[i]/maxS);
          ctx.fillStyle=COLS5[i]; ctx.globalAlpha=0.82; ctx.beginPath(); ctx.arc(cx,cy,rad,0,7); ctx.fill(); ctx.globalAlpha=1;
          ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='center';
          ctx.fillText(r, cx, cy-rad-6);
          ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=DIM;
          ctx.fillText(R_SALES[i]+'억', cx, cy+4);
        });
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
        ctx.fillText('원의 넓이 ∝ 매출(간이 좌표, 실제 지도 아님)', rx0, rTop-8);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 시간 → 분포 → 관계 → 비교 → 공간', true);
      E.big('목적별 시각화 5분류 — 한 데이터를 다섯 방식으로', '서울·부산·대구·광주·대전 5개 지역의 매출·고객수·성장률·반품률, 그리고 전사 12개월 매출 추이라는 <b>같은 자료</b>를 목적이 다른 다섯 방식으로 실제로 그려 비교합니다. <b>시간 시각화</b>(선그래프)는 1월 '+MTOT[0]+'에서 12월 '+MTOT[11]+'로 누적 '+(MGROWTH*100).toFixed(0)+'% 늘어난 흐름을 보여주지만 지역별 몫은 감춥니다. <b>분포 시각화</b>(도넛)는 매출 총액 '+R_TOTAL+'억 중 서울이 '+R_SHARE[0].toFixed(0)+'%로 가장 큰 몫을 보여주지만 시간 흐름은 없습니다. <b>관계 시각화</b>(산점도)는 고객수와 매출의 상관계수를 실제로 계산해 '+R_CORR.toFixed(3)+'이라는 강한 관계를 보여주지만 성장률·반품률은 등장하지 않습니다. <b>비교 시각화</b>(히트맵)는 5지역×4지표를 한 화면에 색으로 비교하게 해주지만 정밀한 값은 색의 진하기로만 어림해야 합니다. <b>공간 시각화</b>(도트맵)는 지역의 지리적 위치와 매출 크기(원의 넓이가 매출에 비례)를 동시에 보여주지만 정확한 수치 비교에는 약합니다. 다섯 방식 중 무엇이 「정답」이 아니라, <b>무엇을 묻고 싶은가에 따라 골라야 하는 도구</b>라는 것이 이 장면의 결론입니다.'); }
  },

  // ══════════ 5. 빅데이터의 과제 — 과밀과 상호작용 ══════════
  { id:'bda39_05',
    enter:function(E){ var self=this; self.s={n:200, mode:0};
      E.controls('<div class="ctrl"><label>표시 데이터 개수 N</label><input type="range" id="b395n" min="80" max="800" step="20" value="200"><output id="b395no">200</output></div>');
      E.bind('#b395n','input',function(e){ self.s.n=+e.target.value; document.getElementById('b395no').textContent=self.s.n; });
      E.setOn([]); },
    tap:function(E){ this.s.mode=1-this.s.mode; E.blip(380,0.06); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code0=[{t:'plt.scatter(x[:n], y[:n], s=4, alpha=0.6)', hl:'plt.scatter'}];
      var code1=[{t:'H,_,_ = np.histogram2d(x[:n], y[:n], bins=(20,10))', hl:'histogram2d'}, {t:'plt.imshow(H.T, origin="lower")', hl:'plt.imshow'}];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, s.mode===0?code0:code1, 'overplot.py', 0);
      var occ=occlusionRatio(s.n, 4.5);
      ctx.textAlign='left'; ctx.font='12px ui-monospace,Menlo,monospace';
      ctx.fillStyle=(occ>0.4)?RED:GRN; ctx.fillText('N='+s.n+'일 때 겹침 비율 = '+(occ*100).toFixed(1)+'%', W*0.04, codeBot+22);
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('(다른 점과 화면상 4.5px 이내로 붙어 서로 가리는 점의 비율)', W*0.04, codeBot+42);
      var bc=binCounts(s.n,20,10);
      ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD;
      ctx.fillText('격자 집계: 칸당 최대 '+bc.maxc+'개, 채워진 칸 '+bc.used+'/'+bc.total, W*0.04, codeBot+64);
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('화면 탭 = 산점도 ↔ 격자 집계(히트맵) 전환', W*0.04, codeBot+86);

      var rx0=W*0.50, rTop=28;
      ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.strokeRect(rx0, rTop, OW, OH);
      if(s.mode===0){
        ctx.fillStyle=ROSE;
        for(var i=0;i<s.n;i++){ ctx.globalAlpha=0.6; ctx.beginPath(); ctx.arc(rx0+opx(OPX[i]), rTop+opy(OPY[i]), 2.2, 0, 7); ctx.fill(); }
        ctx.globalAlpha=1;
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText('원시 산점도(점 '+s.n+'개)', rx0, rTop-8);
      } else {
        var cols=20, rows=10, cw=OW/cols, ch=OH/rows;
        for(var cy=0; cy<rows; cy++){ for(var cx=0; cx<cols; cx++){
          var v=bc.grid[cy*cols+cx];
          if(v===0) continue;
          ctx.fillStyle=heatColor(v/Math.max(1,bc.maxc));
          ctx.fillRect(rx0+cx*cw, rTop+cy*ch, cw, ch);
        } }
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText('격자 집계(20×10칸, 색=칸당 개수)', rx0, rTop-8);
      }
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
      ctx.fillText('세 지역에 몰린 점 '+ONMAX+'개 중 앞 N개를 표시(고정 시드)', rx0, rTop+OH+20);

      E.tapHint(W/2, H*0.95, '슬라이더=표시 개수, 화면 탭=산점도/격자 집계 전환', true);
      E.big('빅데이터의 과제 — 과밀과 상호작용', '점 '+ONMAX+'개(세 지역에 몰린 자료, 고정 배치) 중 앞 N개만 표시하도록 슬라이더로 조절합니다. N='+s.n+'일 때 다른 점과 화면상 4.5픽셀 이내로 붙어 서로 가리는 점의 비율을 실제로 계산하면 '+(occ*100).toFixed(1)+'%입니다 — N을 늘릴수록 이 겹침 비율이 실제로 커져서, 점이 아주 많아지면 산점도는 그냥 하나의 뭉뚱그려진 얼룩이 되어버립니다(<b>과밀·overplotting</b>). 이것이 빅데이터 시각화의 근본적인 과제입니다: 데이터가 적을 때 잘 통하던 표현 방식이, 양이 늘어나는 순간 그대로는 통하지 않습니다. 해결책 중 하나가 <b>격자 집계</b>입니다 — 화면을 20×10칸으로 나누고 각 칸에 몇 개의 점이 들어왔는지 실제로 세어(지금은 칸당 최대 '+bc.maxc+'개, 채워진 칸 '+bc.used+'/'+bc.total+'개) 색으로 표현하면, 점이 아무리 많아도 「어디에 몰려 있는가」라는 구조는 여전히 읽힙니다. 여기에 확대·필터 같은 <b>상호작용</b>(이번 장면의 슬라이더·전환 탭이 그 축소판입니다)까지 더해지면, 사용자가 스스로 필요한 부분만 골라 과밀을 피해갈 수 있습니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
