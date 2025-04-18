import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  parsePostResponse,
  generateAndUploadImage,
  normalizeMarkdown,
} from "../utils/helpers";
import { getExistingPostTitles, savePostToDatabase } from "../utils/database";
import { getCurrentTechContext } from "../utils/topic-selection";
import { getDetailedTopicInformation } from "../utils/topic-research";
import { polishBlogPost } from "../utils/post-refining";
import { validateAndCorrectMarkdown } from "../utils/post-validation";

/**
 * Generates a general blog post using a multi-stage approach:
 * 1. Topic selection based on current tech trends
 * 2. Research gathering on the selected topic
 * 3. Detailed post generation with the research
 * 4. Post refinement and validation
 * 5. Image generation and database storage
 * 
 * @param genAI - Google Generative AI client instance
 * @param supabase - Supabase client for database operations
 * @returns Promise<boolean> - Success status of the post generation process
 */
export async function generateGeneralPost(
  genAI: GoogleGenAI,
  supabase: SupabaseClient
): Promise<boolean> {
  console.log("\n--- Generating General Post ---");

  // STAGE 1: Topic Selection
  console.log("Stage 1: Selecting blog topic...");

  // Get current tech context to inform topic selection
  console.log("Fetching current tech context...");
  const techContext = await getCurrentTechContext();

  // Get existing post titles to avoid duplication
  console.log("Fetching existing post titles...");
  const existingTitles = await getExistingPostTitles(supabase);

  // Create a context string of existing topics to avoid in the prompt
  const existingTopicsContext =
    existingTitles.length > 0
      ? `\nAVOID these topics as they've been covered recently:\n${existingTitles
          .map((title) => `- ${title}`)
          .join("\n")}\n`
      : "";

  // Stage 1 prompt: Select a topic only
  const topicSelectionPrompt = `
    You are an AI blog topic selector. Your job is to choose an interesting, relevant tech topic for a blog post.
    
    Here is some current context about technology trends to help you choose:
    ${techContext}

    ${existingTopicsContext}

    
    SELECTION CRITERIA:
    1. Choose a specific tech-related topic that would be relevant today.
    2. IMPORTANT: Choose a topic that is NOT similar to any of the existing post titles listed above.
    3. Be specific - don't just say "AI" but rather something like "Using AI for Personal Task Management"
    4. Choose topics that would be valuable to tech professionals, developers, or tech enthusiasts.
    5. Prioritize topics that have practical applications or insights rather than just news.
    
    Return ONLY the topic title, description, and search terms in this format:

    TOPIC: Your Topic Here
    DESCRIPTION: Brief description of what the blog post will cover
    SEARCH_TERMS: 3-5 specific search terms that would help find detailed information about this topic
    `;

  try {
    // Generate topic selection using AI
    const topicResponse = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: topicSelectionPrompt,
    });

    // Extract text from the response
    const topicText =
      topicResponse.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Parse the topic selection using regex to extract key components
    const topicMatch = topicText.match(/TOPIC:\s*(.*?)(?:\n|$)/);
    const descriptionMatch = topicText.match(/DESCRIPTION:\s*(.*?)(?:\n|$)/);
    const searchTermsMatch = topicText.match(/SEARCH_TERMS:\s*(.*?)(?:\n|$)/);

    // Validate that all required components were extracted
    if (!topicMatch || !descriptionMatch || !searchTermsMatch) {
      console.error("❌ Failed to parse topic selection");
      return false;
    }

    // Extract and clean the topic components
    const selectedTopic = topicMatch[1].trim();
    const topicDescription = descriptionMatch[1].trim();
    const searchTerms = searchTermsMatch[1].trim();

    // Uncomment for debugging
    // console.log(`Selected topic: ${selectedTopic}`);
    // console.log(`Topic description: ${topicDescription}`);
    // console.log(`Search terms: ${searchTerms}`);

    // STAGE 2: Research - Gather detailed information about the selected topic
    console.log("Stage 2: Gathering detailed information about the topic...");
    const detailedInfo = await getDetailedTopicInformation(
      selectedTopic,
      searchTerms
    );

    // Create prompt for generating the full blog post with the research data
    const blogGenerationPrompt = `
      You are a helpful AI blogger. Write a creative, useful and engaging blog post about the following topic:
      
      TOPIC: ${selectedTopic}
      DESCRIPTION: ${topicDescription}
      
      Here is detailed information about this topic to help you write an informed post:
      ${detailedInfo}
      
      1. Use the detailed information provided to create an accurate, well-informed blog post.
      2. Generate a catchy title that reflects the topic but might be more engaging than just "${selectedTopic}".
      3. Also provide an image description that represents your blog post's main theme.
      4. Estimate the read time in minutes for your content.
      5. Provide 3-5 relevant tags for the post (single words or short phrases).
      6. IMPORTANT: DO NOT include any hyperlinks in your content. Instead, mention resources by name without linking to them.
      7. Return it in this format:

      TITLE: Your Title Here
      DESCRIPTION: Short 1-liner summary here
      IMAGE_DESCRIPTION: A detailed description for image generation
      READ_TIME: Estimated read time in minutes (just the number)
      TAGS: tag1, tag2, tag3, tag4, tag5
      CONTENT:
      Your markdown content goes here. Add some structure like headings, bullet points, code blocks if needed.
      `;

    // Generate the full blog post with detailed information
    const blogResponse = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: blogGenerationPrompt,
    });

    // Process the generated blog post and save to database
    return await processGeneralPost(
      genAI,
      supabase,
      blogResponse,
      selectedTopic,
      topicDescription,
      detailedInfo
    );
  } catch (error) {
    console.error("❌ Error generating general post:", error);
    return false;
  }
}

/**
 * Processes the generated blog post response, refines it, and saves it to the database
 * 
 * @param genAI - Google Generative AI client instance
 * @param supabase - Supabase client for database operations
 * @param response - The AI-generated blog post response
 * @param selectedTopic - The selected topic title
 * @param topicDescription - Description of the selected topic
 * @param detailedInfo - Research information about the topic
 * @returns Promise<boolean> - Success status of the post processing
 */
async function processGeneralPost(
  genAI: GoogleGenAI,
  supabase: SupabaseClient,
  response: GenerateContentResponse,
  selectedTopic: string,
  topicDescription: string,
  detailedInfo: string
): Promise<boolean> {
  // Extract text from the AI response
  const text = response.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  // Parse the response into structured blog post data
  const parsedData = parsePostResponse(text, "general");
  if (!parsedData) {
    console.error("❌ Failed to parse blog post response");
    return false;
  }

  // Destructure the parsed blog post data
  let { title, description, imageDescription, content, readTime, tags, slug } =
    parsedData;

  // Normalize markdown to ensure consistent formatting
  content = normalizeMarkdown(content);

  // STAGE 3: Polish and improve the blog post
  console.log("Stage 3: Polishing and improving the blog post...");
  const polishedContent = await polishBlogPost(genAI, title, content, {
    topic: selectedTopic,
    description: topicDescription,
    detailedInfo: detailedInfo,
  });

  // Update content with polished version if successful
  if (polishedContent) {
    content = polishedContent;
  } else {
    console.log("⚠️ Using original content as polishing failed");
  }

  // STAGE 4: Validate and correct markdown formatting
  console.log("Stage 4: Validating and correcting markdown formatting...");
  content = await validateAndCorrectMarkdown(
    genAI,
    polishedContent ?? content,
    title
  );

  // STAGE 5: Generate and upload image for the blog post
  console.log("Stage 5: Generating and uploading image...");
  const imageUrl = await generateAndUploadImage(
    genAI,
    supabase,
    imageDescription,
    title
  );

  // STAGE 6: Save post to database
  console.log("Stage 6: Saving post to database...");
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
