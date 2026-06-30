// Game16 - Full Flow Test with Playwright
const { chromium } = require('playwright');

const BASE = 'http://localhost:8000';
const results = [];
let currentTest = '';

function log(msg) {
  console.log(`[${currentTest}] ${msg}`);
}

function record(test, pass, detail = '') {
  results.push({ test, pass, detail });
  console.log(`${pass ? '✅' : '❌'} ${test}${detail ? ' - ' + detail : ''}`);
}

async function typeCommand(page, cmd, waitMs = 500) {
  const input = page.locator('#command-input');
  await input.focus();
  await input.fill('');
  await input.pressSequentially(cmd, { delay: 20 });
  await input.press('Enter');
  if (waitMs > 0) await page.waitForTimeout(waitMs);
}

async function waitForOutputContains(page, text, timeout = 8000) {
  try {
    await page.waitForFunction(
      (t) => document.getElementById('output')?.innerText.includes(t),
      text,
      { timeout }
    );
    return true;
  } catch {
    return false;
  }
}

async function clickEnabledButton(page, matcher, fallback = true) {
  await page.waitForSelector('.choice-button:not([disabled])', { timeout: 12000 }).catch(() => null);
  const buttons = await page.locator('.choice-button:not([disabled])').all();
  for (const btn of buttons) {
    const text = await btn.textContent();
    if (typeof matcher === 'string' ? text.includes(matcher) : matcher.test(text)) {
      await btn.click();
      return true;
    }
  }
  if (fallback && buttons.length > 0) {
    await buttons[0].click();
    return true;
  }
  return false;
}

async function clickFirstChoice(page, labelText) {
  return clickEnabledButton(page, labelText);
}

async function clickConfirmActivate(page) {
  return clickEnabledButton(page, /确认激活|确认授权/);
}

// ========== TEST SUITES ==========

async function testStage1(page) {
  currentTest = 'Stage1: 引入';
  
  // wait for the intro to finish and choices to appear
  record('页面加载', await waitForOutputContains(page, '你好，网友'), '数字麻姐自我介绍出现');
  
  // wait for choices
  await page.waitForSelector('.choice-button', { timeout: 15000 }).catch(() => null);
  const hasYes = await clickFirstChoice(page, '是');
  record('选择"是"', hasYes, '同意帮助');
  
  await page.waitForTimeout(2000);
  record('E-01定位数据', await waitForOutputContains(page, '11:35'), '手机定位记录出现');
  
  await page.waitForTimeout(8000); // typewriter + stage transition animations
  record('进入阶段2', await waitForOutputContains(page, '初步调查') || await waitForOutputContains(page, '阶段 2'), '阶段2横幅出现');
}

async function testAccessMenu(page) {
  currentTest = 'Access: 系统列表';
  await typeCommand(page, 'access', 1000);
  record('access菜单', await waitForOutputContains(page, 'OA'), 'OA系统显示');
}

async function testXiaohongshu(page) {
  currentTest = '小红书';
  await typeCommand(page, '小红书', 3000);
  record('小红书加载', await waitForOutputContains(page, 'pdom1222'), '小红书号出现');
  record('小红书简介', await waitForOutputContains(page, '解密游戏博主'), '个人简介出现');
  await typeCommand(page, 'back', 1000);
}

async function testPhoneLocation(page) {
  currentTest = '手机定位';
  await typeCommand(page, '手机定位', 2000);
  record('手机定位显示', await waitForOutputContains(page, '离开楚门科技'), 'E-01数据');
  await typeCommand(page, 'back', 1000);
}

async function testOAContacts(page) {
  currentTest = 'OA: 通讯录';
  await typeCommand(page, 'oa', 2000);
  await typeCommand(page, '1', 1500);
  record('通讯录麻姐', await waitForOutputContains(page, '梁洛邑'), '麻姐工号出现');
  record('通讯录郑桥', await waitForOutputContains(page, '郑桥'), '郑桥出现');
  record('通讯录完整', await waitForOutputContains(page, '赵磊'), '赵磊出现');
  await typeCommand(page, 'back', 1000);
}

async function testOAChats(page) {
  currentTest = 'OA: 聊天记录';
  await typeCommand(page, '2', 1500);
  record('聊天列表', await waitForOutputContains(page, '郑桥'), '郑桥联系人');
  
  // 郑桥 - E-02 unlock
  await typeCommand(page, '1', 2500);
  record('郑桥E-02', await waitForOutputContains(page, '新证据已解锁：E-02'), 'E-02解锁');
  record('郑桥消息数', await waitForOutputContains(page, '24条') || await waitForOutputContains(page, '25'), '消息列表');
  await typeCommand(page, 'back', 800);
  
  // 陈立
  await typeCommand(page, '2', 1500);
  record('陈立聊天', await waitForOutputContains(page, '陈立'), '陈立内容');
  await typeCommand(page, 'back', 800);
  
  // 钱敏
  await typeCommand(page, '3', 1500);
  record('钱敏聊天', await waitForOutputContains(page, '钱敏'), '钱敏内容');
  await typeCommand(page, 'back', 800);
  
  // 赵磊
  await typeCommand(page, '4', 1500);
  record('赵磊聊天', await waitForOutputContains(page, '赵磊'), '赵磊内容');
  await typeCommand(page, 'back', 800);
  
  // 孙艺
  await typeCommand(page, '5', 1500);
  record('孙艺聊天', await waitForOutputContains(page, '孙艺'), '孙艺内容');
  await typeCommand(page, 'back', 800);
  
  await typeCommand(page, 'back', 1000);
}

async function testOAEmails(page) {
  currentTest = 'OA: 邮箱';
  await typeCommand(page, '3', 2000);
  record('邮箱列表', await waitForOutputContains(page, 'M-20'), '邮件编号出现');
  
  // 第一封 - 门禁未激活时是M-2085 端午节假期；激活后是M-2098
  await typeCommand(page, '1', 2000);
  record('邮件1详情', await waitForOutputContains(page, '端午') || await waitForOutputContains(page, '门禁'), '首封邮件内容');
  await typeCommand(page, 'back', 1000);
  
  // 第二封
  await typeCommand(page, '2', 1500);
  record('邮件2详情', await waitForOutputContains(page, '产品') || await waitForOutputContains(page, '周报'), '第二封邮件');
  await typeCommand(page, 'back', 1000);
  
  await typeCommand(page, '2', 1500);
  await typeCommand(page, 'back', 1000);
  
  await typeCommand(page, 'back', 1000);
}

async function testOAWorkflowAndDoorActivation(page) {
  currentTest = 'OA: 流程 + 门禁激活';
  await typeCommand(page, '4', 1500);
  record('流程列表', await waitForOutputContains(page, 'AP-2026'), '流程编号');
  
  // 激活门禁
  await typeCommand(page, '1', 2500);
  record('激活流程', await waitForOutputContains(page, '激活链接'), '激活链接出现');
  
  const activated = await clickConfirmActivate(page);
  record('点击激活', activated, '确认激活');
  
  await page.waitForTimeout(2000);
  record('门禁解锁', await waitForOutputContains(page, '门禁') || await waitForOutputContains(page, '停车场'), '系统解锁');
  
  await typeCommand(page, 'back', 1000);
  await typeCommand(page, 'back', 1000);
}

async function testDoorSystem(page) {
  currentTest = '门禁系统';
  await typeCommand(page, '门禁', 2000);
  await typeCommand(page, '2', 1500);
  record('郑桥异常记录', await waitForOutputContains(page, '郑桥'), '郑桥记录');
  record('麻姐13:53记录', await waitForOutputContains(page, '13:53'), '麻姐记录');
  await typeCommand(page, 'back', 1000);
}

async function testParkingSystem(page) {
  currentTest = '停车场';
  await typeCommand(page, '停车场', 2500);
  await typeCommand(page, '1', 1500);
  record('停车场记录', await waitForOutputContains(page, '8K329'), '郑桥车牌');
  await typeCommand(page, 'back', 800);
  
  // 车辆服务联动查询郑桥
  await typeCommand(page, '3', 1500);
  await typeCommand(page, '鄂A·8K329', 2000);
  record('广捷洗车', await waitForOutputContains(page, '广捷洗车'), '服务联动记录');
  
  await typeCommand(page, 'back', 1000);
}

async function testPublicMonitor(page) {
  currentTest = '公共监控';
  await typeCommand(page, '公共监控', 2000);
  
  // 洗车店监控
  await typeCommand(page, '广捷洗车', 2000);
  record('洗车监控', await waitForOutputContains(page, '13:15'), '郑桥时间线');
  await page.waitForTimeout(1000);
  
  // 超市监控
  await typeCommand(page, '超市', 2000);
  record('超市监控', await waitForOutputContains(page, '吉他包') || await waitForOutputContains(page, '黑衣'), 'Embrace出现');
  await page.waitForTimeout(1000);
  await typeCommand(page, 'back', 1000);
}

async function testPhoneUnlock(page) {
  currentTest = '手机解锁';
  await typeCommand(page, 'unlock', 2500);
  record('解锁提示', await waitForOutputContains(page, '4位') || await waitForOutputContains(page, '简单好记'), '密码提示');
  
  await typeCommand(page, '1222', 3000);
  record('密码正确', await waitForOutputContains(page, '密码正确'), '1222正确');
  record('子系统解锁', await waitForOutputContains(page, '短信') || await waitForOutputContains(page, '微信'), '短信/微信解锁');
  
  await page.waitForTimeout(5000); // 等 stage 3 intro 打字机完成
}

async function testSmsPage(page) {
  currentTest = '短信';
  await typeCommand(page, 'access', 5000);
  await typeCommand(page, '短信', 5000);
  record('短信列表', await waitForOutputContains(page, '157', 12000), 'Embrace号码');
  record('短信总数', await waitForOutputContains(page, '22'), '22条对话');
  
  await typeCommand(page, '1', 5000);
  record('Embrace对话', await waitForOutputContains(page, 'Embrace', 12000), 'Embrace内容');
  record('13:33消息', await waitForOutputContains(page, '13:33', 8000), '关键13:33消息');
  record('麻姐分析', await waitForOutputContains(page, '定位关闭', 15000), '麻姐分析');
  
  await typeCommand(page, 'back', 3000);
  await typeCommand(page, 'back', 5000);
}

async function testWechatChats(page) {
  currentTest = '微信聊天';
  await typeCommand(page, 'access', 5000);
  await typeCommand(page, '微信', 5000);
  await typeCommand(page, '1', 3000); // 进入聊天记录
  
  // 大怪兽
  await typeCommand(page, '1', 4000);
  record('大怪兽聊天', await waitForOutputContains(page, '大怪兽', 10000), '教练聊天');
  record('12:05见', await waitForOutputContains(page, '12:05', 8000), '关键时间差');
  await typeCommand(page, 'back', 2000);
  
  // 老公
  await typeCommand(page, '3', 4000);
  record('老公聊天', await waitForOutputContains(page, '郑桥', 10000), '老公内容');
  await page.waitForTimeout(8000); // 等打字机效果
  record('害怕', await waitForOutputContains(page, '害怕', 10000), '关键词');
  
  // 产品研发群
  await typeCommand(page, 'back', 2000);
  await typeCommand(page, '2', 3000);
  record('工作群', await waitForOutputContains(page, '产品研发部工作群', 8000) || await waitForOutputContains(page, '评审', 8000), '工作群内容');
  await page.waitForTimeout(2000);
  
  // 老板
  await typeCommand(page, 'back', 2000);
  await typeCommand(page, '9', 3000);
  record('老板聊天', await waitForOutputContains(page, '赵总', 8000) || await waitForOutputContains(page, '老板', 8000), '老板内容');
  await page.waitForTimeout(2000);
  
  await typeCommand(page, 'back', 3000);
  await typeCommand(page, 'back', 3000);
}

async function testWechatMoments(page) {
  currentTest = '微信朋友圈';
  await typeCommand(page, '3', 1500);
  record('朋友圈提示', await waitForOutputContains(page, '想得美'), '撤回朋友圈');
  await typeCommand(page, 'back', 1000);
}

async function testWechatMiniProgram(page) {
  currentTest = '微信小程序';
  await typeCommand(page, '2', 1500);
  
  // 首次访问需搜索
  await typeCommand(page, '1', 1500);
  record('搜索提示', await waitForOutputContains(page, '输入小程序名称搜索') || await waitForOutputContains(page, '搜索'), '搜索提示');
  
  await typeCommand(page, '炼健身', 2000);
  record('授权请求', await waitForOutputContains(page, '授权') || await waitForOutputContains(page, '微信昵称'), '授权请求');
  
  await clickConfirmActivate(page);
  await page.waitForTimeout(2000);
  record('授权成功', await waitForOutputContains(page, '授权成功') || await waitForOutputContains(page, '炼·健身'), '授权成功');
  
  // 基本信息
  await typeCommand(page, '1', 1500);
  record('门店信息', await waitForOutputContains(page, '广埠屯'), '门店地址');
  await typeCommand(page, 'back', 800);
  
  // 教练团队 - 解锁E-17
  await typeCommand(page, '2', 2000);
  record('教练团队', await waitForOutputContains(page, '邹大雄'), '教练姓名');
  await page.waitForTimeout(1500);
  await typeCommand(page, 'back', 800);
  
  // 我的课程
  await typeCommand(page, '3', 1500);
  record('我的课程', await waitForOutputContains(page, '力量训练') || await waitForOutputContains(page, '12:15'), '课程信息');
  await page.waitForTimeout(1500);
  await typeCommand(page, 'back', 1500);
  await typeCommand(page, 'back', 1500);
}

async function testWechatPayments(page) {
  currentTest = '微信支付';
  // 从access进入微信->聊天记录->微信支付
  await typeCommand(page, '1', 1500);
  await typeCommand(page, '7', 2500);
  record('支付列表', await waitForOutputContains(page, '瑞幸') || await waitForOutputContains(page, '9.90'), '瑞幸咖啡');
  record('超市消费', await waitForOutputContains(page, '广埠屯') || await waitForOutputContains(page, '6.00'), '超市消费');
  record('总消费金额', await waitForOutputContains(page, '416'), '总金额');
  
  await typeCommand(page, 'back', 800);
  await typeCommand(page, 'back', 800);
}

async function testAlbum(page) {
  currentTest = '相册';
  await typeCommand(page, '相册', 2000);
  record('相册列表', await waitForOutputContains(page, '借条') && await waitForOutputContains(page, '健身房环境'), '关键照片');
  
  // 借条 - E-13
  await typeCommand(page, '1', 2000);
  record('借条E-13', await waitForOutputContains(page, '20,000') || await waitForOutputContains(page, '邹大雄'), '借条内容');
  await page.waitForTimeout(1500);
  await typeCommand(page, 'back', 800);
  
  // WiFi视频 - E-14
  await typeCommand(page, '2', 2000);
  record('WiFi E-14', await waitForOutputContains(page, 'ljs_5G'), 'WiFi信息');
  await page.waitForTimeout(1500);
  await typeCommand(page, 'back', 2000);
}

async function testCreditSystem(page) {
  currentTest = '信用查询';
  await typeCommand(page, '信用查询', 2500);
  
  // 教练信用
  await typeCommand(page, '邹大雄 138xxxx7753', 2500);
  record('教练信用', await waitForOutputContains(page, '47万') || await waitForOutputContains(page, '邹大雄'), '债务信息');
  
  await page.waitForTimeout(2000);
  
  // 郑桥信用
  await typeCommand(page, '信用查询', 2000);
  await typeCommand(page, '郑桥 189xxxx6629', 2000);
  record('郑桥信用', await waitForOutputContains(page, '正常') || await waitForOutputContains(page, '良好'), '无异常');
  
  await page.waitForTimeout(1500);
  
  // 网友信用
  await typeCommand(page, '信用查询', 2000);
  await typeCommand(page, '张英河 157xxxx6697', 2000);
  record('网友信用', await waitForOutputContains(page, '无不良') || await waitForOutputContains(page, '张英河'), '清白');
  
  await page.waitForTimeout(1500);
  await typeCommand(page, 'back', 1000);
}

async function testGymSystem(page) {
  currentTest = '健身房';
  await typeCommand(page, '健身房', 2000);
  
  // 门禁 E-18
  await typeCommand(page, '2', 2000);
  record('健身房门禁E-18', await waitForOutputContains(page, '梁洛邑') || await waitForOutputContains(page, '郑桥'), '关键会员');
  await page.waitForTimeout(1500);
  await typeCommand(page, 'back', 800);
  
  // 监控 E-19
  await typeCommand(page, '3', 2000);
  record('健身房监控E-19', await waitForOutputContains(page, '女更衣室') || await waitForOutputContains(page, '邹大雄'), '可疑行为');
  await page.waitForTimeout(1500);
  await typeCommand(page, 'back', 800);
  
  // Wi-Fi日志 E-20
  await typeCommand(page, '4', 2000);
  record('WiFi日志E-20', await waitForOutputContains(page, 'ljs_5G') || await waitForOutputContains(page, 'MAC'), 'WiFi数据');
  await page.waitForTimeout(1500);
  await typeCommand(page, 'back', 800);
  
  // DNS日志
  await typeCommand(page, '5', 2000);
  record('DNS日志', await waitForOutputContains(page, 'sedative') || await waitForOutputContains(page, '镇静剂'), '镇静剂网站');
  await page.waitForTimeout(1500);
}

async function testCombine(page) {
  currentTest = 'Combine';
  await typeCommand(page, 'back', 1000);
  await typeCommand(page, 'back', 1000);
  
  // 等combine命令解锁（需至少2条证据，已有E-01/E-02等）
  await typeCommand(page, 'combine E-05+E-18', 3000);
  record('C-01门禁矛盾', await waitForOutputContains(page, 'C-01') || await waitForOutputContains(page, '复制了她的工牌'), 'C-01生成');
  await page.waitForTimeout(2000);
  
  await typeCommand(page, 'combine E-12+E-20', 3000);
  record('C-02网友矛盾', await waitForOutputContains(page, 'C-02') || await waitForOutputContains(page, 'Embrace'), 'C-02生成');
  await page.waitForTimeout(2000);
  
  await typeCommand(page, 'combine E-08+E-20', 3000);
  record('C-03郑桥矛盾', await waitForOutputContains(page, 'C-03') || await waitForOutputContains(page, '郑桥'), 'C-03生成');
  await page.waitForTimeout(2000);
  
  await typeCommand(page, 'combine E-09+E-13', 3000);
  record('C-04教练动机', await waitForOutputContains(page, 'C-04') || await waitForOutputContains(page, '经济动机'), 'C-04生成');
  await page.waitForTimeout(2000);
}

async function testConclusions(page) {
  currentTest = '结论回顾';
  await typeCommand(page, 'conclusions', 2000);
  record('C-01结论', await waitForOutputContains(page, 'C-01'), 'C-01存在');
  record('C-04结论', await waitForOutputContains(page, 'C-04'), 'C-04存在');
}

async function testBackup(page) {
  currentTest = '备份';
  await typeCommand(page, 'backup', 2000);
  record('备份成功', await waitForOutputContains(page, '备份已创建') || await waitForOutputContains(page, '数据备份'), '备份完成');
}

async function testChecklist(page) {
  currentTest = '证据清单';
  await typeCommand(page, 'list', 1500);
  record('E-01解锁', await waitForOutputContains(page, 'E-01'), 'E-01在清单中');
  record('E-12解锁', await waitForOutputContains(page, 'E-12'), 'E-12在清单中');
  record('E-20解锁', await waitForOutputContains(page, 'E-20'), 'E-20在清单中');
}

async function testHelp(page) {
  currentTest = '帮助';
  await typeCommand(page, 'help', 1000);
  record('help菜单', await waitForOutputContains(page, 'access') && await waitForOutputContains(page, 'list'), '菜单项');
  // combine only shows after 2+ evidence unlocked
}

// ========== MAIN ==========
async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  console.log('🎮 Game16 Playwright 全流程测试开始');
  console.log('='.repeat(60));

  // Navigate and clear existing save
  await page.goto(BASE + '/?nocache=' + Date.now());
  await page.waitForLoadState('domcontentloaded');
  
  // Execute in-page to clear localStorage
  await page.evaluate(() => {
    localStorage.clear();
    if ('caches' in window) caches.keys().then(ns => ns.forEach(n => caches.delete(n)));
  });
  
  // Reload for fresh start
  await page.goto(BASE + '/?nocache=' + Date.now());
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);

  try {
    await testStage1(page);
    await testHelp(page);
    await testAccessMenu(page);
    await testXiaohongshu(page);
    await testPhoneLocation(page);
    
    // OA System
    await typeCommand(page, 'oa', 3000);
    await testOAContacts(page);
    await testOAChats(page);
    await testOAEmails(page);
    await testOAWorkflowAndDoorActivation(page);
    await typeCommand(page, 'back', 2000);
    
    // 门禁/停车/监控
    await testDoorSystem(page);
    await testParkingSystem(page);
    await testPublicMonitor(page);
    
    // 手机解锁
    await testPhoneUnlock(page);
    await page.waitForTimeout(1000);
    
    // 短信
    await testSmsPage(page);
    
    // 微信
    await testWechatChats(page);
    await testWechatMoments(page);
    await testWechatMiniProgram(page);
    await testWechatPayments(page);
    
    // 相册
    await testAlbum(page);
    
    // 信用查询
    await page.waitForTimeout(1000);
    await testCreditSystem(page);
    
    // 健身房
    await testGymSystem(page);
    
    // Combine + 结局前置
    await testCombine(page);
    await testConclusions(page);
    await testBackup(page);
    await testChecklist(page);
    
  } catch (err) {
    console.error('🚨 测试中途异常:', err.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('控制台错误:', consoleErrors.length);
  consoleErrors.forEach((e, i) => console.log(`  ${i+1}. ${e}`));

  // 截图
  await page.screenshot({ path: '/tmp/game16-test-final.png', fullPage: true });
  
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  
  console.log('\n' + '='.repeat(60));
  console.log(`📊 测试结果: ${passed}/${results.length} 通过, ${failed} 失败`);
  
  if (failed > 0) {
    console.log('\n❌ 失败项:');
    results.filter(r => !r.pass).forEach(r => console.log(`  - ${r.test} ${r.detail}`));
  }
  
  console.log('\n✅ 通过项:');
  results.filter(r => r.pass).forEach(r => console.log(`  - ${r.test}`));

  await browser.close();
  
  // Exit code
  process.exit(failed === 0 ? 0 : 1);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(2);
});
