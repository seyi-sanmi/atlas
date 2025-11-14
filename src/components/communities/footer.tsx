import React from "react";

export function CommunitiesFooter() {
  return (
    <footer className="mt-8 bg-primary-bg/50 backdrop-blur-sm border-t border-primary-border/30">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Logos Section */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-6">
          {/* Renaissance Philanthropy Logo */}
          <a
            href="https://www.renphil.org"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center transition-all duration-200 hover:scale-105"
          >
            <img
              src="/images/renaissance-philanthropy-light.png"
              alt="Renaissance Philanthropy"
              className="h-8 w-auto opacity-70 group-hover:opacity-100 transition-opacity block dark:hidden"
            />
            <img
              src="/images/renaissance-philanthropy-dark.png"
              alt="Renaissance Philanthropy"
              className="h-8 w-auto opacity-70 group-hover:opacity-100 transition-opacity hidden dark:block"
            />
          </a>

          {/* Powered by ARIA Logo */}
          <a
            href="https://www.aria.org.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center transition-all duration-200 hover:scale-105"
          >
            <img
              src="/images/powered-by-aria-light.png"
              alt="Powered by ARIA"
              className="h-7 w-auto opacity-70 group-hover:opacity-100 transition-opacity block dark:hidden"
            />
            <img
              src="/images/powered-by-aria-dark.png"
              alt="Powered by ARIA"
              className="h-7 w-auto opacity-70 group-hover:opacity-100 transition-opacity hidden dark:block"
            />
          </a>
        </div>

        {/* Simple Copyright */}
        <div className="text-center">
          <p className="text-primary-text/40 text-xs">
            © 2025 Alliance of Talent Leaders Across Science
          </p>
        </div>
      </div>
    </footer>
  );
} 