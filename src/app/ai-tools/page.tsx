import { getSortedAiToolsData } from "@/lib/posts";
import Link from "next/link";
import Image from "next/image";
import { Metadata } from 'next';

// Optional: Add metadata for the page
export const metadata: Metadata = {
  title: 'AI Tools Archive | AI Blog',
  description: 'Browse all the AI tools featured as Tool of the Day.',
};

// Define the AI Tool type based on getSortedAiToolsData return type
type AiTool = {
  id: string;
  date: string;
  title: string;
  description: string;
  category: string;
  image?: string;
};

export default function AiToolsArchivePage() {
  const allToolsData: AiTool[] = getSortedAiToolsData(); // Fetch all sorted tool data

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-purple-600 to-indigo-700 dark:from-purple-800 dark:to-indigo-900 py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('/circuit-pattern.svg')] bg-repeat"></div>
        
        {/* Animated background shapes */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full filter blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-400/5 rounded-full filter blur-3xl opacity-40"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <header className="text-center">
            <span className="inline-block px-4 py-1 bg-white/10 text-purple-200 rounded-full text-sm font-semibold tracking-wider mb-4">
              ✨ AI Tool Collection ✨
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
              AI Tools Archive
            </h1>
            <p className="text-xl text-purple-200 max-w-3xl mx-auto">
              Explore all the cutting-edge AI tools previously featured as our "Tool of the Day".
            </p>
          </header>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 -mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 mb-12">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                All Featured Tools
                <div className="h-1 w-16 bg-purple-600 mt-2 rounded-full"></div>
              </h2>
            </div>
            <div className="text-gray-500 dark:text-gray-400">
              {allToolsData.length} tool{allToolsData.length !== 1 ? 's' : ''} available
            </div>
          </div>

          {allToolsData.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
              <div className="inline-block text-6xl mb-4">🔍</div>
              <p className="text-xl text-gray-500 dark:text-gray-400">
                No AI tools have been featured yet. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {allToolsData.map((tool) => (
                <Link
                  key={tool.id}
                  href={`/posts/ai-tools-of-the-day/${tool.id}`}
                  className="group"
                >
                  <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-600 h-full transform hover:-translate-y-2">
                    <div className="relative h-56 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      {tool.image ? (
                        <Image
                          src={tool.image}
                          alt={tool.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-gradient-to-br from-purple-500 to-indigo-600 dark:from-purple-700 dark:to-indigo-800">
                          <span className="text-white text-5xl font-bold">
                            {tool.title.substring(0, 1)}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute top-3 right-3 px-3 py-1 bg-purple-600/90 text-white text-xs font-bold rounded-full backdrop-blur-sm shadow-lg">
                        {tool.category}
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                          {tool.date}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {tool.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                        {tool.description}
                      </p>
                      <div className="flex items-center text-purple-600 dark:text-purple-400 font-medium group-hover:translate-x-2 transition-transform duration-300">
                        Learn more
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
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
        
        {/* Back to home link */}
        <div className="text-center">
          <Link 
            href="/" 
            className="inline-flex items-center px-5 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}