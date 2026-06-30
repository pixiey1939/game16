const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:8001');
  await page.waitForTimeout(1000);
  
  // Start game
  await page.click('text=是，我会帮你');
  await page.waitForTimeout(2000);
  
  console.log('=== Quick Test: Public Monitoring Search ===\n');
  
  // Manually unlock monitoring system for testing
  await page.evaluate(() => {
    const state = game.getState();
    state.doorActivated = true;
    game.unlockEvidence('E-03');
    game.unlockSystem('门禁');
    game.unlockSystem('停车场');
    game.unlockSystem('公共监控系统');
  });
  
  await page.fill('#command-input', 'access');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  
  let output = await page.textContent('#output');
  console.log('Access menu includes 公共监控:', output.includes('公共监控系统') ? '✅ Yes' : '❌ No');
  
  console.log('\n=== Navigate to public monitoring ===');
  await page.fill('#command-input', '公共监控');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  
  output = await page.textContent('#output');
  console.log('Search prompt visible:', output.includes('请输入商户名称') ? '✅ Yes' : '❌ No');
  
  if (output.includes('请输入商户名称')) {
    console.log('\n=== Test searching 超市 ===');
    await page.fill('#command-input', '超市');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    
    output = await page.textContent('#output');
    console.log('E-07 output visible:', output.includes('广埠屯惠选超市') ? '✅ Yes' : '❌ No');
    console.log('E-07 evidence mentioned:', output.includes('E-07') ? '✅ Yes' : '❌ No');
    
    console.log('\n=== List evidence ===');
    await page.fill('#command-input', 'list');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    
    output = await page.textContent('#output');
    console.log('E-07 in evidence list:', output.includes('E-07') ? '✅ Yes' : '❌ No');
  }
  
  await browser.close();
  console.log('\n✅ Test completed');
})();
