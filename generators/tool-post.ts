import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SupabaseClient } from "@supabase/supabase-js";
import { parsePostResponse, generateAndUploadImage } from "../utils/helpers";
import { savePostToDatabase, getPreviouslyUsedTools } from "../utils/database";

export async function generateAiToolPost(
  genAI: GoogleGenAI,
  supabase: SupabaseClient
): Promise<boolean> {
  console.log("\n--- Generating AI Tool of the Day Post ---");

  // Get previously used tools
  const usedTools = await getPreviouslyUsedTools(supabase);
  const usedToolsList =
    usedTools.length > 0 ? usedTools.join(", ") : "None yet";

  console.log(`Previously used tools (from database): ${usedToolsList}`);
  const prompt = `
    You are an AI blogger specializing in AI tools. Your goal is to feature a specific "AI Tool of the Day".
    1. Using your knowledge base, select a specific, interesting AI tool (could be for productivity, creativity, development, etc.). Prioritize real tools people can find and use.
    2. **CRITICAL: Do NOT choose any tool from this list of previously featured tools: [${usedToolsList}]**. Pick something new.
    3. Generate a catchy title for the blog post about this tool. The title MUST clearly mention the tool's name.
    4. Write a short, engaging description (1-2 sentences).
    5. Provide a detailed description for generating a relevant image (e.g., the tool's logo, UI, or a conceptual representation).
    6. Estimate the read time in minutes for your content.
    7. Provide 3-5 relevant tags for the post (single words or short phrases).
    8. Explain what the tool does, its key features, potential use cases, and if possible, mention its website or how to find it (do not make up links). Use headings, lists, etc., for structure.
    9. Return the response strictly in this format:

    TOOL_NAME: Name Of The AI Tool Featured
    TITLE: Your Title Here (Must include the tool name)
    DESCRIPTION: Short 1-liner summary here
    IMAGE_DESCRIPTION: A detailed description for image generation
    READ_TIME: Estimated read time in minutes (just the number)
    TAGS: tag1, tag2, tag3, tag4, tag5
    CONTENT:
    Your markdown content goes here. Add some structure like headings, bullet points, code blocks if needed.
    `;

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17",
      // model: "gemini-2.0-flash",
      contents: prompt,
    });

    return await processToolPost(genAI, supabase, response);
  } catch (error) {
    console.error("❌ Error generating AI tool post:", error);
    return false;
  }
}

async function processToolPost(
  genAI: GoogleGenAI,
  supabase: SupabaseClient,
  response: GenerateContentResponse
): Promise<boolean> {
  const text = response.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  const parsedData = parsePostResponse(text, "tool");
  if (!parsedData) return false;

  const {
    toolName,
    title,
    description,
    imageDescription,
    content,
    readTime,
    tags,
    slug,
  } = parsedData;

  // Generate and upload image
  const imageUrl = await generateAndUploadImage(
    genAI,
    supabase,
    imageDescription,
    title
  );

  // Save post to database
  const success = await savePostToDatabase(supabase, {
    title,
    slug,
    description,
    content,
    category: "AI Tool of the Day",
    image_url: imageUrl,
    tool_name: toolName,
    read_time: readTime,
    tags,
  });

  if (success && toolName) {
    console.log(`✅ Successfully generated post for AI tool: "${toolName}"`);
  }

  return success;
}
