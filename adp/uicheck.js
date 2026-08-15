/* ADP Master — 화면 겹침 자동 검사기
   목적: "글자·버튼이 서로 겹친다"를 사람 눈이 아니라 기계가 잡는다.
   사용: 주소 끝에 ?uicheck=1 을 붙이면 실행되고, 결과를 <pre id="uicheck-report"> 에 남긴다.
        헤드리스 크롬으로 읽는 절차는 tools/ui_check.mjs (PC·모바일 진짜 폭으로 검사).
   검사 항목: ①요소 겹침 ②가로 넘침 ③11px 미만 글자 ④화면 밖으로 나간 요소
   검사 상태: 기본 화면 + 각 Q&A 팝업을 하나씩 연 상태(팝업 안 내용도 잘리면 안 되므로). */
(function(){
  var SEL = [
    '.topbar a', '.topbar span', '.acct-bar', '.acct-btn', '.cw-wrap', '.cw-fab', '.cw-note',
    'h1', 'h2', 'h3', '.prob', '.lab', '.explore', '.ask', '.concl', '.trap', '.chk',
    'table', 'canvas', 'pre', '.labnav.bot a', '.ctrl', '.pc', '.probban', '.solban',
    'small.src2', '.flow li', '.quiz', '.recall', '.tutor', '.box', '.qna-btn', '.qna-x'
  ].join(',');

  function visible(e){
    var s = getComputedStyle(e);
    if(s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) < 0.05) return false;
    var r = e.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  }
  function related(a, b){ return a.contains(b) || b.contains(a); }
  function name(e){
    var id = e.id ? '#' + e.id : '';
    var cls = (e.className && typeof e.className === 'string') ? '.' + e.className.trim().split(/\s+/).slice(0,2).join('.') : '';
    var t = (e.textContent || '').replace(/\s+/g,' ').trim().slice(0, 22);
    return e.tagName.toLowerCase() + id + cls + (t ? ' "' + t + '"' : '');
  }
  function overlapArea(a, b){
    var w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
    var h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    return (w > 0 && h > 0) ? w * h : 0;
  }

  /* scope: 검사 범위. 팝업이 열려 있으면 팝업 카드 안만 잰다
     (팝업은 본문 위를 덮는 게 정상이므로 본문과의 겹침은 오류가 아니다). */
  function scan(scope, label){
    var root = scope || document;
    var els = Array.prototype.slice.call(root.querySelectorAll(SEL)).filter(function(e){
      if(!visible(e)) return false;
      if(!scope && e.closest('.qna-ov')) return false;   // 기본 상태에서는 팝업 내부 제외
      return true;
    });
    var rects = els.map(function(e){ return e.getBoundingClientRect(); });
    var out = { state: label, overlaps: [], overflowX: null, tinyFont: [], offscreen: [] };

    for(var i = 0; i < els.length; i++){
      for(var j = i + 1; j < els.length; j++){
        if(related(els[i], els[j])) continue;
        var area = overlapArea(rects[i], rects[j]);
        if(area > 6) out.overlaps.push({ a: name(els[i]), b: name(els[j]), area: Math.round(area) });
      }
    }

    if(scope){                                            // 팝업: 카드 안에서 가로로 삐져나가는지
      if(scope.scrollWidth > scope.clientWidth + 2)
        out.overflowX = { scrollWidth: scope.scrollWidth, viewport: scope.clientWidth };
    } else {
      var doc = document.documentElement;
      if(doc.scrollWidth > innerWidth + 2)
        out.overflowX = { scrollWidth: doc.scrollWidth, viewport: innerWidth };
    }

    els.forEach(function(e, k){
      var fs = parseFloat(getComputedStyle(e).fontSize);
      var own = Array.prototype.some.call(e.childNodes, function(n){ return n.nodeType === 3 && n.textContent.trim(); });
      if(own && fs && fs < 11) out.tinyFont.push({ el: name(e), px: fs });
      var r = rects[k];
      if(r.right > innerWidth + 2 || r.left < -2) out.offscreen.push({ el: name(e), left: Math.round(r.left), right: Math.round(r.right) });
    });
    return out;
  }

  function bad(r){ return r.overlaps.length + r.tinyFont.length + r.offscreen.length + (r.overflowX ? 1 : 0); }
  function wait(ms){ return new Promise(function(res){ setTimeout(res, ms); }); }

  async function run(){
    var states = [scan(null, '기본 화면')];

    // Q&A 팝업을 하나씩 열어 그 안도 검사한다(모바일 시트에서 잘리는지 확인).
    if(window.AdpQna && AdpQna.count()){
      for(var i = 0; i < AdpQna.count(); i++){
        AdpQna.openIndex(i);
        await wait(320);
        var card = document.querySelector('.qna-ov.on .qna-card');
        if(card) states.push(scan(card, 'Q&A 팝업 ' + (i + 1)));
        AdpQna.close();
        await wait(160);
      }
    }

    var report = { url: location.pathname + location.search, viewport: innerWidth + 'x' + innerHeight, states: states };
    var total = states.reduce(function(a, s){ return a + bad(s); }, 0);
    var pre = document.createElement('pre');
    pre.id = 'uicheck-report';
    pre.textContent = (total ? 'UICHECK FAIL ' + total : 'UICHECK OK') + '\n' + JSON.stringify(report, null, 1);
    pre.style.cssText = 'position:absolute;left:-99999px;top:0;white-space:pre';
    document.body.appendChild(pre);
    document.title = (total ? '[UICHECK FAIL ' + total + '] ' : '[UICHECK OK] ') + document.title;
  }

  // 로그인·AI 버튼이 붙고 글꼴이 적용된 뒤에 재야 정확하다.
  function later(){ setTimeout(run, 1600); }
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(later); else later();
})();
