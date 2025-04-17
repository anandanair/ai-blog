import axios from "axios";
import * as cheerio from "cheerio";

/**
 * Gets detailed information about a specific topic
 */
export async function getDetailedTopicInformation(
  topic: string,
  searchTerms: string
): Promise<string> {
  let detailedInfo = `Detailed information about "${topic}":\n\n`;

  try {
    // 1. Get information from Wikipedia for factual background
    const wikipediaInfo = await getWikipediaInfoForTopic(topic);
    if (wikipediaInfo) {
      detailedInfo += "Background information from Wikipedia:\n";
      detailedInfo += wikipediaInfo + "\n\n";
    }

    // 3. Get information from tech publications and blogs
    const techPublicationsInfo = await getTechPublicationsInfo(
      topic,
      searchTerms
    );
    if (techPublicationsInfo) {
      detailedInfo += "Information from tech publications:\n";
      detailedInfo += techPublicationsInfo + "\n\n";
    }

    // 4. Get Reddit discussions for community perspectives
    const redditInfo = await getRedditInfoForTopic(topic, searchTerms);
    if (redditInfo) {
      detailedInfo += "Community discussions from Reddit:\n";
      detailedInfo += redditInfo + "\n\n";
    }

    // 5. Get HackerNews posts for developer perspectives
    const hackerNewsInfo = await getHackerNewsInfoForTopic(topic, searchTerms);
    if (hackerNewsInfo) {
      detailedInfo += "Developer discussions from HackerNews:\n";
      detailedInfo += hackerNewsInfo + "\n\n";
    }

    // 6. Get GitHub repositories and documentation related to the topic
    const githubInfo = await getGitHubInfoForTopic(topic, searchTerms);
    if (githubInfo) {
      detailedInfo += "Related GitHub projects and documentation:\n";
      detailedInfo += githubInfo + "\n\n";
    }

    // 7. Get Stack Overflow Q&A for technical details
    const stackOverflowInfo = await getStackOverflowInfoForTopic(
      topic,
      searchTerms
    );
    if (stackOverflowInfo) {
      detailedInfo += "Technical Q&A from Stack Overflow:\n";
      detailedInfo += stackOverflowInfo + "\n\n";
    }

    // As a fallback, add some general information if nothing specific was found
    if (
      !wikipediaInfo &&
      !techPublicationsInfo &&
      !redditInfo &&
      !hackerNewsInfo &&
      !githubInfo &&
      !stackOverflowInfo
    ) {
      detailedInfo += "No specific information found for this topic.";
    }

    return detailedInfo;
  } catch (error) {
    console.error("Error getting detailed topic information:", error);
    return "Unable to fetch detailed information about this topic.";
  }
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

    const query = searchTerms
      ? `${topic} AND (${searchTerms.replace(/,/g, " OR ")})`
      : topic;

    const response = await axios.get(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(
        query
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
    return null;
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
    // Convert search terms to an array and add the main topic
    const searchTermsArray = searchTerms.split(",").map((term) => term.trim());
    if (!searchTermsArray.includes(topic)) {
      searchTermsArray.push(topic);
    }

    // Create a search query for GitHub
    const query = searchTermsArray.join("+");

    // Search GitHub repositories
    const response = await axios.get(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(
        query
      )}&sort=stars&order=desc`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "web:ai-blog-generator:v1.0",
        },
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
            headers: {
              Accept: "application/vnd.github.v3+json",
              "User-Agent": "web:ai-blog-generator:v1.0",
            },
          }
        );

        if (readmeResponse.data.content) {
          const readmeContent = Buffer.from(
            readmeResponse.data.content,
            "base64"
          ).toString();
          // Extract first 500 characters of README
          githubInfo += `README excerpt: ${readmeContent
            .replace(/\n/g, " ")
            .substring(0, 500)}...\n`;
        }
      } catch (readmeError) {
        // If we can't get the README, just continue
      }

      githubInfo += "\n";
    }

    return githubInfo || null;
  } catch (error) {
    console.error("Error getting GitHub information:", error);
    return null;
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
