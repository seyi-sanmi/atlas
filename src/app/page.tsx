"use client";
import Image from "next/image";
import { EventsList } from "./components/event/list";
import { events, type Event } from "./lib/event-data";
import { useState, useEffect, useRef } from "react";
import { Footer } from "./components/event/footer";
import { Header } from "./components/event/header";
import EventFilter from "./components/event/list/filter";

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
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [image, setImage] = useState(cities[0].image);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setImage(cities[cityIdx].image);

    const currentCity = cities[cityIdx].name;
    let speed = 1200; // default

    if (!isDeleting && displayText.length < currentCity.length) {
      setDisplayText(currentCity.slice(0, displayText.length + 1));
      speed = 12000; // slower typing
    } else if (!isDeleting && displayText.length === currentCity.length) {
      speed = 3500; // longer pause at full city
      typingTimeout.current = setTimeout(() => setIsDeleting(true), speed);
      return;
    } else if (isDeleting && displayText.length > 0) {
      setDisplayText(currentCity.slice(0, displayText.length - 1));
      speed = 8000; // slower erasing
    } else if (isDeleting && displayText.length === 0) {
      setIsDeleting(false);
      setCityIdx((prev) => (prev + 1) % cities.length);
      speed = 2000; // pause before next city
    }

    typingTimeout.current = setTimeout(() => {}, speed);

    return () => {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayText, isDeleting, cityIdx]);

  useEffect(() => {
    if (!isDeleting && displayText.length < cities[cityIdx].name.length) {
      typingTimeout.current = setTimeout(() => {
        setDisplayText(cities[cityIdx].name.slice(0, displayText.length + 1));
      }, 12000); // slower typing
    } else if (isDeleting && displayText.length > 0) {
      typingTimeout.current = setTimeout(() => {
        setDisplayText(cities[cityIdx].name.slice(0, displayText.length - 1));
      }, 8000); // slower erasing
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayText, isDeleting]);

  useEffect(() => {
    if (!isDeleting && displayText === cities[cityIdx].name) {
      typingTimeout.current = setTimeout(() => setIsDeleting(true), 3500);
    }
    if (isDeleting && displayText === "") {
      typingTimeout.current = setTimeout(() => {
        setIsDeleting(false);
        setCityIdx((prev) => (prev + 1) % cities.length);
      }, 2000);
    }
    return () => {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayText, isDeleting]);

  return { displayText, image };
}

export default function Home() {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Typewriter effect for city and background image
  const { displayText: cityText, image: cityImage } = useTypewriterCity(cities);

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
      <section className="relative h-[70vh] w-full overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat transition-all duration-700"
            style={{
              backgroundImage: `linear-gradient(135deg, rgba(19, 19, 24, 0.8), rgba(30, 30, 37, 0.6)), url('${cityImage}')`,
            }}
          />

          {/* Animated Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#131318]" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 sm:mt-8">
          <h1 className="text-5xl tracking-normal md:text-5xl font-medium font-display mb-6 text-white drop-shadow-2xl">
            What's Happening
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#AE3813] to-[#D45E3C]">
              {/* Typewriter effect for city */}
              <span className="inline-block min-w-[8ch]">
                in {cityText}
                <span className="border-r-2 border-[#D45E3C] animate-pulse ml-1" />
              </span>
            </span>
          </h1>

          <div className="flex items-center gap-8 mx-auto mb-20">
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
                className="h-12 w-auto opacity-80 group-hover:opacity-100 transition-opacity dark:block hidden"
              />
              <img
                src="/images/renaissance-philanthropy-dark.png"
                alt="Renaissance Philanthropy"
                className="h-12 w-auto opacity-80 group-hover:opacity-100 transition-opacity dark:hidden block"
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
                className="h-10 w-auto opacity-80 group-hover:opacity-100 transition-opacity dark:block hidden"
              />
              <img
                src="/images/powered-by-aria-dark.png"
                alt="Powered by ARIA"
                className="h-10 w-auto opacity-80 group-hover:opacity-100 transition-opacity dark:hidden block"
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
            <EventFilter />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
