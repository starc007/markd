import assert from "node:assert/strict";
import { describe, test } from "node:test";
import sitemap from "../app/sitemap";
import { GUIDES } from "../lib/guides";
import { absoluteUrl, jsonLd } from "../lib/seo";

describe("SEO foundations", () => {
  test("guide slugs and canonical URLs are unique", () => {
    const slugs = GUIDES.map((guide) => guide.slug);
    assert.equal(new Set(slugs).size, slugs.length);
    assert.ok(slugs.every((slug) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)));
  });

  test("every guide contains substantial, answerable content", () => {
    for (const guide of GUIDES) {
      assert.ok(guide.sections.length >= 3);
      assert.ok(guide.sections.every((section) => section.paragraphs.length >= 2));
      assert.ok(guide.faqs.length >= 2);
      assert.ok(guide.description.length >= 100);
    }
  });

  test("the sitemap includes every canonical guide URL", () => {
    const urls = new Set(sitemap().map((entry) => entry.url));
    assert.ok(urls.has(absoluteUrl("/guides")));
    for (const guide of GUIDES) {
      assert.ok(urls.has(absoluteUrl(`/guides/${guide.slug}`)));
    }
  });

  test("JSON-LD serialization escapes HTML opening characters", () => {
    assert.equal(jsonLd({ value: "</script>" }), '{"value":"\\u003c/script>"}');
  });
});
