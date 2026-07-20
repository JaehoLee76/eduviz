/* 빅데이터 분석 제1장 — 데이터 분석 환경과 분석가의 사고법
   동작(behavior)만. 텍스트=content/bda1.json. 엔진 js/engine.js 공유. 색: BDA=핑크/마젠타 테마.
   골든룰: 화면에 표시되는 모든 수치(행·열·결측 개수, 평균·표준편차, 반올림 결과, 시드 비교)는
   파일 상단 고정 데이터 배열로부터 draw에서 실제로 계산함(하드코딩 금지). Math.random()/Date.now() 미사용
   — 시드 비교는 결정적 PRNG(mulberry32, 고정 시드)로 매번 동일하게 재계산.
   왼쪽=진짜 실행 가능한 파이썬 코드 패널(줄커서), 오른쪽=실제 결과/개념 시각화. */
(function(){
  var ACC='#ff7ab8', ACD='#d15591', GLD='#ffd27a', BLU='#7ab8ff', GRN='#7ee0b0', RED='#f0888a', DIM='#9b99a3', TXT='#e8e0c8';

  function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  // 결정적 PRNG(고정 시드) — Math.random()/Date.now() 대신 재현 가능성 데모용
  function mulberry32(seed){
    return function(){
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function sampleInts(seed,count,max){ var rng=mulberry32(seed), out=[]; for(var i=0;i<count;i++) out.push(Math.floor(rng()*max)); return out; }

  // 등폭 코드 패널: lines=[{t,hl?,dim?}|문자열]. hl 토큰만 강조. 핑크 테마.
  function codePanel(E, x, y, w, lines, title, actLine){
    var ctx=E.ctx, lh=21, pad=14, top=y, n=lines.length, ht=n*lh+pad*2+(title?26:0);
    ctx.fillStyle='rgba(255,255,255,0.035)'; ctx.strokeStyle='rgba(255,122,184,0.30)'; ctx.lineWidth=1;
    roundRect(ctx,x,top,w,ht,10); ctx.fill(); ctx.stroke();
    var cy=top+pad+(title?26:0);
    if(title){ ctx.fillStyle=ACC; ctx.font='600 12px ui-monospace,Menlo,monospace'; ctx.textAlign='left'; ctx.fillText(title, x+pad, top+pad+12); }
    ctx.font='13px ui-monospace,Menlo,Consolas,monospace'; ctx.textAlign='left';
    for(var i=0;i<n;i++){
      var L=lines[i], t=(typeof L==='string')?L:L.t, hl=(typeof L==='object')?L.hl:null;
      var ty=cy+i*lh+11;
      if(actLine!=null && i===actLine){ ctx.fillStyle='rgba(255,122,184,0.16)'; ctx.fillRect(x+4, cy+i*lh+1, w-8, lh-2); ctx.fillStyle=ACC; ctx.fillRect(x+4, cy+i*lh+1, 3, lh-2); }
      if(hl && t.indexOf(hl)>=0){
        var a=t.split(hl), pre=a[0], post=a.slice(1).join(hl);
        ctx.fillStyle=DIM; ctx.fillText(pre, x+pad, ty);
        var wpre=ctx.measureText(pre).width;
        ctx.fillStyle=ACC; ctx.fillText(hl, x+pad+wpre, ty);
        var whl=ctx.measureText(hl).width;
        ctx.fillStyle=DIM; ctx.fillText(post, x+pad+wpre+whl, ty);
      } else {
        ctx.fillStyle=(L.dim?DIM:TXT); ctx.fillText(t, x+pad, ty);
      }
    }
    return top+ht;
  }

  function chip(ctx,x,y,w,h,text,col,fs){
    ctx.fillStyle=col.bg; ctx.strokeStyle=col.br; ctx.lineWidth=1.2; roundRect(ctx,x,y,w,h,6); ctx.fill(); ctx.stroke();
    ctx.fillStyle=col.fg; ctx.font='600 '+(fs||13)+'px ui-monospace,Menlo,monospace'; ctx.textAlign='center'; ctx.fillText(text, x+w/2, y+h/2+fs*0.35);
  }

  var scenes = [

  // ══════════ 1. 왜 파이썬으로 데이터를 다루는가 — 수집→정제→분석→전달 ══════════
  { id:'bda1_01', hudOff:true,
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(360+this.s.step*90,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'df = pd.read_csv("scores.csv")   # 수집', hl:'pd.read_csv'},
        {t:'df = df.dropna()                 # 정제', hl:'dropna()'},
        {t:'df.describe(); df.corr()         # 분석', hl:'describe()'},
        {t:'plt.bar(df.index, df.score)      # 전달', hl:'plt.bar'}
      ];
      codePanel(E, W*0.04, H*0.17, W*0.44, code, 'pipeline.py', s.step);

      var stageNames=['수집','정제','분석','전달'], libs=['pandas','pandas','numpy·sklearn','matplotlib'];
      var gx=W*0.52, gw=W*0.44, by=H*0.19, bw=(gw-30)/4, bh=52;
      for(var i=0;i<4;i++){
        var bx=gx+i*(bw+10), on=(i===s.step);
        ctx.fillStyle=on?'rgba(255,122,184,0.18)':'rgba(255,255,255,0.05)'; ctx.strokeStyle=on?ACC:'rgba(255,255,255,0.16)'; ctx.lineWidth=on?2.2:1.2;
        roundRect(ctx,bx,by,bw,bh,9); ctx.fill(); ctx.stroke();
        ctx.fillStyle=on?ACC:'#cfcdc6'; ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.fillText(stageNames[i], bx+bw/2, by+21);
        ctx.fillStyle=DIM; ctx.font='11px ui-monospace,monospace'; ctx.fillText(libs[i], bx+bw/2, by+38);
        if(i<3){ ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(bx+bw+2,by+bh/2); ctx.lineTo(bx+bw+8,by+bh/2); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(bx+bw+4,by+bh/2-4); ctx.lineTo(bx+bw+9,by+bh/2); ctx.lineTo(bx+bw+4,by+bh/2+4); ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.fill(); }
      }

      // 실제 데이터 파이프라인 — 고정 배열로 매 단계 실계산
      var rawScores=[78,85,null,92,67,null,88,74,95,81];
      var cleaned=rawScores.filter(function(v){ return v!=null; });
      var n=cleaned.length, mean=cleaned.reduce(function(a,b){ return a+b; },0)/n;
      var variance=cleaned.reduce(function(a,b){ return a+(b-mean)*(b-mean); },0)/n, std=Math.sqrt(variance);

      var dy=by+bh+50, dx=gx;
      ctx.textAlign='left';
      if(s.step===0){
        ctx.fillStyle=ACC; ctx.font='600 13px sans-serif'; ctx.fillText('학생 10명의 점수를 수집했습니다', dx, dy-14);
        for(var k=0;k<rawScores.length;k++){ var v=rawScores[k], missing=(v==null);
          var cw=Math.min(52,(gw-90)/10), cxk=dx+k*(cw+4);
          chip(ctx,cxk,dy,cw,32, missing?'?':(''+v), missing?{bg:'rgba(240,136,138,0.14)',br:RED,fg:RED}:{bg:'rgba(255,255,255,0.05)',br:'rgba(255,255,255,0.18)',fg:TXT}, 12);
        }
        var nmiss=rawScores.length-n;
        ctx.fillStyle=RED; ctx.font='12.5px sans-serif'; ctx.fillText('결측(빨강) '+nmiss+'건 발견 — 원본 '+rawScores.length+'건 중', dx, dy+52);
      } else if(s.step===1){
        ctx.fillStyle=ACC; ctx.font='600 13px sans-serif'; ctx.fillText('결측을 제거해 정제했습니다', dx, dy-14);
        for(var k2=0;k2<cleaned.length;k2++){ var cw2=Math.min(52,(gw-70)/n), cxk2=dx+k2*(cw2+4);
          chip(ctx,cxk2,dy,cw2,32, ''+cleaned[k2], {bg:'rgba(126,224,176,0.12)',br:GRN,fg:GRN}, 12); }
        ctx.fillStyle=GRN; ctx.font='12.5px sans-serif'; ctx.fillText(rawScores.length+'건 → '+n+'건으로 정리 완료', dx, dy+52);
      } else if(s.step===2){
        ctx.fillStyle=ACC; ctx.font='600 13px sans-serif'; ctx.fillText('정제된 값으로 통계를 계산했습니다', dx, dy-14);
        chip(ctx,dx,dy,gw*0.46,54,'평균 '+mean.toFixed(2), {bg:'rgba(255,122,184,0.10)',br:ACC,fg:ACC}, 16);
        chip(ctx,dx+gw*0.50,dy,gw*0.46,54,'표준편차 '+std.toFixed(2), {bg:'rgba(122,184,255,0.10)',br:BLU,fg:BLU}, 16);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText('df.describe()가 실제로 계산해 돌려주는 값입니다', dx, dy+76);
      } else {
        ctx.fillStyle=ACC; ctx.font='600 13px sans-serif'; ctx.fillText('막대그래프로 결과를 전달합니다', dx, dy-14);
        var bw2=Math.min(40,(gw-70)/n), maxV=Math.max.apply(null,cleaned), chartH=90, baseY=dy+chartH;
        for(var k3=0;k3<cleaned.length;k3++){ var hgt=chartH*(cleaned[k3]/maxV), bx3=dx+k3*(bw2+6);
          ctx.fillStyle='rgba(255,122,184,0.30)'; ctx.strokeStyle=ACC; ctx.lineWidth=1; ctx.fillRect(bx3,baseY-hgt,bw2,hgt); ctx.strokeRect(bx3,baseY-hgt,bw2,hgt);
          ctx.fillStyle=TXT; ctx.font='11px ui-monospace,monospace'; ctx.textAlign='center'; ctx.fillText(cleaned[k3], bx3+bw2/2, baseY+13); }
        var meanY=baseY-chartH*(mean/maxV);
        ctx.strokeStyle=GLD; ctx.lineWidth=1.6; ctx.setLineDash([5,4]); ctx.beginPath(); ctx.moveTo(dx,meanY); ctx.lineTo(dx+n*(bw2+6),meanY); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle=GLD; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('평균선 '+mean.toFixed(1), dx+n*(bw2+6)+6, meanY+4);
      }

      E.tapHint(W/2, H*0.94, '화면 탭 = 다음 단계 (수집 → 정제 → 분석 → 전달)', true);
      E.big('데이터 분석 네 단계 — 그리고 그 자리에 앉은 도구들', '분석은 늘 같은 길을 걷습니다: 데이터를 모으고(수집) · 지저분한 값을 골라내고(정제) · 수를 계산해 패턴을 찾고(분석) · 결과를 사람이 알아보게 보여줍니다(전달). 파이썬은 이 네 자리마다 딱 맞는 도구를 갖고 있습니다 — pandas가 표를 다루고, NumPy가 수치를 계산하고, scikit-learn이 패턴을 학습하고, matplotlib이 그림으로 말합니다.'); }
  },

  // ══════════ 2. 분석 환경과 재현 가능성 ══════════
  { id:'bda1_02', hudOff:true,
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(340+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'# requirements.txt', dim:true},
        {t:'pandas==2.1.4', dim:true},
        {t:'numpy==1.26.2', dim:true},
        {t:'', dim:true},
        {t:'import random', hl:'random'},
        {t:'random.seed(SEED)', hl:'seed(SEED)'},
        {t:'random.sample(range(100), 5)', hl:'sample'}
      ];
      var codeBot=codePanel(E, W*0.04, H*0.17, W*0.44, code, 'env_setup.py', 5);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText('버전을 requirements.txt에 못박고, 가상환경으로 다른 프로젝트와 분리합니다.', W*0.04, codeBot+24);

      var gx=W*0.52, gw=W*0.44;
      var noSeed=(s.step===0);
      var seedA=noSeed?101:42, seedB=noSeed?202:42;
      var sampleA=sampleInts(seedA,5,100), sampleB=sampleInts(seedB,5,100);
      var equal=(JSON.stringify(sampleA)===JSON.stringify(sampleB));

      ctx.fillStyle=ACC; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
      ctx.fillText(noSeed?'SEED를 정하지 않고 두 번 실행':'SEED = 42 로 고정하고 두 번 실행', gx, H*0.19);

      var rowH=64, envs=[{lab:'환경 A',vals:sampleA,seed:seedA},{lab:'환경 B',vals:sampleB,seed:seedB}];
      for(var e=0;e<2;e++){ var ry=H*0.24+e*(rowH+10), env=envs[e];
        ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.strokeStyle=noSeed?'rgba(255,255,255,0.18)':GRN; ctx.lineWidth=1.4; roundRect(ctx,gx,ry,gw,rowH,9); ctx.fill(); ctx.stroke();
        ctx.fillStyle=TXT; ctx.font='600 12.5px sans-serif'; ctx.fillText(env.lab+'  (seed='+env.seed+')', gx+12, ry+18);
        for(var v=0;v<env.vals.length;v++){ var cw=44, cxk=gx+12+v*(cw+6);
          chip(ctx,cxk,ry+26,cw,28,''+env.vals[v], {bg:'rgba(255,255,255,0.05)',br:'rgba(255,255,255,0.2)',fg:TXT}, 12); }
      }
      var cy=H*0.24+2*(rowH+10)+10;
      ctx.fillStyle=equal?'rgba(126,224,176,0.12)':'rgba(240,136,138,0.12)'; ctx.strokeStyle=equal?GRN:RED; ctx.lineWidth=1.6; roundRect(ctx,gx,cy,gw,42,9); ctx.fill(); ctx.stroke();
      ctx.fillStyle=equal?GRN:RED; ctx.font='600 15px sans-serif'; ctx.textAlign='center'; ctx.fillText('환경 A == 환경 B  →  '+(equal?'같음 (재현됨)':'다름 (재현 안 됨)'), gx+gw/2, cy+27);

      E.tapHint(W/2, H*0.94, '화면 탭 = 시드 없음 ↔ 시드 고정 비교', true);
      E.big('재현 가능성 — 같은 코드, 같은 결과를 보장하기', '내 컴퓨터에서 되는데 동료 컴퓨터에서 다른 결과가 나온 적 있나요? 원인은 대개 둘 — 라이브러리 버전이 다르거나, 난수의 씨앗(시드)이 다르기 때문입니다. requirements.txt로 버전을 못박고 random.seed()로 씨앗을 고정하면, 같은 코드는 언제·어디서 돌려도 같은 결과를 냅니다. 재현 가능성은 분석가의 신뢰를 만드는 습관입니다.'); }
  },

  // ══════════ 3. 첫 데이터와 만나기 ══════════
  { id:'bda1_03', hudOff:true,
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(360+this.s.step*80,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var data=[
        {name:'민준', age:16,   score:88.5, city:'서울'},
        {name:'서연', age:17,   score:null, city:'부산'},
        {name:'도윤', age:16,   score:92.0, city:'서울'},
        {name:'하은', age:null, score:79.5, city:'대구'},
        {name:'주원', age:17,   score:85.0, city:'인천'},
        {name:'지우', age:16,   score:91.5, city:'서울'}
      ];
      var cols=['name','age','score','city'];
      var code=[
        {t:'import pandas as pd', hl:'pandas'},
        {t:'df = pd.read_csv("students.csv")', hl:'read_csv'},
        {t:'df.shape', hl:'shape'},
        {t:'df.dtypes', hl:'dtypes'},
        {t:'df.head(3)', hl:'head(3)'},
        {t:'df.isna().sum()', hl:'isna'}
      ];
      var act=[2,3,4,5][s.step];
      codePanel(E, W*0.04, H*0.16, W*0.42, code, 'first_look.py', act);

      // 우측: 실제 표 — 항상 렌더, 단계별로 강조부만 다름
      var tx=W*0.50, ty=H*0.17, tw=W*0.46, colW=tw/cols.length, rh=26;
      ctx.textAlign='left';
      ctx.fillStyle=ACC; ctx.font='600 12px ui-monospace,monospace';
      for(var c=0;c<cols.length;c++) ctx.fillText(cols[c], tx+c*colW+6, ty+15);
      ctx.strokeStyle='rgba(255,122,184,0.4)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(tx,ty+22); ctx.lineTo(tx+tw,ty+22); ctx.stroke();

      function dtypeOf(col){
        var vals=data.map(function(r){ return r[col]; });
        var hasStr=vals.some(function(v){ return typeof v==='string'; });
        if(hasStr) return 'object';
        var hasNull=vals.some(function(v){ return v==null; });
        return hasNull?'float64':'int64';
      }
      var shape=[data.length, cols.length];
      var isnaCount={}; cols.forEach(function(c){ isnaCount[c]=data.filter(function(r){ return r[c]==null; }).length; });
      var totalMissing=cols.reduce(function(a,c){ return a+isnaCount[c]; },0);

      for(var r=0;r<data.length;r++){
        var ry=ty+22+r*rh, dimRow=(s.step===2 && r>=3);
        ctx.globalAlpha=dimRow?0.25:1;
        for(var c2=0;c2<cols.length;c2++){
          var val=data[r][cols[c2]], isNull=(val==null);
          var cellHi=(s.step===3 && isNull);
          if(cellHi){ ctx.fillStyle='rgba(240,136,138,0.18)'; ctx.fillRect(tx+c2*colW, ry, colW, rh); }
          ctx.fillStyle=cellHi?RED:(isNull?DIM:TXT); ctx.font='12.5px ui-monospace,monospace';
          ctx.fillText(isNull?'NaN':(''+val), tx+c2*colW+6, ry+18);
        }
        ctx.globalAlpha=1;
      }
      var tbot=ty+22+data.length*rh;
      ctx.strokeStyle='rgba(255,255,255,0.1)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(tx,tbot); ctx.lineTo(tx+tw,tbot); ctx.stroke();

      var infoY=tbot+30;
      if(s.step===0){
        ctx.fillStyle=ACC; ctx.font='600 16px sans-serif'; ctx.fillText('df.shape  →  ('+shape[0]+', '+shape[1]+')', tx, infoY);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText('행 '+shape[0]+'개(학생 수) · 열 '+shape[1]+'개(항목 수) — 실제로 센 값입니다', tx, infoY+22);
      } else if(s.step===1){
        ctx.fillStyle=ACC; ctx.font='600 13px sans-serif'; ctx.fillText('df.dtypes  →  열마다 자료형이 다릅니다', tx, infoY);
        for(var c3=0;c3<cols.length;c3++){ ctx.fillStyle=BLU; ctx.font='12.5px ui-monospace,monospace'; ctx.fillText(cols[c3]+' : '+dtypeOf(cols[c3]), tx, infoY+22+c3*18); }
      } else if(s.step===2){
        ctx.fillStyle=ACC; ctx.font='600 13px sans-serif'; ctx.fillText('df.head(3)  →  위 3행(강조)만 먼저 확인', tx, infoY);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('전체를 다 보기 전에, 모양이 맞는지 눈으로 빠르게 훑습니다', tx, infoY+20);
      } else {
        ctx.fillStyle=ACC; ctx.font='600 14px sans-serif'; ctx.fillText('df.isna().sum()  →  결측 총 '+totalMissing+'건', tx, infoY);
        for(var c4=0;c4<cols.length;c4++){ ctx.fillStyle=isnaCount[cols[c4]]>0?RED:GRN; ctx.font='12.5px ui-monospace,monospace'; ctx.fillText(cols[c4]+' : '+isnaCount[cols[c4]]+'건', tx, infoY+22+c4*18); }
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = shape → dtypes → head(3) → isna()', true);
      E.big('첫 만남 — 데이터를 읽기 전에 먼저 훑어봅니다', '새 데이터를 받으면 곧장 분석부터 하지 않습니다. shape로 크기를(행·열이 몇 개인지), dtypes로 각 열의 자료형을(숫자인지 글자인지), head()로 처음 몇 줄의 생김새를, isna().sum()으로 빠진 값이 몇 개인지 먼저 확인합니다. 이 네 줄이 모든 분석의 첫 문장입니다.'); }
  },

  // ══════════ 4. 도움말과 문서를 읽는 힘 ══════════
  { id:'bda1_04', hudOff:true,
    enter:function(E){ var self=this; this.s={nd:2};
      E.controls('<div class="ctrl"><label>ndigits</label><input type="range" id="nd" min="-2" max="6" step="1" value="2"><output id="ndo">2</output></div>');
      E.bind('#nd','input',function(e){ self.s.nd=+e.target.value; document.getElementById('ndo').textContent=self.s.nd; E.blip(340+self.s.nd*20,0.06); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'value = 314.159265', hl:'value'},
        {t:'round(value, ndigits)', hl:'ndigits'}
      ];
      var codeBot=codePanel(E, W*0.05, H*0.17, W*0.42, code, 'help_round.py', 1);

      // help(round) 결과를 터미널처럼 — ndigits 토큰 강조
      var hx=W*0.05, hy=codeBot+18, hw=W*0.42, hh=92;
      ctx.fillStyle='rgba(0,0,0,0.28)'; ctx.strokeStyle='rgba(255,255,255,0.14)'; ctx.lineWidth=1; roundRect(ctx,hx,hy,hw,hh,9); ctx.fill(); ctx.stroke();
      for(var d=0;d<3;d++){ ctx.beginPath(); ctx.arc(hx+16+d*15,hy+14,4,0,7); ctx.fillStyle=['#f0888a','#ffd27a','#7ee0b0'][d]; ctx.fill(); }
      ctx.fillStyle=DIM; ctx.font='11.5px ui-monospace,monospace'; ctx.textAlign='left'; ctx.fillText('>>> help(round)', hx+14, hy+34);
      ctx.fillStyle=TXT; ctx.font='12px ui-monospace,monospace';
      var rndPre='round(number, ', rndHl='ndigits', rndPost='=None)';
      ctx.fillText(rndPre, hx+14, hy+52);
      var rndWpre=ctx.measureText(rndPre).width;
      ctx.fillStyle=ACC; ctx.fillText(rndHl, hx+14+rndWpre, hy+52);
      var rndWhl=ctx.measureText(rndHl).width;
      ctx.fillStyle=TXT; ctx.fillText(rndPost, hx+14+rndWpre+rndWhl, hy+52);
      ctx.fillStyle=DIM; ctx.fillText('Round a number to a given precision', hx+14, hy+68);
      ctx.fillText('in decimal digits (default: nearest int).', hx+14, hy+82);

      // 실제 계산: value를 ndigits 자리로 반올림 (JS로 실계산, 음수 ndigits도 지원)
      var value=314.159265, f=Math.pow(10,s.nd), result=Math.round(value*f)/f;

      var gx=W*0.53, gw=W*0.43;
      ctx.fillStyle=ACC; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('인자 하나가 결과를 어떻게 바꾸나', gx, H*0.19);
      chip(ctx,gx,H*0.23,gw,58, 'round(314.159265, '+s.nd+')  →  '+result, {bg:'rgba(255,122,184,0.10)',br:ACC,fg:ACC}, 15);

      // 자릿수 눈금: ndigits 위치를 실제 문자열에서 하이라이트
      var digits='314.159265';
      var dot=digits.indexOf('.');
      ctx.font='20px ui-monospace,monospace'; ctx.textAlign='left';
      var dxs=gx, dys=H*0.40;
      for(var i=0;i<digits.length;i++){
        var isDot=(digits[i]==='.');
        // pe = 자릿값 지수(0=일의자리,1=십의자리,...,-1=소수첫째자리,...) — round(value,ndigits)는 pe===-ndigits 자리를 반올림
        var pe = isDot?null : (i<dot ? (dot-1-i) : -(i-dot));
        var hi = (!isDot && pe===-s.nd);
        ctx.fillStyle = hi? ACC : (isDot?DIM:TXT);
        ctx.fillText(digits[i], dxs, dys);
        dxs += ctx.measureText(digits[i]).width+2;
      }
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('ndigits='+s.nd+' 이 가리키는 자리(강조)에서 반올림합니다', gx, dys+26);

      ctx.fillStyle=ACC; ctx.font='600 13px sans-serif'; ctx.fillText('문서를 읽는 습관', gx, H*0.56);
      var habits=['① 시그니처부터: 인자가 몇 개, 이름이 뭔지','② 기본값 확인: 안 적으면 무슨 값이 들어가는지','③ 반환 타입: int·float·None 중 무엇을 돌려주는지','④ 작은 예시로 직접 실행해 눈으로 확인'];
      for(var hI=0;hI<habits.length;hI++){ ctx.fillStyle='#cfcdc6'; ctx.font='12.5px sans-serif'; ctx.fillText(habits[hI], gx, H*0.60+hI*20); }

      E.tapHint(W/2, H*0.94, '슬라이더로 ndigits를 바꿔, 반올림 결과가 실시간으로 바뀌는 걸 보세요', true);
      E.big('문서를 읽는 힘 — 모르는 함수를 두려워하지 않기', '처음 보는 함수를 만나면 help()나 물음표(?)로 시그니처와 독스트링을 먼저 읽습니다. round(number, ndigits=None)처럼 괄호 안 각 인자가 결과를 어떻게 바꾸는지 — 슬라이더로 ndigits를 움직여 직접 확인해 보세요. 양수는 소수 자리, 0은 정수, 음수는 십·백의 자리까지 반올림합니다. 문서를 읽는 습관이 곧 실력입니다.'); }
  },

  // ══════════ 5. 분석가의 사고법 — 질문에서 전달까지, 그리고 이 여정 ══════════
  { id:'bda1_05', hudOff:true,
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'def analyze(question):', hl:'question'},
        {t:'    data = collect(question)     # 질문→데이터', hl:'collect'},
        {t:'    guess = hypothesize(data)    # 데이터→가설', hl:'hypothesize'},
        {t:'    result = test(guess)         # 가설→검증', hl:'test'},
        {t:'    report(result)               # 검증→전달', hl:'report'},
        {t:'    return result', hl:''}
      ];
      codePanel(E, W*0.04, H*0.15, W*0.44, code, 'analyst_mind.py', s.step);

      var labels=['질문','데이터','가설','검증','전달'];
      var descs=[
        '"무엇이 궁금한가?" — 막연한 호기심을 구체적인 질문으로.',
        '질문에 답할 만한 데이터를 모읍니다.',
        '데이터를 보며 "혹시 이런 패턴 아닐까?" 짐작합니다.',
        '통계·모델로 그 짐작이 맞는지 실제로 확인합니다.',
        '확인된 결과를 남이 이해할 수 있게 전달합니다.'
      ];
      var gx=W*0.54, gw=W*0.42, cx=gx+gw*0.5, cy=H*0.30, rad=Math.min(gw,H*0.30)*0.34;
      for(var i=0;i<5;i++){
        var ang=-Math.PI/2 + i*(2*Math.PI/5), nx=cx+rad*Math.cos(ang), ny=cy+rad*Math.sin(ang), on=(i===s.step);
        var nxt=(i+1)%5, ang2=-Math.PI/2+nxt*(2*Math.PI/5), nx2=cx+rad*Math.cos(ang2), ny2=cy+rad*Math.sin(ang2);
        ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(nx,ny); ctx.lineTo(nx2,ny2); ctx.stroke();
      }
      for(var j=0;j<5;j++){
        var ang3=-Math.PI/2 + j*(2*Math.PI/5), px=cx+rad*Math.cos(ang3), py=cy+rad*Math.sin(ang3), on2=(j===s.step);
        ctx.fillStyle=on2?ACC:'rgba(255,255,255,0.08)'; ctx.strokeStyle=on2?ACC:'rgba(255,255,255,0.22)'; ctx.lineWidth=on2?2.2:1.2;
        ctx.beginPath(); ctx.arc(px,py,on2?27:22,0,Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.fillStyle=on2?'#1a1015':'#cfcdc6'; ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.fillText(labels[j], px, py+5);
      }
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('순환', cx, cy+4);

      var descY=H*0.30+rad+50;
      ctx.fillStyle=ACC; ctx.font='600 13.5px sans-serif'; ctx.textAlign='left'; ctx.fillText(labels[s.step]+' 단계', gx, descY);
      ctx.fillStyle=TXT; ctx.font='12.5px sans-serif'; ctx.fillText(descs[s.step], gx, descY+20);

      // 여정 로드맵 — 현재 위치를 실제 비율로 계산해 표시
      var total=31, cur=1, pct=(cur/total*100).toFixed(1);
      var stages=[{lab:'초급',rng:'1~4장'},{lab:'중급',rng:'5~7장'},{lab:'고급',rng:'8~11장'},{lab:'심화 예측모델링',rng:'12~31장'}];
      var ry2=descY+42, rw=gw, sw=rw/4;
      for(var k=0;k<4;k++){ var rx=gx+k*sw, curHere=(k===0);
        ctx.fillStyle=curHere?'rgba(255,122,184,0.16)':'rgba(255,255,255,0.05)'; ctx.strokeStyle=curHere?ACC:'rgba(255,255,255,0.16)'; ctx.lineWidth=curHere?2:1;
        roundRect(ctx,rx+3,ry2,sw-6,40,7); ctx.fill(); ctx.stroke();
        ctx.fillStyle=curHere?ACC:'#cfcdc6'; ctx.font='600 11.5px sans-serif'; ctx.textAlign='center'; ctx.fillText(stages[k].lab, rx+sw/2, ry2+17);
        ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.fillText(stages[k].rng, rx+sw/2, ry2+32);
      }
      ctx.fillStyle=ACC; ctx.font='600 12px sans-serif'; ctx.textAlign='left'; ctx.fillText('지금 여기 — 전체 '+total+'장 중 '+cur+'장 ('+pct+'%)', gx, ry2+58);

      E.tapHint(W/2, H*0.94, '화면 탭 = 순환 단계 이동 (질문 → 전달 → 다시 질문)', true);
      E.big('분석가의 사고법 — 질문에서 전달로, 그리고 다시 질문으로', '진짜 분석은 코드를 치는 순간이 아니라 좋은 질문에서 시작합니다. 질문 → 데이터 → 가설 → 검증 → 전달, 이 다섯 걸음은 한 번으로 끝나지 않고 전달한 결과가 다시 새 질문을 낳으며 순환합니다. 앞으로 이 트랙은 표를 다루는 기초(초급)에서 시각화·통계(중급), 회귀·분류 모델(고급), 그리고 현업 수준의 예측 모델링(심화)까지 이 순환을 점점 더 정교하게 도는 여정입니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
