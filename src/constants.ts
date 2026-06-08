import type { CodebookItem, LookupRecord } from "./types";

export const privacyWarning =
  "Do not enter victim names, witness names, accused names, addresses, full docket contents, affidavits, or sensitive personal information unless expressly authorised.";

export const shifts = ["Morning", "Afternoon", "Evening", "Full Day", "After-hours", "Other"];
export const sapsSections = ["None", "Front desk", "Detectives", "Uniformed policing / patrols", "DVA administration", "Station Commander", "Shift Commander", "Archives", "Other"];
export const capacityFlags = ["Yes", "No", "Partly", "Not applicable"];
export const substitutionRisks = ["No", "Minor", "Significant", "Unclear"];
export const outcomeStatuses = ["Completed", "Partly completed", "Referred", "Follow-up required", "Escalated", "No resolution", "Not applicable"];
export const evidenceTypes = ["None", "Officer note", "SAPS feedback", "Public feedback", "Prosecutor/court feedback", "Document reference", "Suggestion-box message", "Other"];
export const confidentialityRisks = ["Low", "Medium", "High"];
export const yesNo = ["Yes", "No"];
export const yesNoUnknown = ["Yes", "No", "Unknown"];
export const yesNoNa = ["Yes", "No", "Not applicable"];
export const vulnerabilityOptions = ["Elderly", "Disabled", "Child involved", "Repeat victim", "Other", "Unknown", "Not recorded"];
export const referralDestinations = ["Court", "Community Advice Office", "Legal Aid", "Law Clinic", "SASSA", "Department of Home Affairs", "Municipality", "Shelter/NGO", "Wynberg Court", "Other"];

export const defaultStations: LookupRecord[] = [
  lookup("station-grassy-park", "Grassy Park"),
  lookup("station-mitchells-plain", "Mitchells Plain"),
  lookup("station-stellenbosch", "Stellenbosch")
];

export const defaultOfficers: LookupRecord[] = [
  lookup("officer-default-1", "Legal Support Officer 1"),
  lookup("officer-default-2", "Legal Support Officer 2")
];

export const defaultCodebook: CodebookItem[] = [
  code("main-1", "main_activity", "1", "SAPS legal mentoring / coaching", 1),
  code("main-2", "main_activity", "2", "Statement quality support", 2),
  code("main-3", "main_activity", "3", "Docket quality / prosecutability support", 3),
  code("main-4", "main_activity", "4", "DVA protection-order support", 4),
  code("main-5", "main_activity", "5", "Public advice / legal information", 5),
  code("main-6", "main_activity", "6", "Advice / referral of non-criminal matter", 6),
  code("main-7", "main_activity", "7", "Court / prosecutor liaison", 7),
  code("main-8", "main_activity", "8", "Online research / digital support", 8),
  code("main-9", "main_activity", "9", "Station administration support", 9),
  code("main-10", "main_activity", "10", "Training / group session", 10),
  code("main-11", "main_activity", "11", "Community information / notice / outreach", 11),
  code("main-12", "main_activity", "12", "Internal project administration", 12),
  code("main-13", "main_activity", "13", "Follow-up from previous entry", 13),
  code("main-14", "main_activity", "14", "Other", 14),
  code("beneficiary-1", "beneficiary", "1", "SAPS member", 1),
  code("beneficiary-2", "beneficiary", "2", "SAPS supervisor / commander", 2),
  code("beneficiary-3", "beneficiary", "3", "Detective", 3),
  code("beneficiary-4", "beneficiary", "4", "CSC member", 4),
  code("beneficiary-5", "beneficiary", "5", "Member of public", 5),
  code("beneficiary-6", "beneficiary", "6", "DVA complainant", 6),
  code("beneficiary-7", "beneficiary", "7", "Prosecutor / court official", 7),
  code("beneficiary-8", "beneficiary", "8", "GI-TOC / project team", 8),
  code("beneficiary-9", "beneficiary", "9", "Mixed", 9),
  code("beneficiary-10", "beneficiary", "10", "Other", 10),
  code("public-1", "public_advice", "1", "DVA", 1),
  code("public-2", "public_advice", "2", "Housing / eviction", 2),
  code("public-3", "public_advice", "3", "Family law", 3),
  code("public-4", "public_advice", "4", "SASSA / welfare", 4),
  code("public-5", "public_advice", "5", "Wills / deceased estate / inheritance", 5),
  code("public-6", "public_advice", "6", "Small claims", 6),
  code("public-7", "public_advice", "7", "Interdict / harassment", 7),
  code("public-8", "public_advice", "8", "Accident report / affidavit / certification", 8),
  code("public-9", "public_advice", "9", "Labour / employment", 9),
  code("public-10", "public_advice", "10", "Immigration / documentation", 10),
  code("public-11", "public_advice", "11", "Criminal complaint", 11),
  code("public-12", "public_advice", "12", "Civil debt / contract", 12),
  code("public-13", "public_advice", "13", "Other", 13),
  code("docket-1", "docket_quality", "1", "Charge formulation", 1),
  code("docket-2", "docket_quality", "2", "Elements of offence", 2),
  code("docket-3", "docket_quality", "3", "Statement clarity", 3),
  code("docket-4", "docket_quality", "4", "Missing key facts", 4),
  code("docket-5", "docket_quality", "5", "Previous threats / pattern / context", 5),
  code("docket-6", "docket_quality", "6", "Bail-relevant information", 6),
  code("docket-7", "docket_quality", "7", "Chain of evidence", 7),
  code("docket-8", "docket_quality", "8", "Missing witness statement", 8),
  code("docket-9", "docket_quality", "9", "Missing forensic report", 9),
  code("docket-10", "docket_quality", "10", "Subpoena / witness attendance issue", 10),
  code("docket-11", "docket_quality", "11", "Prosecutor query", 11),
  code("docket-12", "docket_quality", "12", "Warning statement", 12),
  code("docket-13", "docket_quality", "13", "Priority crime checklist", 13),
  code("docket-14", "docket_quality", "14", "Other", 14),
  code("dva-1", "dva_support", "1", "Initial advice on DVA remedies", 1),
  code("dva-2", "dva_support", "2", "Protection order application assisted", 2),
  code("dva-3", "dva_support", "3", "Affidavit drafted or improved", 3),
  code("dva-4", "dva_support", "4", "Safety monitoring order issue", 4),
  code("dva-5", "dva_support", "5", "Interim protection order follow-up", 5),
  code("dva-6", "dva_support", "6", "Final protection order follow-up", 6),
  code("dva-7", "dva_support", "7", "Warrant of arrest filing issue", 7),
  code("dva-8", "dva_support", "8", "Service of order issue", 8),
  code("dva-9", "dva_support", "9", "Breach reported", 9),
  code("dva-10", "dva_support", "10", "Repeat victim / repeat incident", 10),
  code("dva-11", "dva_support", "11", "Referral to shelter / NGO / court", 11),
  code("dva-12", "dva_support", "12", "DVA admin / filing support", 12),
  code("dva-13", "dva_support", "13", "Other", 13)
];

function lookup(id: string, name: string): LookupRecord {
  const now = new Date().toISOString();
  return { id, name, active: 1, created_at: now, updated_at: now, deleted_at: null };
}

function code(id: string, group_key: string, codeValue: string, label: string, sort_order: number): CodebookItem {
  const now = new Date().toISOString();
  return { id, group_key, code: codeValue, label, protected: 1, sort_order, active: 1, created_at: now, updated_at: now, deleted_at: null };
}
