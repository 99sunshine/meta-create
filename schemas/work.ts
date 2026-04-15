import { z } from 'zod'

/**
 * Work creation validation schema
 * Based on PRD Section 7.6 requirements
 */

export const workCreateSchema = z.object({
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(80, 'Title must be less than 80 characters'),
  
  description: z.string()
    .min(20, 'Description must be at least 20 characters')
    .max(500, 'Description must be less than 500 characters'),
  
  category: z.enum(['Engineering', 'Design', 'Art', 'Science', 'Business', 'Other'], {
    message: 'Please select a valid category'
  }),
  
  tags: z.array(z.string())
    .min(1, 'Please add at least 1 tag')
    .max(5, 'Maximum 5 tags allowed')
    .optional(),
  
  images: z.array(
    z.string().url('Please enter valid image URLs')
  ).max(9, 'Maximum 9 images allowed').optional(),
  
  links: z.array(
    z.string().url('Please enter valid URLs')
  ).optional(),
  
  collaborator_ids: z.array(z.string().uuid()).optional(),
  
  event_id: z.string().uuid().nullable().optional()
})

export type WorkCreateInput = z.infer<typeof workCreateSchema>
