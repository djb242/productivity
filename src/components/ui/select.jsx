import React, { createContext, useContext, useRef, useState } from 'react'

const Ctx = createContext(null)

export function Select({ value, onValueChange, children }) {
  const [open, setOpen] = useState(false)
  const [val, setVal] = useState(value)
  const triggerRef = useRef(null)
  // support controlled updates
  React.useEffect(() => { if (value !== undefined) setVal(value) }, [value])
  const setValue = v => { setVal(v); onValueChange?.(v); setOpen(false) }
  return (
    <Ctx.Provider value={{ open, setOpen, value: val, setValue, triggerRef }}>
      <div className="relative inline-block">{children}</div>
    </Ctx.Provider>
  )
}

export function SelectTrigger({ children, className = '' }) {
  const ctx = useContext(Ctx)
  return (
    <button ref={ctx.triggerRef} type="button" onClick={()=>ctx.setOpen(!ctx.open)} className={`h-10 px-3 rounded-xl border border-zinc-300 bg-white text-left w-full ${className}`}>
      {children}
    </button>
  )
}

export function SelectValue({ placeholder }) {
  const ctx = useContext(Ctx)
  return <span>{ctx?.value || placeholder}</span>
}

export function SelectContent({ children, className='' }) {
  const ctx = useContext(Ctx)
  if (!ctx?.open) return null
  return (
    <div className={`absolute z-50 mt-1 w-full rounded-xl border border-zinc-300 bg-white shadow-lg ${className}`}>
      {children}
    </div>
  )
}

export function SelectItem({ value, children }) {
  const ctx = useContext(Ctx)
  const active = ctx?.value === value
  return (
    <div onClick={()=>ctx?.setValue(value)} className={`px-3 py-2 cursor-pointer text-sm ${active ? 'bg-blue-50 text-blue-700' : 'hover:bg-zinc-100'}`}>
      {children}
    </div>
  )
}
