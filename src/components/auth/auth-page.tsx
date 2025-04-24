import { useState } from 'react';
import { AuthForm } from './auth-form';
import { useAuth } from '@/contexts/auth-context';
import { Navigate } from 'react-router-dom';

export function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const { user } = useAuth();
  
  // Redirect if already logged in
  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <AuthForm mode={mode} onToggleMode={() => setMode(mode === 'signin' ? 'signup' : 'signin')} />
    </div>
  );
} 