import { useState } from 'react';
import { formatDate } from '../utils/format';

export default function RestDayCard({ day, onAddExercise, onRemoveExercise }) {
  const [expanded, setExpanded] = useState(false);
  const workout = day.workout;
  const hasCore = workout && workout.exercises?.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:border-slate-200 transition-colors shadow-sm">
      <div
        className="bg-gradient-to-r from-slate-500 to-slate-400 text-white px-5 py-3 cursor-pointer hover:from-slate-600 hover:to-slate-500 transition-all"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex justify-between items-center">
          <div>
            <div className="font-bold text-sm">{day.dayOfWeek}</div>
            <div className="text-xs text-slate-200">{formatDate(day.date)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold bg-white/15 px-2 py-0.5 rounded-md">Rest</div>
            {hasCore && <div className="text-xs text-slate-200 mt-0.5">{workout.exercises.length} core</div>}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{workout ? 'Core Finisher' : 'Recovery'}</p>
          {workout && workout.exercises.length > 0 ? (
            <div className="space-y-2">
              {workout.exercises.map((ex, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div>
                    <div className="font-semibold text-sm text-slate-900">{ex.name}</div>
                    <div className="text-xs text-slate-500">{ex.sets}×{ex.reps} · {ex.restSeconds}s rest</div>
                  </div>
                  <button onClick={() => onRemoveExercise && onRemoveExercise(ex.exerciseId)} className="text-xs text-slate-300 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 transition-all">✕</button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-300 mb-3">No core exercises</p>
          )}
          <button onClick={() => onAddExercise && onAddExercise('core')} className="mt-3 w-full py-2 border-2 border-dashed border-slate-200 text-slate-500 rounded-xl hover:border-slate-300 hover:text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-all">
            + Add Core Exercise
          </button>
        </div>
      )}
    </div>
  );
}
