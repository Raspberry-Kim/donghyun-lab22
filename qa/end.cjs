const { chromium } = require('/home/user/node_modules/playwright');
const path = require('path');
const url = 'file://' + path.join(__dirname, '..', 'dist', 'index.html'), out = n => path.join(__dirname, 'tmp', n);
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p2 = await b.newPage({ viewport: { width: 1280, height: 900 } }); p2.on('pageerror', e => console.log('PAGE', e.message));
  await p2.goto(url + '?stage=7&god=1'); await p2.waitForFunction(() => document.body.classList.contains('ready'), null, { timeout: 60000 });
  const st = async m => { const t = JSON.parse(await p2.evaluate(() => window.render_game_to_text())); console.log(m, t.screen, t.game && [t.game.stage, t.game.mode, t.game.saved, t.game.need].join(' '), 'petals', t.petals, JSON.stringify(t.cfg)); };
  await st('ready'); await p2.selectOption('#example', { index: 7 }); await p2.waitForTimeout(500); await p2.click('#run'); await p2.evaluate(() => window.advanceTime(700)); await st('run');
  await p2.keyboard.down('KeyX'); await p2.evaluate(() => window.advanceTime(60)); await p2.keyboard.up('KeyX'); await st('X');
  await p2.evaluate(() => { const g = window.__donghyunchop.A.g; g.saved = g.need + 2; g.score = 12220; g.hs.forEach(h => { h.st = 'gone'; }); g.huts.forEach(h => h.n = 0); window.advanceTime(4000); }); await st('clear?');
  await p2.keyboard.down('KeyX'); await p2.evaluate(() => window.advanceTime(60)); await p2.keyboard.up('KeyX'); await st('X2'); await p2.evaluate(() => window.advanceTime(3000)); await st('end');
  await p2.evaluate(() => document.querySelector('#board-wrap').scrollIntoView({ block: 'center' })); await p2.waitForTimeout(1500); const bb = await (await p2.$('#game')).boundingBox(); await p2.screenshot({ path: out('s-ending.png'), clip: bb });
  await b.close();
})();
