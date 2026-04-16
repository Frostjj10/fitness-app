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
      [ex.exerciseId]: { sets: ex.sets, reps: ex.reps, targetWeight: ex.targetWeight, restSeconds: ex.restSeconds },
    }));
  }

  function cancelEdit(exerciseId) {
    setEditValuesById(prev => { const n = { ...prev }; delete n[exerciseId]; return n; });
  }

  function saveEdit(exerciseId) {
    const ev = editValuesById[exerciseId];
    if (ev) onUpdateExercise(exerciseId, ev);
    cancelEdit(exerciseId);
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden hover:border-slate-200 transition-colors">
      <div
        className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div>
          <div className="font-bold text-sm text-slate-900">{day.dayOfWeek}</div>
          <div className="text-xs text-slate-400">{formatDate(day.date)}</div>
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">{workout.dayOfWeek}</div>
          <div className="text-xs text-slate-400 mt-0.5">{workout.muscleGroups}</div>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-50">
          <div className="pt-3 space-y-2">
            {workout.exercises.map((ex, i) => {
              const isCardio = ex.unit === 'min';
              return (
              <div key={i} className={`rounded-xl p-3 border transition-all ${isCardio ? 'border-orange-100 bg-orange-50/50' : 'border-slate-100 bg-slate-50/50'}`}>
                {editValuesById[ex.exerciseId] ? (
                  <div className="space-y-2">
                    <div className="font-semibold text-sm text-slate-900">{ex.name}</div>
                    <div className="grid grid-cols-4 gap-2 text-sm">
                      <div>
                        <label className="text-xs text-slate-400 font-medium">Sets</label>
                        <input type="number" value={editValuesById[ex.exerciseId].sets} onChange={e => setEditValuesById(p => ({ ...p, [ex.exerciseId]: { ...p[ex.exerciseId], sets: parseInt(e.target.value) || 0 } }))} className="input text-sm py-1.5" min="1" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 font-medium">Reps</label>
                        <input type="number" value={editValuesById[ex.exerciseId].reps} onChange={e => setEditValuesById(p => ({ ...p, [ex.exerciseId]: { ...p[ex.exerciseId], reps: parseInt(e.target.value) || 0 } }))} className="input text-sm py-1.5" min="1" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 font-medium">Weight</label>
                        <input type="number" value={editValuesById[ex.exerciseId].targetWeight} onChange={e => setEditValuesById(p => ({ ...p, [ex.exerciseId]: { ...p[ex.exerciseId], targetWeight: parseFloat(e.target.value) || 0 } }))} className="input text-sm py-1.5" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 font-medium">Rest</label>
                        <input type="number" value={editValuesById[ex.exerciseId].restSeconds} onChange={e => setEditValuesById(p => ({ ...p, [ex.exerciseId]: { ...p[ex.exerciseId], restSeconds: parseInt(e.target.value) || 0 } }))} className="input text-sm py-1.5" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(ex.exerciseId)} className="px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800">Save</button>
                      <button onClick={() => cancelEdit(ex.exerciseId)} className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-200">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-slate-900">{ex.name}</div>
                      <div className="text-xs text-slate-400">
                        {isCardio ? `${ex.reps} min` : `${ex.sets}×${ex.reps} @ ${ex.targetWeight} · ${ex.restSeconds}s · ${ex.isCompound ? 'Compound' : 'Iso}'}`}
                      </div>
                    </div>
                    <div className="flex gap-1 ml-2">
                      {!isCardio && (
                        <button onClick={() => startEdit(ex)} className="text-xs font-semibold text-slate-500 hover:text-slate-900 px-2 py-1 rounded-lg hover:bg-slate-200 transition-all">Edit</button>
                      )}
                      <button onClick={() => onRemoveExercise(ex.exerciseId)} className="text-xs text-slate-300 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 transition-all">✕</button>
                    </div>
                  </div>
                )}
              </div>
              );
            })}
          </div>
          <button onClick={onAddExercise} className="mt-3 w-full py-2 border-2 border-dashed border-slate-200 text-slate-400 rounded-xl hover:border-slate-300 hover:text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-all">
            + Add Exercise
          </button>
        </div>
      )}
    </div>
  );
}
