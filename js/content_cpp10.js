/* C++ 제10장 — 연산자 오버로딩 (준비 중 스텁 — 에이전트가 실제 내용으로 대체). 텍스트=content/cpp10.json. */
(function(){
  var scenes = [
    { id:'cpp10_01', concept:true,
      enter:function(E){ this.s={}; E.setOn([]); },
      draw:function(E){ var ctx=E.ctx,W=E.W,H=E.H; ctx.fillStyle='#5ab4e8'; ctx.font='600 20px sans-serif'; ctx.textAlign='center';
        ctx.fillText('제10장 연산자 오버로딩 — 준비 중', W/2, H*0.45);
        E.big('연산자 오버로딩', '이 장은 곧 채워집니다.'); } }
  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
