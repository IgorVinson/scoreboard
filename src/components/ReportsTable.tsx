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
                        <div key={objective.id} className="flex items-center space-x-2">
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{objective.name}</span>
                          {objective.metrics.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {objective.metrics.length} metrics
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
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
              </React.Fragment>
            );
          })
        )}
      </TableBody>
    </Table>
  );
} 