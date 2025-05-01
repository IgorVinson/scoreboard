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

// Optimized metrics calculations utility

// Memoization cache for expensive calculations
const calculationCache = new Map();

// Calculate metrics summary for a result report based on daily reports
export function calculateMetricsSummary(
  resultReport: any,
  dailyReports: any[]
): any {
  // Generate cache key based on report data
  const cacheKey = `${resultReport.id}_${resultReport.start_date}_${resultReport.end_date}_${dailyReports.length}`;
  
  // Check if calculation is already cached
  if (calculationCache.has(cacheKey)) {
    console.log('Using cached metrics calculation');
    return calculationCache.get(cacheKey);
  }
  
  console.time('metrics-calculation');
  
  // Filter reports to ensure they are within the date range
  const startDate = new Date(resultReport.start_date);
  const endDate = new Date(resultReport.end_date);
  
  // Convert dates only once and store them in a Map for quick lookup
  const reportDates = new Map(
    dailyReports.map(report => {
      const date = new Date(report.date);
      return [report.id, date];
    })
  );
  
  // Filter reports in range using our pre-computed dates
  const reportsInRange = dailyReports.filter(report => {
    const date = reportDates.get(report.id);
    return date && date >= startDate && date <= endDate;
  });
  
  // Skip expensive processing if no reports found
  if (reportsInRange.length === 0) {
    const emptyResult = { ...resultReport, metrics_summary: {} };
    calculationCache.set(cacheKey, emptyResult);
    console.timeEnd('metrics-calculation');
    return emptyResult;
  }
  
  // Collect all metric IDs from reports (only do this once)
  const metricIds = new Set<string>();
  for (const report of reportsInRange) {
    if (report.metrics_data) {
      Object.keys(report.metrics_data).forEach(id => metricIds.add(id));
    }
  }
  
  // Create summary metrics object with totals
  const metricsSummary: Record<string, { plan: number; fact: number }> = {};
  
  // Pre-allocate the metrics summary object to avoid dynamic property creation
  for (const metricId of metricIds) {
    metricsSummary[metricId] = { plan: 0, fact: 0 };
  }
  
  // Single pass aggregation
  for (const report of reportsInRange) {
    if (!report.metrics_data) continue;
    
    for (const [metricId, values] of Object.entries(report.metrics_data)) {
      const summary = metricsSummary[metricId];
      if (summary) {
        // Safely add numerical values, default to 0 if undefined
        const metricValues = values as { plan?: number; fact?: number };
        summary.plan += Number(metricValues.plan) || 0;
        summary.fact += Number(metricValues.fact) || 0;
      }
    }
  }
  
  // Round all values to whole numbers for better display
  for (const metricId in metricsSummary) {
    metricsSummary[metricId].plan = Math.round(metricsSummary[metricId].plan);
    metricsSummary[metricId].fact = Math.round(metricsSummary[metricId].fact);
  }
  
  // Create result
  const result = {
    ...resultReport,
    metrics_summary: metricsSummary
  };
  
  // Cache the result
  calculationCache.set(cacheKey, result);
  
  // Limit cache size to prevent memory issues (keep last 20 calculations)
  if (calculationCache.size > 20) {
    const firstKey = calculationCache.keys().next().value;
    calculationCache.delete(firstKey);
  }
  
  console.timeEnd('metrics-calculation');
  return result;
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