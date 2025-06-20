export interface Event {
  id: string;
  title: string;
  date: string; // Format: "2025-06-15" for proper date sorting
  time: string;
  location: string;
  description: string;
  categories: string[];
  organizer: string;
  presented_by?: string;
  isFeatured?: boolean;
  url?: string; // Optional URL to the original event page
  image_url?: string; // Optional URL to the event image
  links?: string[]; // Optional array of links extracted from the event page
}
export const events: Event[] = [
  {
    id: "1",
    title: "Summer Art Exhibition",
    date: "2025-06-15",
    time: "18:30 - 21:00",
    location: "Tate Modern, London",
    description:
      "Explore contemporary art from emerging artists across London. This exhibition features paintings, sculptures, and digital art installations that explore themes of urban life.",
    categories: ["Art", "Exhibition"],
    organizer: "Tate Modern",
    image_url:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80", // Art gallery
  },
  {
    id: "2",
    title: "London Tech Meetup",

    date: "2025-06-15",
    time: "10:00 - 18:00",
    location: "Old Street, London",
    description:
      "Join us for an evening of tech talks, networking, and refreshments. We'll have speakers from leading tech companies discussing the latest trends in AI and machine learning.",
    categories: ["Tech", "Networking"],
    organizer: "London Tech Community",
    image_url:
      "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=600&q=80", // Tech meetup
  },
  {
    id: "3",
    title: "Financial Markets Workshop",
    date: "2025-06-20",
    time: "09:00 - 17:00",
    location: "Canary Wharf, London",
    description:
      "A full-day workshop on understanding financial markets, investment strategies, and economic trends. Perfect for finance professionals and enthusiasts alike.",
    categories: ["Finance", "Workshop"],
    organizer: "London Business School",
    image_url:
      "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=600&q=80", // Finance/Canary Wharf
  },
  {
    id: "4",
    title: "London Jazz Festival",
    date: "2025-06-22",
    // Fixed multi-day event date
    time: "Various times",
    location: "South Bank, London",
    description:
      "The annual jazz festival returns with performances from world-renowned jazz musicians and local talent. Enjoy four days of music across multiple venues (June 22-25).",
    categories: ["Music", "Festival"],
    organizer: "London Music Arts",
    image_url:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80", // Jazz music
  },
  {
    id: "5",
    title: "Sustainable Fashion Panel",
    date: "2025-06-27",
    time: "19:00 - 21:00",
    location: "Shoreditch, London",
    description:
      "Join industry experts for a discussion on sustainable fashion practices, ethical sourcing, and the future of eco-friendly clothing production.",
    categories: ["Fashion", "Sustainability"],
    organizer: "Fashion Forward UK",
    image_url:
      "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=600&q=80", // Sustainable fashion
  },
  {
    id: "6",
    title: "London Food Market Tour",
    date: "2025-07-01",
    time: "11:00 - 14:00",
    location: "Borough Market",
    description:
      "Discover the best of London's food scene with a guided tour through one of the city's oldest and most famous food markets. Includes tastings from various vendors.",
    categories: ["Food", "Tour"],
    organizer: "London Food Guides",
    image_url:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80", // Food market
  },
  {
    id: "7",
    title: "Web Development Bootcamp",
    date: "2025-07-03",
    // Fixed multi-day event date
    time: "09:00 - 17:00",
    location: "King's Cross, London",
    description:
      "An intensive 5-day bootcamp covering front-end and back-end web development. Learn HTML, CSS, JavaScript, and modern frameworks from industry professionals (July 3-7).",
    categories: ["Tech", "Education"],
    organizer: "Code Academy London",
    image_url:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=600&q=80", // Coding bootcamp
  },
  {
    id: "8",
    title: "Urban Photography Walk",
    date: "2025-07-09",
    time: "14:00 - 17:00",
    location: "South Bank, London",
    description:
      "Capture London's iconic skyline and hidden corners on this guided photography walk. Suitable for all skill levels, bring your own camera or smartphone.",
    categories: ["Photography", "Outdoors"],
    organizer: "London Photography Club",
    image_url:
      "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80", // Urban photography
  },
  {
    id: "9",
    title: "Startup Pitch Night",
    date: "2025-07-12",
    time: "18:00 - 21:00",
    location: "Liverpool Street",
    description:
      "Watch London's most promising startups pitch their ideas to investors and industry experts. Networking opportunities and refreshments provided.",
    categories: ["Business", "Networking"],
    organizer: "London Startups",
    image_url:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop",
  },
];
