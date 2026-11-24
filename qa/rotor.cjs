/* 헬기 날개 소리: 플레이 중에만 울리고, 세기는 구한 사람이 집에 들어갈 때 나는 소리(medal)와 견줄 만하다 */
const PW = require('/home/user/node_modules/playwright'), chromium = PW[process.env.BROWSER || 'chromium'];
const path = require('path');
const URL0 = process.env.URL || 'file://' + path.join(__dirname, '..', 'dist', 'index.html');
let fails = 0; const ok = (c, m, x) => { if (!c) fails++; console.log((c ? 'ok   ' : 'FAIL ') + m + (x !== undefined ? ' ' + JSON.stringify(x) : '')); };
(async () => {
  const b = await chromium.launch(process.env.BROWSER && process.env.BROWSER !== 'chromium' ? {} : { args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const pg = await (await b.newContext({ viewport: { width: 1280, height: 860 } })).newPage();
  const errs = []; pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); pg.on('pageerror', e => errs.push('PAGE ' + e.message));
  /* 스피커로 가는 소리를 옆으로 따서 잰다(페이지 코드는 건드리지 않는다) */
  await pg.addInitScript(() => {
    const c0 = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function (d) {
      if (d instanceof AudioDestinationNode) { const ac = this.context; if (!window.__tap) { const an = ac.createAnalyser(); an.fftSize = 2048; window.__tap = an; } c0.call(this, window.__tap); }
      return c0.apply(this, arguments);
    };
    window.__measure = ms => new Promise(res => {
      const an = window.__tap; if (!an) return res({ peak: 0, rms: 0, n: 0 });
      const buf = new Float32Array(an.fftSize), t0 = performance.now(); let peak = 0, sq = 0, n = 0;
      const id = setInterval(() => { an.getFloatTimeDomainData(buf); for (let i = 0; i < buf.length; i++) { const v = Math.abs(buf[i]); if (v > peak) peak = v; sq += v * v; n++; } if (performance.now() - t0 >= ms) { clearInterval(id); res({ peak: +peak.toFixed(4), rms: +Math.sqrt(sq / n).toFixed(4), n }); } }, 20);
    });
  });
  await pg.goto(URL0 + (URL0.includes('?') ? '&' : '?') + 'god=1'); await pg.waitForFunction(() => document.body.classList.contains('ready'), null, { timeout: 60000 });
  const S = () => pg.evaluate(() => DS.Sfx.rotorState), M = ms => pg.evaluate(ms => window.__measure(ms), ms), adv = ms => pg.evaluate(ms => window.advanceTime(ms), ms);
  const wait = ms => pg.waitForTimeout(ms);
  ok(!(await S()).on, '출전 준비 화면: 날개 소리 없음', await S());
  await pg.click('#run'); await adv(700); await wait(200);
  let st = JSON.parse(await pg.evaluate(() => window.render_game_to_text()));
  ok(st.screen === 'game' && st.game.mode === 'brief' && !(await S()).on, '안내 카드: 날개 소리 없음', [st.game.mode, await S()]);
  await pg.keyboard.down('KeyX'); await adv(60); await pg.keyboard.up('KeyX'); await adv(100); await wait(400);
  st = JSON.parse(await pg.evaluate(() => window.render_game_to_text()));
  const ready = await pg.evaluate(() => DS.Sfx.ready);
  ok(ready, '소리 장치가 돌고 있음');
  let s = await S(); ok(st.game.mode === 'play' && s.on && Math.abs(s.rate - 0.72) < 1e-6 && Math.abs(s.lvl - 0.6) < 1e-6, '기지에 앉아 있을 때: 느리고 작게', s);
  const idle = await M(900);
  /* 띄운다 */
  await pg.keyboard.down('ArrowUp'); await adv(900); await pg.keyboard.up('ArrowUp'); await adv(400); await wait(500);
  s = await S(); ok(s.on && Math.abs(s.rate - 1) < 0.06 && s.lvl === 1, '떠 있을 때: 보통 빠르기', s);
  const hover = await M(1200);
  await pg.keyboard.down('ArrowRight'); await adv(800); await wait(400);
  s = await S(); ok(s.on && s.rate > 1.07 && s.rate <= 1.16, '빨리 날 때: 조금 더 빠르게', s);
  const fly = await M(1200); await pg.keyboard.up('ArrowRight');
  /* 멈춤 메뉴 */
  await pg.keyboard.press('Enter'); await adv(60); await wait(500);
  st = JSON.parse(await pg.evaluate(() => window.render_game_to_text())); s = await S();
  ok(st.paused && !s.on, '멈춤 메뉴: 날개 소리 꺼짐', s);
  const quiet = await M(500);
  ok(quiet.peak < 0.004, '멈춤 메뉴에서 실제로 조용함', quiet);
  await pg.evaluate(() => DS.Sfx.play('medal')); const medal = await M(350);
  await pg.evaluate(() => window.__donghyunchop.closeMenu()); await adv(60); await wait(400);
  s = await S(); ok(s.on, '메뉴를 닫으면 다시 울림', s);
  /* 소리 끄기 */
  await pg.keyboard.press('KeyM'); await adv(30); await wait(300); s = await S(); const mu = await M(400);
  ok(!s.on && mu.peak < 0.004, 'M으로 소리를 끄면 날개 소리도 꺼짐', [s, mu]);
  await pg.keyboard.press('KeyM'); await adv(30); await wait(400); s = await S(); ok(s.on, '다시 켜면 울림', s);
  /* 추락 */
  await pg.evaluate(() => { const g = window.__donghyunchop.A.g; g.god = false; g.pl.inv = 0; g.pl.shield = 0; g.pl.y = 40; g.kill ? g.kill() : g.damage(999); });
  await adv(250); await wait(200); s = await S(); const dead1 = await pg.evaluate(() => { const p = window.__donghyunchop.A.g.pl; return [p.dead, !!p.boomed]; });
  ok(dead1[0] > 0 && !dead1[1] ? (s.on && s.rate < 0.95 && s.lvl === 0.7) : true, '추락하는 동안: 느려짐', [dead1, s]);
  await adv(2600); await wait(250); s = await S(); const dead2 = await pg.evaluate(() => { const g = window.__donghyunchop.A.g, p = g.pl; return [p.dead, !!p.boomed, g.mode, p.landed]; });
  console.log('     추락 뒤', JSON.stringify(dead2), JSON.stringify(s));
  /* 세기 */
  console.log('     세기(스피커 직전) medal', JSON.stringify(medal), '· 앉음', JSON.stringify(idle), '· 떠 있음', JSON.stringify(hover), '· 빨리', JSON.stringify(fly));
  ok(medal.peak > 0.02, 'medal 소리가 잡힘', medal);
  ok(fly.peak <= medal.peak * 1.25 && fly.peak >= medal.peak * 0.6, '날개 소리의 가장 큰 순간이 medal의 0.6~1.25배', [fly.peak, medal.peak, +(fly.peak / medal.peak).toFixed(2)]);
  ok(hover.peak <= medal.peak * 1.25 && idle.peak < hover.peak, '앉아 있을 때가 떠 있을 때보다 작음', [idle.peak, hover.peak]);
  ok(errs.length === 0, '콘솔 오류 0', errs.slice(0, 3));
  console.log(fails ? '날개 소리 검사 실패 ' + fails : '날개 소리 검사 통과');
  await b.close(); process.exit(fails ? 1 : 0);
})();
