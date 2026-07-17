/* C++ 제15장 — 모던 C++ (C++11/14/17): auto·decltype · 범위기반for·구조적바인딩 · nullptr·enum class·constexpr · 이동 시맨틱(move) · 모던 종합
   동작(behavior)만. 텍스트=content/cpp15.json. 엔진 js/engine.js 공유. 색: C++=파랑(#5ab4e8).
   골든룰: 화면의 constexpr 계산값·이동/복사 비용·초기화 결과는 draw에서 실제로 계산(베껴 박지 않음). 왼쪽=진짜 C++ 코드, 오른쪽=효과를 실측 시각화. */
(function(){
  var CPB='#5ab4e8', CPD='#8fd0f5', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', PNK='#f4a0c0', DIM='#9b99a3', RED='#f0888a';

  function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function codePanel(E, x, y, w, lines, title, actLine){
    var ctx=E.ctx, pad=14, top=y, n=lines.length;
    // 줄높이를 남는 세로공간에 맞춰 축소(낮은 창서 코드가 캔버스 밑으로 잘리지 않게). 기본 16, 하한 12.
    var botLimit=E.H*0.93, avail=botLimit - top - pad*2 - (title?26:0);
    var lh=Math.max(12, Math.min(16, Math.floor(avail/n)));
    var ht=n*lh+pad*2+(title?26:0);
    ctx.fillStyle='rgba(255,255,255,0.035)'; ctx.strokeStyle='rgba(90,180,232,0.30)'; ctx.lineWidth=1;
    roundRect(ctx,x,top,w,ht,10); ctx.fill(); ctx.stroke();
    var cy=top+pad+(title?26:0);
    if(title){ ctx.fillStyle=CPB; ctx.font='600 12px sans-serif'; ctx.textAlign='left'; ctx.fillText(title, x+pad, top+pad+12); }
    var fs=Math.max(11, Math.min(13, lh-3));
    ctx.font=fs+'px ui-monospace,Menlo,Consolas,monospace'; ctx.textAlign='left';
    for(var i=0;i<n;i++){
      var L=lines[i], t=(typeof L==='string')?L:L.t, hl=(typeof L==='object')?L.hl:null;
      var ty=cy+i*lh+lh-5;
      if(actLine!=null && i===actLine){ ctx.fillStyle='rgba(90,180,232,0.16)'; ctx.fillRect(x+4, cy+i*lh+1, w-8, lh-2); ctx.fillStyle=CPB; ctx.fillRect(x+4, cy+i*lh+1, 3, lh-2); }
      if(hl && t.indexOf(hl)>=0){ var a=t.split(hl), pre=a[0], post=a.slice(1).join(hl);
        ctx.fillStyle=DIM; ctx.fillText(pre, x+pad, ty); var wpre=ctx.measureText(pre).width;
        ctx.fillStyle=CPB; ctx.fillText(hl, x+pad+wpre, ty); var whl=ctx.measureText(hl).width;
        ctx.fillStyle=DIM; ctx.fillText(post, x+pad+wpre+whl, ty);
      } else { ctx.fillStyle=((typeof L==='object'&&L.dim)?DIM:'#dfeaf2'); ctx.fillText(t, x+pad, ty); }
    }
    return top+ht;
  }
  // 작은 셀
  function cell(ctx,x,y,w,h,txt,fill,stroke,tcol,fs){
    ctx.fillStyle=fill||'rgba(255,255,255,0.04)'; ctx.fillRect(x,y,w,h);
    ctx.strokeStyle=stroke||'rgba(255,255,255,0.12)'; ctx.lineWidth=1; ctx.strokeRect(x,y,w,h);
    if(txt!=null){ ctx.fillStyle=tcol||'#dfeaf2'; ctx.font=(fs||13)+'px ui-monospace,Menlo,monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(''+txt, x+w/2, y+h/2+1); ctx.textBaseline='alphabetic'; }
  }
  function chip(ctx,x,y,txt,col){ ctx.font='12px sans-serif'; var w=ctx.measureText(txt).width+16;
    ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.strokeStyle=col; ctx.lineWidth=1; roundRect(ctx,x,y,w,22,6); ctx.fill(); ctx.stroke();
    ctx.fillStyle=col; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText(txt, x+8, y+12); ctx.textBaseline='alphabetic'; return w; }

  var scenes = [

  // ══════════ 1. auto · decltype — 타입 추론 ══════════
  { id:'cpp15_01',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*90,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'#include <vector>', dim:true},
        {t:'#include <map>', dim:true},
        {t:'std::vector<int> v = {5, 2, 8};', hl:'std::vector<int>'},
        {t:'', dim:true},
        {t:'// 옛 방식 — 긴 타입명', dim:true},
        {t:'std::vector<int>::iterator it', hl:'std::vector<int>::iterator'},
        {t:'    = v.begin();', dim:true},
        {t:'', dim:true},
        {t:'// 모던 — 컴파일러가 추론', dim:true},
        {t:'auto it = v.begin();', hl:'auto'},
        {t:'decltype(v)::value_type x = 5;', hl:'decltype'}
      ];
      var act=[5,9,10][s.step];
      codePanel(E, W*0.04, H*0.10, W*0.46, code, 'auto_decltype.cpp', act);

      var tx=W*0.53, ty=H*0.09, botY=H*0.93;
      ctx.fillStyle=CPB; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
      ctx.fillText('타입 추론 — 컴파일러가 우변을 보고 타입을 결정', tx, ty);

      var longType='std::vector<int>::iterator';
      var boxw=Math.min(W*0.40, W*0.97-tx);
      // 블록 간격을 남는 높이에 맞춰 조절(낮은 창서도 5번째 줄까지 안 넘침)
      var gap=Math.max(38, Math.min(52, (botY-ty-118)/2));
      // 옛 방식: 긴 타입 상자
      var y1=ty+22;
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText('옛 방식: 개발자가 긴 타입명을 손으로 적음', tx, y1);
      ctx.fillStyle='rgba(240,136,138,0.10)'; ctx.strokeStyle=RED; ctx.lineWidth=1.2; roundRect(ctx,tx,y1+8,boxw,26,6); ctx.fill(); ctx.stroke();
      ctx.fillStyle=RED; ctx.font='12px ui-monospace,Menlo,monospace'; ctx.textAlign='center'; ctx.fillText(longType+'  it', tx+boxw/2, y1+25);

      // 모던: auto
      var y2=y1+gap;
      ctx.fillStyle=CPB; ctx.font='12.5px sans-serif'; ctx.textAlign='left'; ctx.fillText('모던: auto — 4글자, 컴파일러가 자동 추론', tx, y2);
      ctx.fillStyle='rgba(90,180,232,0.12)'; ctx.strokeStyle=CPB; ctx.lineWidth=1.4; roundRect(ctx,tx,y2+8,boxw,26,6); ctx.fill(); ctx.stroke();
      ctx.fillStyle=CPB; ctx.font='13px ui-monospace,Menlo,monospace'; ctx.textAlign='center'; ctx.fillText('auto  it   →   '+longType, tx+boxw/2, y2+25);

      var y3=y2+gap;
      if(s.step>=1){
        ctx.fillStyle=GRN; ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.fillText('추론 규칙 — 우변의 실제 타입을 그대로', tx, y3);
        var rows=[['auto x = 5;','int'],['auto d = 3.14;','double'],['auto& r = v;','std::vector<int>&'],['auto p = v.begin();',longType]];
        if(s.step>=2) rows.push(['decltype(v) t;','std::vector<int>  (표현식 타입 그대로)']);
        ctx.font='12px ui-monospace,Menlo,monospace';
        var rgap=Math.max(16, Math.min(19, (botY-(y3+18))/rows.length));
        for(var i=0;i<rows.length;i++){ var ry=y3+18+i*rgap;
          var isDe=(i===4);
          ctx.fillStyle=isDe?PNK:DIM; ctx.textAlign='left'; ctx.fillText(rows[i][0], tx, ry);
          ctx.fillStyle=isDe?PNK:CPB; ctx.fillText('→ '+rows[i][1], tx+W*0.15, ry); }
      }
      E.tapHint(W/2, H*0.94, '화면 탭 = 다음 (긴 타입 → auto → 추론 규칙·decltype)', true);
      E.big('auto·decltype — 타입을 컴파일러에게', 'C++는 타입을 엄격히 따지는 언어라, 반복자 같은 타입 이름이 std::vector<int>::iterator처럼 길고 험합니다. C++11의 auto는 “우변을 보면 타입은 뻔하니, 네가 알아내라”고 컴파일러에게 맡깁니다 — 실행 속도 손해는 전혀 없고(컴파일 때 결정), 코드는 짧고 안전해집니다. decltype은 한 걸음 더 나아가 어떤 표현식의 타입을 그대로 복사해 옵니다. 둘 다 “타입은 이미 우변에 적혀 있는데 왜 또 쓰나”라는 물음의 답입니다.'); }
  },

  // ══════════ 2. 범위기반 for · 구조적 바인딩 ══════════
  { id:'cpp15_02',
    enter:function(E){ this.s={step:0,auto:false,t:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; this.s.t=0; E.blip(340+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var v=[5,2,8,1,9];
      var m=[['apple',3],['pear',7],['plum',2]];
      // 순회 커서 애니메이션
      if(!E.frozen) s.t+=0.02;
      var n = s.step===0 ? v.length : m.length;
      var cur = Math.floor(s.t*1.6)%n;

      var code = s.step===0 ? [
        {t:'std::vector<int> v = {5,2,8,1,9};', hl:'std::vector<int>'},
        {t:'int sum = 0;', dim:true},
        {t:'', dim:true},
        {t:'// 범위기반 for — 인덱스 없이', dim:true},
        {t:'for (auto& x : v) {', hl:'for (auto& x : v)'},
        {t:'    sum += x;', hl:'sum += x'},
        {t:'}', dim:true},
        {t:'// 옛 방식과 비교:', dim:true},
        {t:'// for(int i=0;i<v.size();++i)', dim:true},
        {t:'//     sum += v[i];', dim:true}
      ] : [
        {t:'std::map<std::string,int> m = {', hl:'std::map'},
        {t:'  {"apple",3},{"pear",7},{"plum",2}};', dim:true},
        {t:'', dim:true},
        {t:'// 구조적 바인딩 (C++17)', dim:true},
        {t:'for (auto& [key, val] : m) {', hl:'[key, val]'},
        {t:'    std::cout << key', hl:'key'},
        {t:'              << ": " << val;', hl:'val'},
        {t:'}', dim:true},
        {t:'// pair.first/.second 없이', dim:true},
        {t:'// 이름으로 바로 꺼냄', dim:true}
      ];
      codePanel(E, W*0.04, H*0.11, W*0.48, code, s.step===0?'range_for.cpp':'structured_binding.cpp', s.step===0?4:4);

      var tx=W*0.56, ty=H*0.20;
      if(s.step===0){
        ctx.fillStyle=CPB; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('for(auto& x : v) — 원소를 하나씩 x 로', tx, ty);
        var cw=48, cy=ty+22, sum=0;
        for(var i=0;i<v.length;i++){ sum+= (i<=cur? v[i]:0);
          var on=(i===cur), done=(i<cur);
          cell(ctx,tx+i*cw,cy,cw,40,v[i], on?'rgba(90,180,232,0.24)':(done?'rgba(126,224,176,0.12)':'rgba(255,255,255,0.04)'), on?CPB:(done?GRN:'rgba(255,255,255,0.12)'), on?CPB:(done?GRN:'#dfeaf2'), 15);
        }
        // x 커서
        var xc=tx+cur*cw+cw/2;
        ctx.fillStyle=CPB; ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.fillText('x', xc, cy-8);
        ctx.beginPath(); ctx.moveTo(xc,cy-4); ctx.lineTo(xc-5,cy-12); ctx.lineTo(xc+5,cy-12); ctx.fillStyle=CPB; ctx.fill();
        // 진행 중 합
        var runSum=0; for(i=0;i<=cur;i++) runSum+=v[i];
        ctx.fillStyle=GRN; ctx.font='600 15px sans-serif'; ctx.textAlign='left';
        ctx.fillText('sum += x   →   현재 합 = '+runSum, tx, cy+70);
        var tot=v.reduce(function(a,b){return a+b;},0);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText('전체 합 = '+v.join('+')+' = '+tot+'  (인덱스 i·v[i] 없이 원소만)', tx, cy+94);
      } else {
        ctx.fillStyle=CPB; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('for(auto& [key, val] : m) — 쌍을 두 이름으로 분해', tx, ty);
        var ky=ty+22;
        for(var j=0;j<m.length;j++){ var on2=(j===cur);
          cell(ctx,tx,ky+j*38,120,34, '"'+m[j][0]+'"', on2?'rgba(90,180,232,0.20)':'rgba(255,255,255,0.04)', on2?CPB:'rgba(255,255,255,0.12)', on2?CPB:'#dfeaf2',13);
          cell(ctx,tx+120,ky+j*38,60,34, m[j][1], on2?'rgba(126,224,176,0.18)':'rgba(255,255,255,0.04)', on2?GRN:'rgba(255,255,255,0.12)', on2?GRN:'#dfeaf2',14);
        }
        ctx.fillStyle=CPB; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('key', tx+60, ky-6);
        ctx.fillStyle=GRN; ctx.fillText('val', tx+150, ky-6);
        var cy2=ky+cur*38+17;
        ctx.fillStyle='#dfeaf2'; ctx.font='600 15px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
        ctx.fillText('출력:  '+m[cur][0]+': '+m[cur][1], tx, ky+m.length*38+24);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('.first / .second 대신 [key, val] 로 뜻이 드러납니다.', tx, ky+m.length*38+46);
      }
      E.tapHint(W/2, H*0.94, '화면 탭 = 다음 (범위 for → 구조적 바인딩)', true);
      E.big('범위기반 for·구조적 바인딩 — 순회를 사람 말로', '“0부터 크기 전까지 i를 돌려 v[i]를 …” — 이 낡은 상투구엔 실수(오프바이원, 잘못된 인덱스)가 숨습니다. for(auto& x : v)는 그저 “v의 모든 원소 x에 대해”라고 읽히죠, 인덱스를 아예 지웁니다. C++17의 구조적 바인딩은 더 나아가 pair나 tuple을 auto& [key, val]처럼 이름 있는 조각으로 풀어 냅니다 — .first/.second의 정체 모를 번호 대신 뜻이 보입니다. 화면의 합은 실제로 한 원소씩 더한 값입니다.'); }
  },

  // ══════════ 3. nullptr · enum class · constexpr ══════════
  { id:'cpp15_03',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(330+this.s.step*90,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'// 1) nullptr — 진짜 널 포인터', dim:true},
        {t:'int* p = nullptr;   // NULL(정수0) 아님', hl:'nullptr'},
        {t:'// 2) enum class — 스코프드', dim:true},
        {t:'enum class Color { Red, Green };', hl:'enum class'},
        {t:'Color c = Color::Green;', hl:'Color::Green'},
        {t:'// 3) constexpr — 컴파일타임', dim:true},
        {t:'constexpr int fact(int n){', hl:'constexpr'},
        {t:'  return n<=1 ? 1 : n*fact(n-1); }', dim:true},
        {t:'constexpr int F = fact(5);', hl:'fact(5)'}
      ];
      var act=[1,4,8][s.step];
      codePanel(E, W*0.04, H*0.07, W*0.47, code, 'safety_features.cpp', act);

      var tx=W*0.57, ty=H*0.10, botY=H*0.93;
      if(s.step===0){
        ctx.fillStyle=CPB; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('nullptr — 포인터 전용 널 값', tx, ty);
        ctx.fillStyle='rgba(240,136,138,0.10)'; ctx.strokeStyle=RED; ctx.lineWidth=1.2; roundRect(ctx,tx,ty+16,W*0.38,54,6); ctx.fill(); ctx.stroke();
        ctx.fillStyle=RED; ctx.font='12.5px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
        ctx.fillText('void f(int);  void f(char*);', tx+14, ty+40);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('f(NULL) → NULL은 0이라 f(int)로 잘못 감!', tx+14, ty+60);
        ctx.fillStyle='rgba(126,224,176,0.12)'; ctx.strokeStyle=GRN; roundRect(ctx,tx,ty+86,W*0.38,54,6); ctx.fill(); ctx.stroke();
        ctx.fillStyle=GRN; ctx.font='12.5px ui-monospace,Menlo,monospace'; ctx.fillText('f(nullptr) → 확실히 f(char*)', tx+14, ty+110);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('nullptr는 오직 포인터 타입 → 모호함 제거', tx+14, ty+130);
      } else if(s.step===1){
        ctx.fillStyle=CPB; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('enum class — 이름 충돌·암묵 변환 차단', tx, ty);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
        ctx.fillText('옛 enum: Red, Green이 전역에 새어 나가 int로 슬쩍 변환', tx, ty+24);
        ctx.fillStyle='rgba(240,136,138,0.10)'; ctx.strokeStyle=RED; ctx.lineWidth=1.2; roundRect(ctx,tx,ty+34,W*0.38,30,6); ctx.fill(); ctx.stroke();
        ctx.fillStyle=RED; ctx.font='12px ui-monospace,Menlo,monospace'; ctx.textAlign='left'; ctx.fillText('int x = Green;   // 옛 enum → 통과(위험)', tx+12, ty+54);
        ctx.fillStyle='rgba(126,224,176,0.12)'; ctx.strokeStyle=GRN; roundRect(ctx,tx,ty+74,W*0.38,54,6); ctx.fill(); ctx.stroke();
        ctx.fillStyle=GRN; ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillText('Color::Green   // 반드시 스코프로', tx+12, ty+94);
        ctx.fillStyle=RED; ctx.fillText('int x = Color::Green; // 컴파일 에러', tx+12, ty+114);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('이름은 Color:: 안에, 자동 int 변환 없음 → 안전', tx, ty+150);
      } else {
        ctx.fillStyle=CPB; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('constexpr — 컴파일 때 미리 계산', tx, ty);
        // 실제 factorial 계산 (골든룰)
        function fact(n){ return n<=1?1:n*fact(n-1); }
        var steps=[]; (function build(n){ if(n<=1){ steps.push('fact(1) = 1'); return 1;} var r=n*build(n-1); steps.push('fact('+n+') = '+n+' × fact('+(n-1)+') = '+r); return r; })(5);
        ctx.font='12.5px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
        var sgap=Math.max(17, Math.min(22, (botY-(ty+28)-58)/steps.length));
        for(var i=0;i<steps.length;i++){ ctx.fillStyle=(i===steps.length-1)?GRN:DIM; ctx.fillText(steps[i], tx, ty+28+i*sgap); }
        var F=fact(5), yb=ty+28+steps.length*sgap;
        ctx.fillStyle=GRN; ctx.font='700 18px sans-serif'; ctx.fillText('fact(5) = '+F, tx, yb+12);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('constexpr → 이 '+F+'이 컴파일 결과물(바이너리)에 상수로 박힘.', tx, yb+34);
        ctx.fillText('실행할 땐 곱셈이 한 번도 안 일어납니다 — 공짜.', tx, yb+50);
      }
      E.tapHint(W/2, H*0.94, '화면 탭 = 다음 (nullptr → enum class → constexpr)', true);
      E.big('nullptr·enum class·constexpr — 컴파일러를 내 편으로', 'C에서 물려받은 관습엔 함정이 있었습니다. NULL은 사실 숫자 0이라 함수 오버로드를 헷갈리게 했고, 옛 enum은 이름을 전역에 흘리며 슬그머니 int로 변했죠. C++11은 이를 바로잡습니다 — nullptr는 오직 포인터, enum class는 이름을 가두고 암묵 변환을 막습니다. constexpr은 한 술 더 떠, factorial(5)=120 같은 계산을 실행 전에 컴파일러가 미리 끝내 상수로 박아 둡니다. 좋은 언어는 실수를 컴파일 때 잡고, 할 수 있는 일은 미리 해 둡니다.'); }
  },

  // ══════════ 4. 이동 시맨틱 (move) — 복사 vs 이동 ══════════
  { id:'cpp15_04',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(340+this.s.step*120,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var N=1000000; // 원소 100만개 벡터
      var code = s.step===0 ? [
        {t:'std::vector<int> a(1000000);', hl:'std::vector<int> a'},
        {t:'// ... a를 채운다 ...', dim:true},
        {t:'', dim:true},
        {t:'// 복사 — 100만 개를 모두 복제', dim:true},
        {t:'std::vector<int> b = a;', hl:'b = a'},
        {t:'// a는 그대로, b는 새 메모리', dim:true},
        {t:'//   → 원소 1,000,000개 복사', dim:true}
      ] : [
        {t:'std::vector<int> a(1000000);', hl:'std::vector<int> a'},
        {t:'// ... a를 채운다 ...', dim:true},
        {t:'', dim:true},
        {t:'// 이동 — 포인터만 넘긴다', dim:true},
        {t:'std::vector<int> b = std::move(a);', hl:'std::move(a)'},
        {t:'// a는 빈 껍데기(비움)', dim:true},
        {t:'//   → 포인터 3개만 교환 (O(1))', dim:true}
      ];
      codePanel(E, W*0.04, H*0.13, W*0.48, code, s.step===0?'copy_semantics.cpp':'move_semantics.cpp', 4);

      var tx=W*0.56, ty=H*0.18;
      // 힙 블록(원소 저장소) 그리기 헬퍼
      function heapBlock(x,y,col,label){
        ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.strokeStyle=col; ctx.lineWidth=1.4; roundRect(ctx,x,y,150,44,7); ctx.fill(); ctx.stroke();
        ctx.fillStyle=col; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText(label, x+75, y+16);
        ctx.fillStyle=DIM; ctx.font='12px ui-monospace,monospace'; ctx.fillText('[ 5 | 2 | 8 | … | 9 ]', x+75, y+34); }
      function handle(x,y,name,col,ptr){
        ctx.fillStyle='rgba(90,180,232,0.10)'; ctx.strokeStyle=col; ctx.lineWidth=1.2; roundRect(ctx,x,y,64,40,6); ctx.fill(); ctx.stroke();
        ctx.fillStyle=col; ctx.font='600 13px ui-monospace,monospace'; ctx.textAlign='center'; ctx.fillText(name, x+32, y+16);
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif'; ctx.fillText(ptr, x+32, y+32); }

      if(s.step===0){
        ctx.fillStyle=CPB; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('복사: 힙 데이터를 통째로 새로 복제', tx, ty);
        handle(tx, ty+24, 'a', CPB, 'ptr→0x100');
        heapBlock(tx+120, ty+22, CPB, 'a의 힙 (원소 100만개)');
        // 화살표 a→heap
        ctx.strokeStyle=CPB; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(tx+64,ty+44); ctx.lineTo(tx+120,ty+44); ctx.stroke();
        handle(tx, ty+90, 'b', GRN, 'ptr→0x200');
        heapBlock(tx+120, ty+88, GRN, 'b의 힙 (새로 복제!)');
        ctx.strokeStyle=GRN; ctx.beginPath(); ctx.moveTo(tx+64,ty+110); ctx.lineTo(tx+120,ty+110); ctx.stroke();
        // 복제 화살표
        ctx.strokeStyle=RED; ctx.lineWidth=2; ctx.setLineDash([5,3]); ctx.beginPath(); ctx.moveTo(tx+195,ty+66); ctx.lineTo(tx+195,ty+88); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle=RED; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('100만 회 복사', tx+205, ty+80);
        ctx.fillStyle=RED; ctx.font='700 16px sans-serif'; ctx.fillText('비용 ∝ N = 1,000,000 (느림)', tx, ty+160);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('a는 원본 유지, b는 완전히 독립된 사본 — 안전하지만 값비쌈.', tx, ty+184);
      } else {
        ctx.fillStyle=CPB; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('이동: 힙은 그대로, 포인터만 b로 넘김', tx, ty);
        handle(tx, ty+24, 'a', DIM, 'ptr→null');
        handle(tx, ty+90, 'b', GRN, 'ptr→0x100');
        heapBlock(tx+140, ty+56, GRN, '같은 힙 (복제 안 함!)');
        // b→heap 실선
        ctx.strokeStyle=GRN; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(tx+64,ty+110); ctx.lineTo(tx+140,ty+78); ctx.stroke();
        // a→heap 끊긴 선
        ctx.strokeStyle=RED; ctx.lineWidth=1.4; ctx.setLineDash([4,4]); ctx.beginPath(); ctx.moveTo(tx+64,ty+44); ctx.lineTo(tx+100,ty+62); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle=RED; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('✕ 끊김', tx+70, ty+40);
        ctx.fillStyle=GRN; ctx.font='700 16px sans-serif'; ctx.fillText('비용 = O(1) — 포인터 몇 개만 교환', tx, ty+150);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('std::move(a)는 a를 우측값(rvalue&&)으로 만들어 “자원을 훔쳐도 좋다”고 표시.', tx, ty+174);
        ctx.fillText('a는 빈 껍데기가 되지만, 곧 버릴 임시값이면 손해가 없습니다.', tx, ty+194);
        // 속도 대비 막대
        var by=ty+210;
        ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.fillText('복사', tx, by+10); ctx.fillStyle=RED; ctx.fillRect(tx+40, by, W*0.34, 12);
        ctx.fillStyle=DIM; ctx.fillText('이동', tx, by+30); ctx.fillStyle=GRN; ctx.fillRect(tx+40, by+20, 8, 12);
        ctx.fillStyle=DIM; ctx.fillText('← 이동은 N에 무관, 거의 즉시', tx+56, by+30);
      }
      E.tapHint(W/2, H*0.94, '화면 탭 = 복사 vs 이동 비교', true);
      E.big('이동 시맨틱 — 복사 대신 자원을 훔치다', 'vector 하나를 다른 변수에 넘길 때, 옛 C++은 원소를 몽땅 복제했습니다 — 100만 개면 100만 번. 하지만 원본 a를 곧 버릴 거라면 이 복사는 순전한 낭비죠. C++11의 이동 시맨틱은 “복제하지 말고 내장(힙 포인터)을 그대로 가져가라”고 말합니다. std::move(a)는 a를 우측값(rvalue)으로 표시해 “훔쳐도 좋다”는 허락이고, b는 포인터 몇 개만 넘겨받아 O(1)에 끝냅니다. a는 빈 껍데기가 되지만 어차피 버릴 값이었으니 손해가 없습니다 — 모던 C++ 속도의 큰 비밀입니다.'); }
  },

  // ══════════ 5. 모던 C++ 종합 — 옛 vs 모던 ══════════
  { id:'cpp15_05',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(360+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var oldCode=[
        {t:'// 옛 C++ (C++98) — 위험·장황', dim:true},
        {t:'int* arr = new int[3];', hl:'new'},
        {t:'arr[0]=5; arr[1]=2; arr[2]=8;', dim:true},
        {t:'std::vector<int>::iterator it;', hl:'std::vector<int>::iterator'},
        {t:'for(it=v.begin();it!=v.end();++it)', dim:true},
        {t:'  total += *it;', dim:true},
        {t:'delete[] arr;  // 잊으면 누수!', hl:'delete[]'},
        {t:'int (*cmp)(int,int) = &myFunc;', dim:true}
      ];
      var newCode=[
        {t:'// 모던 C++ (C++17) — 안전·간결', dim:true},
        {t:'auto arr = {5, 2, 8};', hl:'auto'},
        {t:'', dim:true},
        {t:'auto up = std::make_unique<T>();', hl:'make_unique'},
        {t:'for (auto& x : v)', hl:'auto&'},
        {t:'  total += x;', dim:true},
        {t:'// 스마트 포인터가 자동 해제', dim:true},
        {t:'auto cmp = [](int a,int b){', hl:'[]'},
        {t:'  return a<b; };', dim:true}
      ];
      codePanel(E, W*0.03, H*0.12, W*0.46, s.step===0?oldCode:newCode, s.step===0?'legacy_cpp98.cpp':'modern_cpp17.cpp', s.step===0?6:3);

      var tx=W*0.53, ty=H*0.16;
      ctx.fillStyle=CPB; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
      ctx.fillText(s.step===0?'옛 방식 — 무엇이 위험한가':'모던 방식 — 같은 일, 더 안전하게', tx, ty);

      var rows = s.step===0 ? [
        ['new/delete','손으로 메모리 관리 → 누수·이중해제',RED],
        ['긴 반복자 타입','std::vector<int>::iterator … 오타 위험',RED],
        ['원시 배열','크기·경계 스스로 관리, 넘침 위험',RED],
        ['함수 포인터','문법 난해, 상태 못 담음',RED],
        ['NULL','정수 0 → 오버로드 혼동',RED]
      ] : [
        ['make_unique','스마트 포인터 — 범위 벗어나면 자동 해제',GRN],
        ['auto','타입 추론 — 짧고 오타 없음',GRN],
        ['vector/initializer_list','크기·경계를 컨테이너가 관리',GRN],
        ['람다 []','즉석 함수 + 캡처로 상태까지',GRN],
        ['nullptr','포인터 전용 널 — 모호함 없음',GRN]
      ];
      ctx.font='12.5px sans-serif';
      for(var i=0;i<rows.length;i++){ var ry=ty+30+i*40;
        ctx.fillStyle=rows[i][2]; ctx.font='600 13px ui-monospace,monospace'; ctx.textAlign='left'; ctx.fillText(rows[i][0], tx, ry);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText(rows[i][1], tx, ry+17);
        // 아이콘
        ctx.fillStyle=rows[i][2]; ctx.font='14px sans-serif'; ctx.textAlign='right'; ctx.fillText(s.step===0?'⚠':'✓', tx+W*0.42, ry+8);
      }
      // 종합 칩 흐름
      var chy=ty+30+rows.length*40+8;
      ctx.fillStyle=CPB; ctx.font='600 12.5px sans-serif'; ctx.textAlign='left'; ctx.fillText('모던 C++ = 안전 + 표현력 + 속도', tx, chy);
      var chips = s.step===0 ? [] : ['auto','범위 for','[구조적 바인딩]','std::move','람다','스마트 포인터'];
      var cx=tx, cyy=chy+12;
      for(i=0;i<chips.length;i++){ var w=chip(ctx,cx,cyy,chips[i], [CPB,GRN,BLU,PNK,GLD,CPD][i%6]); cx+=w+8; if(cx>tx+W*0.40){ cx=tx; cyy+=28; } }

      E.tapHint(W/2, H*0.94, '화면 탭 = 옛 C++ ↔ 모던 C++ 비교', true);
      E.big('모던 C++ 종합 — 같은 일, 다른 세상', '2011년의 C++11부터 언어는 딴판이 됐습니다. 손으로 new/delete하고 긴 반복자 타입을 외우던 시절에서, auto로 타입을 맡기고 범위기반 for로 순회하며 스마트 포인터가 알아서 메모리를 정리하고, 람다로 함수를 그 자리에서 만들고, 이동 시맨틱으로 불필요한 복사를 없애는 시절로요. 놀라운 건 이 모든 안전과 간결함이 실행 속도를 한 톨도 희생하지 않는다는 점 — “쓰지 않는 것에는 비용이 없다”는 C++의 약속입니다. 이제 여러분은 옛 코드를 읽고 왜, 어떻게 고쳐야 하는지 압니다.'); }
  },

  // ══════════ [심화] cpp15_04 — 보편 참조(universal reference) vs 우측값 참조 ══════════
  { id:'cpp15_04_univref', branchOf:'cpp15_04', ord:1,
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(340+this.s.step*80,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'// ① 구체 타입 && → 순수 우측값 참조', dim:true},
        {t:'void f(Widget&& w);      // 우측값만', hl:'Widget&&'},
        {t:'', dim:true},
        {t:'// ② 템플릿 T&& → 보편 참조', dim:true},
        {t:'template<class T>', dim:true},
        {t:'void g(T&& x);           // 좌·우 모두', hl:'T&&'},
        {t:'', dim:true},
        {t:'// ③ auto&& 도 보편 참조', dim:true},
        {t:'auto&& r = expr;         // 추론 맥락', hl:'auto&&'}
      ];
      var act=[1,5,8][s.step];
      var codeBot=codePanel(E, W*0.04, H*0.09, W*0.47, code, 'universal_reference.cpp', act);

      var tx=W*0.55, ty=H*0.11, botY=H*0.93;
      ctx.textAlign='left';
      ctx.fillStyle=CPB; ctx.font='600 14px sans-serif';
      ctx.fillText(s.step===0?'구체 타입 Widget&& — 우측값만 받습니다'
                 :s.step===1?'템플릿 T&& — 좌값·우값 모두 받습니다'
                 :'왜 다른가 — 타입 추론이 열쇠', tx, ty);

      // 두 인자(좌값 lv, 우값 rv)가 각 함수에 바인딩되는지 실제 규칙으로 판정
      // f(Widget&&): 좌값 불가, 우값 가능.  g(T&&): 좌값 가능(T=Widget&), 우값 가능(T=Widget)
      function bindRow(y, label, srcTxt, ok, note){
        var col = ok?GRN:RED;
        ctx.fillStyle= ok?'rgba(126,224,176,0.10)':'rgba(240,136,138,0.10)';
        ctx.strokeStyle=col; ctx.lineWidth=1.4; roundRect(ctx,tx,y,W*0.40,40,7); ctx.fill(); ctx.stroke();
        ctx.fillStyle=col; ctx.font='600 12.5px sans-serif'; ctx.textAlign='left';
        ctx.fillText(label, tx+12, y+16);
        ctx.fillStyle='#dfeaf2'; ctx.font='13.5px ui-monospace,Menlo,monospace';
        ctx.fillText(srcTxt, tx+12, y+32);
        ctx.fillStyle=col; ctx.font='700 13px sans-serif'; ctx.textAlign='right';
        ctx.fillText(ok?'바인딩 ✔':'바인딩 ✕', tx+W*0.40-12, y+24); ctx.textAlign='left';
        if(note){ ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.fillText(note, tx+W*0.40+8, y+24); }
      }
      if(s.step===0){
        bindRow(ty+18, '좌값 전달  f(w)',     'Widget w;  f(w);',      false, 'w는 이름 있는 좌값');
        bindRow(ty+72, '우값 전달  f(Widget())','f(Widget());',        true,  '임시값 = 우값');
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('Widget&&는 구체 타입 && → 추론이 없어 오직 우측값에만 묶입니다.', tx, ty+130);
        ctx.fillText('좌값 w를 넘기면 컴파일 에러 — 이동 대상 전용 오버로드로 안전합니다.', tx, ty+150);
      } else if(s.step===1){
        bindRow(ty+18, '좌값 전달  g(w)',     'Widget w;  g(w);   // T=Widget&',  true, 'T=Widget& → 좌값 참조');
        bindRow(ty+72, '우값 전달  g(Widget())','g(Widget());       // T=Widget', true, 'T=Widget → 우값 참조');
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('템플릿 매개변수 T가 추론되는 T&&는 “보편 참조” — 좌값이면 T=Widget&,', tx, ty+130);
        ctx.fillText('우값이면 T=Widget으로 추론돼 참조 축약(&& &→&)으로 양쪽을 모두 받습니다.', tx, ty+150);
      } else {
        // 판정 규칙 표
        var rows=[
          ['Widget&&', '구체 타입 &&', '추론 없음', '우측값만', RED],
          ['T&&  (추론)', '템플릿 매개변수', '좌·우로 추론', '둘 다', GRN],
          ['auto&&', 'auto 추론 맥락', '좌·우로 추론', '둘 다', GRN],
          ['const T&&', 'const 붙음', '추론 아님', '우측값만', RED]
        ];
        var ry0=ty+20, rh=Math.max(30, Math.min(38, (botY-ry0-30)/rows.length));
        ctx.font='12px sans-serif';
        for(var i=0;i<rows.length;i++){ var ry=ry0+i*rh, col=rows[i][4];
          ctx.strokeStyle='rgba(255,255,255,0.10)'; ctx.lineWidth=1; ctx.strokeRect(tx,ry,W*0.40,rh);
          ctx.fillStyle=col; ctx.font='600 12px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
          ctx.fillText(rows[i][0], tx+10, ry+rh/2+4);
          ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.fillText(rows[i][1], tx+W*0.13, ry+rh/2+4);
          ctx.fillStyle=col; ctx.font='700 12px sans-serif'; ctx.textAlign='right';
          ctx.fillText(rows[i][3], tx+W*0.40-10, ry+rh/2+4); ctx.textAlign='left';
        }
        ctx.fillStyle=CPB; ctx.font='12.5px sans-serif';
        ctx.fillText('핵심: 형태가 T&&여도 “타입 추론 맥락”일 때만 보편 참조입니다.', tx, ry0+rows.length*rh+18);
      }
      var px=W*0.05, py=Math.max(codeBot+16, H*0.86);
      ctx.textAlign='left'; ctx.fillStyle=DIM; ctx.font='13.5px sans-serif';
      ctx.fillText('보편 참조는 완벽 전달의 토대 — 인자의 좌·우값 성질을 그대로 이어받습니다.', px, py);

      E.tapHint(W/2, H*0.95, '화면 탭 = 구체 && → 템플릿 T&& → 판정 규칙', true);
      E.big('보편 참조 vs 우측값 참조 — 같은 && 다른 의미', '<code>&&</code> 기호가 두 가지 전혀 다른 뜻으로 쓰입니다. <code>void f(Widget&&)</code>처럼 타입이 이미 정해진 &&는 순수한 우측값 참조라 오직 임시값(우측값)에만 묶입니다 — 이동 전용 오버로드죠. 그런데 <code>template&lt;class T&gt; void g(T&&)</code>나 <code>auto&& r</code>처럼 T가 추론되는 맥락의 T&&는 완전히 다릅니다. 좌값을 넘기면 T=Widget&로 추론되고 참조 축약(&& 위에 &)이 일어나 좌값 참조가, 우값을 넘기면 T=Widget으로 추론돼 우값 참조가 됩니다. 즉 좌값·우값 어느 쪽이든 받아 냅니다 — 그래서 “보편 참조”라 부릅니다. 형태만 보고 &&를 우측값 참조로 단정하지 마세요. 타입 추론이 끼어 있느냐가 판별의 열쇠입니다. 화면의 바인딩 판정은 실제 참조 축약 규칙으로 계산한 결과입니다.'); }
  },

  // ══════════ [심화] cpp15_04 — 완벽 전달 (perfect forwarding) ══════════
  { id:'cpp15_04_forward', branchOf:'cpp15_04', ord:2,
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(350+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code = s.step===0 ? [
        {t:'// forward 없이 — 이름이 있으면 좌값!', dim:true},
        {t:'template<class T>', dim:true},
        {t:'void wrap(T&& x){', hl:'T&&'},
        {t:'  sink(x);     // x는 이름→항상 좌값', hl:'sink(x)'},
        {t:'}', dim:true},
        {t:'', dim:true},
        {t:'wrap(makeBig());  // 우값을 넘겨도', dim:true},
        {t:'//   sink는 복사 생성자를 부름 (낭비)', dim:true}
      ] : [
        {t:'// std::forward — 원래 성질 복원', dim:true},
        {t:'template<class T>', dim:true},
        {t:'void wrap(T&& x){', hl:'T&&'},
        {t:'  sink(std::forward<T>(x));', hl:'std::forward<T>(x)'},
        {t:'}', dim:true},
        {t:'', dim:true},
        {t:'wrap(makeBig());  // 우값이면', dim:true},
        {t:'//   sink는 이동 생성자를 부름 (빠름)', dim:true}
      ];
      var codeBot=codePanel(E, W*0.04, H*0.11, W*0.48, code, s.step===0?'no_forward.cpp':'perfect_forward.cpp', 3);

      var tx=W*0.56, ty=H*0.15, botY=H*0.93;
      ctx.textAlign='left'; ctx.fillStyle=CPB; ctx.font='600 14px sans-serif';
      ctx.fillText(s.step===0?'forward 없이 — 우값이 좌값으로 강등':'std::forward — 좌·우값 성질 보존', tx, ty);

      // 파이프라인: 호출자 → wrap(x) → sink.  각 단계의 값 카테고리와 최종 선택된 생성자
      function stageBox(x,y,w,label,cat,catCol){
        ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.strokeStyle=catCol; ctx.lineWidth=1.4; roundRect(ctx,x,y,w,46,8); ctx.fill(); ctx.stroke();
        ctx.fillStyle='#dfeaf2'; ctx.font='600 12px sans-serif'; ctx.textAlign='center'; ctx.fillText(label, x+w/2, y+18);
        ctx.fillStyle=catCol; ctx.font='700 12px sans-serif'; ctx.fillText(cat, x+w/2, y+36); ctx.textAlign='left';
      }
      var bw=W*0.12, gap=W*0.03, sy=ty+22;
      var x0=tx, x1=tx+bw+gap, x2=tx+2*(bw+gap);
      // 호출자는 우값(makeBig())
      stageBox(x0, sy, bw, 'makeBig()', '우값 rvalue', GLD);
      // 안에서 x는 언제나 좌값
      stageBox(x1, sy, bw, 'wrap 안의 x', s.step===0? '좌값 lvalue' : '좌값 lvalue', BLU);
      // sink에 도달할 때의 카테고리
      var arrivedRvalue = (s.step===1);
      stageBox(x2, sy, bw, 'sink(...)', arrivedRvalue?'우값 rvalue':'좌값 lvalue', arrivedRvalue?GRN:RED);
      // 화살표
      ctx.strokeStyle=DIM; ctx.lineWidth=1.4;
      ctx.beginPath(); ctx.moveTo(x0+bw,sy+23); ctx.lineTo(x1,sy+23); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x1+bw,sy+23); ctx.lineTo(x2,sy+23); ctx.stroke();
      // forward 라벨
      ctx.fillStyle=(s.step===1?GRN:RED); ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText(s.step===1?'forward<T>':'그냥 x', (x1+bw+x2)/2, sy-4); ctx.textAlign='left';

      // 최종 선택 생성자 + 실제 비용
      var N=1000000;
      var picked = arrivedRvalue ? '이동 생성자' : '복사 생성자';
      var cost = arrivedRvalue ? 'O(1) — 포인터만' : ('O(N) — '+N.toLocaleString()+'개 복제');
      var costCol = arrivedRvalue ? GRN : RED;
      var yb=sy+64;
      ctx.fillStyle='#dfeaf2'; ctx.font='600 13px sans-serif';
      ctx.fillText('sink가 고르는 생성자: ', tx, yb);
      ctx.fillStyle=costCol; ctx.font='700 14px sans-serif'; ctx.fillText(picked, tx+W*0.14, yb);
      ctx.fillStyle=costCol; ctx.font='600 13px sans-serif'; ctx.fillText('비용: '+cost, tx, yb+24);

      // 비용 막대(실측 카테고리 기반)
      var by=yb+40, barMax=W*0.34;
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='left';
      ctx.fillText('복사', tx, by+10);
      ctx.fillStyle=RED; ctx.fillRect(tx+40, by, barMax, 12);
      ctx.fillStyle=DIM; ctx.fillText('이동', tx, by+30);
      ctx.fillStyle=GRN; ctx.fillRect(tx+40, by+20, 8, 12);
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.fillText('← 이동은 N에 무관', tx+56, by+30);

      var px=W*0.05, py=Math.max(codeBot+16, by+56);
      if(py<botY-16){ ctx.textAlign='left'; ctx.fillStyle=DIM; ctx.font='13.5px sans-serif';
        ctx.fillText(s.step===0? 'x는 이름이 있어 항상 좌값 — 우값을 넘겨도 sink는 복사만 합니다.'
                              : 'forward<T>가 T의 추론 결과로 x의 원래 값 카테고리를 되살립니다.', px, py); }

      E.tapHint(W/2, H*0.95, '화면 탭 = forward 없이 ↔ forward', true);
      E.big('완벽 전달 — 인자의 성질을 그대로 넘기다', '보편 참조 <code>T&&</code>로 인자를 받으면 좌값·우값 어느 쪽이든 받을 수 있지만, 함정이 있습니다. 함수 <b>안에서 x는 이름이 있으므로 언제나 좌값</b>입니다 — 호출자가 우값(임시값)을 넘겼더라도요. 그래서 그냥 <code>sink(x)</code>라고 쓰면 sink는 늘 복사 생성자를 골라, 애써 넘긴 우값의 이동 기회를 날려 버립니다. <code>std::forward&lt;T&gt;(x)</code>가 이를 바로잡습니다 — 템플릿 매개변수 T의 추론 결과를 보고, 원래 좌값이었으면 좌값으로, 우값이었으면 우값으로 <b>값 카테고리를 복원</b>해 다음 함수에 넘깁니다. 그 결과 우값이 넘어오면 sink가 이동 생성자를 골라 O(1)에 끝내죠. std::move가 “무조건 우값으로”라면, std::forward는 “원래대로 조건부로”입니다. 라이브러리 래퍼(emplace, make_unique 등)가 인자를 손해 없이 실어 나르는 비결입니다.'); }
  },

  // ══════════ [심화] cpp15_02 — 람다 캡처 수명 함정 ══════════
  { id:'cpp15_02_capturelife', branchOf:'cpp15_02', ord:3,
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(330+this.s.step*90,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code = s.step===0 ? [
        {t:'// [&] 참조 캡처 — 위험할 수 있음', dim:true},
        {t:'std::function<int()> make(){', dim:true},
        {t:'  int local = 42;', hl:'int local'},
        {t:'  return [&]{ return local; };', hl:'[&]'},
        {t:'}   // local 소멸! 참조는 댕글링', hl:'local 소멸'},
        {t:'', dim:true},
        {t:'auto f = make();', dim:true},
        {t:'f();   // 사라진 local을 읽음 → UB', hl:'UB'}
      ] : s.step===1 ? [
        {t:'// [=] 값 캡처 — 복사해 안전', dim:true},
        {t:'std::function<int()> make(){', dim:true},
        {t:'  int local = 42;', hl:'int local'},
        {t:'  return [=]{ return local; };', hl:'[=]'},
        {t:'}   // 42의 복사본이 람다 안에 산다', hl:'복사본'},
        {t:'', dim:true},
        {t:'auto f = make();', dim:true},
        {t:'f();   // 42 안전하게 반환', hl:'42'}
      ] : [
        {t:'// 이동 캡처 (C++14) — 소유권 이전', dim:true},
        {t:'std::function<void()> make(){', dim:true},
        {t:'  auto p = std::make_unique<Big>();', hl:'make_unique'},
        {t:'  return [p=std::move(p)]{', hl:'p=std::move(p)'},
        {t:'           use(*p); };', dim:true},
        {t:'}   // p의 소유권이 람다로 이동', dim:true},
        {t:'auto f = make();', dim:true},
        {t:'f();   // 람다가 자원을 소유 → 안전', hl:'안전'}
      ];
      var act=[3,3,3][s.step];
      var codeBot=codePanel(E, W*0.04, H*0.10, W*0.48, code, s.step===0?'ref_capture.cpp':s.step===1?'value_capture.cpp':'move_capture.cpp', act);

      var tx=W*0.56, ty=H*0.13, botY=H*0.93;
      ctx.textAlign='left'; ctx.fillStyle=CPB; ctx.font='600 14px sans-serif';
      ctx.fillText(s.step===0?'[&] 참조 캡처 — local이 죽으면 댕글링'
                 :s.step===1?'[=] 값 캡처 — 값을 복사해 람다가 소유'
                 :'[p=move] 이동 캡처 — 소유권을 람다로', tx, ty);

      // 스택 프레임 make() 와 그 안의 local, 그리고 람다 객체
      var frameW=W*0.40, fy=ty+20;
      // make() 프레임 (step에 따라 살았다/죽었다)
      var frameAlive = false; // make()는 반환 후 항상 소멸
      ctx.fillStyle='rgba(255,255,255,0.03)'; ctx.strokeStyle=DIM; ctx.lineWidth=1.2; ctx.setLineDash([5,4]);
      roundRect(ctx,tx,fy,frameW,58,8); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.fillText('make() 스택 프레임 — 반환과 동시에 소멸 ✕', tx+10, fy+16);
      // local 셀
      var localCol = s.step===0? RED : (s.step===1? DIM : DIM);
      ctx.fillStyle= s.step===0? 'rgba(240,136,138,0.10)':'rgba(255,255,255,0.04)';
      ctx.strokeStyle=localCol; ctx.lineWidth=1.4; roundRect(ctx,tx+10,fy+26,W*0.13,24,6); ctx.fill(); ctx.stroke();
      ctx.fillStyle=localCol; ctx.font='13.5px ui-monospace,Menlo,monospace'; ctx.textAlign='center';
      ctx.fillText(s.step===2?'p (Big*)':'local=42', tx+10+W*0.065, fy+42); ctx.textAlign='left';

      // 람다 객체 (make 밖에서 산다)
      var ly=fy+82;
      var lamCol = s.step===0? RED : GRN;
      ctx.fillStyle= s.step===0? 'rgba(240,136,138,0.08)':'rgba(126,224,176,0.10)';
      ctx.strokeStyle=lamCol; ctx.lineWidth=1.6; roundRect(ctx,tx,ly,frameW,58,8); ctx.fill(); ctx.stroke();
      ctx.fillStyle=lamCol; ctx.font='600 12px sans-serif'; ctx.fillText('람다 f — make() 밖에서 오래 산다', tx+10, ly+16);
      // 람다가 품은 것
      var boxTxt = s.step===0? '참조 → (죽은 local)' : s.step===1? '복사본 42 (자체 보유)' : '유일 소유 Big (이동됨)';
      ctx.fillStyle= s.step===0?'rgba(240,136,138,0.10)':'rgba(126,224,176,0.12)';
      ctx.strokeStyle=lamCol; ctx.lineWidth=1.4; roundRect(ctx,tx+10,ly+26,W*0.30,24,6); ctx.fill(); ctx.stroke();
      ctx.fillStyle=lamCol; ctx.font='13.5px ui-monospace,Menlo,monospace'; ctx.textAlign='center';
      ctx.fillText(boxTxt, tx+10+W*0.15, ly+42); ctx.textAlign='left';

      // 참조 화살표 (step0: 람다 → 죽은 local, 빨강 끊김)
      if(s.step===0){
        ctx.strokeStyle=RED; ctx.lineWidth=1.6; ctx.setLineDash([4,4]);
        ctx.beginPath(); ctx.moveTo(tx+W*0.16, ly+38); ctx.lineTo(tx+10+W*0.065, fy+50); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle=RED; ctx.font='700 12px sans-serif'; ctx.textAlign='left'; ctx.fillText('✕ 댕글링 참조', tx+W*0.20, ly+8);
      }

      // 결과 판정 (실제 안전성)
      var safe = (s.step!==0);
      var resY=ly+74;
      ctx.fillStyle= safe?GRN:RED; ctx.font='700 14px sans-serif'; ctx.textAlign='left';
      ctx.fillText(safe? 'f() 호출 → 안전 (값이 람다 안에 있음)' : 'f() 호출 → 미정의 동작(UB) — 죽은 변수 접근', tx, resY);
      ctx.fillStyle=DIM; ctx.font='13.5px sans-serif';
      var note = s.step===0? '[&]는 참조만 가둡니다. 원본이 먼저 죽으면 남은 참조는 허공을 가리킵니다.'
               : s.step===1? '[=]는 캡처 시점에 값을 복사 → 원본 수명과 무관하게 람다가 스스로 보관.'
               : '[p=std::move(p)]로 unique_ptr 소유권을 람다에 이전 → 복사 불가 자원도 안전 이송.';
      if(resY+20<botY) ctx.fillText(note, tx, resY+20);

      var px=W*0.05, py=Math.max(codeBot+16, H*0.87);
      ctx.textAlign='left'; ctx.fillStyle=DIM; ctx.font='13.5px sans-serif';
      ctx.fillText('규칙: 람다가 만든 스코프보다 오래 살면 참조 캡처는 위험 → 값·이동 캡처로.', px, py);

      E.tapHint(W/2, H*0.95, '화면 탭 = 참조 캡처(위험) → 값 캡처 → 이동 캡처', true);
      E.big('람다 캡처 수명 — 참조를 가두면 언제 무너지나', '람다는 바깥 변수를 <b>캡처</b>해 몸통 안에서 씁니다. <code>[&]</code>는 참조로, <code>[=]</code>는 값(복사)으로 가두죠. 문제는 수명입니다. 함수 안에서 지역 변수 <code>local</code>을 <code>[&]</code>로 참조 캡처한 람다를 반환하거나 어딘가에 저장하면, 그 람다는 <code>local</code>보다 오래 살아남습니다 — 그런데 <code>local</code>은 함수가 끝나는 순간 스택에서 사라지죠. 이제 람다 안의 참조는 이미 죽은 메모리를 가리키는 <b>댕글링 참조</b>가 되고, 호출하면 미정의 동작(UB)입니다. 해법은 소유입니다: <code>[=]</code> 값 캡처는 캡처 시점에 값을 복사해 람다가 스스로 보관하니 원본 수명과 무관하게 안전하고, 복사할 수 없는 자원(예: unique_ptr)은 C++14의 <b>이동 캡처</b> <code>[p=std::move(p)]</code>로 소유권째 람다에 넘깁니다. 규칙 하나: 람다가 자기 스코프보다 오래 살 가능성이 있으면 참조 캡처를 피하고 값·이동으로 소유하게 하세요.'); }
  },

  // ══════════ [심화] cpp15_03 — constexpr 심화 (컴파일 타임 표 채우기) ══════════
  { id:'cpp15_03_constexpr2', branchOf:'cpp15_03', ord:4,
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(340+this.s.step*90,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'// constexpr — 컴파일 타임에도 실행', dim:true},
        {t:'constexpr int fib(int n){', hl:'constexpr'},
        {t:'  return n<2 ? n', dim:true},
        {t:'       : fib(n-1)+fib(n-2);', dim:true},
        {t:'}', dim:true},
        {t:'// 컴파일 타임: 배열 크기·룩업표', dim:true},
        {t:'constexpr int T[11] = {', hl:'constexpr int T[11]'},
        {t:'  fib(0),fib(1),...,fib(10) };', hl:'fib(10)'},
        {t:'int arr[fib(6)];   // 크기=8, 합법', hl:'fib(6)'}
      ];
      var act = s.step===0 ? 7 : 8; // step0: 표 채우기 줄, step1: 배열 크기 줄
      var codeBot=codePanel(E, W*0.04, H*0.08, W*0.48, code, 'constexpr_deep.cpp', act);

      var tx=W*0.56, ty=H*0.10, botY=H*0.93;
      // 실제 fib 값 계산 (골든룰)
      var fib=[]; for(var i=0;i<=10;i++){ fib[i] = i<2? i : fib[i-1]+fib[i-2]; }

      ctx.textAlign='left'; ctx.fillStyle=CPB; ctx.font='600 14px sans-serif';
      ctx.fillText(s.step===0?'컴파일 타임에 fib 룩업표를 채웁니다'
                             :'같은 함수를 배열 크기에도 씁니다 (컴파일 상수)', tx, ty);

      if(s.step===0){
        // 표 T[0..10] — 채워지는 애니(프레임 기반, 결정적)
        var fillN;
        if(!E.frozen){ /* 프레임 진행은 엔진 frame */ }
        var fr = (E.frame||0);
        fillN = Math.min(11, Math.floor((fr/22)) % 16); // 0..11 반복(잠시 멈춤 포함)
        var cw=W*0.036, cy=ty+22, x0=tx;
        for(i=0;i<=10;i++){
          var on=(i<fillN), cur=(i===fillN);
          cell(ctx, x0+i*cw, cy, cw-3, 26, on? fib[i] : '·',
               on?'rgba(126,224,176,0.14)':(cur?'rgba(90,180,232,0.20)':'rgba(255,255,255,0.03)'),
               on?GRN:(cur?CPB:'rgba(255,255,255,0.12)'), on?GRN:(cur?CPB:DIM), 12);
          // 인덱스
          ctx.fillStyle=DIM; ctx.font='11px ui-monospace,monospace'; ctx.textAlign='center';
          ctx.fillText(i, x0+i*cw+(cw-3)/2, cy-4); ctx.textAlign='left';
        }
        // 현재 채워지는 식
        var yb=cy+40;
        if(fillN<=10 && fillN>=0){
          var k=Math.min(fillN,10);
          var expr = k<2 ? ('fib('+k+') = '+k+'  (기저)')
                         : ('fib('+k+') = fib('+(k-1)+')+fib('+(k-2)+') = '+fib[k-1]+'+'+fib[k-2]+' = '+fib[k]);
          ctx.fillStyle=CPB; ctx.font='13px ui-monospace,Menlo,monospace'; ctx.fillText(expr, tx, yb);
        } else {
          ctx.fillStyle=GRN; ctx.font='600 13px sans-serif'; ctx.fillText('표 완성 — 실행 전에 이미 모든 값이 상수로 확정.', tx, yb);
        }
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('전체 표 T = [ '+fib.join(', ')+' ]', tx, yb+24);
        ctx.fillText('이 11개 값은 컴파일러가 미리 계산 → 실행 땐 조회만(비용 0).', tx, yb+44);
      } else {
        // 배열 크기로 쓰이는 fib(6)
        var f6=fib[6];
        ctx.fillStyle='#dfeaf2'; ctx.font='13px ui-monospace,Menlo,monospace';
        ctx.fillText('int arr[ fib(6) ];', tx, ty+28);
        // fib(6) 실제 계산
        ctx.fillStyle=CPB; ctx.font='12.5px ui-monospace,Menlo,monospace';
        var lines=[
          'fib(6) = fib(5)+fib(4)',
          '       = '+fib[5]+' + '+fib[4],
          '       = '+f6+'   ← 컴파일 상수'
        ];
        for(i=0;i<lines.length;i++) ctx.fillText(lines[i], tx, ty+52+i*20);
        // 실제 크기 arr[8] 시각화
        var cw2=W*0.038, cy2=ty+128;
        ctx.fillStyle=GRN; ctx.font='600 12.5px sans-serif'; ctx.fillText('→ arr는 정확히 '+f6+'칸 배열:', tx, cy2-8);
        for(i=0;i<f6;i++){ cell(ctx, tx+i*cw2, cy2, cw2-3, 24, i, 'rgba(90,180,232,0.10)', CPB, CPD, 11); }
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('배열 크기는 컴파일 타임 상수여야 합니다 — 일반 함수는 못 쓰지만', tx, cy2+42);
        ctx.fillText('constexpr fib(6)='+f6+'은 컴파일러가 미리 계산하므로 합법입니다.', tx, cy2+60);
      }

      var px=W*0.05, py=Math.max(codeBot+16, H*0.88);
      if(py<botY-14){ ctx.textAlign='left'; ctx.fillStyle=DIM; ctx.font='13.5px sans-serif';
        ctx.fillText('constexpr 함수는 상수 문맥이면 컴파일 타임에, 아니면 런타임에 — 양쪽 모두 씁니다.', px, py); }

      E.tapHint(W/2, H*0.95, '화면 탭 = 룩업표 채우기 ↔ 배열 크기로 사용', true);
      E.big('constexpr 심화 — 컴파일러에게 계산을 시키다', '<code>constexpr</code> 함수는 특별한 이중 신분을 가집니다. 상수가 필요한 문맥에서 상수 인자로 부르면 <b>컴파일 타임에</b> 계산되어 결과가 바이너리에 상수로 박히고, 런타임 값으로 부르면 <b>평범한 함수처럼</b> 실행됩니다 — 한 벌의 코드로 둘 다 되는 거죠. 이 성질은 실전에서 강력합니다. 화면처럼 <code>fib(0)</code>부터 <code>fib(10)</code>까지의 값을 <b>룩업 테이블</b>로 미리 채워 두면(각 값은 실제 점화식으로 계산한 0,1,1,2,3,5,8,13,21,34,55입니다) 실행 중엔 곱셈·재귀 없이 배열을 조회만 합니다. 또 배열 크기처럼 “반드시 컴파일 타임 상수여야 하는 자리”에도 쓸 수 있어, <code>int arr[fib(6)]</code>는 컴파일러가 fib(6)=8을 미리 계산해 크기 8짜리 배열을 만듭니다. 일반 함수는 이 자리에 못 오지만 constexpr은 옵니다. 핵심 규칙: 컴파일러가 미리 알 수 있는 계산은 미리 시켜, 런타임 비용을 0으로 만드는 것입니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
