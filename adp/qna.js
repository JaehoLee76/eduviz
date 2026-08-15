/* ADP Master — 장면별 Q&A 팝업
 *
 * 왜: 학습 중 나온 질문과 답을 본문에 그대로 풀어 쓰면 화면이 길어지고 가독성이 떨어진다.
 *     → 장면(절)마다 작은 [Q&A] 버튼만 두고, 누르면 팝업으로 보여 준다.
 *
 * 쓰는 법(장면 작성자):  절 안 아무 곳에나 아래 블록을 둔다. 화면엔 버튼만 보인다.
 *   <div class="qna" data-q="그래프만 봐도 차이가 보이는데 검정이 왜 필요한가요?">
 *     <p>답변 본문 HTML …</p>
 *   </div>
 *   같은 절에 여러 개 두면 버튼이 나란히 생긴다. data-label 로 버튼 글자를 바꿀 수 있다.
 *
 * 모바일: 좁은 화면에서는 아래에서 올라오는 시트로 열리고(엄지로 닫기 쉬움),
 *        배경 스크롤을 잠그고, 노치·홈바 여백(safe-area)을 지킨다. 넓은 화면에서는 가운데 카드.
 * 층 순서: 상단바 40 · 계정 메뉴 50 → 이 팝업은 60(항상 위).
 */
(function(){
  if(window.__adpQna) return; window.__adpQna = true;

  var css = document.createElement('style');
  css.textContent = [
    '.qna{display:inline-block;margin:.2rem .35rem .2rem 0}',
    '.qna-btn{display:inline-flex;align-items:center;gap:.35rem;min-height:38px;',
    ' padding:.3rem .8rem;border:1px solid var(--accent,#2fa8d8);border-radius:20px;',
    ' background:transparent;color:var(--accent,#2fa8d8);font-weight:700;font-size:.83rem;',
    ' font-family:inherit;cursor:pointer;line-height:1.3;text-align:left}',
    '.qna-btn:active{opacity:.7}',
    '.qna-ov{position:fixed;inset:0;z-index:60;display:none;background:rgba(0,0,0,.55);',
    ' align-items:center;justify-content:center;padding:1rem}',
    '.qna-ov.on{display:flex}',
    '.qna-card{background:var(--card,#182831);color:var(--ink,#e6f0f4);border:1px solid var(--rule,#2b4451);',
    ' border-radius:14px;max-width:640px;width:100%;max-height:82vh;max-height:82dvh;display:flex;flex-direction:column;',
    ' box-shadow:0 18px 50px rgba(0,0,0,.45)}',
    '.qna-head{display:flex;align-items:flex-start;gap:.6rem;padding:.9rem 1rem .6rem;border-bottom:1px solid var(--rule,#2b4451)}',
    '.qna-head h3{margin:0;font-size:1rem;line-height:1.45;font-weight:800;color:var(--accent,#2fa8d8);flex:1}',
    '.qna-x{flex:none;width:44px;height:44px;margin:-.35rem -.35rem 0 0;border:0;background:transparent;',
    ' color:var(--soft,#a3b4bd);font-size:1.25rem;cursor:pointer;border-radius:10px}',
    '.qna-body{padding:.9rem 1rem calc(1rem + env(safe-area-inset-bottom));overflow-y:auto;',
    ' -webkit-overflow-scrolling:touch;overscroll-behavior:contain;font-size:.93rem;line-height:1.62}',
    '.qna-body p{margin:.55rem 0}.qna-body ul,.qna-body ol{margin:.5rem 0 .5rem 1.1rem;padding:0}',
    '.qna-body li{margin:.3rem 0}',
    '.qna-body table{width:100%;border-collapse:collapse;margin:.7rem 0;font-size:.86rem}',
    '.qna-body th,.qna-body td{border:1px solid var(--rule,#2b4451);padding:.3rem .45rem;text-align:center}',
    '.qna-body th{color:var(--accent,#2fa8d8)}',
    '.qna-body pre{background:var(--code,#152632);border:1px solid var(--rule,#2b4451);border-radius:8px;',
    ' padding:.7rem;overflow-x:auto;font-size:.8rem;line-height:1.5}',
    '@media(max-width:560px){',
    ' .qna-ov{align-items:flex-end;padding:0}',
    ' .qna-card{max-width:100%;border-radius:16px 16px 0 0;max-height:88dvh}',
    ' .qna-btn{width:100%;justify-content:flex-start}',
    '}'
  ].join('');
  document.head.appendChild(css);

  var ov = document.createElement('div');
  ov.className = 'qna-ov';
  ov.innerHTML = '<div class="qna-card" role="dialog" aria-modal="true">' +
                 '<div class="qna-head"><h3></h3><button class="qna-x" aria-label="닫기">✕</button></div>' +
                 '<div class="qna-body"></div></div>';
  document.body.appendChild(ov);
  var titleEl = ov.querySelector('h3'), bodyEl = ov.querySelector('.qna-body');
  var lockY = 0, opener = null;

  function open(q, html, btn){
    titleEl.textContent = q;
    bodyEl.innerHTML = html;
    bodyEl.scrollTop = 0;
    opener = btn || null;
    lockY = window.scrollY;
    document.body.style.position = 'fixed';        // 배경이 같이 스크롤되지 않게(모바일 필수)
    document.body.style.top = (-lockY) + 'px';
    document.body.style.width = '100%';
    ov.classList.add('on');
    ov.querySelector('.qna-x').focus();
  }
  function close(){
    ov.classList.remove('on');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, lockY);
    if(opener) opener.focus();
  }
  ov.addEventListener('click', function(e){ if(e.target === ov) close(); });
  ov.querySelector('.qna-x').addEventListener('click', close);
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && ov.classList.contains('on')) close(); });

  // 본문의 .qna 블록을 버튼으로 바꾼다(내용은 감춰 두고 팝업에서만 보여 줌).
  function build(){
    var list = document.querySelectorAll('.qna');
    Array.prototype.forEach.call(list, function(box){
      if(box.dataset.built) return;
      box.dataset.built = '1';
      var q = box.getAttribute('data-q') || '질문';
      var html = box.innerHTML;
      var label = box.getAttribute('data-label') || q;
      box.innerHTML = '';
      var btn = document.createElement('button');
      btn.className = 'qna-btn';
      btn.type = 'button';
      btn.innerHTML = '<span aria-hidden="true">💬</span><span>' + label + '</span>';
      btn.addEventListener('click', function(){ open(q, html, btn); });
      box.appendChild(btn);
    });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();

  // 검사기(uicheck)가 팝업 상태도 잴 수 있도록 최소한의 조작 창구를 남긴다.
  window.AdpQna = { open: open, close: close, count: function(){ return document.querySelectorAll('.qna-btn').length; },
    openIndex: function(i){ var b = document.querySelectorAll('.qna-btn')[i]; if(b) b.click(); return !!b; } };
})();
