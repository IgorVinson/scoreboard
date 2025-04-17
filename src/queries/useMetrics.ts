import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from './queryKeys';
import type { Metric, MetricOwner } from '@/lib/types';

export const useMetrics = () => {
  return useQuery({
    queryKey: queryKeys.metrics.all,
    queryFn: async (): Promise<Metric[]> => {
      const { data, error } = await supabase
        .from('metrics')
        .select('*');
        
      if (error) throw error;
      return data || [];
    },
  });
};

export const useMetric = (id: string) => {
  return useQuery({
    queryKey: queryKeys.metrics.byId(id),
    queryFn: async (): Promise<Metric | null> => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('metrics')
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

export const useMetricsByObjective = (objectiveId: string) => {
  return useQuery({
    queryKey: queryKeys.metrics.byObjective(objectiveId),
    queryFn: async (): Promise<Metric[]> => {
      if (!objectiveId) return [];
      
      const { data, error } = await supabase
        .from('metrics')
        .select('*')
        .eq('objective_id', objectiveId);
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!objectiveId,
  });
};

export const useMetricsByOwner = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.metrics.byOwner(userId),
    queryFn: async (): Promise<Metric[]> => {
      if (!userId) return [];
      
      // First get metric IDs from metric_owners
      const { data: metricOwners, error: ownersError } = await supabase
        .from('metric_owners')
        .select('metric_id')
        .eq('user_id', userId);
        
      if (ownersError) throw ownersError;
      
      if (!metricOwners || metricOwners.length === 0) return [];
      
      // Then get the metrics
      const metricIds = metricOwners.map(owner => owner.metric_id);
      
      const { data, error } = await supabase
        .from('metrics')
        .select('*')
        .in('id', metricIds);
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
};

export const useCreateMetric = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (metricData: Omit<Metric, 'id' | 'created_at' | 'updated_at'> & { company_id?: string }): Promise<Metric> => {
      const { data, error } = await supabase
        .from('metrics')
        .insert(metricData)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: (newMetric) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.metrics.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.metrics.byObjective(newMetric.objective_id) });
      queryClient.setQueryData(queryKeys.metrics.byId(newMetric.id), newMetric);
    },
  });
};

export const useUpdateMetric = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Metric>): Promise<Metric> => {
      const { data, error } = await supabase
        .from('metrics')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: (updatedMetric) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.metrics.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.metrics.byObjective(updatedMetric.objective_id) });
      queryClient.setQueryData(queryKeys.metrics.byId(updatedMetric.id), updatedMetric);
    },
  });
};

export const useDeleteMetric = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string): Promise<{ id: string, objective_id: string }> => {
      // First get the metric to know the objective_id for cache invalidation
      const { data: metric, error: getError } = await supabase
        .from('metrics')
        .select('objective_id')
        .eq('id', id)
        .single();
        
      if (getError) throw getError;
      
      const { error } = await supabase
        .from('metrics')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      return { id, objective_id: metric.objective_id };
    },
    onSuccess: ({ id, objective_id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.metrics.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.metrics.byObjective(objective_id) });
      queryClient.removeQueries({ queryKey: queryKeys.metrics.byId(id) });
    },
  });
};

// Metric Owners
export const useAddMetricOwner = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ metric_id, user_id }: { metric_id: string, user_id: string }): Promise<MetricOwner> => {
      const { data, error } = await supabase
        .from('metric_owners')
        .insert({ metric_id, user_id })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: (newOwner) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.metricOwners.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.metricOwners.byMetric(newOwner.metric_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.metricOwners.byUser(newOwner.user_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.metrics.byOwner(newOwner.user_id) });
    },
  });
};

export const useRemoveMetricOwner = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ metric_id, user_id }: { metric_id: string, user_id: string }): Promise<void> => {
      const { error } = await supabase
        .from('metric_owners')
        .delete()
        .eq('metric_id', metric_id)
        .eq('user_id', user_id);
        
      if (error) throw error;
    },
    onSuccess: (_, { metric_id, user_id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.metricOwners.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.metricOwners.byMetric(metric_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.metricOwners.byUser(user_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.metrics.byOwner(user_id) });
    },
  });
}; 