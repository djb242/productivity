import React from 'react'

export function Progress({ value = 0, className = '', style }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0))
  return (
    <div className={`ui-progress ${className}`} style={{ height: 8, background: 'rgba(0,0,0,0.08)', borderRadius: 999, ...style }}>
      <div style={{ width: `${v}%`, height: '100%', background: 'var(--primary)', borderRadius: 999 }} />
    </div>
  )
}

