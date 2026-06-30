const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:8001');
  await page.waitForTimeout(1000);
  
  // Start game
  await page.click('text=是，我会帮你');
  await page.waitForTimeout(2000);
  
  // Navigate to public monitoring
  await page.fill('#command-input', 'access 公共监控');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
  
  let output = await page.textContent('#output');
  console.log('=== After entering public monitoring ===');
  console.log(output.substring(output.length - 300));
  
  // Search for 超市
  await page.fill('#command-input', '超市');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
  
  output = await page.textContent('#output');
  console.log('\n=== After searching 超市 ===');
  console.log('Contains E-07:', output.includes('E-07'));
  console.log(output.substring(output.length - 400));
  
  // Go back and search for 洗车
  await page.fill('#command-input', 'back');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  
  await page.fill('#command-input', 'access 公共监控');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
  
  await page.fill('#command-input', '洗车');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
  
  output = await page.textContent('#output');
  console.log('\n=== After searching 洗车 ===');
  console.log('Contains E-08:', output.includes('E-08'));
  console.log(output.substring(output.length - 400));
  
  // Check evidence list
  await page.fill('#command-input', 'list');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
  
  output = await page.textContent('#output');
  console.log('\n=== Evidence list ===');
  console.log('Contains E-07:', output.includes('E-07'));
  console.log('Contains E-08:', output.includes('E-08'));
  
  await browser.close();
  console.log('\n✅ Test completed');
})();
