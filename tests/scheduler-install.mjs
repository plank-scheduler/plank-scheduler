// Isolated scheduler installation tests; never run against a hosted booking site.
// Configure PWA_BASE_URL, PWA_EVIDENCE_DIR, PWA_PLAYWRIGHT_MODULE, PWA_TEST_FILTER,
// PWA_REPORT_NAME, PWA_BROWSER_CHANNEL or PWA_BROWSER_EXECUTABLE as needed.
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import vm from 'node:vm';

const root = fileURLToPath(new URL('../', import.meta.url));
const baseURL = process.env.PWA_BASE_URL || 'http://127.0.0.1:5188';
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(baseURL).hostname), 'Only a loopback preview is allowed');
const evidence = path.resolve(process.env.PWA_EVIDENCE_DIR || path.join(root, '.test-evidence/scheduler-install'));
await mkdir(evidence, { recursive: true });
const { chromium } = await import(process.env.PWA_PLAYWRIGHT_MODULE ? pathToFileURL(path.resolve(process.env.PWA_PLAYWRIGHT_MODULE)).href : 'playwright');
const launchOptions = { headless: true, ...(process.env.PWA_BROWSER_EXECUTABLE ? { executablePath: process.env.PWA_BROWSER_EXECUTABLE } : { channel: process.env.PWA_BROWSER_CHANNEL || 'chrome' }) };
const android = { userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36', viewport: { width: 393, height: 851 }, isMobile: true, hasTouch: true };
const iphone = { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };
const results = [];
let browser;

async function test(name, action) {
  if (process.env.PWA_TEST_FILTER && !new RegExp(process.env.PWA_TEST_FILTER).test(name)) return;
  const started = Date.now();
  try { await action(); results.push({ name, status: 'passed', elapsedMs: Date.now() - started }); console.log(`PASS ${name}`); }
  catch (error) { results.push({ name, status: 'failed', error: error.stack }); console.error(`FAIL ${name}: ${error.message}`); }
}

async function withPage(options, action) {
  const { dismissed, earlyPrompt, installedIOS, standalone, noShowModal, allowWorker, ...device } = options;
  const contextOptions = { ...android, ...device, serviceWorkers: allowWorker ? 'allow' : 'block' };
  const context = allowWorker
    ? await chromium.launchPersistentContext(await mkdtemp(path.join(evidence, 'isolated-chrome-')), { ...launchOptions, ...contextOptions })
    : await browser.newContext(contextOptions);
  const apiCalls = [], errors = [];
  await context.route('**/api/**', route => {
    apiCalls.push({ url: route.request().url(), method: route.request().method() });
    return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ ok: false, error: 'Isolated install test: all business actions disabled.' }) });
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(({ dismissed, installedIOS, standalone, noShowModal }) => {
    window.addEventListener('beforeinstallprompt', event => { if (event.isTrusted) { event.preventDefault(); event.stopImmediatePropagation(); } }, true);
    if (dismissed) sessionStorage.setItem('plank-install-offer-dismissed', '1');
    if (installedIOS) Object.defineProperty(navigator, 'standalone', { value: true, configurable: true });
    if (noShowModal) Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { value: undefined, configurable: true });
    const original = window.matchMedia.bind(window);
    const display = new EventTarget();
    display.matches = Boolean(standalone);
    display.media = '(display-mode: standalone)';
    window.matchMedia = query => query === display.media ? display : original(query);
    window.__setTestStandalone = value => { display.matches = value; display.dispatchEvent(new Event('change')); };
    window.__promptCalls = 0;
    window.__queueTestPrompt = (outcome = 'accepted', hold = false) => {
      const event = new Event('beforeinstallprompt', { cancelable: true });
      event.userChoice = new Promise(resolve => { window.__resolveChoice = resolve; if (!hold) resolve({ outcome }); });
      event.prompt = async () => { window.__promptCalls++; if (outcome === 'rejected') throw new Error('Synthetic prompt rejection'); };
      window.__testPromptCanceled = !window.dispatchEvent(event);
      return window.__testPromptCanceled;
    };
  }, { dismissed, installedIOS, standalone, noShowModal });
  if (earlyPrompt) await context.route('**/install-bootstrap.js', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: `${await response.text()}\nwindow.__queueTestPrompt('accepted');` });
  });
  try {
    await page.goto(baseURL + '/booking?utm_source=isolated-install-test', { waitUntil: 'networkidle', timeout: 120000 });
    await page.locator('main#request').waitFor();
    await action(page, context);
    assert.deepEqual(apiCalls, [], 'Installation never submits a booking, uploads a photo, or requests business data');
    assert.deepEqual(errors, [], 'No uncaught client errors');
  } finally { await context.close(); }
}

const dialog = page => page.locator('dialog');
const banner = page => page.locator('section[aria-label="Install the Plank app"]');
const modalInstall = page => dialog(page).getByRole('button', { name: /^Install App/ });
const textMatches = async (locator, regex) => assert.match(await locator.innerText(), regex);
async function noOverflow(page) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, 'No page horizontal overflow');
  if (await dialog(page).isVisible()) assert.equal(await dialog(page).evaluate(element => element.scrollWidth <= element.clientWidth), true, 'No dialog horizontal overflow');
}

await test('manifest start URL, standalone display, scope and PNG sizes are valid', async () => {
  const response = await fetch(baseURL + '/manifest.json');
  assert.equal(response.status, 200);
  const manifest = await response.json();
  assert.ok(manifest.name && manifest.short_name);
  assert.equal(manifest.id, '/booking');
  assert.equal(new URL(manifest.start_url, baseURL).pathname, '/booking');
  assert.equal(manifest.scope, '/');
  assert.equal(manifest.display, 'standalone');
  for (const size of [192, 512]) {
    const icon = manifest.icons.find(icon => icon.sizes === `${size}x${size}`);
    assert.equal(icon.type, 'image/png');
    const response = await fetch(new URL(icon.src, baseURL));
    assert.equal(response.status, 200);
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(bytes.toString('hex', 0, 8), '89504e470d0a1a0a');
    assert.equal(bytes.readUInt32BE(16), size);
    assert.equal(bytes.readUInt32BE(20), size);
  }
});

await test('service worker never intercepts API calls or caches customer data', async () => {
  const source = await readFile(path.join(root, 'public/sw.js'), 'utf8');
  const listeners = new Map();
  vm.runInNewContext(source, { self: { addEventListener: (name, handler) => listeners.set(name, handler) }, URL, Response, fetch: async () => { throw new Error('offline'); } });
  for (const [pathname, mode] of [['/api/appointments', 'cors'], ['/api/upload-photo', 'cors'], ['/api/appointments', 'navigate']]) {
    let handled = false;
    listeners.get('fetch')({ request: { url: baseURL + pathname, mode }, respondWith: () => { handled = true; } });
    assert.equal(handled, false, `No interception for ${pathname} ${mode}`);
  }
  assert.doesNotMatch(source, /caches\s*\.|cache\.put\s*\(/);
});

try {
  browser = await chromium.launch(launchOptions);

  await test('fresh Android QR visit shows install modal and complete Chrome/QR/Samsung fallback', () => withPage({}, async page => {
    await modalInstall(page).waitFor();
    assert.equal(await dialog(page).evaluate(element => element.matches(':modal')), true);
    await modalInstall(page).click();
    await textMatches(dialog(page), /Install on Android.*Chrome.*three-dot menu.*Install app.*Add to Home screen/s);
    await textMatches(dialog(page), /QR scanner.*Open in Chrome.*Open in browser.*Samsung Internet/s);
    await noOverflow(page);
    await page.screenshot({ path: path.join(evidence, 'android-install-modal.png'), style: 'nextjs-portal{display:none!important}' });
    await dialog(page).getByRole('button', { name: 'Continue to scheduler' }).click();
    await dialog(page).waitFor({ state: 'hidden' });
    assert.equal(await page.evaluate(() => sessionStorage.getItem('plank-install-offer-dismissed')), '1');
    await page.reload({ waitUntil: 'networkidle' });
    await banner(page).waitFor();
    assert.equal(await dialog(page).isVisible(), false, 'Dismissal suppresses repeat modal in same session');
  }));

  await test('previously dismissed Android visit keeps top Install App banner and reopens guidance', () => withPage({ dismissed: true }, async page => {
    await banner(page).waitFor();
    assert.equal(await dialog(page).isVisible(), false);
    const button = banner(page).getByRole('button', { name: /^Install App/ });
    const box = await button.boundingBox();
    assert.ok(box.y + box.height < 851, 'Persistent CTA is in the first mobile viewport');
    assert.ok(box.height >= 44, 'Touch target is at least 44px tall');
    await noOverflow(page);
    await page.screenshot({ path: path.join(evidence, 'android-persistent-install-banner.png'), style: 'nextjs-portal{display:none!important}' });
    await button.click();
    await dialog(page).getByRole('heading', { name: 'Install on Android' }).waitFor();
    assert.equal(await page.evaluate(() => window.__promptCalls), 0);
  }));

  await test('early install event survives client-only booking bundle and is user initiated', () => withPage({ earlyPrompt: true }, async page => {
    await modalInstall(page).waitFor();
    assert.equal(await page.evaluate(() => window.__testPromptCanceled), true);
    assert.equal(await page.evaluate(() => Boolean(window.__plankSchedulerInstallPrompt)), true);
    assert.equal(await page.evaluate(() => window.__promptCalls), 0);
    await modalInstall(page).click();
    await dialog(page).waitFor({ state: 'hidden' });
    assert.equal(await page.evaluate(() => window.__promptCalls), 1);
    assert.equal(await page.evaluate(() => window.__plankSchedulerInstallPrompt), null);
    assert.ok(await banner(page).isVisible(), 'Accepted prompt alone does not falsely mark installation completed');
    await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')));
    await banner(page).waitFor({ state: 'hidden' });
  }));

  await test('pending native prompt disables repeat taps and consumes event before awaiting', () => withPage({}, async page => {
    await modalInstall(page).waitFor();
    await page.evaluate(() => window.__queueTestPrompt('accepted', true));
    await modalInstall(page).evaluate(button => { button.click(); button.click(); });
    await dialog(page).getByRole('button', { name: /Opening/ }).waitFor();
    assert.equal(await dialog(page).getByRole('button', { name: /Opening/ }).isDisabled(), true);
    assert.equal(await page.evaluate(() => window.__promptCalls), 1);
    assert.equal(await page.evaluate(() => window.__plankSchedulerInstallPrompt), null);
    await page.evaluate(() => window.__resolveChoice({ outcome: 'accepted' }));
    await dialog(page).waitFor({ state: 'hidden' });
    await banner(page).getByRole('button', { name: /^Install App/ }).click();
    assert.equal(await page.evaluate(() => window.__promptCalls), 1);
  }));

  for (const outcome of ['dismissed', 'rejected']) await test(`${outcome} native prompt retains fallback and cannot reuse consumed event`, () => withPage({}, async page => {
    await modalInstall(page).waitFor();
    await page.evaluate(outcome => window.__queueTestPrompt(outcome), outcome);
    await modalInstall(page).click();
    await dialog(page).getByRole('status').waitFor();
    await textMatches(dialog(page), outcome === 'dismissed' ? /Installation was dismissed/ : /could not open/);
    await modalInstall(page).click();
    assert.equal(await page.evaluate(() => window.__promptCalls), 1);
    await page.evaluate(() => window.__queueTestPrompt('accepted'));
    await modalInstall(page).click();
    await dialog(page).waitFor({ state: 'hidden' });
    assert.equal(await page.evaluate(() => window.__promptCalls), 2);
  }));

  await test('iPhone existing modal preserves Safari Share and Add to Home Screen instructions', () => withPage(iphone, async page => {
    await dialog(page).getByRole('button', { name: /Add to my device/ }).click();
    await textMatches(dialog(page), /On iPhone or iPad.*Safari.*Share.*Add to Home Screen.*Open as Web App/s);
    assert.equal(await page.evaluate(() => window.__promptCalls), 0);
    await noOverflow(page);
    await page.screenshot({ path: path.join(evidence, 'iphone-install-modal.png'), style: 'nextjs-portal{display:none!important}' });
    await dialog(page).getByRole('button', { name: 'Continue to scheduler' }).click();
    await banner(page).getByRole('button', { name: /^Install App/ }).click();
    await dialog(page).getByRole('heading', { name: 'On iPhone or iPad' }).waitFor();
  }));

  for (const [label, options] of [['iPhone navigator.standalone', { ...iphone, installedIOS: true }], ['Android display-mode', { standalone: true }]]) await test(`${label} hides install modal and banner`, () => withPage(options, async page => {
    assert.equal(await dialog(page).isVisible(), false);
    assert.equal(await banner(page).count(), 0);
    assert.ok(await page.getByRole('button', { name: /Added to your device/ }).isDisabled());
  }));

  await test('display-mode changes and appinstalled remove the install offer', () => withPage({}, async page => {
    await modalInstall(page).waitFor();
    await page.evaluate(() => window.__setTestStandalone(true));
    await dialog(page).waitFor({ state: 'hidden' });
    await banner(page).waitFor({ state: 'hidden' });
    await page.evaluate(() => window.__setTestStandalone(false));
    await banner(page).waitFor();
    await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')));
    await banner(page).waitFor({ state: 'hidden' });
  }));

  await test('embedded browser without showModal still opens and dismisses usable guidance', () => withPage({ noShowModal: true, userAgent: android.userAgent + ' wv' }, async page => {
    await modalInstall(page).waitFor();
    assert.equal(await dialog(page).evaluate(element => element.matches(':modal')), false);
    await modalInstall(page).click();
    await textMatches(dialog(page), /QR scanner.*Open in Chrome/s);
    await noOverflow(page);
    await dialog(page).getByRole('button', { name: 'Continue to scheduler' }).click();
    await dialog(page).waitFor({ state: 'hidden' });
    await banner(page).getByRole('button', { name: /^Install App/ }).click();
    await dialog(page).getByRole('heading', { name: 'Install on Android' }).waitFor();
  }));

  await test('Chromium installability audit and active network-only worker pass', () => withPage({ allowWorker: true, dismissed: true }, async (page, context) => {
    assert.equal(await page.evaluate(() => window.isSecureContext), true);
    assert.equal(await page.locator('link[rel="manifest"]').count(), 1);
    assert.equal(await page.locator('link[rel="manifest"]').getAttribute('href'), '/manifest.json');
    assert.equal(await page.locator('meta[name="apple-mobile-web-app-capable"]').getAttribute('content'), 'yes');
    const registration = await page.evaluate(async () => {
      const result = await navigator.serviceWorker.ready;
      return { scope: result.scope, scriptURL: result.active?.scriptURL, state: result.active?.state, caches: await caches.keys() };
    });
    assert.equal(registration.scope, baseURL + '/');
    assert.equal(registration.scriptURL, baseURL + '/sw.js');
    assert.equal(registration.state, 'activated');
    assert.deepEqual(registration.caches, []);
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
    const cdp = await context.newCDPSession(page);
    await cdp.send('Page.enable');
    const manifest = await cdp.send('Page.getAppManifest');
    const installability = await cdp.send('Page.getInstallabilityErrors');
    assert.deepEqual(manifest.errors, []);
    assert.deepEqual(installability.installabilityErrors, []);
    await writeFile(path.join(evidence, 'chromium-installability.json'), JSON.stringify({ manifest, installability, serviceWorker: registration }, null, 2));
    await context.setOffline(true);
    await page.goto(baseURL + '/booking', { waitUntil: 'domcontentloaded' });
    await textMatches(page.locator('body'), /offline.*No request has been sent while offline/s);
  }));
} catch (error) {
  results.push({ name: 'browser infrastructure', status: 'failed', error: error.stack });
} finally {
  await browser?.close();
  const summary = { completedAt: new Date().toISOString(), baseURL, note: 'Mobile user agents and synthetic install events in desktop Chromium. Physical Android/iPhone QR installation and native Safari are not verified. All business endpoints intercepted, with zero requests expected.', passed: results.filter(result => result.status === 'passed').length, failed: results.filter(result => result.status === 'failed').length, results };
  await writeFile(path.join(evidence, process.env.PWA_REPORT_NAME || 'results.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify({ passed: summary.passed, failed: summary.failed, evidence }));
  process.exitCode = summary.failed ? 1 : 0;
}
