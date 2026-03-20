'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'

interface PhotoUploadProps {
  onPhotoSelect: (file: File | null) => void
  selectedPhoto: string | null
}

export function PhotoUpload({ onPhotoSelect, selectedPhoto }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(selectedPhoto)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      onPhotoSelect(file)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleClick}
        className="w-20 h-20 rounded-full bg-[rgba(255,255,255,0.10)] flex items-center justify-center overflow-hidden transition-opacity hover:opacity-80"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        
        {preview ? (
          <Image
            src={preview}
            alt="Profile"
            width={80}
            height={80}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-white text-2xl">📷</span>
        )}
      </button>
      
      <p className="text-white text-sm leading-[14px]">
        Add a Photo
      </p>
    </div>
  )
}
