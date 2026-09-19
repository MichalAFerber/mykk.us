// Unit coverage for the checkout email modal's pure helpers
// (checkout-email.js). It's a classic browser script with no module
// exports, so this evaluates the real file content in a sandboxed `window`
// via node:vm — the same shape the browser gives it — rather than
// requiring/importing it as a module.
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import vm from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(resolve(__dirname, '..', 'checkout-email.js'), 'utf8');

let normalizeEmail, isValidEmail, buildCheckoutUrl;

beforeAll(() => {
  const sandbox = { window: {}, URL };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  ({ normalizeEmail, isValidEmail, buildCheckoutUrl } = sandbox.window.MykkCheckoutEmail);
});

describe('normalizeEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail('  Foo@Example.COM  ')).toBe('foo@example.com');
  });
});

describe('isValidEmail', () => {
  it('accepts a plain address', () => {
    expect(isValidEmail('foo@example.com')).toBe(true);
  });

  it('rejects an address with no @', () => {
    expect(isValidEmail('not-an-email')).toBe(false);
  });

  it('rejects an address with no domain dot', () => {
    expect(isValidEmail('foo@example')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });

  it('rejects an address over 254 characters after normalization', () => {
    const long = `${'a'.repeat(250)}@example.com`;
    expect(isValidEmail(long)).toBe(false);
  });
});

describe('buildCheckoutUrl', () => {
  it('builds the checkout-redirect URL with the normalized, encoded email', () => {
    const url = buildCheckoutUrl('  Foo@Example.COM  ');
    expect(url).toBe('https://api.mykk.us/api/checkout/redirect?email=foo%40example.com');
  });
});
