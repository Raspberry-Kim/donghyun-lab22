/* 가로 최고 속도: 기수가 보는 쪽으로 날 때 1.76, 뒤로 날 때와 정면을 보고 옆으로 갈 때 1.6 */
const PW = require('/home/user/node_modules/playwright'), chromium = PW[process.env.BROWSER || 'chromium'];
const path = require('path');
const URL0 = process.env.URL || 'file://' + path.join(__dirname, '..', 'dist', 'index.html');
let fails = 0; const ok = (c, m, x) => { if (!c) fails++; console.log((c ? 'ok   ' : 'FAIL ') + m + (x !== undefined ? ' ' + JSON.stringify(x) : '')); };
(async () => {
  const b = await chromium.launch(process.env.BROWSER && process.env.BROWSER !== 'chromium' ? {} : { args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const pg = await (await b.newContext({ viewport: { width: 1280, height: 860 } })).newPage();
  const errs = []; pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); pg.on('pageerror', e => errs.push('PAGE ' + e.message));
  await pg.goto(URL0); await pg.waitForFunction(() => document.body.classList.contains('ready'), null, { timeout: 60000 });
  const r = await pg.evaluate(() => {
    const DS = window.DS, K = DS.K, r4 = v => Math.round(v * 1e4) / 1e4;
    /* 빈 하늘에 헬기를 띄우고 조종만 걸음마다 돌린다 */
    const fresh = face => { const g = new DS.Game({ stage: 0, lives: 3, cap: 10, god: true }); g.mode = 'play'; const p = g.pl; p.x = g.L.len / 2; p.y = 30; p.vx = 0; p.vy = 0; p.landed = false; p.face = face; p.from = face; p.turn = 0; p.pend = 0; p.hold = { l: 0, r: 0 }; return g; };
    const run = (g, key, n) => { const p = g.pl, o = { top: 0, maxStep: 0, reach: 0 }; for (let i = 1; i <= n; i++) { const v0 = p.vx; g.ctrl(key ? { [key]: true } : {}); o.maxStep = Math.max(o.maxStep, Math.abs(p.vx - v0)); if (Math.abs(p.vx) > o.top + 1e-9) { o.top = Math.abs(p.vx); o.reach = i; } } o.v = r4(p.vx); o.top = r4(o.top); o.maxStep = r4(o.maxStep); return o; };
    const out = { K: { VX: K.VX, VF: K.VF, AX: K.AX, FX: K.FX }, cases: [] };
    for (const face of [-1, 0, 1]) for (const key of ['l', 'r']) {
      const g = fresh(face), p = g.pl, x0 = p.x, a = run(g, key, 240), dx = p.x - x0, x1 = p.x; let n = 0; while (Math.abs(p.vx) > 1e-9 && n < 200) { g.ctrl({}); n++; }
      out.cases.push({ face, key, v: a.v, reach: a.reach, dist240: r4(dx), slideSteps: n, slide: r4(Math.abs(p.x - x1)), rot: r4(p.rot), y: p.y });
    }
    /* 앞으로 가장 빠를 때 기수를 정면으로 돌리며 계속 누른다: 한계가 낮아져도 한 걸음에 마찰보다 많이 줄지 않는다 */
    { const g = fresh(1), p = g.pl; run(g, 'r', 240); const v0 = p.vx; g.turnTo(-1); const a = run(g, 'r', 30); out.turn = { before: r4(v0), face: p.face, after: a.v, maxStep: a.maxStep }; }
    /* 뒤로 가장 빠를 때 기수를 돌려 앞이 되면 1.76까지 더 붙는다 */
    { const g = fresh(-1), p = g.pl; run(g, 'r', 240); const v0 = p.vx; g.turnTo(1); g.pl.turn = 0; g.turnTo(1); const a = run(g, 'r', 60); out.flip = { before: r4(v0), face: p.face, after: a.v }; }
    /* 가장 숙였을 때 탄의 각도는 그대로(0.6라디안) */
    { const g = fresh(1), p = g.pl; for (let i = 0; i < 300; i++) g.ctrl({ r: true, d: i > 200 && p.y < 60 }); p.rot = 0; for (let i = 0; i < 200; i++) g.ctrl({ r: true }); out.rotFwd = r4(p.rot); p.cool = 0; g.shots.length = 0; g.ctrl({ r: true, a: true }); const s = g.shots[0]; out.shot = s ? { ang: r4(Math.atan2(s.vy, s.vx)), sp: r4(Math.hypot(s.vx, s.vy)) } : null; }
    return out;
  });
  console.log(JSON.stringify(r.K));
  const by = (f, k) => r.cases.find(c => c.face === f && c.key === k);
  r.cases.forEach(c => console.log('     기수 ' + c.face + ' · ' + (c.key === 'l' ? '←' : '→') + ': 속도 ' + c.v + ', ' + c.reach + '걸음에 닿음, 240걸음에 ' + c.dist240 + '칸, 떼고 ' + c.slideSteps + '걸음 ' + c.slide + '칸 미끄러짐'));
  ok(r.K.VX === 1.6 && Math.abs(r.K.VF / r.K.VX - 1.10) < 1e-9, '상수: 앞 1.76 = 1.6 × 1.10');
  ok(by(1, 'r').v === 1.76 && by(-1, 'l').v === -1.76, '기수가 보는 쪽으로: 1.76', [by(1, 'r').v, by(-1, 'l').v]);
  ok(by(1, 'l').v === -1.6 && by(-1, 'r').v === 1.6, '뒤로: 1.6 그대로', [by(1, 'l').v, by(-1, 'r').v]);
  ok(by(0, 'l').v === -1.6 && by(0, 'r').v === 1.6, '정면을 보고 옆으로: 1.6 그대로', [by(0, 'l').v, by(0, 'r').v]);
  ok(by(1, 'r').reach === 32 && by(-1, 'r').reach === 30 && by(0, 'r').reach === 30, '닿는 걸음 수: 앞 32, 뒤·옆 30', [by(1, 'r').reach, by(-1, 'r').reach, by(0, 'r').reach]);
  ok(by(1, 'r').dist240 === -by(-1, 'l').dist240 && by(1, 'l').dist240 === -by(-1, 'r').dist240 && by(0, 'l').dist240 === -by(0, 'r').dist240, '좌우 대칭');
  ok(by(-1, 'r').dist240 === by(0, 'r').dist240, '뒤로와 옆으로는 같은 거리');
  ok(r.turn.before === 1.76 && r.turn.face === 0 && r.turn.after === 1.6 && r.turn.maxStep <= r.K.FX + 1e-9, '앞으로 날다 기수를 정면으로: 마찰만큼씩 1.6으로', r.turn);
  ok(r.flip.before === 1.6 && r.flip.face === 1 && r.flip.after === 1.76, '뒤로 날다 기수를 돌리면: 1.76까지', r.flip);
  ok(Math.abs(r.rotFwd - 0.2) < 0.002, '앞으로 가장 빠를 때 기울기 0.2 그대로', r.rotFwd);
  ok(r.shot && Math.abs(r.shot.ang - 0.3) < 0.003 && Math.abs(r.shot.sp - 5) < 1e-6, '그때 탄의 각도 0.3라디안·빠르기 5 그대로', r.shot);
  ok(errs.length === 0, '콘솔 오류 0', errs.slice(0, 3));
  console.log(fails ? '속도 검사 실패 ' + fails : '속도 검사 통과');
  await b.close(); process.exit(fails ? 1 : 0);
})();
