/* 저장·불러오기: ① 엔진 왕복(저장 → 불러오기 뒤에도 판이 똑같이 흘러가는지) ② 화면 흐름(칸 저장 · 새로 고침 뒤 불러오기 · 파일 왕복 · 틀린 파일 거부) */
const PW = require('/home/user/node_modules/playwright'), chromium = PW[process.env.BROWSER || 'chromium'];
const path = require('path'), fs = require('fs');
const URL0 = process.env.URL || 'file://' + path.join(__dirname, '..', 'dist', 'index.html');
let fails = 0; const ok = (c, m, x) => { if (!c) fails++; console.log((c ? 'ok   ' : 'FAIL ') + m + (x !== undefined ? ' ' + JSON.stringify(x) : '')); };
(async () => {
  const b = await chromium.launch(process.env.BROWSER && process.env.BROWSER !== 'chromium' ? {} : { args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const cx = await b.newContext({ viewport: { width: 1280, height: 860 }, acceptDownloads: true });
  const pg = await cx.newPage();
  const errs = []; pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); pg.on('pageerror', e => errs.push('PAGE ' + e.message));
  const open = async q => { await pg.goto(URL0 + (q || '')); await pg.waitForFunction(() => document.body.classList.contains('ready'), null, { timeout: 60000 }); };
  const st = () => pg.evaluate(() => JSON.parse(window.render_game_to_text()));
  const adv = ms => pg.evaluate(ms => window.advanceTime(ms), ms);
  await open('');

  /* ① 엔진 왕복: 일곱 스테이지 × 무적 켬·끔, 여러 시점에서 저장하고 원본과 복원본을 600걸음 나란히 돌린다 */
  const r = await pg.evaluate(() => {
    const DS = window.DS, auto = window.__donghyunchop.autoPilot, N = DS.STAGES.length;
    /* 자동 조종에 기관포·보조 무기·무기 바꾸기를 더한다. 판 상태만 보고 정하므로 원본과 복원본이 같은 입력을 받는다 */
    const pilot = g => { const o = auto(g), p = g.pl; if (g.mode === 'play' && !p.dead) { const clear = !p.landed && !g.hs.some(h => (h.st === 'wave' || h.st === 'go' || h.st === 'base') && Math.abs(h.x - p.x) < 90) && !g.huts.some(h => Math.abs(h.x - p.x) < 70) && Math.abs(p.x - g.base.x) > 120; o.a = clear; o.aEdge = clear && g.t % 8 === 0; o.bEdge = clear && g.t % 170 === 60; o.selEdge = g.t % 410 === 200; } return o; };
    const one = q => { if (q.mode === 'next') { if (q.stage < N - 1) q.startStage(q.stage + 1); else return false; } else if (q.mode === 'over') q.cont(); q.update(pilot(q)); return true; };
    const out = { checks: 0, fails: [], saw: { trees: 0, fallen: 0, jets: 0, shots: 0, bullets: 0, aboard: 0, walkers: 0, dying: 0, items: 0, msg: 0, conts: 0, later: 0, bomb: 0, mis: 0, shield: 0, turning: 0 }, bytes: 0 };
    for (let stage = 0; stage < N; stage++) for (const god of [true, false]) {
      const g = new DS.Game({ stage, lives: god ? 3 : 2, cap: god ? 10 : 6, god });
      const trees0 = g.en.filter(e => e.k === 'tree').length;
      for (let seg = 0; seg < 12; seg++) {
        let live = true; for (let i = 0; i < 397 + seg * 61 && live; i++) live = one(g);
        if (!live) break; if (g.mode !== 'play') continue;
        const data = g.save(), txt = JSON.stringify(data); out.bytes = Math.max(out.bytes, txt.length);
        const s = out.saw; s.trees += g.en.some(e => e.k === 'tree') ? 1 : 0; s.fallen += g.en.filter(e => e.k === 'tree').length < trees0 ? 1 : 0; s.jets += g.en.some(e => e.temp) ? 1 : 0; s.shots += g.shots.length ? 1 : 0; s.bullets += g.bullets.length ? 1 : 0; s.aboard += g.aboard ? 1 : 0; s.walkers += g.hs.some(h => h.st === 'go' || h.st === 'base') ? 1 : 0; s.dying += g.pl.dead ? 1 : 0; s.items += g.items.length ? 1 : 0; s.msg += g.msg ? 1 : 0; s.conts += g.conts ? 1 : 0; s.later += g.stage > stage ? 1 : 0; s.bomb += g.shots.some(q => q.k === 'bomb') ? 1 : 0; s.mis += g.shots.some(q => q.k === 'mis') ? 1 : 0; s.shield += g.pl.shield > 0 ? 1 : 0; s.turning += g.pl.turn > 0 ? 1 : 0;
        let g2; try { g2 = DS.Game.load(JSON.parse(txt), { god }); } catch (e) { out.fails.push(['불러오지 못했다', stage, god, seg, e.message]); continue; }
        out.checks++;
        const again = JSON.stringify(g2.save());
        if (again !== txt) { const A = JSON.parse(txt), B = JSON.parse(again), d = []; for (const k in A) if (JSON.stringify(A[k]) !== JSON.stringify(B[k])) d.push(k); out.fails.push(['저장본이 다르다', stage, god, seg, d]); continue; }
        if (g2.solids.length !== g.solids.length || g2.solids.some((q, i) => !!q.off !== !!g.solids[i].off)) { out.fails.push(['벽이 다르다', stage, god, seg]); continue; }
        for (let i = 0; i < 600; i++) { const a = one(g), c = one(g2); if (!a || !c) break; }
        if (JSON.stringify(g.text()) !== JSON.stringify(g2.text()) || JSON.stringify(g.save()) !== JSON.stringify(g2.save())) { const A = g.save(), B = g2.save(), d = []; for (const k in A) if (JSON.stringify(A[k]) !== JSON.stringify(B[k])) d.push(k); out.fails.push(['흐름이 갈렸다', stage, god, seg, d]); }
      }
    }
    /* 기수를 돌리는 중, 방향키를 누르고 있는 중에 저장한 판 */
    {
      const none = () => ({ l: false, r: false, u: false, d: false, a: false, aEdge: false, bEdge: false, selEdge: false, ok: false, tap: null });
      const g = new DS.Game({ stage: 0, lives: 3, cap: 10 }); let i = 0;
      for (; i < 40; i++) { const o = none(); o.ok = true; g.update(o); }
      for (i = 0; i < 50; i++) { const o = none(); o.u = true; g.update(o); }
      const side = g.pl.face > 0 ? 'l' : 'r';
      for (i = 0; i < 3; i++) { const o = none(); o[side] = true; g.update(o); }
      const mid = DS.Game.load(JSON.parse(JSON.stringify(g.save())), {}); out.saw.holding = g.pl.hold[side] > 0 ? 1 : 0;
      for (i = 0; i < 3; i++) { g.update(none()); mid.update(none()); }
      out.saw.turning = g.pl.turn > 0 ? 1 : 0;
      const g2 = DS.Game.load(JSON.parse(JSON.stringify(g.save())), {});
      for (i = 0; i < 200; i++) { const o = none(); o[i < 120 ? side : 'u'] = true; g.update(o); const q = none(); q[i < 120 ? side : 'u'] = true; g2.update(q); const w = none(); w[i < 120 ? side : 'u'] = true; mid.update(w); }
      out.checks += 2;
      if (JSON.stringify(g.save()) !== JSON.stringify(g2.save())) out.fails.push(['기수 돌리는 중 저장: 흐름이 갈렸다']);
      if (JSON.stringify(g.save()) !== JSON.stringify(mid.save())) out.fails.push(['방향키 누르는 중 저장: 흐름이 갈렸다']);
    }
    /* 망가진 저장본은 받지 않는다 */
    const g0 = new DS.Game({ stage: 0, lives: 3, cap: 10 }); for (let i = 0; i < 500; i++) one(g0);
    const good = g0.save(), mk = o => Object.assign(JSON.parse(JSON.stringify(good)), o);
    const bads = [null, {}, 'x', mk({ stage: 9 }), mk({ stage: 1 }), mk({ mode: 'over' }), mk({ mode: 'brief' }), mk({ en: 'x' }), mk({ pl: null }), mk({ life0: 0 }), mk({ cap: 99 }), mk({ lives: 0 }), mk({ rng: 'a' }), mk({ wsel: 'Q' }), mk({ aboard: 99 }), mk({ en: [{ k: 'nope', x: 1, y: 1, hp: 1, t: 0, id: 1 }] }), mk({ shots: [{ k: 'zz' }] }), mk({ huts: [] }), mk({ score: -1 }), mk({ pl: Object.assign({}, good.pl, { x: 1e9 }) })];
    out.rejected = 0; out.took = [];
    bads.forEach((q, i) => { try { DS.Game.load(q, {}); out.took.push(i); } catch (e) { out.rejected++; } });
    out.bads = bads.length;
    try { DS.Game.load(good, {}); out.goodOk = true; } catch (e) { out.goodOk = e.message; }
    return out;
  });
  ok(r.checks >= 100 && r.fails.length === 0, `엔진 왕복 ${r.checks}번, 갈린 곳 ${r.fails.length}`, r.fails.slice(0, 6));
  ok(Object.values(r.saw).every(v => v > 0), '저장 시점에 든 것(나무·쓰러진 나무·제트기·탄·적탄·탑승·걷는 사람·추락 중·보급·알림·이어 하기·다음 스테이지·폭탄·미사일·방패·기수 돌리는 중·방향키 누르는 중)', r.saw);
  ok(r.rejected === r.bads && r.goodOk === true, `망가진 저장본 ${r.rejected}/${r.bads} 거부, 온전한 저장본은 받음`, r.took);
  console.log('     저장본 크기 최대', r.bytes, '바이트');

  /* ② 화면 흐름 */
  await pg.evaluate(() => { for (let n = 1; n <= 3; n++) localStorage.removeItem('donghyunchop:slot' + n); });
  await open('');
  ok(await pg.locator('#slot-list .slot-btn').count() === 3 && await pg.locator('#slot-list .slot-btn:disabled').count() === 3, '출전 준비: 빈 칸 3개');
  await pg.click('#run'); await adv(400); await pg.keyboard.press('KeyX'); await adv(300);
  // 조금 난다: 오른쪽 위로
  await pg.keyboard.down('ArrowUp'); await pg.keyboard.down('ArrowRight'); await adv(1500); await pg.keyboard.up('ArrowUp'); await adv(1200); await pg.keyboard.up('ArrowRight'); await pg.keyboard.press('KeyX'); await adv(200);
  let s = await st(); ok(s.screen === 'game' && s.game.mode === 'play', '출전 뒤 비행 중', { x: s.game.heli && s.game.heli.x });
  await pg.keyboard.press('Enter'); await adv(50); s = await st();
  ok(s.paused && s.menu.items.join('|') === '계속 간다|소리 끄기|저장|불러오기|포기하고 출전 준비로', '멈춤 메뉴에 저장·불러오기', s.menu && s.menu.items);
  const snap0 = await pg.evaluate(() => JSON.stringify(window.__donghyunchop.snapshot().state));
  await pg.keyboard.press('ArrowDown'); await pg.keyboard.press('ArrowDown'); await pg.keyboard.press('KeyX'); await adv(50); s = await st();
  ok(s.menu.title === '저장' && s.menu.items.length === 5, '저장 메뉴: 칸 3개 · 파일 · 지우기', s.menu.items);
  await pg.screenshot({ path: path.join(__dirname, 'tmp', 'save-menu.png') });
  await pg.keyboard.press('KeyX'); await adv(50); s = await st();
  ok(s.menu.title === '잠시 멈춤' && await pg.evaluate(() => !!window.__donghyunchop.readSlot(1)), '칸 1에 저장하고 메뉴로 돌아옴');
  const slot = await pg.evaluate(() => window.__donghyunchop.readSlot(1));
  ok(slot.format === 'donghyunchop-save' && slot.version === 1 && slot.summary.stage === 1 && JSON.stringify(slot.state) === snap0 && Array.isArray(slot.logs) && slot.logs.length >= 2, '칸에 적힌 것: 형식·요약·판·기록', slot.summary);
  // 파일로 내려받기
  await pg.keyboard.press('ArrowDown'); await pg.keyboard.press('ArrowDown'); await pg.keyboard.press('KeyX'); await adv(50);
  const [dl] = await Promise.all([pg.waitForEvent('download'), (async () => { await pg.keyboard.press('ArrowDown'); await pg.keyboard.press('ArrowDown'); await pg.keyboard.press('ArrowDown'); await pg.keyboard.press('KeyX'); })()]);
  const file = path.join(__dirname, 'tmp', 'chop.dhsave'); await dl.saveAs(file);
  ok(/^donghyunchop-stage1-\d+\.dhsave$/.test(dl.suggestedFilename()) && JSON.parse(fs.readFileSync(file, 'utf8')).format === 'donghyunchop-save', '파일로 내려받기', dl.suggestedFilename());
  // 이어서 날다가 칸에서 불러온다
  await adv(50); await pg.keyboard.press('KeyX'); await adv(50);
  await pg.keyboard.down('ArrowRight'); await adv(1500); await pg.keyboard.up('ArrowRight'); await adv(100);
  const far = (await st()).game;
  await pg.keyboard.press('Enter'); await adv(50);
  for (let i = 0; i < 3; i++) await pg.keyboard.press('ArrowDown'); await pg.keyboard.press('KeyX'); await adv(50); s = await st();
  ok(s.menu.title === '불러오기' && s.menu.items.length === 4, '불러오기 메뉴: 칸 3개 · 파일', s.menu.items);
  await pg.screenshot({ path: path.join(__dirname, 'tmp', 'load-menu.png') });
  await pg.keyboard.press('KeyX'); await adv(50); s = await st(); ok(s.menu.title === '지금 판을 버리고 불러올까?', '불러오기 전에 묻는다');
  await pg.keyboard.press('KeyX'); await adv(400); s = await st();
  const back = await pg.evaluate(() => JSON.stringify(window.__donghyunchop.A.g.save()));
  ok(s.screen === 'game' && s.paused && s.menu.title.startsWith('저장한 판을 불러왔다') && back === snap0 && JSON.stringify(s.game) !== JSON.stringify(far), '칸에서 불러옴: 저장한 그 자리, 멈춘 채로 기다림');
  await pg.screenshot({ path: path.join(__dirname, 'tmp', 'loaded.png') });
  await adv(1000); ok(await pg.evaluate(() => JSON.stringify(window.__donghyunchop.A.g.save())) === snap0, '메뉴가 떠 있는 동안 판은 멈춰 있다');
  await pg.keyboard.press('KeyX'); await adv(500); s = await st(); ok(!s.paused && s.game.mode === 'play' && await pg.evaluate(() => window.__donghyunchop.A.g.t) > JSON.parse(snap0).t, '계속 간다를 고르면 다시 흐른다');
  ok((await pg.locator('#log li').first().textContent()).includes('저장한 판을 불러왔다') && await pg.locator('#log li').count() >= 3, '비행 기록도 돌아온다');
  // 새로 고침 뒤 출전 준비 화면에서 불러온다
  await open(''); await pg.screenshot({ path: path.join(__dirname, 'tmp', 'setup-slots.png'), fullPage: true });
  ok(await pg.locator('#slot-list .slot-btn:not(:disabled)').count() === 1 && (await pg.locator('#slot-list .slot-btn').first().textContent()).includes('스테이지 1'), '새로 고침 뒤에도 칸 1이 남아 있다', await pg.locator('#slot-list .slot-btn').first().textContent());
  await pg.locator('#slot-list .slot-btn').first().click(); await adv(400); s = await st();
  ok(s.live && s.screen === 'game' && s.paused && await pg.evaluate(() => JSON.stringify(window.__donghyunchop.A.g.save())) === snap0 && await pg.locator('#hud').isVisible(), '출전 준비 화면에서 칸을 눌러 불러옴');
  // 파일에서: 다른 설정(헬기 5, 스케치북 흰색)으로 저장한 판
  await pg.keyboard.press('KeyX'); await adv(100);
  const d2 = JSON.parse(fs.readFileSync(file, 'utf8')); d2.cfg.bg = 2; d2.sum = { saved: 12, lost: 3 }; const f2 = path.join(__dirname, 'tmp', 'chop2.dhsave'); fs.writeFileSync(f2, JSON.stringify(d2));
  await pg.setInputFiles('#load-file', f2); await pg.waitForFunction(() => { const s = JSON.parse(window.render_game_to_text()); window.advanceTime(50); return s.screen === 'game' && s.paused && s.paper !== '미색'; }, null, { timeout: 30000 });
  s = await st(); ok(s.cfg.bg === 2 && s.sum.saved === 12 && s.sum.lost === 3 && await pg.evaluate(() => JSON.stringify(window.__donghyunchop.A.g.save())) === snap0, '파일에서 불러옴: 종이 색·누계까지', { paper: s.paper, sum: s.sum });
  // 틀린 파일은 받지 않고 지금 판은 그대로
  await pg.keyboard.press('KeyX'); await adv(300);
  const bad = path.join(__dirname, 'tmp', 'bad.dhsave');
  for (const [name, body, want] of [['글자 파일', 'hello', '동현촙 저장 파일이 아니다'], ['다른 게임 파일', JSON.stringify({ format: 'donghyuns-save', version: 1, state: {} }), '동현촙 저장 파일이 아니다'], ['버전이 다른 파일', JSON.stringify(Object.assign({}, d2, { version: 9 })), '지원하지 않는 저장 형식'], ['판이 망가진 파일', JSON.stringify(Object.assign({}, d2, { state: Object.assign({}, d2.state, { stage: 12 }) })), '스테이지 정보가 맞지 않는다']]) {
    const before = await pg.evaluate(() => JSON.stringify(window.__donghyunchop.A.g.save()));
    fs.writeFileSync(bad, body); await pg.setInputFiles('#load-file', bad); await pg.waitForFunction(() => document.querySelector('#status').textContent.startsWith('불러오기 실패'), null, { timeout: 10000 });
    const t = await pg.locator('#status').textContent(); s = await st();
    ok(t.includes(want) && s.paused && s.menu.title === '잠시 멈춤' && await pg.evaluate(() => JSON.stringify(window.__donghyunchop.A.g.save())) === before, name + '은 받지 않고 지금 판은 그대로', t);
    await pg.keyboard.press('KeyX'); await adv(100); await pg.evaluate(() => { document.querySelector('#status').textContent = ''; });
  }
  // 출전 준비 화면에서 틀린 파일
  await pg.evaluate(() => window.__donghyunchop.backToSetup()); await adv(300);
  fs.writeFileSync(bad, 'hello'); await pg.setInputFiles('#load-file-setup', bad); await pg.waitForFunction(() => document.querySelector('#result').textContent.startsWith('불러오기 실패'), null, { timeout: 10000 });
  s = await st(); ok(!s.live && s.screen === 'ready', '출전 준비 화면에서 틀린 파일: 알리고 그대로', await pg.locator('#result').textContent());
  // 칸 지우기: 두 번 눌러야 지운다
  const del = pg.locator('#slot-list .slot-del').first(); await del.click();
  ok(await pg.evaluate(() => !!window.__donghyunchop.readSlot(1)) && (await del.textContent()) === '정말 지운다', '지우기 한 번: 아직 남아 있다');
  await pg.locator('#slot-list .slot-del').first().click();
  ok(await pg.evaluate(() => !window.__donghyunchop.readSlot(1)) && await pg.locator('#slot-list .slot-btn:disabled').count() === 3, '지우기 두 번: 칸이 빈다');
  ok(errs.length === 0, '콘솔 오류 0', errs.slice(0, 4));
  await b.close();
  console.log(fails ? `실패 ${fails}` : '저장·불러오기 검사 통과');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
