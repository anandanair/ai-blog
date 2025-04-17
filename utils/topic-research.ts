import axios from "axios";

/**
 * Gets detailed information about a specific topic
 */
export async function getDetailedTopicInformation(
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
      detailedInfo += "No specific information found.";
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