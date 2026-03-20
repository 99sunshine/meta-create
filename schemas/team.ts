import { z } from 'zod'

/**
 * Team creation validation schema
 * Based on PRD Section 7.5 requirements
 */

export const teamCreateSchema = z.object({
  name: z.string()
    .min(3, 'Team name must be at least 3 characters')
    .max(100, 'Team name must be less than 100 characters'),
  
  description: z.string()
    .min(50, 'Description must be at least 50 characters')
    .max(500, 'Description must be less than 500 characters'),
  
  category: z.enum(['Hackathon', 'Project', 'Startup', 'Research', 'Creative', 'Other'], {
    message: 'Please select a valid category'
  }),
  
  looking_for_roles: z.array(
    z.enum(['Visionary', 'Builder', 'Strategist', 'Connector'])
  ).optional(),
  
  event_id: z.string().uuid().nullable().optional(),
  
  external_chat_link: z.string()
    .url('Please enter a valid URL')
    .nullable()
    .optional()
    .or(z.literal('')),
  
  is_open: z.boolean().default(true),
  
  max_members: z.number()
    .min(2, 'Team must have at least 2 members')
    .max(6, 'Team cannot have more than 6 members')
    .default(6)
})

export type TeamCreateInput = z.infer<typeof teamCreateSchema>
