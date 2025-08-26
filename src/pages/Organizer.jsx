import React, { useMemo, useState } from 'react'
import TaskDrawer from '../components/TaskDrawer.jsx'

const uid = () => Math.random().toString(36).slice(2)

function priColor(p) {
  return p === 'high' ? '#ef4444' : p === 'med' ? '#f59e0b' : '#6ee7b7'
}

export default function Organizer({ state, actions, navigate }) {

  const { tasks, schedules } = state
  const { setTasks, setSchedules } = actions

  const [openTaskId, setOpenTaskId] = useState(null)
  const [dragTaskId, setDragTaskId] = useState(null)

  const byStatus = useMemo(
    () => ({
      todo: tasks.filter(t => t.status === 'todo'),
      doing: tasks.filter(t => t.status === 'doing'),
      done: tasks.filter(t => t.status === 'done')
    }),
    [tasks]
  )

  const scheduleFor = id => schedules.find(s => s.taskId === id) || null

  const updateTask = (id, patch) =>
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, ...patch } : t)))
  const deleteTask = id =>
    setTasks(prev => prev.filter(t => t.id !== id))

  const toggleSubtask = (tid, sid) =>
    setTasks(prev =>
      prev.map(t =>
        t.id === tid
          ? {
              ...t,
              subtasks: (t.subtasks || []).map(s =>
                s.id === sid ? { ...s, done: !s.done } : s
              )
            }
          : t
      )
    )

  const addSubtask = (tid, title) =>
    setTasks(prev =>
      prev.map(t =>
        t.id === tid
          ? {
              ...t,
              subtasks: [...(t.subtasks || []), { id: uid(), title, done: false }]
            }
          : t
      )
    )

  const upsertScheduleForTask = (tid, patch) =>
    setSchedules(prev => {
      const ex = prev.find(s => s.taskId === tid)
      if (ex) return prev.map(s => (s.taskId === tid ? { ...ex, ...patch } : s))
      return [...prev, { id: uid(), taskId: tid, ...patch }]
    })

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
        <div style={{ fontSize: 24, fontWeight: 700, color: '#9ca3af' }}>
          Organizer (simplified)
        </div>
        <button
          onClick={() => navigate('planner')}
          style={{
            marginLeft: 'auto',
            background: '#111827',
            border: '1px solid #374151',
            padding: '8px 12px',
            borderRadius: 12,
            cursor: 'pointer'
          }}
        >
          Go to Planner
        </button>
      </header>

      <div style={{ display: 'flex', gap: 16 }}>
        {['todo', 'doing', 'done'].map(col => (
          <Column
            key={col}
            title={col.toUpperCase()}
            onDrop={() => {
              if (!dragTaskId) return
              updateTask(dragTaskId, { status: col })
              setDragTaskId(null)
            }}
          >
            {byStatus[col].map(t => (
              <TaskCard
                key={t.id}
                task={t}
                onOpen={() => setOpenTaskId(t.id)}
                onDragStart={() => setDragTaskId(t.id)}
                onDelete={() => deleteTask(t.id)}
              />
            ))}
          </Column>
        ))}
      </div>

      {openTaskId && (
        <TaskDrawer
          task={tasks.find(t => t.id === openTaskId)}
          schedule={scheduleFor(openTaskId)}
          onClose={() => setOpenTaskId(null)}
          onPatch={patch => updateTask(openTaskId, patch)}
          onToggleSub={sid => toggleSubtask(openTaskId, sid)}
          onAddSub={title => addSubtask(openTaskId, title)}
          onDelete={() => deleteTask(openTaskId)}
          onSaveSchedule={patch => upsertScheduleForTask(openTaskId, patch)}
        />  
      )}
    </div>
  )
}

function Column({ title, children, onDrop }) {
  return (
    <div
      style={{
        flex: 1,
        background: 'rgba(255,255,255,0.04)',
        border: '2px solid #94a3b8',
        borderRadius: 16,
        padding: 12,
        minHeight: 420,
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)'
      }}
      onDragOver={e => e.preventDefault()}
      onDrop={e => {
        e.preventDefault()
        onDrop()
      }}
    >
      <div
        style={{
          fontWeight: 600,
          opacity: 0.7,
          marginBottom: 8,
          textAlign: 'center',
          letterSpacing: 0.4
        }}
      >
        {title}
      </div>
      {children}
    </div>
  )
}

function TaskCard({ task, onOpen, onDragStart, onDelete }) {
  const eligible = false
  return (
    <div
      style={{
        background: '#0b1220',
        border: '1px solid #374151',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        cursor: 'grab'
      }}
      draggable
      onDragStart={onDragStart}
    >
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
      >
        <div style={{ fontWeight: 600 }}>{task.title}</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            style={{
              background: 'transparent',
              border: '1px solid #334155',
              padding: '4px 8px',
              borderRadius: 8,
              cursor: 'pointer'
            }}
            onClick={onOpen}
          >
            Edit
          </button>
          <button
            style={{
              background: 'transparent',
              border: '1px solid #7f1d1d',
              padding: '4px 8px',
              borderRadius: 8,
              cursor: 'pointer',
              color: '#fecaca'
            }}
            onClick={onDelete}
          >
            Delete
          </button>
        </div>
      </div>
      {task.priority && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '2px 8px',
            borderRadius: 999,
            border: '1px solid #334155',
            fontSize: 12
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: priColor(task.priority)
            }}
          />
          {task.priority}
        </span>
      )}
      {eligible && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '2px 8px',
            borderRadius: 999,
            border: '1px solid #334155',
            fontSize: 12,
            marginLeft: 8
          }}
        >
          eligible today
        </span>
      )}
      {task.due && (
        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
          Due: {task.due}
        </div>
      )}
      {task.description && (
        <div style={{ fontSize: 12, opacity: 0.9, marginTop: 6 }}>
          {task.description}
        </div>
      )}
      {task.subtasks && task.subtasks.length > 0 && (
        <div style={{ fontSize: 12, opacity: 0.9, marginTop: 6 }}>
          {task.subtasks.filter(s => s.done).length}/{task.subtasks.length} subtasks
        </div>
      )}
    </div>
  )
}