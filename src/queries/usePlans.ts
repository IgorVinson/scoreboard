import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from './queryKeys';
import type { Plan } from '@/lib/types';

export const usePlans = () => {
  return useQuery({
    queryKey: queryKeys.plans.all,
    queryFn: async (): Promise<Plan[]> => {
      const { data, error } = await supabase
        .from('plans')
        .select('*');
        
      if (error) throw error;
      return data || [];
    },
  });
};

export const usePlan = (id: string) => {
  return useQuery({
    queryKey: queryKeys.plans.byId(id),
    queryFn: async (): Promise<Plan | null> => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('plans')
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

export const usePlansByUser = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.plans.byUser(userId),
    queryFn: async (): Promise<Plan[]> => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('user_id', userId);
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
};

export const usePlansByMetric = (metricId: string) => {
  return useQuery({
    queryKey: queryKeys.plans.byMetric(metricId),
    queryFn: async (): Promise<Plan[]> => {
      if (!metricId) return [];
      
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('metric_id', metricId);
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!metricId,
  });
};

export const useCreatePlan = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (planData: Omit<Plan, 'id' | 'created_at' | 'updated_at'>): Promise<Plan> => {
      const { data, error } = await supabase
        .from('plans')
        .insert(planData)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: (newPlan) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.byUser(newPlan.user_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.byMetric(newPlan.metric_id) });
      queryClient.setQueryData(queryKeys.plans.byId(newPlan.id), newPlan);
    },
  });
};

export const useUpdatePlan = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Plan>): Promise<Plan> => {
      const { data, error } = await supabase
        .from('plans')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: (updatedPlan) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.byUser(updatedPlan.user_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.byMetric(updatedPlan.metric_id) });
      queryClient.setQueryData(queryKeys.plans.byId(updatedPlan.id), updatedPlan);
    },
  });
};

export const useDeletePlan = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string): Promise<{ id: string, user_id: string, metric_id: string }> => {
      // First get the plan to know the user_id and metric_id for cache invalidation
      const { data: plan, error: getError } = await supabase
        .from('plans')
        .select('user_id, metric_id')
        .eq('id', id)
        .single();
        
      if (getError) throw getError;
      
      const { error } = await supabase
        .from('plans')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      return { id, user_id: plan.user_id, metric_id: plan.metric_id };
    },
    onSuccess: ({ id, user_id, metric_id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.byUser(user_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.byMetric(metric_id) });
      queryClient.removeQueries({ queryKey: queryKeys.plans.byId(id) });
    },
  });
}; 