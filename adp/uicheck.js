/* ADP Master — 화면 겹침 자동 검사기
   목적: "글자·버튼이 서로 겹친다"를 사람 눈이 아니라 기계가 잡는다.
   사용: 페이지 주소 끝에 ?uicheck=1 을 붙이면 실행되고, 결과를 <pre id="uicheck-report"> 에 남긴다.
        헤드리스 브라우저로 --dump-dom 하면 그 보고서를 그대로 읽을 수 있다(tools/ui_check.sh).
   검사 항목: ①요소 겹침 ②가로 넘침 ③11px 미만 글자 ④화면 밖으로 나간 요소 */
(function(){
  var SEL = [
    '.topbar a', '.topbar span', '.acct-bar', '.acct-btn', '.cw-wrap', '.cw-fab', '.cw-note',
    'h1', 'h2', '.prob', '.lab', '.explore', '.ask', '.concl', '.trap', '.chk',
    'table', 'canvas', 'pre', '.labnav.bot a', '.ctrl', '.pc', '.probban', '.solban',
    'small.src2', '.flow li', '.quiz', '.recall', '.tutor', '.box'
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

  function run(){
    var els = Array.prototype.slice.call(document.querySelectorAll(SEL)).filter(visible);
    var rects = els.map(function(e){ return e.getBoundingClientRect(); });
    var report = { url: location.pathname + location.search, viewport: innerWidth + 'x' + innerHeight,
                   overlaps: [], overflowX: null, tinyFont: [], offscreen: [] };

    for(var i = 0; i < els.length; i++){
      for(var j = i + 1; j < els.length; j++){
        if(related(els[i], els[j])) continue;
        var area = overlapArea(rects[i], rects[j]);
        if(area > 6){
          report.overlaps.push({ a: name(els[i]), b: name(els[j]), area: Math.round(area) });
        }
      }
    }

    var doc = document.documentElement;
    if(doc.scrollWidth > innerWidth + 2){
      report.overflowX = { scrollWidth: doc.scrollWidth, viewport: innerWidth };
    }

    els.forEach(function(e, k){
      var fs = parseFloat(getComputedStyle(e).fontSize);
      var own = Array.prototype.some.call(e.childNodes, function(n){ return n.nodeType === 3 && n.textContent.trim(); });
      if(own && fs && fs < 11) report.tinyFont.push({ el: name(e), px: fs });
      var r = rects[k];
      if(r.right > innerWidth + 2 || r.left < -2) report.offscreen.push({ el: name(e), left: Math.round(r.left), right: Math.round(r.right) });
    });

    var bad = report.overlaps.length + report.tinyFont.length + report.offscreen.length + (report.overflowX ? 1 : 0);
    var pre = document.createElement('pre');
    pre.id = 'uicheck-report';
    pre.textContent = (bad ? 'UICHECK FAIL ' + bad : 'UICHECK OK') + '\n' + JSON.stringify(report, null, 1);
    pre.style.cssText = 'position:absolute;left:-99999px;top:0;white-space:pre';
    document.body.appendChild(pre);
    document.title = (bad ? '[UICHECK FAIL ' + bad + '] ' : '[UICHECK OK] ') + document.title;
  }

  // 로그인·AI 버튼이 붙고 글꼴이 적용된 뒤에 재야 정확하다.
  function later(){ setTimeout(run, 1600); }
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(later); else later();
})();
