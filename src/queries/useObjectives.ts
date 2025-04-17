import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from './queryKeys';
import type { Objective } from '@/lib/types';

export const useObjectives = () => {
  return useQuery({
    queryKey: queryKeys.objectives.all,
    queryFn: async (): Promise<Objective[]> => {
      const { data, error } = await supabase
        .from('objectives')
        .select('*');
        
      if (error) throw error;
      return data || [];
    },
  });
};

export const useObjective = (id: string) => {
  return useQuery({
    queryKey: queryKeys.objectives.byId(id),
    queryFn: async (): Promise<Objective | null> => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('objectives')
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

export const useObjectivesByUser = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.objectives.byUser(userId),
    queryFn: async (): Promise<Objective[]> => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('objectives')
        .select('*')
        .eq('user_id', userId);
        
      if (error) throw error;
      
      return data || [];
    },
    enabled: !!userId,
  });
};

export const useCreateObjective = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (objectiveData: Omit<Objective, 'id' | 'created_at' | 'updated_at'>): Promise<Objective> => {
      const { data, error } = await supabase
        .from('objectives')
        .insert(objectiveData)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: (newObjective) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.objectives.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.objectives.byUser(newObjective.user_id) });
      queryClient.setQueryData(queryKeys.objectives.byId(newObjective.id), newObjective);
    },
  });
};

export const useUpdateObjective = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Objective>): Promise<Objective> => {
      const { data, error } = await supabase
        .from('objectives')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: (updatedObjective) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.objectives.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.objectives.byUser(updatedObjective.user_id) });
      queryClient.setQueryData(queryKeys.objectives.byId(updatedObjective.id), updatedObjective);
    },
  });
};

export const useDeleteObjective = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string): Promise<{ id: string, user_id: string }> => {
      // First get the objective to know the user_id for cache invalidation
      const { data: objective, error: getError } = await supabase
        .from('objectives')
        .select('user_id')
        .eq('id', id)
        .single();
        
      if (getError) throw getError;
      
      const { error } = await supabase
        .from('objectives')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      return { id, user_id: objective.user_id };
    },
    onSuccess: ({ id, user_id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.objectives.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.objectives.byUser(user_id) });
      queryClient.removeQueries({ queryKey: queryKeys.objectives.byId(id) });
    },
  });
}; 