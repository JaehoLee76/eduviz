/* 빅데이터분석 제2장 — 데이터 타입과 구조: ndarray · 결측(None/NaN) · Categorical · Series/DataFrame · dtype 변환
   동작(behavior)만. 텍스트=content/bda2.json. 엔진 js/engine.js 공유. 색: BDA=로즈/마젠타 테마.
   골든룰: 화면에 표시되는 모든 합계·평균·개수·바이트·판정은 JS로 실제 계산(하드코딩 금지, Math.random/Date.now 금지 — 고정 배열 사용). */
(function(){
  var ROS='#ff7ab8', ROSD='#d15591', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', PNK='#f4a0c0', DIM='#9b99a3', RED='#f0888a';

  function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  // 등폭 코드 패널: lines=[{t,hl?,dim?}|문자열]. hl 토큰만 로즈 강조.
  function codePanel(E, x, y, w, lines, title, actLine){
    var ctx=E.ctx, lh=21, pad=14, top=y, n=lines.length, ht=n*lh+pad*2+(title?26:0);
    ctx.fillStyle='rgba(255,255,255,0.035)'; ctx.strokeStyle='rgba(255,122,184,0.30)'; ctx.lineWidth=1;
    roundRect(ctx,x,top,w,ht,10); ctx.fill(); ctx.stroke();
    var cy=top+pad+(title?26:0);
    if(title){ ctx.fillStyle=ROS; ctx.font='600 12px ui-monospace,Menlo,monospace'; ctx.textAlign='left'; ctx.fillText(title, x+pad, top+pad+12); }
    ctx.font='13px ui-monospace,Menlo,Consolas,monospace'; ctx.textAlign='left';
    for(var i=0;i<n;i++){
      var L=lines[i], t=(typeof L==='string')?L:L.t, hl=(typeof L==='object')?L.hl:null;
      var ty=cy+i*lh+11;
      if(actLine!=null && i===actLine){ ctx.fillStyle='rgba(255,122,184,0.16)'; ctx.fillRect(x+4, cy+i*lh+1, w-8, lh-2); ctx.fillStyle=ROS; ctx.fillRect(x+4, cy+i*lh+1, 3, lh-2); }
      if(hl && t.indexOf(hl)>=0){
        var a=t.split(hl), pre=a[0], post=a.slice(1).join(hl);
        ctx.fillStyle=DIM; ctx.fillText(pre, x+pad, ty);
        var wpre=ctx.measureText(pre).width;
        ctx.fillStyle=ROS; ctx.fillText(hl, x+pad+wpre, ty);
        var whl=ctx.measureText(hl).width;
        ctx.fillStyle=DIM; ctx.fillText(post, x+pad+wpre+whl, ty);
      } else {
        ctx.fillStyle=(L.dim?DIM:'#e8e0c8'); ctx.fillText(t, x+pad, ty);
      }
    }
    return top+ht;
  }

  // ══════════ 고정 예제 데이터 (파일 스코프, Math.random/Date.now 금지) ══════════
  var SCORES = [88,92,75,60,99,84,71,95,68,90];                       // 1. ndarray
  var LIST_NONE = [23.5, null, 19.2, 25.1];                            // 2a. 파이썬 리스트 + None
  var ARR_NAN   = [23.5, NaN, 19.2, NaN, 25.1];                        // 2b. 배열 + np.nan
  var SERIES_MIX = [23.5, null, 19.2, NaN, 25.1, null, 18.0, 21.4, NaN, 20.0]; // 2c. Series(None+NaN 혼재)
  var GRADES = ['A','B','A','C','B','A','B','C','A','B','C','A','B','A','C','B','A','B','C','A']; // 3. Categorical
  var SCORES2 = [95,82,91,68,79,88,84,71,93,80,65,97,83,90,69,81,94,78,70,89];
  var SIZES = ['M','S','XL','L','M','S'];                              // 3d. 순서형 비교용
  var SIZE_RANK = {S:0,M:1,L:2,XL:3};
  var NAMES = ['도현','서연','민준','하은','지호','유진','예준','수아'];    // 4. DataFrame
  var AGES = [17,16,null,18,17,16,18,17];
  var SCORES3 = [88.5,92.0,75.5,null,60.0,84.5,null,90.0];
  var PASS = SCORES3.map(function(v){ return v===null ? null : (v>=60); });
  var PRICE_STR = ['12.5','7','NA','30.2','oops','5.0','19'];         // 5. dtype 변환

  function sum(arr){ var t=0; for(var i=0;i<arr.length;i++) t+=arr[i]; return t; }
  function mean(arr){ return sum(arr)/arr.length; }
  function fmt1(x){ return (Math.round(x*10)/10).toFixed(1); }
  function fmt2(x){ return (Math.round(x*100)/100).toFixed(2); }

  var scenes = [

  // ══════════ 1. 값 하나에서 배열로 — ndarray ══════════
  { id:'bda2_01',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*90,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'scores = [88, 92, 75, 60, 99,', hl:'scores'},
        {t:'          84, 71, 95, 68, 90]', dim:true},
        {t:'', dim:true},
        {t:'total = 0', hl:'total'},
        {t:'for s in scores:', hl:'for s'},
        {t:'    total += s', hl:'total +='},
        {t:'avg = total / len(scores)', hl:'avg ='},
        {t:'', dim:true},
        {t:'import numpy as np', hl:'numpy'},
        {t:'arr = np.array(scores)', hl:'np.array'},
        {t:'arr.sum(), arr.mean()', hl:'.sum()'},
        {t:'curved = arr + 5   # 벡터화', hl:'arr + 5'}
      ];
      var act=[5,10,11][s.step];
      var codeBot=codePanel(E, W*0.04, H*0.09, W*0.46, code, 'array_basics.py', act);

      // 실제 계산 — 골든룰
      var total=sum(SCORES), avg=mean(SCORES);
      var curved=SCORES.map(function(v){ return v+5; });
      var totalC=sum(curved), avgC=mean(curved);

      var gx=W*0.53, gw=W*0.43, n=SCORES.length;
      ctx.textAlign='left';
      if(s.step===0){
        ctx.fillStyle=ROS; ctx.font='600 14px sans-serif'; ctx.fillText('리스트 + 반복문 — 값마다 상자를 하나씩', gx, H*0.14);
        // 포인터 슬롯(리스트 배열 자체)
        var cw=Math.min(38, gw/n-4), py0=H*0.20;
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('scores  (포인터 10개가 늘어선 배열)', gx, py0-8);
        for(var i=0;i<n;i++){
          var bx=gx+i*(cw+4);
          ctx.fillStyle='rgba(255,122,184,0.10)'; ctx.strokeStyle=ROS; ctx.lineWidth=1.2; roundRect(ctx,bx,py0,cw,26,5); ctx.fill(); ctx.stroke();
          ctx.fillStyle=ROS; ctx.font='11px ui-monospace,monospace'; ctx.textAlign='center'; ctx.fillText('•', bx+cw/2, py0+17);
          // 각 정수 객체(흩어진 상자, 지그재그)로 이어지는 연결선
          var oy=py0+70+(i%2)*26, ox=bx+cw/2;
          ctx.strokeStyle='rgba(255,122,184,0.35)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(ox,py0+26); ctx.lineTo(ox,oy); ctx.stroke();
          ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.strokeStyle=PNK; ctx.lineWidth=1.1; roundRect(ctx,bx-3,oy,cw+6,26,5); ctx.fill(); ctx.stroke();
          ctx.fillStyle='#e8e0c8'; ctx.font='12px ui-monospace,monospace'; ctx.textAlign='center'; ctx.fillText(SCORES[i], bx+cw/2, oy+17);
        }
        ctx.textAlign='left';
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif'; ctx.fillText('각 값은 파이썬 정수 객체 — 리스트는 그 객체들을 가리키는 화살표 목록입니다.', gx, py0+140);
        ctx.fillStyle=GRN; ctx.font='600 15px ui-monospace,monospace'; ctx.fillText('total = '+total+'   avg = '+fmt1(avg), gx, py0+168);
      } else if(s.step===1){
        ctx.fillStyle=ROS; ctx.font='600 14px sans-serif'; ctx.fillText('ndarray — 한 덩어리, 같은 타입, 나란히', gx, H*0.14);
        var cw2=Math.min(38, gw/n-4), ry=H*0.22;
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('arr  (연속 메모리, 값이 그 자리에 그대로)', gx, ry-8);
        for(var j=0;j<n;j++){
          var bx2=gx+j*(cw2+2);
          ctx.fillStyle='rgba(122,184,255,0.12)'; ctx.strokeStyle=BLU; ctx.lineWidth=1.2; ctx.fillRect(bx2,ry,cw2,30); ctx.strokeRect(bx2,ry,cw2,30);
          ctx.fillStyle='#e8e0c8'; ctx.font='12px ui-monospace,monospace'; ctx.textAlign='center'; ctx.fillText(SCORES[j], bx2+cw2/2, ry+19);
        }
        var ry2=ry+56;
        ctx.textAlign='left'; ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('curved = arr + 5  (모든 칸에 한 번에 +5, 벡터화)', gx, ry2-8);
        for(j=0;j<n;j++){
          var bx3=gx+j*(cw2+2);
          ctx.fillStyle='rgba(126,224,176,0.14)'; ctx.strokeStyle=GRN; ctx.lineWidth=1.2; ctx.fillRect(bx3,ry2,cw2,30); ctx.strokeRect(bx3,ry2,cw2,30);
          ctx.fillStyle=GRN; ctx.font='12px ui-monospace,monospace'; ctx.textAlign='center'; ctx.fillText(curved[j], bx3+cw2/2, ry2+19);
        }
        ctx.textAlign='left';
        ctx.fillStyle=GRN; ctx.font='600 15px ui-monospace,monospace'; ctx.fillText('arr.sum()='+total+'  arr.mean()='+fmt1(avg), gx, ry2+56);
        ctx.fillStyle=GRN; ctx.font='600 15px ui-monospace,monospace'; ctx.fillText('curved.sum()='+totalC+'  curved.mean()='+fmt1(avgC), gx, ry2+78);
      } else {
        ctx.fillStyle=ROS; ctx.font='600 14px sans-serif'; ctx.fillText('메모리 구조 비교 (근사 실측)', gx, H*0.14);
        var PTR=8, INTOBJ=28, HEADER=96;
        var listBytes=n*(PTR+INTOBJ), arrBytes=HEADER+n*8;
        var saved=listBytes-arrBytes, pct=Math.round(saved/listBytes*100);
        var maxB=listBytes, by=H*0.22, bh=34, bw=gw;
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('list  (포인터 8B + 정수객체 약28B) × '+n+'칸', gx, by-6);
        ctx.fillStyle='rgba(255,122,184,0.16)'; ctx.strokeStyle=ROS; ctx.lineWidth=1.4; roundRect(ctx,gx,by,bw*(listBytes/maxB),bh,6); ctx.fill(); ctx.stroke();
        ctx.fillStyle=ROS; ctx.font='600 14px ui-monospace,monospace'; ctx.fillText(listBytes+' bytes', gx+10, by+22);
        var by2=by+62;
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('ndarray  (헤더 약96B + int64 8B) × '+n+'칸', gx, by2-6);
        ctx.fillStyle='rgba(122,184,255,0.16)'; ctx.strokeStyle=BLU; ctx.lineWidth=1.4; roundRect(ctx,gx,by2,bw*(arrBytes/maxB),bh,6); ctx.fill(); ctx.stroke();
        ctx.fillStyle=BLU; ctx.font='600 14px ui-monospace,monospace'; ctx.fillText(arrBytes+' bytes', gx+10, by2+22);
        ctx.fillStyle=GRN; ctx.font='600 15px sans-serif'; ctx.fillText('절약 '+saved+' bytes  (약 '+pct+'% ↓)', gx, by2+62);
      }
      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (리스트 구조 → ndarray → 메모리 실측)', true);
      E.big('리스트 vs ndarray — 같은 값, 다른 구조', '파이썬 리스트는 서로 다른 타입도 담을 수 있는 대신, 실제로는 값을 가리키는 화살표(포인터) 목록입니다. 값 자체는 메모리 여기저기 흩어진 별개의 객체죠. NumPy 배열은 같은 타입의 값을 연속된 메모리에 나란히 눕혀, 화살표를 거치지 않고 값 자체를 붙여 저장합니다 — 그래서 더 작고, arr + 5처럼 모든 칸에 한 번에 연산(벡터화)이 가능합니다.'); }
  },

  // ══════════ 2. 비어 있음의 세 얼굴 — None · NaN · isna ══════════
  { id:'bda2_02',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(340+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'temps = [23.5, None, 19.2, 25.1]', hl:'None'},
        {t:'sum(temps)   # TypeError!', hl:'TypeError'},
        {t:'', dim:true},
        {t:'import numpy as np', hl:'numpy'},
        {t:'a = np.array([23.5, np.nan,', hl:'np.nan'},
        {t:'              19.2, np.nan, 25.1])', dim:true},
        {t:'a.sum()        # nan (전파)', hl:'nan'},
        {t:'np.nanmean(a)  # skip nan', hl:'nanmean'},
        {t:'', dim:true},
        {t:'s = pd.Series([...])', hl:'Series'},
        {t:'s.isna().sum()  # both count', hl:'isna'}
      ];
      var act=[1,7,10][s.step];
      var codeBot=codePanel(E, W*0.04, H*0.08, W*0.46, code, 'missing.py', act);
      var gx=W*0.53, gw=W*0.43;
      ctx.textAlign='left';

      if(s.step===0){
        ctx.fillStyle=ROS; ctx.font='600 14px sans-serif'; ctx.fillText('파이썬 리스트 + None — 계산이 아예 막힘', gx, H*0.14);
        var ry=H*0.20, cw=Math.min(76,(gw-20)/LIST_NONE.length);
        for(var i=0;i<LIST_NONE.length;i++){
          var v=LIST_NONE[i], bx=gx+i*(cw+8), isN=(v===null);
          ctx.fillStyle=isN?'rgba(240,136,138,0.16)':'rgba(255,255,255,0.04)'; ctx.strokeStyle=isN?RED:DIM; ctx.lineWidth=isN?1.8:1.1;
          roundRect(ctx,bx,ry,cw,40,7); ctx.fill(); ctx.stroke();
          ctx.fillStyle=isN?RED:'#e8e0c8'; ctx.font='13px ui-monospace,monospace'; ctx.textAlign='center'; ctx.fillText(isN?'None':v, bx+cw/2, ry+25);
        }
        // 실제 판정: None이 하나라도 있으면 sum() 불가
        var hasNone=LIST_NONE.some(function(v){ return v===null; });
        ctx.textAlign='left';
        ctx.fillStyle=RED; ctx.font='600 14px ui-monospace,monospace'; ctx.fillText('sum(temps) → '+(hasNone?'TypeError: unsupported operand':'정상 계산'), gx, ry+78);
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif'; ctx.fillText('None은 ‘숫자가 아닌 객체’라 + 연산 자체가 거부됩니다.', gx, ry+100);
      } else if(s.step===1){
        ctx.fillStyle=ROS; ctx.font='600 14px sans-serif'; ctx.fillText('np.nan — 계산은 되지만 결과가 전염됩니다', gx, H*0.14);
        var ry2=H*0.20, cw2=Math.min(64,(gw-20)/ARR_NAN.length);
        for(var j=0;j<ARR_NAN.length;j++){
          var v2=ARR_NAN[j], bx2=gx+j*(cw2+6), isNa=isNaN(v2);
          ctx.fillStyle=isNa?'rgba(240,136,138,0.16)':'rgba(122,184,255,0.12)'; ctx.strokeStyle=isNa?RED:BLU; ctx.lineWidth=isNa?1.8:1.1;
          roundRect(ctx,bx2,ry2,cw2,38,7); ctx.fill(); ctx.stroke();
          ctx.fillStyle=isNa?RED:'#e8e0c8'; ctx.font='12.5px ui-monospace,monospace'; ctx.textAlign='center'; ctx.fillText(isNa?'nan':v2, bx2+cw2/2, ry2+24);
        }
        // 실제 계산: reduce 시 NaN 전파, nanmean은 유효값만
        var s0=0; for(j=0;j<ARR_NAN.length;j++) s0+=ARR_NAN[j];
        var valid=ARR_NAN.filter(function(v){ return !isNaN(v); });
        var nm=mean(valid);
        ctx.textAlign='left';
        ctx.fillStyle=RED; ctx.font='600 14px ui-monospace,monospace'; ctx.fillText('a.sum() → '+(isNaN(s0)?'nan':s0)+'  (하나라도 nan이면 전부 nan)', gx, ry2+66);
        ctx.fillStyle=GRN; ctx.font='600 14px ui-monospace,monospace'; ctx.fillText('np.nanmean(a) → '+fmt2(nm)+'  (nan '+ (ARR_NAN.length-valid.length) +'개는 건너뜀)', gx, ry2+90);
      } else {
        ctx.fillStyle=ROS; ctx.font='600 14px sans-serif'; ctx.fillText('pandas Series — None·NaN을 구분 없이 결측으로', gx, H*0.14);
        var ry3=H*0.20, cw3=Math.min(38,(gw-40)/SERIES_MIX.length);
        for(var k=0;k<SERIES_MIX.length;k++){
          var v3=SERIES_MIX[k], miss=(v3===null||isNaN(v3)), bx3=gx+k*(cw3+3);
          ctx.fillStyle=miss?'rgba(240,136,138,0.16)':'rgba(126,224,176,0.10)'; ctx.strokeStyle=miss?RED:GRN; ctx.lineWidth=miss?1.6:1;
          roundRect(ctx,bx3,ry3,cw3,32,5); ctx.fill(); ctx.stroke();
          ctx.fillStyle=miss?RED:'#e8e0c8'; ctx.font='10.5px ui-monospace,monospace'; ctx.textAlign='center'; ctx.fillText(miss?'∅':v3, bx3+cw3/2, ry3+20);
        }
        var missCnt=SERIES_MIX.filter(function(v){ return v===null||isNaN(v); }).length;
        var present=SERIES_MIX.filter(function(v){ return v!==null&&!isNaN(v); });
        ctx.textAlign='left';
        ctx.fillStyle=GLD; ctx.font='600 15px ui-monospace,monospace'; ctx.fillText('s.isna().sum() → '+missCnt+' 개 (전체 '+SERIES_MIX.length+'개 중)', gx, ry3+64);
        ctx.fillStyle=GRN; ctx.font='600 15px ui-monospace,monospace'; ctx.fillText('s.dropna().mean() → '+fmt2(mean(present))+'  (유효 '+present.length+'개만)', gx, ry3+90);
      }
      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (None 막힘 → NaN 전파 → isna 집계)', true);
      E.big('결측의 세 얼굴 — None·NaN·isna', '비어 있음은 하나가 아닙니다. 파이썬 순수 객체 None은 ‘값이 아예 없다’는 뜻이라 산술 연산 자체를 막습니다. NumPy의 np.nan은 부동소수점의 특수값이라 연산은 진행되지만 결과가 nan으로 전염됩니다. pandas는 이 둘을 한데 묶어 isna()로 잡아내고, dropna()·fillna()로 다루기 쉽게 만들어 줍니다 — 결측을 어떻게 다루느냐가 분석 품질을 가릅니다.'); }
  },

  // ══════════ 3. 범주형 데이터 — Categorical ══════════
  { id:'bda2_03',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(350+this.s.step*80,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'grades = ["A","B","A","C", ...]', hl:'grades'},
        {t:'grades.dtype   # object (str×20)', hl:'object'},
        {t:'', dim:true},
        {t:'cat = grades.astype("category")', hl:'"category"'},
        {t:'cat.cat.codes    # 0,1,0,2, ...', hl:'codes'},
        {t:'cat.cat.categories  # [A, B, C]', hl:'categories'},
        {t:'', dim:true},
        {t:'df.groupby(cat)["score"].mean()', hl:'groupby'},
        {t:'', dim:true},
        {t:'ordered = pd.Categorical(sizes,', hl:'ordered'},
        {t:'  categories=["S","M","L","XL"],', dim:true},
        {t:'  ordered=True)', dim:true}
      ];
      var act=[1,4,7,9][s.step];
      var codeBot=codePanel(E, W*0.04, H*0.07, W*0.46, code, 'categorical.py', act);
      var gx=W*0.53, gw=W*0.43;
      ctx.textAlign='left';
      var uniq=['A','B','C'];
      var n=GRADES.length;
      var PTR=8, STR=50;

      if(s.step===0){
        ctx.fillStyle=ROS; ctx.font='600 14px sans-serif'; ctx.fillText('object dtype — 문자열 20개, 각각 포인터', gx, H*0.13);
        var cw=Math.min(30,(gw)/n-2), ry=H*0.19;
        for(var i=0;i<n;i++){
          var bx=gx+(i%10)*(cw+2), by=ry+Math.floor(i/10)*30;
          var col=GRADES[i]==='A'?ROS:(GRADES[i]==='B'?BLU:GLD);
          ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.strokeStyle=col; ctx.lineWidth=1.1; ctx.fillRect(bx,by,cw,26); ctx.strokeRect(bx,by,cw,26);
          ctx.fillStyle=col; ctx.font='11px ui-monospace,monospace'; ctx.textAlign='center'; ctx.fillText(GRADES[i], bx+cw/2, by+18);
        }
        var objBytes = n*PTR + uniq.length*STR;
        ctx.textAlign='left';
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif'; ctx.fillText('포인터 '+n+'개×'+PTR+'B + 문자열객체 '+uniq.length+'개×'+STR+'B', gx, ry+76);
        ctx.fillStyle=RED; ctx.font='600 15px ui-monospace,monospace'; ctx.fillText('= '+objBytes+' bytes (object)', gx, ry+100);
      } else if(s.step===1){
        ctx.fillStyle=ROS; ctx.font='600 14px sans-serif'; ctx.fillText('category dtype — 정수 코드 + 사전', gx, H*0.13);
        var codes=GRADES.map(function(g){ return uniq.indexOf(g); });
        var cw2=Math.min(30,(gw)/n-2), ry2=H*0.19;
        for(var j=0;j<n;j++){
          var bx2=gx+(j%10)*(cw2+2), by2=ry2+Math.floor(j/10)*30;
          var col2=codes[j]===0?ROS:(codes[j]===1?BLU:GLD);
          ctx.fillStyle='rgba(126,224,176,0.10)'; ctx.strokeStyle=col2; ctx.lineWidth=1.1; ctx.fillRect(bx2,by2,cw2,26); ctx.strokeRect(bx2,by2,cw2,26);
          ctx.fillStyle=col2; ctx.font='11px ui-monospace,monospace'; ctx.textAlign='center'; ctx.fillText(codes[j], bx2+cw2/2, by2+18);
        }
        var catBytes = n*1 + uniq.length*STR;
        var objBytes2 = n*PTR + uniq.length*STR;
        var saved=objBytes2-catBytes, pct=Math.round(saved/objBytes2*100);
        ctx.textAlign='left';
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif'; ctx.fillText('코드 '+n+'개×1B(int8) + 범주사전 '+uniq.length+'개×'+STR+'B', gx, ry2+76);
        ctx.fillStyle=GRN; ctx.font='600 15px ui-monospace,monospace'; ctx.fillText('= '+catBytes+' bytes  (절약 '+saved+'B, 약 '+pct+'%↓)', gx, ry2+100);
        ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.fillText('categories = [A, B, C]  ← 사전은 한 번만 저장', gx, ry2+122);
      } else if(s.step===2){
        ctx.fillStyle=ROS; ctx.font='600 14px sans-serif'; ctx.fillText('groupby — 범주마다 실제로 집계', gx, H*0.13);
        var means={}, cnt={}, tot={};
        uniq.forEach(function(u){ means[u]=0; cnt[u]=0; tot[u]=0; });
        for(var k=0;k<n;k++){ tot[GRADES[k]]+=SCORES2[k]; cnt[GRADES[k]]++; }
        uniq.forEach(function(u){ means[u]=tot[u]/cnt[u]; });
        var maxM=Math.max.apply(null, uniq.map(function(u){return means[u];}));
        var by3=H*0.20, bw=gw*0.6;
        uniq.forEach(function(u,idx){
          var y=by3+idx*54, col3=u==='A'?ROS:(u==='B'?BLU:GLD);
          ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText(u+' (n='+cnt[u]+')', gx, y+16);
          ctx.fillStyle='rgba(255,255,255,0.06)'; roundRect(ctx,gx+70,y,bw,22,5); ctx.fill();
          ctx.fillStyle=col3; roundRect(ctx,gx+70,y,bw*(means[u]/maxM/1.05),22,5); ctx.fill();
          ctx.fillStyle=col3; ctx.font='600 13px ui-monospace,monospace'; ctx.fillText(fmt2(means[u]), gx+76+bw, y+16);
        });
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif'; ctx.fillText('각 막대는 해당 등급 학생들의 실제 평균 점수입니다.', gx, by3+54*3+14);
      } else {
        ctx.fillStyle=ROS; ctx.font='600 14px sans-serif'; ctx.fillText('순서형 카테고리 — 뜻대로 정렬되게', gx, H*0.13);
        var alpha=SIZES.slice().sort();
        var ranked=SIZES.slice().sort(function(a,b){ return SIZE_RANK[a]-SIZE_RANK[b]; });
        ctx.textAlign='left';
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('원본 sizes = ['+SIZES.join(', ')+']', gx, H*0.20);
        ctx.fillStyle=RED; ctx.font='12.5px sans-serif'; ctx.fillText('알파벳순 정렬 (문자열 기본)', gx, H*0.20+30);
        ctx.fillStyle=RED; ctx.font='600 15px ui-monospace,monospace'; ctx.fillText(alpha.join(' < '), gx, H*0.20+52);
        ctx.fillStyle=GRN; ctx.font='12.5px sans-serif'; ctx.fillText('ordered=True 순서형 정렬 (뜻대로: S<M<L<XL)', gx, H*0.20+86);
        ctx.fillStyle=GRN; ctx.font='600 15px ui-monospace,monospace'; ctx.fillText(ranked.join(' < '), gx, H*0.20+108);
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif'; ctx.fillText('문자열 그대로면 L이 M보다 앞서는 오정렬 — 범주에 순서를 새기면 바로잡힙니다.', gx, H*0.20+138);
      }
      E.tapHint(W/2, H*0.97, '화면 탭 = 다음 (object → category 코드/메모리 → groupby → 순서형)', true);
      E.big('Categorical — 반복되는 문자열을 코드로', '값이 몇 가지 범주 안에서만 반복될 때(성적 등급, 사이즈, 지역명…) 문자열을 그대로 두면 같은 글자를 계속 새로 저장하는 셈입니다. category dtype은 실제 값 대신 작은 정수 코드를 저장하고 실제 문자열은 사전에 딱 한 번만 둡니다 — 메모리가 줄고, groupby 집계가 빨라지고, ordered=True로 ‘뜻이 있는 순서’까지 부여할 수 있습니다.'); }
  },

  // ══════════ 4. 표의 탄생 — Series와 DataFrame ══════════
  { id:'bda2_04',
    enter:function(E){ var self=this; this.s={col:0};
      var labels=['name (object)','age (int/float)','score (float)','pass (bool/object)'];
      E.controls('<div class="ctrl"><label>열 선택</label><input type="range" id="cl" min="0" max="3" step="1" value="0"><output id="clo">name (object)</output></div>');
      E.bind('#cl','input',function(e){ self.s.col=+e.target.value; document.getElementById('clo').textContent=labels[self.s.col]; E.blip(340+self.s.col*70,0.06); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'df = pd.DataFrame({', hl:'DataFrame'},
        {t:'  "name": names,  "age": ages,', hl:'name'},
        {t:'  "score": scores, "pass": passed', dim:true},
        {t:'})', dim:true},
        {t:'df["age"]          # Series (1차원)', hl:'Series'},
        {t:'df.index, df.columns', hl:'index'},
        {t:'col = df.iloc[:, k]', hl:'iloc'},
        {t:'col.dtype', hl:'dtype'},
        {t:'col.isna().sum()', hl:'isna'},
        {t:'col.describe()', hl:'describe'}
      ];
      var act=[6,7,8,9][s.col];
      var codeBot=codePanel(E, W*0.04, H*0.045, W*0.44, code, 'table.py', act);

      var cols=[
        {name:'name', data:NAMES, isNum:false},
        {name:'age', data:AGES, isNum:true},
        {name:'score', data:SCORES3, isNum:true},
        {name:'pass', data:PASS, isNum:false, bool:true}
      ];
      var rows=NAMES.length;
      var tx=W*0.51, ty0=H*0.08, tw=W*0.46;
      var colW=[tw*0.30, tw*0.22, tw*0.24, tw*0.24];
      var colX=[tx, tx+colW[0], tx+colW[0]+colW[1], tx+colW[0]+colW[1]+colW[2]];
      var rh=Math.min(24, (H*0.58)/(rows+1));

      // 헤더
      ctx.font='600 12px ui-monospace,monospace';
      for(var c=0;c<4;c++){
        var hl=(c===s.col);
        ctx.fillStyle=hl?'rgba(255,122,184,0.20)':'rgba(255,255,255,0.05)'; ctx.fillRect(colX[c],ty0,colW[c]-2,rh);
        ctx.strokeStyle=hl?ROS:'rgba(255,255,255,0.15)'; ctx.lineWidth=hl?1.8:1; ctx.strokeRect(colX[c],ty0,colW[c]-2,rh);
        ctx.fillStyle=hl?ROS:DIM; ctx.textAlign='left'; ctx.fillText(cols[c].name, colX[c]+6, ty0+rh*0.68);
      }
      // 행
      for(var r=0;r<rows;r++){
        var ry=ty0+rh*(r+1);
        for(c=0;c<4;c++){
          var hl2=(c===s.col);
          var v=cols[c].data[r];
          var disp = (v===null) ? 'NaN' : (cols[c].bool ? (v?'True':'False') : v);
          ctx.fillStyle=hl2?'rgba(255,122,184,0.08)':'rgba(255,255,255,0.02)'; ctx.fillRect(colX[c],ry,colW[c]-2,rh);
          ctx.strokeStyle=hl2?'rgba(255,122,184,0.5)':'rgba(255,255,255,0.08)'; ctx.lineWidth=1; ctx.strokeRect(colX[c],ry,colW[c]-2,rh);
          ctx.fillStyle=(v===null)?RED:'#e8e0c8'; ctx.font='11.5px ui-monospace,monospace'; ctx.fillText(''+disp, colX[c]+6, ry+rh*0.68);
        }
        // 인덱스
        ctx.fillStyle=DIM; ctx.font='10.5px ui-monospace,monospace'; ctx.textAlign='right'; ctx.fillText(''+r, tx-4, ry+rh*0.68); ctx.textAlign='left';
      }

      // 실제 계산: 선택 열 통계 (골든룰)
      var sel=cols[s.col];
      var missCnt=sel.data.filter(function(v){ return v===null; }).length;
      var present=sel.data.filter(function(v){ return v!==null; });
      var dtype;
      if(s.col===0) dtype='object';
      else if(s.col===1) dtype = (missCnt>0) ? 'float64' : 'int64';
      else if(s.col===2) dtype='float64';
      else dtype = (missCnt>0) ? 'object' : 'bool';

      var sy=ty0+rh*(rows+1)+14;
      ctx.textAlign='left';
      ctx.fillStyle=ROS; ctx.font='600 13px sans-serif'; ctx.fillText('선택한 열 — '+sel.name, tx, sy);
      ctx.fillStyle=GLD; ctx.font='600 12px ui-monospace,monospace'; ctx.fillText('dtype = '+dtype, tx, sy+19);
      ctx.fillStyle=(missCnt>0?RED:GRN); ctx.font='600 12px ui-monospace,monospace'; ctx.fillText('결측 = '+missCnt+' / '+sel.data.length, tx, sy+37);
      if(sel.isNum){
        var nums=present.map(Number);
        var mn=Math.min.apply(null,nums), mx=Math.max.apply(null,nums), av=mean(nums);
        ctx.fillStyle=GRN; ctx.font='600 12px ui-monospace,monospace'; ctx.fillText('min='+fmt1(mn)+'  max='+fmt1(mx)+'  mean='+fmt1(av), tx, sy+55);
      } else if(sel.bool){
        var t=present.filter(function(v){return v===true;}).length, f=present.filter(function(v){return v===false;}).length;
        ctx.fillStyle=GRN; ctx.font='600 12px ui-monospace,monospace'; ctx.fillText('True='+t+'  False='+f, tx, sy+55);
      } else {
        var uniqCnt=Array.from(new Set(present)).length;
        ctx.fillStyle=GRN; ctx.font='600 12px ui-monospace,monospace'; ctx.fillText('고유값 '+uniqCnt+'개 (전부 다른 이름)', tx, sy+55);
      }
      E.tapHint(W/2, H*0.95, '슬라이더로 열을 바꿔, dtype·결측·요약통계가 실시간으로', true);
      E.big('Series와 DataFrame — 표의 뼈대', '인덱스가 붙은 값 하나짜리 열이 Series, 그 Series 여러 개가 같은 인덱스로 나란히 붙으면 DataFrame입니다. 행(index)·열(columns)·각 칸의 타입(dtype)이 표의 전부죠. 흥미로운 점 — 정수 열에 결측(NaN)이 하나라도 섞이면 pandas는 그 열 전체를 float64로 승격시킵니다(정수는 NaN을 표현할 수 없어서). 슬라이더로 열을 바꿔가며 그 규칙을 직접 확인해 보세요.'); }
  },

  // ══════════ 5. 타입을 확인하고 바꾸기 — dtype·변환 ══════════
  { id:'bda2_05',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(350+this.s.step*90,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'price = ["12.5","7","NA",', hl:'price'},
        {t:'         "30.2","oops","5.0","19"]', dim:true},
        {t:'', dim:true},
        {t:'price.astype(float)', hl:'astype'},
        {t:'  # ValueError: "NA" fails', hl:'ValueError'},
        {t:'', dim:true},
        {t:'pd.to_numeric(price,', hl:'to_numeric'},
        {t:'              errors="coerce")', hl:'"coerce"'},
        {t:'  # 실패한 값만 NaN으로', hl:'NaN'}
      ];
      var act=[3,6,8][s.step];
      var codeBot=codePanel(E, W*0.04, H*0.10, W*0.46, code, 'convert.py', act);
      var gx=W*0.53, gw=W*0.43;
      ctx.textAlign='left';

      var VALID_RE=/^-?\d+(\.\d+)?$/;
      var validity = PRICE_STR.map(function(s2){ return VALID_RE.test(s2); });
      var firstBad = validity.indexOf(false);
      var coerced = PRICE_STR.map(function(s2){ return VALID_RE.test(s2) ? parseFloat(s2) : NaN; });
      var validCnt = validity.filter(Boolean).length;

      if(s.step===0){
        ctx.fillStyle=ROS; ctx.font='600 14px sans-serif'; ctx.fillText('astype(float) — 하나라도 어긋나면 전부 실패', gx, H*0.14);
        var ry=H*0.20, cw=Math.min(58,(gw-30)/PRICE_STR.length);
        for(var i=0;i<PRICE_STR.length;i++){
          var bx=gx+i*(cw+5), bad=!validity[i], stopped=(i===firstBad);
          ctx.fillStyle=bad?'rgba(240,136,138,0.18)':'rgba(255,255,255,0.04)'; ctx.strokeStyle=stopped?RED:(bad?RED:DIM); ctx.lineWidth=stopped?2.2:1.1;
          roundRect(ctx,bx,ry,cw,38,6); ctx.fill(); ctx.stroke();
          ctx.fillStyle=bad?RED:'#e8e0c8'; ctx.font='12px ui-monospace,monospace'; ctx.textAlign='center'; ctx.fillText('"'+PRICE_STR[i]+'"', bx+cw/2, ry+24);
          if(stopped){ ctx.fillStyle=RED; ctx.font='10px sans-serif'; ctx.fillText('여기서 중단', bx+cw/2, ry+52); }
        }
        ctx.textAlign='left';
        ctx.fillStyle=RED; ctx.font='600 14px ui-monospace,monospace'; ctx.fillText('→ ValueError — 파이프라인 전체가 멈춥니다 (0개 처리)', gx, ry+80);
      } else if(s.step===1){
        ctx.fillStyle=ROS; ctx.font='600 14px sans-serif'; ctx.fillText('to_numeric(errors="coerce") — 실패만 NaN', gx, H*0.14);
        var ry2=H*0.20, cw2=Math.min(58,(gw-30)/PRICE_STR.length);
        for(var j=0;j<PRICE_STR.length;j++){
          var bx2=gx+j*(cw2+5), ok=validity[j];
          ctx.fillStyle=ok?'rgba(126,224,176,0.12)':'rgba(240,136,138,0.14)'; ctx.strokeStyle=ok?GRN:RED; ctx.lineWidth=1.3;
          roundRect(ctx,bx2,ry2,cw2,50,6); ctx.fill(); ctx.stroke();
          ctx.fillStyle=DIM; ctx.font='10px ui-monospace,monospace'; ctx.textAlign='center'; ctx.fillText('"'+PRICE_STR[j]+'"', bx2+cw2/2, ry2+16);
          ctx.fillStyle=ok?GRN:RED; ctx.font='600 12px ui-monospace,monospace'; ctx.fillText(ok?fmt1(coerced[j]):'NaN', bx2+cw2/2, ry2+38);
        }
        ctx.textAlign='left';
        ctx.fillStyle=GRN; ctx.font='600 14px ui-monospace,monospace'; ctx.fillText('성공 '+validCnt+' / '+PRICE_STR.length+' — 나머지는 NaN으로, 파이프라인은 계속', gx, ry2+72);
      } else {
        ctx.fillStyle=ROS; ctx.font='600 14px sans-serif'; ctx.fillText('변환 전후 비교 (실측)', gx, H*0.14);
        var n=PRICE_STR.length;
        var lens=PRICE_STR.map(function(s3){ return s3.length; });
        var objBytes=0; for(var k=0;k<n;k++) objBytes += 8 + (49+lens[k]);
        var floatBytes = n*8;
        var by3=H*0.22, bw=gw;
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('object (문자열 '+n+'개, 평균 길이 '+fmt1(mean(lens))+'자)', gx, by3-6);
        ctx.fillStyle='rgba(255,122,184,0.16)'; ctx.strokeStyle=ROS; ctx.lineWidth=1.4; roundRect(ctx,gx,by3,bw,32,6); ctx.fill(); ctx.stroke();
        ctx.fillStyle=ROS; ctx.font='600 13px ui-monospace,monospace'; ctx.fillText(objBytes+' bytes', gx+10, by3+21);
        var by4=by3+58;
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('float64 ('+n+'개 × 8B)', gx, by4-6);
        ctx.fillStyle='rgba(126,224,176,0.16)'; ctx.strokeStyle=GRN; ctx.lineWidth=1.4; roundRect(ctx,gx,by4,bw*(floatBytes/objBytes),32,6); ctx.fill(); ctx.stroke();
        ctx.fillStyle=GRN; ctx.font='600 13px ui-monospace,monospace'; ctx.fillText(floatBytes+' bytes', gx+10, by4+21);
        var accPct = Math.round(validCnt/n*100);
        ctx.fillStyle=GLD; ctx.font='600 14px ui-monospace,monospace'; ctx.fillText('coerce 정확도: '+validCnt+'/'+n+' = '+accPct+'% 보존, 나머지는 NaN으로 표시', gx, by4+58);
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif'; ctx.fillText('astype(float)이었다면 애초에 0% — 예외로 전체가 멈췄을 것입니다.', gx, by4+80);
      }
      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (astype 실패 → coerce 안전변환 → 비교)', true);
      E.big('dtype 확인과 안전한 변환', '외부에서 들어온 데이터는 숫자처럼 보여도 문자열(object)인 경우가 흔합니다. astype(float)은 형식이 딱 맞을 때만 통하는 빡빡한 변환이라, "NA"·"oops" 같은 값 하나에 전체가 예외로 멈춥니다. to_numeric(errors="coerce")는 파싱 가능한 값만 살리고 나머지를 NaN으로 표시해, 파이프라인이 끊기지 않게 합니다 — 이후 dropna·fillna로 그 NaN을 어떻게 다룰지는 분석가의 몫입니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
