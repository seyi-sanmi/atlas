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
import { Banner } from './components/Banner';
import { useMediaQuery } from './hooks/useMediaQuery';
import { EventDetailsModal } from './components/EventDetailsModal';

export function App() {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isSplitView, setIsSplitView] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const isSmallScreen = useMediaQuery('(max-width: 799px)');
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
    if (isSmallScreen) {
      setIsEventModalOpen(true);
    } else {
      setIsSplitView(true);
    }
  };
  
  const handleClose = () => {
    if (isSmallScreen) {
      setIsEventModalOpen(false);
    }
    setIsSplitView(false);
    setTimeout(() => setSelectedEvent(null), 300); // Delay to allow animations
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

  useEffect(() => {
    // If screen size changes from large to small, close split view and open modal if an event is selected
    if (isSmallScreen && isSplitView && selectedEvent) {
      setIsSplitView(false);
      setIsEventModalOpen(true);
    }
    // If screen size changes from small to large, close modal and open split view if an event is selected
    if (!isSmallScreen && isEventModalOpen && selectedEvent) {
      setIsEventModalOpen(false);
      setIsSplitView(true);
    }
  }, [isSmallScreen, isSplitView, isEventModalOpen, selectedEvent]);
  
  return (
    <ThemeProvider>
      <div className="min-h-screen w-full transition-colors duration-200 text-gray-900 dark:text-gray-100">
        <Header 
          onAddEvent={() => setShowSubmitModal(true)}
          onNavigateToMap={handleNavigateToMap}
          onNavigateToEvents={handleNavigateToEvents}
          onNavigateToDatabase={handleNavigateToDatabase}
          onToggleDatabase={handleToggleDatabase}
          useSupabase={useSupabase}
          currentPage={currentPage}
          onSearch={handleSearch}
          searchQuery={searchQuery}
          isSplitView={isSplitView}
          onCloseSplitView={handleClose}
        />
        
        <div className="w-full max-w-[60%] mx-auto">
          {currentPage === 'events' ? (
            <div className={`grid w-full min-h-[calc(100vh-3.5rem)] ${
              isSplitView && !isSmallScreen
                ? 'grid-cols-[60%_40%] gap-0' 
                : 'grid-cols-1'
            }`}>
              {/* Events List */}
              <div className={`pl-3 ${isSplitView && !isSmallScreen ? 'pr-0' : 'pr-3'}`}>
                {(!isSplitView || isSmallScreen) && <Banner onAddEvent={() => setShowSubmitModal(true)} />}
                <EventsList 
                  events={filteredEvents} 
                  onEventSelect={handleEventSelect} 
                  selectedEvent={selectedEvent}
                  loading={isLoadingEvents}
                  onSearch={handleSearch}
                  searchQuery={searchQuery}
                />
              </div>
              
              {/* Event Details Panel - Right side in split view */}
              {isSplitView && !isSmallScreen && (
                <div className={`sticky top-14 w-full overflow-hidden h-[var(--body-height)] pl-3 border-l border-gray-200 dark:border-gray-600`}>
                  {selectedEvent && <EventDetails event={selectedEvent} onClose={handleClose} />}
                </div>
              )}
            </div>
          ) : currentPage === 'map' ? (
            <Map />
          ) : (
            <Database />
          )}
        </div>

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

        {/* Event Details Modal for small screens */}
        {isEventModalOpen && selectedEvent && (
          <EventDetailsModal event={selectedEvent} onClose={handleClose} />
        )}

        <Footer />
      </div>
    </ThemeProvider>
  );
}