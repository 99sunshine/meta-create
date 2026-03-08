/**
 * Centralized constants for MetaCreate
 * 
 * These constants represent values that should eventually be fetched from the database.
 * By centralizing them here, we make future database migration easier.
 */

export { ROLES, type RoleMetadata, getRoleMetadata } from './roles'
export { COLLAB_STYLES, AVAILABILITIES } from './enums'
