import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  publishedProperties,
  publishedPropertyType,
} from "../lib/published-note";

describe("published note properties", () => {
  test("preserves supported property types", () => {
    const properties = publishedProperties(`---
title: "Roadmap"
score: 42
done: true
due: "2026-07-20"
site: "https://usemarkd.app"
tags: []
---
Body`);

    assert.deepEqual(
      properties.map(({ value }) => publishedPropertyType(value)),
      ["text", "number", "checkbox", "date", "url", "list"],
    );
    assert.equal(properties[1]?.value, 42);
    assert.equal(properties[2]?.value, true);
    assert.deepEqual(properties[5]?.value, []);
  });
});
