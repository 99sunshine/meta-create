'use server'

import { createClient } from './utils/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

/**
 * Send magic link to user's email for passwordless authentication
 */
export async function sendMagicLink(email: string) {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })
  
  if (error) {
    throw new Error(`Magic link failed: ${error.message}`)
  }
  
  revalidatePath('/login')
  return { success: true }
}

/**
 * Sign out current user and clear session
 */
export async function signOutUser() {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    throw new Error(`Sign out failed: ${error.message}`)
  }
  
  revalidatePath('/', 'layout')
  redirect('/login')
}

/**
 * Get current session (server-side)
 */
export async function getCurrentSession() {
  const supabase = await createClient()
  
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error('Session fetch error:', error)
    return null
  }
  
  return session
}

/**
 * Get current authenticated user (server-side)
 */
export async function getCurrentUser() {
  const session = await getCurrentSession()
  return session?.user ?? null
}

/**
 * Get user ID from current session
 */
export async function getCurrentUserId() {
  const user = await getCurrentUser()
  return user?.id ?? null
}
