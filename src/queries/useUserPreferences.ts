import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from './queryKeys';
import type { UserPreference } from '@/lib/types';

export const useUserPreferencesByUser = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.userPreferences.byUser(userId),
    queryFn: async (): Promise<UserPreference[]> => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId);
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
};

export const useUserPreferenceByKey = (userId: string, key: string) => {
  return useQuery({
    queryKey: queryKeys.userPreferences.byKey(userId, key),
    queryFn: async (): Promise<UserPreference | null> => {
      if (!userId || !key) return null;
      
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .eq('key', key)
        .single();
        
      if (error) {
        if (error.code === 'PGRST116') return null; // Record not found
        throw error;
      }
      
      return data;
    },
    enabled: !!userId && !!key,
  });
};

export const useSetUserPreference = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      key, 
      value 
    }: { 
      userId: string; 
      key: string; 
      value: Record<string, any> 
    }): Promise<UserPreference> => {
      // Check if preference already exists
      const { data: existingPref } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', userId)
        .eq('key', key)
        .single();
      
      if (existingPref) {
        // Update existing
        const { data, error } = await supabase
          .from('user_preferences')
          .update({ value })
          .eq('id', existingPref.id)
          .select()
          .single();
          
        if (error) throw error;
        return data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('user_preferences')
          .insert({
            user_id: userId,
            key,
            value,
          })
          .select()
          .single();
          
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (preference) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.userPreferences.byUser(preference.user_id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.userPreferences.byKey(preference.user_id, preference.key) 
      });
    },
  });
};

export const useDeleteUserPreference = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      key 
    }: { 
      userId: string; 
      key: string; 
    }): Promise<void> => {
      const { error } = await supabase
        .from('user_preferences')
        .delete()
        .eq('user_id', userId)
        .eq('key', key);
        
      if (error) throw error;
    },
    onSuccess: (_, { userId, key }) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.userPreferences.byUser(userId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.userPreferences.byKey(userId, key) 
      });
    },
  });
}; 