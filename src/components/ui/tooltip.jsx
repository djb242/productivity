import React, { createContext, useContext, useState } from 'react'

const Ctx = createContext(null)
export function TooltipProvider({ children }) { return <>{children}</> }
export function Tooltip({ children }) { const [open,setOpen]=useState(false); return <Ctx.Provider value={{open,setOpen}}>{children}</Ctx.Provider> }
export function TooltipTrigger({ children }) { const ctx=useContext(Ctx); return <span onMouseEnter={()=>ctx?.setOpen(true)} onMouseLeave={()=>ctx?.setOpen(false)}>{children}</span> }
export function TooltipContent({ children, className='' }) { const ctx=useContext(Ctx); if(!ctx?.open) return null; return <div className={`absolute z-50 px-2 py-1 rounded bg-black text-white text-xs ${className}`}>{children}</div> }
