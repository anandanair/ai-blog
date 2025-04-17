import { getSortedPostsData, getLatestAiToolData } from "@/lib/posts";
import BlogClient from "@/components/BlogClient";

export default async function Home() {
  const posts = await getSortedPostsData();
  const latestTool = await getLatestAiToolData();

  console.log("Fetched Posts:", posts);
  console.log("Latest AI Tool:", latestTool);

  return <BlogClient posts={posts} latestTool={latestTool} />;
}
