import React, { useState } from 'react'
import ScheduleEditor from './ScheduleEditor.jsx'

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  drawer: {
    background: '#fff',
    border: '1px solid #000',
    color: '#000',
    borderRadius: 12,
    padding: 16,
    width: 400,
    maxHeight: '80vh',
    overflowY: 'auto'
  },
  section: { marginTop: 16 }
}

export default function TaskDrawer({
  task,
  schedule,
  onClose,
  onPatch,
  onToggleSub,
  onAddSub,
  onRenameSub,
  onDelete,
  onSaveSchedule
}) {
  const [title, setTitle] = useState(task.title)
  const [notes, setNotes] = useState(task.description || '')
  const [newSub, setNewSub] = useState('')

  const commit = () => {
    const patch = {}
    if (title !== task.title) patch.title = title
    if ((notes || '') !== (task.description || '')) patch.description = notes
    if (Object.keys(patch).length) onPatch(patch)
  }

  const submitSub = e => {
    e.preventDefault()
    const t = newSub.trim()
    if (t) onAddSub(t)
    setNewSub('')
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.drawer}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 700 }}>Edit Task</div>
          <button onClick={onClose}>Close</button>
        </div>

        <div style={styles.section}>
          <label style={{ display: 'block', fontSize: 12, opacity: 0.8 }}>
            Title
          </label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={commit}
            maxLength={120}
            style={{ width: '100%', padding: 6, borderRadius: 6 }}
          />
        </div>

        <div style={styles.section}>
          <label style={{ display: 'block', fontSize: 12, opacity: 0.8 }}>
            Notes
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            onBlur={commit}
            placeholder="Add notes for this task..."
            rows={6}
            style={{ width: '100%', padding: 8, borderRadius: 8, resize: 'vertical' }}
          />
        </div>

          <div style={styles.section}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Subtasks</div>
          {(task.subtasks || []).map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <input
                type="checkbox"
                checked={s.done}
                onChange={() => onToggleSub(s.id)}
              />
              <span
                title={s.title}
                style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}
                onDoubleClick={() => {
                  if (!onRenameSub) return
                  const t = prompt('Rename subtask', s.title)
                  if (t && t !== s.title) onRenameSub(s.id, t)
                }}
              >
                {s.title}
              </span>
            </div>
          ))}
          <form onSubmit={submitSub} style={{ marginTop: 4 }}>
            <input
              value={newSub}
              onChange={e => setNewSub(e.target.value)}
              placeholder="New subtask"
              style={{ padding: 4, width: '70%' }}
            />
            <button type="submit" style={{ marginLeft: 8 }}>
              Add
            </button>
          </form>
        </div>

        <div style={styles.section}>
          <ScheduleEditor schedule={schedule} onChange={onSaveSchedule} />
        </div>

        {schedule && schedule.kind !== 'once' && (
          <div style={styles.section}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={!!task.habitTrack}
                onChange={e => onPatch({ habitTrack: e.target.checked })}
              />
              Track as habit
            </label>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
              When checked, completions log to the Habits page instead of marking the task done.
            </div>
          </div>
        )}

        <div style={styles.section}>
          <button
            onClick={onDelete}
            style={{ border: '1px solid #000' }}
          >
            Delete Task
          </button>
        </div>
      </div>
    </div>
  )
}
