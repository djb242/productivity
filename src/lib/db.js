// High-level persistence helpers. No-ops if Supabase is not configured.
import { supabase, hasSupabase } from './supabaseClient'

const nop = async () => {}

export const db = {
  hasSupabase,

  // Load everything and project into app state shapes
  async loadAll() {
    if (!hasSupabase) return null
    const [{ data: categories }, { data: goals }, { data: tasks }, { data: subtasks }, { data: schedules }, { data: habitLogs }] = await Promise.all([
      supabase.from('categories').select('*'),
      supabase.from('goals').select('*'),
      supabase.from('tasks').select('*'),
      supabase.from('subtasks').select('*'),
      supabase.from('schedules').select('*'),
      supabase.from('habit_logs').select('*')
    ])

    // Merge subtasks and habit logs into tasks array
    const subsByTask = new Map()
    for (const s of (subtasks || [])) {
      const arr = subsByTask.get(s.task_id) || []
      arr.push({ id: s.id, title: s.title, done: !!s.done })
      subsByTask.set(s.task_id, arr)
    }
    const logsByTask = new Map()
    for (const h of (habitLogs || [])) {
      const m = logsByTask.get(h.task_id) || {}
      m[h.day] = true
      logsByTask.set(h.task_id, m)
    }
    const tasksProjected = (tasks || []).map(t => ({
      id: t.id,
      goalId: t.goal_id,
      title: t.title,
      status: t.status,
      description: t.description,
      priority: t.priority,
      habitTrack: !!t.habit_track,
      subtasks: subsByTask.get(t.id) || [],
      habitLog: logsByTask.get(t.id) || {}
    }))

    const schedulesProjected = (schedules || []).map(s => ({
      id: s.id,
      taskId: s.task_id,
      kind: s.kind,
      weeklyByDay: s.weekly_by_day,
      durationMinutes: s.duration_minutes,
      earliestStart: s.earliest_start,
      latestStart: s.latest_start,
      rrule: s.rrule,
      date: s.date
    }))

    const categoriesProjected = (categories || []).map(c => ({ id: c.id, name: c.name, color: c.color }))
    const goalsProjected = (goals || []).map(g => ({ id: g.id, categoryId: g.category_id, title: g.title }))

    return {
      categories: categoriesProjected,
      goals: goalsProjected,
      tasks: tasksProjected,
      schedules: schedulesProjected
    }
  },

  // Upserts (bulk where convenient)
  async upsertCategories(categories) {
    if (!hasSupabase) return
    if (!categories?.length) return
    await supabase.from('categories').upsert(categories.map(c => ({ id: c.id, name: c.name, color: c.color })))
  },
  async upsertGoals(goals) {
    if (!hasSupabase) return
    if (!goals?.length) return
    await supabase.from('goals').upsert(goals.map(g => ({ id: g.id, category_id: g.categoryId, title: g.title })))
  },
  async upsertTasks(tasks) {
    if (!hasSupabase) return
    if (!tasks?.length) return
    await supabase.from('tasks').upsert(tasks.map(t => ({
      id: t.id,
      goal_id: t.goalId,
      title: t.title,
      status: t.status || null,
      description: t.description || null,
      priority: t.priority || null,
      habit_track: !!t.habitTrack
    })))
    // subtasks
    const allSubs = []
    tasks.forEach(t => (t.subtasks || []).forEach(s => allSubs.push({ id: s.id, task_id: t.id, title: s.title, done: !!s.done })))
    if (allSubs.length) await supabase.from('subtasks').upsert(allSubs)
  },
  async upsertSchedules(schedules) {
    if (!hasSupabase) return
    if (!schedules?.length) return
    await supabase.from('schedules').upsert(schedules.map(s => ({
      id: s.id,
      task_id: s.taskId,
      kind: s.kind,
      weekly_by_day: s.weeklyByDay || null,
      duration_minutes: s.durationMinutes || null,
      earliest_start: s.earliestStart || null,
      latest_start: s.latestStart || null,
      rrule: s.rrule || null,
      date: s.date || null
    })))
  },

  // Focused operations we call directly where needed
  async deleteTaskCascade(taskId) {
    if (!hasSupabase) return
    await supabase.from('habit_logs').delete().eq('task_id', taskId)
    await supabase.from('subtasks').delete().eq('task_id', taskId)
    await supabase.from('schedules').delete().eq('task_id', taskId)
    await supabase.from('tasks').delete().eq('id', taskId)
  },
  async deleteGoalCascade(goalId) {
    if (!hasSupabase) return
    // find tasks under the goal
    const { data: tasksData } = await supabase
      .from('tasks')
      .select('id')
      .eq('goal_id', goalId)
    const taskIds = (tasksData || []).map(t => t.id)
    if (taskIds.length) {
      await supabase.from('habit_logs').delete().in('task_id', taskIds)
      await supabase.from('subtasks').delete().in('task_id', taskIds)
      await supabase.from('schedules').delete().in('task_id', taskIds)
      await supabase.from('tasks').delete().in('id', taskIds)
    }
    await supabase.from('goals').delete().eq('id', goalId)
  },
  async deleteCategoryCascade(categoryId) {
    if (!hasSupabase) return
    // find goals under the category
    const { data: goalsData } = await supabase
      .from('goals')
      .select('id')
      .eq('category_id', categoryId)

    const goalIds = (goalsData || []).map(g => g.id)
    if (goalIds.length) {
      // find tasks under these goals
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('id')
        .in('goal_id', goalIds)
      const taskIds = (tasksData || []).map(t => t.id)
      if (taskIds.length) {
        await supabase.from('habit_logs').delete().in('task_id', taskIds)
        await supabase.from('subtasks').delete().in('task_id', taskIds)
        await supabase.from('schedules').delete().in('task_id', taskIds)
        await supabase.from('tasks').delete().in('id', taskIds)
      }
      await supabase.from('goals').delete().in('id', goalIds)
    }
    await supabase.from('categories').delete().eq('id', categoryId)
  },
  async upsertScheduleForTask(taskId, patch) {
    if (!hasSupabase) return
    // find existing
    const { data } = await supabase.from('schedules').select('id').eq('task_id', taskId).limit(1).maybeSingle()
    const row = {
      id: data?.id || `${taskId}-sched`,
      task_id: taskId,
      kind: patch.kind,
      weekly_by_day: patch.weeklyByDay || null,
      duration_minutes: patch.durationMinutes || null,
      earliest_start: patch.earliestStart || null,
      latest_start: patch.latestStart || null,
      rrule: patch.rrule || null,
      date: patch.date || null
    }
    await supabase.from('schedules').upsert(row)
  },
  async setHabitLog(taskId, dayKey, checked) {
    if (!hasSupabase) return
    if (checked) {
      await supabase.from('habit_logs').upsert({ task_id: taskId, day: dayKey, checked: true })
    } else {
      await supabase.from('habit_logs').delete().match({ task_id: taskId, day: dayKey })
    }
  }
}
