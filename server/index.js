import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { buildMesocycle, migrateScheduleToNewFormat } from './scheduler.js';
import { getExercisePickerData, DEFAULT_TEMPLATES } from '../shared/ppl.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_DIR = join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(join(DATA_DIR, 'schedules'))) {
  fs.mkdirSync(join(DATA_DIR, 'schedules'), { recursive: true });
}

app.use(cors());
app.use(express.json());

// Helper: read JSON file
function readJSON(filename) {
  const path = join(DATA_DIR, filename);
  if (!fs.existsSync(path)) return null;
  return JSON.parse(fs.readFileSync(path, 'utf-8'));
}

// Helper: write JSON file
function writeJSON(filename, data) {
  const path = join(DATA_DIR, filename);
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

// Helper: read schedule file
function readSchedule(id) {
  const path = join(DATA_DIR, 'schedules', `${id}.json`);
  if (!fs.existsSync(path)) return null;
  return JSON.parse(fs.readFileSync(path, 'utf-8'));
}

// Helper: write schedule file
function writeSchedule(id, data) {
  const path = join(DATA_DIR, 'schedules', `${id}.json`);
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

// ============ USER ROUTES ============

app.get('/api/user', (req, res) => {
  const user = readJSON('user.json');
  res.json(user);
});

app.post('/api/user', (req, res) => {
  const user = req.body;
  writeJSON('user.json', user);
  res.json(user);
});

// ============ SCHEDULE ROUTES ============

app.get('/api/schedules', (req, res) => {
  const files = fs.readdirSync(join(DATA_DIR, 'schedules'));
  const schedules = files.map(f => {
    const data = JSON.parse(fs.readFileSync(join(DATA_DIR, 'schedules', f), 'utf-8'));
    return { id: f.replace('.json', ''), ...data };
  }).sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  res.json(schedules);
});

app.get('/api/schedules/current', (req, res) => {
  const schedules = readJSON('schedules.json') || [];
  const currentSchedule = schedules.find(s => s.isActive);
  if (!currentSchedule) return res.json(null);
  let fullSchedule = readSchedule(currentSchedule.id);
  if (fullSchedule) {
    fullSchedule = migrateScheduleToNewFormat(fullSchedule);
    writeSchedule(currentSchedule.id, fullSchedule);
  }
  res.json(fullSchedule);
});

app.post('/api/schedules/generate', (req, res) => {
  const { user, workoutDays, startDate, templateId = 'ppl' } = req.body;
  if (!user || !workoutDays || workoutDays.length === 0) {
    return res.status(400).json({ error: 'Missing user or workoutDays' });
  }
  const schedule = buildMesocycle(user, workoutDays, startDate || new Date().toISOString().split('T')[0], templateId);
  writeSchedule(schedule.id, schedule);
  const schedules = readJSON('schedules.json') || [];
  // Mark all existing schedules as inactive
  for (const s of schedules) s.isActive = false;
  schedules.push({ id: schedule.id, startDate: schedule.startDate, endDate: schedule.endDate, isActive: true });
  writeJSON('schedules.json', schedules);
  res.json(schedule);
});

app.post('/api/schedules', (req, res) => {
  const schedule = req.body;
  writeSchedule(schedule.id, schedule);

  // Update schedules index
  const schedules = readJSON('schedules.json') || [];
  const existing = schedules.findIndex(s => s.id === schedule.id);
  if (existing >= 0) {
    schedules[existing] = { id: schedule.id, startDate: schedule.startDate, endDate: schedule.endDate, isActive: schedule.isActive };
  } else {
    schedules.push({ id: schedule.id, startDate: schedule.startDate, endDate: schedule.endDate, isActive: schedule.isActive });
  }
  writeJSON('schedules.json', schedules);

  res.json(schedule);
});

app.get('/api/schedules/:id', (req, res) => {
  const schedule = readSchedule(req.params.id);
  if (!schedule) return res.status(404).json({ error: 'Schedule not found' });
  res.json(schedule);
});

app.patch('/api/schedules/:id', (req, res) => {
  const schedule = readSchedule(req.params.id);
  if (!schedule) return res.status(404).json({ error: 'Schedule not found' });
  const updated = { ...schedule, ...req.body };
  writeSchedule(req.params.id, updated);
  res.json(updated);
});

app.patch('/api/schedules/:id/days/:dayOfWeek', (req, res) => {
  const schedule = readSchedule(req.params.id);
  if (!schedule) return res.status(404).json({ error: 'Schedule not found' });
  const { dayOfWeek } = req.params;
  const { action, exercise, updates } = req.body;

  let modified = false;
  let workoutLabel = null;

  for (const week of schedule.schedule) {
    const dayEntry = week.days?.find(d => d.dayOfWeek === dayOfWeek);
    if (!dayEntry) continue;

    // Handle workout and rest (core) days
    const isWorkout = dayEntry.type === 'workout' && dayEntry.workout;
    const isRest = dayEntry.type === 'rest' && dayEntry.workout;

    if (!isWorkout && !isRest) continue;

    // Capture workout label for userDefaults
    workoutLabel = dayEntry.workout.dayOfWeek;

    if (action === 'add' && exercise) {
      if (!dayEntry.workout) dayEntry.workout = { exercises: [] };
      dayEntry.workout.exercises.push(exercise);
      modified = true;
    } else if (action === 'remove' && exercise?.exerciseId) {
      dayEntry.workout.exercises = dayEntry.workout.exercises.filter(
        ex => ex.exerciseId !== exercise.exerciseId
      );
      modified = true;
    } else if (action === 'update' && exercise?.exerciseId && updates) {
      const idx = dayEntry.workout.exercises.findIndex(
        ex => ex.exerciseId === exercise.exerciseId
      );
      if (idx >= 0) {
        dayEntry.workout.exercises[idx] = { ...dayEntry.workout.exercises[idx], ...updates };
        modified = true;
      }
    }
    if (modified) break;
  }

  if (modified) {
    writeSchedule(req.params.id, schedule);
    // Persist to userDefaults (only for workout days, not core/rest)
    if ((action === 'add' || action === 'remove' || action === 'update') && workoutLabel && workoutLabel !== 'Core') {
      persistToUserDefaults(req.params.id, dayOfWeek, action, exercise, updates, workoutLabel);
    }
  }

  res.json({ modified, schedule });
});

// ============ TEMPLATES ROUTES ============

app.get('/api/templates', (req, res) => {
  const templates = readJSON('templates.json');
  res.json(templates || [...DEFAULT_TEMPLATES]);
});

app.post('/api/templates', (req, res) => {
  const template = { ...req.body, id: req.body.id || `custom-${Date.now()}` };
  const templates = readJSON('templates.json') || [...DEFAULT_TEMPLATES];
  templates.push(template);
  writeJSON('templates.json', templates);
  res.json(template);
});

app.put('/api/templates/:id', (req, res) => {
  const templates = readJSON('templates.json') || [...DEFAULT_TEMPLATES];
  const idx = templates.findIndex(t => t.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Template not found' });
  templates[idx] = { ...templates[idx], ...req.body, id: req.params.id };
  writeJSON('templates.json', templates);
  res.json(templates[idx]);
});

app.delete('/api/templates/:id', (req, res) => {
  const templates = readJSON('templates.json') || [...DEFAULT_TEMPLATES];
  const template = templates.find(t => t.id === req.params.id);
  if (!template) return res.status(404).json({ error: 'Template not found' });
  if (template.isDefault) return res.status(400).json({ error: 'Cannot delete default template' });
  const filtered = templates.filter(t => t.id !== req.params.id);
  writeJSON('templates.json', filtered);
  res.json({ success: true });
});

app.get('/api/exercises', (req, res) => {
  const { grouped } = req.query;
  const data = getExercisePickerData();
  res.json(grouped === 'true' ? data : data.all);
});

// ============ USER DEFAULTS ROUTES ============

app.get('/api/user-defaults', (req, res) => {
  const defaults = readJSON('userDefaults.json');
  res.json(defaults || { userId: null, preferences: {} });
});

app.put('/api/user-defaults', (req, res) => {
  const defaults = { ...req.body, updatedAt: new Date().toISOString() };
  writeJSON('userDefaults.json', defaults);
  res.json(defaults);
});

app.patch('/api/user-defaults', (req, res) => {
  const updates = req.body;
  const existing = readJSON('userDefaults.json') || { userId: null, preferences: {} };

  for (const [pplType, prefs] of Object.entries(updates.preferences || {})) {
    if (!existing.preferences[pplType]) {
      existing.preferences[pplType] = {};
    }
    if (prefs.preferredExerciseIds) {
      existing.preferences[pplType].preferredExerciseIds = prefs.preferredExerciseIds;
    }
    if (prefs.exerciseOverrides) {
      existing.preferences[pplType].exerciseOverrides = {
        ...(existing.preferences[pplType].exerciseOverrides || {}),
        ...prefs.exerciseOverrides,
      };
    }
  }

  existing.updatedAt = new Date().toISOString();
  writeJSON('userDefaults.json', existing);
  res.json(existing);
});

// Helper: update userDefaults after a schedule day edit
function persistToUserDefaults(scheduleId, dayOfWeek, action, exercise, updates, workoutLabel) {
  if (!workoutLabel || workoutLabel === 'Core') return; // Skip core exercises (rest days)

  const pplType = workoutLabel.toLowerCase(); // "Push" -> "push"
  const defaults = readJSON('userDefaults.json') || { userId: null, preferences: {} };

  if (!defaults.preferences[pplType]) {
    defaults.preferences[pplType] = {};
  }

  if (action === 'add' && exercise) {
    if (!defaults.preferences[pplType].preferredExerciseIds) {
      defaults.preferences[pplType].preferredExerciseIds = [];
    }
    const ids = defaults.preferences[pplType].preferredExerciseIds;
    if (!ids.includes(exercise.exerciseId)) {
      ids.push(exercise.exerciseId);
    }
  } else if (action === 'remove' && exercise?.exerciseId) {
    const ids = defaults.preferences[pplType].preferredExerciseIds || [];
    defaults.preferences[pplType].preferredExerciseIds = ids.filter(id => id !== exercise.exerciseId);
  } else if (action === 'update' && updates) {
    if (!defaults.preferences[pplType].exerciseOverrides) {
      defaults.preferences[pplType].exerciseOverrides = {};
    }
    defaults.preferences[pplType].exerciseOverrides[exercise.exerciseId] = {
      ...(defaults.preferences[pplType].exerciseOverrides[exercise.exerciseId] || {}),
      ...updates,
    };
  }

  defaults.updatedAt = new Date().toISOString();
  writeJSON('userDefaults.json', defaults);
}

// ============ WEIGHT LOG ROUTES ============

app.get('/api/weight-log', (req, res) => {
  const log = readJSON('weightLog.json') || [];
  res.json(log);
});

app.post('/api/weight-log', (req, res) => {
  const entry = req.body;
  const log = readJSON('weightLog.json') || [];
  log.push(entry);
  writeJSON('weightLog.json', log);
  res.json(entry);
});

app.post('/api/weight-log/batch', (req, res) => {
  const entries = req.body.entries;
  const log = readJSON('weightLog.json') || [];
  log.push(...entries);
  writeJSON('weightLog.json', log);
  res.json({ count: entries.length });
});

app.delete('/api/weight-log', (req, res) => {
  writeJSON('weightLog.json', []);
  res.json({ success: true });
});

// ============ WORKOUT LOG ROUTES ============

app.get('/api/workout-log', (req, res) => {
  const log = readJSON('workoutLog.json') || [];
  res.json(log);
});

app.post('/api/workout-log', (req, res) => {
  const entry = req.body;
  const log = readJSON('workoutLog.json') || [];
  log.push(entry);
  writeJSON('workoutLog.json', log);
  res.json(entry);
});

// ============ EXPORT/IMPORT ============

app.get('/api/export', (req, res) => {
  const user = readJSON('user.json');
  const weightLog = readJSON('weightLog.json') || [];
  const workoutLog = readJSON('workoutLog.json') || [];
  const schedulesIndex = readJSON('schedules.json') || [];

  const schedules = schedulesIndex.map(s => ({
    ...s,
    ...readSchedule(s.id)
  }));

  const exportData = { user, weightLog, workoutLog, schedules, exportedAt: new Date().toISOString() };
  res.json(exportData);
});

app.post('/api/import', (req, res) => {
  const data = req.body;
  if (data.user) writeJSON('user.json', data.user);
  if (data.weightLog) writeJSON('weightLog.json', data.weightLog);
  if (data.workoutLog) writeJSON('workoutLog.json', data.workoutLog);
  if (data.schedules) {
    writeJSON('schedules.json', []);
    data.schedules.forEach(s => {
      const { id, startDate, endDate, isActive, schedule } = s;
      writeSchedule(id, schedule);
      const schedules = readJSON('schedules.json') || [];
      schedules.push({ id, startDate, endDate, isActive });
      writeJSON('schedules.json', schedules);
    });
  }
  res.json({ success: true });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Fitness API running on http://localhost:${PORT}`);
});
