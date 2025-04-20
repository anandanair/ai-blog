export interface SourceInfo {
  uri?: string;
  title?: string;
}
export interface GroundedResearchResult {
  groundedText: string;
  sources: SourceInfo[];
  searchQueries?: string[];
  renderedContent?: string;
}

export interface PostData {
  id: string;
  title: string;
  description?: string | null;
  created_at: string;
  image_url?: string | null;
  category?: string | null;
  tool_name?: string | null;
  content?: string;
  author?: string | null;
  author_image?: string | null;
  read_time?: number | null;
  research_details?: Array<{
    point: string;
    data: GroundedResearchResult;
  }> | null;
}

export type AiTool = PostData; // Assuming AiTool has the same structure as PostData

export interface BlogClientProps {
  posts: PostData[];
  latestTool: AiTool | null;
}
