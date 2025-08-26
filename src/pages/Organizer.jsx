export default function Organizer({ state, actions, navigate }) {
import React, { useMemo, useState } from 'react';
{view==='goals' && (
<div style={styles.grid}>
{currentGoals.map(g => (
<div key={g.id} style={styles.card(currentCategory?.color||'#334155')} onClick={()=>{ setActiveGoalId(g.id); setView('tasks'); }}>
<div style={{ fontWeight:700, fontSize:18, marginBottom:8 }}>{g.title}</div>
<div style={{ opacity:0.8, fontSize:12 }}>{tasks.filter(t=>t.goalId===g.id).length} tasks</div>
<div style={{ position:'absolute', top:8, right:8, display:'flex', gap:6 }}>
<button style={styles.subtleButton} onClick={(e)=>{ e.stopPropagation(); renameGoal(g.id); }}>Rename</button>
<button style={styles.subtleButton} onClick={(e)=>{ e.stopPropagation(); deleteGoal(g.id); }}>Delete</button>
</div>
</div>
))}
{currentGoals.length===0 && (<div style={{ opacity:.8 }}>No goals in this category yet.</div>)}
</div>
)}


{view==='tasks' && (
    <div>
        <div style={{ display:'flex', gap:8, marginBottom:12 }}>
<button style={styles.button} onClick={()=>{ setView('goals'); setOpenTaskId(null); }}>Back to Category</button>
        </div>
        <div style={styles.columns}>
            {['todo','doing','done'].map(col => (
                <Column key={col} title={col.toUpperCase()} onDrop={()=>{ if(!dragTaskId) return; setTasks(prev=> prev.map(t=> t.id===dragTaskId?{...t,status:col}:t)); setDragTaskId(null); }}>
                {byStatus[col].map(t => (
                    <TaskCard key={t.id} task={t} schedule={scheduleFor(t.id)} onOpen={()=> setOpenTaskId(t.id)} onDragStart={()=> setDragTaskId(t.id)} onDelete={()=> deleteTask(t.id)} /> 
                    ))}
                </Column>
                ))}
        </div>
        {openTaskId && (
        <TaskDrawer
        task={tasks.find(t=>t.id===openTaskId)}
        schedule={scheduleFor(openTaskId)}
        onClose={()=> setOpenTaskId(null)}
        onPatch={(patch)=> updateTask(openTaskId, patch)}
        onToggleSub={(sid)=> toggleSubtask(openTaskId, sid)}
        onAddSub={(title)=> addSubtask(openTaskId, title)}
        onDelete={()=> deleteTask(openTaskId)}
        onSaveSchedule={(patch)=> upsertScheduleForTask(openTaskId, patch)}
        />
        )}
    </div>
)}


function Column({ title, children, onDrop }){
return (
<div style={{ background:'rgba(255,255,255,0.04)', border:'2px solid #94a3b8', borderRadius:16, padding:12, minHeight:420, boxShadow:'inset 0 0 0 1px rgba(0,0,0,0.05)' }}
onDragOver={(e)=> e.preventDefault()} onDrop={(e)=>{ e.preventDefault(); onDrop(); }}>
<div style={{ fontWeight:600, opacity:.7, marginBottom:8, textAlign:'center', letterSpacing:.4 }}>{title}</div>
{children}
</div>
)
}


function TaskCard({ task, schedule, onOpen, onDragStart, onDelete }){
const eligible = schedule ? occursOnDate(schedule, new Date()) : false
return (
<div style={{ background:'#0b1220', border:'1px solid #374151', borderRadius:12, padding:12, marginBottom:8, cursor:'grab' }} draggable onDragStart={onDragStart}>
<div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
<div style={{ fontWeight:600 }}>{task.title}</div>
<div style={{ display:'flex', gap:6 }}>
<button style={{ background:'transparent', border:'1px solid #334155', padding:'4px 8px', borderRadius:8, cursor:'pointer' }} onClick={onOpen}>Edit</button>
<button style={{ background:'transparent', border:'1px solid #7f1d1d', padding:'4px 8px', borderRadius:8, cursor:'pointer', color:'#fecaca' }} onClick={onDelete}>Delete</button>
</div>
</div>
{task.priority && (
<span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'2px 8px', borderRadius:999, border:'1px solid #334155', fontSize:12 }}>
<span style={{ width:8, height:8, borderRadius:999, background: priColor(task.priority) }} />{task.priority}
</span>
)}
{eligible && (<span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'2px 8px', borderRadius:999, border:'1px solid #334155', fontSize:12, marginLeft:8 }}>eligible today</span>)}
{task.due && (<div style={{ fontSize:12, opacity:.8, marginTop:6 }}>Due: {task.due}</div>)}
{task.description && (<div style={{ fontSize:12, opacity:.9, marginTop:6 }}>{task.description}</div>)}
{task.subtasks && task.subtasks.length>0 && (<div style={{ fontSize:12, opacity:.9, marginTop:6 }}>{task.subtasks.filter(s=>s.done).length}/{task.subtasks.length} subtasks</div>)}
</div>
)
}
}