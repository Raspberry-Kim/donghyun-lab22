/* 게임 규칙 — 헬기의 움직임, 사람을 태우고 내리기, 적과 탄.
   한 걸음은 1/60초다. 속도는 '한 걸음에 몇 칸'으로 적는다. */
(function () {
  'use strict';
  const DS = window.DS, W = DS.W, VH = DS.VH, PI = Math.PI;
  /* 헬기: 가속·최고 속도·마찰, 톡 누르기 기준, 몸 크기 */
  const K = DS.K = { AX: 0.055, VX: 1.6, VF: 1.76, FX: 0.057, AY: 0.06, VY: 1.05, FY: 0.045, TAP: 9, TURN: 9, HB: 9, HT: 10, HW: 13, WALL: 3.5, SHIELD: 600 };
  const EN = DS.EN = {
    tank: { spr: 'tank', hw: 14, hh: 7, hp: 4, sc: 20, oy: 8, gr: 1, name: '전차' },
    jeep: { spr: 'jeep', hw: 11, hh: 6, hp: 2, sc: 20, oy: 6.4, gr: 1, name: '지프' },
    tur: { spr: 'tur', hw: 9, hh: 6, hp: 3, sc: 40, oy: 6.4, gr: 1, name: '포탑' },
    siren: { spr: 'siren', hw: 5, hh: 12, hp: 1, sc: 10, oy: 13, gr: 1, name: '경보기' },
    ltw: { spr: 'ltw', hw: 6, hh: 20, hp: 6, sc: 40, oy: 22, gr: 1, name: '번개 탑' },
    tree: { spr: 'tree0', hp: 8, sc: 0, gr: 1, name: '나무' },
    gey: { spr: 'gey', hp: 0, gr: 1, name: '간헐천' },
    sub: { spr: 'sub', hw: 22, hh: 8, hp: 3, sc: 50, gr: 1, name: '잠수함' },
    bird: { spr: 'bird', hw: 6, hh: 4, hp: 1, sc: 20, name: '새' },
    rain: { spr: 'rcloud', hp: 0, name: '비구름' },
    jetb: { spr: 'jet', hw: 19, hh: 6, hp: 2, sc: 40, name: '폭격 제트기' },
    jetg: { spr: 'jet', hw: 19, hh: 6, hp: 2, sc: 40, name: '기총 제트기' },
    eheli: { spr: 'eheli', hw: 17, hh: 9, hp: 4, sc: 40, name: '적 헬기' },
    stal: { spr: 'stal', hw: 5, hh: 12, hp: 1, sc: 10, name: '종유석' }
  };
  DS.WPN = { B: { name: '폭탄', get: 3 }, M: { name: '미사일', get: 2 }, S: { name: '방패', get: 1 } };
  const WORDER = ['B', 'M', 'S'];
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

  function Game(o) {
    this.sfx = o.sfx || function () { }; this.god = !!o.god; this.hi = o.hi || 0;
    this.life0 = o.lives; this.cap = o.cap || 10; this.lives = o.lives; this.score = 0; this.conts = 0;
    this.wp = { B: 3, M: 0, S: 0 }; this.wsel = 'B'; this.rng = DS.RNG(20261123);
    this.startStage(o.stage || 0);
  }
  const G = Game.prototype;

  G.startStage = function (i) {
    const L = this.L = DS.buildStage(i); this.stage = i; this.S = DS.STAGES[i];
    this.t = 0; this.mode = 'brief'; this.modeT = 0; this.shake = 0; this.msg = null; this.why = '';
    this.need = L.need; this.total = L.total; this.saved = 0; this.lost = 0; this.aboard = 0; this.kills = 0;
    this.shots = []; this.bullets = []; this.en = []; this.hs = []; this.huts = []; this.items = []; this.fx = []; this.pops = []; this.solids = []; this.trigs = [];
    let id = 0;
    L.ob.forEach(o => {
      const gy = L.gAt(o.x);
      if (o.k === 'base') { const bx = o.x + L.baseSide * 58; this.base = { x: o.x, y: gy, bx: bx, side: L.baseSide }; this.solids.push({ x0: bx - 22, x1: bx + 22, y0: gy - 30, y1: gy }); }
      else if (o.k === 'hut') { this.huts.push({ x: o.x, y: gy, n: o.n, n0: o.n, t: 0 }); this.solids.push({ x0: o.x - 16, x1: o.x + 16, y0: gy - 23, y1: gy }); }
      else if (o.k === 'grp') { for (let k = 0; k < o.n; k++) { const x = o.x + (k - (o.n - 1) / 2) * 11; this.hs.push({ x: x, y: L.gAt(x) - 6, st: 'wave', d: 1, t: k * 9 }); } this.huts.push({ x: o.x, y: gy, n: 0, n0: o.n, t: 0, grp: true }); }
      else if (o.k === 'star' || o.k === 'box') this.items.push({ k: o.k, w: o.w, x: o.x, y: o.y, t: (id++) * 17 });
      else if (o.k === 'trig') this.trigs.push({ x: o.x, w: o.w, cd: 0 });
      else {
        const d = EN[o.k], e = { k: o.k, d: d, id: id++, x: o.x, y: gy - (d.oy || 0), home: o.x, hp: d.hp, t: (id * 37) % 200, cd: 60 + (id * 53) % 80, dir: id % 2 ? 1 : -1, r: o.r || 0, st: 0, vx: 0, vy: 0, flash: 0, ta: -PI / 2 };
        if (o.k === 'tree') { e.h = o.h; e.v = id % 2; e.y = gy; e.sol = { x0: o.x - 10, x1: o.x + 10, y0: gy - o.h, y1: gy, e: e }; this.solids.push(e.sol); }
        else if (o.k === 'bird' || o.k === 'rain' || o.k === 'eheli') { e.y = o.y; e.y0 = o.y; }
        else if (o.k === 'stal') { e.y = L.cAt(o.x) + 11; }
        else if (o.k === 'sub') { e.y = L.sea + 12; }
        else if (o.k === 'gey') { e.y = gy; }
        this.en.push(e);
      }
    });
    const b = this.base;
    this.pl = { x: b.x, y: b.y - K.HB, vx: 0, vy: 0, face: -b.side, from: -b.side, turn: 0, pend: 0, rot: 0, landed: true, dmg: 0, inv: 0, shield: 0, dead: 0, cool: 0, hold: { l: 0, r: 0 }, v0: 0, unT: 0, wet: 0 };
    this.look = -b.side * 50; this.cam = clamp(b.x - W / 2 + this.look, 0, L.len - W);
  };

  /* ───────── 땅·천장을 헬기 너비만큼 훑어본다 ───────── */
  G.floor = function (x) {
    const L = this.L; let m = 1e9, mx = -1e9;
    for (let i = -11; i <= 11; i += 2) { const v = L.gAt(x + i); if (v < m) m = v; if (v > mx) mx = v; }
    if (L.sea && m > L.sea + 2) return { y: L.sea + 3, flat: false, water: true };
    return { y: m, flat: mx - m <= 1.5, water: false };
  };
  G.roof = function (x) { const L = this.L; let m = -99; for (let i = -11; i <= 11; i += 2) { const v = L.cAt(x + i); if (v > m) m = v; } return m; };
  G.solidAt = function (x, y, hw, hh) {
    const S = this.solids;
    for (let i = 0; i < S.length; i++) { const s = S[i]; if (!s.off && x + hw > s.x0 && x - hw < s.x1 && y + hh > s.y0 && y - hh < s.y1) return s; }
    return null;
  };
  G.inRock = function (x, y) { const L = this.L; if (x < 0 || x > L.len) return true; const g = L.gAt(x); return y > g || y < L.cAt(x) || (L.sea && g > L.sea && y > L.sea + 1); };

  /* ───────── 보조: 효과·점수·데미지 ───────── */
  G.addFx = function (k, x, y) { const n = k === 'hit' ? 2 : k === 'splash' || k === 'spark' ? 3 : DS.BOOM[k.slice(5)]; this.fx.push({ k: k, x: x, y: y, t: 0, n: n, rate: k === 'hit' ? 3 : k === 'boom_l' ? 5 : 4 }); };
  G.pop = function (txt, x, y) { this.pops.push({ txt: txt, x: x, y: y, t: 0 }); };
  G.say = function (txt, dur) { this.msg = { txt: txt, t: dur || 150 }; };
  G.add = function (n) { this.score += n; if (this.score > this.hi) this.hi = this.score; };
  G.damage = function (n) {
    const p = this.pl; if (p.dead || p.inv > 0 || p.shield > 0 || this.god || this.mode !== 'play') return false;
    p.dmg += n; p.inv = 50; this.shake = Math.max(this.shake, 6); this.sfx('boom_s'); this.addFx('hit', p.x, p.y);
    if (p.dmg >= 100) this.crash();
    return true;
  };
  G.hurt = function (n) {      // 비·물·간헐천처럼 닿아 있는 동안 조금씩 쌓이는 데미지
    const p = this.pl; if (p.dead || p.shield > 0 || this.god || this.mode !== 'play') return;
    p.dmg += n; p.wet = 8; if (this.t % 14 === 0) this.sfx('tick');
    if (p.dmg >= 100) this.crash();
  };
  G.crash = function () {
    const p = this.pl; p.dmg = 100; p.dead = 1; p.vy = -0.6; p.landed = false; this.sfx('die'); this.shake = 10;
    if (this.aboard > 0) { this.lost += this.aboard; this.say('타고 있던 ' + this.aboard + '명을 잃었다', 200); this.aboard = 0; }
  };
  G.loseHost = function (h) { h.st = 'gone'; this.lost++; this.addFx('hit', h.x, h.y); this.pop('희생', h.x, h.y - 10); this.sfx('eshot'); };
  G.blast = function (x, y, r, dmg, mine) {      // 터지는 자리: 반지름 r 안의 적·나무·사람
    this.addFx(r > 24 ? 'boom_m' : 'boom_s', x, y); this.sfx(r > 24 ? 'boom' : 'boom_s'); if (r > 24) this.shake = Math.max(this.shake, 5);
    if (mine) for (let i = 0; i < this.en.length; i++) { const e = this.en[i]; if (e.dead || !e.d.hp) continue; const ey = e.k === 'tree' ? e.y - e.h / 2 : e.y; if (Math.abs(e.x - x) < r + (e.d.hw || 10) && Math.abs(ey - y) < r + (e.k === 'tree' ? e.h / 2 : e.d.hh)) this.hit(e, dmg); }
    for (let i = 0; i < this.hs.length; i++) { const h = this.hs[i]; if (h.st !== 'gone' && Math.hypot(h.x - x, h.y - y) < r * 0.62) this.loseHost(h); }
    if (!mine) { const p = this.pl; if (Math.hypot(p.x - x, p.y - y) < r * 0.8) this.damage(18); }
  };
  G.hit = function (e, dmg) {
    if (e.dead) return; if (e.k === 'sub' && e.st === 0) return;
    e.hp -= dmg; e.flash = 6;
    if (e.hp > 0) { this.sfx('tick'); return; }
    e.dead = true; this.kills++;
    if (e.sol) e.sol.off = true;
    const big = e.k === 'tank' || e.k === 'eheli' || e.k === 'sub' || e.k === 'ltw' || e.k === 'jetb' || e.k === 'jetg';
    this.addFx(big ? 'boom_m' : 'boom_s', e.x, e.k === 'tree' ? e.y - e.h * 0.6 : e.y); this.sfx(big ? 'boom' : 'boom_s');
    if (e.d.sc) { this.add(e.d.sc); this.pop('+' + e.d.sc, e.x, e.y - 12); }
    if (e.k === 'eheli') this.items.push({ k: 'star', x: e.x, y: e.y, t: 0, fall: true });
  };

  /* ───────── 헬기 조종 ───────── */
  G.ctrl = function (inp) {
    const p = this.pl, L = this.L, T = this;
    // 좌우를 짧게 톡 누르면 기수를 한 단계 돌린다: 왼쪽(-1) ↔ 정면(0) ↔ 오른쪽(+1)
    ['l', 'r'].forEach(d => {
      const sg = d === 'l' ? -1 : 1, other = d === 'l' ? 'r' : 'l';
      if (inp[d]) { if (!p.hold[d]) p.v0 = p.vx; p.hold[d]++; }
      else {
        if (p.hold[d] > 0 && p.hold[d] <= K.TAP && !inp[other]) { p.vx = p.v0 * 0.85; if (p.turn > 0) p.pend = sg; else T.turnTo(sg); }
        p.hold[d] = 0;
      }
    });
    if (p.turn > 0 && --p.turn === 0 && p.pend) { const s = p.pend; p.pend = 0; T.turnTo(s); }
    let ix = (inp.r ? 1 : 0) - (inp.l ? 1 : 0), iy = (inp.d ? 1 : 0) - (inp.u ? 1 : 0);
    if (p.landed) { ix = 0; p.vx = 0; if (iy > 0) iy = 0; }
    // 가로 최고 속도: 기수가 보는 쪽으로 날 때 VF(1.76), 뒤로 날 때와 정면을 보고 옆으로 갈 때 VX(1.6).
    // 기수를 돌려 한계가 낮아졌으면 뚝 끊지 않고 마찰만큼씩 줄여 맞춘다
    const hi = p.face > 0 ? K.VF : K.VX, lo = p.face < 0 ? -K.VF : -K.VX;
    if (ix) { const v = p.vx + ix * K.AX; p.vx = v > hi ? Math.max(hi, Math.min(v, p.vx - K.FX)) : v < lo ? Math.min(lo, Math.max(v, p.vx + K.FX)) : v; }
    else { const s = Math.sign(p.vx); p.vx -= s * Math.min(Math.abs(p.vx), K.FX); }
    if (iy) p.vy = clamp(p.vy + iy * K.AY, -K.VY, K.VY); else { const s = Math.sign(p.vy); p.vy -= s * Math.min(Math.abs(p.vy), K.FY); }
    // 기울기: 보는 쪽으로 나아가면 기수를 숙이고, 뒤로 물러나면 든다. 앞으로 날며 ↓를 누르면 더 숙인다
    const fwd = p.face ? Math.min(1, p.vx * p.face / K.VX) : p.vx / K.VX;      // 1.6칸에서 다 숙인다. 그보다 빨라도 탄의 각도는 그대로다
    const want = p.face ? fwd * 0.2 + (inp.d && fwd > 0.2 && !p.landed ? 0.2 : 0) : fwd * 0.14;
    p.rot += (want - p.rot) * 0.15;

    // 옆으로: 벽(한 걸음에 3.5칸보다 높이 솟은 땅, 내려온 천장, 몸이 들어가지 않는 틈)에 막히면 튕긴다
    const ox = p.x, oy = p.y;
    let nx = clamp(p.x + p.vx, 16, L.len - 16), fl = this.floor(nx), ce = this.roof(nx);
    if (nx !== p.x && ((p.y + K.HB) - fl.y > K.WALL || ce - (p.y - K.HT) > K.WALL || fl.y - ce < K.HB + K.HT + 1)) {
      nx = p.x; p.vx = -p.vx * 0.45; this.damage(14); fl = this.floor(nx); ce = this.roof(nx);
    }
    p.x = nx;
    // 위아래
    let ny = p.y + p.vy, landed = false;
    if (ny - K.HT < ce) { ny = ce + K.HT; if (p.vy < 0) { p.vy = 0.5; this.damage(10); } }
    if (ny < 13) { ny = 13; if (p.vy < 0) p.vy = 0; }
    if (ny + K.HB >= fl.y) {
      ny = fl.y - K.HB;
      if (fl.water) { p.vy = -0.9; this.hurt(7); this.addFx('splash', p.x, L.sea - 4); this.sfx('boom_s'); }
      else { if (p.vy > 0) p.vy = 0; landed = fl.flat; if (!landed) p.vx *= 0.92; }
    }
    p.y = ny;
    // 건물·나무
    const s = this.solidAt(p.x, p.y - 0.5, K.HW, 9);
    if (s) { p.x = ox; p.y = oy; p.vx = -p.vx * 0.5; p.vy = -p.vy * 0.5; landed = p.landed; if (this.solidAt(p.x, p.y - 0.5, K.HW, 9)) p.y -= 1.2; this.damage(16); }
    if (landed && !p.landed) {      // 내려앉는 순간: 그 자리에 서 있던 사람은 깔린다
      this.sfx('tick');
      for (let i = 0; i < this.hs.length; i++) { const h = this.hs[i]; if (h.st !== 'gone' && h.st !== 'base' && Math.abs(h.x - p.x) < 12 && Math.abs(h.y - (p.y + 3)) < 8) this.loseHost(h); }
    }
    p.landed = landed;
    if (landed && p.dmg > 0 && Math.abs(p.x - this.base.x) < 34) p.dmg = Math.max(0, p.dmg - 0.25);      // 기지에 앉아 있는 동안 정비

    // A: 기관포
    if (p.cool > 0) p.cool--;
    if (inp.a && p.cool <= 0 && p.turn <= 0) {
      let n = 0; for (let i = 0; i < this.shots.length; i++) if (this.shots[i].k === 'pb' || this.shots[i].k === 'drop') n++;
      if (n < 3) {
        p.cool = 10; this.sfx('shot');
        if (p.face) { const a = Math.max(0, p.rot) * 1.5; this.shots.push({ k: 'pb', x: p.x + p.face * 15, y: p.y + 5, vx: Math.cos(a) * 5 * p.face, vy: Math.sin(a) * 5, t: 0, rot: a * p.face }); }
        else this.shots.push({ k: 'drop', x: p.x, y: p.y + 9, vx: p.vx * 0.5, vy: 2.2, t: 0, rot: 0 });
      }
    }
    // Select: 보조 무기 바꾸기 · B: 쓰기
    if (inp.selEdge) { const i0 = WORDER.indexOf(this.wsel); for (let k = 1; k <= 3; k++) { const w = WORDER[(i0 + k) % 3]; if (this.wp[w] > 0) { if (w !== this.wsel) { this.wsel = w; this.sfx('tick'); this.say('보조 무기: ' + DS.WPN[w].name, 70); } break; } } }
    if (inp.bEdge) {
      const w = this.wsel;
      if (this.wp[w] > 0) {
        this.wp[w]--;
        if (w === 'B') { this.shots.push({ k: 'bomb', x: p.x, y: p.y + 9, vx: p.vx, vy: 0.5, t: 0, rot: 0 }); this.sfx('chg'); }
        else if (w === 'M') { const f = p.face; this.shots.push({ k: 'mis', x: p.x + f * 14, y: p.y + 7, vx: f * 2, vy: f ? 0 : 2, f: f, t: 0, rot: f ? (f > 0 ? 0 : PI) : PI / 2 }); this.sfx('charge'); }
        else { p.shield = K.SHIELD; this.sfx('extend'); }
        if (this.wp[w] <= 0) for (let k = 1; k <= 2; k++) { const v = WORDER[(WORDER.indexOf(w) + k) % 3]; if (this.wp[v] > 0) { this.wsel = v; break; } }
      } else this.sfx('tick');
    }
  };
  G.turnTo = function (sg) { const p = this.pl; if (p.face === sg) return; p.from = p.face; p.face += sg; p.turn = K.TURN; this.sfx('page'); };

  /* ───────── 한 걸음 ───────── */
  G.update = function (inp) {
    this.modeT++;
    if (this.mode === 'brief') { this.t++; if (this.modeT > 20 && (inp.ok || inp.aEdge || inp.tap)) { this.mode = 'play'; this.modeT = 0; this.sfx('ok'); } return; }
    if (this.mode === 'clear') { this.t++; this.stepFx(); if (this.modeT > 150 && (inp.ok || inp.aEdge || inp.tap)) this.mode = 'next'; return; }
    if (this.mode !== 'play') { this.t++; this.stepFx(); return; }
    const p = this.pl, L = this.L; this.t++;
    if (this.shake > 0) this.shake -= 0.5; if (this.msg && --this.msg.t <= 0) this.msg = null;
    if (p.inv > 0) p.inv--; if (p.shield > 0) p.shield--; if (p.wet > 0) p.wet--;
    if (!p.dead) this.ctrl(inp);
    else {      // 추락
      p.dead++; p.vy += 0.07; p.x = clamp(p.x + p.vx * 0.6, 16, L.len - 16); p.y += p.vy; p.rot += 0.12;
      const fl = this.floor(p.x);
      if (!p.boomed && (p.y + 6 >= fl.y || p.dead > 150)) { p.boomed = true; p.y = Math.min(p.y, fl.y - 6); this.addFx('boom_l', p.x, p.y); this.sfx('bigboom'); this.shake = 14; if (fl.water) this.addFx('splash', p.x, L.sea - 4); }
      if (p.boomed) { p.vy = 0; p.vx = 0; p.y = Math.min(p.y, fl.y - 6); }
      if (p.dead > 190) {
        this.lives--;
        if (this.lives <= 0) { this.mode = 'over'; this.modeT = 0; this.why = '헬기를 모두 잃었다'; return; }
        const b = this.base; Object.assign(p, { x: b.x, y: b.y - K.HB, vx: 0, vy: 0, face: -b.side, from: -b.side, turn: 0, pend: 0, rot: 0, landed: true, dmg: 0, inv: 120, shield: 0, dead: 0, boomed: false });
        this.say('새 헬기가 기지에서 나선다');
      }
    }
    this.stepShots(); this.stepEnemies(); this.stepBullets(); this.stepPeople(); this.stepItems(); this.stepFx();
    // 화면: 헬기가 보는 쪽과 가는 쪽을 조금 더 보여 준다
    this.look += ((p.face * 56 + p.vx * 22) - this.look) * 0.04;
    this.cam += (clamp(p.x - W / 2 + this.look, 0, L.len - W) - this.cam) * 0.12;
    // 끝
    if (this.mode === 'play' && this.total - this.lost < this.need) { this.mode = 'over'; this.modeT = 0; this.why = '구출 목표 ' + this.need + '명을 채울 수 없게 되었다'; this.sfx('die'); }
  };

  G.stepShots = function () {
    const p = this.pl, L = this.L, S = this.shots, E = this.en;
    for (let i = S.length - 1; i >= 0; i--) {
      const s = S[i]; s.t++;
      if (s.k === 'bomb') { s.vy += 0.06; s.vx *= 0.995; s.rot = Math.atan2(s.vy, s.vx) - PI / 2; }
      else if (s.k === 'mis') {
        if (s.f) { s.vx = clamp(s.vx + s.f * 0.22, -6, 6); let best = null, bd = 90; for (let k = 0; k < E.length; k++) { const e = E[k]; if (e.dead || !e.d.hp || e.k === 'tree' || (e.x - s.x) * s.f < 10) continue; const d = Math.abs(e.y - s.y) + Math.abs(e.x - s.x) * 0.2; if (d < bd) { bd = d; best = e; } } if (best) s.vy += clamp((best.y - s.y) * 0.02 - s.vy * 0.2, -0.12, 0.12); s.rot = Math.atan2(s.vy, s.vx); }
        else { s.vy = Math.min(6, s.vy + 0.2); }
        if (s.t % 3 === 0) this.addFx('hit', s.x - s.vx * 2, s.y - s.vy * 2);
      }
      s.x += s.vx; s.y += s.vy;
      let end = s.t > 160 || Math.abs(s.x - (this.cam + W / 2)) > W / 2 + 30 || s.y < -10, boom = false;
      if (!end && (this.inRock(s.x, s.y) || this.solidAt(s.x, s.y, 1, 1))) { end = true; boom = true; }
      if (!end) for (let k = 0; k < E.length; k++) {
        const e = E[k]; if (e.dead || !e.d.hp) continue; if (e.k === 'sub' && e.st === 0) continue;
        const ey = e.k === 'tree' ? e.y - e.h / 2 : e.y, hw = e.k === 'tree' ? 10 : e.d.hw, hh = e.k === 'tree' ? e.h / 2 : e.d.hh;
        if (Math.abs(e.x - s.x) < hw + 2 && Math.abs(ey - s.y) < hh + 2) { end = true; boom = true; if (s.k === 'pb' || s.k === 'drop') this.hit(e, s.k === 'drop' ? 2 : 1); break; }
      }
      if (!end && (s.k === 'pb' || s.k === 'drop')) for (let k = 0; k < this.hs.length; k++) { const h = this.hs[k]; if (h.st !== 'gone' && Math.abs(h.x - s.x) < 4 && Math.abs(h.y - s.y) < 7) { this.loseHost(h); end = true; break; } }
      if (end) {
        if (boom) { if (s.k === 'bomb') this.blast(s.x, s.y - 3, 30, 6, true); else if (s.k === 'mis') this.blast(s.x, s.y, 26, 8, true); else { this.addFx('hit', s.x, s.y); if (s.k === 'drop') this.blast(s.x, s.y - 2, 12, 1, true); } }
        S.splice(i, 1);
      }
    }
  };

  G.eb = function (k, x, y, vx, vy, g) { this.bullets.push({ k: k, x: x, y: y, vx: vx, vy: vy, g: g || 0, t: 0 }); };
  G.spawnJet = function (k, y) {
    const p = this.pl, d = p.face || (p.vx >= 0 ? 1 : -1), x = d > 0 ? this.cam + W + 40 : this.cam - 40, def = EN[k];
    this.en.push({ k: k, d: def, id: 900 + this.t, x: x, y: y, home: x, hp: def.hp, t: 0, cd: 20, dir: -d, r: 0, st: 0, vx: -d * (k === 'jetb' ? 3 : 3.4), vy: 0, flash: 0, temp: true });
    this.sfx('warn'); this.say(k === 'jetb' ? '폭격 제트기가 온다' : '제트기가 온다', 90);
  };
  G.stepEnemies = function () {
    const p = this.pl, L = this.L, E = this.en, t = this.t, mid = this.cam + W / 2, alive = !p.dead;
    for (let i = 0; i < this.trigs.length; i++) { const q = this.trigs[i]; if (q.cd > 0) q.cd--; else if (alive && Math.abs(p.x - q.x) < 12) { q.cd = 900; this.spawnJet(q.w, q.w === 'jetb' ? Math.max(26, L.cAt(p.x) + 22) : p.y); } }
    for (let i = E.length - 1; i >= 0; i--) {
      const e = E[i];
      if (e.dead) { if (e.temp || e.k !== 'tree') E.splice(i, 1); else E.splice(i, 1); continue; }
      if (e.flash > 0) e.flash--;
      if (Math.abs(e.x - mid) > 330 && !e.temp) continue;
      e.t++; const dx = p.x - e.x, dy = p.y - e.y, dist = Math.hypot(dx, dy), k = e.k;
      if (k === 'tank' || k === 'jeep') {
        const sp = k === 'tank' ? 0.22 : 0.6, nx = e.x + e.dir * sp;
        if (Math.abs(nx - e.home) > e.r || Math.abs(L.gAt(nx + e.dir * 12) - L.gAt(e.x)) > 3) e.dir = -e.dir; else e.x = nx;
        e.y = L.gAt(e.x) - e.d.oy;
        e.ta = clamp(Math.atan2(dy + 4, dx), -PI + 0.25, -0.25); if (dy > -6) e.ta = dx > 0 ? -0.25 : -PI + 0.25;
        if (--e.cd <= 0 && alive && dist < 230 && dy < -14) {
          if (k === 'tank') { e.cd = 130; const v = 2.5; this.eb('shell', e.x + Math.cos(e.ta) * 13, e.y - 4 + Math.sin(e.ta) * 13, Math.cos(e.ta) * v, Math.sin(e.ta) * v - dist * 0.0035, 0.022); this.sfx('eshot'); }
          else { e.cd = 84; const a = Math.atan2(dy, dx); this.eb('eb', e.x - 8, e.y - 6, Math.cos(a) * 2.1, Math.sin(a) * 2.1); this.sfx('eshot'); }
        }
      } else if (k === 'tur') {
        e.ta = clamp(Math.atan2(dy + 2, dx), -PI + 0.1, -0.1); if (dy > 0) e.ta = dx > 0 ? -0.1 : -PI + 0.1;
        if (--e.cd <= 0 && alive && dist < 215 && dy < 4) { e.cd = 104; this.eb('eb', e.x + Math.cos(e.ta) * 12, e.y - 2 + Math.sin(e.ta) * 12, Math.cos(e.ta) * 2, Math.sin(e.ta) * 2); this.sfx('eshot'); }
      } else if (k === 'siren') {
        if (e.cd > 0) e.cd--; e.on = dist < 120;
        if (e.on && e.cd <= 0 && alive) { e.cd = 560; this.spawnJet('jetg', p.y); }
      } else if (k === 'ltw') {
        const c = e.t % 230; e.ph = c < 150 ? 0 : c < 190 ? 1 : c < 216 ? 2 : 0;
        if (c === 190) this.sfx('bomb');
        if (e.ph === 2 && Math.abs(dx) < 9 && p.y < e.y - 20 && p.y > L.cAt(e.x)) this.damage(28);
      } else if (k === 'gey') {
        const c = e.t % 270; e.ph = c < 150 ? 0 : c < 196 ? 1 : 2;
        if (e.ph === 1 && c % 9 === 0) this.addFx('splash', e.x + (this.rng() - 0.5) * 6, e.y - 6);
        if (c === 196 && Math.abs(dx) < 220) this.sfx('charge');
        if (e.ph === 2 && Math.abs(dx) < 11 && p.y + K.HB > e.y - 98) { this.hurt(0.9); if (alive) p.vy = Math.max(-K.VY, p.vy - 0.07); }
      } else if (k === 'sub') {
        if (e.st === 0) { e.rise = 0; if (e.t > 110 && Math.abs(dx) < 170 && alive) { e.st = 1; e.t = 0; this.addFx('splash', e.x, L.sea - 4); } }
        else if (e.st === 1) { e.rise = Math.min(1, e.t / 40); if (e.t >= 40) { e.st = 2; e.t = 0; } }
        else if (e.st === 2) { if (e.t === 30 && alive && Math.abs(dx) < 230) { this.eb('emis', e.x + 0.5, e.y - 14, 0, -2.3); this.sfx('charge'); } if (e.t > 130) { e.st = 3; e.t = 0; } }
        else { e.rise = Math.max(0, 1 - e.t / 40); if (e.t >= 40) { e.st = 0; e.t = 0; e.hp = Math.min(e.hp, e.d.hp); } }
        e.y = L.sea + 12 - (e.rise || 0) * 15;
      } else if (k === 'bird') {
        e.x += e.dir * 0.7; if (Math.abs(e.x - e.home) > e.r) e.dir = e.x > e.home ? -1 : 1;
        e.y = e.y0 + Math.sin(e.t * 0.06) * 8;
        if (alive && Math.abs(dx) < 17 && Math.abs(dy) < 11) { this.damage(14); this.hit(e, 9); }
      } else if (k === 'rain') {
        e.x = e.home + Math.sin(e.t * 0.004 + e.id) * 40;
        if (alive && Math.abs(dx) < 40 && p.y > e.y - 14) this.hurt(0.25);
      } else if (k === 'jetb' || k === 'jetg') {
        e.x += e.vx;
        if (k === 'jetb') { if (--e.cd <= 0 && Math.abs(dx) < 130) { e.cd = 24; this.eb('ebomb', e.x, e.y + 6, e.vx * 0.45, 0.6, 0.05); } }
        else if (--e.cd <= 0 && Math.abs(dx) < 260 && dx * e.vx > 0 && e.t < 120) { e.cd = 16; this.eb('eb', e.x + Math.sign(e.vx) * 20, e.y + 2, e.vx * 1.5, 0); this.sfx('eshot'); }
        if (alive && Math.abs(dx) < 28 && Math.abs(dy) < 13) { this.damage(22); this.hit(e, 9); }
        if (e.t > 40 && Math.abs(e.x - mid) > W / 2 + 60) e.dead = true;
      } else if (k === 'eheli') {
        const far = Math.abs(p.x - e.home) > 330 || !alive, side = e.x > p.x ? 1 : -1;
        const tx = far ? e.home : p.x + side * 120, ty = far ? e.y0 : clamp(p.y + Math.sin(e.t * 0.03) * 22, Math.max(18, L.cAt(e.x) + 22), L.gAt(e.x) - 36);
        e.vx = clamp(e.vx * 0.97 + clamp((tx - e.x) * 0.002, -0.03, 0.03), -0.9, 0.9); e.vy = clamp(e.vy * 0.95 + clamp((ty - e.y) * 0.004, -0.04, 0.04), -0.7, 0.7);
        const nx = e.x + e.vx; if (L.gAt(nx + Math.sign(e.vx) * 18) - 14 < e.y || L.cAt(nx) + 12 > e.y) e.vx = -e.vx * 0.5; else e.x = nx;
        e.y = clamp(e.y + e.vy, 16, L.gAt(e.x) - 20); e.dir = dx > 0 ? 1 : -1;
        if (--e.cd <= 0 && alive && dist < 240) { e.cd = 92; const a = Math.atan2(dy, dx); this.eb('eb', e.x + e.dir * 14, e.y + 5, Math.cos(a) * 2.2, Math.sin(a) * 2.2); this.sfx('eshot'); }
        if (alive && Math.abs(dx) < 28 && Math.abs(dy) < 16) { this.damage(20); e.vx = -e.dir * 0.9; }
      } else if (k === 'stal') {
        if (!e.st) { if (alive && Math.abs(dx) < 24 && dy > 0) { e.st = 1; e.t = 0; } }
        else if (e.t > 14) {
          e.vy += 0.09; e.y += e.vy;
          if (alive && Math.abs(dx) < 15 && Math.abs(dy) < 17) { this.damage(24); this.hit(e, 9); }
          else if (e.y + 12 > L.gAt(e.x)) { e.dead = true; this.addFx('boom_s', e.x, e.y + 6); this.sfx('boom_s'); for (let j = 0; j < this.hs.length; j++) { const h = this.hs[j]; if (h.st !== 'gone' && Math.abs(h.x - e.x) < 8) this.loseHost(h); } }
        }
      }
    }
  };

  G.stepBullets = function () {
    const p = this.pl, L = this.L, B = this.bullets, DM = { eb: 12, shell: 22, ebomb: 24, emis: 30 };
    for (let i = B.length - 1; i >= 0; i--) {
      const b = B[i]; b.t++; b.vy += b.g;
      if (b.k === 'emis') { if (b.t < 90) b.vx = clamp(b.vx + Math.sign(p.x - b.x) * 0.02, -0.8, 0.8); }
      b.x += b.vx; b.y += b.vy;
      let end = b.t > 320 || b.y < -20 || Math.abs(b.x - (this.cam + W / 2)) > W / 2 + 80, boom = false;
      if (!end && b.t > 4 && (this.inRock(b.x, b.y) || this.solidAt(b.x, b.y, 1, 1))) { end = true; boom = true; }
      if (!end && !p.dead && Math.abs(b.x - p.x) < 14 && Math.abs(b.y - p.y) < 9) { end = true; if (p.shield > 0) this.addFx('hit', b.x, b.y); else if (this.damage(DM[b.k]) && b.k !== 'eb') this.addFx('boom_s', b.x, b.y); }
      if (end) { if (boom) { if (b.k === 'eb') this.addFx('hit', b.x, b.y); else this.blast(b.x, b.y - 2, 18, 0, false); } B.splice(i, 1); }
    }
  };

  /* ───────── 사람: 막사에서 나와 헬기로, 헬기에서 내려 기지로 ───────── */
  G.stepPeople = function () {
    const p = this.pl, L = this.L, H = this.hs, b = this.base, ok = p.landed && !p.dead, atBase = Math.abs(p.x - b.x) < 60;
    let going = 0; for (let i = 0; i < H.length; i++) if (H[i].st === 'go') going++;
    let room = this.cap - this.aboard - going;
    if (ok && !atBase) for (let i = 0; i < this.huts.length; i++) {
      const h = this.huts[i]; if (h.t > 0) h.t--;
      if (h.n > 0 && room > 0 && h.t <= 0 && Math.abs(p.x - h.x) < 96 && Math.abs(p.y + K.HB - h.y) < 6) { h.n--; h.t = 34; room--; H.push({ x: h.x, y: h.y - 6, st: 'go', d: 1, t: 0 }); this.sfx('tick'); }
    }
    for (let i = H.length - 1; i >= 0; i--) {
      const h = H[i]; h.t++;
      if (h.st === 'gone') { H.splice(i, 1); continue; }
      if (h.st === 'wave') { if (ok && !atBase && room > 0 && Math.abs(p.x - h.x) < 110 && Math.abs(p.y + K.HB - 6 - h.y) < 8) { h.st = 'go'; room--; } continue; }
      const tx = h.st === 'go' ? p.x : b.bx;
      if (h.st === 'go' && !ok) { h.st = 'wave'; continue; }
      h.d = tx > h.x ? 1 : -1;
      const nx = h.x + h.d * 0.5, ng = L.gAt(nx);
      if (Math.abs(ng - (h.y + 6)) > 4) { if (h.st === 'go') h.st = 'wave'; continue; }
      h.x = nx; h.y = ng - 6;
      if (Math.abs(h.x - tx) < (h.st === 'go' ? 6 : 3)) {
        H.splice(i, 1);
        if (h.st === 'go') { this.aboard++; this.sfx('item'); if (this.aboard >= this.cap) this.say('정원이 찼다. 기지로 돌아가자'); }
        else { this.saved++; const extra = this.saved > this.need; this.add(extra ? 200 : 20); this.pop(extra ? '+200' : '+20', b.bx, b.y - 40); this.sfx('medal'); if (this.saved === this.need) this.say('구출 목표를 채웠다'); }
      }
    }
    // 기지 착륙장에서 한 명씩 내린다
    if (ok && Math.abs(p.x - b.x) < 34 && this.aboard > 0) { if (--p.unT <= 0) { p.unT = 24; this.aboard--; H.push({ x: p.x + b.side * 6, y: b.y - 6, st: 'base', d: b.side, t: 0 }); } } else p.unT = 10;
    if (this.mode === 'play' && this.saved >= this.need && this.aboard === 0 && !p.dead && !H.some(h => h.st === 'base')) {
      this.mode = 'clear'; this.modeT = 0; this.sfx('clear');
      this.bonus = this.lives * 300; this.add(this.bonus);
    }
  };

  G.stepItems = function () {
    const p = this.pl, L = this.L, I = this.items;
    for (let i = I.length - 1; i >= 0; i--) {
      const it = I[i]; it.t++;
      if (it.fall) { const g = L.sea && L.gAt(it.x) > L.sea ? L.sea - 10 : L.gAt(it.x) - 16; if (it.y < g) it.y += 0.6; else it.fall = false; }
      if (!p.dead && Math.abs(it.x - p.x) < 20 && Math.abs(it.y - p.y) < 15) {
        if (it.k === 'star') { p.dmg = 0; this.add(100); this.pop('데미지 회복 +100', it.x, it.y - 12); this.sfx('extend'); }
        else { const w = DS.WPN[it.w]; this.wp[it.w] += w.get; if (this.wp[this.wsel] <= 0 || it.w !== this.wsel) this.wsel = it.w; this.pop(w.name + ' +' + w.get, it.x, it.y - 12); this.sfx('item'); }
        I.splice(i, 1);
      }
    }
  };
  G.stepFx = function () {
    for (let i = this.fx.length - 1; i >= 0; i--) { const f = this.fx[i]; if (++f.t >= f.n * f.rate) this.fx.splice(i, 1); }
    for (let i = this.pops.length - 1; i >= 0; i--) { const q = this.pops[i]; q.y -= 0.3; if (++q.t > 50) this.pops.splice(i, 1); }
  };

  /* 이어 하기: 이 스테이지를 처음부터, 헬기 수는 처음대로, 점수는 0부터 */
  G.cont = function () { this.conts++; this.score = 0; this.lives = this.life0; this.wp = { B: 3, M: 0, S: 0 }; this.wsel = 'B'; this.startStage(this.stage); };

  G.text = function () {
    const p = this.pl, r = v => Math.round(v * 100) / 100;
    return { mode: this.mode, stage: this.stage + 1, name: this.S.name, len: this.L.len, cam: r(this.cam), heli: { x: r(p.x), y: r(p.y), vx: r(p.vx), vy: r(p.vy), face: p.face, turning: p.turn > 0, landed: p.landed, damage: r(p.dmg), shield: p.shield, dead: p.dead > 0 },
      need: this.need, total: this.total, aboard: this.aboard, saved: this.saved, lost: this.lost, cap: this.cap, lives: this.lives, score: this.score, weapon: this.wsel, weapons: this.wp,
      base: { x: this.base.x, side: this.base.side }, huts: this.huts.map(h => ({ x: h.x, inside: h.n })), waiting: this.hs.filter(h => h.st === 'wave').length, enemies: this.en.filter(e => !e.dead && e.d.hp).length, shots: this.shots.length, bullets: this.bullets.length, why: this.why };
  };
  /* ── 저장·불러오기 ──  함수와 서로 가리키는 것(스테이지 땅, 건물의 벽)만 빼고 그대로 적는다. 땅과 벽은 스테이지 번호로 다시 만든다 */
  const SKIP = { sfx: 1, god: 1, rng: 1, L: 1, S: 1, solids: 1, base: 1, en: 1 };
  G.save = function () {
    const o = {};
    for (const k in this) if (Object.prototype.hasOwnProperty.call(this, k) && !SKIP[k] && typeof this[k] !== 'function') o[k] = this[k];
    o.rng = this.rng.get();
    o.en = this.en.map(e => { const q = {}; for (const k in e) if (k !== 'd' && k !== 'sol') q[k] = e[k]; return q; });
    return JSON.parse(JSON.stringify(o));
  };
  const isN = v => typeof v === 'number' && isFinite(v), isI = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
  const SHOTK = { pb: 1, drop: 1, bomb: 1, mis: 1 }, EBK = { eb: 1, shell: 1, ebomb: 1, emis: 1 }, FXK = { hit: 1, splash: 1, spark: 1, boom_s: 1, boom_m: 1, boom_l: 1 }, HSK = { wave: 1, go: 1, base: 1, gone: 1 };
  Game.load = function (d, o) {
    o = o || {};
    const bad = m => { throw new Error(m); };
    if (!d || typeof d !== 'object') bad('판 정보가 없다.');
    if (!isI(d.stage, 0, DS.STAGES.length - 1)) bad('스테이지 정보가 맞지 않는다.');
    if (!isI(d.life0, 1, 9) || !isI(d.cap, 4, 16) || !isI(d.lives, 1, 99) || !isN(d.score) || d.score < 0 || !isI(d.conts, 0, 1e6)) bad('헬기·정원·점수 정보가 맞지 않는다.');
    if (d.mode !== 'play') bad('이어 할 수 없는 장면에서 저장한 판이다.');
    const p = d.pl;
    if (!p || !isN(p.x) || !isN(p.y) || !isN(p.vx) || !isN(p.vy) || !isI(p.face, -1, 1) || !isI(p.from, -1, 1) || !isN(p.dmg) || p.dmg < 0 || p.dmg > 100 || !isN(p.dead) || !isN(p.rot) || !p.hold || !isN(p.hold.l) || !isN(p.hold.r)) bad('헬기 상태가 맞지 않는다.');
    const w = d.wp;
    if (!w || !isI(w.B, 0, 999) || !isI(w.M, 0, 999) || !isI(w.S, 0, 999) || WORDER.indexOf(d.wsel) < 0) bad('보조 무기 정보가 맞지 않는다.');
    ['en', 'shots', 'bullets', 'hs', 'huts', 'items', 'fx', 'pops', 'trigs'].forEach(k => { if (!Array.isArray(d[k]) || d[k].length > 2000) bad('판 정보가 맞지 않는다(' + k + ').'); });
    if (!isN(d.rng) || !isN(d.t) || !isN(d.modeT) || !isN(d.cam) || !isN(d.look) || !isN(d.shake)) bad('진행 정보가 맞지 않는다.');
    if (!isI(d.saved, 0, 999) || !isI(d.lost, 0, 999) || !isI(d.aboard, 0, d.cap)) bad('구출 정보가 맞지 않는다.');
    d = JSON.parse(JSON.stringify(d));
    const g = new Game({ lives: d.life0, cap: d.cap, stage: d.stage, sfx: o.sfx, god: o.god, hi: Math.max(o.hi || 0, isN(d.hi) ? d.hi : 0) });
    const L = g.L, xin = v => isN(v) && v > -400 && v < L.len + 400, yin = v => isN(v) && v > -400 && v < 800;
    if (!xin(p.x) || !yin(p.y)) bad('헬기 자리가 맞지 않는다.');
    if (d.huts.length !== g.huts.length || d.trigs.length !== g.trigs.length) bad('스테이지 정보가 맞지 않는다.');
    d.huts.forEach((h, i) => { const b = g.huts[i]; if (!h || h.x !== b.x || !isI(h.n, 0, b.n0) || !isN(h.t)) bad('막사 정보가 맞지 않는다.'); h.y = b.y; h.n0 = b.n0; h.grp = b.grp; });
    d.trigs.forEach((q, i) => { const b = g.trigs[i]; if (!q || !isN(q.cd)) bad('스테이지 정보가 맞지 않는다.'); q.x = b.x; q.w = b.w; });
    // 나무의 벽은 번호로 다시 잇는다. 저장한 판에 없는 나무는 이미 쓰러진 것이다
    const sol = {}; g.en.forEach(e => { if (e.sol) { sol[e.id] = e.sol; e.sol.off = true; e.sol.e = null; } });
    const E = d.en.map(q => {
      const e = Object.assign({}, q), def = e && EN[e.k];
      if (!def || !xin(e.x) || !yin(e.y) || !isN(e.hp) || !isN(e.t) || !isN(e.id)) bad('적 정보가 맞지 않는다.');
      e.d = def;
      if (e.k === 'tree') { const s = sol[e.id]; if (!s || !isN(e.h)) bad('나무 정보가 맞지 않는다.'); e.sol = s; s.e = e; s.off = !!e.dead; }
      return e;
    });
    d.shots.forEach(s => { if (!s || !SHOTK[s.k] || !xin(s.x) || !yin(s.y) || !isN(s.vx) || !isN(s.vy) || !isN(s.t)) bad('탄 정보가 맞지 않는다.'); });
    d.bullets.forEach(b => { if (!b || !EBK[b.k] || !xin(b.x) || !yin(b.y) || !isN(b.vx) || !isN(b.vy) || !isN(b.t) || !isN(b.g)) bad('적탄 정보가 맞지 않는다.'); });
    d.hs.forEach(h => { if (!h || !HSK[h.st] || !xin(h.x) || !yin(h.y) || !isN(h.t)) bad('사람 정보가 맞지 않는다.'); });
    d.items.forEach(it => { if (!it || (it.k !== 'star' && !(it.k === 'box' && DS.WPN[it.w])) || !xin(it.x) || !yin(it.y) || !isN(it.t)) bad('보급 정보가 맞지 않는다.'); });
    d.fx.forEach(f => { if (!f || !FXK[f.k] || !isN(f.x) || !isN(f.y) || !isN(f.t) || !isN(f.n) || !isN(f.rate)) bad('효과 정보가 맞지 않는다.'); });
    d.pops.forEach(q => { if (!q || typeof q.txt !== 'string' || !isN(q.x) || !isN(q.y) || !isN(q.t)) bad('효과 정보가 맞지 않는다.'); });
    if (d.msg && (typeof d.msg.txt !== 'string' || !isN(d.msg.t))) d.msg = null;
    const rs = d.rng;
    ['sfx', 'god', 'rng', 'L', 'S', 'solids', 'base', 'en', 'need', 'total', 'hi'].forEach(k => { delete d[k]; });
    Object.assign(g, d);
    g.en = E; g.why = ''; g.rng = DS.RNG(1); g.rng.set(rs);
    return g;
  };

  DS.Game = Game;
})();
