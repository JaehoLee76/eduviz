/* 산업위생기술사 제5장 — 작업환경관리: 현장별 관리의 기술 (동작만. 텍스트=content/hyg5.json) */
(function(){
  var AMB='#f2bd55', ORA='#ffb27a', GRN='#8fe3b5', BLU='#7ab8ff', PNK='#f4a0c0', RED='#f0888a', DIM='#9b99a3', TXT='#dfeefb';
  function lg(x){ return Math.log(x)/Math.LN10; }
  function TX(ctx,t,x,y,c,fs,al,wt){ ctx.save(); ctx.fillStyle=c||TXT; ctx.font=(wt||'500')+' '+(fs||13)+'px Pretendard,"Malgun Gothic",sans-serif'; ctx.textAlign=al||'left'; ctx.textBaseline='middle'; ctx.fillText(t,x,y); ctx.restore(); }
  function LN(ctx,x1,y1,x2,y2,c,w,dash){ ctx.save(); ctx.strokeStyle=c; ctx.lineWidth=w||1.5; ctx.setLineDash(dash||[]); ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); ctx.restore(); }
  function BX(ctx,x,y,w,h,fill,alpha,stroke){ ctx.save(); ctx.globalAlpha=(alpha==null?1:alpha); ctx.fillStyle=fill; ctx.fillRect(x,y,w,h); if(stroke){ ctx.globalAlpha=1; ctx.strokeStyle=stroke; ctx.lineWidth=1.2; ctx.strokeRect(x,y,w,h); } ctx.restore(); }
  function RB(ctx,x,y,w,h,r){ if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}else{ctx.beginPath();ctx.rect(x,y,w,h);} }
  function DOT(ctx,x,y,r,c){ ctx.save(); ctx.fillStyle=c; ctx.beginPath(); ctx.arc(x,y,r,0,6.2832); ctx.fill(); ctx.restore(); }
  function fnum(v){ if(v>=1000) return Math.round(v).toLocaleString('en-US'); if(v>=100) return String(Math.round(v)); if(v>=10) return v.toFixed(1); if(v>=1) return v.toFixed(2); return v.toFixed(3); }
  function chip(ctx,x,y,txt,c){ ctx.save(); ctx.font='600 11.5px Pretendard,"Malgun Gothic",sans-serif'; var w=ctx.measureText(txt).width+18, h=20;
    ctx.globalAlpha=0.16; ctx.fillStyle=c; RB(ctx,x,y,w,h,10); ctx.fill(); ctx.globalAlpha=1; ctx.strokeStyle=c; ctx.lineWidth=1; RB(ctx,x,y,w,h,10); ctx.stroke();
    ctx.fillStyle=c; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText(txt,x+9,y+h/2+0.5); ctx.restore(); return w; }
  function navbar(E,names,step){ var ctx=E.ctx, W=E.W, H=E.H, n=names.length, cw=(W*0.90)/n;
    for(var i=0;i<n;i++){ var cx=W*0.05+i*cw; BX(ctx,cx,H*0.285,cw-14,4,(i===step?ORA:'#2a3244'),1); TX(ctx,names[i],cx,H*0.285+16,(i===step?ORA:DIM),11.5,'left',(i===step?'700':'500')); } }

  var scenes=[
  /* ===== 5.1 관리 대책의 위계 — 사다리 ===== */
  { id:'hyg5_01',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, i;
      E.tapHint(0,0,'단계',true);
      /* 모델: 초기 노출지수 E0 = 노출기준의 5배. 각 단계가 잔여노출을 곱으로 낮춤(잔여비율). */
      var E0=5.0;
      var rungs=[
        {t:'① 제거 · 대체',      s:'유해물질을 덜 해로운 것으로 · 공정 자체를 바꿈', keep:0.15, c:GRN},
        {t:'② 공학적 대책',      s:'격리 · 밀폐 · 국소배기 · 전체환기 — 사람과 무관하게 작동', keep:0.20, c:BLU},
        {t:'③ 관리적(행정) 대책', s:'작업시간 단축 · 순환배치 · 교육 · 정리정돈', keep:0.70, c:AMB},
        {t:'④ 개인보호구',       s:'호흡보호구 · 보호장갑 — 착용해야만, 사람에 의존', keep:0.46, c:ORA}
      ];
      /* 누적 잔여 계산(step개 적용) */
      var res=E0, resAfter=[E0];
      for(i=0;i<s.step;i++){ res*=rungs[i].keep; resAfter.push(res); }
      var cur=resAfter[s.step];
      var ppeOnly=E0*rungs[3].keep;   /* 보호구만 의존 시 */
      /* 좌: 사다리 */
      var lx=W*0.06, lw=W*0.50, y0=H*0.33, rh=(H*0.50)/4;
      TX(ctx,'관리의 사다리 — 위로 갈수록 근본적 · 아래로 갈수록 사람 의존',lx,y0-16,AMB,12.5,'left','700');
      for(i=0;i<4;i++){ var ry=y0+i*rh, active=(i===s.step-1), done=(i<s.step-1);
        var col=rungs[i].c, on=(s.step>0&&i<=s.step-1);
        ctx.save(); ctx.globalAlpha=on?0.16:0.05; ctx.fillStyle=col; RB(ctx,lx,ry,lw,rh-10,9); ctx.fill(); ctx.restore();
        ctx.strokeStyle=on?col:'#39414f'; ctx.lineWidth=active?2.4:1.3; RB(ctx,lx,ry,lw,rh-10,9); ctx.stroke();
        TX(ctx,rungs[i].t,lx+14,ry+(rh-10)*0.36,on?col:DIM,14,'left','700');
        TX(ctx,rungs[i].s,lx+14,ry+(rh-10)*0.74,on?TXT:DIM,11.5,'left');
        TX(ctx,'저감 '+Math.round((1-rungs[i].keep)*100)+'%',lx+lw-12,ry+(rh-10)*0.36,on?col:DIM,12,'right','700');
      }
      /* 우: 잔여 노출 게이지 (노출기준 = 1.0 기준선) */
      var gx=W*0.62, gw=W*0.30, gTop=H*0.36, gBot=H*0.82;
      function Yv(v){ return gBot-(Math.min(v,E0)/E0)*(gBot-gTop); }
      TX(ctx,'잔여 노출지수 (노출기준=1.0)',gx,gTop-16,AMB,12.5,'left','700');
      LN(ctx,gx,gBot,gx+gw,gBot,DIM,1.5);
      var y1line=Yv(1.0);
      LN(ctx,gx-6,y1line,gx+gw+6,y1line,RED,1.6,[5,4]);
      TX(ctx,'노출기준 1.0 (초과 금지)',gx+gw+8,y1line,RED,10.5,'left','600');
      /* 현재 잔여 막대 */
      var barW=W*0.11, bx=gx+W*0.03;
      var barCol=(cur>1.0)?RED:GRN;
      BX(ctx,bx,Yv(cur),barW,gBot-Yv(cur),barCol,0.85,barCol);
      TX(ctx,fnum(cur),bx+barW/2,Yv(cur)-13,barCol,14,'center','700');
      TX(ctx,(s.step===0?'대책 전':'①~'+['','①','②','③','④'][s.step]+' 적용'),bx+barW/2,gBot+16,barCol,11.5,'center','700');
      /* 보호구만 의존 비교 막대 */
      var bx2=gx+W*0.18;
      BX(ctx,bx2,Yv(ppeOnly),barW,gBot-Yv(ppeOnly),(ppeOnly>1?RED:GRN),0.55,ORA);
      TX(ctx,fnum(ppeOnly),bx2+barW/2,Yv(ppeOnly)-13,(ppeOnly>1?RED:ORA),13,'center','700');
      TX(ctx,'보호구만',bx2+barW/2,gBot+16,ORA,11.5,'center','700');
      /* 설명 라인 */
      var ex=gx, ey=H*0.88;
      if(s.step===0){ TX(ctx,'유해인자 발생 직후 — 노출기준의 '+E0.toFixed(0)+'배',ex,ey,TXT,12); }
      else if(s.step<4){ TX(ctx,'누적 잔여 = 5.0 × '+resAfter.slice(1,s.step+1).map(function(_,k){return rungs[k].keep;}).join(' × ')+' = '+fnum(cur),ex,ey,TXT,12); }
      else { TX(ctx,'근본→말단 순서로 쌓으면 '+fnum(cur)+' (기준 이내). 보호구만 쓰면 '+fnum(ppeOnly)+' — 여전히 초과',ex,ey,(cur<=1?GRN:RED),12); }
      var big2=(s.step===4)?'보호구만 의존하면 '+fnum(ppeOnly)+'배로 아직 초과 — 그래서 최후 수단입니다'
              :(s.step===0)?'발생원을 없애는 것이 가장 확실 — 사다리 위에서부터 내려옵니다'
              :'각 단계가 곱으로 쌓여 노출을 낮춥니다 — 현재 잔여지수 '+fnum(cur);
      E.big('관리 위계: 제거·대체 → 공학 → 관리 → 보호구', big2);
      navbar(E,['발생원','제거·대체','공학적','관리적','개인보호구'],s.step); } },

  /* ===== 5.2 공정별 유해인자 지도 ===== */
  { id:'hyg5_02',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, i;
      E.tapHint(0,0,'공정',true);
      var PROC=[
        { name:'도금', c:BLU, sub:'전기·크롬 도금조 — 산성·알칼리 도금욕',
          haz:['산·알칼리 미스트','6가 크롬(발암성)','시안화물(알칼리욕)','수소·산 증기'],
          agents:[ {n:'6가 크롬',c:0.09,tlv:0.05,u:'mg/m³',noise:false},
                   {n:'황산 미스트',c:0.25,tlv:0.2,u:'mg/m³',noise:false},
                   {n:'시안화수소',c:3.0,tlv:4.7,u:'ppm',noise:false} ],
          key:'도금조 밀폐 + 측방 슬롯형 국소배기(PUSH-PULL) · 6가크롬 발암성·시안 급성독성 관리' },
        { name:'용접', c:ORA, sub:'아크 용접 — 용가재에서 흄 약 85% 발생',
          haz:['용접 흄(금속산화물)','오존·질소산화물','일산화탄소','자외선·적외선'],
          agents:[ {n:'용접 흄',c:6.0,tlv:5.0,u:'mg/m³',noise:false},
                   {n:'오존',c:0.12,tlv:0.08,u:'ppm',noise:false},
                   {n:'일산화탄소',c:40,tlv:30,u:'ppm',noise:false} ],
          key:'이동식 흄후드(발생원 밀착) · 차광보호구로 자외선 · 밀폐공간 CO 질식 주의' },
        { name:'주물', c:PNK, sub:'주형·용해·주입 — sand casting',
          haz:['결정형 유리규산(규폐증)','일산화탄소·아황산','소음','고열·적외선'],
          agents:[ {n:'유리규산',c:0.08,tlv:0.05,u:'mg/m³',noise:false},
                   {n:'일산화탄소',c:35,tlv:30,u:'ppm',noise:false},
                   {n:'소음',c:95,tlv:90,u:'dB(A)',noise:true} ],
          key:'습식작업·환기로 규사분진(폐암 표적장기 폐) · 용해로 CO·복사열·소음 동시관리' }
      ];
      var P=PROC[s.step];
      /* 좌: 공정 개념 + 유해인자 칩 */
      var lx=W*0.06, ly=H*0.34;
      TX(ctx,P.name+' 공정',lx,ly,P.c,17,'left','700');
      TX(ctx,P.sub,lx,ly+22,DIM,12);
      /* 공정 모식 박스 */
      var pw=W*0.44, pbY=ly+40, pbH=H*0.16;
      ctx.save(); ctx.globalAlpha=0.10; ctx.fillStyle=P.c; RB(ctx,lx,pbY,pw,pbH,10); ctx.fill(); ctx.restore();
      ctx.strokeStyle=P.c; ctx.lineWidth=1.4; RB(ctx,lx,pbY,pw,pbH,10); ctx.stroke();
      /* 발생원→확산 화살표 */
      DOT(ctx,lx+pw*0.16,pbY+pbH*0.6,7,P.c);
      TX(ctx,'발생원',lx+pw*0.16,pbY+pbH*0.6+20,P.c,11,'center','600');
      for(i=0;i<3;i++){ var ang=-0.5+i*0.5; LN(ctx,lx+pw*0.16+10,pbY+pbH*0.6,lx+pw*0.16+10+Math.cos(ang)*42,pbY+pbH*0.6+Math.sin(ang)*30,P.c,1.4); }
      TX(ctx,'공기 중 확산',lx+pw*0.62,pbY+pbH*0.36,DIM,11.5,'left');
      TX(ctx,'→ 근로자 호흡기',lx+pw*0.62,pbY+pbH*0.66,TXT,11.5,'left');
      /* 유해인자 칩 */
      TX(ctx,'유해인자',lx,pbY+pbH+26,AMB,12,'left','700');
      var chx=lx, chy=pbY+pbH+38;
      for(i=0;i<P.haz.length;i++){ if(chx>lx+pw-70){ chx=lx; chy+=26; } chx+=chip(ctx,chx,chy,P.haz[i],P.c)+8; }
      /* 핵심 관리 포인트 */
      TX(ctx,'핵심 관리 포인트',lx,chy+40,GRN,12,'left','700');
      wrapText(ctx,P.key,lx,chy+60,pw+W*0.04,17,TXT,11.8);
      /* 우: 예시 노출지수 막대(측정예시 ÷ 노출기준, 실계산) */
      var gx=W*0.60, gw=W*0.34, gTop=H*0.36, gBot=H*0.80;
      TX(ctx,'예시 노출지수 = 측정농도 ÷ 노출기준',gx,gTop-16,AMB,12.5,'left','700');
      var idx=P.agents.map(function(a){ return a.noise? Math.pow(2,(a.c-90)/5) : a.c/a.tlv; });
      var mx=Math.max(2, Math.max.apply(null,idx)*1.15);
      function Xi(v){ return gx+ (Math.min(v,mx)/mx)*gw; }
      /* 1.0 기준선 */
      var x1=Xi(1.0);
      LN(ctx,x1,gTop-4,x1,gBot+6,RED,1.6,[5,4]);
      TX(ctx,'1.0 초과',x1+4,gTop-2,RED,10.5,'left','600');
      var bh=26, gap=(gBot-gTop-P.agents.length*bh)/(P.agents.length+1);
      for(i=0;i<P.agents.length;i++){ var a=P.agents[i], v=idx[i], by=gTop+gap+i*(bh+gap);
        var col=(v>1?RED:GRN);
        BX(ctx,gx,by,Xi(v)-gx,bh,col,0.8,col);
        TX(ctx,a.n,gx+6,by-9,TXT,11.5,'left','600');
        TX(ctx,a.noise? a.c+' dB (dose '+v.toFixed(2)+')' : a.c+'/'+a.tlv+' '+a.u+' = '+v.toFixed(2),Xi(v)+8,by+bh/2,col,11.5,'left','700'); }
      TX(ctx,'(측정농도는 관리 상태 예시 — 지수가 큰 인자가 우선 관리 대상)',gx,gBot+22,DIM,11);
      var over=P.agents.filter(function(a,k){return idx[k]>1;}).length;
      E.big(P.name+' 공정 — '+P.haz.length+'대 유해인자, 예시 '+over+'종 기준 초과', P.key);
      navbar(E,['도금','용접','주물'],s.step); } },

  /* ===== 5.3 호흡보호구 — 할당보호계수 APF ===== */
  { id:'hyg5_03',
    enter:function(E){ var self=this; this.s={c:200,ti:0,oel:10};
      E.controls('<div class="ctrl"><label>작업장 농도 C (ppm)</label><input type="range" id="h503c" min="0" max="2000" step="10" value="200"><output id="h503co">200 ppm</output></div>'
        +'<div class="ctrl"><label>보호구 종류(APF)</label><input type="range" id="h503t" min="0" max="3" step="1" value="0"><output id="h503to">반면형(APF 10)</output></div>'
        +'<div class="ctrl"><label>노출기준 OEL (ppm)</label><input type="range" id="h503o" min="1" max="50" step="1" value="10"><output id="h503oo">10 ppm</output></div>');
      var TN=['반면형(APF 10)','전면형(APF 50)','전동식(APF 100)','송기마스크(APF 1000)'];
      E.bind('#h503c','input',function(e){ self.s.c=+e.target.value; document.getElementById('h503co').textContent=e.target.value+' ppm'; });
      E.bind('#h503t','input',function(e){ self.s.ti=+e.target.value; document.getElementById('h503to').textContent=TN[self.s.ti]; });
      E.bind('#h503o','input',function(e){ self.s.oel=+e.target.value; document.getElementById('h503oo').textContent=e.target.value+' ppm'; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, i;
      var APFv=[10,50,100,1000], APFn=['반면형','전면형','전동식','송기마스크'];
      var apf=APFv[s.ti];
      var inside=s.c/apf;               /* 면체 내부 농도 */
      var muc=apf*s.oel;                /* 최대 사용 농도 */
      var safe=(s.c<=muc);              /* 내부농도 ≤ OEL 인가 = C ≤ APF×OEL */
      var need=s.c/s.oel;               /* 필요한 최소 보호계수 */
      /* 좌: 농도 감쇠 막대 (밖 → 면체 안) */
      var lx=W*0.07, top=H*0.40, bot=H*0.84, axW=W*0.42;
      var cmax=Math.max(s.c, muc, s.oel*4, 1);
      function Xc(v){ return lx+(Math.min(v,cmax)/cmax)*axW; }
      TF(ctx,'보호구는 농도를 1/APF로 나눕니다',lx,top-30);
      /* 바깥 농도 */
      var yOut=top+6, yIn=top+70, bh=30;
      BX(ctx,lx,yOut,Xc(s.c)-lx,bh,BLU,0.8,BLU);
      TX(ctx,'작업장 C = '+s.c+' ppm',lx+6,yOut-10,BLU,12,'left','600');
      /* 안쪽 농도 */
      var inCol=(inside>s.oel)?RED:GRN;
      BX(ctx,lx,yIn,Xc(inside)-lx,bh,inCol,0.85,inCol);
      TX(ctx,'면체 내부 = C/'+apf+' = '+fnum(inside)+' ppm',lx+6,yIn-10,inCol,12,'left','600');
      /* OEL 기준선 */
      var xoel=Xc(s.oel);
      LN(ctx,xoel,yOut-8,xoel,yIn+bh+22,RED,1.8,[5,4]);
      TX(ctx,'OEL '+s.oel,xoel+4,yIn+bh+16,RED,11,'left','600');
      /* 감쇠 화살표 */
      LN(ctx,lx+axW*0.5,yOut+bh+4,lx+axW*0.5,yIn-4,DIM,1.4);
      TX(ctx,'÷'+apf,lx+axW*0.5+8,(yOut+bh+yIn)/2,ORA,13,'left','700');
      TX(ctx,'('+APFn[s.ti]+')',lx,yIn+bh+40,DIM,11.5,'left');
      /* 판정 */
      TX(ctx, safe? '내부농도 ≤ 노출기준 — 이 보호구로 방어 가능':'내부농도 > 노출기준 — 보호구를 써도 초과!',
         lx, yIn+bh+64, safe?GRN:RED, 13, 'left','700');
      /* 우: APF 계단 + MUC */
      var gx=W*0.58, gy=H*0.40, gw=W*0.36;
      TF(ctx,'최대사용농도 MUC = APF × OEL',gx,gy-30);
      var rows=[0,1,2,3];
      var rh=34;
      for(i=0;i<4;i++){ var ry=gy+i*rh, sel=(i===s.ti), mv=APFv[i]*s.oel, canUse=(s.c<=mv);
        ctx.save(); ctx.globalAlpha=sel?0.18:0.05; ctx.fillStyle=sel?ORA:(canUse?GRN:'#39414f'); RB(ctx,gx,ry,gw,rh-8,8); ctx.fill(); ctx.restore();
        ctx.strokeStyle=sel?ORA:(canUse?GRN:'#39414f'); ctx.lineWidth=sel?2.2:1.2; RB(ctx,gx,ry,gw,rh-8,8); ctx.stroke();
        TX(ctx,APFn[i]+' · APF '+APFv[i],gx+12,ry+(rh-8)/2,sel?ORA:TXT,12.5,'left',sel?'700':'500');
        TX(ctx,'MUC '+fnum(mv)+' ppm',gx+gw-12,ry+(rh-8)/2,canUse?GRN:RED,12,'right','700'); }
      var py=gy+4*rh+14;
      TX(ctx,'필요 보호계수 = C/OEL = '+s.c+'/'+s.oel+' = '+fnum(need),gx,py,TXT,12.5,'left','700');
      TX(ctx,'선택 APF '+apf+(apf>=need?' ≥ 필요 '+fnum(need)+' → 적합':' < 필요 '+fnum(need)+' → 부족'),gx,py+24,(apf>=need?GRN:RED),12.5,'left','700');
      TX(ctx,'현재 MUC = '+apf+' × '+s.oel+' = '+fnum(muc)+' ppm',gx,py+52,BLU,12);
      TX(ctx,(s.c<=muc?'작업장 농도 ≤ MUC → 사용 가능':'작업장 농도 > MUC → 이 보호구로는 불가, 상위 등급 필요'),gx,py+74,(s.c<=muc?GRN:RED),12,'left','600');
      E.big('MUC = APF × OEL = '+fnum(muc)+' ppm · 면체 내부 = '+fnum(inside)+' ppm',
        safe? APFn[s.ti]+'로 방어 성공 — 내부농도가 노출기준 이내입니다'
            : '농도 '+s.c+'ppm은 이 보호구의 한계('+fnum(muc)+'ppm)를 넘습니다 — 상위 등급으로'); } },

  /* ===== 5.4 밀폐공간 — 산소의 물리 ===== */
  { id:'hyg5_04',
    enter:function(E){ var self=this; this.s={o2:21};
      E.controls('<div class="ctrl"><label>밀폐공간 산소농도 (%)</label><input type="range" id="h504o" min="6" max="21" step="0.5" value="21"><output id="h504oo">21.0 %</output></div>');
      E.bind('#h504o','input',function(e){ self.s.o2=+e.target.value; document.getElementById('h504oo').textContent=(+e.target.value).toFixed(1)+' %'; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, i;
      var o2=s.o2;
      var pO2=760*(o2/100);            /* 산소분압 (mmHg), 대기압 760 */
      var pO2n=760*0.209;              /* 정상 21%(20.9%) 산소분압 */
      /* 산소농도별 증상 사다리(기준값) */
      var sym=[
        {o:21,t:'정상 대기 (20.9%)',c:GRN},
        {o:18,t:'적정공기 하한 · 산소결핍 경계',c:AMB},
        {o:16,t:'두통 · 맥박·호흡수 증가',c:ORA},
        {o:12,t:'어지럼 · 판단력·근력 저하',c:ORA},
        {o:10,t:'의식상실 · 구토',c:RED},
        {o:6, t:'수초 내 혼수 · 호흡정지 · 사망',c:RED}
      ];
      /* 좌: 산소 사다리 게이지 */
      var lx=W*0.10, top=H*0.34, bot=H*0.86, axW=W*0.10;
      function Yo(v){ return bot-((v-4)/(22-4))*(bot-top); }
      TF(ctx,'산소 농도 사다리 — 내려갈수록 위험',lx-W*0.02,top-22);
      LN(ctx,lx,top,lx,bot,DIM,1.5);
      for(i=4;i<=22;i+=2){ LN(ctx,lx-5,Yo(i),lx+5,Yo(i),DIM,1); TX(ctx,i+'%',lx-10,Yo(i),DIM,10.5,'right'); }
      /* 적정공기 대역 18~23.5 */
      var yb1=Yo(Math.min(23.5,22)), yb2=Yo(18);
      ctx.save(); ctx.globalAlpha=0.12; ctx.fillStyle=GRN; ctx.fillRect(lx+8,yb1,axW,yb2-yb1); ctx.restore();
      TX(ctx,'적정공기 18~23.5%',lx+8+axW+6,Yo(20),GRN,11,'left','600');
      /* 증상 눈금 */
      for(i=0;i<sym.length;i++){ var y=Yo(sym[i].o); LN(ctx,lx+8,y,lx+8+axW,y,sym[i].c,1.4); DOT(ctx,lx+8+axW,y,3,sym[i].c);
        TX(ctx,sym[i].t,lx+8+axW+80,y,sym[i].c,11,'left',(sym[i].o<=10?'700':'500')); }
      TX(ctx,'산소결핍 = 18% 미만',lx+8+axW+6,Yo(18)-14,AMB,10.5,'left','600');
      /* 현재 마커 */
      var cy=Yo(o2), curSym=sym[0];
      for(i=0;i<sym.length;i++){ if(o2<=sym[i].o+0.001) curSym=sym[i]; }
      /* 가장 낮은(가장 위험한) 해당 단계 찾기 */
      curSym=sym[0]; for(i=0;i<sym.length;i++){ if(o2<sym[i].o) curSym=sym[i]; }
      var mkCol=(o2>=18?GRN:(o2>=12?ORA:RED));
      LN(ctx,lx-8,cy,lx+8+axW,cy,mkCol,2.4);
      DOT(ctx,lx+8+axW/2,cy,6,mkCol);
      TX(ctx,'◀ '+o2.toFixed(1)+'%',lx-14,cy,mkCol,13,'right','700');
      /* 우: 산소분압 물리 + 절차 */
      var gx=W*0.60, gy=H*0.36;
      TF(ctx,'산소는 분압으로 몸에 들어옵니다',gx,gy-14);
      TX(ctx,'산소분압 pO₂ = 대기압 × 농도',gx,gy+16,TXT,12.5,'left','600');
      TX(ctx,'= 760 mmHg × '+o2.toFixed(1)+'% = '+fnum(pO2)+' mmHg',gx,gy+40,mkCol,13,'left','700');
      TX(ctx,'정상(20.9%) = '+fnum(pO2n)+' mmHg 대비 '+Math.round(pO2/pO2n*100)+'%',gx,gy+62,DIM,11.5);
      /* 분압 막대 */
      var pbx=gx, pby=gy+78, pbw=W*0.32, pbh=18, pmax=170;
      BX(ctx,pbx,pby,pbw,pbh,'#1c2433',1);
      BX(ctx,pbx,pby,(Math.min(pO2,pmax)/pmax)*pbw,pbh,mkCol,0.85);
      var xn=pbx+(pO2n/pmax)*pbw; LN(ctx,xn,pby-6,xn,pby+pbh+6,GRN,1.6,[4,3]); TX(ctx,'정상',xn,pby+pbh+14,GRN,10,'center');
      /* 현재 판정 */
      TX(ctx,'현재 상태: '+curSym.t,gx,pby+pbh+40,mkCol,13,'left','700');
      TX(ctx,(o2>=18?'적정공기 — 작업 가능(단, 유해가스 별도 확인)':'산소결핍 — 즉시 대피·환기, 송기마스크 없이 진입 금지'),gx,pby+pbh+64,(o2>=18?GRN:RED),12,'left','600');
      /* 작업 절차 */
      TX(ctx,'밀폐공간 3대 절차',gx,pby+pbh+96,AMB,12.5,'left','700');
      var procs=['① 측정 — 산소·유해가스 농도(진입 전·작업 중)','② 환기 — 적정공기 확보 후 진입','③ 감시 — 감시인 배치·비상연락체계'];
      for(i=0;i<procs.length;i++){ TX(ctx,procs[i],gx,pby+pbh+118+i*22,TXT,11.8,'left'); }
      TX(ctx,'적정공기 기준: O₂ 18~23.5% · CO₂<1.5% · CO<30ppm · H₂S<10ppm',gx,pby+pbh+196,GRN,11);
      E.big('pO₂ = 760 × '+o2.toFixed(1)+'% = '+fnum(pO2)+' mmHg · '+curSym.t,
        o2>=18? '적정공기 하한 18% 이상 — 산소분압이 조직에 산소를 밀어 넣습니다'
             : '18% 미만 산소결핍 — 분압이 낮아 폐에서 혈액으로 산소가 넘어가지 못합니다'); } },

  /* ===== 5.5 관리 프로그램의 완성 — 인지→평가→관리 루프 ===== */
  { id:'hyg5_05',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, i;
      E.tapHint(0,0,'단계',true);
      var phases=[
        {t:'① 인지(Anticipation·Recognition)', s:'유해인자 확인 — MSDS · 공정분석 · 예비조사', c:BLU},
        {t:'② 측정·평가(Evaluation)',          s:'작업환경측정 · 노출평가 · 노출기준 대비(1~4장)', c:AMB},
        {t:'③ 관리(Control)',                   s:'제거·대체 → 공학 → 관리 → 보호구(본 장)', c:GRN},
        {t:'④ 재평가·기록(Re-evaluation)',      s:'개선효과 확인 · 문서화 · 교육 · 반복 개선', c:PNK}
      ];
      /* 원형 배치 4개 phase */
      var cx=W*0.30, cy=H*0.58, R=Math.min(W*0.20,H*0.26);
      var pos=[]; for(i=0;i<4;i++){ var ang=-Math.PI/2+i*Math.PI/2; pos.push([cx+R*Math.cos(ang), cy+R*Math.sin(ang)]); }
      /* 순환 화살표 */
      var activeArc=(s.step-1);   /* step0=개요, step1~4=각 phase */
      for(i=0;i<4;i++){ var a1=pos[i], a2=pos[(i+1)%4];
        var mx=(a1[0]+a2[0])/2, my=(a1[1]+a2[1])/2;
        var pull=(mx<cx?-1:1), pully=(my<cy?-1:1);
        LN(ctx,a1[0],a1[1],a2[0],a2[1],(i===activeArc?ORA:'#39414f'),(i===activeArc?2.4:1.4));
      }
      /* phase 노드 */
      var bw=W*0.19, bh=H*0.10;
      for(i=0;i<4;i++){ var p=pos[i], on=(s.step>0 && (activeArc===i)), lit=(s.step===0||activeArc>=i||s.step===0);
        var col=phases[i].c, bx=p[0]-bw/2, by=p[1]-bh/2, act=(activeArc===i && s.step>0);
        ctx.save(); ctx.globalAlpha=act?0.20:0.07; ctx.fillStyle=col; RB(ctx,bx,by,bw,bh,10); ctx.fill(); ctx.restore();
        ctx.strokeStyle=act?col:'#454d5c'; ctx.lineWidth=act?2.4:1.3; RB(ctx,bx,by,bw,bh,10); ctx.stroke();
        TX(ctx,phases[i].t,p[0],by+bh*0.34,act?col:TXT,11.5,'center','700');
        wrapText(ctx,phases[i].s,bx+8,by+bh*0.62,bw-16,14,act?TXT:DIM,10.3,'center',p[0]); }
      TX(ctx,'산업위생 관리 루프',cx,cy-6,AMB,12.5,'center','700');
      TX(ctx,'(닫힌 고리)',cx,cy+12,DIM,11,'center');
      /* 우: 반복 개선 수렴 그래프(노출지수, 실계산) */
      var gx=W*0.58, gTop=H*0.36, gBot=H*0.74, gw=W*0.36;
      /* 각 사이클마다 노출지수 = E0 * r^n */
      var E0=3.0, r=0.55, cycles=(s.step>=4)?4:(s.step===0?0:s.step);
      TF(ctx,'루프를 돌 때마다 노출지수가 수렴',gx,gTop-14);
      LN(ctx,gx,gBot,gx+gw,gBot,DIM,1.5); LN(ctx,gx,gBot,gx,gTop-4,DIM,1.5);
      var ymax=E0*1.1;
      function Xn(n){ return gx+(n/4)*gw; }
      function Yn(v){ return gBot-(Math.min(v,ymax)/ymax)*(gBot-gTop); }
      /* 1.0 기준선 */
      LN(ctx,gx,Yn(1.0),gx+gw,Yn(1.0),RED,1.4,[5,4]); TX(ctx,'노출기준 1.0',gx+gw+4,Yn(1.0),RED,10,'left');
      ctx.save(); ctx.strokeStyle=BLU; ctx.lineWidth=2; ctx.beginPath();
      for(i=0;i<=4;i++){ var v=E0*Math.pow(r,i), xx=Xn(i), yy=Yn(v); if(i===0)ctx.moveTo(xx,yy); else ctx.lineTo(xx,yy); }
      ctx.stroke(); ctx.restore();
      for(i=0;i<=4;i++){ var v2=E0*Math.pow(r,i), lit2=(i<=cycles);
        DOT(ctx,Xn(i),Yn(v2),lit2?4.5:3,lit2?(v2>1?ORA:GRN):DIM);
        if(lit2) TX(ctx,fnum(v2),Xn(i),Yn(v2)-13,(v2>1?ORA:GRN),11,'center','700');
        TX(ctx,i+'회',Xn(i),gBot+14,DIM,10,'center'); }
      var vc=E0*Math.pow(r,cycles);
      TX(ctx,(cycles===0?'대책 전 노출지수 '+fnum(E0):cycles+'회 개선 후 노출지수 '+fnum(vc)+(vc<=1?' — 기준 이내':' — 아직 초과')),gx,gBot+34,(vc<=1?GRN:ORA),12,'left','700');
      TX(ctx,'관리 프로그램 = 한 번이 아니라 인지→평가→관리→재평가를 계속 돌리는 것',gx,gBot+58,TXT,11.5);
      TX(ctx,'문서화 · 교육 · 기록으로 개선을 조직의 습관으로 만듭니다',gx,gBot+80,DIM,11.5);
      E.big('산업위생 관리 = 인지 → 평가 → 관리 → 재평가의 닫힌 고리',
        cycles===0?'유해인자를 아는 것에서 시작해 다시 평가로 돌아옵니다'
                 :cycles+'회 반복 후 노출지수 '+fnum(vc)+' — 반복이 개선을 만듭니다');
      navbar(E,['개요','인지','측정·평가','관리','재평가'],s.step); } }
  ];

  /* 텍스트 도우미 */
  function TF(ctx,t,x,y){ TX(ctx,t,x,y,AMB,13,'left','700'); }
  function wrapText(ctx,text,x,y,maxW,lh,col,fs,align,cxc){ ctx.save();
    ctx.font='500 '+(fs||11.5)+'px Pretendard,"Malgun Gothic",sans-serif'; ctx.fillStyle=col||TXT;
    ctx.textAlign=align||'left'; ctx.textBaseline='middle';
    var words=text.split(' '), line='', yy=y, ax=(align==='center')?cxc:x;
    for(var i=0;i<words.length;i++){ var test=line+words[i]+' ';
      if(ctx.measureText(test).width>maxW && line){ ctx.fillText(line.trim(),ax,yy); line=words[i]+' '; yy+=lh; }
      else line=test; }
    ctx.fillText(line.trim(),ax,yy); ctx.restore(); }

  if(window.Engine) window.Engine.addScenes(scenes);
})();
