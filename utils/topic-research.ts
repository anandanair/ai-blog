import { GoogleGenAI, HarmBlockThreshold, HarmCategory } from "@google/genai";

// --- Constants ---
// Set this to true during development/testing to limit API calls
const IS_TESTING_MODE = true;
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
  topic: string
): Promise<Map<string, GroundedResearchResult>> {
  // console.log(
  //   "\n🔍 Starting Research Stage using Gemini 2.5 Flash with Grounding Search..."
  // );

  if (IS_TESTING_MODE) {
    console.warn(
      `🧪 TESTING MODE ACTIVE: Research limited to ${MAX_RESEARCH_POINTS_FOR_TESTING} points.`
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
        trimmedLine.substring(trimmedLine.indexOf(" ") + 1).trim()
      );
    }
  });

  // --- 2. Select Points  ---
  const pointsToSearch = IS_TESTING_MODE
    ? allResearchPoints.slice(0, MAX_RESEARCH_POINTS_FOR_TESTING)
    : allResearchPoints; // Use all points if not testing

  // console.log(
  //   `Attempting research for ${pointsToSearch.length} points using grounding.`
  // );

  for (const point of pointsToSearch) {
    // --- 3a. Craft Research Prompt (Remains the same) ---
    const researchPrompt = `Regarding the topic "${topic}", provide detailed information, facts, examples, or explanations for the following specific point: "${point}". Focus on providing verifiable and current information. If you use external search, please indicate.`; // Added hint about search

    // console.log(` -> Researching: "${point}"`);

    try {
      // --- 3b. Call Gemini API with Grounding Enabled (v2.0 style) ---
      const researchResponse = await genAI.models.generateContent({
        model: "gemini-2.5-flash-preview-04-17",
        contents: [researchPrompt],
        config: {
          safetySettings,
          temperature: 0.5,
          tools: [{ googleSearch: {} }],
        },
      });

      // --- 3c. Process API Results (Response structure expected to be similar) ---
      const groundedText = researchResponse.text;
      // Grounding metadata path might be slightly different, but likely under candidates[0]
      const metadata = researchResponse.candidates?.[0]?.groundingMetadata;

      const sources: SourceInfo[] = [];
      let searchQueries: string[] | undefined = undefined;
      let renderedContentHtml: string | undefined = undefined;

      if (metadata) {
        // console.log(`   -> Grounding metadata found for "${point}"`);
        if (metadata.groundingChunks) {
          metadata.groundingChunks.forEach((chunk: any) => {
            // Use 'any' or define interface
            if (chunk.web) {
              sources.push({ uri: chunk.web.uri, title: chunk.web.title });
            }
          });
        }
        if (metadata.webSearchQueries) {
          searchQueries = metadata.webSearchQueries;
          // console.log(
          //   `   -> Search queries used: [${searchQueries.join(", ")}]`
          // );
        }
        if (metadata.searchEntryPoint?.renderedContent) {
          renderedContentHtml = metadata.searchEntryPoint.renderedContent;
          // console.log(
          //   `   -> Storing Google Search Suggestions HTML (Required by ToS). Length: ${renderedContentHtml.length}`
          // );
          // Store/handle this as per your compliance needs
        }
      } else {
        // console.log(
        //   `   -> No grounding metadata found for "${point}". Response is based on model knowledge.`
        // );
      }

      if (groundedText) {
        researchData.set(point, {
          groundedText,
          sources,
          searchQueries,
          renderedContent: renderedContentHtml,
        });
      } else {
        // console.log(`   -> No text response for: "${point}"`);
        researchData.set(point, { groundedText: "", sources: [] });
      }
    } catch (error: any) {
      console.error(
        `❌ Error during grounding research for "${point}":`,
        error?.message || error
      );
      if (error.response?.candidates?.[0]?.finishReason === "SAFETY") {
        console.error("   -> Blocked due to safety settings.");
      }
      researchData.set(point, {
        groundedText: `Error fetching research: ${error?.message}`,
        sources: [],
      });
    }
  }

  console.log(
    `✅ Research Stage Completed. Processed ${pointsToSearch.length} points.`
  );
  return researchData;
}
