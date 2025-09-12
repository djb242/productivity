import React from 'react'

export function Textarea({ className = '', ...rest }) {
  const cls = `w-full min-h-[96px] px-3 py-2 rounded-xl border border-zinc-300 bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 ${className}`
  return <textarea className={cls} {...rest} />
}
