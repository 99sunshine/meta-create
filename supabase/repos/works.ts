import { createClient } from '../utils/client'
import type { WorkWithCreator, WorkWithCreatorView, WorkCreator, WorkCreateInput } from '@/types'
import { workCreateSchema } from '@/schemas/work'

function parseWorkView(view: WorkWithCreatorView): WorkWithCreator {
  return {
    id: view.id!,
    title: view.title!,
    description: view.description!,
    category: view.category!,
    tags: view.tags,
    images: view.images,
    links: view.links,
    save_count: view.save_count ?? 0,
    user_id: view.user_id!,
    created_at: view.created_at!,
    updated_at: view.updated_at!,
    collaborator_ids: view.collaborator_ids,
    event_id: view.event_id,
    creator: view.creator as WorkCreator
  }
}

export class WorksRepository {
  /**
   * Get recent works with creator info
   * Queries the works_with_creator view (no N+1 problem)
   */
  async getRecentWorks(limit: number = 20): Promise<WorkWithCreator[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('works_with_creator')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to fetch works: ${error.message}`)
    }

    return (data || []).map(parseWorkView)
  }

  /**
   * Get works by category
   */
  async getWorksByCategory(category: string, limit: number = 20): Promise<WorkWithCreator[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('works_with_creator')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to fetch works by category: ${error.message}`)
    }

    return (data || []).map(parseWorkView)
  }

  /**
   * Get single work by ID with creator info
   */
  async getWorkById(workId: string): Promise<WorkWithCreator | null> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('works_with_creator')
      .select('*')
      .eq('id', workId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to fetch work: ${error.message}`)
    }

    return parseWorkView(data)
  }

  /**
   * Get works by user ID
   */
  async getWorksByUserId(userId: string, limit: number = 20): Promise<WorkWithCreator[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('works_with_creator')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to fetch user works: ${error.message}`)
    }

    return (data || []).map(parseWorkView)
  }

  /**
   * Create a new work
   */
  async createWork(workData: WorkCreateInput, userId: string): Promise<WorkWithCreator> {
    const supabase = createClient()
    
    // Validate input with Zod
    const validated = workCreateSchema.parse(workData)
    
    // Insert work
    const { data: work, error: workError } = await supabase
      .from('works')
      .insert({
        title: validated.title,
        description: validated.description,
        category: validated.category,
        tags: validated.tags || null,
        images: validated.images || null,
        links: validated.links || null,
        collaborator_ids: validated.collaborator_ids || null,
        event_id: validated.event_id || null,
        user_id: userId,
        save_count: 0
      })
      .select()
      .single()

    if (workError) {
      throw new Error(`Failed to create work: ${workError.message}`)
    }

    // Fetch the complete work with creator from view
    const createdWork = await this.getWorkById(work.id)
    
    if (!createdWork) {
      throw new Error('Failed to fetch created work')
    }

    return createdWork
  }
}
