import React from 'react'

export default function Nav({ active = 'planner', navigate }) {
  const items = [
    { key: 'planner', label: 'Planner' },
    { key: 'goals', label: 'Goals' },
    { key: 'habits', label: 'Habits' },
    { key: 'todos', label: 'Todos' },
    { key: 'writers', label: 'Writer' }
  ]
  const title = items.find(i => i.key === active)?.label || 'Productivity'
  return (
    <div className="sticky top-0 z-40 bg-white/75 backdrop-blur border border-zinc-200 rounded-2xl px-4 py-3 mb-5 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="text-xl font-extrabold tracking-tight">{title}</div>
        <div className="ml-auto flex items-center gap-2">
          {items.map(i => {
            const isActive = i.key === active
            const cls = isActive
              ? 'bg-blue-600 text-white shadow'
              : 'bg-white text-zinc-800 border border-zinc-300 hover:bg-zinc-100'
            return (
              <button
                key={i.key}
                aria-current={isActive ? 'page' : undefined}
                className={`h-9 px-3 rounded-lg text-sm transition ${cls}`}
                onClick={() => (i.key !== active ? navigate?.(i.key) : null)}
              >
                {i.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

