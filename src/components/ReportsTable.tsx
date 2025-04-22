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

  // Modify the tabs array to remove the separate tabs and create a combined one
  const tabs = [
    {
      name: 'Overview & Performance',
      href: '#',
      current: activeTab === 'overview-performance',
    },
    // ... keep other tabs if they exist ...
  ];

  // Update the tab content rendering logic
  function renderTabContent() {
    switch (activeTab) {
      case 'overview-performance':
        return (
          <div>
            {/* Overview content */}
            <div className='mb-8'>
              <h2 className='text-lg font-medium mb-4'>Overview</h2>
              {/* Include all overview components here */}
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {/* Overview metrics and charts */}
                {/* ... existing overview components ... */}
              </div>
            </div>

            {/* Performance content */}
            <div>
              <h2 className='text-lg font-medium mb-4'>Performance</h2>
              {/* Include all performance components here */}
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {/* Performance metrics and charts */}
                {/* ... existing performance components ... */}
              </div>
            </div>
          </div>
        );
      // ... other case statements for other tabs ...
      default:
        return null;
    }
  }

  // Update the initial state or useEffect to set the default active tab
  useEffect(() => {
    setActiveTab('overview-performance');
  }, []);

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
          <TableHead className='text-center'>Reviewed</TableHead>
          <TableHead className='text-center'>Quantity</TableHead>
          <TableHead className='text-center'>Quality</TableHead>
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

                  {/* Modified Reviewed column */}
                  <TableCell className='text-center'>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-8 w-8 p-0 rounded-full'
                      onClick={() => {
                        if (report.reviewed) {
                          // If already reviewed, just toggle it off
                          onToggleReview(report.id);
                        } else {
                          // If not reviewed, open the review modal
                          onReviewReport(report);
                        }
                      }}
                    >
                      <input
                        type='checkbox'
                        checked={report.reviewed !== undefined ? report.reviewed : false}
                        className='h-4 w-4 cursor-pointer'
                        readOnly
                      />
                    </Button>
                  </TableCell>

                  {/* Quantity Column */}
                  <TableCell className='text-center'>
                    {report.quantity_rating !== undefined ? (
                      <div className='flex items-center justify-center'>
                        <Star className='h-4 w-4 text-amber-500 mr-1' />
                        <span>{report.quantity_rating}/5</span>
                      </div>
                    ) : (
                      <span className='text-muted-foreground'>—</span>
                    )}
                  </TableCell>

                  {/* Quality Column */}
                  <TableCell className='text-center'>
                    {report.quality_rating !== undefined ? (
                      <div className='flex items-center justify-center'>
                        <Star className='h-4 w-4 text-amber-500 mr-1' />
                        <span>{report.quality_rating}/5</span>
                      </div>
                    ) : (
                      <span className='text-muted-foreground'>—</span>
                    )}
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
