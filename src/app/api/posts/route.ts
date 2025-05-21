import { NextResponse } from 'next/server';
import { getAllPosts } from '@/lib/posts'; // Adjust path as necessary

export async function GET() {
  try {
    const posts = await getAllPosts();
    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching all posts for API:', error);
    return NextResponse.json({ message: 'Error fetching posts', error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
