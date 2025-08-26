import React, { useCallback, useMemo, useState } from 'react'
import { occursOnDate } from '../lib/schedule'

export default function Planner({ state, navigate }) {
  const { tasks, schedules } = state

  const scheduleFor = useCallback(
    taskId => schedules.find(s => s.taskId === taskId) || null,
    [schedules]
  )

  const candidates = useMemo(
    () =>
      tasks
        .map(t => ({ task: t, schedule: scheduleFor(t.id) }))
        .filter(({ schedule }) => schedule && occursOnDate(schedule, new Date())),
    [tasks, scheduleFor]
  )

  const items = useMemo(() => {
    const list = []
    candidates.forEach(({ task }) => {
      list.push({ type: 'task', id: task.id, title: task.title })
      ;(task.subtasks || [])
        .filter(s => !s.done)
        .forEach(s =>
          list.push({
            type: 'subtask',
            id: `${task.id}::${s.id}`,
            title: `${task.title}: ${s.title}`
          })
        )
    })
    return list
  }, [candidates])

  const [blocks, setBlocks] = useState(Array(24).fill(null))

  const handleDrop = (hour, data) => {
    setBlocks(prev => {
      const copy = [...prev]
      copy[hour] = data
      return copy
    })
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f172a',
        color: '#e5e7eb',
        padding: 24,
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, sans-serif'
      }}
    >
      <header style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#9ca3af' }}>Planner</div>
        <button
          onClick={() => navigate('goals')}
          style={{
            marginLeft: 'auto',
            background: '#111827',
            border: '1px solid #374151',
            padding: '8px 12px',
            borderRadius: 12,
            cursor: 'pointer'
          }}
        >
          Back to Goals
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16 }}>
        <aside
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid #334155',
            borderRadius: 12,
            padding: 12
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Today’s items</div>
          {items.length === 0 && <div style={{ opacity: 0.8 }}>No eligible items today.</div>}
          {items.map(it => (
            <div
              key={it.id}
              draggable
              onDragStart={e =>
                e.dataTransfer.setData('text/plain', JSON.stringify(it))
              }
              style={{
                border: '1px solid #374151',
                borderRadius: 10,
                padding: 8,
                marginBottom: 8,
                cursor: 'grab'
              }}
            >
              {it.title}
            </div>
          ))}
        </aside>
        <main
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid #334155',
            borderRadius: 12,
            padding: 12
          }}
        >
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              style={{
                border: '1px solid #374151',
                borderRadius: 8,
                padding: 8,
                marginBottom: 4,
                minHeight: 40
              }}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault()
                const data = JSON.parse(e.dataTransfer.getData('text'))
                handleDrop(i, data)
              }}
            >
              <div style={{ fontSize: 12, opacity: 0.7 }}>{`${String(i).padStart(2, '0')}:00`}</div>
              {blocks[i] && (
                <div style={{ marginTop: 4 }}>{blocks[i].title}</div>
              )}
            </div>
          ))}
        </main>
      </div>
    </div>
  )
}