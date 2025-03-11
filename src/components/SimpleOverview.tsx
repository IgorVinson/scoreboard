import { Objective } from '@/components/ObjectivesMetricsTable';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface SimpleOverviewProps {
  objectives: Objective[];
}

export function SimpleOverview({ objectives }: SimpleOverviewProps) {
  // Count total objectives and metrics
  const totalMetrics = objectives.reduce(
    (sum, obj) => sum + obj.metrics.length,
    0
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Dashboard Overview</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Objectives</CardTitle>
            <CardDescription>Total tracked objectives</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{objectives.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Metrics</CardTitle>
            <CardDescription>Total tracked metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalMetrics}</p>
          </CardContent>
        </Card>
      </div>
      
      {objectives.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Objectives</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {objectives.slice(0, 3).map(objective => (
                <li key={objective.id} className="border-b pb-2 last:border-0">
                  <p className="font-medium">{objective.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {objective.metrics.length} metrics
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 