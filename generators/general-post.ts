import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SupabaseClient } from "@supabase/supabase-js";
import { parsePostResponse, generateAndUploadImage } from "../utils/helpers";
import { savePostToDatabase } from "../utils/database";
import axios from "axios";

// Function to get current tech trends using free APIs
async function getCurrentTechContext(): Promise<string> {
  try {
    // Using HackerNews API to get trending tech stories (completely free)
    const topStoriesResponse = await axios.get(
      "https://hacker-news.firebaseio.com/v0/topstories.json"
    );

    // Get the IDs of the top 5 stories
    const topStoryIds = topStoriesResponse.data.slice(0, 5);

    // Fetch details for each story
    let techContext = "Current trending tech topics:\n\n";

    for (const storyId of topStoryIds) {
      const storyResponse = await axios.get(
        `https://hacker-news.firebaseio.com/v0/item/${storyId}.json`
      );

      const story = storyResponse.data;
      if (story && story.title) {
        techContext += `Topic: ${story.title}\n`;
        if (story.url) {
          // Fetch a small snippet from the URL if possible
          try {
            const urlResponse = await axios.get(story.url, {
              timeout: 3000,
              headers: { "User-Agent": "Mozilla/5.0" },
            });

            // Extract a simple description from the HTML
            const htmlContent = urlResponse.data.toString();
            const descriptionMatch =
              htmlContent.match(
                /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i
              ) ||
              htmlContent.match(
                /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["'][^>]*>/i
              );

            if (descriptionMatch && descriptionMatch[1]) {
              techContext += `- ${descriptionMatch[1].trim()}\n`;
            }
          } catch (error) {
            // If we can't fetch the URL, just continue
          }
        }

        // Add comments count as an indicator of popularity
        if (story.descendants) {
          techContext += `- Discussion points: ${story.descendants}\n`;
        }

        techContext += "\n";
      }
    }

    // As a backup, also add some general tech categories that are always relevant
    techContext += "\nEvergreen tech categories:\n";
    techContext += "- Artificial Intelligence and Machine Learning\n";
    techContext += "- Web Development (Frontend and Backend)\n";
    techContext += "- Mobile App Development\n";
    techContext += "- Cybersecurity\n";
    techContext += "- Cloud Computing\n";
    techContext += "- DevOps and Infrastructure\n";

    return techContext;
  } catch (error) {
    console.error("Error fetching current tech context:", error);

    // Return fallback categories if API fails
    return `
      Unable to fetch trending topics. Here are some evergreen tech categories:
      - Artificial Intelligence and Machine Learning
      - Web Development (Frontend and Backend)
      - Mobile App Development
      - Cybersecurity
      - Cloud Computing
      - DevOps and Infrastructure
    `;
  }
}

// Add this function to fetch existing post titles from Supabase
async function getExistingPostTitles(supabase: SupabaseClient): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('posts')  // Replace with your actual table name if different
      .select('title')
      .order('created_at', { ascending: false })
      .limit(50);  // Get the most recent 50 posts
    
    if (error) {
      console.error("Error fetching existing posts:", error);
      return [];
    }
    
    return data.map(post => post.title);
  } catch (error) {
    console.error("Error in getExistingPostTitles:", error);
    return [];
  }
}

export async function generateGeneralPost(
  genAI: GoogleGenAI,
  supabase: SupabaseClient
): Promise<boolean> {
  console.log("\n--- Generating General Post ---");

  // Get current tech context
  console.log("Fetching current tech context...");
  const techContext = await getCurrentTechContext();
  
  // Get existing post titles to avoid duplication
  console.log("Fetching existing post titles...");
  const existingTitles = await getExistingPostTitles(supabase);
  
  const existingTopicsContext = existingTitles.length > 0 
    ? `\nAVOID these topics as they've been covered recently:\n${existingTitles.map(title => `- ${title}`).join('\n')}\n`
    : '';

  const prompt = `
    You are a helpful AI blogger. Write a creative, useful and engaging blog post.
    
    Here is some current context about technology trends to help you create a relevant post:
    ${techContext}
    ${existingTopicsContext}
    
    1. Choose a tech-related or productivity topic that would be relevant today. You can use the context above for inspiration, but don't just summarize the news - create original, thoughtful content.
    2. IMPORTANT: Choose a topic that is NOT similar to any of the existing post titles listed above.
    3. Generate a catchy title, short description, and the full blog content.
    4. Also provide an image description that represents your blog post's main theme.
    5. Estimate the read time in minutes for your content.
    6. Provide 3-5 relevant tags for the post (single words or short phrases).
    7. Return it in this format:

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

// The rest of your code remains unchanged
async function processGeneralPost(
  genAI: GoogleGenAI,
  supabase: SupabaseClient,
  response: GenerateContentResponse
): Promise<boolean> {
  const text = response.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  const parsedData = parsePostResponse(text, "general");
  if (!parsedData) return false;

  const {
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
