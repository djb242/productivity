import React, { useEffect, useState } from 'react'
import Goals from './pages/Goals.jsx'
import Planner from './pages/Planner.jsx'
import Habits from './pages/Habits.jsx'
import Todos from './pages/Todos.jsx'
import WritersDashboard from './pages/WritersDashboard.jsx'
import { seedCategories, seedGoals, seedTasks, seedSchedules } from './lib/seeds.js'
import { db } from './lib/db.js'


export default function App(){
// Local storage helpers to keep data across reloads when not using Supabase
const lk = (k) => `productivity.${k}.v1`
const readLocal = (k, fallback) => {
  try { const raw = localStorage.getItem(lk(k)); return raw ? JSON.parse(raw) : fallback } catch { return fallback }
}
const writeLocal = (k, value) => { try { localStorage.setItem(lk(k), JSON.stringify(value)) } catch {} }

// single source of truth for data; passed to pages
const useSeeds = !db.hasSupabase
const [categories, setCategories] = useState(() => useSeeds ? readLocal('categories', seedCategories) : [])
const [goals, setGoals] = useState(() => useSeeds ? readLocal('goals', seedGoals) : [])
const [tasks, setTasks] = useState(() => useSeeds ? readLocal('tasks', seedTasks) : [])
const [schedules, setSchedules] = useState(() => useSeeds ? readLocal('schedules', seedSchedules) : [])
const [loadedFromDb, setLoadedFromDb] = useState(false)


const [bgMode, setBgMode] = useState(() => readLocal('bgMode', 'color'))
const [bgValue, setBgValue] = useState(() => readLocal('bgValue', 'linear-gradient(135deg,#0f172a,#1f2937)'))


// pages: 'goals' | 'planner' | 'habits' | 'todos' | 'writers'
const [page, setPage] = useState(() => readLocal('page', 'planner'))
const navigate = (p)=> setPage(p)


const state = { categories, goals, tasks, schedules, bgMode, bgValue }
const actions = { setCategories, setGoals, setTasks, setSchedules, setBgMode, setBgValue }


// One-time load from Supabase if configured
useEffect(() => {
  (async () => {
    if (!db.hasSupabase) return
    const data = await db.loadAll().catch(() => null)
    if (data) {
      setCategories(data.categories || [])
      setGoals(data.goals || [])
      setTasks(data.tasks || [])
      setSchedules(data.schedules || [])
    }
    setLoadedFromDb(true)
  })()
}, [])

// Best-effort background upserts when data changes (after initial load)
useEffect(() => { if (db.hasSupabase && loadedFromDb) db.upsertCategories(categories).catch(()=>{}) }, [categories, loadedFromDb])
useEffect(() => { if (db.hasSupabase && loadedFromDb) db.upsertGoals(goals).catch(()=>{}) }, [goals, loadedFromDb])
useEffect(() => { if (db.hasSupabase && loadedFromDb) db.upsertTasks(tasks).catch(()=>{}) }, [tasks, loadedFromDb])
useEffect(() => { if (db.hasSupabase && loadedFromDb) db.upsertSchedules(schedules).catch(()=>{}) }, [schedules, loadedFromDb])

// Persist to localStorage on change when not using Supabase (optional cache)
useEffect(() => { if (useSeeds) writeLocal('categories', categories) }, [categories])
useEffect(() => { if (useSeeds) writeLocal('goals', goals) }, [goals])
useEffect(() => { if (useSeeds) writeLocal('tasks', tasks) }, [tasks])
useEffect(() => { if (useSeeds) writeLocal('schedules', schedules) }, [schedules])
useEffect(() => { writeLocal('bgMode', bgMode) }, [bgMode])
useEffect(() => { writeLocal('bgValue', bgValue) }, [bgValue])
useEffect(() => { writeLocal('page', page) }, [page])


return (
  page==='goals'
    ? <Goals state={state} actions={actions} navigate={navigate} />
    : page==='habits'
      ? <Habits state={state} actions={actions} navigate={navigate} />
      : page==='todos'
        ? <Todos state={state} actions={actions} navigate={navigate} />
        : page==='writers'
          ? <WritersDashboard navigate={navigate} />
          : <Planner state={state} actions={actions} navigate={navigate} />
)
}
