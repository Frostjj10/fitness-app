import { useState, useEffect, useMemo } from 'react';
import { getExercisePickerData, PUSH_EXERCISES, PULL_EXERCISES, LEG_EXERCISES, CARDIO_EXERCISES, CORE_EXERCISES } from '../utils/ppl';

const ALL_CATEGORIES = [
  { value: 'all', label: 'All Exercises' },
  { value: 'push', label: 'Push Exercises' },
  { value: 'pull', label: 'Pull Exercises' },
  { value: 'legs', label: 'Leg Exercises' },
  { value: 'upper', label: 'Upper Body' },
  { value: 'lower', label: 'Lower Body' },
  { value: 'chest', label: 'Chest' },
  { value: 'back', label: 'Back' },
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'arms', label: 'Biceps & Triceps' },
  { value: 'core', label: 'Core' },
  { value: 'cardio', label: 'Cardio' },
];

// Equipment filter options
const EQUIPMENT_OPTIONS = [
  { value: 'all', label: 'All Equipment' },
  { value: 'barbell', label: 'Barbell' },
  { value: 'dumbbell', label: 'Dumbbell' },
  { value: 'cable', label: 'Cable' },
  { value: 'machine', label: 'Machine' },
  { value: 'bodyweight', label: 'Bodyweight' },
];

function getExercisesByCategory(category, equipment) {
  const data = getExercisePickerData();
  let results = [];

  switch (category) {
    case 'push':
      results = [
        ...PUSH_EXERCISES.compound,
        ...PUSH_EXERCISES.isolation,
      ];
      break;
    case 'pull':
      results = [
        ...PULL_EXERCISES.compound,
        ...PULL_EXERCISES.isolation,
      ];
      break;
    case 'legs':
      results = [
        ...LEG_EXERCISES.compound,
        ...LEG_EXERCISES.isolation,
      ];
      break;
    case 'upper':
      results = [
        ...PUSH_EXERCISES.compound.filter(e => ['chest', 'shoulders'].includes(e.muscleGroup)),
        ...PUSH_EXERCISES.isolation.filter(e => ['chest', 'shoulders', 'triceps'].includes(e.muscleGroup)),
        ...PULL_EXERCISES.compound.filter(e => e.muscleGroup === 'back'),
        ...PULL_EXERCISES.isolation.filter(e => ['back', 'biceps'].includes(e.muscleGroup)),
      ];
      break;
    case 'lower':
      results = [
        ...LEG_EXERCISES.compound,
        ...LEG_EXERCISES.isolation,
      ];
      break;
    case 'chest':
      results = [
        ...PUSH_EXERCISES.compound.filter(e => e.muscleGroup === 'chest'),
        ...PUSH_EXERCISES.isolation.filter(e => e.muscleGroup === 'chest'),
      ];
      break;
    case 'back':
      results = [
        ...PULL_EXERCISES.compound.filter(e => e.muscleGroup === 'back'),
        ...PULL_EXERCISES.isolation.filter(e => e.muscleGroup === 'back'),
      ];
      break;
    case 'shoulders':
      results = [
        ...PUSH_EXERCISES.compound.filter(e => e.muscleGroup === 'shoulders'),
        ...PUSH_EXERCISES.isolation.filter(e => e.muscleGroup === 'shoulders' || e.primary === 'shoulders'),
        ...PULL_EXERCISES.isolation.filter(e => e.primary === 'rear delts'),
      ];
      break;
    case 'arms':
      results = [
        ...PUSH_EXERCISES.isolation.filter(e => e.muscleGroup === 'triceps'),
        ...PULL_EXERCISES.isolation.filter(e => ['biceps', 'forearms'].includes(e.muscleGroup)),
      ];
      break;
    case 'core':
      results = [...CORE_EXERCISES];
      break;
    case 'cardio':
      results = [
        ...CARDIO_EXERCISES.machines,
        ...CARDIO_EXERCISES.hiit,
      ];
      break;
    case 'all':
    default:
      results = data.all || [];
      break;
  }

  // Apply equipment filter
  if (equipment && equipment !== 'all') {
    results = results.filter(ex => ex.equipment === equipment);
  }

  return results;
}

export default function ExercisePicker({ isOpen, onClose, onSelect, currentExerciseIds = [], pplType = 'push', unit = 'lbs' }) {
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' | 'browse'
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedEquipment, setSelectedEquipment] = useState('all');
  const [selectedEx, setSelectedEx] = useState(null);
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState(0);
  const [rest, setRest] = useState(90);

  useEffect(() => {
    if (!isOpen) return;
    // Reset state when opening
    setSearch('');
    setSelectedCategory('all');
    setSelectedEquipment('all');
    setSelectedEx(null);
  }, [isOpen]);

  function reset() {
    setSearch('');
    setSelectedEx(null);
    setSets(3);
    setReps(10);
    setWeight(0);
    setRest(90);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSelect(ex) {
    const isCardio = ex.unit === 'min';
    onSelect({
      exerciseId: ex.id,
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      primaryMuscle: ex.primary,
      equipment: ex.equipment,
      sets: isCardio ? 1 : sets,
      reps: isCardio ? reps : reps,
      targetWeight: isCardio ? 0 : (weight || estimateWeight(ex)),
      restSeconds: isCardio ? 0 : rest,
      isCompound: ex.difficulty >= 6,
      unit: ex.unit || 'reps',
    });
    reset();
    onClose();
  }

  function estimateWeight(ex) {
    const bw = 165;
    return Math.round((ex.difficulty / 10) * 0.85 * bw / 5) * 5;
  }

  if (!isOpen) return null;

  const alreadyAdded = new Set(currentExerciseIds);

  // Get exercises based on selected category and equipment
  const browsedExercises = useMemo(() => {
    return getExercisesByCategory(selectedCategory, selectedEquipment);
  }, [selectedCategory, selectedEquipment]);

  // Filter by search if searching
  const filteredExercises = search.trim()
    ? browsedExercises.filter(ex =>
        ex.name.toLowerCase().includes(search.toLowerCase()) ||
        ex.muscleGroup.toLowerCase().includes(search.toLowerCase()) ||
        ex.equipment.toLowerCase().includes(search.toLowerCase())
      )
    : browsedExercises;

  // Grouped view data
  const groupedData = {
    Push: { compound: PUSH_EXERCISES.compound, isolation: PUSH_EXERCISES.isolation },
    Pull: { compound: PULL_EXERCISES.compound, isolation: PULL_EXERCISES.isolation },
    Legs: { compound: LEG_EXERCISES.compound, isolation: LEG_EXERCISES.isolation },
    Cardio: { machines: CARDIO_EXERCISES.machines, hiit: CARDIO_EXERCISES.hiit },
    Core: { flat: CORE_EXERCISES },
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Add Exercise</h2>
            <p className="text-sm text-slate-500">Select an exercise to add to this workout</p>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        {/* Category dropdown + equipment filter + view toggle */}
        <div className="px-6 py-3 border-b space-y-2">
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={e => { setSelectedCategory(e.target.value); setSearch(''); }}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white"
            >
              {ALL_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            <select
              value={selectedEquipment}
              onChange={e => setSelectedEquipment(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white"
            >
              {EQUIPMENT_OPTIONS.map(eq => (
                <option key={eq.value} value={eq.value}>{eq.label}</option>
              ))}
            </select>
            <div className="flex rounded-lg border overflow-hidden shrink-0">
              <button
                onClick={() => setViewMode('browse')}
                className={`px-3 py-2 text-sm ${viewMode === 'browse' ? 'bg-orange-500 text-white' : 'bg-gray-50 hover:bg-gray-100 text-slate-600'}`}
              >
                Browse
              </button>
              <button
                onClick={() => setViewMode('grouped')}
                className={`px-3 py-2 text-sm ${viewMode === 'grouped' ? 'bg-orange-500 text-white' : 'bg-gray-50 hover:bg-gray-100 text-slate-600'}`}
              >
                Grouped
              </button>
            </div>
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, muscle, or equipment..."
            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
          />
        </div>

        {/* Exercise list */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {viewMode === 'browse' ? (
            <div>
              {filteredExercises.length === 0 ? (
                <div className="text-center text-slate-400 py-12">No exercises found</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredExercises.map(ex => renderExerciseRow(ex))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedData).map(([label, groups]) => (
                <div key={label}>
                  {label === 'Cardio' ? (
                    <>
                      <h3 className="font-bold text-sm uppercase tracking-wider text-orange-600 mb-2">{label}</h3>
                      <div className="space-y-3">
                        {groups.machines?.length > 0 && (
                          <div>
                            <h4 className="text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Machines</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {groups.machines.map(ex => renderExerciseRow(ex))}
                            </div>
                          </div>
                        )}
                        {groups.hiit?.length > 0 && (
                          <div>
                            <h4 className="text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">HIIT / Bodyweight</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {groups.hiit.map(ex => renderExerciseRow(ex))}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : label === 'Core' ? (
                    <>
                      <h3 className="font-bold text-sm uppercase tracking-wider text-green-600 mb-2">{label}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {groups.flat.map(ex => renderExerciseRow(ex))}
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="font-bold text-sm uppercase tracking-wider text-slate-700 mb-2">{label}</h3>
                      <div className="space-y-3">
                        {groups.compound?.length > 0 && (
                          <div>
                            <h4 className="text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Compound</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {groups.compound.map(ex => renderExerciseRow(ex))}
                            </div>
                          </div>
                        )}
                        {groups.isolation?.length > 0 && (
                          <div>
                            <h4 className="text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Isolation</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {groups.isolation.map(ex => renderExerciseRow(ex))}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected exercise config */}
        {selectedEx && (
          <div className="px-6 py-4 border-t bg-slate-50">
            <h4 className="font-semibold text-sm text-slate-900 mb-3">Configure: {selectedEx.name}</h4>
            <div className="grid grid-cols-5 gap-2 text-sm">
              {selectedEx?.unit === 'min' ? (
                // Cardio: show duration
                <div className="col-span-4">
                  <label className="text-xs text-slate-500 font-medium">Duration (min)</label>
                  <input
                    type="number"
                    value={reps}
                    onChange={e => setReps(parseInt(e.target.value) || 0)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    min="1"
                  />
                </div>
              ) : (
                // Strength: show sets, reps, weight, rest
                <>
                  <div>
                    <label className="text-xs text-slate-500 font-medium">Sets</label>
                    <input
                      type="number"
                      value={sets}
                      onChange={e => setSets(parseInt(e.target.value) || 0)}
                      className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 font-medium">Reps</label>
                    <input
                      type="number"
                      value={reps}
                      onChange={e => setReps(parseInt(e.target.value) || 0)}
                      className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 font-medium">Weight ({unit})</label>
                    <input
                      type="number"
                      value={weight}
                      onChange={e => setWeight(parseFloat(e.target.value) || 0)}
                      className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 font-medium">Rest (s)</label>
                    <input
                      type="number"
                      value={rest}
                      onChange={e => setRest(parseInt(e.target.value) || 0)}
                      className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                      min="0"
                    />
                  </div>
                </>
              )}
              <div className="flex items-end">
                <button
                  onClick={() => handleSelect(selectedEx)}
                  className="w-full py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 text-sm font-semibold shadow-sm"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  function renderExerciseRow(ex) {
    const disabled = alreadyAdded.has(ex.id);
    const isCardio = ex.unit === 'min';
    return (
      <button
        key={ex.id}
        disabled={disabled}
        onClick={() => {
          setSelectedEx(ex);
          if (isCardio) {
            setSets(1);
            setReps(20);
            setWeight(0);
            setRest(0);
          } else {
            setSets(3);
            setReps(10);
            setWeight(estimateWeight(ex));
            setRest(60);
          }
        }}
        className={`text-left px-3 py-2.5 rounded-lg border transition-all text-sm ${
          disabled
            ? 'bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed'
            : selectedEx?.id === ex.id
            ? 'bg-orange-50 border-orange-400 shadow-sm'
            : 'hover:bg-slate-50 border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="font-semibold text-slate-900">{ex.name}</div>
        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className={isCardio ? 'text-orange-500' : ''}>{ex.muscleGroup}</span>
          <span className="text-slate-300">·</span>
          <span>{ex.equipment}</span>
          <span className="text-slate-300">·</span>
          <span className={ex.difficulty >= 6 ? 'text-slate-700 font-medium' : ''}>{ex.difficulty >= 6 ? 'Compound' : 'Isolation'}</span>
        </div>
      </button>
    );
  }
}
