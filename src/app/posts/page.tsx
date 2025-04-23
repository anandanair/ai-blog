import { getSortedPostsData } from "@/lib/posts";
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";

// Define the page props type to include searchParams
type PostsPageProps = {
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

export const metadata: Metadata = {
  title: "Blog Posts | AutoTek",
  description: "Explore our collection of articles on AI and technology",
};

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const categoryParam = (await searchParams).category;
  const posts = await getSortedPostsData(categoryParam as number | undefined);

  // Create a title that includes the category if one is selected
  const pageTitle = categoryParam
    ? `${categoryParam} Articles`
    : "All Articles";

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {posts.length > 0 ? (
          <>
            {/* Latest posts section */}
            <div className="mb-16">
              <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-6 flex items-center">
                <span className="inline-block w-8 h-1 bg-purple-600 mr-3"></span>
                Latest Articles
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.slice(0, 6).map((post) => (
                  <article
                    key={post.id}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col h-full"
                  >
                    <div className="relative h-48">
                      {post.image_url ? (
                        <Image
                          src={post.image_url || `/placeholder-${post.id}.jpg`}
                          alt={post.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      ) : (
                        <div className="h-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                          <span className="text-white text-4xl font-bold">
                            {post.title.substring(0, 1)}
                          </span>
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <span className="inline-block bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 text-xs font-medium px-2.5 py-1 rounded-full">
                          {post.category || "Technology"}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 flex flex-col flex-grow">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        {new Date(post.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>

                      <Link
                        href={`/posts/${post.id}`}
                        className="block group mb-3"
                      >
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-200">
                          {post.title}
                        </h3>
                      </Link>

                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3 flex-grow">
                        {post.description}
                      </p>

                      <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center">
                        <div className="flex-shrink-0 mr-3">
                          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 overflow-hidden">
                            <Image
                              src={
                                post.author_image || "/placeholder-author.jpg"
                              }
                              alt={post.author || "Author"}
                              width={32}
                              height={32}
                              className="object-cover"
                            />
                          </div>
                        </div>
                        <div className="text-xs">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {post.author || "AI Model"}
                          </p>
                          <p className="text-gray-500 dark:text-gray-400">
                            {post.read_time || "5 min read"}
                          </p>
                        </div>
                        <div className="ml-auto">
                          <Link
                            href={`/posts/${post.id}`}
                            className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 text-sm font-medium"
                          >
                            Read more
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
              />
            </svg>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
              No blog posts found. Check back later!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
