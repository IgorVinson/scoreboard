import React, { useState, useEffect } from 'react';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import ChartBlock from '@/components/ChartBlock';
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
import { useData } from '@/contexts/data-context';
import { ModeToggle } from '@/components/mode-toggle';
import { VirtualManagerToggle } from '@/components/virtual-manager-toggle';
import { useSoloMode } from '@/contexts/solo-mode-context';
import { NotesEditor } from '@/components/NotesEditor';
import {
  ObjectivesMetricsTable,
  Objective,
} from '@/components/ObjectivesMetricsTable';
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
import { ResultReportsTable } from '@/components/ResultReportsTable';

// Add a StarRating component to replace numeric inputs
function StarRating({ rating, maxRating = 5, onRatingChange }) {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className='flex space-x-1'>
      {[...Array(maxRating)].map((_, i) => {
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
}

export function Dashboard() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { isSoloMode, isVirtualManager } = useSoloMode();
  const {
    metrics,
    plans,
    dailyReports,
    getPlansByUser,
    getDailyReportsByUser,
  } = useData();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedIndicator, setSelectedIndicator] = useState('All Indicators');
  const [selectedPeriod, setSelectedPeriod] = useState('Daily');
  const [reportsIndicator, setReportsIndicator] = useState('All Indicators');
  const [reportsPeriod, setReportsPeriod] = useState('Daily');
  const [todayNotes, setTodayNotes] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedNotes = localStorage.getItem('dailyNotes');
        if (savedNotes) {
          const parsed = JSON.parse(savedNotes);
          return parsed.today || '';
        }
      } catch (error) {
        console.error('Error loading today notes:', error);
      }
    }
    return '';
  });
  const [tomorrowNotes, setTomorrowNotes] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedNotes = localStorage.getItem('dailyNotes');
        if (savedNotes) {
          const parsed = JSON.parse(savedNotes);
          return parsed.tomorrow || '';
        }
      } catch (error) {
        console.error('Error loading tomorrow notes:', error);
      }
    }
    return '';
  });
  const [generalComments, setGeneralComments] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedNotes = localStorage.getItem('dailyNotes');
        if (savedNotes) {
          const parsed = JSON.parse(savedNotes);
          return parsed.general || '';
        }
      } catch (error) {
        console.error('Error loading general comments:', error);
      }
    }
    return '';
  });
  const [objectives, setObjectives] = useState<Objective[]>(() => {
    // Try to load from localStorage on initial render
    if (typeof window !== 'undefined') {
      const savedObjectives = localStorage.getItem('objectives');
      if (savedObjectives) {
        try {
          return JSON.parse(savedObjectives);
        } catch (error) {
          console.error('Error parsing objectives from localStorage:', error);
        }
      }
    }

    // Empty array if nothing in localStorage
    return [];
  });
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportDate, setReportDate] = useState(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [metricValues, setMetricValues] = useState<Record<string, number>>({});
  const [expandedObjectives, setExpandedObjectives] = useState<Set<string>>(
    new Set()
  );

  // Add new state variables for report
  const [reportTodayNotes, setReportTodayNotes] = useState('');
  const [reportTomorrowNotes, setReportTomorrowNotes] = useState('');
  const [reportGeneralComments, setReportGeneralComments] = useState('');

  const [indicators, setIndicators] = useState([]);
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

  const filteredIndicators =
    selectedIndicator === 'All Indicators'
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

  // When you need to get user-specific data:
  const userPlans = getPlansByUser(user.id);
  const userReports = getDailyReportsByUser(user.id);

  const shouldShowManagerView =
    isVirtualManager || (!isSoloMode && user?.role === 'MANAGER');

  // Add functions to work with localStorage
  const saveDailyNotesToLocalStorage = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'dailyNotes',
        JSON.stringify({
          today: todayNotes,
          tomorrow: tomorrowNotes,
          general: generalComments,
        })
      );
    }
  };

  // Modify useEffect for automatic saving
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      saveDailyNotesToLocalStorage();
    }, 1000);

    return () => clearTimeout(saveTimeout);
  }, [todayNotes, tomorrowNotes, generalComments]);

  // Change handler for today-notes
  const handleTodayNotesChange = (html: string) => {
    setTodayNotes(html);

    // Save to localStorage on each change
    const currentNotes = JSON.parse(
      localStorage.getItem('dailyNotes') ||
        '{"today":"","tomorrow":"","general":""}'
    );
    localStorage.setItem(
      'dailyNotes',
      JSON.stringify({
        ...currentNotes,
        today: html,
      })
    );
  };

  // Change handler for tomorrow-notes
  const handleTomorrowNotesChange = (html: string) => {
    setTomorrowNotes(html);

    // Save to localStorage on each change
    const currentNotes = JSON.parse(
      localStorage.getItem('dailyNotes') ||
        '{"today":"","tomorrow":"","general":""}'
    );
    localStorage.setItem(
      'dailyNotes',
      JSON.stringify({
        ...currentNotes,
        tomorrow: html,
      })
    );
  };

  // Change handler for general-comments
  const handleGeneralCommentsChange = (html: string) => {
    setGeneralComments(html);

    // Save to localStorage on each change
    const currentNotes = JSON.parse(
      localStorage.getItem('dailyNotes') ||
        '{"today":"","tomorrow":"","general":""}'
    );
    localStorage.setItem(
      'dailyNotes',
      JSON.stringify({
        ...currentNotes,
        general: html,
      })
    );
  };

  // Add this state for report-specific objective expansion state
  const [reportObjectives, setReportObjectives] = useState<Objective[]>([]);

  // Create a separate toggle function for the report dialog
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

  // Update handleOpenReport to initialize report objectives
  const handleOpenReport = () => {
    const savedNotes = localStorage.getItem('dailyNotes');

    // Load notes for the report
    if (savedNotes) {
      try {
        const parsed = JSON.parse(savedNotes);
        setReportTodayNotes(parsed.today || '');
        setReportTomorrowNotes(parsed.tomorrow || '');
        setReportGeneralComments(parsed.general || '');
      } catch (error) {
        console.error('Error parsing notes:', error);
        setReportTodayNotes(todayNotes);
        setReportTomorrowNotes(tomorrowNotes);
        setReportGeneralComments(generalComments);
      }
    } else {
      setReportTodayNotes(todayNotes);
      setReportTomorrowNotes(tomorrowNotes);
      setReportGeneralComments(generalComments);
    }

    // Create a deep copy of objectives with all expanded by default
    setReportObjectives(
      objectives.map(obj => ({
        ...obj,
        isExpanded: true, // Always expand in the report dialog
      }))
    );

    // Set today's date by default
    setReportDate(format(new Date(), 'yyyy-MM-dd'));

    setReportDialogOpen(true);
  };

  // Add state for tracking which report is being edited
  const [editingReport, setEditingReport] = useState<any>(null);

  // Update the date handling in the report dialog
  const handleDateChange = e => {
    // Get the raw value from the input
    const inputValue = e.target.value;

    // Create a date object without timezone conversion
    // This ensures we get exactly what the user selected
    setReportDate(inputValue);

    // console.log('Date selected:', inputValue); // Debug log
  };

  // Update the handleCreateReport function to calculate daily plan values
  const handleCreateReport = async () => {
    try {
      // Create metrics_data object with both plan and fact values
      const metrics_data = {};

      // Iterate through objectives and their metrics
      objectives.forEach(objective => {
        objective.metrics.forEach(metric => {
          // Calculate daily plan value based on the plan period
          let dailyPlanValue = 0;

          if (metric.plan) {
            if (metric.planPeriod === 'until_week_end') {
              // If weekly plan, divide by 5 (work days in a week)
              dailyPlanValue = metric.plan / 5;
            } else if (metric.planPeriod === 'until_month_end') {
              // If monthly plan, divide by 22 (work days in a month)
              dailyPlanValue = metric.plan / 22;
            } else {
              // If already daily
              dailyPlanValue = metric.plan;
            }
          }

          metrics_data[metric.id] = {
            plan: dailyPlanValue,
            fact: metricValues[metric.id] || 0,
          };
        });
      });

      // Log the date being saved
      console.log('Saving report with date:', reportDate);

      const newReport = {
        id: `report-${Date.now()}`,
        date: reportDate, // Use the raw string value directly
        metrics_data,
        today_notes: reportTodayNotes,
        tomorrow_notes: reportTomorrowNotes,
        general_comments: reportGeneralComments,
        user_id: user.id,
        created_at: new Date().toISOString(),
        reviewed: false,
      };

      // Save the report
      const updatedReports = [...reports, newReport];
      localStorage.setItem('dailyReports', JSON.stringify(updatedReports));
      setReports(updatedReports);

      // Close the form and reset values
      setMetricValues({});
      setReportDialogOpen(false);
    } catch (error) {
      console.error('Error creating report:', error);
    }
  };

  // Also update the handleUpdateReport function to use daily plan values
  const handleUpdateReport = async () => {
    try {
      if (!editingReport) return;

      // Create metrics_data object with both plan and fact values
      const metrics_data: Record<string, { plan: number; fact: number }> = {};

      // Iterate through objectives and their metrics to get plan values
      objectives.forEach(objective => {
        objective.metrics.forEach(metric => {
          // Calculate daily plan value based on the plan period
          let dailyPlanValue = 0;

          if (metric.plan) {
            if (metric.planPeriod === 'until_week_end') {
              // If weekly plan, divide by 5 (work days in a week)
              dailyPlanValue = metric.plan / 5;
            } else if (metric.planPeriod === 'until_month_end') {
              // If monthly plan, divide by 22 (work days in a month)
              dailyPlanValue = metric.plan / 22;
            } else {
              // If already daily
              dailyPlanValue = metric.plan;
            }
          }

          metrics_data[metric.id] = {
            plan: dailyPlanValue,
            fact: metricValues[metric.id] || 0, // Get fact value from user input
          };
        });
      });

      // Update existing report
      const updatedReport = {
        ...editingReport,
        date: reportDate,
        metrics_data,
        today_notes: reportTodayNotes,
        tomorrow_notes: reportTomorrowNotes,
        general_comments: reportGeneralComments,
      };

      // Update the report in localStorage
      const updatedReports = reports.map(report =>
        report.id === editingReport.id ? updatedReport : report
      );

      localStorage.setItem('dailyReports', JSON.stringify(updatedReports));
      setReports(updatedReports);

      // Close the form and reset editing state
      setMetricValues({});
      setEditingReport(null);
      setReportDialogOpen(false);
    } catch (error) {
      console.error('Error updating report:', error);
    }
  };

  // Update function to handle toggling report review status and clear ratings when un-reviewing
  const handleToggleReview = (reportId: string) => {
    try {
      const updatedReports = reports.map(report => {
        if (report.id === reportId) {
          // If toggling from reviewed to not reviewed, also clear the ratings
          if (report.reviewed) {
            return {
              ...report,
              reviewed: false,
              reviewed_at: null,
              quality_rating: undefined,
              quantity_rating: undefined,
            };
          } else {
            // When toggling from not reviewed to reviewed without the modal,
            // just change the reviewed status
            return {
              ...report,
              reviewed: true,
            };
          }
        }
        return report;
      });

      setReports(updatedReports);
      localStorage.setItem('dailyReports', JSON.stringify(updatedReports));
    } catch (error) {
      console.error('Error toggling report review status:', error);
    }
  };

  // Add function to handle editing a report
  const handleEditReport = (report: any) => {
    setEditingReport(report);
    setReportDate(format(parseISO(report.date), 'yyyy-MM-dd'));

    // Pre-fill metric values from the report
    const initialMetricValues: Record<string, number> = {};
    Object.entries(report.metrics_data || {}).forEach(
      ([metricId, data]: [string, any]) => {
        initialMetricValues[metricId] = data.fact || 0;
      }
    );
    setMetricValues(initialMetricValues);

    // Pre-fill notes
    setReportTodayNotes(report.today_notes || '');
    setReportTomorrowNotes(report.tomorrow_notes || '');
    setReportGeneralComments(report.general_comments || '');

    // Create a deep copy of objectives with all expanded by default
    setReportObjectives(
      objectives.map(obj => ({
        ...obj,
        isExpanded: true, // Always expand in the report dialog
      }))
    );

    setReportDialogOpen(true);
  };

  // Update handleMetricValueChange to only handle fact values
  const handleMetricValueChange = (metricId: string, value: string) => {
    setMetricValues(prev => ({
      ...prev,
      [metricId]: value ? Number(value) : 0,
    }));
  };

  const toggleObjectiveExpansion = (objectiveId: string) => {
    const updatedObjectives = objectives.map(obj => {
      if (obj.id === objectiveId) {
        return {
          ...obj,
          isExpanded: !obj.isExpanded,
        };
      }
      return obj;
    });
    setObjectives(updatedObjectives);
    saveObjectivesToLocalStorage(updatedObjectives);
  };

  // Add function to save objectives to localStorage
  const saveObjectivesToLocalStorage = (updatedObjectives: Objective[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('objectives', JSON.stringify(updatedObjectives));
    }
  };

  // Add functions to handle objective and metric changes
  const handleAddObjective = (newObjective: Objective) => {
    const updatedObjectives = [...objectives, newObjective];
    setObjectives(updatedObjectives);
    saveObjectivesToLocalStorage(updatedObjectives);
  };

  const handleUpdateObjective = (updatedObjective: Objective) => {
    const updatedObjectives = objectives.map(obj =>
      obj.id === updatedObjective.id ? updatedObjective : obj
    );
    setObjectives(updatedObjectives);
    saveObjectivesToLocalStorage(updatedObjectives);
  };

  const handleDeleteObjective = (objectiveId: string) => {
    const updatedObjectives = objectives.filter(obj => obj.id !== objectiveId);
    setObjectives(updatedObjectives);
    saveObjectivesToLocalStorage(updatedObjectives);
  };

  const handleAddMetric = (objectiveId: string, newMetric: Metric) => {
    const updatedObjectives = objectives.map(obj => {
      if (obj.id === objectiveId) {
        return {
          ...obj,
          metrics: [...obj.metrics, newMetric],
        };
      }
      return obj;
    });
    setObjectives(updatedObjectives);
    saveObjectivesToLocalStorage(updatedObjectives);
  };

  const handleUpdateMetric = (objectiveId: string, updatedMetric: Metric) => {
    const updatedObjectives = objectives.map(obj => {
      if (obj.id === objectiveId) {
        return {
          ...obj,
          metrics: obj.metrics.map(metric =>
            metric.id === updatedMetric.id ? updatedMetric : metric
          ),
        };
      }
      return obj;
    });
    setObjectives(updatedObjectives);
    saveObjectivesToLocalStorage(updatedObjectives);
  };

  const handleDeleteMetric = (objectiveId: string, metricId: string) => {
    const updatedObjectives = objectives.map(obj => {
      if (obj.id === objectiveId) {
        return {
          ...obj,
          metrics: obj.metrics.filter(metric => metric.id !== metricId),
        };
      }
      return obj;
    });
    setObjectives(updatedObjectives);
    saveObjectivesToLocalStorage(updatedObjectives);
  };

  const handleDeleteReport = (reportId: string) => {
    try {
      const updatedReports = reports.filter(report => report.id !== reportId);
      setReports(updatedReports);
      localStorage.setItem('dailyReports', JSON.stringify(updatedReports));
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  // Add new state variables for review mode and ratings
  const [reviewMode, setReviewMode] = useState(false);
  const [reportQuantityRating, setReportQuantityRating] = useState<number>(0);
  const [reportQualityRating, setReportQualityRating] = useState<number>(0);

  // Add function to handle opening report for review (after handleEditReport function)
  const handleReviewReport = (report: any) => {
    setEditingReport(report);
    setReportDate(format(parseISO(report.date), 'yyyy-MM-dd'));
    setReviewMode(true);

    // Pre-fill existing ratings if available
    setReportQuantityRating(report.quantity_rating || 0);
    setReportQualityRating(report.quality_rating || 0);

    // Pre-fill metric values from the report
    const initialMetricValues: Record<string, number> = {};
    Object.entries(report.metrics_data || {}).forEach(
      ([metricId, data]: [string, any]) => {
        initialMetricValues[metricId] = data.fact || 0;
      }
    );
    setMetricValues(initialMetricValues);

    // Pre-fill notes
    setReportTodayNotes(report.today_notes || '');
    setReportTomorrowNotes(report.tomorrow_notes || '');
    setReportGeneralComments(report.general_comments || '');

    // Create a deep copy of objectives with all expanded by default
    setReportObjectives(
      objectives.map(obj => ({
        ...obj,
        isExpanded: true, // Always expand in the report dialog
      }))
    );

    setReportDialogOpen(true);
  };

  // Add function to handle review submission
  const handleSubmitReview = async () => {
    try {
      if (!editingReport) return;

      // Update existing report with review data
      const updatedReport = {
        ...editingReport,
        quantity_rating: reportQuantityRating,
        quality_rating: reportQualityRating,
        reviewed: true,
        reviewed_at: new Date().toISOString(),
      };

      // Update the report in localStorage
      const updatedReports = reports.map(report =>
        report.id === editingReport.id ? updatedReport : report
      );

      localStorage.setItem('dailyReports', JSON.stringify(updatedReports));
      setReports(updatedReports);

      // Close the form and reset editing state
      setMetricValues({});
      setEditingReport(null);
      setReviewMode(false);
      setReportDialogOpen(false);
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  // Update the calculateDailyPlanValue function
  const calculateDailyPlanValue = metric => {
    if (!metric.plan || !metric.planPeriod) return '-';

    const workDaysInMonth = 22; // Assumption for work days in a month
    const workDaysInWeek = 5; // Assumption for work days in a week

    let dailyValue;
    if (metric.planPeriod === 'until_week_end') {
      dailyValue = metric.plan / workDaysInWeek;
    } else if (metric.planPeriod === 'until_month_end') {
      dailyValue = metric.plan / workDaysInMonth;
    } else {
      dailyValue = metric.plan; // Already daily
    }

    return dailyValue.toFixed(2);
  };

  // Add function to get user-friendly display name for plan periods
  const getPlanPeriodDisplayName = period => {
    if (!period) return '';

    switch (period) {
      case 'until_week_end':
        return 'weekly';
      case 'until_month_end':
        return 'monthly';
      default:
        return period;
    }
  };

  // Add new state variables for result reports
  const [resultReports, setResultReports] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedReports = localStorage.getItem('resultReports');
        if (savedReports) {
          return JSON.parse(savedReports);
        }
      } catch (error) {
        console.error('Error loading result reports:', error);
      }
    }
    return [];
  });

  const [resultReportDialogOpen, setResultReportDialogOpen] = useState(false);
  const [resultReportType, setResultReportType] = useState<
    'weekly' | 'monthly'
  >('weekly');
  const [resultReportStartDate, setResultReportStartDate] = useState('');
  const [resultReportEndDate, setResultReportEndDate] = useState('');
  const [resultReportSummary, setResultReportSummary] = useState('');
  const [resultReportNextGoals, setResultReportNextGoals] = useState('');
  const [resultReportComments, setResultReportComments] = useState('');
  const [editingResultReport, setEditingResultReport] = useState<any>(null);

  // Add these handler functions
  const handleDeleteResultReport = reportId => {
    try {
      const updatedReports = resultReports.filter(
        report => report.id !== reportId
      );
      setResultReports(updatedReports);
      localStorage.setItem('resultReports', JSON.stringify(updatedReports));
    } catch (error) {
      console.error('Error deleting result report:', error);
    }
  };

  const handleEditResultReport = report => {
    setEditingResultReport(report);
    setResultReportType(report.report_type);
    setResultReportStartDate(report.period_start);
    setResultReportEndDate(report.period_end);
    setResultReportSummary(report.period_summary || '');
    setResultReportNextGoals(report.next_period_goals || '');
    setResultReportComments(report.general_comments || '');
    setResultReportDialogOpen(true);
  };

  const handleReviewResultReport = report => {
    setEditingResultReport(report);
    setReviewMode(true);
    setReportQuantityRating(report.quantity_rating || 0);
    setReportQualityRating(report.quality_rating || 0);

    // Pre-fill fields
    setResultReportType(report.report_type);
    setResultReportStartDate(report.period_start);
    setResultReportEndDate(report.period_end);
    setResultReportSummary(report.period_summary || '');
    setResultReportNextGoals(report.next_period_goals || '');
    setResultReportComments(report.general_comments || '');

    setResultReportDialogOpen(true);
  };

  const handleToggleResultReview = reportId => {
    try {
      const updatedReports = resultReports.map(report => {
        if (report.id === reportId) {
          if (report.reviewed) {
            return {
              ...report,
              reviewed: false,
              reviewed_at: null,
              quality_rating: undefined,
              quantity_rating: undefined,
            };
          } else {
            return {
              ...report,
              reviewed: true,
            };
          }
        }
        return report;
      });

      setResultReports(updatedReports);
      localStorage.setItem('resultReports', JSON.stringify(updatedReports));
    } catch (error) {
      console.error('Error toggling result report review status:', error);
    }
  };

  const generateResultReport = () => {
    try {
      // Validate dates
      if (!resultReportStartDate || !resultReportEndDate) {
        console.error('Both start and end dates are required');
        return;
      }

      // Create date objects
      const startDate = new Date(resultReportStartDate);
      const endDate = new Date(resultReportEndDate);

      // Ensure dates are valid
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error('Invalid dates');
        return;
      }

      // Ensure end date is after start date
      if (endDate < startDate) {
        console.error('End date must be after start date');
        return;
      }

      // Filter daily reports that fall within the selected period
      const periodReports = reports.filter(report => {
        const reportDate = new Date(report.date);
        return reportDate >= startDate && reportDate <= endDate;
      });

      if (periodReports.length === 0) {
        console.error('No daily reports found in the selected period');
        return;
      }

      // Aggregate metrics data
      const aggregatedMetricsData = {};

      // Initialize with all metrics from objectives
      objectives.forEach(objective => {
        objective.metrics.forEach(metric => {
          aggregatedMetricsData[metric.id] = {
            plan: 0,
            fact: 0,
            count: 0, // To calculate averages if needed
          };
        });
      });

      // Sum up all values from daily reports
      periodReports.forEach(report => {
        Object.entries(report.metrics_data || {}).forEach(
          ([metricId, data]) => {
            if (aggregatedMetricsData[metricId]) {
              aggregatedMetricsData[metricId].plan += data.plan || 0;
              aggregatedMetricsData[metricId].fact += data.fact || 0;
              aggregatedMetricsData[metricId].count += 1;
            }
          }
        );
      });

      // Process the aggregated data based on report type
      const finalMetricsData = {};
      Object.entries(aggregatedMetricsData).forEach(([metricId, data]) => {
        // For metrics with no data, skip
        if (data.count === 0) return;

        // For weekly/monthly reports, we may want to sum or average values
        // Let's use sum for now, but you can adjust this logic as needed
        finalMetricsData[metricId] = {
          plan: data.plan,
          fact: data.fact,
        };
      });

      const newReport = {
        id: editingResultReport
          ? editingResultReport.id
          : `result-report-${Date.now()}`,
        report_type: resultReportType,
        period_start: resultReportStartDate,
        period_end: resultReportEndDate,
        date: new Date().toISOString().split('T')[0], // Today's date as creation date
        metrics_data: finalMetricsData,
        period_summary: resultReportSummary,
        next_period_goals: resultReportNextGoals,
        general_comments: resultReportComments,
        user_id: user.id,
        created_at: editingResultReport
          ? editingResultReport.created_at
          : new Date().toISOString(),
        updated_at: new Date().toISOString(),
        reviewed: editingResultReport?.reviewed || false,
        quality_rating: editingResultReport?.quality_rating,
        quantity_rating: editingResultReport?.quantity_rating,
      };

      if (editingResultReport) {
        // Update existing report
        const updatedReports = resultReports.map(report =>
          report.id === editingResultReport.id ? newReport : report
        );
        setResultReports(updatedReports);
        localStorage.setItem('resultReports', JSON.stringify(updatedReports));
      } else {
        // Create new report
        const updatedReports = [...resultReports, newReport];
        setResultReports(updatedReports);
        localStorage.setItem('resultReports', JSON.stringify(updatedReports));
      }

      // Reset state and close dialog
      resetResultReportState();
      setResultReportDialogOpen(false);
    } catch (error) {
      console.error('Error generating result report:', error);
    }
  };

  const submitResultReportReview = () => {
    try {
      if (!editingResultReport) return;

      // Update existing report with review data
      const updatedReport = {
        ...editingResultReport,
        quantity_rating: reportQuantityRating,
        quality_rating: reportQualityRating,
        reviewed: true,
        reviewed_at: new Date().toISOString(),
      };

      // Update the report in localStorage
      const updatedReports = resultReports.map(report =>
        report.id === editingResultReport.id ? updatedReport : report
      );

      localStorage.setItem('resultReports', JSON.stringify(updatedReports));
      setResultReports(updatedReports);

      // Reset state and close dialog
      resetResultReportState();
      setReviewMode(false);
      setResultReportDialogOpen(false);
    } catch (error) {
      console.error('Error submitting result report review:', error);
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
    setReportQuantityRating(0);
    setReportQualityRating(0);
  };

  // Add new state variable for strict mode
  const [strictModeEnabled, setStrictModeEnabled] = useState(false);
  const [missingSurveyOpen, setMissingSurveyOpen] = useState(false);
  const [missingDates, setMissingDates] = useState([]);
  const [currentMissingIndex, setCurrentMissingIndex] = useState(0);

  // Add these functions to handle strict mode
  const toggleStrictMode = () => {
    const newState = !strictModeEnabled;
    setStrictModeEnabled(newState);

    if (newState) {
      checkMissingReports();
    } else {
      // When turning off strict mode, close any open surveys
      setMissingSurveyOpen(false);
    }
  };

  // Add this function to get the previous workday
  const getPreviousWorkday = (date: Date): Date => {
    const prevDay = new Date(date);
    prevDay.setDate(date.getDate() - 1);
    
    // If it's Sunday (0), go back to Friday
    const dayOfWeek = prevDay.getDay();
    if (dayOfWeek === 0) { // Sunday
      prevDay.setDate(prevDay.getDate() - 2); // Go back to Friday
    }
    
    return prevDay;
  };

  // Update the checkMissingReports function to check all previous days in the week
  const checkMissingReports = () => {
    if (!strictModeEnabled) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday, etc.
    
    // If it's Monday (1) or Sunday (0), no need to check previous days
    if (currentDay === 1 || currentDay === 0) {
      setMissingDates([]);
      setMissingSurveyOpen(false);
      return;
    }
    
    // Calculate the date of Monday this week
    const monday = new Date(today);
    monday.setDate(today.getDate() - (currentDay - 1));
    monday.setHours(0, 0, 0, 0);
    
    // Get all workdays from Monday to yesterday
    const workdaysToCheck = [];
    for (let i = 0; i < currentDay - 1; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      workdaysToCheck.push(date);
    }
    
    // Format the dates as YYYY-MM-DD strings
    const formattedWorkdays = workdaysToCheck.map(date =>
      format(date, 'yyyy-MM-dd')
    );
    
    // Find which dates don't have reports
    const reportDates = reports.map(report => report.date);
    const missing = formattedWorkdays.filter(
      date => !reportDates.includes(date)
    );
    
    setMissingDates(missing);
    
    if (missing.length > 0) {
      setCurrentMissingIndex(0);
      setMissingSurveyOpen(true);
      
      // Pre-fill the report date field with the first missing date
      setReportDate(missing[0]);
      
      // Initialize report objectives for the missing report
      const objsWithExpansion = objectives.map(obj => ({
        ...obj,
        isExpanded: true,
      }));
      setReportObjectives(objsWithExpansion);
      
      // Clear metric values for the new report
      setMetricValues({});
      
      // Clear notes for the new report
      setReportTodayNotes('');
      setReportTomorrowNotes('');
      setReportGeneralComments('');
    }
  };

  // Add function to handle moving to the next missing report
  const handleNextMissingReport = async () => {
    // Save the current report
    await handleCreateReport();

    // Move to the next missing date or close the survey if done
    if (currentMissingIndex < missingDates.length - 1) {
      const nextIndex = currentMissingIndex + 1;
      setCurrentMissingIndex(nextIndex);
      setReportDate(missingDates[nextIndex]);

      // Reset other report fields
      setMetricValues({});
      setReportTodayNotes('');
      setReportTomorrowNotes('');
      setReportGeneralComments('');
    } else {
      // We've completed all missing reports
      setMissingSurveyOpen(false);
    }
  };

  // Add this effect to check for missing reports whenever relevant data changes
  useEffect(() => {
    if (strictModeEnabled) {
      checkMissingReports();
    }
  }, [strictModeEnabled, reports]);

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

        {/* Chart Block */ }
          <ChartBlock objectives={objectives} />
          
          
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
                    onObjectivesChange={updatedObjectives => {
                      setObjectives(updatedObjectives);
                      saveObjectivesToLocalStorage(updatedObjectives);
                    }}
                    reports={reports}
                  />
                </div>
              </TabsContent>

              <TabsContent value='reports' className='p-6'>
                <div className='space-y-4'>
                  <div className='flex justify-between items-center'>
                    <h2 className='text-2xl font-bold'>Reports</h2>
                  </div>

                  <ReportsTable
                    reports={reports}
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
                        objective.metrics.map(metric => (
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
                                  const newValue = e.target.value
                                    ? parseFloat(e.target.value)
                                    : '';
                                  setMetricValues({
                                    ...metricValues,
                                    [metric.id]: newValue,
                                  });
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
                        objective.metrics.map(metric => (
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
                                  const newValue = e.target.value
                                    ? parseFloat(e.target.value)
                                    : '';
                                  setMetricValues({
                                    ...metricValues,
                                    [metric.id]: newValue,
                                  });
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
    </div>
  );
}
