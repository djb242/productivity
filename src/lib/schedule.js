// Lightweight helpers shared by Organizer & Planner


export const WEEKDAYS = ["SU","MO","TU","WE","TH","FR","SA"]; // JS getDay() → 0..6 maps to SU..SA
export const priColor = (p) => p === 'high' ? '#ef4444' : p === 'med' ? '#f59e0b' : '#10b981';
export const uid = (p='id') => p + Math.random().toString(36).slice(2,8);
export const randomColor = () => {
const palette = ['#10b981','#6366f1','#f59e0b','#ef4444','#22d3ee','#84cc16','#a855f7','#ec4899'];
return palette[Math.floor(Math.random()*palette.length)];
};


export function weekdayCodeFor(date){
const d = (date instanceof Date)? date : new Date(date);
return WEEKDAYS[d.getDay()];
}


// Minimal occurrence check: daily/weekly and simple RRULE (FREQ=DAILY | FREQ=WEEKLY;BYDAY=..)
export function occursOnDate(schedule, date){
const code = weekdayCodeFor(date);
if(!schedule) return false;
switch(schedule.kind){
case 'daily': return true;
case 'weekly': return (schedule.weeklyByDay||[]).includes(code);
case 'once': {
  if (!schedule.date) return true;
  const dayKey = d => {
    if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    const dt = d instanceof Date ? d : new Date(d);
    return dt.toLocaleDateString('en-CA');
  };
  return dayKey(schedule.date) === dayKey(date);
}
case 'custom_rrule': {
const r = schedule.rrule||'';
if(/FREQ=DAILY/.test(r)) return true;
const m = r.match(/BYDAY=([A-Z,]+)/);
if(m){
const days = m[1].split(',');
return days.includes(code);
}
return false;
}
default: return false;
}
}


// Tiny console tests (run once in browser)
(function runScheduleTests(){
if (typeof window === 'undefined') return;
if (window.__SCHEDULE_LIB_TESTED__) return; window.__SCHEDULE_LIB_TESTED__ = true;
  try {
  console.assert(occursOnDate({kind:'daily'}, '2025-01-01') === true, 'daily occurs');
  const mon = new Date('2025-02-03T12:00:00'); // Monday
  const tue = new Date('2025-02-04T12:00:00'); // Tuesday
  const one = '2025-02-05';
  console.assert(occursOnDate({kind:'once'}, '2025-02-06') === true, 'once without date occurs');
  console.assert(occursOnDate({kind:'once', date: one}, one) === true, 'once on date');
  console.assert(occursOnDate({kind:'once', date: one}, '2025-02-06') === false, 'once not other day');
  const iso = '2025-02-05T07:15:00Z';
  console.assert(occursOnDate({kind:'once', date: iso}, one) === true, 'once iso on date');
  console.assert(occursOnDate({kind:'once', date: iso}, '2025-02-06') === false, 'once iso not other day');
  console.assert(occursOnDate({kind:'once', date: new Date(iso)}, one) === true, 'once Date object on date');
  console.assert(occursOnDate({kind:'weekly', weeklyByDay:['MO']}, mon) === true, 'weekly MO on Mon');
  console.assert(occursOnDate({kind:'weekly', weeklyByDay:['MO']}, tue) === false, 'weekly MO not Tue');
  console.assert(occursOnDate({kind:'custom_rrule', rrule:'FREQ=WEEKLY;BYDAY=TU,TH'}, tue) === true, 'RRULE BYDAY Tue');
  } catch (e) { console.error('schedule tests failed', e); }
})();