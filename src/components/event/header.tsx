"use client";
import React, { useState } from "react";
import {
  Calendar,
  MapPin,
  Compass,
  Database,
  Bell,
  Plus,
  Download,
  Users,
  Briefcase,
  Menu,
  X,
} from "lucide-react";
import { ImportEventModal } from "@/components/ImportEventModal";
import { SignInButton } from "@/components/auth/SignInButton";
import { UserMenu } from "@/components/auth/UserMenu";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface HeaderProps {
  onEventImported?: () => void; // Callback to refresh events list
  onOpenImportModal?: () => void; // Optional callback to open import modal externally
}

export function Header({ onEventImported, onOpenImportModal }: HeaderProps) {
  const [showImportModal, setShowImportModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="fixed top-0 w-full z-50 bg-primary-bg/80 backdrop-blur-xl border-b border-primary-border/90">
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
              <h1 className="text-base sm:text-xl font-black text-primary-text tracking-wider">
                ATLAS
              </h1>
            </div>
          </div>

          {/* Desktop Navigation - Hidden on Mobile */}
          <nav className="hidden sm:flex items-center gap-2 pl-4">
            <Link
              href={"/"}
              className={`font-sans flex sm:space-x-2 transition-colors text-sm px-2 sm:px-3 py-2 rounded-full ${
                pathname === "/"
                  ? "text-primary-text dark:bg-white/10 bg-black/5 backdrop-blur-md rounded-full"
                  : "text-primary-text/60 "
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span className="hidden sm:inline-block">Events</span>
            </Link>

            <Link
              href={"/communities"}
              className={`font-sans flex sm:space-x-2 transition-colors text-sm px-2 sm:px-3 py-2 ${
                pathname.startsWith("/communities")
                  ? "text-primary-text dark:bg-white/10 bg-black/5 backdrop-blur-md rounded-full"
                  : "text-primary-text/60"
              }`}
            >
              <Users
                className={`w-5 h-5 ${
                  pathname.startsWith("/communities")
                    ? "text-primary-text"
                    : "text-primary-text/50"
                }`}
              />
              <span
                className={`${
                  pathname.startsWith("/communities")
                    ? "text-primary-text"
                    : "text-primary-text/60"
                } hidden sm:inline-block`}
              >
                Communities
              </span>
            </Link>
            <Link
              href={"/funding"}
              className={`font-sans flex sm:space-x-2 transition-colors text-sm px-2 sm:px-3 py-2 ${
                pathname.startsWith("/funding")
                  ? "text-primary-text dark:bg-white/10 bg-black/5 backdrop-blur-md rounded-full"
                  : "text-primary-text/60"
              }`}
            >
              <Briefcase
                className={`w-5 h-5 ${
                  pathname.startsWith("/funding")
                    ? "text-primary-text"
                    : "text-primary-text/50"
                }`}
              />
              <span
                className={`${
                  pathname.startsWith("/funding")
                    ? "text-primary-text"
                    : "text-primary-text/60"
                } hidden sm:inline-block`}
              >
                Funding
              </span>
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                onOpenImportModal
                  ? onOpenImportModal()
                  : setShowImportModal(true)
              }
              className="text-white sm:px-4 px-3 py-2 bg-gradient-to-r from-[#AE3813] to-[#D45E3C] font-medium font-sans rounded-md hover:from-[#AE3813]/80 hover:to-[#D45E3C]/80 transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline-block ">Add Event</span>
            </button>

            {/* Authentication */}
            <SignInButton />
            <UserMenu />

            {/* Mobile Hamburger Menu Button - Visible on Mobile Only */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden flex items-center justify-center p-2 text-primary-text/60 hover:text-primary-text transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu - Only visible on mobile when open */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-primary-bg/95 backdrop-blur-xl border-b border-primary-border/90">
          <div className="container mx-auto px-6 py-4">
            <nav className="flex flex-col gap-2">
              <Link
                href={"/"}
                onClick={() => setMobileMenuOpen(false)}
                className={`font-sans flex items-center space-x-3 transition-colors text-sm px-3 py-3 rounded-lg ${
                  pathname === "/"
                    ? "text-primary-text dark:bg-white/10 bg-black/5 backdrop-blur-md"
                    : "text-primary-text/60 hover:text-primary-text hover:bg-white/5"
                }`}
              >
                <Calendar className="w-5 h-5" />
                <span>Events</span>
              </Link>

              <Link
                href={"/communities"}
                onClick={() => setMobileMenuOpen(false)}
                className={`font-sans flex items-center space-x-3 transition-colors text-sm px-3 py-3 rounded-lg ${
                  pathname.startsWith("/communities")
                    ? "text-primary-text dark:bg-white/10 bg-black/5 backdrop-blur-md"
                    : "text-primary-text/60 hover:text-primary-text hover:bg-white/5"
                }`}
              >
                <Users
                  className={`w-5 h-5 ${
                    pathname.startsWith("/communities")
                      ? "text-primary-text"
                      : "text-primary-text/50"
                  }`}
                />
                <span
                  className={`${
                    pathname.startsWith("/communities")
                      ? "text-primary-text"
                      : "text-primary-text/60"
                  }`}
                >
                  Communities
                </span>
              </Link>

              <Link
                href={"/funding"}
                onClick={() => setMobileMenuOpen(false)}
                className={`font-sans flex items-center space-x-3 transition-colors text-sm px-3 py-3 rounded-lg ${
                  pathname.startsWith("/funding")
                    ? "text-primary-text dark:bg-white/10 bg-black/5 backdrop-blur-md"
                    : "text-primary-text/60 hover:text-primary-text hover:bg-white/5"
                }`}
              >
                <Briefcase
                  className={`w-5 h-5 ${
                    pathname.startsWith("/funding")
                      ? "text-primary-text"
                      : "text-primary-text/50"
                  }`}
                />
                <span
                  className={`${
                    pathname.startsWith("/funding")
                      ? "text-primary-text"
                      : "text-primary-text/60"
                  }`}
                >
                  Funding
                </span>
              </Link>
            </nav>
          </div>
        </div>
      )}

      {/* Import Modal - only render if no external modal handler */}
      {!onOpenImportModal && (
        <ImportEventModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onEventImported={() => {
            setShowImportModal(false);
            onEventImported?.();
          }}
        />
      )}
    </header>
  );
}
