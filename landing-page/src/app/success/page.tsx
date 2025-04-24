'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      return;
    }

    // Optional: Verify the session on the server
    async function verifySession() {
      try {
        const response = await fetch(`/api/verify-session?session_id=${sessionId}`);
        const data = await response.json();
        
        if (data.success) {
          setStatus('success');
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error('Error verifying session:', error);
        setStatus('error');
      }
    }

    // Uncomment this when you implement the verification endpoint
    // verifySession();
    
    // For now, just assume success
    setStatus('success');
  }, [sessionId]);

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Processing your subscription...</h1>
          <p className="text-lg text-gray-600 mb-8">Please wait while we confirm your payment.</p>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
          <p className="text-lg text-gray-600 mb-8">We couldn't confirm your subscription. Please contact support.</p>
          <Link href="/pricing" className="px-6 py-3 bg-primary text-white font-semibold rounded-full hover:bg-primary-accent">
            Return to pricing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Thank you for your subscription!</h1>
        <p className="text-lg text-gray-600 mb-8">Your account has been successfully upgraded.</p>
        <div className="space-y-4">
          <Link href="/dashboard" className="block px-6 py-3 bg-primary text-white font-semibold rounded-full hover:bg-primary-accent">
            Go to dashboard
          </Link>
          <Link href="/" className="block px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-full hover:bg-gray-300">
            Return to home page
          </Link>
        </div>
      </div>
    </div>
  );
} 