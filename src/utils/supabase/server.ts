import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

// --- New Function using the SERVICE ROLE key ---
export async function createSupabaseServiceRoleClient() {
  // Removed async
  const cookieStore = await cookies(); // cookies() is synchronous

  // Ensure Service Role Key is defined
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("Missing environment variable: SUPABASE_SERVICE_ROLE_KEY");
  }

  // Ensure Supabase URL is defined
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_URL");
  }

  return createServerClient(
    supabaseUrl,
    serviceRoleKey, // Use the Service Role Key
    {
      cookies: {
        // Provide cookie handlers required by @supabase/ssr,
        // even if not strictly used for auth state with service role.
        getAll() {
          return cookieStore.getAll();
        },
        // setAll is likely not needed for service role, but include if required by your setup/library version
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore errors in read-only environments
          }
        },
      },
    }
  );
}
