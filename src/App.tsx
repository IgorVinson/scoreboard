import { AuthProvider } from './contexts/auth-context';
import { Dashboard } from './components/dashboard'; // Replace YourMainComponent with Dashboard

function App() {
  return (
    <AuthProvider>
      <Dashboard />
    </AuthProvider>
  );
}

export default App;
