import Link from "next/link";
import { getSortedPostsData } from "@/lib/posts";

export default function Home() {
  const posts = getSortedPostsData();

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-4">🧠 AI-Powered Blog</h1>
      <ul className="space-y-4">
        {posts.map((post) => (
          <li key={post.id} className="border-b pb-2">
            <Link href={`/posts/${post.id}`}>
              <h2 className="text-xl font-semibold">{post.title}</h2>
              <p className="text-gray-500">{post.description}</p>
              <small className="text-sm text-gray-400">{post.date}</small>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
