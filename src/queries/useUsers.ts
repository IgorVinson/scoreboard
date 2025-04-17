import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from './queryKeys';
import type { User } from '@/lib/types';

export const useUsers = () => {
  return useQuery({
    queryKey: queryKeys.users.all,
    queryFn: async (): Promise<User[]> => {
      const { data, error } = await supabase
        .from('users')
        .select('*');
        
      if (error) throw error;
      return data || [];
    },
  });
};

export const useUser = (id: string) => {
  return useQuery({
    queryKey: queryKeys.users.byId(id),
    queryFn: async (): Promise<User | null> => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('users')
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

export const useUsersByCompany = (companyId: string) => {
  return useQuery({
    queryKey: queryKeys.users.byCompany(companyId),
    queryFn: async (): Promise<User[]> => {
      if (!companyId) return [];
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('company_id', companyId);
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });
};

export const useUsersByTeam = (teamId: string) => {
  return useQuery({
    queryKey: queryKeys.users.byTeam(teamId),
    queryFn: async (): Promise<User[]> => {
      if (!teamId) return [];
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('team_id', teamId);
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!teamId,
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<User>): Promise<User> => {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      
      if (updatedUser.company_id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.users.byCompany(updatedUser.company_id) 
        });
      }
      
      if (updatedUser.team_id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.users.byTeam(updatedUser.team_id) 
        });
      }
      
      queryClient.setQueryData(queryKeys.users.byId(updatedUser.id), updatedUser);
    },
  });
}; 