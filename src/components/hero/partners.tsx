"use client";
import { useTheme } from "next-themes";
import React, { useEffect, useRef, useState } from "react";

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
    name: "Oxford",
    image:
      "https://images.unsplash.com/photo-1579628151787-e17a97e79feb?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
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
  {
    name: "Belfast",
    image:
      "https://images.unsplash.com/photo-1593255136145-da399169fadd?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    name: "Cambridge",
    image:
      "https://images.unsplash.com/photo-1596967082890-810f0f4cf634?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
];

const ParallaxText = ({
  children,
  direction = "left",
  speed = 50,
  className = "",
}: {
  children: any;
  direction?: "left" | "right";
  speed?: number;
  className?: string;
}) => {
  return (
    <div className={`parallax-container ${className}`}>
      <div
        className="parallax-track"
        style={{
          animation: `scroll${
            direction === "right" ? "Right" : "Left"
          } ${speed}s linear infinite`,
        }}
      >
        {/* Create exactly 2 copies for perfect seamless loop */}
        {Array.from({ length: 2 }, (_, setIndex) =>
          children.map((child: any, childIndex: number) => (
            <div
              key={`${setIndex}-${childIndex}`}
              className="mx-4 flex-shrink-0"
            >
              {child}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

function useTypewriterCity(cities: { name: string; image?: string }[]) {
  const [cityIdx, setCityIdx] = useState(0);
  const [displayText, setDisplayText] = useState(""); // Start empty for smooth animation
  const [isDeleting, setIsDeleting] = useState(false);
  const [image, setImage] = useState(
    cities[0]?.image ||
      "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.1"
  );
  const [imageLoaded, setImageLoaded] = useState(false);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile for optimized timing
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Preload next image
  useEffect(() => {
    const newImage =
      cities[cityIdx]?.image ||
      "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.1";
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

    // Updated timing for 3.5 second total cycle
    const typingSpeed = isMobile ? 100 : 120;
    const deletingSpeed = isMobile ? 60 : 80;
    const pauseAfterTyping = 3500; // 3.5 seconds display time
    const pauseBeforeNext = isMobile ? 300 : 400;

    const animate = () => {
      if (!isDeleting && displayText.length < currentCity.length) {
        // Typing forward
        setDisplayText(currentCity.slice(0, displayText.length + 1));
        typingTimeout.current = setTimeout(animate, typingSpeed);
      } else if (!isDeleting && displayText.length === currentCity.length) {
        // Finished typing, pause before deleting
        typingTimeout.current = setTimeout(
          () => setIsDeleting(true),
          pauseAfterTyping
        );
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

function PartnersHero({
  title = "What's Happening",
  showBackground = true,
  height = "h-[60vh] sm:h-[70vh]",
  typewriterItems,
}: {
  title?: string;
  showBackground?: boolean;
  height?: string;
  typewriterItems?: { name: string; image?: string }[];
}) {
  // Typewriter effect for city and background image
  const {
    displayText: cityText,
    image: cityImage,
    imageLoaded,
  } = useTypewriterCity(typewriterItems || cities);

  // Use only the typewriter text, no fallback during animation
  const currentCityName = cityText;

  const partnerLogos = [
    <img
      key="partner-1"
      src="/images/partners/1.png"
      alt="Partners Logo"
      className="h-6 sm:h-10 w-auto opacity-80 hover:opacity-100 transition-opacity block"
    />,
    <img
      key="partner-2"
      src="/images/partners/2.png"
      alt="Partners Logo"
      className="h-6 sm:h-10 w-auto opacity-80 hover:opacity-100 transition-opacity block"
    />,
    <img
      key="partner-3"
      src="/images/partners/3.png"
      alt="Partners Logo"
      className="h-6 sm:h-10 w-auto opacity-80 hover:opacity-100 transition-opacity block"
    />,
    <img
      key="partner-4"
      src="/images/partners/4.png"
      alt="Partners Logo"
      className="h-6 sm:h-10 w-auto opacity-80 hover:opacity-100 transition-opacity block"
    />,
    <img
      key="partner-5"
      src="/images/partners/5.png"
      alt="Partners Logo"
      className="h-6 sm:h-10 w-auto opacity-80 hover:opacity-100 transition-opacity block"
    />,
    <img
      key="partner-6"
      src="/images/partners/6.png"
      alt="Partners Logo"
      className="h-6 sm:h-10 w-auto opacity-80 hover:opacity-100 transition-opacity block"
    />,
    <img
      key="partner-7"
      src="/images/partners/7.png"
      alt="Partners Logo"
      className="h-6 sm:h-10 w-auto opacity-80 hover:opacity-100 transition-opacity block"
    />,
  ];

  const { theme } = useTheme();

  return (
    <section className={`relative ${height} w-full overflow-hidden`}>
      {/* Background Image - Conditionally rendered */}
      {showBackground && (
        <div className="absolute inset-0 z-0">
          <div
            className={`w-full h-full bg-cover bg-center bg-no-repeat transition-all duration-2000 ease-in-out ${
              imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105"
            }`}
            style={{
              background:
                theme == "dark"
                  ? `linear-gradient(135deg, rgba(19, 19, 24, 0.8), rgba(30, 30, 37, 0.6)), url('${cityImage}')`
                  : `linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.6)), url('${cityImage}')`,
            }}
          />

          {/* Animated Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent dark:to-[#131318] to-[#F0F0F0]" />
        </div>
      )}

      {/* Solid background when image is disabled */}
      {!showBackground && (
        <div className="absolute inset-0 z-0 bg-primary-bg">
          {/* Gradient Overlay for consistency */}
          <div className="absolute inset-0 bg-gradient-to-b dark:from-[#1a1a20] from-[#ffffff] dark:via-[#131318] via-[#F0F0F0] dark:to-[#131318] to-[#F0F0F0]" />
        </div>
      )}

      {/* Hero Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 py-8 sm:mt-8">
        <h1 className="text-3xl sm:text-4xl md:text-5xl tracking-normal font-medium font-display mb-6 text-primary-text drop-shadow-2xl">
          {title}
          <br />
          {/* Typewriter effect for city */}
          <span className="inline-block min-w-[6ch] sm:min-w-[8ch] relative text-transparent bg-clip-text bg-gradient-to-r from-[#AE3813] to-[#D45E3C]">
            in {currentCityName}
            <span className="typewriter-cursor h-[0.8em] align-text-bottom" />
          </span>
        </h1>

        <ParallaxText
          direction="left"
          speed={40}
          className="max-w-[700px] mb-12 sm:mb-20 mask-fade"
        >
          {partnerLogos}
        </ParallaxText>

        {/* Time & Date Badge */}
        {/* <div className="dark:bg-white/10 bg-black/5 backdrop-blur-md rounded-full px-6 py-3 border border-white/20">
            <div className="flex items-center gap-4 text-primary-text/90">
              <span className="font-mono text-lg font-semibold">{time}</span>
              <div className="w-1 h-1 dark:bg-white/60 bg-black/60 rounded-full" />
              <span className="text-sm font-medium">{date}</span>
            </div>
          </div> */}
      </div>
    </section>
  );
}

export default PartnersHero;
