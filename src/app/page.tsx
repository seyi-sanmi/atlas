import Image from "next/image";
import { getAllEvents } from "@/lib/events";
import { Footer } from "@/components/event/footer";
import { Header } from "@/components/event/header";
import { ClientHomePage } from "@/components/ClientHomePage";

// Edge runtime for faster responses (optional - comment out if issues)
// export const runtime = 'edge';

// Revalidate this page every 5 minutes
export const revalidate = 300;

export default async function Home() {
  // Parallel data fetching for maximum speed
  const [initialEvents] = await Promise.all([
    getAllEvents(),
    // Add more parallel fetches here if needed, e.g.:
    // getEventStats(),
    // getFeaturedCommunities(),
  ]);

  return (
    <div className="min-h-screen w-full bg-primary-bg text-gray-100 font-sans">
      <ClientHomePage initialEvents={initialEvents} />
      <Footer />
    </div>
  );
}
