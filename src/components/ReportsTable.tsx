import React, {useState} from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
  ChevronRight,
  Trash2,
  Edit,
  FileText,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface Metric {
  id: string;
  name: string;
}

interface Objective {
  id: string;
  name: string;
  metrics: Metric[];
}

interface MetricData {
  plan?: number;
  fact?: number;
}

interface MetricsData {
  [key: string]: MetricData;
}

export interface Report {
  id: string;
  date?: string;
  is_result_report?: boolean;
  display_date?: string;
  metrics_data?: MetricsData;
  metrics_summary?: MetricsData;
  today_notes?: string;
  tomorrow_notes?: string;
  summary?: string;
  next_goals?: string;
  general_comments?: string;
  comments?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
  reviewed?: boolean;
  // Additional fields for result reports
  type?: 'weekly' | 'monthly' | 'result';
  start_date?: string;
  end_date?: string;
  rating?: number;
  feedback?: string;
  quantity_rating?: number;
  quality_rating?: number;
}

interface ReportsTableProps {
  reports: Report[];
  objectives: Objective[];
  onDeleteReport: (id: string) => void;
  onToggleReview: (report: Report) => void;
  onEditReport: (report: Report) => void;
  onReviewReport: (report: Report) => void;
}

export function ReportsTable({
  reports,
  objectives,
  onDeleteReport,
  onEditReport,
}: ReportsTableProps) {
  const [expandedReports, setExpandedReports] = useState<Set<string>>(new Set());
  const [expandedMainObjectives, setExpandedMainObjectives] = useState<Map<string, Set<string>>>(
    new Map()
  );

  const toggleReportExpansion = (reportId: string): void => {
    setExpandedReports(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reportId)) {
        newSet.delete(reportId);
      } else {
        newSet.add(reportId);
      }
      return newSet;
    });
  };

  const toggleMainObjectiveExpansion = (reportId: string, objectiveId: string, event: React.MouseEvent): void => {
    // Stop propagation to prevent triggering the row expansion
    event.stopPropagation();

    setExpandedMainObjectives(prev => {
      const newMap = new Map(prev);
      const reportObjectives = newMap.get(reportId) || new Set();

      if (reportObjectives.has(objectiveId)) {
        reportObjectives.delete(objectiveId);
      } else {
        reportObjectives.add(objectiveId);
      }

      newMap.set(reportId, reportObjectives);
      return newMap;
    });
  };

  const isMainObjectiveExpanded = (reportId: string, objectiveId: string): boolean => {
    return expandedMainObjectives.get(reportId)?.has(objectiveId) || false;
  };

  // Helper function to get plan, actual, and deviation for a metric
  const getMetricValues = (metric: Metric, report: Report) => {
    const metricsData = report.metrics_data || report.metrics_summary || {};
    const metricData = metricsData[metric.id];
    const plan = metricData?.plan ?? '-';
    const actual = metricData?.fact ?? '-';

    let deviation = '-';
    if (typeof plan === 'number' && typeof actual === 'number') {
      if (plan === 0 && actual > 0) {
        deviation = 'Infinity';
      } else if (plan !== 0) {
        deviation = (((actual - plan) / plan) * 100).toFixed(1);
      }
    }

    if (deviation === 'NaN') {
      deviation = '-';
    }

    return { plan, actual, deviation };
  };

  // Render the objectives and metrics in a more structured way
  const renderObjectivesAndMetrics = (report: Report) => {
    return (
      <div className='flex flex-col space-y-1'>
        {objectives.map((objective: Objective) => (
          <div key={objective.id} className='flex flex-col'>
            {/* Objective row */}
            <div className='flex items-center space-x-2'>
              <Button
                variant='ghost'
                size='sm'
                className='h-6 w-6 p-0'
                onClick={e =>
                  toggleMainObjectiveExpansion(report.id, objective.id, e)
                }
              >
                {isMainObjectiveExpanded(report.id, objective.id) ? (
                  <ChevronDown className='h-4 w-4' />
                ) : (
                  <ChevronRight className='h-4 w-4' />
                )}
              </Button>
              <span className='text-sm'>{objective.name}</span>
              {objective.metrics.length > 0 && (
                <Badge variant='secondary' className='text-xs'>
                  {objective.metrics.length} metrics
                </Badge>
              )}
            </div>

            {/* Metrics */}
            {isMainObjectiveExpanded(report.id, objective.id) && (
              <div className='ml-6 mt-1 mb-2 border-l-2 pl-2'>
                {objective.metrics.map((metric: Metric) => (
                  <div key={metric.id} className='text-sm py-1'>
                    <span className='text-muted-foreground'>{metric.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // New function to render metric values in a properly aligned way
  const renderMetricValues = (report: Report, column: 'plan' | 'actual' | 'deviation') => {
    return (
      <div className='flex flex-col space-y-1'>
        {objectives.map((objective: Objective) => (
          <div key={objective.id} className='flex flex-col'>
            {/* Placeholder for the objective row to maintain alignment */}
            <div className='flex items-center h-6'></div>

            {/* Metric values - only rendered when objective is expanded */}
            {isMainObjectiveExpanded(report.id, objective.id) && (
              <div className='ml-6 mt-1 mb-2'>
                {objective.metrics.map((metric: Metric) => {
                  const { plan, actual, deviation } = getMetricValues(
                    metric,
                    report
                  );
                  let value;
                  let className = 'text-sm py-1 text-center';

                  if (column === 'plan') {
                    value = plan;
                  } else if (column === 'actual') {
                    value = actual;
                  } else if (column === 'deviation') {
                    value = deviation;
                    if (deviation !== '-') {
                      if (deviation === 'Infinity') {
                        className += ' text-green-500';
                        value = 'Infinity%';
                      } else {
                        const deviationNum = parseFloat(deviation);
                        className +=
                          deviationNum >= 0
                            ? ' text-green-500'
                            : ' text-red-500';
                        value = `${deviation}%`;
                      }
                    }
                  }

                  return (
                    <div key={metric.id} className={className}>
                      {value}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Update the initial state or useEffect to set the default active tab
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Objectives/Metrics</TableHead>
          <TableHead className='text-center'>Plan</TableHead>
          <TableHead className='text-center'>Actual</TableHead>
          <TableHead className='text-center'>Deviation</TableHead>
          <TableHead className='text-center'>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reports.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className='text-center'>
              No reports found
            </TableCell>
          </TableRow>
        ) : (
          reports.map((report: Report) => {
            const isExpanded = expandedReports.has(report.id);
            
            // Get the date to display, handling both regular reports and result reports
            let formattedDate;
            
            if (report.is_result_report && report.display_date) {
              // For result reports, use the pre-formatted display_date
              formattedDate = report.display_date;
            } else {
              // For regular reports, use date-fns to format the date
              try {
                if (report.date && typeof report.date === 'string') {
                  const dateObj = parseISO(report.date);
                  if (!isNaN(dateObj.getTime())) {
                    formattedDate = format(dateObj, 'MM/dd/yyyy');
                  } else {
                    formattedDate = 'Invalid date';
                  }
                } else {
                  formattedDate = 'No date';
                }
              } catch (error) {
                console.error('Error formatting date:', error);
                formattedDate = 'Date error';
              }
            }

            return (
              <React.Fragment key={report.id}>
                <TableRow>
                  <TableCell>
                    <div className='flex items-center'>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-6 w-6 p-0 mr-2'
                        onClick={() => toggleReportExpansion(report.id)}
                      >
                        <FileText className='h-4 w-4 text-gray-400' />
                      </Button>
                      {formattedDate}
                    </div>
                  </TableCell>

                  {/* Objectives and Metrics Column */}
                  <TableCell>{renderObjectivesAndMetrics(report)}</TableCell>

                  {/* Plan Column */}
                  <TableCell>{renderMetricValues(report, 'plan')}</TableCell>

                  {/* Actual Column */}
                  <TableCell>{renderMetricValues(report, 'actual')}</TableCell>

                  {/* Deviation Column */}
                  <TableCell>
                    {renderMetricValues(report, 'deviation')}
                  </TableCell>

                  <TableCell>
                    <div className='flex items-center justify-center space-x-2'>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-8 w-8 p-0'
                        onClick={() => onDeleteReport(report.id)}
                      >
                        <Trash2 className='h-4 w-4 text-destructive' />
                      </Button>
                      {/* Only show Edit button for daily reports, not for result reports */}
                      {!report.is_result_report && (
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-8 w-8 p-0'
                          onClick={() => onEditReport(report)}
                        >
                          <Edit className='h-4 w-4 text-muted-foreground' />
                        </Button>
                      )}
                    </div>
                  </TableCell>

                </TableRow>

                {/* Expanded content */}
                {isExpanded && (
                  <TableRow>
                    <TableCell colSpan={9} className='bg-muted/50 p-0'>
                      <div className='py-2 px-4'>
                        {/* Notes Sections - handle both report types */}
                        <div className='grid grid-cols-2 gap-4'>
                          {/* For daily reports */}
                          {report.today_notes !== undefined && (
                            <>
                              <div>
                                <h4 className='font-medium mb-2'>This day's notes</h4>
                                <div
                                  className='text-sm border rounded p-3'
                                  dangerouslySetInnerHTML={{
                                    __html: report.today_notes,
                                  }}
                                />
                              </div>
                              <div>
                                <h4 className='font-medium mb-2'>Next day's notes</h4>
                                <div
                                  className='text-sm border rounded p-3'
                                  dangerouslySetInnerHTML={{
                                    __html: report.tomorrow_notes || '',
                                  }}
                                />
                              </div>
                            </>
                          )}
                          
                          {/* For result reports */}
                          {report.summary !== undefined && (
                            <>
                              <div>
                                <h4 className='font-medium mb-2'>Summary</h4>
                                <div
                                  className='text-sm border rounded p-3'
                                  dangerouslySetInnerHTML={{
                                    __html: report.summary,
                                  }}
                                />
                              </div>
                              <div>
                                <h4 className='font-medium mb-2'>Next Goals</h4>
                                <div
                                  className='text-sm border rounded p-3'
                                  dangerouslySetInnerHTML={{
                                    __html: report.next_goals || '',
                                  }}
                                />
                              </div>
                            </>
                          )}
                        </div>
                        <div className='mt-4'>
                          <h4 className='font-medium mb-2'>Comments</h4>
                          <div
                            className='text-sm border rounded p-3'
                            dangerouslySetInnerHTML={{
                              __html: report.general_comments || report.comments || '',
                            }}
                          />
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
