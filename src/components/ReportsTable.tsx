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
import { format, parseISO, isValid } from 'date-fns';

export function ReportsTable({
  reports,
  objectives,
  onDeleteReport,
  onToggleReview,
  onEditReport,
  onReviewReport,
}) {
  const [expandedReports, setExpandedReports] = useState(new Set());
  const [expandedMainObjectives, setExpandedMainObjectives] = useState(() => {
    // Initialize with an empty Map
    return new Map();
  });
  const [activeTab, setActiveTab] = useState('overview-performance');

  // Initial console log for debugging
  useEffect(() => {
    console.log('Initial reports:', reports);
    console.log('Initial objectives:', objectives);
  }, [reports, objectives]);

  const toggleReportExpansion = (reportId, event) => {
    // Always stop event propagation
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    // Use direct state setting for more predictable updates
    const isCurrentlyExpanded = expandedReports.has(reportId);
    
    if (isCurrentlyExpanded) {
      // If currently expanded, create a new set without this ID
      const newSet = new Set(expandedReports);
      newSet.delete(reportId);
      setExpandedReports(newSet);
      console.log('Report collapsed:', reportId);
    } else {
      // If currently collapsed, create a new set with this ID added
      const newSet = new Set(expandedReports);
      newSet.add(reportId);
      setExpandedReports(newSet);
      console.log('Report expanded:', reportId);
    }
  };

  const toggleMainObjectiveExpansion = (reportId, objectiveId, event) => {
    // Stop propagation to prevent triggering the row expansion
    event.stopPropagation();
    event.preventDefault();

    console.log(`Toggling objective ${objectiveId} for report ${reportId}`);
    console.log('Current state before update:', 
      Array.from(expandedMainObjectives.entries()).map(([reportId, objectives]) => ({
        reportId,
        objectives: Array.from(objectives)
      }))
    );

    setExpandedMainObjectives(prev => {
      // Create a deep copy of the previous map to avoid mutation issues
      const newMap = new Map();
      
      // Copy all existing entries
      prev.forEach((value, key) => {
        newMap.set(key, new Set(value));
      });
      
      // Get or create the set for this report
      const reportObjectives = newMap.get(reportId) || new Set();
      
      // Toggle the objective
      if (reportObjectives.has(objectiveId)) {
        reportObjectives.delete(objectiveId);
        console.log(`Collapsing objective ${objectiveId} for report ${reportId}`);
      } else {
        reportObjectives.add(objectiveId);
        console.log(`Expanding objective ${objectiveId} for report ${reportId}`);
      }
      
      // Always set the (potentially) modified set back to the map
      newMap.set(reportId, reportObjectives);
      
      console.log('New state after update:', 
        Array.from(newMap.entries()).map(([reportId, objectives]) => ({
          reportId,
          objectives: Array.from(objectives)
        }))
      );
      
      return newMap;
    });
  };

  const isMainObjectiveExpanded = (reportId, objectiveId) => {
    // Get the set of expanded objectives for this report
    const reportObjectives = expandedMainObjectives.get(reportId);
    
    // Check if the set exists and contains this objective
    const isExpanded = reportObjectives?.has(objectiveId) || false;
    
    return isExpanded;
  };

  const formatReportDate = (report: ReportType | undefined): string => {
    try {
      if (!report) {
        console.log("Report is undefined in formatReportDate");
        return "N/A";
      }

      // Handle result reports (with date ranges)
      if (report.is_result_report) {
        // For result reports, the date field already contains a formatted range
        return report.date || "N/A";
      }
      
      // Handle daily reports (with single date)
      if (!report.date) {
        console.log("Report date is missing", report);
        return "N/A";
      }

      const parsedDate = parseISO(report.date);
      return isValid(parsedDate) ? format(parsedDate, "MMM dd, yyyy") : "Invalid Date";
    } catch (error) {
      console.error("Error formatting report date:", error, report);
      return "Date Error";
    }
  };

  const getMetricValues = (report: ReportType | undefined, metricId: string): { plan: number, actual: number, deviation: number } => {
    try {
      if (!report) {
        console.log("Report is undefined in getMetricValues");
        return { plan: 0, actual: 0, deviation: 0 };
      }

      // Handle result reports which use metrics_summary
      if (report.is_result_report) {
        if (!report.metrics_summary) {
          console.log("Result report missing metrics_summary", report);
          return { plan: 0, actual: 0, deviation: 0 };
        }

        const metricData = report.metrics_summary[metricId];
        if (!metricData) {
          console.log(`Metric ${metricId} not found in result report metrics_summary`, report.metrics_summary);
          return { plan: 0, actual: 0, deviation: 0 };
        }

        // Result reports use 'fact' instead of 'actual'
        const plan = typeof metricData.plan === 'number' ? metricData.plan : 0;
        const actual = typeof metricData.fact === 'number' ? metricData.fact : 0;
        const deviation = typeof metricData.deviation === 'number' ? metricData.deviation : 
                          (plan === 0 ? 0 : ((actual - plan) / plan) * 100);

        return { plan, actual, deviation };
      }
      
      // Handle daily reports which use metrics_data
      if (!report.metrics_data) {
        console.log("Daily report missing metrics_data", report);
        return { plan: 0, actual: 0, deviation: 0 };
      }

      const metricData = report.metrics_data[metricId];
      if (!metricData) {
        console.log(`Metric ${metricId} not found in daily report metrics_data`, report.metrics_data);
        return { plan: 0, actual: 0, deviation: 0 };
      }

      const plan = typeof metricData.plan === 'number' ? metricData.plan : 0;
      const actual = typeof metricData.actual === 'number' ? metricData.actual : 0;
      const deviation = plan === 0 ? 0 : ((actual - plan) / plan) * 100;

      return { plan, actual, deviation };
    } catch (error) {
      console.error("Error getting metric values:", error, { report, metricId });
      return { plan: 0, actual: 0, deviation: 0 };
    }
  };

  const renderMetricValues = (report: ReportType | undefined, metric: ObjectiveMetricType): React.ReactNode => {
    try {
      if (!report) {
        console.log("Report is undefined in renderMetricValues");
        return null;
      }
      
      // Just display a dash instead of values for the main row columns
      return <div className="text-center">-</div>;
      
    } catch (error) {
      console.error("Error rendering metric values:", error);
      return <div className="text-sm">Error displaying metrics</div>;
    }
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
                {objective.metrics.map(metric => {
                  const { plan, actual, deviation } = getMetricValues(report, metric.id);
                  const deviationColor = deviation > 0 ? 'text-green-600' : deviation < 0 ? 'text-red-600' : 'text-gray-500';
                  
                  return (
                    <div key={metric.id} className='text-sm py-1 grid grid-cols-4 w-full'>
                      <span className='text-muted-foreground'>{metric.name}</span>
                      <span className='text-center'>{plan}</span>
                      <span className='text-center'>{actual}</span>
                      <span className={`text-center ${deviationColor}`}>{deviation.toFixed(1)}%</span>
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

  // Add a debugging effect to monitor state changes
  useEffect(() => {
    const expandedCount = expandedReports.size;
    console.log(`Expanded reports count: ${expandedCount}`, 
      Array.from(expandedReports));
  }, [expandedReports]);

  // Add debugging for expandedMainObjectives
  useEffect(() => {
    console.log('expandedMainObjectives state updated:', 
      Array.from(expandedMainObjectives.entries()).map(([reportId, objectives]) => ({
        reportId,
        objectives: Array.from(objectives)
      }))
    );
  }, [expandedMainObjectives]);

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
            const formattedDate = formatReportDate(report);
            const isResultReport = report.is_result_report || false;

            return (
              <React.Fragment key={report.id}>
                <TableRow 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={(e) => {
                    // Stop event from propagating to parent row
                    e.stopPropagation();
                    e.preventDefault();
                    
                    // Direct state change for more predictable behavior
                    const isCurrentlyExpanded = expandedReports.has(report.id);
                    const newSet = new Set(expandedReports);
                    
                    if (isCurrentlyExpanded) {
                      newSet.delete(report.id);
                    } else {
                      newSet.add(report.id);
                    }
                    
                    setExpandedReports(newSet);
                  }}
                >
                  <TableCell>
                    <div className='flex items-center'>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-6 w-6 p-0 mr-2'
                        onClick={(e) => {
                          // Stop event from propagating to parent row
                          e.stopPropagation();
                          e.preventDefault();
                          
                          // Direct state change for more predictable behavior
                          const isCurrentlyExpanded = expandedReports.has(report.id);
                          const newSet = new Set(expandedReports);
                          
                          if (isCurrentlyExpanded) {
                            newSet.delete(report.id);
                          } else {
                            newSet.add(report.id);
                          }
                          
                          setExpandedReports(newSet);
                        }}
                      >
                        {isExpanded ? (
                          <ChevronDown className='h-4 w-4 text-gray-400' />
                        ) : (
                          <FileText className='h-4 w-4 text-gray-400' />
                        )}
                      </Button>
                      <div>
                        {formattedDate}
                        {isResultReport && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {report.type || 'Result'}
                          </Badge>
                        )}
                      </div>
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
                    <div className='flex items-center space-x-2'>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-8 w-8 p-0'
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteReport(report.id);
                        }}
                      >
                        <Trash2 className='h-4 w-4 text-destructive' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-8 w-8 p-0'
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditReport(report);
                        }}
                      >
                        <Edit className='h-4 w-4 text-muted-foreground' />
                      </Button>
                    </div>
                  </TableCell>

                  {/* Modified Reviewed column */}
                  <TableCell className='text-center'>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-8 w-8 p-0 rounded-full'
                      onClick={(e) => {
                        e.stopPropagation();
                        if (report.reviewed) {
                          // If already reviewed, just toggle it off
                          onToggleReview(isResultReport ? report : report.id);
                        } else {
                          // If not reviewed, open the review modal
                          onReviewReport(report);
                        }
                      }}
                    >
                      <input
                        type='checkbox'
                        checked={report.reviewed}
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
                        {/* Metrics Table for Expanded View */}
                        <div className='mb-4'>
                          <h4 className='font-medium mb-2'>Metrics</h4>
                          <table className='w-full text-sm border-collapse'>
                            <thead>
                              <tr className='bg-muted/50'>
                                <th className='text-left border p-2'>Metric</th>
                                <th className='text-center border p-2'>Plan</th>
                                <th className='text-center border p-2'>Actual</th>
                                <th className='text-center border p-2'>Deviation</th>
                              </tr>
                            </thead>
                            <tbody>
                              {objectives.flatMap(objective => 
                                objective.metrics.map(metric => {
                                  const { plan, actual, deviation } = getMetricValues(report, metric.id);
                                  const deviationColor = deviation > 0 ? 'text-green-600' : deviation < 0 ? 'text-red-600' : 'text-gray-500';
                                  
                                  return (
                                    <tr key={metric.id} className='border-b hover:bg-muted/30'>
                                      <td className='border p-2'>
                                        <div>
                                          <div className='font-medium'>{metric.name}</div>
                                          <div className='text-xs text-muted-foreground'>{objective.name}</div>
                                        </div>
                                      </td>
                                      <td className='text-center border p-2'>{plan}</td>
                                      <td className='text-center border p-2'>{actual}</td>
                                      <td className={`text-center border p-2 ${deviationColor}`}>{deviation.toFixed(1)}%</td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                        
                        {/* Notes Sections */}
                        <div className='grid grid-cols-2 gap-4'>
                          <div>
                            <h4 className='font-medium mb-2'>
                              This day's notes
                            </h4>
                            <div
                              className='text-sm border rounded p-3'
                              dangerouslySetInnerHTML={{
                                __html: report.today_notes,
                              }}
                            />
                          </div>
                          <div>
                            <h4 className='font-medium mb-2'>
                              Next day's notes
                            </h4>
                            <div
                              className='text-sm border rounded p-3'
                              dangerouslySetInnerHTML={{
                                __html: report.tomorrow_notes,
                              }}
                            />
                          </div>
                        </div>
                        <div className='mt-4'>
                          <h4 className='font-medium mb-2'>Comments</h4>
                          <div
                            className='text-sm border rounded p-3'
                            dangerouslySetInnerHTML={{
                              __html: report.general_comments,
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
