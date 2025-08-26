// Demo data for initial run
export const seedCategories = [
{ id: 'c1', name: 'Health', color: '#10b981' },
{ id: 'c2', name: 'Career', color: '#6366f1' },
{ id: 'c3', name: 'Family', color: '#f59e0b' },
{ id: 'c4', name: 'Finance', color: '#ef4444' },
];


export const seedGoals = [
{ id: 'g1', categoryId: 'c1', title: 'Run a half‑marathon' },
{ id: 'g2', categoryId: 'c1', title: 'Hit 10% body fat' },
{ id: 'g3', categoryId: 'c2', title: 'Ship personal SaaS MVP' },
{ id: 'g4', categoryId: 'c4', title: '$100k invested' },
];


export const seedTasks = [
{ id: 't1', goalId: 'g1', title: 'Follow 12‑week plan', status: 'todo', description: 'Base → Tempo → Peak.', priority: 'med', subtasks:[{id:'st1', title:'Buy shoes', done:false},{id:'st2', title:'Book race', done:false}] },
{ id: 't2', goalId: 'g1', title: 'Long run 8mi', status: 'doing', due: new Date(Date.now()+86400000).toISOString().slice(0,10), priority: 'high' },
{ id: 't3', goalId: 'g3', title: 'Design schema', status: 'todo', description: 'Users→Categories→Goals→Tasks→Subtasks.', priority: 'high' },
{ id: 't4', goalId: 'g3', title: 'Build task board', status: 'done', description: 'Drag & drop columns', priority: 'med' },
];


export const seedSchedules = [
{ id: 's1', taskId: 't1', kind: 'weekly', weeklyByDay: ['SA'], durationMinutes: 60, earliestStart: '06:00', latestStart: '10:00', rrule: null },
{ id: 's2', taskId: 't2', kind: 'daily', weeklyByDay: null, durationMinutes: 60, earliestStart: null, latestStart: null, rrule: null },
];