/* 인공지능 제9장 — RNN·시퀀스: 순환 은닉상태 · 다음 토큰 예측 · 펼친 순전파 · 기울기 소실 · LSTM 게이트
   출처: 「혁펜하임의 Easy! 딥러닝」 Ch.8 (RNN·시퀀스 모델링·LSTM).
   동작(behavior)만. 텍스트=content/ai9.json. 엔진 js/engine.js 공유. 색: AI=시안.
   골든룰: 은닉상태 h_t=tanh(...)·softmax 예측확률·∏tanh'·W 그래디언트·LSTM 게이트(sigmoid)는 전부 실제로 계산(베껴 그리기 금지). 난수표시 금지(결정적 가중치·시퀀스). */
(function(){
  var CYA='#3dd6dc', BLU='#7ab8ff', GLD='#ffd27a', GRN='#7ee0b0', PNK='#f4a0c0', DIM='#9b99a3', RED='#f0888a';

  function tanh(x){ return Math.tanh(x); }
  function sig(x){ return 1/(1+Math.exp(-x)); }
  function softmax(arr){ var m=-1e9,i; for(i=0;i<arr.length;i++) if(arr[i]>m)m=arr[i];
    var e=[],s=0; for(i=0;i<arr.length;i++){ var v=Math.exp(arr[i]-m); e.push(v); s+=v; }
    for(i=0;i<e.length;i++) e[i]/=s; return e; }

  var scenes = [

  // ══════════ 1. RNN 구조 · 은닉상태가 기억을 이어 나른다 ══════════
  { id:'ai9_01',
    enter:function(E){ var self=this; this.s={t:1};
      E.controls('<div class="ctrl"><label>시점 t (몇 번째 단어까지 읽었나)</label><input type="range" id="tt" min="0" max="4" step="1" value="1"><output id="tto">1</output></div>');
      E.bind('#tt','input',function(e){ self.s.t=+e.target.value; document.getElementById('tto').textContent=e.target.value; E.blip(340+self.s.t*40,0.06); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 결정적 가중치(스칼라 RNN 단순화): h_t = tanh(Wx·x_t + Wh·h_{t-1} + b)
      var Wx=0.9, Wh=0.8, b=-0.1;
      var seq=['나','는','학교','에','간다'];          // 입력 시퀀스
      var xval=[0.6,-0.3,0.9,0.2,0.7];                  // 각 단어의 결정적 입력값(임베딩 1D)
      var hs=[0]; for(var i=0;i<seq.length;i++) hs.push(tanh(Wx*xval[i]+Wh*hs[i]+b));  // 실계산 누적
      // 셀 체인 그리기
      var n=seq.length, x0=W*0.12, gap=(W*0.78)/n, cy=H*0.46, R=Math.min(gap*0.30,28);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillText('h₀ = 0', x0-2, cy+R+38);
      for(i=0;i<n;i++){ var cx=x0+gap*0.5+i*gap, on=(i<s.t), cur=(i===s.t-1);
        // h_{t-1}→h_t 화살표(은닉상태 전달)
        ctx.strokeStyle= on?CYA:'rgba(255,255,255,0.12)'; ctx.lineWidth= cur?3:2;
        var prevx = (i===0)? x0 : (x0+gap*0.5+(i-1)*gap);
        ctx.beginPath(); ctx.moveTo(prevx+R, cy); ctx.lineTo(cx-R, cy); ctx.stroke();
        // 입력 화살표(아래에서 위로)
        ctx.strokeStyle= on?GLD:'rgba(255,255,255,0.12)'; ctx.lineWidth=1.6;
        ctx.beginPath(); ctx.moveTo(cx, cy+R+58); ctx.lineTo(cx, cy+R+4); ctx.stroke();
        // 셀
        ctx.fillStyle= cur?CYA:(on?'rgba(61,214,220,0.30)':'rgba(255,255,255,0.06)');
        ctx.beginPath(); ctx.arc(cx,cy,R,0,7); ctx.fill();
        ctx.strokeStyle= cur?'#fff':CYA; ctx.lineWidth= cur?2:1; ctx.stroke();
        ctx.fillStyle= cur?'#06222a':'#dfeef0'; ctx.font='600 13px sans-serif'; ctx.textAlign='center';
        ctx.fillText('h'+(i+1), cx, cy+4);
        // 입력 단어 박스
        ctx.fillStyle= on?GLD:DIM; ctx.font='600 14px sans-serif';
        ctx.fillText('"'+seq[i]+'"', cx, cy+R+74);
        ctx.fillStyle= on?'#cfe6e8':DIM; ctx.font='11px sans-serif';
        ctx.fillText('x='+xval[i].toFixed(1), cx, cy+R+90);
        // 현재 셀의 h값
        if(on){ ctx.fillStyle= cur?CYA:'rgba(61,214,220,0.7)'; ctx.font=(cur?'600 ':'')+'12px sans-serif';
          ctx.fillText('h='+hs[i+1].toFixed(3), cx, cy-R-10); } }
      // 현재 계산식(실측 대입)
      if(s.t>=1){ var k=s.t-1, px=W/2, py=H*0.80;
        ctx.fillStyle='#dfeef0'; ctx.font='600 15px sans-serif'; ctx.textAlign='center';
        ctx.fillText('h'+(k+1)+' = tanh( Wx·x + Wh·h'+k+' + b )', px, py);
        ctx.fillStyle=GLD; ctx.font='14px sans-serif';
        ctx.fillText('= tanh( '+Wx+'×'+xval[k].toFixed(1)+' + '+Wh+'×'+hs[k].toFixed(3)+' + '+b+' ) = '+hs[k+1].toFixed(3), px, py+24);
      } else { ctx.fillStyle=DIM; ctx.font='14px sans-serif'; ctx.textAlign='center'; ctx.fillText('아직 아무 단어도 안 읽음 — 슬라이더로 t를 올려 보세요.', W/2, H*0.80); }
      E.tapHint(W/2, H*0.95, '시점 t를 옮겨 은닉상태 h가 한 칸씩 갱신되는 걸 보세요', true);
      E.big('RNN 구조 — 은닉상태가 기억을 이어 나른다', 'RNN은 시퀀스를 <b>한 단어씩</b> 읽습니다. 매 시점 같은 셀이 “지금 입력 x와 직전 기억 h를 섞어 새 기억을 만든다” — <b>h_t = tanh(Wx·x_t + Wh·h_{t-1} + b)</b>. 핵심은 같은 가중치(Wx·Wh·b)를 <b>매 시점 재사용</b>하고, h가 과거 전체의 요약을 담아 다음으로 전달된다는 점입니다. 화면의 h값은 전부 실제로 누적 계산한 것입니다.'); }
  },

  // ══════════ 2. 다음 토큰 예측 — 'Hello' 자동완성 ══════════
  { id:'ai9_02',
    enter:function(E){ var self=this; this.s={t:0};
      E.controls('<div class="ctrl"><label>현재 위치 (이 글자까지 봤을 때 다음을 예측)</label><input type="range" id="pp" min="0" max="3" step="1" value="0"><output id="ppo">H</output></div>');
      E.bind('#pp','input',function(e){ self.s.t=+e.target.value; document.getElementById('ppo').textContent='Hell'[self.s.t]; E.blip(360,0.06); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var vocab=['H','e','l','o'];                 // 어휘 4글자
      var word='Hello';                            // 목표 단어
      // 결정적 로짓: 입력글자 인덱스 × 위치에 따라 다음글자 점수. (학습된 RNN이 내놓을 법한 결정적 값)
      // logit[next] = base(next) + 입력글자·위치 상호작용 (실계산, 하드코딩 확률 아님)
      var ix=['H','e','l','o'].indexOf(word[s.t]);
      function logits(curChar, pos){ var ci=vocab.indexOf(curChar); var L=[];
        for(var v=0; v<4; v++){ var val = 1.4*Math.cos((ci-v)*1.3) + 0.7*Math.sin(pos*1.1 + v*2.0) + 0.5*((ci+1)%4===v?1.6:0); L.push(val); } return L; }
      var lg=logits(word[s.t], s.t), pr=softmax(lg);
      var pred=0; for(var v=1;v<4;v++) if(pr[v]>pr[pred])pred=v;
      var truth='Hello'[s.t+1];                    // 실제 다음 글자(시퀀스가 제공하는 정답)
      // 단어 띠 — 본 글자 / 예측 위치
      var bx=W*0.14, by=H*0.20, cw=W*0.10;
      ctx.font='600 22px sans-serif'; ctx.textAlign='center';
      for(var i=0;i<5;i++){ var seen=(i<=s.t), tgt=(i===s.t+1);
        ctx.fillStyle= seen?CYA:(tgt?'rgba(255,210,122,0.18)':'rgba(255,255,255,0.05)');
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(bx+i*cw-22,by-26,44,44,9);ctx.fill();}else ctx.fillRect(bx+i*cw-22,by-26,44,44);
        ctx.fillStyle= seen?'#06222a':(tgt?GLD:DIM); ctx.fillText(word[i], bx+i*cw, by+4); }
      ctx.fillStyle=DIM; ctx.font='12px sans-serif';
      ctx.fillText('읽은 글자', bx+s.t*cw, by+38);
      ctx.fillStyle=GLD; ctx.fillText('? 예측', bx+(s.t+1)*cw, by+38);
      // softmax 확률 막대(실측)
      var gx=W*0.20, gy=H*0.46, gw=W*0.55, rowH=H*0.10;
      ctx.fillStyle='#dfeef0'; ctx.font='600 15px sans-serif'; ctx.textAlign='left';
      ctx.fillText('"'+word[s.t]+'" 다음 글자 예측 — Softmax 확률', gx, gy-18);
      for(v=0; v<4; v++){ var yy=gy+v*rowH, bw=pr[v]*gw, best=(v===pred), correct=(vocab[v]===truth);
        ctx.fillStyle= best?CYA:'rgba(61,214,220,0.30)'; ctx.fillRect(gx+40, yy, Math.max(2,bw), rowH*0.6);
        ctx.fillStyle= best?CYA:'#dfeef0'; ctx.font='600 16px sans-serif'; ctx.textAlign='right'; ctx.fillText(vocab[v], gx+30, yy+rowH*0.5);
        ctx.fillStyle= best?'#06222a':'#dfeef0'; ctx.font='600 12px sans-serif'; ctx.textAlign='left';
        ctx.fillText((pr[v]*100).toFixed(0)+'%', gx+46, yy+rowH*0.42);
        if(correct){ ctx.fillStyle=GRN; ctx.font='12px sans-serif'; ctx.fillText('← 실제 정답', gx+40+Math.max(2,bw)+10, yy+rowH*0.42); } }
      // 판정
      var ok=(vocab[pred]===truth);
      ctx.fillStyle= ok?GRN:RED; ctx.font='600 16px sans-serif'; ctx.textAlign='left';
      ctx.fillText('모델 예측: "'+vocab[pred]+'" ('+(pr[pred]*100).toFixed(0)+'%)  ·  정답: "'+truth+'"  '+(ok?'✓ 맞음':'✗ 틀림 → 손실 발생'), gx, gy+4*rowH+8);
      E.tapHint(W/2, H*0.95, '위치를 옮겨 보세요 — 매 글자마다 다음 글자를 예측합니다', true);
      E.big('다음 토큰 예측 — ‘Hello’ 자동완성', '언어 모델 RNN은 매 시점 “<b>다음에 올 글자(토큰)</b>는 무엇일까?”를 예측합니다. 은닉상태로 지금까지의 맥락을 요약하고, 마지막에 어휘 전체에 대한 점수(로짓)를 낸 뒤 <b>Softmax</b>로 확률로 바꾸죠. 정답은 따로 라벨링할 필요 없이 <b>시퀀스 자신</b>이 알려 줍니다(다음 글자가 곧 정답) — 이것이 자기지도학습입니다. 화면의 확률은 결정적 로짓을 실제 Softmax한 값입니다.'); }
  },

  // ══════════ 3. 펼친 RNN — 같은 가중치를 반복해 순전파 ══════════
  { id:'ai9_03',
    enter:function(E){ var self=this; this.s={Wh:0.85};
      E.controls('<div class="ctrl"><label>순환 가중치 Wh (기억 유지 강도)</label><input type="range" id="wh" min="-0.2" max="1.4" step="0.05" value="0.85"><output id="who">0.85</output></div>');
      E.bind('#wh','input',function(e){ self.s.Wh=+e.target.value; document.getElementById('who').textContent=(+e.target.value).toFixed(2); E.blip(320,0.05); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var Wx=0.9, b=0.0, Wh=s.Wh;
      var x=[0.8,0.5,-0.4,0.9,0.3];                // 5시점 입력(결정적)
      var n=x.length, hs=[0]; for(var i=0;i<n;i++) hs.push(tanh(Wx*x[i]+Wh*hs[i]+b));   // 펼쳐 순전파 실계산
      var x0=W*0.10, gap=(W*0.80)/n, cy=H*0.42, R=22;
      ctx.fillStyle='#dfeef0'; ctx.font='600 15px sans-serif'; ctx.textAlign='left';
      ctx.fillText('시퀀스를 펼침(unroll) — 셀 하나를 시점마다 복제, 가중치는 공유', x0, H*0.13);
      for(i=0;i<n;i++){ var cx=x0+gap*0.5+i*gap;
        var prevx=(i===0)?x0:(x0+gap*0.5+(i-1)*gap);
        // 순환 화살표 + Wh 라벨(공유 가중치 강조)
        ctx.strokeStyle=CYA; ctx.lineWidth=2.2; ctx.beginPath(); ctx.moveTo(prevx+R, cy); ctx.lineTo(cx-R, cy); ctx.stroke();
        ctx.fillStyle=GRN; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('Wh', (prevx+cx)/2, cy-8);
        // 입력
        ctx.strokeStyle=GLD; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(cx, cy+R+50); ctx.lineTo(cx, cy+R+4); ctx.stroke();
        ctx.fillStyle=GLD; ctx.font='10px sans-serif'; ctx.fillText('Wx', cx+12, cy+R+26);
        // 셀: 색 강도 = |h| (기억 세기 시각화, 실측값 기반)
        var mag=Math.min(1,Math.abs(hs[i+1]));
        ctx.fillStyle='rgba(61,214,220,'+(0.18+0.7*mag).toFixed(3)+')';
        ctx.beginPath(); ctx.arc(cx,cy,R,0,7); ctx.fill(); ctx.strokeStyle=CYA; ctx.lineWidth=1; ctx.stroke();
        ctx.fillStyle='#06222a'; ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.fillText('h'+(i+1), cx, cy+4);
        ctx.fillStyle= hs[i+1]>=0?GRN:RED; ctx.font='600 12px sans-serif'; ctx.fillText(hs[i+1].toFixed(3), cx, cy-R-8);
        ctx.fillStyle='#cfe6e8'; ctx.font='11px sans-serif'; ctx.fillText('x='+x[i].toFixed(1), cx, cy+R+66); }
      // h 추이 미니 그래프(실측 누적)
      var px=W*0.12, py=H*0.86, pw=W*0.76, amp=H*0.14;
      ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px+pw,py); ctx.stroke();
      ctx.strokeStyle=GLD; ctx.lineWidth=2; ctx.beginPath();
      for(i=0;i<n;i++){ var gxp=px+(i+0.5)/n*pw, gyp=py-hs[i+1]*amp; if(i===0)ctx.moveTo(gxp,gyp); else ctx.lineTo(gxp,gyp); ctx.fillStyle=GLD; ctx.fillRect(gxp-2,gyp-2,4,4); } ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('은닉상태 h의 시간 추이 (Wh가 크면 과거 기억이 오래 남음)', px, py-amp-6);
      E.tapHint(W/2, H*0.95, 'Wh를 키우면 기억이 누적되고, 줄이면 금방 잊습니다', true);
      E.big('펼친 RNN — 같은 가중치를 반복해 순전파', '순환 구조를 시간 방향으로 <b>펼치면(unroll)</b> 같은 셀이 시점 수만큼 늘어선 깊은 망이 됩니다. 단, 모든 시점이 <b>똑같은 Wx·Wh·b</b>를 공유하죠(가중치 묶기). 그래서 길이가 다른 문장도 같은 셀로 처리할 수 있습니다. Wh를 키우면 직전 기억이 강하게 전달돼 h가 누적되고, 0에 가까우면 금방 잊습니다 — 화면의 h는 매 시점 실제로 펼쳐 계산한 값입니다.'); }
  },

  // ══════════ 4. 기울기 소실 — 긴 시퀀스에서 초기 기억이 흐려진다 ══════════
  { id:'ai9_04',
    enter:function(E){ var self=this; this.s={L:12};
      E.controls('<div class="ctrl"><label>시퀀스 길이 L</label><input type="range" id="ll" min="2" max="30" step="1" value="12"><output id="llo">12</output></div>');
      E.bind('#ll','input',function(e){ self.s.L=+e.target.value; document.getElementById('llo').textContent=e.target.value; E.blip(280+self.s.L*8,0.05); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var Wh=0.8, L=s.L;
      // 결정적 은닉상태로 tanh' 계산 → 마지막 손실의 초기토큰 그래디언트 = ∏ (tanh'(z_k) · Wh)  (실계산)
      // h_t = tanh(0.6 + Wh·h_{t-1}); tanh'(z)=1-h^2
      var h=0, deriv=[];
      for(var k=0;k<L;k++){ var z=0.6+Wh*h; var hn=tanh(z); var d=(1-hn*hn)*Wh; deriv.push(d); h=hn; }
      // 초기 토큰(t=0)으로 거슬러 오는 그래디언트 = 마지막부터 곱
      var gback=[]; var p=1; for(k=L-1;k>=0;k--){ p*=deriv[k]; gback[k]=p; }   // gback[0] = 전체 곱
      // 막대: 각 시점이 최종 손실에 주는 영향(|누적곱|), 맨 끝 시점(≈|deriv|)을 1로 정규화
      var bx=W*0.10, by=H*0.30, bw=(W*0.80)/L, baseY=H*0.74, maxH=baseY-by;
      ctx.fillStyle='#dfeef0'; ctx.font='600 15px sans-serif'; ctx.textAlign='left';
      ctx.fillText('마지막 손실 → 각 시점 토큰으로 흐르는 그래디언트 크기 (∏ tanh′·Wh)', bx, by-14);
      for(k=0;k<L;k++){ var g=Math.abs(gback[k]);
        var gnorm=g/Math.max(1e-9, Math.abs(deriv[L-1]));
        var hh=Math.min(maxH, gnorm*maxH);
        var col = gnorm>0.5?GRN : (gnorm>0.08?GLD:RED);
        ctx.fillStyle=col; ctx.fillRect(bx+k*bw+1, baseY-hh, Math.max(1,bw-2), hh); }
      ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(bx,baseY); ctx.lineTo(bx+L*bw,baseY); ctx.stroke();
      ctx.fillStyle=RED; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('첫 토큰(t=0)', bx+bw*0.5, baseY+18);
      ctx.fillStyle=GRN; ctx.fillText('마지막 토큰(t='+(L-1)+')', bx+(L-0.5)*bw, baseY+18);
      // 수치 패널(실측 곱)
      var px=W*0.5, py=H*0.84;
      var full=Math.abs(gback[0]);
      ctx.fillStyle='#dfeef0'; ctx.font='600 15px sans-serif'; ctx.textAlign='center';
      ctx.fillText('초기 토큰까지 거슬러 온 그래디언트 = '+(full<1e-4? full.toExponential(2) : full.toFixed(6)), px, py);
      // 평균 |tanh'·Wh|
      var avg=0; for(k=0;k<L;k++) avg+=Math.abs(deriv[k]); avg/=L;
      ctx.fillStyle=DIM; ctx.font='13px sans-serif';
      ctx.fillText('한 칸당 평균 곱수 |tanh′·Wh| ≈ '+avg.toFixed(3)+'  →  '+L+'칸 곱하면 ≈ '+avg.toFixed(3)+'^'+L, px, py+22);
      ctx.fillStyle= full<0.01?RED:GLD; ctx.font='600 13px sans-serif';
      ctx.fillText(full<0.01? '기울기 소실 — 초기 토큰이 학습에 거의 기여 못 함' : '아직 신호가 살아 있음 — 길이를 더 늘려 보세요', px, py+44);
      E.tapHint(W/2, H*0.95, 'L을 늘리면 첫 토큰 막대가 지수적으로 사라집니다', true);
      E.big('기울기 소실 — 긴 시퀀스에서 초기 기억이 흐려진다', '학습은 마지막 손실의 기울기를 시간 거꾸로 흘려보내며(BPTT) 가중치를 고칩니다. 그런데 한 칸 거슬러 갈 때마다 <b>tanh′·Wh</b>가 곱해지는데, 이 값이 대개 1보다 작아 <b>곱이 길이만큼 지수적으로 작아집니다</b>. 결국 먼 과거의 토큰일수록 그래디언트가 0에 수렴 — RNN이 <b>장기 의존</b>을 못 배우는 이유죠. 화면의 막대·수치는 실제 곱 ∏ tanh′·Wh 입니다.'); }
  },

  // ══════════ 5. LSTM 게이트 — 셀상태로 장기기억을 지킨다 ══════════
  { id:'ai9_05',
    enter:function(E){ var self=this; this.s={t:1};
      E.controls('<div class="ctrl"><label>시점 t</label><input type="range" id="lt" min="0" max="4" step="1" value="1"><output id="lto">1</output></div>');
      E.bind('#lt','input',function(e){ self.s.t=+e.target.value; document.getElementById('lto').textContent=e.target.value; E.blip(360,0.06); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 결정적 입력 시퀀스 → 게이트(sigmoid) 실계산. f=망각, i=입력, o=출력.
      var x=[0.9,-0.6,0.4,1.0,-0.3];
      var n=x.length;
      // 단순화 LSTM: f=sig(1.0·x+0.5), i=sig(1.2·x-0.2), o=sig(0.8·x+0.3), g=tanh(1.1·x), c_t=f·c_{t-1}+i·g, h=o·tanh(c)
      var c=0, h=0, hist=[];
      for(var k=0;k<n;k++){ var f=sig(1.0*x[k]+0.5), inp=sig(1.2*x[k]-0.2), o=sig(0.8*x[k]+0.3), g=tanh(1.1*x[k]);
        var cnew=f*c+inp*g; var hnew=o*tanh(cnew);
        hist.push({f:f,i:inp,o:o,g:g,cprev:c,c:cnew,h:hnew}); c=cnew; h=hnew; }
      var st=hist[s.t];
      // 셀상태 컨베이어(상단 가로선) + 셀별 c값
      var x0=W*0.12, gap=(W*0.76)/n, topY=H*0.20, R=18;
      ctx.strokeStyle='rgba(126,224,176,0.5)'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(x0, topY); ctx.lineTo(x0+W*0.76, topY); ctx.stroke();
      ctx.fillStyle=GRN; ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.fillText('셀상태 c (장기기억 컨베이어)', x0, topY-12);
      for(k=0;k<n;k++){ var cx=x0+gap*0.5+k*gap, cur=(k===s.t);
        ctx.fillStyle= cur?GRN:'rgba(126,224,176,0.4)'; ctx.beginPath(); ctx.arc(cx, topY, cur?7:4, 0,7); ctx.fill();
        ctx.fillStyle= cur?GRN:DIM; ctx.font=(cur?'600 ':'')+'11px sans-serif'; ctx.textAlign='center'; ctx.fillText('c='+hist[k].c.toFixed(2), cx, topY-16);
        // h 출력
        ctx.fillStyle= cur?CYA:'rgba(61,214,220,0.5)'; ctx.font='11px sans-serif'; ctx.fillText('h='+hist[k].h.toFixed(2), cx, H*0.40);
        ctx.fillStyle= cur?GLD:DIM; ctx.fillText('x='+x[k].toFixed(1), cx, H*0.45); }
      // 현재 시점 게이트 패널(실측 sigmoid)
      var gx=W*0.16, gy=H*0.54, gw=W*0.40, rowH=H*0.085;
      ctx.fillStyle='#dfeef0'; ctx.font='600 15px sans-serif'; ctx.textAlign='left';
      ctx.fillText('시점 t='+s.t+' 의 게이트 값 (0=닫힘, 1=열림)', gx, gy-14);
      var rows=[['망각 게이트 f','직전 기억 c를 얼마나 유지?',st.f,PNK],
                ['입력 게이트 i','새 정보 g를 얼마나 받을까?',st.i,BLU],
                ['출력 게이트 o','기억 중 얼마를 밖으로 낼까?',st.o,GLD]];
      for(var r=0;r<3;r++){ var yy=gy+r*rowH;
        ctx.fillStyle=rows[r][3]; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText(rows[r][0], gx, yy);
        ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.fillText(rows[r][1], gx, yy+16);
        var val=rows[r][2], bw=val*gw;
        ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.fillRect(gx+W*0.20, yy-10, gw, 16);
        ctx.fillStyle=rows[r][3]; ctx.fillRect(gx+W*0.20, yy-10, Math.max(2,bw), 16);
        ctx.fillStyle='#06222a'; ctx.font='600 12px sans-serif'; ctx.textAlign='left'; ctx.fillText(val.toFixed(2), gx+W*0.20+6, yy+2); }
      // 셀 갱신식(실측 대입)
      var ey=gy+3*rowH+14;
      ctx.fillStyle=GRN; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
      ctx.fillText('c_t = f·c_{t-1} + i·g  =  '+st.f.toFixed(2)+'×'+st.cprev.toFixed(2)+' + '+st.i.toFixed(2)+'×'+st.g.toFixed(2)+'  =  '+st.c.toFixed(3), gx, ey);
      ctx.fillStyle=CYA; ctx.font='13px sans-serif';
      ctx.fillText('h_t = o·tanh(c_t) = '+st.o.toFixed(2)+'×tanh('+st.c.toFixed(2)+') = '+st.h.toFixed(3), gx, ey+24);
      // 우측 요약
      var qx=W*0.62, qy=H*0.56;
      ctx.fillStyle='#cfe6e8'; ctx.font='13px sans-serif'; ctx.textAlign='left';
      ctx.fillText('망각 게이트가 1에 가까우면', qx, qy);
      ctx.fillText('덧셈으로 c가 거의 그대로 흘러', qx, qy+20);
      ctx.fillText('→ 기울기 소실 없이 먼 과거까지', qx, qy+40);
      ctx.fillStyle=GRN; ctx.font='600 13px sans-serif'; ctx.fillText('장기 의존을 학습!', qx, qy+60);
      E.tapHint(W/2, H*0.95, '시점 t를 옮겨 게이트가 정보를 여닫는 걸 보세요', true);
      E.big('LSTM 게이트 — 셀상태로 장기기억을 지킨다', 'LSTM은 RNN에 <b>게이트</b> 세 개를 답니다. <b>망각 게이트 f</b>는 직전 기억을 얼마나 지울지, <b>입력 게이트 i</b>는 새 정보를 얼마나 받을지, <b>출력 게이트 o</b>는 기억 중 무엇을 내보낼지 정합니다(모두 0~1 sigmoid). 핵심은 <b>셀상태 c가 곱이 아니라 덧셈(c = f·c + i·g)으로 갱신</b>된다는 점 — 망각 게이트가 열려 있으면 기억이 거의 손실 없이 흘러 <b>기울기 소실을 막고 장기 의존을 배웁니다</b>. 화면의 게이트·셀상태는 전부 실제 sigmoid·tanh 계산입니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
