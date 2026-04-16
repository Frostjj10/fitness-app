// Mesocycle scheduler - generates 4-week workout blocks using templates
// Browser-side version (client-side)

import { buildWorkoutFromTemplateDay, DEFAULT_TEMPLATES, CORE_EXERCISES } from './ppl.js';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function getDateForDay(weekStartDate, dayOfWeek) {
  // Parse YYYY-MM-DD as local date
  const [y, m, d] = weekStartDate.split('-').map(Number);
  const start = new Date(y, m - 1, d);
  const dayIndex = DAYS_OF_WEEK.indexOf(dayOfWeek);
  // Convert JS getDay() (0=Sun) to Monday-first index (0=Mon)
  const firstDayIndex = (start.getDay() + 6) % 7;
  // Always return the NEXT occurrence of dayOfWeek, never a past date
  let daysUntil = dayIndex - firstDayIndex;
  if (daysUntil < 0) daysUntil += 7;
  const targetDate = new Date(y, m - 1, d + daysUntil);
  return targetDate.toLocaleDateString('en-CA');
}

export function buildMesocycle(user, workoutDays, startDate, templateId = 'ppl', userDefaults = null, templates = null) {
  const allTemplates = templates || [...DEFAULT_TEMPLATES];
  const template = allTemplates.find(t => t.id === templateId) || allTemplates[0];
  const dayTypes = template.dayTypes;

  // Parse startDate as local date
  const [y, m, d] = startDate.split('-').map(Number);
  const start = new Date(y, m - 1, d);

  const weeks = [];
  for (let w = 0; w < 4; w++) {
    const weekStart = new Date(y, m - 1, d + w * 7);
    weeks.push({ weekNum: w + 1, startDate: weekStart.toLocaleDateString('en-CA') });
  }

  const schedule = weeks.map(week => {
    const weekStartStr = week.startDate;
    const days = DAYS_OF_WEEK.map(dayOfWeek => {
      const date = getDateForDay(weekStartStr, dayOfWeek);

      // Rest day
      if (!workoutDays.includes(dayOfWeek)) {
        const coreWorkout = buildCoreFinisher(user, userDefaults);
        return { dayOfWeek, date, type: 'rest', workout: coreWorkout };
      }

      // Workout day — map to template day type (rotating)
      const workoutIndex = workoutDays.indexOf(dayOfWeek);
      const templateDay = dayTypes[workoutIndex % dayTypes.length];
      const workout = buildWorkoutFromTemplateDay(templateDay, user, week.weekNum, true); // true = add cardio finisher

      workout.dayOfWeek = dayOfWeek;
      workout.date = date;
      return { dayOfWeek, date, type: 'workout', workout };
    });

    return { weekNum: week.weekNum, startDate: weekStartStr, days };
  });

  const endDate = new Date(y, m - 1, d + 27);

  return {
    id: `block-${Date.now()}`,
    userId: user.id,
    startDate: start.toLocaleDateString('en-CA'),
    endDate: endDate.toLocaleDateString('en-CA'),
    goal: user.goal,
    workoutDays,
    templateId: template.id,
    schedule,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
}

export function migrateScheduleToNewFormat(schedule) {
  if (schedule.schedule[0]?.days) return schedule;

  const workoutDays = schedule.workoutDays || [];
  const workoutDaySet = new Set(workoutDays);

  const newSchedule = schedule.schedule.map(week => {
    const days = DAYS_OF_WEEK.map(dayOfWeek => {
      const date = getDateForDay(week.startDate, dayOfWeek);
      if (!workoutDaySet.has(dayOfWeek)) {
        return { dayOfWeek, date, type: 'rest', workout: null };
      }
      const oldWorkout = week.workouts?.find(w => w.dayOfWeek === dayOfWeek);
      if (!oldWorkout) return { dayOfWeek, date, type: 'rest', workout: null };
      return { dayOfWeek, date, type: 'workout', workout: oldWorkout };
    });
    return { weekNum: week.weekNum, startDate: week.startDate, days };
  });

  return { ...schedule, schedule: newSchedule };
}

// ─── Core Finisher (added to rest days) ────────────────────────────────────

export function buildCoreFinisher(user, userDefaults = null) {
  const maxDiff = { beginner: 4, intermediate: 6, advanced: 8 }[user.experience] || 5;
  const filtered = CORE_EXERCISES.filter(e => e.difficulty <= maxDiff);

  const pick = (list, count) => [...list].sort(() => Math.random() - 0.5).slice(0, count);

  const selected = pick(filtered, 2);

  const exercises = selected.map(ex => ({
    exerciseId: ex.id,
    name: ex.name,
    muscleGroup: ex.muscleGroup,
    primaryMuscle: ex.primary,
    equipment: ex.equipment,
    sets: 3,
    reps: 15,
    targetWeight: 0,
    restSeconds: 45,
    isCompound: false,
    unit: ex.unit || 'reps',
  }));

  return {
    dayOfWeek: 'Core',
    muscleGroups: 'core, abs',
    exercises,
  };
}
