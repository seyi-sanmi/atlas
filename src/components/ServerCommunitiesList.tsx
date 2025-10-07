import { getAllCommunities } from "@/lib/communities";

// Server Component - Can be used with Suspense for streaming
export async function ServerCommunitiesList() {
  const communities = await getAllCommunities();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {communities.map((community) => (
        <div key={community.name} className="p-4 bg-secondary-bg rounded-lg border border-primary-border">
          <h3 className="font-bold text-lg text-primary-text">{community.name}</h3>
          {community.purpose && (
            <p className="text-primary-text/70 text-sm mt-2">{community.purpose}</p>
          )}
        </div>
      ))}
    </div>
  );
}

