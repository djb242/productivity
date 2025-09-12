import React from 'react'

export function Input({ className = '', ...rest }) {
  const cls = `w-full h-10 px-3 rounded-xl border border-zinc-300 bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 ${className}`
  return <input className={cls} {...rest} />
}
