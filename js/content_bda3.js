/* 빅데이터 분석 제3장 — 파이썬다운 데이터 프로그래밍: 벡터화 · 브로드캐스팅 · 불리언 마스크 · 뷰/복사 · 함수와 모듈
   동작(behavior)만. 텍스트=content/bda3.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 화면에 표시되는 모든 수(합계·반복 횟수·shape 판정·통과 개수·평균·배열 값·줄 수·표준화 값)는
   draw에서 고정 데이터로 실제 계산(하드코딩·Math.random·Date.now 금지).
   왼쪽=진짜 실행 가능한 Python 코드 패널(줄커서), 오른쪽=실계산 시각화. */
(function(){
  var MAG='#ff7ab8', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', DIM='#9b99a3', RED='#f0888a', TXT='#f2e8ee';

  function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  // 등폭 코드 패널: lines=[{t,hl?,dim?}|문자열]. hl 토큰만 마젠타 강조. 반환=패널 하단 y(codeBot).
  function codePanel(E, x, y, w, lines, title, actLine){
    var ctx=E.ctx, lh=21, pad=14, top=y, n=lines.length, ht=n*lh+pad*2+(title?26:0);
    ctx.fillStyle='rgba(255,255,255,0.035)'; ctx.strokeStyle='rgba(255,122,184,0.30)'; ctx.lineWidth=1;
    roundRect(ctx,x,top,w,ht,10); ctx.fill(); ctx.stroke();
    var cy=top+pad+(title?26:0);
    if(title){ ctx.fillStyle=MAG; ctx.font='600 12px ui-monospace,Menlo,monospace'; ctx.textAlign='left'; ctx.fillText(title, x+pad, top+pad+12); }
    ctx.font='13px ui-monospace,Menlo,Consolas,monospace'; ctx.textAlign='left';
    for(var i=0;i<n;i++){
      var L=lines[i], t=(typeof L==='string')?L:L.t, hl=(typeof L==='object')?L.hl:null;
      var ty=cy+i*lh+11;
      if(actLine!=null && i===actLine){ ctx.fillStyle='rgba(255,122,184,0.16)'; ctx.fillRect(x+4, cy+i*lh+1, w-8, lh-2); ctx.fillStyle=MAG; ctx.fillRect(x+4, cy+i*lh+1, 3, lh-2); }
      if(hl && t.indexOf(hl)>=0){
        var a=t.split(hl), pre=a[0], post=a.slice(1).join(hl);
        ctx.fillStyle=DIM; ctx.fillText(pre, x+pad, ty);
        var wpre=ctx.measureText(pre).width;
        ctx.fillStyle=MAG; ctx.fillText(hl, x+pad+wpre, ty);
        var whl=ctx.measureText(hl).width;
        ctx.fillStyle=DIM; ctx.fillText(post, x+pad+wpre+whl, ty);
      } else {
        ctx.fillStyle=(L.dim?DIM:TXT); ctx.fillText(t, x+pad, ty);
      }
    }
    return top+ht;
  }

  function comma(n){ return (''+n).replace(/\B(?=(\d{3})+(?!\d))/g,','); }

  // ── 고정 예제 데이터 (골든룰: 이 배열들로 draw가 실제 계산) ──
  var DATA8=[3,1,4,1,5,9,2,6];
  var SCORES=[72,95,61,88,45,79,90,55,83,67];
  var PIPE_RAW=[4,8,null,6,2];

  var scenes = [

  // ══════════ 1. 벡터화 — 루프를 버리다 ══════════
  { id:'bda3_01',
    enter:function(E){ var self=this; this.s={k:4};
      E.controls('<div class="ctrl"><label>원소 수 n = 10^k</label><input type="range" id="nk" min="1" max="7" step="1" value="4"><output id="nko">10,000</output></div>');
      E.bind('#nk','input',function(e){ self.s.k=+e.target.value; document.getElementById('nko').textContent=comma(Math.pow(10,self.s.k)); E.blip(320+self.s.k*40,0.06); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var n=Math.pow(10,s.k);
      var code=[
        {t:'data = np.array(...)  # n = '+comma(n)+'개', hl:'np.array'},
        {t:'', dim:true},
        {t:'# 방법 1 — 파이썬 for 루프', dim:true},
        {t:'total = 0'},
        {t:'for x in data:        # n번 반복', hl:'for'},
        {t:'    total += x * 2    # 매번 해석·형검사'},
        {t:'', dim:true},
        {t:'# 방법 2 — 벡터화 한 줄', dim:true},
        {t:'total = (data * 2).sum()', hl:'(data * 2).sum()'}
      ];
      codePanel(E, W*0.04, H*0.09, W*0.45, code, 'vectorize.py', 8);

      var gx=W*0.53, gw=W*0.43;
      // (1) 작은 배열로 두 방법의 답이 같음을 실제 계산
      ctx.fillStyle=MAG; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
      ctx.fillText('같은 계산, 두 가지 길 — 답은 같습니다', gx, H*0.09);
      var sumLoop=0, i; for(i=0;i<DATA8.length;i++) sumLoop+=DATA8[i]*2;         // 진짜 루프
      var doubled=DATA8.map(function(v){return v*2;});
      var sumVec=doubled.reduce(function(a,b){return a+b;},0);                    // 진짜 일괄 계산
      var cw=Math.min(30,(gw-20)/DATA8.length), cy0=H*0.12;
      for(i=0;i<DATA8.length;i++){
        ctx.fillStyle='rgba(122,184,255,0.12)'; ctx.strokeStyle=BLU; ctx.lineWidth=1;
        ctx.fillRect(gx+i*(cw+4),cy0,cw,16); ctx.strokeRect(gx+i*(cw+4),cy0,cw,16);
        ctx.fillStyle=TXT; ctx.font='11px ui-monospace,monospace'; ctx.textAlign='center';
        ctx.fillText(DATA8[i], gx+i*(cw+4)+cw/2, cy0+12);
        ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.fillText('×2', gx+i*(cw+4)+cw/2, cy0+27);
        ctx.fillStyle='rgba(126,224,176,0.12)'; ctx.strokeStyle=GRN;
        ctx.fillRect(gx+i*(cw+4),cy0+30,cw,16); ctx.strokeRect(gx+i*(cw+4),cy0+30,cw,16);
        ctx.fillStyle=GRN; ctx.font='11px ui-monospace,monospace'; ctx.fillText(doubled[i], gx+i*(cw+4)+cw/2, cy0+42);
      }
      ctx.fillStyle=TXT; ctx.font='11.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText('합계 — 루프: '+sumLoop+' · 벡터화: '+sumVec+' (동일)', gx, cy0+60);

      // (2) 파이썬 레벨 반복 횟수 비교 (로그 눈금, 슬라이더 n으로 실계산) — 위 줄과 겹치지 않게 여백 확보
      var by=cy0+82, bw=gw-90, maxK=7;
      ctx.fillStyle=GLD; ctx.font='600 12px sans-serif';
      ctx.fillText('파이썬 인터프리터가 직접 도는 횟수 (로그 눈금)', gx, by);
      var wLoop=Math.max(6, bw*(s.k/maxK));
      ctx.fillStyle='rgba(240,136,138,0.30)'; ctx.strokeStyle=RED; ctx.lineWidth=1.2;
      ctx.fillRect(gx,by+6,wLoop,14); ctx.strokeRect(gx,by+6,wLoop,14);
      ctx.fillStyle=RED; ctx.font='11px ui-monospace,monospace'; ctx.textAlign='left';
      ctx.fillText('루프 '+comma(n)+'회', gx+wLoop+6, by+17);
      ctx.fillStyle='rgba(126,224,176,0.35)'; ctx.strokeStyle=GRN;
      ctx.fillRect(gx,by+24,6,14); ctx.strokeRect(gx,by+24,6,14);
      ctx.fillStyle=GRN; ctx.fillText('벡터화 1회 호출', gx+14, by+35);
      ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.strokeStyle='rgba(255,255,255,0.18)';
      ctx.fillRect(gx,by+42,wLoop,10); ctx.strokeRect(gx,by+42,wLoop,10);
      // 내부 C 루프 캡션은 막대 폭(wLoop)에 얹지 않고 아래 별도 줄에 왼쪽 정렬(가로 넘침 방지)
      ctx.fillStyle=DIM; ctx.font='11px sans-serif';
      ctx.fillText('내부 C 루프 '+comma(n)+'회 — 기계어 속도로 한 번에', gx, by+64);
      ctx.fillStyle=TXT; ctx.font='11.5px sans-serif';
      ctx.fillText('파이썬 레벨 반복 차이: '+comma(n)+'배 (n 대 1)', gx, by+82);

      // (3) 왜 빠른가 — 연속 메모리 그림
      var my=by+96;
      ctx.fillStyle=GLD; ctx.font='600 12px sans-serif'; ctx.fillText('왜 빠른가 — 메모리가 다릅니다', gx, my);
      var offs=[[1,-9],[7,-12],[-2,-8],[5,-6],[8,-11],[3,-13]];   // 고정 오프셋(난수 금지)
      var pc=Math.min(28,(gw-20)/8);
      for(i=0;i<6;i++){ var bx=gx+i*(pc+10);
        ctx.fillStyle='rgba(240,136,138,0.10)'; ctx.strokeStyle='rgba(240,136,138,0.5)'; ctx.lineWidth=1;
        ctx.fillRect(bx,my+22,pc,14); ctx.strokeRect(bx,my+22,pc,14);
        ctx.fillStyle=DIM; ctx.font='11px monospace'; ctx.textAlign='center'; ctx.fillText('ptr', bx+pc/2, my+32);
        var ox=bx+pc/2+offs[i][0], oy=my+22+offs[i][1];
        ctx.strokeStyle='rgba(240,136,138,0.45)'; ctx.beginPath(); ctx.moveTo(bx+pc/2,my+22); ctx.lineTo(ox,oy+4); ctx.stroke();
        ctx.fillStyle='rgba(240,136,138,0.5)'; ctx.beginPath(); ctx.arc(ox,oy,3,0,6.284); ctx.fill();
      }
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left';
      ctx.fillText('list — 포인터가 흩어진 객체를 가리킴', gx, my+44);
      for(i=0;i<6;i++){ var bx2=gx+i*pc;
        ctx.fillStyle='rgba(126,224,176,0.14)'; ctx.strokeStyle=GRN; ctx.lineWidth=1;
        ctx.fillRect(bx2,my+50,pc,14); ctx.strokeRect(bx2,my+50,pc,14);
        ctx.fillStyle=GRN; ctx.font='11px monospace'; ctx.textAlign='center'; ctx.fillText(DATA8[i], bx2+pc/2, my+60);
      }
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left';
      ctx.fillText('ndarray — 값이 한 줄로 붙어 있어 C 루프·CPU 캐시에 최적', gx, my+76);

      E.tapHint(W/2, H*0.95, '슬라이더로 n을 키우며 반복 횟수 차이를 보세요', true);
      E.big('루프를 버리다 — 벡터화', '같은 "전부 2배" 계산도 for 루프는 파이썬이 n번을 직접 돌며 매번 타입을 확인하지만, data * 2는 단 한 번의 호출로 C가 연속 메모리를 기계어 속도로 훑습니다. 알고리즘 트랙에서 배운 복잡도 O(n)은 같아도, 한 걸음의 비용이 수백 배 다르죠 — 데이터 분석 코드의 제1원칙은 "루프 대신 배열 연산"입니다.'); }
  },

  // ══════════ 2. 브로드캐스팅 — 모양이 다른 것끼리 계산 ══════════
  { id:'bda3_02',
    enter:function(E){ var self=this; this.s={ai:0,bi:0};
      var AL=['(3,1)','(3,4)','(2,3)','(3,)'], BL=['(4,)','(3,1)','(1,4)','(3,)'];
      E.controls('<div class="ctrl"><label>a의 shape</label><input type="range" id="am" min="0" max="3" step="1" value="0"><output id="amo">(3,1)</output></div>'
                +'<div class="ctrl"><label>b의 shape</label><input type="range" id="bm" min="0" max="3" step="1" value="0"><output id="bmo">(4,)</output></div>');
      E.bind('#am','input',function(e){ self.s.ai=+e.target.value; document.getElementById('amo').textContent=AL[self.s.ai]; E.blip(340+self.s.ai*50,0.06); });
      E.bind('#bm','input',function(e){ self.s.bi=+e.target.value; document.getElementById('bmo').textContent=BL[self.s.bi]; E.blip(420+self.s.bi*50,0.06); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 후보 배열: v는 2D로 정규화(1-D는 (1,n)으로), label은 원래 shape
      var AOPT=[
        {label:'(3,1)', v:[[0],[10],[20]]},
        {label:'(3,4)', v:[[0,1,2,3],[10,11,12,13],[20,21,22,23]]},
        {label:'(2,3)', v:[[0,1,2],[10,11,12]]},
        {label:'(3,)',  v:[[0,10,20]]}
      ];
      var BOPT=[
        {label:'(4,)',  v:[[1,2,3,4]]},
        {label:'(3,1)', v:[[1],[2],[3]]},
        {label:'(1,4)', v:[[1,2,3,4]]},
        {label:'(3,)',  v:[[1,2,3]]}
      ];
      var A=AOPT[s.ai], B=BOPT[s.bi];
      var ra=A.v.length, ca=A.v[0].length, rb=B.v.length, cb=B.v[0].length;
      // 브로드캐스팅 실제 판정: 각 축이 같거나 한쪽이 1
      var okR=(ra===rb||ra===1||rb===1), okC=(ca===cb||ca===1||cb===1);
      var rr=Math.max(ra,rb), rc=Math.max(ca,cb);
      var C=null;
      if(okR&&okC){ C=[]; for(var i=0;i<rr;i++){ var row=[];
        for(var j=0;j<rc;j++) row.push(A.v[ra===1?0:i][ca===1?0:j] + B.v[rb===1?0:i][cb===1?0:j]);   // 실제 합
        C.push(row); } }

      var code=[
        {t:'a = np.array(...)   # shape '+A.label, hl:'a'},
        {t:'b = np.array(...)   # shape '+B.label, hl:'b'},
        {t:'c = a + b           # 브로드캐스팅', hl:'a + b'},
        {t:'', dim:true},
        {t:'# 규칙: 끝 차원부터 짝을 맞춰', dim:true},
        {t:'#  1) 같으면 통과', dim:true},
        {t:'#  2) 한쪽이 1이면 늘려서(복제) 맞춤', dim:true},
        {t:'#  3) 둘 다 아니면 ValueError', dim:true}
      ];
      codePanel(E, W*0.04, H*0.10, W*0.45, code, 'broadcast.py', 2);

      // 우측: a + b = c 격자
      var gx=W*0.53, gw=W*0.43;
      ctx.fillStyle=MAG; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
      ctx.fillText('두 배열의 모양을 맞춰 보는 실제 판정', gx, H*0.12);
      function grid(x,y,vals,cw,ch,col,bg){
        for(var i=0;i<vals.length;i++) for(var j=0;j<vals[0].length;j++){
          ctx.fillStyle=bg; ctx.strokeStyle=col; ctx.lineWidth=1;
          ctx.fillRect(x+j*cw,y+i*ch,cw-2,ch-2); ctx.strokeRect(x+j*cw,y+i*ch,cw-2,ch-2);
          ctx.fillStyle=TXT; ctx.font='11.5px ui-monospace,monospace'; ctx.textAlign='center';
          ctx.fillText(vals[i][j], x+j*cw+(cw-2)/2, y+i*ch+ch/2+3);
        }
      }
      var cell=30, gy=H*0.16;
      grid(gx,gy,A.v,cell,cell,BLU,'rgba(122,184,255,0.10)');
      ctx.fillStyle=BLU; ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillText('a '+A.label, gx, gy+ra*cell+16);
      var bx=gx+Math.max(ca,2)*cell+34;
      ctx.fillStyle=TXT; ctx.font='600 18px sans-serif'; ctx.fillText('+', bx-24, gy+24);
      grid(bx,gy,B.v,cell,cell,GLD,'rgba(255,210,122,0.10)');
      ctx.fillStyle=GLD; ctx.font='12px sans-serif';
      ctx.fillText('b '+B.label, bx, gy+rb*cell+16);

      // 축별 판정 표시 (실계산 값)
      var vy=gy+Math.max(ra,rb)*cell+44;
      ctx.font='12.5px ui-monospace,monospace'; ctx.textAlign='left';
      ctx.fillStyle=okR?GRN:RED;
      ctx.fillText('행 축: '+ra+' vs '+rb+' → '+(okR?('통과 ('+rr+')'):'충돌'), gx, vy);
      ctx.fillStyle=okC?GRN:RED;
      ctx.fillText('열 축: '+ca+' vs '+cb+' → '+(okC?('통과 ('+rc+')'):'충돌'), gx, vy+20);

      if(C){
        var ry=vy+38, rcell=Math.min(34,(gw-10)/Math.max(rc,4));
        ctx.fillStyle=TXT; ctx.font='600 16px sans-serif'; ctx.fillText('=', gx, ry+20);
        grid(gx+22,ry,C,rcell,26,MAG,'rgba(255,122,184,0.12)');
        ctx.fillStyle=GRN; ctx.font='600 13px sans-serif';
        ctx.fillText('결과 shape: ('+rr+', '+rc+') — 성공', gx+22, ry+rr*26+18);
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
        ctx.fillText('1인 축은 복제되어 늘어난 것처럼 계산됩니다.', gx+22, ry+rr*26+36);
      } else {
        var ey=vy+42;
        ctx.fillStyle='rgba(240,136,138,0.12)'; ctx.strokeStyle=RED; ctx.lineWidth=1.6;
        roundRect(ctx,gx,ey,gw*0.92,54,9); ctx.fill(); ctx.stroke();
        ctx.fillStyle=RED; ctx.font='600 14px sans-serif';
        ctx.fillText('ValueError — 브로드캐스팅 실패', gx+14, ey+22);
        ctx.fillStyle=TXT; ctx.font='12px sans-serif';
        ctx.fillText((okR?'열':'행')+' 축이 '+(okR?ca+' vs '+cb:ra+' vs '+rb)+' — 어느 쪽도 1이 아닙니다.', gx+14, ey+42);
      }

      E.tapHint(W/2, H*0.95, '슬라이더로 두 shape를 바꿔 성공/실패를 판정해 보세요', true);
      E.big('모양이 다른 것끼리 계산하기 — 브로드캐스팅', '(3,1) 열과 (1,4) 행을 더하면 NumPy는 1인 축을 늘려 (3,4) 표를 만들어 냅니다 — 수학 트랙의 행렬처럼 생겼지만, 규칙은 단 하나 "각 축이 같거나 한쪽이 1"뿐이죠. 이 규칙 덕에 열마다 평균을 빼는 표준화도 루프 없이 한 줄이 됩니다. shape를 바꿔 가며 어느 조합이 통과하는지 직접 확인해 보세요.'); }
  },

  // ══════════ 3. 조건을 데이터에 적용하기 — 마스크 · where · clip ══════════
  { id:'bda3_03',
    enter:function(E){ var self=this; this.s={t:70,mode:0};
      E.controls('<div class="ctrl"><label>기준 점수 t</label><input type="range" id="th" min="40" max="100" step="5" value="70"><output id="tho">70</output></div>');
      E.bind('#th','input',function(e){ self.s.t=+e.target.value; document.getElementById('tho').textContent=self.s.t; E.blip(300+self.s.t*2,0.05); });
      E.setOn([]); },
    tap:function(E){ this.s.mode=(this.s.mode+1)%3; E.blip(360+this.s.mode*110,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, t=s.t;
      var code=[
        {t:'scores = np.array([72, 95, 61, 88, 45,', hl:'scores'},
        {t:'                   79, 90, 55, 83, 67])'},
        {t:'mask = scores >= '+t, hl:'>= '+t},
        {t:'scores[mask]            # 조건 필터', hl:'[mask]'},
        {t:'np.where(mask, "P","F") # 조건 치환', hl:'np.where'},
        {t:'np.clip(scores, 0, '+t+') # 위를 자름', hl:'np.clip'}
      ];
      var act=[3,4,5][s.mode];
      codePanel(E, W*0.04, H*0.10, W*0.46, code, 'mask.py', act);

      // 실제 계산 (골든룰)
      var mask=SCORES.map(function(v){return v>=t;});
      var pass=SCORES.filter(function(v){return v>=t;});
      var nPass=pass.length;
      var mPass=nPass?Math.round(pass.reduce(function(a,b){return a+b;},0)/nPass*10)/10:0;
      var clipped=SCORES.map(function(v){return Math.min(v,t);});
      var maxClip=Math.max.apply(null,clipped);

      // 우측: 막대 10개 + 기준선
      var gx=W*0.54, gw=W*0.42, base=H*0.62, maxH=H*0.38;
      var bw=Math.min(30,(gw-20)/SCORES.length-6);
      ctx.fillStyle=MAG; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
      var mt=['불리언 마스크 — 조건이 곧 필터','np.where — 조건으로 값 치환','np.clip — 범위를 벗어난 값을 자름'][s.mode];
      ctx.fillText(mt, gx, H*0.12);
      for(var i=0;i<SCORES.length;i++){
        var v=SCORES[i], x=gx+i*(bw+8), on=mask[i];
        if(s.mode===2){
          var hC=clipped[i]/100*maxH, hO=v/100*maxH;
          if(v>t){ ctx.strokeStyle='rgba(240,136,138,0.55)'; ctx.lineWidth=1; ctx.setLineDash([3,3]);
            ctx.strokeRect(x,base-hO,bw,hO-hC); ctx.setLineDash([]); }
          ctx.fillStyle='rgba(122,184,255,0.35)'; ctx.strokeStyle=BLU; ctx.lineWidth=1;
          ctx.fillRect(x,base-hC,bw,hC); ctx.strokeRect(x,base-hC,bw,hC);
          ctx.fillStyle=BLU; ctx.font='11px ui-monospace,monospace'; ctx.textAlign='center';
          ctx.fillText(clipped[i], x+bw/2, base-hC-5);
        } else {
          var h=v/100*maxH;
          ctx.fillStyle=on?'rgba(126,224,176,0.35)':'rgba(255,255,255,0.06)';
          ctx.strokeStyle=on?GRN:'rgba(255,255,255,0.18)'; ctx.lineWidth=on?1.6:1;
          ctx.fillRect(x,base-h,bw,h); ctx.strokeRect(x,base-h,bw,h);
          ctx.fillStyle=on?GRN:DIM; ctx.font='11px ui-monospace,monospace'; ctx.textAlign='center';
          ctx.fillText(s.mode===1?(on?'P':'F'):v, x+bw/2, base-h-5);
        }
        ctx.fillStyle=DIM; ctx.font='11px monospace'; ctx.textAlign='center';
        ctx.fillText(s.mode===0?(on?'T':'F'):v, x+bw/2, base+14);
      }
      // 기준선 t
      var ty=base-t/100*maxH;
      ctx.strokeStyle=GLD; ctx.lineWidth=1.4; ctx.setLineDash([6,4]);
      ctx.beginPath(); ctx.moveTo(gx-6,ty); ctx.lineTo(gx+gw*0.92,ty); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=GLD; ctx.font='600 12px sans-serif'; ctx.textAlign='right';
      ctx.fillText('t='+t, gx-8, ty-6);

      // 실계산 readout (긴 문장은 엔진 HUD가 코너로 분리)
      ctx.fillStyle=TXT; ctx.font='12.5px sans-serif'; ctx.textAlign='left';
      if(s.mode===0){
        ctx.fillText('조건을 만족한 원소는 '+nPass+'개 / 10개, 통과 평균은 '+(nPass?mPass+'점':'없음')+'입니다.', gx, base+42);
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
        ctx.fillText('아래 T/F가 마스크 — True 자리만 남습니다.', gx, base+62);
      } else if(s.mode===1){
        ctx.fillText('P는 '+nPass+'개, F는 '+(10-nPass)+'개 — 조건에 따라 값을 골라 새 배열을 만듭니다.', gx, base+42);
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
        ctx.fillText('if문 10번 대신 np.where 한 줄입니다.', gx, base+62);
      } else {
        ctx.fillText('클립 후 최댓값은 '+maxClip+' — 기준을 넘던 값 '+SCORES.filter(function(v){return v>t;}).length+'개가 t로 잘렸습니다.', gx, base+42);
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
        ctx.fillText('점선 윤곽이 잘려 나간 부분입니다 — 이상치 완화에 씁니다.', gx, base+62);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 마스크 → where → clip · 슬라이더 = 기준 t', true);
      E.big('조건을 데이터에 적용하기 — 마스크 · where · clip', '원소 하나하나 if로 검사하던 일을 배열 전체에 한 번에 묻습니다. scores >= t는 True/False 배열(마스크)이 되고, 그 마스크가 그대로 필터가 되죠. np.where는 조건으로 값을 갈아 끼우고, np.clip은 범위를 벗어난 값을 잘라 냅니다 — 셋 다 벡터화라서 빠르고, 조건이 데이터처럼 다뤄진다는 것이 핵심입니다.'); }
  },

  // ══════════ 4. 복사인가 뷰인가 — 값과 참조 ══════════
  { id:'bda3_04',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(340+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, step=s.step;
      var code=[
        {t:'arr = np.arange(6)', hl:'arr'},
        {t:'v = arr[1:4]        # 뷰(view)', hl:'arr[1:4]'},
        {t:'v[0] = 99           # 원본도 바뀜!', hl:'v[0] = 99'},
        {t:'c = arr[1:4].copy() # 독립 복사', hl:'.copy()'},
        {t:'c[0] = -1           # 원본 무사', hl:'c[0] = -1'},
        {t:'', dim:true},
        {t:'df[df.s < 60]["s"] = 0     # 경고!', hl:'df[df.s < 60]["s"]'},
        {t:'df.loc[df.s < 60, "s"] = 0 # 정석', hl:'df.loc'}
      ];
      var act=[1,2,4,7][step];
      codePanel(E, W*0.04, H*0.10, W*0.46, code, 'view_copy.py', act);

      // 실제 의미론 추적 (골든룰: 단계별 연산을 그대로 실행)
      var arr=[0,1,2,3,4,5];
      if(step>=1) arr[1]=99;                    // v[0]=99 → 같은 메모리라 arr[1] 변경
      var c=null;
      if(step>=2){ c=[arr[1],arr[2],arr[3]]; c[0]=-1; }   // copy 후 변경 — arr 불변

      var gx=W*0.54, gw=W*0.42;
      if(step<3){
        ctx.fillStyle=MAG; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('메모리에서 실제로 벌어지는 일', gx, H*0.12);
        var cw=Math.min(44,(gw-10)/6), ay=H*0.18;
        for(var i=0;i<6;i++){ var x=gx+i*cw, inV=(i>=1&&i<=3);
          ctx.fillStyle=inV?'rgba(255,122,184,0.14)':'rgba(255,255,255,0.05)';
          ctx.strokeStyle=inV?MAG:'rgba(255,255,255,0.2)'; ctx.lineWidth=inV?1.8:1;
          ctx.fillRect(x,ay,cw-3,32); ctx.strokeRect(x,ay,cw-3,32);
          var chg=(step>=1&&i===1);
          ctx.fillStyle=chg?RED:TXT; ctx.font=(chg?'600 ':'')+'14px ui-monospace,monospace'; ctx.textAlign='center';
          ctx.fillText(arr[i], x+(cw-3)/2, ay+21);
          ctx.fillStyle=DIM; ctx.font='11px monospace'; ctx.fillText('['+i+']', x+(cw-3)/2, ay+46);
        }
        ctx.fillStyle=TXT; ctx.font='12px sans-serif'; ctx.textAlign='left';
        ctx.fillText('arr — 원본 메모리', gx, ay-8);
        // v 브래킷: 같은 칸을 가리킴
        var vx=gx+cw, vw=cw*3-3;
        ctx.strokeStyle=MAG; ctx.lineWidth=1.6;
        ctx.beginPath(); ctx.moveTo(vx,ay+56); ctx.lineTo(vx,ay+64); ctx.lineTo(vx+vw,ay+64); ctx.lineTo(vx+vw,ay+56); ctx.stroke();
        ctx.fillStyle=MAG; ctx.font='600 12px sans-serif'; ctx.textAlign='center';
        ctx.fillText('v = arr[1:4] — 새 배열이 아니라 같은 칸을 보는 창', vx+vw/2, ay+82);
        if(step>=1){
          ctx.fillStyle=RED; ctx.font='600 12.5px sans-serif'; ctx.textAlign='left';
          ctx.fillText('v[0]=99 한 줄에 arr[1]도 99가 됐습니다 — 같은 칸이니까요.', gx, ay+110);
        }
        if(step>=2&&c){
          var cy2=ay+130;
          for(var j=0;j<3;j++){ var x2=gx+cw+j*cw;
            ctx.fillStyle='rgba(126,224,176,0.12)'; ctx.strokeStyle=GRN; ctx.lineWidth=1.6;
            ctx.fillRect(x2,cy2,cw-3,32); ctx.strokeRect(x2,cy2,cw-3,32);
            ctx.fillStyle=(j===0)?GRN:TXT; ctx.font=(j===0?'600 ':'')+'14px ui-monospace,monospace'; ctx.textAlign='center';
            ctx.fillText(c[j], x2+(cw-3)/2, cy2+21);
          }
          ctx.fillStyle=GRN; ctx.font='600 12px sans-serif'; ctx.textAlign='left';
          ctx.fillText('c = copy() — 새 메모리', gx+cw, cy2+48);
          ctx.fillStyle=TXT; ctx.font='12.5px sans-serif';
          ctx.fillText('c[0]=-1로 바꿔도 arr은 그대로입니다 — 독립된 사본이니까요.', gx, cy2+72);
        }
      } else {
        // pandas 연쇄 인덱싱 함정 — 실제 결과 계산
        var S0=[55,72,43,90];
        var chained=S0.slice();                                  // 사본에 대입 → 원본 불변
        var locres=S0.map(function(v){return v<60?0:v;});        // .loc → 진짜 반영
        ctx.fillStyle=MAG; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('pandas의 같은 함정 — 연쇄 인덱싱', gx, H*0.12);
        function table(x,y,vals,title,col,changedFn){
          ctx.fillStyle=col; ctx.font='600 12.5px sans-serif'; ctx.textAlign='left'; ctx.fillText(title, x, y-8);
          for(var i=0;i<vals.length;i++){
            var chg=changedFn(i);
            ctx.fillStyle=chg?'rgba(126,224,176,0.15)':'rgba(255,255,255,0.05)';
            ctx.strokeStyle=chg?GRN:'rgba(255,255,255,0.2)'; ctx.lineWidth=1;
            ctx.fillRect(x,y+i*28,110,24); ctx.strokeRect(x,y+i*28,110,24);
            ctx.fillStyle=DIM; ctx.font='11px monospace'; ctx.textAlign='left'; ctx.fillText('행'+i, x+8, y+i*28+16);
            ctx.fillStyle=chg?GRN:TXT; ctx.font='13px ui-monospace,monospace'; ctx.textAlign='right';
            ctx.fillText(vals[i], x+100, y+i*28+16);
          }
        }
        var ty0=H*0.20;
        table(gx, ty0, S0, 'df.s (원본)', DIM, function(){return false;});
        table(gx+gw*0.34, ty0, chained, '연쇄 인덱싱 후', RED, function(i){return chained[i]!==S0[i];});
        table(gx+gw*0.68, ty0, locres, 'df.loc 후', GRN, function(i){return locres[i]!==S0[i];});
        var ny=ty0+4*28+24;
        ctx.fillStyle=RED; ctx.font='600 12.5px sans-serif'; ctx.textAlign='left';
        ctx.fillText('연쇄 인덱싱은 사본에 썼습니다 — 원본은 한 칸도 안 바뀜 (경고 발생).', gx, ny);
        ctx.fillStyle=GRN;
        ctx.fillText('df.loc[조건, 열] = 값 — 60 미만 '+S0.filter(function(v){return v<60;}).length+'칸이 실제로 0이 됐습니다.', gx, ny+22);
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
        ctx.fillText('한 번의 loc 인덱싱 = 원본에 직접, 두 번 연쇄 = 사본에 헛수고.', gx, ny+44);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 뷰 → 원본 변경 → copy → pandas 함정', true);
      E.big('복사인가 뷰인가 — 값과 참조', '슬라이스 arr[1:4]는 데이터를 복사하지 않고 같은 메모리를 보는 "창(뷰)"을 돌려줍니다 — 그래서 v를 고치면 원본이 함께 바뀌죠. 독립된 사본이 필요하면 copy()를 불러야 합니다. pandas에서도 같은 원리로, df[조건][열]=값 처럼 두 번 연쇄하면 사본에 쓰게 되어 원본이 안 바뀝니다 — df.loc[조건, 열]=값 이 정석입니다.'); }
  },

  // ══════════ 5. 함수로 묶고 모듈로 나누기 ══════════
  { id:'bda3_05',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(330+this.s.step*90,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, step=s.step;
      var codeBefore=[
        {t:'# 도시 A', dim:true},
        {t:'a = a.dropna()'},
        {t:'a["v"] = (a["v"]-a["v"].mean())/a["v"].std()'},
        {t:'a = a.sort_values("v")'},
        {t:'# 도시 B — 같은 3줄을 또', dim:true},
        {t:'b = b.dropna()'},
        {t:'b["v"] = (b["v"]-b["v"].mean())/b["v"].std()'},
        {t:'b = b.sort_values("v")'},
        {t:'# 도시 C — 또…', dim:true},
        {t:'c = c.dropna()'},
        {t:'c["v"] = (c["v"]-c["v"].mean())/c["v"].std()'},
        {t:'c = c.sort_values("v")'}
      ];
      var codeAfter=[
        {t:'def clean(df):', hl:'def clean'},
        {t:'    df = df.dropna()'},
        {t:'    v = df["v"] - df["v"].mean()'},
        {t:'    df["v"] = v / df["v"].std()'},
        {t:'    return df.sort_values("v")', hl:'return'},
        {t:'', dim:true},
        {t:'a, b, c = clean(a), clean(b), clean(c)', hl:'clean'}
      ];
      var codeTrap=[
        {t:'def add(x, xs=[]):    # 함정!', hl:'xs=[]'},
        {t:'    xs.append(x)'},
        {t:'    return xs'},
        {t:'add(1)'},
        {t:'add(2)   # 결과가…?', hl:'add(2)'},
        {t:'', dim:true},
        {t:'def add(x, xs=None):  # 정석', hl:'xs=None'},
        {t:'    xs = [] if xs is None else xs'},
        {t:'    xs.append(x); return xs'}
      ];
      var codeMod=[
        {t:'# analysis/prep.py — 모듈', dim:true},
        {t:'from prep import clean, scale', hl:'import'},
        {t:'', dim:true},
        {t:'result = (df.pipe(clean)', hl:'.pipe'},
        {t:'            .pipe(scale)', hl:'.pipe'},
        {t:'            .pipe(summary))', hl:'.pipe'}
      ];
      // 실제 줄 수 계산 (골든룰: 코드 배열 자체를 세어 비교)
      function codeLines(arr){ return arr.filter(function(L){ var t=(typeof L==='string')?L:L.t; return t && t.trim() && !L.dim; }).length; }
      var nBefore=codeLines(codeBefore), nAfter=codeLines(codeAfter);
      function countHas(arr,tok){ return arr.filter(function(L){ var t=(typeof L==='string')?L:L.t; return t && t.indexOf(tok)>=0; }).length; }
      var fixBefore=countHas(codeBefore,'.dropna()'), fixAfter=countHas(codeAfter,'.dropna()');

      var gx=W*0.54, gw=W*0.42;
      if(step===0){
        codePanel(E, W*0.04, H*0.08, W*0.46, codeBefore, 'before.py — 복사·붙여넣기 분석', 6);
        ctx.fillStyle=RED; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('같은 처리 3벌 — 실제 코드 줄 수 '+nBefore+'줄', gx, H*0.14);
        for(var i=0;i<3;i++){ var y=H*0.18+i*64;
          ctx.fillStyle='rgba(240,136,138,0.10)'; ctx.strokeStyle=RED; ctx.lineWidth=1.2;
          roundRect(ctx,gx,y,gw*0.85,50,9); ctx.fill(); ctx.stroke();
          ctx.fillStyle=RED; ctx.font='600 13px sans-serif'; ctx.fillText('도시 '+['A','B','C'][i], gx+14, y+20);
          ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
          ctx.fillText('dropna → 표준화 → 정렬 (똑같은 3줄)', gx+14, y+38);
        }
        ctx.fillStyle=TXT; ctx.font='12.5px sans-serif';
        ctx.fillText('표준화 식을 고치려면 '+fixBefore+'곳을 전부 고쳐야 합니다 — 하나라도 빠뜨리면 버그.', gx, H*0.18+3*64+18);
      } else if(step===1){
        codePanel(E, W*0.04, H*0.10, W*0.46, codeAfter, 'after.py — 함수로 묶기', 0);
        ctx.fillStyle=GRN; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('함수 하나로 — 실제 줄 수 비교', gx, H*0.14);
        // 줄 수 막대 (실계산)
        var bw2=gw*0.7, by2=H*0.20, u=bw2/Math.max(nBefore,nAfter);
        ctx.fillStyle='rgba(240,136,138,0.30)'; ctx.strokeStyle=RED; ctx.lineWidth=1.2;
        ctx.fillRect(gx,by2,u*nBefore,24); ctx.strokeRect(gx,by2,u*nBefore,24);
        ctx.fillStyle=RED; ctx.font='12.5px ui-monospace,monospace'; ctx.fillText('전 '+nBefore+'줄', gx+u*nBefore+8, by2+16);
        ctx.fillStyle='rgba(126,224,176,0.30)'; ctx.strokeStyle=GRN;
        ctx.fillRect(gx,by2+36,u*nAfter,24); ctx.strokeRect(gx,by2+36,u*nAfter,24);
        ctx.fillStyle=GRN; ctx.fillText('후 '+nAfter+'줄', gx+u*nAfter+8, by2+52);
        ctx.fillStyle=TXT; ctx.font='12.5px sans-serif';
        ctx.fillText('고칠 곳: '+fixBefore+'곳 → '+fixAfter+'곳 — 로직이 한군데에만 있습니다.', gx, by2+94);
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
        ctx.fillText('입력을 받아 결과만 돌려주는 순수 함수 — 테스트도 쉬워집니다.', gx, by2+116);
      } else if(step===2){
        codePanel(E, W*0.04, H*0.10, W*0.46, codeTrap, 'default_trap.py', 0);
        // 실제 의미론 시뮬레이션: 기본 인자 리스트는 함수 정의 때 '한 번만' 생성
        var shared=[]; shared.push(1); var r1=shared.slice(); shared.push(2); var r2=shared.slice();
        var s1=[],s2=[]; s1.push(1); s2.push(2);   // 정석: 호출마다 새 리스트
        ctx.fillStyle=MAG; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('기본 인자의 함정 — 실제 실행 결과', gx, H*0.14);
        ctx.font='13px ui-monospace,monospace';
        ctx.fillStyle=RED;  ctx.fillText('xs=[] 버전:   add(1) → ['+r1.join(', ')+']', gx, H*0.20);
        ctx.fillStyle=RED;  ctx.fillText('              add(2) → ['+r2.join(', ')+']  ?!', gx, H*0.20+24);
        ctx.fillStyle=GRN;  ctx.fillText('xs=None 버전: add(1) → ['+s1.join(', ')+']', gx, H*0.20+58);
        ctx.fillStyle=GRN;  ctx.fillText('              add(2) → ['+s2.join(', ')+']', gx, H*0.20+82);
        ctx.fillStyle=TXT; ctx.font='11px sans-serif';
        ctx.fillText('기본값 리스트는 함수 정의 때 딱 한 번 만들어져', gx, H*0.20+114);
        ctx.fillText('호출들끼리 공유됩니다.', gx, H*0.20+130);
        ctx.fillStyle=DIM; ctx.font='11px sans-serif';
        ctx.fillText('가변 객체(list·dict·DataFrame)를 기본 인자로 두지', gx, H*0.20+150);
        ctx.fillText('마세요 — None이 정석.', gx, H*0.20+166);
      } else {
        codePanel(E, W*0.04, H*0.12, W*0.46, codeMod, 'pipeline.py — 모듈과 파이프', 3);
        // 파이프라인 각 단계 실계산: dropna → 표준화(ddof=1) → 요약
        var cleaned=PIPE_RAW.filter(function(v){return v!==null;});
        var mean=cleaned.reduce(function(a,b){return a+b;},0)/cleaned.length;
        var varr=cleaned.reduce(function(a,b){return a+(b-mean)*(b-mean);},0)/(cleaned.length-1);
        var sd=Math.sqrt(varr);
        var scaled=cleaned.map(function(v){return Math.round((v-mean)/sd*100)/100;});
        var m2=scaled.reduce(function(a,b){return a+b;},0)/scaled.length;
        var v2=scaled.reduce(function(a,b){return a+(b-m2)*(b-m2);},0)/(scaled.length-1);
        ctx.fillStyle=MAG; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('파이프라인 — 데이터가 함수를 통과합니다', gx, H*0.14);
        var stages=[
          {t:'df (원본 '+PIPE_RAW.length+'개)', d:'[4, 8, NaN, 6, 2]', c:DIM},
          {t:'clean — 결측 제거', d:'['+cleaned.join(', ')+']  ('+cleaned.length+'개)', c:BLU},
          {t:'scale — 표준화', d:'['+scaled.join(', ')+']', c:GLD},
          {t:'summary — 요약', d:'평균 '+(Math.round(m2*100)/100).toFixed(2)+' · 표준편차 '+(Math.round(Math.sqrt(v2)*100)/100).toFixed(2), c:GRN}
        ];
        for(var j=0;j<stages.length;j++){ var y3=H*0.18+j*66, st=stages[j];
          ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.strokeStyle=st.c; ctx.lineWidth=1.4;
          roundRect(ctx,gx,y3,gw*0.9,50,9); ctx.fill(); ctx.stroke();
          ctx.fillStyle=st.c; ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.fillText(st.t, gx+14, y3+20);
          ctx.fillStyle=TXT; ctx.font='12px ui-monospace,monospace'; ctx.fillText(st.d, gx+14, y3+38);
          if(j<stages.length-1){ ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1.6;
            ctx.beginPath(); ctx.moveTo(gx+gw*0.45,y3+50); ctx.lineTo(gx+gw*0.45,y3+66); ctx.stroke(); }
        }
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
        ctx.fillText('각 단계가 순수 함수 — 모듈로 나누면 어느 분석에서든 다시 씁니다.', gx, H*0.18+4*66+8);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 중복 → 함수 → 기본 인자 함정 → 모듈·파이프라인', true);
      E.big('함수로 묶고 모듈로 나누기', '복사·붙여넣기한 분석 코드는 고칠 곳이 여러 군데로 흩어져 버그의 온상이 됩니다. 같은 처리를 함수 하나로 묶으면 줄 수가 줄고 고칠 곳이 한 곳이 되죠. 단, 가변 기본 인자(xs=[])는 호출들끼리 공유되는 함정이니 None으로 받으세요. 함수들을 모듈로 나눠 pipe로 이으면, 분석이 읽히는 파이프라인이 됩니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
