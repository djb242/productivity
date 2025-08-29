import React, { useMemo, useState } from 'react'
import { db } from '../lib/db'

export default function Habits({ state, actions, navigate }) {
  const { tasks } = state
  const { setTasks } = actions

  const tracked = useMemo(() => tasks.filter(t => t.habitTrack), [tasks])

  const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
  const dateKey = d => d.toLocaleDateString('en-CA')

  const [anchor, setAnchor] = useState(startOfDay(new Date()))
  const [days, setDays] = useState(14)
  const dates = useMemo(() => Array.from({length: days}, (_,i)=> addDays(anchor, -(days-1-i))), [anchor, days])
  const keys = useMemo(() => dates.map(dateKey), [dates])

  const toggle = (taskId, key) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t
      const log = { ...(t.habitLog || {}) }
      const newVal = !log[key]
      if (newVal) log[key] = true; else delete log[key]
      // persist when available (fire and forget)
      db.setHabitLog(taskId, key, newVal).catch(()=>{})
      return { ...t, habitLog: log }
    }))
  }

  const completionRate = (t) => {
    const log = t.habitLog || {}
    const count = keys.reduce((acc,k)=> acc + (log[k] ? 1 : 0), 0)
    return `${count}/${keys.length}`
  }

  const cell = (t, k) => {
    const checked = !!(t.habitLog && t.habitLog[k])
    return (
      <div
        key={k}
        onClick={() => toggle(t.id, k)}
        title={k}
        style={{
          width: 18,
          height: 18,
          borderRadius: 4,
          border: '1px solid var(--border)',
          background: checked ? 'var(--primary)' : '#fff',
          boxShadow: checked ? '0 1px 2px rgba(15,23,42,0.06)' : '0 1px 2px rgba(15,23,42,0.04) inset',
          transition: 'background 120ms ease, transform 120ms ease, box-shadow 120ms ease',
          cursor: 'pointer'
        }}
      />
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: 10, border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface-elev)', boxShadow: '0 1px 3px rgba(15,23,42,0.08)' }}>
        <div style={{ fontSize: 24, fontWeight: 700 }}>Habits</div>
        <button onClick={() => navigate('planner')} style={{ marginLeft: 'auto' }}>Back to Planner</button>
      </header>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <button onClick={() => setAnchor(a => addDays(a, -1))}>{'←'}</button>
        <button onClick={() => setAnchor(startOfDay(new Date()))} style={{ background: 'linear-gradient(180deg, var(--primary), var(--primary-700))', color: '#fff', borderColor: 'transparent' }}>Today</button>
        <button onClick={() => setAnchor(a => addDays(a, 1))}>{'→'}</button>
        <input type="date" value={dateKey(anchor)} onChange={e => e.target.value && setAnchor(startOfDay(new Date(e.target.value)))} />
        <select value={days} onChange={e => setDays(Number(e.target.value))}>
          <option value={7}>7 days</option>
          <option value={14}>14 days</option>
          <option value={28}>28 days</option>
        </select>
      </div>

      {tracked.length === 0 && (
        <div style={{ opacity: 0.8 }}>No habits yet. Edit a repeating task and enable “Track as habit”.</div>
      )}

      {tracked.length > 0 && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 12, overflowX: 'auto', background: 'var(--surface)', boxShadow: '0 1px 3px rgba(15,23,42,0.08)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `240px repeat(${keys.length}, 22px) 80px`, alignItems: 'center', gap: 8 }}>
            <div style={{ fontWeight: 600 }}>Task</div>
            {dates.map((d,i) => (
              <div key={i} style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>{d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}</div>
            ))}
            <div style={{ fontWeight: 600, textAlign: 'center' }}>Rate</div>

            {tracked.map(t => (
              <React.Fragment key={t.id}>
                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                {keys.map(k => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'center' }}>
                    {cell(t, k)}
                  </div>
                ))}
                <div style={{ textAlign: 'center' }}>{completionRate(t)}</div>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
