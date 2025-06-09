import React from 'react';

export function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-700 py-4">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-center space-x-6">
          {/* Renaissance Philanthropy Logo */}
          <a 
            href="https://www.renphil.org" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center hover:opacity-80 transition-opacity"
          >
            <img 
              src="/images/renaissance-philanthropy-light.png" 
              alt="Renaissance Philanthropy" 
              className="h-10 w-auto block dark:hidden"
            />
            <img 
              src="/images/renaissance-philanthropy-dark.png" 
              alt="Renaissance Philanthropy" 
              className="h-10 w-auto hidden dark:block"
            />
          </a>
          
          {/* Powered by ARIA Logo */}
          <a 
            href="https://www.aria.org.uk/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center hover:opacity-80 transition-opacity"
          >
            <img 
              src="/images/powered-by-aria-light.png" 
              alt="Powered by ARIA" 
              className="h-8 w-auto block dark:hidden"
            />
            <img 
              src="/images/powered-by-aria-dark.png" 
              alt="Powered by ARIA" 
              className="h-8 w-auto hidden dark:block"
            />
          </a>
        </div>
      </div>
    </footer>
  );
} 