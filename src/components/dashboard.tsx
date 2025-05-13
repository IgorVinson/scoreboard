import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  BarChart3,
  ClipboardList,
  Sun,
  Moon,
  Monitor,
  LogOut,
  ChevronDown,
  ChevronRight,
  Star,
  PlusCircle,
  Calendar as CalendarIcon,
  Loader2,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/auth-context';
import { NotesEditor } from '@/components/NotesEditor';
import { DeepOverviewTable } from '@/components/DeepOverviewTable';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ReportsTable } from '@/components/ReportsTable';
import { SimpleOverview } from '@/components/SimpleOverview';
import { format, parseISO } from 'date-fns';
import {
  useObjectivesByUser,
  useMetrics,
  useUpdateDailyNote,
  useCreateDailyNote,
  useLatestDailyNote,
} from '@/queries';
import { 
  useDailyReportsByUser,
  useCreateDailyReport,
  useUpdateDailyReport,
  useDeleteDailyReport,
} from '@/queries';
import type { UIObjective } from '@/components/DeepOverviewTable';
import type { DailyReport, DailyNote } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from '@/lib/supabase';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { ResultReportManager } from '@/components/result-report/MetricCalculator';
import { useToast } from "@/components/ui/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Report as ReportTableType } from '@/components/ReportsTable';

// Extend the DailyReport type to include the 'reviewed' field for our app's usage
interface ExtendedDailyReport extends Omit<DailyReport, 'id' | 'created_at' | 'updated_at'> {
  reviewed?: boolean;
}

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
}

interface Report {
  id: string;
  date: string;
  metrics_data: Record<string, { plan: number; fact: number }>;
  today_notes: string;
  tomorrow_notes: string;
  general_comments: string;
  user_id: string;
  created_at: string;
  updated_at?: string; // Add updated_at property
  reviewed?: boolean;
  // Additional fields for result reports
  type?: 'weekly' | 'monthly' | 'result';
  start_date?: string;
  end_date?: string;
  summary?: string;
  next_goals?: string;
  comments?: string;
  metrics_summary?: Record<string, { plan: number; fact: number }>;
  rating?: number;
  feedback?: string;
  // Review-related properties
  quantity_rating?: number;
  quality_rating?: number;
}

interface Metric {
  id: string;
  name: string;
  plan?: number;
  planPeriod?: string;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, onRatingChange }) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className='flex space-x-2'>
      {[...Array(5)].map((_, i) => {
        const starValue = i + 1;
        return (
          <button
            key={i}
            type='button'
            className='focus:outline-none p-2 touch-manipulation'
            onClick={() => onRatingChange(starValue)}
            onMouseEnter={() => setHoverRating(starValue)}
            onMouseLeave={() => setHoverRating(0)}
            aria-label={`Rate ${starValue} out of 5 stars`}
          >
            <Star
              className={`h-7 w-7 sm:h-6 sm:w-6 ${
                (hoverRating || rating) >= starValue
                  ? 'text-amber-500 fill-amber-500'
                  : 'text-gray-300'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};

export function Dashboard() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Add state for delete confirmation dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);
  
  const { data: metrics = [] } = useMetrics();

  const deleteDailyReportMutation = useDeleteDailyReport();
  
  // TanStack Query hooks for daily reports
  const { data: userReports = [] } = useDailyReportsByUser(user?.id || '');
  const createDailyReportMutation = useCreateDailyReport();
  const updateDailyReportMutation = useUpdateDailyReport();
  
  // TanStack Query hooks for daily notes
  const { data: latestNote, isLoading: isLoadingLatestNote } = useLatestDailyNote(user?.id || '');
  const updateDailyNoteMutation = useUpdateDailyNote();
  const createDailyNoteMutation = useCreateDailyNote();
  
  const [objectives, setObjectives] = useState<UIObjective[]>([]);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportDate, setReportDate] = useState(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [metricValues, setMetricValues] = useState<Record<string, number>>({});

  // Add the daily notes states here
  const [todayNotes, setTodayNotes] = useState('');
  const [tomorrowNotes, setTomorrowNotes] = useState('');
  const [generalComments, setGeneralComments] = useState('');
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);

  // Add Report Notes states
  const [reportTodayNotes, setReportTodayNotes] = useState('');
  const [reportTomorrowNotes, setReportTomorrowNotes] = useState('');
  const [reportGeneralComments, setReportGeneralComments] = useState('');

  // Add debounce state
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedContent, setLastSavedContent] = useState({
    todayNotes: '',
    tomorrowNotes: '',
    generalComments: ''
  });

  // Handle note changes
  const handleTodayNotesChange = (html: string) => {
    setTodayNotes(html);
  };

  const handleTomorrowNotesChange = (html: string) => {
    setTomorrowNotes(html);
  };

  const handleGeneralCommentsChange = (html: string) => {
    setGeneralComments(html);
  };

  // Load daily notes from TanStack Query
  useEffect(() => {
    if (latestNote && !isLoadingLatestNote) {
      const note = latestNote as DailyReport;
      setTodayNotes(note.today_notes || '');
      setTomorrowNotes(note.tomorrow_notes || '');
      setGeneralComments(note.general_comments || '');
      setCurrentNoteId(note.id);
      setIsLoadingNotes(false);
    } else if (!isLoadingLatestNote) {
      setIsLoadingNotes(false);
    }
  }, [latestNote, isLoadingLatestNote]);

  // Save notes with TanStack Query mutations
  useEffect(() => {
    if (!user?.id) return;

    // Check if content has actually changed
    const contentChanged = 
      todayNotes !== lastSavedContent.todayNotes ||
      tomorrowNotes !== lastSavedContent.tomorrowNotes ||
      generalComments !== lastSavedContent.generalComments;

    if (!contentChanged || isSaving) return;

    const timeoutId = setTimeout(async () => {
      try {
        setIsSaving(true);
        console.log('Saving notes...', {
          todayNotes,
          tomorrowNotes,
          generalComments,
          currentNoteId,
          userId: user?.id
        });

        const noteData = {
          user_id: user.id,
          today_notes: todayNotes,
          tomorrow_notes: tomorrowNotes,
          general_comments: generalComments,
          date: new Date().toISOString().split('T')[0]
        };

        console.log('Saving note data:', noteData);

        if (currentNoteId) {
          console.log('Updating existing note:', currentNoteId);
          const result = await updateDailyNoteMutation.mutateAsync({
            id: currentNoteId,
            ...noteData
          });
          console.log('Update result:', result);
          setLastSavedContent({
            todayNotes,
            tomorrowNotes,
            generalComments
          });
          toast({
            title: "Success",
            description: "Notes updated successfully",
          });
        } else {
          console.log('Creating new note');
          const result = await createDailyNoteMutation.mutateAsync(noteData);
          console.log('Create result:', result);
          setCurrentNoteId(result.id);
          setLastSavedContent({
            todayNotes,
            tomorrowNotes,
            generalComments
          });
          toast({
            title: "Success",
            description: "Notes created successfully",
          });
        }

        // Invalidate queries to ensure fresh data
        queryClient.invalidateQueries({ queryKey: ['dailyNotes'] });
        queryClient.invalidateQueries({ queryKey: ['dailyNotesByUser', user.id] });
        queryClient.invalidateQueries({ queryKey: ['latestDailyNote', user.id] });
      } catch (error) {
        console.error('Error saving notes:', error);
        toast({
          title: "Error",
          description: "Failed to save notes",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    }, 2500);

    return () => clearTimeout(timeoutId);
  }, [todayNotes, tomorrowNotes, generalComments, currentNoteId, user?.id, queryClient, toast, updateDailyNoteMutation, createDailyNoteMutation, isSaving, lastSavedContent]);

  const { data: objectivesFromDB } = useObjectivesByUser(user?.id || '');
  
  useEffect(() => {
  }, [objectivesFromDB]);
  
  useEffect(() => {
    const loadObjectives = async () => {
      try {
        // If we have objectives from TanStack Query, use those
        if (objectivesFromDB && objectivesFromDB.length > 0) {
          // Format objectives for the component
          const formattedObjectives = objectivesFromDB.map(obj => ({
            id: obj.id,
            name: obj.name,
            description: obj.description || '',
            metrics: [], // Start with empty metrics array
            isExpanded: false,
            user_id: obj.user_id,
            created_at: obj.created_at,
            updated_at: obj.updated_at
          }));
          
          setObjectives(formattedObjectives);
          return;
        }
      } catch (error) {
        console.error('Error loading objectives:', error);
      }
    };
    
    loadObjectives();
  }, [objectivesFromDB]);

  // Report related state - these were accidentally removed in the previous edit
  const [editingReport, setEditingReport] = useState<any>(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [reportQuantityRating, setReportQuantityRating] = useState(0);
  const [reportQualityRating, setReportQualityRating] = useState(0);
  const [resultReportType, setResultReportType] = useState<'weekly' | 'monthly'>('weekly');
  const [resultReportStartDate, setResultReportStartDate] = useState('');
  const [resultReportEndDate, setResultReportEndDate] = useState('');
  const [resultReportSummary, setResultReportSummary] = useState('');
  const [resultReportNextGoals, setResultReportNextGoals] = useState('');
  const [resultReportComments, setResultReportComments] = useState('');
  const [resultReportMetrics, setResultReportMetrics] = useState<Record<string, { plan: number; fact: number }>>({});
  const [resultReports, setResultReports] = useState<Report[]>([
    {
      "id": "de5a751c-0daf-4540-874d-7b3282e5a4d2",
      "user_id": "39007684-055b-47e0-9ca9-fd373626f2f6",
      "date": "2025-04-21",
      "metrics_data": {
          "ac93c5b9-9499-474e-adda-a7b632556b07": {
              "fact": 10,
              "plan": 12
          },
          "c80b1f6f-a09d-4cb6-be1b-867a54daf1c6": {
              "fact": 3,
              "plan": 0
          }
      },
      "today_notes": "<p>sdfsf</p><p>sdfsdfsd</p><p>adasdsa</p>",
      "tomorrow_notes": "<p>dadsddertret</p>",
      "general_comments": "<p>sfff</p>",
      "created_at": "2025-04-19T04:43:20.015166+00:00",
      "updated_at": "2025-04-19T05:31:32.682129+00:00"
  }
  ]);
  const [editingResultReport, setEditingResultReport] = useState<any>(null);
  const [createResultReportMode, setCreateResultReportMode] = useState(false);
  
  // Helper functions
  const calculateDailyPlanValue = (metric: any) => {
    if (!metric.plan) return '0';
    
    const planValue = metric.plan;
    
    // Use standard work day values for consistent calculations
    const workDaysInMonth = 22; // Standard work days in a month
    const workDaysInWeek = 5;   // Standard work days in a week
    
    // Calculate daily value based on plan period
    if (metric.planPeriod === 'until_week_end') {
      // Weekly plan: divide by work days in a week
      return String(Math.round(planValue / workDaysInWeek));
    } else if (metric.planPeriod === 'until_month_end') {
      // Monthly plan: divide by work days in a month
      return String(Math.round(planValue / workDaysInMonth));
    }
    
    // If no period specified, return as is
    return String(Math.round(planValue));
  };

  
  // Add alert dialog state
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertDialogTitle, setAlertDialogTitle] = useState('Alert');

  // Open report dialog and copy current notes to report fields
  const handleOpenReport = () => {
    // Set the reportDate to today's date initially
    setReportDate(format(new Date(), 'yyyy-MM-dd'));
    
    // Copy the current notes to the report fields
    setReportTodayNotes(todayNotes);
    setReportTomorrowNotes(tomorrowNotes);
    setReportGeneralComments(generalComments);
    
    // Check if we already have objectives for the report
    if (objectives && objectives.length > 0) {
      // Format objectives with isExpanded property for the report dialog
      const formattedReportObjectives = objectives.map(obj => ({
        ...obj,
        isExpanded: false // Initially collapse all objectives
      }));
      setReportObjectives(formattedReportObjectives);
    }
    
    // Reset metric values
    setMetricValues({});
    setEditingReport(null);
    
    // Open the dialog
    setReportDialogOpen(true);
  };
  
  // Check if a report exists for the selected date before creating
  const checkReportExists = async (date: string) => {
    try {
      if (!user?.id) return false;
      
      const { data } = await supabase
        .from('daily_reports')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', date)
        .single();
      
      return !!data;
    } catch (error) {
      return false;
    }
  };
  
  // Handle date change in the report dialog
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setReportDate(newDate);
    
    // Check if we're editing an existing report for this date
    if (editingReport && editingReport.date === newDate) {
      return;
    }
    
    // Check if a report already exists for the selected date
    checkReportExists(newDate).then(exists => {
      if (exists) {
        // Show a toast notification instead of an alert
        setAlertMessage("You can create only one report per day. Please use the Daily Reports tab if you want to view or edit it.");
        setAlertDialogOpen(true);
      }
    });
  };
  
  // Create a new daily report using TanStack Query
  const handleCreateReport = async () => {
    try {
      if (!user?.id) return;
      
      // Check if a report already exists for this date
      const exists = await checkReportExists(reportDate);
      
      if (exists) {
        // Show alert dialog with message
        setAlertDialogTitle("Report Already Exists");
        setAlertMessage("You can create only one report per day. Please use the Daily Reports tab if you want to edit an existing report.");
        setAlertDialogOpen(true);
        return;
      }
      
      // Prepare metrics data
      const metricsData: Record<string, { plan: number; fact: number }> = {};
      
      // For each metric with a value entered, add an entry
      Object.entries(metricValues).forEach(([metricId, factValue]) => {
        // Find the metric in objectives to get its plan value
        let planValue = 0;
        let metric: Metric | undefined;
        
        // Find the metric object to access both plan and planPeriod
        objectives.forEach(obj => {
          const foundMetric = obj.metrics.find(m => m.id === metricId);
          if (foundMetric && foundMetric.plan !== undefined) {
            metric = foundMetric;
          }
        });
        
        if (metric && metric.plan !== undefined) {
          // Use the daily plan value based on the plan period
          if (metric.planPeriod === 'until_week_end') {
            // Weekly plan: calculate daily value
            planValue = Math.round(metric.plan / 5); // 5 working days per week
          } else if (metric.planPeriod === 'until_month_end') {
            // Monthly plan: calculate daily value
            planValue = Math.round(metric.plan / 22); // 22 working days per month
          } else {
            // No specific period, use as is
            planValue = Math.round(metric.plan);
          }
        }
        
        metricsData[metricId] = {
          plan: planValue,
          fact: factValue
        };
      });
      
      // Create the report data for application logic
      const reportData: ExtendedDailyReport = {
        date: reportDate,
        user_id: user.id,
        metrics_data: metricsData,
        today_notes: reportTodayNotes,
        tomorrow_notes: reportTomorrowNotes,
        general_comments: reportGeneralComments,
        reviewed: false
      };
      
      // Remove the 'reviewed' field before sending to database
      const { reviewed, ...dbReportData } = reportData;
      
      // Create the report in the database
      await createDailyReportMutation.mutateAsync(dbReportData);
      
      setReportDialogOpen(false);
      
      // Show success alert with consistent date formatting
      setAlertDialogTitle("Success");
      // Fix: Use a consistent approach to display the date without timezone issues
      const formattedDate = format(new Date(`${reportDate}T12:00:00`), 'MMMM d, yyyy');
      setAlertMessage(`Daily report for ${formattedDate} has been created successfully.`);
      setAlertDialogOpen(true);
    } catch (error) {
      console.error('Error creating report:', error);
      
      // Show error alert
      setAlertDialogTitle("Error");
      setAlertMessage("Failed to create report. Please try again.");
      setAlertDialogOpen(true);
    }
  };
  
  // Update an existing daily report
  const handleUpdateReport = async () => {
    try {
      if (!editingReport || !user?.id) return;
      
      // Prepare metrics data
      const metricsData: Record<string, { plan: number; fact: number }> = {};
      
      // For each metric with a value entered, add an entry
      Object.entries(metricValues).forEach(([metricId, factValue]) => {
        // Find the metric in objectives to get its plan value
        let planValue = 0;
        let metric: Metric | undefined;
        
        // Find the metric object to access both plan and planPeriod
        objectives.forEach(obj => {
          const foundMetric = obj.metrics.find(m => m.id === metricId);
          if (foundMetric && foundMetric.plan !== undefined) {
            metric = foundMetric;
          }
        });
        
        if (metric && metric.plan !== undefined) {
          // Use the daily plan value based on the plan period
          if (metric.planPeriod === 'until_week_end') {
            // Weekly plan: calculate daily value
            planValue = Math.round(metric.plan / 5); // 5 working days per week
          } else if (metric.planPeriod === 'until_month_end') {
            // Monthly plan: calculate daily value
            planValue = Math.round(metric.plan / 22); // 22 working days per month
          } else {
            // No specific period, use as is
            planValue = Math.round(metric.plan);
          }
        }
        
        metricsData[metricId] = {
          plan: planValue,
          fact: factValue
        };
      });
      
      // Create the report update data without 'reviewed' field
      const reportData = {
        id: editingReport.id,
        metrics_data: metricsData,
        today_notes: reportTodayNotes,
        tomorrow_notes: reportTomorrowNotes,
        general_comments: reportGeneralComments
      };
      
      // Update the report
      await updateDailyReportMutation.mutateAsync(reportData);
      
      setReportDialogOpen(false);
      setEditingReport(null);
    } catch (error) {
      console.error('Error updating report:', error);
    }
  };
  
  // Delete a daily report with confirmation
  const handleDeleteReport = async (reportId: string) => {
    setReportToDelete(reportId);
    setDeleteConfirmOpen(true);
  };
  
  // Confirm and execute report deletion
  const confirmDeleteReport = async () => {
    try {
      if (!reportToDelete) {
        setDeleteConfirmOpen(false);
        return;
      }
      
      // Determine if we're deleting a daily report or result report
      // Use a more reliable way to check if it's a result report
      const isResultReport = resultReports.some(r => r.id === reportToDelete);
      
      if (isResultReport) {
        // Delete from result_reports table
        const { error } = await supabase
          .from('result_reports')
          .delete()
          .eq('id', reportToDelete);
          
        if (error) {
          toast({
            title: "Error",
            description: `Failed to delete result report: ${error.message}`,
            variant: "destructive"
          });
          console.error("Error deleting result report:", error);
          setDeleteConfirmOpen(false);
          return;
        }
        
        // Update local state immediately
        setResultReports(prevReports => 
          prevReports.filter(r => r.id !== reportToDelete)
        );
        
        setProcessedResultReports(prevReports => 
          prevReports.filter(r => r.id !== reportToDelete)
        );
        
        // Refresh result reports data
        queryClient.invalidateQueries({ queryKey: ['result_reports'] });
        
        toast({
          title: "Success",
          description: "Result report deleted successfully"
        });
      } else {
        // Delete from daily_reports table
        await deleteDailyReportMutation.mutateAsync(reportToDelete);
        toast({
          title: "Success", 
          description: "Report deleted successfully"
        });
      }
      
      // Reset state
      setReportToDelete(null);
      setDeleteConfirmOpen(false);
      
    } catch (error) {
      console.error("Error confirming report deletion:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred during deletion",
        variant: "destructive"
      });
      setDeleteConfirmOpen(false);
    }
  };

  // When showing user-specific data, use the data from TanStack Query



  // Add missing handler functions
  const handleObjectivesChange = (updatedObjectives: UIObjective[]) => {
    setObjectives(updatedObjectives);
  };
  
  // Add reportObjectives state and toggle function
  const [reportObjectives, setReportObjectives] = useState<UIObjective[]>([]);
  
  const toggleReportObjectiveExpansion = (objectiveId: string) => {
    setReportObjectives(prevObjs =>
      prevObjs.map(obj => {
        if (obj.id === objectiveId) {
          return {
            ...obj,
            isExpanded: !obj.isExpanded,
          };
        }
        return obj;
      })
    );
  };
  
  // Add the missing strictModeEnabled state
  const [strictModeEnabled] = useState(false);
  const [resultReportDialogOpen, setResultReportDialogOpen] = useState(false);
  const [missingSurveyOpen, setMissingSurveyOpen] = useState(false);
  const [missingDates] = useState<string[]>([]);
  const [currentMissingIndex] = useState(0);

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      // Auth context will handle the redirect to login
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Add missing handler functions
  const handleEditReport = (report: ReportTableType) => {
    // Set the report being edited
    setEditingReport(report);
    
    // Set the report date
    setReportDate(report.date || '');
    
    // Copy the notes from the report
    setReportTodayNotes(report.today_notes || '');
    setReportTomorrowNotes(report.tomorrow_notes || '');
    setReportGeneralComments(report.general_comments || '');
    
    // Set the metric values from the report's metrics_data
    const values: Record<string, number> = {};
    if (report.metrics_data) {
      Object.entries(report.metrics_data).forEach(([metricId, data]) => {
        if (data && data.fact !== undefined) {
          values[metricId] = data.fact;
        }
      });
    }
    setMetricValues(values);
    
    // Format objectives for the report dialog
    if (objectives && objectives.length > 0) {
      // Format objectives with isExpanded property for the report dialog
      const formattedReportObjectives = objectives.map(obj => ({
        ...obj,
        isExpanded: true // Initially expand all objectives for editing
      }));
      setReportObjectives(formattedReportObjectives);
    }
    
    // Open the dialog
    setReportDialogOpen(true);
  };
  

  
  const handleToggleReview = async (report: ReportTableType) => {
    try {
      // Get the report ID
      const reportId = report.id;
      
      // Type assertion to include the reviewed property
      const reportWithReview = report as ReportTableType & { reviewed?: boolean };
      
      // Toggle the reviewed status
      const updatedReport = {
        id: reportId,
        reviewed: !reportWithReview.reviewed
      };
      
      // Update the report
      await updateDailyReportMutation.mutateAsync(updatedReport);
      
      // Show success message
      setAlertDialogTitle("Success");
      setAlertMessage(`Report ${reportWithReview.reviewed ? 'unmarked' : 'marked'} as reviewed`);
      setAlertDialogOpen(true);
    } catch (error) {
      console.error('Error toggling review status:', error);
      
      // Show error message
      setAlertDialogTitle("Error");
      setAlertMessage("Failed to update review status. Please try again.");
      setAlertDialogOpen(true);
    }
  };
  
  const handleSubmitReview = async () => {
    try {
      if (!editingReport) return;
      
      // Create the review data
      const reviewData = {
        id: editingReport.id,
        reviewed: true,
        quantity_rating: reportQuantityRating,
        quality_rating: reportQualityRating
      };
      
      // Update the report with review data
      await updateDailyReportMutation.mutateAsync(reviewData);
      
      // Show success message
      setAlertDialogTitle("Success");
      setAlertMessage("Review submitted successfully");
      setAlertDialogOpen(true);
      
      // Close the dialog and reset state
      setReportDialogOpen(false);
      setEditingReport(null);
      setReviewMode(false);
    } catch (error) {
      console.error('Error submitting review:', error);
      
      // Show error message
      setAlertDialogTitle("Error");
      setAlertMessage("Failed to submit review. Please try again.");
      setAlertDialogOpen(true);
    }
  };
  
  const handleNextMissingReport = () => {
    console.log('Next missing report');
  };
  
  const handleEditResultReport = (report: ReportTableType) => {
    setEditingReport(report);
    if (report.type === 'result') {
      // For result reports, populate form data with result report values
      setResultReportDialogOpen(true);
    }
  };
  
  const handleToggleResultReview = async (report: ReportTableType) => {
    try {
      const reportId = report.id;
      
      // Toggle the reviewed status
      const { error } = await supabase
        .from('result_reports')
        .update({ reviewed: !report.reviewed })
        .eq('id', reportId)
        .select();

      if (error) {
        console.error('Error toggling result report review:', error);
        toast({
          title: 'Error',
          description: 'Could not update review status',
          variant: 'destructive',
        });
        return;
      }

      // Update local state
      setResultReports(resultReports.map(r => 
        r.id === reportId ? { ...r, reviewed: !r.reviewed } : r
      ));

      toast({
        title: 'Success',
        description: 'Review status updated',
      });
    } catch (error) {
      console.error('Error in handleToggleResultReview:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };
  
  const generateResultReport = async () => {
    try {
      
      // Build a list of missing fields for better error messaging
      const missingFields = [];
      if (!resultReportType) missingFields.push("Report Type");
      if (!resultReportStartDate) missingFields.push("Start Date");
      if (!resultReportEndDate) missingFields.push("End Date");
      if (!resultReportSummary) missingFields.push("Period Summary");
      
      // Validation with improved error message
      if (missingFields.length > 0) {
        console.error("Missing required fields for result report:", missingFields);
        setAlertDialogTitle("Incomplete Report");
        setAlertMessage(`Please fill in all required fields: ${missingFields.join(", ")}`);
        setAlertDialogOpen(true);
        return;
      }
      
      if (!user?.id) {
        setAlertDialogTitle("Authentication Error");
        setAlertMessage("You must be logged in to generate a report");
        setAlertDialogOpen(true);
        return;
      }

      // Validate date range
      const startDate = new Date(resultReportStartDate);
      const endDate = new Date(resultReportEndDate);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        setAlertDialogTitle("Invalid Date Format");
        setAlertMessage("Please enter valid dates in the format YYYY-MM-DD");
        setAlertDialogOpen(true);
        return;
      }
      
      if (startDate > endDate) {
        setAlertDialogTitle("Invalid Date Range");
        setAlertMessage("End date must be after or equal to start date");
        setAlertDialogOpen(true);
        return;
      }
      
      // Check for maximum allowed date range
      const maxAllowedDays = resultReportType === 'weekly' ? 7 : 31; // 1 week for weekly, 1 month for monthly
      const dayDifference = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dayDifference > maxAllowedDays) {
        setAlertDialogTitle("Date Range Too Large");
        setAlertMessage(`The maximum date range for a ${resultReportType} report is ${maxAllowedDays} days. Your selected range is ${dayDifference} days.`);
        setAlertDialogOpen(true);
        return;
      }
      
      // Check if metrics data is available with better error message
      if (!resultReportMetrics || Object.keys(resultReportMetrics).length === 0) {
        console.error("No metrics data available for the result report");
        setAlertDialogTitle("Missing Metrics Data");
        setAlertMessage("Please ensure metrics data has been calculated. Make sure your date range includes days with reports.");
        setAlertDialogOpen(true);
        return;
      }
      
      // Check if the metrics data size is too large
      // This prevents potential issues with database limits
      const metricsCount = Object.keys(resultReportMetrics).length;
      if (metricsCount > 100) { // Set a reasonable limit
        setAlertDialogTitle("Too Many Metrics");
        setAlertMessage(`Your report contains ${metricsCount} metrics, which exceeds our system limits. Please use a smaller date range or fewer metrics.`);
        setAlertDialogOpen(true);
        return;
      }
      
      // Validate metrics data structure
      try {
        // JSON.stringify will throw an error if the structure is too complex or circular
        const metricsString = JSON.stringify(resultReportMetrics);
        if (metricsString.length > 500000) { // Check if the data is too large (500KB)
          setAlertDialogTitle("Data Size Limit Exceeded");
          setAlertMessage("Your metrics data is too large. Please use a smaller date range or fewer metrics.");
          setAlertDialogOpen(true);
          return;
        }
      } catch (e) {
        console.error("Invalid metrics data structure:", e);
        setAlertDialogTitle("Invalid Metrics Data");
        setAlertMessage("There's an issue with your metrics data structure. Please try again with a different date range.");
        setAlertDialogOpen(true);
        return;
      }
      
      // Format date range for display
      const dateRange = resultReportStartDate === resultReportEndDate 
        ? resultReportStartDate 
        : `${resultReportStartDate} - ${resultReportEndDate}`;
      
      // Prepare report data
      const resultReportData = {
        user_id: user.id,
        type: resultReportType,
        start_date: resultReportStartDate,
        end_date: resultReportEndDate,
        summary: resultReportSummary,
        next_goals: resultReportNextGoals,
        comments: resultReportComments,
        metrics_summary: resultReportMetrics,
        reviewed: false
      };

      // Insert the result report into the database
      const { data, error } = await supabase
        .from('result_reports')
        .insert(resultReportData)
        .select();

      if (error) {
        console.error("Error generating result report:", error);
        
        // Handle specific database constraints
        if (error.code === '23514' && error.message.includes('valid_date_range')) {
          setAlertDialogTitle("Invalid Date Range");
          setAlertMessage("The database rejected this date range. Please try a different range that follows your organization's guidelines.");
        } else {
          setAlertDialogTitle("Report Creation Failed");
          setAlertMessage(`Error: ${error.message}. Please try again or contact support.`);
        }
        
        setAlertDialogOpen(true);
        return;
      }

      // Update local state immediately
      if (data && data.length > 0) {
        const newReport = data[0];
        // Add to result reports
        setResultReports(prevReports => [newReport, ...prevReports]);
        
        // Process and add to processed reports for display
        const dateDisplay = newReport.start_date === newReport.end_date 
          ? newReport.start_date 
          : `${newReport.start_date} - ${newReport.end_date}`;
        
        const processedReport = {
          ...newReport,
          date: dateDisplay,
          display_date: dateDisplay,
          metrics_data: newReport.metrics_summary || {},
          today_notes: newReport.summary || '',
          tomorrow_notes: newReport.next_goals || '',
          general_comments: newReport.comments || '',
          is_result_report: true
        };
        
        setProcessedResultReports(prevReports => [processedReport, ...prevReports]);
      }

      // Enhanced success message with report details
      const reportPeriod = resultReportType.charAt(0).toUpperCase() + resultReportType.slice(1);
      setAlertDialogTitle("Report Created Successfully");
      setAlertMessage(`Your ${reportPeriod} report for ${dateRange} has been saved. You can view it in the Result Reports tab.`);
      setAlertDialogOpen(true);
      
      // Properly invalidate the query cache
      queryClient.invalidateQueries({ queryKey: ['result_reports'] });

      // Only reset state and close dialog on success
      setResultReportDialogOpen(false);
      resetResultReportState();
      
      // Return success status for the button handler
      return true;
    } catch (error) {
      console.error("Error in generateResultReport:", error);
      setAlertDialogTitle("Unexpected Error");
      setAlertMessage("Something went wrong while generating your report. Please try again or contact support.");
      setAlertDialogOpen(true);
      
      // Return failure status
      return false;
    }
  };
  
  const resetResultReportState = () => {
    setEditingResultReport(null);
    setResultReportType('weekly');
    setResultReportStartDate('');
    setResultReportEndDate('');
    setResultReportSummary('');
    setResultReportNextGoals('');
    setResultReportComments('');
    setResultReportMetrics({});
    setShowMetricsSection(false);
  };

  const submitResultReportReview = () => {
    setResultReportDialogOpen(false);
  };

  // Add some display of the metrics data to confirm it's working
  useEffect(() => {
  }, [metrics]);

  // Fix the handler for metric value changes in both dialog boxes to handle empty values correctly
  const handleMetricValueChange = (metricId: string, value: string) => {
    const newValue = value ? parseFloat(value) : 0;
    setMetricValues({
      ...metricValues,
      [metricId]: newValue,
    });
  };

  // Add new state for metrics section visibility
  const [showMetricsSection, setShowMetricsSection] = useState(false);
  
  // Auto-show metrics section when both dates are selected
  useEffect(() => {
    if (resultReportStartDate && resultReportEndDate) {
      setShowMetricsSection(true);
    }
  }, [resultReportStartDate, resultReportEndDate]);

  // Add a new useEffect or function to prepare result reports for display

  // Add this right after the declaration of resultReports state
  const [processedResultReports, setProcessedResultReports] = useState<any[]>([]);

  // Add this useEffect to process result reports when they change
  useEffect(() => {
    if (resultReports && resultReports.length > 0) {
      // Transform result reports to match the format expected by ReportsTable
      const processed = resultReports.map(report => {
        // Get the report object safely
        const typedReport = report as any;
        
        // Store the original ISO dates for the table to parse
        const startDate = typedReport.start_date || '';
        const endDate = typedReport.end_date || '';
        
        // Format the compact date display (MM.DD.YY format)
        const formatDateCompact = (dateStr: string) => {
          if (!dateStr) return '';
          try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return 'Invalid date';
            return date.toLocaleDateString('en-US', {
              month: '2-digit',
              day: '2-digit',
              year: '2-digit'
            }).replace(/\//g, '.');
          } catch (error) {
            console.error("Error formatting date:", error);
            return 'Invalid date';
          }
        };
        
        // Create formatted date strings for display
        const startFormatted = formatDateCompact(startDate);
        const endFormatted = formatDateCompact(endDate);
        
        // Get report type with capitalization
        const reportType = typedReport.type 
          ? typedReport.type.charAt(0).toUpperCase() + typedReport.type.slice(1) 
          : 'Report';
        
        // Create the display string
        const displayDate = startDate === endDate
          ? `${startFormatted} (${reportType})`
          : `${startFormatted}-${endFormatted} (${reportType})`;
        
        return {
          ...typedReport,
          // Store both the original dates (for parsing) and the display format
          date: startDate, // Keep the original ISO date for parsing
          start_date: startDate,
          end_date: endDate,
          // Add display fields
          display_date: displayDate,
          report_type: reportType,
          // Add formatted fields for table rendering
          metrics_data: typedReport.metrics_summary || {},
          today_notes: typedReport.summary || '',
          tomorrow_notes: typedReport.next_goals || '',
          general_comments: typedReport.comments || '',
          is_result_report: true
        };
      });
      
      setProcessedResultReports(processed);
    } else {
      setProcessedResultReports([]);
    }
  }, [resultReports]);

  // And update the ReportsTable component call in the result-reports tab
  // ... existing code ...

  // And update the fetchResultReports function or where you load result reports
  const loadResultReports = async () => {
    try {
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .from('result_reports')  // Make sure we're using the right table
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        toast({
          title: "Error",
          description: `Failed to load result reports: ${error.message}`,
          variant: "destructive"
        });
        throw error;
      }
      
      if (data) {
        setResultReports(data);
      }
    } catch (error) {
      console.error('Error loading result reports:', error);
    }
  };

  // Call this function when the component mounts or when needed
  useEffect(() => {
    if (user?.id) {
      loadResultReports();
    }
  }, [user]);

  // And update the handleDeleteResultReport function
  const handleDeleteResultReport = async (reportId: string) => {
    try {
      if (!reportId) return;
      
      // Set the report to delete in the confirmation dialog
      setReportToDelete(reportId);
      setDeleteConfirmOpen(true);
      
      // Note: The actual deletion will happen in confirmDeleteReport
    } catch (error) {
      console.error("Error preparing to delete result report:", error);
      toast({
        title: "Error",
        description: "Failed to prepare report deletion",
        variant: "destructive"
      });
    }
  };

  // Call this function when the component mounts or when needed
  useEffect(() => {
    if (user?.id) {
      loadResultReports();
      
      // Add event listener to refresh data when tab gets focus
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          loadResultReports();
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [user]);
  
  // Track active tabs
  const [activeTab, setActiveTab] = useState('deep-overview');
  
  // State for popover controls
  const [startDatePopoverOpen, setStartDatePopoverOpen] = useState(false);
  const [endDatePopoverOpen, setEndDatePopoverOpen] = useState(false);
  
  // Function to reset popover state when dialog closes
  useEffect(() => {
    if (!resultReportDialogOpen) {
      setStartDatePopoverOpen(false);
      setEndDatePopoverOpen(false);
    }
  }, [resultReportDialogOpen]);
  
  // Refresh reports when switching to the result-reports tab
  useEffect(() => {
    if (activeTab === 'result-reports' && user?.id) {
      loadResultReports();
    }
  }, [activeTab, user?.id]);

  // Define mobile-optimized scrollable container styles as utility classes
  const scrollableContainerStyles = 'overflow-x-auto pb-2 -mx-2 px-2 overscroll-none overflow-y-hidden touch-pan-x scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent';
  
  // Get objectives from Supabase
  const { data: objectivesData } = useQuery({
    queryKey: ['objectives'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('objectives')
        .select('id, name, metrics:metrics(id, name)')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // Data considered fresh for 5 minutes
  });

  // Define query for result reports
  const {
    isLoading: isLoadingResultReport,
    refetch: refetchResultReport
  } = useQuery({
    queryKey: ['resultReport', resultReportStartDate, resultReportEndDate],
    queryFn: async () => {
      if (!resultReportStartDate || !resultReportEndDate) {
        return null;
      }
      
      // Prevent querying if we're actively creating a new report
      if (createResultReportMode) {
        return null;
      }
      
      const { data, error } = await supabase
        .from('result_reports')
        .select('*')
        .eq('user_id', user?.id)
        .eq('start_date', resultReportStartDate)
        .eq('end_date', resultReportEndDate)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!resultReportStartDate && !!resultReportEndDate && !!user?.id && !createResultReportMode,
    staleTime: 2 * 60 * 1000, // Consider fresh for 2 minutes
  });

  // Extract date range handling to a dedicated function
  const handleDateRangeChange = useCallback((startDate: string | null, endDate: string | null) => {
    // Reset states when date range changes
    setEditingResultReport(null);
    setCreateResultReportMode(false);
    
    if (startDate) {
      setResultReportStartDate(startDate);
    }
    
    if (endDate) {
      setResultReportEndDate(endDate);
    }
    
    // Reset popover states to ensure they can be reopened
    setStartDatePopoverOpen(false);
    setEndDatePopoverOpen(false);
    
    // If both dates are valid, trigger a prefetch
    if (startDate && endDate) {
      // After a small delay to ensure UI is responsive, prefetch data
      setTimeout(() => {
        refetchResultReport();
      }, 100);
    }
  }, [refetchResultReport]);

  // Validate date range for result reports
  const validateDateRange = useCallback((startDateStr: string, endDateStr: string) => {
    // Create date objects that preserve the day values (add time to avoid timezone issues)
    const start = new Date(`${startDateStr}T12:00:00`);
    const end = new Date(`${endDateStr}T12:00:00`);
    
    // If end date is before start date, adjust it
    if (end < start) {
      setAlertDialogTitle("Invalid Date Range");
      setAlertMessage("End date cannot be before start date.");
      setAlertDialogOpen(true);
      
      // Set end date equal to start date
      handleDateRangeChange(startDateStr, startDateStr);
      return;
    }
    
    // Check if range exceeds the maximum allowed days
    const dayDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const maxDays = resultReportType === 'weekly' ? 7 : 31;
    
    if (dayDiff > maxDays) {
      setAlertDialogTitle("Date Range Too Large");
      setAlertMessage(`The maximum date range for a ${resultReportType} report is ${maxDays} days.`);
      setAlertDialogOpen(true);
      
      // Set end date to maximum allowed from start date
      const maxEnd = new Date(start);
      maxEnd.setDate(maxEnd.getDate() + maxDays - 1);
      
      // Format the new end date
      const maxYear = maxEnd.getFullYear();
      const maxMonth = String(maxEnd.getMonth() + 1).padStart(2, '0');
      const maxDay = String(maxEnd.getDate()).padStart(2, '0');
      const newEndDate = `${maxYear}-${maxMonth}-${maxDay}`;
      
      // Update end date
      handleDateRangeChange(startDateStr, newEndDate);
    }
  }, [handleDateRangeChange, resultReportType, setAlertDialogOpen, setAlertDialogTitle, setAlertMessage]);

  // Add this handler function
  const handleReviewResultReport = () => {
    // Empty function to satisfy the type requirement
  };

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <header className='border-b'>
        <div className='container flex h-16 items-center justify-between px-4'>
          <div className='flex items-center gap-2 sm:gap-6'>
            <BarChart3 className='h-5 w-5 sm:h-6 sm:w-6' />
            <h1 className='text-lg sm:text-xl font-semibold'>Goalometer</h1>
          </div>
          <div className='flex items-center gap-2 sm:gap-4'>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => {
                setTheme(
                  theme === 'light'
                    ? 'dark'
                    : theme === 'dark'
                    ? 'system'
                    : 'light'
                );
              }}
            >
              {theme === 'light' ? (
                <Sun className='h-4 w-4 sm:h-5 sm:w-5' />
              ) : theme === 'dark' ? (
                <Moon className='h-4 w-4 sm:h-5 sm:w-5' />
              ) : (
                <Monitor className='h-4 w-4 sm:h-5 sm:w-5' />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  className='relative h-8 w-8 sm:h-9 sm:w-9 rounded-full'
                >
                  <Avatar className='h-8 w-8 sm:h-9 sm:w-9'>
                    <AvatarFallback>
                      {getInitials(
                        user?.user_metadata?.name || user?.email || 'U'
                      )}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className='w-56' align='end'>
                <DropdownMenuLabel>
                  <div className='flex flex-col space-y-1'>
                    <p className='text-sm font-medium leading-none'>
                      {user?.user_metadata?.name || 'User'}
                    </p>
                    <p className='text-xs leading-none text-muted-foreground'>
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className='mr-2 h-4 w-4' />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='container px-2 sm:px-4 py-4 sm:py-8'>
        <div className='flex flex-col gap-4 sm:gap-8'>
          {/* Tabs */}
          <Card>
            <Tabs 
              defaultValue='deep-overview' 
              className='w-full'
              value={activeTab}
              onValueChange={(value) => setActiveTab(value)}
            >
              <div className='border-b px-2 sm:px-4 overflow-x-auto'>
                <TabsList className='my-2 w-full h-auto flex flex-wrap justify-start'>
                  <TabsTrigger value='deep-overview' className='h-10 px-3 py-2'>Objectives</TabsTrigger>
                  <TabsTrigger value='reports' className='h-10 px-3 py-2'>Daily Reports</TabsTrigger>
                  <TabsTrigger value='result-reports' className='h-10 px-3 py-2'>Results</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value='deep-overview' className='p-2 sm:p-6'>
                <div className='gap-4 sm:gap-6'>
                  <DeepOverviewTable
                    objectives={objectives}
                    onObjectivesChange={handleObjectivesChange}
                    reports={userReports}
                  />
                </div>
              </TabsContent>

              <TabsContent value='reports' className='p-2 sm:p-6 w-'>
                <div className='space-y-2 sm:space-y-4'>
                  <div className={scrollableContainerStyles}>
                    <div className='min-w-[800px]'>
                      <ReportsTable
                        reports={userReports}
                        objectives={objectives}
                        onDeleteReport={handleDeleteReport}
                        onEditReport={handleEditReport}
                        onReviewReport={handleReviewResultReport}
                        onToggleReview={handleToggleReview}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value='result-reports' className='p-2 sm:p-6'>
                <div className='space-y-2 sm:space-y-4'>
                  <div className='flex justify-between items-center mb-4'>
                    <Button
                      variant='outline'
                      onClick={() => setResultReportDialogOpen(true)}
                      className='flex items-center gap-2 h-10 px-4'
                    >
                      <PlusCircle className='h-4 w-4' />
                      Generate Report
                    </Button>
                  </div>
                  <div className={scrollableContainerStyles}>
                    <div className='min-w-[800px]'>
                      <ReportsTable
                        reports={processedResultReports}
                        objectives={objectives}
                        onDeleteReport={handleDeleteResultReport}
                        onEditReport={handleEditResultReport}
                        onReviewReport={handleReviewResultReport}
                        onToggleReview={handleToggleResultReview}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value='overview' className='p-2 sm:p-6'>
                <div className='grid gap-4 sm:gap-6'>
                  <SimpleOverview objectives={objectives} />
                </div>
              </TabsContent>
            </Tabs>
          </Card>

          {/* Notes Editor */}
          <Card className=''>
            <div className='p-4 sm:p-6'>
              <h3 className='text-base sm:text-lg font-semibold mb-4'>Daily Notes</h3>
              
              {isLoadingNotes ? (
                <div className="flex items-center justify-center p-4 sm:p-8">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
                  <span className="ml-3">Loading notes...</span>
                </div>
              ) : (
                <>
                  <div className='grid gap-4 sm:gap-6 md:grid-cols-2'>
                    <div>
                      <h4 className='font-medium mb-2 text-sm text-muted-foreground'>
                        Today's Notes
                      </h4>
                      <NotesEditor
                        id='today-notes'
                        content={todayNotes}
                        onChange={handleTodayNotesChange}
                        placeholder='What did you accomplish today?'
                      />
                    </div>
                    <div className='mt-2 md:mt-0'>
                      <h4 className='font-medium mb-2 text-sm text-muted-foreground'>
                        Tomorrow's Plan
                      </h4>
                      <NotesEditor
                        id='tomorrow-notes'
                        content={tomorrowNotes}
                        onChange={handleTomorrowNotesChange}
                        placeholder='What do you plan to work on tomorrow?'
                      />
                    </div>
                  </div>
                  <div className='mt-4 sm:mt-6'>
                    <h4 className='font-medium mb-2 text-sm text-muted-foreground'>
                      General Comments
                    </h4>
                    <NotesEditor
                      id='general-comments'
                      content={generalComments}
                      onChange={handleGeneralCommentsChange}
                      placeholder='Any other thoughts or comments...'
                    />
                  </div>
                  <div className='mt-4 sm:mt-6 flex justify-end'>
                    <Button 
                      onClick={handleOpenReport}
                      className='h-10 px-4'
                    >
                      <ClipboardList className='h-4 w-4 mr-2' />
                      Close Day
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
      </main>

      {/* Add the Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className='w-[95vw] max-w-[800px] max-h-[90vh] h-auto'>
          <DialogHeader className='mb-2'>
            <DialogTitle className='text-lg sm:text-xl'>{editingReport ? 'Edit Daily Report' : 'Close Day Report'}</DialogTitle>
            <DialogDescription>
              {editingReport 
                ? 'Update your daily report by modifying the values and notes below.' 
                : 'Create a daily report by filling in metric values and reviewing your notes.'}
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-4 sm:gap-6 py-2 sm:py-4 overflow-x-hidden max-h-[calc(90vh-180px)]'>
            {/* Date Selection */}
            <div className='grid gap-2'>
              <label className='text-sm font-medium'>Report Date</label>
              <Input
                type='date'
                value={reportDate}
                onChange={handleDateChange}
                className='w-full sm:w-[200px] h-10'
                disabled={editingReport !== null || reviewMode}
              />
            </div>

            {/* Objectives and Metrics */}
            <div className='grid gap-2'>
              <label className='text-sm font-medium'>Metrics Update</label>
              <div className={scrollableContainerStyles}>
                <div className='min-w-[500px]'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Actual</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportObjectives.map(objective => (
                        <React.Fragment key={objective.id}>
                          <TableRow className='bg-muted/50'>
                            <TableCell colSpan={3} className='py-2'>
                              <Button
                                variant='ghost'
                                size='sm'
                                className='p-1 h-8 touch-manipulation flex items-center'
                                onClick={() =>
                                  toggleReportObjectiveExpansion(objective.id)
                                }
                              >
                                {objective.isExpanded ? (
                                  <ChevronDown className='h-4 w-4 mr-2' />
                                ) : (
                                  <ChevronRight className='h-4 w-4 mr-2' />
                                )}
                                <span>{objective.name}</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                          {objective.isExpanded &&
                            objective.metrics.map((metric: Metric) => (
                              <TableRow key={metric.id}>
                                <TableCell className='pl-8'>
                                  {metric.name}
                                </TableCell>
                                <TableCell>
                                  {metric.plan !== undefined && metric.planPeriod !== undefined 
                                    ? calculateDailyPlanValue(metric)
                                    : '-'}
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type='number'
                                    value={metricValues[metric.id] || ''}
                                    onChange={e => {
                                      handleMetricValueChange(metric.id, e.target.value);
                                    }}
                                    className='w-20 h-9'
                                    disabled={reviewMode}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            {/* Daily Notes Summary */}
            <div className='grid gap-2'>
              <label className='text-sm font-medium'>Daily Notes Summary</label>
              <div className='rounded-md border p-3 sm:p-4 space-y-4'>
                <div>
                  <h4 className='text-sm font-medium text-muted-foreground'>
                    Today's Notes
                  </h4>
                  <NotesEditor
                    id='report-today-notes'
                    content={reportTodayNotes}
                    onChange={setReportTodayNotes}
                    placeholder='What did you accomplish today?'
                    disabled={reviewMode}
                  />
                </div>
                <div>
                  <h4 className='text-sm font-medium text-muted-foreground'>
                    Tomorrow's Plan
                  </h4>
                  <NotesEditor
                    id='report-tomorrow-notes'
                    content={reportTomorrowNotes}
                    onChange={setReportTomorrowNotes}
                    placeholder='What do you plan to work on tomorrow?'
                    disabled={reviewMode}
                  />
                </div>
                <div>
                  <h4 className='text-sm font-medium text-muted-foreground'>
                    General Comments
                  </h4>
                  <NotesEditor
                    id='report-general-comments'
                    content={reportGeneralComments}
                    onChange={setReportGeneralComments}
                    placeholder='Any other thoughts or comments...'
                    disabled={reviewMode}
                  />
                </div>

                <DialogFooter className='flex-row gap-3 sm:gap-2 mt-4 sm:mt-0'>
            <Button
              variant='outline'
              onClick={() => {
                setReportDialogOpen(false);
                setEditingReport(null);
                setReviewMode(false);
              }}
              className='w-full sm:w-auto h-11 text-base'
            >
              Cancel
            </Button>
            {reviewMode ? (
              <Button onClick={handleSubmitReview} className='w-full sm:w-auto h-11 text-base'>Submit Review</Button>
            ) : editingReport ? (
              <Button onClick={handleUpdateReport} className='w-full sm:w-auto h-11 text-base'>Update Report</Button>
            ) : (
              <Button onClick={handleCreateReport} className='w-full sm:w-auto h-11 text-base'>Create Report</Button>
            )}
          </DialogFooter>

              </div>
            </div>

            {reviewMode && (
              <div className='grid gap-4 sm:gap-6'>
                <label className='text-sm font-medium'>
                  Performance Review
                </label>
                <div className='rounded-md border p-3 sm:p-4 space-y-4'>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <div>
                      <h4 className='text-sm font-medium text-muted-foreground mb-2'>
                        Quantity Rating
                      </h4>
                      <StarRating
                        rating={reportQuantityRating}
                        onRatingChange={setReportQuantityRating}
                      />
                    </div>
                    <div>
                      <h4 className='text-sm font-medium text-muted-foreground mb-2'>
                        Quality Rating
                      </h4>
                      <StarRating
                        rating={reportQualityRating}
                        onRatingChange={setReportQualityRating}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </DialogContent>
      </Dialog>

      {/* Add the Result Report Dialog */}
      <Dialog
        open={resultReportDialogOpen}
        onOpenChange={setResultReportDialogOpen}
      >
        <DialogContent className='w-[95vw] max-w-[800px] max-h-[90vh] h-auto'>
          <DialogHeader className='mb-2'>
            <DialogTitle className='text-lg sm:text-xl'>
              {editingResultReport
                ? reviewMode
                  ? 'Review Result Report'
                  : 'Edit Result Report'
                : 'Generate Result Report'}
            </DialogTitle>
            <DialogDescription>
              {editingResultReport
                ? reviewMode
                  ? 'Review and rate this result report'
                  : 'Edit the details of this result report'
                : 'Generate a weekly or monthly result report by aggregating daily reports'}
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-4 sm:gap-6 py-2 sm:py-4 overflow-x-hidden max-h-[calc(90vh-180px)]'>
            {/* Report Type Selection */}
            <div className='grid gap-2'>
              <label className='text-sm font-medium'>Report Type</label>
              <div className='flex flex-wrap gap-2'>
                <Button
                  variant={
                    resultReportType === 'weekly' ? 'default' : 'outline'
                  }
                  size='sm'
                  className='h-10 px-4'
                  onClick={() => {
                    setResultReportType('weekly');
                    // If current range is longer than 7 days, adjust end date
                    if (resultReportStartDate && resultReportEndDate) {
                      const start = new Date(resultReportStartDate);
                      const end = new Date(resultReportEndDate);
                      const dayDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                      if (dayDiff > 7) {
                        // Set end date to start date + 6 days (7 day total)
                        const newEnd = new Date(start);
                        newEnd.setDate(newEnd.getDate() + 6);
                        setResultReportEndDate(newEnd.toISOString().split('T')[0]);
                      }
                    }
                  }}
                  disabled={!!editingResultReport}
                >
                  Weekly Report
                </Button>
                <Button
                  variant={
                    resultReportType === 'monthly' ? 'default' : 'outline'
                  }
                  size='sm'
                  className='h-10 px-4'
                  onClick={() => setResultReportType('monthly')}
                  disabled={!!editingResultReport}
                >
                  Monthly Report
                </Button>
              </div>
            </div>

            {/* Date Range Selection */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div className='grid gap-2'>
                <label className='text-sm font-medium'>Start Date</label>
                <div className="relative">
                  <Popover 
                    key={`start-date-${resultReportStartDate || 'unset'}`}
                    open={startDatePopoverOpen}
                    onOpenChange={setStartDatePopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !resultReportStartDate && "text-muted-foreground"
                        )}
                        disabled={!!editingResultReport}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {resultReportStartDate ? format(new Date(`${resultReportStartDate}T12:00:00`), "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start" sideOffset={4}>
                      <Calendar
                        mode="single"
                        selected={resultReportStartDate ? new Date(`${resultReportStartDate}T12:00:00`) : undefined}
                        onSelect={(date) => {
                          if (!date) return;
                          // Fix: Preserve the exact date selected without timezone influence
                          // Create an ISO string in format YYYY-MM-DD that represents the selected date
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          const newStartDate = `${year}-${month}-${day}`;
                          
                          // Use the optimized date range handler
                          handleDateRangeChange(newStartDate, resultReportEndDate);
                          
                          // If end date is set, validate the range
                          if (resultReportEndDate) {
                            validateDateRange(newStartDate, resultReportEndDate);
                          }
                          
                          // Close the popover after selection
                          setStartDatePopoverOpen(false);
                        }}
                        disabled={(date) => {
                          return date > new Date() || date < new Date(new Date().getFullYear() - 1, 0, 1);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className='grid gap-2'>
                <label className='text-sm font-medium'>End Date</label>
                <div className="relative">
                  <Popover 
                    key={`end-date-${resultReportEndDate || 'unset'}`}
                    open={endDatePopoverOpen}
                    onOpenChange={setEndDatePopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !resultReportEndDate && "text-muted-foreground"
                        )}
                        disabled={!!editingResultReport}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {resultReportEndDate ? format(new Date(`${resultReportEndDate}T12:00:00`), "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start" sideOffset={4}>
                      <Calendar
                        mode="single"
                        selected={resultReportEndDate ? new Date(`${resultReportEndDate}T12:00:00`) : undefined}
                        onSelect={(date) => {
                          if (!date) return;
                          // Fix: Preserve the exact date selected without timezone influence
                          // Create an ISO string in format YYYY-MM-DD that represents the selected date
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          const newEndDate = `${year}-${month}-${day}`;
                          
                          // Use the optimized date range handler
                          handleDateRangeChange(resultReportStartDate, newEndDate);
                          
                          // If start date is set, validate the range
                          if (resultReportStartDate) {
                            validateDateRange(resultReportStartDate, newEndDate);
                          }
                          
                          // Close the popover after selection
                          setEndDatePopoverOpen(false);
                        }}
                        disabled={(date) => {
                          return date > new Date() || date < new Date(new Date().getFullYear() - 1, 0, 1);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className='col-span-1 sm:col-span-2'>
                <p className='text-xs text-muted-foreground mt-1'>
                  {resultReportType === 'weekly' 
                    ? 'Weekly reports are limited to a maximum of 7 days.'
                    : 'Monthly reports are limited to a maximum of 31 days.'}
                </p>
              </div>
            </div>
            
            {/* Metrics Calculator - now shows automatically when dates are selected */}
            {user && (
              <div className={scrollableContainerStyles}>
                <div className='min-w-[600px]'>
                  <ResultReportManager
                    userId={user.id}
                    startDate={resultReportStartDate || ""}
                    endDate={resultReportEndDate || ""}
                    objectives={objectives}
                    showMetricsSection={showMetricsSection || !!editingResultReport}
                    onSaveReport={(calculatedMetrics) => {
                      if (calculatedMetrics && Object.keys(calculatedMetrics).length > 0) {
                        setResultReportMetrics(calculatedMetrics);
                      } else {
                        console.warn('Received empty metrics data from ResultReportManager');
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* Report Notes */}
            <div className='space-y-4'>
              <div>
                <h4 className='text-sm font-medium text-muted-foreground'>
                  Period Summary
                </h4>
                <NotesEditor
                  id='result-report-summary'
                  content={resultReportSummary}
                  onChange={setResultReportSummary}
                  placeholder='Summarize the achievements and results for this period...'
                  disabled={reviewMode}
                />
              </div>
              <div>
                <h4 className='text-sm font-medium text-muted-foreground'>
                  Next Period Goals
                </h4>
                <NotesEditor
                  id='result-report-next-goals'
                  content={resultReportNextGoals}
                  onChange={setResultReportNextGoals}
                  placeholder='What are the goals for the next period...'
                  disabled={reviewMode}
                />
              </div>
              <div>
                <h4 className='text-sm font-medium text-muted-foreground'>
                  General Comments
                </h4>
                <NotesEditor
                  id='result-report-comments'
                  content={resultReportComments}
                  onChange={setResultReportComments}
                  placeholder='Any other thoughts or comments...'
                  disabled={reviewMode}
                />
              </div>
              <DialogFooter className='flex-row gap-3 sm:gap-2 mt-4 sm:mt-0'>
              <Button
              variant='outline'
              onClick={() => {
                resetResultReportState();
                setReviewMode(false);
                setTimeout(() => {
                  setResultReportDialogOpen(false);
                }, 10);
              }}
              className='w-full sm:w-auto h-11 text-base'
            >
              Cancel
            </Button>
            {reviewMode ? (
              <Button onClick={submitResultReportReview} className='w-full sm:w-auto h-11 text-base'>Submit Review</Button>
            ) : (
              <Button onClick={async () => {
                try {
                  // Only reset state and close dialog if report generation was successful
                  const success = await generateResultReport();
                  if (success) {
                    resetResultReportState();
                    setTimeout(() => {
                      setResultReportDialogOpen(false);
                    }, 10);
                  }
                } catch (error) {
                  console.error('Error generating report:', error);
                }
              }}
              className='w-full sm:w-auto h-11 text-base'
              >
                {editingResultReport ? 'Update Report' : 'Generate Report'}
              </Button>
            )}
            </DialogFooter>

            </div>

            {/* Review section (only shown in review mode) */}
            {reviewMode && (
              <div className='grid gap-4 sm:gap-6'>
                <label className='text-sm font-medium'>
                  Performance Review
                </label>
                <div className='rounded-md border p-3 sm:p-4 space-y-4'>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <div>
                      <h4 className='text-sm font-medium text-muted-foreground mb-2'>
                        Quantity Rating
                      </h4>
                      <StarRating
                        rating={reportQuantityRating}
                        onRatingChange={setReportQuantityRating}
                      />
                    </div>
                    <div>
                      <h4 className='text-sm font-medium text-muted-foreground mb-2'>
                        Quality Rating
                      </h4>
                      <StarRating
                        rating={reportQualityRating}
                        onRatingChange={setReportQualityRating}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>


        </DialogContent>
      </Dialog>

      {/* Add this dialog for the strict mode missing reports */}
      <Dialog
        open={missingSurveyOpen}
        onOpenChange={open => {
          // Only allow closing if strict mode is off or all reports are completed
          if (
            !strictModeEnabled ||
            currentMissingIndex >= missingDates.length
          ) {
            setMissingSurveyOpen(open);
          }
        }}
      >
        <DialogContent className='w-[95vw] max-w-[800px] max-h-[90vh]'>
          <DialogHeader>
            <DialogTitle>Missing Daily Report</DialogTitle>
            <DialogDescription>
              Strict Mode detected missing reports. Please complete the report
              for{' '}
              {format(
                parseISO(
                  missingDates[currentMissingIndex] ||
                    new Date().toISOString().split('T')[0]
                ),
                'MMMM d, yyyy'
              )}
              . ({currentMissingIndex + 1}/{missingDates.length})
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-4 sm:gap-6 py-4 overflow-y-auto max-h-[calc(90vh-180px)]'>
            {/* Date Selection - Locked to the missing date */}
            <div className='grid gap-2'>
              <label className='text-sm font-medium'>Report Date</label>
              <Input
                type='date'
                value={reportDate}
                disabled={true}
                className='w-full sm:w-[200px]'
              />
            </div>

            {/* Reuse the metrics update section from the normal report dialog */}
            <div className='grid gap-2 overflow-x-auto'>
              <label className='text-sm font-medium'>Metrics Update</label>
              <div className={scrollableContainerStyles}>
                <div className='min-w-[500px]'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Actual</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportObjectives.map(objective => (
                        <React.Fragment key={objective.id}>
                          <TableRow className='bg-muted/50'>
                            <TableCell colSpan={3} className='py-2'>
                              <Button
                                variant='ghost'
                                size='sm'
                                className='p-0'
                                onClick={() =>
                                  toggleReportObjectiveExpansion(objective.id)
                                }
                              >
                                {objective.isExpanded ? (
                                  <ChevronDown className='h-4 w-4 mr-2' />
                                ) : (
                                  <ChevronRight className='h-4 w-4 mr-2' />
                                )}
                                <span>{objective.name}</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                          {objective.isExpanded &&
                            objective.metrics.map((metric: Metric) => (
                              <TableRow key={metric.id}>
                                <TableCell className='pl-8'>
                                  {metric.name}
                                </TableCell>
                                <TableCell>
                                  {metric.plan !== undefined && metric.planPeriod !== undefined 
                                    ? calculateDailyPlanValue(metric)
                                    : '-'}
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type='number'
                                    value={metricValues[metric.id] || ''}
                                    onChange={e => {
                                      handleMetricValueChange(metric.id, e.target.value);
                                    }}
                                    className='w-20 h-9'
                                    disabled={reviewMode}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            {/* Notes section */}
            <div className='grid gap-4 sm:gap-6'>
              <label className='text-sm font-medium'>Notes</label>
              <div className='grid gap-4'>
                <div>
                  <h4 className='text-sm font-medium text-muted-foreground'>
                    This day's notes
                  </h4>
                  <NotesEditor
                    id='missing-report-today-notes'
                    content={reportTodayNotes}
                    onChange={setReportTodayNotes}
                    placeholder='What did you accomplish on this day?'
                  />
                </div>
                <div>
                  <h4 className='text-sm font-medium text-muted-foreground'>
                    Next day's notes
                  </h4>
                  <NotesEditor
                    id='missing-report-tomorrow-notes'
                    content={reportTomorrowNotes}
                    onChange={setReportTomorrowNotes}
                    placeholder='What did you plan for the next day?'
                  />
                </div>
                <div>
                  <h4 className='text-sm font-medium text-muted-foreground'>
                    General Comments
                  </h4>
                  <NotesEditor
                    id='missing-report-general-comments'
                    content={reportGeneralComments}
                    onChange={setReportGeneralComments}
                    placeholder='Any other thoughts or comments...'
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className='flex-col sm:flex-row gap-2 sm:gap-0'>
            <Button 
              onClick={handleNextMissingReport}
              className='w-full sm:w-auto'
            >
              {currentMissingIndex < missingDates.length - 1
                ? 'Save & Next'
                : 'Complete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add the Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className='max-w-[90vw] sm:max-w-[425px]'>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this report? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className='flex-col sm:flex-row gap-2 sm:gap-0'>
            <AlertDialogCancel className='w-full sm:w-auto mt-2 sm:mt-0'>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteReport}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Keep the existing Alert Dialog */}
      <AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <AlertDialogContent className='max-w-[90vw] sm:max-w-[425px]'>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertDialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {alertMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction className='w-full sm:w-auto'>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Result Reports Metrics */}
      {activeTab === 'results' && resultReportStartDate && resultReportEndDate && (
        <>
          {/* Loading indicator during data fetching */}
          {isLoadingResultReport && (
            <div className="my-4 flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <div className="text-sm">Loading report data...</div>
            </div>
          )}
          
          {/* Only show metrics calculator if data is available */}
          {!isLoadingResultReport && (
            <div className="my-4">
              <ResultReportManager
                userId={user?.id || ''}
                startDate={resultReportStartDate}
                endDate={resultReportEndDate}
                objectives={objectivesData || []}
                showMetricsSection={true}
                onSaveReport={(calculatedMetrics) => {
                  setResultReportMetrics(calculatedMetrics);
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
