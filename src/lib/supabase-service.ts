import { supabase } from './supabase'

export { supabase }

// Companies
export const getCompanies = async () => {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
  if (error) throw error
  return data
}

export const createCompany = async (name: string) => {
  const { data, error } = await supabase
    .from('companies')
    .insert({ name })
    .select()
    .single()
  if (error) throw error
  return data
}

// Teams
export const getTeams = async () => {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
  if (error) throw error
  return data
}

export const createTeam = async (name: string, company_id: string) => {
  const { data, error } = await supabase
    .from('teams')
    .insert({ name, company_id })
    .select()
    .single()
  if (error) throw error
  return data
}

// Users
export const getUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
  if (error) throw error
  return data
}

export const updateUser = async (id: string, userData: any) => {
  const { data, error } = await supabase
    .from('users')
    .update(userData)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// Metrics
export const getMetrics = async () => {
  const { data, error } = await supabase
    .from('metrics')
    .select('*')
  if (error) throw error
  return data
}

export const createMetric = async (metricData: any) => {
  const { data, error } = await supabase
    .from('metrics')
    .insert(metricData)
    .select()
    .single()
  if (error) throw error
  return data
}

// Plans
export const getPlans = async () => {
  const { data, error } = await supabase
    .from('plans')
    .select('*')
  if (error) throw error
  return data
}

export const createPlan = async (planData: any) => {
  const { data, error } = await supabase
    .from('plans')
    .insert(planData)
    .select()
    .single()
  if (error) throw error
  return data
}

// Daily Reports
export const getDailyReports = async () => {
  const { data, error } = await supabase
    .from('daily_reports')
    .select('*')
  if (error) throw error
  return data
}

export const createDailyReport = async (reportData: any) => {
  const { data, error } = await supabase
    .from('daily_reports')
    .insert(reportData)
    .select()
    .single()
  if (error) throw error
  return data
}

// User Preferences
export const getUserPreference = async (userId: string, key: string) => {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('value')
    .eq('user_id', userId)
    .eq('key', key)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') {
      // Record not found
      return null
    }
    throw error
  }
  
  return data
}

export const setUserPreference = async (userId: string, key: string, value: any) => {
  // Check if the preference already exists
  const { data: existingPref } = await supabase
    .from('user_preferences')
    .select('id')
    .eq('user_id', userId)
    .eq('key', key)
    .single()
  
  if (existingPref) {
    // Update existing preference
    const { data, error } = await supabase
      .from('user_preferences')
      .update({ value, updated_at: new Date().toISOString() })
      .eq('id', existingPref.id)
      .select()
      .single()
    
    if (error) throw error
    return data
  } else {
    // Insert new preference
    const { data, error } = await supabase
      .from('user_preferences')
      .insert({
        user_id: userId,
        key,
        value,
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

// Daily Notes
export const getDailyNotes = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('daily_notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (error) {
      console.log("Error fetching notes:", error.code, error.message);
      // Return default empty values for any error
      return {
        id: null,
        user_id: userId,
        date: new Date().toISOString().split('T')[0],
        today_notes: '',
        tomorrow_notes: '',
        general_comments: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
    
    // If no data or empty array, return default structure
    if (!data || data.length === 0) {
      return {
        id: null,
        user_id: userId,
        date: new Date().toISOString().split('T')[0],
        today_notes: '',
        tomorrow_notes: '',
        general_comments: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
    
    // Return the first item if we got data
    return data[0]
  } catch (e) {
    console.error("Exception in getDailyNotes:", e);
    // Return default values for any exception
    return {
      id: null,
      user_id: userId,
      date: new Date().toISOString().split('T')[0],
      today_notes: '',
      tomorrow_notes: '',
      general_comments: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }
}

export const saveDailyNotes = async (userId: string, notes: { id?: string, today_notes: string, tomorrow_notes: string, general_comments: string, date?: string }) => {
  // Use provided date or default to today
  const date = notes.date || new Date().toISOString().split('T')[0];
  
  console.log('Saving notes for date:', date);
  
  // If we have an ID, update the existing note
  if (notes.id) {
    console.log('Updating existing notes with ID:', notes.id);
    console.log('LOGGING TODAY NOTES BEFORE UPDATE:', notes.today_notes);
    const { data, error } = await supabase
      .from('daily_notes')
      .update({
        today_notes: notes.today_notes,
        tomorrow_notes: notes.tomorrow_notes,
        general_comments: notes.general_comments,
        updated_at: new Date().toISOString()
      })
      .eq('id', notes.id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating notes:', error);
      throw error;
    }
    return data;
  }
  
  // If no ID, check if there's an existing note for this date
  const { data: existingNotes } = await supabase
    .from('daily_notes')
    .select('id')
    .eq('user_id', userId)
    .eq('date', date)
    .single()
  
  if (existingNotes) {
    console.log('Updating existing notes for date:', date);
    // Update existing notes
    const { data, error } = await supabase
      .from('daily_notes')
      .update({
        today_notes: notes.today_notes,
        tomorrow_notes: notes.tomorrow_notes,
        general_comments: notes.general_comments,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingNotes.id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating notes:', error);
      throw error;
    }
    return data;
  } else {
    console.log('Creating new notes for date:', date);
    // Insert new notes
    const { data, error } = await supabase
      .from('daily_notes')
      .insert({
        user_id: userId,
        date: date,
        today_notes: notes.today_notes,
        tomorrow_notes: notes.tomorrow_notes,
        general_comments: notes.general_comments
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating notes:', error);
      throw error;
    }
    return data;
  }
}

// Objectives
export const getObjectives = async (userId: string) => {
  const { data, error } = await supabase
    .from('objectives')
    .select(`
      *,
      metrics:objective_metrics(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const createObjective = async (userId: string, objective: { name: string, description?: string }) => {
  const { data, error } = await supabase
    .from('objectives')
    .insert({
      user_id: userId,
      name: objective.name,
      description: objective.description
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateObjective = async (objectiveId: string, updates: { name?: string, description?: string }) => {
  const { data, error } = await supabase
    .from('objectives')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', objectiveId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteObjective = async (objectiveId: string) => {
  const { error } = await supabase
    .from('objectives')
    .delete()
    .eq('id', objectiveId);

  if (error) throw error;
};

// Objective Metrics
// Cache for objective metrics operations
const metricOperationInProgress: Record<string, boolean> = {};

export const createObjectiveMetric = async (objectiveId: string, metric: { name: string, description?: string, plan?: number, plan_period?: string }) => {
  // Prevent duplicate requests
  const operationKey = `create_${objectiveId}_${metric.name}`;
  if (metricOperationInProgress[operationKey]) {
    console.log('Skipping duplicate metric creation operation');
    return null;
  }
  
  try {
    metricOperationInProgress[operationKey] = true;
    
    console.log('Creating new metric in database');
    const { data, error } = await supabase
      .from('objective_metrics')
      .insert({
        objective_id: objectiveId,
        name: metric.name,
        description: metric.description,
        plan: metric.plan,
        plan_period: metric.plan_period
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } finally {
    // Clear operation flag after completion
    setTimeout(() => {
      delete metricOperationInProgress[operationKey];
    }, 1000);
  }
};

export const updateObjectiveMetric = async (metricId: string, updates: { name?: string, description?: string, plan?: number, plan_period?: string }) => {
  // Prevent duplicate requests
  const operationKey = `update_${metricId}`;
  if (metricOperationInProgress[operationKey]) {
    console.log('Skipping duplicate metric update operation');
    return null;
  }
  
  try {
    metricOperationInProgress[operationKey] = true;
    
    console.log('Updating metric in database');
    const { data, error } = await supabase
      .from('objective_metrics')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', metricId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } finally {
    // Clear operation flag after completion
    setTimeout(() => {
      delete metricOperationInProgress[operationKey];
    }, 1000);
  }
};

export const deleteObjectiveMetric = async (metricId: string) => {
  // Prevent duplicate requests
  const operationKey = `delete_${metricId}`;
  if (metricOperationInProgress[operationKey]) {
    console.log('Skipping duplicate metric deletion operation');
    return;
  }
  
  try {
    metricOperationInProgress[operationKey] = true;
    
    console.log('Deleting metric from database');
    const { error } = await supabase
      .from('objective_metrics')
      .delete()
      .eq('id', metricId);

    if (error) throw error;
  } finally {
    // Clear operation flag after completion
    setTimeout(() => {
      delete metricOperationInProgress[operationKey];
    }, 1000);
  }
}; 