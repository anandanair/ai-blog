import fs from "fs";
import dotenv from "dotenv";
import { getAllPostsForRss, initSupabase } from "../utils/database";

// Load environment variables
dotenv.config();

// Helper function to format date as YYYY-MM-DD
function formatDate(date: Date): string {
  const d = new Date(date);
  let month = "" + (d.getMonth() + 1);
  let day = "" + d.getDate();
  const year = d.getFullYear();

  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;

  return [year, month, day].join("-");
}

async function generateSitemap() {
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

  // Fetch posts
  console.log("Fetching posts for sitemap...");
  const allPosts = await getAllPostsForRss(supabase);
  console.log(`Fetched ${allPosts.length} posts.`);

  const today = formatDate(new Date());

  // Define static pages
  const staticPages = [
    { loc: `${site_url}/`, lastmod: today, changefreq: "daily", priority: "1.0" },
    { loc: `${site_url}/news`, lastmod: today, changefreq: "daily", priority: "0.9" },
    { loc: `${site_url}/posts`, lastmod: today, changefreq: "daily", priority: "0.9" },
    { loc: `${site_url}/categories`, lastmod: today, changefreq: "weekly", priority: "0.8" },
    // Add other static pages here if necessary
    // e.g. { loc: `${site_url}/about`, lastmod: today, changefreq: "monthly", priority: "0.5" },
  ];

  let xmlString = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xmlString += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // Add static pages to XML
  staticPages.forEach(page => {
    xmlString += `  <url>\n`;
    xmlString += `    <loc>${page.loc}</loc>\n`;
    xmlString += `    <lastmod>${page.lastmod}</lastmod>\n`;
    xmlString += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xmlString += `    <priority>${page.priority}</priority>\n`;
    xmlString += `  </url>\n`;
  });

  // Add blog posts to XML
  allPosts.forEach(post => {
    if (!post.slug) {
      console.warn(
        `Skipping post with title "${post.title}" due to missing slug.`
      );
      return; // Skip posts without a slug
    }
    xmlString += `  <url>\n`;
    xmlString += `    <loc>${site_url}/posts/${post.slug}</loc>\n`;
    // Use created_at for lastmod as updated_at is not available
    xmlString += `    <lastmod>${formatDate(new Date(post.created_at))}</lastmod>\n`;
    xmlString += `    <changefreq>weekly</changefreq>\n`; // Default change frequency for posts
    xmlString += `    <priority>0.7</priority>\n`;       // Default priority for posts
    xmlString += `  </url>\n`;
  });

  xmlString += `</urlset>`;

  // Ensure the public directory exists
  const publicDir = "./public";
  if (!fs.existsSync(publicDir)) {
    console.log(`Creating directory: ${publicDir}`);
    fs.mkdirSync(publicDir);
  }

  // Write the sitemap to a file
  const sitemapPath = `${publicDir}/sitemap.xml`;
  console.log(`Writing sitemap to ${sitemapPath}...`);
  fs.writeFileSync(sitemapPath, xmlString);
  console.log(`✅ Sitemap generated successfully at ${sitemapPath}`);
}

generateSitemap().catch((error) => {
  console.error("❌ Error generating sitemap:", error);
  process.exit(1); // Exit with error code
});
