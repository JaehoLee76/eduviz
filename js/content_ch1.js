/* 제1장 실수 — 1.1 실수의 분류
   하나의 화면이 morph되며: 자연수 → 정수 → 유리수 → 무리수(√2) → 실수
*/
(function(){
  var KO=['영','하나','둘','셋','넷','다섯','여섯','일곱','여덟','아홉','열'];
  var ROOT2='1.41421356237';

  function gcd(a,b){ a=Math.abs(a); b=Math.abs(b); while(b){ var t=b; b=a%b; a=t; } return a; }

  // 에라토스테네스의 체: 거르는 과정을 순서대로 (소수 선택 → 그 배수 지우기)
  function buildSieve(N){ var st={}, acts=[];
    for(var p=2;p*p<=N;p++){ if(st[p]) continue; st[p]='prime'; acts.push({t:'prime',n:p,by:p});
      for(var m=p*p;m<=N;m+=p){ if(!st[m]){ st[m]='composite'; acts.push({t:'cross',n:m,by:p}); } } }
    for(var n=2;n<=N;n++){ if(!st[n]){ st[n]='prime'; acts.push({t:'prime',n:n,by:0}); } }
    return acts; }

  var scenes = [

  // ── 도입 ──────────────────────────────────────────────
  { id:'ch1_01',
    enter:function(E){ E.big(null); this.layout(E); },
    layout:function(E){ var L=[],n=12,R=Math.min(170,E.W*0.22);
      for(var i=0;i<n;i++) L.push({x:E.W/2+Math.cos(i/n*6.283)*R, y:E.H*0.5+Math.sin(i/n*6.283)*R, col:'rgba(255,255,255,0.5)'});
      E.setOn(L);
    }
  },

  // ── 자연수 ────────────────────────────────────────────
  { id:'ch1_02',
    enter:function(E){ this.s={n:1}; E.NL.range(0,11); this.layout(E); },
    layout:function(E){ var n=this.s.n, L=[]; for(var k=1;k<=n;k++) L.push({x:E.NL.px(k), y:E.NL.yy()}); E.setOn(L,E.COL.accent); E.big(n, KO[n]); },
    back:function(E){ E.NL.step(); E.NL.draw({integers:true}); },
    tap:function(E){ if(this.s.n<10){ this.s.n++; E.blip(440+this.s.n*40,0.2); this.layout(E);} else E.blip(220,0.2); }
  },

  // ── 정수 ──────────────────────────────────────────────
  { id:'ch1_03',
    enter:function(E){ this.s={val:0,drag:false}; E.NL.range(-6,6); E.big(null);
      var L=[]; for(var v=-6;v<=6;v++){ if(v===0) continue; L.push({x:E.NL.px(v),y:E.NL.yy(),r:4,col:'rgba(230,228,220,0.5)'}); } E.setOn(L); },
    layout:function(E){ var L=[]; for(var v=-6;v<=6;v++){ if(v===0) continue; L.push({x:E.NL.px(v),y:E.NL.yy(),r:4,col:'rgba(230,228,220,0.5)'}); } E.setOn(L); },
    back:function(E){ E.NL.step(); E.NL.draw(); },
    draw:function(E){ var s=this.s; E.NL.marker(s.val, E.COL.accent, s.val); },
    down:function(E,x,y){ if(Math.abs(x-E.NL.px(this.s.val))<30 && Math.abs(y-E.NL.yy())<46) this.s.drag=true; },
    move:function(E,x){ if(this.s.drag){ var v=Math.max(-6,Math.min(6,Math.round(E.NL.val(x)))); if(v!==this.s.val){ this.s.val=v; E.blip(330+v*28,0.14);} } },
    up:function(){ this.s.drag=false; }
  },

  // ── 유리수 ────────────────────────────────────────────
  { id:'ch1_04',
    enter:function(E){ this.s={D:2}; E.NL.range(0,1); E.big(null);
      E.controls('<div class="ctrl"><label>분모 최대</label><input type="range" id="Ds" min="2" max="20" step="1" value="2"><output id="Do">2</output></div>');
      var self=this; E.bind('#Ds','input',function(e){ self.s.D=+e.target.value; document.getElementById('Do').textContent=e.target.value; E.blip(300+self.s.D*25,0.1); });
      E.setOn([]); },
    back:function(E){ E.NL.step(); E.NL.draw({integers:true}); },
    draw:function(E){ var s=this.s, y=E.NL.yy(), ctx=E.ctx, cnt=0, seen={};
      for(var d=2; d<=s.D; d++){ for(var k=1;k<d;k++){ if(gcd(k,d)!==1) continue; var v=k/d; var key=v.toFixed(6); if(seen[key])continue; seen[key]=1; cnt++;
        var x=E.NL.px(v); ctx.fillStyle=E.COL.blue; ctx.globalAlpha=0.85; ctx.beginPath(); ctx.arc(x,y,3.2,0,7); ctx.fill(); ctx.globalAlpha=1; } }
      // 0,1 강조
      ctx.fillStyle=E.COL.accent; [0,1].forEach(function(v){ ctx.beginPath(); ctx.arc(E.NL.px(v),y,6,0,7); ctx.fill(); });
      ctx.fillStyle=E.COL.txt; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('0',E.NL.px(0),y+26); ctx.fillText('1',E.NL.px(1),y+26);
      E.big('+'+cnt, '0과 1 사이의 분수');
    }
  },

  // ── 무리수 √2 ─────────────────────────────────────────
  { id:'ch1_05',
    enter:function(E){ this.s={dig:3,t:0,auto:false}; E.NL.range(1,2); E.big(null); E.setOn([]); },
    tap:function(E){ var s=this.s; if(s.dig>=ROOT2.length){ s.dig=3; s.auto=false; E.blip(340,0.12); } else { s.dig++; s.auto=false; E.blip(500+s.dig*24,0.12); } },
    back:function(E){ E.NL.step(); E.NL.draw({integers:true}); },
    draw:function(E){ var ctx=E.ctx, s=this.s;
      // 단위 정사각형 + 대각선
      var side=Math.min(130,E.H*0.18), ox=E.W/2-side/2, oy=E.H*0.33;
      ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.lineWidth=2; ctx.strokeRect(ox,oy,side,side);
      ctx.strokeStyle=E.COL.accent; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(ox,oy+side); ctx.lineTo(ox+side,oy); ctx.stroke();
      ctx.fillStyle=E.COL.txt; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('1', ox+side/2, oy+side+18); ctx.fillText('1', ox-14, oy+side/2);
      ctx.fillStyle=E.COL.accent; ctx.font='600 16px sans-serif'; ctx.fillText('√2', ox+side/2+18, oy+side/2-6);
      // 수직선 위 √2 위치 (1.4142)
      var v=1.41421356; E.NL.marker(v, E.COL.accent, null);
      ctx.fillStyle=E.COL.txt; ctx.font='13px sans-serif'; ctx.fillText('1.4', E.NL.px(1.4), E.NL.yy()+26); ctx.fillText('1.5', E.NL.px(1.5), E.NL.yy()+26);
      // 자릿수: D=한 자리씩, S=자동
      if(s.auto){ s.t++; if(s.t%14===0 && s.dig<ROOT2.length) s.dig++; if(s.dig>=ROOT2.length) s.auto=false; }
      var doneAll=s.dig>=ROOT2.length;
      E.tapHint(E.W/2, E.NL.yy()+58, doneAll?'↻ 처음부터 (D)':'▶ 다음 자리 D · 자동 S', !doneAll);
      E.big('√2 = '+ROOT2.slice(0,s.dig)+'<span style="color:#6f6e7a">…</span>', '분수로는 못 쓰는 수');
    }
  },

  // ── 실수 (완성 + 분류) ────────────────────────────────
  { id:'ch1_06',
    enter:function(E){ this.s={t:0}; E.NL.range(-5,5); E.big(null);
      this.edges=[[0,1],[0,2],[1,3],[1,4],[3,5],[2,6]]; this.layout(E); },
    layout:function(E){
      var cx=E.W/2, top=E.H*0.26, vg=Math.min(90,E.H*0.10), gap=Math.min(150,E.W*0.18), L=[];
      this.nodes=[
        {x:cx, y:top, t:'실수', c:E.COL.accent},
        {x:cx-gap, y:top+vg, t:'유리수', c:E.COL.blue},
        {x:cx+gap, y:top+vg, t:'무리수', c:E.COL.pink},
        {x:cx-gap*1.6, y:top+vg*2, t:'정수', c:E.COL.blue},
        {x:cx-gap*0.5, y:top+vg*2, t:'분수', c:E.COL.blue},
        {x:cx-gap*1.6, y:top+vg*3, t:'자연수', c:E.COL.green},
        {x:cx+gap, y:top+vg*2, t:'√2, π …', c:E.COL.pink}
      ];
      for(var i=0;i<this.nodes.length;i++) L.push({x:this.nodes[i].x, y:this.nodes[i].y, r:9, col:this.nodes[i].c});
      E.setOn(L);
    },
    back:function(E){ var ctx=E.ctx;
      // 채워진 실수선 (연속 강조)
      var y=E.H*0.80; ctx.strokeStyle='rgba(255,178,122,0.35)'; ctx.lineWidth=8; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(70,y); ctx.lineTo(E.W-50,y); ctx.stroke();
      ctx.strokeStyle=E.COL.faint; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(60,y); ctx.lineTo(E.W-40,y); ctx.stroke();
      ctx.fillStyle=E.COL.txt; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('모든 점이 실수 (빈틈 없음)', E.W/2, y+28);
    },
    draw:function(E){ var ctx=E.ctx, N=this.nodes, ED=this.edges; if(!N) return;
      ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1.5;
      for(var e=0;e<ED.length;e++){ var a=N[ED[e][0]], b=N[ED[e][1]]; ctx.beginPath(); ctx.moveTo(a.x,a.y+30); ctx.lineTo(b.x,b.y-12); ctx.stroke(); }
      ctx.textAlign='center'; ctx.font='600 15px sans-serif';
      for(var i=0;i<N.length;i++){ ctx.fillStyle=N[i].c; ctx.fillText(N[i].t, N[i].x, N[i].y+30); }
    }
  },

  // ══════════ 1.2 실수의 연산과 대소 ══════════
  { id:'ch1_07',
    enter:function(E){ this.s={a:2,b:3}; E.NL.range(-10,10); E.big(null);
      E.controls('<div class="ctrl"><label>a</label><input type="range" id="sa" min="-8" max="8" step="1" value="2"><output id="oa">2</output><label style="margin-left:16px">b</label><input type="range" id="sb" min="-8" max="8" step="1" value="3"><output id="ob">3</output></div>');
      var self=this; E.bind('#sa','input',function(e){ self.s.a=+e.target.value; document.getElementById('oa').textContent=e.target.value; E.blip(440+self.s.a*20,0.1); });
      E.bind('#sb','input',function(e){ self.s.b=+e.target.value; document.getElementById('ob').textContent=e.target.value; E.blip(440+self.s.b*20,0.1); });
      E.setOn([]); },
    back:function(E){ E.NL.step(); E.NL.draw(); },
    draw:function(E){ var s=this.s, ctx=E.ctx, y=E.NL.yy(), x1=E.NL.px(s.a), x2=E.NL.px(s.a+s.b);
      ctx.fillStyle='rgba(230,228,220,0.55)'; ctx.beginPath(); ctx.arc(x1,y,7,0,7); ctx.fill();
      var col=s.b>=0?E.COL.blue:E.COL.pink, mid=(x1+x2)/2, r=Math.abs(x2-x1)/2;
      if(r>1){ ctx.strokeStyle=col; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(mid,y,r,Math.PI,0,false); ctx.stroke();
        var dir=(s.b>=0?1:-1); ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(x2,y); ctx.lineTo(x2-9*dir,y-6); ctx.lineTo(x2-9*dir,y+6); ctx.fill(); }
      E.NL.marker(s.a+s.b, E.COL.accent, s.a+s.b);
      E.big(s.a+' '+(s.b>=0?'+ '+s.b:'− '+(-s.b))+' = '+(s.a+s.b), '수직선 위의 이동');
    }
  },

  { id:'ch1_08',
    enter:function(E){ this.s={}; E.NL.range(-7,7); E.big(null); E.setOn([]);
      E.quiz({q:'−5 와 −3, 어느 쪽이 더 클까요?', choices:['−5','−3','같다'], answer:1, explain:'−3이 수직선에서 더 오른쪽 → 더 큽니다.'}); },
    back:function(E){ E.NL.step(); E.NL.draw(); },
    draw:function(E){ var ctx=E.ctx,y=E.NL.yy(); E.NL.dot(-5,E.COL.pink,8); E.NL.dot(-3,E.COL.blue,8);
      ctx.font='600 16px sans-serif'; ctx.textAlign='center';
      ctx.fillStyle=E.COL.pink; ctx.fillText('−5',E.NL.px(-5),y-22);
      ctx.fillStyle=E.COL.blue; ctx.fillText('−3',E.NL.px(-3),y-22); }
  },

  // ══════════ 1.3 정수 ══════════
  { id:'ch1_09',
    enter:function(E){ this.s={n:12}; E.NL.range(0,13); E.big(null);
      E.controls('<div class="ctrl"><label>n</label><input type="range" id="sn" min="1" max="12" step="1" value="12"><output id="on">12</output></div>');
      var self=this; E.bind('#sn','input',function(e){ self.s.n=+e.target.value; document.getElementById('on').textContent=e.target.value; E.blip(300+self.s.n*30,0.12); });
      E.setOn([]); },
    back:function(E){ E.NL.step(); E.NL.draw({integers:true}); },
    draw:function(E){ var s=this.s, ctx=E.ctx, y=E.NL.yy(), divs=[];
      for(var k=1;k<=s.n;k++){ var isd=(s.n%k===0), x=E.NL.px(k);
        ctx.fillStyle=isd?E.COL.accent:'rgba(230,228,220,0.22)'; ctx.beginPath(); ctx.arc(x,y,isd?7:3.5,0,7); ctx.fill();
        if(isd) divs.push(k); }
      E.big(divs.join('  ·  '), s.n+'의 약수 ('+divs.length+'개)'); }
  },

  { id:'ch1_10',
    enter:function(E){ this.s={t:0,tgt:0,auto:false}; E.setOn([]);
      E.quiz({q:'다음 중 소수가 아닌 것은?', choices:['7','13','21','17'], answer:2, explain:'21 = 3 × 7 이라 소수가 아닙니다.'}); },
    tap:function(E){ var s=this.s, PH=66, END=PH*4+50, B=[0,26,PH+26,2*PH+26,3*PH+26,END];   // 설명 단위: 2·3·5·7 배수 삭제 완료 시점 → 소수 확정
      if(s.t>=END-0.5){ s.t=0; s.tgt=0; s.auto=false; E.blip(340,0.12); return; }
      var base=Math.max(s.t,s.tgt||0), nb=END; for(var i=0;i<B.length;i++){ if(B[i]>base+0.5){ nb=B[i]; break; } }
      s.tgt=nb; s.auto=false; E.blip(520,0.14); },
    draw:function(E){ var ctx=E.ctx, s=this.s, PH=66, PR=[2,3,5,7], PIDX={2:0,3:1,5:2,7:3}, END=PH*4+50;
      var tgt=s.auto?END:(s.tgt||0); if(s.t<tgt) s.t=Math.min(tgt,s.t+2); if(s.auto&&s.t>=END){ s.t=END; s.auto=false; }
      var cols=8, n0=2, N=49, cell=Math.min(52,(E.W-120)/cols), gw=cols*cell, ox=E.W/2-gw/2, oy=E.H*0.24;
      function spf(v){ for(var i=0;i<4;i++){ var p=PR[i]; if(v%p===0 && v!==p) return p; } return 0; }
      var curPhase=Math.floor(s.t/PH), pc=0;
      for(var v=n0;v<=N;v++){ var i2=v-n0, r=Math.floor(i2/cols), c=i2%cols, x=ox+c*cell, y=oy+r*cell;
        var sf=spf(v), d=0; if(sf>0) d=Math.max(0,Math.min(1,(s.t-PIDX[sf]*PH)/26));
        if(d<0.5) pc++;
        var R=Math.round(255+(120-255)*d), G=Math.round(178+(118-178)*d), B=Math.round(122+(110-122)*d);
        ctx.fillStyle='rgba('+R+','+G+','+B+','+(0.20-0.165*d)+')'; ctx.strokeStyle='rgba('+R+','+G+','+B+','+(0.9-0.72*d)+')'; ctx.lineWidth=1.5;
        ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(x+4,y+4,cell-8,cell-8,6); else ctx.rect(x+4,y+4,cell-8,cell-8); ctx.fill(); ctx.stroke();
        ctx.fillStyle='rgba('+R+','+G+','+B+','+(1-0.72*d)+')'; ctx.font='600 15px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(v,x+cell/2,y+cell/2);
        if(d>0.5){ ctx.strokeStyle='rgba(226,75,74,'+((d-0.5)*2*0.55)+')'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x+9,y+9); ctx.lineTo(x+cell-9,y+cell-9); ctx.stroke(); } }
      ctx.textBaseline='alphabetic';
      var gy=oy+6*cell+34;
      if(s.t>=END) E.tapHint(E.W/2, gy, '↻ 처음부터 (D)', false);
      else if(!s.auto) E.tapHint(E.W/2, gy, s.t<=0?'▶ 다음 단계 D · 자동 S':'▶ 다음 단계 (D)', true);
      var ttl = (s.t<=0)?'에라토스테네스의 체' : (s.t>=END?'소수 '+pc+'개' : (curPhase<4?PR[curPhase]+'의 배수 삭제':'소수 확정!'));
      E.big(ttl, (s.t>=END)?'남은 주황색이 소수 (2~49)':(s.t<=0?'모두 주황색 — D로 한 단계씩':'배수가 어두워집니다')); }
  },

  // ══════════ 1.4 제곱근 ══════════
  { id:'ch1_11',
    enter:function(E){ this.s={A:9}; E.big(null);
      E.controls('<div class="ctrl"><label>넓이 a</label><input type="range" id="sA" min="1" max="25" step="1" value="9"><output id="oA">9</output></div>');
      var self=this; E.bind('#sA','input',function(e){ self.s.A=+e.target.value; document.getElementById('oA').textContent=e.target.value; E.blip(280+self.s.A*14,0.12); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, ctx=E.ctx, side=Math.sqrt(s.A);
      var unit=Math.min(44,(E.H*0.40)/5), px=side*unit, cx=E.W/2, cy=E.H*0.56, ox=cx-px/2, oy=cy-px/2;
      ctx.fillStyle='rgba(255,178,122,0.14)'; ctx.strokeStyle=E.COL.accent; ctx.lineWidth=2.5;
      ctx.fillRect(ox,oy,px,px); ctx.strokeRect(ox,oy,px,px);
      ctx.fillStyle=E.COL.txt; ctx.font='14px sans-serif'; ctx.textAlign='center'; ctx.fillText('넓이 = '+s.A, cx, oy-14);
      ctx.fillStyle=E.COL.accent; ctx.font='600 15px sans-serif'; ctx.fillText('한 변 = √'+s.A+' = '+side.toFixed(3), cx, oy+px+24);
      E.big('√'+s.A, '정사각형 한 변의 길이'); }
  },

  { id:'ch1_12',
    enter:function(E){ this.s={}; E.setOn([]); E.big('√8 = √(4×2) = 2√2', '완전제곱수 4를 밖으로');
      E.quiz({q:'√18 을 간단히 하면?', choices:['2√3','3√2','√6','9√2'], answer:1, explain:'18 = 9 × 2, √9 = 3 → 3√2'}); },
    draw:function(E){}
  }

  ];

  if(window.Engine) window.Engine.addScenes(scenes);
})();
