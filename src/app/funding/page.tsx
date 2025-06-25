import Image from "next/image";
import { getAllEvents } from "@/lib/events";
import { Footer } from "@/components/event/footer";
import { Header } from "@/components/event/header";
import { ClientHomePage } from "@/components/ClientHomePage";
import ClientCommunitiesPage from "@/components/communities";
import ClientFundingPage from "@/components/funding";

// Add city data: name and Unsplash image

export default async function Communities() {
  return (
    <div className="min-h-screen w-full bg-[#131318] text-gray-100 font-sans">
      <Header />
      <ClientFundingPage />
      <Footer />
    </div>
  );
}
