import { useState, useEffect } from 'react';
import { getExercisePickerData } from '../utils/ppl';

const RPE_LABELS = ['', 'Very Easy', 'Easy', 'Light', 'Moderate', 'Medium', 'Somewhat Hard', 'Hard', 'Very Hard', 'Extremely Hard', 'Max'];

export default function ExercisePicker({ isOpen, onClose, onSelect, currentExerciseIds = [], pplType = 'push', unit = 'lbs' }) {
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' | 'search'
  const [search, setSearch] = useState('');
  const [exercises, setExercises] = useState({ push: {}, pull: {}, legs: {}, all: [] });
  const [selectedEx, setSelectedEx] = useState(null);
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(8);
  const [weight, setWeight] = useState(0);
  const [rest, setRest] = useState(90);

  useEffect(() => {
    if (!isOpen) return;
    const data = getExercisePickerData();
    setExercises(data);
  }, [isOpen]);

  function reset() {
    setSearch('');
    setSelectedEx(null);
    setSets(3);
    setReps(8);
    setWeight(0);
    setRest(90);
    setViewMode('grouped');
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
    // Rough estimate for new exercise
    const bw = 165;
    return Math.round((ex.difficulty / 10) * 0.85 * bw / 5) * 5;
  }

  if (!isOpen) return null;

  const alreadyAdded = new Set(currentExerciseIds);

  const filteredAll = exercises.all?.filter(ex =>
    ex.name.toLowerCase().includes(search.toLowerCase()) ||
    ex.muscleGroup.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const groupedData = viewMode === 'grouped' ? {
    Push: { compound: exercises.push?.compound || [], isolation: exercises.push?.isolation || [] },
    Pull: { compound: exercises.pull?.compound || [], isolation: exercises.pull?.isolation || [] },
    Legs: { compound: exercises.legs?.compound || [], isolation: exercises.legs?.isolation || [] },
    Cardio: { machines: exercises.cardio?.machines || [], hiit: exercises.cardio?.hiit || [] },
    Core: { flat: exercises.core || [] },
  } : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-xl font-bold">Add Exercise</h2>
            <p className="text-sm text-gray-500">Click an exercise to add it to this workout</p>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        {/* Search bar + view toggle */}
        <div className="px-6 py-3 border-b space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search exercises..."
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <div className="flex rounded-lg border overflow-hidden">
              <button
                onClick={() => setViewMode('grouped')}
                className={`px-3 py-2 text-sm ${viewMode === 'grouped' ? 'bg-blue-600 text-white' : 'bg-gray-50 hover:bg-gray-100'}`}
              >
                Grouped
              </button>
              <button
                onClick={() => setViewMode('search')}
                className={`px-3 py-2 text-sm ${viewMode === 'search' ? 'bg-blue-600 text-white' : 'bg-gray-50 hover:bg-gray-100'}`}
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Exercise list */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {viewMode === 'grouped' ? (
            <div className="space-y-6">
              {Object.entries(groupedData).map(([label, groups]) => (
                <div key={label}>
                  {label === 'Cardio' ? (
                    // Cardio: machines + hiit
                    <>
                      <h3 className="font-bold text-lg mb-2 text-orange-600">{label}</h3>
                      <div className="space-y-4">
                        {groups.machines?.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1">Machines</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {groups.machines.map(ex => renderExerciseRow(ex))}
                            </div>
                          </div>
                        )}
                        {groups.hiit?.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1">HIIT / Bodyweight</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {groups.hiit.map(ex => renderExerciseRow(ex))}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : label === 'Core' ? (
                    // Core: flat list
                    <>
                      <h3 className="font-bold text-lg mb-2 text-green-600">{label}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {groups.flat.map(ex => renderExerciseRow(ex))}
                      </div>
                    </>
                  ) : (
                    // Push / Pull / Legs: compound + isolation
                    <>
                      <h3 className="font-bold text-lg mb-2">{label}</h3>
                      <div className="space-y-4">
                        {groups.compound?.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1">Compound</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {groups.compound.map(ex => renderExerciseRow(ex))}
                            </div>
                          </div>
                        )}
                        {groups.isolation?.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1">Isolation</h4>
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
          ) : (
            <div>
              {filteredAll.length === 0 ? (
                <div className="text-center text-gray-400 py-8">No exercises found</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredAll.map(ex => renderExerciseRow(ex))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected exercise config */}
        {selectedEx && (
          <div className="px-6 py-4 border-t bg-gray-50">
            <h4 className="font-medium mb-3">Configure: {selectedEx.name}</h4>
            <div className="grid grid-cols-5 gap-2">
              {selectedEx?.unit === 'min' ? (
                // Cardio: show duration and hide sets/weight/rest
                <div>
                  <label className="text-xs text-gray-500">Duration (min)</label>
                  <input
                    type="number"
                    value={reps}
                    onChange={e => setReps(parseInt(e.target.value) || 0)}
                    className="w-full border rounded px-2 py-1"
                    min="1"
                  />
                </div>
              ) : (
                // Strength: show sets, reps, weight, rest
                <>
                  <div>
                    <label className="text-xs text-gray-500">Sets</label>
                    <input
                      type="number"
                      value={sets}
                      onChange={e => setSets(parseInt(e.target.value) || 0)}
                      className="w-full border rounded px-2 py-1"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Reps</label>
                    <input
                      type="number"
                      value={reps}
                      onChange={e => setReps(parseInt(e.target.value) || 0)}
                      className="w-full border rounded px-2 py-1"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Weight ({unit})</label>
                    <input
                      type="number"
                      value={weight}
                      onChange={e => setWeight(parseFloat(e.target.value) || 0)}
                      className="w-full border rounded px-2 py-1"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Rest (s)</label>
                    <input
                      type="number"
                      value={rest}
                      onChange={e => setRest(parseInt(e.target.value) || 0)}
                      className="w-full border rounded px-2 py-1"
                      min="0"
                    />
                  </div>
                </>
              )}
              <div className="flex items-end">
                <button
                  onClick={() => handleSelect(selectedEx)}
                  className="w-full py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
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
            setReps(20); // default 20 min
            setWeight(0);
            setRest(0);
          } else {
            setSets(3);
            setReps(10);
            setWeight(estimateWeight(ex));
            setRest(60);
          }
        }}
        className={`text-left px-3 py-2 rounded-lg border transition-colors ${
          disabled
            ? 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'
            : selectedEx?.id === ex.id
            ? 'bg-blue-50 border-blue-400'
            : 'hover:bg-gray-50 border-gray-200'
        }`}
      >
        <div className="font-medium text-sm">{ex.name}</div>
        <div className="text-xs text-gray-500 flex gap-2 mt-0.5">
          <span>{ex.muscleGroup}</span>
          <span>·</span>
          <span>{ex.equipment}</span>
          <span>·</span>
          <span>{ex.difficulty >= 6 ? 'Compound' : 'Isolation'}</span>
        </div>
      </button>
    );
  }
}
