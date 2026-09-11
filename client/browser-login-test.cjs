/* Verify login navigation + data loading across pages after the interceptor fix. */
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

(async () => {
  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1380, height: 900 });

  const consoleErrors = [];
  const failedNet = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });
  page.on('response', r => { if (r.status() >= 400 && r.url().includes('/api/')) failedNet.push(`HTTP ${r.status()} ${r.url()}`); });

  // ---- 1. Login as customer ----
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', 'rahul@example.com', { delay: 8 });
  await page.type('input[type="password"]', 'Customer@123', { delay: 8 });
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 3000));

  const url = page.url();
  const token = await page.evaluate(() => localStorage.getItem('propintel_token'));
  const heading = await page.evaluate(() => document.querySelector('h1')?.textContent?.trim() ?? '(none)');
  console.log('LOGIN      →', url, '| token:', token ? 'YES' : 'NO', '| heading:', JSON.stringify(heading));
  await page.screenshot({ path: 'p1-dashboard.png' });

  // ---- 2. Browse page loads properties ----
  await page.goto('http://localhost:5173/browse', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2500));
  const cardCount = await page.evaluate(() => document.querySelectorAll('article').length);
  const browseHeading = await page.evaluate(() => document.querySelector('h1')?.textContent?.trim() ?? '(none)');
  const listingsLabel = await page.evaluate(() => document.body.innerText.match(/\d+ listings/)?.[0] ?? '(no count)');
  console.log('BROWSE     → cards:', cardCount, '| heading:', JSON.stringify(browseHeading), '|', listingsLabel);
  await page.screenshot({ path: 'p2-browse.png' });

  // ---- 3. Assistant page ----
  await page.goto('http://localhost:5173/assistant', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));
  const assistantHeading = await page.evaluate(() => document.querySelector('h1')?.textContent?.trim() ?? '(none)');
  console.log('ASSISTANT  → heading:', JSON.stringify(assistantHeading));

  // ---- 4. Logout → login as agent → agent dashboard ----
  await page.evaluate(() => { localStorage.removeItem('propintel_token'); });
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', 'amit@propintel.ai', { delay: 8 });
  await page.type('input[type="password"]', 'Admin@123', { delay: 8 });
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 3000));
  const agentUrl = page.url();
  const agentHeading = await page.evaluate(() => document.querySelector('h1')?.textContent?.trim() ?? '(none)');
  console.log('AGENT LOGIN→', agentUrl, '| heading:', JSON.stringify(agentHeading));
  await page.screenshot({ path: 'p3-agent.png' });

  // ---- 5. Agent leads page ----
  await page.goto('http://localhost:5173/leads', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2500));
  const leadCards = await page.evaluate(() => document.querySelectorAll('a[href^="/leads/"]').length);
  console.log('LEADS      → lead rows:', leadCards);
  await page.screenshot({ path: 'p4-leads.png' });

  console.log('\nConsole errors:', consoleErrors.length ? '' : 'none');
  consoleErrors.slice(0, 6).forEach(e => console.log('  [console]', e));
  console.log('API failures:', failedNet.length ? '' : 'none');
  failedNet.slice(0, 6).forEach(f => console.log('  [net]', f));

  await browser.close();
  process.exit(0);
})().catch(err => { console.error('SCRIPT ERROR:', err.message); process.exit(1); });
