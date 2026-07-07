/* 인공지능 제10장 — 임베딩과 어텐션 입문: 워드 임베딩·코사인 유사도·벡터 산술·어텐션 입문·Transformer 다리
   동작(behavior)만. 텍스트=content/ai10.json. 엔진 js/engine.js 공유. 색: AI=시안.
   골든룰: 유사도·코사인·벡터 덧뺄셈·내적→Softmax 주목은 전부 draw에서 실제 계산(베껴 그리기·하드코딩 금지).
   제11장 Transformer(content_ai11.js)로 이어지는 다리 장. */
(function(){
  var CYA='#3dd6dc', BLU='#7ab8ff', GLD='#ffd27a', GRN='#7ee0b0', PNK='#f4a0c0', DIM='#9b99a3', RED='#f0888a';
  function dot(a,b){ var s=0; for(var i=0;i<a.length;i++) s+=a[i]*b[i]; return s; }
  function vlen(a){ return Math.sqrt(dot(a,a)); }
  function cos(a,b){ var d=vlen(a)*vlen(b); return d<1e-9?0:dot(a,b)/d; }
  function softmax(arr){ var m=-1e9,i; for(i=0;i<arr.length;i++) if(arr[i]>m)m=arr[i];
    var e=[],s=0; for(i=0;i<arr.length;i++){ var v=Math.exp(arr[i]-m); e.push(v); s+=v; }
    for(i=0;i<e.length;i++) e[i]/=s; return e; }

  // 결정적 워드 임베딩(2D). 의미가 가까운 단어는 좌표도 가까이 — 손수 배치한 고정 벡터(난수 없음).
  // 왕·여왕·남자·여자가 평행사변형을 이루도록(king−man+woman≈queen 성립) 좌표 설계.
  var WORDS = [
    {t:'왕',     en:'king',   v:[ 1.10, 1.30], c:GLD},
    {t:'여왕',   en:'queen',  v:[ 1.70, 1.30], c:GLD},
    {t:'남자',   en:'man',    v:[ 1.10, 0.50], c:BLU},
    {t:'여자',   en:'woman',  v:[ 1.70, 0.50], c:PNK},
    {t:'사과',   en:'apple',  v:[-1.50, 1.20], c:GRN},
    {t:'바나나', en:'banana', v:[-1.20, 1.55], c:GRN},
    {t:'자동차', en:'car',    v:[-1.60,-1.30], c:CYA},
    {t:'버스',   en:'bus',    v:[-1.25,-1.55], c:CYA}
  ];

  var scenes = [

  // ══════════ 1. 워드 임베딩 — 단어를 2D 벡터로 ══════════
  { id:'ai10_01',
    enter:function(E){ this.s={sel:1}; E.setOn([]);
      var self=this;
      E.controls('<div class="ctrl"><label>단어 선택(가장 가까운 이웃 보기)</label><input type="range" id="wd" min="0" max="7" step="1" value="1"><output id="wdo">여왕</output></div>');
      E.bind('#wd','input',function(e){ self.s.sel=+e.target.value; document.getElementById('wdo').textContent=WORDS[self.s.sel].t; E.blip(360,0.06); }); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var cx=W*0.34, cy=H*0.50, sc=Math.min(W*0.12,H*0.20);
      function SX(x){ return cx+x*sc; } function SY(y){ return cy-y*sc; }
      // 축
      ctx.strokeStyle='rgba(61,214,220,0.18)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(SX(-2.2),SY(0)); ctx.lineTo(SX(2.2),SY(0));
      ctx.moveTo(SX(0),SY(-2.1)); ctx.lineTo(SX(0),SY(2.1)); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='right'; ctx.fillText('의미 차원 2', SX(0)-6, SY(2.1)+12);
      ctx.textAlign='left'; ctx.fillText('의미 차원 1 →', SX(2.2)-72, SY(0)-8);
      // 선택 단어와 가장 가까운 이웃(코사인 유사도 실측)
      var sel=WORDS[s.sel], best=-1, bestc=-2;
      for(var i=0;i<WORDS.length;i++){ if(i===s.sel) continue; var c=cos(sel.v, WORDS[i].v); if(c>bestc){ bestc=c; best=i; } }
      // 선택→이웃 연결선
      ctx.strokeStyle='rgba(255,210,122,0.55)'; ctx.lineWidth=2; ctx.setLineDash([5,4]);
      ctx.beginPath(); ctx.moveTo(SX(sel.v[0]),SY(sel.v[1])); ctx.lineTo(SX(WORDS[best].v[0]),SY(WORDS[best].v[1])); ctx.stroke(); ctx.setLineDash([]);
      // 단어 점
      for(i=0;i<WORDS.length;i++){ var o=WORDS[i], px=SX(o.v[0]), py=SY(o.v[1]), hot=(i===s.sel), nb=(i===best);
        ctx.fillStyle=o.c; ctx.globalAlpha=hot?1:(nb?0.95:0.7);
        ctx.beginPath(); ctx.arc(px,py,hot?9:6,0,7); ctx.fill(); ctx.globalAlpha=1;
        if(hot){ ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(px,py,12,0,7); ctx.stroke(); }
        ctx.fillStyle=hot?'#fff':o.c; ctx.font=(hot?'600 ':'')+'13px sans-serif'; ctx.textAlign='center';
        ctx.fillText(o.t, px, py-13); }
      // 설명 패널
      var qx=W*0.62, qy=H*0.26;
      ctx.fillStyle='#dfeef0'; ctx.font='600 16px sans-serif'; ctx.textAlign='left';
      ctx.fillText('단어 → 벡터(임베딩)', qx, qy);
      ctx.fillStyle=DIM; ctx.font='13.5px sans-serif';
      ctx.fillText('각 단어를 숫자 벡터로 바꿉니다.', qx, qy+26);
      ctx.fillText('의미가 가까우면 벡터도 가까이 모입니다.', qx, qy+46);
      ctx.fillStyle=sel.c; ctx.font='600 15px sans-serif';
      ctx.fillText('"'+sel.t+'" = ('+sel.v[0].toFixed(2)+', '+sel.v[1].toFixed(2)+')', qx, qy+82);
      ctx.fillStyle=GLD; ctx.font='600 15px sans-serif';
      ctx.fillText('가장 가까운 이웃: "'+WORDS[best].t+'"', qx, qy+110);
      ctx.fillStyle='#dfeef0'; ctx.font='14px sans-serif';
      ctx.fillText('코사인 유사도 = '+bestc.toFixed(3), qx, qy+134);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
      ctx.fillText('왕·여왕·남자·여자 / 사과·바나나 / 자동차·버스', qx, qy+168);
      ctx.fillText('— 끼리끼리 무리 짓습니다.', qx, qy+186);
      E.tapHint(W/2, H*0.95, '슬라이더로 단어를 골라 가장 가까운 이웃을 보세요', true);
      E.big('워드 임베딩 — 단어를 벡터로', '컴퓨터는 글자를 직접 이해하지 못합니다. 그래서 단어를 <b>숫자 벡터</b>로 바꾸죠 — 이것이 임베딩입니다. 비결은 <b>의미가 비슷한 단어를 가까운 곳에 두는 것</b>. 그러면 ‘가깝다’는 기하학적 거리가 곧 ‘뜻이 닮았다’가 됩니다. 화면의 이웃·유사도는 좌표로 계산한 값입니다.'); }
  },

  // ══════════ 2. 코사인 유사도 — 방향이 닮은 정도 ══════════
  { id:'ai10_02',
    enter:function(E){ var self=this; this.s={ang:30};
      E.controls('<div class="ctrl"><label>단어 B의 방향 (도)</label><input type="range" id="ag" min="0" max="180" step="3" value="30"><output id="ago">30</output></div>');
      E.bind('#ag','input',function(e){ self.s.ang=+e.target.value; document.getElementById('ago').textContent=e.target.value; E.blip(300+self.s.ang,0.05); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var cx=W*0.32, cy=H*0.54, R=Math.min(W*0.20,H*0.32);
      // 단어 A 고정(20도), 단어 B는 슬라이더 각도
      var aA=20*Math.PI/180, aB=s.ang*Math.PI/180;
      var a=[Math.cos(aA),Math.sin(aA)], b=[Math.cos(aB),Math.sin(aB)];   // 단위벡터(이 데모는 방향만)
      var c=cos(a,b), ang=Math.acos(Math.max(-1,Math.min(1,c)))*180/Math.PI, d=dot(a,b);
      // 단위원
      ctx.strokeStyle='rgba(255,255,255,0.12)'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(cx,cy,R,0,7); ctx.stroke();
      // 두 사이각 호
      ctx.strokeStyle='rgba(255,210,122,0.5)'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(cx,cy,R*0.34, -aA, -aB, aB<aA); ctx.stroke();
      ctx.fillStyle=GLD; ctx.font='12px sans-serif'; ctx.textAlign='center';
      var mid=(aA+aB)/2; ctx.fillText('θ='+ang.toFixed(0)+'°', cx+Math.cos(mid)*R*0.5, cy-Math.sin(mid)*R*0.5);
      // 벡터 A
      ctx.strokeStyle=BLU; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+a[0]*R, cy-a[1]*R); ctx.stroke();
      ctx.fillStyle=BLU; ctx.font='600 15px sans-serif'; ctx.textAlign='left'; ctx.fillText('단어 A', cx+a[0]*R+6, cy-a[1]*R);
      // 벡터 B
      ctx.strokeStyle=GLD; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+b[0]*R, cy-b[1]*R); ctx.stroke();
      ctx.fillStyle=GLD; ctx.fillText('단어 B', cx+b[0]*R+6, cy-b[1]*R);
      // 패널: cos 공식·실측
      var px=W*0.60, py=H*0.26;
      ctx.fillStyle='#dfeef0'; ctx.font='600 16px sans-serif'; ctx.textAlign='left';
      ctx.fillText('코사인 유사도', px, py);
      ctx.fillStyle=CYA; ctx.font='600 15px sans-serif';
      ctx.fillText('cos θ = (A·B) / (|A| |B|)', px, py+30);
      ctx.fillStyle=DIM; ctx.font='13.5px sans-serif';
      ctx.fillText('내적 A·B = '+d.toFixed(3), px, py+58);
      ctx.fillText('|A| = '+vlen(a).toFixed(2)+'   |B| = '+vlen(b).toFixed(2), px, py+78);
      // 큰 결과 수치
      var sim = c;   // 방향만 보므로 cos = 내적
      ctx.fillStyle = sim>0.85?GRN : (sim>0.3?GLD : RED);
      ctx.font='600 26px sans-serif'; ctx.fillText('cos θ = '+sim.toFixed(3), px, py+120);
      ctx.fillStyle='#dfeef0'; ctx.font='14px sans-serif';
      ctx.fillText('사이각 θ = '+ang.toFixed(1)+'°', px, py+146);
      var verdict = sim>0.85?'거의 같은 방향 — 매우 유사' : (sim>0.3?'어느 정도 닮음' : (sim>-0.3?'거의 무관(직각)':'반대 방향'));
      ctx.fillStyle = sim>0.85?GRN:(sim>0.3?GLD:RED); ctx.font='600 15px sans-serif';
      ctx.fillText(verdict, px, py+172);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
      ctx.fillText('θ=0°→1(같음), 90°→0(무관), 180°→−1(반대).', px, py+202);
      E.tapHint(W/2, H*0.95, '단어 B를 돌려 보세요 — 사이각이 작을수록 cos θ가 1에 가까워집니다', true);
      E.big('코사인 유사도 — 방향이 닮은 정도', '두 단어가 ‘얼마나 비슷한가’는 벡터 사이의 <b>각도</b>로 잽니다. 길이는 무시하고 <b>방향</b>만 보는 거죠 — 같은 방향이면 cos θ=1, 직각이면 0, 반대면 −1. 이것이 <b>코사인 유사도</b>입니다. 화면의 cos θ·각도는 내적과 길이로 계산한 값입니다. 다음 장의 어텐션도 바로 이 ‘내적으로 닮음 재기’ 위에 서 있습니다.'); }
  },

  // ══════════ 3. 벡터 산술 — king − man + woman ≈ queen ══════════
  { id:'ai10_03',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(360+this.s.step*80,0.07); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      function find(en){ for(var i=0;i<WORDS.length;i++) if(WORDS[i].en===en) return WORDS[i]; return null; }
      var king=find('king'), man=find('man'), woman=find('woman'), queen=find('queen');
      // 실제 벡터 산술: king - man + woman
      var rx = king.v[0]-man.v[0]+woman.v[0], ry = king.v[1]-man.v[1]+woman.v[1];
      var res=[rx,ry];
      // 결과에 가장 가까운 단어(코사인 유사도 실측)
      var best=-1, bestc=-2;
      for(var i=0;i<WORDS.length;i++){ var c=cos(res, WORDS[i].v); if(c>bestc){ bestc=c; best=i; } }
      var cx=W*0.34, cy=H*0.52, sc=Math.min(W*0.13,H*0.22);
      function SX(x){ return cx+x*sc; } function SY(y){ return cy-y*sc; }
      ctx.strokeStyle='rgba(61,214,220,0.15)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(SX(0),SY(0)); ctx.lineTo(SX(2.4),SY(0)); ctx.moveTo(SX(0),SY(0)); ctx.lineTo(SX(0),SY(2.2)); ctx.stroke();
      // 관련 단어 4개
      var pts=[king,man,woman,queen];
      for(i=0;i<pts.length;i++){ var o=pts[i]; ctx.fillStyle=o.c; ctx.globalAlpha=0.85;
        ctx.beginPath(); ctx.arc(SX(o.v[0]),SY(o.v[1]),6,0,7); ctx.fill(); ctx.globalAlpha=1;
        ctx.fillStyle=o.c; ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.fillText(o.t+'('+o.en+')', SX(o.v[0]), SY(o.v[1])-12); }
      // 단계별 화살표: 0=king, 1=−man, 2=+woman, 3=결과+근접
      var P0=[0,0], P1=king.v.slice();
      function arrow(ax,ay,bx,by,col){ ctx.strokeStyle=col; ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(SX(ax),SY(ay)); ctx.lineTo(SX(bx),SY(by)); ctx.stroke();
        var an=Math.atan2(-(SY(by)-SY(ay)),(SX(bx)-SX(ax))); var hx=SX(bx),hy=SY(by);
        ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(hx,hy); ctx.lineTo(hx-9*Math.cos(an-0.4),hy+9*Math.sin(an-0.4)); ctx.lineTo(hx-9*Math.cos(an+0.4),hy+9*Math.sin(an+0.4)); ctx.closePath(); ctx.fill(); }
      var pa=[0,0], pb;
      // 누적 경로 그리기
      if(s.step>=1){ arrow(0,0, king.v[0],king.v[1], BLU); }   // +king
      var afterKing=king.v;
      if(s.step>=2){ arrow(afterKing[0],afterKing[1], afterKing[0]-man.v[0],afterKing[1]-man.v[1], RED); }   // −man
      var afterMan=[king.v[0]-man.v[0], king.v[1]-man.v[1]];
      if(s.step>=3){ arrow(afterMan[0],afterMan[1], res[0],res[1], PNK); }   // +woman
      // 결과점
      if(s.step>=3){ ctx.fillStyle=GLD; ctx.beginPath(); ctx.arc(SX(res[0]),SY(res[1]),8,0,7); ctx.fill();
        ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(SX(res[0]),SY(res[1]),12,0,7); ctx.stroke();
        ctx.fillStyle=GLD; ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.fillText('결과', SX(res[0]), SY(res[1])+26); }
      // 설명 패널
      var qx=W*0.62, qy=H*0.24;
      var labels=['① 시작: king 벡터','② − man (남성성 빼기)','③ + woman (여성성 더하기)','④ 결과 ≈ ?'];
      ctx.fillStyle='#dfeef0'; ctx.font='600 16px sans-serif'; ctx.textAlign='left';
      ctx.fillText('벡터 산술: king − man + woman', qx, qy);
      for(i=0;i<4;i++){ ctx.fillStyle=(i<=s.step?'#dfeef0':DIM); ctx.font=(i===s.step?'600 ':'')+'14px sans-serif';
        ctx.fillText(labels[i], qx, qy+30+i*24); }
      if(s.step>=3){
        ctx.fillStyle=CYA; ctx.font='600 14px sans-serif';
        ctx.fillText('결과 = ('+res[0].toFixed(2)+', '+res[1].toFixed(2)+')', qx, qy+136);
        ctx.fillStyle=GLD; ctx.font='600 18px sans-serif';
        ctx.fillText('가장 가까운 단어: "'+WORDS[best].t+'"', qx, qy+166);
        ctx.fillStyle='#dfeef0'; ctx.font='14px sans-serif';
        ctx.fillText('코사인 유사도 = '+bestc.toFixed(3), qx, qy+190);
        ctx.fillStyle=(WORDS[best].en==='queen'?GRN:RED); ctx.font='600 14px sans-serif';
        ctx.fillText(WORDS[best].en==='queen'?'→ queen(여왕)! 의미가 산술로 잡힘':'→ 근접 단어', qx, qy+214);
      }
      E.tapHint(W/2, H*0.95, '화면 탭 = 단계 진행 (king → −man → +woman → 결과)', true);
      E.big('벡터 산술 — 의미가 계산이 된다', '임베딩의 놀라운 성질: 단어 벡터끼리 <b>덧셈·뺄셈</b>을 하면 의미가 계산됩니다. ‘왕’에서 ‘남자’를 빼고 ‘여자’를 더하면 — 놀랍게도 ‘여왕’ 근처에 떨어지죠. 즉 <b>king − man + woman ≈ queen</b>. ‘왕다움’에서 성별만 바꾼 셈입니다. 화면의 결과 좌표와 가장 가까운 단어는 벡터 덧뺄셈과 유사도로 찾은 것입니다.'); }
  },

  // ══════════ 4. 어텐션 입문 — 정보 병목을 푸는 길 ══════════
  { id:'ai10_04',
    enter:function(E){ var self=this; this.s={mode:1};
      E.controls('<div class="ctrl"><label>방식</label><input type="range" id="md" min="0" max="1" step="1" value="1"><output id="mdo">어텐션</output></div>');
      E.bind('#md','input',function(e){ self.s.mode=+e.target.value; document.getElementById('mdo').textContent=['RNN(병목)','어텐션'][self.s.mode]; E.blip(360,0.06); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var words=[{t:'나는',k:[1.0,0.2]},{t:'책을',k:[0.3,1.0]},{t:'읽었다',k:[-0.5,0.6]}];
      var n=words.length, x0=W*0.16, gap=W*0.20, by=H*0.30;
      ctx.fillStyle='#dfeef0'; ctx.font='600 15px sans-serif'; ctx.textAlign='left'; ctx.fillText('입력 문장', x0-10, by-58);
      if(s.mode===0){
        // RNN: 한 벡터로 압축 → 병목
        for(var i=0;i<n;i++){ var cx=x0+i*gap;
          ctx.fillStyle='rgba(122,184,255,0.5)'; if(ctx.roundRect){ctx.beginPath();ctx.roundRect(cx-30,by,60,34,9);ctx.fill();}else ctx.fillRect(cx-30,by,60,34);
          ctx.fillStyle='#dfeef0'; ctx.font='600 15px sans-serif'; ctx.textAlign='center'; ctx.fillText(words[i].t, cx, by+22);
          if(i<n-1){ ctx.strokeStyle=BLU; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(cx+30,by+17); ctx.lineTo(cx+gap-30,by+17); ctx.stroke(); } }
        // 깔때기 → 하나의 맥락벡터
        var fx=x0+(n-1)*gap+gap*0.4, fy=by+17;
        ctx.strokeStyle=RED; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(fx,fy); ctx.lineTo(W*0.66,H*0.50); ctx.stroke();
        ctx.fillStyle=RED; ctx.beginPath(); ctx.arc(W*0.66,H*0.50,16,0,7); ctx.fill();
        ctx.fillStyle='#0a1417'; ctx.font='600 11px sans-serif'; ctx.textAlign='center'; ctx.fillText('맥락', W*0.66, H*0.50+4);
        ctx.fillStyle=RED; ctx.font='600 15px sans-serif'; ctx.textAlign='left';
        ctx.fillText('정보 병목: 문장 전체를 벡터 하나에 욱여넣음', W*0.18, H*0.66);
        ctx.fillStyle=DIM; ctx.font='13.5px sans-serif';
        ctx.fillText('문장이 길어지면 앞 단어 정보가 뭉개져 잊혀집니다.', W*0.18, H*0.66+24);
      } else {
        // 어텐션: 쿼리·키 내적→softmax 주목 (실계산)
        var q=[-0.4,0.7];   // 지금 만들 단어의 쿼리(예: 'read')
        var scores=words.map(function(o){ return dot(q,o.k); });
        var w=softmax(scores.map(function(v){return v*2;}));
        var mx=0; for(i=1;i<n;i++) if(w[i]>w[mx]) mx=i;
        ctx.fillStyle=GLD; ctx.font='600 14px sans-serif'; ctx.textAlign='center';
        ctx.fillText('쿼리(지금 보는 관점)', W*0.5, by-58);
        for(i=0;i<n;i++){ var cx2=x0+i*gap;
          // 주목도 막대
          var bh=w[i]*H*0.20;
          ctx.fillStyle=(i===mx)?CYA:'rgba(61,214,220,0.32)'; ctx.fillRect(cx2-24, by-bh-6, 48, bh);
          ctx.fillStyle=(i===mx)?CYA:DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText((w[i]*100).toFixed(0)+'%', cx2, by-bh-12);
          // 토큰 박스
          ctx.fillStyle=(i===mx)?CYA:'rgba(255,255,255,0.08)'; if(ctx.roundRect){ctx.beginPath();ctx.roundRect(cx2-30,by,60,34,9);ctx.fill();}else ctx.fillRect(cx2-30,by,60,34);
          ctx.fillStyle=(i===mx)?'#0a1417':'#dfeef0'; ctx.font='600 15px sans-serif'; ctx.fillText(words[i].t, cx2, by+22);
          ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.fillText('내적 '+scores[i].toFixed(2), cx2, by+50); }
        ctx.fillStyle=CYA; ctx.font='600 15px sans-serif'; ctx.textAlign='left';
        ctx.fillText('어텐션: 입력의 모든 단어를 직접 봅니다', W*0.18, H*0.66);
        ctx.fillStyle='#dfeef0'; ctx.font='13.5px sans-serif';
        ctx.fillText('→ "'+words[mx].t+'"에 '+(w[mx]*100).toFixed(0)+'% 주목 (쿼리·키 내적→Softmax)', W*0.18, H*0.66+24);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
        ctx.fillText('맥락벡터 = Σ(주목도 × 단어) — 병목 없이 직접 참조.', W*0.18, H*0.66+46);
      }
      E.tapHint(W/2, H*0.95, '슬라이더로 RNN(병목) ↔ 어텐션을 비교해 보세요', true);
      E.big('어텐션 입문 — 정보 병목을 푸는 길', 'RNN은 문장 전체를 <b>맥락벡터 하나</b>에 욱여넣어 디코더에 넘겼습니다 — 길어지면 앞 정보가 뭉개지는 <b>정보 병목</b>이죠. <b>어텐션</b>은 발상을 뒤집습니다: 출력할 때 입력의 <b>모든 단어를 직접 보고</b>, 지금 관점(쿼리)과 닮은 단어에 더 주목합니다. 주목도는 쿼리·단어 벡터의 <b>내적을 Softmax</b>한 값 — 이 닮음 재기가 바로 앞에서 배운 코사인·내적입니다.'); }
  },

  // ══════════ 5. 임베딩 → Transformer 다리 ══════════
  { id:'ai10_05',
    enter:function(E){ this.s={step:3,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(340+this.s.step*70,0.07); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var stages=[
        {t:'① 단어', d:'토큰(글자/조각)', c:DIM},
        {t:'② 임베딩', d:'단어 → 의미 벡터', c:GRN},
        {t:'③ 어텐션', d:'내적·Softmax로 서로 주목', c:CYA},
        {t:'④ Transformer', d:'Self-Attention 블록을 쌓아 GPT·BERT', c:GLD}
      ];
      var n=stages.length, bw=W*0.19, bh=H*0.18, gap=W*0.02;
      var totalW=n*bw+(n-1)*gap, x0=(W-totalW)/2, cy=H*0.44;
      for(var i=0;i<n;i++){ var bx=x0+i*(bw+gap), on=(i<=s.step);
        ctx.globalAlpha=on?1:0.28;
        ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.strokeStyle=stages[i].c; ctx.lineWidth=(i===s.step)?2.6:1.5;
        if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(bx,cy-bh/2,bw,bh,12); ctx.fill(); ctx.stroke(); }
        else { ctx.fillRect(bx,cy-bh/2,bw,bh); ctx.strokeRect(bx,cy-bh/2,bw,bh); }
        ctx.fillStyle=stages[i].c; ctx.font='600 17px sans-serif'; ctx.textAlign='center';
        ctx.fillText(stages[i].t, bx+bw/2, cy-6);
        ctx.fillStyle='#dfeef0'; ctx.font='12.5px sans-serif';
        // 줄바꿈 간단 처리
        var d=stages[i].d, words=d.split(' '), line='', yy=cy+18;
        for(var k=0;k<words.length;k++){ var test=line?line+' '+words[k]:words[k];
          if(ctx.measureText(test).width>bw-16 && line){ ctx.fillText(line, bx+bw/2, yy); line=words[k]; yy+=16; } else line=test; }
        ctx.fillText(line, bx+bw/2, yy);
        ctx.globalAlpha=1;
        // 화살표
        if(i<n-1 && i<s.step){ var ax=bx+bw, ay=cy;
          ctx.strokeStyle=GLD; ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(ax+2,ay); ctx.lineTo(ax+gap-2,ay); ctx.stroke();
          ctx.fillStyle=GLD; ctx.beginPath(); ctx.moveTo(ax+gap-2,ay); ctx.lineTo(ax+gap-9,ay-5); ctx.lineTo(ax+gap-9,ay+5); ctx.closePath(); ctx.fill(); }
      }
      // 하단 요약
      ctx.fillStyle='#dfeef0'; ctx.font='15px sans-serif'; ctx.textAlign='center';
      if(s.step>=3){
        ctx.fillStyle=GLD; ctx.font='600 17px sans-serif';
        ctx.fillText('임베딩 + 어텐션 = Transformer의 두 기둥', W/2, H*0.72);
        ctx.fillStyle='#dfeef0'; ctx.font='14px sans-serif';
        ctx.fillText('다음 장(제11장)에서 Q·K·V, Self-Attention, 위치 인코딩으로 완성합니다.', W/2, H*0.72+28);
      } else {
        ctx.fillStyle=DIM; ctx.font='14px sans-serif';
        ctx.fillText('화면을 탭해 단어 → 임베딩 → 어텐션 → Transformer 흐름을 이어 보세요.', W/2, H*0.72);
      }
      // 두 기둥 강조
      ctx.fillStyle=GRN; ctx.font='600 13px sans-serif'; ctx.textAlign='center';
      if(s.step>=1) ctx.fillText('이 장에서 배움', x0+1*(bw+gap)+bw/2, cy+bh/2+34);
      if(s.step>=2){ ctx.fillStyle=CYA; ctx.fillText('이 장에서 배움', x0+2*(bw+gap)+bw/2, cy+bh/2+34); }
      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 단계 (다음 장 Transformer 예고)', true);
      E.big('임베딩 → Transformer 다리', '이 장의 두 도구 — <b>임베딩</b>(단어를 의미 벡터로)과 <b>어텐션</b>(내적·Softmax로 서로 주목) — 이 곧장 <b>Transformer</b>로 이어집니다. 단어를 벡터로 바꾸고(임베딩), 그 벡터들이 어텐션으로 서로를 보게 하고, 그 블록을 깊이 쌓으면 GPT·BERT 같은 거대 언어모델이 됩니다. 다음 장에서 Q·K·V와 Self-Attention, 위치 인코딩으로 그 구조를 완성합니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
