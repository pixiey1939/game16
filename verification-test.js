const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:8001');
  await page.waitForTimeout(1000);
  
  // Start game
  await page.click('text=是，我会帮你');
  await page.waitForTimeout(2000);
  
  console.log('====== Verification Tests ======\n');
  
  // Test 1: Check unlock command doesn't show 1222
  console.log('【Test 1: unlock 密码提示】');
  const helpOutput = await page.evaluate(async () => {
    ui.clear();
    command.dispatch('help');
    await new Promise(r => setTimeout(r, 100));
    return document.querySelector('#output').textContent;
  });
  console.log('unlock 命令显示:', helpOutput.includes('1222') ? '❌ 还有1222' : '✅ 已移除1222');
  
  // Test 2: Navigate to public monitoring
  console.log('\n【Test 2: 公共监控系统文本搜索】');
  
  // Manually unlock required systems
  await page.evaluate(() => {
    const state = game.getState();
    state.doorActivated = true;
    game.unlockEvidence('E-03');
    game.unlockSystem('门禁');
    game.unlockSystem('停车场');
    game.unlockSystem('公共监控系统');
  });
  
  ui.clear();
  await page.evaluate(() => {
    ui.clear();
    command.enterSystem('公共监控系统');
  });
  await page.waitForTimeout(500);
  
  const monitorOutput = await page.evaluate(() => document.querySelector('#output').textContent);
  console.log('搜索提示显示:', monitorOutput.includes('请输入商户名称') ? '✅ 正常' : '❌ 缺失');
  console.log('旧菜单选项:', monitorOutput.includes('[1]') && monitorOutput.includes('[2]') ? '❌ 还存在' : '✅ 已移除');
  
  // Test if search actually works
  if (monitorOutput.includes('请输入商户名称')) {
    ui.clear();
    await page.evaluate(() => {
      ui.clear();
      command.dispatch('超市');
    });
    await page.waitForTimeout(500);
    
    const searchOutput = await page.evaluate(() => document.querySelector('#output').textContent);
    const e07 = searchOutput.includes('E-07');
    const supermarket = searchOutput.includes('超市') || searchOutput.includes('惠选');
    console.log('搜索"超市"结果:', (e07 && supermarket) ? '✅ 正常显示E-07数据' : '❌ 无响应');
  }
  
  // Test 3: Separate door systems  
  console.log('\n【Test 3: 门禁系统独立性】');
  
  ui.clear();
  await page.evaluate(() => {
    ui.clear();
    command.enterSystem('门禁');
  });
  await page.waitForTimeout(500);
  
  const doorOutput = await page.evaluate(() => document.querySelector('#output').textContent);
  console.log('包含郑桥工牌记录:', doorOutput.includes('郑桥') ? '✅ 有' : '❌ 无');
  console.log('包含麻姐工牌记录:', doorOutput.includes('麻姐') || doorOutput.includes('梁洛邑') ? '✅ 有' : '❌ 无');
  console.log('包含健身房记录:', doorOutput.includes('健身房') ? '❌ 不该有' : '✅ 已分离');
  console.log('菜单选项:', doorOutput.includes('[1]') && doorOutput.includes('[2]') ? '✅ 有两个选项' : '❌ 选项异常');
  
  await browser.close();
  console.log('\n====== 验证完成 ======');
})();
