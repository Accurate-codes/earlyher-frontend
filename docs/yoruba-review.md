# Yoruba translation review

**Status: draft, not reviewed, not clinically approved.** Every Yoruba text in the app was drafted on 2026-10-23 with an AI assistant. No fluent Yoruba speaker or health professional has checked it yet. While Yoruba is selected the app shows a "draft translation" notice.

## Who reviews what

| File | Contents | Reviewers |
| --- | --- | --- |
| `content/yo/triage.ts` | Questions, answers, helper text, results, reasons, advice, summary, consent, privacy, reminders | Fluent Yoruba speaker **and** clinical lead |
| `content/yo/clinical.ts` | Disclaimer ("This tool does not diagnose…") | Fluent speaker **and** clinical lead |
| `content/yo/education.ts` | Education cards | Fluent speaker **and** clinical lead |
| `content/yo/ui.ts` | Buttons, start screen, healthcare finder, dialogs, audio messages | Fluent speaker |

The full side-by-side list (content id, wording, version) for everything Listen reads is produced by `npm run audio:status -- yo` in `audio-scripts/yo.csv`. To see English and Yoruba together, open `content/en/triage.ts` and `content/yo/triage.ts` side by side: they use the same keys in the same order.

When a file has been reviewed, set its review to `status: "approved"` with `reviewedBy` and `reviewedOn`. The draft notice disappears only when **all four** files are approved.

## Check these first

These are the choices most likely to change the meaning or to read unnaturally.

### Meaning that must not change

| English | Draft Yoruba | Question for the reviewer |
| --- | --- | --- |
| This is guidance, not a diagnosis | Ìtọ́sọ́nà ni èyí, kì í ṣe ìdámọ̀ àìsàn | Is "ìdámọ̀ àìsàn" understood as "diagnosis"? Alternatives: "àyẹ̀wò àìsàn" (may read as "medical test"). |
| This tool does not diagnose | Ètò yìí kì í dá àìsàn mọ̀ | Same term. |
| Get seen today / Today, within 24 hours | Ẹ jẹ́ kí dókítà rí yín lónìí / Lónìí, láàárín wákàtí 24 | Urgency must stay "today". |
| See a doctor this week / Within 1 week | Ẹ rí dókítà ní ọ̀sẹ̀ yìí / Láàárín ọ̀sẹ̀ 1 | |
| Book a visit soon / Within the next 4 weeks | Ẹ tètè ṣètò láti rí dókítà / Láàárín ọ̀sẹ̀ 4 tó ń bọ̀ | "tètè" (soon) must not sound like "urgently". |
| No urgent concern / Routine care | Kò sí ìdààmú kánjúkánjú / Ìtọ́jú déédéé | Must not sound like "you are healthy". |
| This check cannot rule out every problem | Àyẹ̀wò yìí kò lè yọ gbogbo ìṣòro kúrò | Is the uncertainty clear? |
| Talk to a health professional (no timeframe) | Ẹ bá òṣìṣẹ́ ìlera sọ̀rọ̀ | |
| Urgent / Soon / Routine (labels) | Kánjúkánjú / Láìpẹ́ / Àyẹ̀wò déédéé | |

### Medical and body terms

| English | Draft | Note |
| --- | --- | --- |
| breast / nipple | ọmú / orí ọmú | |
| lump, thick area | kókó, ibi tó ki | Is "ibi tó ki" right for "thickening"? |
| armpit | abíyá | |
| fluid / discharge from the nipple | omi láti orí ọmú | |
| fever / chills | ibà / òtútù tó ń mú yín gbọ̀n | |
| red, hot, swollen | pọ́n, gbóná, wú | |
| dimpling or puckering | ihò kéékèèké tàbí awọ tó ká jọ | Natural? |
| orange peel skin | awọ tó rí bí èèpo ọsàn | |
| nipple turned inward | orí ọmú tó yí wọnú / fà wọlé | |
| scaly, crusty, itchy | ń bó, ní èépá, ń yún | |
| eczema | ẹ̀yi (eczema) | Is "ẹ̀yi" the usual word, or keep "eczema"? |
| period | nǹkan oṣù | |
| pregnant / breastfeeding | lóyún / ń fún ọmọ lọ́mú | |
| weight loss I can't explain | Ara mi ń rù, mi ò sì mọ ìdí rẹ̀ | |
| cancer | jẹjẹrẹ | Used only in family-history questions, never in results. |
| ovarian cancer | jẹjẹrẹ ẹyin obìnrin (ovary) | Check. |
| gene change | ìyípadà nínú jíìnì (gene) | |
| radiation treatment | ìtọ́jú ìtànṣán (radiation) | |
| mammogram, ultrasound, biopsy, scan, cyst, LCIS, atypical, BRCA | Kept in English, sometimes with a Yoruba explanation | Decide whether English terms are clearer for patients. |
| antidepressants, antipsychotics, antacids | Oògùn fún ìrẹ̀wẹ̀sì ọkàn…, oògùn fún àìsàn ọpọlọ, oògùn fún ọkàn tó ń jóná tàbí ásíìdì inú | "Àìsàn ọpọlọ" may be stigmatising; check. |
| pink (fluid colour) | àwọ̀ pupa rúsúrúsú (pink) | |
| lump firmness: soft / rubbery / firm / hard | ó rọ̀ / ó dà bí rọ́bà / ó le díẹ̀ / ó le bí òkúta | Compared with earlobe, nose tip, forehead. |
| quadrants: upper outer etc. | Òkè/Ìsàlẹ̀, ní ẹ̀gbẹ́ abíyá / ẹ̀gbẹ́ àárín àyà | "Outer" is explained as "towards the armpit". |
| health worker / health professional / doctor | òṣìṣẹ́ ìlera / òṣìṣẹ́ ìlera / dókítà | |

### Style decisions

- Address is respectful plural (**ẹ / yín**) throughout, for adults and teenagers alike. Answer options are in the first person ("Mo…", "Mi ò…") because the person is speaking.
- Numbers are written as digits (ọdún 25 sí 39, ọ̀sẹ̀ 4) so ages and timeframes are easy to read.
- Some English terms are kept in brackets where patients may know only the English word.
- "Listen" is "Tẹ́tí sílẹ̀"; "Finish" is "Parí"; "Back" is "Padà sẹ́yìn".

### Things that stay in English on purpose

- The doctor-summary PDF (the PDF font cannot show Yoruba marks); the screen says so in Yoruba.
- Facility names, types, addresses and dataset labels from the facility data.
- The staff-only demo panel.
- Browser tab titles (page metadata).

## Audio review

No generated Yoruba speech or recordings have been listened to in this project. Before relying on Listen in Yoruba, a fluent reviewer should listen to a sample of questions and every result, checking tones, pace and that medical words are understandable. Record the voice and settings used (provider, voice, speed) with the review.
