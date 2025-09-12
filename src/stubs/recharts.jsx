import React from 'react'
export function ResponsiveContainer({ children, width='100%', height=200, style }){
  return <div style={{ width, height, ...style }}>{children}</div>
}
export function LineChart({ children }){ return <div>{children}</div> }
export function Line(){ return null }
export function XAxis(){ return null }
export function YAxis(){ return null }
export function Tooltip(){ return null }
export function CartesianGrid(){ return null }
export function BarChart({ children }){ return <div>{children}</div> }
export function Bar(){ return null }
export default {}

