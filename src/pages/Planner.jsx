import React, { useCallback, useMemo, useState } from 'react'
import { occursOnDate } from '../lib/schedule'

export default function Planner({ state, actions, navigate }) {
  const { tasks, schedules } = state
  const { setTasks } = actions

  const scheduleFor = useCallback(
    taskId => schedules.find(s => s.taskId === taskId) || null,
    [schedules]
  )

  const candidates = useMemo(
    () =>
      tasks
        .filter(t => t.status !== 'done')
        .map(t => ({ task: t, schedule: scheduleFor(t.id) }))
        .filter(({ schedule }) => !schedule || occursOnDate(schedule, new Date())),
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

  const [resolution, setResolution] = useState(60) // minutes per slot
  const totalSlots = 24 * (60 / resolution)
  const slotHeight = (40 * resolution) / 60

  // scheduled items stored at 15 min granularity
  const [scheduled, setScheduled] = useState([]) // { item, start, duration }
  const [hoverSlot, setHoverSlot] = useState(null)
  const [dragPreview, setDragPreview] = useState(null)
  const [resizing, setResizing] = useState(null)

  const dropItem = (slotIndex, data) => {
    const start = slotIndex * (resolution / 15)
    if (data.moveId) {
      setScheduled(prev =>
        prev.map(si => (si.item.id === data.moveId ? { ...si, start } : si))
      )
    } else {
      setScheduled(prev => [...prev, { item: data, start, duration: 4 }])
    }
  }

  const handleDrop = (i, e) => {
    e.preventDefault()
    const data = JSON.parse(e.dataTransfer.getData('text'))
    dropItem(i, data)
    setHoverSlot(null)
    setDragPreview(null)
  }

  const handleDragStartScheduled = (e, si) => {
    e.dataTransfer.setData(
      'text/plain',
      JSON.stringify({ ...si.item, moveId: si.item.id })
    )
    setDragPreview({ item: si.item, slot: null })
  }

  const startResize = (e, id) => {
    e.preventDefault()
    setResizing({ id, startY: e.clientY })
  }

  const handleMouseMove = e => {
    if (!resizing) return
    const delta = e.clientY - resizing.startY
    const steps = Math.round(delta / 10)
    if (steps !== 0) {
      adjustDuration(resizing.id, steps)
      setResizing({ id: resizing.id, startY: e.clientY })
    }
  }

  const stopResize = () => setResizing(null)

  const adjustDuration = (id, delta) => {
    setScheduled(prev =>
      prev.map(si =>
        si.item.id === id
          ? { ...si, duration: Math.max(1, si.duration + delta) }
          : si
      )
    )
  }

  const markComplete = data => {
    setTasks(prev =>
      prev.map(t => {
        if (data.type === 'task' && t.id === data.id) {
          return { ...t, status: 'done' }
        }
        if (data.type === 'subtask') {
          const [tid, sid] = data.id.split('::')
          if (t.id === tid) {
            return {
              ...t,
              subtasks: (t.subtasks || []).map(s =>
                s.id === sid ? { ...s, done: true } : s
              )
            }
          }
        }
        return t
      })
    )
    setScheduled(prev => prev.filter(si => si.item.id !== data.id))
  }

  const timeLabel = index => {
    const minutes = (index * resolution) % 60
    const hours = Math.floor((index * resolution) / 60)
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#fff',
        color: '#000',
        padding: 24,
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, sans-serif'
      }}
    >
      <header style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 24, fontWeight: 700 }}>Planner</div>
        <button onClick={() => navigate('goals')} style={{ marginLeft: 'auto' }}>
          Back to Goals
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16 }}>
        <aside
          style={{
            border: '1px solid #000',
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
              onDragStart={e => {
                e.dataTransfer.setData('text/plain', JSON.stringify(it))
                setDragPreview({ item: it, slot: null })
              }}
              onDragEnd={() => {
                setDragPreview(null)
                setHoverSlot(null)
              }}
              style={{
                border: '1px solid #000',
                borderRadius: 10,
                padding: 8,
                marginBottom: 8,
                cursor: 'grab'
              }}
            >
              {it.title}
            </div>
          ))}

          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 12, marginRight: 8 }}>Granularity</label>
            <select
              value={resolution}
              onChange={e => setResolution(Number(e.target.value))}
            >
              <option value={60}>1 hour</option>
              <option value={30}>30 min</option>
              <option value={15}>15 min</option>
            </select>
          </div>
        </aside>

        <main
          onMouseMove={handleMouseMove}
          onMouseUp={stopResize}
          onMouseLeave={stopResize}
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid #000',
            borderRadius: 12,
            padding: 12,
            position: 'relative',
            height: 24 * 40
          }}
        >
          {Array.from({ length: totalSlots }).map((_, i) => (
            <div
              key={i}
              onDragEnter={() => setHoverSlot(i)}
              onDragLeave={() => setHoverSlot(null)}
              onDragOver={e => {
                e.preventDefault()
                setDragPreview(prev =>
                  prev ? { ...prev, slot: i } : prev
                )
              }}
              onDrop={e => handleDrop(i, e)}
              style={{
                height: slotHeight,
                borderBottom: '1px solid #374151',
                position: 'relative',
                background: hoverSlot === i ? '#bfdbfe' : undefined
              }}
            >
              {i % (60 / resolution) === 0 && (
                <div style={{ fontSize: 12, opacity: 0.7 }}>{timeLabel(i)}</div>
              )}
            </div>
          ))}

          {scheduled.map(si => {
            const slotSize = resolution / 15
            const startBorder = Math.floor(si.start / slotSize)
            const endBorder = Math.floor((si.start + si.duration) / slotSize)
            const topPx = si.start * 10 + startBorder
            const heightPx = si.duration * 10 + (endBorder - startBorder) - 2
            return (
              <div
                key={si.item.id}
                draggable
                onDragStart={e => handleDragStartScheduled(e, si)}
                onDragEnd={() => {
                  setDragPreview(null)
                  setHoverSlot(null)
                }}
                style={{
                  position: 'absolute',
                  left: 8,
                  right: 8,
                  top: topPx,
                  height: heightPx,
                  background: '#1e3a8a',
                  borderRadius: 6,
                  padding: 4,
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}    
                >
                  <input
                    type="checkbox"
                    onChange={() => markComplete(si.item)}
                    style={{ margin: 0 }}
                  />
                  <span>
                    {timeLabel(si.start / (resolution / 15))} – {si.item.title}
                  </span>
                </div>
                <div
                  onMouseDown={e => startResize(e, si.item.id)}
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: 4,
                    cursor: 'ns-resize'
                  }}
                />
              </div>
            )
          })}
          
          {dragPreview && dragPreview.slot !== null && (
            <div
              style={{
                position: 'absolute',
                left: 8,
                right: 8,
                top: dragPreview.slot * slotHeight,
                height:
                  ((dragPreview.item.duration || 4) * 10 - 2),
                background: 'rgba(30,58,138,0.3)',
                borderRadius: 6,
                padding: 4,
                pointerEvents: 'none'
              }}
            >
              <div>
                {timeLabel(dragPreview.slot)} – {dragPreview.item.title}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}