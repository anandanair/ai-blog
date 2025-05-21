import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import RecommendedPosts from '../RecommendedPosts'; // Adjust path
import { PostData } from '@/types'; // Adjust path

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    }
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode, href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

// Mock fetch
global.fetch = jest.fn();

const mockPosts: PostData[] = [
  { id: 'post-1', title: 'Tech Post 1', category: 'Technology', created_at: '2023-01-01T00:00:00Z', views: 100, description: 'd1', image_url: 'i1', read_time: 5 },
  { id: 'post-2', title: 'Travel Post 1', category: 'Travel', created_at: '2023-01-02T00:00:00Z', views: 150, description: 'd2', image_url: 'i2', read_time: 6 },
  { id: 'post-3', title: 'Tech Post 2', category: 'Technology', created_at: '2023-01-03T00:00:00Z', views: 200, description: 'd3', image_url: 'i3', read_time: 7 },
  { id: 'post-4', title: 'Food Post 1', category: 'Food', created_at: '2023-01-04T00:00:00Z', views: 120, description: 'd4', image_url: 'i4', read_time: 4 },
  { id: 'post-5', title: 'Tech Post 3 (Old)', category: 'Technology', created_at: '2022-12-01T00:00:00Z', views: 300, description: 'd5', image_url: 'i5', read_time: 8 },
  { id: 'post-6', title: 'Travel Post 2 (Recent)', category: 'Travel', created_at: '2023-01-05T00:00:00Z', views: 50, description: 'd6', image_url: 'i6', read_time: 3 },
];

describe('RecommendedPosts Component', () => {
  beforeEach(() => {
    localStorageMock.clear();
    (fetch as jest.Mock).mockClear();
  });

  it('should show loading state initially', () => {
    (fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {})); // Keep fetch pending
    render(<RecommendedPosts />);
    expect(screen.getByText(/Loading recommendations.../i)).toBeInTheDocument();
  });

  it('should show error state if fetch fails', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));
    render(<RecommendedPosts />);
    expect(await screen.findByText(/Could not load recommendations: Failed to fetch/i)).toBeInTheDocument();
  });

  it('should display "Explore More Posts" with generic posts if no history and posts are fetched', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPosts,
    });
    render(<RecommendedPosts />);
    expect(await screen.findByText(/Explore More Posts/i)).toBeInTheDocument();
    // It should show the first 3 posts from mockPosts as generic/fallback
    expect(screen.getByText(mockPosts[0].title)).toBeInTheDocument();
    expect(screen.getByText(mockPosts[1].title)).toBeInTheDocument();
    expect(screen.getByText(mockPosts[2].title)).toBeInTheDocument();
    expect(screen.queryByText(mockPosts[3].title)).not.toBeInTheDocument(); // Max 3 fallbacks
  });
  
  it('should display "No other posts to show" if no history and no posts fetched/empty array', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [], // No posts available
    });
    render(<RecommendedPosts />);
    expect(await screen.findByText(/Explore More Posts/i)).toBeInTheDocument(); // Section title still shows
    expect(await screen.findByText(/No other posts to show right now./i)).toBeInTheDocument();
  });


  describe('Recommendation Logic', () => {
    it('should recommend posts from categories in history, excluding viewed posts', async () => {
      // History: viewed post-1 (Tech), and interested in Travel category
      localStorageMock.setItem('readingHistory', JSON.stringify(['post-1', 'category:Travel']));
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPosts,
      });

      render(<RecommendedPosts />);

      await waitFor(() => {
        expect(screen.getByText(/Recommended For You/i)).toBeInTheDocument();
      });

      // Should recommend:
      // 1. 'Travel Post 1' (post-2) - because 'category:Travel' is in history
      // 2. 'Travel Post 2 (Recent)' (post-6) - also 'category:Travel'
      // It should NOT recommend 'Tech Post 1' (post-1) because it's in history.
      // It might recommend other Tech posts if category-based recs are not enough,
      // but 'category:Travel' should be prioritized.

      expect(screen.getByText('Travel Post 1')).toBeInTheDocument(); // post-2
      expect(screen.getByText('Travel Post 2 (Recent)')).toBeInTheDocument(); // post-6
      expect(screen.queryByText('Tech Post 1')).not.toBeInTheDocument(); // post-1 (viewed)
      
      // Depending on exact algo for filling up to 5:
      // It might pick other posts not in history and not in prioritized categories.
      // For example, post-4 (Food) or post-3 (Tech Post 2) could be fillers.
      // The current logic in RecommendedPosts seems to prioritize category, then viewed, then fallback.
      // Let's check if Tech Post 2 (post-3) is recommended as it's from a viewed post's category (post-1 was Tech)
      // but post-1 itself is excluded.
      // The current component logic for categoryBasedRecs uses `postCategories.some(cat => readingHistory.includes(`category:${cat}`));`
      // This means if "category:Technology" was in history, it would pick other tech posts.
      // If only "post-1" (which is Tech) is in history, the component *also* adds "category:Technology" to history.
      // So, other Tech posts *should* be recommended if not viewed.

      // Let's refine the history for this test to be very specific:
      localStorageMock.setItem('readingHistory', JSON.stringify(['post-1', 'category:Travel', 'category:Technology']));
      // Now, it should strongly prefer Travel and Technology posts not matching 'post-1'
      
      // Re-render with the new history for this specific test condition if needed, or ensure fetch is called again.
      // For simplicity, we assume the useEffect captures this history on its run.

      // Expected: post-2 (Travel), post-6 (Travel), post-3 (Tech), post-5 (Tech)
      // Sorted by some internal logic (e.g. order in mockPosts or creation_date if implemented)
      // The component doesn't explicitly sort by date beyond filtering.
      
      // Check for presence of these titles
      const recommendedTitles = Array.from(screen.queryAllByRole('link')).map(a => a.textContent);
      expect(recommendedTitles).toContain('Travel Post 1'); // post-2
      expect(recommendedTitles).toContain('Travel Post 2 (Recent)'); // post-6
      expect(recommendedTitles).toContain('Tech Post 2'); // post-3
      expect(recommendedTitles).toContain('Tech Post 3 (Old)'); // post-5
      
      // Should not include viewed post-1
      expect(recommendedTitles).not.toContain('Tech Post 1');
      // Ensure it doesn't exceed 5 recommendations
      expect(recommendedTitles.length).toBeLessThanOrEqual(5);
    });

    it('should recommend posts from viewed posts (same category) if category not explicitly in history', async () => {
      // History: viewed post-1 (Tech). The component internally adds 'category:Technology'.
      localStorageMock.setItem('readingHistory', JSON.stringify(['post-1']));
       (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPosts,
      });
      render(<RecommendedPosts />);
      await waitFor(() => {
        expect(screen.getByText(/Recommended For You/i)).toBeInTheDocument();
      });
      // Expected: Tech Post 2 (post-3) and Tech Post 3 (post-5) because post-1 is Tech
      // and these are other Tech posts not viewed.
      expect(screen.getByText('Tech Post 2')).toBeInTheDocument();
      expect(screen.getByText('Tech Post 3 (Old)')).toBeInTheDocument();
      expect(screen.queryByText('Tech Post 1')).not.toBeInTheDocument(); // Viewed
    });

    it('should fill with generic posts if specific recommendations are less than 5', async () => {
      // History: viewed post-1 (Tech), category:Travel. Only 2 Travel posts available.
      localStorageMock.setItem('readingHistory', JSON.stringify(['post-1', 'category:Travel', 'category:Technology']));
      const limitedMockPosts = [
        mockPosts[0], // Tech Post 1 (viewed)
        mockPosts[1], // Travel Post 1
        mockPosts[2], // Tech Post 2
        mockPosts[3], // Food Post 1 (generic fallback)
        mockPosts[5], // Travel Post 2
      ];
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => limitedMockPosts,
      });
      render(<RecommendedPosts />);
      await waitFor(() => {
        expect(screen.getByText(/Recommended For You/i)).toBeInTheDocument();
      });

      // Expected:
      // Travel Post 1 (post-2 from original mock)
      // Travel Post 2 (post-6 from original mock)
      // Tech Post 2 (post-3 from original mock)
      // Food Post 1 (post-4 from original mock) - as a fallback
      const recommendedTitles = Array.from(screen.queryAllByRole('link')).map(a => a.textContent);
      expect(recommendedTitles).toContain(limitedMockPosts[1].title); // Travel post
      expect(recommendedTitles).toContain(limitedMockPosts[4].title); // Another Travel post
      expect(recommendedTitles).toContain(limitedMockPosts[2].title); // Tech post (from category of viewed post-1)
      expect(recommendedTitles).toContain(limitedMockPosts[3].title); // Food post (fallback)
      expect(recommendedTitles).not.toContain(limitedMockPosts[0].title); // Viewed post
      expect(recommendedTitles.length).toBe(4); // Max 5, but only 4 available after filtering
    });
    
    it('should handle empty reading history by showing generic posts', async () => {
      localStorageMock.setItem('readingHistory', JSON.stringify([])); // Empty history
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPosts,
      });
      render(<RecommendedPosts />);
      await waitFor(() => {
         // The component shows "Explore More Posts" if no specific recommendations are made due to empty history
        expect(screen.getByText(/Explore More Posts/i)).toBeInTheDocument();
      });
      // Should show first 3 generic posts from mockPosts
      expect(screen.getByText(mockPosts[0].title)).toBeInTheDocument();
      expect(screen.getByText(mockPosts[1].title)).toBeInTheDocument();
      expect(screen.getByText(mockPosts[2].title)).toBeInTheDocument();
    });

    it('should correctly use Link href for Next.js', async () => {
        localStorageMock.setItem('readingHistory', JSON.stringify([]));
        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => [mockPosts[0]], // Recommend one post
        });
        render(<RecommendedPosts />);
        
        const link = await screen.findByText(mockPosts[0].title) as HTMLAnchorElement;
        expect(link.closest('a')).toHaveAttribute('href', `/posts/${mockPosts[0].id}`);
    });

  });
});
