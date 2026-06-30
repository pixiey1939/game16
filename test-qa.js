// Targeted QA test for E-05 anomaly + mini program search flow
const { chromium } = require('playwright');

const BASE = 'http://localhost:8000';
const results = [];
let currentTest = '';

function record(test, pass, detail = '') {
  results.push({ test, pass, detail });
  console.log(`${pass ? '✅' : '❌'} ${test}${detail ? ' — ' + detail : ''}`);
}

async function typeCmd(page, cmd, waitMs = 800) {
  const input = page.locator('#command-input');
  await input.focus();
  await input.fill('');
  await input.pressSequentially(cmd, { delay: 10 });
  await input.press('Enter');
  if (waitMs > 0) await page.waitForTimeout(waitMs);
}

async function waitForText(page, text, timeout = 12000) {
  try {
    await page.waitForFunction(
      (t) => document.getElementById('output')?.innerText.includes(t),
      text, { timeout }
    );
    return true;
  } catch { return false; }
}

async function clickEnabled(page, matcher) {
  await page.waitForSelector('.choice-button:not([disabled])', { timeout: 12000 }).catch(() => null);
  const btns = await page.locator('.choice-button:not([disabled])').all();
  for (const b of btns) {
    const t = await b.textContent();
    if (typeof matcher === 'string' ? t.includes(matcher) : matcher.test(t)) {
      await b.click(); return true;
    }
  }
  return false;
}

// ===== QA 1: E-05 anomaly text =====
async function testE05Anomaly(page) {
  currentTest = 'E-05异常分析';
  await typeCmd(page, 'access', 5000);
  await typeCmd(page, 'oa', 5000);

  // 进入流程 → 激活门禁
  await typeCmd(page, '4', 3000);
  await typeCmd(page, '1', 8000);
  await clickEnabled(page, '确认激活');
  await page.waitForTimeout(3000);

  // 进入门禁系统，查看异常记录
  await typeCmd(page, 'back', 3000);
  await typeCmd(page, 'back', 3000);
  await typeCmd(page, 'back', 3000);
  await typeCmd(page, 'back', 3000);
  await typeCmd(page, '门禁系统', 5000);
  await typeCmd(page, '2', 5000); // 异常记录
  await page.waitForTimeout(5000); // 等打字机动画

  const output = await page.locator('#output').innerText();

  const lines = output.split('\n').filter(l => l.includes('郑桥') || l.includes('离开') || l.includes('去向') || l.includes('12:48') || l.includes('13:53') || l.includes('异常') || l.includes('刷卡'));
  console.log('  [调试 E-05 关键输出，共 ' + lines.length + ' 行]');
  lines.forEach(l => console.log('    > ' + l));

  const last50 = output.slice(-500);
  console.log('  [末尾 500 字符]');
  console.log('    ' + last50.replace(/\n/g, '\n    '));

  // ✅ E-05 anomaly should NOT contain "13:08 郑桥手机出现在健身房"
  const noGymRef = !output.includes('13:08 郑桥手机出现在健身房');
  record('E-05不含"13:08健身房WiFi"推测', noGymRef, noGymRef ? '已去除' : '仍包含该推测');

  const noGymRef2 = !output.includes('距离公司到健身房车程');
  record('E-05不含"健身房车程5分钟"推测', noGymRef2, noGymRef2 ? '已去除' : '仍包含该推测');

  const hasCleanAnomaly = output.includes('去向不明');
  record('E-05含"去向不明"', hasCleanAnomaly, hasCleanAnomaly ? '合理描述' : '缺失');

  // 也检查 evidence.js analysis 字段（通过 getEvidenceAnalysis 验证）
  const evidenceAnalysis = await page.evaluate(() => EVIDENCE['E-05'].content.analysis);
  const evidenceHasGym = evidenceAnalysis.includes('健身房');
  record('E-05 evidence.analysis不含"健身房"', !evidenceHasGym, !evidenceHasGym ? '已去除' : '仍包含');
}

// ===== QA 2: 微信小程序首次访问流程 =====
async function testMiniProgramFlow(page) {
  currentTest = '小程序首次访问流程';

  await typeCmd(page, 'back', 3000);

  // 必须先解锁手机（密码 1222），微信系统才会解锁
  await typeCmd(page, 'unlock', 3000);
  await typeCmd(page, '1222', 5000);
  await page.waitForTimeout(8000); // 等 Stage3 intro 打字机完成

  // 回到 access 菜单，再进入微信
  await typeCmd(page, 'access', 5000);
  await typeCmd(page, '微信', 5000);
  await waitForText(page, '聊天记录', 10000);
  await typeCmd(page, '2', 5000); // 选择"小程序"
  await page.waitForTimeout(3000);

  const output1 = await page.locator('#output').innerText();
  record('小程序菜单不显示"炼健身小程序"', !output1.includes('1. 炼健身小程序') && !output1.includes('[1] 炼健身小程序'),
        '进入小程序直接是搜索界面');
  record('显示"请输入小程序名称搜索"', output1.includes('请输入小程序名称搜索'),
        '搜索提示正确');

  await typeCmd(page, '炼健身', 3000);

  const output2 = await page.locator('#output').innerText();
  console.log('  [调试 output2 最后 400 字符]');
  console.log('    ' + output2.slice(-400).replace(/\n/g, '\n    '));
  record('输入"炼健身"显示授权请求', output2.includes('授权请求') || output2.includes('微信昵称'),
        '触发授权流程');
  record('输入"炼健身"显示小程序名', output2.includes('炼·健身'),
        '显示小程序名称');

  const buttonCount = await page.locator('.choice-button:not([disabled])').count();
  console.log('  [调试] 授权按钮数量: ' + buttonCount);
  const allButtons = await page.locator('.choice-button').allTextContents();
  console.log('  [调试] 全部按钮: ' + JSON.stringify(allButtons));

  // 确认授权
  const authClicked = await clickEnabled(page, '确认授权');
  record('点击"确认授权"', authClicked, '授权按钮可点击');

  await page.waitForTimeout(8000);
  const output3 = await page.locator('#output').innerText();
  record('授权成功', output3.includes('授权成功'),
        '授权成功消息');

  // 测试 back 导航：从微信 → 小程序 → back 应返回到微信
  await typeCmd(page, 'back', 3000); // 从 mprog 返回 wechat.apps
  await page.waitForTimeout(2000);
  const output_back1 = await page.locator('#output').innerText();
  record('授权后back到小程序菜单', output_back1.includes('请输入小程序名称搜索'),
        '应回到小程序搜索界面');

  // 从 wechat.apps 返回 微信
  await typeCmd(page, 'back', 3000);
  await page.waitForTimeout(2000);
  const output_back2 = await page.locator('#output').innerText();
  const backToWechat = output_back2.includes('聊天记录') && output_back2.includes('小程序') && output_back2.includes('朋友圈');
  record('从小程序back到微信菜单', backToWechat, '应回到微信主菜单');

  await typeCmd(page, '2', 5000);
  await page.waitForTimeout(2000);
  const output_revisit = await page.locator('#output').innerText();
  const showsMenuDirectly = output_revisit.includes('1. 炼健身小程序') || output_revisit.includes('[1] 炼健身小程序');
  record('已授权后再次进入小程序直接显示菜单', showsMenuDirectly,
        '应直接显示小程序菜单，不需搜索');

  await typeCmd(page, '1', 5000);
  await page.waitForTimeout(2000);
  const output_mp = await page.locator('#output').innerText();
  record('已授权后输入1进入小程序', output_mp.includes('基本信息') || output_mp.includes('教练团队') || output_mp.includes('课程'),
        '应进入小程序菜单');

  await typeCmd(page, 'back', 3000);
  await page.waitForTimeout(2000);

  await typeCmd(page, 'clear confirm', 5000);
  await page.waitForTimeout(2000);
  const output_clear = await page.locator('#output').innerText();
  record('小程序菜单中clear confirm不误触发搜索', !output_clear.includes('未找到该小程序'),
        'clear confirm应被识别为命令，不触发小程序搜索');
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

  console.log('🎮 QA: E-05修复 + 小程序流程\n');

  await page.goto(BASE + '/?nocache=' + Date.now());
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(() => { localStorage.clear(); });
  await page.goto(BASE + '/?nocache=' + Date.now());
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);

  try {
    // 阶段1: 进入游戏
    await waitForText(page, '你好，网友');
    await clickEnabled(page, '是');
    await page.waitForTimeout(12000);
    await waitForText(page, '初步调查', 20000);

    // QA 1
    await testE05Anomaly(page);

    // QA 2
    await testMiniProgramFlow(page);
  } catch (err) {
    console.error('🚨 异常:', err.message);
  }

  console.log('\n控制台错误: ' + errors.length);
  errors.forEach((e, i) => console.log('  ' + i + '. ' + e));

  const ok = results.filter(r => r.pass).length;
  const nok = results.filter(r => !r.pass).length;
  console.log('\n📊 总计: ' + results.length + ' 项, 通过 ' + ok + ', 失败 ' + nok);

  if (nok > 0) {
    console.log('\n❌ 失败:');
    results.filter(r => !r.pass).forEach(r => console.log('  - ' + r.test + ': ' + r.detail));
  }

  await browser.close();
  process.exit(nok === 0 ? 0 : 1);
}

main().catch(err => { console.error('Fatal:', err); process.exit(2); });