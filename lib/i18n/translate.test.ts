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

  it("has a Yoruba draft for every interface text, not yet approved", () => {
    // The staff-only panel stays in English.
    const missing = listMissingKeys(ui, uiYo).filter((key) => !key.startsWith("dev"));
    expect(missing).toEqual([]);
    expect(countLeaves(ui)).toBeGreaterThan(100);
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
