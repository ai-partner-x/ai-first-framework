import "./chunk-BUSYA2B4.js";

// docs/.vitepress/shims/sanitize-url.ts
var BLANK_URL = "about:blank";
var invalidProtocolRegex = /^(?:\s*javascript:|\s*data:|\s*vbscript:|\s*file:)/i;
function isRelativeUrlWithoutProtocol(url) {
  const first = url[0];
  return first === "." || first === "/" || first === "#";
}
function normalize(url) {
  return url.trim().replace(/\\+/g, "/");
}
function sanitizeUrl(url) {
  if (!url) return BLANK_URL;
  const decoded = normalize(url);
  if (!decoded) return BLANK_URL;
  if (isRelativeUrlWithoutProtocol(decoded)) return decoded;
  if (decoded.startsWith("//")) return decoded;
  const lowered = decoded.toLowerCase().trimStart();
  if (invalidProtocolRegex.test(lowered)) return BLANK_URL;
  if (lowered.startsWith("http:") || lowered.startsWith("https:") || lowered.startsWith("mailto:")) {
    return decoded;
  }
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(lowered)) {
    return decoded;
  }
  return decoded;
}
var sanitize_url_default = sanitizeUrl;
export {
  sanitize_url_default as default,
  sanitizeUrl
};
//# sourceMappingURL=@braintree_sanitize-url.js.map
