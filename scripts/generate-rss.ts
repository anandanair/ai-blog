import fs from "fs";
import RSS from "rss";
// Import directly from the .ts files - verify path and function name
import dotenv from "dotenv";
import { getAllPostsForRss, initSupabase } from "../utils/database";

// Load environment variables
dotenv.config();

async function generateRssFeed() {
  // Use environment variable for site URL, provide a default fallback
  const site_url =
    process.env.NEXT_PUBLIC_SITE_URL || "https://blog.itsmeanand.com"; // Default if not set
  if (site_url === "https://blog.itsmeanand.com") {
    console.warn(
      "⚠️ WARNING: NEXT_PUBLIC_SITE_URL not found in .env.local. Using default https://blog.itsmeanand.com"
    );
  }

  // Initialize Supabase client
  const supabase = initSupabase();

  // Fetch posts using the new function
  console.log("Fetching posts for RSS feed...");
  const allPosts = await getAllPostsForRss(supabase);
  console.log(`Fetched ${allPosts.length} posts.`);

  const feedOptions = {
    // Use environment variables for feed details with fallbacks
    title: process.env.NEXT_PUBLIC_SITE_TITLE || "AutoTek | RSS Feed",
    description:
      process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
      "Autonomous insights. Human curiosity.",
    site_url: site_url,
    feed_url: `${site_url}/rss.xml`,
    image_url: `${site_url}/og-default.png`, // Adjust if your OG image is different
    pubDate: new Date(),
    copyright: `All rights reserved ${new Date().getFullYear()}, ${
      process.env.NEXT_PUBLIC_SITE_AUTHOR || "Anand"
    }`, // Use env var or fallback
  };

  const feed = new RSS(feedOptions);

  // Add posts to the feed
  allPosts.forEach((post) => {
    if (!post.slug) {
      console.warn(
        `Skipping post with title "${post.title}" due to missing slug.`
      );
      return; // Skip posts without a slug to avoid broken URLs
    }
    feed.item({
      title: post.title,
      description: post.description,
      url: `${site_url}/posts/${post.slug}`, // Verify this URL structure matches your blog posts
      guid: post.id, // Use unique post ID
      date: post.created_at, // Ensure this is a valid date format for RSS
      author: post.author || "AI Model", // Provide a default author if needed
      // enclosure: post.image_url ? { url: post.image_url } : undefined, // Optional: Add image enclosure
    });
  });

  // Ensure the public directory exists
  const publicDir = "./public";
  if (!fs.existsSync(publicDir)) {
    console.log(`Creating directory: ${publicDir}`);
    fs.mkdirSync(publicDir);
  }

  // Write the RSS feed to a file
  const rssPath = `${publicDir}/rss.xml`;
  console.log(`Writing RSS feed to ${rssPath}...`);
  fs.writeFileSync(rssPath, feed.xml({ indent: true }));
  console.log(`✅ RSS feed generated successfully at ${rssPath}`);
}

generateRssFeed().catch((error) => {
  console.error("❌ Error generating RSS feed:", error);
  process.exit(1); // Exit with error code
});
