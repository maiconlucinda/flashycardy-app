import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function DeckLoading() {
  return (
    <div className="min-h-screen p-8">
      <main className="max-w-4xl mx-auto">
        {/* Navigation skeleton */}
        <div className="mb-6">
          <Skeleton className="h-10 w-32 mb-4" />
        </div>

        {/* Deck header skeleton */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <Skeleton className="h-12 w-3/4 mb-2" />
              <Skeleton className="h-6 w-1/2" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
          
          <Skeleton className="h-4 w-40 mb-6" />

          {/* Action buttons skeleton */}
          <div className="flex gap-4">
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-12 w-28" />
            <Skeleton className="h-12 w-24" />
          </div>
        </div>

        {/* Cards section skeleton */}
        <div>
          <Skeleton className="h-8 w-32 mb-6" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index}>
                <CardHeader>
                  <Skeleton className="h-6 w-20" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Skeleton className="h-4 w-12 mb-2" />
                      <Skeleton className="h-5 w-full" />
                    </div>
                    <div>
                      <Skeleton className="h-4 w-12 mb-2" />
                      <Skeleton className="h-5 w-full" />
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <Skeleton className="h-3 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Study options skeleton */}
        <Card className="mt-8">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}