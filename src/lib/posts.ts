import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import { readdirSync, readFileSync, statSync } from "fs"; // Added statSync

const postsDirectory = path.join(process.cwd(), "posts");
const aiToolsDirectory = path.join(postsDirectory, "ai-tools-of-the-day"); // Path for AI tools

// --- General Posts Functions ---

// Helper function to check if a path is a file
const isFile = (source: string) => statSync(source).isFile();

// Helper function to get files from a directory (non-recursive)
const getFilesInDirectory = (source: string) => {
  if (!readdirSync(source, { withFileTypes: true })) return []; // Handle case where directory might not exist yet
  return readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isFile()) // Ensure it's a file, not a directory
    .map(dirent => dirent.name);
}

export function getSortedPostsData() {
  // Get only files directly in the posts directory
  const fileNames = getFilesInDirectory(postsDirectory);

  const allPostsData = fileNames
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => {
      const id = fileName.replace(/\.md$/, "");
      const fullPath = path.join(postsDirectory, fileName); // Read from main posts dir
      const fileContents = readFileSync(fullPath, "utf8");
      const matterResult = matter(fileContents);
      return {
        id,
        ...(matterResult.data as {
          date: string;
          title: string;
          description: string;
          image?: string;
          // General posts might not have a category, or you could add one
        }),
      };
    });

  return allPostsData.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getAllPostIds() {
  // Get only files directly in the posts directory
  const fileNames = getFilesInDirectory(postsDirectory);
  return fileNames
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => ({
      params: {
        id: fileName.replace(/\.md$/, ""),
      },
    }));
}

export async function getPostData(id: string) {
  const fullPath = path.join(postsDirectory, `${id}.md`); // Read from main posts dir
  const fileContents = readFileSync(fullPath, "utf8");
  const matterResult = matter(fileContents);

  // Use remark with html option to disable sanitization
  const processedContent = await remark()
    .use(html, { sanitize: false })
    .process(matterResult.content);

  const contentHtml = processedContent.toString();

  return {
    id,
    contentHtml,
    ...(matterResult.data as {
      date: string;
      title: string;
      description: string;
      image?: string;
    }),
  };
}


// --- AI Tool of the Day Functions ---

export function getSortedAiToolsData() {
  // Get files from the ai-tools-of-the-day subdirectory
  const fileNames = getFilesInDirectory(aiToolsDirectory);

  const allToolsData = fileNames
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => {
      const id = fileName.replace(/\.md$/, "");
      // Construct the full path to the tool's markdown file
      const fullPath = path.join(aiToolsDirectory, fileName);
      const fileContents = readFileSync(fullPath, "utf8");
      const matterResult = matter(fileContents);
      return {
        id,
        ...(matterResult.data as {
          date: string;
          title: string;
          description: string;
          category: string; // Expecting category for tools
          image?: string;
        }),
      };
    });

  // Sort tools by date, most recent first
  return allToolsData.sort((a, b) => (a.date < b.date ? 1 : -1));
}

/**
 * Gets the data for the most recent AI Tool post.
 */
export function getLatestAiToolData() {
    const sortedTools = getSortedAiToolsData();
    return sortedTools.length > 0 ? sortedTools[0] : null; // Return the first item or null if empty
}


export function getAllAiToolIds() {
  // Get files from the ai-tools-of-the-day subdirectory
  const fileNames = getFilesInDirectory(aiToolsDirectory);
  return fileNames
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => ({
      params: {
        // The id should probably reflect the subdirectory structure if needed for routing,
        // but for simplicity here we just use the filename base.
        // Adjust if your routing needs '/ai-tools-of-the-day/tool-id'
        id: fileName.replace(/\.md$/, ""),
      },
    }));
}

export async function getAiToolData(id: string) {
  // Construct the full path to the specific tool's markdown file
  const fullPath = path.join(aiToolsDirectory, `${id}.md`);
  const fileContents = readFileSync(fullPath, "utf8");
  const matterResult = matter(fileContents);

  // Process markdown content to HTML
  const processedContent = await remark()
    .use(html, { sanitize: false })
    .process(matterResult.content);
  const contentHtml = processedContent.toString();

  return {
    id,
    contentHtml,
    ...(matterResult.data as {
      date: string;
      title: string;
      description: string;
      category: string; // Expecting category
      image?: string;
    }),
  };
}
