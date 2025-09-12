import React, { useMemo, useState } from 'react'
import TaskDrawer from '../components/TaskDrawer.jsx'
import Nav from '../components/Nav.jsx'
import { db } from '../lib/db.js'

export default function Todos({ state, actions, navigate }) {
  const { categories, goals, tasks, schedules } = state
  const { setTasks, setSchedules } = actions

  const [openTaskId, setOpenTaskId] = useState(null)
  const [newInboxTask, setNewInboxTask] = useState('')

  const rand = () => Math.random().toString(36).slice(2)

  const scheduleFor = id => schedules.find(s => s.taskId === id) || null

  const addInboxTask = title => {
    const t = { id: rand(), title }
    setTasks(prev => [...prev, t])
    db.upsertTasks([t]).catch(() => {})
  }

  const addTaskForGoal = (goalId, title) => {
    const t = { id: rand(), goalId, title }
    setTasks(prev => [...prev, t])
    db.upsertTasks([t]).catch(() => {})
  }

  const updateTask = (id, patch) =>
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, ...patch } : t)))

  const deleteTask = id => {
    setTasks(prev => prev.filter(t => t.id !== id))
    setSchedules(prev => prev.filter(s => s.taskId !== id))
    setOpenTaskId(prev => (prev === id ? null : prev))
    db.deleteTaskCascade(id).catch(() => {})
  }

  const toggleDone = id =>
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, status: t.status === 'done' ? null : 'done' } : t)))

  const toggleSubtask = (tid, sid) =>
    setTasks(prev =>
      prev.map(t =>
        t.id === tid
          ? {
              ...t,
              subtasks: (t.subtasks || []).map(s => (s.id === sid ? { ...s, done: !s.done } : s))
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
              subtasks: [...(t.subtasks || []), { id: rand(), title, done: false }]
            }
          : t
      )
    )

  const renameSubtask = (tid, sid, title) =>
    setTasks(prev =>
      prev.map(t =>
        t.id === tid
          ? {
              ...t,
              subtasks: (t.subtasks || []).map(s => (s.id === sid ? { ...s, title } : s))
            }
          : t
      )
    )

  const upsertScheduleForTask = (tid, patch) => {
    setSchedules(prev => {
      const ex = prev.find(s => s.taskId === tid)
      if (ex) return prev.map(s => (s.taskId === tid ? { ...ex, ...patch } : s))
      return [...prev, { id: rand(), taskId: tid, ...patch }]
    })
    db.upsertScheduleForTask(tid, patch).catch(() => {})
  }

  const inboxTasks = useMemo(() => tasks.filter(t => !t.goalId && t.status !== 'done'), [tasks])
  const tasksByGoal = useMemo(() => {
    const m = new Map()
    tasks.forEach(t => {
      if (t.goalId && t.status !== 'done') {
        const arr = m.get(t.goalId) || []
        arr.push(t)
        m.set(t.goalId, arr)
      }
    })
    return m
  }, [tasks])

  const GoalList = ({ goal }) => {
    const [newTask, setNewTask] = useState('')
    const goalTasks = tasksByGoal.get(goal.id) || []
    return (
      <div style={{ border: '1px solid var(--border)', borderRadius: 14, padding: 14, background: 'var(--surface)', boxShadow: '0 1px 3px rgba(15,23,42,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 800 }}>{goal.title}</div>
        </div>
        <form
          onSubmit={e => {
            e.preventDefault()
            const t = newTask.trim()
            if (t) {
              addTaskForGoal(goal.id, t)
              setNewTask('')
            }
          }}
          style={{ marginTop: 8, display: 'flex', gap: 8 }}
        >
          <input value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="Add task" />
          <button type="submit">Add</button>
        </form>
        <ul style={{ marginTop: 10 }}>
          {goalTasks.map(t => (
            <li key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
              <input type="checkbox" checked={t.status === 'done'} onChange={() => toggleDone(t.id)} />
              <span
                title={t.title}
                onClick={() => setOpenTaskId(t.id)}
                style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer', fontWeight: 600 }}
              >
                {t.title}
              </span>
              <button onClick={() => setOpenTaskId(t.id)}>Edit</button>
              <button onClick={() => deleteTask(t.id)}>Delete</button>
            </li>
          ))}
          {goalTasks.length === 0 && (
            <li style={{ opacity: 0.7 }}>No open tasks.</li>
          )}
        </ul>
      </div>
    )
  }

  return (
    <div className="min-h-screen max-w-6xl mx-auto px-4 py-6">
      <Nav active="todos" navigate={navigate} />

      {/* Freestanding (Inbox) to-do list */}
      <section style={{ border: '1px solid var(--border)', borderRadius: 16, padding: 16, background: 'var(--surface)', boxShadow: '0 1px 3px rgba(15,23,42,0.08)', marginBottom: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Freestanding To-Do List</div>
        <form
          onSubmit={e => {
            e.preventDefault()
            const t = newInboxTask.trim()
            if (t) {
              addInboxTask(t)
              setNewInboxTask('')
            }
          }}
          style={{ display: 'flex', gap: 8, marginBottom: 10 }}
        >
          <input value={newInboxTask} onChange={e => setNewInboxTask(e.target.value)} placeholder="Add a task" />
          <button type="submit">Add</button>
        </form>
        <ul>
          {inboxTasks.map(t => (
            <li key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
              <input type="checkbox" checked={t.status === 'done'} onChange={() => toggleDone(t.id)} />
              <span
                title={t.title}
                onClick={() => setOpenTaskId(t.id)}
                style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer', fontWeight: 600 }}
              >
                {t.title}
              </span>
              <button onClick={() => setOpenTaskId(t.id)}>Edit</button>
              <button onClick={() => deleteTask(t.id)}>Delete</button>
            </li>
          ))}
          {inboxTasks.length === 0 && (
            <li style={{ opacity: 0.7 }}>No open tasks.</li>
          )}
        </ul>
      </section>

      {/* Per-goal to-do lists organized by category */}
      <section>
        {categories.map(cat => (
          <div key={cat.id} style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>{cat.name}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 16 }}>
              {goals.filter(g => g.categoryId === cat.id).map(g => (
                <GoalList key={g.id} goal={g} />
              ))}
              {goals.filter(g => g.categoryId === cat.id).length === 0 && (
                <div style={{ opacity: 0.7 }}>No goals in this category.</div>
              )}
            </div>
          </div>
        ))}
      </section>

      {openTaskId && (
        <TaskDrawer
          task={tasks.find(t => t.id === openTaskId)}
          schedule={scheduleFor(openTaskId)}
          onClose={() => setOpenTaskId(null)}
          onPatch={patch => updateTask(openTaskId, patch)}
          onToggleSub={sid => toggleSubtask(openTaskId, sid)}
          onAddSub={title => addSubtask(openTaskId, title)}
          onRenameSub={(sid, title) => renameSubtask(openTaskId, sid, title)}
          onDelete={() => deleteTask(openTaskId)}
          onSaveSchedule={patch => upsertScheduleForTask(openTaskId, patch)}
        />
      )}
    </div>
  )
}
