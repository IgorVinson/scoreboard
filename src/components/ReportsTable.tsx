'use client';

import React, { useState } from 'react';
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
  ArrowRight,
  Trash2,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { format } from 'date-fns';

// Import the Objective and Metric types from ObjectivesMetricsTable
import { Objective, Metric } from './ObjectivesMetricsTable';

interface Report {
  id: string;
  date: string;
  metrics_data: Record<string, number>;
  today_notes: string;
  tomorrow_notes: string;
  general_comments: string;
  user_id: string;
  created_at: string;
}

interface ReportsTableProps {
  reports: Report[];
  objectives: Objective[];
  onDeleteReport: (reportId: string) => void;
  onMoveReport: (reportId: string, direction: 'up' | 'down') => void;
}

export function ReportsTable({
  reports,
  objectives,
  onDeleteReport,
  onMoveReport,
}: ReportsTableProps) {
  const [expandedReports, setExpandedReports] = useState<Set<string>>(new Set());
  const [expandedObjectives, setExpandedObjectives] = useState<Map<string, Set<string>>>(new Map());
  const [expandedMainObjectives, setExpandedMainObjectives] = useState<Map<string, Set<string>>>(new Map());

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

  const toggleObjectiveExpansion = (reportId: string, objectiveId: string) => {
    setExpandedObjectives(prev => {
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

  const toggleMainObjectiveExpansion = (reportId: string, objectiveId: string, event: React.MouseEvent) => {
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

  const isObjectiveExpanded = (reportId: string, objectiveId: string) => {
    return expandedObjectives.get(reportId)?.has(objectiveId) || false;
  };

  const isMainObjectiveExpanded = (reportId: string, objectiveId: string) => {
    return expandedMainObjectives.get(reportId)?.has(objectiveId) || false;
  };

  // Helper function to get plan, actual, and deviation for a metric
  const getMetricValues = (metric: Metric, report: Report) => {
    const plan = metric.target || '-';
    const actual = report.metrics_data[metric.id] !== undefined ? report.metrics_data[metric.id] : '-';
    
    let deviation = '-';
    if (typeof plan === 'number' && typeof actual === 'number') {
      deviation = ((actual - plan) / plan * 100).toFixed(1);
    }
    
    return { plan, actual, deviation };
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Objectives/Metrics</TableHead>
          <TableHead>Plan</TableHead>
          <TableHead>Actual</TableHead>
          <TableHead>Deviation</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reports.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center">
              No reports found
            </TableCell>
          </TableRow>
        ) : (
          reports.map((report, reportIndex) => {
            const isExpanded = expandedReports.has(report.id);
            const formattedDate = format(new Date(report.date), 'yyyy-MM-dd');

            return (
              <React.Fragment key={report.id}>
                <TableRow>
                  <TableCell>
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 mr-2"
                        onClick={() => toggleReportExpansion(report.id)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                      {formattedDate}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col space-y-1">
                      {objectives.map((objective) => (
                        <React.Fragment key={objective.id}>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => toggleMainObjectiveExpansion(report.id, objective.id, e)}
                            >
                              {isMainObjectiveExpanded(report.id, objective.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                            <span className="text-sm">{objective.name}</span>
                            {objective.metrics.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {objective.metrics.length} metrics
                              </Badge>
                            )}
                          </div>
                          
                          {isMainObjectiveExpanded(report.id, objective.id) && (
                            <div className="ml-6 mt-1 mb-2 border-l-2 pl-2">
                              {objective.metrics.map(metric => {
                                const { plan, actual, deviation } = getMetricValues(metric, report);
                                return (
                                  <div key={metric.id} className="flex justify-between text-sm py-1">
                                    <span className="text-muted-foreground">{metric.name}</span>
                                    <div className="flex space-x-6">
                                      <span className="w-12 text-right">{plan}</span>
                                      <span className="w-12 text-right">{actual}</span>
                                      <span className={`w-16 text-right ${
                                        deviation !== '-' ? 
                                          (parseFloat(deviation) >= 0 ? 'text-green-500' : 'text-red-500') 
                                          : ''
                                      }`}>
                                        {deviation !== '-' ? `${deviation}%` : '-'}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right"></TableCell>
                  <TableCell className="text-right"></TableCell>
                  <TableCell className="text-right"></TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onDeleteReport(report.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onMoveReport(report.id, 'up')}
                        disabled={reportIndex === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onMoveReport(report.id, 'down')}
                        disabled={reportIndex === reports.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>

                {/* Expanded content */}
                {isExpanded && (
                  <TableRow>
                    <TableCell colSpan={6} className="bg-muted/50 p-0">
                      <div className="py-2 px-4">
                        {/* Objectives and Metrics Details */}
                        <div className="mb-4">
                          <h4 className="font-medium mb-2">Objectives & Metrics</h4>
                          {objectives.map((objective) => (
                            <div key={objective.id} className="mb-4 border rounded-md">
                              <div 
                                className="flex items-center space-x-2 p-3 bg-muted/30 cursor-pointer"
                                onClick={() => toggleObjectiveExpansion(report.id, objective.id)}
                              >
                                {isObjectiveExpanded(report.id, objective.id) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                                <h5 className="font-medium">{objective.name}</h5>
                              </div>
                              
                              {isObjectiveExpanded(report.id, objective.id) && objective.metrics.length > 0 && (
                                <div className="p-3">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Metric</TableHead>
                                        <TableHead>Target</TableHead>
                                        <TableHead>Actual</TableHead>
                                        <TableHead>Deviation</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {objective.metrics.map((metric) => {
                                        const { plan, actual, deviation } = getMetricValues(metric, report);
                                        
                                        return (
                                          <TableRow key={metric.id}>
                                            <TableCell>{metric.name}</TableCell>
                                            <TableCell>{plan}</TableCell>
                                            <TableCell>{actual}</TableCell>
                                            <TableCell>
                                              {deviation !== '-' && (
                                                <span className={
                                                  parseFloat(deviation) >= 0 
                                                    ? 'text-green-500' 
                                                    : 'text-red-500'
                                                }>
                                                  {deviation}%
                                                </span>
                                              )}
                                              {deviation === '-' && '-'}
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })}
                                    </TableBody>
                                  </Table>
                                </div>
                              )}
                            </div >
                          ))}
                        </div>

                        {/* Notes Sections */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-2">Today's Notes e</h4>
                            <div 
                              className="text-sm border rounded p-3" 
                              dangerouslySetInnerHTML={{ __html: report.today_notes }} 
                            />
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Tomorrow's Notes</h4>
                            <div 
                              className="text-sm border rounded p-3" 
                              dangerouslySetInnerHTML={{ __html: report.tomorrow_notes }} 
                            />
                          </div>
                        </div>
                        <div className="mt-4">
                          <h4 className="font-medium mb-2">General Comments</h4>
                          <div 
                            className="text-sm border rounded p-3" 
                            dangerouslySetInnerHTML={{ __html: report.general_comments }} 
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
