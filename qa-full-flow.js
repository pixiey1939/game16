const { chromium } = require('playwright');
const BASE = 'http://localhost:8099';
const INPUT = '#command-input';
const OUTPUT = '#output';

async function cmd(page, text) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const isDisabled = await page.evaluate(s => document.querySelector(s)?.disabled, INPUT);
    if (!isDisabled) break;
    const dismissed = await page.evaluate(() => {
      const btns = document.querySelectorAll('.choice-button:not([disabled])');
      if (btns.length === 0) return false;
      btns[0].click();
      return true;
    });
    if (!dismissed) throw new Error('cmd: input disabled and no active choice button to dismiss');
    await page.waitForTimeout(800);
  }
  await page.waitForFunction(s => !document.querySelector(s).disabled, INPUT, { timeout: 15000 });
  await page.fill(INPUT, text);
  await page.press(INPUT, 'Enter');
}

// Slices last 1500 chars to avoid false positives from earlier game state text
async function getOut(page) {
  return await page.evaluate(s => {
    const el = document.querySelector(s);
    if (!el) return '';
    const txt = el.textContent || '';
    return txt.length > 1500 ? txt.slice(-1500) : txt;
  }, OUTPUT);
}

async function getState(page) {
  return await page.evaluate(() => ({
    navContext: typeof game !== 'undefined' ? game.getState()._navContext : null,
    monitorSearch: typeof game !== 'undefined' ? game.getState()._monitorSearch : null,
    parkingQuery: typeof game !== 'undefined' ? game.getState()._parkingLicenseQuery : null,
    unlocked: typeof game !== 'undefined' ? game.getState().unlockedEvidence.slice() : [],
    systems: typeof game !== 'undefined' ? game.getState().unlockedSystems.slice() : [],
    door: typeof game !== 'undefined' ? game.getState().doorActivated : false,
  }));
}

async function clickChoice(page, label, timeout = 20000) {
  await page.waitForSelector('.choice-button:not([disabled])', { timeout });
  const btns = await page.$$('.choice-button:not([disabled])');
  for (const btn of btns) {
    const t = await btn.textContent();
    if (t.trim().includes(label)) { await btn.click(); return true; }
  }
  return false;
}

async function backToRoot(page) {
  let s = await getState(page);
  let safety = 0;
  while (s.navContext && safety++ < 10) {
    await cmd(page, 'back');
    await page.waitForTimeout(400);
    s = await getState(page);
  }
  if (s.parkingQuery) {
    await cmd(page, 'back');
    await page.waitForTimeout(400);
  }
  await cmd(page, 'access');
  await page.waitForTimeout(500);
}

async function enterSubmenu(page, name) {
  await backToRoot(page);
  await cmd(page, name);
  // Wait for connection animation (1500ms) + showNavMenu to complete
  await page.waitForTimeout(2500);
}

async function back(page) {
  await cmd(page, 'back');
  await page.waitForTimeout(500);
}

function pass(msg) { return '✅ ' + msg; }
function fail(msg) { return '❌ ' + msg; }

async function waitForEvidence(page, id, timeout = 25000) {
  try {
    await page.waitForFunction(eid => {
      const gs = typeof game !== 'undefined' ? game.getState() : null;
      return gs && gs.unlockedEvidence.indexOf(eid) >= 0;
    }, id, { timeout });
    return true;
  } catch {
    const state = await page.evaluate(() => {
      const gs = typeof game !== 'undefined' ? game.getState() : null;
      return gs ? gs.unlockedEvidence : 'GAME_UNDEFINED';
    });
    console.log('  DEBUG: waitForEvidence(' + id + ') FAILED. unlockedEvidence:', state);
    return false;
  }
}

async function waitForSystem(page, sys, timeout = 25000) {
  try {
    await page.waitForFunction(s => {
      const gs = typeof game !== 'undefined' ? game.getState() : null;
      return gs && gs.unlockedSystems.indexOf(s) >= 0;
    }, sys, { timeout });
    return true;
  } catch { return false; }
}

(async () => {
  console.log('=== GAME16 PLAYWRIGHT QA ===');
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ bypassCSP: true });
  const page = await ctx.newPage();
  // Speed hack: accelerate all setTimeout 100x so typewriter/animations run near-instantly
  await page.addInitScript(() => {
    const _st = window.setTimeout.bind(window);
    window.setTimeout = (fn, d, ...a) => _st(fn, d > 0 ? Math.max(1, Math.floor(d / 100)) : d, ...a);
  });
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
  const e01ok = await waitForEvidence(page, 'E-01', 15000);
  console.log('2. Stage 1 accept + E-01: ' + (e01ok ? pass('E-01') : fail('E-01 missing')));

  // === OA → workflow → AP-2026-2045 → 确认激活 → E-03 + 门禁/停车场 unlock ===
  await enterSubmenu(page, 'OA');
  await cmd(page, '4');
  await page.waitForTimeout(1000);
  await cmd(page, '1');
  await page.waitForTimeout(2000);
  await clickChoice(page, '确认激活');
  const e03ok = await waitForEvidence(page, 'E-03', 15000);
  const doorOk = await waitForSystem(page, '门禁', 5000);
  const parkingOk = await waitForSystem(page, '停车场', 5000);
  console.log('3. OA.workflow + E-03 + 门禁/停车场解锁: ' + (e03ok && doorOk && parkingOk ? pass('E-03 + 门禁 + 停车场') : fail('missing')));
  await back(page);
  await back(page);
  // now at OA menu level (backed from OA.workflow.AP → OA.workflow → OA)
  // === OA → 聊天记录 → 郑桥 → E-02 ===
  await cmd(page, '2');
  await page.waitForTimeout(1000);
  await cmd(page, '1');
  const e02ok = await waitForEvidence(page, 'E-02');
  console.log('3.5. E-02 OA聊天(郑桥): ' + (e02ok ? pass('E-02') : fail('E-02 missing')));
  await back(page);

  // === 门禁 → 刷卡记录 (no evidence) → 异常记录 → E-04 + E-05 ===
  await enterSubmenu(page, '门禁');
  await cmd(page, '1');
  await page.waitForTimeout(2000);
  let o = await getOut(page);
  console.log('4a. 门禁刷卡记录 (info only): ' + (o.includes('工号') ? pass('log shown') : fail('log missing')));
  await back(page);
  await cmd(page, '2');
  const e04ok = await waitForEvidence(page, 'E-04');
  const e05ok = await waitForEvidence(page, 'E-05');
  console.log('4b. E-04+E-05 门禁异常记录: ' + (e04ok && e05ok ? pass('E-04 E-05') : fail('E-04/E-05 missing')));
  await back(page);

  // === 停车场 → E-06 ===
  await enterSubmenu(page, '停车场');
  await cmd(page, '1');
  const e06ok = await waitForEvidence(page, 'E-06');
  console.log('5. E-06 停车场记录: ' + (e06ok ? pass('E-06') : fail('E-06 missing')));
  await back(page);

  // === 停车场 → 车辆服务联动 → 查询鄂A·8K329 → 解锁公共监控 ===
  const stateBefore5b = await getState(page);
  console.log('5b. PRE state: nav=' + stateBefore5b.navContext + ' systems=' + stateBefore5b.systems.join(','));
  await cmd(page, '3');
  const stateAfter3 = await getState(page);
  console.log('5b. after cmd(3) state: nav=' + stateAfter3.navContext);
  await page.waitForTimeout(1500);
  await cmd(page, '鄂A·8K329');
  const pubmonUnlocked = await waitForSystem(page, '公共监控系统', 45000);
  console.log('5b. 公共监控系统: ' + (pubmonUnlocked ? pass('已解锁') : fail('未解锁')));
  await back(page);
  o = await getOut(page);
  console.log('5b. output tail: ' + (o ? o.slice(-200).replace(/\n/g, '\\n') : '(empty)'));

  // === 公共监控 → 超市 → E-07 ===
  await enterSubmenu(page, '公共监控');
  // Wait for _monitorSearch to be set (happens after connection animation + showNavMenu)
  const msReady = await page.waitForFunction(() => {
    const gs = typeof game !== 'undefined' ? game.getState() : null;
    return gs?._monitorSearch === true;
  }, { timeout: 15000 }).then(() => true).catch(() => false);
  const stateBefore6 = await page.evaluate(() => {
    const gs = typeof game !== 'undefined' ? game.getState() : null;
    return { nav: gs?._navContext, monitor: gs?._monitorSearch };
  });
  console.log('6. Pre-cmd state: nav=' + stateBefore6.nav + ' monitor=' + stateBefore6.monitor + ' msReady=' + msReady);
  await cmd(page, '超市');
  await page.waitForTimeout(500);
  const e07ok = await waitForEvidence(page, 'E-07');
  console.log('6. E-07 超市监控: ' + (e07ok ? pass('E-07') : fail('E-07 missing')));
  // Wait for the async handleMonitorSearch to fully complete (sets _monitorSearch = false)
  await page.waitForFunction(() => {
    const gs = typeof game !== 'undefined' ? game.getState() : null;
    return gs?._monitorSearch === false;
  }, { timeout: 30000 }).catch(() => {});
  await back(page);

  // === 公共监控 → 洗车店 → E-08 ===
  await enterSubmenu(page, '公共监控');
  const msReady2 = await page.waitForFunction(() => {
    const gs = typeof game !== 'undefined' ? game.getState() : null;
    return gs?._monitorSearch === true;
  }, { timeout: 15000 }).then(() => true).catch(() => false);
  console.log('6b. monitorSearch ready: ' + msReady2);
  await cmd(page, '广捷洗车广埠屯');
  const e08ok = await waitForEvidence(page, 'E-08');
  console.log('6b. E-08 洗车店监控: ' + (e08ok ? pass('E-08') : fail('E-08 missing')));
  await page.waitForFunction(() => {
    const gs = typeof game !== 'undefined' ? game.getState() : null;
    return gs?._monitorSearch === false;
  }, { timeout: 30000 }).catch(() => {});
  await back(page);

  // === Unlock phone → 短信 + 微信 + 相册 ===
  const prePhoneSys = await page.evaluate(() => {
    const gs = typeof game !== 'undefined' ? game.getState() : null;
    return gs ? gs.unlockedSystems.slice() : [];
  });
  console.log('7. Pre-unlock systems: ' + prePhoneSys.join(','));
  await cmd(page, 'unlock');
  await page.waitForTimeout(500);
  await cmd(page, '1222');
  await page.waitForTimeout(4000);
  // Wait for phone unlock to add systems: 短信, 微信, 相册
  const smsUnlocked = await page.waitForFunction(() => {
    const gs = typeof game !== 'undefined' ? game.getState() : null;
    return gs && gs.unlockedSystems.indexOf('短信') >= 0;
  }, { timeout: 25000 }).then(() => true).catch(() => false);
  const postPhoneSys = await page.evaluate(() => {
    const gs = typeof game !== 'undefined' ? game.getState() : null;
    return gs ? gs.unlockedSystems.slice() : [];
  });
  console.log('7. Phone unlock: smsUnlocked=' + smsUnlocked + ' systems=' + postPhoneSys.join(','));

  // === 短信 → E-12 (unlocked on entering SMS system) ===
  await enterSubmenu(page, '短信');
  await page.waitForTimeout(1000);
  const e12ok = await waitForEvidence(page, 'E-12', 15000);
  console.log('8. E-12 短信: ' + (e12ok ? pass('E-12') : fail('E-12 missing')));
  await back(page);

  // === 微信 → 聊天记录 → 大怪兽 → E-16 (1) ===
  await enterSubmenu(page, '微信');
  await cmd(page, '1');
  await page.waitForTimeout(1000);
  await cmd(page, '1');
  const e16ok = await waitForEvidence(page, 'E-16');
  console.log('9. E-16 微信聊天(大怪兽): ' + (e16ok ? pass('E-16') : fail('E-16 missing')));
  await back(page); // back from specific chat to chat list

  // === 微信 → 聊天记录 → 老公 → E-15 (3) ===
  await cmd(page, '3');
  const e15ok = await waitForEvidence(page, 'E-15');
  console.log('10. E-15 微信聊天(老公): ' + (e15ok ? pass('E-15') : fail('E-15 missing')));
  await back(page); // back from specific chat to chat list

  // === 微信 → 聊天记录 → 微信支付 → E-21 (7) ===
  await cmd(page, '7');
  const e21ok = await waitForEvidence(page, 'E-21');
  console.log('11. E-21 微信支付: ' + (e21ok ? pass('E-21') : fail('E-21 missing')));
  await back(page);

  // === 微信 → 小程序 → 炼健身小程序 → 授权 → 教练团队 → E-17 ===
  await back(page); // back from wechat.chat
  await back(page); // back from 微信
  // go back further to root to navigate cleanly
  await cmd(page, 'access');
  await page.waitForTimeout(1500);
  await enterSubmenu(page, '微信');
  await cmd(page, '2');  // 小程序
  // queue may have accumulated text from all previous steps; give it time to drain
  await page.waitForTimeout(15000);
  // First access to 小程序: game expects a search query, not a number
  await cmd(page, '炼健身');
  // Wait for displayChoice to render buttons (input gets disabled when choice is active)
  await page.waitForFunction(() => {
    const inp = document.querySelector('#command-input');
    return inp && inp.disabled === true;
  }, { timeout: 180000 }).catch(() => {});
  const authState = await page.evaluate(() => {
    const gs = typeof game !== 'undefined' ? game.getState() : null;
    return { nav: gs?._navContext, authed: gs?.miniProgramAuthed, btnCount: document.querySelectorAll('.choice-button:not([disabled])').length, inpDisabled: document.querySelector('#command-input')?.disabled };
  });
  console.log('12. Auth state: nav=' + authState.nav + ' authed=' + authState.authed + ' enabledBtns=' + authState.btnCount + ' inpDisabled=' + authState.inputDisabled);
  await clickChoice(page, '确认授权');
  // After auth, nav is wechat.mprog with menu items: 1=基本信息, 2=教练团队, 3=我的课程
  await cmd(page, '2');  // 教练团队
  const e17ok = await waitForEvidence(page, 'E-17');
  console.log('12. E-17 教练团队: ' + (e17ok ? pass('E-17') : fail('E-17 missing')));
  // Wait for async wechat.mprog.2 handler to complete (gymAdminDiscovered set after ui.printDialogue drains queue)
  await page.waitForFunction(() => {
    const gs = typeof game !== 'undefined' ? game.getState() : null;
    return gs && gs.gymAdminDiscovered === true;
  }, { timeout: 120000 }).catch(() => {});
  await back(page);

  // === 微信 → 小程序 → 炼健身管理后台 → login ===
  await back(page);
  await back(page);
  await enterSubmenu(page, '微信');
  await cmd(page, '2');  // 小程序
  await cmd(page, '2');  // 炼健身管理后台 changes navContext to gym_login
  await page.waitForTimeout(500);
  await cmd(page, 'zoudaxiong');
  await page.waitForTimeout(500);
  await cmd(page, '7753');
  const loginOk = await page.waitForFunction(() => {
    const gs = typeof game !== 'undefined' ? game.getState() : null;
    return gs && gs.gymAdminUnlocked === true;
  }, { timeout: 60000 }).then(() => true).catch(() => false);
  // let typewriter render the login confirmation text
  await page.waitForTimeout(3000);
  console.log('13. Gym admin login: ' + (loginOk ? pass('管理后台已登录') : fail('管理后台未登录')));
  await back(page);
  await back(page);
  await back(page);

  // === 相册 → 借条 → E-13 ===
  await enterSubmenu(page, '相册');
  await cmd(page, '1');
  const e13ok = await waitForEvidence(page, 'E-13');
  console.log('14. E-13 借条: ' + (e13ok ? pass('E-13') : fail('E-13 missing')));

  // === 相册 → WiFi 视频 → E-14 + 健身房 system unlock ===
  await cmd(page, '2');
  const e14ok = await waitForEvidence(page, 'E-14');
  console.log('15. E-14 WiFi 视频: ' + (e14ok ? pass('E-14') : fail('E-14 missing')));
  await back(page);

  // === 微信 → 小程序 → 炼健身管理后台 → 门禁记录 → E-18 ===
  await enterSubmenu(page, '微信');
  await cmd(page, '2');  // 小程序
  await cmd(page, '2');  // 炼健身管理后台
  await page.waitForTimeout(2000);
  await cmd(page, '1');  // 门禁记录
  const e18ok = await waitForEvidence(page, 'E-18');
  console.log('16. E-18 健身房门禁: ' + (e18ok ? pass('E-18') : fail('E-18 missing')));

  // === 炼健身管理后台 → 监控记录 → E-19 ===
  await back(page);
  await cmd(page, '2');
  const e19ok = await waitForEvidence(page, 'E-19');
  console.log('17. E-19 健身房监控: ' + (e19ok ? pass('E-19') : fail('E-19 missing')));

  // === 炼健身管理后台 → Wi-Fi 日志 → E-20 ===
  await back(page);
  await cmd(page, '3');
  const e20ok = await waitForEvidence(page, 'E-20');
  console.log('18. E-20 WiFi/DNS: ' + (e20ok ? pass('E-20') : fail('E-20 missing')));
  await back(page);

  // === 炼健身管理后台 → DNS 日志 → SSID+密码登录 → E-22 ===
  await cmd(page, '4');
  await cmd(page, 'LJS_5G');
  await cmd(page, 'justdoit');
  await page.waitForTimeout(2000);
  const e22ok = await waitForEvidence(page, 'E-22', 15000);
  console.log('18.5. E-22 健身房DNS: ' + (e22ok ? pass('E-22') : fail('E-22 missing')));
  await back(page);
  await back(page);

  // === 信用查询 → 输入姓名+手机号 → E-09 ===
  await enterSubmenu(page, '信用查询');
  // Wait for showNavMenu to set _creditQuery (delayed by typewriter queue backlog)
  await page.waitForFunction(() => {
    const gs = typeof game !== 'undefined' ? game.getState() : null;
    return gs && gs._creditQuery === true;
  }, { timeout: 180000 }).catch(() => {});
  await cmd(page, '邹大雄 138xxxx7753');
  const e09ok = await waitForEvidence(page, 'E-09');
  console.log('19. E-09 教练信用: ' + (e09ok ? pass('E-09') : fail('E-09 missing')));
  // Wait for async handleCreditQuery to complete (sets _navContext = null after await)
  await page.waitForFunction(() => {
    const gs = typeof game !== 'undefined' ? game.getState() : null;
    return gs && gs._navContext === null;
  }, { timeout: 180000 }).catch(() => {});

  // === 信用查询 → 郑桥信用 → E-10 ===
  await enterSubmenu(page, '信用查询');
  await page.waitForFunction(() => {
    const gs = typeof game !== 'undefined' ? game.getState() : null;
    return gs && gs._creditQuery === true;
  }, { timeout: 180000 }).catch(() => {});
  await cmd(page, '郑桥 189xxxx6629');
  const e10ok = await waitForEvidence(page, 'E-10');
  console.log('20. E-10 郑桥信用: ' + (e10ok ? pass('E-10') : fail('E-10 missing')));
  await page.waitForFunction(() => {
    const gs = typeof game !== 'undefined' ? game.getState() : null;
    return gs && gs._navContext === null;
  }, { timeout: 180000 }).catch(() => {});

  // === 信用查询 → 网友信用 → E-11 ===
  await enterSubmenu(page, '信用查询');
  await page.waitForFunction(() => {
    const gs = typeof game !== 'undefined' ? game.getState() : null;
    return gs && gs._creditQuery === true;
  }, { timeout: 180000 }).catch(() => {});
  await cmd(page, '张英河 15xxxxxxxxx');
  const e11ok = await waitForEvidence(page, 'E-11', 20000);
  console.log('21. E-11 网友信用: ' + (e11ok ? pass('E-11') : fail('E-11 missing')));

  // === Combines ===
  async function doCombine(page, expr, cid) {
    await cmd(page, 'combine ' + expr);
    return await page.waitForFunction(id => {
      const gs = typeof game !== 'undefined' ? game.getState() : null;
      return gs && gs.combineUnlocked && gs.combineUnlocked.includes(id);
    }, cid, { timeout: 60000 }).then(() => true).catch(() => false);
  }
  const c1done = await doCombine(page, 'E-05+E-18', 'C-01');
  const c2done = await doCombine(page, 'E-12+E-19', 'C-02');
  const c3done = await doCombine(page, 'E-08+E-20', 'C-03');
  const c4done = await doCombine(page, 'E-09+E-13+E-22', 'C-04');
  console.log('22. Combines: C-01=' + c1done + ' C-02=' + c2done + ' C-03=' + c3done + ' C-04=' + c4done);

  // === Evidence count ===
  const evidenceState = await getState(page);
  const found = evidenceState.unlocked;
  const allE = ['E-01','E-02','E-03','E-04','E-05','E-06','E-07','E-08','E-09','E-10','E-11','E-12','E-13','E-14','E-15','E-16','E-17','E-18','E-19','E-20','E-21','E-22'];
  const missing = allE.filter(e => !found.includes(e));
  console.log('23. Evidence: ' + found.length + '/' + allE.length + ', missing: ' + (missing.join(', ') || 'NONE'));

  console.log('\n=== QA SUMMARY ===');
  console.log('Evidence: ' + (missing.length === 0 ? '✅ PASS (' + found.length + '/' + allE.length + ')' : '⚠️  PARTIAL (' + found.length + '/' + allE.length + ') missing: ' + missing.join(', ')));
  console.log('Combines: ' + ((c1done && c2done && c3done && c4done) ? '✅ PASS (4/4)' : '⚠️  PARTIAL (C-01=' + c1done + ' C-02=' + c2done + ' C-03=' + c3done + ' C-04=' + c4done + ')'));
  console.log('JS errors: ' + (jsErrors.length === 0 ? '✅ NONE' : '❌ ' + jsErrors.length + ' errors'));
  if (jsErrors.length > 0) {
    console.log('Error details:');
    jsErrors.slice(0, 5).forEach((e, i) => console.log('  [' + i + '] ' + e.substring(0, 200)));
  }
  console.log('=== END ===');

  await browser.close();
})();
