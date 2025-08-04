'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';

export default function BillingSuccessPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Multiple redirect attempts for maximum reliability
    
    // Immediate attempt
    const immediate = setTimeout(() => {
      window.location.replace('/dashboard');
    }, 500);

    // Backup attempt  
    const backup = setTimeout(() => {
      window.location.href = '/dashboard';
    }, 2000);

    // Final fallback
    const final = setTimeout(() => {
      window.top!.location.href = '/dashboard';
    }, 4000);

    return () => {
      clearTimeout(immediate);
      clearTimeout(backup);
      clearTimeout(final);
    };
  }, []);

  // Immediate redirect if user is loaded
  useEffect(() => {
    if (isLoaded && user) {
      const immediateRedirect = setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
      
      return () => clearTimeout(immediateRedirect);
    }
  }, [isLoaded, user, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <Card className="max-w-md w-full text-center">
          <CardContent className="py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Processing your payment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    // If no user, redirect to home
    window.location.href = '/';
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Your subscription has been activated successfully. You now have access to all Pro features!
          </p>
          <div className="text-sm text-muted-foreground mb-4">
            Redirecting to dashboard in a few seconds...
          </div>
          <div className="space-y-2">
            <Button 
              onClick={() => window.location.href = '/dashboard'} 
              className="w-full"
            >
              Go to Dashboard Now
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/pricing'} 
              className="w-full"
            >
              View Plans
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}