import Image from "next/image";
import { getAllCommunities } from "@/lib/communities";
import { Header } from "@/components/event/header";
import { ClientHomePage } from "@/components/ClientHomePage";
import ClientCommunitiesPage from "@/components/communities";
import { CommunitiesFooter } from "@/components/communities/footer";

// Edge runtime for faster responses (optional - comment out if issues)
// export const runtime = 'edge';

// Revalidate this page every 5 minutes
export const revalidate = 300;

export default async function Communities() {
  // Parallel data fetching for maximum speed
  try {
    const [initialCommunities] = await Promise.all([
      getAllCommunities(),
      // Add more parallel fetches here if needed
    ]);

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
