import { generateUUID } from '@/lib/utils';

// Define types based on our database schema
export interface Company {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  role: string;
  company_id: string | null;
  team_id: string | null;
  profile_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Metric {
  id: string;
  name: string;
  description: string | null;
  type: 'NUMERIC' | 'PERCENTAGE' | 'BOOLEAN';
  measurement_unit: 'NUMBER' | 'PERCENTAGE' | 'TEXT';
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: string;
  metric_id: string;
  user_id: string;
  target_value: number;
  start_date: string;
  end_date: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  last_edited_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyReport {
  id: string;
  user_id: string;
  date: string;
  metrics_data: Record<string, { plan: number; fact: number }>;
  today_notes: string | null;
  tomorrow_notes: string | null;
  general_comments: string | null;
  created_at: string;
  updated_at: string;
}

// Initialize local storage with empty collections
const initializeLocalStorage = () => {
  if (!localStorage.getItem('companies')) {
    localStorage.setItem('companies', JSON.stringify([]));
  }
  if (!localStorage.getItem('teams')) {
    localStorage.setItem('teams', JSON.stringify([]));
  }
  if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify([]));
  }
  if (!localStorage.getItem('metrics')) {
    localStorage.setItem('metrics', JSON.stringify([]));
  }
  if (!localStorage.getItem('plans')) {
    localStorage.setItem('plans', JSON.stringify([]));
  }
  if (!localStorage.getItem('daily_reports')) {
    localStorage.setItem('daily_reports', JSON.stringify([]));
  }
};

// Initialize on import
initializeLocalStorage();

// Generic CRUD operations
const getCollection = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const saveCollection = <T>(key: string, data: T[]): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Companies
export const getCompanies = (): Company[] => getCollection<Company>('companies');
export const getCompanyById = (id: string): Company | undefined => 
  getCompanies().find(company => company.id === id);

export const createCompany = (name: string): Company => {
  const companies = getCompanies();
  const now = new Date().toISOString();
  const newCompany: Company = {
    id: generateUUID(),
    name,
    created_at: now,
    updated_at: now
  };
  
  companies.push(newCompany);
  saveCollection('companies', companies);
  return newCompany;
};

export const updateCompany = (id: string, data: Partial<Company>): Company | null => {
  const companies = getCompanies();
  const index = companies.findIndex(company => company.id === id);
  
  if (index === -1) return null;
  
  companies[index] = {
    ...companies[index],
    ...data,
    updated_at: new Date().toISOString()
  };
  
  saveCollection('companies', companies);
  return companies[index];
};

// Teams
export const getTeams = (): Team[] => getCollection<Team>('teams');
export const getTeamById = (id: string): Team | undefined => 
  getTeams().find(team => team.id === id);
export const getTeamsByCompany = (companyId: string): Team[] => 
  getTeams().filter(team => team.company_id === companyId);

export const createTeam = (name: string, companyId: string): Team => {
  const teams = getTeams();
  const now = new Date().toISOString();
  const newTeam: Team = {
    id: generateUUID(),
    name,
    company_id: companyId,
    created_at: now,
    updated_at: now
  };
  
  teams.push(newTeam);
  saveCollection('teams', teams);
  return newTeam;
};

// Users
export const getUsers = (): User[] => getCollection<User>('users');
export const getUserById = (id: string): User | undefined => 
  getUsers().find(user => user.id === id);
export const getUsersByCompany = (companyId: string): User[] => 
  getUsers().filter(user => user.company_id === companyId);

export const createUser = (userData: Partial<User>): User => {
  const users = getUsers();
  const now = new Date().toISOString();
  const newUser: User = {
    id: generateUUID(),
    email: userData.email || '',
    first_name: userData.first_name || null,
    last_name: userData.last_name || null,
    phone_number: userData.phone_number || null,
    role: userData.role || 'EMPLOYEE',
    company_id: userData.company_id || null,
    team_id: userData.team_id || null,
    profile_completed: userData.profile_completed || false,
    created_at: now,
    updated_at: now
  };
  
  users.push(newUser);
  saveCollection('users', users);
  return newUser;
};

export const updateUser = (id: string, data: Partial<User>): User | null => {
  const users = getUsers();
  const index = users.findIndex(user => user.id === id);
  
  if (index === -1) return null;
  
  users[index] = {
    ...users[index],
    ...data,
    updated_at: new Date().toISOString()
  };
  
  saveCollection('users', users);
  return users[index];
};

// Metrics
export const getMetrics = (): Metric[] => getCollection<Metric>('metrics');
export const getMetricById = (id: string): Metric | undefined => 
  getMetrics().find(metric => metric.id === id);
export const getMetricsByCompany = (companyId: string): Metric[] => 
  getMetrics().filter(metric => metric.company_id === companyId);

export const createMetric = (metricData: Partial<Metric>): Metric => {
  const metrics = getMetrics();
  const now = new Date().toISOString();
  const newMetric: Metric = {
    id: generateUUID(),
    name: metricData.name || '',
    description: metricData.description || null,
    type: metricData.type || 'NUMERIC',
    measurement_unit: metricData.measurement_unit || 'NUMBER',
    company_id: metricData.company_id || '',
    created_at: now,
    updated_at: now
  };
  
  metrics.push(newMetric);
  saveCollection('metrics', metrics);
  return newMetric;
};

// Plans
export const getPlans = (): Plan[] => getCollection<Plan>('plans');
export const getPlanById = (id: string): Plan | undefined => 
  getPlans().find(plan => plan.id === id);
export const getPlansByUser = (userId: string): Plan[] => 
  getPlans().filter(plan => plan.user_id === userId);

export const createPlan = (planData: Partial<Plan>): Plan => {
  const plans = getPlans();
  const now = new Date().toISOString();
  const newPlan: Plan = {
    id: generateUUID(),
    metric_id: planData.metric_id || '',
    user_id: planData.user_id || '',
    target_value: planData.target_value || 0,
    start_date: planData.start_date || now.split('T')[0],
    end_date: planData.end_date || now.split('T')[0],
    status: planData.status || 'DRAFT',
    last_edited_by: planData.last_edited_by || null,
    created_at: now,
    updated_at: now
  };
  
  plans.push(newPlan);
  saveCollection('plans', plans);
  return newPlan;
};

// Daily Reports
export const getDailyReports = (): DailyReport[] => getCollection<DailyReport>('daily_reports');
export const getDailyReportById = (id: string): DailyReport | undefined => 
  getDailyReports().find(report => report.id === id);
export const getDailyReportsByUser = (userId: string): DailyReport[] => 
  getDailyReports().filter(report => report.user_id === userId);

export const createDailyReport = (reportData: Partial<DailyReport>): DailyReport => {
  const reports = getDailyReports();
  const now = new Date().toISOString();
  const newReport: DailyReport = {
    id: generateUUID(),
    user_id: reportData.user_id || '',
    date: reportData.date || now.split('T')[0],
    metrics_data: reportData.metrics_data || {},
    today_notes: reportData.today_notes || null,
    tomorrow_notes: reportData.tomorrow_notes || null,
    general_comments: reportData.general_comments || null,
    created_at: now,
    updated_at: now
  };
  
  reports.push(newReport);
  saveCollection('daily_reports', reports);
  return newReport;
};

// Helper to sync Supabase auth user with local storage
export const syncAuthUserToLocalStorage = (authUser: any): User => {
  const users = getUsers();
  const existingUser = users.find(user => user.id === authUser.id);
  
  if (existingUser) {
    return existingUser;
  }
  
  // Create new user in local storage
  const now = new Date().toISOString();
  const newUser: User = {
    id: authUser.id,
    email: authUser.email,
    first_name: authUser.user_metadata?.first_name || null,
    last_name: authUser.user_metadata?.last_name || null,
    phone_number: null,
    role: 'EMPLOYEE',
    company_id: null,
    team_id: null,
    profile_completed: false,
    created_at: now,
    updated_at: now
  };
  
  users.push(newUser);
  saveCollection('users', users);
  return newUser;
}; 