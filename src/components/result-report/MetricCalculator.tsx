import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  userId: string;
  startDate: string;
  endDate: string;
  objectives: Objective[];
  showMetricsSection?: boolean;
  onSaveReport?: (calculatedData: MetricsData) => void;
}

export function ResultReportManager({ 
  userId,
  startDate,
  endDate,
  objectives,
  showMetricsSection = true,
  onSaveReport
}: ResultReportManagerProps) {
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculatedMetrics, setCalculatedMetrics] = useState<MetricsData>({});
  const [hasCalculatedData, setHasCalculatedData] = useState(false);
  
  // Format date for display
  const formatDateRange = () => {
    if (!startDate || !endDate || !hasCalculatedData) return "";
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
  };
  
  // Fetch daily reports in the date range
  const fetchDailyReports = async () => {
    // Clear previous state
    setError(null);
    setHasCalculatedData(false);
    setCalculatedMetrics({});
    setIsLoading(true);
    
    try {
      // Validate dates
      if (!startDate || !endDate) {
        setError('Please select both start and end dates');
        setIsLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('daily_reports')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .eq('user_id', userId);
      
      if (error) {
        throw error;
      }
      
      setDailyReports(data || []);
      console.log(`Loaded ${data?.length || 0} daily reports for the period`);
      
      // Check if we have reports to process
      if (data && data.length > 0) {
        calculateMetrics(data);
      } else {
        setError('No daily reports found for this date range');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error fetching daily reports:', err);
      setError('Failed to load daily reports');
      setIsLoading(false);
    }
  };
  
  // Calculate metrics
  const calculateMetrics = (reports: DailyReport[]) => {
    try {
      // Create a mock result report structure for the calculation
      const mockResultReport: ResultReport = {
        id: 'temp',
        user_id: userId,
        type: 'weekly',
        start_date: startDate,
        end_date: endDate,
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
  };
  
  // Calculate deviation percentage
  const calculateDeviation = (plan: number, actual: number): { value: string, className: string } => {
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
  };
  
  // Load reports when date range and showMetricsSection changes
  useEffect(() => {
    if (startDate && endDate && showMetricsSection) {
      fetchDailyReports();
    } else {
      // Clear state if dates are not set or metrics section is hidden
      setDailyReports([]);
      setCalculatedMetrics({});
      setHasCalculatedData(false);
      setError(null);
    }
  }, [startDate, endDate, userId, showMetricsSection]);
  
  // Only render the component if showMetricsSection is true
  if (!showMetricsSection) {
    return null;
  }
  
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Metrics Calculator</h3>
        {hasCalculatedData && <p className="text-sm text-muted-foreground">{formatDateRange()}</p>}
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
        <div className="text-center p-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading reports and calculating metrics...</p>
        </div>
      )}
      
      {hasCalculatedData && Object.keys(calculatedMetrics).length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Calculated Metrics</CardTitle>
            <CardDescription>
              Aggregated metrics from {dailyReports.length} daily reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="border p-2 text-left">Metric</th>
                    <th className="border p-2 text-right">Plan</th>
                    <th className="border p-2 text-right">Actual</th>
                    <th className="border p-2 text-right">Deviation</th>
                  </tr>
                </thead>
                <tbody>
                  {objectives.flatMap(objective => 
                    objective.metrics
                      .filter(metric => calculatedMetrics[metric.id])
                      .map(metric => {
                        const metricData = calculatedMetrics[metric.id];
                        const plan = metricData.plan;
                        const actual = metricData.fact;
                        const deviation = calculateDeviation(plan, actual);
                        
                        return (
                          <tr key={metric.id} className="border-b">
                            <td className="border p-2">
                              <div>
                                <div className="font-medium">{metric.name}</div>
                                <div className="text-sm text-muted-foreground">{objective.name}</div>
                              </div>
                            </td>
                            <td className="border p-2 text-right">{plan}</td>
                            <td className="border p-2 text-right">{actual}</td>
                            <td className={`border p-2 text-right ${deviation.className}`}>
                              {deviation.value}
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        !isLoading && !error && (
          <div className="text-center p-8 border rounded-md bg-muted/20">
            <p className="text-muted-foreground">No metrics data calculated yet.</p>
            <p className="text-sm mt-1">Select a valid date range with daily reports to view metrics.</p>
          </div>
        )
      )}
    </div>
  );
} 