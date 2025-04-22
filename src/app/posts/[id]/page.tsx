import { getPostData, getAllPostIds } from "@/lib/posts";
import PostClient from "@/components/PostClient";

type Params = {
  params: Promise<{ id: string }>;
};

// export async function generateStaticParams() {
//   const paths = await getAllPostIds(); // Ensure this is awaited if it's asynchronous
//   return paths;
// }

export default async function Post({ params }: Params) {
  const { id } = await params; // No need to await destructuring
  const postData = await getPostData(id);

  if (!postData) {
    // Handle the case where postData is null
    return <div>Error: Post not found</div>;
  }

  return <PostClient postData={postData} />;
}
