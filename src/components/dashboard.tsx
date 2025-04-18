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
import { useData } from '@/contexts/data-context';
import { ModeToggle } from '@/components/mode-toggle';
import { VirtualManagerToggle } from '@/components/virtual-manager-toggle';
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
import { createObjective, updateObjective, deleteObjective } from '@/lib/supabase-service';
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
} from '@/queries';

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
  const {
    metrics,
    plans,
    dailyReports,
    getPlansByUser,
    getDailyReportsByUser,
    getDailyNotes,
    saveDailyNotes,
  } = useData();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedIndicator, setSelectedIndicator] = useState('All Indicators');
  const [selectedPeriod, setSelectedPeriod] = useState('Daily');
  const [reportsIndicator, setReportsIndicator] = useState('All Indicators');
  const [reportsPeriod, setReportsPeriod] = useState('Daily');
  const [objectives, setObjectives] = useState<Objective[]>([]);
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

  // Use the context version of getDailyNotes and saveDailyNotes
  // Keep the useEffect for loading and saving notes from data-context
  // Load daily notes from Supabase
  useEffect(() => {
    const loadNotes = async () => {
      try {
        setIsLoadingNotes(true);
        const notes = await getDailyNotes();
        if (notes) {
          setTodayNotes(notes.today_notes || '');
          setTomorrowNotes(notes.tomorrow_notes || '');
          setGeneralComments(notes.general_comments || '');
        }
      } catch (error) {
        console.error('Error loading notes:', error);
      } finally {
        setIsLoadingNotes(false);
      }
    };

    if (user) {
      loadNotes();
    }
  }, [user, getDailyNotes]);

  // Save notes to Supabase with debounce
  useEffect(() => {
    if (isLoadingNotes) return; // Don't save during initial load
    
    const saveTimeout = setTimeout(async () => {
      try {
        await saveDailyNotes({
          today_notes: todayNotes,
          tomorrow_notes: tomorrowNotes,
          general_comments: generalComments
        });
      } catch (error) {
        console.error('Error saving notes:', error);
      }
    }, 1000);

    return () => clearTimeout(saveTimeout);
  }, [todayNotes, tomorrowNotes, generalComments, saveDailyNotes, isLoadingNotes]);

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
            isExpanded: false
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

  // Add new state variables for report
  const [reportTodayNotes, setReportTodayNotes] = useState('');
  const [reportTomorrowNotes, setReportTomorrowNotes] = useState('');
  const [reportGeneralComments, setReportGeneralComments] = useState('');

  // Add the missing strictModeEnabled state
  const [strictModeEnabled, setStrictModeEnabled] = useState(false);
  const [resultReportDialogOpen, setResultReportDialogOpen] = useState(false);
  const [missingSurveyOpen, setMissingSurveyOpen] = useState(false);
  const [missingDates, setMissingDates] = useState<string[]>([]);
  const [currentMissingIndex, setCurrentMissingIndex] = useState(0);

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
  const userPlans = user?.id ? getPlansByUser(user.id) : [];
  const userReports = user?.id ? getDailyReportsByUser(user.id) : [];

  const shouldShowManagerView =
    isVirtualManager || (!isSoloMode && user?.role === 'MANAGER');

  // Add the missing toggleStrictMode function
  const toggleStrictMode = () => {
    setStrictModeEnabled(prev => !prev);
  };

  // Add missing handler functions
  const handleObjectivesChange = (updatedObjectives: Objective[]) => {
    setObjectives(updatedObjectives);
  };
  
  // Add reportObjectives state and toggle function
  const [reportObjectives, setReportObjectives] = useState<Objective[]>([]);
  
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
  
  // Add report related state
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
  
  // Add missing helper functions
  const calculateDailyPlanValue = (metric: any) => {
    if (!metric.plan) return '0';
    return String(metric.plan);
  };
  
  // Add missing handler functions
  const handleDeleteReport = () => {
    console.log('Delete report');
  };
  
  const handleEditReport = () => {
    console.log('Edit report');
  };
  
  const handleReviewReport = () => {
    console.log('Review report');
  };
  
  const handleToggleReview = () => {
    console.log('Toggle review');
  };
  
  const handleOpenReport = () => {
    setReportDialogOpen(true);
  };
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReportDate(e.target.value);
  };
  
  const handleCreateReport = () => {
    console.log('Create report');
    setReportDialogOpen(false);
  };
  
  const handleUpdateReport = () => {
    console.log('Update report');
    setReportDialogOpen(false);
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
                        key={`today-${todayNotes ? todayNotes.slice(0, 10) : 'empty'}`}
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
                        key={`tomorrow-${tomorrowNotes ? tomorrowNotes.slice(0, 10) : 'empty'}`}
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
                      key={`general-${generalComments ? generalComments.slice(0, 10) : 'empty'}`}
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
                    key={`report-today-${reportTodayNotes ? reportTodayNotes.slice(0, 10) : 'empty'}`}
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
                    key={`report-tomorrow-${reportTomorrowNotes ? reportTomorrowNotes.slice(0, 10) : 'empty'}`}
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
                    key={`report-general-${reportGeneralComments ? reportGeneralComments.slice(0, 10) : 'empty'}`}
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
