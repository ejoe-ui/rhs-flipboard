/**
 * cowboy-wire-core.js  v3.1
 * ─────────────────────────────────────────────────────────────
 * Single source of truth for ALL Cowboy Wire logic.
 * Imported by display.html, mobile.html, and admin.html.
 * Per-classroom identity lives in config.js (loaded first).
 *
 * Modules:
 *   1.  CONFIG DEFAULTS
 *   2.  BELL SCHEDULES
 *   3.  ACADEMIC CALENDAR (no-school dates, overrides)
 *   4.  SCHEDULE DETECTION
 *   5.  PERIOD TIMER
 *   6.  BIRTHDAYS  (DoNotDisplay filtered)
 *   7.  COUNTDOWNS
 *   8.  FACT BANK
 *   9.  WEATHER
 *  10.  DAILY MENU
 *  11.  SUPABASE HELPERS (screens, messages, honor roll, countdowns)
 *  12.  DO NOT DISPLAY FILTER (privacy — FERPA)
 *  13.  CALENDAR (Google Apps Script feed)
 *  14.  PASSABLE (live hall pass data)
 *  15.  CODE BEHAVIOR SCREENS
 *  16.  SCREEN BUILDERS (one per content type)
 *  17.  SLOT INJECTION ENGINE
 *  18.  UTILITY HELPERS
 * ─────────────────────────────────────────────────────────────
 */

/* ═══════════════════════════════════════════════════════════
   1. CONFIG DEFAULTS
   config.js is loaded before this file and sets CLASSROOM_CONFIG.
   These are safe fallbacks if a key is missing.
═══════════════════════════════════════════════════════════ */
const CW = (() => {
  const cfg = (typeof CLASSROOM_CONFIG !== 'undefined') ? CLASSROOM_CONFIG : {};
  return {
    room:          cfg.room          || '27',
    teacher:       cfg.teacher       || 'MR. JOE',
    badge:         cfg.badge         || 'RHS · ROOM 27',
    supabaseUrl:   cfg.supabaseUrl   || 'https://lgsfrhibzxjwcudjvfzx.supabase.co',
    supabaseKey:   cfg.supabaseKey   || (typeof SUPABASE_KEY !== 'undefined' ? SUPABASE_KEY : ''),
    calScriptUrl:  cfg.calScriptUrl  || 'https://script.google.com/macros/s/AKfycbwdoA4UVuCyq8RU7hP6dBrRWAMVcMqq-0DNmZE09j6oVst1iPa7KzWq7raoCT3i0SL_/exec',
    sheetUrl:      cfg.sheetUrl      || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSjqIQ3rsr_tr62T492hu3iEuXaNJnm9ayyAa6qgJGxm2YF5CsH9PStUPfmHpdOM2iHmGCQNsY-SZ9Q/pub?gid=0&single=true&output=csv',
    lat:           cfg.lat           || 36.4552,
    lon:           cfg.lon           || -119.8785,
    city:          cfg.city          || 'RIVERDALE CA',
    screens: Object.assign({
      calendar:   true,
      schedule:   true,
      birthday:   true,
      countdown:  true,
      weather:    true,
      menu:       true,
      facts:      true,
      passable:   true,
      code:       true,
      honorRoll:  true,
      quickMsg:   true,
    }, cfg.screens || {}),
  };
})();


/* ═══════════════════════════════════════════════════════════
   2. BELL SCHEDULES
═══════════════════════════════════════════════════════════ */
const SCHEDULES = {
  REGULAR: {
    label: 'REGULAR BELL SCHEDULE',
    periods: [
      { name: 'P1',      start: '8:10',  end: '9:02'  },
      { name: 'P2',      start: '9:06',  end: '9:56'  },
      { name: 'BRUNCH',  start: '9:56',  end: '10:11', break: true },
      { name: 'P3',      start: '10:15', end: '11:05' },
      { name: 'P4',      start: '11:09', end: '11:59' },
      { name: 'LUNCH',   start: '11:59', end: '12:33', break: true },
      { name: 'P5',      start: '12:37', end: '1:27'  },
      { name: 'P6',      start: '1:31',  end: '2:21'  },
      { name: 'P7',      start: '2:25',  end: '3:15'  },
    ],
  },
  EARLY_RELEASE: {
    label: 'EARLY RELEASE SCHEDULE',
    periods: [
      { name: 'P1',    start: '8:10',  end: '8:56'  },
      { name: 'P2',    start: '9:00',  end: '9:41'  },
      { name: 'P3',    start: '9:45',  end: '10:26' },
      { name: 'P4',    start: '10:30', end: '11:11' },
      { name: 'LUNCH', start: '11:11', end: '11:45', break: true },
      { name: 'P5',    start: '11:49', end: '12:30' },
      { name: 'P6',    start: '12:34', end: '1:15'  },
      { name: 'P7',    start: '1:19',  end: '2:00'  },
    ],
  },
  BLOCK_WED: {
    label: 'BLOCK DAY · 1-3-5-7',
    periods: [
      { name: 'P1/P2',  start: '8:10',  end: '9:57'  },
      { name: 'BRUNCH', start: '9:57',  end: '10:12', break: true },
      { name: 'P3/P4',  start: '10:16', end: '11:59' },
      { name: 'LUNCH',  start: '11:59', end: '12:33', break: true },
      { name: 'P5/P6',  start: '12:37', end: '2:20'  },
      { name: 'P7',     start: '2:24',  end: '3:15'  },
    ],
  },
  BLOCK_THU: {
    label: 'BLOCK DAY · 2-4-6-7',
    periods: [
      { name: 'P1/P2',  start: '8:10',  end: '9:57'  },
      { name: 'BRUNCH', start: '9:57',  end: '10:12', break: true },
      { name: 'P3/P4',  start: '10:16', end: '11:59' },
      { name: 'LUNCH',  start: '11:59', end: '12:33', break: true },
      { name: 'P5/P6',  start: '12:37', end: '2:20'  },
      { name: 'P7',     start: '2:24',  end: '3:15'  },
    ],
  },
  MINIMUM: {
    label: 'MINIMUM DAY SCHEDULE',
    periods: [
      { name: 'P1',      start: '8:10',  end: '8:46'  },
      { name: 'P2',      start: '8:50',  end: '9:23'  },
      { name: 'P3',      start: '9:27',  end: '10:00' },
      { name: 'P4',      start: '10:04', end: '10:37' },
      { name: 'BRU/LUN', start: '10:37', end: '11:10', break: true },
      { name: 'P5',      start: '11:14', end: '11:47' },
      { name: 'P6',      start: '11:51', end: '12:24' },
      { name: 'P7',      start: '12:28', end: '1:01'  },
    ],
  },
  ACTIVITY: {
    label: 'ACTIVITY DAY SCHEDULE',
    periods: [
      { name: 'P1',     start: '8:10',  end: '8:56'  },
      { name: 'P2',     start: '9:00',  end: '9:44'  },
      { name: 'BRUNCH', start: '9:44',  end: '9:59',  break: true },
      { name: 'P3',     start: '10:03', end: '10:47' },
      { name: 'P4',     start: '10:51', end: '11:35' },
      { name: 'P5',     start: '11:39', end: '12:23' },
      { name: 'LUNCH',  start: '12:23', end: '12:57', break: true },
      { name: 'P6',     start: '1:01',  end: '1:45'  },
      { name: 'P7',     start: '1:49',  end: '2:33'  },
    ],
  },
  FOGGY: {
    label: 'FOGGY / LATE ARRIVAL',
    periods: [
      { name: 'P1',    start: '10:00', end: '10:44' },
      { name: 'P2',    start: '10:48', end: '11:28' },
      { name: 'P3',    start: '11:32', end: '12:12' },
      { name: 'LUNCH', start: '12:12', end: '12:49', break: true },
      { name: 'P4',    start: '12:53', end: '1:33'  },
      { name: 'P5',    start: '1:37',  end: '2:17'  },
      { name: 'P6',    start: '2:21',  end: '3:01'  },
      { name: 'P7',    start: '3:05',  end: '3:45'  },
    ],
  },
  CODE_DAY: {
    label: 'C.O.D.E DAY SCHEDULE',
    periods: [
      { name: 'P1',       start: '8:10',  end: '8:56'  },
      { name: 'P2',       start: '9:00',  end: '9:44'  },
      { name: 'BRUNCH',   start: '9:44',  end: '9:59',  break: true },
      { name: 'P3',       start: '10:03', end: '10:47' },
      { name: 'P4',       start: '10:51', end: '11:35' },
      { name: 'KICKBALL', start: '11:39', end: '12:17', break: true },
      { name: 'LUNCH',    start: '12:17', end: '12:51', break: true },
      { name: 'P5',       start: '12:55', end: '1:39'  },
      { name: 'P6',       start: '1:43',  end: '2:27'  },
      { name: 'P7',       start: '2:31',  end: '3:15'  },
    ],
  },
};


/* ═══════════════════════════════════════════════════════════
   3. ACADEMIC CALENDAR
═══════════════════════════════════════════════════════════ */
const NO_SCHOOL = new Set([
  '2025-09-01',
  '2025-11-10','2025-11-11',
  '2025-11-27','2025-11-28',
  '2025-12-22','2025-12-23','2025-12-24','2025-12-25',
  '2025-12-26','2025-12-29','2025-12-30','2025-12-31',
  '2026-01-01','2026-01-02','2026-01-05','2026-01-06',
  '2026-01-07','2026-01-08','2026-01-09','2026-01-12',
  '2026-01-19',
  '2026-02-09','2026-02-16',
  '2026-03-30','2026-03-31',
  '2026-04-01','2026-04-02','2026-04-03',
  '2026-05-25',
]);

// One-day schedule overrides — keyed by YYYY-MM-DD
const DATE_OVERRIDES = {
  '2026-05-15': 'CODE_DAY',
  '2026-06-12': 'MINIMUM',
};


/* ═══════════════════════════════════════════════════════════
   4. SCHEDULE DETECTION
   Priority: calendar event keywords → date override →
             short-week rule → default weekly pattern
═══════════════════════════════════════════════════════════ */
function cwLocalDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function cwTimeToMins(t) {
  const [h, m] = t.split(':').map(Number);
  const h24 = (h >= 1 && h <= 7) ? h + 12 : h;
  return h24 * 60 + m;
}

function cwGetWeekSchoolDays(refDate) {
  const d   = new Date(refDate);
  const dow = d.getDay();
  const mon = new Date(d);
  mon.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  let count = 0;
  for (let i = 0; i < 5; i++) {
    const day = new Date(mon);
    day.setDate(mon.getDate() + i);
    if (!NO_SCHOOL.has(cwLocalDateStr(day))) count++;
  }
  return count;
}

function cwDetectSchedule(calEvents) {
  const now     = new Date();
  const dow     = now.getDay();
  const dateStr = cwLocalDateStr(now);

  if (dow === 0 || dow === 6 || NO_SCHOOL.has(dateStr)) return null;

  // 1. Calendar event keywords
  if (calEvents && calEvents.length) {
    const todayEvents = calEvents.filter(e => {
      const s = e.start || e.dtstart || '';
      return s.slice(0, 10) === dateStr;
    });
    for (const e of todayEvents) {
      const t = ((e.title || e.summary) || '').toLowerCase();
      if (t.includes('foggy') || t.includes('late arrival')) return 'FOGGY';
      if (t.includes('minimum'))                              return 'MINIMUM';
      if (t.includes('activity'))                             return 'ACTIVITY';
      if (t.includes('c.o.d.e') || t.includes('code day'))   return 'CODE_DAY';
      if (t.includes('early release'))                        return 'EARLY_RELEASE';
      if (t.includes('block'))   return dow === 4 ? 'BLOCK_THU' : 'BLOCK_WED';
    }
  }

  // 2. Hardcoded date override
  if (DATE_OVERRIDES[dateStr]) return DATE_OVERRIDES[dateStr];

  // 3. Short week → all Regular
  if (cwGetWeekSchoolDays(now) <= 4) return 'REGULAR';

  // 4. Default weekly pattern
  if (dow === 1) return 'EARLY_RELEASE';
  if (dow === 3) return 'BLOCK_WED';
  if (dow === 4) return 'BLOCK_THU';
  return 'REGULAR';
}

function cwGetNextSchoolDay() {
  const MON = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const DAY = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  const now = new Date();
  for (let i = 1; i <= 14; i++) {
    const d   = new Date(now);
    d.setDate(now.getDate() + i);
    const dow = d.getDay();
    const ds  = cwLocalDateStr(d);
    if (dow === 0 || dow === 6 || NO_SCHOOL.has(ds)) continue;
    const override = DATE_OVERRIDES[ds];
    const sched = override
      ? (SCHEDULES[override]?.label || override)
      : ({ 1:'EARLY RELEASE', 3:'BLOCK 1-3-5-7', 4:'BLOCK 2-4-6-7' }[dow] || 'REGULAR BELL');
    return {
      label:      `${DAY[dow]} ${MON[d.getMonth()]} ${d.getDate()}`,
      schedLabel: sched,
    };
  }
  return null;
}


/* ═══════════════════════════════════════════════════════════
   5. PERIOD TIMER  (used by display header + mobile card)
═══════════════════════════════════════════════════════════ */
function cwBuildPeriodTimerData(calEvents) {
  const schedKey = cwDetectSchedule(calEvents || window._cwCalEvents || []);
  if (!schedKey) return null;
  const schedule = SCHEDULES[schedKey];
  if (!schedule) return null;

  const now     = new Date();
  const nm      = now.getHours() * 60 + now.getMinutes();
  const nowSecs = now.getSeconds();

  for (const p of schedule.periods) {
    const start = cwTimeToMins(p.start);
    const end   = cwTimeToMins(p.end);
    if (nm >= start && nm < end) {
      const remaining = (end - nm) * 60 - nowSecs;
      const remMins   = Math.floor(remaining / 60);
      const remSecs   = remaining % 60;
      return {
        label:     `${p.name} · ${schedule.label}`,
        endsAt:    p.end,
        remMins,
        remSecs,
        timeStr:   remMins > 0
          ? `${remMins}:${String(remSecs).padStart(2,'0')}`
          : `0:${String(remSecs).padStart(2,'0')}`,
        status:    remMins < 1 ? 'ending' : remMins < 5 ? 'warning' : 'normal',
        inPeriod:  true,
      };
    }
  }

  // Between periods — show next
  for (const p of schedule.periods) {
    const start = cwTimeToMins(p.start);
    if (nm < start) {
      return {
        label:    `NEXT: ${p.name}`,
        startsAt: p.start,
        minsAway: start - nm,
        status:   'upcoming',
        inPeriod: false,
      };
    }
  }
  return null;
}


/* ═══════════════════════════════════════════════════════════
   6. BIRTHDAYS  (Supabase-backed — cw_birthdays table)
   Fallback hardcoded list used until Supabase loads.
═══════════════════════════════════════════════════════════ */
let CW_BIRTHDAYS = [
  { name: 'CAMILA VILLANUEVA',        month: 5,  day: 9  },
  { name: 'ELENA MENDES',             month: 5,  day: 10 },
  { name: 'ISABEL VERA RIOS',         month: 5,  day: 19 },
  { name: 'CELESTE CARRILLO',         month: 5,  day: 21 },
  { name: 'EMILLY DIAZ',              month: 5,  day: 26 },
  { name: 'YERALDINE LOPEZ VEGA',     month: 5,  day: 29 },
  { name: 'ELLA-JADE STOLLIKER',      month: 5,  day: 31 },
  { name: 'ALYSSA HERNANDEZ',         month: 6,  day: 17 },
  { name: 'PERLA MARIN ALVAREZ',      month: 6,  day: 20 },
  { name: 'JAYLEE YBARRA',            month: 7,  day: 4  },
  { name: 'GABRIEL GARCIA CORONA',    month: 7,  day: 6  },
  { name: 'MIGUEL MARCOS-DELGADO',    month: 7,  day: 18 },
  { name: 'ELPIDIO SOLORIO',          month: 7,  day: 20 },
  { name: 'MICHELLE RAMIREZ',         month: 7,  day: 22 },
  { name: 'ALYSSA GONZALEZ',          month: 7,  day: 25 },
  { name: 'CAMILA CORTES PEREZ',      month: 7,  day: 27 },
  { name: 'STARR GARCIA',             month: 7,  day: 28 },
  { name: 'LIYRISE AGUILAR',          month: 8,  day: 4  },
  { name: 'SANTIAGO CHAVEZ',          month: 8,  day: 4  },
  { name: 'CINTHIA LAWLESS',          month: 8,  day: 7  },
  { name: 'NATALIE ARIAS',            month: 8,  day: 11 },
  { name: 'DOMINIC FIGUEROA',         month: 8,  day: 11 },
  { name: 'MARISOL FLORES RODRIGUEZ', month: 8,  day: 12 },
  { name: 'VIOLETA TAMAYO',           month: 8,  day: 15 },
  { name: 'VALERIA PEREZ SOLIS',      month: 8,  day: 24 },
  { name: 'VALERIA OLGUIN',           month: 8,  day: 29 },
];

// Fetch birthdays from Supabase and replace the local list
async function cwFetchBirthdays() {
  const rows = await cwSupabaseFetch(
    `cw_birthdays?room=eq.${CW.room}&active=eq.true&order=month.asc,day.asc`
  );
  if (rows && rows.length) {
    CW_BIRTHDAYS = rows.map(r => ({
      name:  r.name.toUpperCase(),
      month: r.month,
      day:   r.day,
      id:    r.id,
    }));
  }
}

function cwGetWeekBirthdays() {
  const now  = new Date();
  const m    = now.getMonth() + 1;
  const d    = now.getDate();
  const dow  = now.getDay();
  const mon  = new Date(now);
  mon.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));

  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(mon);
    day.setDate(mon.getDate() + i);
    weekDates.push({ m: day.getMonth() + 1, d: day.getDate() });
  }

  // Apply DoNotDisplay filter before returning
  const allowed    = cwFilterBirthdays(CW_BIRTHDAYS);
  const todayBdays = allowed.filter(b => b.month === m && b.day === d);
  const weekBdays  = allowed.filter(b =>
    !(b.month === m && b.day === d) &&
    weekDates.some(wd => wd.m === b.month && wd.d === b.day)
  );
  return { todayBdays, weekBdays };
}

function cwBuildBirthdayScreen() {
  const MON = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const { todayBdays, weekBdays } = cwGetWeekBirthdays();

  if (!todayBdays.length && !weekBdays.length) {
    // Look ahead 60 days — also filtered
    const now = new Date();
    const upcoming = [];
    for (let offset = 1; offset <= 60 && upcoming.length < 5; offset++) {
      const d = new Date(now);
      d.setDate(now.getDate() + offset);
      cwFilterBirthdays(CW_BIRTHDAYS)
        .filter(b => b.month === d.getMonth() + 1 && b.day === d.getDate())
        .forEach(b => upcoming.push({ ...b, offset }));
    }
    if (!upcoming.length) return null;
    const lines = ['COMING UP · BIRTHDAYS'];
    upcoming.slice(0, 3).forEach(b => {
      const dateStr = MON[b.month - 1] + ' ' + b.day;
      const when    = b.offset === 1 ? 'TOMORROW' : 'IN ' + b.offset + ' DAYS';
      lines.push(cwTrunc(b.name, 28));
      if (lines.length < 7) lines.push(cwPad(dateStr + '  ' + when, 28, 'left'));
    });
    while (lines.length < 7) lines.push('');
    return { lines: lines.slice(0, 7), speed: 12, _isBirthdaySlot: true };
  }

  const lines = [];
  if (todayBdays.length) {
    lines.push('HAPPY BIRTHDAY!');
    todayBdays.slice(0, 3).forEach(b => lines.push(cwTrunc(b.name, 28)));
    if (todayBdays.length > 3) lines.push('AND ' + (todayBdays.length - 3) + ' MORE TODAY');
    if (lines.length < 6 && weekBdays.length) {
      lines.push('');
      lines.push('ALSO THIS WEEK:');
      weekBdays.slice(0, 6 - lines.length).forEach(b => {
        lines.push(cwTrunc(b.name + '  ' + MON[b.month-1] + ' ' + b.day, 28));
      });
    }
  } else {
    lines.push('BIRTHDAYS THIS WEEK');
    weekBdays.slice(0, 5).forEach(b => {
      lines.push(cwTrunc(b.name + '  ' + MON[b.month-1] + ' ' + b.day, 28));
    });
    if (weekBdays.length > 5) lines.push('+ ' + (weekBdays.length - 5) + ' MORE');
  }
  while (lines.length < 7) lines.push('');
  return { lines: lines.slice(0, 7), speed: 12, _isBirthdaySlot: true };
}


/* ═══════════════════════════════════════════════════════════
   7. COUNTDOWNS
═══════════════════════════════════════════════════════════ */
const CW_HARDCODED_COUNTDOWNS = [
  { label: 'END OF SCHOOL YEAR',  date: '2026-06-12', priority: 1 },
  { label: 'GRADUATION',          date: '2026-06-12', priority: 1 },
  { label: 'END OF SEMESTER 2',   date: '2026-06-12', priority: 1 },
  { label: 'MEMORIAL DAY',        date: '2026-05-25', priority: 2 },
  { label: 'SPRING BREAK',        date: '2026-03-28', priority: 2 },
  { label: 'PROGRESS REPORTS',    date: '2026-05-01', priority: 2 },
  { label: 'END OF Q3',           date: '2026-03-27', priority: 2 },
  { label: 'END OF SEMESTER 1',   date: '2026-01-23', priority: 1 },
  { label: 'MLK DAY',             date: '2026-01-19', priority: 3 },
  { label: 'PRESIDENTS DAY',      date: '2026-02-16', priority: 3 },
  { label: 'LINCOLN DAY',         date: '2026-02-09', priority: 3 },
  { label: 'VETERANS DAY',        date: '2025-11-11', priority: 3 },
  { label: 'LABOR DAY',           date: '2025-09-01', priority: 3 },
  { label: 'JUNETEENTH',          date: '2026-06-19', priority: 3 },
  { label: 'THANKSGIVING BREAK',  date: '2025-11-27', priority: 2 },
  { label: 'WINTER BREAK',        date: '2025-12-22', priority: 2 },
];

let CW_CUSTOM_COUNTDOWNS = [];

function cwDaysUntil(dateStr) {
  const now    = new Date();
  const target = new Date(dateStr + 'T00:00:00');
  const diff   = target - new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.ceil(diff / 86400000);
}

function cwBuildCountdownScreen() {
  const all = [...CW_HARDCODED_COUNTDOWNS, ...CW_CUSTOM_COUNTDOWNS]
    .map(c => ({ ...c, days: cwDaysUntil(c.date) }))
    .filter(c => c.days >= 0 && c.days <= 180)
    .sort((a, b) => a.days !== b.days ? a.days - b.days : (a.priority||3) - (b.priority||3));

  if (!all.length) return null;

  const lines = ['COMING UP AT RHS'];
  all.slice(0, 6).forEach(c => {
    const dayStr = c.days === 0 ? 'TODAY!' : c.days === 1 ? 'TOMORROW' : c.days + ' DAYS';
    const label  = cwTrunc(c.label, 28 - dayStr.length - 1);
    const gap    = 28 - label.length - dayStr.length;
    lines.push(label + ' '.repeat(Math.max(1, gap)) + dayStr);
  });
  while (lines.length < 7) lines.push('');
  return { lines: lines.slice(0, 7), speed: 15, _isCountdownSlot: true };
}


/* ═══════════════════════════════════════════════════════════
   8. FACT BANK
═══════════════════════════════════════════════════════════ */
const CW_FACTS = [
  'THE AVERAGE PERSON SEES 6000 TO 10000 ADS EVERY SINGLE DAY',
  'INSTAGRAM WAS SOLD TO FACEBOOK FOR 1 BILLION WITH ONLY 13 EMPLOYEES',
  'WARREN BUFFETT MADE 99 PERCENT OF HIS WEALTH AFTER AGE 50',
  'THE FIRST FILM EVER MADE WAS ONLY 2 SECONDS LONG IN 1888',
  'CLEOPATRA LIVED CLOSER IN TIME TO THE IPHONE THAN TO THE PYRAMIDS',
  'GOOGLE WAS ORIGINALLY CALLED BACKRUB BEFORE CHANGING ITS NAME',
  'COLLEGE GRADS EARN 65 PERCENT MORE OVER THEIR LIFETIME THAN HIGH SCHOOL GRADS',
  'THE AVERAGE PERSON SPENDS 7 YEARS OF THEIR LIFE ON SOCIAL MEDIA',
  'APPLE STARTED IN A GARAGE WITH JUST 1750 DOLLARS IN 1976',
  'TIKTOK REACHED 1 BILLION USERS FASTER THAN ANY APP IN HISTORY',
  '65 PERCENT OF JOBS THAT EXIST IN 2030 HAVE NOT BEEN INVENTED YET',
  'THE HUMAN BRAIN CAN STORE ABOUT 2.5 PETABYTES OF INFORMATION',
  'OXFORD UNIVERSITY IS OLDER THAN THE AZTEC EMPIRE',
  'COMPOUND INTEREST IS THE EIGHTH WONDER OF THE WORLD SAID EINSTEIN',
  'THE FIBONACCI SEQUENCE APPEARS IN FLOWER PETALS SHELLS AND GALAXIES',
  'A BILLION SECONDS AGO IT WAS 1993',
  'CALIFORNIA HAS THE WORLDS 5TH LARGEST ECONOMY ALL BY ITSELF',
  'NIKE FOUNDER PHIL KNIGHT SOLD SHOES FROM THE TRUNK OF HIS CAR',
  'THE FIRST PAID TV AD COST ONLY 9 DOLLARS IN 1941',
  'RED INCREASES APPETITE WHICH IS WHY MCDONALDS AND KFC USE IT',
  'THE FIRST COMPUTER BUG WAS AN ACTUAL MOTH FOUND IN 1947',
  'SMARTPHONES HAVE MORE COMPUTING POWER THAN NASA HAD IN 1969',
  'VIKINGS NEVER ACTUALLY WORE HORNED HELMETS',
  '90 PERCENT OF PURCHASING DECISIONS ARE MADE SUBCONSCIOUSLY',
  'INTERNSHIPS LEAD TO FULL-TIME JOBS 70 PERCENT OF THE TIME',
  'SPIELBERG DIRECTED SCHINDLERS LIST AND JURASSIC PARK IN THE SAME YEAR',
  'AMAZON STARTED AS AN ONLINE BOOKSTORE SELLING JUST 3 TITLES',
  'THE AVERAGE PERSON CHANGES CAREERS 5 TO 7 TIMES IN THEIR LIFETIME',
  'WIFI TECHNOLOGY WAS INVENTED AS A RESULT OF A BLACK HOLE EXPERIMENT',
  'THE GREAT WALL OF CHINA TOOK OVER 1000 YEARS TO BUILD',
  'NAPOLEON WAS ACTUALLY AVERAGE HEIGHT FOR HIS TIME AT 5 FOOT 7',
  'THE NUMBER ZERO WAS INVENTED IN INDIA AROUND 500 AD',
  'LINKEDIN HAS OVER 900 MILLION MEMBERS IN 200 COUNTRIES',
  'THE MOST IN DEMAND SKILL FOR JOBS IN 2025 IS AI LITERACY',
  'FIRST GEN COLLEGE STUDENTS EARN 25 PERCENT MORE THAN THEIR PARENTS',
  '4 OF THE 5 RICHEST PEOPLE IN THE WORLD ARE COLLEGE DROPOUTS',
  'COCA-COLA SOLD ONLY 9 DRINKS PER DAY IN ITS FIRST YEAR',
  'THE FIRST STARBUCKS OPENED IN 1971 AND ONLY SOLD COFFEE BEANS',
  'THERE ARE MORE STARS IN SPACE THAN GRAINS OF SAND ON ALL BEACHES',
  'OCTOPUSES HAVE THREE HEARTS AND BLUE BLOOD',
];

function cwBuildFactsScreen() {
  const now       = new Date();
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  const idx       = (dayOfYear * 3 + now.getHours()) % CW_FACTS.length;
  const fact      = CW_FACTS[idx];

  function wrapText(text, max) {
    const words = text.split(' ');
    const lines = []; let cur = '';
    for (const w of words) {
      if ((cur + ' ' + w).trim().length <= max) { cur = (cur + ' ' + w).trim(); }
      else { if (cur) lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
    return lines;
  }

  const wrapped = wrapText(fact, 28);
  const lines   = ['DID YOU KNOW?', '', ...wrapped.slice(0, 4)];
  while (lines.length < 6) lines.push('');
  lines.push('ROOM ' + CW.room + ' · RHS');
  return { lines: lines.slice(0, 7), speed: 18, _isFactsSlot: true };
}


/* ═══════════════════════════════════════════════════════════
   9. WEATHER
═══════════════════════════════════════════════════════════ */
const CW_WX_COMMENTS = {
  scorcher: ['STAY HYDRATED COWBOYS','DRINK WATER NOT ENERGY DRINKS','SUNSCREEN IS NOT OPTIONAL','HOT OUT DRINK PLENTY OF WATER'],
  hot:      ['STAY HYDRATED TODAY','CLASSIC CENTRAL VALLEY DAY','DRINK WATER BETWEEN CLASSES'],
  warm:     ['NICE DAY OUT THERE','ENJOY THE SUNSHINE TODAY','GOOD VIBES AND GOOD WEATHER'],
  mild:     ['GREAT DAY TO BE A COWBOY','PERFECT CLASSROOM WEATHER','NICE AND COMFORTABLE TODAY'],
  cool:     ['A LITTLE CHILLY BRING A JACKET','LAYER UP FOR OUTDOOR TIME','COOL DAY GREAT FOR FOCUSING'],
  cold:     ['BUNDLE UP OUT THERE','COLD ONE TODAY DRESS WARM','JACKET WEATHER TODAY'],
  rainy:    ['RAIN TODAY WATCH YOUR STEP','UMBRELLAS WELCOME TODAY','WET OUT THERE STAY DRY'],
  windy:    ['HOLD YOUR PAPERS ITS WINDY','BREEZY DAY IN RIVERDALE','GUSTY WINDS TODAY HEADS UP'],
  foggy:    ['FOGGY MORNING IN THE VALLEY','TULE FOG DRIVE SAFE TODAY','CLASSIC VALLEY MORNING'],
};

function cwWxCondition(wmo, wind) {
  if (wind > 25) return 'windy';
  if ([45, 48].includes(wmo)) return 'foggy';
  if ([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(wmo)) return 'rainy';
  if ([95,96,99].includes(wmo)) return 'stormy';
  return 'clear';
}

function cwWxComment(cond, tempF) {
  const pool =
    cond === 'rainy' || cond === 'drizzle' ? CW_WX_COMMENTS.rainy :
    cond === 'foggy'  ? CW_WX_COMMENTS.foggy  :
    cond === 'windy'  ? CW_WX_COMMENTS.windy  :
    tempF >= 100      ? CW_WX_COMMENTS.scorcher :
    tempF >= 90       ? CW_WX_COMMENTS.hot    :
    tempF >= 75       ? CW_WX_COMMENTS.warm   :
    tempF >= 60       ? CW_WX_COMMENTS.mild   :
    tempF >= 45       ? CW_WX_COMMENTS.cool   :
                        CW_WX_COMMENTS.cold;
  return pool[new Date().getHours() % pool.length];
}

async function cwFetchWeather() {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${CW.lat}&longitude=${CW.lon}&current=temperature_2m,weather_code,wind_speed_10m&daily=temperature_2m_max&timezone=America%2FLos_Angeles&forecast_days=3&temperature_unit=fahrenheit&wind_speed_unit=mph`;
    const res  = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch(e) { return null; }
}

function cwBuildWeatherScreen(data) {
  if (!data) return null;
  const cur   = data.current;
  const daily = data.daily;
  const tempF = Math.round(cur.temperature_2m);
  const wind  = cur.wind_speed_10m || 0;
  const cond  = cwWxCondition(cur.weather_code, wind);
  const LABELS = { clear:'SUNNY', cloudy:'CLOUDY', foggy:'FOGGY', rainy:'RAINY', snowy:'SNOWY', stormy:'STORMY', windy:'WINDY' };
  const condLabel = LABELS[cond] || 'CLEAR';
  const comment   = cwWxComment(cond, tempF);
  const DAY_ABR   = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  const now       = new Date();
  const tom       = new Date(now); tom.setDate(now.getDate() + 1);
  const da        = new Date(now); da.setDate(now.getDate() + 2);
  const t1 = daily?.temperature_2m_max?.[1] ? Math.round(daily.temperature_2m_max[1]) : null;
  const t2 = daily?.temperature_2m_max?.[2] ? Math.round(daily.temperature_2m_max[2]) : null;
  const forecast  = t1 && t2
    ? cwTrunc(`${DAY_ABR[tom.getDay()]} HIGH ${t1} · ${DAY_ABR[da.getDay()]} HIGH ${t2}`, 28)
    : '';

  // Wrap comment across two lines
  const words = comment.split(' ');
  let l1 = '', l2 = '';
  for (const w of words) {
    if ((l1 + ' ' + w).trim().length <= 28) l1 = (l1 + ' ' + w).trim();
    else l2 = (l2 + ' ' + w).trim();
  }

  return {
    lines: [
      'WEATHER · ' + CW.city,
      '',
      cwTrunc(condLabel + ' · ' + tempF + '\u00b0F', 28),
      '',
      l1,
      cwTrunc(l2, 28),
      forecast,
    ],
    speed: 18,
    _isWeatherSlot: true,
  };
}


/* ═══════════════════════════════════════════════════════════
   10. DAILY MENU
═══════════════════════════════════════════════════════════ */
const CW_MENU = {
  '2026-04-27': ['GARDEN BURGER','VEGGIE PATTY','PARSLEY THYME RANCH','PICKLE SLICES','ICEBERG LETTUCE','ASSORTED FRUIT'],
  '2026-04-28': ['SW QUESO CHICKEN','TORTILLA CHIPS','RANCHABOOM SAUCE','SOUR CREAM','REFRIED BEANS','ASSORTED FRUIT'],
  '2026-04-29': ['SLOPPY JOE MAC','SLOPPY JOE MEAT','MACARONI PASTA','MARGARINES','COLESLAW','ASSORTED FRUIT'],
  '2026-04-30': ['CHICKEN POTATO PILAF','DINNER ROLL','PARSLEY THYME RANCH','CARROT','ASSORTED FRUIT','ORANGE'],
  '2026-05-01': ['RANCH MOZZ BURGER','RANCH BURGER','SHREDDED MOZZARELLA','GARLIC RANCH','CUCUMBER','ASSORTED FRUIT'],
  '2026-05-04': ['FIESTA CHICKEN WRAP','GRILLED CHICKEN','DELI FIESTA SAUCE','BLACK BEANS','CABBAGE','ASSORTED FRUIT'],
  '2026-05-05': ['TAJ MAHAL MEATBALLS','CHIPS','DINNER ROLL','MASHED POTATOES','SUGAR SNAP PEAS','ASSORTED FRUIT'],
  '2026-05-06': ['BOSCO STICKS','BREADED CHEESE STICKS','RANCH DRESSING','CARROT','ROMAINE','ASSORTED FRUIT'],
  '2026-05-07': ['ASIAN CHICKEN BOWL','GRILLED CHICKEN','CHIPS','DELI ASIAN SAUCE','SUGAR SNAP PEAS','ASSORTED FRUIT'],
  '2026-05-08': ['PEPPERONI PIZZA','PARSLEY THYME RANCH','CUCUMBER','ICEBERG LETTUCE','APPLESAUCE','ASSORTED FRUIT'],
  '2026-05-11': ['RAISIN CHICKEN WRAP','GRILLED CHICKEN','RAISIN SAUCE','BLACK BEANS','ICEBERG LETTUCE','ASSORTED FRUIT'],
  '2026-05-12': ['MONGOLIAN MEATBALLS','CILANTRO BROWN RICE','SESAME DRESSING','BROCCOLI','CAULIFLOWER','ASSORTED FRUIT'],
  '2026-05-13': ['ZESTY BEEF STEAK','ZESTY SALISBURY STEAK','CHIPS','DINNER ROLL','BASIL RANCH','ASSORTED FRUIT'],
  '2026-05-14': ['PESTO CHICKEN SANDWICH','GRILLED CHICKEN','BAGEL','PESTO SAUCE','TOMATO','ASSORTED FRUIT'],
  '2026-05-15': ['MINI CORN DOGS','CHIPS','GARLIC RANCH','KETCHUP','CARROT','ASSORTED FRUIT'],
  '2026-05-18': ['SOFT PRETZEL WITH CHEESE','CHEESE SAUCE','CHIPS','PRETZEL','CORN','APPLE'],
  '2026-05-19': ['HOT HAM & CHEESE','HOT HAM & CHEESE','HAMBURGER BUN','BLACK BEANS','ICEBERG LETTUCE','ASSORTED FRUIT'],
  '2026-05-20': ['FRENCH TOAST STICKS','YOGURT','CHIPS','FRENCH TOAST','SALSA RANCH','CARROT'],
  '2026-05-21': ['MEATBALL SUB','MARINARA MEATBALLS','SHREDDED MOZZARELLA','CHIPS','HOTDOG BUN','CARROT'],
  '2026-05-22': ['PEPPERONI PIZZA','CHIPS','GARLIC RANCH','CUCUMBER','ROMAINE','APPLESAUCE'],
  '2026-05-26': ['WALKING BEEF TACO','BEEF TACO MEAT','SHREDDED CHEDDAR','TORTILLA CHIPS','TACO SAUCE','ASSORTED FRUIT'],
  '2026-05-27': ['ITALIAN CHICKEN PASTA','ITALIAN CHICKEN','SHREDDED MOZZARELLA','PENNE PASTA','BASIL RANCH','ASSORTED FRUIT'],
  '2026-05-28': ['CORN DOG','CHIPS','KETCHUP','MUSTARD','COLESLAW','ASSORTED FRUIT'],
  '2026-05-29': ['CHICKEN TACO','CHICKEN TACO MEAT','SHREDDED CHEDDAR','CHIPS','RANCHABOOM SAUCE','ASSORTED FRUIT'],
  '2026-06-01': ['CHICKEN PATTY SANDWICH','CHICKEN PATTY','CHIPS','HAMBURGER BUN','ICEBERG LETTUCE','ASSORTED FRUIT'],
  '2026-06-02': ['POLLO VERDE','CHICKEN VERDE','GARLIC BROWN RICE','CHIPS','DILL RANCH','ASSORTED FRUIT'],
  '2026-06-03': ['BEEF & POTATO WRAP','BEEF PAPAS','SHREDDED CHEDDAR','WW TORTILLA','BAKED BEANS','ASSORTED FRUIT'],
  '2026-06-04': ['SESAME POPCORN CHICKEN','POPCORN CHICKEN','DINNER ROLL','PARSLEY THYME RANCH','BROCCOLI','ASSORTED FRUIT'],
  '2026-06-05': ['CHEESY SPAGHETTI','SHREDDED MOZZARELLA','DINNER ROLL','SPAGHETTI','BASIL RANCH','ASSORTED FRUIT'],
  '2026-06-08': ['BBQ CHICKEN SANDWICH','BBQ CHICKEN BREAST','HAMBURGER BUN','RED BELL PEPPER','CORN','ASSORTED FRUIT'],
  '2026-06-09': ['CHICKEN ENCHILADA NACHOS','CHICKEN ENCHILADA','CHIPS','TORTILLA CHIPS','SALSA RANCH','ASSORTED FRUIT'],
  '2026-06-10': ['BEEF HOT DOG','HOTDOG','CHIPS','HOTDOG BUN','BAKED BEANS','ASSORTED FRUIT'],
  '2026-06-11': ['GOLD COAST CHICKEN','GOLD COAST CHICKEN','YOGURT','GARLIC BROWN RICE','DILL RANCH','ASSORTED FRUIT'],
  '2026-06-12': ['ALBONDIGAS MEXICANAS','MEXICAN MEATBALLS','CHIPS','DINNER ROLL','BROCCOLI','ASSORTED FRUIT'],
};

function cwBuildMenuScreen() {
  const DAYS = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
  const now  = new Date();
  const key  = cwLocalDateStr(now);
  const items = CW_MENU[key];
  const day   = DAYS[now.getDay()];
  if (!items) {
    return {
      lines: ['BRUNCH + LUNCH MENU', day, '', 'NO MENU FOR TODAY', '', 'CHECK CAFETERIA', 'GO COWBOYS'],
      speed: 15, _isMenuSlot: true,
    };
  }
  const lines = ['BRUNCH + LUNCH MENU', day, ...items.slice(0, 5)];
  while (lines.length < 7) lines.push('');
  return { lines: lines.slice(0, 7).map(l => cwTrunc(l, 28)), speed: 15, _isMenuSlot: true };
}


/* ═══════════════════════════════════════════════════════════
   11. SUPABASE HELPERS
═══════════════════════════════════════════════════════════ */
async function cwSupabaseFetch(path) {
  if (!CW.supabaseKey) return null;
  try {
    const res = await fetch(`${CW.supabaseUrl}/rest/v1/${path}`, {
      headers: {
        'apikey':        CW.supabaseKey,
        'Authorization': `Bearer ${CW.supabaseKey}`,
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch(e) { return null; }
}

async function cwSupabasePost(table, body) {
  if (!CW.supabaseKey) return null;
  try {
    const res = await fetch(`${CW.supabaseUrl}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'apikey':        CW.supabaseKey,
        'Authorization': `Bearer ${CW.supabaseKey}`,
        'Content-Type':  'application/json',
        'Prefer':        'return=representation',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch(e) { return null; }
}

async function cwSupabasePatch(table, id, body) {
  if (!CW.supabaseKey) return null;
  try {
    const res = await fetch(`${CW.supabaseUrl}/rest/v1/${table}?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'apikey':        CW.supabaseKey,
        'Authorization': `Bearer ${CW.supabaseKey}`,
        'Content-Type':  'application/json',
        'Prefer':        'return=representation',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch(e) { return null; }
}

// Fetch active approved messages for this room (not expired)
async function cwFetchQuickMessage() {
  const now  = new Date().toISOString();
  const rows = await cwSupabaseFetch(
    `cw_messages?room=eq.${CW.room}&status=eq.approved&expires_at=gt.${now}&order=created_at.desc&limit=1`
  );
  return rows && rows.length ? rows[0] : null;
}

// Fetch custom countdowns for this room and merge into CW_CUSTOM_COUNTDOWNS
async function cwFetchCustomCountdowns() {
  const rows = await cwSupabaseFetch(
    `cw_countdowns?room=eq.${CW.room}&active=eq.true`
  );
  if (rows && rows.length) {
    CW_CUSTOM_COUNTDOWNS = rows.map(r => ({
      label:    r.label.toUpperCase(),
      date:     r.date,
      emoji:    r.emoji || '📅',
      priority: 2,
    }));
  }
}

// Fetch honor roll for this room — filtered against DoNotDisplay list
async function cwFetchHonorRoll() {
  const rows = await cwSupabaseFetch(
    `cw_honor_roll?room=eq.${CW.room}&active=eq.true&order=grade.asc`
  );
  return cwFilterHonorRoll(rows);
}

// Fetch ALL active approved messages (for building multiple screens)
async function cwFetchAllApprovedMessages() {
  const now  = new Date().toISOString();
  const rows = await cwSupabaseFetch(
    `cw_messages?room=eq.${CW.room}&status=eq.approved&expires_at=gt.${now}&order=created_at.desc`
  );
  return rows || [];
}

// Build quick message screen from Supabase row
function cwBuildQuickMsgScreen(msg) {
  if (!msg || !msg.line1) return null;
  const posted  = new Date(msg.created_at);
  const timeStr = posted.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const from    = msg.sender && msg.sender !== 'ANONYMOUS'
    ? cwTrunc('FROM ' + msg.sender.toUpperCase(), 28)
    : 'ROOM ' + CW.room + ' MESSAGE';
  return {
    lines: [
      from, '',
      cwTrunc(msg.line1 || '', 28),
      cwTrunc(msg.line2 || '', 28),
      cwTrunc(msg.line3 || '', 28),
      '',
      cwTrunc('POSTED ' + timeStr, 28),
    ],
    speed: 15,
    _isQuickMsgSlot: true,
  };
}

// Build honor roll ticker HTML (used by display.html)
function cwBuildHonorRollHTML(rows) {
  if (!rows || !rows.length) return '';
  const grades   = ['Freshman','Sophomore','Junior','Senior'];
  const byGrade  = {};
  for (const r of rows) {
    const g = r.grade || 'Other';
    if (!byGrade[g]) byGrade[g] = [];
    // Flip "Last, First" → "First Last"
    const c = r.name.indexOf(',');
    byGrade[g].push(c < 0 ? r.name : r.name.slice(c+1).trim() + ' ' + r.name.slice(0, c).trim());
  }
  let html = '';
  for (const g of grades) {
    if (!byGrade[g] || !byGrade[g].length) continue;
    html += `<span class="ticker-sep">&#9670;</span><span class="ticker-grade">${g.toUpperCase()}S</span><span class="ticker-sep">&#183;</span>`;
    for (const n of byGrade[g]) {
      html += `<span class="ticker-name">${n}</span><span class="ticker-sep">&#183;</span>`;
    }
  }
  return html + html; // doubled for seamless loop
}


/* ═══════════════════════════════════════════════════════════
   12. DO NOT DISPLAY FILTER
   Privacy list — students whose names may not appear on any
   public-facing display (TV, mobile, honor roll ticker).
   Source: cw_do_not_display table in Supabase.
   This filter is NOT optional. It runs before any student
   name is rendered on a public screen.
═══════════════════════════════════════════════════════════ */
let CW_DO_NOT_DISPLAY = new Set();

async function cwFetchDoNotDisplay() {
  const rows = await cwSupabaseFetch(
    `cw_do_not_display?room=eq.${CW.room}&active=eq.true`
  );
  if (rows && rows.length) {
    CW_DO_NOT_DISPLAY = new Set(
      rows.map(r => `${r.first_name} ${r.last_name}`.toUpperCase().trim())
        .concat(rows.map(r => `${r.last_name}, ${r.first_name}`.toUpperCase().trim()))
        .concat(rows.map(r => `${r.last_name} ${r.first_name}`.toUpperCase().trim()))
    );
  }
}

// Returns true if a name should be hidden from public display
function cwIsRestricted(name) {
  if (!name) return false;
  const n = name.toUpperCase().trim();
  // Check exact match and partial match (last name only as fallback)
  if (CW_DO_NOT_DISPLAY.has(n)) return true;
  for (const restricted of CW_DO_NOT_DISPLAY) {
    if (n.includes(restricted) || restricted.includes(n)) return true;
  }
  return false;
}

// Filter an array of birthday objects against the DoNotDisplay list
function cwFilterBirthdays(birthdays) {
  return birthdays.filter(b => !cwIsRestricted(b.name));
}

// Filter honor roll HTML — removes restricted names before building ticker
function cwFilterHonorRoll(rows) {
  return (rows || []).filter(r => {
    const full = `${r.name}`.toUpperCase().trim();
    const parts = r.name.split(',');
    const flipped = parts.length > 1
      ? `${parts[1].trim()} ${parts[0].trim()}`.toUpperCase()
      : full;
    return !cwIsRestricted(full) && !cwIsRestricted(flipped);
  });
}
window._cwCalEvents = [];

function cwIsToday(dtStr, allDay) {
  if (!dtStr) return false;
  const dt  = new Date(dtStr);
  if (isNaN(dt)) return false;
  const now = new Date();
  if (allDay) return cwLocalDateStr(dt) <= cwLocalDateStr(now);
  return cwLocalDateStr(dt) === cwLocalDateStr(now);
}

function cwIsUpcoming(dtStr) {
  if (!dtStr) return false;
  const dt   = new Date(dtStr);
  if (isNaN(dt)) return false;
  const diff = dt - new Date();
  return diff > 0 && diff < 7 * 86400000;
}

function cwFmtTime(dtStr, allDay) {
  if (!dtStr || allDay) return 'ALL DAY';
  const d  = new Date(dtStr);
  if (isNaN(d)) return '';
  let h = d.getHours(), m = d.getMinutes();
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return m > 0 ? `${h}:${String(m).padStart(2,'0')} ${ap}` : `${h} ${ap}`;
}

async function cwFetchCalendar() {
  try {
    const res  = await fetch(CW.calScriptUrl, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (data.status !== 'ok' || !data.events) throw new Error('bad response');
    window._cwCalEvents = data.events.map(e => ({
      summary: e.title,
      dtstart: e.start,
      allDay:  e.allDay,
    }));
    return window._cwCalEvents;
  } catch(e) {
    console.warn('[CW] Calendar fetch failed:', e.message);
    return [];
  }
}

function cwBuildCalendarScreen(events) {
  const MON  = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const DAYS = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
  const now  = new Date();
  const todayStr = DAYS[now.getDay()] + ' ' + MON[now.getMonth()] + ' ' + now.getDate();

  const todayEvts = (events || [])
    .filter(e => cwIsToday(e.dtstart, e.allDay))
    .sort((a, b) => (a.dtstart||'').localeCompare(b.dtstart||''));
  const upcoming  = (events || [])
    .filter(e => cwIsUpcoming(e.dtstart))
    .sort((a, b) => (a.dtstart||'').localeCompare(b.dtstart||''))
    .slice(0, 3);

  if (!todayEvts.length && !upcoming.length) return null;

  const lines = [cwTrunc('TODAY · ' + todayStr, 28)];

  if (todayEvts.length) {
    todayEvts.slice(0, 5).forEach(e => {
      const time = e.allDay ? '' : cwFmtTime(e.dtstart, false);
      if (!time) {
        lines.push(cwTrunc(e.summary.toUpperCase(), 28));
      } else {
        const name = cwTrunc(e.summary.toUpperCase(), 28 - time.length - 1);
        const gap  = 28 - name.length - time.length;
        lines.push(name + ' '.repeat(Math.max(1, gap)) + time);
      }
    });
    while (lines.length < 6) lines.push('');
    if (upcoming.length) {
      const next = upcoming[0];
      const dt   = new Date(next.dtstart);
      lines.push(cwTrunc('NEXT: ' + next.summary.toUpperCase() + (isNaN(dt) ? '' : '  ' + MON[dt.getMonth()] + ' ' + dt.getDate()), 28));
    } else {
      lines.push('RHS EVENTS CALENDAR');
    }
  } else {
    lines.push('NO EVENTS TODAY');
    upcoming.slice(0, 4).forEach(e => {
      const dt = new Date(e.dtstart);
      lines.push(cwTrunc(e.summary.toUpperCase() + (isNaN(dt) ? '' : '  ' + MON[dt.getMonth()] + ' ' + dt.getDate()), 28));
    });
    while (lines.length < 6) lines.push('');
    lines.push('RHS EVENTS CALENDAR');
  }

  return { lines: lines.slice(0, 7), speed: 15, _isCalendarSlot: true };
}


/* ═══════════════════════════════════════════════════════════
   13. PASSABLE — live hall pass data
═══════════════════════════════════════════════════════════ */
async function cwFetchPassable() {
  if (!CW.supabaseKey) return null;
  try {
    const passRes = await fetch(
      `${CW.supabaseUrl}/rest/v1/passes?select=student_id,time_out,reason&time_in=is.null&order=time_out.asc`,
      { headers: { 'apikey': CW.supabaseKey, 'Authorization': `Bearer ${CW.supabaseKey}` } }
    );
    if (!passRes.ok) return null;
    const passes = await passRes.json();
    if (!passes.length) return [];

    const ids    = passes.map(p => p.student_id).join(',');
    const stuRes = await fetch(
      `${CW.supabaseUrl}/rest/v1/students?select=id,full_name&id=in.(${ids})`,
      { headers: { 'apikey': CW.supabaseKey, 'Authorization': `Bearer ${CW.supabaseKey}` } }
    );
    const students = stuRes.ok ? await stuRes.json() : [];
    const nameMap  = {};
    students.forEach(s => nameMap[s.id] = s.full_name);

    return passes.map(p => ({
      ...p,
      fullName: nameMap[p.student_id] || 'STUDENT',
    }));
  } catch(e) { return null; }
}

function cwBuildPassableScreen(passes) {
  if (!passes || !passes.length) return null;
  const minsOut = t => Math.floor((new Date() - new Date(t)) / 60000);
  const lines   = ['STUDENTS OUT NOW'];
  passes.slice(0, 5).forEach(p => {
    const first = p.fullName.toUpperCase().split(' ')[0];
    const mins  = minsOut(p.time_out);
    const flag  = mins > 10 ? ' !' : '';
    lines.push(cwTrunc(first + '  ' + mins + ' MIN' + flag, 28));
  });
  const over10 = passes.filter(p => minsOut(p.time_out) > 10).length;
  while (lines.length < 6) lines.push('');
  lines.push(passes.length + ' OUT' + (over10 ? '  ' + over10 + ' OVER 10 MIN' : '  ALL CLEAR'));
  return { lines: lines.slice(0, 7), speed: 20, _isPassableSlot: true };
}


/* ═══════════════════════════════════════════════════════════
   14. CODE BEHAVIOR SCREENS
═══════════════════════════════════════════════════════════ */
const CW_CODE_SCREENS = [
  { lines: ['C.O.D.E · COURTEOUS','','THANK YOU FOR LISTENING','WHEN OTHERS ARE SPEAKING','','',''] },
  { lines: ['C.O.D.E · ON TASK','','GOOD JOB ARRIVING READY','AND ON TIME EVERY DAY','','',''] },
  { lines: ['C.O.D.E · DETERMINED','','IT\'S GREAT TO SEE YOU','PUSH THROUGH THE TOUGH STUFF','','',''] },
  { lines: ['C.O.D.E · EXCELLENCE','','THANK YOU FOR DOING','YOUR HONEST BEST TODAY','','',''] },
];
let _cwCodeIdx = 0;

function cwBuildCodeScreen() {
  const s = CW_CODE_SCREENS[_cwCodeIdx % CW_CODE_SCREENS.length];
  _cwCodeIdx++;
  return { ...s, speed: 10, _isCodeSlot: true };
}


/* ═══════════════════════════════════════════════════════════
   15. SCHEDULE SCREEN BUILDER
═══════════════════════════════════════════════════════════ */
function cwBuildScheduleScreen(calEvents) {
  const MON  = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const DAYS = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  const now  = new Date();
  const dateLabel = DAYS[now.getDay()] + ' ' + MON[now.getMonth()] + ' ' + now.getDate();
  const schedKey  = cwDetectSchedule(calEvents || window._cwCalEvents || []);

  if (!schedKey) {
    const next = cwGetNextSchoolDay();
    return {
      lines: [
        'NO SCHOOL TODAY', dateLabel, '',
        'NEXT SCHOOL DAY',
        next ? next.label : 'MONDAY',
        next ? next.schedLabel + ' BELL' : 'REGULAR BELL',
        'GO COWBOYS',
      ],
      speed: 15, _isScheduleSlot: true,
    };
  }

  const schedule   = SCHEDULES[schedKey];
  if (!schedule) return null;
  const periods    = schedule.periods;
  const nm         = now.getHours() * 60 + now.getMinutes();
  const currentIdx = periods.findIndex(p =>
    nm >= cwTimeToMins(p.start) && nm < cwTimeToMins(p.end)
  );

  let startSlice = 0;
  if (currentIdx > 0) startSlice = Math.max(0, Math.min(currentIdx - 1, periods.length - 6));
  const visible = periods.slice(startSlice, startSlice + 6);

  const lines = [cwTrunc(schedule.label, 28)];
  for (const p of visible) {
    const isCur  = periods.indexOf(p) === currentIdx;
    const marker = isCur ? '\u25b6' : ' ';
    const zp     = t => t.indexOf(':') === 1 ? '0' + t : t;
    const name   = p.name.substring(0, 7).padEnd(7);
    const tStr   = (zp(p.start) + '-' + zp(p.end)).padEnd(11);
    const nowStr = isCur ? 'NOW' : '   ';
    lines.push(('  ' + marker + ' ' + name + '  ' + tStr + ' ' + nowStr).substring(0, 28));
  }
  while (lines.length < 7) lines.push('');
  return { lines: lines.slice(0, 7), speed: 15, _isScheduleSlot: true };
}


/* ═══════════════════════════════════════════════════════════
   16. SLOT INJECTION ENGINE
   The message array uses _flag properties to identify live
   slots. This engine finds them and replaces with fresh data.
   Import this into display.html — call cwInjectSlot(messages, key, screen).
═══════════════════════════════════════════════════════════ */

// All known slot keys and their placeholder/slot flag pairs
const CW_SLOT_MAP = {
  calendar:   { ph: '_isCalendarPlaceholder',   sl: '_isCalendarSlot'   },
  schedule:   { ph: '_isSchedulePlaceholder',   sl: '_isScheduleSlot'   },
  birthday:   { ph: '_isBirthdayPlaceholder',   sl: '_isBirthdaySlot'   },
  countdown:  { ph: '_isCountdownPlaceholder',  sl: '_isCountdownSlot'  },
  quickMsg:   { ph: '_isQuickMsgPlaceholder',   sl: '_isQuickMsgSlot'   },
  facts:      { ph: '_isFactsPlaceholder',      sl: '_isFactsSlot'      },
  passable:   { ph: '_isPassablePlaceholder',   sl: '_isPassableSlot'   },
  weather:    { ph: '_isWeatherPlaceholder',    sl: '_isWeatherSlot'    },
  code:       { ph: '_isCodePlaceholder',       sl: '_isCodeSlot'       },
  menu:       { ph: '_isMenuPlaceholder',       sl: '_isMenuSlot'       },
  objectives: { ph: '_isObjectivesPlaceholder', sl: '_isObjectivesSlot' },
};

function cwFindSlotIdx(messages, key) {
  const flags = CW_SLOT_MAP[key];
  if (!flags) return -1;
  let idx = messages.findIndex(m => m[flags.ph]);
  if (idx < 0) idx = messages.findIndex(m => m[flags.sl]);
  return idx;
}

function cwInjectSlot(messages, key, screen, buildDotsFn) {
  const idx  = cwFindSlotIdx(messages, key);
  if (idx < 0) return;
  const flag = CW_SLOT_MAP[key].sl;
  if (screen) {
    messages[idx] = { ...screen, [flag]: true };
  } else {
    messages[idx] = cwFallbackScreen(key);
  }
  if (typeof buildDotsFn === 'function') buildDotsFn();
}

// Dynamic objectives refresh — inserts screen when period is active,
// removes it when period ends or objectives are cleared.
// Called every 60s from display.html schedule refresh interval.
function cwRefreshObjectives(messages, buildDotsFn) {
  const screen  = cwBuildObjectivesScreen(window._cwCalEvents || []);
  const existingIdx = messages.findIndex(m => m._isObjectivesSlot);

  if (screen) {
    if (existingIdx >= 0) {
      // Update in place
      messages[existingIdx] = screen;
    } else {
      // Insert after schedule slot (position 1 in rotation feels natural)
      const schedIdx = messages.findIndex(m => m._isScheduleSlot || m._isSchedulePlaceholder);
      const insertAt = schedIdx >= 0 ? schedIdx + 1 : 1;
      messages.splice(insertAt, 0, screen);
    }
  } else {
    // Remove if no longer active
    if (existingIdx >= 0) messages.splice(existingIdx, 1);
  }

  if (typeof buildDotsFn === 'function') buildDotsFn();
}
  const flag = CW_SLOT_MAP[key]?.sl || '_slot';
  const fb = {
    calendar:  ['RHS EVENTS CALENDAR','NO EVENTS TODAY','','CHECK RJUSD.ORG','','','RIVERDALE HIGH SCHOOL'],
    schedule:  ['BELL SCHEDULE','NOT AVAILABLE','','CHECK RJUSD.ORG','','',''],
    birthday:  ['BIRTHDAYS THIS WEEK','NO BIRTHDAYS TODAY','','CHECK BACK SOON','','','GO COWBOYS'],
    countdown: ['COMING UP AT RHS','','NO UPCOMING EVENTS','','','',''],
    quickMsg:  ['ROOM ' + CW.room + ' BOARD','','NO MESSAGES YET','','','','ROOM ' + CW.room],
    facts:     ['DID YOU KNOW?','','FACTS LOADING','','','','ROOM ' + CW.room],
    passable:  ['STUDENTS OUT NOW','','ALL CLEAR','','NO PASSES ACTIVE','','GO COWBOYS'],
    weather:   ['WEATHER · ' + CW.city,'','DATA UNAVAILABLE','','CHECK BACK SOON','','GO COWBOYS'],
    code:      ['C.O.D.E · RHS','','BE COURTEOUS','BE ON TASK','BE DETERMINED','BE EXCELLENT','GO COWBOYS'],
    menu:      ['BRUNCH + LUNCH MENU','','NO MENU TODAY','','CHECK CAFETERIA','','GO COWBOYS'],
  };
  return { lines: (fb[key] || Array(7).fill('')), speed: 10, [flag]: true };
}

/* ═══════════════════════════════════════════════════════════
   OBJECTIVES SCREEN SYSTEM
   Shows learning objectives for the current period only.
   Respects display_mode: always / timed / manual
   Filters break periods (BRUNCH, LUNCH, etc.) automatically.
═══════════════════════════════════════════════════════════ */
let CW_OBJECTIVES = {};  // keyed by period name e.g. 'P1', 'P2'

async function cwFetchObjectives() {
  const rows = await cwSupabaseFetch(
    `cw_objectives?room=eq.${CW.room}&order=period.asc`
  );
  if (rows && rows.length) {
    CW_OBJECTIVES = {};
    rows.forEach(r => { CW_OBJECTIVES[r.period] = r; });
  }
}

function cwGetCurrentPeriodKey(calEvents) {
  const schedKey = cwDetectSchedule(calEvents || window._cwCalEvents || []);
  if (!schedKey) return null;
  const schedule = SCHEDULES[schedKey];
  if (!schedule) return null;

  const now  = new Date();
  const nm   = now.getHours() * 60 + now.getMinutes();

  for (const p of schedule.periods) {
    // Skip break periods — never show objectives during brunch/lunch
    if (p.break) continue;
    const start = cwTimeToMins(p.start);
    const end   = cwTimeToMins(p.end);
    if (nm >= start && nm < end) {
      // Normalize period name — P1/P2 block days → P1, P2 etc.
      // We match on the first token before the slash
      const key = p.name.split('/')[0].trim();
      return { key, start, end, elapsed: nm - start };
    }
  }
  return null;
}

function cwBuildObjectivesScreen(calEvents) {
  const current = cwGetCurrentPeriodKey(calEvents);
  if (!current) return null;

  const obj = CW_OBJECTIVES[current.key];
  if (!obj || !obj.active) return null;
  if (!obj.title && !obj.line1) return null;

  // Check scheduled date — don't show before the scheduled date
  if (obj.scheduled_date) {
    const today = cwLocalDateStr(new Date());
    if (obj.scheduled_date > today) return null;
  }

  // Check display mode
  const mode = obj.display_mode || 'always';
  if (mode === 'timed') {
    const maxMins = obj.timed_minutes || 10;
    if (current.elapsed >= maxMins) return null;
  }

  const title = cwTrunc((obj.title || current.key + ' · OBJECTIVES').toUpperCase(), 28);
  const lines  = [title];

  [obj.line1, obj.line2, obj.line3, obj.line4, obj.line5, obj.line6]
    .filter(l => l && l.trim())
    .slice(0, 6)
    .forEach(l => lines.push(cwTrunc('▸ ' + l.toUpperCase(), 28)));

  while (lines.length < 7) lines.push('');
  return {
    lines:             lines.slice(0, 7),
    speed:             12,
    _isObjectivesSlot: true,
    _leftAlign:        true,
  };
}
   Replaces Google Sheets CSV as the slide source.
   Returns messages array ready for the flipboard.
═══════════════════════════════════════════════════════════ */
async function cwFetchScreens() {
  const rows = await cwSupabaseFetch(
    `cw_screens?room=eq.${CW.room}&enabled=eq.true&order=sort_order.asc`
  );
  if (!rows || !rows.length) return null;

  return rows.map(r => {
    const lines = Array.isArray(r.lines) ? r.lines : JSON.parse(r.lines || '[]');
    // Pad to 7 lines
    while (lines.length < 7) lines.push('');

    if (r.is_slot && r.slot_type) {
      const flagKey = `_is${r.slot_type.charAt(0).toUpperCase() + r.slot_type.slice(1)}Placeholder`;
      return {
        lines,
        speed: r.speed || 10,
        id:    r.id,
        [flagKey]: true,
      };
    }
    return {
      lines,
      speed:     r.speed || 10,
      id:        r.id,
      sort_order: r.sort_order,
    };
  }).filter(s => {
    const isSlot = Object.values(CW_SLOT_MAP).some(f => s[f.ph]);
    return isSlot || (s.lines && s.lines.some(l => l && l.trim()));
  });
}

// Master refresh — call this with your messages array on init and re-sync
async function cwRefreshAllSlots(messages, buildDotsFn) {
  const has = key => cwFindSlotIdx(messages, key) >= 0;

  const jobs = [];

  // ALWAYS fetch DoNotDisplay list first — privacy filter must load
  // before any student names are rendered anywhere
  jobs.push(cwFetchDoNotDisplay());

  // Fetch birthdays from Supabase so birthday screen is accurate
  jobs.push(cwFetchBirthdays());

  if (has('calendar') && CW.screens.calendar) {
    jobs.push(cwFetchCalendar().then(events => {
      cwInjectSlot(messages, 'calendar', cwBuildCalendarScreen(events), buildDotsFn);
    }));
  }
  if (has('weather') && CW.screens.weather) {
    jobs.push(cwFetchWeather().then(data => {
      cwInjectSlot(messages, 'weather', cwBuildWeatherScreen(data), buildDotsFn);
    }));
  }
  if (has('passable') && CW.screens.passable) {
    jobs.push(cwFetchPassable().then(passes => {
      cwInjectSlot(messages, 'passable',
        passes && passes.length ? cwBuildPassableScreen(passes) : null, buildDotsFn);
    }));
  }
  if (has('quickMsg') && CW.screens.quickMsg) {
    jobs.push(cwFetchAllApprovedMessages().then(msgs => {
      if (!msgs || !msgs.length) {
        cwInjectSlot(messages, 'quickMsg', null, buildDotsFn);
        return;
      }
      // First message goes into the placeholder slot
      cwInjectSlot(messages, 'quickMsg', cwBuildQuickMsgScreen(msgs[0]), buildDotsFn);
      // Additional messages get inserted right after the first slot
      if (msgs.length > 1) {
        const slotIdx = cwFindSlotIdx(messages, 'quickMsg');
        const extras  = msgs.slice(1).map(m => cwBuildQuickMsgScreen(m)).filter(Boolean);
        if (slotIdx >= 0 && extras.length) {
          messages.splice(slotIdx + 1, 0, ...extras);
          if (typeof buildDotsFn === 'function') buildDotsFn();
        }
      }
    }));
  }
  if (has('countdown') && CW.screens.countdown) {
    jobs.push(cwFetchCustomCountdowns().then(() => {
      cwInjectSlot(messages, 'countdown', cwBuildCountdownScreen(), buildDotsFn);
    }));
  }

  // Fire all async fetches in parallel, 5s timeout each
  await Promise.all(jobs.map(j => Promise.race([j, new Promise(r => setTimeout(r, 5000))])));

  // Synchronous slots — build after async jobs complete
  if (has('schedule') && CW.screens.schedule) {
    cwInjectSlot(messages, 'schedule', cwBuildScheduleScreen(), buildDotsFn);
  }
  if (has('birthday') && CW.screens.birthday) {
    cwInjectSlot(messages, 'birthday', cwBuildBirthdayScreen(), buildDotsFn);
  }
  if (has('facts') && CW.screens.facts) {
    cwInjectSlot(messages, 'facts', cwBuildFactsScreen(), buildDotsFn);
  }
  if (has('menu') && CW.screens.menu) {
    cwInjectSlot(messages, 'menu', cwBuildMenuScreen(), buildDotsFn);
  }
  if (has('code') && CW.screens.code) {
    cwInjectSlot(messages, 'code', cwBuildCodeScreen(), buildDotsFn);
  }

  // Objectives — dynamic inject/remove based on current period
  cwRefreshObjectives(messages, buildDotsFn);
}


/* ═══════════════════════════════════════════════════════════
   17. UTILITY HELPERS
═══════════════════════════════════════════════════════════ */

// Truncate at word boundary
function cwTrunc(str, max) {
  str = (str || '').toUpperCase().trim();
  if (str.length <= max) return str;
  const cut = str.substring(0, max - 1);
  const sp  = cut.lastIndexOf(' ');
  return sp > max * 0.6 ? cut.substring(0, sp) : cut;
}

// Left-pad or center a string
function cwPad(str, width, align) {
  str = (str || '').substring(0, width);
  const pad = width - str.length;
  if (align === 'center') {
    const l = Math.floor(pad / 2);
    return ' '.repeat(l) + str + ' '.repeat(pad - l);
  }
  return str + ' '.repeat(pad); // left
}

// Weather code → emoji + label (used by mobile)
function cwWxCode(code, isDay) {
  const map = {
    0:  [isDay ? '☀️' : '🌙','Clear'],    1: [isDay ? '🌤':'🌙','Mostly Clear'],
    2:  ['⛅️','Partly Cloudy'],            3: ['☁️','Overcast'],
    45: ['🌫','Foggy'],                    48: ['🌫','Icy Fog'],
    51: ['🌦','Light Drizzle'],            53: ['🌦','Drizzle'],
    55: ['🌧','Heavy Drizzle'],            61: ['🌧','Light Rain'],
    63: ['🌧','Rain'],                     65: ['🌧','Heavy Rain'],
    80: ['🌦','Showers'],                  95: ['⛈','Thunderstorm'],
    99: ['⛈','Severe Storm'],
  };
  return map[code] || ['🌡','Unknown'];
}

// Build a mobile-style weather card DOM element (used by mobile.html)
function cwBuildWeatherCard(wx) {
  const card = document.createElement('div');
  card.className = 'card';
  if (!wx) {
    card.innerHTML = `<div class="card-header"><span class="card-label">Weather · ${CW.city}</span></div><div class="card-body"><div class="error-state">Unable to load weather</div></div>`;
    return card;
  }
  const [icon, desc] = cwWxCode(wx.weather_code, wx.is_day);
  const temp  = Math.round(wx.temperature_2m);
  const feels = Math.round(wx.apparent_temperature);
  const wind  = Math.round(wx.wind_speed_10m);
  const humid = Math.round(wx.relative_humidity_2m);
  card.innerHTML = `
    <div class="card-header">
      <span class="card-label">Weather · ${CW.city}</span>
      <span class="card-tag">${new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}</span>
    </div>
    <div class="card-body">
      <div class="weather-main">
        <div class="weather-temp-wrap">
          <div class="weather-temp">${temp}°</div>
          <div class="weather-feels">Feels like ${feels}°</div>
        </div>
        <div class="weather-icon-wrap">
          <div class="weather-icon">${icon}</div>
          <div class="weather-desc">${desc}</div>
        </div>
      </div>
      <div class="weather-details">
        <div class="weather-detail-item"><div class="weather-detail-label">Humidity</div><div class="weather-detail-value">${humid}%</div></div>
        <div class="weather-detail-item"><div class="weather-detail-label">Wind</div><div class="weather-detail-value">${wind} mph</div></div>
      </div>
    </div>`;
  return card;
}

// Build a mobile-style period timer card DOM element (used by mobile.html)
function cwBuildPeriodTimerCard(calEvents) {
  const data = cwBuildPeriodTimerData(calEvents);
  if (!data) return null;
  const card = document.createElement('div');
  card.className = 'period-timer-card' + (data.status !== 'normal' ? ' ' + data.status : '');
  if (data.inPeriod) {
    card.innerHTML = `
      <div class="pt-left">
        <div class="pt-period ${data.status}">${data.label}</div>
        <div class="pt-ends">Ends at ${data.endsAt}</div>
      </div>
      <div>
        <div class="pt-time ${data.status}">${data.timeStr}</div>
        <div class="pt-label">remaining</div>
      </div>`;
  } else {
    card.innerHTML = `
      <div class="pt-left">
        <div class="pt-period">${data.label}</div>
        <div class="pt-ends">Starts at ${data.startsAt}</div>
      </div>
      <div>
        <div class="pt-time">${data.minsAway}</div>
        <div class="pt-label">min away</div>
      </div>`;
  }
  return card;
}
