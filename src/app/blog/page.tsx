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

  // Hardcoded categories for the filter (you'll replace with your actual categories)
  const categories = ["All", "AI", "Technology", "Tutorials", "Insights"];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
              <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Blog
              </span>
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-400">
              Insights, tutorials, and thoughts on AI and technology
            </p>
          </div>

          {/* Category navigation */}
          <nav className="flex justify-center mb-8">
            <ul className="flex flex-wrap gap-2 md:gap-4">
              {categories.map((category) => (
                <li key={category}>
                  <button
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200
                    ${
                      category === "All"
                        ? "bg-purple-600 text-white"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    {category}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Search bar */}
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search articles..."
                className="w-full p-4 pl-12 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <div className="absolute left-4 top-4 text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </header>

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
                        {featuredPost.author || "John Doe"}
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
                            {post.author || "John Doe"}
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

            {/* Newsletter subscription */}
            <div className="mb-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 md:p-12">
              <div className="md:flex items-center">
                <div className="md:w-2/3 mb-6 md:mb-0 md:pr-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    Stay updated with our newsletter
                  </h2>
                  <p className="text-purple-100">
                    Get the latest articles, tutorials, and updates delivered
                    straight to your inbox.
                  </p>
                </div>
                <div className="md:w-1/3">
                  <form className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      placeholder="Your email address"
                      className="flex-grow px-4 py-3 rounded-lg text-gray-900 focus:ring-2 focus:ring-white"
                    />
                    <button
                      type="submit"
                      className="bg-white text-purple-600 hover:bg-purple-100 font-medium px-4 py-3 rounded-lg transition-colors duration-200"
                    >
                      Subscribe
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* More articles in list view */}
            <div>
              <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-6 flex items-center">
                <span className="inline-block w-8 h-1 bg-purple-600 mr-3"></span>
                More Articles
              </h2>

              <div className="space-y-6">
                {regularPosts.slice(6, 12).map((post) => (
                  <article
                    key={post.id}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-300"
                  >
                    <div className="sm:flex items-center">
                      <div className="sm:w-1/4 mb-4 sm:mb-0">
                        <div className="relative h-40 sm:h-24 sm:w-full rounded-lg overflow-hidden">
                          {post.image_url ? (
                            <Image
                              src={
                                post.image_url || `/placeholder-${post.id}.jpg`
                              }
                              alt={post.title}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 100vw, 25vw"
                            />
                          ) : (
                            <div className="h-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                              <span className="text-white text-4xl font-bold">
                                {post.title.substring(0, 1)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="sm:w-3/4 sm:pl-6">
                        <div className="flex items-center mb-2 text-sm">
                          <span className="text-purple-600 dark:text-purple-400 font-medium">
                            {post.category || "Technology"}
                          </span>
                          <span className="mx-2 text-gray-400">•</span>
                          <span className="text-gray-500 dark:text-gray-400">
                            {new Date(post.created_at).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )}
                          </span>
                          <span className="mx-2 text-gray-400">•</span>
                          <span className="text-gray-500 dark:text-gray-400">
                            {post.read_time || "4 min read"}
                          </span>
                        </div>

                        <Link href={`/blog/${post.id}`} className="block group">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-200 mb-2">
                            {post.title}
                          </h3>
                        </Link>

                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                          {post.description}
                        </p>

                        <div className="flex items-center">
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
                              {post.author || "John Doe"}
                            </p>
                          </div>
                          <div className="ml-auto">
                            <Link
                              href={`/blog/${post.id}`}
                              className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 text-sm font-medium flex items-center"
                            >
                              Read article
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 ml-1"
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
                    </div>
                  </article>
                ))}
              </div>

              {/* Pagination */}
              <div className="mt-12 flex justify-center">
                <nav
                  className="inline-flex rounded-md shadow-sm -space-x-px"
                  aria-label="Pagination"
                >
                  <a
                    href="#"
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <span className="sr-only">Previous</span>
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </a>
                  <a
                    href="#"
                    className="relative inline-flex items-center px-4 py-2 border border-purple-500 bg-purple-50 dark:bg-purple-900 text-sm font-medium text-purple-600 dark:text-purple-300"
                  >
                    1
                  </a>
                  <a
                    href="#"
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    2
                  </a>
                  <a
                    href="#"
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    3
                  </a>
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200">
                    ...
                  </span>
                  <a
                    href="#"
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    8
                  </a>
                  <a
                    href="#"
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    9
                  </a>
                  <a
                    href="#"
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <span className="sr-only">Next</span>
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </a>
                </nav>
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
