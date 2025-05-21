import React from 'react';
import { render, act } from '@testing-library/react';
import PostClient from '../PostClient'; // Adjust path as necessary
import { PostData } from '@/types'; // Adjust path as necessary

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

// Mock next/link and next/image
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode, href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('next/image', () => {
  return ({ src, alt }: { src: string, alt: string }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} />;
  };
});


// Mock incrementPostViews
jest.mock('@/lib/posts.client', () => ({
  incrementPostViews: jest.fn(),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  ...jest.requireActual('framer-motion'), // Import and retain default exports
  motion: {
    // Mock specific motion components used, like motion.div, motion.header, etc.
    div: jest.fn(({ children, ...props }) => <div {...props}>{children}</div>),
    header: jest.fn(({ children, ...props }) => <header {...props}>{children}</header>),
    h1: jest.fn(({ children, ...props }) => <h1 {...props}>{children}</h1>),
    button: jest.fn(({ children, ...props }) => <button {...props}>{children}</button>),
    // Add any other motion components that are used in PostClient
  },
  useScroll: jest.fn(() => ({ scrollYProgress: { get: () => 0, onChange: () => {} } })), // Mock useScroll
  useTransform: jest.fn((value) => value), // Mock useTransform
}));


// Mock RecommendedPosts component
jest.mock('../RecommendedPosts', () => {
  return () => <div data-testid="recommended-posts">Recommended Posts</div>;
});


const mockPostData: PostData = {
  id: 'test-post-1',
  title: 'Test Post Title',
  created_at: new Date().toISOString(),
  content: '<p>Test content</p>',
  category: 'Technology',
  views: 100,
  // Add other required fields for PostData
  description: 'Test description',
  image_url: '/test-image.jpg',
  tags: ['test', 'jest'],
  author: 'Test Author',
  author_image: '/author.jpg',
  read_time: 5,
};

describe.skip('PostClient Reading History', () => { // Skipped
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks(); // Clear all mocks before each test
  });

  it('should add post ID and category to localStorage on mount', () => {
    render(<PostClient postData={mockPostData} />);

    const history = JSON.parse(localStorageMock.getItem('readingHistory') || '[]');
    expect(history).toContain('test-post-1');
    expect(history).toContain('category:Technology');
  });

  it('should not add duplicate post IDs or categories', () => {
    // Pre-populate history
    const initialHistory = ['test-post-1', 'category:Technology'];
    localStorageMock.setItem('readingHistory', JSON.stringify(initialHistory));

    render(<PostClient postData={mockPostData} />);

    const history = JSON.parse(localStorageMock.getItem('readingHistory') || '[]');
    // Check that items are still there but not duplicated
    expect(history.filter((item: string) => item === 'test-post-1').length).toBe(1);
    expect(history.filter((item: string) => item === 'category:Technology').length).toBe(1);
    expect(history.length).toBe(2); // Should remain 2 items
  });

  it('should limit history size to MAX_HISTORY_ITEMS (20)', () => {
    const MAX_HISTORY_ITEMS = 20;
    // Pre-fill history with more than MAX_HISTORY_ITEMS unique items
    const oldHistoryItems: string[] = [];
    for (let i = 0; i < MAX_HISTORY_ITEMS; i++) {
      oldHistoryItems.push(`old-post-${i}`);
    }
    localStorageMock.setItem('readingHistory', JSON.stringify(oldHistoryItems));

    // Render with a new post
    const newPostData: PostData = { ...mockPostData, id: 'new-post-1', category: 'NewCat' };
    render(<PostClient postData={newPostData} />);
    
    const history = JSON.parse(localStorageMock.getItem('readingHistory') || '[]');
    
    expect(history.length).toBe(MAX_HISTORY_ITEMS);
    expect(history).toContain('new-post-1'); // New post ID should be present
    expect(history).toContain('category:NewCat'); // New category should be present
    expect(history).not.toContain('old-post-0'); // The oldest item should be evicted
  });

  it('should handle posts with no category', () => {
    const postWithoutCategory: PostData = { ...mockPostData, id: 'no-cat-post', category: null };
    render(<PostClient postData={postWithoutCategory} />);

    const history = JSON.parse(localStorageMock.getItem('readingHistory') || '[]');
    expect(history).toContain('no-cat-post');
    // Ensure no "category:null" or similar is added
    expect(history.find((item: string) => item.startsWith('category:'))).toBeUndefined();
  });

   it('should correctly manage history when viewing multiple posts', () => {
    // View post 1
    render(<PostClient postData={mockPostData} />);
    let history = JSON.parse(localStorageMock.getItem('readingHistory') || '[]');
    expect(history).toEqual(['test-post-1', 'category:Technology']);

    // View post 2 (different id, same category)
    const postData2: PostData = { ...mockPostData, id: 'test-post-2', category: 'Technology' };
    render(<PostClient postData={postData2} />); // This will re-render with new props in a test context
                                               // or you might need a wrapper if testing navigation
    // In a real app, navigation would unmount and remount PostClient or update its props.
    // Here, we simulate prop update by calling render again.
    // However, useEffect in PostClient depends on postData.id & postData.category.
    // If `render` doesn't trigger a "prop change" in the way a real app flow does,
    // we need to manually call the effect's logic or use `rerender` from RTL.
    // For simplicity, let's assume the effect runs on prop change.
    // To better simulate, we should use `rerender` if available or structure the test differently.

    // Let's clear and set for the second post as if it's a new load for clarity here
    // This is a simplification. A more complex test could use RTL's rerender.
    localStorageMock.clear();
    const initialHistoryForPost1 = ['test-post-1', 'category:Technology'];
    localStorageMock.setItem('readingHistory', JSON.stringify(initialHistoryForPost1));

    act(() => {
      // This simulates the component receiving new props after being mounted
      // The useEffect in PostClient should run again due to changed postData.id
       const { rerender } = render(<PostClient postData={mockPostData} />);
       rerender(<PostClient postData={postData2} />);
    });
    
    history = JSON.parse(localStorageMock.getItem('readingHistory') || '[]');
    expect(history).toContain('test-post-1'); // From initial mock setup for this test case
    expect(history).toContain('test-post-2'); // Newly added
    expect(history).toContain('category:Technology'); // Category (should only be one instance)
    expect(history.filter((item: string) => item === 'category:Technology').length).toBe(1);
    expect(history.length).toBe(3); // post1, post2, category:Technology
  });
});

// Basic render test to ensure the component doesn't crash with mock data
describe.skip('PostClient Rendering', () => { // Skipped
  it('renders without crashing', () => {
    render(<PostClient postData={mockPostData} />);
    // Check for some element that should be present
    // Note: Text content might be tricky if it's inside markdown.
    // Querying by test IDs or roles is more robust.
    // For now, just ensuring it doesn't throw.
  });
});
