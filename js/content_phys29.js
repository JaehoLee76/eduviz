/* 물리학 「입자물리와 표준모형」 — 만물의 가장 작은 부품과 네 가지 힘. 우주론(앞)의 빅뱅 첫 순간으로 연결.
   기본입자·쿼크와 강입자·네 힘·반물질 쌍소멸·우주 입자사. 가장 큰 우주에서 가장 작은 입자로.
   골든룰: 쿼크 전하합·쌍소멸 에너지 2mc²·힘의 상대세기(실측 차수) 모두 식·데이터에서 계산.
   동작=이 파일, 텍스트=content/phys29.json. */
(function(){
  var GRN='#5fd6a8', BLU='#7ab8ff', ORA='#ffb27a', PNK='#f4a0c0', DIM='#9b99a3', RED='#ff7a6b';
  function arrow(E,x1,y1,x2,y2,col,lw){ var ctx=E.ctx; ctx.strokeStyle=col; ctx.lineWidth=lw||2;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    if(Math.hypot(x2-x1,y2-y1)<3) return; var a=Math.atan2(y2-y1,x2-x1); ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(x2,y2);
    ctx.lineTo(x2-8*Math.cos(a-0.45),y2-8*Math.sin(a-0.45)); ctx.lineTo(x2-8*Math.cos(a+0.45),y2-8*Math.sin(a+0.45)); ctx.fill(); }

  var scenes=[

  // ══════════ 1. 표준모형 — 만물의 부품 목록 ══════════
  { id:'phys29_01',
    enter:function(E){ var self=this; this.s={gen:1};
      E.controls('<div class="ctrl"><label>세대 강조 (1~3)</label><input type="range" id="gg" min="1" max="3" step="1" value="1"><output id="ggo">1</output></div>');
      E.bind('#gg','input',function(e){ self.s.gen=+e.target.value; document.getElementById('ggo').textContent=e.target.value; E.blip(300+self.s.gen*80,0.06); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      // 쿼크 6(u d / c s / t b), 렙톤 6(e νe / μ νμ / τ ντ), 보손
      var quarks=[['u','+⅔'],['c','+⅔'],['t','+⅔'],['d','−⅓'],['s','−⅓'],['b','−⅓']];
      var leptons=[['e','−1'],['μ','−1'],['τ','−1'],['νe','0'],['νμ','0'],['ντ','0']];
      var ox=W*0.14, oy=H*0.22, cw=W*0.10, ch=H*0.13;
      function cell(c,r,sym,q,col,gen){ var x=ox+c*cw, y=oy+r*ch; var hot=(gen===s.gen);
        ctx.fillStyle=hot?col:'rgba(255,255,255,0.05)'; ctx.globalAlpha=hot?0.85:0.5; ctx.fillRect(x,y,cw-6,ch-6); ctx.globalAlpha=1;
        ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.strokeRect(x,y,cw-6,ch-6);
        ctx.fillStyle='#fff'; ctx.font='600 16px sans-serif'; ctx.textAlign='center'; ctx.fillText(sym,x+(cw-6)/2,y+(ch-6)/2);
        ctx.fillStyle=hot?'#10141a':DIM; ctx.font='12px sans-serif'; ctx.fillText(q,x+(cw-6)/2,y+(ch-6)-6); }
      // 쿼크 2행(위 u c t / 아래 d s b)
      for(var i=0;i<3;i++){ cell(i,0,quarks[i][0],quarks[i][1],ORA,i+1); cell(i,1,quarks[i+3][0],quarks[i+3][1],ORA,i+1); }
      // 렙톤 2행
      for(var j=0;j<3;j++){ cell(j,2.2,leptons[j][0],leptons[j][1],GRN,j+1); cell(j,3.2,leptons[j+3][0],leptons[j+3][1],GRN,j+1); }
      ctx.fillStyle=ORA; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('쿼크 6 (강력 느낌)', ox+cw*3+10, oy+ch*0.6);
      ctx.fillStyle=GRN; ctx.fillText('렙톤 6 (전자·중성미자)', ox+cw*3+10, oy+ch*2.8);
      // 보손(힘 매개)
      var bos=[['γ','광자'],['g','글루온'],['W/Z','약력'],['H','힉스']]; for(var b=0;b<4;b++){ var bx=ox+b*cw, by=oy+ch*4.5; ctx.fillStyle='rgba(122,184,255,0.7)'; ctx.fillRect(bx,by,cw-6,ch*0.7); ctx.fillStyle='#10141a'; ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.fillText(bos[b][0],bx+(cw-6)/2,by+ch*0.3); ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.fillText(bos[b][1],bx+(cw-6)/2,by+ch*0.55); }
      ctx.fillStyle=BLU; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('보손 (힘 매개 입자)', ox+cw*4+10, oy+ch*4.8);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('표준모형: 물질=쿼크·렙톤(각 3세대) + 힘=보손. 우리 몸은 1세대(u,d,e)뿐', W/2, H*0.92);
      E.tapHint(W/2, H*0.97, '3세대 중 1세대(u·d·e)가 일상 물질을 이룹니다', true);
      E.big('표준모형 — 만물의 부품 (쿼크·렙톤·보손)', '우주의 모든 물질과 힘의 부품 목록.'); }
  },

  // ══════════ 2. 쿼크와 강입자 — 양성자는 uud ══════════
  { id:'phys29_02',
    enter:function(E){ var self=this; this.s={combo:0};
      E.controls('<div class="ctrl"><label>쿼크 조합</label><input type="range" id="cc" min="0" max="3" step="1" value="0"><output id="cco">양성자</output></div>');
      E.bind('#cc','input',function(e){ self.s.combo=+e.target.value; E.blip(360,0.06); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var combos=[['양성자 (uud)',['u','u','d'],'+1'],['중성자 (udd)',['u','d','d'],'0'],['π⁺ 중간자 (u d̄)',['u','d̄'],'+1'],['Δ⁺⁺ (uuu)',['u','u','u'],'+2']];
      var C=combos[s.combo]; document.getElementById('cco').textContent=C[0].split(' ')[0];
      var qch={'u':2/3,'d':-1/3,'d̄':1/3};
      var cx=W*0.40, cy=H*0.42, R=Math.min(W*0.11,H*0.16);
      // 강입자(원) 안에 쿼크들
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(cx,cy,R+24,0,7); ctx.stroke();
      var n=C[1].length, sum=0;
      for(var i=0;i<n;i++){ var th=i/n*6.2832-1.57, qx=cx+Math.cos(th)*R*0.6, qy=cy+Math.sin(th)*R*0.6; var q=C[1][i]; var ch=qch[q]; sum+=ch;
        ctx.fillStyle=q.indexOf('̄')>=0?BLU:ORA; ctx.beginPath(); ctx.arc(qx,qy,20,0,7); ctx.fill();
        ctx.fillStyle='#10141a'; ctx.font='600 16px sans-serif'; ctx.textAlign='center'; ctx.fillText(q,qx,qy-2); ctx.font='12px sans-serif'; ctx.fillText((ch>0?'+':'')+(ch===2/3?'⅔':ch===-1/3?'−⅓':'+⅓'),qx,qy+12);
        // 글루온(연결)
        if(i>0){ ctx.strokeStyle='rgba(143,227,181,0.4)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(cx+Math.cos(i/n*6.2832-1.57-6.28/n)*R*0.6,cy+Math.sin(i/n*6.2832-1.57-6.28/n)*R*0.6); ctx.lineTo(qx,qy); ctx.stroke(); }
      }
      ctx.fillStyle='#dfeefb'; ctx.font='600 16px sans-serif'; ctx.textAlign='center';
      ctx.fillText(C[0]+' → 총 전하 = '+(Math.round(sum)>=0?'+':'')+Math.round(sum), W/2, H*0.72);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('쿼크(u=+⅔, d=−⅓)들이 글루온(강력)으로 묶여 양성자·중성자를 이룸 — 전하는 합', W/2, H*0.80);
      ctx.fillText('쿼크는 홀로 못 존재(가둠) · 3개=중입자, 쿼크+반쿼크=중간자', W/2, H*0.87);
      E.tapHint(W/2, H*0.93, '쿼크 조합을 바꿔 양성자(+1)·중성자(0)의 전하를 확인하세요', true);
      E.big('쿼크 — 양성자(uud)=+1, 중성자(udd)=0', '양성자·중성자도 더 작은 쿼크로.'); }
  },

  // ══════════ 3. 네 가지 기본 힘 ══════════
  { id:'phys29_03',
    enter:function(E){ var self=this; this.s={sel:0};
      E.controls('<div class="ctrl"><label>힘 선택</label><input type="range" id="ss" min="0" max="3" step="1" value="0"><output id="sso">강력</output></div>');
      E.bind('#ss','input',function(e){ self.s.sel=+e.target.value; E.blip(360,0.06); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      // 상대 세기(실측 차수, 강력=1 기준), 범위, 매개입자
      var forces=[['강력','글루온','1','핵자 크기(10⁻¹⁵m)','쿼크를 묶음·핵 결합',ORA],
        ['전자기력','광자','1/137','무한대','원자·화학·빛',BLU],
        ['약력','W/Z 보손','10⁻⁶','10⁻¹⁸m','방사성 붕괴·핵융합',GRN],
        ['중력','중력자(미발견)','10⁻³⁹','무한대','별·은하·우주',PNK]];
      document.getElementById('sso').textContent=forces[s.sel][0];
      var ox=W*0.10, oy=H*0.22, rh=H*0.15;
      forces.forEach(function(F,i){ var y=oy+i*rh, hot=(i===s.sel);
        ctx.globalAlpha=hot?1:0.5;
        ctx.fillStyle=F[5]; ctx.fillRect(ox,y,W*0.04,rh*0.7);
        ctx.fillStyle='#fff'; ctx.font='600 15px sans-serif'; ctx.textAlign='left'; ctx.fillText(F[0]+' ('+F[1]+')',ox+W*0.06,y+18);
        // 상대 세기 막대(로그 차수를 압축해 강력>전자기>약력>중력 차이가 보이게)
        var logS=[0,-2.14,-6,-39][i], bw=Math.pow((40+logS)/40,2.4)*W*0.52; ctx.fillStyle=F[5]; ctx.fillRect(ox+W*0.06,y+26,Math.max(3,bw),12);
        ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.fillText('상대세기 '+F[2]+'  ·  범위 '+F[3],ox+W*0.06,y+rh*0.7+4);
        ctx.globalAlpha=1;
      });
      ctx.fillStyle='#dfeefb'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('선택: '+forces[s.sel][0]+' — '+forces[s.sel][4], W/2, H*0.86);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('강력이 가장 세지만 짧고, 중력은 10⁻³⁹로 약하지만 무한·누적 → 우주를 지배', W/2, H*0.92);
      E.tapHint(W/2, H*0.97, '네 힘의 세기는 10³⁹배나 차이 납니다 (강력↔중력)', true);
      E.big('네 가지 기본 힘 — 강력·전자기·약력·중력', '우주의 모든 상호작용은 네 힘으로.'); }
  },

  // ══════════ 4. 반물질 — 쌍생성과 쌍소멸 ══════════
  { id:'phys29_04',
    enter:function(E){ var self=this; this.s={t:0,phase:0};
      E.setOn([]); },
    tap:function(E){ this.s.t=0; E.blip(360,0.12); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx; if(!E.frozen)s.t+=1/60;
      var cx=W*0.42, cy=H*0.42, T=(s.t)%4;   // 0~2 접근, 2 소멸, 2~4 광자 퍼짐
      if(T<2){ var d=(1-T/2)*W*0.22;
        // 전자(−)·양전자(+) 접근
        ctx.fillStyle=BLU; ctx.beginPath(); ctx.arc(cx-d,cy,16,0,7); ctx.fill(); ctx.fillStyle='#fff'; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.fillText('e⁻',cx-d,cy+4);
        ctx.fillStyle=RED; ctx.beginPath(); ctx.arc(cx+d,cy,16,0,7); ctx.fill(); ctx.fillStyle='#fff'; ctx.fillText('e⁺',cx+d,cy+4);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('전자 e⁻', cx-d, cy+34); ctx.fillText('양전자 e⁺(반물질)', cx+d, cy+34);
      } else { var r=(T-2)/2*W*0.3;
        // 소멸 섬광 + 두 광자(감마)
        var g=ctx.createRadialGradient(cx,cy,2,cx,cy,40); g.addColorStop(0,'rgba(255,255,255,'+(1-(T-2)/2)+')'); g.addColorStop(1,'rgba(255,245,200,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,40,0,7); ctx.fill();
        ctx.strokeStyle=ORA; ctx.lineWidth=2.5;
        [[-1,0],[1,0]].forEach(function(D){ ctx.beginPath(); for(var w=0;w<24;w++){ var wx=cx+D[0]*(8+w*r/24), wy=cy+Math.sin(w*0.8)*5; if(w===0)ctx.moveTo(wx,wy); else ctx.lineTo(wx,wy); } ctx.stroke(); });
        ctx.fillStyle=ORA; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('광자 γ', cx-r-10, cy-12); ctx.fillText('광자 γ', cx+r+10, cy-12);
      }
      ctx.fillStyle='#dfeefb'; ctx.font='600 14px sans-serif'; ctx.textAlign='center';
      ctx.fillText('물질 + 반물질 → 완전 소멸 → 순수 에너지(광자) E = 2mc²', W/2, H*0.72);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('모든 입자엔 전하만 반대인 반입자가 있다(반물질). 만나면 100% 에너지로(가장 효율적)', W/2, H*0.80);
      ctx.fillText('빅뱅 직후 물질이 반물질보다 10억분의 1 더 많아 — 그 잔여가 지금 우주', W/2, H*0.87);
      E.tapHint(W/2, H*0.93, '전자와 양전자가 만나 광자로 소멸합니다 (화면 탭=다시)', true);
      E.big('반물질 — 만나면 순수 에너지로 (E = 2mc²)', '물질과 반물질이 만나면 빛이 됩니다.'); }
  },

  // ══════════ 5. 빅뱅에서 지금까지 — 입자의 역사 ══════════
  { id:'phys29_05',
    enter:function(E){ var self=this; this.s={t:0.3};
      E.controls('<div class="ctrl"><label>우주 나이(로그)</label><input type="range" id="tt" min="0" max="1" step="0.02" value="0.3"><output id="tto">초기</output></div>');
      E.bind('#tt','input',function(e){ self.s.t=+e.target.value; E.blip(200+self.s.t*600,0.05); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      // 로그 시간축: 빅뱅(10⁻⁴³s)→쿼크→양성자(10⁻⁶s)→핵(3분)→원자(38만년)→별(2억년)→지금(138억년)
      var stages=[['빅뱅·힘 분리','10⁻⁴³ s','#fff'],['쿼크-글루온 플라스마','10⁻⁶ s 전','#ff8a6b'],['양성자·중성자 형성','10⁻⁶ s','#ffb27a'],['가벼운 핵 합성','3분','#ffe06a'],['원자 형성(빛 자유)','38만 년','#8fe3b5'],['별·은하','2억 년','#7ab8ff'],['지금(우리)','138억 년','#b99cff']];
      var idx=Math.min(stages.length-1,Math.floor(s.t*stages.length));
      var gx0=W*0.10, gx1=W*0.90, gy=H*0.42;
      ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(gx0,gy); ctx.lineTo(gx1,gy); ctx.stroke();
      stages.forEach(function(S,i){ var x=gx0+(i/(stages.length-1))*(gx1-gx0); var hot=(i<=idx);
        ctx.fillStyle=hot?S[2]:'rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.arc(x,gy,i===idx?9:5,0,7); ctx.fill();
        ctx.save(); ctx.translate(x,gy); ctx.rotate(-0.5); ctx.fillStyle=hot?S[2]:DIM; ctx.font=(i===idx?'600 ':'')+'13px sans-serif'; ctx.textAlign='left'; ctx.fillText(S[0]+' ('+S[1]+')', 12, -4); ctx.restore();
      });
      // 현재 단계 그림(냉각=색 변화)
      var cur=stages[idx];
      ctx.fillStyle=cur[2]; ctx.font='600 17px sans-serif'; ctx.textAlign='center'; ctx.fillText('▶ '+cur[0]+'  ('+cur[1]+')', W/2, H*0.66);
      // 우주 입자 점들(초기=뜨겁고 빽빽, 후기=식어 구조)
      function hash(i){ var x=Math.sin(i*12.99)*43758.5; return x-Math.floor(x); }
      for(var p=0;p<40;p++){ var sp=(1-s.t)*8+1; var px=W*0.2+hash(p)*W*0.6, py=H*0.72+hash(p+9)*H*0.16; ctx.fillStyle=cur[2]; ctx.globalAlpha=0.3+s.t*0.4; ctx.beginPath(); ctx.arc(px,py,2+(1-s.t)*2,0,7); ctx.fill(); ctx.globalAlpha=1; }
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('우주가 식으며: 순수 에너지 → 쿼크 → 양성자 → 핵 → 원자 → 별 → 생명', W/2, H*0.90);
      E.tapHint(W/2, H*0.95, '우주 나이를 늘리면 입자가 식으며 물질·구조가 차례로 생깁니다', true);
      E.big('빅뱅에서 지금까지 — 입자가 우주를 만들다', '가장 작은 입자가 가장 큰 우주를 빚었습니다.'); }
  }

  ];
  if(window.Engine&&Engine.addScenes) Engine.addScenes(scenes);
})();
