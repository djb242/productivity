import React, { useCallback, useMemo } from 'react'
import { occursOnDate } from '../lib/schedule'


export default function Planner({ state, navigate }){
const { tasks, schedules } = state


const scheduleFor = useCallback(
  (taskId) => schedules.find(s => s.taskId === taskId) || null,
  [schedules]
)
const candidates = useMemo(
  () =>
    tasks
      .map(t => ({ task: t, schedule: scheduleFor(t.id) }))
      .filter(
        ({ schedule }) => schedule && occursOnDate(schedule, new Date())
      ),
  [tasks, scheduleFor]
)


return (
<div style={{ minHeight:'100vh', background:'#0f172a', color:'#e5e7eb', padding:24, fontFamily:'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, sans-serif' }}>
<header style={{ display:'flex', gap:12, alignItems:'center', marginBottom:16 }}>
<div style={{ fontSize:24, fontWeight:700, color:'#9ca3af' }}>Planner (skeleton)</div>
<button onClick={()=> navigate('organizer')} style={{ marginLeft:'auto', background:'#111827', border:'1px solid #374151', padding:'8px 12px', borderRadius:12, cursor:'pointer' }}>Back to Organizer</button>
</header>


<div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:16 }}>
<aside style={{ background:'rgba(255,255,255,0.04)', border:'1px solid #334155', borderRadius:12, padding:12 }}>
<div style={{ fontWeight:700, marginBottom:8 }}>Today’s candidates</div>
{candidates.length===0 && <div style={{ opacity:.8 }}>No eligible items today.</div>}
{candidates.map(({task}) => (
<div key={task.id} style={{ border:'1px solid #374151', borderRadius:10, padding:8, marginBottom:8 }}>{task.title}</div>
))}
</aside>
<main style={{ background:'rgba(255,255,255,0.04)', border:'1px solid #334155', borderRadius:12, padding:12 }}>
<div style={{ opacity:.8 }}>Hourly grid will go here (60‑min blocks, overlap allowed).</div>
</main>
</div>
</div>
)
}