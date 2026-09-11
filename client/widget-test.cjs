/* Verify the floating chat widget for customer and admin roles. */
const puppeteer = require('puppeteer-core');
const fs = require('fs');

function findChrome() {
  const candidates = [
    process.env.LOCALAPPDATA ? `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe` : null,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ].filter(Boolean);
  for (const c of candidates) if (fs.existsSync(c)) return c;
  throw new Error('Chrome not found');
}

async function login(page, email, password) {
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', email, { delay: 5 });
  await page.type('input[type="password"]', password, { delay: 5 });
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 15000 });
  await new Promise(r => setTimeout(r, 1500));
}

async function openWidget(page) {
  const fab = await page.$('button[aria-label="Open assistant"]');
  if (!fab) throw new Error('FAB not found');
  await fab.click();
  await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1380, height: 900 });

  const consoleErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });

  // ---- CUSTOMER ----
  await login(page, 'rahul@example.com', 'Customer@123');
  const fabOnBrowse = await page.$('button[aria-label="Open assistant"]');
  console.log('CUSTOMER: FAB visible on dashboard:', Boolean(fabOnBrowse));

  await openWidget(page);
  await page.type('[role="dialog"] input', '3BHK in Bangalore under 1.2 crore with parking', { delay: 5 });
  await page.keyboard.press('Enter');
  await new Promise(r => setTimeout(r, 3500));

  const custText = await page.evaluate(() => document.querySelector('[role="dialog"]')?.innerText ?? '');
  const hasResults = custText.includes('% match') || /matches|match/i.test(custText);
  console.log('CUSTOMER: property search answered:', hasResults);
  console.log('  snippet:', custText.replace(/\n+/g, ' | ').slice(0, 260));
  await page.screenshot({ path: 'widget-customer.png' });

  // Widget must NOT appear on the dedicated assistant page
  await page.goto('http://localhost:5173/assistant', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  const fabOnAssistant = await page.$('button[aria-label="Open assistant"]');
  console.log('CUSTOMER: FAB hidden on /assistant page:', fabOnAssistant === null);

  // ---- ADMIN ----
  await page.evaluate(() => localStorage.removeItem('propintel_token'));
  await login(page, 'admin@propintel.ai', 'Admin@123');
  const fabOnAdmin = await page.$('button[aria-label="Open assistant"]');
  console.log('\nADMIN: FAB visible on admin dashboard:', Boolean(fabOnAdmin));

  await openWidget(page);
  await page.type('[role="dialog"] input', 'How many hot leads do I have?', { delay: 5 });
  await page.keyboard.press('Enter');
  await new Promise(r => setTimeout(r, 3000));

  const adminText = await page.evaluate(() => document.querySelector('[role="dialog"]')?.innerText ?? '');
  const quickOk = /hot lead/i.test(adminText) && /\d/.test(adminText);
  console.log('ADMIN: quick CRM answer:', quickOk);
  console.log('  snippet:', adminText.replace(/\n+/g, ' | ').slice(0, 260));
  await page.screenshot({ path: 'widget-admin.png' });

  // Second admin question — property search fallback
  await page.type('[role="dialog"] input', '2BHK in Pune', { delay: 5 });
  await page.keyboard.press('Enter');
  await new Promise(r => setTimeout(r, 3000));
  const adminText2 = await page.evaluate(() => document.querySelector('[role="dialog"]')?.innerText ?? '');
  console.log('ADMIN: property search fallback:', /Found \d+ matches|No matching properties/i.test(adminText2));

  console.log('\nConsole errors:', consoleErrors.length ? '' : 'none');
  consoleErrors.slice(0, 5).forEach(e => console.log('  [console]', e));

  await browser.close();
  process.exit(0);
})().catch(err => { console.error('SCRIPT ERROR:', err.message); process.exit(1); });
