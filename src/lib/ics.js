// ICS parsing helpers using ical.js
// Exposes parseIcsOccurrences(icsText, rangeStart, rangeEnd)
// Returns array of { uid, summary, start, end, allDay, location }

import ICAL from 'ical.js'

function toJsDate(icalTime) {
  // ical.js returns ICAL.Time which can be converted to JS Date
  // For date-only, treat as local midnight
  if (!icalTime) return null
  return icalTime.toJSDate()
}

// Expand a single VEVENT into occurrences within [rangeStart, rangeEnd]
function expandEvent(vevent, rangeStart, rangeEnd) {
  const event = new ICAL.Event(vevent)
  const results = []

  // If recurring, iterate; else push raw event if overlapping
  // Start iterator slightly before the window to catch occurrences that
  // begin just before the range and span into it (e.g., long meetings).
  const iterStartJS = new Date(rangeStart.getTime() - 24 * 60 * 60 * 1000)
  const zone = event.startDate?.zone || ICAL.Timezone.localTimezone
  const rstart = ICAL.Time.fromJSDate(iterStartJS, zone)
  const rend = ICAL.Time.fromJSDate(rangeEnd, zone)

  if (event.isRecurring()) {
    const it = event.iterator(rstart)
    let next
    while ((next = it.next())) {
      // Stop when start after range end
      if (next.compare(rend) >= 0) break
      const { item, startDate, endDate } = event.getOccurrenceDetails(next)
      const jsStart = toJsDate(startDate)
      let jsEnd = toJsDate(endDate)
      // Guard against missing/invalid end
      if (!jsEnd || jsEnd <= jsStart) {
        jsEnd = new Date(jsStart.getTime() + 60 * 60 * 1000)
      }
      // If occurrence overlaps the window, include it
      if (jsEnd > rangeStart && jsStart < rangeEnd) {
        results.push({
          uid: item.getFirstPropertyValue('uid') || `${jsStart.toISOString()}-${item.toString().length}`,
          summary: item.getFirstPropertyValue('summary') || '(no title)',
          start: jsStart,
          end: jsEnd,
          allDay: startDate.isDate && endDate.isDate,
          location: item.getFirstPropertyValue('location') || ''
        })
      }
    }
  } else {
    const jsStart = toJsDate(event.startDate)
    let jsEnd = toJsDate(event.endDate)
    if (!jsEnd || jsEnd <= jsStart) {
      jsEnd = new Date(jsStart.getTime() + 60 * 60 * 1000)
    }
    if (jsEnd > rangeStart && jsStart < rangeEnd) {
      results.push({
        uid: vevent.getFirstPropertyValue('uid') || `${jsStart.toISOString()}-${vevent.toString().length}`,
        summary: vevent.getFirstPropertyValue('summary') || '(no title)',
        start: jsStart,
        end: jsEnd,
        allDay: event.startDate.isDate && event.endDate.isDate,
        location: vevent.getFirstPropertyValue('location') || ''
      })
    }
  }

  return results
}

export function parseIcsOccurrences(icsText, rangeStart, rangeEnd) {
  try {
    const jcal = ICAL.parse(icsText)
    const comp = new ICAL.Component(jcal)
    const vEvents = comp.getAllSubcomponents('vevent') || []
    const out = []
    for (const v of vEvents) {
      out.push(...expandEvent(v, rangeStart, rangeEnd))
    }
    if (out.length > 0) return out
    // Fallback scanner for feeds that use unsupported TZIDs or edge formats.
    return fallbackScan(icsText, rangeStart, rangeEnd)
  } catch (e) {
    console.error('ICS parse error', e)
    // Attempt a best-effort fallback if the formal parser fails
    try { return fallbackScan(icsText, rangeStart, rangeEnd) } catch (_) { return [] }
  }
}

// ---- Fallback, lightweight VEVENT scanner (no RRULE expansion) ----
function fallbackScan(icsText, rangeStart, rangeEnd) {
  const blocks = icsText.split(/\r?\nBEGIN:VEVENT\r?\n/).slice(1)
  const out = []
  for (const b of blocks) {
    const body = b.split(/\r?\nEND:VEVENT\r?\n?/)[0] || ''
    // Unfold lines (RFC 5545)
    const unfolded = body.replace(/\r?\n[ \t]/g, '')
    const sum = matchProp(unfolded, 'SUMMARY') || '(no title)'
    // DTSTART
    const dtstart = matchDateTime(unfolded, 'DTSTART')
    if (!dtstart) continue
    // DTEND optional; if missing, infer 1 hour or 1 day for all-day
    let dtend = matchDateTime(unfolded, 'DTEND')
    if (!dtend) {
      const dur = matchDuration(unfolded)
      if (dur) {
        dtend = new Date(dtstart.date.getTime() + dur)
      }
    }
    if (!dtend) {
      dtend = dtstart.isDate
        ? new Date(new Date(dtstart.date.getFullYear(), dtstart.date.getMonth(), dtstart.date.getDate() + 1))
        : new Date(dtstart.date.getTime() + 60 * 60 * 1000)
    }
    const start = dtstart.date
    const end = dtend.date

    const rrule = matchProp(unfolded, 'RRULE')
    if (rrule) {
      // Simple RRULE expansion for common cases
      const rule = parseRrule(rrule)
      const occurrences = expandSimpleRrule(rule, dtstart, end - start, rangeStart, rangeEnd)
      for (const occStart of occurrences) {
        const occEnd = new Date(occStart.getTime() + (end - start))
        out.push({
          uid: matchProp(unfolded, 'UID') || `${occStart.toISOString()}-${sum.length}`,
          summary: sum,
          start: occStart,
          end: occEnd,
          allDay: !!dtstart.isDate,
          location: matchProp(unfolded, 'LOCATION') || ''
        })
      }
    } else {
      if (end > rangeStart && start < rangeEnd) {
        out.push({
          uid: matchProp(unfolded, 'UID') || `${start.toISOString()}-${sum.length}`,
          summary: sum,
          start,
          end,
          allDay: !!dtstart.isDate,
          location: matchProp(unfolded, 'LOCATION') || ''
        })
      }
    }
  }
  return out
}

function matchProp(text, prop) {
  const re = new RegExp(`${prop}:([^\r\n]*)`, 'i')
  const m = text.match(re)
  return m ? decodeText(m[1]) : ''
}

function decodeText(s) {
  try {
    return s.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';')
  } catch (_) {
    return s
  }
}

function matchDateTime(text, prop) {
  // Examples:
  // DTSTART;VALUE=DATE:20250910
  // DTSTART;TZID=America/Los_Angeles:20250910T090000
  // DTSTART:20250910T090000Z
  const re = new RegExp(`${prop}(?:;[^:]*)?:([0-9]{8})(?:T([0-9]{6})(Z)?)?`, 'i')
  const m = text.match(re)
  if (!m) return null
  const y = parseInt(m[1].slice(0, 4), 10)
  const mo = parseInt(m[1].slice(4, 6), 10) - 1
  const d = parseInt(m[1].slice(6, 8), 10)
  if (!m[2]) {
    // Date-only
    return { isDate: true, date: new Date(y, mo, d) }
  }
  const hh = parseInt(m[2].slice(0, 2), 10)
  const mm = parseInt(m[2].slice(2, 4), 10)
  const ss = parseInt(m[2].slice(4, 6), 10)
  if (m[3] === 'Z') {
    // UTC
    return { isDate: false, date: new Date(Date.UTC(y, mo, d, hh, mm, ss)) }
  }
  // Treat as local time if no Z
  return { isDate: false, date: new Date(y, mo, d, hh, mm, ss) }
}

function matchDuration(text) {
  // DURATION in ISO 8601 format, e.g., P1D, PT1H30M, P2DT3H
  const re = /DURATION:([^\r\n]+)/i
  const m = text.match(re)
  if (!m) return 0
  const s = m[1].trim()
  // Parse very simply: P[n]D, PT[n]H, PT[n]M, PT[n]S, combos
  const rx = /^P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/i
  const mm = s.match(rx)
  if (!mm) return 0
  const weeks = parseInt(mm[1] || '0', 10)
  const days = parseInt(mm[2] || '0', 10)
  const hours = parseInt(mm[3] || '0', 10)
  const mins = parseInt(mm[4] || '0', 10)
  const secs = parseInt(mm[5] || '0', 10)
  return (((weeks * 7 + days) * 24 + hours) * 60 + mins) * 60 * 1000 + secs * 1000
}

// Parse a basic RRULE string into an object we can use for simple expansion
function parseRrule(rr) {
  const parts = {}
  rr.split(';').forEach(p => {
    const [k, v] = p.split('=')
    if (!k || typeof v === 'undefined') return
    parts[k.trim().toUpperCase()] = v.trim()
  })
  const out = {
    freq: (parts.FREQ || '').toUpperCase(),
    interval: parseInt(parts.INTERVAL || '1', 10),
    byday: [],
    until: null
  }
  if (parts.BYDAY) {
    out.byday = parts.BYDAY.split(',').map(code => codeToWeekday(code))
  }
  if (parts.UNTIL) {
    const md = parts.UNTIL.match(/^(\d{8})(?:T(\d{6})Z?)?$/)
    if (md) {
      const y = parseInt(md[1].slice(0, 4), 10)
      const mo = parseInt(md[1].slice(4, 6), 10) - 1
      const d = parseInt(md[1].slice(6, 8), 10)
      if (md[2]) {
        const hh = parseInt(md[2].slice(0, 2), 10)
        const mm = parseInt(md[2].slice(2, 4), 10)
        const ss = parseInt(md[2].slice(4, 6), 10)
        out.until = new Date(Date.UTC(y, mo, d, hh, mm, ss))
      } else {
        out.until = new Date(y, mo, d)
      }
    }
  }
  return out
}

function codeToWeekday(code) {
  // Maps MO..SU to JS getDay (0=Sun..6=Sat)
  const m = code.slice(-2).toUpperCase()
  const map = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 }
  return map[m]
}

function expandSimpleRrule(rule, dtstart, durationMs, rangeStart, rangeEnd) {
  const occ = []
  if (!rule || !rule.freq) return occ
  const start = dtstart.date
  const startTime = { h: start.getHours(), m: start.getMinutes(), s: start.getSeconds() }
  const isAllDay = !!dtstart.isDate
  const addOcc = (d) => {
    const when = isAllDay
      ? new Date(d.getFullYear(), d.getMonth(), d.getDate())
      : new Date(d.getFullYear(), d.getMonth(), d.getDate(), startTime.h, startTime.m, startTime.s)
    const end = new Date(when.getTime() + durationMs)
    if (end > rangeStart && when < rangeEnd) occ.push(when)
  }

  const until = rule.until || rangeEnd
  if (rule.freq === 'DAILY') {
    // Step by interval days from dtstart
    let d = new Date(Math.max(rangeStart.getTime(), start.getTime()))
    // Align to the same time as start
    if (!isAllDay) d.setHours(startTime.h, startTime.m, startTime.s, 0)
    // back up to the nearest occurrence boundary
    const diffDays = Math.floor((d - start) / (24*60*60*1000))
    const offset = ((diffDays % rule.interval) + rule.interval) % rule.interval
    d = new Date(d.getTime() + (rule.interval - offset) * 24*60*60*1000)
    while (d <= until && d < rangeEnd) {
      addOcc(d)
      d = new Date(d.getTime() + rule.interval * 24*60*60*1000)
    }
  } else if (rule.freq === 'WEEKLY') {
    const by = rule.byday && rule.byday.length ? rule.byday : [start.getDay()]
    // iterate days across the range, checking weekday matches every interval weeks
    const msWeek = 7 * 24*60*60*1000
    const startWeekStart = startOfWeek(start)
    // find first week index in range
    let cursor = new Date(startOfWeek(new Date(Math.max(rangeStart.getTime(), start.getTime()))))
    while (cursor <= until && cursor < rangeEnd) {
      // check interval in weeks from start week
      const weeksFromStart = Math.round((cursor - startWeekStart) / msWeek)
      if (weeksFromStart % rule.interval === 0) {
        for (const wk of by) {
          const d = new Date(cursor.getTime() + wk * 24*60*60*1000)
          if (d >= start && d <= until) addOcc(d)
        }
      }
      cursor = new Date(cursor.getTime() + msWeek)
    }
  }
  return occ
}

function startOfWeek(d) {
  const dd = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const day = dd.getDay() // 0=Sun
  dd.setDate(dd.getDate() - day)
  return dd
}
