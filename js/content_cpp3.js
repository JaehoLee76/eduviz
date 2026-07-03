/* C++ 제3장 — 클래스와 객체 (구조체→클래스 · 멤버변수/함수 · 객체 생성·사용 · 접근제어 · 캡슐화)
   동작(behavior)만. 텍스트=content/cpp3.json. 엔진 js/engine.js 공유. 색: C++=파랑(#5ab4e8).
   골든룰: 화면의 모든 좌표·상태·잔액·검증결과는 draw에서 실제로 계산(가짜·Math.random·Date.now 금지). 진짜 표준 C++. */
(function(){
  var CPB='#5ab4e8', CPD='#8fd0f5', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', PNK='#f4a0c0', DIM='#9b99a3', RED='#f0888a';

  function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function codePanel(E, x, y, w, lines, title, actLine){
    var ctx=E.ctx, lh=16, pad=14, top=y, n=lines.length, ht=n*lh+pad*2+(title?26:0);
    ctx.fillStyle='rgba(255,255,255,0.035)'; ctx.strokeStyle='rgba(90,180,232,0.30)'; ctx.lineWidth=1;
    roundRect(ctx,x,top,w,ht,10); ctx.fill(); ctx.stroke();
    var cy=top+pad+(title?26:0);
    if(title){ ctx.fillStyle=CPB; ctx.font='600 12px sans-serif'; ctx.textAlign='left'; ctx.fillText(title, x+pad, top+pad+12); }
    ctx.font='13px ui-monospace,Menlo,Consolas,monospace'; ctx.textAlign='left';
    for(var i=0;i<n;i++){
      var L=lines[i], t=(typeof L==='string')?L:L.t, hl=(typeof L==='object')?L.hl:null;
      var ty=cy+i*lh+11;
      if(actLine!=null && i===actLine){ ctx.fillStyle='rgba(90,180,232,0.16)'; ctx.fillRect(x+4, cy+i*lh+1, w-8, lh-2); ctx.fillStyle=CPB; ctx.fillRect(x+4, cy+i*lh+1, 3, lh-2); }
      if(hl && t.indexOf(hl)>=0){ var a=t.split(hl), pre=a[0], post=a.slice(1).join(hl);
        ctx.fillStyle=DIM; ctx.fillText(pre, x+pad, ty); var wpre=ctx.measureText(pre).width;
        ctx.fillStyle=CPB; ctx.fillText(hl, x+pad+wpre, ty); var whl=ctx.measureText(hl).width;
        ctx.fillStyle=DIM; ctx.fillText(post, x+pad+wpre+whl, ty);
      } else { ctx.fillStyle=((typeof L==='object'&&L.dim)?DIM:'#dfeaf2'); ctx.fillText(t, x+pad, ty); }
    }
    return top+ht;
  }

  // 작은 셀(상태 테이블 공용)
  function cell(ctx,x,y,w,h,txt,fill,stroke,tcol,fs){
    ctx.fillStyle=fill||'rgba(255,255,255,0.04)'; ctx.fillRect(x,y,w,h);
    ctx.strokeStyle=stroke||'rgba(255,255,255,0.12)'; ctx.lineWidth=1; ctx.strokeRect(x,y,w,h);
    if(txt!=null){ ctx.fillStyle=tcol||'#dfeaf2'; ctx.font=(fs||13)+'px ui-monospace,Menlo,Consolas,monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(''+txt, x+w/2, y+h/2+1); ctx.textBaseline='alphabetic'; }
  }

  var scenes = [

  // ══════════ 1. 구조체 → 클래스 ══════════
  { id:'cpp3_01',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'// C 스타일: struct = 데이터만', dim:true},
        {t:'struct Point { int x, y; };', hl:'struct'},
        {t:'void move(Point* p,int a,int b);', dim:true},
        {t:'', dim:true},
        {t:'// C++ : class = 데이터 + 함수', dim:true},
        {t:'class Point {', hl:'class'},
        {t:'  int x, y;              // 데이터', dim:true},
        {t:'  void move(int a,int b);// 함수', hl:'move'},
        {t:'};', dim:true}
      ];
      var act=[1,5,7][s.step];
      codePanel(E, W*0.04, H*0.13, W*0.46, code, 'struct_to_class.cpp', act);

      // 우측: 데이터와 함수가 한 덩어리로 합쳐지는 그림
      var bx=W*0.58, by=H*0.16, bw=W*0.34;
      ctx.textAlign='left';
      if(s.step===0){
        // C: 데이터 상자 + 함수 상자 분리
        ctx.fillStyle=CPB; ctx.font='600 14px sans-serif'; ctx.fillText('C — 데이터와 함수가 따로', bx, by);
        ctx.fillStyle='rgba(90,180,232,0.10)'; ctx.strokeStyle=CPB; ctx.lineWidth=1.5;
        roundRect(ctx,bx,by+16,bw*0.55,74,8); ctx.fill(); ctx.stroke();
        ctx.fillStyle=CPD; ctx.font='600 12px sans-serif'; ctx.fillText('struct Point', bx+12, by+38);
        ctx.fillStyle='#dfeaf2'; ctx.font='13px ui-monospace,monospace'; ctx.fillText('int x, y', bx+12, by+62);
        ctx.fillStyle='rgba(155,153,163,0.10)'; ctx.strokeStyle=DIM; ctx.lineWidth=1.4;
        roundRect(ctx,bx+bw*0.62,by+16,bw*0.38,74,8); ctx.fill(); ctx.stroke();
        ctx.fillStyle=DIM; ctx.font='600 12px sans-serif'; ctx.fillText('전역 함수', bx+bw*0.62+12, by+38);
        ctx.font='13px ui-monospace,monospace'; ctx.fillText('move(p,..)', bx+bw*0.62+12, by+62);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
        ctx.fillText('함수는 Point를 ‘밖에서’ 포인터로 건드립니다.', bx, by+118);
      } else if(s.step===1){
        // 두 상자가 하나로 합쳐지는 중간
        ctx.fillStyle=CPB; ctx.font='600 14px sans-serif'; ctx.fillText('C++ — 하나의 상자로 합칩니다', bx, by);
        ctx.strokeStyle='rgba(255,211,122,0.9)'; ctx.lineWidth=2; ctx.setLineDash([5,4]);
        roundRect(ctx,bx,by+16,bw,120,10); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle='rgba(90,180,232,0.10)'; ctx.strokeStyle=CPB; ctx.lineWidth=1.4;
        roundRect(ctx,bx+16,by+34,bw*0.44,40,7); ctx.fill(); ctx.stroke();
        ctx.fillStyle='#dfeaf2'; ctx.font='13px ui-monospace,monospace'; ctx.textAlign='center'; ctx.fillText('int x, y', bx+16+bw*0.22, by+59);
        ctx.fillStyle='rgba(126,224,176,0.10)'; ctx.strokeStyle=GRN;
        roundRect(ctx,bx+16,by+82,bw*0.44,40,7); ctx.fill(); ctx.stroke();
        ctx.fillStyle=GRN; ctx.fillText('move()', bx+16+bw*0.22, by+107);
        ctx.textAlign='left'; ctx.fillStyle=GLD; ctx.font='24px sans-serif'; ctx.fillText('→', bx+bw*0.5, by+82);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText('데이터 + 함수 = 한 몸(객체지향의 출발점)', bx, by+160);
      } else {
        // class Point = 데이터+함수 합쳐진 최종
        ctx.fillStyle=CPB; ctx.font='600 14px sans-serif'; ctx.fillText('class Point — 데이터 + 함수 = 하나', bx, by);
        ctx.fillStyle='rgba(90,180,232,0.10)'; ctx.strokeStyle=CPB; ctx.lineWidth=1.8;
        roundRect(ctx,bx,by+16,bw,138,10); ctx.fill(); ctx.stroke();
        ctx.fillStyle=CPD; ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.fillText('class Point', bx+14, by+40);
        ctx.strokeStyle='rgba(255,255,255,0.14)'; ctx.beginPath(); ctx.moveTo(bx+14,by+50); ctx.lineTo(bx+bw-14,by+50); ctx.stroke();
        ctx.fillStyle=GLD; ctx.font='12px sans-serif'; ctx.fillText('멤버변수 (상태)', bx+14, by+70);
        ctx.fillStyle='#dfeaf2'; ctx.font='13px ui-monospace,monospace'; ctx.fillText('int x, y;', bx+26, by+90);
        ctx.fillStyle=GRN; ctx.font='12px sans-serif'; ctx.fillText('멤버함수 (행동)', bx+14, by+114);
        ctx.fillStyle='#dfeaf2'; ctx.font='13px ui-monospace,monospace'; ctx.fillText('void move(int,int);', bx+26, by+134);
        ctx.fillStyle=GRN; ctx.font='12.5px sans-serif'; ctx.fillText('함수가 x·y를 ‘안에서’ 직접 만집니다 — 포인터 불필요.', bx, by+180);
      }

      E.tapHint(W/2, H*0.94, '화면 탭 = 다음 (struct → 합침 → class)', true);
      E.big('구조체에서 클래스로', 'C의 struct는 서로 관련된 데이터를 한 이름으로 묶는 상자였습니다 — 하지만 그 데이터를 다루는 함수는 밖에 따로 떨어져, Point를 포인터로 건네받아 만졌죠. C++의 class는 여기서 한 걸음 나아갑니다: 데이터(x, y)와 그 데이터를 다루는 함수(move)를 같은 상자 안에 함께 넣습니다. ‘무엇을 담느냐’와 ‘그걸로 무엇을 하느냐’를 한 몸으로 묶는 것 — 이것이 객체지향의 첫 발걸음입니다. struct와 class는 문법이 거의 같지만(기본 접근권한만 다름), class에는 함수까지 자연스레 함께 삽니다.'); }
  },

  // ══════════ 2. 멤버변수·멤버함수 ══════════
  { id:'cpp3_02',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(340+this.s.step*90,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'class Point {', hl:'class'},
        {t:'public:', hl:'public'},
        {t:'  int x, y;            // 멤버변수', hl:'int x, y'},
        {t:'  void move(int a,int b){ // 멤버함수', hl:'move'},
        {t:'    x += a;', hl:'x'},
        {t:'    y += b;', hl:'y'},
        {t:'  }', dim:true},
        {t:'  int dist2(){ return x*x + y*y; }', hl:'dist2'},
        {t:'};', dim:true}
      ];
      var act=[2,3,7][s.step];
      codePanel(E, W*0.04, H*0.13, W*0.46, code, 'members.cpp', act);

      // 우측: 객체 내부 = 멤버변수 테이블 + 멤버함수 목록
      var bx=W*0.58, by=H*0.16, bw=W*0.34;
      ctx.textAlign='left';
      ctx.fillStyle=CPB; ctx.font='600 14px sans-serif'; ctx.fillText('클래스 Point 의 구성', bx, by);
      // 멤버변수 영역
      ctx.fillStyle=GLD; ctx.font='600 12.5px sans-serif'; ctx.fillText('멤버변수 (객체의 상태)', bx, by+26);
      var vy=by+34, ch=28, cw=[80,70];
      cell(ctx,bx,vy,cw[0],ch,'이름','rgba(90,180,232,0.14)',CPB,CPB,12);
      cell(ctx,bx+cw[0],vy,cw[1],ch,'형','rgba(90,180,232,0.14)',CPB,CPB,12);
      var vars=[['x','int'],['y','int']];
      for(var i=0;i<vars.length;i++){
        var lit=(s.step===0);
        cell(ctx,bx,vy+ch*(i+1),cw[0],ch,vars[i][0], lit?'rgba(255,211,122,0.14)':'rgba(255,255,255,0.04)', lit?GLD:'rgba(255,255,255,0.12)', lit?GLD:'#dfeaf2',13);
        cell(ctx,bx+cw[0],vy+ch*(i+1),cw[1],ch,vars[i][1],'rgba(255,255,255,0.04)','rgba(255,255,255,0.12)',DIM,13);
      }
      // 멤버함수 영역
      var fy=vy+ch*3+22;
      ctx.fillStyle=GRN; ctx.font='600 12.5px sans-serif'; ctx.fillText('멤버함수 (객체의 행동)', bx, fy);
      var funcs=[['move(a,b)','x·y를 a·b만큼 이동'],['dist2()','원점까지 거리² 반환']];
      for(i=0;i<funcs.length;i++){
        var fyy=fy+10+i*36, litf=(s.step===2 && i===1)||(s.step===1&&i===0);
        ctx.fillStyle=litf?'rgba(126,224,176,0.14)':'rgba(255,255,255,0.04)'; ctx.strokeStyle=litf?GRN:'rgba(255,255,255,0.12)'; ctx.lineWidth=1.3;
        roundRect(ctx,bx,fyy,bw,30,6); ctx.fill(); ctx.stroke();
        ctx.fillStyle=litf?GRN:'#dfeaf2'; ctx.font='13px ui-monospace,monospace'; ctx.textAlign='left'; ctx.fillText(funcs[i][0], bx+10, fyy+20);
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif'; ctx.fillText(funcs[i][1], bx+130, fyy+20);
      }
      var oy=fy+10+2*36+30;
      ctx.font='12.5px sans-serif';
      if(s.step===0){ ctx.fillStyle=GLD; ctx.fillText('멤버변수: 객체마다 하나씩 갖는 ‘고유한 값’입니다.', bx, oy); }
      else if(s.step===1){ ctx.fillStyle=GRN; ctx.fillText('멤버함수는 같은 클래스의 멤버변수(x, y)를 이름만으로 씁니다.', bx, oy); }
      else { ctx.fillStyle=GRN; ctx.fillText('dist2()는 인자 없이 자기 x·y로 x²+y²을 돌려줍니다.', bx, oy); }

      E.tapHint(W/2, H*0.94, '화면 탭 = 다음 (멤버변수 → move → dist2)', true);
      E.big('멤버변수와 멤버함수', '클래스 안에는 두 종류의 멤버가 삽니다. 멤버변수는 객체의 상태 — Point라면 좌표 x, y처럼 ‘지금 이 객체가 어떤 값인지’를 담습니다. 멤버함수는 객체의 행동 — move(a,b)는 좌표를 옮기고, dist2()는 원점까지의 거리 제곱을 계산해 돌려주죠. 멤버함수의 특별한 점은, 같은 클래스의 멤버변수를 x, y라는 이름만으로 마치 자기 변수처럼 쓴다는 것입니다. 데이터와 그 데이터를 다루는 코드가 한 클래스 안에 함께 살기 때문에, 서로를 자연스럽게 아는 것이죠.'); }
  },

  // ══════════ 3. 객체 생성·사용 (점 연산자) ══════════
  { id:'cpp3_03',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(340+this.s.step*80,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 실제로 코드를 '실행'하며 p의 상태 계산 (골든룰)
      // step0: Point p;  x=0,y=0
      // step1: p.move(3,4);  x=3,y=4
      // step2: p.move(1,-2); x=4,y=2
      // step3: p.dist2() = 4*4+2*2 = 20
      var states=[ {x:0,y:0}, {x:3,y:4}, {x:4,y:2}, {x:4,y:2} ];
      var st=states[s.step];
      var d2 = st.x*st.x + st.y*st.y;

      var code=[
        {t:'Point p;             // 객체 생성', hl:'Point p'},
        {t:'p.move(3, 4);        // . 연산자', hl:'p.move'},
        {t:'p.move(1, -2);', hl:'p.move'},
        {t:'int d = p.dist2();   // = '+d2, hl:'p.dist2'},
        {t:'', dim:true},
        {t:'// p 는 x,y 를 가진 하나의 객체', dim:true}
      ];
      var act=[0,1,2,3][s.step];
      codePanel(E, W*0.04, H*0.15, W*0.46, code, 'use_object.cpp', act);

      // 우측 상단: 객체 상태 테이블 (실측)
      var bx=W*0.58, by=H*0.15, bw=W*0.34;
      ctx.textAlign='left'; ctx.fillStyle=CPB; ctx.font='600 14px sans-serif'; ctx.fillText('객체 p 의 상태 (실행 결과)', bx, by);
      var ch=30, cw=64;
      cell(ctx,bx,by+10,60,ch,'멤버','rgba(90,180,232,0.14)',CPB,CPB,12);
      cell(ctx,bx+60,by+10,cw,ch,'값','rgba(90,180,232,0.14)',CPB,CPB,12);
      var rows=[['x',st.x],['y',st.y]];
      for(var i=0;i<2;i++){
        cell(ctx,bx,by+10+ch*(i+1),60,ch,rows[i][0],'rgba(255,255,255,0.04)','rgba(255,255,255,0.12)','#dfeaf2',13);
        var changed=(s.step>0 && states[s.step][rows[i][0]]!==states[s.step-1][rows[i][0]]);
        cell(ctx,bx+60,by+10+ch*(i+1),cw,ch,rows[i][1], changed?'rgba(255,211,122,0.18)':'rgba(126,224,176,0.10)', changed?GLD:GRN, changed?GLD:GRN,14);
      }
      if(s.step===3){ ctx.fillStyle=GRN; ctx.font='600 13px sans-serif'; ctx.fillText('dist2() = '+st.x+'²+'+st.y+'² = '+d2, bx, by+10+ch*3+22); }

      // 우측 하단: 좌표 평면에 p 위치 실제로 찍기
      var ox=bx+20, oy=H*0.86, unit=Math.min(bw*0.13, H*0.10);
      ctx.strokeStyle='rgba(90,180,232,0.22)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(ox-unit,oy); ctx.lineTo(ox+unit*6,oy); ctx.moveTo(ox,oy+unit); ctx.lineTo(ox,oy-unit*6); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('x', ox+unit*6-4, oy+16); ctx.fillText('y', ox+6, oy-unit*6+2);
      // 원점→이전위치 흔적
      if(s.step>0){ var pv=states[s.step-1]; ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.setLineDash([4,3]);
        ctx.beginPath(); ctx.moveTo(ox+pv.x*unit,oy-pv.y*unit); ctx.lineTo(ox+st.x*unit,oy-st.y*unit); ctx.stroke(); ctx.setLineDash([]); }
      // p 점
      var px=ox+st.x*unit, py=oy-st.y*unit;
      ctx.strokeStyle='rgba(126,224,176,0.5)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(ox,oy); ctx.lineTo(px,py); ctx.stroke();
      ctx.fillStyle=GRN; ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(px,py,7,0,7); ctx.fill(); ctx.stroke();
      ctx.fillStyle='#dfeaf2'; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('p('+st.x+','+st.y+')', px+10, py-8);

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (생성 → move → move → dist2)', true);
      E.big('객체 생성과 사용 — 점(.) 연산자', 'Point p; 라고 쓰면, 클래스라는 설계도로부터 실제 객체 p가 하나 태어납니다 — 자기만의 x, y를 가진 채로요. 그 객체에게 일을 시킬 때는 점(.) 연산자를 씁니다: p.move(3,4)는 ‘p야, 너의 좌표를 (3,4)만큼 옮겨라’라는 명령입니다. 함수는 하나지만, 그 함수가 만지는 x·y는 바로 점 앞에 놓인 그 객체의 것입니다. 오른쪽 표와 좌표를 보세요 — move를 부를 때마다 p의 상태가 실제로 변하고, dist2()는 그 순간의 x·y로 거리 제곱을 계산해 돌려줍니다. 모두 코드를 실제로 실행한 값입니다.'); }
  },

  // ══════════ 4. 접근제어 public/private (정보은닉) ══════════
  { id:'cpp3_04',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(340+this.s.step*90,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'class Counter {', hl:'class'},
        {t:'private:', hl:'private'},
        {t:'  int count = 0;      // 숨김', hl:'count'},
        {t:'public:', hl:'public'},
        {t:'  void up(){ count++; }   // 통로', hl:'up'},
        {t:'  int get(){ return count; }', hl:'get'},
        {t:'};', dim:true},
        {t:'Counter c;', dim:true},
        {t:'c.up();            // OK (public)', hl:'c.up()'},
        {t:'c.count = 99;      // 컴파일 에러!', hl:'c.count'}
      ];
      var act=[2,8,9][s.step];
      codePanel(E, W*0.04, H*0.12, W*0.46, code, 'access_control.cpp', act);

      // 우측: 객체 = 벽(캡슐). private 안쪽 count, public 통로 up/get. 외부 화살표.
      var cx=W*0.74, cy=H*0.42, R=Math.min(W*0.11,H*0.20);
      // 캡슐 벽
      ctx.fillStyle='rgba(90,180,232,0.06)'; ctx.strokeStyle=CPB; ctx.lineWidth=2.5;
      ctx.beginPath(); ctx.arc(cx,cy,R,0,7); ctx.fill(); ctx.stroke();
      // private 코어
      ctx.fillStyle='rgba(240,136,138,0.14)'; ctx.strokeStyle=RED; ctx.lineWidth=1.6;
      ctx.beginPath(); ctx.arc(cx,cy,R*0.5,0,7); ctx.fill(); ctx.stroke();
      ctx.fillStyle=RED; ctx.font='600 12px sans-serif'; ctx.textAlign='center'; ctx.fillText('private', cx, cy-8);
      ctx.fillStyle='#dfeaf2'; ctx.font='13px ui-monospace,monospace'; ctx.fillText('count', cx, cy+12);
      // public 통로(두 게이트 up/get)
      ctx.fillStyle=GRN; ctx.font='600 11px sans-serif';
      var g1x=cx+R*0.72, g1y=cy-R*0.55, g2x=cx+R*0.72, g2y=cy+R*0.55;
      ctx.fillStyle='rgba(126,224,176,0.18)'; ctx.strokeStyle=GRN; ctx.lineWidth=1.4;
      roundRect(ctx,g1x-4,g1y-12,50,22,5); ctx.fill(); ctx.stroke();
      roundRect(ctx,g2x-4,g2y-12,50,22,5); ctx.fill(); ctx.stroke();
      ctx.fillStyle=GRN; ctx.font='12px ui-monospace,monospace'; ctx.fillText('up()', g1x+21, g1y+4);
      ctx.fillStyle=GRN; ctx.fillText('get()', g2x+21, g2y+4);
      ctx.fillStyle=CPB; ctx.font='600 12px sans-serif'; ctx.fillText('public 통로', cx, cy+R-12);

      // 외부 접근 화살표 (step에 따라)
      ctx.textAlign='left';
      if(s.step===0){
        ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.fillText('바깥세상', W*0.55, cy-R-10);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText('count는 벽 안(private)에 숨어 있습니다.', W*0.05, H*0.86);
        ctx.fillText('오직 up()·get()이라는 통로로만 손이 닿습니다.', W*0.05, H*0.90);
      } else if(s.step===1){
        // c.up() → 통로 통과 OK (초록 화살표)
        ctx.strokeStyle=GRN; ctx.lineWidth=2.4;
        ctx.beginPath(); ctx.moveTo(W*0.55, g1y); ctx.lineTo(g1x-6, g1y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(g1x-12,g1y-5); ctx.lineTo(g1x-4,g1y); ctx.lineTo(g1x-12,g1y+5); ctx.fillStyle=GRN; ctx.fill();
        ctx.fillStyle=GRN; ctx.font='600 13px sans-serif'; ctx.fillText('c.up()  ✓ 허용', W*0.44, g1y-14);
        ctx.fillStyle=GRN; ctx.font='12.5px sans-serif'; ctx.fillText('public 멤버함수로는 count를 안전하게 바꿉니다.', W*0.05, H*0.88);
      } else {
        // c.count=99 → 벽에 막힘 (빨강 X)
        ctx.strokeStyle=RED; ctx.lineWidth=2.4; ctx.setLineDash([6,4]);
        ctx.beginPath(); ctx.moveTo(W*0.52, cy); ctx.lineTo(cx-R-6, cy); ctx.stroke(); ctx.setLineDash([]);
        var wx=cx-R-2, wy=cy;
        ctx.strokeStyle=RED; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(wx-9,wy-9); ctx.lineTo(wx+9,wy+9); ctx.moveTo(wx+9,wy-9); ctx.lineTo(wx-9,wy+9); ctx.stroke();
        ctx.fillStyle=RED; ctx.font='600 13px sans-serif'; ctx.fillText('c.count = 99  ✗ 막힘', W*0.40, cy-R-6);
        ctx.fillStyle=RED; ctx.font='12.5px sans-serif'; ctx.fillText('private 멤버 직접 접근 → 컴파일 단계에서 거부됩니다.', W*0.05, H*0.88);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (숨김 → up() 허용 → 직접접근 거부)', true);
      E.big('접근제어 — public과 private', '클래스의 멤버는 두 문패 중 하나를 답니다. public은 ‘누구나 써도 되는 대문’, private은 ‘내부 전용, 바깥은 손대지 마시오’입니다. Counter의 count를 private에 두면, 바깥 코드가 c.count = 99처럼 직접 값을 바꾸는 일이 컴파일 단계에서 아예 막힙니다. 대신 c.up()·c.get()처럼 public으로 열어 둔 통로로만 드나들 수 있죠. 이렇게 내부를 감추는 것을 정보 은닉이라 부릅니다 — 객체의 속살을 벽으로 감싸고, 정해진 문으로만 소통하게 하면, 누가 언제 상태를 어떻게 바꾸는지 통제할 수 있습니다. class의 기본은 private, struct의 기본은 public — 그 차이뿐입니다.'); }
  },

  // ══════════ 5. 캡슐화 (getter/setter로 불변식 지키기) ══════════
  { id:'cpp3_05',
    enter:function(E){ var self=this; this.s={amt:-30};
      E.controls('<div class="ctrl"><label>deposit 시도 금액</label><input type="range" id="amt" min="-50" max="120" step="10" value="-30"><output id="amto">-30</output></div>');
      E.bind('#amt','input',function(e){ self.s.amt=+e.target.value; document.getElementById('amto').textContent=e.target.value; E.blip(360,0.05); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var amt=s.amt;
      // 실제 setter 로직 (골든룰): 잔액 100에서 시작, deposit(amt) → amt<=0 이면 거부
      var start=100;
      var accepted = amt>0;
      var newBal = accepted ? start+amt : start;

      var code=[
        {t:'class Account {', hl:'class'},
        {t:'  int balance = 100;   // private', hl:'balance'},
        {t:'public:', hl:'public'},
        {t:'  bool deposit(int a){  // setter', hl:'deposit'},
        {t:'    if (a <= 0)         // 불변식 검사', hl:'if (a <= 0)'},
        {t:'      return false;     // 거부', hl:'return false'},
        {t:'    balance += a;       // 통과', hl:'balance += a'},
        {t:'    return true;', dim:true},
        {t:'  }',dim:true},
        {t:'  int get(){ return balance; }  // getter', hl:'get'},
        {t:'};', dim:true}
      ];
      // 줄커서: 검사에서 거부/통과 분기
      var act = accepted ? 6 : 5;
      codePanel(E, W*0.04, H*0.11, W*0.46, code, 'encapsulation.cpp', act);

      // 우측: deposit(amt) 이 setter 필터를 통과/거부되는 흐름
      var bx=W*0.56, by=H*0.20, bw=W*0.40;
      ctx.textAlign='left';
      ctx.fillStyle=CPB; ctx.font='600 14px sans-serif'; ctx.fillText('deposit('+amt+')  —  setter 검증', bx, by);

      // 입력 값 알약
      var inX=bx, inY=by+22;
      ctx.fillStyle='rgba(122,184,255,0.14)'; ctx.strokeStyle=BLU; ctx.lineWidth=1.4; roundRect(ctx,inX,inY,90,30,7); ctx.fill(); ctx.stroke();
      ctx.fillStyle=BLU; ctx.font='600 14px ui-monospace,monospace'; ctx.textAlign='center'; ctx.fillText('a = '+amt, inX+45, inY+20);

      // 필터 게이트 (검사 조건)
      var gX=bx+120, gY=by+16, gW=bw-120, gH=44;
      var gc = accepted ? GRN : RED;
      ctx.fillStyle= accepted?'rgba(126,224,176,0.12)':'rgba(240,136,138,0.12)'; ctx.strokeStyle=gc; ctx.lineWidth=1.6;
      roundRect(ctx,gX,gY,gW,gH,8); ctx.fill(); ctx.stroke();
      ctx.fillStyle=gc; ctx.font='600 13px sans-serif'; ctx.textAlign='center';
      ctx.fillText(accepted?'a > 0  →  통과 ✓':'a ≤ 0  →  거부 ✗', gX+gW/2, gY+gH/2+5);
      // 화살표
      ctx.strokeStyle=gc; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(inX+90,inY+15); ctx.lineTo(gX-4,gY+gH/2); ctx.stroke();

      // 잔액 상자 (before → after)
      var balY=by+96;
      ctx.textAlign='left'; ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText('balance (private, 숨겨진 상태)', bx, balY);
      // before
      ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1.4; roundRect(ctx,bx,balY+10,120,44,8); ctx.fill(); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('이전', bx+60, balY+24);
      ctx.fillStyle='#dfeaf2'; ctx.font='700 18px ui-monospace,monospace'; ctx.fillText(''+start, bx+60, balY+46);
      // arrow
      ctx.fillStyle=gc; ctx.font='22px sans-serif'; ctx.fillText('→', bx+150, balY+40);
      // after
      ctx.fillStyle= accepted?'rgba(126,224,176,0.12)':'rgba(255,255,255,0.04)'; ctx.strokeStyle= accepted?GRN:'rgba(255,255,255,0.18)'; ctx.lineWidth=1.6; roundRect(ctx,bx+180,balY+10,120,44,8); ctx.fill(); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.fillText('이후', bx+240, balY+24);
      ctx.fillStyle= accepted?GRN:'#dfeaf2'; ctx.font='700 18px ui-monospace,monospace'; ctx.fillText(''+newBal, bx+240, balY+46);

      // 결과 메시지 (실측)
      ctx.textAlign='left';
      if(accepted){ ctx.fillStyle=GRN; ctx.font='600 15px sans-serif'; ctx.fillText('deposit('+amt+') = true   →   잔액 '+start+' + '+amt+' = '+newBal, W*0.05, H*0.86); }
      else { ctx.fillStyle=RED; ctx.font='600 15px sans-serif'; ctx.fillText('deposit('+amt+') = false  →   잔액 그대로 '+start+' (음수 입금 거부)', W*0.05, H*0.86); }
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
      ctx.fillText('불변식: 잔액은 setter가 지키므로 절대 잘못된 값으로 오염되지 않습니다.', W*0.05, H*0.90);

      E.tapHint(W/2, H*0.95, '슬라이더로 입금액을 바꿔 setter의 검증을 확인하세요', true);
      E.big('캡슐화 — 규칙을 지키는 문지기', '정보 은닉이 벽을 세우는 일이라면, 캡슐화는 그 벽에 ‘규칙을 아는 문지기’를 세우는 일입니다. Account의 balance를 private로 감추고, 오직 deposit()이라는 setter로만 바꾸게 하면 — 그 함수 안에서 ‘0 이하 입금은 거부’ 같은 검증을 강제할 수 있습니다. 바깥이 아무리 이상한 값을 넣어도, 문지기가 걸러 내니 잔액은 언제나 올바른 상태(불변식)를 유지하죠. 슬라이더를 음수로 내려 보세요 — deposit이 false를 돌려주고 잔액은 그대로입니다. 양수로 올리면 통과해 실제로 더해집니다. 값을 읽기만 하는 getter, 규칙에 맞춰 바꾸는 setter — 이 한 쌍이 객체를 안전하게 지키는 캡슐화의 핵심입니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
