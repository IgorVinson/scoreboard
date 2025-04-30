'use client';
import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Objective, Metric, Plan } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import { 
  useCreateObjective, 
  useUpdateObjective, 
  useDeleteObjective,
  useCreateMetric,
  useUpdateMetric,
  useDeleteMetric,
  useMetricsByObjective,
  useMetrics,
  useCreatePlan,
  useUpdatePlan,
  useDeletePlan,
  usePlansByMetric,
  usePlansByUser
} from '@/queries';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  eachDayOfInterval,
} from 'date-fns';

import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/auth-context';
import { useQueryClient } from '@tanstack/react-query';

// Local extended interface for a simplified metric with UI specific properties
export interface UIMetric {
  id: string;
  name: string;
  description?: string;
  plan?: number;
  actual?: number;
  planPeriod?: 'until_week_end' | 'until_month_end';
  planId?: string; // Add planId to track database plan ID
}

// Extended type for UI objectives with metrics and expansion state
export interface UIObjective extends Objective {
  metrics: UIMetric[];
  isExpanded?: boolean;
}

interface DeepOverviewTableProps {
  objectives: UIObjective[];
  onObjectivesChange: (objectives: UIObjective[]) => void;
  reports?: any[]; // Add reports to props
}

export function DeepOverviewTable({
  objectives,
  onObjectivesChange,
  reports = [], // Default to empty array if not provided
}: DeepOverviewTableProps) {
  // Get access to the query client for manual cache invalidation
  const queryClient = useQueryClient();

  // Get the mutation hooks
  const createObjectiveMutation = useCreateObjective();
  const updateObjectiveMutation = useUpdateObjective();
  const deleteObjectiveMutation = useDeleteObjective();
  const createMetricMutation = useCreateMetric();
  const updateMetricMutation = useUpdateMetric();
  const deleteMetricMutation = useDeleteMetric();
  
  // Plan mutation hooks
  const createPlanMutation = useCreatePlan();
  const updatePlanMutation = useUpdatePlan();
  const deletePlanMutation = useDeletePlan();
  
  const { user } = useAuth();
  
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

  // Fetch all metrics to populate the objectives
  const { data: allMetrics, isLoading: isLoadingMetrics, refetch: refetchMetrics } = useMetrics();
  
  // Fetch plans for current user
  const { data: userPlans, isLoading: plansLoading } = usePlansByUser(user?.id || '');
  const plansEnabled = !!user;

  // Add this state to track optimistic loading without hiding the table
  const [optimisticLoading, setOptimisticLoading] = useState(false);
  // Track loading operations separately instead of a single boolean
  const [loadingOperations, setLoadingOperations] = useState<Record<string, boolean>>({});

  // Add loading tracker utility
  const trackLoading = useCallback((operationKey: string, isLoading: boolean) => {
    setLoadingOperations(prev => ({
      ...prev,
      [operationKey]: isLoading
    }));
  }, []);

  // Better loading indicator that doesn't block the UI
  const showLoadingIndicator = useCallback((operation: string, isLoading: boolean) => {
    // Don't show loading indicator immediately, use a small delay to prevent flickering
    if (isLoading) {
      const timeout = setTimeout(() => {
        trackLoading(operation, true);
      }, 300); // Small delay to prevent rapid flickering
      
      return () => clearTimeout(timeout);
    } else {
      trackLoading(operation, false);
      return () => {};
    }
  }, [trackLoading]);

  // Add this ref outside the useEffect hook
  const processedCacheRef = useRef<string | null>(null);

  // Modify the refreshData function to use our optimistic loading state
  const refreshData = useCallback(() => {
    console.log('Refreshing metrics data...');
    
    // Use operation-specific loading instead of global loading
    showLoadingIndicator('refreshing-metrics', true);
    
    // Force reset the cache completely by removing the metrics query data first
    queryClient.removeQueries({ queryKey: ['metrics'] });
    
    // Then refetch - this forces a complete reload from the server
    refetchMetrics().then(result => {
      console.log('Metrics refetch completed:', result.data?.length, 'metrics loaded');
      
      if (result.data) {
        // Also directly update the cache with the fresh data
        queryClient.setQueryData(['metrics', 'all'], result.data);
      }
      showLoadingIndicator('refreshing-metrics', false);
    }).catch(error => {
      console.error('Error refreshing metrics:', error);
      showLoadingIndicator('refreshing-metrics', false);
    });
  }, [refetchMetrics, queryClient, showLoadingIndicator]);

  // Effect to merge metrics from the database with local objectives
  useEffect(() => {
    // Skip if no metrics or still loading
    if (!allMetrics || isLoadingMetrics) {
      return;
    }
    
    console.log('Processing metrics from database:', allMetrics.length, 'metrics');
    
    // Create a map of metrics by objective_id for easier lookup
    const metricsByObjective: Record<string, UIMetric[]> = {};
    allMetrics.forEach(metric => {
      if (!metricsByObjective[metric.objective_id]) {
        metricsByObjective[metric.objective_id] = [];
      }
      
      // Convert DB metric to UI metric
      metricsByObjective[metric.objective_id].push({
        id: metric.id,
        name: metric.name,
        description: metric.description,
        plan: undefined, 
        actual: undefined,
        planPeriod: undefined
      });
    });
    
    // Update objectives with metrics from the database
    const updatedObjectives = objectives.map(obj => {
      // If we have metrics for this objective, use them
      if (metricsByObjective[obj.id]) {
        return {
          ...obj,
          metrics: metricsByObjective[obj.id]
        };
      }
      // Otherwise keep the existing metrics (if any)
      return obj;
    });
    
    // Only update if there's actually a change
    const currentMetricsCount = objectives.reduce(
      (count, obj) => count + obj.metrics.length, 
      0
    );
    
    const newMetricsCount = updatedObjectives.reduce(
      (count, obj) => count + obj.metrics.length, 
      0
    );
    
    console.log(`Current metrics: ${currentMetricsCount}, New metrics: ${newMetricsCount}`);
    
    if (currentMetricsCount !== newMetricsCount) {
      console.log('Updating objectives with new metrics data');
      onObjectivesChange(updatedObjectives);
    }
  }, [allMetrics, isLoadingMetrics, objectives, onObjectivesChange]);

  // Toggle objective expansion
  const toggleObjectiveExpansion = (objectiveId: string) => {
    const updatedObjectives = objectives.map(obj =>
      obj.id === objectiveId ? { ...obj, isExpanded: !obj.isExpanded } : obj
    );
    onObjectivesChange(updatedObjectives);
  };

  // Open dialog to edit a metric's plan and actual values
  const openEditMetricDialog = (metric: UIMetric, objectiveId: string) => {
    setMetricName(metric.name);
    setMetricDescription(metric.description || '');
    setCurrentMetricId(metric.id);
    setCurrentObjectiveId(objectiveId);
    setIsEditing(true);
    setMetricDialogOpen(true);
  };

  // Handle metric save
  const handleMetricSave = () => {
    if (!currentObjectiveId || !user) return;

    // Use operation-specific loading instead of global loading
    showLoadingIndicator('saving-metric', true);

    if (isEditing && currentMetricId) {
      // Update existing metric in database
      try {
        console.log('Updating metric in database:', {
          id: currentMetricId,
          name: metricName,
          description: metricDescription,
        });
        
        // Apply optimistic update immediately
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
        
        // Close dialog immediately after optimistic update for better UX
        setMetricDialogOpen(false);
        
        updateMetricMutation.mutate({
          id: currentMetricId,
          name: metricName,
          description: metricDescription,
        }, {
          onSuccess: (updatedMetric) => {
            console.log('Successfully updated metric in database:', updatedMetric);
            
            // Use batch updates for cache instead of separate invalidations
            queryClient.invalidateQueries({ 
              predicate: (query) => {
                return Boolean(query.queryKey[0] === 'metrics' || 
                       (query.queryKey[0] === 'plans' && user?.id && 
                        query.queryKey[1] === 'by-user' && query.queryKey[2] === user.id));
              }
            });
            
            // Turn off loading indicator
            showLoadingIndicator('saving-metric', false);
          },
          onError: (error) => {
            console.error('Error updating metric:', error);
            alert('Failed to update metric: ' + (error instanceof Error ? error.message : String(error)));
            showLoadingIndicator('saving-metric', false);
          }
        });
      } catch (error) {
        console.error('Error in metric update:', error);
        alert('An unexpected error occurred');
        showLoadingIndicator('saving-metric', false);
        setMetricDialogOpen(false);
      }
    } else {
      // Add new metric optimistically with a temporary ID
      const tempId = `temp-${Date.now()}`; 
      
      // Create a temporary metric for immediate UI update
      const newTempMetric = {
        id: tempId,
        name: metricName,
        description: metricDescription,
        plan: undefined,
        actual: undefined,
      };
      
      // Add it optimistically to the objective
      const updatedObjectives = objectives.map(obj => {
        if (obj.id === currentObjectiveId) {
          return {
            ...obj,
            metrics: [...obj.metrics, newTempMetric],
          };
        }
        return obj;
      });
      
      onObjectivesChange(updatedObjectives);
      
      // Close dialog immediately after optimistic update for better UX
      setMetricDialogOpen(false);
      
      try {
        console.log('Creating metric in database:', {
          name: metricName,
          description: metricDescription,
          objective_id: currentObjectiveId,
        });
        
        createMetricMutation.mutate({
          name: metricName,
          description: metricDescription,
          objective_id: currentObjectiveId,
          type: 'NUMERIC', // Default type
          measurement_unit: 'NUMBER', // Default measurement unit
        }, {
          onSuccess: (newMetric) => {
            console.log('Successfully created metric in database:', newMetric);
            
            // Immediately replace temp metric with the real one 
            const finalObjectives = objectives.map(obj => {
              if (obj.id === currentObjectiveId) {
                return {
                  ...obj,
                  metrics: obj.metrics.map(m => 
                    m.id === tempId 
                      ? {
                          id: newMetric.id,
                          name: newMetric.name,
                          description: newMetric.description,
                          plan: undefined,
                          actual: undefined,
                        }
                      : m
                  ),
                };
              }
              return obj;
            });
            
            // Update objectives with the real metric ID (one update instead of multiple)
            onObjectivesChange(finalObjectives);
            
            // Batch update for caches
            queryClient.invalidateQueries({ 
              predicate: (query) => {
                return Boolean(query.queryKey[0] === 'metrics' || 
                       (query.queryKey[0] === 'plans' && user?.id && 
                        query.queryKey[1] === 'by-user' && query.queryKey[2] === user.id));
              }
            });
            
            // Turn off loading indicator
            showLoadingIndicator('saving-metric', false);
          },
          onError: (error) => {
            console.error('Error creating metric:', error);
            alert('Failed to create metric: ' + (error instanceof Error ? error.message : String(error)));
            
            // Remove the temporary metric on error
            const fallbackObjectives = objectives.map(obj => {
              if (obj.id === currentObjectiveId) {
                return {
                  ...obj,
                  metrics: obj.metrics.filter(m => m.id !== tempId),
                };
              }
              return obj;
            });
            
            onObjectivesChange(fallbackObjectives);
            showLoadingIndicator('saving-metric', false);
          }
        });
      } catch (error) {
        console.error('Error in metric creation:', error);
        alert('An unexpected error occurred');
        
        // Remove the temporary metric on error
        const fallbackObjectives = objectives.map(obj => {
          if (obj.id === currentObjectiveId) {
            return {
              ...obj,
              metrics: obj.metrics.filter(m => m.id !== tempId),
            };
          }
          return obj;
        });
        
        onObjectivesChange(fallbackObjectives);
        showLoadingIndicator('saving-metric', false);
      }
    }
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
  const handleConfirmedDelete = async () => {
    if (!itemToDelete) return;

    let updatedObjectives = [...objectives];

    if (itemToDelete.type === 'objective') {
      // Get all metrics for this objective
      const objectiveToDelete = objectives.find(obj => obj.id === itemToDelete.objectiveId);
      if (!objectiveToDelete) {
        setDeleteConfirmOpen(false);
        setItemToDelete(null);
        return;
      }

      // Use operation-specific loading
      showLoadingIndicator('deleting-objective', true);
      
      // Apply optimistic update to UI immediately
      updatedObjectives = updatedObjectives.filter(
        obj => obj.id !== itemToDelete.objectiveId
      );
      
      // Update state through parent component before async operations
      onObjectivesChange(updatedObjectives);
      
      // Close the confirmation dialog immediately
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
      
      try {
        // First delete all metrics associated with this objective
        const metricIds = objectiveToDelete.metrics.map(metric => metric.id);
        
        // Delete metrics one by one
        for (const metricId of metricIds) {
          await deleteMetricMutation.mutateAsync(metricId);
        }
        
        // Then delete the objective
        await deleteObjectiveMutation.mutateAsync(itemToDelete.objectiveId);
        
        console.log('Successfully deleted objective and its metrics from database');
        
        // Force refresh of plans data to ensure UI is in sync with database
        if (user?.id) {
          queryClient.invalidateQueries({ 
            queryKey: ['plans', 'by-user', user.id]
          });
        } else {
          queryClient.invalidateQueries({ queryKey: ['plans'] });
        }
        // Reset the cache ref to force a reload of plans
        processedCacheRef.current = null;
      } catch (error) {
        console.error('Error deleting objective or its metrics:', error);
        alert('Failed to delete: ' + (error instanceof Error ? error.message : String(error)));
        
        // On error, restore the deleted objective by refetching all metrics
        refreshData();
      } finally {
        showLoadingIndicator('deleting-objective', false);
      }
    } else if (itemToDelete.type === 'metric' && itemToDelete.metricId) {
      // Use operation-specific loading
      showLoadingIndicator('deleting-metric', true);
      
      // Apply optimistic update to UI immediately
      updatedObjectives = updatedObjectives.map(obj => {
        if (obj.id === itemToDelete.objectiveId) {
          return {
            ...obj,
            metrics: obj.metrics.filter(m => m.id !== itemToDelete.metricId),
          };
        }
        return obj;
      });
      
      // Update state through parent component before async operations
      onObjectivesChange(updatedObjectives);
      
      // Close the confirmation dialog immediately
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
      
      // Find any associated plans to delete them properly
      const metricToDelete = itemToDelete.metricId;
      const metricPlans = userPlans?.filter(plan => plan.metric_id === metricToDelete) || [];
      
      try {
        // First delete any associated plans
        if (metricPlans.length > 0) {
          console.log(`Found ${metricPlans.length} plans for metric ${metricToDelete}, deleting them first`);
          
          // Delete plans one by one to ensure they're all removed
          for (const plan of metricPlans) {
            await deletePlanMutation.mutateAsync(plan.id);
          }
        }
        
        // Then delete the metric
        await deleteMetricMutation.mutateAsync(metricToDelete);
        
        console.log('Successfully deleted metric and its plans from database');
        
        // Force refresh of plans data to ensure UI is in sync with database
        if (user?.id) {
          queryClient.invalidateQueries({ 
            queryKey: ['plans', 'by-user', user.id]
          });
        } else {
          queryClient.invalidateQueries({ queryKey: ['plans'] });
        }
        // Reset the cache ref to force a reload of plans
        processedCacheRef.current = null;
      } catch (error) {
        console.error('Error deleting metric or its plans:', error);
        alert('Failed to delete: ' + (error instanceof Error ? error.message : String(error)));
        
        // On error, restore the deleted metric by refetching all metrics
        refreshData();
      } finally {
        showLoadingIndicator('deleting-metric', false);
      }
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

  // Calculate deviation
  const calculateDeviation = (
    metric: UIMetric,
    viewPeriod: 'day' | 'week' | 'month'
  ) => {
    const accumulatedActual = getAccumulatedActualValue(metric.id, viewPeriod);
    const actualValue =
      accumulatedActual !== null ? accumulatedActual : metric.actual;

    if (
      metric.plan === undefined ||
      actualValue === undefined ||
      !metric.planPeriod
    )
      return null;
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
      } else if (currentDayOfWeek === 0) {
        // Sunday
        daysPassed = 0;
        totalDays = 5;
      } else {
        // Saturday
        daysPassed = 5;
        totalDays = 5;
      }
    } else if (metric.planPeriod === 'until_month_end') {
      // For month: calculate workdays passed and total workdays
      const currentDate = today.getDate();
      const lastDayOfMonth = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0
      ).getDate();

      // Count workdays passed
      for (let i = 1; i <= currentDate; i++) {
        const tempDate = new Date(today.getFullYear(), today.getMonth(), i);
        const dayOfWeek = tempDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          // Not Sunday (0) or Saturday (6)
          daysPassed++;
        }
      }

      // Count total workdays in month
      for (let i = 1; i <= lastDayOfMonth; i++) {
        const tempDate = new Date(today.getFullYear(), today.getMonth(), i);
        const dayOfWeek = tempDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          // Not Sunday (0) or Saturday (6)
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
    const projectedFinalValue = dailyAverage * daysRemaining + actualValue;

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
  const openAddMetricDialog = (objectiveId: string) => {
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
    if (objectiveName.trim() === '' || !user) return;

    try {
      if (isEditing && currentObjectiveId) {
        // Update existing objective
        console.log('Updating objective in database:', {
          id: currentObjectiveId,
          name: objectiveName,
          description: objectiveDescription,
        });
        
        updateObjectiveMutation.mutate({
          id: currentObjectiveId,
          name: objectiveName,
          description: objectiveDescription,
        }, {
          onSuccess: (updatedObjective) => {
            console.log('Successfully updated objective in database:', updatedObjective);
            
            // Update the objective in local state
            const updatedObjectives = objectives.map(obj =>
              obj.id === currentObjectiveId
                ? { ...obj, name: objectiveName, description: objectiveDescription }
                : obj
            );
            
            onObjectivesChange(updatedObjectives);
          },
          onError: (error) => {
            console.error('Error updating objective:', error);
            alert('Failed to update objective: ' + (error instanceof Error ? error.message : String(error)));
          }
        });
      } else {
        // Create new objective
        console.log('Creating objective in database:', {
          name: objectiveName,
          description: objectiveDescription,
        });
        
        createObjectiveMutation.mutate({
          name: objectiveName,
          description: objectiveDescription,
          user_id: user.id
        }, {
          onSuccess: (newObjective) => {
            console.log('Successfully created objective in database:', newObjective);
            
            // Add new objective to local state as well
            const newObjectiveLocal: UIObjective = {
              ...newObjective,
              metrics: [], // Add the metrics property
              isExpanded: true
            };
            
            onObjectivesChange([...objectives, newObjectiveLocal]);
          },
          onError: (error) => {
            console.error('Error creating objective:', error);
            alert('Failed to create objective: ' + (error instanceof Error ? error.message : String(error)));
          }
        });
      }
    } catch (error) {
      console.error('Error in objective operation:', error);
      alert('An unexpected error occurred');
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
  const filterObjectivesByDate = (objectives: UIObjective[]) => {
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
        planId?: string;
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
    // Ensure we have the latest plan data by forcing a refresh
    forceReloadPlans();
    
    // Set a brief delay to allow the reload to complete
    setTimeout(() => {
      // Initialize metric plans with all metrics and their existing plans
      const initialMetricPlans: Record<
        string,
        {
          selected: boolean;
          value: number | undefined;
          period: 'until_week_end' | 'until_month_end';
          planId?: string;
        }
      > = {};
  
      // Gather current metrics and their plans
      console.log('Opening plans dialog - metrics count:', 
        objectives.reduce((count, obj) => count + obj.metrics.length, 0));
      
      objectives.forEach(objective => {
        objective.metrics.forEach(metric => {
          initialMetricPlans[metric.id] = {
            selected: metric.plan !== undefined,
            value: metric.plan,
            period:
              (metric.planPeriod as 'until_week_end' | 'until_month_end') ||
              'until_week_end',
            planId: metric.planId,
          };
          
          // Debug
          console.log(`Metric in dialog: ${metric.name} (${metric.id}) - has plan: ${metric.plan !== undefined}`);
        });
      });
  
      setMetricPlans(initialMetricPlans);
      setPlansDialogOpen(true);
    }, 300); // Small delay to ensure data is fresh
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

  // Update the handleMetricSelectionChange function to handle database deletion
  const handleMetricSelectionChange = (metricId: string, selected: boolean) => {
    const currentPlanState = metricPlans[metricId];
    
    // Update the local dialog state immediately
    setMetricPlans(prev => ({
      ...prev,
      [metricId]: {
        ...prev[metricId],
        selected,
        // Don't clear value/period here, let the DB operation handle it
      },
    }));
    
    if (!selected && currentPlanState?.planId) {
      // If deselecting a metric with an existing plan in the database, delete it
      showLoadingIndicator('deleting-plan', true);
      
      deletePlanMutation.mutate(currentPlanState.planId, {
        onSuccess: () => {
          console.log('Successfully deleted plan from database');
          
          // Update the local objectives state to remove plan details
          const updatedObjectives = objectives.map(objective => {
            const updatedMetrics = objective.metrics.map(metric => {
              if (metric.id === metricId) {
                // Remove plan, planPeriod, and planId
                const { plan, planPeriod, planId, ...rest } = metric;
                return { ...rest, plan: undefined, planPeriod: undefined, planId: undefined };
              }
              return metric;
            });

            return { ...objective, metrics: updatedMetrics };
          });

          // Update objectives through the parent component
          onObjectivesChange(updatedObjectives);

          // Also update the dialog state to clear value/period after successful DB delete
          setMetricPlans(prev => ({
            ...prev,
            [metricId]: {
              ...prev[metricId],
              value: undefined,
              period: 'until_week_end', // Reset period to default
              planId: undefined,
            },
          }));
          
          showLoadingIndicator('deleting-plan', false);
        },
        onError: (error: unknown) => {
          console.error('Error deleting plan:', error);
          alert('Failed to delete plan: ' + (error instanceof Error ? error.message : String(error)));
          // Revert dialog state if deletion failed
          setMetricPlans(prev => ({
            ...prev,
            [metricId]: currentPlanState, // Revert to previous state
          }));
          showLoadingIndicator('deleting-plan', false);
        }
      });
    }
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

  // Add a function to calculate plan value for different periods
  const calculatePlanValueForPeriod = (
    metric: UIMetric,
    viewPeriod: 'day' | 'week' | 'month'
  ) => {
    if (!metric.plan || !metric.planPeriod) return metric.plan;

    const workDaysInMonth = 22; // Assumption for work days in a month
    const workDaysInWeek = 5; // Assumption for work days in a week

    // If the metric is already in the right period, return as is
    if (
      (metric.planPeriod === 'until_week_end' && viewPeriod === 'week') ||
      (metric.planPeriod === 'until_month_end' && viewPeriod === 'month')
    ) {
      return metric.plan;
    }

    // Convert to daily value first
    let dailyValue: number;
    if (metric.planPeriod === 'until_week_end') {
      dailyValue = metric.plan / workDaysInWeek;
    } else if (metric.planPeriod === 'until_month_end') {
      dailyValue = metric.plan / workDaysInMonth;
    } else {
      dailyValue = metric.plan; // Already daily
    }

    // Then convert to the requested period
    if (viewPeriod === 'day') {
      return dailyValue;
    } else if (viewPeriod === 'week') {
      return dailyValue * workDaysInWeek;
    } else if (viewPeriod === 'month') {
      return dailyValue * workDaysInMonth;
    }

    return metric.plan; // Fallback
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
  const handleSavePlans = async () => {
    if (!user) {
      alert('You need to be logged in to save plans');
      return;
    }

    // Use operation-specific loading
    showLoadingIndicator('saving-plans', true);

    // Get selected metrics with their plans
    const selectedMetricPlans = Object.entries(metricPlans)
      .filter(([metricId, data]) => {
        // Skip if not selected or no value
        if (!data.selected || data.value === undefined) return false;
        
        // Verify this metric still exists in the objectives
        let metricExists = false;
        for (const objective of objectives) {
          if (objective.metrics.some(m => m.id === metricId)) {
            metricExists = true;
            break;
          }
        }
        
        if (!metricExists) {
          console.log(`Skipping plan for metric ${metricId} as it no longer exists`);
        }
        
        return metricExists;
      })
      .map(([metricId, data]) => {
        // Find the metric name for better logging
        let metricName = "unknown";
        for (const objective of objectives) {
          const metric = objective.metrics.find(m => m.id === metricId);
          if (metric) {
            metricName = metric.name;
            break;
          }
        }
        
        console.log(`Setting plan for metric "${metricName}": value=${data.value}, period=${data.period}`);
        
        return {
          metricId,
          metricName,
          planValue: data.value as number,
          period: data.period,
          planId: data.planId, // Track existing plan ID for updates
        };
      });

    // Check if any plans were skipped
    const skippedCount = Object.entries(metricPlans)
      .filter(([_, data]) => data.selected && data.value !== undefined).length - selectedMetricPlans.length;
    
    if (skippedCount > 0) {
      console.log(`Skipped ${skippedCount} plans for metrics that no longer exist`);
    }

    if (selectedMetricPlans.length === 0) {
      setPlansDialogOpen(false);
      alert('No valid metrics selected for planning');
      return;
    }

    // Apply optimistic updates immediately
    const planUpdatesForState: Record<string, Partial<UIMetric>> = {};
    for (const plan of selectedMetricPlans) {
      planUpdatesForState[plan.metricId] = {
        plan: plan.planValue,
        planPeriod: plan.period,
        planId: plan.planId || `temp-${Date.now()}-${plan.metricId}`, // Generate a temp ID if none exists
      };
    }
    
    // Update objectives with optimistic values
    const updatedObjectives = objectives.map(objective => {
      const updatedMetrics = objective.metrics.map(metric => {
        if (planUpdatesForState[metric.id]) {
          return { ...metric, ...planUpdatesForState[metric.id] };
        }
        return metric;
      });
      return { ...objective, metrics: updatedMetrics };
    });
    
    // Close dialog immediately after optimistic update
    setPlansDialogOpen(false);
    
    // Update objectives through the parent component
    onObjectivesChange(updatedObjectives);

    // Track promises for all database operations
    const dbOperations: Promise<Plan | void>[] = [];

    // Get current date for start_date
    const today = new Date().toISOString().split('T')[0]; // Format as YYYY-MM-DD
    
    // Calculate end date based on period
    const getEndDate = (period: 'until_week_end' | 'until_month_end') => {
      const now = new Date();
      console.log(`Calculating end date for period: ${period}`);
      
      if (period === 'until_week_end') {
        // End of current week (Friday)
        const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
        const daysUntilFriday = dayOfWeek <= 5 ? 5 - dayOfWeek : (5 + 7 - dayOfWeek); // Ensure Friday of current week
        const friday = new Date(now);
        friday.setDate(now.getDate() + daysUntilFriday);
        const fridayStr = friday.toISOString().split('T')[0];
        console.log(`Week end date: ${fridayStr} (${daysUntilFriday} days from now, ${friday.toDateString()})`);
        return fridayStr;
      } else {
        // End of current month
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const lastDayStr = lastDay.toISOString().split('T')[0];
        console.log(`Month end date: ${lastDayStr} (day ${lastDay.getDate()} of month, ${lastDay.toDateString()})`);
        return lastDayStr;
      }
    };

    try {
      // Create or update plans in the database
      for (const plan of selectedMetricPlans) {
        if (plan.planId) {
          // Update existing plan
          const updatePromise = updatePlanMutation.mutateAsync({
            id: plan.planId,
            target_value: plan.planValue,
            start_date: today, // Optionally update start date, or keep existing
            end_date: getEndDate(plan.period),
            status: 'ACTIVE', // Assuming plan becomes active on save
          });
          dbOperations.push(updatePromise);
        } else {
          // Create new plan
          const createPromise = createPlanMutation.mutateAsync({
            metric_id: plan.metricId,
            target_value: plan.planValue,
            user_id: user.id,
            start_date: today,
            end_date: getEndDate(plan.period),
            status: 'ACTIVE',
          });
          dbOperations.push(createPromise);
        }
      }

      // Wait for all database operations to complete
      await Promise.all(dbOperations);
      console.log('All plan operations completed successfully');
      
      // Batch update the cache instead of multiple invalidations
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          return Boolean(query.queryKey[0] === 'plans' || query.queryKey[0] === 'metrics');
        }
      });
    } catch (error) {
      console.error('Error saving plans:', error);
      alert('Failed to save plans: ' + (error instanceof Error ? error.message : String(error)));
      
      // Force refresh to get correct state from database
      refreshData();
    } finally {
      showLoadingIndicator('saving-plans', false);
    }
  };

  // Update the getPlanPeriodDisplayName function to consider the current view
  const getPlanPeriodDisplayName = (
    period: string | undefined,
    viewPeriod: 'day' | 'week' | 'month'
  ) => {
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
  const calculateDailyPlanValue = (metric: UIMetric) => {
    if (!metric.plan || !metric.planPeriod) return '-';

    const workDaysInMonth = 22; // Standard assumption for work days in a month
    const workDaysInWeek = 5; // Standard working days in a week

    if (metric.planPeriod === 'until_week_end') {
      return (metric.plan / workDaysInWeek).toFixed(2);
    } else if (metric.planPeriod === 'until_month_end') {
      return (metric.plan / workDaysInMonth).toFixed(2);
    }

    return String(metric.plan);
  };

  // Fix the getAccumulatedActualValue function to properly handle date comparisons
  const getAccumulatedActualValue = (
    metricId: string,
    viewPeriod: 'day' | 'week' | 'month'
  ) => {
    if (!reports || reports.length === 0) return null;

    // Get today's date without time component
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    // Determine the start date based on view period
    if (viewPeriod === 'day') {
      // For day view, just use today
      // startDate is already today
    } else if (viewPeriod === 'week') {
      // For week view, get Monday of current week
      const dayOfWeek = today.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust for Sunday (0)
      startDate.setDate(today.getDate() - diff);
    } else if (viewPeriod === 'month') {
      // For month view, use the start of the current month
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    }

    // Filter reports within the date range
    const relevantReports = reports.filter(report => {
      // Parse the report date string to a Date object
      // Ensure consistent date format parsing - use YYYY-MM-DD format
      const dateParts = report.date.split('-');
      if (dateParts.length !== 3) return false;
      
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed
      const day = parseInt(dateParts[2], 10);
      
      // Create the date using the parsed components to avoid timezone issues
      const reportDate = new Date(year, month, day);
      reportDate.setHours(0, 0, 0, 0);

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

  // Use effect to initialize metric plans with data from database when userPlans changes
  useEffect(() => {
    console.log('Plans useEffect triggered - userPlans:', userPlans?.length);
    
    // Skip if no objectives
    if (objectives.length === 0) {
      console.log('No objectives, skipping plans processing');
      return;
    }

    // Skip if plans are still loading and we haven't determined if they're defined yet
    if (plansLoading) {
      console.log('Plans still loading, will process later');
      return;
    }
    
    console.log('Processing plans with userPlans:', userPlans);
    
    // Even if userPlans is empty or undefined, we should still process to reset plans
    const validPlans = userPlans || [];
    
    // First, collect all metric IDs from objectives to know what metrics still exist
    const existingMetricIds = new Set<string>();
    objectives.forEach(obj => {
      obj.metrics.forEach(metric => {
        existingMetricIds.add(metric.id);
      });
    });
    
    console.log('All metrics that currently exist:', Array.from(existingMetricIds));
    
    // Create a map of plan data by metric ID for quick lookup
    const plansByMetricId = new Map<string, Plan>();
    validPlans.forEach(plan => {
      // Only include plans for metrics that exist
      if (existingMetricIds.has(plan.metric_id)) {
        plansByMetricId.set(plan.metric_id, plan);
      } else {
        console.log(`Plan ${plan.id} references non-existent metric ${plan.metric_id}`);
      }
    });
    
    console.log('Processing plans for', plansByMetricId.size, 'metrics');
    
    // Now update all objectives and their metrics with the latest plan data
    const updatedObjectives = objectives.map(objective => {
      const updatedMetrics = objective.metrics.map(metric => {
        const plan = plansByMetricId.get(metric.id);
        
        if (plan) {
          console.log(`Applying plan to metric ${metric.name} (${metric.id}):`, plan);
          
          // Determine the period based on end_date
          let period: 'until_week_end' | 'until_month_end' = 'until_week_end';
          try {
            const endDate = new Date(plan.end_date);
            const endOfMonth = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
            
            // Debug logs for date comparison
            console.log(`Plan ${plan.id} end date: ${plan.end_date}`);
            console.log(`End date: ${endDate.toISOString()}`);
            console.log(`End of month: ${endOfMonth.toISOString()}`);
            console.log(`End date day: ${endDate.getDate()}, End of month day: ${endOfMonth.getDate()}`);
            
            // Check if the date is within the last 3 days of the month
            // This makes the check more robust for cases where the exact last day might vary
            const daysFromEndOfMonth = endOfMonth.getDate() - endDate.getDate();
            const isEndOfMonth = daysFromEndOfMonth <= 2; // Within 2 days of month end
            console.log(`Days from end of month: ${daysFromEndOfMonth}, Is end of month?: ${isEndOfMonth}`);
            
            if (isEndOfMonth) {
              period = 'until_month_end';
            }
            
            console.log(`Determined period for metric ${metric.name}: ${period}`);
          } catch (e) {
            console.error('Error parsing plan date:', e);
          }
          
          // Return metric with plan data
          return {
            ...metric,
            plan: plan.target_value,
            planPeriod: period,
            planId: plan.id,
          };
        } else {
          // Clear any plan data if no plan exists for this metric
          return {
            ...metric,
            plan: undefined,
            planPeriod: undefined,
            planId: undefined,
          };
        }
      });
      
      return {
        ...objective,
        metrics: updatedMetrics,
      };
    });
    
    // Only update if something actually changed
    const hasChanges = JSON.stringify(updatedObjectives) !== JSON.stringify(objectives);
    if (hasChanges) {
      console.log('Plan data changed, updating objectives');
      onObjectivesChange(updatedObjectives);
    } else {
      console.log('No changes to plan data');
    }
    
  // We depend on metrics loading state and several key events that should trigger a reprocessing of plans
  // The refetchMetrics function reference will change when metrics are refetched
  }, [userPlans, objectives, onObjectivesChange, plansLoading, refetchMetrics]);

  // Add function to force reload plans
  const forceReloadPlans = useCallback(() => {
    console.log('Forcing reload of plans data...');
    
    // Use operation-specific loading instead of global loading
    showLoadingIndicator('reloading-plans', true);
    
    // Use batched cache invalidation
    queryClient.invalidateQueries({ 
      predicate: (query) => {
        return Boolean(query.queryKey[0] === 'metrics' || 
               query.queryKey[0] === 'plans');
      }
    });
    
    // Then directly trigger refetch of critical queries
    refetchMetrics().then(() => {
      console.log('Plans data reloaded');
      setTimeout(() => showLoadingIndicator('reloading-plans', false), 300);
    }).catch(error => {
      console.error('Error reloading plans:', error);
      showLoadingIndicator('reloading-plans', false);
    });
  }, [queryClient, refetchMetrics, showLoadingIndicator]);

  // Add loading indicator for plans
  if (plansLoading && !isLoadingMetrics && !optimisticLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <p>Loading plans...</p>
      </div>
    );
  }

  // Compute a single loading state from all operations
  const isAnyOperationLoading = Object.values(loadingOperations).some(Boolean);

  return (
    <div>
      <div className='flex justify-between items-center mb-4 overflow-auto'>
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
            disabled={isAnyOperationLoading}
          >
            <PlusCircle className='h-4 w-4' /> Add Objective
          </Button>
        </div>
      </div>

      <div className="relative">
        {isAnyOperationLoading && (
          <div className="absolute top-2 right-2 z-10 flex items-center gap-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
            <Loader2 className="h-3 w-3 animate-spin" />
            Updating data...
          </div>
        )}
        
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
            {isLoadingMetrics && !optimisticLoading && objectives.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className='text-center py-4 text-muted-foreground'
                >
                  Loading metrics from database...
                </TableCell>
              </TableRow>
            ) : objectives.length === 0 ? (
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
                <React.Fragment key={objective.id}>
                  <TableRow
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
                      const deviation = calculateDeviation(metric as UIMetric, dateRange);

                      return (
                        <TableRow key={metric.id}>
                          <TableCell>
                            <div className='pl-8'>
                              <div className='flex items-center gap-2'>
                                <ArrowRight className='h-3 w-3 text-muted-foreground' />
                                <span className='flex items-center'>
                                  {metric.name}
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    className='h-6 w-6 p-0 ml-1'
                                    onClick={() =>
                                      openEditMetricDialog(metric as UIMetric, objective.id)
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
                              ? (() => {
                                  // Calculate the appropriate value based on the view period
                                  if (dateRange === 'day') {
                                    // For daily view, show daily value based on plan period
                                    return (
                                      <>
                                        {calculateDailyPlanValue(metric)}
                                        <span className='text-xs text-muted-foreground ml-1'>
                                          (daily)
                                        </span>
                                      </>
                                    );
                                  } else if (dateRange === 'week') {
                                    // For weekly view
                                    if (metric.planPeriod === 'until_week_end') {
                                      // If it's a weekly plan, show as is
                                      return (
                                        <>
                                          {metric.plan.toFixed(2)}
                                          <span className='text-xs text-muted-foreground ml-1'>
                                            (weekly plan)
                                          </span>
                                        </>
                                      );
                                    } else if (metric.planPeriod === 'until_month_end') {
                                      // If it's a monthly plan, convert to weekly (monthly / (22/5))
                                      return (
                                        <>
                                          {((metric.plan * 5) / 22).toFixed(2)}
                                          <span className='text-xs text-muted-foreground ml-1'>
                                            (from {metric.plan.toFixed(2)} monthly)
                                          </span>
                                        </>
                                      );
                                    }
                                  } else if (dateRange === 'month') {
                                    // For monthly view
                                    if (metric.planPeriod === 'until_week_end') {
                                      // If it's a weekly plan, convert to monthly (weekly * (22/5))
                                      return (
                                        <>
                                          {((metric.plan * 22) / 5).toFixed(2)}
                                          <span className='text-xs text-muted-foreground ml-1'>
                                            (from {metric.plan.toFixed(2)} weekly)
                                          </span>
                                        </>
                                      );
                                    } else if (metric.planPeriod === 'until_month_end') {
                                      // If it's a monthly plan, show as is
                                      return (
                                        <>
                                          {metric.plan.toFixed(2)}
                                          <span className='text-xs text-muted-foreground ml-1'>
                                            (monthly plan)
                                          </span>
                                        </>
                                      );
                                    }
                                  }
                                  // Default to original plan value
                                  return metric.plan.toFixed(2);
                                })()
                              : '-'}
                          </TableCell>
                          <TableCell className='text-right'>
                            {(() => {
                              const accumulatedValue = getAccumulatedActualValue(
                                metric.id,
                                dateRange
                              );
                              return accumulatedValue !== null
                                ? accumulatedValue
                                : '-';
                            })()}
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
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
                                checked={metricPlans[metric.id]?.selected || false}
                                onCheckedChange={(checked) => 
                                  handleMetricSelectionChange(
                                    metric.id, 
                                    checked === true
                                  )
                                }
                              />
                              <span className='flex items-center'>
                                {metric.name}
                              </span>
                            </div>
                          </div>
                          
                          {metricPlans[metric.id]?.selected && (
                            <div className='pl-6 space-y-2'>
                              <div className='flex items-center gap-4'>
                                <div className='flex-1'>
                                  <label className='text-xs text-muted-foreground mb-1 block'>
                                    Plan Value
                                  </label>
                                  <Input
                                    type='number'
                                    placeholder='Enter value'
                                    value={metricPlans[metric.id]?.value !== undefined ? metricPlans[metric.id].value : ''}
                                    onChange={(e) => handleMetricPlanValueChange(metric.id, e.target.value)}
                                    className='w-full'
                                  />
                                </div>
                                
                                <div className='flex-1'>
                                  <label className='text-xs text-muted-foreground mb-1 block'>
                                    Period
                                  </label>
                                  <div className='flex gap-1'>
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
                                      Weekly (5d)
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
                                      Monthly (22d)
                                    </Button>
                                  </div>
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
            <Button
              variant='outline'
              onClick={() => setPlansDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSavePlans}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}