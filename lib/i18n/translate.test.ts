import { describe, expect, it } from "vitest";
import { ui } from "@/content/en/ui";
import { uiYo, uiYoReview } from "@/content/yo/ui";
import { countLeaves, listMissingKeys, localize, mergeTranslations } from "./translate";

describe("interface translations", () => {
  const base = { a: "A", nested: { b: "B", fn: (n: number) => `n=${n}` }, list: ["x"] };

  it("uses translated text where it exists and English elsewhere", () => {
    const merged = mergeTranslations(base, { nested: { b: "Bé" } });
    expect(merged.a).toBe("A");
    expect(merged.nested.b).toBe("Bé");
    expect(merged.nested.fn(2)).toBe("n=2");
  });

  it("lists every untranslated key", () => {
    expect(listMissingKeys(base, { nested: { b: "Bé" } })).toEqual(["a", "nested.fn", "list"]);
    expect(countLeaves(base)).toBe(4);
  });

  it("reports the Yoruba coverage honestly", () => {
    const missing = listMissingKeys(ui, uiYo);
    const total = countLeaves(ui);
    // No reviewed Yoruba interface text has been supplied yet; this documents the gap.
    console.info(`Yoruba interface coverage: ${total - missing.length} of ${total} texts translated.`);
    expect(missing.length).toBeGreaterThan(0);
    expect(uiYoReview.status).not.toBe("approved");
  });
});

describe("clinical text", () => {
  it("uses a translation only once its review is approved", () => {
    const text = { en: "Question", yo: "Ìbéèrè" };
    expect(localize(text, "yo")).toEqual({ text: "Question", lang: "en" });
    expect(localize(text, "yo", { yo: { status: "draft" } })).toEqual({ text: "Question", lang: "en" });
    expect(localize(text, "yo", { yo: { status: "approved" } })).toEqual({ text: "Ìbéèrè", lang: "yo" });
    expect(localize({ en: "Only English" }, "yo", { yo: { status: "approved" } })).toEqual({ text: "Only English", lang: "en" });
  });
});
