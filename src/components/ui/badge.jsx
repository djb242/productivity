import React from 'react'

export function Badge({ className = '', variant = 'default', children, ...rest }) {
  const variants = {
    default: 'bg-zinc-200 text-zinc-900',
    secondary: 'bg-zinc-100 text-zinc-700 border border-zinc-200'
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] ${variants[variant] || variants.default} ${className}`} {...rest}>
      {children}
    </span>
  )
}
