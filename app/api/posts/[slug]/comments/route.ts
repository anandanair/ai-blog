import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// GET handler to fetch comments for a post
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const postSlug = params.slug;

  if (!postSlug) {
    return NextResponse.json({ error: 'Post slug is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_slug', postSlug)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error('Unexpected error fetching comments:', err);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// POST handler to submit a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const postSlug = params.slug;

  if (!postSlug) {
    return NextResponse.json({ error: 'Post slug is required' }, { status: 400 });
  }

  try {
    const { author_name, content, parent_comment_id } = await request.json();

    if (!author_name || !content) {
      return NextResponse.json({ error: 'Author name and content are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('comments')
      .insert([{ post_slug: postSlug, author_name, content, parent_comment_id }])
      .select()
      .single(); // .single() to get the inserted row back

    if (error) {
      console.error('Error submitting comment:', error);
      // Check for specific errors, e.g., foreign key violation if post_slug doesn't exist
      if (error.code === '23503') { // foreign_key_violation
        return NextResponse.json({ error: `Invalid post_slug: ${postSlug}. This post may not exist.` }, { status: 400 });
      }
      return NextResponse.json({ error: 'Failed to submit comment' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error('Unexpected error submitting comment:', err);
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
