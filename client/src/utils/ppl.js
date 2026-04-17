// Push / Pull / Legs training splits - research-based exercise selection
// Each muscle group gets compound + isolation work. Exercises chosen for safety & effectiveness.
// Equipment variety: barbell, dumbbell, cable, machine, bodyweight to maximize bang-for-buck.

export const PUSH_EXERCISES = {
  compound: [
    // Chest compounds
    { id: 'bench-press', name: 'Bench Press', muscleGroup: 'chest', primary: 'chest', equipment: 'barbell', difficulty: 7 },
    { id: 'incline-bench', name: 'Incline Bench Press', muscleGroup: 'chest', primary: 'chest', equipment: 'barbell', difficulty: 6 },
    { id: 'decline-bench', name: 'Decline Bench Press', muscleGroup: 'chest', primary: 'chest', equipment: 'barbell', difficulty: 6 },
    { id: 'close-grip-bench', name: 'Close-Grip Bench Press', muscleGroup: 'chest', primary: 'triceps', equipment: 'barbell', difficulty: 7 },
    { id: 'dumbbell-bench', name: 'Dumbbell Bench Press', muscleGroup: 'chest', primary: 'chest', equipment: 'dumbbell', difficulty: 6 },
    { id: 'incline-dumbbell', name: 'Incline Dumbbell Press', muscleGroup: 'chest', primary: 'chest', equipment: 'dumbbell', difficulty: 5 },
    { id: 'machine-chest-press', name: 'Machine Chest Press', muscleGroup: 'chest', primary: 'chest', equipment: 'machine', difficulty: 4 },
    { id: 'dip', name: 'Dip', muscleGroup: 'chest', primary: 'chest', equipment: 'bodyweight', difficulty: 6 },
    { id: 'paused-bench', name: 'Paused Bench Press', muscleGroup: 'chest', primary: 'chest', equipment: 'barbell', difficulty: 7 },
    { id: 'spoto-press', name: 'Spoto Press', muscleGroup: 'chest', primary: 'chest', equipment: 'barbell', difficulty: 7 },
    // Shoulder compounds
    { id: 'overhead-press', name: 'Overhead Press', muscleGroup: 'shoulders', primary: 'shoulders', equipment: 'barbell', difficulty: 7 },
    { id: 'dumbbell-shoulder-press', name: 'Dumbbell Shoulder Press', muscleGroup: 'shoulders', primary: 'shoulders', equipment: 'dumbbell', difficulty: 6 },
    { id: 'arnold-press', name: 'Arnold Press', muscleGroup: 'shoulders', primary: 'shoulders', equipment: 'dumbbell', difficulty: 5 },
    { id: 'landmine-press', name: 'Landmine Press', muscleGroup: 'shoulders', primary: 'shoulders', equipment: 'barbell', difficulty: 5 },
    { id: 'push-press', name: 'Push Press', muscleGroup: 'shoulders', primary: 'shoulders', equipment: 'barbell', difficulty: 6 },
    { id: 'seated-arnold-press', name: 'Seated Arnold Press', muscleGroup: 'shoulders', primary: 'shoulders', equipment: 'dumbbell', difficulty: 5 },
  ],
  isolation: [
    // Chest isolation
    { id: 'cable-crossover', name: 'Cable Crossover', muscleGroup: 'chest', primary: 'chest', equipment: 'cable', difficulty: 4 },
    { id: 'machine-fly', name: 'Machine Fly', muscleGroup: 'chest', primary: 'chest', equipment: 'machine', difficulty: 3 },
    { id: 'dumbbell-fly', name: 'Dumbbell Fly', muscleGroup: 'chest', primary: 'chest', equipment: 'dumbbell', difficulty: 3 },
    { id: 'pec-deck', name: 'Pec Deck', muscleGroup: 'chest', primary: 'chest', equipment: 'machine', difficulty: 3 },
    { id: 'svend-press', name: 'Svend Press', muscleGroup: 'chest', primary: 'chest', equipment: 'bodyweight', difficulty: 2 },
    { id: 'push-up', name: 'Push Up', muscleGroup: 'chest', primary: 'chest', equipment: 'bodyweight', difficulty: 3 },
    { id: 'decline-push-up', name: 'Decline Push Up', muscleGroup: 'chest', primary: 'chest', equipment: 'bodyweight', difficulty: 4 },
    { id: 'incline-push-up', name: 'Incline Push Up', muscleGroup: 'chest', primary: 'chest', equipment: 'bodyweight', difficulty: 2 },
    { id: 'diamond-push-up', name: 'Diamond Push Up', muscleGroup: 'chest', primary: 'triceps', equipment: 'bodyweight', difficulty: 5 },
    // Shoulder isolation
    { id: 'lateral-raise', name: 'Lateral Raise', muscleGroup: 'shoulders', primary: 'shoulders', equipment: 'dumbbell', difficulty: 4 },
    { id: 'front-raise', name: 'Front Raise', muscleGroup: 'shoulders', primary: 'shoulders', equipment: 'dumbbell', difficulty: 3 },
    { id: 'reverse-fly', name: 'Reverse Fly', muscleGroup: 'shoulders', primary: 'rear delts', equipment: 'dumbbell', difficulty: 3 },
    { id: 'upright-row', name: 'Upright Row', muscleGroup: 'shoulders', primary: 'shoulders', equipment: 'barbell', difficulty: 5 },
    { id: 'shrug', name: 'Barbell Shrug', muscleGroup: 'shoulders', primary: 'traps', equipment: 'barbell', difficulty: 3 },
    { id: 'dumbbell-shrug', name: 'Dumbbell Shrug', muscleGroup: 'shoulders', primary: 'traps', equipment: 'dumbbell', difficulty: 2 },
    { id: 'cable-lateral-raise', name: 'Cable Lateral Raise', muscleGroup: 'shoulders', primary: 'shoulders', equipment: 'cable', difficulty: 4 },
    { id: 'machine-shoulder-press', name: 'Machine Shoulder Press', muscleGroup: 'shoulders', primary: 'shoulders', equipment: 'machine', difficulty: 4 },
    { id: 'lu-raise', name: 'LU Raise', muscleGroup: 'shoulders', primary: 'lateral delts', equipment: 'dumbbell', difficulty: 4 },
    // Tricep isolation
    { id: 'tricep-pushdown', name: 'Tricep Pushdown', muscleGroup: 'triceps', primary: 'triceps', equipment: 'cable', difficulty: 3 },
    { id: 'overhead-extension', name: 'Overhead Tricep Extension', muscleGroup: 'triceps', primary: 'triceps', equipment: 'dumbbell', difficulty: 4 },
    { id: 'skull-crusher', name: 'Skull Crusher', muscleGroup: 'triceps', primary: 'triceps', equipment: 'barbell', difficulty: 5 },
    { id: 'tricep-dip', name: 'Tricep Dip', muscleGroup: 'triceps', primary: 'triceps', equipment: 'bodyweight', difficulty: 5 },
    { id: 'cable-overhead-extension', name: 'Cable Overhead Extension', muscleGroup: 'triceps', primary: 'triceps', equipment: 'cable', difficulty: 4 },
    { id: 'dumbbell-kickback', name: 'Dumbbell Kickback', muscleGroup: 'triceps', primary: 'triceps', equipment: 'dumbbell', difficulty: 3 },
    { id: 'close-grip-push-up', name: 'Close-Grip Push Up', muscleGroup: 'triceps', primary: 'triceps', equipment: 'bodyweight', difficulty: 4 },
    { id: 'jm-press', name: 'JM Press', muscleGroup: 'triceps', primary: 'triceps', equipment: 'barbell', difficulty: 6 },
  ],
};

export const PULL_EXERCISES = {
  compound: [
    // Back compounds
    { id: 'deadlift', name: 'Deadlift', muscleGroup: 'back', primary: 'back', equipment: 'barbell', difficulty: 8 },
    { id: 'barbell-row', name: 'Barbell Row', muscleGroup: 'back', primary: 'back', equipment: 'barbell', difficulty: 7 },
    { id: 'pull-up', name: 'Pull Up', muscleGroup: 'back', primary: 'back', equipment: 'bodyweight', difficulty: 7 },
    { id: 'chin-up', name: 'Chin Up', muscleGroup: 'back', primary: 'back', equipment: 'bodyweight', difficulty: 6 },
    { id: 't-bar-row', name: 'T-Bar Row', muscleGroup: 'back', primary: 'back', equipment: 'barbell', difficulty: 6 },
    { id: 'chest-supported-row', name: 'Chest-Supported Row', muscleGroup: 'back', primary: 'back', equipment: 'dumbbell', difficulty: 5 },
    { id: 'seal-row', name: 'Seal Row', muscleGroup: 'back', primary: 'back', equipment: 'barbell', difficulty: 5 },
    { id: 'pendlay-row', name: 'Pendlay Row', muscleGroup: 'back', primary: 'back', equipment: 'barbell', difficulty: 7 },
    { id: 'dumbbell-row', name: 'Dumbbell Row', muscleGroup: 'back', primary: 'back', equipment: 'dumbbell', difficulty: 5 },
    { id: ' Yates-row', name: 'Yates Row', muscleGroup: 'back', primary: 'back', equipment: 'barbell', difficulty: 6 },
    { id: 'machine-row', name: 'Machine Row', muscleGroup: 'back', primary: 'back', equipment: 'machine', difficulty: 4 },
    { id: 'inverted-row', name: 'Inverted Row', muscleGroup: 'back', primary: 'back', equipment: 'bodyweight', difficulty: 5 },
  ],
  isolation: [
    // Back isolation
    { id: 'lat-pulldown', name: 'Lat Pulldown', muscleGroup: 'back', primary: 'back', equipment: 'cable', difficulty: 4 },
    { id: 'seated-row', name: 'Seated Cable Row', muscleGroup: 'back', primary: 'back', equipment: 'cable', difficulty: 4 },
    { id: 'face-pull', name: 'Face Pull', muscleGroup: 'shoulders', primary: 'rear delts', equipment: 'cable', difficulty: 3 },
    { id: 'straight-arm-pulldown', name: 'Straight-Arm Pulldown', muscleGroup: 'back', primary: 'lats', equipment: 'cable', difficulty: 3 },
    { id: 'wide-grip-pulldown', name: 'Wide-Grip Pulldown', muscleGroup: 'back', primary: 'lats', equipment: 'cable', difficulty: 4 },
    { id: 'close-grip-pulldown', name: 'Close-Grip Pulldown', muscleGroup: 'back', primary: 'lats', equipment: 'cable', difficulty: 4 },
    { id: 'single-arm-pulldown', name: 'Single-Arm Lat Pulldown', muscleGroup: 'back', primary: 'lats', equipment: 'cable', difficulty: 3 },
    { id: ' Behind-neck-pulldown', name: 'Behind-Neck Pulldown', muscleGroup: 'back', primary: 'lats', equipment: 'cable', difficulty: 5 },
    { id: 'cable-row', name: 'Cable Row (low attachment)', muscleGroup: 'back', primary: 'back', equipment: 'cable', difficulty: 4 },
    { id: 'rack-pull', name: 'Rack Pull', muscleGroup: 'back', primary: 'back', equipment: 'barbell', difficulty: 7 },
    // Biceps isolation
    { id: 'barbell-curl', name: 'Barbell Curl', muscleGroup: 'biceps', primary: 'biceps', equipment: 'barbell', difficulty: 4 },
    { id: 'dumbbell-curl', name: 'Dumbbell Curl', muscleGroup: 'biceps', primary: 'biceps', equipment: 'dumbbell', difficulty: 3 },
    { id: 'hammer-curl', name: 'Hammer Curl', muscleGroup: 'biceps', primary: 'biceps', equipment: 'dumbbell', difficulty: 3 },
    { id: 'cable-curl', name: 'Cable Curl', muscleGroup: 'biceps', primary: 'biceps', equipment: 'cable', difficulty: 3 },
    { id: 'preacher-curl', name: 'Preacher Curl', muscleGroup: 'biceps', primary: 'biceps', equipment: 'barbell', difficulty: 4 },
    { id: 'spider-curl', name: 'Spider Curl', muscleGroup: 'biceps', primary: 'biceps', equipment: 'barbell', difficulty: 4 },
    { id: 'incline-curl', name: 'Incline Dumbbell Curl', muscleGroup: 'biceps', primary: 'biceps', equipment: 'dumbbell', difficulty: 4 },
    { id: 'concentration-curl', name: 'Concentration Curl', muscleGroup: 'biceps', primary: 'biceps', equipment: 'dumbbell', difficulty: 3 },
    { id: 'ez-bar-curl', name: 'EZ-Bar Curl', muscleGroup: 'biceps', primary: 'biceps', equipment: 'barbell', difficulty: 3 },
    { id: 'reverse-curl', name: 'Reverse Curl', muscleGroup: 'biceps', primary: 'forearms', equipment: 'barbell', difficulty: 4 },
    { id: 'cross-body-curl', name: 'Cross-Body Curl', muscleGroup: 'biceps', primary: 'biceps', equipment: 'dumbbell', difficulty: 3 },
    // Rear delt isolation
    { id: 'rear-delt-fly', name: 'Rear Delt Fly', muscleGroup: 'shoulders', primary: 'rear delts', equipment: 'dumbbell', difficulty: 3 },
    { id: 'reverse-pec-deck', name: 'Reverse Pec Deck', muscleGroup: 'shoulders', primary: 'rear delts', equipment: 'machine', difficulty: 3 },
    { id: 'cable-rear-delt-fly', name: 'Cable Rear Delt Fly', muscleGroup: 'shoulders', primary: 'rear delts', equipment: 'cable', difficulty: 3 },
    { id: 'face-pull-rope', name: 'Face Pull (rope)', muscleGroup: 'shoulders', primary: 'rear delts', equipment: 'cable', difficulty: 3 },
    // Forearms
    { id: 'wrist-curl', name: 'Wrist Curl', muscleGroup: 'forearms', primary: 'forearms', equipment: 'barbell', difficulty: 2 },
    { id: 'reverse-wrist-curl', name: 'Reverse Wrist Curl', muscleGroup: 'forearms', primary: 'forearms', equipment: 'barbell', difficulty: 2 },
    { id: 'farmers-walk', name: 'Farmer\'s Walk', muscleGroup: 'forearms', primary: 'forearms', equipment: 'dumbbell', difficulty: 4 },
  ],
};

export const LEG_EXERCISES = {
  compound: [
    // Quad compounds
    { id: 'squat', name: 'Barbell Back Squat', muscleGroup: 'quads', primary: 'quads', equipment: 'barbell', difficulty: 8 },
    { id: 'front-squat', name: 'Front Squat', muscleGroup: 'quads', primary: 'quads', equipment: 'barbell', difficulty: 8 },
    { id: 'goblet-squat', name: 'Goblet Squat', muscleGroup: 'quads', primary: 'quads', equipment: 'dumbbell', difficulty: 5 },
    { id: 'bulgarian-split-squat', name: 'Bulgarian Split Squat', muscleGroup: 'quads', primary: 'quads', equipment: 'dumbbell', difficulty: 6 },
    { id: 'hack-squat', name: 'Hack Squat', muscleGroup: 'quads', primary: 'quads', equipment: 'machine', difficulty: 6 },
    { id: 'leg-press', name: 'Leg Press', muscleGroup: 'quads', primary: 'quads', equipment: 'machine', difficulty: 5 },
    { id: 'sumo-deadlift', name: 'Sumo Deadlift', muscleGroup: 'quads', primary: 'quads', equipment: 'barbell', difficulty: 8 },
    // Hamstring compounds
    { id: 'romanian-deadlift', name: 'Romanian Deadlift', muscleGroup: 'hamstrings', primary: 'hamstrings', equipment: 'barbell', difficulty: 7 },
    { id: 'stiff-leg-deadlift', name: 'Stiff Leg Deadlift', muscleGroup: 'hamstrings', primary: 'hamstrings', equipment: 'barbell', difficulty: 6 },
    { id: 'good-morning', name: 'Good Morning', muscleGroup: 'hamstrings', primary: 'hamstrings', equipment: 'barbell', difficulty: 6 },
    { id: 'nordic-curl', name: 'Nordic Curl', muscleGroup: 'hamstrings', primary: 'hamstrings', equipment: 'bodyweight', difficulty: 8 },
    // Glute compounds
    { id: 'hip-thrust', name: 'Hip Thrust', muscleGroup: 'glutes', primary: 'glutes', equipment: 'barbell', difficulty: 6 },
    { id: 'glute-ham-raise', name: 'Glute Ham Raise', muscleGroup: 'glutes', primary: 'hamstrings', equipment: 'machine', difficulty: 7 },
    { id: 'cable-pull-through', name: 'Cable Pull Through', muscleGroup: 'glutes', primary: 'glutes', equipment: 'cable', difficulty: 3 },
  ],
  isolation: [
    // Quad isolation
    { id: 'leg-extension', name: 'Leg Extension', muscleGroup: 'quads', primary: 'quads', equipment: 'machine', difficulty: 3 },
    { id: 'sissy-squat', name: 'Sissy Squat', muscleGroup: 'quads', primary: 'quads', equipment: 'bodyweight', difficulty: 5 },
    { id: 'terminal-knee-extension', name: 'Terminal Knee Extension', muscleGroup: 'quads', primary: 'quads', equipment: 'machine', difficulty: 2 },
    // Hamstring isolation
    { id: 'leg-curl', name: 'Lying Leg Curl', muscleGroup: 'hamstrings', primary: 'hamstrings', equipment: 'machine', difficulty: 3 },
    { id: 'seated-leg-curl', name: 'Seated Leg Curl', muscleGroup: 'hamstrings', primary: 'hamstrings', equipment: 'machine', difficulty: 3 },
    { id: 'nordic-curl-hamstring', name: 'Nordic Curl (assisted)', muscleGroup: 'hamstrings', primary: 'hamstrings', equipment: 'bodyweight', difficulty: 6 },
    { id: 'single-leg-curl', name: 'Single-Leg Curl', muscleGroup: 'hamstrings', primary: 'hamstrings', equipment: 'machine', difficulty: 3 },
    // Glute isolation
    { id: 'cable-kickback', name: 'Cable Kickback', muscleGroup: 'glutes', primary: 'glutes', equipment: 'cable', difficulty: 2 },
    { id: 'glute-bridge', name: 'Glute Bridge', muscleGroup: 'glutes', primary: 'glutes', equipment: 'bodyweight', difficulty: 2 },
    { id: 'hip-abduction', name: 'Hip Abduction Machine', muscleGroup: 'glutes', primary: 'glutes', equipment: 'machine', difficulty: 2 },
    { id: 'clamshell', name: 'Clamshell', muscleGroup: 'glutes', primary: 'glutes', equipment: 'bodyweight', difficulty: 2 },
    { id: 'frog-pump', name: 'Frog Pump', muscleGroup: 'glutes', primary: 'glutes', equipment: 'bodyweight', difficulty: 1 },
    { id: 'hip-adduction', name: 'Hip Adduction Machine', muscleGroup: 'glutes', primary: 'adductors', equipment: 'machine', difficulty: 2 },
    { id: 'sumo-squat', name: 'Sumo Squat', muscleGroup: 'glutes', primary: 'glutes', equipment: 'dumbbell', difficulty: 3 },
    // Calf isolation
    { id: 'calf-raise', name: 'Standing Calf Raise', muscleGroup: 'calves', primary: 'calves', equipment: 'machine', difficulty: 2 },
    { id: 'seated-calf-raise', name: 'Seated Calf Raise', muscleGroup: 'calves', primary: 'calves', equipment: 'machine', difficulty: 2 },
    { id: 'single-leg-calf-raise', name: 'Single-Leg Calf Raise', muscleGroup: 'calves', primary: 'calves', equipment: 'bodyweight', difficulty: 2 },
    { id: 'calf-press', name: 'Calf Press on Leg Press', muscleGroup: 'calves', primary: 'calves', equipment: 'machine', difficulty: 2 },
    // Compound leg movements
    { id: 'lunge', name: 'Walking Lunge', muscleGroup: 'quads', primary: 'quads', equipment: 'dumbbell', difficulty: 5 },
    { id: 'reverse-lunge', name: 'Reverse Lunge', muscleGroup: 'quads', primary: 'quads', equipment: 'dumbbell', difficulty: 4 },
    { id: 'step-up', name: 'Step Up', muscleGroup: 'quads', primary: 'quads', equipment: 'dumbbell', difficulty: 4 },
    { id: 'deficit-lunge', name: 'Deficit Lunge', muscleGroup: 'quads', primary: 'quads', equipment: 'dumbbell', difficulty: 6 },
    { id: 'split-squat', name: 'Split Squat', muscleGroup: 'quads', primary: 'quads', equipment: 'bodyweight', difficulty: 5 },
    { id: 'pulse-squat', name: 'Pulse Squat', muscleGroup: 'quads', primary: 'quads', equipment: 'bodyweight', difficulty: 4 },
  ],
};

// Cardio / conditioning exercises (duration-based, no weight needed)
export const CARDIO_EXERCISES = {
  machines: [
    { id: 'treadmill', name: 'Treadmill Running', muscleGroup: 'cardio', primary: 'cardio', equipment: 'machine', difficulty: 5, unit: 'min' },
    { id: 'treadmill-walk', name: 'Treadmill Walking', muscleGroup: 'cardio', primary: 'cardio', equipment: 'machine', difficulty: 3, unit: 'min' },
    { id: 'rowing', name: 'Rowing Machine', muscleGroup: 'cardio', primary: 'cardio', equipment: 'machine', difficulty: 6, unit: 'min' },
    { id: 'cycling', name: 'Stationary Cycling', muscleGroup: 'cardio', primary: 'cardio', equipment: 'machine', difficulty: 4, unit: 'min' },
    { id: 'spin-class', name: 'Spin Bike', muscleGroup: 'cardio', primary: 'cardio', equipment: 'machine', difficulty: 6, unit: 'min' },
    { id: 'elliptical', name: 'Elliptical', muscleGroup: 'cardio', primary: 'cardio', equipment: 'machine', difficulty: 4, unit: 'min' },
    { id: 'stair-climber', name: 'Stair Climber', muscleGroup: 'cardio', primary: 'cardio', equipment: 'machine', difficulty: 6, unit: 'min' },
    { id: 'ski-erg', name: 'Ski Erg', muscleGroup: 'cardio', primary: 'cardio', equipment: 'machine', difficulty: 6, unit: 'min' },
    { id: 'assault-bike', name: 'Assault Bike', muscleGroup: 'cardio', primary: 'cardio', equipment: 'machine', difficulty: 8, unit: 'min' },
    { id: 'sled-push', name: 'Sled Push', muscleGroup: 'cardio', primary: 'cardio', equipment: 'machine', difficulty: 7, unit: 'min' },
    { id: 'sled-pull', name: 'Sled Pull', muscleGroup: 'cardio', primary: 'cardio', equipment: 'machine', difficulty: 7, unit: 'min' },
    { id: 'jacobs-ladder', name: 'Jacob\'s Ladder', muscleGroup: 'cardio', primary: 'cardio', equipment: 'machine', difficulty: 7, unit: 'min' },
    { id: 'versa-climber', name: 'Versa Climber', muscleGroup: 'cardio', primary: 'cardio', equipment: 'machine', difficulty: 8, unit: 'min' },
  ],
  hiit: [
    { id: 'jump-rope', name: 'Jump Rope', muscleGroup: 'cardio', primary: 'cardio', equipment: 'bodyweight', difficulty: 5, unit: 'min' },
    { id: 'burpees', name: 'Burpees', muscleGroup: 'cardio', primary: 'cardio', equipment: 'bodyweight', difficulty: 7, unit: 'min' },
    { id: 'mountain-climbers', name: 'Mountain Climbers', muscleGroup: 'cardio', primary: 'cardio', equipment: 'bodyweight', difficulty: 5, unit: 'min' },
    { id: 'battle-ropes', name: 'Battle Ropes', muscleGroup: 'cardio', primary: 'cardio', equipment: 'bodyweight', difficulty: 6, unit: 'min' },
    { id: 'box-jumps', name: 'Box Jumps', muscleGroup: 'cardio', primary: 'cardio', equipment: 'bodyweight', difficulty: 6, unit: 'min' },
    { id: 'jump-squats', name: 'Jump Squats', muscleGroup: 'cardio', primary: 'cardio', equipment: 'bodyweight', difficulty: 6, unit: 'min' },
    { id: 'jump-lunges', name: 'Jump Lunges', muscleGroup: 'cardio', primary: 'cardio', equipment: 'bodyweight', difficulty: 6, unit: 'min' },
    { id: 'high-knees', name: 'High Knees', muscleGroup: 'cardio', primary: 'cardio', equipment: 'bodyweight', difficulty: 5, unit: 'min' },
    { id: 'butt-kicks', name: 'Butt Kicks', muscleGroup: 'cardio', primary: 'cardio', equipment: 'bodyweight', difficulty: 4, unit: 'min' },
    { id: 'plank-jacks', name: 'Plank Jacks', muscleGroup: 'cardio', primary: 'cardio', equipment: 'bodyweight', difficulty: 5, unit: 'min' },
    { id: 'squat-jumps', name: 'Squat Jumps', muscleGroup: 'cardio', primary: 'cardio', equipment: 'bodyweight', difficulty: 6, unit: 'min' },
    { id: 'broad-jumps', name: 'Broad Jumps', muscleGroup: 'cardio', primary: 'cardio', equipment: 'bodyweight', difficulty: 7, unit: 'min' },
    { id: 'swimming', name: 'Swimming', muscleGroup: 'cardio', primary: 'cardio', equipment: 'other', difficulty: 7, unit: 'min' },
    { id: 'jump-rope-double', name: 'Double-Under Jump Rope', muscleGroup: 'cardio', primary: 'cardio', equipment: 'bodyweight', difficulty: 8, unit: 'min' },
    { id: ' prowler-push', name: 'Prowler Push', muscleGroup: 'cardio', primary: 'cardio', equipment: 'machine', difficulty: 8, unit: 'min' },
  ],
};

// Core / abdominal exercises
export const CORE_EXERCISES = [
  { id: 'plank', name: 'Plank Hold', muscleGroup: 'core', primary: 'core', equipment: 'bodyweight', difficulty: 3, unit: 'sec' },
  { id: 'side-plank', name: 'Side Plank', muscleGroup: 'core', primary: 'core', equipment: 'bodyweight', difficulty: 4, unit: 'sec' },
  { id: 'hanging-leg-raise', name: 'Hanging Leg Raise', muscleGroup: 'core', primary: 'core', equipment: 'bodyweight', difficulty: 5, unit: 'reps' },
  { id: 'hanging-knee-raise', name: 'Hanging Knee Raise', muscleGroup: 'core', primary: 'core', equipment: 'bodyweight', difficulty: 4, unit: 'reps' },
  { id: 'ab-wheel', name: 'Ab Wheel Rollout', muscleGroup: 'core', primary: 'core', equipment: 'bodyweight', difficulty: 6, unit: 'reps' },
  { id: 'cable-crunch', name: 'Cable Crunch', muscleGroup: 'core', primary: 'core', equipment: 'cable', difficulty: 4, unit: 'reps' },
  { id: 'pallof-press', name: 'Pallof Press', muscleGroup: 'core', primary: 'core', equipment: 'cable', difficulty: 3, unit: 'reps' },
  { id: 'russian-twist', name: 'Russian Twist', muscleGroup: 'core', primary: 'core', equipment: 'bodyweight', difficulty: 3, unit: 'reps' },
  { id: 'dead-bug', name: 'Dead Bug', muscleGroup: 'core', primary: 'core', equipment: 'bodyweight', difficulty: 2, unit: 'reps' },
  { id: 'bird-dog', name: 'Bird Dog', muscleGroup: 'core', primary: 'core', equipment: 'bodyweight', difficulty: 2, unit: 'reps' },
  { id: 'bicycle-crunch', name: 'Bicycle Crunch', muscleGroup: 'core', primary: 'core', equipment: 'bodyweight', difficulty: 4, unit: 'reps' },
  { id: 'weighted-crunch', name: 'Weighted Crunch', muscleGroup: 'core', primary: 'core', equipment: 'dumbbell', difficulty: 4, unit: 'reps' },
  { id: 'toes-to-bar', name: 'Toes to Bar', muscleGroup: 'core', primary: 'core', equipment: 'bodyweight', difficulty: 7, unit: 'reps' },
  { id: 'stability-ball-crunch', name: 'Stability Ball Crunch', muscleGroup: 'core', primary: 'core', equipment: 'bodyweight', difficulty: 3, unit: 'reps' },
  { id: 'stability-ball-rollout', name: 'Stability Ball Rollout', muscleGroup: 'core', primary: 'core', equipment: 'bodyweight', difficulty: 5, unit: 'reps' },
  { id: 'dragon-flag', name: 'Dragon Flag', muscleGroup: 'core', primary: 'core', equipment: 'bodyweight', difficulty: 8, unit: 'reps' },
  { id: 'v-up', name: 'V-Up', muscleGroup: 'core', primary: 'core', equipment: 'bodyweight', difficulty: 5, unit: 'reps' },
  { id: 'windshield-wiper', name: 'Windshield Wiper', muscleGroup: 'core', primary: 'core', equipment: 'bodyweight', difficulty: 7, unit: 'reps' },
  { id: 'hollow-body-hold', name: 'Hollow Body Hold', muscleGroup: 'core', primary: 'core', equipment: 'bodyweight', difficulty: 4, unit: 'sec' },
  { id: 'hollow-body-rock', name: 'Hollow Body Rock', muscleGroup: 'core', primary: 'core', equipment: 'bodyweight', difficulty: 4, unit: 'reps' },
  { id: 'ab-rollout-bar', name: 'Ab Rollout Bar', muscleGroup: 'core', primary: 'core', equipment: 'bodyweight', difficulty: 5, unit: 'reps' },
  { id: 'knee-raise', name: 'Knee Raise in Dip Bar', muscleGroup: 'core', primary: 'core', equipment: 'bodyweight', difficulty: 5, unit: 'reps' },
  { id: 'rKC-pallof-press', name: 'Rotational Pallof Press', muscleGroup: 'core', primary: 'core', equipment: 'cable', difficulty: 4, unit: 'reps' },
  { id: 'decline-sit-up', name: 'Decline Sit Up', muscleGroup: 'core', primary: 'core', equipment: 'bodyweight', difficulty: 4, unit: 'reps' },
  { id: 'suitcase-carry', name: 'Suitcase Carry', muscleGroup: 'core', primary: 'core', equipment: 'dumbbell', difficulty: 5, unit: 'steps' },
  { id: 'farmers-walk', name: 'Farmer\'s Walk', muscleGroup: 'core', primary: 'core', equipment: 'dumbbell', difficulty: 4, unit: 'steps' },
  { id: 'side-bridge', name: 'Side Bridge', muscleGroup: 'core', primary: 'core', equipment: 'bodyweight', difficulty: 3, unit: 'sec' },
  { id: 'lawnmower', name: 'Lawnmower (cable rotation)', muscleGroup: 'core', primary: 'core', equipment: 'cable', difficulty: 4, unit: 'reps' },
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

// ─── Cardio Finisher (appended to every workout day) ─────────────────────────

export function buildCardioFinisher(user) {
  const { goal, experience = 'intermediate' } = user;

  const baseMinutes = {
    strength: 20,
    hypertrophy: 25,
    endurance: 35,
    'weight-loss': 40,
  }[goal] || 25;

  const maxDiff = { beginner: 5, intermediate: 7, advanced: 10 }[experience] || 6;
  const machines = CARDIO_EXERCISES.machines.filter(e => e.difficulty <= maxDiff);
  const hiit = CARDIO_EXERCISES.hiit.filter(e => e.difficulty <= maxDiff);

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
          { exerciseId: 'bench-press', sets: 4, reps: 6, restSeconds: 180 },
          { exerciseId: 'overhead-press', sets: 4, reps: 8, restSeconds: 120 },
          { exerciseId: 'incline-bench', sets: 3, reps: 8, restSeconds: 90 },
          { exerciseId: 'dip', sets: 3, reps: 8, restSeconds: 90 },
          { exerciseId: 'lateral-raise', sets: 3, reps: 15, restSeconds: 45 },
          { exerciseId: 'cable-crossover', sets: 3, reps: 12, restSeconds: 45 },
          { exerciseId: 'overhead-extension', sets: 3, reps: 12, restSeconds: 45 },
        ],
      },
      {
        label: 'Pull',
        muscleGroups: 'back, biceps, rear delts',
        exercises: [
          { exerciseId: 'deadlift', sets: 4, reps: 5, restSeconds: 180 },
          { exerciseId: 'pull-up', sets: 4, reps: 8, restSeconds: 120 },
          { exerciseId: 'barbell-row', sets: 4, reps: 8, restSeconds: 90 },
          { exerciseId: 'seated-row', sets: 3, reps: 10, restSeconds: 60 },
          { exerciseId: 'lat-pulldown', sets: 3, reps: 12, restSeconds: 60 },
          { exerciseId: 'face-pull', sets: 3, reps: 15, restSeconds: 45 },
          { exerciseId: 'rear-delt-fly', sets: 3, reps: 15, restSeconds: 45 },
          { exerciseId: 'barbell-curl', sets: 3, reps: 10, restSeconds: 60 },
        ],
      },
      {
        label: 'Legs',
        muscleGroups: 'quads, hamstrings, glutes, calves',
        exercises: [
          { exerciseId: 'squat', sets: 4, reps: 6, restSeconds: 180 },
          { exerciseId: 'romanian-deadlift', sets: 4, reps: 8, restSeconds: 120 },
          { exerciseId: 'hip-thrust', sets: 3, reps: 10, restSeconds: 90 },
          { exerciseId: 'leg-press', sets: 3, reps: 12, restSeconds: 90 },
          { exerciseId: 'leg-curl', sets: 3, reps: 12, restSeconds: 60 },
          { exerciseId: 'leg-extension', sets: 3, reps: 12, restSeconds: 60 },
          { exerciseId: 'seated-calf-raise', sets: 3, reps: 15, restSeconds: 45 },
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
        label: 'Upper A',
        muscleGroups: 'chest, back, shoulders, arms',
        exercises: [
          { exerciseId: 'bench-press', sets: 4, reps: 6, restSeconds: 150 },
          { exerciseId: 'barbell-row', sets: 4, reps: 8, restSeconds: 120 },
          { exerciseId: 'pull-up', sets: 3, reps: 8, restSeconds: 120 },
          { exerciseId: 'overhead-press', sets: 3, reps: 10, restSeconds: 90 },
          { exerciseId: 'seated-row', sets: 3, reps: 10, restSeconds: 60 },
          { exerciseId: 'lateral-raise', sets: 3, reps: 15, restSeconds: 45 },
          { exerciseId: 'tricep-pushdown', sets: 3, reps: 12, restSeconds: 45 },
          { exerciseId: 'barbell-curl', sets: 3, reps: 12, restSeconds: 45 },
        ],
      },
      {
        label: 'Lower A',
        muscleGroups: 'quads, hamstrings, glutes',
        exercises: [
          { exerciseId: 'squat', sets: 4, reps: 6, restSeconds: 180 },
          { exerciseId: 'romanian-deadlift', sets: 4, reps: 8, restSeconds: 120 },
          { exerciseId: 'leg-press', sets: 3, reps: 12, restSeconds: 90 },
          { exerciseId: 'leg-extension', sets: 3, reps: 12, restSeconds: 60 },
          { exerciseId: 'leg-curl', sets: 3, reps: 12, restSeconds: 60 },
          { exerciseId: 'hip-thrust', sets: 3, reps: 10, restSeconds: 90 },
          { exerciseId: 'calf-raise', sets: 3, reps: 15, restSeconds: 45 },
        ],
      },
      {
        label: 'Upper B',
        muscleGroups: 'chest, back, shoulders, arms',
        exercises: [
          { exerciseId: 'incline-bench', sets: 4, reps: 8, restSeconds: 120 },
          { exerciseId: 'lat-pulldown', sets: 4, reps: 10, restSeconds: 90 },
          { exerciseId: 'overhead-press', sets: 3, reps: 10, restSeconds: 90 },
          { exerciseId: 'face-pull', sets: 3, reps: 15, restSeconds: 45 },
          { exerciseId: 'lateral-raise', sets: 3, reps: 15, restSeconds: 45 },
          { exerciseId: 'cable-crossover', sets: 3, reps: 12, restSeconds: 45 },
          { exerciseId: 'hammer-curl', sets: 3, reps: 12, restSeconds: 45 },
          { exerciseId: 'overhead-extension', sets: 3, reps: 12, restSeconds: 45 },
        ],
      },
      {
        label: 'Lower B',
        muscleGroups: 'quads, hamstrings, glutes, calves',
        exercises: [
          { exerciseId: 'hip-thrust', sets: 4, reps: 8, restSeconds: 120 },
          { exerciseId: 'stiff-leg-deadlift', sets: 4, reps: 8, restSeconds: 120 },
          { exerciseId: 'lunge', sets: 3, reps: 12, restSeconds: 60 },
          { exerciseId: 'leg-curl', sets: 3, reps: 12, restSeconds: 60 },
          { exerciseId: 'leg-extension', sets: 3, reps: 12, restSeconds: 60 },
          { exerciseId: 'seated-calf-raise', sets: 4, reps: 15, restSeconds: 45 },
          { exerciseId: 'cable-kickback', sets: 3, reps: 15, restSeconds: 45 },
        ],
      },
    ],
  },
  {
    id: 'bro-split',
    name: 'Chest / Back / Shoulders & Arms / Legs',
    isDefault: true,
    dayTypes: [
      {
        label: 'Chest',
        muscleGroups: 'chest, triceps',
        exercises: [
          { exerciseId: 'bench-press', sets: 4, reps: 6, restSeconds: 150 },
          { exerciseId: 'incline-bench', sets: 4, reps: 8, restSeconds: 120 },
          { exerciseId: 'dip', sets: 3, reps: 10, restSeconds: 90 },
          { exerciseId: 'cable-crossover', sets: 3, reps: 15, restSeconds: 60 },
          { exerciseId: 'push-up', sets: 3, reps: 20, restSeconds: 60 },
          { exerciseId: 'overhead-extension', sets: 3, reps: 12, restSeconds: 45 },
        ],
      },
      {
        label: 'Back',
        muscleGroups: 'back, biceps, rear delts',
        exercises: [
          { exerciseId: 'deadlift', sets: 4, reps: 5, restSeconds: 180 },
          { exerciseId: 'pull-up', sets: 4, reps: 8, restSeconds: 120 },
          { exerciseId: 'barbell-row', sets: 4, reps: 8, restSeconds: 90 },
          { exerciseId: 'seated-row', sets: 3, reps: 10, restSeconds: 60 },
          { exerciseId: 'lat-pulldown', sets: 3, reps: 12, restSeconds: 60 },
          { exerciseId: 'face-pull', sets: 3, reps: 15, restSeconds: 45 },
          { exerciseId: 'rear-delt-fly', sets: 3, reps: 15, restSeconds: 45 },
          { exerciseId: 'dumbbell-curl', sets: 3, reps: 12, restSeconds: 45 },
        ],
      },
      {
        label: 'Shoulders & Arms',
        muscleGroups: 'shoulders, biceps, triceps',
        exercises: [
          { exerciseId: 'overhead-press', sets: 4, reps: 8, restSeconds: 120 },
          { exerciseId: 'lateral-raise', sets: 4, reps: 15, restSeconds: 45 },
          { exerciseId: 'front-raise', sets: 3, reps: 12, restSeconds: 45 },
          { exerciseId: 'barbell-curl', sets: 3, reps: 10, restSeconds: 60 },
          { exerciseId: 'hammer-curl', sets: 3, reps: 12, restSeconds: 60 },
          { exerciseId: 'tricep-pushdown', sets: 3, reps: 12, restSeconds: 45 },
          { exerciseId: 'cable-crunch', sets: 3, reps: 15, restSeconds: 45 },
        ],
      },
      {
        label: 'Legs',
        muscleGroups: 'quads, hamstrings, glutes, calves',
        exercises: [
          { exerciseId: 'squat', sets: 4, reps: 6, restSeconds: 180 },
          { exerciseId: 'romanian-deadlift', sets: 4, reps: 8, restSeconds: 120 },
          { exerciseId: 'hip-thrust', sets: 3, reps: 10, restSeconds: 90 },
          { exerciseId: 'leg-press', sets: 3, reps: 12, restSeconds: 90 },
          { exerciseId: 'leg-extension', sets: 3, reps: 12, restSeconds: 60 },
          { exerciseId: 'leg-curl', sets: 3, reps: 12, restSeconds: 60 },
          { exerciseId: 'seated-calf-raise', sets: 4, reps: 15, restSeconds: 45 },
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
  for (const ex of [...CARDIO_EXERCISES.machines, ...CARDIO_EXERCISES.hiit]) {
    exerciseMap[ex.id] = ex;
    exerciseNameMap[ex.name.toLowerCase()] = ex;
  }
  for (const ex of CORE_EXERCISES) {
    exerciseMap[ex.id] = ex;
    exerciseNameMap[ex.name.toLowerCase()] = ex;
  }

  const maxDifficulty = { beginner: 6, intermediate: 8, advanced: 10 }[experience] || 7;
  const intensityFactor = 1 - (intensity - 1) * 0.04;

  const exercises = [];
  for (const tplEx of templateDay.exercises || []) {
    let ex = exerciseMap[tplEx.exerciseId];
    if (!ex && tplEx.name) {
      ex = exerciseNameMap[tplEx.name.toLowerCase()];
    }
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
      unit: ex.unit || tplEx.unit || 'reps',
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
