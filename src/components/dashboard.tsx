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

  // Update function for creating a report
  const handleCreateReport = async () => {
    try {
      const report = {
        date: reportDate,
        metrics_data: metricValues,
        today_notes: reportTodayNotes,
        tomorrow_notes: reportTomorrowNotes,
        general_comments: reportGeneralComments,
        user_id: user.id,
      };

      // Save the report to localStorage
      const reports = JSON.parse(localStorage.getItem('dailyReports') || '[]');
      reports.push({
        ...report,
        id: `report-${Date.now()}`,
        created_at: new Date().toISOString(),
      });
      localStorage.setItem('dailyReports', JSON.stringify(reports));

      // Close the form
      setMetricValues({});
      setReportDialogOpen(false);
    } catch (error) {
      console.error('Error creating report:', error);
    }
  };

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
                  <TabsTrigger value='team'>Team</TabsTrigger>
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
                <div className='grid gap-4 md:grid-cols-7'>
                  <Card className='md:col-span-5'>
                    <div className='p-6'>
                      <div className='flex justify-between items-center mb-6'>
                        <h3 className='text-lg font-semibold'>
                          Recent Reports
                        </h3>
                        <div className='flex gap-4'>
                          <Select
                            value={reportsIndicator}
                            onValueChange={setReportsIndicator}
                          >
                            <SelectTrigger className='w-[180px]'>
                              <SelectValue placeholder='Select Indicator' />
                            </SelectTrigger>
                            <SelectContent>
                              {allIndicators.map(indicator => (
                                <SelectItem key={indicator} value={indicator}>
                                  {indicator}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={reportsPeriod}
                            onValueChange={setReportsPeriod}
                          >
                            <SelectTrigger className='w-[180px]'>
                              <SelectValue placeholder='Select Period' />
                            </SelectTrigger>
                            <SelectContent>
                              {timePeriods.map(period => (
                                <SelectItem key={period} value={period}>
                                  {period}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Member</TableHead>
                            <TableHead>Indicator</TableHead>
                            <TableHead className='text-right'>Target</TableHead>
                            <TableHead className='text-right'>Actual</TableHead>
                            <TableHead className='text-right'>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredReports.map((report, i) => (
                            <TableRow key={i}>
                              <TableCell>{report.date}</TableCell>
                              <TableCell>{report.member}</TableCell>
                              <TableCell>{report.indicator}</TableCell>
                              <TableCell className='text-right'>
                                {report.target}
                              </TableCell>
                              <TableCell className='text-right'>
                                {report.value}
                              </TableCell>
                              <TableCell className='text-right'>
                                <Badge
                                  variant={
                                    report.status === 'above'
                                      ? 'default'
                                      : 'destructive'
                                  }
                                >
                                  {report.status === 'above' ? '↑' : '↓'}{' '}
                                  {report.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>
                  <Card className='md:col-span-2'>
                    <div className='p-6'>
                      <h3 className='text-lg font-semibold mb-4'>Calendar</h3>
                      <Calendar
                        mode='single'
                        selected={date}
                        onSelect={setDate}
                        className='rounded-md border'
                      />
                    </div>
                  </Card>
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
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setReportDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateReport}>Create Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
