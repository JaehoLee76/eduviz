/* 인공지능 제5장 — 핵심 ML 알고리즘: k-NN · 결정트리(지니) · SVM 최대마진 · k-means · PCA
   동작(behavior)만. 텍스트=content/ai5.json. 엔진 js/engine.js 공유. 색: AI=시안.
   골든룰: 거리·다수결·지니불순도·정보이득·마진폭·군집중심·공분산 고유벡터·투영을 전부 draw()에서 실제 계산.
   난수 표시·하드코딩 금지 — 결정적 데이터(noise 해시)만 사용. */
(function(){
  var CYA='#3dd6dc', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', PNK='#f4a0c0', DIM='#9b99a3', RED='#f0888a';

  // 결정적 잡음(난수 없음): 인덱스 i → [-0.5,0.5)
  function noise(i){ return ((Math.sin(i*12.9898)*43758.5453)%1+1)%1 - 0.5; }

  // ─── 1) k-NN용 결정적 2D 점(두 클래스). x,y ∈ [0,1] ───
  var KNN=(function(){ var a=[];
    // 클래스 A: 좌하단 군집, 클래스 B: 우상단 군집
    for(var i=0;i<11;i++){ a.push([0.28+noise(i*1.7)*0.34, 0.32+noise(i*2.9+5)*0.34, 0]); }
    for(i=0;i<11;i++){ a.push([0.70+noise(i*1.3+11)*0.34, 0.68+noise(i*2.1+17)*0.34, 1]); }
    return a; })();

  // ─── 2) 결정트리용 결정적 1D 점(라벨 0/1). x ∈ [0,1] ───
  var DT=(function(){ var a=[];
    for(var i=0;i<22;i++){ var x=0.04+i/21*0.92;
      // 진짜 경계 ≈ 0.55 부근(잡음으로 약간 섞임)
      var lab=(x + noise(i*3.7)*0.22 > 0.55)?1:0; a.push([x,lab]); }
    return a; })();
  function gini(cnt0,cnt1){ var n=cnt0+cnt1; if(n===0)return 0; var p0=cnt0/n,p1=cnt1/n; return 1-p0*p0-p1*p1; }

  // ─── 3) SVM용 두 클래스 선형분리 가능 점 ───
  var SVM=(function(){ var a=[];
    // 클래스 -1: 좌상, +1: 우하 (대각 경계 분리)
    for(var i=0;i<9;i++){ a.push([0.18+noise(i*1.9)*0.22, 0.62+noise(i*2.7+3)*0.26, -1]); }
    for(i=0;i<9;i++){ a.push([0.66+noise(i*1.4+9)*0.22, 0.30+noise(i*2.3+13)*0.26, 1]); }
    return a; })();

  // ─── 4) k-means용 점 구름(세 덩어리, 라벨 없음) ───
  var KM=(function(){ var a=[];
    var cen=[[0.26,0.30],[0.74,0.28],[0.52,0.74]];
    for(var c=0;c<3;c++) for(var i=0;i<9;i++){
      a.push([cen[c][0]+noise(c*40+i*1.7)*0.20, cen[c][1]+noise(c*40+i*2.3+7)*0.20]); }
    return a; })();
  // 결정적 초기 중심(데이터 안 점 고정 선택)
  var KM_INIT=[[0.20,0.55],[0.60,0.40],[0.50,0.62]];

  // ─── 5) PCA용 2D 점 구름(강한 상관 → 뚜렷한 주축) ───
  var PCA=(function(){ var a=[];
    for(var i=0;i<24;i++){ var t=noise(i*1.3)*2; // 주축 방향 좌표
      var ortho=noise(i*2.7+11)*0.5; // 직교 방향(작은 분산)
      // 기준 주축 방향 ≈ (cos35°, sin35°), 평균은 (0.5,0.5)
      var ux=0.819, uy=0.574, vx=-0.574, vy=0.819;
      a.push([0.5 + t*0.16*ux + ortho*0.16*vx, 0.5 + t*0.16*uy + ortho*0.16*vy]); }
    return a; })();

  function axes(E,ox,oy,pw,pv){ var ctx=E.ctx; ctx.strokeStyle='rgba(61,214,220,0.22)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(ox,oy); ctx.lineTo(ox+pw,oy); ctx.moveTo(ox,oy); ctx.lineTo(ox,oy-pv); ctx.stroke(); }

  var scenes = [

  // ══════════ 1. k-NN (지도·게으른 학습): 거리→k최근접→다수결 ══════════
  { id:'ai5_01',
    enter:function(E){ var self=this; this.s={k:3, qx:0.50, qy:0.50};
      E.controls('<div class="ctrl"><label>이웃 수 k</label><input type="range" id="kk" min="1" max="9" step="2" value="3"><output id="kko">3</output>'
        +'<label style="margin-left:14px">질의점 x</label><input type="range" id="qx" min="5" max="95" step="2" value="50"><output id="qxo">0.50</output>'
        +'<label style="margin-left:14px">질의점 y</label><input type="range" id="qy" min="5" max="95" step="2" value="50"><output id="qyo">0.50</output></div>');
      E.bind('#kk','input',function(e){ self.s.k=+e.target.value; document.getElementById('kko').textContent=e.target.value; E.blip(360,0.05); });
      E.bind('#qx','input',function(e){ self.s.qx=+e.target.value/100; document.getElementById('qxo').textContent=self.s.qx.toFixed(2); E.blip(330,0.04); });
      E.bind('#qy','input',function(e){ self.s.qy=+e.target.value/100; document.getElementById('qyo').textContent=self.s.qy.toFixed(2); E.blip(300,0.04); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var ox=W*0.12, oy=H*0.80, pw=W*0.56, pv=H*0.62;
      function SX(x){ return ox+x*pw; } function SY(y){ return oy - y*pv; }
      axes(E,ox,oy,pw,pv);
      // 1) 모든 점까지의 실제 유클리드 거리 계산
      var ds=[]; for(var i=0;i<KNN.length;i++){ var dx=KNN[i][0]-s.qx, dy=KNN[i][1]-s.qy;
        ds.push({i:i, d:Math.sqrt(dx*dx+dy*dy), lab:KNN[i][2]}); }
      ds.sort(function(a,b){ return a.d-b.d; });
      // 2) k개 최근접의 라벨로 다수결
      var nA=0,nB=0; for(i=0;i<s.k;i++){ if(ds[i].lab===0)nA++; else nB++; }
      var pred = nA>nB ? 0 : 1;
      // 가장 먼 이웃 거리(반경원)
      var rk = ds[s.k-1].d;
      // 반경 원
      ctx.strokeStyle='rgba(255,255,255,0.20)'; ctx.lineWidth=1; ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.arc(SX(s.qx),SY(s.qy), rk*Math.min(pw,pv), 0, 7); ctx.stroke(); ctx.setLineDash([]);
      // 이웃 연결선(k개)
      for(i=0;i<s.k;i++){ var p=KNN[ds[i].i];
        ctx.strokeStyle=ds[i].lab?'rgba(122,184,255,0.7)':'rgba(240,136,138,0.7)'; ctx.lineWidth=1.6;
        ctx.beginPath(); ctx.moveTo(SX(s.qx),SY(s.qy)); ctx.lineTo(SX(p[0]),SY(p[1])); ctx.stroke(); }
      // 점 그리기(이웃은 강조 테두리)
      var isNb={}; for(i=0;i<s.k;i++) isNb[ds[i].i]=1;
      for(i=0;i<KNN.length;i++){ var pt=KNN[i];
        ctx.fillStyle=pt[2]?BLU:RED; ctx.beginPath(); ctx.arc(SX(pt[0]),SY(pt[1]),6,0,7); ctx.fill();
        if(isNb[i]){ ctx.strokeStyle=GLD; ctx.lineWidth=2.4; ctx.beginPath(); ctx.arc(SX(pt[0]),SY(pt[1]),9,0,7); ctx.stroke(); } }
      // 질의점
      ctx.fillStyle=pred?BLU:RED; ctx.beginPath(); ctx.arc(SX(s.qx),SY(s.qy),9,0,7); ctx.fill();
      ctx.strokeStyle=GLD; ctx.lineWidth=2.6; ctx.stroke();
      // 패널
      var px=W*0.72, py=H*0.26;
      ctx.fillStyle='#dfeef0'; ctx.font='600 16px sans-serif'; ctx.textAlign='left'; ctx.fillText('새 점 분류 (k='+s.k+')', px, py);
      ctx.fillStyle=RED; ctx.font='14px sans-serif'; ctx.fillText('클래스 A 이웃: '+nA+'개', px, py+30);
      ctx.fillStyle=BLU; ctx.fillText('클래스 B 이웃: '+nB+'개', px, py+52);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText('최근접 거리 '+ds[0].d.toFixed(3)+' · k번째 '+rk.toFixed(3), px, py+78);
      ctx.fillStyle=pred?BLU:RED; ctx.font='600 19px sans-serif'; ctx.fillText('→ 예측: 클래스 '+(pred?'B':'A'), px, py+112);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('다수결 ('+Math.max(nA,nB)+' 대 '+Math.min(nA,nB)+')', px, py+134);
      E.tapHint(W/2, H*0.95, '질의점을 옮기고 k를 바꿔 다수결이 뒤집히는 경계를 찾아보세요', true);
      E.big('k-최근접 이웃 (k-NN) — 가까운 이웃에게 묻는다', '학습이랄 게 없습니다. 새 점이 오면 그냥 가장 가까운 k개 이웃을 실제 거리로 찾아 다수결로 라벨을 정합니다. k가 작으면 잡음에 민감하고, 크면 경계가 뭉툭해지죠 — 그 사이를 직접 움직여 보세요.'); }
  },

  // ══════════ 2. 결정트리 — 임계값 분할 + 지니 불순도 + 정보이득 ══════════
  { id:'ai5_02',
    enter:function(E){ var self=this; this.s={thr:0.50};
      E.controls('<div class="ctrl"><label>분할 임계값 t (x &lt; t 이면 왼쪽)</label><input type="range" id="th" min="5" max="95" step="1" value="50"><output id="tho">0.50</output></div>');
      E.bind('#th','input',function(e){ self.s.thr=+e.target.value/100; document.getElementById('tho').textContent=self.s.thr.toFixed(2); E.blip(340,0.05); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var ox=W*0.10, oy=H*0.56, pw=W*0.62, pv=H*0.18;
      function SX(x){ return ox+x*pw; }
      axes(E,ox,oy,pw,pv);
      // 부모 노드 불순도(전체)
      var P0=0,P1=0; for(var i=0;i<DT.length;i++){ if(DT[i][1]===0)P0++; else P1++; }
      var giniP=gini(P0,P1);
      // 분할: x<t → 왼쪽, x>=t → 오른쪽
      var L0=0,L1=0,R0=0,R1=0;
      for(i=0;i<DT.length;i++){ var left=DT[i][0]<s.thr;
        if(DT[i][1]===0){ if(left)L0++; else R0++; } else { if(left)L1++; else R1++; } }
      var nL=L0+L1, nR=R0+R1, N=DT.length;
      var giniL=gini(L0,L1), giniR=gini(R0,R1);
      var giniAfter=(nL/N)*giniL+(nR/N)*giniR;
      var gain=giniP-giniAfter;
      // 1D 점들(라벨 색), y축은 약간 흩뿌려 보기 좋게(결정적)
      for(i=0;i<DT.length;i++){ var px=SX(DT[i][0]), jit=noise(i*5.1)*pv*0.7, py=oy-pv*0.5+jit;
        ctx.fillStyle=DT[i][1]?BLU:RED; ctx.beginPath(); ctx.arc(px,py,5.5,0,7); ctx.fill(); }
      // 임계 분할선
      ctx.strokeStyle=GLD; ctx.lineWidth=2.4; ctx.setLineDash([6,4]);
      ctx.beginPath(); ctx.moveTo(SX(s.thr),oy+8); ctx.lineTo(SX(s.thr),oy-pv-10); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=GLD; ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.fillText('t='+s.thr.toFixed(2), SX(s.thr), oy-pv-16);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('x < t', ox+4, oy+26); ctx.textAlign='right'; ctx.fillText('x ≥ t', ox+pw, oy+26);
      // 트리 다이어그램
      var tx=W*0.30, ty=H*0.70, lx=W*0.16, rx=W*0.46, by=H*0.88;
      ctx.strokeStyle=DIM; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(tx,ty+14); ctx.lineTo(lx,by-14); ctx.moveTo(tx,ty+14); ctx.lineTo(rx,by-14); ctx.stroke();
      function node(x,y,c0,c1,g,col,lab){ ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.strokeStyle=col; ctx.lineWidth=1.8;
        ctx.beginPath(); ctx.arc(x,y,30,0,7); ctx.fill(); ctx.stroke();
        ctx.fillStyle='#dfeef0'; ctx.font='13px sans-serif'; ctx.textAlign='center';
        ctx.fillText('A:'+c0+' B:'+c1, x, y-2); ctx.fillStyle=col; ctx.font='600 13px sans-serif'; ctx.fillText('G='+g.toFixed(3), x, y+13);
        ctx.fillStyle=col; ctx.font='12px sans-serif'; ctx.fillText(lab, x, y-40); }
      node(tx,ty,P0,P1,giniP,CYA,'부모');
      node(lx,by,L0,L1,giniL,GRN,'왼쪽('+nL+')');
      node(rx,by,R0,R1,giniR,GRN,'오른쪽('+nR+')');
      // 정보이득 패널
      var px2=W*0.66, py2=H*0.66;
      ctx.fillStyle='#dfeef0'; ctx.font='600 15px sans-serif'; ctx.textAlign='left'; ctx.fillText('지니 불순도 · 정보이득', px2, py2);
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.fillText('Gini = 1 − Σ pᵢ²  (0=순수)', px2, py2+24);
      ctx.fillStyle=CYA; ctx.fillText('분할 전  G = '+giniP.toFixed(4), px2, py2+50);
      ctx.fillStyle=GRN; ctx.fillText('분할 후  G = '+giniAfter.toFixed(4), px2, py2+72);
      ctx.fillStyle=DIM; ctx.font='13.5px sans-serif'; ctx.fillText('= ('+nL+'/'+N+')·'+giniL.toFixed(3)+' + ('+nR+'/'+N+')·'+giniR.toFixed(3), px2, py2+90);
      ctx.fillStyle=gain>0.001?GLD:DIM; ctx.font='600 17px sans-serif'; ctx.fillText('정보이득 = '+gain.toFixed(4), px2, py2+122);
      E.tapHint(W/2, H*0.96, '임계값을 옮겨 정보이득(분할 전−후 불순도)이 최대가 되는 곳을 찾으세요', true);
      E.big('결정트리 — 불순도를 가장 많이 줄이는 질문', '트리는 “x가 t보다 작은가?” 같은 예/아니오 질문으로 데이터를 가릅니다. 좋은 질문이란 양쪽이 한 색으로 깔끔해지는 것 — 지니 불순도를 가장 많이 떨어뜨리는(정보이득 최대) 임계값을 계산해 고릅니다.'); }
  },

  // ══════════ 3. SVM — 최대마진 경계, 마진 폭 실측, 서포트벡터 강조 ══════════
  { id:'ai5_03',
    enter:function(E){ var self=this; this.s={ang:-40, b:0.50};
      E.controls('<div class="ctrl"><label>경계 기울기 (°)</label><input type="range" id="ag" min="-80" max="-10" step="1" value="-40"><output id="ago">-40°</output>'
        +'<label style="margin-left:14px">경계 위치 b</label><input type="range" id="bb" min="20" max="80" step="1" value="50"><output id="bbo">0.50</output></div>');
      E.bind('#ag','input',function(e){ self.s.ang=+e.target.value; document.getElementById('ago').textContent=e.target.value+'°'; E.blip(350,0.05); });
      E.bind('#bb','input',function(e){ self.s.b=+e.target.value/100; document.getElementById('bbo').textContent=self.s.b.toFixed(2); E.blip(320,0.05); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var ox=W*0.12, oy=H*0.80, pw=W*0.56, pv=H*0.62;
      function SX(x){ return ox+x*pw; } function SY(y){ return oy - y*pv; }
      axes(E,ox,oy,pw,pv);
      // 경계직선: 법선 n=(cosθ, sinθ), 직선 n·p = c. 위치 b로 c 결정.
      var th=s.ang*Math.PI/180, nx=Math.cos(th+Math.PI/2), ny=Math.sin(th+Math.PI/2);
      // 정규화
      var nl=Math.hypot(nx,ny); nx/=nl; ny/=nl;
      var c = nx*s.b + ny*0.5;  // 점 (b,0.5)를 지나도록
      // 각 점의 부호거리 d = n·p - c (정규화된 n이므로 실제 거리)
      var pos=1e9, neg=1e9, svPos=-1, svNeg=-1;
      for(var i=0;i<SVM.length;i++){ var d=nx*SVM[i][0]+ny*SVM[i][1]-c;
        if(SVM[i][2]>0){ if(Math.abs(d)<pos){ pos=Math.abs(d); svPos=i; } }
        else { if(Math.abs(d)<neg){ neg=Math.abs(d); svNeg=i; } } }
      // 마진 = 양쪽에서 가장 가까운 점까지 거리의 합(경계가 그 사이일 때) — 여기선 min 두개 합
      var margin = pos+neg;
      // 모든 점이 올바른 쪽인지(분리 성공) 확인: +1은 d>0, -1은 d<0
      var sep=true; for(i=0;i<SVM.length;i++){ var d2=nx*SVM[i][0]+ny*SVM[i][1]-c;
        if(SVM[i][2]>0 && d2<0) sep=false; if(SVM[i][2]<0 && d2>0) sep=false; }
      // 경계선 그리기(직선 n·p=c → 두 끝점)
      function lineAt(){ // 직선상의 두 점: 방향 t=(-ny,nx)
        var px0=s.b, py0=0.5; // 경계 위 한 점
        var tx=-ny, ty=nx;
        return [[px0-tx*1.5, py0-ty*1.5],[px0+tx*1.5, py0+ty*1.5]]; }
      var ln=lineAt();
      ctx.strokeStyle=sep?GLD:RED; ctx.lineWidth=2.6;
      ctx.beginPath(); ctx.moveTo(SX(ln[0][0]),SY(ln[0][1])); ctx.lineTo(SX(ln[1][0]),SY(ln[1][1])); ctx.stroke();
      // 마진 경계선(±min거리 평행 이동, 실측 margin/2가 아니라 각 클래스 SV까지)
      ctx.strokeStyle='rgba(255,255,255,0.30)'; ctx.lineWidth=1.3; ctx.setLineDash([5,5]);
      [pos,-neg].forEach(function(off){ ctx.beginPath();
        ctx.moveTo(SX(ln[0][0]+nx*off),SY(ln[0][1]+ny*off)); ctx.lineTo(SX(ln[1][0]+nx*off),SY(ln[1][1]+ny*off)); ctx.stroke(); });
      ctx.setLineDash([]);
      // 점들
      for(i=0;i<SVM.length;i++){ var pt=SVM[i];
        ctx.fillStyle=pt[2]>0?BLU:RED; ctx.beginPath(); ctx.arc(SX(pt[0]),SY(pt[1]),6,0,7); ctx.fill();
        if(i===svPos||i===svNeg){ ctx.strokeStyle=GLD; ctx.lineWidth=2.6; ctx.beginPath(); ctx.arc(SX(pt[0]),SY(pt[1]),9.5,0,7); ctx.stroke(); } }
      // 패널
      var px=W*0.72, py=H*0.26;
      ctx.fillStyle='#dfeef0'; ctx.font='600 16px sans-serif'; ctx.textAlign='left'; ctx.fillText('최대마진 경계', px, py);
      ctx.fillStyle=sep?GRN:RED; ctx.font='14px sans-serif'; ctx.fillText(sep?'✔ 두 클래스 분리 성공':'✘ 분리 실패(섞임)', px, py+28);
      ctx.fillStyle=BLU; ctx.font='13px sans-serif'; ctx.fillText('+1 서포트벡터 거리: '+pos.toFixed(3), px, py+54);
      ctx.fillStyle=RED; ctx.fillText('−1 서포트벡터 거리: '+neg.toFixed(3), px, py+74);
      ctx.fillStyle=sep?GLD:DIM; ctx.font='600 18px sans-serif'; ctx.fillText('마진 폭 = '+margin.toFixed(3), px, py+106);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('노란 테두리 = 서포트벡터', px, py+130);
      ctx.fillText('마진을 최대로 만들수록 좋은 경계', px, py+148);
      E.tapHint(W/2, H*0.95, '기울기·위치를 조절해 마진 폭을 최대로 — 그게 SVM이 찾는 경계입니다', true);
      E.big('SVM — 가장 넓은 길을 내는 경계', '수많은 분리 직선 중 SVM은 두 진영에서 가장 가까운 점(서포트벡터)까지의 거리, 즉 마진이 가장 넓은 하나를 고릅니다. 넓은 안전지대를 둘수록 새 점에 강하죠. 직접 돌려 마진을 넓혀 보세요.'); }
  },

  // ══════════ 4. k-means — 반복(할당+중심갱신)을 실제로 수행 ══════════
  { id:'ai5_04',
    enter:function(E){ var self=this; this.s={iter:0, K:3};
      E.controls('<div class="ctrl"><label>반복 횟수</label><input type="range" id="it" min="0" max="8" step="1" value="0"><output id="ito">0</output>'
        +'<label style="margin-left:14px">군집 수 K</label><input type="range" id="kk" min="2" max="3" step="1" value="3"><output id="kko">3</output></div>');
      E.bind('#it','input',function(e){ self.s.iter=+e.target.value; document.getElementById('ito').textContent=e.target.value; E.blip(340,0.05); });
      E.bind('#kk','input',function(e){ self.s.K=+e.target.value; document.getElementById('kko').textContent=e.target.value; E.blip(360,0.05); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var ox=W*0.12, oy=H*0.80, pw=W*0.56, pv=H*0.62;
      function SX(x){ return ox+x*pw; } function SY(y){ return oy - y*pv; }
      axes(E,ox,oy,pw,pv);
      var COL=[GRN,GLD,PNK];
      // 결정적 초기 중심 K개
      var cen=[]; for(var c=0;c<s.K;c++) cen.push([KM_INIT[c][0],KM_INIT[c][1]]);
      var assign=new Array(KM.length).fill(0);
      var inertia=0;
      // s.iter번 (할당→중심갱신) 반복 — 매번 실제 계산
      for(var it=0; it<s.iter; it++){
        // 할당: 각 점을 가장 가까운 중심으로
        for(var i=0;i<KM.length;i++){ var best=0, bd=1e9;
          for(c=0;c<s.K;c++){ var dx=KM[i][0]-cen[c][0], dy=KM[i][1]-cen[c][1], d=dx*dx+dy*dy;
            if(d<bd){ bd=d; best=c; } } assign[i]=best; }
        // 중심갱신: 각 군집 점들의 평균
        var sx=new Array(s.K).fill(0), sy=new Array(s.K).fill(0), cnt=new Array(s.K).fill(0);
        for(i=0;i<KM.length;i++){ var a=assign[i]; sx[a]+=KM[i][0]; sy[a]+=KM[i][1]; cnt[a]++; }
        for(c=0;c<s.K;c++){ if(cnt[c]>0){ cen[c][0]=sx[c]/cnt[c]; cen[c][1]=sy[c]/cnt[c]; } }
      }
      // 최종 할당(현재 중심 기준)으로 색칠 + 관성(inertia) 실측
      for(i=0;i<KM.length;i++){ var best2=0, bd2=1e9;
        for(c=0;c<s.K;c++){ var ddx=KM[i][0]-cen[c][0], ddy=KM[i][1]-cen[c][1], dd=ddx*ddx+ddy*ddy;
          if(dd<bd2){ bd2=dd; best2=c; } } assign[i]=best2; inertia+=bd2; }
      // 점 그리기(군집 색) + 중심 연결선
      for(i=0;i<KM.length;i++){ var col=(s.iter>0)?COL[assign[i]]:DIM;
        if(s.iter>0){ ctx.strokeStyle='rgba(255,255,255,0.12)'; ctx.lineWidth=1;
          ctx.beginPath(); ctx.moveTo(SX(KM[i][0]),SY(KM[i][1])); ctx.lineTo(SX(cen[assign[i]][0]),SY(cen[assign[i]][1])); ctx.stroke(); }
        ctx.fillStyle=col; ctx.beginPath(); ctx.arc(SX(KM[i][0]),SY(KM[i][1]),5.5,0,7); ctx.fill(); }
      // 중심(별표)
      for(c=0;c<s.K;c++){ ctx.fillStyle=COL[c]; ctx.strokeStyle='#fff'; ctx.lineWidth=1.6;
        var cxp=SX(cen[c][0]), cyp=SY(cen[c][1]);
        ctx.beginPath(); for(var a2=0;a2<10;a2++){ var ang=a2*Math.PI/5-Math.PI/2, rr=(a2%2?4:10);
          var xx=cxp+Math.cos(ang)*rr, yy=cyp+Math.sin(ang)*rr; if(a2===0)ctx.moveTo(xx,yy); else ctx.lineTo(xx,yy); }
        ctx.closePath(); ctx.fill(); ctx.stroke(); }
      // 패널
      var px=W*0.72, py=H*0.26;
      ctx.fillStyle='#dfeef0'; ctx.font='600 16px sans-serif'; ctx.textAlign='left'; ctx.fillText('k-평균 군집 (K='+s.K+')', px, py);
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.fillText('반복 '+s.iter+'회 수행', px, py+28);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText('① 가장 가까운 중심에 할당', px, py+54);
      ctx.fillStyle=DIM; ctx.fillText('② 중심 = 군집 점들의 평균', px, py+74);
      var cnt3=new Array(s.K).fill(0); for(i=0;i<KM.length;i++) cnt3[assign[i]]++;
      for(c=0;c<s.K;c++){ ctx.fillStyle=COL[c]; ctx.font='13px sans-serif'; ctx.fillText('군집 '+(c+1)+': '+cnt3[c]+'개', px, py+102+c*20); }
      ctx.fillStyle=CYA; ctx.font='600 16px sans-serif'; ctx.fillText('관성(거리²합) = '+inertia.toFixed(3), px, py+102+s.K*20+14);
      ctx.fillStyle=DIM; ctx.font='13.5px sans-serif'; ctx.fillText('반복할수록 관성↓ → 수렴', px, py+102+s.K*20+34);
      E.tapHint(W/2, H*0.95, '반복 횟수를 0→8로 올리며 중심이 데이터 한가운데로 수렴하는 걸 보세요', true);
      E.big('k-평균 군집 (비지도) — 할당과 갱신의 반복', '라벨이 없습니다. K개 중심을 두고 ①각 점을 가장 가까운 중심에 배정 ②중심을 그 군집의 평균으로 이동 — 이 두 단계를 번갈아 반복하면 중심이 데이터 덩어리 한가운데로 빨려듭니다. 관성(군집 내 거리 제곱합)이 줄어드는 게 수렴의 증거죠.'); }
  },

  // ══════════ 5. PCA — 공분산 고유벡터(주성분) 실계산 + 1축 투영 ══════════
  { id:'ai5_05',
    enter:function(E){ var self=this; this.s={proj:0};
      E.controls('<div class="ctrl"><label>1축 투영 정도</label><input type="range" id="pj" min="0" max="100" step="2" value="0"><output id="pjo">0%</output></div>');
      E.bind('#pj','input',function(e){ self.s.proj=+e.target.value/100; document.getElementById('pjo').textContent=e.target.value+'%'; E.blip(330,0.05); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var ox=W*0.12, oy=H*0.80, pw=W*0.56, pv=H*0.62;
      function SX(x){ return ox+x*pw; } function SY(y){ return oy - y*pv; }
      axes(E,ox,oy,pw,pv);
      // 1) 평균
      var mx=0,my=0,N=PCA.length; for(var i=0;i<N;i++){ mx+=PCA[i][0]; my+=PCA[i][1]; } mx/=N; my/=N;
      // 2) 공분산행렬 [[a,b],[b,d]]
      var a=0,b=0,d=0; for(i=0;i<N;i++){ var dx=PCA[i][0]-mx, dy=PCA[i][1]-my; a+=dx*dx; b+=dx*dy; d+=dy*dy; }
      a/=N; b/=N; d/=N;
      // 3) 2×2 대칭행렬 최대 고유값·고유벡터(닫힌식)
      var tr=a+d, det=a*d-b*b, disc=Math.sqrt(Math.max(0,tr*tr-4*det));
      var l1=(tr+disc)/2, l2=(tr-disc)/2;
      // 고유벡터 (l1): (b, l1-a) 또는 (l1-d, b)
      var ex, ey; if(Math.abs(b)>1e-9){ ex=l1-d; ey=b; } else { ex= (a>=d)?1:0; ey=(a>=d)?0:1; }
      var el=Math.hypot(ex,ey)||1; ex/=el; ey/=el;
      // 직교 보조축
      var ox2=-ey, oy2=ex;
      // 분산 설명비율(실측)
      var ratio = l1/(l1+l2);
      // 주성분 축 그리기(평균 통과)
      var L=0.46;
      ctx.strokeStyle=GLD; ctx.lineWidth=2.4;
      ctx.beginPath(); ctx.moveTo(SX(mx-ex*L),SY(my-ey*L)); ctx.lineTo(SX(mx+ex*L),SY(my+ey*L)); ctx.stroke();
      ctx.strokeStyle='rgba(122,184,255,0.5)'; ctx.lineWidth=1.4;
      ctx.beginPath(); ctx.moveTo(SX(mx-ox2*L*0.5),SY(my-oy2*L*0.5)); ctx.lineTo(SX(mx+ox2*L*0.5),SY(my+oy2*L*0.5)); ctx.stroke();
      // 점 + 주축 투영(proj 보간)
      for(i=0;i<N;i++){ var px0=PCA[i][0], py0=PCA[i][1];
        // 주축 위 투영점 = mean + ((p-mean)·e) e
        var t=(px0-mx)*ex+(py0-my)*ey;
        var prx=mx+t*ex, pry=my+t*ey;
        var cx=px0+(prx-px0)*s.proj, cy=py0+(pry-py0)*s.proj;
        // 투영 안내선
        if(s.proj>0.01){ ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1;
          ctx.beginPath(); ctx.moveTo(SX(px0),SY(py0)); ctx.lineTo(SX(prx),SY(pry)); ctx.stroke(); }
        ctx.fillStyle = s.proj>0.5?GRN:CYA; ctx.beginPath(); ctx.arc(SX(cx),SY(cy),5,0,7); ctx.fill(); }
      // 평균점
      ctx.fillStyle=RED; ctx.beginPath(); ctx.arc(SX(mx),SY(my),5,0,7); ctx.fill();
      ctx.fillStyle=GLD; ctx.font='600 12px sans-serif'; ctx.textAlign='left'; ctx.fillText('주성분 PC1', SX(mx+ex*L)+4, SY(my+ey*L));
      // 패널
      var px=W*0.72, py=H*0.26;
      ctx.fillStyle='#dfeef0'; ctx.font='600 16px sans-serif'; ctx.fillText('주성분 분석 (PCA)', px, py);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText('공분산 행렬 Σ:', px, py+26);
      ctx.fillStyle=BLU; ctx.font='12px monospace'; ctx.fillText('['+a.toFixed(3)+'  '+b.toFixed(3)+']', px, py+46);
      ctx.fillText('['+b.toFixed(3)+'  '+d.toFixed(3)+']', px, py+62);
      ctx.fillStyle=GLD; ctx.font='13px sans-serif'; ctx.fillText('고유값 λ₁='+l1.toFixed(4), px, py+88);
      ctx.fillStyle=DIM; ctx.fillText('         λ₂='+l2.toFixed(4), px, py+106);
      ctx.fillStyle=GLD; ctx.font='12px sans-serif'; ctx.fillText('PC1 방향 ('+ex.toFixed(2)+', '+ey.toFixed(2)+')', px, py+128);
      ctx.fillStyle=GRN; ctx.font='600 16px sans-serif'; ctx.fillText('설명 분산 = '+(ratio*100).toFixed(1)+'%', px, py+154);
      ctx.fillStyle=DIM; ctx.font='13.5px sans-serif'; ctx.fillText('λ₁/(λ₁+λ₂) — 한 축으로 줄여도', px, py+174);
      ctx.fillText('이만큼의 정보가 보존됩니다', px, py+190);
      E.tapHint(W/2, H*0.95, '투영 슬라이더를 올려 2D 점들이 주성분 한 축으로 눌리는 차원축소를 보세요', true);
      E.big('주성분 분석 (PCA · 비지도) — 분산이 가장 큰 방향', '점 구름이 가장 길게 퍼진 방향을 찾는 일입니다. 공분산 행렬의 최대 고유벡터가 바로 그 주성분이죠. 그 한 축으로 점들을 눌러도(투영) 데이터의 큰 흐름은 그대로 — 2차원을 1차원으로 줄이고도 정보를 거의 잃지 않습니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
