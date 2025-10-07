export default function Loading() {
  return (
    <div className="min-h-screen w-full bg-primary-bg">
      {/* Skeleton loader for funding page */}
      <div className="animate-pulse">
        {/* Header skeleton */}
        <div className="fixed top-0 w-full z-50 bg-primary-bg/80 backdrop-blur-xl border-b border-primary-border/90">
          <div className="container mx-auto px-6 h-16" />
        </div>

        {/* Hero skeleton */}
        <div className="h-[52.5vh] bg-gradient-to-b from-primary-bg to-secondary-bg" />

        {/* Content skeleton */}
        <div className="relative -mt-28 z-20">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="space-y-8">
              {/* Filter bar skeleton */}
              <div className="h-16 bg-secondary-bg/60 rounded-lg border border-primary-border/30" />
              
              {/* Funding cards skeleton */}
              {[1, 2].map((section) => (
                <div key={section} className="space-y-4">
                  <div className="h-10 w-64 bg-secondary-bg/60 rounded-lg border border-primary-border/30" />
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-0 bg-secondary-bg rounded-lg border border-primary-border">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-48 bg-primary-bg/40 border border-primary-border/30" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

