import React, { useState } from 'react';
import { PlusIcon } from 'lucide-react';
import { SubmitEventModal } from './SubmitEventModal';
import { ReviewEventModal } from './ReviewEventModal';
import { scrapeEvent } from '../utils/eventScraperService';
import { Event } from '../data/events';

interface SubmitEventButtonProps {
  onAddEvent: (eventData: Omit<Event, 'id'>) => Event;
}

export function SubmitEventButton({ onAddEvent }: SubmitEventButtonProps) {
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scrapedEvent, setScrapedEvent] = useState<Omit<Event, 'id'> | null>(null);

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
      console.log('newEvent object before review in SubmitEventButton.tsx:', JSON.stringify(newEvent, null, 2));
      setScrapedEvent(newEvent);
      
      // Close the submit modal and open the review modal
      setIsSubmitModalOpen(false);
      setIsReviewModalOpen(true);
    } catch (err) {
      console.error('Error during event extraction:', err);
      setError(err instanceof Error ? err.message : 'Failed to extract event data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEvent = (eventData: Omit<Event, 'id'>) => {
    // Add the event to our store
    const addedEvent = onAddEvent(eventData);
    
    // Close the review modal
    setIsReviewModalOpen(false);
    
    // Show a success message
    alert(`Successfully added event: ${addedEvent.title}`);
  };

  return (
    <>
      <button 
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
        onClick={() => setIsSubmitModalOpen(true)}
      >
        <PlusIcon className="w-4 h-4 mr-2" />
        Submit Event
      </button>
      
      <SubmitEventModal 
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onExtract={handleExtract}
        isLoading={isLoading}
        error={error}
      />
      
      {scrapedEvent && (
        <ReviewEventModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          onSave={handleSaveEvent}
          eventData={scrapedEvent}
        />
      )}
    </>
  );
}