"use client";

import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PostData, ResearchDetailItem } from "@/types"; // Import the PostData type
import { formatDate } from "@/utils/helpers";
import { CodeBlock } from "./CodeBlock";
import ReferenceTooltip from "./ReferenceTooltip";
import { incrementPostViews } from "@/lib/posts.client";
import RecommendedPosts from './RecommendedPosts'; // Import RecommendedPosts

// Helper component to process references in any text content
const ProcessReferences = ({
  children,
  researchDataMap,
  as: Component = "p",
  ...props
}: {
  children: React.ReactNode;
  researchDataMap: Map<string, ResearchDetailItem["data"]>;
  as?: React.ElementType;
  [key: string]: any;
}) => {
  // Process children to find and replace reference patterns
  const processedChildren = React.Children.map(children, (child) => {
    // Only process string children
    if (typeof child !== "string") {
      return child;
    }

    // Split the text by reference patterns
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    // Enhanced regex to match both single and multiple references
    // This will match patterns like [ref:ref-14] and [ref:ref-13, ref:ref-14]
    const regex = /\[ref:(ref-\d+)(?:,\s*ref:(ref-\d+))*\]/g;
    let match;

    while ((match = regex.exec(child)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(child.substring(lastIndex, match.index));
      }

      // Extract all reference IDs from the match
      const fullMatch = match[0];
      const refIds = fullMatch.match(/ref-\d+/g) || [];

      // Create a fragment with all references
      parts.push(
        <Fragment key={`refs-${match.index}`}>
          {refIds.map((refId, idx) => {
            const researchData = researchDataMap.get(refId);

            if (researchData) {
              return (
                <Fragment key={`${refId}-${idx}`}>
                  <ReferenceTooltip researchData={researchData} refId={refId} />
                  {idx < refIds.length - 1 && ", "}
                </Fragment>
              );
            } else {
              return (
                <Fragment key={`missing-${refId}-${idx}`}>
                  <span className="inline-flex items-center text-red-500 font-medium text-xs bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded-md">
                    [Missing Ref: {refId}]
                  </span>
                  {idx < refIds.length - 1 && ", "}
                </Fragment>
              );
            }
          })}
        </Fragment>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text after the last match
    if (lastIndex < child.length) {
      parts.push(child.substring(lastIndex));
    }

    return parts.length > 1 ? parts : child;
  });

  return <Component {...props}>{processedChildren}</Component>;
};

interface PostClientProps {
  postData: PostData;
}

export default function PostClient({ postData }: PostClientProps) {
  const articleRef = useRef<HTMLElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const { scrollYProgress } = useScroll({
    target: articleRef,
    offset: ["start start", "end end"],
  });

  const progressBarWidth = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", "100%"]
  );

  useEffect(() => {
    if (postData.id) {
      incrementPostViews(postData.id);

      // Track reading history
      const MAX_HISTORY_ITEMS = 20; // Max items to keep in history for posts and categories each
      const storedHistory = localStorage.getItem('readingHistory');
      let readingHistory: string[] = storedHistory ? JSON.parse(storedHistory) : [];

      // Add current post ID to history
      if (!readingHistory.includes(postData.id)) {
        readingHistory.push(postData.id);
      }

      // Add current post's category to history (if it has one)
      if (postData.category) {
        const categoryKey = `category:${postData.category}`;
        if (!readingHistory.includes(categoryKey)) {
          readingHistory.push(categoryKey);
        }
      }
      
      // Remove duplicates and limit history size
      // A more sophisticated approach might involve separate lists for posts and categories
      // or weighting items by recency. For now, a single list with mixed types.
      const uniqueHistory = Array.from(new Set(readingHistory));
      
      if (uniqueHistory.length > MAX_HISTORY_ITEMS) {
        // Simple FIFO eviction, could be smarter (e.g. evict least relevant)
         readingHistory = uniqueHistory.slice(uniqueHistory.length - MAX_HISTORY_ITEMS);
      } else {
        readingHistory = uniqueHistory;
      }

      localStorage.setItem('readingHistory', JSON.stringify(readingHistory));
    }
  }, [postData.id, postData.category]);

  // --- Prepare Research Lookup Map ---
  const researchDataMap = useMemo(() => {
    const map = new Map<string, ResearchDetailItem["data"]>();
    if (postData.research_details) {
      postData.research_details.forEach((detail, index) => {
        // Use the generated 'ref-X' index as the key for lookup
        const refId = `ref-${index}`;
        map.set(refId, detail.data);
      });
    }
    return map;
  }, [postData.research_details]);

  // Set isLoaded to true after component mounts and scroll to top
  useEffect(() => {
    window.scrollTo(0, 0);
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-blue-600 z-50 origin-left"
        style={{ scaleX: progressBarWidth }}
      />

      {/* Hero section - Fixed visibility issue */}
      <motion.header
        className="relative h-[60vh] flex items-center justify-center overflow-hidden rounded-3xl"
        style={{ opacity: isLoaded ? 1 : 0, scale: isLoaded ? 1 : 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl">
          {!isLoaded && (
            <div className="absolute inset-0 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800 animate-pulse rounded-3xl"></div>
          )}
          {postData.image_url ? ( // Use image_url from PostData
            <div className="absolute inset-0">
              <Image
                src={postData.image_url} // Use image_url from PostData
                alt={postData.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                className="object-cover opacity-40"
                priority
                quality={85}
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFdwI2QOQvhAAAAABJRU5ErkJggg=="
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
        className="relative z-10 -mt-16 bg-gradient-to-b from-white/80 to-white/20 dark:from-gray-900/50 dark:to-gray-900/40 backdrop-blur-lg rounded-3xl shadow-xl max-w-4xl mx-auto mb-20"
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
              remarkPlugins={[remarkGfm]}
              components={{
                code(props) {
                  // Your existing code component logic
                  const { children, className, node, ...rest } = props;
                  const match = /language-(\w+)/.exec(className || "");
                  const value = String(children).replace(/\n$/, "");

                  // Check if this contains reference markers - updated to handle multiple references
                  // This will match both single references and comma-separated multiple references
                  if (value.includes("[ref:ref-")) {
                    // Extract all reference IDs from the value
                    const refIds = value.match(/ref-\d+/g) || [];

                    if (refIds.length > 0) {
                      return (
                        <Fragment key={`code-refs-${refIds.join("-")}`}>
                          {refIds.map((refId, idx) => {
                            const researchData = researchDataMap.get(refId);

                            return (
                              <Fragment key={`code-${refId}-${idx}`}>
                                {researchData ? (
                                  <ReferenceTooltip
                                    researchData={researchData}
                                    refId={refId}
                                  />
                                ) : (
                                  <span className="inline-flex items-center text-red-500 font-medium text-xs bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded-md">
                                    [Missing Ref: {refId}]
                                  </span>
                                )}
                                {idx < refIds.length - 1 && ", "}
                              </Fragment>
                            );
                          })}
                        </Fragment>
                      );
                    }
                  }

                  // Normal code block rendering
                  if (match) {
                    return (
                      <CodeBlock language={match[1]} value={value} {...props} />
                    );
                  } else {
                    // Inline code styling
                    return (
                      <code
                        {...rest}
                        className={`px-2 py-1 font-mono text-sm bg-gray-100 dark:bg-gray-800 text-pink-600 dark:text-pink-400 rounded-md border border-gray-200 dark:border-gray-700 ${className}`}
                      >
                        {children}
                      </code>
                    );
                  }
                },
                // Improved p component to handle references
                p(props) {
                  return (
                    <ProcessReferences
                      {...props}
                      children={props.children}
                      researchDataMap={researchDataMap}
                    />
                  );
                },
                // Add handlers for other common elements
                li(props) {
                  return (
                    <ProcessReferences
                      as="li"
                      {...props}
                      children={props.children}
                      researchDataMap={researchDataMap}
                    />
                  );
                },
                h1(props) {
                  return (
                    <ProcessReferences
                      as="h1"
                      {...props}
                      children={props.children}
                      researchDataMap={researchDataMap}
                    />
                  );
                },
                h2(props) {
                  return (
                    <ProcessReferences
                      as="h2"
                      {...props}
                      children={props.children}
                      researchDataMap={researchDataMap}
                    />
                  );
                },
                h3(props) {
                  return (
                    <ProcessReferences
                      as="h3"
                      {...props}
                      children={props.children}
                      researchDataMap={researchDataMap}
                    />
                  );
                },
                h4(props) {
                  return (
                    <ProcessReferences
                      as="h4"
                      {...props}
                      children={props.children}
                      researchDataMap={researchDataMap}
                    />
                  );
                },
                h5(props) {
                  return (
                    <ProcessReferences
                      as="h5"
                      {...props}
                      children={props.children}
                      researchDataMap={researchDataMap}
                    />
                  );
                },
                h6(props) {
                  return (
                    <ProcessReferences
                      as="h6"
                      {...props}
                      children={props.children}
                      researchDataMap={researchDataMap}
                    />
                  );
                },
                blockquote(props) {
                  return (
                    <ProcessReferences
                      as="blockquote"
                      {...props}
                      children={props.children}
                      researchDataMap={researchDataMap}
                    />
                  );
                },
                strong(props) {
                  return (
                    <ProcessReferences
                      as="strong"
                      {...props}
                      children={props.children}
                      researchDataMap={researchDataMap}
                    />
                  );
                },
                em(props) {
                  return (
                    <ProcessReferences
                      as="em"
                      {...props}
                      children={props.children}
                      researchDataMap={researchDataMap}
                    />
                  );
                },
                a(props) {
                  // For links, we need to be careful not to process the href attribute
                  return (
                    <ProcessReferences
                      as="a"
                      {...props}
                      children={props.children}
                      researchDataMap={researchDataMap}
                    />
                  );
                },
              }}
            >
              {postData.content || ""}
            </ReactMarkdown>
          </motion.div>

          {/* --- Modern References Display --- */}
          {postData.research_details &&
            postData.research_details.length > 0 && (
              <motion.div
                className="mt-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: isLoaded ? 1 : 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 flex items-center !no-prose">
                      <span className="inline-flex items-center justify-center w-7 h-7 mr-2 bg-blue-50 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-4 h-4"
                        >
                          <path d="M12 21l-8.2-8.2c-2-2-2-5.2 0-7.2s5.2-2 7.2 0L12 6.8l1-1c2-2 5.2-2 7.2 0s2 5.2 0 7.2L12 21z"></path>
                        </svg>
                      </span>
                      References
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 font-normal">
                        ({postData.research_details.length})
                      </span>
                    </h3>
                  </div>

                  {/* Grid layout for reference numbers */}
                  <div className="!no-prose">
                    <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 sm:gap-3">
                      {postData.research_details.map((detail, index) => {
                        const refId = `ref-${index}`;

                        return (
                          <div key={refId} className="relative group">
                            <div
                              className="w-full aspect-square flex items-center justify-center rounded-md 
                                      bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                                      text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-blue-50 
                                      dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 
                                      hover:border-blue-200 dark:hover:border-blue-800 transition-colors
                                      cursor-pointer"
                              aria-label={`Reference ${index + 1}`}
                            >
                              <ReferenceTooltip
                                researchData={detail.data}
                                refId={refId}
                                displayMode="grid"
                              />
                              {index + 1}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
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

      {/* Recommended Posts Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-8 md:px-16 py-8">
        {/* Pass current post ID to avoid recommending the same post */}
        <RecommendedPosts />
      </div>

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

      {/* Floating navigation buttons */}
      <div className="fixed bottom-8 right-8 flex flex-col space-y-3 z-20">
        <motion.button
          className="p-3 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Scroll to top"
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

        <Link href="/" passHref>
          <motion.button
            className="p-3 rounded-full bg-gray-700 text-white shadow-lg hover:bg-gray-800 transition-colors"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Go to home page"
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
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </motion.button>
        </Link>
      </div>
    </div>
  );
}
