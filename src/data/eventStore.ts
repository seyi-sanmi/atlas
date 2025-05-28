import { Event, events as initialEvents } from './events';

// In-memory store for events (mock database)
let events: Event[] = [...initialEvents];

/**
 * Add a new event to the store
 */
export function addEvent(event: Omit<Event, 'id'>): Event {
  let newIdNumber = 1;
  if (events.length > 0) {
    const maxId = Math.max(...events.map(e => parseInt(e.id, 10)).filter(id => !isNaN(id)));
    if (isFinite(maxId)) {
      newIdNumber = maxId + 1;
    }
  }
  const newId = String(newIdNumber);
  
  const newEvent: Event = {
    ...event,
    id: newId
  };
  
  // Add to the beginning of the array so it shows up first
  events = [newEvent, ...events];
  
  return newEvent;
}

/**
 * Get all events
 */
export function getAllEvents(): Event[] {
  return events;
}

/**
 * Get a single event by ID
 */
export function getEventById(id: string): Event | undefined {
  return events.find(event => event.id === id);
}

/**
 * Update an existing event
 */
export function updateEvent(id: string, eventData: Partial<Event>): Event | null {
  const index = events.findIndex(event => event.id === id);
  
  if (index === -1) {
    return null;
  }
  
  const updatedEvent = {
    ...events[index],
    ...eventData
  };
  
  events[index] = updatedEvent;
  return updatedEvent;
}

/**
 * Delete an event
 */
export function deleteEvent(id: string): boolean {
  const index = events.findIndex(event => event.id === id);
  
  if (index === -1) {
    return false;
  }
  
  events.splice(index, 1);
  return true;
} 