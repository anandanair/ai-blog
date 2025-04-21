import { getSortedPostsData } from "@/lib/posts";
import Link from "next/link";
import Image from "next/image";

export default async function BlogPage() {
  const posts = await getSortedPostsData();

  // Filter out AI Tool posts if needed
  const blogPosts = posts.filter(
    (post) => post.category !== "AI Tool of the Day"
  );

  // Featured post is the most recent one
  const featuredPost = blogPosts[0];
  // Rest of the posts
  const regularPosts = blogPosts.slice(1);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {blogPosts.length > 0 ? (
          <>
            {/* Featured post */}
            <div className="mb-16">
              <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-6 flex items-center">
                <span className="inline-block w-8 h-1 bg-purple-600 mr-3"></span>
                Featured Article
              </h2>

              <article className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                <div className="relative h-96">
                  {featuredPost.image_url ? (
                    <Image
                      src={
                        featuredPost.image_url || "/placeholder-featured.jpg"
                      }
                      alt={featuredPost.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1280px) 100vw, 1280px"
                    />
                  ) : (
                    <div className="h-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                      <span className="text-white text-8xl font-bold">
                        {featuredPost.title.substring(0, 1)}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                </div>

                <div className="relative mt-[-100px] p-8 text-white z-10">
                  <div className="mb-4">
                    <span className="inline-block bg-purple-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                      {featuredPost.category || "Technology"}
                    </span>
                    <span className="mx-2 text-gray-300 text-sm">•</span>
                    <span className="text-gray-300 text-sm">
                      {new Date(featuredPost.created_at).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </span>
                  </div>

                  <Link
                    href={`/blog/${featuredPost.id}`}
                    className="block group"
                  >
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 group-hover:text-purple-300 transition-colors duration-200">
                      {featuredPost.title}
                    </h2>
                  </Link>

                  <p className="text-gray-200 mb-6 line-clamp-3">
                    {featuredPost.description}
                  </p>

                  <div className="flex items-center">
                    <div className="flex-shrink-0 mr-4">
                      <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 overflow-hidden">
                        <Image
                          src={
                            featuredPost.author_image ||
                            "/placeholder-author.jpg"
                          }
                          alt={featuredPost.author || "Author"}
                          width={40}
                          height={40}
                          className="object-cover"
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {featuredPost.author || "AI Model"}
                      </p>
                    </div>

                    <div className="ml-auto">
                      <Link
                        href={`/blog/${featuredPost.id}`}
                        className="text-white bg-purple-600 hover:bg-purple-700 font-medium rounded-full px-5 py-2 inline-flex items-center transition-colors duration-200"
                      >
                        Read Article
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 ml-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14 5l7 7m0 0l-7 7m7-7H3"
                          />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            </div>

            {/* Latest posts section */}
            <div className="mb-16">
              <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-6 flex items-center">
                <span className="inline-block w-8 h-1 bg-purple-600 mr-3"></span>
                Latest Articles
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {regularPosts.slice(0, 6).map((post) => (
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
                        href={`/blog/${post.id}`}
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
                            href={`/blog/${post.id}`}
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
