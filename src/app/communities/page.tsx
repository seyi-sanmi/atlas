import Image from "next/image";
import { getAllCommunities } from "@/lib/communities";
import { Footer } from "@/components/event/footer";
import { Header } from "@/components/event/header";
import { ClientHomePage } from "@/components/ClientHomePage";
import ClientCommunitiesPage from "@/components/communities";

// Add city data: name and Unsplash image

export default async function Communities() {
  // Server-side data fetching for initial load
  try {
    const initialCommunities = await getAllCommunities();
    
    return (
      <div className="min-h-screen w-full bg-[#131318] text-gray-100 font-sans">
        <ClientCommunitiesPage initialCommunities={initialCommunities} />
        <Footer />
      </div>
    );
  } catch (error) {
    console.error('Failed to fetch communities on server:', error);
    
    // Fallback to client-side loading if server fetch fails
    return (
      <div className="min-h-screen w-full bg-[#131318] text-gray-100 font-sans">
        <ClientCommunitiesPage />
        <Footer />
      </div>
    );
  }
}
