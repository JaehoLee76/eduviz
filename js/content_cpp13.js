/* C++ 제13장 — STL 알고리즘·람다 (준비 중 스텁 — 에이전트가 실제 내용으로 대체). 텍스트=content/cpp13.json. */
(function(){
  var scenes = [
    { id:'cpp13_01', concept:true,
      enter:function(E){ this.s={}; E.setOn([]); },
      draw:function(E){ var ctx=E.ctx,W=E.W,H=E.H; ctx.fillStyle='#5ab4e8'; ctx.font='600 20px sans-serif'; ctx.textAlign='center';
        ctx.fillText('제13장 STL 알고리즘·람다 — 준비 중', W/2, H*0.45);
        E.big('STL 알고리즘·람다', '이 장은 곧 채워집니다.'); } }
  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
