"use client";

import { useAuth } from "@/lib/auth";
import { User } from "lucide-react";
import Link from "next/link";

export function SignInButton() {
  const { user } = useAuth();

  if (user) return null;

  return (
    <Link
      href="/auth/signin"
      className="flex items-center sm:space-x-2 px-4 py-2 bg-gradient-to-r from-[#AE3813] to-[#D45E3C] text-white font-medium rounded-lg hover:from-[#AE3813]/80 hover:to-[#D45E3C]/80 transition-all duration-200 transform hover:scale-105"
    >
      <User className="w-4 h-4" />
      <span className="hidden sm:inline-block">Sign In</span>
    </Link>
  );
}
