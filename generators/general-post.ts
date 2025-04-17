import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SupabaseClient } from "@supabase/supabase-js";
import { parsePostResponse, generateAndUploadImage } from "../utils/helpers";
import { getExistingPostTitles, savePostToDatabase } from "../utils/database";
import axios from "axios";

async function getCurrentTechContext(): Promise<string> {
  let techContext = "Current trending tech topics:\n\n";

  try {
    // Part 1: Get HackerNews trending stories
    const hackerNewsTopics = await getHackerNewsTopics();
    techContext += hackerNewsTopics;

    // Part 2: Get Reddit trending topics
    const redditTopics = await getRedditTopics();
    techContext += "\n\nTrending topics from Reddit tech communities:\n";
    techContext += redditTopics;

    console.log("Tech context:", techContext); // Log the tech context to the console

    // Part 3: Add evergreen categories as fallback
    techContext += "\n\nEvergreen tech categories:\n";
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

// Helper function to get HackerNews topics
async function getHackerNewsTopics(): Promise<string> {
  try {
    const topStoriesResponse = await axios.get(
      "https://hacker-news.firebaseio.com/v0/topstories.json"
    );

    // Get the IDs of the top 5 stories
    const topStoryIds = topStoriesResponse.data.slice(0, 5);

    // Fetch details for each story
    let hackerNewsContext = "From HackerNews:\n";

    for (const storyId of topStoryIds) {
      const storyResponse = await axios.get(
        `https://hacker-news.firebaseio.com/v0/item/${storyId}.json`
      );

      const story = storyResponse.data;
      if (story && story.title) {
        hackerNewsContext += `Topic: ${story.title}\n`;
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
              hackerNewsContext += `- ${descriptionMatch[1].trim()}\n`;
            }
          } catch (error) {
            // If we can't fetch the URL, just continue
          }
        }

        // Add comments count as an indicator of popularity
        if (story.descendants) {
          hackerNewsContext += `- Discussion points: ${story.descendants}\n`;
        }

        hackerNewsContext += "\n";
      }
    }

    return hackerNewsContext;
  } catch (error) {
    console.error("Error fetching HackerNews topics:", error);
    return "";
  }
}

// Helper function to get Reddit topics
async function getRedditTopics(): Promise<string> {
  try {
    // List of tech subreddits to fetch from
    const techSubreddits = [
      "programming",
      "technology",
      "webdev",
      "MachineLearning",
      "datascience",
    ];

    let redditContext = "";

    // Get top posts from each subreddit
    for (const subreddit of techSubreddits) {
      try {
        // Reddit API requires a User-Agent header
        const response = await axios.get(
          `https://www.reddit.com/r/${subreddit}/top.json?limit=3&t=week`,
          {
            headers: {
              "User-Agent": "web:ai-blog-generator:v1.0 (by /u/YourUsername)", // Replace with your Reddit username
            },
          }
        );

        const posts = response.data.data.children;
        if (posts && posts.length > 0) {
          redditContext += `From r/${subreddit}:\n`;

          for (const post of posts) {
            const { title, score, num_comments, selftext } = post.data;
            redditContext += `- ${title}\n`;
            redditContext += `  Upvotes: ${score}, Comments: ${num_comments}\n`;

            // Add a snippet of the post content if available (and not too long)
            if (selftext && selftext.length > 0 && selftext.length < 300) {
              redditContext += `  Summary: ${selftext
                .substring(0, 200)
                .replace(/\n/g, " ")}...\n`;
            }

            redditContext += "\n";
          }
        }
      } catch (subredditError) {
        console.error(`Error fetching from r/${subreddit}:`, subredditError);
        // Continue with other subreddits if one fails
      }
    }

    return redditContext;
  } catch (error) {
    console.error("Error fetching Reddit topics:", error);
    return "";
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

  const existingTopicsContext =
    existingTitles.length > 0
      ? `\nAVOID these topics as they've been covered recently:\n${existingTitles
          .map((title) => `- ${title}`)
          .join("\n")}\n`
      : "";

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
