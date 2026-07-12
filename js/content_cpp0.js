/* C++ 트랙 — 시작 시퀀스 (시네마틱: 비야네 스트롭스트룹 + 이름 유래 + 실제 코드 실행 · 환영 · 16장 윤곽)
   동작(behavior)만. 텍스트=content/cpp0.json. 반드시 content_cpp1.js 보다 먼저 로드. 엔진 js/engine.js 공유.
   색: C++=블루 테마(#5ab4e8). 골든룰: 화면의 출력값(제곱)은 실제 계산. */
(function(){
  var CPB='#5ab4e8', CPD='#8fd0f5', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', PNK='#f4a0c0', DIM='#9b99a3';
  // C++의 창시자 비야네 스트롭스트룹 — "효율과 추상화, 둘 다"를 꿈꾼 사람(인트로 배경)
  var BJ=new Image(); var BJ_OK=false; BJ.onload=function(){ BJ_OK=true; }; BJ.src='assets/stroustrup.jpg';
  // 인트로 시네마틱에서 '실행'되는 실제 코드와 결과
  var SQ=[]; for(var i=0;i<8;i++) SQ.push(i*i);   // for(int x=0;x<8;++x) sq.push_back(x*x) = [0,1,4,9,16,25,36,49] (실제 계산)

  var scenes = [

  // ── 시네마틱: C++ 코드가 '실행'되며 결과가 피어남 → 엔드카드(비야네 스트롭스트룹) ──
  { id:'cpp0_00', cinematic:true, introCard:true,
    story:{ portrait:'assets/stroustrup.jpg', name:'비야네 스트롭스트룹',
      sub:'Bjarne Stroustrup · 1950–<br>C++의 창시자 (1979 “C with Classes”, 1983 C++)',
      caps:[
        ['C++의 세계에 오신 것을 환영합니다'],
        ['1979년 벨 연구소, 한 덴마크 출신 컴퓨터과학자가','거대한 시스템을 다룰 새 언어를 구상했습니다.'],
        ['비야네 스트롭스트룹 — C의 속도와 Simula의 추상화,','“둘 다 포기하지 않겠다”고 마음먹었죠.'],
        ['이름은 뱀도 무엇도 아닌, C에 증가 연산자','++를 붙인 것 — “C보다 한 단계 나아간 C”.'],
        ['클래스·템플릿·STL로 높은 추상을 쓰되,','쓰지 않은 것엔 비용을 물지 않는다(제로 오버헤드).'],
        ['그래서 게임 엔진·브라우저·운영체제·고빈도매매까지','속도가 생명인 곳은 지금도 C++입니다.'],
        ['포인터와 메모리를 직접 다루는 힘,','그 힘을 안전하게 감싸는 현대적 도구까지 —'],
        ['기초 문법부터 STL·모던 C++·알고리즘 구현까지 —','함께 C++로 기계의 밑바닥을 다뤄 볼까요?']
      ] },
    enter:function(E){ this.s={ ended:false, acc:0, last:0 }; E.setOn([]); },
    tap:function(E){ if(!this.s.ended){ this.s.ended=true; E.introEnd(this.story); } },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, fr=E.frame, s=this.s;
      function ss(a,b,x){ x=(x-a)/(b-a); x=x<0?0:x>1?1:x; return x*x*(3-2*x); }
      var ANIM=1215, FADE=18, HOLD=170;
      var _n=(typeof performance!=="undefined"&&performance.now)?performance.now():0, _dt=s.last?(_n-s.last):16.7; if(_dt<0||_dt>200)_dt=16.7; s.last=_n; s.acc+=_dt*0.036; var local=s.acc;
      if(local>=ANIM+HOLD){ if(!s.ended){ s.ended=true; E.introEnd(this.story); } return; }
      var ph=Math.min(local,ANIM)/ANIM, seam=(local<FADE? local/FADE : 1);
      // 스트롭스트룹 초상(은은한 배경)
      if(BJ_OK){ var ar=BJ.width/BJ.height||0.83, dh=H*0.80, dw=dh*ar, ix=W*0.5-dw/2, iy=H*0.50-dh/2;
        ctx.save(); ctx.globalAlpha=(0.30+0.03*Math.sin(fr*0.012))*seam; if('filter' in ctx) ctx.filter='blur(2px)';
        ctx.drawImage(BJ, ix, iy, dw, dh); ctx.restore(); }
      // 별/먼지 배경(블루)
      for(var i=0;i<48;i++){ var hx=((Math.sin(i*12.9898)*43758.5453)%1+1)%1, hy=((Math.sin(i*78.233)*43758.5453)%1+1)%1, tw=0.25+0.55*Math.abs(Math.sin(fr*0.016+i));
        ctx.fillStyle='rgba(90,180,232,'+(tw*0.32*seam).toFixed(3)+')'; ctx.fillRect(hx*W, hy*H*0.9, 1.6,1.6); }
      // 코드 패널(왼쪽) — 한 줄씩 '타이핑'
      var code=['// C++ — 효율과 추상화를 한 손에','vector<int> sq;','for (int x=0; x<8; ++x)','    sq.push_back(x*x);'];
      var cx=W*0.10, cy=H*0.28, lh=Math.max(20,H*0.048), reveal=ss(0,1,(ph-0.06)/0.30);
      ctx.save(); ctx.globalAlpha=seam; ctx.font='600 '+Math.max(14,Math.min(21,W*0.017))+'px ui-monospace, Menlo, monospace'; ctx.textAlign='left';
      for(var L=0;L<code.length;L++){ var lp=ss(0,1,reveal*code.length-L); if(lp<=0)continue;
        var full=code[L], nshow=Math.floor(full.length*lp), str=full.slice(0,nshow);
        ctx.fillStyle=(L===0)?DIM:(L===3?CPD:CPB); ctx.fillText(str, cx, cy+L*lh);
        if(lp<1 && Math.floor(fr/16)%2===0){ var tw2=ctx.measureText(str).width; ctx.fillStyle=CPB; ctx.fillRect(cx+tw2+2, cy+L*lh-13, 9, 16); } }
      ctx.restore();
      // 결과(오른쪽) — x*x 막대가 실제 값으로 피어남
      var bx=W*0.56, by=H*0.66, bw=W*0.34, mx=49;
      var outP=ss(0,1,(ph-0.40)/0.42);
      ctx.globalAlpha=seam; ctx.strokeStyle='rgba(90,180,232,0.25)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(bx,by); ctx.lineTo(bx+bw,by); ctx.stroke();
      for(i=0;i<SQ.length;i++){ var grow=ss(0,1,outP*SQ.length-i); if(grow<=0)continue;
        var h=SQ[i]/mx*H*0.30*grow, w=bw/SQ.length*0.66, gx=bx+i*bw/SQ.length+bw/SQ.length*0.17;
        ctx.fillStyle=CPB; ctx.globalAlpha=seam*(0.55+0.45*grow); ctx.fillRect(gx, by-h, w, h);
        if(grow>0.6){ ctx.globalAlpha=seam; ctx.fillStyle=CPD; ctx.font='12px ui-monospace, monospace'; ctx.textAlign='center'; ctx.fillText(SQ[i], gx+w/2, by-h-6); } }
      ctx.globalAlpha=seam; ctx.fillStyle=DIM; ctx.font='13px ui-monospace, monospace'; ctx.textAlign='left';
      if(outP>0.85){ ctx.fillStyle=GRN; ctx.fillText('// sq = { 0 1 4 9 16 25 36 49 }', bx, by+24); }
      ctx.globalAlpha=1;
      // 상단 대화체 문구
      var caps=this.story.caps;
      var slot=1/caps.length, ci=Math.floor(ph/slot), lp2=(ph-ci*slot)/slot;
      var aa=(lp2<0.2? lp2/0.2 : lp2>0.8? (1-lp2)/0.2 : 1)*seam;
      var lines=caps[ci]||caps[0], mainF=Math.max(20,Math.min(33,W*0.039)), subF=Math.max(14,Math.min(21,W*0.024));
      ctx.textAlign='center'; ctx.textBaseline='alphabetic'; ctx.shadowColor='rgba(0,0,0,0.65)'; ctx.shadowBlur=14;
      for(var li=0;li<lines.length;li++){ var big2=(li===0);
        ctx.font=(big2?'600 '+mainF:'400 '+subF)+'px -apple-system, sans-serif';
        ctx.fillStyle=big2?'rgba(143,208,245,'+aa.toFixed(3)+')':'rgba(240,240,240,'+(aa*0.92).toFixed(3)+')';
        ctx.fillText(lines[li], W/2, H*0.13 + li*(mainF+9)); }
      ctx.shadowBlur=0; }
  },

  // ── 환영: 왜 C++인가 (제로 오버헤드 · 쓰이는 곳 · 철학) ──
  { id:'cpp0_01',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360,0.07); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      ctx.textAlign='center';
      if(s.step===0){
        ctx.fillStyle='#eaf4fb'; ctx.font='600 17px sans-serif'; ctx.fillText('제로 오버헤드 — 높은 추상을 쓰되, 비용은 C만큼', W*0.5, H*0.13);
        var lx=W*0.12, ly=H*0.30, lh=25;
        ctx.font='14px ui-monospace, monospace'; ctx.textAlign='left';
        var hc=['// 높은 수준으로 쓰지만','vector<int> v = {5,2,8,1};','sort(v.begin(), v.end());','for (int x : v)','    cout << x << " ";'];
        ctx.fillStyle=CPB; ctx.fillText('C++', lx, ly-12);
        for(var i=0;i<hc.length;i++){ ctx.fillStyle=(i===0)?DIM:CPB; ctx.fillText(hc[i], lx, ly+i*lh); }
        var rx=W*0.60;
        ctx.fillStyle=GRN; ctx.font='14px ui-monospace, monospace'; ctx.fillText('→ 1 2 5 8', rx, ly+0.4*lh);
        ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.fillText('컴파일하면 손으로 짠 C 루프와', rx, ly+1.6*lh);
        ctx.fillText('거의 같은 기계어로 — 추상화 공짜.', rx, ly+2.4*lh);
        ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('“쓰지 않는 것엔 비용을 물지 않는다” — 제로 오버헤드 원칙', W*0.5, ly+5.2*lh);
      } else if(s.step===1){
        ctx.fillStyle='#eaf4fb'; ctx.font='600 17px sans-serif'; ctx.fillText('속도가 생명인 곳은 지금도 C++', W*0.5, H*0.13);
        var uses=[['게임 엔진','언리얼·유니티',CPB],['브라우저','크롬·엣지 엔진',GRN],['운영체제','커널·드라이버',GLD],['고빈도매매','HFT·거래소',PNK],['임베디드','로봇·자동차',CPD],['DB·인프라','MySQL·검색엔진',BLU]];
        for(i=0;i<uses.length;i++){ var col=i%3, row=Math.floor(i/3), bx=W*(0.25+col*0.25), by=H*(0.32+row*0.19);
          ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.strokeStyle=uses[i][2]; ctx.lineWidth=1.5;
          if(ctx.roundRect){ctx.beginPath();ctx.roundRect(bx-72,by-30,144,56,12);ctx.fill();ctx.stroke();}
          ctx.fillStyle=uses[i][2]; ctx.font='600 15px sans-serif'; ctx.textAlign='center'; ctx.fillText(uses[i][0], bx, by-4);
          ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText(uses[i][1], bx, by+16); }
        ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.fillText('메모리·하드웨어를 직접 다루면서도, 큰 프로그램을 구조화할 수 있어서.', W*0.5, H*0.76);
      } else {
        ctx.fillStyle='#eaf4fb'; ctx.font='600 17px sans-serif'; ctx.fillText('힘, 그리고 그 힘을 안전하게 감싸는 도구', W*0.5, H*0.13);
        ctx.font='15px sans-serif'; ctx.fillStyle='#d7e3ec';
        var pts=['· 포인터·메모리를 직접 — 기계의 밑바닥까지 통제','· 클래스·템플릿·STL로 큰 시스템을 구조화','· 스마트 포인터·RAII로 그 힘을 안전하게 관리(모던 C++)'];
        for(i=0;i<pts.length;i++) ctx.fillText(pts[i], W*0.5, H*0.30+i*32);
        ctx.fillStyle=CPB; ctx.font='600 16px sans-serif'; ctx.fillText('“C makes it easy to shoot yourself in the foot;', W*0.5, H*0.52);
        ctx.fillText('C++ makes it harder, but when you do, it blows your whole leg off.” — Stroustrup', W*0.5, H*0.52+24);
      }
      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 (제로 오버헤드 → 쓰이는 곳 → 철학)', true);
      E.big('왜 C++인가', 'C++는 <b>C의 속도</b>와 <b>객체지향·템플릿의 추상화</b>를 한 언어에 담았습니다. 핵심은 <b>제로 오버헤드 원칙</b> — 높은 수준으로 짜도 쓰지 않은 기능엔 비용을 물지 않아, 손으로 짠 C만큼 빠릅니다. 그래서 게임·브라우저·운영체제·고빈도매매처럼 <b>속도가 생명인 곳</b>의 언어죠. 화면을 탭해 이유를 하나씩 보세요.'); }
  },

  // ── 트랙 지도: 16장 윤곽 ──
  { id:'cpp0_02',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      var blocks=[
        ['기초·문법 (1~4장)','입출력·함수오버로딩 · 참조자·new/delete · 클래스 · 생성자·소멸자',CPB],
        ['객체지향 (5~9장)','복사생성자 · static·const·friend · 상속 · 다형성·가상함수 · 연산자오버로딩',GRN],
        ['템플릿·STL (10~12장)','템플릿 · STL 컨테이너(vector·map) · STL 알고리즘·람다',GLD],
        ['안전·모던·알고리즘 (13~16장)','예외처리 · 스마트포인터·RAII · 모던 C++(auto·이동) · 주요 알고리즘 구현',PNK],
        ['재귀 특별장 (17장)','콜 스택·메모리 실시퀀스 시각화 + 재귀 알고리즘 5문제(심화학습)','#b99cff']
      ];
      ctx.textAlign='left';
      for(var i=0;i<blocks.length;i++){ var by=H*0.17+i*H*0.145;
        ctx.fillStyle=blocks[i][2]; ctx.beginPath(); ctx.arc(W*0.16, by, 9,0,7); ctx.fill();
        if(i<blocks.length-1){ ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(W*0.16,by+12); ctx.lineTo(W*0.16,by+H*0.165-12); ctx.stroke(); }
        ctx.fillStyle=blocks[i][2]; ctx.font='600 19px sans-serif'; ctx.fillText(blocks[i][0], W*0.20, by-2);
        ctx.fillStyle='#cfd8e0'; ctx.font='14px sans-serif'; ctx.fillText(blocks[i][1], W*0.20, by+22); }
      E.tapHint(W/2, H*0.95, '아래 ▶ 다음으로 1장(첫걸음)으로', true);
      E.big('C++ — 17장의 여정', '기초 문법부터 시작해 <b>클래스·상속·다형성</b>으로 객체지향을, <b>템플릿·STL</b>로 재사용을, <b>예외·스마트포인터·모던 C++</b>로 안전을 익히고, <b>정렬·탐색·그래프·DP</b> 같은 주요 알고리즘을 <b>실제 C++ 코드</b>로 구현합니다. 끝으로 <b>재귀 특별장</b>에서 콜 스택·메모리를 눈으로 보며 재귀를 완전히 마스터하죠. 기초부터 실무까지, 스스로 짜 보며 익히도록 엮었습니다.'); }
  }

  ];

  if(window.Engine) window.Engine.addScenes(scenes);
})();
