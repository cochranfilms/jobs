#!/usr/bin/env node
const puppeteer = require('puppeteer');

(async () => {
  console.log('🔍 Portfolio Builder smoke test starting...');
  const url = process.env.TEST_URL || 'http://localhost:3000/portfolio-builder.html';
  const headless = process.env.HEADLESS !== 'false';
  const browser = await puppeteer.launch({ headless, defaultViewport: { width: 1280, height: 900 } });
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    console.log('✅ Page loaded');

    // Check core UI present
    await page.waitForSelector('#name', { timeout: 8000 });
    await page.waitForSelector('#btnGenerate', { timeout: 8000 });
    await page.waitForSelector('#btnPublish', { timeout: 8000 });
    console.log('✅ Core controls visible');

    // Fill some inputs
    await page.type('#name', 'Smoke Test User');
    await page.type('#slug', 'smoke-test-user');
    await page.type('#bio', 'This is a smoke test bio');
    console.log('✅ Profile inputs filled');

    // Render preview trigger
    await page.click('#btnPreview');
    const previewName = await page.$eval('#previewName', el => el.textContent.trim());
    if (!previewName.toLowerCase().includes('smoke')) throw new Error('Preview name did not update');
    console.log('✅ Preview updated');

    console.log('\n🎉 Smoke test passed');
  } catch (e) {
    console.error('❌ Smoke test failed:', e.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();


