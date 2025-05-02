import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { 
  calculateMetricsSummary 
} from '@/utils/metrics';

// Type definitions
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

interface Objective {
  id: string;
  name: string;
  metrics: Array<{
    id: string;
    name: string;
  }>;
}

interface ResultReportManagerProps {
  userId?: string;
  startDate?: string;
  endDate?: string;
  objectives?: Objective[];
  showMetricsSection?: boolean;
  onSaveReport?: (calculatedData: MetricsData) => void;
  resultReport?: ResultReport;
  onReportUpdated?: (updatedReport: ResultReport) => void;
}

// Cache for report data to avoid unnecessary refetching
const reportsCache = new Map<string, DailyReport[]>();

export function ResultReportManager({ 
  userId,
  startDate,
  endDate,
  objectives = [],
  showMetricsSection = true,
  onSaveReport,
  resultReport,
  onReportUpdated
}: ResultReportManagerProps) {
  // If resultReport is provided, use its values
  const reportUserId = resultReport?.user_id || userId || '';
  const reportStartDate = resultReport?.start_date || startDate || '';
  const reportEndDate = resultReport?.end_date || endDate || '';

  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculatedMetrics, setCalculatedMetrics] = useState<MetricsData>(
    resultReport?.metrics_summary || {}
  );
  const [hasCalculatedData, setHasCalculatedData] = useState(
    !!resultReport?.metrics_summary && Object.keys(resultReport.metrics_summary).length > 0
  );
  
  // Create a cache key based on userId and date range
  const cacheKey = useMemo(() => 
    `${reportUserId}_${reportStartDate}_${reportEndDate}`, 
    [reportUserId, reportStartDate, reportEndDate]
  );
  
  // Format date for display - memoized to avoid recalculation
  const formatDateRange = useMemo(() => {
    if (!reportStartDate || !reportEndDate || !hasCalculatedData) return "";
    try {
      const start = parseISO(reportStartDate);
      const end = parseISO(reportEndDate);
      return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
    } catch (e) {
      console.error('Error formatting date range:', e);
      return "";
    }
  }, [reportStartDate, reportEndDate, hasCalculatedData]);
  
  // Preload data when dates change but before the section is shown
  useEffect(() => {
    // Even if metrics section is not shown yet, start loading data in background
    // when dates are valid
    if (reportStartDate && reportEndDate && reportUserId) {
      // Check if we already have this data in cache
      if (!reportsCache.has(cacheKey)) {
        // Only trigger a background fetch if not already loading
        fetchDailyReports(false);
      }
    }
  }, [reportStartDate, reportEndDate, reportUserId, cacheKey]);
  
  // Fetch daily reports in the date range
  const fetchDailyReports = useCallback(async (showLoadingState = true) => {
    // Skip if already loading or no valid dates
    if (!reportStartDate || !reportEndDate) {
      return;
    }
    
    // Check cache first
    if (reportsCache.has(cacheKey)) {
      const cachedReports = reportsCache.get(cacheKey);
      console.log('Using cached reports data:', cachedReports?.length || 0, 'reports');
      setDailyReports(cachedReports || []);
      
      if (cachedReports && cachedReports.length > 0) {
        // Recalculate metrics with cached data
        calculateMetrics(cachedReports);
      } else {
        setError('No daily reports found for this date range');
      }
      return;
    }
    
    // Clear previous state
    setError(null);
    setHasCalculatedData(false);
    
    // Only show loading indicator if this is a user-initiated action
    if (showLoadingState) {
      setIsLoading(true);
      setCalculatedMetrics({});
    }
    
    try {
      // Validate dates
      if (!reportStartDate || !reportEndDate) {
        setError('Please select both start and end dates');
        if (showLoadingState) setIsLoading(false);
        return;
      }
      
      console.log(`Fetching reports for ${reportStartDate} to ${reportEndDate}`);
      
      const { data, error } = await supabase
        .from('daily_reports')
        .select('*')
        .gte('date', reportStartDate)
        .lte('date', reportEndDate)
        .eq('user_id', reportUserId);
      
      if (error) {
        throw error;
      }
      
      // Store in cache for future use
      const reportData = data || [];
      reportsCache.set(cacheKey, reportData);
      
      setDailyReports(reportData);
      console.log(`Loaded ${reportData.length} daily reports for the period`);
      
      // Check if we have reports to process
      if (reportData.length > 0) {
        calculateMetrics(reportData);
      } else {
        setError('No daily reports found for this date range');
        if (showLoadingState) setIsLoading(false);
      }
    } catch (err) {
      console.error('Error fetching daily reports:', err);
      setError('Failed to load daily reports');
      if (showLoadingState) setIsLoading(false);
    }
  }, [reportStartDate, reportEndDate, reportUserId, cacheKey]);
  
  // Calculate metrics - memoized to prevent unnecessary recalculations
  const calculateMetrics = useCallback((reports: DailyReport[]) => {
    try {
      // Skip calculation if no reports
      if (!reports || reports.length === 0) {
        setError('No reports available for calculation');
        setIsLoading(false);
        return;
      }
      
      // Create a mock result report structure for the calculation
      const mockResultReport: ResultReport = {
        id: 'temp',
        user_id: reportUserId,
        type: 'weekly',
        start_date: reportStartDate,
        end_date: reportEndDate,
        summary: '',
        next_goals: '',
        comments: '',
        metrics_summary: {},
        reviewed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Calculate metrics summary
      const result = calculateMetricsSummary(mockResultReport, reports);
      const calculatedMetricsData = result.metrics_summary;
      
      // Check if we actually have metrics data
      if (Object.keys(calculatedMetricsData).length === 0) {
        setError('No metrics data found in the reports for this period');
        setIsLoading(false);
        return;
      }
      
      setCalculatedMetrics(calculatedMetricsData);
      setHasCalculatedData(true);
      
      // Automatically save the metrics data if a callback is provided
      if (onSaveReport) {
        onSaveReport(calculatedMetricsData);
      }
      
      console.log('Calculated metrics:', calculatedMetricsData);
    } catch (err) {
      console.error('Error calculating metrics:', err);
      setError('Failed to calculate metrics');
    } finally {
      setIsLoading(false);
    }
  }, [reportUserId, reportStartDate, reportEndDate, onSaveReport]);
  
  // Calculate deviation percentage - memoized
  const calculateDeviation = useCallback((plan: number, actual: number): { value: string, className: string } => {
    if (typeof plan !== 'number' || typeof actual !== 'number') {
      return { value: '-', className: '' };
    }
    
    if (plan === 0) {
      if (actual > 0) {
        return { value: 'Infinity%', className: 'text-green-500' };
      }
      return { value: '0%', className: '' };
    }
    
    const deviation = ((actual - plan) / plan) * 100;
    const formattedValue = `${deviation.toFixed(1)}%`;
    const className = deviation >= 0 ? 'text-green-500' : 'text-red-500';
    
    return { value: formattedValue, className };
  }, []);
  
  // Load reports when metrics section is shown (user requested)
  useEffect(() => {
    if (reportStartDate && reportEndDate && showMetricsSection) {
      fetchDailyReports(true);
    }
  }, [reportStartDate, reportEndDate, reportUserId, showMetricsSection, fetchDailyReports]);
  
  // Only render the component if showMetricsSection is true
  if (!showMetricsSection) {
    return null;
  }
  
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Metrics Calculator</h3>
        {hasCalculatedData && <p className="text-sm text-muted-foreground">{formatDateRange}</p>}
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {hasCalculatedData && (
        <div className="text-sm text-muted-foreground mb-4">
          <p>Found {dailyReports.length} daily reports in this period.</p>
        </div>
      )}
      
      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading metrics data...</span>
        </div>
      )}
      
      {/* Metrics data table */}
      {hasCalculatedData && !isLoading && (
        <div className="border rounded-md overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2 text-left font-medium">Metric</th>
                <th className="px-4 py-2 text-right font-medium">Plan</th>
                <th className="px-4 py-2 text-right font-medium">Actual</th>
                <th className="px-4 py-2 text-right font-medium">Deviation</th>
              </tr>
            </thead>
            <tbody>
              {objectives.map(objective => {
                // Extract metrics from this objective that have data
                const objectiveMetrics = objective.metrics.filter(
                  metric => calculatedMetrics[metric.id]
                );
                
                if (objectiveMetrics.length === 0) return null;
                
                return (
                  <React.Fragment key={objective.id}>
                    <tr className="bg-muted/50">
                      <td colSpan={4} className="px-4 py-2 font-medium">
                        {objective.name}
                      </td>
                    </tr>
                    {objectiveMetrics.map(metric => {
                      const metricData = calculatedMetrics[metric.id];
                      if (!metricData) return null;
                      
                      const deviation = calculateDeviation(
                        metricData.plan,
                        metricData.fact
                      );
                      
                      return (
                        <tr key={metric.id} className="border-t">
                          <td className="px-4 py-2 pl-8">{metric.name}</td>
                          <td className="px-4 py-2 text-right">{metricData.plan}</td>
                          <td className="px-4 py-2 text-right">{metricData.fact}</td>
                          <td className={`px-4 py-2 text-right ${deviation.className}`}>
                            {deviation.value}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 