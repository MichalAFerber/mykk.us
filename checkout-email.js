// Pure helpers behind the checkout email modal (owner ruling 2026-09-18).
// Ported from capturewizard-extension's checkoutModal.js: same regex, same
// normalization, same URL shape, so the web and extension flows agree.
//
// Plain classic script (no bundler here, and the site's other scripts run
// as classic scripts too — a `type="module"` script is deferred until after
// parsing, which would run this after script.js's own DOMContentLoaded
// listener had already fired). Exposed as `window.MykkCheckoutEmail`;
// test/checkout-email.test.js evaluates this same file in a sandboxed
// `window` via node:vm rather than requiring it as a module.
(function (root) {
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const MAX_EMAIL_LENGTH = 254;

  function normalizeEmail(raw) {
    return (raw || '').trim().toLowerCase();
  }

  function isValidEmail(raw) {
    const email = normalizeEmail(raw);
    return email.length > 0 && email.length <= MAX_EMAIL_LENGTH && EMAIL_RE.test(email);
  }

  function buildCheckoutUrl(rawEmail) {
    const url = new URL('https://api.mykk.us/api/checkout/redirect');
    url.searchParams.set('email', normalizeEmail(rawEmail));
    return url.toString();
  }

  root.MykkCheckoutEmail = { normalizeEmail, isValidEmail, buildCheckoutUrl };
})(typeof window !== 'undefined' ? window : globalThis);
