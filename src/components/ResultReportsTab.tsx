import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { 
  Edit, 
  Trash2, 
  Star, 
  FileText, 
  ChevronDown, 
  ChevronRight, 
  PlusCircle,
  Calendar,
  ChevronUp,
  Clock,
  Download,
  Plus
} from 'lucide-react';
import type { ResultReport } from '@/lib/types';

interface ResultReportsTabProps {
  resultReports: ResultReport[];
  objectives: any[];
  onCreateReport: () => void;
  onEditReport: (report: ResultReport) => void;
  onDeleteReport: (id: string) => void;
}

export function ResultReportsTab({
  resultReports,
  objectives,
  onCreateReport,
  onEditReport,
  onDeleteReport
}: ResultReportsTabProps) {
  const [expandedReports, setExpandedReports] = useState(new Set<string>());
  const [expandedObjectives, setExpandedObjectives] = useState(new Map<string, Set<string>>());
  
  const toggleReportExpansion = (reportId: string) => {
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

  const toggleObjectiveExpansion = (reportId: string, objectiveId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    setExpandedObjectives(prev => {
      const newMap = new Map(prev);
      const reportObjectives = newMap.get(reportId) || new Set<string>();
      
      if (reportObjectives.has(objectiveId)) {
        reportObjectives.delete(objectiveId);
      } else {
        reportObjectives.add(objectiveId);
      }
      
      newMap.set(reportId, reportObjectives);
      return newMap;
    });
  };
  
  const isObjectiveExpanded = (reportId: string, objectiveId: string) => {
    return expandedObjectives.get(reportId)?.has(objectiveId) || false;
  };
  
  // Function to find metric name by id
  const getMetricName = (metricId: string) => {
    let metricName = 'Unknown Metric';
    let objectiveName = '';
    let objectiveId = '';
    
    objectives.forEach(obj => {
      obj.metrics?.forEach(metric => {
        if (metric.id === metricId) {
          metricName = metric.name;
          objectiveName = obj.name;
          objectiveId = obj.id;
        }
      });
    });
    
    return { metricName, objectiveName, objectiveId };
  };

  // Group metrics by objective
  const getMetricsByObjective = (report: ResultReport) => {
    const metricsByObjective: Record<string, { 
      objectiveName: string, 
      metrics: Array<{ id: string, name: string, plan: number, fact: number }> 
    }> = {};
    
    Object.entries(report.metrics_summary || {}).forEach(([metricId, values]) => {
      const { metricName, objectiveName, objectiveId } = getMetricName(metricId);
      
      if (!metricsByObjective[objectiveId]) {
        metricsByObjective[objectiveId] = {
          objectiveName: objectiveName || 'Unknown Objective',
          metrics: []
        };
      }
      
      metricsByObjective[objectiveId].metrics.push({
        id: metricId,
        name: metricName,
        plan: values.plan,
        fact: values.fact
      });
    });
    
    return metricsByObjective;
  };

  // Function to render metric values with deviation calculation
  const renderMetricValues = (report: ResultReport, valueType: 'plan' | 'actual' | 'deviation') => {
    const metricsByObjective = getMetricsByObjective(report);
    
    return (
      <div className='space-y-2'>
        {Object.entries(metricsByObjective).map(([objectiveId, { objectiveName, metrics }]) => (
          <div key={`${objectiveId}-${valueType}`}>
            {metrics.map(metric => {
              // Calculate deviation percentage
              let deviation = 0;
              let deviationText = '0%';
              
              if (metric.plan > 0) {
                deviation = ((metric.fact - metric.plan) / metric.plan) * 100;
                deviationText = `${deviation.toFixed(1)}%`;
              } else if (metric.plan === 0 && metric.fact > 0) {
                deviationText = 'Infinity%';
              }
              
              if (valueType === 'plan') {
                return (
                  <div key={`${metric.id}-plan`} className='text-sm py-1'>
                    {metric.plan || '-'}
                  </div>
                );
              } else if (valueType === 'actual') {
                return (
                  <div key={`${metric.id}-actual`} className='text-sm py-1'>
                    {metric.fact || '-'}
                  </div>
                );
              } else {
                return (
                  <div key={`${metric.id}-deviation`} className='text-sm py-1'>
                    <span className={
                      metric.plan === 0 && metric.fact > 0
                        ? 'text-green-500'
                        : deviation < 0 
                          ? 'text-red-500' 
                          : deviation > 0 
                            ? 'text-green-500' 
                            : ''
                    }>
                      {deviationText !== '0%' ? deviationText : '-'}
                    </span>
                  </div>
                );
              }
            })}
          </div>
        ))}
      </div>
    );
  };

  // Function to render objectives and metrics
  const renderObjectivesAndMetrics = (report: ResultReport) => {
    const metricsByObjective = getMetricsByObjective(report);
    
    return (
      <div className='flex flex-col space-y-1'>
        {Object.entries(metricsByObjective).map(([objectiveId, { objectiveName, metrics }]) => (
          <div
            key={objectiveId}
            className='flex flex-col border-b'
          >
            <div
              className='flex cursor-pointer items-center justify-between py-2'
              onClick={(e) => toggleObjectiveExpansion(report.id, objectiveId, e)}
            >
              <div className='flex items-center'>
                <ChevronRight
                  className={`h-4 w-4 transition-transform ${
                    isObjectiveExpanded(report.id, objectiveId)
                      ? 'rotate-90'
                      : ''
                  }`}
                />
                <span className='ml-2'>{objectiveName}</span>
                <span className='ml-2 text-sm text-muted-foreground'>
                  {metrics.length} metrics
                </span>
              </div>
            </div>

            {/* Metrics */}
            {isObjectiveExpanded(report.id, objectiveId) && (
              <div className='ml-6 space-y-1'>
                {metrics.map((metric) => {
                  const plan = metric.plan || 0
                  const actual = metric.fact || 0
                  const deviation = plan === 0
                    ? actual > 0
                      ? 'Infinity'
                      : 0
                    : ((actual - plan) / plan) * 100

                  // Format the deviation
                  const formattedDeviation = deviation === 'Infinity'
                    ? 'Infinity%'
                    : `${deviation.toFixed(1)}%`

                  // Determine color based on deviation
                  let deviationColor = 'text-muted-foreground'
                  if (deviation !== 0 && deviation !== 'Infinity') {
                    deviationColor = deviation > 0 ? 'text-green-500' : 'text-red-500'
                  } else if (deviation === 'Infinity') {
                    deviationColor = 'text-green-500'
                  }

                  return (
                    <div
                      key={metric.id}
                      className='flex items-center justify-between rounded-md py-1 pl-2'
                    >
                      <div className='flex items-center space-x-2'>
                        <FileText className='h-4 w-4 text-muted-foreground' />
                        <span className='text-sm'>{metric.name}</span>
                      </div>
                      <div className='flex space-x-4 text-sm'>
                        <div className='w-16 text-right'>
                          <span className='text-muted-foreground'>Plan:</span>{' '}
                          <span>{plan}</span>
                        </div>
                        <div className='w-16 text-right'>
                          <span className='text-muted-foreground'>Actual:</span>{' '}
                          <span>{actual}</span>
                        </div>
                        <div className='w-24 text-right'>
                          <span className='text-muted-foreground'>Deviation:</span>{' '}
                          <span className={deviationColor}>
                            {formattedDeviation}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className='space-y-4'>
      <div className='flex justify-between items-center'>
        <h2 className='text-2xl font-bold'>Result Reports</h2>
        <Button 
          onClick={onCreateReport}
          className='flex items-center gap-2'
        >
          <PlusCircle className='h-4 w-4' />
          Generate Report
        </Button>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Period</TableHead>
            <TableHead>Type</TableHead>
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
          {resultReports.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className='text-center py-6'>
                No result reports found. Generate a new weekly or monthly report to see it here.
              </TableCell>
            </TableRow>
          ) : (
            resultReports.map(report => {
              const isExpanded = expandedReports.has(report.id);
              
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
                          {isExpanded ? (
                            <ChevronDown className='h-4 w-4' />
                          ) : (
                            <ChevronRight className='h-4 w-4' />
                          )}
                        </Button>
                        <span>
                          {format(parseISO(report.start_date), 'MMM d')} - {format(parseISO(report.end_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant={report.type === 'weekly' ? 'outline' : 'secondary'}>
                        {report.type === 'weekly' ? 'Weekly' : 'Monthly'}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      {renderObjectivesAndMetrics(report)}
                    </TableCell>
                    
                    <TableCell className='text-center'>{renderMetricValues(report, 'plan')}</TableCell>
                    <TableCell className='text-center'>{renderMetricValues(report, 'actual')}</TableCell>
                    <TableCell className='text-center'>{renderMetricValues(report, 'deviation')}</TableCell>
                    
                    <TableCell>
                      <div className='flex items-center space-x-2 justify-center'>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-8 w-8 p-0'
                          onClick={() => onDeleteReport(report.id)}
                        >
                          <Trash2 className='h-4 w-4 text-destructive' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-8 w-8 p-0'
                          onClick={() => onEditReport(report)}
                        >
                          <Edit className='h-4 w-4 text-muted-foreground' />
                        </Button>
                      </div>
                    </TableCell>
                    
                    <TableCell className='text-center'>
                      <input
                        type='checkbox'
                        checked={report.reviewed || false}
                        className='h-4 w-4 cursor-pointer'
                        readOnly
                      />
                    </TableCell>
                    
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
                  
                  {/* Expanded Row */}
                  {isExpanded && (
                    <TableRow>
                      <TableCell colSpan={10} className='bg-muted/50 p-4'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                          <div>
                            <h4 className='font-medium mb-2 flex items-center gap-1'>
                              <FileText className='h-4 w-4' />
                              Summary
                            </h4>
                            <div className='border rounded-md p-3 text-sm bg-background'>
                              {report.summary || 'No summary provided'}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className='font-medium mb-2 flex items-center gap-1'>
                              <FileText className='h-4 w-4' />
                              Next Goals
                            </h4>
                            <div className='border rounded-md p-3 text-sm bg-background'>
                              {report.next_goals || 'No goals provided'}
                            </div>
                          </div>
                          
                          <div className='md:col-span-2'>
                            <h4 className='font-medium mb-2 flex items-center gap-1'>
                              <FileText className='h-4 w-4' />
                              Comments
                            </h4>
                            <div className='border rounded-md p-3 text-sm bg-background'>
                              {report.comments || 'No comments provided'}
                            </div>
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