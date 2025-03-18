import { useState } from 'react';
import { useAuth } from '../contexts/auth-context';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    
    try {
      await signInWithGoogle();
      // The page will redirect to Google
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };
  
  return (
    <div>
      {error && <div className="error">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
      
      <div className="or-divider">OR</div>
      
      <button 
        type="button" 
        onClick={handleGoogleSignIn} 
        disabled={loading}
        className="google-button"
      >
        Continue with Google
      </button>
    </div>
  );
} 