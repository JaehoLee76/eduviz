/* 빅데이터 분석 제43장 — 텍스트 마이닝 (전처리·TF-IDF·코사인 유사도·토픽 모델링·감성 분석)
   동작(behavior)만. 텍스트=content/bda43.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 화면의 모든 수(토큰·어휘 수·TF·IDF·코사인 유사도·유클리드 거리·토픽 분포·감성 점수·
   정확도)는 아래 고정 문서 8편으로부터 이 파일 로드 시 실제 계산(하드코딩 금지). 토큰화·불용어
   제거·간이 어간추출·TF-IDF·코사인 유사도·LDA(collapsed Gibbs 표집)·사전기반 감성·나이브베이즈
   교차검증은 실제 알고리즘을 그대로 구현한다. 난수(Math.random) 절대 금지 — LDA 초기화·표집은
   고정 시드 LCG. */
(function(){
  var ROSE='#ff7ab8', GRN='#7ee0b0', BLU='#7ab8ff', GLD='#ffd27a', DIM='#9b99a3', RED='#f0888a', TXT='#eadfe8';

  function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function codePanel(E, x, y, w, lines, title, actLine){
    var ctx=E.ctx, lh=17, pad=10, top=y, n=lines.length, ht=n*lh+pad*2+(title?20:0);
    ctx.fillStyle='rgba(255,255,255,0.035)'; ctx.strokeStyle='rgba(255,122,184,0.30)'; ctx.lineWidth=1;
    roundRect(ctx,x,top,w,ht,10); ctx.fill(); ctx.stroke();
    var cy=top+pad+(title?20:0);
    if(title){ ctx.fillStyle=ROSE; ctx.font='600 11px ui-monospace,Menlo,monospace'; ctx.textAlign='left'; ctx.fillText(title, x+pad, top+pad+10); }
    ctx.font='11.5px ui-monospace,Menlo,Consolas,monospace'; ctx.textAlign='left';
    for(var i=0;i<n;i++){
      var L=lines[i], t=(typeof L==='string')?L:L.t, hl=(typeof L==='object')?L.hl:null;
      var ty=cy+i*lh+10;
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

  function mean(a){ var s=0,i; for(i=0;i<a.length;i++) s+=a[i]; return s/a.length; }
  function LCG(seed){ var s=seed>>>0; return function(){ s=(1103515245*s+12345)>>>0; return s/4294967296; }; }

  // ══════════ 고정 데이터: 짧은 영어 문서 8편(영화평) ══════════
  var DOCS_RAW43=[
    'The movie was absolutely wonderful and the acting was great',
    'The acting was terrible and the movie was boring',
    'Wonderful actors and great acting made this movie exciting',
    'The plot was boring and the ending was predictable',
    'A great movie with wonderful music and exciting scenes',
    'Terrible plot terrible acting and a boring ending overall',
    'The music was not bad but the story felt predictable',
    'An exciting and wonderful film with surprising endings'
  ];
  var LABELS43=[1,0,1,0,1,0,0,1];   // 사람이 미리 매긴 정답 라벨(1=긍정,0=부정) — 훈련·평가용
  var Ndoc43=DOCS_RAW43.length;
  var STOP43=['the','a','an','and','was','with','but','not','this','made','felt','overall','of','is','in','on','to'];

  // ── 전처리 파이프라인 ──────────────────────────────────────────────
  function tokenizeRaw(s){ return s.match(/[A-Za-z]+/g)||[]; }
  function stem43(w){
    var s=w;
    if(/ies$/.test(s)&&s.length>5) s=s.slice(0,-3)+'y';
    else if(/es$/.test(s)&&s.length>4) s=s.slice(0,-2);
    else if(/s$/.test(s)&&!/ss$/.test(s)&&s.length>3) s=s.slice(0,-1);
    if(/ing$/.test(s)&&s.length>5) s=s.slice(0,-3);
    else if(/ed$/.test(s)&&s.length>4) s=s.slice(0,-2);
    if(/ly$/.test(s)&&s.length>4) s=s.slice(0,-2);
    return s;
  }
  var STAGE0=DOCS_RAW43.map(tokenizeRaw);
  var STAGE1=STAGE0.map(function(toks){ return toks.map(function(t){ return t.toLowerCase(); }); });
  var STAGE2=STAGE1.map(function(toks){ return toks.filter(function(t){ return STOP43.indexOf(t)<0; }); });
  var STAGE3=STAGE2.map(function(toks){ return toks.map(stem43); });
  var PIPE_STAGES=[
    {name:'토큰화', toks:STAGE0},
    {name:'소문자화', toks:STAGE1},
    {name:'불용어 제거', toks:STAGE2},
    {name:'어간 추출', toks:STAGE3}
  ];
  function tokenCount(tokLists){ return tokLists.reduce(function(s,toks){ return s+toks.length; },0); }
  function vocabSize(tokLists){ var set={}; tokLists.forEach(function(toks){ toks.forEach(function(t){ set[t]=1; }); }); return Object.keys(set).length; }

  var VOCAB43=(function(){ var set={}; STAGE3.forEach(function(toks){ toks.forEach(function(t){ set[t]=1; }); }); return Object.keys(set).sort(); })();
  function docTermCounts(toks){ var m={}; toks.forEach(function(t){ m[t]=(m[t]||0)+1; }); return VOCAB43.map(function(v){ return m[v]||0; }); }
  var DTM43=STAGE3.map(docTermCounts);

  // ── TF-IDF ──────────────────────────────────────────────
  var DF43=VOCAB43.map(function(v,vi){ return DTM43.reduce(function(s,row){ return s+(row[vi]>0?1:0); },0); });
  var IDF43=DF43.map(function(df){ return Math.log((1+Ndoc43)/(1+df))+1; });
  var TFIDF43=DTM43.map(function(row){ return row.map(function(c,vi){ return c*IDF43[vi]; }); });

  // ── 코사인 유사도 / 유클리드 거리 ──────────────────────────────────────────────
  function cosine(a,b){ var dot=0,na=0,nb=0; for(var i=0;i<a.length;i++){ dot+=a[i]*b[i]; na+=a[i]*a[i]; nb+=b[i]*b[i]; } return (na===0||nb===0)?0:dot/(Math.sqrt(na)*Math.sqrt(nb)); }
  function euclid(a,b){ var s=0; for(var i=0;i<a.length;i++){ var d=a[i]-b[i]; s+=d*d; } return Math.sqrt(s); }
  var COSMAT43=DOCS_RAW43.map(function(_,i){ return DOCS_RAW43.map(function(_,j){ return cosine(TFIDF43[i],TFIDF43[j]); }); });
  var BEST_PAIR43=(function(){ var best={i:0,j:1,v:-1}; for(var i=0;i<Ndoc43;i++) for(var j=i+1;j<Ndoc43;j++){ if(COSMAT43[i][j]>best.v) best={i:i,j:j,v:COSMAT43[i][j]}; } return best; })();
  var SELFDOC43=BEST_PAIR43.i;
  var DOUBLED43=TFIDF43[SELFDOC43].map(function(v){ return v*2; });
  var EUC_SELF43=euclid(TFIDF43[SELFDOC43],DOUBLED43);
  var COS_SELF43=cosine(TFIDF43[SELFDOC43],DOUBLED43);

  // ── 토픽 모델링: LDA(collapsed Gibbs 표집, K=2) ──────────────────────────────────────────────
  var K43=2, ALPHA43=0.5, BETA43=0.1, V43=VOCAB43.length;
  var TOKEN_DOCS43=STAGE3.map(function(toks){ return toks.map(function(t){ return VOCAB43.indexOf(t); }); });
  var LDA_RESULT43=(function(){
    var rng=LCG(431177);
    var docTopicCount=[]; for(var d=0;d<Ndoc43;d++) docTopicCount.push(new Array(K43).fill(0));
    var topicWordCount=[]; for(var k=0;k<K43;k++) topicWordCount.push(new Array(V43).fill(0));
    var topicTotal=new Array(K43).fill(0);
    var assign=[];
    TOKEN_DOCS43.forEach(function(wids,dd){
      var a=[];
      wids.forEach(function(w){
        var k=rng()<0.5?0:1;
        a.push(k); docTopicCount[dd][k]++; topicWordCount[k][w]++; topicTotal[k]++;
      });
      assign.push(a);
    });
    var NITER=400;
    for(var it=0;it<NITER;it++){
      for(var dd2=0;dd2<Ndoc43;dd2++){
        var wids=TOKEN_DOCS43[dd2];
        for(var i=0;i<wids.length;i++){
          var w=wids[i], k=assign[dd2][i];
          docTopicCount[dd2][k]--; topicWordCount[k][w]--; topicTotal[k]--;
          var probs=[], sum=0;
          for(var kk=0;kk<K43;kk++){
            var p=(docTopicCount[dd2][kk]+ALPHA43)*(topicWordCount[kk][w]+BETA43)/(topicTotal[kk]+V43*BETA43);
            probs.push(p); sum+=p;
          }
          var r=rng()*sum, acc=0, newK=K43-1;
          for(kk=0;kk<K43;kk++){ acc+=probs[kk]; if(r<=acc){ newK=kk; break; } }
          assign[dd2][i]=newK; docTopicCount[dd2][newK]++; topicWordCount[newK][w]++; topicTotal[newK]++;
        }
      }
    }
    var theta=docTopicCount.map(function(row){ var s=row.reduce(function(a2,b2){ return a2+b2; },0)+K43*ALPHA43; return row.map(function(c){ return (c+ALPHA43)/s; }); });
    var phi=topicWordCount.map(function(row,k){ var s=topicTotal[k]+V43*BETA43; return row.map(function(c){ return (c+BETA43)/s; }); });
    return {theta:theta, phi:phi};
  })();
  var TOPWORDS43=LDA_RESULT43.phi.map(function(row){
    var idxs=row.map(function(v,i){ return i; });
    idxs.sort(function(a,b){ return row[b]-row[a]; });
    return idxs.slice(0,5).map(function(i){ return {word:VOCAB43[i], p:row[i]}; });
  });

  // ── 감성 분석: 사전 기반 + 나이브베이즈 ──────────────────────────────────────────────
  var LEX43={wonderful:3, great:3, exciting:2, terrible:-3, boring:-2, predictable:-1, bad:-2, surprising:1, good:2};
  var NEGATORS43=['not','never','no'];
  function tokenizeSimple(s){ return (s.toLowerCase().match(/[a-z']+/g))||[]; }
  function lexiconScore(sentence, useNegation){
    var toks=tokenizeSimple(sentence), score=0;
    for(var i=0;i<toks.length;i++){
      var w=toks[i];
      if(LEX43.hasOwnProperty(w)){
        var val=LEX43[w];
        if(useNegation){
          for(var b=1;b<=3;b++){ if(i-b>=0 && NEGATORS43.indexOf(toks[i-b])>=0){ val=-val; break; } }
        }
        score+=val;
      }
    }
    return score;
  }
  function nbTrain(trainIdxs){
    var vocabSet={};
    trainIdxs.forEach(function(i){ tokenizeSimple(DOCS_RAW43[i]).forEach(function(w){ vocabSet[w]=1; }); });
    var vocab=Object.keys(vocabSet);
    var wordCount={0:{},1:{}}, totalWords={0:0,1:0}, classCount={0:0,1:0};
    trainIdxs.forEach(function(i){
      var lab=LABELS43[i], toks=tokenizeSimple(DOCS_RAW43[i]);
      classCount[lab]++;
      toks.forEach(function(w){ wordCount[lab][w]=(wordCount[lab][w]||0)+1; totalWords[lab]++; });
    });
    return {vocab:vocab, wordCount:wordCount, totalWords:totalWords, classCount:classCount, V:vocab.length, nTrain:trainIdxs.length};
  }
  function nbPredict(model, sentence){
    var toks=tokenizeSimple(sentence), scores={};
    [0,1].forEach(function(c){
      var logp=Math.log((model.classCount[c]||1e-9)/model.nTrain);
      toks.forEach(function(w){
        var cnt=(model.wordCount[c][w]||0);
        var p=(cnt+1)/(model.totalWords[c]+model.V);
        logp+=Math.log(p);
      });
      scores[c]=logp;
    });
    return scores[1]>scores[0]?1:0;
  }
  var NB_LOO43=DOCS_RAW43.map(function(_,i){
    var trainIdxs=[]; for(var j=0;j<Ndoc43;j++) if(j!==i) trainIdxs.push(j);
    return nbPredict(nbTrain(trainIdxs), DOCS_RAW43[i]);
  });
  var TRAP43=[
    {text:'This movie was not terrible', trueLab:1},
    {text:'Oh great, another boring predictable ending', trueLab:0}
  ];
  var NB_FULL43=nbTrain([0,1,2,3,4,5,6,7]);
  var TRAP_NB43=TRAP43.map(function(t){ return nbPredict(NB_FULL43, t.text); });

  var scenes = [

  // ══════════ 1. 문서가 행렬이 되기까지 ══════════
  { id:'bda43_01',
    enter:function(E){ this.s={stage:0}; E.setOn([]); },
    tap:function(E){ this.s.stage=(this.s.stage+1)%4; E.blip(360+this.s.stage*60,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'tokens = re.findall(r"[A-Za-z]+", doc.lower())', hl:'re.findall'},
        {t:'tokens = [w for w in tokens if w not in STOPWORDS]', hl:'STOPWORDS'},
        {t:'tokens = [stemmer.stem(w) for w in tokens]', hl:'.stem('}
      ];
      var actLine = s.stage<=1?0:(s.stage===2?1:2);
      var codeBot=codePanel(E, W*0.04, 10, W*0.44, code, 'preprocess.py', actLine);
      var st=PIPE_STAGES[s.stage];
      var tc=tokenCount(st.toks), vc=vocabSize(st.toks);
      var ry=codeBot+16;
      ctx.textAlign='left'; ctx.font='12px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText(st.name+' 후: 토큰 '+tc+'개, 서로 다른 단어(어휘) '+vc+'개', W*0.04, ry);

      var bx0=W*0.04, bx1=W*0.46, by0=ry+30, bh=Math.min(140,H-by0-32), bw=(bx1-bx0)/4;
      ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.moveTo(bx0,by0+bh); ctx.lineTo(bx1,by0+bh); ctx.stroke();
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText('단계별 남은 토큰 수(연한)·어휘 수(진한)', bx0, by0-6);
      var maxTc=tokenCount(PIPE_STAGES[0].toks);
      PIPE_STAGES.forEach(function(row,ri){
        var xk=bx0+ri*bw, tcR=tokenCount(row.toks), vcR=vocabSize(row.toks);
        var h1=(tcR/maxTc)*bh, h2=(vcR/maxTc)*bh;
        ctx.fillStyle=BLU; ctx.globalAlpha=0.35; ctx.fillRect(xk+bw*0.12, by0+bh-h1, bw*0.32, h1); ctx.globalAlpha=1;
        ctx.fillStyle=BLU; ctx.fillRect(xk+bw*0.52, by0+bh-h2, bw*0.32, h2);
        if(ri===s.stage){ ctx.strokeStyle=RED; ctx.lineWidth=1.4; ctx.strokeRect(xk+1,by0-2,bw-2,bh+4); }
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='center'; ctx.fillText(row.name, xk+bw/2, by0+bh+14);
      });

      var px0=W*0.50, px1=W*0.965, pTop=16, pBot=H-16;
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
      ctx.fillText(st.name+' 이후 각 문서의 토큰', px0, pTop+10);
      var ly=pTop+28, lh2=Math.min(26,(pBot-ly)/8);
      DOCS_RAW43.forEach(function(_,di){
        var toks=st.toks[di];
        var line='D'+(di+1)+': '+toks.join(' ');
        if(line.length>52) line=line.slice(0,50)+'…';
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=(di%2===0)?TXT:DIM;
        ctx.fillText(line, px0, ly+di*lh2);
      });

      E.tapHint(W/2, H*0.95, '화면 탭 = 토큰화 → 소문자화 → 불용어 제거 → 어간 추출', true);
      E.big('문서가 행렬이 되기까지', '컴퓨터는 문장을 그대로 이해하지 못하니, <b>토큰화</b>(단어 단위로 쪼개기) → <b>소문자화</b> → <b>불용어 제거</b>(the·was처럼 뜻을 거의 안 싣는 단어를 뺌) → <b>어간 추출</b>(acting→act처럼 어미를 깎아 같은 뜻의 변형을 하나로 합침) 순서로 다듬어 숫자 행렬로 바꿉니다. 8개 문서에 이 단계를 실제로 적용하면 토큰 수는 '+tokenCount(PIPE_STAGES[0].toks)+'개에서 시작해 불용어 제거 후 '+tokenCount(PIPE_STAGES[2].toks)+'개로 줄고, 서로 다른 단어(어휘) 수도 '+vocabSize(PIPE_STAGES[0].toks)+'개에서 어간 추출 후 '+vocabSize(PIPE_STAGES[3].toks)+'개까지 줄어듭니다. 이렇게 남은 어휘를 열(컬럼)로 삼아 각 문서가 각 단어를 몇 번 썼는지 세면, 문장은 마침내 계산 가능한 <b>문서-단어 행렬</b>이 됩니다.'); }
  },

  // ══════════ 2. TF-IDF — 흔한 단어의 값을 깎다 ══════════
  { id:'bda43_02',
    enter:function(E){ this.s={doc:1}; E.setOn([]); },   // D2: 원시빈도 1위(act)와 TF-IDF 1위(terrible)가 실제로 갈리는 예
    tap:function(E){ this.s.doc=(this.s.doc+1)%Ndoc43; E.blip(380+this.s.doc*20,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'from sklearn.feature_extraction.text import TfidfVectorizer', hl:'TfidfVectorizer'},
        {t:'X = TfidfVectorizer().fit_transform(docs)', hl:'.fit_transform'},
        {t:'idf = log((1+N)/(1+df)) + 1', hl:'idf ='}
      ];
      var codeBot=codePanel(E, W*0.04, 10, W*0.44, code, 'tfidf.py', 2);
      var ry=codeBot+16;
      ctx.textAlign='left'; ctx.font='11.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('문서 D'+(s.doc+1)+' — "'+DOCS_RAW43[s.doc].slice(0,32)+'…"', W*0.04, ry);
      var row=DTM43[s.doc], tfidfRow=TFIDF43[s.doc];
      var present=VOCAB43.map(function(_,i){ return i; }).filter(function(i){ return row[i]>0; });
      var idxByFreq=present.slice().sort(function(a,b){ return row[b]-row[a]; }).slice(0,4);
      var idxByTfidf=present.slice().sort(function(a,b){ return tfidfRow[b]-tfidfRow[a]; }).slice(0,4);
      ctx.font='11px sans-serif'; ctx.fillStyle=BLU;
      ctx.fillText('원시 빈도 상위: '+idxByFreq.map(function(i){ return VOCAB43[i]+'('+row[i]+')'; }).join(', '), W*0.04, ry+20);
      ctx.fillStyle=GRN;
      ctx.fillText('TF-IDF 상위: '+idxByTfidf.map(function(i){ return VOCAB43[i]+'('+tfidfRow[i].toFixed(2)+')'; }).join(', '), W*0.04, ry+38);
      ctx.fillStyle=DIM;
      ctx.fillText(idxByFreq[0]===idxByTfidf[0]?'이 문서는 두 순위의 1위가 같습니다':'1위 단어가 바뀌었습니다 — 흔한 단어의 가중치가 깎였기 때문입니다', W*0.04, ry+58);

      var bx0=W*0.04, bx1=W*0.46, by0=ry+80, bh=Math.min(90,H-by0-34);
      ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.moveTo(bx0,by0+bh); ctx.lineTo(bx1,by0+bh); ctx.stroke();
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText('전체 어휘의 역문서빈도(IDF) 분포', bx0, by0-4);
      var idfSorted=VOCAB43.map(function(v,i){ return {w:v,idf:IDF43[i]}; }).sort(function(a,b){ return b.idf-a.idf; });
      var maxIdf=idfSorted[0].idf, minIdf=idfSorted[idfSorted.length-1].idf;
      var idfMid=(maxIdf+minIdf)/2;
      var bw2=(bx1-bx0)/idfSorted.length;
      idfSorted.forEach(function(item,ii){
        var hh=((item.idf-minIdf+1e-6)/(maxIdf-minIdf+1e-6))*bh;
        ctx.fillStyle=item.idf<idfMid?RED:GLD;
        ctx.fillRect(bx0+ii*bw2+1, by0+bh-hh, Math.max(1,bw2-2), Math.max(1,hh));
      });
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
      ctx.fillText('낮은 막대(빨강)=거의 모든 문서에 등장 → 가중치가 깎입니다', bx0, by0+bh+16);

      var px0=W*0.50, px1=W*0.965, pTop=26, pBot=H-20;
      var wordsShown=Array.from(new Set(idxByFreq.concat(idxByTfidf))).slice(0,6);
      var bw3=(px1-px0)/wordsShown.length;
      var maxFreq=Math.max.apply(null,wordsShown.map(function(i){ return row[i]; }));
      var maxTfidf=Math.max.apply(null,wordsShown.map(function(i){ return tfidfRow[i]; }));
      ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.stroke();
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText('D'+(s.doc+1)+' 단어별: 원시빈도(파랑) vs TF-IDF(초록)', px0, pTop-10);
      wordsShown.forEach(function(wi,ii){
        var xk=px0+ii*bw3;
        var h1=(row[wi]/maxFreq)*(pBot-pTop)*0.82, h2=(tfidfRow[wi]/maxTfidf)*(pBot-pTop)*0.82;
        ctx.fillStyle=BLU; ctx.fillRect(xk+bw3*0.12, pBot-h1, bw3*0.32, h1);
        ctx.fillStyle=GRN; ctx.fillRect(xk+bw3*0.52, pBot-h2, bw3*0.32, h2);
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='center'; ctx.fillText(VOCAB43[wi], xk+bw3/2, pBot+14);
      });

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 문서로 이동해 두 순위를 다시 비교', true);
      E.big('TF-IDF — 흔한 단어의 값을 깎다', '단순 빈도는 「많이 나온 단어=중요한 단어」로 취급하지만, 8개 문서 모두에 걸쳐 자주 등장하는 단어는 사실 어느 문서를 특별히 대표하지 않습니다. <b>IDF</b>(역문서빈도, log((1+N)/(1+df))+1)를 실제로 계산하면 문서빈도(df)가 높은 단어일수록 값이 작아지고, <b>TF-IDF</b>(=빈도×IDF)는 그 단어의 가중치를 실제로 깎습니다. 지금 D'+(s.doc+1)+'에서 원시 빈도 1위는 「'+VOCAB43[idxByFreq[0]]+'」이지만 TF-IDF 1위는 「'+VOCAB43[idxByTfidf[0]]+'」로, 흔한 단어보다 이 문서에서만 두드러지는 단어가 위로 올라옵니다. 어느 단어가 문서를 대표하는지는 「많이 나오는가」가 아니라 「다른 문서와 비교했을 때도 여전히 눈에 띄는가」로 판정해야 한다는 것을 숫자가 직접 보여줍니다.'); }
  },

  // ══════════ 3. 문서끼리 얼마나 닮았나 ══════════
  { id:'bda43_03',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      var code=[
        {t:'from sklearn.metrics.pairwise import cosine_similarity', hl:'cosine_similarity'},
        {t:'sim = cosine_similarity(X)   # 문서 x 문서 행렬', hl:'cosine_similarity(X)'},
        {t:'sim.argsort()[::-1]   # 가장 닮은 문서쌍 찾기', dim:true}
      ];
      var codeBot=codePanel(E, W*0.04, 10, W*0.44, code, 'similarity.py', 1);
      var ry=codeBot+16;
      ctx.textAlign='left'; ctx.font='11.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('가장 닮은 문서쌍: D'+(BEST_PAIR43.i+1)+'·D'+(BEST_PAIR43.j+1)+' (코사인 '+BEST_PAIR43.v.toFixed(3)+')', W*0.04, ry);
      ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT;
      ctx.fillText('D'+(BEST_PAIR43.i+1)+': "'+DOCS_RAW43[BEST_PAIR43.i].slice(0,38)+'"', W*0.04, ry+20);
      ctx.fillText('D'+(BEST_PAIR43.j+1)+': "'+DOCS_RAW43[BEST_PAIR43.j].slice(0,38)+'"', W*0.04, ry+36);
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('D'+(SELFDOC43+1)+'을 단어수만 그대로 2배로 「길게」 쓴 가상 문서와 비교하면:', W*0.04, ry+58);
      ctx.fillStyle=RED; ctx.fillText('유클리드 거리 '+EUC_SELF43.toFixed(3)+'로 큽니다(길이가 다르므로)', W*0.04, ry+76);
      ctx.fillStyle=GRN; ctx.fillText('코사인 유사도는 '+COS_SELF43.toFixed(3)+' — 방향(내용)이 같아 그대로입니다', W*0.04, ry+94);

      var px0=W*0.50, pTop=28;
      var side=Math.min(W*0.965-px0, H-16-pTop);
      var px1=px0+side, pBot=pTop+side;
      var cell=side/Ndoc43;
      for(var i=0;i<Ndoc43;i++){ for(var j=0;j<Ndoc43;j++){
        var v=COSMAT43[i][j];
        var t=Math.max(0,Math.min(1,v));
        ctx.fillStyle='rgba(255,122,184,'+(0.12+t*0.75).toFixed(2)+')';
        ctx.fillRect(px0+j*cell, pTop+i*cell, cell-1, cell-1);
        if(cell>=24){ ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=t>0.5?'#1a0f14':TXT; ctx.textAlign='center'; ctx.fillText(v.toFixed(2), px0+j*cell+cell/2, pTop+i*cell+cell/2+4); }
        if((i===BEST_PAIR43.i&&j===BEST_PAIR43.j)||(i===BEST_PAIR43.j&&j===BEST_PAIR43.i)){ ctx.strokeStyle=GLD; ctx.lineWidth=2; ctx.strokeRect(px0+j*cell+1,pTop+i*cell+1,cell-3,cell-3); }
      }}
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='center';
      for(i=0;i<Ndoc43;i++){ ctx.fillText('D'+(i+1), px0+i*cell+cell/2, pTop-8); }
      for(i=0;i<Ndoc43;i++){ ctx.fillText('D'+(i+1), px0-12, pTop+i*cell+cell/2+4); }

      E.tapHint(W/2, H*0.95, '코사인 유사도 행렬에서 가장 닮은 문서쌍(금색 테두리)을 확인하세요', false);
      E.big('문서끼리 얼마나 닮았나', '두 문서가 얼마나 비슷한지 재려면 흔히 <b>코사인 유사도</b>(두 TF-IDF 벡터 사이 각도의 코사인)를 씁니다. 8개 문서 전체 쌍을 실제로 계산한 행렬에서 가장 닮은 쌍은 D'+(BEST_PAIR43.i+1)+'·D'+(BEST_PAIR43.j+1)+'로 코사인 '+BEST_PAIR43.v.toFixed(3)+'입니다. 왜 유클리드 거리가 아니라 각도를 쓰는지는 이렇게 확인할 수 있습니다 — D'+(SELFDOC43+1)+'의 단어 수를 전부 그대로 두 배로 늘린(같은 내용을 더 길게 쓴) 가상 문서를 만들어 원본과 비교하면, 유클리드 거리는 '+EUC_SELF43.toFixed(3)+'로 꽤 커지지만(벡터의 「길이」가 달라졌으니까) 코사인 유사도는 '+COS_SELF43.toFixed(3)+'로 그대로입니다(가리키는 「방향」, 즉 내용의 성격은 같으니까). 문서 길이는 주제와 무관하게 다를 수 있으므로, 텍스트 유사도는 길이가 아니라 방향으로 재는 것이 이치에 맞습니다.'); }
  },

  // ══════════ 4. 숨은 주제를 찾다 — 토픽 모델링 ══════════
  { id:'bda43_04',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      var code=[
        {t:'from sklearn.decomposition import LatentDirichletAllocation', hl:'LatentDirichletAllocation'},
        {t:'lda = LatentDirichletAllocation(n_components=2)', hl:'n_components=2'},
        {t:'lda.fit(X); lda.transform(X)   # 문서별 주제 비중', hl:'.transform'}
      ];
      var codeBot=codePanel(E, W*0.04, 10, W*0.44, code, 'topic_model.py', 2);
      var ry=codeBot+16;
      ctx.textAlign='left'; ctx.font='11px ui-monospace,Menlo,monospace';
      ctx.fillStyle=TXT; ctx.fillText('깁스 표집 400회 후 수렴한 단어-토픽 분포 상위 5단어', W*0.04, ry);
      var ly=ry+20;
      TOPWORDS43.forEach(function(tw,ki){
        ctx.fillStyle=ki===0?GRN:BLU;
        ctx.fillText('토픽'+(ki+1)+': '+tw.map(function(t){ return t.word+'('+t.p.toFixed(2)+')'; }).join(', '), W*0.04, ly+ki*18);
      });
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('토픽에 「긍정적 평가」 같은 이름을 붙이는 것은 알고리즘이 아니라', W*0.04, ly+2*18+16);
      ctx.fillText('사람이 상위 단어를 보고 판단해서 붙이는 몫입니다', W*0.04, ly+2*18+32);

      var px0=W*0.50, px1=W*0.965, pTop=28, pBot=H-40;
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText('문서별 토픽 비중(토픽1 초록 · 토픽2 파랑)', px0, pTop-10);
      var bw=(px1-px0)/Ndoc43;
      LDA_RESULT43.theta.forEach(function(th,di){
        var xk=px0+di*bw, h0=th[0]*(pBot-pTop), h1=th[1]*(pBot-pTop);
        ctx.fillStyle=GRN; ctx.fillRect(xk+bw*0.15, pBot-h0, bw*0.7, h0);
        ctx.fillStyle=BLU; ctx.fillRect(xk+bw*0.15, pBot-h0-h1, bw*0.7, h1);
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='center'; ctx.fillText('D'+(di+1), xk+bw/2, pBot+14);
      });
      ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.stroke();

      E.tapHint(W/2, H*0.95, '각 문서 막대에서 두 토픽이 실제로 섞인 비율을 확인하세요', false);
      E.big('숨은 주제를 찾다 — 토픽 모델링', 'LDA는 「문서는 여러 주제의 혼합이고, 주제는 단어들의 확률분포다」라는 가정으로 문서와 단어를 동시에 설명합니다. 깁스 표집(각 단어의 주제 배정을 이웃 배정들의 조건부확률로 반복해서 다시 뽑는 절차)을 400회 실제로 반복해 수렴시키면, 토픽1의 상위 단어는 '+TOPWORDS43[0].slice(0,3).map(function(t){return t.word;}).join('·')+'처럼 나오고 토픽2는 '+TOPWORDS43[1].slice(0,3).map(function(t){return t.word;}).join('·')+'처럼 나옵니다 — 각 문서의 토픽 비중(막대 높이)도 실제 계산값입니다. 알고리즘은 「단어들이 이렇게 묶여 함께 등장한다」는 것만 찾아낼 뿐, 그 묶음에 「호평」이니 「혹평」이니 하는 <b>이름을 붙이는 일은 언제나 사람의 몫</b>입니다.'); }
  },

  // ══════════ 5. 감성 분석 ══════════
  { id:'bda43_05',
    enter:function(E){ this.s={negOn:true}; E.setOn([]); },
    tap:function(E){ this.s.negOn=!this.s.negOn; E.blip(this.s.negOn?460:360,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'lexicon_score(doc, negation=True)   # 사전 기반', hl:'negation=True'},
        {t:'from sklearn.naive_bayes import MultinomialNB', hl:'MultinomialNB'},
        {t:'nb.fit(X_train, y_train); nb.predict(X_test)', hl:'.predict'}
      ];
      var codeBot=codePanel(E, W*0.04, 10, W*0.92, code, 'sentiment.py', 0);
      var rows=[];
      for(var i=0;i<8;i++){ rows.push({snip:DOCS_RAW43[i].slice(0,32)+(DOCS_RAW43[i].length>32?'…':''), lex:lexiconScore(DOCS_RAW43[i], s.negOn), nb:NB_LOO43[i], truth:LABELS43[i], trap:false}); }
      TRAP43.forEach(function(t,ti){ rows.push({snip:t.text, lex:lexiconScore(t.text,s.negOn), nb:TRAP_NB43[ti], truth:t.trueLab, trap:true}); });

      var tx0=W*0.04, ty0=codeBot+22, rh=17;
      var cx={i:tx0, snip:tx0+24, lex:tx0+330, lexv:tx0+392, nbv:tx0+454, truth:tx0+514, ok:tx0+564};
      ctx.font='600 11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
      ctx.fillText('#', cx.i, ty0); ctx.fillText('문장', cx.snip, ty0); ctx.fillText('사전점수', cx.lex, ty0);
      ctx.fillText('사전판정', cx.lexv, ty0); ctx.fillText('NB판정', cx.nbv, ty0); ctx.fillText('정답', cx.truth, ty0);
      ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.moveTo(tx0,ty0+5); ctx.lineTo(tx0+588,ty0+5); ctx.stroke();

      var lexCorrect=0, nbCorrect=0, nbN=0;
      rows.forEach(function(row,ri){
        var ry=ty0+20+ri*rh;
        var lexV=row.lex>0?1:(row.lex<0?0:-1);
        var lexOk=(lexV===row.truth), nbOk=(row.nb===row.truth);
        if(!row.trap){ if(lexOk) lexCorrect++; if(nbOk) nbCorrect++; nbN++; }
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=row.trap?GLD:DIM; ctx.textAlign='left';
        ctx.fillText(String(ri+1), cx.i, ry);
        ctx.font='11px sans-serif'; ctx.fillStyle=row.trap?GLD:TXT;
        ctx.fillText(row.snip, cx.snip, ry);
        ctx.font='11px ui-monospace,Menlo,monospace';
        ctx.fillStyle=row.lex>0?GRN:(row.lex<0?RED:DIM); ctx.fillText((row.lex>0?'+':'')+row.lex, cx.lex, ry);
        ctx.fillStyle=lexV===1?GRN:(lexV===0?RED:DIM); ctx.fillText(lexV===1?'긍정':(lexV===0?'부정':'중립'), cx.lexv, ry);
        ctx.fillStyle=row.nb===1?GRN:RED; ctx.fillText(row.nb===1?'긍정':'부정', cx.nbv, ry);
        ctx.fillStyle=row.truth===1?GRN:RED; ctx.fillText(row.truth===1?'긍정':'부정', cx.truth, ry);
        ctx.fillStyle=lexOk?GRN:RED; ctx.fillText(lexOk?'✓':'✗', cx.ok, ry);
      });

      var sy=ty0+20+rows.length*rh+16;
      ctx.font='11.5px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
      ctx.fillStyle=GLD; ctx.fillText('사전기반 정확도(부정어 '+(s.negOn?'처리 켬':'처리 끔')+', 문서 8개) = '+lexCorrect+'/'+nbN, tx0, sy);
      ctx.fillStyle=BLU; ctx.fillText('나이브베이즈 정확도(교차검증, 문서 8개) = '+nbCorrect+'/'+nbN, tx0+340, sy);

      E.tapHint(W/2, H*0.95, '화면 탭 = 부정어 처리를 껐다 켜서 사전 점수가 실제로 바뀌는지 확인', true);
      var trapNeg=rows[8], trapIrony=rows[9];
      E.big('감성 분석', '<b>사전 기반</b> 방식은 wonderful=+3, terrible=−3처럼 단어마다 미리 매긴 극성 점수를 문장 안에서 실제로 찾아 더합니다. <b>나이브베이즈</b>(학습 기반)는 라벨이 붙은 문서로 단어별 조건부확률을 학습해 새 문장을 분류합니다. 8개 문서에 교차검증을 실제로 적용하면 사전기반은 '+lexCorrect+'/'+nbN+', 나이브베이즈는 '+nbCorrect+'/'+nbN+'을 맞힙니다. 함정 문장 두 개를 얹어 보면 각기 다른 방식으로 발목을 잡습니다 — 「This movie was not terrible」은 지금 부정어 처리를 '+(s.negOn?'켠 상태라 사전 점수가 '+(trapNeg.lex>0?'+':'')+trapNeg.lex+'로 뒤집혀 올바르게 긍정으로 판정되지만':'끈 상태라 사전 점수가 '+trapNeg.lex+'로 terrible의 원래 부호를 그대로 써서 틀리게 부정으로 판정되지만')+', 「Oh great, another boring predictable ending」처럼 <b>반어(비꼬기)</b>로 쓰인 great는 boring·predictable의 부정 점수와 정확히 상쇄되어 부정어 처리를 켜든 끄든 사전 점수가 '+trapIrony.lex+'(중립)에 머뭅니다 — 반어의 어조 자체는 단어 점수를 더하는 방식으로는 애초에 잡을 수 없는 함정입니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
