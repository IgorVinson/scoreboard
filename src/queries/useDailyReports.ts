import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from './queryKeys';
import type { DailyReport } from '@/lib/types';

export const useDailyReports = () => {
  return useQuery({
    queryKey: queryKeys.dailyReports.all,
    queryFn: async (): Promise<DailyReport[]> => {
      const { data, error } = await supabase
        .from('daily_reports')
        .select('*');
        
      if (error) throw error;
      return data || [];
    },
  });
};

export const useDailyReport = (id: string) => {
  return useQuery({
    queryKey: queryKeys.dailyReports.byId(id),
    queryFn: async (): Promise<DailyReport | null> => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        if (error.code === 'PGRST116') return null; // Record not found
        throw error;
      }
      
      return data;
    },
    enabled: !!id,
  });
};

export const useDailyReportsByUser = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.dailyReports.byUser(userId),
    queryFn: async (): Promise<DailyReport[]> => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
};

export const useDailyReportsByDate = (date: string) => {
  return useQuery({
    queryKey: queryKeys.dailyReports.byDate(date),
    queryFn: async (): Promise<DailyReport[]> => {
      if (!date) return [];
      
      const { data, error } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('date', date);
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!date,
  });
};

export const useDailyReportByUserAndDate = (userId: string, date: string) => {
  return useQuery({
    queryKey: queryKeys.dailyReports.byUserAndDate(userId, date),
    queryFn: async (): Promise<DailyReport | null> => {
      if (!userId || !date) return null;
      
      const { data, error } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .single();
        
      if (error) {
        if (error.code === 'PGRST116') return null; // Record not found
        throw error;
      }
      
      return data;
    },
    enabled: !!userId && !!date,
  });
};

export const useCreateDailyReport = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (reportData: Omit<DailyReport, 'id' | 'created_at' | 'updated_at'>): Promise<DailyReport> => {
      const { data, error } = await supabase
        .from('daily_reports')
        .insert(reportData)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: (newReport) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyReports.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyReports.byUser(newReport.user_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyReports.byDate(newReport.date) });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dailyReports.byUserAndDate(newReport.user_id, newReport.date) 
      });
      queryClient.setQueryData(queryKeys.dailyReports.byId(newReport.id), newReport);
    },
  });
};

export const useUpdateDailyReport = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<DailyReport>): Promise<DailyReport> => {
      const { data, error } = await supabase
        .from('daily_reports')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: (updatedReport) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyReports.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyReports.byUser(updatedReport.user_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyReports.byDate(updatedReport.date) });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dailyReports.byUserAndDate(updatedReport.user_id, updatedReport.date) 
      });
      queryClient.setQueryData(queryKeys.dailyReports.byId(updatedReport.id), updatedReport);
    },
  });
};

export const useDeleteDailyReport = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string): Promise<{ id: string, user_id: string, date: string }> => {
      // First get the report to know the user_id and date for cache invalidation
      const { data: report, error: getError } = await supabase
        .from('daily_reports')
        .select('user_id, date')
        .eq('id', id)
        .single();
        
      if (getError) throw getError;
      
      const { error } = await supabase
        .from('daily_reports')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      return { id, user_id: report.user_id, date: report.date };
    },
    onSuccess: ({ id, user_id, date }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyReports.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyReports.byUser(user_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyReports.byDate(date) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyReports.byUserAndDate(user_id, date) });
      queryClient.removeQueries({ queryKey: queryKeys.dailyReports.byId(id) });
    },
  });
}; 