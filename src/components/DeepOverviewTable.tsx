'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  PlusCircle,
  Trash2,
  ChevronDown,
  ChevronRight,
  Play,
  Edit,
  ArrowRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Objective, Metric } from '@/components/ObjectivesMetricsTable';
import { Textarea } from '@/components/ui/textarea';

interface DeepOverviewTableProps {
  objectives: Objective[];
  onObjectivesChange: (objectives: Objective[]) => void;
}

export function DeepOverviewTable({
  objectives,
  onObjectivesChange,
}: DeepOverviewTableProps) {
  // Dialog states
  const [metricDialogOpen, setMetricDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Confirmation dialog states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'objective' | 'metric';
    objectiveId: string;
    metricId?: string;
  } | null>(null);

  // Form states
  const [currentObjectiveId, setCurrentObjectiveId] = useState<string | null>(
    null
  );
  const [currentMetricId, setCurrentMetricId] = useState<string | null>(null);
  const [metricName, setMetricName] = useState('');
  const [metricPlan, setMetricPlan] = useState<number | undefined>(undefined);
  const [metricActual, setMetricActual] = useState<number | undefined>(
    undefined
  );
  const [metricDescription, setMetricDescription] = useState('');

  // Add these state variables
  const [objectiveDialogOpen, setObjectiveDialogOpen] = useState(false);
  const [objectiveName, setObjectiveName] = useState('');
  const [objectiveDescription, setObjectiveDescription] = useState('');

  // Toggle objective expansion
  const toggleObjectiveExpansion = (objectiveId: string) => {
    const updatedObjectives = objectives.map(obj =>
      obj.id === objectiveId ? { ...obj, isExpanded: !obj.isExpanded } : obj
    );
    onObjectivesChange(updatedObjectives);
  };

  // Open dialog to edit a metric's plan and actual values
  const openEditMetricDialog = (metric: Metric, objectiveId: string) => {
    setMetricName(metric.name);
    setMetricPlan(metric.plan);
    setMetricActual(metric.actual);
    setMetricDescription(metric.description || '');
    setCurrentMetricId(metric.id);
    setCurrentObjectiveId(objectiveId);
    setIsEditing(true);
    setMetricDialogOpen(true);
  };

  // Handle metric save
  const handleMetricSave = () => {
    if (!currentObjectiveId || !currentMetricId) return;

    // Update existing metric
    const updatedObjectives = objectives.map(obj => {
      if (obj.id === currentObjectiveId) {
        return {
          ...obj,
          metrics: obj.metrics.map(m =>
            m.id === currentMetricId
              ? { 
                  ...m, 
                  name: metricName,
                  description: metricDescription,
                  plan: metricPlan, 
                  actual: metricActual 
                }
              : m
          ),
        };
      }
      return obj;
    });

    onObjectivesChange(updatedObjectives);
    setMetricDialogOpen(false);
  };

  // Open delete confirmation dialog
  const openDeleteConfirmation = (
    type: 'objective' | 'metric',
    objectiveId: string,
    metricId?: string
  ) => {
    setItemToDelete({ type, objectiveId, metricId });
    setDeleteConfirmOpen(true);
  };

  // Handle confirmed delete
  const handleConfirmedDelete = () => {
    if (!itemToDelete) return;
    
    let updatedObjectives = [...objectives];
    
    if (itemToDelete.type === 'objective') {
      // Filter out the deleted objective
      updatedObjectives = updatedObjectives.filter(
        obj => obj.id !== itemToDelete.objectiveId
      );
    } else if (itemToDelete.type === 'metric' && itemToDelete.metricId) {
      // Filter out the deleted metric from the specific objective
      updatedObjectives = updatedObjectives.map(obj => {
        if (obj.id === itemToDelete.objectiveId) {
          return {
            ...obj,
            metrics: obj.metrics.filter(m => m.id !== itemToDelete.metricId),
          };
        }
        return obj;
      });
    }
    
    // Update state and localStorage through parent component
    onObjectivesChange(updatedObjectives);
    setDeleteConfirmOpen(false);
    setItemToDelete(null);
  };

  // Move objective up or down
  const moveObjective = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === objectives.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updatedObjectives = [...objectives];
    const [movedObjective] = updatedObjectives.splice(index, 1);
    updatedObjectives.splice(newIndex, 0, movedObjective);

    onObjectivesChange(updatedObjectives);
  };

  // Move metric up or down within an objective
  const moveMetric = (
    objectiveIndex: number,
    metricIndex: number,
    direction: 'up' | 'down'
  ) => {
    const objective = objectives[objectiveIndex];
    if (
      (direction === 'up' && metricIndex === 0) ||
      (direction === 'down' && metricIndex === objective.metrics.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? metricIndex - 1 : metricIndex + 1;
    const updatedMetrics = [...objective.metrics];
    const [movedMetric] = updatedMetrics.splice(metricIndex, 1);
    updatedMetrics.splice(newIndex, 0, movedMetric);

    const updatedObjectives = objectives.map((obj, idx) =>
      idx === objectiveIndex ? { ...obj, metrics: updatedMetrics } : obj
    );

    onObjectivesChange(updatedObjectives);
  };

  // Calculate deviation
  const calculateDeviation = (plan?: number, actual?: number) => {
    if (plan === undefined || actual === undefined) return null;
    if (plan === 0) return actual === 0 ? 0 : 100; // Avoid division by zero

    const deviation = ((actual - plan) / plan) * 100;
    return Math.round(deviation * 10) / 10; // Round to 1 decimal place
  };

  // Get badge variant based on deviation
  const getDeviationBadgeVariant = (deviation: number | null) => {
    if (deviation === null) return 'outline';
    if (deviation >= 0) return 'default';
    if (deviation >= -10) return 'secondary';
    return 'destructive';
  };

  // Open dialog to add a new objective
  const openAddObjectiveDialog = () => {
    setObjectiveName('');
    setObjectiveDescription('');
    setIsEditing(false);
    setObjectiveDialogOpen(true);
  };

  // Open dialog to add a new metric
  const openAddMetricDialog = (objectiveId) => {
    setMetricName('');
    setMetricDescription('');
    setMetricPlan(undefined);
    setMetricActual(undefined);
    setCurrentObjectiveId(objectiveId);
    setIsEditing(false);
    setMetricDialogOpen(true);
  };

  // Add handleObjectiveSave function
  const handleObjectiveSave = () => {
    if (objectiveName.trim() === '') return;

    if (isEditing && currentObjectiveId) {
      // Update existing objective
      const updatedObjectives = objectives.map(obj =>
        obj.id === currentObjectiveId
          ? { ...obj, name: objectiveName, description: objectiveDescription }
          : obj
      );
      onObjectivesChange(updatedObjectives);
    } else {
      // Add new objective
      const newObjective = {
        id: `obj-${Date.now()}`,
        name: objectiveName,
        description: objectiveDescription,
        metrics: [],
        isExpanded: true,
      };
      onObjectivesChange([...objectives, newObjective]);
    }

    setObjectiveDialogOpen(false);
  };

  return (
    <div>
      <div className='flex justify-between items-center mb-4'>
        <h3 className='text-lg font-semibold'>
          Objectives & Metrics Performance
        </h3>
        <Button
          variant='outline'
          size='sm'
          onClick={openAddObjectiveDialog}
          className='flex items-center gap-1'
        >
          <PlusCircle className='h-4 w-4' /> Add Objective
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='w-[30%]'>Objectives/Metrics</TableHead>
            <TableHead className='w-[20%]'>Description</TableHead>
            <TableHead className='text-right'>Plan</TableHead>
            <TableHead className='text-right'>Actual</TableHead>
            <TableHead className='text-right'>Deviation</TableHead>
            <TableHead className='w-[150px]'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {objectives.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className='text-center py-4 text-muted-foreground'
              >
                No objectives added yet. Add objectives in the Overview tab.
              </TableCell>
            </TableRow>
          ) : (
            objectives.map((objective, objIndex) => (
              <>
                <TableRow
                  key={objective.id}
                  className='bg-muted/10 font-medium'
                >
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-6 w-6 p-0'
                        onClick={() => toggleObjectiveExpansion(objective.id)}
                      >
                        {objective.isExpanded ? (
                          <ChevronDown className='h-4 w-4' />
                        ) : (
                          <ChevronRight className='h-4 w-4' />
                        )}
                      </Button>
                      <div className='flex-1'>{objective.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>{objective.description || '-'}</TableCell>
                  <TableCell className='text-right'>-</TableCell>
                  <TableCell className='text-right'>-</TableCell>
                  <TableCell className='text-right'>-</TableCell>
                  <TableCell>
                    <div className='flex gap-1 justify-end'>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-6 w-6 p-0 text-destructive'
                        onClick={() =>
                          openDeleteConfirmation('objective', objective.id)
                        }
                      >
                        <Trash2 className='h-3.5 w-3.5' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-6 w-6 p-0'
                        onClick={() => moveObjective(objIndex, 'up')}
                        disabled={objIndex === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-6 w-6 p-0'
                        onClick={() => moveObjective(objIndex, 'down')}
                        disabled={objIndex === objectives.length - 1}
                      >
                        ↓
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>

                {objective.isExpanded &&
                  objective.metrics.map((metric, metricIndex) => {
                    const deviation = calculateDeviation(
                      metric.plan,
                      metric.actual
                    );

                    return (
                      <TableRow key={metric.id}>
                        <TableCell>
                          <div className="pl-8">
                            <div className="flex items-center gap-2">
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                              <span>{metric.name}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{metric.description || '-'}</TableCell>
                        <TableCell className='text-right'>
                          {metric.plan !== undefined ? metric.plan : '-'}
                        </TableCell>
                        <TableCell className='text-right'>
                          {metric.actual !== undefined ? metric.actual : '-'}
                        </TableCell>
                        <TableCell className='text-right'>
                          {deviation !== null ? (
                            <Badge
                              variant={getDeviationBadgeVariant(deviation)}
                            >
                              {deviation > 0 ? '+' : ''}
                              {deviation}%
                            </Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <div className='flex gap-1 justify-end'>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='h-6 w-6 p-0'
                              onClick={() =>
                                openEditMetricDialog(metric, objective.id)
                              }
                            >
                              <Edit className='h-3.5 w-3.5' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='h-6 w-6 p-0 text-destructive'
                              onClick={() =>
                                openDeleteConfirmation(
                                  'metric',
                                  objective.id,
                                  metric.id
                                )
                              }
                            >
                              <Trash2 className='h-3.5 w-3.5' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='h-6 w-6 p-0'
                              onClick={() =>
                                moveMetric(objIndex, metricIndex, 'up')
                              }
                              disabled={metricIndex === 0}
                            >
                              ↑
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='h-6 w-6 p-0'
                              onClick={() =>
                                moveMetric(objIndex, metricIndex, 'down')
                              }
                              disabled={
                                metricIndex === objective.metrics.length - 1
                              }
                            >
                              ↓
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                {objective.isExpanded && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='ml-8 text-xs'
                        onClick={() => openAddMetricDialog(objective.id)}
                      >
                        <PlusCircle className='h-3 w-3 mr-1' /> Add Metric
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))
          )}
        </TableBody>
      </Table>

      {/* Metric Edit Dialog */}
      <Dialog open={metricDialogOpen} onOpenChange={setMetricDialogOpen}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>Edit Metric</DialogTitle>
            <DialogDescription>
              Update the details for {metricName}.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid grid-cols-4 items-center gap-4'>
              <label
                htmlFor='metric-name'
                className='text-right text-sm font-medium'
              >
                Name
              </label>
              <Input
                id='metric-name'
                value={metricName}
                onChange={e => setMetricName(e.target.value)}
                className='col-span-3'
              />
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <label
                htmlFor='metric-description'
                className='text-right text-sm font-medium'
              >
                Description
              </label>
              <Textarea
                id='metric-description'
                value={metricDescription}
                onChange={e => setMetricDescription(e.target.value)}
                className='col-span-3'
                rows={3}
              />
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <label
                htmlFor='metric-plan'
                className='text-right text-sm font-medium'
              >
                Plan
              </label>
              <Input
                id='metric-plan'
                type='number'
                value={metricPlan !== undefined ? metricPlan : ''}
                onChange={e =>
                  setMetricPlan(
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                className='col-span-3'
              />
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <label
                htmlFor='metric-actual'
                className='text-right text-sm font-medium'
              >
                Actual
              </label>
              <Input
                id='metric-actual'
                type='number'
                value={metricActual !== undefined ? metricActual : ''}
                onChange={e =>
                  setMetricActual(
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                className='col-span-3'
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setMetricDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleMetricSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {itemToDelete?.type === 'objective'
                ? 'Delete Objective'
                : 'Delete Metric'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {itemToDelete?.type === 'objective'
                ? 'Are you sure you want to delete this objective? This will also delete all metrics associated with it.'
                : 'Are you sure you want to delete this metric? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmedDelete}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Objective Dialog */}
      <Dialog open={objectiveDialogOpen} onOpenChange={setObjectiveDialogOpen}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit Objective' : 'Add New Objective'}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update the objective details below.'
                : 'Enter the details for your new objective.'}
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid grid-cols-4 items-center gap-4'>
              <label
                htmlFor='objective-name'
                className='text-right text-sm font-medium'
              >
                Name
              </label>
              <Input
                id='objective-name'
                value={objectiveName}
                onChange={e => setObjectiveName(e.target.value)}
                className='col-span-3'
              />
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <label
                htmlFor='objective-description'
                className='text-right text-sm font-medium'
              >
                Description
              </label>
              <Textarea
                id='objective-description'
                value={objectiveDescription}
                onChange={e => setObjectiveDescription(e.target.value)}
                className='col-span-3'
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setObjectiveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleObjectiveSave}>
              {isEditing ? 'Save Changes' : 'Add Objective'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
