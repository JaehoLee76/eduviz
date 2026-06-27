/* 제22장 일차변환 — 22.1 사상 · 22.2 평면의 일차변환 · 22.3 도형의 상
   동작(behavior)만. 텍스트는 content/ch22.json (range 1.5) */
(function(){
  var D2R=Math.PI/180;
  var TRI=[[0,0],[2,0],[0,1.3]];  // 비대칭 삼각형(변환이 잘 보이게)
  function ap(M,p){ return [M[0][0]*p[0]+M[0][1]*p[1], M[1][0]*p[0]+M[1][1]*p[1]]; }
  function shape(P,ctx,pts,col,fillA){ ctx.strokeStyle=col; ctx.lineWidth=2.5; ctx.fillStyle=fillA||'rgba(122,184,255,0.18)';
    ctx.beginPath(); ctx.moveTo(P.X(pts[0][0]),P.Y(pts[0][1])); for(var i=1;i<pts.length;i++)ctx.lineTo(P.X(pts[i][0]),P.Y(pts[i][1])); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle=col; ctx.beginPath(); ctx.arc(P.X(pts[0][0]),P.Y(pts[0][1]),4,0,7); ctx.fill(); }
  // 도형 무게중심에 이름표
  function tag(P,ctx,pts,col,txt){ var mx=0,my=0; for(var i=0;i<pts.length;i++){mx+=pts[i][0];my+=pts[i][1];} mx/=pts.length; my/=pts.length;
    ctx.fillStyle=col; ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(txt, P.X(mx), P.Y(my)); ctx.textBaseline='alphabetic'; }

  var scenes=[

  // ══════════ 22.1 회전변환 ══════════
  { id:'ch22_01',
    enter:function(E){ this.s={deg:0}; E.Plot.range(-4.5,4.5,-3,3).lab('x','y');
      E.controls('<div class="ctrl"><label>회전각 θ</label><input type="range" id="th" min="0" max="180" step="15" value="0"><output id="tho">0°</output></div>');
      var self=this; E.bind('#th','input',function(e){ self.s.deg=+e.target.value; document.getElementById('tho').textContent=e.target.value+'°'; E.blip(440,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, t=this.s.deg*D2R, ctx=E.ctx; P.axes();
      shape(P,ctx,TRI,'rgba(255,255,255,0.25)','rgba(255,255,255,0.05)');
      tag(P,ctx,TRI,'rgba(255,255,255,0.5)','원래 도형');
      var M=[[Math.cos(t),-Math.sin(t)],[Math.sin(t),Math.cos(t)]];
      var IMG=TRI.map(function(p){return ap(M,p);});
      shape(P,ctx,IMG,'#7ab8ff');
      tag(P,ctx,IMG,'#7ab8ff','상 (×θ회전)');
      E.big('회전변환 [[cos'+this.s.deg+'°, −sin], [sin, cos]]', '원점 둘레로 θ만큼 회전! 10장 복소수 곱(각의 합)과 똑같은 행렬입니다'); }
  },

  // ══════════ 22.2 대칭(반사)변환 ══════════
  { id:'ch22_02',
    enter:function(E){ this.s={mode:0}; E.Plot.range(-4.5,4.5,-3,3).lab('x','y'); E.setOn([]); },
    tap:function(E){ this.s.mode=(this.s.mode+1)%3; E.blip(440+this.s.mode*50,0.15); },
    draw:function(E){ var P=E.Plot, m=this.s.mode, ctx=E.ctx; P.axes();
      var Ms=[[[1,0],[0,-1]], [[-1,0],[0,1]], [[0,1],[1,0]]], labs=['x축 대칭','y축 대칭','y=x 대칭'];
      // 대칭축
      ctx.strokeStyle='rgba(244,160,192,0.6)'; ctx.lineWidth=1.5; ctx.setLineDash([6,4]);
      if(m===0){ ctx.beginPath(); ctx.moveTo(P.X(-4.5),P.Y(0)); ctx.lineTo(P.X(4.5),P.Y(0)); ctx.stroke(); }
      else if(m===1){ ctx.beginPath(); ctx.moveTo(P.X(0),P.Y(-3)); ctx.lineTo(P.X(0),P.Y(3)); ctx.stroke(); }
      else { ctx.beginPath(); ctx.moveTo(P.X(-3),P.Y(-3)); ctx.lineTo(P.X(3),P.Y(3)); ctx.stroke(); } ctx.setLineDash([]);
      shape(P,ctx,TRI,'rgba(255,255,255,0.25)','rgba(255,255,255,0.05)');
      tag(P,ctx,TRI,'rgba(255,255,255,0.5)','원래 도형');
      var IMG=TRI.map(function(p){return ap(Ms[m],p);});
      shape(P,ctx,IMG,'#8fe3b5','rgba(143,227,181,0.2)');
      tag(P,ctx,IMG,'#8fe3b5','상');
      E.tapHint(E.W/2, P.geom().bot+40, '▶ x축 / y축 / y=x 대칭', true);
      E.big('대칭변환 — '+labs[m], '거울에 비춘 상! 분홍 점선이 대칭축. 도형이 뒤집힙니다(det = −1)'); }
  },

  // ══════════ 22.2 확대·축소 ══════════
  { id:'ch22_03',
    enter:function(E){ this.s={s:1.5}; E.Plot.range(-4.5,4.5,-3,3).lab('x','y');
      E.controls('<div class="ctrl"><label>배율 k</label><input type="range" id="sk" min="0.5" max="2" step="0.25" value="1.5"><output id="sko">1.5</output></div>');
      var self=this; E.bind('#sk','input',function(e){ self.s.s=+e.target.value; document.getElementById('sko').textContent=(+e.target.value); E.blip(440,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, k=this.s.s, ctx=E.ctx; P.axes();
      shape(P,ctx,TRI,'rgba(255,255,255,0.25)','rgba(255,255,255,0.05)');
      tag(P,ctx,TRI,'rgba(255,255,255,0.5)','원래 도형');
      var IMG=TRI.map(function(p){return [k*p[0],k*p[1]];});
      shape(P,ctx,IMG,'#ffb27a','rgba(255,178,122,0.2)');
      tag(P,ctx,IMG,'#ffb27a','상 (×'+k+')');
      // 넓이비 = 행렬식 = k² (실측)
      var detV=k*k;
      ctx.fillStyle='#cfcdc6'; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('넓이비 = det = k² = '+detV.toFixed(2)+'배', P.X(0), P.geom().bot+22);
      E.big('확대변환 [[k,0],[0,k]],  k = '+k, '원점 기준 k배 확대(축소). 넓이는 k² 배 (행렬식 = k²)'); }
  },

  // ══════════ 22.3 합성변환 ══════════
  { id:'ch22_04',
    enter:function(E){ this.s={order:0}; E.Plot.range(-4.5,4.5,-3,3).lab('x','y'); E.setOn([]); },
    tap:function(E){ this.s.order=(this.s.order+1)%2; E.blip(this.s.order?520:420,0.15); },
    draw:function(E){ var P=E.Plot, o=this.s.order, ctx=E.ctx; P.axes();
      var R=[[0,-1],[1,0]], F=[[1,0],[0,-1]]; // 90°회전, x축대칭
      function mul(A,B){ var C=[[0,0],[0,0]]; for(var i=0;i<2;i++)for(var j=0;j<2;j++)C[i][j]=A[i][0]*B[0][j]+A[i][1]*B[1][j]; return C; }
      var M = o===0? mul(F,R) : mul(R,F);  // 순서 다름
      shape(P,ctx,TRI,'rgba(255,255,255,0.25)','rgba(255,255,255,0.05)');
      tag(P,ctx,TRI,'rgba(255,255,255,0.5)','원래 도형');
      var IMG=TRI.map(function(p){return ap(M,p);}), col=o===0?'#7ab8ff':'#ffb27a';
      shape(P,ctx,IMG, col);
      tag(P,ctx,IMG, col, o===0?'상 (FR)':'상 (RF)');
      E.tapHint(E.W/2, P.geom().bot+40, '▶ 순서 바꾸기 (회전·대칭)', true);
      E.big(o===0?'대칭 ∘ 회전 (회전 먼저)':'회전 ∘ 대칭 (대칭 먼저)', '합성변환 = 행렬 곱! 순서가 바뀌면 결과가 다릅니다 (AB ≠ BA, 21장)'); }
  },

  // ══════════ 22.3 고유벡터 ══════════
  { id:'ch22_05',
    enter:function(E){ this.s={deg:20}; E.Plot.range(-4.5,4.5,-3,3).lab('x','y');
      E.controls('<div class="ctrl"><label>벡터 방향</label><input type="range" id="vd" min="0" max="180" step="5" value="20"><output id="vdo">20°</output></div>');
      var self=this; E.bind('#vd','input',function(e){ self.s.deg=+e.target.value; document.getElementById('vdo').textContent=e.target.value+'°'; E.blip(440,0.08); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, t=this.s.deg*D2R, ctx=E.ctx, M=[[2,1],[1,2]]; P.axes();
      // 고유벡터 방향선 (1,1) & (1,-1)
      ctx.strokeStyle='rgba(255,178,122,0.25)'; ctx.lineWidth=1.5; ctx.setLineDash([5,4]);
      ctx.beginPath(); ctx.moveTo(P.X(-3),P.Y(-3)); ctx.lineTo(P.X(3),P.Y(3)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(P.X(-3),P.Y(3)); ctx.lineTo(P.X(3),P.Y(-3)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='rgba(255,178,122,0.6)'; ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillText('고유축 (1,1) λ=3', P.X(2.1),P.Y(2.6)); ctx.fillText('고유축 (1,−1) λ=1', P.X(2.1),P.Y(-2.4));
      var v=[Math.cos(t),Math.sin(t)], Mv=ap(M,v);   // v는 단위벡터(축소 없이 Mv를 실제 배율로)
      function arr(p,col,lab){ ctx.strokeStyle=col; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(P.X(0),P.Y(0)); ctx.lineTo(P.X(p[0]),P.Y(p[1])); ctx.stroke(); var a=Math.atan2(P.Y(p[1])-P.Y(0),P.X(p[0])-P.X(0)); ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(P.X(p[0]),P.Y(p[1])); ctx.lineTo(P.X(p[0])-12*Math.cos(a-0.4),P.Y(p[1])-12*Math.sin(a-0.4)); ctx.lineTo(P.X(p[0])-12*Math.cos(a+0.4),P.Y(p[1])-12*Math.sin(a+0.4)); ctx.fill(); if(lab){ctx.font='600 13px sans-serif';ctx.textAlign='left';ctx.fillText(lab,P.X(p[0])+6,P.Y(p[1]));} }
      // 정렬 판정(고유벡터 근처) + 고유값 실계산
      var cross=v[0]*Mv[1]-v[1]*Mv[0], aligned=Math.abs(cross)<0.06;
      var dot=v[0]*Mv[0]+v[1]*Mv[1], lam=dot;   // |v|=1 이므로 λ = (Mv·v) = 정렬 시 배율
      arr(v,'#7ab8ff','v'); arr(Mv,'#8fe3b5', aligned? 'Mv (×'+lam.toFixed(1)+')' : 'Mv');
      ctx.fillStyle='#cfcdc6'; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('Mv·v / |v|² = '+lam.toFixed(2)+(aligned?'  =  고유값 λ':''), P.X(0), P.geom().bot+22);
      E.big(aligned?'★ 고유벡터! Mv = λv,  λ = '+lam.toFixed(1):'Mv가 v에서 방향이 틀어집니다', aligned?'변환해도 방향이 안 변하는 특별한 축 = 고유벡터. 여기선 45°→λ=3, 135°→λ=1':'45°(또는 135°)로 맞춰 고유벡터를 찾아보세요'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
