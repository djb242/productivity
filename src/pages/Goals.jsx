import React, { useState } from 'react'
import TaskDrawer from '../components/TaskDrawer.jsx'
import Nav from '../components/Nav.jsx'
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
    setSchedules(prev => prev.filter(s => s.taskId !== id))
    setOpenTaskId(prev => (prev === id ? null : prev))
    db.deleteTaskCascade(id).catch(() => {})
  }

  const addCategory = name => {
    const cat = { id: rand(), name, color: '#fff' }
    setCategories(prev => [...prev, cat])
    db.upsertCategories([cat]).catch(() => {})
  }
  const renameCategory = (id, name) => {
    setCategories(prev => prev.map(c => (c.id === id ? { ...c, name } : c)))
    const c = categories.find(x => x.id === id)
    if (c) db.upsertCategories([{ id, name, color: c.color }]).catch(() => {})
  }

  const deleteCategoryCascade = id => {
    // derive affected goals and tasks
    const goalIds = goals.filter(g => g.categoryId === id).map(g => g.id)
    const taskIds = tasks.filter(t => goalIds.includes(t.goalId)).map(t => t.id)
    // update local state
    setTasks(prev => prev.filter(t => !taskIds.includes(t.id)))
    setSchedules(prev => prev.filter(s => !taskIds.includes(s.taskId)))
    setGoals(prev => prev.filter(g => g.categoryId !== id))
    setCategories(prev => prev.filter(c => c.id !== id))
    if (goalId && goalIds.includes(goalId)) setGoalId(null)
    if (categoryId === id) setCategoryId(null)
    // best-effort remote cascade
    db.deleteCategoryCascade(id).catch(() => {})
  }

  const addGoal = title => {
    const g = { id: rand(), categoryId, title }
    setGoals(prev => [...prev, g])
    db.upsertGoals([g]).catch(() => {})
  }
  const renameGoal = (id, title) => {
    setGoals(prev => prev.map(g => (g.id === id ? { ...g, title } : g)))
    const g = goals.find(x => x.id === id)
    if (g) db.upsertGoals([{ id, categoryId: g.categoryId, title }]).catch(() => {})
  }

  const deleteGoalCascade = id => {
    const taskIds = tasks.filter(t => t.goalId === id).map(t => t.id)
    setTasks(prev => prev.filter(t => t.goalId !== id))
    setSchedules(prev => prev.filter(s => !taskIds.includes(s.taskId)))
    setGoals(prev => prev.filter(g => g.id !== id))
    if (openTaskId && taskIds.includes(openTaskId)) setOpenTaskId(null)
    if (goalId === id) setGoalId(null)
    db.deleteGoalCascade(id).catch(() => {})
  }

  const addTask = title => {
    const t = { id: rand(), goalId, title }
    setTasks(prev => [...prev, t])
    db.upsertTasks([t]).catch(() => {})
  }
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
    <div className="min-h-screen max-w-6xl mx-auto px-4 py-6">
      <Nav active="goals" navigate={navigate} />

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
                <button
                  onClick={e => {
                    e.stopPropagation()
                    if (confirm('Delete this category and all its goals and tasks?')) {
                      deleteCategoryCascade(c.id)
                    }
                  }}
                  style={{ marginLeft: 8 }}
                >
                  Delete
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              {categories.find(c => c.id === categoryId)?.name || 'Category'}
            </div>
            <div>
              <button
                onClick={() => {
                  const c = categories.find(x => x.id === categoryId)
                  if (!c) return
                  if (confirm(`Delete category "${c.name}" and all its goals and tasks?`)) {
                    deleteCategoryCascade(categoryId)
                  }
                }}
              >
                Delete Category
              </button>
            </div>
          </div>
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
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      if (confirm('Delete this goal and all its tasks?')) {
                        deleteGoalCascade(g.id)
                      }
                    }}
                    style={{ marginLeft: 8 }}
                  >
                    Delete
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              {goals.find(g => g.id === goalId)?.title || 'Goal'}
            </div>
            <div>
              <button
                onClick={() => {
                  const g = goals.find(x => x.id === goalId)
                  if (!g) return
                  if (confirm(`Delete goal \"${g.title}\" and all its tasks?`)) {
                    deleteGoalCascade(goalId)
                  }
                }}
              >
                Delete Goal
              </button>
            </div>
          </div>
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
                  <div>
                    <button onClick={() => setOpenTaskId(t.id)}>Edit</button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this task?')) deleteTask(t.id)
                      }}
                      style={{ marginLeft: 8 }}
                    >
                      Delete
                    </button>
                  </div>
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
