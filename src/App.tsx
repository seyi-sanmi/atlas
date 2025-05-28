import { useState, useEffect } from 'react';
import { ThemeProvider } from './components/ThemeProvider';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { EventsList } from './components/EventsList';
import { EventDetails } from './components/EventDetails';
import { SubmitEventModal } from './components/SubmitEventModal';
import { ReviewEventModal } from './components/ReviewEventModal';
import { Map } from './components/Map';
import { Database } from './components/Database';
import { Event } from './data/events';
import { getAllEvents as getSupabaseEvents, addEvent as addSupabaseEvent } from './data/supabaseEventStore';
import { getAllEvents as getMemoryEvents, addEvent as addMemoryEvent } from './data/eventStore';
import { isSupabaseAvailable } from './lib/supabase';
import { scrapeEvent } from './utils/eventScraperService';

export function App() {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isSplitView, setIsSplitView] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refresh, setRefresh] = useState(0); // Used to trigger a refresh
  const [currentPage, setCurrentPage] = useState<'events' | 'map' | 'database'>('events');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scrapedEvent, setScrapedEvent] = useState<Omit<Event, 'id'> | null>(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [useSupabase, setUseSupabase] = useState(false); // Start with in-memory storage by default
  
  // Load events on mount and when refresh changes
  useEffect(() => {
    const loadEvents = async () => {
      setIsLoadingEvents(true);
      try {
        let allEvents: Event[];
        if (useSupabase) {
          allEvents = await getSupabaseEvents();
        } else {
          allEvents = getMemoryEvents();
        }
        setEvents(allEvents);
        setFilteredEvents(allEvents);
      } catch (error) {
        console.error('Error loading events:', error);
        // If Supabase fails, fall back to in-memory storage
        if (useSupabase) {
          console.log('Falling back to in-memory storage');
          const allEvents = getMemoryEvents();
          setEvents(allEvents);
          setFilteredEvents(allEvents);
        }
      } finally {
        setIsLoadingEvents(false);
      }
    };
    
    loadEvents();
  }, [refresh, useSupabase]);
  
  // Filter events based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredEvents(events);
    } else {
      const filtered = events.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.organizer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredEvents(filtered);
    }
  }, [searchQuery, events]);
  
  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event);
    setIsSplitView(true);
  };
  
  const handleClose = () => {
    setIsSplitView(false);
    // Wait for transition to complete before clearing selection
    setTimeout(() => setSelectedEvent(null), 300);
  };

  const handleExtract = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setScrapedEvent(null);
    
    try {
      console.log(`Extracting event data from: ${url}`);
      
      // Make the actual API call to scrape the event
      const eventData = await scrapeEvent(url);
      console.log('Extracted event data:', eventData);
      
      // Create a new event object with all required fields
      const newEvent: Omit<Event, 'id'> = {
        title: eventData.title || 'Untitled Event',
        description: eventData.description || '',
        location: eventData.location || 'TBD',
        organizer: eventData.organizer || 'Unknown',
        presented_by: eventData.presented_by || undefined,
        date: eventData.date || new Date().toISOString().split('T')[0],
        time: eventData.time || '00:00 - 00:00',
        categories: eventData.categories || [],
        url: url,
        links: eventData.links || []
      };
      
      console.log('New event to be reviewed:', newEvent);
      
      // Save the scraped event data for review
      setScrapedEvent(newEvent);
      
      // Close the submit modal and open the review modal
      setShowSubmitModal(false);
      setShowReviewModal(true);
    } catch (err) {
      console.error('Error during event extraction:', err);
      setError(err instanceof Error ? err.message : 'Failed to extract event data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEvent = async (eventData: Omit<Event, 'id'>) => {
    try {
      let addedEvent: Event | null;
      
      if (useSupabase) {
        // Add the event to Supabase
        addedEvent = await addSupabaseEvent(eventData);
      } else {
        // Add the event to in-memory storage
        addedEvent = addMemoryEvent(eventData);
      }
      
      if (addedEvent) {
        setRefresh(prev => prev + 1); // Trigger a refresh
        
        // Close the review modal
        setShowReviewModal(false);
        
        // Show a success message
        alert(`Successfully added event: ${addedEvent.title}`);
      } else {
        alert('Failed to save event. Please try again.');
      }
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Error saving event. Please try again.');
    }
  };
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleNavigateToMap = () => {
    setCurrentPage('map');
    setIsSplitView(false);
    setSelectedEvent(null);
  };

  const handleNavigateToEvents = () => {
    setCurrentPage('events');
  };

  const handleNavigateToDatabase = () => {
    setCurrentPage('database');
    setIsSplitView(false);
    setSelectedEvent(null);
  };

  const handleToggleDatabase = () => {
    // If trying to switch to Supabase, check if it's available
    if (!useSupabase && !isSupabaseAvailable()) {
      alert('Supabase is not configured. Please set up your environment variables to use Supabase database.');
      return;
    }
    
    setUseSupabase(prev => !prev);
    // Show a notification about the switch
    setTimeout(() => {
      alert(`Switched to ${!useSupabase ? 'Supabase' : 'In-Memory'} storage. Events will reload.`);
    }, 100);
  };

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showFilterDropdown && !target.closest('.filter-dropdown')) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterDropdown]);
  
  return (
    <ThemeProvider>
      <div className="min-h-screen w-full transition-colors duration-200 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <Header 
          onAddEvent={() => setShowSubmitModal(true)}
          onNavigateToMap={handleNavigateToMap}
          onNavigateToEvents={handleNavigateToEvents}
          onNavigateToDatabase={handleNavigateToDatabase}
          onToggleDatabase={handleToggleDatabase}
          useSupabase={useSupabase}
          currentPage={currentPage}
        />
        
        {currentPage === 'events' ? (
          <main className="container mx-auto px-4 py-4 max-w-5xl">
            <div className={`sticky top-[73px] bg-white dark:bg-gray-900 z-40 pb-4 mb-4 transition-all duration-300 ${isSplitView ? 'mr-[40%] lg:mr-[45%]' : ''}`}>
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-2xl">
                  {searchQuery ? `Search Results (${filteredEvents.length})` : 'Events'}
                </h2>
                
                {/* Search and Filter Bar */}
                <div className={`flex items-center gap-4 transition-all duration-300 ${isSplitView ? 'scale-90' : ''}`}>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search events..."
                      onChange={(e) => handleSearch(e.target.value)}
                      className={`${isSplitView ? 'w-[320px]' : 'w-[480px]'} pl-10 pr-4 py-2 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-transparent transition-all duration-300`}
                    />
                  </div>
                  
                  {/* Filter Dropdown */}
                  <div className="relative filter-dropdown">
                    <button
                      onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                      className="flex items-center px-4 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors bg-transparent"
                    >
                      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                      <span className="text-sm">Filter</span>
                    </button>
                    
                    {showFilterDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                        <div className="p-4">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Filter by city</p>
                          <div className="space-y-2">
                            <label className="flex items-center">
                              <input type="checkbox" className="mr-3 rounded" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">London</span>
                            </label>
                            <label className="flex items-center">
                              <input type="checkbox" className="mr-3 rounded" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">Manchester</span>
                            </label>
                            <label className="flex items-center">
                              <input type="checkbox" className="mr-3 rounded" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">Bristol</span>
                            </label>
                            <label className="flex items-center">
                              <input type="checkbox" className="mr-3 rounded" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">Birmingham</span>
                            </label>
                            <label className="flex items-center">
                              <input type="checkbox" className="mr-3 rounded" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">Edinburgh</span>
                            </label>
                            <label className="flex items-center">
                              <input type="checkbox" className="mr-3 rounded" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">Cambridge</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {isLoadingEvents ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading events...</span>
              </div>
            ) : (
              <div className={`flex transition-all duration-300 gap-6 relative ${isSplitView ? 'mr-[40%] lg:mr-[45%]' : ''}`}>
                <div className="w-full">
                  <EventsList 
                    events={filteredEvents} 
                    onEventSelect={handleEventSelect} 
                    selectedEventId={selectedEvent?.id} 
                  />
                </div>
                <div className={`fixed top-0 right-0 h-[calc(100vh-120px)] w-[40%] lg:w-[45%] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 transform transition-transform duration-300 overflow-hidden ${isSplitView ? 'translate-x-0' : 'translate-x-full'}`}>
                  {selectedEvent && <EventDetails event={selectedEvent} onClose={handleClose} />}
                </div>
              </div>
            )}
          </main>
        ) : currentPage === 'map' ? (
          <Map />
        ) : (
          <Database />
        )}

        {/* Submit Event Modal */}
        {showSubmitModal && (
          <SubmitEventModal
            isOpen={showSubmitModal}
            onClose={() => setShowSubmitModal(false)}
            onExtract={handleExtract}
            isLoading={isLoading}
            error={error}
          />
        )}

        {/* Review Event Modal */}
        {scrapedEvent && (
          <ReviewEventModal
            isOpen={showReviewModal}
            onClose={() => setShowReviewModal(false)}
            onSave={handleSaveEvent}
            eventData={scrapedEvent}
          />
        )}

        <Footer />
      </div>
    </ThemeProvider>
  );
}