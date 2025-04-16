import { getPostData, getAllPostIds } from "@/lib/posts";
import PostClient from "@/components/PostClient";

type Params = {
  params: { id: string };
};

export async function generateStaticParams() {
  const paths = getAllPostIds();
  return paths;
}

export default async function Post({ params }: Params) {
  const { id } = await params;
  const postData = await getPostData(id);

  return <PostClient postData={postData} />;
}
