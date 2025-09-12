import React from 'react'

export function Card({ className = '', children, ...rest }) {
  return (
    <div className={`bg-white/95 backdrop-blur border border-zinc-200 rounded-2xl shadow-sm ${className}`} {...rest}>
      {children}
    </div>
  )
}

export function CardHeader({ className = '', children, ...rest }) {
  return (
    <div className={`p-4 ${className}`} {...rest}>
      {children}
    </div>
  )
}

export function CardTitle({ className = '', children, ...rest }) {
  return (
    <div className={`text-lg font-bold ${className}`} {...rest}>
      {children}
    </div>
  )
}

export function CardContent({ className = '', children, ...rest }) {
  return (
    <div className={`p-4 ${className}`} {...rest}>
      {children}
    </div>
  )
}
