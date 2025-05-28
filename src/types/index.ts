export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  categories: string[];
  organizer: string;
  presented_by?: string;
  isFeatured?: boolean;
  url?: string;
  links?: string[];
} 