import { getAiToolData, getAllAiToolIds } from "@/lib/posts";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Metadata } from "next";
import Link from "next/link";

type Props = {
  params: { id: string };
};

// Generate metadata for the page (title, description)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const toolData = await getAiToolData(params.id);
    return {
      title: toolData.title,
      description: toolData.description,
    };
  } catch (error) {
    // Handle cases where the tool might not be found during metadata generation
    return {
      title: "AI Tool Not Found",
      description: "The requested AI tool could not be found.",
    };
  }
}

// Generate static paths for all tool posts at build time
export async function generateStaticParams() {
  const paths = getAllAiToolIds(); // Uses the function we created earlier
  return paths; // Returns an array like [{ params: { id: 'tool-1' } }, ...]
}

// The main page component
export default async function AiToolPostPage({ params }: Props) {
  let toolData;
  try {
    toolData = await getAiToolData(params.id); // Fetch specific tool data
  } catch (error) {
    // If getAiToolData throws (e.g., file not found), trigger a 404
    console.error(`Error fetching tool data for ID: ${params.id}`, error);
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12">
      {/* Hero Section with Tool Info */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-indigo-700 dark:from-purple-800 dark:to-indigo-900">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10 bg-[url('/circuit-pattern.svg')] bg-repeat"></div>

        {/* Animated background shapes */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full filter blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-400/5 rounded-full filter blur-3xl opacity-40"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12">
            {/* Tool Image */}
            {toolData.image && (
              <div className="md:w-2/5 lg:w-1/3 flex-shrink-0">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src={toolData.image}
                    alt={toolData.title}
                    width={600}
                    height={400}
                    className="w-full h-auto object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                </div>
              </div>
            )}

            {/* Tool Info */}
            <div
              className={`${
                toolData.image ? "md:w-3/5 lg:w-2/3" : "w-full"
              } text-center md:text-left`}
            >
              <div className="inline-block px-4 py-1 bg-white/10 text-purple-200 rounded-full text-sm font-semibold tracking-wider mb-4">
                ✨ AI Tool of the Day ✨
              </div>

              <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
                {toolData.title}
              </h1>

              <div className="flex flex-wrap gap-3 justify-center md:justify-start mb-6">
                <span className="px-4 py-2 bg-white/10 backdrop-blur-sm text-purple-100 rounded-full text-sm font-medium">
                  Published: {toolData.date}
                </span>
                <span className="px-4 py-2 bg-purple-500/30 backdrop-blur-sm text-purple-100 rounded-full text-sm font-medium">
                  {toolData.category}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <article id="content" className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Content */}
          <div className="px-8 py-10">
            <div
              className="blog-content"
              dangerouslySetInnerHTML={{ __html: toolData.contentHtml }}
            />
          </div>

          {/* Action Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-8 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Ready to try {toolData.title}?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Explore this powerful AI tool and enhance your workflow.
                </p>
              </div>
              <div className="flex gap-4">
                <Link
                  href="/ai-tools"
                  className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300"
                >
                  Explore More Tools
                </Link>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Footer */}
      <footer className="mt-16 text-center">
        <Link
          href="/"
          className="inline-flex items-center px-5 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back to Home
        </Link>
      </footer>
    </div>
  );
}
