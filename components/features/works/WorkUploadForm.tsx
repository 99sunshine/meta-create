'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/supabase/utils/client'
import imageCompression from 'browser-image-compression'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { trackEvent } from '@/lib/analytics'
import { useCreateFlowOptional } from '@/components/providers/CreateFlowProvider'

const MAX_IMAGES = 9
const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1200,
  useWebWorker: true,
  fileType: 'image/webp' as const,
  initialQuality: 0.8,
}

interface ImageItem {
  file: File
  preview: string
  uploading: boolean
  url?: string
  error?: string
}

export type WorkUploadFormProps = {
  /** When null, creates a personal work (`team_id` null in DB). */
  teamId: string | null
  /** Team display name when `teamId` is set (for隶属说明). */
  teamName?: string | null
  userId: string
  /** e.g. `/teams/${id}` or `/profile` */
  redirectAfterSave: string
}

export function WorkUploadForm({
  teamId,
  teamName,
  userId,
  redirectAfterSave,
}: WorkUploadFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const createFlow = useCreateFlowOptional()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [links, setLinks] = useState([''])
  const [images, setImages] = useState<ImageItem[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const storagePrefix = teamId ? `works/${teamId}` : `works/user/${userId}`

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    const remaining = MAX_IMAGES - images.length
    const toAdd = files.slice(0, remaining)

    const newItems: ImageItem[] = toAdd.map((f) => ({
      file: f,
      preview: URL.createObjectURL(f),
      uploading: false,
    }))
    setImages((prev) => [...prev, ...newItems])

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeImage = (idx: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[idx].preview)
      return prev.filter((_, i) => i !== idx)
    })
  }

  const uploadImages = async (): Promise<string[]> => {
    const urls: string[] = []

    for (let i = 0; i < images.length; i++) {
      const item = images[i]
      if (item.url) {
        urls.push(item.url)
        continue
      }

      setImages((prev) => prev.map((im, idx) => (idx === i ? { ...im, uploading: true } : im)))

      try {
        const compressed = await imageCompression(item.file, COMPRESSION_OPTIONS)
        const path = `${storagePrefix}/${Date.now()}-${i}.webp`
        const { error: upErr } = await supabase.storage
          .from('works')
          .upload(path, compressed, { contentType: 'image/webp', upsert: false })

        if (upErr) throw upErr

        const {
          data: { publicUrl },
        } = supabase.storage.from('works').getPublicUrl(path)
        urls.push(publicUrl)
        setImages((prev) =>
          prev.map((im, idx) => (idx === i ? { ...im, uploading: false, url: publicUrl } : im)),
        )
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Upload failed'
        setImages((prev) =>
          prev.map((im, idx) => (idx === i ? { ...im, uploading: false, error: msg } : im)),
        )
        throw new Error(`Image ${i + 1}: ${msg}`)
      }
    }
    return urls
  }

  const handleSave = async () => {
    if (!title.trim()) {
      setError('请填写作品标题')
      return
    }
    setSaving(true)
    setError('')

    try {
      const imageUrls = images.length > 0 ? await uploadImages() : []
      const cleanLinks = links.filter((l) => l.trim())

      const desc = description.trim() || '—'
      const { error: insErr } = await supabase.from('works').insert({
        title: title.trim(),
        description: desc,
        category: 'Other',
        tags: teamId ? (['team'] as string[]) : null,
        images: imageUrls.length > 0 ? imageUrls : null,
        links: cleanLinks.length > 0 ? cleanLinks : null,
        user_id: userId,
        team_id: teamId,
        save_count: 0,
      })

      if (insErr) throw insErr

      trackEvent('work_created', {
        team_id: teamId,
        personal: !teamId,
        has_images: imageUrls.length > 0,
      })
      createFlow?.notifyEntityCreated()
      router.push(redirectAfterSave)
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const anyUploading = images.some((im) => im.uploading)

  const isPersonal = !teamId

  return (
    <div className="px-5 py-5 pb-28 max-w-lg mx-auto space-y-5">
      <div
        className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3"
        role="region"
        aria-label="作品隶属"
      >
        <p className="text-sm font-semibold text-white">
          {isPersonal ? '个人作品' : '队伍作品'}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-white/45">
          {isPersonal
            ? '将发布到你的个人主页与社区动态，不关联任何队伍。'
            : teamName
              ? `将展示在「${teamName}」队伍页，作者为你本人，全队可见。`
              : '将展示在当前队伍页，作者为你本人，全队可见。'}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-white text-sm">作品标题 *</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. CreatorCanvas AI"
          className="bg-white/8 border-white/15 text-white placeholder-white/30 focus:border-[#e46d2e]"
          maxLength={60}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-white text-sm">描述</Label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="介绍这个作品在做什么…"
          className="w-full rounded-xl border border-white/15 bg-white/8 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#e46d2e] focus:outline-none resize-none"
          maxLength={500}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label className="text-white text-sm">图片（最多 {MAX_IMAGES} 张）</Label>
          <span className="text-xs text-white/30">
            {images.length} / {MAX_IMAGES}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {images.map((item, idx) => (
            <div key={idx} className="relative aspect-square">
              <img src={item.preview} alt="" className="w-full h-full object-cover rounded-xl" />
              {item.uploading && (
                <div className="absolute inset-0 rounded-xl bg-black/60 flex items-center justify-center">
                  <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                </div>
              )}
              {item.error && (
                <div className="absolute inset-0 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <span className="text-xs text-red-400 text-center p-1">{item.error}</span>
                </div>
              )}
              {!item.uploading && (
                <button
                  type="button"
                  className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-black/80"
                  onClick={() => removeImage(idx)}
                >
                  ×
                </button>
              )}
            </div>
          ))}

          {images.length < MAX_IMAGES && (
            <button
              type="button"
              className="aspect-square rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-1 text-white/30 hover:border-white/40 hover:text-white/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="text-2xl">+</span>
              <span className="text-[10px]">添加图片</span>
            </button>
          )}
        </div>

        <p className="text-xs text-white/25">自动压缩至 WebP 1200px · 最大 1MB/张</p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-white text-sm">链接（GitHub / Demo / 文档）</Label>
        {links.map((link, idx) => (
          <div key={idx} className="flex gap-2">
            <Input
              value={link}
              onChange={(e) =>
                setLinks((prev) => prev.map((l, i) => (i === idx ? e.target.value : l)))
              }
              placeholder="https://…"
              className="flex-1 bg-white/8 border-white/15 text-white placeholder-white/30 focus:border-[#e46d2e]"
            />
            {links.length > 1 && (
              <button
                type="button"
                className="text-white/30 hover:text-white/60 px-2"
                onClick={() => setLinks((prev) => prev.filter((_, i) => i !== idx))}
              >
                ×
              </button>
            )}
          </div>
        ))}
        {links.length < 5 && (
          <button
            type="button"
            className="self-start text-xs text-[#e46d2e] hover:text-[#f5a623] transition-colors"
            onClick={() => setLinks((prev) => [...prev, ''])}
          >
            + 添加链接
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <Button
        onClick={handleSave}
        disabled={saving || anyUploading || !title.trim()}
        className="w-full py-3 text-white font-semibold rounded-xl disabled:opacity-50"
        style={{ backgroundColor: '#E7770F' }}
      >
        {saving || anyUploading ? '上传中…' : '发布作品 🚀'}
      </Button>
    </div>
  )
}
