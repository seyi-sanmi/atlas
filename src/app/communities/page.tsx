import Image from "next/image";
import { getAllCommunities } from "@/lib/communities";
import { Header } from "@/components/event/header";
import { ClientHomePage } from "@/components/ClientHomePage";
import ClientCommunitiesPage from "@/components/communities";
import { CommunitiesFooter } from "@/components/communities/footer";

// Add city data: name and Unsplash image

export default async function Communities() {
  // Server-side data fetching for initial load
  try {
    const initialCommunities = await getAllCommunities();

    return (
      <div className="min-h-screen w-full bg-primary-bg text-gray-100 font-sans">
        <ClientCommunitiesPage initialCommunities={initialCommunities} />
        <CommunitiesFooter />
      </div>
    );
  } catch (error) {
    console.error("Failed to fetch communities on server:", error);

    // Fallback to client-side loading if server fetch fails
    return (
      <div className="min-h-screen w-full bg-primary-bg text-gray-100 font-sans">
        <ClientCommunitiesPage />
        <CommunitiesFooter />
      </div>
    );
  }
}
