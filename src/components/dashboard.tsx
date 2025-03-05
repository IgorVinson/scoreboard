import { useState, useEffect } from 'react';
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

// Mock data
const teamMembers = [
  {
    id: 1,
    name: 'Sarah Chen',
    role: 'MANAGER',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
    indicators: ['Sales Performance', 'Client Satisfaction'],
  },
  {
    id: 2,
    name: 'Alex Kim',
    role: 'EMPLOYEE',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36',
    indicators: ['Business Proposals', 'Lead Generation'],
  },
  {
    id: 3,
    name: 'Maria Garcia',
    role: 'EMPLOYEE',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80',
    indicators: ['Customer Support', 'Response Time'],
  },
];

const allIndicators = [
  'All Indicators',
  'Business Proposals',
  'Customer Support',
  'Lead Generation',
  'Sales Performance',
  'Client Satisfaction',
  'Response Time',
];

const timePeriods = ['Daily', 'Weekly', 'Monthly'];

const reports = [
  {
    date: '2024-01-29',
    member: 'Alex Kim',
    indicator: 'Business Proposals',
    value: 6,
    target: 5,
    status: 'above',
  },
  {
    date: '2024-01-29',
    member: 'Maria Garcia',
    indicator: 'Response Time',
    value: 15,
    target: 20,
    status: 'below',
  },
  {
    date: '2024-01-28',
    member: 'Alex Kim',
    indicator: 'Lead Generation',
    value: 12,
    target: 10,
    status: 'above',
  },
];

const indicators = [
  {
    name: 'Business Proposals',
    plan: 100,
    actual: 85,
    member: 'Alex Kim',
    progress: 85,
  },
  {
    name: 'Customer Support Tickets',
    plan: 50,
    actual: 47,
    member: 'Maria Garcia',
    progress: 94,
  },
  {
    name: 'Lead Generation',
    plan: 200,
    actual: 180,
    member: 'Alex Kim',
    progress: 90,
  },
];

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
  const [todayNotes, setTodayNotes] = useState('');
  const [tomorrowNotes, setTomorrowNotes] = useState('');
  const [generalComments, setGeneralComments] = useState('');
  const [objectives, setObjectives] = useState<Objective[]>([
    {
      id: 'obj-1',
      name: 'Get new job',
      description: 'Find a new position in web development',
      isExpanded: true,
      metrics: [
        {
          id: 'metric-1',
          name: 'JS tasks',
          description: 'Complete JavaScript coding challenges',
        },
        {
          id: 'metric-2',
          name: 'GreatFrontend',
          description: 'Finish GreatFrontend exercises',
        },
        {
          id: 'metric-3',
          name: 'React course',
          description: 'Complete advanced React course',
        },
      ],
    },
  ]);

  const filteredIndicators =
    selectedIndicator === 'All Indicators'
      ? indicators
      : indicators.filter(i => i.name === selectedIndicator);

  const filteredReports =
    reportsIndicator === 'All Indicators'
      ? reports
      : reports.filter(r => r.indicator === reportsIndicator);

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

  // Load existing notes for today
  useEffect(() => {
    if (user?.id) {
      const today = new Date().toISOString().split('T')[0];
      const todayReport = dailyReports.find(
        report => report.user_id === user.id && report.date === today
      );

      if (todayReport) {
        setTodayNotes(todayReport.today_notes || '');
        setTomorrowNotes(todayReport.tomorrow_notes || '');
        setGeneralComments(todayReport.general_comments || '');
      }
    }
  }, [user?.id, dailyReports]);

  const handleSaveNotes = async () => {
    try {
      // Check if there's an existing report for today
      const today = new Date().toISOString().split('T')[0];
      const existingReport = dailyReports.find(
        report => report.user_id === user.id && report.date === today
      );

      if (existingReport) {
        // Update existing report
        const updatedReport = {
          ...existingReport,
          today_notes: todayNotes,
          tomorrow_notes: tomorrowNotes,
          general_comments: generalComments,
          updated_at: new Date().toISOString(),
        };

        // Here you would call your update function from the data context
        // For example: updateDailyReport(existingReport.id, updatedReport);
      } else {
        // Create new report
        const newReport = {
          user_id: user.id,
          date: today,
          metrics_data: {},
          today_notes: todayNotes,
          tomorrow_notes: tomorrowNotes,
          general_comments: generalComments,
        };

        // Here you would call your create function from the data context
        // For example: createDailyReport(newReport);
      }

      // Show success message
      // toast({
      //   title: "Notes saved",
      //   description: "Your notes have been saved successfully.",
      // });
    } catch (error) {
      console.error('Error saving notes:', error);
      // Show error message
      // toast({
      //   title: "Error saving notes",
      //   description: "There was a problem saving your notes.",
      //   variant: "destructive",
      // });
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
                  <TabsTrigger value='team'>Team</TabsTrigger>
                  <TabsTrigger value='reports'>Reports</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value='overview' className='p-6'>
                <div className='grid gap-6'>
                  <ObjectivesMetricsTable
                    objectives={objectives}
                    onObjectivesChange={setObjectives}
                  />

                  <div className='flex justify-between items-center mb-6'>
                    <h3 className='text-lg font-semibold'>
                      Indicators Overview
                    </h3>
                    <div className='flex gap-4'>
                      <Select
                        value={selectedIndicator}
                        onValueChange={setSelectedIndicator}
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
                        value={selectedPeriod}
                        onValueChange={setSelectedPeriod}
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
                        <TableHead>Indicator</TableHead>
                        <TableHead>Member</TableHead>
                        <TableHead className='text-right'>Plan</TableHead>
                        <TableHead className='text-right'>Actual</TableHead>
                        <TableHead className='text-right'>Progress</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredIndicators.map(indicator => (
                        <TableRow key={indicator.name}>
                          <TableCell className='font-medium'>
                            {indicator.name}
                          </TableCell>
                          <TableCell>{indicator.member}</TableCell>
                          <TableCell className='text-right'>
                            {indicator.plan}
                          </TableCell>
                          <TableCell className='text-right'>
                            {indicator.actual}
                          </TableCell>
                          <TableCell className='text-right'>
                            <Badge
                              variant={
                                indicator.progress >= 90
                                  ? 'default'
                                  : indicator.progress >= 70
                                  ? 'secondary'
                                  : 'destructive'
                              }
                            >
                              {indicator.progress}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
                    placeholder='What did you accomplish today?'
                    onChange={setTodayNotes}
                  />
                </div>
                <div>
                  <h4 className='font-medium mb-3 text-sm text-muted-foreground'>
                    Tomorrow's Plan
                  </h4>
                  <NotesEditor
                    id='tomorrow-notes'
                    content={tomorrowNotes}
                    placeholder='What do you plan to work on tomorrow?'
                    onChange={setTomorrowNotes}
                  />
                </div>
              </div>
              <div className='mt-6'>
                <h4 className='font-medium mb-3 text-sm text-muted-foreground'>
                  General Comments
                </h4>
                <NotesEditor
                  content={generalComments}
                  placeholder='Any other thoughts or comments...'
                  onChange={setGeneralComments}
                />
              </div>
              <div className='mt-6 flex justify-end'>
                <Button onClick={handleSaveNotes}>Save Notes</Button>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
