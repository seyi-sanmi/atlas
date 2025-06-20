import React from "react";
import {
  Calendar,
  MapPin,
  Compass,
  Database,
  Bell,
  Search,
  Plus,
} from "lucide-react";

interface HeaderProps {}

export function Header({}) {
  const currentPage: "events" | "map" | "database" = "events";

  return (
    <header className="fixed top-0 w-full z-50 bg-[#131318]/80 backdrop-blur-xl border-b border-white/20">
      <div className="container mx-auto px-6">
        <div className="h-16 flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <div className="h-8 w-auto">
              <svg
                id="Layer_1"
                data-name="Layer 1"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 293.42 378.67"
                className="h-6 sm:h-8 w-auto"
              >
                <defs>
                  <style>
                    {`.cls-1 {
                      fill-rule: evenodd;
                    }
                    .cls-1, .cls-2 {
                      fill: #D45E3C;
                      stroke-width: 0px;
                    }`}
                  </style>
                </defs>
                <path
                  className="cls-2"
                  d="M88.52,152.44c3.83-28.5,28.41-50.49,58.18-50.49,32.42,0,58.69,26.08,58.69,58.26,0,17.07-7.4,32.43-19.19,43.09-2.65,2.39-3.03,6.53-.66,9.19,5.71,6.39,10.91,13.25,15.51,20.52,1.86,2.94,5.87,3.8,8.55,1.57,21.35-17.81,34.92-44.51,34.92-74.36,0-53.62-43.8-97.09-97.82-97.09s-94.61,40.36-97.65,91.27c-.19,3.21,2.45,5.83,5.7,5.83h13.7c3.98,0,6.04,0,11.82.44,5.79.43,7.22-.44,8.26-8.2Z"
                />
                <path
                  className="cls-1"
                  d="M48.87,185.45c0-3.22,2.63-5.83,5.87-5.83h13.7c73.67,0,133.75,57.73,136.83,130.1.14,3.21-2.5,5.83-5.75,5.83h-27.39c-3.24,0-5.85-2.61-6.04-5.83-3.04-50.91-45.59-91.27-97.65-91.27h-13.7c-3.24,0-5.87-2.61-5.87-5.83v-27.19Z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-base sm:text-xl font-black text-white tracking-wider">
                ATLAS
              </h1>
            </div>
          </div>

          {/* Navigation Icons */}
          <nav className="flex items-center gap-4 pl-4">
            <button
              className={`font-sans flex sm:space-x-2 transition-colors text-sm bg-white/10 backdrop-blur-md rounded-full ${
                currentPage === "events"
                  ? "text-white px-2 sm:px-3 py-2"
                  : "text-white/60 hover:bg-[#AE3813]/20 px-3 py-2 rounded-sm hover:text-[#D45E3C]"
              }`}
            >
              <Calendar className="w-5 h-5" />

              <span className="hidden sm:inline-block">Events</span>
            </button>

            <button
              className={`font-sans flex space-x-2 transition-colors text-sm text-white/60 px-0.5 py-1`}
            >
              <MapPin className="w-5 h-5 text-white/50" />

              <span className="text-white/60 hidden sm:inline-block">Map</span>
            </button>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button className="p-3 rounded-md text-white/60 hover:text-white hover:bg-[#1E1E25]/50 transition-all duration-200">
              <Search className="w-5 h-5" />
            </button>

            <button className="sm:px-4 px-3 py-2 bg-gradient-to-r from-[#AE3813] to-[#D45E3C] text-white font-medium font-sans rounded-md hover:from-[#AE3813]/80 hover:to-[#D45E3C]/80 transition-all duration-200 transform hover:scale-105 flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline-block">Subscribe</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
