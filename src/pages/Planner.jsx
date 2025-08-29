import React, { useCallback, useMemo, useState, useEffect } from 'react'
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
  const timeGutter = 56 // px reserved for hour labels inside each day
  const itemInsetLeft = timeGutter // boxes start just right of time labels
  const itemInsetRight = 12 // keep slight right margin

  // date helpers
  const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
  const dateKey = d => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const da = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${da}`
  }
  const [anchorDate, setAnchorDate] = useState(() => startOfDay(new Date()))
  const dayOffsets = [-1, 0, 1]
  const dayDates = useMemo(() => dayOffsets.map(off => addDays(anchorDate, off)), [anchorDate])
  const dayKeys = useMemo(() => dayDates.map(d => dateKey(d)), [dayDates])
  const formatDayHeader = d =>
    d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  const todayKey = dateKey(startOfDay(new Date()))

  // scheduled items stored at 15 min granularity
  const [scheduled, setScheduled] = useState([]) // { item, date, start, duration }
  const [hover, setHover] = useState(null) // { day, slot }
  const [dragPreview, setDragPreview] = useState(null) // { item, day, slot }
  const [resizing, setResizing] = useState(null)

  // persist scheduled items locally so day movements show correctly across sessions
  useEffect(() => {
    try {
      const raw = localStorage.getItem('planner.scheduled.v1')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setScheduled(parsed)
      }
    } catch (e) {}
  }, [])
  useEffect(() => {
    try {
      localStorage.setItem('planner.scheduled.v1', JSON.stringify(scheduled))
    } catch (e) {}
  }, [scheduled])

  const dropItem = (dayIndex, slotIndex, data) => {
    const start = slotIndex * (resolution / 15)
    const date = dayKeys[dayIndex]
    if (data.moveId) {
      setScheduled(prev =>
        prev.map(si => (si.item.id === data.moveId ? { ...si, date, start } : si))
      )
    } else {
      setScheduled(prev => [...prev, { item: data, date, start, duration: 4 }])
    }
  }

  const handleDrop = (dayIndex, i, e) => {
    e.preventDefault()
    const data = JSON.parse(e.dataTransfer.getData('text'))
    dropItem(dayIndex, i, data)
    setHover(null)
    setDragPreview(null)
  }

  const handleDragStartScheduled = (e, si) => {
    e.dataTransfer.setData(
      'text/plain',
      JSON.stringify({ ...si.item, moveId: si.item.id })
    )
    setDragPreview({ item: si.item, day: null, slot: null })
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

  const markComplete = (data, dayKeyOverride = null) => {
    const logKey = dayKeyOverride || (new Date()).toLocaleDateString('en-CA')
    setTasks(prev =>
      prev.map(t => {
        if (data.type === 'task' && t.id === data.id) {
          const sched = scheduleFor(t.id)
          const isRepeating = sched && sched.kind !== 'once'
          if (isRepeating && t.habitTrack) {
            const log = { ...(t.habitLog || {}) }
            log[logKey] = true
            return { ...t, habitLog: log }
          }
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
        background: 'var(--bg)',
        color: 'var(--text)',
        padding: 24,
        maxWidth: 1200,
        margin: '0 auto'
      }}
    >
      <header style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, padding: 10, border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface-elev)', boxShadow: '0 1px 3px rgba(15,23,42,0.08)' }}>
        <div style={{ fontSize: 24, fontWeight: 700 }}>Planner</div>
        <button onClick={() => navigate('habits')} style={{ marginLeft: 'auto' }}>
          Habits
        </button>
        <button onClick={() => navigate('goals')}>
          Back to Goals
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16 }}>
        <aside
          style={{
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 12,
            background: 'var(--surface)',
            boxShadow: '0 1px 3px rgba(15,23,42,0.08)'
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
                setDragPreview({ item: it, day: null, slot: null })
              }}
              onDragEnd={() => {
                setDragPreview(null)
                setHover(null)
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
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 12,
            position: 'relative',
            boxShadow: '0 1px 3px rgba(15,23,42,0.08)'
          }}
        >
          {/* Date navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <button onClick={() => setAnchorDate(prev => addDays(prev, -1))}>{'←'}</button>
            <button
              onClick={() => setAnchorDate(startOfDay(new Date()))}
              style={{ background: 'linear-gradient(180deg, var(--primary), var(--primary-700))', color: '#fff', borderColor: 'transparent' }}
            >
              Today
            </button>
            <button onClick={() => setAnchorDate(prev => addDays(prev, 1))}>{'→'}</button>
            <input
              type="date"
              value={dateKey(anchorDate)}
              onChange={e => {
                const v = e.target.value
                if (v) setAnchorDate(startOfDay(new Date(v)))
              }}
              style={{ marginLeft: 8 }}
            />
          </div>
          {/* Headers: day names */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(3, 1fr)`, gap: 12, marginBottom: 8 }}>
            {dayDates.map((d, di) => {
              const isToday = dateKey(d) === todayKey
              const label = isToday ? `Today — ${formatDayHeader(d)}` : formatDayHeader(d)
              return (
                <div key={di} style={{ fontWeight: 700, textAlign: 'center', color: isToday ? 'var(--primary)' : undefined }}>{label}</div>
              )
            })}
          </div>

          {/* Grid: three day columns, each includes its own time labels */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(3, 1fr)`, gap: 12 }}>

            {[0,1,2].map(dayIndex => (
              <div
                key={dayIndex}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  overflow: 'hidden',
                  background: '#fff',
                  boxShadow: '0 1px 3px rgba(15,23,42,0.08)'
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    height: 24 * 40,
                    backgroundImage:
                      `repeating-linear-gradient(to bottom, #e5e7eb 0, #e5e7eb 1px, transparent 1px, transparent ${slotHeight}px),` +
                      `repeating-linear-gradient(to bottom, #9ca3af 0, #9ca3af 1px, transparent 1px, transparent ${40}px)`
                  }}
                >
                  {Array.from({ length: totalSlots }).map((_, i) => (
                    <div
                      key={i}
                      onDragEnter={() => setHover({ day: dayIndex, slot: i })}
                      onDragLeave={() => setHover(null)}
                      onDragOver={e => {
                        e.preventDefault()
                        setDragPreview(prev => (prev ? { ...prev, day: dayIndex, slot: i } : prev))
                      }}
                      onDrop={e => handleDrop(dayIndex, i, e)}
                      style={{
                        height: slotHeight,
                        position: 'relative',
                        background: hover && hover.day === dayIndex && hover.slot === i ? 'var(--primary-50)' : undefined
                      }}
                    >
                      {i % (60 / resolution) === 0 && (
                        <div
                          style={{
                            position: 'absolute',
                            left: 0,
                            width: timeGutter - 8,
                            paddingRight: 6,
                            textAlign: 'right',
                            top: 0,
                            fontSize: 12,
                            color: 'var(--muted)',
                            pointerEvents: 'none'
                          }}
                        >
                          {timeLabel(i)}
                        </div>
                      )}
                    </div>
                  ))}

                  {scheduled.filter(si => si.date === dayKeys[dayIndex]).map(si => {
            const slotSize = resolution / 15 // 15-min units per visual slot
            const unitPx = slotHeight / slotSize // px per 15 minutes
            const startUnits = si.start
            const durationUnits = si.duration
            const startBorder = Math.floor(startUnits / slotSize)
            const endBorder = Math.floor((startUnits + durationUnits) / slotSize)
            // align block top exactly with slot top (no border offset)
            const topPx = startUnits * unitPx
            // height maps directly to duration in units (no border adjustments)
            const heightPx = durationUnits * unitPx
            return (
              <div
                key={si.item.id}
                draggable
                onDragStart={e => handleDragStartScheduled(e, si)}
                onDragEnd={() => {
                  setDragPreview(null)
                  setHover(null)
                }}
                style={{
                  position: 'absolute',
                  left: itemInsetLeft,
                  right: itemInsetRight,
                  top: topPx,
                  height: heightPx,
                  boxSizing: 'border-box',
                  background: 'linear-gradient(180deg, var(--primary), var(--primary-700))',
                  color: '#fff',
                  border: '1px solid rgba(0,0,0,0.06)',
                  borderRadius: 8,
                  padding: 6,
                  overflow: 'hidden',
                  zIndex: 1,
                  boxShadow: '0 10px 22px rgba(79,70,229,0.25)',
                  transition: 'transform 120ms ease, box-shadow 120ms ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 14px 28px rgba(79,70,229,0.3)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 10px 22px rgba(79,70,229,0.25)' }}
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
                    onChange={() => markComplete(si.item, dayKeys[dayIndex])}
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
                    height: 6,
                    cursor: 'ns-resize',
                    background: 'rgba(255,255,255,0.35)'
                  }}
                />
              </div>
            )
                })}

                {dragPreview && dragPreview.slot !== null && dragPreview.day === dayIndex && (() => {
            const slotSize = resolution / 15 // 15-min units per visual slot
            const unitPx = slotHeight / slotSize // px per 15 minutes
            const startUnits = dragPreview.slot * slotSize
            const durationUnits = dragPreview.item.duration || 4
            const startBorder = Math.floor(startUnits / slotSize)
            const endBorder = Math.floor((startUnits + durationUnits) / slotSize)
            const previewTop = startUnits * unitPx
            const previewHeight = durationUnits * unitPx
            return (
              <div
                style={{
                  position: 'absolute',
                  left: itemInsetLeft,
                  right: itemInsetRight,
                  top: previewTop,
                  height: previewHeight,
                  boxSizing: 'border-box',
                  background: 'rgba(79,70,229,0.25)',
                  borderRadius: 6,
                  padding: 4,
                  pointerEvents: 'none',
                  zIndex: 1
                }}
              >
                <div>
                  {timeLabel(dragPreview.slot)} – {dragPreview.item.title}
                </div>
              </div>
            )
                })()}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
