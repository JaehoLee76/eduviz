/* PhysLab — EduViz 자체 2D 물리 엔진 (이론을 코드로: 매 프레임 뉴턴 적분)
   좌표=실제 단위(미터, y는 위쪽 +). 장면이 world↔screen 변환을 가짐.
   장면 draw에서 world.step(dt) 호출 → 힘 합산 → a=F/m → 반암시적 오일러 적분.
   골든룰: 표시 수치는 모두 시뮬레이션 상태/실식에서 계산. 닫힌 공식 베끼기 금지. */
(function(global){
  function World(opt){ opt=opt||{};
    this.bodies=[]; this.forces=[];
    this.g = (opt.g!=null? opt.g : 9.8);     // 아래로 당기는 중력가속도 (m/s²)
    this.floor = (opt.floor!=null? opt.floor : null);   // 바닥 y(이하로 못 내려감)
    this.ceil  = (opt.ceil!=null? opt.ceil : null);
    this.bounds = opt.bounds||null;          // [xmin,xmax] 벽
    this.rest = (opt.rest!=null? opt.rest : 0.6);   // 반발계수(충돌 후 속도 비율)
    this.linDrag = (opt.linDrag!=null? opt.linDrag : 0); // 전역 선형 저항(공기)
    this.t = 0;
  }
  World.prototype.add = function(b){ b=b||{};
    b.x=b.x||0; b.y=b.y||0; b.vx=b.vx||0; b.vy=b.vy||0;
    b.m=(b.m!=null?b.m:1); b.r=(b.r!=null?b.r:0.2);
    b.fx=0; b.fy=0; b.fixed=!!b.fixed; b.held=false; b.color=b.color||'#5fd6a8'; b.q=(b.q!=null?b.q:0);
    this.bodies.push(b); return b; };
  World.prototype.force = function(fn){ this.forces.push(fn); return fn; };
  World.prototype.clearForces = function(){ this.forces.length=0; };
  World.prototype.reset = function(){ this.bodies.length=0; this.forces.length=0; this.t=0; };

  // 반암시적(세미-암시적) 오일러 — 안정적. substep으로 강성 힘도 견딤.
  World.prototype.step = function(dt, sub){ sub=sub||6; var h=dt/sub, i, s, b;
    for(s=0;s<sub;s++){
      for(i=0;i<this.bodies.length;i++){ b=this.bodies[i]; b.fx=0; b.fy=-b.m*this.g; }   // 중력
      if(this.linDrag>0) for(i=0;i<this.bodies.length;i++){ b=this.bodies[i]; b.fx-=this.linDrag*b.vx; b.fy-=this.linDrag*b.vy; }
      for(i=0;i<this.forces.length;i++) this.forces[i](this, h);                          // 사용자 힘
      for(i=0;i<this.bodies.length;i++){ b=this.bodies[i]; if(b.fixed||b.held) continue;
        b.vx += (b.fx/b.m)*h;  b.vy += (b.fy/b.m)*h;          // a=F/m → v
        b.x  += b.vx*h;        b.y  += b.vy*h;                // v → x
        if(this.floor!=null && b.y-b.r < this.floor){ b.y=this.floor+b.r; if(b.vy<0){ b.vy=-b.vy*this.rest; } b.vx*=(1-0.015); }
        if(this.ceil!=null  && b.y+b.r > this.ceil ){ b.y=this.ceil -b.r; if(b.vy>0){ b.vy=-b.vy*this.rest; } }
        if(this.bounds){ if(b.x-b.r<this.bounds[0]){ b.x=this.bounds[0]+b.r; b.vx=-b.vx*this.rest; }
                         if(b.x+b.r>this.bounds[1]){ b.x=this.bounds[1]-b.r; b.vx=-b.vx*this.rest; } }
      }
    }
    this.t += dt;
  };
  // 원-원 탄성 충돌(동일 강체구 가정, 운동량·에너지 보존) — 필요한 장면만 호출
  World.prototype.collide = function(){ var B=this.bodies, i, j;
    for(i=0;i<B.length;i++) for(j=i+1;j<B.length;j++){ var a=B[i], c=B[j];
      var dx=c.x-a.x, dy=c.y-a.y, d=Math.hypot(dx,dy), sumr=a.r+c.r;
      if(d>0 && d<sumr){ var nx=dx/d, ny=dy/d, overlap=sumr-d;
        var ima=a.fixed?0:1/a.m, imc=c.fixed?0:1/c.m, tot=ima+imc; if(tot===0)continue;
        a.x-=nx*overlap*(ima/tot); a.y-=ny*overlap*(ima/tot); c.x+=nx*overlap*(imc/tot); c.y+=ny*overlap*(imc/tot);
        var rvx=c.vx-a.vx, rvy=c.vy-a.vy, vn=rvx*nx+rvy*ny; if(vn>0)continue;
        var e=this.rest, jimp=-(1+e)*vn/tot; a.vx-=jimp*ima*nx; a.vy-=jimp*ima*ny; c.vx+=jimp*imc*nx; c.vy+=jimp*imc*ny;
      } }
  };

  // ── 힘 생성기 (이론을 코드로) ──
  var F = {
    constant: function(body, fx, fy){ return function(){ body.fx+=fx; body.fy+=fy; }; },          // 일정한 힘
    spring:   function(body, ax, ay, k, rest){ return function(){ var dx=body.x-ax, dy=body.y-ay, d=Math.hypot(dx,dy)||1e-9, f=-k*(d-rest); body.fx+=f*dx/d; body.fy+=f*dy/d; }; }, // 후크 F=-k·x
    drag:     function(body, c){ return function(){ body.fx-=c*body.vx; body.fy-=c*body.vy; }; },  // 점성 저항
    friction: function(body, mu){ return function(w){ var N=body.m*w.g, sp=Math.hypot(body.vx,body.vy); if(sp>1e-4){ var fk=mu*N; body.fx-=fk*body.vx/sp; body.fy-=fk*body.vy/sp; } }; }, // 운동마찰
    pointGravity: function(att, GM){ return function(w){ for(var i=0;i<w.bodies.length;i++){ var b=w.bodies[i]; if(b===att)continue; var dx=att.x-b.x, dy=att.y-b.y, r2=dx*dx+dy*dy, r=Math.sqrt(r2)||1e-9; var f=GM*b.m/r2; b.fx+=f*dx/r; b.fy+=f*dy/r; } }; }, // 만유인력 1/r²
    uniformE: function(Ex, Ey){ return function(w){ for(var i=0;i<w.bodies.length;i++){ var b=w.bodies[i]; b.fx+=b.q*Ex; b.fy+=b.q*Ey; } }; },   // 균일 전기장 F=qE
    lorentzB: function(Bz){ return function(w){ for(var i=0;i<w.bodies.length;i++){ var b=w.bodies[i]; b.fx+=b.q*b.vy*Bz; b.fy-=b.q*b.vx*Bz; } }; }      // 자기력 F=qv×B
  };

  // 화면↔월드 변환 헬퍼 (장면이 보관)
  function view(ox, oy, scale){ return {
    ox:ox, oy:oy, s:scale,
    X:function(x){ return ox + x*scale; }, Y:function(y){ return oy - y*scale; },
    wx:function(px){ return (px-ox)/scale; }, wy:function(py){ return (oy-py)/scale; }
  }; }

  global.PhysLab = { world:function(o){ return new World(o); }, F:F, view:view };
})(window);
