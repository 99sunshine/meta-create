import Image from 'next/image'

interface MetaFireProps {
  message: string
  size?: 'sm' | 'md'
}

export function MetaFire({ message, size = 'md' }: MetaFireProps) {
  const imageSize = size === 'sm' ? 48 : 59
  
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <Image
          src="/images/metafire.svg"
          alt="Meta Fire"
          width={imageSize * 0.7}
          height={imageSize}
          priority
        />
      </div>
      <div className="max-w-[337px] px-2.5 text-center">
        <p 
          className="text-[#E6E6E6] text-xl leading-[22px] font-[family-name:var(--font-vt323)]"
          dangerouslySetInnerHTML={{ __html: message }}
        />
      </div>
    </div>
  )
}
