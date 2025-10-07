import { getAllEvents } from "@/lib/events";
import { EventsList } from "./event/list";

// Server Component - Can be used with Suspense for streaming
export async function ServerEventsList() {
  const events = await getAllEvents();
  
  return (
    <EventsList
      events={events}
      loading={false}
    />
  );
}

