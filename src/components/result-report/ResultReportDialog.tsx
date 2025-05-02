import React, { useState, useEffect } from 'react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/auth-context';
import type { ResultReport } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Calendar,
  FileText,
  RefreshCw,
  Save,
  BarChart3,
  PieChart,
  Target,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  useGenerateResultReportMetrics, 
  useCreateResultReport,
  useUpdateResultReport
} from '@/queries';

interface ResultReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objectives: any[];
  editingReport: any;
  onReportCreated?: () => void;
}

export function ResultReportDialog({
  open,
  onOpenChange,
  objectives,
  editingReport,
  onReportCreated,
}: ResultReportDialogProps) {
  const { user } = useAuth();
  const generateResultReportMetricsMutation = useGenerateResultReportMetrics();
  const createResultReportMutation = useCreateResultReport();
  const updateResultReportMutation = useUpdateResultReport();

  const [reportType, setReportType] = useState<'weekly' | 'monthly'>('weekly');
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [summary, setSummary] = useState('');
  const [nextGoals, setNextGoals] = useState('');
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<Record<string, { plan: number; fact: number }>>({});
  const [activeTab, setActiveTab] = useState('metrics');

  // Set default date range based on report type
  useEffect(() => {
    if (reportType === 'weekly') {
      // Get the start and end of the current week
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Start on Monday
      const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 }); // End on Sunday
      setStartDate(format(weekStart, 'yyyy-MM-dd'));
      setEndDate(format(weekEnd, 'yyyy-MM-dd'));
    } else if (reportType === 'monthly') {
      // Get the start and end of the current month
      const monthStart = startOfMonth(new Date());
      const monthEnd = endOfMonth(new Date());
      setStartDate(format(monthStart, 'yyyy-MM-dd'));
      setEndDate(format(monthEnd, 'yyyy-MM-dd'));
    }
  }, [reportType]);

  // If editing an existing report, load its data
  useEffect(() => {
    if (editingReport) {
      setReportType(editingReport.type || 'weekly');
      setStartDate(editingReport.start_date || '');
      setEndDate(editingReport.end_date || '');
      setSummary(editingReport.summary || '');
      setNextGoals(editingReport.next_goals || '');
      setComments(editingReport.comments || '');
      setMetrics(editingReport.metrics_summary || {});
    } else {
      // Reset form for new report
      setReportType('weekly');
      setSummary('');
      setNextGoals('');
      setComments('');
      setMetrics({});
    }
  }, [editingReport, open]);

  const handleReportTypeChange = (value: string) => {
    setReportType(value as 'weekly' | 'monthly');
  };

  const handleGenerateReport = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    
    try {
      // Generate metrics summary from daily reports in the selected date range
      const metricsData = await generateResultReportMetricsMutation.mutateAsync({
        userId: user.id,
        startDate,
        endDate,
      });
      
      setMetrics(metricsData);
    } catch (error) {
      console.error('Error generating report metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReport = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    
    try {
      if (editingReport) {
        // Update existing report
        const reportData = {
          id: editingReport.id,
          type: reportType,
          start_date: startDate,
          end_date: endDate,
          summary,
          next_goals: nextGoals,
          comments,
          metrics_summary: metrics,
        };
        
        await updateResultReportMutation.mutateAsync(reportData);
      } else {
        // Create new report
      const reportData: Omit<ResultReport, 'id'> = {
        user_id: user.id,
        type: reportType,
        start_date: startDate,
        end_date: endDate,
        summary,
        next_goals: nextGoals,
        comments,
        metrics_summary: metrics,
        reviewed: false,
      };
      
      await createResultReportMutation.mutateAsync(reportData);
      }
      
      // Close the dialog and notify parent
      onOpenChange(false);
      if (onReportCreated) {
        onReportCreated();
      }
    } catch (error) {
      console.error('Error saving report:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to calculate the totals and averages
  const calculateSummaryStats = () => {
    const totals = {
      totalMetrics: 0,
      totalPlan: 0,
      totalActual: 0,
      overPerforming: 0,
      underPerforming: 0,
      onTarget: 0,
      averageDeviation: 0,
      totalDeviation: 0,
      deviations: [],
    };
    
    Object.entries(metrics).forEach(([metricId, values]) => {
      totals.totalMetrics++;
      totals.totalPlan += values.plan || 0;
      totals.totalActual += values.fact || 0;
      
      // Calculate deviation
      let deviation = 0;
      if (values.plan > 0) {
        deviation = ((values.fact - values.plan) / values.plan) * 100;
        totals.deviations.push(deviation);
        totals.totalDeviation += deviation;
        
        if (deviation > 5) {
          totals.overPerforming++;
        } else if (deviation < -5) {
          totals.underPerforming++;
        } else {
          totals.onTarget++;
        }
      } else if (values.fact > 0 && values.plan === 0) {
        totals.overPerforming++;
      }
    });
    
    // Calculate average deviation
    if (totals.deviations.length > 0) {
      totals.averageDeviation = totals.totalDeviation / totals.deviations.length;
    }
    
    return totals;
  };

  // Function to calculate the total for each metric by objective
  const calculateMetricsByObjective = () => {
    const metricsByObjective = {};
    
    Object.entries(metrics).forEach(([metricId, values]) => {
      // Find the metric's objective
      let objectiveId = null;
      let objectiveName = 'Unknown';
      let metricName = 'Unknown Metric';
      
      objectives.forEach(obj => {
        obj.metrics?.forEach(metric => {
          if (metric.id === metricId) {
            objectiveId = obj.id;
            objectiveName = obj.name;
            metricName = metric.name;
          }
        });
      });
      
      if (!objectiveId) return;
      
      if (!metricsByObjective[objectiveId]) {
        metricsByObjective[objectiveId] = {
          name: objectiveName,
          metrics: [],
          totalPlan: 0,
          totalActual: 0,
          deviation: 0,
        };
      }
      
      metricsByObjective[objectiveId].metrics.push({
        id: metricId,
        name: metricName,
        plan: values.plan || 0,
        actual: values.fact || 0,
        deviation: values.plan ? ((values.fact - values.plan) / values.plan) * 100 : 0,
      });
      
      metricsByObjective[objectiveId].totalPlan += values.plan || 0;
      metricsByObjective[objectiveId].totalActual += values.fact || 0;
    });
    
    // Calculate the deviation for each objective
    Object.values(metricsByObjective).forEach(objective => {
      if (objective.totalPlan > 0) {
        objective.deviation = ((objective.totalActual - objective.totalPlan) / objective.totalPlan) * 100;
      }
    });
    
    return metricsByObjective;
  };

  const summaryStats = calculateSummaryStats();
  const metricsByObjective = calculateMetricsByObjective();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {editingReport ? (
              <>
                <FileText className="h-5 w-5" />
                Edit Result Report
              </>
            ) : (
              <>
                <BarChart3 className="h-5 w-5" />
                Generate Result Report
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {editingReport 
              ? 'Update your result report with the latest performance data and insights.'
              : 'Create a ' + reportType + ' report summarizing your performance metrics and achievements.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {/* Header Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="reportType">Report Type</Label>
            <Select 
              value={reportType} 
              onValueChange={handleReportTypeChange}
            >
                <SelectTrigger className="w-full">
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly Report</SelectItem>
                <SelectItem value="monthly">Monthly Report</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <div className="relative">
                <Calendar className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
                  className="pl-8"
            />
          </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <div className="relative">
                <Calendar className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
                  className="pl-8"
            />
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end gap-2 mb-6">
            <Button 
              onClick={handleGenerateReport} 
              disabled={loading || !startDate || !endDate}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {loading ? 'Generating...' : 'Generate Metrics'}
            </Button>
          </div>
          
          {/* Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4 mb-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="metrics" className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                Metrics
              </TabsTrigger>
              <TabsTrigger value="summary" className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                Summary
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                Notes
              </TabsTrigger>
            </TabsList>
            
            {/* Metrics Tab */}
            <TabsContent value="metrics" className="p-4 rounded-md border">
              {Object.entries(metrics).length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  <PieChart className="mx-auto h-12 w-12 mb-2 opacity-50" />
                  <p>No metrics data available. Click "Generate Metrics" to load data from your daily reports.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">Metric</TableHead>
                        <TableHead className="text-center">Plan</TableHead>
                        <TableHead className="text-center">Actual</TableHead>
                        <TableHead className="text-center">Deviation</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(metricsByObjective).map(([objectiveId, objective]) => (
                        <React.Fragment key={objectiveId}>
                          {/* Objective Header */}
                          <TableRow className="bg-muted/50">
                            <TableCell colSpan={4} className="font-medium">
                              {objective.name}
                            </TableCell>
                          </TableRow>
                          
                          {/* Metrics for this objective */}
                          {objective.metrics.map((metric) => {
                            const deviation = metric.plan === 0 
                              ? (metric.actual > 0 ? 'Infinity' : '0') 
                              : ((metric.actual - metric.plan) / metric.plan) * 100;
                            
                            const deviationText = typeof deviation === 'number' 
                              ? `${deviation.toFixed(1)}%` 
                              : `${deviation}%`;
                            
                            const deviationColor = deviation === 0 || deviation === '0'
                              ? '' 
                              : (typeof deviation === 'number' && deviation < 0) || deviation === '-Infinity'
                            ? 'text-red-500' 
                                : 'text-green-500';
                                
                            return (
                              <TableRow key={metric.id}>
                                <TableCell className="pl-8">{metric.name}</TableCell>
                                <TableCell className="text-center">{metric.plan}</TableCell>
                                <TableCell className="text-center">{metric.actual}</TableCell>
                                <TableCell className={`text-center ${deviationColor}`}>
                                  {deviationText}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          
                          {/* Objective Total */}
                          <TableRow className="bg-muted/20">
                            <TableCell className="pl-8 font-medium">Total</TableCell>
                            <TableCell className="text-center font-medium">{objective.totalPlan}</TableCell>
                            <TableCell className="text-center font-medium">{objective.totalActual}</TableCell>
                            <TableCell className={`text-center font-medium ${objective.deviation < 0 ? 'text-red-500' : objective.deviation > 0 ? 'text-green-500' : ''}`}>
                              {objective.deviation.toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
            
            {/* Summary Tab */}
            <TabsContent value="summary" className="p-4 rounded-md border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {summaryStats.averageDeviation > 0 
                        ? '+' + summaryStats.averageDeviation.toFixed(1) + '%'
                        : summaryStats.averageDeviation.toFixed(1) + '%'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Average deviation from plan
                    </p>
                    <div className="mt-4">
                      <Progress 
                        value={50 + summaryStats.averageDeviation} 
                        className="h-2"
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Targets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {summaryStats.totalMetrics 
                        ? ((summaryStats.onTarget / summaryStats.totalMetrics) * 100).toFixed(0) + '%'
                        : '0%'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Metrics on target (±5%)
                    </p>
                    <div className="grid grid-cols-3 gap-1 mt-2">
                      <div className="text-center p-2 bg-green-100 dark:bg-green-900/20 rounded">
                        <div className="text-lg font-medium text-green-600 dark:text-green-400">{summaryStats.overPerforming}</div>
                        <div className="text-xs text-muted-foreground">Over</div>
                      </div>
                      <div className="text-center p-2 bg-blue-100 dark:bg-blue-900/20 rounded">
                        <div className="text-lg font-medium text-blue-600 dark:text-blue-400">{summaryStats.onTarget}</div>
                        <div className="text-xs text-muted-foreground">On target</div>
                      </div>
                      <div className="text-center p-2 bg-red-100 dark:bg-red-900/20 rounded">
                        <div className="text-lg font-medium text-red-600 dark:text-red-400">{summaryStats.underPerforming}</div>
                        <div className="text-xs text-muted-foreground">Under</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Numbers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between mb-2">
                      <div>
                        <div className="text-muted-foreground text-xs">Plan</div>
                        <div className="font-bold">{summaryStats.totalPlan}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Actual</div>
                        <div className="font-bold">{summaryStats.totalActual}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Metrics</div>
                        <div className="font-bold">{summaryStats.totalMetrics}</div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-xs text-muted-foreground mb-1">Completion</div>
                      <Progress 
                        value={summaryStats.totalPlan ? (summaryStats.totalActual / summaryStats.totalPlan) * 100 : 0} 
                        className="h-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="mt-4">
                <Label htmlFor="summary" className="mb-2 block">Summary</Label>
            <Textarea
              id="summary"
                  placeholder="Enter a summary of your achievements and key results..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
                  className="min-h-[100px]"
            />
          </div>
            </TabsContent>
            
            {/* Notes Tab */}
            <TabsContent value="notes" className="space-y-4 p-4 rounded-md border">
              <div>
                <Label htmlFor="nextGoals" className="mb-2 block">Next Goals</Label>
            <Textarea
              id="nextGoals"
                  placeholder="What are your goals for the next period?"
              value={nextGoals}
              onChange={(e) => setNextGoals(e.target.value)}
                  className="min-h-[100px]"
            />
          </div>
          
              <div>
                <Label htmlFor="comments" className="mb-2 block">Comments & Observations</Label>
            <Textarea
              id="comments"
                  placeholder="Any additional comments or observations..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
                  className="min-h-[100px]"
            />
          </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveReport} 
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {editingReport ? 'Update Report' : 'Save Report'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 