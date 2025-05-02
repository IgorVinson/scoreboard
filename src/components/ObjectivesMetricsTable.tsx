import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export interface Metric {
  id: string;
  name: string;
  target: number;
  current: number;
  unit: string;
}

export interface Objective {
  id: string;
  name: string;
  metrics: Metric[];
  progress: number;
}

interface ObjectivesMetricsTableProps {
  objectives: Objective[];
}

export function ObjectivesMetricsTable({ objectives }: ObjectivesMetricsTableProps) {
  if (!objectives || objectives.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Objectives & Key Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No objectives found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Objectives & Key Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Objective / Metric</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Current</TableHead>
              <TableHead>Progress</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {objectives.map((objective) => (
              <React.Fragment key={objective.id}>
                <TableRow className="bg-muted/50">
                  <TableCell className="font-medium">{objective.name}</TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={objective.progress} className="w-[60px]" />
                      <span>{objective.progress}%</span>
                    </div>
                  </TableCell>
                </TableRow>
                {objective.metrics.map((metric) => {
                  const progress = Math.min(100, (metric.current / metric.target) * 100);
                  return (
                    <TableRow key={metric.id}>
                      <TableCell className="pl-6">{metric.name}</TableCell>
                      <TableCell>
                        {metric.target} {metric.unit}
                      </TableCell>
                      <TableCell>
                        {metric.current} {metric.unit}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={progress} className="w-[60px]" />
                          <span>{Math.round(progress)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 