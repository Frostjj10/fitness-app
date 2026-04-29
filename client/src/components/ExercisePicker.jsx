import { useState, useEffect, useMemo, useCallback } from 'react';
import { PUSH_EXERCISES, PULL_EXERCISES, LEG_EXERCISES, CARDIO_EXERCISES, CORE_EXERCISES } from '../utils/ppl';

const ALL_CATEGORIES = [
  { value: 'all', label: 'All Exercises' },
  { value: 'push', label: 'Push' },
  { value: 'pull', label: 'Pull' },
  { value: 'legs', label: 'Legs' },
  { value: 'upper', label: 'Upper Body' },
  { value: 'lower', label: 'Lower Body' },
  { value: 'chest', label: 'Chest' },
  { value: 'back', label: 'Back' },
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'arms', label: 'Arms' },
  { value: 'core', label: 'Core' },
  { value: 'cardio', label: 'Cardio' },
];

const EQUIPMENT_OPTIONS = [
  { value: 'all', label: 'All' },
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
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: 'rgba(8,8,12,0.9)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}
        >
          <div>
            <h2
              className="text-xl font-extrabold text-white tracking-tight"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              Add Exercise
            </h2>
            <p
              className="text-sm font-medium mt-0.5"
              style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.03em' }}
            >
              Select an exercise to add to this workout
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-3xl leading-none transition-colors font-light"
            style={{ color: 'var(--text-dim)' }}
          >
            ×
          </button>
        </div>

        {/* Controls */}
        <div
          className="px-6 py-3 space-y-2"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}
        >
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={e => { setSelectedCategory(e.target.value); setSearch(''); }}
              className="input flex-1"
              style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
            >
              {ALL_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            <select
              value={selectedEquipment}
              onChange={e => setSelectedEquipment(e.target.value)}
              className="input w-32"
              style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
            >
              {EQUIPMENT_OPTIONS.map(eq => (
                <option key={eq.value} value={eq.value}>{eq.label}</option>
              ))}
            </select>
            <div
              className="flex shrink-0"
              style={{ border: '1px solid var(--border)' }}
            >
              <button
                onClick={() => setViewMode('browse')}
                className="px-3 py-2 text-sm font-bold transition-all"
                style={{
                  fontFamily: 'Barlow Condensed, sans-serif',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  background: viewMode === 'browse' ? 'var(--accent)' : 'var(--surface-2)',
                  color: viewMode === 'browse' ? '#000' : 'var(--text-dim)',
                }}
              >
                Browse
              </button>
              <button
                onClick={() => setViewMode('grouped')}
                className="px-3 py-2 text-sm font-bold transition-all"
                style={{
                  fontFamily: 'Barlow Condensed, sans-serif',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  background: viewMode === 'grouped' ? 'var(--accent)' : 'var(--surface-2)',
                  color: viewMode === 'grouped' ? '#000' : 'var(--text-dim)',
                }}
              >
                Grouped
              </button>
            </div>
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search exercises..."
            className="input"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
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
    return (
      <div className="text-center py-12">
        <div
          className="text-sm font-bold"
          style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase' }}
        >
          No exercises found
        </div>
      </div>
    );
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
    { label: 'Push', color: 'var(--accent)', items: [...PUSH_EXERCISES.compound, ...PUSH_EXERCISES.isolation], isCompound: true },
    { label: 'Pull', color: 'var(--text-dim)', items: [...PULL_EXERCISES.compound, ...PULL_EXERCISES.isolation], isCompound: true },
    { label: 'Legs', color: 'var(--accent)', items: [...LEG_EXERCISES.compound, ...LEG_EXERCISES.isolation], isCompound: true },
    { label: 'Cardio', color: 'var(--text-dim)', items: [...CARDIO_EXERCISES.machines, ...CARDIO_EXERCISES.hiit], isCardio: true },
    { label: 'Core', color: 'var(--accent)', items: [...CORE_EXERCISES], isCore: true },
  ];

  return (
    <div className="space-y-6">
      {groups.map(group => (
        <div key={group.label}>
          <h3
            className="font-bold text-sm uppercase tracking-widest mb-2"
            style={{ color: group.color, fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}
          >
            {group.label}
          </h3>
          {group.label === 'Cardio' ? (
            <div className="space-y-4">
              {['Machines', 'HIIT / Bodyweight'].map(sub => {
                const subItems = sub === 'Machines' ? group.items.filter(e => e.equipment === 'machine') : group.items.filter(e => e.equipment !== 'machine');
                if (!subItems.length) return null;
                return (
                  <div key={sub}>
                    <h4
                      className="text-[10px] font-bold uppercase tracking-widest mb-2"
                      style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}
                    >
                      {sub}
                    </h4>
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
            <div className="space-y-4">
              {group.isCompound && (
                <>
                  <div>
                    <h4
                      className="text-[10px] font-bold uppercase tracking-widest mb-2"
                      style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}
                    >
                      Compound
                    </h4>
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
                    <h4
                      className="text-[10px] font-bold uppercase tracking-widest mb-2"
                      style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}
                    >
                      Isolation
                    </h4>
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
      className="text-left px-3 py-2.5 transition-all text-sm w-full"
      style={{
        border: `1px solid ${isSelected ? 'var(--accent)' : isDisabled ? 'var(--border)' : 'var(--border)'}`,
        background: isDisabled ? 'var(--surface-3)' : isSelected ? 'rgba(202,255,0,0.08)' : 'var(--surface-2)',
        opacity: isDisabled ? 0.4 : 1,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
      }}
    >
      <div
        className="font-bold text-sm text-white"
        style={{ fontFamily: 'Syne, sans-serif' }}
      >
        {ex.name}
      </div>
      <div
        className="text-xs font-medium mt-0.5 flex items-center gap-1.5 flex-wrap"
        style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif' }}
      >
        <span>{ex.muscleGroup}</span>
        <span style={{ color: 'var(--border)' }}>·</span>
        <span>{ex.equipment}</span>
        <span style={{ color: 'var(--border)' }}>·</span>
        <span style={{ color: ex.difficulty >= 6 ? 'var(--text)' : 'var(--text-dim)' }}>
          {ex.difficulty >= 6 ? 'Compound' : 'Isolation'}
        </span>
      </div>
    </button>
  );
}

function ConfigPanel({ ex, sets, setSets, reps, setReps, weight, setWeight, rest, setRest, unit, onAdd }) {
  const isCardio = ex.unit === 'min';

  return (
    <div
      className="px-6 py-4"
      style={{ borderTop: '1px solid var(--border)', background: 'var(--surface-2)' }}
    >
      <h4
        className="font-bold text-sm text-white mb-3"
        style={{ fontFamily: 'Syne, sans-serif' }}
      >
        Configure: {ex.name}
      </h4>
      <div className="grid grid-cols-5 gap-2 text-sm">
        {isCardio ? (
          <div className="col-span-4">
            <label className="text-[10px] font-bold uppercase tracking-widest block mb-1" style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>Duration (min)</label>
            <input
              type="number"
              value={reps}
              onChange={e => setReps(parseInt(e.target.value) || 0)}
              className="input"
              min="1"
            />
          </div>
        ) : (
          <>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest block mb-1" style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>Sets</label>
              <input type="number" value={sets} onChange={e => setSets(parseInt(e.target.value) || 0)} className="input" min="1" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest block mb-1" style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>Reps</label>
              <input type="number" value={reps} onChange={e => setReps(parseInt(e.target.value) || 0)} className="input" min="1" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest block mb-1" style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>Weight ({unit})</label>
              <input type="number" value={weight} onChange={e => setWeight(parseFloat(e.target.value) || 0)} className="input" min="0" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest block mb-1" style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>Rest (s)</label>
              <input type="number" value={rest} onChange={e => setRest(parseInt(e.target.value) || 0)} className="input" min="0" />
            </div>
          </>
        )}
        <div className="flex items-end">
          <button
            onClick={() => onAdd(ex)}
            className="w-full py-2 font-bold text-sm uppercase tracking-widest transition-all"
            style={{
              background: 'var(--accent)',
              color: '#000',
              fontFamily: 'Barlow Condensed, sans-serif',
              letterSpacing: '0.1em',
            }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}