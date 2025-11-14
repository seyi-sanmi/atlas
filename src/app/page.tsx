import Image from "next/image";
import { getAllEvents } from "@/lib/events";
import { Footer } from "@/components/event/footer";
import { Header } from "@/components/event/header";
import { ClientHomePage } from "@/components/ClientHomePage";

// Add city data: name and Unsplash image

export default async function Home() {
  // Server-side data fetching for initial load
  const initialEvents = await getAllEvents();

  return (
    <div className="min-h-screen w-full bg-primary-bg text-gray-100 font-sans">
      <ClientHomePage initialEvents={initialEvents} />
      <Footer />
    </div>
  );
}
