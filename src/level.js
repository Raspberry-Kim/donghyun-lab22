/* 스테이지 일곱 장 — 땅 높이(가로 한 칸마다 하나)·천장·바다와 그 위에 놓이는 것들.
   좌표: x는 왼쪽에서 오른쪽으로 0..len, y는 위에서 아래로 0..VH. 땅 높이 gy[x]보다 아래(y가 큰 쪽)는 흙이다. */
(function () {
  'use strict';
  const DS = window.DS, ART = DS.ART, Pen = DS.Pen, RNG = DS.RNG, SH = DS.SH, VH = DS.VH, W = DS.W, def = ART.def;
  const CHUNK = DS.CHUNK = 400, DEEP = 240;      // DEEP: 바다 밑 땅 높이(화면 밖)
  const ease = t => (1 - Math.cos(Math.PI * t)) / 2;

  /* ───────── 짓는 도구: 왼쪽에서 오른쪽으로 땅을 이어 붙이며 그 위에 물건을 놓는다 ───────── */
  function B(y, seed) { this.x = 0; this.y = y; this.g = []; this.cp = []; this.ob = []; this.deco = []; this.r = RNG(seed || 1); this.segs = []; }
  const P = B.prototype;
  P.f = function (w) { this.segs.push([this.x, this.x + w, this.y, this.y, 0]); this.x += w; return this; };                       // 평지
  P.s = function (w, y, rough) { this.segs.push([this.x, this.x + w, this.y, y, rough == null ? 2.5 : rough]); this.x += w; this.y = y; return this; };      // 비탈
  P.j = function (y) { this.y = y; return this; };                                                                                  // 수직 벽
  P.c = function (y) { this.cp.push([this.x, y]); return this; };                                                                   // 천장 기준점 (null이면 여기서 끊긴다)
  P.o = function (k, back, o) { this.ob.push(Object.assign({ k: k, x: Math.round(this.x - (back || 0)) }, o || {})); return this; };
  P.d = function (k, back, o) { this.deco.push(Object.assign({ k: k, x: Math.round(this.x - (back || 0)) }, o || {})); return this; };
  P.done = function (meta) {
    const len = this.x, gy = new Float32Array(len + 1), cy = new Float32Array(len + 1).fill(-99), r = this.r;
    const nz = new Float32Array(len + 1); let v = 0; for (let i = 0; i <= len; i++) { v = v * 0.86 + (r() - 0.5) * 0.9; nz[i] = v; }
    this.segs.forEach(s => { for (let x = s[0]; x <= s[1] && x <= len; x++) { const t = (x - s[0]) / Math.max(1, s[1] - s[0]); gy[x] = s[2] === s[3] ? s[2] : s[2] + (s[3] - s[2]) * ease(t) + nz[x] * s[4] * Math.sin(Math.PI * t); } });
    for (let i = 0; i < this.cp.length - 1; i++) {
      const a = this.cp[i], b = this.cp[i + 1]; if (a[1] == null || b[1] == null) continue;
      for (let x = a[0]; x <= b[0] && x <= len; x++) { const t = (x - a[0]) / Math.max(1, b[0] - a[0]); cy[x] = a[1] + (b[1] - a[1]) * ease(t) + nz[(x * 7 + 13) % len] * 4 * Math.sin(Math.PI * t) - 1; }
    }
    const L = Object.assign({ len: len, gy: gy, cy: cy, ob: this.ob, deco: this.deco, sea: 0 }, meta);
    L.gAt = x => gy[Math.max(0, Math.min(len, Math.round(x)))];
    L.cAt = x => cy[Math.max(0, Math.min(len, Math.round(x)))];
    return L;
  };

  /* ───────── 일곱 장 ───────── */
  const STAGES = DS.STAGES = [
    { name: '모래 언덕', sub: '첫째 장', theme: 'desert', need: 12, baseSide: 1,
      note: '완만한 언덕과 비구름, 새. 전차와 지프가 처음 나온다.',
      make() {
        const b = new B(182, 11);
        b.f(60).f(210).o('hut', 105, { n: 4 }).o('tank', 30, { r: 34 }).o('rain', 190, { y: 50 });
        b.s(140, 158, 3).o('bird', 60, { y: 84, r: 80 }).s(120, 178, 3);
        b.f(240).o('hut', 120, { n: 4 }).o('box', 40, { y: 120, w: 'B' });
        b.s(160, 146, 4).f(90).o('star', 45, { y: 104 }).o('bird', 10, { y: 70, r: 110 }).s(140, 184, 4);
        b.f(260).o('hut', 140, { n: 4 }).o('tank', 46, { r: 44 }).o('rain', 215, { y: 46 });
        b.s(200, 164, 4).o('bird', 90, { y: 96, r: 90 }).s(160, 180, 3);
        b.f(240).o('hut', 120, { n: 4 }).o('jeep', 40, { r: 60 });
        b.s(180, 168, 4).o('rain', 60, { y: 54 }).s(120, 184, 3).o('bird', 40, { y: 110, r: 70 });
        b.s(150, 172, 3).s(150, 182, 3);
        b.f(330).o('base', 150);
        return b.done({});
      } },
    { name: '종유 동굴', sub: '둘째 장', theme: 'cave', need: 12, baseSide: -1,
      note: '천장이 낮다. 종유석이 떨어지고 바닥에서 간헐천이 솟는다.',
      make() {
        const b = new B(182, 22);
        b.f(300).o('base', 150).s(110, 172, 3).c(-30);
        b.s(130, 178, 3).c(40);
        b.f(230).o('hut', 115, { n: 4 }).o('stal', 196).o('stal', 30).c(48);
        b.s(120, 152, 4).c(30).s(100, 164, 3).o('gey', 50).o('bird', 60, { y: 90, r: 50 });
        b.s(140, 186, 4).c(64);
        b.f(250).o('hut', 130, { n: 4 }).o('tur', 30).o('stal', 210).o('stal', 70).c(58);
        b.s(120, 142, 5).c(30).f(80).o('star', 40, { y: 96 }).o('stal', 60).c(26);
        b.s(120, 172, 4).c(80).f(130).o('gey', 95).o('gey', 35).o('box', 66, { y: 128, w: 'S' }).c(86);
        b.s(140, 188, 3).c(54);
        b.f(270).o('hut', 140, { n: 4 }).o('tank', 50, { r: 40 }).o('stal', 232).o('stal', 196).o('stal', 84).c(46);
        b.s(160, 156, 5).o('bird', 80, { y: 96, r: 60 }).c(28).s(140, 182, 4).o('gey', 70).c(76);
        b.f(270).o('hut', 150, { n: 4 }).o('tur', 240).o('tur', 40).o('stal', 120).o('stal', 30).c(60);
        b.s(40, 150, 2).c(60).j(40).f(40).c(60);
        return b.done({});
      } },
    { name: '먹구름 바다', sub: '셋째 장', theme: 'sea', need: 12, baseSide: 1, sea: 190,
      note: '섬과 배 갑판에만 내릴 수 있다. 잠수함이 떠올라 미사일을 쏘고 탑에서 번개가 친다.',
      make() {
        const b = new B(DEEP, 33);
        b.f(110).o('sub', 40).s(40, 178, 2).f(190).o('hut', 95, { n: 4 }).o('tur', 24).s(40, DEEP, 2);
        b.f(270).o('sub', 160).o('rain', 120, { y: 46 }).o('rain', 40, { y: 60 });
        b.j(175).f(200).o('grp', 100, { n: 4 }).d('ship', 200, { w: 200 }).o('box', 100, { y: 110, w: 'M' }).j(DEEP);
        b.f(200).o('sub', 110).s(16, 180, 1).f(34).o('ltw', 17).s(16, DEEP, 1).f(170).o('rain', 80, { y: 50 }).o('trig', 90, { w: 'jetg' });
        b.s(50, 170, 3).f(210).o('hut', 110, { n: 4 }).o('tank', 36, { r: 30 }).o('star', 180, { y: 112 }).s(60, DEEP, 3);
        b.f(300).o('sub', 210).o('sub', 80).o('rain', 240, { y: 44 }).o('rain', 90, { y: 58 });
        b.s(60, 148, 4).s(40, 172, 2).f(160).o('hut', 86, { n: 4 }).o('tur', 20).s(40, DEEP, 2);
        b.f(150).o('sub', 80).s(16, 180, 1).f(34).o('ltw', 17).s(16, DEEP, 1).f(170).o('sub', 70).o('trig', 100, { w: 'jetg' }).o('rain', 60, { y: 52 });
        b.s(60, 180, 2).f(350).o('base', 160);
        return b.done({});
      } },
    { name: '빗금 밀림', sub: '넷째 장', theme: 'jungle', need: 12, baseSide: -1,
      note: '나무에 부딪히면 다친다. 숲 위로 날다가 빈터로 곧게 내려앉아야 한다. 폭탄은 나무를 쓰러뜨린다.',
      make() {
        const b = new B(184, 44), woods = (w, n, y) => { const x0 = b.x; b.s(w, y, 2); for (let i = 0; i < n; i++) b.ob.push({ k: 'tree', x: Math.round(x0 + (i + 0.5) * w / n + (b.r() - 0.5) * 8), h: 46 + ((b.r() * 34) | 0) }); return b; };
        b.f(300).o('base', 150);
        woods(200, 6, 178).o('bird', 100, { y: 70, r: 80 });
        b.f(170).o('hut', 85, { n: 4 }).o('jeep', 30, { r: 28 });
        woods(240, 7, 186).o('rain', 120, { y: 40 }).o('box', 20, { y: 100, w: 'B' });
        b.f(150).o('hut', 70, { n: 4 }).o('tur', 20);
        woods(260, 8, 174).o('bird', 200, { y: 60, r: 70 }).o('bird', 60, { y: 84, r: 60 }).o('eheli', 130, { y: 60 });
        b.f(160).o('hut', 86, { n: 4 }).o('jeep', 130, { r: 20 }).o('star', 80, { y: 96 });
        woods(280, 8, 184).o('rain', 200, { y: 44 }).o('rain', 70, { y: 36 }).o('trig', 140, { w: 'jetb' });
        b.f(120).o('tur', 96).o('tur', 24).o('box', 60, { y: 110, w: 'M' });
        woods(220, 7, 178).o('bird', 110, { y: 66, r: 90 }).o('eheli', 60, { y: 70 });
        b.f(170).o('hut', 90, { n: 4 }).o('tank', 34, { r: 24 });
        woods(130, 4, 182);
        return b.done({});
      } },
    { name: '흑연 협곡', sub: '다섯째 장', theme: 'canyon', need: 12, baseSide: 1,
      note: '깊은 골짜기와 높은 바위. 벼랑의 포탑과 적 헬기가 길목을 지킨다.',
      make() {
        const b = new B(186, 55);
        b.f(60).f(190).o('hut', 100, { n: 4 }).o('tank', 30, { r: 26 }).o('gey', 170);
        b.s(34, 120, 2).f(46).o('tur', 23).s(40, 76, 3).f(150).o('star', 75, { y: 46 }).o('bird', 60, { y: 40, r: 60 }).s(50, 150, 4);
        b.f(60).o('gey', 30).s(40, 188, 2).f(200).o('hut', 104, { n: 4 }).o('jeep', 40, { r: 34 }).o('eheli', 100, { y: 90 });
        b.c(null).s(30, 130, 2).c(-30).f(50).o('tur', 25).c(34).s(46, 186, 3).c(52).f(150).o('gey', 110).o('box', 60, { y: 130, w: 'S' }).c(50).s(40, 124, 3).c(-30).c(null);
        b.f(70).o('tur', 35).s(60, 60, 4).f(200).o('hut', 100, { n: 4 }).o('tur', 180).o('trig', 100, { w: 'jetb' }).s(60, 140, 4);
        b.f(60).s(50, 190, 3).f(170).o('tank', 100, { r: 40 }).o('gey', 30).o('eheli', 90, { y: 100 }).o('box', 120, { y: 140, w: 'B' });
        b.s(40, 110, 2).f(60).o('tur', 30).s(50, 170, 3).f(200).o('hut', 100, { n: 4 }).o('jeep', 40, { r: 34 }).o('bird', 100, { y: 90, r: 70 });
        b.s(60, 96, 4).f(90).o('tur', 45).o('eheli', 40, { y: 50 }).s(70, 182, 4).f(120).o('gey', 60).o('trig', 60, { w: 'jetg' });
        b.s(60, 150, 3).f(340).o('base', 160);
        return b.done({});
      } },
    { name: '모눈 도시', sub: '여섯째 장', theme: 'city', need: 14, baseSide: -1,
      note: '건물 옥상에도 사람이 기다린다. 경보기가 울리면 제트기가 온다.',
      make() {
        const b = new B(186, 66), bld = (w, top) => { b.j(top).d('bld', 0, { w: w, top: top }).f(w).j(186); return b; };
        b.f(310).o('base', 150);
        bld(70, 128).f(70).o('tank', 35, { r: 20 });
        bld(110, 96).o('grp', 55, { n: 4 }).o('siren', 96);
        b.f(60); bld(60, 140).o('tur', 30); b.f(150).o('hut', 80, { n: 4 }).o('jeep', 26, { r: 14 });
        bld(80, 74).o('tur', 40).o('star', 40, { y: 44 }); b.f(56).o('box', 28, { y: 150, w: 'B' });
        bld(130, 112).o('grp', 64, { n: 4 }).o('tur', 116).o('eheli', 60, { y: 60 });
        b.f(90).o('tank', 45, { r: 28 }).o('trig', 45, { w: 'jetb' });
        bld(64, 150).o('siren', 32); bld(64, 90).o('tur', 32); b.f(60);
        bld(120, 124).o('grp', 60, { n: 4 }).o('siren', 108).o('box', 30, { y: 92, w: 'M' });
        b.f(170).o('hut', 90, { n: 4 }).o('tank', 34, { r: 20 }).o('eheli', 100, { y: 70 });
        bld(90, 68).o('tur', 70).o('tur', 20); b.f(64); bld(70, 132).o('siren', 35);
        b.f(80).o('jeep', 40, { r: 26 }); bld(80, 104).o('tur', 40); b.f(40);
        return b.done({});
      } },
    { name: '백지 요새', sub: '일곱째 장', theme: 'fort', need: 16, baseSide: 1, sea: 190,
      note: '지금까지의 위험이 모두 모였다. 해자와 지붕 밑 격납고, 번개 탑을 지나 스무 사람을 찾는다.',
      make() {
        const b = new B(186, 77), bld = (w, top) => { b.j(top).d('bld', 0, { w: w, top: top }).f(w).j(186); return b; };
        b.c(44).f(50).c(40).f(230).o('hut', 120, { n: 4 }).o('tur', 204).o('tank', 40, { r: 30 }).o('stal', 170).o('stal', 70).c(52).s(30, 180, 1).c(46).f(40).c(-30).c(null);
        bld(60, 110).o('tur', 30).o('siren', 12); b.f(70).o('gey', 35);
        bld(110, 84).o('grp', 56, { n: 4 }).o('tur', 100).o('eheli', 50, { y: 46 });
        b.f(60).o('ltw', 30).s(30, DEEP, 1).f(190).o('sub', 130).o('sub', 60).o('rain', 100, { y: 48 }).o('trig', 100, { w: 'jetg' }).s(30, 178, 1);
        b.f(220).o('hut', 110, { n: 4 }).o('tank', 180, { r: 20 }).o('jeep', 40, { r: 30 }).o('star', 110, { y: 110 });
        b.s(40, 120, 2).f(50).o('tur', 25).s(50, 70, 3).f(110).o('ltw', 55).o('box', 20, { y: 40, w: 'S' }).s(50, 160, 4).f(40).o('gey', 20).s(30, 188, 2);
        b.c(null).f(40).c(-30).f(40).c(60).f(240).o('hut', 130, { n: 4 }).o('tur', 220).o('tur', 30).o('stal', 190).o('stal', 150).o('stal', 90).o('gey', 60).c(64).f(40).c(-30).c(null);
        b.f(110).o('tank', 55, { r: 36 }).o('eheli', 50, { y: 80 }).o('trig', 55, { w: 'jetb' }).o('box', 55, { y: 130, w: 'B' });
        bld(70, 120).o('siren', 35); b.f(60).o('ltw', 30); bld(120, 92).o('grp', 60, { n: 4 }).o('tur', 110).o('tur', 12).o('eheli', 60, { y: 50 });
        b.f(160).o('jeep', 80, { r: 50 }).o('box', 80, { y: 140, w: 'M' }).o('bird', 80, { y: 90, r: 60 }).s(120, 176, 3).o('rain', 60, { y: 50 });
        b.s(100, 184, 2).f(340).o('base', 160);
        return b.done({});
      } }
  ];
  STAGES.forEach(s => { let n = 0; s.make().ob.forEach(o => { if (o.k === 'hut' || o.k === 'grp') n += o.n; }); s.total = n; });
  DS.buildStage = function (i) { const s = STAGES[i], L = s.make(); L.idx = i; L.name = s.name; L.sub = s.sub; L.theme = s.theme; L.need = s.need; L.total = s.total; L.baseSide = s.baseSide; L.sea = s.sea || 0; return L; };

  /* ───────── 건물·나무·탑 그림 ───────── */
  const L1 = { w: 0.42, a: 0.9, passes: 1 };
  def('hut', 40, 28, p => {
    p.poly([[-16, 12], [-16, -4], [16, -4], [16, 12]], { tone: 0.04, hatch: SH('r', 0.6, 0.45, 1.2), w: 0.62 });
    p.poly([[-19, -4], [-13, -11], [13, -11], [19, -4]], { tone: 0.26, hatch: { ang: 0.1, gap: 1.1, a: 0.5 }, w: 0.62 });
    p.rect(0, 5.5, 7, 13, { tone: 0.5, w: 0.5 });
    p.rect(-9.6, 2, 6, 5, { tone: 0.02, w: 0.45 }); for (let i = -1; i <= 1; i++) p.seg(-9.6 + i * 1.8, -0.4, -9.6 + i * 1.8, 4.4, { w: 0.35, a: 0.9, passes: 1, noOver: true });
    p.rect(9.6, 2, 6, 5, { tone: 0.02, w: 0.45 }); for (let i = -1; i <= 1; i++) p.seg(9.6 + i * 1.8, -0.4, 9.6 + i * 1.8, 4.4, { w: 0.35, a: 0.9, passes: 1, noOver: true });
  });
  def('basebld', 52, 44, p => {
    p.poly([[-22, 20], [-22, -6], [22, -6], [22, 20]], { tone: 0.03, hatch: SH('r', 0.62, 0.42, 1.25), w: 0.66 });
    p.poly([[-24, -6], [-24, -10], [24, -10], [24, -6]], { tone: 0.2, w: 0.55 });
    p.rect(0, 12.5, 9, 15, { tone: 0.5, w: 0.5 });
    for (let i = -1; i <= 1; i += 2) { p.rect(i * 13, 1, 8, 6, { tone: 0.12, w: 0.45 }); p.rect(i * 13, 12, 8, 6, { tone: 0.12, w: 0.45 }); }
    p.seg(15, -10, 15, -21, { w: 0.6, a: 1, passes: 1 });
  });
  def('flag', 16, 12, (p, i) => {
    const d = i ? 1 : -1;
    p.poly([[-6, -4], [-1, -4 - d], [5, -4 + d], [5, 2 + d], [-1, 2 - d], [-6, 2]], { s: true, tone: 0.12, hatch: { ang: 0.6, gap: 1.2, a: 0.55 }, w: 0.5 });
  }, { boil: 2 });
  def('tree0', 40, 92, p => tree(p, 0));
  def('tree1', 40, 92, p => tree(p, 1));
  function tree(p, v) {      // 밑동이 그림 맨 아래(0, 46). 높이 80칸으로 그려 두고 실제 높이에 맞춰 줄인다
    const r = p.lay;
    p.poly([[-2.6, 46], [-2, 2], [2, 2], [3, 46]], { tone: 0.2, hatch: { ang: 1.5, gap: 1.1, a: 0.5 }, w: 0.55 });
    p.seg(-2, 20, -8, 8, L1); p.seg(2, 26, 8, 14, L1);
    const blob = (x, y, rx, ry) => { const n = 11, pts = []; for (let i = 0; i < n; i++) { const a = i / n * 6.2832, q = 0.82 + 0.34 * r(); pts.push([x + Math.cos(a) * rx * q, y + Math.sin(a) * ry * q]); } p.poly(pts, { s: true, tone: 0.07, hatch: [{ side: 'b', f: 0.4, ang: -0.9, gap: 1.05, a: 0.6 }, { ang: 0.5, gap: 2.2, a: 0.25 }], w: 0.6 }); };
    if (v) { blob(-6, -4, 10, 12); blob(7, -10, 10, 13); blob(0, -26, 12, 15); }
    else { blob(6, 0, 10, 11); blob(-7, -12, 11, 13); blob(3, -28, 12, 14); }
  }
  def('siren', 14, 26, (p, i) => {
    p.seg(0, 13, 0, -2, { w: 0.7, a: 1, passes: 1 }); p.seg(-4, 13, 4, 13, { w: 0.6, a: 1, passes: 1 });
    p.poly([[-1.6, -2], [-1.6, -7], [1.6, -7], [1.6, -2]], { tone: 0.3, w: 0.45 });
    p.poly([[1.6, -6], [5.4, -9], [5.4, -1], [1.6, -3]], { tone: 0.1, w: 0.5 });
    if (i) { p.seg(-3.4, -9, -5.4, -11, L1); p.seg(-3.6, -4.5, -6, -4.5, L1); p.seg(-3.4, 0, -5.4, 2, L1); }
  }, { boil: 2 });
  def('ltw', 18, 44, p => {
    p.poly([[-5.4, 22], [-2.6, -12], [2.6, -12], [5.4, 22]], { tone: 0.1, hatch: SH('r', 0.5, 0.5, 1.1), w: 0.6 });
    for (let y = -6; y < 20; y += 8) { p.seg(-3, y, 3.6, y + 6, { w: 0.3, a: 0.7, passes: 1 }); p.seg(3, y, -3.6, y + 6, { w: 0.3, a: 0.7, passes: 1 }); }
    p.seg(0, -12, 0, -19, { w: 0.6, a: 1, passes: 1 }); p.ell(0, -19.4, 1.9, 1.9, { tone: 0.6, w: 0.4 });
  });
  def('spark', 16, 16, (p, i) => {
    for (let k = 0; k < 5; k++) { const a = k * 1.2566 + i * 0.6, r0 = 2.6, r1 = 5 + (k % 2) * 2; p.seg(Math.cos(a) * r0, Math.sin(a) * r0, Math.cos(a) * r1, Math.sin(a) * r1, { w: 0.45, a: 0.9, passes: 1, noOver: true }); }
  }, { noFill: true, boil: 3, grain: 0.2 });
  DS.WARM.push('hut', 'basebld', 'flag');

  /* ───────── 땅 그리기: 400칸씩 잘라 연필로 그려 둔다 ───────── */
  DS.drawChunk = function (L, ci) {
    const x0 = ci * CHUNK, pen = new Pen(CHUNK, VH, DS.hash('chunk' + L.idx) + ci * 977, { origin: [-x0, 0] }), r = pen.rng, th = L.theme, sea = L.sea;
    const xa = Math.max(0, x0 - 6), xb = Math.min(L.len, x0 + CHUNK + 6), gy = L.gy, cy = L.cy;
    // 바다
    if (sea) {
      for (let x = xa; x < xb; x += 1) if (gy[x] > sea + 2 && r() < 0.34) { const y = sea + 2.5 + r() * (VH - sea - 3), l = 3 + r() * 7; pen.seg(x, y, x + l, y + (r() - 0.5) * 0.6, { w: 0.34, a: 0.3 + 0.3 * r(), passes: 1, noOver: true }); }
      let run = null; for (let x = xa; x <= xb; x += 3) { const wet = gy[x] > sea + 2; if (wet) { (run = run || []).push([x, sea + Math.sin(x * 0.21) * 0.9]); } if ((!wet || x + 3 > xb) && run) { if (run.length > 1) pen.line(run, { w: 0.6, a: 0.85, passes: 2 }); run = null; } }
    }
    // 땅
    const top = []; for (let x = xa; x <= xb; x += 1) top.push([x, Math.min(gy[x], VH + 8)]);
    const tone = th === 'cave' ? 0.1 : th === 'canyon' ? 0.07 : th === 'city' || th === 'fort' ? 0.04 : 0.03;
    pen.poly(top.concat([[xb, VH + 10], [xa, VH + 10]]), { tone: tone, line: false, step: 2 });
    // 바위·흙의 결
    for (let x = xa; x < xb; x += 1) {
      const y = gy[x]; if (y > VH) continue; const dy = Math.abs(gy[Math.min(L.len, x + 1)] - y);
      if (dy > 6) { continue; }
      const k = th === 'cave' ? 0.75 : th === 'canyon' ? 0.6 : th === 'jungle' ? 0.5 : 0.36;
      if (r() < k) { const l = (th === 'cave' || th === 'canyon' ? 7 : 4) + r() * (th === 'cave' || th === 'canyon' ? 13 : 7); pen.seg(x, y + 1.2, x - l * 0.5, y + 1.2 + l, { w: 0.32, a: 0.26 + 0.34 * r(), passes: 1, noOver: true }); }
      if (th === 'jungle' && r() < 0.3) pen.seg(x, y, x + (r() - 0.5) * 2.4, y - 1.6 - r() * 2.6, { w: 0.34, a: 0.75, passes: 1, noOver: true });
      if (th === 'desert' && r() < 0.03) pen.dot(x, y + 4 + r() * 14, 0.4, 0.5);
      if ((th === 'canyon' || th === 'cave') && r() < 0.012) { const l = 14 + r() * 26; pen.seg(x, y + 6 + r() * 10, x + l, y + 7 + r() * 14, { w: 0.3, a: 0.4, passes: 1 }); }
    }
    // 벼랑(수직 벽)의 세로 결
    for (let x = xa; x < xb; x += 1) { const a = gy[x], b2 = gy[Math.min(L.len, x + 1)]; if (Math.abs(a - b2) > 6 && Math.min(a, b2) < VH && th !== 'city') { const y0 = Math.min(a, b2), y1 = Math.min(VH, Math.max(a, b2)), d = a > b2 ? 1 : -1; for (let k = 1; k < 4; k++) pen.seg(x + d * k * 2.2, y0 + 2 + r() * 4, x + d * k * 2.2, Math.min(VH, y0 + (y1 - y0) * (0.5 + 0.5 * r())), { w: 0.3, a: 0.4, passes: 1 }); } }
    let run = null; for (let i = 0; i < top.length; i++) { const on = top[i][1] <= VH + 2; if (on) (run = run || []).push(top[i]); if ((!on || i === top.length - 1) && run) { if (run.length > 1) pen.line(run, { w: 0.8, a: 1, step: 1.6 }); run = null; } }
    // 천장
    let cr = null;
    for (let x = xa; x <= xb + 1; x += 1) {
      const has = x <= xb && cy[x] > -50;
      if (has) (cr = cr || []).push([x, cy[x]]);
      if (!has && cr) {
        if (cr.length > 2) {
          pen.poly(cr.concat([[cr[cr.length - 1][0], -12], [cr[0][0], -12]]), { tone: 0.12, line: false, step: 2, hatch: { ang: -0.9, gap: 2.1, a: 0.3 } });
          cr.forEach(q => { if (r() < 0.7) { const l = 6 + r() * 12; pen.seg(q[0], q[1] - 1.2, q[0] + l * 0.5, q[1] - 1.2 - l, { w: 0.32, a: 0.3 + 0.35 * r(), passes: 1, noOver: true }); } });
          pen.line(cr, { w: 0.8, a: 1, step: 1.6 });
        }
        cr = null;
      }
    }
    // 꾸밈: 건물 창·배
    L.deco.forEach(d => {
      if (d.x + d.w < xa - 4 || d.x > xb + 4) return;
      const rr = RNG(DS.hash('deco' + d.x));
      if (d.k === 'bld') {
        const base = 186, h = base - d.top;
        pen.poly([[d.x, d.top], [d.x + d.w, d.top], [d.x + d.w, base + 1], [d.x, base + 1]], { tone: 0.02, hatch: SH('r', 0.72, 0.4, 1.3), w: 0.8, a: 1 });
        pen.seg(d.x - 1.5, d.top, d.x + d.w + 1.5, d.top, { w: 0.9, a: 1, passes: 1 });
        const cols = Math.max(2, Math.floor((d.w - 8) / 11)), rows = Math.floor((h - 10) / 12), gx = (d.w - 8) / cols;
        for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const wx = d.x + 4 + gx * (i + 0.5), wy = d.top + 9 + j * 12; pen.rect(wx, wy, Math.min(6, gx - 3), 5.4, { tone: rr() < 0.3 ? 0.42 : 0.03, w: 0.4, a: 0.9, passes: 1 }); }
        pen.rect(d.x + d.w / 2, base - 5, 6, 10, { tone: 0.5, w: 0.45 });
      } else if (d.k === 'ship') {
        const yd = 175, x1 = d.x + d.w;
        pen.poly([[d.x - 16, yd + 1], [x1 + 10, yd + 1], [x1 + 2, VH + 6], [d.x - 4, VH + 6]], { tone: 0.1, hatch: SH('b', 0.3, 0.6, 1.1), w: 0.8, a: 1 });
        pen.seg(d.x - 18, yd, x1 + 12, yd, { w: 0.9, a: 1, passes: 1 });
        for (let x = d.x + 14; x < x1 - 6; x += 20) pen.ell(x, yd + 7.5, 1.9, 1.9, { tone: 0.45, w: 0.4 });
        pen.poly([[x1 - 40, yd], [x1 - 40, yd - 20], [x1 - 14, yd - 20], [x1 - 14, yd]], { tone: 0.06, hatch: SH('r', 0.6, 0.45, 1.2), w: 0.62 });
        pen.poly([[x1 - 34, yd - 20], [x1 - 34, yd - 30], [x1 - 20, yd - 30], [x1 - 20, yd - 20]], { tone: 0.16, w: 0.55 });
        pen.rect(x1 - 27, yd - 25.4, 9, 3.4, { tone: 0.45, w: 0.36 }); pen.seg(x1 - 27, yd - 30, x1 - 27, yd - 42, { w: 0.55, a: 1, passes: 1 }); pen.seg(x1 - 31, yd - 38, x1 - 23, yd - 38, L1);
        for (let x = d.x - 10; x < x1 - 44; x += 9) { pen.seg(x, yd, x, yd - 4.4, { w: 0.34, a: 0.8, passes: 1, noOver: true }); } pen.seg(d.x - 12, yd - 4.4, x1 - 42, yd - 4.4, { w: 0.34, a: 0.8, passes: 1 });
      }
    });
    return pen.done(0.36);
  };

  /* 먼 배경: 800칸마다 되풀이되는 흐린 윤곽 */
  DS.FARW = 800;
  DS.drawFar = function (L) {
    const FW = DS.FARW, pen = new Pen(FW, VH, DS.hash('far' + L.idx), { origin: [0, 0], noFill: true }), r = pen.rng, th = L.theme, o = { w: 0.45, a: 0.34, passes: 1, step: 2.4 };
    const wave = (base, amp, k1, k2, k3) => { const pts = []; for (let x = -4; x <= FW + 4; x += 4) { const t = x / FW * 6.2832; pts.push([x, base + amp * (Math.sin(t * k1 + 1) * 0.6 + Math.sin(t * k2 + 2.3) * 0.3 + Math.sin(t * k3) * 0.1)]); } return pts; };
    if (th === 'city' || th === 'fort') {      // 모눈
      for (let x = 0; x <= FW; x += 20) pen.seg(x, 0, x, VH, { w: 0.26, a: x % 100 ? 0.11 : 0.2, passes: 1, noOver: true, jit: 0.12 });
      for (let y = 5; y <= VH; y += 20) pen.seg(0, y, FW, y, { w: 0.26, a: (y - 5) % 100 ? 0.11 : 0.2, passes: 1, noOver: true, jit: 0.12 });
    }
    if (th === 'desert') { pen.line(wave(150, 14, 2, 5, 9), o); pen.line(wave(166, 8, 3, 7, 13), Object.assign({}, o, { a: 0.26 })); pen.ell(640, 34, 11, 11, { paper: false, w: 0.45, a: 0.4, passes: 1 }); for (let i = 0; i < 8; i++) { const a = i * 0.7854; pen.seg(640 + Math.cos(a) * 15, 34 + Math.sin(a) * 15, 640 + Math.cos(a) * 20, 34 + Math.sin(a) * 20, { w: 0.4, a: 0.36, passes: 1 }); } }
    else if (th === 'sea') { pen.seg(0, 168, FW, 168, { w: 0.4, a: 0.3, passes: 1, noOver: true }); for (let i = 0; i < 30; i++) { const x = r() * FW, y = 171 + r() * 16; pen.seg(x, y, x + 6 + r() * 12, y, { w: 0.3, a: 0.2, passes: 1 }); } for (let i = 0; i < 7; i++) { const x = (i + r() * 0.6) * FW / 7, y = 18 + r() * 34, n = 12, pts = []; for (let k = 0; k < n; k++) { const a = k / n * 6.2832; pts.push([x + Math.cos(a) * (34 + r() * 14), y + Math.sin(a) * (9 + r() * 5)]); } pen.poly(pts, { paper: false, s: true, w: 0.4, a: 0.3, hatch: { ang: 0.2, gap: 1.9, a: 0.2 } }); } }
    else if (th === 'jungle') { const pts = wave(150, 9, 3, 8, 17); pen.line(pts, o); for (let x = 6; x < FW; x += 9 + r() * 8) { const y = 150 + 9 * (Math.sin(x / FW * 6.2832 * 3 + 1) * 0.6) - 4; pen.scribble(x, y - 4 - r() * 6, 5 + r() * 4, { turns: 1.4, w: 0.3, a: 0.24 }); } }
    else if (th === 'canyon') { for (let k = 0; k < 2; k++) { const pts = []; let y = 120 + k * 26; for (let x = -4; x <= FW + 4;) { const w2 = 30 + r() * 50; pts.push([x, y]); pts.push([x + w2, y]); x += w2; y = 96 + k * 30 + r() * 44; } pts[pts.length - 1][1] = pts[0][1]; pen.line(pts, Object.assign({}, o, { a: k ? 0.24 : 0.34 })); } }
    else if (th === 'cave') { for (let i = 0; i < 60; i++) { const x = r() * FW, y = 30 + r() * 150, l = 8 + r() * 22; pen.seg(x, y, x + l * 0.5, y + l, { w: 0.3, a: 0.13, passes: 1 }); } }
    if (th === 'city' || th === 'fort') { const pts = [[-4, 160]]; let x = 0; while (x < FW) { const w2 = 26 + r() * 40, h = 112 + r() * 44; pts.push([x, h]); pts.push([Math.min(FW, x + w2), h]); x += w2 + 4; } pts.push([FW + 4, 160]); pen.line(pts, Object.assign({}, o, { a: 0.26 })); }
    return pen.done(0.3);
  };
})();
