import Parser from "rss-parser";

const parser = new Parser();

const feedUrls = [
  {
    url: "https://feeds.arstechnica.com/arstechnica/technology-lab",
    source: "Ars Technica",
  },
  {
    url: "https://feeds.arstechnica.com/arstechnica/gadgets",
    source: "Ars Technica",
  },
  { url: "https://www.theverge.com/rss/tech/index.xml", source: "The Verge" },
  { url: "https://www.wired.com/feed/tag/ai/latest/rss", source: "Wired AI" },
  {
    url: "https://www.wired.com/feed/category/ideas/latest/rss",
    source: "Wired Ideas",
  },
  {
    url: "https://www.wired.com/feed/category/science/latest/rss",
    source: "Wired Science",
  },
  {
    url: "https://www.wired.com/feed/category/backchannel/latest/rss",
    source: "Wired Backchannel",
  },
  { url: "https://techcrunch.com/feed/", source: "TechCrunch" },
  { url: "https://www.cnet.com/rss/news/", source: "CNET" },
  { url: "https://syndication.howstuffworks.com/rss/tech", source: "HowStuffWorks Tech" },
];

// Utility function to strip HTML tags
function stripHtml(html: string): string {
  return html.replace(/<\/?[^>]+(>|$)/g, "");
}

// Helper to extract the best content from an item
function extractContent(item: any): string {
  return (
    item["content:encoded"] ||
    item.content ||
    item.summary ||
    item.description ||
    ""
  );
}

export async function fetchLatestTechNews(): Promise<string> {
  try {
    const feedPromises = feedUrls.map(({ url, source }) =>
      parser
        .parseURL(url)
        .then((feed) => ({ feed, source }))
        .catch((error) => {
          console.error(`Error fetching feed from ${source}:`, error);
          return null;
        })
    );

    const feedResults = await Promise.all(feedPromises);

    let allArticles: string[] = [];

    for (const result of feedResults) {
      if (!result) continue; // skip failed feeds

      const { feed, source } = result;
      const items = feed.items?.slice(0, 5) || [];

      for (const item of items) {
        const title = item.title || "No Title";
        const link = item.link || "";
        const content = stripHtml(extractContent(item));
        const pubDate = item.pubDate || item.published || "";

        const articleText = `Source: ${source}
Title: ${title}
Date: ${pubDate}
Link: ${link}
Content: ${content}
------------------------------`;
        allArticles.push(articleText);
      }
    }
    // Join everything into one big text blob
    const finalText = allArticles.join("\n\n");

    return finalText;
  } catch (error) {
    console.error("Unexpected error fetching feeds:", error);
    return "";
  }
}
