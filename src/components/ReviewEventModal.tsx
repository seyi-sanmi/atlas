import React, { useState, useEffect, useRef } from 'react';
import { XIcon, Save, Calendar, Clock, MapPin, User, Tag, ChevronDownIcon } from 'lucide-react';
import { Event } from '../data/events';
import { predefinedCategories } from '../categories';

interface ReviewEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: Omit<Event, 'id'>) => void;
  eventData: Omit<Event, 'id'>;
}

export function ReviewEventModal({ 
  isOpen, 
  onClose, 
  onSave,
  eventData
}: ReviewEventModalProps) {
  const [event, setEvent] = useState<Omit<Event, 'id'>>(eventData);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  console.log('eventData prop received by ReviewEventModal.tsx:', JSON.stringify(eventData, null, 2));

  useEffect(() => {
    setEvent(eventData);
    console.log('Setting internal event state in ReviewEventModal.tsx to:', JSON.stringify(eventData, null, 2));
  }, [eventData]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [categoryDropdownRef]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEvent(prevEvent => ({
      ...prevEvent,
      [name]: value
    }));
  };

  const handleCategoryToggle = (category: string) => {
    setEvent(prevEvent => {
      const currentCategories = prevEvent.categories.includes(category)
        ? prevEvent.categories.filter(c => c !== category)
        : [...prevEvent.categories, category];
      return { ...prevEvent, categories: currentCategories };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(event);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-5xl">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Review Event Details</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 flex flex-col" style={{ maxHeight: 'calc(100vh - 140px)' }}>
          <div className="overflow-y-auto pr-2 space-y-4 flex-grow">
            <div>
              <label htmlFor="title" className="block mb-1 font-medium">Title</label>
              <input
                id="title"
                name="title"
                type="text"
                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                value={event.title}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="block mb-1 font-medium">
                  <Calendar className="inline-block w-4 h-4 mr-1" />
                  Date
                </label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                  value={event.date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="time" className="block mb-1 font-medium">
                  <Clock className="inline-block w-4 h-4 mr-1" />
                  Time
                </label>
                <input
                  id="time"
                  name="time"
                  type="text"
                  className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                  value={event.time}
                  onChange={handleInputChange}
                  placeholder="7:00 PM - 10:00 PM"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="location" className="block mb-1 font-medium">
                <MapPin className="inline-block w-4 h-4 mr-1" />
                Location
              </label>
              <input
                id="location"
                name="location"
                type="text"
                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                value={event.location}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div>
              <label htmlFor="organizer" className="block mb-1 font-medium">
                <User className="inline-block w-4 h-4 mr-1" />
                Organizer
              </label>
              <input
                id="organizer"
                name="organizer"
                type="text"
                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                value={event.organizer}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div>
              <label htmlFor="presented_by" className="block mb-1 font-medium">
                <User className="inline-block w-4 h-4 mr-1" />
                Presented By
              </label>
              <input
                id="presented_by"
                name="presented_by"
                type="text"
                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                value={event.presented_by || ''}
                onChange={handleInputChange}
                placeholder="Name of presenting organization or individual"
              />
            </div>
            
            <div>
              <label className="block mb-1 font-medium">
                <Tag className="inline-block w-4 h-4 mr-1" />
                Categories
              </label>
              <div className="relative" ref={categoryDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                  className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-left flex justify-between items-center"
                >
                  <span className="truncate">
                    {event.categories.length > 0 
                      ? event.categories.join(', ') 
                      : 'Select categories'}
                  </span>
                  <ChevronDownIcon className={`w-5 h-5 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isCategoryDropdownOpen && (
                  <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {predefinedCategories.map(category => (
                      <label 
                        key={category} 
                        className="flex items-center px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-sm"
                      >
                        <input 
                          type="checkbox" 
                          className="form-checkbox h-4 w-4 text-blue-600 dark:bg-gray-700 dark:border-gray-600 rounded mr-3 focus:ring-blue-500"
                          checked={event.categories.includes(category)}
                          onChange={() => handleCategoryToggle(category)}
                        />
                        {category}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label htmlFor="description" className="block mb-1 font-medium">Description</label>
              <textarea
                id="description"
                name="description"
                rows={5}
                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                value={event.description}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-4 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 