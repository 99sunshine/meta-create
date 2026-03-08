// The 4-Role system for MetaCreate
// These should be fetched from the 'roles' table in DB
// This type is for TypeScript validation only

export type Role = 'Visionary' | 'Builder' | 'Strategist' | 'Connector'

export interface RoleInfo {
  name: Role
  icon: string
  description: string
  oneLineer: string
}

// Role complementarity scoring
export type RoleComplementarity = 'HIGH' | 'MEDIUM' | 'LOW' | 'NEUTRAL'

// Role complementarity matrix (for matching algorithm)
export const ROLE_COMPLEMENTARITY: Record<Role, Record<Role, RoleComplementarity>> = {
  Visionary: {
    Visionary: 'NEUTRAL',
    Builder: 'HIGH',
    Strategist: 'HIGH',
    Connector: 'MEDIUM',
  },
  Builder: {
    Visionary: 'HIGH',
    Builder: 'LOW',
    Strategist: 'MEDIUM',
    Connector: 'MEDIUM',
  },
  Strategist: {
    Visionary: 'HIGH',
    Builder: 'MEDIUM',
    Strategist: 'LOW',
    Connector: 'MEDIUM',
  },
  Connector: {
    Visionary: 'MEDIUM',
    Builder: 'MEDIUM',
    Strategist: 'MEDIUM',
    Connector: 'LOW',
  },
}
