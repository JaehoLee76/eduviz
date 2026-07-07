/* 인공지능 제6장 — 신경망과 순전파: 퍼셉트론 · 활성함수 · 다층 구조 · 순전파 · XOR
   동작(behavior)만. 텍스트=content/ai6.json. 엔진 js/engine.js 공유. 색: AI=시안.
   골든룰: 화면의 가중합·활성값·출력·결정경계는 전부 draw()에서 순전파를 실제로 수행해 계산(베껴 그리기·하드코딩 금지). */
(function(){
  var CYA='#3dd6dc', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', PNK='#f4a0c0', DIM='#9b99a3', RED='#f0888a';

  // 활성함수(전부 실제 식)
  function sigmoid(z){ return 1/(1+Math.exp(-z)); }
  function tanhf(z){ return Math.tanh(z); }
  function relu(z){ return z>0?z:0; }
  function step01(z){ return z>=0?1:0; }

  var scenes = [

  // ══════════ 1. 퍼셉트론 — 가중합 + 계단함수 (AND/OR) ══════════
  { id:'ai6_01',
    enter:function(E){ var self=this; this.s={x1:1,x2:0,mode:0};   // mode 0=AND, 1=OR
      E.controls('<div class="ctrl"><label>입력 x₁</label><input type="range" id="x1" min="0" max="1" step="1" value="1"><output id="x1o">1</output>'
        +'<label style="margin-left:14px">입력 x₂</label><input type="range" id="x2" min="0" max="1" step="1" value="0"><output id="x2o">0</output></div>');
      E.bind('#x1','input',function(e){ self.s.x1=+e.target.value; document.getElementById('x1o').textContent=e.target.value; E.blip(360,0.06); });
      E.bind('#x2','input',function(e){ self.s.x2=+e.target.value; document.getElementById('x2o').textContent=e.target.value; E.blip(320,0.06); });
      E.setOn([]); },
    tap:function(E){ this.s.mode=(this.s.mode+1)%2; E.blip(420,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // AND: w1=w2=1, b=-1.5 → x1+x2-1.5>=0 만 참(둘 다 1). OR: w1=w2=1, b=-0.5 → 하나만 1이어도 참.
      var w1=1, w2=1, b=(s.mode===0?-1.5:-0.5);
      var z = w1*s.x1 + w2*s.x2 + b;     // 실제 가중합
      var y = step01(z);                  // 실제 계단함수
      var nx=W*0.20, ix1y=H*0.32, ix2y=H*0.58, ny=H*0.45, sx=W*0.56, ox2=W*0.82;
      // 입력 노드
      function inode(x,yy,val,lab){ ctx.beginPath(); ctx.arc(x,yy,26,0,7); ctx.fillStyle='rgba(122,184,255,0.16)'; ctx.fill();
        ctx.strokeStyle=BLU; ctx.lineWidth=2; ctx.stroke();
        ctx.fillStyle=BLU; ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.fillText(lab, x, yy-34);
        ctx.fillStyle='#fff'; ctx.font='600 18px sans-serif'; ctx.fillText(val, x, yy+6); }
      inode(nx, ix1y, s.x1, 'x₁'); inode(nx, ix2y, s.x2, 'x₂');
      // 가중치 연결선(굵기=|w|, 색=부호)
      function edge(x0,y0,x1c,y1c,wv){ ctx.strokeStyle=wv>=0?GRN:RED; ctx.lineWidth=1+Math.abs(wv)*2.4;
        ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x1c,y1c); ctx.stroke();
        ctx.fillStyle=wv>=0?GRN:RED; ctx.font='12px sans-serif'; ctx.textAlign='center';
        ctx.fillText('w='+wv, (x0+x1c)/2, (y0+y1c)/2-8); }
      edge(nx+26, ix1y, sx-30, ny, w1); edge(nx+26, ix2y, sx-30, ny, w2);
      // 합산 뉴런
      ctx.beginPath(); ctx.arc(sx, ny, 34, 0, 7); ctx.fillStyle='rgba(255,210,122,0.14)'; ctx.fill();
      ctx.strokeStyle=GLD; ctx.lineWidth=2.4; ctx.stroke();
      ctx.fillStyle=GLD; ctx.font='600 22px sans-serif'; ctx.textAlign='center'; ctx.fillText('Σ', sx, ny+8);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('b = '+b, sx, ny+54);
      // 출력 노드
      ctx.beginPath(); ctx.arc(ox2, ny, 28, 0, 7); ctx.fillStyle=y? 'rgba(126,224,176,0.22)':'rgba(155,153,163,0.14)'; ctx.fill();
      ctx.strokeStyle=y?GRN:DIM; ctx.lineWidth=2.4; ctx.stroke();
      ctx.fillStyle=y?GRN:DIM; ctx.font='600 24px sans-serif'; ctx.fillText(y, ox2, ny+8);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('출력 y', ox2, ny-38);
      ctx.strokeStyle=y?GRN:DIM; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(sx+34,ny); ctx.lineTo(ox2-28,ny); ctx.stroke();
      // 계산 패널(실측)
      var px=W*0.14, py=H*0.80;
      ctx.fillStyle='#dfeef0'; ctx.font='15px sans-serif'; ctx.textAlign='left';
      ctx.fillText('z = w₁x₁ + w₂x₂ + b = '+w1+'·'+s.x1+' + '+w2+'·'+s.x2+' + ('+b+') = '+z.toFixed(1), px, py);
      ctx.fillStyle=y?GRN:RED; ctx.font='600 16px sans-serif';
      ctx.fillText('계단함수: z '+(z>=0?'≥ 0  →  출력 1 (참)':'< 0  →  출력 0 (거짓)'), px, py+26);
      // 진리표(현재 게이트 — 실제 계산)
      var tx=W*0.62, ty=H*0.66; ctx.fillStyle=GLD; ctx.font='600 15px sans-serif'; ctx.textAlign='left';
      ctx.fillText((s.mode===0?'AND':'OR')+' 게이트 진리표', tx, ty);
      var combos=[[0,0],[0,1],[1,0],[1,1]]; ctx.font='13px sans-serif';
      for(var k=0;k<4;k++){ var a=combos[k][0], bb=combos[k][1], zz=w1*a+w2*bb+b, yy2=step01(zz);
        var on=(a===s.x1&&bb===s.x2); ctx.fillStyle=on?CYA:'#dfeef0';
        ctx.fillText('x₁='+a+', x₂='+bb+'  →  y = '+yy2+(on?'  ◀ 지금':''), tx, ty+22+k*22); }
      E.tapHint(W/2, H*0.95, '슬라이더로 입력을, 화면 탭으로 AND↔OR 전환', true);
      E.big('퍼셉트론 — 가장 단순한 인공 뉴런', '뉴런 하나가 하는 일은 놀랍도록 간단합니다 — 입력에 가중치를 곱해 더하고(가중합 z), 문턱(b)을 넘으면 1, 못 넘으면 0을 내보냅니다. 가중치와 문턱만 바꾸면 같은 구조가 AND도 되고 OR도 됩니다.'); }
  },

  // ══════════ 2. 활성함수 — sigmoid · tanh · ReLU ══════════
  { id:'ai6_02',
    enter:function(E){ var self=this; this.s={z:0.8};
      E.controls('<div class="ctrl"><label>입력 z</label><input type="range" id="zz" min="-5" max="5" step="0.1" value="0.8"><output id="zzo">0.8</output></div>');
      E.bind('#zz','input',function(e){ self.s.z=+e.target.value; document.getElementById('zzo').textContent=(+e.target.value).toFixed(1); E.blip(360,0.05); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, z=s.z;
      var ox=W*0.12, oy=H*0.62, pw=W*0.50, pv=H*0.40, zmin=-5, zmax=5, ymin=-1.1, ymax=2.2;
      function SX(zz){ return ox + (zz-zmin)/(zmax-zmin)*pw; }
      function SY(yy){ return oy - (yy-ymin)/(ymax-ymin)*pv; }
      // 축
      ctx.strokeStyle='rgba(61,214,220,0.22)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(ox,SY(0)); ctx.lineTo(ox+pw,SY(0)); ctx.moveTo(SX(0),oy+8); ctx.lineTo(SX(0),oy-pv-8); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('z', ox+pw, SY(0)+18); ctx.fillText('0', SX(0), SY(0)+16);
      // 세 곡선(실제 함수)
      var fns=[ {f:sigmoid, c:GRN, t:'sigmoid'}, {f:tanhf, c:BLU, t:'tanh'}, {f:relu, c:GLD, t:'ReLU'} ];
      for(var i=0;i<3;i++){ ctx.strokeStyle=fns[i].c; ctx.lineWidth=2.4; ctx.beginPath();
        var first=true; for(var zz=zmin;zz<=zmax+1e-6;zz+=0.04){ var yy=fns[i].f(zz); var py=SY(yy);
          if(py>oy)py=oy; if(py<oy-pv-8)py=oy-pv-8; if(first){ctx.moveTo(SX(zz),py);first=false;} else ctx.lineTo(SX(zz),py); } ctx.stroke(); }
      // 현재 입력 z 세로선
      ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.lineWidth=1.2; ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.moveTo(SX(z),oy+6); ctx.lineTo(SX(z),oy-pv-8); ctx.stroke(); ctx.setLineDash([]);
      // 각 곡선 위 점 + 수치(실측)
      var px=W*0.70, py0=H*0.26;
      ctx.fillStyle='#dfeef0'; ctx.font='600 16px sans-serif'; ctx.textAlign='left'; ctx.fillText('입력 z = '+z.toFixed(2)+' 일 때', px, py0);
      for(i=0;i<3;i++){ var val=fns[i].f(z), py=SY(val);
        ctx.fillStyle=fns[i].c; ctx.beginPath(); ctx.arc(SX(z),py,6,0,7); ctx.fill();
        ctx.strokeStyle='#fff'; ctx.lineWidth=1.2; ctx.stroke();
        ctx.fillStyle=fns[i].c; ctx.font='600 15px sans-serif'; ctx.textAlign='left';
        ctx.fillText(fns[i].t+'(z) = '+val.toFixed(4), px, py0+34+i*30); }
      ctx.fillStyle=DIM; ctx.font='13px sans-serif';
      ctx.fillText('sigmoid: 0~1 (확률처럼)', px, py0+34+3*30+16);
      ctx.fillText('tanh: −1~1 (0 중심)', px, py0+34+3*30+36);
      ctx.fillText('ReLU: 음수는 0, 양수는 그대로', px, py0+34+3*30+56);
      // 곡선 라벨
      ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillStyle=GRN; ctx.fillText('sigmoid', SX(2.2), SY(sigmoid(2.2))-6);
      ctx.fillStyle=BLU; ctx.fillText('tanh', SX(1.2), SY(tanhf(1.2))-18);
      ctx.fillStyle=GLD; ctx.fillText('ReLU', SX(1.8), SY(relu(1.8))-6);
      E.tapHint(W/2, H*0.95, '슬라이더로 z를 바꿔 세 활성값을 비교하세요', true);
      E.big('활성함수 — 비선형이라는 마법', '가중합만 쌓으면 아무리 깊어도 결국 직선 하나 — 층을 쌓는 의미가 없습니다. 그래서 각 뉴런 뒤에 휘어진 활성함수를 끼웁니다. 이 작은 비선형 덕분에 신경망이 곡선·경계를 자유롭게 그릴 수 있게 되죠.'); }
  },

  // ══════════ 3. 다층 신경망 구조 ══════════
  { id:'ai6_03',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, fr=E.frame;
      // 층 구성: 입력 3 · 은닉 4 · 출력 2
      var layers=[3,4,2];
      var lx=[W*0.24, W*0.50, W*0.76];
      var cols=[BLU, GLD, GRN];
      var names=['입력층','은닉층','출력층'];
      function ny(li, ni){ var n=layers[li]; var gap=H*0.13; var top=H*0.45-(n-1)*gap/2; return top+ni*gap; }
      // 결정적 가중치(난수 없음): 부호·크기를 인덱스로 생성
      function wgt(li,a,b){ return Math.sin((li+1)*2.3 + a*1.7 + b*0.9); }   // -1~1
      // 연결선(굵기=|w|, 색=부호) — 흐르는 신호 점
      var flow=(fr*0.012)%1;
      for(var li=0; li<2; li++){ for(var a=0;a<layers[li];a++){ for(var b=0;b<layers[li+1];b++){
        var w=wgt(li,a,b), x0=lx[li], y0=ny(li,a), x1=lx[li+1], y1=ny(li+1,b);
        ctx.strokeStyle = (w>=0?'rgba(126,224,176,':'rgba(240,136,138,')+(0.18+Math.abs(w)*0.5)+')';
        ctx.lineWidth = 0.6 + Math.abs(w)*2.6;
        ctx.beginPath(); ctx.moveTo(x0+22,y0); ctx.lineTo(x1-22,y1); ctx.stroke();
        // 흐르는 신호 점
        var fx=x0+22+(x1-22-(x0+22))*flow, fy=y0+(y1-y0)*flow;
        ctx.fillStyle=w>=0?GRN:RED; ctx.globalAlpha=0.7; ctx.beginPath(); ctx.arc(fx,fy,2.6,0,7); ctx.fill(); ctx.globalAlpha=1;
      }}}
      // 노드
      for(li=0; li<3; li++){ for(var i2=0;i2<layers[li];i2++){
        var x=lx[li], yy=ny(li,i2);
        ctx.beginPath(); ctx.arc(x,yy,20,0,7);
        ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.fill();
        ctx.strokeStyle=cols[li]; ctx.lineWidth=2.2; ctx.stroke();
      }}
      // 층 라벨
      for(li=0; li<3; li++){ ctx.fillStyle=cols[li]; ctx.font='600 15px sans-serif'; ctx.textAlign='center';
        ctx.fillText(names[li], lx[li], H*0.16);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('('+layers[li]+'개)', lx[li], H*0.16+20); }
      // 설명: 연결 = 가중치, 굵기/색 의미
      var bx=W*0.50, by=H*0.82;
      ctx.fillStyle='#dfeef0'; ctx.font='13.5px sans-serif'; ctx.textAlign='center';
      ctx.fillText('연결선 하나 = 가중치 하나   ·   굵을수록 |w| 큼', bx, by);
      ctx.fillStyle=GRN; ctx.font='12px sans-serif'; ctx.fillText('초록 = 양(+) 가중치    ', bx-70, by+22);
      ctx.fillStyle=RED; ctx.fillText('빨강 = 음(−) 가중치', bx+90, by+22);
      ctx.fillStyle=DIM; ctx.fillText('총 가중치 수 = 3×4 + 4×2 = '+(3*4+4*2)+'개', bx, by+44);
      E.tapHint(W/2, H*0.95, '신호가 입력→은닉→출력으로 흐릅니다', false);
      E.big('다층 신경망 — 뉴런을 층층이 쌓다', '뉴런 하나로는 직선밖에 못 긋습니다. 그래서 여러 뉴런을 한 층으로 묶고, 층을 겹겹이 쌓습니다. 한 층의 출력이 다음 층의 입력이 되며, 모든 연결마다 가중치 하나 — 이 숫자들의 묶음이 곧 신경망의 ‘지식’입니다.'); }
  },

  // ══════════ 4. 순전파 — 입력→은닉→출력 실제 계산 ══════════
  { id:'ai6_04',
    enter:function(E){ var self=this; this.s={x1:0.6, x2:0.9};
      E.controls('<div class="ctrl"><label>입력 x₁</label><input type="range" id="x1" min="0" max="1" step="0.05" value="0.6"><output id="x1o">0.60</output>'
        +'<label style="margin-left:14px">입력 x₂</label><input type="range" id="x2" min="0" max="1" step="0.05" value="0.9"><output id="x2o">0.90</output></div>');
      E.bind('#x1','input',function(e){ self.s.x1=+e.target.value; document.getElementById('x1o').textContent=(+e.target.value).toFixed(2); E.blip(360,0.05); });
      E.bind('#x2','input',function(e){ self.s.x2=+e.target.value; document.getElementById('x2o').textContent=(+e.target.value).toFixed(2); E.blip(320,0.05); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 구조: 입력2 → 은닉3(sigmoid) → 출력1(sigmoid). 결정적 가중치/편향.
      var x=[s.x1, s.x2];
      // 은닉층 가중치 W1[h][i], 편향 b1[h]
      var W1=[[ 0.8,-0.5],[-0.6, 0.9],[ 0.4, 0.7]], b1=[-0.2, 0.1, -0.4];
      var W2=[ 0.9,-0.8, 0.6], b2=-0.1;
      // 순전파 실제 계산
      var hz=[], h=[];
      for(var j=0;j<3;j++){ var z=b1[j]; for(var i=0;i<2;i++) z+=W1[j][i]*x[i]; hz[j]=z; h[j]=sigmoid(z); }
      var oz=b2; for(j=0;j<3;j++) oz+=W2[j]*h[j]; var out=sigmoid(oz);
      // 좌표
      var ix=W*0.16, hx=W*0.46, ox2=W*0.76;
      function iy(k,n){ var gap=H*0.16, top=H*0.45-(n-1)*gap/2; return top+k*gap; }
      // 연결선
      function edge(x0,y0,x1c,y1c,w){ ctx.strokeStyle=(w>=0?'rgba(126,224,176,':'rgba(240,136,138,')+(0.25+Math.abs(w)*0.45)+')';
        ctx.lineWidth=0.8+Math.abs(w)*2.2; ctx.beginPath(); ctx.moveTo(x0+24,y0); ctx.lineTo(x1c-24,y1c); ctx.stroke(); }
      for(j=0;j<3;j++) for(i=0;i<2;i++) edge(ix, iy(i,2), hx, iy(j,3), W1[j][i]);
      for(j=0;j<3;j++) edge(hx, iy(j,3), ox2, iy(0,1), W2[j]);
      // 노드 렌더(활성값 표시)
      function node(x,yy,col,val,lab){ ctx.beginPath(); ctx.arc(x,yy,24,0,7);
        var a=Math.max(0,Math.min(1,val)); ctx.fillStyle='rgba('+(col===BLU?'122,184,255':col===GLD?'255,210,122':'126,224,176')+','+(0.10+a*0.40)+')'; ctx.fill();
        ctx.strokeStyle=col; ctx.lineWidth=2.2; ctx.stroke();
        ctx.fillStyle='#fff'; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.fillText(val.toFixed(2), x, yy+5);
        if(lab){ ctx.fillStyle=col; ctx.font='11px sans-serif'; ctx.fillText(lab, x, yy-30); } }
      node(ix, iy(0,2), BLU, x[0], 'x₁'); node(ix, iy(1,2), BLU, x[1], 'x₂');
      for(j=0;j<3;j++) node(hx, iy(j,3), GLD, h[j], 'h'+(j+1));
      node(ox2, iy(0,1), GRN, out, 'ŷ');
      // 층 라벨
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center';
      ctx.fillText('입력', ix, H*0.16); ctx.fillText('은닉(sigmoid)', hx, H*0.16); ctx.fillText('출력(sigmoid)', ox2, H*0.16);
      // 계산 패널(실측 — 은닉 1번 뉴런 상세)
      var px=W*0.10, py=H*0.78;
      ctx.fillStyle='#dfeef0'; ctx.font='13.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText('h₁: z = '+b1[0]+' + ('+W1[0][0]+')·'+x[0].toFixed(2)+' + ('+W1[0][1]+')·'+x[1].toFixed(2)+' = '+hz[0].toFixed(3)+'  →  σ(z) = '+h[0].toFixed(3), px, py);
      ctx.fillText('ŷ: z = '+b2+' + Σ w·h = '+oz.toFixed(3)+'  →  σ(z) = '+out.toFixed(3), px, py+24);
      ctx.fillStyle=GRN; ctx.font='600 16px sans-serif';
      ctx.fillText('최종 출력 ŷ = '+out.toFixed(4), px, py+52);
      E.tapHint(W/2, H*0.95, '입력을 바꾸면 신호가 층층이 흘러 출력이 갱신됩니다', true);
      E.big('순전파 — 신호가 앞으로 흐르다', '입력을 넣으면 값이 층을 따라 한 방향으로 흐릅니다. 각 뉴런은 ‘가중합 → 활성함수’ 한 번씩 — 이 작은 동작을 층마다 반복하면 끝에서 답이 나옵니다. 노드 안 숫자는 전부 활성값입니다.'); }
  },

  // ══════════ 5. XOR — 단층은 못 가르고, 2층은 가른다 ══════════
  { id:'ai6_05',
    enter:function(E){ this.s={mode:0}; E.setOn([]); },   // 0=단층(선형), 1=2층
    tap:function(E){ this.s.mode=(this.s.mode+1)%2; E.blip(400+this.s.mode*120,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, two=(s.mode===1);
      var ox=W*0.16, oy=H*0.78, pw=W*0.46, pv=H*0.56;
      function SX(x){ return ox + x*pw; } function SY(y){ return oy - y*pv; }
      // 결정경계 영역(실제 분류기 출력으로 칠하기)
      // 단층 퍼셉트론: w·x+b — XOR는 절대 못 가름. 한 직선으로 시도(w1=1,w2=1,b=-0.5 → OR에 가까움).
      // 2층: XOR = (x1 OR x2) AND NOT(x1 AND x2). sigmoid 뉴런 2개 + 출력.
      function classifySingle(x1,x2){ return (1*x1 + 1*x2 - 0.5) >= 0 ? 1 : 0; }
      function classifyTwo(x1,x2){
        var hOR  = sigmoid(20*( x1 + x2 - 0.5));   // OR
        var hAND = sigmoid(20*( x1 + x2 - 1.5));   // AND
        var y = sigmoid(20*( hOR - hAND - 0.5));   // OR AND NOT AND  = XOR
        return y>=0.5?1:0;
      }
      var cls = two?classifyTwo:classifySingle;
      // 배경 그리드 영역 채우기
      var step=0.04;
      for(var gx=0; gx<1; gx+=step){ for(var gy=0; gy<1; gy+=step){
        var v=cls(gx+step/2, gy+step/2);
        ctx.fillStyle = v? 'rgba(126,224,176,0.16)' : 'rgba(244,160,192,0.13)';
        ctx.fillRect(SX(gx), SY(gy+step), pw*step, pv*step);
      }}
      // 축
      ctx.strokeStyle='rgba(61,214,220,0.3)'; ctx.lineWidth=1;
      ctx.strokeRect(SX(0),SY(1),pw,pv);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('x₁ →', SX(1)+4, SY(0)+18); ctx.textAlign='right'; ctx.fillText('x₂ ↑', SX(0)-6, SY(1)+4);
      // XOR 4점(진리표) — 실제 라벨로 표시. XOR: 다르면 1, 같으면 0
      var pts=[[0,0],[0,1],[1,0],[1,1]];
      for(var k=0;k<4;k++){ var a=pts[k][0], b=pts[k][1], target=(a!==b)?1:0, pred=cls(a,b);
        ctx.beginPath(); ctx.arc(SX(a),SY(b),11,0,7); ctx.fillStyle=target?GRN:PNK; ctx.fill();
        ctx.strokeStyle = pred===target?'#fff':RED; ctx.lineWidth = pred===target?1.5:3; ctx.stroke();
        ctx.fillStyle='#0a0f12'; ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.fillText(target, SX(a),SY(b)+5); }
      // 정확도 실측
      var correct=0; for(k=0;k<4;k++){ var t=(pts[k][0]!==pts[k][1])?1:0; if(cls(pts[k][0],pts[k][1])===t) correct++; }
      // 패널
      var qx=W*0.68, qy=H*0.28;
      ctx.fillStyle = two?GRN:RED; ctx.font='600 18px sans-serif'; ctx.textAlign='left';
      ctx.fillText(two?'2층 신경망':'단층 퍼셉트론', qx, qy);
      ctx.fillStyle='#dfeef0'; ctx.font='14px sans-serif';
      ctx.fillText(two?'경계가 휘어 XOR을 가릅니다':'직선 하나로는 XOR 불가', qx, qy+28);
      ctx.fillStyle = correct===4?GRN:RED; ctx.font='600 16px sans-serif';
      ctx.fillText('정확히 분류: '+correct+' / 4', qx, qy+58);
      ctx.fillStyle=DIM; ctx.font='13px sans-serif';
      ctx.fillText('초록=목표 1 (서로 다름)', qx, qy+90);
      ctx.fillStyle=PNK; ctx.fillText('분홍=목표 0 (서로 같음)', qx, qy+110);
      ctx.fillStyle=DIM; ctx.fillText('빨강 테두리 = 잘못 분류한 점', qx, qy+130);
      if(two){ ctx.fillStyle=GLD; ctx.font='12px sans-serif';
        ctx.fillText('XOR = (OR) AND NOT(AND)', qx, qy+158);
        ctx.fillText('은닉 뉴런 2개가 OR·AND를 만들고', qx, qy+176);
        ctx.fillText('출력 뉴런이 둘을 조합합니다', qx, qy+194); }
      E.tapHint(W/2, H*0.95, '화면 탭 = 단층 ↔ 2층 신경망 전환', true);
      E.big('XOR 문제 — 깊이가 필요한 이유', '“서로 다르면 1” — 사람에겐 쉬운 이 XOR을 직선 하나로는 절대 가를 수 없습니다(1969년, 단층 퍼셉트론의 한계). 하지만 뉴런을 한 층 더 쌓으면 경계가 휘어 깔끔히 갈립니다. 이 한 칸의 깊이가 신경망 부활의 열쇠였습니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
