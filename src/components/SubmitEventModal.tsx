import React, { useState, useRef, useEffect } from 'react';
import { XIcon, Loader, ChevronDownIcon } from 'lucide-react';
import { predefinedCategories } from '../categories'; // Import predefined categories

interface SubmitEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExtract: (url: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function SubmitEventModal({ 
  isOpen, 
  onClose, 
  onExtract, 
  isLoading = false,
  error = null
}: SubmitEventModalProps) {
  const [activeTab, setActiveTab] = useState<'url' | 'manual'>('url');
  const [eventUrl, setEventUrl] = useState('');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  const [manualEventData, setManualEventData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    description: '',
    organizer: '',
    categories: [] as string[], // Add categories to manual event data
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [categoryDropdownRef, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'url' && eventUrl.trim()) {
      onExtract(eventUrl.trim());
    }
  };

  const handleManualInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setManualEventData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryToggle = (category: string) => {
    setManualEventData(prev => {
      const currentCategories = prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category];
      return { ...prev, categories: currentCategories };
    });
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual submission logic for manual data
    console.log('Submitting manually entered event:', manualEventData);
    // onClose(); // Potentially close modal after submission
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Submit an Event</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            disabled={isLoading}
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          {/* Tabs */}
          <div className="flex mb-6">
            <div className="w-1/2">
              <button
                className={`w-full py-4 text-center rounded-tl-lg rounded-bl-lg transition-colors ${
                  activeTab === 'url' 
                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
                onClick={() => setActiveTab('url')}
                disabled={isLoading}
              >
                Paste Event URL
              </button>
            </div>
            <div className="w-1/2">
              <button
                className={`w-full py-4 text-center rounded-tr-lg rounded-br-lg transition-colors ${
                  activeTab === 'manual' 
                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
                onClick={() => setActiveTab('manual')}
                disabled={isLoading}
              >
                Enter Details Manually
              </button>
            </div>
          </div>
          
          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded">
              {error}
            </div>
          )}
          
          {/* URL Tab Content */}
          {activeTab === 'url' && (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label htmlFor="eventUrl" className="block mb-2 text-lg">Event URL</label>
                <div className="flex">
                  <input
                    id="eventUrl"
                    type="url"
                    className="flex-1 p-4 border border-gray-200 dark:border-gray-700 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                    placeholder="https://lu.ma/event/... or https://www.eventbrite.com/..."
                    value={eventUrl}
                    onChange={(e) => setEventUrl(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-r-lg font-medium transition-colors flex items-center justify-center min-w-[100px]"
                    disabled={!eventUrl.trim() || isLoading}
                  >
                    {isLoading ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      'Extract'
                    )}
                  </button>
                </div>
                <p className="mt-3 text-gray-600 dark:text-gray-400">
                  Paste a URL from lu.ma, Eventbrite, or other event platforms to automatically extract event details.
                </p>
              </div>
            </form>
          )}
          
          {/* Manual Tab Content */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit}>
              {/* Basic form fields - can be expanded */}
              <div className="mb-4">
                <label htmlFor="manualTitle" className="block mb-1 text-sm font-medium">Event Title</label>
                <input type="text" id="manualTitle" name="title" value={manualEventData.title} onChange={handleManualInputChange} className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700" />
              </div>
              {/* Add other fields like date, time, location, description, organizer similarly */}

              {/* Categories Multi-Select Dropdown */}
              <div className="mb-6">
                <label className="block mb-2 text-sm font-medium">Categories</label>
                <div className="relative" ref={categoryDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                    className="w-full p-2.5 border rounded dark:bg-gray-800 dark:border-gray-700 text-left flex justify-between items-center"
                  >
                    <span className="truncate">
                      {manualEventData.categories.length > 0 
                        ? manualEventData.categories.join(', ') 
                        : 'Select categories'}
                    </span>
                    <ChevronDownIcon className={`w-5 h-5 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isCategoryDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {predefinedCategories.map(category => (
                        <label 
                          key={category} 
                          className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                        >
                          <input 
                            type="checkbox" 
                            className="form-checkbox h-4 w-4 text-blue-600 dark:bg-gray-700 dark:border-gray-600 rounded mr-2"
                            checked={manualEventData.categories.includes(category)}
                            onChange={() => handleCategoryToggle(category)}
                          />
                          {category}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                disabled={isLoading} // Consider separate loading state for manual form if needed
              >
                Submit Manually
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
} 