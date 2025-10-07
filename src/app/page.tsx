import Image from "next/image";
import { getAllEvents } from "@/lib/events";
import { Footer } from "@/components/event/footer";
import { Header } from "@/components/event/header";
import { ClientHomePage } from "@/components/ClientHomePage";

// Revalidate this page every 5 minutes
export const revalidate = 300;

export default async function Home() {
  // Server-side data fetching for initial load with caching
  const initialEvents = await getAllEvents();

  return (
    <div className="min-h-screen w-full bg-primary-bg text-gray-100 font-sans">
      <ClientHomePage initialEvents={initialEvents} />
      <Footer />
    </div>
  );
}
