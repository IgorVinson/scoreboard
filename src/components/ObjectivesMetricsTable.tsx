'use client';

import { useState, useEffect } from 'react';
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
  PlusCircle,
  Trash2,
  ChevronDown,
  ChevronRight,
  Play,
  Edit,
  Target,
  Minus,
  ArrowRight,
} from 'lucide-react';
import { objectivesService } from '@/lib/objectives-service';

// Define the data structure
export interface Metric {
  id: string;
  name: string;
  description: string;
  plan?: number;
  actual?: number;
  planPeriod?: string;
}

export interface Objective {
  id: string;
  name: string;
  description: string;
  metrics: Metric[];
  isExpanded?: boolean;
}

interface ObjectivesMetricsTableProps {
  objectives: Objective[];
  onObjectivesChange: (objectives: Objective[]) => void;
}

export function ObjectivesMetricsTable({
  objectives,
  onObjectivesChange,
}: ObjectivesMetricsTableProps) {
  // Dialog states
  const [objectiveDialogOpen, setObjectiveDialogOpen] = useState(false);
  const [metricDialogOpen, setMetricDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [currentObjectiveId, setCurrentObjectiveId] = useState<string | null>(
    null
  );
  const [currentMetricId, setCurrentMetricId] = useState<string | null>(null);
  const [objectiveName, setObjectiveName] = useState('');
  const [objectiveDescription, setObjectiveDescription] = useState('');
  const [metricName, setMetricName] = useState('');
  const [metricDescription, setMetricDescription] = useState('');

  // Toggle objective expansion
  const toggleObjectiveExpansion = (objectiveId: string) => {
    const updatedObjectives = objectives.map(obj =>
      obj.id === objectiveId ? { ...obj, isExpanded: !obj.isExpanded } : obj
    );
    onObjectivesChange(updatedObjectives);
  };

  // Open dialog to add a new objective
  const openAddObjectiveDialog = () => {
    setObjectiveName('');
    setObjectiveDescription('');
    setIsEditing(false);
    setObjectiveDialogOpen(true);
  };

  // Open dialog to edit an objective
  const openEditObjectiveDialog = (objective: Objective) => {
    setObjectiveName(objective.name);
    setObjectiveDescription(objective.description);
    setCurrentObjectiveId(objective.id);
    setIsEditing(true);
    setObjectiveDialogOpen(true);
  };

  // Open dialog to add a new metric
  const openAddMetricDialog = (objectiveId: string) => {
    setMetricName('');
    setMetricDescription('');
    setCurrentObjectiveId(objectiveId);
    setIsEditing(false);
    setMetricDialogOpen(true);
  };

  // Open dialog to edit a metric
  const openEditMetricDialog = (metric: Metric, objectiveId: string) => {
    setMetricName(metric.name);
    setMetricDescription(metric.description);
    setCurrentMetricId(metric.id);
    setCurrentObjectiveId(objectiveId);
    setIsEditing(true);
    setMetricDialogOpen(true);
  };

  // Handle objective save (add or edit)
  const handleObjectiveSave = async () => {
    console.log("Save button clicked, starting save process");
    if (objectiveName.trim() === '') {
      alert("Objective name cannot be empty");
      return;
    }

    try {
      if (isEditing && currentObjectiveId) {
        // Update existing objective
        console.log("Updating existing objective with ID:", currentObjectiveId);
        const updatedObjective = await objectivesService.updateObjective(currentObjectiveId, {
          name: objectiveName,
          description: objectiveDescription,
        });
        
        console.log("Update response from database:", updatedObjective);
        
        if (updatedObjective) {
          const updated = {
            ...updatedObjective,
            metrics: objectives.find(o => o.id === currentObjectiveId)?.metrics || [],
          };
          onObjectivesChange(
            objectives.map(o => (o.id === currentObjectiveId ? updated : o))
          );
          alert("Objective updated successfully!");
        }
      } else {
        // Add new objective
        console.log("Creating new objective:", { name: objectiveName, description: objectiveDescription });
        
        // Try direct database insert to debug
        const { supabase } = await import('@/lib/supabase');
        const user = await supabase.auth.getUser();
        
        console.log("Current authenticated user:", user);
        
        if (!user.data.user) {
          alert("Error: No authenticated user found! Cannot create objective.");
          return;
        }
        
        const { data, error } = await supabase
          .from('objectives')
          .insert([
            {
              name: objectiveName,
              description: objectiveDescription,
              user_id: user.data.user.id
            }
          ])
          .select()
          .single();
          
        console.log("Direct insert result:", { data, error });
        
        if (error) {
          alert(`Error creating objective: ${error.message}`);
          throw error;
        }
        
        if (data) {
          const newObjective = data;
          console.log("New objective created:", newObjective);
          onObjectivesChange([...objectives, { ...newObjective, metrics: [], isExpanded: true }]);
          alert("Objective created successfully!");
        }
      }

      // Reset form
      setObjectiveName('');
      setObjectiveDescription('');
      setIsEditing(false);
      setCurrentObjectiveId(null);
      setObjectiveDialogOpen(false);
    } catch (error: any) {
      console.error('Error saving objective:', error);
      alert(`Failed to save objective: ${error.message || 'Unknown error'}`);
    }
  };

  // Handle metric save (add or edit)
  const handleMetricSave = async () => {
    if (!metricName.trim() || !currentObjectiveId) return;

    try {
      if (isEditing && currentMetricId) {
        // Update existing metric in the database
        const { updateObjectiveMetric } = await import('@/lib/supabase-service');
        
        await updateObjectiveMetric(currentMetricId, {
          name: metricName,
          description: metricDescription,
        });

        // Update in state
        const updatedObjectives = objectives.map(obj => {
          if (obj.id === currentObjectiveId) {
            return {
              ...obj,
              metrics: obj.metrics.map(m =>
                m.id === currentMetricId
                  ? { ...m, name: metricName, description: metricDescription }
                  : m
              ),
            };
          }
          return obj;
        });
        onObjectivesChange(updatedObjectives);
      } else {
        // Add new metric to the database
        const { createObjectiveMetric } = await import('@/lib/supabase-service');
        
        const savedMetric = await createObjectiveMetric(currentObjectiveId, {
          name: metricName,
          description: metricDescription,
        });

        // Add to state with the ID from the database
        const newMetric: Metric = {
          id: savedMetric.id,
          name: savedMetric.name,
          description: savedMetric.description || '',
          plan: savedMetric.plan,
          planPeriod: savedMetric.plan_period,
        };

        const updatedObjectives = objectives.map(obj =>
          obj.id === currentObjectiveId
            ? { ...obj, metrics: [...obj.metrics, newMetric] }
            : obj
        );
        onObjectivesChange(updatedObjectives);
      }

      // Close dialog and reset form
      setMetricDialogOpen(false);
      setMetricName('');
      setMetricDescription('');
      setCurrentObjectiveId(null);
      setCurrentMetricId(null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving metric:', error);
    }
  };

  // Handle objective deletion
  const handleDeleteObjective = async (objectiveId: string) => {
    try {
      await objectivesService.deleteObjective(objectiveId);
      const updatedObjectives = objectives.filter(obj => obj.id !== objectiveId);
      onObjectivesChange(updatedObjectives);
    } catch (error) {
      console.error('Error deleting objective:', error);
      // You might want to show an error message to the user here
    }
  };

  // Delete a metric
  const handleDeleteMetric = async (objectiveId: string, metricId: string) => {
    try {
      // Delete from database
      const { deleteObjectiveMetric } = await import('@/lib/supabase-service');
      await deleteObjectiveMetric(metricId);
      
      // Update state after database update
      const updatedObjectives = objectives.map(obj =>
        obj.id === objectiveId
          ? { ...obj, metrics: obj.metrics.filter(m => m.id !== metricId) }
          : obj
      );
      onObjectivesChange(updatedObjectives);
    } catch (error) {
      console.error('Error deleting metric:', error);
    }
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

  return (
    <div className='space-y-4'>
      <div className='flex justify-between items-center'>
        <h3 className='text-lg font-semibold'>Objectives & Metrics Overview</h3>
        <Button
          variant='outline'
          size='sm'
          onClick={openAddObjectiveDialog}
          className='flex items-center gap-1'
        >
          <PlusCircle className='h-4 w-4' /> Add Objective
        </Button>
      </div>

      {/* Objectives and Metrics Table */}
      <Table className='border'>
        <TableHeader>
          <TableRow>
            <TableHead className='w-[40%]'>Objectives/Metrics</TableHead>
            <TableHead className='w-[40%]'>Description</TableHead>
            <TableHead className='w-[20%] text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {objectives.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className='text-center py-4 text-muted-foreground'>
                No objectives added yet. Add your first objective to get started.
              </TableCell>
            </TableRow>
          ) : (
            objectives.map((objective, objIndex) => (
              <>
                {/* Objective Row */}
                <TableRow key={objective.id} className='bg-muted/10 font-medium'>
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
                  <TableCell>{objective.description}</TableCell>
                  <TableCell className='text-right'>
                    <div className='flex gap-1 justify-end'>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-6 w-6 p-0'
                        onClick={() => openEditObjectiveDialog(objective)}
                      >
                        <Edit className='h-3.5 w-3.5' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-6 w-6 p-0 text-destructive'
                        onClick={() => handleDeleteObjective(objective.id)}
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

                {/* Metrics Rows */}
                {objective.isExpanded && (
                  <>
                    {objective.metrics.map((metric, metricIndex) => (
                      <TableRow key={metric.id}>
                        <TableCell>
                          <div className='flex items-center gap-2 pl-8'>
                            <ArrowRight className='h-3 w-3 text-muted-foreground' />
                            <div className='flex-1'>{metric.name}</div>
                          </div>
                        </TableCell>
                        <TableCell>{metric.description}</TableCell>
                        <TableCell className='text-right'>
                          <div className='flex gap-1 justify-end'>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='h-6 w-6 p-0'
                              onClick={() => openEditMetricDialog(metric, objective.id)}
                            >
                              <Edit className='h-3.5 w-3.5' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='h-6 w-6 p-0 text-destructive'
                              onClick={() => handleDeleteMetric(objective.id, metric.id)}
                            >
                              <Trash2 className='h-3.5 w-3.5' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='h-6 w-6 p-0'
                              onClick={() => moveMetric(objIndex, metricIndex, 'up')}
                              disabled={metricIndex === 0}
                            >
                              ↑
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='h-6 w-6 p-0'
                              onClick={() => moveMetric(objIndex, metricIndex, 'down')}
                              disabled={metricIndex === objective.metrics.length - 1}
                            >
                              ↓
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}

                    {/* Add Metric Button */}
                    <TableRow>
                      <TableCell colSpan={3}>
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
                  </>
                )}
              </>
            ))
          )}
        </TableBody>
      </Table>

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
              <Input
                id='objective-description'
                value={objectiveDescription}
                onChange={e => setObjectiveDescription(e.target.value)}
                className='col-span-3'
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

      {/* Metric Dialog */}
      <Dialog open={metricDialogOpen} onOpenChange={setMetricDialogOpen}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit Metric' : 'Add New Metric'}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update the metric details below.'
                : 'Enter the details for your new metric.'}
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
              <Input
                id='metric-description'
                value={metricDescription}
                onChange={e => setMetricDescription(e.target.value)}
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
            <Button onClick={handleMetricSave}>
              {isEditing ? 'Save Changes' : 'Add Metric'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
