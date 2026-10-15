# EarlyHer frontend

Touch-first breast-health guidance for kiosks in Nigerian primary healthcare centres and community outreaches. It also works in desktop, tablet and phone browsers. This repository is the **frontend prototype** (milestone: Thursday 15 October 2026). The Python backend and AI service are built separately.

EarlyHer gives education, structured questions and next-step guidance. It does **not** diagnose or rule out cancer, score risk, prescribe or recommend treatment. People use it anonymously; nothing needs an account.

> **All clinical wording in this build is draft.** It comes from the product brief and is shown with a "Draft" badge. See [Content requiring clinical review](#content-requiring-clinical-review).

## Run and build

Requires Node 20.9 or later (developed on Node 25).

```bash
npm install
npm run dev          # http://localhost:3000, mock services, demo-state panel on
npm run build        # production build
npm start            # serve the production build (needed to test offline)

npm test             # unit tests (Vitest)
npm run lint         # ESLint (eslint-config-next)
npm run typecheck    # TypeScript (run after a build or dev start so route types exist)
npm run verify:browser   # browser checks against `npm start`; add -- --timeout for the inactivity test
```

No backend is needed: every service has a mock adapter, used by default.

## Project structure

```
app/                     Routes (App Router). Pages are thin; screens live in components/.
  page.tsx               /             Welcome
  concern/               /concern      What have you noticed?
  assessment/            /assessment   One-question-at-a-time flow
  next-step/             /next-step    Your next step
  learn/, learn/[slug]/  /learn        Education menu and topics (prerendered)
  healthcare/, [id]/     /healthcare   Area, facility list, facility details
  manifest.ts            Web app manifest
components/
  ui/                    Button, Dialog (native <dialog>), notices and badges, icons
  layout/                Header (nav, connectivity, Finish), page shell
  home/                  Journey choices, device preview and feature cards
  assessment/            Concern picker, question flow, voice note
  next-step/             Recommendation + optional AI explanation
  learn/                 Topic menu, card viewer
  healthcare/            Finder, facility details, loading/empty/error states
  share/                 Print dialog and summary, SMS dialog and keypad, QR code
  session/               Session provider: reset, Finish confirmation, inactivity
  offline/               Service worker registration and route warm-up
  dev/                   Demo-state panel (development only)
content/
  en/ui.ts               Interface text (English)
  en/clinical.ts         Concerns, safety message, recommendations, general guidance
  en/education.ts        Education modules
  en/audio-map.ts        Content key -> recorded audio file
  pathways/              Question pathways and the registry (pathways/index.ts)
  fixtures/              Development fixtures: branching test pathway, fictional facilities
lib/
  types/                 Clinical content model and proposed API types
  engine/                Pathway engine (pure; branching, pruning, progress, validation)
  session/               In-memory session store and session actions
  services/              Adapters: AI explanation, facilities, SMS (mock + HTTP)
  validation/            Response guards, phone number validation
  audio/                 Single audio controller (recordings, device-voice fallback)
  config.ts              Public runtime configuration
public/
  brand/                 Logo and app icons derived from IMG/01-earlyher-logo-2.PNG
  audio/en/              Approved recordings go here (none supplied yet)
  sw.js                  Service worker
scripts/verify-browser.mjs   Viewport, journey, privacy and offline checks
```

`IMG/` holds the original design reference and logo; it is not used at run time. The web logo in `public/brand/` is the original artwork cropped to its circle with the solid black surround made transparent; lettering, proportions and colour are untouched.

## Content, questions and audio

| What | Where | Notes |
| --- | --- | --- |
| Concern list | `content/en/clinical.ts` | Each concern names a `pathwayId`, or `null` while none exists. |
| Question pathways | `content/pathways/*.ts`, registered in `content/pathways/index.ts` | Data only; see the model in `lib/types/clinical.ts`. |
| Recommendations ("Your next step") | `content/en/clinical.ts` | Referenced from pathway outcomes by id. |
| Education | `content/en/education.ts` | Modules made of short cards. |
| Interface text | `content/en/ui.ts` | |
| Audio | `content/en/audio-map.ts` + `public/audio/en/` | Also add files to `PRECACHE_URLS` in `public/sw.js` for offline playback. |

**Pathway model.** A pathway has `version`, `questionBankVersion`, `review` (status, reviewer, date, note), a start question, questions and outcomes. Each question has a `topic` (presenting concern, onset/duration, location, change over time, pain, age/reproductive history, previous breast history, family history), options (an option can be marked `kind: "unsure"`), and ordered `routes`. A route has an optional `when` condition (`questionId`/`anyOf`, `all`, `any`, `not`) and goes to a question or an outcome. The last route must be a default.

The engine (`lib/engine/pathway-engine.ts`) only follows the routes it is given. It:
- asks only the questions on the branch the answers select;
- removes answers from branches that no longer apply when an earlier answer changes;
- shows "Question N of M" only when every remaining route has the same length, and otherwise "Question N" with "More questions may follow";
- rejects pathways with missing default routes, unknown targets or loops (`validatePathway`); an invalid pathway is never offered.

"I can't find my answer" can record a `not-listed` answer, which follows the question's default route.

**Languages.** Only English is shipped and no language picker is shown. To add Yoruba or Nigerian Pidgin: copy `content/en` to `content/<code>`, translate, get medical wording reviewed, add audio under `public/audio/<code>`, then add a locale switch. No unreviewed medical translation should be shown.

## Mock and live adapters

`lib/services/index.ts` picks the adapters:

| Variable | Effect |
| --- | --- |
| `NEXT_PUBLIC_API_MODE=mock` (default) | No network calls to a backend. Results are marked `simulated` and the interface says so. |
| `NEXT_PUBLIC_API_MODE=http` + `NEXT_PUBLIC_API_BASE_URL=https://…` | Calls the Python backend directly from the browser. |

See `.env.example` for all settings (inactivity timing, recording limit, QR link, print layout, dev fixtures).

In `npm run dev` a **Demo states** panel at the bottom of each page switches the mocks between success, timeout, invalid response, failure, empty and unavailable, so every state can be reviewed without a backend. It is not rendered in production builds unless `NEXT_PUBLIC_SHOW_DEV_FIXTURES=true`. The same flag shows an "Interface test (not clinical)" option on the concern screen, which runs the branching fixture.

Mock defaults are deliberately honest: facilities report *unavailable* (no verified data source exists), and SMS/AI results are labelled as simulations.

## Proposed backend contracts

**These are proposals, not an agreed contract.** Names, fields and codes need confirming with the backend developer. Types live in `lib/types/api.ts`; response validation in `lib/validation/api-guards.ts`.

All requests: JSON, `credentials: "omit"`, `cache: "no-store"`, cancelled if the session ends. The browser must never hold provider keys: the backend owns AI and SMS credentials. If the backend sits on another origin it must allow CORS for the kiosk origin; alternatively, put it behind the same origin with a reverse proxy.

| Purpose | Request | Success response | Timeout |
| --- | --- | --- | --- |
| AI explanation | `POST /v1/explanations` `{ recommendationId, pathwayId, pathwayVersion, questionBankVersion, locale }` | `{ explanation: string }` (≤ 700 chars, plain text) | 8 s |
| Areas | `GET /v1/areas` | `{ areas: [{ id, name }] }` | 10 s |
| Facilities | `GET /v1/facilities?area_id=` | `{ facilities: Facility[] }` | 10 s |
| Facility | `GET /v1/facilities/{id}` | `Facility` | 10 s |
| SMS | `POST /v1/sms` `{ phoneNumber (E.164), templateId: "next-step" \| "facility", recommendationId?, facilityId?, pathwayVersion?, locale }` | `{ status: "accepted" \| "queued", messageId? }` | 12 s |

`Facility` = `{ id, name, type, areaId, address, services[], openingHours?, phone?, directions?, distanceKm?, publicUrl?, verification: { status: "verified" | "unverified", verifiedOn?, source? } }`.

Error handling: `404`/`503` → "unavailable"; other non-2xx → "server"; bad JSON or shape → "invalid-response"; no connection → "offline" (no request is made); time limit → "timeout". None of these block a journey.

Safeguards in the frontend:
- **AI** receives identifiers only, never answers, free text or phone numbers. Its text is shown under the approved recommendation, labelled "AI-assisted", and can never replace or alter it. Responses are rejected if they look diagnostic, mention risk levels, dosages or medicines, discourage seeking care, contain markup or are too long; the approved "Why?" text is always shown regardless. The backend remains responsible for constraining the model.
- **Facilities**: phone numbers are dropped unless the record is `verified`; distance appears only if the backend supplies it; QR codes only for `https` URLs without query strings.
- **SMS**: the frontend names a template; the backend owns the final wording. "accepted"/"queued" are never shown as delivered. Nothing is queued in the browser for later.

## Offline setup and limitations

`public/sw.js` (registered only in production builds):
- On install it caches every core screen (`/`, `/concern`, `/assessment`, `/next-step`, `/learn` and each topic, `/healthcare`) and the build files those pages reference, plus the logo and manifest.
- Page loads: network first (4 s), then the cached copy.
- Router data for moving between screens is cached as it is fetched; after install the app warms it for every core screen.
- Build files are cache-first; `public/` files are served from cache and refreshed in the background.
- It never handles non-GET requests, other origins (the backend), or `/api/`. Answers, phone numbers and recordings never pass through it.
- Each build registers `/sw.js?v=<build id>`, so a new deployment starts with fresh caches and removes the old ones.

Limitations:
- **First load needs a connection** (or a local kiosk server). Offline support starts once the service worker has installed, which happens in the background on the first visit.
- Service workers need `https://` or `http://localhost`. A kiosk served from a LAN IP over plain HTTP will not get offline support; use HTTPS or run the server on the kiosk itself.
- `next dev` does not register the worker; test offline with `npm run build && npm start`.
- AI explanations, SMS and facility data need a connection; their failure shows a fallback and does not block anything.
- Clearing browser data removes the cache; the next online visit reinstalls it.

## Session privacy

- Answers, results, the phone number, the chosen area and recordings exist only in page memory (`lib/session/session-store.ts`). Nothing is written to localStorage, IndexedDB, cookies or URLs. Facility ids are the only route parameters.
- **Finish** (header and end screens, with confirmation) and the **inactivity timeout** (default 120 s, then a 30 s "Are you still there?" warning with "Continue session") both reset the session: pending requests are aborted, the microphone is stopped, recordings are deleted and their object URLs revoked, audio stops, all state is cleared, every screen is remounted, and the app returns to the welcome screen with `router.replace`.
- Work started in a previous session (late AI or SMS replies) is discarded by epoch and abort checks.
- A refresh, a direct visit, or browser Back after Finish shows a "Let's start again" screen rather than old data.
- The phone number is cleared as soon as the SMS dialog closes, and at session end.
- No analytics, session replay or logging of request bodies.

## Hardware dependencies

- **Printing** uses the browser's print window. The app only knows the window was opened, so it says "Please check the printer" and never "Printed". Silent printing on a kiosk (for example Chrome's `--kiosk-printing`) and the default printer are device configuration. `NEXT_PUBLIC_PRINT_LAYOUT=thermal-80` switches to a 72 mm column for 80 mm receipt printers; this needs testing on the actual printer. When a device agent can report printer status, return `"unavailable"` from `getPrinterStatus()` in `lib/services/index.ts` to show "Printing is temporarily unavailable."
- **Audio** needs speakers; the device-voice fallback depends on the browser and installed voices and may not work offline.
- **Microphone** for the optional voice note needs browser permission and HTTPS (or localhost).
- **Touchscreen**: the 17-inch kiosk's resolution and orientation are not yet known; layouts were checked at the viewports listed below. Browser zoom is not disabled.

## Content requiring clinical review

Every item below is marked `status: "draft"` in the content model and shows a "Draft" badge:

- Safety message on the concern and next-step screens.
- Recommendation: "Based on the information you provided, we recommend speaking with a healthcare professional about this change." and its "Why?" text (taken from the supplied education wording).
- General guidance shown when a concern has no pathway, and the healthcare fallback line "visit your nearest primary healthcare centre or hospital and ask to speak with a healthcare professional" (`content/en/ui.ts`).
- The lump pathway (`content/pathways/lump.demo.ts`): the three supplied example questions only. It is linear, has no escalation rules, and all answers reach the same draft next step. **The full question bank, branching rules, escalation criteria and recommendations are outstanding**, as are pathways for the seven other concerns (they currently show "Questions for this concern are not ready yet").
- All four education modules, including the short card headings added for layout (e.g. "Everyone is different").
- SMS message templates (`content/en/ui.ts` → `sms.templates`).
- The simulated AI text uses only supplied education wording.
- Approved recordings and illustrations have not been supplied.

## Completed frontend features

- Welcome screen after the reference design, in the EarlyHer palette, with the three journeys first on every screen size, Listen, connectivity badge, and a device preview built from markup.
- Concern selection with pathway or honest "not ready" state; reusable adaptive question screen with Back, edit-from-review, stale-answer removal, honest progress, Listen, "I can't find my answer" (I'm not sure / not listed / voice note / healthcare) and Exit.
- Next step with the two independent layers (pathway recommendation; optional AI explanation with loading, timeout, invalid, failure and offline fallbacks), safety message, and Find healthcare, Print, SMS, Learn more, Finish.
- Education: menu, four modules of short cards, "Have you noticed any of these changes?" (Yes → concern, No → continue), completion actions.
- Healthcare: areas, list, details, loading, empty, failure, offline and unavailable states; fictional fixtures behind the demo panel only.
- SMS dialog with on-screen keypad, validation, preview, sending/accepted/queued/failure/offline states and print alternative.
- Print preview and print-only stylesheet (page and 80 mm layouts), optional QR for configured public pages.
- Voice note: explicit permission, start/stop, playback, delete, time limit, denied/unsupported states, nothing uploaded.
- Session reset, inactivity warning, service worker offline support, responsive layouts, keyboard and screen-reader semantics, visible focus, reduced motion.

## Remaining integration tasks

1. Agree the API contract above with the backend developer; set `NEXT_PUBLIC_API_MODE=http` and the base URL; resolve CORS or a same-origin proxy.
2. Load clinically approved pathways, recommendations, safety wording and education content, and set their review metadata.
3. Supply a verified facility data source (with verification dates) and, if wanted, public facility pages for QR codes.
4. Add approved audio recordings and illustrations; add audio to the service worker precache list.
5. Configure the kiosk: HTTPS or local server, kiosk browser mode, silent printing, printer testing, microphone and speaker checks, screen resolution checks on the 17-inch unit.
6. Add Yoruba, Nigerian Pidgin and other languages once translations are reviewed.

## Verification

See the summary at the end of this file for what was run for this milestone and what could not be verified.
