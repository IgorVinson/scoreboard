import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './auth-context';
import * as supabaseService from '@/lib/supabase-service';

interface DataContextType {
  // Companies
  companies: any[];
  getCompanyById: (id: string) => Promise<any>;
  createCompany: (name: string) => Promise<any>;
  
  // Teams
  teams: any[];
  getTeamById: (id: string) => Promise<any>;
  createTeam: (name: string, companyId: string) => Promise<any>;
  
  // Users
  users: any[];
  getUserById: (id: string) => Promise<any>;
  updateUser: (id: string, data: any) => Promise<any>;
  
  // Metrics
  metrics: any[];
  getMetricById: (id: string) => Promise<any>;
  createMetric: (data: any) => Promise<any>;
  
  // Plans
  plans: any[];
  getPlanById: (id: string) => Promise<any>;
  createPlan: (data: any) => Promise<any>;
  getPlansByUser: (userId: string) => any[];
  
  // Daily Reports
  dailyReports: any[];
  getDailyReportById: (id: string) => Promise<any>;
  createDailyReport: (data: any) => Promise<any>;
  getDailyReportsByUser: (userId: string) => any[];
  
  // Daily Notes
  getDailyNotes: () => Promise<any>;
  saveDailyNotes: (notes: { today_notes: string, tomorrow_notes: string, general_comments: string }) => Promise<any>;
  
  // User Preferences
  getUserPreference: (key: string) => Promise<any>;
  setUserPreference: (key: string, value: any) => Promise<any>;
  
  // Refresh data
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [dailyReports, setDailyReports] = useState<any[]>([]);

  // Load data from Supabase
  const loadData = async () => {
    if (!user) return;

    try {
      const [
        companiesData,
        teamsData,
        usersData,
        metricsData,
        plansData,
        reportsData
      ] = await Promise.all([
        supabaseService.getCompanies(),
        supabaseService.getTeams(),
        supabaseService.getUsers(),
        supabaseService.getMetrics(),
        supabaseService.getPlans(),
        supabaseService.getDailyReports()
      ]);

      setCompanies(companiesData || []);
      setTeams(teamsData || []);
      setUsers(usersData || []);
      setMetrics(metricsData || []);
      setPlans(plansData || []);
      setDailyReports(reportsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Load data on mount and when user changes
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const getCompanyById = async (id: string) => {
    return companies.find(c => c.id === id);
  };

  const getTeamById = async (id: string) => {
    return teams.find(t => t.id === id);
  };

  const getUserById = async (id: string) => {
    return users.find(u => u.id === id);
  };

  const getMetricById = async (id: string) => {
    return metrics.find(m => m.id === id);
  };

  const getPlanById = async (id: string) => {
    return plans.find(p => p.id === id);
  };

  const getDailyReportById = async (id: string) => {
    return dailyReports.find(r => r.id === id);
  };
  
  // Filter functions for related data
  const getTeamsByCompany = (companyId: string) => {
    return teams.filter(team => team.company_id === companyId);
  };
  
  const getUsersByCompany = (companyId: string) => {
    return users.filter(user => user.company_id === companyId);
  };
  
  const getMetricsByCompany = (companyId: string) => {
    return metrics.filter(metric => metric.company_id === companyId);
  };
  
  const getPlansByUser = (userId: string) => {
    return plans.filter(plan => plan.user_id === userId);
  };
  
  const getDailyReportsByUser = (userId: string) => {
    return dailyReports.filter(report => report.user_id === userId);
  };

  const value: DataContextType = {
    companies,
    teams,
    users,
    metrics,
    plans,
    dailyReports,
    getCompanyById,
    getTeamById,
    getUserById,
    getMetricById,
    getPlanById,
    getDailyReportById,
    createCompany: async (name) => {
      const company = await supabaseService.createCompany(name);
      await loadData();
      return company;
    },
    createTeam: async (name, companyId) => {
      const team = await supabaseService.createTeam(name, companyId);
      await loadData();
      return team;
    },
    updateUser: async (id, data) => {
      const user = await supabaseService.updateUser(id, data);
      await loadData();
      return user;
    },
    createMetric: async (data) => {
      const metric = await supabaseService.createMetric(data);
      await loadData();
      return metric;
    },
    createPlan: async (data) => {
      const plan = await supabaseService.createPlan(data);
      await loadData();
      return plan;
    },
    createDailyReport: async (data) => {
      const report = await supabaseService.createDailyReport(data);
      await loadData();
      return report;
    },
    // Daily Notes functions
    getDailyNotes: async () => {
      if (!user) return { today_notes: '', tomorrow_notes: '', general_comments: '' };
      return await supabaseService.getDailyNotes(user.id);
    },
    saveDailyNotes: async (notes) => {
      if (!user) return null;
      const result = await supabaseService.saveDailyNotes(user.id, notes);
      return result;
    },
    // User Preferences functions
    getUserPreference: async (key) => {
      if (!user) return null;
      return await supabaseService.getUserPreference(user.id, key);
    },
    setUserPreference: async (key, value) => {
      if (!user) return null;
      return await supabaseService.setUserPreference(user.id, key, value);
    },
    refreshData: loadData,
    getPlansByUser,
    getDailyReportsByUser
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}; 