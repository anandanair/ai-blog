import Link from "next/link";

export default function NewsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">Latest News</h1>
      
      <div className="text-center py-12">
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Coming soon! Check back later for the latest news.
        </p>
        <Link 
          href="/"
          className="mt-6 inline-block px-6 py-3 rounded-full bg-purple-600 hover:bg-purple-700 text-white transition-colors duration-200"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}