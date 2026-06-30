const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
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
  
  console.log('=== Step 2: Click activation button ===');
  // Wait for the choice button to appear
  await page.waitForSelector('text=确认激活门禁权限', { timeout: 5000 });
  
  let outputBefore = await page.textContent('#output');
  console.log('Output before click includes activation link:', outputBefore.includes('激活链接') ? '✅ Yes' : '❌ No');
  
  await page.click('text=确认激活门禁权限');
  await page.waitForTimeout(2000);
  
  let output = await page.textContent('#output');
  console.log('Activation result checks:');
  console.log('  - Contains "门禁/停车场":', output.includes('门禁') && output.includes('停车场') ? '✅ Yes' : '❌ No');
  console.log('  - Contains "已解锁":', output.includes('已解锁') ? '✅ Yes' : '❌ No');
  console.log('  - Contains "解锁手机":', output.includes('解锁手机') ? '✅ Yes' : '❌ No');
  
  console.log('\n=== Step 3: Check access menu ===');
  // Wait for input to be enabled
  await page.waitForFunction(() => {
    const input = document.querySelector('#command-input');
    return input && !input.disabled;
  }, { timeout: 5000 });
  
  await page.fill('#command-input', 'access');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
  
  output = await page.textContent('#output');
  const accessSection = output.substring(output.lastIndexOf('当前可访问系统'));
  console.log('Access menu:');
  console.log(accessSection);
  
  console.log('\n=== Step 4: Go to parking system ===');
  await page.fill('#command-input', '停车场');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  
  output = await page.textContent('#output');
  console.log('Parking menu visible:', output.includes('车辆出入记录') ? '✅ Yes' : '❌ No');
  
  console.log('\n=== Step 5: Use service linkage ===');
  await page.fill('#command-input', '3');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  
  await page.fill('#command-input', '鄂A·8K329');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
  
  output = await page.textContent('#output');
  console.log('Public monitoring unlocked:', output.includes('公共监控系统') ? '✅ Yes' : '❌ No');
  
  console.log('\n=== Step 6: Access public monitoring ===');
  await page.fill('#command-input', 'access 公共监控');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  
  output = await page.textContent('#output');
  console.log('Monitoring prompt:', output.includes('请输入商户名称') ? '✅ Showing search prompt' : '❌ No search prompt');
  
  console.log('\n=== Step 7: Search 超市 ===');
  await page.fill('#command-input', '超市');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
  
  output = await page.textContent('#output');
  console.log('E-07 unlocked:', output.includes('E-07') ? '✅ Yes' : '❌ No');
  console.log('E-07 output:', output.includes('广埠屯惠选超市') ? '✅ Shows supermarket data' : '❌ No data');
  
  console.log('\n=== Step 8: Go back and search 洗车 ===');
  await page.fill('#command-input', 'back');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  
  await page.fill('#command-input', '洗车');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
  
  output = await page.textContent('#output');
  console.log('E-08 unlocked:', output.includes('E-08') ? '✅ Yes' : '❌ No');
  console.log('E-08 output:', output.includes('广捷洗车') ? '✅ Shows car wash data' : '❌ No data');
  
  await browser.close();
  console.log('\n✅ Test completed');
})();
