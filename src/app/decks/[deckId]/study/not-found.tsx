import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function StudyNotFound() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <Card className="text-center py-16">
        <CardContent className="space-y-6">
          <div className="text-6xl">📚</div>
          <div>
            <h1 className="text-2xl font-bold mb-2">Study Session Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The study session you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to access it.
            </p>
          </div>
          <div className="flex gap-4 justify-center">
            <Link href="/dashboard">
              <Button variant="outline">
                Go to Dashboard
              </Button>
            </Link>
            <Link href="/">
              <Button>
                Go Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}