/**
 * config.js — Room 27 Classroom Configuration
 * ─────────────────────────────────────────────────────────────
 * This is the ONLY file that differs between classrooms.
 * Every other file (display.html, mobile.html, admin.html,
 * cowboy-wire-core.js) is identical across all deployments.
 *
 * To deploy to a new classroom:
 *   1. Copy this file
 *   2. Update the values below
 *   3. Upload to that classroom's GitHub Pages repo
 *
 * Load order in HTML files: config.js → cowboy-wire-core.js → page script
 * ─────────────────────────────────────────────────────────────
 */

const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnc2ZyaGlienhqd2N1ZGp2Znp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NTM1NTQsImV4cCI6MjA5MzEyOTU1NH0.A1xLychMJ1UBgRHbrtY5RwVULG71zhK9u-WuTrsA8cU';

const CLASSROOM_CONFIG = {

  /* ── Identity ── */
  room:     '27',
  teacher:  'MR. JOE',
  badge:    'RHS · ROOM 27',        // shown in display header

  /* ── Supabase ── */
  supabaseUrl: 'https://lgsfrhibzxjwcudjvfzx.supabase.co',
  supabaseKey: SUPABASE_KEY,        // pulled from above — do not duplicate

  /* ── Google Apps Script (calendar + honor roll feed) ── */
  calScriptUrl: 'https://script.google.com/macros/s/AKfycbwdoA4UVuCyq8RU7hP6dBrRWAMVcMqq-0DNmZE09j6oVst1iPa7KzWq7raoCT3i0SL_/exec',

  /* ── Google Sheet (slide content CSV) ── */
  sheetUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSjqIQ3rsr_tr62T492hu3iEuXaNJnm9ayyAa6qgJGxm2YF5CsH9PStUPfmHpdOM2iHmGCQNsY-SZ9Q/pub?gid=0&single=true&output=csv',

  /* ── Location (weather) ── */
  lat:  36.4552,
  lon: -119.8785,
  city: 'RIVERDALE CA',

  /* ── Screen toggles ──────────────────────────────────────
     Set any screen to false to remove it from the rotation.
     Changes take effect on next page load.
  ─────────────────────────────────────────────────────────── */
  screens: {
    calendar:  true,   // RHS Events calendar (Google Apps Script)
    schedule:  true,   // Bell schedule with period timer
    birthday:  true,   // Student birthdays this week / coming up
    countdown: true,   // Days until breaks, holidays, milestones
    weather:   true,   // Live weather via Open-Meteo
    menu:      true,   // Daily cafeteria menu
    facts:     true,   // Rotating business/career facts
    passable:  true,   // Live hall pass data (who's out + how long)
    code:      true,   // C.O.D.E behavior screens
    honorRoll: true,   // Scrolling honor roll ticker
    quickMsg:  true,   // Teacher-posted quick messages (via admin)
  },

  /* ── Display behavior ── */
  display: {
    rows:          7,     // flipboard rows
    cols:          28,    // flipboard columns
    syncInterval:  60,    // seconds between sheet re-fetches
    scrambleSteps: 10,    // tile scramble animation steps
    scrambleMs:    75,    // ms per scramble step
  },

};
