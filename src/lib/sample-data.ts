import * as supabaseService from './supabase-service';

export const generateSampleData = async (userId: string) => {
  try {
    // Get user data
    const { data: userData, error: userError } = await supabaseService.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (userError || !userData) {
      console.error('Error getting user data:', userError);
      return;
    }
    
    const isSoloMode = userData.mode === 'SOLO';

    // Check for existing company
    const companies = await supabaseService.getCompanies();
    let company = companies.find(c => c.id === userData.company_id);
    
    // Create a company if none exists or user doesn't have one
    if (!company) {
      company = await supabaseService.createCompany(
        isSoloMode ? 'Personal Workspace' : 'Sample Company'
      );
      
      // Update user with company
      await supabaseService.updateUser(userId, {
        company_id: company.id
      });
    }

    // Check for existing team
    const teams = await supabaseService.getTeams();
    let team = teams.find(t => t.company_id === company.id);
    
    // Create a team if none exists
    if (!team) {
      team = await supabaseService.createTeam(
        isSoloMode ? 'Personal' : 'Sample Team',
        company.id
      );
      
      // Update user with team
      await supabaseService.updateUser(userId, {
        team_id: team.id,
        profile_completed: true
      });
    }

    // Check for existing metrics
    const metrics = await supabaseService.getMetrics();
    const companyMetrics = metrics.filter(m => m.company_id === company.id);
    
    // Create sample metrics if none exist
    if (companyMetrics.length === 0) {
      const metricsToCreate = isSoloMode
        ? [
            {
              name: 'Personal Goals',
              description: 'Weekly personal goals completed',
              type: 'NUMERIC',
              measurement_unit: 'NUMBER',
              company_id: company.id,
            },
            {
              name: 'Focus Time',
              description: 'Hours of focused work',
              type: 'NUMERIC',
              measurement_unit: 'NUMBER',
              company_id: company.id,
            },
            {
              name: 'Work-Life Balance',
              description: 'Satisfaction with work-life balance',
              type: 'PERCENTAGE',
              measurement_unit: 'PERCENTAGE',
              company_id: company.id,
            },
          ]
        : [
            {
              name: 'Sales Target',
              description: 'Monthly sales target in dollars',
              type: 'NUMERIC',
              measurement_unit: 'NUMBER',
              company_id: company.id,
            },
            {
              name: 'Customer Satisfaction',
              description: 'Customer satisfaction score',
              type: 'PERCENTAGE',
              measurement_unit: 'PERCENTAGE',
              company_id: company.id,
            },
            {
              name: 'Task Completion',
              description: 'Weekly task completion status',
              type: 'BOOLEAN',
              measurement_unit: 'TEXT',
              company_id: company.id,
            },
          ];

      for (const metricData of metricsToCreate) {
        await supabaseService.createMetric(metricData);
      }
    }

    return true;
  } catch (error) {
    console.error('Error generating sample data:', error);
    return false;
  }
};
