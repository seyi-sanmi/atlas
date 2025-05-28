import { supabase, DatabaseEvent } from '../lib/supabase';
import { Event } from './events';

// Convert between our frontend Event type and database DatabaseEvent type
const convertToEvent = (dbEvent: DatabaseEvent): Event => ({
  id: dbEvent.id,
  title: dbEvent.title,
  date: dbEvent.date,
  time: dbEvent.time,
  location: dbEvent.location,
  description: dbEvent.description,
  categories: dbEvent.categories || [],
  organizer: dbEvent.organizer,
  presented_by: dbEvent.presented_by,
  isFeatured: dbEvent.is_featured,
  url: dbEvent.url,
  links: dbEvent.links || []
});

const convertToDbEvent = (event: Omit<Event, 'id'>): Omit<DatabaseEvent, 'id' | 'created_at' | 'updated_at'> => ({
  title: event.title,
  date: event.date,
  time: event.time,
  location: event.location,
  description: event.description,
  categories: event.categories || [],
  organizer: event.organizer,
  presented_by: event.presented_by,
  is_featured: event.isFeatured || false,
  url: event.url,
  links: event.links || []
});

export const getAllEvents = async (): Promise<Event[]> => {
  if (!supabase) {
    console.warn('Supabase client not available');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
      return [];
    }

    return data?.map(convertToEvent) || [];
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
};

export const addEvent = async (eventData: Omit<Event, 'id'>): Promise<Event | null> => {
  if (!supabase) {
    console.warn('Supabase client not available');
    return null;
  }

  try {
    const dbEventData = convertToDbEvent(eventData);
    
    const { data, error } = await supabase
      .from('events')
      .insert([dbEventData])
      .select()
      .single();

    if (error) {
      console.error('Error adding event:', error);
      return null;
    }

    return convertToEvent(data);
  } catch (error) {
    console.error('Error adding event:', error);
    return null;
  }
};

export const updateEvent = async (id: string, eventData: Partial<Omit<Event, 'id'>>): Promise<Event | null> => {
  if (!supabase) {
    console.warn('Supabase client not available');
    return null;
  }

  try {
    const dbEventData = convertToDbEvent(eventData as Omit<Event, 'id'>);
    
    const { data, error } = await supabase
      .from('events')
      .update(dbEventData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating event:', error);
      return null;
    }

    return convertToEvent(data);
  } catch (error) {
    console.error('Error updating event:', error);
    return null;
  }
};

export const deleteEvent = async (id: string): Promise<boolean> => {
  if (!supabase) {
    console.warn('Supabase client not available');
    return false;
  }

  try {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting event:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting event:', error);
    return false;
  }
};

export const getEventById = async (id: string): Promise<Event | null> => {
  if (!supabase) {
    console.warn('Supabase client not available');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching event:', error);
      return null;
    }

    return convertToEvent(data);
  } catch (error) {
    console.error('Error fetching event:', error);
    return null;
  }
}; 