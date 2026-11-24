import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { generatedYo } from "@/content/yo/generated-audio-map";
import { spokenYo } from "@/content/yo/spoken";
import { unspeakable } from "./mms";
import { speechText } from "./speech-catalog";

describe("Meta MMS Yoruba speech", () => {
  it("reads Yoruba letters, tone marks and pauses", () => {
    expect(unspeakable("Ẹ jọ̀wọ́, ẹ bá òṣìṣẹ́ ìlera sọ̀rọ̀ lónìí.")).toEqual([]);
    expect(unspeakable("Níbo lẹ fẹ́ bẹ̀rẹ̀?")).toEqual([]);
    expect(unspeakable("Ẹ yan \"Mi ò mọ̀\" (tí kò bá dá yín lójú)")).toEqual([]);
  });

  it("refuses text whose numbers, symbols or letters the voice would skip", () => {
    expect(unspeakable("Lónìí, láàárín wákàtí 24")).toEqual(["2", "4"]);
    expect(unspeakable("38°C")).toEqual(["3", "8", "°", "c"]);
    expect(unspeakable("eczema")).toEqual(["c", "z"]);
  });

  it("has a clip for the current wording behind every generated entry, never for unreadable text", () => {
    for (const [id, version] of Object.entries(generatedYo)) {
      const entry = speechText("yo", id);
      expect(entry?.version, `${id}: wording changed, run npm run audio:mms`).toBe(version);
      expect(existsSync(path.join("public", "audio", "generated", "yo", `${id}.${version}.mp3`)), id).toBe(true);
      const spoken = spokenYo[id]?.forVersion === version ? spokenYo[id].text : entry!.text;
      expect(unspeakable(spoken), id).toEqual([]);
    }
  });

  it("keeps every spoken form readable by the voice", () => {
    for (const [id, spoken] of Object.entries(spokenYo)) expect(unspeakable(spoken.text), id).toEqual([]);
  });
});
