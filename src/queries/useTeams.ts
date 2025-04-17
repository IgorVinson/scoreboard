import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from './queryKeys';
import type { Team } from '@/lib/types';

export const useTeams = () => {
  return useQuery({
    queryKey: queryKeys.teams.all,
    queryFn: async (): Promise<Team[]> => {
      const { data, error } = await supabase
        .from('teams')
        .select('*');
        
      if (error) throw error;
      return data || [];
    },
  });
};

export const useTeam = (id: string) => {
  return useQuery({
    queryKey: queryKeys.teams.byId(id),
    queryFn: async (): Promise<Team | null> => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('teams')
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

export const useTeamsByCompany = (companyId: string) => {
  return useQuery({
    queryKey: queryKeys.teams.byCompany(companyId),
    queryFn: async (): Promise<Team[]> => {
      if (!companyId) return [];
      
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('company_id', companyId);
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });
};

export const useCreateTeam = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ name, company_id }: { name: string, company_id: string }): Promise<Team> => {
      const { data, error } = await supabase
        .from('teams')
        .insert({ name, company_id })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: (newTeam) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.byCompany(newTeam.company_id) });
      queryClient.setQueryData(queryKeys.teams.byId(newTeam.id), newTeam);
    },
  });
};

export const useUpdateTeam = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Team>): Promise<Team> => {
      const { data, error } = await supabase
        .from('teams')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: (updatedTeam) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.byCompany(updatedTeam.company_id) });
      queryClient.setQueryData(queryKeys.teams.byId(updatedTeam.id), updatedTeam);
    },
  });
};

export const useDeleteTeam = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string): Promise<{ id: string, company_id: string }> => {
      // First get the team to know the company_id for cache invalidation
      const { data: team, error: getError } = await supabase
        .from('teams')
        .select('company_id')
        .eq('id', id)
        .single();
        
      if (getError) throw getError;
      
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      return { id, company_id: team.company_id };
    },
    onSuccess: ({ id, company_id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.byCompany(company_id) });
      queryClient.removeQueries({ queryKey: queryKeys.teams.byId(id) });
    },
  });
}; 