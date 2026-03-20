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
  
  console.log('Supabase signUp response:', { 
    user: data.user, 
    session: data.session,
    confirmed_at: data.user?.confirmed_at,
    error 
  })
  
  if (error) {
    throw new Error(`Sign up failed: ${error.message}`)
  }
  
  // Check if we have a session - if yes, email confirmation is disabled
  if (data.session && data.user) {
    console.log('Session exists - user is authenticated immediately, creating profile')
    // No email confirmation needed - create profile immediately
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        email: data.user.email,
        onboarding_complete: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    
    if (profileError) {
      console.error('Profile creation failed:', profileError)
      // Continue anyway - profile will be created on onboarding completion
    } else {
      console.log('Profile created successfully')
    }
    
    revalidatePath('/login')
    return { success: true, needsConfirmation: false }
  } else if (data.user) {
    // No session = email confirmation is required
    console.log('No session - user needs email confirmation')
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
