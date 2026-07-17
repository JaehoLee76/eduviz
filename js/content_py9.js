/* 파이썬 제9장 — Matplotlib 시각화: plt.plot 선 그래프 · plt.scatter 산점도 · plt.hist 히스토그램 · plt.subplots 격자 · 데이터 탐색 흐름
   동작(behavior)만. 텍스트=content/py9.json. 엔진 js/engine.js 공유. 색: Python=골드(#ffd343).
   골든룰: 화면의 모든 곡선·점·막대·빈도·통계는 JS에서 실제 데이터로 계산해 그림(베껴 박지 않음).
   "데이터는 먼저 그려봐야 보인다" — 좌측=복사하면 도는 진짜 matplotlib 코드, 우측=그 코드가 그릴 그림을 EduViz 캔버스로 실제 렌더. */
(function(){
  var PYL='#ffd343', PYB='#6cb6e8', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', PNK='#f4a0c0', DIM='#9b99a3', RED='#f0888a';

  // 등폭 코드 패널: lines=[{t:'코드', hl:'tok'}|문자열]. hl 토큰만 골드 강조. actLine=현재 실행 줄(줄커서).
  function codePanel(E, x, y, w, lines, title, actLine){
    var ctx=E.ctx, lh=21, pad=14, top=y, n=lines.length, ht=n*lh+pad*2+(title?26:0);
    ctx.fillStyle='rgba(255,255,255,0.035)'; ctx.strokeStyle='rgba(255,211,67,0.30)'; ctx.lineWidth=1;
    roundRect(ctx,x,top,w,ht,10); ctx.fill(); ctx.stroke();
    var cy=top+pad+ (title?26:0);
    if(title){ ctx.fillStyle=PYL; ctx.font='600 12px sans-serif'; ctx.textAlign='left'; ctx.fillText(title, x+pad, top+pad+12); }
    ctx.font='13px ui-monospace,Menlo,Consolas,monospace'; ctx.textAlign='left';
    for(var i=0;i<n;i++){
      var L=lines[i], t=(typeof L==='string')?L:L.t, hl=(typeof L==='object')?L.hl:null;
      var ty=cy+i*lh+11;
      if(actLine!=null && i===actLine){ ctx.fillStyle='rgba(255,211,67,0.16)'; ctx.fillRect(x+4, cy+i*lh+1, w-8, lh-2); ctx.fillStyle=PYL; ctx.fillRect(x+4, cy+i*lh+1, 3, lh-2); }
      ctx.font='13px ui-monospace,Menlo,Consolas,monospace';
      if(hl && t.indexOf(hl)>=0){
        var a=t.split(hl), pre=a[0], post=a.slice(1).join(hl);
        ctx.fillStyle=DIM; ctx.fillText(pre, x+pad, ty);
        var wpre=ctx.measureText(pre).width;
        ctx.fillStyle=PYL; ctx.fillText(hl, x+pad+wpre, ty);
        var whl=ctx.measureText(hl).width;
        ctx.fillStyle=DIM; ctx.fillText(post, x+pad+wpre+whl, ty);
      } else {
        ctx.fillStyle=(L.dim?DIM:'#e7ecda'); ctx.fillText(t, x+pad, ty);
      }
    }
    return top+ht;
  }
  function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  // 결정적 의사난수(난수 없음) — 화면에 그리는 모든 데이터의 씨앗
  function rnd(i){ return ((Math.sin(i*12.9898+4.13)*43758.5453)%1+1)%1; }            // [0,1)
  // 가우스 근사: 두 균등의 평균-0.5 합(중심극한 흉내), 결정적
  function gauss(i){ return (rnd(i*2+1)+rnd(i*2+2)+rnd(i*2+3)+rnd(i*2+4)-2); }       // 평균0, 대략 표준편차~0.6

  // 좌표축(틀) — 라벨 달린 빈 플롯 영역
  function axes(E, ox,oy,pw,pv, opt){ var ctx=E.ctx; opt=opt||{};
    ctx.strokeStyle='rgba(255,255,255,0.16)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(ox,oy); ctx.lineTo(ox+pw,oy); ctx.moveTo(ox,oy); ctx.lineTo(ox,oy-pv); ctx.stroke();
    // 옅은 격자
    if(opt.grid){ ctx.strokeStyle='rgba(255,255,255,0.05)';
      for(var g=1;g<=4;g++){ var gy=oy-pv*g/4; ctx.beginPath(); ctx.moveTo(ox,gy); ctx.lineTo(ox+pw,gy); ctx.stroke();
        var gx=ox+pw*g/4; ctx.beginPath(); ctx.moveTo(gx,oy); ctx.lineTo(gx,oy-pv); ctx.stroke(); } }
    if(opt.xlabel){ ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText(opt.xlabel, ox+pw/2, oy+22); }
    if(opt.ylabel){ ctx.save(); ctx.translate(ox-26, oy-pv/2); ctx.rotate(-Math.PI/2); ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText(opt.ylabel, 0, 0); ctx.restore(); }
    if(opt.title){ ctx.fillStyle='#e7ecda'; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.fillText(opt.title, ox+pw/2, oy-pv-10); }
  }

  var scenes = [

  // ══════════ 1. 선 그래프 plt.plot — 실제 곡선 렌더 ══════════
  { id:'py9_01',
    enter:function(E){ var self=this; this.s={amp:1.0};
      E.controls('<div class="ctrl"><label>사인 진폭 amplitude</label><input type="range" id="am" min="0.2" max="2" step="0.1" value="1"><output id="amo">1.0</output></div>');
      E.bind('#am','input',function(e){ self.s.amp=+e.target.value; document.getElementById('amo').textContent=(+e.target.value).toFixed(1); E.blip(360,0.05); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'import numpy as np', hl:'numpy'},
        {t:'import matplotlib.pyplot as plt', hl:'matplotlib.pyplot'},
        {t:'', dim:true},
        {t:'x = np.linspace(0, 2*np.pi, 100)', hl:'np.linspace'},
        {t:'plt.plot(x, '+s.amp.toFixed(1)+'*np.sin(x), label="sin")', hl:'plt.plot'},
        {t:'plt.plot(x, 0.3*x, "--", label="line")', hl:'plt.plot'},
        {t:"plt.title('두 곡선'); plt.legend()", hl:'plt.title'},
        {t:"plt.xlabel('x'); plt.ylabel('y')", hl:'plt.xlabel'},
        {t:'plt.show()', hl:'plt.show'}
      ];
      codePanel(E, W*0.04, H*0.13, W*0.44, code, 'lineplot.py');

      var ox=W*0.58, oy=H*0.74, pw=W*0.36, pv=H*0.50, cy=oy-pv*0.5; // y=0 선
      axes(E, ox, oy, pw, pv, {grid:true, xlabel:'x', ylabel:'y', title:'두 곡선'});
      function X(t){ return ox + t/(2*Math.PI)*pw; }   // t: 0..2π
      function Y(y){ return cy - y/2.2*pv*0.5; }        // y: -2.2..2.2 화면 매핑
      // y=0 기준선
      ctx.strokeStyle='rgba(255,255,255,0.12)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(ox,cy); ctx.lineTo(ox+pw,cy); ctx.stroke();
      // 사인 곡선(실계산)
      ctx.strokeStyle=PYL; ctx.lineWidth=2.6; ctx.beginPath();
      for(var t=0;t<=2*Math.PI+1e-6;t+=2*Math.PI/100){ var y=s.amp*Math.sin(t); if(t===0)ctx.moveTo(X(t),Y(y)); else ctx.lineTo(X(t),Y(y)); } ctx.stroke();
      // 직선 0.3x(실계산)
      ctx.strokeStyle=PYB; ctx.lineWidth=2.2; ctx.setLineDash([7,5]); ctx.beginPath();
      for(t=0;t<=2*Math.PI+1e-6;t+=2*Math.PI/100){ var y2=0.3*t; if(t===0)ctx.moveTo(X(t),Y(y2)); else ctx.lineTo(X(t),Y(y2)); } ctx.stroke(); ctx.setLineDash([]);
      // 범례
      var lx=ox+pw-110, ly=oy-pv+6;
      ctx.fillStyle='rgba(0,0,0,0.25)'; roundRect(ctx,lx-8,ly-6,116,44,6); ctx.fill();
      ctx.strokeStyle=PYL; ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(lx,ly+6); ctx.lineTo(lx+24,ly+6); ctx.stroke();
      ctx.fillStyle='#e7ecda'; ctx.font='12px ui-monospace,Menlo,monospace'; ctx.textAlign='left'; ctx.fillText('sin', lx+30, ly+10);
      ctx.strokeStyle=PYB; ctx.setLineDash([6,4]); ctx.beginPath(); ctx.moveTo(lx,ly+24); ctx.lineTo(lx+24,ly+24); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='#e7ecda'; ctx.fillText('line', lx+30, ly+28);

      // 한 점 실측 라벨
      var tpk=Math.PI/2, ypk=s.amp*Math.sin(tpk);
      ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(X(tpk),Y(ypk),4.5,0,7); ctx.fill();
      ctx.fillStyle=GRN; ctx.font='13px ui-monospace,Menlo,monospace'; ctx.textAlign='center'; ctx.fillText('최대 '+ypk.toFixed(2), X(tpk), Y(ypk)-10);

      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText('plt.plot(x, y)는 (x,y) 점들을 순서대로 선으로 잇습니다.', W*0.06, H*0.90);
      ctx.fillStyle=PYL; ctx.fillText('진폭을 바꾸면 사인 곡선 높이가 '+s.amp.toFixed(1)+'배로 — 그림이 즉시 따라옵니다.', W*0.06, H*0.90+20);

      E.tapHint(W/2, H*0.96, '슬라이더로 진폭을 바꿔 보세요 — 곡선이 실시간으로 그려집니다', true);
      E.big('선 그래프 plt.plot — 변화를 한 줄로', '데이터 분석의 첫 손짓은 “일단 그려 보자”입니다. plt.plot(x, y)는 (x,y) 좌표들을 차례로 선으로 이어, 시간에 따른 변화·함수의 모양을 한눈에 보여줍니다. title·xlabel·ylabel·legend로 “무엇을 보는 그림인지”를 항상 적어 주세요 — 라벨 없는 그래프는 절반만 그린 그림입니다.'); }
  },

  // ══════════ 2. 산점도 plt.scatter — 결정적 2D 점(색=클래스) ══════════
  { id:'py9_02',
    enter:function(E){ var self=this; this.s={n:60};
      E.controls('<div class="ctrl"><label>표본 개수 n</label><input type="range" id="nn" min="20" max="120" step="10" value="60"><output id="nno">60</output></div>');
      E.bind('#nn','input',function(e){ self.s.n=+e.target.value; document.getElementById('nno').textContent=e.target.value; E.blip(350,0.05); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, N=s.n;
      var code=[
        {t:'import matplotlib.pyplot as plt', hl:'matplotlib.pyplot'},
        {t:'#  키(x) · 몸무게(y) · 그룹(색)', dim:true},
        {t:'plt.scatter(x, y, c=group,', hl:'plt.scatter'},
        {t:"            cmap='coolwarm', s=30)", dim:true},
        {t:"plt.xlabel('키'); plt.ylabel('몸무게')", hl:'plt.xlabel'},
        {t:'plt.show()', hl:'plt.show'},
        {t:'', dim:true},
        {t:'#  점 구름의 모양 = 상관·군집을', dim:true},
        {t:'#  한눈에 — 표로는 안 보입니다', dim:true}
      ];
      codePanel(E, W*0.04, H*0.13, W*0.44, code, 'scatter.py');

      var ox=W*0.58, oy=H*0.78, pw=W*0.36, pv=H*0.56;
      axes(E, ox, oy, pw, pv, {grid:true, xlabel:'키 (x)', ylabel:'몸무게 (y)', title:'키–몸무게 산점도'});
      function X(x){ return ox + x*pw; } function Y(y){ return oy - y*pv; }

      // 결정적 2D 데이터: 두 클래스(작은 그룹/큰 그룹) — 양의 상관 + 그룹별 평균 차이
      var sumx=0,sumy=0,sumxy=0,sumxx=0,sumyy=0, cnt=[0,0];
      for(var i=0;i<N;i++){
        var g=(rnd(i*5+9)<0.5)?0:1;                          // 그룹
        var base=0.30+g*0.34;                                // 그룹 중심 이동
        var x=base + (rnd(i*3+1)-0.5)*0.30;                  // 키
        var y=0.18 + 0.85*(x-0.30) + (rnd(i*3+2)-0.5)*0.22;  // 양의 상관 + 잡음
        x=Math.max(0.02,Math.min(0.98,x)); y=Math.max(0.02,Math.min(0.98,y));
        ctx.fillStyle=(g?PNK:PYB); ctx.globalAlpha=0.85; ctx.beginPath(); ctx.arc(X(x),Y(y),4.5,0,7); ctx.fill(); ctx.globalAlpha=1;
        sumx+=x; sumy+=y; sumxy+=x*y; sumxx+=x*x; sumyy+=y*y; cnt[g]++;
      }
      // 피어슨 상관(실측)
      var mx=sumx/N, my=sumy/N;
      var cov=sumxy/N-mx*my, sx=Math.sqrt(sumxx/N-mx*mx), sy=Math.sqrt(sumyy/N-my*my);
      var corr=(sx*sy>1e-9)?cov/(sx*sy):0;
      // 추세선(최소제곱) — 실측
      var slope=(sumxx/N-mx*mx>1e-9)?(sumxy/N-mx*my)/(sumxx/N-mx*mx):0, intc=my-slope*mx;
      ctx.strokeStyle=GRN; ctx.lineWidth=2; ctx.setLineDash([6,5]); ctx.beginPath();
      var y0=intc, y1=slope+intc; ctx.moveTo(X(0),Y(Math.max(0,Math.min(1,y0)))); ctx.lineTo(X(1),Y(Math.max(0,Math.min(1,y1)))); ctx.stroke(); ctx.setLineDash([]);

      // 범례
      var lx=ox+10, ly=oy-pv+8;
      ctx.fillStyle=PYB; ctx.beginPath(); ctx.arc(lx,ly,5,0,7); ctx.fill(); ctx.fillStyle='#e7ecda'; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('그룹 A ('+cnt[0]+')', lx+12, ly+4);
      ctx.fillStyle=PNK; ctx.beginPath(); ctx.arc(lx,ly+20,5,0,7); ctx.fill(); ctx.fillStyle='#e7ecda'; ctx.fillText('그룹 B ('+cnt[1]+')', lx+12, ly+24);

      ctx.fillStyle=GRN; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
      ctx.fillText('상관계수 r = '+corr.toFixed(3)+'  '+(corr>0.5?'(강한 양의 상관)':(corr>0.2?'(약한 양의 상관)':'(거의 무관)')), W*0.06, H*0.90);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
      ctx.fillText('초록 점선 = 최소제곱 추세선. 점 구름이 우상향이면 r>0.', W*0.06, H*0.90+20);

      E.tapHint(W/2, H*0.96, '슬라이더로 표본 수를 바꿔 보세요 — 점 구름과 상관 r이 함께 바뀝니다', true);
      E.big('산점도 plt.scatter — 관계를 점으로', '두 변수가 어떻게 함께 움직이는지는 표로 노려봐도 안 보이지만, plt.scatter로 점을 흩뿌리면 즉시 드러납니다 — 우상향이면 양의 상관, 색을 그룹으로 칠하면 군집까지 한눈에. “먼저 그려 보라”는 격언이 가장 빛나는 그림이죠.'); }
  },

  // ══════════ 3. 히스토그램 plt.hist — 구간별 빈도 실계산 ══════════
  { id:'py9_03',
    enter:function(E){ var self=this; this.s={bins:8};
      E.controls('<div class="ctrl"><label>구간 수 bins</label><input type="range" id="bn" min="4" max="20" step="1" value="8"><output id="bno">8</output></div>');
      E.bind('#bn','input',function(e){ self.s.bins=+e.target.value; document.getElementById('bno').textContent=e.target.value; E.blip(340,0.05); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, B=s.bins;
      var code=[
        {t:'import matplotlib.pyplot as plt', hl:'matplotlib.pyplot'},
        {t:'#  data = 키 200명 (대략 정규분포)', dim:true},
        {t:'plt.hist(data, bins='+B+',', hl:'plt.hist'},
        {t:"         edgecolor='black')", dim:true},
        {t:"plt.xlabel('값'); plt.ylabel('빈도')", hl:'plt.xlabel'},
        {t:'plt.show()', hl:'plt.show'},
        {t:'', dim:true},
        {t:'#  각 막대 높이 = 그 구간에', dim:true},
        {t:'#  들어온 데이터 개수(빈도)', dim:true}
      ];
      codePanel(E, W*0.04, H*0.13, W*0.44, code, 'histogram.py');

      // 결정적 데이터 200개(가우스 근사) → [0,1) 범위로 정규화 후 구간별 빈도 실계산
      var M=200, data=[], lo=1e9, hi=-1e9;
      for(var i=0;i<M;i++){ var v=0.5+gauss(i+31)*0.16; data.push(v); if(v<lo)lo=v; if(v>hi)hi=v; }
      var span=(hi-lo)||1, counts=new Array(B).fill(0);
      for(i=0;i<M;i++){ var bi=Math.floor((data[i]-lo)/span*B); if(bi>=B)bi=B-1; if(bi<0)bi=0; counts[bi]++; }
      var maxc=1; for(i=0;i<B;i++) if(counts[i]>maxc)maxc=counts[i];
      // 실측 통계
      var sum=0; for(i=0;i<M;i++) sum+=data[i]; var mean=sum/M;
      var vsum=0; for(i=0;i<M;i++) vsum+=(data[i]-mean)*(data[i]-mean); var std=Math.sqrt(vsum/M);

      var ox=W*0.56, oy=H*0.76, pw=W*0.38, pv=H*0.54;
      axes(E, ox, oy, pw, pv, {xlabel:'값', ylabel:'빈도', title:'분포 (bins='+B+')'});
      var bw=pw/B;
      for(i=0;i<B;i++){ var h=counts[i]/maxc*pv*0.92, bx=ox+i*bw;
        ctx.fillStyle='rgba(255,211,67,0.55)'; ctx.fillRect(bx+1, oy-h, bw-2, h);
        ctx.strokeStyle='rgba(20,20,20,0.7)'; ctx.lineWidth=1; ctx.strokeRect(bx+1, oy-h, bw-2, h);
        if(counts[i]>0){ ctx.fillStyle='#e7ecda'; ctx.font='12.5px ui-monospace,Menlo,monospace'; ctx.textAlign='center'; ctx.fillText(counts[i], bx+bw/2, oy-h-4); }
      }
      // 평균선(실측)
      var mxpx=ox+(mean-lo)/span*pw;
      ctx.strokeStyle=GRN; ctx.lineWidth=2; ctx.setLineDash([5,4]); ctx.beginPath(); ctx.moveTo(mxpx,oy); ctx.lineTo(mxpx,oy-pv); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=GRN; ctx.font='13px ui-monospace,Menlo,monospace'; ctx.textAlign='center'; ctx.fillText('평균', mxpx, oy-pv-2);

      ctx.fillStyle=PYL; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
      ctx.fillText('n=200   평균 '+mean.toFixed(3)+'   표준편차 '+std.toFixed(3), W*0.06, H*0.90);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
      ctx.fillText('막대 높이 = 그 구간에 든 데이터 개수. bins를 바꾸면 같은 데이터도 다르게 보입니다.', W*0.06, H*0.90+20);

      E.tapHint(W/2, H*0.96, '슬라이더로 구간 수를 바꿔 보세요 — 빈도가 매번 다시 계산됩니다', true);
      E.big('히스토그램 plt.hist — 분포의 모양', '한 변수의 값들이 “어디에 몰려 있나”를 보려면 히스토그램입니다 — 값의 범위를 여러 구간(bin)으로 쪼개고, 각 구간에 들어온 개수를 막대 높이로 세웁니다. 가운데가 봉긋하면 정규분포, 한쪽으로 치우치면 왜도가 있는 것. 화면의 빈도·평균·표준편차는 200개 데이터에서 실제로 센 값입니다. bins 수가 그림의 인상을 좌우하니 몇 개로 바꿔 보세요.'); }
  },

  // ══════════ 4. 서브플롯 plt.subplots — 2×2 격자 동시 ══════════
  { id:'py9_04',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(340+this.s.step*60,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'import matplotlib.pyplot as plt', hl:'matplotlib.pyplot'},
        {t:'fig, ax = plt.subplots(2, 2,', hl:'plt.subplots'},
        {t:'                  figsize=(8,6))', dim:true},
        {t:'ax[0,0].plot(x, np.sin(x))', hl:'.plot'},
        {t:'ax[0,1].scatter(px, py)', hl:'.scatter'},
        {t:'ax[1,0].hist(data, bins=8)', hl:'.hist'},
        {t:'ax[1,1].bar(names, vals)', hl:'.bar'},
        {t:'plt.tight_layout()', hl:'tight_layout'},
        {t:'plt.show()', hl:'plt.show'}
      ];
      // 줄커서: step 0~3 = 각 칸을 그리는 줄(ax[..].plot/scatter/hist/bar = code 인덱스 3~6)
      var act=3+s.step;
      codePanel(E, W*0.04, H*0.13, W*0.44, code, 'subplots.py', act);

      // 2×2 격자 영역
      var gx=W*0.54, gy=H*0.14, gw=W*0.42, gh=H*0.72, pad=14;
      var cellW=(gw-pad)/2, cellH=(gh-pad)/2;
      var titles=['sin 곡선','산점도','히스토그램','막대그래프'];
      for(var q=0;q<4;q++){
        var r=q>>1, c=q&1, x=gx+c*(cellW+pad), y=gy+r*(cellH+pad);
        var on=(q<=s.step);
        ctx.globalAlpha=on?1:0.22;
        ctx.fillStyle='rgba(255,255,255,0.035)'; ctx.strokeStyle=(q===s.step?PYL:'rgba(255,255,255,0.18)'); ctx.lineWidth=(q===s.step?2:1);
        roundRect(ctx,x,y,cellW,cellH,8); ctx.fill(); ctx.stroke();
        ctx.fillStyle=(q===s.step?PYL:DIM); ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.fillText('ax['+r+','+c+'] '+titles[q], x+8, y+15);
        var ix=x+12, iy=y+cellH-12, iw=cellW-24, iv=cellH-32;
        if(!on){ ctx.globalAlpha=1; continue; }
        if(q===0){ // sin
          ctx.strokeStyle=PYL; ctx.lineWidth=2; ctx.beginPath();
          for(var t=0;t<=1.0001;t+=0.02){ var yy=0.5+0.42*Math.sin(t*2*Math.PI); var py=iy-yy*iv; if(t===0)ctx.moveTo(ix+t*iw,py); else ctx.lineTo(ix+t*iw,py); } ctx.stroke();
        } else if(q===1){ // scatter
          for(var i=0;i<26;i++){ var px=rnd(i*7+2), pyv=0.2+0.6*px+(rnd(i*7+3)-0.5)*0.3; pyv=Math.max(0.04,Math.min(0.96,pyv));
            ctx.fillStyle=PYB; ctx.globalAlpha=0.8; ctx.beginPath(); ctx.arc(ix+px*iw, iy-pyv*iv, 3,0,7); ctx.fill(); } ctx.globalAlpha=1;
        } else if(q===2){ // hist
          var B=8, counts=new Array(B).fill(0);
          for(i=0;i<120;i++){ var v=0.5+gauss(i+5)*0.18; var bi=Math.floor(v*B); if(bi<0)bi=0; if(bi>=B)bi=B-1; counts[bi]++; }
          var mc=1; for(i=0;i<B;i++) if(counts[i]>mc)mc=counts[i];
          var bw=iw/B; for(i=0;i<B;i++){ var hh=counts[i]/mc*iv; ctx.fillStyle='rgba(255,211,67,0.5)'; ctx.fillRect(ix+i*bw+1, iy-hh, bw-2, hh); }
        } else { // bar
          var vals=[0.4,0.85,0.6,0.3], names=['A','B','C','D'], bw2=iw/4;
          for(i=0;i<4;i++){ var hh2=vals[i]*iv; ctx.fillStyle=[PYB,PNK,GRN,GLD][i]; ctx.fillRect(ix+i*bw2+3, iy-hh2, bw2-6, hh2);
            ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText(names[i], ix+i*bw2+bw2/2, iy+11); }
        }
        ctx.globalAlpha=1;
      }
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText('fig, ax = plt.subplots(2,2) → ax[행,열]로 각 칸에 따로 그립니다.', W*0.06, H*0.92);
      ctx.fillStyle=PYL; ctx.fillText('탭하면 칸이 하나씩 채워집니다 ('+(s.step+1)+'/4) — 여러 관점을 한 화면에.', W*0.06, H*0.92+20);

      E.tapHint(W/2, H*0.96, '화면 탭 = 다음 칸 채우기 (sin → 산점 → 히스토 → 막대)', true);
      E.big('서브플롯 plt.subplots — 여러 그림을 한 화면에', '데이터는 한 각도로만 보면 속습니다. plt.subplots(2,2)는 하나의 그림(figure)을 격자로 나눠, 각 칸(ax[행,열])에 서로 다른 그래프를 동시에 그립니다 — 선·산점·히스토·막대를 나란히 두면 같은 데이터의 여러 얼굴이 한눈에 비교되죠. tight_layout()이 칸들이 겹치지 않게 간격을 자동 정리합니다.'); }
  },

  // ══════════ 5. 데이터 탐색 흐름 — 시각화로 패턴·이상치 발견 ══════════
  { id:'py9_05',
    enter:function(E){ var self=this; this.s={outlier:1.0};
      E.controls('<div class="ctrl"><label>이상치 크기 (배수)</label><input type="range" id="ol" min="1" max="6" step="0.5" value="1"><output id="olo">1.0</output></div>');
      E.bind('#ol','input',function(e){ self.s.outlier=+e.target.value; document.getElementById('olo').textContent=(+e.target.value).toFixed(1); E.blip(360,0.05); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, k=s.outlier;
      var code=[
        {t:'import matplotlib.pyplot as plt', hl:'matplotlib.pyplot'},
        {t:'#  ① 먼저 그려 본다(EDA)', dim:true},
        {t:'plt.scatter(x, y)', hl:'plt.scatter'},
        {t:'#  ② 점 구름에서 이상치를 ‘눈으로’', dim:true},
        {t:'#     발견 — 평균이 끌려간다', dim:true},
        {t:'mean = y.mean()      # 이상치에 민감', hl:'.mean'},
        {t:'med  = np.median(y)  # 이상치에 둔감', hl:'np.median'},
        {t:'#  평균 vs 중앙값 차이 = 경고등', dim:true}
      ];
      codePanel(E, W*0.04, H*0.13, W*0.44, code, 'eda_outlier.py');

      var ox=W*0.58, oy=H*0.76, pw=W*0.36, pv=H*0.56;
      axes(E, ox, oy, pw, pv, {grid:true, xlabel:'x', ylabel:'y', title:'탐색: 이상치 찾기'});
      function X(x){ return ox + x*pw; } function Y(y){ return oy - y*pv; }

      // 정상 점 22개(결정적, 0.4 근처) + 마지막 1개 이상치(슬라이더로 위로 끌어올림)
      var N=22, ys=[];
      for(var i=0;i<N;i++){ var x=0.05+i/(N-1)*0.7, y=0.35+(rnd(i*4+7)-0.5)*0.16; y=Math.max(0.05,Math.min(0.6,y)); ys.push(y);
        ctx.fillStyle=PYB; ctx.globalAlpha=0.85; ctx.beginPath(); ctx.arc(X(x),Y(y),4.5,0,7); ctx.fill(); ctx.globalAlpha=1; }
      // 이상치 한 점
      var oxp=0.86, oyp=Math.min(0.97, 0.40*k);          // k배로 위로
      ys.push(oyp);
      ctx.fillStyle=RED; ctx.beginPath(); ctx.arc(X(oxp),Y(oyp),7,0,7); ctx.fill();
      ctx.strokeStyle=RED; ctx.lineWidth=1.6; ctx.beginPath(); ctx.arc(X(oxp),Y(oyp),11,0,7); ctx.stroke();
      if(k>1.2){ ctx.fillStyle=RED; ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.fillText('이상치!', X(oxp), Y(oyp)-16); }

      // 평균·중앙값 실측
      var n=ys.length, sum=0; for(i=0;i<n;i++) sum+=ys[i]; var mean=sum/n;
      var srt=ys.slice().sort(function(a,b){return a-b;}); var med=(n%2)?srt[(n-1)/2]:(srt[n/2-1]+srt[n/2])/2;
      // 평균선(빨강 끌림)·중앙값선(초록 안정)
      ctx.strokeStyle=GLD; ctx.lineWidth=2; ctx.setLineDash([6,4]); ctx.beginPath(); ctx.moveTo(ox,Y(mean)); ctx.lineTo(ox+pw,Y(mean)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=GLD; ctx.font='13px ui-monospace,Menlo,monospace'; ctx.textAlign='left'; ctx.fillText('평균 '+mean.toFixed(3), ox+pw-86, Y(mean)-4);
      ctx.strokeStyle=GRN; ctx.lineWidth=2; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(ox,Y(med)); ctx.lineTo(ox+pw,Y(med)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=GRN; ctx.fillText('중앙값 '+med.toFixed(3), ox+pw-92, Y(med)+14);

      var gap=Math.abs(mean-med);
      ctx.fillStyle=(gap>0.05?RED:GRN); ctx.font='600 14px sans-serif'; ctx.textAlign='left';
      ctx.fillText('평균−중앙값 차이 = '+gap.toFixed(3)+'  '+(gap>0.05?'⚠ 이상치가 평균을 끌어당김!':'(분포 대칭 — 안정)'), W*0.06, H*0.90);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
      ctx.fillText('그래서 분석은 “먼저 그려 본다” — 표의 평균만 봤다면 이 이상치를 놓쳤을 겁니다.', W*0.06, H*0.90+20);

      E.tapHint(W/2, H*0.96, '슬라이더로 이상치를 키워 보세요 — 평균은 끌려가고 중앙값은 버팁니다', true);
      E.big('데이터 탐색 — 왜 먼저 그려 보는가', '숫자 요약(평균 하나)만 믿으면 속습니다. 똑같은 평균을 가진 데이터도 그려 보면 전혀 다른 모양일 수 있죠(앤스컴의 4분할이 유명합니다). 그래서 분석가는 모델을 돌리기 전에 plt로 “먼저 그려” 분포·관계·이상치를 눈으로 확인합니다 — 이것이 탐색적 데이터 분석(EDA)입니다. 이상치 하나가 평균을 끌어당기는데도 중앙값은 버티는 걸 보세요. 데이터는 먼저 그려봐야 보입니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
