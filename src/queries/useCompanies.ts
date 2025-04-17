import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from './queryKeys';
import type { Company } from '@/lib/types';

export const useCompanies = () => {
  return useQuery({
    queryKey: queryKeys.companies.all,
    queryFn: async (): Promise<Company[]> => {
      const { data, error } = await supabase
        .from('companies')
        .select('*');
        
      if (error) throw error;
      return data || [];
    },
  });
};

export const useCompany = (id: string) => {
  return useQuery({
    queryKey: queryKeys.companies.byId(id),
    queryFn: async (): Promise<Company | null> => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('companies')
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

export const useCreateCompany = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (name: string): Promise<Company> => {
      const { data, error } = await supabase
        .from('companies')
        .insert({ name })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: (newCompany) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
      queryClient.setQueryData(queryKeys.companies.byId(newCompany.id), newCompany);
    },
  });
};

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Company>): Promise<Company> => {
      const { data, error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: (updatedCompany) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
      queryClient.setQueryData(queryKeys.companies.byId(updatedCompany.id), updatedCompany);
    },
  });
};

export const useDeleteCompany = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
      queryClient.removeQueries({ queryKey: queryKeys.companies.byId(id) });
    },
  });
}; 