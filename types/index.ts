export interface ParsedPostData {
  toolName: string | null;
  title: string;
  description: string;
  imageDescription: string;
  content: string;
  readTime: number;
  tags: string[];
  slug: string;
}

export interface PostData {
  title: string;
  slug: string;
  description: string;
  content: string;
  category: string | null;
  image_url: string | null;
  tool_name: string | null;
  read_time: number;
  tags: string[];
}