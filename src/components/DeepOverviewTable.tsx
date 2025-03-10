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
  Target,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Objective, Metric } from '@/components/ObjectivesMetricsTable';
import { Textarea } from '@/components/ui/textarea';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, eachDayOfInterval } from 'date-fns';
import {
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarHeadCell,
  CalendarHeader,
  CalendarMonthHeader,
  CalendarNextButton,
  CalendarPrevButton,
  CalendarViewButton,
} from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

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

  // Add these state variables to the DeepOverviewTable component
  const [dateRange, setDateRange] = useState<'day' | 'week' | 'month'>('day');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedDates, setSelectedDates] = useState<Date[]>([new Date()]);

  // Updated function to get the formatted date range string
  const getDateRangeText = () => {
    if (dateRange === 'day') {
      return format(selectedDate, 'MMM d, yyyy');
    } else if (dateRange === 'week') {
      const start = startOfWeek(selectedDate);
      const end = endOfWeek(selectedDate);
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    } else {
      return format(selectedDate, 'MMMM yyyy');
    }
  };

  // Updated function to handle date range selection
  const handleDateRangeChange = (range: 'day' | 'week' | 'month') => {
    setDateRange(range);
    // Set the date to current date when changing ranges
    const today = new Date();
    setSelectedDate(today);
    
    // Update the selected dates array based on the range
    if (range === 'day') {
      setSelectedDates([today]);
    } else if (range === 'week') {
      const start = startOfWeek(today);
      const end = endOfWeek(today);
      setSelectedDates(eachDayOfInterval({ start, end }));
    } else if (range === 'month') {
      const start = startOfMonth(today);
      const end = endOfMonth(today);
      setSelectedDates(eachDayOfInterval({ start, end }));
    }
  };

  // Add a function to handle date selection in the calendar
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    setSelectedDate(date);
    
    // Update the selected dates array based on the current range
    if (dateRange === 'day') {
      setSelectedDates([date]);
    } else if (dateRange === 'week') {
      const start = startOfWeek(date);
      const end = endOfWeek(date);
      setSelectedDates(eachDayOfInterval({ start, end }));
    } else if (dateRange === 'month') {
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      setSelectedDates(eachDayOfInterval({ start, end }));
    }
  };

  // Add this function to filter objectives based on date range
  const filterObjectivesByDate = (objectives) => {
    // In a real implementation, you would filter based on dates in your data
    // For now, we'll just return all objectives
    return objectives;
  };

  // Add these state variables to the component
  const [plansDialogOpen, setPlansDialogOpen] = useState(false);
  const [planPeriod, setplanPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [planSelectedDate, setPlanSelectedDate] = useState<Date>(new Date());
  const [planSelectedDates, setPlanSelectedDates] = useState<Date[]>([new Date()]);
  const [metricPlans, setMetricPlans] = useState<Record<string, { selected: boolean, value: number | undefined }>>({});

  // Add this state variable for calendar visibility
  const [showPlanCalendar, setShowPlanCalendar] = useState(false);

  // Add this function to handle opening the plans dialog
  const openPlansDialog = () => {
    // Initialize metric plans with all metrics
    const initialMetricPlans: Record<string, { selected: boolean, value: number | undefined }> = {};
    
    objectives.forEach(objective => {
      objective.metrics.forEach(metric => {
        initialMetricPlans[metric.id] = { 
          selected: false, 
          value: undefined 
        };
      });
    });
    
    setMetricPlans(initialMetricPlans);
    setPlansDialogOpen(true);
  };

  // Add these functions to handle date range selection in the plans dialog
  const getPlanDateRangeText = () => {
    if (planPeriod === 'day') {
      return format(planSelectedDate, 'MMM d, yyyy');
    } else if (planPeriod === 'week') {
      const start = startOfWeek(planSelectedDate);
      const end = endOfWeek(planSelectedDate);
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    } else {
      return format(planSelectedDate, 'MMMM yyyy');
    }
  };

  const handlePlanDateRangeChange = (range: 'day' | 'week' | 'month') => {
    setplanPeriod(range);
    // Set the date to current date when changing ranges
    const today = new Date();
    setPlanSelectedDate(today);
    
    // Update the selected dates array based on the range
    if (range === 'day') {
      setPlanSelectedDates([today]);
    } else if (range === 'week') {
      const start = startOfWeek(today);
      const end = endOfWeek(today);
      setPlanSelectedDates(eachDayOfInterval({ start, end }));
    } else if (range === 'month') {
      const start = startOfMonth(today);
      const end = endOfMonth(today);
      setPlanSelectedDates(eachDayOfInterval({ start, end }));
    }
  };

  const handlePlanDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    setPlanSelectedDate(date);
    
    // Update the selected dates array based on the current range
    if (planPeriod === 'day') {
      setPlanSelectedDates([date]);
    } else if (planPeriod === 'week') {
      const start = startOfWeek(date);
      const end = endOfWeek(date);
      setPlanSelectedDates(eachDayOfInterval({ start, end }));
    } else if (planPeriod === 'month') {
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      setPlanSelectedDates(eachDayOfInterval({ start, end }));
    }
  };

  // Add function to handle metric selection for planning
  const handleMetricSelectionChange = (metricId: string, selected: boolean) => {
    setMetricPlans(prev => ({
      ...prev,
      [metricId]: {
        ...prev[metricId],
        selected
      }
    }));
  };

  // Add function to handle metric plan value change
  const handleMetricPlanValueChange = (metricId: string, value: string) => {
    setMetricPlans(prev => ({
      ...prev,
      [metricId]: {
        ...prev[metricId],
        value: value ? Number(value) : undefined
      }
    }));
  };

  // Add function to save plans
  const handleSavePlans = () => {
    // Create plans object
    const plans = {
      id: `plan-${Date.now()}`,
      period: planPeriod,
      startDate: planPeriod === 'day' 
        ? planSelectedDate.toISOString() 
        : planPeriod === 'week'
          ? startOfWeek(planSelectedDate).toISOString()
          : startOfMonth(planSelectedDate).toISOString(),
      endDate: planPeriod === 'day'
        ? planSelectedDate.toISOString()
        : planPeriod === 'week'
          ? endOfWeek(planSelectedDate).toISOString()
          : endOfMonth(planSelectedDate).toISOString(),
      metrics: Object.entries(metricPlans)
        .filter(([_, data]) => data.selected)
        .map(([metricId, data]) => ({
          metricId,
          planValue: data.value
        })),
      createdAt: new Date().toISOString()
    };
    
    // Save to localStorage
    const savedPlans = localStorage.getItem('metricPlans');
    const existingPlans = savedPlans ? JSON.parse(savedPlans) : [];
    const updatedPlans = [...existingPlans, plans];
    localStorage.setItem('metricPlans', JSON.stringify(updatedPlans));
    
    // Close dialog
    setPlansDialogOpen(false);
  };

  return (
    <div>
      <div className='flex justify-between items-center mb-4'>
        <h3 className='text-lg font-semibold'>
          Objectives & Metrics Performance
        </h3>
        <div className='flex items-center gap-2'>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant='outline' size='sm' className='flex items-center gap-1'>
                <CalendarIcon className='h-4 w-4' />
                {getDateRangeText()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align='end'>
              <div className='p-3 border-b'>
                <div className='flex justify-center space-x-2'>
                  <Button 
                    variant={dateRange === 'day' ? 'default' : 'outline'} 
                    size='sm'
                    onClick={() => handleDateRangeChange('day')}
                  >
                    Today
                  </Button>
                  <Button 
                    variant={dateRange === 'week' ? 'default' : 'outline'} 
                    size='sm'
                    onClick={() => handleDateRangeChange('week')}
                  >
                    This Week
                  </Button>
                  <Button 
                    variant={dateRange === 'month' ? 'default' : 'outline'} 
                    size='sm'
                    onClick={() => handleDateRangeChange('month')}
                  >
                    This Month
                  </Button>
                </div>
              </div>
              <Calendar
                mode={dateRange === 'day' ? 'single' : 'multiple'}
                selected={dateRange === 'day' ? selectedDate : selectedDates}
                onSelect={(date) => handleDateSelect(Array.isArray(date) ? date[0] : date)}
                initialFocus
                className="custom-calendar"
                classNames={{
                  day_selected: "bg-gray-200 text-gray-900 hover:bg-gray-300 hover:text-gray-900 focus:bg-gray-300 focus:text-gray-900",
                  day_today: "bg-primary text-primary-foreground"
                }}
              />
            </PopoverContent>
          </Popover>
          <Button
            variant='outline'
            size='sm'
            onClick={openPlansDialog}
            className='flex items-center gap-1'
          >
            <Target className='h-4 w-4' /> Add Plans
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={openAddObjectiveDialog}
            className='flex items-center gap-1'
          >
            <PlusCircle className='h-4 w-4' /> Add Objective
          </Button>
        </div>
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

      {/* Plans Dialog */}
      <Dialog open={plansDialogOpen} onOpenChange={setPlansDialogOpen}>
        <DialogContent className='sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col'>
          <DialogHeader>
            <DialogTitle>Create Plans</DialogTitle>
            <DialogDescription>
              Set plans for your metrics for a specific time period.
            </DialogDescription>
          </DialogHeader>
          
          <div className='space-y-4 py-4 overflow-y-auto'>
            {/* Time Period Selection */}
            <div className='border rounded-md p-4'>
              <div className='flex justify-between items-center mb-2'>
                <h4 className='text-sm font-medium'>Select Time Period</h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowPlanCalendar(!showPlanCalendar)}
                >
                  {showPlanCalendar ? 'Hide Calendar' : 'Show Calendar'}
                </Button>
              </div>
              <div className='flex flex-col gap-4'>
                <div className='flex justify-between items-center'>
                  <div className='flex space-x-2'>
                    <Button 
                      variant={planPeriod === 'day' ? 'default' : 'outline'} 
                      size='sm'
                      onClick={() => handlePlanDateRangeChange('day')}
                    >
                      Today
                    </Button>
                    <Button 
                      variant={planPeriod === 'week' ? 'default' : 'outline'} 
                      size='sm'
                      onClick={() => handlePlanDateRangeChange('week')}
                    >
                      This Week
                    </Button>
                    <Button 
                      variant={planPeriod === 'month' ? 'default' : 'outline'} 
                      size='sm'
                      onClick={() => handlePlanDateRangeChange('month')}
                    >
                      This Month
                    </Button>
                  </div>
                  <div className='text-sm font-medium'>
                    {getPlanDateRangeText()}
                  </div>
                </div>
                
                {showPlanCalendar && (
                  <Calendar
                    mode={planPeriod === 'day' ? 'single' : 'multiple'}
                    selected={planPeriod === 'day' ? planSelectedDate : planSelectedDates}
                    onSelect={(date) => handlePlanDateSelect(Array.isArray(date) ? date[0] : date)}
                    initialFocus
                    className="custom-calendar"
                    classNames={{
                      day_selected: "bg-gray-200 text-gray-900 hover:bg-gray-300 hover:text-gray-900 focus:bg-gray-300 focus:text-gray-900",
                      day_today: "bg-primary text-primary-foreground"
                    }}
                  />
                )}
              </div>
            </div>
            
            {/* Metrics Selection */}
            <div className='border rounded-md p-4 max-h-[300px] overflow-y-auto'>
              <h4 className='text-sm font-medium mb-2'>Select Metrics to Plan</h4>
              <div className='space-y-4'>
                {objectives.map(objective => (
                  <div key={objective.id} className='space-y-2'>
                    <div className='font-medium'>{objective.name}</div>
                    <div className='pl-4 space-y-2'>
                      {objective.metrics.map(metric => (
                        <div key={metric.id} className='flex items-center justify-between'>
                          <div className='flex items-center gap-2'>
                            <Checkbox 
                              id={`metric-${metric.id}`}
                              checked={metricPlans[metric.id]?.selected || false}
                              onCheckedChange={(checked) => 
                                handleMetricSelectionChange(metric.id, checked === true)
                              }
                            />
                            <label 
                              htmlFor={`metric-${metric.id}`}
                              className='text-sm'
                            >
                              {metric.name}
                            </label>
                          </div>
                          <Input
                            type='number'
                            placeholder='Plan value'
                            className='w-24'
                            value={metricPlans[metric.id]?.value !== undefined ? metricPlans[metric.id].value : ''}
                            onChange={(e) => handleMetricPlanValueChange(metric.id, e.target.value)}
                            disabled={!metricPlans[metric.id]?.selected}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant='outline' onClick={() => setPlansDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePlans}>
              Save Plans
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
