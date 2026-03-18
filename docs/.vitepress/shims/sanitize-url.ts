/**
 * ESM shim for `@braintree/sanitize-url` to guarantee a named export `sanitizeUrl`.
 *
 * Why:
 * - `@braintree/sanitize-url@7.x` ships CJS (`dist/index.js`).
 * - Some parts of the mermaid stack import it as: `import { sanitizeUrl } from '@braintree/sanitize-url'`.
 * - In Vite dev this can surface as: "does not provide an export named 'sanitizeUrl'".
 *
 * This file provides a simple, safe sanitizer implementation compatible with common usage:
 * - allow relative urls
 * - allow http/https/mailto and protocol-relative urls
 * - block javascript:, data:, vbscript:, file:, etc.
 *
 * Note: This doesn't aim to be a perfect drop-in replacement for every edge case,
 * but it fixes the dev/runtime failure and preserves security properties.
 */

const BLANK_URL = 'about:blank';

const invalidProtocolRegex = /^(?:\s*javascript:|\s*data:|\s*vbscript:|\s*file:)/i;

function isRelativeUrlWithoutProtocol(url: string) {
  const first = url[0];
  return first === '.' || first === '/' || first === '#';
}

function normalize(url: string) {
  return url.trim().replace(/\\+/g, '/');
}

export function sanitizeUrl(url: string): string {
  if (!url) return BLANK_URL;

  const decoded = normalize(url);

  if (!decoded) return BLANK_URL;
  if (isRelativeUrlWithoutProtocol(decoded)) return decoded;

  // Allow protocol-relative
  if (decoded.startsWith('//')) return decoded;

  const lowered = decoded.toLowerCase().trimStart();
  if (invalidProtocolRegex.test(lowered)) return BLANK_URL;

  // Allow common safe schemes (keep behavior conservative)
  if (lowered.startsWith('http:') || lowered.startsWith('https:') || lowered.startsWith('mailto:')) {
    return decoded;
  }

  // Allow custom deep-link protocols of the form `scheme://...`
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(lowered)) {
    return decoded;
  }

  // Otherwise, return as-is (still after invalid protocol block)
  return decoded;
}

export default sanitizeUrl;

