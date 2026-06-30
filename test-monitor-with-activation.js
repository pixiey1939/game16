const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Capture console errors
  const consoleMessages = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleMessages.push(msg.text());
    }
  });
  
  await page.goto('http://localhost:8001');
  await page.waitForTimeout(1000);
  
  // Start game
  await page.click('text=是，我会帮你');
  await page.waitForTimeout(2000);
  
  console.log('=== Step 1: Go to OA workflow ===');
  await page.fill('#command-input', 'oa');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  
  await page.fill('#command-input', '4');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  
  await page.fill('#command-input', '1');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
  
  let output = await page.textContent('#output');
  console.log('After OA workflow:', output.includes('门禁权限已激活') ? '✅ Activated' : '❌ Not activated');
  
  console.log('\n=== Step 2: Check access menu ===');
  await page.fill('#command-input', 'access');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  
  output = await page.textContent('#output');
  const accessSection = output.substring(output.lastIndexOf('当前可访问系统'));
  console.log('Access menu:');
  console.log(accessSection);
  
  console.log('\n=== Step 3: Go to parking system ===');
  await page.fill('#command-input', '停车场');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  
  output = await page.textContent('#output');
  console.log('Parking menu visible:', output.includes('车辆出入记录') ? '✅ Yes' : '❌ No');
  
  console.log('\n=== Step 4: Use service linkage ===');
  await page.fill('#command-input', '3');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  
  await page.fill('#command-input', '鄂A·8K329');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
  
  output = await page.textContent('#output');
  console.log('Public monitoring unlocked:', output.includes('公共监控系统') ? '✅ Yes' : '❌ No');
  
  console.log('\n=== Step 5: Access public monitoring ===');
  await page.fill('#command-input', 'access 公共监控');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  
  output = await page.textContent('#output');
  console.log('Monitoring prompt:', output.includes('请输入商户名称') ? '✅ Showing search prompt' : '❌ No search prompt');
  
  console.log('\n=== Step 6: Search 超市 ===');
  await page.fill('#command-input', '超市');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
  
  output = await page.textContent('#output');
  console.log('E-07 unlocked:', output.includes('E-07') ? '✅ Yes' : '❌ No');
  
  console.log('\n=== Console errors ===');
  if (consoleMessages.length === 0) {
    console.log('✅ No errors');
  } else {
    console.log('❌ Errors found:');
    consoleMessages.forEach(msg => console.log('  -', msg));
  }
  
  await browser.close();
  console.log('\n✅ Test completed');
})();
