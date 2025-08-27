import React from 'react'
import { WEEKDAYS } from '../lib/schedule'

const fld = {
  width: '100%',
  background: '#fff',
  border: '1px solid #000',
  color: '#000',
  padding: 8,
  borderRadius: 10
}

const chip = active => ({
  padding: '4px 8px',
  borderRadius: 999,
  border: '1px solid #000',
  background: '#fff',
  opacity: active ? 1 : 0.5,
  cursor: 'pointer'
})

export default function ScheduleEditor({ schedule, onChange }) {
  const s =
    schedule || {
      kind: 'once',
      durationMinutes: 60,
      weeklyByDay: null,
      earliestStart: null,
      latestStart: null,
      rrule: ''
    }
  const set = patch => onChange({ ...s, ...patch })

    return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <label style={{ fontSize: 12, opacity: 0.8 }}>Kind</label>
          <select
            value={s.kind}
            onChange={e => set({ kind: e.target.value })}
            style={fld}
          >
            <option value="once">One-time</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="custom_rrule">Custom RRULE</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, opacity: 0.8 }}>Duration (minutes)</label>
          <input
            type="number"
            min={5}
            step={5}
            value={s.durationMinutes || 60}
            onChange={e =>
              set({ durationMinutes: Number(e.target.value) || 60 })
            }
            style={fld}
          />
        </div>
      </div>

      {s.kind === 'weekly' && (
        <div style={{ marginTop: 8 }}>
          <label style={{ fontSize: 12, opacity: 0.8 }}>Days</label>
          <div
            style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}
          >
            {WEEKDAYS.map(code => {
              const cur = new Set(s.weeklyByDay || [])
              const active = cur.has(code)
              return (
                <span
                  key={code}
                  style={chip(active)}
                  onClick={() => {
                    active ? cur.delete(code) : cur.add(code)
                    set({ weeklyByDay: Array.from(cur) })
                  }}
                >
                  {code}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {s.kind === 'custom_rrule' && (
        <div style={{ marginTop: 8 }}>
          <label style={{ fontSize: 12, opacity: 0.8 }}>
            RRULE (e.g., FREQ=WEEKLY;BYDAY=MO,WE)
          </label>
          <input
            value={s.rrule || ''}
            onChange={e => set({ rrule: e.target.value })}
            style={fld}
          />
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          marginTop: 8
        }}
      >
        <div>
          <label style={{ fontSize: 12, opacity: 0.8 }}>
            Earliest start (optional)
          </label>
          <input
            type="time"
            value={s.earliestStart || ''}
            onChange={e =>
              set({ earliestStart: e.target.value || null })
            }
            style={fld}
          />
        </div>
        <div>
          <label style={{ fontSize: 12, opacity: 0.8 }}>
            Latest start (optional)
          </label>
          <input
            type="time"
            value={s.latestStart || ''}
            onChange={e => set({ latestStart: e.target.value || null })}
            style={fld}
          />
        </div>
      </div>
    </div>
  )
}