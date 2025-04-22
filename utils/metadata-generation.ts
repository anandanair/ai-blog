import { GoogleGenAI } from "@google/genai";
import { calculateReadTime } from "./helpers";

// Define this in a types file or at the top
export interface BlogPostMetadata {
  title: string;
  metaDescription: string;
  imagePrompt: string; // Prompt for image generation model
  tags: string[]; // Array of tag strings
  readTimeMinutes: number; // Calculated read time
  category: string; // Main category for the post
}

/**
 * Stage 7: Generates metadata for the blog post.
 * @param genAI Initialized GoogleGenerativeAI client.
 * @param refinedBlogDraft The final refined Markdown content of the post.
 * @param topic The original topic for context.
 * @returns A BlogPostMetadata object or null on failure.
 */
export async function generateMetadata(
  genAI: GoogleGenAI,
  refinedBlogDraft: string,
  topic: string
): Promise<BlogPostMetadata | null> {
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
  
      **Instructions:**
      Generate the following metadata fields based *only* on the provided draft:
      1.  **title:** A compelling, SEO-friendly title (max ~70 characters).
      2.  **meta_description:** A concise summary for search engine results (~150-160 characters). It should entice clicks.
      3.  **image_prompt:** A detailed and descriptive prompt (suitable for an AI image generation model like DALL-E, Midjourney, or Gemini Image) that visually represents the core theme or a key concept of the blog post. Be specific about subjects, style (e.g., realistic photo, vector illustration, abstract), and mood.
      4.  **tags:** A list of 3-7 relevant keywords or tags as a JSON array of strings (e.g., ["tag1", "tag2", "tag3"]).
      5.  **category:** A single main category that best represents the post's primary topic area. Choose from common tech blog categories like "Smartphones", "Software & Apps", "Gaming", "AI & Machine Learning", "Cybersecurity", "Hardware", "Internet & Web", "Programming", "Tech News", "Gadgets", etc. Pick the most specific and relevant category.
  
      **Output Format:**
      Return ONLY a single valid JSON object containing these fields: "title", "meta_description", "image_prompt", "tags", "category".
      Do NOT include any other text, explanations, or markdown formatting outside the JSON object.
  
      **Example JSON Output Structure:**
      {
        "title": "Example Title Here",
        "meta_description": "Concise description of the post content goes here, optimized for search engines.",
        "image_prompt": "Detailed visual prompt for an AI image generator relevant to the post.",
        "tags": ["keyword1", "keyword2", "relevant_tag"],
        "category": "Software & Apps"
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
      parsedMetadata = JSON.parse(responseText);
      // Basic validation
      if (
        !parsedMetadata.title ||
        !parsedMetadata.meta_description ||
        !parsedMetadata.image_prompt ||
        !Array.isArray(parsedMetadata.tags) ||
        !parsedMetadata.category
      ) {
        throw new Error("Missing required fields in LLM JSON response.");
      }
    } catch (parseError: any) {
      console.error(
        "❌ Failed to parse JSON metadata from LLM:",
        parseError.message
      );
      console.error("   LLM Raw Response Text:", responseText);
      return null;
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
      category: parsedMetadata.category.trim(),
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
