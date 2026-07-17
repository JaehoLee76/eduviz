/* 인공지능 제4장 — 모델 평가: 혼동행렬 · 정확도/정밀도/재현율/F1 · ROC·AUC · 편향-분산/과적합 · 교차검증
   동작(behavior)만. 텍스트=content/ai4.json. 엔진 js/engine.js 공유. 색: AI=시안.
   골든룰: 화면의 모든 지표(Acc·Prec·Rec·F1·FPR·TPR·AUC·오차)는 혼동행렬/데이터에서 매 프레임 실제로 계산.
           하드코딩·난수 표시값 금지. */
(function(){
  var CYA='#3dd6dc', BLU='#7ab8ff', GLD='#ffd27a', GRN='#7ee0b0', PNK='#f4a0c0', DIM='#9b99a3', RED='#f0888a';

  // ── 결정적 평가 데이터: 20개 샘플 = [예측확률 p, 실제정답 y(1=양성/0=음성)] ──
  // 좋은(하지만 완벽하지 않은) 분류기: 양성은 대체로 높은 확률, 음성은 대체로 낮은 확률 + 약간의 겹침.
  var DATA = [
    [0.95,1],[0.90,1],[0.85,0],[0.80,1],[0.78,1],
    [0.70,1],[0.65,0],[0.62,1],[0.58,0],[0.55,1],
    [0.50,1],[0.45,0],[0.42,1],[0.40,0],[0.35,0],
    [0.30,1],[0.25,0],[0.18,0],[0.12,0],[0.05,0]
  ]; // 양성 10 · 음성 10

  // 임계값 thr에서 혼동행렬 실측: p>=thr → 양성 예측.
  function confusion(thr){ var TP=0,FP=0,FN=0,TN=0;
    for(var i=0;i<DATA.length;i++){ var pred=DATA[i][0]>=thr?1:0, y=DATA[i][1];
      if(pred===1&&y===1)TP++; else if(pred===1&&y===0)FP++;
      else if(pred===0&&y===1)FN++; else TN++; }
    return {TP:TP,FP:FP,FN:FN,TN:TN}; }
  // 지표(혼동행렬에서 실제 계산). 분모 0이면 NaN 대신 0 처리.
  function metrics(c){ var N=c.TP+c.FP+c.FN+c.TN;
    var acc=N?(c.TP+c.TN)/N:0;
    var prec=(c.TP+c.FP)?c.TP/(c.TP+c.FP):0;
    var rec=(c.TP+c.FN)?c.TP/(c.TP+c.FN):0;
    var f1=(prec+rec)?2*prec*rec/(prec+rec):0;
    var fpr=(c.FP+c.TN)?c.FP/(c.FP+c.TN):0;
    return {acc:acc,prec:prec,rec:rec,f1:f1,fpr:fpr,tpr:rec,N:N}; }

  // 과적합용: 매끄러운 곡선 + 결정적 잡음, 훈련/검증 분할
  function noise(i){ return ((Math.sin(i*12.9898)*43758.5453)%1+1)%1 - 0.5; }
  function gfn(x){ return 0.5 + 0.30*Math.sin(2.3*x+0.4); }
  var TR=[], TE=[];
  (function(){ var Np=20; for(var i=0;i<Np;i++){ var x=0.04+i/(Np-1)*0.92, y=gfn(x)+noise(i*7+3)*0.12; (i%2?TE:TR).push([x,y]); } })();
  function solve(A,b){ var n=b.length,i,j,k; A=A.map(function(r){return r.slice();}); b=b.slice();
    for(i=0;i<n;i++){ var p=i; for(k=i+1;k<n;k++) if(Math.abs(A[k][i])>Math.abs(A[p][i])) p=k;
      var t=A[i];A[i]=A[p];A[p]=t; var tb=b[i];b[i]=b[p];b[p]=tb;
      var piv=A[i][i]||1e-9; for(k=i+1;k<n;k++){ var f=A[k][i]/piv; for(j=i;j<n;j++) A[k][j]-=f*A[i][j]; b[k]-=f*b[i]; } }
    var x=new Array(n); for(i=n-1;i>=0;i--){ var s=b[i]; for(j=i+1;j<n;j++) s-=A[i][j]*x[j]; x[i]=s/(A[i][i]||1e-9); } return x; }
  function polyfit(pts,deg){ var n=deg+1,ATA=[],ATy=[],r,c,i;
    for(r=0;r<n;r++){ ATA.push(new Array(n).fill(0)); ATy.push(0); }
    for(i=0;i<pts.length;i++){ var xs=2*pts[i][0]-1,pw=[],v=1,j; for(j=0;j<n;j++){ pw.push(v); v*=xs; }
      for(r=0;r<n;r++){ for(c=0;c<n;c++) ATA[r][c]+=pw[r]*pw[c]; ATy[r]+=pw[r]*pts[i][1]; } }
    for(r=0;r<n;r++) ATA[r][r]+=1e-7; return solve(ATA,ATy); }
  function polyval(co,x){ var xs=2*x-1,v=0,j; for(j=co.length-1;j>=0;j--) v=v*xs+co[j]; return v; }
  function mse(pts,co){ var s=0,i; for(i=0;i<pts.length;i++){ var e=polyval(co,pts[i][0])-pts[i][1]; s+=e*e; } return s/pts.length; }

  var scenes = [

  // ══════════ 1. 혼동행렬 (Confusion Matrix) ══════════
  { id:'ai4_01',
    enter:function(E){ var self=this; this.s={thr:0.5};
      E.controls('<div class="ctrl"><label>판정 임계값 θ</label><input type="range" id="th" min="0.05" max="0.95" step="0.05" value="0.5"><output id="tho">0.50</output></div>');
      E.bind('#th','input',function(e){ self.s.thr=+e.target.value; document.getElementById('tho').textContent=(+e.target.value).toFixed(2); E.blip(360,0.05); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, thr=s.thr;
      var c=confusion(thr), m=metrics(c);
      // ── 왼쪽: 확률 막대 띠 (각 샘플을 p 위치에 점, 임계선) ──
      var ox=W*0.07, ow=W*0.40, oy=H*0.20, oh=H*0.56;
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('예측 확률 p  (0 ← → 1)', ox, oy-12);
      // 트랙
      ctx.strokeStyle='rgba(255,255,255,0.10)'; ctx.lineWidth=1;
      ctx.strokeRect(ox, oy, ow, oh);
      for(var i=0;i<DATA.length;i++){ var p=DATA[i][0], y=DATA[i][1];
        var px=ox+p*ow, py=oy+oh*(i+0.5)/DATA.length;
        var pred=p>=thr?1:0;
        // 색: 실제 양성=파랑계열, 실제 음성=빨강계열. 채움=올바른 예측, 빈=틀린 예측
        var correct=(pred===y);
        ctx.fillStyle = y? BLU : RED;
        ctx.globalAlpha = correct?1:0.35;
        ctx.beginPath(); ctx.arc(px,py,5.5,0,7); ctx.fill();
        if(!correct){ ctx.globalAlpha=1; ctx.strokeStyle=y?BLU:RED; ctx.lineWidth=1.6; ctx.beginPath(); ctx.arc(px,py,5.5,0,7); ctx.stroke(); }
        ctx.globalAlpha=1; }
      // 임계선
      var tx=ox+thr*ow; ctx.strokeStyle=GLD; ctx.lineWidth=2.4; ctx.setLineDash([5,4]);
      ctx.beginPath(); ctx.moveTo(tx,oy-4); ctx.lineTo(tx,oy+oh+4); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=GLD; ctx.font='600 12px sans-serif'; ctx.textAlign='center'; ctx.fillText('θ='+thr.toFixed(2), tx, oy+oh+20);
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('θ 왼쪽 → 음성 예측', ox, oy+oh+20);
      ctx.textAlign='right'; ctx.fillText('θ 오른쪽 → 양성 예측', ox+ow, oy+oh+38);
      ctx.textAlign='left'; ctx.fillStyle=BLU; ctx.fillText('● 실제 양성', ox, oy+oh+38);
      ctx.fillStyle=RED; ctx.fillText('● 실제 음성', ox+92, oy+oh+38);

      // ── 오른쪽: 2×2 혼동행렬 ──
      var gx=W*0.58, gy=H*0.26, cell=Math.min(W*0.12,H*0.16);
      var cells=[ {r:0,c:0,v:c.TP,t:'TP',sub:'참 양성',col:GRN},
                  {r:0,c:1,v:c.FN,t:'FN',sub:'거짓 음성',col:RED},
                  {r:1,c:0,v:c.FP,t:'FP',sub:'거짓 양성',col:RED},
                  {r:1,c:1,v:c.TN,t:'TN',sub:'참 음성',col:GRN} ];
      // 헤더
      ctx.fillStyle='#dfeef0'; ctx.font='600 13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('예측 양성', gx+cell*0.5, gy-22); ctx.fillText('예측 음성', gx+cell*1.5, gy-22);
      // 행 라벨(세로글씨)이 자기 행 높이 안에 들어가도록 폰트 자동 축소(최소 11px) — 낮은 셀에서도 두 행이 안 겹치게
      var rowFS=13, rTw=Math.max(ctx.measureText('실제 양성').width, ctx.measureText('실제 음성').width), rAvail=cell-14;
      if(rTw>rAvail) rowFS=Math.max(11, 13*rAvail/rTw);
      ctx.save(); ctx.translate(gx-26, gy+cell*0.5); ctx.rotate(-Math.PI/2); ctx.font='600 '+rowFS.toFixed(1)+'px sans-serif'; ctx.fillText('실제 양성',0,0); ctx.restore();
      ctx.save(); ctx.translate(gx-26, gy+cell*1.5); ctx.rotate(-Math.PI/2); ctx.font='600 '+rowFS.toFixed(1)+'px sans-serif'; ctx.fillText('실제 음성',0,0); ctx.restore();
      for(i=0;i<4;i++){ var ce=cells[i], x=gx+ce.c*cell, yv=gy+ce.r*cell;
        ctx.fillStyle='rgba(255,255,255,0.03)'; ctx.fillRect(x,yv,cell,cell);
        ctx.strokeStyle=ce.col; ctx.lineWidth=1.6; ctx.strokeRect(x,yv,cell,cell);
        ctx.fillStyle=ce.col; ctx.font='700 28px sans-serif'; ctx.textAlign='center'; ctx.fillText(''+ce.v, x+cell/2, yv+cell*0.5+6);
        ctx.fillStyle=ce.col; ctx.font='600 12px sans-serif'; ctx.fillText(ce.t, x+cell*0.5, yv+16);
        ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.fillText(ce.sub, x+cell*0.5, yv+cell-8); }
      // 합계·정확도 미리
      ctx.fillStyle=CYA; ctx.font='600 15px sans-serif'; ctx.textAlign='center';
      ctx.fillText('정확도 = (TP+TN)/N = ('+c.TP+'+'+c.TN+')/'+m.N+' = '+m.acc.toFixed(3), gx+cell, gy+cell*2+34);
      E.tapHint(W/2, H*0.95, '임계값 θ를 움직이면 양/음 판정이 바뀌어 4칸이 실시간 갱신됩니다', true);
      E.big('혼동행렬 — 모든 평가의 출발점', '분류기의 성적표는 단 네 칸으로 요약됩니다. 맞힌 양성(TP)·맞힌 음성(TN)·헛다리(FP)·놓침(FN). 임계값을 옮기면 이 네 숫자가 통째로 바뀌고, 거기서 모든 지표가 흘러나옵니다.'); }
  },

  // ══════════ 2. 정확도·정밀도·재현율·F1 (트레이드오프) ══════════
  { id:'ai4_02',
    enter:function(E){ var self=this; this.s={thr:0.5};
      E.controls('<div class="ctrl"><label>판정 임계값 θ</label><input type="range" id="th2" min="0.05" max="0.95" step="0.05" value="0.5"><output id="th2o">0.50</output></div>');
      E.bind('#th2','input',function(e){ self.s.thr=+e.target.value; document.getElementById('th2o').textContent=(+e.target.value).toFixed(2); E.blip(360,0.05); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, thr=s.thr;
      var c=confusion(thr), m=metrics(c);
      // 작은 혼동행렬(좌상)
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left';
      var hx=W*0.08, hy=H*0.16, cs=Math.min(W*0.07,H*0.10);
      var grid=[[c.TP,c.FN],[c.FP,c.TN]], gc=[[GRN,RED],[RED,GRN]];
      ctx.fillText('예측→', hx, hy-8);
      for(var r=0;r<2;r++)for(var cc=0;cc<2;cc++){ var x=hx+cc*cs, y=hy+r*cs;
        ctx.strokeStyle='rgba(255,255,255,0.14)'; ctx.lineWidth=1; ctx.strokeRect(x,y,cs,cs);
        ctx.fillStyle=gc[r][cc]; ctx.font='700 17px sans-serif'; ctx.textAlign='center'; ctx.fillText(''+grid[r][cc], x+cs/2, y+cs/2+6); }
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center';
      ctx.fillText('TP', hx+cs*0.5, hy+8); ctx.fillText('FN', hx+cs*1.5, hy+8);
      ctx.fillText('FP', hx+cs*0.5, hy+cs+12); ctx.fillText('TN', hx+cs*1.5, hy+cs+12);

      // 막대 4개 (실측 지표)
      var bars=[ {lab:'정확도 Acc', f:'(TP+TN)/N', v:m.acc, col:CYA, det:'('+c.TP+'+'+c.TN+')/'+m.N},
                 {lab:'정밀도 Prec', f:'TP/(TP+FP)', v:m.prec, col:GLD, det:c.TP+'/('+c.TP+'+'+c.FP+')'},
                 {lab:'재현율 Rec', f:'TP/(TP+FN)', v:m.rec, col:GRN, det:c.TP+'/('+c.TP+'+'+c.FN+')'},
                 {lab:'F1 점수', f:'2PR/(P+R)', v:m.f1, col:PNK, det:'조화평균'} ];
      var bx=W*0.40, bw=W*0.30, by0=H*0.20, bh=H*0.13, gap=H*0.155;
      for(var i=0;i<bars.length;i++){ var b=bars[i], yv=by0+i*gap;
        ctx.fillStyle='#dfeef0'; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText(b.lab, bx, yv-6);
        ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='right'; ctx.fillText(b.f+' = '+b.det, bx+bw, yv-6);
        // 트랙
        ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(bx, yv, bw, bh*0.6);
        ctx.fillStyle=b.col; ctx.fillRect(bx, yv, bw*b.v, bh*0.6);
        ctx.fillStyle=b.col; ctx.font='700 16px sans-serif'; ctx.textAlign='left'; ctx.fillText(b.v.toFixed(3), bx+bw+10, yv+bh*0.6-2); }

      // 트레이드오프 설명(우측)
      var tx=W*0.78, ty=H*0.22;
      ctx.fillStyle='#dfeef0'; ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.fillText('정밀도 ↔ 재현율', tx, ty);
      ctx.fillStyle=GLD; ctx.font='12px sans-serif'; ctx.fillText('θ↑ : 정밀도↑ 재현율↓', tx, ty+24);
      ctx.fillStyle=GRN; ctx.fillText('θ↓ : 재현율↑ 정밀도↓', tx, ty+44);
      ctx.fillStyle=PNK; ctx.font='13px sans-serif'; ctx.fillText('F1 = 둘의 조화평균', tx, ty+70);
      ctx.fillStyle=DIM; ctx.fillText('(한쪽만 높으면 낮게)', tx, ty+88);

      E.tapHint(W/2, H*0.95, 'θ를 올리면 정밀도↑·재현율↓ — F1이 둘의 균형을 한 숫자로', true);
      E.big('정확도·정밀도·재현율·F1', '같은 혼동행렬을 네 각도로 봅니다. 정밀도는 "양성이라 외친 것 중 진짜 비율", 재현율은 "진짜 양성을 얼마나 건졌나". 둘은 임계값을 사이에 두고 시소를 타고, F1이 그 균형을 하나로 묶습니다.'); }
  },

  // ══════════ 3. ROC 곡선 · AUC ══════════
  { id:'ai4_03',
    enter:function(E){ var self=this; this.s={thr:0.5};
      E.controls('<div class="ctrl"><label>현재 임계값 θ</label><input type="range" id="th3" min="0.05" max="0.95" step="0.05" value="0.5"><output id="th3o">0.50</output></div>');
      E.bind('#th3','input',function(e){ self.s.thr=+e.target.value; document.getElementById('th3o').textContent=(+e.target.value).toFixed(2); E.blip(360,0.05); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var ox=W*0.18, oy=H*0.80, ax=W*0.46, ay=H*0.60; // 원점, 폭, 높이
      function SX(fpr){ return ox+fpr*ax; } function SY(tpr){ return oy-tpr*ay; }
      // 축
      ctx.strokeStyle='rgba(61,214,220,0.25)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(ox,oy); ctx.lineTo(ox+ax,oy); ctx.moveTo(ox,oy); ctx.lineTo(ox,oy-ay); ctx.stroke();
      ctx.strokeRect(ox,oy-ay,ax,ay);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center';
      ctx.fillText('거짓 양성률 FPR →', ox+ax/2, oy+24);
      ctx.save(); ctx.translate(ox-30, oy-ay/2); ctx.rotate(-Math.PI/2); ctx.fillText('재현율 TPR →',0,0); ctx.restore();
      // 무작위 기준선(대각선)
      ctx.strokeStyle='rgba(155,153,163,0.5)'; ctx.lineWidth=1.2; ctx.setLineDash([5,4]);
      ctx.beginPath(); ctx.moveTo(SX(0),SY(0)); ctx.lineTo(SX(1),SY(1)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('무작위(AUC=0.5)', SX(0.55),SY(0.45));

      // ── ROC 점들: 임계값을 1→0으로 쓸며 (FPR,TPR) 실측 ──
      var thrs=[]; for(var t=1.0; t>=-0.001; t-=0.05) thrs.push(Math.max(0,t));
      var pts=[]; for(var i=0;i<thrs.length;i++){ var m=metrics(confusion(thrs[i])); pts.push([m.fpr,m.tpr,thrs[i]]); }
      // (0,0)부터 (1,1)까지 정렬은 thr 내림차순이면 자연히 FPR/TPR 단조증가
      // 곡선
      ctx.strokeStyle=CYA; ctx.lineWidth=2.6; ctx.beginPath();
      for(i=0;i<pts.length;i++){ var X=SX(pts[i][0]), Y=SY(pts[i][1]); if(i===0)ctx.moveTo(X,Y); else ctx.lineTo(X,Y); } ctx.stroke();
      // 채움(AUC 영역)
      ctx.fillStyle='rgba(61,214,220,0.10)'; ctx.beginPath(); ctx.moveTo(SX(0),SY(0));
      for(i=0;i<pts.length;i++) ctx.lineTo(SX(pts[i][0]),SY(pts[i][1]));
      ctx.lineTo(SX(1),SY(0)); ctx.closePath(); ctx.fill();
      // 점
      for(i=0;i<pts.length;i++){ ctx.fillStyle=BLU; ctx.beginPath(); ctx.arc(SX(pts[i][0]),SY(pts[i][1]),3,0,7); ctx.fill(); }

      // ── AUC 사다리꼴 적분(실측) ── (FPR 오름차순으로 정렬해 적분)
      var sorted=pts.slice().sort(function(a,b){ return a[0]-b[0]; });
      var auc=0; for(i=1;i<sorted.length;i++){ var dx=sorted[i][0]-sorted[i-1][0]; auc+=dx*(sorted[i][1]+sorted[i-1][1])/2; }

      // 현재 임계값 점 강조
      var cm=metrics(confusion(s.thr));
      ctx.fillStyle=GLD; ctx.strokeStyle='#fff'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(SX(cm.fpr),SY(cm.tpr),7,0,7); ctx.fill(); ctx.stroke();
      ctx.fillStyle=GLD; ctx.font='600 12px sans-serif'; ctx.textAlign='left';
      ctx.fillText('θ='+s.thr.toFixed(2)+' → (FPR '+cm.fpr.toFixed(2)+', TPR '+cm.tpr.toFixed(2)+')', SX(cm.fpr)+12, SY(cm.tpr));

      // 우측 패널
      var tx=W*0.70, ty=H*0.26;
      ctx.fillStyle=CYA; ctx.font='700 22px sans-serif'; ctx.textAlign='left'; ctx.fillText('AUC = '+auc.toFixed(3), tx, ty);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('(ROC 곡선 아래 넓이, 사다리꼴 적분)', tx, ty+22);
      ctx.fillStyle='#dfeef0'; ctx.font='12px sans-serif';
      ctx.fillText('TPR = TP/(TP+FN) = 재현율', tx, ty+54);
      ctx.fillText('FPR = FP/(FP+TN)', tx, ty+74);
      ctx.fillStyle=GRN; ctx.fillText('AUC 1.0 = 완벽 · 0.5 = 동전', tx, ty+102);
      ctx.fillStyle=DIM; ctx.fillText('임계값과 무관한 분리력 척도', tx, ty+122);

      E.tapHint(W/2, H*0.95, 'θ를 움직이면 금색 점이 곡선 위를 미끄러집니다 — 곡선 자체·AUC는 임계값과 무관', true);
      E.big('ROC 곡선과 AUC', '임계값을 1에서 0까지 쓸어내리면 (FPR, TPR) 한 점이 좌하단에서 우상단으로 기어오릅니다. 그 궤적이 ROC, 그 아래 넓이가 AUC — 임계값을 정하기 전에도 분류기의 분리력을 한 숫자로 말해 줍니다.'); }
  },

  // ══════════ 4. 편향-분산 · 과적합 (모델 복잡도) ══════════
  { id:'ai4_04',
    enter:function(E){ var self=this; this.s={deg:3};
      E.controls('<div class="ctrl"><label>모델 복잡도 (다항식 차수)</label><input type="range" id="dg" min="1" max="9" step="1" value="3"><output id="dgo">3</output></div>');
      E.bind('#dg','input',function(e){ self.s.deg=+e.target.value; document.getElementById('dgo').textContent=e.target.value; E.blip(300+self.s.deg*40,0.06); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // ── 왼쪽: 적합 곡선 + 데이터 ──
      var ox=W*0.08, oy=H*0.72, pw=W*0.42, pv=H*0.50;
      function SX(x){ return ox+x*pw; } function SY(y){ return oy-(y-0.05)/0.95*pv; }
      ctx.strokeStyle='rgba(61,214,220,0.22)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(ox,oy); ctx.lineTo(ox+pw,oy); ctx.moveTo(ox,oy); ctx.lineTo(ox,oy-pv); ctx.stroke();
      var co=polyfit(TR,s.deg);
      ctx.strokeStyle=GLD; ctx.lineWidth=2.6; ctx.beginPath();
      for(var x=0;x<=1.0001;x+=0.005){ var y=polyval(co,x), py=SY(y); if(py<H*0.16)py=H*0.16; if(py>oy+4)py=oy+4; if(x===0)ctx.moveTo(SX(x),py); else ctx.lineTo(SX(x),py); } ctx.stroke();
      var i; for(i=0;i<TR.length;i++){ ctx.fillStyle=CYA; ctx.beginPath(); ctx.arc(SX(TR[i][0]),SY(TR[i][1]),5,0,7); ctx.fill(); }
      for(i=0;i<TE.length;i++){ ctx.fillStyle='rgba(244,160,192,0.85)'; ctx.beginPath(); ctx.arc(SX(TE[i][0]),SY(TE[i][1]),5,0,7); ctx.fill(); ctx.strokeStyle='#fff'; ctx.lineWidth=1.6; ctx.stroke(); }
      ctx.fillStyle=CYA; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('● 훈련', ox, oy-pv-4);
      ctx.fillStyle=PNK; ctx.fillText('◯ 검증', ox+62, oy-pv-4);

      // ── 오른쪽: 차수별 훈련/검증 오차 곡선(실측, 1..9 전부 적합) ──
      var gx=W*0.58, gy=H*0.22, gw=W*0.33, gh=H*0.46;
      ctx.strokeStyle='rgba(255,255,255,0.10)'; ctx.lineWidth=1; ctx.strokeRect(gx,gy,gw,gh);
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('복잡도(차수) →', gx+gw/2, gy+gh+18);
      ctx.save(); ctx.translate(gx-12, gy+gh/2); ctx.rotate(-Math.PI/2); ctx.fillText('오차', 0,0); ctx.restore();
      var degs=[1,2,3,4,5,6,7,8,9], etrA=[], eteA=[], maxE=0;
      for(i=0;i<degs.length;i++){ var cc=polyfit(TR,degs[i]); var et=mse(TR,cc), ev=Math.min(mse(TE,cc),0.2); etrA.push(et); eteA.push(ev); maxE=Math.max(maxE,et,ev); }
      maxE=maxE*1.1||1;
      function GX(d){ return gx+(d-1)/8*gw; } function GY(v){ return gy+gh-(v/maxE)*gh; }
      // 검증오차 U자
      ctx.strokeStyle=PNK; ctx.lineWidth=2.4; ctx.beginPath();
      for(i=0;i<degs.length;i++){ var X=GX(degs[i]),Y=GY(eteA[i]); if(i===0)ctx.moveTo(X,Y); else ctx.lineTo(X,Y); } ctx.stroke();
      // 훈련오차 감소
      ctx.strokeStyle=CYA; ctx.lineWidth=2.4; ctx.beginPath();
      for(i=0;i<degs.length;i++){ var X2=GX(degs[i]),Y2=GY(etrA[i]); if(i===0)ctx.moveTo(X2,Y2); else ctx.lineTo(X2,Y2); } ctx.stroke();
      // 현재 차수 표시선 + 점
      var cx=GX(s.deg); ctx.strokeStyle=GLD; ctx.lineWidth=1.4; ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.moveTo(cx,gy); ctx.lineTo(cx,gy+gh); ctx.stroke(); ctx.setLineDash([]);
      var etr=mse(TR,co), ete=Math.min(mse(TE,co),0.2);
      ctx.fillStyle=CYA; ctx.beginPath(); ctx.arc(cx,GY(etr),5,0,7); ctx.fill();
      ctx.fillStyle=PNK; ctx.beginPath(); ctx.arc(cx,GY(ete),5,0,7); ctx.fill();
      // 범례
      ctx.fillStyle=CYA; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('— 훈련오차 (↓)', gx+6, gy+14);
      ctx.fillStyle=PNK; ctx.fillText('— 검증오차 (U자)', gx+6, gy+32);

      // 판정
      var verdict = s.deg<=2 ? '과소적합 — 편향↑(너무 단순)' : (ete>etr*2.2 ? '과적합 — 분산↑(잡음 암기)' : '균형 — 잘 일반화');
      var vc = s.deg<=2?GLD : (ete>etr*2.2?RED:GRN);
      ctx.fillStyle=vc; ctx.font='600 16px sans-serif'; ctx.textAlign='center'; ctx.fillText(verdict, W*0.29, H*0.86);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif';
      ctx.fillText('훈련오차 '+etr.toFixed(4)+'  ·  검증오차 '+ete.toFixed(4), W*0.29, H*0.90);

      E.tapHint(W/2, H*0.95, '차수를 올리면 훈련오차는 계속↓, 검증오차는 U자 — 최저점이 최적 복잡도', true);
      E.big('편향-분산과 과적합', '모델을 복잡하게 할수록 훈련오차는 끝없이 줄지만, 검증오차는 한번 내려갔다 다시 치솟습니다(U자). 단순하면 편향이 커 못 잡고, 복잡하면 분산이 커 잡음까지 외웁니다. 그 골짜기 바닥이 가장 잘 일반화하는 지점입니다.'); }
  },

  // ══════════ 5. 교차검증 (k-fold) ══════════
  { id:'ai4_05',
    enter:function(E){ var self=this; this.s={k:5};
      E.controls('<div class="ctrl"><label>폴드 수 k</label><input type="range" id="kf" min="2" max="10" step="1" value="5"><output id="kfo">5</output></div>');
      E.bind('#kf','input',function(e){ self.s.k=+e.target.value; document.getElementById('kfo').textContent=e.target.value; E.blip(340,0.06); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, k=s.k;
      // 데이터: 20개를 차수=3 다항회귀로, 각 폴드를 검증으로 빼고 나머지로 적합 → 검증MSE 실측.
      var ALL=TR.concat(TE).slice().sort(function(a,b){return a[0]-b[0];});
      var N=ALL.length;
      // 폴드 인덱스 분배(결정적, 연속 블록)
      var folds=[]; for(var f=0;f<k;f++) folds.push([]);
      for(var i=0;i<N;i++){ folds[Math.floor(i*k/N)].push(ALL[i]); }
      // 각 폴드 검증 성능(MSE) 실측
      var scores=[], sum=0, cnt=0;
      for(f=0;f<k;f++){ if(!folds[f].length)continue;
        var val=folds[f], tr=[]; for(var g=0;g<k;g++){ if(g!==f) tr=tr.concat(folds[g]); }
        var co=polyfit(tr,3); var e=mse(val,co); scores.push({f:f,e:e,n:val.length}); sum+=e; cnt++; }
      var avg=cnt?sum/cnt:0;
      var vr=0; for(i=0;i<scores.length;i++){ var d=scores[i].e-avg; vr+=d*d; } vr=scores.length?Math.sqrt(vr/scores.length):0;

      // ── 위쪽: 데이터 띠를 k 블록으로 분할, 각 줄에서 한 블록이 검증(노랑), 나머지 훈련(시안) ──
      var ox=W*0.08, ow=W*0.56, oy=H*0.16, rowH=Math.min(H*0.55/k, H*0.07), gapR=rowH*1.25;
      ctx.fillStyle='#dfeef0'; ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.fillText(k+'-겹 교차검증 — 각 줄마다 한 폴드를 검증, 나머지로 학습', ox, oy-10);
      for(f=0;f<k;f++){ var ry=oy+f*gapR;
        ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='right'; ctx.fillText('회차 '+(f+1), ox-8, ry+rowH*0.7);
        for(var b=0;b<k;b++){ var bx=ox+b*ow/k, bw=ow/k-2;
          var isVal=(b===f);
          ctx.fillStyle = isVal? GLD : 'rgba(61,214,220,0.45)';
          ctx.fillRect(bx, ry, bw, rowH); }
        // 이 회차 점수
        var sc=null; for(i=0;i<scores.length;i++) if(scores[i].f===f) sc=scores[i];
        if(sc){ ctx.fillStyle=GLD; ctx.font='600 12px sans-serif'; ctx.textAlign='left'; ctx.fillText('검증MSE '+sc.e.toFixed(4), ox+ow+12, ry+rowH*0.7); } }
      // 범례
      var ly=oy+k*gapR+6;
      ctx.fillStyle=GLD; ctx.fillRect(ox, ly, 16, 10); ctx.fillStyle='#dfeef0'; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('검증 폴드', ox+22, ly+9);
      ctx.fillStyle='rgba(61,214,220,0.45)'; ctx.fillRect(ox+110, ly, 16, 10); ctx.fillStyle='#dfeef0'; ctx.fillText('훈련 폴드', ox+132, ly+9);

      // ── 우측: 평균±편차 ──
      var tx=W*0.74, ty=H*0.30;
      ctx.fillStyle=CYA; ctx.font='700 20px sans-serif'; ctx.textAlign='left'; ctx.fillText('평균 MSE', tx, ty);
      ctx.fillStyle=CYA; ctx.font='700 26px sans-serif'; ctx.fillText(avg.toFixed(4), tx, ty+34);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('± '+vr.toFixed(4)+' (표준편차)', tx, ty+58);
      ctx.fillStyle='#dfeef0'; ctx.font='12px sans-serif';
      ctx.fillText(k+'개 회차 성능의 평균', tx, ty+88);
      ctx.fillStyle=GRN; ctx.fillText('모든 데이터가 검증에 한 번씩', tx, ty+110);
      ctx.fillStyle=DIM; ctx.fillText('k↑ : 추정 안정·계산 비용↑', tx, ty+130);
      ctx.fillStyle=DIM; ctx.fillText('k=N → LOOCV(하나씩 빼기)', tx, ty+148);

      E.tapHint(W/2, H*0.95, 'k를 바꾸면 분할·회차·평균이 실시간 재계산됩니다', true);
      E.big('교차검증 (k-겹)', '한 번의 분할 운에 성적을 맡기지 않습니다. 데이터를 k조각으로 나눠 돌아가며 한 조각씩 시험으로 쓰고, k번의 점수를 평균 냅니다. 모든 데이터가 학습에도 평가에도 쓰여, 적은 데이터에서도 정직한 성능을 얻습니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
