import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from './queryKeys';
import type { ResultReport, DailyReport } from '@/lib/types';

export const useResultReports = () => {
  return useQuery({
    queryKey: queryKeys.resultReports.all,
    queryFn: async (): Promise<ResultReport[]> => {
      const { data, error } = await supabase
        .from('result_reports')
        .select('*');
        
      if (error) throw error;
      return data || [];
    },
  });
};

export const useResultReport = (id: string) => {
  return useQuery({
    queryKey: queryKeys.resultReports.byId(id),
    queryFn: async (): Promise<ResultReport | null> => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('result_reports')
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

export const useResultReportsByUser = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.resultReports.byUser(userId),
    queryFn: async (): Promise<ResultReport[]> => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('result_reports')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
};

export const useCreateResultReport = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (reportData: Omit<ResultReport, 'id' | 'created_at' | 'updated_at'>): Promise<ResultReport> => {
      const { data, error } = await supabase
        .from('result_reports')
        .insert(reportData)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: (newReport) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resultReports.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.resultReports.byUser(newReport.user_id) });
      queryClient.setQueryData(queryKeys.resultReports.byId(newReport.id), newReport);
    },
  });
};

export const useUpdateResultReport = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<ResultReport>): Promise<ResultReport> => {
      const { data, error } = await supabase
        .from('result_reports')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: (updatedReport) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resultReports.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.resultReports.byUser(updatedReport.user_id) });
      queryClient.setQueryData(queryKeys.resultReports.byId(updatedReport.id), updatedReport);
    },
  });
};

export const useDeleteResultReport = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string): Promise<{ id: string, user_id: string }> => {
      // First get the report to know the user_id for cache invalidation
      const { data: report, error: getError } = await supabase
        .from('result_reports')
        .select('user_id')
        .eq('id', id)
        .single();
        
      if (getError) throw getError;
      
      const { error } = await supabase
        .from('result_reports')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      return { id, user_id: report.user_id };
    },
    onSuccess: ({ id, user_id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resultReports.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.resultReports.byUser(user_id) });
      queryClient.removeQueries({ queryKey: queryKeys.resultReports.byId(id) });
    },
  });
};

// Function to aggregate metrics from daily reports
export const useGenerateResultReportMetrics = () => {
  return useMutation({
    mutationFn: async ({ 
      userId, 
      startDate, 
      endDate 
    }: { 
      userId: string, 
      startDate: string, 
      endDate: string 
    }): Promise<Record<string, { plan: number; fact: number }>> => {
      if (!userId || !startDate || !endDate) {
        throw new Error("User ID, start date and end date are required");
      }
      
      // Fetch all daily reports within the date range
      const { data: dailyReports, error } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });
        
      if (error) throw error;
      
      // Aggregate metrics from all daily reports
      const aggregatedMetrics: Record<string, { plan: number; fact: number }> = {};
      
      (dailyReports || []).forEach((report: DailyReport) => {
        const { metrics_data } = report;
        
        // Process each metric in the daily report
        Object.entries(metrics_data).forEach(([metricId, metricData]) => {
          // Initialize if this metric hasn't been seen yet
          if (!aggregatedMetrics[metricId]) {
            aggregatedMetrics[metricId] = { 
              plan: 0, 
              fact: 0 
            };
          }
          
          // Add the plan and fact values
          if (typeof metricData.plan === 'number') {
            aggregatedMetrics[metricId].plan += metricData.plan;
          }
          
          if (typeof metricData.fact === 'number') {
            aggregatedMetrics[metricId].fact += metricData.fact;
          }
        });
      });
      
      return aggregatedMetrics;
    }
  });
}; 