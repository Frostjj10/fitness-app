import { useState } from 'react';
import { formatDate } from '../utils/format';

export default function CardioDayCard({ day, onAddExercise, onRemoveExercise, onUpdateExercise }) {
  const [expanded, setExpanded] = useState(false);
  const [editValuesById, setEditValuesById] = useState({});

  const workout = day.workout;
  if (!workout) return null;

  function startEdit(ex) {
    setEditValuesById(prev => ({
      ...prev,
      [ex.exerciseId]: { reps: ex.reps, restSeconds: ex.restSeconds },
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

  function getEditValues(exerciseId) {
    return editValuesById[exerciseId] || {};
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:border-slate-200 transition-colors shadow-sm">
      <div
        className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-5 py-3 cursor-pointer hover:from-orange-600 hover:to-amber-600 transition-all"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex justify-between items-center">
          <div>
            <div className="font-bold text-sm">{day.dayOfWeek}</div>
            <div className="text-xs text-orange-100">{formatDate(day.date)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold bg-white/15 px-2 py-0.5 rounded-md">Cardio</div>
            <div className="text-xs text-orange-100 mt-0.5">{workout.exercises.length} exercises</div>
          </div>
        </div>
      </div>

      {expanded ? (
        <div className="p-4">
          <div className="space-y-2">
            {workout.exercises.map((ex, i) => (
              <div key={i} className="rounded-xl p-3 border border-orange-100 bg-orange-50/50">
                {editValuesById[ex.exerciseId] ? (
                  <div className="space-y-2">
                    <div className="font-semibold text-sm text-slate-900">{ex.name}</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <label className="text-xs text-slate-400 font-medium">Duration ({ex.unit})</label>
                        <input type="number" value={getEditValues(ex.exerciseId).reps} onChange={e => setEditValuesById(p => ({ ...p, [ex.exerciseId]: { ...p[ex.exerciseId], reps: parseInt(e.target.value) || 0 } }))} className="input text-sm py-1.5" min="1" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 font-medium">Rest (s)</label>
                        <input type="number" value={getEditValues(ex.exerciseId).restSeconds} onChange={e => setEditValuesById(p => ({ ...p, [ex.exerciseId]: { ...p[ex.exerciseId], restSeconds: parseInt(e.target.value) || 0 } }))} className="input text-sm py-1.5" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(ex.exerciseId)} className="px-3 py-1.5 bg-orange-500 text-white text-xs font-bold rounded-lg hover:bg-orange-600">Save</button>
                      <button onClick={() => cancelEdit(ex.exerciseId)} className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-200">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm text-slate-900">{ex.name}</div>
                      <div className="text-xs text-slate-400">{ex.sets} × {ex.reps} {ex.unit}</div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(ex)} className="text-xs font-semibold text-orange-500 hover:text-orange-700 px-2 py-1 rounded-lg hover:bg-orange-50 transition-all">Edit</button>
                      <button onClick={() => onRemoveExercise(ex.exerciseId)} className="text-xs text-slate-300 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 transition-all">✕</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <button onClick={onAddExercise} className="mt-3 w-full py-2 border-2 border-dashed border-orange-200 text-orange-400 rounded-xl hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50 text-xs font-semibold transition-all">
            + Add Exercise
          </button>
        </div>
      ) : (
        <div className="p-4">
          <div className="text-xs font-semibold text-orange-500 mb-2">{workout.muscleGroups}</div>
          <div className="space-y-1">
            {workout.exercises.slice(0, 3).map((ex, i) => (
              <div key={i} className="text-sm text-slate-600 truncate flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                {ex.name} ({ex.reps} {ex.unit})
              </div>
            ))}
            {workout.exercises.length > 3 && (
              <div className="text-xs text-slate-300 font-medium">+{workout.exercises.length - 3} more</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
