import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from './queryKeys';
import type { DailyNote } from '@/lib/types';
import { saveDailyNotes } from '@/lib/supabase-service';

export const useDailyNotes = () => {
  return useQuery({
    queryKey: queryKeys.dailyNotes.all,
    queryFn: async (): Promise<DailyNote[]> => {
      const { data, error } = await supabase
        .from('daily_notes')
        .select('*');
        
      if (error) throw error;
      return data || [];
    },
  });
};

export const useDailyNote = (id: string) => {
  return useQuery({
    queryKey: queryKeys.dailyNotes.byId(id),
    queryFn: async (): Promise<DailyNote | null> => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('daily_notes')
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

export const useDailyNotesByUser = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.dailyNotes.byUser(userId),
    queryFn: async (): Promise<DailyNote[]> => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('daily_notes')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
};

export const useDailyNotesByDate = (date: string) => {
  return useQuery({
    queryKey: queryKeys.dailyNotes.byDate(date),
    queryFn: async (): Promise<DailyNote[]> => {
      if (!date) return [];
      
      const { data, error } = await supabase
        .from('daily_notes')
        .select('*')
        .eq('date', date);
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!date,
  });
};

export const useDailyNoteByUserAndDate = (userId: string, date: string) => {
  return useQuery({
    queryKey: queryKeys.dailyNotes.byUserAndDate(userId, date),
    queryFn: async (): Promise<DailyNote | null> => {
      if (!userId || !date) return null;
      
      const { data, error } = await supabase
        .from('daily_notes')
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

export function useLatestDailyNote(userId: string) {
  return useQuery({
    queryKey: ['latestDailyNote', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('daily_notes')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
        
      if (error) {
        console.error('Error fetching latest daily note:', error);
        return null;
      }
      
      return data;
    },
    // Completely disable caching to always fetch fresh data
    staleTime: 0,
    gcTime: 0, // Previously called cacheTime
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

export const useCreateDailyNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (note: { user_id: string, today_notes: string, tomorrow_notes: string, general_comments: string, date?: string }) => {
      return saveDailyNotes(note.user_id, note);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dailyNotes'] });
      queryClient.invalidateQueries({ queryKey: ['dailyNotesByUser', data.user_id] });
      queryClient.setQueryData(['dailyNote', data.id], data);
    },
  });
};

export const useUpdateDailyNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (note: { id: string } & Partial<Omit<DailyNote, 'id' | 'created_at' | 'updated_at'>>) => {
      
      // Extract the ID for clarity
      const { id, ...noteData } = note;
      
      if (!id) {
        throw new Error('ID is required for updating a daily note');
      }
      
      // Make sure we have the correct structure for saveDailyNotes
      const notesForSaving = {
        id,
        user_id: noteData.user_id as string, 
        today_notes: noteData.today_notes || '',
        tomorrow_notes: noteData.tomorrow_notes || '',
        general_comments: noteData.general_comments || '',
        date: noteData.date
      };
      
      // Important: pass the USER ID as first parameter and note data as second
      const result = await saveDailyNotes(notesForSaving.user_id, notesForSaving);
      
      return result;
    },
    onSuccess: (data, variables) => {
      
      // Completely invalidate all related caches to ensure fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyNotes.all, refetchType: 'all' });
      
      if (variables.user_id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.dailyNotes.byUser(variables.user_id as string),
          refetchType: 'all'
        });
        queryClient.invalidateQueries({ 
          queryKey: ['latestDailyNote', variables.user_id as string],
          refetchType: 'all'
        });
      }
      
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dailyNotes.byId(variables.id),
        refetchType: 'all'
      });
      
      // Force immediate update of the cached data
      queryClient.setQueryData(
        queryKeys.dailyNotes.byId(variables.id),
        data
      );
      
      // Force immediate update of latest note cache if it matches the updated note
      if (variables.user_id) {
        const currentLatestNote = queryClient.getQueryData(['latestDailyNote', variables.user_id as string]);
        if (currentLatestNote && (currentLatestNote as any).id === variables.id) {
          queryClient.setQueryData(
            ['latestDailyNote', variables.user_id as string],
            data
          );
        }
      }
    },
  });
};

export const useDeleteDailyNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string): Promise<{ id: string, user_id: string, date: string }> => {
      // First get the note to know the user_id and date for cache invalidation
      const { data: note, error: getError } = await supabase
        .from('daily_notes')
        .select('user_id, date')
        .eq('id', id)
        .single();
        
      if (getError) throw getError;
      
      const { error } = await supabase
        .from('daily_notes')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      return { id, user_id: note.user_id, date: note.date };
    },
    onSuccess: ({ id, user_id, date }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyNotes.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyNotes.byUser(user_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyNotes.byDate(date) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyNotes.byUserAndDate(user_id, date) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyNotes.latest(user_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyNotes.byId(id) });
    },
  });
}; 