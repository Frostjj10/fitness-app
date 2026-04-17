import {
  PUSH_EXERCISES,
  PULL_EXERCISES,
  LEG_EXERCISES,
  CARDIO_EXERCISES,
  CORE_EXERCISES,
} from './ppl';

// Difficulty caps by experience
const DIFFICULTY_CAPS = {
  beginner: { strength: 6, cardio: 5 },
  intermediate: { strength: 8, cardio: 7 },
  advanced: { strength: 10, cardio: 10 },
};

// Experience multipliers for weight estimation
const EXP_MULTIPLIERS = {
  beginner: 0.55,
  intermediate: 0.75,
  advanced: 0.90,
};

// Goal-based training parameters
const GOAL_PARAMS = {
  strength: {
    setsRange: [4, 5],
    repRange: [4, 6],
    restCompound: [150, 180],
    restIsolation: [90, 120],
    loadCoeff: 0.90,
  },
  hypertrophy: {
    setsRange: [3, 4],
    repRange: [8, 12],
    restCompound: [75, 90],
    restIsolation: [60, 75],
    loadCoeff: 0.75,
  },
  endurance: {
    setsRange: [2, 3],
    repRange: [12, 20],
    restCompound: [45, 60],
    restIsolation: [30, 45],
    loadCoeff: 0.55,
  },
  'weight-loss': {
    setsRange: [3, 4],
    repRange: [10, 15],
    restCompound: [60, 75],
    restIsolation: [45, 60],
    loadCoeff: 0.65,
  },
};

// Split configurations by days per week
const SPLIT_CONFIGS = {
  '2': {
    type: 'full-body',
    days: ['Full Body A', 'Full Body B'],
  },
  '3': {
    type: 'full-body',
    days: ['Full Body A', 'Full Body B', 'Full Body C'],
  },
  '4': {
    type: 'upper-lower',
    days: ['Upper A', 'Lower A', 'Upper B', 'Lower B'],
  },
  '5': {
    type: 'ppl',
    days: ['Push', 'Pull', 'Legs', 'Push', 'Pull'],
  },
  '6': {
    type: 'ppl',
    days: ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs'],
  },
};

// Muscle group map per split type
const SPLIT_MUSCLE_MAP = {
  'full-body': [
    { label: 'Full Body A', muscleGroups: ['chest', 'back', 'quads'], primary: 'chest' },
    { label: 'Full Body B', muscleGroups: ['back', 'shoulders', 'hamstrings'], primary: 'back' },
    { label: 'Full Body C', muscleGroups: ['chest', 'shoulders', 'legs'], primary: 'shoulders' },
  ],
  'upper-lower': [
    { label: 'Upper A', muscleGroups: ['chest', 'back', 'shoulders'], primary: 'chest' },
    { label: 'Lower A', muscleGroups: ['quads', 'hamstrings', 'glutes'], primary: 'quads' },
    { label: 'Upper B', muscleGroups: ['chest', 'back', 'shoulders', 'biceps'], primary: 'back' },
    { label: 'Lower B', muscleGroups: ['quads', 'hamstrings', 'calves'], primary: 'hamstrings' },
  ],
  'ppl': [
    { label: 'Push', muscleGroups: ['chest', 'shoulders', 'triceps'], primary: 'chest' },
    { label: 'Pull', muscleGroups: ['back', 'biceps', 'rear delts'], primary: 'back' },
    { label: 'Legs', muscleGroups: ['quads', 'hamstrings', 'glutes', 'calves'], primary: 'quads' },
  ],
};

// Priority for exercise ordering (lower = earlier)
const MUSCLE_PRIORITY = {
  chest: 1,
  back: 2,
  shoulders: 3,
  quadriceps: 4,
  hamstrings: 5,
  glutes: 6,
  calves: 7,
  biceps: 8,
  triceps: 9,
  forearms: 10,
};

// Map muscle group string to exercise category
function getCategoryForMuscleGroup(mg) {
  const push = ['chest', 'shoulders', 'triceps'];
  const pull = ['back', 'biceps', 'rear delts', 'forearms'];
  if (push.includes(mg)) return PUSH_EXERCISES;
  if (pull.includes(mg)) return PULL_EXERCISES;
  return LEG_EXERCISES;
}

// Estimate target weight based on user profile and exercise
export function estimateTargetWeight(user, exercise) {
  const bw = parseFloat(user.weight) || (user.unit === 'kg' ? 75 : 165);
  const params = GOAL_PARAMS[user.goal] || GOAL_PARAMS.hypertrophy;
  const expMult = EXP_MULTIPLIERS[user.experience] || 0.75;

  let weight = bw * (exercise.difficulty / 10) * params.loadCoeff * expMult;

  const increment = user.unit === 'kg' ? 2.5 : 5;
  weight = Math.round(weight / increment) * increment;
  return Math.max(weight, 0);
}

// Pick a random element from an array
function pickRandom(arr, count = 1) {
  if (count === 1) return arr[Math.floor(Math.random() * arr.length)];
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Build a single exercise entry
function buildExerciseEntry(exercise, params, user) {
  const isCompound = exercise.difficulty >= 6;
  const { setsRange, repRange, restCompound, restIsolation } = params;

  const [minSets, maxSets] = setsRange;
  const [minReps, maxReps] = repRange;
  const [minRest, maxRest] = isCompound ? restCompound : restIsolation;

  const sets = isCompound ? maxSets : Math.round((minSets + maxSets) / 2);
  const reps = isCompound ? minReps : Math.round((minReps + maxReps) / 2);
  const restSeconds = Math.round((minRest + maxRest) / 2);
  const targetWeight = estimateTargetWeight(user, exercise);

  return {
    exerciseId: exercise.id,
    name: exercise.name,
    muscleGroup: exercise.muscleGroup,
    primaryMuscle: exercise.primary,
    equipment: exercise.equipment,
    sets,
    reps,
    targetWeight,
    restSeconds,
    isCompound,
    unit: exercise.unit || 'reps',
  };
}

// Build exercise list for a given day configuration
function buildExercisesForDay(mgConfig, user, availableEquipment) {
  const { muscleGroups } = mgConfig;
  const caps = DIFFICULTY_CAPS[user.experience] || DIFFICULTY_CAPS.intermediate;
  const maxDiff = caps.strength;
  const params = GOAL_PARAMS[user.goal] || GOAL_PARAMS.hypertrophy;
  const equipSet = new Set(availableEquipment || ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight']);

  const exercises = [];

  for (const mg of muscleGroups) {
    const category = getCategoryForMuscleGroup(mg);

    // Pick 1 compound exercise
    const compounds = category.compound.filter(
      e => e.difficulty >= 6 && e.difficulty <= maxDiff && equipSet.has(e.equipment)
    );

    if (compounds.length > 0) {
      // Prefer exercise that matches the target muscle group
      const preferred = compounds.filter(e => e.primary === mg || e.muscleGroup === mg);
      const compound = preferred.length > 0
        ? pickRandom(preferred)
        : pickRandom(compounds);

      exercises.push(buildExerciseEntry(compound, params, user));
    }

    // Pick 1-2 isolation exercises for this muscle group
    const isolations = category.isolation.filter(
      e => e.difficulty <= maxDiff && equipSet.has(e.equipment)
    );
    const mgIsolations = isolations.filter(e => e.muscleGroup === mg);
    const selectedIsolations = mgIsolations.length > 0
      ? pickRandom(mgIsolations, Math.min(2, mgIsolations.length))
      : pickRandom(isolations, 1);

    for (const iso of selectedIsolations) {
      exercises.push(buildExerciseEntry(iso, params, user));
    }
  }

  // Sort: compounds first, then by muscle priority
  exercises.sort((a, b) => {
    if (a.isCompound !== b.isCompound) return a.isCompound ? -1 : 1;
    const priA = MUSCLE_PRIORITY[a.muscleGroup] || 10;
    const priB = MUSCLE_PRIORITY[b.muscleGroup] || 10;
    return priA - priB;
  });

  return exercises;
}

// Append core finisher exercises
function appendCoreFinisher(user, availableEquipment) {
  const caps = DIFFICULTY_CAPS[user.experience] || DIFFICULTY_CAPS.intermediate;
  const maxDiff = caps.cardio;
  const equipSet = new Set(availableEquipment || ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight']);

  const pool = CORE_EXERCISES.filter(
    e => e.difficulty <= maxDiff && equipSet.has(e.equipment)
  );

  const antiExtension = pool.filter(e =>
    ['plank', 'dead-bug', 'hollow-body-hold'].includes(e.id)
  );
  const rotation = pool.filter(e =>
    ['pallof-press', 'russian-twist', 'lawnmower'].includes(e.id)
  );

  const picks = [];
  if (antiExtension.length) picks.push(pickRandom(antiExtension));
  if (rotation.length) picks.push(pickRandom(rotation));
  if (picks.length < 2 && pool.length) {
    const remaining = pool.filter(e => !picks.includes(e));
    if (remaining.length) picks.push(pickRandom(remaining));
  }

  return picks.map(ex => ({
    exerciseId: ex.id,
    name: ex.name,
    muscleGroup: ex.muscleGroup,
    primaryMuscle: ex.primary,
    equipment: ex.equipment,
    sets: 3,
    reps: ex.unit === 'sec' ? 30 : 15,
    targetWeight: 0,
    restSeconds: 45,
    isCompound: false,
    unit: ex.unit || 'reps',
  }));
}

// Append cardio finisher for weight-loss / endurance goals
function appendCardioFinisher(user, availableEquipment) {
  if (!['weight-loss', 'endurance'].includes(user.goal)) return [];

  const caps = DIFFICULTY_CAPS[user.experience] || DIFFICULTY_CAPS.intermediate;
  const maxDiff = caps.cardio;
  const equipSet = new Set(availableEquipment || ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight']);

  const machines = CARDIO_EXERCISES.machines.filter(
    e => e.difficulty <= maxDiff && equipSet.has(e.equipment)
  );

  if (!machines.length) return [];

  const ex = pickRandom(machines);
  const minutes = user.goal === 'weight-loss' ? 25 : 20;

  return [{
    exerciseId: ex.id,
    name: ex.name,
    muscleGroup: 'cardio',
    primaryMuscle: 'cardio',
    equipment: ex.equipment,
    sets: 1,
    reps: minutes,
    targetWeight: 0,
    restSeconds: 0,
    isCompound: false,
    unit: 'min',
  }];
}

// Main entry point: generate a complete personalized template
export function generateTemplate({
  user,
  daysPerWeek,
  availableEquipment = ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight'],
  splitType = 'auto',
}) {
  const days = daysPerWeek || 4;
  const splitKey = String(days);
  const splitConfig = SPLIT_CONFIGS[splitKey] || SPLIT_CONFIGS['4'];

  // Override split type if explicitly specified
  const actualType = splitType !== 'auto' ? splitType : splitConfig.type;
  const muscleMap = SPLIT_MUSCLE_MAP[actualType] || SPLIT_MUSCLE_MAP['upper-lower'];

  const dayLabels = splitConfig.days.slice(0, days);

  const template = {
    id: `generated-${Date.now()}`,
    name: `${actualType.replace('-', ' ')} · ${user.goal}`,
    is_default: false,
    isDefault: false,
    dayTypes: dayLabels.map((label, i) => {
      const mgConfig = muscleMap[i % muscleMap.length];
      const exercises = buildExercisesForDay(mgConfig, user, availableEquipment);
      const coreFinisher = appendCoreFinisher(user, availableEquipment);
      const cardioFinisher = appendCardioFinisher(user, availableEquipment);

      return {
        label,
        muscleGroups: mgConfig.muscleGroups.join(', '),
        exercises: [...exercises, ...coreFinisher, ...cardioFinisher],
      };
    }),
  };

  return template;
}
