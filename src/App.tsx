import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { Dashboard } from '@/components/dashboard';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="ui-theme">
      <Dashboard />
      <Toaster />
    </ThemeProvider>
  );
}

export default App;