import { useState } from 'react';
import { Button } from './ui/button';
import { MetricForm } from './MetricForm';
import { BarChart3, Sun, Moon, Monitor, LogOut } from 'lucide-react';
import { useTheme } from './theme-provider';
import { useAuth } from '@/contexts/auth-context';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { MetricFormData } from '@/types/metrics';

export const Header = () => {
  const { theme, setTheme } = useTheme();
  const { signOut, user } = useAuth();
  const [isMetricFormOpen, setIsMetricFormOpen] = useState(false);

  const [metrics, setMetrics] = useState<MetricFormData[]>([
    {
      name: 'Metric 1',
      description: 'Description 1',
      type: 'NUMERIC',
      measurement_unit: 'NUMBER',
    },
  ])

  console.log(metrics);

  const handleCreateMetric = (metricData: MetricFormData) => {
    console.log('New Metric:', metricData);
      setMetrics(prevMetrics => {
        const newMetrics = [...prevMetrics, metricData];
        console.log('All Metrics:', newMetrics); // This will show the actual updated list
        return newMetrics;
      });
    // Here you would typically make an API call to create the metric
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  return (
    <header className='border-b'>
      <div className='container flex h-16 items-center justify-between px-4'>
        <div className='flex items-center gap-6'>
          <BarChart3 className='h-6 w-6' />
          <h1 className='text-xl font-semibold'>Performance Dashboard</h1>
        </div>

        <div className='flex items-center gap-4'>
          <Button variant='outline' onClick={() => setIsMetricFormOpen(true)}>
            Add Metric
          </Button>

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
              <Button variant='ghost' className='relative h-9 w-9 rounded-full'>
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

      <MetricForm
        isOpen={isMetricFormOpen}
        onClose={() => setIsMetricFormOpen(false)}
        onSubmit={handleCreateMetric}
      />
    </header>
  );
};
