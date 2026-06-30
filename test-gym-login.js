const { chromium } = require('playwright');
const BASE = 'http://localhost:8099';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Clear save + load game
  await page.goto(BASE);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('#command-input');
  await page.waitForTimeout(2000);

  // Accept game
  await page.locator('button:has-text("是，我会帮你")').click();
  await page.waitForTimeout(12000);

  // Navigate to unlock door and systems first
  await page.fill('#command-input', 'OA');
  await page.press('#command-input', 'Enter');
  await page.waitForTimeout(3000);

  await page.fill('#command-input', '4');
  await page.press('#command-input', 'Enter');
  await page.waitForTimeout(1000);

  await page.fill('#command-input', '1');
  await page.press('#command-input', 'Enter');
  await page.waitForTimeout(2000);

  // Click 确认激活
  await page.locator('button:has-text("确认激活")').click();
  await page.waitForTimeout(4000);

  // Back twice to root
  await page.fill('#command-input', 'back');
  await page.press('#command-input', 'Enter');
  await page.waitForTimeout(1000);
  await page.fill('#command-input', 'back');
  await page.press('#command-input', 'Enter');
  await page.waitForTimeout(1000);

  // Unlock phone
  await page.fill('#command-input', 'unlock');
  await page.press('#command-input', 'Enter');
  await page.waitForTimeout(500);
  await page.fill('#command-input', '1222');
  await page.press('#command-input', 'Enter');
  await page.waitForTimeout(3000);

  // Enter 微信 → 微信小程序
  await page.fill('#command-input', '微信');
  await page.press('#command-input', 'Enter');
  await page.waitForTimeout(3000);
  await page.fill('#command-input', '2');
  await page.press('#command-input', 'Enter');
  await page.waitForTimeout(1500);

  // Search 炼健身
  await page.fill('#command-input', '炼健身');
  await page.press('#command-input', 'Enter');
  await page.waitForTimeout(2000);

  // Click 确认授权
  await page.locator('button:has-text("确认授权")').click();
  await page.waitForTimeout(2000);

  // Select 教练团队
  await page.fill('#command-input', '2');
  await page.press('#command-input', 'Enter');
  await page.waitForTimeout(3000);

  // Now we should be at gym_login prompt
  // Test: type username
  await page.fill('#command-input', 'zoudaxiong');
  await page.press('#command-input', 'Enter');
  await page.waitForTimeout(1000);

  // Check if we're now asked for password
  const output1 = await page.evaluate(() => document.querySelector('#output')?.textContent || '');
  const pwdPrompt = output1.includes('管理后台密码');

  // Type the password
  await page.fill('#command-input', '7753');
  await page.press('#command-input', 'Enter');
  await page.waitForTimeout(2000);

  const output2 = await page.evaluate(() => document.querySelector('#output')?.textContent || '');
  const loginSuccess = output2.includes('登录成功') || output2.includes('管理后台已解锁');

  console.log('=== GYM LOGIN TEST ===');
  console.log('Step 1 - account prompt: ' + (output1.includes('管理后台账号') ? '✅' : '❌'));
  console.log('Step 2 - pwd prompt after account: ' + (pwdPrompt ? '✅' : '❌'));
  console.log('Step 3 - login success: ' + (loginSuccess ? '✅' : '❌'));

  if (!pwdPrompt) console.log('  OUTPUT1 (last 500):', output1.slice(-500));
  if (!loginSuccess) console.log('  OUTPUT2 (last 500):', output2.slice(-500));

  await browser.close();
})();
