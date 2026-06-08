import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { basename } from "node:path";

const [, , inputPath, outputPath] = process.argv;

if (!inputPath || !outputPath) {
  console.error("Usage: npm run bundle-to-sqlite -- mobile-bundle.json desktop-import.sqlite");
  process.exit(1);
}

if (!existsSync(inputPath)) {
  console.error(`Input file not found: ${inputPath}`);
  process.exit(1);
}

const bundle = JSON.parse(readFileSync(inputPath, "utf8"));
if (bundle.app !== "legal-support-mobile-pwa" || bundle.format_version !== 1) {
  console.error("Input file is not a compatible Legal Support mobile bundle.");
  process.exit(1);
}

if (existsSync(outputPath)) unlinkSync(outputPath);

const tables = bundle.tables || {};
const sql = [
  "PRAGMA foreign_keys=OFF;",
  schemaSql(),
  insertRows("stations", ["id", "name", "active", "created_at", "updated_at", "deleted_at"], tables.stations || []),
  insertRows("officers", ["id", "name", "active", "created_at", "updated_at", "deleted_at"], tables.officers || []),
  insertRows("codebook_categories", ["id", "group_key", "code", "label", "protected", "sort_order", "active", "created_at", "updated_at", "deleted_at"], tables.codebook_categories || []),
  insertRows("activity_entries", [
    "id", "activity_number", "activity_date", "station_id", "officer_id", "shift_session", "start_time", "end_time",
    "time_spent_minutes", "main_category_code", "sub_category_group", "sub_category_code", "beneficiary_type_code",
    "people_assisted", "saps_section", "capacity_built", "substitution_risk", "outcome_status", "followup_required",
    "followup_due_date", "evidence_type", "evidence_note", "confidentiality_risk", "notes", "reviewed_at",
    "created_at", "updated_at", "deleted_at"
  ], tables.activity_entries || []),
  insertRows("dva_details", [
    "id", "activity_id", "dva_reference", "repeat_incident", "complainant_vulnerable", "assistance_type_code",
    "application_assisted", "affidavit_assisted", "court_delivery_required", "court_delivery_completed",
    "protection_order_returned", "order_filed_at_station", "warrant_filed", "service_required", "service_completed",
    "breach_reported", "arrest_warrant_execution_issue", "referred_to_ngo", "referral_destination", "followup_due_date",
    "outcome_note", "created_at", "updated_at", "deleted_at"
  ], tables.dva_details || []),
  insertRows("followups", [
    "id", "activity_id", "due_date", "description", "completed_at", "created_at", "updated_at", "deleted_at",
    "status", "responsible_officer_id", "completion_note"
  ], tables.followups || []),
  insertRows("weekly_reflections", [
    "id", "week_starting_date", "week_ending_date", "station_id", "officer_id", "achievements", "capacity_building",
    "public_service_outcomes", "dva_outcomes", "docket_quality_issues", "recurring_training_needs",
    "recurring_station_constraints", "court_coordination_issues", "substitution_risks", "urgent_management_issues",
    "recommendations_gitoc", "recommendations_saps", "positive_feedback", "sensitive_issues", "created_at", "updated_at", "deleted_at"
  ], tables.weekly_reflections || []),
  `INSERT INTO import_logs (id, source_path, source_schema_version, preview_json, result_json, pre_import_backup_path, created_at)
   VALUES (${q(`mobile-${Date.now()}`)}, ${q(basename(inputPath))}, 'mobile-pwa-1', NULL, NULL, NULL, ${q(new Date().toISOString())});`,
  "PRAGMA foreign_keys=ON;"
].join("\n");

const result = spawnSync("sqlite3", [outputPath], { input: sql, encoding: "utf8" });
if (result.status !== 0) {
  console.error(result.stderr || result.stdout);
  process.exit(result.status || 1);
}

console.log(`Created ${outputPath}`);
console.log(`Activities: ${(tables.activity_entries || []).length}`);
console.log("Use the desktop app: Exports > Import App Data > choose this .sqlite file.");

function insertRows(table, columns, rows) {
  if (!rows.length) return "";
  return rows.map((row) => {
    const values = columns.map((column) => q(row[column]));
    return `INSERT OR REPLACE INTO ${table} (${columns.join(", ")}) VALUES (${values.join(", ")});`;
  }).join("\n");
}

function q(value) {
  if (value === undefined || value === null) return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function schemaSql() {
  return `
CREATE TABLE IF NOT EXISTS officers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);
CREATE TABLE IF NOT EXISTS stations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);
CREATE TABLE IF NOT EXISTS codebook_categories (
  id TEXT PRIMARY KEY,
  group_key TEXT NOT NULL,
  code TEXT NOT NULL,
  label TEXT NOT NULL,
  protected INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT,
  UNIQUE(group_key, code)
);
CREATE TABLE IF NOT EXISTS activity_entries (
  id TEXT PRIMARY KEY,
  activity_number TEXT NOT NULL UNIQUE,
  activity_date TEXT NOT NULL,
  station_id TEXT NOT NULL,
  officer_id TEXT NOT NULL,
  shift_session TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  time_spent_minutes INTEGER NOT NULL,
  main_category_code TEXT NOT NULL,
  sub_category_group TEXT,
  sub_category_code TEXT,
  beneficiary_type_code TEXT NOT NULL,
  people_assisted INTEGER NOT NULL DEFAULT 1,
  saps_section TEXT,
  capacity_built TEXT NOT NULL,
  substitution_risk TEXT NOT NULL,
  outcome_status TEXT NOT NULL,
  followup_required INTEGER NOT NULL DEFAULT 0,
  followup_due_date TEXT,
  evidence_type TEXT,
  evidence_note TEXT,
  confidentiality_risk TEXT NOT NULL DEFAULT 'Low',
  notes TEXT,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);
CREATE TABLE IF NOT EXISTS dva_details (
  id TEXT PRIMARY KEY,
  activity_id TEXT NOT NULL UNIQUE,
  dva_reference TEXT NOT NULL UNIQUE,
  repeat_incident TEXT,
  complainant_vulnerable TEXT,
  assistance_type_code TEXT,
  application_assisted TEXT,
  affidavit_assisted TEXT,
  court_delivery_required TEXT,
  court_delivery_completed TEXT,
  protection_order_returned TEXT,
  order_filed_at_station TEXT,
  warrant_filed TEXT,
  service_required TEXT,
  service_completed TEXT,
  breach_reported TEXT,
  arrest_warrant_execution_issue TEXT,
  referred_to_ngo TEXT,
  referral_destination TEXT,
  followup_due_date TEXT,
  outcome_note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);
CREATE TABLE IF NOT EXISTS docket_quality_details (
  id TEXT PRIMARY KEY,
  activity_id TEXT NOT NULL UNIQUE,
  case_type TEXT,
  priority_case TEXT,
  saps_member_assisted TEXT,
  saps_section TEXT,
  issue_identified_code TEXT,
  checklist_used TEXT,
  explained_legal_elements TEXT,
  assisted_charge_formulation TEXT,
  identified_missing_information TEXT,
  identified_followup_evidence TEXT,
  prosecutor_feedback_involved TEXT,
  outcome TEXT,
  training_need_created TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);
CREATE TABLE IF NOT EXISTS advice_referral_details (
  id TEXT PRIMARY KEY,
  activity_id TEXT NOT NULL UNIQUE,
  public_assisted TEXT,
  matter_type_code TEXT,
  matter_classification TEXT,
  incorrect_docket_prevented TEXT,
  advice_given TEXT,
  referral_destination TEXT,
  referral_completed TEXT,
  public_feedback_received TEXT,
  outcome TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);
CREATE TABLE IF NOT EXISTS court_liaison_details (
  id TEXT PRIMARY KEY,
  activity_id TEXT NOT NULL UNIQUE,
  liaison_type TEXT,
  institution TEXT,
  direction TEXT,
  outcome TEXT,
  followup_required TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);
CREATE TABLE IF NOT EXISTS research_support_details (
  id TEXT PRIMARY KEY,
  activity_id TEXT NOT NULL UNIQUE,
  research_type TEXT,
  requested_by TEXT,
  purpose TEXT,
  output_delivered TEXT,
  outcome TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);
CREATE TABLE IF NOT EXISTS weekly_reflections (
  id TEXT PRIMARY KEY,
  week_starting_date TEXT NOT NULL,
  week_ending_date TEXT NOT NULL,
  station_id TEXT NOT NULL,
  officer_id TEXT NOT NULL,
  achievements TEXT,
  capacity_building TEXT,
  public_service_outcomes TEXT,
  dva_outcomes TEXT,
  docket_quality_issues TEXT,
  recurring_training_needs TEXT,
  recurring_station_constraints TEXT,
  court_coordination_issues TEXT,
  substitution_risks TEXT,
  urgent_management_issues TEXT,
  recommendations_gitoc TEXT,
  recommendations_saps TEXT,
  positive_feedback TEXT,
  sensitive_issues TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT,
  UNIQUE(week_starting_date, station_id, officer_id)
);
CREATE TABLE IF NOT EXISTS followups (
  id TEXT PRIMARY KEY,
  activity_id TEXT NOT NULL,
  due_date TEXT,
  description TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT,
  status TEXT NOT NULL DEFAULT 'Open',
  responsible_officer_id TEXT,
  completion_note TEXT
);
CREATE TABLE IF NOT EXISTS exports_log (
  id TEXT PRIMARY KEY,
  export_type TEXT NOT NULL,
  file_path TEXT,
  filters_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS import_logs (
  id TEXT PRIMARY KEY,
  source_path TEXT NOT NULL,
  source_schema_version TEXT,
  preview_json TEXT,
  result_json TEXT,
  pre_import_backup_path TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS _sqlx_migrations (
  version BIGINT PRIMARY KEY,
  description TEXT NOT NULL,
  installed_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  success BOOLEAN NOT NULL,
  checksum BLOB NOT NULL,
  execution_time BIGINT NOT NULL
);
INSERT OR REPLACE INTO _sqlx_migrations (version, description, success, checksum, execution_time)
VALUES (1, 'mobile converted schema', 1, X'', 0), (2, 'mobile followups settings', 1, X'', 0), (3, 'mobile import logs', 1, X'', 0);
`;
}
