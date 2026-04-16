// Shared types for fitness app

export const GOALS = ['strength', 'hypertrophy', 'endurance', 'weight-loss'];
export const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced'];
export const MUSCLE_GROUPS = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'forearms', 'core', 'quads', 'hamstrings', 'glutes', 'calves'
];
export const UNITS = ['kg', 'lbs'];

export const RPE_SCALE = [
  { value: 1, label: 'Very Easy' },
  { value: 2, label: 'Easy' },
  { value: 3, label: 'Light' },
  { value: 4, label: 'Moderate' },
  { value: 5, label: 'Medium' },
  { value: 6, label: 'Somewhat Hard' },
  { value: 7, label: 'Hard' },
  { value: 8, label: 'Very Hard' },
  { value: 9, label: 'Extremely Hard' },
  { value: 10, label: 'Maximum Effort' },
];

export const EXERCISES = [
  // Chest
  { id: 'bench-press', name: 'Bench Press', muscleGroup: 'chest', equipment: 'barbell' },
  { id: 'incline-bench', name: 'Incline Bench Press', muscleGroup: 'chest', equipment: 'barbell' },
  { id: 'dumbbell-fly', name: 'Dumbbell Fly', muscleGroup: 'chest', equipment: 'dumbbell' },
  { id: 'cable-crossover', name: 'Cable Crossover', muscleGroup: 'chest', equipment: 'cable' },
  { id: 'push-up', name: 'Push Up', muscleGroup: 'chest', equipment: 'bodyweight' },
  // Back
  { id: 'deadlift', name: 'Deadlift', muscleGroup: 'back', equipment: 'barbell' },
  { id: 'barbell-row', name: 'Barbell Row', muscleGroup: 'back', equipment: 'barbell' },
  { id: 'lat-pulldown', name: 'Lat Pulldown', muscleGroup: 'back', equipment: 'cable' },
  { id: 'pull-up', name: 'Pull Up', muscleGroup: 'back', equipment: 'bodyweight' },
  { id: 'seated-row', name: 'Seated Cable Row', muscleGroup: 'back', equipment: 'cable' },
  // Shoulders
  { id: 'overhead-press', name: 'Overhead Press', muscleGroup: 'shoulders', equipment: 'barbell' },
  { id: 'lateral-raise', name: 'Lateral Raise', muscleGroup: 'shoulders', equipment: 'dumbbell' },
  { id: 'face-pull', name: 'Face Pull', muscleGroup: 'shoulders', equipment: 'cable' },
  { id: 'rear-delt-fly', name: 'Rear Delt Fly', muscleGroup: 'shoulders', equipment: 'dumbbell' },
  // Biceps
  { id: 'barbell-curl', name: 'Barbell Curl', muscleGroup: 'biceps', equipment: 'barbell' },
  { id: 'dumbbell-curl', name: 'Dumbbell Curl', muscleGroup: 'biceps', equipment: 'dumbbell' },
  { id: 'hammer-curl', name: 'Hammer Curl', muscleGroup: 'biceps', equipment: 'dumbbell' },
  { id: 'cable-curl', name: 'Cable Curl', muscleGroup: 'biceps', equipment: 'cable' },
  // Triceps
  { id: 'tricep-pushdown', name: 'Tricep Pushdown', muscleGroup: 'triceps', equipment: 'cable' },
  { id: 'skull-crusher', name: 'Skull Crusher', muscleGroup: 'triceps', equipment: 'barbell' },
  { id: 'overhead-extension', name: 'Overhead Tricep Extension', muscleGroup: 'triceps', equipment: 'dumbbell' },
  { id: 'dip', name: 'Dip', muscleGroup: 'triceps', equipment: 'bodyweight' },
  // Core
  { id: 'plank', name: 'Plank', muscleGroup: 'core', equipment: 'bodyweight' },
  { id: 'cable-crunch', name: 'Cable Crunch', muscleGroup: 'core', equipment: 'cable' },
  { id: 'hanging-leg-raise', name: 'Hanging Leg Raise', muscleGroup: 'core', equipment: 'bodyweight' },
  { id: 'russian-twist', name: 'Russian Twist', muscleGroup: 'core', equipment: 'bodyweight' },
  // Quads
  { id: 'squat', name: 'Squat', muscleGroup: 'quads', equipment: 'barbell' },
  { id: 'leg-press', name: 'Leg Press', muscleGroup: 'quads', equipment: 'machine' },
  { id: 'leg-extension', name: 'Leg Extension', muscleGroup: 'quads', equipment: 'machine' },
  { id: 'lunge', name: 'Lunge', muscleGroup: 'quads', equipment: 'dumbbell' },
  // Hamstrings
  { id: 'romanian-deadlift', name: 'Romanian Deadlift', muscleGroup: 'hamstrings', equipment: 'barbell' },
  { id: 'leg-curl', name: 'Leg Curl', muscleGroup: 'hamstrings', equipment: 'machine' },
  { id: 'stiff-leg-deadlift', name: 'Stiff Leg Deadlift', muscleGroup: 'hamstrings', equipment: 'barbell' },
  // Glutes
  { id: 'hip-thrust', name: 'Hip Thrust', muscleGroup: 'glutes', equipment: 'barbell' },
  { id: 'glute-bridge', name: 'Glute Bridge', muscleGroup: 'glutes', equipment: 'bodyweight' },
  { id: 'cable-kickback', name: 'Cable Kickback', muscleGroup: 'glutes', equipment: 'cable' },
  // Calves
  { id: 'calf-raise', name: 'Calf Raise', muscleGroup: 'calves', equipment: 'machine' },
  { id: 'seated-calf-raise', name: 'Seated Calf Raise', muscleGroup: 'calves', equipment: 'machine' },
];

export function calculate1RM(weight, reps, formula = 'epley') {
  if (reps === 1) return weight;
  if (reps <= 0 || weight <= 0) return 0;

  if (formula === 'brzycki') {
    return weight * (36 / (37 - reps));
  }
  // Default: Epley formula
  return weight * (1 + reps / 30);
}

export function estimateWeightFrom1RM(target1RM, reps, formula = 'epley') {
  if (reps === 1) return target1RM;
  if (formula === 'brzycki') {
    return target1RM / (36 / (37 - reps));
  }
  return target1RM / (1 + reps / 30);
}
