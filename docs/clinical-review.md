# Triage: clinical and language review

**Status: working implementation specification, not clinically validated.** The breast-concern
and self-check triage implements the supplied working specification as written. Where that
specification is ambiguous, inconsistent or silent, the choice made here is listed below. Each
one is isolated in code so it can be changed without touching the rest of the engine.

Do not use this triage with the public until the clinical lead has reviewed every item below,
reviewed the wording in `content/en/triage.ts`, and signed off `TRIAGE_POLICY.review` in
`lib/triage/rules.ts`.

## Where things live

| What | File |
| --- | --- |
| Question ids, stages, answer types and option ids | `lib/triage/questions.ts` |
| Branching, branch queue, skipped questions, early Red, invalidation | `lib/triage/flow.ts` |
| Urgency rules, flags, combinations, reasons, advice | `lib/triage/rules.ts` |
| Policy switches for unresolved paths | `TRIAGE_POLICY` in `lib/triage/rules.ts` |
| All user-facing wording (English) | `content/en/triage.ts` |
| Yoruba wording (empty, gated on review) | `content/yo/triage.ts` |
| Tests that pin each rule | `lib/triage/triage.test.ts` |

Each rule records a stable rule id (for example `B3.single-duct`) and, if provisional, a review
item (`CR-1` to `CR-8`). Rule ids and review items never appear on user screens.

## How the engine reads the specification

- **Levels**: 1 Green (routine), 2 Yellow (within 4 weeks), 3 Orange (within 1 week), 4 Red (today, within 24 hours).
- **Minimum level vs Yellow flag**: a rule written as "→ Yellow / Orange / Red" sets a *minimum* level.
  A rule written as "→ one Yellow flag" adds a named flag. Flags are a set, so the same flag is counted once.
- **Combinations**: two or more distinct flags → minimum Orange. History risk plus a Yellow finding
  (a direct Yellow, or at least one flag) → Orange. History risk plus Green stays Green with screening advice.
- **Highest wins**: the final level is the highest across all active findings. Reassuring answers never remove a finding.
- **Recomputed, never counted**: urgency is rebuilt from the current applicable answers every time.
  Answers to questions that no longer apply are removed when the person moves on, and the engine only ever
  reads answers on the current path, so hidden answers cannot affect the result.
- **Branch order**: A, B, C, D from the first question. A branch disclosed later (B5, C7, D6, or the self-check)
  is inserted straight after the current branch unless it is already queued or done.
- **"A lump" for R3 and R4**: taken to mean the person answered A1 (the lump branch was asked).
- **History skipping**: when the result is already Orange or Red after the symptom branches, H1–H4 are skipped and only H5 is asked.
- **D4 and D5 both apply**: the specification says "D4 if inversion selected, otherwise D5 if scaly". When both changes are chosen, both D4 and D5 are asked, because each adjusts only its own finding.
- **C3 "strong/disruptive"**: read as strong pain *or* pain that stops sleep or daily activities.
- **R3 "stopped breastfeeding"**: counts for the B4 milky-fluid exception only, not for the lump rule (the specification names pregnant or currently breastfeeding for the lump rule).

## Items for clinical decision

### CR-1 Fever with inflammation lasting weeks
The detailed R2 rule makes "recent + fever" Red, "recent without fever" Orange and "weeks" Orange.
The broader source rule describes fever plus inflammation as Red regardless of duration.
**Implemented:** the detailed rule. Weeks-long inflammation with fever is **Orange** (rule `R2.weeks`, marked `CR-1`).
**Decide:** should weeks + fever be Red? If so, change `R2.weeks` to `minimum(4)` when `fever` is true.
Also confirm whether D2 (how long a skin change has been noticed) should interact with fever, as the source
overview suggested; D2 is currently record-only.

### CR-2 Nipple discharge escalation
The source overview used broader escalation criteria than the detailed B3 rule. **Implemented:** the detailed
rule only: spontaneous (or unknown) + one breast + one opening → Orange (`B3.single-duct`). "I can't tell" for
openings does not meet this rule.
**Decide:** whether the broader overview criteria should also apply, and how "I can't tell" should be treated.

### CR-3 Injury exception
Source descriptions of the injury exception differ. **Implemented:** when pain (C) is the only symptom branch and
the knock was in the last 2 weeks, the C3/C4 pain-only escalations are switched off. Other findings (for example C6
redness, R2, R4) still apply. If another branch is added, the exception no longer applies.
**Decide:** the exact scope, and whether "more than 2 weeks ago" should change anything.

### CR-4 One isolated Yellow flag
The specification does not settle whether one Yellow flag on its own establishes Yellow.
**Implemented:** `TRIAGE_POLICY.singleYellowFlag = "review-fallback"`. With exactly one flag and no other finding,
the person sees the review-safe result "Talk to a health professional", which asks them to contact a professional
and ask how soon to be seen, without stating a timeframe or a diagnosis.
**Decide:** set to `"yellow"` if one flag should mean "within 4 weeks". A test pins the current behaviour.

### CR-5 Skin and nipple findings (D1, D4, D5)
Each positive D1 finding provisionally sets Orange. D4 "always turned inward" removes only the inversion finding.
D5 "clears with cream" changes only the scaly-skin finding to a direct Yellow. **Confirm** these levels.
Redness, swelling and warmth already captured by R2 share R2's reason so the result does not repeat itself.

### CR-6 Direct Yellow vs counted flags, and missing uncertainty mappings
Where the specification says "→ Yellow" it is implemented as a direct minimum Yellow, for example B4 milky
fluid from both breasts on squeezing, and B4 thick or coloured fluid from several openings.
Answers with no mapping in the specification are record-only, which may under-triage:

| Answer | Current effect |
| --- | --- |
| B3 "I can't tell" | No B3 finding; B4 falls through to "remaining combinations" (one flag) |
| D3 "I'm not sure" | None |
| A4 "It feels different" | Orange (as specified) |
| H1–H4 "I don't know" | No history risk |
| R1 "I haven't checked, but I feel feverish" | Counts as fever (as specified) |
| N4 "I don't remember" | Routine-check prompt (as specified) |

**Decide** whether any of these should add a flag or a minimum level.

### CR-7 Combined B5 question
B5 asks about "a lump, a thick area, or a change in your nipple" in one question. A "Yes" sets Orange and adds
both the lump (A) and skin/nipple (D) branches, because the answer does not say which it was.
**Decide** whether to split B5 into separate questions.

### CR-8 H5 "It needed a follow-up"
H5 is record-only in the supplied rules and there is no follow-up policy. Rather than present a confident routine
result, `TRIAGE_POLICY.priorScanFollowUpAtGreen = "review-fallback"` shows the review-safe result when H5 is
"It needed a follow-up" and the result would otherwise be Green. No escalation to a timeframe is invented.
**Decide** the follow-up policy.

## Other review items

- **Adolescent consent and care.** The age question starts at "Under 25". There is no separate consent wording,
  guardian guidance or age-specific care pathway for people under 18. Decide what consent and safeguarding wording
  is needed and whether any rules differ for adolescents.
- **Screening and self-check content.** The self-check instructions (N2, N3), the mammogram prompt for ages 40+,
  the "routine breast check" prompt and the monthly self-check reminder follow the specification. Confirm they match
  the screening guidance for the deployment area.
- **Timeframes.** Red today/within 24 hours, Orange within 1 week, Yellow within 4 weeks. Confirm, and confirm
  that the Yellow recheck reminder (2 weeks) and "after your next period" recheck are appropriate.
- **Hormone check wording (B6).** Shown as "Tell the doctor about the headaches, vision changes or missed periods.
  They may suggest a blood test to check your hormones." Confirm wording.

## Wording drafted for this implementation (needs clinical and language review)

The specification supplied most wording verbatim. The following was written for this implementation:

- The review-safe result: headline "Talk to a health professional" and its body text.
- All "What informed this guidance" reason sentences (`results.reasons`).
- The hormone-check, monthly self-check and Yellow recheck reminder wording.
- The no-concern welcome headline "Let's do a breast check-in together".
- B3 helper text about nipple openings, H2 gene-change explanation, H4 biopsy-term explanation.
- "I need help now" dialog text, the deferred self-check screen, the privacy summary page.
- Short summary labels for each question in the doctor summary.

## Yoruba

No reviewed Yoruba triage text exists and none was drafted, because the wording carries clinical meaning.
While Yoruba is selected, the triage shows English with the existing visible notice. Both languages use the
same rules. To add Yoruba, fill `content/yo/triage.ts` (same structure as the English), have it reviewed by a
fluent reviewer **and** the clinical lead, then set `triageYoReview.status` to `"approved"`. Until then nothing
in that file is shown.
