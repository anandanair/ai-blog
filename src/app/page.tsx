// Remove "use client"; directive if it exists
// Remove useState, useEffect, motion imports

import { getSortedPostsData, getLatestAiToolData } from "@/lib/posts"; // Import getLatestAiToolData
import BlogClient from "@/components/BlogClient"; // Import the new client component

export default function Home() {
  // Fetch data on the server
  const posts = getSortedPostsData();
  const latestTool = getLatestAiToolData(); // Fetch the latest AI tool data

  // Render the Client Component and pass both posts and latestTool data as props
  return <BlogClient posts={posts} latestTool={latestTool} />;
}
