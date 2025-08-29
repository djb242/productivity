import React, { useEffect, useState } from 'react'
import Goals from './pages/Goals.jsx'
import Planner from './pages/Planner.jsx'
import Habits from './pages/Habits.jsx'
import { seedCategories, seedGoals, seedTasks, seedSchedules } from './lib/seeds.js'
import { db } from './lib/db.js'


export default function App(){
// single source of truth for data; passed to pages
const [categories, setCategories] = useState(seedCategories)
const [goals, setGoals] = useState(seedGoals)
const [tasks, setTasks] = useState(seedTasks)
const [schedules, setSchedules] = useState(seedSchedules)
const [loadedFromDb, setLoadedFromDb] = useState(false)


const [bgMode, setBgMode] = useState('color')
const [bgValue, setBgValue] = useState('linear-gradient(135deg,#0f172a,#1f2937)')


const [page, setPage] = useState('planner') // 'goals' | 'planner' | 'habits'
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


return (
  page==='goals'
    ? <Goals state={state} actions={actions} navigate={navigate} />
    : page==='habits'
      ? <Habits state={state} actions={actions} navigate={navigate} />
      : <Planner state={state} actions={actions} navigate={navigate} />
)
}
