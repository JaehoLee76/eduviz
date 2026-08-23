/* ADP Master — 훈련 장치 (모든 실험실 공용)
 *
 * 왜: 유형당 문제 한두 개로는 이해까지고 합격은 안 된다. 시험장에서 필요한 것은
 *     처음 보는 숫자를 받고도 손이 움직이는 상태이고, 그건 반복과 재현으로만 만들어진다.
 * 무엇: 1) 새 문제 뽑기 — 같은 유형에 숫자만 바꾼 문제를 계속 생성(정답은 화면이 실계산).
 *      2) 백지 훈련 — 풀이를 가리고 문제만 남긴다. 먼저 쓰고 나서 펼쳐 대조한다.
 *
 * 실험실이 해야 할 일은 하나뿐이다. 새 숫자를 만들어 넣는 함수를 남겨 두면 된다:
 *   window.ADP_NEWDATA = function(rnd){ ... DATA 를 새로 채우고 render() 호출 ... };
 *   (rnd() 는 0~1 난수. 씨앗이 정해져 있어 같은 문제 번호면 같은 문제가 나온다.)
 * 함수가 없으면 "새 문제" 버튼은 나타나지 않는다(백지 훈련은 그래도 동작한다).
 */
(function(){
  if(!/\/labs\//.test(location.pathname)) return;

  var css = document.createElement('style');
  css.textContent = [
    '.drill{display:flex;gap:.5rem;flex-wrap:wrap;margin:.8rem 0 0}',
    '.drill button{flex:1 1 46%;min-height:46px;padding:.4rem .8rem;border-radius:10px;',
    ' border:1px solid var(--accent,#2fa8d8);background:transparent;color:var(--accent,#2fa8d8);',
    ' font-family:inherit;font-size:.88rem;font-weight:700;cursor:pointer}',
    '.drill button.on{background:var(--accent,#2fa8d8);color:#fff}',
    '.drill .hint{flex:1 1 100%;font-size:.8rem;color:var(--soft,var(--ink-soft,#a3b4bd));margin:.1rem 0 0}',
    '.drill-hidden{display:none!important}',
    '.drill-veil{border:1px dashed var(--accent,#2fa8d8);border-radius:12px;padding:1rem;margin:1.2rem 0;',
    ' background:var(--card,#182831)}',
    '.drill-veil p{margin:.2rem 0 .7rem;font-size:.9rem;color:var(--soft,var(--ink-soft,#a3b4bd))}',
    '.drill-veil b{color:var(--accent,#2fa8d8)}',
    '.drill-veil button{min-height:46px;padding:.4rem 1rem;border-radius:10px;border:1px solid var(--accent,#2fa8d8);',
    ' background:var(--accent,#2fa8d8);color:#fff;font-family:inherit;font-weight:700;font-size:.9rem;cursor:pointer}'
  ].join('');
  document.head.appendChild(css);

  // 씨앗이 있는 난수 — 같은 문제 번호면 언제나 같은 문제가 나온다(다시 풀어볼 수 있게).
  function rngOf(seed){
    var a = seed >>> 0;
    return function(){
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function build(){
    var prob = document.querySelector('.prob');
    var solban = document.querySelector('.solban');
    if(!prob || !solban) return;

    // ── 버튼 줄 ──
    var bar = document.createElement('div');
    bar.className = 'drill';
    var canGen = typeof window.ADP_NEWDATA === 'function';
    bar.innerHTML =
      (canGen ? '<button id="drillNew" type="button">🎲 새 문제 뽑기</button>' : '') +
      '<button id="drillHide" type="button">🙈 백지 훈련 — 풀이 가리기</button>' +
      '<p class="hint">' + (canGen
        ? '숫자만 바뀐 같은 유형의 문제가 나옵니다. 먼저 스스로 푸신 뒤 풀이를 펼쳐 대조하세요.'
        : '풀이를 가리고 백지에 먼저 써 보신 뒤 펼쳐서 대조하세요.') + '</p>';
    prob.parentNode.insertBefore(bar, prob.nextSibling);

    // ── 백지 훈련: 풀이 배너부터 질문 블록 앞까지 가린다 ──
    var veil = document.createElement('div');
    veil.className = 'drill-veil drill-hidden';
    veil.innerHTML = '<p><b>백지 훈련 중입니다.</b> 문제만 보고 파이썬 코드와 다섯 단계 답안을 ' +
      '직접 써 보세요 — 가설, 전제 확인, 검정통계량, 판정, 결론 서술.</p>' +
      '<button type="button" id="drillShow">다 썼습니다 — 풀이 펼쳐 대조하기</button>';
    solban.parentNode.insertBefore(veil, solban);

    function solutionParts(){
      var out = [], n = solban;
      while(n){
        if(n.nodeType === 1 && (n.classList.contains('ask') || n.classList.contains('labnav') ||
           n.classList.contains('srs') || n.tagName === 'SMALL')) break;
        if(n.nodeType === 1 && n !== veil) out.push(n);
        n = n.nextSibling;
      }
      return out;
    }
    function setHidden(on){
      solutionParts().forEach(function(el){ el.classList.toggle('drill-hidden', on); });
      veil.classList.toggle('drill-hidden', !on);
      var b = document.getElementById('drillHide');
      b.textContent = on ? '👀 풀이 다시 보기' : '🙈 백지 훈련 — 풀이 가리기';
      b.classList.toggle('on', on);
      if(on) veil.scrollIntoView({ block:'center', behavior:'smooth' });
    }
    document.getElementById('drillHide').addEventListener('click', function(){
      setHidden(!this.classList.contains('on'));
    });
    document.getElementById('drillShow').addEventListener('click', function(){ setHidden(false); });

    // ── 새 문제 뽑기 ──
    if(canGen){
      var n = 0;
      document.getElementById('drillNew').addEventListener('click', function(){
        n += 1;
        var seed = (Date.now() % 100000) + n * 7919;      // 문제마다 다른 씨앗
        try{ window.ADP_NEWDATA(rngOf(seed)); }catch(e){}
        setHidden(true);                                   // 새 문제는 바로 백지 훈련으로
        this.textContent = '🎲 새 문제 뽑기 (' + n + '번째)';
      });
    }
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
