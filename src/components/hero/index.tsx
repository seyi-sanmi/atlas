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
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
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

function Hero() {
  // Typewriter effect for city and background image
  const {
    displayText: cityText,
    image: cityImage,
    imageLoaded,
  } = useTypewriterCity(cities);

  // Use only the typewriter text, no fallback during animation
  const currentCityName = cityText;

  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Compute background image only after mount
  const backgroundImage = !mounted
    ? undefined // SSR: don't set theme-dependent background
    : theme == "dark"
    ? `linear-gradient(135deg, rgba(19, 19, 24, 0.8), rgba(30, 30, 37, 0.6)), url('${cityImage}')`
    : `linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.6)), url('${cityImage}')`;

  return (
    <section className="relative h-[60vh] sm:h-[70vh] w-full overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <div
          className={`w-full h-full bg-cover bg-center bg-no-repeat transition-all duration-2000 ease-in-out ${
            imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105"
          }`}
          style={backgroundImage ? { backgroundImage } : {}}
        />

        {/* Animated Gradient Overlay */}
        {mounted && (
          <div className="absolute inset-0 bg-gradient-to-b dark:from-transparent dark:via-transparent dark:to-[#131318] to-[#F0F0F0]" />
        )}
      </div>

      {/* Hero Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 py-8 sm:mt-8">
        <h1 className="text-3xl sm:text-4xl md:text-5xl tracking-normal font-medium font-display mb-6 text-primary-text drop-shadow-2xl">
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
              className="h-8 sm:h-12 w-auto opacity-80 group-hover:opacity-100 transition-opacity block dark:hidden"
            />
            <img
              src="/images/renaissance-philanthropy-dark.png"
              alt="Renaissance Philanthropy"
              className="h-8 sm:h-12 w-auto opacity-80 group-hover:opacity-100 transition-opacity hidden dark:block"
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
              className="h-6 sm:h-10 w-auto opacity-80 group-hover:opacity-100 transition-opacity block dark:hidden"
            />
            <img
              src="/images/powered-by-aria-dark.png"
              alt="Powered by ARIA"
              className="h-6 sm:h-10 w-auto opacity-80 group-hover:opacity-100 transition-opacity hidden dark:block"
            />
          </a>
        </div>
      </div>
    </section>
  );
}

export default Hero;
