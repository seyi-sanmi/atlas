import OpenAI from 'openai';

// Research areas from the communities component
export const INTEREST_AREAS = [
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

// New 7-category event type structure - exported for use across the application
export const EVENT_TYPES = [
  "Technical Talk / Presentation",
  "Workshop / Discussion",
  "Demo / Showcase",
  "Social / Mixer",
  "Panel Discussion",
  "Research / Academic Conference",
  "Competition / Hackathon"
] as const;

export interface EventCategorizationResult {
  event_type: string; // Single event type using new 7-category structure
  event_interest_areas: string[];
}

export interface EventSummaryResult {
  summary: string;
  technicalKeywords: string[];
  excitementHook: string;
}

export interface EventToCategotize {
  title: string;
  description: string;
}

export interface EventToSummarize {
  eventName: string;
  eventDescription: string;
  targetAudience?: string[];
  keyActivities?: string[];
  keyTechnologies?: string[];
  mainIncentive?: string;
  fullText: string;
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
- You MUST classify the event into exactly 1 of the following categories:
  - \`Technical Talk / Presentation\` - Information sessions, program overviews, technical presentations, talks, seminars
  - \`Workshop / Discussion\` - Interactive workshops, structured discussions, brainstorming sessions, hands-on activities
  - \`Demo / Showcase\` - Technical demonstrations, showcases, demo nights, exhibition of work
  - \`Social / Mixer\` - Networking events, social gatherings, mixers, community building events
  - \`Panel Discussion\` - Expert panels, moderated discussions, Q&A sessions with multiple speakers
  - \`Research / Academic Conference\` - Formal academic conferences, symposiums, research presentations
  - \`Competition / Hackathon\` - Hackathons, competitions, contests, challenges

- **Single Category Rule:** Select the PRIMARY category that best represents the event's main purpose.
- **Hybrid Event Guidelines:** 
  - "Lunch & Learn" = \`Social / Mixer\` (networking focus with learning component)
  - "Demo Night with Networking" = \`Demo / Showcase\` (primary focus is demonstrations)
  - "Interactive Workshop Discussion" = \`Workshop / Discussion\` (primary focus is interactive learning)
  - "Info Session" = \`Technical Talk / Presentation\` (primary focus is information sharing)

**2. \`event_interest_areas\` Categorization:**
- **Core Theme Rule:** You MUST select only the most essential and central interest areas from the list below. Prioritize quality over quantity.
- **Identify 1 or 2 primary tags** that capture the fundamental subject of the event. Only add a third or fourth tag if it is an equally strong and central theme. Avoid adding tags for secondary topics mentioned in passing.
- **Out-of-Scope Rule:** If, and only if, the event's topic is clearly outside the scope of science, technology, or research (e.g., a poetry reading, a real estate seminar, a digital marketing summit) and NONE of the available tags are a strong, direct fit, you MUST return an empty list for this key: \`[]\`.
- Base your selection on the event title, description, speaker specializations, and listed topics.

List of Allowed \`event_interest_areas\` (Alphabetical Order):
${INTEREST_AREAS.map(area => `- "${area}"`).join('\n')}

---

**OUTPUT FORMAT:**
You must provide your response ONLY as a valid JSON object, with no explanatory text before or after it.

Example outputs:
- Single type: {"event_type": "Technical Talk / Presentation", "event_interest_areas": ["Artificial Intelligence", "Machine Learning"]}
- Another example: {"event_type": "Workshop / Discussion", "event_interest_areas": ["Artificial Intelligence"]}

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
    if (!result.event_type || !EVENT_TYPES.includes(result.event_type as any)) {
      console.warn('Invalid event_type format, defaulting to "Technical Talk / Presentation"');
      result.event_type = "Technical Talk / Presentation";
    }

    // Validate event_interest_areas
    if (!Array.isArray(result.event_interest_areas)) {
      console.warn('Invalid event_interest_areas format, defaulting to empty array');
      result.event_interest_areas = [];
    } else {
      // Filter out invalid interest areas
      result.event_interest_areas = result.event_interest_areas.filter(area => 
        INTEREST_AREAS.includes(area)
      );
    }

    return result;
  } catch (error) {
    console.error('Error categorizing event:', error);
    
    // Return default categorization on error
    return {
      event_type: "Technical Talk / Presentation",
      event_interest_areas: []
    };
  }
}

export async function generateEventSummary(event: EventToSummarize): Promise<EventSummaryResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  // Initialize OpenAI client inside the function (server-side only)
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const prompt = `### ROLE AND GOAL ###
You are an expert AI assistant for technical event summarization, part of an automated web scraping pipeline. Your goal is to receive a JSON object with structured data about an event and return a JSON object containing a concise, high-impact summary and related metadata. The output must be tailored for a scientifically and technically-minded audience (engineers, researchers, founders).

### INPUT FORMAT ###
You will receive a JSON object with the following schema. Some fields may be null or incomplete.
- \`eventName\`: string - The official title of the event.
- \`eventDescription\`: string - The primary descriptive text.
- \`targetAudience\`: string[] - A list of intended participant types.
- \`keyActivities\`: string[] - A list of primary activities (e.g., "Hackathon", "Demos").
- \`keyTechnologies\`: string[] - The core technologies or scientific concepts featured.
- \`mainIncentive\`: string - The primary prize or value proposition.
- \`fullText\`: string - The complete raw text as a fallback.

### TASK ###
Process the input JSON and generate a new JSON object with the following schema.

### OUTPUT SCHEMA ###
- \`summary\`: string - A compelling 2-3 sentence summary (50-75 words). Start with speaker credentials in SF style, then synthesize the core innovation (\`keyTechnologies\`) with the main action (\`keyActivities\`) and audience. Answer "Who are the impressive speakers?" and "Why is this event technically exciting?"
- \`technicalKeywords\`: string[] - A list of 5-7 key technical terms suitable for use as website tags. Extract from \`keyTechnologies\` and the \`fullText\`.
- \`excitementHook\`: string - A very short (under 10 words), punchy phrase that captures the event's core promise.

### INSTRUCTIONS & CONSTRAINTS ###
1.  **Speaker-First Summary:** The \`summary\` MUST start by highlighting the most impressive speakers in a concise, SF startup style format. Example: "Join Sarah (AI Lead @ DeepMind) and John (Stanford ML PhD, 3x Founder) for..." Extract real titles and affiliations from the description.
2.  **Prioritize Innovation:** After introducing speakers, focus on the technology or scientific breakthrough. Use the \`keyTechnologies\` field as your primary source. If it's empty, infer from \`eventName\` and \`eventDescription\`.
3.  **Be Factual and Dense:** The \`summary\` should be packed with information, not fluff. Avoid marketing jargon like "amazing," "incredible," or "don't miss."
4.  **Strict JSON Output:** Your entire response must be a single, valid JSON object conforming to the specified \`OUTPUT SCHEMA\`. Do not add any text before or after the JSON.
5.  **Keyword Quality:** The \`technicalKeywords\` should be specific (e.g., "Agentic PCB Design," not "Design").
6.  **Hook Quality:** The \`excitementHook\` should highlight the most impressive speaker credential or breakthrough. Example: "Learn from DeepMind's AI Architect" or "Stanford's Latest ML Breakthrough"

### INPUT JSON: ###
${JSON.stringify(event, null, 2)}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3, // Slightly higher temperature for creative summaries
      max_tokens: 500, // More tokens for detailed summaries
      response_format: { type: "json_object" }
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from OpenAI');
    }

    // Parse and validate the response
    const result = JSON.parse(responseContent) as EventSummaryResult;
    
    // Validate required fields
    if (!result.summary || !result.technicalKeywords || !result.excitementHook) {
      throw new Error('Invalid summary response format');
    }

    return result;
  } catch (error) {
    console.error('Error generating event summary:', error);
    
    // Return default summary on error
    return {
      summary: event.eventDescription || event.eventName,
      technicalKeywords: [],
      excitementHook: "Join us for this exciting event"
    };
  }
}

// Utility function to retry summary generation with exponential backoff
export async function generateEventSummaryWithRetry(
  event: EventToSummarize, 
  maxRetries: number = 3
): Promise<EventSummaryResult> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await generateEventSummary(event);
    } catch (error) {
      lastError = error as Error;
      console.warn(`Summary generation attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // If all retries failed, return default summary
  console.error(`All summary generation attempts failed:`, lastError);
  return {
    summary: event.eventDescription || event.eventName,
    technicalKeywords: [],
    excitementHook: "Join us for this exciting event"
  };
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
    event_type: "Technical Talk / Presentation",
    event_interest_areas: []
  };
} 