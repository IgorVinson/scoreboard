import { useAuth } from '../contexts/auth-context';

export function LogoutButton() {
  const { signOut } = useAuth();
  
  const handleLogout = async () => {
    try {
      await signOut();
      console.log('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  return (
    <button onClick={handleLogout}>
      Log Out
    </button>
  );
}
