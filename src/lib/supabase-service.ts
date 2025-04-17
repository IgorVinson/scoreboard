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

export const saveDailyNotes = async (userId: string, notes: { today_notes: string, tomorrow_notes: string, general_comments: string }) => {
  // Check if notes for today exist
  const today = new Date().toISOString().split('T')[0]
  
  const { data: existingNotes } = await supabase
    .from('daily_notes')
    .select('id')
    .eq('user_id', userId)
    .eq('date', today)
    .single()
  
  if (existingNotes) {
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
    
    if (error) throw error
    return data
  } else {
    // Insert new notes
    const { data, error } = await supabase
      .from('daily_notes')
      .insert({
        user_id: userId,
        date: today,
        today_notes: notes.today_notes,
        tomorrow_notes: notes.tomorrow_notes,
        general_comments: notes.general_comments
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }
} 