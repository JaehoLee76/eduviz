/* 빅데이터 분석 제34장 — 데이터가 흘러 모이는 길 (ETL·CDC·EAI·연계통합·대용량 비정형 수집)
   동작(behavior)만. 텍스트=content/bda34.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 화면의 모든 수(추출/변환/적재 행 수, CDC 이동 행 수, EAI 연결 수, 배치/스트림 지연시간,
   로그 파싱 성공/실패 건수 등)는 아래 고정 데이터로부터 이 파일 로드 시 실제 계산(하드코딩 금지).
   난수(Math.random) 절대 금지 — 예제 데이터는 전부 고정 배열/식. */
(function(){
  var ROSE='#ff7ab8', GRN='#7ee0b0', BLU='#7ab8ff', GLD='#ffd27a', DIM='#9b99a3', RED='#f0888a', TXT='#eadfe8', PUR='#c79dff', ORG='#ffb27a';

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

  // ══════════════════════════ 34.1 ETL: 주문 원본 12행(시스템 A·B) ══════════════════════════
  var ORD34 = [
    {id:'O1',  sys:'A', date:'2024-01-05', amt:15000,     cust:'C1002'},
    {id:'O2',  sys:'A', date:'2024-01-06', amt:null,      cust:'C1005'},
    {id:'O3',  sys:'A', date:'24/01/07',   amt:'22,000',  cust:'C1010'},
    {id:'O4',  sys:'A', date:'2024-01-08', amt:9000,      cust:null},
    {id:'O5',  sys:'A', date:'2024.01.09', amt:'13500원', cust:'C1003'},
    {id:'O6',  sys:'A', date:'2024-01-10', amt:18000,     cust:'C1002'},
    {id:'O7',  sys:'B', date:'2024-01-05', amt:'31000',   cust:'C2001'},
    {id:'O8',  sys:'B', date:'24/01/06',   amt:null,      cust:'C2002'},
    {id:'O9',  sys:'B', date:'2024.01.07', amt:12000,     cust:'C2003'},
    {id:'O10', sys:'B', date:'2024-01-08', amt:'8,500원', cust:null},
    {id:'O11', sys:'B', date:'2024-01-09', amt:27000,     cust:'C2004'},
    {id:'O12', sys:'B', date:'24/01/10',   amt:16000,     cust:'C2005'}
  ];
  function parseAmt34(v){ if(v==null) return null; if(typeof v==='number') return v; var n=parseInt(String(v).replace(/[,원]/g,''),10); return isNaN(n)?null:n; }
  function normDate34(v){
    if(/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    var m2=/^(\d{2})\/(\d{2})\/(\d{2})$/.exec(v); if(m2) return '20'+m2[1]+'-'+m2[2]+'-'+m2[3];
    var m3=/^(\d{4})\.(\d{2})\.(\d{2})$/.exec(v); if(m3) return m3[1]+'-'+m3[2]+'-'+m3[3];
    return v;
  }
  function median34(arr){ var s=arr.slice().sort(function(a,b){return a-b;}); var n=s.length; return n%2? s[(n-1)/2] : (s[n/2-1]+s[n/2])/2; }
  var ETL34=(function(){
    var known=ORD34.map(function(r){return parseAmt34(r.amt);}).filter(function(v){return v!=null;});
    var med=median34(known);
    var amtMissingFilled=0, amtFmtFixed=0, dateFmtFixed=0;
    var rows=ORD34.map(function(r){
      var parsed=parseAmt34(r.amt), wasMissing=(parsed==null), wasStr=(typeof r.amt==='string');
      if(wasMissing){ parsed=med; amtMissingFilled++; } else if(wasStr){ amtFmtFixed++; }
      var dn=normDate34(r.date), dateChanged=(dn!==r.date);
      if(dateChanged) dateFmtFixed++;
      return {id:r.id, sys:r.sys, dateRaw:r.date, dateNorm:dn, dateChanged:dateChanged, amtRaw:r.amt, amtNorm:parsed, amtChanged:(wasMissing||wasStr), cust:r.cust};
    });
    var loaded=rows.filter(function(r){return r.cust!=null;});
    var dropped=rows.filter(function(r){return r.cust==null;});
    return {rows:rows, med:med, amtMissingFilled:amtMissingFilled, amtFmtFixed:amtFmtFixed, dateFmtFixed:dateFmtFixed, loaded:loaded, dropped:dropped};
  })();

  // ══════════════════════════ 34.2 CDC: 고객 잔액 10행 ══════════════════════════
  var CDC34 = [
    {id:'M1', val:15000, ts:91}, {id:'M2', val:22000, ts:93}, {id:'M3', val:9000, ts:95},
    {id:'M4', val:13500, ts:96}, {id:'M5', val:18000, ts:97}, {id:'M6', val:31000, ts:98},
    {id:'M7', val:12000, ts:99}, {id:'M8', val:27000, ts:100}, {id:'M9', val:16000, ts:94},
    {id:'M10',val:8500,  ts:92}
  ];
  var LAST_SYNC34 = 100;
  var CHANGED_IDX34 = [2,5,8];
  var CDC34_AFTER = CDC34.map(function(r,i){
    if(CHANGED_IDX34.indexOf(i)>=0) return {id:r.id, oldVal:r.val, val:r.val+(i+1)*500, ts:LAST_SYNC34+1+i, changed:true};
    return {id:r.id, oldVal:r.val, val:r.val, ts:r.ts, changed:false};
  });
  var FULL_MOVE34 = CDC34_AFTER.length;
  var CDC_MOVE34 = CDC34_AFTER.filter(function(r){ return r.ts>LAST_SYNC34; }).length;
  var SAVE_PCT34 = Math.round((1-CDC_MOVE34/FULL_MOVE34)*1000)/10;

  // ══════════════════════════ 34.3 EAI: 시스템 수 n ══════════════════════════
  var SYS34=['ERP','SCM','CRM','MES','WMS','HR','FIN','BI'];
  var N_RANGE34=[3,4,5,6,7,8];
  function p2pEdges34(n){ var e=[]; for(var i=0;i<n;i++) for(var j=i+1;j<n;j++) e.push([i,j]); return e; }
  var GROWTH34 = N_RANGE34.map(function(n){ return {n:n, p2p:p2pEdges34(n).length, hub:n}; });

  // ══════════════════════════ 34.4 배치 vs 스트림 ══════════════════════════
  var EVQ34 = [0.20,0.30,0.35,0.40, 1.10,1.15,1.20, 2.00,2.01,2.02,2.03,2.04,2.05,2.06, 4.00,4.50, 5.00,5.05,5.10, 7.00,7.10];
  var ST34 = 0.05;
  function batchStats34(W){
    var lat=[], buckets={};
    EVQ34.forEach(function(t){ var b=Math.floor(t/W), pt=(b+1)*W; lat.push(pt-t); buckets[b]=true; });
    var avg=lat.reduce(function(a,b){return a+b;},0)/lat.length;
    return {avg:avg, batches:Object.keys(buckets).length, lat:lat};
  }
  var STREAM34=(function(){
    var finish=0, lat=[];
    EVQ34.forEach(function(t){ var start=Math.max(t,finish); finish=start+ST34; lat.push(finish-t); });
    var avg=lat.reduce(function(a,b){return a+b;},0)/lat.length;
    return {avg:avg, ops:EVQ34.length, lat:lat};
  })();

  // ══════════════════════════ 34.5 비정형 로그 파싱 ══════════════════════════
  var RAWLOGS34 = [
    'INFO 2024-01-05T10:22:31 user_login success',
    'ERROR 2024-01-05T10:23:02 payment_failed code=402',
    'WARN 2024-01-05T10:23:10 low_disk_space 12%',
    'user clicked the buy button',
    'INFO 2024-01-05T10:24:00 page_view /home',
    '2024-01-05T10:24:15 DEBUG cache_miss key=xyz',
    'ERROR 2024-01-05T10:25:30 db_timeout retries=3',
    'INFO 2024-01-05T10:26:00 user_logout',
    '!!! garbage 12345 !!!',
    'INFO 2024-01-05T10:27:10 order_placed id=558'
  ];
  var LOGRE34 = /^(INFO|WARN|ERROR)\s+(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})\s+(.+)$/;
  var LOG34=(function(){
    var parsed=RAWLOGS34.map(function(line){ var m=LOGRE34.exec(line); return m? {ok:true, level:m[1], ts:m[2], msg:m[3], raw:line} : {ok:false, raw:line}; });
    var ok=parsed.filter(function(p){return p.ok;});
    var fail=parsed.filter(function(p){return !p.ok;});
    var lv={INFO:0,WARN:0,ERROR:0};
    ok.forEach(function(p){ lv[p.level]++; });
    return {parsed:parsed, ok:ok, fail:fail, lv:lv};
  })();

  var scenes = [

  // ══════════ 1. ETL — 추출·변환·적재 ══════════
  { id:'bda34_01',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'raw = extract(sys_a, sys_b)  # 12행', hl:'extract'},
        {t:'clean = transform(raw)  # 보정', hl:'transform'},
        {t:"clean = clean.dropna(subset=['cust'])", hl:'dropna'},
        {t:'dw.load(clean)  # 최종적재', hl:'load'}
      ];
      var act = s.step===0?0 : (s.step===1?[1,2]:3);
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'etl_pipeline.py', act);

      var caps=['① 추출 — 시스템 A·B의 원본 12행, 형식·결측 뒤섞인 채',
                 '② 변환 — 결측 금액 중앙값 채움, 날짜·금액 형식 통일',
                 '③ 적재 — 고객ID 없는 행 제외, 나머지 적재'];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step], W*0.04, codeBot+20);

      var statY=codeBot+44;
      ctx.font='12.5px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
      if(s.step===0){
        ctx.fillStyle=GLD; ctx.fillText('추출 행 수 = '+ETL34.rows.length+'건 (시스템A 6 + 시스템B 6)', W*0.04, statY);
      } else if(s.step===1){
        ctx.fillStyle=GRN; ctx.fillText('결측채움 '+ETL34.amtMissingFilled+'건 · 금액형식 '+ETL34.amtFmtFixed+'건 · 날짜형식 '+ETL34.dateFmtFixed+'건', W*0.04, statY);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('채움값 = 금액 중앙값 '+ETL34.med.toLocaleString()+'원', W*0.04, statY+20);
      } else {
        ctx.fillStyle=RED; ctx.fillText('고객ID 없어 제외 '+ETL34.dropped.length+'건 → 최종 적재 '+ETL34.loaded.length+'건', W*0.04, statY);
      }

      var rx0=W*0.50, rx1=W*0.965, by0=26, rh=15;
      var colX=[rx0, rx0+42, rx0+80, rx0+192, rx0+284];
      ctx.font='600 11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
      ['ID','계','날짜','금액','고객'].forEach(function(h,hi){ ctx.fillText(h, colX[hi], by0); });
      ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.moveTo(rx0,by0+6); ctx.lineTo(rx1,by0+6); ctx.stroke();
      ctx.font='11px ui-monospace,Menlo,monospace';
      ETL34.rows.forEach(function(r,ri){
        var ry=by0+22+ri*rh;
        if(ri===6){ ctx.strokeStyle='rgba(255,255,255,0.14)'; ctx.beginPath(); ctx.moveTo(rx0,ry-11); ctx.lineTo(rx1,ry-11); ctx.stroke(); }
        var dropped=(r.cust==null);
        if(s.step===2 && dropped){
          ctx.fillStyle='rgba(155,153,163,0.6)';
          ctx.fillText(r.id, colX[0], ry); ctx.fillText(r.sys, colX[1], ry);
          ctx.fillText('— 고객ID 없어 제외 —', colX[2], ry);
          return;
        }
        ctx.fillStyle=TXT; ctx.fillText(r.id, colX[0], ry); ctx.fillText(r.sys, colX[1], ry);
        var showDate = s.step===0? r.dateRaw : r.dateNorm;
        ctx.fillStyle = (s.step>=1 && r.dateChanged) ? GRN : TXT;
        ctx.fillText(showDate, colX[2], ry);
        var showAmt = s.step===0? (r.amtRaw==null?'—':String(r.amtRaw)) : r.amtNorm.toLocaleString();
        ctx.fillStyle = (r.amtRaw==null && s.step===0) ? RED : ((s.step>=1 && r.amtChanged) ? GRN : TXT);
        ctx.fillText(showAmt, colX[3], ry);
        ctx.fillStyle = dropped? RED : TXT;
        ctx.fillText(r.cust==null?'—':r.cust, colX[4], ry);
      });

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (추출 → 변환 → 적재)', true);
      E.big('데이터가 흘러 모이는 길', '주문 원본 12행이 시스템 A·B에서 나와 하나의 데이터 웨어하우스로 모이는 과정을 실제로 밟아봅니다. <b>추출</b>은 12건을 형식·결측이 뒤섞인 채 그대로 가져옵니다. <b>변환</b>은 결측 금액 '+ETL34.amtMissingFilled+'건을 중앙값 '+ETL34.med.toLocaleString()+'원으로 채우고, 금액 형식 '+ETL34.amtFmtFixed+'건과 날짜 형식 '+ETL34.dateFmtFixed+'건을 통일합니다. <b>적재</b>는 고객ID가 없어 되살릴 수 없는 '+ETL34.dropped.length+'건을 제외하고 '+ETL34.loaded.length+'건만 최종 적재합니다 — 화면의 모든 숫자는 실제로 12행을 하나씩 처리한 결과입니다.'); }
  },

  // ══════════ 2. CDC — 바뀐 것만 옮기기 ══════════
  { id:'bda34_02',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'last_sync = '+LAST_SYNC34, dim:true},
        {t:'delta = df[df.ts > last_sync]  # CDC', hl:'df.ts > last_sync'},
        {t:'target.upsert(delta)  # 변경분만', hl:'upsert'},
        {t:'# vs target.truncate(); target.insert(df)'}
      ];
      var act = s.step<=1?0 : (s.step===2? [0]:[1,2]);
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'cdc_sync.py', s.step===3?[1,2]:(s.step===2?null:0));

      var caps=['① 마지막 동기화 시점(ts='+LAST_SYNC34+') 이후 바뀐 행이 있는지 봅니다',
                 '② 실제로 3건을 변경합니다 — 값이 바뀌고 타임스탬프가 '+LAST_SYNC34+'을 넘습니다',
                 '③ 「전체 재적재」 방식 — 매번 전체 행을 다시 옮깁니다',
                 '④ 「CDC(타임스탬프)」 방식 — ts>'+LAST_SYNC34+'인 행만 옮깁니다'];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step], W*0.04, codeBot+20);

      var statY=codeBot+42;
      ctx.font='12.5px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
      if(s.step<2){
        ctx.fillStyle=GLD; ctx.fillText('실제 변경 행 수 = '+CHANGED_IDX34.length+'건', W*0.04, statY);
      } else if(s.step===2){
        ctx.fillStyle=RED; ctx.fillText('전체 재적재가 옮기는 행 = '+FULL_MOVE34+'건', W*0.04, statY);
      } else {
        ctx.fillStyle=GRN; ctx.fillText('CDC가 옮기는 행 = '+CDC_MOVE34+'건 (절감 '+SAVE_PCT34+'%)', W*0.04, statY);
      }

      var rx0=W*0.50, rx1=W*0.965, by0=26, rh=15;
      var colX=[rx0, rx0+50, rx0+180, rx0+280];
      ctx.font='600 11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
      ['ID','값','ts','상태'].forEach(function(h,hi){ ctx.fillText(h, colX[hi], by0); });
      ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.moveTo(rx0,by0+6); ctx.lineTo(rx1,by0+6); ctx.stroke();
      ctx.font='11px ui-monospace,Menlo,monospace';
      CDC34_AFTER.forEach(function(r,ri){
        var ry=by0+22+ri*rh, changedNow=(s.step>=1 && r.changed);
        ctx.fillStyle=TXT; ctx.fillText(r.id, colX[0], ry);
        ctx.fillStyle= changedNow? GLD: TXT;
        ctx.fillText(s.step>=1? (r.changed? (r.oldVal.toLocaleString()+'→'+r.val.toLocaleString()) : r.val.toLocaleString()) : r.oldVal.toLocaleString(), colX[1], ry);
        ctx.fillStyle= changedNow? GLD: DIM;
        ctx.fillText(''+(s.step>=1? r.ts : (r.changed? CDC34[ri].ts : r.ts)), colX[2], ry);
        if(s.step>=2){
          var moved = (s.step===2) ? true : r.changed;
          ctx.fillStyle= moved? (s.step===2?BLU:GRN) : DIM;
          ctx.fillText(moved?'이동':'생략', colX[3], ry);
        } else if(changedNow){
          ctx.fillStyle=GLD; ctx.fillText('변경됨', colX[3], ry);
        }
      });

      if(s.step>=2){
        var bx0=rx0, by=316, bh=40, bw=(rx1-rx0-30)/2;
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText('이번 동기화가 옮기는 행 수', bx0, by-24);
        var vals=[{name:'전체 재적재',v:FULL_MOVE34,col:RED},{name:'CDC',v:CDC_MOVE34,col:GRN}];
        vals.forEach(function(v,vi){
          var xk=bx0+vi*(bw+30);
          var hh=(v.v/FULL_MOVE34)*bh;
          ctx.fillStyle=(s.step===2&&vi===1)||(s.step===3&&vi===0)? 'rgba(255,255,255,0.25)': v.col;
          ctx.fillRect(xk, by+bh-hh, bw, hh);
          ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='center';
          ctx.fillText(v.name, xk+bw/2, by+bh+14);
          ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=v.col;
          ctx.fillText(v.v+'건', xk+bw/2, by+bh-hh-6);
        });
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (기준 → 변경 → 전체재적재 → CDC)', true);
      E.big('CDC — 바뀐 것만 옮기기', '고객 잔액 10행에서 마지막 동기화 이후 실제로 3건을 변경합니다. 「전체 재적재」는 매번 전체 '+FULL_MOVE34+'건을 통째로 다시 옮기지만, 「CDC(변경 데이터 캡처)」는 타임스탬프가 마지막 동기화(ts='+LAST_SYNC34+')를 넘는 '+CDC_MOVE34+'건만 골라 옮깁니다 — 같은 결과에 도달하는 데 '+SAVE_PCT34+'% 적은 데이터만 움직입니다. 타임스탬프 방식 외에도 레코드에 버전 번호를 매겨 더 높은 버전만 골라내는 방식, True/False 상태 값으로 표시하는 방식, 데이터베이스 트리거로 변경 즉시 전파하는 방식, 트랜잭션 로그를 훑어 변경 내역을 읽어내는 방식이 있습니다 — 어떤 방식이든 목표는 같습니다: 안 바뀐 데이터는 두 번 옮기지 않는 것.'); }
  },

  // ══════════ 3. EAI — 연결의 폭증과 허브 ══════════
  { id:'bda34_03',
    enter:function(E){ var self=this; self.s={n:5};
      E.controls('<div class="ctrl"><label>연결할 시스템 수 n</label><input type="range" id="b343n" min="3" max="8" step="1" value="5"><output id="b343no">5</output></div>');
      E.bind('#b343n','input',function(e){ self.s.n=+e.target.value; document.getElementById('b343no').textContent=self.s.n; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, n=s.n;
      var edges=p2pEdges34(n), p2pN=edges.length, hubN=n;
      var code=[
        {t:'edges = [(i,j) for i in range(n)', hl:'for i in range(n)'},
        {t:'                for j in range(i+1,n)]', hl:'i+1,n'},
        {t:'len(edges) == n*(n-1)//2', hl:'n*(n-1)//2'},
        {t:'hub_edges = n  # 허브 방식', hl:'hub_edges = n'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'eai_edges.py', 2);
      var statY=codeBot+22;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=RED; ctx.fillText('n='+n+' 포인트투포인트 연결 = '+p2pN+'개  (실제로 그은 선 개수)', W*0.04, statY);
      ctx.fillStyle=GRN; ctx.fillText('n='+n+' 허브앤스포크 연결 = '+hubN+'개', W*0.04, statY+22);
      ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('공식 n(n-1)/2 = '+(n*(n-1)/2)+' — 실제로 그은 선 개수와 일치합니다', W*0.04, statY+46);

      var rx0=W*0.50, rx1=W*0.965, midX=(rx0+rx1)/2, gy0=30, gh=140;
      // 좌: 포인트투포인트
      ctx.font='600 11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='center';
      ctx.fillText('포인트 투 포인트', (rx0+midX-8)/2, gy0-8);
      var cx1=(rx0+midX-8)/2, cy1=gy0+gh/2, r1=Math.min(46, gh/2-14);
      var pos1=[]; for(var i=0;i<n;i++){ var ang=-Math.PI/2+i*2*Math.PI/n; pos1.push([cx1+Math.cos(ang)*r1, cy1+Math.sin(ang)*r1]); }
      ctx.strokeStyle='rgba(240,136,138,0.55)'; ctx.lineWidth=1.1;
      edges.forEach(function(e){ ctx.beginPath(); ctx.moveTo(pos1[e[0]][0],pos1[e[0]][1]); ctx.lineTo(pos1[e[1]][0],pos1[e[1]][1]); ctx.stroke(); });
      pos1.forEach(function(p,pi){ ctx.fillStyle=RED; ctx.beginPath(); ctx.arc(p[0],p[1],5,0,7); ctx.fill();
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.fillText(SYS34[pi], p[0], p[1]-9); });

      // 우: 허브앤스포크
      ctx.font='600 11px sans-serif'; ctx.fillStyle=TXT; ctx.fillText('허브 앤 스포크', (midX+8+rx1)/2, gy0-8);
      var cx2=(midX+8+rx1)/2, cy2=gy0+gh/2, r2=r1;
      var pos2=[]; for(i=0;i<n;i++){ var ang2=-Math.PI/2+i*2*Math.PI/n; pos2.push([cx2+Math.cos(ang2)*r2, cy2+Math.sin(ang2)*r2]); }
      ctx.strokeStyle='rgba(126,224,176,0.6)'; ctx.lineWidth=1.3;
      pos2.forEach(function(p){ ctx.beginPath(); ctx.moveTo(cx2,cy2); ctx.lineTo(p[0],p[1]); ctx.stroke(); });
      ctx.fillStyle=GLD; ctx.beginPath(); ctx.arc(cx2,cy2,6.5,0,7); ctx.fill();
      ctx.font='11px sans-serif'; ctx.fillStyle=GLD; ctx.fillText('허브', cx2, cy2-11);
      pos2.forEach(function(p,pi){ ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(p[0],p[1],5,0,7); ctx.fill();
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.fillText(SYS34[pi], p[0], p[1]-9); });

      // 하단: n에 따른 폭증 성장 곡선
      var gx0=rx0, gx1=rx1, gTop=gy0+gh+30, gBot=gTop+96;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(gx0,gBot); ctx.lineTo(gx1,gBot); ctx.moveTo(gx0,gTop); ctx.lineTo(gx0,gBot); ctx.stroke();
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left'; ctx.fillText('연결 수', gx0, gTop-8);
      var maxE=Math.max.apply(null, GROWTH34.map(function(g){return g.p2p;}));
      function gxOf(nn){ return gx0+((nn-3)/5)*(gx1-gx0); }
      function gyOf(v){ return gBot-(v/maxE)*(gBot-gTop); }
      ctx.strokeStyle=RED; ctx.lineWidth=2; ctx.beginPath();
      GROWTH34.forEach(function(g,gi){ var x=gxOf(g.n),y=gyOf(g.p2p); if(gi===0)ctx.moveTo(x,y);else ctx.lineTo(x,y); }); ctx.stroke();
      ctx.strokeStyle=GRN; ctx.lineWidth=2; ctx.beginPath();
      GROWTH34.forEach(function(g,gi){ var x=gxOf(g.n),y=gyOf(g.hub); if(gi===0)ctx.moveTo(x,y);else ctx.lineTo(x,y); }); ctx.stroke();
      GROWTH34.forEach(function(g){ ctx.fillStyle=(g.n===n)?GLD:RED; ctx.beginPath(); ctx.arc(gxOf(g.n),gyOf(g.p2p),(g.n===n)?4:2.2,0,7); ctx.fill();
        ctx.fillStyle=(g.n===n)?GLD:GRN; ctx.beginPath(); ctx.arc(gxOf(g.n),gyOf(g.hub),(g.n===n)?4:2.2,0,7); ctx.fill(); });
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
      N_RANGE34.forEach(function(nn){ ctx.fillText(''+nn, gxOf(nn), gBot+13); });

      E.tapHint(W/2, H*0.95, '슬라이더로 시스템 수를 늘려 연결 수 폭증을 실제로 확인하세요', true);
      E.big('EAI — 연결의 폭증과 허브', '시스템끼리 필요할 때마다 직접 잇는 <b>포인트 투 포인트</b> 방식은 연결 수가 n(n-1)/2로 늘어나 n='+n+'일 때 실제로 '+p2pN+'개의 선을 그어야 합니다. 가운데 <b>허브(브로커)</b>를 두고 모든 시스템이 허브하고만 연결되는 <b>허브 앤 스포크</b>(EAI) 방식은 같은 n개 시스템이라도 연결이 n='+hubN+'개로 끝납니다. n을 3에서 8로 늘려보면 포인트투포인트 선은 3개에서 28개까지 가파르게 치솟지만 허브 방식은 그저 3에서 8로, 직선으로 늘어납니다 — EAI 허브(어댑터·버스·브로커·트랜스포머로 구성)를 쓰는 이유가 이 그래프 하나에 다 담겨 있습니다.'); }
  },

  // ══════════ 4. 배치냐 실시간이냐 — 지연시간과 처리량 ══════════
  { id:'bda34_04',
    enter:function(E){ var self=this; self.s={W:1.0};
      E.controls('<div class="ctrl"><label>배치 윈도우 크기(초)</label><input type="range" id="b344w" min="0.5" max="3" step="0.5" value="1"><output id="b344wo">1.0</output></div>');
      E.bind('#b344w','input',function(e){ self.s.W=+e.target.value; document.getElementById('b344wo').textContent=self.s.W.toFixed(1); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var B=batchStats34(s.W);
      var code=[
        {t:'bucket = floor(arrival / W)', hl:'floor'},
        {t:'batch_latency = (bucket+1)*W - arrival', hl:'batch_latency'},
        {t:'finish = max(arrival, prev_finish) + svc', hl:'finish'},
        {t:'stream_latency = finish - arrival', hl:'stream_latency'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'batch_vs_stream.py', s.W?[0,1]:null);
      var statY=codeBot+20;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=BLU; ctx.fillText('배치(W='+s.W.toFixed(1)+'s) 평균지연 '+B.avg.toFixed(2)+'s · 실행횟수 '+B.batches+'회', W*0.04, statY);
      ctx.fillStyle=GRN; ctx.fillText('스트림 평균지연 '+STREAM34.avg.toFixed(3)+'s · 처리건수 '+STREAM34.ops+'건(개별)', W*0.04, statY+20);
      ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('같은 이벤트 '+EVQ34.length+'건, 지연은 배치가 훨씬 크고 실행 오버헤드는 스트림이 훨씬 많습니다', W*0.04, statY+42);

      var rx0=W*0.50, rx1=W*0.965;
      // 위: 배치 지연시간 (사건별)
      var t1=30,b1=150, maxB=Math.max.apply(null,B.lat);
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(rx0,b1); ctx.lineTo(rx1,b1); ctx.stroke();
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText('배치 지연시간(사건별, 초)', rx0, t1-8);
      function ex(i){ return rx0+(i/(EVQ34.length-1))*(rx1-rx0); }
      ctx.strokeStyle=BLU; ctx.lineWidth=1.8; ctx.beginPath();
      B.lat.forEach(function(v,i){ var x=ex(i), y=b1-(v/maxB)*(b1-t1); if(i===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); }); ctx.stroke();
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='right'; ctx.fillText(maxB.toFixed(1)+'s', rx0-4, t1+8);

      // 아래: 스트림 지연시간(사건별)
      var t2=180, b2=290, maxS=0.35;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(rx0,b2); ctx.lineTo(rx1,b2); ctx.stroke();
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText('스트림 지연시간(사건별, 초·같은 축척 아님)', rx0, t2-8);
      ctx.strokeStyle=GRN; ctx.lineWidth=1.8; ctx.beginPath();
      STREAM34.lat.forEach(function(v,i){ var x=ex(i), y=b2-(v/maxS)*(b2-t2); if(i===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); }); ctx.stroke();
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='right'; ctx.fillText(maxS.toFixed(2)+'s', rx0-4, t2+8);
      ctx.textAlign='left'; ctx.fillText('버스트 구간에서 대기가 쌓여 지연이 순간적으로 늘어납니다', rx0, b2+16);

      E.tapHint(W/2, H*0.95, '슬라이더로 배치 윈도우 크기를 바꿔 지연시간이 실제로 늘어나는 것을 보세요', true);
      E.big('배치냐 실시간이냐 — 지연시간과 처리량', '같은 이벤트 흐름 '+EVQ34.length+'건을 두 방식으로 실제 시뮬레이션합니다. <b>배치</b>는 W='+s.W.toFixed(1)+'초 창(window)마다 모아서 한꺼번에 처리하므로, 창이 끝나기 직전에 도착한 사건도 창이 닫힐 때까지 기다려야 해 평균 지연 '+B.avg.toFixed(2)+'초가 걸립니다 — 대신 '+B.batches+'번의 실행만으로 전부 처리됩니다. <b>스트림</b>은 도착 즉시(서비스 시간 '+ST34+'초) 처리해 평균 지연이 '+STREAM34.avg.toFixed(3)+'초로 훨씬 짧지만, 사건이 몰리는 순간(버스트)에는 한 대기열에 쌓여 지연이 순간적으로 늘어나고, '+STREAM34.ops+'번의 개별 처리 오버헤드를 그대로 떠안습니다. 큰 창일수록 배치 지연은 커지지만 실행 횟수는 줄어드는 이 맞교환(trade-off)이 배치와 실시간을 가르는 핵심입니다.'); }
  },

  // ══════════ 5. 대용량 비정형 로그, 구조를 얻다 ══════════
  { id:'bda34_05',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:"pat = r'^(INFO|WARN|ERROR)\\s+(\\S+)\\s+(.+)$'", hl:'pat'},
        {t:'m = re.match(pat, line)', hl:'re.match'},
        {t:'if m: store(level=m[1], ts=m[2], msg=m[3])', hl:'store'},
        {t:'else: quarantine.append(line)  # 재처리', hl:'quarantine'}
      ];
      var act = s.step===0?null : (s.step===1?[0,1]:[2,3]);
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'log_parse.py', act);

      var caps=['① 로그 수집 — 원문 10줄, 형식이 제각각',
                 '② 파싱 시도 — 정규식으로 실제 검사',
                 '③ 구조화 저장 — 성공은 레벨별, 실패는 재처리 대기함'];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step], W*0.04, codeBot+20);
      var statY=codeBot+42;
      ctx.font='12.5px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
      if(s.step<2){
        ctx.fillStyle=GLD; ctx.fillText('원문 '+RAWLOGS34.length+'줄', W*0.04, statY);
      } else {
        ctx.fillStyle=GRN; ctx.fillText('파싱 성공 '+LOG34.ok.length+'줄 · 실패(재처리 대기) '+LOG34.fail.length+'줄', W*0.04, statY);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('성공률 '+Math.round(LOG34.ok.length/RAWLOGS34.length*1000)/10+'%', W*0.04, statY+20);
      }

      var rx0=W*0.50, rx1=W*0.965, by0=26, rh=15.5;
      if(s.step<2){
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
        LOG34.parsed.forEach(function(p,pi){
          var ry=by0+pi*rh+11;
          var mark = (s.step===1)? (p.ok?'✔':'✘') : '·';
          ctx.fillStyle = (s.step===1)? (p.ok?GRN:RED) : DIM;
          ctx.fillText(mark, rx0, ry);
          ctx.fillStyle = (s.step===1)? (p.ok?TXT:'rgba(240,136,138,0.75)') : TXT;
          var txt=p.raw.length>46? p.raw.slice(0,46)+'…' : p.raw;
          ctx.fillText(txt, rx0+16, ry);
        });
      } else {
        var levels=['INFO','WARN','ERROR'], cols=[BLU,GLD,RED];
        var bx0=rx0, by=40, bh=90, bw=(rx1-rx0-40)/4;
        var maxv=Math.max(LOG34.lv.INFO,LOG34.lv.WARN,LOG34.lv.ERROR,LOG34.fail.length);
        levels.forEach(function(lv,li){
          var xk=bx0+li*(bw+12), hh=(LOG34.lv[lv]/maxv)*bh;
          ctx.fillStyle=cols[li]; ctx.fillRect(xk, by+bh-hh, bw, hh);
          ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='center'; ctx.fillText(lv, xk+bw/2, by+bh+15);
          ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=cols[li]; ctx.fillText(''+LOG34.lv[lv], xk+bw/2, by+bh-hh-6);
        });
        var xf=bx0+3*(bw+12), hf=(LOG34.fail.length/maxv)*bh;
        ctx.fillStyle=DIM; ctx.fillRect(xf, by+bh-hf, bw, hf);
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='center'; ctx.fillText('재처리대기', xf+bw/2, by+bh+15);
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT; ctx.fillText(''+LOG34.fail.length, xf+bw/2, by+bh-hf-6);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (수집 → 파싱 시도 → 구조화 저장)', true);
      E.big('대용량 비정형 로그, 구조를 얻다', '서버에서 쏟아지는 로그 원문 10줄은 형식이 제각각인 <b>비정형 데이터</b>입니다. LEVEL·시각·메시지 순서를 검사하는 정규식으로 실제로 한 줄씩 파싱해 보면 '+LOG34.ok.length+'줄은 구조를 얻어 레벨(INFO '+LOG34.lv.INFO+'·WARN '+LOG34.lv.WARN+'·ERROR '+LOG34.lv.ERROR+')별로 나뉘어 저장되고, '+LOG34.fail.length+'줄은 형식이 안 맞아 재처리 대기함(quarantine)으로 빠집니다. 대용량 로그 수집 파이프라인은 이런 파싱 규칙을 수백만 줄에 반복 적용하는 일이며, 규칙에 걸리지 않는 줄을 버리지 않고 별도로 모아두는 것이 나중에 규칙을 보완할 실마리가 됩니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
