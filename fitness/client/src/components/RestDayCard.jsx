import { useState } from 'react';
import { formatDate } from '../utils/format';

export default function RestDayCard({ day, onAddExercise, onRemoveExercise }) {
  const [expanded, setExpanded] = useState(false);
  const workout = day.workout;
  const hasCore = workout && workout.exercises?.length > 0;

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
          <div className="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">Rest</div>
          {hasCore && <div className="text-xs text-slate-400 mt-0.5">{workout.exercises.length} core</div>}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-50">
          <div className="pt-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{workout ? 'Core Finisher' : 'Recovery'}</p>
            {workout && workout.exercises.length > 0 ? (
              <div className="space-y-2">
                {workout.exercises.map((ex, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div>
                      <div className="font-semibold text-sm text-slate-900">{ex.name}</div>
                      <div className="text-xs text-slate-400">{ex.sets}×{ex.reps} · {ex.restSeconds}s rest</div>
                    </div>
                    <button onClick={() => onRemoveExercise && onRemoveExercise(ex.exerciseId)} className="text-xs text-slate-300 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 transition-all">✕</button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-300 mb-3">No core exercises</p>
            )}
            <button onClick={() => onAddExercise && onAddExercise('core')} className="mt-3 w-full py-2 border-2 border-dashed border-slate-200 text-slate-400 rounded-xl hover:border-slate-300 hover:text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-all">
              + Add Core Exercise
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
