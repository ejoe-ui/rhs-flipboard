/**
 * cowboy-wire-core.js
 * Shared logic for RHS Cowboy Wire mobile pages.
 * Include this file in any page that needs schedules, 
 * weather, countdowns, birthdays, or pass card logic.
 * 
 * Usage: <script src="cowboy-wire-core.js"></script>
 */

/* ════ SCHEDULES ════ */
const SCHEDULES = {
  REGULAR: { label: 'Regular Bell Schedule', periods: [
    { name: 'P1', start: '8:10', end: '9:02' },
    { name: 'P2', start: '9:06', end: '9:56' },
    { name: 'BRUNCH', start: '9:56', end: '10:11', break: true },
    { name: 'P3', start: '10:15', end: '11:05' },
    { name: 'P4', start: '11:09', end: '11:59' },
    { name: 'LUNCH', start: '11:59', end: '12:33', break: true },
    { name: 'P5', start: '12:37', end: '1:27' },
    { name: 'P6', start: '1:31', end: '2:21' },
    { name: 'P7', start: '2:25', end: '3:15' },
  ]},
  EARLY_RELEASE: { label: 'Early Release Schedule', periods: [
    { name: 'P1', start: '8:10', end: '8:56' },
    { name: 'P2', start: '9:00', end: '9:41' },
    { name: 'P3', start: '9:45', end: '10:26' },
    { name: 'P4', start: '10:30', end: '11:11' },
    { name: 'LUNCH', start: '11:11', end: '11:45', break: true },
    { name: 'P5', start: '11:49', end: '12:30' },
    { name: 'P6', start: '12:34', end: '1:15' },
    { name: 'P7', start: '1:19', end: '2:00' },
  ]},
  BLOCK_WED: { label: 'Block Day · 1-3-5-7', periods: [
    { name: 'P1/P2', start: '8:10', end: '9:57' },
    { name: 'BRUNCH', start: '9:57', end: '10:12', break: true },
    { name: 'P3/P4', start: '10:16', end: '11:59' },
    { name: 'LUNCH', start: '11:59', end: '12:33', break: true },
    { name: 'P5/P6', start: '12:37', end: '2:20' },
    { name: 'P7', start: '2:24', end: '3:15' },
  ]},
  BLOCK_THU: { label: 'Block Day · 2-4-6-7', periods: [
    { name: 'P1/P2', start: '8:10', end: '9:57' },
    { name: 'BRUNCH', start: '9:57', end: '10:12', break: true },
    { name: 'P3/P4', start: '10:16', end: '11:59' },
    { name: 'LUNCH', start: '11:59', end: '12:33', break: true },
    { name: 'P5/P6', start: '12:37', end: '2:20' },
    { name: 'P7', start: '2:24', end: '3:15' },
  ]},
  MINIMUM: { label: 'Minimum Day Schedule', periods: [
    { name: 'P1', start: '8:10', end: '8:46' },
    { name: 'P2', start: '8:50', end: '9:23' },
    { name: 'P3', start: '9:27', end: '10:00' },
    { name: 'P4', start: '10:04', end: '10:37' },
    { name: 'BRU/LUN', start: '10:37', end: '11:10', break: true },
    { name: 'P5', start: '11:14', end: '11:47' },
    { name: 'P6', start: '11:51', end: '12:24' },
    { name: 'P7', start: '12:28', end: '1:01' },
  ]},
  CODE_DAY: { label: 'C.O.D.E Day Schedule', periods: [
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
  ]},
};

/* ════ NO SCHOOL DATES ════ */
const NO_SCHOOL = new Set([
  '2025-09-01','2025-11-10','2025-11-11','2025-11-27','2025-11-28',
  '2025-12-22','2025-12-23','2025-12-24','2025-12-25','2025-12-26',
  '2025-12-29','2025-12-30','2025-12-31','2026-01-01','2026-01-02',
  '2026-01-05','2026-01-06','2026-01-07','2026-01-08','2026-01-09',
  '2026-01-12','2026-01-19','2026-02-09','2026-02-16',
  '2026-03-30','2026-03-31','2026-04-01','2026-04-02','2026-04-03',
  '2026-05-25',
]);

/* ════ ONE-DAY OVERRIDES ════ */
// Add dates here when a specific date needs a specific schedule
// Format: 'YYYY-MM-DD': 'SCHEDULE_KEY'
const DATE_OVERRIDES = {
  '2026-05-15': 'CODE_DAY',
};

/* ════ COUNTDOWNS ════ */
const COUNTDOWNS = [
  { label: 'GRADUATION',        date: '2026-06-12' },
  { label: 'END OF SCHOOL',     date: '2026-06-12' },
  { label: 'MEMORIAL DAY',      date: '2026-05-25' },
  { label: 'END OF SEMESTER 2', date: '2026-06-12' },
  { label: 'SPRING BREAK',      date: '2026-03-28' },
  { label: 'PROGRESS REPORTS',  date: '2026-05-01' },
];

/* ════ BIRTHDAYS ════ */
const BIRTHDAYS = [
  { name: 'Camila Villanueva',      month: 5,  day: 9  },
  { name: 'Elena Mendes',           month: 5,  day: 10 },
  { name: 'Isabel Vera Rios',       month: 5,  day: 19 },
  { name: 'Celeste Carrillo',       month: 5,  day: 21 },
  { name: 'Emilly Diaz',            month: 5,  day: 26 },
  { name: 'Yeraldine Lopez Vega',   month: 5,  day: 29 },
  { name: 'Ella-Jade Stolliker',    month: 5,  day: 31 },
  { name: 'Alyssa Hernandez',       month: 6,  day: 17 },
  { name: 'Perla Marin Alvarez',    month: 6,  day: 20 },
  { name: 'Jaylee Ybarra',          month: 7,  day: 4  },
  { name: 'Gabriel Garcia Corona',  month: 7,  day: 6  },
  { name: 'Miguel Marcos-Delgado',  month: 7,  day: 18 },
  { name: 'Elpidio Solorio',        month: 7,  day: 20 },
  { name: 'Michelle Ramirez',       month: 7,  day: 22 },
  { name: 'Alyssa Gonzalez',        month: 7,  day: 25 },
  { name: 'Camila Cortes Perez',    month: 7,  day: 27 },
  { name: 'Starr Garcia',           month: 7,  day: 28 },
  { name: 'Liyrise Aguilar',        month: 8,  day: 4  },
  { name: 'Santiago Chavez',        month: 8,  day: 4  },
  { name: 'Cinthia Lawless',        month: 8,  day: 7  },
  { name: 'Natalie Arias',          month: 8,  day: 11 },
  { name: 'Dominic Figueroa',       month: 8,  day: 11 },
  { name: 'Marisol Flores Rodriguez', month: 8, day: 12 },
  { name: 'Violeta Tamayo',         month: 8,  day: 15 },
  { name: 'Valeria Perez Solis',    month: 8,  day: 24 },
  { name: 'Valeria Olguin',         month: 8,  day: 29 },
];

/* ════ FACT BANK ════ */
const FACT_BANK = [
  'The average person sees 6,000–10,000 ads every single day.',
  'Instagram was sold to Facebook for $1 billion with only 13 employees.',
  'Warren Buffett made 99% of his wealth after age 50.',
  'The first film ever made was only 2 seconds long, in 1888.',
  'Cleopatra lived closer in time to the iPhone than to the pyramids.',
  'Google was originally called "Backrub" before changing its name.',
  'College grads earn 65% more over their lifetime than high school grads.',
  'The average person spends 7 years of their life on social media.',
  'Apple started in a garage with just $1,750 in 1976.',
  'TikTok reached 1 billion users faster than any app in history.',
  '65% of jobs that exist in 2030 haven\'t been invented yet.',
  'The human brain can store about 2.5 petabytes of information.',
  'Oxford University is older than the Aztec Empire.',
  'Compound interest is the "eighth wonder of the world" — Einstein.',
  'The Fibonacci sequence appears in flower petals, shells, and galaxies.',
  'A billion seconds ago it was 1993.',
  'California has the world\'s 5th largest economy all by itself.',
  'Nike\'s founder Phil Knight sold shoes from the trunk of his car.',
  'The first paid TV ad cost only $9 in 1941.',
  'Red increases appetite — why McDonald\'s and KFC both use it.',
  'The first computer bug was an actual moth, found in 1947.',
  'Smartphones have more computing power than NASA had in 1969.',
  'Vikings never actually wore horned helmets.',
  '90% of purchasing decisions are made subconsciously.',
  'Internships lead to full-time jobs 70% of the time.',
];

/* ════ HELPERS ════ */
function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function timeToMins(t) {
  const [h,m] = t.split(':').map(Number);
  const hour24 = (h >= 1 && h <= 7) ? h + 12 : h;
  return hour24 * 60 + m;
}

function nowMins() {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
}

function fmtTime12(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  let h = d.getHours(), m = d.getMinutes();
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return m > 0 ? `${h}:${String(m).padStart(2,'0')} ${ap}` : `${h}:00 ${ap}`;
}

function daysUntil(dateStr) {
  const now = new Date();
  const target = new Date(dateStr + 'T00:00:00');
  const diff = target - new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.ceil(diff / 86400000);
}

/* ════ SCHEDULE DETECTION ════ */
// Fix schedule detection here — it affects ALL pages automatically.
function detectSchedule(calEvents) {
  const now = new Date();
  const dow = now.getDay();
  const dateStr = localDateStr(now);

  if (dow === 0 || dow === 6 || NO_SCHOOL.has(dateStr)) return null;

  // 1. Check one-day date overrides first
  if (DATE_OVERRIDES[dateStr]) return DATE_OVERRIDES[dateStr];

  // 2. Check today's calendar events only
  if (calEvents && calEvents.length) {
    const todayEvents = calEvents.filter(e => {
      if (!e.start) return false;
      return e.start.slice(0, 10) === dateStr;
    });
    for (const e of todayEvents) {
      const t = (e.title || '').toLowerCase();
      if (t.includes('foggy') || t.includes('late arrival')) return 'FOGGY';
      if (t.includes('minimum'))                               return 'MINIMUM';
      if (t.includes('early release'))                        return 'EARLY_RELEASE';
      if (t.includes('block'))    return dow === 4 ? 'BLOCK_THU' : 'BLOCK_WED';
      if (t.includes('c.o.d.e') || t.includes('code day'))   return 'CODE_DAY';
    }
  }

  // 3. Short week override — ≤4 school days this week → Regular
  function getWeekSchoolDays() {
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
    let count = 0;
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const ds = localDateStr(d);
      if (!NO_SCHOOL.has(ds)) count++;
    }
    return count;
  }
  if (getWeekSchoolDays() <= 4) return 'REGULAR';

  // 4. Default weekly pattern
  if (dow === 1) return 'EARLY_RELEASE';
  if (dow === 3) return 'BLOCK_WED';
  if (dow === 4) return 'BLOCK_THU';
  return 'REGULAR';
}

/* ════ NEXT SCHOOL DAY ════ */
function getNextSchoolDay() {
  const monNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const now = new Date();
  for (let i = 1; i <= 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const dow = d.getDay();
    const ds = localDateStr(d);
    if (dow === 0 || dow === 6 || NO_SCHOOL.has(ds)) continue;
    if (DATE_OVERRIDES[ds]) {
      const sched = SCHEDULES[DATE_OVERRIDES[ds]];
      return { label: `${dayNames[dow]} ${monNames[d.getMonth()]} ${d.getDate()}`, schedLabel: sched?.label || DATE_OVERRIDES[ds] };
    }
    const schedLabels = { 1: 'Early Release', 3: 'Block 1-3-5-7', 4: 'Block 2-4-6-7', 2: 'Regular', 5: 'Regular' };
    return { label: `${dayNames[dow]} ${monNames[d.getMonth()]} ${d.getDate()}`, schedLabel: schedLabels[dow] || 'Regular' };
  }
  return null;
}

/* ════ PERIOD TIMER ════ */
function buildPeriodTimerCard(calEvents) {
  const schedKey = detectSchedule(calEvents || window._mobileCalEvents || []);
  if (!schedKey || schedKey === 'FOGGY') return null;
  const schedule = SCHEDULES[schedKey];
  if (!schedule) return null;
  const now     = new Date();
  const nm      = now.getHours() * 60 + now.getMinutes();
  const nowSecs = now.getSeconds();
  for (const p of schedule.periods) {
    const start = timeToMins(p.start);
    const end   = timeToMins(p.end);
    if (nm >= start && nm < end) {
      const remaining = (end - nm) * 60 - nowSecs;
      const remMins   = Math.floor(remaining / 60);
      const remSecs   = remaining % 60;
      const cls       = remMins < 1 ? 'ending' : remMins < 5 ? 'warning' : '';
      const timeStr   = remMins > 0
        ? remMins + ':' + String(remSecs).padStart(2,'0')
        : '0:' + String(remSecs).padStart(2,'0');
      const card = document.createElement('div');
      card.className = `period-timer-card ${cls}`;
      card.innerHTML = `
        <div class="pt-left">
          <div class="pt-period ${cls}">${p.name} · ${schedule.label}</div>
          <div class="pt-ends">Ends at ${p.end}</div>
        </div>
        <div>
          <div class="pt-time ${cls}">${timeStr}</div>
          <div class="pt-label">remaining</div>
        </div>`;
      return card;
    }
  }
  for (const p of schedule.periods) {
    const start = timeToMins(p.start);
    if (nm < start) {
      const minsUntil = start - nm;
      const card = document.createElement('div');
      card.className = 'period-timer-card';
      card.innerHTML = `
        <div class="pt-left">
          <div class="pt-period">Next: ${p.name}</div>
          <div class="pt-ends">Starts at ${p.start}</div>
        </div>
        <div>
          <div class="pt-time">${minsUntil}</div>
          <div class="pt-label">min away</div>
        </div>`;
      return card;
    }
  }
  return null;
}

/* ════ WEATHER ════ */
function wxCode(code, isDay) {
  const map = {
    0:  [isDay ? '☀️' : '🌙', 'Clear'],
    1:  [isDay ? '🌤' : '🌙', 'Mostly Clear'],
    2:  ['⛅️', 'Partly Cloudy'],
    3:  ['☁️', 'Overcast'],
    45: ['🌫', 'Foggy'],
    48: ['🌫', 'Icy Fog'],
    51: ['🌦', 'Light Drizzle'],
    53: ['🌦', 'Drizzle'],
    55: ['🌧', 'Heavy Drizzle'],
    61: ['🌧', 'Light Rain'],
    63: ['🌧', 'Rain'],
    65: ['🌧', 'Heavy Rain'],
    71: ['🌨', 'Light Snow'],
    73: ['🌨', 'Snow'],
    75: ['❄️', 'Heavy Snow'],
    80: ['🌦', 'Showers'],
    81: ['🌧', 'Heavy Showers'],
    95: ['⛈', 'Thunderstorm'],
    96: ['⛈', 'Thunderstorm'],
    99: ['⛈', 'Severe Storm'],
  };
  return map[code] || ['🌡', 'Unknown'];
}

async function fetchWeather(lat, lon) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m,is_day&temperature_unit=fahrenheit&wind_speed_unit=mph&forecast_days=1`;
    const res  = await fetch(url);
    const data = await res.json();
    return data.current || null;
  } catch(e) { return null; }
}

function buildWeatherCard(wx) {
  const card = document.createElement('div');
  card.className = 'card';
  if (!wx) {
    card.innerHTML = `
      <div class="card-header">
        <span class="card-label">Weather · Riverdale, CA</span>
      </div>
      <div class="card-body"><div class="error-state">Unable to load weather</div></div>`;
    return card;
  }
  const [icon, desc] = wxCode(wx.weather_code, wx.is_day);
  const temp  = Math.round(wx.temperature_2m);
  const feels = Math.round(wx.apparent_temperature);
  const wind  = Math.round(wx.wind_speed_10m);
  const humid = Math.round(wx.relative_humidity_2m);
  card.innerHTML = `
    <div class="card-header">
      <span class="card-label">Weather · Riverdale, CA</span>
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
        <div class="weather-detail-item">
          <div class="weather-detail-label">Humidity</div>
          <div class="weather-detail-value">${humid}%</div>
        </div>
        <div class="weather-detail-item">
          <div class="weather-detail-label">Wind</div>
          <div class="weather-detail-value">${wind} mph</div>
        </div>
      </div>
    </div>`;
  return card;
}
