// Script to add a test event with research areas
// Run this in the browser console on localhost:3000

const testEvent = {
  title: "AI & Machine Learning Workshop",
  date: "2025-06-15",
  time: "14:00 - 17:00",
  location: "Tech Hub London",
  city: "London",
  description: "Join us for an intensive workshop on artificial intelligence and machine learning. Learn about neural networks, deep learning, and practical applications.",
  categories: ["Tech", "Workshop"],
  organizer: "London AI Community",
  url: "https://example.com/ai-workshop",
  ai_event_type: "Workshop",
  ai_interest_areas: ["Artificial Intelligence", "Machine Learning", "Data Analytics"],
  ai_categorized: true,
  ai_categorized_at: new Date().toISOString()
};

console.log("Test event with research areas:", testEvent);
console.log("Research areas:", testEvent.ai_interest_areas);

// Instructions for testing:
// 1. Open the browser console on localhost:3000
// 2. Copy and paste this script
// 3. The event card should now show research area tags
// 4. The tags will appear between the description and organizer sections 