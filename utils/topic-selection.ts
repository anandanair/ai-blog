import axios from "axios";
import * as cheerio from "cheerio";
import { fetchLatestTechNews } from "./news-helper";

/**
 * Fetches current tech context from various sources
 */
export async function getCurrentTechContext(): Promise<string> {
  let techContext = "Current top tech news:\n\n";

  try {
    const techNews = await fetchLatestTechNews();
    techContext += techNews;

    // Part 1: Get HackerNews trending stories
    const hackerNewsTopics = await getHackerNewsTopics();
    techContext += "\n\nCurrent trending tech topics:\n";
    techContext += hackerNewsTopics;

    // Part 2: Get Reddit trending topics
    const redditTopics = await getRedditTopics();
    techContext += "\n\nTrending topics from Reddit tech communities:\n";
    techContext += redditTopics;

    // Removed due to too technical
    // // Part 3: Get GitHub trending repositories
    // const githubTopics = await getGitHubTrending();
    // techContext += "\n\nTrending repositories on GitHub:\n";
    // techContext += githubTopics;

    // Removed due to too technical
    // // Part 5: Get developer topics from Stack Overflow
    // const stackOverflowTopics = await getStackOverflowTopics();
    // techContext += "\n\nHot topics on Stack Overflow:\n";
    // techContext += stackOverflowTopics;

    // Removed due to too technical
    // // Part 6: Get AI research topics
    // const aiResearchTopics = await getAIResearchTopics();
    // techContext += "\n\nRecent AI research topics:\n";
    // techContext += aiResearchTopics;

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

/**
 * Helper function to get HackerNews topics
 */
export async function getHackerNewsTopics(): Promise<string> {
  try {
    const topStoriesResponse = await axios.get(
      "https://hacker-news.firebaseio.com/v0/topstories.json"
    );

    // Get the IDs of the top 1 story
    const topStoryIds = topStoriesResponse.data.slice(0, 1);

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

/**
 * Helper function to get Reddit topics
 */
async function getRedditAccessToken(): Promise<string> {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  const username = process.env.REDDIT_USERNAME;
  const password = process.env.REDDIT_PASSWORD;

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const params = new URLSearchParams();
  params.append("grant_type", "password");
  params.append("username", username!);
  params.append("password", password!);

  const response = await axios.post(
    "https://www.reddit.com/api/v1/access_token",
    params,
    {
      headers: {
        Authorization: `Basic ${auth}`,
        "User-Agent": "web:ai-blog-generator:v1.0 (by /u/YourUsername)",
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  return response.data.access_token;
}

export async function getRedditTopics(): Promise<string> {
  try {
    const accessToken = await getRedditAccessToken();
    const techSubreddits = [
      "technews",
      // "programming",
      "technology",
      // "webdev",
      // "MachineLearning",
      // "datascience",
      // "ArtificialInteligence",
      "gadgets",
      "gaming",
    ];

    let redditContext = "";

    for (const subreddit of techSubreddits) {
      try {
        const response = await axios.get(
          `https://oauth.reddit.com/r/${subreddit}/top.json?limit=3&t=week`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "User-Agent": "web:ai-blog-generator:v1.0 (by /u/YourUsername)",
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

/**
 * Gets trending repositories from GitHub
 */
export async function getGitHubTrending(): Promise<string> {
  try {
    const response = await axios.get("https://github.com/trending", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });

    const $ = cheerio.load(response.data);
    let trendingRepos = "";

    // Extract trending repositories
    $("article.Box-row")
      .slice(0, 5)
      .each((i, elem) => {
        const repoName = $(elem)
          .find("h2 a")
          .text()
          .trim()
          .replace(/\s+/g, " ");
        const description = $(elem).find("p").text().trim();
        const language = $(elem)
          .find('[itemprop="programmingLanguage"]')
          .text()
          .trim();
        const stars = $(elem).find("a.Link--muted").first().text().trim();

        trendingRepos += `- ${repoName}\n`;
        if (description) trendingRepos += `  Description: ${description}\n`;
        if (language) trendingRepos += `  Language: ${language}\n`;
        if (stars) trendingRepos += `  Stars: ${stars}\n`;
        trendingRepos += "\n";
      });

    return trendingRepos || "No trending repositories found.";
  } catch (error) {
    console.error("Error fetching GitHub trending:", error);
    return "";
  }
}

/**
 * Gets hot topics from Stack Overflow
 */
export async function getStackOverflowTopics(): Promise<string> {
  try {
    const response = await axios.get(
      "https://stackoverflow.com/questions?tab=hot",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
      }
    );

    const $ = cheerio.load(response.data);
    let soTopics = "";

    // Extract hot questions
    $(".s-post-summary")
      .slice(0, 5)
      .each((i, elem) => {
        const title = $(elem).find(".s-link").text().trim();
        const tags = $(elem)
          .find(".post-tag")
          .map((_, tag) => $(tag).text().trim())
          .get()
          .join(", ");
        const votes = $(elem)
          .find(".s-post-summary--stats-item-number")
          .first()
          .text()
          .trim();

        soTopics += `- ${title}\n`;
        if (tags) soTopics += `  Tags: ${tags}\n`;
        if (votes) soTopics += `  Votes: ${votes}\n`;
        soTopics += "\n";
      });

    return soTopics || "No Stack Overflow topics found.";
  } catch (error) {
    console.error("Error fetching Stack Overflow topics:", error);
    return "";
  }
}

/**
 * Gets recent AI research topics from arXiv
 */
export async function getAIResearchTopics(): Promise<string> {
  try {
    // Using arXiv API to get recent AI papers
    const response = await axios.get(
      "http://export.arxiv.org/api/query?search_query=cat:cs.AI+OR+cat:cs.LG&sortBy=submittedDate&sortOrder=descending&max_results=5"
    );

    // Parse XML response
    const $ = cheerio.load(response.data, { xmlMode: true });
    let aiTopics = "";

    // Extract papers
    $("entry").each((i, elem) => {
      const title = $(elem).find("title").text().trim().replace(/\s+/g, " ");
      const summary = $(elem)
        .find("summary")
        .text()
        .trim()
        .replace(/\s+/g, " ");
      const authors = $(elem)
        .find("author name")
        .map((_, author) => $(author).text().trim())
        .get()
        .join(", ");

      aiTopics += `- ${title}\n`;
      if (authors) aiTopics += `  Authors: ${authors}\n`;
      if (summary) aiTopics += `  Summary: ${summary.substring(0, 200)}...\n`;
      aiTopics += "\n";
    });

    return aiTopics || "No AI research topics found.";
  } catch (error) {
    console.error("Error fetching AI research topics:", error);
    return "";
  }
}
