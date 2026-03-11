import { chromium } from 'playwright';

const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:3001';
const email =
  process.env.E2E_EMAIL ||
  `cursor.e2e+${Date.now()}@example.com`;
const password = process.env.E2E_PASSWORD || 'TestPassword!12345';

function redactSecrets(text) {
  if (!text) return text;
  return text
    .replaceAll(password, '<redacted-password>')
    .replaceAll(email, '<redacted-email>');
}

function safeParseUrl(url) {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

async function fillFirstMatching(page, candidates, value) {
  for (const locator of candidates) {
    const l = page.locator(locator).first();
    if (await l.count()) {
      await l.fill(value, { timeout: 5000 }).catch(() => {});
      const current = await l.inputValue().catch(() => '');
      if (current === value) return true;
    }
  }
  return false;
}

const consoleEvents = [];
const pageErrors = [];
const requestFailures = [];
const suspiciousResponses = [];
const observedAuthRequests = [];
const observedAuthResponses = [];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

page.on('request', (req) => {
  try {
    const url = req.url();
    const u = safeParseUrl(url);
    if (!u) return;

    const isSupabaseRelated =
      /supabase\.co$/i.test(u.hostname) ||
      u.hostname === 'localhost' ||
      /auth\/v1|rest\/v1|realtime\/v1|storage\/v1/i.test(u.pathname);

    if (!isSupabaseRelated) return;

    const isAuth =
      /auth\/v1/i.test(u.pathname) ||
      /\/signup\b/i.test(u.pathname);

    if (!isAuth) return;

    observedAuthRequests.push({
      url,
      method: req.method(),
      resourceType: req.resourceType(),
    });
  } catch {
    // ignore
  }
});

page.on('console', (msg) => {
  const type = msg.type();
  const text = msg.text();
  if (type === 'error' || type === 'warning') {
    consoleEvents.push({
      type,
      location: msg.location(),
      text,
    });
  }
});

page.on('pageerror', (err) => {
  pageErrors.push(String(err));
});

page.on('requestfailed', (req) => {
  requestFailures.push({
    url: req.url(),
    method: req.method(),
    failure: req.failure(),
    resourceType: req.resourceType(),
  });
});

page.on('response', async (res) => {
  try {
    const url = res.url();
    const status = res.status();
    const u = safeParseUrl(url);
    const isAuthSignup = !!u && /\/auth\/v1\/signup\b/i.test(u.pathname);
    const looksRelated =
      /supabase|auth\/v1|rest\/v1|realtime\/v1|storage\/v1/i.test(url) || url.includes('/api/');
    if (!looksRelated) return;

    let bodySnippet = null;
    try {
      const txt = await res.text();
      bodySnippet = redactSecrets(txt).slice(0, 800);
    } catch {
      // ignore
    }

    if (isAuthSignup) {
      observedAuthResponses.push({
        url,
        status,
        statusText: res.statusText(),
        bodySnippet,
      });
    }

    if (status < 400) return;

    suspiciousResponses.push({
      url,
      status,
      statusText: res.statusText(),
      bodySnippet,
    });
  } catch {
    // ignore
  }
});

async function run() {
  const report = {
    baseUrl,
    landing: {},
    signup: { email: '<redacted-email>' },
    dashboard: {},
    dashboardDirect: {},
    authRequests: [],
    authRequestHostSummary: {},
    authSignupResponses: [],
    consoleErrors: [],
    pageErrors: [],
    requestFailures: [],
    suspiciousResponses: [],
  };

  // Landing page
  const landingResponse = await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
  report.landing.httpStatus = landingResponse?.status();
  report.landing.finalUrl = page.url();
  report.landing.title = await page.title().catch(() => null);
  report.landing.h1 = await page.locator('h1').first().innerText().catch(() => null);

  // Signup
  const signupResponse = await page.goto(`${baseUrl}/signup`, { waitUntil: 'domcontentloaded' });
  report.signup.httpStatus = signupResponse?.status();
  report.signup.finalUrl = page.url();

  // Give React a moment to hydrate (avoids values being wiped by rerenders).
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(800);

  const emailFilled = await fillFirstMatching(
    page,
    [
      'input[type="email"]',
      'input[name="email"]',
      'input[id*="email" i]',
      'input[placeholder*="email" i]',
    ],
    email,
  );

  const passwordFilled = await fillFirstMatching(
    page,
    [
      'input[type="password"]',
      'input[name="password"]',
      'input[id*="password" i]',
      'input[placeholder*="password" i]',
    ],
    password,
  );

  report.signup.emailFieldFound = emailFilled;
  report.signup.passwordFieldFound = passwordFilled;

  // Some signup forms require "confirm password" as a second password input.
  const passwordInputs = page.locator('input[type="password"]');
  const passwordInputCount = await passwordInputs.count().catch(() => 0);
  report.signup.passwordInputCount = passwordInputCount;
  if (passwordInputCount >= 2) {
    await passwordInputs.nth(1).fill(password).catch(() => {});
    report.signup.confirmPasswordFilled = (await passwordInputs.nth(1).inputValue().catch(() => '')) === password;
  }

  const signupButton = page.getByRole('button', {
    name: /sign\s*up|create\s*account|register/i,
  });
  report.signup.signupButtonFound = (await signupButton.count().catch(() => 0)) > 0;

  if (report.signup.signupButtonFound) {
    await signupButton.first().click({ timeout: 10000 });
  } else {
    // Fallback: try any submit button
    await page.locator('button[type="submit"], input[type="submit"]').first().click({ timeout: 10000 });
  }

  // Ensure form submit fires even if click misses for any reason.
  await page.locator("form").first().evaluate((f) => f.requestSubmit?.()).catch(() => {});

  // Wait for either a redirect or a toast/error to appear.
  await Promise.race([
    page.waitForURL(/\/dashboard\b/, { timeout: 30000 }),
    page.waitForSelector('[role="status"], [role="alert"]', { timeout: 30000 }),
    page.getByText(/account created|creating account|check your email|invalid|error|failed/i).first().waitFor({ timeout: 30000 }),
    page.getByRole('button', { name: /creating…/i }).first().waitFor({ timeout: 30000 }),
  ]).catch(() => {});

  report.dashboard.finalUrl = page.url();
  report.dashboard.title = await page.title().catch(() => null);

  // Let dashboard data load
  await page.waitForTimeout(1500);

  const bodyText = await page.locator('body').innerText().catch(() => '');
  const alertsText = await page.locator('[role="alert"], [role="status"]').allInnerTexts().catch(() => []);
  const toastText = alertsText.map((t) => t.trim()).filter(Boolean).join('\n') || null;
  const formText = await page.locator('form').first().innerText().catch(() => null);
  const submitButton = page.getByRole('button', { name: /create account|creating/i }).first();
  const submitButtonText = await submitButton.innerText().catch(() => null);
  const submitButtonDisabled = await submitButton.isDisabled().catch(() => null);
  const errorCandidates = [
    /supabase row-level security/i,
    /row-level security/i,
    /rls/i,
    /unauthorized/i,
    /forbidden/i,
    /invalid/i,
    /permission/i,
    /error/i,
    /failed/i,
  ];

  const errorElements = [];
  for (const re of errorCandidates) {
    const loc = page.getByText(re).first();
    if ((await loc.count().catch(() => 0)) > 0) {
      const isVisible = await loc.isVisible().catch(() => false);
      if (!isVisible) continue;
      const snippet = await loc.evaluate((el) => {
        const container =
          el.closest('[role="alert"]') ||
          el.closest('[data-sonner-toast]') ||
          el.closest('form') ||
          el.closest('section') ||
          el.parentElement;
        const text = (container?.innerText || el.innerText || '').trim();
        const html = (container?.outerHTML || el.outerHTML || '').slice(0, 1200);
        return { text, html };
      }).catch(() => null);
      if (snippet) {
        errorElements.push({
          matched: String(re),
          text: snippet.text.slice(0, 500),
          htmlSnippet: snippet.html,
        });
      }
    }
    if (errorElements.length >= 3) break;
  }
  const likelyUserVisibleErrors = Array.from(
    new Set(
      (bodyText.match(
        /(supabase[^.\n]{0,120}|rls[^.\n]{0,120}|jwt[^.\n]{0,120}|unauthorized[^.\n]{0,120}|forbidden[^.\n]{0,120}|invalid[^.\n]{0,120}|permission[^.\n]{0,120}|error[^.\n]{0,120}|failed[^.\n]{0,120})/gi,
      ) || []).slice(0, 20),
    ),
  ).map((s) => s.trim());

  const supabaseMentions = (bodyText.match(/supabase|rls|jwt|unauthorized|forbidden|invalid|permission/i) || []).slice(
    0,
    10,
  );
  report.dashboard.supabaseRelatedTextSnippets = supabaseMentions;
  report.dashboard.likelyUserVisibleErrors = likelyUserVisibleErrors;
  report.dashboard.errorElements = errorElements;
  report.dashboard.alertsText = alertsText.map((t) => t.trim()).filter(Boolean).slice(0, 10);
  report.dashboard.toastText = toastText?.trim?.() ? toastText.trim() : toastText;
  report.dashboard.formTextSnippet = formText ? formText.trim().slice(0, 600) : null;
  report.dashboard.submitButtonText = submitButtonText?.trim?.() ? submitButtonText.trim() : submitButtonText;
  report.dashboard.submitButtonDisabled = submitButtonDisabled;

  // If we didn't land on /dashboard via redirect, still verify /dashboard renders
  // and capture any Supabase/env configuration message.
  if (!report.dashboard.finalUrl.includes('/dashboard')) {
    const directRes = await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'domcontentloaded' }).catch(() => null);
    report.dashboardDirect.httpStatus = directRes?.status?.() ?? null;
    report.dashboardDirect.finalUrl = page.url();
    report.dashboardDirect.title = await page.title().catch(() => null);
    const directBody = await page.locator('body').innerText().catch(() => '');
    report.dashboardDirect.textSnippets = (directBody.match(/supabase|anon key|NEXT_PUBLIC_SUPABASE/i) || []).slice(0, 10);
  }

  report.consoleErrors = consoleEvents.map((e) => ({
    type: e.type,
    location: e.location,
    text: redactSecrets(e.text),
  }));
  report.pageErrors = pageErrors.map((e) => redactSecrets(e));
  report.requestFailures = requestFailures.map((f) => ({ ...f }));
  report.suspiciousResponses = suspiciousResponses.map((r) => ({ ...r }));
  report.authRequests = observedAuthRequests.slice(0, 30);
  report.authSignupResponses = observedAuthResponses.slice(0, 5);

  const hostCounts = new Map();
  for (const r of observedAuthRequests) {
    const u = safeParseUrl(r.url);
    const hostKey = u ? `${u.hostname}${u.port ? `:${u.port}` : ''}` : '<unparseable>';
    hostCounts.set(hostKey, (hostCounts.get(hostKey) || 0) + 1);
  }
  report.authRequestHostSummary = Object.fromEntries(hostCounts.entries());

  const hasSupabaseErrors =
    report.consoleErrors.some((e) => /supabase|rls|jwt|unauthorized|forbidden|invalid|permission/i.test(e.text)) ||
    report.pageErrors.some((e) => /supabase|rls|jwt|unauthorized|forbidden|invalid|permission/i.test(e)) ||
    (report.suspiciousResponses || []).length > 0 ||
    (report.requestFailures || []).some((f) => /supabase|auth\/v1|rest\/v1|realtime\/v1|storage\/v1/i.test(f.url)) ||
    (report.dashboard.likelyUserVisibleErrors || []).length > 0;

  report.ok =
    report.landing.httpStatus && report.landing.httpStatus < 400 &&
    report.signup.httpStatus && report.signup.httpStatus < 400 &&
    report.dashboard.finalUrl.includes('/dashboard') &&
    !hasSupabaseErrors;

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(report, null, 2));

  if (!report.ok) process.exitCode = 1;
}

try {
  await run();
} finally {
  await context.close().catch(() => {});
  await browser.close().catch(() => {});
}

