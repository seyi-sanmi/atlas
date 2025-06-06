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
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-600">
      <div className="px-2 md:px-3 h-14 flex items-end">
        <div className="py-2 sm:p-2 flex items-end w-full border-b border-gray-200 dark:border-gray-600">
          {/* Left side - Logo/Title */}
          <div className="flex items-center">
            {isSplitView ? (
              <button
                onClick={onCloseSplitView}
                className="flex items-center gap-2 leading-none md:hidden"
              >
                <ArrowLeft className="w-6 h-6" />
                <span>back</span>
              </button>
            ) : null}
            
            <button
              onClick={onNavigateToEvents}
              className={`leading-4 w-min font-normal ${isSplitView ? 'hidden md:block' : ''}`}
            >
              <div className="flex flex-col">
                <span className="text-lg font-medium">ATLAS Events</span>
                <span className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">UK</span>
              </div>
            </button>
          </div>
          
          {/* Search Input */}
          <input
            className={`bg-transparent flex-1 px-3 focus:outline-none text-base ${isSplitView ? 'hidden md:block' : ''}`}
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => onSearch?.(e.target.value)}
          />
          
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
            
            {/* Add Event Button */}
            <button
              onClick={onAddEvent}
              className="flex items-center gap-1 text-sm hover:underline"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add</span>
            </button>
            
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
    </header>
  );
}