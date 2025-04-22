import React, { useState, useEffect } from 'react';
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
  Star,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

export function ReportsTable({
  reports,
  objectives,
  onDeleteReport,
  onToggleReview,
  onEditReport,
  onReviewReport,
}) {
  const [expandedReports, setExpandedReports] = useState(new Set());
  const [expandedMainObjectives, setExpandedMainObjectives] = useState(
    new Map()
  );
  const [activeTab, setActiveTab] = useState('overview-performance');

  const toggleReportExpansion = reportId => {
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

  const toggleMainObjectiveExpansion = (reportId, objectiveId, event) => {
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

  const isMainObjectiveExpanded = (reportId, objectiveId) => {
    return expandedMainObjectives.get(reportId)?.has(objectiveId) || false;
  };

  // Helper function to get plan, actual, and deviation for a metric
  const getMetricValues = (metric, report) => {
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
  const renderObjectivesAndMetrics = report => {
    return (
      <div className='flex flex-col space-y-1'>
        {objectives.map(objective => (
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
                {objective.metrics.map(metric => (
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
  const renderMetricValues = (report, column) => {
    return (
      <div className='flex flex-col space-y-1'>
        {objectives.map(objective => (
          <div key={objective.id} className='flex flex-col'>
            {/* Placeholder for the objective row to maintain alignment */}
            <div className='flex items-center h-6'></div>

            {/* Metric values - only rendered when objective is expanded */}
            {isMainObjectiveExpanded(report.id, objective.id) && (
              <div className='ml-6 mt-1 mb-2'>
                {objective.metrics.map(metric => {
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

  // Function to collect metrics for the chart
  const collectMetricsForChart = () => {
    const planMetrics = [];
    const factMetrics = [];
    const objectiveNames = [];

    objectives.forEach(objective => {
      objectiveNames.push(objective.name);
      
      // Calculate total plan and actual values for this objective
      let totalPlan = 0;
      let totalFact = 0;
      
      objective.metrics.forEach(metric => {
        // Sum up values from all reports for this metric
        reports.forEach(report => {
          const { plan, actual } = getMetricValues(metric, report);
          if (typeof plan === 'number') totalPlan += plan;
          if (typeof actual === 'number') totalFact += actual;
        });
      });
      
      planMetrics.push(totalPlan);
      factMetrics.push(totalFact);
    });
    
    return { planMetrics, factMetrics, objectiveNames };
  };

  // Update the initial state or useEffect to set the default active tab
  useEffect(() => {
    setActiveTab('overview-performance');
  }, []);

  return (
    <div className='space-y-4'>
      <Table className='border rounded-md'>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Objectives/Metrics</TableHead>
            <TableHead className='text-center'>Plan</TableHead>
            <TableHead className='text-center'>Actual</TableHead>
            <TableHead className='text-center'>Deviation</TableHead>
            <TableHead className='text-center'>Review</TableHead>
            <TableHead className='text-center'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className='text-center py-6'>
                No reports found. Create a report to get started.
              </TableCell>
            </TableRow>
          ) : (
            reports.map((report, reportIndex) => {
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
                  <TableRow
                    className='cursor-pointer hover:bg-muted/50'
                    onClick={() => toggleReportExpansion(report.id)}
                  >
                    <TableCell>
                      <div className='flex items-center space-x-2'>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-6 w-6 p-0'
                        >
                          {isExpanded ? (
                            <ChevronDown className='h-4 w-4' />
                          ) : (
                            <ChevronRight className='h-4 w-4' />
                          )}
                        </Button>
                        <span>
                          {formattedDate}
                          {report.type === 'result' && (
                            <Badge className='ml-2' variant='outline'>
                              {report.report_type === 'weekly'
                                ? 'Weekly'
                                : 'Monthly'}
                            </Badge>
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {isExpanded ? (
                        renderObjectivesAndMetrics(report)
                      ) : (
                        <span className='text-muted-foreground text-sm'>
                          {objectives.length} objectives,{' '}
                          {objectives.reduce(
                            (acc, obj) => acc + obj.metrics.length,
                            0
                          )}{' '}
                          metrics
                        </span>
                      )}
                    </TableCell>
                    <TableCell className='text-center'>
                      {isExpanded
                        ? renderMetricValues(report, 'plan')
                        : countTotalValue(report, 'plan')}
                    </TableCell>
                    <TableCell className='text-center'>
                      {isExpanded
                        ? renderMetricValues(report, 'actual')
                        : countTotalValue(report, 'actual')}
                    </TableCell>
                    <TableCell className='text-center'>
                      {isExpanded
                        ? renderMetricValues(report, 'deviation')
                        : calculateTotalDeviation(report)}
                    </TableCell>
                    <TableCell className='text-center'>
                      <Badge
                        variant={report.reviewed ? 'success' : 'outline'}
                        className='cursor-pointer'
                        onClick={e => {
                          e.stopPropagation(); // Prevent expanding the row
                          onToggleReview(report.id);
                        }}
                      >
                        {report.reviewed ? 'Reviewed' : 'Not Reviewed'}
                      </Badge>
                      {report.quality_rating && report.quantity_rating && (
                        <div className='mt-1 flex items-center justify-center gap-1 text-xs text-muted-foreground'>
                          <Star className='h-3 w-3 fill-yellow-400 text-yellow-400' />
                          <span>
                            {((report.quality_rating + report.quantity_rating) /
                              2).toFixed(1)}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center justify-center space-x-2'>
                        {/* Only show edit button for daily reports */}
                        {report.type !== 'result' && (
                          <Button
                            variant='ghost'
                            size='sm'
                            className='h-7 w-7 p-0'
                            onClick={e => {
                              e.stopPropagation();
                              onEditReport(report);
                            }}
                          >
                            <Edit className='h-4 w-4' />
                          </Button>
                        )}
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-7 w-7 p-0'
                          onClick={e => {
                            e.stopPropagation();
                            if (report.reviewed) {
                              onReviewReport(report);
                            } else {
                              onReviewReport(report);
                            }
                          }}
                        >
                          <FileText className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-7 w-7 p-0 text-destructive'
                          onClick={e => {
                            e.stopPropagation();
                            onDeleteReport(report.id);
                          }}
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow>
                      <TableCell colSpan={7} className='p-4 bg-muted/30'>
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                          <div>
                            <h4 className='text-sm font-medium mb-2'>
                              Today's Notes
                            </h4>
                            <div
                              className='text-sm text-muted-foreground border rounded-md p-3 h-[100px] overflow-y-auto'
                              dangerouslySetInnerHTML={{
                                __html: report.today_notes || '<p>No notes</p>',
                              }}
                            ></div>
                          </div>
                          <div>
                            <h4 className='text-sm font-medium mb-2'>
                              Tomorrow's Plan
                            </h4>
                            <div
                              className='text-sm text-muted-foreground border rounded-md p-3 h-[100px] overflow-y-auto'
                              dangerouslySetInnerHTML={{
                                __html:
                                  report.tomorrow_notes || '<p>No plan</p>',
                              }}
                            ></div>
                          </div>
                          <div>
                            <h4 className='text-sm font-medium mb-2'>
                              General Comments
                            </h4>
                            <div
                              className='text-sm text-muted-foreground border rounded-md p-3 h-[100px] overflow-y-auto'
                              dangerouslySetInnerHTML={{
                                __html:
                                  report.general_comments ||
                                  '<p>No comments</p>',
                              }}
                            ></div>
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
    </div>
  );
}

// Helper functions to calculate totals
function countTotalValue(report, type) {
  let total = 0;
  let count = 0;
  
  const metricsData = report.metrics_data || report.metrics_summary || {};
  
  Object.values(metricsData).forEach((data: any) => {
    if (data && typeof data[type === 'plan' ? 'plan' : 'fact'] === 'number') {
      total += data[type === 'plan' ? 'plan' : 'fact'];
      count++;
    }
  });
  
  return count > 0 ? total.toFixed(1) : '-';
}

function calculateTotalDeviation(report) {
  let totalPlan = 0;
  let totalActual = 0;
  let count = 0;
  
  const metricsData = report.metrics_data || report.metrics_summary || {};
  
  Object.values(metricsData).forEach((data: any) => {
    if (
      data &&
      typeof data.plan === 'number' &&
      typeof data.fact === 'number'
    ) {
      totalPlan += data.plan;
      totalActual += data.fact;
      count++;
    }
  });
  
  if (count === 0 || totalPlan === 0) return '-';
  
  const deviation = ((totalActual - totalPlan) / totalPlan) * 100;
  
  // Apply styling based on deviation value
  let className = deviation >= 0 ? 'text-green-500' : 'text-red-500';
  
  return (
    <span className={className}>
      {deviation > 0 ? '+' : ''}
      {deviation.toFixed(1)}%
    </span>
  );
}
