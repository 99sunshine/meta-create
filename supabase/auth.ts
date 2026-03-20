'use server'

import { createClient } from './utils/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

/**
 * Check if an email already exists in the system
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  const supabase = await createClient()
  
  // Check if email exists in profiles table
  const { data, error } = await supabase
    .from('profiles')
    .select('email')
    .eq('email', email)
    .maybeSingle()
  
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Email check failed: ${error.message}`)
  }
  
  return data !== null
}

/**
 * Sign up with email and password
 */
export async function signUpWithPassword(email: string, password: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })
  
  if (error) {
    throw new Error(`Sign up failed: ${error.message}`)
  }
  
  if (data.user && !data.user.confirmed_at) {
    return { success: true, needsConfirmation: true }
  }
  
  revalidatePath('/login')
  return { success: true, needsConfirmation: false }
}

/**
 * Sign in with email and password
 */
export async function signInWithPassword(email: string, password: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) {
    throw new Error(`Sign in failed: ${error.message}`)
  }
  
  revalidatePath('/', 'layout')
  return { success: true, user: data.user }
}

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
