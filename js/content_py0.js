/* 파이썬 트랙 — 시작 시퀀스 (시네마틱: 귀도 반 로섬 + 이름 유래 + 실제 코드 실행 · 환영 · 16장 윤곽)
   동작(behavior)만. 텍스트=content/py0.json. 반드시 content_py1.js 보다 먼저 로드. 엔진 js/engine.js 공유.
   색: Python=골드/노랑 테마(#ffd343). 골든룰: 화면의 출력값(제곱·리스트)은 실제 계산. */
(function(){
  var PYL='#ffd343', PYB='#6cb6e8', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', PNK='#f4a0c0', DIM='#9b99a3';
  // 파이썬의 창시자 귀도 반 로섬 — "모두를 위한 프로그래밍"을 꿈꾼 사람(인트로 배경)
  var GUIDO=new Image(); var GUIDO_OK=false; GUIDO.onload=function(){ GUIDO_OK=true; }; GUIDO.src='assets/guido.svg';
  // 인트로 시네마틱에서 '실행'되는 실제 코드와 결과
  var SQ=[]; for(var i=0;i<8;i++) SQ.push(i*i);   // [x*x for x in range(8)] = [0,1,4,9,16,25,36,49] (실제 계산)

  var scenes = [

  // ── 시네마틱: 파이썬 코드가 '실행'되며 결과가 피어남 → 엔드카드(귀도 반 로섬) ──
  { id:'py0_00', cinematic:true, introCard:true,
    story:{ portrait:'assets/guido.svg', name:'귀도 반 로섬',
      sub:'Guido van Rossum · 1956–<br>파이썬의 창시자 (1991) · BDFL(자비로운 종신독재자)',
      caps:[
        ['파이썬의 세계에 오신 것을 환영합니다'],
        ['1989년 크리스마스 휴가, 네덜란드의 한 프로그래머가','심심풀이 삼아 새 언어를 만들기 시작했습니다.'],
        ['귀도 반 로섬 — 읽기 쉽고 누구나 배울 수 있는','“모두를 위한 프로그래밍”을 꿈꿨죠.'],
        ['이름은 뱀이 아니라, 그가 좋아한 영국 코미디','“몬티 파이썬의 비행 서커스”에서 따왔습니다.'],
        ['들여쓰기로 구조를 잡는 단순함, 군더더기 없는 문법 —','코드가 마치 영어 문장처럼 읽힙니다.'],
        ['그 단순함 덕에 파이썬은 데이터·AI 시대의','사실상 공용어가 되었습니다.'],
        ['NumPy로 행렬을, PyTorch로 신경망을 —','몇 줄로 지능을 빚어냅니다.'],
        ['기초 문법부터 실제로 도는 AI 코드까지 —','함께 파이썬으로 지능을 만들어 볼까요?']
      ] },
    enter:function(E){ this.s={ ended:false, acc:0, last:0 }; E.setOn([]); },
    tap:function(E){ if(!this.s.ended){ this.s.ended=true; E.introEnd(this.story); } },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, fr=E.frame, s=this.s;
      function ss(a,b,x){ x=(x-a)/(b-a); x=x<0?0:x>1?1:x; return x*x*(3-2*x); }
      var ANIM=1215, FADE=18, HOLD=170;
      var _n=(typeof performance!=="undefined"&&performance.now)?performance.now():0, _dt=s.last?(_n-s.last):16.7; if(_dt<0||_dt>200)_dt=16.7; s.last=_n; s.acc+=_dt*0.036; var local=s.acc;
      if(local>=ANIM+HOLD){ if(!s.ended){ s.ended=true; E.introEnd(this.story); } return; }
      var ph=Math.min(local,ANIM)/ANIM, seam=(local<FADE? local/FADE : 1);
      // 귀도 초상(은은한 배경)
      if(GUIDO_OK){ var ar=GUIDO.width/GUIDO.height||0.83, dh=H*0.80, dw=dh*ar, ix=W*0.5-dw/2, iy=H*0.50-dh/2;
        ctx.save(); ctx.globalAlpha=(0.30+0.03*Math.sin(fr*0.012))*seam; if('filter' in ctx) ctx.filter='blur(2px)';
        ctx.drawImage(GUIDO, ix, iy, dw, dh); ctx.restore(); }
      // 별/먼지 배경(노랑)
      for(var i=0;i<48;i++){ var hx=((Math.sin(i*12.9898)*43758.5453)%1+1)%1, hy=((Math.sin(i*78.233)*43758.5453)%1+1)%1, tw=0.25+0.55*Math.abs(Math.sin(fr*0.016+i));
        ctx.fillStyle='rgba(255,211,67,'+(tw*0.32*seam).toFixed(3)+')'; ctx.fillRect(hx*W, hy*H*0.9, 1.6,1.6); }
      // 코드 패널(왼쪽) — 한 줄씩 '타이핑'
      var code=['# 파이썬 — 읽히는 코드','squares = [x*x for x in range(8)]','print(squares)'];
      var cx=W*0.10, cy=H*0.30, lh=Math.max(22,H*0.052), reveal=ss(0,1,(ph-0.06)/0.30);
      ctx.save(); ctx.globalAlpha=seam; ctx.font='600 '+Math.max(15,Math.min(22,W*0.018))+'px ui-monospace, Menlo, monospace'; ctx.textAlign='left';
      for(var L=0;L<code.length;L++){ var lp=ss(0,1,reveal*code.length-L); if(lp<=0)continue;
        var full=code[L], nshow=Math.floor(full.length*lp), str=full.slice(0,nshow);
        ctx.fillStyle=(L===0)?DIM:(L===2?PYB:PYL); ctx.fillText(str, cx, cy+L*lh);
        if(lp<1 && Math.floor(fr/16)%2===0){ var tw2=ctx.measureText(str).width; ctx.fillStyle=PYL; ctx.fillRect(cx+tw2+2, cy+L*lh-14, 9, 17); } }
      ctx.restore();
      // 결과(오른쪽) — [x*x] 막대가 실제 값으로 피어남
      var bx=W*0.56, by=H*0.66, bw=W*0.34, mx=49;
      var outP=ss(0,1,(ph-0.40)/0.42);
      ctx.globalAlpha=seam; ctx.strokeStyle='rgba(255,211,67,0.25)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(bx,by); ctx.lineTo(bx+bw,by); ctx.stroke();
      for(i=0;i<SQ.length;i++){ var grow=ss(0,1,outP*SQ.length-i); if(grow<=0)continue;
        var h=SQ[i]/mx*H*0.30*grow, w=bw/SQ.length*0.66, gx=bx+i*bw/SQ.length+bw/SQ.length*0.17;
        ctx.fillStyle=PYL; ctx.globalAlpha=seam*(0.55+0.45*grow); ctx.fillRect(gx, by-h, w, h);
        if(grow>0.6){ ctx.globalAlpha=seam; ctx.fillStyle=GLD; ctx.font='12px ui-monospace, monospace'; ctx.textAlign='center'; ctx.fillText(SQ[i], gx+w/2, by-h-6); } }
      ctx.globalAlpha=seam; ctx.fillStyle=DIM; ctx.font='13px ui-monospace, monospace'; ctx.textAlign='left';
      if(outP>0.85){ ctx.fillStyle=GRN; ctx.fillText('>>> [0, 1, 4, 9, 16, 25, 36, 49]', bx, by+24); }
      ctx.globalAlpha=1;
      // 상단 대화체 문구
      var caps=this.story.caps;
      var slot=1/caps.length, ci=Math.floor(ph/slot), lp2=(ph-ci*slot)/slot;
      var aa=(lp2<0.2? lp2/0.2 : lp2>0.8? (1-lp2)/0.2 : 1)*seam;
      var lines=caps[ci]||caps[0], mainF=Math.max(20,Math.min(33,W*0.039)), subF=Math.max(14,Math.min(21,W*0.024));
      ctx.textAlign='center'; ctx.textBaseline='alphabetic'; ctx.shadowColor='rgba(0,0,0,0.65)'; ctx.shadowBlur=14;
      for(var li=0;li<lines.length;li++){ var big2=(li===0);
        ctx.font=(big2?'600 '+mainF:'400 '+subF)+'px -apple-system, sans-serif';
        ctx.fillStyle=big2?'rgba(255,224,140,'+aa.toFixed(3)+')':'rgba(240,238,225,'+(aa*0.92).toFixed(3)+')';
        ctx.fillText(lines[li], W/2, H*0.13 + li*(mainF+9)); }
      ctx.shadowBlur=0; }
  },

  // ── 환영: 왜 파이썬인가 (읽기 쉬움 · 라이브러리 · AI 표준) ──
  { id:'py0_01',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360,0.07); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      ctx.textAlign='center';
      if(s.step===0){
        ctx.fillStyle='#f0eee1'; ctx.font='600 17px sans-serif'; ctx.fillText('같은 일을 하는 코드 — C vs 파이썬', W*0.5, H*0.13);
        var lx=W*0.12, ly=H*0.28, lh=26;
        ctx.font='14px ui-monospace, monospace'; ctx.textAlign='left';
        var cc=['#include <stdio.h>','int main(){','  for(int i=0;i<3;i++)','    printf("%d\\n", i*i);','  return 0;','}'];
        ctx.fillStyle=DIM; ctx.fillText('C', lx, ly-10);
        for(var i=0;i<cc.length;i++){ ctx.fillStyle='#b9b7ac'; ctx.fillText(cc[i], lx, ly+i*lh); }
        var rx=W*0.58;
        ctx.fillStyle=PYL; ctx.fillText('Python', rx, ly-10);
        var pc=['for i in range(3):','    print(i*i)'];
        for(i=0;i<pc.length;i++){ ctx.fillStyle=PYL; ctx.font='16px ui-monospace, monospace'; ctx.fillText(pc[i], rx, ly+i*lh+4); }
        ctx.fillStyle=GRN; ctx.font='14px ui-monospace, monospace'; ctx.fillText('→ 0  1  4', rx, ly+2.4*lh+10);
        ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('들여쓰기로 블록을 잡아, 같은 일을 절반 분량·영어처럼 읽히게.', W*0.5, ly+5*lh);
      } else if(s.step===1){
        ctx.fillStyle='#f0eee1'; ctx.font='600 17px sans-serif'; ctx.fillText('배터리 포함(Batteries Included) — 방대한 라이브러리', W*0.5, H*0.13);
        var libs=[['NumPy','행렬·수치',PYB],['pandas','표 데이터',GRN],['scikit-learn','머신러닝',GLD],['PyTorch','딥러닝',PNK],['Matplotlib','시각화',PYL],['🤗 Transformers','LLM',BLU]];
        for(i=0;i<libs.length;i++){ var col=i%3, row=Math.floor(i/3), bx=W*(0.25+col*0.25), by=H*(0.32+row*0.18);
          ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.strokeStyle=libs[i][2]; ctx.lineWidth=1.5;
          if(ctx.roundRect){ctx.beginPath();ctx.roundRect(bx-70,by-30,140,56,12);ctx.fill();ctx.stroke();}
          ctx.fillStyle=libs[i][2]; ctx.font='600 15px sans-serif'; ctx.textAlign='center'; ctx.fillText(libs[i][0], bx, by-4);
          ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText(libs[i][1], bx, by+16); }
        ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.fillText('필요한 거의 모든 도구가 import 한 줄이면 손에 들어옵니다.', W*0.5, H*0.74);
      } else {
        ctx.fillStyle='#f0eee1'; ctx.font='600 17px sans-serif'; ctx.fillText('그래서 AI의 공용어가 되었습니다', W*0.5, H*0.13);
        ctx.font='15px sans-serif'; ctx.fillStyle='#d8d5c6';
        var pts=['· 읽기 쉬워 아이디어를 빠르게 코드로 — 연구·실험에 최적','· NumPy·PyTorch가 무거운 계산을 C/GPU로 대신 — 느리지 않음','· 세계의 거의 모든 AI 모델·논문 코드가 파이썬'];
        for(i=0;i<pts.length;i++) ctx.fillText(pts[i], W*0.5, H*0.30+i*32);
        ctx.fillStyle=PYL; ctx.font='600 16px sans-serif'; ctx.fillText('“단순한 것이 복잡한 것보다 낫다” — Zen of Python', W*0.5, H*0.52);
      }
      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 (가독성 → 라이브러리 → AI 표준)', true);
      E.big('왜 파이썬인가', '파이썬은 <b>읽기 쉬운 문법</b>으로 생각을 빠르게 코드로 옮기게 해 주고, <b>NumPy·PyTorch</b> 같은 라이브러리가 무거운 계산을 대신해 줍니다. 그래서 데이터·AI 분야의 <b>사실상 표준 언어</b>가 되었죠. 화면을 탭해 이유를 하나씩 보세요.'); }
  },

  // ── 트랙 지도: 16장 윤곽 ──
  { id:'py0_02',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      var blocks=[
        ['기초 문법 (1~5장)','변수·자료구조·제어·함수·클래스·최신문법(f-string·타입힌트·match)',PYL],
        ['AI 라이브러리 (6~9장)','NumPy 배열·행렬연산 · pandas 표 · Matplotlib 시각화',PYB],
        ['머신러닝 코드 (10~12장)','scikit-learn 회귀·분류·전처리 — 실제 데이터로 동작',GRN],
        ['딥러닝·PyTorch (13~16장)','텐서·autograd · 신경망(MNIST) · CNN · 전이학습 — 실행가능',PNK]
      ];
      ctx.textAlign='left';
      for(var i=0;i<blocks.length;i++){ var by=H*0.20+i*H*0.165;
        ctx.fillStyle=blocks[i][2]; ctx.beginPath(); ctx.arc(W*0.16, by, 9,0,7); ctx.fill();
        if(i<blocks.length-1){ ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(W*0.16,by+12); ctx.lineTo(W*0.16,by+H*0.165-12); ctx.stroke(); }
        ctx.fillStyle=blocks[i][2]; ctx.font='600 19px sans-serif'; ctx.fillText(blocks[i][0], W*0.20, by-2);
        ctx.fillStyle='#cfcabf'; ctx.font='14px sans-serif'; ctx.fillText(blocks[i][1], W*0.20, by+22); }
      E.tapHint(W/2, H*0.95, '아래 ▶ 다음으로 1장(첫걸음)으로', true);
      E.big('파이썬 for AI — 16장의 여정', '기초 문법부터 시작해, NumPy·pandas로 데이터를 다루고, scikit-learn으로 머신러닝을, PyTorch로 딥러닝을 — <b>전부 복사하면 바로 도는 실제 코드</b>로 익힙니다. 표준 공개 데이터셋(iris·MNIST 등)을 쓰니 직접 실행해 볼 수도 있어요.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
