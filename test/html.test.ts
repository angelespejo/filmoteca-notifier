import assert from "node:assert/strict";
import test from "node:test";
import { escapeHtml, sanitizeUrl } from "../src/_shared/html.js";

test("escapeHtml escapes every HTML-sensitive character", () => {
  assert.equal(
    escapeHtml(`<script>alert("x") & 'y'</script>`),
    "&lt;script&gt;alert(&quot;x&quot;) &amp; &#39;y&#39;&lt;/script&gt;",
  );
});

test("sanitizeUrl only allows absolute http(s) URLs", () => {
  assert.equal(sanitizeUrl("https://example.com/a?b=1"), "https://example.com/a?b=1");
  assert.equal(sanitizeUrl("http://example.com"), "http://example.com/");
  assert.equal(sanitizeUrl("javascript:alert(1)"), undefined);
  assert.equal(sanitizeUrl("data:text/html,<script>alert(1)</script>"), undefined);
  assert.equal(sanitizeUrl("/relative/path"), undefined);
  assert.equal(sanitizeUrl(undefined), undefined);
  assert.equal(sanitizeUrl("not a url"), undefined);
});
