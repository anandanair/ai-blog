import { getPostData, getAllPostIds } from "@/lib/posts";

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

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold">{postData.title}</h1>
      <small className="text-gray-500">{postData.date}</small>
      <div
        className="mt-4 prose prose-lg"
        dangerouslySetInnerHTML={{ __html: postData.contentHtml }}
      />
    </main>
  );
}
