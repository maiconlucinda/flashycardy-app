'use client';

import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function BillingDebug() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <div>Loading billing debug...</div>;
  }

  if (!user) {
    return <div>User not authenticated</div>;
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Billing Debug Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">User ID:</span>
          <Badge variant="outline">{user.id}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium">Email:</span>
          <Badge variant="outline">{user.primaryEmailAddress?.emailAddress}</Badge>
        </div>
        <div className="text-xs text-muted-foreground mt-4">
          <p>Current URL: {typeof window !== 'undefined' ? window.location.href : 'Server'}</p>
        </div>
      </CardContent>
    </Card>
  );
}