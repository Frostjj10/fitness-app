// Progressive Overload Recommendation Engine
// Analyzes weight log history to suggest next session's weight

/**
 * Get progression increments based on exercise type and unit
 * Lower body can handle bigger jumps due to more muscle mass
 */
function getIncrement(isLower, unit) {
  if (unit === 'kg') {
    return isLower ? 5 : 2.5;
  }
  return isLower ? 10 : 5;
}

/**
 * Determine if an exercise is primarily lower body
 */
function isLowerBody(exerciseId, muscleGroup) {
  const lowerKeywords = ['quad', 'hamstring', 'glute', 'calf', 'leg', 'hip', 'squat', 'deadlift', 'lunge', 'press'];
  const id = (exerciseId || '').toLowerCase();
  const mg = (muscleGroup || '').toLowerCase();
  return lowerKeywords.some(k => id.includes(k) || mg.includes(k));
}

/**
 * Get the most recent session's data for an exercise
 * Returns the session's average weight, reps, and RPE across all sets
 */
function getLastSession(logs) {
  if (!logs || logs.length === 0) return null;

  // Group by date (sessions)
  const byDate = {};
  for (const log of logs) {
    if (!byDate[log.date]) byDate[log.date] = [];
    byDate[log.date].push(log);
  }

  const dates = Object.keys(byDate).sort().reverse(); // most recent first
  const lastDate = dates[0];
  if (!lastDate) return null;

  const sessionLogs = byDate[lastDate];
  const avgWeight = sessionLogs.reduce((sum, l) => sum + l.weight, 0) / sessionLogs.length;
  const avgReps = sessionLogs.reduce((sum, l) => sum + l.reps, 0) / sessionLogs.length;
  const avgRpe = sessionLogs.reduce((sum, l) => sum + (l.rpe || 7), 0) / sessionLogs.length;

  return {
    date: lastDate,
    weight: Math.round(avgWeight),
    reps: Math.round(avgReps),
    rpe: Math.round(avgRpe),
    sets: sessionLogs.length,
  };
}

/**
 * Get the previous session's data (before the most recent)
 */
function getPreviousSession(logs) {
  if (!logs || logs.length === 0) return null;

  const byDate = {};
  for (const log of logs) {
    if (!byDate[log.date]) byDate[log.date] = [];
    byDate[log.date].push(log);
  }

  const dates = Object.keys(byDate).sort().reverse();
  if (dates.length < 2) return null;

  const prevDate = dates[1];
  const sessionLogs = byDate[prevDate];
  const avgWeight = sessionLogs.reduce((sum, l) => sum + l.weight, 0) / sessionLogs.length;
  const avgReps = sessionLogs.reduce((sum, l) => sum + l.reps, 0) / sessionLogs.length;
  const avgRpe = sessionLogs.reduce((sum, l) => sum + (l.rpe || 7), 0) / sessionLogs.length;

  return {
    date: prevDate,
    weight: Math.round(avgWeight),
    reps: Math.round(avgReps),
    rpe: Math.round(avgRpe),
    sets: sessionLogs.length,
  };
}

/**
 * Main recommendation function
 * Analyzes exercise history and returns a suggested weight with reasoning
 *
 * @param {string} exerciseId - The exercise ID
 * @param {string} muscleGroup - The muscle group
 * @param {string} unit - 'lbs' or 'kg'
 * @param {number} targetReps - Target reps for this session (from template)
 * @param {Array} weightLogs - Array of weight_log entries from Supabase
 * @returns {{ suggestedWeight: number|null, reason: string, lastWeight: number|null, increment: number }}
 */
export function getProgressiveOverloadRecommendation(exerciseId, muscleGroup, unit = 'lbs', targetReps = 10, weightLogs = []) {
  if (!weightLogs || weightLogs.length === 0) {
    return { suggestedWeight: null, reason: 'No history yet — start with a weight that feels challenging', lastWeight: null, increment: 0 };
  }

  const logs = weightLogs.filter(l => l.exercise_id === exerciseId);
  if (logs.length === 0) {
    return { suggestedWeight: null, reason: 'No history for this exercise yet', lastWeight: null, increment: 0 };
  }

  const last = getLastSession(logs);
  const prev = getPreviousSession(logs);

  if (!last) {
    return { suggestedWeight: null, reason: 'Not enough data', lastWeight: null, increment: 0 };
  }

  const lower = isLowerBody(exerciseId, muscleGroup);
  const increment = getIncrement(lower, unit);

  // Case 1: Previous session hit RPE 9-10 (near failure) — hold or slight increase
  if (last.rpe >= 9) {
    return {
      suggestedWeight: last.weight, // hold steady
      reason: `You hit RPE ${last.rpe} last session — hold weight and build confidence`,
      lastWeight: last.weight,
      increment: 0,
    };
  }

  // Case 2: Completed at RPE ≤ 8 and matched or beat previous reps at same weight — add weight
  if (last.rpe <= 8 && prev) {
    const prevLogsForExercise = logs.filter(l => l.date === prev.date);
    const prevAvgReps = prevLogsForExercise.reduce((s, l) => s + l.reps, 0) / prevLogsForExercise.length;

    // More reps at same weight = progressing
    if (last.reps > prevAvgReps) {
      const newWeight = last.weight + increment;
      return {
        suggestedWeight: newWeight,
        reason: `+${last.reps - Math.round(prevAvgReps)} reps at same weight — add ${increment}${unit}`,
        lastWeight: last.weight,
        increment,
      };
    }
  }

  // Case 3: RPE 6-8, same or fewer reps than before — add weight
  if (last.rpe >= 6 && last.rpe <= 8) {
    const newWeight = last.weight + increment;
    return {
      suggestedWeight: newWeight,
      reason: `RPE ${last.rpe} — you have capacity to add ${increment}${unit}`,
      lastWeight: last.weight,
      increment,
    };
  }

  // Case 4: Very low RPE (1-5) — significantly under-challenged, add more weight
  if (last.rpe <= 5) {
    const newWeight = last.weight + increment * 2;
    return {
      suggestedWeight: newWeight,
      reason: `RPE ${last.rpe} suggests you're under-challenged — try ${increment * 2}${unit} more`,
      lastWeight: last.weight,
      increment: increment * 2,
    };
  }

  // Case 5: Default — RPE 7-8 with no previous session to compare, add weight
  const newWeight = last.weight + increment;
  return {
    suggestedWeight: newWeight,
    reason: `RPE ${last.rpe} — add ${increment}${unit} for next session`,
    lastWeight: last.weight,
    increment,
  };
}
