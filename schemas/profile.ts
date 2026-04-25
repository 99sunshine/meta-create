import { z } from 'zod'

/**
 * Profile validation schemas
 * These match the database check constraints exactly
 * Last checked: 2026-03-08
 */

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
  collab_style: z.string().nullable().optional(), // No DB constraint - free text
  availability: z.enum(['weekends', 'evenings', 'flexible', 'full-time']).nullable().optional(),
  // Track is a free-form text in DB (see migrations/mvp_p0_schema.sql).
  // UI provides a set of track chips, but we don't restrict to a fixed enum.
  hackathon_track: z.string().max(100).nullable().optional(),
  languages: z.array(z.string()).nullable().optional(),
  major: z.string().max(100).nullable().optional(),
  education_level: z.enum(['Undergrad', 'Master', 'PhD', 'Professional']).nullable().optional(),
  locale: z.enum(['en', 'zh']).default('en'),
  subscription_tier: z.enum(['free', 'premium']).default('free'),
  onboarding_complete: z.boolean().default(false),
  created_at: z.string(),
  updated_at: z.string(),
})

// Profile update schema (partial, exclude immutable fields).
// Fields with .default() in profileSchema are explicitly re-declared as plain .optional()
// so that missing keys parse as undefined (not filled with default values), preventing
// accidental overwrites of onboarding_complete / locale / subscription_tier on partial updates.
export const profileUpdateSchema = profileSchema
  .omit({
    id: true,
    email: true,
    created_at: true,
    updated_at: true,
    onboarding_complete: true,
    locale: true,
    subscription_tier: true,
  })
  .partial()
  .extend({
    onboarding_complete: z.boolean().optional(),
    locale: z.enum(['en', 'zh']).optional(),
    subscription_tier: z.enum(['free', 'premium']).optional(),
  })

// Initial profile creation (after magic link signup)
export const profileCreateSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(['Visionary', 'Builder', 'Strategist', 'Connector']),
  locale: z.enum(['en', 'zh']).default('en'),
  subscription_tier: z.enum(['free', 'premium']).default('free'),
  onboarding_complete: z.boolean().default(false),
})
