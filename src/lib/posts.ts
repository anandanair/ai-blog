import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import { readdirSync, readFileSync } from "fs";

const postsDirectory = path.join(process.cwd(), "posts");

export function getSortedPostsData() {
  // Get all files in the posts directory
  const fileNames = readdirSync(postsDirectory);

  // Filter only markdown files and process them
  const allPostsData = fileNames
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => {
      const id = fileName.replace(/\.md$/, "");
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = readFileSync(fullPath, "utf8");
      const matterResult = matter(fileContents);
      return {
        id,
        ...(matterResult.data as {
          date: string;
          title: string;
          description: string;
          image?: string;
        }),
      };
    });

  return allPostsData.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getAllPostIds() {
  const fileNames = readdirSync(postsDirectory);
  return fileNames
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => ({
      params: {
        id: fileName.replace(/\.md$/, ""),
      },
    }));
}

export async function getPostData(id: string) {
  const fullPath = path.join(postsDirectory, `${id}.md`);
  const fileContents = readFileSync(fullPath, "utf8");
  const matterResult = matter(fileContents);
  const processedContent = await remark()
    .use(html)
    .process(matterResult.content);
  const contentHtml = processedContent.toString();
  return {
    id,
    contentHtml,
    ...(matterResult.data as {
      date: string;
      title: string;
      description: string;
      image?: string; // Make image optional
    }),
  };
}
