import { useState, useEffect, useMemo, useCallback } from 'react';
import { PUSH_EXERCISES, PULL_EXERCISES, LEG_EXERCISES, CARDIO_EXERCISES, CORE_EXERCISES } from '../utils/ppl';

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

const EQUIPMENT_OPTIONS = [
  { value: 'all', label: 'All Equipment' },
  { value: 'barbell', label: 'Barbell' },
  { value: 'dumbbell', label: 'Dumbbell' },
  { value: 'cable', label: 'Cable' },
  { value: 'machine', label: 'Machine' },
  { value: 'bodyweight', label: 'Bodyweight' },
];

function filterExercises(category, equipment) {
  let results = [];

  switch (category) {
    case 'push':
      results = [...PUSH_EXERCISES.compound, ...PUSH_EXERCISES.isolation];
      break;
    case 'pull':
      results = [...PULL_EXERCISES.compound, ...PULL_EXERCISES.isolation];
      break;
    case 'legs':
      results = [...LEG_EXERCISES.compound, ...LEG_EXERCISES.isolation];
      break;
    case 'upper':
      results = [
        ...PUSH_EXERCISES.compound.filter(e => e.muscleGroup === 'chest' || e.muscleGroup === 'shoulders'),
        ...PUSH_EXERCISES.isolation.filter(e => ['chest', 'shoulders', 'triceps'].includes(e.muscleGroup)),
        ...PULL_EXERCISES.compound.filter(e => e.muscleGroup === 'back'),
        ...PULL_EXERCISES.isolation.filter(e => ['back', 'biceps'].includes(e.muscleGroup)),
      ];
      break;
    case 'lower':
      results = [...LEG_EXERCISES.compound, ...LEG_EXERCISES.isolation];
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
        ...PUSH_EXERCISES.isolation.filter(e => e.muscleGroup === 'shoulders'),
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
      results = [...CARDIO_EXERCISES.machines, ...CARDIO_EXERCISES.hiit];
      break;
    default:
      results = [
        ...PUSH_EXERCISES.compound, ...PUSH_EXERCISES.isolation,
        ...PULL_EXERCISES.compound, ...PULL_EXERCISES.isolation,
        ...LEG_EXERCISES.compound, ...LEG_EXERCISES.isolation,
        ...CORE_EXERCISES,
        ...CARDIO_EXERCISES.machines, ...CARDIO_EXERCISES.hiit,
      ];
      break;
  }

  if (equipment && equipment !== 'all') {
    results = results.filter(ex => ex.equipment === equipment);
  }

  return results;
}

export default function ExercisePicker({ isOpen, onClose, onSelect, currentExerciseIds = [], unit = 'lbs' }) {
  const [viewMode, setViewMode] = useState('grouped');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedEquipment, setSelectedEquipment] = useState('all');
  const [selectedEx, setSelectedEx] = useState(null);
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState(0);
  const [rest, setRest] = useState(90);

  // Reset state when picker opens
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedCategory('all');
      setSelectedEquipment('all');
      setSelectedEx(null);
      setSets(3);
      setReps(10);
      setWeight(0);
      setRest(90);
      setViewMode('grouped');
    }
  }, [isOpen]);

  const browsedExercises = useMemo(
    () => filterExercises(selectedCategory, selectedEquipment),
    [selectedCategory, selectedEquipment]
  );

  const filteredExercises = useMemo(() => {
    if (!search.trim()) return browsedExercises;
    const q = search.toLowerCase();
    return browsedExercises.filter(ex =>
      ex.name.toLowerCase().includes(q) ||
      ex.muscleGroup.toLowerCase().includes(q) ||
      ex.equipment.toLowerCase().includes(q)
    );
  }, [browsedExercises, search]);

  const handleClose = useCallback(() => {
    setSearch('');
    setSelectedEx(null);
    onClose();
  }, [onClose]);

  const handleSelect = useCallback((ex) => {
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
    handleClose();
  }, [sets, reps, weight, rest, onSelect, handleClose]);

  function estimateWeight(ex) {
    return Math.round((ex.difficulty / 10) * 0.85 * 165 / 5) * 5;
  }

  if (!isOpen) return null;

  const alreadyAdded = new Set(currentExerciseIds);

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

        {/* Controls */}
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
            <BrowseView
              exercises={filteredExercises}
              selectedEx={selectedEx}
              alreadyAdded={alreadyAdded}
              onSelect={handleSelect}
              onConfigure={(ex) => {
                setSelectedEx(ex);
                if (ex.unit === 'min') {
                  setSets(1); setReps(20); setWeight(0); setRest(0);
                } else {
                  setSets(3); setReps(10); setWeight(estimateWeight(ex)); setRest(60);
                }
              }}
            />
          ) : (
            <GroupedView
              selectedEx={selectedEx}
              alreadyAdded={alreadyAdded}
              onConfigure={(ex) => {
                setSelectedEx(ex);
                if (ex.unit === 'min') {
                  setSets(1); setReps(20); setWeight(0); setRest(0);
                } else {
                  setSets(3); setReps(10); setWeight(estimateWeight(ex)); setRest(60);
                }
              }}
            />
          )}
        </div>

        {/* Config panel */}
        {selectedEx && (
          <ConfigPanel
            ex={selectedEx}
            sets={sets} setSets={setSets}
            reps={reps} setReps={setReps}
            weight={weight} setWeight={setWeight}
            rest={rest} setRest={setRest}
            unit={unit}
            onAdd={handleSelect}
          />
        )}
      </div>
    </div>
  );
}

function BrowseView({ exercises, selectedEx, alreadyAdded, onSelect, onConfigure }) {
  if (exercises.length === 0) {
    return <div className="text-center text-slate-400 py-12">No exercises found</div>;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {exercises.map(ex => (
        <ExerciseRow
          key={ex.id}
          ex={ex}
          isSelected={selectedEx?.id === ex.id}
          isDisabled={alreadyAdded.has(ex.id)}
          onConfigure={() => onConfigure(ex)}
        />
      ))}
    </div>
  );
}

function GroupedView({ selectedEx, alreadyAdded, onConfigure }) {
  const groups = [
    { label: 'Push', color: 'text-blue-600', items: [...PUSH_EXERCISES.compound, ...PUSH_EXERCISES.isolation], isCompound: true },
    { label: 'Pull', color: 'text-green-600', items: [...PULL_EXERCISES.compound, ...PULL_EXERCISES.isolation], isCompound: true },
    { label: 'Legs', color: 'text-purple-600', items: [...LEG_EXERCISES.compound, ...LEG_EXERCISES.isolation], isCompound: true },
    { label: 'Cardio', color: 'text-orange-600', items: [...CARDIO_EXERCISES.machines, ...CARDIO_EXERCISES.hiit], isCardio: true },
    { label: 'Core', color: 'text-teal-600', items: [...CORE_EXERCISES], isCore: true },
  ];

  return (
    <div className="space-y-6">
      {groups.map(group => (
        <div key={group.label}>
          <h3 className={`font-bold text-sm uppercase tracking-wider ${group.color} mb-2`}>{group.label}</h3>
          {group.label === 'Cardio' ? (
            <div className="space-y-3">
              {['Machines', 'HIIT / Bodyweight'].map(sub => {
                const subItems = sub === 'Machines' ? group.items.filter(e => e.equipment === 'machine') : group.items.filter(e => e.equipment !== 'machine');
                if (!subItems.length) return null;
                return (
                  <div key={sub}>
                    <h4 className="text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">{sub}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {subItems.map(ex => (
                        <ExerciseRow
                          key={ex.id}
                          ex={ex}
                          isSelected={selectedEx?.id === ex.id}
                          isDisabled={alreadyAdded.has(ex.id)}
                          onConfigure={() => onConfigure(ex)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {group.isCompound && (
                <>
                  <div>
                    <h4 className="text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Compound</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {group.items.filter(e => e.difficulty >= 6).map(ex => (
                        <ExerciseRow
                          key={ex.id}
                          ex={ex}
                          isSelected={selectedEx?.id === ex.id}
                          isDisabled={alreadyAdded.has(ex.id)}
                          onConfigure={() => onConfigure(ex)}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Isolation</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {group.items.filter(e => e.difficulty < 6).map(ex => (
                        <ExerciseRow
                          key={ex.id}
                          ex={ex}
                          isSelected={selectedEx?.id === ex.id}
                          isDisabled={alreadyAdded.has(ex.id)}
                          onConfigure={() => onConfigure(ex)}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
              {group.isCore && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {group.items.map(ex => (
                    <ExerciseRow
                      key={ex.id}
                      ex={ex}
                      isSelected={selectedEx?.id === ex.id}
                      isDisabled={alreadyAdded.has(ex.id)}
                      onConfigure={() => onConfigure(ex)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ExerciseRow({ ex, isSelected, isDisabled, onConfigure }) {
  const isCardio = ex.unit === 'min';
  return (
    <button
      disabled={isDisabled}
      onClick={onConfigure}
      className={`text-left px-3 py-2.5 rounded-lg border transition-all text-sm w-full ${
        isDisabled
          ? 'bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed'
          : isSelected
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
        <span className={ex.difficulty >= 6 ? 'text-slate-700 font-medium' : ''}>
          {ex.difficulty >= 6 ? 'Compound' : 'Isolation'}
        </span>
      </div>
    </button>
  );
}

function ConfigPanel({ ex, sets, setSets, reps, setReps, weight, setWeight, rest, setRest, unit, onAdd }) {
  const isCardio = ex.unit === 'min';

  return (
    <div className="px-6 py-4 border-t bg-slate-50">
      <h4 className="font-semibold text-sm text-slate-900 mb-3">Configure: {ex.name}</h4>
      <div className="grid grid-cols-5 gap-2 text-sm">
        {isCardio ? (
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
          <>
            <div>
              <label className="text-xs text-slate-500 font-medium">Sets</label>
              <input type="number" value={sets} onChange={e => setSets(parseInt(e.target.value) || 0)} className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-orange-500 outline-none" min="1" />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium">Reps</label>
              <input type="number" value={reps} onChange={e => setReps(parseInt(e.target.value) || 0)} className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-orange-500 outline-none" min="1" />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium">Weight ({unit})</label>
              <input type="number" value={weight} onChange={e => setWeight(parseFloat(e.target.value) || 0)} className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-orange-500 outline-none" min="0" />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium">Rest (s)</label>
              <input type="number" value={rest} onChange={e => setRest(parseInt(e.target.value) || 0)} className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-orange-500 outline-none" min="0" />
            </div>
          </>
        )}
        <div className="flex items-end">
          <button
            onClick={() => onAdd(ex)}
            className="w-full py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 text-sm font-semibold shadow-sm"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
