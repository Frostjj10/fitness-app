// Adaptive engine: adjusts future blocks based on logged workout data
// Rules:
//   - If 3+ consecutive workouts at RPE < 6 → increase weight 5%
//   - If 2+ consecutive workouts at RPE > 9 → decrease weight 5%
//   - Tracks muscle group fatigue to prevent overtraining

import { EXERCISES } from '../shared/types.js';

export function analyzeWorkoutHistory(workoutLog, weightLog) {
  if (!workoutLog || workoutLog.length === 0) return null;

  const recentWorkouts = workoutLog.slice(-10); // last 10 workouts
  const recentWeights = weightLog || [];

  // Group by exercise
  const exerciseHistory = {};
  for (const entry of recentWeights) {
    if (!exerciseHistory[entry.exerciseId]) {
      exerciseHistory[entry.exerciseId] = [];
    }
    exerciseHistory[entry.exerciseId].push(entry);
  }

  // Find RPE patterns per exercise
  const adjustments = {};
  for (const [exerciseId, entries] of Object.entries(exerciseHistory)) {
    if (entries.length < 3) continue;

    const rpes = entries.map(e => e.rpe).slice(-5);
    const avgRpe = rpes.reduce((a, b) => a + b, 0) / rpes.length;

    // Check consecutive low RPE
    const last3RPE = entries.slice(-3).map(e => e.rpe);
    const last2RPE = entries.slice(-2).map(e => e.rpe);

    let adjustment = 0;
    if (last3RPE.every(r => r <= 6)) {
      adjustment = 0.05; // increase 5%
    } else if (last2RPE.every(r => r >= 9)) {
      adjustment = -0.05; // decrease 5%
    }

    if (adjustment !== 0) {
      const lastWeight = entries[entries.length - 1].weight;
      adjustments[exerciseId] = {
        adjustment,
        newWeight: Math.round(lastWeight * (1 + adjustment) / 2.5) * 2.5,
        avgRpe,
      };
    }
  }

  // Muscle group fatigue tracking
  const muscleFatigue = {};
  for (const entry of recentWeights.slice(-20)) {
    const exercise = EXERCISES.find(e => e.id === entry.exerciseId);
    if (!exercise) continue;
    const mg = exercise.muscleGroup;
    if (!muscleFatigue[mg]) muscleFatigue[mg] = { count: 0, totalRpe: 0 };
    muscleFatigue[mg].count++;
    muscleFatigue[mg].totalRpe += entry.rpe;
  }

  for (const [mg, data] of Object.entries(muscleFatigue)) {
    data.avgRpe = data.totalRpe / data.count;
  }

  return { adjustments, muscleFatigue, recentCount: recentWorkouts.length };
}

export function adjustScheduleForBlock(previousSchedule, adjustments, muscleFatigue) {
  if (!previousSchedule) return null;

  const newSchedule = JSON.parse(JSON.stringify(previousSchedule));

  for (const week of newSchedule.schedule) {
    for (const day of week.workouts) {
      for (const ex of day.exercises) {
        if (adjustments[ex.exerciseId]) {
          ex.targetWeight = adjustments[ex.exerciseId].newWeight;
        }
      }
    }
  }

  // Mark as new block
  newSchedule.id = `block-${Date.now()}`;
  newSchedule.isActive = true;
  newSchedule.createdAt = new Date().toISOString();

  return newSchedule;
}

export function checkOvertraining(muscleFatigue, threshold = 8) {
  const warnings = [];
  for (const [mg, data] of Object.entries(muscleFatigue)) {
    if (data.avgRpe > threshold) {
      warnings.push(`${mg}: avg RPE ${data.avgRpe.toFixed(1)}`);
    }
  }
  return warnings;
}
