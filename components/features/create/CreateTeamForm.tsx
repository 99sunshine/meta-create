'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { TeamCreateInput } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { createTeamAction } from '@/app/actions/create'

interface CreateTeamFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

const CATEGORIES = ['Hackathon', 'Project', 'Startup', 'Research', 'Creative', 'Other'] as const
const ROLES = ['Visionary', 'Builder', 'Strategist', 'Connector'] as const

export function CreateTeamForm({ onSuccess, onCancel }: CreateTeamFormProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<TeamCreateInput>({
    name: '',
    description: '',
    category: 'Project',
    looking_for_roles: [],
    external_chat_link: '',
    is_open: true,
    max_members: 6
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('You must be logged in to create a team')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await createTeamAction(formData, user.id)
      
      if (result.success) {
        onSuccess?.()
      } else {
        setError(result.error || 'Failed to create team')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team')
    } finally {
      setLoading(false)
    }
  }

  const toggleRole = (role: 'Visionary' | 'Builder' | 'Strategist' | 'Connector') => {
    setFormData(prev => ({
      ...prev,
      looking_for_roles: prev.looking_for_roles?.includes(role)
        ? prev.looking_for_roles.filter(r => r !== role)
        : [...(prev.looking_for_roles || []), role]
    }))
  }

  const charCount = formData.description.length

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Team Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter team name"
          required
          minLength={3}
          maxLength={100}
          className="bg-slate-800/50 border-slate-700 text-white"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">
          Description * ({charCount}/500)
        </Label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe your team and what you're working on..."
          required
          minLength={50}
          maxLength={500}
          rows={5}
          className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-md text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        {charCount < 50 && charCount > 0 && (
          <p className="text-sm text-slate-400">Need {50 - charCount} more characters</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category *</Label>
        <select
          id="category"
          value={formData.category}
          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as typeof CATEGORIES[number] }))}
          className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label>Looking for (optional)</Label>
        <div className="flex flex-wrap gap-2">
          {ROLES.map(role => (
            <button
              key={role}
              type="button"
              onClick={() => toggleRole(role)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                formData.looking_for_roles?.includes(role)
                  ? 'bg-purple-500 text-white'
                  : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:border-purple-500'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="chat_link">External Chat Link (optional)</Label>
        <Input
          id="chat_link"
          type="url"
          value={formData.external_chat_link || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, external_chat_link: e.target.value }))}
          placeholder="Discord, Slack, or WeChat group link"
          className="bg-slate-800/50 border-slate-700 text-white"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_open"
          checked={formData.is_open}
          onChange={(e) => setFormData(prev => ({ ...prev, is_open: e.target.checked }))}
          className="h-4 w-4 rounded border-slate-700 bg-slate-800/50 text-purple-500 focus:ring-purple-500"
        />
        <Label htmlFor="is_open" className="cursor-pointer">
          Open for new members
        </Label>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-md text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 bg-purple-500 hover:bg-purple-600 text-white"
        >
          {loading ? 'Creating...' : 'Create Team'}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700/50"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
