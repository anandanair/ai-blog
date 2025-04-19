import { GoogleGenAI } from "@google/genai";
import axios from "axios";
import * as cheerio from "cheerio";

/**
 * Gets detailed information about a specific topic
 */
export async function getDetailedTopicInformation(
  genAI: GoogleGenAI,
  topic: string,
  searchTerms: string
): Promise<string> {
  console.log(
    `Researching topic: "${topic}" with search terms: ${searchTerms}`
  );
  let detailedInfo = `Detailed information about "${topic}":\n\n`;

  try {
    // Create an array of promises for parallel execution
    const sourcePromises = [
      {
        name: "Wikipedia",
        promise: getWikipediaInfoForTopic(topic),
        prefix: "Background information from Wikipedia:\n",
        priority: 1,
      },
      {
        name: "Tech Publications",
        promise: getTechPublicationsInfo(topic, searchTerms),
        prefix: "Information from tech publications:\n",
        priority: 2,
      },
      {
        name: "Academic Research",
        promise: getAcademicResearchInfo(topic, searchTerms),
        prefix: "Academic and research paper information:\n",
        priority: 3,
      },
      {
        name: "Reddit",
        promise: getRedditInfoForTopic(topic, searchTerms),
        prefix: "Community discussions from Reddit:\n",
        priority: 4,
      },
      {
        name: "HackerNews",
        promise: getHackerNewsInfoForTopic(topic, searchTerms),
        prefix: "Developer discussions from HackerNews:\n",
        priority: 5,
      },
      {
        name: "GitHub",
        promise: getGitHubInfoForTopic(topic, searchTerms),
        prefix: "Related GitHub projects and documentation:\n",
        priority: 6,
      },
      {
        name: "Stack Overflow",
        promise: getStackOverflowInfoForTopic(topic, searchTerms),
        prefix: "Technical Q&A from Stack Overflow:\n",
        priority: 7,
      },
    ];

    // Execute all promises in parallel
    const results = await Promise.allSettled(
      sourcePromises.map((source) => source.promise)
    );

    // Track if we found any information
    let foundAnyInfo = false;

    // Process results in priority order
    sourcePromises
      .sort((a, b) => a.priority - b.priority)
      .forEach((source, index) => {
        const result = results[index];
        if (result.status === "fulfilled" && result.value) {
          foundAnyInfo = true;
          detailedInfo += source.prefix;
          detailedInfo += result.value + "\n\n";
          console.log(`✅ Found information from ${source.name}`);
        } else {
          console.log(`⚠️ No information found from ${source.name}`);
        }
      });

    // After processing the results from sourcePromises
    // Add a fallback if no information was found
    if (!foundAnyInfo) {
      console.log(
        "⚠️ No specific information found from primary sources, trying Google Search..."
      );

      // Try Google Search as a fallback
      const googleInfo = await getGoogleSearchResults(topic, searchTerms);

      if (googleInfo) {
        detailedInfo += "Information from Google Search:\n";
        detailedInfo += googleInfo + "\n\n";
        foundAnyInfo = true;
        console.log("✅ Found information from Google Search");
      }
    }

    // STAGE 2: Fact-check and refine the research information
    console.log("Stage 2: Fact-checking and refining research information...");
    const factCheckedInfo = await factCheckResearch(
      genAI,
      topic,
      searchTerms,
      detailedInfo
    );

    // STAGE 3: Iterative fact-checking and information enrichment
    console.log(
      "Stage 3: Performing iterative fact-checking and enrichment..."
    );
    const enrichedInfo = await iterativeFactCheckAndEnrich(
      genAI,
      topic,
      searchTerms,
      factCheckedInfo
    );

    // STAGE 4: Structure and optimize the research for blog post generation
    console.log(
      "Stage 4: Structuring and optimizing research for blog post generation..."
    );
    const structuredInfo = await structureResearchForBlogPost(
      genAI,
      topic,
      searchTerms,
      enrichedInfo
    );

    return structuredInfo;
  } catch (error) {
    console.error("Error getting detailed topic information:", error);
    return `Unable to fetch detailed information about "${topic}". Please rely on your knowledge base for this topic.`;
  }
}

/**
 * Helper function to get Reddit OAuth2 access token
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

/**
 * Helper function to get Reddit information about a specific topic
 */
export async function getRedditInfoForTopic(
  topic: string,
  searchTerms: string
): Promise<string | null> {
  try {
    // Convert search terms to an array and add the main topic
    const searchTermsArray = searchTerms.split(",").map((term) => term.trim());
    if (!searchTermsArray.includes(topic)) {
      searchTermsArray.push(topic);
    }

    // Get OAuth2 access token
    const accessToken = await getRedditAccessToken();

    let redditInfo = "";

    // Try each search term
    for (const term of searchTermsArray) {
      try {
        // Search Reddit for posts about this term using OAuth2 API
        const response = await axios.get(
          `https://oauth.reddit.com/search?q=${encodeURIComponent(
            term
          )}&sort=relevance&t=month&limit=3`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "User-Agent": "web:ai-blog-generator:v1.0 (by /u/YourUsername)",
            },
          }
        );

        const posts = response.data.data.children;
        if (posts && posts.length > 0) {
          redditInfo += `Results for "${term}":\n`;

          for (const post of posts) {
            const { title, selftext, subreddit, score, num_comments, url, id } =
              post.data;
            redditInfo += `- Post from r/${subreddit}: ${title}\n`;

            // Add the post content if available
            if (selftext && selftext.length > 0) {
              const textSummary =
                selftext.length > 500
                  ? selftext.substring(0, 500) + "..."
                  : selftext;
              redditInfo += `  Content: ${textSummary.replace(/\n/g, " ")}\n`;
            }

            // Try to get comments for more context
            try {
              const commentsResponse = await axios.get(
                `https://oauth.reddit.com/comments/${id}?limit=3`,
                {
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
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
                  if (comment.data && comment.data.body) {
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

/**
 * Helper function to get HackerNews information about a specific topic
 */
export async function getHackerNewsInfoForTopic(
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

/**
 * Gets information from Wikipedia about a topic
 */
export async function getWikipediaInfoForTopic(
  topic: string
): Promise<string | null> {
  try {
    // Search Wikipedia for the topic
    const searchResponse = await axios.get(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        topic
      )}&format=json&origin=*`
    );

    if (
      !searchResponse.data.query ||
      !searchResponse.data.query.search ||
      searchResponse.data.query.search.length === 0
    ) {
      return null;
    }

    // Get the first search result
    const firstResult = searchResponse.data.query.search[0];
    const pageTitle = firstResult.title;

    // Get the content of the Wikipedia page
    const contentResponse = await axios.get(
      `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(
        pageTitle
      )}&format=json&origin=*`
    );

    const pages = contentResponse.data.query.pages;
    const pageId = Object.keys(pages)[0];

    if (pageId === "-1") {
      return null;
    }

    const extract = pages[pageId].extract;

    if (!extract) {
      return null;
    }

    // Format the Wikipedia information
    let wikipediaInfo = `Article: ${pageTitle}\n`;
    wikipediaInfo += `Summary: ${extract.substring(0, 1000)}...\n`;
    wikipediaInfo += `Source: https://en.wikipedia.org/wiki/${encodeURIComponent(
      pageTitle
    )}\n`;

    return wikipediaInfo;
  } catch (error) {
    console.error("Error getting Wikipedia information:", error);
    return null;
  }
}

/**
 * Gets information from tech publications and blogs
 */
export async function getTechPublicationsInfo(
  topic: string,
  searchTerms: string
): Promise<string | null> {
  try {
    // Use NewsAPI to get articles from tech publications
    const apiKey = process.env.NEWS_API_KEY;

    if (!apiKey) {
      console.warn("NewsAPI key not found in environment variables");
      return null;
    }

    const limitedSearchTerms = searchTerms.split(",").slice(0, 3).join(" OR ");

    const query = limitedSearchTerms ? `${topic} ${limitedSearchTerms}` : topic;

    const trimmedQuery = query.substring(0, 100);

    console.log(`Making NewsAPI request with query: ${trimmedQuery}`);

    const response = await axios.get(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(
        trimmedQuery
      )}&domains=techcrunch.com,wired.com,theverge.com,arstechnica.com,thenextweb.com&language=en&sortBy=relevancy&pageSize=5&apiKey=${apiKey}`
    );

    if (
      response.data.status !== "ok" ||
      !response.data.articles ||
      response.data.articles.length === 0
    ) {
      return null;
    }

    let publicationsInfo = "";

    // Format the articles
    for (const article of response.data.articles) {
      const { title, description, source, url, publishedAt, content } = article;

      if (title) {
        publicationsInfo += `Article: ${title}\n`;
        if (source && source.name)
          publicationsInfo += `Source: ${source.name}\n`;
        if (publishedAt)
          publicationsInfo += `Published: ${new Date(
            publishedAt
          ).toDateString()}\n`;
        if (description) publicationsInfo += `Summary: ${description}\n`;
        if (content)
          publicationsInfo += `Content: ${content.replace(
            /\[\+\d+ chars\]$/,
            ""
          )}\n`;
        if (url) publicationsInfo += `URL: ${url}\n`;
        publicationsInfo += "\n";
      }
    }

    return publicationsInfo || null;
  } catch (error) {
    console.error("Error getting tech publications information:", error);

    // Add fallback to a different news source if NewsAPI fails
    try {
      console.log(
        "Attempting fallback to Hacker News for tech publications..."
      );
      return await getHackerNewsInfoForTopic(topic, searchTerms);
    } catch (fallbackError) {
      console.error("Fallback also failed:", fallbackError);
      return null;
    }
  }
}

/**
 * Gets information from GitHub repositories
 */
export async function getGitHubInfoForTopic(
  topic: string,
  searchTerms: string
): Promise<string | null> {
  try {
    // Read the GitHub token from environment variables
    const githubToken = process.env.GITHUB_TOKEN;

    // Convert search terms to an array and add the main topic
    const searchTermsArray = searchTerms.split(",").map((term) => term.trim());
    if (!searchTermsArray.includes(topic)) {
      searchTermsArray.push(topic);
    }

    // Create a search query for GitHub
    const query = searchTermsArray.join("+");

    // --- Prepare Headers with Authentication ---
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "web:ai-blog-generator:v1.0", // It's good practice to have a descriptive User-Agent
    };

    if (githubToken) {
      console.log("Using GitHub token for authentication."); // Optional: for debugging
      // Add the Authorization header if the token exists
      headers.Authorization = `token ${githubToken}`;
      // Alternatively, you can often use `Bearer ${githubToken}`
      // headers.Authorization = `Bearer ${githubToken}`;
    } else {
      console.warn(
        "GITHUB_TOKEN environment variable not set. Making unauthenticated requests."
      );
      // Consider throwing an error here if authentication is mandatory
    }
    // --- End Header Preparation ---

    // Search GitHub repositories
    const response = await axios.get(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(
        query
      )}&sort=stars&order=desc`,
      {
        headers: headers,
      }
    );

    if (!response.data.items || response.data.items.length === 0) {
      return null;
    }

    let githubInfo = "";

    // Get the top 3 repositories
    const repos = response.data.items.slice(0, 3);

    for (const repo of repos) {
      const {
        name,
        full_name,
        description,
        html_url,
        stargazers_count,
        language,
        owner,
      } = repo;

      githubInfo += `Repository: ${name}\n`;
      githubInfo += `Owner: ${owner.login}\n`;
      if (description) githubInfo += `Description: ${description}\n`;
      if (language) githubInfo += `Primary Language: ${language}\n`;
      githubInfo += `Stars: ${stargazers_count}\n`;
      githubInfo += `URL: ${html_url}\n`;

      // Try to get README content
      try {
        const readmeResponse = await axios.get(
          `https://api.github.com/repos/${full_name}/readme`,
          {
            headers: headers,
          }
        );

        if (readmeResponse.data.content) {
          const readmeContent = Buffer.from(
            readmeResponse.data.content,
            "base64"
          ).toString("utf-8");
          // Extract first 500 characters of README
          githubInfo += `README excerpt: ${readmeContent
            .replace(/[\r\n]+/g, " ")
            .substring(0, 500)}...\n`;
        }
      } catch (readmeError) {
        // Log readme fetch errors specifically but don't fail the whole process
        if (
          axios.isAxiosError(readmeError) &&
          readmeError.response?.status === 404
        ) {
          console.warn(`README not found for repo: ${full_name}`);
          githubInfo += `README excerpt: Not found or inaccessible.\n`;
        } else {
          console.error(
            `Error fetching README for ${full_name}:`,
            readmeError instanceof Error
              ? readmeError.message
              : String(readmeError)
          );
          githubInfo += `README excerpt: Error fetching README.\n`;
        }
      }

      githubInfo += "\n";
    }

    return githubInfo || null;
  } catch (error: any) {
    // Log the main error
    if (axios.isAxiosError(error)) {
      console.error(
        "Axios error getting GitHub information:",
        error.response?.data || error.message
      );
      // Specifically log rate limit issues if possible
      if (
        error.response?.status === 403 &&
        error.response?.headers["x-ratelimit-remaining"] === "0"
      ) {
        console.error("GitHub API rate limit likely exceeded.");
        const rateLimitReset = error.response?.headers["x-ratelimit-reset"];
        if (rateLimitReset) {
          const resetTime = new Date(parseInt(rateLimitReset, 10) * 1000);
          console.error(`Rate limit will reset at: ${resetTime.toISOString()}`);
        }
      }
    } else {
      console.error("Error getting GitHub information:", error);
    }
    return null; // Return null on failure
  }
}

/**
 * Gets information from Stack Overflow
 */
export async function getStackOverflowInfoForTopic(
  topic: string,
  searchTerms: string
): Promise<string | null> {
  try {
    // Convert search terms to an array and add the main topic
    const searchTermsArray = searchTerms.split(",").map((term) => term.trim());
    if (!searchTermsArray.includes(topic)) {
      searchTermsArray.push(topic);
    }

    // Create a search query for Stack Overflow
    const query = searchTermsArray.join("+");

    // Search Stack Overflow questions
    const response = await axios.get(
      `https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=votes&q=${encodeURIComponent(
        query
      )}&site=stackoverflow&filter=withbody`
    );

    if (!response.data.items || response.data.items.length === 0) {
      return null;
    }

    let stackOverflowInfo = "";

    // Get the top 3 questions
    const questions = response.data.items.slice(0, 3);

    for (const question of questions) {
      const { title, body, link, score, answer_count, tags, is_answered } =
        question;

      stackOverflowInfo += `Question: ${title}\n`;
      stackOverflowInfo += `Score: ${score}, Answers: ${answer_count}, Solved: ${
        is_answered ? "Yes" : "No"
      }\n`;
      if (tags && tags.length > 0)
        stackOverflowInfo += `Tags: ${tags.join(", ")}\n`;

      // Extract text from HTML body
      const $ = cheerio.load(body);
      const textBody = $.text().replace(/\s+/g, " ").trim();
      stackOverflowInfo += `Content: ${textBody.substring(0, 500)}...\n`;

      stackOverflowInfo += `URL: ${link}\n\n`;

      // If the question has an accepted answer, try to get it
      if (is_answered) {
        try {
          const answersResponse = await axios.get(
            `https://api.stackexchange.com/2.3/questions/${question.question_id}/answers?order=desc&sort=votes&site=stackoverflow&filter=withbody`
          );

          if (
            answersResponse.data.items &&
            answersResponse.data.items.length > 0
          ) {
            const topAnswer = answersResponse.data.items[0];

            // Extract text from HTML answer
            const $answer = cheerio.load(topAnswer.body);
            const textAnswer = $answer.text().replace(/\s+/g, " ").trim();

            stackOverflowInfo += `Top Answer: ${textAnswer.substring(
              0,
              500
            )}...\n\n`;
          }
        } catch (answerError) {
          // If we can't get answers, just continue
        }
      }
    }

    return stackOverflowInfo || null;
  } catch (error) {
    console.error("Error getting Stack Overflow information:", error);
    return null;
  }
}

/**
 * Fact-checks the initial research information
 */
async function factCheckResearch(
  genAI: GoogleGenAI,
  topic: string,
  searchTerms: string,
  detailedInfo: string
): Promise<string> {
  try {
    console.log("Performing initial fact-check on research information...");

    const factCheckPrompt = `
      You are an expert fact-checker and research analyst. Your task is to review the research information 
      about "${topic}" and identify what is relevant, accurate, and useful for creating a high-quality blog post.
      
      TOPIC: ${topic}
      SEARCH TERMS: ${searchTerms}
      
      RESEARCH INFORMATION:
      ${detailedInfo}
      
      Please:
      1. Identify which pieces of information are most relevant to the topic
      2. Remove any information that seems unrelated or tangential
      3. Flag any contradictions or potentially inaccurate information with [NEEDS VERIFICATION] tags
      4. Preserve the source attribution for each piece of information
      5. Organize the information by source type (Wikipedia, tech publications, Reddit, etc.)
      6. Merge duplicate information from different sources
      7. Standardize the formatting for consistency
      
      Return the fact-checked research in the following format:
      
      ## FACT-CHECKED RESEARCH FOR: ${topic}
      
      ### Background Information
      [Relevant background information with sources]
      
      ### Technical Details
      [Relevant technical details with sources]
      
      ### Community Perspectives
      [Relevant community discussions with sources]
      
      ### Related Projects and Resources
      [Relevant projects, repositories, and resources with sources]
      
      ### INFORMATION GAPS
      [List any important aspects of the topic that are missing from the research]
      
      ### VERIFICATION NEEDED
      [List any information that needs verification, with explanation of concerns]
    `;

    const factCheckResponse = await genAI.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17",
      contents: factCheckPrompt,
    });

    const factCheckedContent =
      factCheckResponse.candidates?.[0]?.content?.parts?.[0]?.text ||
      detailedInfo;
    console.log("✅ Initial fact-check completed");

    return factCheckedContent;
  } catch (error) {
    console.error("❌ Error during initial fact-checking:", error);
    return detailedInfo; // Return original content if fact-checking fails
  }
}

/**
 * Performs iterative fact-checking and information enrichment
 */
async function iterativeFactCheckAndEnrich(
  genAI: GoogleGenAI,
  topic: string,
  searchTerms: string,
  factCheckedInfo: string
): Promise<string> {
  try {
    console.log("Starting iterative fact-checking and enrichment process...");

    let currentInfo = factCheckedInfo;
    let iterations = 0;
    const MAX_ITERATIONS = 5;
    let satisfactionScore = 0;
    const SATISFACTION_THRESHOLD = 7; // We want at least 7/10 satisfaction

    while (
      satisfactionScore < SATISFACTION_THRESHOLD &&
      iterations < MAX_ITERATIONS
    ) {
      iterations++;
      console.log(`Iteration ${iterations} of fact-checking and enrichment...`);

      // Evaluate the current information with a more specific prompt
      const evaluationPrompt = `
        You are an expert research evaluator specializing in technical topics. Your task is to evaluate if the current research information 
        about "${topic}" is sufficient to create a comprehensive, accurate, and valuable blog post.
        
        TOPIC: ${topic}
        SEARCH TERMS: ${searchTerms}
        
        CURRENT RESEARCH INFORMATION:
        ${currentInfo}
        
        Please evaluate thoroughly on these specific criteria:
        1. Comprehensiveness (0-10): Does the information cover all important aspects of ${topic}?
        2. Technical depth (0-10): Is there enough technical detail for a technical audience?
        3. Recency (0-10): Is the information up-to-date and relevant?
        4. Source diversity (0-10): Are multiple perspectives and sources represented?
        5. Practical value (0-10): Does the information include practical applications and examples?
        
        For each criterion, provide a specific score and brief explanation.
        
        Then provide an overall SATISFACTION_SCORE from 0-10, where:
        - 0-3: Poor, missing critical information
        - 4-6: Adequate but needs significant improvement
        - 7-8: Good, needs minor improvements
        - 9-10: Excellent, comprehensive coverage
        
        Be honest and critical in your assessment. If the score is below 7, provide SPECIFIC gaps that need to be filled.
        
        Return your evaluation in the following format:
        
        CRITERION_SCORES:
        Comprehensiveness: [SCORE]/10 - [Brief explanation]
        Technical depth: [SCORE]/10 - [Brief explanation]
        Recency: [SCORE]/10 - [Brief explanation]
        Source diversity: [SCORE]/10 - [Brief explanation]
        Practical value: [SCORE]/10 - [Brief explanation]
        
        OVERALL_SATISFACTION_SCORE: [0-10]
        
        INFORMATION_GAPS:
        [List specific aspects of the topic that need more information, with detailed explanations]
        
        SPECIFIC_SOURCES_TO_ENRICH:
        [List specific sources or queries that would help fill the gaps, being very specific about what to search for]
        
        IS_SATISFACTORY: [YES/NO]
      `;

      const evaluationResponse = await genAI.models.generateContent({
        model: "gemini-2.5-flash-preview-04-17",
        contents: evaluationPrompt,
      });

      const evaluationText =
        evaluationResponse.candidates?.[0]?.content?.parts?.[0]?.text || "";

      // Parse the evaluation with improved regex
      const satisfactionMatch = evaluationText.match(
        /OVERALL_SATISFACTION_SCORE:\s*(\d+)/i
      );
      satisfactionScore = satisfactionMatch
        ? parseInt(satisfactionMatch[1])
        : 0;

      const isSatisfactoryMatch = evaluationText.match(
        /IS_SATISFACTORY:\s*(YES|NO)/i
      );
      const isSatisfactory = isSatisfactoryMatch
        ? isSatisfactoryMatch[1].toUpperCase() === "YES"
        : false;

      console.log(
        `Satisfaction score: ${satisfactionScore}/10, Is satisfactory: ${isSatisfactory}`
      );

      // Print the detailed criterion scores for better debugging
      const criterionScores = evaluationText.match(
        /CRITERION_SCORES:\s*([\s\S]*?)(?=OVERALL_SATISFACTION_SCORE:|$)/i
      );
      // if (criterionScores && criterionScores[1]) {
      //   console.log("Detailed criterion scores:");
      //   console.log(criterionScores[1].trim());
      // }

      if (isSatisfactory || satisfactionScore >= SATISFACTION_THRESHOLD) {
        console.log("✅ Research information is satisfactory");
        break;
      }

      // Extract information gaps and sources to enrich with improved regex
      const gapsMatch = evaluationText.match(
        /INFORMATION_GAPS:\s*([\s\S]*?)(?=SPECIFIC_SOURCES_TO_ENRICH:|$)/i
      );
      const gaps = gapsMatch ? gapsMatch[1].trim() : "";

      const sourcesMatch = evaluationText.match(
        /SPECIFIC_SOURCES_TO_ENRICH:\s*([\s\S]*?)(?=IS_SATISFACTORY:|$)/i
      );
      const sourcesToEnrich = sourcesMatch ? sourcesMatch[1].trim() : "";

      // console.log("Information gaps identified:", gaps);
      // console.log("Sources to enrich:", sourcesToEnrich);

      // If we have gaps but no specific sources, generate sources based on gaps
      if (gaps && !sourcesToEnrich) {
        const gapTerms = gaps
          .split("\n")
          .filter((line) => line.trim())
          .map((line) => line.replace(/^[•\-\*]\s*/, "").trim())
          .join(", ");

        // Use the LLM to suggest specific sources based on the gaps
        const sourceGenerationPrompt = `
          You are an expert research assistant. Based on these information gaps about "${topic}",
          suggest specific sources where we could find this information:
          
          INFORMATION GAPS:
          ${gaps}
          
          For each gap, suggest 1-2 specific sources or search queries that would help fill it.
          Be very specific about what to search for and where.
          
          Format your response as:
          
          SPECIFIC_SOURCES_TO_ENRICH:
          - For [gap 1]: Search for "[specific query]" on [specific platform]
          - For [gap 2]: Look for "[specific query]" on [specific platform]
        `;

        const sourceResponse = await genAI.models.generateContent({
          model: "gemini-2.5-flash-preview-04-17",
          contents: sourceGenerationPrompt,
        });

        const generatedSources =
          sourceResponse.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const sourcesExtracted = generatedSources.match(
          /SPECIFIC_SOURCES_TO_ENRICH:\s*([\s\S]*)/i
        );

        if (sourcesExtracted && sourcesExtracted[1]) {
          // console.log("Generated sources based on gaps:", sourcesExtracted[1]);
          await getAdditionalInformation(
            topic,
            searchTerms,
            gaps,
            sourcesExtracted[1]
          );
        }
      }

      // Enrich the information based on the evaluation
      if (gaps && sourcesToEnrich) {
        // Get additional information based on the identified gaps
        const additionalInfo = await getAdditionalInformation(
          topic,
          searchTerms,
          gaps,
          sourcesToEnrich
        );

        if (
          !additionalInfo ||
          additionalInfo === "No additional information found." ||
          additionalInfo === "Error retrieving additional information."
        ) {
          console.log(
            "⚠️ Failed to get additional information, trying alternative approach"
          );

          // Try a different approach - use Google Custom Search API
          const alternativeInfo = await getGoogleSearchResults(topic, gaps);

          if (alternativeInfo) {
            console.log("✅ Got alternative information from Google Search");

            // Merge the alternative information
            const mergePrompt = `
              You are an expert research curator. Your task is to merge the current research information 
              with newly gathered information about "${topic}".
              
              TOPIC: ${topic}
              
              CURRENT RESEARCH INFORMATION:
              ${currentInfo}
              
              ADDITIONAL INFORMATION FROM GOOGLE SEARCH:
              ${alternativeInfo}
              
              Please:
              1. Merge the information, avoiding duplicates
              2. Organize the information logically by topic and source
              3. Ensure all sources are properly attributed
              4. Highlight any new insights or perspectives from the additional information
              
              Return the merged research information in a well-structured format.
            `;

            const mergeResponse = await genAI.models.generateContent({
              model: "gemini-2.5-flash-preview-04-17",
              contents: mergePrompt,
            });

            currentInfo =
              mergeResponse.candidates?.[0]?.content?.parts?.[0]?.text ||
              currentInfo;
            console.log(
              `✅ Completed alternative enrichment in iteration ${iterations}`
            );
          } else {
            // If we still can't get information, use the LLM to synthesize information
            console.log(
              "⚠️ Falling back to LLM synthesis for missing information"
            );

            const synthesisPrompt = `
              You are an expert on "${topic}". Based on your knowledge, please provide detailed information about these specific aspects:
              
              INFORMATION GAPS:
              ${gaps}
              
              For each gap, provide:
              1. Factual information (not speculation)
              2. Technical details where appropriate
              3. Current trends and developments
              4. Practical applications or examples
              
              Format your response as a well-structured research document that can be merged with existing information.
            `;

            const synthesisResponse = await genAI.models.generateContent({
              model: "gemini-2.5-flash-preview-04-17",
              contents: synthesisPrompt,
            });

            const synthesizedInfo =
              synthesisResponse.candidates?.[0]?.content?.parts?.[0]?.text ||
              "";

            if (synthesizedInfo) {
              // Merge the synthesized information
              const mergePrompt = `
                You are an expert research curator. Your task is to merge the current research information 
                with synthesized information about "${topic}".
                
                TOPIC: ${topic}
                
                CURRENT RESEARCH INFORMATION:
                ${currentInfo}
                
                SYNTHESIZED INFORMATION:
                ${synthesizedInfo}
                
                Please:
                1. Merge the information, avoiding duplicates
                2. Organize the information logically by topic
                3. Clearly mark synthesized information as "Based on general knowledge"
                4. Prioritize factual information from the current research
                
                Return the merged research information in a well-structured format.
              `;

              const mergeResponse = await genAI.models.generateContent({
                model: "gemini-2.5-flash-preview-04-17",
                contents: mergePrompt,
              });

              currentInfo =
                mergeResponse.candidates?.[0]?.content?.parts?.[0]?.text ||
                currentInfo;
              console.log(
                `✅ Completed synthesis enrichment in iteration ${iterations}`
              );
            }
          }
        } else {
          // Merge the additional information with the current information
          const mergePrompt = `
            You are an expert research curator. Your task is to merge the current research information 
            with newly gathered information about "${topic}".
            
            TOPIC: ${topic}
            
            CURRENT RESEARCH INFORMATION:
            ${currentInfo}
            
            ADDITIONAL INFORMATION:
            ${additionalInfo}
            
            Please:
            1. Merge the information, avoiding duplicates
            2. Organize the information logically by topic and source
            3. Ensure all sources are properly attributed
            4. Highlight any new insights or perspectives from the additional information
            
            Return the merged research information in a well-structured format.
          `;

          const mergeResponse = await genAI.models.generateContent({
            model: "gemini-2.5-flash-preview-04-17",
            contents: mergePrompt,
          });

          currentInfo =
            mergeResponse.candidates?.[0]?.content?.parts?.[0]?.text ||
            currentInfo;
          console.log(`✅ Completed enrichment iteration ${iterations}`);
        }
      } else {
        // If no specific gaps or sources were identified, try a general approach
        console.log(
          "No specific gaps or sources identified, trying general enrichment"
        );

        // Use a more general approach to improve the research
        const generalEnrichmentPrompt = `
          You are an expert research analyst. Your task is to identify what's missing from this research about "${topic}"
          and suggest how to improve it.
          
          CURRENT RESEARCH:
          ${currentInfo}
          
          Please:
          1. Identify 3-5 specific aspects of "${topic}" that are missing or underdeveloped
          2. For each aspect, suggest specific information that would improve the research
          3. Be very specific about what information is needed
          
          Format your response as:
          
          MISSING ASPECTS:
          1. [Aspect 1]: [What's missing and why it's important]
          2. [Aspect 2]: [What's missing and why it's important]
          ...
          
          SEARCH QUERIES:
          - For [Aspect 1]: "[specific search query]"
          - For [Aspect 2]: "[specific search query]"
          ...
        `;

        const generalResponse = await genAI.models.generateContent({
          model: "gemini-2.5-flash-preview-04-17",
          contents: generalEnrichmentPrompt,
        });

        const generalSuggestions =
          generalResponse.candidates?.[0]?.content?.parts?.[0]?.text || "";

        // Extract search queries
        const queriesMatch = generalSuggestions.match(
          /SEARCH QUERIES:\s*([\s\S]*)/i
        );
        const searchQueries = queriesMatch ? queriesMatch[1].trim() : "";

        if (searchQueries) {
          // console.log("Generated general search queries:", searchQueries);

          // Use these queries to get more information
          const queryLines = searchQueries
            .split("\n")
            .filter((line) => line.trim())
            .map((line) => {
              const match = line.match(/"([^"]+)"/);
              return match ? match[1] : null;
            })
            .filter((query) => query);

          let additionalInfo = "";

          // Try to get information for each query
          for (const query of queryLines) {
            if (query) {
              const googleInfo = await getGoogleSearchResults(topic, query);
              if (googleInfo) {
                additionalInfo += `### Information for query: "${query}"\n${googleInfo}\n\n`;
              }
            }
          }

          if (additionalInfo) {
            // Merge the additional information
            const mergePrompt = `
              You are an expert research curator. Your task is to merge the current research information 
              with newly gathered information about "${topic}".
              
              TOPIC: ${topic}
              
              CURRENT RESEARCH INFORMATION:
              ${currentInfo}
              
              ADDITIONAL INFORMATION:
              ${additionalInfo}
              
              Please:
              1. Merge the information, avoiding duplicates
              2. Organize the information logically by topic and source
              3. Ensure all sources are properly attributed
              4. Highlight any new insights or perspectives from the additional information
              
              Return the merged research information in a well-structured format.
            `;

            const mergeResponse = await genAI.models.generateContent({
              model: "gemini-2.5-flash-preview-04-17",
              contents: mergePrompt,
            });

            currentInfo =
              mergeResponse.candidates?.[0]?.content?.parts?.[0]?.text ||
              currentInfo;
            console.log(
              `✅ Completed general enrichment in iteration ${iterations}`
            );
          }
        }
      }
    }

    // If we've reached max iterations but satisfaction is still low, add a note
    if (satisfactionScore < SATISFACTION_THRESHOLD) {
      console.log(
        `⚠️ Reached maximum iterations with satisfaction score ${satisfactionScore}/10`
      );
      currentInfo = `NOTE TO CONTENT CREATOR: This research has a satisfaction score of ${satisfactionScore}/10. 
      Consider supplementing with additional research before creating content.\n\n${currentInfo}`;
    }

    return currentInfo;
  } catch (error) {
    console.error("❌ Error during iterative fact-checking:", error);
    return factCheckedInfo; // Return the input content if the process fails
  }
}

/**
 * Gets additional information based on identified gaps
 */
async function getAdditionalInformation(
  topic: string,
  searchTerms: string,
  gaps: string,
  sourcesToEnrich: string
): Promise<string> {
  try {
    console.log("Getting additional information to fill research gaps...");

    // Parse the sources to enrich
    const sourceLines = sourcesToEnrich
      .split("\n")
      .filter((line) => line.trim());
    let additionalInfo = "";

    for (const sourceLine of sourceLines) {
      // Check what type of source is requested
      if (sourceLine.toLowerCase().includes("github")) {
        const githubInfo = await getGitHubInfoForTopic(topic, searchTerms);
        if (githubInfo) {
          additionalInfo += "### Additional GitHub Information\n";
          additionalInfo += githubInfo + "\n\n";
        }
      }

      if (
        sourceLine.toLowerCase().includes("stack overflow") ||
        sourceLine.toLowerCase().includes("stackoverflow")
      ) {
        const stackOverflowInfo = await getStackOverflowInfoForTopic(
          topic,
          searchTerms
        );
        if (stackOverflowInfo) {
          additionalInfo += "### Additional Stack Overflow Information\n";
          additionalInfo += stackOverflowInfo + "\n\n";
        }
      }

      if (sourceLine.toLowerCase().includes("reddit")) {
        const redditInfo = await getRedditInfoForTopic(topic, searchTerms);
        if (redditInfo) {
          additionalInfo += "### Additional Reddit Information\n";
          additionalInfo += redditInfo + "\n\n";
        }
      }

      if (
        sourceLine.toLowerCase().includes("news") ||
        sourceLine.toLowerCase().includes("publication") ||
        sourceLine.toLowerCase().includes("article")
      ) {
        const newsInfo = await getTechPublicationsInfo(topic, searchTerms);
        if (newsInfo) {
          additionalInfo += "### Additional Tech Publication Information\n";
          additionalInfo += newsInfo + "\n\n";
        }
      }

      if (
        sourceLine.toLowerCase().includes("wikipedia") ||
        sourceLine.toLowerCase().includes("background")
      ) {
        const wikiInfo = await getWikipediaInfoForTopic(topic);
        if (wikiInfo) {
          additionalInfo += "### Additional Background Information\n";
          additionalInfo += wikiInfo + "\n\n";
        }
      }
    }

    // If no specific sources were successfully enriched, try a general approach
    if (!additionalInfo) {
      // Use the gaps to create more specific search terms
      const gapTerms = gaps
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => line.replace(/^[•\-\*]\s*/, "").trim())
        .join(", ");

      // Try to get information with the enhanced search terms
      const enhancedSearchTerms = `${searchTerms}, ${gapTerms}`;

      const techInfo = await getTechPublicationsInfo(
        topic,
        enhancedSearchTerms
      );
      if (techInfo) {
        additionalInfo += "### Additional Tech Information\n";
        additionalInfo += techInfo + "\n\n";
      }

      const redditInfo = await getRedditInfoForTopic(
        topic,
        enhancedSearchTerms
      );
      if (redditInfo) {
        additionalInfo += "### Additional Community Perspectives\n";
        additionalInfo += redditInfo + "\n\n";
      }
    }

    return additionalInfo || "No additional information found.";
  } catch (error) {
    console.error("❌ Error getting additional information:", error);
    return "Error retrieving additional information.";
  }
}

/**
 * Structures and optimizes the research for blog post generation
 */
async function structureResearchForBlogPost(
  genAI: GoogleGenAI,
  topic: string,
  searchTerms: string,
  enrichedInfo: string
): Promise<string> {
  try {
    console.log(
      "Structuring and optimizing research for blog post generation..."
    );

    const structurePrompt = `
      You are an expert content researcher and organizer. Your task is to structure and optimize 
      the research information about "${topic}" for blog post generation.
      
      TOPIC: ${topic}
      SEARCH TERMS: ${searchTerms}
      
      RESEARCH INFORMATION:
      ${enrichedInfo}
      
      Please:
      1. Organize the information into a logical structure that would make sense for a blog post
      2. Highlight key facts, statistics, and insights that should be included in the blog
      3. Suggest a potential outline for the blog post
      4. Include all relevant technical details, community perspectives, and resources
      5. Ensure all sources are properly attributed
      6. Remove any redundant or less relevant information
      
      Return the structured research in the following format:
      
      # STRUCTURED RESEARCH FOR: ${topic}
      
      ## Key Facts and Insights
      [List the most important facts and insights about the topic]
      
      ## Technical Background
      [Provide technical background information with sources]
      
      ## Current Trends and Developments
      [Describe current trends and developments with sources]
      
      ## Community Perspectives
      [Summarize community perspectives and discussions with sources]
      
      ## Practical Applications
      [Describe practical applications and use cases with sources]
      
      ## Resources and References
      [List key resources, tools, and references with sources]
      
      ## Suggested Blog Outline
      [Suggest a potential outline for the blog post]
    `;

    const structureResponse = await genAI.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17",
      contents: structurePrompt,
    });

    const structuredContent =
      structureResponse.candidates?.[0]?.content?.parts?.[0]?.text ||
      enrichedInfo;
    console.log("✅ Research structuring completed");

    return structuredContent;
  } catch (error) {
    console.error("❌ Error during research structuring:", error);
    return enrichedInfo; // Return the input content if structuring fails
  }
}

/**
 * Gets information from Google Search using the Custom Search API
 */
async function getGoogleSearchResults(
  topic: string,
  query: string
): Promise<string | null> {
  try {
    const apiKey = process.env.GOOGLE_CSE_API_KEY;
    const searchEngineId = process.env.GOOGLE_CSE_ID;

    if (!apiKey || !searchEngineId) {
      console.warn("Google API key or Search Engine ID not found");
      return null;
    }

    // Combine the topic and query for better results
    const searchQuery = `${topic} ${query}`;
    // console.log(`Performing Google search for: "${searchQuery}"`);

    const response = await axios.get(
      `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(
        searchQuery
      )}&num=5`
    );

    if (!response.data.items || response.data.items.length === 0) {
      return null;
    }

    let googleInfo = "";

    // Process each search result
    for (const item of response.data.items) {
      const { title, link, snippet, displayLink } = item;

      googleInfo += `Result: ${title}\n`;
      googleInfo += `Source: ${displayLink}\n`;
      googleInfo += `URL: ${link}\n`;
      googleInfo += `Summary: ${snippet}\n`;

      // Try to get more content from the page
      try {
        const pageResponse = await axios.get(link, {
          timeout: 5000,
          headers: { "User-Agent": "Mozilla/5.0" },
        });

        const $ = cheerio.load(pageResponse.data);

        // Remove scripts, styles, and other non-content elements
        $("script, style, nav, footer, header, aside").remove();

        // Get text from paragraphs, preferring article content
        let content = "";
        $("article p, main p, .content p, p").each((_, element) => {
          const text = $(element).text().trim();
          if (text.length > 50) {
            // Only include substantial paragraphs
            content += text + " ";
            if (content.length > 1000) return false; // Stop after 1000 chars
          }
        });

        if (content) {
          googleInfo += `Content excerpt: ${content.substring(0, 800)}...\n`;
        }
      } catch (pageError) {
        // If we can't fetch the page content, just continue
      }

      googleInfo += "\n";
    }

    return googleInfo || null;
  } catch (error) {
    console.error("Error getting Google search results:", error);
    return null;
  }
}

/**
 * Gets academic and research paper information about a topic
 */
export async function getAcademicResearchInfo(
  topic: string,
  searchTerms: string
): Promise<string | null> {
  try {
    // Use arXiv API to get research papers
    const query = searchTerms
      ? `${topic} AND (${searchTerms.replace(/,/g, " OR ")})`
      : topic;

    // console.log(`Searching arXiv for: "${query}"`);

    const response = await axios.get(
      `http://export.arxiv.org/api/query?search_query=${encodeURIComponent(
        query
      )}&start=0&max_results=5&sortBy=relevance`
    );

    // Parse the XML response
    const $ = cheerio.load(response.data, { xmlMode: true });

    let academicInfo = "";
    let entryCount = 0;

    $("entry").each((_, entry) => {
      const title = $(entry).find("title").text().trim();
      const summary = $(entry).find("summary").text().trim();
      const authors = $(entry)
        .find("author name")
        .map((_, author) => $(author).text())
        .get()
        .join(", ");
      const published = $(entry).find("published").text();
      const link = $(entry).find('link[title="pdf"]').attr("href");

      if (title) {
        entryCount++;
        academicInfo += `Paper: ${title}\n`;
        academicInfo += `Authors: ${authors}\n`;
        if (published)
          academicInfo += `Published: ${new Date(published).toDateString()}\n`;
        if (summary)
          academicInfo += `Abstract: ${summary.substring(0, 500)}...\n`;
        if (link) academicInfo += `PDF: ${link}\n`;
        academicInfo += "\n";
      }
    });

    // If we didn't find anything on arXiv, try Semantic Scholar
    if (entryCount === 0) {
      console.log("No results from arXiv, trying Semantic Scholar...");

      const semanticResponse = await axios.get(
        `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(
          query
        )}&limit=5&fields=title,abstract,authors,year,url`,
        {
          headers: {
            "x-api-key": process.env.SEMANTIC_SCHOLAR_API_KEY || "", // Optional API key
          },
        }
      );

      if (semanticResponse.data.data && semanticResponse.data.data.length > 0) {
        for (const paper of semanticResponse.data.data) {
          academicInfo += `Paper: ${paper.title}\n`;

          if (paper.authors && paper.authors.length > 0) {
            const authorNames = paper.authors
              .map((author: { name: string }) => author.name)
              .join(", ");
            academicInfo += `Authors: ${authorNames}\n`;
          }

          if (paper.year) academicInfo += `Year: ${paper.year}\n`;
          if (paper.abstract)
            academicInfo += `Abstract: ${paper.abstract.substring(
              0,
              500
            )}...\n`;
          if (paper.url) academicInfo += `URL: ${paper.url}\n`;
          academicInfo += "\n";

          entryCount++;
        }
      }
    }

    return entryCount > 0 ? academicInfo : null;
  } catch (error) {
    console.error("Error getting academic research information:", error);
    return null;
  }
}
