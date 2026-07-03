/* C++ 제15장 — 모던 C++ (C++11/14/17): auto·decltype · 범위기반for·구조적바인딩 · nullptr·enum class·constexpr · 이동 시맨틱(move) · 모던 종합
   동작(behavior)만. 텍스트=content/cpp15.json. 엔진 js/engine.js 공유. 색: C++=파랑(#5ab4e8).
   골든룰: 화면의 constexpr 계산값·이동/복사 비용·초기화 결과는 draw에서 실제로 계산(베껴 박지 않음). 왼쪽=진짜 C++ 코드, 오른쪽=효과를 실측 시각화. */
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

      var tx=W*0.55, ty=H*0.16;
      ctx.fillStyle=CPB; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
      ctx.fillText('타입 추론 — 컴파일러가 우변을 보고 타입을 결정', tx, ty);

      var longType='std::vector<int>::iterator';
      var boxw=W*0.40;
      // 옛 방식: 긴 타입 상자
      var y1=ty+34;
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText('옛 방식: 개발자가 긴 타입명을 손으로 적음', tx, y1);
      ctx.fillStyle='rgba(240,136,138,0.10)'; ctx.strokeStyle=RED; ctx.lineWidth=1.2; roundRect(ctx,tx,y1+10,boxw,30,6); ctx.fill(); ctx.stroke();
      ctx.fillStyle=RED; ctx.font='12px ui-monospace,Menlo,monospace'; ctx.textAlign='center'; ctx.fillText(longType+'  it', tx+boxw/2, y1+30);
      ctx.fillStyle=DIM; ctx.font='11.5px sans-serif'; ctx.textAlign='left'; ctx.fillText('글자 수: '+(longType.length)+'자 · 실수·오타 나기 쉬움', tx, y1+58);

      // 모던: auto
      var y2=y1+90;
      ctx.fillStyle=CPB; ctx.font='12.5px sans-serif'; ctx.textAlign='left'; ctx.fillText('모던: auto — 4글자, 컴파일러가 자동 추론', tx, y2);
      ctx.fillStyle='rgba(90,180,232,0.12)'; ctx.strokeStyle=CPB; ctx.lineWidth=1.4; roundRect(ctx,tx,y2+10,boxw,30,6); ctx.fill(); ctx.stroke();
      ctx.fillStyle=CPB; ctx.font='13px ui-monospace,Menlo,monospace'; ctx.textAlign='center'; ctx.fillText('auto  it   →   '+longType, tx+boxw/2, y2+30);

      if(s.step>=1){
        var y3=y2+64;
        ctx.fillStyle=GRN; ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.fillText('추론 규칙 — 우변의 실제 타입을 그대로', tx, y3);
        var rows=[['auto x = 5;','int'],['auto d = 3.14;','double'],['auto& r = v;','std::vector<int>&'],['auto p = v.begin();',longType]];
        ctx.font='12px ui-monospace,Menlo,monospace';
        for(var i=0;i<rows.length;i++){ var ry=y3+22+i*22;
          ctx.fillStyle=DIM; ctx.textAlign='left'; ctx.fillText(rows[i][0], tx, ry);
          ctx.fillStyle=CPB; ctx.fillText('→ '+rows[i][1], tx+W*0.18, ry); }
      }
      if(s.step>=2){
        var y4=y2+64+120;
        ctx.fillStyle=PNK; ctx.font='12.5px sans-serif'; ctx.textAlign='left';
        ctx.fillText('decltype(v) = 표현식 v 의 타입을 그대로 가져오기 → std::vector<int>', tx, y4);
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
        {t:'int* p = nullptr;', hl:'nullptr'},
        {t:'// NULL은 사실 정수 0 → 모호', dim:true},
        {t:'', dim:true},
        {t:'// 2) enum class — 스코프드', dim:true},
        {t:'enum class Color { Red, Green };', hl:'enum class'},
        {t:'Color c = Color::Green;', hl:'Color::Green'},
        {t:'', dim:true},
        {t:'// 3) constexpr — 컴파일타임', dim:true},
        {t:'constexpr int fact(int n){', hl:'constexpr'},
        {t:'  return n<=1 ? 1 : n*fact(n-1);', dim:true},
        {t:'}', dim:true},
        {t:'constexpr int F = fact(5);', hl:'fact(5)'}
      ];
      var act=[1,5,12][s.step];
      codePanel(E, W*0.04, H*0.08, W*0.47, code, 'safety_features.cpp', act);

      var tx=W*0.57, ty=H*0.18;
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
        for(var i=0;i<steps.length;i++){ ctx.fillStyle=(i===steps.length-1)?GRN:DIM; ctx.fillText(steps[i], tx, ty+30+i*22); }
        var F=fact(5);
        ctx.fillStyle=GRN; ctx.font='700 20px sans-serif'; ctx.fillText('fact(5) = '+F, tx, ty+30+steps.length*22+14);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('constexpr → 이 '+F+'이 컴파일 결과물(바이너리)에 상수로 박힘.', tx, ty+30+steps.length*22+40);
        ctx.fillText('실행할 땐 곱셈이 한 번도 안 일어납니다 — 공짜.', tx, ty+30+steps.length*22+58);
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
        ctx.fillStyle=col; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText(label, x+75, y+16);
        ctx.fillStyle=DIM; ctx.font='10px ui-monospace,monospace'; ctx.fillText('[ 5 | 2 | 8 | … | 9 ]', x+75, y+34); }
      function handle(x,y,name,col,ptr){
        ctx.fillStyle='rgba(90,180,232,0.10)'; ctx.strokeStyle=col; ctx.lineWidth=1.2; roundRect(ctx,x,y,64,40,6); ctx.fill(); ctx.stroke();
        ctx.fillStyle=col; ctx.font='600 13px ui-monospace,monospace'; ctx.textAlign='center'; ctx.fillText(name, x+32, y+16);
        ctx.fillStyle=DIM; ctx.font='9.5px sans-serif'; ctx.fillText(ptr, x+32, y+32); }

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
        ctx.fillStyle=RED; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('100만 회 복사', tx+205, ty+80);
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
        ctx.fillStyle=RED; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('✕ 끊김', tx+70, ty+40);
        ctx.fillStyle=GRN; ctx.font='700 16px sans-serif'; ctx.fillText('비용 = O(1) — 포인터 몇 개만 교환', tx, ty+150);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('std::move(a)는 a를 우측값(rvalue&&)으로 만들어 “자원을 훔쳐도 좋다”고 표시.', tx, ty+174);
        ctx.fillText('a는 빈 껍데기가 되지만, 곧 버릴 임시값이면 손해가 없습니다.', tx, ty+194);
        // 속도 대비 막대
        var by=ty+210;
        ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.fillText('복사', tx, by+10); ctx.fillStyle=RED; ctx.fillRect(tx+40, by, W*0.34, 12);
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
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
