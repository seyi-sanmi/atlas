import { Event } from '../data/events';

interface EventGroup {
  dayName: string;
  fullDate: string;
  events: Event[];
}

export function groupEventsByDate(events: Event[]): [string, EventGroup][] {
  const grouped = events.reduce<Record<string, EventGroup>>((acc, event) => {
    try {
      const date = new Date(event.date + "T00:00:00"); // Add time component for consistent parsing
      if (isNaN(date.getTime())) {
        console.error(`Invalid date for event: ${event.title}`);
        return acc;
      }
      const dateKey = event.date; // Use the original date string as key
      if (!acc[dateKey]) {
        acc[dateKey] = {
          dayName: date.toLocaleDateString('en-US', {
            weekday: 'long'
          }),
          fullDate: date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric'
          }),
          events: []
        };
      }
      acc[dateKey].events.push(event);
    } catch (error) {
      console.error(`Error processing event: ${event.title}`, error);
    }
    return acc;
  }, {});
  
  // Sort by date
  return Object.entries(grouped).sort(([dateA], [dateB]) => dateA.localeCompare(dateB));
}