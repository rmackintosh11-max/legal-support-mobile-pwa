import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Download, FileUp, Home, ListChecks, Plus, Settings, Trash2 } from "lucide-react";
import "./styles.css";
import {
  capacityFlags,
  confidentialityRisks,
  evidenceTypes,
  outcomeStatuses,
  privacyWarning,
  referralDestinations,
  sapsSections,
  shifts,
  substitutionRisks,
  vulnerabilityOptions,
  yesNo,
  yesNoNa,
  yesNoUnknown
} from "./constants";
import { createLookup, exportBundle, importBundle, initStore, listActivities, loadLookups, renameLookup, saveActivity, setSetting, softDeleteActivity, todayIso } from "./storage";
import type { ActivityEntry, AppSettings, CodebookItem, DvaDetails, LookupRecord, MobileBundle } from "./types";

type Screen = "today" | "new" | "log" | "sync" | "setup";
type LookupState = { stations: LookupRecord[]; officers: LookupRecord[]; codebook: CodebookItem[]; settings: AppSettings };
type ActivityRow = ActivityEntry & { station_name?: string; officer_name?: string; main_category_label?: string; dva_reference?: string | null };

const emptyLookups: LookupState = { stations: [], officers: [], codebook: [], settings: {} };

function App() {
  const [screen, setScreen] = useState<Screen>("today");
  const [lookups, setLookups] = useState<LookupState>(emptyLookups);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [message, setMessage] = useState("");

  async function refresh() {
    await initStore();
    const [nextLookups, nextActivities] = await Promise.all([loadLookups(), listActivities()]);
    setLookups(nextLookups);
    setActivities(nextActivities);
  }

  useEffect(() => {
    refresh();
    if ("serviceWorker" in navigator) navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => undefined);
  }, []);

  const todayRows = activities.filter((entry) => entry.activity_date === todayIso());
  const codes = (group: string) => lookups.codebook.filter((item) => item.group_key === group && item.active);

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <strong>Legal Support</strong>
          <span>Offline mobile capture</span>
        </div>
        <StatusPill />
      </header>
      <main>
        {message && <button className="notice" onClick={() => setMessage("")}>{message}</button>}
        {screen === "today" && <Today rows={todayRows} allRows={activities} goNew={() => setScreen("new")} />}
        {screen === "new" && <EntryForm lookups={lookups} codes={codes} onSaved={async () => { setMessage("Entry saved on this phone."); await refresh(); setScreen("today"); }} />}
        {screen === "log" && <ActivityLog rows={activities} onDelete={async (id) => { await softDeleteActivity(id); await refresh(); }} />}
        {screen === "sync" && <SyncScreen onImported={async () => { setMessage("Mobile bundle imported."); await refresh(); }} />}
        {screen === "setup" && <Setup lookups={lookups} onSaved={refresh} />}
      </main>
      <nav className="tabs" aria-label="Primary">
        <Tab active={screen === "today"} icon={<Home size={19} />} label="Today" onClick={() => setScreen("today")} />
        <Tab active={screen === "new"} icon={<Plus size={21} />} label="New" onClick={() => setScreen("new")} />
        <Tab active={screen === "log"} icon={<ListChecks size={19} />} label="Log" onClick={() => setScreen("log")} />
        <Tab active={screen === "sync"} icon={<Download size={19} />} label="Sync" onClick={() => setScreen("sync")} />
        <Tab active={screen === "setup"} icon={<Settings size={19} />} label="Setup" onClick={() => setScreen("setup")} />
      </nav>
    </div>
  );
}

function Today({ rows, allRows, goNew }: { rows: ActivityRow[]; allRows: ActivityRow[]; goNew: () => void }) {
  const followups = allRows.filter((entry) => entry.followup_required && entry.followup_due_date && entry.followup_due_date <= todayIso());
  return (
    <section>
      <Header title="Today" subtitle={`${rows.length} entries captured today`} />
      <div className="metrics">
        <Metric label="Today" value={rows.length} />
        <Metric label="This phone" value={allRows.length} />
        <Metric label="Due follow-ups" value={followups.length} />
      </div>
      <button className="primary wide" onClick={goNew}><Plus size={18} /> New daily entry</button>
      <CardList rows={rows} empty="No entries captured today." />
    </section>
  );
}

function EntryForm({ lookups, codes, onSaved }: { lookups: LookupState; codes: (group: string) => CodebookItem[]; onSaved: () => void }) {
  const [entry, setEntry] = useState<Partial<ActivityEntry>>(() => ({
    activity_date: todayIso(),
    station_id: lookups.settings.current_station_id || lookups.stations[0]?.id || "",
    officer_id: lookups.settings.current_officer_id || lookups.officers[0]?.id || "",
    shift_session: "Full Day",
    time_spent_minutes: 30,
    main_category_code: "1",
    beneficiary_type_code: "1",
    people_assisted: 1,
    saps_section: "Front desk",
    capacity_built: "Not applicable",
    substitution_risk: "No",
    outcome_status: "Completed",
    followup_required: 0,
    evidence_type: "Officer note",
    confidentiality_risk: "Low"
  }));
  const [dva, setDva] = useState<Partial<DvaDetails>>({
    repeat_incident: "Unknown",
    complainant_vulnerable: "Not recorded",
    application_assisted: "Not applicable",
    affidavit_assisted: "Not applicable",
    court_delivery_required: "No",
    service_required: "Unknown",
    referred_to_ngo: "No"
  });

  const isDva = entry.main_category_code === "4";
  const subGroup = isDva ? "dva_support" : ["2", "3"].includes(entry.main_category_code || "") ? "docket_quality" : ["5", "6"].includes(entry.main_category_code || "") ? "public_advice" : "";

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    await saveActivity({ ...entry, sub_category_group: subGroup || null }, isDva ? dva : undefined);
    onSaved();
  }

  return (
    <section>
      <Header title="New entry" subtitle="Saved locally on this phone" />
      <p className="privacy">{privacyWarning}</p>
      <form className="form" onSubmit={submit}>
        <Field label="Date"><input type="date" value={entry.activity_date || ""} onChange={(e) => setEntry({ ...entry, activity_date: e.target.value })} required /></Field>
        <Field label="Station"><Select value={entry.station_id || ""} options={lookups.stations.map((row) => [row.id, row.name])} onChange={(value) => setEntry({ ...entry, station_id: value })} /></Field>
        <Field label="Officer"><Select value={entry.officer_id || ""} options={lookups.officers.map((row) => [row.id, row.name])} onChange={(value) => setEntry({ ...entry, officer_id: value })} /></Field>
        <Field label="Shift"><Select value={entry.shift_session || ""} options={shifts.map(asOption)} onChange={(value) => setEntry({ ...entry, shift_session: value })} /></Field>
        <Field label="Activity"><Select value={entry.main_category_code || ""} options={codes("main_activity").map((row) => [row.code, row.label])} onChange={(value) => setEntry({ ...entry, main_category_code: value, sub_category_code: "" })} /></Field>
        {subGroup && <Field label="Activity detail"><Select value={entry.sub_category_code || ""} options={codes(subGroup).map((row) => [row.code, row.label])} onChange={(value) => setEntry({ ...entry, sub_category_code: value })} blank="Choose detail" /></Field>}
        <Field label="Beneficiary"><Select value={entry.beneficiary_type_code || ""} options={codes("beneficiary").map((row) => [row.code, row.label])} onChange={(value) => setEntry({ ...entry, beneficiary_type_code: value })} /></Field>
        <Field label="People assisted"><input type="number" min="1" value={entry.people_assisted || 1} onChange={(e) => setEntry({ ...entry, people_assisted: Number(e.target.value) })} /></Field>
        <Field label="Minutes"><input type="number" min="0" value={entry.time_spent_minutes || 0} onChange={(e) => setEntry({ ...entry, time_spent_minutes: Number(e.target.value) })} /></Field>
        <Field label="SAPS section"><Select value={entry.saps_section || "None"} options={sapsSections.map(asOption)} onChange={(value) => setEntry({ ...entry, saps_section: value })} /></Field>
        <Field label="Capacity built"><Select value={entry.capacity_built || ""} options={capacityFlags.map(asOption)} onChange={(value) => setEntry({ ...entry, capacity_built: value })} /></Field>
        <Field label="Substitution risk"><Select value={entry.substitution_risk || ""} options={substitutionRisks.map(asOption)} onChange={(value) => setEntry({ ...entry, substitution_risk: value })} /></Field>
        <Field label="Outcome"><Select value={entry.outcome_status || ""} options={outcomeStatuses.map(asOption)} onChange={(value) => setEntry({ ...entry, outcome_status: value })} /></Field>
        <Field label="Follow-up required"><Select value={entry.followup_required ? "Yes" : "No"} options={yesNo.map(asOption)} onChange={(value) => setEntry({ ...entry, followup_required: value === "Yes" ? 1 : 0 })} /></Field>
        {Boolean(entry.followup_required) && <Field label="Follow-up due"><input type="date" value={entry.followup_due_date || ""} onChange={(e) => setEntry({ ...entry, followup_due_date: e.target.value })} /></Field>}
        <Field label="Evidence"><Select value={entry.evidence_type || ""} options={evidenceTypes.map(asOption)} onChange={(value) => setEntry({ ...entry, evidence_type: value })} /></Field>
        <Field label="Confidentiality risk"><Select value={entry.confidentiality_risk || ""} options={confidentialityRisks.map(asOption)} onChange={(value) => setEntry({ ...entry, confidentiality_risk: value })} /></Field>
        {isDva && <DvaFields dva={dva} setDva={setDva} />}
        <Field label="Notes"><textarea value={entry.notes || ""} onChange={(e) => setEntry({ ...entry, notes: e.target.value })} /></Field>
        <button className="primary wide" type="submit">Save entry</button>
      </form>
    </section>
  );
}

function DvaFields({ dva, setDva }: { dva: Partial<DvaDetails>; setDva: (value: Partial<DvaDetails>) => void }) {
  return (
    <div className="subform">
      <h2>DVA details</h2>
      <Field label="Repeat incident"><Select value={dva.repeat_incident || "Unknown"} options={yesNoUnknown.map(asOption)} onChange={(value) => setDva({ ...dva, repeat_incident: value })} /></Field>
      <Field label="Complainant vulnerable"><Select value={dva.complainant_vulnerable || "Not recorded"} options={vulnerabilityOptions.map(asOption)} onChange={(value) => setDva({ ...dva, complainant_vulnerable: value })} /></Field>
      <Field label="Application assisted"><Select value={dva.application_assisted || "Not applicable"} options={yesNoNa.map(asOption)} onChange={(value) => setDva({ ...dva, application_assisted: value })} /></Field>
      <Field label="Affidavit assisted"><Select value={dva.affidavit_assisted || "Not applicable"} options={yesNoNa.map(asOption)} onChange={(value) => setDva({ ...dva, affidavit_assisted: value })} /></Field>
      <Field label="Court delivery required"><Select value={dva.court_delivery_required || "No"} options={yesNoUnknown.map(asOption)} onChange={(value) => setDva({ ...dva, court_delivery_required: value })} /></Field>
      <Field label="Service required"><Select value={dva.service_required || "Unknown"} options={yesNoUnknown.map(asOption)} onChange={(value) => setDva({ ...dva, service_required: value })} /></Field>
      <Field label="Referred to NGO"><Select value={dva.referred_to_ngo || "No"} options={yesNo.map(asOption)} onChange={(value) => setDva({ ...dva, referred_to_ngo: value })} /></Field>
      {dva.referred_to_ngo === "Yes" && <Field label="Referral destination"><Select value={dva.referral_destination || ""} options={referralDestinations.map(asOption)} onChange={(value) => setDva({ ...dva, referral_destination: value })} blank="Choose destination" /></Field>}
      <Field label="DVA outcome note"><textarea value={dva.outcome_note || ""} onChange={(e) => setDva({ ...dva, outcome_note: e.target.value })} /></Field>
    </div>
  );
}

function ActivityLog({ rows, onDelete }: { rows: ActivityRow[]; onDelete: (id: string) => void }) {
  return (
    <section>
      <Header title="Activity log" subtitle={`${rows.length} local entries`} />
      <CardList rows={rows} empty="No entries saved on this phone." onDelete={onDelete} />
    </section>
  );
}

function SyncScreen({ onImported }: { onImported: () => void }) {
  const [summary, setSummary] = useState("");

  async function downloadBundle() {
    const bundle = await exportBundle();
    const stamp = new Date().toISOString().slice(0, 10);
    download(`legal-support-mobile-bundle-${stamp}.json`, JSON.stringify(bundle, null, 2), "application/json");
    setSummary(`Exported ${bundle.tables.activity_entries.length} entries. Send this JSON file to the coordinator for direct import in the desktop app.`);
  }

  async function downloadCsv() {
    const bundle = await exportBundle();
    download(`legal-support-mobile-entries-${todayIso()}.csv`, toCsv(bundle.tables.activity_entries), "text/csv");
    setSummary("CSV exported for review. Use the JSON bundle for desktop syncing.");
  }

  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const bundle = JSON.parse(await file.text()) as MobileBundle;
    await importBundle(bundle);
    onImported();
  }

  return (
    <section>
      <Header title="Sync" subtitle="Export when data is available; use offline thereafter" />
      <div className="sync-actions">
        <button className="primary wide" onClick={downloadBundle}><Download size={18} /> Export mobile bundle</button>
        <button className="wide" onClick={downloadCsv}><Download size={18} /> Export CSV review copy</button>
        <label className="file-button">
          <FileUp size={18} />
          Import mobile bundle
          <input type="file" accept="application/json,.json" onChange={upload} />
        </label>
      </div>
      {summary && <p className="helper">{summary}</p>}
      <div className="panel">
        <h2>Desktop handoff</h2>
        <p>Send the JSON bundle to the coordinator. In the desktop app, use Exports / Backups / Imports, then Preview import from mobile JSON.</p>
      </div>
    </section>
  );
}

function Setup({ lookups, onSaved }: { lookups: LookupState; onSaved: () => void }) {
  const [stationName, setStationName] = useState("");
  const [officerName, setOfficerName] = useState("");
  const [renameOfficerId, setRenameOfficerId] = useState(lookups.officers[0]?.id || "");
  const [renameOfficerName, setRenameOfficerName] = useState("");
  const selectedOfficer = lookups.officers.find((officer) => officer.id === renameOfficerId);

  async function saveDefault(key: "current_station_id" | "current_officer_id", value: string) {
    await setSetting(key, value);
    onSaved();
  }

  async function addLookup(kind: "stations" | "officers", name: string, clear: () => void) {
    if (!name.trim()) return;
    await createLookup(kind, name.trim());
    clear();
    onSaved();
  }

  async function saveOfficerName() {
    if (!renameOfficerId || !renameOfficerName.trim()) return;
    await renameLookup("officers", renameOfficerId, renameOfficerName.trim());
    setRenameOfficerName("");
    onSaved();
  }

  return (
    <section>
      <Header title="Setup" subtitle="Configure this phone before first use" />
      <div className="panel">
        <Field label="Default station"><Select value={lookups.settings.current_station_id || ""} options={lookups.stations.map((row) => [row.id, row.name])} onChange={(value) => saveDefault("current_station_id", value)} /></Field>
        <div className="inline-add">
          <input placeholder="Add station" value={stationName} onChange={(e) => setStationName(e.target.value)} />
          <button onClick={() => addLookup("stations", stationName, () => setStationName(""))}>Add</button>
        </div>
      </div>
      <div className="panel">
        <Field label="Default officer"><Select value={lookups.settings.current_officer_id || ""} options={lookups.officers.map((row) => [row.id, row.name])} onChange={(value) => saveDefault("current_officer_id", value)} /></Field>
        <div className="rename-box">
          <Field label="Rename officer"><Select value={renameOfficerId || ""} options={lookups.officers.map((row) => [row.id, row.name])} onChange={(value) => { setRenameOfficerId(value); setRenameOfficerName(""); }} /></Field>
          <div className="inline-add">
            <input placeholder={selectedOfficer ? `Rename ${selectedOfficer.name}` : "New officer name"} value={renameOfficerName} onChange={(e) => setRenameOfficerName(e.target.value)} />
            <button onClick={saveOfficerName}>Rename</button>
          </div>
        </div>
        <div className="inline-add">
          <input placeholder="Add officer" value={officerName} onChange={(e) => setOfficerName(e.target.value)} />
          <button onClick={() => addLookup("officers", officerName, () => setOfficerName(""))}>Add</button>
        </div>
      </div>
    </section>
  );
}

function CardList({ rows, empty, onDelete }: { rows: ActivityRow[]; empty: string; onDelete?: (id: string) => void }) {
  if (!rows.length) return <p className="empty">{empty}</p>;
  return (
    <div className="cards">
      {rows.map((entry) => (
        <article className="entry-card" key={entry.id}>
          <div>
            <strong>{entry.main_category_label}</strong>
            <span>{entry.activity_date} · {entry.station_name}</span>
          </div>
          <p>{entry.notes || entry.outcome_status}</p>
          <div className="card-meta">
            <span>{entry.officer_name}</span>
            <span>{entry.time_spent_minutes} min</span>
            {entry.dva_reference && <span>{entry.dva_reference}</span>}
          </div>
          {onDelete && <button className="icon-danger" onClick={() => onDelete(entry.id)} aria-label="Delete entry"><Trash2 size={17} /></button>}
        </article>
      ))}
    </div>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="header">
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

function Select({ value, options, onChange, blank }: { value: string; options: string[][]; onChange: (value: string) => void; blank?: string }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} required={!blank}>
      {blank && <option value="">{blank}</option>}
      {options.map(([optionValue, label]) => <option key={optionValue} value={optionValue}>{label}</option>)}
    </select>
  );
}

function Tab({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return <button className={active ? "active" : ""} onClick={onClick}>{icon}<span>{label}</span></button>;
}

function StatusPill() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return <span className={online ? "status online" : "status"}>{online ? "Online" : "Offline"}</span>;
}

function asOption(value: string) {
  return [value, value];
}

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function toCsv(rows: ActivityEntry[]) {
  const columns: Array<keyof ActivityEntry> = ["activity_number", "activity_date", "station_id", "officer_id", "main_category_code", "sub_category_code", "beneficiary_type_code", "people_assisted", "time_spent_minutes", "outcome_status", "followup_required", "followup_due_date", "confidentiality_risk", "notes"];
  const quote = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return [columns.join(","), ...rows.map((row) => columns.map((column) => quote(row[column])).join(","))].join("\n");
}

createRoot(document.getElementById("root")!).render(<App />);
