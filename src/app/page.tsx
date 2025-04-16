// Remove "use client"; directive if it exists
// Remove useState, useEffect, motion imports

import { getSortedPostsData } from "@/lib/posts";
import BlogClient from "@/components/BlogClient"; // Import the new client component

export default function Home() {
  // Fetch data on the server
  const posts = getSortedPostsData(); 

  // Render the Client Component and pass the posts data as props
  return <BlogClient posts={posts} />;
}
