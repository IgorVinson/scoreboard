import * as supabaseService from './supabase-service';
import * as localStorageService from './local-storage';

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

    // Also generate sample data for local storage - ensures we have fallback data
    await generateLocalStorageSampleData(userId);

    return true;
  } catch (error) {
    console.error('Error generating sample data:', error);
    return false;
  }
};

// Also support local storage for offline/development mode
export const generateLocalStorageSampleData = async (userId: string) => {
  const user = localStorageService.getUserById(userId);
  if (!user) return;

  const isSoloMode = user.mode === 'SOLO';

  // Create a company if none exists
  let company = localStorageService.getCompanies()[0];
  if (!company) {
    company = localStorageService.createCompany(
      isSoloMode ? 'Personal Workspace' : 'Sample Company'
    );
  }

  // Create a team if none exists
  let team = localStorageService.getTeamsByCompany(company.id)[0];
  if (!team) {
    team = localStorageService.createTeam(
      isSoloMode ? 'Personal' : 'Sample Team',
      company.id
    );
  }

  // Update user with company and team
  localStorageService.updateUser(userId, {
    company_id: company.id,
    team_id: team.id,
    profile_completed: true,
  });

  // Create sample metrics
  const existingMetrics = localStorageService.getMetricsByCompany(company.id);
  if (existingMetrics.length === 0) {
    const metrics = isSoloMode
      ? [
          {
            name: 'Personal Goals',
            description: 'Weekly personal goals completed',
            type: 'NUMERIC' as const,
            measurement_unit: 'NUMBER' as const,
            company_id: company.id,
          },
          {
            name: 'Focus Time',
            description: 'Hours of focused work',
            type: 'NUMERIC' as const,
            measurement_unit: 'NUMBER' as const,
            company_id: company.id,
          },
          {
            name: 'Work-Life Balance',
            description: 'Satisfaction with work-life balance',
            type: 'PERCENTAGE' as const,
            measurement_unit: 'PERCENTAGE' as const,
            company_id: company.id,
          },
        ]
      : [
          {
            name: 'Sales Target',
            description: 'Monthly sales target in dollars',
            type: 'NUMERIC' as const,
            measurement_unit: 'NUMBER' as const,
            company_id: company.id,
          },
          {
            name: 'Customer Satisfaction',
            description: 'Customer satisfaction score',
            type: 'PERCENTAGE' as const,
            measurement_unit: 'PERCENTAGE' as const,
            company_id: company.id,
          },
          {
            name: 'Task Completion',
            description: 'Weekly task completion status',
            type: 'BOOLEAN' as const,
            measurement_unit: 'TEXT' as const,
            company_id: company.id,
          },
        ];

    metrics.forEach(metric => localStorageService.createMetric(metric));
  }

  // Create sample plans
  const userPlans = localStorageService.getPlansByUser(userId);
  if (userPlans.length === 0) {
    const metrics = localStorageService.getMetricsByCompany(company.id);

    if (metrics.length > 0) {
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 30);

      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 60);

      metrics.forEach(metric => {
        localStorageService.createPlan({
          metric_id: metric.id,
          user_id: userId,
          target_value: metric.type === 'PERCENTAGE' ? 95 : 10000,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          status: 'ACTIVE',
        });
      });
    }
  }

  // Create sample daily reports
  const userReports = localStorageService.getDailyReportsByUser(userId);
  if (userReports.length === 0) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const metrics = localStorageService.getMetricsByCompany(company.id);
    const metricsData: Record<string, { plan: number; fact: number }> = {};

    metrics.forEach(metric => {
      metricsData[metric.id] = {
        plan: metric.type === 'PERCENTAGE' ? 95 : 10000,
        fact: metric.type === 'PERCENTAGE' ? 92 : 9500,
      };
    });

    localStorageService.createDailyReport({
      user_id: userId,
      date: yesterday.toISOString().split('T')[0],
      metrics_data: metricsData,
      today_notes: 'I worked on the main project tasks and completed most of my goals.',
      tomorrow_notes: 'Tomorrow I plan to finish the remaining tasks and start on the new feature.',
      general_comments: 'Overall productivity was good but I need to improve focus time.',
      reviewed: false,
    });
  }
};
