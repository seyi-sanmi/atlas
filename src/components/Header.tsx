import React from 'react';
import { useTheme } from './ThemeProvider';
import { MoonIcon, SunIcon, Plus, Database, HardDrive } from 'lucide-react';

interface HeaderProps {
  onAddEvent?: () => void;
  onNavigateToMap?: () => void;
  onNavigateToEvents?: () => void;
  onNavigateToDatabase?: () => void;
  currentPage?: 'events' | 'map' | 'database';
  useSupabase?: boolean;
  onToggleDatabase?: () => void;
}

export function Header({ 
  onAddEvent, 
  onNavigateToMap, 
  onNavigateToEvents, 
  onNavigateToDatabase, 
  currentPage = 'events',
  useSupabase = true,
  onToggleDatabase
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4 max-w-6xl">
        <div className="flex items-center justify-between">
          {/* Left side: Short Logo and Title */}
          <div className="flex items-center space-x-4">
            {/* Short Renaissance Philanthropy Logo */}
            <a 
              href="https://www.renphil.org" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center hover:opacity-80 transition-opacity"
            >
              <img 
                src="/images/Renaissance Philanthropy_Short_Orange_RGB.svg" 
                alt="Renaissance Philanthropy" 
                className="h-8 w-auto"
              />
            </a>
            
            {/* Title - Clickable to navigate back to events */}
            <button
              onClick={onNavigateToEvents}
              className="text-xl font-bold hover:text-gray-700 dark:hover:text-gray-300 transition-colors cursor-pointer"
            >
              ATLAS
            </button>
          </div>
          
          {/* Center: Navigation Links */}
          <nav className="flex items-center space-x-8">
              <button
                onClick={onNavigateToEvents}
                className={`font-medium transition-colors ${
                  currentPage === 'events' 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                Events
              </button>
              
              <button
                onClick={onNavigateToMap}
                className={`font-medium transition-colors ${
                  currentPage === 'map' 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                Map
              </button>
              
              <button
                onClick={onNavigateToDatabase}
                className={`font-medium transition-colors ${
                  currentPage === 'database' 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                Database
              </button>
          </nav>
          
          {/* Right side: Actions */}
          <div className="flex items-center space-x-4">
            {/* Add Event Button */}
            <button
              onClick={onAddEvent}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Event</span>
            </button>
            
            {/* Database Toggle */}
            <button 
              onClick={onToggleDatabase}
              className={`p-2 rounded-full transition-colors ${
                useSupabase 
                  ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              title={useSupabase ? 'Using Supabase Database' : 'Using In-Memory Storage'}
            >
              {useSupabase ? <Database className="w-5 h-5" /> : <HardDrive className="w-5 h-5" />}
            </button>
            
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" 
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}