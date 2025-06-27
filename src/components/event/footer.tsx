import React from "react";
import { Twitter, Instagram, Linkedin, Mail } from "lucide-react";
import { ModeToggle } from "../mode-toggle";

export function Footer() {
  return (
    <footer className="mt-4 relative bg-primary-bg/95 backdrop-blur-sm border-t border-white/20">
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Newsletter Subscription */}
        <div className="text-center mb-12">
          <h3 className="text-2xl font-display text-primary-text mb-2">
            Stay Updated
          </h3>
          <p className="text-primary-text/60 mb-6 max-w-md mx-auto text-balance">
            Get notified about the latest science events and opportunities in
            the UK
          </p>
          <div className="flex max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 bg-secondary-bg/50 border border-white/30 rounded-l-lg text-primary-text placeholder-black/40 dark:placeholder-white/40 focus:outline-none focus:border-[#AE3813] transition-colors"
            />
            <button className="px-6 py-3 bg-gradient-to-r from-[#AE3813] to-[#D45E3C] text-primary-text font-semibold rounded-r-lg hover:from-[#AE3813]/80 hover:to-[#D45E3C]/80 transition-all duration-200 flex items-center">
              <Mail className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Logos and Social Links */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo Section */}
          <div className="flex items-center gap-8">
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
                className="h-12 w-auto opacity-80 group-hover:opacity-100 transition-opacity block dark:hidden"
              />
              <img
                src="/images/renaissance-philanthropy-dark.png"
                alt="Renaissance Philanthropy"
                className="h-12 w-auto opacity-80 group-hover:opacity-100 transition-opacity hidden dark:block"
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
                className="h-10 w-auto opacity-80 group-hover:opacity-100 transition-opacity block dark:hidden"
              />
              <img
                src="/images/powered-by-aria-dark.png"
                alt="Powered by ARIA"
                className="h-10 w-auto opacity-80 group-hover:opacity-100 transition-opacity hidden dark:block"
              />
            </a>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-2">
            <a
              href="#"
              className="p-3 rounded-lg text-primary-text/60 hover:text-primary-text hover:bg-secondary-bg/50 transition-all duration-200 transform hover:scale-110"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="p-3 rounded-lg text-primary-text/60 hover:text-primary-text hover:bg-secondary-bg/50 transition-all duration-200 transform hover:scale-110"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="p-3 rounded-lg text-primary-text/60 hover:text-primary-text hover:bg-secondary-bg/50 transition-all duration-200 transform hover:scale-110"
            >
              <Linkedin className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center mt-8 pt-8 border-t border-white/20">
          <p className="text-primary-text/40 text-sm">
            © 2025 Alliance of Talent Leaders Across Science.
          </p>
          <p className="text-primary-text/30 text-sm">
            <i> Powered by Renaissance Philanthropy & ARIA. </i>
          </p>
          <ModeToggle />
        </div>
      </div>
    </footer>
  );
}
