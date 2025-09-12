import React, { createContext, useContext, useState } from 'react'

const Ctx = createContext(null)

export function Tabs({ defaultValue, value: controlled, onValueChange, children, className='' }) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue)
  const value = controlled ?? uncontrolled
  const setValue = v => { setUncontrolled(v); onValueChange?.(v) }
  return <Ctx.Provider value={{ value, setValue }}><div className={className}>{children}</div></Ctx.Provider>
}
export function TabsList({ children, className='' }) { return <div className={`flex gap-2 ${className}`}>{children}</div> }
export function TabsTrigger({ value, children, className='' }) {
  const ctx = useContext(Ctx)
  const active = ctx?.value === value
  const base = active ? 'bg-white border-blue-500 text-blue-700' : 'bg-zinc-100 border-zinc-300 text-zinc-700 hover:bg-zinc-200'
  return <button onClick={()=>ctx?.setValue(value)} className={`px-3 py-1.5 rounded-lg border text-sm ${base} ${className}`}>{children}</button>
}
export function TabsContent({ value, children, className='' }) {
  const ctx = useContext(Ctx)
  if (ctx?.value !== value) return null
  return <div className={className}>{children}</div>
}
