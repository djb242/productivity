import React, { useState } from 'react'
import Goals from './pages/Goals.jsx'
import Planner from './pages/Planner.jsx'
import { seedCategories, seedGoals, seedTasks, seedSchedules } from './lib/seeds.js'


export default function App(){
// single source of truth for data; passed to pages
const [categories, setCategories] = useState(seedCategories)
const [goals, setGoals] = useState(seedGoals)
const [tasks, setTasks] = useState(seedTasks)
const [schedules, setSchedules] = useState(seedSchedules)


const [bgMode, setBgMode] = useState('color')
const [bgValue, setBgValue] = useState('linear-gradient(135deg,#0f172a,#1f2937)')


const [page, setPage] = useState('goals') // 'goals' | 'planner'
const navigate = (p)=> setPage(p)


const state = { categories, goals, tasks, schedules, bgMode, bgValue }
const actions = { setCategories, setGoals, setTasks, setSchedules, setBgMode, setBgValue }


return page==='goals'
? <Goals state={state} actions={actions} navigate={navigate} />
: <Planner state={state} actions={actions} navigate={navigate} />
}