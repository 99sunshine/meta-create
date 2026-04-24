'use client'

interface FeedToggleProps {
  activeFilter: 'all' | 'works' | 'teams'
  onFilterChange: (filter: 'all' | 'works' | 'teams') => void
}

export function FeedToggle({ activeFilter, onFilterChange }: FeedToggleProps) {
  const filters = [
    { value: 'all', label: 'All' },
    { value: 'works', label: 'Works' },
    { value: 'teams', label: 'Teams Recruiting' },
  ] as const

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {filters.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onFilterChange(value)}
          className={`
            px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap
            ${activeFilter === value
              ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
              : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:border-purple-500/50 hover:text-purple-300'
            }
          `}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
