'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { WorkCreateInput } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { createWorkAction } from '@/app/actions/create'
import { X } from 'lucide-react'

interface CreateWorkFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

// Must match the works_category_check DB constraint exactly.
const CATEGORIES = ['Engineering', 'Design', 'Art', 'Science', 'Business', 'Other'] as const

export function CreateWorkForm({ onSuccess, onCancel }: CreateWorkFormProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<WorkCreateInput>({
    title: '',
    description: '',
    category: 'Engineering',
    tags: [],
    images: [],
    links: []
  })

  const [tagInput, setTagInput] = useState('')
  const [imageInput, setImageInput] = useState('')
  const [linkInput, setLinkInput] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('You must be logged in to create a work')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await createWorkAction(formData, user.id)
      
      if (result.success) {
        onSuccess?.()
      } else {
        setError(result.error || 'Failed to create work')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create work')
    } finally {
      setLoading(false)
    }
  }

  const addTag = () => {
    if (tagInput.trim() && formData.tags!.length < 5) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter((_, i) => i !== index)
    }))
  }

  const addImage = () => {
    try {
      new URL(imageInput)
      if (imageInput.trim() && formData.images!.length < 9) {
        setFormData(prev => ({
          ...prev,
          images: [...(prev.images || []), imageInput.trim()]
        }))
        setImageInput('')
      }
    } catch {
      setError('Please enter a valid image URL')
    }
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index)
    }))
  }

  const addLink = () => {
    try {
      new URL(linkInput)
      if (linkInput.trim()) {
        setFormData(prev => ({
          ...prev,
          links: [...(prev.links || []), linkInput.trim()]
        }))
        setLinkInput('')
      }
    } catch {
      setError('Please enter a valid URL')
    }
  }

  const removeLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      links: prev.links?.filter((_, i) => i !== index)
    }))
  }

  const charCount = formData.description.length

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Enter work title"
          required
          minLength={5}
          maxLength={80}
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
          placeholder="Describe your work..."
          required
          minLength={20}
          maxLength={500}
          rows={5}
          className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-md text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        {charCount < 20 && charCount > 0 && (
          <p className="text-sm text-slate-400">Need {20 - charCount} more characters</p>
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
        <Label>Tags (1-5) {formData.tags?.length ? `(${formData.tags.length}/5)` : ''}</Label>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            placeholder="Add a tag"
            disabled={formData.tags!.length >= 5}
            className="bg-slate-800/50 border-slate-700 text-white"
          />
          <Button
            type="button"
            onClick={addTag}
            disabled={!tagInput.trim() || formData.tags!.length >= 5}
            className="bg-purple-500 hover:bg-purple-600"
          >
            Add
          </Button>
        </div>
        {formData.tags && formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-slate-700/50 text-slate-300 rounded-md text-sm flex items-center gap-2"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(idx)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Images (optional, max 9)</Label>
        <div className="flex gap-2">
          <Input
            value={imageInput}
            onChange={(e) => setImageInput(e.target.value)}
            placeholder="Paste image URL"
            disabled={formData.images!.length >= 9}
            className="bg-slate-800/50 border-slate-700 text-white"
          />
          <Button
            type="button"
            onClick={addImage}
            disabled={!imageInput.trim() || formData.images!.length >= 9}
            className="bg-purple-500 hover:bg-purple-600"
          >
            Add
          </Button>
        </div>
        {formData.images && formData.images.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            {formData.images.map((img, idx) => (
              <div key={idx} className="relative group">
                <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-20 object-cover rounded-md" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Links (optional)</Label>
        <div className="flex gap-2">
          <Input
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            placeholder="Paste project link (GitHub, Figma, etc.)"
            className="bg-slate-800/50 border-slate-700 text-white"
          />
          <Button
            type="button"
            onClick={addLink}
            disabled={!linkInput.trim()}
            className="bg-purple-500 hover:bg-purple-600"
          >
            Add
          </Button>
        </div>
        {formData.links && formData.links.length > 0 && (
          <div className="space-y-2 mt-2">
            {formData.links.map((link, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-md">
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-sm text-purple-400 hover:text-purple-300 truncate"
                >
                  {link}
                </a>
                <button
                  type="button"
                  onClick={() => removeLink(idx)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-md text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={loading || !formData.tags || formData.tags.length === 0}
          className="flex-1 bg-purple-500 hover:bg-purple-600 text-white"
        >
          {loading ? 'Creating...' : 'Create Work'}
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
