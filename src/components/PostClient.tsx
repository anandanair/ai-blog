"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PostData, SourceInfo } from "@/types"; // Import the PostData type
import { formatDate } from "@/utils/helpers";
import { CodeBlock } from "./CodeBlock";

interface PostClientProps {
  postData: PostData;
}

export default function PostClient({ postData }: PostClientProps) {
  const articleRef = useRef<HTMLElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [expandedSources, setExpandedSources] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const { scrollYProgress } = useScroll({
    target: articleRef,
    offset: ["start start", "end end"],
  });

  const progressBarWidth = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", "100%"]
  );

  // --- Process Research Details ---
  const { uniqueSources, searchSuggestionsHtml } = useMemo(() => {
    const sourcesMap = new Map<string, SourceInfo>();
    const suggestions: string[] = [];

    if (postData.research_details) {
      postData.research_details.forEach((detail) => {
        // Collect unique sources based on URI
        if (detail.data.sources) {
          detail.data.sources.forEach((source) => {
            if (source.uri && !sourcesMap.has(source.uri)) {
              sourcesMap.set(source.uri, source);
            }
          });
        }
        // Collect renderedContent HTML
        if (detail.data.renderedContent) {
          suggestions.push(detail.data.renderedContent);
        }
      });
    }

    return {
      uniqueSources: Array.from(sourcesMap.values()),
      searchSuggestionsHtml: suggestions,
    };
  }, [postData.research_details]); // Dependency array

  // Set isLoaded to true after component mounts and scroll to top
  useEffect(() => {
    window.scrollTo(0, 0);
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-blue-600 z-50 origin-left"
        style={{ scaleX: progressBarWidth }}
      />

      {/* Hero section - Fixed visibility issue */}
      <motion.header
        className="relative h-[60vh] flex items-center justify-center overflow-hidden"
        style={{ opacity: isLoaded ? 1 : 0, scale: isLoaded ? 1 : 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600">
          {postData.image_url ? ( // Use image_url from PostData
            <div className="absolute inset-0">
              <Image
                src={postData.image_url} // Use image_url from PostData
                alt={postData.title}
                fill
                className="object-cover opacity-40"
                priority
              />
            </div>
          ) : (
            <div className="absolute inset-0 opacity-20 bg-[url('/hero-pattern.svg')] bg-repeat"></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-gray-900/30" />
        </div>

        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-4 inline-flex items-center text-sm font-medium text-blue-200"
          >
            <Link
              href="/"
              className="hover:text-white transition-colors flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to articles
            </Link>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {postData.title}
          </motion.h1>

          <motion.div
            className="flex items-center justify-center space-x-4 text-gray-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: isLoaded ? 1 : 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <time dateTime={postData.created_at} className="flex items-center">
              {" "}
              {/* Use created_at from PostData */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {formatDate(postData.created_at)}{" "}
              {/* Use created_at from PostData */}
            </time>
            <span className="w-1 h-1 rounded-full bg-gray-400"></span>
            <span className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {postData.read_time} min read
            </span>
          </motion.div>
        </div>

        <motion.div
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-white/70"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </motion.div>
      </motion.header>

      {/* Article content - Improved styling */}
      <article
        ref={articleRef}
        className="relative z-10 -mt-16 bg-white dark:bg-gray-800 rounded-t-3xl shadow-xl max-w-4xl mx-auto mb-20"
      >
        <div className="prose prose-lg lg:prose-xl dark:prose-invert max-w-none px-4 sm:px-8 md:px-16 py-12">
          {postData.description && (
            <motion.div
              className="text-xl text-gray-600 dark:text-gray-300 mb-8 font-light leading-relaxed border-l-4 border-blue-500 pl-4 italic !no-prose" // Add !no-prose if you don't want prose styles here
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: isLoaded ? 1 : 0, x: isLoaded ? 0 : -20 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              {postData.description}
            </motion.div>
          )}

          {/* Render Markdown Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            {/* Remove dangerouslySetInnerHTML */}
            <ReactMarkdown
              remarkPlugins={[remarkGfm]} // Enable GFM features
              components={{
                code(props) {
                  const { children, className, node, ...rest } = props;
                  const match = /language-(\w+)/.exec(className || "");
                  const value = String(children).replace(/\n$/, ""); // Extract the code string

                  return match ? (
                    <CodeBlock language={match[1]} value={value} {...props} />
                  ) : (
                    <code {...rest} className={className}>
                      {children}
                    </code>
                  );
                },
              }}
              // components={components} // Pass custom renderers
            >
              {postData.content || ""}
            </ReactMarkdown>
          </motion.div>

          {/* --- Display Sources and Suggestions --- */}
          {(uniqueSources.length > 0 || searchSuggestionsHtml.length > 0) && (
            <motion.div
              className="mt-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: isLoaded ? 1 : 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <div className="border-t border-gray-200 dark:border-gray-800 pt-8 space-y-10">
                {/* Display Sources Section - with pagination for large numbers */}
                {uniqueSources.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 flex items-center !no-prose">
                        <span className="inline-block w-5 h-5 mr-2 text-gray-500 dark:text-gray-400">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 21l-8.2-8.2c-2-2-2-5.2 0-7.2s5.2-2 7.2 0L12 6.8l1-1c2-2 5.2-2 7.2 0s2 5.2 0 7.2L12 21z"></path>
                          </svg>
                        </span>
                        Sources
                        {uniqueSources.length > 12 && (
                          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 font-normal">
                            ({uniqueSources.length})
                          </span>
                        )}
                      </h3>

                      {/* Show expand/collapse toggle if many sources */}
                      {uniqueSources.length > 12 && (
                        <button
                          onClick={() => setExpandedSources((prev) => !prev)}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                        >
                          {expandedSources ? (
                            <>
                              <span>Show less</span>
                              <svg
                                className="w-4 h-4 ml-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M5 15l7-7 7 7"
                                ></path>
                              </svg>
                            </>
                          ) : (
                            <>
                              <span>Show all</span>
                              <svg
                                className="w-4 h-4 ml-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M19 9l-7 7-7-7"
                                ></path>
                              </svg>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Grid layout with conditional display based on expand state */}
                    <div className="!no-prose">
                      {uniqueSources.length <= 12 || expandedSources ? (
                        // Full grid when expanded or fewer sources
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {uniqueSources.map((source, index) => (
                            <a
                              key={source.uri || index}
                              href={source.uri}
                              target="_blank"
                              rel="noopener noreferrer nofollow"
                              className="flex items-center px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800 
                            hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              title={source.uri}
                            >
                              <div className="flex-shrink-0 w-4 h-4 text-gray-400 dark:text-gray-500">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"></path>
                                  <path d="M15 3h6v6"></path>
                                  <path d="M10 14L21 3"></path>
                                </svg>
                              </div>
                              <div className="ml-3 text-sm text-gray-700 dark:text-gray-300 truncate">
                                {source.title ||
                                  source.uri?.split("/")[2] ||
                                  "Source Link"}
                              </div>
                            </a>
                          ))}
                        </div>
                      ) : (
                        // Show limited sources with visual indicator for more
                        <div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {uniqueSources.slice(0, 12).map((source, index) => (
                              <a
                                key={source.uri || index}
                                href={source.uri}
                                target="_blank"
                                rel="noopener noreferrer nofollow"
                                className="flex items-center px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800 
                              hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                title={source.uri}
                              >
                                <div className="flex-shrink-0 w-4 h-4 text-gray-400 dark:text-gray-500">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"></path>
                                    <path d="M15 3h6v6"></path>
                                    <path d="M10 14L21 3"></path>
                                  </svg>
                                </div>
                                <div className="ml-3 text-sm text-gray-700 dark:text-gray-300 truncate">
                                  {source.title ||
                                    source.uri?.split("/")[2] ||
                                    "Source Link"}
                                </div>
                              </a>
                            ))}
                          </div>
                          {/* Faded indicator showing there are more sources */}
                          <div className="mt-2 pt-3 text-center text-sm text-gray-500 dark:text-gray-400">
                            {uniqueSources.length - 12} more sources available
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Display Search Suggestions - Tabbed interface for multiple suggestions */}
                {searchSuggestionsHtml.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 flex items-center !no-prose">
                        <span className="inline-block w-5 h-5 mr-2 text-gray-500 dark:text-gray-400">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                          </svg>
                        </span>
                        Related Searches
                        {searchSuggestionsHtml.length > 3 && (
                          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 font-normal">
                            ({searchSuggestionsHtml.length})
                          </span>
                        )}
                      </h3>
                    </div>

                    {/* For many search suggestions, use tabs or a scrollable container */}
                    <div className="!no-prose">
                      {searchSuggestionsHtml.length > 3 ? (
                        <>
                          {/* Horizontal scrollable tab navigation for large number of suggestions */}
                          <div className="mb-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto whitespace-nowrap pb-1 hide-scrollbar">
                            {searchSuggestionsHtml
                              .slice(0, 10)
                              .map((_, index) => (
                                <button
                                  key={index}
                                  onClick={() => setActiveTab(index)}
                                  className={`inline-block px-4 py-2 mr-2 text-sm rounded-t-lg transition-colors ${
                                    activeTab === index
                                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                                  }`}
                                >
                                  Set {index + 1}
                                </button>
                              ))}
                            {searchSuggestionsHtml.length > 10 && (
                              <span className="inline-block px-4 py-2 text-sm text-gray-400 dark:text-gray-500">
                                +{searchSuggestionsHtml.length - 10} more
                              </span>
                            )}
                          </div>

                          {/* Display the active suggestion set */}
                          <div className="w-full pb-2">
                            <div
                              dangerouslySetInnerHTML={{
                                __html: searchSuggestionsHtml[activeTab],
                              }}
                              className="w-full overflow-x-auto"
                            />
                          </div>
                        </>
                      ) : (
                        // For fewer suggestions, display them all
                        <div className="space-y-3">
                          {searchSuggestionsHtml.map((htmlString, index) => (
                            <div
                              key={index}
                              dangerouslySetInnerHTML={{ __html: htmlString }}
                              className="w-full overflow-x-auto pb-2"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
          {/* --- End Sources and Suggestions --- */}
        </div>

        {/* Article footer */}
        <motion.div
          className="border-t border-gray-200 dark:border-gray-700 px-4 sm:px-8 md:px-16 py-8 flex flex-col sm:flex-row justify-between items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <div className="mb-4 sm:mb-0">
            <span className="text-gray-500 dark:text-gray-400">
              Share this article:
            </span>
            <div className="flex space-x-4 mt-2">
              {/* Social share buttons (non-functional in this example) */}
              {["twitter", "facebook", "linkedin"].map((social) => (
                <motion.button
                  key={social}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                >
                  <span className="sr-only">Share on {social}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                  </svg>
                </motion.button>
              ))}
            </div>
          </div>

          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium flex items-center transition-colors"
            >
              <span>Back to articles</span>
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
            </motion.button>
          </Link>
        </motion.div>
      </article>

      {/* Floating scroll to top button */}
      <motion.button
        className="fixed bottom-8 right-8 p-3 rounded-full bg-blue-600 text-white shadow-lg z-20 hover:bg-blue-700 transition-colors"
        initial={{ opacity: 0 }}
        animate={{
          opacity: scrollYProgress.get() > 0.1 ? 1 : 0,
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
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
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>
      </motion.button>
    </div>
  );
}
