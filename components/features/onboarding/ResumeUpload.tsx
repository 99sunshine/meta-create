'use client'

import { useState, useRef } from 'react'
import { useLocale } from '@/components/providers/LocaleProvider'

interface ResumeUploadProps {
  onFileSelect: (file: File | null) => void
  selectedFile: File | null
}

export function ResumeUpload({ onFileSelect, selectedFile }: ResumeUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { tr } = useLocale()

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file && (file.type === 'application/pdf' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      onFileSelect(file)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelect(file)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-full max-w-[330px] py-[45px] bg-[rgba(255,255,255,0.10)] rounded-[10px] cursor-pointer transition-all ${
        isDragging ? 'border-2 border-[#E7770F]' : 'border-2 border-dashed border-[rgba(103.45,121.38,157.25,0.50)]'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <div className="flex flex-col items-center gap-2">
        <div className="text-white text-[32px]">📄</div>
        <div className="flex flex-col items-center gap-0.5">
          <p className="text-white text-xl font-medium">
            {selectedFile ? selectedFile.name : tr('resume.tapToUpload')}
          </p>
          <p className="text-[#E6E6E6] text-[11px] underline leading-[14px]">
            {tr('resume.fileHint')}
          </p>
        </div>
      </div>
    </div>
  )
}
