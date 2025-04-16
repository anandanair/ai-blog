"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import Image from "next/image";

// Define the Post type based on getSortedPostsData return type
type Post = {
  id: string;
  date: string;
  title: string;
  description: string;
  image?: string;
};

// Define the AI Tool type
type AiTool = {
  id: string;
  date: string;
  title: string;
  description: string;
  category: string; // Added category
  image?: string;
};

interface BlogClientProps {
  posts: Post[];
  latestTool: AiTool | null; // Add the latest tool prop (can be null if none)
}

export default function BlogClient({ posts, latestTool }: BlogClientProps) {
  // Destructure latestTool
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPosts, setFilteredPosts] = useState(posts);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.8]);
  const y = useTransform(scrollYProgress, [0, 1], [0, 100]);
  
  // Add dark mode toggle state
  const [darkMode, setDarkMode] = useState(false);

  // Mock categories - you can replace with real categories from your posts
  const categories = [
    "All",
    "Machine Learning",
    "Neural Networks",
    "Computer Vision",
    "NLP",
  ];

  useEffect(() => {
    const filtered = posts.filter(
      (post) =>
        (selectedCategory === "All" || post.title.includes(selectedCategory)) &&
        (post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    // If 'AI Tool of the Day' is selected, maybe only show the latestTool?
    // This part needs refinement based on how you want categories to work with tools vs posts.
    // For now, it just includes posts matching the title search.
    setFilteredPosts(filtered);
  }, [searchTerm, selectedCategory, posts]); // Removed latestTool from dependency array for now

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''} bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800`}>
      {/* Dark Mode Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg"
          aria-label="Toggle dark mode"
        >
          {darkMode ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </motion.button>
      </div>

      {/* Hero Section with Parallax Effect - Updated for modern look */}
      <section ref={heroRef} className="relative h-[80vh] overflow-hidden">
        <motion.div
          style={{ opacity, scale, y }}
          className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-800 dark:to-purple-800"
        >
          <div className="absolute inset-0 opacity-20 bg-[url('/hero-pattern.svg')] bg-repeat mix-blend-overlay"></div>

          {/* Animated background elements - Modernized with glass morphism */}
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 12 }).map((_, i) => {
              const seed = i / 12;
              const size = 80 + (seed * 150);
              const left = `${(i % 4) * 25}%`;
              const top = `${Math.floor(i / 4) * 33}%`;
              const yOffset = (i % 3) * 40 - 40;
              const duration = 15 + (i % 5) * 4;
              
              return (
                <motion.div
                  key={i}
                  className="absolute rounded-full bg-white/10 backdrop-blur-md border border-white/20"
                  style={{
                    width: size,
                    height: size,
                    left,
                    top,
                  }}
                  animate={{
                    y: [0, yOffset],
                    opacity: [0.1, 0.3, 0.1],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                  }}
                />
              );
            })}
          </div>
        </motion.div>

        <div className="relative h-full flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
            className="mb-6"
          >
            <div className="inline-block text-6xl bg-white/20 dark:bg-gray-800/30 backdrop-blur-lg rounded-full p-6 shadow-lg border border-white/30 dark:border-gray-700/30">
              🧠
            </div>
          </motion.div>

          {/* Updated typography for modern look */}
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-4xl md:text-7xl font-extrabold text-white mb-4 tracking-tight"
          >
            AI-Powered{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-500">
              Insights
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-xl text-white/90 max-w-2xl font-light"
          >
            Exploring the cutting edge of artificial intelligence and its impact
            on our world
          </motion.p>

          {/* Modernized Search Bar with animation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-10 w-full max-w-md"
          >
            <div className="relative group">
              <input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-6 py-4 rounded-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg bg-white/90 backdrop-blur-sm transition-all duration-300 group-hover:shadow-xl pl-12"
              />
              <div className="absolute left-4 top-4 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </motion.div>

          {/* Scroll indicator - Updated for better visibility */}
          <motion.div
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="text-white bg-white/10 backdrop-blur-sm p-3 rounded-full">
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
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </div>
          </motion.div>
        </div>
      </section>

      {/* AI Tool of the Day Section - Updated with glass morphism */}
      {latestTool && (
        <section className="py-16 md:py-24 bg-gradient-to-r from-purple-600 to-indigo-700 dark:from-purple-800 dark:to-indigo-900 overflow-hidden relative">
          <div className="absolute inset-0 opacity-10 bg-[url('/circuit-pattern.svg')] bg-repeat"></div>
          {/* Animated background shapes */}
          <motion.div
            className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full filter blur-3xl opacity-50"
            animate={{ x: [-100, 100, -100], y: [-50, 50, -50] }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-0 right-0 w-80 h-80 bg-blue-400/5 rounded-full filter blur-3xl opacity-40"
            animate={{ x: [100, -100, 100], y: [50, -50, 50] }}
            transition={{
              duration: 25,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.8, type: "spring", stiffness: 50 }}
              className="text-center mb-12"
            >
              <span className="inline-block px-4 py-1 bg-white/10 backdrop-blur-sm text-purple-200 rounded-full text-sm font-semibold tracking-wider mb-4 border border-white/20">
                ✨ AI Tool of the Day ✨
              </span>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                Featured Tool: {latestTool.title}
              </h2>
              <p className="mt-4 text-lg text-purple-200 max-w-3xl mx-auto">
                {latestTool.description}
              </p>
            </motion.div>

            {/* Updated card with glass morphism */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden p-6 md:p-8 border border-white/20"
            >
              <div className="md:flex md:items-center md:space-x-8">
                {latestTool.image && (
                  <motion.div
                    whileHover={{ scale: 1.05, rotate: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="md:w-1/3 mb-6 md:mb-0"
                  >
                    <Image
                      src={latestTool.image}
                      alt={latestTool.title}
                      width={400}
                      height={300}
                      className="rounded-lg object-cover shadow-lg w-full border border-white/20"
                    />
                  </motion.div>
                )}
                <div className={latestTool.image ? "md:w-2/3" : "w-full"}>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-purple-300 font-medium">
                      {latestTool.date}
                    </span>
                    <span className="px-3 py-1 bg-purple-500/50 backdrop-blur-sm text-white text-xs font-bold rounded-full border border-purple-400/30">
                      {latestTool.category}
                    </span>
                  </div>
                  {/* You might want to fetch and display the actual contentHtml here */}
                  {/* For now, just showing description again */}
                  <p className="text-purple-100 mb-6">
                    {latestTool.description}{" "}
                    {/* Placeholder - Ideally show snippet of contentHtml */}
                  </p>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    {/* Use motion component directly with Link */}
                                      <Link href={`/posts/ai-tools-of-the-day/${latestTool.id}`}>
                                        <motion.div
                                          whileHover={{
                                            scale: 1.05,
                                            boxShadow: "0px 10px 20px rgba(0,0,0,0.2)",
                                          }}
                                          whileTap={{ scale: 0.95 }}
                                          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-500 to-orange-500 text-white font-semibold rounded-lg shadow-md hover:from-pink-600 hover:to-orange-600 transition-all duration-300 cursor-pointer"
                                        >
                                          Learn More
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 ml-2"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M17 8l4 4m0 0l-4 4m4-4H3"
                                            />
                                          </svg>
                                        </motion.div>
                                      </Link>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Category Filter - Updated with sticky animation */}
      <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-md sticky top-0 z-20 shadow-md transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex overflow-x-auto pb-2 scrollbar-hide space-x-2">
            {categories.map((category) => (
              <motion.button
                key={category}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100/80 backdrop-blur-sm dark:bg-gray-700/80 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600"
                }`}
              >
                {category}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content - Updated card design */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex-grow">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Latest Articles
              <div className="h-1 w-20 bg-blue-600 mt-2 rounded-full"></div>
            </h2>
          </div>

          <div className="flex items-center space-x-4">
             <div className="text-gray-500 dark:text-gray-400 text-sm md:text-base">
               {filteredPosts.length} article
               {filteredPosts.length !== 1 ? "s" : ""}
             </div>
             <Link href="/ai-tools">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg shadow-md transition-colors cursor-pointer"
                >
                  View AI Tools Archive
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </motion.div>
             </Link>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {filteredPosts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20"
            >
              <div className="inline-block text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">
                No articles found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Try adjusting your search or category filter
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("All");
                }}
                className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
              >
                Reset filters
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
            >
              {filteredPosts.map((post) => (
                <motion.div
                  key={post.id}
                  variants={item}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group border border-gray-200 dark:border-gray-700"
                >
                  <Link href={`/posts/${post.id}`} className="block h-full">
                    <div className="h-56 bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
                      {post.image ? (
                        <Image
                          src={post.image}
                          alt={post.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-6xl bg-gradient-to-br from-blue-500 to-purple-600">
                          🧠
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <div className="p-6">
                      <div className="inline-block px-3 py-1 text-xs font-semibold text-white bg-blue-600 rounded-full mb-3">
                        {post.date}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                        {post.description}
                      </p>
                      <div className="flex items-center text-blue-600 dark:text-blue-400 font-medium group-hover:translate-x-2 transition-transform duration-300">
                        Read more
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
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer with scroll to top button - Updated with modern design */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">AI Blog</div>
              <p className="text-gray-400 mt-2">
                Exploring the future of technology
              </p>
            </div>

            <div className="flex space-x-4">
              {/* Social media icons */}
              <motion.a 
                href="#" 
                whileHover={{ scale: 1.1, y: -5 }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </motion.a>
              <motion.a 
                href="#" 
                whileHover={{ scale: 1.1, y: -5 }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </motion.a>
            </div>

            <motion.button
              whileHover={{ scale: 1.1, y: -5 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-3 rounded-full shadow-lg transition-colors"
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
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            © {new Date().getFullYear()} AI Blog. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
