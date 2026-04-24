import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Database } from "@/types/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

/**
 * Create a Supabase client for Route Handlers
 * This is different from the server client used in Server Components
 * because it needs to set cookies on the NextResponse object
 */
export const createRouteClient = async (response: NextResponse) => {
  const cookieStore = await cookies();
  
  return createServerClient<Database>(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
              response.cookies.set(name, value, options)
            })
          } catch (error) {
            console.error('Failed to set auth cookies in route handler:', error)
          }
        },
      },
    },
  );
};
