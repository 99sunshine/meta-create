import { z } from 'zod'

/**
 * Team creation validation schema
 * Based on PRD Section 7.5 requirements
 */

export const teamCreateSchema = z.object({
  name: z.string()
    .min(2, 'Team name must be at least 2 characters')
    .max(100, 'Team name must be less than 100 characters'),

  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .nullable()
    .optional(),

  // Allow any string for category (tracks vary by hackathon)
  category: z.string().min(1, 'Please select a track').default('Open Track'),

  looking_for_roles: z.array(z.string()).nullable().optional(),

  event_id: z.string().uuid().nullable().optional(),

  external_chat_link: z.string()
    .nullable()
    .optional()
    .or(z.literal('')),

  is_open: z.boolean().default(true),

  max_members: z.number()
    .min(2, 'Team must have at least 2 members')
    .max(8, 'Team cannot have more than 8 members')
    .default(4),
})

export type TeamCreateInput = z.infer<typeof teamCreateSchema>
