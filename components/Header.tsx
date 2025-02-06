import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MetricForm } from './MetricForm';
import { BarChart3, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

interface MetricFormData {
  name: string;
  description: string;
  type: 'NUMERIC' | 'PERCENTAGE' | 'BOOLEAN';
  measurement_unit: 'NUMBER' | 'PERCENTAGE' | 'TEXT';
}

export const Header = () => {
  const { theme, setTheme } = useTheme();
  const [isMetricFormOpen, setIsMetricFormOpen] = useState(false);

  const handleCreateMetric = (metricData: MetricFormData) => {
    console.log('New Metric:', metricData);
    // Here you would typically make an API call to create the metric
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
