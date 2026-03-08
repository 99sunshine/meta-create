import { z } from 'zod'

// Basic profile fields validation
export const profileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1, 'Name is required').max(100),
  avatar_url: z.string().url().nullable().optional(),
  city: z.string().min(1).max(100).nullable().optional(),
  school: z.string().min(1).max(200).nullable().optional(),
  role: z.enum(['Visionary', 'Builder', 'Strategist', 'Connector']),
  skills: z.array(z.string()).nullable().optional(),
  interests: z.array(z.string()).nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  manifesto: z.string().max(500).nullable().optional(),
  collab_style: z.enum(['Sprint-lover', 'Marathon-runner', 'Flexible']).nullable().optional(),
  availability: z.enum(['Available', 'Exploring', 'Unavailable']).nullable().optional(),
  hackathon_track: z.enum(['Engineering', 'Society', 'Aesthetics', 'Open']).nullable().optional(),
  languages: z.array(z.string()).nullable().optional(),
  major: z.string().max(100).nullable().optional(),
  education_level: z.string().max(50).nullable().optional(),
  locale: z.enum(['en', 'zh']).default('en'),
  subscription_tier: z.enum(['free', 'pro', 'team']).default('free'),
  onboarding_complete: z.boolean().default(false),
  created_at: z.string(),
  updated_at: z.string(),
})

// Profile update schema (partial, exclude immutable fields)
export const profileUpdateSchema = profileSchema
  .omit({ id: true, email: true, created_at: true })
  .partial()

// Initial profile creation (after magic link signup)
export const profileCreateSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(['Visionary', 'Builder', 'Strategist', 'Connector']),
  locale: z.enum(['en', 'zh']).default('en'),
  subscription_tier: z.enum(['free', 'pro', 'team']).default('free'),
  onboarding_complete: z.boolean().default(false),
})
