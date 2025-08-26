import React, { useState } from 'react'
import TaskDrawer from '../components/TaskDrawer.jsx'

export default function Goals({ state, actions, navigate }) {
  const { categories, goals, tasks, schedules } = state
  const { setTasks, setSchedules } = actions

  const [categoryId, setCategoryId] = useState(null)
  const [goalId, setGoalId] = useState(null)
  const [openTaskId, setOpenTaskId] = useState(null)

  const scheduleFor = id => schedules.find(s => s.taskId === id) || null

  const updateTask = (id, patch) =>
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, ...patch } : t)))
  const deleteTask = id => setTasks(prev => prev.filter(t => t.id !== id))

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
              subtasks: [...(t.subtasks || []), { id: Math.random().toString(36).slice(2), title, done: false }]
            }
          : t
      )
    )

  const upsertScheduleForTask = (tid, patch) =>
    setSchedules(prev => {
      const ex = prev.find(s => s.taskId === tid)
      if (ex) return prev.map(s => (s.taskId === tid ? { ...ex, ...patch } : s))
      return [...prev, { id: Math.random().toString(36).slice(2), taskId: tid, ...patch }]
    })

  const tasksForGoal = tasks.filter(t => t.goalId === goalId)

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
        <div style={{ fontSize: 24, fontWeight: 700, color: '#9ca3af' }}>Goals</div>
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

      {!categoryId && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {categories.map(c => (
            <div
              key={c.id}
              onClick={() => setCategoryId(c.id)}
              style={{
                background: c.color,
                padding: 16,
                borderRadius: 12,
                cursor: 'pointer'
              }}
            >
              {c.name}
            </div>
          ))}
        </div>
      )}

      {categoryId && !goalId && (
        <div>
          <button
            onClick={() => setCategoryId(null)}
            style={{
              marginBottom: 12,
              background: 'transparent',
              border: '1px solid #374151',
              padding: '4px 8px',
              borderRadius: 8,
              cursor: 'pointer'
            }}
          >
            ← Back to Categories
          </button>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {goals
              .filter(g => g.categoryId === categoryId)
              .map(g => (
                <div
                  key={g.id}
                  onClick={() => setGoalId(g.id)}
                  style={{
                    border: '1px solid #374151',
                    padding: 12,
                    borderRadius: 12,
                    cursor: 'pointer'
                  }}
                >
                  {g.title}
                </div>
              ))}
          </div>
        </div>
      )}

      {goalId && (
        <div>
          <button
            onClick={() => setGoalId(null)}
            style={{
              marginBottom: 12,
              background: 'transparent',
              border: '1px solid #374151',
              padding: '4px 8px',
              borderRadius: 8,
              cursor: 'pointer'
            }}
          >
            ← Back to Goals
          </button>
          <div>
            {tasksForGoal.map(t => (
              <div
                key={t.id}
                style={{
                  border: '1px solid #374151',
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 8
                }}
              >
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div>{t.title}</div>
                  <button
                    onClick={() => setOpenTaskId(t.id)}
                    style={{
                      background: 'transparent',
                      border: '1px solid #334155',
                      padding: '4px 8px',
                      borderRadius: 8,
                      cursor: 'pointer'
                    }}
                  >
                    Edit
                  </button>
                </div>
                {t.subtasks && t.subtasks.length > 0 && (
                  <ul style={{ marginTop: 8 }}>
                    {t.subtasks.map(s => (
                      <li key={s.id} style={{ opacity: s.done ? 0.6 : 1 }}>
                        {s.title}
                      </li>
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
          onDelete={() => deleteTask(openTaskId)}
          onSaveSchedule={patch => upsertScheduleForTask(openTaskId, patch)}
        />
      )}
    </div>
  )
}