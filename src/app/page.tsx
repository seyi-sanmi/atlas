import Image from "next/image";
import { getAllEvents } from "@/lib/events";
import { Footer } from "./components/event/footer";
import { Header } from "./components/event/header";
import { ClientHomePage } from "./components/ClientHomePage";

// Add city data: name and Unsplash image
const cities = [
  {
    name: "London",
    image:
      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=70&fm=jpg&auto=compress&sat=50",
  },
  {
    name: "Birmingham",
    image:
      "https://images.unsplash.com/photo-1610818647551-866cce9f06d5?ixlib=rb-4.1.0&auto=format&fit=crop&w=1200&q=70&fm=jpg&auto=compress&sat=50",
  },
  {
    name: "Edinburgh",
    image:
      "https://images.unsplash.com/photo-1506377585622-bedcbb027afc?ixlib=rb-4.1.0&auto=format&fit=crop&w=1200&q=70&fm=jpg&auto=compress&sat=50",
  },
  {
    name: "Manchester",
    image:
      "https://images.unsplash.com/photo-1588934375041-0478480ae4c2?ixlib=rb-4.1.0&auto=format&fit=crop&w=1200&q=70&fm=jpg&auto=compress&sat=50",
  },
  {
    name: "Bristol",
    image:
      "https://images.unsplash.com/photo-1597079013069-bd1681f7454f?ixlib=rb-4.1.0&auto=format&fit=crop&w=1200&q=70&fm=jpg&auto=compress&sat=50",
  },
  {
    name: "Liverpool",
    image:
      "https://images.unsplash.com/photo-1557925179-a524ea601317?ixlib=rb-4.1.0&auto=format&fit=crop&w=1200&q=70&fm=jpg&auto=compress&sat=50",
  },
];

export default async function Home() {
  // Server-side data fetching for initial load
  const initialEvents = await getAllEvents();

  return (
    <div className="min-h-screen w-full bg-[#131318] text-gray-100 font-sans">
      <ClientHomePage initialEvents={initialEvents} cities={cities} />
      <Footer />
    </div>
  );
}
