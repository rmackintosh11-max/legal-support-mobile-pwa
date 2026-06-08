export type LookupRecord = {
  id: string;
  name: string;
  active: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
};

export type CodebookItem = {
  id: string;
  group_key: string;
  code: string;
  label: string;
  protected: number;
  sort_order: number;
  active: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
};

export type ActivityEntry = {
  id: string;
  activity_number: string;
  activity_date: string;
  station_id: string;
  officer_id: string;
  shift_session: string;
  start_time?: string | null;
  end_time?: string | null;
  time_spent_minutes: number;
  main_category_code: string;
  sub_category_group?: string | null;
  sub_category_code?: string | null;
  beneficiary_type_code: string;
  people_assisted: number;
  saps_section?: string | null;
  capacity_built: string;
  substitution_risk: string;
  outcome_status: string;
  followup_required: number;
  followup_due_date?: string | null;
  evidence_type?: string | null;
  evidence_note?: string | null;
  confidentiality_risk: string;
  notes?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
};

export type DvaDetails = {
  id: string;
  activity_id: string;
  dva_reference: string;
  repeat_incident: string;
  complainant_vulnerable: string;
  assistance_type_code: string;
  application_assisted: string;
  affidavit_assisted: string;
  court_delivery_required: string;
  court_delivery_completed: string;
  protection_order_returned: string;
  order_filed_at_station: string;
  warrant_filed: string;
  service_required: string;
  service_completed: string;
  breach_reported: string;
  arrest_warrant_execution_issue: string;
  referred_to_ngo: string;
  referral_destination: string;
  followup_due_date: string;
  outcome_note: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
};

export type Followup = {
  id: string;
  activity_id: string;
  due_date: string;
  description: string;
  completed_at?: string | null;
  status: "Open" | "Completed" | "Cancelled";
  responsible_officer_id: string;
  completion_note?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
};

export type WeeklyReflection = {
  id: string;
  week_starting_date: string;
  week_ending_date: string;
  station_id: string;
  officer_id: string;
  achievements?: string;
  capacity_building?: string;
  public_service_outcomes?: string;
  dva_outcomes?: string;
  docket_quality_issues?: string;
  recurring_training_needs?: string;
  recurring_station_constraints?: string;
  court_coordination_issues?: string;
  substitution_risks?: string;
  urgent_management_issues?: string;
  recommendations_gitoc?: string;
  recommendations_saps?: string;
  positive_feedback?: string;
  sensitive_issues?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
};

export type AppSettings = {
  current_officer_id?: string;
  current_station_id?: string;
};

export type MobileBundle = {
  app: "legal-support-mobile-pwa";
  format_version: 1;
  exported_at: string;
  device_id: string;
  tables: {
    stations: LookupRecord[];
    officers: LookupRecord[];
    codebook_categories: CodebookItem[];
    activity_entries: ActivityEntry[];
    dva_details: DvaDetails[];
    followups: Followup[];
    weekly_reflections: WeeklyReflection[];
  };
};
