import { getSortedPostsData } from "@/lib/posts";
import BlogClient from "@/components/BlogClient";

export default async function Home() {
  const posts = await getSortedPostsData();

  return <BlogClient posts={posts} />;
}
