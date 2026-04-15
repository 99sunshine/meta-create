'use client'

import { Button } from '@/components/ui/button'
import { MetaFire } from './MetaFire'

interface TrackSelectionProps {
  onSelectTrack: (track: 'fast' | 'manual' | 'browse') => void
}

export function TrackSelection({ onSelectTrack }: TrackSelectionProps) {
  return (
    <div className="flex flex-col items-center gap-5">
      <MetaFire message="First, let's build your profile...<br/>Pick a track!<br/>Fast track autofills with your resume,<br/>or you can build from scratch." />
      
      <div className="flex flex-col items-center gap-2 w-[233px]">
        <div className="flex flex-col gap-[15px] w-full">
          <Button
            onClick={() => onSelectTrack('fast')}
            className="w-full py-[15px] bg-[#E7770F] hover:bg-[#d66d0d] rounded-[25px] text-white text-base font-medium h-auto"
          >
            Fast Track
          </Button>
          
          <button
            onClick={() => onSelectTrack('manual')}
            className="w-full py-[15px] rounded-[25px] text-white text-base font-medium border border-[rgba(244,140,36,0.50)] h-auto"
            style={{
              background: 'linear-gradient(0deg, rgba(243.75, 139.84, 35.92, 0.50) 0%, rgba(243.75, 139.84, 35.92, 0.50) 100%), rgba(0, 0, 0, 0.30)'
            }}
          >
            Build My Own
          </button>
        </div>
        
        <button
          onClick={() => onSelectTrack('browse')}
          className="text-[#E6E6E6] text-[11px] underline leading-[14px]"
        >
          I&apos;ll browse first
        </button>
      </div>
    </div>
  )
}
