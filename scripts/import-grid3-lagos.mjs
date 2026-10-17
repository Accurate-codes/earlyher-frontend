/**
 * Builds the offline Lagos facility snapshot from GRID3 NGA – Health Facilities v2.0.
 *
 *   node scripts/import-grid3-lagos.mjs <path-to-nga_health_facilities_v2_0.gpkg> [--retrieved YYYY-MM-DD]
 *
 * Download the GeoPackage from the Humanitarian Data Exchange (dataset
 * "grid3-nga-health-facilities-v2-0"). Licence: CC BY 4.0 — see the data release notes.
 * Uses Node's built-in SQLite (Node 22.5+), so no extra package is needed.
 *
 * The output keeps only what the dataset actually contains. It has no street addresses,
 * phone numbers, opening hours or services, so none are written. Nothing is merged by
 * name; HFR codes are kept as recorded so a later join with the HFR can use them.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

const args = process.argv.slice(2);
const input = args.find((arg) => !arg.startsWith("--"));
if (!input) {
  console.error("Usage: node scripts/import-grid3-lagos.mjs <gpkg path> [--retrieved YYYY-MM-DD]");
  process.exit(1);
}
const retrievedIndex = args.indexOf("--retrieved");
const retrievedOn = retrievedIndex >= 0 ? args[retrievedIndex + 1] : new Date().toISOString().slice(0, 10);

const OUTPUT = "public/data/facilities-lagos.json";
const TABLE = "NGA_health_facilities_v2_0";

const db = new DatabaseSync(input, { readOnly: true });
const rows = db
  .prepare(
    `SELECT globalid, nhfr_uid, nhfr_facility_code, state, lga, lga_name_disagreement, ward, ward_name_disagreement,
            facility_name, facility_name_source, ownership, ownership_type, facility_level, facility_level_option,
            latitude, longitude, geocoordinates_source, last_updated
       FROM ${TABLE} WHERE state = 'Lagos' ORDER BY facility_name`,
  )
  .all();

/** Normalises whitespace (the source contains non-breaking spaces) and drops "Unknown". */
function text(value) {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned && cleaned.toLowerCase() !== "unknown" ? cleaned : null;
}

function coordinate(value, min, max) {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max
    ? Math.round(value * 1e6) / 1e6
    : null;
}

const records = [];
let skipped = 0;
for (const row of rows) {
  const name = text(row.facility_name);
  if (!name || !row.globalid) {
    skipped += 1;
    continue;
  }
  const lat = coordinate(row.latitude, 4, 14);
  const lng = coordinate(row.longitude, 2, 15);
  const flags = [];
  if (Number(row.lga_name_disagreement) === 1) flags.push("lga-name-disagreement");
  if (Number(row.ward_name_disagreement) === 1) flags.push("ward-name-disagreement");

  records.push({
    id: `grid3:${row.globalid}`,
    hfrCode: text(row.nhfr_facility_code),
    hfrUid: typeof row.nhfr_uid === "number" ? String(Math.trunc(row.nhfr_uid)) : text(row.nhfr_uid),
    name,
    nameOrigin: text(row.facility_name_source),
    type: text(row.facility_level_option),
    level: text(row.facility_level),
    ownership: text(row.ownership),
    ownershipType: text(row.ownership_type),
    state: text(row.state),
    lga: text(row.lga),
    ward: text(row.ward),
    lat,
    lng,
    coordinatesOrigin: lat !== null && lng !== null ? text(row.geocoordinates_source) : null,
    sourceUpdated: text(row.last_updated),
    flags,
  });
}

const snapshot = {
  schema: 1,
  coverage: { state: "Lagos", country: "Nigeria" },
  generatedOn: retrievedOn,
  sources: [
    {
      id: "grid3-nga-hf-v2",
      name: "GRID3 NGA – Health Facilities v2.0",
      publisher: "Center for Integrated Earth System Information (CIESIN), Columbia University; GRID3",
      version: "2.0",
      released: "2024-11-13",
      url: "https://data.humdata.org/dataset/grid3-nga-health-facilities-v2-0",
      doi: "https://doi.org/10.7916/kv1n-0743",
      licence: "CC BY 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by/4.0/",
      attribution:
        "Center for Integrated Earth System Information (CIESIN), Columbia University 2024. GRID3 NGA - Health Facilities v2.0. New York: GRID3. https://doi.org/10.7916/kv1n-0743",
      retrievedOn,
      limitations:
        "Non-exhaustive and non-validated. May omit facilities or include closed ones. No addresses, phone numbers, opening hours or services.",
    },
  ],
  records,
};

mkdirSync("public/data", { recursive: true });
writeFileSync(OUTPUT, JSON.stringify(snapshot));
console.log(`Wrote ${records.length} Lagos records to ${OUTPUT} (${skipped} skipped without a name or id).`);
