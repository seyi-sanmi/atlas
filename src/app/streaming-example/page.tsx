import { Suspense } from 'react';
import { ServerEventsList } from '@/components/ServerEventsList';
import { ServerCommunitiesList } from '@/components/ServerCommunitiesList';

// Example of React 18 Suspense streaming
// This page demonstrates how to stream different parts independently

export default function StreamingExample() {
  return (
    <div className="min-h-screen bg-primary-bg p-8">
      <h1 className="text-3xl font-bold text-primary-text mb-8">
        React 18 Streaming Example
      </h1>
      
      <div className="space-y-8">
        {/* Events stream independently */}
        <section>
          <h2 className="text-2xl font-semibold text-primary-text mb-4">Events</h2>
          <Suspense fallback={
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-secondary-bg rounded-lg" />
              ))}
            </div>
          }>
            <ServerEventsList />
          </Suspense>
        </section>

        {/* Communities stream independently */}
        <section>
          <h2 className="text-2xl font-semibold text-primary-text mb-4">Communities</h2>
          <Suspense fallback={
            <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-48 bg-secondary-bg rounded-lg" />
              ))}
            </div>
          }>
            <ServerCommunitiesList />
          </Suspense>
        </section>
      </div>
    </div>
  );
}

