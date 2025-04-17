import { supabase } from './supabase';
import { Objective, Metric } from '@/components/ObjectivesMetricsTable';

// Simple cache to prevent excessive requests
let objectivesCache: any[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 30000; // 30 seconds cache TTL

// Global request lock to prevent infinite loops
let isGettingObjectives = false;
let isCreatingObjective = false;
let isUpdatingObjective = false;
let isDeletingObjective = false;

export const objectivesService = {
  async createObjective(objective: Omit<Objective, 'id' | 'metrics'>) {
    // Prevent multiple simultaneous create requests
    if (isCreatingObjective) {
      console.warn('Create operation already in progress, skipping duplicate request');
      return null;
    }
    
    try {
      isCreatingObjective = true;
      
      console.log('Creating objective in database:', objective);
      const { data, error } = await supabase
        .from('objectives')
        .insert([
          {
            name: objective.name,
            description: objective.description,
            user_id: (await supabase.auth.getUser()).data.user?.id
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating objective:', error);
        throw error;
      }

      // Invalidate cache after mutation
      objectivesCache = null;
      console.log('New objective created:', data);
      
      return data;
    } finally {
      // Release lock after a short delay to prevent rapid repeated requests
      setTimeout(() => {
        isCreatingObjective = false;
      }, 2000);
    }
  },

  async getObjectives() {
    // Prevent multiple simultaneous fetch requests
    if (isGettingObjectives) {
      console.warn('Get objectives operation already in progress, returning cached data');
      return objectivesCache || [];
    }
    
    // Check if we have a valid cache
    const now = Date.now();
    if (objectivesCache && now - lastFetchTime < CACHE_TTL) {
      console.log('Using cached objectives data');
      return objectivesCache;
    }
    
    try {
      isGettingObjectives = true;
      console.log('Fetching fresh objectives data from database');
      
      const { data, error } = await supabase
        .from('objectives')
        .select(`
          *,
          metrics:objective_metrics(*)
        `)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching objectives:', error);
        throw error;
      }

      // Update cache
      objectivesCache = data || [];
      lastFetchTime = now;
      
      return data || [];
    } finally {
      // Release lock after a short delay
      setTimeout(() => {
        isGettingObjectives = false;
      }, 1000);
    }
  },

  // Support both signature formats to remain backward compatible
  async updateObjective(idOrObjective: string | Objective, updates?: Partial<Objective>) {
    // Prevent multiple simultaneous update requests
    if (isUpdatingObjective) {
      console.warn('Update operation already in progress, skipping duplicate request');
      return null;
    }
    
    try {
      isUpdatingObjective = true;
      
      let id: string;
      let updateData: Partial<Objective>;
      
      if (typeof idOrObjective === 'string') {
        // Old format: updateObjective(id, updates)
        id = idOrObjective;
        updateData = updates || {};
      } else {
        // New format: updateObjective(objective)
        id = idOrObjective.id;
        updateData = {
          name: idOrObjective.name,
          description: idOrObjective.description,
        };
      }
      
      console.log('Updating objective in database:', { id, updateData });
      const { data, error } = await supabase
        .from('objectives')
        .update({
          name: updateData.name,
          description: updateData.description,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating objective:', error);
        throw error;
      }

      // Invalidate cache after mutation
      objectivesCache = null;
      console.log('Objective updated:', data);
      
      return data;
    } finally {
      // Release lock after a short delay
      setTimeout(() => {
        isUpdatingObjective = false;
      }, 2000);
    }
  },

  async deleteObjective(id: string) {
    // Prevent multiple simultaneous delete requests
    if (isDeletingObjective) {
      console.warn('Delete operation already in progress, skipping duplicate request');
      return;
    }
    
    try {
      isDeletingObjective = true;
      
      console.log('Deleting objective from database:', id);
      const { error } = await supabase
        .from('objectives')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting objective:', error);
        throw error;
      }
      
      // Invalidate cache after mutation
      objectivesCache = null;
      console.log('Objective deleted successfully:', id);
    } finally {
      // Release lock after a short delay
      setTimeout(() => {
        isDeletingObjective = false;
      }, 2000);
    }
  }
}; 