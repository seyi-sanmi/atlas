"use client";
import Image from "next/image";
import { EventsList } from "./components/event/list";
import { events, type Event } from "./lib/event-data";
import { useState, useEffect } from "react";
import { Footer } from "./components/event/footer";
import { Header } from "./components/event/header";

export default function Home() {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
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
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage:
                "linear-gradient(135deg, rgba(19, 19, 24, 0.8), rgba(30, 30, 37, 0.6)), url('https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')",
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
              in London
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
        <div className="container mx-auto px-2 sm:px-4 max-w-4xl">
          <div className=" min-h-screen">
            <div className="p-2 sm:p-8">
              <EventsList
                events={events}
                onEventSelect={handleEventSelect}
                selectedEvent={selectedEvent}
                loading={isLoadingEvents}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
