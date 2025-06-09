import { useState } from 'react';

export function Database() {
  const [isLoading, setIsLoading] = useState(true);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex justify-between items-center mb-8 pb-2 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-2xl">Database</h2>
      </div>
      
      <div className="w-full relative">
        {/* Loading Animation */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 z-10 rounded-lg border border-gray-300 dark:border-gray-600">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400 text-lg">Loading database...</p>
            <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">This may take a few moments</p>
          </div>
        )}
        
        {/* Airtable Iframe */}
        <iframe 
          className="airtable-embed w-full rounded-lg border border-gray-300 dark:border-gray-600" 
          src="https://airtable.com/embed/appsHJKmoFZDdVF7W/shrZsEz2ZR8X6ozYh" 
          frameBorder="0" 
          width="100%" 
          height="600"
          style={{ background: 'transparent' }}
          onLoad={handleIframeLoad}
        />
      </div>
    </main>
  );
} 