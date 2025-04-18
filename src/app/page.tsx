import { getSortedPostsData, getLatestAiToolData } from "@/lib/posts";
import BlogClient from "@/components/BlogClient";

export default async function Home() {
  const posts = await getSortedPostsData();
  const latestTool = await getLatestAiToolData();

  return <BlogClient posts={posts} latestTool={latestTool} />;
}
