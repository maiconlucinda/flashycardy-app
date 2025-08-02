import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DeckNotFound() {
  return (
    <div className="min-h-screen p-8">
      <main className="max-w-4xl mx-auto">
        <div className="mt-20">
          <Card className="max-w-lg mx-auto text-center">
            <CardHeader>
              <CardTitle className="text-2xl">Deck Not Found</CardTitle>
              <CardDescription>
                The deck you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This could happen if:
                </p>
                <ul className="text-sm text-muted-foreground text-left space-y-1">
                  <li>• The deck was deleted</li>
                  <li>• You don&apos;t own this deck</li>
                  <li>• The link is invalid</li>
                </ul>
                <div className="pt-4">
                  <Link href="/dashboard">
                    <Button>Back to Dashboard</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}