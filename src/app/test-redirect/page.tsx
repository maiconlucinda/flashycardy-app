'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestRedirectPage() {
  const [method, setMethod] = useState<string>('');

  const testMethods = [
    {
      name: 'window.location.href',
      action: () => { window.location.href = '/dashboard'; setMethod('window.location.href'); }
    },
    {
      name: 'window.location.replace', 
      action: () => { window.location.replace('/dashboard'); setMethod('window.location.replace'); }
    },
    {
      name: 'API Route Redirect',
      action: () => { window.location.href = '/api/redirect-dashboard'; setMethod('API Route'); }
    },
    {
      name: 'Immediate Page',
      action: () => { window.location.href = '/billing/success/immediate'; setMethod('Immediate Page'); }
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Test Redirect Methods</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Test different redirect methods to see which works best for your billing flow.
          </p>
          {method && (
            <div className="p-2 bg-muted rounded text-sm">
              Last tested: {method}
            </div>
          )}
          <div className="space-y-2">
            {testMethods.map((test, index) => (
              <Button 
                key={index}
                onClick={test.action}
                variant="outline" 
                className="w-full"
              >
                {test.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}