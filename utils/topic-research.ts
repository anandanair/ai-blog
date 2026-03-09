import {
  GoogleGenAI,
  HarmBlockThreshold,
  HarmCategory,
  ThinkingLevel,
  Type,
} from "@google/genai";
import axios from "axios";
import * as cheerio from "cheerio";
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

type SearchResult = {
  title: string;
  uri: string;
  snippet?: string;
};

const querySchema = {
  type: Type.OBJECT,
  properties: {
    queries: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
    },
  },
  required: ["queries"],
};

async function buildSearchQueries(
  genAI: GoogleGenAI,
  topic: string,
  point: string,
): Promise<string[]> {
  const systemPrompt =
    "You generate concise web search queries for non-technical research. Return only valid JSON.";
  const prompt = `
Topic: ${topic}
Outline point: ${point}

Return 4-6 short search queries that a general audience might use to learn about this point.`;

  try {
    const response = await generateContentWithRateLimit(genAI, {
      model: "gemini-3.1-flash-lite-preview",
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: querySchema,
      },
      contents: prompt,
    });

    const raw = response.text || "";
    const parsed = JSON.parse(raw);
    const queries = Array.isArray(parsed?.queries) ? parsed.queries : [];
    const cleaned = queries
      .map((q: string) => q?.trim())
      .filter((q: string) => q && q.length > 2);

    if (cleaned.length > 0) {
      return Array.from(new Set(cleaned));
    }
  } catch (error) {
    console.warn("⚠️ Query generation failed, using fallback queries.");
  }

  const fallback = [
    `${topic} ${point}`,
    `${point} examples`,
    `${topic} real world impact`,
    `${topic} statistics`,
  ];
  return Array.from(new Set(fallback));
}

function decodeDuckDuckGoUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const uddg = parsed.searchParams.get("uddg");
    if (uddg) {
      return decodeURIComponent(uddg);
    }
  } catch (error) {
    return url;
  }
  return url;
}

async function searchDuckDuckGo(
  query: string,
  maxResults: number,
): Promise<SearchResult[]> {
  const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const response = await axios.get(url, {
    timeout: 8000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

  const $ = cheerio.load(response.data);
  const results: SearchResult[] = [];

  $(".result").each((_, element) => {
    if (results.length >= maxResults) {
      return;
    }
    const link = $(element).find("a.result__a").first();
    const title = link.text().trim();
    const href = link.attr("href")?.trim() || "";
    const snippet = $(element).find(".result__snippet").text().trim();
    if (!title || !href) {
      return;
    }
    const uri = href.includes("duckduckgo.com/l/")
      ? decodeDuckDuckGoUrl(href)
      : href;
    results.push({ title, uri, snippet });
  });

  return results;
}

function formatSourcesForPrompt(results: SearchResult[]): string {
  if (results.length === 0) {
    return "No external search results were found.";
  }
  return results
    .map(
      (result, index) =>
        `[${index + 1}] ${result.title}\n${result.uri}\n${result.snippet || ""}`,
    )
    .join("\n\n");
}

function dedupeSources(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  const deduped: SearchResult[] = [];
  results.forEach((result) => {
    const key = result.uri.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(result);
    }
  });
  return deduped;
}

/**
 * Stage 4: Researches topics using external search + Gemini synthesis.
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
    "\n🔍 Starting Research Stage using external search + Gemini synthesis...",
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
    const systemPrompt = `
    You are a research assistant specializing in finding information that can be used to explain technology and its impact to a **general, non-technical audience.** When gathering details, prioritize facts, examples, and explanations that are:
- Easily understandable.
- Relatable to everyday experiences.
- Illustrative of real-world applications or consequences.
- Surprising or particularly interesting from a human perspective.
`;

    console.log(
      `[${index + 1}/${pointsToSearch.length}] 🔍 Researching: "${point}"`,
    );

    try {
      const searchQueries = await buildSearchQueries(genAI, topic, point);
      const maxQueries = IS_TESTING_MODE ? 2 : 4;
      const maxResultsPerQuery = IS_TESTING_MODE ? 3 : 5;
      const selectedQueries = searchQueries.slice(0, maxQueries);

      const collectedResults: SearchResult[] = [];
      for (const query of selectedQueries) {
        try {
          const results = await searchDuckDuckGo(query, maxResultsPerQuery);
          collectedResults.push(...results);
        } catch (error) {
          console.warn(`⚠️ Search failed for query: ${query}`);
        }
      }

      const dedupedResults = dedupeSources(collectedResults).slice(0, 12);
      const sourcesText = formatSourcesForPrompt(dedupedResults);

      const researchPrompt = `
Regarding the topic "${topic}" (which is aimed at a **general, non-technical audience**):

I need detailed information, facts, real-world examples, simple explanations, or analogies for the following specific point from our blog post outline:

**Outline Point to Research:** "${point}"

Here are external search results to use as sources:
${sourcesText}

**Your Task:**
Provide verifiable and current information related to this point. Specifically, look for:

1.  **Core Facts/Data:** Key statistics or essential factual information.
2.  **Simple Explanations/Definitions:** If the point involves a technical concept, find ways to explain it in very simple terms or provide analogies a layperson would understand.
3.  **Relatable Examples:** Concrete examples of how this point manifests in the real world, in products people use, or in situations they might encounter. How does this affect an ordinary person?
4.  **Interesting Details or "Wow" Factors:** Any surprising facts, historical context (if relevant and simple), or particularly illustrative anecdotes related to this point that would capture the interest of a non-technical reader.

Use only the sources above, cite them in-line with [n] markers, and include a short "Sources" list at the end using the same numbering.
      `;

      const researchResponse = await generateContentWithRateLimit(genAI, {
        model: "gemini-3.1-flash-lite-preview",
        contents: [researchPrompt],
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
          systemInstruction: systemPrompt,
          safetySettings,
          temperature: 0.5,
        },
      });

      const groundedText = researchResponse.text;
      const sources: SourceInfo[] = dedupedResults.map((result) => ({
        uri: result.uri,
        title: result.title,
      }));

      console.log(`  ✅ Retrieved data with ${sources.length} sources`);

      if (groundedText) {
        researchData.set(point, {
          groundedText,
          sources,
          searchQueries: selectedQueries,
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
