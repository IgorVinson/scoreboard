interface MetricValue {
  plan: number;
  fact: number;
}

interface MetricsData {
  [metricId: string]: MetricValue;
}

interface DailyReport {
  id: string;
  user_id: string;
  date: string;
  metrics_data: MetricsData;
  today_notes: string;
  tomorrow_notes: string;
  general_comments: string;
  reviewed: boolean;
  quantity_rating?: number;
  quality_rating?: number;
  created_at: string;
  updated_at: string;
}

interface ResultReport {
  id: string;
  user_id: string;
  type: 'weekly' | 'monthly';
  start_date: string;
  end_date: string;
  summary: string;
  next_goals: string;
  comments: string;
  metrics_summary: MetricsData;
  reviewed: boolean;
  quantity_rating?: number;
  quality_rating?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Calculates metrics summary for a result report based on daily reports within the date range
 * @param resultReport - The result report to update
 * @param dailyReports - All daily reports
 * @returns Updated ResultReport with calculated metrics_summary
 */
export function calculateMetricsSummary(
  resultReport: ResultReport,
  dailyReports: DailyReport[]
): ResultReport {
  // Create a deep copy of the result report to avoid mutating the original
  const updatedReport = { ...resultReport, metrics_summary: {} };
  
  // Filter daily reports within the date range of the result report
  const reportsInRange = dailyReports.filter(report => {
    const reportDate = new Date(report.date);
    const startDate = new Date(resultReport.start_date);
    const endDate = new Date(resultReport.end_date);
    
    // Include reports on or after start date and on or before end date
    return reportDate >= startDate && reportDate <= endDate;
  });
  
  console.log(`Found ${reportsInRange.length} reports within the date range`);
  
  // If no reports in range, return the original report
  if (reportsInRange.length === 0) {
    return resultReport;
  }
  
  // Collect all unique metric IDs from the daily reports
  const metricIds = new Set<string>();
  reportsInRange.forEach(report => {
    Object.keys(report.metrics_data).forEach(metricId => {
      metricIds.add(metricId);
    });
  });
  
  // Calculate aggregated values for each metric
  metricIds.forEach(metricId => {
    let totalPlan = 0;
    let totalFact = 0;
    let reportCount = 0;
    
    reportsInRange.forEach(report => {
      const metricData = report.metrics_data[metricId];
      if (metricData) {
        totalPlan += metricData.plan || 0;
        totalFact += metricData.fact || 0;
        reportCount++;
      }
    });
    
    // Only add metrics that were present in at least one report
    if (reportCount > 0) {
      updatedReport.metrics_summary[metricId] = {
        plan: totalPlan,
        fact: totalFact
      };
    }
  });
  
  console.log('Calculated metrics summary:', updatedReport.metrics_summary);
  
  return updatedReport;
}

/**
 * Updates a result report with calculated metrics in Supabase
 * @param resultReport - The result report to update
 * @param dailyReports - All daily reports
 * @param supabase - Supabase client
 * @returns Promise resolving to the updated report
 */
export async function updateResultReportMetrics(
  resultReport: ResultReport,
  dailyReports: DailyReport[],
  supabase: any // Replace with proper Supabase client type
) {
  // Calculate the metrics summary
  const updatedReport = calculateMetricsSummary(resultReport, dailyReports);
  
  try {
    // Update the result report in Supabase
    const { data, error } = await supabase
      .from('result_reports')
      .update({ metrics_summary: updatedReport.metrics_summary })
      .eq('id', resultReport.id)
      .select();
    
    if (error) {
      throw error;
    }
    
    console.log('Updated result report:', data[0]);
    return data[0];
  } catch (error) {
    console.error('Error updating result report metrics:', error);
    throw error;
  }
} 