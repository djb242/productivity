import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

const Ctx = createContext(null)

export function Dialog({ open, onOpenChange, children }) {
  const value = useMemo(()=>({ open: !!open, onOpenChange }), [open, onOpenChange])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function DialogTrigger({ asChild, children }) {
  const ctx = useContext(Ctx)
  const onClick = e => { ctx?.onOpenChange?.(true); if (children.props?.onClick) children.props.onClick(e) }
  return asChild && React.isValidElement(children)
    ? React.cloneElement(children, { onClick })
    : <button onClick={onClick}>{children}</button>
}

export function DialogContent({ className = '', children, ...rest }) {
  const ctx = useContext(Ctx)
  const [node, setNode] = useState(null)

  useEffect(() => {
    if (!ctx?.open) return
    const el = document.createElement('div')
    document.body.appendChild(el)
    setNode(el)
    // lock body scroll while open
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') ctx?.onOpenChange?.(false) }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      document.body.removeChild(el)
      setNode(null)
    }
  }, [ctx?.open])

  if (!ctx?.open || !node) return null
  const body = (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}
    >
      <div
        onClick={() => ctx?.onOpenChange?.(false)}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }}
      />
      <div
        className={className}
        {...rest}
        style={{
          position: 'relative', zIndex: 1,
          background: '#fff', borderRadius: 16,
          border: '1px solid rgba(15,23,42,0.12)',
          boxShadow: '0 20px 60px rgba(2,6,23,0.20)',
          width: 'min(680px, calc(100vw - 2rem))',
          maxHeight: 'min(85vh, calc(100vh - 2rem))',
          overflowY: 'auto'
        }}
      >
        {children}
      </div>
    </div>
  )
  return createPortal(body, node)
}
export function DialogHeader({ children, className='' }){ return <div className={`p-4 border-b border-zinc-200 ${className}`}>{children}</div> }
export function DialogTitle({ children, className='' }){ return <div className={`text-lg font-bold ${className}`}>{children}</div> }
export function DialogDescription({ children, className='' }){ return <div className={`text-sm text-zinc-600 ${className}`}>{children}</div> }
export function DialogFooter({ children, className='' }){ return <div className={`p-4 border-t border-zinc-200 flex items-center gap-2 justify-end ${className}`}>{children}</div> }
