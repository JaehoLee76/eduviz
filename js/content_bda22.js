/* 빅데이터 분석 제22장 — 분류 모델 성능 측정 (카파·ROC·PR·리프트·보정·지표 선택)
   동작(behavior)만. 텍스트=content/bda22.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 화면의 모든 수(정확도·카파·민감도·특이도·AUC·정밀도·재현율·리프트·보정 구간별 관측비율·
   기대비용)는 아래 고정 배열로부터 이 파일 로드 시 실제 계산(하드코딩 금지). 분류기는 로지스틱
   회귀를 경사하강으로 직접 학습하고, ROC·PR·리프트·보정곡선은 그 예측확률로부터 전수 스캔해
   구한다. 난수(Math.random) 절대 금지 — 표본·초기화는 고정 시드 LCG. */
(function(){
  var ROSE='#ff7ab8', GRN='#7ee0b0', BLU='#7ab8ff', GLD='#ffd27a', DIM='#9b99a3', RED='#f0888a', TXT='#eadfe8';

  function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

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

  // ── 수치 도구 ──────────────────────────────────────────────
  function mean(a){ var s=0,i; for(i=0;i<a.length;i++) s+=a[i]; return s/a.length; }
  function std(a){ var m=mean(a),s=0,i; for(i=0;i<a.length;i++){ var d=a[i]-m; s+=d*d; } return Math.sqrt(s/a.length); }
  function LCG(seed){ var s=seed>>>0; return function(){ s=(1103515245*s+12345)>>>0; return s/4294967296; }; }
  function sigmoid(z){ return 1/(1+Math.exp(-z)); }

  // ══════════ 고정 데이터: 설비 80대의 진동 이상치(v)·가동시간(h) → 고장 여부(y) ══════════
  var N22=80, V22=[], H22=[], Y22=[];
  (function(){
    var rng=LCG(20260801);
    for(var i=0;i<N22;i++){
      var v=1.3+0.07*i+1.8*Math.sin(i/5)+(rng()-0.5)*2.0;
      var h=2.5+0.045*i+1.3*Math.cos(i/7)+(rng()-0.5)*1.6;
      var z=0.32*v+0.30*h-4.15;
      var p=sigmoid(z);
      var y=(rng()<p)?1:0;
      V22.push(+v.toFixed(2)); H22.push(+h.toFixed(2)); Y22.push(y);
    }
  })();
  var POS22=Y22.reduce(function(s,v){return s+v;},0), NEG22=N22-POS22;

  var mV22=mean(V22), sV22=std(V22), mH22=mean(H22), sH22=std(H22);
  var Vs22=V22.map(function(v){return (v-mV22)/sV22;});
  var Hs22=H22.map(function(v){return (v-mH22)/sH22;});

  function logregGD(feats, y, lr, iters, l2){
    var p=feats[0].length, n=y.length, w=new Array(p).fill(0), b=0;
    for(var it=0;it<iters;it++){
      var gw=new Array(p).fill(0), gb=0;
      for(var i=0;i<n;i++){
        var z=b; for(var j=0;j<p;j++) z+=w[j]*feats[i][j];
        var pr=sigmoid(z), err=pr-y[i];
        for(j=0;j<p;j++) gw[j]+=err*feats[i][j];
        gb+=err;
      }
      for(j=0;j<p;j++) w[j]=w[j]-lr*(gw[j]/n + l2*w[j]);
      b=b-lr*(gb/n);
    }
    return {w:w,b:b};
  }
  // 모델 A: 진동+가동시간 두 특징을 함께 쓰는 로지스틱 회귀(실제 경사하강으로 학습)
  var FEATSA22=[]; for(var _i22=0;_i22<N22;_i22++) FEATSA22.push([Vs22[_i22],Hs22[_i22]]);
  var MODELA22=logregGD(FEATSA22, Y22, 0.4, 2000, 0.01);
  var PA22=[]; for(_i22=0;_i22<N22;_i22++){ var _z=MODELA22.b+MODELA22.w[0]*Vs22[_i22]+MODELA22.w[1]*Hs22[_i22]; PA22.push(sigmoid(_z)); }
  // 모델 C: 가동시간 하나만 쓰는(값싼) 로지스틱 회귀 — 5장면에서 비용 기준 비교에 사용
  var FEATSC22=[]; for(_i22=0;_i22<N22;_i22++) FEATSC22.push([Hs22[_i22]]);
  var MODELC22=logregGD(FEATSC22, Y22, 0.4, 2000, 0.01);
  var PC22=[]; for(_i22=0;_i22<N22;_i22++){ var _zc=MODELC22.b+MODELC22.w[0]*Hs22[_i22]; PC22.push(sigmoid(_zc)); }

  function confAt(P,Y,thr){
    var TP=0,FP=0,TN=0,FN=0,i;
    for(i=0;i<P.length;i++){
      var pred=P[i]>=thr?1:0;
      if(pred===1&&Y[i]===1)TP++; else if(pred===1&&Y[i]===0)FP++; else if(pred===0&&Y[i]===0)TN++; else FN++;
    }
    return {TP:TP,FP:FP,TN:TN,FN:FN};
  }
  function accKappa(c,n){
    var Po=(c.TP+c.TN)/n;
    var predPos=c.TP+c.FP, predNeg=c.TN+c.FN, actPos=c.TP+c.FN, actNeg=c.TN+c.FP;
    var Pe=(predPos*actPos+predNeg*actNeg)/(n*n);
    return {acc:Po, kappa:(Po-Pe)/(1-Pe), Pe:Pe};
  }
  function rocCurve(P,Y){
    var thr=[]; var seen={};
    P.forEach(function(p){ if(!seen[p]){seen[p]=1; thr.push(p);} });
    thr.sort(function(a,b){return b-a;}); thr.unshift(1.01); thr.push(-0.01);
    var pts=thr.map(function(t){
      var c=confAt(P,Y,t);
      var sens=c.TP/(c.TP+c.FN), spec=c.TN/(c.TN+c.FP);
      return {thr:t, fpr:1-spec, tpr:sens};
    });
    pts.sort(function(a,b){ return (a.fpr-b.fpr) || (a.tpr-b.tpr); });
    return pts;
  }
  function aucTrap(pts){
    var a=0; for(var i=1;i<pts.length;i++){ var w=pts[i].fpr-pts[i-1].fpr; a+=w*(pts[i].tpr+pts[i-1].tpr)/2; } return a;
  }
  function prCurve(P,Y){
    var idx=[]; for(var i=0;i<P.length;i++) idx.push(i);
    idx.sort(function(a,b){return P[b]-P[a];});
    var tp=0, fp=0, totalPos=Y.reduce(function(s,v){return s+v;},0), pts=[];
    for(i=0;i<idx.length;i++){
      if(Y[idx[i]]===1) tp++; else fp++;
      pts.push({k:i+1, prec:tp/(tp+fp), rec:tp/totalPos});
    }
    return pts;
  }
  var SORTIDX22=(function(){ var idx=[]; for(var i=0;i<N22;i++) idx.push(i); idx.sort(function(a,b){return PA22[b]-PA22[a];}); return idx; })();
  function liftAt(kPct){
    var topN=Math.max(1,Math.round(N22*kPct));
    var topPos=0; for(var i=0;i<topN;i++) if(Y22[SORTIDX22[i]]===1) topPos++;
    var overallRate=POS22/N22, topRate=topPos/topN;
    return {lift: topRate/overallRate, topN:topN, topPos:topPos, topRate:topRate};
  }
  function quantCalib(P,Y,nbins){
    var idx=[]; for(var i=0;i<P.length;i++) idx.push(i);
    idx.sort(function(a,b){return P[a]-P[b];});
    var n=P.length, per=Math.floor(n/nbins), bins=[];
    for(var b=0;b<nbins;b++){
      var s=b*per, e=(b===nbins-1)?n:(b+1)*per, sub=idx.slice(s,e);
      bins.push({ n:sub.length, meanP: mean(sub.map(function(i){return P[i];})), obsRate: mean(sub.map(function(i){return Y[i];})) });
    }
    return bins;
  }
  function bestThreshCost(P,Y,costFN){
    var seen={}, thr=[];
    P.forEach(function(p){ if(!seen[p]){seen[p]=1; thr.push(p);} });
    var best=null;
    thr.forEach(function(t){
      var c=confAt(P,Y,t), cost=c.FP*1+c.FN*costFN;
      if(best===null||cost<best.cost) best={thr:t, cost:cost, c:c};
    });
    return best;
  }

  // ── 22.1 임계값 0.35에서 모델 vs 「항상 정상」 더미 분류기 ──────────────
  var CONF22_MODEL=confAt(PA22,Y22,0.35);
  var CONF22_BASE={TP:0,FP:0,TN:NEG22,FN:POS22};
  var AK22_MODEL=accKappa(CONF22_MODEL,N22), AK22_BASE=accKappa(CONF22_BASE,N22);

  // ── 22.2 ROC ──────────────
  var ROC22_A=rocCurve(PA22,Y22), AUC22_A=aucTrap(ROC22_A);

  // ── 22.3 PR ──────────────
  var PR22_A=prCurve(PA22,Y22);

  // ── 22.4 보정 기준 곡선(모델 A) ──────────────
  var CALIB22_A=quantCalib(PA22,Y22,5);

  // ── 22.5 비용 기준(모델 A vs 모델 C) ──────────────
  var ROC22_C=rocCurve(PC22,Y22), AUC22_C=aucTrap(ROC22_C);

  var scenes = [

  // ══════════ 1. 정확도를 넘어 — 카파 통계량 ══════════
  { id:'bda22_01',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'from sklearn.metrics import (', dim:true},
        {t:'    accuracy_score, cohen_kappa_score)', hl:'cohen_kappa_score'},
        {t:'acc = accuracy_score(y_test, y_pred)', hl:'accuracy_score'},
        {t:'kappa = cohen_kappa_score(y_test, y_pred)', hl:'cohen_kappa_score'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'kappa_score.py', s.step===0?2:3);
      var cur=(s.step===0)?CONF22_BASE:CONF22_MODEL, ak=(s.step===0)?AK22_BASE:AK22_MODEL;
      var lbl=(s.step===0)?'더미 분류기(항상 「정상」)':'실제 모델(임계값 0.35)';
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(lbl+' — 설비 '+N22+'대 중 실제 고장 '+POS22+'대(불균형)', W*0.04, codeBot+20);
      ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('정확도 Po = '+ak.acc.toFixed(3)+'  (='+(cur.TP+cur.TN)+'/'+N22+')', W*0.04, codeBot+42);
      ctx.fillStyle=BLU; ctx.fillText('우연 일치도 Pe = '+ak.Pe.toFixed(3), W*0.04, codeBot+61);
      ctx.fillStyle=(ak.kappa>0.3)?GRN:RED; ctx.fillText('카파 κ = (Po−Pe)/(1−Pe) = '+ak.kappa.toFixed(3), W*0.04, codeBot+80);
      ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
      ctx.fillText('κ=0이면 순전히 우연 수준, κ=1이면 완전 일치', W*0.04, codeBot+100);

      // 2x2 혼동행렬 그리드
      var gx=W*0.49, gy=40, cw=(W*0.965-gx)/2*0.62, ch=52, lab=54;
      ctx.font='11.5px sans-serif'; ctx.textAlign='center'; ctx.fillStyle=TXT;
      ctx.fillText('예측: 정상', gx+lab+cw/2, gy-8);
      ctx.fillText('예측: 고장', gx+lab+cw+8+cw/2, gy-8);
      // 세로 행 라벨: 각 행의 '중앙'에 놓아야 한다(하단 경계에 두면 아래로 밀려 서로·아래 문구와 겹침)
      ctx.save(); ctx.translate(gx+lab/2-6, gy+ch/2); ctx.rotate(-Math.PI/2); ctx.fillText('실제 정상', 0,0); ctx.restore();
      ctx.save(); ctx.translate(gx+lab/2-6, gy+ch+8+ch/2); ctx.rotate(-Math.PI/2); ctx.fillText('실제 고장', 0,0); ctx.restore();
      function cell(x,y,val,col,tag){
        ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.strokeStyle=col; ctx.lineWidth=1.4;
        roundRect(ctx,x,y,cw,ch,6); ctx.fill(); ctx.stroke();
        ctx.fillStyle=col; ctx.font='600 18px ui-monospace,Menlo,monospace'; ctx.textAlign='center';
        ctx.fillText(String(val), x+cw/2, y+ch/2+2);
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.fillText(tag, x+cw/2, y+ch-6);
      }
      cell(gx+lab, gy, cur.TN, GRN, 'TN'); cell(gx+lab+cw+8, gy, cur.FP, RED, 'FP');
      cell(gx+lab, gy+ch+8, cur.FN, RED, 'FN'); cell(gx+lab+cw+8, gy+ch+8, cur.TP, GRN, 'TP');

      var by0=gy+ch*2+34, bw=(W*0.965-gx)*0.42;
      ctx.textAlign='left'; ctx.font='11.5px sans-serif'; ctx.fillStyle=TXT;
      ctx.fillText('정확도 vs 카파 비교(정상: 은색, 고장: 로즈)', gx, by0-8);
      var maxBar=1;
      function bar(x,y,w,frac,col,label){ ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.fillRect(x,y,w,16);
        ctx.fillStyle=col; ctx.fillRect(x,y,w*Math.max(0,frac/maxBar),16);
        ctx.fillStyle=TXT; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText(label, x, y-4); }
      bar(gx, by0+12, W*0.44, AK22_BASE.acc, BLU, '더미 정확도 '+AK22_BASE.acc.toFixed(2));
      bar(gx, by0+42, W*0.44, AK22_MODEL.acc, GLD, '모델 정확도 '+AK22_MODEL.acc.toFixed(2)+' (거의 비슷!)');
      bar(gx, by0+72, W*0.44, Math.max(0,AK22_BASE.kappa), RED, '더미 카파 '+AK22_BASE.kappa.toFixed(2));
      bar(gx, by0+102, W*0.44, Math.max(0,AK22_MODEL.kappa), GRN, '모델 카파 '+AK22_MODEL.kappa.toFixed(2)+' (뚜렷이 다름!)');

      E.tapHint(W/2, H*0.95, '화면 탭 = 더미 분류기 ↔ 실제 모델 전환', true);
      E.big('정확도를 넘어 — 카파 통계량', '설비 '+N22+'대 중 실제 고장은 '+POS22+'대뿐(불균형 데이터)입니다. 「항상 정상」이라고만 답하는 더미 분류기도 정확도 '+AK22_BASE.acc.toFixed(3)+'을 냅니다 — 아무것도 배우지 않았는데도요. 실제 로지스틱 회귀 모델(임계값 0.35)의 정확도는 '+AK22_MODEL.acc.toFixed(3)+'로, 더미보다 겨우 몇 포인트 높아 보입니다. 하지만 <b>카파 통계량</b> κ=(Po−Pe)/(1−Pe)로 「우연히 맞힐 확률」을 걷어내고 보면 얘기가 달라집니다 — 더미의 κ는 정확히 0(예측이 항상 같은 클래스이므로 우연 일치도와 실제 일치도가 같음)인 반면, 모델의 κ는 '+AK22_MODEL.kappa.toFixed(3)+'로 뚜렷이 양의 값을 냅니다. 정확도라는 숫자 하나만 보면 거의 차이가 없어 보이지만, 카파는 모델이 실제로 「우연 이상의 무언가」를 학습했다는 것을 드러냅니다.'); }
  },

  // ══════════ 2. 임계값을 움직이면 — ROC 곡선 ══════════
  { id:'bda22_02',
    enter:function(E){ var self=this;
      self.s={thr:0.35};
      E.controls('<div class="ctrl"><label>분류 임계값</label><input type="range" id="b222t" min="0.02" max="0.95" step="0.01" value="0.35"><output id="b222to">0.35</output></div>');
      E.bind('#b222t','input',function(e){ self.s.thr=+e.target.value; document.getElementById('b222to').textContent=self.s.thr.toFixed(2); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'probs = model.predict_proba(X_test)[:,1]', hl:'predict_proba'},
        {t:'y_pred = (probs >= t)', hl:'>= t'},
        {t:'fpr, tpr, thr = roc_curve(y_test, probs)', hl:'roc_curve'},
        {t:'auc_score = auc(fpr, tpr)', hl:'auc('}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'roc_curve.py', 1);
      var cur=confAt(PA22,Y22,s.thr), sens=cur.TP/(cur.TP+cur.FN), spec=cur.TN/(cur.TN+cur.FP);
      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('t = '+s.thr.toFixed(2)+'  TP='+cur.TP+' FP='+cur.FP+' TN='+cur.TN+' FN='+cur.FN, W*0.04, ry);
      ctx.fillStyle=GRN; ctx.fillText('민감도(재현율) = '+sens.toFixed(3), W*0.04, ry+20);
      ctx.fillStyle=BLU; ctx.fillText('특이도 = '+spec.toFixed(3)+'  (1−특이도 = '+(1-spec).toFixed(3)+')', W*0.04, ry+39);
      ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
      ctx.fillText('임계값을 낮출수록(왼쪽 슬라이더) 민감도↑ 특이도↓', W*0.04, ry+59);
      ctx.font='12.5px ui-monospace,Menlo,monospace'; ctx.fillStyle=RED;
      ctx.fillText('AUC(사다리꼴 적분) = '+AUC22_A.toFixed(3), W*0.04, ry+80);

      var px0=W*0.50, px1=W*0.965, pTop=26, pBot=230;
      function PX(v){ return px0+v*(px1-px0); }
      function PY(v){ return pBot-v*(pBot-pTop); }
      ctx.strokeStyle='rgba(255,255,255,0.28)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.moveTo(px0,pTop); ctx.lineTo(px0,pBot); ctx.stroke();
      ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.setLineDash([3,3]);
      ctx.beginPath(); ctx.moveTo(PX(0),PY(0)); ctx.lineTo(PX(1),PY(1)); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle=BLU; ctx.lineWidth=2.2; ctx.beginPath();
      ROC22_A.forEach(function(p,pi){ var xp=PX(p.fpr), yp=PY(p.tpr); if(pi===0) ctx.moveTo(xp,yp); else ctx.lineTo(xp,yp); });
      ctx.stroke();
      ctx.fillStyle=GLD; ctx.beginPath(); ctx.arc(PX(1-spec),PY(sens),5.5,0,7); ctx.fill();
      ctx.strokeStyle='rgba(255,210,122,0.5)'; ctx.setLineDash([2,3]); ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(PX(1-spec),pBot); ctx.lineTo(PX(1-spec),PY(sens)); ctx.lineTo(px0,PY(sens)); ctx.stroke(); ctx.setLineDash([]);
      ctx.font='11.5px sans-serif'; ctx.textAlign='left'; ctx.fillStyle=TXT;
      ctx.fillText('ROC 곡선: 임계값을 1→0으로 훑을 때 (1−특이도, 민감도)의 궤적', px0, 16);
      ctx.textAlign='center'; ctx.fillStyle=DIM;
      ctx.fillText('1 − 특이도(위양성률)', (px0+px1)/2, pBot+22);
      ctx.save(); ctx.translate(px0-30, (pTop+pBot)/2); ctx.rotate(-Math.PI/2); ctx.fillText('민감도(재현율)', 0,0); ctx.restore();

      E.tapHint(W/2, H*0.95, '슬라이더로 임계값을 움직여 ROC 위의 점이 실제로 이동하는 것을 보세요', true);
      E.big('임계값을 움직이면 — ROC 곡선', '분류기는 확률을 뱉지만 최종 판단은 「임계값 t 이상이면 양성」이라는 규칙으로 내려집니다. 임계값을 1부터 0까지 훑으면서 그때그때의 민감도(재현율)와 1−특이도를 실제로 계산해 점으로 찍으면 ROC 곡선이 됩니다. 지금 t='+s.thr.toFixed(2)+'에서는 민감도 '+sens.toFixed(2)+', 특이도 '+spec.toFixed(2)+'입니다 — 슬라이더를 왼쪽(임계값↓)으로 옮기면 「고장」으로 더 쉽게 판정해 민감도는 오르지만 정상 설비까지 잘못 잡는(위양성) 특이도 손실이 함께 옵니다. 곡선 아래 면적을 사다리꼴 공식으로 실제 적분한 <b>AUC='+AUC22_A.toFixed(3)+'</b>은 「무작위로 고장·정상 한 쌍을 뽑았을 때 모델이 고장 쪽에 더 높은 확률을 줄 확률」과 같습니다 — 임계값 하나를 고정하지 않고 모델 전체의 순위 매기는 능력을 한 숫자로 요약한 것입니다.'); }
  },

  // ══════════ 3. 정밀도-재현율 곡선과 리프트 ══════════
  { id:'bda22_03',
    enter:function(E){ var self=this;
      self.s={k:20};
      E.controls('<div class="ctrl"><label>상위 몇 %를 점검할 것인가</label><input type="range" id="b223k" min="5" max="100" step="5" value="20"><output id="b223ko">20%</output></div>');
      E.bind('#b223k','input',function(e){ self.s.k=+e.target.value; document.getElementById('b223ko').textContent=self.s.k+'%'; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'prec, rec, thr = precision_recall_curve(', hl:'precision_recall_curve'},
        {t:'    y_test, probs)', dim:true},
        {t:'top_k = order_by(probs, desc=True)[:K]', hl:'order_by'},
        {t:'lift = rate_in(top_k) / overall_rate', hl:'lift'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'pr_lift.py', 2);
      var kPct=s.k/100, lf=liftAt(kPct);
      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('상위 '+s.k+'% = 설비 '+lf.topN+'대 점검', W*0.04, ry);
      ctx.fillStyle=GRN; ctx.fillText('그 안의 실제 고장 = '+lf.topPos+'대 ('+(lf.topRate*100).toFixed(1)+'%)', W*0.04, ry+20);
      ctx.fillStyle=BLU; ctx.fillText('전체 고장률 = '+((POS22/N22)*100).toFixed(1)+'%', W*0.04, ry+39);
      ctx.fillStyle=(lf.lift>1.5)?GRN:RED; ctx.font='600 13px ui-monospace,Menlo,monospace';
      ctx.fillText('리프트 = '+lf.lift.toFixed(2)+'배', W*0.04, ry+62);
      ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('(무작위 점검보다 몇 배 더 고장을 잘 골라내는가)', W*0.04, ry+82);

      var px0=W*0.50, px1=W*0.965, pTop=26, pBot=190;
      function PX(v){ return px0+v*(px1-px0); }
      function PY(v){ return pBot-v*(pBot-pTop); }
      ctx.strokeStyle='rgba(255,255,255,0.28)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.moveTo(px0,pTop); ctx.lineTo(px0,pBot); ctx.stroke();
      ctx.strokeStyle=BLU; ctx.lineWidth=2; ctx.beginPath();
      PR22_A.forEach(function(p,pi){ var xp=PX(p.rec), yp=PY(p.prec); if(pi===0) ctx.moveTo(xp,yp); else ctx.lineTo(xp,yp); });
      ctx.stroke();
      var curPt=PR22_A[lf.topN-1];
      ctx.fillStyle=GLD; ctx.beginPath(); ctx.arc(PX(curPt.rec),PY(curPt.prec),5.5,0,7); ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.setLineDash([3,3]); ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,PY(POS22/N22)); ctx.lineTo(px1,PY(POS22/N22)); ctx.stroke(); ctx.setLineDash([]);
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left'; ctx.fillText('기준선(전체 고장률)', px0+4, PY(POS22/N22)-5);
      ctx.font='11.5px sans-serif'; ctx.fillStyle=TXT; ctx.fillText('정밀도-재현율(PR) 곡선', px0, 16);
      ctx.textAlign='center'; ctx.fillStyle=DIM; ctx.fillText('재현율', (px0+px1)/2, pBot+22);
      ctx.save(); ctx.translate(px0-30, (pTop+pBot)/2); ctx.rotate(-Math.PI/2); ctx.fillText('정밀도', 0,0); ctx.restore();

      E.tapHint(W/2, H*0.95, '슬라이더로 점검 비율을 바꿔 리프트가 실제로 바뀌는 것을 보세요', true);
      E.big('정밀도-재현율 곡선과 리프트', '고장이 전체의 '+((POS22/N22)*100).toFixed(0)+'%뿐인 드문 사건일 때는 ROC보다 <b>정밀도-재현율(PR) 곡선</b>이 더 정직합니다 — 특이도는 압도적으로 많은 정상 설비 덕분에 항상 높게 나오기 쉬운 반면, 정밀도는 「양성이라고 판정한 것 중 진짜 양성」의 비율이라 드문 사건 앞에서 훨씬 예민하게 반응합니다. 실무에서 더 와닿는 지표는 <b>리프트</b>입니다 — 확률 순으로 정렬해 상위 '+s.k+'%(설비 '+lf.topN+'대)만 점검한다면, 그 안에 실제 고장이 '+lf.topPos+'대나 들어있어 고장 적중률이 '+(lf.topRate*100).toFixed(1)+'%까지 오릅니다. 이는 전체 평균 고장률('+((POS22/N22)*100).toFixed(1)+'%)의 <b>'+lf.lift.toFixed(2)+'배</b>입니다 — 무작위로 '+s.k+'%를 골라 점검하는 것보다 모델의 순위를 따르는 것이 그만큼 효율적이라는 뜻입니다.'); }
  },

  // ══════════ 4. 확률이 정직한가 — 보정(calibration) ══════════
  { id:'bda22_04',
    enter:function(E){ var self=this;
      self.s={k:1.0};
      E.controls('<div class="ctrl"><label>확률 왜곡 강도 k (1=원래 확률)</label><input type="range" id="b224k" min="1" max="4" step="0.2" value="1"><output id="b224ko">1.0</output></div>');
      E.bind('#b224k','input',function(e){ self.s.k=+e.target.value; document.getElementById('b224ko').textContent=self.s.k.toFixed(1); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var PB=PA22.map(function(p){ var lg=Math.log(p/(1-p)); return sigmoid(s.k*lg); });
      var calibB=quantCalib(PB,Y22,5);
      var code=[
        {t:'bins = quantile_bins(probs, n=5)', hl:'quantile_bins'},
        {t:'for b in bins:', dim:true},
        {t:'    mean_p = probs[b].mean()', hl:'mean_p'},
        {t:'    obs_rate = y_test[b].mean()   # 실제 관측', hl:'obs_rate'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'calibration.py', 3);
      function calErr(bins){ var s2=0,n=0; bins.forEach(function(b){ if(b.n>0){ s2+=Math.abs(b.meanP-b.obsRate); n++; } }); return s2/n; }
      var errA=calErr(CALIB22_A), errB=calErr(calibB);
      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GRN; ctx.fillText('모델 A(금) 평균 보정오차 = '+errA.toFixed(3), W*0.04, ry);
      ctx.fillStyle=(s.k>1.6)?RED:BLU; ctx.fillText('왜곡모델 B(로즈) k='+s.k.toFixed(1)+' 보정오차 = '+errB.toFixed(3), W*0.04, ry+20);
      ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
      ctx.fillText('k>1: 같은 순위를 매기지만(AUC는 그대로) 확률이 0/1로', W*0.04, ry+42);
      ctx.fillText('더 세게 쏠려 「정직하지 않은」 확률이 됩니다', W*0.04, ry+61);
      ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD;
      ctx.fillText('AUC A = AUC B = '+AUC22_A.toFixed(3)+' (순위는 완전히 동일!)', W*0.04, ry+83);

      var px0=W*0.50, px1=W*0.965, pTop=26, pBot=225;
      function PX(v){ return px0+v*(px1-px0); }
      function PY(v){ return pBot-v*(pBot-pTop); }
      ctx.strokeStyle='rgba(255,255,255,0.28)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.moveTo(px0,pTop); ctx.lineTo(px0,pBot); ctx.stroke();
      ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.setLineDash([3,3]);
      ctx.beginPath(); ctx.moveTo(PX(0),PY(0)); ctx.lineTo(PX(1),PY(1)); ctx.stroke(); ctx.setLineDash([]);
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left'; ctx.fillText('완전 보정(y=x)', PX(0.55), PY(0.55)-6);
      function drawCal(bins,col){ ctx.strokeStyle=col; ctx.lineWidth=2; ctx.beginPath(); var started=false;
        bins.forEach(function(b){ if(b.n===0) return; var xp=PX(b.meanP), yp=PY(b.obsRate); if(!started){ctx.moveTo(xp,yp); started=true;} else ctx.lineTo(xp,yp);
          ctx.fillStyle=col; }); ctx.stroke();
        bins.forEach(function(b){ if(b.n===0) return; ctx.fillStyle=col; ctx.beginPath(); ctx.arc(PX(b.meanP),PY(b.obsRate),3.6,0,7); ctx.fill(); });
      }
      drawCal(CALIB22_A,GLD); drawCal(calibB,ROSE);
      ctx.font='11.5px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText('보정 곡선(예측확률 vs 실제 관측 비율, 5구간)', px0, 16);
      ctx.textAlign='center'; ctx.fillStyle=DIM; ctx.fillText('예측 확률(구간 평균)', (px0+px1)/2, pBot+22);
      ctx.save(); ctx.translate(px0-32, (pTop+pBot)/2); ctx.rotate(-Math.PI/2); ctx.fillText('실제 관측 비율', 0,0); ctx.restore();

      E.tapHint(W/2, H*0.95, '슬라이더로 왜곡 강도를 올려 확률이 정직함을 잃는 것을 보세요', true);
      E.big('확률이 정직한가 — 보정(calibration)', '예측 확률 0.8은 정말 「10번 중 8번」 맞아야 정직한 확률입니다. 예측을 확률 크기로 5구간(퀀타일)으로 나눠 각 구간의 평균 예측확률과 <b>실제 관측된 고장 비율을 계산</b>해 대각선(y=x)과 비교하면 이를 검증할 수 있습니다. 모델 A(금)는 대각선에 비교적 가깝게 붙습니다(평균 보정오차 '+errA.toFixed(3)+'). 그런데 같은 순위를 매기는(따라서 <b>AUC는 정확히 같은</b>) 모델의 확률만 로짓 배율 k='+s.k.toFixed(1)+'로 극단으로 밀어붙이면, 낮은 확률 구간에서는 실제보다 훨씬 낮게 예측하고 높은 확률 구간에서는 실제보다 훨씬 높게 예측하는 <b>과신(overconfidence)</b>이 나타나 보정오차가 '+errB.toFixed(3)+'까지 벌어집니다. ROC·AUC는 순위만 보므로 이 차이를 전혀 잡아내지 못합니다 — 「누가 더 위험한지 순서는 맞지만, 그 확률 숫자 자체는 못 믿을」 모델이 있을 수 있다는 뜻입니다.'); }
  },

  // ══════════ 5. 어떤 지표로 고를 것인가 ══════════
  { id:'bda22_05',
    enter:function(E){ var self=this;
      self.s={r:5};
      E.controls('<div class="ctrl"><label>미탐(FN) 비용 / 오탐(FP) 비용</label><input type="range" id="b225r" min="1" max="25" step="1" value="5"><output id="b225ro">5</output></div>');
      E.bind('#b225r','input',function(e){ self.s.r=+e.target.value; document.getElementById('b225ro').textContent=self.s.r; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'for t in thresholds:', dim:true},
        {t:'    cost = FP(t)*1 + FN(t)*cost_ratio', hl:'cost_ratio'},
        {t:'best_t = argmin(costs)', hl:'argmin'},
        {t:'# AUC가 높다고 항상 비용이 낮진 않다', dim:true}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'cost_choice.py', 1);
      var bA=bestThreshCost(PA22,Y22,s.r), bC=bestThreshCost(PC22,Y22,s.r);
      var winner=(bA.cost<bC.cost)?'A(진동+가동시간)':(bA.cost>bC.cost?'C(가동시간만)':'동률');
      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('모델 A  AUC='+AUC22_A.toFixed(3)+'  최적임계값='+bA.thr.toFixed(2)+'  기대비용='+bA.cost.toFixed(0), W*0.04, ry);
      ctx.fillStyle=BLU; ctx.fillText('모델 C  AUC='+AUC22_C.toFixed(3)+'  최적임계값='+bC.thr.toFixed(2)+'  기대비용='+bC.cost.toFixed(0), W*0.04, ry+20);
      ctx.font='13px ui-monospace,Menlo,monospace'; ctx.fillStyle=(winner.indexOf('A')===0)?GRN:(winner.indexOf('C')===0?ROSE:DIM);
      ctx.fillText('→ 이 비용비에서 더 저렴한 모델 = '+winner, W*0.04, ry+45);
      ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('AUC는 A가 항상 더 높지만(순위 능력), 실제 기대비용의', W*0.04, ry+67);
      ctx.fillText('승자는 비용비에 따라 바뀔 수 있습니다', W*0.04, ry+86);

      var px0=W*0.50, px1=W*0.965, pTop=30, pBot=210;
      var maxR=26;
      function PXr(v){ return px0+(v/maxR)*(px1-px0); }
      var maxCost=Math.max(bA.cost,bC.cost)+8;
      var costsA=[],costsC=[];
      for(var r=1;r<=maxR;r++){ costsA.push(bestThreshCost(PA22,Y22,r).cost); costsC.push(bestThreshCost(PC22,Y22,r).cost); }
      var maxCostAll=Math.max.apply(null,costsA.concat(costsC));
      function PYc(v){ return pBot-(v/maxCostAll)*(pBot-pTop); }
      ctx.strokeStyle='rgba(255,255,255,0.28)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.stroke();
      function drawCostCurve(arr,col){ ctx.strokeStyle=col; ctx.lineWidth=2; ctx.beginPath();
        arr.forEach(function(c,ci){ var xp=PXr(ci+1), yp=PYc(c); if(ci===0) ctx.moveTo(xp,yp); else ctx.lineTo(xp,yp); }); ctx.stroke(); }
      drawCostCurve(costsA,GLD); drawCostCurve(costsC,BLU);
      ctx.fillStyle=GLD; ctx.beginPath(); ctx.arc(PXr(s.r),PYc(bA.cost),4.5,0,7); ctx.fill();
      ctx.fillStyle=BLU; ctx.beginPath(); ctx.arc(PXr(s.r),PYc(bC.cost),4.5,0,7); ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.setLineDash([2,3]); ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(PXr(s.r),pTop); ctx.lineTo(PXr(s.r),pBot); ctx.stroke(); ctx.setLineDash([]);
      ctx.font='11.5px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText('비용비별 최적 기대비용: 모델A(금) vs 모델C(파랑)', px0, 16);
      ctx.textAlign='center'; ctx.fillStyle=DIM; ctx.fillText('미탐/오탐 비용비', (px0+px1)/2, pBot+22);

      E.tapHint(W/2, H*0.95, '슬라이더로 비용비를 올려 승자가 실제로 뒤바뀌는 지점을 찾아보세요', true);
      E.big('어떤 지표로 고를 것인가', '모델 A(진동+가동시간)는 AUC='+AUC22_A.toFixed(3)+'로, 가동시간 하나만 쓰는 값싼 모델 C(AUC='+AUC22_C.toFixed(3)+')보다 순위 매기는 능력이 항상 더 좋습니다. 하지만 실제 의사결정은 「미탐(고장을 놓침) 1건의 비용이 오탐(멀쩡한데 점검) 1건의 몇 배인가」로 갈립니다. 이 비용비를 슬라이더로 1부터 25까지 올리면서 두 모델 각각의 최적 임계값에서의 <b>기대비용(FP×1 + FN×비용비)을 실제로 스캔</b>해 보면, 비용비가 낮을 때는 A가 항상 더 저렴하지만 비용비가 대략 16~17을 넘어서면 <b>C가 오히려 더 저렴</b>해지는 역전이 실제로 일어납니다 — AUC라는 한 숫자만 보고 「A가 항상 더 좋은 모델」이라 단정하면, 미탐 비용이 극단적으로 큰 실제 문제(예: 고장을 놓치면 설비 전체가 멈추는 상황)에서 잘못된 선택을 할 수 있습니다. 지표는 문제의 비용 구조·유병률과 함께 골라야 합니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
