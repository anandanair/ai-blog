import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SupabaseClient } from "@supabase/supabase-js";
import { parsePostResponse, generateAndUploadImage } from "../utils/helpers";
import { savePostToDatabase } from "../utils/database";

export async function generateGeneralPost(
  genAI: GoogleGenAI,
  supabase: SupabaseClient
): Promise<boolean> {
  console.log("\n--- Generating General Post ---");
  const prompt = `
    You are a helpful AI blogger. Write a creative, useful and engaging blog post.
    1. Choose a tech-related or productivity topic yourself.
    2. Generate a catchy title, short description, and the full blog content.
    3. Also provide an image description that represents your blog post's main theme.
    4. Estimate the read time in minutes for your content.
    5. Provide 3-5 relevant tags for the post (single words or short phrases).
    6. Return it in this format:

    TITLE: Your Title Here
    DESCRIPTION: Short 1-liner summary here
    IMAGE_DESCRIPTION: A detailed description for image generation
    READ_TIME: Estimated read time in minutes (just the number)
    TAGS: tag1, tag2, tag3, tag4, tag5
    CONTENT:
    Your markdown content goes here. Add some structure like headings, bullet points, code blocks if needed.
    `;

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });
    
    return await processGeneralPost(genAI, supabase, response);
  } catch (error) {
    console.error("❌ Error generating general post:", error);
    return false;
  }
}

async function processGeneralPost(
  genAI: GoogleGenAI,
  supabase: SupabaseClient,
  response: GenerateContentResponse
): Promise<boolean> {
  const text = response.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  
  const parsedData = parsePostResponse(text, "general");
  if (!parsedData) return false;
  
  const { title, description, imageDescription, content, readTime, tags, slug } = parsedData;
  
  // Generate and upload image
  const imageUrl = await generateAndUploadImage(genAI, supabase, imageDescription, title);
  
  // Save post to database
  return await savePostToDatabase(supabase, {
    title,
    slug,
    description,
    content,
    category: null,
    image_url: imageUrl,
    tool_name: null,
    read_time: readTime,
    tags,
  });
}