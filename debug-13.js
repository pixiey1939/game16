const { chromium } = require('playwright');
const BASE = 'http://localhost:8099';
const INPUT = '#command-input';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ bypassCSP: true });
  const page = await ctx.newPage();

  async function cmd(text) {
    for (let a = 0; a < 3; a++) {
      const d = await page.evaluate(s => document.querySelector(s)?.disabled, INPUT);
      if (!d) break;
      await page.evaluate(() => { const b = document.querySelector('.choice-button:not([disabled])'); if(b) b.click(); });
      await page.waitForTimeout(800);
    }
    await page.waitForFunction(s => !document.querySelector(s).disabled, INPUT, { timeout: 15000 });
    await page.fill(INPUT, text);
    await page.press(INPUT, 'Enter');
  }

  async function clickChoice(label) {
    await page.waitForSelector('.choice-button:not([disabled])', { timeout: 180000 });
    const btns = await page.$$('.choice-button:not([disabled])');
    for (const b of btns) { const t = await b.textContent(); if (t.trim().includes(label)) { await b.click(); return; } }
  }

  async function back() { await cmd('back'); await page.waitForTimeout(400); }

  async function dump(label) {
    const s = await page.evaluate(() => {
      const gs = game.getState();
      return {
        nav: gs._navContext,
        authed: gs.miniProgramAuthed,
        gymDiscovered: gs.gymAdminDiscovered,
        gymUnlocked: gs.gymAdminUnlocked,
        ev: gs.unlockedEvidence.slice(),
        sys: gs.unlockedSystems.slice(),
      };
    });
    console.log(`[${label}] nav=${s.nav} authed=${s.authed} disco=${s.gymDiscovered} unlocked=${s.gymUnlocked} ev=${s.ev.length}`);
  }

  // Load fresh
  await page.goto(BASE);
  await page.waitForSelector(INPUT, { timeout: 10000 });
  await page.waitForTimeout(1500);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector(INPUT);
  await page.waitForTimeout(1500);
  console.log('=== FRESH ===');

  // Step through with massive waits to let queue drain
  await clickChoice('是'); await page.waitForTimeout(5000);
  await cmd('OA'); await page.waitForTimeout(5000);
  await cmd('4'); await page.waitForTimeout(5000);
  await cmd('1'); await page.waitForTimeout(5000);
  await clickChoice('确认激活'); await page.waitForTimeout(5000);
  await back(); await page.waitForTimeout(2000); await back(); await page.waitForTimeout(2000);
  await cmd('2'); await page.waitForTimeout(5000); // OA chat
  await cmd('1'); await page.waitForTimeout(5000); // 郑桥
  await back(); await page.waitForTimeout(2000); await back(); await page.waitForTimeout(2000); await back(); await page.waitForTimeout(2000);

  await cmd('access'); await page.waitForTimeout(3000);
  await cmd('门禁'); await page.waitForTimeout(5000);
  await cmd('2'); await page.waitForTimeout(5000);
  await back(); await page.waitForTimeout(2000); await back(); await page.waitForTimeout(2000);

  await cmd('access'); await page.waitForTimeout(3000);
  await cmd('停车场'); await page.waitForTimeout(5000);
  await cmd('3'); await page.waitForTimeout(8000);
  await back(); await page.waitForTimeout(2000);

  await cmd('access'); await page.waitForTimeout(3000);
  await cmd('公共监控系统'); await page.waitForTimeout(5000);
  await cmd('1'); await page.waitForTimeout(5000);
  await cmd('广捷洗车广埠屯'); await page.waitForTimeout(8000);
  await page.waitForTimeout(10000); // drain
  await cmd('back'); await page.waitForTimeout(3000);

  await cmd('access'); await page.waitForTimeout(3000);
  await cmd('unlock'); await page.waitForTimeout(1000);
  await cmd('1222'); await page.waitForTimeout(8000);

  await cmd('access'); await page.waitForTimeout(3000);
  await cmd('短信'); await page.waitForTimeout(5000);
  await back(); await page.waitForTimeout(2000);

  await cmd('access'); await page.waitForTimeout(3000);
  await cmd('微信'); await page.waitForTimeout(5000);
  await cmd('1'); await page.waitForTimeout(5000);
  await cmd('1'); await page.waitForTimeout(5000);
  await back(); await page.waitForTimeout(2000);
  await cmd('3'); await page.waitForTimeout(5000);
  await back(); await page.waitForTimeout(2000);
  await cmd('7'); await page.waitForTimeout(5000);
  await back(); await page.waitForTimeout(2000); await back(); await page.waitForTimeout(2000); await back(); await page.waitForTimeout(2000);

  // 小程序 auth
  await cmd('access'); await page.waitForTimeout(3000);
  await cmd('微信'); await page.waitForTimeout(5000);
  await cmd('2'); await page.waitForTimeout(30000); // drain 30s
  console.log('--- BEFORE 炼健身 ---');
  await dump('pre-炼健身');

  await cmd('炼健身');
  await page.waitForFunction(() => !!document.querySelector('#command-input')?.disabled, { timeout: 180000 });
  console.log('displayChoice shown');
  await clickChoice('确认授权');
  await page.waitForTimeout(3000);
  await dump('post-auth');

  await cmd('2'); await page.waitForTimeout(5000); // 教练团队
  await dump('post-教练团队');

  // ★★★ KEY CHECK: can we see admin option? ★★★
  // back to root via chain
  await back(); await page.waitForTimeout(2000);
  await dump('after back1'); // should be wechat.mprog
  await back(); await page.waitForTimeout(2000);
  await dump('after back2'); // should be wechat.apps

  // ★★★ CHECK RESOLVE AT wechat.apps ★★★
  const r1 = await page.evaluate(() => {
    const gs = game.getState();
    const ctx = gs._navContext;
    if (ctx === 'wechat.apps') {
      const items = [];
      if (gs.miniProgramAuthed) items.push({ num: 1, label: '炼健身小程序' });
      if (gs.gymAdminDiscovered) items.push({ num: 2, label: '炼健身管理后台' });
      return { ctx, items, authed: gs.miniProgramAuthed, disco: gs.gymAdminDiscovered };
    }
    return { ctx, items: [], authed: gs.miniProgramAuthed, disco: gs.gymAdminDiscovered };
  });
  console.log('★★★ RESOLVE at wechat.apps:', JSON.stringify(r1));

  // Now continue to root then re-enter
  await back(); await page.waitForTimeout(2000);
  // Should be at 微信 now, one more back to root
  await cmd('access'); await page.waitForTimeout(3000);
  await cmd('微信'); await page.waitForTimeout(5000);
  await dump('re-entered 微信');
  await cmd('2'); await page.waitForTimeout(10000); // 小程序
  await dump('in wechat.apps again');

  // ★★★ CHECK RESOLVE AGAIN ★★★
  const r2 = await page.evaluate(() => {
    const gs = game.getState();
    const ctx = gs._navContext;
    if (ctx === 'wechat.apps') {
      const items = [];
      if (gs.miniProgramAuthed) items.push({ num: 1, label: '炼健身小程序' });
      if (gs.gymAdminDiscovered) items.push({ num: 2, label: '炼健身管理后台' });
      return { ctx, items, authed: gs.miniProgramAuthed, disco: gs.gymAdminDiscovered };
    }
    return { ctx, items: [], authed: gs.miniProgramAuthed, disco: gs.gymAdminDiscovered };
  });
  console.log('★★★ RESOLVE 2:', JSON.stringify(r2));

  // Try admin login
  await cmd('2'); await page.waitForTimeout(3000);
  await dump('after admin cmd(2)');

  const navNow = await page.evaluate(() => game.getState()._navContext);
  console.log('NAV AFTER CMD(2):', navNow);

  if (navNow === 'gym_login' || navNow === 'gym_login_pwd') {
    await cmd('zoudaxiong'); await page.waitForTimeout(1000);
    await cmd('7753'); await page.waitForTimeout(5000);
    const out = await page.evaluate(() => document.querySelector('#output')?.textContent?.slice(-500) || '');
    console.log('Login success:', out.includes('登录成功'));
    console.log('TAIL:', out);
  } else {
    // Dump output for diagnosis
    const out = await page.evaluate(() => document.querySelector('#output')?.textContent?.slice(-1500) || '');
    console.log('OUTPUT TAIL:', out);
  }

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
