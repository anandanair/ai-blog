export interface PostData {
  id: string;
  title: string;
  description?: string | null;
  created_at: string;
  image_url?: string | null;
  category?: string | null;
  tool_name?: string | null;
  contentHtml?: string;
}

export type AiTool = PostData; // Assuming AiTool has the same structure as PostData

export interface BlogClientProps {
  posts: PostData[];
  latestTool: AiTool | null;
}