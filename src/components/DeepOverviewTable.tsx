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
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  eachDayOfInterval,
} from 'date-fns';
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
  reports?: any[]; // Add reports to props
}

export function DeepOverviewTable({
  objectives,
  onObjectivesChange,
  reports = [], // Default to empty array if not provided
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
    setMetricDescription(metric.description || '');
    setCurrentMetricId(metric.id);
    setCurrentObjectiveId(objectiveId);
    setIsEditing(true);
    setMetricDialogOpen(true);
  };

  // Handle metric save
  const handleMetricSave = () => {
    if (!currentObjectiveId) return;
    
    if (isEditing && currentMetricId) {
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
                  }
                : m
            ),
          };
        }
        return obj;
      });
      
      onObjectivesChange(updatedObjectives);
    } else {
      // Add new metric
      const newMetric = {
        id: `metric-${Date.now()}`,
        name: metricName,
        description: metricDescription,
        plan: undefined,
        actual: undefined,
      };
      
      const updatedObjectives = objectives.map(obj => {
        if (obj.id === currentObjectiveId) {
          return {
            ...obj,
            metrics: [...obj.metrics, newMetric],
          };
        }
        return obj;
      });
      
      onObjectivesChange(updatedObjectives);
    }
    
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
  const calculateDeviation = (metric: Metric, viewPeriod: 'day' | 'week' | 'month') => {
    const accumulatedActual = getAccumulatedActualValue(metric.id, viewPeriod);
    const actualValue = accumulatedActual !== null ? accumulatedActual : metric.actual;
    
    if (metric.plan === undefined || actualValue === undefined || !metric.planPeriod) return null;
    if (metric.plan === 0) return actualValue === 0 ? 0 : 100; // Avoid division by zero

    // Get current date info for projection calculations
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Calculate days passed and days remaining based on plan period
    let daysPassed = 0;
    let totalDays = 0;
    
    if (metric.planPeriod === 'until_week_end') {
      // For week: consider only workdays (Mon-Fri)
      if (currentDayOfWeek >= 1 && currentDayOfWeek <= 5) {
        daysPassed = currentDayOfWeek;
        totalDays = 5; // 5 workdays in a week
      } else if (currentDayOfWeek === 0) { // Sunday
        daysPassed = 0;
        totalDays = 5;
      } else { // Saturday
        daysPassed = 5;
        totalDays = 5;
      }
    } else if (metric.planPeriod === 'until_month_end') {
      // For month: calculate workdays passed and total workdays
      const currentDate = today.getDate();
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      
      // Count workdays passed
      for (let i = 1; i <= currentDate; i++) {
        const tempDate = new Date(today.getFullYear(), today.getMonth(), i);
        const dayOfWeek = tempDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
          daysPassed++;
        }
      }
      
      // Count total workdays in month
      for (let i = 1; i <= lastDayOfMonth; i++) {
        const tempDate = new Date(today.getFullYear(), today.getMonth(), i);
        const dayOfWeek = tempDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
          totalDays++;
        }
      }
    }
    
    // If no days passed or no days in total, return simple deviation
    if (daysPassed === 0 || totalDays === 0) {
      return ((actualValue - metric.plan) / metric.plan) * 100;
    }
    
    // Calculate daily average of actual progress
    const dailyAverage = actualValue / daysPassed;
    
    // Project final value based on daily average
    const daysRemaining = totalDays - daysPassed;
    const projectedFinalValue = (dailyAverage * daysRemaining) + actualValue;
    
    // Calculate deviation based on projected final value
    const deviation = ((projectedFinalValue - metric.plan) / metric.plan) * 100;
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
  const openAddMetricDialog = objectiveId => {
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
  const filterObjectivesByDate = objectives => {
    // In a real implementation, you would filter based on dates in your data
    // For now, we'll just return all objectives
    return objectives;
  };

  // Add these state variables to the component
  const [plansDialogOpen, setPlansDialogOpen] = useState(false);
  const [planPeriod, setPlanPeriod] = useState<
    'until_week_end' | 'until_month_end'
  >('until_week_end');
  const [metricPlans, setMetricPlans] = useState<
    Record<
      string,
      {
        selected: boolean;
        value: number | undefined;
        period: 'until_week_end' | 'until_month_end';
      }
    >
  >({});

  // Add a function to check if any metrics have plans
  const hasAnyPlans = () => {
    return objectives.some(obj =>
      obj.metrics.some(
        metric => metric.plan !== undefined && metric.planPeriod !== undefined
      )
    );
  };

  // Update the openPlansDialog function
  const openPlansDialog = () => {
    // Initialize metric plans with all metrics and their existing plans
    const initialMetricPlans: Record<
      string,
      {
        selected: boolean;
        value: number | undefined;
        period: 'until_week_end' | 'until_month_end';
      }
    > = {};

    objectives.forEach(objective => {
      objective.metrics.forEach(metric => {
        initialMetricPlans[metric.id] = {
          selected: metric.plan !== undefined,
          value: metric.plan,
          period:
            (metric.planPeriod as 'until_week_end' | 'until_month_end') ||
            'until_week_end',
        };
      });
    });

    setMetricPlans(initialMetricPlans);
    setPlansDialogOpen(true);
  };

  // Update the getPlanPeriodText function
  const getPlanPeriodText = (period: 'until_week_end' | 'until_month_end') => {
    switch (period) {
      case 'until_week_end':
        return 'Until week end';
      case 'until_month_end':
        return 'Until month end';
    }
  };

  // Update the handleMetricSelectionChange function
  const handleMetricSelectionChange = (metricId: string, selected: boolean) => {
    if (!selected) {
      // If deselecting, update the objectives to remove the plan for this metric
      const updatedObjectives = objectives.map(objective => {
        const updatedMetrics = objective.metrics.map(metric => {
          if (metric.id === metricId) {
            // Remove plan and planPeriod
            const { plan, planPeriod, ...rest } = metric;
            return rest;
          }
          return metric;
        });

        return {
          ...objective,
          metrics: updatedMetrics,
        };
      });

      // Update objectives through the parent component
      onObjectivesChange(updatedObjectives);
    }

    // Update the local state
    setMetricPlans(prev => ({
      ...prev,
      [metricId]: {
        ...prev[metricId],
        selected,
      },
    }));
  };

  // Update the handleMetricPeriodChange function
  const handleMetricPeriodChange = (
    metricId: string,
    period: 'until_week_end' | 'until_month_end'
  ) => {
    setMetricPlans(prev => ({
      ...prev,
      [metricId]: {
        ...prev[metricId],
        period,
      },
    }));
  };

  // Update the calculatePlanValueForPeriod function for more accurate calculations
  const calculatePlanValueForPeriod = (
    metric: Metric,
    viewPeriod: 'day' | 'week' | 'month'
  ) => {
    if (!metric.plan || !metric.planPeriod) return '-';

    // Constants for calculations
    const workDaysInMonth = 22; // Assumption for work days in a month
    const workDaysInWeek = 5; // Assumption for work days in a week

    // Get current date info for "until" calculations
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday

    // Calculate work days remaining in the week (Mon-Fri)
    let daysUntilWeekEnd = 0;
    if (currentDayOfWeek >= 1 && currentDayOfWeek <= 5) {
      // If today is a weekday (Mon-Fri), count days until Friday
      daysUntilWeekEnd = 6 - currentDayOfWeek; // 6 = Friday + 1
    } else if (currentDayOfWeek === 0) {
      // If today is Sunday, there are 5 work days left in the week
      daysUntilWeekEnd = 5;
    } else {
      // If today is Saturday, there are 5 work days in the next week
      daysUntilWeekEnd = 5;
    }

    // Calculate work days remaining in the month
    const currentDate = today.getDate();
    const lastDayOfMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    ).getDate();
    const totalDaysRemaining = lastDayOfMonth - currentDate;

    // Calculate work days remaining (excluding weekends)
    let workDaysUntilMonthEnd = 0;
    let tempDate = new Date(today);
    for (let i = 0; i <= totalDaysRemaining; i++) {
      tempDate.setDate(currentDate + i);
      const dayOfWeek = tempDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Not Sunday (0) or Saturday (6)
        workDaysUntilMonthEnd++;
      }
    }

    // Calculate daily value based on plan period
    let dailyValue: number;

    switch (metric.planPeriod) {
      case 'until_week_end':
        // If no work days left in week, return the full value
        if (daysUntilWeekEnd === 0) return metric.plan;
        dailyValue = metric.plan / daysUntilWeekEnd;
        break;
      case 'until_month_end':
        // If no work days left in month, return the full value
        if (workDaysUntilMonthEnd === 0) return metric.plan;
        dailyValue = metric.plan / workDaysUntilMonthEnd;
        break;
      default:
        return metric.plan;
    }

    // Convert daily value to requested period
    if (viewPeriod === 'day') {
      return dailyValue.toFixed(2);
    } else if (viewPeriod === 'week') {
      return (dailyValue * workDaysInWeek).toFixed(2);
    } else {
      // month
      return (dailyValue * workDaysInMonth).toFixed(2);
    }
  };

  // Add function to handle metric plan value change
  const handleMetricPlanValueChange = (metricId: string, value: string) => {
    setMetricPlans(prev => ({
      ...prev,
      [metricId]: {
        ...prev[metricId],
        value: value ? Number(value) : undefined,
      },
    }));
  };

  // Add function to save plans
  const handleSavePlans = () => {
    // Get selected metrics with their plans
    const selectedMetricPlans = Object.entries(metricPlans)
      .filter(([_, data]) => data.selected && data.value !== undefined)
      .map(([metricId, data]) => ({
        metricId,
        planValue: data.value as number,
        period: data.period,
      }));

    // Update objectives with the new plans
    const updatedObjectives = objectives.map(objective => {
      const updatedMetrics = objective.metrics.map(metric => {
        const metricPlan = selectedMetricPlans.find(
          plan => plan.metricId === metric.id
        );
        if (metricPlan) {
          return {
            ...metric,
            plan: metricPlan.planValue,
            planPeriod: metricPlan.period,
          };
        }
        return metric;
      });

      return {
        ...objective,
        metrics: updatedMetrics,
      };
    });

    // Update objectives through the parent component
    onObjectivesChange(updatedObjectives);

    // Close dialog
    setPlansDialogOpen(false);
  };

  // Update the getPlanPeriodDisplayName function to consider the current view
  const getPlanPeriodDisplayName = (period: string | undefined, viewPeriod: 'day' | 'week' | 'month') => {
    if (!period) return '';
    
    // Return the display name based on the current view, not the plan period
    switch (viewPeriod) {
      case 'day':
        return 'daily';
      case 'week':
        return 'weekly';
      case 'month':
        return 'monthly';
      default:
        return period;
    }
  };

  // Add function to edit objective name
  const openEditObjectiveDialog = (objective: Objective) => {
    setObjectiveName(objective.name);
    setObjectiveDescription(objective.description || '');
    setCurrentObjectiveId(objective.id);
    setIsEditing(true);
    setObjectiveDialogOpen(true);
  };

  // Add function to calculate daily plan value
  const calculateDailyPlanValue = (metric: Metric) => {
    if (!metric.plan || !metric.planPeriod) return '-';
    
    const workDaysInMonth = 22; // Assumption for work days in a month
    const workDaysInWeek = 5;   // Assumption for work days in a week
    
    if (metric.planPeriod === 'until_week_end') {
      return (metric.plan / workDaysInWeek).toFixed(2);
    } else if (metric.planPeriod === 'until_month_end') {
      return (metric.plan / workDaysInMonth).toFixed(2);
    }
    
    return metric.plan;
  };

  // Update the getAccumulatedActualValue function to fix report data accumulation
  const getAccumulatedActualValue = (metricId: string, viewPeriod: 'day' | 'week' | 'month') => {
    if (!reports || reports.length === 0) return null;
    
    const today = new Date();
    let startDate: Date;
    
    // Determine the start date based on view period
    if (viewPeriod === 'day') {
      // For day view, use today's date
      startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    } else if (viewPeriod === 'week') {
      // For week view, use the start of the current week
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Sunday
      startDate = new Date(today.getFullYear(), today.getMonth(), diff);
    } else {
      // For month view, use the start of the current month
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    }

    // Filter and accumulate reports
    const relevantReports = reports.filter(report => {
      const reportDate = new Date(report.date);
      return reportDate >= startDate && reportDate <= today;
    });

    if (relevantReports.length === 0) return null;

    // Accumulate actual values from relevant reports
    let accumulatedValue = 0;
    relevantReports.forEach(report => {
      if (report.metrics_data && report.metrics_data[metricId]) {
        const factValue = report.metrics_data[metricId].fact;
        if (typeof factValue === 'number') {
          accumulatedValue += factValue;
        }
      }
    });

    return accumulatedValue > 0 ? accumulatedValue : null;
  };

  return (
    <div>
      <div className='flex justify-between items-center mb-4'>
        <h3 className='text-lg font-semibold'>
          Objectives & Metrics Performance
        </h3>
        <div className='flex items-center gap-2'>
          <div className='flex border rounded-md overflow-hidden'>
            <Button
              variant={dateRange === 'day' ? 'default' : 'ghost'}
              size='sm'
              onClick={() => handleDateRangeChange('day')}
              className='rounded-none border-r'
            >
              Today
            </Button>
            <Button
              variant={dateRange === 'week' ? 'default' : 'ghost'}
              size='sm'
              onClick={() => handleDateRangeChange('week')}
              className='rounded-none border-r'
            >
              This Week
            </Button>
            <Button
              variant={dateRange === 'month' ? 'default' : 'ghost'}
              size='sm'
              onClick={() => handleDateRangeChange('month')}
              className='rounded-none'
            >
              This Month
            </Button>
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={openPlansDialog}
            className='flex items-center gap-1'
          >
            <Target className='h-4 w-4' />{' '}
            {hasAnyPlans() ? 'Change Plans' : 'Add Plans'}
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
            <TableHead className='text-center'>Deviation</TableHead>
            <TableHead className='text-center w-[150px]'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {objectives.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
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
                      <div className='flex-1 flex items-center'>
                        {objective.name}
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-6 w-6 p-0 ml-2'
                          onClick={() => openEditObjectiveDialog(objective)}
                        >
                          <Edit className='h-3.5 w-3.5' />
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{objective.description || '-'}</TableCell>
                  <TableCell className='text-right'>-</TableCell>
                  <TableCell className='text-right'>-</TableCell>
                  <TableCell className='text-center'>-</TableCell>
                  <TableCell>
                    <div className='flex gap-1 justify-center'>
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
                    const deviation = calculateDeviation(metric, dateRange);

                    return (
                      <TableRow key={metric.id}>
                        <TableCell>
                          <div className="pl-8">
                            <div className="flex items-center gap-2">
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                              <span className="flex items-center">
                                {metric.name}
                                <Button
                                  variant='ghost'
                                  size='sm'
                                  className='h-6 w-6 p-0 ml-1'
                                  onClick={() =>
                                    openEditMetricDialog(metric, objective.id)
                                  }
                                >
                                  <Edit className='h-3 w-3' />
                                </Button>
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{metric.description || '-'}</TableCell>
                        <TableCell className='text-right'>
                          {metric.plan !== undefined 
                            ? calculatePlanValueForPeriod(metric, dateRange) 
                            : '-'}
                          {metric.planPeriod && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({getPlanPeriodDisplayName(metric.planPeriod, dateRange)})
                            </span>
                          )}
                        </TableCell>
                        <TableCell className='text-right'>
                          {getAccumulatedActualValue(metric.id, dateRange) ?? 
                            (metric.actual !== undefined ? metric.actual : '-')}
                        </TableCell>
                        <TableCell className='text-center'>
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
                          <div className='flex gap-1 justify-center'>
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
            <DialogTitle>
              {hasAnyPlans() ? 'Manage Plans' : 'Create Plans'}
            </DialogTitle>
            <DialogDescription>
              Set or update plans for your metrics.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4 overflow-y-auto'>
            {/* Metrics Selection */}
            <div className='border rounded-md p-4 max-h-[400px] overflow-y-auto'>
              <h4 className='text-sm font-medium mb-2'>
                Select Metrics to Plan
              </h4>
              <div className='space-y-4'>
                {objectives.map(objective => (
                  <div key={objective.id} className='space-y-2'>
                    <div className='font-medium'>{objective.name}</div>
                    <div className='pl-4 space-y-2'>
                      {objective.metrics.map(metric => (
                        <div key={metric.id} className='space-y-2'>
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-2'>
                              <Checkbox
                                id={`metric-${metric.id}`}
                                checked={
                                  metricPlans[metric.id]?.selected || false
                                }
                                onCheckedChange={checked =>
                                  handleMetricSelectionChange(
                                    metric.id,
                                    checked === true
                                  )
                                }
                              />
                              <label
                                htmlFor={`metric-${metric.id}`}
                                className='text-sm'
                              >
                                {metric.name}
                              </label>
                            </div>
                          </div>

                          {metricPlans[metric.id]?.selected && (
                            <div className='pl-6 grid grid-cols-2 gap-4'>
                              <div>
                                <label className='text-xs text-muted-foreground mb-1 block'>
                                  Plan Value
                                </label>
                                <Input
                                  type='number'
                                  placeholder='Plan value'
                                  className='w-full'
                                  value={
                                    metricPlans[metric.id]?.value !== undefined
                                      ? metricPlans[metric.id].value
                                      : ''
                                  }
                                  onChange={e =>
                                    handleMetricPlanValueChange(
                                      metric.id,
                                      e.target.value
                                    )
                                  }
                                />
                              </div>
                              <div>
                                <label className='text-xs text-muted-foreground mb-1 block'>
                                  Period
                                </label>
                                <div className='flex gap-2'>
                                  <Button
                                    size='sm'
                                    variant={
                                      metricPlans[metric.id]?.period ===
                                      'until_week_end'
                                        ? 'default'
                                        : 'outline'
                                    }
                                    className='flex-1 text-xs'
                                    onClick={() =>
                                      handleMetricPeriodChange(
                                        metric.id,
                                        'until_week_end'
                                      )
                                    }
                                  >
                                    Weekly
                                  </Button>
                                  <Button
                                    size='sm'
                                    variant={
                                      metricPlans[metric.id]?.period ===
                                      'until_month_end'
                                        ? 'default'
                                        : 'outline'
                                    }
                                    className='flex-1 text-xs'
                                    onClick={() =>
                                      handleMetricPeriodChange(
                                        metric.id,
                                        'until_month_end'
                                      )
                                    }
                                  >
                                    Monthly
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
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
            <Button onClick={handleSavePlans}>Save Plans</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
