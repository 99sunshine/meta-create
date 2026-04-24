import { Lightbulb, Hammer, Target, Users, LucideIcon } from 'lucide-react'
import { Role } from '@/types/interfaces/Role'

/**
 * Role metadata for the 4-Role system
 * 
 * TODO: In the future, this should be fetched from the 'roles' table in the database.
 * For now, this is a centralized constant to make the migration easier.
 * 
 * When moving to database-driven:
 * 1. Create a getRoles() function that fetches from Supabase
 * 2. Store icon names as strings in DB (e.g., 'lightbulb', 'hammer')
 * 3. Map icon strings to LucideIcon components in the client
 */

export interface RoleMetadata {
  name: Role
  icon: LucideIcon
  description: string
  oneLiner: string
}

export const ROLES: RoleMetadata[] = [
  {
    name: 'Visionary',
    icon: Lightbulb,
    description: 'I see the big picture',
    oneLiner: 'Big-picture thinkers who imagine what could be',
  },
  {
    name: 'Builder',
    icon: Hammer,
    description: 'I make things work',
    oneLiner: 'Hands-on creators who turn ideas into reality',
  },
  {
    name: 'Strategist',
    icon: Target,
    description: 'I plan and analyze',
    oneLiner: 'Systematic planners who optimize the path forward',
  },
  {
    name: 'Connector',
    icon: Users,
    description: 'I bridge ideas',
    oneLiner: 'Social architects who bring people and concepts together',
  },
]

/**
 * Helper to get role metadata by name
 */
export function getRoleMetadata(roleName: Role): RoleMetadata | undefined {
  return ROLES.find((r) => r.name === roleName)
}
