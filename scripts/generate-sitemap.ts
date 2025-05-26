import fs from "fs";
import dotenv from "dotenv";
import { getAllPostsForSitemap, initSupabase } from "../utils/database"; // Assuming a similar function to getAllPostsForRss or we'll adapt

// Load environment variables
dotenv.config();

async function generateSitemap() {
  const site_url =
    process.env.NEXT_PUBLIC_SITE_URL || "https://blog.itsmeanand.com";
  if (site_url === "https://blog.itsmeanand.com") {
    console.warn(
      "⚠️ WARNING: NEXT_PUBLIC_SITE_URL not found in .env.local. Using default https://blog.itsmeanand.com"
    );
  }

  const supabase = initSupabase();

  console.log("Fetching posts for sitemap...");
  // We'll need a function like getAllPostsForSitemap that returns slug and updated_at/created_at
  // For now, let's assume it returns objects like { slug: string, updated_at: string | Date }
  const allPosts = await getAllPostsForSitemap(supabase);
  console.log(`Fetched ${allPosts.length} posts.`);

  const sitemapItems = allPosts.map((post) => {
    // Ensure updated_at is in YYYY-MM-DD format
    const lastMod = new Date(post.created_at).toISOString().split("T")[0];
    return `
  <url>
    <loc>${site_url}/posts/${post.slug}</loc>
    <lastmod>${lastMod}</lastmod>
  </url>`;
  });

  // Add static pages
  const staticPages = [
    { loc: site_url, lastmod: new Date().toISOString().split("T")[0] }, // Home page
    {
      loc: `${site_url}/categories`,
      lastmod: new Date().toISOString().split("T")[0],
    }, // Categories page
    // Add other static pages here if necessary
  ];

  staticPages.forEach((page) => {
    sitemapItems.unshift(
      `
  <url>
    <loc>${page.loc}</loc>
    <lastmod>${page.lastmod}</lastmod>
  </url>`
    );
  });

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapItems.join("")}
</urlset>`;

  const publicDir = "./public";
  if (!fs.existsSync(publicDir)) {
    console.log(`Creating directory: ${publicDir}`);
    fs.mkdirSync(publicDir);
  }

  const sitemapPath = `${publicDir}/sitemap.xml`;
  console.log(`Writing sitemap to ${sitemapPath}...`);
  fs.writeFileSync(sitemapPath, sitemapXml);
  console.log(`✅ Sitemap generated successfully at ${sitemapPath}`);
}

generateSitemap().catch((error) => {
  console.error("❌ Error generating sitemap:", error);
  process.exit(1);
});
