/* 화면 그리기 */
(function () {
  'use strict';
  const DS = window.DS, W = DS.W, H = DS.H, VH = DS.VH, S = DS.S, ART = DS.ART, PI = Math.PI, K = DS.K, CH = DS.CHUNK;
  const FONT = "Gaegu, 'Nanum Pen Script', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
  DS.FONT = FONT;

  function Render(cv) {
    this.cv = cv; cv.width = W * S; cv.height = H * S;
    this.c = cv.getContext('2d', { alpha: false, desynchronized: true });
    this.paper = DS.makePaper(W * S, H * S, 11);
    this.chunks = {}; this.far = null; this.L = null; this.turn = 0; this.jr = DS.RNG(77);
  }
  const R = Render.prototype;

  /* 스테이지가 바뀌면 앞 장의 땅 그림은 버리고, 새 땅은 화면에 가까운 조각부터 한 걸음에 하나씩 그린다 */
  R.prepare = function (L) {
    Object.keys(this.chunks).forEach(k => { this.chunks[k].width = this.chunks[k].height = 0; }); this.chunks = {};
    if (this.far) { this.far.width = this.far.height = 0; }
    this.L = L; this.far = DS.drawFar(L); this.nch = Math.ceil(L.len / CH);
    const need = { tbar: 1, rain: 1, spark: 1, bolt: 1 }; L.ob.forEach(o => { const d = DS.EN[o.k]; if (d) need[d.spr] = 1; if (o.k === 'tree') need.tree1 = 1; if (o.k === 'trig' || o.k === 'siren') need.jet = 1; });
    Object.keys(need).forEach(n => ART.get(n));
  };
  R.chunk = function (i) { return this.chunks[i] || (this.chunks[i] = DS.drawChunk(this.L, i)); };
  R.pump = function (cam) {      // 아직 그리지 않은 조각 하나를 그린다. 다 그렸으면 false
    if (!this.L) return false;
    const c0 = Math.floor((cam + W / 2) / CH);
    for (let d = 0; d < this.nch; d++) for (let s = -1; s <= 1; s += 2) { const i = c0 + d * s; if (i >= 0 && i < this.nch && !this.chunks[i]) { this.chunk(i); return true; } }
    return false;
  };
  R.warm = function () { DS.WARM.forEach(n => ART.get(n)); };

  R.spr = function (name, x, y, rot, sx, sy, fi, alpha) {
    const s = ART.get(name), c = this.c, f = s.frames[(fi || 0) % s.frames.length];
    if (alpha != null) c.globalAlpha = alpha;
    if (rot || (sx != null && sx !== 1) || (sy != null && sy !== 1)) {
      c.save(); c.translate(x * S, y * S); if (rot) c.rotate(rot); c.scale(sx == null ? 1 : sx, sy == null ? (sx == null ? 1 : sx) : sy);
      c.drawImage(f, -s.w * S / 2, -s.h * S / 2); c.restore();
    } else c.drawImage(f, Math.round((x - s.w / 2) * S), Math.round((y - s.h / 2) * S));
    if (alpha != null) c.globalAlpha = 1;
    return s;
  };
  R.text = function (txt, x, y, px, align, alpha, weight) {
    const c = this.c; c.font = (weight || 700) + ' ' + Math.round(px * S) + 'px ' + FONT; c.textAlign = align || 'left'; c.textBaseline = 'middle'; c.wordSpacing = (-px * S * 0.14).toFixed(1) + 'px';
    c.lineWidth = Math.min(px * 0.22, 3) * S; c.strokeStyle = DS.FILL; c.lineJoin = 'round'; c.globalAlpha = (alpha == null ? 1 : alpha) * 0.8; c.strokeText(txt, x * S, y * S);
    c.globalAlpha = (alpha == null ? 1 : alpha) * 0.9; c.fillStyle = DS.INK; c.fillText(txt, x * S, y * S); c.globalAlpha = 1;
  };
  /* 출전 준비 화면 제목: 손글씨 그림(src/title.png). 그림을 읽지 못하면 글꼴로 쓴다. */
  R.titleReady = new Promise(function (done) {
    if (!DS.TITLE_PNG || typeof Image === 'undefined') return done();
    const im = new Image(); im.onload = function () { R.titleImg = im; done(); }; im.onerror = function () { done(); }; im.src = DS.TITLE_PNG;
  });
  R.title = function (x, y, w) {      // 가운데 (x, y), 너비 w칸
    const im = this.titleImg;
    if (!im) { this.text('동현촙', x, y, 46, 'center'); return; }
    const h = w * im.height / im.width, c = this.c;
    this.text('TM', x + w / 2 + 3, y - h / 2 + 6, 8, 'left', 0.88);      // 제목 오른쪽 위에 붙는 작은 위첨자
    c.globalAlpha = 0.92;
    c.drawImage(im, Math.round((x - w / 2) * S), Math.round((y - h / 2) * S), Math.round(w * S), Math.round(h * S)); c.globalAlpha = 1;
  };
  /* 연필로 두 번 그은 네모 */
  R.box = function (x, y, w, h, seed, lw, alpha, fill) {
    const c = this.c, j = (n) => ((DS.hash('b' + (seed * 31 + n)) % 1000) / 1000 - 0.5) * 1.6 * S;
    if (fill != null) { c.globalAlpha = fill; c.fillStyle = DS.FILL; c.fillRect(x * S, y * S, w * S, h * S); }
    c.strokeStyle = DS.INK; c.lineCap = 'round'; c.lineWidth = (lw || 0.8) * S;
    for (let k = 0; k < 2; k++) {
      c.globalAlpha = (alpha == null ? 0.8 : alpha) * (k ? 0.5 : 1);
      const a = k * 8, x0 = x * S, y0 = y * S, x1 = (x + w) * S, y1 = (y + h) * S;
      c.beginPath();
      c.moveTo(x0 + j(a), y0 + j(a + 1)); c.lineTo(x1 + j(a + 2), y0 + j(a + 3)); c.lineTo(x1 + j(a + 4), y1 + j(a + 5)); c.lineTo(x0 + j(a + 6), y1 + j(a + 7)); c.closePath(); c.stroke();
    }
    c.globalAlpha = 1;
  };
  R.stroke = function (pts, lw, alpha) {      // 화면 칸으로 적은 꺾은선
    const c = this.c; c.strokeStyle = DS.INK; c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = (lw || 0.7) * S; c.globalAlpha = alpha == null ? 0.85 : alpha;
    c.beginPath(); c.moveTo(pts[0][0] * S, pts[0][1] * S); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0] * S, pts[i][1] * S); c.stroke(); c.globalAlpha = 1;
  };
  R.wash = function (alpha) { const c = this.c; c.globalAlpha = alpha; c.drawImage(this.paper, 0, 0); c.globalAlpha = 1; };
  R.bar = function (x, y, w, h, fr) {
    const c = this.c; c.globalAlpha = 0.75; c.fillStyle = DS.FILL; c.fillRect(x * S, y * S, w * S, h * S);
    c.globalAlpha = 0.72; c.fillStyle = DS.INK; c.fillRect(x * S, y * S, w * fr * S, h * S);
    c.globalAlpha = 0.9; c.strokeStyle = DS.INK; c.lineWidth = 0.7 * S; c.strokeRect(x * S - 1, y * S - 1, w * S + 2, h * S + 2); c.globalAlpha = 1;
  };

  /* 헬기: 옆모습은 기수가 오른쪽인 그림 한 장을 뒤집어 쓴다. 기수를 돌리는 동안에는 폭을 줄였다 늘린다 */
  R.heli = function (x, y, face, from, turn, rot, t, alpha, foe) {
    let f = face, xs = 1;
    if (turn > 0) { const k = turn / K.TURN; if (k > 0.5) { f = from; xs = (k - 0.5) * 2; } else xs = 1 - k * 2; xs = 0.25 + 0.75 * xs; }
    const c = this.c, s = ART.get(f ? (foe ? 'eheli' : 'heli') : 'heli_f'), ro = ART.get('hrot'), fi = (t / 10) | 0;
    c.save(); c.translate(x * S, y * S); c.rotate(f ? rot * f : rot); if (alpha != null) c.globalAlpha = alpha;
    c.scale((f || 1) * xs, 1);
    c.drawImage(s.frames[fi % s.frames.length], -s.w * S / 2, -s.h * S / 2);
    c.drawImage(ro.frames[(t >> 1) % 3], ((f ? 1 : 0) - ro.w / 2) * S, (-10 - ro.h / 2) * S);
    if (f) { const tr = ART.get('trot'); c.drawImage(tr.frames[(t >> 1) % 3], (-21.4 - tr.w / 2) * S, (-5.6 - tr.h / 2) * S); }
    c.restore(); c.globalAlpha = 1;
  };

  R.draw = function (g, bare) {      // bare: 계기판 없이 장면만 (출전 준비 화면의 시범 비행)
    const c = this.c;
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
    c.drawImage(this.paper, 0, 0);
    if (!g) return;
    this.scene(g);
    c.setTransform(1, 0, 0, 1, 0, 0);
    if (bare) return;
    c.drawImage(this.paper, 0, VH * S, W * S, (H - VH) * S, 0, VH * S, W * S, (H - VH) * S);
    this.hud(g);
    if (this.turn > 0) this.pageTurn(this.turn);
  };

  R.scene = function (g) {
    const c = this.c, L = g.L, t = g.t, p = g.pl, cam = Math.round(g.cam * S) / S, x0 = cam - 60, x1 = cam + W + 60;
    const shx = g.shake > 0 ? Math.round((this.jr() - 0.5) * Math.min(8, g.shake) * 0.9 * S) : 0, shy = g.shake > 0 ? Math.round((this.jr() - 0.5) * Math.min(8, g.shake) * 0.9 * S) : 0;
    // 먼 배경은 천천히 흐른다
    if (this.far) { const o = Math.round(((cam * 0.35) % DS.FARW) * S); c.drawImage(this.far, -o, 0); c.drawImage(this.far, DS.FARW * S - o, 0); }
    c.setTransform(1, 0, 0, 1, -Math.round(cam * S) + shx, shy);
    for (let i = Math.max(0, Math.floor(cam / CH)); i <= Math.min(this.nch - 1, Math.floor((cam + W) / CH)); i++) c.drawImage(this.chunk(i), i * CH * S, 0);
    const vis = x => x > x0 && x < x1;
    // 기지: 착륙장과 건물, 깃발
    const b = g.base;
    if (vis(b.x) || vis(b.bx)) {
      this.stroke([[b.x - 26, b.y + 0.6], [b.x + 26, b.y + 0.6]], 1.5, 0.9); this.stroke([[b.x - 26, b.y + 0.6], [b.x - 30, b.y + 5]], 0.7, 0.7); this.stroke([[b.x + 26, b.y + 0.6], [b.x + 30, b.y + 5]], 0.7, 0.7);
      this.text('H', b.x, b.y + 8.5, 10, 'center', 0.85);
      this.spr('basebld', b.bx, b.y - 20, 0, 1, 1, 0); this.spr('flag', b.bx + 21.5, b.y - 44, 0, 1, 1, (t / 14) | 0);
    }
    // 막사
    for (let i = 0; i < g.huts.length; i++) { const h = g.huts[i]; if (h.grp || !vis(h.x)) continue; this.spr('hut', h.x, h.y - 12, 0, 1, 1, 0); if (h.n > 0) this.text('×' + h.n, h.x, h.y - 30, 8.5, 'center', 0.9); }
    // 땅 위의 것들
    const E = g.en;
    for (let i = 0; i < E.length; i++) { const e = E[i]; if (!e.d.gr || e.dead || !vis(e.x)) continue; this.enemy(e, g); }
    // 사람
    for (let i = 0; i < g.hs.length; i++) { const h = g.hs[i]; if (h.st === 'gone' || !vis(h.x)) continue; const wave = h.st === 'wave'; this.spr('host', h.x, h.y, 0, wave ? 1 : h.d, 1, wave ? (((t + h.t) / 16 | 0) % 2 ? 2 : 0) : ((h.t / 7) | 0) % 2); }
    for (let i = 0; i < g.items.length; i++) { const it = g.items[i]; if (!vis(it.x)) continue; const y = it.y + Math.sin(it.t * 0.07) * 2.5; if (it.k === 'star') this.spr('star', it.x, y, Math.sin(it.t * 0.05) * 0.3, 1, 1, 0); else { this.spr('itbox', it.x, y, 0, 1, 1, 0); this.text(it.w, it.x, y + 0.4, 10.5, 'center'); } }
    for (let i = 0; i < E.length; i++) { const e = E[i]; if (e.d.gr || e.dead || !vis(e.x)) continue; this.enemy(e, g); }
    // 내 탄
    for (let i = 0; i < g.shots.length; i++) { const s = g.shots[i]; this.spr(s.k === 'pb' ? 'pb' : s.k === 'drop' ? 'pdrop' : s.k === 'bomb' ? 'pbomb' : 'pmis', s.x, s.y, s.rot, 1, 1, 0); }
    // 헬기
    if (!(p.dead && p.boomed) && !(p.inv > 0 && !p.dead && ((t >> 2) & 1))) {
      this.heli(p.x, p.y, p.face, p.from, p.turn, p.rot, p.landed && g.mode !== 'play' ? t >> 1 : t, null, false);
      if (p.shield > 0 && (p.shield > 120 || (t >> 3) & 1)) this.spr('shield', p.x, p.y - 1, 0, 1, 1, (t / 6) | 0, 0.9);
    }
    for (let i = 0; i < g.bullets.length; i++) { const q = g.bullets[i]; if (q.k === 'eb') this.spr('eb', q.x, q.y, 0, 1, 1, (t >> 3) + i); else if (q.k === 'shell') this.spr('shell', q.x, q.y, q.t * 0.2, 1, 1, 0); else if (q.k === 'emis') this.spr('mis', q.x, q.y, Math.atan2(q.vy, q.vx) + PI / 2, 1, 1, (t >> 3)); else this.spr('pbomb', q.x, q.y, Math.atan2(q.vy, q.vx) - PI / 2, 1, 1, 0); }
    for (let i = 0; i < g.fx.length; i++) { const f = g.fx[i], k = Math.min(f.n - 1, (f.t / f.rate) | 0); if (f.k === 'hit' || f.k === 'splash' || f.k === 'spark') this.spr(f.k, f.x, f.y, f.k === 'hit' ? f.t : 0, 1, 1, k); else this.spr(f.k + k, f.x, f.y, 0, 1, 1, 0); }
    for (let i = 0; i < g.pops.length; i++) { const q = g.pops[i]; this.text(q.txt, q.x, q.y, 8.5, 'center', Math.min(1, (50 - q.t) / 15)); }
  };

  R.enemy = function (e, g) {
    const c = this.c, k = e.k, t = g.t, L = g.L, al = e.flash > 0 ? 0.45 : null, fi = ((t / 10) | 0) + e.id;
    if (k === 'tree') { const sy = e.h / 80; this.spr(e.v ? 'tree1' : 'tree0', e.x, e.y - 46 * sy, 0, e.id % 3 ? 1 : -1, sy, 0, al); }
    else if (k === 'tank') { this.spr('tbar', e.x, e.y - 4, e.ta, 1, 1, 0, al); this.spr('tank', e.x, e.y, 0, e.dir, 1, fi, al); }
    else if (k === 'jeep') this.spr('jeep', e.x, e.y, 0, -e.dir, 1, fi, al);
    else if (k === 'tur') { this.spr('tbar', e.x, e.y - 2, e.ta, 1, 1, 0, al); this.spr('tur', e.x, e.y, 0, 1, 1, fi, al); }
    else if (k === 'siren') this.spr('siren', e.x, e.y, 0, 1, 1, e.on ? (t >> 3) & 1 : 0, al);
    else if (k === 'ltw') {
      this.spr('ltw', e.x, e.y, 0, 1, 1, fi, al);
      if (e.ph === 1) this.spr('spark', e.x, e.y - 20, t * 0.2, 1, 1, t >> 2);
      if (e.ph === 2) { const top = Math.max(0, L.cAt(e.x)); for (let y = e.y - 22 - 31, n = 0; y > top - 31; y -= 60, n++) this.spr('bolt', e.x, y, 0, (n + (t >> 2)) & 1 ? -1 : 1, 1, (t >> 1) + n); this.spr('spark', e.x, e.y - 20, t * 0.3, 1.4, 1.4, t >> 1); }
    }
    else if (k === 'gey') { if (e.ph === 2) this.spr('gey', e.x, e.y - 50, 0, 1, 1, t >> 2, 0.95); else this.stroke([[e.x - 5, e.y - 0.5], [e.x - 2, e.y - 2.4], [e.x + 2, e.y - 2.4], [e.x + 5, e.y - 0.5]], 0.8, 0.9); }
    else if (k === 'sub') {
      if (e.st === 0) { this.stroke([[e.x, L.sea + 1], [e.x, L.sea - 5], [e.x + 2.5, L.sea - 5]], 0.7, 0.85); return; }
      c.save(); c.beginPath(); c.rect((e.x - 30) * DS.S, 0, 60 * DS.S, (L.sea + 0.5) * DS.S); c.clip(); this.spr('sub', e.x, e.y, 0, 1, 1, fi, al); c.restore();
      this.stroke([[e.x - 27, L.sea + 0.5], [e.x - 23, L.sea - 0.8], [e.x - 19, L.sea + 0.5]], 0.6, 0.7); this.stroke([[e.x + 19, L.sea + 0.5], [e.x + 23, L.sea - 0.8], [e.x + 27, L.sea + 0.5]], 0.6, 0.7);
    }
    else if (k === 'bird') this.spr('bird', e.x, e.y, 0, 1, 1, (t / 9 + e.id) | 0, al);
    else if (k === 'rain') {
      const gy = Math.min(VH, L.sea && L.gAt(e.x) > L.sea ? L.sea : L.gAt(e.x)), s = ART.get('rain');
      c.save(); c.beginPath(); c.rect((e.x - 42) * DS.S, (e.y + 6) * DS.S, 84 * DS.S, (gy - e.y - 6) * DS.S); c.clip();
      for (let y = e.y + 6 + ((t * 1.6) % 46) - 46, n = 0; y < gy; y += 46, n++) c.drawImage(s.frames[n % 3], Math.round((e.x - 42) * DS.S), Math.round(y * DS.S));
      c.restore();
      this.spr('rcloud', e.x, e.y, 0, 1, 1, 0);
    }
    else if (k === 'jetb' || k === 'jetg') this.spr('jet', e.x, e.y, 0, e.vx > 0 ? 1 : -1, 1, fi, al);
    else if (k === 'eheli') this.heli(e.x, e.y, e.dir, e.dir, 0, clampRot(e.vx * e.dir * 0.15), t + e.id, al, true);
    else if (k === 'stal') this.spr('stal', e.x + (e.st && e.t <= 14 ? Math.sin(e.t * 2) * 0.8 : 0), e.y, 0, 1, 1, 0, al);
  };
  function clampRot(v) { return v < -0.2 ? -0.2 : v > 0.2 ? 0.2 : v; }

  /* 계기판: 아래 20칸. 왼쪽부터 남은 구출 목표 · 탑승 · 구출 · 희생 · 보조 무기 · 헬기 · 데미지 막대 · 점수 */
  R.hud = function (g) {
    const c = this.c, p = g.pl, y = VH + 10.5, L = g.L;
    this.stroke([[2, VH + 0.4], [130, VH + 0.9], [270, VH + 0.2], [W - 2, VH + 0.7]], 0.9, 0.85); this.stroke([[3, VH + 1.2], [200, VH + 0.6], [W - 3, VH + 1.3]], 0.5, 0.4);
    const I = this.inset || 0, x0 = I, hs = ART.get('heli').frames[0];
    const col = (x, lab, val, big) => { this.text(lab, x, y - 0.4, 7.5, 'left', 0.72); this.text(val, x + lab.length * 6.4 + 3, y, big ? 12 : 11, 'left'); };
    if (!I) {
      col(6, '목표', String(Math.max(0, g.need - g.saved - g.aboard)), true);
      col(52, '탑승', g.aboard + '/' + g.cap);
      col(112, '구출', String(g.saved));
      col(156, '희생', String(g.lost));
      this.box(196, VH + 3.6, 44, 13.4, 5, 0.6, 0.7, 0.5);
      this.text(g.wsel, 204, y, 11, 'center'); this.text(DS.WPN[g.wsel].name.slice(0, 2) + ' ' + g.wp[g.wsel], 211, y, 8.5, 'left', g.wp[g.wsel] > 0 ? 0.95 : 0.5);
      c.globalAlpha = 0.95; c.drawImage(hs, 244 * S, (VH + 4.5) * S, 24 * S, 12 * S); c.globalAlpha = 1;
      this.text('×' + g.lives, 269, y, 11, 'left');
      this.text('데미지', 288.5, y - 0.4, 7.5, 'left', 0.72); this.bar(311.5, VH + 7.4, 43.5, 6, Math.min(1, p.dmg / 100));
      this.text(String(g.score), W - 6, y, 11.5, 'right');
    } else {      // 가로 휴대폰 전체 화면: 양옆 버튼 사이로 모아 쓴다 (점수는 위로)
      const k = (W - 2 * I) / 288;
      col(x0 + 1 * k, '목표', String(Math.max(0, g.need - g.saved - g.aboard)), true);
      col(x0 + 35 * k, '탑승', g.aboard + '/' + g.cap);
      col(x0 + 82 * k, '구출', String(g.saved));
      col(x0 + 117 * k, '희생', String(g.lost));
      const bx0 = x0 + 149 * k; this.box(bx0, VH + 3.6, 42, 13.4, 5, 0.6, 0.7, 0.5);
      this.text(g.wsel, bx0 + 7, y, 11, 'center'); this.text(DS.WPN[g.wsel].name.slice(0, 2) + ' ' + g.wp[g.wsel], bx0 + 14, y, 8.5, 'left', g.wp[g.wsel] > 0 ? 0.95 : 0.5);
      c.globalAlpha = 0.95; c.drawImage(hs, (x0 + 194 * k) * S, (VH + 4.5) * S, 24 * S, 12 * S); c.globalAlpha = 1;
      this.text('×' + g.lives, x0 + 194 * k + 23, y, 11, 'left');
      this.text('데미지', x0 + 240 * k, y - 0.4, 7.5, 'left', 0.72); this.bar(x0 + 240 * k + 20.5, VH + 7.4, 288 * k - 240 * k - 22.5, 6, Math.min(1, p.dmg / 100));
    }
    // 위: 스테이지 이름과 가로 지도 (왼쪽 끝 0 ~ 오른쪽 끝 len)
    this.text(g.S.sub + ' · ' + g.S.name, 6, 8, 8.5, 'left', 0.8);
    const mx = I ? 96 : 110, mw = I ? 140 : 180, my = 8, X = x => mx + x / L.len * mw;
    this.stroke([[mx, my + 3], [mx + mw, my + 3]], 0.6, 0.6);
    this.stroke([[X(g.cam), my + 1], [X(g.cam), my + 5]], 0.5, 0.5); this.stroke([[X(g.cam + W), my + 1], [X(g.cam + W), my + 5]], 0.5, 0.5);
    const bx = X(g.base.x); this.stroke([[bx, my + 3], [bx, my - 4]], 0.7, 0.9); c.fillStyle = DS.INK; c.globalAlpha = 0.8; c.fillRect(bx * S, (my - 4) * S, 4 * S, 2.6 * S);
    for (let i = 0; i < g.huts.length; i++) { const h = g.huts[i]; let n = h.n; if (!n) for (let j = 0; j < g.hs.length; j++) if (g.hs[j].st !== 'gone' && g.hs[j].st !== 'base' && Math.abs(g.hs[j].x - h.x) < 60) { n = 1; break; } const hx = X(h.x); c.globalAlpha = 0.85; if (n) c.fillRect((hx - 1.6) * S, (my - 0.6) * S, 3.2 * S, 3.2 * S); else { c.strokeStyle = DS.INK; c.lineWidth = 0.5 * S; c.strokeRect((hx - 1.6) * S, (my - 0.6) * S, 3.2 * S, 3.2 * S); } }
    const px = X(p.x); c.globalAlpha = 0.95; c.beginPath(); c.moveTo(px * S, (my + 2.4) * S); c.lineTo((px - 2.6) * S, (my + 8) * S); c.lineTo((px + 2.6) * S, (my + 8) * S); c.closePath(); c.fill(); c.globalAlpha = 1;
    if (I) this.text('점수 ' + g.score, this.scoreX || W - 78, 8, 9, 'right', 0.9); else this.text('최고 ' + g.hi, W - 6, 8, 8.5, 'right', 0.8);
    if (g.msg && g.mode === 'play') this.text(g.msg.txt, W / 2, 26, 11, 'center', Math.min(1, g.msg.t / 20));
    if (p.shield > 0 && g.mode === 'play') this.text('방패 ' + Math.ceil(p.shield / 60), W / 2, 38, 8.5, 'center', 0.85);

    if (g.mode === 'brief') {
      this.wash(0.5); this.box(100, 44, 200, 118, 3, 0.9, 0.85, 0.72);
      this.text(g.S.sub, W / 2, 58, 11, 'center', 0.85); this.text(g.S.name, W / 2, 78, 24, 'center');
      this.stroke([[140, 93], [200, 95], [260, 92.5]], 0.8, 0.7);
      this.text('구출 목표 ' + g.need + '명 · 기다리는 사람 ' + g.total + '명', W / 2, 108, 11, 'center');
      this.text('헬기 ×' + g.lives + ' · 정원 ' + g.cap + '명', W / 2, 123, 10, 'center', 0.9);
      this.text('기지는 ' + (g.base.side > 0 ? '오른쪽' : '왼쪽') + ' 끝에 있다', W / 2, 137, 9, 'center', 0.8);
      if (((g.modeT / 30) | 0) % 2 === 0) this.text(DS.touch ? '화면을 누르면 나선다' : 'X 또는 Enter로 나선다', W / 2, 152, 10, 'center');
    } else if (g.mode === 'clear') {
      const a = Math.min(1, g.modeT / 30); this.wash(a * 0.55); this.box(100, 40, 200, 126, 4, 0.9, 0.85 * a, 0.72 * a);
      this.text('스테이지 ' + (g.stage + 1) + ' 클리어', W / 2, 60, 21, 'center', a); this.text(g.S.name, W / 2, 79, 11, 'center', a * 0.85);
      if (g.modeT > 40) this.text('구출 ' + g.saved + '명 · 희생 ' + g.lost + '명', W / 2, 99, 11, 'center', a);
      if (g.modeT > 70) this.text('목표를 넘겨 구한 사람 ' + Math.max(0, g.saved - g.need) + '명 × 200', W / 2, 114, 9.5, 'center', a * 0.9);
      if (g.modeT > 100) this.text('남은 헬기 ' + g.lives + ' × 300 = ' + g.bonus, W / 2, 128, 9.5, 'center', a * 0.9);
      if (g.modeT > 130) this.text('점수 ' + g.score, W / 2, 144, 12, 'center', a);
      if (g.modeT > 150 && ((g.modeT / 30) | 0) % 2 === 0) this.text(DS.touch ? '화면을 누르면 다음 장으로' : 'X 또는 Enter로 다음 장으로', W / 2, 158, 9, 'center');
    }
  };

  R.pageTurn = function (k) {      // 종이를 넘기는 전환 (k: 0→1)
    const c = this.c, x = Math.round(W * S * (1 - k));
    c.drawImage(this.paper, x, 0, W * S - x, H * S, x, 0, W * S - x, H * S);
    const gr = c.createLinearGradient(x - 26 * S, 0, x, 0); gr.addColorStop(0, 'rgba(40,40,40,0)'); gr.addColorStop(1, 'rgba(40,40,40,0.3)');
    c.fillStyle = gr; c.fillRect(x - 26 * S, 0, 26 * S, H * S);
    c.fillStyle = 'rgba(60,60,60,0.5)'; c.fillRect(x - 1, 0, 2, H * S);
  };

  DS.Render = Render;
})();
