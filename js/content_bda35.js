/* 빅데이터 분석 제35장 — 나누어 저장하고 나누어 계산한다 (분산 파일 시스템·해시 파티셔닝·CAP·맵리듀스·클라우드)
   동작(behavior)만. 텍스트=content/bda35.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 화면의 모든 수(청크 수·복제·장애 생존 청크, 재배치 키 수, CAP 성공/실패·신선/오래된값,
   맵리듀스 단어 개수, 서버-시간·절감률 등)는 아래 고정 데이터로부터 이 파일 로드 시 실제 계산(하드코딩 금지).
   난수(Math.random) 절대 금지 — 예제 데이터는 전부 고정 배열/식. */
(function(){
  var ROSE='#ff7ab8', GRN='#7ee0b0', BLU='#7ab8ff', GLD='#ffd27a', DIM='#9b99a3', RED='#f0888a', TXT='#eadfe8', PUR='#c79dff', ORG='#ffb27a';
  var CHUNK_COL=[GRN,BLU,GLD,PUR,ORG,ROSE,'#8fd6ff','#c9e07a','#ff9ecf','#9ad1a8','#f2b56b','#a9a6ff','#7ee0d0','#e0a5ff','#c8e07a','#7ab8ff'];

  function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function codePanel(E, x, y, w, lines, title, actLine){
    var ctx=E.ctx, lh=19, pad=12, top=y, n=lines.length, ht=n*lh+pad*2+(title?24:0);
    ctx.fillStyle='rgba(255,255,255,0.035)'; ctx.strokeStyle='rgba(255,122,184,0.30)'; ctx.lineWidth=1;
    roundRect(ctx,x,top,w,ht,10); ctx.fill(); ctx.stroke();
    var cy=top+pad+(title?24:0);
    if(title){ ctx.fillStyle=ROSE; ctx.font='600 11.5px ui-monospace,Menlo,monospace'; ctx.textAlign='left'; ctx.fillText(title, x+pad, top+pad+11); }
    ctx.font='12px ui-monospace,Menlo,Consolas,monospace'; ctx.textAlign='left';
    for(var i=0;i<n;i++){
      var L=lines[i], t=(typeof L==='string')?L:L.t, hl=(typeof L==='object')?L.hl:null;
      var ty=cy+i*lh+11;
      if(actLine!=null && ((typeof actLine==='number'&&i===actLine)||(actLine.indexOf&&actLine.indexOf(i)>=0))){ ctx.fillStyle='rgba(255,122,184,0.16)'; ctx.fillRect(x+4, cy+i*lh+1, w-8, lh-2); ctx.fillStyle=ROSE; ctx.fillRect(x+4, cy+i*lh+1, 3, lh-2); }
      if(hl && t.indexOf(hl)>=0){
        var a=t.split(hl), pre=a[0], post=a.slice(1).join(hl);
        ctx.fillStyle=DIM; ctx.fillText(pre, x+pad, ty);
        var wpre=ctx.measureText(pre).width;
        ctx.fillStyle=ROSE; ctx.fillText(hl, x+pad+wpre, ty);
        var whl=ctx.measureText(hl).width;
        ctx.fillStyle=DIM; ctx.fillText(post, x+pad+wpre+whl, ty);
      } else {
        ctx.fillStyle=(L.dim?DIM:'#efe4ea'); ctx.fillText(t, x+pad, ty);
      }
    }
    return top+ht;
  }

  // ══════════════════════════ 35.1 분산 파일 시스템 ══════════════════════════
  var NUMNODES35 = 6;
  function hashNode35(i){ return (i*97+13)%NUMNODES35; }
  function dfsCalc35(fileSize, chunkSize, R, killed){
    var chunkCount=Math.ceil(fileSize/chunkSize);
    var chunks=[];
    for(var i=0;i<chunkCount;i++){
      var p=hashNode35(i), nodes=[];
      for(var k=0;k<R;k++) nodes.push((p+k)%NUMNODES35);
      chunks.push({id:i, nodes:nodes});
    }
    var lost=0, affected=0;
    if(killed>=0){
      chunks.forEach(function(c){
        if(c.nodes.indexOf(killed)>=0) affected++;
        if(c.nodes.filter(function(n){return n!==killed;}).length===0) lost++;
      });
    }
    return {chunkCount:chunkCount, chunks:chunks, lost:lost, affected:affected};
  }

  // ══════════════════════════ 35.2 해시 파티셔닝 ══════════════════════════
  var KEYS35=['user_042','user_107','user_233','user_318','user_455','user_501','user_622','user_745','user_809','user_913','user_977','user_1002'];
  function hkey35(k){ var s=0; for(var i=0;i<k.length;i++) s+=k.charCodeAt(i); return s; }
  var HASH35 = KEYS35.map(hkey35);
  var BASE_N35 = 4;
  var BASE_ASSIGN35 = HASH35.map(function(h){ return h%BASE_N35; });

  // ══════════════════════════ 35.3 CAP — 분단 시뮬레이션 ══════════════════════════
  var CAP_V0_35 = 150;
  var CAP_EVENTS35 = [
    {region:'B', type:'read'},
    {region:'A', type:'read'},
    {region:'A', type:'write', val:180},
    {region:'B', type:'read'},
    {region:'A', type:'read'},
    {region:'B', type:'read'},
    {region:'A', type:'write', val:210}
  ];
  var CAP_SIM35 = (function(){
    var vA=CAP_V0_35, vB=CAP_V0_35, rows=[];
    CAP_EVENTS35.forEach(function(e){
      var cp = (e.region==='A') ? 'success' : 'fail';
      if(e.type==='write' && e.region==='A') vA=e.val;
      var trueLatest=vA, ap;
      if(e.type==='read'){
        var seen=(e.region==='A')?vA:vB;
        ap = (seen===trueLatest) ? 'fresh('+seen+')' : 'stale('+seen+'≠'+trueLatest+')';
      } else {
        ap='success('+e.val+')';
      }
      rows.push({region:e.region, type:e.type, val:e.val, cp:cp, ap:ap, vAafter:vA, vBafter:vB});
    });
    var cpSuccess=rows.filter(function(r){return r.cp==='success';}).length;
    var cpFail=rows.filter(function(r){return r.cp==='fail';}).length;
    var apStale=rows.filter(function(r){return r.ap.indexOf('stale')===0;}).length;
    var apFresh=rows.filter(function(r){return r.ap.indexOf('fresh')===0;}).length;
    return {rows:rows, cpSuccess:cpSuccess, cpFail:cpFail, apStale:apStale, apFresh:apFresh};
  })();

  // ══════════════════════════ 35.4 맵리듀스 워드카운트 ══════════════════════════
  var SENT35=['사과 바나나 사과 포도', '바나나 포도 사과', '포도 포도 바나나', '사과 바나나 포도 포도'];
  var MAP35 = (function(){ var out=[]; SENT35.forEach(function(s,si){ s.split(' ').forEach(function(w){ out.push({w:w, sent:si}); }); }); return out; })();
  var SHUFFLE35 = (function(){ var g={}; MAP35.forEach(function(p){ (g[p.w]=g[p.w]||[]).push(1); }); return g; })();
  var REDUCE35 = (function(){ var r={}; Object.keys(SHUFFLE35).forEach(function(k){ r[k]=SHUFFLE35[k].reduce(function(a,b){return a+b;},0); }); return r; })();
  var REDUCE35_TOTAL = Object.keys(REDUCE35).reduce(function(s,k){return s+REDUCE35[k];},0);

  // ══════════════════════════ 35.5 클라우드 탄력성 ══════════════════════════
  var DEMAND24 = [20,15,12,10,8,8,10,25,60,95,110,120,115,108,100,95,90,85,95,110,90,60,35,25];
  function cloudStats35(cap){
    var sn=DEMAND24.map(function(d){ return Math.ceil(d/cap); });
    var fixedServers=Math.max.apply(null,sn);
    var fixedHours=fixedServers*24;
    var elasticHours=sn.reduce(function(a,b){return a+b;},0);
    var save=Math.round((1-elasticHours/fixedHours)*1000)/10;
    return {sn:sn, fixedServers:fixedServers, fixedHours:fixedHours, elasticHours:elasticHours, save:save};
  }
  var CLOUD_BUCKETS35 = ['앱·데이터', '런타임·미들웨어·OS', '가상화·서버·스토리지·네트워크'];
  var CLOUD_LAYERS35 = [
    {name:'IaaS', prov:[false,false,true]},
    {name:'PaaS', prov:[false,true,true]},
    {name:'SaaS', prov:[true,true,true]}
  ];

  var scenes = [

  // ══════════ 1. 분산 파일 시스템 — 청크·복제·장애 대응 ══════════
  { id:'bda35_01',
    enter:function(E){ var self=this; self.s={fileSize:300, chunkSize:60, R:2, killed:-1};
      E.controls('<div class="ctrl"><label>파일 크기(MB)</label><input type="range" id="b351f" min="120" max="480" step="60" value="300"><output id="b351fo">300</output></div>'
               +'<div class="ctrl"><label>청크 크기(MB)</label><input type="range" id="b351c" min="30" max="120" step="30" value="60"><output id="b351co">60</output></div>'
               +'<div class="ctrl"><label>복제 계수 R</label><input type="range" id="b351r" min="1" max="3" step="1" value="2"><output id="b351ro">2</output></div>');
      E.bind('#b351f','input',function(e){ self.s.fileSize=+e.target.value; document.getElementById('b351fo').textContent=self.s.fileSize; });
      E.bind('#b351c','input',function(e){ self.s.chunkSize=+e.target.value; document.getElementById('b351co').textContent=self.s.chunkSize; });
      E.bind('#b351r','input',function(e){ self.s.R=+e.target.value; document.getElementById('b351ro').textContent=self.s.R; });
      E.setOn([]); },
    tap:function(E){ this.s.killed=(this.s.killed+2)%(NUMNODES35+1)-1; E.blip(360,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var D=dfsCalc35(s.fileSize, s.chunkSize, s.R, s.killed);
      var code=[
        {t:'n_chunk = ceil(file_size / chunk_size)', hl:'ceil'},
        {t:'node = (hash(chunk_id) + k) % 6  # k=0..R-1', hl:'hash(chunk_id)'},
        {t:'alive = [n for n in nodes if n != killed]', hl:'!= killed'},
        {t:'lost = sum(1 for c in chunks if not alive(c))', hl:'lost'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'gfs_chunks.py', s.killed>=0?[2,3]:1);
      var statY=codeBot+20;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('청크 수 = ceil('+s.fileSize+'/'+s.chunkSize+') = '+D.chunkCount+'개, 복제 R='+s.R, W*0.04, statY);
      if(s.killed<0){
        ctx.fillStyle=DIM; ctx.fillText('탭 = 노드 하나를 장애 상태로 (지금은 정상)', W*0.04, statY+22);
      } else {
        ctx.fillStyle=(D.lost>0)?RED:GRN;
        ctx.fillText('노드'+s.killed+' 장애 — 사본이 있던 청크 '+D.affected+'개 중 완전히 잃은 청크 '+D.lost+'개', W*0.04, statY+22);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText(D.lost===0?'복제본이 다른 노드에도 있어 데이터를 잃지 않았습니다':'복제 계수가 부족해 일부 청크의 사본이 모두 사라졌습니다', W*0.04, statY+42);
      }

      var rx0=W*0.50, rx1=W*0.965, gy0=30, cols=3, rowsN=2;
      var gw=(rx1-rx0-2*14)/cols, gh=150;
      for(var n=0;n<NUMNODES35;n++){
        var col=n%cols, row=Math.floor(n/cols);
        var bx=rx0+col*(gw+14), by=gy0+row*(gh+14);
        var isKilled=(n===s.killed);
        ctx.fillStyle=isKilled?'rgba(240,136,138,0.10)':'rgba(255,255,255,0.035)';
        ctx.strokeStyle=isKilled?RED:'rgba(255,255,255,0.25)'; ctx.lineWidth=1.2;
        roundRect(ctx,bx,by,gw,gh,8); ctx.fill(); ctx.stroke();
        ctx.font='600 11px sans-serif'; ctx.fillStyle=isKilled?RED:TXT; ctx.textAlign='left';
        ctx.fillText('노드'+n+(isKilled?' 장애':''), bx+6, by+14);
        var hosted=D.chunks.filter(function(c){ return c.nodes.indexOf(n)>=0; });
        var chipSz=15, perRow=Math.max(1,Math.floor((gw-12)/(chipSz+3)));
        hosted.forEach(function(c,ci){
          var cx=bx+6+(ci%perRow)*(chipSz+3), cy=by+22+Math.floor(ci/perRow)*(chipSz+3);
          if(cy+chipSz>by+gh-2) return;
          ctx.fillStyle=isKilled? 'rgba(155,153,163,0.5)' : CHUNK_COL[c.id%CHUNK_COL.length];
          roundRect(ctx,cx,cy,chipSz,chipSz,3); ctx.fill();
          ctx.fillStyle='#20141c'; ctx.textAlign='center';
          if(c.id<100){ ctx.font='11px ui-monospace,monospace'; ctx.fillText(''+c.id, cx+chipSz/2, cy+chipSz-4); }
        });
        if(isKilled){ ctx.strokeStyle=RED; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(bx+4,by+4); ctx.lineTo(bx+gw-4,by+gh-4); ctx.moveTo(bx+gw-4,by+4); ctx.lineTo(bx+4,by+gh-4); ctx.stroke(); }
      }

      E.tapHint(W/2, H*0.95, '슬라이더로 파일·청크 크기와 복제 계수를, 탭으로 장애 노드를 바꿔보세요', true);
      E.big('분산 파일 시스템 — 청크·복제·장애 대응', s.fileSize+'MB 파일을 '+s.chunkSize+'MB 청크로 쪼개면 실제로 '+D.chunkCount+'개의 청크가 생기고, 각 청크는 해시로 정해진 노드부터 시작해 '+s.R+'개 노드에 복제됩니다(구글 GFS·하둡 HDFS가 마스터-청크서버 구조로 하는 일입니다). '+(s.killed<0? '탭으로 노드 하나를 실제로 죽여 보면' : '지금 노드'+s.killed+'이 죽은 상태에서 실제로 세어 보면, 사본이 그 노드에 있던 청크 '+D.affected+'개 가운데 ')+(s.killed<0?'':(D.lost===0? '완전히 사라진 청크는 0개입니다 — 나머지 노드에 남은 복제본이 그대로 서비스를 이어받습니다.' : D.lost+'개는 복제본이 하나뿐이라(R=1) 함께 사라져 데이터를 완전히 잃습니다.'))+' 복제 계수 R을 1로 낮추면 노드 장애가 곧 데이터 손실이 되고, R을 2 이상으로 올리면 노드 하나쯤 죽어도 청크가 살아남는다는 사실을 슬라이더로 직접 확인할 수 있습니다.'); }
  },

  // ══════════ 2. 해시 파티셔닝 — 키를 나눠 담다 ══════════
  { id:'bda35_02',
    enter:function(E){ var self=this; self.s={n:4};
      E.controls('<div class="ctrl"><label>노드 수</label><input type="range" id="b352n" min="2" max="6" step="1" value="4"><output id="b352no">4</output></div>');
      E.bind('#b352n','input',function(e){ self.s.n=+e.target.value; document.getElementById('b352no').textContent=self.s.n; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, n=s.n;
      var cur = HASH35.map(function(h){ return h%n; });
      var moved = cur.filter(function(v,i){ return v!==BASE_ASSIGN35[i]; }).length;
      var code=[
        {t:'def h(key): return sum(map(ord, key))', hl:'sum(map(ord'},
        {t:'node = h(key) % n_nodes', hl:'% n_nodes'},
        {t:'moved = sum(1 for k in keys', hl:'moved'},
        {t:'            if node(k,n) != node(k,4))'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'hash_partition.py', n===BASE_N35?1:2);
      var statY=codeBot+20;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('노드 수 = '+n+' (기준 4개 대비)', W*0.04, statY);
      ctx.fillStyle= n===BASE_N35? GRN : RED;
      ctx.fillText(n===BASE_N35? '기준과 같은 노드 수 — 재배치 0건' : '재배치된 키 = '+moved+' / '+KEYS35.length+'건', W*0.04, statY+22);
      ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('키·값(Key-Value)·컬럼패밀리·문서·그래프, 어떤 NoSQL 자료모델이든 파티셔닝은 이 해시 규칙을 씁니다', W*0.04, statY+42);

      var rx0=W*0.50, rx1=W*0.965, by0=90, bh=180;
      var binW=(rx1-rx0-(n-1)*8)/n;
      for(var b=0;b<n;b++){
        var bx=rx0+b*(binW+8);
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
        roundRect(ctx,bx,by0,binW,bh,6); ctx.stroke();
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='center'; ctx.fillText('노드'+b, bx+binW/2, by0-8);
      }
      KEYS35.forEach(function(k,ki){
        var node=cur[ki], wasMoved=(node!==BASE_ASSIGN35[ki]);
        var slot=0; for(var j=0;j<ki;j++) if(cur[j]===node) slot++;
        var bx=rx0+node*(binW+8);
        var ky=by0+14+slot*16;
        if(ky>by0+bh-8) return;
        ctx.fillStyle= wasMoved? GLD : GRN;
        ctx.beginPath(); ctx.arc(bx+10,ky,4,0,7); ctx.fill();
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=wasMoved?GLD:TXT; ctx.textAlign='left';
        ctx.fillText(k.replace('user_',''), bx+18, ky+4);
      });
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
      ctx.fillText('금색 점 = 기준(노드4개)에서 재배치된 키, 초록 점 = 그대로인 키', rx0, by0+bh+16);

      E.tapHint(W/2, H*0.95, '슬라이더로 노드 수를 바꿔 재배치되는 키 수를 실제로 확인하세요', true);
      E.big('해시 파티셔닝 — 키를 나눠 담다', 'NoSQL 저장소는 각 키의 해시값(여기서는 문자 코드 합)을 노드 수로 나눈 나머지로 저장 위치를 정합니다. 노드 4개를 기준으로 배치한 뒤 노드 수를 '+n+'개로 바꿔보면, 거의 모든 키의 나머지 값이 달라져 실제로 '+(n===BASE_N35?0:moved)+'개('+KEYS35.length+'개 중)의 키가 다른 노드로 옮겨져야 합니다. 키·값 저장소(단순 키→값)든, 구글 빅테이블 같은 컬럼패밀리 저장소(row-key로 정렬), 문서 저장소(JSON 통째로), 그래프 저장소(노드·엣지)든 — 자료를 <b>어떻게</b> 담느냐는 저장소마다 다르지만 <b>어디에</b> 담을지 정하는 이 나머지 연산은 똑같이 씁니다. 노드가 하나 늘거나 줄 때마다 대부분의 키가 재배치된다는 사실이, 다음 장면 CAP 정리에서 다룰 「분산 저장은 왜 이렇게 다루기 까다로운가」의 첫 번째 이유입니다.'); }
  },

  // ══════════ 3. CAP 정리 — 갈라진 네트워크에서 무엇을 지킬 것인가 ══════════
  { id:'bda35_03',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'if region == minority:', dim:true},
        {t:'    return UNAVAILABLE  # CP', hl:'UNAVAILABLE'},
        {t:'else:', dim:true},
        {t:'    return local_value  # AP(오래될 수 있음)', hl:'local_value'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'cap_policy.py', s.step===1?[0,1]:(s.step===2?[2,3]:null));
      var caps=['① 네트워크가 갈라졌습니다 — A(노드 2개, 다수파)와 B(노드 1개, 소수파)가 서로 통신할 수 없습니다',
                 '② CP(일관성 우선) — 소수파 B는 최신값을 보장 못하니 아예 응답을 거부합니다',
                 '③ AP(가용성 우선) — B도 응답은 하지만, 자신이 마지막으로 알던 값을 돌려줍니다'];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step], W*0.04, codeBot+20);
      var statY=codeBot+42;
      ctx.font='12.5px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
      if(s.step===0){
        ctx.fillStyle=GLD; ctx.fillText('분단 전 마지막 합의값 = '+CAP_V0_35, W*0.04, statY);
      } else if(s.step===1){
        ctx.fillStyle=RED; ctx.fillText('CP: 성공 '+CAP_SIM35.cpSuccess+'건(A) · 거부 '+CAP_SIM35.cpFail+'건(B)', W*0.04, statY);
      } else {
        ctx.fillStyle=GLD; ctx.fillText('AP: 신선한 응답 '+CAP_SIM35.apFresh+'건 · 오래된 응답 '+CAP_SIM35.apStale+'건', W*0.04, statY);
      }

      var rx0=W*0.50, rx1=W*0.965, topY=28;
      var aX=rx0+70, bX=rx1-50, midX=(aX+bX)/2;
      ctx.font='600 11px sans-serif'; ctx.fillStyle=BLU; ctx.textAlign='center'; ctx.fillText('지역 A(다수파)', aX, topY);
      ctx.fillStyle=ORG; ctx.fillText('지역 B(소수파)', bX, topY);
      [[-16,0],[16,0]].forEach(function(o){ ctx.fillStyle=BLU; ctx.beginPath(); ctx.arc(aX+o[0],topY+18,6,0,7); ctx.fill(); });
      ctx.fillStyle=ORG; ctx.beginPath(); ctx.arc(bX,topY+18,6,0,7); ctx.fill();
      ctx.strokeStyle=RED; ctx.setLineDash([5,4]); ctx.lineWidth=1.6;
      ctx.beginPath(); ctx.moveTo(midX,topY+2); ctx.lineTo(midX,topY+34); ctx.stroke(); ctx.setLineDash([]);
      ctx.font='11px sans-serif'; ctx.fillStyle=RED; ctx.fillText('✂ 분단', midX, topY+46);

      if(s.step>=1){
        var ty0=topY+66, rh=15.5;
        var colX=[rx0, rx0+34, rx0+80, rx0+150, rx0+240];
        ctx.font='600 11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ['#','지역','종류','CP','AP'].forEach(function(h,hi){ ctx.fillText(h, colX[hi], ty0); });
        ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.moveTo(rx0,ty0+6); ctx.lineTo(rx1,ty0+6); ctx.stroke();
        ctx.font='11px ui-monospace,Menlo,monospace';
        CAP_SIM35.rows.forEach(function(r,ri){
          var ry=ty0+22+ri*rh;
          ctx.fillStyle=DIM; ctx.fillText(''+(ri+1), colX[0], ry);
          ctx.fillStyle=(r.region==='A')?BLU:ORG; ctx.fillText(r.region, colX[1], ry);
          ctx.fillStyle=TXT; ctx.fillText(r.type==='write'?('쓰기→'+r.val):'읽기', colX[2], ry);
          ctx.fillStyle = s.step>=1 ? (r.cp==='success'?GRN:RED) : DIM;
          ctx.fillText(s.step>=1?(r.cp==='success'?'성공':'거부'):'', colX[3], ry);
          ctx.fillStyle = s.step>=2 ? (r.ap.indexOf('stale')===0?RED:GRN) : DIM;
          ctx.fillText(s.step>=2?r.ap:'', colX[4], ry);
        });
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (분단 → CP 결과 → AP 결과)', true);
      E.big('CAP 정리 — 갈라진 네트워크에서 무엇을 지킬 것인가', '노드 3개(A 2개·B 1개)가 값 '+CAP_V0_35+'로 합의된 상태에서 네트워크가 실제로 갈라집니다. 분단 중 일어난 이벤트 7건을 두 정책으로 시뮬레이션하면: <b>CP(일관성 우선)</b>는 다수파 A의 4건(읽기·쓰기 포함)은 모두 성공시키지만, 소수파 B의 3건은 최신값을 보장할 수 없으니 전부 응답을 거부합니다(가용성을 포기). <b>AP(가용성 우선)</b>는 7건 모두 응답하지만, B의 읽기 3건 중 실제로 '+CAP_SIM35.apStale+'건은 분단 중 A에서 일어난 갱신을 반영하지 못해 오래된 값을 돌려줍니다(일관성을 포기) — 나머지 1건은 마침 그 시점까지 A에 변경이 없어 우연히 최신이었을 뿐입니다. CAP 정리는 「분단이 실제로 일어났을 때 일관성과 가용성을 동시에 모두 지킬 수는 없다」는 것을 뜻하며, 그래서 실무의 많은 NoSQL은 처음부터 AP를 택하고 <b>최종 일관성(Eventual Consistency)</b>으로 타협합니다 — 분단이 풀리면 뒤늦게라도 값을 맞춥니다.'); }
  },

  // ══════════ 4. 맵리듀스 — 흩어져 세다 ══════════
  { id:'bda35_04',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'for sent in docs:', dim:true},
        {t:'    for w in sent.split():', dim:true},
        {t:'        emit(w, 1)  # map', hl:'emit'},
        {t:'groups[w].sum()  # shuffle→reduce', hl:'groups[w].sum()'}
      ];
      var act=[null,[0,1,2],2,3][s.step];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'wordcount.py', act);
      var caps=['① 입력 — 고정 문장 4개', '② map — 문장을 단어로 쪼개 (단어,1) 쌍으로', '③ shuffle — 같은 단어끼리 실제로 묶습니다', '④ reduce — 묶인 그룹을 실제로 더해 최종 개수를'];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step], W*0.04, codeBot+20);
      var statY=codeBot+42;
      ctx.font='12.5px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
      if(s.step===0) { ctx.fillStyle=GLD; ctx.fillText('총 단어 수 = '+MAP35.length+'개(4문장)', W*0.04, statY); }
      else if(s.step===1){ ctx.fillStyle=GRN; ctx.fillText('(단어,1) 쌍 = '+MAP35.length+'개 생성', W*0.04, statY); }
      else if(s.step===2){ ctx.fillStyle=BLU; ctx.fillText('그룹 '+Object.keys(SHUFFLE35).length+'개(사과·바나나·포도)로 묶임', W*0.04, statY); }
      else { ctx.fillStyle=GLD; ctx.fillText('최종 합계 총합 = '+REDUCE35_TOTAL+' (=입력 단어 수와 일치)', W*0.04, statY); }

      var rx0=W*0.50, rx1=W*0.965, by0=26;
      if(s.step===0){
        ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT; ctx.textAlign='left';
        SENT35.forEach(function(sen,si){ ctx.fillText((si+1)+') '+sen, rx0, by0+24+si*26); });
      } else if(s.step===1){
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
        var perRow=4, cw=(rx1-rx0)/perRow;
        MAP35.forEach(function(p,pi){
          var col=pi%perRow, row=Math.floor(pi/perRow);
          var px=rx0+col*cw, py=by0+18+row*17;
          if(py>350) return;
          ctx.fillStyle= (p.w==='사과')?GRN:((p.w==='바나나')?BLU:GLD);
          ctx.fillText('('+p.w+',1)', px, py);
        });
      } else if(s.step===2){
        var keys=Object.keys(SHUFFLE35), kx=rx0, kw=(rx1-rx0-2*16)/3;
        var cols2=[GRN,BLU,GLD];
        keys.forEach(function(k,ki){
          var bx=kx+ki*(kw+16);
          ctx.strokeStyle='rgba(255,255,255,0.25)'; roundRect(ctx,bx,by0+16,kw,150,8); ctx.stroke();
          ctx.font='600 11.5px sans-serif'; ctx.fillStyle=cols2[ki]; ctx.textAlign='center'; ctx.fillText(k, bx+kw/2, by0+34);
          SHUFFLE35[k].forEach(function(v,vi){
            var row=Math.floor(vi/3), colc=vi%3;
            if(by0+52+row*16>by0+160) return;
            ctx.font='11px ui-monospace,monospace'; ctx.fillStyle=cols2[ki]; ctx.textAlign='center';
            ctx.fillText('1', bx+16+colc*((kw-32)/2), by0+52+row*16);
          });
        });
      } else {
        var keys2=Object.keys(REDUCE35), bx0=rx0, bh=140, bw2=(rx1-rx0-2*20)/3;
        var maxv=Math.max.apply(null, keys2.map(function(k){return REDUCE35[k];}));
        var cols3=[GRN,BLU,GLD];
        keys2.forEach(function(k,ki){
          var xk=bx0+ki*(bw2+20), hh=(REDUCE35[k]/maxv)*bh;
          ctx.fillStyle=cols3[ki]; ctx.fillRect(xk, by0+30+bh-hh, bw2, hh);
          ctx.font='600 12px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='center'; ctx.fillText(k, xk+bw2/2, by0+30+bh+16);
          ctx.font='12px ui-monospace,monospace'; ctx.fillStyle=cols3[ki]; ctx.fillText(''+REDUCE35[k], xk+bw2/2, by0+30+bh-hh-8);
        });
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (입력 → map → shuffle → reduce)', true);
      E.big('맵리듀스 — 흩어져 세다', '고정 문장 4개에서 시작해 단어 개수를 실제로 세어 봅니다. <b>map</b>은 각 문장을 단어로 쪼개 (단어,1) 쌍 '+MAP35.length+'개를 만듭니다 — 이 작업은 문장마다 독립적이라 여러 대의 컴퓨터에 나눠 동시에 돌릴 수 있습니다. <b>shuffle</b>은 같은 단어의 (단어,1) 쌍들을 한 곳으로 실제로 모읍니다: 사과 '+SHUFFLE35['사과'].length+'개·바나나 '+SHUFFLE35['바나나'].length+'개·포도 '+SHUFFLE35['포도'].length+'개. <b>reduce</b>는 모인 1들을 더해 최종 개수(사과 '+REDUCE35['사과']+'·바나나 '+REDUCE35['바나나']+'·포도 '+REDUCE35['포도']+')를 만들고, 그 합('+REDUCE35_TOTAL+')은 원래 단어 총수와 정확히 일치합니다. 하둡 MapReduce는 이 세 단계를 블록(기본 64MB) 단위로 쪼갠 수백·수천 대의 서버에서 자동으로 병렬 실행하고 장애 복구까지 처리해, 개발자는 map과 reduce 두 함수만 작성하면 됩니다.'); }
  },

  // ══════════ 5. 클라우드 인프라 — 가상화와 탄력적 확장 ══════════
  { id:'bda35_05',
    enter:function(E){ var self=this; self.s={cap:40};
      E.controls('<div class="ctrl"><label>서버 1대 처리 용량(요청/시간)</label><input type="range" id="b355c" min="20" max="60" step="5" value="40"><output id="b355co">40</output></div>');
      E.bind('#b355c','input',function(e){ self.s.cap=+e.target.value; document.getElementById('b355co').textContent=self.s.cap; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var C=cloudStats35(s.cap);
      var code=[
        {t:'need = [ceil(d/capacity) for d in demand24]', hl:'ceil(d/capacity)'},
        {t:'fixed_hours = max(need) * 24', hl:'fixed_hours'},
        {t:'elastic_hours = sum(need)', hl:'elastic_hours'},
        {t:'save = 1 - elastic_hours/fixed_hours', hl:'save'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'elastic_scale.py', 3);
      var statY=codeBot+18;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=RED; ctx.fillText('고정 프로비저닝 = '+C.fixedServers+'대 × 24h = '+C.fixedHours+' 서버·시간', W*0.04, statY);
      ctx.fillStyle=GRN; ctx.fillText('탄력적 확장 = '+C.elasticHours+' 서버·시간 → '+C.save+'% 절감', W*0.04, statY+20);

      var rx0=W*0.50, rx1=W*0.965, cTop=28, cBot=190;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(rx0,cBot); ctx.lineTo(rx1,cBot); ctx.stroke();
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText('시간대별 필요 서버 수(막대) vs 고정 프로비저닝(점선)', rx0, cTop-8);
      var maxN=Math.max(C.fixedServers, Math.max.apply(null,C.sn))+1;
      var bw3=(rx1-rx0)/24*0.72;
      function cy(v){ return cBot-(v/maxN)*(cBot-cTop); }
      C.sn.forEach(function(v,h){
        var x=rx0+(h+0.14)*((rx1-rx0)/24);
        ctx.fillStyle=BLU; ctx.fillRect(x, cy(v), bw3, cBot-cy(v));
      });
      ctx.strokeStyle=GLD; ctx.setLineDash([4,3]); ctx.lineWidth=1.6;
      ctx.beginPath(); ctx.moveTo(rx0,cy(C.fixedServers)); ctx.lineTo(rx1,cy(C.fixedServers)); ctx.stroke(); ctx.setLineDash([]);
      ctx.font='11px sans-serif'; ctx.fillStyle=GLD; ctx.textAlign='left'; ctx.fillText('고정 '+C.fixedServers+'대', rx0+4, cy(C.fixedServers)-6);

      var ty0=cBot+20;
      ctx.font='600 11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText('책임 분담 — 색칠 칸 = 제공자가 관리, 빈 칸 = 사용자가 직접 관리', rx0, ty0);
      var gx0=rx0+46, gy0=ty0+12, cellW=(rx1-gx0)/3, cellH=26;
      CLOUD_BUCKETS35.forEach(function(b,bi){
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
        var words=b.split('·');
        ctx.fillText(words.slice(0,2).join('·'), gx0+bi*cellW+cellW/2, gy0-4);
      });
      CLOUD_LAYERS35.forEach(function(L,li){
        var ry=gy0+li*(cellH+4);
        ctx.font='600 11px sans-serif'; ctx.fillStyle=GLD; ctx.textAlign='left'; ctx.fillText(L.name, rx0, ry+cellH/2+4);
        L.prov.forEach(function(isProv,bi){
          var cx=gx0+bi*cellW, cy2=ry;
          ctx.fillStyle= isProv? 'rgba(255,210,122,0.30)' : 'rgba(255,255,255,0.04)';
          ctx.strokeStyle= isProv? GLD : 'rgba(255,255,255,0.25)'; ctx.lineWidth=1.1;
          roundRect(ctx,cx+3,cy2,cellW-8,cellH,5); ctx.fill(); ctx.stroke();
        });
      });

      E.tapHint(W/2, H*0.95, '슬라이더로 서버 1대 처리 용량을 바꿔 절감률이 실제로 바뀌는 것을 보세요', true);
      E.big('클라우드 인프라 — 가상화와 탄력적 확장', '가상화는 물리 서버 한 대를 여러 개의 논리적 서버(가상머신)로 쪼개, 실제 필요한 만큼만 서버를 만들었다 지울 수 있게 합니다. 하루 24시간의 요청량을 놓고, 피크에 맞춰 서버를 고정으로 '+C.fixedServers+'대 켜 두는 방식은 하루 '+C.fixedHours+' 서버·시간을 쓰지만, 시간마다 필요한 만큼만 늘리고 줄이는 <b>탄력적 확장</b>은 실제로 '+C.elasticHours+' 서버·시간만 씁니다 — 같은 일을 하고도 '+C.save+'% 적은 자원입니다. 이 탄력성 위에서 인프라(IaaS)는 서버·스토리지·네트워크까지만 제공자가 관리하고 그 위는 사용자 몫이며, 플랫폼(PaaS)은 실행 환경(런타임)까지, 소프트웨어(SaaS)는 애플리케이션까지 제공자가 전부 관리합니다 — 무엇을 직접 다룰지가 세 서비스 모델을 가르는 기준입니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
