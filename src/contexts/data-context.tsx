import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './auth-context';
import * as localStorageService from '@/lib/local-storage';

interface DataContextType {
  // Companies
  companies: localStorageService.Company[];
  getCompanyById: (id: string) => localStorageService.Company | undefined;
  createCompany: (name: string) => localStorageService.Company;
  updateCompany: (id: string, data: Partial<localStorageService.Company>) => localStorageService.Company | null;
  
  // Teams
  teams: localStorageService.Team[];
  getTeamById: (id: string) => localStorageService.Team | undefined;
  getTeamsByCompany: (companyId: string) => localStorageService.Team[];
  createTeam: (name: string, companyId: string) => localStorageService.Team;
  
  // Users
  users: localStorageService.User[];
  getUserById: (id: string) => localStorageService.User | undefined;
  getUsersByCompany: (companyId: string) => localStorageService.User[];
  updateUser: (id: string, data: Partial<localStorageService.User>) => localStorageService.User | null;
  
  // Metrics
  metrics: localStorageService.Metric[];
  getMetricById: (id: string) => localStorageService.Metric | undefined;
  getMetricsByCompany: (companyId: string) => localStorageService.Metric[];
  createMetric: (metricData: Partial<localStorageService.Metric>) => localStorageService.Metric;
  
  // Plans
  plans: localStorageService.Plan[];
  getPlanById: (id: string) => localStorageService.Plan | undefined;
  getPlansByUser: (userId: string) => localStorageService.Plan[];
  createPlan: (planData: Partial<localStorageService.Plan>) => localStorageService.Plan;
  
  // Daily Reports
  dailyReports: localStorageService.DailyReport[];
  getDailyReportById: (id: string) => localStorageService.DailyReport | undefined;
  getDailyReportsByUser: (userId: string) => localStorageService.DailyReport[];
  createDailyReport: (reportData: Partial<localStorageService.DailyReport>) => localStorageService.DailyReport;
  
  // Refresh data
  refreshData: () => void;
}

const DataContext = createContext<DataContextType>({} as DataContextType);

export const useData = () => useContext(DataContext);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<localStorageService.Company[]>([]);
  const [teams, setTeams] = useState<localStorageService.Team[]>([]);
  const [users, setUsers] = useState<localStorageService.User[]>([]);
  const [metrics, setMetrics] = useState<localStorageService.Metric[]>([]);
  const [plans, setPlans] = useState<localStorageService.Plan[]>([]);
  const [dailyReports, setDailyReports] = useState<localStorageService.DailyReport[]>([]);

  // Load data from local storage
  const loadData = () => {
    setCompanies(localStorageService.getCompanies());
    setTeams(localStorageService.getTeams());
    setUsers(localStorageService.getUsers());
    setMetrics(localStorageService.getMetrics());
    setPlans(localStorageService.getPlans());
    setDailyReports(localStorageService.getDailyReports());
  };

  // Load data on mount and when user changes
  useEffect(() => {
    loadData();
  }, [user]);

  // Listen for storage events (in case of multiple tabs)
  useEffect(() => {
    const handleStorageChange = () => {
      loadData();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const value: DataContextType = {
    // Companies
    companies,
    getCompanyById: localStorageService.getCompanyById,
    createCompany: (name) => {
      const company = localStorageService.createCompany(name);
      loadData();
      return company;
    },
    updateCompany: (id, data) => {
      const company = localStorageService.updateCompany(id, data);
      loadData();
      return company;
    },
    
    // Teams
    teams,
    getTeamById: localStorageService.getTeamById,
    getTeamsByCompany: localStorageService.getTeamsByCompany,
    createTeam: (name, companyId) => {
      const team = localStorageService.createTeam(name, companyId);
      loadData();
      return team;
    },
    
    // Users
    users,
    getUserById: localStorageService.getUserById,
    getUsersByCompany: localStorageService.getUsersByCompany,
    updateUser: (id, data) => {
      const user = localStorageService.updateUser(id, data);
      loadData();
      return user;
    },
    
    // Metrics
    metrics,
    getMetricById: localStorageService.getMetricById,
    getMetricsByCompany: localStorageService.getMetricsByCompany,
    createMetric: (metricData) => {
      const metric = localStorageService.createMetric(metricData);
      loadData();
      return metric;
    },
    
    // Plans
    plans,
    getPlanById: localStorageService.getPlanById,
    getPlansByUser: localStorageService.getPlansByUser,
    createPlan: (planData) => {
      const plan = localStorageService.createPlan(planData);
      loadData();
      return plan;
    },
    
    // Daily Reports
    dailyReports,
    getDailyReportById: localStorageService.getDailyReportById,
    getDailyReportsByUser: localStorageService.getDailyReportsByUser,
    createDailyReport: (reportData) => {
      const report = localStorageService.createDailyReport(reportData);
      loadData();
      return report;
    },
    
    // Refresh data
    refreshData: loadData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}; 