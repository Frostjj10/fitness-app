import {
  PUSH_EXERCISES,
  PULL_EXERCISES,
  LEG_EXERCISES,
  CARDIO_EXERCISES,
  CORE_EXERCISES,
} from './ppl';

// ─── Difficulty caps by experience ───────────────────────────────────────────
const DIFFICULTY_CAPS = {
  beginner: { strength: 6, cardio: 5 },
  intermediate: { strength: 8, cardio: 7 },
  advanced: { strength: 10, cardio: 10 },
};

// ─── Experience multipliers for weight estimation ─────────────────────────────
const EXP_MULTIPLIERS = {
  beginner: 0.55,
  intermediate: 0.75,
  advanced: 0.90,
};

// ─── Core training parameters by goal ───────────────────────────────────────
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

// ─── Session length targets (minutes) ─────────────────────────────────────────
const SESSION_LENGTH_PARAMS = {
  short:   { targetMin: 35, targetMax: 50,  perExerciseMin: 4, perExerciseMax: 6  },
  medium:  { targetMin: 50, targetMax: 70,  perExerciseMin: 5, perExerciseMax: 8  },
  long:    { targetMin: 65, targetMax: 90,  perExerciseMin: 6, perExerciseMax: 10 },
};

// ─── Cardio level configs ─────────────────────────────────────────────────────
const CARDIO_LEVELS = {
  none:     { appendToWorkout: false, hiitDays: 0, lissDays: 0 },
  light:    { appendToWorkout: true,  hiitDays: 0, lissDays: 1 },
  moderate: { appendToWorkout: true,  hiitDays: 1, lissDays: 2 },
  intense:  { appendToWorkout: true,  hiitDays: 2, lissDays: 2 },
};

// ─── Split configurations by days per week ───────────────────────────────────
const SPLIT_CONFIGS = {
  '2': { type: 'full-body', days: ['Full Body A', 'Full Body B'] },
  '3': { type: 'full-body', days: ['Full Body A', 'Full Body B', 'Full Body C'] },
  '4': { type: 'upper-lower', days: ['Upper A', 'Lower A', 'Upper B', 'Lower B'] },
  '5': { type: 'ppl',        days: ['Push', 'Pull', 'Legs', 'Push', 'Pull'] },
  '6': { type: 'ppl',        days: ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs'] },
};

// ─── Muscle group → exercise category mapping ────────────────────────────────
function getCategoryForMuscleGroup(mg) {
  const push = ['chest', 'shoulders', 'triceps'];
  const pull = ['back', 'biceps', 'rear delts', 'forearms'];
  if (push.includes(mg)) return PUSH_EXERCISES;
  if (pull.includes(mg)) return PULL_EXERCISES;
  return LEG_EXERCISES;
}

// ─── Priority map for exercise ordering ──────────────────────────────────────
const MUSCLE_PRIORITY = {
  chest: 1, back: 2, shoulders: 3, quadriceps: 4,
  hamstrings: 5, glutes: 6, calves: 7, biceps: 8,
  triceps: 9, forearms: 10,
};

// ─── All equipment list ───────────────────────────────────────────────────────
const ALL_EQUIPMENT = ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pickRandom(arr, count = 1) {
  if (count === 1) return arr[Math.floor(Math.random() * arr.length)];
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function shuffleArray(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function estimateTargetWeight(user, exercise) {
  const bw = parseFloat(user.weight) || (user.unit === 'kg' ? 75 : 165);
  const params = GOAL_PARAMS[user.goal] || GOAL_PARAMS.hypertrophy;
  const expMult = EXP_MULTIPLIERS[user.experience] || 0.75;
  let weight = bw * (exercise.difficulty / 10) * params.loadCoeff * expMult;
  const increment = user.unit === 'kg' ? 2.5 : 5;
  weight = Math.round(weight / increment) * increment;
  return Math.max(weight, 0);
}

// ─── Exercise selection for a single muscle group ─────────────────────────────
function selectExercisesForMuscleGroup(mg, category, params, user, equipSet, maxDiff, sessionLen) {
  const { perExerciseMin, perExerciseMax } = sessionLen;
  const targetCount = Math.floor(Math.random() * (perExerciseMax - perExerciseMin + 1)) + perExerciseMin;

  const allCompounds = category.compound.filter(e => e.difficulty >= 6 && e.difficulty <= maxDiff);
  const allIsolations = category.isolation.filter(e => e.difficulty <= maxDiff);

  const availableCompounds = allCompounds.filter(e => equipSet.has(e.equipment));
  const availableIsolations = allIsolations.filter(e => equipSet.has(e.equipment));

  const compounds = availableCompounds.length > 0 ? availableCompounds : allCompounds;
  const isolations = availableIsolations.length > 0 ? availableIsolations : allIsolations;

  const isCompound = (e) => e.difficulty >= 6;

  // Try to get at least one compound for major muscle groups (chest, back, quads)
  const majorMGs = ['chest', 'back', 'quads'];
  const preferCompound = majorMGs.includes(mg);

  const selected = [];

  // Compound (1 if preferred, or skip if it's a minor group)
  if (preferCompound || compounds.length > 0) {
    const pool = compounds.length > 0 ? compounds : allCompounds;
    const preferred = pool.filter(e => e.primary === mg || e.muscleGroup === mg);
    const pick = preferred.length > 0 ? pickRandom(preferred) : pickRandom(pool);
    selected.push(pick);
  }

  // Isolations to fill the session (1-3 based on session length)
  const remainingSlots = Math.max(0, targetCount - selected.length);
  if (remainingSlots > 0) {
    const mgIsolations = isolations.filter(e => e.muscleGroup === mg);
    const pool = mgIsolations.length > 0 ? mgIsolations : isolations;
    const count = Math.min(remainingSlots, pool.length);
    if (pool.length > 0) {
      const picks = pickRandom(pool, count);
      selected.push(...(Array.isArray(picks) ? picks : [picks]));
    }
  }

  return selected;
}

// ─── Build exercises for a day ───────────────────────────────────────────────
function buildExercisesForDay(mgConfig, user, availableEquipment, sessionLen) {
  const { muscleGroups } = mgConfig;
  const caps = DIFFICULTY_CAPS[user.experience] || DIFFICULTY_CAPS.intermediate;
  const maxDiff = caps.strength;
  const params = GOAL_PARAMS[user.goal] || GOAL_PARAMS.hypertrophy;
  const equipSet = new Set(availableEquipment || ALL_EQUIPMENT);
  const sLen = SESSION_LENGTH_PARAMS[sessionLen] || SESSION_LENGTH_PARAMS.medium;

  const exercises = [];

  for (const mg of muscleGroups) {
    const category = getCategoryForMuscleGroup(mg);
    const selected = selectExercisesForMuscleGroup(mg, category, params, user, equipSet, maxDiff, sLen);

    for (const ex of selected) {
      const isCompound = ex.difficulty >= 6;
      const [minSets, maxSets] = params.setsRange;
      const [minReps, maxReps] = params.repRange;
      const [minRest, maxRest] = isCompound ? params.restCompound : params.restIsolation;

      const sets = isCompound ? maxSets : Math.round((minSets + maxSets) / 2);
      const reps = isCompound ? minReps : Math.round((minReps + maxReps) / 2);
      const restSeconds = Math.round((minRest + maxRest) / 2);

      exercises.push({
        exerciseId: ex.id,
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        primaryMuscle: ex.primary,
        equipment: ex.equipment,
        sets,
        reps,
        targetWeight: estimateTargetWeight(user, ex),
        restSeconds,
        isCompound,
        unit: ex.unit || 'reps',
      });
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

// ─── Append core finisher ─────────────────────────────────────────────────────
function appendCoreFinisher(user) {
  const caps = DIFFICULTY_CAPS[user.experience] || DIFFICULTY_CAPS.intermediate;
  const maxDiff = Math.min(caps.strength, 8);
  const pool = CORE_EXERCISES.filter(e => e.difficulty <= maxDiff);
  const antiExtension = pool.filter(e => ['plank', 'dead-bug', 'hollow-body-hold'].includes(e.id));
  const rotation = pool.filter(e => ['pallof-press', 'russian-twist', 'lawnmower'].includes(e.id));

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

// ─── Append cardio finisher ───────────────────────────────────────────────────
function appendCardioFinisher(user, cardioLevel) {
  const cardioConfig = CARDIO_LEVELS[cardioLevel] || CARDIO_LEVELS.moderate;
  if (!cardioConfig.appendToWorkout) return [];

  const caps = DIFFICULTY_CAPS[user.experience] || DIFFICULTY_CAPS.intermediate;
  const maxDiff = caps.cardio;

  const machines = CARDIO_EXERCISES.machines.filter(e => e.difficulty <= maxDiff);
  const hiit = CARDIO_EXERCISES.hiit.filter(e => e.difficulty <= maxDiff);

  const exercises = [];
  if (machines.length) exercises.push(pickRandom(machines));
  if (hiit.length && cardioConfig.hiitDays > 0) exercises.push(pickRandom(hiit));

  return exercises.map(ex => ({
    exerciseId: ex.id,
    name: ex.name,
    muscleGroup: 'cardio',
    primaryMuscle: 'cardio',
    equipment: ex.equipment,
    sets: 1,
    reps: ex.unit === 'min' ? 20 : 15,
    targetWeight: 0,
    restSeconds: 0,
    isCompound: false,
    unit: ex.unit || 'min',
  }));
}

// ─── Main generator ──────────────────────────────────────────────────────────
/**
 * Generate a personalized workout template.
 *
 * @param {Object} options
 * @param {Object}  options.user               - User profile (goal, experience, weight, unit)
 * @param {number}  options.daysPerWeek         - Training days per week (2-6)
 * @param {string}  options.splitType          - 'auto' | 'full-body' | 'upper-lower' | 'ppl'
 * @param {string[]} options.availableEquipment - Equipment available (default: all)
 * @param {string}  options.sessionLength       - 'short' | 'medium' | 'long'
 * @param {string}  options.cardioLevel         - 'none' | 'light' | 'moderate' | 'intense'
 * @param {boolean} options.includeMobility     - Include mobility warm-up circuit
 * @param {string[]} options.priorityMuscles    - Muscle groups to emphasize (extra exercises)
 */
export function generateTemplate({
  user,
  daysPerWeek = 4,
  splitType = 'auto',
  availableEquipment = ALL_EQUIPMENT,
  sessionLength = 'medium',
  cardioLevel = 'moderate',
  includeMobility = false,
  priorityMuscles = [],
}) {
  const days = daysPerWeek || 4;
  const splitKey = String(days);
  const splitConfig = SPLIT_CONFIGS[splitKey] || SPLIT_CONFIGS['4'];

  const actualType = splitType !== 'auto' ? splitType : splitConfig.type;
  const muscleMap = {
    'full-body': [
      { label: 'Full Body A', muscleGroups: ['chest', 'back', 'quads'], primary: 'chest' },
      { label: 'Full Body B', muscleGroups: ['back', 'shoulders', 'hamstrings'], primary: 'back' },
      { label: 'Full Body C', muscleGroups: ['chest', 'shoulders', 'quads'], primary: 'shoulders' },
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
  }[actualType] || [
    { label: 'Full Body A', muscleGroups: ['chest', 'back', 'quads'], primary: 'chest' },
  ];

  const dayLabels = splitConfig.days.slice(0, days);

  // Compute cardio days: spread HIIT/LISS across workout days
  const cardioConfig = CARDIO_LEVELS[cardioLevel] || CARDIO_LEVELS.moderate;
  const cardioDays = new Set();
  if (cardioConfig.hiitDays > 0 || cardioConfig.lissDays > 0) {
    const totalCardioDays = cardioConfig.hiitDays + cardioConfig.lissDays;
    const shuffled = shuffleArray([...Array(days)].map((_, i) => i));
    shuffled.slice(0, Math.min(totalCardioDays, days)).forEach(i => cardioDays.add(i));
  }

  const template = {
    id: `generated-${Date.now()}`,
    name: `${actualType.replace('-', ' ')} · ${user.goal}`,
    is_default: false,
    isDefault: false,
    blockDuration: 4,
    sessionLength,
    cardioLevel,
    includeMobility,
    priorityMuscles,
    dayTypes: dayLabels.map((label, i) => {
      const mgConfig = muscleMap[i % muscleMap.length];
      const equipSet = new Set(availableEquipment);

      let exercises = buildExercisesForDay(mgConfig, user, availableEquipment, sessionLength);

      // ── Fallback: if missing muscle groups, re-run with all equipment ─────
      const mgWithExercises = new Set(exercises.map(e => e.muscleGroup));
      const missingMGs = mgConfig.muscleGroups.filter(mg => !mgWithExercises.has(mg));
      if (missingMGs.length > 0) {
        const allExercises = buildExercisesForDay(mgConfig, user, ALL_EQUIPMENT, sessionLength);
        const existingIds = new Set(exercises.map(e => e.exerciseId));
        const extras = allExercises.filter(
          e => !existingIds.has(e.exerciseId) && missingMGs.includes(e.muscleGroup)
        );
        exercises.push(...extras);
      }

      // ── Priority muscles: add extra isolation for flagged groups ──────────
      if (priorityMuscles.length > 0) {
        const params = GOAL_PARAMS[user.goal] || GOAL_PARAMS.hypertrophy;
        for (const pm of priorityMuscles) {
          if (!mgConfig.muscleGroups.includes(pm)) continue;
          if (exercises.some(e => e.muscleGroup === pm && !e.isCompound)) continue; // already has iso
          const category = getCategoryForMuscleGroup(pm);
          const caps = DIFFICULTY_CAPS[user.experience] || DIFFICULTY_CAPS.intermediate;
          const isolations = category.isolation.filter(
            e => e.difficulty <= caps.strength && ALL_EQUIPMENT.includes(e.equipment)
          );
          if (isolations.length > 0) {
            const pick = pickRandom(isolations);
            const [minSets, maxSets] = params.setsRange;
            exercises.push({
              exerciseId: pick.id,
              name: pick.name,
              muscleGroup: pick.muscleGroup,
              primaryMuscle: pick.primary,
              equipment: pick.equipment,
              sets: Math.round((minSets + maxSets) / 2),
              reps: Math.round((params.repRange[0] + params.repRange[1]) / 2),
              targetWeight: estimateTargetWeight(user, pick),
              restSeconds: Math.round((params.restIsolation[0] + params.restIsolation[1]) / 2),
              isCompound: false,
              unit: pick.unit || 'reps',
            });
          }
        }
      }

      // ── Mobility circuit (warm-up) ─────────────────────────────────────────
      const mobilityExercises = [];
      if (includeMobility) {
        const mobilityPool = [
          { id: 'worlds-greatest', name: "World's Greatest Stretch", muscleGroup: 'mobility', primary: 'hip', equipment: 'bodyweight', difficulty: 2, unit: 'reps' },
          { id: 'band-pull-apart', name: 'Band Pull-Apart', muscleGroup: 'mobility', primary: 'rear delts', equipment: 'cable', difficulty: 2, unit: 'reps' },
          { id: 'face-pull', name: 'Face Pull', muscleGroup: 'mobility', primary: 'rear delts', equipment: 'cable', difficulty: 3, unit: 'reps' },
          { id: 'hip-circles', name: 'Hip Circles', muscleGroup: 'mobility', primary: 'hip', equipment: 'bodyweight', difficulty: 1, unit: 'reps' },
          { id: 'cat-cow', name: 'Cat-Cow Stretch', muscleGroup: 'mobility', primary: 'spine', equipment: 'bodyweight', difficulty: 1, unit: 'reps' },
          { id: 'thoracic-extension', name: 'Thoracic Extension', muscleGroup: 'mobility', primary: 'thoracic', equipment: 'bodyweight', difficulty: 2, unit: 'reps' },
        ];
        const picks = pickRandom(mobilityPool, 2);
        for (const ex of picks) {
          mobilityExercises.push({
            exerciseId: ex.id,
            name: ex.name,
            muscleGroup: 'mobility',
            primaryMuscle: ex.primary,
            equipment: ex.equipment,
            sets: 2,
            reps: 10,
            targetWeight: 0,
            restSeconds: 30,
            isCompound: false,
            unit: 'reps',
          });
        }
      }

      // ── Core finisher ──────────────────────────────────────────────────────
      const coreFinisher = appendCoreFinisher(user);

      // ── Cardio finisher (only on designated cardio days) ───────────────────
      const cardioFinisher = cardioDays.has(i) ? appendCardioFinisher(user, cardioLevel) : [];

      const allExercises = [...mobilityExercises, ...exercises, ...coreFinisher, ...cardioFinisher];

      // Validate: if still empty, throw descriptive error
      if (allExercises.length === 0) {
        throw new Error(
          `Could not generate exercises for "${label}" (muscle groups: ${mgConfig.muscleGroups.join(', ')}) ` +
          `with your selected equipment (${availableEquipment.join(', ')}). ` +
          `Try enabling more equipment options.`
        );
      }

      return {
        label,
        muscleGroups: mgConfig.muscleGroups.join(', '),
        exercises: allExercises,
      };
    }),
  };

  return template;
}

// ─── Expose config for UI use ────────────────────────────────────────────────
export const GENERATOR_OPTIONS = {
  sessionLength: [
    { value: 'short',  label: 'Short (~45 min)',  desc: '4-6 exercises, efficient workouts' },
    { value: 'medium', label: 'Medium (~60 min)', desc: '6-8 exercises, balanced volume' },
    { value: 'long',   label: 'Long (~75 min)',   desc: '8-10 exercises, higher volume' },
  ],
  cardioLevel: [
    { value: 'none',     label: 'None',      desc: 'No cardio finisher' },
    { value: 'light',    label: 'Light',      desc: '1-2 LISS sessions/week' },
    { value: 'moderate', label: 'Moderate',   desc: '3 sessions/week (HIIT + LISS)' },
    { value: 'intense',  label: 'Intense',   desc: '4+ sessions/week (HIIT + LISS)' },
  ],
  priorityMuscles: [
    { value: 'chest',      label: 'Chest' },
    { value: 'back',       label: 'Back' },
    { value: 'shoulders',  label: 'Shoulders' },
    { value: 'biceps',     label: 'Biceps' },
    { value: 'triceps',    label: 'Triceps' },
    { value: 'quads',      label: 'Quadriceps' },
    { value: 'hamstrings', label: 'Hamstrings' },
    { value: 'glutes',     label: 'Glutes' },
    { value: 'calves',     label: 'Calves' },
  ],
};
