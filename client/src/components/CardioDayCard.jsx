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

  return (
    <div
      className="transition-all"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div
        className="px-5 py-3 flex justify-between items-center cursor-pointer"
        style={{ background: 'var(--surface-2)', borderBottom: expanded ? '1px solid var(--border)' : 'none' }}
        onClick={() => setExpanded(e => !e)}
      >
        <div>
          <div
            className="font-bold text-sm text-white"
            style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase' }}
          >
            {day.dayOfWeek}
          </div>
          <div
            className="text-xs font-medium mt-0.5"
            style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            {formatDate(day.date)}
          </div>
        </div>
        <div className="text-right">
          <div
            className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5"
            style={{ background: 'rgba(202,255,0,0.15)', color: 'var(--accent)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}
          >
            Cardio
          </div>
          <div
            className="text-xs font-medium mt-0.5"
            style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            {workout.exercises.length} exercises
          </div>
        </div>
      </div>

      {expanded ? (
        <div className="p-4">
          <div className="space-y-2">
            {workout.exercises.map((ex, i) => (
              <div
                key={i}
                className="p-3"
                style={{ background: 'var(--surface-2)', border: '1px solid rgba(202,255,0,0.2)' }}
              >
                {editValuesById[ex.exerciseId] ? (
                  <div className="space-y-2">
                    <div
                      className="font-bold text-sm text-white"
                      style={{ fontFamily: 'Syne, sans-serif' }}
                    >
                      {ex.name}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest block mb-1" style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>Duration (min)</label>
                        <input
                          type="number"
                          value={editValuesById[ex.exerciseId].reps}
                          onChange={e => setEditValuesById(p => ({ ...p, [ex.exerciseId]: { ...p[ex.exerciseId], reps: parseInt(e.target.value) || 0 } }))}
                          className="input text-sm py-1.5"
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest block mb-1" style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>Rest (s)</label>
                        <input
                          type="number"
                          value={editValuesById[ex.exerciseId].restSeconds}
                          onChange={e => setEditValuesById(p => ({ ...p, [ex.exerciseId]: { ...p[ex.exerciseId], restSeconds: parseInt(e.target.value) || 0 } }))}
                          className="input text-sm py-1.5"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(ex.exerciseId)}
                        className="px-3 py-1.5 font-bold text-xs transition-all"
                        style={{ background: 'var(--accent)', color: '#000', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase' }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => cancelEdit(ex.exerciseId)}
                        className="px-3 py-1.5 font-bold text-xs transition-all"
                        style={{ background: 'var(--surface-3)', color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{ex.name}</div>
                      <div className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif' }}>{ex.sets} × {ex.reps} {ex.unit}</div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(ex)}
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 transition-all"
                        style={{ color: 'var(--accent)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em', border: '1px solid var(--accent)' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onRemoveExercise(ex.exerciseId)}
                        className="text-lg font-bold transition-all hover:opacity-60"
                        style={{ color: 'var(--border)' }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={onAddExercise}
            className="mt-3 w-full py-2 font-bold text-xs uppercase tracking-widest transition-all"
            style={{
              border: '2px dashed var(--border)',
              color: 'var(--text-dim)',
              background: 'transparent',
              fontFamily: 'Barlow Condensed, sans-serif',
              letterSpacing: '0.1em',
            }}
          >
            + Add Exercise
          </button>
        </div>
      ) : (
        <div className="p-4">
          <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--accent)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}>
            {workout.muscleGroups}
          </div>
          <div className="space-y-1">
            {workout.exercises.slice(0, 3).map((ex, i) => (
              <div
                key={i}
                className="text-sm font-medium truncate flex items-center gap-2"
                style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif' }}
              >
                <div className="w-1.5 h-1.5 shrink-0" style={{ background: 'var(--accent)' }} />
                {ex.name} ({ex.reps} {ex.unit})
              </div>
            ))}
            {workout.exercises.length > 3 && (
              <div
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}
              >
                +{workout.exercises.length - 3} more
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}