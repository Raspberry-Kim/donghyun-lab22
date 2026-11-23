// 자동 조종으로 스테이지를 끝까지: node qa/auto.cjs <시작 스테이지> <끝 스테이지> [화면을 남길 간격(초)]
const { chromium } = require('/home/user/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const s0 = +process.argv[2] || 1, s1 = +process.argv[3] || s0, shotEvery = +process.argv[4] || 0;
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const pg = await b.newPage({ viewport: { width: 1280, height: 860 } });
  const errs = []; pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); pg.on('pageerror', e => errs.push('PAGE ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  await pg.goto('file://' + path.join(__dirname, '..', 'dist', 'index.html') + '?auto=1&stage=' + s0 + (process.argv[5] || ''));
  await pg.waitForFunction(() => window.DS && DS.app.scr === 'game', null, { timeout: 90000 });
  await pg.evaluate(() => window.advanceTime(16));
  let last = '', sec = 0, stuck = 0, lastX = 0;
  for (let i = 0; i < 1500; i++) {
    const st = await pg.evaluate(() => { window.advanceTime(2000); const t = JSON.parse(window.render_game_to_text()); return t; });
    sec += 2; const g = st.game; if (!g) { console.log('끝: 화면', st.screen); break; }
    const key = g.stage + ':' + g.mode + ':' + g.saved + ':' + g.aboard;
    if (key !== last) { console.log(sec + 's', 'st' + g.stage, g.mode, 'x', g.heli.x, 'y', g.heli.y, 'saved', g.saved + '/' + g.need, 'aboard', g.aboard, 'lost', g.lost, 'dmg', g.heli.damage, 'lives', g.lives); last = key; stuck = 0; }
    else if (++stuck > 60) { console.log('멈춤?', sec + 's', JSON.stringify(g.heli), 'waiting', g.waiting, JSON.stringify(g.huts)); const d = await pg.evaluate(() => document.querySelector('#game').toDataURL('image/png')); fs.writeFileSync(path.join(__dirname, 'tmp', 'stuck-' + g.stage + '.png'), Buffer.from(d.split(',')[1], 'base64')); break; }
    if (shotEvery && sec % shotEvery === 0) { const d = await pg.evaluate(() => document.querySelector('#game').toDataURL('image/png')); fs.writeFileSync(path.join(__dirname, 'tmp', `auto-${g.stage}-${String(sec).padStart(4, '0')}.png`), Buffer.from(d.split(',')[1], 'base64')); }
    if (g.mode === 'ending' || g.stage > s1) { console.log('완주', sec + 's', 'score', g.score, 'sum', JSON.stringify(st.sum), 'petals', st.petals); break; }
  }
  console.log('errors', errs.length, errs.slice(0, 6).join('\n'));
  await b.close();
})();
