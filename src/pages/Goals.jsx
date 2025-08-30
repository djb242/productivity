import React, { useState } from 'react'
import TaskDrawer from '../components/TaskDrawer.jsx'
import { db } from '../lib/db.js'

export default function Goals({ state, actions, navigate }) {
  const { categories, goals, tasks, schedules } = state
  const { setCategories, setGoals, setTasks, setSchedules } = actions

  const rand = () => Math.random().toString(36).slice(2)

  const [categoryId, setCategoryId] = useState(null)
  const [goalId, setGoalId] = useState(null)
  const [openTaskId, setOpenTaskId] = useState(null)
  const [newCategory, setNewCategory] = useState('')
  const [newGoal, setNewGoal] = useState('')
  const [newTask, setNewTask] = useState('')

  const scheduleFor = id => schedules.find(s => s.taskId === id) || null

  const updateTask = (id, patch) =>
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, ...patch } : t)))
  const deleteTask = id => {
    setTasks(prev => prev.filter(t => t.id !== id))
    db.deleteTaskCascade(id).catch(() => {})
  }

  const addCategory = name =>
    setCategories(prev => [...prev, { id: rand(), name, color: '#fff' }])
  const renameCategory = (id, name) =>
    setCategories(prev => prev.map(c => (c.id === id ? { ...c, name } : c)))

  const addGoal = title =>
    setGoals(prev => [...prev, { id: rand(), categoryId, title }])
  const renameGoal = (id, title) =>
    setGoals(prev => prev.map(g => (g.id === id ? { ...g, title } : g)))

  const addTask = title =>
    setTasks(prev => [...prev, { id: rand(), goalId, title }])
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
              subtasks: [...(t.subtasks || []), { id: Math.random().toString(36).slice(2), title, done: false }]
            }
          : t
      )
    )

  const upsertScheduleForTask = (tid, patch) => {
    setSchedules(prev => {
      const ex = prev.find(s => s.taskId === tid)
      if (ex) return prev.map(s => (s.taskId === tid ? { ...ex, ...patch } : s))
      return [...prev, { id: Math.random().toString(36).slice(2), taskId: tid, ...patch }]
    })
    db.upsertScheduleForTask(tid, patch).catch(() => {})
  }

  const tasksForGoal = tasks.filter(t => t.goalId === goalId)

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
      <header
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          marginBottom: 28,
          padding: 18,
          border: '1px solid var(--border)',
          borderRadius: 16,
          background: 'var(--surface-elev)',
          boxShadow: '0 1px 3px rgba(15,23,42,0.08)'
        }}
      >
        <div style={{ fontSize: 34, fontWeight: 900 }}>Goals</div>
        <button onClick={() => navigate('planner')} style={{ marginLeft: 'auto' }}>
          Planner
        </button>
        <button onClick={() => navigate('habits')}>Habits</button>
      </header>

      {!categoryId && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(540px, 1fr))', gap: 24 }}>
            {categories.map(c => (
              <div
                key={c.id}
                onClick={() => setCategoryId(c.id)}
                style={{
                  border: '1px solid var(--border)',
                  padding: 28,
                  borderRadius: 18,
                  cursor: 'pointer',
                  background: 'linear-gradient(160deg, rgba(var(--primary-rgb),0.06), rgba(255,255,255,0.9))',
                  boxShadow: '0 6px 22px rgba(var(--primary-rgb),0.12)',
                  transition: 'transform 160ms ease, box-shadow 160ms ease, background 160ms ease',
                  fontSize: 22,
                  fontWeight: 700,
                  minHeight: 160
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)'
                  e.currentTarget.style.boxShadow = '0 24px 60px rgba(var(--primary-rgb),0.20)'
                  e.currentTarget.style.background = 'linear-gradient(160deg, rgba(var(--primary-rgb),0.10), rgba(255,255,255,0.95))'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = ''
                  e.currentTarget.style.boxShadow = '0 6px 22px rgba(var(--primary-rgb),0.12)'
                  e.currentTarget.style.background = 'linear-gradient(160deg, rgba(var(--primary-rgb),0.06), rgba(255,255,255,0.9))'
                }}
              >
                {c.name}
                <button
                  onClick={e => {
                    e.stopPropagation()
                    const name = prompt('Rename category', c.name)
                    if (name) renameCategory(c.id, name)
                  }}
                  style={{ marginLeft: 8 }}
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
          <form
            onSubmit={e => {
              e.preventDefault()
              const name = newCategory.trim()
              if (name) {
                addCategory(name)
                setNewCategory('')
              }
            }}
            style={{ marginTop: 12 }}
          >
            <input
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              placeholder="New category"
            />
            <button type="submit" style={{ marginLeft: 8 }}>Add</button>
          </form>
        </div>
      )}

      {categoryId && !goalId && (
        <div>
          <button onClick={() => setCategoryId(null)} style={{ marginBottom: 12 }}>
            ← Back to Categories
          </button>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(540px, 1fr))', gap: 24 }}>
            {goals
              .filter(g => g.categoryId === categoryId)
              .map(g => (
                <div
                  key={g.id}
                  onClick={() => setGoalId(g.id)}
                  style={{
                    border: '1px solid var(--border)',
                    padding: 24,
                    borderRadius: 18,
                    cursor: 'pointer',
                    background: 'linear-gradient(160deg, rgba(var(--primary-rgb),0.06), rgba(255,255,255,0.9))',
                    boxShadow: '0 6px 22px rgba(var(--primary-rgb),0.12)',
                    transition: 'transform 160ms ease, box-shadow 160ms ease, background 160ms ease',
                    fontSize: 22,
                    fontWeight: 700,
                    minHeight: 140
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)'
                    e.currentTarget.style.boxShadow = '0 24px 60px rgba(var(--primary-rgb),0.20)'
                    e.currentTarget.style.background = 'linear-gradient(160deg, rgba(var(--primary-rgb),0.10), rgba(255,255,255,0.95))'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = ''
                    e.currentTarget.style.boxShadow = '0 6px 22px rgba(var(--primary-rgb),0.12)'
                    e.currentTarget.style.background = 'linear-gradient(160deg, rgba(var(--primary-rgb),0.06), rgba(255,255,255,0.9))'
                  }}
                >
                  {g.title}
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      const t = prompt('Rename goal', g.title)
                      if (t) renameGoal(g.id, t)
                    }}
                    style={{ marginLeft: 8 }}
                  >
                    Edit
                  </button>
                </div>
              ))}
          </div>
          <form
            onSubmit={e => {
              e.preventDefault()
              const t = newGoal.trim()
              if (t) {
                addGoal(t)
                setNewGoal('')
              }
            }}
            style={{ marginTop: 12 }}
          >
            <input
              value={newGoal}
              onChange={e => setNewGoal(e.target.value)}
              placeholder="New goal"
            />
            <button type="submit" style={{ marginLeft: 8 }}>Add</button>
          </form>
        </div>
      )}

      {goalId && (
        <div>
          <button onClick={() => setGoalId(null)} style={{ marginBottom: 12 }}>
            ← Back to Goals
          </button>
          <form
            onSubmit={e => {
              e.preventDefault()
              const t = newTask.trim()
              if (t) {
                addTask(t)
                setNewTask('')
              }
            }}
            style={{ marginBottom: 20 }}
          >
            <input
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              placeholder="New task"
              maxLength={120}
            />
            <button type="submit" style={{ marginLeft: 8 }}>Add</button>
          </form>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(620px, 1fr))', gap: 24 }}>
            {tasksForGoal.map(t => (
              <div
                key={t.id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 16,
                  padding: 22,
                  marginBottom: 0,
                  background: 'linear-gradient(160deg, rgba(var(--primary-rgb),0.04), rgba(255,255,255,0.96))',
                  boxShadow: '0 6px 22px rgba(var(--primary-rgb),0.10)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>{t.title}</div>
                  <button onClick={() => setOpenTaskId(t.id)}>Edit</button>
                </div>
                {(t.subtasks || []).length > 0 && (
                  <ul style={{ marginTop: 12 }}>
                    {(t.subtasks || []).map(s => (
                      <li key={s.id} style={{ opacity: s.done ? 0.6 : 1, fontSize: 16 }}>{s.title}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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
