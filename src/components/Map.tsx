import React from 'react';

export function Map() {
  return (
    <div className="min-h-screen w-full transition-colors duration-200 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Event Map</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Explore events happening around London on our interactive map
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <iframe 
            style={{ border: '1px solid rgba(0, 0, 0, 0.1)' }}
            width="100%" 
            height="600" 
            src="https://www.pampam.city/p/XiqWeDFwiAEME5CkC7CG" 
            allowFullScreen
            className="w-full"
            title="Event Map"
          />
        </div>
        
        <div className="mt-6 text-sm text-gray-500 dark:text-gray-400 text-center">
          Interactive map powered by PamPam City
        </div>
      </main>
    </div>
  );
} 