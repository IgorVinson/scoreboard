import { useEffect, useState } from 'react';
import { useData } from '@/contexts/data-context';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Settings } from 'lucide-react';

export function ModeToggle() {
  const { user } = useAuth();
  const { updateUser, getUserById, refreshData } = useData();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [isSoloMode, setIsSoloMode] = useState(false);

  // Fetch user data when user changes
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;
      const userData = await getUserById(user.id);
      setCurrentUser(userData);
      setIsSoloMode(userData?.mode === 'SOLO');
    };
    
    fetchUserData();
  }, [user, getUserById]);

  const handleModeChange = async (checked: boolean) => {
    if (currentUser) {
      await updateUser(currentUser.id, {
        mode: checked ? 'SOLO' : 'TEAM',
      });
      await refreshData();
      setIsSoloMode(checked);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant='ghost' size='icon'>
          <Settings className='h-5 w-5' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-80'>
        <div className='space-y-4'>
          <h4 className='font-medium leading-none'>Work Mode</h4>
          <div className='flex items-center space-x-2'>
            <Switch
              id='mode-switch'
              checked={isSoloMode}
              onCheckedChange={handleModeChange}
            />
            <Label htmlFor='mode-switch'>
              {isSoloMode ? 'Solo Mode (Self-managed)' : 'Team Mode'}
            </Label>
          </div>
          <p className='text-sm text-muted-foreground'>
            {isSoloMode
              ? 'You are currently working in solo mode. You manage your own metrics and reports.'
              : 'You are currently working in team mode. Your manager oversees your metrics and reports.'}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
