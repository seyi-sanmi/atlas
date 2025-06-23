import Image from "next/image";
import { getAllEvents } from "@/lib/events";
import { Footer } from "@/components/event/footer";
import { Header } from "@/components/event/header";
import { ClientHomePage } from "@/components/ClientHomePage";
import ClientCommunitiesPage from "@/components/communities";

// Add city data: name and Unsplash image

export default async function Communities() {
  return (
    <div className="min-h-screen w-full bg-[#131318] text-gray-100 font-sans">
      <Header />
      <h1 className="pt-42 mx-auto text-4xl font-display">Coming Soon</h1>
      <Footer />
    </div>
  );
}
