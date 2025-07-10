import OpenAI from 'openai';

// Research areas from the communities component
const RESEARCH_AREAS = [
  "Biotechnology & Synthetic Biology",
  "Genetics & Genomics",
  "Healthcare & Medicine",
  "Longevity & Aging",
  "Biosecurity & Biodefense",
  "Neuroscience",
  "Materials Science & Engineering",
  "Quantum Computing",
  "Robotics & AI",
  "Nanotechnology",
  "Space & Astronomy",
  "Neurotechnology",
  "Climate & Atmospheric Science",
  "Renewable Energy",
  "Ocean & Marine Science",
  "Conservation Biology",
  "Agriculture & Food Systems",
  "Environmental Health",
  "Artificial Intelligence",
  "Machine Learning",
  "Bioinformatics",
  "Chemoinformatics",
  "High-Performance Computing",
  "Data Analytics",
  "Natural Language Processing",
  "Biochemistry",
  "Chemistry",
  "Physics",
  "Biology",
  "Mathematics",
  "Photonics",
  "Computer Vision",
];

// Event types - exported for use across the application
export const EVENT_TYPES = [
  "Meetup / Mixer",
  "Workshop", 
  "Conference",
  "Lecture",
  "Panel Discussion",
  "Fireside Chat",
  "Webinar",
  "Hackathon",
  "Other"
] as const;

export interface EventCategorizationResult {
  event_type: string;
  event_interest_areas: string[];
}

export interface EventToCategotize {
  title: string;
  description: string;
}

export async function categorizeEvent(event: EventToCategotize): Promise<EventCategorizationResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  // Initialize OpenAI client inside the function (server-side only)
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const prompt = `You are an expert AI Event Categorization Engine. Your sole purpose is to analyze scraped text from event websites and classify the event into a strict, predefined JSON format. You must adhere to the following rules precisely.

**TASK:**
Analyze the provided event text, which includes a title and description, and generate a JSON object with two keys: \`event_type\` and \`event_interest_areas\`.

---

**RULESET:**

**1. \`event_type\` Categorization:**
- You MUST classify the event into EXACTLY ONE of the following categories:
  - \`Meetup / Mixer\`
  - \`Workshop\`
  - \`Conference\`
  - \`Lecture\`
  - \`Panel Discussion\`
  - \`Fireside Chat\`
  - \`Webinar\`
  - \`Hackathon\`
  - \`Other\`

- **Dominant Activity Rule:** If an event has multiple components (e.g., a talk and a hackathon), classify it based on the main activity or the one that occupies the most time. A 12-hour event with a 1-hour panel is a \`Hackathon\`.
- **Title-Driven Clues:** Give strong weight to keywords in the event title. "Fireside Chat with..." is a \`Fireside Chat\`. "AI Hackathon" is a \`Hackathon\`.

**2. \`event_interest_areas\` Categorization:**
- **Core Theme Rule:** You MUST select only the most essential and central interest areas from the list below. Prioritize quality over quantity.
- **Identify 1 or 2 primary tags** that capture the fundamental subject of the event. Only add a third or fourth tag if it is an equally strong and central theme. Avoid adding tags for secondary topics mentioned in passing.
- **Out-of-Scope Rule:** If, and only if, the event's topic is clearly outside the scope of science, technology, or research (e.g., a poetry reading, a real estate seminar, a digital marketing summit) and NONE of the available tags are a strong, direct fit, you MUST return an empty list for this key: \`[]\`.
- Base your selection on the event title, description, speaker specializations, and listed topics.

List of Allowed \`event_interest_areas\` (Alphabetical Order):
${RESEARCH_AREAS.map(area => `- "${area}"`).join('\n')}

---

**OUTPUT FORMAT:**
You must provide your response ONLY as a valid JSON object, with no explanatory text before or after it.

**EVENT TO ANALYZE:**

**Title:** ${event.title}

**Description:** ${event.description}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1, // Low temperature for consistent categorization
      max_tokens: 300, // Limit response size
      response_format: { type: "json_object" }
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from OpenAI');
    }

    // Parse and validate the response
    const result = JSON.parse(responseContent) as EventCategorizationResult;
    
    // Validate event_type
    if (!EVENT_TYPES.includes(result.event_type as any)) {
      console.warn(`Invalid event_type returned: ${result.event_type}, defaulting to "Other"`);
      result.event_type = "Other";
    }

    // Validate event_interest_areas
    if (!Array.isArray(result.event_interest_areas)) {
      console.warn('Invalid event_interest_areas format, defaulting to empty array');
      result.event_interest_areas = [];
    } else {
      // Filter out invalid interest areas
      result.event_interest_areas = result.event_interest_areas.filter(area => 
        RESEARCH_AREAS.includes(area)
      );
    }

    return result;
  } catch (error) {
    console.error('Error categorizing event:', error);
    
    // Return default categorization on error
    return {
      event_type: "Other",
      event_interest_areas: []
    };
  }
}

// Utility function to retry categorization with exponential backoff
export async function categorizeEventWithRetry(
  event: EventToCategotize, 
  maxRetries: number = 3
): Promise<EventCategorizationResult> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await categorizeEvent(event);
    } catch (error) {
      lastError = error as Error;
      console.warn(`Categorization attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // If all retries failed, return default categorization
  console.error(`All categorization attempts failed:`, lastError);
  return {
    event_type: "Other",
    event_interest_areas: []
  };
} 