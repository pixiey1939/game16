const { chromium } = require('playwright');
const BASE = 'http://localhost:8099';
const INPUT = '#command-input';
const OUTPUT = '#output';

async function cmd(page, text) {
  await page.waitForFunction(s => !document.querySelector(s).disabled, INPUT, { timeout: 15000 });
  await page.fill(INPUT, text);
  await page.press(INPUT, 'Enter');
}

async function getOut(page) {
  return await page.evaluate(s => document.querySelector(s)?.textContent || '', OUTPUT);
}

async function clickChoice(page, label) {
  await page.waitForSelector('.choice-button', { timeout: 10000 });
  const btns = await page.$$('.choice-button');
  for (const btn of btns) {
    const t = await btn.textContent();
    if (t.trim().includes(label)) { await btn.click(); return true; }
  }
  return false;
}

async function enterSubmenu(page, name) {
  await cmd(page, 'access');
  await page.waitForTimeout(500);
  await cmd(page, name);
  await page.waitForTimeout(1000);
}

async function back(page) {
  await cmd(page, 'back');
  await page.waitForTimeout(500);
}

function pass(msg) { return '✅ ' + msg; }
function fail(msg) { return '❌ ' + msg; }

(async () => {
  console.log('=== GAME16 PLAYWRIGHT QA ===');
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ bypassCSP: true });
  const page = await ctx.newPage();
  await page.route('**/*', route => {
    const headers = { ...route.request().headers() };
    headers['cache-control'] = 'no-cache';
    route.continue({ headers });
  });
  const jsErrors = [];
  page.on('pageerror', e => jsErrors.push(e.message));
  page.on('console', msg => { if (msg.type() === 'error') jsErrors.push(msg.text()); });

  await page.goto(BASE);
  await page.waitForSelector(INPUT, { timeout: 10000 });
  await page.waitForTimeout(1500);
  console.log('1. Page loaded OK');

  // Clear any existing save
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector(INPUT);
  await page.waitForTimeout(1500);

  // === Stage 1: Accept ===
  await clickChoice(page, '是');
  await page.waitForTimeout(2500);
  let o = await getOut(page);
  console.log('2. Stage 1 accept + E-01: ' + (o.includes('E-01') ? pass('E-01') : fail('E-01 missing')));

  // === OA → workflow → AP-2026-2045 → 确认激活 → E-03 + 门禁/停车场 unlock ===
  await enterSubmenu(page, 'OA');
  await cmd(page, '4');
  await page.waitForTimeout(1000);
  await cmd(page, '1');
  await page.waitForTimeout(2000);
  await clickChoice(page, '确认激活');
  await page.waitForTimeout(2500);
  o = await getOut(page);
  let e03 = o.includes('E-03');
  let doorUnlocked = o.includes('门禁');
  let parkingUnlocked = o.includes('停车场');
  console.log('3. OA.workflow + E-03 + 门禁/停车场解锁: ' + (e03 && doorUnlocked && parkingUnlocked ? pass('E-03 + 门禁 + 停车场') : fail('missing')));
  await back(page);
  await back(page);

  // === OA → 聊天记录 → 郑桥 → E-02 ===
  await cmd(page, '2');
  await page.waitForTimeout(1000);
  await cmd(page, '1');
  await page.waitForTimeout(2000);
  o = await getOut(page);
  console.log('3.5. E-02 OA聊天(郑桥): ' + (o.includes('E-02') ? pass('E-02') : fail('E-02 missing')));
  await back(page);

  // === 门禁 → 刷卡记录 (no evidence) → 异常记录 → E-04 + E-05 ===
  await enterSubmenu(page, '门禁');
  await cmd(page, '1');
  await page.waitForTimeout(2000);
  o = await getOut(page);
  console.log('4a. 门禁刷卡记录 (info only): ' + (o.includes('工号') ? pass('log shown') : fail('log missing')));
  await back(page);
  await cmd(page, '2');
  await page.waitForTimeout(2000);
  o = await getOut(page);
  console.log('4b. E-04+E-05 异常记录: ' + (o.includes('E-04') && o.includes('E-05') ? pass('E-04 E-05') : fail('E-04/E-05 missing')));
  await back(page);

  // === 停车场 → E-06 ===
  await enterSubmenu(page, '停车场');
  await cmd(page, '1');
  await page.waitForTimeout(2000);
  o = await getOut(page);
  console.log('5. E-06 停车场记录: ' + (o.includes('E-06') ? pass('E-06') : fail('E-06 missing')));
  await back(page);

  // === 停车场 → 车辆服务联动 → 查询鄂A·8K329 → 解锁公共监控 ===
  await cmd(page, '3');
  await page.waitForTimeout(1500);
  await cmd(page, '鄂A·8K329');
  await page.waitForTimeout(2500);
  o = await getOut(page);
  console.log('5b. 鄂A·8K329 查询 + 解锁监控: ' + (o.includes('郑桥') && o.includes('公共监控') ? pass('查询+监控解锁') : fail('查询失败')));
  await back(page);

  // === 公共监控 → 超市 → E-07 ===
  await enterSubmenu(page, '公共监控');
  await cmd(page, '1');
  await page.waitForTimeout(2000);
  o = await getOut(page);
  console.log('6. E-07 超市监控: ' + (o.includes('E-07') ? pass('E-07') : fail('E-07 missing')));
  await back(page);

  // === 公共监控 → 洗车店 → E-08 ===
  await cmd(page, '2');
  await page.waitForTimeout(2000);
  o = await getOut(page);
  console.log('6b. E-08 洗车店监控: ' + (o.includes('E-08') ? pass('E-08') : fail('E-08 missing')));
  await back(page);

  // === Unlock phone ===
  await cmd(page, 'unlock');
  await page.waitForTimeout(500);
  await cmd(page, '1222');
  await page.waitForTimeout(2500);
  o = await getOut(page);
  let phoneOk = o.includes('短信') && o.includes('微信') && o.includes('相册');
  console.log('7. Phone unlock: ' + (phoneOk ? pass('手机解锁') : fail('手机未解锁')));

  // === 短信 → E-12 ===
  await enterSubmenu(page, '短信');
  await cmd(page, '1');
  await page.waitForTimeout(2000);
  o = await getOut(page);
  console.log('8. E-12 短信: ' + (o.includes('E-12') ? pass('E-12') : fail('E-12 missing')));
  await back(page);

  // === 微信 → 聊天记录 → 大怪兽 → E-16 (1) ===
  await enterSubmenu(page, '微信');
  await cmd(page, '1');
  await page.waitForTimeout(1000);
  await cmd(page, '1');
  await page.waitForTimeout(2000);
  o = await getOut(page);
  console.log('9. E-16 微信聊天(大怪兽): ' + (o.includes('E-16') ? pass('E-16') : fail('E-16 missing')));
  // stay in wechat.chat (E-15/21 are also in this menu)

  // === 微信 → 聊天记录 → 老公 → E-15 (3) ===
  await cmd(page, '3');
  await page.waitForTimeout(2000);
  o = await getOut(page);
  console.log('10. E-15 微信聊天(老公): ' + (o.includes('E-15') ? pass('E-15') : fail('E-15 missing')));

  // === 微信 → 聊天记录 → 微信支付 → E-21 (7) ===
  await cmd(page, '7');
  await page.waitForTimeout(2000);
  o = await getOut(page);
  console.log('11. E-21 微信支付: ' + (o.includes('E-21') ? pass('E-21') : fail('E-21 missing')));
  await back(page);

  // === 微信 → 微信小程序 → 教练团队 → E-17 + 信用查询 unlock ===
  // back to 顶层, then 微信 → 2 (wechat.mini) → 2 (教练团队)
  await back(page);
  await back(page);
  await enterSubmenu(page, '微信');
  await cmd(page, '2');
  await page.waitForTimeout(1000);
  await cmd(page, '2');
  await page.waitForTimeout(2500);
  o = await getOut(page);
  console.log('12. E-17 教练团队: ' + (o.includes('E-17') ? pass('E-17') : fail('E-17 missing')));

  // Login gym admin
  await cmd(page, 'zoudaxiong');
  await page.waitForTimeout(1000);
  await cmd(page, '7753');
  await page.waitForTimeout(2000);
  o = await getOut(page);
  console.log('13. Gym admin login: ' + (o.includes('登录') ? pass('管理后台已登录') : fail('管理后台未登录')));
  await back(page);
  await back(page);
  await back(page);

  // === 相册 → 借条 → E-13 ===
  await enterSubmenu(page, '相册');
  await cmd(page, '1');
  await page.waitForTimeout(2000);
  o = await getOut(page);
  console.log('14. E-13 借条: ' + (o.includes('E-13') ? pass('E-13') : fail('E-13 missing')));
  // stay in 相册 menu (no back) to access 2 (WiFi视频)

  // === 相册 → WiFi 视频 → E-14 + 健身房 system unlock ===
  await cmd(page, '2');
  await page.waitForTimeout(2500);
  o = await getOut(page);
  console.log('15. E-14 WiFi 视频: ' + (o.includes('E-14') ? pass('E-14') : fail('E-14 missing')));

  // === 健身房 → 门禁记录 → E-18 ===
  await enterSubmenu(page, '健身房');
  await cmd(page, '2');
  await page.waitForTimeout(2000);
  o = await getOut(page);
  console.log('16. E-18 健身房门禁: ' + (o.includes('E-18') ? pass('E-18') : fail('E-18 missing')));

  // === 健身房 → 监控截图 → E-19 ===
  await enterSubmenu(page, '健身房');
  await cmd(page, '3');
  await page.waitForTimeout(2000);
  o = await getOut(page);
  console.log('17. E-19 健身房监控: ' + (o.includes('E-19') ? pass('E-19') : fail('E-19 missing')));

  // === 健身房 → Wi-Fi 日志 → E-20 ===
  await cmd(page, '4');
  await page.waitForTimeout(2000);
  o = await getOut(page);
  console.log('18. E-20 WiFi/DNS: ' + (o.includes('E-20') ? pass('E-20') : fail('E-20 missing')));
  await back(page);

  // === 信用查询 → 教练信用 → E-09 ===
  await enterSubmenu(page, '信用查询');
  await cmd(page, '1');
  await page.waitForTimeout(2000);
  o = await getOut(page);
  console.log('19. E-09 教练信用: ' + (o.includes('E-09') ? pass('E-09') : fail('E-09 missing')));

  // === 信用查询 → 郑桥信用 → E-10 ===
  await cmd(page, '2');
  await page.waitForTimeout(2000);
  o = await getOut(page);
  console.log('20. E-10 郑桥信用: ' + (o.includes('E-10') ? pass('E-10') : fail('E-10 missing')));

  // === 信用查询 → 网友信用 → E-11 ===
  await cmd(page, '3');
  await page.waitForTimeout(2000);
  o = await getOut(page);
  console.log('21. E-11 网友信用: ' + (o.includes('E-11') ? pass('E-11') : fail('E-11 missing')));
  await back(page);

  // === Combines ===
  await cmd(page, 'combine E-05+E-18');
  await page.waitForTimeout(1500);
  await cmd(page, 'combine E-12+E-20');
  await page.waitForTimeout(1500);
  await cmd(page, 'combine E-08+E-20');
  await page.waitForTimeout(1500);
  await cmd(page, 'combine E-09+E-13');
  await page.waitForTimeout(2000);
  o = await getOut(page);
  let c01 = o.includes('C-01'), c02 = o.includes('C-02'), c03 = o.includes('C-03'), c04 = o.includes('C-04');
  console.log('22. Combines: C-01=' + c01 + ' C-02=' + c02 + ' C-03=' + c03 + ' C-04=' + c04);

  // === Evidence list ===
  await cmd(page, 'list');
  await page.waitForTimeout(2000);
  let finalOut = await getOut(page);
  const allE = ['E-01','E-02','E-03','E-04','E-05','E-06','E-07','E-08','E-09','E-10','E-11','E-12','E-13','E-14','E-15','E-16','E-17','E-18','E-19','E-20','E-21'];
  const found = allE.filter(e => finalOut.includes(e));
  const missing = allE.filter(e => !finalOut.includes(e));
  console.log('23. Evidence: ' + found.length + '/21, missing: ' + (missing.join(', ') || 'NONE'));

  console.log('\n=== QA SUMMARY ===');
  console.log('Evidence: ' + (missing.length === 0 ? '✅ PASS (21/21)' : '⚠️  PARTIAL (' + found.length + '/21) missing: ' + missing.join(', ')));
  console.log('Combines: ' + ((c01 && c02 && c03 && c04) ? '✅ PASS (4/4)' : '⚠️  PARTIAL (C-01=' + c01 + ' C-02=' + c02 + ' C-03=' + c03 + ' C-04=' + c04 + ')'));
  console.log('JS errors: ' + (jsErrors.length === 0 ? '✅ NONE' : '❌ ' + jsErrors.length + ' errors'));
  if (jsErrors.length > 0) {
    console.log('Error details:');
    jsErrors.slice(0, 5).forEach((e, i) => console.log('  [' + i + '] ' + e.substring(0, 200)));
  }
  console.log('=== END ===');

  await browser.close();
})();
