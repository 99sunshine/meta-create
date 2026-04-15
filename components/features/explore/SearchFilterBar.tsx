'use client'

import { useRef, useEffect } from 'react'
import { trackEvent } from '@/lib/analytics'

export interface ExploreFilters {
  searchQuery: string
  roleFilter: string
  categoryFilter: string
  availabilityFilter: string
  trackFilter: string
  contentType: 'all' | 'works' | 'teams'
}

interface SearchFilterBarProps {
  filters: ExploreFilters
  onChange: (next: Partial<ExploreFilters>) => void
}

const ROLE_OPTIONS = ['Visionary', 'Builder', 'Strategist', 'Connector']
const CATEGORY_OPTIONS = ['Engineering', 'Design', 'Art', 'Science', 'Business', 'Other']
const AVAILABILITY_OPTIONS = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'flexible', label: 'Flexible' },
  { value: 'evenings', label: 'Evenings' },
  { value: 'weekends', label: 'Weekends' },
]
const TRACK_OPTIONS = ['Engineering', 'Design', 'Business', 'Science', 'Social Impact']

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
        active
          ? 'text-white'
          : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white/80'
      }`}
      style={active ? { backgroundColor: '#E7770F', borderColor: 'transparent' } : undefined}
    >
      {label}
    </button>
  )
}

export function SearchFilterBar({ filters, onChange }: SearchFilterBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounced search analytics
  useEffect(() => {
    if (!filters.searchQuery) return
    const t = setTimeout(() => {
      trackEvent('explore_searched', {
        query_length: filters.searchQuery.length,
        role_filter: filters.roleFilter || null,
        category_filter: filters.categoryFilter || null,
        availability_filter: filters.availabilityFilter || null,
        track_filter: filters.trackFilter || null,
      })
    }, 1000)
    return () => clearTimeout(t)
  }, [filters.searchQuery, filters.roleFilter, filters.categoryFilter, filters.availabilityFilter, filters.trackFilter])

  const clearAll = () => {
    onChange({
      searchQuery: '',
      roleFilter: '',
      categoryFilter: '',
      availabilityFilter: '',
      trackFilter: '',
      contentType: 'all',
    })
    inputRef.current?.focus()
  }

  const hasActiveFilter =
    filters.searchQuery ||
    filters.roleFilter ||
    filters.categoryFilter ||
    filters.availabilityFilter ||
    filters.trackFilter ||
    filters.contentType !== 'all'

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none select-none">
          🔍
        </span>
        <input
          ref={inputRef}
          type="text"
          value={filters.searchQuery}
          onChange={(e) => onChange({ searchQuery: e.target.value })}
          placeholder="Search by name, skill, or tag…"
          className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-10 text-sm text-white placeholder-white/30 focus:border-orange-400/60 focus:bg-white/8 focus:outline-none transition-colors"
        />
        {filters.searchQuery && (
          <button
            onClick={() => onChange({ searchQuery: '' })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 text-lg leading-none"
          >
            ×
          </button>
        )}
      </div>

      {/* Filter rows */}
      <div className="flex flex-col gap-2">
        {/* Content type */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-white/30 mr-1 shrink-0">Show:</span>
          {(['all', 'works', 'teams'] as const).map((type) => (
            <FilterChip
              key={type}
              label={type === 'all' ? 'All' : type === 'works' ? 'Works' : 'Teams'}
              active={filters.contentType === type}
              onClick={() => onChange({ contentType: type })}
            />
          ))}
        </div>

        {/* Role */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-white/30 mr-1 shrink-0">Role:</span>
          {ROLE_OPTIONS.map((role) => (
            <FilterChip
              key={role}
              label={role}
              active={filters.roleFilter === role}
              onClick={() =>
                onChange({ roleFilter: filters.roleFilter === role ? '' : role })
              }
            />
          ))}
        </div>

        {/* Category */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-white/30 mr-1 shrink-0">Category:</span>
          {CATEGORY_OPTIONS.map((cat) => (
            <FilterChip
              key={cat}
              label={cat}
              active={filters.categoryFilter === cat}
              onClick={() =>
                onChange({ categoryFilter: filters.categoryFilter === cat ? '' : cat })
              }
            />
          ))}
        </div>

        {/* Availability */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-white/30 mr-1 shrink-0">Time:</span>
          {AVAILABILITY_OPTIONS.map(({ value, label }) => (
            <FilterChip
              key={value}
              label={label}
              active={filters.availabilityFilter === value}
              onClick={() =>
                onChange({ availabilityFilter: filters.availabilityFilter === value ? '' : value })
              }
            />
          ))}
        </div>

        {/* Hackathon track */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-white/30 mr-1 shrink-0">Track:</span>
          {TRACK_OPTIONS.map((track) => (
            <FilterChip
              key={track}
              label={track}
              active={filters.trackFilter === track}
              onClick={() =>
                onChange({ trackFilter: filters.trackFilter === track ? '' : track })
              }
            />
          ))}
        </div>
      </div>

      {/* Clear all */}
      {hasActiveFilter && (
        <div className="flex justify-end">
          <button
            onClick={clearAll}
            className="text-xs text-white/40 hover:text-white/70 underline transition-colors"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  )
}
