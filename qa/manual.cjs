// 손 조작 확인: 키를 누르고 정해진 걸음만큼 돌린다
const { chromium } = require('/home/user/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const pg = await b.newPage({ viewport: { width: 1280, height: 860 } });
  const errs = []; pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); pg.on('pageerror', e => errs.push('PAGE ' + e.message + (e.stack || '').split('\n').slice(0, 3).join(' | ')));
  await pg.goto('file://' + path.join(__dirname, '..', 'dist', 'index.html') + '?stage=1');
  await pg.waitForFunction(() => document.body.classList.contains('ready'), null, { timeout: 60000 });
  const adv = n => pg.evaluate(n => window.advanceTime(n * 1000 / 60), n);
  const T = async () => JSON.parse(await pg.evaluate(() => window.render_game_to_text()));
  const G = async () => (await T()).game;
  const shot = async n => { const d = await pg.evaluate(() => document.querySelector('#game').toDataURL('image/png')); fs.writeFileSync(path.join(__dirname, 'tmp', 'm-' + n + '.png'), Buffer.from(d.split(',')[1], 'base64')); };
  const hold = async (k, n) => { await pg.keyboard.down(k); await adv(n); await pg.keyboard.up(k); await adv(1); };
  const ok = (c, m) => console.log((c ? 'OK  ' : 'FAIL') + ' ' + m);
  await adv(1);
  await pg.click('#run'); await adv(30);
  let g = await G(); ok(g.mode === 'brief', '출전 직후 brief: ' + g.mode); await shot('brief');
  await hold('KeyX', 2); await adv(5); g = await G(); ok(g.mode === 'play', 'X로 시작: ' + g.mode);
  ok(g.heli.face === -1 && g.heli.landed, '기지(오른쪽)에서 왼쪽을 보고 앉아 있음');
  // 떠오르기
  await hold('ArrowUp', 50); g = await G(); ok(!g.heli.landed && g.heli.y < 150, '위로: y=' + g.heli.y);
  // 톡: 왼쪽 → 정면 → 오른쪽
  await hold('ArrowRight', 4); await adv(14); g = await G(); ok(g.heli.face === 0, '오른쪽 톡 → 정면: ' + g.heli.face); await shot('front');
  // 정면에서 A: 아래로 떨어지는 탄
  await hold('KeyX', 2); g = await G(); ok(g.shots === 1, '정면 기관포 한 발: ' + g.shots); await adv(8); await shot('drop');
  await hold('ArrowRight', 4); await adv(14); g = await G(); ok(g.heli.face === 1, '오른쪽 톡 → 오른쪽: ' + g.heli.face);
  await hold('ArrowLeft', 4); await adv(14); await hold('ArrowLeft', 4); await adv(14); g = await G(); ok(g.heli.face === -1, '왼쪽 톡 두 번 → 왼쪽: ' + g.heli.face);
  // 오래 누르기: 기수는 그대로, 뒤로 난다
  const x0 = g.heli.x; await hold('ArrowRight', 40); g = await G(); ok(g.heli.face === -1 && g.heli.x > x0 + 10, '오른쪽 오래 → 뒤로 날기(기수 유지): face ' + g.heli.face + ' dx ' + (g.heli.x - x0).toFixed(1));
  await adv(60); g = await G(); ok(Math.abs(g.heli.vx) < 0.05, '떼면 미끄러지다 멈춤: vx ' + g.heli.vx);
  // 왼쪽으로 날며 기관포
  await pg.keyboard.down('ArrowLeft'); await adv(60); await pg.keyboard.down('KeyX'); await adv(20); g = await G(); ok(g.shots >= 1 && g.shots <= 3, '옆 기관포(화면에 최대 3발): ' + g.shots); await shot('gun'); await pg.keyboard.up('KeyX');
  await adv(120); await pg.keyboard.up('ArrowLeft'); g = await G(); ok(g.heli.vx <= -1.75 && g.heli.vx >= -1.77, '기수가 보는 쪽 최고 속도 1.76: ' + g.heli.vx);
  // 보조 무기
  await hold('KeyZ', 2); g = await G(); ok(g.weapons.B === 2, 'Z 폭탄: 남은 ' + g.weapons.B);
  await hold('KeyC', 2); g = await G(); ok(g.weapon === 'B', 'C 바꾸기(다른 무기 없으면 그대로): ' + g.weapon);
  // Enter 메뉴
  await pg.keyboard.press('Enter'); await adv(3); let t = await T(); ok(t.paused && t.menu, 'Enter 메뉴: ' + JSON.stringify(t.menu)); await pg.screenshot({ path: path.join(__dirname, 'tmp', 'm-menu.png') });
  const xx = t.game.heli.x; await adv(30); t = await T(); ok(t.game.heli.x === xx, '메뉴 동안 멈춤');
  await pg.keyboard.press('Enter'); await adv(3); t = await T(); ok(!t.paused, '계속 간다');
  await pg.evaluate(() => { window.__donghyunchop.A.g.god = true; });
  // 첫 막사 옆에 내리기: 막사 x=1900, 오른쪽 44칸
  for (let i = 0; i < 2000; i++) { g = await G(); if (g.heli.x < 1975) break; await pg.keyboard.down('ArrowLeft'); await adv(6); }
  await pg.keyboard.up('ArrowLeft'); await adv(40);
  for (let i = 0; i < 300; i++) { g = await G(); if (Math.abs(g.heli.x - 1945) < 3 && Math.abs(g.heli.vx) < 0.2) break; const k = g.heli.x > 1945 ? 'ArrowLeft' : 'ArrowRight'; if (Math.abs(g.heli.x - 1945) > 14) { await pg.keyboard.down(k); await adv(12); await pg.keyboard.up(k); } await adv(20); }
  g = await G(); console.log('  자리', g.heli.x, g.heli.y, 'face', g.heli.face, 'dmg', g.heli.damage);
  await pg.keyboard.down('ArrowDown'); for (let i = 0; i < 60; i++) { await adv(5); g = await G(); if (g.heli.landed || g.heli.dead) break; } await pg.keyboard.up('ArrowDown');
  ok(g.heli.landed, '막사 옆 착륙: y ' + g.heli.y + ' dmg ' + g.heli.damage); await adv(60); await shot('land');
  for (let i = 0; i < 80; i++) { await adv(15); g = await G(); if (g.aboard >= 4) break; }
  ok(g.aboard === 4, '네 명 탑승: ' + g.aboard + ' (희생 ' + g.lost + ')'); await shot('board');
  // 정원 넘겨 태우지 않는지, 떠서 기지로
  await pg.keyboard.down('ArrowUp'); await adv(45); await pg.keyboard.up('ArrowUp');
  for (let i = 0; i < 400; i++) { g = await G(); if (g.heli.x > 2770) break; await pg.keyboard.down('ArrowRight'); await adv(6); }
  await pg.keyboard.up('ArrowRight'); await adv(50); g = await G(); ok(g.heli.face === -1, '기지까지 뒤로 날아옴(기수 왼쪽 유지): x ' + g.heli.x);
  for (let i = 0; i < 300; i++) { g = await G(); if (Math.abs(g.heli.x - 2800) < 8 && Math.abs(g.heli.vx) < 0.2) break; const k = g.heli.x > 2800 ? 'ArrowLeft' : 'ArrowRight'; if (Math.abs(g.heli.x - 2800) > 12) { await pg.keyboard.down(k); await adv(12); await pg.keyboard.up(k); } await adv(20); }
  await pg.keyboard.down('ArrowDown'); for (let i = 0; i < 60; i++) { await adv(5); g = await G(); if (g.heli.landed) break; } await pg.keyboard.up('ArrowDown');
  ok(g.heli.landed, '기지 착륙: x ' + g.heli.x); for (let i = 0; i < 80; i++) { await adv(15); g = await G(); if (g.saved >= 4) break; }
  ok(g.saved === 4 && g.aboard === 0 && g.score >= 80, '네 명 구출: saved ' + g.saved + ' score ' + g.score); await shot('unload');
  // 추락과 게임 오버 메뉴
  await pg.evaluate(() => { const A = window.__donghyunchop.A; A.g.god = false; A.g.lives = 1; A.g.pl.dmg = 99; A.g.pl.inv = 0; A.g.damage(5); });
  for (let i = 0; i < 60; i++) { await adv(15); g = await G(); if (g.mode === 'over') break; }
  ok(g.mode === 'over', '헬기 0 → 게임 오버: ' + g.mode + ' / ' + g.why); await adv(60); await shot('over');
  await pg.screenshot({ path: path.join(__dirname, 'tmp', 'm-overpage.png') }); await hold('KeyX', 2); await adv(5); g = await G(); ok(g.mode === 'brief' || g.mode === 'play', '이어 하기 → ' + g.mode + ' lives ' + g.lives + ' score ' + g.score);
  // 클리어 카드와 종이 넘김
  await adv(30); await hold('KeyX', 2); await adv(10);
  await pg.evaluate(() => { const g = window.__donghyunchop.A.g; g.saved = g.need; g.hs.forEach(h => { if (h.st !== 'gone') h.st = 'gone'; }); g.huts.forEach(h => h.n = 0); });
  for (let i = 0; i < 60; i++) { await adv(15); g = await G(); if (g.mode === 'clear') break; }
  ok(g.mode === 'clear', '클리어: ' + g.mode); await adv(170); await shot('clear');
  await hold('KeyX', 2); await adv(8); await shot('turn'); await adv(120); g = await G(); ok(g.stage === 2, '다음 스테이지: ' + g.stage + ' ' + g.mode); await shot('brief2');
  console.log('  ', JSON.stringify(g.heli), 'lives', g.lives, 'why', g.why);
  console.log('errors', errs.length, errs.slice(0, 6).join('\n'));
  await b.close();
})();
