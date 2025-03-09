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
  const [reportDate, setReportDate] = useState<string>(
    new Date().toISOString().split('T')[0]
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

    setReportDialogOpen(true);
  };

  // Add state for tracking which report is being edited
  const [editingReport, setEditingReport] = useState<any>(null);

  // Keep the original handleCreateReport function for new reports
  const handleCreateReport = async () => {
    try {
      // Create metrics_data object with both plan and fact values
      const metrics_data: Record<string, { plan: number; fact: number }> = {};

      // Iterate through objectives and their metrics to get plan values
      objectives.forEach(objective => {
        objective.metrics.forEach(metric => {
          metrics_data[metric.id] = {
            plan: metric.plan || 0, // Get plan value from the objective's metric
            fact: metricValues[metric.id] || 0, // Get fact value from user input
          };
        });
      });

      const newReport = {
        id: `report-${Date.now()}`,
        date: reportDate,
        metrics_data,
        today_notes: reportTodayNotes,
        tomorrow_notes: reportTomorrowNotes,
        general_comments: reportGeneralComments,
        user_id: user.id,
        created_at: new Date().toISOString(),
        reviewed: false,
      };

      // Save the report to localStorage
      const updatedReports = [...reports, newReport];
      localStorage.setItem('dailyReports', JSON.stringify(updatedReports));
      setReports(updatedReports);

      // Close the form
      setMetricValues({});
      setReportDialogOpen(false);
    } catch (error) {
      console.error('Error creating report:', error);
    }
  };

  // Add a separate function for updating existing reports
  const handleUpdateReport = async () => {
    try {
      if (!editingReport) return;

      // Create metrics_data object with both plan and fact values
      const metrics_data: Record<string, { plan: number; fact: number }> = {};

      // Iterate through objectives and their metrics to get plan values
      objectives.forEach(objective => {
        objective.metrics.forEach(metric => {
          metrics_data[metric.id] = {
            plan: metric.plan || 0, // Get plan value from the objective's metric
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
    setReportDate(report.date);

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

  const handleMoveReport = (reportId: string, direction: 'up' | 'down') => {
    try {
      const currentReports = [...reports];
      const reportIndex = currentReports.findIndex(
        report => report.id === reportId
      );

      if (reportIndex === -1) return;

      if (direction === 'up' && reportIndex > 0) {
        // Swap with the previous report
        [currentReports[reportIndex], currentReports[reportIndex - 1]] = [
          currentReports[reportIndex - 1],
          currentReports[reportIndex],
        ];
      } else if (
        direction === 'down' &&
        reportIndex < currentReports.length - 1
      ) {
        // Swap with the next report
        [currentReports[reportIndex], currentReports[reportIndex + 1]] = [
          currentReports[reportIndex + 1],
          currentReports[reportIndex],
        ];
      }

      setReports(currentReports);
      localStorage.setItem('dailyReports', JSON.stringify(currentReports));
    } catch (error) {
      console.error('Error moving report:', error);
    }
  };

  // Add new state variables for review mode and ratings
  const [reviewMode, setReviewMode] = useState(false);
  const [reportQuantityRating, setReportQuantityRating] = useState<number>(0);
  const [reportQualityRating, setReportQualityRating] = useState<number>(0);

  // Add function to handle opening report for review (after handleEditReport function)
  const handleReviewReport = (report: any) => {
    setEditingReport(report);
    setReportDate(report.date);
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
            <Tabs defaultValue='overview' className='w-full'>
              <div className='border-b px-4'>
                <TabsList className='my-2'>
                  <TabsTrigger value='overview'>Overview</TabsTrigger>
                  <TabsTrigger value='deep-overview'>Performance</TabsTrigger>
                  <TabsTrigger value='reports'>Reports</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value='overview' className='p-6'>
                <div className='grid gap-6'>
                  <ObjectivesMetricsTable
                    objectives={objectives}
                    onObjectivesChange={updatedObjectives => {
                      setObjectives(updatedObjectives);
                      saveObjectivesToLocalStorage(updatedObjectives);
                    }}
                  />
                </div>
              </TabsContent>

              <TabsContent value='deep-overview' className='p-6'>
                <div className='grid gap-6'>
                  <DeepOverviewTable
                    objectives={objectives}
                    onObjectivesChange={updatedObjectives => {
                      setObjectives(updatedObjectives);
                      saveObjectivesToLocalStorage(updatedObjectives);
                    }}
                  />
                </div>
              </TabsContent>

              <TabsContent value='team' className='p-6'>
                <h3 className='text-lg font-semibold mb-4'>Team Members</h3>
                <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                  {teamMembers.map(member => (
                    <Card key={member.id} className='p-6'>
                      <div className='flex items-start gap-4'>
                        <Avatar className='h-12 w-12'>
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback>
                            <UserCircle className='h-6 w-6' />
                          </AvatarFallback>
                        </Avatar>
                        <div className='flex-1'>
                          <div className='flex items-center justify-between'>
                            <h4 className='font-semibold'>{member.name}</h4>
                            <Badge variant='secondary'>{member.role}</Badge>
                          </div>
                          <div className='mt-2'>
                            <p className='text-sm text-muted-foreground mb-1'>
                              Indicators:
                            </p>
                            <div className='flex flex-wrap gap-2'>
                              {member.indicators.map(indicator => (
                                <Badge
                                  key={indicator}
                                  variant='outline'
                                  className='text-xs'
                                >
                                  {indicator}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
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
                    onMoveReport={handleMoveReport}
                    onEditReport={handleEditReport}
                    onReviewReport={handleReviewReport}
                    onToggleReview={handleToggleReview}
                  />
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
                onChange={e => setReportDate(e.target.value)}
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
                      {/* Objective Row */}
                      <TableRow className='bg-muted/50'>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='h-6 w-6 p-0'
                              onClick={() =>
                                toggleReportObjectiveExpansion(objective.id)
                              }
                            >
                              {objective.isExpanded ? (
                                <ChevronDown className='h-4 w-4' />
                              ) : (
                                <ChevronRight className='h-4 w-4' />
                              )}
                            </Button>
                            <span className='font-medium'>
                              {objective.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                      </TableRow>

                      {/* Metrics Rows */}
                      {objective.isExpanded &&
                        objective.metrics.map(metric => (
                          <TableRow key={metric.id}>
                            <TableCell className='pl-8'>
                              <div className='flex items-center gap-2'>
                                <ArrowRight className='h-3 w-3 text-muted-foreground' />
                                <span>{metric.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {metric.plan !== undefined ? metric.plan : '—'}
                            </TableCell>
                            <TableCell>
                              <Input
                                type='number'
                                placeholder='Enter value'
                                value={metricValues[metric.id] || ''}
                                onChange={e =>
                                  handleMetricValueChange(
                                    metric.id,
                                    e.target.value
                                  )
                                }
                                className='w-full'
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
              <div className="grid gap-6">
                <label className="text-sm font-medium">Performance Review</label>
                <div className="rounded-md border p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Quantity Rating (0-5)</h4>
                      <Input
                        type="number"
                        min="0"
                        max="5"
                        value={reportQuantityRating}
                        onChange={(e) => setReportQuantityRating(Number(e.target.value))}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Quality Rating (0-5)</h4>
                      <Input
                        type="number"
                        min="0"
                        max="5"
                        value={reportQualityRating}
                        onChange={(e) => setReportQualityRating(Number(e.target.value))}
                        className="mt-2"
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
    </div>
  );
}
