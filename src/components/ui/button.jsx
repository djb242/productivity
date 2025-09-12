import React from 'react'

const variants = {
  default: 'bg-white text-zinc-900 border border-zinc-200 hover:shadow-md hover:-translate-y-px',
  secondary: 'bg-zinc-100 text-zinc-900 border border-zinc-200 hover:bg-zinc-200',
  outline: 'bg-transparent text-zinc-900 border border-zinc-300 hover:bg-zinc-50',
  ghost: 'bg-transparent text-zinc-900 hover:bg-zinc-100 border border-transparent',
  destructive: 'bg-red-600 text-white border border-red-600 hover:bg-red-700'
}
const sizes = {
  sm: 'h-8 px-3 text-sm rounded-md',
  md: 'h-9 px-4 text-sm rounded-lg',
  lg: 'h-11 px-5 text-base rounded-xl',
  icon: 'h-9 w-9 p-0 rounded-lg'
}

export function Button({ className = '', variant = 'default', size = 'md', children, ...rest }) {
  const cls = `inline-flex items-center gap-2 transition-transform duration-150 ${variants[variant] || variants.default} ${sizes[size] || sizes.md} ${className}`
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  )
}
