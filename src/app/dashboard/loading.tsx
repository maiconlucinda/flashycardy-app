export default function DashboardLoading() {
  return (
    <div className="min-h-screen p-8 bg-background">
      <main className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="h-10 bg-muted rounded animate-pulse mb-4"></div>
          <div className="h-6 bg-muted rounded animate-pulse w-3/4"></div>
        </div>

        {/* Actions Section Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card p-6 rounded-lg shadow-md border border-border">
              <div className="h-6 bg-muted rounded animate-pulse mb-2"></div>
              <div className="h-4 bg-muted rounded animate-pulse w-2/3"></div>
            </div>
          ))}
        </div>

        {/* Decks Section Skeleton */}
        <div>
          <div className="h-8 bg-muted rounded animate-pulse mb-6 w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card p-6 rounded-lg shadow-md border border-border">
                <div className="h-6 bg-muted rounded animate-pulse mb-2"></div>
                <div className="h-4 bg-muted rounded animate-pulse mb-4"></div>
                <div className="h-4 bg-muted rounded animate-pulse w-1/2 mb-4"></div>
                <div className="flex gap-2">
                  <div className="h-8 bg-muted rounded animate-pulse w-16"></div>
                  <div className="h-8 bg-muted rounded animate-pulse w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}