/* 그림 등록부 — 헬기·사람·적·탄·아이템을 연필로 그려 미리 만들어 둔다 */
(function () {
  'use strict';
  const DS = window.DS, Pen = DS.Pen, RNG = DS.RNG;
  const ART = DS.ART = { defs: {}, cache: {} };
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  DS.hash = hash;
  function def(name, w, h, fn, o) { ART.defs[name] = { w: w, h: h, fn: fn, o: o || {} }; }
  ART.def = def;
  ART.get = function (name) {
    let s = ART.cache[name];
    if (s) return s;
    const d = ART.defs[name];
    if (!d) throw new Error('그림 없음: ' + name);
    const n = d.o.boil == null ? 2 : d.o.boil, frames = [];
    for (let i = 0; i < n; i++) {
      const pen = new Pen(d.w, d.h, hash(name) + i * 7919, { k: d.o.k, noFill: d.o.noFill, ink: d.o.ink, bold: d.o.bold });
      pen.lay = RNG(hash(name) ^ 0x51ed);
      d.fn(pen, i);
      frames.push(pen.done(d.o.grain));
    }
    s = ART.cache[name] = { name: name, w: d.w, h: d.h, frames: frames, o: d.o };
    return s;
  };
  ART.clear = function () { Object.keys(ART.cache).forEach(n => { ART.cache[n].frames.forEach(f => { f.width = f.height = 0; }); delete ART.cache[n]; }); };      // 종이 색이 바뀌면 모두 다시 그린다

  const SH = (side, f, a, gap, ang) => ({ side: side || 'b', f: f == null ? 0.55 : f, a: a == null ? 0.45 : a, gap: gap || 1.2, ang: ang == null ? -0.95 : ang });
  DS.SH = SH;
  const L1 = { w: 0.42, a: 0.9, passes: 1 };

  /* ───────── 헬기: 옆모습(기수가 오른쪽)과 앞모습. 회전날개는 따로 그려 돌린다 ───────── */
  function heliSide(p, tone, foe) {
    p.poly([[-7, -2.3], [-20, -2.7], [-20.7, -1], [-7, 2.2]], { tone: tone + 0.05, w: 0.45 });
    p.poly([[-18, -2.7], [-22, -8.4], [-19.8, -8.6], [-15.8, -2.6]], { tone: tone + 0.22, w: 0.45 });
    p.poly([[-20.4, -1.2], [-22.6, 1.8], [-21, 2], [-18.8, -1]], { tone: tone + 0.12, w: 0.35 });
    p.poly([[-9, -1.5], [-6.5, -5], [1, -6.6], [7, -5.4], [11.5, -2], [13, 1.2], [11, 4], [4, 5.4], [-4, 5.2], [-8.5, 2.6]], { s: true, tone: tone, hatch: SH('b', 0.55, foe ? 0.75 : 0.5, 1.05), w: 0.62 });
    p.poly([[3, -5.6], [7, -4.6], [11, -1.4], [12, 0.6], [5.4, 0.8], [3, -1.6]], { s: true, tone: foe ? 0.55 : 0.16, w: 0.4, hatch: foe ? undefined : { ang: 0.7, gap: 1.4, a: 0.3 } });
    p.seg(-3, -4.8, -3, 4.8, { w: 0.3, a: 0.5, passes: 1 });
    p.seg(-3, 5.2, -4.4, 8.2, L1); p.seg(5, 5.3, 6.4, 8.2, L1);
    p.line([[-8, 8.4], [9, 8.4], [11, 7.2]], { w: 0.62, a: 1 });
    p.seg(1, -6.6, 1, -9.8, { w: 0.62, a: 1, passes: 1 });
    p.seg(8, 4.6, 13.4, 5.5, { w: 0.5, a: 0.95, passes: 1 });
    if (foe) { p.seg(-13, -2.4, -9, -2.2, { w: 0.9, a: 0.9, passes: 1 }); p.seg(-12, 0, -8.5, 0.6, { w: 0.9, a: 0.9, passes: 1 }); }
  }
  def('heli', 48, 24, p => heliSide(p, 0.05, false));
  def('eheli', 48, 24, p => heliSide(p, 0.34, true));
  def('heli_f', 28, 24, p => {
    p.mir(q => { q.seg(4.2, 4.6, 6, 8.2, L1); q.seg(4.4, 8.4, 7.8, 8.4, { w: 0.62, a: 1, passes: 1 }); });
    p.ell(0, -0.4, 6.8, 5.9, { tone: 0.05, hatch: SH('b', 0.6, 0.5, 1.05), w: 0.62 });
    p.poly([[-5.2, -0.8], [-3.7, -4.5], [0, -5.3], [3.7, -4.5], [5.2, -0.8], [3.6, 1.5], [-3.6, 1.5]], { s: true, tone: 0.16, w: 0.4, hatch: { ang: 0.7, gap: 1.4, a: 0.3 } });
    p.seg(0, -5.2, 0, 1.4, { w: 0.25, a: 0.5, passes: 1 });
    p.seg(0, -6.3, 0, -9.8, { w: 0.62, a: 1, passes: 1 });
    p.seg(0, 5.5, 0, 7.6, { w: 0.55, a: 0.95, passes: 1 });
  });
  def('hrot', 46, 8, (p, i) => {
    const L = [21, 13, 17][i];
    p.seg(-L, 0, L, 0, { w: 0.6, a: 0.95, passes: 1, jit: 0.1, noOver: true });
    p.ell(0, 0, 21.4, 1.5, { paper: false, w: 0.24, a: 0.34, passes: 1, jit: 0.08 });
  }, { noFill: true, boil: 3, grain: 0.3 });
  def('trot', 10, 10, (p, i) => {
    for (let k = 0; k < 2; k++) { const a = i * 1.05 + k * 1.5708; p.seg(Math.cos(a) * -3.6, Math.sin(a) * -3.6, Math.cos(a) * 3.6, Math.sin(a) * 3.6, { w: 0.36, a: 0.8, passes: 1, noOver: true }); }
    p.ell(0, 0, 3.9, 3.9, { paper: false, w: 0.2, a: 0.3, passes: 1, jit: 0.1 });
  }, { noFill: true, boil: 3, grain: 0.3 });
  def('shield', 64, 38, (p, i) => {
    p.ell(0, 0, 29 - i, 16 - i * 0.6, { paper: false, w: 0.5, a: 0.75, jit: 0.5 });
    p.ell(0, 0, 26, 13.6, { paper: false, w: 0.3, a: 0.4, passes: 1, jit: 0.6, ph: i });
  }, { noFill: true, boil: 2 });

  /* ───────── 사람: 걷는 두 장과 손 흔드는 한 장 ───────── */
  def('host', 8, 13, (p, i) => {
    const o = { w: 0.44, a: 1, passes: 1, noOver: true };
    p.seg(0, -3.2, 0, 1.8, { w: 0.55, a: 1, passes: 1, noOver: true });
    if (i === 2) { p.seg(0, -2.2, -2.7, -5); p.seg(0, -2.2, 2.7, -5, o); p.seg(0, -2.2, -2.7, -5, o); p.seg(0, 1.8, -1.3, 6, o); p.seg(0, 1.8, 1.3, 6, o); }
    else { const s = i ? 1 : -1; p.seg(0, -2.2, 2 * s, 0.4, o); p.seg(0, -2.2, -1.7 * s, 0.1, o); p.seg(0, 1.8, 2 * s, 6, o); p.seg(0, 1.8, -1.6 * s, 6, o); }
    p.ell(0, -4.6, 1.3, 1.3, { tone: 0.3, w: 0.36 });
  }, { boil: 3, grain: 0.2 });

  /* ───────── 적 ───────── */
  def('tank', 34, 17, p => {
    p.poly([[-13.5, 2.5], [13.5, 2.5], [15, 5.2], [12.4, 8.2], [-12.4, 8.2], [-15, 5.2]], { tone: 0.32, w: 0.5 });
    for (let i = -10; i <= 10; i += 5) p.ell(i, 5.5, 1.9, 1.9, { tone: 0.04, w: 0.3 });
    p.poly([[-12.4, 2.5], [-10, -1.6], [10, -1.6], [12.8, 2.5]], { tone: 0.12, hatch: SH('b', 0.45, 0.55, 1.05), w: 0.56 });
    p.poly([[-5.2, -1.6], [-4, -5.8], [4, -5.8], [5.6, -1.6]], { tone: 0.22, w: 0.5 });
  });
  def('tbar', 28, 6, p => { p.rect(6.5, 0, 13, 1.7, { tone: 0.5, w: 0.4 }); });
  def('jeep', 26, 13, p => {
    p.poly([[-11, 3.4], [-11, -0.6], [-4, -1], [-2.6, -4.6], [3.6, -4.6], [5.4, -1], [11, -0.2], [11.4, 3.4]], { tone: 0.1, hatch: SH('b', 0.5, 0.5, 1.05), w: 0.55 });
    p.seg(-2.6, -4.6, -4, -1, L1); p.seg(0.6, -4.6, 0.6, -1, { w: 0.3, a: 0.6, passes: 1 });
    p.mir(q => q.ell(6.6, 3.9, 2.5, 2.5, { tone: 0.4, w: 0.45 }));
    p.seg(-8, -0.8, -9.6, -5.4, { w: 0.55, a: 0.95, passes: 1 });
  });
  def('tur', 22, 13, p => {
    p.poly([[-9, 6.4], [-7, 0.6], [7, 0.6], [9, 6.4]], { tone: 0.14, hatch: SH('b', 0.4, 0.55, 1.05), w: 0.55 });
    p.poly([[-5, 0.6], [-4.4, -2.6], [0, -5], [4.4, -2.6], [5, 0.6]], { s: true, tone: 0.3, w: 0.5 });
  });
  def('jet', 42, 16, p => {
    p.poly([[-17, -1], [-19.6, -7], [-16, -7], [-11.4, -1.8]], { tone: 0.3, w: 0.45 });
    p.poly([[-19, -1.6], [-10, -2.6], [6, -2.6], [14, -1.2], [19.6, 1], [13, 2.6], [-17, 2.6], [-19.6, 0.8]], { s: true, tone: 0.12, hatch: SH('b', 0.5, 0.55, 1.05), w: 0.58 });
    p.poly([[4, -2.6], [7, -4.4], [11.4, -3.4], [13.4, -1.4]], { s: true, tone: 0.5, w: 0.36 });
    p.poly([[-7, 1], [3, 1], [-6, 6.6], [-10.4, 6.6]], { tone: 0.26, w: 0.45 });
    p.seg(-19.6, 0.6, -21, 0.6, { w: 0.9, a: 0.6, passes: 1 });
  });
  def('bird', 16, 10, (p, i) => {
    const o = { s: true, w: 0.55, a: 1, passes: 1 };
    if (i) { p.line([[-6.4, 1.6], [-3, -1], [0, 0.6]], o); p.line([[0, 0.6], [3, -1], [6.4, 1.6]], o); }
    else { p.line([[-6, -3.6], [-2.6, -0.4], [0, 0.8]], o); p.line([[0, 0.8], [2.6, -0.4], [6, -3.6]], o); }
    p.dot(0, 1.2, 0.9, 0.9);
  }, { noFill: true, boil: 2, grain: 0.2 });
  def('sub', 52, 20, p => {
    p.seg(0.5, -6, 0.5, -9.6, { w: 0.5, a: 0.9, passes: 1 }); p.seg(0.5, -9.4, 3, -9.4, { w: 0.5, a: 0.9, passes: 1 });
    p.poly([[-4.6, 0.4], [-3.8, -6], [4.4, -6], [5.6, 0.4]], { tone: 0.34, w: 0.5 });
    p.poly([[-24, 8.6], [-18, 2.4], [-6, 0.2], [8, 0.2], [18, 2], [24, 8.6]], { s: true, tone: 0.2, hatch: SH('b', 0.35, 0.6, 1.05), w: 0.6 });
  });
  def('mis', 8, 18, p => {
    p.poly([[-1.5, 6], [-1.5, -4], [0, -8], [1.5, -4], [1.5, 6]], { tone: 0.3, w: 0.45 });
    p.mir(q => q.poly([[1.5, 3], [3.4, 7.6], [1.5, 6.4]], { tone: 0.5, w: 0.3 }));
  });
  def('stal', 14, 26, p => {
    p.poly([[-5.4, -12], [5.4, -12], [2.4, -2], [0.6, 12], [-1.6, 0]], { tone: 0.12, hatch: SH('r', 0.45, 0.6, 1.0), w: 0.56 });
    p.seg(-1.6, -9, -0.6, -1, { w: 0.25, a: 0.5, passes: 1 });
  });
  def('gey', 22, 100, (p, i) => {
    const r = p.rng;
    for (let k = 0; k < 4; k++) { const x = -5 + k * 3.3 + r() * 1.5, pts = []; for (let y = 48; y >= -40 + r() * 10; y -= 6) pts.push([x + Math.sin(y * 0.3 + k + i) * 1.6 + (48 - y) * 0.015 * (k - 1.5), y]); p.line(pts, { s: true, w: 0.42, a: 0.7, passes: 1 }); }
    for (let k = 0; k < 5; k++) p.scribble(-6 + r() * 12, -42 + r() * 10, 3 + r() * 2.4, { turns: 1.6, w: 0.36, a: 0.75 });
  }, { noFill: true, boil: 3, grain: 0.35 });
  def('bolt', 16, 62, (p, i) => {
    const r = p.rng, pts = []; for (let y = 31; y >= -31; y -= 6.2) pts.push([(r() - 0.5) * 9, y]);
    p.line(pts, { w: 0.95, a: 1, jit: 0.2 }); p.line(pts.map(q => [q[0] + 1.6 + (i - 1), q[1] + 2]), { w: 0.3, a: 0.6, passes: 1 });
  }, { noFill: true, boil: 3, grain: 0.2 });
  def('rcloud', 104, 46, p => {
    const r = p.lay, n = 13, pts = [];
    for (let i = 0; i < n; i++) { const a = i / n * 6.2832, q = 0.82 + 0.3 * r(); pts.push([Math.cos(a) * 44 * q, Math.sin(a) * 15 * q]); const b = a + 3.1416 / n; pts.push([Math.cos(b) * 44 * q * 0.86, Math.sin(b) * 15 * q * 0.86]); }
    p.poly(pts, { s: true, w: 0.6, a: 0.9, tone: 0.12, hatch: [{ ang: 0.25, gap: 1.3, a: 0.55 }, { side: 'b', f: 0.45, ang: -0.8, gap: 1.2, a: 0.5 }] });
  }, { boil: 1 });
  def('rain', 84, 50, (p, i) => {
    const r = p.rng;
    for (let k = 0; k < 26; k++) { const x = -38 + r() * 76, y = -22 + r() * 40; p.seg(x, y, x - 1.6, y + 5 + r() * 3, { w: 0.34, a: 0.75, passes: 1, noOver: true }); }
  }, { noFill: true, boil: 3, grain: 0.25 });
  def('cloud0', 110, 50, p => cloud(p, 46, 16));
  def('cloud1', 76, 40, p => cloud(p, 30, 12));
  function cloud(p, rx, ry) {
    const r = p.lay, n = 13, pts = [];
    for (let i = 0; i < n; i++) { const a = i / n * 6.2832, q = 0.82 + 0.3 * r(); pts.push([Math.cos(a) * rx * q, Math.sin(a) * ry * q]); if (r() < 0.8) { const b = a + 3.1416 / n; pts.push([Math.cos(b) * rx * q * 0.86, Math.sin(b) * ry * q * 0.86]); } }
    p.poly(pts, { paper: false, s: true, w: 0.4, a: 0.42, hatch: { side: 'b', f: 0.66, ang: 0.2, gap: 2, a: 0.22 } });
  }

  /* ───────── 탄·아이템 ───────── */
  def('pb', 10, 5, p => { p.seg(-3.4, 0, 3.4, 0, { w: 1.05, a: 1, noOver: true, jit: 0.1 }); }, { noFill: true, grain: 0.15 });
  def('pdrop', 6, 9, p => { p.poly([[0, -3.4], [1.7, 0.6], [0, 3.2], [-1.7, 0.6]], { s: true, tone: 0.6, w: 0.45 }); }, { boil: 1 });
  def('pbomb', 9, 13, p => {
    p.mir(q => q.poly([[0.8, -3.4], [3, -5.6], [3, -4], [0.8, -2.2]], { tone: 0.4, w: 0.35 }));
    p.poly([[0, -3.6], [2.3, -1], [2, 3.4], [0, 5.6], [-2, 3.4], [-2.3, -1]], { s: true, tone: 0.34, hatch: SH('r', 0.5, 0.7, 0.8), w: 0.55 });
  }, { boil: 1 });
  def('pmis', 18, 7, p => {
    p.poly([[-6, -1.4], [4, -1.4], [7.6, 0], [4, 1.4], [-6, 1.4]], { tone: 0.3, w: 0.5 });
    p.poly([[-6, -1.4], [-8, -3], [-4.4, -1.4]], { tone: 0.5, w: 0.3 }); p.poly([[-6, 1.4], [-8, 3], [-4.4, 1.4]], { tone: 0.5, w: 0.3 });
  }, { boil: 1 });
  def('eb', 8, 8, p => { p.ell(0, 0, 2.5, 2.5, { tone: 0.78, w: 0.5 }); p.ell(0, 0, 3.5, 3.5, { paper: false, w: 0.24, a: 0.5, passes: 1 }); });
  def('shell', 9, 9, p => { p.ell(0, 0, 3, 3, { tone: 0.6, hatch: { ang: 0.7, gap: 0.8, a: 0.7 }, w: 0.6 }); });
  def('itbox', 16, 16, p => { p.rect(0, 0, 12.6, 12.6, { tone: 0.02, w: 0.8, a: 1 }); p.rect(0, 0, 10, 10, { paper: false, w: 0.25, a: 0.5, passes: 1 }); }, { grain: 0.25 });
  def('star', 18, 18, p => {
    const pts = []; for (let i = 0; i < 10; i++) { const a = -1.5708 + i * 0.6283, r = i % 2 ? 3.1 : 7.2; pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
    p.poly(pts, { tone: 0.1, hatch: SH('r', 0.5, 0.6, 0.9), w: 0.7, a: 1 });
  }, { grain: 0.3 });

  /* ───────── 폭발·맞은 자리 ───────── */
  function boom(name, R, N, i) {
    const size = Math.ceil(R * 2.5 + 6);
    def(name + i, size, size, p => {
      const r = p.rng, t = i / (N - 1), rad = R * (0.3 + 0.7 * Math.sqrt(t));
      if (t < 0.55) {
        const n = 9 + ((R / 5) | 0), pts = [], ph = r() * 6.28;
        for (let k = 0; k < n * 2; k++) { const a = ph + k / (n * 2) * 6.2832, q = rad * (k % 2 ? 0.5 + 0.12 * r() : 0.92 + 0.3 * r()); pts.push([Math.cos(a) * q, Math.sin(a) * q]); }
        p.poly(pts, { tone: 0.02, w: 0.7 + R * 0.01, a: 1 - t * 0.4 });
        const pt2 = []; for (let k = 0; k < n * 2; k++) { const a = ph + 0.3 + k / (n * 2) * 6.2832, q = rad * 0.5 * (k % 2 ? 0.5 : 1); pt2.push([Math.cos(a) * q, Math.sin(a) * q]); }
        p.poly(pt2, { paper: false, tone: 0.3 * (1 - t), hatch: { ang: 0.6, gap: 1.1, a: 0.55 * (1 - t) }, w: 0.45, a: 0.8 });
      }
      if (t > 0.2) {
        const m = 4 + ((R / 6) | 0);
        for (let k = 0; k < m; k++) { const a = r() * 6.28, q = rad * (0.35 + 0.6 * r()) * (t < 0.55 ? 0.9 : 1); p.scribble(Math.cos(a) * q, Math.sin(a) * q, R * (0.2 + 0.2 * r()) * (1.3 - t * 0.5), { turns: 1.8, w: 0.45, a: 0.85 * (1.25 - t), jit: 0.3 }); }
      }
      const dn = 6 + ((R / 4) | 0);
      for (let k = 0; k < dn; k++) { const a = r() * 6.28, q0 = rad * (0.95 + 0.2 * r()), q1 = q0 + R * (0.1 + 0.2 * r()); p.seg(Math.cos(a) * q0, Math.sin(a) * q0, Math.cos(a) * q1, Math.sin(a) * q1, { w: 0.4, a: 0.9 * (1.1 - t), passes: 1, noOver: true }); }
    }, { boil: 1, grain: 0.4 });
  }
  DS.BOOM = { s: 6, m: 7, l: 8 };
  for (let i = 0; i < 6; i++) boom('boom_s', 8, 6, i);
  for (let i = 0; i < 7; i++) boom('boom_m', 15, 7, i);
  for (let i = 0; i < 8; i++) boom('boom_l', 26, 8, i);
  def('hit', 12, 12, p => {
    for (let i = 0; i < 4; i++) { const a = i * 1.5708 + 0.4; p.seg(Math.cos(a) * 1.4, Math.sin(a) * 1.4, Math.cos(a) * 4.8, Math.sin(a) * 4.8, { w: 0.55, a: 0.9, passes: 1 }); }
  }, { noFill: true, boil: 2 });
  def('splash', 20, 16, (p, i) => {
    for (let k = -2; k <= 2; k++) p.line([[k * 1.6, 6], [k * (3 + i * 1.4), -1 - i * 2], [k * (4.4 + i * 2), 3 - i]], { s: true, w: 0.36, a: 0.8 - i * 0.2, passes: 1 });
  }, { noFill: true, boil: 3 });

  DS.WARM = ['heli', 'heli_f', 'hrot', 'trot', 'shield', 'host', 'pb', 'pdrop', 'pbomb', 'pmis', 'eb', 'shell', 'itbox', 'star', 'hit', 'splash', 'cloud0', 'cloud1', 'bird', 'tank', 'tbar', 'tur'];
  ['s', 'm', 'l'].forEach(k => { for (let i = 0; i < DS.BOOM[k]; i++) DS.WARM.push('boom_' + k + i); });
})();
