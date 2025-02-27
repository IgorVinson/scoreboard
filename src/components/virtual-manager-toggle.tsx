import { Button } from '@/components/ui/button';
import { useSoloMode } from '@/contexts/solo-mode-context';
import { Badge } from '@/components/ui/badge';
import { UserCog } from 'lucide-react';

export function VirtualManagerToggle() {
  const { isSoloMode, isVirtualManager, toggleVirtualManager } = useSoloMode();

  if (!isSoloMode) return null;

  return (
    <div className='flex items-center gap-2'>
      <Badge variant={isVirtualManager ? 'default' : 'outline'}>
        {isVirtualManager ? 'Manager View' : 'Regular View'}
      </Badge>
      <Button
        variant='ghost'
        size='sm'
        onClick={toggleVirtualManager}
        className='flex items-center gap-1'
      >
        <UserCog className='h-4 w-4' />
        {isVirtualManager ? 'Exit Manager View' : 'Switch to Manager View'}
      </Button>
    </div>
  );
}
