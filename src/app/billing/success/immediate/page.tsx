'use client';

import { useEffect } from 'react';

export default function ImmediateRedirectPage() {
  useEffect(() => {
    // Immediate redirect without any UI
    window.location.replace('/dashboard');
  }, []);

  // Show minimal loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p>Redirecting...</p>
      </div>
    </div>
  );
}