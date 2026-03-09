import {
  GoogleGenAI,
  HarmBlockThreshold,
  HarmCategory,
  ThinkingLevel,
} from "@google/genai";
import { generateContentWithRateLimit } from "./rate-limiter";

// --- Constants ---
// Set this to true during development/testing to limit API calls
const IS_TESTING_MODE = false;
const MAX_RESEARCH_POINTS_FOR_TESTING = 3; // Limit API calls during testing

interface SourceInfo {
  uri?: string;
  title?: string;
}

export interface GroundedResearchResult {
  groundedText: string;
  sources: SourceInfo[];
  searchQueries?: string[];
  renderedContent?: string;
}

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

/**
 * Stage 4: Researches topics using Gemini Grounding with Google Search (v2.0 Model).
 * @param outlineMarkdown The clean blog post outline in Markdown.
 * @param topic The main topic for context in searches.
 * @returns A Map where keys are outline points/headings and values are grounded research results.
 */
export async function researchTopicWithGrounding(
  genAI: GoogleGenAI,
  outlineMarkdown: string,
  topic: string,
): Promise<Map<string, GroundedResearchResult>> {
  console.log(
    "\n🔍 Starting Research Stage using Gemini 2.5 Flash with Grounding Search...",
  );
  console.log(`📝 Topic: "${topic}"`);

  if (IS_TESTING_MODE) {
    console.warn(
      `🧪 TESTING MODE ACTIVE: Research limited to ${MAX_RESEARCH_POINTS_FOR_TESTING} points.`,
    );
  }

  const researchData = new Map<string, GroundedResearchResult>();

  // --- 1. Parse Outline ---
  const lines = outlineMarkdown
    .split("\n")
    .filter((line) => line.trim() !== "");
  let allResearchPoints: string[] = []; // Renamed to avoid confusion
  lines.forEach((line) => {
    const trimmedLine = line.trim();
    if (
      trimmedLine.startsWith("* ") ||
      trimmedLine.startsWith("- ") ||
      trimmedLine.startsWith("+ ") ||
      trimmedLine.startsWith("### ") ||
      trimmedLine.startsWith("#### ") ||
      trimmedLine.startsWith("## ")
    ) {
      allResearchPoints.push(
        trimmedLine.substring(trimmedLine.indexOf(" ") + 1).trim(),
      );
    }
  });

  // --- 2. Select Points  ---
  const pointsToSearch = IS_TESTING_MODE
    ? allResearchPoints.slice(0, MAX_RESEARCH_POINTS_FOR_TESTING)
    : allResearchPoints; // Use all points if not testing

  console.log(
    `🔎 Found ${allResearchPoints.length} research points, processing ${pointsToSearch.length} points.`,
  );

  for (const [index, point] of pointsToSearch.entries()) {
    // --- 3a. Craft Research Prompt (Remains the same) ---
    const systemPrompt = `
    You are a research assistant specializing in finding information that can be used to explain technology and its impact to a **general, non-technical audience.** When gathering details, prioritize facts, examples, and explanations that are:
- Easily understandable.
- Relatable to everyday experiences.
- Illustrative of real-world applications or consequences.
- Surprising or particularly interesting from a human perspective.
`;

    const researchPrompt = `
    Regarding the topic "${topic}" (which is aimed at a **general, non-technical audience**):

I need detailed information, facts, real-world examples, simple explanations, or analogies for the following specific point from our blog post outline:

**Outline Point to Research:** "${point}"

**Your Task:**
Provide verifiable and current information related to this point. Specifically, look for:

1.  **Core Facts/Data:** Key statistics or essential factual information.
2.  **Simple Explanations/Definitions:** If the point involves a technical concept, find ways to explain it in very simple terms or provide analogies a layperson would understand.
3.  **Relatable Examples:** Concrete examples of how this point manifests in the real world, in products people use, or in situations they might encounter. How does this affect an ordinary person?
4.  **Interesting Details or "Wow" Factors:** Any surprising facts, historical context (if relevant and simple), or particularly illustrative anecdotes related to this point that would capture the interest of a non-technical reader.

Focus on information that will help explain this point clearly and engagingly to someone without a deep tech background.

If you use external search (which is expected), please ensure the information is current and from credible sources.
    `;

    console.log(
      `[${index + 1}/${pointsToSearch.length}] 🔍 Researching: "${point}"`,
    );

    try {
      // --- 3b. Call Gemini API with Grounding Enabled (v2.0 style) ---
      const researchResponse = await generateContentWithRateLimit(genAI, {
        model: "gemini-3.1-flash-lite-preview",
        contents: [researchPrompt],
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
          systemInstruction: systemPrompt,
          safetySettings,
          temperature: 0.5,
          tools: [{ googleSearch: {} }],
        },
      });

      // --- 3c. Process API Results (Response structure expected to be similar) ---
      const groundedText = researchResponse.text;
      const metadata = researchResponse.candidates?.[0]?.groundingMetadata;

      const sources: SourceInfo[] = [];
      let searchQueries: string[] | undefined = undefined;
      let renderedContentHtml: string | undefined = undefined;

      if (metadata) {
        if (metadata.groundingChunks) {
          metadata.groundingChunks.forEach((chunk: any) => {
            if (chunk.web) {
              sources.push({ uri: chunk.web.uri, title: chunk.web.title });
            }
          });
        }
        if (metadata.webSearchQueries) {
          searchQueries = metadata.webSearchQueries;
        }
        if (metadata.searchEntryPoint?.renderedContent) {
          renderedContentHtml = metadata.searchEntryPoint.renderedContent;
        }

        console.log(`  ✅ Retrieved data with ${sources.length} sources`);
      } else {
        console.log(`  ℹ️ Retrieved data from model knowledge (no grounding)`);
      }

      if (groundedText) {
        researchData.set(point, {
          groundedText,
          sources,
          searchQueries,
          renderedContent: renderedContentHtml,
        });
      } else {
        console.log(`  ⚠️ No text response received`);
        researchData.set(point, { groundedText: "", sources: [] });
      }
    } catch (error: any) {
      console.error(
        `❌ Error researching "${point}": ${error?.message || error}`,
      );
      if (error.response?.candidates?.[0]?.finishReason === "SAFETY") {
        console.error("  ⛔ Blocked due to safety settings");
      }
      researchData.set(point, {
        groundedText: `Error fetching research: ${error?.message}`,
        sources: [],
      });
    }

    // Add a small explicit delay in the console to show pacing between research queries
    if (index < pointsToSearch.length - 1) {
      console.log(
        `  ⏳ Waiting 5 seconds before researching the next point...`,
      );
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  console.log(
    `\n✅ Research Stage Completed: ${researchData.size}/${pointsToSearch.length} points processed successfully.`,
  );
  return researchData;
}
