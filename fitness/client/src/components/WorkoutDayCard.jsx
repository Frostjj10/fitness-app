import { useState } from 'react';
import { formatDate } from '../utils/format';

export default function WorkoutDayCard({ day, onAddExercise, onRemoveExercise, onUpdateExercise }) {
  const [expanded, setExpanded] = useState(false);
  const [editValuesById, setEditValuesById] = useState({});

  const workout = day.workout;
  if (!workout) return null;

  function startEdit(ex) {
    setEditValuesById(prev => ({
      ...prev,
      [ex.exerciseId]: {
        sets: ex.sets,
        reps: ex.reps,
        targetWeight: ex.targetWeight,
        restSeconds: ex.restSeconds,
      },
    }));
  }

  function cancelEdit(exerciseId) {
    setEditValuesById(prev => {
      const next = { ...prev };
      delete next[exerciseId];
      return next;
    });
  }

  function saveEdit(exerciseId) {
    const editValues = editValuesById[exerciseId];
    if (editValues) {
      onUpdateExercise(exerciseId, editValues);
    }
    cancelEdit(exerciseId);
  }

  function getEditValues(exerciseId) {
    return editValuesById[exerciseId] || {};
  }

  return (
    <div className="card overflow-hidden">
      <div
        className="bg-gradient-to-r from-brand-700 to-brand-600 text-white px-5 py-3 cursor-pointer hover:from-brand-800 hover:to-brand-700 transition-all"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex justify-between items-center">
          <div>
            <div className="font-bold text-sm">{day.dayOfWeek}</div>
            <div className="text-xs text-brand-200 opacity-80">{formatDate(day.date)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-md">{workout.dayOfWeek}</div>
            <div className="text-xs text-brand-200 mt-0.5">{workout.muscleGroups}</div>
          </div>
        </div>
      </div>

      {expanded ? (
        <div className="p-4">
          <div className="space-y-2">
            {workout.exercises.map((ex, i) => {
              const isCardio = ex.unit === 'min';
              return (
              <div key={i} className={`rounded-xl p-3 border transition-all ${isCardio ? 'border-orange-200 bg-orange-50' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}>
                {editValuesById[ex.exerciseId] ? (
                  <div className="space-y-2">
                    <div className="font-semibold text-sm text-slate-900">{ex.name}</div>
                    {isCardio ? (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <label className="text-xs text-slate-500 font-medium">Duration (min)</label>
                          <input
                            type="number"
                            value={getEditValues(ex.exerciseId).reps}
                            onChange={e => setEditValuesById(prev => ({
                              ...prev,
                              [ex.exerciseId]: { ...prev[ex.exerciseId], reps: parseInt(e.target.value) || 0 }
                            }))}
                            className="input text-sm py-2"
                            min="1"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2 text-sm">
                        <div>
                          <label className="text-xs text-slate-500 font-medium">Sets</label>
                          <input
                            type="number"
                            value={getEditValues(ex.exerciseId).sets}
                            onChange={e => setEditValuesById(prev => ({
                              ...prev,
                              [ex.exerciseId]: { ...prev[ex.exerciseId], sets: parseInt(e.target.value) || 0 }
                            }))}
                            className="input text-sm py-2"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 font-medium">Reps</label>
                          <input
                            type="number"
                            value={getEditValues(ex.exerciseId).reps}
                            onChange={e => setEditValuesById(prev => ({
                              ...prev,
                              [ex.exerciseId]: { ...prev[ex.exerciseId], reps: parseInt(e.target.value) || 0 }
                            }))}
                            className="input text-sm py-2"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 font-medium">Weight</label>
                          <input
                            type="number"
                            value={getEditValues(ex.exerciseId).targetWeight}
                            onChange={e => setEditValuesById(prev => ({
                              ...prev,
                              [ex.exerciseId]: { ...prev[ex.exerciseId], targetWeight: parseFloat(e.target.value) || 0 }
                            }))}
                            className="input text-sm py-2"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 font-medium">Rest (s)</label>
                          <input
                            type="number"
                            value={getEditValues(ex.exerciseId).restSeconds}
                            onChange={e => setEditValuesById(prev => ({
                              ...prev,
                              [ex.exerciseId]: { ...prev[ex.exerciseId], restSeconds: parseInt(e.target.value) || 0 }
                            }))}
                            className="input text-sm py-2"
                            min="0"
                          />
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => saveEdit(ex.exerciseId)}
                        className="px-3 py-1.5 bg-brand-600 text-white text-xs font-semibold rounded-lg hover:bg-brand-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => cancelEdit(ex.exerciseId)}
                        className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-slate-900 truncate">{ex.name}</div>
                      <div className="text-xs text-slate-500">
                        {isCardio
                          ? `${ex.reps} min · ${ex.equipment || ''}`
                          : `${ex.sets}×${ex.reps} @ ${ex.targetWeight} · ${ex.restSeconds}s · ${ex.isCompound ? 'Compound' : 'Isolation'}`
                        }
                      </div>
                    </div>
                    <div className="flex gap-1 ml-2">
                      {!isCardio && (
                        <button
                          onClick={() => startEdit(ex)}
                          className="text-brand-600 hover:text-brand-800 text-xs font-semibold px-2 py-1 hover:bg-brand-50 rounded-lg transition-all"
                        >
                          Edit
                        </button>
                      )}
                      <button
                        onClick={() => onRemoveExercise(ex.exerciseId)}
                        className="text-red-400 hover:text-red-700 text-xs px-2 py-1 hover:bg-red-50 rounded-lg transition-all"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>
              );
            })}
          </div>

          <button
            onClick={onAddExercise}
            className="mt-3 w-full py-2 border-2 border-dashed border-slate-300 text-slate-500 rounded-xl hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50 text-sm font-semibold transition-all"
          >
            + Add Exercise
          </button>
        </div>
      ) : (
        <div className="p-4">
          <div className="text-xs font-semibold text-brand-600 mb-2">{workout.muscleGroups}</div>
          <div className="space-y-1">
            {workout.exercises.slice(0, 5).map((ex, i) => (
              <div key={i} className="text-sm text-slate-600 truncate flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
                {ex.name}
              </div>
            ))}
            {workout.exercises.length > 5 && (
              <div className="text-xs text-slate-400 font-medium">+{workout.exercises.length - 5} more</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
