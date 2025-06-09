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
  
  return (
    <div className="w-full h-header bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-600 sticky top-0 z-40">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-3 flex items-center justify-between w-full">
          {/* Left side - Logo/Title */}
          <div className="flex items-center">
            {/* Renaissance Philanthropy Logo */}
            <div className="h-8 w-auto mr-3">
              <svg 
                id="Layer_1" 
                data-name="Layer 1" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 293.42 378.67"
                className="h-7 w-auto"
              >
                <defs>
                  <style>
                    {`.cls-1 {
                      fill-rule: evenodd;
                    }
                    .cls-1, .cls-2 {
                      fill: ${theme === 'dark' ? '#FFFFFF' : '#f87248'};
                      stroke-width: 0px;
                    }`}
                  </style>
                </defs>
                <path className="cls-2" d="M88.52,152.44c3.83-28.5,28.41-50.49,58.18-50.49,32.42,0,58.69,26.08,58.69,58.26,0,17.07-7.4,32.43-19.19,43.09-2.65,2.39-3.03,6.53-.66,9.19,5.71,6.39,10.91,13.25,15.51,20.52,1.86,2.94,5.87,3.8,8.55,1.57,21.35-17.81,34.92-44.51,34.92-74.36,0-53.62-43.8-97.09-97.82-97.09s-94.61,40.36-97.65,91.27c-.19,3.21,2.45,5.83,5.7,5.83h13.7c3.98,0,6.04,0,11.82.44,5.79.43,7.22-.44,8.26-8.2Z"/>
                <path className="cls-1" d="M48.87,185.45c0-3.22,2.63-5.83,5.87-5.83h13.7c73.67,0,133.75,57.73,136.83,130.1.14,3.21-2.5,5.83-5.75,5.83h-27.39c-3.24,0-5.85-2.61-6.04-5.83-3.04-50.91-45.59-91.27-97.65-91.27h-13.7c-3.24,0-5.87-2.61-5.87-5.83v-27.19Z"/>
              </svg>
            </div>

            {/* ATLAS Title */}
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                ATLAS
              </h1>
            </div>

            {isSplitView && (
              <button
                onClick={onCloseSplitView}
                className="flex items-center gap-2 ml-6 leading-none md:hidden"
              >
                <ArrowLeft className="w-6 h-6" />
                <span>back</span>
              </button>
            )}
          </div>
          
          {/* Center - Navigation */}
          <nav className="flex items-center gap-8">
            <button
              onClick={onNavigateToEvents}
              className={`font-medium transition-colors text-sm ${
                currentPage === 'events' 
                  ? 'text-gray-900 dark:text-white underline underline-offset-[6px] decoration-2' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Events
            </button>
            
            <button
              onClick={onNavigateToMap}
              className={`font-medium transition-colors text-sm ${
                currentPage === 'map' 
                  ? 'text-gray-900 dark:text-white underline underline-offset-[6px] decoration-2' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Map
            </button>
            
            <button
              onClick={onNavigateToDatabase}
              className={`font-medium transition-colors text-sm ${
                currentPage === 'database' 
                  ? 'text-gray-900 dark:text-white underline underline-offset-[6px] decoration-2' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Database
            </button>
            
            <button 
              onClick={onAddEvent}
              className="font-medium transition-colors text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add Event
            </button>
          </nav>
          
          {/* Right side - Actions */}
          <div className="flex items-center gap-1">
            {/* Database Toggle */}
            <button 
              onClick={onToggleDatabase}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
              title={useSupabase ? 'Using Supabase Database' : 'Using In-Memory Storage'}
            >
              {useSupabase ? <Database className="w-4 h-4" /> : <HardDrive className="w-4 h-4" />}
            </button>
            
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme} 
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
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