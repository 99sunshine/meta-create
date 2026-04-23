'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ROLES } from '@/constants/roles'
import type { Role } from '@/types/interfaces/Role'

interface JoinTeamDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teamName: string
  onJoin: (role: Role) => void | Promise<void>
  loading?: boolean
  isAlreadyMember?: boolean
}

export function JoinTeamDialog({ 
  open, 
  onOpenChange, 
  teamName, 
  onJoin, 
  loading = false,
  isAlreadyMember = false 
}: JoinTeamDialogProps) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)

  const handleJoin = async () => {
    if (!selectedRole) return
    await onJoin(selectedRole)
    setSelectedRole(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isAlreadyMember ? 'Already a Member' : `Join ${teamName}`}</DialogTitle>
          <DialogDescription>
            {isAlreadyMember 
              ? "You can't join a team you're already in"
              : "Select the role you'll play in this team"}
          </DialogDescription>
        </DialogHeader>

        {isAlreadyMember ? (
          <div className="py-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
              <span className="text-3xl">👥</span>
            </div>
            <p className="text-slate-400">
              You&apos;re already part of this team. Check your team dashboard to see your role and collaborate with your teammates.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4">
            {ROLES.map((role) => {
              const RoleIcon = role.icon
              const isSelected = selectedRole === role.name
              
              return (
                <button
                  key={role.name}
                  onClick={() => setSelectedRole(role.name)}
                  disabled={loading}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    isSelected
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${
                      isSelected ? 'bg-blue-500/20' : 'bg-slate-700/50'
                    }`}>
                      <RoleIcon className={`h-5 w-5 ${
                        isSelected ? 'text-blue-400' : 'text-slate-400'
                      }`} />
                    </div>
                    <h3 className={`font-semibold ${
                      isSelected ? 'text-blue-300' : 'text-white'
                    }`}>
                      {role.name}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-400">
                    {role.description}
                  </p>
                </button>
              )
            })}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedRole(null)
              onOpenChange(false)
            }}
            disabled={loading}
          >
            {isAlreadyMember ? 'Close' : 'Cancel'}
          </Button>
          {!isAlreadyMember && (
            <Button
              onClick={handleJoin}
              disabled={!selectedRole}
              loading={loading}
              loadingText="加入中..."
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              加入队伍
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
