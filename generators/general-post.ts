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

// New helper function to analyze topic category coverage
async function getTopicCategoryCoverage(
  supabase: SupabaseClient
): Promise<string> {
  try {
    // Define main tech categories
    const categories = [
      "AI and Machine Learning",
      "Web Development",
      "Mobile Development",
      "DevOps and Cloud",
      "Cybersecurity",
      "Data Science and Analytics",
      "Programming Languages",
      "Blockchain and Cryptocurrency",
      "IoT and Hardware",
      "AR/VR and Metaverse",
      "Tech Ethics and Society",
      "Productivity and Tools",
    ];

    // Get all posts with their titles and tags
    const { data, error } = await supabase
      .from("posts")
      .select("title, tags")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching posts for category analysis:", error);
      return "Unable to analyze category coverage.";
    }

    // Count posts per category
    const categoryCounts: Record<string, number> = {};
    categories.forEach((category) => (categoryCounts[category] = 0));

    // Simple keyword matching to categorize posts
    const categoryKeywords: Record<string, string[]> = {
      "AI and Machine Learning": [
        "ai",
        "artificial intelligence",
        "machine learning",
        "ml",
        "deep learning",
        "neural",
        "llm",
        "gpt",
        "gemini",
      ],
      "Web Development": [
        "web",
        "frontend",
        "backend",
        "javascript",
        "html",
        "css",
        "react",
        "vue",
        "angular",
        "node",
      ],
      "Mobile Development": [
        "mobile",
        "ios",
        "android",
        "app",
        "flutter",
        "react native",
        "swift",
        "kotlin",
      ],
      "DevOps and Cloud": [
        "devops",
        "cloud",
        "aws",
        "azure",
        "gcp",
        "kubernetes",
        "docker",
        "ci/cd",
        "pipeline",
        "serverless",
      ],
      Cybersecurity: [
        "security",
        "cyber",
        "hack",
        "vulnerability",
        "encryption",
        "privacy",
        "authentication",
      ],
      "Data Science and Analytics": [
        "data",
        "analytics",
        "visualization",
        "dashboard",
        "statistics",
        "pandas",
        "jupyter",
        "tableau",
      ],
      "Programming Languages": [
        "python",
        "javascript",
        "typescript",
        "java",
        "c++",
        "go",
        "rust",
        "programming language",
      ],
      "Blockchain and Cryptocurrency": [
        "blockchain",
        "crypto",
        "bitcoin",
        "ethereum",
        "web3",
        "nft",
        "token",
        "defi",
      ],
      "IoT and Hardware": [
        "iot",
        "hardware",
        "raspberry pi",
        "arduino",
        "sensor",
        "embedded",
        "device",
      ],
      "AR/VR and Metaverse": [
        "ar",
        "vr",
        "augmented reality",
        "virtual reality",
        "metaverse",
        "spatial",
      ],
      "Tech Ethics and Society": [
        "ethics",
        "society",
        "bias",
        "fairness",
        "regulation",
        "policy",
        "impact",
      ],
      "Productivity and Tools": [
        "productivity",
        "tool",
        "workflow",
        "automation",
        "efficiency",
        "software",
      ],
    };

    // Categorize each post
    data.forEach((post) => {
      const postText = (post.title + " " + (post.tags || "")).toLowerCase();

      for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some((keyword) => postText.includes(keyword))) {
          categoryCounts[category]++;
          break; // Assign to first matching category
        }
      }
    });

    // Format the results
    let result =
      "Here's the distribution of our recent blog posts by category:\n";

    // Sort categories by coverage (ascending)
    const sortedCategories = categories.sort(
      (a, b) => categoryCounts[a] - categoryCounts[b]
    );

    for (const category of sortedCategories) {
      const count = categoryCounts[category];
      const percentage =
        data.length > 0 ? Math.round((count / data.length) * 100) : 0;

      // Add emoji indicators for coverage
      let coverageIndicator = "🟢 Well covered";
      if (percentage === 0) coverageIndicator = "⚪ No coverage (priority)";
      else if (percentage < 10)
        coverageIndicator = "🔴 Very low coverage (high priority)";
      else if (percentage < 20)
        coverageIndicator = "🟠 Low coverage (medium priority)";

      result += `- ${category}: ${count} posts (${percentage}%) - ${coverageIndicator}\n`;
    }

    return result;
  } catch (error) {
    console.error("Error in getTopicCategoryCoverage:", error);
    return "Unable to analyze category coverage.";
  }
}

// New helper function to get seasonal tech events
function getCurrentSeasonalTechEvents(): string {
  const now = new Date();
  const month = now.getMonth();
  const day = now.getDate();

  let events = "Current seasonal tech relevance:\n";

  // Annual tech events by month
  switch (month) {
    case 0: // January
      events +=
        "- CES (Consumer Electronics Show) just happened or is happening\n";
      events += "- New Year's tech resolutions and predictions are relevant\n";
      events += "- Q1 tech planning and trends for the new year\n";
      break;
    case 1: // February
      events +=
        "- Mobile World Congress (MWC) is approaching or just happened\n";
      events +=
        "- Valentine's Day tech gift guides or relationship apps could be relevant\n";
      break;
    case 2: // March
      events += "- SXSW (South by Southwest) tech discussions\n";
      events += "- Game Developers Conference (GDC)\n";
      events += "- End of Q1 tech assessments\n";
      break;
    case 3: // April
      events += "- Tax season tech tools (in the US)\n";
      events += "- Earth Day and sustainable tech\n";
      events += "- Q2 begins - new tech quarterly releases\n";
      break;
    case 4: // May
      events += "- Google I/O developer conference\n";
      events += "- Microsoft Build developer conference\n";
      events += "- Graduation season tech gifts and tools\n";
      break;
    case 5: // June
      events += "- Apple WWDC developer conference\n";
      events += "- E3 gaming expo\n";
      events += "- Mid-year tech review and trends\n";
      break;
    case 6: // July
      events += "- Summer tech gadgets and tools\n";
      events += "- Q3 begins - tech industry shifts\n";
      events += "- Amazon Prime Day tech deals\n";
      break;
    case 7: // August
      events += "- Back to school tech\n";
      events += "- Samsung Unpacked event\n";
      events += "- Late summer tech releases\n";
      break;
    case 8: // September
      events += "- Apple iPhone event\n";
      events += "- IFA Berlin tech conference\n";
      events += "- Q4 preparation and tech planning\n";
      break;
    case 9: // October
      events += "- Google Pixel event\n";
      events += "- Cybersecurity awareness month\n";
      events += "- Halloween tech and smart home\n";
      break;
    case 10: // November
      events += "- Black Friday and holiday tech shopping\n";
      events += "- Web Summit conference\n";
      events += "- Gaming console releases and updates\n";
      break;
    case 11: // December
      events += "- End of year tech reviews and roundups\n";
      events += "- Tech predictions for next year\n";
      events += "- Holiday tech gift guides\n";
      break;
  }

  // Add current tech lifecycle context
  events += "\nTech lifecycle context:\n";

  // These are approximate and should be updated yearly
  if (month >= 8 || month <= 1) {
    // Sept to Feb
    events += "- New iPhone cycle (released in September)\n";
  }
  if (month >= 9 || month <= 2) {
    // Oct to March
    events += "- New Android flagship phones being announced\n";
  }
  if (month >= 5 && month <= 8) {
    // June to Sept
    events += "- Beta testing period for iOS and macOS\n";
  }
  if (month >= 3 && month <= 5) {
    // April to June
    events += "- Major developer conferences and platform announcements\n";
  }

  return events;
}

// First, let's modify the generateGeneralPost function to use a two-stage approach

export async function generateGeneralPost(
  genAI: GoogleGenAI,
  supabase: SupabaseClient
): Promise<boolean> {
  console.log("\n--- Generating General Post ---");

  // STAGE 1: Topic Selection
  console.log("Stage 1: Selecting blog topic...");

  // Get current tech context
  console.log("Fetching current tech context...");
  const techContext = await getCurrentTechContext();

  // Get existing post titles to avoid duplication
  console.log("Fetching existing post titles...");
  const existingTitles = await getExistingPostTitles(supabase);

  // Get topic categories and their coverage
  const topicCategoryCoverage = await getTopicCategoryCoverage(supabase);

  // Get seasonal tech events
  const seasonalEvents = getCurrentSeasonalTechEvents();

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

    TOPIC CATEGORY COVERAGE:
    ${topicCategoryCoverage}

    CURRENT TECH EVENTS AND SEASONAL RELEVANCE:
    ${seasonalEvents}
    
    SELECTION CRITERIA:
    1. Choose a specific tech-related topic that would be relevant today.
    2. IMPORTANT: Choose a topic that is NOT similar to any of the existing post titles listed above.
    3. Prioritize topics from categories that are underrepresented in our blog (see Topic Category Coverage).
    4. Consider seasonal relevance and current tech events when appropriate.
    5. Be specific - don't just say "AI" but rather something like "Using AI for Personal Task Management"
    6. Choose topics that would be valuable to tech professionals, developers, or tech enthusiasts.
    7. Prioritize topics that have practical applications or insights rather than just news.
    
    Return ONLY the topic title, description, and search terms in this format:

    TOPIC: Your Topic Here
    DESCRIPTION: Brief description of what the blog post will cover
    SEARCH_TERMS: 3-5 specific search terms that would help find detailed information about this topic
    CATEGORY: The main category this topic belongs to (AI, Web Development, Mobile, DevOps, Cybersecurity, Data Science, etc.)
    `;

  try {
    // Stage 1: Get topic selection
    const topicResponse = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: topicSelectionPrompt,
    });

    const topicText =
      topicResponse.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    console.log("Topic selection response:", topicText);

    // Parse the topic selection
    const topicMatch = topicText.match(/TOPIC:\s*(.*?)(?:\n|$)/);
    const descriptionMatch = topicText.match(/DESCRIPTION:\s*(.*?)(?:\n|$)/);
    const searchTermsMatch = topicText.match(/SEARCH_TERMS:\s*(.*?)(?:\n|$)/);
    const categoryMatch = topicText.match(/CATEGORY:\s*(.*?)(?:\n|$)/);

    if (!topicMatch || !descriptionMatch || !searchTermsMatch) {
      console.error("❌ Failed to parse topic selection");
      return false;
    }

    const selectedTopic = topicMatch[1].trim();
    const topicDescription = descriptionMatch[1].trim();
    const searchTerms = searchTermsMatch[1].trim();
    const category = categoryMatch ? categoryMatch[1].trim() : "Technology";

    console.log(`Selected topic: ${selectedTopic}`);
    console.log(`Topic description: ${topicDescription}`);
    console.log(`Search terms: ${searchTerms}`);
    console.log(`Category: ${category}`);

    // STAGE 2: Gather detailed information about the selected topic
    console.log("Stage 2: Gathering detailed information about the topic...");
    const detailedInfo = await getDetailedTopicInformation(
      selectedTopic,
      searchTerms
    );

    console.log("Topic:", selectedTopic);
    console.log("Description:", topicDescription);
    console.log("Detailed information:", detailedInfo);

    // Stage 2 prompt: Generate full blog post with detailed information
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
      6. Return it in this format:

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

    return await processGeneralPost(genAI, supabase, blogResponse);
  } catch (error) {
    console.error("❌ Error generating general post:", error);
    return false;
  }
}

// New function to get detailed information about a specific topic
async function getDetailedTopicInformation(
  topic: string,
  searchTerms: string
): Promise<string> {
  console.log(`Getting detailed information about: ${topic}`);
  let detailedInfo = `Detailed information about "${topic}":\n\n`;

  try {
    // 1. Try to get Reddit posts specifically about this topic
    const redditInfo = await getRedditInfoForTopic(topic, searchTerms);
    if (redditInfo) {
      detailedInfo += "Information from Reddit discussions:\n";
      detailedInfo += redditInfo + "\n\n";
    }

    // 2. Try to get HackerNews posts specifically about this topic
    const hackerNewsInfo = await getHackerNewsInfoForTopic(topic, searchTerms);
    if (hackerNewsInfo) {
      detailedInfo += "Information from HackerNews discussions:\n";
      detailedInfo += hackerNewsInfo + "\n\n";
    }

    // 3. As a fallback, we could add some general information about the topic category
    if (!redditInfo && !hackerNewsInfo) {
      detailedInfo +=
        "No specific information found. Here are some general points about this topic category:\n";
      detailedInfo += await getGeneralTopicInformation(topic);
    }

    return detailedInfo;
  } catch (error) {
    console.error("Error getting detailed topic information:", error);
    return "Unable to fetch detailed information about this topic.";
  }
}

// Helper function to get Reddit information about a specific topic
async function getRedditInfoForTopic(
  topic: string,
  searchTerms: string
): Promise<string | null> {
  try {
    // Convert search terms to an array and add the main topic
    const searchTermsArray = searchTerms.split(",").map((term) => term.trim());
    if (!searchTermsArray.includes(topic)) {
      searchTermsArray.push(topic);
    }

    let redditInfo = "";

    // Try each search term
    for (const term of searchTermsArray) {
      try {
        // Search Reddit for posts about this term
        const response = await axios.get(
          `https://www.reddit.com/search.json?q=${encodeURIComponent(
            term
          )}&sort=relevance&t=month&limit=3`,
          {
            headers: {
              "User-Agent": "web:ai-blog-generator:v1.0 (by /u/YourUsername)", // Replace with your Reddit username
            },
          }
        );

        const posts = response.data.data.children;
        if (posts && posts.length > 0) {
          redditInfo += `Results for "${term}":\n`;

          for (const post of posts) {
            const { title, selftext, subreddit, score, num_comments, url } =
              post.data;
            redditInfo += `- Post from r/${subreddit}: ${title}\n`;

            // Add the post content if available
            if (selftext && selftext.length > 0) {
              // Get a more substantial chunk of text, up to 500 chars
              const textSummary =
                selftext.length > 500
                  ? selftext.substring(0, 500) + "..."
                  : selftext;
              redditInfo += `  Content: ${textSummary.replace(/\n/g, " ")}\n`;
            }

            // Try to get comments for more context
            try {
              const commentsResponse = await axios.get(
                `${url.replace(/\/$/, "")}.json?limit=3`,
                {
                  headers: {
                    "User-Agent":
                      "web:ai-blog-generator:v1.0 (by /u/YourUsername)",
                  },
                }
              );

              // Comments are in the second element of the array
              if (
                commentsResponse.data[1] &&
                commentsResponse.data[1].data.children
              ) {
                const comments = commentsResponse.data[1].data.children;
                redditInfo += "  Top comments:\n";

                for (const comment of comments) {
                  if (comment.data.body) {
                    // Limit comment length
                    const commentText =
                      comment.data.body.length > 200
                        ? comment.data.body.substring(0, 200) + "..."
                        : comment.data.body;
                    redditInfo += `  - ${commentText.replace(/\n/g, " ")}\n`;
                  }
                }
              }
            } catch (commentError) {
              // If we can't get comments, just continue
            }

            redditInfo += "\n";
          }
        }
      } catch (termError) {
        console.error(`Error searching Reddit for term "${term}":`, termError);
        // Continue with other terms if one fails
      }
    }

    return redditInfo || null;
  } catch (error) {
    console.error("Error getting Reddit information for topic:", error);
    return null;
  }
}

// Helper function to get HackerNews information about a specific topic
async function getHackerNewsInfoForTopic(
  topic: string,
  searchTerms: string
): Promise<string | null> {
  try {
    // Since HackerNews doesn't have a direct search API, we'll get recent stories and filter
    const topStoriesResponse = await axios.get(
      "https://hacker-news.firebaseio.com/v0/topstories.json"
    );

    // Get the IDs of the top 30 stories (to have a better chance of finding relevant ones)
    const topStoryIds = topStoriesResponse.data.slice(0, 30);

    // Convert search terms to an array and add the main topic
    const searchTermsArray = searchTerms
      .split(",")
      .map((term) => term.trim().toLowerCase());
    if (!searchTermsArray.includes(topic.toLowerCase())) {
      searchTermsArray.push(topic.toLowerCase());
    }

    let hackerNewsInfo = "";
    let relevantStoriesCount = 0;

    // Fetch details for each story and check if it's relevant to our topic
    for (const storyId of topStoryIds) {
      if (relevantStoriesCount >= 3) break; // Limit to 3 relevant stories

      const storyResponse = await axios.get(
        `https://hacker-news.firebaseio.com/v0/item/${storyId}.json`
      );

      const story = storyResponse.data;
      if (story && story.title) {
        // Check if the story is relevant to our topic
        const isRelevant = searchTermsArray.some(
          (term) =>
            story.title.toLowerCase().includes(term) ||
            (story.text && story.text.toLowerCase().includes(term))
        );

        if (isRelevant) {
          relevantStoriesCount++;
          hackerNewsInfo += `Topic: ${story.title}\n`;

          // Add the story text if available
          if (story.text) {
            hackerNewsInfo += `Content: ${story.text
              .replace(/\n/g, " ")
              .substring(0, 300)}...\n`;
          }

          // Try to get the URL content
          if (story.url) {
            try {
              const urlResponse = await axios.get(story.url, {
                timeout: 3000,
                headers: { "User-Agent": "Mozilla/5.0" },
              });

              // Extract content from the HTML
              const htmlContent = urlResponse.data.toString();

              // Try to get article text using a simple approach
              const bodyText = htmlContent
                .replace(
                  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
                  " "
                )
                .replace(
                  /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
                  " "
                )
                .replace(/<[^>]+>/g, " ")
                .replace(/\s+/g, " ")
                .trim()
                .substring(0, 500);

              if (bodyText) {
                hackerNewsInfo += `Article excerpt: ${bodyText}...\n`;
              }
            } catch (urlError) {
              // If we can't fetch the URL, just continue
            }
          }

          // Get comments for this story
          if (story.kids && story.kids.length > 0) {
            hackerNewsInfo += "Top comments:\n";

            // Get up to 3 comments
            const commentIds = story.kids.slice(0, 3);
            for (const commentId of commentIds) {
              try {
                const commentResponse = await axios.get(
                  `https://hacker-news.firebaseio.com/v0/item/${commentId}.json`
                );

                const comment = commentResponse.data;
                if (comment && comment.text) {
                  hackerNewsInfo += `- ${comment.text
                    .replace(/\n/g, " ")
                    .substring(0, 200)}...\n`;
                }
              } catch (commentError) {
                // If we can't get a comment, just continue
              }
            }
          }

          hackerNewsInfo += "\n";
        }
      }
    }

    return relevantStoriesCount > 0 ? hackerNewsInfo : null;
  } catch (error) {
    console.error("Error getting HackerNews information for topic:", error);
    return null;
  }
}

// Helper function to get general information about a topic category
async function getGeneralTopicInformation(topic: string): Promise<string> {
  // This is a fallback when we can't find specific information
  // You could expand this with more topic categories or even use a simple knowledge base

  const topicLower = topic.toLowerCase();

  if (
    topicLower.includes("ai") ||
    topicLower.includes("artificial intelligence") ||
    topicLower.includes("machine learning")
  ) {
    return `
      - AI and Machine Learning are rapidly evolving fields with new models and applications emerging regularly
      - Large language models like GPT-4, Claude, and Gemini are pushing the boundaries of what's possible
      - Practical applications include content generation, code assistance, data analysis, and automation
      - Ethical considerations include bias, privacy concerns, and potential job displacement
      - Current trends include multimodal models, smaller specialized models, and AI safety research
    `;
  } else if (
    topicLower.includes("web") ||
    topicLower.includes("frontend") ||
    topicLower.includes("backend")
  ) {
    return `
      - Modern web development encompasses both frontend and backend technologies
      - Frontend frameworks like React, Vue, and Angular continue to evolve with new features
      - Backend technologies include Node.js, Python frameworks, and serverless architectures
      - Full-stack development often involves JavaScript/TypeScript across the entire stack
      - Current trends include edge computing, Web Assembly, and improved developer experience
    `;
  } else if (topicLower.includes("mobile") || topicLower.includes("app")) {
    return `
      - Mobile app development spans native (iOS/Android) and cross-platform approaches
      - React Native and Flutter are popular for cross-platform development
      - Progressive Web Apps (PWAs) bridge the gap between web and mobile experiences
      - App Store optimization and monetization strategies are crucial for success
      - Current trends include AR features, on-device AI, and improved performance optimization
    `;
  } else if (topicLower.includes("security") || topicLower.includes("cyber")) {
    return `
      - Cybersecurity is increasingly important as digital threats evolve
      - Common concerns include data breaches, ransomware, and social engineering
      - Zero-trust architecture is becoming the standard security approach
      - DevSecOps integrates security into the development lifecycle
      - Current trends include AI-powered threat detection and quantum-resistant cryptography
    `;
  } else {
    return `
      - Technology continues to evolve at a rapid pace across all domains
      - Integration of different technologies often leads to innovative solutions
      - User experience and accessibility remain fundamental considerations
      - Open source collaboration drives many technological advancements
      - Staying current with industry trends requires continuous learning
    `;
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
