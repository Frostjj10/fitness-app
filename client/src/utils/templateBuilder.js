import {
  PUSH_EXERCISES,
  PULL_EXERCISES,
  LEG_EXERCISES,
  CARDIO_EXERCISES,
  CORE_EXERCISES,
} from './ppl';

// ─── Difficulty caps by experience ───────────────────────────────────────────────
const DIFFICULTY_CAPS = {
  beginner: { strength: 6, cardio: 5 },
  intermediate: { strength: 8, cardio: 7 },
  advanced: { strength: 10, cardio: 10 },
};

// ─── Experience multipliers for weight estimation ────────────────────────────────
const EXP_MULTIPLIERS = {
  beginner: 0.55,
  intermediate: 0.75,
  advanced: 0.90,
};

// ─── Core training parameters by goal ─────────────────────────────────────────
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

// ─── Session length: total exercises per day (excl. core/cardio) ─────────────────
const SESSION_LENGTH_PARAMS = {
  short:   { exercisesPerDay: 5, desc: '4-5 exercises' },
  medium:  { exercisesPerDay: 7, desc: '6-8 exercises' },
  long:    { exercisesPerDay: 9, desc: '9-10 exercises' },
};

// ─── Cardio level configs ──────────────────────────────────────────────────────
const CARDIO_LEVELS = {
  none:     { appendToWorkout: false, hiitDays: 0, lissDays: 0 },
  light:    { appendToWorkout: true,  hiitDays: 0, lissDays: 1 },
  moderate: { appendToWorkout: true,  hiitDays: 1, lissDays: 2 },
  intense:  { appendToWorkout: true,  hiitDays: 2, lissDays: 2 },
};

// ─── Split configurations by days per week ─────────────────────────────────────
const SPLIT_CONFIGS = {
  '2': { type: 'full-body', days: ['Full Body A', 'Full Body B'] },
  '3': { type: 'full-body', days: ['Full Body A', 'Full Body B', 'Full Body C'] },
  '4': { type: 'upper-lower', days: ['Upper A', 'Lower A', 'Upper B', 'Lower B'] },
  '5': { type: 'ppl',        days: ['Push', 'Pull', 'Legs', 'Push', 'Pull'] },
  '6': { type: 'ppl',        days: ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs'] },
};

// ─── Muscle group → exercise category mapping ───────────────────────────────────
function getCategoryForMuscleGroup(mg) {
  const push = ['chest', 'shoulders', 'triceps'];
  const pull = ['back', 'biceps', 'rear delts', 'forearms'];
  if (push.includes(mg)) return PUSH_EXERCISES;
  if (pull.includes(mg)) return PULL_EXERCISES;
  return LEG_EXERCISES;
}

// ─── Priority map for exercise ordering ───────────────────────────────────────
const MUSCLE_PRIORITY = {
  chest: 1, back: 2, shoulders: 3, quadriceps: 4,
  hamstrings: 5, glutes: 6, calves: 7, biceps: 8,
  triceps: 9, forearms: 10,
};

// ─── All equipment list ────────────────────────────────────────────────────────
const ALL_EQUIPMENT = ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight'];

// ─── Major muscle groups (get a guaranteed compound slot) ─────────────────────
const MAJOR_MGS = new Set(['chest', 'back', 'quads']);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pickRandom(arr, count = 1) {
  if (count === 1) return arr[Math.floor(Math.random() * arr.length)];
  return [...arr].sort(() => Math.random() - 0.5).slice(0, count);
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

// ─── Build exercises for a day — respects a hard per-day exercise cap ───────────
function buildExercisesForDay(mgConfig, user, availableEquipment, sessionLen) {
  const { muscleGroups } = mgConfig;
  const caps = DIFFICULTY_CAPS[user.experience] || DIFFICULTY_CAPS.intermediate;
  const maxDiff = caps.strength;
  const params = GOAL_PARAMS[user.goal] || GOAL_PARAMS.hypertrophy;
  const equipSet = new Set(availableEquipment || ALL_EQUIPMENT);
  const targetCount = SESSION_LENGTH_PARAMS[sessionLen]?.exercisesPerDay || 7;

  const exercises = [];
  const usedIds = new Set();

  function addExercise(ex) {
    if (usedIds.has(ex.id)) return false;
    if (exercises.length >= targetCount) return false;
    usedIds.add(ex.id);
    const isCompound = ex.difficulty >= 6;
    const [minSets, maxSets] = params.setsRange;
    const [minReps, maxReps] = params.repRange;
    const [minRest, maxRest] = isCompound ? params.restCompound : params.restIsolation;

    exercises.push({
      exerciseId: ex.id,
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      primaryMuscle: ex.primary,
      equipment: ex.equipment,
      sets: isCompound ? maxSets : Math.round((minSets + maxSets) / 2),
      reps: isCompound ? minReps : Math.round((minReps + maxReps) / 2),
      targetWeight: estimateTargetWeight(user, ex),
      restSeconds: Math.round((minRest + maxRest) / 2),
      isCompound,
      unit: ex.unit || 'reps',
    });
    return true;
  }

  // ── Pass 1: one compound per major muscle group ────────────────────────────────
  for (const mg of muscleGroups) {
    if (!MAJOR_MGS.has(mg)) continue;
    const category = getCategoryForMuscleGroup(mg);
    const allCompounds = category.compound.filter(e => e.difficulty >= 6 && e.difficulty <= maxDiff);
    const availCompounds = allCompounds.filter(e => equipSet.has(e.equipment));
    const pool = availCompounds.length > 0 ? availCompounds : allCompounds;
    const preferred = pool.filter(e => e.primary === mg || e.muscleGroup === mg);
    const pick = preferred.length > 0 ? pickRandom(preferred) : (pool.length > 0 ? pickRandom(pool) : null);
    if (pick) addExercise(pick);
  }

  // ── Pass 2: fill remaining slots with isolation for target muscle groups ──────
  if (exercises.length < targetCount) {
    const remainingSlots = targetCount - exercises.length;
    const candidates = [];

    for (const mg of muscleGroups) {
      const category = getCategoryForMuscleGroup(mg);
      const allIsolations = category.isolation.filter(e => e.difficulty <= maxDiff);
      const availIsolations = allIsolations.filter(e => equipSet.has(e.equipment));
      const pool = availIsolations.length > 0 ? availIsolations : allIsolations;
      const mgIsolations = pool.filter(e => e.muscleGroup === mg);
      const isolations = mgIsolations.length > 0 ? mgIsolations : pool;
      for (const ex of isolations) {
        if (!usedIds.has(ex.id)) candidates.push(ex);
      }
    }

    const shuffled = shuffleArray(candidates);
    for (const ex of shuffled) {
      if (exercises.length >= targetCount) break;
      addExercise(ex);
    }
  }

  // ── Pass 3: if still under target, fill with any available exercises ─────────
  if (exercises.length < targetCount) {
    for (const mg of muscleGroups) {
      if (exercises.length >= targetCount) break;
      const category = getCategoryForMuscleGroup(mg);
      const allCompounds = category.compound.filter(e => e.difficulty >= 6 && e.difficulty <= maxDiff);
      const availCompounds = allCompounds.filter(e => equipSet.has(e.equipment));
      for (const ex of availCompounds) {
        if (!usedIds.has(ex.id)) addExercise(ex);
        if (exercises.length >= targetCount) break;
      }
    }
  }

  // Sort: compounds first, then by muscle priority
  exercises.sort((a, b) => {
    if (a.isCompound !== b.isCompound) return a.isCompound ? -1 : 1;
    return (MUSCLE_PRIORITY[a.muscleGroup] || 10) - (MUSCLE_PRIORITY[b.muscleGroup] || 10);
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
  if (!machines.length) return [];

  const ex = pickRandom(machines);
  return [{
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
  }];
}

// ─── Main generator ───────────────────────────────────────────────────────────
/**
 * Generate a personalized workout template.
 *
 * @param {Object}  options
 * @param {Object}   options.user               - User profile (goal, experience, weight, unit)
 * @param {number}   options.daysPerWeek       - Training days per week (2-6)
 * @param {string}   options.splitType          - 'auto' | 'full-body' | 'upper-lower' | 'ppl'
 * @param {string[]} options.availableEquipment  - Equipment available (default: all)
 * @param {string}   options.sessionLength      - 'short' | 'medium' | 'long'
 * @param {string}   options.cardioLevel        - 'none' | 'light' | 'moderate' | 'intense'
 * @param {boolean}  options.includeMobility     - Include mobility warm-up circuit
 * @param {string[]} options.priorityMuscles    - Muscle groups to emphasize (extra isolation)
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
      { label: 'Full Body A', muscleGroups: ['chest', 'back', 'quads'],          primary: 'chest' },
      { label: 'Full Body B', muscleGroups: ['back', 'shoulders', 'hamstrings'],  primary: 'back' },
      { label: 'Full Body C', muscleGroups: ['chest', 'shoulders', 'quads'],      primary: 'shoulders' },
    ],
    'upper-lower': [
      { label: 'Upper A', muscleGroups: ['chest', 'back', 'shoulders'],            primary: 'chest' },
      { label: 'Lower A', muscleGroups: ['quads', 'hamstrings', 'glutes'],         primary: 'quads' },
      { label: 'Upper B', muscleGroups: ['chest', 'back', 'shoulders', 'biceps'], primary: 'back' },
      { label: 'Lower B', muscleGroups: ['quads', 'hamstrings', 'calves'],         primary: 'hamstrings' },
    ],
    'ppl': [
      { label: 'Push',     muscleGroups: ['chest', 'shoulders', 'triceps'],        primary: 'chest' },
      { label: 'Pull',     muscleGroups: ['back', 'biceps', 'rear delts'],          primary: 'back' },
      { label: 'Legs',     muscleGroups: ['quads', 'hamstrings', 'glutes', 'calves'], primary: 'quads' },
    ],
  }[actualType] || [
    { label: 'Full Body A', muscleGroups: ['chest', 'back', 'quads'], primary: 'chest' },
  ];

  const dayLabels = splitConfig.days.slice(0, days);

  // Compute which days get a cardio finisher
  const cardioConfig = CARDIO_LEVELS[cardioLevel] || CARDIO_LEVELS.moderate;
  const cardioDays = new Set();
  if (cardioConfig.hiitDays > 0 || cardioConfig.lissDays > 0) {
    const total = Math.min(cardioConfig.hiitDays + cardioConfig.lissDays, days);
    const indices = shuffleArray([...Array(days).keys()]);
    indices.slice(0, total).forEach(i => cardioDays.add(i));
  }

  const prioritySet = new Set(priorityMuscles);
  const params = GOAL_PARAMS[user.goal] || GOAL_PARAMS.hypertrophy;

  const template = {
    id: `generated-${Date.now()}`,
    name: `${actualType.replace('-', ' ')} · ${user.goal}`,
    is_default: false,
    isDefault: false,
    sessionLength,
    cardioLevel,
    includeMobility,
    priorityMuscles,
    dayTypes: dayLabels.map((label, i) => {
      const mgConfig = muscleMap[i % muscleMap.length];

      let exercises = buildExercisesForDay(mgConfig, user, availableEquipment, sessionLength);

      // ── Fallback: fill missing muscle groups with all-equipment exercises ─────
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

      // ── Priority muscles: add one extra isolation per flagged group ───────────
      if (priorityMuscles.length > 0) {
        const caps = DIFFICULTY_CAPS[user.experience] || DIFFICULTY_CAPS.intermediate;
        for (const pm of priorityMuscles) {
          if (!mgConfig.muscleGroups.includes(pm)) continue;
          if (exercises.some(e => e.muscleGroup === pm && !e.isCompound)) continue;
          const category = getCategoryForMuscleGroup(pm);
          const isolations = category.isolation.filter(
            e => e.difficulty <= caps.strength && ALL_EQUIPMENT.includes(e.equipment)
          );
          if (isolations.length > 0) {
            const pick = pickRandom(isolations);
            const [minSets, maxSets] = params.setsRange;
            const [minReps, maxReps] = params.repRange;
            exercises.push({
              exerciseId: pick.id,
              name: pick.name,
              muscleGroup: pick.muscleGroup,
              primaryMuscle: pick.primary,
              equipment: pick.equipment,
              sets: Math.round((minSets + maxSets) / 2),
              reps: Math.round((minReps + maxReps) / 2),
              targetWeight: estimateTargetWeight(user, pick),
              restSeconds: Math.round((params.restIsolation[0] + params.restIsolation[1]) / 2),
              isCompound: false,
              unit: pick.unit || 'reps',
            });
          }
        }
      }

      // ── Mobility warm-up ──────────────────────────────────────────────────────
      const mobilityExercises = [];
      if (includeMobility) {
        const mobilityPool = [
          { id: 'worlds-greatest',  name: "World's Greatest Stretch", muscleGroup: 'mobility', primary: 'hip',     equipment: 'bodyweight', difficulty: 2, unit: 'reps' },
          { id: 'band-pull-apart',  name: 'Band Pull-Apart',          muscleGroup: 'mobility', primary: 'rear delts', equipment: 'cable',     difficulty: 2, unit: 'reps' },
          { id: 'hip-circles',      name: 'Hip Circles',               muscleGroup: 'mobility', primary: 'hip',     equipment: 'bodyweight', difficulty: 1, unit: 'reps' },
          { id: 'cat-cow',          name: 'Cat-Cow Stretch',           muscleGroup: 'mobility', primary: 'spine',   equipment: 'bodyweight', difficulty: 1, unit: 'reps' },
        ];
        const picks = pickRandom(mobilityPool, 2);
        for (const ex of picks) {
          mobilityExercises.push({
            exerciseId: ex.id, name: ex.name, muscleGroup: 'mobility',
            primaryMuscle: ex.primary, equipment: ex.equipment,
            sets: 2, reps: 10, targetWeight: 0, restSeconds: 30,
            isCompound: false, unit: 'reps',
          });
        }
      }

      // ── Core finisher ─────────────────────────────────────────────────────────
      const coreFinisher = appendCoreFinisher(user);

      // ── Cardio finisher (only on designated cardio days) ───────────────────────
      const cardioFinisher = cardioDays.has(i) ? appendCardioFinisher(user, cardioLevel) : [];

      const allExercises = [...mobilityExercises, ...exercises, ...coreFinisher, ...cardioFinisher];

      // ── Validation ───────────────────────────────────────────────────────────
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

// ─── Expose options for UI ─────────────────────────────────────────────────────
export const GENERATOR_OPTIONS = {
  sessionLength: [
    { value: 'short',  label: 'Short (~45 min)', desc: '4-5 exercises' },
    { value: 'medium', label: 'Medium (~60 min)', desc: '6-8 exercises' },
    { value: 'long',   label: 'Long (~75 min)',  desc: '9-10 exercises' },
  ],
  cardioLevel: [
    { value: 'none',     label: 'None',     desc: 'No cardio finisher' },
    { value: 'light',    label: 'Light',    desc: '1 LISS session/week' },
    { value: 'moderate', label: 'Moderate',  desc: '3 sessions/week (HIIT + LISS)' },
    { value: 'intense',  label: 'Intense',  desc: '4+ sessions/week' },
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
