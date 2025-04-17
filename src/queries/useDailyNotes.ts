import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from './queryKeys';
import type { DailyNote } from '@/lib/types';

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

export const useLatestDailyNote = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.dailyNotes.latest(userId),
    queryFn: async (): Promise<DailyNote | null> => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('daily_notes')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(1)
        .single();
        
      if (error) {
        if (error.code === 'PGRST116') return null; // Record not found
        throw error;
      }
      
      return data;
    },
    enabled: !!userId,
  });
};

export const useCreateDailyNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (noteData: Omit<DailyNote, 'id' | 'created_at' | 'updated_at'>): Promise<DailyNote> => {
      const { data, error } = await supabase
        .from('daily_notes')
        .insert(noteData)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: (newNote) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyNotes.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyNotes.byUser(newNote.user_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyNotes.byDate(newNote.date) });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dailyNotes.byUserAndDate(newNote.user_id, newNote.date) 
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyNotes.latest(newNote.user_id) });
      queryClient.setQueryData(queryKeys.dailyNotes.byId(newNote.id), newNote);
    },
  });
};

export const useUpdateDailyNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<DailyNote>): Promise<DailyNote> => {
      const { data, error } = await supabase
        .from('daily_notes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: (updatedNote) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyNotes.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyNotes.byUser(updatedNote.user_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyNotes.byDate(updatedNote.date) });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dailyNotes.byUserAndDate(updatedNote.user_id, updatedNote.date) 
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyNotes.latest(updatedNote.user_id) });
      queryClient.setQueryData(queryKeys.dailyNotes.byId(updatedNote.id), updatedNote);
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