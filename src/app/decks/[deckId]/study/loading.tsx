import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function StudyLoading() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      {/* Header Skeleton */}
      <div className="flex items-center gap-4 mb-8">
        <Skeleton className="h-6 w-32" />
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      
      {/* Study Header Card Skeleton */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8" />
              <div>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <div className="text-right">
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
          <Skeleton className="h-2 w-full mt-4" />
        </CardContent>
      </Card>

      {/* Main Study Card Skeleton */}
      <Card className="min-h-[400px] border-2">
        <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-8">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-3/4 max-w-md" />
          <Skeleton className="h-12 w-32" />
        </CardContent>
      </Card>
    </div>
  );
}