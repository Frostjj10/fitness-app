// Push / Pull / Legs training splits - research-based exercise selection
// Each muscle group gets compound + isolation work. Exercises chosen for safety & effectiveness.
// Equipment variety: barbell, dumbbell, cable, machine, bodyweight to maximize bang-for-buck.

export const PUSH_EXERCISES = {
  compound: [
    { id: 'bench-press', name: 'Bench Press', muscleGroup: 'chest', primary: 'chest', equipment: 'barbell', difficulty: 7 },
    { id: 'overhead-press', name: 'Overhead Press', muscleGroup: 'shoulders', primary: 'shoulders', equipment: 'barbell', difficulty: 7 },
    { id: 'incline-bench', name: 'Incline Bench Press', muscleGroup: 'chest', primary: 'chest', equipment: 'barbell', difficulty: 6 },
  ],
  isolation: [
    { id: 'lateral-raise', name: 'Lateral Raise', muscleGroup: 'shoulders', primary: 'shoulders', equipment: 'dumbbell', difficulty: 4 },
    { id: 'cable-crossover', name: 'Cable Crossover', muscleGroup: 'chest', primary: 'chest', equipment: 'cable', difficulty: 4 },
    { id: 'tricep-pushdown', name: 'Tricep Pushdown', muscleGroup: 'triceps', primary: 'triceps', equipment: 'cable', difficulty: 3 },
    { id: 'overhead-extension', name: 'Overhead Tricep Extension', muscleGroup: 'triceps', primary: 'triceps', equipment: 'dumbbell', difficulty: 4 },
    { id: 'front-raise', name: 'Front Raise', muscleGroup: 'shoulders', primary: 'shoulders', equipment: 'dumbbell', difficulty: 3 },
    { id: 'dip', name: 'Dip', muscleGroup: 'chest', primary: 'chest', equipment: 'bodyweight', difficulty: 6 },
    { id: 'push-up', name: 'Push Up', muscleGroup: 'chest', primary: 'chest', equipment: 'bodyweight', difficulty: 3 },
  ],
};

export const PULL_EXERCISES = {
  compound: [
    { id: 'deadlift', name: 'Deadlift', muscleGroup: 'back', primary: 'back', equipment: 'barbell', difficulty: 8 },
    { id: 'barbell-row', name: 'Barbell Row', muscleGroup: 'back', primary: 'back', equipment: 'barbell', difficulty: 7 },
    { id: 'pull-up', name: 'Pull Up', muscleGroup: 'back', primary: 'back', equipment: 'bodyweight', difficulty: 7 },
  ],
  isolation: [
    { id: 'lat-pulldown', name: 'Lat Pulldown', muscleGroup: 'back', primary: 'back', equipment: 'cable', difficulty: 4 },
    { id: 'seated-row', name: 'Seated Cable Row', muscleGroup: 'back', primary: 'back', equipment: 'cable', difficulty: 4 },
    { id: 'face-pull', name: 'Face Pull', muscleGroup: 'shoulders', primary: 'shoulders', equipment: 'cable', difficulty: 3 },
    { id: 'barbell-curl', name: 'Barbell Curl', muscleGroup: 'biceps', primary: 'biceps', equipment: 'barbell', difficulty: 4 },
    { id: 'dumbbell-curl', name: 'Dumbbell Curl', muscleGroup: 'biceps', primary: 'biceps', equipment: 'dumbbell', difficulty: 3 },
    { id: 'hammer-curl', name: 'Hammer Curl', muscleGroup: 'biceps', primary: 'biceps', equipment: 'dumbbell', difficulty: 3 },
    { id: 'rear-delt-fly', name: 'Rear Delt Fly', muscleGroup: 'shoulders', primary: 'shoulders', equipment: 'dumbbell', difficulty: 3 },
    { id: 'cable-curl', name: 'Cable Curl', muscleGroup: 'biceps', primary: 'biceps', equipment: 'cable', difficulty: 3 },
  ],
};

export const LEG_EXERCISES = {
  compound: [
    { id: 'squat', name: 'Barbell Back Squat', muscleGroup: 'quads', primary: 'quads', equipment: 'barbell', difficulty: 8 },
    { id: 'romanian-deadlift', name: 'Romanian Deadlift', muscleGroup: 'hamstrings', primary: 'hamstrings', equipment: 'barbell', difficulty: 7 },
    { id: 'hip-thrust', name: 'Hip Thrust', muscleGroup: 'glutes', primary: 'glutes', equipment: 'barbell', difficulty: 6 },
  ],
  isolation: [
    { id: 'leg-press', name: 'Leg Press', muscleGroup: 'quads', primary: 'quads', equipment: 'machine', difficulty: 5 },
    { id: 'leg-extension', name: 'Leg Extension', muscleGroup: 'quads', primary: 'quads', equipment: 'machine', difficulty: 3 },
    { id: 'leg-curl', name: 'Leg Curl', muscleGroup: 'hamstrings', primary: 'hamstrings', equipment: 'machine', difficulty: 3 },
    { id: 'calf-raise', name: 'Standing Calf Raise', muscleGroup: 'calves', primary: 'calves', equipment: 'machine', difficulty: 2 },
    { id: 'seated-calf-raise', name: 'Seated Calf Raise', muscleGroup: 'calves', primary: 'calves', equipment: 'machine', difficulty: 2 },
    { id: 'cable-kickback', name: 'Cable Kickback', muscleGroup: 'glutes', primary: 'glutes', equipment: 'cable', difficulty: 2 },
    { id: 'lunge', name: 'Walking Lunge', muscleGroup: 'quads', primary: 'quads', equipment: 'dumbbell', difficulty: 5 },
    { id: 'stiff-leg-deadlift', name: 'Stiff Leg Deadlift', muscleGroup: 'hamstrings', primary: 'hamstrings', equipment: 'barbell', difficulty: 6 },
    { id: 'glute-bridge', name: 'Glute Bridge', muscleGroup: 'glutes', primary: 'glutes', equipment: 'bodyweight', difficulty: 2 },
  ],
};

// Cardio / conditioning exercises (duration-based, no weight needed)
export const CARDIO_EXERCISES = {
  machines: [
    { id: 'treadmill', name: 'Treadmill Running', muscleGroup: 'cardio', primary: 'cardio', equipment: 'machine', difficulty: 5, unit: 'min' },
    { id: 'rowing', name: 'Rowing Machine', muscleGroup: 'cardio', primary: 'cardio', equipment: 'machine', difficulty: 6, unit: 'min' },
    { id: 'cycling', name: 'Stationary Cycling', muscleGroup: 'cardio', primary: 'cardio', equipment: 'machine', difficulty: 4, unit: 'min' },
    { id: 'elliptical', name: 'Elliptical', muscleGroup: 'cardio', primary: 'cardio', equipment: 'machine', difficulty: 4, unit: 'min' },
    { id: 'stair-climber', name: 'Stair Climber', muscleGroup: 'cardio', primary: 'cardio', equipment: 'machine', difficulty: 6, unit: 'min' },
    { id: 'ski-erg', name: 'Ski Erg', muscleGroup: 'cardio', primary: 'cardio', equipment: 'machine', difficulty: 6, unit: 'min' },
  ],
  hiit: [
    { id: 'jump-rope', name: 'Jump Rope', muscleGroup: 'cardio', primary: 'cardio', equipment: 'bodyweight', difficulty: 5, unit: 'min' },
    { id: 'burpees', name: 'Burpees', muscleGroup: 'cardio', primary: 'cardio', equipment: 'bodyweight', difficulty: 7, unit: 'min' },
    { id: 'mountain-climbers', name: 'Mountain Climbers', muscleGroup: 'cardio', primary: 'cardio', equipment: 'bodyweight', difficulty: 5, unit: 'min' },
    { id: 'battle-ropes', name: 'Battle Ropes', muscleGroup: 'cardio', primary: 'cardio', equipment: 'bodyweight', difficulty: 6, unit: 'min' },
    { id: 'box-jumps', name: 'Box Jumps', muscleGroup: 'cardio', primary: 'cardio', equipment: 'bodyweight', difficulty: 6, unit: 'min' },
    { id: 'jump-squats', name: 'Jump Squats', muscleGroup: 'cardio', primary: 'cardio', equipment: 'bodyweight', difficulty: 6, unit: 'min' },
    { id: 'sled-push', name: 'Sled Push', muscleGroup: 'cardio', primary: 'cardio', equipment: 'bodyweight', difficulty: 7, unit: 'min' },
    { id: 'assault-bike', name: 'Assault Bike', muscleGroup: 'cardio', primary: 'cardio', equipment: 'machine', difficulty: 8, unit: 'min' },
    { id: 'swimming', name: 'Swimming', muscleGroup: 'cardio', primary: 'cardio', equipment: 'other', difficulty: 7, unit: 'min' },
    { id: 'jump-lunges', name: 'Jump Lunges', muscleGroup: 'cardio', primary: 'cardio', equipment: 'bodyweight', difficulty: 6, unit: 'min' },
  ],
};

// Core / abdominal exercises
export const CORE_EXERCISES = [
  { id: 'plank', name: 'Plank Hold', muscleGroup: 'core', primary: 'core', equipment: 'bodyweight', difficulty: 3, unit: 'sec' },
  { id: 'side-plank', name: 'Side Plank', muscleGroup: 'core', primary: 'core', equipment: 'bodyweight', difficulty: 4, unit: 'sec' },
  { id: 'hanging-leg-raise', name: 'Hanging Leg Raise', muscleGroup: 'core', primary: 'core', equipment: 'bodyweight', difficulty: 5, unit: 'reps' },
  { id: 'ab-wheel', name: 'Ab Wheel Rollout', muscleGroup: 'core', primary: 'core', equipment: 'bodyweight', difficulty: 6, unit: 'reps' },
  { id: 'cable-crunch', name: 'Cable Crunch', muscleGroup: 'core', primary: 'core', equipment: 'cable', difficulty: 4, unit: 'reps' },
  { id: 'pallof-press', name: 'Pallof Press', muscleGroup: 'core', primary: 'core', equipment: 'cable', difficulty: 3, unit: 'reps' },
  { id: 'russian-twist', name: 'Russian Twist', muscleGroup: 'core', primary: 'core', equipment: 'bodyweight', difficulty: 3, unit: 'reps' },
  { id: 'dead-bug', name: 'Dead Bug', muscleGroup: 'core', primary: 'core', equipment: 'bodyweight', difficulty: 2, unit: 'reps' },
  { id: 'bird-dog', name: 'Bird Dog', muscleGroup: 'core', primary: 'core', equipment: 'bodyweight', difficulty: 2, unit: 'reps' },
  { id: 'bicycle-crunch', name: 'Bicycle Crunch', muscleGroup: 'core', primary: 'core', equipment: 'bodyweight', difficulty: 4, unit: 'reps' },
  { id: 'weighted-crunch', name: 'Weighted Crunch', muscleGroup: 'core', primary: 'core', equipment: 'dumbbell', difficulty: 4, unit: 'reps' },
  { id: 'toes-to-bar', name: 'Toes to Bar', muscleGroup: 'core', primary: 'core', equipment: 'bodyweight', difficulty: 7, unit: 'reps' },
];

// Maps "Push"/"Pull"/"Legs" to "push"/"pull"/"legs"
export function getPplType(label) {
  const map = { Push: 'push', Pull: 'pull', Legs: 'legs' };
  return map[label] || label.toLowerCase();
}

// Returns exercise library grouped by PPL type + flat all list
export function getExercisePickerData() {
  const cardioAll = [...CARDIO_EXERCISES.machines, ...CARDIO_EXERCISES.hiit];
  const all = [
    ...PUSH_EXERCISES.compound,
    ...PUSH_EXERCISES.isolation,
    ...PULL_EXERCISES.compound,
    ...PULL_EXERCISES.isolation,
    ...LEG_EXERCISES.compound,
    ...LEG_EXERCISES.isolation,
    ...cardioAll,
    ...CORE_EXERCISES,
  ];
  return {
    push: PUSH_EXERCISES,
    pull: PULL_EXERCISES,
    legs: LEG_EXERCISES,
    cardio: CARDIO_EXERCISES,
    core: CORE_EXERCISES,
    all,
  };
}

// Build a push/pull/legs day workout from exercise library
export function buildPushWorkout(user, weekNum, userDefaults = null) {
  return buildWorkoutDay('Push', PUSH_EXERCISES, user, weekNum, 'chest, shoulders, triceps', userDefaults);
}

export function buildPullWorkout(user, weekNum, userDefaults = null) {
  return buildWorkoutDay('Pull', PULL_EXERCISES, user, weekNum, 'back, biceps, rear delts', userDefaults);
}

export function buildLegWorkout(user, weekNum, userDefaults = null) {
  return buildWorkoutDay('Legs', LEG_EXERCISES, user, weekNum, 'quads, hamstrings, glutes, calves', userDefaults);
}

// Intensity-modulated rest times: higher intensity = shorter rest
function getIntensityRest(goal, baseRest, intensity) {
  const intensityFactor = 1 - (intensity - 1) * 0.04; // 1→1.0, 10→0.64
  return Math.round(baseRest * intensityFactor);
}

function buildWorkoutDay(label, exerciseLib, user, weekNum, muscleGroups, userDefaults = null) {
  const { goal, experience, unit, intensity = 7 } = user;
  const isKg = unit === 'kg';

  // Goal-based rep/set scheme
  const schemes = {
    strength:     { sets: 4, reps: 5, rest: 180 },
    hypertrophy:  { sets: 4, reps: 8, rest: 90 },
    endurance:    { sets: 3, reps: 12, rest: 60 },
    'weight-loss':{ sets: 3, reps: 10, rest: 60 },
  };
  const scheme = schemes[goal] || schemes.hypertrophy;

  // Experience filter
  const maxDifficulty = { beginner: 6, intermediate: 8, advanced: 10 }[experience] || 7;
  const filterEx = (list) => list.filter(ex => ex.difficulty <= maxDifficulty);

  // User preference overrides
  const prefs = userDefaults?.preferences?.[getPplType(label)] || {};
  const preferredIds = prefs.preferredExerciseIds || null;
  const exerciseOverrides = prefs.exerciseOverrides || {};

  // If user has preferred exercises, filter library to those first (preserve order)
  let compoundPool = [...exerciseLib.compound];
  let isolationPool = [...exerciseLib.isolation];

  if (preferredIds && preferredIds.length > 0) {
    // Reorder pools to put preferred exercises first
    compoundPool = [
      ...compoundPool.filter(ex => preferredIds.includes(ex.id)),
      ...compoundPool.filter(ex => !preferredIds.includes(ex.id)),
    ];
    isolationPool = [
      ...isolationPool.filter(ex => preferredIds.includes(ex.id)),
      ...isolationPool.filter(ex => !preferredIds.includes(ex.id)),
    ];
  }

  const pick = (list, count) => filterEx(list).slice(0, count);

  // Progressive overload
  const baseSets = scheme.sets;
  const baseReps = scheme.reps;
  const baseRest = getIntensityRest(goal, scheme.rest, intensity);

  const exercises = [];

  // Compounds
  const compound = pick(compoundPool, 2);
  for (const ex of compound) {
    const override = exerciseOverrides[ex.id] || {};
    exercises.push({
      exerciseId: ex.id,
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      primaryMuscle: ex.primary,
      equipment: ex.equipment,
      sets: override.sets ?? baseSets,
      reps: override.reps ?? baseReps,
      targetWeight: override.targetWeight ?? estimateWeight(user, ex),
      restSeconds: override.restSeconds ?? baseRest,
      isCompound: true,
    });
  }

  // Isolation
  const iso = pick(isolationPool, 3);
  for (const ex of iso) {
    const override = exerciseOverrides[ex.id] || {};
    exercises.push({
      exerciseId: ex.id,
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      primaryMuscle: ex.primary,
      equipment: ex.equipment,
      sets: override.sets ?? (baseSets - 1),
      reps: override.reps ?? baseReps,
      targetWeight: override.targetWeight ?? estimateWeight(user, ex),
      restSeconds: override.restSeconds ?? Math.round(baseRest / 2),
      isCompound: false,
    });
  }

  return { dayOfWeek: label, muscleGroups, exercises };
}

// ─── Cardio Finisher (appended to every workout day) ─────────────────────────

export function buildCardioFinisher(user) {
  const { goal, experience = 'intermediate' } = user;

  // Duration based on goal
  const baseMinutes = {
    strength: 20,
    hypertrophy: 25,
    endurance: 35,
    'weight-loss': 40,
  }[goal] || 25;

  // Pick 1 cardio exercise based on experience
  const maxDiff = { beginner: 5, intermediate: 7, advanced: 10 }[experience] || 6;
  const machines = CARDIO_EXERCISES.machines.filter(e => e.difficulty <= maxDiff);
  const hiit = CARDIO_EXERCISES.hiit.filter(e => e.difficulty <= maxDiff);

  // Weight-loss/endurance goals get more HIIT options
  const useHIIT = ['endurance', 'weight-loss'].includes(goal);
  const pool = useHIIT ? [...machines, ...hiit] : machines;

  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const ex = pick(pool);

  return {
    exerciseId: ex.id,
    name: ex.name,
    muscleGroup: ex.muscleGroup,
    primaryMuscle: ex.primary,
    equipment: ex.equipment,
    sets: 1,
    reps: baseMinutes,
    targetWeight: 0,
    restSeconds: 0,
    isCompound: false,
    unit: ex.unit || 'min',
  };
}

// ─── Default Templates ────────────────────────────────────────────────────────

export const DEFAULT_TEMPLATES = [
  {
    id: 'ppl',
    name: 'Push / Pull / Legs',
    isDefault: true,
    dayTypes: [
      {
        label: 'Push',
        muscleGroups: 'chest, shoulders, triceps',
        exercises: [
          { exerciseId: 'bench-press', sets: 4, reps: 8, restSeconds: 90 },
          { exerciseId: 'overhead-press', sets: 4, reps: 8, restSeconds: 90 },
          { exerciseId: 'lateral-raise', sets: 3, reps: 12, restSeconds: 45 },
          { exerciseId: 'cable-crossover', sets: 3, reps: 12, restSeconds: 45 },
          { exerciseId: 'tricep-pushdown', sets: 3, reps: 12, restSeconds: 45 },
        ],
      },
      {
        label: 'Pull',
        muscleGroups: 'back, biceps, rear delts',
        exercises: [
          { exerciseId: 'deadlift', sets: 4, reps: 5, restSeconds: 180 },
          { exerciseId: 'barbell-row', sets: 4, reps: 8, restSeconds: 90 },
          { exerciseId: 'lat-pulldown', sets: 3, reps: 12, restSeconds: 45 },
          { exerciseId: 'face-pull', sets: 3, reps: 15, restSeconds: 45 },
          { exerciseId: 'barbell-curl', sets: 3, reps: 12, restSeconds: 45 },
        ],
      },
      {
        label: 'Legs',
        muscleGroups: 'quads, hamstrings, glutes, calves',
        exercises: [
          { exerciseId: 'squat', sets: 4, reps: 5, restSeconds: 180 },
          { exerciseId: 'romanian-deadlift', sets: 4, reps: 8, restSeconds: 90 },
          { exerciseId: 'leg-press', sets: 3, reps: 12, restSeconds: 60 },
          { exerciseId: 'leg-curl', sets: 3, reps: 12, restSeconds: 45 },
          { exerciseId: 'calf-raise', sets: 3, reps: 15, restSeconds: 45 },
        ],
      },
    ],
  },
  {
    id: 'upper-lower',
    name: 'Upper / Lower',
    isDefault: true,
    dayTypes: [
      {
        label: 'Upper',
        muscleGroups: 'chest, back, shoulders, arms',
        exercises: [
          { exerciseId: 'bench-press', sets: 4, reps: 8, restSeconds: 90 },
          { exerciseId: 'barbell-row', sets: 4, reps: 8, restSeconds: 90 },
          { exerciseId: 'overhead-press', sets: 3, reps: 10, restSeconds: 60 },
          { exerciseId: 'lat-pulldown', sets: 3, reps: 12, restSeconds: 45 },
          { exerciseId: 'lateral-raise', sets: 3, reps: 12, restSeconds: 45 },
          { exerciseId: 'barbell-curl', sets: 3, reps: 12, restSeconds: 45 },
          { exerciseId: 'tricep-pushdown', sets: 3, reps: 12, restSeconds: 45 },
        ],
      },
      {
        label: 'Lower',
        muscleGroups: 'quads, hamstrings, glutes, calves',
        exercises: [
          { exerciseId: 'squat', sets: 4, reps: 5, restSeconds: 180 },
          { exerciseId: 'romanian-deadlift', sets: 4, reps: 8, restSeconds: 90 },
          { exerciseId: 'hip-thrust', sets: 3, reps: 10, restSeconds: 60 },
          { exerciseId: 'leg-extension', sets: 3, reps: 12, restSeconds: 45 },
          { exerciseId: 'leg-curl', sets: 3, reps: 12, restSeconds: 45 },
          { exerciseId: 'calf-raise', sets: 3, reps: 15, restSeconds: 45 },
        ],
      },
    ],
  },
];

// Build a workout object from a template day type, resolving exercise IDs
export function buildWorkoutFromTemplateDay(templateDay, user, weekNum, addCardioFinisher = true) {
  const { experience = 'intermediate', unit, weight, goal, intensity = 7 } = user;
  const isKg = unit === 'kg';
  const bw = parseFloat(weight) || (isKg ? 75 : 165);

  // Build exercise map by ID and by name
  const exerciseMap = {};
  const exerciseNameMap = {};
  for (const cat of [PUSH_EXERCISES, PULL_EXERCISES, LEG_EXERCISES]) {
    for (const ex of [...cat.compound, ...cat.isolation]) {
      exerciseMap[ex.id] = ex;
      exerciseNameMap[ex.name.toLowerCase()] = ex;
    }
  }

  const maxDifficulty = { beginner: 6, intermediate: 8, advanced: 10 }[experience] || 7;
  const intensityFactor = 1 - (intensity - 1) * 0.04;

  const exercises = [];
  for (const tplEx of templateDay.exercises || []) {
    // Try to find the exercise: by ID first, then by name
    let ex = exerciseMap[tplEx.exerciseId];
    if (!ex && tplEx.name) {
      ex = exerciseNameMap[tplEx.name.toLowerCase()];
    }

    // If still not found, skip (unknown custom exercise)
    if (!ex) continue;
    if (ex.difficulty > maxDifficulty) continue;

    const restSeconds = Math.round((tplEx.restSeconds || 60) * intensityFactor);
    const targetWeight = estimateWeightFromTemplate(user, ex, tplEx, bw);

    exercises.push({
      exerciseId: ex.id,
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      primaryMuscle: ex.primary,
      equipment: ex.equipment,
      sets: tplEx.sets || 3,
      reps: tplEx.reps || 10,
      targetWeight,
      restSeconds,
      isCompound: ex.difficulty >= 6,
    });
  }

  // Append cardio finisher
  if (addCardioFinisher) {
    const cardioEx = buildCardioFinisher(user);
    exercises.push(cardioEx);
  }

  return {
    dayOfWeek: templateDay.label,
    muscleGroups: templateDay.muscleGroups,
    exercises,
  };
}

function estimateWeightFromTemplate(user, exercise, templateExercise, bw) {
  const { experience = 'intermediate', unit } = user;
  const isKg = unit === 'kg';

  if (templateExercise.targetWeight > 0) return templateExercise.targetWeight;

  const multiplier = (exercise.difficulty / 10) * 0.85;
  let w = bw * multiplier;

  if (experience === 'beginner') w *= 0.55;
  else if (experience === 'intermediate') w *= 0.75;
  else w *= 0.90;

  if (isKg) w = Math.round(w / 2.5) * 2.5;
  else w = Math.round(w / 5) * 5;

  return Math.max(w, 0);
}

function estimateWeight(user, exercise) {
  const { weight, experience, unit } = user;
  const isKg = unit === 'kg';
  const bw = parseFloat(weight) || (isKg ? 75 : 165);

  const multiplier = (exercise.difficulty / 10) * 0.85;
  let w = bw * multiplier;

  if (experience === 'beginner') w *= 0.55;
  else if (experience === 'intermediate') w *= 0.75;
  else w *= 0.90;

  if (isKg) w = Math.round(w / 2.5) * 2.5;
  else w = Math.round(w / 5) * 5;

  return Math.max(w, 0);
}
