import { GoogleGenAI, Type } from "@google/genai";
import { calculateReadTime } from "./helpers";
import { SupabaseClient } from "@supabase/supabase-js";
import { getAllCategories } from "./database";

// Define this in a types file or at the top
export interface BlogPostMetadata {
  title: string;
  metaDescription: string;
  imagePrompt: string; // Prompt for image generation model
  tags: string[]; // Array of tag strings
  readTimeMinutes: number; // Calculated read time
  category: number; // Main category for the post
}

/**
 * Stage 7: Generates metadata for the blog post.
 * @param genAI Initialized GoogleGenerativeAI client.
 * @param supabase Initialized Supabase client.
 * @param refinedBlogDraft The final refined Markdown content of the post.
 * @param topic The original topic for context.
 * @returns A BlogPostMetadata object or null on failure.
 */
export async function generateMetadata(
  genAI: GoogleGenAI,
  supabase: SupabaseClient,
  refinedBlogDraft: string,
  topic: string
): Promise<BlogPostMetadata | null> {
  // --- 0. Fetch Categories ---
  let categories: { id: number; title: string }[] = []; // Use id: number
  let categoryListText =
    "Could not fetch categories. Please choose a general category ID like 1 (assuming 1 is a valid ID)."; // Default text
  try {
    categories = await getAllCategories(supabase);
    if (categories.length > 0) {
      categoryListText = categories
        .map((cat) => `- ${cat.title} (id: ${cat.id})`) // Show ID
        .join("\n");
    } else {
      console.warn("⚠️ No categories found in the database.");
      categoryListText =
        "No categories found in database. Please choose a general category ID like 1.";
    }
  } catch (error) {
    console.error("❌ Error fetching categories for metadata prompt:", error);
    // Keep the default categoryListText
  }

  // --- 1. Calculate Read Time ---
  const readTimeMinutes = calculateReadTime(refinedBlogDraft);

  // --- 2. Craft LLM Prompt for other metadata ---
  // Using JSON output instruction for easier parsing (works well with Gemini 1.5+)
  const metadataSystemPrompt = `
  You are a "Digital Content Optimizer" with a special talent for crafting metadata that attracts and engages a **general, non-technical audience** for a technology blog. Your goal is to make tech topics sound irresistible and easily discoverable by everyday people curious about technology's impact on their lives.

Core Principles for Metadata:
- **Audience First, Always:** Think like someone who isn't a tech expert. What words would they use? What would make them curious?
- **Clarity and Intrigue:** Titles and descriptions must be instantly understandable and spark interest. Avoid jargon.
- **Visual Appeal (for Image Prompts):** Image prompts should aim for visuals that are conceptually relevant, aesthetically pleasing, and relatable or thought-provoking for a general viewer, not just abstract tech representations.
- **Discoverability (for Tags/Keywords):** Use terms that average people might actually search for when looking for information on the topic.
- **Honest Representation:** Metadata should accurately reflect the blog post's content, which is designed to be accessible and informative for a non-technical reader.
`;

  const metadataPrompt = `
      Analyze the following blog post draft (which is written for a **general, non-technical audience**) and generate the required metadata.

**Blog Post Draft (written for a non-technical audience):**
\`\`\`markdown
${refinedBlogDraft.substring(0, 8000)}
\`\`\`
${
  refinedBlogDraft.length > 8000
    ? "\n...(Draft truncated for brevity, but assume it maintains a non-technical, explanatory style)..."
    : ""
}

**Available Categories (Choose the most relevant ID for a general tech blog):**
Please choose the most relevant category **ID** (integer) from the following list. Consider which category best signals the content type to a general reader.
${categoryListText}

**Instructions for Generating Metadata (for a NON-TECHNICAL audience):**

Generate the following metadata fields based *only* on the provided draft and the category list, keeping the **non-technical target audience** in mind for every field:

1.  **title:**
    *   A compelling, clear, and intriguing title (max ~60-70 characters).
    *   It should make a non-technical person curious and want to click.
    *   Use simple language; **avoid technical jargon.**
    *   Think: "What question does this answer?" or "What surprising thing will I learn?"
    *   *Examples:* "Is Your Smart TV Spying on You? The Simple Truth," "The Secret Tech That Decides Your Next Binge-Watch," "Could AI Be Your Next Doctor? What You Need to Know."

2.  **meta_description:**
    *   A concise summary for search engine results (~150-160 characters).
    *   It must entice clicks from a **general audience.**
    *   Clearly state what the post is about in simple terms and highlight *why it's interesting or relevant to them*.
    *   *Example for "AI Doctor":* "Wondering if AI could diagnose illnesses? Discover how artificial intelligence is changing healthcare and what it means for your future doctor visits."

3.  **image_prompt:**
    *   A detailed prompt for an AI image generator to create a visually engaging and conceptually relevant image for a **general audience.**
    *   **Focus on relatability and clear visual storytelling.**
    *   Describe subjects, style (e.g., "bright and friendly illustration," "thought-provoking symbolic photo," "futuristic but clean aesthetic"), mood (e.g., "curious," "optimistic," "slightly mysterious"), and key elements that capture the essence of the post in an accessible way.
    *   **Avoid overly abstract or technical imagery** unless it's presented in a very understandable metaphorical way.
    *   *Example for "AI Doctor":* "Warm, slightly futuristic illustration of a diverse group of patients interacting positively with a friendly, approachable AI medical interface, glowing softly. Background shows subtle medical symbols. Optimistic and reassuring mood."
    *   *Example for "Smart TV Spying":* "Stylized illustration of a sleek modern TV with a large, curious cartoon eye looking out from the screen. A slightly concerned but intrigued person is peeking from behind a sofa. Colors are a mix of domestic comfort and a hint of technological mystery."

4.  **tags:**
    *   A list of 3-7 relevant keywords or tags as a JSON array of strings.
    *   These should be terms a **non-technical person might actually use** when searching for information on this topic or related concepts.
    *   Include a mix of broader concepts and more specific (but still simple) terms.
    *   *Examples for "AI Doctor":* '["ai in healthcare", "medical technology", "future of medicine", "artificial intelligence", "health tech"]'
    *   *Examples for "Smart TV Spying":* '["smart tv privacy", "data collection", "tv spying", "tech privacy", "internet of things"]'

5.  **category:**
    *   The **ID** (integer) of the single main category from the "Available Categories" list that best represents the post's primary topic area *to a general reader.*
    *   Select the category that would make the most sense to someone browsing your blog who isn't a tech expert.

**Output Format:**
Return ONLY a single valid JSON object containing these fields: "title", "meta_description", "image_prompt", "tags", "category". The "category" field MUST be an integer.
Do NOT include any other text, explanations, or markdown formatting outside the JSON object.

**(Use the example JSON output structure provided in the original prompt if needed for field names and types.)**
    `;

  const metadataResponseSchema = {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description:
          "Compelling, SEO-friendly title (max ~60-70 characters) for a non-technical audience.",
      },
      meta_description: {
        type: Type.STRING,
        description:
          "Concise summary for search engines (~150-160 characters) to entice clicks from a general audience.",
      },
      image_prompt: {
        type: Type.STRING,
        description:
          "Detailed prompt for an AI image generator, focusing on relatability and clear visual storytelling for a general audience.",
      },
      tags: {
        type: Type.ARRAY,
        description:
          "3-7 relevant keywords/tags (JSON array of strings) a non-technical person might search for.",
        items: {
          type: Type.STRING,
        },
      },
      category: {
        type: Type.INTEGER, // Important: Use INTEGER for numeric IDs
        description:
          "The ID (integer) of the single main category from the provided list that best represents the post to a general reader.",
      },
    },
    required: ["title", "meta_description", "image_prompt", "tags", "category"],
  };

  try {
    // --- 3. Call Gemini API ---
    const metedataResponse = await genAI.models.generateContent({
      model: "gemini-2.5-flash-preview-05-20",
      contents: metadataPrompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        temperature: 0.5,
        responseMimeType: "application/json",
        systemInstruction: metadataSystemPrompt,
        responseSchema: metadataResponseSchema,
      },
    });

    // When using responseMimeType: "application/json", the text should be valid JSON
    const responseText = metedataResponse.text;

    if (!responseText) {
      console.error("❌ LLM returned an empty response for metadata.");
      return null;
    }

    // --- 4. Parse LLM JSON Output ---
    let parsedMetadata;
    try {
      // Clean potential markdown fences or extra text
      const jsonString = responseText.match(/\{[\s\S]*\}/)?.[0];
      if (!jsonString) {
        throw new Error("No valid JSON object found in LLM response.");
      }
      parsedMetadata = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("❌ Error parsing JSON from LLM:", parseError);
      console.error("LLM Raw Response:", responseText);
      return null;
    }

    if (
      !parsedMetadata.title ||
      !parsedMetadata.meta_description ||
      !parsedMetadata.image_prompt ||
      !Array.isArray(parsedMetadata.tags) ||
      !parsedMetadata.category ||
      typeof parsedMetadata.category !== "number" || // Check if category is a number
      !Number.isInteger(parsedMetadata.category) // Check if category is an integer
    ) {
      throw new Error("Missing required fields in LLM JSON response.");
    }

    if (
      categories.length > 0 &&
      !categories.some((cat) => cat.id === parsedMetadata.category)
    ) {
      console.warn(
        `⚠️ LLM returned category ID ${parsedMetadata.category} which is not in the fetched list.`
      );
    }

    // --- 5. Combine and Return ---
    const finalMetadata: BlogPostMetadata = {
      title: parsedMetadata.title.trim(),
      metaDescription: parsedMetadata.meta_description.trim(),
      imagePrompt: parsedMetadata.image_prompt.trim(),
      tags: parsedMetadata.tags
        .map((tag: any) => String(tag).trim())
        .filter(Boolean), // Ensure tags are strings
      readTimeMinutes: readTimeMinutes,
      category: parsedMetadata.category,
    };

    console.log("✅ Metadata generated successfully:");
    console.log(`   Title: ${finalMetadata.title}`);
    console.log(`   Category: ${finalMetadata.category}`);
    // console.log(`   Meta Desc: ${finalMetadata.metaDescription}`);
    // console.log(`   Image Prompt: ${finalMetadata.imagePrompt}`);
    // console.log(`   Tags: ${finalMetadata.tags.join(", ")}`);

    return finalMetadata;
  } catch (error: any) {
    console.error(
      "❌ Error generating metadata from LLM:",
      error?.message || error
    );
    const candidate = error.response?.candidates?.[0];
    if (candidate?.finishReason === "SAFETY") {
      console.error("   -> Blocked due to safety settings.");
    } else if (candidate?.finishReason) {
      console.error(`   -> Finished with reason: ${candidate.finishReason}`);
    }
    return null;
  }
}
