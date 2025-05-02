import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './auth-context';
import * as supabaseService from '@/lib/supabase-service';

// Add cache duration (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Add cache interface
interface CacheItem<T> {
  data: T;
  timestamp: number;
}

interface Cache {
  companies?: CacheItem<any[]>;
  teams?: CacheItem<any[]>;
  users?: CacheItem<any[]>;
  metrics?: CacheItem<any[]>;
  plans?: CacheItem<any[]>;
  dailyReports?: CacheItem<any[]>;
}

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
  
  // Add cache and loading state refs
  const cache = useRef<Cache>({});
  const isLoading = useRef(false);

  // Modified loadData function with caching
  const loadData = async () => {
    if (!user || isLoading.current) return;

    try {
      isLoading.current = true;
      const now = Date.now();

      // Helper function to check if cache is valid
      const isCacheValid = (item?: CacheItem<any>) => {
        return item && (now - item.timestamp) < CACHE_DURATION;
      };

      // Load only uncached data
      const [
        companiesData,
        teamsData,
        usersData,
        metricsData,
        plansData,
        reportsData
      ] = await Promise.all([
        cache.current.companies && isCacheValid(cache.current.companies) 
          ? cache.current.companies.data 
          : supabaseService.getCompanies(),
        cache.current.teams && isCacheValid(cache.current.teams)
          ? cache.current.teams.data
          : supabaseService.getTeams(),
        cache.current.users && isCacheValid(cache.current.users)
          ? cache.current.users.data
          : supabaseService.getUsers(),
        cache.current.metrics && isCacheValid(cache.current.metrics)
          ? cache.current.metrics.data
          : supabaseService.getMetrics(),
        cache.current.plans && isCacheValid(cache.current.plans)
          ? cache.current.plans.data
          : supabaseService.getPlans(),
        cache.current.dailyReports && isCacheValid(cache.current.dailyReports)
          ? cache.current.dailyReports.data
          : supabaseService.getDailyReports()
      ]);

      // Update cache and state
      if (!isCacheValid(cache.current.companies)) {
        cache.current.companies = { data: companiesData, timestamp: now };
        setCompanies(companiesData || []);
      }
      if (!isCacheValid(cache.current.teams)) {
        cache.current.teams = { data: teamsData, timestamp: now };
        setTeams(teamsData || []);
      }
      if (!isCacheValid(cache.current.users)) {
        cache.current.users = { data: usersData, timestamp: now };
        setUsers(usersData || []);
      }
      if (!isCacheValid(cache.current.metrics)) {
        cache.current.metrics = { data: metricsData, timestamp: now };
        setMetrics(metricsData || []);
      }
      if (!isCacheValid(cache.current.plans)) {
        cache.current.plans = { data: plansData, timestamp: now };
        setPlans(plansData || []);
      }
      if (!isCacheValid(cache.current.dailyReports)) {
        cache.current.dailyReports = { data: reportsData, timestamp: now };
        setDailyReports(reportsData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      isLoading.current = false;
    }
  };

  // Modified useEffect with proper cleanup
  useEffect(() => {
    if (user) {
      loadData();
    }
    return () => {
      // Clear cache on unmount
      cache.current = {};
    };
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