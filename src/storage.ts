import { defaultCodebook, defaultOfficers, defaultStations } from "./constants";
import type { ActivityEntry, AppSettings, CodebookItem, DvaDetails, Followup, LookupRecord, MobileBundle, WeeklyReflection } from "./types";

const DB_NAME = "legal-support-mobile";
const DB_VERSION = 1;
const STORES = ["stations", "officers", "codebook_categories", "activity_entries", "dva_details", "followups", "weekly_reflections", "app_settings"] as const;

type StoreName = typeof STORES[number];

let dbPromise: Promise<IDBDatabase> | null = null;

export function uuid(prefix = "") {
  const value = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}${value}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function todayIso() {
  return nowIso().slice(0, 10);
}

export async function initStore() {
  const database = await db();
  await seed(database);
}

export async function getSettings(): Promise<AppSettings> {
  const rows = await all<{ key: string; value: string }>("app_settings");
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

export async function setSetting(key: keyof AppSettings, value: string) {
  await put("app_settings", { key, value, updated_at: nowIso() });
}

export async function loadLookups() {
  await initStore();
  const [stations, officers, codebook, settings] = await Promise.all([
    all<LookupRecord>("stations"),
    all<LookupRecord>("officers"),
    all<CodebookItem>("codebook_categories"),
    getSettings()
  ]);
  return {
    stations: stations.filter((row) => !row.deleted_at).sort(byName),
    officers: officers.filter((row) => !row.deleted_at).sort(byName),
    codebook: codebook.filter((row) => !row.deleted_at).sort((a, b) => a.group_key.localeCompare(b.group_key) || a.sort_order - b.sort_order),
    settings
  };
}

export async function createLookup(store: "stations" | "officers", name: string) {
  const timestamp = nowIso();
  const record: LookupRecord = { id: `${store.slice(0, -1)}-${slug(name)}-${Date.now()}`, name, active: 1, created_at: timestamp, updated_at: timestamp, deleted_at: null };
  await put(store, record);
  return record;
}

export async function listActivities() {
  const lookups = await loadLookups();
  const activities = (await all<ActivityEntry>("activity_entries")).filter((row) => !row.deleted_at);
  const dvas = await all<DvaDetails>("dva_details");
  return activities
    .sort((a, b) => b.activity_date.localeCompare(a.activity_date) || b.created_at.localeCompare(a.created_at))
    .map((entry) => ({
      ...entry,
      station_name: lookups.stations.find((station) => station.id === entry.station_id)?.name || "Unknown station",
      officer_name: lookups.officers.find((officer) => officer.id === entry.officer_id)?.name || "Unknown officer",
      main_category_label: lookups.codebook.find((item) => item.group_key === "main_activity" && item.code === entry.main_category_code)?.label || "Unspecified",
      dva_reference: dvas.find((dva) => dva.activity_id === entry.id && !dva.deleted_at)?.dva_reference || null
    }));
}

export async function saveActivity(entry: Partial<ActivityEntry>, dva?: Partial<DvaDetails>) {
  const timestamp = nowIso();
  const id = entry.id || uuid("act-");
  const activity: ActivityEntry = {
    id,
    activity_number: entry.activity_number || `LSO-M-${new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    activity_date: entry.activity_date || todayIso(),
    station_id: entry.station_id || "",
    officer_id: entry.officer_id || "",
    shift_session: entry.shift_session || "Full Day",
    start_time: entry.start_time || null,
    end_time: entry.end_time || null,
    time_spent_minutes: Number(entry.time_spent_minutes || 30),
    main_category_code: entry.main_category_code || "1",
    sub_category_group: entry.sub_category_group || null,
    sub_category_code: entry.sub_category_code || null,
    beneficiary_type_code: entry.beneficiary_type_code || "1",
    people_assisted: Number(entry.people_assisted || 1),
    saps_section: entry.saps_section === "None" ? null : entry.saps_section || null,
    capacity_built: entry.capacity_built || "Not applicable",
    substitution_risk: entry.substitution_risk || "No",
    outcome_status: entry.outcome_status || "Completed",
    followup_required: entry.followup_required ? 1 : 0,
    followup_due_date: entry.followup_due_date || null,
    evidence_type: entry.evidence_type || "Officer note",
    evidence_note: entry.evidence_note || null,
    confidentiality_risk: entry.confidentiality_risk || "Low",
    notes: entry.notes || null,
    reviewed_at: entry.reviewed_at || null,
    created_at: entry.created_at || timestamp,
    updated_at: timestamp,
    deleted_at: entry.deleted_at || null
  };
  await put("activity_entries", activity);

  if (activity.followup_required && activity.followup_due_date) {
    await put("followups", {
      id: uuid("fu-"),
      activity_id: id,
      due_date: activity.followup_due_date,
      description: activity.notes || "Follow-up required",
      completed_at: null,
      status: "Open",
      responsible_officer_id: activity.officer_id,
      completion_note: null,
      created_at: timestamp,
      updated_at: timestamp,
      deleted_at: null
    } satisfies Followup);
  }

  if (dva && activity.main_category_code === "4") {
    const detail: DvaDetails = {
      id: dva.id || uuid("dva-"),
      activity_id: id,
      dva_reference: dva.dva_reference || `DVA-M-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      repeat_incident: dva.repeat_incident || "Unknown",
      complainant_vulnerable: dva.complainant_vulnerable || "Not recorded",
      assistance_type_code: dva.assistance_type_code || activity.sub_category_code || "",
      application_assisted: dva.application_assisted || "Not applicable",
      affidavit_assisted: dva.affidavit_assisted || "Not applicable",
      court_delivery_required: dva.court_delivery_required || "No",
      court_delivery_completed: dva.court_delivery_completed || "Not applicable",
      protection_order_returned: dva.protection_order_returned || "Not applicable",
      order_filed_at_station: dva.order_filed_at_station || "Not applicable",
      warrant_filed: dva.warrant_filed || "Not applicable",
      service_required: dva.service_required || "Unknown",
      service_completed: dva.service_completed || "Not applicable",
      breach_reported: dva.breach_reported || "Not applicable",
      arrest_warrant_execution_issue: dva.arrest_warrant_execution_issue || "Not applicable",
      referred_to_ngo: dva.referred_to_ngo || "No",
      referral_destination: dva.referral_destination || "",
      followup_due_date: dva.followup_due_date || activity.followup_due_date || "",
      outcome_note: dva.outcome_note || "",
      created_at: timestamp,
      updated_at: timestamp,
      deleted_at: null
    };
    await put("dva_details", detail);
  }
}

export async function exportBundle(): Promise<MobileBundle> {
  await initStore();
  return {
    app: "legal-support-mobile-pwa",
    format_version: 1,
    exported_at: nowIso(),
    device_id: getDeviceId(),
    tables: {
      stations: await all("stations"),
      officers: await all("officers"),
      codebook_categories: await all("codebook_categories"),
      activity_entries: await all("activity_entries"),
      dva_details: await all("dva_details"),
      followups: await all("followups"),
      weekly_reflections: await all("weekly_reflections")
    }
  };
}

export async function importBundle(bundle: MobileBundle) {
  if (bundle.app !== "legal-support-mobile-pwa" || bundle.format_version !== 1) {
    throw new Error("This is not a compatible Legal Support mobile bundle.");
  }
  await initStore();
  for (const [store, rows] of Object.entries(bundle.tables) as Array<[Exclude<StoreName, "app_settings">, Array<{ id: string }>]>) {
    for (const row of rows) await put(store, row);
  }
}

export async function softDeleteActivity(id: string) {
  const activity = await get<ActivityEntry>("activity_entries", id);
  if (!activity) return;
  await put("activity_entries", { ...activity, deleted_at: nowIso(), updated_at: nowIso() });
}

function db() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        for (const name of STORES) {
          if (!database.objectStoreNames.contains(name)) {
            database.createObjectStore(name, { keyPath: name === "app_settings" ? "key" : "id" });
          }
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
}

async function seed(database: IDBDatabase) {
  if ((await count(database, "stations")) === 0) {
    await Promise.all(defaultStations.map((row) => put("stations", row)));
  }
  if ((await count(database, "officers")) === 0) {
    await Promise.all(defaultOfficers.map((row) => put("officers", row)));
  }
  if ((await count(database, "codebook_categories")) === 0) {
    await Promise.all(defaultCodebook.map((row) => put("codebook_categories", row)));
  }
  const settings = await getSettings();
  if (!settings.current_station_id) await setSetting("current_station_id", defaultStations[0].id);
  if (!settings.current_officer_id) await setSetting("current_officer_id", defaultOfficers[0].id);
}

function all<T>(store: StoreName): Promise<T[]> {
  return tx<T[]>(store, "readonly", (objectStore) => objectStore.getAll());
}

function get<T>(store: StoreName, key: string): Promise<T | undefined> {
  return tx<T | undefined>(store, "readonly", (objectStore) => objectStore.get(key));
}

function put<T>(store: StoreName, value: T): Promise<void> {
  return tx<void>(store, "readwrite", (objectStore) => objectStore.put(value));
}

async function count(database: IDBDatabase, store: StoreName): Promise<number> {
  return new Promise((resolve, reject) => {
    const request = database.transaction(store, "readonly").objectStore(store).count();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function tx<T>(store: StoreName, mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  const database = await db();
  return new Promise((resolve, reject) => {
    const request = run(database.transaction(store, mode).objectStore(store));
    request.onsuccess = () => resolve(request.result as T);
    request.onerror = () => reject(request.error);
  });
}

function getDeviceId() {
  const existing = localStorage.getItem("legal-support-device-id");
  if (existing) return existing;
  const id = uuid("device-");
  localStorage.setItem("legal-support-device-id", id);
  return id;
}

function byName(a: LookupRecord, b: LookupRecord) {
  return a.name.localeCompare(b.name);
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "record";
}
