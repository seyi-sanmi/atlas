import React from 'react';
import { useTheme } from './ThemeProvider';
import { MoonIcon, SunIcon, Plus, Database, HardDrive, ArrowLeft } from 'lucide-react';

interface HeaderProps {
  onAddEvent?: () => void;
  onNavigateToMap?: () => void;
  onNavigateToEvents?: () => void;
  onNavigateToDatabase?: () => void;
  currentPage?: 'events' | 'map' | 'database';
  useSupabase?: boolean;
  onToggleDatabase?: () => void;
  onSearch?: (query: string) => void;
  searchQuery?: string;
  isSplitView?: boolean;
  onCloseSplitView?: () => void;
}

export function Header({ 
  onAddEvent, 
  onNavigateToMap, 
  onNavigateToEvents, 
  onNavigateToDatabase, 
  currentPage = 'events',
  useSupabase = true,
  onToggleDatabase,
  onSearch,
  searchQuery = '',
  isSplitView = false,
  onCloseSplitView
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const [logoError, setLogoError] = React.useState(false);
  
  return (
    <div className="w-full h-header bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-600 sticky top-0 z-40">
      <div className="max-w-[75%] mx-auto">
        <div className="py-2 sm:p-2 flex items-end w-full">
          {/* Left side - Logo/Title */}
          <div className="flex items-center">
            {/* Hard-coded Renaissance Philanthropy Logo */}
            <div className="h-8 w-auto mr-4">
              <svg 
                id="Layer_1" 
                data-name="Layer 1" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 293.42 378.67"
                className="h-8 w-auto"
              >
                <defs>
                  <style>
                    {`.cls-1 {
                      fill-rule: evenodd;
                    }
                    .cls-1, .cls-2 {
                      fill: #f87248;
                      stroke-width: 0px;
                    }`}
                  </style>
                </defs>
                <path className="cls-2" d="M88.52,152.44c3.83-28.5,28.41-50.49,58.18-50.49,32.42,0,58.69,26.08,58.69,58.26,0,17.07-7.4,32.43-19.19,43.09-2.65,2.39-3.03,6.53-.66,9.19,5.71,6.39,10.91,13.25,15.51,20.52,1.86,2.94,5.87,3.8,8.55,1.57,21.35-17.81,34.92-44.51,34.92-74.36,0-53.62-43.8-97.09-97.82-97.09s-94.61,40.36-97.65,91.27c-.19,3.21,2.45,5.83,5.7,5.83h13.7c3.98,0,6.04,0,11.82.44,5.79.43,7.22-.44,8.26-8.2Z"/>
                <path className="cls-1" d="M48.87,185.45c0-3.22,2.63-5.83,5.87-5.83h13.7c73.67,0,133.75,57.73,136.83,130.1.14,3.21-2.5,5.83-5.75,5.83h-27.39c-3.24,0-5.85-2.61-6.04-5.83-3.04-50.91-45.59-91.27-97.65-91.27h-13.7c-3.24,0-5.87-2.61-5.87-5.83v-27.19Z"/>
              </svg>
            </div>

            {isSplitView ? (
              <button
                onClick={onCloseSplitView}
                className="flex items-center gap-2 leading-none md:hidden"
              >
                <ArrowLeft className="w-6 h-6" />
                <span>back</span>
              </button>
            ) : null}
          </div>
          

          
          {/* Right side - Actions */}
          <div className="flex items-center gap-3">
            {/* Navigation - Mobile */}
            <div className="flex items-center gap-4 md:hidden">
              <button
                onClick={onNavigateToEvents}
                className={`text-sm ${currentPage === 'events' ? 'underline' : ''}`}
              >
                Events
              </button>
              <button
                onClick={onNavigateToMap}
                className={`text-sm ${currentPage === 'map' ? 'underline' : ''}`}
              >
                Map
              </button>
            </div>
            
            {/* Navigation - Desktop */}
            <nav className="hidden md:flex items-center gap-6">
              <button
                onClick={onNavigateToEvents}
                className={`font-medium transition-colors hover:underline ${
                  currentPage === 'events' ? 'underline' : ''
                }`}
              >
                Events
              </button>
              
              <button
                onClick={onNavigateToMap}
                className={`font-medium transition-colors hover:underline ${
                  currentPage === 'map' ? 'underline' : ''
                }`}
              >
                Map
              </button>
              
              <button
                onClick={onNavigateToDatabase}
                className={`font-medium transition-colors hover:underline ${
                  currentPage === 'database' ? 'underline' : ''
                }`}
              >
                Database
              </button>
            </nav>
            

            
            {/* Database Toggle */}
            <button 
              onClick={onToggleDatabase}
              className="p-1"
              title={useSupabase ? 'Using Supabase Database' : 'Using In-Memory Storage'}
            >
              {useSupabase ? <Database className="w-4 h-4" /> : <HardDrive className="w-4 h-4" />}
            </button>
            
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme} 
              className="p-1"
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? <MoonIcon className="w-4 h-4" /> : <SunIcon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}