import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Edit, Star, Calendar } from 'lucide-react';
import { ResultReportManager } from '@/components/result-report/MetricCalculator';

// Types
interface MetricValue {
  plan: number;
  fact: number;
}

interface MetricsData {
  [metricId: string]: MetricValue;
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

interface ResultReportViewProps {
  report: ResultReport;
  objectives: Objective[];
  onEditReport: (report: ResultReport) => void;
  onReportUpdated?: (updatedReport: ResultReport) => void;
}

export function ResultReportView({
  report,
  objectives,
  onEditReport,
  onReportUpdated,
}: ResultReportViewProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [currentReport, setCurrentReport] = useState<ResultReport>(report);
  
  // Format the date range
  const startDate = parseISO(report.start_date);
  const endDate = parseISO(report.end_date);
  const formattedDateRange = `${format(startDate, 'MMM d')} – ${format(endDate, 'MMM d, yyyy')}`;
  
  // Handle report update from metrics calculation
  const handleReportUpdated = (updatedReport: ResultReport) => {
    setCurrentReport(updatedReport);
    if (onReportUpdated) {
      onReportUpdated(updatedReport);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-2xl flex items-center">
            <span className="mr-2">{report.type === 'weekly' ? 'Weekly' : 'Monthly'} Report</span>
            <Badge className="ml-2">{formattedDateRange}</Badge>
          </CardTitle>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Calendar className="mr-1 h-4 w-4" />
              <span>Created: {format(parseISO(report.created_at), 'MMM d, yyyy')}</span>
            </div>
            {report.reviewed && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Reviewed
              </Badge>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => onEditReport(report)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Summary</h3>
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: report.summary }}
              />
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Next Goals</h3>
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: report.next_goals }}
              />
            </div>
            
            {report.comments && (
              <div>
                <h3 className="text-lg font-medium mb-2">Comments</h3>
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: report.comments }}
                />
              </div>
            )}
            
            {(report.quantity_rating || report.quality_rating) && (
              <div className="mt-4 border-t pt-4">
                <h3 className="text-lg font-medium mb-2">Ratings</h3>
                <div className="flex space-x-6">
                  {report.quantity_rating !== null && (
                    <div className="flex items-center">
                      <span className="text-sm font-medium mr-2">Quantity:</span>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-amber-500 mr-1" />
                        <span>{report.quantity_rating}/5</span>
                      </div>
                    </div>
                  )}
                  
                  {report.quality_rating !== null && (
                    <div className="flex items-center">
                      <span className="text-sm font-medium mr-2">Quality:</span>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-amber-500 mr-1" />
                        <span>{report.quality_rating}/5</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="metrics" className="space-y-4">
            <ResultReportManager 
              resultReport={currentReport} 
              onReportUpdated={handleReportUpdated} 
            />
            
            {Object.keys(currentReport.metrics_summary || {}).length > 0 ? (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Metrics Summary</h3>
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
                        objective.metrics.filter(metric => 
                          currentReport.metrics_summary && 
                          currentReport.metrics_summary[metric.id]
                        ).map(metric => {
                          const metricData = currentReport.metrics_summary[metric.id];
                          const plan = metricData.plan;
                          const actual = metricData.fact;
                          
                          let deviation = '-';
                          let deviationClass = '';
                          
                          if (typeof plan === 'number' && typeof actual === 'number') {
                            if (plan === 0 && actual > 0) {
                              deviation = 'Infinity%';
                              deviationClass = 'text-green-500';
                            } else if (plan !== 0) {
                              const deviationValue = ((actual - plan) / plan) * 100;
                              deviation = `${deviationValue.toFixed(1)}%`;
                              deviationClass = deviationValue >= 0 ? 'text-green-500' : 'text-red-500';
                            }
                          }
                          
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
                              <td className={`border p-2 text-right ${deviationClass}`}>{deviation}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center p-8 border rounded-md bg-muted/20">
                <p className="text-muted-foreground">No metrics data available.</p>
                <p className="text-sm mt-1">Use the "Calculate Metrics" button above to generate metrics from daily reports.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Report Settings</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-md p-3">
                  <h4 className="text-sm font-medium mb-1">Report Type</h4>
                  <p>{report.type === 'weekly' ? 'Weekly Report' : 'Monthly Report'}</p>
                </div>
                <div className="border rounded-md p-3">
                  <h4 className="text-sm font-medium mb-1">Date Range</h4>
                  <p>{formattedDateRange}</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 