import Image from 'next/image'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16'
}

export function Logo({ className = '', size = 'md' }: LogoProps) {
  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <Image
        src="/logo-clyok.png"
        alt="Clyok"
        fill
        className="object-contain"
        priority
      />
    </div>
  )
}

export function LogoWithText({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Logo size="md" />
      <span className="text-2xl font-bold text-gray-900 dark:text-white">
        Clyok
      </span>
    </div>
  )
}
