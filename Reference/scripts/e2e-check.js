#!/usr/bin/env node
const puppeteer = require('puppeteer');

(async () => {
  const base = process.env.BASE_URL || 'http://localhost:8000';
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    page.on('console', msg => console.log('BROWSER:', msg.type().toUpperCase(), msg.text()));
    page.setDefaultTimeout(60000);

    // Admin Dashboard
    console.log('STEP: open admin-dashboard');
    await page.goto(`${base}/admin-dashboard.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#loginScreen');
    console.log('ASSERT: login screen visible');
    await page.type('#email', 'info@cochranfilms.com');
    await page.type('#password', 'Cochranfilms2@');
    await Promise.all([
      page.click('button[type=submit]'),
      page.waitForSelector('#dashboard', { timeout: 30000 })
    ]);
    console.log('ASSERT: dashboard visible');

    const totalCreators = await page.$eval('#totalCreators', el => el.textContent.trim());
    const activeJobs = await page.$eval('#activeJobs', el => el.textContent.trim());
    console.log('RESULT: admin stats', JSON.stringify({ totalCreators, activeJobs }));

    // User Portal
    console.log('STEP: open user-portal');
    await page.goto(`${base}/user-portal.html`, { waitUntil: 'domcontentloaded' });
    console.log('ASSERT: user portal loaded DOM');

    console.log('E2E_CHECK_SUCCESS');
  } catch (err) {
    console.error('E2E_CHECK_FAILED', err.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();


