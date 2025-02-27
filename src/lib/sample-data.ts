import * as localStorageService from './local-storage';

export const generateSampleData = (userId: string) => {
  // Create a company if none exists
  let company = localStorageService.getCompanies()[0];
  if (!company) {
    company = localStorageService.createCompany('Sample Company');
  }
  
  // Create a team if none exists
  let team = localStorageService.getTeamsByCompany(company.id)[0];
  if (!team) {
    team = localStorageService.createTeam('Sample Team', company.id);
  }
  
  // Update user with company and team
  const user = localStorageService.getUserById(userId);
  if (user) {
    localStorageService.updateUser(userId, {
      company_id: company.id,
      team_id: team.id,
      profile_completed: true
    });
  }
  
  // Create sample metrics
  const existingMetrics = localStorageService.getMetricsByCompany(company.id);
  if (existingMetrics.length === 0) {
    const metrics = [
      {
        name: 'Sales Target',
        description: 'Monthly sales target in dollars',
        type: 'NUMERIC' as const,
        measurement_unit: 'NUMBER' as const,
        company_id: company.id
      },
      {
        name: 'Customer Satisfaction',
        description: 'Customer satisfaction score',
        type: 'PERCENTAGE' as const,
        measurement_unit: 'PERCENTAGE' as const,
        company_id: company.id
      },
      {
        name: 'Task Completion',
        description: 'Weekly task completion status',
        type: 'BOOLEAN' as const,
        measurement_unit: 'TEXT' as const,
        company_id: company.id
      }
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
          status: 'ACTIVE'
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
        fact: metric.type === 'PERCENTAGE' ? 92 : 9500
      };
    });
    
    localStorageService.createDailyReport({
      user_id: userId,
      date: yesterday.toISOString().split('T')[0],
      metrics_data: metricsData,
      today_notes: 'Completed all assigned tasks',
      tomorrow_notes: 'Planning to start on the new project',
      general_comments: 'Overall good progress'
    });
  }
}; 