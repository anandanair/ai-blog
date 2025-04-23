import { GoogleGenAI } from "@google/genai";
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
  const metadataPrompt = `
      Analyze the following blog post draft on the topic "${topic}" and generate the required metadata.
  
      **Blog Post Draft:**
      \`\`\`markdown
      ${refinedBlogDraft.substring(0, 8000)}
      \`\`\`
      ${
        refinedBlogDraft.length > 8000
          ? "\n...(Draft truncated for brevity)..."
          : ""
      }

      **Available Categories:**
      Please choose the most relevant category **ID** (integer) from the following list:
      ${categoryListText}
  
      **Instructions:**
      Generate the following metadata fields based *only* on the provided draft and the category list:
      1.  **title:** A compelling, SEO-friendly title (max ~70 characters).
      2.  **meta_description:** A concise summary for search engine results (~150-160 characters). It should entice clicks.
      3.  **image_prompt:** A detailed and descriptive prompt (suitable for an AI image generation model like DALL-E, Midjourney, or Gemini Image) that visually represents the core theme or a key concept of the blog post. Be specific about subjects, style (e.g., realistic photo, vector illustration, abstract), and mood.
      4.  **tags:** A list of 3-7 relevant keywords or tags as a JSON array of strings (e.g., ["tag1", "tag2", "tag3"]).
      5.  **category:** The **ID** (integer, e.g., 5, 12) of the single main category from the "Available Categories" list above that best represents the post's primary topic area. Select the most specific and relevant category ID.

      **Output Format:**
      Return ONLY a single valid JSON object containing these fields: "title", "meta_description", "image_prompt", "tags", "category". The "category" field MUST be an integer.
      Do NOT include any other text, explanations, or markdown formatting outside the JSON object.

      **Example JSON Output Structure:**
      {
        "title": "Example Title Here",
        "meta_description": "Concise description of the post content goes here, optimized for search engines.",
        "image_prompt": "Detailed visual prompt for an AI image generator relevant to the post.",
        "tags": ["keyword1", "keyword2", "relevant_tag"],
        "category": 5 // Example category ID (integer)
      }
    `;

  try {
    // --- 3. Call Gemini API ---
    const metedataResponse = await genAI.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17",
      contents: metadataPrompt,
      config: { temperature: 0.5, responseMimeType: "application/json" },
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
