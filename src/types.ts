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

export interface ResearchDetailItem {
  point: string;
  data: GroundedResearchResult;
}

export interface Category {
  id: number;
  title: string;
  post_count: number;
}

export interface PostData {
  id: string;
  title: string;
  description?: string | null;
  created_at: string;
  image_url?: string | null;
  category: string | null;
  content?: string;
  tags?: string[] | null;
  views: number | null;
  author?: string | null;
  author_image?: string | null;
  read_time?: number | null;
  research_details?: Array<{
    point: string;
    data: GroundedResearchResult;
  }> | null;
}

export interface BlogClientProps {
  posts: PostData[];
  featuredPosts: PostData[];
  popularPosts: PostData[];
  trendingPosts: PostData[];
  categories: Category[];
}
