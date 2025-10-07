export default function Loading() {
  return (
    <div className="min-h-screen w-full bg-primary-bg">
      {/* Skeleton loader that matches the page layout */}
      <div className="animate-pulse">
        {/* Header skeleton */}
        <div className="fixed top-0 w-full z-50 bg-primary-bg/80 backdrop-blur-xl border-b border-primary-border/90">
          <div className="container mx-auto px-6 h-16" />
        </div>

        {/* Hero skeleton */}
        <div className="h-[50vh] bg-gradient-to-b from-primary-bg to-secondary-bg" />

        {/* Content skeleton */}
        <div className="relative -mt-40 z-20">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="space-y-4">
              {/* Filter bar skeleton */}
              <div className="h-16 bg-secondary-bg/60 rounded-lg border border-primary-border/30" />
              
              {/* Content cards skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-48 bg-secondary-bg/60 rounded-lg border border-primary-border/30" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

