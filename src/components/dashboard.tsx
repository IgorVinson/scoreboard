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
import { ResultReportsTable } from '@/components/ResultReportsTable';
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
  const [resultReports, setResultReports] = useState<any[]>([]);
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
    // Open confirmation dialog
    setReportToDelete(reportId);
    setDeleteConfirmOpen(true);
  };
  
  // Confirm and execute report deletion
  const confirmDeleteReport = async () => {
    if (!reportToDelete) return;
    
    try {
      console.log('Deleting report:', reportToDelete);
      await deleteDailyReportMutation.mutateAsync(reportToDelete);
      
      // Show success alert
      setAlertDialogTitle("Success");
      setAlertMessage("Report deleted successfully");
      setAlertDialogOpen(true);
      
      // Close the confirmation dialog
      setDeleteConfirmOpen(false);
      setReportToDelete(null);
      return true;
    } catch (error) {
      console.error('Error deleting report:', error);
      
      // Show error alert
      setAlertDialogTitle("Error");
      setAlertMessage("Failed to delete report. Please try again.");
      setAlertDialogOpen(true);
      
      // Close the confirmation dialog
      setDeleteConfirmOpen(false);
      setReportToDelete(null);
      return false;
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
  const handleEditReport = () => {
    console.log('Edit report');
  };
  
  const handleReviewReport = () => {
    console.log('Review report');
  };
  
  const handleToggleReview = () => {
    console.log('Toggle review');
  };
  
  const handleSubmitReview = () => {
    console.log('Submit review');
    setReportDialogOpen(false);
  };
  
  const handleNextMissingReport = () => {
    console.log('Next missing report');
  };
  
  const handleDeleteResultReport = () => {
    console.log('Delete result report');
  };
  
  const handleEditResultReport = () => {
    console.log('Edit result report');
  };
  
  const handleReviewResultReport = () => {
    console.log('Review result report');
  };
  
  const handleToggleResultReview = () => {
    console.log('Toggle result review');
  };
  
  const generateResultReport = () => {
    console.log('Generate result report');
    setResultReportDialogOpen(false);
  };
  
  const submitResultReportReview = () => {
    console.log('Submit result report review');
    setResultReportDialogOpen(false);
  };
  
  const resetResultReportState = () => {
    setEditingResultReport(null);
    setResultReportType('weekly');
    setResultReportStartDate('');
    setResultReportEndDate('');
    setResultReportSummary('');
    setResultReportNextGoals('');
    setResultReportComments('');
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
                  <div className='flex justify-between items-center'>
                    <h2 className='text-2xl font-bold'>Reports</h2>
                    <Button 
                      variant='outline'
                      onClick={() => queryClient.invalidateQueries({ queryKey: queryKeys.dailyReports.all })}
                      className='flex items-center gap-2'
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <path d="M21 2v6h-6"></path>
                        <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                        <path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"></path>
                      </svg>
                      Refresh
                    </Button>
                  </div>

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

                  <ResultReportsTable
                    reports={resultReports}
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
            <DialogTitle>Close Day Report</DialogTitle>
            <DialogDescription>
              Create a daily report by filling in metric values and reviewing
              your notes.
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
                  onClick={() => setResultReportType('weekly')}
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
                  onChange={e => setResultReportStartDate(e.target.value)}
                  disabled={!!editingResultReport}
                />
              </div>
              <div className='grid gap-2'>
                <label className='text-sm font-medium'>End Date</label>
                <Input
                  type='date'
                  value={resultReportEndDate}
                  onChange={e => setResultReportEndDate(e.target.value)}
                  disabled={!!editingResultReport}
                />
              </div>
            </div>

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
                setResultReportDialogOpen(false);
                resetResultReportState();
                setReviewMode(false);
              }}
            >
              Cancel
            </Button>

            {reviewMode ? (
              <Button onClick={submitResultReportReview}>Submit Review</Button>
            ) : (
              <Button onClick={generateResultReport}>
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
