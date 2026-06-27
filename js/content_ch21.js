/* 제21장 행렬 — 21.1 연산 · 21.2 행렬식 · 21.3 연립방정식 · 21.4 넓이
   동작(behavior)만. 텍스트는 content/ch21.json */
(function(){
  // 2x2 행렬 괄호 그리기
  function mat(ctx,x,y,v,col){ var cw=42, rh=34, w=cw*2, h=rh*2;
    ctx.strokeStyle=col||'#cfcdc6'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(x+8,y); ctx.lineTo(x,y); ctx.lineTo(x,y+h); ctx.lineTo(x+8,y+h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x+w-8,y); ctx.lineTo(x+w,y); ctx.lineTo(x+w,y+h); ctx.lineTo(x+w-8,y+h); ctx.stroke();
    ctx.fillStyle=col||'#f4f3ee'; ctx.font='600 18px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    for(var r=0;r<2;r++)for(var c=0;c<2;c++) ctx.fillText(v[r][c], x+cw/2+c*cw+8, y+rh/2+r*rh);
    ctx.textBaseline='alphabetic'; return w; }

  var scenes=[

  // ══════════ 21.1 행렬과 연산 ══════════
  { id:'ch21_01',
    enter:function(E){ this.s={k:2}; E.setOn([]);
      E.controls('<div class="ctrl"><label>실수배 k</label><input type="range" id="kk" min="0" max="3" step="1" value="2"><output id="kko">2</output></div>');
      var self=this; E.bind('#kk','input',function(e){ self.s.k=+e.target.value; document.getElementById('kko').textContent=e.target.value; E.blip(440,0.1); }); },
    draw:function(E){ var ctx=E.ctx, k=this.s.k, A=[[1,2],[3,0]], y=E.H*0.40, cx=E.W/2;
      ctx.fillStyle='#9b99a3'; ctx.font='600 24px sans-serif'; ctx.textAlign='center';
      mat(ctx, cx-200, y, A, '#7ab8ff');
      ctx.fillStyle='#cfcdc6'; ctx.fillText(k+' ×', cx-118, y+38);
      var KA=[[k*1,k*2],[k*3,k*0]]; mat(ctx, cx-80, y, A, '#7ab8ff');
      ctx.fillText('=', cx+20, y+38);
      mat(ctx, cx+50, y, KA, '#ffb27a');
      E.big('행렬의 실수배', '행렬 = 수를 직사각형으로 배열한 것. 덧셈·실수배는 같은 자리끼리 (성분별)'); }
  },

  // ══════════ 21.2 행렬 곱셈 ══════════
  { id:'ch21_02',
    enter:function(E){ this.s={step:0}; E.setOn([]); },   // step 0..4 : 0=처음, 1~4=칸 (1,1)→(1,2)→(2,1)→(2,2)
    tap:function(E){ this.s.step=(this.s.step+1)%5; E.blip(440+this.s.step*40,0.12); },
    draw:function(E){ var ctx=E.ctx, A=[[1,2],[3,1]], B=[[2,0],[1,2]], y=E.H*0.34, cx=E.W/2, st=this.s.step;
      // 결과행렬: 채워진 칸만(step 순서대로) 실계산, 나머지는 빈칸
      var cells=[[0,0],[0,1],[1,0],[1,1]];  // 순회 순서 (1,1)(1,2)(2,1)(2,2)
      var done=st; // 채워진 칸 수
      var C=[['·','·'],['·','·']];
      for(var d=0;d<done;d++){ var ci=cells[d][0], cj=cells[d][1]; C[ci][cj]=A[ci][0]*B[0][cj]+A[ci][1]*B[1][cj]; }
      // 현재 활성 칸 (step 1~4 → cells[step-1])
      var act = st>=1 ? cells[st-1] : null;
      var axA=cx-230, axB=cx-100, axC=cx+50, cw=42, rh=34;
      // 행렬 그리기(활성 행/열 하이라이트)
      mat(ctx, axA, y, A, '#7ab8ff'); ctx.fillStyle='#cfcdc6'; ctx.font='600 22px sans-serif'; ctx.textAlign='center'; ctx.fillText('×', cx-130, y+38);
      mat(ctx, axB, y, B, '#8fe3b5'); ctx.fillText('=', cx+5, y+38);
      mat(ctx, axC, y, C, '#ffb27a');
      if(act){ var ri=act[0], cj2=act[1];
        // A의 활성 행
        ctx.fillStyle='rgba(255,178,122,0.18)'; ctx.fillRect(axA+8, y+ri*rh, cw*2, rh);
        // B의 활성 열
        ctx.fillStyle='rgba(255,178,122,0.18)'; ctx.fillRect(axB+8+cj2*cw, y, cw, rh*2);
        // C의 활성 칸
        ctx.strokeStyle='#ffb27a'; ctx.lineWidth=2; ctx.strokeRect(axC+8+cj2*cw, y+ri*rh, cw, rh);
        // 행렬 텍스트가 하이라이트에 가리지 않게 다시
        mat(ctx, axA, y, A, '#7ab8ff'); mat(ctx, axB, y, B, '#8fe3b5'); mat(ctx, axC, y, C, '#ffb27a');
        // 내적 식 실시간 표시
        var p0=A[ri][0]*B[0][cj2], p1=A[ri][1]*B[1][cj2], val=p0+p1;
        ctx.fillStyle='#ffb27a'; ctx.font='600 16px sans-serif'; ctx.textAlign='center';
        ctx.fillText('C['+(ri+1)+','+(cj2+1)+'] = ('+(ri+1)+'행)·('+(cj2+1)+'열)', cx, y+120);
        ctx.fillText('= '+A[ri][0]+'·'+B[0][cj2]+' + '+A[ri][1]+'·'+B[1][cj2]+' = '+p0+' + '+p1+' = '+val, cx, y+146); }
      else { ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.textAlign='center';
        ctx.fillText('행 × 열 의 내적으로 각 칸을 차례로 채웁니다 (9장 내적!)', cx, y+130); }
      E.tapHint(E.W/2, y+rh*2+80, '▶ 다음 칸 채우기 ('+st+'/4)', true);
      E.big('행렬 곱셈 = 행 · 열 (내적)', '왼쪽 행렬의 행과 오른쪽 행렬의 열을 내적해 각 칸을 차례로 채웁니다. 순서가 바뀌면 결과가 달라집니다(AB≠BA)'); }
  },

  // ══════════ 21.3 행렬 = 선형변환 ══════════
  { id:'ch21_03',
    enter:function(E){ this.s={k:0}; E.Plot.range(-4.5,4.5,-3,3).lab('x','y');
      E.controls('<div class="ctrl"><label>전단 k</label><input type="range" id="kk" min="-1.5" max="1.5" step="0.25" value="0"><output id="kko">0</output></div>');
      var self=this; E.bind('#kk','input',function(e){ self.s.k=+e.target.value; document.getElementById('kko').textContent=(+e.target.value); E.blip(440,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, k=this.s.k, ctx=E.ctx; P.axes();
      // 변환 행렬 [[1,k],[0,1]] 적용한 격자선
      function M(x,y){ return [x+k*y, y]; }
      ctx.strokeStyle='rgba(122,184,255,0.25)'; ctx.lineWidth=1;
      for(var gy=-3;gy<=3;gy++){ ctx.beginPath(); for(var gx=-4;gx<=4;gx+=0.5){ var p=M(gx,gy); if(gx===-4)ctx.moveTo(P.X(p[0]),P.Y(p[1])); else ctx.lineTo(P.X(p[0]),P.Y(p[1])); } ctx.stroke(); }
      for(var gx2=-4;gx2<=4;gx2++){ ctx.beginPath(); for(var gy2=-3;gy2<=3;gy2+=0.5){ var p2=M(gx2,gy2); if(gy2===-3)ctx.moveTo(P.X(p2[0]),P.Y(p2[1])); else ctx.lineTo(P.X(p2[0]),P.Y(p2[1])); } ctx.stroke(); }
      // 변환된 단위정사각형
      var sq=[[0,0],[1,0],[1,1],[0,1]].map(function(p){return M(p[0],p[1]);});
      ctx.fillStyle='rgba(255,178,122,0.3)'; ctx.beginPath(); ctx.moveTo(P.X(sq[0][0]),P.Y(sq[0][1])); for(var i=1;i<4;i++)ctx.lineTo(P.X(sq[i][0]),P.Y(sq[i][1])); ctx.closePath(); ctx.fill();
      // 기저벡터
      function vec(x,y,col){ ctx.strokeStyle=col; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(P.X(0),P.Y(0)); ctx.lineTo(P.X(x),P.Y(y)); ctx.stroke(); }
      var e1=M(1,0), e2=M(0,1); vec(e1[0],e1[1],'#7ab8ff'); vec(e2[0],e2[1],'#8fe3b5');
      E.big('행렬 [[1, '+k+'], [0, 1]] = 전단변환', '행렬은 공간을 바꾸는 변환! 격자가 기웁니다. 기저 e₁→파랑, e₂→초록 (22장 일차변환 예고)'); }
  },

  // ══════════ 21.4 행렬식 = 넓이 배율 ══════════
  { id:'ch21_04',
    enter:function(E){ this.s={a:2,d:1.5}; E.Plot.range(-4.5,4.5,-3,3).lab('x','y');
      E.controls('<div class="ctrl"><label>a (가로배율)</label><input type="range" id="aa" min="-1" max="3" step="0.5" value="2"><output id="aao">2</output><label style="margin-left:14px">d (세로배율)</label><input type="range" id="dd" min="-1" max="2.5" step="0.5" value="1.5"><output id="ddo">1.5</output></div>');
      var self=this;
      E.bind('#aa','input',function(e){ self.s.a=+e.target.value; document.getElementById('aao').textContent=(+e.target.value); E.blip(440,0.1); });
      E.bind('#dd','input',function(e){ self.s.d=+e.target.value; document.getElementById('ddo').textContent=(+e.target.value); E.blip(420,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, a=this.s.a, d=this.s.d, ctx=E.ctx, det=a*d; P.axes();
      // 원래 단위정사각형(옅게)
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1.5; ctx.strokeRect(P.X(0), P.Y(1), P.X(1)-P.X(0), P.Y(0)-P.Y(1));
      // 변환된 사각형 [[a,0],[0,d]]
      var sq=[[0,0],[a,0],[a,d],[0,d]];
      ctx.fillStyle=det<0?'rgba(226,75,74,0.28)':'rgba(143,227,181,0.3)'; ctx.strokeStyle=det<0?'#e24b4a':'#8fe3b5'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(P.X(sq[0][0]),P.Y(sq[0][1])); for(var i=1;i<4;i++)ctx.lineTo(P.X(sq[i][0]),P.Y(sq[i][1])); ctx.closePath(); ctx.fill(); ctx.stroke();
      var note = Math.abs(det)<0.01?'det=0 → 납작하게 붕괴! (역행렬 없음)':det<0?'det<0 → 뒤집힘(거울상) + 넓이 '+Math.abs(det):'넓이가 '+det+'배';
      E.big('det [[a,0],[0,d]] = a·d = '+det.toFixed(2), '행렬식 = 변환의 넓이 배율! 단위정사각형(흰)이 '+Math.abs(det).toFixed(2)+'배 넓이로. '+note); }
  },

  // ══════════ 21.3 연립방정식과 역행렬 ══════════
  { id:'ch21_05',
    enter:function(E){ this.s={}; E.setOn([]);
      E.quiz({q:'행렬식 det=ad−bc 가 0이면 연립방정식의 해는?', choices:['유일','없거나 무수히 많음','항상 0','항상 1'], answer:1, explain:'det=0 → 역행렬 없음 → 두 직선이 평행/일치 → 해 없음 또는 무수히 많음 (3장 #29)'}); },
    draw:function(E){ var P=E.Plot, ctx=E.ctx; E.Plot.range(-1,5,-2,5).lab('x','y'); P.axes();
      // 두 직선의 교점 = 연립방정식 해 (3장 회수)
      P.curve(function(x){return -x+4;},'#7ab8ff');   // x+y=4
      P.curve(function(x){return x-0;},'#8fe3b5');     // x-y=0 → y=x
      ctx.globalAlpha=E.blink(); P.dot(2,2,'#ffb27a','해 (2, 2)'); ctx.globalAlpha=1;
      E.big('Ax = b  →  x = A⁻¹b', '연립방정식을 행렬로! 역행렬 A⁻¹로 한 번에 풉니다. det≠0이면 유일한 해(교점)'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
