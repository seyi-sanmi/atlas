"use client";
import Image from "next/image";
import { EventsList } from "./components/event/list";
import { Event } from "@/lib/supabase";
import { getAllEvents, searchAndFilterEvents } from "@/lib/events";
import { useState, useEffect, useRef } from "react";
import { Footer } from "./components/event/footer";
import { Header } from "./components/event/header";
import EventFilter from "./components/event/list/filter";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SlidersHorizontal } from "lucide-react";

// Add city data: name and Unsplash image
const cities = [
  {
    name: "London",
    image:
      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=70&fm=jpg&auto=compress&sat=50",
  },
  {
    name: "Birmingham",
    image:
      "https://images.unsplash.com/photo-1610818647551-866cce9f06d5?ixlib=rb-4.1.0&auto=format&fit=crop&w=1200&q=70&fm=jpg&auto=compress&sat=50",
  },
  {
    name: "Edinburgh",
    image:
      "https://images.unsplash.com/photo-1506377585622-bedcbb027afc?ixlib=rb-4.1.0&auto=format&fit=crop&w=1200&q=70&fm=jpg&auto=compress&sat=50",
  },
  {
    name: "Manchester",
    image:
      "https://images.unsplash.com/photo-1588934375041-0478480ae4c2?ixlib=rb-4.1.0&auto=format&fit=crop&w=1200&q=70&fm=jpg&auto=compress&sat=50",
  },
  {
    name: "Bristol",
    image:
      "https://images.unsplash.com/photo-1597079013069-bd1681f7454f?ixlib=rb-4.1.0&auto=format&fit=crop&w=1200&q=70&fm=jpg&auto=compress&sat=50",
  },

  {
    name: "Liverpool",
    image:
      "https://images.unsplash.com/photo-1557925179-a524ea601317?ixlib=rb-4.1.0&auto=format&fit=crop&w=1200&q=70&fm=jpg&auto=compress&sat=50",
  },
];

function useTypewriterCity(cities: { name: string; image: string }[]) {
  const [cityIdx, setCityIdx] = useState(0);
  const [displayText, setDisplayText] = useState(""); // Start empty for smooth animation
  const [isDeleting, setIsDeleting] = useState(false);
  const [image, setImage] = useState(cities[0]?.image || "");
  const [imageLoaded, setImageLoaded] = useState(false);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile for optimized timing
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Preload next image
  useEffect(() => {
    const newImage = cities[cityIdx]?.image;
    if (newImage && newImage !== image) {
      setImageLoaded(false);
      const img = new window.Image();
      img.onload = () => {
        setImage(newImage);
        setImageLoaded(true);
      };
      img.onerror = () => {
        setImage(newImage);
        setImageLoaded(true);
      };
      img.src = newImage;
    } else if (newImage) {
      setImageLoaded(true);
    }
  }, [cityIdx, cities, image]);

  // Main typewriter effect
  useEffect(() => {
    if (!cities.length) return;
    
    const currentCity = cities[cityIdx]?.name || "";
    
         // Slower, more relaxed timing
     const typingSpeed = isMobile ? 150 : 180;
     const deletingSpeed = isMobile ? 80 : 100;
     const pauseAfterTyping = isMobile ? 3000 : 3500;
     const pauseBeforeNext = isMobile ? 500 : 800;
    
    const animate = () => {
      if (!isDeleting && displayText.length < currentCity.length) {
        // Typing forward
        setDisplayText(currentCity.slice(0, displayText.length + 1));
        typingTimeout.current = setTimeout(animate, typingSpeed);
      } else if (!isDeleting && displayText.length === currentCity.length) {
        // Finished typing, pause before deleting
        typingTimeout.current = setTimeout(() => setIsDeleting(true), pauseAfterTyping);
      } else if (isDeleting && displayText.length > 0) {
        // Deleting
        setDisplayText(currentCity.slice(0, displayText.length - 1));
        typingTimeout.current = setTimeout(animate, deletingSpeed);
      } else if (isDeleting && displayText.length === 0) {
        // Finished deleting, move to next city
        setIsDeleting(false);
        setCityIdx((prev) => (prev + 1) % cities.length);
        typingTimeout.current = setTimeout(animate, pauseBeforeNext);
      }
    };

    // Start animation with a small delay
    typingTimeout.current = setTimeout(animate, 100);

    return () => {
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
    };
  }, [displayText, isDeleting, cityIdx, cities, isMobile]);

  return { displayText, image, imageLoaded };
}

export default function Home() {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Typewriter effect for city and background image
  const { displayText: cityText, image: cityImage, imageLoaded } = useTypewriterCity(cities);

  // Use only the typewriter text, no fallback during animation
  const currentCityName = cityText;

  // Load events on mount
  useEffect(() => {
    const loadEvents = async () => {
      setIsLoadingEvents(true);
      try {
        const eventsData = await getAllEvents();
        setEvents(eventsData);
      } catch (error) {
        console.error('Failed to load events:', error);
      } finally {
        setIsLoadingEvents(false);
      }
    };

    loadEvents();
  }, []);

  // Handle search and filtering
  useEffect(() => {
    const searchAndFilter = async () => {
      setIsLoadingEvents(true);
      try {
        const filteredEvents = await searchAndFilterEvents({
          query: searchQuery,
          location: selectedLocation,
          category: selectedCategory,
          date: selectedDate,
        });
        setEvents(filteredEvents);
      } catch (error) {
        console.error('Failed to search events:', error);
      } finally {
        setIsLoadingEvents(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(searchAndFilter, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedLocation, selectedCategory, selectedDate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleEventSelect = (event: Event) => {
    console.log("Selected event:", event);
    setSelectedEvent(event);
  };

  const formatDateTime = (date: Date) => {
    return {
      time: date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/London",
      }),
      date: date.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        timeZone: "Europe/London",
      }),
    };
  };

  const { time, date } = formatDateTime(currentTime);

  return (
    <div className="min-h-screen w-full bg-[#131318] text-gray-100 font-sans">
      <Header />

      {/* Hero Section */}
      <section className="relative h-[60vh] sm:h-[70vh] w-full overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <div
            className={`w-full h-full bg-cover bg-center bg-no-repeat transition-all duration-2000 ease-in-out ${
              imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            }`}
            style={{
              backgroundImage: `linear-gradient(135deg, rgba(19, 19, 24, 0.8), rgba(30, 30, 37, 0.6)), url('${cityImage}')`,
            }}
          />

          {/* Animated Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#131318]" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 py-8 sm:mt-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl tracking-normal font-medium font-display mb-6 text-white drop-shadow-2xl">
            What's Happening
            <br />
            {/* Typewriter effect for city */}
            <span className="inline-block min-w-[6ch] sm:min-w-[8ch] relative text-transparent bg-clip-text bg-gradient-to-r from-[#AE3813] to-[#D45E3C]">
              in {currentCityName}
              <span className="typewriter-cursor h-[0.8em] align-text-bottom" />
            </span>
          </h1>

          <div className="flex items-center gap-4 sm:gap-8 mx-auto mb-12 sm:mb-20">
            {/* Renaissance Philanthropy Logo */}
            <a
              href="https://www.renphil.org"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center transition-all duration-200 hover:scale-105"
            >
              <img
                src="/images/renaissance-philanthropy-light.png"
                alt="Renaissance Philanthropy"
                className="h-8 sm:h-12 w-auto opacity-80 group-hover:opacity-100 transition-opacity dark:block hidden"
              />
              <img
                src="/images/renaissance-philanthropy-dark.png"
                alt="Renaissance Philanthropy"
                className="h-8 sm:h-12 w-auto opacity-80 group-hover:opacity-100 transition-opacity dark:hidden block"
              />
            </a>

            {/* Powered by ARIA Logo */}
            <a
              href="https://www.aria.org.uk/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center transition-all duration-200 hover:scale-105"
            >
              <img
                src="/images/powered-by-aria-light.png"
                alt="Powered by ARIA"
                className="h-6 sm:h-10 w-auto opacity-80 group-hover:opacity-100 transition-opacity dark:block hidden"
              />
              <img
                src="/images/powered-by-aria-dark.png"
                alt="Powered by ARIA"
                className="h-6 sm:h-10 w-auto opacity-80 group-hover:opacity-100 transition-opacity dark:hidden block"
              />
            </a>
          </div>

          {/* Time & Date Badge */}
          {/* <div className="bg-white/10 backdrop-blur-md rounded-full px-6 py-3 border border-white/20">
            <div className="flex items-center gap-4 text-white/90">
              <span className="font-mono text-lg font-semibold">{time}</span>
              <div className="w-1 h-1 bg-white/60 rounded-full" />
              <span className="text-sm font-medium">{date}</span>
            </div>
          </div> */}
        </div>
      </section>

      {/* Main Content */}
      <main className="relative -mt-40 z-20">
        <div className="container mx-auto px-2 sm:px-4 max-w-6xl sm:flex">
          <div className=" min-h-screen lg:w-2/3">
            <div className="p-2 sm:p-8">
              <EventsList
                events={events}
                onEventSelect={handleEventSelect}
                selectedEvent={selectedEvent}
                loading={isLoadingEvents}
              />
            </div>
          </div>

          <div className="hidden lg:block lg:w-1/3 mt-20">
            <div className="sticky top-20 h-[calc(100vh-6rem)] overflow-y-auto">
              <EventFilter 
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedLocation={selectedLocation}
                onLocationChange={setSelectedLocation}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Mobile Floating Filter Button */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <button className="bg-gradient-to-r from-[#AE3813] to-[#D45E3C] hover:from-[#D45E3C] hover:to-[#AE3813] text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 backdrop-blur-sm border border-white/10">
              <SlidersHorizontal className="w-6 h-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] bg-[#131318] border-t border-gray-800">
            <SheetHeader className="p-6 pb-4 border-b border-gray-800">
              <SheetTitle className="text-xl font-semibold text-white">Filter Events</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-6">
              <EventFilter 
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedLocation={selectedLocation}
                onLocationChange={setSelectedLocation}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
