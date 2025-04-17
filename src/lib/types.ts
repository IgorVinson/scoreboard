// Database entity types

// Companies
export interface Company {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

// Teams
export interface Team {
  id: string;
  name: string;
  company_id: string;
  created_at: string;
  updated_at: string;
}

// Users
export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  company_id?: string;
  team_id?: string;
  profile_completed?: boolean;
  created_at: string;
  updated_at: string;
}

// Metrics
export interface Metric {
  id: string;
  name: string;
  description?: string;
  type: string;
  measurement_unit: string;
  company_id: string;
  created_at: string;
  updated_at: string;
}

// Metric Owners
export interface MetricOwner {
  metric_id: string;
  user_id: string;
  created_at: string;
}

// Plans
export interface Plan {
  id: string;
  metric_id: string;
  user_id: string;
  target_value: number;
  start_date: string;
  end_date: string;
  status: string;
  last_edited_by?: string;
  created_at: string;
  updated_at: string;
}

// Daily Reports
export interface DailyReport {
  id: string;
  user_id: string;
  date: string;
  metrics_data: Record<string, any>;
  today_notes?: string;
  tomorrow_notes?: string;
  general_comments?: string;
  created_at: string;
  updated_at: string;
}

// Daily Notes
export interface DailyNote {
  id: string;
  user_id: string;
  date: string;
  today_notes?: string;
  tomorrow_notes?: string;
  general_comments?: string;
  created_at: string;
  updated_at: string;
}

// Objectives
export interface Objective {
  id: string;
  name: string;
  description?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// User Preferences
export interface UserPreference {
  id: string;
  user_id: string;
  key: string;
  value: Record<string, any>;
  created_at: string;
  updated_at: string;
} 