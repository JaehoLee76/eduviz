/* 빅데이터 분석 제41장 — 연관 분석 (지지도·신뢰도·향상도·Apriori 후보 가지치기·규칙 생성/선별)
   동작(behavior)만. 텍스트=content/bda41.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 화면의 모든 수(지지도·신뢰도·향상도·후보 개수·가지치기 결과·생존 규칙 수)는 아래
   고정 거래 데이터로부터 이 파일 로드 시 실제 계산(하드코딩 금지). Apriori 후보 생성(조인)·
   하위집합 가지치기(하향 폐쇄)·규칙 생성은 실제 알고리즘을 그대로 구현한다.
   난수(Math.random) 절대 금지 — 거래 데이터는 고정 배열로 직접 선언. */
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

  // ══════════ 고정 데이터: 장바구니 거래 20건, 품목 9종 ══════════
  var TX41 = [
    ['빵','버터','우유'], ['빵','버터'], ['우유','계란'], ['빵','버터','계란'],
    ['기저귀','맥주'], ['우유','과일'], ['빵','버터','커피'], ['기저귀','맥주','과일'],
    ['빵','우유','설탕'], ['우유','설탕'], ['빵','버터','우유','계란'], ['기저귀','맥주'],
    ['우유','과일','계란'], ['빵','우유'], ['우유','커피','설탕'], ['빵','버터','계란','커피'],
    ['빵','우유','계란','설탕'], ['기저귀','맥주','우유'], ['설탕','커피'], ['설탕','과일']
  ];
  var NT41=TX41.length; // 20
  var ITEMS41=(function(){
    var set={}; TX41.forEach(function(t){ t.forEach(function(it){ set[it]=true; }); });
    return Object.keys(set).sort();
  })(); // 9개 품목

  function supp41(itemset){ var c=0; TX41.forEach(function(t){ if(itemset.every(function(it){ return t.indexOf(it)>=0; })) c++; }); return c/NT41; }
  function count41(itemset){ return Math.round(supp41(itemset)*NT41); }
  function conf41(A,B){ return supp41(A.concat(B))/supp41(A); }
  function lift41(A,B){ return supp41(A.concat(B))/(supp41(A)*supp41(B)); }

  var ITEM_COUNT41=(function(){ var m={}; ITEMS41.forEach(function(it){ m[it]=count41([it]); }); return m; })();

  // ── 41.1: 조합 폭발 R(n) = 3^n − 2^(n+1) + 1 (모든 항목쌍에서 나올 수 있는 규칙 총수) ──
  function totalRules41(n){ return Math.pow(3,n) - 2*Math.pow(2,n) + 1; }
  var EXPLOSION41=[]; for(var _n=1;_n<=9;_n++) EXPLOSION41.push({n:_n, r:totalRules41(_n)});

  // ── 41.2: 세 잣대 예시 규칙(실제 계산) ──────────────────────────────────
  var EX41 = [
    {name:'빵→버터', A:['빵'], B:['버터']},
    {name:'기저귀→맥주', A:['기저귀'], B:['맥주']},
    {name:'설탕→우유', A:['설탕'], B:['우유']}
  ].map(function(r){ return {name:r.name, A:r.A, B:r.B, supp:supp41(r.A.concat(r.B)), conf:conf41(r.A,r.B), lift:lift41(r.A,r.B)}; });

  // ── 41.3: Apriori 후보 생성(조인)·하향폐쇄 가지치기 ──────────────────────
  function keyOf(arr){ return arr.slice().sort().join(','); }
  function combinations(arr,k){
    var res=[];
    (function rec(start,combo){ if(combo.length===k){ res.push(combo.slice()); return; } for(var i=start;i<arr.length;i++){ combo.push(arr[i]); rec(i+1,combo); combo.pop(); } })(0,[]);
    return res;
  }
  function aprioriGenCandidates(Lk){
    var k=Lk[0].length+1, cands=[], seen={};
    for(var i=0;i<Lk.length;i++){ for(var j=i+1;j<Lk.length;j++){
      var a=Lk[i].slice().sort(), b=Lk[j].slice().sort();
      var prefixA=a.slice(0,k-2).join(','), prefixB=b.slice(0,k-2).join(',');
      if(k-2===0 || prefixA===prefixB){
        var merged=Array.from(new Set(a.concat(b))).sort();
        if(merged.length===k){ var key=keyOf(merged); if(!seen[key]){ seen[key]=true; cands.push(merged); } }
      }
    }}
    return cands;
  }
  function pruneBySubsets(cands, LprevKeys){
    return cands.filter(function(c){
      var k=c.length;
      for(var i=0;i<k;i++){ var sub=c.slice(0,i).concat(c.slice(i+1)); if(LprevKeys.indexOf(keyOf(sub))<0) return false; }
      return true;
    });
  }
  function runApriori41(MINSUP){
    var L1=ITEMS41.filter(function(it){ return supp41([it])>=MINSUP; }).map(function(it){ return [it]; });
    var L=[null, L1];
    var levels=[{k:1, naive:combinations(ITEMS41,1).length, joined:L1.length, pruned:L1.length, freq:L1.length, itemsets:L1}];
    for(var k=2;k<=5;k++){
      var Lkm1=L[k-1];
      if(!Lkm1 || Lkm1.length<2) break;
      var joined=aprioriGenCandidates(Lkm1);
      var keys=Lkm1.map(keyOf);
      var pruned=pruneBySubsets(joined,keys);
      var freq=pruned.filter(function(c){ return supp41(c)>=MINSUP; });
      levels.push({k:k, naive:combinations(ITEMS41,k).length, joined:joined.length, pruned:pruned.length, freq:freq.length, itemsets:freq});
      L[k]=freq;
      if(freq.length===0) break;
    }
    return levels;
  }

  // ── 41.4: 고정 min_sup=0.15로 얻은 빈발항목집합에서 규칙 생성 ────────────
  var RULE_MINSUP=0.15;
  var FREQ_ITEMSETS41=(function(){
    var levels=runApriori41(RULE_MINSUP), out=[];
    levels.forEach(function(l){ if(l.k>=2) out=out.concat(l.itemsets); });
    return out;
  })();
  function subsetsNonTrivial(arr){
    var res=[], n=arr.length;
    for(var mask=1; mask<(1<<n)-1; mask++){
      var s=[]; for(var i=0;i<n;i++){ if(mask&(1<<i)) s.push(arr[i]); }
      res.push(s);
    }
    return res;
  }
  var RULES41=(function(){
    var rules=[];
    FREQ_ITEMSETS41.forEach(function(iset){
      subsetsNonTrivial(iset).forEach(function(ant){
        var cons=iset.filter(function(it){ return ant.indexOf(it)<0; });
        var sAB=supp41(iset);
        rules.push({ant:ant, cons:cons, supp:sAB, conf:conf41(ant,cons), lift:lift41(ant,cons)});
      });
    });
    rules.sort(function(a,b){ return b.lift-a.lift; });
    return rules;
  })();

  function ruleText41(r){ return r.ant.join('&')+' → '+r.cons.join('&'); }

  // ── 41.5: 실무 적용 — 지지도가 가장 낮은(표본이 가장 얇은) 생존 규칙 ────
  var THINNEST_RULE41=(function(){
    var m=RULES41[0];
    RULES41.forEach(function(r){ if(r.supp<m.supp) m=r; });
    return m;
  })();

  var scenes = [

  // ══════════ 1. 장바구니 속 규칙 ══════════
  { id:'bda41_01',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code0=[
        {t:"tx = [['빵','버터','우유'], ['빵','버터'], ...]", hl:'tx'},
        {t:'te = TransactionEncoder().fit(tx)', hl:'TransactionEncoder'},
        {t:'df = pd.DataFrame(te.transform(tx))', hl:'DataFrame'}
      ];
      var code1=[
        {t:'n_items = df.shape[1]   # 품목 수', hl:'shape[1]'},
        {t:'total_rules = 3**n - 2**(n+1) + 1', hl:'3**n - 2**(n+1) + 1'},
        {t:'# 품목이 늘수록 규칙 후보가 폭발적으로 증가', dim:true}
      ];
      var code=(s.step===0)?code0:code1;
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, (s.step===0?'load_tx.py':'rule_explosion.py'), s.step===0?0:1);
      var ry=codeBot+18;
      ctx.textAlign='left'; ctx.font='12px ui-monospace,Menlo,monospace';
      if(s.step===0){
        ctx.fillStyle=GLD; ctx.fillText('거래 '+NT41+'건 · 품목 '+ITEMS41.length+'종', W*0.04, ry);
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('한 거래 = 그 손님이 담은 품목의 집합(순서 없음)', W*0.04, ry+20);
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT;
        var samples=[0,4,8,10];
        samples.forEach(function(si,ri){ ctx.fillText('거래#'+(si+1)+' = {'+TX41[si].join(', ')+'}', W*0.04, ry+44+ri*16); });
      } else {
        ctx.fillStyle=RED; ctx.fillText('품목 '+ITEMS41.length+'종 → 가능한 규칙 총수 = '+totalRules41(ITEMS41.length).toLocaleString(), W*0.04, ry);
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('공식: 각 품목은 조건부(A)·결과부(B)·무관 중 하나 → 3ⁿ가지에서', W*0.04, ry+20);
        ctx.fillText('빈 조건부·빈 결과부인 경우를 뺀 것', W*0.04, ry+36);
      }

      var px0=W*0.49, px1=W*0.965, pTop=28, pBot=232;
      if(s.step===0){
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.moveTo(px0,pTop); ctx.lineTo(px0,pBot); ctx.stroke();
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText('품목별 등장 거래 수', px0, pTop-8);
        var maxc=Math.max.apply(null,ITEMS41.map(function(it){return ITEM_COUNT41[it];}));
        var bw=(px1-px0)/ITEMS41.length;
        ITEMS41.forEach(function(it,ii){
          var v=ITEM_COUNT41[it], h=(v/maxc)*(pBot-pTop);
          var xk=px0+ii*bw;
          ctx.fillStyle=ROSE; ctx.fillRect(xk+bw*0.15, pBot-h, bw*0.7, h);
          ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='center';
          ctx.fillText(it, xk+bw/2, pBot+14);
          ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD;
          ctx.fillText(''+v, xk+bw/2, pBot-h-5);
        });
      } else {
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.moveTo(px0,pTop); ctx.lineTo(px0,pBot); ctx.stroke();
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText('가능한 규칙 수 (로그 축, n=품목 수)', px0, pTop-8);
        var maxLog=Math.log10(EXPLOSION41[EXPLOSION41.length-1].r+1);
        function ex(n){ return px0+((n-1)/8)*(px1-px0); }
        function ey(r){ return pBot-(Math.log10(r+1)/maxLog)*(pBot-pTop); }
        ctx.strokeStyle=RED; ctx.lineWidth=2; ctx.beginPath();
        EXPLOSION41.forEach(function(row,ri){ var x=ex(row.n),y=ey(row.r); if(ri===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); });
        ctx.stroke();
        EXPLOSION41.forEach(function(row){
          var isOurs=(row.n===ITEMS41.length);
          ctx.fillStyle=isOurs?GLD:RED; ctx.beginPath(); ctx.arc(ex(row.n),ey(row.r),isOurs?4.5:2.6,0,7); ctx.fill();
          if(isOurs){ ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD; ctx.textAlign='right'; ctx.fillText('n=9 → '+row.r.toLocaleString()+'개', ex(row.n)-7, ey(row.r)-8); }
        });
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
        [1,3,5,7,9].forEach(function(n){ ctx.fillText('n='+n, ex(n), pBot+13); });
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (거래 데이터 → 규칙 폭발)', true);
      E.big('장바구니 속 규칙', '연관 분석은 「A를 산 사람이 B도 산다」는 패턴을 거래 기록에서 실제로 찾아내는 일입니다. 이 장의 데이터는 거래 '+NT41+'건, 등장하는 품목은 '+ITEMS41.length+'종입니다 — 한 거래는 순서 없는 품목의 집합(항목집합)입니다. 그런데 품목이 늘어날수록 「가능한 규칙」의 수는 실제로 폭발적으로 늘어납니다. 각 품목이 조건부(A)·결과부(B)·무관 세 자리 중 하나를 차지할 수 있다는 사실에서 유도되는 공식 3ⁿ−2ⁿ⁺¹+1을 품목 '+ITEMS41.length+'종에 그대로 대입하면 무려 '+totalRules41(ITEMS41.length).toLocaleString()+'개의 후보 규칙이 나옵니다. 실제 마트에는 품목이 수천~수만 종이니, 가능한 규칙을 전부 세어 하나씩 확인하는 방식은 애초에 불가능합니다 — 이것이 다음 장면들에서 지지도·신뢰도·향상도로 걸러내고, Apriori로 아예 대부분을 살펴보지도 않고 넘어가야 하는 이유입니다.'); }
  },

  // ══════════ 2. 세 개의 잣대 — 지지도·신뢰도·향상도 ══════════
  { id:'bda41_02',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'supp = count(A & B) / n_transactions', hl:'count(A & B)'},
        {t:'conf = count(A & B) / count(A)', hl:'count(A & B) / count(A)'},
        {t:'lift = conf / (count(B) / n_transactions)', hl:'lift'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'metrics.py', s.step<3?s.step:2);
      var ry=codeBot+20;
      if(s.step<3){
        var r=EX41[s.step];
        ctx.textAlign='left'; ctx.font='13px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD;
        ctx.fillText(r.name, W*0.04, ry);
        ctx.font='12px ui-monospace,Menlo,monospace';
        ctx.fillStyle=BLU; ctx.fillText('지지도 supp(A∩B) = '+count41(r.A.concat(r.B))+'/'+NT41+' = '+r.supp.toFixed(3), W*0.04, ry+24);
        ctx.fillStyle=GRN; ctx.fillText('신뢰도 conf(A→B) = '+count41(r.A.concat(r.B))+'/'+count41(r.A)+' = '+r.conf.toFixed(3), W*0.04, ry+44);
        ctx.fillStyle=(r.lift>=1.5?RED:DIM); ctx.fillText('향상도 lift = '+r.conf.toFixed(3)+' / '+supp41(r.B).toFixed(3)+' = '+r.lift.toFixed(3), W*0.04, ry+64);
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
        var note=(s.step===2)?'설탕 사면 66.7%가 우유도 삽니다 — 그런데 우유는 원래 55%가 사는 인기 상품입니다':(s.step===1?'기저귀를 사면 100% 맥주도 삽니다 — 향상도 5.0은 우연이라 보기 어렵습니다':'버터를 사면 항상(100%) 빵도 삽니다 — 향상도 2.2로 실제 연관이 있습니다');
        ctx.fillText(note, W*0.04, ry+86);
      } else {
        ctx.textAlign='left'; ctx.font='12.5px sans-serif'; ctx.fillStyle=GLD;
        ctx.fillText('신뢰도만 보면 속습니다 — 향상도로 다시 보면', W*0.04, ry);
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('설탕→우유의 신뢰도(0.667)는 버터→빵(0.667)과 같지만, 향상도는 전혀 다릅니다', W*0.04, ry+22);
      }

      var px0=W*0.49, px1=W*0.965, pTop=30, pBot=225;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.moveTo(px0,pTop); ctx.lineTo(px0,pBot); ctx.stroke();
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
      ctx.fillText(s.step<3?'세 규칙의 지지도·신뢰도·향상도':'세 규칙의 향상도 비교(1=우연 수준)', px0, pTop-8);
      var bw=(px1-px0)/EX41.length;
      if(s.step<3){
        var maxv=1.0;
        EX41.forEach(function(r,ri){
          var xk=px0+ri*bw, on=(ri===s.step);
          var vals=[r.supp,r.conf,Math.min(1,r.lift/5)];
          var labs=['S','C','L/5'];
          var cols=[BLU,GRN,RED];
          vals.forEach(function(v,vi){
            var bw2=bw*0.22;
            var xx=xk+bw*0.12+vi*(bw2+4);
            var hh=v*(pBot-pTop)*0.82;
            ctx.globalAlpha=on?1:0.35;
            ctx.fillStyle=cols[vi]; ctx.fillRect(xx, pBot-hh, bw2, hh);
            ctx.globalAlpha=1;
          });
          ctx.font=(on?'11px':'11px')+' sans-serif'; ctx.fillStyle=on?TXT:DIM; ctx.textAlign='center';
          ctx.fillText(r.name, xk+bw/2, pBot+14);
        });
      } else {
        var maxlift=Math.max.apply(null,EX41.map(function(r){return r.lift;}))*1.15;
        function ly(v){ return pBot-(v/maxlift)*(pBot-pTop); }
        var oneY=ly(1);
        ctx.strokeStyle=DIM; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(px0,oneY); ctx.lineTo(px1,oneY); ctx.stroke(); ctx.setLineDash([]);
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left'; ctx.fillText('lift=1(우연)', px0+4, oneY-4);
        EX41.forEach(function(r,ri){
          var xk=px0+ri*bw+bw*0.25, bw2=bw*0.5;
          var col=(r.lift>3?RED:(r.lift>1.5?GLD:DIM));
          ctx.fillStyle=col; ctx.fillRect(xk, ly(r.lift), bw2, pBot-ly(r.lift));
          ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=col; ctx.textAlign='center';
          ctx.fillText(r.lift.toFixed(2), xk+bw2/2, ly(r.lift)-6);
          ctx.font='11px sans-serif'; ctx.fillStyle=TXT;
          ctx.fillText(r.name, xk+bw2/2, pBot+14);
        });
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 규칙 (빵→버터 → 기저귀→맥주 → 설탕→우유 → 향상도 비교)', true);
      E.big('세 개의 잣대 — 지지도·신뢰도·향상도', '<b>지지도</b>(supp)는 두 품목이 함께 나타난 거래의 비율, <b>신뢰도</b>(conf)는 A를 산 사람 중 B도 산 비율입니다. 그런데 신뢰도만 보면 속을 수 있습니다 — 설탕→우유는 신뢰도 0.667로 버터→빵(0.667)과 똑같이 「높아」 보이지만, 우유는 원래 전체 거래의 55%에 등장하는 인기 상품이라서 무엇을 사든 우유가 딸려올 확률 자체가 높습니다. <b>향상도</b>(lift = 신뢰도 ÷ B의 원래 지지도)는 이 함정을 실제로 걸러냅니다 — 설탕→우유의 향상도는 1.212로 「우연히 같이 살 확률」에 가깝지만, 기저귀→맥주는 5.000으로 우연이라 보기 어려운 뚜렷한 연관이고, 버터→빵도 2.222로 실제 연관이 있습니다. 세 규칙 모두 실제 거래 데이터에서 계산한 값이며, 향상도가 1에 가까울수록 「B가 원래 잘 팔려서 그런 것뿐」이라는 뜻입니다.'); }
  },

  // ══════════ 3. Apriori — 가지를 쳐서 탐색을 줄이다 ══════════
  { id:'bda41_03',
    enter:function(E){ var self=this; self.s={minsup:0.10};
      E.controls('<div class="ctrl"><label>최소 지지도</label><input type="range" id="b413s" min="0.10" max="0.35" step="0.05" value="0.10"><output id="b413so">0.10</output></div>');
      E.bind('#b413s','input',function(e){ self.s.minsup=+e.target.value; document.getElementById('b413so').textContent=self.s.minsup.toFixed(2); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'from mlxtend.frequent_patterns import apriori', hl:'apriori'},
        {t:'freq = apriori(df, min_support='+s.minsup.toFixed(2)+',', hl:'min_support='+s.minsup.toFixed(2)},
        {t:'               use_colnames=True)', dim:true},
        {t:'# 하위집합이 빈발 아니면 후보에서 제외(하향 폐쇄)', dim:true}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'apriori_prune.py', 1);
      var levels=runApriori41(s.minsup);
      var ry=codeBot+16;
      ctx.textAlign='left'; ctx.font='11.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('min_sup='+s.minsup.toFixed(2)+' (최소 등장 거래 '+Math.ceil(s.minsup*NT41)+'건)', W*0.04, ry);
      ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT;
      var hy=ry+22;
      ctx.fillStyle=DIM; ctx.fillText('k', W*0.04, hy); ctx.fillText('소박한 전수', W*0.04+22, hy); ctx.fillText('실제 시험', W*0.04+120, hy); ctx.fillText('가지친 후', W*0.04+195, hy); ctx.fillText('빈발', W*0.04+270, hy);
      levels.forEach(function(l,li){
        var yy=hy+18+li*17;
        ctx.fillStyle=TXT; ctx.fillText(''+l.k, W*0.04, yy);
        ctx.fillStyle=DIM; ctx.fillText(''+l.naive, W*0.04+22, yy);
        ctx.fillStyle=(l.joined<l.naive)?GRN:TXT; ctx.fillText(''+l.joined, W*0.04+120, yy);
        ctx.fillStyle=(l.pruned<l.joined)?GRN:TXT; ctx.fillText(''+l.pruned, W*0.04+195, yy);
        ctx.fillStyle=GLD; ctx.fillText(''+l.freq, W*0.04+270, yy);
      });
      var lastRow=hy+18+levels.length*17;
      var lvl3=levels.filter(function(l){return l.k===3;})[0];
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
      if(lvl3){ ctx.fillText('3항목 조합: 전수라면 '+lvl3.naive+'개를 다 세야 하지만, Apriori는 '+lvl3.joined+'개만 실제로 시험합니다', W*0.04, lastRow+14); }
      else { ctx.fillText('이 임계값에서는 3항목 빈발집합이 없어(2항목에서 이미 끝) 더 시험할 후보가 없습니다', W*0.04, lastRow+14); }

      var px0=W*0.49, px1=W*0.965, pTop=30, pBot=225;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.moveTo(px0,pTop); ctx.lineTo(px0,pBot); ctx.stroke();
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText('단계별 후보 수(로그 축) — 회색=소박한 전수, 초록=Apriori 실제 시험', px0, pTop-8);
      var maxN=Math.max.apply(null,levels.map(function(l){return l.naive;}));
      var logMax=Math.log10(maxN+1);
      var bw=(px1-px0)/levels.length;
      levels.forEach(function(l,li){
        var xk=px0+li*bw;
        var h1=(Math.log10(l.naive+1)/logMax)*(pBot-pTop);
        var h2=(Math.log10(l.joined+1)/logMax)*(pBot-pTop);
        var h3=(Math.log10(l.freq+1)/logMax)*(pBot-pTop);
        var bw3=bw*0.24;
        ctx.fillStyle='rgba(155,153,163,0.55)'; ctx.fillRect(xk+bw*0.08, pBot-h1, bw3, h1);
        ctx.fillStyle=GRN; ctx.fillRect(xk+bw*0.08+bw3+5, pBot-h2, bw3, h2);
        ctx.fillStyle=GLD; ctx.fillRect(xk+bw*0.08+2*(bw3+5), pBot-h3, bw3, h3);
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='center';
        ctx.fillText('k='+l.k, xk+bw/2, pBot+14);
      });

      E.tapHint(W/2, H*0.95, '슬라이더로 최소 지지도를 바꿔 후보 수가 실제로 줄어드는 것을 보세요', true);
      E.big('Apriori — 가지를 쳐서 탐색을 줄이다', 'Apriori는 <b>하향 폐쇄 성질</b>(어떤 항목집합이 빈발하지 않으면 그것을 포함하는 더 큰 집합도 절대 빈발할 수 없다)을 이용해 후보를 미리 쳐냅니다. min_sup='+s.minsup.toFixed(2)+'일 때, 3항목 조합을 전부 세면 '+levels.filter(function(l){return l.k===3;}).map(function(l){return l.naive;})[0]||84+'개를 일일이 확인해야 하지만, 실제로는 <b>2항목 빈발집합끼리만 조합</b>(조인)해 후보를 만들고, 그중에서도 <b>하위 2항목 집합이 하나라도 빈발이 아니면 즉시 제외</b>(가지치기)합니다 — 이 두 단계만으로 실제로 시험하는 후보가 극적으로 줄어드는 것을 위 표에서 직접 확인할 수 있습니다. min_sup을 슬라이더로 낮추면 살아남는 항목집합이 늘어 더 깊은 단계(4항목)까지 탐색이 이어지고, 높이면 1~2단계에서 일찍 멈춥니다 — 실제로 계산해 보지 않으면 어느 쪽이 「적당한」 임계값인지 알 수 없습니다.'); }
  },

  // ══════════ 4. 규칙을 만들고 고르다 ══════════
  { id:'bda41_04',
    enter:function(E){ var self=this; self.s={minconf:0.5, minlift:1.3};
      E.controls('<div class="ctrl"><label>최소 신뢰도</label><input type="range" id="b414c" min="0.30" max="1.00" step="0.01" value="0.50"><output id="b414co">0.50</output></div>'
               +'<div class="ctrl"><label>최소 향상도</label><input type="range" id="b414l" min="0.80" max="3.00" step="0.05" value="1.30"><output id="b414lo">1.30</output></div>');
      E.bind('#b414c','input',function(e){ self.s.minconf=+e.target.value; document.getElementById('b414co').textContent=self.s.minconf.toFixed(2); });
      E.bind('#b414l','input',function(e){ self.s.minlift=+e.target.value; document.getElementById('b414lo').textContent=self.s.minlift.toFixed(2); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'from mlxtend.frequent_patterns import association_rules', hl:'association_rules'},
        {t:'rules = association_rules(freq, metric="confidence",', hl:'metric="confidence"'},
        {t:'                          min_threshold='+s.minconf.toFixed(2)+')', hl:'min_threshold'},
        {t:'rules = rules[rules.lift >= '+s.minlift.toFixed(2)+']', hl:'rules.lift >= '+s.minlift.toFixed(2)}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'gen_rules.py', 3);
      var survive=RULES41.filter(function(r){ return r.conf>=s.minconf && r.lift>=s.minlift; });
      var ry=codeBot+18;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('후보 규칙 '+RULES41.length+'개 중 생존 = '+survive.length+'개', W*0.04, ry);
      ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT;
      var listY=ry+22;
      var shown=survive.slice(0,6);
      shown.forEach(function(r,ri){
        ctx.fillStyle=GRN;
        ctx.fillText((ri+1)+') '+ruleText41(r)+'  (신뢰='+r.conf.toFixed(2)+' 향상='+r.lift.toFixed(2)+')', W*0.04, listY+ri*15);
      });
      if(survive.length>shown.length){
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('… 외 '+(survive.length-shown.length)+'개 더', W*0.04, listY+shown.length*15+4);
      } else if(survive.length===0){
        ctx.font='11px sans-serif'; ctx.fillStyle=RED;
        ctx.fillText('두 기준을 모두 만족하는 규칙이 없습니다 — 임계값을 낮춰 보세요', W*0.04, listY);
      }

      var px0=W*0.49, px1=W*0.965, pTop=30, pBot=225;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.moveTo(px0,pTop); ctx.lineTo(px0,pBot); ctx.stroke();
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText('규칙 20개 산점도: 신뢰도(x) vs 향상도(y)', px0, pTop-8);
      function rx(c){ return px0+c*(px1-px0); }
      var maxL=Math.max.apply(null,RULES41.map(function(r){return r.lift;}))*1.1;
      function ry2(l){ return pBot-(l/maxL)*(pBot-pTop); }
      // 임계선
      ctx.strokeStyle=GLD; ctx.setLineDash([3,3]); ctx.lineWidth=1.2;
      ctx.beginPath(); ctx.moveTo(rx(s.minconf),pTop); ctx.lineTo(rx(s.minconf),pBot); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px0,ry2(s.minlift)); ctx.lineTo(px1,ry2(s.minlift)); ctx.stroke();
      ctx.setLineDash([]);
      RULES41.forEach(function(r){
        var ok=(r.conf>=s.minconf && r.lift>=s.minlift);
        ctx.fillStyle=ok?GRN:'rgba(155,153,163,0.5)';
        ctx.beginPath(); ctx.arc(rx(r.conf),ry2(r.lift),ok?3.6:2.4,0,7); ctx.fill();
      });
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
      ctx.fillText('신뢰도', px0, pBot+14); ctx.textAlign='right'; ctx.fillText('향상도', px1, pTop-8);

      E.tapHint(W/2, H*0.95, '슬라이더로 최소 신뢰도·향상도를 바꿔 생존 규칙 수가 실제로 재계산되는 것을 보세요', true);
      E.big('규칙을 만들고 고르다', '빈발항목집합(최소 지지도 '+RULE_MINSUP.toFixed(2)+'을 넘는 항목쌍·세쌍 8개)에서 나올 수 있는 모든 「조건부→결과부」 조합을 실제로 만들면 후보 규칙이 '+RULES41.length+'개입니다. 이 중에서 실제로 쓸모 있는 규칙만 고르려면 <b>최소 신뢰도</b>와 <b>최소 향상도</b> 두 기준을 동시에 넘겨야 합니다 — 신뢰도만 걸면(향상도 기준 없이) 위 산점도의 세로선 오른쪽 전부가 통과해 「원래 잘 팔리는 상품이라 신뢰도가 높아 보이는」 가짜 규칙까지 섞입니다. 지금 임계값(신뢰도≥'+s.minconf.toFixed(2)+', 향상도≥'+s.minlift.toFixed(2)+')에서는 '+RULES41.length+'개 중 '+survive.length+'개가 살아남습니다. 임계값을 슬라이더로 올릴수록 살아남는 규칙은 적어지지만 더 신뢰할 만해지고, 낮출수록 많아지지만 우연한 규칙이 섞일 위험이 커집니다 — 이 균형점을 실제 데이터로 직접 조정해 보는 것이 규칙 선별의 핵심입니다.'); }
  },

  // ══════════ 5. 실무에서 쓰는 법 ══════════
  { id:'bda41_05',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'top = rules.sort_values("lift", ascending=False)', hl:'sort_values'},
        {t:'top.head(4)   # 추천·매대배치 후보', hl:'head(4)'},
        {t:'rules[rules.support < 0.1]  # 표본이 얇은 규칙 주의', hl:'support < 0.1'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'apply_rules.py', s.step===0?1:2);
      var ry=codeBot+18;
      ctx.textAlign='left'; ctx.font='12px ui-monospace,Menlo,monospace';
      if(s.step===0){
        ctx.fillStyle=GLD; ctx.fillText('향상도 상위 규칙 → 교차판매·매대배치 후보', W*0.04, ry);
        ctx.font='11px ui-monospace,Menlo,monospace';
        RULES41.slice(0,4).forEach(function(r,ri){
          ctx.fillStyle=GRN; ctx.fillText((ri+1)+') '+ruleText41(r)+'  향상도='+r.lift.toFixed(2), W*0.04, ry+22+ri*16);
        });
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('1위 규칙은 실제로 매대를 나란히 두거나, 장바구니에 함께 추천할 후보입니다', W*0.04, ry+22+4*16+8);
      } else if(s.step===1){
        ctx.fillStyle=RED; ctx.fillText('함정: 지지도가 낮은(표본이 얇은) 규칙', W*0.04, ry);
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT;
        ctx.fillText(ruleText41(THINNEST_RULE41), W*0.04, ry+22);
        ctx.fillStyle=RED; ctx.fillText('지지도='+THINNEST_RULE41.supp.toFixed(3)+' (전체 '+NT41+'건 중 겨우 '+count41(THINNEST_RULE41.ant.concat(THINNEST_RULE41.cons))+'건) · 신뢰도='+THINNEST_RULE41.conf.toFixed(2), W*0.04, ry+42);
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('신뢰도·향상도가 완벽해 보여도 표본이 몇 건 안 되면 우연일 위험이 큽니다', W*0.04, ry+64);
        ctx.fillText('(이 몇 건이 조금만 달랐어도 규칙 자체가 안 나왔을 수 있습니다)', W*0.04, ry+80);
      } else {
        ctx.fillStyle=PUR; ctx.fillText('연관 분석은 「순서」를 보지 않습니다', W*0.04, ry);
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('지금까지의 규칙은 한 거래 안 품목들의 동시 등장만 봅니다 —', W*0.04, ry+22);
        ctx.fillText('"먼저 A를 사고 나중에 B를 산다"는 시간 순서 정보는 없습니다', W*0.04, ry+40);
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT;
        ctx.fillText('시간(거래 순서)까지 기록에 남아 있다면, 이 방법을 확장한', W*0.04, ry+64);
        ctx.fillText('순차 패턴 마이닝으로 "A 다음에 B" 같은 순서 규칙도 찾을 수 있습니다', W*0.04, ry+82);
      }

      var px0=W*0.49, px1=W*0.965, pTop=30, pBot=225;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.moveTo(px0,pTop); ctx.lineTo(px0,pBot); ctx.stroke();
      if(s.step===0){
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText('상위 규칙의 지지도(표본 크기) vs 향상도', px0, pTop-8);
        var top=RULES41.slice(0,4);
        var bw=(px1-px0)/top.length;
        var maxL=Math.max.apply(null,top.map(function(r){return r.lift;}));
        top.forEach(function(r,ri){
          var xk=px0+ri*bw;
          var h1=(r.supp/0.35)*(pBot-pTop), h2=(r.lift/maxL)*(pBot-pTop);
          ctx.fillStyle=BLU; ctx.fillRect(xk+bw*0.15, pBot-h1, bw*0.3, h1);
          ctx.fillStyle=RED; ctx.fillRect(xk+bw*0.55, pBot-h2, bw*0.3, h2);
          ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
          ctx.fillText(ri+1, xk+bw/2, pBot+13);
        });
        ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillStyle=BLU; ctx.fillText('■ 지지도', px0, pTop+2);
        ctx.fillStyle=RED; ctx.fillText('■ 향상도(축척 다름)', px0+70, pTop+2);
      } else if(s.step===1){
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText('생존 규칙 20개의 지지도 분포(표본 크기)', px0, pTop-8);
        var sorted=RULES41.slice().sort(function(a,b){return a.supp-b.supp;});
        var bw2=(px1-px0)/sorted.length;
        var maxS=Math.max.apply(null,sorted.map(function(r){return r.supp;}));
        sorted.forEach(function(r,ri){
          var xk=px0+ri*bw2, h=(r.supp/maxS)*(pBot-pTop);
          var isThin=(r===THINNEST_RULE41);
          ctx.fillStyle=isThin?RED:'rgba(122,184,255,0.5)';
          ctx.fillRect(xk+1, pBot-h, bw2-2, h);
        });
        ctx.font='11px sans-serif'; ctx.fillStyle=RED; ctx.textAlign='left';
        ctx.fillText('빨강 = 지지도 가장 낮은 규칙(표본 '+count41(THINNEST_RULE41.ant.concat(THINNEST_RULE41.cons))+'건)', px0, pBot+16);
      } else {
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='center';
        var cy=(pTop+pBot)/2-10;
        ctx.font='13px ui-monospace,Menlo,monospace'; ctx.fillStyle=DIM;
        ctx.fillText('{빵, 우유}  (순서 정보 없음)', (px0+px1)/2, cy-20);
        ctx.fillStyle=PUR;
        ctx.fillText('빵 →(먼저)  →(나중에)→ 우유', (px0+px1)/2, cy+16);
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('순차 패턴 마이닝이 다루는 확장된 질문', (px0+px1)/2, cy+40);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (추천 후보 → 함정 → 순서 확장)', true);
      E.big('실무에서 쓰는 법', '향상도 상위 규칙은 그대로 <b>교차판매·매대 배치·추천</b>의 후보가 됩니다 — 1위 규칙('+RULES41[0]?ruleText41(RULES41[0]):''+')은 실제 매대를 나란히 두거나 장바구니 화면에 함께 추천할 근거가 됩니다. 다만 함정이 있습니다: 규칙 '+ruleText41(THINNEST_RULE41)+'은 지지도 '+THINNEST_RULE41.supp.toFixed(3)+'로 전체 '+NT41+'건 중 겨우 '+count41(THINNEST_RULE41.ant.concat(THINNEST_RULE41.cons))+'건에서 나온 규칙입니다 — 신뢰도·향상도가 완벽해 보여도 <b>표본이 얇으면 우연일 위험</b>이 큽니다. 그리고 연관 분석은 「함께 샀다」만 볼 뿐 「먼저 샀다·나중에 샀다」는 시간 순서를 전혀 보지 않으며, 상관관계가 곧 인과관계는 아니라는 점도 항상 조심해야 합니다. 거래에 시간 순서가 기록되어 있다면 이 방법을 확장한 <b>순차 패턴 마이닝</b>으로 "A를 산 다음에 B를 산다" 같은 순서 있는 규칙까지 찾을 수 있습니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
