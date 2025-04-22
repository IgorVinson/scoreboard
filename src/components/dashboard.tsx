import React, { useState, useEffect } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  Users,
  Target,
  ClipboardList,
  Sun,
  Moon,
  Monitor,
  TrendingUp,
  UserCircle,
  LogOut,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Star,
  PlusCircle,
  Database,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/auth-context';
import { useSoloMode } from '@/contexts/solo-mode-context';
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
import { format, parseISO, set } from 'date-fns';
import { DatabaseExplorer } from '@/components/database-explorer';
import {
  useObjectives,
  useObjectivesByUser,
  useMetrics,
  useCreateObjective,
  useUpdateObjective,
  useDeleteObjective,
  useDailyNotesByUser,
  useUpdateDailyNote,
  useCreateDailyNote,
  useLatestDailyNote,
} from '@/queries';
import { 
  useCreateMetric, 
  useUpdateMetric, 
  useDeleteMetric,
  useDailyReports,
  useDailyReportsByUser,
  useDailyReportByUserAndDate,
  useCreateDailyReport,
  useUpdateDailyReport,
  useDeleteDailyReport
} from '@/queries';
import type { UIObjective } from '@/components/DeepOverviewTable';
import type { DailyReport } from '@/lib/types';
import { ModeToggle } from '@/components/mode-toggle';
import { VirtualManagerToggle } from '@/components/virtual-manager-toggle';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/queries/queryKeys';
import { ResultReportManager } from '@/components/result-report/MetricCalculator';
import { toast } from '@/components/ui/use-toast';

// Extend the DailyReport type to include the 'reviewed' field for our app's usage
interface ExtendedDailyReport extends Omit<DailyReport, 'id' | 'created_at' | 'updated_at'> {
  reviewed?: boolean;
}

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
}

interface MetricValues {
  [key: string]: number;
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
  reviewed: boolean;
}

interface Metric {
  id: string;
  name: string;
  plan?: number;
  planPeriod?: string;
}

interface Objective {
  id: string;
  name: string;
  description?: string;
  metrics: Metric[];
  isExpanded?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, onRatingChange }) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className='flex space-x-1'>
      {[...Array(5)].map((_, i) => {
        const starValue = i + 1;
        return (
          <button
            key={i}
            type='button'
            className='focus:outline-none p-1'
            onClick={() => onRatingChange(starValue)}
            onMouseEnter={() => setHoverRating(starValue)}
            onMouseLeave={() => setHoverRating(0)}
          >
            <Star
              className={`h-6 w-6 ${
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
  const { isSoloMode, isVirtualManager } = useSoloMode();
  const queryClient = useQueryClient();
  
  // Add state for delete confirmation dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);
  
  const { data: metrics = [], isLoading: isLoadingMetrics } = useMetrics();
  const createMetricMutation = useCreateMetric();
  const updateMetricMutation = useUpdateMetric();
  const deleteDailyReportMutation = useDeleteDailyReport();
  
  // TanStack Query hooks for daily reports
  const { data: userReports = [], isLoading: isLoadingReports } = useDailyReportsByUser(user?.id || '');
  const createDailyReportMutation = useCreateDailyReport();
  const updateDailyReportMutation = useUpdateDailyReport();
  
  // TanStack Query hooks for daily notes
  const { data: latestNote, isLoading: isLoadingLatestNote } = useLatestDailyNote(user?.id || '');
  const updateDailyNoteMutation = useUpdateDailyNote();
  const createDailyNoteMutation = useCreateDailyNote();
  
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedIndicator, setSelectedIndicator] = useState('All Indicators');
  const [selectedPeriod, setSelectedPeriod] = useState('Daily');
  const [reportsIndicator, setReportsIndicator] = useState('All Indicators');
  const [reportsPeriod, setReportsPeriod] = useState('Daily');
  const [objectives, setObjectives] = useState<UIObjective[]>([]);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportDate, setReportDate] = useState(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [metricValues, setMetricValues] = useState<Record<string, number>>({});
  const [expandedObjectives, setExpandedObjectives] = useState<Set<string>>(
    new Set()
  );

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
      setTodayNotes(latestNote.today_notes || '');
      setTomorrowNotes(latestNote.tomorrow_notes || '');
      setGeneralComments(latestNote.general_comments || '');
      setCurrentNoteId(latestNote.id);
      setIsLoadingNotes(false);
    } else if (!isLoadingLatestNote) {
      setIsLoadingNotes(false);
    }
  }, [latestNote, isLoadingLatestNote]);

  // Save notes with TanStack Query mutations
  useEffect(() => {
    if (isLoadingNotes) return; // Don't save during initial load
    
    const saveTimeout = setTimeout(async () => {
      try {
        const noteData = {
          today_notes: todayNotes,
          tomorrow_notes: tomorrowNotes,
          general_comments: generalComments,
          date: format(new Date(), 'yyyy-MM-dd')
        };
        
        if (currentNoteId) {
          // Update existing note
          await updateDailyNoteMutation.mutateAsync({
            id: currentNoteId,
            ...noteData
          });
        } else if (user?.id) {
          // Create new note
          const result = await createDailyNoteMutation.mutateAsync({
            ...noteData,
            user_id: user.id
          });
          setCurrentNoteId(result.id);
        }
      } catch (error) {
        console.error('Error saving notes:', error);
      }
    }, 2500); // Increase debounce to 2.5 seconds for better performance

    return () => clearTimeout(saveTimeout);
  }, [todayNotes, tomorrowNotes, generalComments, currentNoteId, updateDailyNoteMutation, createDailyNoteMutation, user, isLoadingNotes]);

  const { data: objectivesFromDB } = useObjectivesByUser(user?.id || '');
  
  useEffect(() => {
    console.log('Objectives from database:', objectivesFromDB);
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
  const [resultReports, setResultReports] = useState<Object[]>([
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
  
  // Helper functions
  const calculateDailyPlanValue = (metric: any) => {
    if (!metric.plan) return '0';
    return String(metric.plan);
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
        
        objectives.forEach(obj => {
          obj.metrics.forEach(metric => {
            if (metric.id === metricId && metric.plan !== undefined) {
              planValue = metric.plan;
            }
          });
        });
        
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
      
      console.log('Report created successfully');
      setReportDialogOpen(false);
      
      // Show success alert
      setAlertDialogTitle("Success");
      setAlertMessage("Daily report for " + format(parseISO(reportDate), 'MMMM d, yyyy') + " has been created successfully.");
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
        
        objectives.forEach(obj => {
          obj.metrics.forEach(metric => {
            if (metric.id === metricId && metric.plan !== undefined) {
              planValue = metric.plan;
            }
          });
        });
        
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
      
      console.log('Report updated successfully');
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
      // Note: You might need a different approach to distinguish between report types
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
        
        // Refresh result reports data
        queryClient.invalidateQueries(['result_reports']);
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
  const shouldShowManagerView =
    isVirtualManager || (!isSoloMode && user?.role === 'MANAGER');

  // Add the missing toggleStrictMode function
  const toggleStrictMode = () => {
    setStrictModeEnabled(prev => !prev);
  };

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
  const [strictModeEnabled, setStrictModeEnabled] = useState(false);
  const [resultReportDialogOpen, setResultReportDialogOpen] = useState(false);
  const [missingSurveyOpen, setMissingSurveyOpen] = useState(false);
  const [missingDates, setMissingDates] = useState<string[]>([]);
  const [currentMissingIndex, setCurrentMissingIndex] = useState(0);

  const [indicators, setIndicators] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [allIndicators, setAllIndicators] = useState(['All Indicators']);
  const [timePeriods, setTimePeriods] = useState([
    'Daily',
    'Weekly',
    'Monthly',
  ]);

  const [reports, setReports] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedReports = localStorage.getItem('dailyReports');
        if (savedReports) {
          return JSON.parse(savedReports);
        }
      } catch (error) {
        console.error('Error loading reports:', error);
      }
    }
    return [];
  });

  // When dealing with the indicators in the UI, add loading state handling
  const filteredIndicators =
    isLoadingMetrics 
      ? []
      : selectedIndicator === 'All Indicators'
        ? indicators
        : indicators.filter((i: any) => i.name === selectedIndicator);

  const filteredReports =
    reportsIndicator === 'All Indicators'
      ? reports
      : reports.filter((r: any) => r.indicator === reportsIndicator);

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
  const handleEditReport = (report) => {
    // Set the report being edited
    setEditingReport(report);
    
    // Set the report date
    setReportDate(report.date);
    
    // Copy the notes from the report
    setReportTodayNotes(report.today_notes || '');
    setReportTomorrowNotes(report.tomorrow_notes || '');
    setReportGeneralComments(report.general_comments || '');
    
    // Set the metric values from the report's metrics_data
    const values = {};
    if (report.metrics_data) {
      Object.entries(report.metrics_data).forEach(([metricId, data]) => {
        if (data.fact !== undefined) {
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
  
  // Report review functions
  const handleReviewReport = (report) => {
    // Set the report being reviewed
    setEditingReport(report);
    
    // Set review mode to true
    setReviewMode(true);
    
    // Set the initial ratings from the report if they exist
    setReportQuantityRating(report.quantity_rating || 0);
    setReportQualityRating(report.quality_rating || 0);
    
    // Copy the notes from the report (readonly in review mode)
    setReportTodayNotes(report.today_notes || '');
    setReportTomorrowNotes(report.tomorrow_notes || '');
    setReportGeneralComments(report.general_comments || '');
    
    // Open the dialog
    setReportDialogOpen(true);
  };
  
  const handleToggleReview = async (reportId) => {
    try {
      // Find the report
      const report = userReports.find(r => r.id === reportId);
      if (!report) return;
      
      // Toggle the reviewed status
      const updatedReport = {
        id: reportId,
        reviewed: !report.reviewed
      };
      
      // Update the report
      await updateDailyReportMutation.mutateAsync(updatedReport);
      
      // Show success message
      setAlertDialogTitle("Success");
      setAlertMessage(`Report ${report.reviewed ? 'unmarked' : 'marked'} as reviewed`);
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
  
  const handleEditResultReport = (report: Report) => {
    setEditingReport(report);
    if (report.type === 'result') {
      // For result reports, populate form data with result report values
      setResultReportForm({
        summary: report.summary || '',
        startDate: report.start_date ? new Date(report.start_date) : new Date(),
        endDate: report.end_date ? new Date(report.end_date) : new Date(),
      });
      setResultReportDialogOpen(true);
    }
  };
  
  const handleReviewResultReport = (report: Report) => {
    setReviewingReport(report);
    // Initialize ratings for the result report review
    setResultReportReview({
      rating: report.rating || 0,
      feedback: report.feedback || '',
    });
    setResultReportReviewDialogOpen(true);
  };
  
  const handleToggleResultReview = async (report) => {
    console.log('Toggling review for result report:', report);
    
    try {
      const reportId = typeof report === 'object' ? report.id : report;
      
      // Toggle the reviewed status
      const { data, error } = await supabase
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
      console.log("Starting result report generation...");
      
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
        console.error("Too many metrics for a single report:", metricsCount);
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
          console.error("Metrics data size too large:", metricsString.length, "bytes");
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
      
      // Log the metrics data we're using
      console.log("Using metrics data:", resultReportMetrics);
      
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

      console.log("Generating result report with data:", resultReportData);

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

      // Enhanced success message with report details
      const reportPeriod = resultReportType.charAt(0).toUpperCase() + resultReportType.slice(1);
      setAlertDialogTitle("Report Created Successfully");
      setAlertMessage(`Your ${reportPeriod} report for ${dateRange} has been saved. You can view it in the Result Reports tab.`);
      setAlertDialogOpen(true);
      
      queryClient.invalidateQueries(['result_reports']);

      // Only reset state and close dialog on success
      setResultReportDialogOpen(false);
      resetResultReportState();
      
      console.log("Result report created:", data);
      
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
    console.log('Submit result report review');
    setResultReportDialogOpen(false);
  };

  // Add some display of the metrics data to confirm it's working
  useEffect(() => {
    if (metrics.length > 0) {
      console.log('Metrics from TanStack Query:', metrics);
      
      // Update indicators with metrics data
      const metricIndicators = metrics.map(metric => ({
        id: metric.id,
        name: metric.name,
        description: metric.description || '',
        type: metric.type,
        measurement_unit: metric.measurement_unit
      }));
      
      setIndicators(metricIndicators);
      setAllIndicators(['All Indicators', ...metricIndicators.map(m => m.name)]);
    }
  }, [metrics]);

  // Add metric operation handlers using TanStack Query
  const handleCreateMetric = async (metricData: any) => {
    try {
      console.log('Creating metric with data:', metricData);
      await createMetricMutation.mutateAsync(metricData);
      return true;
    } catch (error) {
      console.error('Error creating metric:', error);
      return false;
    }
  };

  const handleUpdateMetric = async (id: string, metricData: any) => {
    try {
      console.log('Updating metric:', id, metricData);
      await updateMetricMutation.mutateAsync({ id, ...metricData });
      return true;
    } catch (error) {
      console.error('Error updating metric:', error);
      return false;
    }
  };

  const handleDeleteMetric = async (id: string) => {
    try {
      console.log('Deleting metric:', id);
      await deleteMetricMutation.mutateAsync(id);
      return true;
    } catch (error) {
      console.error('Error deleting metric:', error);
      return false;
    }
  };

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
      console.log("Processing result reports for display:", resultReports);
      
      // Transform result reports to match the format expected by ReportsTable
      const processed = resultReports.map(report => {
        // Format the date range as a single date string for display
        const dateDisplay = report.start_date === report.end_date 
          ? report.start_date 
          : `${report.start_date} - ${report.end_date}`;
        
        return {
          ...report,
          // Use the combined date range as the date field
          date: dateDisplay,
          // Add a display_date field for human-readable format (used in the UI)
          display_date: dateDisplay,
          // Move metrics_summary to metrics_data for compatibility
          metrics_data: report.metrics_summary || {},
          // Add placeholder fields that are expected for daily reports
          today_notes: report.summary || '',
          tomorrow_notes: report.next_goals || '',
          general_comments: report.comments || '',
          // Add a type flag to distinguish between report types
          is_result_report: true
        };
      });
      
      console.log("Processed result reports:", processed);
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
      
      console.log("Fetched result reports:", data);
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
  const handleDeleteResultReport = async (reportId) => {
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

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <header className='border-b'>
        <div className='container flex h-16 items-center justify-between px-4'>
          <div className='flex items-center gap-6'>
            <BarChart3 className='h-6 w-6' />
            <h1 className='text-xl font-semibold'>Performance Dashboard</h1>
            {isSoloMode && <VirtualManagerToggle />}
          </div>
          <div className='flex items-center gap-4'>
            <div className='flex items-center space-x-2'>
              <span className='text-sm font-medium'>Strict Mode</span>
              <Button
                variant={strictModeEnabled ? 'default' : 'outline'}
                size='sm'
                className='h-8'
                onClick={toggleStrictMode}
              >
                {strictModeEnabled ? 'On' : 'Off'}
              </Button>
            </div>
            <ModeToggle />
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
                <Sun className='h-5 w-5' />
              ) : theme === 'dark' ? (
                <Moon className='h-5 w-5' />
              ) : (
                <Monitor className='h-5 w-5' />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  className='relative h-9 w-9 rounded-full'
                >
                  <Avatar className='h-9 w-9'>
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
      <main className='container px-4 py-8'>
        <div className='grid gap-8'>
          {/* Overview Cards */}
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            <Card className='p-6'>
              <div className='flex items-center gap-4'>
                <Users className='h-8 w-8 text-primary' />
                <div>
                  <p className='text-sm text-muted-foreground'>Team Members</p>
                  <h3 className='text-2xl font-semibold'>3</h3>
                </div>
              </div>
            </Card>
            <Card className='p-6'>
              <div className='flex items-center gap-4'>
                <Target className='h-8 w-8 text-primary' />
                <div>
                  <p className='text-sm text-muted-foreground'>Active Plans</p>
                  <h3 className='text-2xl font-semibold'>5</h3>
                </div>
              </div>
            </Card>
            <Card className='p-6'>
              <div className='flex items-center gap-4'>
                <ClipboardList className='h-8 w-8 text-primary' />
                <div>
                  <p className='text-sm text-muted-foreground'>Reports Today</p>
                  <h3 className='text-2xl font-semibold'>2</h3>
                </div>
              </div>
            </Card>
            <Card className='p-6'>
              <div className='flex items-center gap-4'>
                <TrendingUp className='h-8 w-8 text-primary' />
                <div>
                  <p className='text-sm text-muted-foreground'>
                    Average Performance
                  </p>
                  <h3 className='text-2xl font-semibold'>89%</h3>
                </div>
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <Card>
            <Tabs defaultValue='deep-overview' className='w-full'>
              <div className='border-b px-4'>
                <TabsList className='my-2'>
                  <TabsTrigger value='deep-overview'>Performance</TabsTrigger>
                  <TabsTrigger value='reports'>Daily Reports</TabsTrigger>
                  <TabsTrigger value='result-reports'>
                    Result Reports
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value='deep-overview' className='p-6'>
                <div className='grid gap-6'>
                  <DeepOverviewTable
                    objectives={objectives}
                    onObjectivesChange={handleObjectivesChange}
                    reports={reports}
                  />
                </div>
              </TabsContent>

              <TabsContent value='reports' className='p-6'>
                <div className='space-y-4'>
                  <ReportsTable
                    reports={userReports}
                    objectives={objectives}
                    onDeleteReport={handleDeleteReport}
                    onEditReport={handleEditReport}
                    onReviewReport={handleReviewReport}
                    onToggleReview={handleToggleReview}
                  />
                </div>
              </TabsContent>

              <TabsContent value='result-reports' className='p-6'>
                <div className='space-y-4'>
                <div className='flex justify-between items-center'>
                    <h2 className='text-2xl font-bold'>Result Reports</h2>
                    <Button
                      variant='outline'
                      onClick={() => setResultReportDialogOpen(true)}
                      className='flex items-center gap-2'
                    >
                      <PlusCircle className='h-4 w-4' />
                      Generate Report
                    </Button>
                  </div>
                  <ReportsTable
                    reports={processedResultReports}
                    objectives={objectives}
                    onDeleteReport={handleDeleteResultReport}
                    onEditReport={handleEditResultReport}
                    onReviewReport={handleReviewResultReport}
                    onToggleReview={handleToggleResultReview}
                  />
                </div>
              </TabsContent>

              <TabsContent value='overview' className='p-6'>
                <div className='grid gap-6'>
                  <SimpleOverview objectives={objectives} />
                </div>
              </TabsContent>
            </Tabs>
          </Card>

          {/* Notes Editor */}
          <Card className=''>
            <div className='p-6'>
              <h3 className='text-lg font-semibold mb-4'>Daily Notes</h3>
              
              {isLoadingNotes ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-3">Loading notes...</span>
                </div>
              ) : (
                <>
                  <div className='grid gap-6 md:grid-cols-2'>
                    <div>
                      <h4 className='font-medium mb-3 text-sm text-muted-foreground'>
                        Today's Notes
                      </h4>
                      <NotesEditor
                        id='today-notes'
                        content={todayNotes}
                        onChange={handleTodayNotesChange}
                        placeholder='What did you accomplish today?'
                      />
                    </div>
                    <div>
                      <h4 className='font-medium mb-3 text-sm text-muted-foreground'>
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
                  <div className='mt-6'>
                    <h4 className='font-medium mb-3 text-sm text-muted-foreground'>
                      General Comments
                    </h4>
                    <NotesEditor
                      id='general-comments'
                      content={generalComments}
                      onChange={handleGeneralCommentsChange}
                      placeholder='Any other thoughts or comments...'
                    />
                  </div>
                  <div className='mt-6 flex justify-end'>
                    <Button onClick={handleOpenReport}>
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
        <DialogContent className='sm:max-w-[800px] max-h-[90vh]'>
          <DialogHeader>
            <DialogTitle>{editingReport ? 'Edit Daily Report' : 'Close Day Report'}</DialogTitle>
            <DialogDescription>
              {editingReport 
                ? 'Update your daily report by modifying the values and notes below.' 
                : 'Create a daily report by filling in metric values and reviewing your notes.'}
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-6 py-4 overflow-y-auto max-h-[calc(90vh-180px)]'>
            {/* Date Selection */}
            <div className='grid gap-2'>
              <label className='text-sm font-medium'>Report Date</label>
              <Input
                type='date'
                value={reportDate}
                onChange={handleDateChange}
                className='w-[200px]'
                disabled={editingReport !== null || reviewMode}
              />
            </div>

            {/* Objectives and Metrics */}
            <div className='grid gap-2'>
              <label className='text-sm font-medium'>Metrics Update</label>
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
                              {calculateDailyPlanValue(metric)}
                            </TableCell>
                            <TableCell>
                              <Input
                                type='number'
                                value={metricValues[metric.id] || ''}
                                onChange={e => {
                                  handleMetricValueChange(metric.id, e.target.value);
                                }}
                                className='w-20'
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

            {/* Daily Notes Summary */}
            <div className='grid gap-2'>
              <label className='text-sm font-medium'>Daily Notes Summary</label>
              <div className='rounded-md border p-4 space-y-4'>
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
              </div>
            </div>

            {reviewMode && (
              <div className='grid gap-6'>
                <label className='text-sm font-medium'>
                  Performance Review
                </label>
                <div className='rounded-md border p-4 space-y-4'>
                  <div className='grid grid-cols-2 gap-4'>
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

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setReportDialogOpen(false);
                setEditingReport(null);
                setReviewMode(false);
              }}
            >
              Cancel
            </Button>
            {reviewMode ? (
              <Button onClick={handleSubmitReview}>Submit Review</Button>
            ) : editingReport ? (
              <Button onClick={handleUpdateReport}>Update Report</Button>
            ) : (
              <Button onClick={handleCreateReport}>Create Report</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add the Result Report Dialog */}
      <Dialog
        open={resultReportDialogOpen}
        onOpenChange={setResultReportDialogOpen}
      >
        <DialogContent className='sm:max-w-[800px] max-h-[90vh]'>
          <DialogHeader>
            <DialogTitle>
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

          <div className='grid gap-6 py-4 overflow-y-auto max-h-[calc(90vh-180px)]'>
            {/* Report Type Selection */}
            <div className='grid gap-2'>
              <label className='text-sm font-medium'>Report Type</label>
              <div className='flex gap-2'>
                <Button
                  variant={
                    resultReportType === 'weekly' ? 'default' : 'outline'
                  }
                  size='sm'
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
                  onClick={() => setResultReportType('monthly')}
                  disabled={!!editingResultReport}
                >
                  Monthly Report
                </Button>
              </div>
            </div>

            {/* Date Range Selection */}
            <div className='grid md:grid-cols-2 gap-4'>
              <div className='grid gap-2'>
                <label className='text-sm font-medium'>Start Date</label>
                <Input
                  type='date'
                  value={resultReportStartDate}
                  onChange={e => {
                    const newStartDate = e.target.value;
                    setResultReportStartDate(newStartDate);
                    
                    // If end date is set, validate the range
                    if (resultReportEndDate) {
                      const start = new Date(newStartDate);
                      const end = new Date(resultReportEndDate);
                      
                      // If start date is after end date, set end date to start date
                      if (start > end) {
                        setResultReportEndDate(newStartDate);
                      } else {
                        // Check if range exceeds the maximum allowed days
                        const dayDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                        const maxDays = resultReportType === 'weekly' ? 7 : 31;
                        
                        if (dayDiff > maxDays) {
                          // Adjust end date to maintain valid range
                          const newEnd = new Date(start);
                          newEnd.setDate(newEnd.getDate() + maxDays - 1);
                          setResultReportEndDate(newEnd.toISOString().split('T')[0]);
                        }
                      }
                    }
                  }}
                  disabled={!!editingResultReport}
                />
              </div>
              <div className='grid gap-2'>
                <label className='text-sm font-medium'>End Date</label>
                <Input
                  type='date'
                  value={resultReportEndDate}
                  onChange={e => {
                    const newEndDate = e.target.value;
                    
                    // If start date is set, validate the range
                    if (resultReportStartDate) {
                      const start = new Date(resultReportStartDate);
                      const end = new Date(newEndDate);
                      
                      // If end date is before start date, don't update
                      if (end < start) {
                        setAlertDialogTitle("Invalid Date Range");
                        setAlertMessage("End date cannot be before start date.");
                        setAlertDialogOpen(true);
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
                        setResultReportEndDate(maxEnd.toISOString().split('T')[0]);
                        return;
                      }
                    }
                    
                    setResultReportEndDate(newEndDate);
                  }}
                  disabled={!!editingResultReport}
                />
              </div>
              <div className='col-span-2'>
                <p className='text-xs text-muted-foreground mt-1'>
                  {resultReportType === 'weekly' 
                    ? 'Weekly reports are limited to a maximum of 7 days.'
                    : 'Monthly reports are limited to a maximum of 31 days.'}
                </p>
              </div>
            </div>
            
            {/* Metrics Calculator - now shows automatically when dates are selected */}
            {user && (
              <ResultReportManager
                userId={user.id}
                startDate={resultReportStartDate || ""}
                endDate={resultReportEndDate || ""}
                objectives={objectives}
                showMetricsSection={showMetricsSection || !!editingResultReport}
                onSaveReport={(calculatedMetrics) => {
                  console.log('Metrics saved from ResultReportManager:', calculatedMetrics);
                  if (calculatedMetrics && Object.keys(calculatedMetrics).length > 0) {
                    console.log('Setting resultReportMetrics with valid data:', calculatedMetrics);
                    setResultReportMetrics(calculatedMetrics);
                  } else {
                    console.warn('Received empty metrics data from ResultReportManager');
                  }
                }}
              />
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
            </div>

            {/* Review section (only shown in review mode) */}
            {reviewMode && (
              <div className='grid gap-6'>
                <label className='text-sm font-medium'>
                  Performance Review
                </label>
                <div className='rounded-md border p-4 space-y-4'>
                  <div className='grid grid-cols-2 gap-4'>
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

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                resetResultReportState();
                setReviewMode(false);
                setTimeout(() => {
                  setResultReportDialogOpen(false);
                }, 10);
              }}
            >
              Cancel
            </Button>

            {reviewMode ? (
              <Button onClick={submitResultReportReview}>Submit Review</Button>
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
              }}>
                {editingResultReport ? 'Update Report' : 'Generate Report'}
              </Button>
            )}
          </DialogFooter>
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
        <DialogContent className='sm:max-w-[800px] max-h-[90vh]'>
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

          <div className='grid gap-6 py-4 overflow-y-auto max-h-[calc(90vh-180px)]'>
            {/* Date Selection - Locked to the missing date */}
            <div className='grid gap-2'>
              <label className='text-sm font-medium'>Report Date</label>
              <Input
                type='date'
                value={reportDate}
                disabled={true}
                className='w-[200px]'
              />
            </div>

            {/* Reuse the metrics update section from the normal report dialog */}
            <div className='grid gap-2'>
              <label className='text-sm font-medium'>Metrics Update</label>
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
                              {calculateDailyPlanValue(metric)}
                            </TableCell>
                            <TableCell>
                              <Input
                                type='number'
                                value={metricValues[metric.id] || ''}
                                onChange={e => {
                                  handleMetricValueChange(metric.id, e.target.value);
                                }}
                                className='w-20'
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

            {/* Notes section */}
            <div className='grid gap-6'>
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

          <DialogFooter>
            <Button onClick={handleNextMissingReport}>
              {currentMissingIndex < missingDates.length - 1
                ? 'Save & Next'
                : 'Complete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add the Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this report? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteReport}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Keep the existing Alert Dialog */}
      <AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertDialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {alertMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
