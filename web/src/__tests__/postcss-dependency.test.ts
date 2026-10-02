import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const fromNext = createRequire(require.resolve("next/package.json"));
const postcss = fromNext("postcss") as typeof import("postcss");

describe("Next CSS dependency security patch", () => {
  it("resolves the reviewed patched PostCSS rather than Next's vulnerable nested copy", () => {
    expect(fromNext("postcss/package.json").version).toBe("8.5.28");
  });
  it("preserves normal CSS parsing and serialization used by the build", () => {
    const root = postcss.parse(".mercenta { color: var(--foreground); }");
    expect(root.first?.type).toBe("rule");
    expect(root.toString()).toContain("var(--foreground)");
  });
});
