import React, { createContext, useContext, useEffect, useMemo } from 'react'
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
  const [node, setNode] = React.useState(null)
  useEffect(() => {
    const el = document.createElement('div'); document.body.appendChild(el); setNode(el)
    return () => { document.body.removeChild(el) }
  }, [])
  if (!ctx?.open || !node) return null
  const body = (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={()=>ctx?.onOpenChange?.(false)} />
      <div className={`relative z-10 bg-white rounded-2xl border border-zinc-200 shadow-xl w-[min(680px,calc(100vw-2rem))] ${className}`} {...rest}>
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
